import type { OntologyV3LocalizedText } from "./ontology-v3-module-boundaries.mjs";

export interface OntologyV3DirectionalDistinctFactSpecification {
  readonly reverse_relation_id: string;
  readonly rationale: OntologyV3LocalizedText;
}

export interface OntologyV3DirectionalDistinctFactValidation {
  readonly reviewed_pair_count: number;
}

export const ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS: Readonly<
  Record<string, OntologyV3DirectionalDistinctFactSpecification>
>;
export const ontologyV3DirectionalDistinctFacts:
  typeof ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS;
export const ontologyV3DirectionalDistinctFactValidation:
  OntologyV3DirectionalDistinctFactValidation;

export function validateOntologyV3DirectionalDistinctFacts(
  specifications?: Readonly<Record<string, OntologyV3DirectionalDistinctFactSpecification>>,
  relations?: ReadonlyMap<string, unknown> | readonly unknown[] | null,
): OntologyV3DirectionalDistinctFactValidation;
