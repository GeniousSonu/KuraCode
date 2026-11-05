#!/usr/bin/env bash
# scripts/ship.sh
# The single master pipeline command executed by the agent and developers after every task.
# Workflow: Pre-flight secret scan -> Clean -> Install -> Full Gate -> Package -> Verify Archive -> State sync -> Commit -> Push
set -euo pipefail
cd "$(dirname "$0")/.."

COMMIT_MSG="${1:-"chore: automated pipeline verification and state sync"}"

printf "\n\033[1;35m============================================================\033[0m\n"
printf "\033[1;35m       KURACODE MASTER SHIP PIPELINE (CHANGE -> SHIP)       \033[0m\n"
printf "\033[1;35m============================================================\033[0m\n"

# --- STEP 1: PRE-FLIGHT CHECK (NO SECRETS, NO STRAY ARTIFACTS) ---
printf "\n\033[1;36m==> Step 1: Pre-Flight Safety & Secret Check\033[0m\n"

# Check for accidental secret files in working tree
SUSPICIOUS_FILES=$(git status --porcelain | grep -E '\.(env|key|pem|pfx|pkcs12|secret)$' || true)
if [ -n "$SUSPICIOUS_FILES" ]; then
  printf "\033[1;31m✗ [ERROR] Uncommitted secret files detected in working tree:\033[0m\n%s\n" "$SUSPICIOUS_FILES"
  exit 1
fi

# Secret scanner on unstaged & staged diffs
DIFF_SECRETS=$(git diff HEAD | grep -E '(AKIA[0-9A-Z]{16}|ghp_[0-9a-zA-Z]{36}|BEGIN (RSA|EC|PRIVATE) KEY)' || true)
if [ -n "$DIFF_SECRETS" ]; then
  printf "\033[1;31m✗ [ERROR] Private credentials or tokens detected in git diff!\033[0m\n"
  exit 1
fi
echo "✔ Working tree is clean of sensitive tokens and keys."

# --- STEP 2: HYGIENE CLEAN (ZERO STALE ARTIFACTS) ---
printf "\n\033[1;36m==> Step 2: Clean Stale Build & Release Artifacts\033[0m\n"
bash scripts/clean.sh

# --- STEP 3: SUPPLY CHAIN & BRAND REGENERATION ---
printf "\n\033[1;36m==> Step 3: Frozen Install & Brand Regeneration\033[0m\n"
pnpm install --frozen-lockfile
pnpm brand:build

# --- STEP 4: FULL QUALITY GATES ---
printf "\n\033[1;36m==> Step 4: Full Verification Gates (Lint, Types, Unit, Build, E2E, AMO)\033[0m\n"
bash scripts/verify.sh

# --- STEP 5: PACKAGING & RELEASE INTEGRITY AUDIT ---
printf "\n\033[1;36m==> Step 5: Packaging & Release Contents Allow-List Audit\033[0m\n"
pnpm package
node --experimental-strip-types scripts/verify-release-contents.ts
node --experimental-strip-types scripts/version-integrity.ts

# --- STEP 6: FEATURE REGISTRY & METRICS REPORT ---
printf "\n\033[1;36m==> Step 6: Feature Health & State Report\033[0m\n"
pnpm features:report

# --- STEP 7: COMMIT & PUSH ---
printf "\n\033[1;36m==> Step 7: Commit & Push to Remote\033[0m\n"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ -n "$(git status --porcelain)" ]; then
  echo "Staging all validated code, tests, docs, and state changes..."
  git add docs packages scripts package.json CHANGELOG.md .github .husky store README.md 2>/dev/null || true
  git add -u
  git commit -m "$COMMIT_MSG"
  echo "✔ Changes committed with Conventional Commit: '$COMMIT_MSG'"
else
  echo "Working directory already clean (no unstaged changes to commit)."
fi

echo "Pushing branch '$CURRENT_BRANCH' to origin..."
git push origin "$CURRENT_BRANCH"

printf "\n\033[1;32m============================================================\033[0m\n"
printf "\033[1;32m    ✔ KURACODE SHIP PIPELINE COMPLETED SUCCESSFULLY!        \033[0m\n"
printf "\033[1;32m============================================================\033[0m\n\n"

