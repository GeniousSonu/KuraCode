# Human Action Required (Owner Tasks — Recommended Setup Order)

*Updated: November 2026*

This document tracks items that require human owner intervention, official developer portal accounts, credit card payment, or private API credentials. The codebase is **credential-ready**; you can connect services one by one at your own pace without changing code.

Whenever you add environment variables for a service in `.env.local` or GitHub Actions Secrets, its corresponding feature automatically activates.

---

## Recommended Step-by-Step Order

### Step 1: GitHub Repository, Branch Protection & Environments
- **Where to click:** [GitHub Repository > Settings](https://github.com/GeniousSonu/KuraCode/settings).
- **Actions:**
  1. Under **General > Pull Requests**: Enable `Allow auto-merge` and `Automatically delete head branches`.
  2. Under **Branches**: Add protection rule for `main` requiring PR review, linear history, and required check `ci / quality-gate`.
  3. Under **Environments**: Create 3 environments (`chrome-web-store`, `edge-addons`, `firefox-amo`) with required reviewer.
  4. Under **Secrets and variables > Actions > Variables**: Add `RELEASE_FROZEN` = `false`.
- **Guide:** [docs/setup/01-github.md](../setup/01-github.md)
- **Command to verify:** `pnpm setup:status`

---

### Step 2: Cloudflare Domain/DNS, Pages & Turnstile
- **Where to click:** [Cloudflare Dashboard](https://dash.cloudflare.com/).
- **Actions:**
  1. Add domain `genioussonu.me` and configure SSL to `Full (strict)`.
  2. Under **Workers & Pages > Pages**: Connect `GeniousSonu/KuraCode` (root: `packages/web`, build: `pnpm --filter @kuracode/web build`, output: `dist`).
  3. Under **Turnstile**: Add site `KuraCode`, copy Site Key and Secret Key.
- **Where to paste:** Add `PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` into `.env.local`.
- **Guide:** [docs/setup/03-cloudflare.md](../setup/03-cloudflare.md)
- **Command to verify:** `pnpm setup:test cloudflare`

---

### Step 3: Supabase Cloud Database, RLS & Realtime
- **Where to click:** [Supabase Dashboard](https://supabase.com/dashboard).
- **Actions:**
  1. Create project `KuraCode` in your preferred region.
  2. Go to **SQL Editor** and run `supabase/migrations/20261105000001_initial_schema.sql` and `20261105000002_rls_policies.sql`.
  3. Under **Authentication > URL Configuration**: Add redirect URLs (`https://www.genioussonu.me/extensions/kuracode/auth/callback`, `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`).
  4. Under **Database > Replication**: Enable replication for `snippets`, `workspaces`, `clipboard_items`.
- **Where to paste:** Copy Project URL and `anon` key to `.env.local` as `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. (Keep `service_role` in server only).
- **Guide:** [docs/setup/04-supabase.md](../setup/04-supabase.md)
- **Command to verify:** `pnpm setup:test supabase`

---

### Step 4: GitHub OAuth Application (Sign-In with GitHub)
- **Where to click:** [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers).
- **Actions:**
  1. Click **New OAuth App** (Name: `KuraCode`, Homepage: `https://www.genioussonu.me/extensions/kuracode`).
  2. Callback URL: `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`.
  3. Generate client secret.
- **Where to paste:** Add `PUBLIC_GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `.env.local`.
- **Guide:** [docs/setup/01-github.md](../setup/01-github.md)
- **Command to verify:** `pnpm setup:test github`

---

### Step 5: Google Cloud Console (Sign-In with Google)
- **Where to click:** [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
- **Actions:**
  1. Configure OAuth consent screen (External, App Name: `KuraCode`, Scopes: `openid, email, profile`).
  2. Create OAuth Client ID (Web Application, Authorized redirect URI: `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`).
- **Where to paste:** Add `PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`.
- **Guide:** [docs/setup/02-google-cloud.md](../setup/02-google-cloud.md)
- **Command to verify:** `pnpm setup:test google`

---

### Step 6: Resend (Transactional Email)
- **Where to click:** [Resend Dashboard](https://resend.com/).
- **Actions:**
  1. Add domain `kuracode.app` (or custom verified domain) and add DNS records in Cloudflare.
  2. Generate API key.
- **Where to paste:** Add `RESEND_API_KEY` to `.env.local`.
- **Guide:** [docs/setup/05-resend.md](../setup/05-resend.md)
- **Command to verify:** `pnpm setup:test resend`

---

### Step 7: Cloudflare Turnstile Verification
- Covered in Step 2. Verify with: `pnpm setup:test cloudflare`

---

### Step 8: Upstash Redis (Optional Rate Limiting Cache)
- **Where to click:** [Upstash Console](https://console.upstash.com/).
- **Actions:** Create regional database `kuracode-ratelimit`, copy REST URL and token.
- **Where to paste:** Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`.
- **Guide:** [docs/setup/07-upstash-redis.md](../setup/07-upstash-redis.md)
- **Command to verify:** `pnpm setup:test upstash`

---

### Step 9: Sentry Error Reporting (Optional)
- **Where to click:** [Sentry.io](https://sentry.io/).
- **Actions:** Create project `kuracode-web`, copy DSN.
- **Where to paste:** Add `PUBLIC_SENTRY_DSN` to `.env.local`.
- **Guide:** [docs/setup/06-sentry.md](../setup/06-sentry.md)
- **Command to verify:** `pnpm setup:test sentry`

---

### Step 10: UptimeRobot Heartbeat & Status Page
- **Where to click:** [UptimeRobot](https://uptimerobot.com/).
- **Actions:** Add HTTP monitors for `/healthz` and `/readyz`, create Heartbeat monitor.
- **Where to paste:** Add `UPTIMEROBOT_HEARTBEAT_URL` to `.env.local`.
- **Guide:** [docs/setup/08-uptimerobot.md](../setup/08-uptimerobot.md)
- **Command to verify:** `pnpm setup:test uptimerobot`

---

### Step 11: GitLab & Microsoft Azure Entra (Optional)
- **Guide:** [docs/setup/09-gitlab-microsoft.md](../setup/09-gitlab-microsoft.md)
- **Commands to verify:** `pnpm setup:test gitlab` and `pnpm setup:test microsoft`

---

### Step 12: Extension Store Accounts & Automated Publishing
- **Guide:** [docs/setup/10-stores.md](../setup/10-stores.md)
- Initial release packages are ready in `release/`:
  - `release/kuracode-chrome-0.1.0.zip`
  - `release/kuracode-edge-0.1.0.zip`
  - `release/kuracode-firefox-0.1.0.zip`
- Upload initial version manually to each store.
- Add store API keys into GitHub Environments (`chrome-web-store`, `edge-addons`, `firefox-amo`) via `pnpm secrets:gh`.
- **Commands to verify:** `pnpm setup:test chrome`, `pnpm setup:test edge`, `pnpm setup:test firefox`
