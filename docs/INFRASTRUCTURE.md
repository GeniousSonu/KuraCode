# KuraCode Infrastructure & Free-Tier Operational Blueprint

This document defines the production hosting, database, authentication, real-time sync, and edge deployment stack for KuraCode. All services are selected for zero lock-in, portable standards (PostgreSQL, OIDC, WebSockets), and high-capacity free-tier quotas suitable for early operation.

*Verified Date: November 2026*

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |       Cloudflare Edge       |
                      |   DNS + Pages + Turnstile   |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
       [ Web App / PWA ]                         [ Backend API ]
       Cloudflare Pages                          Cloudflare Workers /
       SSR / Static React                        Node Edge Container
               |                                           |
               +---------------------+---------------------+
                                     |
                      +--------------+--------------+
                      |       Supabase Cloud        |
                      |  PostgreSQL 16 + RLS + Auth |
                      |    Realtime WebSocket Feed  |
                      +-----------------------------+
```

---

## 2. Infrastructure Stack & Verified Free-Tier Quotas

### 2.1 Cloudflare (DNS, Web App Hosting & Edge Protection)
- **Role:** Web application hosting (React SPA / PWA), DNS management, SSL termination, and Turnstile bot protection for public quick-share code claims.
- **Verified Free-Tier Limits (Nov 2026):**
  - **Cloudflare Pages:** Unlimited requests, 500 builds per month, 100 custom domains, unlimited bandwidth.
  - **Cloudflare Turnstile:** 1,000,000 challenge evaluations per month free.
  - **Cloudflare Workers (Edge API):** 100,000 requests per day, 10ms CPU time per request.
- **Limit Behavior:** Soft throttle with notification; Turnstile responds with 429 if rate limits exceeded.
- **Upgrade Path:** Cloudflare Workers Paid (\$5/month for 10M requests).
- **Environment Variables:**
  - `CF_PAGES_PROJECT_NAME`
  - `CF_TURNSTILE_SITE_KEY`
  - `CF_TURNSTILE_SECRET_KEY`

---

### 2.2 Supabase (Database, Auth & Realtime Sync)
- **Role:** Managed PostgreSQL 16 database with Row-Level Security (RLS) for tenant isolation, OAuth 2.0 / PKCE authentication, and WebSocket-based Realtime synchronization for workspaces.
- **Verified Free-Tier Limits (Nov 2026):**
  - **Database Storage:** 500 MB PostgreSQL database.
  - **Bandwidth:** 5 GB egress per month.
  - **Auth Users:** 50,000 Monthly Active Users (MAUs).
  - **Realtime Connections:** 200 concurrent WebSocket connections, 2,000,000 realtime messages per month.
  - **Edge Functions:** 500,000 invocations per month.
- **Tenant Isolation Invariant:**
  - Database schema enforces strict Postgres Row-Level Security (RLS):
    ```sql
    CREATE POLICY workspace_isolation ON snippets
      FOR ALL
      USING (
        workspace_id IS NULL OR 
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
      );
    ```
- **Limit Behavior:** Projects pause after 7 days of inactivity (prevented via automated nightly ping workflow); excess usage soft-capped.
- **Upgrade Path:** Supabase Pro (\$25/month for 8GB database, 250GB bandwidth, 100k MAUs).
- **Environment Variables:**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never bundled in extension or client app)

---

### 2.3 Resend / Postmark (Transactional Emails & Workspace Invites)
- **Role:** Sending workspace invitation emails and login magic links.
- **Verified Free-Tier Limits (Nov 2026):**
  - **Resend:** 3,000 emails per month (100 emails per day), 1 custom domain.
- **Limit Behavior:** Additional emails queued or rejected until daily/monthly reset.
- **Upgrade Path:** Resend Pro (\$20/month for 50,000 emails).
- **Environment Variables:**
  - `RESEND_API_KEY`
  - `EMAIL_FROM_ADDRESS` (`notifications@kuracode.app`)

---

### 2.4 Upstash Redis (Rate Limiting & Quick-Code Ephemeral Cache)
- **Role:** Atomic rate limiting and 15-minute TTL storage for 4-digit quick-share codes.
- **Verified Free-Tier Limits (Nov 2026):**
  - **Commands:** 10,000 commands per day.
  - **Storage:** 256 MB in-memory storage.
- **Limit Behavior:** Commands throttled with `ERR Max daily request limit reached`.
- **Upgrade Path:** Upstash Pay-as-you-go (\$0.20 per 100k commands).
- **Environment Variables:**
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

---

### 2.5 GitHub Actions (CI/CD Quality Gates & Release Packaging)
- **Role:** Automated PR verification, nightly cross-browser testing, SBOM generation, and store release artifact builds.
- **Verified Limits:** 2,000 free minutes per month for private repositories; unlimited for public.

---

## 4. Fallback Behavior & Graceful Degradation Matrix

KuraCode guarantees uninterrupted core functionality even when external cloud services are unconfigured, offline, or at their free-tier limits:

| Service / Capability | Missing or Quota Reached State | Active Fallback Strategy | User-Facing Message in UI / API |
| :--- | :--- | :--- | :--- |
| **Supabase (`db.cloud`)** | Missing keys / 500MB DB full | Switches to browser local storage / IndexedDB with full JSON export | *"Cloud sync unavailable. Operating in local-only offline mode; all snippets are saved securely on this device."* |
| **Realtime (`realtime`)** | 200 concurrent connections reached | Durable mutation outbox queue with exponential backoff polling | *"Live sync paused. Local changes are queued and will sync when connection restores."* |
| **Upstash Redis (`ratelimit.redis`)** | 10k daily command limit reached | In-memory sliding window or PostgreSQL counter table | *"Rate limit operational (local fallback active). System functioning normally."* |
| **Resend (`email.send`)** | 100 emails/day limit reached | Direct invitation link copying (no email dispatched) | *"Email delivery reached daily quota. An invite link has been generated for you to copy directly."* |
| **Magic Links (`auth.magiclink`)** | Resend unavailable | Disabled; prompts user to sign in with OAuth or use offline mode | *"Magic link sign-in unavailable. Please use GitHub or Google sign-in, or continue offline."* |
| **Cloudflare Turnstile (`captcha`)** | 1M challenge quota reached | Strict IP rate limiting and exponential lockout | *"Security verification operating in strict rate-limiting mode."* |
| **Sentry (`errors.sentry`)** | 5,000 monthly errors reached | Local structured logging; exportable diagnostic bundle from Settings | *"Error reporting running locally. Diagnostic bundle available in Settings."* |
| **UptimeRobot (`uptime.status`)** | Unconfigured | Internal `/healthz` and `/readyz` HTTP liveness probes | *"Status reported via internal health endpoints."* |
| **Store APIs (`store.*`)** | API credentials absent in CI | Dry-run validation only; produces validated signed release archives | *"[DRY_RUN] Artifacts packaged cleanly for manual store upload."* |


1. **Zero Repository Secrets:** No real tokens, private keys, or API keys are ever committed to git.
2. **Local Dry-Run Support:** When running without cloud secrets, the application automatically uses local-first mode:
   - Snippets are stored in `chrome.storage.local`
   - Workspace isolation is enforced via the client-side `WorkspaceManager`
   - Quick-share codes use deterministic local stubs
3. **Emergency Disconnect:** Setting repository variable `RELEASE_FROZEN="true"` in GitHub halts all release and store publish workflows instantly.

