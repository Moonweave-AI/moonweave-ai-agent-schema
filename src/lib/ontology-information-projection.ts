import {
  ontologyEntityRef,
  type CanonicalExample,
  type IndexedOntologyEntity,
  type OntologyIndex,
} from "./ontology-index";

export interface DerivedOntologyInformation {
  readonly confusedWithEntities: readonly IndexedOntologyEntity[];
}

const confusedWithEntities = (
  index: OntologyIndex,
  entity: IndexedOntologyEntity,
): readonly IndexedOntologyEntity[] => {
  const examples = (
    entity.data as { readonly examples?: readonly CanonicalExample[] }
  ).examples ?? [];
  const confusedIds = new Set<string>();

  for (const example of examples) {
    if (example.kind !== "boundary") continue;
    const anchorEndpointIds = new Set<string>([entity.id]);
    for (const relationId of example.related_relation_ids ?? []) {
      const relation = index.relationsById.get(relationId);
      if (!relation) continue;
      anchorEndpointIds.add(relation.source_id);
      anchorEndpointIds.add(relation.target_id);
    }
    for (const nodeId of example.related_node_ids ?? []) {
      if (!anchorEndpointIds.has(nodeId) && index.conceptsById.has(nodeId)) {
        confusedIds.add(nodeId);
      }
    }
  }

  return [...confusedIds]
    .sort((left, right) => left.localeCompare(right))
    .flatMap((id) => {
      const confused = index.entitiesByRef.get(ontologyEntityRef("concept", id));
      return confused ? [confused] : [];
    });
};

export const deriveOntologyInformation = (
  index: OntologyIndex,
  entity: IndexedOntologyEntity,
): DerivedOntologyInformation => {
  if (entity.kind === "concept") {
    return {
      confusedWithEntities: confusedWithEntities(index, entity),
    };
  }
  return {
    confusedWithEntities: [],
  };
};
