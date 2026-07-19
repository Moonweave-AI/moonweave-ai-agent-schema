import { describe, expect, it } from "vitest";

import {
  buildOntologyIndex,
  ontologyEntityRef,
} from "../src/lib/ontology-index";
import { deriveOntologyInformation } from "../src/lib/ontology-information-projection";
import { ontologyViewModelFixture } from "./fixtures/ontology-view-model.fixture";

describe("node-attached information projection", () => {
  const buildIndex = () => {
    const ontology = structuredClone(ontologyViewModelFixture) as unknown as {
      modules: Array<Record<string, unknown> & { id: string }>;
      classes: Array<Record<string, unknown> & { id: string; examples?: unknown[] }>;
    };
    const agentRun = ontology.classes.find(({ id }) => id === "AgentRun");
    if (!agentRun) throw new Error("Missing AgentRun fixture concept");
    agentRun.examples = [
      ...(agentRun.examples ?? []),
      {
        id: "AgentRun-related-LeafRun",
        related_node_ids: ["AgentRun", "RunResult", "LeafRun"],
        related_relation_ids: ["AgentRun-produces-RunResult"],
      },
    ];
    return buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );
  };

  it("does not infer confused-with nodes from unclassified examples", () => {
    const index = buildIndex();
    const entity = index.entitiesByRef.get(ontologyEntityRef("concept", "AgentRun"));
    if (!entity) throw new Error("Missing indexed AgentRun");

    const information = deriveOntologyInformation(index, entity);

    expect(information).not.toHaveProperty("typicalInputRelations");
    expect(information).not.toHaveProperty("typicalOutputRelations");
    expect(information.confusedWithEntities).toEqual([]);
  });

  it("does not infer module engineering I/O from competency questions", () => {
    const index = buildIndex();
    const entity = index.entitiesByRef.get(ontologyEntityRef("module", "run-lifecycle"));
    if (!entity) throw new Error("Missing indexed run-lifecycle module");

    const information = deriveOntologyInformation(index, entity);

    expect(information).toEqual({ confusedWithEntities: [] });
  });
});
