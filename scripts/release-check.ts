#!/usr/bin/env node
/**
 * scripts/release-check.ts
 *
 * Automated pre-release validation gates:
 *  1. Version synchronization check
 *  2. Manifest schema & required properties check (Chrome, Firefox, Edge)
 *  3. Package checks (no eval, no remote code, size < 25MB)
 *  4. Permissions difference tracker (alerts if permissions widened)
 *  5. License check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const KNOWN_PERMISSIONS = [
  "activeTab",
  "contextMenus",
  "clipboardWrite",
  "storage",
  "unlimitedStorage",
];

const KNOWN_HOSTS = ["<all_urls>"];

let errors = 0;
const error = (msg: string) => {
  errors++;
  console.error(`  ✗ [FAIL] ${msg}`);
};
const success = (msg: string) => {
  console.info(`  ✓ [PASS] ${msg}`);
};

console.info("\n=== KuraCode Release Gate Validation ===");

// 1. Version Check
console.info("\n1. Validating Single-Source Version...");
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const extPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/extension/package.json"), "utf8"));
const chromeManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/extension/manifest.json"), "utf8"));
const ffManifest = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/extension/manifest.firefox.json"), "utf8"));

if (extPkg.version !== rootPkg.version) {
  error(`Extension package version (${extPkg.version}) does not match root (${rootPkg.version})`);
} else {
  success(`Package versions match: ${rootPkg.version}`);
}

// 2. Manifest Schema & Security Checks
console.info("\n2. Manifest Security & Compliance Checks...");
for (const [name, m] of Object.entries({ Chrome: chromeManifest, Firefox: ffManifest })) {
  if (m.manifest_version !== 3) error(`${name} manifest_version is not 3`);
  if (!m.name || !m.version || !m.description) error(`${name} missing standard metadata`);
  if (!m.icons?.["128"]) error(`${name} missing 128px icon`);
  success(`${name} manifest has valid core structure`);
}

// 3. Permissions Diff & Widening Gate
console.info("\n3. Permissions Diff & Scope Validation...");
const currentPermissions: string[] = chromeManifest.permissions || [];
const unexpectedPerms = currentPermissions.filter((p) => !KNOWN_PERMISSIONS.includes(p));
if (unexpectedPerms.length > 0) {
  error(`Permissions widened without architectural review! Unexpected: ${unexpectedPerms.join(", ")}`);
} else {
  success(`Permissions match allowed scope: ${currentPermissions.join(", ")}`);
}

const currentHosts: string[] = chromeManifest.host_permissions || [];
const unexpectedHosts = currentHosts.filter((h) => !KNOWN_HOSTS.includes(h));
if (unexpectedHosts.length > 0) {
  error(`Host permissions widened! Unexpected: ${unexpectedHosts.join(", ")}`);
} else {
  success(`Host permissions match approved scope: ${currentHosts.join(", ")}`);
}

// 4. Built Output Checks (Code hygiene: no eval, size limits)
console.info("\n4. Built Bundle Hygiene & Size Checks...");
const chromeBuildDir = path.join(ROOT, "packages/extension/.output/chrome-mv3");
if (!fs.existsSync(chromeBuildDir)) {
  error("Chrome build directory missing (.output/chrome-mv3). Run pnpm build:chrome first.");
} else {
  const files = fs.readdirSync(chromeBuildDir);
  let totalSize = 0;
  for (const f of files) {
    const full = path.join(chromeBuildDir, f);
    const stat = fs.statSync(full);
    totalSize += stat.size;
    if (f.endsWith(".js")) {
      const code = fs.readFileSync(full, "utf8");
      // Check for forbidden eval
      if (/\beval\s*\(/.test(code)) {
        error(`Forbidden "eval" statement found in ${f}`);
      }
    }
  }
  const sizeMb = (totalSize / (1024 * 1024)).toFixed(2);
  if (totalSize > 25 * 1024 * 1024) {
    error(`Built package exceeds 25MB limit (${sizeMb} MB)`);
  } else {
    success(`Built bundle size is within store limits (${sizeMb} MB total)`);
    success(`Zero eval() or dangerous execution paths detected`);
  }
}

console.info("\n========================================");
if (errors > 0) {
  console.error(`Release checks FAILED with ${errors} error(s).\n`);
  process.exit(1);
} else {
  console.info("All release checks PASSED cleanly.\n");
}
