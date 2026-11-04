# Handoff (2025-11-04T19:00:00Z)

- Working on: T-027 (brand asset integration) — code + checks + docs done, about to commit.
- Done: `scripts/build-icons.ts` (sharp) + `scripts/check-brand.mjs`; `npm run brand:build`/`brand:check`; wired extension manifest icons + action icons (light/dark), web favicon/PWA/OG set; brand e2e spec; `docs/BRAND.md`; evidence screenshots under `docs/agent/evidence/brand/`.
- Verified: `bash scripts/verify.sh` all green — lint (0 errors), typecheck, unit 11/11, build, brand check, e2e 7/7 (incl. brand spec, icon URLs 200).
- Left to do (next 5): T-006 property tests on storage CRUD; T-007 50k seed benchmark; T-008 import/export round-trip; T-013 language corpus (already fixed, but keep widening); T-014 inline button site adapters.
- Next command: `bash scripts/verify.sh` (after commit) or `git status`.
- Gotchas: run node TS via `node --experimental-strip-types` (type:module at root); brand build runs via `npm run brand:build`; extension build copies `brand/generated/{extension,action}` into `dist/`; headed Chromium required for e2e (xvfb-run when no display).
- Uncommitted changes: yes — this entire brand integration + docs (about to commit).
