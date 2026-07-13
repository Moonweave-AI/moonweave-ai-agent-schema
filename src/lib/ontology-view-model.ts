import {
  ontologyEntityRef,
  type CanonicalField,
  type CanonicalConcept,
  type CanonicalRelation,
  type EffectiveOntologyField,
  type IndexedOntologyEntity,
  type OntologyEntityRef,
  type OntologyIndex,
} from "./ontology-index";

export interface OntologyViewState {
  readonly graphRootRef: OntologyEntityRef;
  readonly focusedEntityRef: OntologyEntityRef;
  readonly focusedRelationId: string | null;
  readonly directoryExpandedRefs: ReadonlySet<OntologyEntityRef>;
  readonly graphExpandedRefs: ReadonlySet<OntologyEntityRef>;
}

export type OntologyViewAction =
  | { readonly type: "focus-entity"; readonly entityRef: OntologyEntityRef }
  | { readonly type: "focus-relation"; readonly relationId: string }
  | { readonly type: "expand-graph"; readonly entityRef: OntologyEntityRef }
  | { readonly type: "collapse-graph"; readonly entityRef: OntologyEntityRef }
  | { readonly type: "expand-directory"; readonly entityRef: OntologyEntityRef }
  | { readonly type: "collapse-directory"; readonly entityRef: OntologyEntityRef };

export interface VisibleOntologyNode {
  readonly ref: OntologyEntityRef;
  readonly id: string;
  readonly kind: IndexedOntologyEntity["kind"];
  readonly entity: IndexedOntologyEntity;
}

export interface VisibleOntologyEdge {
  readonly id: string;
  readonly source: OntologyEntityRef;
  readonly target: OntologyEntityRef;
  readonly predicate: string;
  readonly derived: boolean;
  readonly canonicalRelationId: string | null;
  readonly hierarchyRole: "ownership" | "primary-parent" | "additional-parent" | "child" | null;
}

export interface CompleteCollection<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly isComplete: true;
}

export interface EntityDetails {
  readonly kind: "entity";
  readonly entity: IndexedOntologyEntity;
  readonly collections: {
    readonly localFields: CompleteCollection<CanonicalField>;
    readonly inheritedFields: CompleteCollection<EffectiveOntologyField>;
    readonly effectiveFields: CompleteCollection<EffectiveOntologyField>;
    readonly constraints: CompleteCollection<unknown>;
    readonly examples: CompleteCollection<unknown>;
    readonly sourceClaims: CompleteCollection<unknown>;
    readonly incomingRelations: CompleteCollection<CanonicalRelation>;
    readonly outgoingRelations: CompleteCollection<CanonicalRelation>;
    readonly externalMappings: CompleteCollection<unknown>;
  };
}

export interface RelationDetails {
  readonly kind: "relation";
  readonly relation: CanonicalRelation | null;
  readonly edge: VisibleOntologyEdge;
}

export interface VisibleOntologyGraph {
  readonly nodes: readonly VisibleOntologyNode[];
  readonly edges: readonly VisibleOntologyEdge[];
  readonly counts: { readonly visibleNodes: number; readonly visibleEdges: number };
  readonly details: EntityDetails | RelationDetails;
  readonly hiddenAdjacentRefs: readonly OntologyEntityRef[];
  readonly diagnostics: {
    readonly schemaFieldNodeCount: 0;
    readonly exampleNodeCount: 0;
    readonly sourceClaimNodeCount: 0;
    readonly constraintNodeCount: 0;
    readonly casePathNodeCount: 0;
  };
}

const complete = <T>(items: readonly T[]): CompleteCollection<T> => ({
  items,
  total: items.length,
  isComplete: true,
});

const conceptIdFromRef = (ref: OntologyEntityRef): string | null =>
  ref.startsWith("concept:") ? ref.slice("concept:".length) : null;

const asArray = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

export const createOntologyViewState = (
  index: OntologyIndex,
  overrides: Partial<OntologyViewState> = {},
): OntologyViewState => {
  const graphRootRef = overrides.graphRootRef ?? index.rootRef;
  return {
    graphRootRef,
    focusedEntityRef: overrides.focusedEntityRef ?? graphRootRef,
    focusedRelationId: overrides.focusedRelationId ?? null,
    directoryExpandedRefs:
      overrides.directoryExpandedRefs ?? new Set<OntologyEntityRef>([index.rootRef]),
    graphExpandedRefs:
      overrides.graphExpandedRefs ?? new Set<OntologyEntityRef>([graphRootRef]),
  };
};

