#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

const htmlPath = join(ROOT, "visualization", "index.html");
const graphPath = join(ROOT, "visualization", "data", "ontology.graph.json");

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function bareNodeId(value) {
  return String(value || "").replace(/^node\./, "");
}

function failIf(condition, message, failures) {
  if (condition) failures.push(message);
}

function extractEmbeddedGraph(html) {
  const match = html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Missing embedded graph data script.");
  return JSON.parse(match[1]);
}

function extractExecutableScripts(html) {
  return [...html.matchAll(/<script(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .filter((script) => script.trim().length > 0);
}

function extractMappedPredicates(html) {
  const match = html.match(/const PREDICATE_ZH = \{([\s\S]*?)\n  \};/);
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/\n\s+([A-Z0-9_]+):/g)].map((item) => item[1]));
}

function isDeclared(html, name) {
  return new RegExp(String.raw`\b(?:const|let|var|function)\s+${name}\b`).test(html);
}

function hasBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function hasUndefinedText(value) {
  return /\b(?:undefined|not defined|null)\b/i.test(String(value || ""));
}

function validateExecutableScripts(html, failures) {
  for (const [index, script] of extractExecutableScripts(html).entries()) {
    try {
      // Parse only. This catches syntax regressions without executing browser code.
      new Function(script);
    } catch (error) {
      failures.push(`Executable script ${index + 1} is not parseable: ${error.message}`);
    }
  }
}

function validateDetailDependencies(html, failures) {
  for (const name of ["nodeByKey", "nodeById", "nodesBySg", "sgByIndex"]) {
    const used = new RegExp(String.raw`\b${name}\b`).test(html);
    failIf(used && !isDeclared(html, name), `Visualization uses ${name} but does not declare it.`, failures);
  }

  const requiredSnippets = [
    "function hierarchyDetailHtml",
    "nodeByKey.get(node.parentKey)",
    "nodeById.get(node.parentKey)",
    "function showNodeDetail",
    "function showRelationDetail",
    "function renderDetailSafely",
  ];
  for (const snippet of requiredSnippets) {
    failIf(!html.includes(snippet), `Detail renderer missing required snippet: ${snippet}`, failures);
  }
}

