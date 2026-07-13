// Generated from schemas/source/agent-ontology-artifact-contract.json.
// Do not edit: change the reviewed artifact contract and rebuild instead.
// generator_version=moonweave-ontology-builder/2.0.0
// source_fingerprint=93fd085ebe90e6d754d894c00b56fe90c302dcf1a0008e3de6e3426dc8a76d38
// artifact_contract_sha256=df1062cb9b4df925ef88afef04f96d15c1be11110f64acc69b680cd4c7569ce8
// generated_at=2026-07-13T00:00:00.000Z

export type NonEmptyString = string;
export type Identifier = string;
export type LocalizedText = {
  readonly zh: NonEmptyString;
  readonly en: NonEmptyString;
  readonly ja: NonEmptyString;
};
export type LocalizedDraftText = {
  readonly zh?: NonEmptyString;
  readonly en?: NonEmptyString;
  readonly ja?: NonEmptyString;
};
export type LifecycleStatus = "draft" | "review" | "accepted" | "deprecated";
export type Reviewer = {
  readonly reviewer_id: Identifier;
  readonly reviewer_role: "architecture" | "schema" | "ontology" | "domain";
  readonly reviewer_kind: "human" | "automated-agent";
  readonly reviewed_on: string;
  readonly decision_note: LocalizedText;
};
export type Review = ({
  readonly review_status: "draft";
  readonly reviewers: ReadonlyArray<Reviewer>;
}) | ({
  readonly review_status: "accepted";
  readonly reviewers: ReadonlyArray<Reviewer>;
});
export type SourceClaim = {
  readonly source_id: Identifier;
  readonly supports: NonEmptyString;
  readonly locator: NonEmptyString;
  readonly evidence_kind: "normative" | "official" | "peer-reviewed" | "vendor" | "design-inference";
  readonly confidence: "high" | "medium" | "low";
  readonly review_status: "draft" | "accepted";
};
export type SourceClaims = ReadonlyArray<SourceClaim>;
export type CardinalityBound = {
  readonly min: number;
  readonly max: number | null;
};
export type FieldCardinality = CardinalityBound;
export type RelationCardinality = {
  readonly source: CardinalityBound;
  readonly target: CardinalityBound;
};
export type ControlledValue = {
  readonly id: Identifier;
  readonly value: unknown;
  readonly labels: LocalizedText;
  readonly definitions: LocalizedText;
  readonly status: "accepted";
  readonly source_claims: SourceClaims;
};
export type Constraint = {
  readonly id: Identifier;
  readonly severity: "error" | "warning" | "info";
  readonly expression_language: "plain" | "json-schema" | "shacl" | "custom";
  readonly expression: NonEmptyString;
  readonly explanations: LocalizedText;
  readonly source_claims: SourceClaims;
};
export type RequiredRelationConstraint = {
  readonly id: Identifier;
  readonly direction: "incoming" | "outgoing";
  readonly predicate: Identifier;
  readonly target_concept_id: Identifier;
  readonly cardinality: CardinalityBound;
  readonly explanations: LocalizedText;
  readonly source_claims: SourceClaims;
};
export type Field = {
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly datatype: NonEmptyString;
  readonly required: boolean;
  readonly cardinality: FieldCardinality;
  readonly definitions: LocalizedText;
  readonly allowed_values: ReadonlyArray<ControlledValue>;
  readonly pattern: string | null;
  readonly example_value: unknown;
  readonly source_claims: SourceClaims;
};
export type Example = ({
  readonly id: Identifier;
  readonly kind: "positive";
  readonly labels: LocalizedText;
  readonly scenario_id: Identifier | null;
  readonly descriptions: LocalizedText;
  readonly field_values: Readonly<Record<string, unknown>>;
  readonly related_node_ids: ReadonlyArray<Identifier>;
  readonly related_relation_ids: ReadonlyArray<Identifier>;
  readonly expected_result: LocalizedText;
  readonly why_valid_or_invalid: LocalizedText;
  readonly synthetic: boolean;
  readonly verified_version: NonEmptyString;
  readonly source_claims: SourceClaims;
}) | ({
  readonly id: Identifier;
  readonly kind: "counterexample";
  readonly labels: LocalizedText;
  readonly scenario_id: Identifier | null;
  readonly descriptions: LocalizedText;
  readonly field_values: Readonly<Record<string, unknown>>;
  readonly related_node_ids: ReadonlyArray<Identifier>;
  readonly related_relation_ids: ReadonlyArray<Identifier>;
  readonly expected_result: LocalizedText;
  readonly why_valid_or_invalid: LocalizedText;
  readonly synthetic: boolean;
  readonly verified_version: NonEmptyString;
  readonly source_claims: SourceClaims;
}) | ({
  readonly id: Identifier;
  readonly kind: "boundary";
  readonly labels: LocalizedText;
  readonly scenario_id: Identifier | null;
  readonly descriptions: LocalizedText;
  readonly field_values: Readonly<Record<string, unknown>>;
  readonly related_node_ids: ReadonlyArray<Identifier>;
  readonly related_relation_ids: ReadonlyArray<Identifier>;
  readonly expected_result: LocalizedText;
  readonly why_valid_or_invalid: LocalizedText;
  readonly synthetic: boolean;
  readonly verified_version: NonEmptyString;
  readonly source_claims: SourceClaims;
}) | ({
  readonly id: Identifier;
  readonly kind: "instance";
  readonly labels: LocalizedText;
  readonly scenario_id: Identifier | null;
  readonly descriptions: LocalizedText;
  readonly field_values: Readonly<Record<string, unknown>>;
  readonly related_node_ids: ReadonlyArray<Identifier>;
  readonly related_relation_ids: ReadonlyArray<Identifier>;
  readonly expected_result: LocalizedText;
  readonly why_valid_or_invalid: LocalizedText;
  readonly synthetic: boolean;
  readonly verified_version: NonEmptyString;
  readonly source_claims: SourceClaims;
}) | ({
  readonly id: Identifier;
  readonly kind: "case-fragment";
  readonly labels: LocalizedText;
  readonly scenario_id: Identifier;
  readonly descriptions: LocalizedText;
  readonly field_values: Readonly<Record<string, unknown>>;
  readonly related_node_ids: ReadonlyArray<Identifier>;
  readonly related_relation_ids: ReadonlyArray<Identifier>;
  readonly expected_result: LocalizedText;
  readonly why_valid_or_invalid: LocalizedText;
  readonly synthetic: boolean;
  readonly verified_version: NonEmptyString;
  readonly source_claims: SourceClaims;
});
export type MappingConformance = {
  readonly status: "contract-tested" | "executable-tested" | "not-tested";
  readonly test_id: Identifier;
  readonly method: LocalizedText;
};
export type ExternalMapping = {
  readonly id: Identifier;
  readonly system: NonEmptyString;
  readonly external_identifier: NonEmptyString;
  readonly external_version: NonEmptyString;
  readonly canonical_target_ids: ReadonlyArray<Identifier>;
  readonly mapping_kind: "exact" | "broader" | "narrower" | "related" | "lossy" | "unsupported";
  readonly scope: LocalizedText;
  readonly direction: "import-to-canonical" | "export-from-canonical" | "bidirectional";
  readonly loss_notes: LocalizedText;
  readonly conversion_note: LocalizedText;
  readonly conformance: MappingConformance;
  readonly status: "accepted";
  readonly source_claims: SourceClaims;
};
export type InformationBase = {
  readonly labels?: LocalizedDraftText;
  readonly definitions?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
};
export type Plane = ({
  readonly id: Identifier;
  readonly labels: LocalizedDraftText;
  readonly definitions: LocalizedDraftText;
  readonly purpose?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly status: "draft";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedDraftText;
  readonly definitions: LocalizedDraftText;
  readonly purpose?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly status: "review";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly definitions: LocalizedText;
  readonly purpose: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly status: "accepted";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly introduced_in: NonEmptyString;
  readonly change_note: LocalizedDraftText;
});
export type InteractionFacet = {
  readonly applicable: boolean;
  readonly not_applicable_reason: LocalizedText | null;
};
export type InteractionContract = {
  readonly applicability: "operational" | "descriptive" | "mixed";
  readonly facets: {
    readonly input: InteractionFacet;
    readonly output: InteractionFacet;
    readonly failure: InteractionFacet;
    readonly recovery: InteractionFacet;
  };
  readonly review: Review;
};
export type TaxonomyContract = ({
  readonly applicability: "specialization";
  readonly not_applicable_reason: null;
  readonly review: Review;
}) | ({
  readonly applicability: "flat-root-exception";
  readonly not_applicable_reason: LocalizedText;
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
});
export type CompetencyQuestion = {
  readonly id: Identifier;
  readonly questions: LocalizedText;
  readonly query: NonEmptyString;
  readonly expected_assertion: NonEmptyString;
  readonly positive_example_ids: ReadonlyArray<Identifier>;
  readonly counterexample_ids: ReadonlyArray<Identifier>;
  readonly source_claims: SourceClaims;
  readonly review: Review;
};
export type Module = ({
  readonly id: Identifier;
  readonly plane_id: Identifier;
  readonly labels: LocalizedDraftText;
  readonly definitions: LocalizedDraftText;
  readonly purpose?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly interaction_contract: InteractionContract;
  readonly taxonomy_contract: TaxonomyContract;
  readonly examples?: ReadonlyArray<Example>;
  readonly competency_questions?: ReadonlyArray<CompetencyQuestion>;
  readonly source_claims?: SourceClaims;
  readonly status: "draft";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly plane_id: Identifier;
  readonly labels: LocalizedDraftText;
  readonly definitions: LocalizedDraftText;
  readonly purpose?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly interaction_contract: InteractionContract;
  readonly taxonomy_contract: TaxonomyContract;
  readonly examples?: ReadonlyArray<Example>;
  readonly competency_questions?: ReadonlyArray<CompetencyQuestion>;
  readonly source_claims?: SourceClaims;
  readonly status: "review";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly plane_id: Identifier;
  readonly labels: LocalizedText;
  readonly definitions: LocalizedText;
  readonly purpose: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly interaction_contract: InteractionContract;
  readonly taxonomy_contract: TaxonomyContract;
  readonly examples: ReadonlyArray<Example>;
  readonly competency_questions: ReadonlyArray<CompetencyQuestion>;
  readonly source_claims: SourceClaims;
  readonly status: "accepted";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly introduced_in: NonEmptyString;
  readonly change_note: LocalizedDraftText;
});
export type ConceptStructure = {
  readonly identity_keys: ReadonlyArray<Identifier>;
  readonly fields: ReadonlyArray<Field>;
  readonly constraints: ReadonlyArray<Constraint>;
  readonly required_relation_constraints: ReadonlyArray<RequiredRelationConstraint>;
};
export type Concept = ({
  readonly id: Identifier;
  readonly module_id: Identifier;
  readonly labels: LocalizedDraftText;
  readonly short_definitions?: LocalizedDraftText;
  readonly definitions: LocalizedDraftText;
  readonly why_needed?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly semantic_kind?: ("entity" | "role" | "capability" | "information" | "specification" | "activity" | "event" | "state" | "quality" | "collection") | null;
  readonly primary_parent_relation_id?: Identifier | null;
  readonly structure?: ConceptStructure;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly external_mappings?: ReadonlyArray<ExternalMapping>;
  readonly applicability?: ReadonlyArray<"core" | "profile" | "adapter">;
  readonly status: "draft";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly deprecated_in?: NonEmptyString | null;
  readonly replaced_by_ids?: ReadonlyArray<Identifier>;
  readonly deprecation_reason?: LocalizedText | null;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly module_id: Identifier;
  readonly labels: LocalizedDraftText;
  readonly short_definitions?: LocalizedDraftText;
  readonly definitions: LocalizedDraftText;
  readonly why_needed?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly semantic_kind?: ("entity" | "role" | "capability" | "information" | "specification" | "activity" | "event" | "state" | "quality" | "collection") | null;
  readonly primary_parent_relation_id?: Identifier | null;
  readonly structure?: ConceptStructure;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly external_mappings?: ReadonlyArray<ExternalMapping>;
  readonly applicability?: ReadonlyArray<"core" | "profile" | "adapter">;
  readonly status: "review";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly deprecated_in?: NonEmptyString | null;
  readonly replaced_by_ids?: ReadonlyArray<Identifier>;
  readonly deprecation_reason?: LocalizedText | null;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly module_id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly definitions: LocalizedText;
  readonly why_needed: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly semantic_kind: "entity" | "role" | "capability" | "information" | "specification" | "activity" | "event" | "state" | "quality" | "collection";
  readonly primary_parent_relation_id: Identifier | null;
  readonly structure: ConceptStructure;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly external_mappings: ReadonlyArray<ExternalMapping>;
  readonly applicability: ReadonlyArray<"core" | "profile" | "adapter">;
  readonly status: "accepted";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly introduced_in: NonEmptyString;
  readonly deprecated_in: NonEmptyString | null;
  readonly replaced_by_ids: ReadonlyArray<Identifier>;
  readonly deprecation_reason: LocalizedText | null;
  readonly change_note: LocalizedDraftText;
}) | (({
  readonly id: Identifier;
  readonly module_id: Identifier;
  readonly labels: LocalizedDraftText;
  readonly short_definitions?: LocalizedDraftText;
  readonly definitions: LocalizedDraftText;
  readonly why_needed?: LocalizedDraftText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly semantic_kind?: ("entity" | "role" | "capability" | "information" | "specification" | "activity" | "event" | "state" | "quality" | "collection") | null;
  readonly primary_parent_relation_id?: Identifier | null;
  readonly structure?: ConceptStructure;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly external_mappings?: ReadonlyArray<ExternalMapping>;
  readonly applicability?: ReadonlyArray<"core" | "profile" | "adapter">;
  readonly status: "deprecated";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly introduced_in?: NonEmptyString;
  readonly deprecated_in: NonEmptyString;
  readonly replaced_by_ids: ReadonlyArray<Identifier>;
  readonly deprecation_reason: LocalizedText | null;
  readonly change_note?: LocalizedDraftText;
}) & (({
  readonly replaced_by_ids?: unknown;
}) | ({
  readonly deprecation_reason?: LocalizedText;
})));
export type InverseReading = {
  readonly predicate: Identifier;
  readonly labels: LocalizedText;
};
export type BoundaryContext = {
  readonly trust_boundary_concept_id: Identifier;
  readonly authority_basis: LocalizedText;
  readonly protocol_or_resource_context: LocalizedText;
};
export type Relation = ({
  readonly id: Identifier;
  readonly predicate: Identifier;
  readonly source_id: Identifier;
  readonly target_id: Identifier;
  readonly direction: "source-to-target";
  readonly relation_kind: "hierarchy" | "composition" | "causal" | "temporal" | "information" | "governance" | "mapping";
  readonly labels?: LocalizedDraftText;
  readonly definitions?: LocalizedDraftText;
  readonly cardinality?: RelationCardinality | null;
  readonly cardinality_not_applicable_reason?: LocalizedText | null;
  readonly inverse_reading?: InverseReading;
  readonly conditions?: ReadonlyArray<Constraint>;
  readonly temporal_scope?: "timeless" | "valid-time" | "transaction-time";
  readonly boundary_context?: BoundaryContext | null;
  readonly constraints?: ReadonlyArray<Constraint>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly distinct_fact_rationale?: LocalizedText | null;
  readonly status: "draft";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly deprecated_in?: NonEmptyString | null;
  readonly replaced_by_ids?: ReadonlyArray<Identifier>;
  readonly deprecation_reason?: LocalizedText | null;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly predicate: Identifier;
  readonly source_id: Identifier;
  readonly target_id: Identifier;
  readonly direction: "source-to-target";
  readonly relation_kind: "hierarchy" | "composition" | "causal" | "temporal" | "information" | "governance" | "mapping";
  readonly labels?: LocalizedDraftText;
  readonly definitions?: LocalizedDraftText;
  readonly cardinality?: RelationCardinality | null;
  readonly cardinality_not_applicable_reason?: LocalizedText | null;
  readonly inverse_reading?: InverseReading;
  readonly conditions?: ReadonlyArray<Constraint>;
  readonly temporal_scope?: "timeless" | "valid-time" | "transaction-time";
  readonly boundary_context?: BoundaryContext | null;
  readonly constraints?: ReadonlyArray<Constraint>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly distinct_fact_rationale?: LocalizedText | null;
  readonly status: "review";
  readonly review: Review;
  readonly introduced_in?: NonEmptyString;
  readonly deprecated_in?: NonEmptyString | null;
  readonly replaced_by_ids?: ReadonlyArray<Identifier>;
  readonly deprecation_reason?: LocalizedText | null;
  readonly change_note?: LocalizedDraftText;
}) | ({
  readonly id: Identifier;
  readonly predicate: Identifier;
  readonly source_id: Identifier;
  readonly target_id: Identifier;
  readonly direction: "source-to-target";
  readonly relation_kind: "hierarchy" | "composition" | "causal" | "temporal" | "information" | "governance" | "mapping";
  readonly labels: LocalizedText;
  readonly definitions: LocalizedText;
  readonly cardinality: RelationCardinality | null;
  readonly cardinality_not_applicable_reason: LocalizedText | null;
  readonly inverse_reading: InverseReading;
  readonly conditions: ReadonlyArray<Constraint>;
  readonly temporal_scope: "timeless" | "valid-time" | "transaction-time";
  readonly boundary_context: BoundaryContext | null;
  readonly constraints: ReadonlyArray<Constraint>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly distinct_fact_rationale: LocalizedText | null;
  readonly status: "accepted";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly introduced_in: NonEmptyString;
  readonly deprecated_in: NonEmptyString | null;
  readonly replaced_by_ids: ReadonlyArray<Identifier>;
  readonly deprecation_reason: LocalizedText | null;
  readonly change_note: LocalizedDraftText;
}) | (({
  readonly id: Identifier;
  readonly predicate: Identifier;
  readonly source_id: Identifier;
  readonly target_id: Identifier;
  readonly direction: "source-to-target";
  readonly relation_kind: "hierarchy" | "composition" | "causal" | "temporal" | "information" | "governance" | "mapping";
  readonly labels?: LocalizedDraftText;
  readonly definitions?: LocalizedDraftText;
  readonly cardinality?: RelationCardinality | null;
  readonly cardinality_not_applicable_reason?: LocalizedText | null;
  readonly inverse_reading?: InverseReading;
  readonly conditions?: ReadonlyArray<Constraint>;
  readonly temporal_scope?: "timeless" | "valid-time" | "transaction-time";
  readonly boundary_context?: BoundaryContext | null;
  readonly constraints?: ReadonlyArray<Constraint>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims?: SourceClaims;
  readonly distinct_fact_rationale?: LocalizedText | null;
  readonly status: "deprecated";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly introduced_in?: NonEmptyString;
  readonly deprecated_in: NonEmptyString;
  readonly replaced_by_ids: ReadonlyArray<Identifier>;
  readonly deprecation_reason: LocalizedText | null;
  readonly change_note?: LocalizedDraftText;
}) & (({
  readonly replaced_by_ids?: unknown;
}) | ({
  readonly deprecation_reason?: LocalizedText;
})));
export type CasePathStep = {
  readonly order: number;
  readonly case_fragment_example_id: Identifier;
  readonly traversal_relation_id: Identifier | null;
};
export type CasePath = ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly descriptions: LocalizedText;
  readonly steps: ReadonlyArray<CasePathStep>;
  readonly source_claims: SourceClaims;
  readonly status: "draft";
  readonly review: Review;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly descriptions: LocalizedText;
  readonly steps: ReadonlyArray<CasePathStep>;
  readonly source_claims: SourceClaims;
  readonly status: "review";
  readonly review: Review;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly descriptions: LocalizedText;
  readonly steps: ReadonlyArray<CasePathStep>;
  readonly source_claims: SourceClaims;
  readonly status: "accepted";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
});
export type HygieneGate = {
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly descriptions: LocalizedText;
  readonly severity: "error" | "warning" | "info";
  readonly check_kind: "schema" | "taxonomy" | "reference" | "information" | "generation" | "ui";
  readonly expression: NonEmptyString;
  readonly status: "accepted";
  readonly source_claims: SourceClaims;
};
export type Product = ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly definitions: LocalizedText;
  readonly why_needed: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly status: "draft-hierarchy-upgrade";
  readonly review: Review;
  readonly date: string;
  readonly canonical_version: NonEmptyString;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly definitions: LocalizedText;
  readonly why_needed: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly status: "review";
  readonly review: Review;
  readonly date: string;
  readonly canonical_version: NonEmptyString;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly definitions: LocalizedText;
  readonly why_needed: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly status: "accepted";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly date: string;
  readonly canonical_version: NonEmptyString;
});
export type ArtifactMetadata = ({
  readonly artifact_kind: "canonical-agent-ontology";
  readonly contract_version: "1.0.0";
  readonly canonical_version: NonEmptyString;
  readonly release_channel: "candidate";
  readonly releasable: false;
  readonly generated: true;
  readonly do_not_edit: true;
  readonly generated_from: ReadonlyArray<NonEmptyString>;
  readonly generator_version: NonEmptyString;
  readonly generated_at: string;
  readonly source_tree_sha256: string;
}) | ({
  readonly artifact_kind: "canonical-agent-ontology";
  readonly contract_version: "1.0.0";
  readonly canonical_version: NonEmptyString;
  readonly release_channel: "release";
  readonly releasable: true;
  readonly generated: true;
  readonly do_not_edit: true;
  readonly generated_from: ReadonlyArray<NonEmptyString>;
  readonly generator_version: NonEmptyString;
  readonly generated_at: string;
  readonly source_tree_sha256: string;
});
export type OntologyMetrics = {
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
};
export type ProductSource = {
  readonly source_kind: "agent-ontology-product";
  readonly contract_version: "1.0.0";
  readonly product: Product;
  readonly planes: ReadonlyArray<Plane>;
  readonly global_constraints: ReadonlyArray<Constraint>;
  readonly case_paths: ReadonlyArray<CasePath>;
  readonly hygiene_gates: ReadonlyArray<HygieneGate>;
};
export type ModuleSource = {
  readonly source_kind: "agent-ontology-module";
  readonly contract_version: "1.0.0";
  readonly module: Module;
  readonly classes: ReadonlyArray<Concept>;
  readonly relations: ReadonlyArray<Relation>;
};
export type CanonicalArtifact = ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly definitions: LocalizedText;
  readonly why_needed: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly status: "draft-hierarchy-upgrade";
  readonly review: Review;
  readonly date: string;
  readonly artifact_metadata: ArtifactMetadata;
  readonly planes: ReadonlyArray<Plane>;
  readonly modules: ReadonlyArray<Module>;
  readonly classes: ReadonlyArray<Concept>;
  readonly relations: ReadonlyArray<Relation>;
  readonly global_constraints: ReadonlyArray<Constraint>;
  readonly case_paths: ReadonlyArray<CasePath>;
  readonly hygiene_gates: ReadonlyArray<HygieneGate>;
  readonly ontology_metrics: OntologyMetrics;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly definitions: LocalizedText;
  readonly why_needed: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly status: "review";
  readonly review: Review;
  readonly date: string;
  readonly artifact_metadata: ArtifactMetadata;
  readonly planes: ReadonlyArray<Plane>;
  readonly modules: ReadonlyArray<Module>;
  readonly classes: ReadonlyArray<Concept>;
  readonly relations: ReadonlyArray<Relation>;
  readonly global_constraints: ReadonlyArray<Constraint>;
  readonly case_paths: ReadonlyArray<CasePath>;
  readonly hygiene_gates: ReadonlyArray<HygieneGate>;
  readonly ontology_metrics: OntologyMetrics;
}) | ({
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions: LocalizedText;
  readonly definitions: LocalizedText;
  readonly why_needed: LocalizedText;
  readonly includes: ReadonlyArray<LocalizedText>;
  readonly excludes: ReadonlyArray<LocalizedText>;
  readonly examples: ReadonlyArray<Example>;
  readonly source_claims: SourceClaims;
  readonly status: "accepted";
  readonly review: Review & ({
    readonly review_status?: "accepted";
  });
  readonly date: string;
  readonly artifact_metadata: ArtifactMetadata;
  readonly planes: ReadonlyArray<Plane>;
  readonly modules: ReadonlyArray<Module>;
  readonly classes: ReadonlyArray<Concept>;
  readonly relations: ReadonlyArray<Relation>;
  readonly global_constraints: ReadonlyArray<Constraint>;
  readonly case_paths: ReadonlyArray<CasePath>;
  readonly hygiene_gates: ReadonlyArray<HygieneGate>;
  readonly ontology_metrics: OntologyMetrics;
});

export type CanonicalAgentOntology = CanonicalArtifact;
