# Chrome Web Store Listing Package (en-US)

## Store Details
- **Item Name:** KuraCode — Code Snippet Capture & Collaboration
- **Short Description (max 132 chars):**
  Capture code from any web page in one click with its context intact. Clean, organized, searchable snippet memory for developers.
- **Category:** Developer Tools
- **Visibility:** Public (or Unlisted for staging)
- **Primary Language:** English

---

## Detailed Description (Markdown formatted for Chrome Store)
```markdown
Stop losing valuable code snippets scattered across browser tabs, Slack channels, and scratchpads.

KuraCode (formerly SnipHub) is the local-first, zero-friction snippet memory for developers. It detects code on any webpage, cleans away messy line numbers and terminal prompts, preserves syntax indentation, and remembers exactly where the code came from.

⚡ KEY FEATURES

• 1-Click Inline Capture: Hover over any code block on documentation, GitHub, or StackOverflow and click "Save".
• Instant Hotkey Capture: Highlight any code snippet and press Ctrl+Shift+S (Cmd+Shift+S on macOS).
• Smart Code Cleaner: Automatically strips gutter line numbers (1, 2, 3...) and shell prompts ($, >, PS>), keeping clean, runnable code.
• Provenance Intact: Automatically records the source URL, page title, domain, and closest heading so you always know where your solution originated.
• Instant Search & Filter: Search your entire snippet library by keyword, language, or domain in under 5 milliseconds.
• Local-First & Private: All your data stays inside your browser. No telemetry, no cloud tracking, no login required.

🔒 PRIVACY & PERMISSIONS
KuraCode is designed with minimal permissions:
- activeTab: To access the code snippet on the tab you choose to capture.
- storage & unlimitedStorage: To store snippets securely on your computer.
- contextMenus: Right-click shortcut to capture selections.
- clipboardWrite: To copy cleaned snippets back to your clipboard.

Experience clean code snippet capture without friction. Install KuraCode today!
```

---

## Chrome Web Store Privacy Disclosures
- **Single Purpose Statement:**
  KuraCode allows software developers to cleanly capture, format, and search code snippets from web pages with their source context.
- **Permission Justifications:**
  - `activeTab`: Needed to inspect code blocks on the currently focused tab when the user triggers the capture button or keyboard shortcut.
  - `contextMenus`: Needed to provide a right-click menu item "Save selection to KuraCode".
  - `clipboardWrite`: Needed to allow users to copy saved code directly to their system clipboard.
  - `storage` & `unlimitedStorage`: Needed to store code snippets locally on the user's computer.
  - `<all_urls>`: Needed to render the non-intrusive hover Save button on arbitrary developer documentation sites.
- **Data Usage:**
  - Does the extension collect user data? **No.**
  - Does the extension transmit data to external servers? **No.**
  - Does the extension use remote code? **No.**
