import type {
  CanonicalRelation,
  OntologyEntityRef,
  OntologyIndex,
} from "./ontology-index";

const conceptRef = (id: string): OntologyEntityRef => `concept:${id}`;

/**
 * The explorer is the human-review surface for the current YAML tree. A node
 * remains visible while it is under review; only an explicit deprecation
 * removes it from the current graph.
 */
export const isDefaultVisibleOntologyEntity = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
): boolean => index.entitiesByRef.get(ref)?.data.status !== "deprecated";

export const isDefaultVisibleOntologyRelation = (
  index: OntologyIndex,
  relation: CanonicalRelation,
): boolean => relation.status !== "deprecated" &&
  isDefaultVisibleOntologyEntity(index, conceptRef(relation.source_id)) &&
  isDefaultVisibleOntologyEntity(index, conceptRef(relation.target_id));

export const defaultVisibleOntologyChildren = (
  index: OntologyIndex,
  parentRef: OntologyEntityRef,
): readonly OntologyEntityRef[] => Object.freeze(
  (index.organizationalChildrenByRef.get(parentRef) ?? []).filter((childRef) => {
    if (!isDefaultVisibleOntologyEntity(index, childRef)) return false;
    const parent = index.entitiesByRef.get(parentRef);
    const child = index.entitiesByRef.get(childRef);
    if (parent?.kind !== "concept" || child?.kind !== "concept") return true;
    const backbone = index.backboneParentByRef.get(childRef);
    return backbone?.parentRef === parentRef &&
      isDefaultVisibleOntologyRelation(index, backbone.relation);
  }),
);
