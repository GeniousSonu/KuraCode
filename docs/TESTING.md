# KuraCode Testing Guide

Verified commands (Node 22 LTS, pnpm 12.16.1, Linux).

## Quick reference

```bash
# Full gate: lint → typecheck → unit → build chrome+firefox → brand → web-ext → e2e
pnpm verify            # or: bash scripts/verify.sh

# Individual gates
pnpm lint
pnpm typecheck
pnpm test                                       # unit (vitest)
pnpm build:chrome                               # esbuild → .output/chrome-mv3
pnpm build:firefox                              # esbuild → .output/firefox-mv3
pnpm brand:check                                # asset dimension/SVG/build-ref checks
pnpm --filter @kuracode/extension exec playwright test   # e2e (real Chromium)
npx web-ext lint --source-dir packages/extension/.output/firefox-mv3
```

## Test layers

| Layer | Tool | Where | What it proves |
|---|---|---|---|
| Static | ESLint (flat config) | `eslint .` | no-undef, unused vars, TS recommended |
| Static | `tsc --noEmit` | extension + web | type safety |
| Unit | Vitest | `packages/extension/test/` | cleaner (9 cases), language corpus (85%+ target) |
| Build | esbuild | `.output/{chrome-firefox-mv3}` | MV3 bundles, manifest, icons |
| Brand | `scripts/check-brand.mjs` | `brand/generated/` | PNG dimensions, SVG well-formedness, refs exist |
| Lint(FF) | web-ext lint | firefox output | manifest errors = 0 |
| e2e | Playwright (headed Chromium, extension loaded) | `e2e/` | S1/S3/S4/S6/S11, smoke, brand icons 200 |

## e2e details

Requires a display (or `xvfb-run`). Loads the **built** unpacked extension from
`.output/chrome-mv3` in a persistent headed context. Fixture server on
`:8931` serves real saved pages (`packages/test-fixtures/fixtures/`): Stack
Overflow, GitHub, strict-CSP shadow-DOM.

```bash
# build + run all e2e
pnpm --filter @kuracode/extension exec playwright test
```

## Known limitations (tracked)

- S4 clipboard paste uses a deterministic `navigator.clipboard` stub (real OS
  clipboard unreliable in headless CI); manual check at release.
- S2 (right-click) is exercised via the background message bridge, not a real
  synthesized context menu.
- Only Chromium e2e target exists; Firefox target pending (needs `web-ext run`
  harness).
