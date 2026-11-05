# Store Policy Self-Audit & Compliance Matrix

This document provides a comprehensive policy self-audit verifying that KuraCode complies with all major browser extension store guidelines: **Chrome Web Store**, **Microsoft Edge Add-ons**, and **Mozilla Firefox Add-ons (AMO)**.

---

## 1. Single Purpose Policy
- **Requirement:** Extension must have a single, clear, easily understandable purpose.
- **KuraCode Purpose:** Capturing, cleaning, formatting, organizing, and syncing code snippets from web pages.
- **Compliance Status:** **COMPLIANT**
  - All extension surfaces (content script inline Save button, keyboard shortcut, right-click context menu, compact popup, sidepanel library, and quick share) serve this single purpose exclusively.

---

## 2. Minimal Permissions Policy
- **Requirement:** Request only the minimum necessary permissions required to implement features.
- **Compliance Status:** **COMPLIANT**
  - `activeTab`: Used instead of broad persistent tab monitoring. Captures code context only when explicitly invoked by user action.
  - `contextMenus`: Used only for snippet capture entry point via right-click menu.
  - `clipboardWrite`: Used only when the user explicitly clicks the primary "Copy" snippet button or quick-code copy.
  - `clipboardRead` *(Optional)*: Dynamically requested only when the user explicitly enables "Clipboard Hub - Send to my devices". Never requested at installation.
  - `storage` & `unlimitedStorage`: Used solely for local snippet and preference persistence in IndexedDB.
  - `identity`: Uses browser-native OAuth 2.0 PKCE flow (`chrome.identity.launchWebAuthFlow` / `browser.identity.launchWebAuthFlow`) to authenticate without exposing credentials to page scripts.
  - `<all_urls>` / Content Script Matching: Limited strictly to injecting the scoped shadow-DOM Save button on `<pre>` elements without altering host DOM styles.

---

## 3. Prohibition of Remote Code Execution (MV3 & AMO)
- **Requirement:** All code executed by the extension must be packaged inside the archive; no `eval()`, `new Function()`, or dynamic external script loading.
- **Compliance Status:** **COMPLIANT**
  - Build script bundles all TypeScript into local IIFEs (`background.js`, `content.js`, `popup.js`, `sidepanel.js`).
  - Zero CDN imports, script tags with remote `src`, or WebSocket dynamic payloads.
  - Automated release gate checks for forbidden `eval()` expressions and fails builds if detected.
  - CSP strictly enforces: `script-src 'self'; object-src 'self'`.

---

## 4. User Privacy, Consent & Data Transparency
- **Requirement:** Clear disclosures regarding what data is collected and how it is processed.
- **Compliance Status:** **COMPLIANT**
  - **Zero Telemetry:** No analytics SDKs (Google Analytics, Sentry, Mixpanel, etc.) are embedded.
  - **Local-First Functional Guarantee:** Extension operates at 100% capacity offline without requiring user registration or login.
  - **Explicit Consent for Sync:** Clipboard sync is disabled by default; turning it on presents a clear consent modal detailing data handling, retention limits, and deletion.
  - **Pre-Upload Secret Scanner:** Built-in scanner runs on-device prior to syncing clipboard or quick-code items, flagging and blocking AWS keys, GitHub tokens, database passwords, and private keys from network transmission.
  - **Private Browsing Isolation:** Text copied within private/incognito windows or password inputs is strictly excluded from capture.
  - Mozilla `data_collection_permissions = { required: ["none"] }` declared explicitly in `manifest.firefox.json`.

---

## 5. Security & Isolation
- **Host Page Isolation:** All injected UI buttons are rendered inside a **Closed Shadow DOM** (`attachShadow({ mode: 'closed' })`) to prevent interference with or tampering by host web applications.
- **Token Storage Isolation:** OAuth tokens and session keys are stored strictly in extension background storage (`chrome.storage.local`), unreachable from page-accessible storage (`window.localStorage` or page DOM).
- **Constant-Time Verification:** Quick-share codes use `timingSafeEqual` constant-time string comparison to prevent timing side-channel attacks.
- **Rate-Limiting:** Exponential lockout after 5 consecutive failed quick-code attempts prevents brute-force enumeration.

---

## 6. Store-Specific Review Requirements

### Chrome Web Store (Google)
- [x] Manifest Version: 3 (`manifest_version: 3`).
- [x] Background service worker: `service_worker: "background.js"`.
- [x] Justification documented for all declarative permissions.
- [x] No obfuscated code; clean ESM/IIFE build outputs.

### Mozilla Firefox Add-ons (AMO)
- [x] Gecko ID specified: `kuracode@sahinur.islam`.
- [x] Minimum Firefox ESR version: `strict_min_version: "115.0"`.
- [x] Background scripts structure: `background.scripts = ["background.js"]`.
- [x] Clean `web-ext lint` execution (0 errors, 0 warnings on packaging).

### Microsoft Edge Add-ons (Microsoft Partner Center)
- [x] Full Chromium MV3 parity.
- [x] Microsoft Partner Center developer agreement compliant.

---

## 7. Third-Party Data Processors & Privacy Disclosures

To comply with Google Chrome Web Store, Edge Add-ons, and Mozilla AMO privacy disclosure mandates, the following sub-processors may be used only when the user explicitly enables cloud sync or visits the web dashboard:

| Service Provider | Role / Capability | Data Received | Safeguards / Privacy Policy Invariant |
| :--- | :--- | :--- | :--- |
| **Supabase** | Cloud DB & Auth | User ID, email, workspace snippets | Protected by Row-Level Security; 0 data sent in local-only mode |
| **Cloudflare** | CDN, DNS, Turnstile | IP address, challenge tokens | Turnstile receives 0 snippet code or user identity data |
| **Resend** | Transactional Email | Recipient email, invite links | Encrypted in transit; emails queued only upon user request |
| **Sentry** | Error Tracking (Web/API only) | Exception stack traces | **Strictly excluded from extension.** Automatic regex PII & snippet scrubber |
| **Upstash Redis** | Rate Limiting | Hashed IP counters, share code keys | **Never stores snippet content.** Keys expire automatically via TTL |
| **UptimeRobot** | Health Monitoring | HTTP GET `/healthz` pings | Zero user, code, or personal data transmitted |
| **OAuth Providers** (GitHub, Google, GitLab, Microsoft) | Single Sign-On | Auth code, user email, profile name | Minimal requested scopes (`read:user`, `openid`, `email` only) |
