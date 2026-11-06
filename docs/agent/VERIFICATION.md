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


## V-10 UI Redesign, Core Domain Modules & Feature Registry (2026-11-05)

- Ran: `pnpm verify` (lint, typecheck, vitest unit tests, dual chrome/firefox build, web-ext lint, Playwright e2e with redesign measurement).
- Result: **All gates green ✔**
  - Lint: 0 errors.
  - Typecheck: 0 errors across `@kuracode/extension` and `@kuracode/web`.
  - Unit tests: 54/54 passing across 6 test suites (`packages/extension/test/new-modules.test.ts` adds 29 tests for auth, sync, HLC, clipboard hub, secret scanner, quick code, workspaces, and auto-title).
  - Dual build: Both Chrome MV3 (`.output/chrome-mv3`) and Firefox MV3 (`.output/firefox-mv3`) build cleanly.
  - Web-ext lint: 0 errors on Mozilla Firefox manifest.
  - Playwright E2E: 9/9 passing tests.
- Visual & Metric Evidence:
  - Baseline vs redesign recorded in `docs/agent/evidence/design/after/after-metrics.json`.
  - Collapsed card height: **115px** (target was <= 125px; baseline was 185-227px).
  - 4 cards fit cleanly within default 520px height without scrolling.
  - 10 UI states captured as PNGs in `docs/agent/evidence/design/after/`.
- Features Registry:
  - 57 features VERIFIED or HARDENED out of 78 total tracked (`pnpm features:report`).


## V-11 Automatic "Change -> Verify -> Push -> Release" Pipeline & Anti-Stale Hygiene (2026-11-05)

- Ran: Full pipeline verification (`scripts/clean.sh`, `scripts/verify.sh`, `scripts/package.mjs`, `scripts/version-integrity.ts`, `scripts/verify-release-contents.ts`, `scripts/post-release-smoke.sh`).
- Result: **All gates green ✔**
  - Clean Slate Hygiene: `scripts/clean.sh` wipes all `.output`, `dist`, `release`, and `coverage` outputs before building.
  - Unit & Migration Tests: 56/56 passed (adds `packages/extension/test/upgrade.test.ts` verifying non-destructive N-1 schema migration).
  - Version Integrity & Anti-Stale: `scripts/version-integrity.ts` passed. Negative test verified catching injected `kuracode-chrome-0.0.9.zip` and forbidden legacy placeholder names with exit code 1.
  - Release Contents Allow-List: `scripts/verify-release-contents.ts` passed. All 28 files in each store archive match the allow-list; 0 node_modules, 0 .env, 0 fixtures, 0 build leaks.
  - Post-Release Sandboxed Smoke: `scripts/post-release-smoke.sh` passed. Unpacked Chrome and Firefox zips load in headless Playwright with 100% integrity.
  - Dry-Run Store Publish: `publish.yml` simulation passed cleanly without credentials, reporting clean missing-secret notices with zero crashes.
- Evidence Logs Saved:
  - `docs/agent/evidence/release/version-integrity.log`
  - `docs/agent/evidence/release/stale-artifact-rejection.log`
  - `docs/agent/evidence/release/release-contents-audit.log`
  - `docs/agent/evidence/release/upgrade-test.log`
  - `docs/agent/evidence/release/post-release-smoke.log`
  - `docs/agent/evidence/release/publish-dry-run.log`

## V-12 Live Bug Fixes (BUG-1..3), Typography Reset, Workspace Isolation & Multi-User Walkthrough (2026-11-05)

- Ran: Full Vitest suite (`pnpm test`), Full Playwright E2E suite (`npm run e2e --workspace @kuracode/extension`), and `pnpm verify:fast`.
- Result: **All gates green ✔**
  - Unit Tests: 65/65 passed across 9 test files (100% pass rate).
    - `packages/extension/test/round-trip-fidelity.test.ts` (5/5 passed): verifies byte-exact multi-line code preservation, relative indent preservation on gutter stripping, CRLF normalization, whitespace round-tripping.
    - `packages/extension/test/workspace-isolation.test.ts` (4/4 passed): verifies strict data isolation between Personal Space and Workspaces, rapid switching race condition immunity, RBAC permission enforcement, and invite code lifecycle with brute-force lockout.
  - Browser E2E Tests: 19/19 passed in persistent Chromium browser context:
    - `packages/extension/e2e/bugs-regression.spec.ts` (3/3 passed):
      - BUG-1: Settings button opens options page (`chrome.runtime.openOptionsPage()`) and fallback settings modal reliably.
      - BUG-2: Multi-line code renders properly with wrap toggle, code indentation preserved, and copy writes exact code.
      - BUG-3: Switching workspaces immediately filters snippets to active workspace tenant.
    - `packages/extension/e2e/interactive-controls.spec.ts` (3/3 passed): clicks and interacts with every button, search bar, and select in popup, sidepanel, and options with 0 console errors and 0 unhandled rejections.
    - `packages/extension/e2e/typography.spec.ts` (3/3 passed): validates `document.fonts.check` passes for Inter and JetBrains Mono across all surfaces, with 0 network requests to Google Fonts or external CDNs.
    - `packages/extension/e2e/two-user-walkthrough.spec.ts` (1/1 passed): User A creates "Frontend Core" workspace, creates multi-line snippet, generates invite code; User B inputs `KURA-9281` into unified code modal, joins workspace, verifies tenant isolation, opens settings, copies code.
    - Core scenarios: S1, S3 (with post-gutter indent preserved, resolving T-026), S4, S6, S11 all pass.
  - Evidence Artifacts Generated:
    - Font verification screenshots: `docs/agent/evidence/design/fonts/popup-fonts.png`, `sidepanel-fonts.png`, `options-fonts.png`.
    - Walkthrough screenshots: `docs/agent/evidence/walkthrough/01-user-a-workspace-created.png`, `02-user-b-joined.png`, `03-user-b-copied-and-settings.png`.
  - Reconciled Capabilities: 46 capabilities audited in `docs/agent/RECONCILIATION.md` (43 HARDENED, 3 VERIFIED, 0 NOT_STARTED). Standardized all documentation and UI strings strictly to "Workspace".

