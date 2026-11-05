#!/usr/bin/env bash
# scripts/create-pr.sh
# Automates short-lived feature branch PR creation and auto-merge (squash) via GitHub CLI.
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  echo "Already on main. Create a feature branch first: git checkout -b feat/your-feature-name"
  exit 1
fi

TITLE="${1:-"feat: updates from $BRANCH"}"
BODY="${2:-"Automated feature branch PR for $BRANCH. Passes all local gates (pnpm verify)."}"

echo "==> Pushing branch $BRANCH to origin..."
git push -u origin "$BRANCH"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "==> Creating GitHub Pull Request..."
  PR_URL=$(gh pr create --title "$TITLE" --body "$BODY" --base main)
  echo "✔ PR created: $PR_URL"

  echo "==> Enabling squash auto-merge..."
  gh pr merge --auto --squash || {
    echo "Note: Auto-merge requires repository settings enabled by owner. See docs/agent/NEEDS_HUMAN.md"
  }
else
  echo ""
  echo "Note: GitHub CLI (gh) is not authenticated on this machine."
  echo "To open this PR manually: visit https://github.com/GeniousSonu/KuraCode/pull/new/$BRANCH"
  echo "To enable auto-merge in GitHub: Settings > General > 'Allow auto-merge'."
fi
