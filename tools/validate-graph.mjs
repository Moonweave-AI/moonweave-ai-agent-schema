#!/usr/bin/env node
import {
  loadOntologyArtifacts,
  buildNodeIndex,
  normalizeNodeIds,
} from "./lib/ontology-loader.mjs";

const NODE_ID_PATTERN = /^node\.[a-z][a-z0-9_]*$/;
const EDGE_ID_PATTERN = /^edge\.[a-zA-Z0-9_]*$/;

const NODE_REQUIRED = ["id", "artifact", "label", "description"];
const EDGE_REQUIRED = [
  "id",
  "artifact",
  "predicate",
  "source_domain",
  "target_range",
  "description",
];

function main() {
  console.log("Validating ontology graph schema...");
  const { nodes, edges } = loadOntologyArtifacts();
  const nodeIndex = buildNodeIndex(nodes);
  const errors = [];
  const warnings = [];
  const seenNodeIds = new Set();
  const seenEdgeIds = new Set();

  for (const node of nodes) {
    for (const field of NODE_REQUIRED) {
      if (node[field] === undefined || node[field] === null || node[field] === "") {
        errors.push(`Node missing required field '${field}': ${node._file}`);
      }
    }

    if (node.id) {
      if (!NODE_ID_PATTERN.test(node.id)) {
        errors.push(`Node id '${node.id}' does not match node.* pattern: ${node._file}`);
      }
      if (seenNodeIds.has(node.id)) {
        errors.push(`Duplicate node id '${node.id}': ${node._file}`);
      }
      seenNodeIds.add(node.id);
    }

    if (node.artifact && node.artifact !== "NodeClass") {
      warnings.push(`Unexpected node artifact '${node.artifact}': ${node._file}`);
    }
  }

  for (const edge of edges) {
    for (const field of EDGE_REQUIRED) {
      if (edge[field] === undefined || edge[field] === null || edge[field] === "") {
        errors.push(`Edge missing required field '${field}': ${edge._file}`);
      }
    }

    if (edge.id) {
      if (!EDGE_ID_PATTERN.test(edge.id)) {
        errors.push(`Edge id '${edge.id}' does not match edge.* pattern: ${edge._file}`);
      }
      if (seenEdgeIds.has(edge.id)) {
        errors.push(`Duplicate edge id '${edge.id}': ${edge._file}`);
      }
      seenEdgeIds.add(edge.id);
    }

    for (const sourceId of normalizeNodeIds(edge.source_domain)) {
      if (!nodeIndex.has(sourceId)) {
        errors.push(
          `Edge '${edge.id}' source_domain '${sourceId}' references unknown node: ${edge._file}`,
        );
      }
    }

    for (const targetId of normalizeNodeIds(edge.target_range)) {
      if (!nodeIndex.has(targetId)) {
        errors.push(
          `Edge '${edge.id}' target_range '${targetId}' references unknown node: ${edge._file}`,
        );
      }
    }
  }

  console.log(`Checked ${nodes.length} nodes and ${edges.length} edges`);

  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const warning of warnings) console.log(`  WARN: ${warning}`);
  }

  if (errors.length) {
    console.error(`\nValidation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`  ERROR: ${error}`);
    process.exit(1);
  }

  console.log("\nGraph validation passed.");
  process.exit(0);
}

main();
