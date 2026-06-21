#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

const html = readFileSync(join(ROOT, "visualization", "index.html"), "utf8");
const failures = [];
const requiredRoutes = [
  "evidence-atlas",
  "system-blueprint",
  "protocol-flow",
  "runtime-trace",
  "safety-surface",
  "evaluation-coverage",
  "ontology-graph-explorer",
];

function failIf(condition, message) {
  if (condition) failures.push(message);
}

for (const route of requiredRoutes) {
  failIf(!html.includes(`data-view-route="${route}"`), `Missing route button ${route}`);
  failIf(!html.includes(`data-view-pane="${route}"`), `Missing route pane ${route}`);
}

failIf(!html.includes("function setAuditRoute"), "setAuditRoute function missing");
failIf(!html.includes("viewModelByRoute.has(route)"), "Route validation against viewModelByRoute missing");
failIf(!html.includes("history.replaceState"), "Route hash/state update missing");
failIf(!html.includes("location.hash"), "Initial route must be hash-aware");
failIf(!html.includes('data-view-pane="ontology-graph-explorer"'), "Graph explorer route missing");
failIf(!html.includes("fitAll(0)"), "Graph explorer must refit old D3 canvas on route activation");

const evidenceData = html.match(/<script type="application\/json" id="evidence-data">([\s\S]*?)<\/script>/);
if (evidenceData) {
  const data = JSON.parse(evidenceData[1]);
  const modelRoutes = new Set((data.viewModels || []).map((view) => view.route));
  for (const route of requiredRoutes) {
    failIf(!modelRoutes.has(route), `Embedded viewModels missing route ${route}`);
  }
}

console.log("View routing check");
if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("View routing check passed.");
