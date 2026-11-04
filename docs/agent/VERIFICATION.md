# Verification Log

## V-1 Cleaner unit tests (T-012)

- Ran: `npm test --workspace @kuracode/extension` (vitest run)
- Result: 9/9 pass. Cases: strip line numbers (plain, dotted, gutter padding), strip prompts ($, >, PS>, #), copy-button text, ANSI escapes, trailing whitespace, CRLF, and language detection happy paths.
- Not tested: real saved pages, split-diff views, mixed indentation with tabs+spaces, root prompt `#` vs real comment disambiguation across languages.

## V-2 Type-check

- Ran: `npm run typecheck` (tsc --noEmit in both workspaces)
- Result: PASS both packages.

## V-3 Lint

- Ran: `npm run lint` (eslint flat config)
- Result: PASS, 0 errors/0 warnings.

## V-4 Build

- Ran: `npm run build`
- Result: PASS. Extension → `packages/extension/dist/` (esbuild); web → `packages/web/dist/` (tsc + vite).

## V-5 Web app on localhost

- Ran: `npm run dev:web -- --port 5199 --strictPort`; browser_check on http://localhost:5199/
- Result: HTTP 200, title "KuraCode", seeded snippets render, 0 console errors, 0 failed requests (favicon 404 fixed via SVG favicon).
- Note: ran on 5199 because 5173 was occupied.

## V-6 Browser E2E — scenario library (S-series)

- Ran: `npm run e2e --workspace @kuracode/extension` (Playwright, persistent headed Chromium context loaded with the built extension).
- Result: smoke + S1, S3, S4, S6, S11 all pass against real fixture pages. See `packages/extension/tests/scenarios/`.
  - S1 hotkey/context-menu bridge capture (stackoverflow fixture) → URL/title/language stored.
  - S3 inline Save strips gutter line numbers; layout width unchanged.
  - S4 clipboard paste-save from popup → source = clipboard.
  - S6 copy from library → clipboard matches saved code byte-exact (tabs/spaces/newlines).
  - S11 strict CSP (response header) + host with its own closed shadow root → light-DOM `<pre>`s instrumented, host untouched, page functional.

## V-7 Manual release checklist (per browser, Release Guide section 11)

This becomes the human gate before a store submission. For each target browser/face, on a fresh profile, release candidate build:

1. [ ] Complete onboarding (pin extension, tour, sample capture).
2. [ ] Run S1–S12 on: a real Stack Overflow answer, a GitHub file, a docs site, a blog, and a web IDE.
3. [ ] Toggle dark mode, zoom 150%, narrow window, non-English page, right-to-left page.
4. [ ] Conflict check with a second injection extension (ad blocker / password manager).
5. [ ] Private/incognito run after enabling the extension there.
6. [ ] Upgrade test: install previous public version, create data, upgrade to RC, confirm data/settings survive.
7. [ ] Sign in on two browsers; confirm sync both ways (requires backend).
8. [ ] Open a share link in another browser while logged out (requires backend).
9. [ ] Review store listing text, screenshots, permission descriptions, privacy-policy link.
10. [ ] Record results here and sign off per browser.

Not currently possible until later phases: steps 7–8 (backend), Firefox/Safari packaging, and web-app share flow.

## V-8 Not yet verified

- Firefox/Safari builds and e2e (only Chromium target exists).
- Context-menu UI click-through on a real right-click (S2) — bridge is covered via S1 message path.
- Real OS-clipboard read (S4 uses a deterministic clipboard stub; headless CI clipboard is unreliable).
- Performance budgets (10k/50k search), security/XSS suite, accessibility (axe), 50k-storage benchmark.

## V-9 Brand asset generation, checks, and browser evidence (T-027)

- Ran: `npm run brand:build` → `npm run brand:check` → `npm run e2e --workspace @kuracode/extension` (Playwright, headed Chromium, unpacked extension).
- Result: PASS. 35 assets generated deterministically from the master SVG into `brand/generated/` (sizes in docs/BRAND.md). `brand:check` verified every PNG dimension via its IHDR header, SVG well-formedness (viewBox, no scripts/external), and that every icon path referenced in the built manifest/web exists.
- Browser evidence (saved under `docs/agent/evidence/brand/`): popup-light.png, popup-dark.png, sidepanel-light.png, inline-button-light.png; all manifest icon URLs returned HTTP 200 (no 404s).
- Not tested: Store screenshots (manual UI captures), Firefox AMO / Safari icons (no target build yet), and real per-pixel 16px edge-contrast on all devices (verified programmatically only).
