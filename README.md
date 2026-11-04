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

**Build:** `npm run build --workspace @kuracode/extension` → bundles each entry
with esbuild to `packages/extension/dist/` (IIFE for MV3 content-script compat).
Load `dist/` via `chrome://extensions` → "Load unpacked".

**Dev watch:** `npm run dev:extension` (`node build.mjs --watch`).

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

## Getting started

```bash
# install all workspace deps
npm install

# build everything (extension + web)
npm run build

# type-check everything
npm run typecheck

# run the web app dev server (http://localhost:5173)
npm run dev:web

# watch-build the extension into packages/extension/dist
npm run dev:extension
```

## Reporting to the PRD

Requirement IDs from the PRD are referenced in the code comments and the table
above, so tickets and tests can be traced back to the spec. The MVP "P0" set
(CAP-1..5, CTX-1/4, CLEAN-1..5, ORG-1/2, FIND-1..4, PRIV-1/2/4) is the
target for Phase 1; collaboration (P1/P2) is out of scope for this base.
