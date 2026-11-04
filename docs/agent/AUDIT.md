# Audit Report (2025-08-19)

Re-verified from a working tree, **not** from earlier claims. Every "works" line below
is backed by a command I ran in this session.

## What exists

| Area | Path | Notes |
|---|---|---|
| Monorepo (npm workspaces) | `package.json` | packages/extension, packages/web, packages/test-fixtures |
| Chrome MV3 extension (esbuild) | `packages/extension/` | manifest.json, build.mjs |
| Web app (Vite + React) | `packages/web/` | only a static viewer |
| Test fixtures | `packages/test-fixtures/fixtures/` | simple, stackoverflow, github, csp-shadow |
| Agent state system | `docs/agent/` | STATE, TASKS, PROGRESS, DECISIONS, KNOWN_ISSUES, IMPROVEMENTS, VERIFICATION, HANDOFF, CHANGELOG, PARITY, AUDIT |
| CI | `.github/workflows/ci.yml` | lint → typecheck → unit → build → e2e (xvfb) |
| Verify/resume scripts | `scripts/verify.sh`, `scripts/resume.sh` | |

## What I actually ran (this session, all on the current tree)

| Gate | Command | Result |
|---|---|---|
| Install | `npm` (node 22 / npm 10, lockfile present) | OK |
| Lint | `npm run lint` | PASS (0 errors) |
| Typecheck | `npm run typecheck` | PASS (extension + web) |
| Unit | `npm test` | PASS **9/9** (cleaner) |
| Build (Chrome ext + web) | `npm run build` | PASS (esbuild + vite) |
| Build (Firefox) | — | **NOT PRESENT** (no firefox target) |
| E2E | `xvfb-run npm run e2e --workspace @kuracode/extension` | PASS **6/6** on Chromium (smoke + S1/S3/S4/S6/S11) |

## What works (verified)

- Capture engine (content script) attaches to `<pre>` blocks, injects a shadow-DOM
  Save button; hotkey/context-menu bridge via background service worker; clipboard
  paste-save in popup/side panel.
- Cleaner: strips line-number gutters, shell prompts, ANSI-normalizes CRLF, preserves
  indentation (with one known flaw, see below). Language detection from element class /
  data-lang / text hints, fallback `text`.
- Local storage wrapper over `chrome.storage.local` (single namespaced key, cap 50k).
- Shared library UI renderer (search, language filter, copy, delete, clipboard-save).
- Fixtures + S-series scenario library, run in a real headed Chromium with the built
  extension loaded.

## What is broken / partial

- **T-026**: `stripLineNumbers` flattens whitespace that immediately follows a gutter,
  so indented lines lose their leading indent after stripping (confirmed by S3).
- **Storage is in-memory-array based** (`chrome.storage.local` single key), not
  IndexedDB/Dexie as PRD specifies. Whole list loaded + sorted on every read; at 50k
  snippets this is an unbounded cost. Works for small sets only.
- **Language detection** is hint-string-based; no accuracy corpus measured yet.
- No options page (cannot change hotkey/behavior), no omnibox.
- No collections/favorites/note editing UI (fields exist in types, not exposed).
- No import/export; no secret scanner; no license detection (field only).
- Web app has no share/visibility/expiry; no backend at all.
- No Firefox build, no Safari, no VS Code companion.
- No accessibility audit, no performance-budget tests, no real-site fixture corpus
  (only synthetic pages).

## Requirement status (P0/P1)

| ID | Requirement | Status |
|---|---|---|
| CAP-1 | Hotkey capture | VERIFIED (S1 via bridge) |
| CAP-2 | Context-menu capture | PARTIAL (same bridge; not e2e'd via real right-click) |
| CAP-3 | Inline Save button | VERIFIED (S3) |
| CAP-4 | Clipboard paste-save | VERIFIED (S4, with clipboard stub) |
| CAP-5 | Save stores URL/title/timestamp/raw+cleaned | VERIFIED (S1/S3) |
| CTX-1 | Source context (URL/title/domain/timestamp) | VERIFIED |
| CTX-2 | Nearest heading | PARTIAL (field computed, untested) |
| CTX-3 | Surrounding text | NOT_STARTED |
| CTX-4 | Raw always retained | VERIFIED (S3) |
| CLEAN-1 | Strip line numbers | VERIFIED, with T-026 flaw |
| CLEAN-2 | Strip shell prompts | VERIFIED (unit) |
| CLEAN-3 | Preserve indentation | PARTIAL (T-026) |
| CLEAN-4 | Language detection (page hints) | PARTIAL (works, no corpus) |
| CLEAN-5 | Syntax highlighting | NOT_STARTED |
| ORG-1 | Title/notes/tags/collections/favorites | PARTIAL (title/tags stored; no edit UI) |
| ORG-2 | Full-text local search | VERIFIED (substring; no ranking) |
| FIND-1 | Search by code fragment/tag/domain | PARTIAL (substring across fields) |
| FIND-2 | Filter by language | VERIFIED |
| FIND-3 | Omnibox | NOT_STARTED |
| FIND-4 | Copy/insert | VERIFIED (S6 exact copy) |
| FIND-5 | Export | NOT_STARTED |
| SHARE-1 | Share links + web viewer | NOT_STARTED |
| SHARE-2 | Visibility levels | NOT_STARTED |
| COLLAB-* | Workspaces/roles/comments/edits | NOT_STARTED |
| TRUST-1 | Version history / status labels | PARTIAL (status field only) |
| TRUST-2 | Fork + lineage | NOT_STARTED |
| SEC-1 | Secret scanner before share | NOT_STARTED |
| LIC-1/2 | License/attribution hints | NOT_STARTED |
| PRIV-1 | Local-first, nothing leaves device | VERIFIED (no network calls) |
| PRIV-2 | Minimal permissions | VERIFIED (activeTab, contextMenus, clipboardWrite, storage, unlimitedStorage) |
| PRIV-3 | Escape captured text (no unsafe innerHTML) | VERIFIED (textContent used for code/title; domain escaped) |
| PRIV-4 | Injected UI in shadow DOM | VERIFIED (closed shadow) |
| PRIV-5 | No secrets committed | VERIFIED (none found in tree) |

## Top risks

1. **Storage scales poorly** — array-in-one-key + full re-reads; will degrade at
   thousands of snippets. Needs IndexedDB/Dexie.
2. **No per language** — single Chromium build; Firefox/Safari absent from CI.
3. **Cleaner edge cases** — T-026 indent flattening; no real-site corpus, so accuracy
   is unmeasured.
4. **No security layer** — secret scanner and XSS hardening are unbuilt.
5. **Docs drift** — STATE.md was stale (said "e2e NOT SET UP" while 6/6 pass). Docs
   must be regenerated from verified gates.
