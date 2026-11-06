# KuraCode Official Website & Landing Page Update Notes
**Canonical URL:** `https://www.genioussonu.me/extensions/kuracode`  
**Target Release:** v0.2.0 (Zero-Border Redesign, Real-time Sync, Workspaces & Credential Architecture)  
**Date:** November 2026  
**Changelog Anchor:** `#v0-2-0`  
**Direct Download Links:**
- Chromium (Chrome/Edge/Brave): `https://github.com/GeniousSonu/KuraCode/releases/latest/download/kuracode-chrome-0.2.0.zip`
- Firefox: `https://github.com/GeniousSonu/KuraCode/releases/latest/download/kuracode-firefox-0.2.0.zip`
- Source Code (AMO): `https://github.com/GeniousSonu/KuraCode/releases/latest/download/kuracode-source-0.2.0.zip`
- Checksums: `https://github.com/GeniousSonu/KuraCode/releases/latest/download/SHA256SUMS.txt`

---

## 1. Visual Assets & Screenshot Gallery

Replace previous baseline assets with the newly captured high-fidelity evidence assets generated from Playwright redesign runs (`docs/agent/evidence/design/after/`):

| Screenshot Asset | Target Section | Dimensions / Description |
| :--- | :--- | :--- |
| `popup-after-default.png` | Hero Section (Zero-Border Dark Theme) | 380×600px: Zero-border typography, 48px header, 56px search, 40px chips, 115px cards, 32px hit-target copy button, and offline globe favicon. |
| `popup-after-light.png` | Theme Showcase (Light Theme) | 380×600px: High-contrast light palette (`#f8fafc` base, `#ffffff` surface, WCAG AA emerald accent `#00b96c`). |
| `popup-after-code-truncated.png` | Code Preview & Clamp Section | 380×600px: Inset 3-line code preview with bottom gradient fade and "Show more" modal expansion button. |
| `popup-after-320px.png` | Mobile / Responsive Stress Section | 320×600px: Stress-tested minimum width rendering with zero text wrap and zero horizontal scroll. |
| `popup-after-420px.png` | Wide Viewport Showcase | 420×600px: Wide viewport display matching side panel and large popup configurations. |
| `popup-after-zoom150.png` | Accessibility Section | 380×600px: Rendered at 150% browser zoom with full WCAG AA contrast compliance ($\ge 4.5:1$). |

---

## 2. Privacy Policy Updates (Mandatory Store & Web Compliance)

Update the site's Privacy Policy page (`/extensions/kuracode/privacy`) to reflect new optional cloud capabilities while preserving our absolute local-first guarantee:

### Core Declarations:
1. **Local-First & Offline Independence:**
   - KuraCode does not require an account. 100% of local features (web capture, instant copy, local search, syntax cleaning, export) work completely offline without transmitting any snippet data.
2. **Account & Cloud Sync (Optional):**
   - Cloud sync is strictly opt-in. When a user connects Google, GitHub, or Microsoft identities, snippet sync occurs via encrypted channels.
   - All server communications use TLS 1.3 with rotating refresh tokens and Hybrid Logical Clock causality tracking.
3. **Clipboard Hub Privacy Safeguards:**
   - **Disabled by default:** Clipboard Hub network sync is never active upon installation; it requires explicit user activation via a clear consent dialog.
   - **Local Secret Scanner:** All clipboard text is scanned on-device by an entropy and regex scanner (detecting AWS keys, GitHub tokens, database credentials, OpenAI keys) before any upload. Items flagged with secrets are blocked from network transmission.
   - **Private Browsing Isolation:** Text copied within private/incognito windows or password inputs is strictly excluded from capture.
   - **Retention & Ephemeral Storage:** Clipboard entries expire automatically after 30 days (customizable down to 1 hour), unless pinned by the user. Deletions propagate across all linked devices immediately.

---

## 3. Store Permissions Justifications

Provide these exact justifications on the website FAQ and in the Chrome/Firefox/Edge developer consoles:

