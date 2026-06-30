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

const match = html.match(/<script type="application\/json" id="evidence-data">([\s\S]*?)<\/script>/);
failIf(!match, "Missing embedded evidence-data");

let data = null;
if (match) {
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    failures.push(`evidence-data is not valid JSON: ${error.message}`);
  }
}

if (data) {
  failIf(!data.homeSummary, "homeSummary is missing");
  failIf(!Array.isArray(data.coverageMatrix) || data.coverageMatrix.length < 13, "coverageMatrix is incomplete");
  failIf(!Array.isArray(data.evidenceFlows) || data.evidenceFlows.length !== data.claims.length, "evidenceFlows must map every claim");
  failIf(!data.objectSupportIndex || Object.keys(data.objectSupportIndex).length < 25, "objectSupportIndex is missing or too small");
  failIf(!Array.isArray(data.viewModels), "viewModels is missing");

  const routes = new Set((data.viewModels || []).map((view) => view.route));
  for (const route of requiredRoutes) {
    failIf(!routes.has(route), `Missing view model route ${route}`);
  }

  for (const view of data.viewModels || []) {
    failIf(!Array.isArray(view.lanes) || view.lanes.length === 0, `View ${view.route} has no lanes`);
    failIf(!Array.isArray(view.legend) || view.legend.length === 0, `View ${view.route} has no legend`);
    if (view.route !== "ontology-graph-explorer") {
      failIf(!Array.isArray(view.acceptance_queries) || view.acceptance_queries.length === 0, `View ${view.route} has no acceptance queries`);
    }
  }

  for (const flow of data.evidenceFlows || []) {
    failIf(!flow.source_id || !flow.claim_id, `Flow ${flow.id} missing source or claim`);
    failIf(!Array.isArray(flow.object_ids) || flow.object_ids.length === 0, `Flow ${flow.id} has no ontology objects`);
    failIf(!Array.isArray(flow.gate_ids) || flow.gate_ids.length === 0, `Flow ${flow.id} has no gate mapping`);
  }
}

console.log("Workbench view model check");
if (data) {
  console.log(`Routes: ${data.viewModels.length}`);
  console.log(`Flows: ${data.evidenceFlows.length}`);
  console.log(`Coverage rows: ${data.coverageMatrix.length}`);
}

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("Workbench view model check passed.");
