# Setup Guide 07: Upstash Redis (Rate Limiting & Temporary Cache)

*Verified Date: November 2026*

This guide sets up Upstash Serverless Redis for distributed rate limiting and 15-minute TTL temporary quick-share codes.

> [!NOTE]
> **Optional Service:** Upstash is optional. If unconfigured or quota-exhausted, KuraCode automatically falls back to in-memory sliding windows in development and PostgreSQL tables in production.

---

## 1. Create Serverless Redis Database

1. Sign in to [Upstash Console](https://console.upstash.com/).
2. Click **Create Database**:
   - **Name:** `kuracode-ratelimit`
   - **Type:** Regional
   - **Region:** Match your Supabase database region (e.g., `us-east-1` or `eu-central-1`).
   - **Eviction Policy:** Select **volatile-lru** (automatically evicts expired temporary keys).
3. Click **Create**.
4. In the database details section, scroll down to **REST API**:
   - Copy `UPSTASH_REDIS_REST_URL`.
   - Copy `UPSTASH_REDIS_REST_TOKEN`.

---

## 2. Key Privacy & TTL Policy

To protect user data and stay well within free-tier storage limits:
- **Rate Limit Keys:** `ratelimit:<ip_hash_or_userId>` (TTL: 60 seconds).
- **Quick-Share Codes:** `share:<4-digit-code>` (TTL: 900 seconds / 15 minutes).
- **Snippet Content:** **NEVER stored in Redis.** Redis stores only metadata references (`{ snippetId, expiresAt }`). The actual encrypted snippet code remains in PostgreSQL protected by RLS.

---

## 3. Environment Variables

Add to `.env.local`:
```bash
UPSTASH_REDIS_REST_URL="https://<your-db>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<your-token>"
```

### Testing the Integration
```bash
pnpm setup:test upstash
```

**Success output:**
```
✔ [PASS] Upstash Redis REST API connected (PING -> PONG). Capability 'ratelimit.redis' is now ENABLED.
```

---

## 4. Free-Tier Limits & Rotation

- **Limits:** 10,000 commands per day, 256 MB data storage free.
- **Quota Exceeded Behavior:** Returns `ERR Max daily request limit reached`; KuraCode's circuit breaker opens and falls back to in-memory rate limiting with zero downtime.
- **Rotation:** In Upstash console, click **Data Browser** -> **REST API** -> **Rotate Token**.

