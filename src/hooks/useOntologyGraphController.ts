import { useCallback, useReducer } from "react";

import {
  createOntologySceneTransition,
  ontologySceneBudgetDiagnostic,
  projectOntologyScene,
  transitionOntologyScene,
  DEFAULT_SCENE_BUDGET,
  type OntologySceneAction,
  type OntologySceneState,
  type OntologySceneTransition,
  type SceneBudget,
  type SceneBudgetDiagnostic,
} from "../lib/ontology-scene";
import {
  ontologyEntityRef,
  type OntologyEntityRef,
  type OntologyIndex,
} from "../lib/ontology-index";

export interface OntologyGraphControllerOptions {
  readonly rootRef: OntologyEntityRef;
  readonly focusedEntityRef: OntologyEntityRef;
  readonly focusedRelationId: string | null;
  readonly expandedRefs?: ReadonlySet<OntologyEntityRef>;
}

export interface OntologyGraphControllerState {
  readonly sceneState: OntologySceneState;
  readonly diagnostic: SceneBudgetDiagnostic | null;
}

export type OntologyGraphControllerAction =
  | { readonly type: "scene"; readonly action: OntologySceneAction }
  | { readonly type: "restore"; readonly options: OntologyGraphControllerOptions };

const restoredHierarchyTransition = (
  index: OntologyIndex,
  initial: OntologySceneTransition,
  expandedRefs: ReadonlySet<OntologyEntityRef> | undefined,
  budget: SceneBudget,
): OntologySceneTransition => {
  if (initial.diagnostic) return initial;
  let current = initial;
  const pending = new Set(
    [...(expandedRefs ?? [])]
      .filter((ref) => ref !== initial.state.rootRef && index.entitiesByRef.has(ref))
      .sort(),
  );
  let progressed = true;
  while (pending.size > 0 && progressed) {
    progressed = false;
    const visible = new Set(projectOntologyScene(index, current.state).nodeRefs);
    for (const ref of [...pending]) {
      if (!visible.has(ref)) continue;
      pending.delete(ref);
      const next = transitionOntologyScene(
        index,
        current.state,
        { type: "expand-hierarchy", ref, limit: budget.semanticExpansionLimit },
        budget,
      );
      if (next.diagnostic) return next;
      current = next;
      progressed = true;
    }
  }
  return current;
};

export const createOntologyGraphControllerState = (
  index: OntologyIndex,
  options: OntologyGraphControllerOptions,
  budget: SceneBudget = DEFAULT_SCENE_BUDGET,
): OntologyGraphControllerState => {
  const initial = createOntologySceneTransition(index, {
    rootRef: options.rootRef,
  }, budget);
  const restored = restoredHierarchyTransition(index, initial, options.expandedRefs, budget);
  let diagnostic = restored.diagnostic;
  let sceneState: OntologySceneState = {
    ...restored.state,
    selectedRefs: new Set([options.focusedEntityRef]),
  };
  const focusedRelation = options.focusedRelationId
    ? index.relationsById.get(options.focusedRelationId)
    : undefined;
  if (focusedRelation) {
    const retainedCandidate = {
      ...sceneState,
      retainedRefs: new Set([
        ...sceneState.retainedRefs,
        ontologyEntityRef("concept", focusedRelation.source_id),
        ontologyEntityRef("concept", focusedRelation.target_id),
      ]),
    };
    const retainedDiagnostic = ontologySceneBudgetDiagnostic(index, retainedCandidate, budget);
    if (retainedDiagnostic) diagnostic ??= retainedDiagnostic;
    else sceneState = retainedCandidate;
    if (!retainedDiagnostic && focusedRelation.predicate !== "is_a") {
      const semantic = transitionOntologyScene(index, sceneState, {
        type: "expand-semantic",
        ref: options.focusedEntityRef,
        direction: "both",
        predicates: [focusedRelation.predicate],
        limit: budget.semanticExpansionLimit,
      }, budget);
      sceneState = semantic.state;
      diagnostic ??= semantic.diagnostic;
    }
  }
  return {
    sceneState,
    diagnostic,
  };
};

export const reduceOntologyGraphController = (
  index: OntologyIndex,
  state: OntologyGraphControllerState,
  action: OntologyGraphControllerAction,
): OntologyGraphControllerState => {
  if (action.type === "restore") {
    return createOntologyGraphControllerState(index, action.options);
  }
  const transition = transitionOntologyScene(index, state.sceneState, action.action);
  return {
    ...state,
    sceneState: transition.state,
    diagnostic: transition.diagnostic,
  };
};

export const semanticPredicatesForRef = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
): readonly string[] => Object.freeze([
  ...new Set([
    ...(index.semanticIncomingByRef.get(ref) ?? []).map(({ predicate }) => predicate),
    ...(index.semanticOutgoingByRef.get(ref) ?? []).map(({ predicate }) => predicate),
  ]),
].sort());

/**
 * Keeps the bounded projection needed by the detail pane. The primary graph is the independent
 * Graphify-style community network and does not consume this scene's layout or display state.
 */
export const useOntologyDetailScene = (
  index: OntologyIndex,
  initialOptions: OntologyGraphControllerOptions,
) => {
  const [state, dispatch] = useReducer(
    (current: OntologyGraphControllerState, action: OntologyGraphControllerAction) =>
      reduceOntologyGraphController(index, current, action),
    initialOptions,
    (options) => createOntologyGraphControllerState(index, options),
  );
  const dispatchScene = useCallback(
    (action: OntologySceneAction) => dispatch({ type: "scene", action }),
    [],
  );
  return {
    ...state,
    restore: useCallback(
      (options: OntologyGraphControllerOptions) => dispatch({ type: "restore", options }),
      [],
    ),
    setSelection: useCallback(
      (refs: readonly OntologyEntityRef[]) => dispatchScene({ type: "set-selection", refs }),
      [dispatchScene],
    ),
    expandAdjacent: useCallback((ref: OntologyEntityRef) => dispatchScene({
      type: "expand-semantic",
      ref,
      direction: "both",
      predicates: semanticPredicatesForRef(index, ref),
      limit: DEFAULT_SCENE_BUDGET.semanticExpansionLimit,
    }), [dispatchScene, index]),
  };
};
