import {
  ontologyEntityRef,
  type OntologyEntityRef,
  type OntologyIndex,
} from "./ontology-index";
import {
  defaultVisibleOntologyChildren,
  isDefaultVisibleOntologyEntity,
  isDefaultVisibleOntologyRelation,
} from "./ontology-default-visibility";

export type OntologySceneMode = "hierarchy" | "relations";
export type OntologyLayoutDirection = "DOWN" | "RIGHT";
export type SemanticDirection = "incoming" | "outgoing" | "both";

export type SceneExpansionScope =
  | {
      readonly kind: "hierarchy-children";
      readonly limit?: number;
      readonly loadedChildRefs?: readonly OntologyEntityRef[];
    }
  | { readonly kind: "hierarchy-parent" }
  | {
      readonly kind: "semantic-neighbors";
      readonly direction: SemanticDirection;
      readonly predicates: readonly string[];
      readonly limit: number;
      readonly loadedNeighborRefs?: readonly OntologyEntityRef[];
    };

export interface OntologySceneState {
  readonly rootRef: OntologyEntityRef;
  readonly mode: OntologySceneMode;
  readonly direction: OntologyLayoutDirection;
  readonly expansionsByRef: ReadonlyMap<OntologyEntityRef, readonly SceneExpansionScope[]>;
  readonly dismissedRefs: ReadonlySet<OntologyEntityRef>;
  readonly retainedRefs: ReadonlySet<OntologyEntityRef>;
  readonly selectedRefs: ReadonlySet<OntologyEntityRef>;
  readonly revision: number;
}

export interface SceneBudget {
  readonly maxNodes: number;
  readonly maxEdges: number;
  readonly semanticExpansionLimit: number;
}

export const DEFAULT_SCENE_BUDGET: SceneBudget = Object.freeze({
  maxNodes: 120,
  maxEdges: 220,
  semanticExpansionLimit: 12,
});

export interface SceneDerivedEdge {
  readonly id: string;
  readonly source: OntologyEntityRef;
  readonly target: OntologyEntityRef;
  readonly predicate: "contains_domain" | "contains_module" | "declares_concept";
}

export interface OntologySceneProjection {
  readonly nodeRefs: readonly OntologyEntityRef[];
  readonly relationIds: readonly string[];
  readonly derivedEdges: readonly SceneDerivedEdge[];
  readonly hidden: {
    readonly hierarchyNodes: number;
    readonly hierarchyEdges: number;
    readonly semanticNodes: number;
    readonly semanticEdges: number;
  };
}

export type OntologySceneAction =
  | {
      readonly type: "expand-hierarchy";
      readonly ref: OntologyEntityRef;
      readonly limit?: number;
    }
  | { readonly type: "expand-hierarchy-parent"; readonly ref: OntologyEntityRef }
  | {
      readonly type: "expand-semantic";
      readonly ref: OntologyEntityRef;
      readonly direction: SemanticDirection;
      readonly predicates: readonly string[];
      readonly limit?: number;
    }
  | { readonly type: "collapse-branch"; readonly ref: OntologyEntityRef }
  | { readonly type: "dismiss-nodes"; readonly refs: readonly OntologyEntityRef[] }
  | { readonly type: "set-selection"; readonly refs: readonly OntologyEntityRef[] }
  | { readonly type: "retain-selection" }
  | { readonly type: "set-root"; readonly ref: OntologyEntityRef }
  | { readonly type: "set-mode"; readonly mode: OntologySceneMode }
  | { readonly type: "set-direction"; readonly direction: OntologyLayoutDirection }
  | { readonly type: "reset-scene" };

export interface SceneBudgetDiagnostic {
  readonly code: "scene-budget-exceeded";
  readonly requestedNodes: number;
  readonly requestedEdges: number;
  readonly maxNodes: number;
  readonly maxEdges: number;
}

export interface OntologySceneTransition {
  readonly state: OntologySceneState;
  readonly diagnostic: SceneBudgetDiagnostic | null;
}

