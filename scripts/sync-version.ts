#!/usr/bin/env node
/**
 * scripts/sync-version.ts
 *
 * Single-source-of-truth version propagation.
 * Reads the canonical `version` from root `package.json` (or accepts targetVersion),
 * translates prerelease suffixes to valid browser numeric formats (e.g. 1.2.0-beta.1 -> 1.2.0.1), and propagates:
 *  - packages/extension/manifest.json (version & version_name)
 *  - packages/extension/manifest.firefox.json (version & version_name)
 *  - packages/extension/package.json
 *  - packages/web/package.json
 *  - packages/config/package.json
 *  - packages/adapters/package.json
 *  - packages/api/package.json
 *  - packages/web/src/version.ts
 *  - packages/api/src/version.ts
 *  - packages/extension/src/shared/version.ts
 *  - packages/extension/src/options/main.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export interface VersionInfo {
  raw: string;
  manifestVersion: string;
  versionName?: string;
  isPrerelease: boolean;
}

/**
 * Converts semver strings to browser-compliant 1-4 dot-separated integers (0-65535).
 * e.g. "0.2.0" -> "0.2.0"
 *      "1.2.3-beta.4" -> "1.2.3.4"
 *      "1.2.3-rc.1" -> "1.2.3.1"
 *      "1.2.3-alpha" -> "1.2.3.0"
 */
export function parseManifestVersion(version: string): VersionInfo {
  const clean = version.trim().replace(/^v/, "");
  // Match standard semver + optional prerelease
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) {
    throw new Error(`Invalid semver version format: "${version}"`);
  }

  const [, major, minor, patch, prerelease] = match;
  const numMajor = parseInt(major, 10);
  const numMinor = parseInt(minor, 10);
  const numPatch = parseInt(patch, 10);

  if (numMajor > 65535 || numMinor > 65535 || numPatch > 65535) {
    throw new Error(`Version integer exceeds browser maximum 65535: "${version}"`);
  }

  if (!prerelease) {
    return {
      raw: version,
      manifestVersion: `${numMajor}.${numMinor}.${numPatch}`,
      isPrerelease: false,
    };
  }

  // Extract trailing number from prerelease or default to 0
  const preNumMatch = prerelease.match(/\d+$/);
  const buildNum = preNumMatch ? parseInt(preNumMatch[0], 10) : 0;
  if (buildNum > 65535) {
    throw new Error(`Prerelease build integer exceeds 65535: "${prerelease}"`);
  }

  return {
    raw: version,
    manifestVersion: `${numMajor}.${numMinor}.${numPatch}.${buildNum}`,
    versionName: clean,
    isPrerelease: true,
  };
}

export function syncVersions(explicitVersion?: string): void {
  const rootPkgPath = path.join(ROOT, "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
  if (explicitVersion) {
    rootPkg.version = explicitVersion;
    fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n", "utf8");
  }
  const version = rootPkg.version;
  const vInfo = parseManifestVersion(version);

  console.info(`[sync-version] Propagating canonical version v${vInfo.raw} (manifest: ${vInfo.manifestVersion})...`);

  // 1. All workspace packages package.json
  const packagesToSync = [
    "packages/extension/package.json",
    "packages/web/package.json",
    "packages/config/package.json",
    "packages/adapters/package.json",
    "packages/api/package.json",
  ];

  for (const pkgRel of packagesToSync) {
    const pkgPath = path.join(ROOT, pkgRel);
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.version = vInfo.raw;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
      console.info(`  ✓ Updated ${pkgRel}`);
    }
  }

  // 2. packages/extension/manifest.json (Chrome / Edge)
  const chromeManifestPath = path.join(ROOT, "packages", "extension", "manifest.json");
  if (fs.existsSync(chromeManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(chromeManifestPath, "utf8"));
    manifest.version = vInfo.manifestVersion;
    if (vInfo.versionName) {
      manifest.version_name = vInfo.versionName;
    } else {
      delete manifest.version_name;
    }
    fs.writeFileSync(chromeManifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.info(`  ✓ Updated packages/extension/manifest.json (${vInfo.manifestVersion})`);
  }

  // 3. packages/extension/manifest.firefox.json
  const ffManifestPath = path.join(ROOT, "packages", "extension", "manifest.firefox.json");
  if (fs.existsSync(ffManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(ffManifestPath, "utf8"));
    manifest.version = vInfo.manifestVersion;
    if (vInfo.versionName) {
      manifest.version_name = vInfo.versionName;
    } else {
      delete manifest.version_name;
    }
    fs.writeFileSync(ffManifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.info(`  ✓ Updated packages/extension/manifest.firefox.json (${vInfo.manifestVersion})`);
  }

  // 4. packages/extension/src/shared/version.ts
  const extVersionPath = path.join(ROOT, "packages", "extension", "src", "shared", "version.ts");
  const extVersionContent = `/**
 * Generated by scripts/sync-version.ts — do not edit directly.
 */
export const EXTENSION_VERSION = "${vInfo.raw}";
export const MANIFEST_VERSION = "${vInfo.manifestVersion}";
`;
  fs.writeFileSync(extVersionPath, extVersionContent, "utf8");
  console.info(`  ✓ Updated packages/extension/src/shared/version.ts`);

  // 5. packages/web/src/version.ts
  const webVersionPath = path.join(ROOT, "packages", "web", "src", "version.ts");
  const webVersionContent = `/**
 * Generated by scripts/sync-version.ts — do not edit directly.
 */
export const WEB_APP_VERSION = "${vInfo.raw}";
`;
  fs.writeFileSync(webVersionPath, webVersionContent, "utf8");
  console.info(`  ✓ Updated packages/web/src/version.ts`);

  // 6. packages/api/src/version.ts
  const apiVersionPath = path.join(ROOT, "packages", "api", "src", "version.ts");
  const apiVersionContent = `/**
 * Generated by scripts/sync-version.ts — do not edit directly.
 */
export const API_SERVER_VERSION = "${vInfo.raw}";
`;
  fs.writeFileSync(apiVersionPath, apiVersionContent, "utf8");
  console.info(`  ✓ Updated packages/api/src/version.ts`);

  // 7. packages/extension/src/options/main.ts fallback
  const optionsMainPath = path.join(ROOT, "packages", "extension", "src", "options", "main.ts");
  if (fs.existsSync(optionsMainPath)) {
    let optContent = fs.readFileSync(optionsMainPath, "utf8");
    optContent = optContent.replace(/\{\s*version:\s*"[^"]*"\s*\}/g, `{ version: "${vInfo.raw}" }`);
    fs.writeFileSync(optionsMainPath, optContent, "utf8");
    console.info(`  ✓ Updated packages/extension/src/options/main.ts`);
  }
}

// If executed directly as CLI script
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  syncVersions(process.argv[2]);
}
