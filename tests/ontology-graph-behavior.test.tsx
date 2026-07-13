import type { ReactElement, ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { buildOntologyIndex, type OntologyIndex } from "../src/lib/ontology-index";
import {
  buildVisibleConceptGraph,
  createOntologyViewState,
  type VisibleOntologyGraph,
} from "../src/lib/ontology-view-model";
import {
  fixtureRefs,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";

const reactHarness = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  refs: [] as Array<{ current: unknown }>,
  refCursor: 0,
  container: { dataset: {} as Record<string, string> },
}));

const cytoscapeHarness = vi.hoisted(() => ({
  handlers: new Map<string, (event: unknown) => void>(),
  options: undefined as { readonly elements?: readonly Record<string, unknown>[] } | undefined,
  positionOffset: 0,
  addedClasses: [] as Array<{ readonly id: string; readonly className: string }>,
  removedClasses: [] as string[],
  destroyed: 0,
  layoutRun: 0,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useMemo: (factory: () => unknown) => factory(),
    useEffect: (effect: () => void | (() => void)) => reactHarness.effects.push(effect),
    useRef: (initial: unknown) => {
      const position = reactHarness.refCursor;
      reactHarness.refCursor += 1;
      if (!reactHarness.refs[position]) {
        reactHarness.refs[position] = {
          current: position === 0 ? reactHarness.container : initial,
        };
      }
      return reactHarness.refs[position];
    },
  };
});

vi.mock("cytoscape-fcose", () => ({ default: {} }));
vi.mock("cytoscape", () => {
  const factory = vi.fn((options: {
    readonly elements?: readonly {
      readonly data?: Readonly<Record<string, unknown>>;
      readonly position?: Readonly<{ x: number; y: number }>;
    }[];
  }) => {
    cytoscapeHarness.options = options as typeof cytoscapeHarness.options;
    let layoutStop: (() => void) | undefined;
    const elementForId = (id: string) => ({
      addClass: (className: string) => {
        cytoscapeHarness.addedClasses.push({ id, className });
        return elementForId(id);
      },
    });
    const graph = {
      on: (name: string, selector: string, handler: (event: unknown) => void) => {
        cytoscapeHarness.handlers.set(`${name}:${selector}`, handler);
        return graph;
      },
      layout: () => ({
        one: (_name: string, handler: () => void) => {
          layoutStop = handler;
        },
        run: () => {
          cytoscapeHarness.layoutRun += 1;
          layoutStop?.();
        },
      }),
      nodes: () => ({
        removeClass: (className: string) => {
          cytoscapeHarness.removedClasses.push(className);
        },
        toArray: () => (options.elements ?? [])
          .filter(({ data }) => !data?.source)
          .map(({ data, position }) => ({
            id: () => String(data?.id),
            position: () => ({
              x: (position?.x ?? 0) + cytoscapeHarness.positionOffset,
              y: position?.y ?? 0,
            }),
          })),
      }),
      edges: () => ({
        removeClass: (className: string) => {
          cytoscapeHarness.removedClasses.push(className);
        },
      }),
      getElementById: elementForId,
      batch: (callback: () => void) => callback(),
      destroy: () => {
        cytoscapeHarness.destroyed += 1;
      },
    };
    return graph;
  });
  Object.assign(factory, { use: vi.fn() });
  return { default: factory };
});

interface ElementRecord {
  readonly type: ReactElement["type"];
  readonly props: Readonly<Record<string, unknown>>;
}

const collectElements = (node: ReactNode, result: ElementRecord[] = []): ElementRecord[] => {
  if (Array.isArray(node)) {
    node.forEach((child) => collectElements(child, result));
    return result;
  }
  if (!node || typeof node !== "object" || !("type" in node) || !("props" in node)) {
    return result;
  }
  const element = node as ReactElement<Readonly<Record<string, unknown>>>;
  result.push({ type: element.type, props: element.props });
  collectElements(element.props.children as ReactNode, result);
  return result;
};

const keyboardEvent = (key: string) => ({ key, preventDefault: vi.fn() });

