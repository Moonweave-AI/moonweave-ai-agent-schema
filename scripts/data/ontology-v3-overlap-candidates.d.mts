import type { OntologyV3ModuleBoundary } from "./ontology-v3-module-boundaries.mjs";

export interface OntologyV3OverlapCandidateValidation {
  readonly adjacency_count: number;
  readonly candidate_reference_count: number;
}

export const ONTOLOGY_V3_OVERLAP_CANDIDATES: Readonly<Record<string, readonly string[]>>;
export const ontologyV3OverlapCandidates: typeof ONTOLOGY_V3_OVERLAP_CANDIDATES;
export const ontologyV3OverlapCandidateValidation: OntologyV3OverlapCandidateValidation;

export function validateOntologyV3OverlapCandidates(
  candidates?: Readonly<Record<string, readonly string[]>>,
  boundaries?: Readonly<Record<string, OntologyV3ModuleBoundary>>,
  concepts?: ReadonlyMap<string, unknown> | readonly unknown[] | null,
  keyConceptIds?: ReadonlyMap<string, string> | Readonly<Record<string, string>> | null,
  relations?: ReadonlyMap<string, unknown> | readonly unknown[] | null,
): OntologyV3OverlapCandidateValidation;
