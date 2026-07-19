import type { ReactElement, ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildOntologyIndex,
  type OntologyEntityRef,
  type OntologyIndex,
} from "../src/lib/ontology-index";
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
  forceExpanded: false,
  stateTransitions: [] as unknown[],
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useMemo: (factory: () => unknown) => factory(),
    useState: (initial: unknown) => [
      reactHarness.forceExpanded ? true : initial,
      (next: unknown) => {
        if (typeof next === "function") {
          reactHarness.stateTransitions.push((next as (value: boolean) => unknown)(false));
          reactHarness.stateTransitions.push((next as (value: boolean) => unknown)(true));
        } else {
          reactHarness.stateTransitions.push(next);
        }
      },
    ],
  };
});

interface HostElement {
  readonly type: string;
  readonly props: Readonly<Record<string, unknown>>;
}

const evaluate = (node: ReactNode, hosts: HostElement[] = []): HostElement[] => {
  if (Array.isArray(node)) {
    node.forEach((child) => evaluate(child, hosts));
    return hosts;
  }
  if (!node || typeof node !== "object" || !("type" in node) || !("props" in node)) {
    return hosts;
  }
  const element = node as ReactElement<Readonly<Record<string, unknown>>>;
  if (typeof element.type === "function") {
    return evaluate(
      (element.type as (props: Readonly<Record<string, unknown>>) => ReactNode)(element.props),
      hosts,
    );
  }
  if (typeof element.type === "string") {
    hosts.push({ type: element.type, props: element.props });
  }
  evaluate(element.props.children as ReactNode, hosts);
  return hosts;
};

const invokeHostControls = (hosts: readonly HostElement[]): void => {
  for (const host of hosts) {
    if (typeof host.props.onClick === "function") {
      (host.props.onClick as () => void)();
    }
    if (typeof host.props.onChange === "function") {
      (host.props.onChange as (event: { currentTarget: { value: string } }) => void)({
        currentTarget: { value: "AgentRun" },
      });
    }
  }
};

