import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "docs/agent/features.json");

if (!fs.existsSync(jsonPath)) {
  console.error("features.json does not exist. Run scripts/build-features-registry.ts first.");
  process.exit(1);
}

const features = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

console.info("\n================ KURACODE FEATURE REGISTRY REPORT ================");
console.info(`Total Features Tracked: ${features.length}\n`);

// Counts by status
const statusCounts: Record<string, number> = {};
const priorityCounts: Record<string, Record<string, number>> = {
  P0: {},
  P1: {},
  P2: {},
};
const surfaceCounts: Record<string, number> = {};

for (const f of features) {
  statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
  priorityCounts[f.priority][f.status] = (priorityCounts[f.priority][f.status] || 0) + 1;
  for (const s of f.surfaces) {
    surfaceCounts[s] = (surfaceCounts[s] || 0) + 1;
  }
}

console.info("STATUS BREAKDOWN:");
for (const [st, c] of Object.entries(statusCounts)) {
  console.info(`  ${st.padEnd(16)} : ${c}`);
}

console.info("\nPRIORITY BREAKDOWN:");
for (const [p, statuses] of Object.entries(priorityCounts)) {
  console.info(`  ${p}:`);
  for (const [st, c] of Object.entries(statuses)) {
    console.info(`    ${st.padEnd(14)} : ${c}`);
  }
}

console.info("\nSURFACE COVERAGE:");
for (const [s, c] of Object.entries(surfaceCounts)) {
  console.info(`  ${s.padEnd(10)} : ${c} features`);
}

// Check unverified P0/P1
const unverifiedP0P1 = features.filter(
  (f: any) =>
    (f.priority === "P0" || f.priority === "P1") &&
    f.status !== "VERIFIED" &&
    f.status !== "HARDENED" &&
    f.status !== "EXCELLENT"
);

console.info(`\nP0/P1 ITEMS REQUIRING COMPLETION / EVIDENCE (${unverifiedP0P1.length} remaining):`);
for (const f of unverifiedP0P1.slice(0, 15)) {
  console.info(`  [${f.priority}] ${f.id} (${f.status}): ${f.name}`);
}
if (unverifiedP0P1.length > 15) {
  console.info(`  ... and ${unverifiedP0P1.length - 15} more`);
}

console.info("==================================================================\n");

