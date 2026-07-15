export interface ConceptTerminologyAuditSnapshot {
  readonly definition_sha256: string;
  readonly accepted_concept_count: number;
  readonly invalid_concept_count: number;
  readonly localized_violation_count: number;
  readonly display_label_collision_count: number;
  readonly invalid_by_semantic_kind: Readonly<Record<string, number>>;
}

export interface ConceptTerminologyAudit {
  readonly contract_version: "1.0.0";
  readonly baseline: ConceptTerminologyAuditSnapshot;
  readonly migration: Readonly<{
    transformed_concept_count: number;
    transformed_localized_definition_count: number;
    worker_capability_match_label_changed: boolean;
    reviewed_definition_restoration_count: number;
    synchronized_positive_example_count: number;
    synchronized_boundary_example_count: number;
    synchronized_sibling_contract_count: number;
    reviewed_shared_prefix_sibling_pair_count: number;
    synchronized_nested_claim_count: number;
  }>;
  readonly current: ConceptTerminologyAuditSnapshot;
}

export function createConceptTerminologyPhases(
  context: Readonly<Record<string, unknown>>,
): Readonly<{
  completeConceptGenusDifferentia(): ConceptTerminologyAudit;
}>;
