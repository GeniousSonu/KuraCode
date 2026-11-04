#!/usr/bin/env node
// KuraCode release packaging: zips the built Chrome and Firefox outputs into
// release/sniphub-chrome-<version>.zip and sniphub-firefox-<version>.zip.
import { execFileSync } from "node:child_process";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(scriptsDir);
const release = path.join(root, "release");
const version = JSON.parse(
  await readFile(path.join(root, "packages/extension/package.json"), "utf8"),
).version;

await mkdir(release, { recursive: true });

const targets = [
  { name: "sniphub-chrome", dir: "packages/extension/.output/chrome-mv3" },
  { name: "sniphub-firefox", dir: "packages/extension/.output/firefox-mv3" },
];

for (const t of targets) {
  const src = path.join(root, t.dir);
  const out = path.join(release, `${t.name}-${version}.zip`);
  // zip -r <out> .  (run inside the output folder so paths are relative)
  execFileSync("zip", ["-r", out, "."], { cwd: src, stdio: "inherit" });
  console.log(`✔ ${path.relative(root, out)}`);
}
