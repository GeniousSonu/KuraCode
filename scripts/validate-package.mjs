#!/usr/bin/env node
/**
 * validate-package.mjs — final gate before you publish anything.
 *
 * Opens the ACTUAL distributable file (zip / xpi / crx) that you would upload
 * and asserts its embedded manifest.json is the correct one for the target.
 *
 * Why this exists: the three most confusing web-ext errors —
 *   • "background/service_worker ... without background/scripts"
 *   • "add-on ID is required in MV3"
 *   • "data_collection_permissions is missing"
 * — all appear when a CHROME manifest is linted by web-ext or uploaded to AMO.
 * They do NOT come from the Firefox build (which passes 0 errors); they come
 * from accidentally publishing/linting the Chrome artifact. This validator
 * inspects the exact file you would upload and refuses to proceed if it is
 * the wrong manifest, so you can never publish the wrong artifact again.
 *
 * Usage:
 *   node scripts/validate-package.mjs <file> [chrome|firefox|auto]
 * Example:
 *   node scripts/validate-package.mjs release/kuracode-firefox-0.1.0.xpi firefox
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`✔ ${msg}`);
}

// Minimal zip reader: locate entry[ local file header, read its stored bytes.
function unzipEntry(buf, wantName) {
  let i = 0;
  while (i + 30 <= buf.length) {
    if (buf.readUInt32LE(i) !== 0x04034b50) break; // local file header sig
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const uncompSize = buf.readUInt32LE(i + 22);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nameLen).toString("utf8");
    const dataStart = i + 30 + nameLen + extraLen;
    if (name === wantName) {
      let data = buf.subarray(dataStart, dataStart + uncompSize);
      if (method === 8) {
        data = inflateRawSync(data); // raw deflate (zip stores no zlib header)
      } else if (method !== 0) {
        fail(`unsupported zip method ${method} for ${wantName}`);
      }
      return data;
    }
    i = dataStart + compSize;
  }
  fail(`entry "${wantName}" not found in zip`);
}

async function manifestFromZip(file) {
  const buf = await readFile(file);
  const json = unzipEntry(buf, "manifest.json").toString("utf8");
  return JSON.parse(json);
}

const file = process.argv[2];
const want = process.argv[3] || "auto";
if (!file)
  fail("usage: node scripts/validate-package.mjs <file> [chrome|firefox|auto]");
if (
  !file.endsWith(".zip") &&
  !file.endsWith(".xpi") &&
  !file.endsWith(".crx")
) {
  fail(`unexpected extension on ${file} (expected .zip / .xpi / .crx)`);
}

const target =
  want === "auto" ? (file.includes("firefox") ? "firefox" : "chrome") : want;
const manifest = await manifestFromZip(file);

console.log(`\nValidating ${path.basename(file)} as a ${target} package…\n`);

if (target === "firefox") {
  const g = manifest.browser_specific_settings?.gecko;
  if (!g?.id)
    fail(
      "MISSING browser_specific_settings.gecko.id (add-on ID required in MV3)",
    );
  ok(`gecko.id = ${g.id}`);
  if (!Array.isArray(manifest.background?.scripts)) {
    fail(
      "MISSING background.scripts array (Firefox requires it; service_worker is NOT valid here)",
    );
  }
  if (manifest.background?.service_worker) {
    fail(
      "FOUND background.service_worker — this is a CHROME manifest. Firefox requires background.scripts. You are about to publish the WRONG file to AMO.",
    );
  }
  ok("background.scripts present, no service_worker");
  if (
    typeof manifest.browser_specific_settings?.gecko
      ?.data_collection_permissions !== "object"
  ) {
    fail(
      "MISSING browser_specific_settings.gecko.data_collection_permissions (required object)",
    );
  }
  ok("data_collection_permissions object present");
  console.log("\n✔ This is a valid Firefox package — safe to upload to AMO.\n");
} else {
  if (manifest.background?.service_worker !== "background.js") {
    fail("chrome package must use background.service_worker");
  }
  ok("background.service_worker present");
  if (manifest.browser_specific_settings?.gecko) {
    fail("chrome package should NOT contain browser_specific_settings.gecko");
  }
  console.log(
    "\n✔ This is a valid Chrome/Edge package — safe to upload to the stores.\n",
  );
}
