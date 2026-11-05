# KuraCode State (updated: 2026-11-05 by codvian — sync & rebase session)

## Snapshot

- Current milestone: M0 Foundations + Release Foundations DONE | Overall: ~55%
- Last green commit: HEAD (local rebased cleanly on origin/main `f42caba`)
- Gate results (`pnpm verify`): lint PASS (0 errors) | typecheck PASS |
  unit 25/25 PASS | build chrome PASS | build firefox PASS | brand PASS |
  web-ext lint 0 errors | e2e 7/7 PASS → **All gates green ✔**
- Package manager: **pnpm 12.16.1**
- Build outputs: `.output/chrome-mv3/` and `.output/firefox-mv3/` (version 0.1.0)

## Quality Scorecard

- P0/P1 features verified: CAP-1..4, CTX-1..4, CLEAN-1..4, PRIV-1..4
- Build targets: Chrome MV3, Firefox MV3 (both fully verified)
- Unit tests: 25/25 passing across 5 test suites
- e2e tests: 7/7 passing in Playwright (S1, S3, S4, S6, S11, brand, smoke)
- Manifests: strict target validation pass; AMO web-ext 0 errors
- Security: zero eval, closed Shadow DOM, strict CSP, no telemetry

## Synced from Home (`f42caba`)

Commit `f42caba` brought in extensive repo foundations and multi-store configs:
1. CI workflows: GitHub Actions CI, CodeQL, release-please, secret-scanning.
2. Repo standards: .editorconfig, .env.example, .gitattributes, Husky hooks, Commitlint.
3. Policy docs: CODE_OF_CONDUCT, CONTRIBUTING, LICENSE, PRIVACY, SECURITY, SUPPORT.
4. Store listings: Chrome Web Store, Edge Add-ons, Firefox AMO en listings.
5. Store policy audit: comprehensive compliance matrix (STORE_POLICY_AUDIT.md).
6. Packaging & versioning: single-source versioning scripts & unit tests.

## Local Additions Preserved & Rebased

1. CRX3 and self-update package tooling (`scripts/crx3.mjs`, `scripts/release.mjs`).
2. Package validation & web-ext lint guards (`scripts/validate-package.mjs`).
3. Multi-machine sync & finish scripts (`scripts/sync.sh`, `scripts/finish-session.sh`).
4. Fixed unused import lint issue in `scripts/crx3.mjs`.

## Next Steps

1. Feature registry initialization (Part 1 of PRD feature completion OS).
2. Deepen storage CRUD property tests (T-006) and 50k benchmark (T-007).
3. Expand language corpus and real-site capture fixtures (T-013, T-014).

## Commands

- Verify all: `pnpm verify`
- Sync session: `pnpm sync`
- Finish session: `pnpm finish`
- Demo page: `pnpm demo`