function validateEmbeddedGraph(raw, mappedPredicates, failures) {
  failIf(!Array.isArray(raw.subgraphs) || raw.subgraphs.length < 1, "Embedded graph has no subgraphs.", failures);
  failIf(!Array.isArray(raw.nodes) || raw.nodes.length < 1, "Embedded graph has no nodes.", failures);
  failIf(!Array.isArray(raw.edges) || raw.edges.length < 1, "Embedded graph has no edges.", failures);

  const subgraphIds = new Set((raw.subgraphs || []).map((sg) => sg.i));
  const nodeKeys = new Set((raw.nodes || []).map((node) => node[0]).filter(Boolean));
  const seenNodeKeys = new Set();

  for (const [index, node] of (raw.nodes || []).entries()) {
    const [
      key,
      label,
      labelZh,
      sg,
      desc,
      intraLevel,
      intraGroup,
      intraGroupZh,
      intraRole,
      parentKey,
      intraAxis,
      intraAxisZh,
      descZh,
    ] = node;

    failIf(hasBlank(key), `Embedded node ${index} has no key.`, failures);
    failIf(seenNodeKeys.has(key), `Embedded node key is duplicated: ${key}`, failures);
    seenNodeKeys.add(key);
    failIf(hasBlank(label), `Embedded node ${key} has no English label.`, failures);
    failIf(hasBlank(labelZh), `Embedded node ${key} has no Chinese label.`, failures);
    failIf(hasBlank(desc), `Embedded node ${key} has no description.`, failures);
    failIf(!subgraphIds.has(sg), `Embedded node ${key} references unknown subgraph ${sg}.`, failures);
    failIf(!Number.isInteger(intraLevel), `Embedded node ${key} has invalid intraLevel.`, failures);
    failIf(hasBlank(intraGroup), `Embedded node ${key} has no intraGroup.`, failures);
    failIf(hasBlank(intraGroupZh), `Embedded node ${key} has no intraGroupZh.`, failures);
    failIf(hasBlank(intraRole), `Embedded node ${key} has no intraRole.`, failures);
    failIf(hasBlank(intraAxis), `Embedded node ${key} has no intraAxis.`, failures);
    failIf(hasBlank(intraAxisZh), `Embedded node ${key} has no intraAxisZh.`, failures);
    failIf(hasBlank(descZh), `Embedded node ${key} has no Chinese description.`, failures);

    for (const [fieldName, value] of [
      ["label", label],
      ["labelZh", labelZh],
      ["description", desc],
      ["descriptionZh", descZh],
      ["intraGroup", intraGroup],
      ["intraGroupZh", intraGroupZh],
      ["intraRole", intraRole],
      ["intraAxis", intraAxis],
      ["intraAxisZh", intraAxisZh],
    ]) {
      failIf(hasUndefinedText(value), `Embedded node ${key} has unresolved ${fieldName}: ${value}`, failures);
    }

    if (parentKey) failIf(!nodeKeys.has(parentKey), `Embedded node ${key} has unknown parentKey ${parentKey}.`, failures);
  }

  for (const [index, edge] of (raw.edges || []).entries()) {
    const [predicate, source, target, sg] = edge;
    failIf(hasBlank(predicate), `Embedded edge ${index} has no predicate.`, failures);
    failIf(!Number.isInteger(source) || !raw.nodes[source], `Embedded edge ${index} has invalid source ${source}.`, failures);
    failIf(!Number.isInteger(target) || !raw.nodes[target], `Embedded edge ${index} has invalid target ${target}.`, failures);
    failIf(!subgraphIds.has(sg), `Embedded edge ${index} references unknown subgraph ${sg}.`, failures);
    failIf(!mappedPredicates.has(predicate), `Embedded edge ${index} predicate has no Chinese label: ${predicate}`, failures);
    failIf(hasUndefinedText(predicate), `Embedded edge ${index} has unresolved predicate: ${predicate}`, failures);
  }

  for (const [pathName, path] of Object.entries(raw.paths || {})) {
    const pathNodes = Array.isArray(path) ? path : path?.nodes;
    failIf(!Array.isArray(pathNodes) || pathNodes.length < 2, `Embedded path ${pathName} is not a useful path.`, failures);
    for (const nodeIndex of pathNodes || []) {
      failIf(!Number.isInteger(nodeIndex) || !raw.nodes[nodeIndex], `Embedded path ${pathName} references invalid node ${nodeIndex}.`, failures);
    }
  }
}

