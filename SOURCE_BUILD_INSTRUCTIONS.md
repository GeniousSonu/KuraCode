# SOURCE BUILD INSTRUCTIONS FOR MOZILLA AMO REVIEWERS

**Package:** KuraCode (SnipHub)  
**Version:** 0.1.0  
**Repository:** https://github.com/kuracode/kuracode  

---

## 1. System Requirements & Build Environment
To reproduce the exact built extension artifacts (`.output/firefox-mv3/` and `release/kuracode-firefox-0.1.0.zip`), ensure your environment matches:

- **Operating System:** Linux (Ubuntu 22.04 LTS / 24.04 LTS) or macOS / Windows 11
- **Node.js:** `22.x` LTS (or `>=20.10.0`)
- **Package Manager:** `pnpm` version `12.16.1`
- **Path Requirement:** Run from a workspace path without spaces

---

## 2. Step-by-Step Build Instructions

### Step 1: Unzip the Source Code
```bash
unzip kuracode-source-0.1.0.zip -d kuracode-source
cd kuracode-source
```

### Step 2: Install Dependencies (Frozen Lockfile)
Install exact dependencies without touching network or modifying lockfile:
```bash
pnpm install --frozen-lockfile
```

### Step 3: Compile Brand Assets (Deterministic SVGs and PNGs)
```bash
pnpm brand:build
```

### Step 4: Build the Firefox WebExtension Target
```bash
pnpm build:firefox
```

The deterministic built extension output is generated at:
`packages/extension/.output/firefox-mv3/`

### Step 5: Verify the Build & Run Linter
```bash
pnpm exec web-ext lint --source-dir packages/extension/.output/firefox-mv3
```
Expected result: **0 errors**.

---

## 3. Toolchain & Bundling Notes
- **Bundler:** `esbuild` v0.24.2
  - Config file: `packages/extension/build.mjs`
  - Format: IIFE (required by browser MV3 content scripts)
  - Target: ES2022
  - Sourcemap: Enabled (`.map` files attached for debugging)
- **No Minification Obfuscation:** Code is bundled as readable modules without identifier mangling or obfuscation.
- **No Remote Code:** Zero external resources or CDN dependencies are loaded at runtime.
