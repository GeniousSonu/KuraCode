# BUILD DIAGNOSIS

Session: 2026-11-04 (task T-028 — install/build/load). Environment: Linux, Node v22.23.2 (LTS), pnpm 12.16.1 (store v11), npm 10.9.8. Workspace path contains a space: `/home/dayshift/Pictures/extension tool`.

## Findings

| # | Problem | Root cause | Fix | Result |
|---|---|---|---|---|
| 1 | `ERR_PNPM_IGNORED_BUILDS` on install (esbuild@0.21.5 & 0.24.2) | `pnpm-workspace.yaml` had an invalid `allowBuilds: esbuild: false` field; the lockfile had baked in the "ignored build" state | Ran `pnpm approve-builds --all` (wrote `allowBuilds: esbuild: true` / `sharp: true`); corrected `pnpm-workspace.yaml`; removed the (now-ignored) `pnpm.onlyBuiltDependencies` from package.json | install exits 0, no ignored-builds error, esbuild postinstall runs |
| 2 | `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` in packages/extension | Owner invoked `pnpm -F extension build:chrome`/`build:firefox` — those scripts did not exist in any package | Added `build:chrome`, `build:firefox`, `dev:chrome`, `dev:firefox` to `@kuracode/extension`; added matching root `pnpm` scripts | both build scripts exist and run |
| 3 | No Firefox build target | Only a Chrome `dist/` output existed | Added `manifest.firefox.json` (MV3, `browser_specific_settings.gecko.id`, background `scripts`), `build.mjs --target firefox` → `.output/firefox-mv3` | both outputs build |
| 4 | Root `npm run … --workspace` broke | `--workspace` is an npm flag; package.json no longer declares `workspaces` (moved to `pnpm-workspace.yaml`) | Rewrote root scripts to pnpm `--filter` syntax | `pnpm typecheck`/`test`/… work |
| 5 | Lint scanned built `.output/` bundles | eslint ignore list lacked `.output` | Added `**/.output/**` to eslint ignores | lint clean |
| 6 | Fresh-clone e2e failed ("extension service worker not available") | `e2e/extension.ts` pointed at legacy `../dist`; fresh clones have no `dist/` (only `.output/chrome-mv3`) | Updated fixture to `.output/chrome-mv3` | 7/7 e2e pass in clean clone |

## Verified (fresh clone, no spaces)
`pnpm install --frozen-lockfile` exit 0 · `pnpm lint` 0 errors · typecheck pass · unit 11/11 · build chrome+firefox exit 0 · brand check pass · web-ext lint 0 errors · e2e 7/7. Full `scripts/verify.sh` → **All gates green ✔**.

## Commands that work
```
pnpm install
pnpm build:chrome        # → packages/extension/.output/chrome-mv3/manifest.json
pnpm build:firefox       # → packages/extension/.output/firefox-mv3/manifest.json
pnpm verify              # full gate
pnpm doctor              # env health check
pnpm package             # zips → release/sniphub-{chrome,firefox}-0.1.0.zip
pnpm demo                # serve test-pages/demo.html on :7331
```
