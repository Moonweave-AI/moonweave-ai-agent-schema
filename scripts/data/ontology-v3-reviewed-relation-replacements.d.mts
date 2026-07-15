export interface ReviewedRelationReplacement {
  readonly old_relation_id: string;
  readonly new_relation_id: string;
  readonly affected_concept_ids: readonly string[];
  readonly review_status: "accepted";
}

export const ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS:
  readonly ReviewedRelationReplacement[];

export function reviewedRelationChangesForConcept(conceptId: string): string[];

export function validateReviewedRelationReplacements(): void;
