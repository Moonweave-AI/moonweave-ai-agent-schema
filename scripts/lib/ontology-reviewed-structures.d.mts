export interface LocalizedText {
  readonly zh: string;
  readonly en: string;
  readonly ja: string;
}

export interface ReviewedSourceClaim {
  readonly source_id: string;
  readonly supports: string;
  readonly locator: string;
  readonly evidence_kind: "design-inference";
  readonly confidence: "medium";
  readonly review_status: "accepted";
}

export interface ReviewedField {
  readonly id: string;
  readonly labels: LocalizedText;
  readonly datatype: string;
  readonly required: boolean;
  readonly cardinality: {
    readonly min: number;
    readonly max: number | null;
  };
  readonly definitions: LocalizedText;
  readonly allowed_values: readonly unknown[];
  readonly pattern: string | null;
  readonly example_value: unknown;
  readonly source_claims: readonly ReviewedSourceClaim[];
}

export interface ReviewedPlainConstraint {
  readonly id: string;
  readonly severity: "error";
  readonly expression_language: "plain";
  readonly expression: string;
  readonly explanations: LocalizedText;
  readonly source_claims: readonly ReviewedSourceClaim[];
}

export interface ReviewedRequiredRelationConstraint {
  readonly id: string;
  readonly direction: "incoming" | "outgoing";
  readonly predicate: string;
  readonly target_concept_id: string;
  readonly cardinality: {
    readonly min: number;
    readonly max: number | null;
  };
  readonly explanations: LocalizedText;
  readonly source_claims: readonly ReviewedSourceClaim[];
}

export interface ReviewedConceptStructure {
  readonly identity_keys: readonly string[];
  readonly fields: readonly ReviewedField[];
  readonly constraints: readonly ReviewedPlainConstraint[];
  readonly required_relation_constraints: readonly ReviewedRequiredRelationConstraint[];
}

export interface ReviewedStructurePatch {
  readonly module_id: string;
  readonly concept_id: string;
  readonly structure: ReviewedConceptStructure;
}

export interface StructuredInstanceExample {
  readonly id: string;
  readonly kind: "instance";
  readonly labels: LocalizedText;
  readonly scenario_id: null;
  readonly descriptions: LocalizedText;
  readonly field_values: Readonly<Record<string, unknown>>;
  readonly related_node_ids: readonly string[];
  readonly related_relation_ids: readonly string[];
  readonly expected_result: LocalizedText;
  readonly why_valid_or_invalid: LocalizedText;
  readonly synthetic: true;
  readonly verified_version: string;
  readonly source_claims: readonly ReviewedSourceClaim[];
}

export interface OntologyConceptLike {
  readonly id: string;
  readonly module_id: string;
  readonly labels: LocalizedText;
  readonly structure?: {
    readonly identity_keys: readonly string[];
    readonly fields: readonly {
      readonly id: string;
      readonly example_value: unknown;
    }[];
    readonly constraints: readonly { readonly id: string }[];
    readonly required_relation_constraints: readonly { readonly id: string }[];
  };
  readonly examples?: readonly Readonly<Record<string, unknown>>[];
}

export type StructuredConcept<T extends OntologyConceptLike> = T & {
  readonly structure: ReviewedConceptStructure;
};

export type ConceptWithStructuredExample<T extends OntologyConceptLike> = T & {
  readonly examples?: readonly (Readonly<Record<string, unknown>> | StructuredInstanceExample)[];
};

export const REVIEWED_STRUCTURE_PATCHES: readonly ReviewedStructurePatch[];
export const REVIEWED_SUBTYPE_DISCRIMINATORS: readonly Readonly<{
  parent_id: string;
  field_id: string;
  children: readonly (readonly [string, string, Readonly<Record<string, unknown>>])[];
}>[];

export function applyReviewedStructurePatches<T extends OntologyConceptLike>(
  concepts: readonly T[],
  patches?: readonly ReviewedStructurePatch[],
): StructuredConcept<T>[];

export function addStructuredInstanceExamples<T extends OntologyConceptLike>(
  concepts: readonly T[],
  relations?: readonly Readonly<Record<string, unknown>>[],
): ConceptWithStructuredExample<T>[];

export function applyReviewedSubtypeDiscriminators<T extends OntologyConceptLike>(input: {
  concepts: readonly T[];
  relations: readonly Readonly<Record<string, unknown>>[];
  specifications?: typeof REVIEWED_SUBTYPE_DISCRIMINATORS;
}): T[];
