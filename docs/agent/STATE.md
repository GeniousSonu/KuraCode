# KuraCode State (updated: 2026-11-05 — Credential-Ready External Services Architecture)

## Snapshot
- Milestone: Credential-Ready External Services (M11 / T-048) | Status: 100% COMPLETE & VERIFIED
- Last green verification: `pnpm verify`, `pnpm test` (104/104 unit PASS), Playwright E2E (19/19 PASS), `pnpm doctor` (13/13 PASS) → **All gates green ✔**
- Features registry: 67 verified/hardened of 88 tracked (`pnpm features:report`)
- Package manager: **pnpm 12.16.1** | Node: v22+

## Recent Accomplishments
1. **Part 1: Configuration Architecture (`packages/config`):**
   - Zod schemas strictly partitioning public build-time values, server secrets, and CI secrets.
   - Capability engine computing 16 capability states (`ENABLED`, `DISABLED_MISSING_CONFIG`, `DISABLED_BY_OWNER`, `DEGRADED`).
   - Dynamic redirect URI generator and client bundle secret leak scanner.
2. **Part 2: Resilient Service Adapters (`packages/adapters`):**
   - Circuit breakers, timeout wrappers, exponential backoff with jitter, zero external vendor SDK dependencies.
   - Adapters with 100% offline fallbacks: OAuth (Google, GitHub, GitLab, Microsoft) + Mock OIDC; Supabase Postgres + MemoryDatabase with RLS; Resend + MockMailCatcher; Upstash Redis + MemoryRateLimiter; Turnstile + StubCaptcha; Sentry (PII-scrubbed) + Noop; UptimeRobot + Mock; Chrome/Edge/Firefox Store publishers + Mock.
3. **Part 3: Edge & Mock Services API (`packages/api`):**
   - Liveness (`/healthz`), readiness (`/readyz`), uptime (`/heartbeat`), capability states (`/api/capabilities`), mock OIDC provider, local mail catcher inbox, and stub Turnstile verify.
4. **Part 4: Database Migrations & Multi-Tenant RLS (`supabase/`):**
   - 10 tables in plain SQL with row-level security enabled and verified across Personal Space and Workspaces.
5. **Part 5: Documentation & Step-by-Step Setup Guides (`docs/setup/`):**
   - Comprehensive guides for all 10 services (`01-github.md` through `10-stores.md`, `11-secret-hygiene.md`, `redirect-uris.md`, master `docs/SETUP.md`).
6. **Part 6: Automation & Developer Tooling:**
   - `pnpm setup:status`, `pnpm setup:test <service>`, `pnpm setup:env`, `pnpm secrets:gh`, `pnpm dev:full`, `pnpm doctor` (13/13 passing).
   - In-app interactive `SetupWizard` dashboard displaying live service capability states with zero secret leakage.

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
