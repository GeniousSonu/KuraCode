#!/usr/bin/env node
/**
 * KuraCode extension build script.
 * Bundles each entry point to a single IIFE file (required for content
 * scripts under MV3, which can't use ES modules) and copies static assets
 * (manifest, HTML) into the target output folder. Supports --target chrome
 * (default) or firefox, and --watch for development.
 */
import { build, context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, "src");

const argIndex = (name) => process.argv.indexOf(name);
const target =
  argIndex("--target") !== -1
    ? process.argv[argIndex("--target") + 1]
    : "chrome";
if (target !== "chrome" && target !== "firefox") {
  console.error(`[kura] unknown target "${target}" (expected chrome|firefox)`);
  process.exit(1);
}
const out =
  target === "firefox"
    ? path.join(root, ".output", "firefox-mv3")
    : path.join(root, ".output", "chrome-mv3");

const entries = {
  background: path.join(src, "background", "service-worker.ts"),
  content: path.join(src, "content", "capture.ts"),
  popup: path.join(src, "popup", "main.ts"),
  sidepanel: path.join(src, "sidepanel", "main.ts"),
};

const options = {
  entryPoints: entries,
  bundle: true,
  format: "iife",
  target: ["chrome114"],
  outdir: out,
  sourcemap: true,
  logLevel: "info",
  legalComments: "none",
};

const brandGenerated = path.join(root, "..", "..", "brand", "generated");

async function copyStatic() {
  await mkdir(out, { recursive: true });
  await cp(path.join(brandGenerated, "extension"), path.join(out, "icons"), {
    recursive: true,
    force: true,
  });
  await cp(path.join(brandGenerated, "action"), path.join(out, "action"), {
    recursive: true,
    force: true,
  });
  const manifestSrc =
    target === "firefox"
      ? path.join(root, "manifest.firefox.json")
      : path.join(root, "manifest.json");
  await cp(manifestSrc, path.join(out, "manifest.json"), { force: true });
  await cp(
    path.join(src, "popup", "index.html"),
    path.join(out, "popup.html"),
    { force: true },
  );
  await cp(
    path.join(src, "sidepanel", "index.html"),
    path.join(out, "sidepanel.html"),
    { force: true },
  );
}

const watch = process.argv.includes("--watch");
if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  await copyStatic();
  console.log(
    `[kura] watching… (extension output in ${path.relative(root, out)})`,
  );
} else {
  await rm(out, { recursive: true, force: true });
  await build(options);
  await copyStatic();
  const ok = existsSync(path.join(out, "manifest.json"));
  console.log(
    `[kura] extension build (${target}) complete → ${path.relative(root, out)} (${ok ? "ok" : "manifest missing!"})`,
  );
}
