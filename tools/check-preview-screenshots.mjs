#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

const requiredPngs = [
  "reports/previews/desktop-overview.png",
  "reports/previews/desktop-evidence-matrix.png",
  "reports/previews/desktop-protocol-flow.png",
  "reports/previews/mobile-node-detail.png",
];
const html = readFileSync(join(ROOT, "visualization", "index.html"), "utf8");
const failures = [];

function hasPngSignature(filePath) {
  const header = readFileSync(filePath).subarray(0, 8);
  return header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

for (const rel of requiredPngs) {
  const full = join(ROOT, rel);
  if (!existsSync(full)) {
    failures.push(`Missing preview PNG: ${rel}`);
    continue;
  }
  const stat = statSync(full);
  if (stat.size < 1024) failures.push(`Preview PNG is too small to be useful: ${rel}`);
  if (!hasPngSignature(full)) failures.push(`Preview file is not a PNG: ${rel}`);
}

for (const snippet of ["research-workbench", "Evidence Matrix", "Protocol Flow", "Safety Surface", "Evaluation Coverage"]) {
  if (!html.includes(snippet)) failures.push(`Visualization missing workbench snippet: ${snippet}`);
}

console.log("Preview screenshot check");
console.log(`PNG targets: ${requiredPngs.length}`);

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Preview screenshot check passed.");

