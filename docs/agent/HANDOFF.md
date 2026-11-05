# Handoff (2026-11-05T10:45:00Z)

## Summary of Accomplishments

### 1. Automatic "Change -> Verify -> Push -> Release" Pipeline (Part 1 - 7)
- **Single Command Ship (`scripts/ship.sh` / `pnpm ship`):** Master automation pipeline running: Pre-flight secret checks -> Clean stale outputs -> Frozen install -> Brand assets build -> Full quality gates -> Packaging -> Archive allow-list audit -> Version integrity validation -> Feature health report -> Conventional Commit -> Push.
- **Fast Pre-Push Gate (`scripts/verify-fast.sh` / `.husky/pre-push`):** Runs lint, typecheck, vitest unit tests, dual MV3 build, and version integrity in $< 10$ seconds so broken code can never be pushed from any machine.
- **Pre-Commit Secret Scanner (`.husky/pre-commit`):** Blocks any commit attempting to stage `.env`, private keys, or API tokens.
- **Anti-Stale Hygiene (`scripts/clean.sh` / `pnpm clean`):** Wipes all `.output`, `dist`, `release`, and test directories before every build so no stale files can leak into release packages.

### 2. Zero-Stale-Artifact & Version Integrity System
- **Single-Source Version Integrity (`scripts/version-integrity.ts`):** Enforces 100% synchronization across `package.json`, manifests, `CHANGELOG.md`, and release zip names. Scans all built output to forbid stale version numbers and legacy product names.
- **Negative & Positive Proof:** Tested and verified that injecting a stale artifact (`kuracode-chrome-0.0.9.zip`) or legacy placeholder name immediately fails with exit code 1 (`docs/agent/evidence/release/stale-artifact-rejection.log`).
- **Release Contents Allow-List (`scripts/verify-release-contents.ts`):** Audits all entries inside `kuracode-chrome-*.zip`, `kuracode-edge-*.zip`, and `kuracode-firefox-*.zip` against an explicit regex allow-list (0 node_modules, 0 .env, 0 fixtures, 0 build leaks).
- **Post-Release Sandboxed Smoke Test (`scripts/post-release-smoke.sh`):** Unpacks Chrome and Firefox release zips into temporary directories and loads them in headless Playwright to verify 100% runtime integrity.
- **Upgrade & Migration Test (`packages/extension/test/upgrade.test.ts`):** Verifies non-destructive data migration from N-1 (v0.0.9) schema to current v0.1.0 schema.

### 3. CI/CD Workflows & Safety Rails
- `.github/workflows/ci.yml`: Full Ubuntu quality gate + macOS and Windows build smoke matrix.
- `.github/workflows/nightly.yml`: Scheduled cross-browser E2E (Chromium + Firefox), high-severity dependency audit (`pnpm audit`), and policy verification.
- `.github/workflows/release-please.yml`: Configured with `release-please-config.json` and `.release-please-manifest.json` for automated release PRs.
- `.github/workflows/release.yml`: Rebuilds cleanly from scratch on tag `v*`, runs all gates, packages artifacts, generates SHA256SUMS and CycloneDX SBOM, attaches to GitHub Release, and enforces the `RELEASE_FROZEN` safety switch.
- `.github/workflows/publish.yml`: Independent store publication jobs for Chrome Web Store, Edge Add-ons, and Mozilla AMO in protected GitHub Environments with dry-run mode and clean missing-secret handling.
- `.github/workflows/cleanup.yml`: Automated cleanup of stale CI runs and draft releases older than 30 days while preserving all tagged releases and the last 3 stable versions.

### 4. Documentation & Operational Runbooks
- `docs/RELEASING.md`: Complete release engineering policy, lifecycle diagram, freeze switch, and rollback procedures.
- `docs/MAINTENANCE.md`: Exact GitHub branch protection settings, auto-merge configuration, and protected environments.
- `docs/agent/WORKFLOW.md`: Daily SOP (`pnpm sync` -> `pnpm verify:fast` -> `pnpm ship`).
- `docs/agent/RELEASE_LOG.md`: Cryptographic checksums and release history.
- `docs/agent/NEEDS_HUMAN.md`: Click-by-click instructions for branch protection, auto-merge, environments, and freeze variable.
- `README.md`: Added CI quality gate badge, release badge, license badge, and direct download links to the latest release assets.

