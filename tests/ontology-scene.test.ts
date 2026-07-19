import { describe, expect, it } from "vitest";

import { buildOntologyIndex } from "../src/lib/ontology-index";
import {
  createOntologySceneTransition,
  createOntologySceneState,
  hiddenSemanticNeighborRefs,
  projectOntologyScene,
  transitionOntologyScene,
} from "../src/lib/ontology-scene";
import {
  fixtureRefs,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";
import {
  createOntologyGraphControllerState,
  reduceOntologyGraphController,
} from "../src/hooks/useOntologyGraphController";
import { buildVisibleSceneGraph } from "../src/lib/ontology-view-model";

const buildFixtureIndex = () =>
  buildOntologyIndex(
    ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
  );

const buildHighDegreeSemanticIndex = () => {
  const conceptTemplate = ontologyViewModelFixture.classes.find(({ id }) => id === "RunResult")!;
  const relationTemplate = ontologyViewModelFixture.relations.find(
    ({ id }) => id === "AgentRun-produces-RunResult",
  )!;
  const neighborIds = Array.from(
    { length: 15 },
    (_, index) => `SemanticNeighbor${String(index + 1).padStart(2, "0")}`,
  );
  const semanticRelations = neighborIds.map((neighborId) => ({
    ...relationTemplate,
    id: `AgentRun-links-${neighborId}`,
    predicate: "links_to",
    source_id: "AgentRun",
    target_id: neighborId,
  }));

  return buildOntologyIndex({
    ...ontologyViewModelFixture,
    classes: [
      ...ontologyViewModelFixture.classes,
      ...neighborIds.map((id) => ({ ...conceptTemplate, id })),
    ],
    relations: [
      ...ontologyViewModelFixture.relations,
      ...semanticRelations,
      {
        ...relationTemplate,
        id: "AgentRun-links-SemanticNeighbor01-parallel",
        predicate: "links_to",
        source_id: "AgentRun",
        target_id: "SemanticNeighbor01",
      },
    ],
  } as unknown as Parameters<typeof buildOntologyIndex>[0]);
};

const buildHighDegreeHierarchyIndex = (childCount = 14) => {
  const conceptTemplate = ontologyViewModelFixture.classes.find(({ id }) => id === "LeafRun")!;
  const relationTemplate = ontologyViewModelFixture.relations.find(
    ({ id }) => id === "LeafRun-is_a-AgentRun",
  )!;
  const childIds = Array.from(
    { length: childCount },
    (_, index) => `HierarchyChild${String(index + 1).padStart(childCount >= 100 ? 3 : 2, "0")}`,
  );

  return buildOntologyIndex({
    ...ontologyViewModelFixture,
    classes: [
      ...ontologyViewModelFixture.classes,
      ...childIds.map((id) => ({
        ...conceptTemplate,
        id,
        primary_parent_relation_id: `${id}-is_a-AgentRun`,
      })),
    ],
    relations: [
      ...ontologyViewModelFixture.relations,
      ...childIds.map((id) => ({
        ...relationTemplate,
        id: `${id}-is_a-AgentRun`,
        source_id: id,
        target_id: "AgentRun",
      })),
    ],
  } as unknown as Parameters<typeof buildOntologyIndex>[0]);
};

const buildHighDegreeOrganizationalIndex = () => {
  const moduleTemplate = ontologyViewModelFixture.modules[0]!;
  const moduleIds = Array.from(
    { length: 14 },
    (_, index) => `runtime-extra-${String(index + 1).padStart(2, "0")}`,
  );
  return buildOntologyIndex({
    ...ontologyViewModelFixture,
    modules: [
      ...ontologyViewModelFixture.modules,
      ...moduleIds.map((id) => ({ ...moduleTemplate, id })),
    ],
  } as unknown as Parameters<typeof buildOntologyIndex>[0]);
};

describe("ontology visible scene", () => {
  it("counts only accepted predicate-filtered semantic neighbors that remain hidden", () => {
    const relationTemplate = ontologyViewModelFixture.relations.find(
      ({ id }) => id === "AgentRun-produces-RunResult",
    )!;
    const index = buildOntologyIndex({
      ...ontologyViewModelFixture,
      relations: [
        ...ontologyViewModelFixture.relations,
        {
          ...relationTemplate,
          id: "AgentRun-internal_links-Tool",
          predicate: "internal_links",
          target_id: "Tool",
          status: "deprecated",
        },
      ],
    } as unknown as Parameters<typeof buildOntologyIndex>[0]);

    expect(index.semanticOutgoingByRef.get(fixtureRefs.agentRun)?.map(({ predicate }) => predicate))
      .not.toContain("internal_links");
    expect(hiddenSemanticNeighborRefs(
      index,
      fixtureRefs.agentRun,
      new Set([fixtureRefs.agentRun]),
      ["produces"],
    )).toEqual([fixtureRefs.runResult]);
    expect(hiddenSemanticNeighborRefs(
      index,
      fixtureRefs.agentRun,
      new Set([fixtureRefs.agentRun, fixtureRefs.runResult]),
      ["produces"],
    )).toEqual([]);
    expect(hiddenSemanticNeighborRefs(
      index,
      fixtureRefs.agentRun,
      new Set([fixtureRefs.agentRun]),
      ["internal_links"],
    )).toEqual([]);
    const view = buildVisibleSceneGraph(
      index,
      createOntologySceneState(index, { rootRef: fixtureRefs.agentRun }),
    );
    expect(view.hiddenAdjacentRefs).not.toContain(fixtureRefs.tool);
  });

  it("starts from one root expansion and follows hierarchy children without semantic flooding", () => {
    const index = buildFixtureIndex();
    const state = createOntologySceneState(index);
    const projection = projectOntologyScene(index, state);

    expect(projection.nodeRefs).toHaveLength(8);
    expect(projection.nodeRefs).toContain(fixtureRefs.runtimePlane);
    expect(projection.relationIds).toEqual([]);
    expect(projection.derivedEdges).toHaveLength(7);
  });

  it("bounds the initial hierarchy scope and reports a rejected initial expansion", () => {
    const index = buildHighDegreeOrganizationalIndex();
    const state = createOntologySceneState(index, { rootRef: fixtureRefs.runtimePlane });
    const projection = projectOntologyScene(index, state);
    const rejected = createOntologySceneTransition(
      index,
      { rootRef: fixtureRefs.runtimePlane },
      { maxNodes: 1, maxEdges: 220, semanticExpansionLimit: 12 },
    );

    expect(projection.nodeRefs).toHaveLength(13);
    expect(projection.hidden.hierarchyNodes).toBe(4);
    expect(projectOntologyScene(index, rejected.state).nodeRefs).toEqual([
      fixtureRefs.runtimePlane,
    ]);
    expect(rejected.diagnostic).toMatchObject({
      code: "scene-budget-exceeded",
      requestedNodes: 13,
      maxNodes: 1,
    });
  });

  it("replays restored hierarchy scopes through the same hard scene budget", () => {
    const index = buildFixtureIndex();
    const controller = createOntologyGraphControllerState(
      index,
      {
        rootRef: index.rootRef,
        focusedEntityRef: index.rootRef,
        focusedRelationId: null,
        expandedRefs: new Set([fixtureRefs.runtimePlane]),
      },
      { maxNodes: 9, maxEdges: 220, semanticExpansionLimit: 12 },
    );
    const projection = projectOntologyScene(index, controller.sceneState);

    expect(projection.nodeRefs).toHaveLength(8);
    expect(projection.derivedEdges).toHaveLength(7);
    expect(controller.diagnostic).toMatchObject({
      code: "scene-budget-exceeded",
      requestedNodes: 10,
      maxNodes: 9,
    });
    expect(controller.sceneState.revision).toBe(0);
  });

  it("expands semantic neighbors by direction, predicate, and deterministic limit", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const transition = transitionOntologyScene(index, initial, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["produces", "finalizes"],
      limit: 1,
    });
    const projection = projectOntologyScene(index, transition.state);

    expect(transition.diagnostic).toBeNull();
    expect(projection.nodeRefs).toContain(fixtureRefs.runResult);
    expect(projection.relationIds).toHaveLength(2);
    expect(projection.hidden.semanticNodes).toBe(0);
    expect(projection.hidden.semanticEdges).toBe(0);
  });

  it("limits a semantic batch by new unique neighbor nodes rather than parallel relations", () => {
    const index = buildHighDegreeSemanticIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const expanded = transitionOntologyScene(index, initial, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["links_to"],
      limit: 12,
    });
    const projection = projectOntologyScene(index, expanded.state);
    const visibleLinks = projection.relationIds.filter((id) => id.includes("-links-"));

    expect(expanded.diagnostic).toBeNull();
    expect(projection.nodeRefs).toHaveLength(13);
    expect(projection.nodeRefs).toContain("concept:SemanticNeighbor12");
    expect(projection.nodeRefs).not.toContain("concept:SemanticNeighbor13");
    expect(visibleLinks).toHaveLength(13);
    expect(visibleLinks).toContain("AgentRun-links-SemanticNeighbor01");
    expect(visibleLinks).toContain("AgentRun-links-SemanticNeighbor01-parallel");
    expect(projection.hidden).toEqual({
      hierarchyNodes: 0,
      hierarchyEdges: 0,
      semanticNodes: 3,
      semanticEdges: 3,
    });
  });

  it("loads the next unique semantic batch when the same expansion is repeated", () => {
    const index = buildHighDegreeSemanticIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const first = transitionOntologyScene(index, initial, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["links_to"],
      limit: 12,
    }).state;
    const second = transitionOntologyScene(index, first, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["links_to"],
      limit: 12,
    }).state;
    const firstProjection = projectOntologyScene(index, first);
    const secondProjection = projectOntologyScene(index, second);

    expect(firstProjection.hidden).toEqual({
      hierarchyNodes: 0,
      hierarchyEdges: 0,
      semanticNodes: 3,
      semanticEdges: 3,
    });
    expect(second).not.toBe(first);
    expect(secondProjection.nodeRefs).toHaveLength(16);
    expect(secondProjection.relationIds.filter((id) => id.includes("-links-"))).toHaveLength(16);
    expect(secondProjection.hidden).toEqual({
      hierarchyNodes: 0,
      hierarchyEdges: 0,
      semanticNodes: 0,
      semanticEdges: 0,
    });
  });

  it("previews and loads hierarchy children in deterministic batches", () => {
    const index = buildHighDegreeHierarchyIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const first = transitionOntologyScene(index, initial, {
      type: "expand-hierarchy",
      ref: fixtureRefs.agentRun,
      limit: 12,
    }).state;
    const second = transitionOntologyScene(index, first, {
      type: "expand-hierarchy",
      ref: fixtureRefs.agentRun,
      limit: 12,
    }).state;
    const firstProjection = projectOntologyScene(index, first);
    const secondProjection = projectOntologyScene(index, second);

    expect(firstProjection.nodeRefs).toHaveLength(13);
    expect(firstProjection.nodeRefs).toContain("concept:HierarchyChild12");
    expect(firstProjection.nodeRefs).not.toContain("concept:HierarchyChild13");
    expect(firstProjection.hidden).toEqual({
      hierarchyNodes: 3,
      hierarchyEdges: 3,
      semanticNodes: 0,
      semanticEdges: 0,
    });
    expect(secondProjection.nodeRefs).toHaveLength(16);
    expect(secondProjection.hidden).toEqual({
      hierarchyNodes: 0,
      hierarchyEdges: 0,
      semanticNodes: 0,
      semanticEdges: 0,
    });
  });

  it("rejects a hierarchy expansion that would exceed the remaining node budget", () => {
    const index = buildHighDegreeHierarchyIndex(130);
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const first = transitionOntologyScene(index, initial, {
      type: "expand-hierarchy",
      ref: fixtureRefs.agentRun,
      limit: 117,
    }, { maxNodes: 200, maxEdges: 220, semanticExpansionLimit: 117 }).state;
    expect(projectOntologyScene(index, first).nodeRefs).toHaveLength(118);

    const budget = { maxNodes: 120, maxEdges: 220, semanticExpansionLimit: 12 };
    const transition = transitionOntologyScene(index, first, {
      type: "expand-hierarchy",
      ref: fixtureRefs.agentRun,
      limit: 12,
    }, budget);
    const projection = projectOntologyScene(index, transition.state);

    expect(transition.state).toBe(first);
    expect(transition.state.revision).toBe(first.revision);
    expect(transition.diagnostic).toMatchObject({
      code: "scene-budget-exceeded",
      requestedNodes: 130,
      maxNodes: 120,
    });
    expect(projection).toEqual(projectOntologyScene(index, first));
  });

  it("rejects a hierarchy expansion that would exceed the remaining edge budget", () => {
    const index = buildHighDegreeHierarchyIndex();
    const budget = { maxNodes: 120, maxEdges: 13, semanticExpansionLimit: 12 };
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const first = transitionOntologyScene(index, initial, {
      type: "expand-hierarchy",
      ref: fixtureRefs.agentRun,
      limit: 12,
    }, budget).state;
    const transition = transitionOntologyScene(index, first, {
      type: "expand-hierarchy",
      ref: fixtureRefs.agentRun,
      limit: 12,
    }, budget);
    const projection = projectOntologyScene(index, transition.state);

    expect(transition.state).toBe(first);
    expect(transition.state.revision).toBe(first.revision);
    expect(transition.diagnostic).toMatchObject({
      code: "scene-budget-exceeded",
      requestedEdges: 15,
      maxEdges: 13,
    });
    expect(projection).toEqual(projectOntologyScene(index, first));
  });

  it("does not charge an already-visible semantic neighbor against the next-node quota", () => {
    const index = buildHighDegreeSemanticIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const retained = {
      ...initial,
      retainedRefs: new Set([...initial.retainedRefs, "concept:SemanticNeighbor01" as const]),
    };
    const expanded = transitionOntologyScene(index, retained, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["links_to"],
      limit: 1,
    }).state;
    const projection = projectOntologyScene(index, expanded);

    expect(projection.nodeRefs).toContain("concept:SemanticNeighbor01");
    expect(projection.nodeRefs).toContain("concept:SemanticNeighbor02");
    expect(projection.nodeRefs).toHaveLength(3);
    expect(projection.relationIds.filter((id) => id.includes("-links-"))).toHaveLength(3);
    expect(projection.hidden).toEqual({
      hierarchyNodes: 0,
      hierarchyEdges: 0,
      semanticNodes: 13,
      semanticEdges: 13,
    });
  });

  it("keeps incoming and outgoing expansion scopes separate", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const outgoing = transitionOntologyScene(index, initial, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["produces"],
      limit: 12,
    }).state;
    const incoming = transitionOntologyScene(index, outgoing, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "incoming",
      predicates: ["describes"],
      limit: 12,
    }).state;

    expect(projectOntologyScene(index, outgoing).relationIds).toEqual([
      "AgentRun-produces-RunResult",
    ]);
    expect([...projectOntologyScene(index, incoming).relationIds].sort()).toEqual([
      "AgentRun-produces-RunResult",
      "RunResult-describes-AgentRun",
    ]);
  });

  it("filters already-visible semantic edges while retaining hierarchy and focused facts", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const expanded = transitionOntologyScene(index, initial, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["produces", "finalizes"],
      limit: 12,
    }).state;
    const filtered = buildVisibleSceneGraph(index, expanded, {
      focusedEntityRef: fixtureRefs.agentRun,
      focusedRelationId: "AgentRun-finalizes-RunResult",
      visibleRelationPredicates: ["produces"],
    });

    expect(filtered.edges.map(({ id }) => id)).toEqual(expect.arrayContaining([
      "AgentRun-produces-RunResult",
      "AgentRun-finalizes-RunResult",
    ]));
    expect(filtered.edges.filter(({ family }) => family === "semantic")).toHaveLength(2);

    const withoutFocusedException = buildVisibleSceneGraph(index, expanded, {
      focusedEntityRef: fixtureRefs.agentRun,
      visibleRelationPredicates: ["produces"],
    });
    expect(withoutFocusedException.edges.filter(({ family }) => family === "semantic")
      .map(({ predicate }) => predicate)).toEqual(["produces"]);
  });

  it("collects every visible primary and secondary backbone without pulling new nodes", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const state = {
      ...initial,
      retainedRefs: new Set([
        fixtureRefs.runtimeEntity,
        fixtureRefs.executableEntity,
      ]),
    };
    const projection = projectOntologyScene(index, state);

    expect(projection.nodeRefs).toHaveLength(3);
    expect(projection.relationIds).toEqual([
      "AgentRun-is_a-ExecutableEntity",
      "AgentRun-is_a-RuntimeEntity",
    ]);
  });

  it("expands a logical parent separately from hierarchy children", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.leafRun });
    const expanded = transitionOntologyScene(index, initial, {
      type: "expand-hierarchy-parent",
      ref: fixtureRefs.leafRun,
    }).state;
    const projection = projectOntologyScene(index, expanded);

    expect(projection.nodeRefs).toContain(fixtureRefs.agentRun);
    expect(projection.relationIds).toContain("LeafRun-is_a-AgentRun");
  });

  it("never retains a semantic edge whose dismissed endpoint is absent", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const dismissed = {
      ...initial,
      dismissedRefs: new Set([fixtureRefs.runResult]),
    };
    const expanded = transitionOntologyScene(index, dismissed, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["produces"],
    }).state;
    const projection = projectOntologyScene(index, expanded);

    expect(projection.nodeRefs).not.toContain(fixtureRefs.runResult);
    expect(projection.relationIds).not.toContain("AgentRun-produces-RunResult");
  });

  it("dismisses nodes and retains only an explicit selection through immutable actions", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const expanded = transitionOntologyScene(index, initial, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["produces"],
    }).state;
    const dismissed = transitionOntologyScene(index, expanded, {
      type: "dismiss-nodes",
      refs: [fixtureRefs.runResult],
    }).state;
    const selected = transitionOntologyScene(index, expanded, {
      type: "set-selection",
      refs: [fixtureRefs.runResult],
    }).state;
    const retained = transitionOntologyScene(index, selected, {
      type: "retain-selection",
    }).state;

    expect(projectOntologyScene(index, dismissed).nodeRefs).not.toContain(fixtureRefs.runResult);
    expect(projectOntologyScene(index, dismissed).relationIds).not.toContain(
      "AgentRun-produces-RunResult",
    );
    expect(projectOntologyScene(index, retained).nodeRefs).toEqual([fixtureRefs.runResult]);
    expect(retained.rootRef).toBe(fixtureRefs.runResult);
    expect(initial.dismissedRefs.size).toBe(0);
  });

  it("retains multiple disconnected selections as one valid zero-edge scene", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const selected = transitionOntologyScene(index, initial, {
      type: "set-selection",
      refs: [fixtureRefs.runResult, fixtureRefs.tool],
    }).state;
    const retained = transitionOntologyScene(index, selected, {
      type: "retain-selection",
    }).state;
    const projection = projectOntologyScene(index, retained);

    expect(projection.nodeRefs).toEqual([
      fixtureRefs.runResult,
      fixtureRefs.tool,
    ].sort());
    expect(projection.relationIds).toEqual([]);
    expect(projection.derivedEdges).toEqual([]);
  });

  it("rejects a transition that would exceed the 120/220 scene budget without mutating state", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index);
    const transition = transitionOntologyScene(
      index,
      initial,
      { type: "expand-hierarchy", ref: fixtureRefs.runtimePlane },
      { maxNodes: 9, maxEdges: 220, semanticExpansionLimit: 12 },
    );

    expect(transition.state).toBe(initial);
    expect(transition.state.revision).toBe(initial.revision);
    expect(transition.diagnostic).toMatchObject({
      code: "scene-budget-exceeded",
      requestedNodes: 10,
      maxNodes: 9,
    });

    const conceptRoot = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const edgeTransition = transitionOntologyScene(
      index,
      conceptRoot,
      {
        type: "expand-semantic",
        ref: fixtureRefs.agentRun,
        direction: "outgoing",
        predicates: ["produces", "finalizes"],
      },
      { maxNodes: 120, maxEdges: 1, semanticExpansionLimit: 12 },
    );
    expect(edgeTransition.state).toBe(conceptRoot);
    expect(edgeTransition.diagnostic).toMatchObject({
      code: "scene-budget-exceeded",
      requestedEdges: 2,
      maxEdges: 1,
    });
  });

  it("collapses every expansion scope rooted at the selected branch", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index, { rootRef: fixtureRefs.agentRun });
    const semantic = transitionOntologyScene(index, initial, {
      type: "expand-semantic",
      ref: fixtureRefs.agentRun,
      direction: "outgoing",
      predicates: ["produces", "finalizes"],
    }).state;
    const parent = transitionOntologyScene(index, semantic, {
      type: "expand-hierarchy-parent",
      ref: fixtureRefs.agentRun,
    }).state;
    const collapsed = transitionOntologyScene(index, parent, {
      type: "collapse-branch",
      ref: fixtureRefs.agentRun,
    }).state;

    expect(projectOntologyScene(index, parent).nodeRefs.length).toBeGreaterThan(1);
    expect(projectOntologyScene(index, collapsed).nodeRefs).toEqual([fixtureRefs.agentRun]);
    expect(collapsed.expansionsByRef.has(fixtureRefs.agentRun)).toBe(false);
  });

  it("collapses an expanded branch immutably and preserves other scopes", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index);
    const expanded = transitionOntologyScene(index, initial, {
      type: "expand-hierarchy",
      ref: fixtureRefs.runtimePlane,
    }).state;
    const collapsed = transitionOntologyScene(index, expanded, {
      type: "collapse-branch",
      ref: fixtureRefs.runtimePlane,
    }).state;

    expect(expanded).not.toBe(initial);
    expect(collapsed).not.toBe(expanded);
    expect(projectOntologyScene(index, expanded).nodeRefs).toContain(
      fixtureRefs.runLifecycleModule,
    );
    expect(projectOntologyScene(index, collapsed).nodeRefs).not.toContain(
      fixtureRefs.runLifecycleModule,
    );
    expect(projectOntologyScene(index, collapsed).nodeRefs).toContain(
      fixtureRefs.runtimePlane,
    );
  });

  it("switches hierarchy and relations modes without changing the scene topology", () => {
    const index = buildFixtureIndex();
    const initial = createOntologySceneState(index);
    const before = projectOntologyScene(index, initial);
    const changed = transitionOntologyScene(index, initial, {
      type: "set-mode",
      mode: "relations",
    }).state;
    const after = projectOntologyScene(index, changed);

    expect(changed.mode).toBe("relations");
    expect(after.nodeRefs).toEqual(before.nodeRefs);
    expect(after.derivedEdges).toEqual(before.derivedEdges);
  });

  it("restores the detail projection and makes a focused relation visible", () => {
    const index = buildFixtureIndex();
    const initial = createOntologyGraphControllerState(index, {
      rootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
      focusedRelationId: "AgentRun-produces-RunResult",
    });
    const restored = reduceOntologyGraphController(index, initial, {
      type: "restore",
      options: {
        rootRef: fixtureRefs.leafRun,
        focusedEntityRef: fixtureRefs.leafRun,
        focusedRelationId: null,
      },
    });

    expect(projectOntologyScene(index, initial.sceneState).relationIds).toContain(
      "AgentRun-produces-RunResult",
    );
    expect(initial.sceneState.mode).toBe("hierarchy");
    expect(initial.sceneState.direction).toBe("DOWN");
    expect(restored.sceneState.rootRef).toBe(fixtureRefs.leafRun);
    expect(restored.sceneState.mode).toBe("hierarchy");
    expect(restored).not.toBe(initial);
  });
});
