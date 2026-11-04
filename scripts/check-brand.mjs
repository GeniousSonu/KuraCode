#!/usr/bin/env node
/**
 * KuraCode brand checks — run by `npm run brand:check` (and verify.sh/CI).
 *
 * 1. Dimension test: every generated PNG matches its declared size (read the
 *    IHDR header — no trusting of filenames).
 * 2. SVGs are well-formed, have a viewBox, and contain no scripts/external refs.
 * 3. Asset test: every icon path referenced by the extension manifest and the
 *    web index.html exists in the built output (if built), at the right size.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GEN = path.join(ROOT, "brand", "generated");

const EXPECTED = {
  "extension/icon-16.png": [16, 16],
  "extension/icon-32.png": [32, 32],
  "extension/icon-48.png": [48, 48],
  "extension/icon-96.png": [96, 96],
  "extension/icon-128.png": [128, 128],
  "action/icon-light-16.png": [16, 16],
  "action/icon-light-24.png": [24, 24],
  "action/icon-light-32.png": [32, 32],
  "action/icon-light-48.png": [48, 48],
  "action/icon-light-64.png": [64, 64],
  "action/icon-dark-16.png": [16, 16],
  "action/icon-dark-32.png": [32, 32],
  "store/chrome-web-store-128.png": [128, 128],
  "store/edge-300.png": [300, 300],
  "store/promo-440x280.png": [440, 280],
  "store/marquee-1400x560.png": [1400, 560],
  "web/favicon-16.png": [16, 16],
  "web/favicon-32.png": [32, 32],
  "web/favicon-48.png": [48, 48],
  "web/apple-touch-icon-180.png": [180, 180],
  "web/pwa-192.png": [192, 192],
  "web/pwa-512.png": [512, 512],
  "web/maskable-192.png": [192, 192],
  "web/maskable-512.png": [512, 512],
  "social/og-image-1200x630.png": [1200, 630],
  "social/twitter-card-1200x600.png": [1200, 600],
};

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};

/** Read PNG pixel dimensions from the IHDR header. */
function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return [width, height];
}

console.log("check: dimensions");
for (const [rel, [w, h]] of Object.entries(EXPECTED)) {
  const file = path.join(GEN, rel);
  if (!fs.existsSync(file)) {
    fail(`${rel} missing`);
    continue;
  }
  try {
    const [aw, ah] = pngSize(fs.readFileSync(file));
    if (aw !== w || ah !== h) fail(`${rel} size ${aw}×${ah} != ${w}×${h}`);
  } catch (e) {
    fail(`${rel} unreadable (${e.message})`);
  }
}

console.log("check: svg well-formed (viewBox, no scripts/external)");
for (const rel of [
  "web/favicon.svg",
  "docs/logo-mark.svg",
  "docs/logo-light.svg",
  "docs/logo-dark.svg",
]) {
  const file = path.join(GEN, rel);
  if (!fs.existsSync(file)) {
    fail(`${rel} missing`);
    continue;
  }
  const s = fs.readFileSync(file, "utf8");
  if (!/<svg[^>]*viewBox=/.test(s)) fail(`${rel} missing viewBox`);
  if (/<script/i.test(s)) fail(`${rel} contains <script>`);
  if (/href="https?:/.test(s)) fail(`${rel} contains external reference`);
}

console.log("check: asset references in manifests/web exist in built output");
const checkManifest = (manifestPath) => {
  if (!fs.existsSync(manifestPath)) return;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const refs = [];
  if (manifest.icons)
    Object.values(manifest.icons).forEach((v) => refs.push(v));
  if (manifest.action?.default_icon) {
    if (typeof manifest.action.default_icon === "string")
      refs.push(manifest.action.default_icon);
    else
      Object.values(manifest.action.default_icon).forEach((v) => refs.push(v));
  }
  const distDir = path.dirname(manifestPath);
  for (const ref of refs) {
    const p = path.join(distDir, ref);
    if (!fs.existsSync(p)) fail(`manifest ref not in build: ${ref}`);
  }
};
checkManifest(
  path.join(ROOT, "packages", "extension", "dist", "manifest.json"),
);

const webIndex = path.join(ROOT, "packages", "web", "dist", "index.html");
if (fs.existsSync(webIndex)) {
  const html = fs.readFileSync(webIndex, "utf8");
  const hrefs = [
    ...html.matchAll(
      /(?:href|content)="([^"]+\.(?:ico|png|svg|webmanifest))"/g,
    ),
  ].map((m) => m[1]);
  const webDist = path.dirname(webIndex);
  for (const ref of hrefs) {
    if (!fs.existsSync(path.join(webDist, ref)))
      fail(`web ref not in build: ${ref}`);
  }
}

if (failures) {
  console.error(`\nbrand check FAILED (${failures})`);
  process.exit(1);
}
console.log("\nbrand check PASSED");
