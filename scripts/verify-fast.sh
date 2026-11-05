#!/usr/bin/env bash
# scripts/verify-fast.sh
# Fast pre-push quality gate: lint, typecheck, unit tests, dual build, version integrity.
set -euo pipefail
cd "$(dirname "$0")/.."

printf "\n\033[1;36m==> [verify:fast] Checking code quality before push...\033[0m\n"

echo "1. Lint"
pnpm lint

echo "2. Type-check"
pnpm typecheck

echo "3. Unit tests"
pnpm test

echo "4. Dual MV3 Build"
pnpm build:chrome
pnpm build:firefox

echo "5. Version Integrity"
node --experimental-strip-types scripts/version-integrity.ts

printf "\n\033[1;32m✔ Fast pre-push verification green!\033[0m\n\n"

