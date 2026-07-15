export interface OntologyLocalizedText {
  readonly zh: string;
  readonly en: string;
  readonly ja: string;
}

export type OntologyValidationErrorCode =
  | "SOURCE_CONTRACT_INVALID"
  | "MODULE_LABEL_SUFFIX"
  | "MODULE_TEMPLATE_TEXT"
  | "MODULE_KEY_NOTION"
  | "MODULE_SEMANTIC_REFERENCE"
  | "COMPETENCY_QUESTION_OWNER"
  | "COMPETENCY_QUESTION_SEMANTIC_KEY"
  | "CROSS_KIND_IS_A"
  | "LAYOUT_ENDPOINT"
  | "PRIMARY_BACKBONE_PARENT"
  | "PRIMARY_BACKBONE_CYCLE"
  | "ROOT_STATUS_INVALID"
  | "LEXICAL_ALIAS_INVALID"
  | "SIBLING_DIFFERENTIATION_INVALID"
  | "BACKBONE_PREDICATE_INVALID"
  | "RELEASE_EVIDENCE_INVALID";

export const ontologyValidationErrorCodes: Readonly<{
  sourceContractInvalid: "SOURCE_CONTRACT_INVALID";
  moduleLabelSuffix: "MODULE_LABEL_SUFFIX";
  moduleTemplateText: "MODULE_TEMPLATE_TEXT";
  moduleKeyNotion: "MODULE_KEY_NOTION";
  moduleSemanticReference: "MODULE_SEMANTIC_REFERENCE";
  competencyQuestionOwner: "COMPETENCY_QUESTION_OWNER";
  competencyQuestionSemanticKey: "COMPETENCY_QUESTION_SEMANTIC_KEY";
  crossKindIsA: "CROSS_KIND_IS_A";
  layoutEndpoint: "LAYOUT_ENDPOINT";
  primaryBackboneParent: "PRIMARY_BACKBONE_PARENT";
  primaryBackboneCycle: "PRIMARY_BACKBONE_CYCLE";
  rootStatusInvalid: "ROOT_STATUS_INVALID";
  lexicalAliasInvalid: "LEXICAL_ALIAS_INVALID";
  siblingDifferentiationInvalid: "SIBLING_DIFFERENTIATION_INVALID";
  backbonePredicateInvalid: "BACKBONE_PREDICATE_INVALID";
  releaseEvidenceInvalid: "RELEASE_EVIDENCE_INVALID";
}>;

export class OntologyBuildValidationError extends Error {
  readonly code: OntologyValidationErrorCode;
  constructor(code: OntologyValidationErrorCode, message: string);
}

export interface OntologyCompetencyQuestion {
  readonly id: string;
  readonly semantic_key: string;
  readonly primary_owner_module_id: string;
  readonly related_module_ids: readonly string[];
}

export interface OntologyInteractionFacet {
  readonly applicable: boolean;
  readonly description: OntologyLocalizedText | null;
  readonly family_concept_ids: readonly string[];
  readonly relation_ids: readonly string[];
  readonly not_applicable_reason: OntologyLocalizedText | null;
}

export interface OntologyTaxonomyContract {
  readonly applicability: "specialization" | "mixed-backbone" | "flat-root-exception";
  readonly hierarchy_policy: "arbitrary-depth-reviewed-backbone";
  readonly key_root_concept_ids: readonly string[];
  readonly allowed_backbone_predicates: readonly string[];
  readonly flat_root_exception_concept_ids: readonly string[];
  readonly not_applicable_reason: OntologyLocalizedText | null;
}

export interface OntologyBoundaryDecision {
  readonly other_module_id: string;
  readonly owner_module_id: string;
  readonly subject_concept_ids: readonly string[];
  readonly relation_ids: readonly string[];
}

export interface OntologyOverlapCheck {
  readonly other_module_id: string;
  readonly owner_module_id: string | null;
  readonly candidate_concept_ids: readonly string[];
  readonly result: "distinct" | "move-owner" | "merge" | "split" | "unresolved";
}

export interface OntologyMetricModule {
  readonly id: string;
  readonly plane_id: string;
  readonly labels: OntologyLocalizedText;
  readonly purpose?: OntologyLocalizedText;
  readonly includes?: readonly OntologyLocalizedText[];
  readonly excludes?: readonly OntologyLocalizedText[];
  readonly key_notion: OntologyLocalizedText;
  readonly owns_when: OntologyLocalizedText;
  readonly references_when: OntologyLocalizedText;
  readonly boundary_decisions: readonly OntologyBoundaryDecision[];
  readonly overlap_checks: readonly OntologyOverlapCheck[];
  readonly competency_questions: readonly OntologyCompetencyQuestion[];
  readonly interaction_contract: Readonly<{
    facets: Readonly<{
      input: OntologyInteractionFacet;
      output: OntologyInteractionFacet;
      failure: OntologyInteractionFacet;
      recovery: OntologyInteractionFacet;
    }>;
  }>;
  readonly taxonomy_contract: OntologyTaxonomyContract;
}

