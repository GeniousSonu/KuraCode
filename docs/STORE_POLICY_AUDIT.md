# Store Policy Self-Audit & Compliance Matrix

This document provides a comprehensive policy self-audit verifying that KuraCode complies with all major browser extension store guidelines: Chrome Web Store, Microsoft Edge Add-ons, and Mozilla Firefox AMO.

---

## 1. Single Purpose Policy
- **Requirement:** Extension must have a single, clear, easily understandable purpose.
- **KuraCode Purpose:** Capturing, cleaning, formatting, and locally searching code snippets from web pages.
- **Compliance Status:** **COMPLIANT**
  - All extension surfaces (content script inline button, keyboard shortcut, right-click menu, popup/sidepanel library) serve this single purpose exclusively.

---

## 2. Minimal Permissions Policy
- **Requirement:** Request only the minimum necessary permissions required to implement features.
- **Compliance Status:** **COMPLIANT**
  - `activeTab`: Used instead of broad persistent tab monitoring.
  - `contextMenus`: Used only for snippet capture entry point.
  - `clipboardWrite`: Used only when the user explicitly clicks the "Copy" snippet button.
  - `storage` & `unlimitedStorage`: Used solely for local snippet persistence.
  - `<all_urls>`: Content script is limited strictly to injecting the scoped shadow-DOM Save button on `<pre>` elements without altering host DOM styles.

---

## 3. Prohibition of Remote Code Execution
- **Requirement:** All code executed by the extension must be packaged inside the archive; no `eval()`, `new Function()`, or dynamic external script loading.
- **Compliance Status:** **COMPLIANT**
  - Build script bundles all TypeScript into local IIFEs (`background.js`, `content.js`, `popup.js`, `sidepanel.js`).
  - No CDN imports, script tags with remote `src`, or WebSocket dynamic payloads.
  - Automated release gate checks for forbidden `eval()` expressions and fails builds if detected.

---

## 4. User Privacy and Data Transparency
- **Requirement:** Clear disclosures regarding what data is collected and how it is processed.
- **Compliance Status:** **COMPLIANT**
  - **Zero Telemetry:** No analytics SDKs (Google Analytics, Sentry, Mixpanel, etc.) are embedded.
  - Plain-language [PRIVACY.md](../../PRIVACY.md) available in repository and linked in store listings.
  - Mozilla `data_collection_permissions = { required: ["none"] }` declared explicitly in `manifest.firefox.json`.

---

## 5. Security & Isolation
- **Host Page Isolation:** All injected UI buttons are rendered inside a **Closed Shadow DOM** (`attachShadow({ mode: 'closed' })`) to prevent interference with or tampering by host web applications.
- **Content Security Policy (CSP):** Defaults to strict MV3 policy preventing inline scripts or external origins.
