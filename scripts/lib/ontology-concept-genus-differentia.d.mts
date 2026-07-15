export type OntologyLanguage = "zh" | "en" | "ja";

export interface ConceptTerminologyViolation {
  readonly conceptId: string;
  readonly language: OntologyLanguage;
  readonly reason:
    | "missing-localized-definition"
    | "display-label-repeated"
    | "missing-real-parent-genus"
    | "missing-semantic-kind-genus"
    | "malformed-definition-syntax"
    | "generic-differentia";
  readonly expectedGenusConceptIds: readonly string[];
}

export interface ConceptDisplayLabelViolation {
  readonly language: OntologyLanguage;
  readonly normalizedLabel: string;
  readonly conceptIds: readonly string[];
}

export const preferredSemanticKindGenus: Readonly<
  Record<string, Readonly<Record<OntologyLanguage, string>>>
>;

export function acceptedConceptDisplayLabelViolations(
  classes: readonly Readonly<Record<string, unknown>>[],
): ConceptDisplayLabelViolation[];

export function preferredConceptGenus(input: Readonly<{
  concept: Readonly<Record<string, unknown>>;
  classes: readonly Readonly<Record<string, unknown>>[];
  relations: readonly Readonly<Record<string, unknown>>[];
}>): Readonly<{
  source: "is_a-parent" | "semantic-kind";
  conceptId: string | null;
  labels: Readonly<Record<OntologyLanguage, string>>;
}> | null;

export function conceptGenusDifferentiaViolations(input: Readonly<{
  classes: readonly Readonly<Record<string, unknown>>[];
  relations: readonly Readonly<Record<string, unknown>>[];
}>): ConceptTerminologyViolation[];
