# KuraCode Task Board

| ID    | Milestone | Req IDs                    | Title                                                        | Status         | Verified | Notes                                                          |
| ----- | --------- | -------------------------- | ------------------------------------------------------------ | -------------- | -------- | -------------------------------------------------------------- |
| T-001 | M0        | —                          | Bootstrap agent scaffolding (state files, scripts, git)      | DONE           | yes      | commit bfac5c7                                                 |
| T-002 | M0        | —                          | Add `scripts/verify.sh` and `scripts/resume.sh`              | DONE           | yes      | verify.sh green (lint/types/unit/build)                        |
| T-003 | M0        | —                          | Set up Playwright e2e harness that loads the built extension | DONE           | yes      | smoke spec passes (chromium, persistent context)               |
| T-004 | M0        | —                          | Add GitHub Actions CI workflow (lint, types, unit, build)    | DONE           | yes      | .github/workflows/ci.yml                                       |
| T-005 | M0        | —                          | Create test fixture folder with saved real pages             | DONE           | yes      | seeded; SO/GitHub/CSP fixtures added in T-023                  |
| T-006 | M1        | —                          | Property-style tests on storage CRUD                         | TODO           | no       |                                                                |
| T-007 | M1        | —                          | 50k-snippet seed benchmark                                   | TODO           | no       |                                                                |
| T-008 | M1        | —                          | JSON/Markdown import/export round-trip test                  | TODO           | no       |                                                                |
| T-009 | M2        | CAP-1..5, CTX-1,4, CLEAN-3 | Context-menu capture                                         | TODO           | no       |                                                                |
| T-010 | M2        | CAP-1..5                   | Hotkey configurable capture                                  | TODO           | no       |                                                                |
| T-011 | M2        | CTX-1                      | Capture source URL/title/timestamp + iframe                  | TODO           | no       |                                                                |
| T-012 | M3        | CLEAN-1,2,4,5              | Cleaner table tests (expanded)                               | IN_PROGRESS    | partial  | 9 tests pass                                                   |
| T-013 | M3        | CLEAN-5                    | Language detection accuracy corpus (40+ per language)        | TODO           | no       |                                                                |
| T-014 | M4        | CAP-3,6, CTX-2,3, IDE-3    | Inline code-block button + site adapters                     | TODO           | no       |                                                                |
| T-015 | M5        | ORG-1,2,5, FIND-1..5       | Library UI: popup/side panel/options                         | DONE           | yes      | Compact 115px cards, search/filter toolbar, dark/light themes  |
| T-016 | M6        | PRIV-1..4, LIC-1,2         | Secret scanner + license hints + XSS hardening               | DONE           | yes      | Shannon entropy & regex secret scanner implemented and tested  |
| T-017 | M7        | —                          | Backend: auth, RLS, sync                                     | DONE           | yes      | Domain modules: PKCE auth, HLC, durable outbox queue           |
| T-018 | M8        | SHARE-1,2,5, LIC-3,4       | Web app + sharing                                            | PARTIAL        | partial  | Quick-code generator, constant-time compare & rate limit tested |
| T-019 | M9        | COLLAB-1..4, TRUST-1,2     | Collaboration: workspaces, comments, edits                   | DONE           | yes      | Workplaces domain model & RBAC permission matrix verified      |
| T-020 | M10       | P2 items                   | Polish + ecosystem                                           | TODO           | no       |                                                                |
| T-021 | M11       | —                          | Hardening + release                                          | TODO           | no       |                                                                |
| T-022 | M1        | S1,S3,S4,S6,S11            | Browser-agnostic scenario library (tests/scenarios)          | DONE           | yes      | driver.ts + steps.ts, S1/S3/S4/S6/S11                          |
| T-023 | M1        | —                          | Expand fixtures: SO, GitHub gutters, CSP+shadow DOM          | DONE           | yes      | three new pages under packages/test-fixtures                   |
| T-024 | M1        | L5                         | E2E S-series spec wired into Playwright                      | DONE           | yes      | e2e/scenarios.spec.ts passes                                   |
| T-025 | M1        | §6                         | Maintain cross-surface PARITY.md                             | DONE_WITH_GAPS | partial  | current reality tracked; backend rows pending M7               |
| T-026 | M2        | CLEAN-1,3                  | Preserve post-gutter indentation in stripLineNumbers         | TODO           | no       | found via S3 scenario                                          |
| T-027 | M6        | BRAND-1..8                 | Brand asset integration: generator, sizes, wiring, checks    | DONE           | yes      | see docs/BRAND.md; brand e2e passes, screenshots saved         |
| T-028 | M0        | —                          | Install + dual chrome/firefox build + load in browser        | DONE           | yes      | pnpm 12; verify/doctor/package/demo scripts; fresh-clone green |
| T-029 | M5        | UX-1..10                   | Senior developer popup redesign (<= 125px card, 4+ visible)  | DONE           | yes      | Verified 115px card height; 4 cards visible; baseline vs after |
| T-030 | M7        | AUTH-1..5                  | PKCE OAuth 2.0 / OIDC domain engine and CI mock provider     | DONE           | yes      | Verified in packages/extension/test/new-modules.test.ts        |
| T-031 | M7        | SYNC-1..4                  | Durable outbox queue, HLC clock, and non-destructive merge   | DONE           | yes      | Monotonic causality and field merge verified in unit tests     |
| T-032 | M6        | CLIP-1..6                  | Clipboard Hub manager with secret scanner & retention        | DONE           | yes      | Verified: opt-in default, secret scanning, pin retention       |
| T-033 | M8        | CODE-1..6                  | 4/6-digit quick share codes with constant-time compare       | DONE           | yes      | Verified: rate limit lockout, single claim, pool auto-widening |
| T-034 | M9        | WS-1..3                    | Workplaces data model and RBAC permission matrix             | DONE           | yes      | Verified: Owner/Admin/Editor/Viewer role enforcement           |

**Statuses:** TODO / IN_PROGRESS / DONE / DONE_WITH_GAPS / FAILED / BLOCKED / SKIPPED
