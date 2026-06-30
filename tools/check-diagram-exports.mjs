#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

const required = [
  ["reports/diagrams/upgrade-pipeline.mmd", /^flowchart\s+(LR|TB|TD|BT|RL)/m],
  ["reports/diagrams/protocol-flow.mmd", /^flowchart\s+(LR|TB|TD|BT|RL)/m],
  ["reports/diagrams/workbench-architecture.dot", /^digraph\s+[A-Za-z0-9_]+\s*\{/m],
];
const failures = [];

for (const [relativePath, pattern] of required) {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) {
    failures.push(`Missing diagram file: ${relativePath}`);
    continue;
  }
  const text = readFileSync(fullPath, "utf8").trim();
  if (!text) failures.push(`Diagram file is empty: ${relativePath}`);
  if (!pattern.test(text)) failures.push(`Diagram file has invalid header: ${relativePath}`);
  if (text.includes("undefined") || text.includes("TODO")) {
    failures.push(`Diagram file has unresolved placeholder: ${relativePath}`);
  }
}

console.log("Diagram export check");
console.log(`Files checked: ${required.length}`);

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Diagram export check passed.");