const updatedSet = (
  current: ReadonlySet<OntologyEntityRef>,
  ref: OntologyEntityRef,
  present: boolean,
): ReadonlySet<OntologyEntityRef> => {
  const next = new Set(current);
  if (present) next.add(ref);
  else next.delete(ref);
  return next;
};

export const reduceOntologyViewState = (
  state: OntologyViewState,
  action: OntologyViewAction,
): OntologyViewState => {
  switch (action.type) {
    case "focus-entity":
      return { ...state, focusedEntityRef: action.entityRef, focusedRelationId: null };
    case "focus-relation":
      return { ...state, focusedRelationId: action.relationId };
    case "expand-graph":
      return {
        ...state,
        graphExpandedRefs: updatedSet(state.graphExpandedRefs, action.entityRef, true),
      };
    case "collapse-graph":
      return {
        ...state,
        graphExpandedRefs: updatedSet(state.graphExpandedRefs, action.entityRef, false),
      };
    case "expand-directory":
      return {
        ...state,
        directoryExpandedRefs: updatedSet(state.directoryExpandedRefs, action.entityRef, true),
      };
    case "collapse-directory":
      return {
        ...state,
        directoryExpandedRefs: updatedSet(state.directoryExpandedRefs, action.entityRef, false),
      };
  }
};

const derivedEdge = (
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
});

const canonicalEdge = (
  relation: CanonicalRelation,
  index: OntologyIndex,
): VisibleOntologyEdge => {
  const primary = index.primaryParentRelationByConceptId.get(relation.source_id)?.id === relation.id;
  const hierarchyRole =
    relation.predicate !== "is_a"
      ? null
      : primary
        ? "primary-parent"
        : "additional-parent";
  return {
    id: relation.id,
    source: ontologyEntityRef("concept", relation.source_id),
    target: ontologyEntityRef("concept", relation.target_id),
    predicate: relation.predicate,
    derived: false,
    canonicalRelationId: relation.id,
    hierarchyRole,
  };
};

