# KuraCode Security Threat Model & Risk Analysis

**Product:** KuraCode | **Standard:** STRIDE & OWASP ASVS Level 2  
**Date:** 2026-11-05 | **Status:** Active

---

## 1. Protected Assets & Trust Boundaries

### 1.1 Assets
1. **User Snippets & Notes:** Intellectual property, code snippets, proprietary algorithms.
2. **Clipboard Content:** Highly sensitive ephemeral text, potential credentials, copied tokens.
3. **Session Credentials:** Access tokens, refresh tokens, WebAuthn credentials, OAuth tokens.
4. **Tenant Data & Workspace Boundaries:** Workspace snippets, member directories, invitation links.
5. **Provenance & Source URLs:** User browsing history, intranet/internal domain addresses.

### 1.2 Trust Boundaries
- **Boundary A: Host Webpage ↔ Content Script.** Web pages are untrusted and potentially malicious.
- **Boundary B: Content Script ↔ Background Worker.** Message-passing boundary via `chrome.runtime.sendMessage`.
- **Boundary C: Client Extension ↔ Cloud API.** Untrusted public network (TLS 1.3 encrypted).
- **Boundary D: Tenant A ↔ Tenant B (Workspace Isolation).** Cross-tenant database partitions.

---

## 2. Threat Actor Profiles

| Actor | Capability | Motivation |
| :--- | :--- | :--- |
| **Malicious Webpage** | Runs arbitrary JavaScript in tab; inspects DOM; attempts window messaging. | Steal clipboard data, exfiltrate extension IDs, spoof capture events. |
| **Network Eavesdropper** | Observes or tampers with public Wi-Fi traffic. | Intercept tokens, eavesdrop on synced snippets. |
| **Malicious Tenant / Insider** | Registered workspace member with Viewer or Editor role. | Escalate privileges, access unshared collections, poison sync feed. |
| **Brute-Force Attacker** | Automated bots scanning public endpoints and quick-share codes. | Guess active share codes, enumerate workspace invites, exhaust API rate limits. |

---

## 3. Threat Scenarios & Mitigations (STRIDE Matrix)

### 3.1 Account Takeover & Token Theft
- **Threat:** Stolen OAuth authorization codes or exfiltrated refresh tokens used to hijack account.
- **Mitigation:**
  - Mandatory PKCE (`code_challenge_method=S256`) and state/nonce validation for all OAuth flows.
  - Refresh tokens stored only in background worker storage (never exposed to DOM or content scripts).
  - Refresh token family rotation: presenting an invalidated token immediately revokes all sessions in that family.

### 3.2 Malicious Webpage Reading Clipboard Data
- **Threat:** A hostile site triggers extension APIs or exploits content scripts to read Clipboard Hub items.
- **Mitigation:**
  - Content scripts have zero read access to Clipboard Hub storage or background token state.
  - Closed Shadow DOM (`attachShadow({ mode: "closed" })`) for all injected UI controls.
  - Extension never auto-pastes or exposes clipboard contents to webpage DOM without explicit user gesture.

### 3.3 Sync Poisoning & Malicious Payloads
- **Threat:** Attacker pushes forged mutations or malformed payloads to corrupt peer devices.
- **Mitigation:**
  - Server validates schema and enforces strict payload size limits (< 1 MB per snippet).
  - Client validates and sanitizes all incoming sync items.
  - Hybrid Logical Clocks prevent time-travel tampering and out-of-order replay attacks.

### 3.4 Cross-Site Scripting (XSS) in Synced Content
- **Threat:** Synced snippet title, note, or code payload contains `<script>` or event-handler XSS injections.
- **Mitigation:**
  - **Zero innerHTML:** All UI components in `@kuracode/ui` and extension render text via `textContent` or escaped React elements.
  - Strict Content Security Policy (CSP): `script-src 'self'`. Disallows `unsafe-inline` and `eval`.

### 3.5 Quick-Share Code Guessing & Enumeration Attacks
- **Threat:** Automated bot rapidly guesses 4-digit codes to access private snippets.
- **Mitigation:**
  - Strict IP rate limiting: maximum 5 failed attempts per IP per 10 minutes; exponential backoff.
  - Constant-time verification (`crypto.timingSafeEqual`) prevents timing side-channels.
  - Generic uniform error messages ("Invalid or expired code") to prevent state enumeration.
  - Automatic expansion to 6 digits if active pool exceeds 5,000 codes.

### 3.6 Cross-Workspace Data Leaks & Role Escalation
- **Threat:** An Editor in Workspace A queries or mutates snippets belonging to Workspace B.
- **Mitigation:**
  - Enforced at database layer using PostgreSQL Row-Level Security (RLS).
  - Every API route validates `workspace_id` against the authenticated user's verified membership record.
  - Role escalation attempts (e.g. changing role from Viewer to Admin) rejected by database trigger.

### 3.7 URL & Internal Secret Leakage
- **Threat:** Snippets captured on intranet pages reveal internal IPs, VPN tokens, or private tokens in query params.
- **Mitigation:**
  - Automated regex stripping of internal IP ranges (`10.0.0.0/8`, `192.168.0.0/16`, `127.0.0.1`, `localhost`).
  - Common auth query parameters (`token`, `access_token`, `auth`, `api_key`) stripped automatically.
  - Integrated Secret Scanner blocks syncing if credentials are found in captured text.

### 3.8 Private Browsing & Data Retention
- **Threat:** Captures from Incognito / Private browsing windows persist to disk or sync to cloud.
- **Mitigation:**
  - Extension detects private context (`chrome.extension.inIncognitoContext`) and refuses capture with explicit notification.
  - Complies with Mozilla Firefox Policy 6.3: zero storage or sync of private browsing data.

