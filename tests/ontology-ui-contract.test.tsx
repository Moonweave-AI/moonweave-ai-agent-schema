import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { OntologyCharacteristics } from "../src/components/OntologyCharacteristics";
import { OntologyDirectory } from "../src/components/OntologyDirectory";
import { OntologyGraph } from "../src/components/OntologyGraph";
import { uiText } from "../src/i18n/ui-text";
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
    expect(uiText.en.logicalPosition).toBe("Logical position");
    expect(uiText.ja.structureConstraints).toBe("構造と制約");
    expect(JSON.stringify(uiText)).not.toMatch(/AuthorityScope|AgentRun|ToolCall/);
  });

  it("keeps App as composition only and removes the legacy parallel presentation chain", () => {
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    const uiSources = [
      app,
      readFileSync(new URL("../src/components/OntologyCharacteristics.tsx", import.meta.url), "utf8"),
      readFileSync(new URL("../src/components/OntologyGraph.tsx", import.meta.url), "utf8"),
    ].join("\n");

    expect(app.split(/\r?\n/).length).toBeLessThan(400);
    expect(uiSources).not.toMatch(/selectedRef|maturityForClass|maturityForPlane|GraphView/);
    expect(uiSources).not.toMatch(/\.slice\(0,/);
    expect(uiSources).not.toMatch(/inspector-panel|catalog-section|abox-|tbox-/);
    expect(uiSources).toMatch(/fixedNodeConstraint/);
    expect(uiSources).toMatch(/event\.key === " "[\s\S]*onExpandEntity/);
    expect(uiSources).toMatch(/event\.key === "Escape"[\s\S]*onFocusEntity\(graphRootRef\)/);
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

  it("renders exactly one graph surface with canonical direction and parallel predicates", () => {
    const { index, state, view } = buildFixture();
    const html = renderToStaticMarkup(
      <OntologyGraph
        index={index}
        view={view}
        language="en"
        theme="dark"
        graphRootRef={state.graphRootRef}
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={state.focusedRelationId}
        onFocusEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onExpandEntity={vi.fn()}
      />,
    );

    expect((html.match(/data-testid="cytoscape-graph"/g) ?? [])).toHaveLength(1);
    expect(html).toContain('data-layout-policy="canonical-primary-path-rings"');
    expect(html).toContain('data-source="concept:AgentRun" data-target="concept:RunResult"');
    expect(html).toContain('data-predicate="produces"');
    expect(html).toContain('data-predicate="finalizes"');
    expect(html).toContain('data-source="concept:RunResult" data-target="concept:AgentRun"');
  });

  it("keeps the same twelve-row detail table and discloses every collapsed list total", () => {
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

    expect((html.match(/data-detail-row=/g) ?? [])).toHaveLength(12);
    expect(html).toContain("已显示 5 / 共 7 项");
    expect(html).toContain("展开全部（共 7 项）");
    expect(html).toContain("已显示 5 / 共 9 项");
    expect(html).not.toContain("Schema view");
  });

  it("uses the same twelve rows for relation focus and distinguishes canonical relation data", () => {
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

    expect((html.match(/data-detail-row=/g) ?? [])).toHaveLength(12);
    expect(html).toContain("AgentRun-produces-RunResult");
    expect(html).toContain("AgentRun — produces → RunResult");
    expect(html).toContain("Back to node details");

    const graphHtml = renderToStaticMarkup(
      <OntologyGraph
        index={index}
        view={view}
        language="en"
        theme="dark"
        graphRootRef={state.graphRootRef}
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={relationState.focusedRelationId}
        onFocusEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onExpandEntity={vi.fn()}
      />,
    );
    expect(graphHtml).toContain('class="graph-edge-tooltip" role="tooltip"');
    expect(graphHtml).toContain("AgentRun — produces → RunResult");
  });

  it("marks instance explanation as not applicable for a module organization node", () => {
    const { index } = buildFixture();
    const state = createOntologyViewState(index, {
      graphRootRef: fixtureRefs.runLifecycleModule,
      focusedEntityRef: fixtureRefs.runLifecycleModule,
    });
    const html = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={buildVisibleConceptGraph(index, state)}
        language="zh"
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

    expect((html.match(/data-detail-row=/g) ?? [])).toHaveLength(12);
    expect(html).toContain("本节点为领域/模块组织节点，不适用实例说明");
  });

  it("shows local and inherited fields in the same node details for AssistantMessage and AudioBlock", () => {
    const index = buildOntologyIndex(
      inheritanceProjectionFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
      sourceIndex,
    );
    const renderConcept = (id: "AssistantMessage" | "AudioBlock") => {
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

    const audio = renderConcept("AudioBlock");
    expect(audio).toContain("AudioBlock sample_rate_hz");
    expect(audio).toContain("MediaBlock media_type");
    expect(audio).toContain("&quot;media_type&quot;");
  });

  it("renders real multi-target mappings and does not infer engineering I/O from arbitrary edges", () => {
    const ontology = {
      ...ontologyViewModelFixture,
      classes: ontologyViewModelFixture.classes.map((concept) =>
        concept.id === "AgentRun"
          ? {
              ...concept,
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
    const mappingSection = html.match(/data-detail-row="10"[\s\S]*?data-detail-row="11"/)?.[0] ?? "";

    expect(mappingSection).toContain('data-disclosure-id="mapping-multi-target-targets"');
    expect(mappingSection).toContain(">RunResult</button>");
    expect(mappingSection).toContain(">Tool</button>");
    expect(mappingSection).toContain("2026.1");
    expect(mappingSection).toContain("Run results and tools");
    expect(mappingSection).toContain("bidirectional");
    expect(mappingSection).toContain("lossy");
    expect(mappingSection).toContain("External enums are normalized");
    expect(mappingSection).toContain("contract-tested");
    expect(mappingSection).toContain("mapping-contract-2026-1");
    expect(mappingSection).toContain("Contract fixture validation");
    const engineeringSection = html.match(
      /data-detail-row="4"[\s\S]*?data-detail-row="5"/,
    )?.[0] ?? "";
    expect(engineeringSection).toContain("<dt>Typical input</dt>");
    expect(engineeringSection).toContain("<dt>Typical output</dt>");
    expect((engineeringSection.match(/>Not applicable<\/p>/g) ?? [])).toHaveLength(2);
    expect(engineeringSection).not.toMatch(/describes|produces|finalizes/);
  });

  it("counts hidden case steps once and disables a case path with broken references", () => {
    const caseId = "two-step-case";
    const agentCase = {
      ...ontologyViewModelFixture.classes[3].examples[0],
      id: "agent-run-case-fragment",
      kind: "case-fragment",
      scenario_id: caseId,
    };
    const resultCase = {
      ...ontologyViewModelFixture.classes[2].examples[0],
      id: "run-result-case-fragment",
      kind: "case-fragment",
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
        view={view}
        language="en"
        theme="dark"
        graphRootRef={state.graphRootRef}
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={null}
        highlightedScenarioId={caseId}
        onFocusEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onExpandEntity={vi.fn()}
      />,
    );
    expect(graphHtml).toContain("Next case steps (+2)");

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

  it("localizes derived organization edges instead of exposing raw snake_case predicates", () => {
    const { index } = buildFixture();
    const state = createOntologyViewState(index);
    const html = renderToStaticMarkup(
      <OntologyGraph
        index={index}
        view={buildVisibleConceptGraph(index, state)}
        language="en"
        theme="dark"
        graphRootRef={state.graphRootRef}
        focusedEntityRef={state.focusedEntityRef}
        focusedRelationId={null}
        onFocusEntity={vi.fn()}
        onFocusRelation={vi.fn()}
        onExpandEntity={vi.fn()}
      />,
    );

    expect(html).toContain("contains domain");
    expect(html).not.toContain(">contains_domain</button>");
  });
});
