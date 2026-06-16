#!/usr/bin/env node
import {
  ROOT,
  loadOntologyArtifacts,
  buildNodeIndex,
  buildEdgeIndex,
  edgesByPredicate,
  normalizeNodeIds,
  findConnectingEdges,
  readYaml,
} from "./lib/ontology-loader.mjs";
import { join } from "node:path";

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const NORMATIVE_SUBGRAPHS = new Set([
  "01-agent-core-graph",
  "02-context-info-graph",
  "03-memory-graph",
  "04-reasoning-planning-graph",
  "05-tool-action-graph",
  "06-orchestration-graph",
  "07-runtime-harness-graph",
  "08-safety-policy-graph",
]);

function collectExternalEvidenceNodeIds() {
  const supported = new Set();

  try {
    const evidenceDoc = readYaml(join(ROOT, "references", "graph-evidence.yaml"));

    for (const nodeId of Object.keys(evidenceDoc.node_evidence_index ?? {})) {
      supported.add(nodeId);
    }

    for (const entry of evidenceDoc.evidence_entries ?? []) {
      for (const nodeId of asArray(entry.supports_nodes)) {
        supported.add(nodeId);
      }
    }
  } catch {
    // Direct per-node evidence remains the fallback when the shared index is absent.
  }

  return supported;
}

function nodeHasIncomingPredicate(node, predicate, edges) {
  const incoming = node.required_edges?.incoming ?? [];
  if (incoming.some((e) => e.predicate === predicate)) return true;
  return edges.some(
    (edge) =>
      edge.predicate === predicate &&
      normalizeNodeIds(edge.target_range).includes(node.id),
  );
}

function nodeHasOutgoingPredicate(node, predicate, edges) {
  const outgoing = node.required_edges?.outgoing ?? [];
  if (outgoing.some((e) => e.predicate === predicate)) return true;
  return edges.some(
    (edge) =>
      edge.predicate === predicate &&
      normalizeNodeIds(edge.source_domain).includes(node.id),
  );
}

