#!/usr/bin/env node
import { join } from "node:path";
import { readFileSync } from "node:fs";
import {
  ROOT,
  loadOntologyArtifacts,
  buildNodeIndex,
} from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";
import { resolveDiagramOntologyNode } from "./lib/graph-utils.mjs";

function main() {
  console.log("Checking diagram-to-ontology coverage...");

  const diagramPath = join(ROOT, "references", "local-diagram-extract.yaml");
  const diagramDoc = parseYaml(readFileSync(diagramPath, "utf8"));
  const diagramNodes = diagramDoc.nodes ?? [];
  const mappings = diagramDoc.ontology_mappings ?? [];

  const { nodes } = loadOntologyArtifacts();
  const nodeIndex = buildNodeIndex(nodes);

  const covered = [];
  const missing = [];

  for (const diagramNode of diagramNodes) {
    const resolved = resolveDiagramOntologyNode(
      diagramNode.id,
      mappings,
      nodeIndex,
    );
    if (resolved) {
      covered.push({
        diagram: diagramNode.id,
        ontology: resolved.ontologyNode,
        via: resolved.via,
        plane: diagramNode.plane,
      });
    } else {
      missing.push({
        diagram: diagramNode.id,
        label: diagramNode.label,
        plane: diagramNode.plane,
      });
    }
  }

  console.log(`Diagram nodes: ${diagramNodes.length}`);
  console.log(`Covered: ${covered.length}`);
  console.log(`Missing ontology mapping: ${missing.length}`);

  if (missing.length) {
    console.error("\nDiagram nodes without corresponding ontology node:");
    for (const item of missing) {
      console.error(`  - ${item.diagram} (${item.label}, ${item.plane ?? "unknown"})`);
    }
    process.exit(1);
  }

  console.log("\nDiagram coverage check passed.");
  process.exit(0);
}

main();
