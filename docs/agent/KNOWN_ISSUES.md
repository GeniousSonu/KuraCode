# Known Issues & Gaps

## #1 (closed) e2e harness

- Status: closed (T-003). Playwright persistent Chromium context loads the built extension; S1/S3/S4/S6/S11 pass.
- Remaining: only Chromium target; Firefox/Safari need the WXT multi-target build (section 2.1).

## #2 (closed) test fixtures

- Status: closed (T-005/T-023). Fixture pages added: stackoverflow, github (gutters), csp-shadow; served by `e2e/server.mjs` with a strict CSP response header for the CSP fixture.

## #3 Storage is chrome.storage.local, not Dexie/IndexedDB

- Severity: medium | Req: ORG-1 | Found: T-001 | Status: open
- Symptom: no proper queries, migrations, or 50k benchmark.
- Upgrade path: T-006/T-007 (Dexie).

## #4 No secret scanner / license detection yet

- Severity: high (privacy) | Req: PRIV-3, LIC-1 | Found: T-001 | Status: open
- Symptom: captured snippets are not scanned before share (share not yet implemented either).
- Upgrade path: T-016.

## #6 S4 uses a deterministic clipboard stub

- Severity: low | Req: CAP-4 | Found: T-024 | Status: open
- Symptom: real OS-clipboard read is unreliable in headless CI, so the paste-save scenario stubs `navigator.clipboard.readText`.
- Check manually in a real browser before release; grant `clipboard-read` when doing so.

## #7 Context-menu UI (S2) only via bridge, not a real right-click

- Severity: low | Req: CAP-2 | Found: T-024 | Status: open
- Symptom: S1 exercises the same background message path; we do not yet synthesize an actual right-click menu selection.
- Upgrade path: add a `contextMenus` click simulation in a later pass.

## #8 Only Chromium (chrome-mv3) build target exists

- Severity: medium | Req: section 2.1 | Found: T-004 | Status: open
- Symptom: Firefox/Safari/Edge-store builds and parity not verifiable in CI yet.
- Upgrade path: introduce WXT (or equivalent) multi-target output before Firefox release.

## #9 (closed) stripLineNumbers flattens post-gutter indentation (BUG-2 / T-026)

- Status: closed (BUG-2 / T-026). Fixed by computing baseline gutter padding across lines and preserving relative code indentation.
- Regression tests: `packages/extension/test/round-trip-fidelity.test.ts` and scenario S3 in `packages/extension/tests/scenarios/steps.ts`.

## #10 (closed) BUG-1: Settings button does nothing

- Severity: high | Req: SET-1 | Status: closed (T-042)
- Root Cause: Manifests lacked `options_ui` registration, no `options.html` page was built or packaged, and the settings icon in popup was unhandled.
- Fix: Manifests updated with `options_ui: { page: "options.html", open_in_tab: true }`; standalone options page implemented in `src/options/` with keyboard navigation and shortcut support; in-popup settings dialog fallback wired; click and keydown handlers attached to `chrome.runtime.openOptionsPage()`.
- Regression tests: `packages/extension/e2e/bugs-regression.spec.ts` ("BUG-1: Settings button opens options or settings view") and `packages/extension/e2e/interactive-controls.spec.ts`.

## #11 (closed) BUG-2: Copied snippet shows on one line only

- Severity: high | Req: CAP-5, CLEAN-1, CLEAN-3 | Status: closed (T-043)
- Root Cause: (1) DOM text extraction inside content scripts concatenated adjacent block elements (`<br>`, `<div>`, `<p>`, `<tr>`) without inserting newlines; (2) Gutter stripping stripped all leading post-digit whitespace, destroying code indentation; (3) CSS `.kura-card-code` had `white-space: pre; max-height: 38px;` causing multi-line code to be horizontally and vertically clipped without line wrapping.
- Fix: (1) Added DOM tree walker `extractCodeText()` that normalizes block element breaks to `\n`; (2) Upgraded `stripLineNumbers()` to detect baseline gutter whitespace and preserve relative indentation; (3) Updated CSS to `white-space: pre-wrap; overflow-wrap: anywhere;` with expandable height; (4) Added surface-persisted Word Wrap toggle and non-selectable line numbers; (5) Guaranteed copy action transfers byte-exact raw/cleaned code to clipboard.
- Regression tests: `packages/extension/test/round-trip-fidelity.test.ts` (5/5 unit tests) and `packages/extension/e2e/bugs-regression.spec.ts` ("BUG-2: Snippet code renders multi-line with wrap toggle and exact copy").

## #12 (closed) BUG-3: Switching workspaces does not change snippets shown

- Severity: high | Req: WS-3 | Status: closed (T-044)
- Root Cause: Snippet storage schema lacked a `workspaceId` partition column (or null for Personal Space); `renderLibrary` and `listSnippets` fetched all snippets globally; `wsBtn` only flipped an ephemeral in-memory string without triggering reactive filter updates.
- Fix: (1) Added `workspaceId: string | null` to Snippet domain schema; (2) Added workspace-scoped querying in `src/shared/storage.ts` (`listSnippets(workspaceId)`); (3) Built robust `WorkspaceManager` with active workspace persistence, skeleton loading states, and async query token cancellation to prevent switching race conditions; (4) Added workspace switcher dropdown and destination feedback on save.
- Regression tests: `packages/extension/test/workspace-isolation.test.ts` (4/4 unit tests) and `packages/extension/e2e/bugs-regression.spec.ts` ("BUG-3: Switching workspaces filters and updates the snippet list").

## #5 Vite dev on a non-default port

