#!/usr/bin/env bash
# scripts/sync.sh - Safe bi-directional sync across machines
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
  echo "=== Running sync in DRY-RUN mode ==="
fi

echo "==> Fetching all remotes and tags..."
git fetch --all --prune --tags

CURRENT_BRANCH="$(git branch --show-current)"
REMOTE_BRANCH="origin/${CURRENT_BRANCH}"

echo "==> Current branch: ${CURRENT_BRANCH}"

# Check for secrets in working tree
SECRETS_FOUND=$(git status --porcelain | grep -E '\.env$|\.key$|\.pem$|id_rsa' || true)
if [[ -n "$SECRETS_FOUND" ]]; then
  echo "⚠️ WARNING: Potential secret files detected in working tree:"
  echo "$SECRETS_FOUND"
  echo "Please ensure secrets are not committed!"
fi

echo "==> Remote incoming commits (${CURRENT_BRANCH}..${REMOTE_BRANCH}):"
git log --oneline "HEAD..${REMOTE_BRANCH}" 2>/dev/null || echo "  (none or remote branch does not exist)"

echo "==> Local outgoing commits (${REMOTE_BRANCH}..${CURRENT_BRANCH}):"
git log --oneline "${REMOTE_BRANCH}..HEAD" 2>/dev/null || echo "  (none or remote branch does not exist)"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "✔ Dry-run sync check completed."
  exit 0
fi

echo "==> Pulling with rebase and autostash..."
git pull --rebase --autostash origin "$CURRENT_BRANCH"

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

if [[ -f "scripts/build-icons.ts" ]]; then
  echo "==> Regenerating brand assets..."
  pnpm brand:build
fi

echo "==> Quick verification (lint + types + unit)..."
pnpm lint
pnpm typecheck
pnpm test

echo "✔ Sync completed successfully!"

