#!/usr/bin/env node
/**
 * scripts/sync-version.ts
 *
 * Single-source-of-truth version propagation.
 * Reads the canonical `version` from root `package.json`, translates prerelease
 * suffixes to valid browser numeric formats (e.g. 1.2.0-beta.1 -> 1.2.0.1), and propagates:
 *  - packages/extension/manifest.json (version & version_name)
 *  - packages/extension/manifest.firefox.json (version & version_name)
 *  - packages/extension/package.json
 *  - packages/web/package.json
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
 * e.g. "0.1.0" -> "0.1.0"
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

export function syncVersions(): void {
  const rootPkgPath = path.join(ROOT, "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
  const version = rootPkg.version;
  const vInfo = parseManifestVersion(version);

  console.info(`[sync-version] Root version: ${vInfo.raw} -> Manifest version: ${vInfo.manifestVersion}`);

  // 1. packages/extension/package.json
  const extPkgPath = path.join(ROOT, "packages", "extension", "package.json");
  if (fs.existsSync(extPkgPath)) {
    const extPkg = JSON.parse(fs.readFileSync(extPkgPath, "utf8"));
    extPkg.version = vInfo.raw;
    fs.writeFileSync(extPkgPath, JSON.stringify(extPkg, null, 2) + "\n", "utf8");
    console.info(`  ✓ Updated packages/extension/package.json`);
  }

  // 2. packages/web/package.json
  const webPkgPath = path.join(ROOT, "packages", "web", "package.json");
  if (fs.existsSync(webPkgPath)) {
    const webPkg = JSON.parse(fs.readFileSync(webPkgPath, "utf8"));
    webPkg.version = vInfo.raw;
    fs.writeFileSync(webPkgPath, JSON.stringify(webPkg, null, 2) + "\n", "utf8");
    console.info(`  ✓ Updated packages/web/package.json`);
  }

  // 3. packages/extension/manifest.json (Chrome / Edge)
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

  // 4. packages/extension/manifest.firefox.json
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
}

// If executed directly as CLI script
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  syncVersions();
}