- Severity: low | Found: T-001 | Status: open
- Symptom: port 5173 was occupied during development; dev server ran on 5199.
- Workaround: `npm run dev:web -- --port 5199 --strictPort`.

## #10 No wordmark or monochrome dark SVG variant exists (BRAND)

- Severity: medium | Req: BRAND | Found: T-027 | Status: open
- Symptom: the supplied master is a mark-only geometric K. `docs/logo-wordmark.svg` is intentionally omitted; `logo-dark.svg` is identical to `logo-light.svg`, so on very dark surfaces the green mark has lower contrast than an official monochrome variant would.
- Upgrade path (see IMPROVEMENTS): supply a wordmark + a monochrome/white SVG for dark toolbars and the README header.

## #11 Store/Safari/Firefox icon coverage pending those build targets (BRAND)

- Severity: low | Req: BRAND | Found: T-027 | Status: open
- Symptom: Chrome/Edge store icons (128, 300, promo, marquee) and web/PWA/social icons are generated and verified; Firefox AMO and Safari 1024×1024 opaque icons and store screenshots await those targets (see PARITY).

## #12 (BUG-1) Settings button does nothing on popup, sidepanel, and options

- Severity: high | Req: UX-4, SET-1 | Found: Live User Bug | Status: closed (verified green)
- Root Cause:
  1. The `userBtn` (Settings gear) in `packages/extension/src/shared/library.ts` was appended without an `addEventListener` or keyboard handler.
  2. Neither `manifest.json` nor `manifest.firefox.json` declared `options_ui` or `options_page`.
  3. No `options.html` page entry point existed in `packages/extension/src/options/` or `build.mjs`.
  4. There was no fallback in-popup settings view when `openOptionsPage` is unavailable.
- Fix:
  1. Add `options_ui: { page: "options.html", open_in_tab: true }` to manifests.
  2. Implement `packages/extension/src/options/` (options.html + main.ts) and register in `build.mjs`.
  3. Wire click, keyboard (`Enter`/`Space`), and shortcut (`Alt+S`/`Cmd+,`) in `library.ts` to trigger `chrome.runtime.openOptionsPage()`, fallback to tab creation, and provide an accessible in-popup settings dialog.
- Regression Tests:
  - `packages/extension/e2e/bugs-regression.spec.ts:7` ("BUG-1: Settings button opens options or settings view") -> PASS
  - `packages/extension/e2e/interactive-controls.spec.ts` (audit clicking every interactive control across all surfaces) -> PASS

## #13 (BUG-2) Copied snippet shows on one line only

- Severity: high | Req: CAP-1, CLEAN-3, UX-3 | Found: Live User Bug | Status: closed (verified green)
- Root Cause:
  1. In DOM capture (`capture.ts`), using `pre.innerText ?? pre.textContent` without structured traversal collapsed `<br>`, `<div>`, and `<tr>` blocks into flattened strings on certain sites.
  2. In CSS (`popup/index.html` and `sidepanel/index.html`), `.kura-card-code` enforced `white-space: pre; max-height: 38px; overflow-y: hidden; line-height: 12px; font-size: 10.5px;` which clipped long lines horizontally and truncated multi-line snippets visually.
  3. Lack of a user-facing Wrap/No-wrap toggle, tab-size settings, line numbers toggle, and responsive code expansion with fade.
- Fix:
  1. Implement robust DOM text extractor `extractCodeText(el)` that maps `<br>`, `<div>`, `<tr>` to `\n` while strictly preserving indentation and blank lines.
  2. Update code viewer styling: `white-space: pre-wrap; overflow-wrap: anywhere; tab-size: 2/4;` with responsive height, expand/collapse fade, and horizontal scroll when wrap is off.
  3. Add surface-persisted Wrap/No-wrap toggle and optional line numbers (never included in clipboard copy).
  4. Enforce that copy always copies the raw/original code byte-exact.
- Regression Tests:
  - `packages/extension/e2e/bugs-regression.spec.ts:29` ("BUG-2: Snippet code renders multi-line with wrap toggle and exact copy") -> PASS
  - `packages/extension/test/round-trip-fidelity.test.ts` (real page fixtures from Stack Overflow, GitHub, MDN, and property test) -> PASS

## #14 (BUG-3) Switching workspaces does not change the snippets shown

- Severity: high | Req: WS-1, WS-3 | Found: Live User Bug | Status: closed (verified green)
- Root Cause:
  1. In `library.ts`, clicking `wsBtn` only modified a local in-memory string variable, changed button text, and showed a toast; it never triggered a filtered query, never cleared stale caches, and never re-rendered cards.
  2. `storage.ts` and `Snippet` lacked a `workspaceId` partition. `listSnippets` returned all snippets globally.
  3. Workspace state was not persisted across popup reloads or browser restarts.
- Fix:
  1. Add `workspaceId: string | null` to `Snippet` (where `null` represents the user's isolated Personal Space).
  2. Update `storage.ts` with `listSnippets(workspaceId)` scoping, active workspace persistence (`kuracode.active_workspace.v1`), and migration.
  3. Update `library.ts` to reload cards upon workspace change, show loading skeletons, update counts and search index, and save new captures to the active workspace with toast destination feedback.
  4. Implement `WorkspaceManager` with join flows, invites, and RBAC enforcement.
- Regression Tests:
  - `packages/extension/e2e/bugs-regression.spec.ts:83` ("BUG-3: Switching workspaces filters and updates the snippet list") -> PASS
  - `packages/extension/test/workspace-isolation.test.ts` (cross-workspace data separation, rapid switching, offline switching) -> PASS
  - `packages/extension/e2e/two-user-walkthrough.spec.ts` (full collaborative walkthrough) -> PASS