| Permission | Reviewer & User Justification |
| :--- | :--- |
| `activeTab` | Allows capturing code from the current tab only when the user explicitly triggers a capture via hotkey, context menu, or inline button. Never monitors browsing history. |
| `contextMenus` | Adds a right-click "Save snippet to KuraCode" shortcut in the browser context menu. |
| `storage` & `unlimitedStorage` | Persists user snippets, tags, and settings locally in browser IndexedDB/storage without artificial size constraints. |
| `identity` | Powers standards-compliant OAuth 2.0 PKCE authentication with Google, GitHub, and Microsoft directly through browser-native identity providers. |
| `clipboardWrite` | Copies snippet code or quick share codes to the system clipboard upon clicking the primary "Copy" button. |
| `clipboardRead` *(Optional)* | Dynamically requested only if the user explicitly enables "Clipboard Hub - Send to my devices". |

---

## 4. Privacy Policy Sub-Processors & Data Recipients

When updating the official privacy policy at `https://www.genioussonu.me/extensions/kuracode#privacy`, disclose these sub-processors and the data each receives:

1. **Supabase, Inc. (USA):** Hosts cloud PostgreSQL database and auth sessions for users who opt into cross-device sync. Data received: User ID, email, synchronized code snippets. (Protected by Row-Level Security; zero access in local-only mode).
2. **Cloudflare, Inc. (USA / Global):** Edge CDN, DNS routing, and Turnstile bot protection for public quick-share code claims. Data received: Client IP and Turnstile challenge tokens. Turnstile receives zero snippet code.
3. **Resend, Inc. (USA):** Transactional email delivery. Data received: Email addresses for team workspace invitations, magic links, and security alerts.
4. **Functional Software, Inc. / Sentry (USA):** Error monitoring for the web dashboard and API. Data received: Application error stack traces. Sentry automatically scrubs all snippet code, URLs, emails, and tokens. Sentry is NEVER included in the browser extension.
5. **Upstash, Inc. (USA):** Ephemeral serverless cache for rate limiting. Data received: Hashed IP addresses and short-lived share code references. Upstash never stores snippet content.
6. **UptimeRobot / Blesk s.r.o. (Czech Republic / USA):** External uptime monitoring. Data received: HTTP GET pings to `/healthz`. Receives zero user data.
7. **Identity Providers (GitHub, Google, GitLab, Microsoft):** Identity verification via OAuth 2.0. Data received: Minimal authorization scopes (`read:user`, `openid`, `email`).

---

## 5. Feature Highlights Copy (Ready to Paste)

### Headline:
> **The Senior Developer's Code Snippet Hub & Cross-Device Scratchpad**

### Subheadline:
> Instant capture from Stack Overflow, GitHub, and docs. Clean formatting, semantic auto-titles, 4-digit quick-share codes, and encrypted cross-device sync. 100% offline-ready.

### 4 Key Value Props:
1. **High-Density Compact Popup:** Fits 4+ code snippets at a glance without clutter. Semantic titles automatically generated from AST tokens (no more ambiguous raw code titles).
2. **One-Click Primary Action:** Prominent 1-click copy with animated checkmark feedback. Secondary actions neatly organized in a 3-dot overflow menu with 8-second undo Trash.
3. **4-Digit Quick Share & Team Workspaces:** Share any snippet in 2 seconds via temporary 4-digit codes, or collaborate in team Workspaces with strict tenant isolation and 6-digit invite codes (`KURA-xxxx`).
4. **Smart Clipboard Hub:** Opt-in scratchpad for cross-machine snippets with on-device secret scanning that prevents accidental leakage of API keys.

---

## 5. Workspaces, Typography & Code Viewer Enhancements

### 5.1 Workspaces & Unified Join Entry (`/join/<code>`)
- Update the documentation and FAQ to refer strictly to **Workspaces** (not workplaces).
- Direct join links (`https://www.genioussonu.me/extensions/kuracode/join/<code>`) automatically preview the workspace name, inviter, and role before confirming.
- Brute-force protection locks out automated guessing after 5 failed attempts.

### 5.2 Zero-Tracking Bundled Typography
- Emphasize in the privacy FAQ that KuraCode bundles local open-licensed fonts (Inter for UI, JetBrains Mono for code).
- **Zero requests to Google Fonts or third-party CDNs.** Complete offline privacy and compliance with GDPR/German font ruling standards.

### 5.3 Responsive Code Viewer & Copy Fidelity
- Code previews support user-toggleable Word Wrap (`white-space: pre-wrap`) and optional non-selectable line numbers.
- Copying always produces byte-exact code matching the original text without line number contamination.

