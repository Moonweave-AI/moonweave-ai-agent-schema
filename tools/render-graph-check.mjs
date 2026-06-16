#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

function normalizeIds(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function main() {
  console.log("Rendering graph structure check...");

  const graphPath = join(ROOT, "visualization", "data", "ontology.graph.json");

  if (!existsSync(graphPath)) {
    console.error(`Missing ${graphPath}. Run: node tools/build-graph.mjs`);
    process.exit(1);
  }

  let graph;
  try {
    graph = JSON.parse(readFileSync(graphPath, "utf8"));
  } catch (error) {
    console.error(`Failed to parse ontology.graph.json: ${error.message}`);
    process.exit(1);
  }

  const errors = [];

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    errors.push("graph.nodes must be a non-empty array");
  }
  if (!Array.isArray(graph.edges) || graph.edges.length === 0) {
    errors.push("graph.edges must be a non-empty array");
  }
  if (!Array.isArray(graph.subgraphs) || graph.subgraphs.length === 0) {
    errors.push("graph.subgraphs must be a non-empty array");
  }

  const nodeIds = new Set((graph.nodes ?? []).map((n) => n.id));

  for (const edge of graph.edges ?? []) {
    for (const sourceId of normalizeIds(edge.source_domain)) {
      if (!nodeIds.has(sourceId)) {
        errors.push(`Broken reference: edge '${edge.id}' source '${sourceId}' not in nodes`);
      }
    }
    for (const targetId of normalizeIds(edge.target_range)) {
      if (!nodeIds.has(targetId)) {
        errors.push(`Broken reference: edge '${edge.id}' target '${targetId}' not in nodes`);
      }
    }
  }

  console.log(`Nodes: ${graph.nodes?.length ?? 0}`);
  console.log(`Edges: ${graph.edges?.length ?? 0}`);
  console.log(`Subgraphs: ${graph.subgraphs?.length ?? 0}`);

  if (errors.length) {
    console.error(`\nGraph render check failed (${errors.length} issue(s)):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log("\nGraph render check passed.");
  process.exit(0);
}

main();
