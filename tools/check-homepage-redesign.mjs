#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

const html = readFileSync(join(ROOT, "visualization", "index.html"), "utf8");
const failures = [];

function failIf(condition, message) {
  if (condition) failures.push(message);
}

failIf(!html.includes('id="audit-shell"'), "Homepage is missing audit-shell");
failIf(!html.includes('data-route="evidence-atlas"'), "Default route must be evidence-atlas");
failIf(!html.includes("Evidence-to-Ontology Audit Workbench"), "Audit workbench label is missing");
for (const column of ["source", "claim", "object", "gap"]) {
  failIf(!html.includes(`data-flow-column="${column}"`), `Evidence Atlas is missing ${column} flow column`);
}
failIf(!html.includes('data-view-pane="ontology-graph-explorer"'), "Ontology Graph Explorer pane is missing");
failIf(!/data-view-pane="ontology-graph-explorer"[\s\S]*?<svg id="canvas">/.test(html), "D3 canvas must live inside ontology-graph-explorer");
failIf(!/\.research-workbench,\.evidence-audit,\.coverage-strip\{display:none\}/.test(html), "Legacy overlay panels must be hidden by default");
failIf(!html.includes("function setAuditRoute"), "Route switching function is missing");

console.log("Homepage redesign check");
if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("Homepage redesign check passed.");
