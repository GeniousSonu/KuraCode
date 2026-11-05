# Changelog

All notable changes to KuraCode will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-05

### Added
- **Senior Developer Popup Redesign (`UX-1..UX-10`):**
  - Ultra-compact card layout with 115px height, showing 4+ cards in default 520px viewport.
  - Semantic auto-titles generated dynamically from AST syntax tokens (functions, React hooks, SQL CTEs).
  - Prominent 1-click primary Copy button with 1.2s checkmark animation.
  - Secondary 3-dot overflow menu with Edit, Share, and 8-second undo Trash.
  - Fixed 50px header with KuraCode emerald design tokens (`#00b96c`), live sync indicator, and workplace switcher.
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
- **Workplaces & Collaboration (`WS-1..WS-3`):**
  - Multi-tenant workplace spaces with complete query and storage isolation.
  - Role-Based Access Control (RBAC) matrix enforcing Owner, Admin, Editor, Viewer permissions.
- **Multi-Store Extension Packaging:**
  - Automated release packages for Chrome MV3, Microsoft Edge Add-ons, and Mozilla Firefox AMO.
  - Clean `web-ext lint` with zero errors and CycloneDX SBOM generation.

