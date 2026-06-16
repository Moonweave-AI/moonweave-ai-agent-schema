#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  loadOntologyArtifacts,
  buildNodeIndex,
  subgraphLabel,
} from "./lib/ontology-loader.mjs";
import { parseYaml } from "./lib/yaml.mjs";
import {
  KEY_PATHS,
  computePathLinks,
  collectEvidence,
  formatNode,
  formatEdge,
} from "./lib/graph-utils.mjs";

let yamlParser = "inline";
let parseYamlText = parseYaml;

try {
  const yaml = await import("js-yaml");
  parseYamlText = (text) => yaml.load(text);
  yamlParser = "js-yaml";
} catch {
  // inline parser
}

function main() {
  console.log("Building ontology graph artifacts...");
  console.log(`YAML parser: ${yamlParser}`);

  const { nodes, edges, constraints } = loadOntologyArtifacts();
  const nodeIndex = buildNodeIndex(nodes);

  const subgraphStats = new Map();
  for (const node of nodes) {
    const stat = subgraphStats.get(node.subgraph) ?? { nodeCount: 0, edgeCount: 0 };
    stat.nodeCount += 1;
    subgraphStats.set(node.subgraph, stat);
  }
  for (const edge of edges) {
    const stat = subgraphStats.get(edge.subgraph) ?? { nodeCount: 0, edgeCount: 0 };
    stat.edgeCount += 1;
    subgraphStats.set(edge.subgraph, stat);
  }

  const subgraphs = [...subgraphStats.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, counts]) => ({
      id,
      label: subgraphLabel(id),
      nodeCount: counts.nodeCount,
      edgeCount: counts.edgeCount,
    }));

  const graph = {
    nodes: nodes.map(formatNode),
    edges: edges.map(formatEdge),
    subgraphs,
    meta: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      subgraphCount: subgraphs.length,
      generatedAt: new Date().toISOString(),
    },
  };

  const subgraphGroups = {};
  for (const { id } of subgraphs) {
    subgraphGroups[id] = {
      id,
      label: subgraphLabel(id),
      nodes: graph.nodes.filter((n) => n.subgraph === id),
      edges: graph.edges.filter((e) => e.subgraph === id),
    };
  }

  const paths = KEY_PATHS.map((pathDef) =>
    computePathLinks(pathDef, edges, nodeIndex),
  );

  const evidence = collectEvidence(
    nodes,
    edges,
    join(ROOT, "references", "graph-evidence.yaml"),
    (path) => parseYamlText(readFileSync(path, "utf8")),
  );

  const constraintsOut = constraints.map((c) => ({
    id: c.id,
    label: c.label,
    label_zh: c.label_zh,
    severity: c.severity,
    rule: c.rule,
    applies_to: c.applies_to,
    description: c.description,
    subgraph: c.subgraph,
    status: c.status,
  }));

  const outDir = join(ROOT, "visualization", "data");
  mkdirSync(outDir, { recursive: true });

  writeFileSync(join(outDir, "ontology.graph.json"), JSON.stringify(graph, null, 2));
  writeFileSync(
    join(outDir, "ontology.subgraphs.json"),
    JSON.stringify(subgraphGroups, null, 2),
  );
  writeFileSync(
    join(outDir, "ontology.paths.json"),
    JSON.stringify({ paths, generatedAt: new Date().toISOString() }, null, 2),
  );
  writeFileSync(
    join(outDir, "ontology.constraints.json"),
    JSON.stringify({ constraints: constraintsOut, count: constraintsOut.length }, null, 2),
  );
  writeFileSync(join(outDir, "ontology.evidence.json"), JSON.stringify(evidence, null, 2));

  console.log(`Wrote ontology.graph.json (${graph.nodes.length} nodes, ${graph.edges.length} edges)`);
  console.log(`Wrote ontology.subgraphs.json (${graph.subgraphs.length} subgraphs)`);
  console.log(`Wrote ontology.paths.json (${paths.length} paths)`);
  console.log(`Wrote ontology.constraints.json (${constraintsOut.length} constraints)`);
  console.log(`Wrote ontology.evidence.json (${evidence.totalRefs} evidence refs)`);
  console.log(`Key paths complete: ${paths.filter((p) => p.complete).length}/${paths.length}`);
}

main();