describe("recursive directory and attached node information", () => {
  let OntologyDirectory: typeof import("../src/components/OntologyDirectory").OntologyDirectory;
  let OntologyCharacteristics: typeof import("../src/components/OntologyCharacteristics").OntologyCharacteristics;
  let index: OntologyIndex;
  let conceptView: VisibleOntologyGraph;
  const onSearchQueryChange = vi.fn();
  const onNavigate = vi.fn();
  const onToggleExpanded = vi.fn();
  const onFocusEntity = vi.fn();
  const onNavigateEntity = vi.fn();
  const onFocusRelation = vi.fn();
  const onBackToNode = vi.fn();
  const onExpandAdjacent = vi.fn();
  const onHighlightScenario = vi.fn();

  const directoryProps = (overrides: Readonly<Record<string, unknown>> = {}) => ({
    index,
    language: "en" as const,
    graphRootRef: fixtureRefs.agentRun,
    focusedEntityRef: fixtureRefs.agentRun,
    expandedRefs: new Set(index.entitiesByRef.keys()) as ReadonlySet<OntologyEntityRef>,
    searchQuery: "",
    onSearchQueryChange,
    onNavigate,
    onToggleExpanded,
    ...overrides,
  });

  const characteristicsProps = (
    view: VisibleOntologyGraph,
    overrides: Readonly<Record<string, unknown>> = {},
  ) => ({
    index,
    view,
    language: "en" as const,
    focusedEntityRef: fixtureRefs.agentRun,
    focusedRelationId: null,
    highlightedScenarioId: "attached-case",
    onFocusEntity,
    onNavigateEntity,
    onFocusRelation,
    onBackToNode,
    onExpandAdjacent,
    onHighlightScenario,
    ...overrides,
  });

  beforeAll(async () => {
    ({ OntologyDirectory } = await import("../src/components/OntologyDirectory"));
    ({ OntologyCharacteristics } = await import("../src/components/OntologyCharacteristics"));

    const agentCase = {
      ...ontologyViewModelFixture.classes[3].examples[0],
      id: "attached-agent-case",
      kind: "case-fragment",
      scenario_id: "attached-case",
    };
    const resultCase = {
      ...ontologyViewModelFixture.classes[2].examples[0],
      id: "attached-result-case",
      kind: "case-fragment",
      scenario_id: "attached-case",
    };
    const relationCase = {
      ...ontologyViewModelFixture.relations[3].examples[0],
      id: "attached-relation-case",
      kind: "case-fragment",
      scenario_id: "attached-case",
    };
    const boundaryCase = {
      ...ontologyViewModelFixture.classes[3].examples[0],
      id: "AgentRun-boundary-LeafRun",
      kind: "boundary",
      related_node_ids: ["AgentRun", "RunResult", "LeafRun"],
      related_relation_ids: ["AgentRun-produces-RunResult"],
    };
    const ontology = {
      ...ontologyViewModelFixture,
      review: {
        review_status: "accepted",
        reviewers: [{
          reviewer_id: "ontology-reviewer",
          reviewer_role: "domain",
          reviewed_on: "2026-07-13",
          decision_note: { zh: "通过", en: "Accepted", ja: "承認" },
        }],
      },
      interaction_contract: {
        localized: { zh: "交互", en: "Interaction", ja: "相互作用" },
        nested: [{ enabled: true }, "literal"],
      },
      artifact_metadata: {
        ...ontologyViewModelFixture.artifact_metadata,
        generated_from: ["ontology/node.yaml", "ontology/runtime-plane/node.yaml"],
        release_channel: "stable",
      },
      hygiene_gates: [{ id: "no-shadow", enabled: true }],
      classes: ontologyViewModelFixture.classes.map((concept) => {
        if (concept.id !== "AgentRun") return concept;
        return {
          ...concept,
          examples: [...concept.examples, agentCase, boundaryCase],
          interaction_contract: {
            localized: { zh: "交互", en: "Interaction", ja: "相互作用" },
            nested: [{ enabled: true }, "literal"],
          },
          taxonomy_contract: { reviewer: "ontology-reviewer", nested: [1, 2] },
          competency_questions: [{
            id: "cq-agent-run",
            questions: { zh: "能否执行？", en: "Can it execute?", ja: "実行できるか" },
            query: "ASK { ?run a AgentRun }",
            expected_assertion: true,
            source_claims: [],
          }],
          external_mappings: [
            null,
            {
              id: "complete-mapping",
              system: "External",
              external_identifier: "run",
              external_version: "2026.1",
              canonical_target_ids: ["RunResult", "MissingTarget"],
              mapping_kind: "lossy",
              scope: { zh: "运行", en: "Run", ja: "実行" },
              direction: "bidirectional",
              loss_notes: { zh: "枚举损失", en: "Enum loss", ja: "列挙損失" },
              conversion_note: { zh: "归一化", en: "Normalize", ja: "正規化" },
              conformance: {
                status: "contract-tested",
                test_id: "mapping-contract",
                method: { zh: "测试", en: "Test", ja: "テスト" },
              },
              status: "accepted",
              source_claims: [],
            },
          ],
          structure: {
            ...concept.structure,
            fields: concept.structure.fields.map((field, position) => position === 0
              ? {
                  ...field,
                  allowed_values: [{
                    id: "ready",
                    value: "ready",
                    labels: { zh: "就绪", en: "Ready", ja: "準備完了" },
                    definitions: { zh: "可运行", en: "Runnable", ja: "実行可能" },
                    source_claims: [concept.source_claims[0]],
                  }],
                }
              : field),
            required_relation_constraints: [{ predicate: "produces", min: 1 }],
          },
        };
      }),
      relations: ontologyViewModelFixture.relations.map((relation) =>
        relation.id === "AgentRun-produces-RunResult"
          ? {
              ...relation,
              examples: [...relation.examples, relationCase],
              boundary_context: {
                labels: { zh: "边界", en: "Boundary", ja: "境界" },
                nested: [{ strict: true }],
              },
              constraints: relation.constraints,
              conditions: [{
                id: "relation-condition",
                severity: "warning",
                expression: "source.status == completed",
                explanations: { zh: "已完成", en: "Completed", ja: "完了" },
                source_claims: [],
              }],
              deprecated_in: "3.0.0",
              replaced_by_ids: ["replacement-relation"],
              deprecation_reason: { zh: "替换", en: "Replaced", ja: "置換" },
              review: { review_status: "accepted", reviewers: [] },
            }
          : relation),
      case_paths: [
        {
          id: "attached-case",
          labels: { zh: "附着案例", en: "Attached case", ja: "付属ケース" },
          descriptions: { zh: "两步", en: "Two steps", ja: "2 ステップ" },
          steps: [
            { order: 1, case_fragment_example_id: agentCase.id, traversal_relation_id: "AgentRun-produces-RunResult" },
            { order: 2, case_fragment_example_id: resultCase.id, traversal_relation_id: "RunResult-describes-AgentRun" },
            { order: 3, case_fragment_example_id: relationCase.id, traversal_relation_id: null },
          ],
          source_claims: [ontologyViewModelFixture.source_claims[0]],
          review: { review_status: "accepted", reviewers: [] },
        },
        {
          id: "broken-case",
          labels: { zh: "断裂案例", en: "Broken case", ja: "壊れたケース" },
          descriptions: { zh: "断裂", en: "Broken", ja: "破損" },
          steps: [{ order: 1, case_fragment_example_id: "missing-example", traversal_relation_id: "missing-relation" }],
          source_claims: [],
        },
      ],
    };
    const sourceIds = [
      "source-AgentRun-1",
      "source-AgentRun-2",
      "source-AgentRun-3",
      "source-AgentRun-4",
      "source-AgentRun-5",
      "source-AgentRun-6",
      "source-AgentRun-7",
      "source-AgentRun-8",
      "source-AgentRun-9",
      "source-agent-system-ontology-1",
      "source-AgentRun-is_a-RuntimeEntity-1",
    ];
    const urls = [
      "https://example.test/one",
      "http://example.test/two",
      "ftp://example.test/three",
      "not a url",
    ];
    index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
      {
        registry_fingerprint: "component-test",
        sources: sourceIds.map((id, position) => ({
          id,
          title: `Source ${position + 1}`,
          url: urls[position % urls.length]!,
          year: position % 2 === 0 ? "2026" : "",
          source_type: "official",
          priority: "P1",
          status: "accepted",
        })),
      },
    );
    conceptView = buildVisibleConceptGraph(index, createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
      graphExpandedRefs: new Set([fixtureRefs.agentRun]),
    }));
  });

  beforeEach(() => {
    reactHarness.forceExpanded = false;
    reactHarness.stateTransitions = [];
    vi.clearAllMocks();
  });

  it("walks every logical level once, handles search states, and invokes directory controls", () => {
    const treeHosts = evaluate(OntologyDirectory(directoryProps()));
    expect(treeHosts.filter(({ props }) => typeof props["data-directory-ref"] === "string").length).toBe(
      index.entitiesByRef.size,
    );
    expect(treeHosts.some(({ props }) =>
      props.role === "tree" || props.role === "treeitem" || props.role === "group"))
      .toBe(false);
    invokeHostControls(treeHosts);
    expect(onNavigate).toHaveBeenCalled();
    expect(onToggleExpanded).toHaveBeenCalled();
    expect(onSearchQueryChange).toHaveBeenCalledWith("AgentRun");

    const searchHosts = evaluate(OntologyDirectory(directoryProps({ searchQuery: "produces" })));
    expect(searchHosts.some(({ props }) => props.className === "tree-root search-results")).toBe(true);
    invokeHostControls(searchHosts);

    const missingHosts = evaluate(OntologyDirectory(directoryProps({ searchQuery: "no-such-ontology-fact" })));
    expect(missingHosts.some(({ props }) => props.className === "directory-empty")).toBe(true);

    const cyclicChildren = new Map(index.organizationalChildrenByRef);
    cyclicChildren.set(index.rootRef, [index.rootRef, "concept:MissingConcept"]);
    const cyclicIndex = { ...index, organizationalChildrenByRef: cyclicChildren };
    const cycleHosts = evaluate(OntologyDirectory(directoryProps({ index: cyclicIndex })));
    expect(cycleHosts.filter(({ props }) =>
      typeof props["data-directory-ref"] === "string")).toHaveLength(1);
  });

  it("keeps all concept information attached and makes only visible relations focusable", () => {
    const hiddenRelationView = {
      ...conceptView,
      edges: [],
      hiddenAdjacentRefs: [fixtureRefs.runResult],
    };
    const collapsedHosts = evaluate(OntologyCharacteristics(
      characteristicsProps(hiddenRelationView),
    ));
    invokeHostControls(collapsedHosts);
    expect(onFocusRelation).not.toHaveBeenCalledWith("AgentRun-produces-RunResult");
    expect(onNavigateEntity).toHaveBeenCalled();
    expect(onExpandAdjacent).toHaveBeenCalled();
    expect(onHighlightScenario).toHaveBeenCalled();
    expect(reactHarness.stateTransitions).toEqual(expect.arrayContaining([true, false]));

    reactHarness.forceExpanded = true;
    const expandedHosts = evaluate(OntologyCharacteristics(
      characteristicsProps(conceptView, { language: "ja" }),
    ));
    expect(expandedHosts.some(({ props }) => props["data-disclosure-id"] === "local-structure-fields")).toBe(true);
    expect(expandedHosts.some(({ props }) => props["data-disclosure-id"] === "typical-input-relations")).toBe(false);
    expect(expandedHosts.some(({ props }) => props["data-disclosure-id"] === "typical-output-relations")).toBe(false);
    expect(expandedHosts.filter(({ props }) => props.className === "detail-empty").length).toBeGreaterThan(0);
    expect(expandedHosts.some(({ props }) => props["data-disclosure-id"] === "confused-with")).toBe(true);
    invokeHostControls(expandedHosts);
    expect(onFocusRelation).toHaveBeenCalled();
  });

  it("renders root case paths and canonical relation details in the same nine-row table", () => {
    reactHarness.forceExpanded = true;
    const rootState = createOntologyViewState(index);
    const rootView = buildVisibleConceptGraph(index, rootState);
    const rootHosts = evaluate(OntologyCharacteristics(characteristicsProps(rootView, {
      focusedEntityRef: index.rootRef,
      highlightedScenarioId: "attached-case",
    })));
    expect(rootHosts.filter(({ props }) => props["data-detail-row"] !== undefined)).toHaveLength(9);
    invokeHostControls(rootHosts);

    const relationId = "AgentRun-produces-RunResult";
    const relationState = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
      focusedRelationId: relationId,
      graphExpandedRefs: new Set([fixtureRefs.agentRun]),
    });
    const relationView = buildVisibleConceptGraph(index, relationState);
    const relationHosts = evaluate(OntologyCharacteristics(characteristicsProps(relationView, {
      focusedRelationId: relationId,
    })));
    expect(relationHosts.filter(({ props }) => props["data-detail-row"] !== undefined)).toHaveLength(9);
    invokeHostControls(relationHosts);
    expect(onBackToNode).toHaveBeenCalled();
    expect(onFocusEntity).toHaveBeenCalled();
  });
});