function validateSourceGraph(graph, raw, failures) {
  const graphNodeIds = new Set((graph.nodes || []).map((node) => node.id));
  const embeddedNodeKeys = new Set((raw.nodes || []).map((node) => node[0]));
  const embeddedPredicates = new Set((raw.edges || []).map((edge) => edge[0]));
  let expandedEdgeCount = 0;

  for (const node of graph.nodes || []) {
    const key = bareNodeId(node.id);
    failIf(hasBlank(node.id), "Graph JSON contains a node with no id.", failures);
    failIf(hasBlank(node.label), `Graph JSON node ${node.id} has no English label.`, failures);
    failIf(hasBlank(node.label_zh), `Graph JSON node ${node.id} has no Chinese label.`, failures);
    failIf(hasBlank(node.description), `Graph JSON node ${node.id} has no description.`, failures);
    failIf(hasBlank(node.description_zh), `Graph JSON node ${node.id} has no Chinese description.`, failures);
    failIf(!embeddedNodeKeys.has(key), `Graph JSON node ${node.id} is missing from embedded data.`, failures);

    for (const field of ["intra_level", "intra_axis", "intra_axis_zh", "intra_group", "intra_group_zh", "intra_role"]) {
      failIf(hasBlank(node[field]), `Graph JSON node ${node.id} has no ${field}.`, failures);
    }

    failIf(hasUndefinedText(node.label), `Graph JSON node ${node.id} has unresolved English label.`, failures);
    failIf(hasUndefinedText(node.label_zh), `Graph JSON node ${node.id} has unresolved Chinese label.`, failures);
    failIf(hasUndefinedText(node.description), `Graph JSON node ${node.id} has unresolved description.`, failures);
    failIf(hasUndefinedText(node.description_zh), `Graph JSON node ${node.id} has unresolved Chinese description.`, failures);

    if (node.parent_node) {
      failIf(!graphNodeIds.has(node.parent_node), `Graph JSON node ${node.id} has unknown parent_node ${node.parent_node}.`, failures);
      failIf(!embeddedNodeKeys.has(bareNodeId(node.parent_node)), `Graph JSON node ${node.id} parent_node is missing from embedded data: ${node.parent_node}`, failures);
    }
  }

  for (const edge of graph.edges || []) {
    failIf(hasBlank(edge.id), "Graph JSON contains an edge with no id.", failures);
    failIf(hasBlank(edge.predicate), `Graph JSON edge ${edge.id} has no predicate.`, failures);
    failIf(hasBlank(edge.description), `Graph JSON edge ${edge.id} has no description.`, failures);
    failIf(hasUndefinedText(edge.predicate), `Graph JSON edge ${edge.id} has unresolved predicate.`, failures);
    failIf(hasUndefinedText(edge.description), `Graph JSON edge ${edge.id} has unresolved description.`, failures);
    failIf(!embeddedPredicates.has(edge.predicate), `Graph JSON edge predicate is missing from embedded data: ${edge.predicate}`, failures);

    const sources = asArray(edge.source_domain);
    const targets = asArray(edge.target_range);
    failIf(sources.length === 0, `Graph JSON edge ${edge.id} has no source_domain.`, failures);
    failIf(targets.length === 0, `Graph JSON edge ${edge.id} has no target_range.`, failures);

    for (const source of sources) {
      failIf(!graphNodeIds.has(source), `Graph JSON edge ${edge.id} has unknown source ${source}.`, failures);
      failIf(!embeddedNodeKeys.has(bareNodeId(source)), `Graph JSON edge ${edge.id} source is missing from embedded data: ${source}`, failures);
    }
    for (const target of targets) {
      failIf(!graphNodeIds.has(target), `Graph JSON edge ${edge.id} has unknown target ${target}.`, failures);
      failIf(!embeddedNodeKeys.has(bareNodeId(target)), `Graph JSON edge ${edge.id} target is missing from embedded data: ${target}`, failures);
    }

    expandedEdgeCount += sources.length * targets.length;
  }

  failIf(graph.nodes.length !== raw.nodes.length, `Graph JSON node count ${graph.nodes.length} does not match embedded node count ${raw.nodes.length}.`, failures);
  failIf(expandedEdgeCount !== raw.edges.length, `Expanded graph edge count ${expandedEdgeCount} does not match embedded edge count ${raw.edges.length}.`, failures);
}

function main() {
  const failures = [];
  const html = readFileSync(htmlPath, "utf8");
  const graph = JSON.parse(readFileSync(graphPath, "utf8"));
  const raw = extractEmbeddedGraph(html);
  const mappedPredicates = extractMappedPredicates(html);

  validateExecutableScripts(html, failures);
  validateDetailDependencies(html, failures);
  validateEmbeddedGraph(raw, mappedPredicates, failures);
  validateSourceGraph(graph, raw, failures);

  console.log("Visualization detail/data contract check");
  console.log(`Embedded nodes: ${raw.nodes.length}`);
  console.log(`Embedded edges: ${raw.edges.length}`);
  console.log(`Source graph nodes: ${graph.nodes.length}`);
  console.log(`Source graph edge classes: ${graph.edges.length}`);
  console.log(`Predicate Chinese labels: ${mappedPredicates.size}`);

  if (failures.length) {
    console.error("\nFailures:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log("Visualization detail/data contract check passed.");
}

main();
