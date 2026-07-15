import { describe, expect, it } from "vitest";

import { buildOntologyIndex } from "../src/lib/ontology-index";
import {
  buildVisibleConceptGraph,
  createOntologyViewState,
  reduceOntologyViewState,
  restoreOntologyViewHash,
  serializeOntologyViewHash,
} from "../src/lib/ontology-view-model";
import {
  fixtureRefs,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";

const buildFixtureIndex = () =>
  buildOntologyIndex(
    ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
  );

const visibleNodeRefs = (
  graph: ReturnType<typeof buildVisibleConceptGraph>,
) => graph.nodes.map(({ ref }) => ref).sort();

const visibleEdgeIds = (
  graph: ReturnType<typeof buildVisibleConceptGraph>,
) => graph.edges.map(({ id }) => id).sort();

describe("canonical ontology visible-graph projection", () => {
  it("keeps the valid graph browsable and reports unresolved references without guessing replacements", () => {
    const malformed = structuredClone(ontologyViewModelFixture) as typeof ontologyViewModelFixture & {
      modules: Array<Record<string, unknown>>;
      classes: Array<Record<string, unknown>>;
      relations: Array<Record<string, unknown>>;
    };
    malformed.modules.push({
      ...structuredClone(malformed.modules[0]),
      id: "orphan-module",
      plane_id: "missing-plane",
    });
    malformed.classes.push({
      ...structuredClone(malformed.classes[0]),
      id: "OrphanConcept",
      module_id: "missing-module",
      primary_parent_relation_id: null,
    });
    malformed.relations.push({
      ...structuredClone(malformed.relations[0]),
      id: "AgentRun-points_to-MissingConcept",
      predicate: "points_to",
      relation_kind: "semantic",
      source_id: "AgentRun",
      target_id: "MissingConcept",
    });

    const index = buildOntologyIndex(
      malformed as unknown as Parameters<typeof buildOntologyIndex>[0],
    );
    const graph = buildVisibleConceptGraph(index, createOntologyViewState(index));

    expect(index.dataDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: "orphan-module", missingId: "missing-plane" }),
        expect.objectContaining({ ownerId: "OrphanConcept", missingId: "missing-module" }),
        expect.objectContaining({
          ownerId: "AgentRun-points_to-MissingConcept",
          missingId: "MissingConcept",
        }),
      ]),
    );
    expect(index.relationsById.has("AgentRun-points_to-MissingConcept")).toBe(false);
    expect(graph.nodes.some(({ ref }) => ref === fixtureRefs.root)).toBe(true);
    expect(graph.nodes.filter(({ kind }) => kind === "plane")).toHaveLength(8);
  });

  it("builds the only root graph as Agent Ontology plus exactly eight domains", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index);
    const graph = buildVisibleConceptGraph(index, state);

    expect(state.graphRootRef).toBe(fixtureRefs.root);
    expect(graph.nodes).toHaveLength(9);
    expect(graph.nodes.filter(({ kind }) => kind === "plane")).toHaveLength(8);
    expect(graph.nodes.filter(({ kind }) => kind === "root")).toHaveLength(1);
    expect(graph.counts).toEqual({ visibleNodes: 9, visibleEdges: 8 });
  });

  it("builds a domain graph from its upper ontology root and all direct modules", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.runtimePlane,
    });
    const graph = buildVisibleConceptGraph(index, state);

    expect(visibleNodeRefs(graph)).toEqual(
      [
        fixtureRefs.root,
        fixtureRefs.runtimePlane,
        "module:run-lifecycle",
        "module:runtime-observability",
      ].sort(),
    );
    expect(graph.edges.filter(({ derived }) => derived)).toHaveLength(3);
  });

  it("builds a module graph from its domain and concepts with no reviewed is_a parent", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.runLifecycleModule,
    });
    const graph = buildVisibleConceptGraph(index, state);
    const moduleRootEdges = graph.edges.filter(
      ({ source, predicate }) =>
        source === fixtureRefs.runLifecycleModule && predicate === "declares_concept",
    );

    expect(visibleNodeRefs(graph)).toEqual(
      [
        fixtureRefs.runtimePlane,
        fixtureRefs.runLifecycleModule,
        fixtureRefs.runtimeEntity,
        fixtureRefs.executableEntity,
        fixtureRefs.runResult,
      ].sort(),
    );
    expect(moduleRootEdges.map(({ target }) => target).sort()).toEqual(
      [fixtureRefs.runtimeEntity, fixtureRefs.executableEntity, fixtureRefs.runResult].sort(),
    );
    expect(moduleRootEdges.every(({ derived }) => derived)).toBe(true);
  });

  it("renders primary and additional parent is_a edges in canonical child-to-parent direction", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
    });
    const graph = buildVisibleConceptGraph(index, state);
    const primary = graph.edges.find(({ id }) => id === "AgentRun-is_a-RuntimeEntity");
    const additional = graph.edges.find(
      ({ id }) => id === "AgentRun-is_a-ExecutableEntity",
    );

    expect(primary).toMatchObject({
      source: fixtureRefs.agentRun,
      target: fixtureRefs.runtimeEntity,
      predicate: "is_a",
      hierarchyRole: "primary-parent",
      derived: false,
    });
    expect(additional).toMatchObject({
      source: fixtureRefs.agentRun,
      target: fixtureRefs.executableEntity,
      predicate: "is_a",
      hierarchyRole: "additional-parent",
      derived: false,
    });
  });

  it("keeps incoming and outgoing semantic directions instead of redrawing every edge from focus", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
    });
    const graph = buildVisibleConceptGraph(index, state);

    expect(graph.edges.find(({ id }) => id === "AgentRun-produces-RunResult")).toMatchObject({
      source: fixtureRefs.agentRun,
      target: fixtureRefs.runResult,
      predicate: "produces",
    });
    expect(graph.edges.find(({ id }) => id === "RunResult-describes-AgentRun")).toMatchObject({
      source: fixtureRefs.runResult,
      target: fixtureRefs.agentRun,
      predicate: "describes",
    });
  });

  it("preserves parallel predicates between the same two concepts by relation id", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
    });
    const graph = buildVisibleConceptGraph(index, state);
    const parallelEdges = graph.edges.filter(
      ({ source, target }) =>
        source === fixtureRefs.agentRun && target === fixtureRefs.runResult,
    );

    expect(parallelEdges.map(({ id }) => id).sort()).toEqual([
      "AgentRun-finalizes-RunResult",
      "AgentRun-produces-RunResult",
    ]);
    expect(parallelEdges.map(({ predicate }) => predicate).sort()).toEqual([
      "finalizes",
      "produces",
    ]);
    expect(parallelEdges.map(({ parallelCount }) => parallelCount)).toEqual([2, 2]);
    expect(parallelEdges.map(({ parallelIndex }) => parallelIndex)).toEqual([0, 1]);
    expect(new Set(parallelEdges.map(({ parallelGroupKey }) => parallelGroupKey)).size).toBe(1);
  });

  it("keeps a semantic leaf visible through its canonical parent edge", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.leafRun,
    });
    const graph = buildVisibleConceptGraph(index, state);

    expect(visibleNodeRefs(graph)).toEqual([fixtureRefs.agentRun, fixtureRefs.leafRun].sort());
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({
      id: "LeafRun-is_a-AgentRun",
      source: fixtureRefs.leafRun,
      target: fixtureRefs.agentRun,
      predicate: "is_a",
      hierarchyRole: "primary-parent",
    });
  });

  it("focuses a graph node without changing graph root or visible topology", () => {
    const index = buildFixtureIndex();
    const initialState = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
    });
    const before = buildVisibleConceptGraph(index, initialState);
    const focusedState = reduceOntologyViewState(initialState, {
      type: "focus-entity",
      entityRef: fixtureRefs.runResult,
    });
    const after = buildVisibleConceptGraph(index, focusedState);

    expect(focusedState.graphRootRef).toBe(fixtureRefs.agentRun);
    expect(focusedState.focusedEntityRef).toBe(fixtureRefs.runResult);
    expect(focusedState.focusedRelationId).toBeNull();
    expect(visibleNodeRefs(after)).toEqual(visibleNodeRefs(before));
    expect(visibleEdgeIds(after)).toEqual(visibleEdgeIds(before));
  });

  it("changes visible topology only after an explicit graph-expand action", () => {
    const index = buildFixtureIndex();
    const initialState = createOntologyViewState(index);
    const before = buildVisibleConceptGraph(index, initialState);
    const focusedState = reduceOntologyViewState(initialState, {
      type: "focus-entity",
      entityRef: fixtureRefs.runtimePlane,
    });
    const afterFocus = buildVisibleConceptGraph(index, focusedState);
    const expandedState = reduceOntologyViewState(focusedState, {
      type: "expand-graph",
      entityRef: fixtureRefs.runtimePlane,
    });
    const afterExpand = buildVisibleConceptGraph(index, expandedState);

    expect(visibleNodeRefs(afterFocus)).toEqual(visibleNodeRefs(before));
    expect(expandedState.graphExpandedRefs).not.toBe(focusedState.graphExpandedRefs);
    expect(expandedState.graphExpandedRefs.has(fixtureRefs.runtimePlane)).toBe(true);
    expect(afterExpand.nodes.length).toBe(before.nodes.length + 2);
    expect(visibleNodeRefs(afterExpand)).toEqual(
      expect.arrayContaining([
        fixtureRefs.runLifecycleModule,
        "module:runtime-observability",
      ]),
    );
  });

  it("focuses an edge in the same graph and switches the same details projection", () => {
    const index = buildFixtureIndex();
    const initialState = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
    });
    const before = buildVisibleConceptGraph(index, initialState);
    const focusedState = reduceOntologyViewState(initialState, {
      type: "focus-relation",
      relationId: "AgentRun-produces-RunResult",
    });
    const after = buildVisibleConceptGraph(index, focusedState);

    expect(focusedState.graphRootRef).toBe(initialState.graphRootRef);
    expect(focusedState.focusedRelationId).toBe("AgentRun-produces-RunResult");
    expect(visibleNodeRefs(after)).toEqual(visibleNodeRefs(before));
    expect(visibleEdgeIds(after)).toEqual(visibleEdgeIds(before));
    expect(after.details).toMatchObject({
      kind: "relation",
      relation: { id: "AgentRun-produces-RunResult" },
    });
  });

  it("never projects schema fields, examples, sources, constraints or cases as graph nodes", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
    });
    const graph = buildVisibleConceptGraph(index, state);

    expect(new Set(graph.nodes.map(({ kind }) => kind))).toEqual(new Set(["concept"]));
    expect(graph.diagnostics).toMatchObject({
      schemaFieldNodeCount: 0,
      exampleNodeCount: 0,
      sourceClaimNodeCount: 0,
      constraintNodeCount: 0,
      casePathNodeCount: 0,
    });
  });

  it("returns every focused detail item with an explicit total and no silent truncation", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
    });
    const graph = buildVisibleConceptGraph(index, state);

    expect(graph.details.kind).toBe("entity");
    if (graph.details.kind !== "entity") {
      throw new Error("Expected entity details for AgentRun");
    }

    expect(graph.details.collections.localFields).toMatchObject({ total: 7, isComplete: true });
    expect(graph.details.collections.localFields.items).toHaveLength(7);
    expect(graph.details.collections.inheritedFields).toMatchObject({ total: 0, isComplete: true });
    expect(graph.details.collections.effectiveFields).toMatchObject({ total: 7, isComplete: true });
    expect(graph.details.collections.constraints).toMatchObject({ total: 6, isComplete: true });
    expect(graph.details.collections.constraints.items).toHaveLength(6);
    expect(graph.details.collections.examples).toMatchObject({ total: 8, isComplete: true });
    expect(graph.details.collections.examples.items).toHaveLength(8);
    expect(graph.details.collections.sourceClaims).toMatchObject({ total: 9, isComplete: true });
    expect(graph.details.collections.sourceClaims.items).toHaveLength(9);
    expect(graph.details.collections.incomingRelations).toMatchObject({
      total: 2,
      isComplete: true,
    });
    expect(graph.details.collections.incomingRelations.items).toHaveLength(2);
    expect(graph.details.collections.outgoingRelations).toMatchObject({
      total: 4,
      isComplete: true,
    });
    expect(graph.details.collections.outgoingRelations.items).toHaveLength(4);
  });
});

