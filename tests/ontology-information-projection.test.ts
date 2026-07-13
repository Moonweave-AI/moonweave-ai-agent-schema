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
    const module = ontology.modules.find(({ id }) => id === "run-lifecycle");
    if (!module) throw new Error("Missing run-lifecycle fixture module");
    module.competency_questions = [{
      id: "run-lifecycle-cq-interaction-closure",
      query: "interaction(module=run-lifecycle, input=RunResult-describes-AgentRun, output=AgentRun-produces-RunResult, failure=AgentRun-finalizes-RunResult, recovery=RunResult-describes-AgentRun)",
    }];
    const agentRun = ontology.classes.find(({ id }) => id === "AgentRun");
    if (!agentRun) throw new Error("Missing AgentRun fixture concept");
    agentRun.examples = [
      ...(agentRun.examples ?? []),
      {
        id: "AgentRun-boundary-LeafRun",
        kind: "boundary",
        related_node_ids: ["AgentRun", "RunResult", "LeafRun"],
        related_relation_ids: ["AgentRun-produces-RunResult"],
      },
    ];
    return buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );
  };

  it("derives Concept inputs, outputs and confused-with nodes from canonical edges and boundary examples", () => {
    const index = buildIndex();
    const entity = index.entitiesByRef.get(ontologyEntityRef("concept", "AgentRun"));
    if (!entity) throw new Error("Missing indexed AgentRun");

    const information = deriveOntologyInformation(index, entity);

    expect(information.typicalInputRelations.map(({ id }) => id)).toContain(
      "RunResult-describes-AgentRun",
    );
    expect(information.typicalOutputRelations.map(({ id }) => id)).toEqual([
      "AgentRun-produces-RunResult",
    ]);
    expect(information.typicalOutputRelations.every(({ predicate }) => predicate !== "is_a")).toBe(true);
    expect(information.confusedWithEntities.map(({ id }) => id)).toEqual(["LeafRun"]);
  });

  it("derives Module input and output relation contracts from its reviewed interaction CQ", () => {
    const index = buildIndex();
    const entity = index.entitiesByRef.get(ontologyEntityRef("module", "run-lifecycle"));
    if (!entity) throw new Error("Missing indexed run-lifecycle module");

    const information = deriveOntologyInformation(index, entity);

    expect(information.typicalInputRelations.map(({ id }) => id)).toEqual([
      "RunResult-describes-AgentRun",
    ]);
    expect(information.typicalOutputRelations.map(({ id }) => id)).toEqual([
      "AgentRun-produces-RunResult",
    ]);
    expect(information.confusedWithEntities).toEqual([]);
  });
});
