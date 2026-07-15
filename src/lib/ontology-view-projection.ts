import {
  ontologyEntityRef,
  ontologyLogicalDepth,
  type CanonicalConcept,
  type CanonicalField,
  type CanonicalRelation,
  type IndexedOntologyEntity,
  type OntologyEntityRef,
  type OntologyIndex,
} from "./ontology-index";
import {
  defaultVisibleOntologyChildren,
  isDefaultVisibleOntologyRelation,
} from "./ontology-default-visibility";
import type {
  CompleteCollection,
  EntityDetails,
  OntologyViewState,
  VisibleOntologyEdge,
  VisibleOntologyNode,
} from "./ontology-view-model";

const complete = <T>(items: readonly T[]): CompleteCollection<T> => ({
  items,
  total: items.length,
  isComplete: true,
});

const conceptIdFromRef = (ref: OntologyEntityRef): string | null =>
  ref.startsWith("concept:") ? ref.slice("concept:".length) : null;

const asArray = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

export const derivedEdge = (
  id: string,
  source: OntologyEntityRef,
  target: OntologyEntityRef,
  predicate: string,
): VisibleOntologyEdge => ({
  id,
  source,
  target,
  predicate,
  derived: true,
  canonicalRelationId: null,
  hierarchyRole: "ownership",
  family: "ownership",
  direction: "source-to-target",
  parallelGroupKey: `${source}\u0000${target}`,
  parallelCount: 1,
  parallelIndex: 0,
  labelPriority: 0,
  affectsHierarchyLayout: true,
});

export const canonicalEdge = (
  relation: CanonicalRelation,
  index: OntologyIndex,
): VisibleOntologyEdge => {
  const primary = index.primaryParentRelationByConceptId.get(relation.source_id)?.id === relation.id;
  const sourceRef = ontologyEntityRef("concept", relation.source_id);
  const targetRef = ontologyEntityRef("concept", relation.target_id);
  const isPrimaryBackbone = [sourceRef, targetRef].some(
    (ref) => index.backboneParentByRef.get(ref)?.relation.id === relation.id,
  );
  const isSecondaryBackbone = [
    ...(index.secondaryBackboneChildrenByRef.get(sourceRef) ?? []),
    ...(index.secondaryBackboneChildrenByRef.get(targetRef) ?? []),
  ].some(({ relation: candidate }) => candidate.id === relation.id);
  const family = isPrimaryBackbone
    ? "primary-backbone"
    : isSecondaryBackbone
      ? "secondary-backbone"
      : "semantic";
  const hierarchyRole = family === "primary-backbone"
    ? "primary-parent"
    : family === "secondary-backbone"
      ? "additional-parent"
      : relation.predicate === "is_a"
        ? primary
          ? "primary-parent"
          : "additional-parent"
        : null;
  return {
    id: relation.id,
    source: sourceRef,
    target: targetRef,
    predicate: relation.predicate,
    derived: false,
    canonicalRelationId: relation.id,
    hierarchyRole,
    family,
    direction: "source-to-target",
    parallelGroupKey: `${sourceRef}\u0000${targetRef}`,
    parallelCount: 1,
    parallelIndex: 0,
    labelPriority: family === "primary-backbone" ? 1 : family === "secondary-backbone" ? 2 : 3,
    affectsHierarchyLayout: family !== "semantic",
  };
};

export const withParallelCounts = (
  edges: readonly VisibleOntologyEdge[],
): readonly VisibleOntologyEdge[] => {
  const groupCounts = new Map<string, number>();
  const groupIndexes = new Map<string, number>();
  for (const edge of edges) {
    groupCounts.set(edge.parallelGroupKey, (groupCounts.get(edge.parallelGroupKey) ?? 0) + 1);
  }
  return [...edges]
    .sort((left, right) =>
      left.parallelGroupKey.localeCompare(right.parallelGroupKey) || left.id.localeCompare(right.id))
    .map((edge) => {
      const parallelIndex = groupIndexes.get(edge.parallelGroupKey) ?? 0;
      groupIndexes.set(edge.parallelGroupKey, parallelIndex + 1);
      return {
        ...edge,
        parallelCount: groupCounts.get(edge.parallelGroupKey) ?? 1,
        parallelIndex,
      };
    });
};

