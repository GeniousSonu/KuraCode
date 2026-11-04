# KuraCode State (updated: 2026-11-04 by codvian — build-fix session T-028)

## Snapshot

- Current milestone: M0 foundations DONE (verified from a fresh clone) | Overall: ~45%
- Last green commit: `184f363` (fix e2e fixture path) — `git status` clean
- Gate results (fresh clone, no spaces, `scripts/verify.sh`): lint PASS (0 errors)
  | typecheck PASS | unit 11/11 | build chrome PASS | build firefox PASS |
  brand PASS | web-ext lint 0 errors | e2e 7/7 → **All gates green ✔**
- Package manager: **pnpm 12.16.1** (root `packageManager`). Build scripts use
  `pnpm --filter`. See DECISIONS #1/#7.
- Extension build: esbuild via `build.mjs --target {chrome,firefox}` →
  `.output/{chrome,firefox}-mv3/`.

## Done / working software (all verified this session)

- M0 Foundations: **DONE** — monorepo, strict TS, eslint, vitest, dual-target
  build, Playwright e2e (7/7), own, `verify.sh`/`doctor.sh`/`resume.sh`,
  `package.mjs` (zips), `server-demo.mjs`, fixtures.
- Install/load: `pnpm install --frozen-lockfile` exit 0 (no ignored-builds);
  chrome + firefox outputs build and contain a valid `manifest.json`.
- M3 cleaning: cleaner unit tests 9/9; language corpus target passed.
- Brand (T-027): generator + checks wired into build; brand check PASS.

## In progress

- none (working tree clean; committed at `184f363`).

## Next 5 tasks

T-006 (storage CRUD property tests), T-007 (50k seed), T-008 (import/export),
T-013 (language corpus breadth), T-014 (real-site capture fixtures).

## Blocked / needs human

- Nothing blocks building/loading. (Owner still must create + push the GitHub
  repo if not done: `git push origin main`.)

## Top 3 risks right now

1. Real-world capture (context menu / hotkey via a real right-click) not yet
   exercised end-to-end; e2e covers S1/S3/S4/S6/S11.
2. Test fixtures minimal — cleaner/accuracy not measured on a real corpus
   (T-014).
3. Path contains a space — works now, but is fragile; recommended move to
   `~/sniphub` (see IMPROVEMENTS).

## Commands (verified)

- Verify all: `pnpm verify` (`bash scripts/verify.sh`)
- Doctor: `pnpm doctor`
- Build ext: `pnpm build:chrome` / `pnpm build:firefox`
- e2e ext: `pnpm --filter @kuracode/extension exec playwright test`
- Release zips: `pnpm package` → `release/sniphub-*.zip`
- Demo page: `pnpm demo` → http://localhost:7331/demo.html
