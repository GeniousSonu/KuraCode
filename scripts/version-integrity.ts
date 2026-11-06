#!/usr/bin/env node
/**
 * scripts/version-integrity.ts
 *
 * Strict single-source version integrity and anti-stale-artifact validator for KuraCode:
 *  - package.json version
 *  - packages/extension/package.json version
 *  - packages/extension/manifest.json version
 *  - packages/extension/manifest.firefox.json version
 *  - packages/web/package.json version
 *  - CHANGELOG.md latest release header
 *  - release/ zip filenames and SHA256SUMS entries
 *  - Scan built bundles for stale version strings & forbidden old product names
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FORBIDDEN_NAMES = [/sniphub/i];
const STALE_VERSIONS = ["0.0.1", "0.0.2", "0.0.5", "0.0.8", "0.0.9", "0.0.0", "0.1.0"];

let errors = 0;
const error = (msg: string) => {
  errors++;
  console.error(`  ✗ [FAIL] ${msg}`);
};
const success = (msg: string) => {
  console.info(`  ✓ [PASS] ${msg}`);
};

console.info("\n=== KuraCode Version Integrity & Stale Artifact Scan ===");

// 1. Read Root package.json
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const version: string = rootPkg.version;
success(`Target canonical version: v${version}`);

// 2. Validate package.json in workspace packages
const checkJsonVersion = (subpath: string, label: string) => {
  const p = path.join(ROOT, subpath);
  if (!fs.existsSync(p)) return;
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  if (data.version !== version) {
    error(`${label} version mismatch: expected ${version}, found ${data.version} (${subpath})`);
  } else {
    success(`${label} version matches: ${version}`);
  }
};

checkJsonVersion("packages/extension/package.json", "Extension package.json");
checkJsonVersion("packages/extension/manifest.json", "Chrome manifest.json");
checkJsonVersion("packages/extension/manifest.firefox.json", "Firefox manifest.firefox.json");
checkJsonVersion("packages/web/package.json", "Web app package.json");
checkJsonVersion("packages/config/package.json", "Config package.json");
checkJsonVersion("packages/adapters/package.json", "Adapters package.json");
checkJsonVersion("packages/api/package.json", "API package.json");

// 3. Validate CHANGELOG.md top entry
const changelogPath = path.join(ROOT, "CHANGELOG.md");
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const match = changelog.match(/##\s*\[(\d+\.\d+\.\d+[^\]]*)\]/);
  if (!match) {
    error("CHANGELOG.md does not contain any release headers in format: ## [X.Y.Z]");
  } else if (match[1] !== version) {
    error(`CHANGELOG.md top entry (${match[1]}) does not match package version (${version})`);
  } else {
    success(`CHANGELOG.md top entry matches: v${match[1]}`);
  }
} else {
  error("CHANGELOG.md is missing");
}

// 4. Release Directory Files & Checksums Check (if release/ exists)
const releaseDir = path.join(ROOT, "release");
if (fs.existsSync(releaseDir)) {
  const releaseFiles = fs.readdirSync(releaseDir);
  if (releaseFiles.length > 0) {
    console.info("\nChecking release directory artifacts...");
    // Check for any old or mismatched version zip files
    for (const f of releaseFiles) {
      if (f.endsWith(".zip") || f.endsWith(".json")) {
        if (!f.includes(version)) {
          error(`Stale artifact found in release/: "${f}" does not contain current version ${version}`);
        }
      }
    }

    // Check SHA256SUMS.txt
    const shaFile = path.join(releaseDir, "SHA256SUMS.txt");
    if (fs.existsSync(shaFile)) {
      const shaContent = fs.readFileSync(shaFile, "utf8");
      const shaLines = shaContent.split("\n").filter((l) => l.trim().length > 0);
      for (const line of shaLines) {
        const parts = line.trim().split(/\s+/);
        const fname = parts[1];
        if (fname && (fname.endsWith(".zip") || fname.endsWith(".json"))) {
          if (!fname.includes(version)) {
            error(`Stale artifact referenced in SHA256SUMS.txt: ${fname}`);
          }
        }
      }
      success(`SHA256SUMS.txt contains ${shaLines.length} current-version entries`);
    }
  }
}

// 5. Built Output Stale String & Forbidden Name Scan
console.info("\nScanning built bundles for forbidden names and stale strings...");
const scanDirs = [
  path.join(ROOT, "packages/extension/.output/chrome-mv3"),
  path.join(ROOT, "packages/extension/.output/firefox-mv3"),
];

for (const dir of scanDirs) {
  if (!fs.existsSync(dir)) continue;
  const dirName = path.basename(dir);
  const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });

  for (const f of files) {
    if (!f.isFile()) continue;
    const fullPath = path.join(f.parentPath || f.path, f.name);
    // Scan text files (js, html, css, json)
    if (/\.(js|html|css|json)$/.test(f.name)) {
      const content = fs.readFileSync(fullPath, "utf8");

      // Check forbidden product name
      for (const pattern of FORBIDDEN_NAMES) {
        if (pattern.test(content)) {
          error(`Forbidden old product name found matching ${pattern} in ${dirName}/${f.name}`);
        }
      }

      // Check stale versions in manifests
      if (f.name === "manifest.json") {
        for (const stale of STALE_VERSIONS) {
          if (content.includes(`"version": "${stale}"`)) {
            error(`Stale version string "${stale}" found in ${dirName}/${f.name}`);
          }
        }
      }
    }
  }
}

if (errors === 0) {
  success("Zero forbidden old product names or stale version strings detected");
}

console.info("\n=========================================================");
if (errors > 0) {
  console.error(`Version integrity checks FAILED with ${errors} error(s).\n`);
  process.exit(1);
} else {
  console.info("All version integrity and hygiene checks PASSED cleanly.\n");
}

