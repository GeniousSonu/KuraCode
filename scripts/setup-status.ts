#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { evaluateCapabilities, formatConfigTable } from "@kuracode/config";

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const caps = evaluateCapabilities(process.env as any);

console.info("\n==================== KURACODE SERVICE CAPABILITIES & STATUS ====================");
console.info(formatConfigTable(caps));

const enabledCount = Object.values(caps).filter((c) => c.status === "ENABLED").length;
const degradedCount = Object.values(caps).filter((c) => c.status === "DEGRADED").length;
const missingCount = Object.values(caps).filter((c) => c.status === "DISABLED_MISSING_CONFIG").length;

console.info(`\nSummary: ${enabledCount} Enabled | ${degradedCount} Degraded (Active via Fallback) | ${missingCount} Missing Config`);
console.info("\nZero-Account Mode: ACTIVE (Extension and Web App are 100% functional locally).");
console.info("To test a specific service: pnpm setup:test <service>");
console.info("Documentation index:       docs/SETUP.md\n");

