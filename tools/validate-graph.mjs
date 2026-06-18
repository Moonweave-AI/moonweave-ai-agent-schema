#!/usr/bin/env node
import {
  loadOntologyArtifacts,
  buildNodeIndex,
  normalizeNodeIds,
} from "./lib/ontology-loader.mjs";

const NODE_ID_PATTERN = /^node\.[a-z][a-z0-9_]*$/;
const EDGE_ID_PATTERN = /^edge\.[a-zA-Z0-9_]*$/;
const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;

const NODE_REQUIRED = [
  "id",
  "artifact",
  "label",
  "description",
  "intra_level",
  "intra_axis",
  "intra_axis_zh",
  "intra_group",
  "intra_group_zh",
  "intra_role",
];
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
  const nodesBySubgraph = new Map();

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

    if (!Number.isInteger(node.intra_level) || node.intra_level < 0) {
      errors.push(`Node '${node.id}' must declare non-negative integer intra_level: ${node._file}`);
    }

    for (const field of ["intra_axis", "intra_axis_zh", "intra_group", "intra_group_zh", "intra_role"]) {
      if (typeof node[field] !== "string" || !node[field].trim()) {
        errors.push(`Node '${node.id}' must declare non-empty ${field}: ${node._file}`);
      } else if (/\?{3,}/.test(node[field])) {
        errors.push(`Node '${node.id}' has likely broken encoding in ${field}: ${node._file}`);
      }
    }

    for (const field of ["intra_axis", "intra_group"]) {
      if (typeof node[field] === "string" && !SLUG_PATTERN.test(node[field])) {
        errors.push(`Node '${node.id}' ${field} must be a lowercase slug: ${node._file}`);
      }
    }

    if (node.intra_level === 0 && node.parent_node) {
      errors.push(`Root-level node '${node.id}' must not declare parent_node: ${node._file}`);
    }

    if (Number.isInteger(node.intra_level) && node.intra_level > 0) {
      if (!node.parent_node) {
        errors.push(`Non-root node '${node.id}' must declare parent_node: ${node._file}`);
      } else {
        const parent = nodeIndex.get(node.parent_node);
        if (!parent) {
          errors.push(`Node '${node.id}' parent_node '${node.parent_node}' is unknown: ${node._file}`);
        } else {
          if (parent.subgraph !== node.subgraph) {
            errors.push(
              `Node '${node.id}' parent_node '${node.parent_node}' is outside subgraph '${node.subgraph}': ${node._file}`,
            );
          }
          if (
            Number.isInteger(parent.intra_level) &&
            Number.isInteger(node.intra_level) &&
            parent.intra_level >= node.intra_level
          ) {
            errors.push(
              `Node '${node.id}' parent_node '${node.parent_node}' must have lower intra_level than child: ${node._file}`,
            );
          }
        }
      }
    }

    const subgraphNodes = nodesBySubgraph.get(node.subgraph) ?? [];
    subgraphNodes.push(node);
    nodesBySubgraph.set(node.subgraph, subgraphNodes);
  }

  for (const [subgraph, subgraphNodes] of nodesBySubgraph) {
    const roots = subgraphNodes.filter((node) => node.intra_level === 0);
    if (roots.length !== 1) {
      errors.push(
        `Subgraph '${subgraph}' must declare exactly one intra_level 0 anchor; found ${roots.length}`,
      );
    }

    const levels = [...new Set(subgraphNodes.map((node) => node.intra_level))]
      .filter(Number.isInteger)
      .sort((a, b) => a - b);
    if (levels.length < 2) {
      errors.push(`Subgraph '${subgraph}' must contain at least two intra-subgraph levels`);
    }
    for (let i = 0; i < levels.length; i += 1) {
      if (levels[i] !== i) {
        errors.push(
          `Subgraph '${subgraph}' has non-contiguous intra_level sequence: ${levels.join(", ")}`,
        );
        break;
      }
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
