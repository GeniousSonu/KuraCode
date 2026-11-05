# KuraCode Service Setup & Integration Guide

Welcome to the KuraCode External Service Integration Guide. KuraCode is built **credential-ready**: the codebase runs 100% offline out-of-the-box (Zero-Account mode), and you can connect external cloud services one by one at your own pace without changing code.

Whenever you add environment variables for a service in `.env.local` or GitHub Actions Secrets, its corresponding feature automatically activates.

---

## 1. Quick Verification Commands

Check the current state of all 16 capabilities anytime:
```bash
# Print current capability table and missing variables
pnpm setup:status

# Scaffold a local .env.local file from .env.example
pnpm setup:env

# Test connectivity and permissions for a specific service
pnpm setup:test <service-name>
# Examples:
# pnpm setup:test github
# pnpm setup:test supabase
# pnpm setup:test resend
```

---

## 2. Recommended Setup Order

Follow these guides in the numbered order below:

| Step | Service | What It Enables | Priority | Setup Guide |
| :---: | :--- | :--- | :---: | :--- |
| **01** | **GitHub** | Repository branch protection, CI/CD, Releases & GitHub Sign-In | P0 | [01-github.md](./setup/01-github.md) |
| **02** | **Google Cloud** | Google Sign-In with OAuth 2.0 / OIDC consent screen | P0 | [02-google-cloud.md](./setup/02-google-cloud.md) |
| **03** | **Cloudflare** | DNS for `genioussonu.me`, Pages hosting, Turnstile bot protection | P0 | [03-cloudflare.md](./setup/03-cloudflare.md) |
| **04** | **Supabase** | PostgreSQL 16 database, RLS multi-tenancy, Realtime WebSocket sync | P0 | [04-supabase.md](./setup/04-supabase.md) |
| **05** | **Resend** | Transactional emails (workspace invites, security alerts, magic links) | P1 | [05-resend.md](./setup/05-resend.md) |
| **06** | **Sentry** | Error tracking for Web App and Edge API with PII scrubbing | P1 | [06-sentry.md](./setup/06-sentry.md) |
| **07** | **Upstash Redis** | Distributed rate limiting & temporary share code cache | P1 | [07-upstash-redis.md](./setup/07-upstash-redis.md) |
| **08** | **UptimeRobot** | External uptime monitoring, health checks & public status page | P1 | [08-uptimerobot.md](./setup/08-uptimerobot.md) |
| **09** | **GitLab & Microsoft** | Optional alternative OAuth identity providers | P2 | [09-gitlab-microsoft.md](./setup/09-gitlab-microsoft.md) |
| **10** | **App Stores** | Automated release publishing to Chrome Web Store, Edge, and AMO | P1 | [10-stores.md](./setup/10-stores.md) |
| **11** | **Secret Hygiene** | Rotation policies, password managers, and leak mitigation | **CRITICAL** | [11-secret-hygiene.md](./setup/11-secret-hygiene.md) |

---

## 3. Redirect URIs Reference

For all OAuth identity providers and callbacks, refer to the single source of truth:
👉 [docs/setup/redirect-uris.md](./setup/redirect-uris.md)