const addOrganizationalChildren = (
  index: OntologyIndex,
  parentRef: OntologyEntityRef,
  nodeRefs: Set<OntologyEntityRef>,
  edges: Map<string, VisibleOntologyEdge>,
): void => {
  const parent = index.entitiesByRef.get(parentRef);
  if (!parent) return;
  for (const childRef of defaultVisibleOntologyChildren(index, parentRef)) {
    const child = index.entitiesByRef.get(childRef);
    if (!child) continue;
    nodeRefs.add(childRef);
    if (parent.kind === "concept" && child.kind === "concept") {
      const primary = index.primaryParentRelationByConceptId.get(child.id);
      if (primary?.target_id === parent.id) edges.set(primary.id, canonicalEdge(primary, index));
      continue;
    }
    let predicate = "declares_concept";
    let id = `derived:declares-concept:${parent.id}:${child.id}`;
    if (parent.kind === "root") {
      predicate = "contains_domain";
      id = `derived:contains-domain:${parent.id}:${child.id}`;
    } else if (parent.kind === "plane") {
      predicate = "contains_module";
      id = `derived:contains-module:${parent.id}:${child.id}`;
    }
    edges.set(id, derivedEdge(id, parentRef, childRef, predicate));
  }
};

export const initialTopology = (
  index: OntologyIndex,
  rootRef: OntologyEntityRef,
): { nodeRefs: Set<OntologyEntityRef>; edges: Map<string, VisibleOntologyEdge> } => {
  const nodeRefs = new Set<OntologyEntityRef>([rootRef]);
  const edges = new Map<string, VisibleOntologyEdge>();
  const root = index.entitiesByRef.get(rootRef);
  if (!root) throw new Error(`Unknown graph root ${rootRef}`);

  if (root.kind === "root") {
    addOrganizationalChildren(index, rootRef, nodeRefs, edges);
  } else if (root.kind === "plane" || root.kind === "module") {
    const parentRef = index.organizationalParentByRef.get(rootRef);
    if (parentRef) {
      nodeRefs.add(parentRef);
      const parent = index.entitiesByRef.get(parentRef)!;
      const predicate = root.kind === "plane" ? "contains_domain" : "contains_module";
      const edgeKind = root.kind === "plane" ? "contains-domain" : "contains-module";
      const id = `derived:${edgeKind}:${parent.id}:${root.id}`;
      edges.set(id, derivedEdge(id, parentRef, rootRef, predicate));
    }
    addOrganizationalChildren(index, rootRef, nodeRefs, edges);
  } else {
    const conceptId = root.id;
    const relations = [
      ...(index.outgoingRelationsByConceptId.get(conceptId) ?? []),
      ...(index.incomingRelationsByConceptId.get(conceptId) ?? []),
    ].filter((relation) => isDefaultVisibleOntologyRelation(index, relation));
    for (const relation of relations) {
      nodeRefs.add(ontologyEntityRef("concept", relation.source_id));
      nodeRefs.add(ontologyEntityRef("concept", relation.target_id));
      edges.set(relation.id, canonicalEdge(relation, index));
    }
    const hasHierarchyParent = (index.outgoingRelationsByConceptId.get(conceptId) ?? []).some(
      (relation) => relation.predicate === "is_a" && relation.relation_kind === "hierarchy",
    );
    if (!hasHierarchyParent) {
      const module = index.moduleByConceptId.get(conceptId);
      if (module) {
        const moduleRef = ontologyEntityRef("module", module.id);
        nodeRefs.add(moduleRef);
        const id = `derived:declares-concept:${module.id}:${conceptId}`;
        edges.set(id, derivedEdge(id, moduleRef, rootRef, "declares_concept"));
      }
    }
  }
  return { nodeRefs, edges };
};

export const entityDetails = (
  index: OntologyIndex,
  entityRef: OntologyEntityRef,
): EntityDetails => {
  const entity = index.entitiesByRef.get(entityRef) ?? index.entitiesByRef.get(index.rootRef)!;
  const conceptId = conceptIdFromRef(entity.ref);
  const data = entity.data as CanonicalConcept & {
    readonly structure?: { readonly fields?: readonly unknown[]; readonly constraints?: readonly unknown[] };
    readonly examples?: readonly unknown[];
    readonly source_claims?: readonly unknown[];
    readonly global_constraints?: readonly unknown[];
  };
  const constraints = entity.kind === "root"
    ? asArray(data.global_constraints)
    : asArray(data.structure?.constraints);
  const effectiveFields = conceptId ? (index.effectiveFieldsByConceptId.get(conceptId) ?? []) : [];
  return {
    kind: "entity",
    entity,
    collections: {
      localFields: complete((data.structure?.fields ?? []) as readonly CanonicalField[]),
      inheritedFields: complete(effectiveFields.filter(({ inheritanceDepth }) => inheritanceDepth > 0)),
      effectiveFields: complete(effectiveFields),
      constraints: complete(constraints),
      examples: complete(asArray(data.examples)),
      sourceClaims: complete(asArray(data.source_claims)),
      incomingRelations: complete(
        conceptId ? (index.incomingRelationsByConceptId.get(conceptId) ?? []) : [],
      ),
      outgoingRelations: complete(
        conceptId ? (index.outgoingRelationsByConceptId.get(conceptId) ?? []) : [],
      ),
      externalMappings: complete(asArray(data.external_mappings)),
      deprecatedPredecessors: complete(
        conceptId
          ? (index.deprecatedPredecessorsByReplacementConceptId.get(conceptId) ?? [])
          : [],
      ),
    },
  };
};