const derivedOwnershipEdge = (
  index: OntologyIndex,
  source: OntologyEntityRef,
  target: OntologyEntityRef,
): SceneDerivedEdge => {
  const sourceEntity = index.entitiesByRef.get(source);
  const targetEntity = index.entitiesByRef.get(target);
  const predicate = sourceEntity?.kind === "root"
    ? "contains_domain"
    : sourceEntity?.kind === "plane"
      ? "contains_module"
      : "declares_concept";
  const sourceId = sourceEntity?.id ?? source;
  const targetId = targetEntity?.id ?? target;
  return {
    id: `derived:${predicate.replaceAll("_", "-")}:${sourceId}:${targetId}`,
    source,
    target,
    predicate,
  };
};

const initialOntologySceneCandidate = (
  index: OntologyIndex,
  options: {
    readonly rootRef?: OntologyEntityRef;
    readonly mode?: OntologySceneMode;
    readonly direction?: OntologyLayoutDirection;
  } = {},
  budget: SceneBudget = DEFAULT_SCENE_BUDGET,
): OntologySceneState => {
  const rootRef = options.rootRef && index.entitiesByRef.has(options.rootRef)
    ? options.rootRef
    : index.rootRef;
  const root = index.entitiesByRef.get(rootRef);
  const expansionsByRef = new Map<OntologyEntityRef, readonly SceneExpansionScope[]>(
    root && root.kind !== "concept"
      ? [[rootRef, Object.freeze([{
        kind: "hierarchy-children" as const,
        limit: Math.max(1, budget.semanticExpansionLimit),
      }])]]
      : [],
  );
  return {
    rootRef,
    mode: options.mode ?? "hierarchy",
    direction: options.direction ?? "DOWN",
    expansionsByRef,
    dismissedRefs: new Set(),
    retainedRefs: new Set(),
    selectedRefs: new Set(),
    revision: 0,
  };
};

type OntologySceneCreationOptions = Parameters<typeof initialOntologySceneCandidate>[1];

export const createOntologySceneTransition = (
  index: OntologyIndex,
  options: OntologySceneCreationOptions = {},
  budget: SceneBudget = DEFAULT_SCENE_BUDGET,
): OntologySceneTransition => {
  const candidate = initialOntologySceneCandidate(index, options, budget);
  const diagnostic = ontologySceneBudgetDiagnostic(index, candidate, budget);
  if (!diagnostic) return { state: candidate, diagnostic: null };
  return {
    state: { ...candidate, expansionsByRef: new Map() },
    diagnostic,
  };
};

export const createOntologySceneState = (
  index: OntologyIndex,
  options: OntologySceneCreationOptions = {},
  budget: SceneBudget = DEFAULT_SCENE_BUDGET,
): OntologySceneState => createOntologySceneTransition(index, options, budget).state;

const semanticRelations = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
  scope: Extract<SceneExpansionScope, { readonly kind: "semantic-neighbors" }>,
) => {
  const incoming = scope.direction === "outgoing"
    ? []
    : index.semanticIncomingByRef.get(ref) ?? [];
  const outgoing = scope.direction === "incoming"
    ? []
    : index.semanticOutgoingByRef.get(ref) ?? [];
  const predicateOrder = new Map(scope.predicates.map((predicate, position) => [predicate, position]));
  return [...new Map([...incoming, ...outgoing].map((relation) => [relation.id, relation])).values()]
    .filter((relation) => isDefaultVisibleOntologyRelation(index, relation))
    .filter((relation) => scope.predicates.length === 0 || predicateOrder.has(relation.predicate))
    .sort((left, right) =>
      (predicateOrder.get(left.predicate) ?? Number.MAX_SAFE_INTEGER) -
        (predicateOrder.get(right.predicate) ?? Number.MAX_SAFE_INTEGER) ||
      left.id.localeCompare(right.id),
    );
};

const semanticNeighborRef = (
  ref: OntologyEntityRef,
  relation: { readonly source_id: string; readonly target_id: string },
): OntologyEntityRef => {
  const source = ontologyEntityRef("concept", relation.source_id);
  const target = ontologyEntityRef("concept", relation.target_id);
  return source === ref ? target : source;
};

