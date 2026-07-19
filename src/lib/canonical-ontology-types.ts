/**
 * Consumer contract for the ontology artifact emitted by the current YAML
 * compiler. It describes only data that application consumers render, index,
 * or validate at their boundary.
 */

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

export type LifecycleStatus =
  | "draft-hierarchy-upgrade"
  | "draft"
  | "accepted"
  | "deprecated";

export type RootStatus =
  | "domain-upper-root"
  | "module-key-root"
  | "composition-root"
  | "unresolved-root";

export type RelationLayoutRole =
  | "primary-backbone"
  | "secondary-backbone"
  | "cross-link"
  | "none";

export type SourceClaim = {
  readonly source_id: Identifier;
  readonly supports: NonEmptyString;
  readonly locator: NonEmptyString;
  readonly evidence_kind: NonEmptyString;
  readonly confidence: "high" | "medium" | "low";
};

export type CanonicalSourceClaim = SourceClaim;
export type SourceClaims = ReadonlyArray<SourceClaim>;
export type CanonicalSourceClaims = ReadonlyArray<CanonicalSourceClaim>;

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
  readonly status: LifecycleStatus;
  readonly source_claims: SourceClaims;
};

export type Constraint = {
  readonly id: Identifier;
  readonly labels?: LocalizedText;
  readonly definitions?: LocalizedText;
  readonly severity: "error" | "warning" | "info";
  readonly expression_language: NonEmptyString;
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

export type Example = {
  readonly id: Identifier;
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
};

export type ConceptStructure = {
  readonly identity_keys: ReadonlyArray<Identifier>;
  readonly fields: ReadonlyArray<Field>;
  readonly constraints: ReadonlyArray<Constraint>;
  readonly required_relation_constraints: ReadonlyArray<RequiredRelationConstraint>;
};

export type CasePathStep = {
  readonly order: number;
  readonly case_fragment_example_id: Identifier;
  readonly traversal_relation_id: Identifier | null;
};

export type CasePath = {
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly descriptions?: LocalizedText;
  readonly steps: ReadonlyArray<CasePathStep>;
  readonly source_claims?: CanonicalSourceClaims;
  readonly status?: LifecycleStatus;
};

export type EngineeringPayload = Readonly<Record<string, unknown>>;

export type ReferenceImplementation = {
  readonly name: NonEmptyString;
  readonly url: NonEmptyString;
  readonly description?: LocalizedText | NonEmptyString;
};

export type EngineeringInformation = {
  readonly explanation?: LocalizedText | NonEmptyString;
  readonly typical_input?: ReadonlyArray<EngineeringPayload>;
  readonly typical_output?: ReadonlyArray<EngineeringPayload>;
  readonly reference_implementations?: ReadonlyArray<ReferenceImplementation>;
};

export type TaxonomyContract = Readonly<Record<string, unknown>>;
export type InteractionContract = Readonly<Record<string, unknown>>;

type CanonicalInformation = {
  readonly id: Identifier;
  readonly labels: LocalizedText;
  readonly short_definitions?: LocalizedText;
  readonly definitions?: LocalizedText;
  readonly why_needed?: LocalizedText;
  readonly purpose?: LocalizedText;
  readonly includes?: ReadonlyArray<LocalizedText>;
  readonly excludes?: ReadonlyArray<LocalizedText>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims: CanonicalSourceClaims;
  readonly status: LifecycleStatus;
  readonly engineering?: EngineeringInformation;
  readonly structure?: ConceptStructure;
};

export type CanonicalPlaneContract = CanonicalInformation;

export type CanonicalModuleContract = CanonicalInformation & {
  readonly plane_id: Identifier;
  readonly key_notion?: LocalizedText;
  readonly owns_when?: LocalizedText;
  readonly references_when?: LocalizedText;
  readonly interaction_contract?: InteractionContract;
  readonly taxonomy_contract?: TaxonomyContract;
};

export type CanonicalConceptContract = CanonicalInformation & {
  readonly module_id: Identifier;
  readonly semantic_kind?: NonEmptyString | null;
  readonly primary_parent_relation_id?: Identifier | null;
  readonly root_status?: RootStatus | null;
  readonly lexical_aliases?: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly sibling_differentiation?: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly applicability?: ReadonlyArray<NonEmptyString>;
};

export type CanonicalRelationContract = {
  readonly id: Identifier;
  readonly predicate: Identifier;
  readonly source_id: Identifier;
  readonly target_id: Identifier;
  readonly direction: "source-to-target";
  readonly relation_kind: NonEmptyString;
  readonly layout_role?: RelationLayoutRole;
  readonly layout_parent_id?: Identifier | null;
  readonly layout_child_id?: Identifier | null;
  readonly labels?: LocalizedText;
  readonly definitions?: LocalizedText;
  readonly cardinality?: RelationCardinality | null;
  readonly cardinality_not_applicable_reason?: LocalizedText | null;
  readonly inverse_reading?: Readonly<Record<string, unknown>>;
  readonly conditions?: ReadonlyArray<Constraint>;
  readonly temporal_scope?: "timeless" | "valid-time" | "transaction-time";
  readonly boundary_context?: Readonly<Record<string, unknown>> | null;
  readonly constraints?: ReadonlyArray<Constraint>;
  readonly examples?: ReadonlyArray<Example>;
  readonly source_claims: CanonicalSourceClaims;
  readonly distinct_fact_rationale?: LocalizedText | null;
  readonly status: LifecycleStatus;
};

export type CanonicalArtifactMetadata = {
  readonly artifact_kind: "canonical-agent-ontology";
  readonly contract_version: "2.0.0";
  readonly canonical_version: NonEmptyString;
  readonly generated: true;
  readonly do_not_edit: true;
  readonly generated_from: ReadonlyArray<NonEmptyString>;
  readonly generator_version: NonEmptyString;
  readonly generated_at: string;
  readonly source_tree_sha256: string;
};

export type HygieneGate = Readonly<Record<string, unknown>> | NonEmptyString;
export type OntologyMetrics = Readonly<Record<string, number>>;

export type CanonicalArtifactContract = CanonicalInformation & {
  readonly date?: string;
  readonly artifact_metadata: CanonicalArtifactMetadata;
  readonly planes: ReadonlyArray<CanonicalPlaneContract>;
  readonly modules: ReadonlyArray<CanonicalModuleContract>;
  readonly classes: ReadonlyArray<CanonicalConceptContract>;
  readonly relations: ReadonlyArray<CanonicalRelationContract>;
  readonly global_constraints: ReadonlyArray<Constraint>;
  readonly case_paths: ReadonlyArray<CasePath>;
  readonly hygiene_gates: ReadonlyArray<HygieneGate>;
  readonly ontology_metrics: OntologyMetrics;
};

export type CanonicalAgentOntology = CanonicalArtifactContract;

export type Plane = CanonicalPlaneContract;
export type Module = CanonicalModuleContract;
export type Concept = CanonicalConceptContract;
export type Relation = CanonicalRelationContract;
export type ArtifactMetadata = CanonicalArtifactMetadata;
export type CanonicalArtifact = CanonicalArtifactContract;
