# KuraCode State (updated: 2026-11-05 — Release Pipeline & Zero Stale Artifacts)

## Snapshot
- Milestone: Automated "Change -> Verify -> Push -> Release" Pipeline | Status: ~85%
- Last green verification: `pnpm verify` & `pnpm ship` (lint 0 errors, types PASS, unit/migration 56/56 PASS, dual build PASS, brand PASS, web-ext lint 0 errors, e2e 9/9 PASS, allow-list PASS) → **All gates green ✔**
- Features registry: 57 verified/hardened of 78 tracked (`pnpm features:report`)
- Package manager: **pnpm 12.16.1** | Node: v22+

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
