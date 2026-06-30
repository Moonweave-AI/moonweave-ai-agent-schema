import type { GraphEdgeData, GraphIr, GraphNodeData, OntologyDataset } from "./types";

const layerOrder = [
  "evidence",
  "actor-boundary",
  "security-policy",
  "runtime-trace",
  "task-action-observation",
  "capability-resource",
  "orchestration",
  "validation",
  "statechart",
  "evaluation"
];

export function buildGraphIr(dataset: OntologyDataset): GraphIr {
  const nodes: GraphNodeData[] = dataset.artifacts.map((artifact) => ({
    id: artifact.id,
    label: artifact.label,
    kind: artifact.artifact_type,
    layer: artifact.layer,
    disposition: artifact.disposition,
    source_ids: artifact.provenance.source_ids,
    constraint_ids: artifact.provenance.constraint_ids,
    review_status: artifact.provenance.review_status,
    description: artifact.description
  }));

  const edges: GraphEdgeData[] = dataset.relations.map((relation) => ({
    id: relation.id,
    source: relation.source_artifact_id,
    target: relation.target_artifact_id,
    label: relation.relation_kind,
    disposition: relation.disposition,
    trust_boundary_id: relation.trust_boundary_id,
    source_ids: relation.provenance.source_ids
  }));

  return {
    id: `${dataset.id}-graph-ir`,
    title: dataset.title,
    nodes,
    edges,
    generated_from: dataset.generated_from
  };
}

export function nodePosition(index: number, layer: string): { x: number; y: number } {
  const layerIndex = Math.max(0, layerOrder.indexOf(layer));
  const column = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: 70 + column * 220 + (layerIndex % 2) * 22,
    y: 80 + row * 150
  };
}

export function hasHiddenChainOfThoughtField(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasHiddenChainOfThoughtField(item));
  }

  return Object.entries(value).some(([key, nestedValue]) => {
    const normalizedKey = key.toLowerCase();
    return (
      normalizedKey.includes("hidden_chain_of_thought") ||
      normalizedKey.includes("private_chain_of_thought") ||
      normalizedKey.includes("hidden chain-of-thought") ||
      normalizedKey.includes("private chain-of-thought") ||
      hasHiddenChainOfThoughtField(nestedValue)
    );
  });
}

export function graphSeparatesProtocolFamilies(graph: GraphIr): boolean {
  const mcpNodeIds = new Set(graph.nodes.filter((node) => node.source_ids.some((id) => id.includes("mcp"))).map((node) => node.id));
  const a2aNodeIds = new Set(graph.nodes.filter((node) => node.source_ids.some((id) => id.includes("a2a"))).map((node) => node.id));

  return [...mcpNodeIds].some((nodeId) => !a2aNodeIds.has(nodeId)) && [...a2aNodeIds].some((nodeId) => !mcpNodeIds.has(nodeId));
}