export const hiddenSemanticNeighborRefs = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
  visibleRefs: ReadonlySet<OntologyEntityRef>,
  predicates: readonly string[],
): readonly OntologyEntityRef[] => {
  const selectedPredicates = new Set(predicates);
  const relations = [
    ...(index.semanticIncomingByRef.get(ref) ?? []),
    ...(index.semanticOutgoingByRef.get(ref) ?? []),
  ].filter(({ predicate, status }) =>
    status === "accepted" &&
    (selectedPredicates.size === 0 || selectedPredicates.has(predicate)))
    .filter((relation) => isDefaultVisibleOntologyRelation(index, relation));
  return Object.freeze([...new Set(relations.map((relation) => semanticNeighborRef(ref, relation)))]
    .filter((neighborRef) => !visibleRefs.has(neighborRef))
    .sort());
};

const normalizedPredicates = (predicates: readonly string[]): readonly string[] =>
  Object.freeze([...new Set(predicates)].sort());

const samePredicates = (
  left: readonly string[],
  right: readonly string[],
): boolean => {
  const normalizedLeft = normalizedPredicates(left);
  const normalizedRight = normalizedPredicates(right);
  return normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((predicate, index) => predicate === normalizedRight[index]);
};

const semanticLoadedNeighborRefs = (
  ref: OntologyEntityRef,
  scope: Extract<SceneExpansionScope, { readonly kind: "semantic-neighbors" }>,
  candidates: ReturnType<typeof semanticRelations>,
): ReadonlySet<OntologyEntityRef> => {
  if (scope.loadedNeighborRefs) return new Set(scope.loadedNeighborRefs);
  const loaded = new Set<OntologyEntityRef>();
  for (const relation of candidates) {
    const neighborRef = semanticNeighborRef(ref, relation);
    if (!loaded.has(neighborRef) && loaded.size >= scope.limit) continue;
    loaded.add(neighborRef);
  }
  return loaded;
};

const hierarchyChildren = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
): readonly OntologyEntityRef[] => Object.freeze([
  ...new Set([
    ...defaultVisibleOntologyChildren(index, ref),
    ...(index.primaryBackboneChildrenByRef.get(ref) ?? [])
      .filter(({ relation, childRef }) =>
        isDefaultVisibleOntologyRelation(index, relation) &&
        isDefaultVisibleOntologyEntity(index, childRef))
      .map(({ childRef }) => childRef),
  ]),
].sort());

const hierarchyParent = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
): OntologyEntityRef | undefined => {
  const backbone = index.backboneParentByRef.get(ref);
  if (
    backbone &&
    isDefaultVisibleOntologyRelation(index, backbone.relation) &&
    isDefaultVisibleOntologyEntity(index, backbone.parentRef)
  ) return backbone.parentRef;
  const organizationalParent = index.organizationalParentByRef.get(ref);
  return organizationalParent &&
    defaultVisibleOntologyChildren(index, organizationalParent).includes(ref)
    ? organizationalParent
    : undefined;
};

const hierarchyLoadedChildRefs = (
  scope: Extract<SceneExpansionScope, { readonly kind: "hierarchy-children" }>,
  candidates: readonly OntologyEntityRef[],
): ReadonlySet<OntologyEntityRef> => {
  if (scope.loadedChildRefs) return new Set(scope.loadedChildRefs);
  const limit = scope.limit ?? DEFAULT_SCENE_BUDGET.semanticExpansionLimit;
  return new Set(candidates.slice(0, limit));
};

const hierarchyEdgeId = (
  index: OntologyIndex,
  parentRef: OntologyEntityRef,
  childRef: OntologyEntityRef,
): string => {
  const backbone = index.backboneParentByRef.get(childRef);
  return backbone?.parentRef === parentRef &&
    isDefaultVisibleOntologyRelation(index, backbone.relation)
    ? backbone.relation.id
    : derivedOwnershipEdge(index, parentRef, childRef).id;
};

const addHierarchyEdge = (
  index: OntologyIndex,
  relationIds: Set<string>,
  derivedEdges: Map<string, SceneDerivedEdge>,
  parentRef: OntologyEntityRef,
  childRef: OntologyEntityRef,
) => {
  const backbone = index.backboneParentByRef.get(childRef);
  if (
    backbone?.parentRef === parentRef &&
    isDefaultVisibleOntologyRelation(index, backbone.relation)
  ) {
    relationIds.add(backbone.relation.id);
    return;
  }
  if (index.entitiesByRef.get(parentRef)?.kind === "concept") return;
  const edge = derivedOwnershipEdge(index, parentRef, childRef);
  derivedEdges.set(edge.id, edge);
};

