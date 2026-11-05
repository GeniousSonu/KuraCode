#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");

if (!fs.existsSync(envLocalPath)) {
  console.info("Notice: .env.local does not exist yet. Run `pnpm setup:env` first.");
  process.exit(0);
}

const content = fs.readFileSync(envLocalPath, "utf-8");
const parsed: Record<string, string> = {};

for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (val) parsed[key] = val;
  }
}

const repoSecrets = [
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_SECRET",
  "GITLAB_CLIENT_SECRET",
  "MICROSOFT_CLIENT_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "TURNSTILE_SECRET_KEY",
  "SESSION_SECRET",
  "JWT_SECRET",
];

const chromeEnvSecrets = ["CHROME_EXTENSION_ID", "CHROME_CLIENT_ID", "CHROME_CLIENT_SECRET", "CHROME_REFRESH_TOKEN"];
const edgeEnvSecrets = ["EDGE_PRODUCT_ID", "EDGE_CLIENT_ID", "EDGE_API_KEY"];
const firefoxEnvSecrets = ["FIREFOX_API_KEY", "FIREFOX_API_SECRET", "FIREFOX_EXTENSION_ID"];

console.info("\n==================== GITHUB ACTIONS SECRETS HELPER ====================");
console.info("Run these commands in your terminal using the GitHub CLI (`gh`):\n");

console.info("# 1. Repository Secrets (Main CI/CD & Integration):");
for (const sec of repoSecrets) {
  if (parsed[sec]) {
    console.info(`gh secret set ${sec} --body "$${sec}"`);
  } else {
    console.info(`# ${sec} is not yet filled in .env.local`);
  }
}

console.info("\n# 2. Chrome Web Store Environment Secrets (Environment: chrome-web-store):");
for (const sec of chromeEnvSecrets) {
  if (parsed[sec]) {
    console.info(`gh secret set ${sec} --env chrome-web-store --body "$${sec}"`);
  }
}

console.info("\n# 3. Microsoft Edge Add-ons Environment Secrets (Environment: edge-addons):");
for (const sec of edgeEnvSecrets) {
  if (parsed[sec]) {
    console.info(`gh secret set ${sec} --env edge-addons --body "$${sec}"`);
  }
}

console.info("\n# 4. Mozilla Firefox AMO Environment Secrets (Environment: firefox-amo):");
for (const sec of firefoxEnvSecrets) {
  if (parsed[sec]) {
    console.info(`gh secret set ${sec} --env firefox-amo --body "$${sec}"`);
  }
}

console.info("\n=========================================================================");
console.info("NOTE: Secrets are safely referenced via variables without printing values.");
console.info("=========================================================================\n");

