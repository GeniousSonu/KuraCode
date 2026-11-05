# KuraCode Official Website & Landing Page Update Notes
**Canonical URL:** `https://www.genioussonu.me/extensions/kuracode`  
**Target Release:** v0.1.0 (Senior Redesign, Accounts, Real-time Sync & Clipboard Hub)  
**Date:** November 2026  

---

## 1. Visual Assets & Screenshot Gallery

Replace previous baseline assets with the newly captured high-fidelity evidence assets generated from Playwright redesign runs (`docs/agent/evidence/design/after/`):

| Screenshot Asset | Target Section | Dimensions / Description |
| :--- | :--- | :--- |
| `popup-4-snippets-dark.png` | Hero Section (Primary Dark Theme) | 380×520px: Showcases compact 115px cards, semantic titles ("React useEffect hook", "Recursive CTE query"), primary emerald copy button, 3-dot menu, and sync status badge. |
| `popup-4-snippets-light.png` | Theme Showcase (Light Theme) | 380×520px: Demonstrates light theme palette (`#f8fafc` background, crisp borders, WCAG AA emerald accent `#00b96c`). |
| `popup-50-snippets.png` | Performance / Infinite Scroll Section | 380×520px: Proves silky 60fps scrolling and instant filtering across 50+ saved snippets. |
| `popup-search-results.png` | Instant Search & Filtering | 380×520px: Shows multi-term instant filtering with matching substring highlights. |
| `sidepanel-redesign.png` | Side Panel Parity Feature | 420×720px: Demonstrates side panel mode for long-session coding and multi-tasking alongside editor. |

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

## 4. Feature Highlights Copy (Ready to Paste)

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