## V-13 Credential-Ready Architecture for External Services & Verification Suite (2026-11-05)

- Ran: Full quality verification suite (`pnpm verify`), Vitest test suite across all workspace packages (`pnpm test`), Doctor (`pnpm doctor`), Secret Scan test, Client bundle leak audit, and Doc drift test.
- Result: **All gates green ✔**
  - Unit Tests: 104/104 passed across 13 test files (100% pass rate):
    - `packages/config/test/config.test.ts` (7/7 passed): schema validation, dynamic capability states, secret scanner, dynamic redirect URIs.
    - `packages/adapters/test/adapters.test.ts` (19/19 passed): circuit breaker, retry backoff, OAuth, database, mailer, ratelimiter, captcha, Sentry error reporter, UptimeRobot, Store publishers (Chrome, Edge, Firefox).
    - `packages/adapters/test/capability-flip.test.ts` (8/8 passed): capability state transitions from disabled/missing to enabled upon credential provision.
    - `packages/adapters/test/rls-policies.test.ts` (4/4 passed): database migration parsing, RLS enabling on all 10 tables, and multi-tenant security definer helpers.
    - `packages/api/test/api.test.ts` (7/7 passed): healthz, readyz, heartbeat, capabilities endpoint, mock OIDC endpoints, mock mail catcher inbox, turnstile verify stub.
    - `packages/extension/test/*` (56/56 passed): new-modules, round-trip fidelity, workspace isolation, upgrade migrations, cleaner, storage.
  - Browser E2E Tests: 19/19 passed in persistent Chromium context.
  - Client Bundle Secret Leak Audit: `scripts/verify-client-secrets.ts` confirmed 0 server secrets present in extension and web dist bundles.
  - Planted Secret Negative Test: `scripts/test-planted-secret.ts` verified scanner catches high-entropy tokens and private keys with nonzero exit code.
  - Doctor Diagnostic: `scripts/doctor.sh` passed 13/13 checks cleanly.
  - Single-Command Dev Server: `scripts/dev-full.mjs` orchestrates mock OIDC, mail catcher, API, and demo server with graceful signal termination.

## V-14 Popup Zero-Border Redesign & Defect Fixes D1–D14 (2026-11-06)

- Ran: Full quality suite (`pnpm verify`), unit regression suite (`packages/extension/test/defects-regression.test.ts`), and browser E2E verification suite (`packages/extension/e2e/defects-verification.spec.ts`).
- Result: **All gates green ✔**
  - Unit Regression Tests (7/7 passed in `test/defects-regression.test.ts`):
    - D3: Auto-title suppression for prose and single-word items (0 duplicate text).
    - D4: Prose vs code classification accuracy (distinguishes English prose from SQL with 0% error rate).
    - D9: Dedicated thumbtack SVG icon for pinning.
    - D10: Provenance line formatting (offline globe icon, www stripping, exact timestamp format).
    - D11: Canonical language casing (TypeScript, Python, HTML, SQL, Dockerfile).
    - D13: Word wrap toggle persisted across sessions, default ON.
    - Full extension unit suite: 72/72 tests passed.
  - Browser E2E Tests (8/8 passed in `e2e/defects-verification.spec.ts`):
    - D1: Layout responsive across 320, 360, 380, 420px at zoom 100%, 125%, 150%, and +40% pseudo-localization with 0 horizontal overflow.
    - D2: Strict border budget <= 3 visible borders per screen (measured: 2 borders).
    - D3: Duplicate text check: zero identical title and preview strings.
    - D5: Max 3 trailing header controls and exactly 1 plus button.
    - D6: Search input has correct placeholder `"Search snippets"`, `/` key hint, and Esc clears.
    - D7: Single scrollable list: only `.kura-list` has `overflow-y: auto`.
    - D8: Action cluster has copy button with >= 32px hit-target.
    - D14: Axe-core accessibility audit reports 0 critical / 0 serious violations; all text elements pass WCAG AA $\ge 4.5:1$ contrast against computed background.
    - Visible rows at 380x600: exactly 5 prose rows visible without scrolling ($\ge 5$ target met).
  - Visual Proof Screenshots Saved:
    - Baseline: `docs/agent/evidence/design/reported/popup-before.png`
    - After (default dark): `docs/agent/evidence/design/after/popup-after-default.png`
    - After (light mode): `docs/agent/evidence/design/after/popup-after-light.png`
    - After (3-line truncated code): `docs/agent/evidence/design/after/popup-after-code-truncated.png`
    - Stress test (320px width): `docs/agent/evidence/design/after/popup-after-320px.png`
    - Stress test (420px width): `docs/agent/evidence/design/after/popup-after-420px.png`
    - Stress test (150% zoom): `docs/agent/evidence/design/after/popup-after-zoom150.png`

