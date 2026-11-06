# KuraCode State (updated: 2026-11-06 — Minor Release v0.2.0)

## Snapshot
- Milestone: Minor Release v0.2.0 (REL-1..5 / T-050) | Status: 100% COMPLETE & VERIFIED
- Current canonical version: **v0.2.0** (all 5 packages, manifests, web app, API headers, and docs in 100% sync)
- Last green verification: `pnpm verify`, `pnpm test` (112/112 unit PASS), Playwright E2E (28/28 PASS), `pnpm doctor` (13/13 PASS) → **All gates green ✔**
- Features registry: 77 verified/hardened of 88 tracked (`pnpm features:report`)
- Package manager: **pnpm 12.16.1** | Node: v22+

## Recent Accomplishments
1. **Defects D1–D14 Root Cause Fixes & Verification:**
   - **D1 (Toolbar Overflow):** Rebuilt layout into 3 distinct functional rows (48px header, 56px search, 40px chips) with min-width/nowrap rules. Passes across 320, 360, 380, 420px, 100-150% zoom, and +40% pseudo-localization.
   - **D2 (Border Clutter):** Enforced zero-border design system with strictly 2 visible borders (<= 3 budget), eliminating card borders.
   - **D3 (Duplicate Text):** Upgraded `generateReadableTitle` so prose paragraphs and single-word items suppress duplicate titles and render cleanly in a single clamped title line.
   - **D4 (Prose vs Code Heuristic):** Implemented `isProseText` natural language sentence detection and tightened SQL regex patterns (`SELECT...FROM`, `INSERT INTO`), achieving 0% error rate across test corpus.
   - **D5 (Duplicate `+` Buttons):** Removed duplicate `+` button from header; strictly 3 trailing controls (sync dot, settings gear, account icon); single primary `+` paste button in search bar.
   - **D6 (Search Bar Polish):** Placeholder changed to `"Search snippets"`, `/` key hint, and `Escape` clears query.
   - **D7 (Nested Scrollbars):** Eliminated nested scrollbars; only `.kura-list` has `overflow-y: auto`.
   - **D8 (Tiny Copy Target):** Replaced tiny buttons with 28px visual / 32px hit-target Copy button and More actions button.
   - **D9 (Pin Icon):** Replaced star/pin placeholder with dedicated thumbtack SVG icon.
   - **D10 (Provenance Line):** Clean 14px offline SVG globe favicon, domain without `www.`, exact timestamp with tooltip, and plain text language badge. Zero 3rd-party network requests.
   - **D11 (Language Casing):** Proper-case language formatting (`TypeScript`, `Python`, `HTML`, `SQL`, `Dockerfile`, etc.).
   - **D12 (Color Discipline):** Green brand accent reserved strictly for primary actions, active chips, focus rings, and sync status.
   - **D13 (Word Wrap Persistence):** Word wrap toggle persisted across sessions, defaulting to ON.
   - **D14 (Typographic Contrast):** WCAG AA $\ge 4.5:1$ contrast achieved across all text tokens against surface backgrounds.
2. **Visual Proof & Evidence:**
   - All visual proof screenshots generated and saved in `docs/agent/evidence/design/after/`: default, light, 3-line code truncation, 320px minimum width, 420px maximum width, and 150% zoom.
   - Unit regression suite (`test/defects-regression.test.ts`) and Playwright E2E suite (`e2e/defects-verification.spec.ts`) passing 100%.

## Pipeline & Anti-Stale Guarantees
- Single Command Ship: `pnpm ship "<msg>"` cleans outputs, verifies supply chain, tests, packages, audits allow-list, commits, and pushes.
- Clean Slate Builds: `scripts/clean.sh` wipes `.output`, `dist`, `release`, and `coverage` prior to building. No stale artifacts are ever reused or shipped.
- Single-Source Version Integrity: `scripts/version-integrity.ts` binds `package.json`, manifests, `CHANGELOG.md`, and release zips. Forbids stale version numbers & legacy product names.
- Release Archive Allow-List: `scripts/verify-release-contents.ts` enforces exact allow-list on extension zips (0 node_modules, 0 .env, 0 fixtures, 0 build leaks).
- Sandboxed Post-Release Smoke: `scripts/post-release-smoke.sh` unpacks Chrome and Firefox zips and loads them in headless Playwright with 100% integrity.
- CI/CD Matrix: `ci.yml` (Ubuntu full gate + macOS/Windows smoke), `nightly.yml`, `release-please.yml`, `release.yml` (with `RELEASE_FROZEN` safety switch), `publish.yml` (protected environments: Chrome, Edge, Firefox).

## Verification Evidence
- Release Evidence: `docs/agent/evidence/release/` (stale-artifact-rejection.log, version-integrity.log, release-contents-audit.log, upgrade-test.log, post-release-smoke.log, publish-dry-run.log).
- Design Evidence: `docs/agent/evidence/design/after/` (115px card height, 4 visible cards).
- Ops & Governance Docs: `docs/RELEASING.md`, `docs/PUBLISHING.md`, `docs/MAINTENANCE.md`, `docs/agent/WORKFLOW.md`, `docs/agent/NEEDS_HUMAN.md`.

## Next Steps
1. Owner enables branch protection & auto-merge per `docs/agent/NEEDS_HUMAN.md`.
2. Connect production store API credentials in GitHub Environments (`chrome-web-store`, `edge-addons`, `firefox-amo`).
3. Connect Supabase production project for live real-time sync WebSocket transport.