export const projectOntologyScene = (
  index: OntologyIndex,
  state: OntologySceneState,
): OntologySceneProjection => {
  const nodeRefs = new Set<OntologyEntityRef>([state.rootRef, ...state.retainedRefs]);
  const relationIds = new Set<string>();
  const derivedEdges = new Map<string, SceneDerivedEdge>();
  const hiddenHierarchyEdgeIds = new Set<string>();
  const hiddenHierarchyNodeRefs = new Set<OntologyEntityRef>();
  const hiddenRelationIds = new Set<string>();
  const hiddenNodeRefs = new Set<OntologyEntityRef>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [ref, scopes] of state.expansionsByRef) {
      if (!nodeRefs.has(ref) || state.dismissedRefs.has(ref)) continue;
      for (const scope of scopes) {
        if (scope.kind === "hierarchy-children") {
          const children = hierarchyChildren(index, ref)
            .filter((childRef) => !state.dismissedRefs.has(childRef));
          const loadedChildRefs = hierarchyLoadedChildRefs(scope, children);
          for (const childRef of children) {
            if (loadedChildRefs.has(childRef) || nodeRefs.has(childRef)) {
              if (loadedChildRefs.has(childRef) && !nodeRefs.has(childRef)) {
                nodeRefs.add(childRef);
                changed = true;
              }
              addHierarchyEdge(index, relationIds, derivedEdges, ref, childRef);
              continue;
            }
            hiddenHierarchyNodeRefs.add(childRef);
            hiddenHierarchyEdgeIds.add(hierarchyEdgeId(index, ref, childRef));
          }
          continue;
        }
        if (scope.kind === "hierarchy-parent") {
          const parentRef = hierarchyParent(index, ref);
          if (!parentRef || state.dismissedRefs.has(parentRef)) continue;
          if (!nodeRefs.has(parentRef)) {
            nodeRefs.add(parentRef);
            changed = true;
          }
          addHierarchyEdge(index, relationIds, derivedEdges, parentRef, ref);
          continue;
        }
        const candidates = semanticRelations(index, ref, scope).filter((relation) => {
          const source = ontologyEntityRef("concept", relation.source_id);
          const target = ontologyEntityRef("concept", relation.target_id);
          return !state.dismissedRefs.has(source) && !state.dismissedRefs.has(target);
        });
        const loadedNeighborRefs = semanticLoadedNeighborRefs(ref, scope, candidates);
        for (const relation of candidates) {
          const source = ontologyEntityRef("concept", relation.source_id);
          const target = ontologyEntityRef("concept", relation.target_id);
          const neighborRef = semanticNeighborRef(ref, relation);
          if (loadedNeighborRefs.has(neighborRef) || nodeRefs.has(neighborRef)) {
            relationIds.add(relation.id);
            if (loadedNeighborRefs.has(neighborRef) && !nodeRefs.has(neighborRef)) {
              nodeRefs.add(neighborRef);
              changed = true;
            }
            continue;
          }
          hiddenRelationIds.add(relation.id);
          if (!nodeRefs.has(source)) hiddenNodeRefs.add(source);
          if (!nodeRefs.has(target)) hiddenNodeRefs.add(target);
        }
      }
    }
  }
  for (const dismissed of state.dismissedRefs) nodeRefs.delete(dismissed);
  for (const parentRef of nodeRefs) {
    const visibleBackbone = [
      ...(index.primaryBackboneChildrenByRef.get(parentRef) ?? []),
      ...(index.secondaryBackboneChildrenByRef.get(parentRef) ?? []),
    ];
    for (const backbone of visibleBackbone) {
      if (
        nodeRefs.has(backbone.childRef) &&
        isDefaultVisibleOntologyRelation(index, backbone.relation)
      ) relationIds.add(backbone.relation.id);
    }
  }
  for (const relationId of relationIds) {
    const relation = index.relationsById.get(relationId);
    if (!relation || !isDefaultVisibleOntologyRelation(index, relation)) {
      relationIds.delete(relationId);
      continue;
    }
    const source = ontologyEntityRef("concept", relation.source_id);
    const target = ontologyEntityRef("concept", relation.target_id);
    if (!nodeRefs.has(source) || !nodeRefs.has(target)) relationIds.delete(relationId);
  }
  for (const [edgeId, edge] of derivedEdges) {
    if (!nodeRefs.has(edge.source) || !nodeRefs.has(edge.target)) derivedEdges.delete(edgeId);
  }
  const visibleEdgeIds = new Set([...relationIds, ...derivedEdges.keys()]);
  return {
    nodeRefs: Object.freeze([...nodeRefs].sort()),
    relationIds: Object.freeze([...relationIds].sort()),
    derivedEdges: Object.freeze([...derivedEdges.values()].sort((left, right) => left.id.localeCompare(right.id))),
    hidden: {
      hierarchyNodes: [...hiddenHierarchyNodeRefs].filter((ref) => !nodeRefs.has(ref)).length,
      hierarchyEdges: [...hiddenHierarchyEdgeIds].filter((id) => !visibleEdgeIds.has(id)).length,
      semanticNodes: [...hiddenNodeRefs].filter((ref) => !nodeRefs.has(ref)).length,
      semanticEdges: [...hiddenRelationIds].filter((id) => !relationIds.has(id)).length,
    },
  };
};

