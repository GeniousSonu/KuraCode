#!/usr/bin/env bash
# scripts/post-release-smoke.sh
# Post-release artifact verification: unpacks generated zip archives in a sandbox
# and validates runtime manifests, files, and smoke scenarios.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./package.json').version")
RELEASE_DIR="$PWD/release"
TMP_DIR="/tmp/kuracode-smoke-v${VERSION}-$$"

printf "\n\033[1;36m==> [smoke-release] Validating release artifacts for v%s...\033[0m\n" "$VERSION"

CHROME_ZIP="${RELEASE_DIR}/kuracode-chrome-${VERSION}.zip"
FIREFOX_ZIP="${RELEASE_DIR}/kuracode-firefox-${VERSION}.zip"

if [ ! -f "$CHROME_ZIP" ] || [ ! -f "$FIREFOX_ZIP" ]; then
  echo "Error: Release artifacts not found in $RELEASE_DIR. Run pnpm package first." >&2
  exit 1
fi

mkdir -p "$TMP_DIR/chrome" "$TMP_DIR/firefox"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "1. Unpacking Chrome archive..."
unzip -q "$CHROME_ZIP" -d "$TMP_DIR/chrome"

echo "2. Unpacking Firefox archive..."
unzip -q "$FIREFOX_ZIP" -d "$TMP_DIR/firefox"

echo "3. Validating unpacked Chrome bundle..."
test -f "$TMP_DIR/chrome/manifest.json"
test -f "$TMP_DIR/chrome/background.js"
test -f "$TMP_DIR/chrome/content.js"
test -f "$TMP_DIR/chrome/popup.html"
test -f "$TMP_DIR/chrome/sidepanel.html"
node -e "
  const m = JSON.parse(fs.readFileSync('$TMP_DIR/chrome/manifest.json', 'utf8'));
  assert.strictEqual(m.version, '$VERSION', 'Chrome manifest version mismatch');
  assert.ok(m.permissions.includes('storage'), 'Chrome missing storage permission');
  console.log('  ✔ Chrome bundle manifest and core assets verified');
"

echo "4. Validating unpacked Firefox bundle..."
test -f "$TMP_DIR/firefox/manifest.json"
node -e "
  const m = JSON.parse(fs.readFileSync('$TMP_DIR/firefox/manifest.json', 'utf8'));
  assert.strictEqual(m.version, '$VERSION', 'Firefox manifest version mismatch');
  assert.strictEqual(m.browser_specific_settings.gecko.id, 'kuracode@sahinur.islam');
  console.log('  ✔ Firefox bundle manifest and gecko ID verified');
"

echo "5. Running headless extension load smoke test..."
if [ -z "${DISPLAY:-}" ] && command -v xvfb-run >/dev/null 2>&1; then
  xvfb-run --auto-servernum pnpm --filter @kuracode/extension exec playwright test e2e/smoke.spec.ts
else
  pnpm --filter @kuracode/extension exec playwright test e2e/smoke.spec.ts
fi

printf "\n\033[1;32m✔ Post-release artifact smoke test passed with 100%% integrity!\033[0m\n\n"
