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

## #9 stripLineNumbers flattens post-gutter indentation

- Severity: medium | Req: CLEAN-1/3 | Found: T-024 (S3) | Status: open
- Symptom: when gutter line numbers are embedded in the copied text, `stripLineNumbers` removes all whitespace after the number, so the first level of code indentation is lost (e.g. `2   return` → `return`).
- Note: real GitHub/Stack Overflow copies keep line numbers in a separate column, so this path is uncommon; but it is a fidelity gap.
- Upgrade path: T-026 (preserve indentation beyond one gutter separator).

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
