#!/usr/bin/env node
/**
 * KuraCode update-manifest generator (self-hosted update channel).
 *
 * Produces:
 *   - release/updates.xml   Chrome/Edge update manifest (CRX self-host)
 *   - release/updates.json  Firefox update manifest (links to the XPI)
 *
 * For Chrome the manifest's "update_url" must point at updates.xml; for
 * Firefox "browser_specific_settings.gecko.update_url" points at updates.json.
 * Both are only used by self-hosted builds; store builds update through the
 * store. See docs/agent/RELEASE.md.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const releaseDir = path.join(rootDir, "release");
const extJson = path.join(rootDir, "packages/extension/package.json");

async function main() {
  const baseUrl = (process.argv[2] || process.env.KURACODE_UPDATE_BASE_URL || "").replace(/\/+$/, "");
  if (!baseUrl) {
    console.error("Provide the hosted base URL as argv[1] or KURACODE_UPDATE_BASE_URL");
    console.error("e.g. node scripts/updates.mjs https://updates.example.com/kuracode");
    process.exit(1);
  }
  const pkg = JSON.parse(await readFile(extJson, "utf8"));
  const version = pkg.version;

  const crxPath = path.join(releaseDir, `kuracode-${version}.crx`);
  const xpiPath = path.join(releaseDir, `kuracode-firefox-${version}.xpi`);
  if (!existsSync(crxPath)) console.warn(`! missing ${path.relative(rootDir, crxPath)}`);
  if (!existsSync(xpiPath)) console.warn(`! missing ${path.relative(rootDir, xpiPath)}`);

  // Chrome/Edge update manifest.
  const updatesXml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="kuracode">
    <updatecheck codebase="${baseUrl}/kuracode-${version}.crx" version="${version}" />
  </app>
</gupdate>
`;

  // Firefox update manifest (JSON format used by gecko).
  const updatesJson = JSON.stringify(
    {
      addons: {
        "kuracode@sahinur.islam": {
          updates: [
            {
              version,
              update_link: `${baseUrl}/kuracode-firefox-${version}.xpi`,
            },
          ],
        },
      },
    },
    null,
    2,
  );

  await writeFile(path.join(releaseDir, "updates.xml"), updatesXml);
  await writeFile(path.join(releaseDir, "updates.json"), updatesJson + "\n");
  console.log(`✔ updates.xml (Chrome/Edge) → release/updates.xml`);
  console.log(`✔ updates.json (Firefox)    → release/updates.json`);
  console.log(`  base URL: ${baseUrl}`);
  console.log(`  version:  ${version}`);
}

await main();
