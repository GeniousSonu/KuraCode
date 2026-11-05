# Setup Guide 03: Cloudflare (DNS, Pages Hosting & Turnstile)

*Verified Date: November 2026*

This guide sets up Cloudflare for DNS management on `genioussonu.me`, Cloudflare Pages web app hosting, and Cloudflare Turnstile bot protection for anonymous snippet sharing.

---

## 1. Domain & DNS Configuration

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select your domain `genioussonu.me` (or click **Add a Site** and follow nameserver migration).
3. Under **SSL/TLS**:
   - Set encryption mode to **Full (strict)**.
   - Under **Edge Certificates**, enable **Always Use HTTPS** and **Minimum TLS Version: TLS 1.2**.
4. Under **Security** -> **WAF** -> **Rate limiting rules**:
   - Create a rate-limiting rule for API code claims: 10 requests per minute per IP on path `/api/share/*`.

---

## 2. Cloudflare Pages Setup (Web App Hosting)

1. Navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select repository `GeniousSonu/KuraCode`.
3. Set build configuration:
   - **Framework preset:** `Vite`
   - **Root directory:** `packages/web`
   - **Build command:** `pnpm --filter @kuracode/web build`
   - **Build output directory:** `dist`
4. Under **Environment variables**, define:
   - `NODE_VERSION`: `22`
   - `PNPM_VERSION`: `12.16.1`
   - `VITE_PUBLIC_APP_URL`: `https://www.genioussonu.me/extensions/kuracode`
5. Click **Save and Deploy**.
6. Under **Custom domains**, add `genioussonu.me` with routing to `/extensions/kuracode`.

---

## 3. Cloudflare Turnstile Setup (Bot Protection)

Cloudflare Turnstile provides privacy-preserving CAPTCHA without interactive puzzle friction.

1. In the Cloudflare sidebar, click **Turnstile** -> **Add Site**.
2. Fill out details:
   - **Site name:** `KuraCode Quick-Share Protection`
   - **Domain:** `genioussonu.me`, `localhost` (allows local testing)
   - **Widget Mode:** Select **Managed** (recommended) or **Non-interactive**.
3. Click **Create**.
4. Copy the **Site Key** (Public) and **Secret Key** (Server-only).

---

## 4. Environment Variables

Add to `.env.local`:
```bash
PUBLIC_TURNSTILE_SITE_KEY="<your-turnstile-site-key>"
TURNSTILE_SECRET_KEY="<your-turnstile-secret-key>"
```

### Testing the Integration
```bash
pnpm setup:test cloudflare
```

**Success output:**
```
✔ [PASS] Cloudflare Turnstile keys verified. Capability 'captcha' is now ENABLED.
```

---

## 5. Free-Tier Limits & Rotation

- **Cloudflare Pages:** Unlimited requests, 500 builds/month free.
- **Turnstile:** 1,000,000 challenge evaluations per month free.
- **Web Analytics:** Free, cookie-less, privacy-compliant page view metrics (enabled for website only; never inside the browser extension).
- **Rotation:** In Turnstile dashboard, click **Manage site** -> **Rotate secret key**.

