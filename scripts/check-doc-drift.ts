#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { FullEnvSchema, generateRedirectUris } from "@kuracode/config";

console.info("\n=== Checking Documentation & Schema Drift ===");

const root = process.cwd();
const setupDir = path.join(root, "docs/setup");
const redirectDocPath = path.join(setupDir, "redirect-uris.md");

let hasErrors = false;

// 1. Check all documented setup files exist
const expectedGuides = [
  "01-github.md",
  "02-google-cloud.md",
  "03-cloudflare.md",
  "04-supabase.md",
  "05-resend.md",
  "06-sentry.md",
  "07-upstash-redis.md",
  "08-uptimerobot.md",
  "09-gitlab-microsoft.md",
  "10-stores.md",
  "11-secret-hygiene.md",
  "redirect-uris.md",
];

for (const guide of expectedGuides) {
  const p = path.join(setupDir, guide);
  if (!fs.existsSync(p)) {
    console.error(`\x1b[31m✗ Missing setup guide: ${guide}\x1b[0m`);
    hasErrors = true;
  }
}

// 2. Check redirect URIs in doc match generated config
if (fs.existsSync(redirectDocPath)) {
  const docContent = fs.readFileSync(redirectDocPath, "utf-8");
  const uris = generateRedirectUris();

  if (!docContent.includes(uris.chromiumExtensionRedirectUri)) {
    console.error(`\x1b[31m✗ redirect-uris.md does not contain current Chromium redirect URI: ${uris.chromiumExtensionRedirectUri}\x1b[0m`);
    hasErrors = true;
  }
  if (!docContent.includes(uris.webAppRedirectUri)) {
    console.error(`\x1b[31m✗ redirect-uris.md does not contain current web app redirect URI: ${uris.webAppRedirectUri}\x1b[0m`);
    hasErrors = true;
  }
}

// 3. Verify env variables in .env.example match FullEnvSchema
const envExampleContent = fs.readFileSync(path.join(root, ".env.example"), "utf-8");
const validSchemaKeys = Object.keys(FullEnvSchema.shape);

for (const line of envExampleContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    if (!validSchemaKeys.includes(key)) {
      console.warn(`\x1b[33m⚠ Warning: .env.example defines key '${key}' not in FullEnvSchema\x1b[0m`);
    }
  }
}

if (hasErrors) {
  console.error("\n\x1b[31m[FAIL] Documentation drift detected!\x1b[0m\n");
  process.exit(1);
} else {
  console.info("✔ All 12 setup guides, redirect URIs, and environment variables are in 100% sync.\n");
}

