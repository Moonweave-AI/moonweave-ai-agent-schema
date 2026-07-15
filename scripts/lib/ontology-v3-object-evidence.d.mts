export interface ObjectEvidenceLocalizedText {
  readonly zh: string;
  readonly en: string;
  readonly ja: string;
}

export interface ObjectEvidenceDirectClaim {
  readonly source_id: string;
  readonly supports: string;
  readonly locator: string;
  readonly evidence_kind: string;
  readonly confidence: string;
  readonly review_status: string;
}

export interface ObjectEvidenceReviewer {
  readonly reviewer_id: string;
  readonly reviewer_role: string;
  readonly reviewer_kind: string;
  readonly reviewed_on: string;
  readonly decision_note: ObjectEvidenceLocalizedText;
}

export interface ObjectEvidenceExample {
  readonly id: string;
  readonly kind: string;
  readonly descriptions: ObjectEvidenceLocalizedText;
  readonly field_values: Readonly<Record<string, unknown>>;
  readonly related_node_ids: readonly string[];
  readonly related_relation_ids: readonly string[];
  readonly expected_result: ObjectEvidenceLocalizedText;
  readonly why_valid_or_invalid: ObjectEvidenceLocalizedText;
  readonly source_claims?: readonly ObjectEvidenceDirectClaim[];
}

export interface ObjectEvidenceConcept {
  readonly id: string;
  readonly module_id: string;
  readonly labels: ObjectEvidenceLocalizedText;
  readonly short_definitions: ObjectEvidenceLocalizedText;
  readonly semantic_kind: string;
  readonly primary_parent_relation_id: string | null;
  readonly root_status?: string | null;
  readonly status: string;
  readonly source_claims: readonly ObjectEvidenceDirectClaim[];
  readonly sibling_differentiation?: readonly Readonly<{
    sibling_concept_id: string;
    shared_parent_concept_id: string | null;
    differentia: ObjectEvidenceLocalizedText;
  }>[];
  readonly structure?: Readonly<{
    fields?: readonly Readonly<{
      id: string;
      labels: ObjectEvidenceLocalizedText;
      example_value?: unknown;
    }>[];
  }>;
  readonly examples?: readonly ObjectEvidenceExample[];
  readonly review?: Readonly<{
    review_status: string;
    reviewers: readonly ObjectEvidenceReviewer[];
  }>;
}

export interface ObjectEvidenceRelation {
  readonly id: string;
  readonly module_id: string;
  readonly labels: ObjectEvidenceLocalizedText;
  readonly definitions: ObjectEvidenceLocalizedText;
  readonly predicate: string;
  readonly source_id: string;
  readonly target_id: string;
  readonly relation_kind: string;
  readonly layout_role: string;
  readonly status: string;
  readonly source_claims: readonly ObjectEvidenceDirectClaim[];
  readonly review?: Readonly<{
    review_status: string;
    reviewers: readonly ObjectEvidenceReviewer[];
  }>;
}

export interface ObjectEvidenceModule {
  readonly id: string;
  readonly plane_id: string;
  readonly labels: ObjectEvidenceLocalizedText;
}

export type ObjectEvidenceOperationalNotions =
  | ReadonlyMap<string, string>
  | Readonly<Record<string, string>>;

export interface ObjectEvidenceFallbackMetrics {
  readonly fallback_concept_claim_count: number;
  readonly fallback_relation_claim_count: number;
  readonly copied_module_claim_count: number;
  readonly recursive_fallback_claim_count: number;
  readonly recursive_non_object_specific_claim_count: number;
  readonly nested_copied_direct_support_count: number;
  readonly nested_non_contextual_claim_count: number;
  readonly generic_positive_example_count: number;
  readonly generic_boundary_example_count: number;
  readonly same_reviewer_note_count: number;
}

export interface ObjectEvidenceVolumeMetrics {
  readonly nested_claim_count: number;
  readonly nested_support_bytes: number;
  readonly maximum_nested_support_bytes: number;
  readonly nested_copied_direct_support_count: number;
}

export function objectClaimKey(claim: Readonly<{
  source_id: string;
  locator: string;
}>): string;

export function rewriteConceptDirectClaims<T extends ObjectEvidenceConcept>(
  input: Readonly<{
    concept: T;
    module: ObjectEvidenceModule;
    operationalNotions: ObjectEvidenceOperationalNotions;
    primaryBackboneRelationId?: string | null;
  }>,
): T;

export function rewriteRelationDirectClaims<T extends ObjectEvidenceRelation>(
  input: Readonly<{
    relation: T;
    sourceConcept: ObjectEvidenceConcept;
    targetConcept: ObjectEvidenceConcept;
    module: ObjectEvidenceModule;
    operationalNotions: ObjectEvidenceOperationalNotions;
  }>,
): T;

export function rewriteObjectEvidenceTree<
  T extends ObjectEvidenceConcept | ObjectEvidenceRelation,
>(input: Readonly<{ record: T }>): T;

export function rewriteObjectReview<
  T extends ObjectEvidenceConcept | ObjectEvidenceRelation,
>(input: Readonly<{
  record: T;
  module: ObjectEvidenceModule;
  reviewedOn: string;
  useCase: ObjectEvidenceLocalizedText;
  ontologyInvariants: ObjectEvidenceLocalizedText;
  languageReviewerId?: string | null;
  primaryBackboneRelationId?: string | null;
}>): T;

export function rewriteGenericConceptExamples<T extends ObjectEvidenceConcept>(
  input: Readonly<{
    concept: T;
    relations: readonly ObjectEvidenceRelation[];
    conceptById: ReadonlyMap<string, ObjectEvidenceConcept>;
  }>,
): T;

export function objectEvidenceFallbackMetrics(input: Readonly<{
  classes: readonly ObjectEvidenceConcept[];
  relations: readonly ObjectEvidenceRelation[];
}>): ObjectEvidenceFallbackMetrics;

export function objectEvidenceVolumeMetrics(input: Readonly<{
  classes: readonly ObjectEvidenceConcept[];
  relations: readonly ObjectEvidenceRelation[];
}>): ObjectEvidenceVolumeMetrics;

export function assertObjectEvidenceQuality(input: Readonly<{
  classes: readonly ObjectEvidenceConcept[];
  relations: readonly ObjectEvidenceRelation[];
}>): ObjectEvidenceFallbackMetrics;
