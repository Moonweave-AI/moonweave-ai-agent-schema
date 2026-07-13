import {
  ontologyEntityRef,
  type CanonicalExample,
  type CanonicalRelation,
  type IndexedOntologyEntity,
  type OntologyIndex,
} from "./ontology-index";

export interface DerivedOntologyInformation {
  readonly confusedWithEntities: readonly IndexedOntologyEntity[];
  readonly typicalInputRelations: readonly CanonicalRelation[];
  readonly typicalOutputRelations: readonly CanonicalRelation[];
}

type InteractionFacet = "input" | "output";

const moduleFacetRelations = (
  index: OntologyIndex,
  module: Readonly<Record<string, unknown>>,
  facet: InteractionFacet,
): readonly CanonicalRelation[] => {
  const competencyQuestions = (
    module as { readonly competency_questions?: readonly unknown[] }
  ).competency_questions ?? [];
  const relationIds = new Set<string>();
  const expression = new RegExp(
    `(?:^|[,(;\\s])${facet}\\s*=\\s*([^,);\\s]+)`,
    "gu",
  );

  for (const candidate of competencyQuestions) {
    if (!candidate || typeof candidate !== "object") continue;
    const question = candidate as Readonly<Record<string, unknown>>;
    if (
      typeof question.id !== "string" ||
      !question.id.endsWith("-cq-interaction-closure") ||
      typeof question.query !== "string"
    ) continue;
    for (const match of question.query.matchAll(expression)) {
      const relationId = match[1];
      if (relationId) relationIds.add(relationId);
    }
  }

  return [...relationIds]
    .sort((left, right) => left.localeCompare(right))
    .flatMap((relationId) => {
      const relation = index.relationsById.get(relationId);
      return relation ? [relation] : [];
    });
};

const conceptFacetRelations = (
  index: OntologyIndex,
  entity: IndexedOntologyEntity,
  facet: InteractionFacet,
): readonly CanonicalRelation[] => {
  const module = index.moduleByConceptId.get(entity.id);
  if (!module) return [];
  return moduleFacetRelations(index, module, facet).filter(
    ({ source_id: sourceId, target_id: targetId }) =>
      sourceId === entity.id || targetId === entity.id,
  );
};

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
      typicalInputRelations: conceptFacetRelations(index, entity, "input"),
      typicalOutputRelations: conceptFacetRelations(index, entity, "output"),
    };
  }
  if (entity.kind === "module") {
    return {
      confusedWithEntities: [],
      typicalInputRelations: moduleFacetRelations(index, entity.data, "input"),
      typicalOutputRelations: moduleFacetRelations(index, entity.data, "output"),
    };
  }
  return {
    confusedWithEntities: [],
    typicalInputRelations: [],
    typicalOutputRelations: [],
  };
};