const addOrganizationalChildren = (
  index: OntologyIndex,
  parentRef: OntologyEntityRef,
  nodeRefs: Set<OntologyEntityRef>,
  edges: Map<string, VisibleOntologyEdge>,
): void => {
  const parent = index.entitiesByRef.get(parentRef);
  if (!parent) return;
  for (const childRef of index.organizationalChildrenByRef.get(parentRef) ?? []) {
    const child = index.entitiesByRef.get(childRef);
    if (!child) continue;
    nodeRefs.add(childRef);
    if (parent.kind === "concept" && child.kind === "concept") {
      const primary = index.primaryParentRelationByConceptId.get(child.id);
      if (primary?.target_id === parent.id) {
        edges.set(primary.id, canonicalEdge(primary, index));
      }
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

const initialTopology = (
  index: OntologyIndex,
  rootRef: OntologyEntityRef,
): { nodeRefs: Set<OntologyEntityRef>; edges: Map<string, VisibleOntologyEdge> } => {
  const nodeRefs = new Set<OntologyEntityRef>([rootRef]);
  const edges = new Map<string, VisibleOntologyEdge>();
  const root = index.entitiesByRef.get(rootRef);
  if (!root) throw new Error(`Unknown graph root ${rootRef}`);

  if (root.kind === "root") {
    addOrganizationalChildren(index, rootRef, nodeRefs, edges);
  } else if (root.kind === "plane") {
    const parentRef = index.organizationalParentByRef.get(rootRef);
    if (parentRef) {
      nodeRefs.add(parentRef);
      const parent = index.entitiesByRef.get(parentRef)!;
      edges.set(
        `derived:contains-domain:${parent.id}:${root.id}`,
        derivedEdge(
          `derived:contains-domain:${parent.id}:${root.id}`,
          parentRef,
          rootRef,
          "contains_domain",
        ),
      );
    }
    addOrganizationalChildren(index, rootRef, nodeRefs, edges);
  } else if (root.kind === "module") {
    const parentRef = index.organizationalParentByRef.get(rootRef);
    if (parentRef) {
      nodeRefs.add(parentRef);
      const parent = index.entitiesByRef.get(parentRef)!;
      edges.set(
        `derived:contains-module:${parent.id}:${root.id}`,
        derivedEdge(
          `derived:contains-module:${parent.id}:${root.id}`,
          parentRef,
          rootRef,
          "contains_module",
        ),
      );
    }
    addOrganizationalChildren(index, rootRef, nodeRefs, edges);
  } else {
    const conceptId = root.id;
    const relations = [
      ...(index.outgoingRelationsByConceptId.get(conceptId) ?? []),
      ...(index.incomingRelationsByConceptId.get(conceptId) ?? []),
    ];
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

const entityDetails = (
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
  const constraints =
    entity.kind === "root"
      ? asArray(data.global_constraints)
      : asArray(data.structure?.constraints);
  const effectiveFields = conceptId
    ? (index.effectiveFieldsByConceptId.get(conceptId) ?? [])
    : [];
  return {
    kind: "entity",
    entity,
    collections: {
      localFields: complete((data.structure?.fields ?? []) as readonly CanonicalField[]),
      inheritedFields: complete(
        effectiveFields.filter(({ inheritanceDepth }) => inheritanceDepth > 0),
      ),
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
    },
  };
};

const addExpandedNeighborhood = (
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
  ];
  for (const relation of relations) {
    nodeRefs.add(ontologyEntityRef("concept", relation.source_id));
    nodeRefs.add(ontologyEntityRef("concept", relation.target_id));
    edges.set(relation.id, canonicalEdge(relation, index));
  }
};

const hiddenAdjacency = (
  index: OntologyIndex,
  focusedRef: OntologyEntityRef,
  visibleRefs: ReadonlySet<OntologyEntityRef>,
): readonly OntologyEntityRef[] => {
  const conceptId = conceptIdFromRef(focusedRef);
  if (!conceptId) {
    return (index.organizationalChildrenByRef.get(focusedRef) ?? []).filter(
      (ref) => !visibleRefs.has(ref),
    );
  }
  const adjacent = new Set<OntologyEntityRef>();
  for (const relation of [
    ...(index.outgoingRelationsByConceptId.get(conceptId) ?? []),
    ...(index.incomingRelationsByConceptId.get(conceptId) ?? []),
  ]) {
    adjacent.add(ontologyEntityRef("concept", relation.source_id));
    adjacent.add(ontologyEntityRef("concept", relation.target_id));
  }
  adjacent.delete(focusedRef);
  return [...adjacent].filter((ref) => !visibleRefs.has(ref));
};

export const buildVisibleConceptGraph = (
  index: OntologyIndex,
  state: OntologyViewState,
): VisibleOntologyGraph => {
  const { nodeRefs, edges } = initialTopology(index, state.graphRootRef);
  for (const expandedRef of state.graphExpandedRefs) {
    if (expandedRef === state.graphRootRef) continue;
    if (!nodeRefs.has(expandedRef)) continue;
    addExpandedNeighborhood(index, expandedRef, nodeRefs, edges);
  }

  const nodes = [...nodeRefs]
    .map((ref) => index.entitiesByRef.get(ref))
    .filter((entity): entity is IndexedOntologyEntity => entity !== undefined)
    .map((entity) => ({ ref: entity.ref, id: entity.id, kind: entity.kind, entity }));
  const visibleEdges = [...edges.values()];
  const focusedRelation = state.focusedRelationId
    ? index.relationsById.get(state.focusedRelationId)
    : undefined;
  const focusedEdge = state.focusedRelationId
    ? visibleEdges.find(({ id }) => id === state.focusedRelationId)
    : undefined;
  const relationEdge = focusedRelation
    ? focusedEdge ?? canonicalEdge(focusedRelation, index)
    : focusedEdge;
  const details: EntityDetails | RelationDetails = relationEdge
    ? { kind: "relation", relation: focusedRelation ?? null, edge: relationEdge }
    : entityDetails(index, state.focusedEntityRef);

  return {
    nodes,
    edges: visibleEdges,
    counts: { visibleNodes: nodes.length, visibleEdges: visibleEdges.length },
    details,
    hiddenAdjacentRefs: hiddenAdjacency(index, state.focusedEntityRef, nodeRefs),
    diagnostics: {
      schemaFieldNodeCount: 0,
      exampleNodeCount: 0,
      sourceClaimNodeCount: 0,
      constraintNodeCount: 0,
      casePathNodeCount: 0,
    },
  };
};

const entityId = (ref: OntologyEntityRef): string => ref.slice(ref.indexOf(":") + 1);

export const serializeOntologyViewHash = (state: OntologyViewState): string => {
  const focus = state.focusedRelationId
    ? `relation:${encodeURIComponent(state.focusedRelationId)}`
    : `node:${encodeURIComponent(entityId(state.focusedEntityRef))}`;
  return `#root=${encodeURIComponent(state.graphRootRef)}&focus=${focus}`;
};

const findEntityRefById = (index: OntologyIndex, id: string): OntologyEntityRef | null => {
  for (const entity of index.entitiesByRef.values()) {
    if (entity.id === id) return entity.ref;
  }
  return null;
};

const rootContainsFocus = (
  index: OntologyIndex,
  rootRef: OntologyEntityRef,
  focusRef: OntologyEntityRef,
): boolean => {
  if (rootRef === index.rootRef || rootRef === focusRef) return true;
  const root = index.entitiesByRef.get(rootRef);
  const focus = index.entitiesByRef.get(focusRef);
  if (!root || !focus) return false;
  if (root.kind === "module" && focus.kind === "concept") {
    return index.moduleByConceptId.get(focus.id)?.id === root.id;
  }
  if (root.kind === "plane") {
    if (focus.kind === "module") return index.planeByModuleId.get(focus.id)?.id === root.id;
    if (focus.kind === "concept") {
      const module = index.moduleByConceptId.get(focus.id);
      return module ? index.planeByModuleId.get(module.id)?.id === root.id : false;
    }
  }
  if (root.kind === "concept" && focus.kind === "concept") {
    const relations = [
      ...(index.incomingRelationsByConceptId.get(root.id) ?? []),
      ...(index.outgoingRelationsByConceptId.get(root.id) ?? []),
    ];
    return relations.some(
      (relation) => relation.source_id === focus.id || relation.target_id === focus.id,
    );
  }
  return false;
};

const primaryContextForFocus = (
  index: OntologyIndex,
  focusRef: OntologyEntityRef,
): OntologyEntityRef => {
  const focus = index.entitiesByRef.get(focusRef);
  if (!focus) return index.rootRef;
  if (focus.kind === "concept") {
    const module = index.moduleByConceptId.get(focus.id);
    return module ? ontologyEntityRef("module", module.id) : index.rootRef;
  }
  if (focus.kind === "module") {
    const plane = index.planeByModuleId.get(focus.id);
    return plane ? ontologyEntityRef("plane", plane.id) : index.rootRef;
  }
  return focus.kind === "plane" ? index.rootRef : focus.ref;
};

interface RestorableDerivedEdge {
  readonly sourceRef: OntologyEntityRef;
  readonly targetRef: OntologyEntityRef;
  readonly preferredRootRef: OntologyEntityRef;
}

const restorableDerivedEdge = (
  index: OntologyIndex,
  relationId: string,
): RestorableDerivedEdge | null => {
  const parts = relationId.split(":");
  if (parts.length < 4 || parts[0] !== "derived") return null;
  const sourceId = parts.at(-2)!;
  const targetId = parts.at(-1)!;
  if (parts[1] === "contains-domain") {
    const sourceRef = ontologyEntityRef("root", sourceId);
    const targetRef = ontologyEntityRef("plane", targetId);
    return index.entitiesByRef.has(sourceRef) && index.entitiesByRef.has(targetRef)
      ? { sourceRef, targetRef, preferredRootRef: sourceRef }
      : null;
  }
  if (parts[1] === "contains-module") {
    const sourceRef = ontologyEntityRef("plane", sourceId);
    const targetRef = ontologyEntityRef("module", targetId);
    return index.entitiesByRef.has(sourceRef) && index.entitiesByRef.has(targetRef)
      ? { sourceRef, targetRef, preferredRootRef: sourceRef }
      : null;
  }
  if (parts[1] === "declares-concept") {
    const sourceRef = ontologyEntityRef("module", sourceId);
    const targetRef = ontologyEntityRef("concept", targetId);
    return index.entitiesByRef.has(sourceRef) &&
      index.entitiesByRef.has(targetRef) &&
      index.organizationalParentByRef.get(targetRef) === sourceRef
      ? { sourceRef, targetRef, preferredRootRef: sourceRef }
      : null;
  }
  return null;
};

const inferredGraphExpansions = (
  index: OntologyIndex,
  rootRef: OntologyEntityRef,
  focusRef: OntologyEntityRef,
): ReadonlySet<OntologyEntityRef> => {
  const expanded = new Set<OntologyEntityRef>([rootRef]);
  if (rootRef.startsWith("concept:")) return expanded;
  const path: OntologyEntityRef[] = [];
  const visited = new Set<OntologyEntityRef>();
  let current: OntologyEntityRef | undefined = focusRef;
  while (current && !visited.has(current)) {
    path.unshift(current);
    visited.add(current);
    current = index.organizationalParentByRef.get(current);
  }
  const rootPosition = path.indexOf(rootRef);
  if (rootPosition < 0) return expanded;
  path.forEach((ref, position) => {
    if (position > rootPosition && position < path.length - 1) expanded.add(ref);
  });
  return expanded;
};

export interface RestoredOntologyLocation {
  readonly state: OntologyViewState;
  readonly normalizedHash: string;
  readonly repairedRoot: boolean;
  readonly invalidFocus: boolean;
}

export const restoreOntologyViewHash = (
  hash: string,
  index: OntologyIndex,
): RestoredOntologyLocation => {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const requestedRoot = params.get("root") as OntologyEntityRef | null;
  const requestedRootIsValid = Boolean(requestedRoot && index.entitiesByRef.has(requestedRoot));
  let graphRootRef =
    requestedRootIsValid ? requestedRoot! : index.rootRef;
  const focusValue = params.get("focus") ?? `node:${entityId(graphRootRef)}`;
  let focusedEntityRef = graphRootRef;
  let focusedRelationId: string | null = null;
  let repairedRoot = Boolean(requestedRoot && !requestedRootIsValid);
  let invalidFocus = false;

  if (focusValue.startsWith("relation:")) {
    const relationId = focusValue.slice("relation:".length);
    const relation = index.relationsById.get(relationId);
    if (relation) {
      focusedRelationId = relationId;
      const sourceRef = ontologyEntityRef("concept", relation.source_id);
      const targetRef = ontologyEntityRef("concept", relation.target_id);
      const containsSource = rootContainsFocus(index, graphRootRef, sourceRef);
      const containsTarget = rootContainsFocus(index, graphRootRef, targetRef);
      focusedEntityRef = containsSource ? sourceRef : containsTarget ? targetRef : sourceRef;
      if (!containsSource && !containsTarget) {
        graphRootRef = sourceRef;
        focusedEntityRef = sourceRef;
        repairedRoot = true;
      }
    } else {
      const derivedEdge = restorableDerivedEdge(index, relationId);
      if (!derivedEdge) {
        focusedRelationId = null;
        invalidFocus = true;
      } else {
        focusedRelationId = relationId;
        focusedEntityRef = derivedEdge.sourceRef;
        if (
          graphRootRef !== derivedEdge.sourceRef &&
          graphRootRef !== derivedEdge.targetRef
        ) {
          graphRootRef = derivedEdge.preferredRootRef;
          repairedRoot = true;
        }
      }
    }
  } else if (focusValue.startsWith("node:")) {
    const focusRef = findEntityRefById(index, focusValue.slice("node:".length));
    if (focusRef) {
      focusedEntityRef = focusRef;
      if (!rootContainsFocus(index, graphRootRef, focusRef)) {
        graphRootRef = primaryContextForFocus(index, focusRef);
        repairedRoot = true;
      }
    } else {
      invalidFocus = true;
    }
  } else {
    invalidFocus = true;
  }

  const graphExpandedRefs = new Set(
    inferredGraphExpansions(index, graphRootRef, focusedEntityRef),
  );
  if (focusedRelationId) graphExpandedRefs.add(focusedEntityRef);
  const state = createOntologyViewState(index, {
    graphRootRef,
    focusedEntityRef,
    focusedRelationId,
    graphExpandedRefs,
  });
  return {
    state,
    normalizedHash: serializeOntologyViewHash(state),
    repairedRoot,
    invalidFocus,
  };
};
