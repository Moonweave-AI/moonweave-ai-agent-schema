import type { ReactElement, ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const hookHarness = vi.hoisted(() => ({
  cursor: 0,
  states: [] as unknown[],
  setters: [] as Array<(next: unknown) => void>,
  effects: [] as Array<() => void | (() => void)>,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const position = hookHarness.cursor;
      hookHarness.cursor += 1;
      if (!(position in hookHarness.states)) {
        hookHarness.states[position] = typeof initial === "function"
          ? (initial as () => unknown)()
          : initial;
      }
      const setter = (next: unknown) => {
        hookHarness.states[position] = typeof next === "function"
          ? (next as (current: unknown) => unknown)(hookHarness.states[position])
          : next;
      };
      hookHarness.setters[position] = setter;
      return [hookHarness.states[position], setter];
    },
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useEffect: (effect: () => void | (() => void)) => {
      hookHarness.effects.push(effect);
    },
  };
});

vi.mock("../src/components/OntologyDirectory", () => ({
  OntologyDirectory: "mock-ontology-directory",
}));
vi.mock("../src/components/OntologyGraph", () => ({
  OntologyGraph: "mock-ontology-graph",
}));
vi.mock("../src/components/OntologyCharacteristics", () => ({
  OntologyCharacteristics: "mock-ontology-characteristics",
}));
vi.mock("../ontology/agent-ontology.json", async () => {
  const { ontologyViewModelFixture } = await import("./fixtures/ontology-view-model.fixture");
  return {
    default: {
      ...ontologyViewModelFixture,
      review: {
        review_status: "accepted",
        reviewers: [],
      },
      artifact_metadata: {
        ...ontologyViewModelFixture.artifact_metadata,
        artifact_kind: "canonical-agent-ontology",
        contract_version: "1.0.0",
        release_channel: "candidate",
        releasable: false,
        generated_at: "2026-07-13T00:00:00.000Z",
        source_tree_sha256: "0".repeat(64),
      },
      relations: [
        ...ontologyViewModelFixture.relations,
        {
          ...ontologyViewModelFixture.relations[0],
          id: "AgentRun-points_to-MissingConcept",
          predicate: "points_to",
          relation_kind: "semantic",
          source_id: "AgentRun",
          target_id: "MissingConcept",
        },
      ],
    },
  };
});
vi.mock("../src/generated/source-index.json", () => ({
  default: { registry_fingerprint: "test-registry", sources: [] },
}));

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

const byType = (elements: readonly ElementRecord[], type: string): ElementRecord => {
  const element = elements.find((candidate) => candidate.type === type);
  if (!element) throw new Error(`Missing test element: ${type}`);
  return element;
};

const byTestId = (elements: readonly ElementRecord[], testId: string): ElementRecord => {
  const element = elements.find((candidate) => candidate.props["data-testid"] === testId);
  if (!element) throw new Error(`Missing test id: ${testId}`);
  return element;
};

const click = (element: ElementRecord): void => {
  (element.props.onClick as () => void)();
};

