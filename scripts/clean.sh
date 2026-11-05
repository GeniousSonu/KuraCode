#!/usr/bin/env bash
# scripts/clean.sh
# Removes all generated build, test, and release artifacts so no stale files leak into releases.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Cleaning all build, release, and cache outputs..."

rm -rf .output
rm -rf packages/extension/.output
rm -rf packages/web/.output
rm -rf packages/web/dist
rm -rf dist
rm -rf release
rm -rf coverage
rm -rf test-results
rm -rf packages/extension/test-results
rm -rf packages/extension/playwright-report

# Re-create empty release directory
mkdir -p release

echo "✔ Clean completed cleanly. No stale artifacts remain."
