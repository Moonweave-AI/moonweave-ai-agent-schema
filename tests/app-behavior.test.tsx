import type { ReactElement, ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { compiledBuildCommitSha } from "../src/lib/site-build-identity";
import type { OntologyRuntime } from "../src/lib/ontology-runtime";
import { uiText } from "../src/i18n/ui-text";

const hookHarness = vi.hoisted(() => ({
  cursor: 0,
  states: [] as unknown[],
  setters: [] as Array<(next: unknown) => void>,
  effects: [] as Array<() => void | (() => void)>,
}));

const buildManifestHarness = vi.hoisted(() => {
  class MismatchError extends Error {}
  return { load: vi.fn(), MismatchError };
});

const buildManifestFixture = Object.freeze({
  schema_version: "1.0.0" as const,
  commit_sha: compiledBuildCommitSha,
  built_from_ref: "chore/agent-ontology-audit",
  canonical_version: "https://moonweave.ai/ontology/agent-system/2.0.0/",
  generator_version: "2.0.0",
  source_fingerprint: "b".repeat(64),
  canonical_fingerprint: `sha256:${"e".repeat(64)}`,
  community_projection_fingerprint: `sha256:${"d".repeat(64)}`,
  module_count: 47,
  concept_count: 705,
  relation_count: 1153,
});

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
    useReducer: (
      reducer: (state: unknown, action: unknown) => unknown,
      initialArg: unknown,
      initializer?: (value: unknown) => unknown,
    ) => {
      const position = hookHarness.cursor;
      hookHarness.cursor += 1;
      if (!(position in hookHarness.states)) {
        hookHarness.states[position] = initializer ? initializer(initialArg) : initialArg;
      }
      const dispatch = (action: unknown) => {
        hookHarness.states[position] = reducer(hookHarness.states[position], action);
      };
      hookHarness.setters[position] = dispatch;
      return [hookHarness.states[position], dispatch];
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
        contract_version: "2.0.0",
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
        {
          ...ontologyViewModelFixture.relations[0],
          id: "DeprecatedAgentRunRelation",
          status: "deprecated",
        },
      ],
    },
  };
});
vi.mock("../src/generated/source-index.json", () => ({
  default: { registry_fingerprint: "test-registry", sources: [] },
}));
vi.mock("../src/lib/site-build-manifest", () => ({
  loadSiteBuildManifest: buildManifestHarness.load,
  SiteBuildManifestMismatchError: buildManifestHarness.MismatchError,
  canonicalIdentityForOntology: (canonical: {
    readonly id: string;
    readonly artifact_metadata?: Readonly<{
      readonly canonical_version?: string;
      readonly generator_version?: string;
      readonly source_tree_sha256?: string;
    }>;
    readonly modules: readonly unknown[];
    readonly classes: readonly unknown[];
    readonly relations: readonly Readonly<{ readonly status?: string }>[];
  }, canonicalFingerprint: string, communityProjectionFingerprint: string) => Object.freeze({
    canonicalVersion: canonical.artifact_metadata?.canonical_version ?? canonical.id,
    generatorVersion: canonical.artifact_metadata?.generator_version ?? "unknown",
    sourceFingerprint: canonical.artifact_metadata?.source_tree_sha256 ?? "",
    canonicalFingerprint,
    communityProjectionFingerprint,
    moduleCount: canonical.modules.length,
    conceptCount: canonical.classes.length,
    relationCount: canonical.relations.filter(({ status }) => status !== "deprecated").length,
  }),
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
  let AppComponent: (props: Readonly<{
    ontologyRuntime: OntologyRuntime;
    canonicalFingerprint: string;
  }>) => ReactElement;
  let baseOntologyRuntime: OntologyRuntime;
  let activeOntologyRuntime: OntologyRuntime;
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
    const canonical = (await import("../ontology/agent-ontology.json")).default;
    const sourceIndex = (await import("../src/generated/source-index.json")).default;
    const { createOntologyRuntime } = await import("../src/lib/ontology-runtime");
    AppComponent = (await import("../src/App")).default;
    baseOntologyRuntime = createOntologyRuntime(canonical, sourceIndex);
    activeOntologyRuntime = baseOntologyRuntime;
    App = () => AppComponent({
      ontologyRuntime: activeOntologyRuntime,
      canonicalFingerprint: buildManifestFixture.canonical_fingerprint,
    });
  });

  beforeEach(() => {
    hookHarness.cursor = 0;
    hookHarness.states = [];
    hookHarness.setters = [];
    hookHarness.effects = [];
    fakeWindow.location.hash = "#root=module%3Arun-lifecycle&focus=node%3AMissingConcept";
    hashListener = undefined;
    scheduledTimeout = undefined;
    activeOntologyRuntime = baseOntologyRuntime;
    vi.clearAllMocks();
    buildManifestHarness.load.mockResolvedValue(buildManifestFixture);
  });

  it("shows the independently compiled commit and the runtime ontology fingerprint", async () => {
    const communityGraph = (await import(
      "../src/generated/ontology-community-graph.json"
    )).default;
    let elements = renderApp();
    const cleanup = hookHarness.effects[0]?.();
    await Promise.resolve();

    elements = renderApp();
    const identity = byTestId(elements, "build-identity");
    expect(identity.props["data-build-commit"]).toBe(compiledBuildCommitSha);
    expect(identity.props["data-ontology-fingerprint"]).toBe(
      buildManifestFixture.canonical_fingerprint,
    );
    expect(collectElements(identity.props.children as ReactNode).some(
      ({ props }) => props.children === compiledBuildCommitSha.slice(0, 12),
    )).toBe(true);
    const expectedAcceptedRelationCount = baseOntologyRuntime.ontology.relations.filter(
      ({ status }) => status !== "deprecated",
    ).length;
    expect(buildManifestHarness.load).toHaveBeenCalledWith(expect.objectContaining({
      identity: expect.objectContaining({
        communityProjectionFingerprint: `sha256:${communityGraph.projection_sha256}`,
        relationCount: expectedAcceptedRelationCount,
      }),
      signal: expect.any(AbortSignal),
    }));

    if (typeof cleanup === "function") cleanup();
  });

  it("shows loading and identity-mismatch diagnostics without replacing the ontology", async () => {
    let elements = renderApp();
    expect(byTestId(elements, "build-identity-loading").props.role).toBe("status");

    buildManifestHarness.load.mockRejectedValueOnce(
      new buildManifestHarness.MismatchError("bundle mismatch"),
    );
    hookHarness.effects = [];
    elements = renderApp();
    hookHarness.effects[0]?.();
    await Promise.resolve();

    elements = renderApp();
    expect(byTestId(elements, "build-identity-mismatch").props.role).toBe("status");
    expect(byType(elements, "mock-ontology-graph")).toBeDefined();
  });

  it("keeps the ontology usable when runtime build information is unavailable", async () => {
    buildManifestHarness.load.mockRejectedValueOnce(new Error("manifest offline"));
    let elements = renderApp();
    hookHarness.effects[0]?.();
    await Promise.resolve();

    elements = renderApp();
    const identity = byTestId(elements, "build-identity-unavailable");
    expect(identity.props.role).toBe("status");
    expect(byType(elements, "mock-ontology-graph")).toBeDefined();
  });

  it("normalizes a non-Error manifest failure into an unavailable state reason", async () => {
    buildManifestHarness.load.mockRejectedValueOnce("manifest gateway offline");
    renderApp();
    hookHarness.effects[0]?.();
    await Promise.resolve();

    expect(hookHarness.states).toContainEqual({
      status: "unavailable",
      reason: "manifest gateway offline",
    });
    expect(byTestId(renderApp(), "build-identity-unavailable").props.role).toBe("status");
  });

  it("does not publish a late manifest failure after the component is unmounted", async () => {
    let rejectManifest: (reason: unknown) => void = () => undefined;
    buildManifestHarness.load.mockReturnValueOnce(new Promise((_resolve, reject) => {
      rejectManifest = reject;
    }));
    renderApp();
    const cleanup = hookHarness.effects[0]?.();
    if (typeof cleanup !== "function") throw new Error("Missing manifest cleanup");
    cleanup();
    rejectManifest(new Error("late failure"));
    await Promise.resolve();

    expect(hookHarness.states).toContainEqual({ status: "loading" });
    expect(hookHarness.states).not.toContainEqual(expect.objectContaining({
      reason: "late failure",
    }));
  });

  it("renders a valid location without a repair notice", () => {
    fakeWindow.location.hash = "#root=module%3Arun-lifecycle&focus=node%3AAgentRun";
    const elements = renderApp();

    expect(elements.some(({ props }) =>
      props.className === "context-repair-notice" && props.role === "status")).toBe(false);
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      "concept:AgentRun",
    );
  });

  it("explains when a valid focus forces repair of an incompatible graph root", () => {
    fakeWindow.location.hash = "#root=module%3Arun-lifecycle&focus=node%3ATrace";
    const elements = renderApp();
    const notice = elements.find(({ props }) =>
      props.className === "context-repair-notice" && props.role === "status");

    expect(notice?.props.children).toBe(uiText.zh.rootRepairNotice);
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      "concept:Trace",
    );
  });

  it("uses explicit display fallbacks when optional runtime annotations are absent", () => {
    const rootRef = baseOntologyRuntime.index.rootRef;
    const rootEntity = baseOntologyRuntime.index.entitiesByRef.get(rootRef);
    if (!rootEntity) throw new Error("Missing ontology root fixture");
    const entitiesByRef = new Map(baseOntologyRuntime.index.entitiesByRef);
    entitiesByRef.set(rootRef, {
      ...rootEntity,
      data: {
        ...rootEntity.data,
        status: undefined,
        source_claims: undefined,
      } as unknown as typeof rootEntity.data,
    });
    activeOntologyRuntime = {
      ...baseOntologyRuntime,
      ontology: {
        ...baseOntologyRuntime.ontology,
        artifact_metadata: undefined,
        ontology_metrics: undefined,
      } as unknown as OntologyRuntime["ontology"],
      index: {
        ...baseOntologyRuntime.index,
        entitiesByRef,
        dataDiagnostics: [],
      },
    };
    fakeWindow.location.hash = `#root=${encodeURIComponent(rootRef)}`;

    const elements = renderApp();
    expect(elements.some(({ props }) => props["data-testid"] === "data-integrity-error")).toBe(false);
    const definitionValues = elements
      .filter(({ type }) => type === "dd")
      .map(({ props }) => props.children);
    expect(definitionValues).toContain("不适用");
    expect(definitionValues).toContain(0);
    expect(byTestId(elements, "left-statistics")).toBeDefined();
  });

  it("falls back to the ontology root when navigation receives a stale entity reference", () => {
    let elements = renderApp();
    (byType(elements, "mock-ontology-directory").props.onNavigate as (ref: string) => void)(
      "concept:RemovedConcept",
    );

    elements = renderApp();
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      "concept:RemovedConcept",
    );
    const root = baseOntologyRuntime.index.entitiesByRef.get(
      baseOntologyRuntime.index.rootRef,
    );
    if (!root) throw new Error("Missing ontology root fixture");
    const rootLabel = (root.data as { readonly labels: { readonly zh: string } }).labels.zh;
    expect(elements.some(({ type, props }) =>
      type === "h2" && props.children === rootLabel)).toBe(true);
  });

  it("uses the relation predicate when an optional localized label is unavailable", () => {
    const relationId = "AgentRun-produces-RunResult";
    const relation = baseOntologyRuntime.index.relationsById.get(relationId);
    if (!relation) throw new Error("Missing relation fixture");
    const relationsById = new Map(baseOntologyRuntime.index.relationsById);
    relationsById.set(relationId, {
      ...relation,
      labels: undefined,
    } as typeof relation);
    activeOntologyRuntime = {
      ...baseOntologyRuntime,
      index: { ...baseOntologyRuntime.index, relationsById },
    };
    let elements = renderApp();
    const graph = byType(elements, "mock-ontology-graph").props;
    (graph.onFocusRelation as (id: string | null) => void)(null);
    (graph.onFocusRelation as (id: string | null) => void)(relationId);

    elements = renderApp();
    expect(elements.some(({ props }) =>
      props.className === "sr-live-selection" &&
      props.children === uiText.zh.focusRelation(relation.predicate))).toBe(true);
  });

  it("omits a stale breadcrumb segment while retaining the focused concept", () => {
    const entitiesByRef = new Map(baseOntologyRuntime.index.entitiesByRef);
    entitiesByRef.delete("plane:runtime-plane");
    activeOntologyRuntime = {
      ...baseOntologyRuntime,
      index: { ...baseOntologyRuntime.index, entitiesByRef },
    };
    fakeWindow.location.hash = "#root=concept%3AAgentRun&focus=node%3AAgentRun";

    const elements = renderApp();
    const breadcrumb = elements.find(({ props }) => props.className === "breadcrumb");
    if (!breadcrumb) throw new Error("Missing breadcrumb");
    expect(collectElements(breadcrumb.props.children as ReactNode).some(({ props }) =>
      props.children === "runtime-plane")).toBe(false);
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      "concept:AgentRun",
    );
  });

  it("runs the primary controls while keeping the graph interaction surface minimal", () => {
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
    expect(graph.onExpandEntity).toBeUndefined();
    expect(graph.onSelectionChange).toBeUndefined();
    expect(graph.layoutMode).toBeUndefined();
    expect(graph.layoutDirection).toBeUndefined();
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
      "module:run-lifecycle",
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

  it("uses a single focused entity without exposing the superseded multi-selection contract", () => {
    let elements = renderApp();
    const graph = byType(elements, "mock-ontology-graph").props;
    expect(graph.onSelectionChange).toBeUndefined();
    expect(graph.selectedEntityRefs).toBeUndefined();
    (graph.onFocusEntity as (ref: string) => void)("concept:RunResult");

    elements = renderApp();
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      "concept:RunResult",
    );
  });

  it("applies effects, normalizes hashes, restores location state, and cleans up listeners", () => {
    let elements = renderApp();
    expect(hookHarness.effects).toHaveLength(6);

    const cancelManifest = hookHarness.effects[0]?.();
    if (typeof cancelManifest === "function") cancelManifest();

    hookHarness.effects[1]?.();
    expect((document.documentElement as HTMLElement).dataset.theme).toBe("dark");

    const cancelNotice = hookHarness.effects[2]?.();
    expect(fakeWindow.setTimeout).toHaveBeenCalledWith(expect.any(Function), 6000);
    scheduledTimeout?.();
    if (typeof cancelNotice === "function") cancelNotice();
    expect(clearTimeout).toHaveBeenCalledWith(17);

    elements = renderApp();
    expect(hookHarness.effects[2]?.()).toBeUndefined();

    hookHarness.effects[3]?.();
    expect(replaceState).toHaveBeenCalled();
    expect(fakeWindow.location.hash).not.toMatch(/(?:mode|direction|predicate)=/u);
    hookHarness.effects[3]?.();
    expect(hookHarness.effects[4]?.()).toBeUndefined();

    const removeHashListener = hookHarness.effects[5]?.();
    expect(addEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));
    fakeWindow.location.hash = "#root=plane%3Aruntime-plane&focus=node%3AAgentRun";
    hashListener?.();
    fakeWindow.location.hash = "#root=missing&focus=invalid";
    hashListener?.();
    if (typeof removeHashListener === "function") removeHashListener();
    expect(removeEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));

    elements = renderApp();
    expect(byType(elements, "mock-ontology-directory").props.graphRootRef).toBe(
      "root:agent-system-ontology",
    );
  });
});
