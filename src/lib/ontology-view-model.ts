import {
  ontologyEntityRef,
  type CanonicalField,
  type CanonicalRelation,
  type EffectiveOntologyField,
  type IndexedOntologyEntity,
  type OntologyEntityRef,
  type OntologyIndex,
} from "./ontology-index";
import {
  projectOntologyScene,
  type OntologyLayoutDirection,
  type OntologySceneMode,
  type OntologySceneState,
} from "./ontology-scene";
import {
  addExpandedNeighborhood,
  canonicalEdge,
  derivedEdge,
  entityDetails,
  hiddenAdjacency,
  initialTopology,
  visibleNode,
  withParallelCounts,
} from "./ontology-view-projection";

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
  readonly layoutParentRef: OntologyEntityRef | null;
  readonly ownershipParentRef: OntologyEntityRef | null;
  readonly semanticPrimaryParentRef: OntologyEntityRef | null;
  readonly logicalDepth: number;
  readonly directChildCount: number;
  readonly hiddenChildCount: number;
  readonly semanticDegree: number;
  readonly isExpanded: boolean;
  readonly isExpandable: boolean;
  readonly isOnFocusPath: boolean;
  readonly isPinned: boolean;
}

export interface VisibleOntologyEdge {
  readonly id: string;
  readonly source: OntologyEntityRef;
  readonly target: OntologyEntityRef;
  readonly predicate: string;
  readonly derived: boolean;
  readonly canonicalRelationId: string | null;
  readonly hierarchyRole: "ownership" | "primary-parent" | "additional-parent" | "child" | null;
  readonly family: "ownership" | "primary-backbone" | "secondary-backbone" | "semantic";
  readonly direction: "source-to-target";
  readonly parallelGroupKey: string;
  readonly parallelCount: number;
  readonly parallelIndex: number;
  readonly labelPriority: number;
  readonly affectsHierarchyLayout: boolean;
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
  readonly sceneHidden?: {
    readonly hierarchyNodes: number;
    readonly hierarchyEdges: number;
    readonly semanticNodes: number;
    readonly semanticEdges: number;
  };
  readonly diagnostics: {
    readonly schemaFieldNodeCount: 0;
    readonly exampleNodeCount: 0;
    readonly sourceClaimNodeCount: 0;
    readonly constraintNodeCount: 0;
    readonly casePathNodeCount: 0;
  };
}

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
    .map((entity) => visibleNode(index, state, entity, nodeRefs));
  const visibleEdges = withParallelCounts([...edges.values()]);
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

/**
 * Scene-driven projection used by the detail explorer. The legacy view-state projection remains
 * available while App routing migrates, so existing root/focus hashes keep resolving.
 */
