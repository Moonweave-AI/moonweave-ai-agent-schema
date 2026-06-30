import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseYaml } from "./yaml.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..");
export const ONTOLOGY_DIR = join(ROOT, "ontology");

export function readYaml(path) {
  return parseYaml(readFileSync(path, "utf8"));
}

export function walkYamlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...walkYamlFiles(fullPath));
    } else if (entry.endsWith(".yaml") || entry.endsWith(".yml")) {
      files.push(fullPath);
    }
  }
  return files;
}

export function getSubgraphFromPath(filePath) {
  const rel = relative(ONTOLOGY_DIR, filePath).replace(/\\/g, "/");
  const match = rel.match(/^(\d{2}-[^/]+)/);
  return match ? match[1] : "unknown";
}

export function getArtifactCategory(filePath) {
  const rel = relative(ONTOLOGY_DIR, filePath).replace(/\\/g, "/");
  const parts = rel.split("/");
  return parts.length >= 2 ? parts[1] : "unknown";
}

export function subgraphLabel(subgraphId) {
  const stripped = subgraphId.replace(/^\d{2}-/, "").replace(/-graph$/, "");
  return stripped
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function loadOntologyArtifacts() {
  const files = walkYamlFiles(ONTOLOGY_DIR);
  const nodes = [];
  const edges = [];
  const constraints = [];
  const contracts = [];
  const states = [];
  const views = [];
  const other = [];

  for (const filePath of files) {
    const category = getArtifactCategory(filePath);
    const subgraph = getSubgraphFromPath(filePath);
    const doc = readYaml(filePath);

    const record = {
      ...doc,
      subgraph,
      _file: relative(ROOT, filePath).replace(/\\/g, "/"),
    };

    switch (category) {
      case "nodes":
        nodes.push(record);
        break;
      case "edges":
        edges.push(record);
        break;
      case "constraints":
        constraints.push(record);
        break;
      case "contracts":
        contracts.push(record);
        break;
      case "states":
        states.push(record);
        break;
      case "views":
        views.push(record);
        break;
      default:
        other.push(record);
        break;
    }
  }

  return { nodes, edges, constraints, contracts, states, views, other };
}

export function normalizeNodeIds(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function buildNodeIndex(nodes) {
  return new Map(nodes.map((node) => [node.id, node]));
}

export function buildEdgeIndex(edges) {
  return new Map(edges.map((edge) => [edge.id, edge]));
}

export function edgesByPredicate(edges) {
  const map = new Map();
  for (const edge of edges) {
    const list = map.get(edge.predicate) ?? [];
    list.push(edge);
    map.set(edge.predicate, list);
  }
  return map;
}

export function connectsNodes(edge, sourceId, targetId) {
  const sources = normalizeNodeIds(edge.source_domain);
  const targets = normalizeNodeIds(edge.target_range);
  return sources.includes(sourceId) && targets.includes(targetId);
}

export function findConnectingEdges(edges, sourceId, targetId) {
  return edges.filter((edge) => connectsNodes(edge, sourceId, targetId));
}

export function loadGraphJson() {
  const path = join(ROOT, "visualization", "data", "ontology.graph.json");
  const text = readFileSync(path, "utf8");
  return JSON.parse(text);
}
