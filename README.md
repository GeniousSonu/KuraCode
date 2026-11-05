# KuraCode — Code Snippet Capture & Collaboration

KuraCode is a browser-native snippet memory: capture code from any webpage in
one action, keep its context (source, date, language, heading), and turn it
into shareable team knowledge.

> **Name note:** the product is canonically named **KuraCode**. Earlier drafts
> used the placeholder _SnipHub_; all branding, docs, and code now use KuraCode.

## Source docs

- `Product Requirements Document Code Snippet Capture & Collaboration Extension.md`
  — requirements (CAP/CTX/CLEAN/ORG/FIND/SHARE/COLLAB/TRUST/LIC/EDU/IDE/INT/PRIV),
  personas, phasing, metrics.
- `kuracode_ui_ux_design_specification.md` — design system: dark theme, SF
  typography, color tokens, component states, motion.

## What this repo is (Phase 0 → 1 base)

The PRD's next step is a technical deep dive; this repo is that **base
implementation** focused on Phase 0 (foundations, design system, capture
prototype) and the solo local-first parts of Phase 1 (all P0 capture/cleaning/
language/context/storage/search requirements). The backend, accounts, sync and
collaboration surfaces are deliberately later-phase.

## Structure

```
packages/
  extension/   Chrome extension (Manifest V3) — the capture surface
  web/         Web app (Vite + React + TS) — snippet library dashboard
```

### `packages/extension` — Chrome MV3 extension

| Path                                                   | Responsibility                                                                         | PRD reqs                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------ |
| `manifest.json`                                        | MV3 manifest, permissions, commands (hotkey), menus                                    | CAP-1/2, PRIV-4                |
| `src/content/capture.ts`                               | Inline "Save" button on code blocks (shadow DOM), selection capture, cleaning pipeline | CAP-1..7, CTX-1..4, CLEAN-1..5 |
| `src/shared/cleaner.ts`                                | Strip line numbers/prompts, preserve indentation, language detection, nearest heading  | CLEAN-1..4, CTX-2              |
| `src/shared/storage.ts`                                | Local-first storage via `chrome.storage.local`                                         | PRIV-1/2, ORG-1/2              |
| `src/background/service-worker.ts`                     | Hotkey + context-menu → active tab capture                                             | CAP-1/2                        |
| `src/shared/library.ts` + `src/popup`, `src/sidepanel` | Searchable library UI, copy, delete, clipboard quick-save                              | FIND-1..4, CAP-4               |

**Build:** `pnpm build:chrome` → bundles each entry with esbuild to
`packages/extension/.output/chrome-mv3/` (IIFE for MV3 content-script compat).
Load `.output/chrome-mv3/` via `chrome://extensions` → "Load unpacked".
`pnpm build:firefox` → `.output/firefox-mv3/` (Firefox MV3 manifest).

**Dev watch:** `pnpm dev:chrome` (`node build.mjs --target chrome --watch`).

### `packages/web` — web app (library dashboard)

Vite + React + TypeScript, implementing the KuraCode design tokens from the UI
spec (`src/styles/tokens.css`). Currently renders a demo library (search,
language filter, cards, empty state). It will become the real library/shared
viewer once the backend ships.

| Path                    | Purpose                       |
| ----------------------- | ----------------------------- |
| `src/styles/tokens.css` | Design tokens (§6 of UI spec) |
| `src/App.tsx`           | Library dashboard UI          |
| `src/main.tsx`          | Entry                         |

## Run it in 5 minutes

Prereqs: **Node 20/22** and **pnpm** (this repo pins `pnpm@12.16.1`).

```bash
# 1) install deps (mirrors CI)
pnpm install --frozen-lockfile

# 2) build both browser targets
pnpm build:chrome     # → packages/extension/.output/chrome-mv3/
pnpm build:firefox    # → packages/extension/.output/firefox-mv3/
```

### Load the extension in Chrome / Edge / Brave

1. Open `chrome://extensions` (`edge://extensions`, `brave://extensions`).
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select **`packages/extension/.output/chrome-mv3`**.
4. Click the puzzle-piece icon → pin **KuraCode**. The toolbar icon appears.

### Load the extension in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and choose
   **`packages/extension/.output/firefox-mv3/manifest.json`**.
   (Or: `npx web-ext run --source-dir packages/extension/.output/firefox-mv3`.)

### Try a capture

Open the demo page (has JS/Python/SQL/Bash/TS blocks):

```bash
pnpm demo    # serves test-pages/demo.html at http://localhost:7331/demo.html
```

Select code → press **Ctrl/Cmd+Shift+S** (default hotkey), right-click →
_Save to KuraCode_, or use the inline **Save** button on a code block. Open the
popup to see the snippet.

### Change the hotkey

`chrome://extensions/shortcuts` → find KuraCode → edit `capture-selection`.

### Troubleshooting

- **Restricted pages** (`chrome://`, chrome Web Store, about:\*) block extensions —
  nothing to capture there; the icon dims.
- **Nothing happens after install:** refresh the page you're on; then re-select.
- **Shortcut conflict:** change it in `chrome://extensions/shortcuts`.
- **Service worker / background console:** `chrome://extensions` → KuraCode →
  _service worker_ / _background page_.

## Getting started

```bash
# verify (lint → typecheck → unit → build chrome+firefox → brand → web-ext → e2e)
pnpm verify

# health-check the environment
pnpm doctor

# build release zips
pnpm package        # release/kuracode-chrome-*.zip, kuracode-firefox-*.zip

# type-check everything
pnpm typecheck

# run the web app dev server (http://localhost:5173)
pnpm dev:web
```

## Working across two computers

To maintain seamless progress without losing work or creating diverged branches when switching between home and work machines:

1. **Start of session**:
   ```bash
   pnpm sync
   ```
   Safely fetches remotes, checks incoming/outgoing commits, autostashes uncommitted work, pulls with rebase, ensures dependencies are installed (`pnpm install --frozen-lockfile`), builds brand assets, and runs quick verification (`lint`, `typecheck`, `test`).

2. **End of session**:
   ```bash
   pnpm finish
   ```
   Runs full verification (`pnpm verify`), scans for uncommitted secrets, checks git status, and pushes commits cleanly to the remote branch so work is never stranded on one machine.

3. **Golden rules**:
   - Never leave uncommitted work at the end of the day.
   - Always push your branch before leaving.
   - Never commit secret files (`.env`, credentials, private keys).
   - If conflicts arise, rebase locally, preserve the intent of both machines, verify, and push.

## Reporting to the PRD

Requirement IDs from the PRD are referenced in the code comments and the table
above, so tickets and tests can be traced back to the spec. The MVP "P0" set
(CAP-1..5, CTX-1/4, CLEAN-1..5, ORG-1/2, FIND-1..4, PRIV-1/2/4) is the
target for Phase 1; collaboration (P1/P2) is out of scope for this base.
