# KuraCode State (updated: 2026-11-05 — Live Bugs Fixed, Typography Reset, Workspaces & Join Flow)

## Snapshot
- Milestone: Live Bug Fixes (BUG-1..3), Typography Reset, Workspaces & Join Flow | Status: 100% COMPLETE & VERIFIED
- Last green verification: `pnpm verify:fast`, `pnpm test` (65/65 unit PASS), Playwright E2E (19/19 PASS), `pnpm verify` & `pnpm ship` → **All gates green ✔**
- Features registry: 57 verified/hardened of 78 tracked (`pnpm features:report`)
- Package manager: **pnpm 12.16.1** | Node: v22+

## Recent Accomplishments
1. **BUG-1 Fixed:** Options page registered in manifests, built to `.output/*/options.html`, wired to `chrome.runtime.openOptionsPage()`, interactive audit clean across popup, sidepanel, options.
2. **BUG-2 Fixed:** DOM text extraction converts block boundaries to `\n`; `stripLineNumbers` preserves relative indentation; CSS `.kura-card-code` updated with `white-space: pre-wrap; overflow-wrap: anywhere;` and surface-persisted Word Wrap toggle.
3. **BUG-3 Fixed:** Snippets partitioned by `workspaceId`; `WorkspaceManager` with active workspace persistence, skeleton loading, and query token invalidation to eliminate race conditions.
4. **Typography Reset:** Locally bundled Inter & JetBrains Mono WOFF2 fonts; 0 Google Fonts or external CDN requests (offline-first & store compliant).
5. **Unified Join Flow & Walkthrough:** One modal for 4-digit codes, 6-digit invites (`KURA-9281`), and URLs with rate-limiting lockout; 2-user collaboration walkthrough passing in Playwright.
6. **Infrastructure & Reconciliation:** Documented $0/mo free-tier stack in `docs/INFRASTRUCTURE.md`; audited 46 capabilities in `docs/agent/RECONCILIATION.md`; standardized strictly to "Workspace".

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
