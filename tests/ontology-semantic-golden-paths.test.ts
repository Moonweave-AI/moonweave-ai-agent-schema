import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ontologyArtifactPath } from "./helpers/ontology-artifact";

interface Concept {
  readonly id: string;
  readonly module_id: string;
  readonly semantic_kind: string;
  readonly status: string;
  readonly primary_parent_relation_id?: string | null;
  readonly replaced_by_ids?: readonly string[];
}

interface Relation {
  readonly id: string;
  readonly predicate: string;
  readonly source_id: string;
  readonly target_id: string;
  readonly status: string;
  readonly layout_role?: "primary-backbone" | "secondary-backbone" | "cross-link";
  readonly layout_parent_id?: string | null;
  readonly layout_child_id?: string | null;
  readonly replaced_by_ids?: readonly string[];
}

interface Ontology {
  readonly classes: readonly Concept[];
  readonly relations: readonly Relation[];
}

const ontology = (): Ontology =>
  JSON.parse(readFileSync(ontologyArtifactPath(), "utf8")) as Ontology;

const goldenFacts = {
  delegation: [
    ["DelegationProcess", "is_a", "CollaborationProcess"],
    ["HandoffProcess", "is_a", "CollaborationProcess"],
    ["InitiationPhase", "is_a", "DelegationPhase"],
    ["AcceptancePhase", "is_a", "DelegationPhase"],
    ["RevocationPhase", "is_a", "DelegationPhase"],
    ["CompletionPhase", "is_a", "DelegationPhase"],
    ["DelegationPhase", "phase_of", "DelegationProcess"],
    ["DelegationEvent", "records_phase", "DelegationPhase"],
    ["DelegationProcess", "produces", "DelegationResult"],
    ["DelegationContract", "specifies", "ContextIsolation"],
    ["ContextIsolation", "bounds", "DelegationContext"],
    ["SubagentContext", "is_a", "DelegationContext"],
    ["DelegationContract", "specifies", "WorkItem"],
    ["WorkerSelectionProcess", "uses", "WorkerPool"],
    ["WorkerSelectionDecisionActivity", "precedes", "WorkerAssignment"],
    ["HandoffProcess", "results_in", "ResponsibilityTransfer"],
    ["Handoff", "transfers_control_to", "AgentActor"],
    ["AgentAsToolInvocation", "is_a", "ProgrammaticToolCall"],
  ],
  context: [
    ["LightweightRetrieval", "is_a", "DiscoveryActivity"],
    ["DiscoveryActivity", "produces", "DiscoveryResult"],
    ["ContextAssembly", "consumes", "DiscoveryResult"],
    ["ContextAssembly", "produces", "ContextPackage"],
    ["ContextPackage", "has_visible_window", "VisibleContextWindow"],
    ["ContextSelectionDecision", "selects_from", "VisibleContextWindow"],
    ["DisclosureActivity", "produces", "DisclosureRecord"],
    ["DisclosurePublicationActivity", "produces", "DisclosedOutputSegment"],
  ],
  execution: [
    ["TaskPlan", "specifies", "Task"],
    ["RunAttempt", "run_attempt_belongs_to_task", "Task"],
    ["Execution", "has_attempt", "RunAttempt"],
    ["RunAttempt", "produces", "RunResult"],
    ["RunResult", "evidences", "RunOutcome"],
    ["RuntimeBudget", "constrains", "RunAttempt"],
    ["ToolCallAttempt", "is_a", "RunAttempt"],
  ],
  evaluation: [
    ["EvaluationRun", "uses", "EvaluationSpecification"],
    ["EvaluationRun", "produces", "Measurement"],
    ["Measurement", "conforms_to", "Metric"],
    ["Score", "may_trigger", "Correction"],
    ["CorrectionActivity", "followed_by", "EvaluationRun"],
    ["OptimizationLoop", "consumes", "LearningSignal"],
    ["OptimizationLoop", "optimizes", "OptimizationTarget"],
    ["OptimizationLoop", "produces", "ChangeProposal"],
    ["LearningSignal", "supports", "ChangeProposal"],
    ["ChangeProposal", "requires", "PolicyDecision"],
  ],
  memory: [
    ["IngestionRun", "produces", "Document"],
    ["ChunkingRun", "consumes", "Document"],
    ["ChunkingRun", "produces", "Chunk"],
    ["EmbeddingRun", "embedding_run_embeds_chunk", "Chunk"],
    ["EmbeddingRun", "produces", "EmbeddingVector"],
    ["IndexBuildRun", "produces", "IndexVersion"],
    ["RetrievalRequest", "has_query", "RetrievalQuery"],
    ["RetrievalRequest", "targets", "IndexVersion"],
    ["RetrievalRun", "fulfills", "RetrievalRequest"],
    ["RetrievalRun", "reads", "IndexVersion"],
    ["RetrievalRun", "produces", "CandidateSet"],
    ["RetrievalRun", "produces", "RetrievalResult"],
    ["ContextAssembly", "consumes", "RetrievedChunk"],
    ["ContextAssembly", "produces", "ContextPackage"],
    ["MemoryWrite", "produces", "MemoryRecord"],
    ["MemoryStore", "stores", "MemoryRecord"],
  ],
} as const;

