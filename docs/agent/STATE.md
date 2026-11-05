# KuraCode State (updated: 2026-11-05 — UI Redesign & Core Modules)

## Snapshot
- Current milestone: UX Redesign + Core Auth/Sync/Clipboard Domain Modules | Status: ~75%
- Last green verification: `pnpm verify` (lint 0 errors, typecheck PASS, unit 54/54 PASS, dual MV3 build PASS, brand PASS, web-ext lint 0 errors, e2e 9/9 PASS) → **All gates green ✔**
- Features registry: 57 verified/hardened of 78 tracked (`pnpm features:report`)
- Package manager: **pnpm 12.16.1** | Node: v20+

## Quality Scorecard
- Popup Redesign (UX-1..10): Card height down to **115px** (<= 125px target); 4 cards visible; semantic auto-titles; prominent primary Copy button; 3-dot overflow menu with 8s undo Trash.
- Visual Evidence: Baseline vs redesign captured across all 10 states in `docs/agent/evidence/design/after/`.
- Domain Modules:
  - `auth.ts`: PKCE (S256), state/nonce validation, mock OIDC provider (AUTH-1..5).
  - `sync-engine.ts` & `hlc.ts`: Monotonic HLC timestamps, durable outbox, field merge (SYNC-1..4).
  - `clipboard-hub.ts`: Opt-in default, secret scanning, pin retention, convert-to-snippet (CLIP-1..6).
  - `quick-code.ts`: 4/6-digit random codes, constant-time compare, rate limiting (CODE-1..6).
  - `workplaces.ts`: Multi-tenant isolation, strict RBAC permission matrix (WS-1..3).
  - `auto-title.ts`: AST token heuristics, never emits raw code as title (UX-2).
  - `date-formatter.ts` & `text-fragment.ts`: Locale timelines & Scroll-to-text links (META-2,3).
- Test Coverage: 54/54 unit tests passing; 9 Playwright e2e scenarios passing.

## Verification Evidence
- Design Metrics: `docs/agent/evidence/design/after/after-metrics.json`
- Test Suites: `packages/extension/test/new-modules.test.ts`
- Feature Registry: `docs/agent/features.json` & `docs/agent/FEATURES.md`
- Policy & Store Audit: `docs/STORE_POLICY_AUDIT.md`, `docs/agent/WEBSITE_UPDATE_NOTES.md`

## Next Steps
1. Wire Supabase cloud client credentials from `NEEDS_HUMAN.md` into production sync transport.
2. Web app and PWA receiver UI integration for quick-share codes.
3. End-to-End Encryption (E2EE) WebCrypto AES-256-GCM derivation module (CLIP-7).
