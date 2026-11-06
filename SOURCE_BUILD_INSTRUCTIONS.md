# SOURCE BUILD INSTRUCTIONS FOR MOZILLA AMO REVIEWERS

**Package:** KuraCode  
**Version:** 0.2.0  
**Repository:** https://github.com/GeniousSonu/KuraCode  
**Release Tag:** `v0.2.0`  

---

## 1. System Requirements & Build Environment
To reproduce the exact built extension artifacts (`packages/extension/.output/firefox-mv3/` and `release/kuracode-firefox-0.2.0.zip`), ensure your environment matches:

- **Operating System:** Linux (Ubuntu 22.04 / 24.04 LTS, kernel 6.x/7.x), macOS (14 Sonoma / 15 Sequoia), or Windows 11 (WSL2 / PowerShell)
- **Node.js:** `v22.23.2` (or any modern LTS `>=20.10.0`)
- **Package Manager:** `pnpm` version `12.16.1`
- **Path Requirement:** Run from a workspace path without spaces (e.g., `/tmp/kuracode-build` or `~/builds/kuracode`)
- **Credentials & API Keys:** **Zero API keys, secrets, or environment variables are required.** The application is offline-first. All service adapters default to offline local fallbacks with zero external network access.

---

## 2. Step-by-Step Build Instructions

### Step 1: Unpack the Clean Source Code
```bash
unzip kuracode-source-0.2.0.zip -d kuracode-source
cd kuracode-source
```

### Step 2: Install Exact Dependencies (Frozen Lockfile)
Install dependencies strictly using the committed lockfile:
```bash
pnpm install --frozen-lockfile
```

### Step 3: Compile Brand Assets & Build the Firefox WebExtension
Run the root build command:
```bash
pnpm build:firefox
```
*(This automatically regenerates multi-size icon assets via `pnpm brand:build` and bundles the Firefox MV3 target with esbuild).*

### Step 4: Verify the Built Output
The built Firefox extension is emitted at:
```bash
packages/extension/.output/firefox-mv3/
```

Confirm core assets exist:
```bash
ls -la packages/extension/.output/firefox-mv3/
# Expected files:
#  - manifest.json (contains gecko id: kuracode@sahinur.islam, version: 0.2.0)
#  - background.js & background.js.map
#  - content.js & content.js.map
#  - popup.html & popup.js & popup.js.map
#  - sidepanel.html & sidepanel.js & sidepanel.js.map
#  - options.html & options.js & options.js.map
#  - fonts/ (bundled Inter and JetBrains Mono WOFF2)
#  - icons/ and action/ (multi-size PNG icons)
```

### Step 5: Run the Mozilla Web-Ext Linter
```bash
pnpm exec web-ext lint --source-dir packages/extension/.output/firefox-mv3
```
Expected result: **0 errors**.

---

## 3. Toolchain & Bundling Notes
- **Bundler:** `esbuild` v0.24.2
  - Config file: `packages/extension/build.mjs`
  - Target: `chrome114` / modern ES (fully compatible with Firefox 115+ ESR)
  - Format: IIFE (required by browser MV3 content scripts)
  - Sourcemaps: Generated alongside `.js` files as `.map` for inspection
- **Zero Obfuscation:** Code is bundled from clean TypeScript sources without identifier mangling or minification obfuscation.
- **Zero Remote Code:** No remote scripts, fonts, or tracking pixels are fetched at runtime (strict Content Security Policy).
- **Offline Fonts:** Inter and JetBrains Mono are bundled locally as subsetted WOFF2 files in `fonts/`.