describe("ontology view hash contract", () => {
  it("round-trips a concept root whose focus is a multi-level primary-backbone descendant", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.runtimeEntity,
      focusedEntityRef: fixtureRefs.leafRun,
    });
    const hash = serializeOntologyViewHash(state);
    const restored = restoreOntologyViewHash(hash, index);

    expect(hash).toBe("#root=concept%3ARuntimeEntity&focus=node:LeafRun");
    expect(restored.repairedRoot).toBe(false);
    expect(restored.state.graphRootRef).toBe(fixtureRefs.runtimeEntity);
    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.leafRun);
    expect(restored.normalizedHash).toBe(hash);
  });

  it("does not mistake a pure semantic neighbor for a concept-root descendant", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(
      "#root=concept%3AAgentRun&focus=node:RunResult",
      index,
    );

    expect(restored.repairedRoot).toBe(true);
    expect(restored.state.graphRootRef).toBe(fixtureRefs.runLifecycleModule);
    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.runResult);
    expect(restored.normalizedHash).toBe(
      "#root=module%3Arun-lifecycle&focus=node:RunResult",
    );
  });

  it("round-trips and normalizes a node focus with root before focus", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.runLifecycleModule,
      focusedEntityRef: fixtureRefs.agentRun,
    });
    const serialized = serializeOntologyViewHash(state);
    const restored = restoreOntologyViewHash(
      "#focus=node:AgentRun&root=module%3Arun-lifecycle",
      index,
    );

    expect(serialized).toBe("#root=module%3Arun-lifecycle&focus=node:AgentRun");
    expect(restored.state.graphRootRef).toBe(fixtureRefs.runLifecycleModule);
    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.agentRun);
    expect(restored.state.focusedRelationId).toBeNull();
    expect(restored.normalizedHash).toBe(serialized);
    expect(restored.repairedRoot).toBe(false);
  });

  it("round-trips an explicitly controlled graph mode and layout direction", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
    });
    const serialized = serializeOntologyViewHash(state, {
      mode: "relations",
      direction: "RIGHT",
    });
    const restored = restoreOntologyViewHash(serialized, index);

    expect(serialized).toBe(
      "#root=concept%3AAgentRun&focus=node:AgentRun&mode=relations&direction=RIGHT",
    );
    expect(restored.layoutMode).toBe("relations");
    expect(restored.layoutDirection).toBe("RIGHT");
  });

  it("sorts and deduplicates relation predicates in the shareable graph hash", () => {
    const index = buildFixtureIndex();
    const knownPredicates = [...index.relationsByPredicate.keys()]
      .filter((predicate) => predicate !== "is_a")
      .sort()
      .slice(0, 2);
    expect(knownPredicates).toHaveLength(2);
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
    });
    const serialized = serializeOntologyViewHash(state, {
      mode: "relations",
      direction: "DOWN",
      predicates: [knownPredicates[1]!, knownPredicates[0]!, knownPredicates[1]!],
    });
    const restored = restoreOntologyViewHash(serialized, index);

    expect(new URLSearchParams(serialized.slice(1)).getAll("predicate"))
      .toEqual(knownPredicates);
    expect(restored.relationPredicates).toEqual(knownPredicates);
    expect(restored.normalizedHash).toBe(serialized);
  });

  it("filters unknown predicates and bounds predicate serialization", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
    });
    const serialized = serializeOntologyViewHash(state, {
      mode: "relations",
      direction: "DOWN",
      predicates: Array.from({ length: 100 }, (_, position) => `valid_name_${position}`),
    });
    expect(new URLSearchParams(serialized.slice(1)).getAll("predicate")).toHaveLength(32);

    const restored = restoreOntologyViewHash(
      "#root=concept%3AAgentRun&focus=node:AgentRun&predicate=unknown_predicate" +
      "&predicate=produces",
      index,
    );
    expect(restored.relationPredicates).toEqual(["produces"]);
    expect(restored.normalizedHash).not.toContain("unknown_predicate");
  });

  it("fails closed without parsing an oversized hash fragment", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(`#${"x".repeat(100_000)}`, index);

    expect(restored.state.graphRootRef).toBe(fixtureRefs.root);
    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.root);
    expect(restored.normalizedHash.length).toBeLessThanOrEqual(8_192);
  });

  it("fails closed to hierarchy/DOWN for unknown graph hash options", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(
      "#root=concept%3AAgentRun&focus=node:AgentRun&mode=radial&direction=SIDEWAYS",
      index,
    );

    expect(restored.layoutMode).toBe("hierarchy");
    expect(restored.layoutDirection).toBe("DOWN");
  });

  it("infers the primary expansion path so a deep focus stays visible after refresh", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(
      "#root=root%3Aagent-system-ontology&focus=node:LeafRun",
      index,
    );
    const graph = buildVisibleConceptGraph(index, restored.state);

    expect(restored.state.graphExpandedRefs).toEqual(
      new Set([
        fixtureRefs.root,
        fixtureRefs.runtimePlane,
        fixtureRefs.runLifecycleModule,
        fixtureRefs.runtimeEntity,
        fixtureRefs.agentRun,
      ]),
    );
    expect(graph.nodes.map(({ ref }) => ref)).toContain(fixtureRefs.leafRun);
  });

  it("round-trips a relation focus without creating a relation route", () => {
    const index = buildFixtureIndex();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedRelationId: "AgentRun-produces-RunResult",
    });
    const hash = serializeOntologyViewHash(state);
    const restored = restoreOntologyViewHash(hash, index);

    expect(hash).toBe(
      "#root=concept%3AAgentRun&focus=relation:AgentRun-produces-RunResult",
    );
    expect(restored.state.graphRootRef).toBe(fixtureRefs.agentRun);
    expect(restored.state.focusedRelationId).toBe("AgentRun-produces-RunResult");
    expect(restored.normalizedHash).toBe(hash);
  });

  it("preserves ontology, Domain, and Module roots when relation focus can be reconstructed", () => {
    const index = buildFixtureIndex();
    const roots = [
      fixtureRefs.root,
      fixtureRefs.runtimePlane,
      fixtureRefs.runLifecycleModule,
    ];

    for (const root of roots) {
      const restored = restoreOntologyViewHash(
        `#root=${encodeURIComponent(root)}&focus=relation:AgentRun-produces-RunResult`,
        index,
      );
      const graph = buildVisibleConceptGraph(index, restored.state);

      expect(restored.repairedRoot).toBe(false);
      expect(restored.invalidFocus).toBe(false);
      expect(restored.state.graphRootRef).toBe(root);
      expect(restored.state.focusedRelationId).toBe("AgentRun-produces-RunResult");
      expect(graph.edges.map(({ id }) => id)).toContain("AgentRun-produces-RunResult");
      expect(graph.details).toMatchObject({
        kind: "relation",
        relation: { id: "AgentRun-produces-RunResult" },
      });
    }
  });

  it("repairs a relation hash whose graph root cannot contain either endpoint", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(
      "#root=module%3Atool-catalog&focus=relation:AgentRun-produces-RunResult",
      index,
    );

    expect(restored.repairedRoot).toBe(true);
    expect(restored.state.graphRootRef).toBe(fixtureRefs.agentRun);
    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.agentRun);
    expect(restored.state.focusedRelationId).toBe("AgentRun-produces-RunResult");
    expect(restored.normalizedHash).toBe(
      "#root=concept%3AAgentRun&focus=relation:AgentRun-produces-RunResult",
    );
  });

  it("repairs an invalid root without discarding a valid deep node focus", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(
      "#root=module%3Amissing&focus=node:LeafRun",
      index,
    );
    const graph = buildVisibleConceptGraph(index, restored.state);

    expect(restored.repairedRoot).toBe(true);
    expect(restored.state.graphRootRef).toBe(fixtureRefs.root);
    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.leafRun);
    expect(graph.nodes.map(({ ref }) => ref)).toContain(fixtureRefs.leafRun);
  });

  it("reports an invalid hash focus while preserving the valid graph context", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(
      "#root=module%3Arun-lifecycle&focus=node:MissingConcept",
      index,
    );

    expect(restored.invalidFocus).toBe(true);
    expect(restored.repairedRoot).toBe(false);
    expect(restored.state.graphRootRef).toBe(fixtureRefs.runLifecycleModule);
    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.runLifecycleModule);
    expect(restored.normalizedHash).toBe(
      "#root=module%3Arun-lifecycle&focus=node:run-lifecycle",
    );
  });

  it("restores a derived organization edge in a graph context that actually contains it", () => {
    const index = buildFixtureIndex();
    const relationId = "derived:contains-module:runtime-plane:run-lifecycle";
    const restored = restoreOntologyViewHash(
      `#root=${encodeURIComponent(fixtureRefs.root)}&focus=relation:${relationId}`,
      index,
    );
    const graph = buildVisibleConceptGraph(index, restored.state);

    expect(restored.repairedRoot).toBe(true);
    expect(restored.state.graphRootRef).toBe(fixtureRefs.runtimePlane);
    expect(restored.state.focusedRelationId).toBe(relationId);
    expect(graph.details).toMatchObject({
      kind: "relation",
      relation: null,
      edge: { id: relationId, derived: true },
    });
  });

  it("deterministically repairs an incompatible root to the focused node's primary path", () => {
    const index = buildFixtureIndex();
    const restored = restoreOntologyViewHash(
      "#root=module%3Arun-lifecycle&focus=node:Tool",
      index,
    );

    expect(restored.state.focusedEntityRef).toBe(fixtureRefs.tool);
    expect(restored.state.graphRootRef).toBe(fixtureRefs.toolCatalogModule);
    expect(restored.state.graphExpandedRefs.has(fixtureRefs.toolCatalogModule)).toBe(true);
    expect(restored.repairedRoot).toBe(true);
    expect(restored.normalizedHash).toBe(
      "#root=module%3Atool-catalog&focus=node:Tool",
    );
  });
});
