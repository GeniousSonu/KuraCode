#!/usr/bin/env bash
# KuraCode environment doctor: checks Node/pnpm versions, path spaces,
# build approvals, required binaries, and output folders.
# Usage: ./scripts/doctor.sh   (prints a PASS/FAIL list)
set -uo pipefail
cd "$(dirname "$0")/.."

pass=0
fail=0
check() { # name, condition, hint
  local name="$1" cond="$2" hint="$3"
  if eval "$cond"; then
    echo "  PASS  $name"
    pass=$((pass+1))
  else
    echo "  FAIL  $name  → $hint"
    fail=$((fail+1))
  fi
}

echo "KuraCode doctor (workdir: $PWD)"
echo

check "Node is v20 or v22 LTS" \
  "node -v | grep -qE '^v(20|22)\.'" \
  "install Node 20/22 (nvm install 22 && nvm use 22)"

check "pnpm installed" \
  "command -v pnpm" \
  "install pnpm (npm i -g pnpm)"

check "Workspace path has no spaces" \
  "! echo \"$PWD\" | grep -q ' '" \
  "move the project to a path without spaces, e.g. ~/kuracode (cp -r \"$PWD\" ~/kuracode)"

check "esbuild build approved (allowBuilds)" \
  "grep -qE 'esbuild: true' pnpm-workspace.yaml" \
  "ensure esbuild: true is listed under allowBuilds in pnpm-workspace.yaml"

check "sharp build approved (allowBuilds)" \
  "grep -qE 'sharp: true' pnpm-workspace.yaml" \
  "ensure sharp: true is listed under allowBuilds in pnpm-workspace.yaml"

check "node_modules present" \
  "[ -d node_modules ]" \
  "run: pnpm install"

check "Chrome output folder exists" \
  "[ -f packages/extension/.output/chrome-mv3/manifest.json ]" \
  "run: pnpm build:chrome"

check "Firefox output folder exists" \
  "[ -f packages/extension/.output/firefox-mv3/manifest.json ]" \
  "run: pnpm build:firefox"

check "zip available (for release packaging)" \
  "command -v zip" \
  "install zip (apt install zip)"

echo
echo "doctor: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
