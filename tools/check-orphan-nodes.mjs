#!/usr/bin/env node
import {
  loadOntologyArtifacts,
  normalizeNodeIds,
} from "./lib/ontology-loader.mjs";
import { getConnectedNodeIds } from "./lib/graph-utils.mjs";

function main() {
  console.log("Checking for orphan nodes...");

  const { nodes, edges } = loadOntologyArtifacts();
  const connected = getConnectedNodeIds(edges);

  const orphans = nodes.filter((node) => !connected.has(node.id));

  console.log(`Total nodes: ${nodes.length}`);
  console.log(`Connected nodes: ${connected.size}`);
  console.log(`Orphan nodes: ${orphans.length}`);

  if (orphans.length) {
    console.error("\nOrphan nodes (no edge source_domain or target_range reference):");
    for (const node of orphans.sort((a, b) => a.id.localeCompare(b.id))) {
      console.error(`  - ${node.id} (${node.label}, ${node.subgraph})`);
    }
    process.exit(1);
  }

  console.log("\nNo orphan nodes found.");
  process.exit(0);
}

main();
