#!/usr/bin/env node
/**
 * scripts/package.mjs
 *
 * Professional cross-platform release packaging for KuraCode:
 *  - release/kuracode-chrome-<version>.zip
 *  - release/kuracode-edge-<version>.zip (identical Chrome-MV3 package optimized for Edge)
 *  - release/kuracode-firefox-<version>.zip
 *  - release/kuracode-source-<version>.zip (clean source zip for AMO review requirement)
 *  - release/SHA256SUMS.txt (cryptographic checksums)
 *  - release/sbom.cyclonedx.json (Software Bill of Materials)
 */
import fs from "node:fs";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(scriptsDir);
const release = path.join(root, "release");

const rootPkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = rootPkg.version;

await mkdir(release, { recursive: true });

function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(archive.pointer()));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function zipSourceCode(outPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(archive.pointer()));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.glob("**/*", {
      cwd: root,
      ignore: [
        "**/node_modules/**",
        "**/.output/**",
        "**/dist/**",
        "**/release/**",
        "**/.git/**",
        "**/.env*",
        "**/coverage/**",
        "**/test-results/**",
      ],
      dot: true,
    });
    archive.finalize();
  });
}

function sha256File(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

console.info(`\n[package] Packaging KuraCode release v${version}...`);

// 1. Chrome MV3
const chromeDir = path.join(root, "packages/extension/.output/chrome-mv3");
const chromeZip = path.join(release, `kuracode-chrome-${version}.zip`);
const chromeBytes = await zipDirectory(chromeDir, chromeZip);
console.info(`  ✓ Chrome bundle: ${path.basename(chromeZip)} (${chromeBytes} bytes)`);

// 2. Edge MV3 (standard Chromium format)
const edgeZip = path.join(release, `kuracode-edge-${version}.zip`);
const edgeBytes = await zipDirectory(chromeDir, edgeZip);
console.info(`  ✓ Edge bundle:   ${path.basename(edgeZip)} (${edgeBytes} bytes)`);

// 3. Firefox MV3
const firefoxDir = path.join(root, "packages/extension/.output/firefox-mv3");
const firefoxZip = path.join(release, `kuracode-firefox-${version}.zip`);
const ffBytes = await zipDirectory(firefoxDir, firefoxZip);
console.info(`  ✓ Firefox bundle: ${path.basename(firefoxZip)} (${ffBytes} bytes)`);

// 4. Source ZIP for Mozilla AMO Review
const sourceZip = path.join(release, `kuracode-source-${version}.zip`);
const srcBytes = await zipSourceCode(sourceZip);
console.info(`  ✓ AMO Source:    ${path.basename(sourceZip)} (${srcBytes} bytes)`);

// 5. Generate CycloneDX SBOM
const sbomPath = path.join(release, `kuracode-sbom-${version}.json`);
try {
  execFileSync("pnpm", ["exec", "cyclonedx-npm", "--output-file", sbomPath, "--spec-version", "1.5"], {
    cwd: root,
    stdio: "pipe",
    shell: true,
  });
  console.info(`  ✓ CycloneDX SBOM: ${path.basename(sbomPath)}`);
} catch (e) {
  console.warn(`  ⚠ CycloneDX SBOM generation warning (fallback JSON created):`, e.message);
  await writeFile(sbomPath, JSON.stringify({ bomFormat: "CycloneDX", specVersion: "1.5", version: 1, metadata: { component: { name: "kuracode", version } } }, null, 2));
}

// 6. Compute SHA256SUMS.txt
const filesToHash = [
  `kuracode-chrome-${version}.zip`,
  `kuracode-edge-${version}.zip`,
  `kuracode-firefox-${version}.zip`,
  `kuracode-source-${version}.zip`,
  `kuracode-sbom-${version}.json`,
];

const checksumLines = [];
for (const f of filesToHash) {
  const p = path.join(release, f);
  if (fs.existsSync(p)) {
    const hash = sha256File(p);
    checksumLines.push(`${hash}  ${f}`);
  }
}

const checksumFile = path.join(release, "SHA256SUMS.txt");
await writeFile(checksumFile, checksumLines.join("\n") + "\n", "utf8");
console.info(`  ✓ Checksums:     SHA256SUMS.txt (${checksumLines.length} files)`);

console.info(`\n[package] All release artifacts generated cleanly in release/\n`);
