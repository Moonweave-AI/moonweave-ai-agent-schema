#!/usr/bin/env node
import {
  loadOntologyArtifacts,
  edgesByPredicate,
  normalizeNodeIds,
} from "./lib/ontology-loader.mjs";

function edgeMatchesRequired(edge, predicate, endpointId, direction) {
  if (edge.predicate !== predicate) return false;
  if (direction === "outgoing") {
    const sources = normalizeNodeIds(edge.source_domain);
    const targets = normalizeNodeIds(edge.target_range);
    return sources.includes(endpointId) && targets.length > 0;
  }
  const sources = normalizeNodeIds(edge.source_domain);
  const targets = normalizeNodeIds(edge.target_range);
  return targets.includes(endpointId) && sources.length > 0;
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function satisfiesRequired(node, required, edges, direction) {
  const endpointKey = direction === "outgoing" ? "target" : "source";
  const anyOfKey = direction === "outgoing" ? "target_any_of" : "source_any_of";

  const candidates = edges.filter((edge) =>
    edgeMatchesRequired(edge, required.predicate, node.id, direction),
  );

  if (required[endpointKey]) {
    return candidates.some((edge) => {
      const ids =
        direction === "outgoing"
          ? normalizeNodeIds(edge.target_range)
          : normalizeNodeIds(edge.source_domain);
      return ids.includes(required[endpointKey]);
    });
  }

  if (asArray(required[anyOfKey]).length) {
    return candidates.some((edge) => {
      const ids =
        direction === "outgoing"
          ? normalizeNodeIds(edge.target_range)
          : normalizeNodeIds(edge.source_domain);
      return asArray(required[anyOfKey]).some((id) => ids.includes(id));
    });
  }

  return candidates.length > 0;
}

function main() {
  console.log("Checking required_edges declarations...");

  const { nodes, edges } = loadOntologyArtifacts();
  const predicateMap = edgesByPredicate(edges);
  const failures = [];

  const nodesWithRequired = nodes.filter((node) => node.required_edges);

  for (const node of nodesWithRequired) {
    for (const required of node.required_edges.outgoing ?? []) {
      if (!predicateMap.has(required.predicate)) {
        failures.push(
          `${node.id}: outgoing required predicate '${required.predicate}' has no EdgeClass`,
        );
        continue;
      }
      if (!satisfiesRequired(node, required, edges, "outgoing")) {
        failures.push(
          `${node.id}: missing outgoing '${required.predicate}' edge to ${required.target ?? required.target_any_of?.join("|") ?? "?"}`,
        );
      }
    }

    for (const required of node.required_edges.incoming ?? []) {
      if (!predicateMap.has(required.predicate)) {
        failures.push(
          `${node.id}: incoming required predicate '${required.predicate}' has no EdgeClass`,
        );
        continue;
      }
      if (!satisfiesRequired(node, required, edges, "incoming")) {
        failures.push(
          `${node.id}: missing incoming '${required.predicate}' edge from ${required.source ?? required.source_any_of?.join("|") ?? "?"}`,
        );
      }
    }
  }

  console.log(`Nodes with required_edges: ${nodesWithRequired.length}`);

  if (failures.length) {
    console.error(`\nRequired edge check failed (${failures.length} issue(s)):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log("\nAll required_edges satisfied.");
  process.exit(0);
}

main();
