export interface OntologyV3LocalizedText {
  readonly zh: string;
  readonly en: string;
  readonly ja: string;
}

export interface OntologyV3CompetencyQuestion {
  readonly semantic_key: string;
  readonly related_module_ids: readonly string[];
  readonly questions: OntologyV3LocalizedText;
  readonly query: string;
  readonly expected_assertion: string;
}

export interface OntologyV3BoundaryDecision {
  readonly other_module_id: string;
  readonly decision: "owns" | "references" | "moves-to" | "splits-with" | "deprecates";
  readonly owner_module_id: string;
  readonly rationale: OntologyV3LocalizedText;
}

export interface OntologyV3OverlapCheck {
  readonly other_module_id: string;
  readonly semantic_area: OntologyV3LocalizedText;
  readonly overlap_reason: OntologyV3LocalizedText;
  readonly disambiguation_test: OntologyV3LocalizedText;
  readonly result: "distinct";
  readonly owner_module_id: string;
}

export interface OntologyV3ModuleBoundary {
  readonly purpose: OntologyV3LocalizedText;
  readonly includes: readonly OntologyV3LocalizedText[];
  readonly excludes: readonly OntologyV3LocalizedText[];
  readonly owns_when: OntologyV3LocalizedText;
  readonly references_when: OntologyV3LocalizedText;
  readonly competency_questions: readonly OntologyV3CompetencyQuestion[];
  readonly boundary_decisions: readonly OntologyV3BoundaryDecision[];
  readonly overlap_checks: readonly OntologyV3OverlapCheck[];
}

export interface OntologyV3ModuleBoundaryValidation {
  readonly module_count: number;
  readonly competency_question_count: number;
  readonly boundary_decision_count: number;
}

export const EXPECTED_ONTOLOGY_V3_MODULE_IDS: readonly string[];
export const ONTOLOGY_V3_MODULE_BOUNDARIES: Readonly<
  Record<string, OntologyV3ModuleBoundary>
>;
export const ontologyV3ModuleBoundaries: typeof ONTOLOGY_V3_MODULE_BOUNDARIES;
export const expectedOntologyV3ModuleIds: typeof EXPECTED_ONTOLOGY_V3_MODULE_IDS;
export const ontologyV3ModuleBoundaryValidation: OntologyV3ModuleBoundaryValidation;

export function validateOntologyV3ModuleBoundaries(
  boundaries?: Readonly<Record<string, OntologyV3ModuleBoundary>>,
  expectedModuleIds?: readonly string[],
): OntologyV3ModuleBoundaryValidation;