export const buildVisibleSceneGraph = (
  index: OntologyIndex,
  sceneState: OntologySceneState,
  focus: {
    readonly focusedEntityRef?: OntologyEntityRef;
    readonly focusedRelationId?: string | null;
    readonly visibleRelationPredicates?: readonly string[];
  } = {},
): VisibleOntologyGraph => {
  const projection = projectOntologyScene(index, sceneState);
  const nodeRefs = new Set(projection.nodeRefs);
  const focusedEntityRef = focus.focusedEntityRef ?? sceneState.rootRef;
  const focusedRelationId = focus.focusedRelationId ?? null;
  const compatibilityState: OntologyViewState = {
    graphRootRef: sceneState.rootRef,
    focusedEntityRef,
    focusedRelationId,
    directoryExpandedRefs: new Set(),
    graphExpandedRefs: new Set(sceneState.expansionsByRef.keys()),
  };
  const nodes = projection.nodeRefs
    .map((ref) => index.entitiesByRef.get(ref))
    .filter((entity): entity is IndexedOntologyEntity => entity !== undefined)
    .map((entity) => visibleNode(index, compatibilityState, entity, nodeRefs));
  const focusedRelation = focusedRelationId
    ? index.relationsById.get(focusedRelationId)
    : undefined;
  const relationIds = new Set(projection.relationIds);
  if (focusedRelation) {
    const source = ontologyEntityRef("concept", focusedRelation.source_id);
    const target = ontologyEntityRef("concept", focusedRelation.target_id);
    if (nodeRefs.has(source) && nodeRefs.has(target)) relationIds.add(focusedRelation.id);
  }
  const edges = [
    ...projection.derivedEdges.map((edge) =>
      derivedEdge(edge.id, edge.source, edge.target, edge.predicate)),
    ...[...relationIds]
      .map((id) => index.relationsById.get(id))
      .filter((relation): relation is CanonicalRelation => relation !== undefined)
      .map((relation) => canonicalEdge(relation, index)),
  ];
  const visiblePredicates = new Set(focus.visibleRelationPredicates ?? []);
  const countedEdges = withParallelCounts(edges.filter((edge) =>
    edge.family !== "semantic" || visiblePredicates.size === 0 ||
    visiblePredicates.has(edge.predicate) || edge.id === focusedRelationId));
  const focusedEdge = countedEdges.find(({ id }) => id === focusedRelationId);
  const relationDetailEdge = focusedEdge ?? (
    focusedRelation ? canonicalEdge(focusedRelation, index) : undefined
  );
  const details: EntityDetails | RelationDetails = relationDetailEdge
    ? { kind: "relation", relation: focusedRelation ?? null, edge: relationDetailEdge }
    : entityDetails(index, focusedEntityRef);
  return {
    nodes,
    edges: countedEdges,
    counts: { visibleNodes: nodes.length, visibleEdges: countedEdges.length },
    details,
    hiddenAdjacentRefs: hiddenAdjacency(index, focusedEntityRef, nodeRefs),
    sceneHidden: projection.hidden,
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
const MAX_ONTOLOGY_VIEW_HASH_LENGTH = 8_192;
const MAX_ONTOLOGY_VIEW_PREDICATES = 32;
const MAX_ONTOLOGY_VIEW_ROOT_LENGTH = 512;
const MAX_ONTOLOGY_VIEW_FOCUS_LENGTH = 1_024;

export const serializeOntologyViewHash = (
  state: OntologyViewState,
  graphOptions?: {
    readonly mode: OntologySceneMode;
    readonly direction: OntologyLayoutDirection;
    readonly predicates?: readonly string[];
  },
): string => {
  const focus = state.focusedRelationId
    ? `relation:${encodeURIComponent(state.focusedRelationId)}`
    : `node:${encodeURIComponent(entityId(state.focusedEntityRef))}`;
  const options = graphOptions
    ? `&mode=${graphOptions.mode}&direction=${graphOptions.direction}`
    : "";
  const predicates = graphOptions?.predicates
    ? [...new Set(graphOptions.predicates)]
      .filter((predicate) => /^[A-Za-z][A-Za-z0-9_.:-]{0,119}$/.test(predicate))
      .sort()
      .slice(0, MAX_ONTOLOGY_VIEW_PREDICATES)
      .map((predicate) => `&predicate=${encodeURIComponent(predicate)}`)
      .join("")
    : "";
  return `#root=${encodeURIComponent(state.graphRootRef)}&focus=${focus}${options}${predicates}`;
};

const findEntityRefById = (index: OntologyIndex, id: string): OntologyEntityRef | null => {
  for (const entity of index.entitiesByRef.values()) {
    if (entity.id === id) return entity.ref;
  }
  return null;
};

const conceptRootContainsFocus = (
  index: OntologyIndex,
  rootRef: OntologyEntityRef,
  focusRef: OntologyEntityRef,
): boolean => {
  const pending: OntologyEntityRef[] = [focusRef];
  const visited = new Set<OntologyEntityRef>();
  while (pending.length > 0) {
    const current = pending.shift()!;
    if (current === rootRef) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const organizationalParent = index.organizationalParentByRef.get(current);
    const primaryBackboneParent = index.backboneParentByRef.get(current)?.parentRef;
    for (const parent of new Set([organizationalParent, primaryBackboneParent])) {
      if (parent && !visited.has(parent)) pending.push(parent);
    }
  }
  return false;
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
    return conceptRootContainsFocus(index, rootRef, focusRef);
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
  readonly layoutMode: OntologySceneMode;
  readonly layoutDirection: OntologyLayoutDirection;
  readonly relationPredicates: readonly string[];
  readonly normalizedHash: string;
  readonly repairedRoot: boolean;
  readonly invalidFocus: boolean;
}

export const restoreOntologyViewHash = (
  hash: string,
  index: OntologyIndex,
): RestoredOntologyLocation => {
  const safeHash = hash.length <= MAX_ONTOLOGY_VIEW_HASH_LENGTH ? hash : "";
  const params = new URLSearchParams(safeHash.startsWith("#") ? safeHash.slice(1) : safeHash);
  const layoutMode: OntologySceneMode = params.get("mode") === "relations"
    ? "relations"
    : "hierarchy";
  const layoutDirection: OntologyLayoutDirection = params.get("direction") === "RIGHT"
    ? "RIGHT"
    : "DOWN";
  const relationPredicates = Object.freeze([
    ...new Set(params.getAll("predicate")
      .slice(0, MAX_ONTOLOGY_VIEW_PREDICATES)
      .filter((predicate) => /^[A-Za-z][A-Za-z0-9_.:-]{0,119}$/.test(predicate) &&
        predicate !== "is_a" && index.relationsByPredicate.has(predicate))),
  ].sort());
  const rootValue = params.get("root");
  const requestedRoot = rootValue && rootValue.length <= MAX_ONTOLOGY_VIEW_ROOT_LENGTH
    ? rootValue as OntologyEntityRef
    : null;
  const requestedRootIsValid = Boolean(requestedRoot && index.entitiesByRef.has(requestedRoot));
  let graphRootRef =
    requestedRootIsValid ? requestedRoot! : index.rootRef;
  const requestedFocus = params.get("focus");
  const focusValue = requestedFocus && requestedFocus.length <= MAX_ONTOLOGY_VIEW_FOCUS_LENGTH
    ? requestedFocus
    : `node:${entityId(graphRootRef)}`;
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
    layoutMode,
    layoutDirection,
    relationPredicates,
    normalizedHash: serializeOntologyViewHash(
      state,
      params.has("mode") || params.has("direction") || params.has("predicate")
        ? { mode: layoutMode, direction: layoutDirection, predicates: relationPredicates }
        : undefined,
    ),
    repairedRoot,
    invalidFocus,
  };
};
