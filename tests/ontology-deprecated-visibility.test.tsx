import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { OntologyCharacteristics } from "../src/components/OntologyCharacteristics";
import { OntologyDirectory } from "../src/components/OntologyDirectory";
import {
  buildOntologyIndex,
  ontologyEntityRef,
  ontologyPrimaryPath,
  type CanonicalConcept,
  type CanonicalOntology,
  type OntologyEntityRef,
} from "../src/lib/ontology-index";
import {
  createOntologySceneState,
  projectOntologyScene,
  type SceneBudget,
} from "../src/lib/ontology-scene";
import {
  buildVisibleConceptGraph,
  buildVisibleSceneGraph,
  createOntologyViewState,
} from "../src/lib/ontology-view-model";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

const candidatePath = resolve(
  process.cwd(),
  "build/agent-ontology-candidate/ontology/agent-ontology.json",
);
const currentArtifactPath = existsSync(candidatePath) ? candidatePath : ontologyArtifactPath();
const candidate = JSON.parse(readFileSync(currentArtifactPath, "utf8")) as CanonicalOntology;
const index = buildOntologyIndex(candidate);
const deprecatedConcepts = candidate.classes.filter(
  (concept): concept is CanonicalConcept => concept.status === "deprecated",
);
const deprecatedRefs = new Set(
  deprecatedConcepts.map(({ id }) => ontologyEntityRef("concept", id)),
);
const candidateBudget: SceneBudget = Object.freeze({
  maxNodes: 120,
  maxEdges: 220,
  semanticExpansionLimit: 120,
});

const deprecatedIds = [
  "ActorAuthorityScope",
  "ChunkBoundary",
  "ChunkContextNote",
  "ChunkOverlap",
  "ChunkQualitySignal",
  "DisclosureStage",
  "ExecutionRequest",
  "HandoffTarget",
  "MCPInteraction",
  "WorkerAgent",
] as const;

const assertNoDeprecatedNodes = (refs: readonly OntologyEntityRef[]): void => {
  expect(refs.filter((ref) => deprecatedRefs.has(ref))).toEqual([]);
  for (const ref of refs) {
    const entity = index.entitiesByRef.get(ref);
    if (entity?.kind !== "root") expect(entity?.data.status).toBe("accepted");
  }
};

describe("deprecated ontology lineage and default visibility", () => {
  it("keeps the current candidate's deprecated records and reverse replacement lineage in the index", () => {
    expect(deprecatedConcepts.map(({ id }) => id).sort()).toEqual([...deprecatedIds].sort());
    expect([...index.relationsById.values()].filter(({ status }) => status === "deprecated"))
      .toHaveLength(91);

    for (const predecessor of deprecatedConcepts) {
      for (const replacementId of predecessor.replaced_by_ids ?? []) {
        if (!index.conceptsById.has(replacementId)) continue;
        expect(
          index.deprecatedPredecessorsByReplacementConceptId
            .get(replacementId)
            ?.map(({ id }) => id),
        ).toContain(predecessor.id);
      }
    }
  });

  it("projects only accepted roots from every affected Module in both scene and legacy graphs", () => {
    const affectedModuleIds = [...new Set(deprecatedConcepts.map(({ module_id: id }) => id))];
    expect(affectedModuleIds.length).toBeGreaterThan(0);

    for (const moduleId of affectedModuleIds) {
      const moduleRef = ontologyEntityRef("module", moduleId);
      const scene = projectOntologyScene(
        index,
        createOntologySceneState(index, { rootRef: moduleRef }, candidateBudget),
      );
      const legacy = buildVisibleConceptGraph(
        index,
        createOntologyViewState(index, {
          graphRootRef: moduleRef,
          focusedEntityRef: moduleRef,
        }),
      );

      assertNoDeprecatedNodes(scene.nodeRefs);
      assertNoDeprecatedNodes(legacy.nodes.map(({ ref }) => ref));
      expect(scene.relationIds.every((id) => index.relationsById.get(id)?.status === "accepted"))
        .toBe(true);
      expect(legacy.edges.every(
        (edge) => edge.derived || index.relationsById.get(edge.id)?.status === "accepted",
      )).toBe(true);
    }
  });

  it("hides deprecated concepts from the directory tree and default search", () => {
    const workerAgent = index.conceptsById.get("WorkerAgent")!;
    const expandedRefs = new Set<OntologyEntityRef>(
      ontologyPrimaryPath(index, ontologyEntityRef("concept", "WorkerRole")),
    );
    const renderDirectory = (searchQuery: string) => renderToStaticMarkup(
      <OntologyDirectory
        index={index}
        language="en"
        graphRootRef={index.rootRef}
        focusedEntityRef={index.rootRef}
        expandedRefs={expandedRefs}
        searchQuery={searchQuery}
        onSearchQueryChange={vi.fn()}
        onNavigate={vi.fn()}
        onToggleExpanded={vi.fn()}
      />,
    );

    const hierarchy = renderDirectory("");
    expect(hierarchy).not.toContain('data-directory-ref="concept:WorkerAgent"');
    expect(hierarchy).toContain('data-directory-ref="concept:WorkerRole"');
    expect(renderDirectory("WorkerAgent")).not.toContain(
      'data-directory-ref="concept:WorkerAgent"',
    );
    expect(renderDirectory("WorkerRole")).toContain(
      'data-directory-ref="concept:WorkerRole"',
    );
  });

  it("shows reverse deprecation lineage on the accepted replacement's same-page details", () => {
    const replacementRef = ontologyEntityRef("concept", "WorkerRole");
    const sceneState = createOntologySceneState(index, { rootRef: replacementRef });
    const view = buildVisibleSceneGraph(index, sceneState, {
      focusedEntityRef: replacementRef,
    });

    expect(view.details.kind).toBe("entity");
    if (view.details.kind !== "entity") return;
    expect(view.details.collections.deprecatedPredecessors.items.map(({ id }) => id))
      .toEqual(["WorkerAgent"]);

    const html = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={view}
        language="en"
        focusedEntityRef={replacementRef}
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
    expect(html).toContain("Replaces deprecated concepts");
    expect(html).toContain("WorkerAgent");
  });

  it("resolves deprecated details explicitly without returning the node to the current graph", () => {
    const replacementRef = ontologyEntityRef("concept", "WorkerRole");
    const deprecatedRef = ontologyEntityRef("concept", "WorkerAgent");
    const view = buildVisibleSceneGraph(
      index,
      createOntologySceneState(index, { rootRef: replacementRef }),
      { focusedEntityRef: deprecatedRef },
    );

    expect(view.nodes.map(({ ref }) => ref)).not.toContain(deprecatedRef);
    expect(view.details.kind).toBe("entity");
    if (view.details.kind !== "entity") return;
    expect(view.details.entity).toMatchObject({
      id: "WorkerAgent",
      data: {
        status: "deprecated",
        replaced_by_ids: ["WorkerRole"],
      },
    });

    const html = renderToStaticMarkup(
      <OntologyCharacteristics
        index={index}
        view={view}
        language="en"
        focusedEntityRef={deprecatedRef}
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
    expect(html).toContain("deprecated");
    expect(html).toContain("WorkerRole");
    expect(html).toContain("Deprecation reason");
  });
});