export const addExpandedNeighborhood = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
  nodeRefs: Set<OntologyEntityRef>,
  edges: Map<string, VisibleOntologyEdge>,
): void => {
  addOrganizationalChildren(index, ref, nodeRefs, edges);
  const conceptId = conceptIdFromRef(ref);
  if (!conceptId) return;
  const relations = [
    ...(index.outgoingRelationsByConceptId.get(conceptId) ?? []),
    ...(index.incomingRelationsByConceptId.get(conceptId) ?? []),
  ].filter((relation) => isDefaultVisibleOntologyRelation(index, relation));
  for (const relation of relations) {
    nodeRefs.add(ontologyEntityRef("concept", relation.source_id));
    nodeRefs.add(ontologyEntityRef("concept", relation.target_id));
    edges.set(relation.id, canonicalEdge(relation, index));
  }
};

export const hiddenAdjacency = (
  index: OntologyIndex,
  focusedRef: OntologyEntityRef,
  visibleRefs: ReadonlySet<OntologyEntityRef>,
): readonly OntologyEntityRef[] => {
  const conceptId = conceptIdFromRef(focusedRef);
  if (!conceptId) {
    return defaultVisibleOntologyChildren(index, focusedRef).filter(
      (ref) => !visibleRefs.has(ref),
    );
  }
  const adjacent = new Set<OntologyEntityRef>();
  for (const relation of [
    ...(index.outgoingRelationsByConceptId.get(conceptId) ?? []),
    ...(index.incomingRelationsByConceptId.get(conceptId) ?? []),
  ]) {
    if (!isDefaultVisibleOntologyRelation(index, relation)) continue;
    adjacent.add(ontologyEntityRef("concept", relation.source_id));
    adjacent.add(ontologyEntityRef("concept", relation.target_id));
  }
  adjacent.delete(focusedRef);
  return [...adjacent].filter((ref) => !visibleRefs.has(ref));
};

export const visibleNode = (
  index: OntologyIndex,
  state: Pick<OntologyViewState, "focusedEntityRef" | "graphExpandedRefs">,
  entity: IndexedOntologyEntity,
  visibleRefs: ReadonlySet<OntologyEntityRef>,
): VisibleOntologyNode => {
  const candidateBackboneParent = index.backboneParentByRef.get(entity.ref);
  const backboneParent = candidateBackboneParent &&
    isDefaultVisibleOntologyRelation(index, candidateBackboneParent.relation)
    ? candidateBackboneParent
    : undefined;
  const candidateOwnershipParent = index.organizationalParentByRef.get(entity.ref);
  const ownershipParent = candidateOwnershipParent &&
    defaultVisibleOntologyChildren(index, candidateOwnershipParent).includes(entity.ref)
    ? candidateOwnershipParent
    : null;
  const candidatePrimaryParent = entity.kind === "concept"
    ? index.primaryParentRelationByConceptId.get(entity.id)
    : undefined;
  const primaryParent = candidatePrimaryParent &&
    isDefaultVisibleOntologyRelation(index, candidatePrimaryParent)
    ? candidatePrimaryParent
    : undefined;
  const directChildCount = defaultVisibleOntologyChildren(index, entity.ref).length;
  const visibleChildren = defaultVisibleOntologyChildren(index, entity.ref)
    .filter((ref) => visibleRefs.has(ref)).length;
  const focusPath = new Set<OntologyEntityRef>();
  let current: OntologyEntityRef | undefined = state.focusedEntityRef;
  while (current && !focusPath.has(current)) {
    focusPath.add(current);
    const parent = index.organizationalParentByRef.get(current);
    current = parent && defaultVisibleOntologyChildren(index, parent).includes(current)
      ? parent
      : undefined;
  }
  return {
    ref: entity.ref,
    id: entity.id,
    kind: entity.kind,
    entity,
    layoutParentRef: backboneParent?.parentRef ?? ownershipParent,
    ownershipParentRef: ownershipParent,
    semanticPrimaryParentRef: primaryParent
      ? ontologyEntityRef("concept", primaryParent.target_id)
      : null,
    logicalDepth: ontologyLogicalDepth(index, entity.ref),
    directChildCount,
    hiddenChildCount: Math.max(0, directChildCount - visibleChildren),
    semanticDegree: index.semanticDegreeByRef.get(entity.ref) ?? 0,
    isExpanded: state.graphExpandedRefs.has(entity.ref),
    isExpandable: directChildCount > 0 || (index.semanticDegreeByRef.get(entity.ref) ?? 0) > 0,
    isOnFocusPath: focusPath.has(entity.ref),
    isPinned: false,
  };
};
