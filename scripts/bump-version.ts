#!/usr/bin/env node
/**
 * scripts/bump-version.ts
 *
 * Single-command version bumper for KuraCode:
 *  - Calculates target version (next minor, patch, major, or explicit)
 *  - Supports environment variable override: KURACODE_VERSION=<x.y.z>
 *  - Updates root package.json
 *  - Runs scripts/sync-version.ts to propagate version to all workspace packages, manifests,
 *    API client headers, web app footer, and options diagnostics
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncVersions } from "./sync-version.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export function computeNextVersion(current: string, arg?: string, envOverride?: string): string {
  if (envOverride && envOverride.trim().length > 0) {
    const clean = envOverride.trim().replace(/^v/, "");
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(clean)) {
      throw new Error(`Invalid KURACODE_VERSION environment format: "${envOverride}"`);
    }
    return clean;
  }

  const levelOrVersion = (arg || "minor").trim().replace(/^v/, "");

  // If explicit semver string passed as argument
  if (/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(levelOrVersion)) {
    return levelOrVersion;
  }

  const match = current.trim().replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Current version "${current}" does not conform to semver format`);
  }

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);

  if (levelOrVersion === "major") {
    return `${major + 1}.0.0`;
  }
  if (levelOrVersion === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  if (levelOrVersion === "patch") {
    return `${major}.${minor}.${patch + 1}`;
  }

  throw new Error(`Unknown bump level "${levelOrVersion}". Expected: minor | patch | major | <X.Y.Z>`);
}

export function bumpVersion(target?: string): string {
  const rootPkgPath = path.join(ROOT, "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
  const currentVersion: string = rootPkg.version;

  const nextVersion = computeNextVersion(currentVersion, target, process.env.KURACODE_VERSION);

  console.info(`\n[bump-version] Current version: v${currentVersion} → Next version: v${nextVersion}`);

  // Update root package.json
  rootPkg.version = nextVersion;
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n", "utf8");
  console.info(`  ✓ Updated root package.json to v${nextVersion}`);

  // Synchronize across all targets
  syncVersions(nextVersion);

  return nextVersion;
}

// Direct execution
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const arg = process.argv[2];
  bumpVersion(arg);
}
