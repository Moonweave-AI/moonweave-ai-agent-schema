import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { OntologyCharacteristics } from "../src/components/OntologyCharacteristics";
import { OntologyDirectory } from "../src/components/OntologyDirectory";
import { OntologyGraph } from "../src/components/OntologyGraph";
import { uiText } from "../src/i18n/ui-text";
import {
  buildOntologyCommunityNetworkModel,
  type OntologyCommunityGraphEdge,
} from "../src/lib/ontology-community-network";
import { buildOntologyIndex } from "../src/lib/ontology-index";
import {
  buildVisibleConceptGraph,
  createOntologyViewState,
} from "../src/lib/ontology-view-model";
import {
  fixtureRefs,
  inheritanceProjectionFixture,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";
import { buildCommunityGraphFixture } from "./fixtures/ontology-community-graph.fixture";

const sourceIndex = {
  generated: true,
  do_not_edit: true,
  registry_fingerprint: "fixture-registry",
  living_fingerprint: "fixture-living",
  sources: Array.from({ length: 12 }, (_, index) => ({
    id: `source-AgentRun-${index + 1}`,
    title: `Source ${index + 1}`,
    url: `https://example.com/source-${index + 1}`,
    year: "2026",
    source_type: "official-doc",
    priority: "A",
    status: "verified",
    corpus: "fixture",
    area: "testing",
    why_it_matters: "Fixture source",
    source_file: "fixture.md",
    living: null,
  })),
} as const;

const buildFixture = () => {
  const index = buildOntologyIndex(
    ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
    sourceIndex,
  );
  const state = createOntologyViewState(index, {
    graphRootRef: fixtureRefs.agentRun,
    focusedEntityRef: fixtureRefs.agentRun,
  });
  return { index, state, view: buildVisibleConceptGraph(index, state) };
};

describe("unified graph UI contract", () => {
  it("keeps UI copy trilingual without embedding canonical entity translations", () => {
    expect(uiText.zh.hierarchy).toBe("逻辑层级与语义关系");
    expect(Object.keys(uiText.zh)).not.toEqual(expect.arrayContaining([
      "graphModeHierarchy",
      "graphModeRelations",
      "topDownLayout",
      "leftRightLayout",
      "resetScene",
      "showRelationLabels",
    ]));
    expect(uiText.en.logicalPosition).toBe("Logical position");
    expect(uiText.ja.structureConstraints).toBe("構造と制約");
    expect(uiText.en.sourcesAndReferences).toBe("Sources & citations");
    expect(uiText.ja.sourcesAndReferences).toBe("出典と引用");
    expect(Object.keys(uiText.en)).not.toEqual(expect.arrayContaining([
      "validationRules",
      "externalMappings",
      "maturityChanges",
      "status",
      "review",
      "reviewers",
      "deprecated",
      "replacements",
      "changeNote",
    ]));
    expect(JSON.stringify(uiText)).not.toMatch(/AuthorityScope|AgentRun|ToolCall/);
    expect(JSON.stringify(uiText)).not.toMatch(
      /Axioms and validation|External mappings|Maturity and change history|Replaces deprecated concepts/u,
    );
  });

  it("keeps App as composition only and removes the legacy parallel presentation chain", () => {
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    const graphSource = readFileSync(
      new URL("../src/components/OntologyGraph.tsx", import.meta.url),
      "utf8",
    );
    const runtimeSource = readFileSync(
      new URL("../src/lib/ontology-network-runtime.ts", import.meta.url), "utf8");
    const networkStyles = readFileSync(
      new URL("../src/styles/ontology-network.css", import.meta.url), "utf8");
    const uiSources = [
      app,
      readFileSync(new URL("../src/components/OntologyCharacteristics.tsx", import.meta.url), "utf8"),
      graphSource,
      runtimeSource,
    ].join("\n");

    expect(app.split(/\r?\n/).length).toBeLessThan(400);
    expect(app).toContain("useOntologyDetailScene");
    expect(app).not.toMatch(
      /useOntologyExplorerSceneActions|visibleRelationPredicates|setMode|setDirection/u,
    );
    expect(uiSources).not.toMatch(/\bselectedRef\b|maturityForClass|maturityForPlane|GraphView/);
    expect(graphSource).not.toMatch(/readonly view:|graphRootRef|layoutDirection|layoutMode/);
    expect(uiSources).not.toMatch(/inspector-panel|catalog-section|abox-|tbox-/);
    expect(uiSources).not.toMatch(/text\.status|ReviewSummary|review_status|path\.review/u);
    expect(runtimeSource).toContain('import("vis-network")');
    expect(runtimeSource).toContain('network.once("stabilizationIterationsDone"');
    expect(runtimeSource).toContain("network.stabilize(");
    expect(runtimeSource).toContain("physics: { enabled: false }");
    expect(runtimeSource).not.toMatch(/innerHTML|unpkg\.com|new Worker/);
    expect(uiSources).not.toMatch(/cytoscape|fcose|elk-layered|ontology-layout\.worker/iu);
    expect(networkStyles).not.toMatch(/graph-mode|layout-direction|graph-expansion/iu);
  });

  it("sizes the desktop directory from its measured viewport instead of height breakpoints", () => {
    const structureStyles = readFileSync(
      new URL("../src/styles/ontology-explorer-structure.css", import.meta.url),
      "utf8",
    );
    const responsiveStyles = readFileSync(
      new URL("../src/styles/ontology-details-responsive.css", import.meta.url),
      "utf8",
    );

    expect(structureStyles).toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(responsiveStyles).not.toMatch(
      /@media\s*\(min-width:\s*1181px\)\s*and\s*\(max-height:/u,
    );
  });

  it("renders the primary directory recursively to arbitrary concept depth", () => {
    const { index, state } = buildFixture();
    const html = renderToStaticMarkup(
      <OntologyDirectory
        index={index}
        language="en"
        graphRootRef={state.graphRootRef}
        focusedEntityRef={state.focusedEntityRef}
        expandedRefs={new Set([
          fixtureRefs.root,
          fixtureRefs.runtimePlane,
          fixtureRefs.runLifecycleModule,
          fixtureRefs.runtimeEntity,
          fixtureRefs.agentRun,
        ])}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onNavigate={vi.fn()}
        onToggleExpanded={vi.fn()}
      />,
    );

    expect(html).toContain('data-directory-ref="concept:LeafRun"');
    expect(html).toContain('data-directory-depth="5"');
    expect((html.match(/data-directory-ref="concept:AgentRun"/g) ?? [])).toHaveLength(1);
  });

  it("searches reviewed example, source, relation, and case metadata without shadow nodes", () => {
    const { index, state } = buildFixture();
    const renderSearch = (searchQuery: string) =>
      renderToStaticMarkup(
        <OntologyDirectory
          index={index}
          language="en"
          graphRootRef={state.graphRootRef}
          focusedEntityRef={state.focusedEntityRef}
          expandedRefs={new Set([fixtureRefs.root])}
          searchQuery={searchQuery}
          onSearchQueryChange={vi.fn()}
          onNavigate={vi.fn()}
          onToggleExpanded={vi.fn()}
        />,
      );

    expect(renderSearch("Example 8 for AgentRun")).toContain(
      'data-directory-ref="concept:AgentRun"',
    );
    expect(renderSearch("Source 9")).toContain('data-directory-ref="concept:AgentRun"');
    expect(renderSearch("Case path annotation")).toContain(
      'data-directory-ref="root:agent-system-ontology"',
    );
    expect(renderSearch("finalizes")).toContain('data-directory-ref="concept:AgentRun"');
  });

  it("renders exactly one Graphify-style graph surface", () => {
    const { index, state } = buildFixture();
    const html = renderToStaticMarkup(
      <OntologyGraph
        index={index}
        language="en"
        theme="dark"
        canonicalFingerprint={`sha256:${buildCommunityGraphFixture(index).source_sha256}`}
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={state.focusedRelationId}
        communityGraph={buildCommunityGraphFixture(index)}
        onFocusEntity={vi.fn()}
        onFocusRelation={vi.fn()}
      />,
    );

    expect((html.match(/data-testid="ontology-network-graph"/g) ?? [])).toHaveLength(1);
    expect(html).toContain('data-layout-engine="vis-network-forceatlas2"');
    expect(html).toContain('data-node-color-policy="canonical-module-owner"');
    expect(html).toContain('data-edge-label-policy="hover-only"');
    expect(html).not.toMatch(/Logical hierarchy|Relation exploration|layout-direction/u);
  });

  it("keeps an eight-row detail table without obsolete validation, mapping, or maturity sections", () => {
    const { index, state, view } = buildFixture();
    const html = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={view}
        language="zh"
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={state.focusedRelationId}
        highlightedScenarioId={null}
        onFocusEntity={vi.fn()}
        onNavigateEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onBackToNode={vi.fn()}
        onExpandAdjacent={vi.fn()}
        onHighlightScenario={vi.fn()}
      />,
    );

    expect((html.match(/data-detail-row=/g) ?? [])).toHaveLength(8);
    expect(html).toContain("已显示 5 / 共 7 项");
    expect(html).toContain("展开全部（共 7 项）");
    expect(html).toContain("已显示 5 / 共 9 项");
    expect(html).not.toContain("Schema view");
    expect(html).not.toContain("\u516c\u7406\u4e0e\u9a8c\u8bc1");
    expect(html).not.toContain("\u9002\u914d\u6620\u5c04");
    expect(html).not.toContain("\u6210\u719f\u5ea6\u4e0e\u53d8\u66f4");
    expect(html).toContain("\u6765\u6e90\u4e0e\u5f15\u7528");
  });

  it("uses the same eight rows for relation focus and distinguishes canonical relation data", () => {
    const { index, state } = buildFixture();
    const relationState = {
      ...state,
      focusedRelationId: "AgentRun-produces-RunResult",
    };
    const view = buildVisibleConceptGraph(index, relationState);
    const html = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={view}
        language="en"
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={relationState.focusedRelationId}
        highlightedScenarioId={null}
        onFocusEntity={vi.fn()}
        onNavigateEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onBackToNode={vi.fn()}
        onExpandAdjacent={vi.fn()}
        onHighlightScenario={vi.fn()}
      />,
    );

    expect((html.match(/data-detail-row=/g) ?? [])).toHaveLength(8);
    expect(html).toContain("AgentRun-produces-RunResult");
    expect(html).toContain("AgentRun — produces → RunResult");
    expect(html).toContain("Back to node details");
    expect(html).not.toMatch(/Axioms and validation|External mappings|Maturity and change history/u);
    expect(html).not.toContain("<dt>Status</dt>");
    expect(html).toContain("Sources &amp; citations");

    const graphHtml = renderToStaticMarkup(
      <OntologyGraph
        index={index}
        language="en"
        theme="dark"
        canonicalFingerprint={`sha256:${buildCommunityGraphFixture(index).source_sha256}`}
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={relationState.focusedRelationId}
        communityGraph={buildCommunityGraphFixture(index)}
        onFocusEntity={vi.fn()}
        onFocusRelation={vi.fn()}
      />,
    );
    expect(graphHtml).toContain('data-edge-label-policy="hover-only"');
    expect(graphHtml).not.toContain('class="graph-edge-tooltip"');
  });

  it("presents module examples without assigning them an example kind", () => {
    const { index } = buildFixture();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.runLifecycleModule,
      focusedEntityRef: fixtureRefs.runLifecycleModule,
    });
    const html = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={buildVisibleConceptGraph(index, state)}
        language="en"
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={null}
        highlightedScenarioId={null}
        onFocusEntity={vi.fn()}
        onNavigateEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onBackToNode={vi.fn()}
        onExpandAdjacent={vi.fn()}
        onHighlightScenario={vi.fn()}
      />,
    );

    expect((html.match(/data-detail-row=/g) ?? [])).toHaveLength(8);
    expect(html).toContain("Examples");
    expect(html).toContain("run-lifecycle example 1");
    expect(html).not.toContain("Instance examples");
  });

  it("shows local and inherited fields in the same node details for AssistantMessage and AudioContent", () => {
    const index = buildOntologyIndex(
      inheritanceProjectionFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
      sourceIndex,
    );
    const renderConcept = (id: "AssistantMessage" | "AudioContent") => {
      const ref = `concept:${id}` as const;
      const state = createOntologyViewState(index, {
        graphRootRef: ref,
        focusedEntityRef: ref,
      });
      return renderToStaticMarkup(
        <OntologyCharacteristics
          index={index}
          view={buildVisibleConceptGraph(index, state)}
          language="en"
          focusedEntityRef={ref}
          focusedRelationId={null}
          highlightedScenarioId={null}
          onFocusEntity={vi.fn()}
          onNavigateEntity={vi.fn()}
          onFocusRelation={vi.fn()}
          onBackToNode={vi.fn()}
          onExpandAdjacent={vi.fn()}
          onHighlightScenario={vi.fn()}
        />,
      );
    };

    const assistant = renderConcept("AssistantMessage");
    expect(assistant).toContain("Locally declared fields");
    expect(assistant).toContain("Inherited fields");
    expect(assistant).toContain("AssistantMessage assistant_role");
    expect(assistant).toContain("Message message_id");
    expect(assistant).toContain("Declared on concept");
    expect(assistant).toContain("Inheritance depth");
    expect(assistant).toMatch(/&quot;assistant_role&quot;:[\s\S]*&quot;message_id&quot;/);

    const audio = renderConcept("AudioContent");
    expect(audio).toContain("AudioContent sample_rate_hz");
    expect(audio).toContain("MediaContent media_type");
    expect(audio).toContain("&quot;media_type&quot;");
  });

  it("renders authored engineering content without mapping or relation-derived I/O", () => {
    const ontology = {
      ...ontologyViewModelFixture,
      classes: ontologyViewModelFixture.classes.map((concept) =>
        concept.id === "AgentRun"
            ? {
              ...concept,
              engineering: {
                explanation: {
                  zh: "\u5de5\u7a0b\u8bf4\u660e\u6765\u81ea\u5df2\u5ba1\u6838\u7684\u534f\u8bae\u8f93\u5165\u8f93\u51fa\u3002",
                  en: "Engineering guidance comes from the reviewed protocol contract.",
                  ja: "\u5de5\u5b66\u7684\u8aac\u660e\u306f\u30ec\u30d3\u30e5\u30fc\u6e08\u307f\u30d7\u30ed\u30c8\u30b3\u30eb\u5951\u7d04\u306b\u57fa\u3065\u304d\u307e\u3059\u3002",
                },
                typical_input: [{
                  description: "MCP tools/list request",
                  format: '{"jsonrpc":"2.0","method":"tools/list","params":{}}',
                }],
                typical_output: [{
                  description: "MCP tools/list response",
                  format: '{"result":{"tools":[]}}',
                }],
                reference_implementations: [{
                  name: "MCP Tools Specification",
                  url: "https://modelcontextprotocol.io/specification/server/tools",
                  description: "Defines the tools/list request and response contract.",
                }],
              },
              external_mappings: [{
                id: "mapping-multi-target",
                system: "external-system",
                external_identifier: "ExternalRecord",
                external_version: "2026.1",
                canonical_target_ids: ["RunResult", "Tool"],
                mapping_kind: "lossy",
                scope: { zh: "运行结果与工具", en: "Run results and tools", ja: "実行結果とツール" },
                direction: "bidirectional",
                loss_notes: { zh: "外部枚举会归一化", en: "External enums are normalized", ja: "外部列挙値は正規化される" },
                conversion_note: { zh: "需转换", en: "Conversion required", ja: "変換が必要" },
                conformance: {
                  status: "contract-tested",
                  test_id: "mapping-contract-2026-1",
                  method: { zh: "契约样例验证", en: "Contract fixture validation", ja: "契約フィクスチャ検証" },
                },
                status: "accepted",
                source_claims: [],
              }],
            }
          : concept,
      ),
    };
    const index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
      sourceIndex,
    );
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.agentRun,
      focusedEntityRef: fixtureRefs.agentRun,
    });
    const html = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={buildVisibleConceptGraph(index, state)}
        language="en"
        focusedEntityRef={fixtureRefs.agentRun}
        focusedRelationId={null}
        highlightedScenarioId={null}
        onFocusEntity={vi.fn()}
        onNavigateEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onBackToNode={vi.fn()}
        onExpandAdjacent={vi.fn()}
        onHighlightScenario={vi.fn()}
      />,
    );
    const engineeringSection = html.match(
      /data-detail-row="4"[\s\S]*?data-detail-row="5"/,
    )?.[0] ?? "";
    expect(engineeringSection).toContain("Engineering guidance comes from the reviewed protocol contract.");
    expect(engineeringSection).toContain("<dt>Typical input</dt>");
    expect(engineeringSection).toContain("MCP tools/list request");
    expect(engineeringSection).toContain("&quot;method&quot;:&quot;tools/list&quot;");
    expect(engineeringSection).toContain("<dt>Typical output</dt>");
    expect(engineeringSection).toContain("MCP tools/list response");
    expect(engineeringSection).toContain("MCP Tools Specification");
    expect(engineeringSection).toContain("https://modelcontextprotocol.io/specification/server/tools");
    expect(engineeringSection).not.toMatch(/describes|produces|finalizes/);
    expect(html).not.toContain("ExternalRecord");
    expect(html).not.toContain("External mappings");
  });

  it("counts hidden case steps once and disables a case path with broken references", () => {
    const caseId = "two-step-case";
    const agentCase = {
      ...ontologyViewModelFixture.classes[3].examples[0],
      id: "agent-run-case-fragment",
      scenario_id: caseId,
    };
    const resultCase = {
      ...ontologyViewModelFixture.classes[2].examples[0],
      id: "run-result-case-fragment",
      scenario_id: caseId,
    };
    const ontology = {
      ...ontologyViewModelFixture,
      classes: ontologyViewModelFixture.classes.map((concept) => {
        if (concept.id === "AgentRun") return { ...concept, examples: [...concept.examples, agentCase] };
        if (concept.id === "RunResult") return { ...concept, examples: [...concept.examples, resultCase] };
        return concept;
      }),
      case_paths: [
        ...ontologyViewModelFixture.case_paths,
        {
          id: caseId,
          labels: { zh: "两步案例", en: "Two-step case", ja: "2 ステップケース" },
          descriptions: { zh: "两步案例", en: "Two-step case", ja: "2 ステップケース" },
          steps: [
            { order: 1, case_fragment_example_id: agentCase.id, traversal_relation_id: "AgentRun-produces-RunResult" },
            { order: 2, case_fragment_example_id: resultCase.id, traversal_relation_id: "RunResult-describes-AgentRun" },
          ],
          source_claims: [],
        },
        {
          id: "broken-case",
          labels: { zh: "断裂案例", en: "Broken case", ja: "壊れたケース" },
          descriptions: { zh: "断裂案例", en: "Broken case", ja: "壊れたケース" },
          steps: [
            { order: 1, case_fragment_example_id: "missing-case-fragment", traversal_relation_id: "missing-relation" },
          ],
          source_claims: [],
        },
      ],
    };
    const index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
      sourceIndex,
    );
    const state = createOntologyViewState(index);
    const view = buildVisibleConceptGraph(index, state);
    const graphHtml = renderToStaticMarkup(
      <OntologyGraph
        index={index}
        language="en"
        theme="dark"
        canonicalFingerprint={`sha256:${buildCommunityGraphFixture(index).source_sha256}`}
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={null}
        communityGraph={buildCommunityGraphFixture(index)}
        onFocusEntity={vi.fn()}
        onFocusRelation={vi.fn()}
      />,
    );
    expect(graphHtml).toContain('data-layout-engine="vis-network-forceatlas2"');

    const detailsHtml = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={view}
        language="en"
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={null}
        highlightedScenarioId={caseId}
        onFocusEntity={vi.fn()}
        onNavigateEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onBackToNode={vi.fn()}
        onExpandAdjacent={vi.fn()}
        onHighlightScenario={vi.fn()}
      />,
    );
    expect(detailsHtml).toContain("missing-case-fragment, missing-relation");
    expect(detailsHtml).toMatch(/disabled=""[^>]*>Highlight this case/);
    expect(detailsHtml).toContain("Current step: 1. AgentRun example 1");
  });

  it("localizes derived organization edges without exposing them as canonical facts", () => {
    const { index } = buildFixture();
    const base = buildCommunityGraphFixture(index);
    const planeRef = [...index.entitiesByRef.keys()].find(
      (ref) => ref.startsWith("plane:"),
    ) as `plane:${string}`;
    const derived: OntologyCommunityGraphEdge = {
      id: "derived-root-plane",
      source: index.rootRef,
      target: planeRef,
      relation: "contains_domain",
      evidence: "derived",
      relation_kind: "composition",
      layout_role: "ownership",
    };
    const model = buildOntologyCommunityNetworkModel(index, {
      ...base,
      metrics: { ...base.metrics, edge_count: base.metrics.edge_count + 1 },
      edges: [...base.edges, derived],
    }, "en", "dark");

    expect(model.edges.at(-1)).toMatchObject({
      relationLabel: "contains domain",
      canonicalRelationId: null,
      dashes: true,
    });
  });
});
