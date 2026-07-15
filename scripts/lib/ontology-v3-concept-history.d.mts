export interface ReviewedConceptHistoryDecision {
  readonly decision:
    | "add"
    | "keep"
    | "move_owner"
    | "retype"
    | "reparent"
    | "deprecate"
    | "convert_to_field"
    | "convert_to_controlled_value"
    | "merge"
    | "split";
  readonly convertToFieldOf?: string;
  readonly convertToAllowedValueOf?: string;
  readonly mergeIntoId?: string;
  readonly splitIntoIds?: readonly string[];
}

export const reviewedDeprecatedConceptHistory: Readonly<
  Record<string, ReviewedConceptHistoryDecision>
>;

export function reviewedConceptHistoryDecision(input: Readonly<{
  concept: Readonly<{
    id: string;
    status: string;
    module_id: string;
    semantic_kind: string;
    primary_parent_relation_id: string | null;
  }>;
  baselineConcept?: Readonly<{
    module_id: string;
    semantic_kind: string;
    primary_parent_relation_id: string | null;
  }>;
}>): ReviewedConceptHistoryDecision;
