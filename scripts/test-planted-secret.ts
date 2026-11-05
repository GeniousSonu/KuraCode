#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { scanDirectoryForLeakedSecrets } from "@kuracode/config";

console.info("\n=== Testing Client Bundle Secret Scanner with Planted Fake Secret ===");

const testDir = path.join(process.cwd(), ".cache/secret-test");
fs.mkdirSync(testDir, { recursive: true });

const plantedFile = path.join(testDir, "bundle-with-leak.js");
const plantedContent = `
// Client bundle simulation
export function init() {
  const roleKey = "SUPABASE_SERVICE_ROLE_KEY";
  const fakeToken = "re_1234567890abcdef12345678";
  return { roleKey, fakeToken };
}
`;

try {
  fs.writeFileSync(plantedFile, plantedContent, "utf-8");
  console.info(`1. Planted fake leaked secret in ${plantedFile}`);

  const findings = scanDirectoryForLeakedSecrets(testDir);
  console.info(`2. Scanner detected ${findings.length} findings:`);
  for (const f of findings) {
    console.info(`   - ${f.pattern} at ${f.file}:${f.line}`);
  }

  if (findings.length >= 2) {
    console.info("\x1b[32m✔ [SUCCESS] Scanner accurately caught both planted service-role key and API token!\x1b[0m\n");
  } else {
    console.error("\x1b[31m✗ [FAIL] Scanner failed to catch planted secrets.\x1b[0m\n");
    process.exit(1);
  }
} finally {
  // Clean up
  fs.rmSync(testDir, { recursive: true, force: true });
  console.info("3. Cleaned up planted secret test directory.");
}

