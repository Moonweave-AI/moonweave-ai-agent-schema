#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/ontology-loader.mjs";

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function main() {
  const html = readFileSync(join(ROOT, "visualization", "index.html"), "utf8");
  const graph = JSON.parse(
    readFileSync(join(ROOT, "visualization", "data", "ontology.graph.json"), "utf8"),
  );

  const nodes = new Map(
    graph.nodes.map((node) => [
      node.id,
      { ...node, key: node.id.replace(/^node\./, "") },
    ]),
  );
  const byKey = new Map([...nodes.values()].map((node) => [node.key, node]));
  const expandedEdges = [];

  for (const edge of graph.edges) {
    for (const source of asArray(edge.source_domain)) {
      for (const target of asArray(edge.target_range)) {
        if (nodes.has(source) && nodes.has(target)) {
          expandedEdges.push({
            predicate: edge.predicate,
            source,
            target,
            sourceNode: nodes.get(source),
            targetNode: nodes.get(target),
          });
        }
      }
    }
  }

  const runtimeKeys = new Set([
    "tool_definition",
    "tool_call",
    "tool_invocation",
    "tool_result",
    "side_effect",
    "policy_contract",
    "permission_policy",
    "approval_flow",
    "human_review",
    "audit_log",
    "allow_decision",
    "deny_decision",
    "rollback",
    "warning",
    "execution_harness",
    "session",
    "run",
    "turn",
    "executor",
    "sandbox",
    "container",
    "process",
    "command",
    "stdout_stream",
    "stderr_stream",
    "trace",
    "transcript",
    "event",
    "checkpoint",
    "state_store",
    "continuation",
    "retry_policy",
    "timeout_policy",
    "cancellation",
    "recovery_policy",
    "resource_budget",
  ]);
  const runtimeIds = new Set(
    [...runtimeKeys].map((key) => byKey.get(key)?.id).filter(Boolean),
  );
  const runtimeEdges = expandedEdges.filter(
    (edge) => runtimeIds.has(edge.source) && runtimeIds.has(edge.target),
  );
  const runtimePredicates = new Set(runtimeEdges.map((edge) => edge.predicate));

  const requiredHtmlFeatures = {
    embeddedGraph: html.includes('id="data"'),
    localD3: html.includes('src="vendor/d3.min.js"'),
    bilingualSwitch: html.includes('id="lang-select"') &&
      html.includes("function refreshLanguage") &&
      html.includes("function setNodeText"),
    unifiedIntraBlockFramework: html.includes("function drawUnifiedInternalFramework") &&
      html.includes("framework-bg") &&
      html.includes("framework-plane-bg") &&
      html.includes("relation-class-node") &&
      html.includes("framework-trunk") &&
      html.includes("framework-branch") &&
      html.includes("CLASS-BUNDLED INTERNAL FRAMEWORK") &&
      html.includes("node-relation-tags") &&
      html.includes("relationMembership"),
    intraSubgraphHierarchyFramework: html.includes("intraLevel") &&
      html.includes("intraGroup") &&
      html.includes("parentKey") &&
      html.includes("function hierarchyLayoutForBlock") &&
      html.includes("function drawHierarchyScaffold") &&
      html.includes("hierarchy-level-label") &&
      html.includes("hierarchy-group-label") &&
      html.includes("hierarchy-parent-link"),
    intraSubgraphHierarchyParser: html.includes("intraLevel: Number.isInteger(n[5])") &&
      html.includes('intraGroup: n[6] || "ungrouped"') &&
      html.includes("intraGroupZh: n[7]") &&
      html.includes("intraRole: n[8]") &&
      html.includes("parentKey: n[9] || null"),
    hierarchyDetailsPanel: html.includes("function hierarchyDetailHtml") &&
      html.includes("intraRole") &&
      html.includes("parentKey") &&
      html.includes("rootNode"),
    noStackedBottomLocalFlow: !html.includes("local-flow") &&
      !html.includes("drawLocalFlowEdges") &&
      !html.includes("localEdgePath"),
    noFragmentedRelationCards: !html.includes("relation-card") &&
      !html.includes("drawRelationMicrographs") &&
      !html.includes("layoutRelationCards") &&
      !html.includes("relation-node-chip"),
    noPerPairLaneLabels: !html.includes("framework-edge-label") &&
      !html.includes("framework-lane-guide") &&
      !html.includes("localFlowLabel"),
    classBundledFrameworkLanguageRefresh: html.includes("relation-class-text") &&
      html.includes("relationClassCountText") &&
      html.includes("displaySubgraphLabel"),
    nodeAndRelationFocusInteraction: html.includes("selectedRelation") &&
      html.includes("function selectRelation") &&
      html.includes("function showRelationDetail") &&
      html.includes("function currentFocus") &&
      html.includes("focus-related") &&
      html.includes("relation-focus") &&
      html.includes("relation-btn"),
    preciseEndpointEdgeFocus: html.includes("function drawFocusOverlay") &&
      html.includes("focus.edges") &&
      html.includes('focus.scope = "node"') &&
      html.includes('focus.scope === "node"') &&
      html.includes("function nodeOutsidePort") &&
      !html.includes("function nodePortToward") &&
      html.includes("function drawFocusArrow") &&
      html.includes("if (!geom.relPoint && !labelSeen.has(labelKey))") &&
      html.includes("relationNodes") &&
      html.includes("relationClassPositions") &&
      html.includes("focus-edge") &&
      html.includes("focus-endpoint") &&
      html.includes("branch-focus") &&
      html.includes("precise-node-focus"),
    fullBilingualPredicateSystem: html.includes("const PREDICATE_ZH") &&
      html.includes("function predicateLabel") &&
      html.includes("function predicateDescription") &&
      html.includes("const UI_TEXT") &&
      html.includes("function nodeChineseDescription"),
    globalBusRouting: html.includes("function busRoute") &&
      html.includes("rowCorridorY") &&
      html.includes("pointsToPath"),
    noSemanticZoomVisibilityChanges: html.includes("function applySemanticZoom") &&
      !html.includes("const overview =") &&
      !html.includes("const hubVis =") &&
      !html.includes("const allVis =") &&
      !html.includes("document.body.dataset.zoom") &&
      !html.includes("gLinks.style(\"display\", k >=") &&
      !html.includes("block-internal-edges\").style(\"display\", k >"),
    opaqueBlockMask: html.includes("--block-bg:#0b1220") &&
      html.includes("--block-bg:#ffffff"),
    capsuleNodes: html.includes("NODE_W") &&
      html.includes("NODE_H") &&
      html.includes("node-card"),
    dynamicRowSpacing: html.includes("rowHeights") &&
      html.includes("ROW_GAP"),
  };

  const requiredPredicates = [
    "STARTS",
    "ADVANCES_TO",
    "EXECUTES_IN",
    "CHECKPOINTS",
    "TRACES",
    "GUARDS",
    "AUDITS",
  ];

  const failures = [];
  const predicateMapMatch = html.match(/const PREDICATE_ZH = \{([\s\S]*?)\n  \};/);
  const mappedPredicates = new Set(
    predicateMapMatch
      ? [...predicateMapMatch[1].matchAll(/\n\s+([A-Z0-9_]+):/g)].map((match) => match[1])
      : [],
  );
  const graphPredicates = new Set(graph.edges.map((edge) => edge.predicate));
  const nodesBySubgraph = new Map();
  for (const [name, ok] of Object.entries(requiredHtmlFeatures)) {
    if (!ok) failures.push(`Missing visualization feature: ${name}`);
  }
  for (const node of graph.nodes) {
    if (!Number.isInteger(node.intra_level)) {
      failures.push(`Graph JSON node missing intra_level: ${node.id}`);
    }
    for (const field of ["intra_group", "intra_group_zh", "intra_role"]) {
      if (!node[field]) failures.push(`Graph JSON node missing ${field}: ${node.id}`);
    }
    const list = nodesBySubgraph.get(node.subgraph) ?? [];
    list.push(node);
    nodesBySubgraph.set(node.subgraph, list);
  }
  for (const [subgraph, list] of nodesBySubgraph) {
    const roots = list.filter((node) => node.intra_level === 0);
    const levels = new Set(list.map((node) => node.intra_level));
    if (roots.length !== 1) {
      failures.push(`Visualization data subgraph '${subgraph}' must have one level-0 root; found ${roots.length}`);
    }
    if (levels.size < 2) {
      failures.push(`Visualization data subgraph '${subgraph}' has no internal hierarchy`);
    }
  }
  for (const predicate of graphPredicates) {
    if (!mappedPredicates.has(predicate)) {
      failures.push(`Missing Chinese predicate label: ${predicate}`);
    }
  }
  for (const predicate of requiredPredicates) {
    if (!runtimePredicates.has(predicate)) {
      failures.push(`Runtime framework missing visible predicate ${predicate}`);
    }
  }
  if (runtimeEdges.length < 20) {
    failures.push(`Runtime framework has too few visible edges: ${runtimeEdges.length}`);
  }

  console.log("Visualization framework check");
  console.log(`Expanded edges: ${expandedEdges.length}`);
  console.log(`Runtime framework nodes: ${runtimeIds.size}`);
  console.log(`Runtime framework visible edges: ${runtimeEdges.length}`);

  if (failures.length) {
    console.error("\nFailures:");
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log("Visualization framework check passed.");
}

main();