function checkConstraint(constraint, ctx) {
  const { nodes, edges, nodeIndex, edgeIndex, predicateMap } = ctx;
  const id = constraint.id ?? "";
  const appliesNodes = asArray(constraint.applies_to?.nodes);
  const appliesEdges = asArray(constraint.applies_to?.edges);
  const failures = [];

  for (const nodeId of appliesNodes) {
    if (typeof nodeId !== "string" || !nodeId.startsWith("node.")) continue;
    if (!nodeIndex.has(nodeId)) {
      failures.push(`Referenced node '${nodeId}' does not exist`);
    }
  }

  for (const edgeId of appliesEdges) {
    if (typeof edgeId !== "string" || !edgeId.startsWith("edge.")) continue;
    if (!edgeIndex.has(edgeId)) {
      failures.push(`Referenced edge '${edgeId}' does not exist`);
    }
  }

  if (id === "constraint.tool_call_must_be_guarded") {
    const toolCall = nodeIndex.get("node.tool_call");
    if (!toolCall) {
      failures.push("node.tool_call is not defined");
    } else {
      const guarded =
        nodeHasIncomingPredicate(toolCall, "GUARDS", edges) ||
        nodeHasOutgoingPredicate(toolCall, "GUARDED_BY", edges) ||
        findConnectingEdges(edges, "node.policy_contract", "node.tool_call").length > 0 ||
        findConnectingEdges(edges, "node.tool_call", "node.policy_contract").length > 0;
      if (!guarded) {
        failures.push(
          "node.tool_call lacks GUARDS/GUARDED_BY connection to node.policy_contract",
        );
      }
    }
  }

  if (id === "constraint.side_effect_must_have_policy") {
    const hasSideEffect = predicateMap.has("HAS_SIDE_EFFECT");
    if (!hasSideEffect) {
      failures.push("Missing edge.HAS_SIDE_EFFECT definition");
    }
    const sideEffect = nodeIndex.get("node.side_effect");
    const externalAction = nodeIndex.get("node.external_action");
    if (!sideEffect || !externalAction) {
      failures.push("node.side_effect or node.external_action is not defined");
    } else if (
      !findConnectingEdges(edges, "node.external_action", "node.side_effect").length
    ) {
      failures.push("No HAS_SIDE_EFFECT path from external_action to side_effect");
    }
    const policyLinked =
      nodeHasIncomingPredicate(sideEffect, "GUARDS", edges) ||
      nodeHasIncomingPredicate(externalAction, "GUARDS", edges) ||
      nodeHasIncomingPredicate(externalAction, "AUTHORIZES", edges) ||
      findConnectingEdges(edges, "node.policy_contract", "node.side_effect").length > 0;
    if (!policyLinked) {
      failures.push("Side-effecting actions lack policy binding (GUARDS/AUTHORIZES)");
    }
  }

  if (id === "constraint.agent_must_have_goal") {
    if (!findConnectingEdges(edges, "node.agent", "node.goal").length) {
      failures.push("Missing PURSUES_GOAL edge from node.agent to node.goal");
    }
  }

  if (id.endsWith("_must_be_node")) {
    for (const nodeId of appliesNodes) {
      if (!nodeIndex.has(nodeId)) {
        failures.push(`Required node '${nodeId}' is missing`);
      }
    }
  }

  if (id === "constraint.core_nodes_must_have_evidence") {
    for (const node of nodes) {
      if (!NORMATIVE_SUBGRAPHS.has(node.subgraph)) continue;
      if (node.id === "node.node_class") continue;
      const refs = node.evidence ?? [];
      if (refs.length === 0 && !ctx.externalEvidenceNodeIds.has(node.id)) {
        failures.push(`Normative node '${node.id}' has no evidence references`);
      }
    }
  }

  if (id === "constraint.validator_must_connect_to_target") {
    const validates = predicateMap.get("VALIDATES") ?? [];
    const graphValidator = nodeIndex.get("node.graph_validator");
    if (!graphValidator) {
      failures.push("node.graph_validator is not defined");
    } else {
      const reachable = validates.some((edge) =>
        normalizeNodeIds(edge.source_domain).includes("node.graph_validator"),
      );
      if (!reachable) {
        failures.push("No VALIDATES edge from node.graph_validator to checker nodes");
      }
    }
  }

  if (id === "constraint.release_gate_must_check_all") {
    if (!nodeIndex.has("node.release_gate")) {
      failures.push("node.release_gate is not defined");
    }
    if (!predicateMap.has("BLOCKS_RELEASE")) {
      failures.push("Missing BLOCKS_RELEASE edge definition");
    }
  }

  if (id === "constraint.all_nodes_must_have_id") {
    for (const node of nodes) {
      if (!node.id || !/^node\.[a-z][a-z0-9_]*$/.test(node.id)) {
        failures.push(`Invalid or missing node id in ${node._file}`);
      }
    }
  }

  if (id === "constraint.all_edges_must_have_predicate") {
    for (const edge of edges) {
      if (!edge.predicate) {
        failures.push(`Edge '${edge.id}' missing predicate`);
      }
    }
  }

  return failures;
}

function main() {
  console.log("Validating ontology constraints...");
  const { nodes, edges, constraints } = loadOntologyArtifacts();
  const ctx = {
    nodes,
    edges,
    nodeIndex: buildNodeIndex(nodes),
    edgeIndex: buildEdgeIndex(edges),
    predicateMap: edgesByPredicate(edges),
    externalEvidenceNodeIds: collectExternalEvidenceNodeIds(),
  };

  let errorCount = 0;
  let warningCount = 0;
  let passCount = 0;

  for (const constraint of constraints) {
    const failures = checkConstraint(constraint, ctx);
    const severity = constraint.severity ?? "error";

    if (failures.length === 0) {
      passCount += 1;
      console.log(`  PASS: ${constraint.id}`);
      continue;
    }

    const prefix = severity === "warning" ? "WARN" : "FAIL";
    if (severity === "warning") warningCount += failures.length;
    else errorCount += failures.length;

    console.log(`  ${prefix}: ${constraint.id}`);
    for (const failure of failures) {
      console.log(`         - ${failure}`);
    }
  }

  console.log(
    `\nConstraints: ${passCount} passed, ${errorCount} errors, ${warningCount} warnings (${constraints.length} total)`,
  );

  if (errorCount > 0) process.exit(1);
  console.log("Constraint validation passed.");
  process.exit(0);
}

main();
