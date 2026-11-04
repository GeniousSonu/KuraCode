# Privacy Policy for KuraCode (SnipHub)

**Last Updated:** November 4, 2026  
**Effective Date:** November 4, 2026

KuraCode (formerly referred to as SnipHub) is committed to protecting your privacy. This privacy policy applies to the KuraCode browser extension (Chrome Web Store, Firefox Add-ons, Microsoft Edge Add-ons) and associated web dashboard.

---

## 1. Core Privacy Principle: Local-First

KuraCode is designed as a **local-first, privacy-by-default** tool:
- All code snippets, notes, tags, titles, and capture metadata are stored exclusively inside your browser's local sandbox storage (`chrome.storage.local`).
- **Nothing leaves your machine** automatically. There are no tracking scripts, analytics SDKs, advertising pixels, or background data collection servers.

---

## 2. Information We Handle

### A. Data Stored Locally
When you choose to capture a snippet, KuraCode saves:
- Cleaned code content and raw selected text
- Page title and domain URL of the source page (for citation and provenance)
- Nearest heading context (to organize snippet origin)
- Timestamps and user-defined tags / notes

All this data remains entirely on your device unless you manually export or share it.

### B. Data We Do NOT Collect
- We do **not** collect personal identification information (names, emails, passwords, IP addresses).
- We do **not** transmit browsing history or telemetry to any external server.
- We do **not** sell, rent, monetize, or trade user data under any circumstances.

---

## 3. Browser Permissions and Justifications

KuraCode requests only the minimal permissions required for functionality:

| Permission | Purpose / Justification |
| :--- | :--- |
| `activeTab` | Read code blocks and selection on the currently active tab only when you interact (click button, hotkey, or context menu). |
| `contextMenus` | Provide a "Save selection to KuraCode" entry in the browser's right-click context menu. |
| `clipboardWrite` | Allow you to copy cleaned snippets back to your system clipboard from the extension UI. |
| `storage` & `unlimitedStorage` | Store your snippets and tags locally without arbitrary browser quota limits. |
| `host_permissions: ["<all_urls>"]` | Allow the content script to display the optional inline "Save" button on code blocks across developer documentation sites and code repositories. |

---

## 4. Third-Party Services & Remote Code
- **No Remote Code:** KuraCode does not load remote scripts, CDNs, or dynamic code (`eval`). All logic is bundled locally in the extension package in compliance with Chrome Web Store, Mozilla AMO, and Microsoft Edge Add-on developer policies.

---

## 5. Security & Secret Protection
KuraCode includes local heuristics to prevent capturing accidental credentials. We advise users never to store API keys, private passwords, or confidential credentials.

---

## 6. User Rights & Data Deletion
Because your data is stored locally:
- You have full control over your data.
- You can delete any snippet at any time in the UI.
- Uninstalling the browser extension immediately and permanently removes all stored snippet data from your browser profile.

---

## 7. Contact & Inquiries
For questions regarding this privacy policy or KuraCode practices:
- **Project Repository:** [https://github.com/kuracode/kuracode](https://github.com/kuracode/kuracode)
- **Security & Vulnerabilities:** Refer to [SECURITY.md](SECURITY.md)
- **Maintainer:** SK SAHINUR ISLAM