export const ontologySceneBudgetDiagnostic = (
  index: OntologyIndex,
  state: OntologySceneState,
  budget: SceneBudget = DEFAULT_SCENE_BUDGET,
): SceneBudgetDiagnostic | null => {
  const projection = projectOntologyScene(index, state);
  const requestedEdges = projection.relationIds.length + projection.derivedEdges.length;
  if (projection.nodeRefs.length <= budget.maxNodes && requestedEdges <= budget.maxEdges) {
    return null;
  }
  return {
    code: "scene-budget-exceeded",
    requestedNodes: projection.nodeRefs.length,
    requestedEdges,
    maxNodes: budget.maxNodes,
    maxEdges: budget.maxEdges,
  };
};

const replaceScopes = (
  state: OntologySceneState,
  ref: OntologyEntityRef,
  transform: (scopes: readonly SceneExpansionScope[]) => readonly SceneExpansionScope[],
): ReadonlyMap<OntologyEntityRef, readonly SceneExpansionScope[]> => {
  const next = new Map(state.expansionsByRef);
  const scopes = Object.freeze([...transform(next.get(ref) ?? [])]);
  if (scopes.length === 0) next.delete(ref);
  else next.set(ref, scopes);
  return next;
};

const withoutBranchScopes = (
  index: OntologyIndex,
  state: OntologySceneState,
  rootRef: OntologyEntityRef,
): ReadonlyMap<OntologyEntityRef, readonly SceneExpansionScope[]> => {
  const branchRefs = new Set<OntologyEntityRef>();
  const pending = [rootRef];
  while (pending.length > 0) {
    const ref = pending.shift()!;
    if (branchRefs.has(ref)) continue;
    branchRefs.add(ref);
    pending.push(...hierarchyChildren(index, ref));
  }
  return new Map([...state.expansionsByRef]
    .filter(([ref]) => !branchRefs.has(ref)));
};

const normalizedExpansionLimit = (
  requestedLimit: number | undefined,
  budget: SceneBudget,
): number => Math.max(
  1,
  Math.min(requestedLimit ?? budget.semanticExpansionLimit, budget.semanticExpansionLimit),
);