describe("reviewed semantic golden paths", () => {
  it.each(Object.entries(goldenFacts))("keeps the %s chain continuous", (_name, facts) => {
    const accepted = ontology().relations.filter(({ status }) => status === "accepted");
    const missing = facts.flatMap(([sourceId, predicate, targetId]) =>
      accepted.some((relation) =>
        relation.source_id === sourceId &&
        relation.predicate === predicate &&
        relation.target_id === targetId,
      )
        ? []
        : [`${sourceId}-${predicate}-${targetId}`],
    );

    expect(missing).toEqual([]);
  });

  it("keeps prompt templates with prompt semantics and separates template from instance", () => {
    const candidate = ontology();
    const concepts = new Map(candidate.classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("PromptTemplate")).toMatchObject({
      module_id: "info-prompts-instructions",
      semantic_kind: "specification",
      status: "accepted",
    });
    expect(concepts.get("PromptTemplateInstance")).toMatchObject({
      module_id: "info-prompts-instructions",
      semantic_kind: "information",
      status: "accepted",
    });
    expect(candidate.relations).toContainEqual(expect.objectContaining({
      source_id: "PromptTemplateInstance",
      predicate: "instantiates",
      target_id: "PromptTemplate",
      status: "accepted",
    }));
  });

  it("separates network denial from network calls and network policy from process isolation", () => {
    const accepted = ontology().relations.filter(({ status }) => status === "accepted");
    expect(accepted).not.toContainEqual(expect.objectContaining({
      source_id: "DeniedNetworkCall",
      predicate: "is_a",
      target_id: "NetworkCall",
    }));
    expect(accepted).not.toContainEqual(expect.objectContaining({
      source_id: "NetworkPolicy",
      predicate: "is_a",
      target_id: "IsolationSpecification",
    }));
    expect(accepted).toContainEqual(expect.objectContaining({
      source_id: "NetworkCall",
      predicate: "may_produce",
      target_id: "DeniedNetworkCall",
    }));
    expect(accepted).toContainEqual(expect.objectContaining({
      source_id: "NetworkPolicy",
      predicate: "is_a",
      target_id: "PolicySpecification",
    }));
  });

  it("requires learning signals to support proposals instead of mutating governed targets", () => {
    const accepted = ontology().relations.filter(({ status }) => status === "accepted");
    const directUpdateViolations = accepted.filter((relation) =>
      relation.source_id === "LearningSignal" &&
      (relation.predicate.includes("updates") || relation.predicate === "is_a" && relation.target_id === "Feedback"),
    );
    expect(directUpdateViolations).toEqual([]);
  });

  it("keeps run results and terminal outcomes as separate identities", () => {
    const candidate = ontology();
    const concepts = new Map(candidate.classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("RunResult")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(concepts.get("RunOutcome")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(candidate.relations.filter(({ status }) => status === "accepted")).not.toContainEqual(
      expect.objectContaining({
        source_id: "RunAttempt",
        predicate: "produces",
        target_id: "RunOutcome",
      }),
    );
  });

  it("closes delegation, handoff, worker-selection, and agent-as-tool semantics without false peers", () => {
    const candidate = ontology();
    const concepts = new Map(candidate.classes.map((concept) => [concept.id, concept]));
    const relations = new Map(candidate.relations.map((relation) => [relation.id, relation]));

    expect(concepts.get("DelegationContext")).toMatchObject({
      module_id: "orchestration-delegation-handoff",
      semantic_kind: "information",
      status: "accepted",
      primary_parent_relation_id: null,
    });
    expect(concepts.get("SubagentContext")?.primary_parent_relation_id).toBe(
      "SubagentContext-is_a-DelegationContext",
    );
    expect(concepts.get("AgentAsToolInvocation")).toMatchObject({
      module_id: "tool-invocation-execution",
      semantic_kind: "activity",
      status: "accepted",
      primary_parent_relation_id: "AgentAsToolInvocation-is_a-ProgrammaticToolCall",
    });
    expect(concepts.get("HandoffTarget")).toMatchObject({
      status: "deprecated",
      replaced_by_ids: ["AgentActor"],
    });

    const primary = (
      id: string,
      parentId: string,
      childId: string,
    ): void => {
      expect(relations.get(id)).toMatchObject({
        status: "accepted",
        layout_role: "primary-backbone",
        layout_parent_id: parentId,
        layout_child_id: childId,
      });
    };
    primary("DelegationContract-specifies-ContextIsolation", "DelegationContract", "ContextIsolation");
    primary("ContextIsolation-bounds-DelegationContext", "ContextIsolation", "DelegationContext");
    primary("SubagentContext-is_a-DelegationContext", "DelegationContext", "SubagentContext");
    primary("WorkerSelectionProcess-uses-WorkerPool", "WorkerSelectionProcess", "WorkerPool");
    primary(
      "WorkerSelectionDecisionActivity-precedes-WorkerAssignment",
      "WorkerSelectionDecisionActivity",
      "WorkerAssignment",
    );
    primary(
      "HandoffProcess-results_in-ResponsibilityTransfer",
      "HandoffProcess",
      "ResponsibilityTransfer",
    );
    primary(
      "AgentAsToolInvocation-is_a-ProgrammaticToolCall",
      "ProgrammaticToolCall",
      "AgentAsToolInvocation",
    );

    expect(relations.get("WorkerSelectionDecisionActivity-selects_from-WorkerPool")).toMatchObject({
      status: "accepted",
      layout_role: "secondary-backbone",
    });
    expect(relations.get("WorkerAssignment-phase_of-WorkerSelectionProcess")).toMatchObject({
      status: "accepted",
      layout_role: "secondary-backbone",
    });
    expect(relations.get("Handoff-causes-ResponsibilityTransfer")).toMatchObject({
      status: "accepted",
      layout_role: "secondary-backbone",
    });

    for (const deprecatedId of [
      "AgentAsToolInvocation-is_a-DelegationProcess",
      "DelegationContract-bounds-SubagentContext",
      "TaskDistribution-is_a-DelegationProcess",
      "transfers_control_to",
    ]) {
      expect(relations.get(deprecatedId)?.status, deprecatedId).toBe("deprecated");
    }
  });
});
