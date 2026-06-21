#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";

const html = readFileSync(join(ROOT, "visualization", "index.html"), "utf8");
const catalog = parseYaml(readFileSync(join(ROOT, "references", "source-catalog.yaml"), "utf8"));
const matrix = parseYaml(readFileSync(join(ROOT, "references", "evidence-matrix.yaml"), "utf8"));
const failures = [];

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function failIf(condition, message) {
  if (condition) failures.push(message);
}

const match = html.match(/<script type="application\/json" id="evidence-data">([\s\S]*?)<\/script>/);
failIf(!match, "visualization/index.html is missing evidence-data JSON script");

let data = null;
if (match) {
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    failures.push(`evidence-data is not valid JSON: ${error.message}`);
  }
}

if (data) {
  failIf(asArray(data.sources).length !== asArray(catalog.sources).length, "Embedded source count does not match source-catalog.yaml");
  failIf(asArray(data.claims).length !== asArray(matrix.claims).length, "Embedded claim count does not match evidence-matrix.yaml");
  failIf(asArray(data.themeCoverage).length < asArray(catalog.coverage_policy?.required_themes).length, "Theme coverage index is incomplete");
  failIf(Object.keys(data.objectSupport || {}).length < 25, "Object support index is too small");
  for (const claim of asArray(data.claims)) {
    failIf(!claim.source_title, `Claim ${claim.id} is missing source_title`);
    failIf(!claim.ontology_impact, `Claim ${claim.id} is missing ontology_impact`);
  }
}

for (const requiredSnippet of [
  "function renderEvidenceWorkbench",
  "function selectWorkbenchClaim",
  "function evidenceDetailHtmlForNode",
  "data-workbench-view",
  "data-source-tier",
]) {
  failIf(!html.includes(requiredSnippet), `Workbench binding snippet missing: ${requiredSnippet}`);
}

console.log("Evidence workbench data check");
if (data) {
  console.log(`Sources: ${data.sources.length}`);
  console.log(`Claims: ${data.claims.length}`);
  console.log(`Supported objects: ${Object.keys(data.objectSupport || {}).length}`);
}

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Evidence workbench data check passed.");
