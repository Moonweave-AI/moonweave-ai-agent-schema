export type ReviewStatus = "accepted" | "draft" | "needs-review";

export type Disposition = "core" | "core+profile" | "profile" | "adapter";

export type LayerFamily =
  | "evidence"
  | "actor-boundary"
  | "runtime-trace"
  | "task-action-observation"
  | "security-policy"
  | "validation"
  | "capability-resource"
  | "memory-context"
  | "orchestration"
  | "statechart"
  | "evaluation";

export type ArtifactType =
  | "OntologyArtifact"
  | "TrustBoundary"
  | "RelationArtifact"
  | "SchemaArtifact"
  | "GraphView"
  | "ConversionWarning";

export type RelationKind =
  | "derives_claim_from_source"
  | "crosses_trust_boundary"
  | "records_observable_trace_event"
  | "plans_task_for_goal"
  | "observes_execution_result"
  | "exposes_capability_surface"
  | "delegates_to_remote_agent"
  | "transitions_state_on_event"
  | "evaluates_run_on_benchmark";

export interface Provenance {
  source_ids: string[];
  constraint_ids: string[];
  proposal_ids: string[];
  derivation_note: string;
  review_status: ReviewStatus;
}

export interface OntologyArtifact {
  id: string;
  artifact_type: ArtifactType;
  label: string;
  layer: LayerFamily;
  disposition: Disposition;
  description: string;
  provenance: Provenance;
}

export interface OntologyRelation extends OntologyArtifact {
  artifact_type: "RelationArtifact";
  relation_kind: RelationKind;
  source_artifact_id: string;
  target_artifact_id: string;
  trust_boundary_id?: string;
  direction: "source-to-target" | "bidirectional";
}

export interface OntologyDataset {
  id: string;
  artifact_type: "GraphView";
  version: string;
  title: string;
  review_status: ReviewStatus;
  generated_from: string[];
  artifacts: OntologyArtifact[];
  relations: OntologyRelation[];
}

export interface GraphNodeData {
  id: string;
  label: string;
  kind: ArtifactType;
  layer: LayerFamily;
  disposition: Disposition;
  source_ids: string[];
  constraint_ids: string[];
  review_status: ReviewStatus;
  description: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  label: RelationKind;
  disposition: Disposition;
  trust_boundary_id?: string;
  source_ids: string[];
}

export interface GraphIr {
  id: string;
  title: string;
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  generated_from: string[];
}

export interface AdapterSpec {
  id: string;
  family: "mcp" | "a2a" | "framework" | "statechart" | "benchmark" | "validation";
  disposition: "profile" | "adapter" | "profile/adapter";
  owns: string[];
  source_ids: string[];
  boundary_rule: string;
}
