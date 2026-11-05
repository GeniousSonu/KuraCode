# KuraCode User Guide & Collaboration Manual

Welcome to **KuraCode** — the developer-first snippet capture, memory, and team knowledge platform.

Official Website: [https://www.genioussonu.me/extensions/kuracode](https://www.genioussonu.me/extensions/kuracode)

---

## 1. Capturing Code Snippets

KuraCode offers 4 flexible, high-fidelity capture methods designed to fit your coding workflow:

### 1.1 One-Click Inline "Save" Button
When browsing technical documentation, Stack Overflow, GitHub, or blogs, KuraCode automatically renders a non-intrusive floating **Save** button in the top-right corner of detected `<pre>` and `<code>` blocks:
- **Zero layout shift:** Injected inside an isolated Closed Shadow DOM.
- **Smart Cleanup:** Automatically strips terminal prompts (`$`, `>`, `PS>`) and line number gutters without eating code indentation.
- **Provenance Intact:** Automatically records the page title, URL, source domain, nearest heading, and timestamp.

### 1.2 Global Keyboard Shortcut
Highlight any code snippet on any webpage and press:
- **macOS:** `⌘ + Shift + S` (Command + Shift + S)
- **Windows / Linux:** `Ctrl + Shift + S`

A feedback notification confirms the snippet has been saved to your active workspace with syntax auto-detection.

### 1.3 Quick Save from Clipboard
Copied code from your IDE, terminal, or Slack? Open the KuraCode popup or side panel and click **`+ Save Clip`** in the toolbar. KuraCode reads the clipboard, detects the language, generates a readable semantic title, and stores it instantly.

---

## 2. Workspaces & Team Collaboration

KuraCode features complete multi-tenant tenant isolation:

```
+-----------------------------------------------------------+
|                      KuraCode Store                       |
|                                                           |
|   +-------------------+           +-------------------+   |
|   |  Personal Space   |           |  Frontend Core    |   |
|   | (workspace: null) |           | (workspace: ws_1) |   |
|   |  Private Snippets |           |  Shared Team Code |   |
|   +-------------------+           +-------------------+   |
+-----------------------------------------------------------+
```

### 2.1 Personal Space vs. Team Workspaces
- **Personal Space:** Your isolated, local-first scratchpad. No one else has access.
- **Workspaces:** Dedicated spaces for projects, teams, or engineering guilds with role-based access control (Owner, Admin, Editor, Viewer).

### 2.2 Switching Workspaces
Click the workspace button in the header (defaults to `Personal ▾`). A dropdown reveals your joined workspaces and quick actions:
- Select any workspace to instantly switch.
- In-flight queries are safely canceled and the view re-populates with scoped snippets.
- Zero cross-workspace data leaks: searches, snippet lists, tags, and counts strictly reflect the active workspace.

---

## 3. Joining Workspaces & Claiming Codes

KuraCode provides a unified **"Enter a code or link"** dialog accessible anywhere:
- Click the **`+`** button in the header.
- Or click **`Join with code or link...`** in the workspace switcher dropdown.
- Or click **`Enter Invite Code or Link`** from an empty workspace view.

### 3.1 Accepted Inputs
1. **6-Digit Workspace Invite Codes:** e.g., `KURA-9281`
2. **4-Digit Quick Share Codes:** e.g., `4821`
3. **Full Deep Links:** e.g., `https://kuracode.app/join/KURA-9281`

### 3.2 Instant Visual Preview & Protection
- Click **Paste** to read from clipboard with explicit user gesture.
- KuraCode validates the code in real-time and displays a rich preview card:
  - Workspace Name & Inviter Identity
  - Assigned Role (Editor, Viewer)
  - Expiry countdown (e.g., `Expires in 23h`)
- **Brute-Force Lockout:** After 5 incorrect attempts, code entry is automatically locked out for 30 seconds to prevent enumeration attacks.

---

## 4. Code Viewer & Reading Experience

KuraCode eliminates cramped, truncated code previews:

### 4.1 Responsive Word Wrap Toggle
Click the **Wrap** button in the card toolbar or popup header:
- **Wrap Enabled (Default):** Long code lines wrap cleanly without horizontal scrolling (`pre-wrap` with `overflow-wrap: anywhere`).
- **Wrap Disabled:** Preserves traditional single-line flow with smooth horizontal scrolling.
- Preference is remembered per surface.

### 4.2 Non-Selectable Line Numbers
Toggle line numbers on or off. Line numbers are styled in a dedicated gutter with `user-select: none`. When you click **Copy**, only the byte-exact code is copied — line numbers are never copied into your clipboard.

### 4.3 3-4 Line Fade & Full Viewer
Snippets default to a compact 3-to-4 line preview with a soft bottom fade. Click **Show more** to expand the card or inspect the complete snippet.

---

## 5. Keyboard Cheat Sheet

Press **`?`** anywhere in the extension popup or side panel to view the keyboard cheat sheet:
- `⌘ + Shift + S` / `Ctrl + Shift + S`: Capture selected code from webpage
- `Esc`: Clear active search query
- `Alt + S` / `⌘ + ,`: Open Settings & Preferences
- `?`: Open Keyboard Cheat Sheet

