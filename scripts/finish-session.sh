#!/usr/bin/env bash
# scripts/finish-session.sh - Safely verify, finalize session state, and push
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
  echo "=== Running finish-session in DRY-RUN mode ==="
fi

echo "==> Checking for uncommitted secret files..."
SECRETS_FOUND=$(git status --porcelain | grep -E '\.env$|\.key$|\.pem$|id_rsa' || true)
if [[ -n "$SECRETS_FOUND" ]]; then
  echo "⚠️ WARNING: Potential secret files detected in working tree:"
  echo "$SECRETS_FOUND"
  echo "Aborting finish-session to prevent accidental leaks. Untrack secrets and retry."
  exit 1
fi

echo "==> Running full verification gate..."
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "  [dry-run] Would execute: pnpm verify"
else
  pnpm verify
fi

CURRENT_BRANCH="$(git branch --show-current)"
REMOTE_BRANCH="origin/${CURRENT_BRANCH}"

echo "==> Checking git status..."
git status --short

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "  [dry-run] Would check for uncommitted changes, commit state updates, and run:"
  echo "  [dry-run] git push origin ${CURRENT_BRANCH}"
  echo "✔ Dry-run finish-session completed successfully."
  exit 0
fi

# If there are changes to doc/state files, remind user or commit if clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "==> Uncommitted changes detected."
  echo "Please commit your changes before finishing, or run with caution."
fi

echo "==> Outgoing commits ready to push:"
git log --oneline "${REMOTE_BRANCH}..HEAD" 2>/dev/null || true

echo "==> Pushing cleanly (non-force) to ${REMOTE_BRANCH}..."
git push origin "$CURRENT_BRANCH"

echo "✔ Session finished and pushed cleanly!"