const hierarchyExpansionState = (
  index: OntologyIndex,
  state: OntologySceneState,
  ref: OntologyEntityRef,
  newChildLimit: number,
): OntologySceneState => {
  const scopes = state.expansionsByRef.get(ref) ?? [];
  const existingScope = scopes.find(
    (candidate): candidate is Extract<
      SceneExpansionScope,
      { readonly kind: "hierarchy-children" }
    > => candidate.kind === "hierarchy-children",
  );
  const children = hierarchyChildren(index, ref)
    .filter((childRef) => !state.dismissedRefs.has(childRef));
  const currentlyVisible = new Set(projectOntologyScene(index, state).nodeRefs);
  const loadedChildRefs = new Set(
    existingScope ? hierarchyLoadedChildRefs(existingScope, children) : [],
  );
  for (const childRef of children) {
    if (currentlyVisible.has(childRef)) loadedChildRefs.add(childRef);
  }
  const batchChildRefs = children
    .filter((childRef) => !loadedChildRefs.has(childRef))
    .slice(0, newChildLimit);
  const nextLoadedChildRefs = Object.freeze([
    ...loadedChildRefs,
    ...batchChildRefs,
  ].sort());
  const scope: SceneExpansionScope = {
    kind: "hierarchy-children",
    limit: nextLoadedChildRefs.length,
    loadedChildRefs: nextLoadedChildRefs,
  };
  return {
    ...state,
    expansionsByRef: replaceScopes(state, ref, (currentScopes) => [
      ...currentScopes.filter((candidate) => candidate !== existingScope),
      scope,
    ]),
    revision: state.revision + 1,
  };
};

const hierarchyExpansionWithinBudget = (
  index: OntologyIndex,
  state: OntologySceneState,
  action: Extract<OntologySceneAction, { readonly type: "expand-hierarchy" }>,
  budget: SceneBudget,
): OntologySceneState => {
  const currentProjection = projectOntologyScene(index, state);
  const currentEdgeCount = currentProjection.relationIds.length +
    currentProjection.derivedEdges.length;
  const remainingNodes = Math.max(0, budget.maxNodes - currentProjection.nodeRefs.length);
  const remainingEdges = Math.max(0, budget.maxEdges - currentEdgeCount);
  const maximumNewChildren = Math.min(
    normalizedExpansionLimit(action.limit, budget),
    remainingNodes,
    remainingEdges,
  );
  for (let childCount = maximumNewChildren; childCount > 0; childCount -= 1) {
    const candidate = hierarchyExpansionState(index, state, action.ref, childCount);
    if (!ontologySceneBudgetDiagnostic(index, candidate, budget)) return candidate;
  }
  return state;
};

