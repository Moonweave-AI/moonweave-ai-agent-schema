import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildOntologyCommunityNetworkModel } from "../src/lib/ontology-community-network";
import { buildOntologyIndex } from "../src/lib/ontology-index";
import { createOntologyNetworkRuntime } from "../src/lib/ontology-network-runtime";
import { buildCommunityGraphFixture } from "./fixtures/ontology-community-graph.fixture";
import { ontologyViewModelFixture } from "./fixtures/ontology-view-model.fixture";

const harness = vi.hoisted(() => ({
  dataSets: [] as Array<{ values: Map<string | number, Record<string, unknown>> }>,
  handlers: new Map<string, (event: never) => void>(),
  onceHandlers: new Map<string, () => void>(),
  constructorOptions: null as Record<string, unknown> | null,
  setOptions: [] as Record<string, unknown>[],
  stabilizeCalls: [] as number[],
  focusCalls: [] as Array<{ id: string | number; options: unknown }>,
  selectedNodes: [] as Array<readonly (string | number)[]>,
  unselectCalls: 0,
  fitCalls: [] as unknown[],
  destroyCalls: 0,
}));

vi.mock("vis-data", () => ({
  DataSet: class {
    readonly values = new Map<string | number, Record<string, unknown>>();
    constructor(rows: readonly Record<string, unknown>[]) {
      for (const row of rows) this.values.set(row.id as string | number, { ...row });
      harness.dataSets.push(this);
    }
    update(rows: Record<string, unknown> | readonly Record<string, unknown>[]) {
      for (const row of Array.isArray(rows) ? rows : [rows]) {
        const id = row.id as string | number;
        this.values.set(id, { ...(this.values.get(id) ?? {}), ...row });
      }
    }
  },
}));

vi.mock("vis-network", () => ({
  Network: class {
    constructor(_container: unknown, _data: unknown, options: Record<string, unknown>) {
      harness.constructorOptions = options;
    }
    on(name: string, handler: (event: never) => void) { harness.handlers.set(name, handler); }
    once(name: string, handler: () => void) { harness.onceHandlers.set(name, handler); }
    setOptions(options: Record<string, unknown>) { harness.setOptions.push(options); }
    stabilize(iterations: number) { harness.stabilizeCalls.push(iterations); }
    focus(id: string | number, options: unknown) { harness.focusCalls.push({ id, options }); }
    selectNodes(ids: readonly (string | number)[]) { harness.selectedNodes.push(ids); }
    unselectAll() { harness.unselectCalls += 1; }
    fit(options: unknown) { harness.fitCalls.push(options); }
    destroy() { harness.destroyCalls += 1; }
  },
}));

class FakeElement {
  className = "";
  readonly style: Record<string, string> = {};
  readonly children: unknown[] = [];
  append(...values: unknown[]) { this.children.push(...values); }
}

const index = buildOntologyIndex(
  ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
);
const artifact = buildCommunityGraphFixture(index);
const model = buildOntologyCommunityNetworkModel(index, artifact, "en", "dark");

