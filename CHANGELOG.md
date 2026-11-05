# Changelog

All notable changes to KuraCode will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-05

### Fixed
- **BUG-1 (Settings button does nothing):**
  - Registered `options_ui: { page: "options.html", open_in_tab: true }` in Chrome and Firefox manifests.
  - Implemented standalone options page in `src/options/` with keyboard navigation and shortcut support (`Alt+S` / `Cmd+,`).
  - Added in-popup settings dialog fallback and wired click/keydown handlers to `chrome.runtime.openOptionsPage()`.
- **BUG-2 (Copied snippet shows on one line only):**
  - Upgraded DOM tree extractor (`extractCodeText`) to preserve newline separation at `<br>`, `<div>`, `<p>`, `<tr>` block boundaries.
  - Upgraded `stripLineNumbers` to detect baseline gutter whitespace and preserve relative code indentation.
  - Updated CSS `.kura-card-code` to `white-space: pre-wrap; overflow-wrap: anywhere;` with surface-persisted Word Wrap toggle and non-selectable line numbers.
- **BUG-3 (Switching workspaces does not filter snippets):**
  - Added `workspaceId: string | null` to Snippet schema; partitioned `listSnippets(workspaceId)`.
  - Rebuilt `WorkspaceManager` with active workspace persistence, skeleton loading, and query token invalidation to prevent switching race conditions.

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

