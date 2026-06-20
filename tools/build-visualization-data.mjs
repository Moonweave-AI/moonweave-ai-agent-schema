#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  loadOntologyArtifacts,
  normalizeNodeIds,
} from "./lib/ontology-loader.mjs";
import {
  KEY_PATHS,
  formatEdge,
  formatNode,
} from "./lib/graph-utils.mjs";

const graphPath = join(ROOT, "visualization", "data", "ontology.graph.json");
const htmlPath = join(ROOT, "visualization", "index.html");

function bareNodeId(id) {
  return String(id || "").replace(/^node\./, "");
}

function subgraphIndex(subgraph) {
  const match = String(subgraph || "").match(/^(\d{2})-/);
  if (!match) throw new Error(`Cannot infer subgraph index from '${subgraph}'`);
  return Number(match[1]);
}

function extractEmbeddedGraph(html) {
  const match = html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Missing embedded graph data script.");
  return JSON.parse(match[1]);
}

function expandedEdges(edges, nodeIndex) {
  const out = [];
  for (const edge of edges) {
    const sg = subgraphIndex(edge.subgraph);
    for (const source of normalizeNodeIds(edge.source_domain)) {
      for (const target of normalizeNodeIds(edge.target_range)) {
        const sourceIndex = nodeIndex.get(source);
        const targetIndex = nodeIndex.get(target);
        if (sourceIndex === undefined || targetIndex === undefined) {
          throw new Error(`Edge ${edge.id} references missing endpoint ${source} -> ${target}`);
        }
        out.push([edge.predicate, sourceIndex, targetIndex, sg]);
      }
    }
  }
  return out;
}

function compactNodes(nodes) {
  return nodes.map((node) => [
    bareNodeId(node.id),
    node.label,
    node.label_zh,
    subgraphIndex(node.subgraph),
    node.description,
    node.intra_level,
    node.intra_group,
    node.intra_group_zh,
    node.intra_role,
    node.parent_node ? bareNodeId(node.parent_node) : null,
    node.intra_axis,
    node.intra_axis_zh,
    node.description_zh,
  ]);
}

function compactPaths(nodeIndex) {
  return KEY_PATHS.map((path) => ({
    id: path.id,
    label: path.label,
    nodes: path.nodes.map((id) => {
      const idx = nodeIndex.get(id);
      if (idx === undefined) throw new Error(`Path ${path.id} references missing node ${id}`);
      return idx;
    }),
  }));
}

function replaceEmbeddedGraph(html, raw) {
  const json = JSON.stringify(raw);
  return html.replace(
    /<script type="application\/json" id="data">[\s\S]*?<\/script>/,
    `<script type="application/json" id="data">${json}</script>`,
  );
}

function main() {
  const { nodes, edges } = loadOntologyArtifacts();
  const nodeIndex = new Map(nodes.map((node, idx) => [node.id, idx]));
  const previousGraph = JSON.parse(readFileSync(graphPath, "utf8"));
  const html = readFileSync(htmlPath, "utf8");
  const previousRaw = extractEmbeddedGraph(html);

  const graph = {
    ...previousGraph,
    nodes: nodes.map(formatNode),
    edges: edges.map(formatEdge),
  };

  const raw = {
    ...previousRaw,
    nodes: compactNodes(nodes),
    edges: expandedEdges(edges, nodeIndex),
    paths: compactPaths(nodeIndex),
  };

  writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
  writeFileSync(htmlPath, replaceEmbeddedGraph(html, raw), "utf8");

  console.log("Visualization data rebuilt.");
  console.log(`Nodes: ${nodes.length}`);
  console.log(`Edge classes: ${edges.length}`);
  console.log(`Expanded edges: ${raw.edges.length}`);
}

main();
