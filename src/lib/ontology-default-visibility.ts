import type {
  CanonicalRelation,
  OntologyEntityRef,
  OntologyIndex,
} from "./ontology-index";

const conceptRef = (id: string): OntologyEntityRef => `concept:${id}`;

/**
 * Canonical history stays indexed, while the default explorer surface is an
 * accepted-release projection. Explicit detail navigation can still resolve a
 * deprecated entity by ref without placing it back in the primary hierarchy.
 */
export const isDefaultVisibleOntologyEntity = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
): boolean => index.entitiesByRef.get(ref)?.data.status === "accepted";

export const isDefaultVisibleOntologyRelation = (
  index: OntologyIndex,
  relation: CanonicalRelation,
): boolean => relation.status === "accepted" &&
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
