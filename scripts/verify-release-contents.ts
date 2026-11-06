#!/usr/bin/env node
/**
 * scripts/verify-release-contents.ts
 *
 * Strict release zip contents allow-list and security scanner.
 * Verifies that built extension zips in release/ contain ONLY approved files
 * and zero forbidden artifacts (node_modules, .env, fixtures, docs, secret tokens).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const releaseDir = path.join(ROOT, "release");

const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const version = rootPkg.version;

let errors = 0;
const error = (msg: string) => {
  errors++;
  console.error(`  ✗ [FAIL] ${msg}`);
};
const success = (msg: string) => {
  console.info(`  ✓ [PASS] ${msg}`);
};

console.info("\n=== KuraCode Release Archive Contents & Allow-List Audit ===");

if (!fs.existsSync(releaseDir)) {
  error("release/ directory does not exist. Run pnpm package first.");
  process.exit(1);
}

const targetZips = [
  `kuracode-chrome-${version}.zip`,
  `kuracode-edge-${version}.zip`,
  `kuracode-firefox-${version}.zip`,
];

const FORBIDDEN_ENTRY_PATTERNS = [
  /\.env/i,
  /node_modules/i,
  /\.git/i,
  /test/i,
  /\.spec\./i,
  /fixture/i,
  /\.md$/i,
  /\.DS_Store/i,
  /Thumbs\.db/i,
];

const ALLOWED_EXT_PATTERNS = [
  /^manifest\.json$/,
  /^background\.js(\.map)?$/,
  /^content\.js(\.map)?$/,
  /^popup\.js(\.map)?$/,
  /^popup\.html$/,
  /^sidepanel\.js(\.map)?$/,
  /^sidepanel\.html$/,
  /^options\.js(\.map)?$/,
  /^options\.html$/,
  /^fonts\/.*\.woff2$/,
  /^icons\/icon-\d+\.png$/,
  /^icons\/icon-maskable-\d+\.png$/,
  /^action\/.*\.png$/,
  /^brand\/.*\.png$/,
];

for (const zipName of targetZips) {
  const zipPath = path.join(releaseDir, zipName);
  if (!fs.existsSync(zipPath)) {
    error(`Required release zip is missing: release/${zipName}`);
    continue;
  }

  console.info(`\nAuditing archive: ${zipName}...`);

  // List zip contents using unzip -l or zipinfo
  let zipListOutput: string;
  try {
    zipListOutput = execFileSync("unzip", ["-Z", "-1", zipPath], { encoding: "utf8" });
  } catch {
    try {
      zipListOutput = execFileSync("zipinfo", ["-1", zipPath], { encoding: "utf8" });
    } catch (e: any) {
      error(`Unable to read zip contents for ${zipName}: ${e.message}`);
      continue;
    }
  }

  const entries = zipListOutput
    .split("\n")
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && !e.endsWith("/"));

  let zipErrors = 0;
  for (const entry of entries) {
    // 1. Check forbidden patterns
    for (const pattern of FORBIDDEN_ENTRY_PATTERNS) {
      if (pattern.test(entry)) {
        error(`Forbidden file found in ${zipName}: "${entry}" (matches ${pattern})`);
        zipErrors++;
      }
    }

    // 2. Check allow-list patterns
    const isAllowed = ALLOWED_EXT_PATTERNS.some((pat) => pat.test(entry));
    if (!isAllowed) {
      error(`Disallowed unexpected file in ${zipName}: "${entry}"`);
      zipErrors++;
    }
  }

  if (zipErrors === 0) {
    success(`${zipName}: All ${entries.length} files conform strictly to release allow-list`);
  }
}

// Check source archive
const sourceZip = `kuracode-source-${version}.zip`;
const sourcePath = path.join(releaseDir, sourceZip);
if (fs.existsSync(sourcePath)) {
  console.info(`\nAuditing AMO source archive: ${sourceZip}...`);
  const srcList = execFileSync("unzip", ["-Z", "-1", sourcePath], { encoding: "utf8" });
  const srcEntries = srcList.split("\n").filter((e) => e.trim().length > 0);
  
  // Verify source archive does not leak node_modules, build outputs, or actual env files (.env.example is allowed)
  const badSrc = srcEntries.filter((e) =>
    /node_modules|\.output|\/dist\/|\.git\/objects/i.test(e) || /(^|\/)\.env($|\.(?!example))/i.test(e)
  );
  if (badSrc.length > 0) {
    error(`AMO Source zip contains forbidden items: ${badSrc.slice(0, 5).join(", ")}`);
  } else {
    success(`${sourceZip}: Clean source archive contains ${srcEntries.length} source files with 0 build leaks`);
  }
}

console.info("\n=========================================================");
if (errors > 0) {
  console.error(`Release contents audit FAILED with ${errors} error(s).\n`);
  process.exit(1);
} else {
  console.info("All release archives verified clean and compliant.\n");
}
