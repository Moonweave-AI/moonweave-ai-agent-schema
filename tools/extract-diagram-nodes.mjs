#!/usr/bin/env node
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { ROOT } from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";

function main() {
  console.log("Extracted diagram nodes summary\n");

  const diagramPath = join(ROOT, "references", "local-diagram-extract.yaml");
  const diagramDoc = parseYaml(readFileSync(diagramPath, "utf8"));
  const diagramNodes = diagramDoc.nodes ?? [];
  const planes = diagramDoc.planes ?? [];

  const byPlane = new Map();
  for (const plane of planes) {
    byPlane.set(plane.id, { ...plane, nodes: [] });
  }
  byPlane.set("unknown", { id: "unknown", label: "Unknown", nodes: [] });

  for (const node of diagramNodes) {
    const planeIds = Array.isArray(node.plane)
      ? node.plane
      : [node.plane ?? "unknown"];
    for (const planeId of planeIds) {
      if (!byPlane.has(planeId)) {
        byPlane.set(planeId, { id: planeId, label: planeId, nodes: [] });
      }
      byPlane.get(planeId).nodes.push(node);
    }
  }

  console.log(`Source: ${diagramDoc.source?.name ?? "local-diagram-extract.yaml"}`);
  console.log(`Total diagram nodes: ${diagramNodes.length}\n`);

  for (const [planeId, group] of [...byPlane.entries()].sort(([a], [b]) =>
    String(a).localeCompare(String(b)),
  )) {
    if (group.nodes.length === 0) continue;
    console.log(`${group.label ?? planeId} (${planeId}) — ${group.nodes.length} nodes`);
    if (group.description) {
      const desc =
        typeof group.description === "string"
          ? group.description.replace(/\s+/g, " ").trim()
          : "";
      if (desc) console.log(`  ${desc.slice(0, 120)}${desc.length > 120 ? "..." : ""}`);
    }
    for (const node of group.nodes.sort((a, b) => a.id.localeCompare(b.id))) {
      console.log(`  - ${node.id}: ${node.label}`);
    }
    console.log("");
  }

  process.exit(0);
}

main();
