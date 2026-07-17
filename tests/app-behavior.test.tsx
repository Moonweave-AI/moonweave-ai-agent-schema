import type { ComponentType, ReactElement, ReactNode } from "react";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { compiledBuildCommitSha } from "../src/lib/site-build-identity";
import type { OntologyRuntime } from "../src/lib/ontology-runtime";
import { uiText } from "../src/i18n/ui-text";

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
  module_count: 45,
  concept_count: 705,
  relation_count: 1153,
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

const renderedElements = (root: ReactTestInstance): ElementRecord[] => [
  root,
  ...root.findAll(() => true),
].map(({ type, props }) => ({ type, props }));

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

const createDeferred = <T,>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject } as const;
};

describe("App state and URL recovery behavior", () => {
  let App: () => ReactElement;
  let AppComponent: ComponentType<Readonly<{
    ontologyRuntime: OntologyRuntime;
    canonicalFingerprint: string;
  }>>;
  let renderer: ReactTestRenderer | null = null;
  let baseOntologyRuntime: OntologyRuntime;
  let activeOntologyRuntime: OntologyRuntime;
  let primaryModuleRef: string;
  let primaryConceptRef: string;
  let foreignConceptRef: string;
  let primaryPlaneRef: string;
  let currentRelationId: string;
  let currentRelationTargetRef: string;
  let hashListener: (() => void) | undefined;
  let resizeListener: (() => void) | undefined;
  let scheduledTimeout: (() => void) | undefined;
  const directoryHeightProperty = vi.fn();
  const replaceState = vi.fn((_state: unknown, _title: string, hash: string) => {
    fakeWindow.location.hash = hash;
  });
  const addEventListener = vi.fn((name: string, listener: () => void) => {
    if (name === "hashchange") hashListener = listener;
    if (name === "resize") resizeListener = listener;
  });
  const removeEventListener = vi.fn();
  const clearTimeout = vi.fn();
  const anchorClick = vi.fn();
  const createObjectURL = vi.fn(() => "blob:canonical-ontology");
  const revokeObjectURL = vi.fn();
  const fakeWindow = {
    innerHeight: 900,
    scrollY: 20,
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

  const createNodeMock = () => ({
    getBoundingClientRect: () => ({ top: 200 }),
    style: { setProperty: directoryHeightProperty },
  });

  const readElements = (): ElementRecord[] => {
    if (!renderer) throw new Error("App is not mounted");
    return renderedElements(renderer.root);
  };

  const renderApp = async (): Promise<ElementRecord[]> => {
    await act(async () => {
      if (renderer) renderer.update(App());
      else renderer = create(App(), { createNodeMock });
      await Promise.resolve();
    });
    return readElements();
  };

  const invoke = async (callback: () => void): Promise<void> => {
    await act(async () => {
      callback();
      await Promise.resolve();
    });
  };

  const unmountApp = async (): Promise<void> => {
    if (!renderer) return;
    const mountedRenderer = renderer;
    renderer = null;
    await act(async () => {
      mountedRenderer.unmount();
      await Promise.resolve();
    });
  };

  beforeAll(async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
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
    const canonical = (await import("../src/generated/agent-ontology.json")).default;
    const sourceIndex = (await import("../src/generated/source-index.json")).default;
    const { createOntologyRuntime } = await import("../src/lib/ontology-runtime");
    AppComponent = (await import("../src/App")).default;
    baseOntologyRuntime = createOntologyRuntime(canonical, sourceIndex);
    const moduleWithRoots = [...baseOntologyRuntime.index.rootConceptRefsByModuleId]
      .find(([, refs]) => refs.length > 0);
    if (!moduleWithRoots) throw new Error("Generated ontology has no navigable module root");
    const [moduleId, rootConcepts] = moduleWithRoots;
    primaryModuleRef = `module:${moduleId}`;
    primaryConceptRef = rootConcepts[0]!;
    const primaryPlane = baseOntologyRuntime.index.planeByModuleId.get(moduleId);
    if (!primaryPlane) throw new Error(`Module ${moduleId} has no domain`);
    primaryPlaneRef = `plane:${primaryPlane.id}`;
    const foreignModule = [...baseOntologyRuntime.index.rootConceptRefsByModuleId]
      .find(([candidateId, refs]) => candidateId !== moduleId && refs.length > 0);
    if (!foreignModule) throw new Error("Generated ontology has no second navigable module");
    foreignConceptRef = foreignModule[1][0]!;
    const currentRelation = [...baseOntologyRuntime.index.relationsById.values()]
      .find(({ status }) => status !== "deprecated");
    if (!currentRelation) throw new Error("Generated ontology has no current relation");
    currentRelationId = currentRelation.id;
    currentRelationTargetRef = `concept:${currentRelation.target_id}`;
    activeOntologyRuntime = baseOntologyRuntime;
    App = () => (
      <AppComponent
        ontologyRuntime={activeOntologyRuntime}
        canonicalFingerprint={buildManifestFixture.canonical_fingerprint}
      />
    );
  });

  beforeEach(async () => {
    await unmountApp();
    fakeWindow.scrollY = 20;
    fakeWindow.location.hash = `#root=${encodeURIComponent(primaryModuleRef)}&focus=node%3AMissingConcept`;
    hashListener = undefined;
    resizeListener = undefined;
    scheduledTimeout = undefined;
    activeOntologyRuntime = baseOntologyRuntime;
    vi.clearAllMocks();
    buildManifestHarness.load.mockResolvedValue(buildManifestFixture);
  });

  afterAll(async () => {
    await unmountApp();
    delete (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT;
    vi.unstubAllGlobals();
  });

  it("shows the independently compiled commit and the runtime ontology fingerprint", async () => {
    const communityGraph = (await import(
      "../src/generated/ontology-community-graph.json"
    )).default;
    const elements = await renderApp();
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
  });

  it("shows loading and identity-mismatch diagnostics without replacing the ontology", async () => {
    const manifest = createDeferred<typeof buildManifestFixture>();
    buildManifestHarness.load.mockReturnValueOnce(manifest.promise);
    let elements = await renderApp();
    expect(byTestId(elements, "build-identity-loading").props.role).toBe("status");

    await invoke(() => manifest.reject(
      new buildManifestHarness.MismatchError("bundle mismatch"),
    ));
    elements = readElements();
    expect(byTestId(elements, "build-identity-mismatch").props.role).toBe("status");
    expect(byType(elements, "mock-ontology-graph")).toBeDefined();
  });

  it("keeps the ontology usable when runtime build information is unavailable", async () => {
    buildManifestHarness.load.mockRejectedValueOnce(new Error("manifest offline"));
    const elements = await renderApp();
    const identity = byTestId(elements, "build-identity-unavailable");
    expect(identity.props.role).toBe("status");
    expect(byType(elements, "mock-ontology-graph")).toBeDefined();
  });

  it("normalizes a non-Error manifest failure into an unavailable state reason", async () => {
    buildManifestHarness.load.mockRejectedValueOnce("manifest gateway offline");
    const { useSiteBuildManifestState } = await import(
      "../src/hooks/useSiteBuildManifestState"
    );
    let observedState: unknown;
    const identity = Object.freeze({
      canonicalVersion: buildManifestFixture.canonical_version,
      generatorVersion: buildManifestFixture.generator_version,
      sourceFingerprint: buildManifestFixture.source_fingerprint,
      canonicalFingerprint: buildManifestFixture.canonical_fingerprint,
      communityProjectionFingerprint:
        buildManifestFixture.community_projection_fingerprint,
      moduleCount: buildManifestFixture.module_count,
      conceptCount: buildManifestFixture.concept_count,
      relationCount: buildManifestFixture.relation_count,
    });
    const ManifestStateProbe = () => {
      observedState = useSiteBuildManifestState(identity);
      return null;
    };
    let probeRenderer: ReactTestRenderer | null = null;
    await act(async () => {
      probeRenderer = create(<ManifestStateProbe />);
      await Promise.resolve();
    });

    expect(observedState).toEqual({
      status: "unavailable",
      reason: "manifest gateway offline",
    });
    await act(async () => {
      probeRenderer?.unmount();
      await Promise.resolve();
    });
  });

  it("does not publish a late manifest failure after the component is unmounted", async () => {
    const manifest = createDeferred<typeof buildManifestFixture>();
    buildManifestHarness.load.mockReturnValueOnce(manifest.promise);
    await renderApp();
    const request = buildManifestHarness.load.mock.calls.at(-1)?.[0] as
      | { readonly signal: AbortSignal }
      | undefined;
    expect(request?.signal.aborted).toBe(false);

    await unmountApp();
    expect(request?.signal.aborted).toBe(true);
    await invoke(() => manifest.reject(new Error("late failure")));
    expect(renderer).toBeNull();
  });

  it("renders a valid location without a repair notice", async () => {
    fakeWindow.location.hash = `#root=${encodeURIComponent(primaryModuleRef)}&focus=${encodeURIComponent(primaryConceptRef.replace("concept:", "node:"))}`;
    const elements = await renderApp();

    expect(elements.some(({ props }) =>
      props.className === "context-repair-notice" && props.role === "status")).toBe(false);
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      primaryConceptRef,
    );
  });

  it("explains when a valid focus forces repair of an incompatible graph root", async () => {
    fakeWindow.location.hash = `#root=${encodeURIComponent(primaryModuleRef)}&focus=${encodeURIComponent(foreignConceptRef.replace("concept:", "node:"))}`;
    const elements = await renderApp();
    const notice = elements.find(({ props }) =>
      props.className === "context-repair-notice" && props.role === "status");

    expect(notice?.props.children).toBe(uiText.zh.rootRepairNotice);
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      foreignConceptRef,
    );
  });

  it("uses explicit display fallbacks when optional runtime annotations are absent", async () => {
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

    const elements = await renderApp();
    expect(elements.some(({ props }) => props["data-testid"] === "data-integrity-error")).toBe(false);
    const definitionValues = elements
      .filter(({ type }) => type === "dd")
      .map(({ props }) => props.children);
    expect(definitionValues).toContain("不适用");
    expect(definitionValues).toContain(0);
    expect(byTestId(elements, "left-statistics")).toBeDefined();
  });

  it("falls back to the ontology root when navigation receives a stale entity reference", async () => {
    let elements = await renderApp();
    await invoke(() => {
      (byType(elements, "mock-ontology-directory").props.onNavigate as (ref: string) => void)(
        "concept:RemovedConcept",
      );
    });

    elements = readElements();
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

  it("uses the relation predicate when an optional localized label is unavailable", async () => {
    const relationId = currentRelationId;
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
    let elements = await renderApp();
    const graph = byType(elements, "mock-ontology-graph").props;
    await invoke(() => {
      (graph.onFocusRelation as (id: string | null) => void)(null);
      (graph.onFocusRelation as (id: string | null) => void)(relationId);
    });

    elements = readElements();
    expect(elements.some(({ props }) =>
      props.className === "sr-live-selection" &&
      props.children === uiText.zh.focusRelation(relation.predicate))).toBe(true);
  });

  it("omits a stale breadcrumb segment while retaining the focused concept", async () => {
    const entitiesByRef = new Map(baseOntologyRuntime.index.entitiesByRef);
    entitiesByRef.delete(primaryPlaneRef);
    activeOntologyRuntime = {
      ...baseOntologyRuntime,
      index: { ...baseOntologyRuntime.index, entitiesByRef },
    };
    fakeWindow.location.hash = `#root=${encodeURIComponent(primaryConceptRef)}&focus=${encodeURIComponent(primaryConceptRef.replace("concept:", "node:"))}`;

    const elements = await renderApp();
    const breadcrumb = elements.find(({ props }) => props.className === "breadcrumb");
    if (!breadcrumb) throw new Error("Missing breadcrumb");
    expect(collectElements(breadcrumb.props.children as ReactNode).some(({ props }) =>
      props.children === primaryPlaneRef.slice("plane:".length))).toBe(false);
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      primaryConceptRef,
    );
  });

  it("runs the primary controls while keeping the graph interaction surface minimal", async () => {
    let elements = await renderApp();
    expect(elements.some(({ props }) => props.role === "status")).toBe(true);

    await invoke(() => {
      (byTestId(elements, "language-zh").props.onClick as () => void)();
      (byTestId(elements, "language-en").props.onClick as () => void)();
      (byTestId(elements, "language-ja").props.onClick as () => void)();
      (byTestId(elements, "theme-dark").props.onClick as () => void)();
      (byTestId(elements, "theme-light").props.onClick as () => void)();
    });
    elements = readElements();

    const directory = byType(elements, "mock-ontology-directory").props;
    await invoke(() => {
      (directory.onSearchQueryChange as (query: string) => void)(primaryConceptRef);
      (directory.onToggleExpanded as (ref: string) => void)(primaryModuleRef);
      (directory.onToggleExpanded as (ref: string) => void)(primaryModuleRef);
    });
    elements = readElements();

    const graph = byType(elements, "mock-ontology-graph").props;
    expect(graph.onExpandEntity).toBeUndefined();
    expect(graph.onSelectionChange).toBeUndefined();
    expect(graph.layoutMode).toBeUndefined();
    expect(graph.layoutDirection).toBeUndefined();
    await invoke(() => {
      (graph.onFocusEntity as (ref: string) => void)("concept:MissingConcept");
      (graph.onFocusEntity as (ref: string) => void)(primaryConceptRef);
      (graph.onFocusRelation as (id: string) => void)("missing-relation");
      (graph.onFocusRelation as (id: string) => void)(currentRelationId);
    });

    elements = readElements();
    expect(byType(elements, "mock-ontology-graph").props.focusedRelationId).toBe(
      currentRelationId,
    );

    const characteristics = byType(elements, "mock-ontology-characteristics").props;
    await invoke(() => {
      (characteristics.onBackToNode as () => void)();
      (characteristics.onHighlightScenario as (id: string | null) => void)("case-one");
      (characteristics.onExpandAdjacent as (ref: string) => void)(currentRelationTargetRef);
      (characteristics.onFocusEntity as (ref: string) => void)(currentRelationTargetRef);
      (characteristics.onNavigateEntity as (ref: string) => void)(primaryPlaneRef);
    });
    elements = readElements();
    expect(byType(elements, "mock-ontology-directory").props.graphRootRef).toBe(
      primaryModuleRef,
    );

    await invoke(() => {
      (byType(elements, "mock-ontology-directory").props.onNavigate as (ref: string) => void)(
        baseOntologyRuntime.index.rootRef,
      );
    });
    elements = readElements();
    await invoke(() => {
      (byType(elements, "mock-ontology-directory").props.onNavigate as (ref: string) => void)(
        primaryConceptRef,
      );
    });
    elements = readElements();

    const collapseButton = elements.find(({ props }) => typeof props["aria-expanded"] === "boolean");
    if (!collapseButton) throw new Error("Missing directory collapse control");
    await invoke(() => (collapseButton.props.onClick as () => void)());
    elements = readElements();
    expect(elements.some(({ props }) => props.className === "viewer-grid is-left-collapsed")).toBe(true);

    const breadcrumbButtons = elements.filter(
      ({ type, props }) => type === "button" && typeof props.onClick === "function" &&
        props.className === undefined && props["data-testid"] === undefined &&
        props["aria-expanded"] === undefined,
    );
    const lastBreadcrumbButton = breadcrumbButtons.at(-1);
    if (lastBreadcrumbButton?.props.onClick) {
      await invoke(() => (lastBreadcrumbButton.props.onClick as () => void)());
    }

    const download = elements.find(({ props }) => props.className === "download-link");
    if (!download) throw new Error("Missing download action");
    await invoke(() => (download.props.onClick as () => void)());
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:canonical-ontology");
  });

  it("shows one inline data error while keeping the valid graph surface mounted", async () => {
    const diagnosticId = "test-relation-points-to-missing-concept";
    activeOntologyRuntime = {
      ...baseOntologyRuntime,
      index: {
        ...baseOntologyRuntime.index,
        dataDiagnostics: [{
          code: "missing-relation-endpoint",
          ownerId: diagnosticId,
          missingId: "MissingConcept",
          message: `${diagnosticId} references MissingConcept`,
        }],
      },
    };
    const elements = await renderApp();
    const dataErrors = elements.filter(
      ({ props }) => props["data-testid"] === "data-integrity-error" && props.role === "alert",
    );

    expect(dataErrors).toHaveLength(1);
    expect(dataErrors[0]?.props.children).toContain(diagnosticId);
    expect(byType(elements, "mock-ontology-graph")).toBeDefined();
  });

  it("uses a single focused entity without exposing the superseded multi-selection contract", async () => {
    let elements = await renderApp();
    const graph = byType(elements, "mock-ontology-graph").props;
    expect(graph.onSelectionChange).toBeUndefined();
    expect(graph.selectedEntityRefs).toBeUndefined();
    await invoke(() => {
      (graph.onFocusEntity as (ref: string) => void)(currentRelationTargetRef);
    });

    elements = readElements();
    expect(byType(elements, "mock-ontology-graph").props.focusedEntityRef).toBe(
      currentRelationTargetRef,
    );
  });

  it("applies effects, normalizes hashes, restores location state, and cleans up listeners", async () => {
    let elements = await renderApp();
    expect((document.documentElement as HTMLElement).dataset.theme).toBe("dark");
    expect(directoryHeightProperty).toHaveBeenCalledWith(
      "--directory-viewport-height",
      "684px",
    );
    fakeWindow.scrollY = 500;
    await invoke(() => resizeListener?.());
    expect(directoryHeightProperty).toHaveBeenLastCalledWith(
      "--directory-viewport-height",
      "684px",
    );
    expect(addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));

    expect(fakeWindow.setTimeout).toHaveBeenCalledWith(expect.any(Function), 6000);
    await invoke(() => scheduledTimeout?.());
    expect(clearTimeout).toHaveBeenCalledWith(17);
    elements = readElements();
    expect(elements.some(({ props }) =>
      props.className === "context-repair-notice" && props.role === "status")).toBe(false);

    expect(replaceState).toHaveBeenCalled();
    expect(fakeWindow.location.hash).not.toMatch(/(?:mode|direction|predicate)=/u);
    await invoke(() => resizeListener?.());
    expect(directoryHeightProperty).toHaveBeenCalledTimes(3);

    expect(addEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));
    fakeWindow.location.hash = "#root=plane%3Aruntime-plane&focus=node%3AAgentRun";
    await invoke(() => hashListener?.());
    fakeWindow.location.hash = "#root=missing&focus=invalid";
    await invoke(() => hashListener?.());

    elements = readElements();
    expect(byType(elements, "mock-ontology-directory").props.graphRootRef).toBe(
      "root:agent-system-ontology",
    );

    await unmountApp();
    expect(removeEventListener).toHaveBeenCalledWith("hashchange", expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
