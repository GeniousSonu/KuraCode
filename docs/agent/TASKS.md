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
| T-015 | M5        | ORG-1,2,5, FIND-1..5       | Library UI: popup/side panel/options                         | PARTIAL        | partial  | UI built, search/axe/e2e pending                               |
| T-016 | M6        | PRIV-1..4, LIC-1,2         | Secret scanner + license hints + XSS hardening               | TODO           | no       |                                                                |
| T-017 | M7        | —                          | Backend: auth, RLS, sync                                     | TODO           | no       |                                                                |
| T-018 | M8        | SHARE-1,2,5, LIC-3,4       | Web app + sharing                                            | PARTIAL        | partial  | web viewer built, share/visibility pending                     |
| T-019 | M9        | COLLAB-1..4, TRUST-1,2     | Collaboration: workspaces, comments, edits                   | TODO           | no       |                                                                |
| T-020 | M10       | P2 items                   | Polish + ecosystem                                           | TODO           | no       |                                                                |
| T-021 | M11       | —                          | Hardening + release                                          | TODO           | no       |                                                                |
| T-022 | M1        | S1,S3,S4,S6,S11            | Browser-agnostic scenario library (tests/scenarios)          | DONE           | yes      | driver.ts + steps.ts, S1/S3/S4/S6/S11                          |
| T-023 | M1        | —                          | Expand fixtures: SO, GitHub gutters, CSP+shadow DOM          | DONE           | yes      | three new pages under packages/test-fixtures                   |
| T-024 | M1        | L5                         | E2E S-series spec wired into Playwright                      | DONE           | yes      | e2e/scenarios.spec.ts passes                                   |
| T-025 | M1        | §6                         | Maintain cross-surface PARITY.md                             | DONE_WITH_GAPS | partial  | current reality tracked; backend rows pending M7               |
| T-026 | M2        | CLEAN-1,3                  | Preserve post-gutter indentation in stripLineNumbers         | TODO           | no       | found via S3 scenario                                          |
| T-027 | M6        | BRAND-1..8                 | Brand asset integration: generator, sizes, wiring, checks    | DONE           | yes      | see docs/BRAND.md; brand e2e passes, screenshots saved         |
| T-028 | M0        | —                          | Install + dual chrome/firefox build + load in browser        | DONE           | yes      | pnpm 12; verify/doctor/package/demo scripts; fresh-clone green |

**Statuses:** TODO / IN_PROGRESS / DONE / DONE_WITH_GAPS / FAILED / BLOCKED / SKIPPED

**Last verified (M1 test scaffolding):** lint/typecheck/unit/build green; e2e S-series 6/6 on Chromium (see VERIFICATION.md V-6).
