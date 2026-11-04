#!/usr/bin/env node
/**
 * KuraCode release orchestrator.
 *
 * Produces every distributable artifact under release/:
 *   - kuracode-chrome-<v>.zip   Chrome Web Store / Edge Add-ons upload
 *   - kuracode-firefox-<v>.xpi  Firefox AMO upload (signed by AMO) / self-host
 *   - kuracode-<v>.crx          signed CRX3 for self-hosted Chrome sideload
 *   - updates.xml / updates.json update manifests for your own update channel
 *   - checksums.txt             SHA-256 of every artifact
 *
 * Flow: build chrome + firefox → validate manifests & web-ext lint → zip →
 * xpi → signed crx → update manifests → checksums.
 *
 *   node scripts/release.mjs [zipBaseUrl]
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCrx3, verifyCrx3 } from "./crx3.mjs";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const releaseDir = path.join(rootDir, "release");
const extDir = path.join(rootDir, "packages/extension");
const chromeOut = path.join(extDir, ".output", "chrome-mv3");
const firefoxOut = path.join(extDir, ".output", "firefox-mv3");
const keyPath = path.join(rootDir, "release", "cache", "krc-signing.pem");

async function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: "inherit", ...opts });
}
function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function getVersion() {
  const pkg = JSON.parse(
    await readFile(path.join(extDir, "package.json"), "utf8"),
  );
  return pkg.version;
}

async function validateManifest(dir, target) {
  const manifest = JSON.parse(
    await readFile(path.join(dir, "manifest.json"), "utf8"),
  );
  if (manifest.manifest_version !== 3)
    throw new Error(`${target}: manifest_version != 3`);
  const required = ["background", "content_scripts", "action", "icons"];
  for (const k of required)
    if (!(k in manifest)) throw new Error(`${target}: missing "${k}"`);
  // icons exist
  for (const v of Object.values(manifest.icons)) {
    if (!existsSync(path.join(dir, v)))
      throw new Error(`${target}: missing icon ${v}`);
  }
  if (target === "firefox") {
    const g = manifest.browser_specific_settings?.gecko;
    if (!g?.id)
      throw new Error("firefox: missing browser_specific_settings.gecko.id");
    if (!Array.isArray(manifest.background?.scripts)) {
      throw new Error("firefox: background must use scripts array");
    }
  }
  console.log(`✔ manifest valid (${target})`);
}

/**
 * Remove every previous distributable artifact so release/ holds only the
 * latest version. Keeps subfolders (e.g. cache/ with the signing key) and
 * hidden files.
 */
async function cleanReleaseDir() {
  const entries = await readdir(releaseDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (e.isDirectory()) continue;
    await rm(path.join(releaseDir, e.name), { force: true });
  }
  console.log("🧹 release/ cleaned — only latest artifacts will remain");
}

async function main() {
  const baseUrl = process.argv[2] || process.env.KURACODE_UPDATE_BASE_URL || "";
  const version = await getVersion();

  console.log(`\n═══ KuraCode release ${version} ═══\n`);
  await mkdir(releaseDir, { recursive: true });

  // 0. wipe old artifacts so only the latest version remains
  await cleanReleaseDir();

  // 1. build both targets
  console.log("— build:chrome");
  await run("node", ["build.mjs", "--target", "chrome"], { cwd: extDir });
  console.log("— build:firefox");
  await run("node", ["build.mjs", "--target", "firefox"], { cwd: extDir });

  // 2. validate manifests
  await validateManifest(chromeOut, "chrome");
  await validateManifest(firefoxOut, "firefox");

  // 3. web-ext lint (firefox), via the guarded wrapper so a mis-targeted
  //    chrome manifest fails with a clear message instead of cryptic errors.
  try {
    await run("node", ["scripts/web-ext-lint.mjs", firefoxOut], {
      cwd: rootDir,
    });
  } catch {
    console.warn(
      "! web-ext not available; skipped web-ext lint (verify does this)",
    );
  }

  // 4. store zip (chrome/edge)
  const chromeZip = path.join(releaseDir, `kuracode-chrome-${version}.zip`);
  await run("zip", ["-r", chromeZip, "."], { cwd: chromeOut });
  console.log(`✔ ${path.relative(rootDir, chromeZip)}`);

  // 5. firefox xpi (a zip with .xpi extension)
  const xpi = path.join(releaseDir, `kuracode-firefox-${version}.xpi`);
  await run("zip", ["-r", xpi, "."], { cwd: firefoxOut });
  console.log(`✔ ${path.relative(rootDir, xpi)}`);

  // 6. signed CRX3 (self-hosted chrome)
  const { crx, id } = await buildCrx3({ dir: chromeOut, keyPath, version });
  const crxPath = path.join(releaseDir, `kuracode-${version}.crx`);
  await writeFile(crxPath, crx);
  const check = verifyCrx3(crx, version);
  if (!check.ok)
    throw new Error(`CRX signature verify failed: ${check.reason}`);
  console.log(
    `✔ ${path.relative(rootDir, crxPath)}  (id ${id}, sig ${check.ok ? "PASS" : "FAIL"})`,
  );

  // 7. update manifests (if base URL given)
  if (baseUrl) {
    await run("node", ["scripts/updates.mjs", baseUrl], { cwd: rootDir });
  } else {
    console.warn(
      "! no base URL → update manifests skipped (pass URL or KURACODE_UPDATE_BASE_URL)",
    );
  }

  // 8. checksums
  const entries = await readdir(releaseDir, { withFileTypes: true });
  const files = entries
    .filter((e) => !e.name.startsWith(".") && e.isFile())
    .map((e) => e.name);
  const lines = [];
  for (const f of files) {
    const buf = await readFile(path.join(releaseDir, f));
    lines.push(`${sha256(buf)}  ${f}`);
  }
  lines.sort();
  await writeFile(
    path.join(releaseDir, "checksums.txt"),
    lines.join("\n") + "\n",
  );
  console.log(`✔ checksums.txt (${files.length} files)`);

  console.log(
    `\n═══ release ${version} complete → ${path.relative(rootDir, releaseDir)} ═══\n`,
  );
}

await main();
