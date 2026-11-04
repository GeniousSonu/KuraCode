#!/usr/bin/env node
/**
 * KuraCode version bump helper.
 *
 * Reads the current version from packages/extension/package.json and bumps it
 * per a semver level (patch|minor|major), then rewrites it in every place that
 * pins the version (extension package.json, chrome + firefox manifests).
 *
 *   node scripts/bump.mjs patch|minor|major   (default patch)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extJson = path.join(rootDir, "packages/extension/package.json");
const chromeManifest = path.join(rootDir, "packages/extension/manifest.json");
const firefoxManifest = path.join(rootDir, "packages/extension/manifest.firefox.json");

async function main() {
  const level = process.argv[2] || "patch";
  if (!["patch", "minor", "major"].includes(level)) {
    console.error("usage: node scripts/bump.mjs patch|minor|major");
    process.exit(1);
  }
  const pkg = JSON.parse(await readFile(extJson, "utf8"));
  const [major, minor, patch] = pkg.version.split(".").map(Number);
  let next;
  if (level === "major") next = `${major + 1}.0.0`;
  else if (level === "minor") next = `${major}.${minor + 1}.0`;
  else next = `${major}.${minor}.${patch + 1}`;

  pkg.version = next;
  await writeFile(extJson, JSON.stringify(pkg, null, 2) + "\n");

  for (const p of [chromeManifest, firefoxManifest]) {
    const m = JSON.parse(await readFile(p, "utf8"));
    m.version = next;
    await writeFile(p, JSON.stringify(m, null, 2) + "\n");
  }
  console.log(`✔ version ${pkg.version} → ${next}`);
}

await main();
