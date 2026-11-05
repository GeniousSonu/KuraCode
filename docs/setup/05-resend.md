# Setup Guide 05: Resend (Transactional Email)

*Verified Date: November 2026*

This guide sets up Resend to send transactional emails: workspace team invitations, sign-in magic links, new device sign-in alerts, and notifications.

---

## 1. Create Resend Account & API Key

1. Sign up or log in at [Resend](https://resend.com).
2. Go to **API Keys** -> **Create API Key**:
   - **Name:** `KuraCode Production`
   - **Permission:** `Full Access` (or Sending access restricted to domain)
3. Copy your API Key (starts with `re_...`).

---

## 2. Add Domain & Configure DNS Records

To ensure high deliverability and avoid spam filters:
1. Go to **Domains** -> **Add Domain**:
   - Enter `kuracode.app` (or your domain e.g. `mail.genioussonu.me`).
2. Add the generated DNS records into Cloudflare DNS:

| Type | Name | Content / Value | Priority / TTL |
| :--- | :--- | :--- | :--- |
| **MX** | `feedback` | `feedback-smtp.resend.com` | Priority 10 |
| **TXT** | `resend._domainkey` | `<dkim-key-provided-by-resend>` | Auto |
| **TXT** | `@` or subdomain | `v=spf1 include:amazonses.com ~all` | Auto |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@genioussonu.me` | Auto |

3. Click **Verify Records** in Resend (usually verifies in under 2 minutes with Cloudflare).

---

## 3. Transactional Email Templates

KuraCode includes built-in HTML/text templates for:
- **Workspace Invitation:** Direct 6-digit invite code (`KURA-9281`) and one-click join link.
- **Magic Link:** Single-use login token expiring in 15 minutes.
- **New Device Alert:** Security notice with device name, IP hash, and instant session revocation button.

---

## 4. Environment Variables

Add to `.env.local`:
```bash
RESEND_API_KEY="re_1234567890abcdef..."
EMAIL_FROM_ADDRESS="notifications@kuracode.app" # or your verified domain
```

### Testing the Integration
```bash
pnpm setup:test resend
```

**Success output:**
```
✔ [PASS] Resend API connected and domain verified. Capability 'email.send' is now ENABLED.
```

---

## 5. Free-Tier Limits & Fallback Strategy

- **Limits:** 3,000 emails per month, 100 emails per day on the free tier.
- **Graceful Fallback:** If Resend is not configured or exceeds its daily quota, KuraCode automatically switches to `DEGRADED` mode:
  - Workspace invitations switch to **direct invite link copying** (no email required).
  - In local development, the built-in **Local Mail Catcher** (`/api/mail/inbox`) captures all emails in memory.

