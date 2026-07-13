export interface OntologyDecisionValidationInput {
  readonly legacy: {
    readonly modules: readonly { readonly id: string }[];
    readonly classes: readonly { readonly id: string }[];
  };
  readonly bundles: readonly Record<string, unknown>[];
  readonly sourceIds: readonly string[];
}

export interface OntologyDecisionValidationResult {
  readonly bundleCount: number;
  readonly conceptDecisionCount: number;
  readonly retainedConceptCount: number;
  readonly anchorCount: number;
  readonly moduleReviewCount: number;
  readonly semanticRelationCount: number;
}

export function validateOntologyDecisionBundles(
  input: OntologyDecisionValidationInput,
): OntologyDecisionValidationResult;
