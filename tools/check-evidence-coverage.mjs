#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadOntologyArtifacts } from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";

const catalog = parseYaml(readFileSync(join(ROOT, "references", "source-catalog.yaml"), "utf8"));
const matrix = parseYaml(readFileSync(join(ROOT, "references", "evidence-matrix.yaml"), "utf8"));
const { nodes, edges, constraints, views } = loadOntologyArtifacts();
const nodeIds = new Set(nodes.map((node) => node.id));
const edgeIds = new Set(edges.map((edge) => edge.id));
const constraintIds = new Set(constraints.map((constraint) => constraint.id));
const viewIds = new Set(views.map((view) => view.id));
const sources = new Map((catalog.sources || []).map((source) => [source.id, source]));
const failures = [];
const seenClaims = new Set();

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function failIf(condition, message) {
  if (condition) failures.push(message);
}

for (const claim of asArray(matrix.claims)) {
  failIf(!/^claim\.[a-z0-9_.]+$/.test(claim.id || ""), `Invalid claim id: ${claim.id}`);
  failIf(seenClaims.has(claim.id), `Duplicate claim id: ${claim.id}`);
  seenClaims.add(claim.id);
  const source = sources.get(claim.source_id);
  failIf(!source, `Claim ${claim.id} references unknown source ${claim.source_id}`);
  failIf(!claim.claim, `Claim ${claim.id} missing claim text`);
  failIf(!claim.ontology_impact, `Claim ${claim.id} missing ontology_impact`);
  failIf(asArray(claim.themes).length === 0, `Claim ${claim.id} has no themes`);

  if (claim.status === "normative") {
    failIf(!source || source.normative_status !== "approved", `Normative claim ${claim.id} must use approved source`);
  }

  const supports =
    asArray(claim.supports_nodes).length +
    asArray(claim.supports_edges).length +
    asArray(claim.supports_constraints).length +
    asArray(claim.supports_views).length +
    asArray(claim.candidate_nodes).length;
  failIf(supports === 0, `Claim ${claim.id} maps to no ontology object or candidate`);

  for (const nodeId of asArray(claim.supports_nodes)) {
    failIf(!nodeIds.has(nodeId), `Claim ${claim.id} references unknown node ${nodeId}`);
  }
  for (const edgeId of asArray(claim.supports_edges)) {
    failIf(!edgeIds.has(edgeId), `Claim ${claim.id} references unknown edge ${edgeId}`);
  }
  for (const constraintId of asArray(claim.supports_constraints)) {
    failIf(!constraintIds.has(constraintId), `Claim ${claim.id} references unknown constraint ${constraintId}`);
  }
  for (const viewId of asArray(claim.supports_views)) {
    failIf(!viewIds.has(viewId), `Claim ${claim.id} references unknown view ${viewId}`);
  }
}

failIf(seenClaims.size < 25, `Evidence matrix too small: ${seenClaims.size} claims`);

console.log("Evidence coverage check");
console.log(`Claims: ${seenClaims.size}`);

if (failures.length) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Evidence coverage check passed.");
