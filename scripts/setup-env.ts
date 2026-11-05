#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const examplePath = path.join(rootDir, ".env.example");
const localPath = path.join(rootDir, ".env.local");

if (!fs.existsSync(examplePath)) {
  console.error("✗ .env.example not found.");
  process.exit(1);
}

if (fs.existsSync(localPath)) {
  console.info("✔ .env.local already exists. Preserving existing values without overwriting.");
  console.info("To see missing variables: pnpm setup:status");
  process.exit(0);
}

fs.copyFileSync(examplePath, localPath);
console.info("✔ Created .env.local from .env.example.");
console.info("You can now open .env.local and add API keys or client IDs one by one.");
console.info("Run `pnpm setup:status` to view the active capabilities anytime.");