describe("vis-network runtime lifecycle", () => {
  beforeEach(() => {
    harness.dataSets = [];
    harness.handlers.clear();
    harness.onceHandlers.clear();
    harness.constructorOptions = null;
    harness.setOptions = [];
    harness.stabilizeCalls = [];
    harness.focusCalls = [];
    harness.selectedNodes = [];
    harness.unselectCalls = 0;
    harness.fitCalls = [];
    harness.destroyCalls = 0;
    vi.stubGlobal("document", {
      createElement: () => new FakeElement(),
      createTextNode: (text: string) => ({ textContent: text }),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("registers listeners before a 200-iteration stabilization and then freezes physics", async () => {
    const onStabilizing = vi.fn();
    const onStable = vi.fn();
    await createOntologyNetworkRuntime(new FakeElement() as unknown as HTMLDivElement, model, {
      onNodeFocus: vi.fn(),
      onRelationFocus: vi.fn(),
      onStabilizing,
      onStable,
    });

    expect(harness.constructorOptions).toMatchObject({
      layout: { randomSeed: 42 },
      physics: { enabled: false, solver: "forceAtlas2Based" },
    });
    expect(harness.onceHandlers.has("stabilizationIterationsDone")).toBe(true);
    expect(harness.stabilizeCalls).toEqual([200]);
    expect(onStabilizing).toHaveBeenCalledOnce();

    harness.onceHandlers.get("stabilizationIterationsDone")?.();
    expect(harness.setOptions.at(-1)).toEqual({ physics: { enabled: false } });
    expect(onStable).toHaveBeenCalledOnce();
  });

  it("keeps stabilization single-flight and permits a new reflow after freezing", async () => {
    const runtime = await createOntologyNetworkRuntime(
      new FakeElement() as unknown as HTMLDivElement,
      model,
      {
        onNodeFocus: vi.fn(),
        onRelationFocus: vi.fn(),
        onStabilizing: vi.fn(),
        onStable: vi.fn(),
      },
    );

    runtime.stabilize();
    expect(harness.stabilizeCalls).toEqual([200]);

    harness.onceHandlers.get("stabilizationIterationsDone")?.();
    runtime.stabilize();
    runtime.stabilize();
    expect(harness.stabilizeCalls).toEqual([200, 200]);
  });

  it("maps node and canonical-edge clicks without exposing derived edges as facts", async () => {
    const onNodeFocus = vi.fn();
    const onRelationFocus = vi.fn();
    await createOntologyNetworkRuntime(new FakeElement() as unknown as HTMLDivElement, model, {
      onNodeFocus,
      onRelationFocus,
      onStabilizing: vi.fn(),
      onStable: vi.fn(),
    });
    const canonicalEdge = model.edges.find(({ canonicalRelationId }) => canonicalRelationId);
    expect(canonicalEdge).toBeDefined();

    harness.handlers.get("click")?.({ nodes: [model.nodes[0].id], edges: [] } as never);
    harness.handlers.get("click")?.({ nodes: [], edges: [canonicalEdge!.id] } as never);
    harness.handlers.get("click")?.({ nodes: [], edges: [] } as never);

    expect(onNodeFocus).toHaveBeenCalledWith(model.nodes[0].id);
    expect(onRelationFocus).toHaveBeenNthCalledWith(1, canonicalEdge!.canonicalRelationId);
    expect(onRelationFocus).toHaveBeenNthCalledWith(2, null);
  });

  it("updates visibility and visual language without restarting physics", async () => {
    const runtime = await createOntologyNetworkRuntime(
      new FakeElement() as unknown as HTMLDivElement,
      model,
      {
        onNodeFocus: vi.fn(),
        onRelationFocus: vi.fn(),
        onStabilizing: vi.fn(),
        onStable: vi.fn(),
      },
    );
    const initialStabilizations = harness.stabilizeCalls.length;
    runtime.setHiddenCommunities(new Set([0]));
    runtime.updateModel(buildOntologyCommunityNetworkModel(index, artifact, "zh", "light"));

    const hiddenNodeIds = new Set<string | number>(model.nodes
      .filter(({ communityId }) => communityId === 0)
      .map(({ id }) => id));
    for (const [nodeId, { hidden }] of harness.dataSets[0].values) {
      expect(hidden, String(nodeId)).toBe(hiddenNodeIds.has(nodeId));
    }
    expect(harness.stabilizeCalls).toHaveLength(initialStabilizations);

    const curvedEdge = model.edges.find(({ smooth }) => smooth.type !== "continuous");
    if (curvedEdge) {
      expect(harness.dataSets[1].values.get(curvedEdge.id)?.smooth).toEqual(curvedEdge.smooth);
    }

    runtime.setFocusedNode("concept:deprecated-or-missing" as never);
    expect(harness.unselectCalls).toBe(1);
    runtime.destroy();
    expect(harness.destroyCalls).toBe(1);
  });
});
