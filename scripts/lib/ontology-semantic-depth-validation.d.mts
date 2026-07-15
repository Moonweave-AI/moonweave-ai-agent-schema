export interface OntologySemanticDepthMetrics {
  readonly domains: number;
  readonly modules: number;
  readonly concepts: number;
  readonly taxonomy_roots: number;
  readonly is_a_relations: number;
  readonly semantic_relations: number;
  readonly instance_examples: number;
  readonly controlled_values: number;
  readonly structure_fields: number;
  readonly constraints: number;
  readonly source_claims: number;
  readonly case_paths: number;
  readonly legacy_individuals_remaining: number;
  readonly legacy_data_properties_remaining: number;
  readonly legacy_axioms_remaining: number;
  readonly module_count_by_domain: Readonly<Record<string, number>>;
  readonly root_status_counts: Readonly<Record<string, number>>;
  readonly concept_depth_histogram: Readonly<Record<string, number>>;
  readonly max_concept_depth: number;
  readonly unresolved_root_count: number;
  readonly cross_kind_is_a_count: number;
  readonly primary_backbone_cycle_count: number;
  readonly template_text_violation_count: number;
  readonly module_label_suffix_violation_count: number;
  readonly unowned_cq_count: number;
}

export function validateSemanticDepthContracts(
  input: Readonly<Record<string, unknown>>,
): void;

export function findHierarchyCycle(
  conceptIds: ReadonlySet<string>,
  hierarchyRelations: readonly Readonly<{
    id: string;
    source_id: string;
    target_id: string;
  }>[],
): Readonly<{
  nodes: readonly string[];
  relations: readonly string[];
}> | null;

export function computeOntologyMetrics(
  canonical: Readonly<Record<string, unknown>>,
): OntologySemanticDepthMetrics;

export function finalizeCanonicalWithMetrics<
  T extends Readonly<Record<string, unknown>>,
>(canonicalDraft: T): T & Readonly<{
  ontology_metrics: OntologySemanticDepthMetrics;
}>;
