#!/usr/bin/env bash
# KuraCode verification gate:
#   install (frozen) -> brand:build -> lint -> typecheck -> unit -> build:chrome ->
#   build:firefox -> brand check -> version integrity -> release check -> docs freshness ->
#   web-ext lint -> e2e
# Usage: ./scripts/verify.sh
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }

step "Install (frozen lockfile)"
pnpm install --frozen-lockfile

step "Brand build"
pnpm brand:build

step "Lint"
pnpm lint

step "Type-check"
pnpm typecheck

step "Build (Chrome MV3)"
pnpm build:chrome

step "Build (Firefox MV3)"
pnpm build:firefox

step "Unit & Migration tests"
pnpm test

step "Brand check"
pnpm brand:check

step "Version Integrity & Stale Artifact Scan"
node --experimental-strip-types scripts/version-integrity.ts

step "Release & Permissions Gate"
node --experimental-strip-types scripts/release-check.ts

step "Documentation Freshness & Integrity"
node --experimental-strip-types scripts/docs-freshness.ts

step "web-ext lint (Firefox output)"
node scripts/web-ext-lint.mjs packages/extension/.output/firefox-mv3

step "Firefox manifest must not be a Chrome manifest (guarded web-ext)"
python3 - <<'PY'
import json,sys,os,subprocess
for t,d in [("chrome","chrome-mv3"),("firefox","firefox-mv3")]:
    p=f"packages/extension/.output/{d}/manifest.json"
    m=json.load(open(p))
    if t=="firefox":
        g=m.get("browser_specific_settings",{}).get("gecko",{})
        assert g.get("id"), "firefox manifest missing gecko.id"
        assert isinstance(m.get("background",{}).get("scripts"),list), "firefox background must use scripts"
        assert "service_worker" not in m.get("background",{}), "firefox manifest must not use service_worker"
        assert isinstance(g.get("data_collection_permissions"),dict), "firefox missing data_collection_permissions object"
    else:
        assert m.get("background",{}).get("service_worker"), "chrome manifest must use service_worker"
print("✔ manifests are target-correct (chrome=service_worker, firefox=scripts+gecko)")
PY

if ls packages/extension/e2e/*.spec.ts >/dev/null 2>&1; then
  step "e2e"
  # Headed Chromium is required to load the extension; use xvfb when no display.
  if [ -z "${DISPLAY:-}" ] && command -v xvfb-run >/dev/null 2>&1; then
    xvfb-run --auto-servernum pnpm --filter @kuracode/extension exec playwright test
  else
    pnpm --filter @kuracode/extension exec playwright test
  fi
else
  echo "e2e: no specs found — skipping."
fi

step "All gates green ✔"
