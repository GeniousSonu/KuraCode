# Setup Guide 11: Secret Hygiene, Key Management & Leak Mitigation

*Verified Date: November 2026*

This operational security guide defines the protocols for handling secrets across development, testing, and production.

---

## 1. Core Security Invariants

1. **Never Commit Secrets:**
   - `.env.local`, `.env.*` (except `.env.example`), private keys (`*.pem`, `*.key`), and credentials must remain strictly untracked.
   - Husky pre-commit hooks and `scripts/ship.sh` enforce automated scanning to block commits containing high-entropy tokens or private keys.
2. **Never Expose Secrets in Client Bundles:**
   - Client applications (Chrome extension, web bundle) may ONLY consume `PUBLIC_*` variables.
   - Service-role keys, OAuth client secrets, and Redis tokens are strictly server-side.
3. **Never Echo Secrets in Tooling:**
   - Diagnostic tools (`pnpm setup:status`, `pnpm doctor`) report missing or malformed keys by variable name only; they never print values.

---

## 2. Password Manager & Credential Storage

- Use a reputable password manager (e.g. 1Password, Bitwarden) for all master accounts.
- Store database master passwords, OAuth client secrets, and recovery codes in encrypted vaults.
- Enable hardware security key (FIDO2 / WebAuthn) or time-based 2FA (TOTP) on:
  - GitHub
  - Google Cloud Console
  - Cloudflare
  - Supabase
  - Mozilla AMO & Chrome Web Store

---

## 3. Least-Privilege Scope Matrix

Always request the narrowest possible permission when generating keys:
- **GitHub OAuth:** `read:user`, `user:email` only.
- **Google Cloud:** `openid`, `email`, `profile` only.
- **Resend:** Restrict sending permissions to domain `kuracode.app`.
- **Supabase:** Web client uses `anon` public key only; server edge uses `service_role` key strictly behind protected API routes.

---

## 4. Emergency Leak Response Protocol

If a secret is accidentally committed, shared in chat, or suspected compromised:

```
[1. REVOKE] -> Immediately revoke the compromised key in the vendor dashboard.
[2. ROTATE] -> Generate a new key and update GitHub Actions Secrets / .env.local.
[3. PURGE]  -> If committed to git history, use `git filter-repo` or BFG to purge commit history.
[4. AUDIT]  -> Check vendor audit logs (Supabase, Resend, GCP) for unauthorized operations.
[5. FREEZE] -> Set repository variable `RELEASE_FROZEN="true"` to halt deployments.
```

