#!/usr/bin/env node
/**
 * web-ext lint wrapper: runs web-ext lint but guards against linting a
 * Chromium (Chrome/Edge) manifest instead of the Firefox one.
 *
 * The three most confusing web-ext failures — "background/service_worker
 * without background/scripts", "add-on ID is required" and
 * "data_collection_permissions is missing" — all happen when web-ext is
 * pointed at the Chrome MV3 manifest, which legitimately uses
 * service_worker and has no browser_specific_settings.gecko block. This
 * wrapper detects that case and prints one actionable message instead.
 *
 * Usage: node scripts/web-ext-lint.mjs <source-dir>
 *   source-dir defaults to packages/extension/.output/firefox-mv3
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = process.argv[2] || path.join(root, "packages/extension/.output/firefox-mv3");

let manifest;
try {
  manifest = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8"));
} catch (err) {
  console.error(`✖ can't read ${path.join(dir, "manifest.json")}: ${err.message}`);
  process.exit(2);
}

const gecko = manifest.browser_specific_settings?.gecko;
if (!gecko?.id) {
  console.error(
    [
      `✖ ${dir} is not a Firefox manifest (no browser_specific_settings.gecko.id).`,
      "",
      "  web-ext lints Firefox add-ons only. Run it against the Firefox build:",
      `    node scripts/web-ext-lint.mjs packages/extension/.output/firefox-mv3`,
      "  (or run the full release/verify, which always lint the Firefox output).",
      "",
      "  The Chrome build (service_worker, no gecko block) is correct for Chrome;",
      "  it is intentionally NOT valid for web-ext / Firefox.",
    ].join("\n"),
  );
  process.exit(2);
}

try {
  execFileSync(
    "npx",
    ["--yes", "web-ext", "lint", "--source-dir", dir, "--no-input"],
    { stdio: "inherit" },
  );
} catch (err) {
  process.exit(err.status ?? 1);
}
