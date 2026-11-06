# Changelog

All notable changes to KuraCode will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0](https://github.com/GeniousSonu/KuraCode/compare/kuracode-v0.1.0...kuracode-v0.2.0) (2026-11-06)


### Features

* **core:** make KuraCode credential-ready with config layer and adapters ([e9bb3b3](https://github.com/GeniousSonu/KuraCode/commit/e9bb3b36b3ebb4990cf4cdf25d9ebc38fdf09406))
* **design:** fix defects D1-D14 and redesign popup with zero-border typography ([e6d545d](https://github.com/GeniousSonu/KuraCode/commit/e6d545d0a5024410e8364897d528dbf86b549c9c))
* **M6:** brand asset integration — generator, sizes, wiring, checks [T-027] ([ad9a60e](https://github.com/GeniousSonu/KuraCode/commit/ad9a60e240471b16a86423c0911c846f253ecec5))
* **pipeline:** automated release engineering pipeline and anti-stale hygiene ([bc0aa9b](https://github.com/GeniousSonu/KuraCode/commit/bc0aa9b2407ac93deb75bcae2d28faeafe172557))
* **release:** full packaging + self-update system [T-029] ([df9dcda](https://github.com/GeniousSonu/KuraCode/commit/df9dcdaf535750a54a2dc6a7f95075e857e01a25))
* **release:** repo foundations, single-source versioning & multi-store publish ([f42caba](https://github.com/GeniousSonu/KuraCode/commit/f42cabae4003b264faf06b6532f4ef4037906ac0))
* **ui:** senior popup redesign, auth/sync/clipboard core modules & feature registry ([26531c2](https://github.com/GeniousSonu/KuraCode/commit/26531c29b1da3f5ff22f5f6ed3f22d44eff2d1b2))


### Bug Fixes

* **build:** pnpm install + dual chrome/firefox build targets + verify/doctor/demo, package scripts [T-028] ([e8f37d8](https://github.com/GeniousSonu/KuraCode/commit/e8f37d88544c363f3128fcd2d87d60c0b3901e36))
* **core:** fix bugs BUG-1..3, reset typography, and isolate workspaces ([4fd2868](https://github.com/GeniousSonu/KuraCode/commit/4fd2868e0f216fecfcef9ffabfc2bbdb9dc41b8d))
* **e2e:** point extension fixture at .output/chrome-mv3 (was stale ../dist) [T-028] ([184f363](https://github.com/GeniousSonu/KuraCode/commit/184f3630cdb38c4d84f5db93c832b262fc5c5494))
* **lint:** remove unused fileURLToPath import in crx3.mjs ([9009d7f](https://github.com/GeniousSonu/KuraCode/commit/9009d7fbd212d8d1d66daeb050a9190072ae5b5f))
* **release:** guard web-ext lint against Chrome target, regenerate artifacts [T-030] ([d9213a3](https://github.com/GeniousSonu/KuraCode/commit/d9213a315af72ff621c8aef1038b2fb9dc237da7))
* **release:** use inflateRawSync in package validator [T-029] ([50bdda0](https://github.com/GeniousSonu/KuraCode/commit/50bdda082fc6bbe93029f5fe02f1cd5537faa9d6))

## [0.2.0] - 2026-11-06

### Added
- **One-Click Sign-In & Multi-Identity Account Architecture (`AUTH-1..AUTH-5`):**
  - OAuth 2.0 / OIDC with PKCE and state/nonce validation for Google, GitHub, Microsoft, and GitLab.
  - Browser-native identity redirects (`chromiumapp.org` on Chromium, `moz-extension` on Firefox).
  - Background rotating refresh token storage with automatic session reuse revocation.
  - Offline local-first guarantee: 100% of local storage features work with zero accounts or network access.
- **Real-Time Cross-Device Sync Engine (`SYNC-1..SYNC-4`):**
  - Offline-first durable outbox queue with FIFO replay upon reconnection.
  - Monotonic Hybrid Logical Clock (HLC) tracking causality across unsynchronized distributed devices.
  - Non-destructive field-level merge algorithm resolving concurrent snippet edits without data loss.
  - Immutable snippet version history and soft-delete tombstones.
- **Workspaces & Collaboration (`WS-1..WS-3`, `INV-1`):**
  - Multi-tenant workspace spaces with strict storage and query partitioning (`workspaceId`).
  - Role-Based Access Control (RBAC) enforcing Owner, Admin, Editor, and Viewer permission levels.
  - Unified join modal accepting 4-digit quick-codes, 6-digit workspace invites, and deep link URLs.
  - Brute-force rate-limiting lockout protecting join attempts.
- **Clipboard Hub (`CLIP-1..CLIP-6`):**
  - Cross-device clipboard sharing with strict opt-in consent (disabled by default).
  - Configurable retention periods (1h, 24h, 7d, 30d, forever) with per-item pinning.
  - Instant one-click promotion of clipboard entries to permanent library snippets.
- **Quick-Share Codes (`CODE-1..CODE-6`):**
  - 4-digit non-sequential cryptographically secure quick-share codes with 15-minute default TTL.
  - Constant-time code validation preventing timing side-channel attacks.
  - Automatic pool expansion to 6 digits when active codes exceed 5,000.
- **External Services Credential-Ready Architecture (`CRED-1..CRED-10`):**
  - Zero-SDK resilient service adapters (OAuth, Supabase Postgres, Resend, Upstash Redis, Cloudflare Turnstile, Sentry, UptimeRobot, Chrome/Edge/Firefox Store publishers) with circuit breakers, timeouts, retry backoff, and 100% offline local mocks.
  - Plain SQL database migrations (`supabase/migrations/`) with Row-Level Security on 10 tables enforcing tenant isolation.
  - Single-command dev orchestration (`pnpm dev:full`) and interactive `SetupWizard` dashboard.
- **Offline Typography:**
  - Bundled Inter and JetBrains Mono WOFF2 font files locally in `packages/extension/fonts/` and `packages/web/public/fonts/`.
  - Zero external font calls or Google Fonts CDN requests.

### Changed
- **Zero-Border Developer Redesign (`UX-1..UX-14`):**
  - Enforced a strict border budget of $\le 3$ visible bordered elements per view (measured: 2 borders).
  - Card outer borders eliminated in favor of clean spacing and subtle tonal surface separation.
  - Layout restructured into 3 responsive fixed-height rows: 48px header, 56px search row, and 40px chip track.
  - Responsive design passing across 320px, 360px, 380px, 420px widths, 100%–150% browser zoom, and +40% pseudo-localization without overflow.
  - Standardized all UI strings, types, and documentation strictly to "Workspace".

### Fixed
- **Defects D1–D14 (Popup Visual & Interaction Fixes):**
  - **D1 (Toolbar wrapping):** Eliminated text wrap and right-edge button overflow across widths 320px–420px.
  - **D2 (Border clutter):** Reduced visible borders from 8+ down to 2.
  - **D3 (Duplicate text):** Auto-title suppression for prose paragraphs and single-word items; rendered cleanly in a single clamped title line without redundant code boxes.
  - **D4 (Prose vs code misclassification):** Implemented natural language sentence detector (`isProseText`) and tightened SQL pattern matching to achieve 0% misclassification.
  - **D5 (Duplicate `+` button):** Removed header `+` button; limited trailing controls to 3; single primary `+` button in search row.
  - **D6 (Search placeholder):** Standardized placeholder to `"Search snippets"`, added `/` keyboard hint, wired `Esc` to clear query.
  - **D7 (Nested scrollbars):** Removed inner scroll containers; `.kura-list` is the single scrollable view.
  - **D8 (Copy hit target):** Enlarged Copy button to 28px visual / 32px hit-target.
  - **D9 (Pin icon):** Replaced star/pin placeholder with dedicated thumbtack SVG icon.
  - **D10 (Provenance line):** Added 14px offline SVG globe favicon, stripped `www.` prefix, and exact timestamp tooltip.
  - **D11 (Language casing):** Standardized proper canonical casing (`TypeScript`, `Python`, `HTML`, `SQL`, `Dockerfile`, etc.).
  - **D12 (Color discipline):** Green brand accent reserved strictly for primary interactive states, active chips, and sync OK dot.
  - **D13 (Word wrap persistence):** Word wrap toggle persisted across sessions, defaulting to ON.
  - **D14 (Typographic contrast):** Tuned text tokens to meet WCAG AA $\ge 4.5:1$ contrast ratio.
- **BUG-1 (Settings button does nothing):** Registered `options_ui` in manifests, implemented standalone `options.html` page, and wired fallback settings dialog.
- **BUG-2 (Copied snippet shows on one line only):** Preserved newlines at `<br>`, `<div>`, `<p>`, `<tr>` block boundaries; preserved post-gutter code indentation; updated CSS to `white-space: pre-wrap;`.
- **BUG-3 (Switching workspaces does not filter snippets):** Scoped snippet storage by `workspaceId`, added active workspace persistence, and eliminated switching race conditions.

### Security
- Integrated Shannon entropy pre-upload secret scanner blocking sensitive API tokens, private keys, and passwords from network sync.
- Implemented client bundle secret leak scanner (`scripts/verify-client-secrets.ts`) guaranteeing zero server secrets leak into client bundles.
- Strict Content Security Policy (CSP) with zero remote code execution, zero external fonts, and zero inline event handlers.

## [0.1.0] - 2026-11-05 (superseded by 0.2.0)

### Added
- Initial project architecture and single-source versioning system.
- Playwright E2E testing harness for Chromium and Firefox.
- Brand asset generator producing deterministic multi-size icons from master SVG.


### Added
- **External Services Credential-Ready Architecture (`packages/config`, `packages/adapters`, `packages/api`):**
  - Type-safe configuration schemas strictly separating public client values, server-only secrets, and CI/CD secrets.
  - Zero-SDK resilient service adapters (OAuth, Supabase Postgres, Resend, Upstash Redis, Cloudflare Turnstile, Sentry, UptimeRobot, Chrome/Edge/Firefox Store publishers) with circuit breakers, timeouts, retry backoff, and 100% offline local mocks.
  - Plain SQL database migrations (`supabase/migrations/`) with Row-Level Security on 10 tables enforcing strict tenant isolation.
  - Single-command local dev orchestration (`pnpm dev:full`) providing mock OIDC, mail catcher inbox, API server, and demo web app.
  - Developer setup tooling: `pnpm setup:status`, `pnpm setup:test <service>`, `pnpm setup:env`, `pnpm secrets:gh`, `pnpm test:secret-scan`, `pnpm test:client-secrets`, `pnpm test:doc-drift`, and `pnpm doctor` (13/13 passing).
  - In-app interactive `SetupWizard` displaying live capability states with zero secret leakage.
  - 12 comprehensive setup guides under `docs/setup/` and master index in `docs/SETUP.md`.
- **Typography & Visual Identity Reset:**
  - Bundled Inter and JetBrains Mono WOFF2 font files locally in `packages/extension/fonts/` and `packages/web/public/fonts/`.
  - Zero external font calls or Google Fonts CDN requests for total offline compliance.
- **Unified Join Flow & Multi-User Collaboration:**
  - Implemented unified "Enter a code or link" modal accepting 4-digit quick codes, 6-digit workspace invites (`KURA-9281`), and URLs with brute-force lockout.
  - Added 2-user collaboration E2E walkthrough test in real Chromium browser.
- **Infrastructure & Capability Reconciliation:**
  - Complete $0/mo free-tier production stack documented in `docs/INFRASTRUCTURE.md`.
  - 46 capabilities reconciled and verified in `docs/agent/RECONCILIATION.md`.
  - Standardized all terminology strictly to "Workspace".
- **Senior Developer Popup Redesign (`UX-1..UX-10`):**
  - Ultra-compact card layout with 115px height, showing 4+ cards in default 520px viewport.
  - Semantic auto-titles generated dynamically from AST syntax tokens (functions, React hooks, SQL CTEs).
  - Prominent 1-click primary Copy button with 1.2s checkmark animation.
  - Secondary 3-dot overflow menu with Edit, Share, and 8-second undo Trash.
  - Fixed 50px header with KuraCode emerald design tokens (`#00b96c`), live sync indicator, and workspace switcher.
- **Real-Time Sync Engine (`SYNC-1..SYNC-4`):**
  - Offline-first durable outbox queue with FIFO ordered replay.
  - Monotonic Hybrid Logical Clock (HLC) preserving causality across unsynchronized distributed devices.
  - Non-destructive field-level merge algorithm for concurrent snippet edits.
- **Identity & Authentication (`AUTH-1..AUTH-5`):**
  - Standards-compliant OAuth 2.0 / OIDC with PKCE (S256) and state/nonce validation.
  - Browser-native identity flows (`chrome.identity.launchWebAuthFlow` / `browser.identity.launchWebAuthFlow`).
  - Rotating refresh tokens with token reuse detection and background-only token storage.
- **Clipboard Hub (`CLIP-1..CLIP-6`):**
  - Explicit opt-in scratchpad (strictly disabled by default) for sending snippets across devices.
  - Built-in on-device Shannon entropy and regex secret scanner (AWS keys, GitHub tokens, DB passwords).
  - Configurable retention with automatic expired pruning and pin protection.
- **4-Digit Quick-Share Codes (`CODE-1..CODE-6`):**
  - Cryptographically random temporary share codes with constant-time comparison (`timingSafeEqual`).
  - Single-claim enforcement and brute-force exponential lockout rate limiting.
- **Workspaces & Collaboration (`WS-1..WS-3`):**
  - Multi-tenant workspace spaces with complete query and storage isolation.
  - Role-Based Access Control (RBAC) matrix enforcing Owner, Admin, Editor, Viewer permissions.
- **Multi-Store Extension Packaging:**
  - Automated release packages for Chrome MV3, Microsoft Edge Add-ons, and Mozilla Firefox AMO.
  - Clean `web-ext lint` with zero errors and CycloneDX SBOM generation.
