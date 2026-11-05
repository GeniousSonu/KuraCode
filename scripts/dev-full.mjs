#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

console.info("\n============================================================");
console.info("       KURACODE FULL-STACK LOCAL ZERO-ACCOUNT DEV           ");
console.info("============================================================");
console.info("Starting local mock services & API server on http://localhost:3000");
console.info("- Mock OIDC Identity Provider (Google, GitHub, GitLab, Microsoft)");
console.info("- Local Mail Catcher Inbox: http://localhost:3000/api/mail/inbox");
console.info("- Turnstile Stub Verifier:   http://localhost:3000/api/turnstile/verify");
console.info("- Liveness / Readiness:      http://localhost:3000/healthz");
console.info("- Manual Test Page:          http://localhost:7331/demo.html\n");

const procs = [];

// 1. Start API & Mock Services server
const apiProc = spawn("node", ["packages/api/src/server.ts"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: "3000" },
});
procs.push(apiProc);

// 2. Start demo server on port 7331
const demoProc = spawn("node", ["scripts/server-demo.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: "7331" },
});
procs.push(demoProc);

process.on("SIGINT", () => {
  console.info("\nShutting down full-stack dev services...");
  procs.forEach((p) => p.kill("SIGINT"));
  process.exit(0);
});