### 5. Live Bug Fixes (BUG-1, BUG-2, BUG-3) & UI Reset
- **BUG-1 (Settings button does nothing):** Added `options_ui: { page: "options.html", open_in_tab: true }` to manifests, built dedicated `src/options/` page, wired in-popup settings dialog fallback, attached click/keyboard (`Enter`/`Space`) and shortcut (`Alt+S` / `Cmd+,`) listeners to `chrome.runtime.openOptionsPage()`. Audited all controls in popup, sidepanel, and options with 0 errors (`e2e/interactive-controls.spec.ts`).
- **BUG-2 (Copied snippet shows on one line only):** Rewrote DOM extraction (`extractCodeText`) to preserve newlines at `<br>`, `<div>`, `<p>`, `<tr>` boundaries; upgraded `stripLineNumbers` to calculate baseline gutter padding and preserve relative code indentation (resolving T-026); updated CSS `.kura-card-code` to `white-space: pre-wrap; overflow-wrap: anywhere;` with expandable height; added surface-persisted Word Wrap toggle (`.kura-wrap-toggle`); verified 100% round-trip fidelity in unit tests (`test/round-trip-fidelity.test.ts`) and Playwright E2E (`e2e/bugs-regression.spec.ts`).
- **BUG-3 (Switching workspaces does not change snippets shown):** Added `workspaceId: string | null` to Snippet schema; partitioned `listSnippets(workspaceId)`; rebuilt `WorkspaceManager` with active workspace persistence, skeleton loading states, and async query token cancellation to prevent race conditions during rapid switching. Verified in `test/workspace-isolation.test.ts` and `e2e/bugs-regression.spec.ts`.
- **Typography & Visual Reset:** Installed `@fontsource/inter` and `@fontsource/jetbrains-mono`, bundled optimized WOFF2 font files locally in `packages/extension/fonts/` and `packages/web/public/fonts/`; strictly 0 Google Fonts or external CDN requests; verified via `e2e/typography.spec.ts` with font screenshots in `docs/agent/evidence/design/fonts/`.
- **Unified Join Flow & Multi-User Collaboration:** Implemented unified "Enter a code or link" modal accepting 4-digit quick codes, 6-digit workspace invites (`KURA-9281`), and join URLs with rate-limiting brute-force lockout (5 attempts). Verified complete User A $\rightarrow$ Invite $\rightarrow$ User B $\rightarrow$ Sync $\rightarrow$ Settings walkthrough in `e2e/two-user-walkthrough.spec.ts` with 3 screenshots in `docs/agent/evidence/walkthrough/`.
- **Infrastructure & Reconciliation:** Documented complete $0/mo free-tier production stack in `docs/INFRASTRUCTURE.md` (Cloudflare Pages/Workers/Turnstile, Supabase Postgres 16/Auth/Realtime, Upstash Redis, Resend); audited 46 capabilities in `docs/agent/RECONCILIATION.md`; standardized all UI and docs strictly to "Workspace".

### 6. External Services Credential-Ready Architecture (CRED-1..10)
- **Configuration & Secret Isolation (`packages/config`):** Zod schemas strictly partition public build-time values, server secrets, and CI secrets. Client bundle secret scanner guarantees 0 server keys leak into client artifacts. Dynamic capability evaluation categorizes 16 services as `ENABLED`, `DISABLED_MISSING_CONFIG`, `DISABLED_BY_OWNER`, or `DEGRADED`.
- **Zero-SDK Vendor Independence & Resilient Adapters (`packages/adapters`):** All external integrations implemented via standard Web fetch with circuit breakers, timeouts, retry with jitter, and capability auto-detection. Includes full local mocks for offline development without internet access or credentials.
- **Database Migrations & Multi-Tenant RLS (`supabase/`):** 10 tables in plain SQL with row-level security enabled and verified across Personal Space and Workspaces.
- **Edge API & Mock Provider (`packages/api`):** Edge service providing `/healthz`, `/readyz`, `/heartbeat`, `/api/capabilities`, local mock OIDC provider, and mock mail catcher inbox.
- **Developer Tooling & Interactive UI:** Added `pnpm setup:status`, `pnpm setup:test <service>`, `pnpm setup:env`, `pnpm secrets:gh`, `pnpm dev:full`, and interactive `SetupWizard` in the web application.
- **Documentation & Setup Guides (`docs/setup/`):** Complete per-service setup manuals (`01-github.md` through `10-stores.md`, `11-secret-hygiene.md`, `redirect-uris.md`, `docs/SETUP.md`).

## Verification Evidence Saved
- `docs/agent/evidence/release/version-integrity.log`
- `docs/agent/evidence/release/stale-artifact-rejection.log`
- `docs/agent/evidence/release/release-contents-audit.log`
- `docs/agent/evidence/release/upgrade-test.log`
- `docs/agent/evidence/release/post-release-smoke.log`
- `docs/agent/evidence/release/publish-dry-run.log`
- `docs/agent/evidence/design/fonts/popup-fonts.png`
- `docs/agent/evidence/design/fonts/sidepanel-fonts.png`
- `docs/agent/evidence/design/fonts/options-fonts.png`
- `docs/agent/evidence/walkthrough/01-user-a-workspace-created.png`
- `docs/agent/evidence/walkthrough/02-user-b-joined.png`
- `docs/agent/evidence/walkthrough/03-user-b-copied-and-settings.png`

## What Is Next
1. Owner configures GitHub repository settings (branch protection & auto-merge) per `docs/agent/NEEDS_HUMAN.md`.
2. Connect store developer credentials to GitHub Environments (`chrome-web-store`, `edge-addons`, `firefox-amo`).
3. Connect Supabase production backend for live cross-device sync.
