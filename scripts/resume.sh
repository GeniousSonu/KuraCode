#!/usr/bin/env bash
# SnipHub cold-start: print STATE, HANDOFF, and the next 5 tasks.
# Usage: ./scripts/resume.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "===== STATE.md ====="
cat docs/agent/STATE.md
echo
echo "===== HANDOFF.md ====="
cat docs/agent/HANDOFF.md
echo
echo "===== next 5 tasks ====="
awk -F'|' 'NR>2 && $5 !~ /DONE|FAILED|BLOCKED|SKIPPED/ {print $1" "$5" "$6; c++} c>=5{exit}' docs/agent/TASKS.md
echo
echo "===== git ====="
git status --short 2>/dev/null | head -n 20 || echo "(not a git repo)"