describe("OntologyGraph interaction lifecycle", () => {
  let OntologyGraph: typeof import("../src/components/OntologyGraph").OntologyGraph;
  let index: OntologyIndex;
  let view: VisibleOntologyGraph;
  const focusEntity = vi.fn();
  const focusRelation = vi.fn();
  const expandEntity = vi.fn();

  const renderGraph = (overrides: Partial<Parameters<typeof OntologyGraph>[0]> = {}) => {
    reactHarness.refCursor = 0;
    reactHarness.effects = [];
    return collectElements(OntologyGraph({
      index,
      view,
      language: "en",
      theme: "dark",
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
      focusedRelationId: "AgentRun-produces-RunResult",
      highlightedScenarioId: "graph-scenario",
      onFocusEntity: focusEntity,
      onFocusRelation: focusRelation,
      onExpandEntity: expandEntity,
      ...overrides,
    }));
  };

  beforeAll(async () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => ({ matches: false })),
    });
    OntologyGraph = (await import("../src/components/OntologyGraph")).OntologyGraph;

    const nodeCase = {
      ...ontologyViewModelFixture.classes[3].examples[0],
      id: "graph-node-case",
      kind: "case-fragment",
      scenario_id: "graph-scenario",
    };
    const relationCase = {
      ...ontologyViewModelFixture.relations[3].examples[0],
      id: "graph-relation-case",
      kind: "case-fragment",
      scenario_id: "graph-scenario",
    };
    const ontology = {
      ...ontologyViewModelFixture,
      classes: ontologyViewModelFixture.classes.map((concept) => concept.id === "AgentRun"
        ? { ...concept, examples: [...concept.examples, nodeCase] }
        : concept),
      relations: ontologyViewModelFixture.relations.map((relation) =>
        relation.id === "AgentRun-produces-RunResult"
          ? { ...relation, examples: [...relation.examples, relationCase] }
          : relation),
      case_paths: [{
        id: "graph-scenario",
        labels: { zh: "图场景", en: "Graph scenario", ja: "グラフシナリオ" },
        descriptions: { zh: "图场景", en: "Graph scenario", ja: "グラフシナリオ" },
        steps: [
          { order: 1, case_fragment_example_id: nodeCase.id, traversal_relation_id: "AgentRun-produces-RunResult" },
          { order: 2, case_fragment_example_id: relationCase.id, traversal_relation_id: "missing-relation" },
        ],
        source_claims: [],
      }],
    };
    index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
      graphExpandedRefs: new Set([fixtureRefs.agentRun]),
    });
    view = buildVisibleConceptGraph(index, state);
  });

  beforeEach(() => {
    reactHarness.effects = [];
    reactHarness.refs = [];
    reactHarness.refCursor = 0;
    reactHarness.container.dataset = {};
    cytoscapeHarness.handlers.clear();
    cytoscapeHarness.options = undefined;
    cytoscapeHarness.positionOffset = 0;
    cytoscapeHarness.addedClasses = [];
    cytoscapeHarness.removedClasses = [];
    cytoscapeHarness.destroyed = 0;
    cytoscapeHarness.layoutRun = 0;
    vi.clearAllMocks();
  });

  it("exposes keyboard-equivalent node and edge controls", () => {
    const elements = renderGraph();
    const node = elements.find(({ props }) => props["data-graph-node"] === fixtureRefs.agentRun);
    const edge = elements.find(
      ({ props }) => props["data-graph-edge"] === "AgentRun-produces-RunResult",
    );
    if (!node || !edge) throw new Error("Missing graph keyboard proxy");

    (node.props.onClick as () => void)();
    (node.props.onDoubleClick as () => void)();
    const spaceDown = keyboardEvent(" ");
    (node.props.onKeyDown as (event: typeof spaceDown) => void)(spaceDown);
    expect(spaceDown.preventDefault).toHaveBeenCalledOnce();
    const escapeDown = keyboardEvent("Escape");
    (node.props.onKeyDown as (event: typeof escapeDown) => void)(escapeDown);
    const ignoredDown = keyboardEvent("Enter");
    (node.props.onKeyDown as (event: typeof ignoredDown) => void)(ignoredDown);
    const spaceUp = keyboardEvent(" ");
    (node.props.onKeyUp as (event: typeof spaceUp) => void)(spaceUp);
    const ignoredUp = keyboardEvent("Enter");
    (node.props.onKeyUp as (event: typeof ignoredUp) => void)(ignoredUp);

    (edge.props.onClick as () => void)();
    const edgeEscape = keyboardEvent("Escape");
    (edge.props.onKeyDown as (event: typeof edgeEscape) => void)(edgeEscape);
    (edge.props.onKeyDown as (event: typeof edgeEscape) => void)(keyboardEvent("Enter"));

    const expand = elements.find(({ props }) => props.className === "graph-expand-button");
    expand?.props.onClick && (expand.props.onClick as () => void)();
    expect(focusEntity).toHaveBeenCalledWith(fixtureRefs.agentRun);
    expect(focusRelation).toHaveBeenCalledWith("AgentRun-produces-RunResult");
    expect(expandEntity).toHaveBeenCalledWith(fixtureRefs.agentRun);
  });

  it("creates one force graph, handles pointer events, styles focus/cases, and verifies layout", () => {
    renderGraph();
    expect(reactHarness.effects).toHaveLength(2);
    const dispose = reactHarness.effects[0]?.();
    expect(cytoscapeHarness.layoutRun).toBe(1);
    expect(reactHarness.container.dataset.layoutInvariant).toBe("true");

    const connectedEdges = {
      addClass: vi.fn(),
      removeClass: vi.fn(),
    };
    const now = vi.spyOn(Date, "now")
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1200)
      .mockReturnValueOnce(2000);
    const nodeTarget = { data: () => fixtureRefs.agentRun, connectedEdges: () => connectedEdges };
    cytoscapeHarness.handlers.get("tap:node")?.({ target: nodeTarget });
    cytoscapeHarness.handlers.get("tap:node")?.({ target: nodeTarget });
    cytoscapeHarness.handlers.get("tap:node")?.({
      target: { data: () => fixtureRefs.runResult, connectedEdges: () => connectedEdges },
    });
    cytoscapeHarness.handlers.get("tap:edge")?.({
      target: { id: () => "AgentRun-produces-RunResult" },
    });
    cytoscapeHarness.handlers.get("mouseover:node")?.({ target: nodeTarget });
    cytoscapeHarness.handlers.get("mouseout:node")?.({ target: nodeTarget });
    now.mockRestore();

    reactHarness.effects[1]?.();
    expect(connectedEdges.addClass).toHaveBeenCalledWith("is-hover-related");
    expect(connectedEdges.removeClass).toHaveBeenCalledWith("is-hover-related");
    expect(cytoscapeHarness.addedClasses).toEqual(expect.arrayContaining([
      expect.objectContaining({ className: "is-focused-node" }),
      expect.objectContaining({ className: "is-outgoing-edge" }),
      expect.objectContaining({ className: "is-focused-edge" }),
      expect.objectContaining({ className: "case-path-highlight" }),
    ]));

    if (typeof dispose === "function") dispose();
    expect(cytoscapeHarness.destroyed).toBe(1);
    expect(reactHarness.effects[1]?.()).toBeUndefined();
  });

  it("reports a failed position invariant and renders the empty graph state", () => {
    cytoscapeHarness.positionOffset = 4;
    renderGraph({ theme: "light", highlightedScenarioId: null, focusedRelationId: null });
    const dispose = reactHarness.effects[0]?.();
    expect(reactHarness.container.dataset.layoutInvariant).toBe("false");
    if (typeof dispose === "function") {
      reactHarness.refs[1]!.current = { different: true };
      dispose();
      reactHarness.refs[1]!.current = null;
    }

    const emptyView: VisibleOntologyGraph = {
      ...view,
      nodes: [],
      edges: [],
      hiddenAdjacentRefs: [],
      counts: { ...view.counts, visibleNodes: 0, visibleEdges: 0 },
    };
    const emptyElements = renderGraph({ view: emptyView, highlightedScenarioId: null });
    expect(emptyElements.some(({ props }) => props["data-testid"] === "graph-empty-state")).toBe(true);
    expect(reactHarness.effects[0]?.()).toBeUndefined();
    expect(reactHarness.effects[1]?.()).toBeUndefined();
  });
});
