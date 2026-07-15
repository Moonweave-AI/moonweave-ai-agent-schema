export type ReviewedLocalizedText = Readonly<Record<"zh" | "en" | "ja", string>>;

export type ReviewedRelationMerge = Readonly<{
  source_relation_id: string;
  target_relation_id: string;
  rationale: ReviewedLocalizedText;
}>;

export type ReviewedDistinctFactGroup = Readonly<{
  id: string;
  relation_ids: readonly string[];
  distinct_fact_rationale: ReviewedLocalizedText;
}>;

export type ReviewedRelationSpecialDecision = Readonly<{
  id: string;
  source_relation_id: string;
  target_relation_ids: readonly string[];
  action: string;
  target_mapping_id?: string;
  rationale: ReviewedLocalizedText;
}>;

export type RelationDisposition = Readonly<{
  action: string;
  target_relation_id: string;
  target_relation_ids: readonly string[];
  target_mapping_id?: string;
  rationale: ReviewedLocalizedText;
}>;

export type ReviewedRelationLike = Readonly<{
  id: string;
  source_id: string;
  target_id: string;
  source_claims?: readonly Readonly<Record<string, unknown>>[];
  examples?: readonly Readonly<Record<string, unknown>>[];
  distinct_fact_rationale?: ReviewedLocalizedText | null;
  [key: string]: unknown;
}>;

export const REVIEWED_RELATION_MERGES: readonly ReviewedRelationMerge[];
export const REVIEWED_DISTINCT_FACT_GROUPS: readonly ReviewedDistinctFactGroup[];
export const HISTORICAL_REPLAY_DISTINCT_FACT_GROUPS: readonly ReviewedDistinctFactGroup[];
export const REVIEWED_RELATION_SPECIAL_DECISIONS: readonly ReviewedRelationSpecialDecision[];

export function convergeReviewedRelations<T extends ReviewedRelationLike>(input: Readonly<{
  relations: readonly T[];
  legacyRelations?: readonly Readonly<{
    id: string;
    source_ids?: readonly string[];
    [key: string]: unknown;
  }>[];
  sourceRegistryById?: ReadonlyMap<string, Readonly<Record<string, unknown>>> | Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  distinctFactGroups?: readonly ReviewedDistinctFactGroup[];
}>): Readonly<{
  relations: readonly T[];
  dispositionByRelationId: ReadonlyMap<string, RelationDisposition>;
}>;