export interface OntologyMetricConcept {
  readonly id: string;
  readonly module_id: string;
  readonly labels: OntologyLocalizedText;
  readonly status?: string;
  readonly semantic_kind?: string | null;
  readonly primary_parent_relation_id: string | null;
  readonly root_status:
    | "domain-upper-root"
    | "module-key-root"
    | "composition-root"
    | "unresolved-root"
    | null;
  readonly lexical_aliases: readonly Readonly<{
    language: "zh" | "en" | "ja";
    value: string;
    alias_kind: "synonym" | "abbreviation" | "legacy-label";
  }>[];
  readonly sibling_differentiation: readonly Readonly<{
    sibling_concept_id: string;
    shared_parent_concept_id: string | null;
    differentia: OntologyLocalizedText;
  }>[];
}

export interface OntologyMetricRelation {
  readonly id: string;
  readonly predicate: string;
  readonly status?: string;
  readonly source_id: string;
  readonly target_id: string;
  readonly layout_role?: "primary-backbone" | "secondary-backbone" | "cross-link" | "none";
  readonly layout_parent_id?: string | null;
  readonly layout_child_id?: string | null;
}

export interface OntologyMetricInput {
  readonly planes: ReadonlyArray<Readonly<{ id: string }>>;
  readonly modules: ReadonlyArray<OntologyMetricModule>;
  readonly classes: ReadonlyArray<OntologyMetricConcept>;
  readonly relations: ReadonlyArray<OntologyMetricRelation>;
  readonly case_paths: ReadonlyArray<Readonly<{ id: string }>>;
  readonly individuals?: ReadonlyArray<Readonly<{ id: string }>>;
  readonly data_properties?: ReadonlyArray<Readonly<{ id: string }>>;
  readonly axioms?: ReadonlyArray<Readonly<{ id: string }>>;
}

export interface OntologyMetrics {
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

export function computeOntologyMetrics(canonical: OntologyMetricInput): OntologyMetrics;

export const ontologyReleaseEvidencePaths: readonly string[];

export interface OntologyReleaseEvidenceEntry {
  readonly path: string;
  readonly relativePath: string;
  readonly bytes: Buffer;
}

export interface OntologyReleaseEvidence {
  readonly entries: readonly OntologyReleaseEvidenceEntry[];
  readonly rowsByPath: ReadonlyMap<string, readonly Readonly<Record<string, string>>[]>;
}

export function loadReleaseEvidence(input: Readonly<{
  repositoryRoot: string;
  required?: boolean;
}>): OntologyReleaseEvidence;

export interface OntologySourceModuleEntry {
  readonly path: string;
  readonly relativePath: string;
  readonly bytes: Buffer;
  readonly data: Readonly<{
    module: Readonly<Record<string, unknown> & {
      id: string;
      plane_id: string;
    }>;
    classes: readonly Readonly<Record<string, unknown> & {
      id: string;
      module_id: string;
      status: string;
    }>[];
    relations: readonly Readonly<Record<string, unknown> & {
      id: string;
      status: string;
      source_id: string;
      target_id: string;
    }>[];
  }>;
}

export interface LoadedOntologySources {
  readonly contract: Readonly<Record<string, unknown> & { contract_version: string }>;
  readonly contractFingerprint: string;
  readonly productEntry: Readonly<{
    path: string;
    relativePath: string;
    bytes: Buffer;
    data: Readonly<Record<string, unknown>>;
  }>;
  readonly moduleEntries: readonly OntologySourceModuleEntry[];
  readonly releaseEvidence: OntologyReleaseEvidence;
  readonly semanticBaseline: import("./ontology-v2-semantic-baseline.mjs").FrozenV2SemanticBaseline;
  readonly sourceFingerprint: string;
  readonly generatedFrom: readonly string[];
}

export function loadAndValidateSources(input: Readonly<{
  sourceRoot: string;
  artifactContractPath: string;
  releaseEvidence?: OntologyReleaseEvidence;
  semanticBaseline?: import("./ontology-v2-semantic-baseline.mjs").FrozenV2SemanticBaseline;
}>): LoadedOntologySources;

export function validateConceptLedgerMirrorsSources(input: Readonly<{
  rows: readonly Readonly<Record<string, string>>[];
  modules: readonly Readonly<Record<string, unknown> & {
    id: string;
    plane_id: string;
  }>[];
  classes: readonly Readonly<Record<string, unknown> & {
    id: string;
    module_id: string;
    status: string;
  }>[];
  relations: readonly Readonly<Record<string, unknown> & {
    id: string;
    status: string;
    source_id: string;
    target_id: string;
  }>[];
  baseline?: import("./ontology-v2-semantic-baseline.mjs").FrozenV2SemanticBaseline;
}>): void;

export function validateAcceptedReferenceTargets(
  canonical: Readonly<Record<string, unknown>>,
  ownerByExampleId?: ReadonlyMap<string, Readonly<Record<string, unknown>>> | null,
): void;

export function mergeAndValidateCanonical(
  input: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>>;
