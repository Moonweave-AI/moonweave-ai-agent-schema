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
import { parseYaml } from "./lib/yaml.mjs";

const graphPath = join(ROOT, "visualization", "data", "ontology.graph.json");
const htmlPath = join(ROOT, "visualization", "index.html");
const sourceCatalogPath = join(ROOT, "references", "source-catalog.yaml");
const evidenceMatrixPath = join(ROOT, "references", "evidence-matrix.yaml");

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

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function objectSupportIndex(claims) {
  const index = {};
  const buckets = [
    "supports_nodes",
    "supports_edges",
    "supports_constraints",
    "supports_views",
    "candidate_nodes",
  ];

  for (const claim of claims) {
    for (const bucket of buckets) {
      for (const objectId of asArray(claim[bucket])) {
        if (!index[objectId]) index[objectId] = [];
        index[objectId].push(claim.id);
      }
    }
  }
  return index;
}

function buildEvidenceWorkbench() {
  const catalog = parseYaml(readFileSync(sourceCatalogPath, "utf8"));
  const matrix = parseYaml(readFileSync(evidenceMatrixPath, "utf8"));
  const sources = asArray(catalog.sources).map((source) => ({
    id: source.id,
    title: source.title,
    type: source.source_type,
    tier: source.authority_tier,
    status: source.normative_status,
    venue: source.venue,
    year: source.year,
    themes: asArray(source.themes),
    url: source.url || "",
    summary: source.reading?.summary || "",
    impact: source.reading?.ontology_impact || "",
  }));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const claims = asArray(matrix.claims).map((claim) => {
    const source = sourceById.get(claim.source_id);
    return {
      id: claim.id,
      source_id: claim.source_id,
      source_title: source?.title || claim.source_id,
      source_tier: source?.tier || "",
      source_status: source?.status || "",
      status: claim.status,
      themes: asArray(claim.themes),
      claim: claim.claim,
      ontology_impact: claim.ontology_impact,
      supports_nodes: asArray(claim.supports_nodes),
      supports_edges: asArray(claim.supports_edges),
      supports_constraints: asArray(claim.supports_constraints),
      supports_views: asArray(claim.supports_views),
      candidate_nodes: asArray(claim.candidate_nodes),
    };
  });
  const requiredThemes = asArray(catalog.coverage_policy?.required_themes);
  const themeCoverage = requiredThemes.map((theme) => ({
    theme,
    sources: sources.filter((source) => source.themes.includes(theme)).length,
    claims: claims.filter((claim) => claim.themes.includes(theme)).length,
  }));

  return {
    schema_version: "2.0",
    generated_at: new Date().toISOString(),
    sources,
    claims,
    gaps: asArray(matrix.gaps),
    themeCoverage,
    objectSupport: objectSupportIndex(claims),
  };
}

function replaceEmbeddedEvidence(html, workbench) {
  const script = `<script type="application/json" id="evidence-data">${JSON.stringify(workbench)}</script>`;
  if (/<script type="application\/json" id="evidence-data">[\s\S]*?<\/script>/.test(html)) {
    return html.replace(
      /<script type="application\/json" id="evidence-data">[\s\S]*?<\/script>/,
      script,
    );
  }
  return html.replace(
    /(<script type="application\/json" id="data">[\s\S]*?<\/script>)/,
    `$1\n${script}`,
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
  const workbench = buildEvidenceWorkbench();

  writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
  writeFileSync(htmlPath, replaceEmbeddedEvidence(replaceEmbeddedGraph(html, raw), workbench), "utf8");

  console.log("Visualization data rebuilt.");
  console.log(`Nodes: ${nodes.length}`);
  console.log(`Edge classes: ${edges.length}`);
  console.log(`Expanded edges: ${raw.edges.length}`);
  console.log(`Evidence sources: ${workbench.sources.length}`);
  console.log(`Evidence claims: ${workbench.claims.length}`);
}

main();
