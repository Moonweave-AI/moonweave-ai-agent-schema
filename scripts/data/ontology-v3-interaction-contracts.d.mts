import type { OntologyV3LocalizedText } from "./ontology-v3-module-boundaries.mjs";

export interface OntologyV3InteractionFacetSpecification {
  readonly applicable: boolean;
  readonly family_concept_ids: readonly string[];
  readonly relation_ids: readonly string[];
  readonly shared_relation_rationales: Readonly<Record<string, OntologyV3LocalizedText>>;
}

export interface OntologyV3InteractionContractSpecification {
  readonly applicability: "operational" | "descriptive" | "mixed";
  readonly representative_relation_id: string;
  readonly responsibility_boundary: OntologyV3LocalizedText | null;
  readonly facets: Readonly<Record<"input" | "output" | "failure" | "recovery", OntologyV3InteractionFacetSpecification>>;
}

export interface OntologyV3InteractionContractValidation {
  readonly module_count: number;
  readonly applicable_facet_count: number;
  readonly referenced_relation_count: number;
  readonly shared_relation_bridge_count: number;
}

export const ONTOLOGY_V3_INTERACTION_CONTRACTS: Readonly<Record<string, OntologyV3InteractionContractSpecification>>;
export const ontologyV3InteractionContracts: typeof ONTOLOGY_V3_INTERACTION_CONTRACTS;
export const ontologyV3InteractionContractValidation: OntologyV3InteractionContractValidation;

export function validateOntologyV3InteractionContracts(
  contracts?: Readonly<Record<string, OntologyV3InteractionContractSpecification>>,
  expectedModuleIds?: readonly string[],
  concepts?: ReadonlyMap<string, unknown> | readonly unknown[] | null,
  relations?: ReadonlyMap<string, unknown> | readonly unknown[] | null,
): OntologyV3InteractionContractValidation;