const nextStateForAction = (
  index: OntologyIndex,
  state: OntologySceneState,
  action: OntologySceneAction,
  budget: SceneBudget,
): OntologySceneState => {
  if (action.type === "set-mode") return { ...state, mode: action.mode, revision: state.revision + 1 };
  if (action.type === "set-direction") {
    return { ...state, direction: action.direction, revision: state.revision + 1 };
  }
  if (action.type === "reset-scene") {
    return initialOntologySceneCandidate(index, {
      rootRef: state.rootRef,
      mode: state.mode,
      direction: state.direction,
    }, budget);
  }
  if (action.type === "set-root") {
    return initialOntologySceneCandidate(index, {
      rootRef: action.ref,
      mode: state.mode,
      direction: state.direction,
    }, budget);
  }
  if (action.type === "set-selection") {
    return {
      ...state,
      selectedRefs: new Set(action.refs.filter((ref) => index.entitiesByRef.has(ref))),
      revision: state.revision + 1,
    };
  }
  if (action.type === "dismiss-nodes") {
    return {
      ...state,
      dismissedRefs: new Set([
        ...state.dismissedRefs,
        ...action.refs.filter((ref) => ref !== state.rootRef && index.entitiesByRef.has(ref)),
      ]),
      selectedRefs: new Set([...state.selectedRefs].filter((ref) => !action.refs.includes(ref))),
      revision: state.revision + 1,
    };
  }
  if (action.type === "retain-selection") {
    const selectedRefs = [...state.selectedRefs]
      .filter((ref) => index.entitiesByRef.has(ref))
      .sort();
    if (selectedRefs.length === 0) return state;
    return {
      ...state,
      rootRef: selectedRefs[0],
      expansionsByRef: new Map(),
      dismissedRefs: new Set(),
      retainedRefs: new Set(selectedRefs),
      selectedRefs: new Set(selectedRefs),
      revision: state.revision + 1,
    };
  }
  if (action.type === "collapse-branch") {
    return {
      ...state,
      expansionsByRef: withoutBranchScopes(index, state, action.ref),
      revision: state.revision + 1,
    };
  }
  if (action.type === "expand-hierarchy") {
    return hierarchyExpansionState(
      index,
      state,
      action.ref,
      normalizedExpansionLimit(action.limit, budget),
    );
  }
  if (action.type === "expand-hierarchy-parent") {
    return {
      ...state,
      expansionsByRef: replaceScopes(state, action.ref, (scopes) =>
        scopes.some(({ kind }) => kind === "hierarchy-parent")
          ? scopes
          : [...scopes, { kind: "hierarchy-parent" }]),
      revision: state.revision + 1,
    };
  }
  const limit = Math.max(
    1,
    Math.min(action.limit ?? budget.semanticExpansionLimit, budget.semanticExpansionLimit),
  );
  const predicates = normalizedPredicates(action.predicates);
  const scopes = state.expansionsByRef.get(action.ref) ?? [];
  const existingScope = scopes.find(
    (candidate): candidate is Extract<
      SceneExpansionScope,
      { readonly kind: "semantic-neighbors" }
    > => candidate.kind === "semantic-neighbors" &&
      candidate.direction === action.direction &&
      samePredicates(candidate.predicates, predicates),
  );
  const currentlyVisible = new Set(projectOntologyScene(index, state).nodeRefs);
  const loadedNeighborRefs = new Set(existingScope?.loadedNeighborRefs ?? []);
  if (existingScope && !existingScope.loadedNeighborRefs) {
    const existingCandidates = semanticRelations(index, action.ref, existingScope).filter((relation) => {
      const source = ontologyEntityRef("concept", relation.source_id);
      const target = ontologyEntityRef("concept", relation.target_id);
      return !state.dismissedRefs.has(source) && !state.dismissedRefs.has(target);
    });
    for (const ref of semanticLoadedNeighborRefs(action.ref, existingScope, existingCandidates)) {
      loadedNeighborRefs.add(ref);
    }
  }
  const batchNeighborRefs = new Set<OntologyEntityRef>();
  const candidateScope = {
    kind: "semantic-neighbors" as const,
    direction: action.direction,
    predicates,
    limit,
  };
  for (const relation of semanticRelations(index, action.ref, candidateScope)) {
    const source = ontologyEntityRef("concept", relation.source_id);
    const target = ontologyEntityRef("concept", relation.target_id);
    if (state.dismissedRefs.has(source) || state.dismissedRefs.has(target)) continue;
    const neighborRef = semanticNeighborRef(action.ref, relation);
    if (loadedNeighborRefs.has(neighborRef) || currentlyVisible.has(neighborRef)) continue;
    if (!batchNeighborRefs.has(neighborRef) && batchNeighborRefs.size >= limit) continue;
    batchNeighborRefs.add(neighborRef);
  }
  const nextLoadedNeighborRefs = Object.freeze([
    ...loadedNeighborRefs,
    ...batchNeighborRefs,
  ].sort());
  const scope: SceneExpansionScope = {
    kind: "semantic-neighbors",
    direction: action.direction,
    predicates,
    limit: nextLoadedNeighborRefs.length,
    loadedNeighborRefs: nextLoadedNeighborRefs,
  };
  return {
    ...state,
    expansionsByRef: replaceScopes(state, action.ref, (scopes) => [
      ...scopes.filter((candidate) => candidate !== existingScope),
      scope,
    ]),
    revision: state.revision + 1,
  };
};

export const transitionOntologyScene = (
  index: OntologyIndex,
  state: OntologySceneState,
  action: OntologySceneAction,
  budget: SceneBudget = DEFAULT_SCENE_BUDGET,
): OntologySceneTransition => {
  const candidate = nextStateForAction(index, state, action, budget);
  const diagnostic = ontologySceneBudgetDiagnostic(index, candidate, budget);
  if (diagnostic && action.type === "expand-hierarchy") {
    return {
      state: hierarchyExpansionWithinBudget(index, state, action, budget),
      diagnostic,
    };
  }
  if (diagnostic) return { state, diagnostic };
  return { state: candidate, diagnostic: null };
};
