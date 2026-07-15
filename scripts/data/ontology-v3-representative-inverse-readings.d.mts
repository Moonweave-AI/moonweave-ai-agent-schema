import type { OntologyV3LocalizedText } from "./ontology-v3-module-boundaries.mjs";
import type { OntologyV3InteractionContractSpecification } from "./ontology-v3-interaction-contracts.mjs";

export interface OntologyV3RepresentativeInverseReading {
  readonly predicate: string;
  readonly labels: OntologyV3LocalizedText;
}

export interface OntologyV3RepresentativeInverseReadingValidation {
  readonly reviewed_inverse_count: number;
}

export const ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS: Readonly<
  Record<string, OntologyV3RepresentativeInverseReading>
>;
export const ontologyV3RepresentativeInverseReadings:
  typeof ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS;
export const ontologyV3RepresentativeInverseReadingValidation:
  OntologyV3RepresentativeInverseReadingValidation;

export function validateOntologyV3RepresentativeInverseReadings(
  readings?: Readonly<Record<string, OntologyV3RepresentativeInverseReading>>,
  interactionContracts?: Readonly<
    Record<string, OntologyV3InteractionContractSpecification>
  > | null,
  relations?: ReadonlyMap<string, unknown> | readonly unknown[] | null,
): OntologyV3RepresentativeInverseReadingValidation;
