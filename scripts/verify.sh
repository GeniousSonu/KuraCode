#!/usr/bin/env bash
# KuraCode verification gate:
#   install (frozen) -> lint -> typecheck -> unit -> build:chrome ->
#   build:firefox -> brand check -> web-ext lint -> e2e
# Usage: ./scripts/verify.sh
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }

step "Install (frozen lockfile)"
pnpm install --frozen-lockfile

step "Lint"
pnpm lint

step "Type-check"
pnpm typecheck

step "Unit tests"
pnpm test

step "Build (Chrome)"
pnpm build:chrome

step "Build (Firefox)"
pnpm build:firefox

step "Brand check"
pnpm brand:check

step "web-ext lint (Firefox output)"
npx --yes web-ext lint --source-dir packages/extension/.output/firefox-mv3

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
