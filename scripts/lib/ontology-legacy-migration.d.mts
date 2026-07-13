export type LocalizedText = { zh: string; en: string; ja: string };

export interface ReviewedDecision {
  concept_id?: string;
  decision: string;
  target_concept_id?: string | null;
  target_field_id?: string | null;
  labels?: LocalizedText;
  rationale: LocalizedText;
  definitions?: LocalizedText;
}

export interface LegacyConcept {
  labels: LocalizedText;
  definitions: LocalizedText;
  source_ids: string[];
}

export interface MigratedField {
  id: string;
  labels: LocalizedText;
  definitions: LocalizedText;
  allowed_values: unknown[];
  [key: string]: unknown;
}

export interface MigratedConcept {
  id: string;
  structure: { fields: MigratedField[]; [key: string]: unknown };
  [key: string]: unknown;
}

export function conceptLocalFieldId(fieldId: string): string;

export function populateRequiredConceptExampleFields(args: {
  concepts: MigratedConcept[];
  relations: Array<Record<string, unknown>>;
}): MigratedConcept[];

export function attachConvertedControlledValue(args: {
  concepts: MigratedConcept[];
  decision: ReviewedDecision;
  legacyConcept: LegacyConcept;
  sourceRegistryById: Map<string, Record<string, string>>;
}): MigratedConcept[];

export function reviewedConceptDefinitions(args: {
  decision: Pick<ReviewedDecision, "decision" | "rationale" | "definitions">;
  legacyDefinitions: LocalizedText;
}): LocalizedText;
