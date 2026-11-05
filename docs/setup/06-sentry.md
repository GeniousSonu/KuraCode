# Setup Guide 06: Sentry (Error Tracking & Diagnostics)

*Verified Date: November 2026*

This guide sets up Sentry error tracking for the **Web App** and **Backend API only**.

> [!IMPORTANT]
> **Extension Privacy Policy Invariant:**
> Sentry is NEVER injected into the browser extension bundle. The browser extension operates in 100% offline-first mode without remote telemetry. Diagnostic bundles in the extension can only be exported manually by the user from the Settings page.

---

## 1. Create Sentry Projects

1. Log in to [Sentry.io](https://sentry.io/).
2. Create two separate projects:
   - Project 1: `kuracode-web` (Platform: React / JavaScript)
   - Project 2: `kuracode-api` (Platform: Node.js)
3. For each project, copy the **Client Key (DSN)** from **Settings** -> **Client Keys (DSN)**.
4. Under **Settings** -> **Security & Privacy**:
   - Turn **Data Scrubber** ON.
   - Set **Prevent Storing IP Addresses** to ON.

---

## 2. Automatic Data Scrubbing Rules

KuraCode's `SentryErrorReporter` adapter strips sensitive information prior to dispatch:
- Snippet code blocks are replaced with `[SCRUBBED_CONTENT]`.
- User emails are replaced with `[SCRUBBED_EMAIL]`.
- URL query parameters (`token=`, `code=`, `key=`) are scrubbed.
- Authorization headers and session cookies are dropped.

---

## 3. Environment Variables

Add to `.env.local`:
```bash
# Web App Public DSN (Client safe)
PUBLIC_SENTRY_DSN="https://<public-key>@o<org>.ingest.sentry.io/<project-id>"

# Server-only API DSN & Auth Token (CI/CD source maps)
SENTRY_SERVER_DSN="https://<public-key>@o<org>.ingest.sentry.io/<project-id>"
SENTRY_AUTH_TOKEN="<your-sentry-internal-integration-token>"
```

### Testing the Integration
```bash
pnpm setup:test sentry
```

**Success output:**
```
✔ [PASS] Sentry DSN verified with scrubbed test payload. Capability 'errors.sentry' is now ENABLED.
```

---

## 4. Free-Tier Limits & Rotation

- **Limits:** 5,000 error events per month free on Developer tier.
- **Quota Exceeded Behavior:** Once the quota is reached, Sentry drops events with HTTP 429; KuraCode handles this silently without crashing or degrading user functionality.