describe("App state and URL recovery behavior", () => {
  let App: () => ReactElement;
  let hashListener: (() => void) | undefined;
  let scheduledTimeout: (() => void) | undefined;
  const replaceState = vi.fn((_state: unknown, _title: string, hash: string) => {
    fakeWindow.location.hash = hash;
  });
  const addEventListener = vi.fn((name: string, listener: () => void) => {
    if (name === "hashchange") hashListener = listener;
  });
  const removeEventListener = vi.fn();
  const clearTimeout = vi.fn();
  const anchorClick = vi.fn();
  const createObjectURL = vi.fn(() => "blob:canonical-ontology");
  const revokeObjectURL = vi.fn();
  const fakeWindow = {
    location: {
      hash: "#root=module%3Arun-lifecycle&focus=node%3AMissingConcept",
    },
    history: { replaceState },
    setTimeout: vi.fn((callback: () => void) => {
      scheduledTimeout = callback;
      return 17;
    }),
    clearTimeout,
    addEventListener,
    removeEventListener,
  };

  const renderApp = (): ElementRecord[] => {
    hookHarness.cursor = 0;
    hookHarness.effects = [];
    return collectElements(App());
  };

  beforeAll(async () => {
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", {
      documentElement: { dataset: {} as Record<string, string> },
      createElement: vi.fn(() => ({
        href: "",
        download: "",
        click: anchorClick,
      })),
    });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    App = (await import("../src/App")).default;
  });

  beforeEach(() => {
    hookHarness.cursor = 0;
    hookHarness.states = [];
    hookHarness.setters = [];
    hookHarness.effects = [];
    fakeWindow.location.hash = "#root=module%3Arun-lifecycle&focus=node%3AMissingConcept";
    hashListener = undefined;
    scheduledTimeout = undefined;
    vi.clearAllMocks();
  });

  it("runs all primary controls and keeps directory and graph expansion independent", () => {
    let elements = renderApp();
    expect(elements.some(({ props }) => props.role === "status")).toBe(true);

    click(byTestId(elements, "language-zh"));
    click(byTestId(elements, "language-en"));
    click(byTestId(elements, "language-ja"));
    click(byTestId(elements, "theme-dark"));
    click(byTestId(elements, "theme-light"));

    const directory = byType(elements, "mock-ontology-directory").props;
    (directory.onSearchQueryChange as (query: string) => void)("AgentRun");
    (directory.onToggleExpanded as (ref: string) => void)("module:run-lifecycle");
    (directory.onToggleExpanded as (ref: string) => void)("module:run-lifecycle");

    const graph = byType(elements, "mock-ontology-graph").props;
    (graph.onExpandEntity as (ref: string) => void)("concept:AgentRun");
    (graph.onFocusEntity as (ref: string) => void)("concept:MissingConcept");
    (graph.onFocusEntity as (ref: string) => void)("concept:AgentRun");
    (graph.onFocusRelation as (id: string) => void)("missing-relation");
    (graph.onFocusRelation as (id: string) => void)("AgentRun-produces-RunResult");

    elements = renderApp();
    expect(byType(elements, "mock-ontology-graph").props.focusedRelationId).toBe(
      "AgentRun-produces-RunResult",
    );

    const characteristics = byType(elements, "mock-ontology-characteristics").props;
    (characteristics.onBackToNode as () => void)();
    (characteristics.onHighlightScenario as (id: string | null) => void)("case-one");
    (characteristics.onExpandAdjacent as (ref: string) => void)("concept:RunResult");
    (characteristics.onFocusEntity as (ref: string) => void)("concept:RunResult");
    (characteristics.onNavigateEntity as (ref: string) => void)("plane:runtime-plane");
    elements = renderApp();
    expect(byType(elements, "mock-ontology-directory").props.graphRootRef).toBe(
      "plane:runtime-plane",
    );

    (byType(elements, "mock-ontology-directory").props.onNavigate as (ref: string) => void)(
      "root:agent-system-ontology",
    );
    elements = renderApp();
    (byType(elements, "mock-ontology-directory").props.onNavigate as (ref: string) => void)(
      "concept:AgentRun",
    );
    elements = renderApp();

    const collapseButton = elements.find(({ props }) => typeof props["aria-expanded"] === "boolean");
    if (!collapseButton) throw new Error("Missing directory collapse control");
    click(collapseButton);
    elements = renderApp();
    expect(elements.some(({ props }) => props.className === "viewer-grid is-left-collapsed")).toBe(true);

    const breadcrumbButtons = elements.filter(
      ({ type, props }) => type === "button" && typeof props.onClick === "function" &&
        props.className === undefined && props["data-testid"] === undefined &&
        props["aria-expanded"] === undefined,
    );
    breadcrumbButtons.at(-1)?.props.onClick &&
      (breadcrumbButtons.at(-1)!.props.onClick as () => void)();

    const download = elements.find(({ props }) => props.className === "download-link");
    if (!download) throw new Error("Missing download action");
    click(download);
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:canonical-ontology");
  });

  it("shows one inline data error while keeping the valid graph surface mounted", () => {
    const elements = renderApp();
    const dataErrors = elements.filter(
      ({ props }) => props["data-testid"] === "data-integrity-error" && props.role === "alert",
    );

    expect(dataErrors).toHaveLength(1);
    expect(dataErrors[0]?.props.children).toContain("AgentRun-points_to-MissingConcept");
    expect(byType(elements, "mock-ontology-graph")).toBeDefined();
  });

  it("applies effects, normalizes hashes, restores location state, and cleans up listeners", () => {
    let elements = renderApp();
    expect(hookHarness.effects).toHaveLength(4);

    hookHarness.effects[0]?.();
    expect((document.documentElement as HTMLElement).dataset.theme).toBe("dark");

    const cancelNotice = hookHarness.effects[1]?.();
    expect(fakeWindow.setTimeout).toHaveBeenCalledWith(expect.any(Function), 6000);
    scheduledTimeout?.();
    if (typeof cancelNotice === "function") cancelNotice();
    expect(clearTimeout).toHaveBeenCalledWith(17);

    elements = renderApp();
    expect(hookHarness.effects[1]?.()).toBeUndefined();

    hookHarness.effects[2]?.();
    expect(replaceState).toHaveBeenCalled();
    hookHarness.effects[2]?.();

    const removeHashListener = hookHarness.effects[3]?.();
    expect(addEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));
    fakeWindow.location.hash = "#root=plane%3Aruntime-plane&focus=node%3AAgentRun";
    hashListener?.();
    fakeWindow.location.hash = "#root=missing&focus=invalid";
    hashListener?.();
    if (typeof removeHashListener === "function") removeHashListener();
    expect(removeEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));

    elements = renderApp();
    expect(byType(elements, "mock-ontology-graph").props.graphRootRef).toBe(
      "root:agent-system-ontology",
    );
  });
});
