#!/usr/bin/env bash
# SnipHub verification gate: lint -> typecheck -> unit -> build -> (e2e if available)
# Usage: ./scripts/verify.sh
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf "\n\033[1;36m==> %s\033[0m\n" "$*"; }

step "Lint"
npm run lint

step "Type-check"
npm run typecheck

step "Unit tests"
npm test

step "Build"
npm run build

if ls packages/extension/e2e/*.spec.ts >/dev/null 2>&1; then
  step "e2e"
  # Headed Chromium is required to load the extension; use xvfb when no display.
  if [ -z "${DISPLAY:-}" ] && command -v xvfb-run >/dev/null 2>&1; then
    xvfb-run --auto-servernum npm run e2e --workspace @kuracode/extension
  else
    npm run e2e --workspace @kuracode/extension
  fi
else
  echo "e2e: no specs found — skipping."
fi

step "All gates green ✔"
