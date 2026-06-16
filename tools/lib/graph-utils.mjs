import {
  findConnectingEdges,
  normalizeNodeIds,
} from "./ontology-loader.mjs";

export const KEY_PATHS = [
  {
    id: "agent_execution_path",
    label: "Agent Execution Path",
    description:
      "Goal → Agent → DecisionLoop → Plan → ToolCall → PermissionPolicy → Executor → Sandbox → EnvironmentAction → ToolResult → Transcript → Trace",
    nodes: [
      "node.goal",
      "node.agent",
      "node.decision_loop",
      "node.plan",
      "node.tool_call",
      "node.permission_policy",
      "node.executor",
      "node.sandbox",
      "node.environment_action",
      "node.tool_result",
      "node.transcript",
      "node.trace",
    ],
  },
  {
    id: "context_tool_discovery_path",
    label: "Context Tool Discovery Path",
    description:
      "ContextSource → ProgressiveDisclosure → LightIndex → ToolSearch → DeferredToolDefinition → ToolSelection → ToolCall",
    nodes: [
      "node.file_system_source",
      "node.progressive_disclosure",
      "node.light_index",
      "node.tool_search",
      "node.deferred_tool_definition",
      "node.tool_selection",
      "node.tool_call",
    ],
  },
  {
    id: "retrieval_pipeline_path",
    label: "Retrieval Pipeline Path",
    description:
      "Document → Chunk → ContextualizedChunk → SparseIndex/VectorIndex → RankFusion → Reranker → MemoryRetriever → ContextGraph",
    nodes: [
      "node.chunk",
      "node.contextualized_chunk",
      "node.sparse_index",
      "node.vector_index",
      "node.rank_fusion",
      "node.reranker",
      "node.memory_retriever",
      "node.context_graph",
    ],
  },
];

export function computePathLinks(pathDef, edges, nodeIndex) {
  const steps = [];
  let complete = true;

  for (let i = 0; i < pathDef.nodes.length - 1; i += 1) {
    const from = pathDef.nodes[i];
    const to = pathDef.nodes[i + 1];
    const fromExists = nodeIndex.has(from);
    const toExists = nodeIndex.has(to);
    const connecting = findConnectingEdges(edges, from, to);
    const reverse = findConnectingEdges(edges, to, from);

    const stepComplete = fromExists && toExists;
    if (!stepComplete) complete = false;

    steps.push({
      from,
      to,
      fromExists,
      toExists,
      edges:
        connecting.length > 0 || reverse.length > 0
          ? [...connecting, ...reverse].map((edge) => ({
              id: edge.id,
              predicate: edge.predicate,
              direction: connecting.includes(edge) ? "forward" : "reverse",
            }))
          : [
              {
                id: `path.${pathDef.id}.${i}`,
                predicate: "PATH_STEP",
                direction: "conceptual",
              },
            ],
      complete: stepComplete,
    });
  }

  return {
    id: pathDef.id,
    label: pathDef.label,
    description: pathDef.description,
    nodes: pathDef.nodes,
    steps,
    complete,
    missingNodes: pathDef.nodes.filter((id) => !nodeIndex.has(id)),
  };
}

export function collectEvidence(nodes, edges, graphEvidencePath, readYaml) {
  const refs = new Map();

  function addRef(ref, context) {
    if (!ref) return;
    const existing = refs.get(ref) ?? {
      id: ref,
      referencedBy: [],
    };
    existing.referencedBy.push(context);
    refs.set(ref, existing);
  }

  for (const node of nodes) {
    for (const item of node.evidence ?? []) {
      addRef(item.ref, { type: "node", id: node.id, file: node._file });
    }
  }

  for (const edge of edges) {
    for (const item of edge.evidence ?? []) {
      addRef(item.ref, { type: "edge", id: edge.id, file: edge._file });
    }
  }

  let evidenceEntries = [];
  try {
    const evidenceDoc = readYaml(graphEvidencePath);
    evidenceEntries = evidenceDoc.evidence_entries ?? [];
    for (const entry of evidenceEntries) {
      for (const nodeId of entry.supports_nodes ?? []) {
        addRef(entry.id, {
          type: "node",
          id: nodeId,
          file: "references/graph-evidence.yaml",
          via: "supports_nodes",
        });
      }
      for (const edgeId of entry.supports_edges ?? []) {
        addRef(entry.id, {
          type: "edge",
          id: edgeId,
          file: "references/graph-evidence.yaml",
          via: "supports_edges",
        });
      }
      const existing = refs.get(entry.id) ?? {
        id: entry.id,
        referencedBy: [],
      };
      existing.entry = entry;
      refs.set(entry.id, existing);
    }

    for (const [nodeId, evidenceRefs] of Object.entries(
      evidenceDoc.node_evidence_index ?? {},
    )) {
      for (const ref of evidenceRefs ?? []) {
        addRef(ref, {
          type: "node",
          id: nodeId,
          file: "references/graph-evidence.yaml",
          via: "node_evidence_index",
        });
      }
    }
  } catch {
    // graph-evidence.yaml is optional for evidence aggregation
  }

  return {
    refs: [...refs.values()].sort((a, b) => a.id.localeCompare(b.id)),
    entries: evidenceEntries,
    totalRefs: refs.size,
  };
}

export function formatNode(node) {
  return {
    id: node.id,
    label: node.label,
    label_zh: node.label_zh,
    subgraph: node.subgraph,
    artifact: node.artifact,
    description: node.description,
    attributes: node.attributes ?? {},
    layer: node.layer,
    plane: node.plane,
    required_edges: node.required_edges,
    evidence: node.evidence,
    status: node.status,
  };
}

export function formatEdge(edge) {
  return {
    id: edge.id,
    predicate: edge.predicate,
    source_domain: edge.source_domain,
    target_range: edge.target_range,
    subgraph: edge.subgraph,
    description: edge.description,
    cardinality: edge.cardinality,
    evidence: edge.evidence,
    status: edge.status,
  };
}

export function getConnectedNodeIds(edges) {
  const connected = new Set();
  for (const edge of edges) {
    for (const id of normalizeNodeIds(edge.source_domain)) connected.add(id);
    for (const id of normalizeNodeIds(edge.target_range)) connected.add(id);
  }
  return connected;
}

export function resolveDiagramOntologyNode(diagramId, mappings, nodeIndex) {
  const mapping = mappings.find((m) => m.diagram_node === diagramId);
  if (mapping?.ontology_node && nodeIndex.has(mapping.ontology_node)) {
    return { ontologyNode: mapping.ontology_node, via: "mapping" };
  }

  const direct = diagramId.replace(/^diagram\./, "node.");
  if (nodeIndex.has(direct)) {
    return { ontologyNode: direct, via: "direct" };
  }

  const snake = `node.${diagramId.replace(/^diagram\./, "").replace(/-/g, "_")}`;
  if (nodeIndex.has(snake)) {
    return { ontologyNode: snake, via: "snake_case" };
  }

  return null;
}
