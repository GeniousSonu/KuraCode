#!/usr/bin/env node
import path from "node:path";
import { scanDirectoryForLeakedSecrets } from "@kuracode/config";

const root = process.cwd();
const dirsToScan = [
  path.join(root, "packages/extension/.output"),
  path.join(root, "packages/web/dist"),
];

console.info("\n=== KuraCode Client Bundle Secret Leak Audit ===");

let hasLeaks = false;

for (const dir of dirsToScan) {
  const findings = scanDirectoryForLeakedSecrets(dir);
  if (findings.length > 0) {
    hasLeaks = true;
    console.error(`\x1b[31m✗ [LEAK DETECTED] in ${dir}:\x1b[0m`);
    for (const f of findings) {
      console.error(`  - ${f.file}:${f.line} -> ${f.pattern} (snippet: "${f.snippet}")`);
    }
  } else {
    console.info(`  ✔ [PASS] ${dir}: Zero leaked server secrets or private keys detected.`);
  }
}

if (hasLeaks) {
  console.error("\n\x1b[31m[FAIL] Server secrets detected in client bundle! Halting release.\x1b[0m\n");
  process.exit(1);
} else {
  console.info("================================================\nAll client bundle secret hygiene checks PASSED cleanly.\n");
}

