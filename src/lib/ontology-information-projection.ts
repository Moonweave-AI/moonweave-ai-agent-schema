import {
  type IndexedOntologyEntity,
  type OntologyIndex,
} from "./ontology-index";

export interface DerivedOntologyInformation {
  readonly confusedWithEntities: readonly IndexedOntologyEntity[];
}

export const deriveOntologyInformation = (
  _index: OntologyIndex,
  _entity: IndexedOntologyEntity,
): DerivedOntologyInformation => {
  return {
    confusedWithEntities: [],
  };
};
