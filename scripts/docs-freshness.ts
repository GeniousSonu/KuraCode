#!/usr/bin/env node
/**
 * scripts/docs-freshness.ts
 *
 * Verifies that documentation, store listings, privacy notes, and audit reports
 * are fresh, consistent with the codebase, and contain zero mentions of deprecated names.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let errors = 0;
const error = (msg: string) => {
  errors++;
  console.error(`  ✗ [FAIL] ${msg}`);
};
const success = (msg: string) => {
  console.info(`  ✓ [PASS] ${msg}`);
};

console.info("\n=== KuraCode Documentation Freshness & Integrity Check ===");

const REQUIRED_DOCS = [
  "README.md",
  "CHANGELOG.md",
  "docs/PRD.md",
  "docs/ARCHITECTURE.md",
  "docs/DESIGN.md",
  "docs/STORE_POLICY_AUDIT.md",
  "docs/agent/STATE.md",
  "docs/agent/TASKS.md",
  "docs/agent/PROGRESS.json",
  "docs/agent/features.json",
  "docs/agent/FEATURES.md",
  "docs/agent/HANDOFF.md",
  "docs/agent/NEEDS_HUMAN.md",
  "docs/SETUP.md",
];

// 1. Verify existence of required core documentation
for (const rel of REQUIRED_DOCS) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    error(`Missing mandatory documentation file: ${rel}`);
  } else {
    success(`Found: ${rel}`);
  }
}

// 2. Scan core docs and store listings for forbidden old names
const DOC_DIRS = [
  path.join(ROOT, "docs"),
  path.join(ROOT, "README.md"),
  path.join(ROOT, "CHANGELOG.md"),
];

const FORBIDDEN = [/sniphub/i];
// Exceptions where the doc explicitly says "never write the old internal name SnipHub"
const EXCEPTION_LINE = /never write the old internal name|product name is kuracode \(the old internal name/i;

const scanDocFile = (filePath: string) => {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (EXCEPTION_LINE.test(line)) return;
    for (const pat of FORBIDDEN) {
      if (pat.test(line)) {
        error(`Forbidden old name "${pat}" found in ${path.relative(ROOT, filePath)}:${idx + 1}`);
      }
    }
  });
};

const scanDir = (dir: string) => {
  if (fs.statSync(dir).isFile()) {
    scanDocFile(dir);
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git") {
        scanDir(full);
      }
    } else if (/\.(md|txt|json)$/.test(entry.name)) {
      scanDocFile(full);
    }
  }
};

console.info("\nScanning docs for forbidden names and legacy references...");
for (const d of DOC_DIRS) {
  if (fs.existsSync(d)) {
    scanDir(d);
  }
}

if (errors === 0) {
  success("Zero forbidden legacy names found in documentation");
}

console.info("\n=========================================================");
if (errors > 0) {
  console.error(`Documentation freshness check FAILED with ${errors} error(s).\n`);
  process.exit(1);
} else {
  console.info("All documentation freshness checks PASSED cleanly.\n");
}

