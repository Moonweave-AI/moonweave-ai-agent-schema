import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ontologyArtifactPath } from "./helpers/ontology-artifact";

interface Field {
  readonly id: string;
}

interface Concept {
  readonly id: string;
  readonly semantic_kind: string;
  readonly status: string;
  readonly [key: string]: unknown;
  readonly structure?: {
    readonly identity_keys?: readonly string[];
    readonly fields?: readonly Field[];
    readonly constraints?: readonly { readonly id: string }[];
  };
}

interface Relation {
  readonly id: string;
  readonly predicate: string;
  readonly source_id: string;
  readonly target_id: string;
  readonly status: string;
}

interface Ontology {
  readonly classes: readonly Concept[];
  readonly relations: readonly Relation[];
}

const readOntology = (): Ontology =>
  JSON.parse(readFileSync(ontologyArtifactPath(), "utf8")) as Ontology;

const acceptedFact = (
  relations: readonly Relation[],
  sourceId: string,
  predicate: string,
  targetId: string,
): boolean => relations.some((relation) =>
  relation.status === "accepted" &&
  relation.source_id === sourceId &&
  relation.predicate === predicate &&
  relation.target_id === targetId,
);

describe("semantic agency and whole-part integrity", () => {
  it("does not advertise deprecated relations in accepted node information", () => {
    const { classes, relations } = readOntology();
    const deprecatedRelationIds = relations
      .filter(({ status }) => status === "deprecated")
      .map(({ id }) => id);
    const acceptedPredicates = new Set(
      relations.filter(({ status }) => status === "accepted").map(({ predicate }) => predicate),
    );
    const deprecatedNarrativeRelationIds = deprecatedRelationIds
      .filter((relationId) => !acceptedPredicates.has(relationId));
    const violations = classes
      .filter(({ status }) => status === "accepted")
      .flatMap((concept) => {
        const serialized = JSON.stringify(concept);
        return deprecatedNarrativeRelationIds.flatMap((relationId) =>
          serialized.includes(relationId) ? [`${concept.id}:${relationId}`] : [],
        );
      });

    expect(violations).toEqual([]);
  });

  it("uses request-run-result semantics for retrieval instead of assigning agency to a query", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));

    expect(concepts.get("RetrievalRequest")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(concepts.get("RetrievalRun")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("RetrievalResult")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "RetrievalRequest", "has_query", "RetrievalQuery")).toBe(true);
    expect(acceptedFact(relations, "RetrievalRun", "fulfills", "RetrievalRequest")).toBe(true);
    expect(acceptedFact(relations, "RetrievalRun", "produces", "CandidateSet")).toBe(true);
    expect(acceptedFact(relations, "RetrievalRun", "produces", "RetrievalResult")).toBe(true);

    const queryAgency = relations.filter((relation) =>
      relation.status === "accepted" &&
      relation.source_id === "RetrievalQuery" &&
      ["produces", "queries", "retrieves_chunk", "uses"].includes(relation.predicate),
    );
    expect(queryAgency).toEqual([]);
  });

  it("models context slots, sources, and delivery without part-as-kind or activity-as-artifact errors", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(relations.filter((relation) =>
      relation.status === "accepted" &&
      ["ContextSlot-is_a-ContextArtifact", "ContextSource-is_a-ContextArtifact", "ContextAssembly-delivered_to-RunAttempt"].includes(relation.id),
    )).toEqual([]);
    expect(acceptedFact(relations, "ContextPackage", "delivered_to", "RunAttempt")).toBe(true);
    expect(acceptedFact(relations, "Message", "references_context", "ContextPackage")).toBe(true);
    expect(concepts.get("VisibleContextWindow")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "VisibleContextWindow", "conforms_to", "OutputWindow")).toBe(true);
  });

  it("makes selection, ordering, and trimming explicit phases of context assembly", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    for (const id of ["ContextSelectionActivity", "ContextOrderingActivity", "ContextTrimmingActivity"]) {
      expect(concepts.get(id)).toMatchObject({ semantic_kind: "activity", status: "accepted" });
      expect(acceptedFact(relations, "ContextAssembly", "has_phase", id)).toBe(true);
    }
    expect(acceptedFact(relations, "ContextSelectionActivity", "precedes", "ContextOrderingActivity")).toBe(true);
    expect(acceptedFact(relations, "ContextOrderingActivity", "precedes", "ContextTrimmingActivity")).toBe(true);
  });

  it("models evaluation scenario, rubric, and criterion as specification parts", () => {
    const { relations } = readOntology();
    for (const id of [
      "EvaluationScenario-is_a-EvaluationSpecification",
      "Rubric-is_a-EvaluationSpecification",
      "EvaluationCriterion-is_a-EvaluationSpecification",
      "metric_measures_run_attempt",
      "metric_measures_tool_call",
    ]) {
      expect(relations).not.toContainEqual(expect.objectContaining({ id, status: "accepted" }));
    }
    expect(acceptedFact(relations, "EvaluationSpecification", "contains_scenario", "EvaluationScenario")).toBe(true);
    expect(acceptedFact(relations, "EvaluationSpecification", "contains_rubric", "Rubric")).toBe(true);
    expect(acceptedFact(relations, "EvaluationSpecification", "contains_criterion", "EvaluationCriterion")).toBe(true);
    expect(acceptedFact(relations, "Measurement", "observes", "RunAttempt")).toBe(true);
    expect(acceptedFact(relations, "Measurement", "observes", "ToolCall")).toBe(true);
  });

  it("keeps index refresh and chunk references attached to activities and source chunks", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("IndexRefreshRun")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(relations).not.toContainEqual(expect.objectContaining({ id: "IndexRefreshEvent-produces-IndexVersion", status: "accepted" }));
    expect(relations).not.toContainEqual(expect.objectContaining({ id: "ChunkReference-is_a-ChunkArtifact", status: "accepted" }));
    expect(acceptedFact(relations, "IndexRefreshEvent", "triggers", "IndexRefreshRun")).toBe(true);
    expect(acceptedFact(relations, "IndexRefreshRun", "produces", "IndexVersion")).toBe(true);
    expect(acceptedFact(relations, "IndexShard", "contains", "IndexEntry")).toBe(true);
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "IndexEntry-part_of-IndexShard",
      status: "accepted",
    }));
    expect(acceptedFact(relations, "Chunk", "has_reference", "ChunkReference")).toBe(true);
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "ChunkReference-references-Chunk",
      status: "accepted",
    }));
  });

  it("keeps suppression agency on disclosure activities and records its decision basis", () => {
    const { relations } = readOntology();
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "ContextSelectionDecision-suppresses-SuppressedContext",
      status: "accepted",
    }));
    expect(acceptedFact(
      relations,
      "DisclosureSuppressionActivity",
      "governed_by",
      "ContextSelectionDecision",
    )).toBe(true);
    expect(acceptedFact(
      relations,
      "DisclosureSuppressionActivity",
      "suppresses",
      "SuppressedContext",
    )).toBe(true);
    expect(acceptedFact(
      relations,
      "DisclosureRecord",
      "records_decision",
      "ContextSelectionDecision",
    )).toBe(true);
  });

  it("uses completion criteria as specifications evaluated by an EvaluationRun", () => {
    const { relations } = readOntology();
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "TaskCompletionCriterion-evaluates-RunOutcome",
      status: "accepted",
    }));
    expect(acceptedFact(
      relations,
      "EvaluationRun",
      "uses",
      "TaskCompletionCriterion",
    )).toBe(true);
    expect(acceptedFact(relations, "EvaluationRun", "evaluates", "RunOutcome")).toBe(true);
  });

  it("keeps task steps declarative and assigns invocation agency to ToolCall", () => {
    const { relations } = readOntology();
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "TaskStep-invokes-ToolCall",
      status: "accepted",
    }));
    expect(acceptedFact(relations, "TaskStep", "specifies", "ToolCallPlan")).toBe(true);
    expect(acceptedFact(relations, "ToolCallPlan", "plans", "ToolCall")).toBe(true);
  });

  it("keeps snapshot capture agency on CheckpointActivity and references on Checkpoint", () => {
    const { relations } = readOntology();
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "Checkpoint-captures-StateSnapshot",
      status: "accepted",
    }));
    expect(acceptedFact(
      relations,
      "CheckpointActivity",
      "captures",
      "StateSnapshot",
    )).toBe(true);
    expect(acceptedFact(relations, "CheckpointActivity", "produces", "Checkpoint")).toBe(true);
    expect(acceptedFact(relations, "Checkpoint", "references", "StateSnapshot")).toBe(true);
  });

  it("publishes capability descriptors through an activity and only contains them on surfaces", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("RegistryPublicationActivity")).toMatchObject({
      semantic_kind: "activity",
      status: "accepted",
    });
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "CapabilitySurface-publishes-CapabilityDescriptor",
      status: "accepted",
    }));
    expect(acceptedFact(
      relations,
      "RegistryPublicationActivity",
      "publishes",
      "CapabilityDescriptor",
    )).toBe(true);
    expect(acceptedFact(
      relations,
      "RegistryPublicationActivity",
      "publishes_to",
      "CapabilitySurface",
    )).toBe(true);
    expect(acceptedFact(
      relations,
      "CapabilitySurface",
      "contains",
      "CapabilityDescriptor",
    )).toBe(true);
  });

  it("uses review findings as routing evidence and keeps routing agency on an activity", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("ReviewFinding")).toMatchObject({
      semantic_kind: "information",
      status: "accepted",
    });
    expect(concepts.get("FeedbackRouting")).toMatchObject({
      semantic_kind: "activity",
      status: "accepted",
    });
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "ReviewFinding-generates-Feedback",
      status: "accepted",
    }));
    expect(acceptedFact(relations, "ReviewFinding", "informs", "FeedbackRouting")).toBe(true);
    expect(acceptedFact(relations, "FeedbackRouting", "routes", "Feedback")).toBe(true);
  });

  it("uses measurements as evidence and keeps target evaluation on an activity", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("Measurement")).toMatchObject({
      semantic_kind: "information",
      status: "accepted",
    });
    expect(concepts.get("EvaluationRun")).toMatchObject({
      semantic_kind: "activity",
      status: "accepted",
    });
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "Measurement-evaluates-OptimizationTarget",
      status: "accepted",
    }));
    expect(acceptedFact(
      relations,
      "Measurement",
      "provides_evidence_for",
      "OptimizationTarget",
    )).toBe(true);
    expect(acceptedFact(
      relations,
      "EvaluationRun",
      "evaluates",
      "OptimizationTarget",
    )).toBe(true);
  });

  it("gives memory operations auditable results and composes storage and scope facets", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("MemoryOperationResult")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(concepts.get("MemoryTombstone")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(relations).not.toContainEqual(expect.objectContaining({ id: "memory_audit_event_records_memory_operation", status: "accepted" }));
    expect(acceptedFact(relations, "MemoryOperation", "performed_by", "Actor")).toBe(true);
    expect(acceptedFact(relations, "MemoryOperation", "governed_by", "PolicySpecification")).toBe(true);
    expect(acceptedFact(relations, "MemoryOperation", "produces", "MemoryOperationResult")).toBe(true);
    expect(acceptedFact(relations, "MemoryDelete", "produces", "MemoryTombstone")).toBe(true);
    expect(acceptedFact(relations, "MemoryEntity", "stored_in", "MemoryStore")).toBe(true);
    expect(acceptedFact(relations, "MemoryEntity", "scoped_by", "MemoryNamespace")).toBe(true);
    expect(concepts.get("MemoryStore")?.structure?.fields?.map(({ id }) => id)).toContain("deployment_scope");
  });
});

describe("explicit processing and governed-change loops", () => {
  it("exports telemetry through activities, immutable batches, and measurement references", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("TelemetryExportActivity")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("TelemetryExportBatch")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(concepts.get("MeasurementReference")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "TelemetryExportActivity", "produces", "TelemetryExportBatch")).toBe(true);
    expect(acceptedFact(relations, "TelemetryExportBatch", "contains", "MeasurementReference")).toBe(true);
    expect(acceptedFact(relations, "MeasurementReference", "references", "Measurement")).toBe(true);
    expect(acceptedFact(relations, "AuditLog", "derived_from", "AuditRecord")).toBe(true);
  });

  it("separates registry entries from capability definitions", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("RegistryEntry")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "ToolRegistry", "contains", "RegistryEntry")).toBe(true);
    expect(acceptedFact(relations, "RegistryEntry", "describes", "ToolSpecification")).toBe(true);
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "ToolRegistry-contains_definition-ToolDefinition",
      status: "accepted",
    }));
  });

  it("models MCP messages and subscriptions without conflating interactions and records", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    for (const id of ["MCPMessage", "MCPRequest", "MCPResponse", "MCPNotification", "MCPSubscription"]) {
      expect(concepts.get(id)).toMatchObject({ semantic_kind: "information", status: "accepted" });
    }
    expect(acceptedFact(relations, "MCPRequest", "is_a", "MCPMessage")).toBe(true);
    expect(acceptedFact(relations, "MCPResponse", "is_a", "MCPMessage")).toBe(true);
    expect(acceptedFact(relations, "MCPNotification", "is_a", "MCPMessage")).toBe(true);
    expect(acceptedFact(relations, "MCPSession", "carries", "MCPMessage")).toBe(true);
    expect(acceptedFact(relations, "MCPRequest", "expects", "MCPResponse")).toBe(true);
    expect(acceptedFact(relations, "MCPResponse", "responds_to", "MCPRequest")).toBe(true);
    expect(acceptedFact(relations, "MCPSession", "establishes", "MCPSubscription")).toBe(true);
    expect(acceptedFact(relations, "MCPNotification", "belongs_to", "MCPSubscription")).toBe(true);
  });

  it("uses restore and replay activities while retaining events as evidence", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    for (const id of ["CheckpointActivity", "RestoreActivity", "ReplayActivity"]) {
      expect(concepts.get(id)).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    }
    expect(acceptedFact(relations, "CheckpointRestoreEvent", "triggers", "RestoreActivity")).toBe(true);
    expect(acceptedFact(relations, "ReplayEvent", "triggers", "ReplayActivity")).toBe(true);
    expect(acceptedFact(relations, "RestoreActivity", "consumes", "Checkpoint")).toBe(true);
    expect(acceptedFact(relations, "RestoreActivity", "produces", "StateSnapshot")).toBe(true);
    expect(acceptedFact(relations, "RestoreActivity", "produces", "StateDiff")).toBe(true);
    expect(acceptedFact(relations, "ReplayActivity", "uses", "TraceRecord")).toBe(true);
  });

  it("makes policy evaluation an activity between authorization requests and decisions", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("AuthorizationRequest")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(concepts.get("PolicyEvaluation")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(acceptedFact(relations, "AuthorizationRequest", "precedes", "PolicyEvaluation")).toBe(true);
    expect(acceptedFact(relations, "PolicyEvaluation", "consumes", "AuthorizationRequest")).toBe(true);
    expect(acceptedFact(relations, "PolicyEvaluation", "uses", "PolicySpecification")).toBe(true);
    expect(acceptedFact(relations, "PolicyEvaluation", "produces", "PolicyDecision")).toBe(true);
    expect(concepts.get("HumanApproval")).toMatchObject({ semantic_kind: "event", status: "accepted" });
    expect(acceptedFact(relations, "HumanApproval", "authorizes", "AuthorizationGrant")).toBe(true);
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "HumanApproval-is_a-AuthorizationArtifact",
      status: "accepted",
    }));
  });

  it("retains independent receipts for committed external effects", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("EffectReceipt")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "EffectReceipt", "evidences", "SideEffect")).toBe(true);
  });

  it("separates schema projection capability from the run that produces an artifact", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("SchemaProjectionRun")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("ProjectionAdapter")).toMatchObject({ semantic_kind: "capability", status: "accepted" });
    expect(acceptedFact(relations, "SchemaProjectionRun", "uses", "ProjectionAdapter")).toBe(true);
    expect(acceptedFact(relations, "SchemaProjectionRun", "applies", "MappingRule")).toBe(true);
    expect(acceptedFact(relations, "SchemaProjectionRun", "produces", "SchemaArtifact")).toBe(true);
    expect(relations).not.toContainEqual(expect.objectContaining({
      id: "SchemaAdapter-produces-SchemaArtifact",
      status: "accepted",
    }));
  });

  it("represents instruction and disclosure processing as activities producing records", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    for (const id of [
      "InstructionProcessing",
      "InstructionParsingActivity",
      "InstructionConflictDetectionActivity",
      "InstructionResolutionActivity",
      "DisclosureActivity",
      "DisclosureSelectionActivity",
      "DisclosureTruncationActivity",
      "DisclosureSuppressionActivity",
      "DisclosurePublicationActivity",
    ]) {
      expect(concepts.get(id)).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    }
    expect(concepts.get("DisclosureRecord")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "InstructionResolutionActivity", "produces", "InstructionResolution")).toBe(true);
    expect(acceptedFact(relations, "DisclosureActivity", "produces", "DisclosureRecord")).toBe(true);
    expect(acceptedFact(relations, "DisclosureRecord", "references", "OutputSegment")).toBe(true);
  });

  it("connects handoff and worker selection through real process activities", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    for (const id of [
      "WorkerSelectionProcess",
      "WorkerAvailabilityAssessment",
      "WorkerCapabilityMatching",
      "WorkerAssignment",
    ]) {
      expect(concepts.get(id)).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    }
    expect(acceptedFact(relations, "HandoffProcess", "produces", "Handoff")).toBe(true);
    expect(acceptedFact(relations, "HandoffProcess", "results_in", "ResponsibilityTransfer")).toBe(true);
    expect(acceptedFact(relations, "WorkerAvailabilityAssessment", "produces", "WorkerAvailability")).toBe(true);
    expect(acceptedFact(relations, "WorkerCapabilityMatching", "produces", "WorkerCapabilityMatch")).toBe(true);
    expect(acceptedFact(relations, "TaskDistribution", "is_a", "WorkerAssignment")).toBe(true);
    expect(acceptedFact(relations, "WorkerAssignment", "produces", "DelegationOwnership")).toBe(true);
  });

  it("closes generic invocation, retry, and governed optimization semantics", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(acceptedFact(relations, "Invocation", "has_attempt", "InvocationAttempt")).toBe(true);
    expect(acceptedFact(relations, "InvocationAttempt", "produces", "InvocationResult")).toBe(true);
    expect(acceptedFact(relations, "RunAttempt", "retries", "RunAttempt")).toBe(true);
    expect(concepts.get("InvocationExecutionRequest")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "InvocationExecutionRequest", "instantiates", "InvocationSpecification")).toBe(true);
    expect(acceptedFact(relations, "ChangeProposal", "guides", "CorrectionActivity")).toBe(true);
    expect(acceptedFact(relations, "OptimizationLoop", "uses", "Metric")).toBe(true);
    expect(acceptedFact(relations, "OptimizationLoop", "consumes", "Measurement")).toBe(true);
  });

  it("coordinates evaluation and revision attempts without duplicating feedback-owned evidence", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    expect(concepts.get("EvaluationAttempt")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("RevisionAttempt")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("EvaluatorOptimizerLoop")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("ReviewRevisionLoop")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(acceptedFact(relations, "EvaluationAttempt", "precedes", "RevisionAttempt")).toBe(true);
    expect(acceptedFact(relations, "EvaluationAttempt", "coordinates", "EvaluationRun")).toBe(true);
    expect(acceptedFact(relations, "RevisionAttempt", "coordinates", "CorrectionActivity")).toBe(true);
  });

  it("keeps patterns, decisions, events, and records from impersonating execution activities", () => {
    const { classes, relations } = readOntology();
    const concepts = new Map(classes.map((concept) => [concept.id, concept]));
    for (const id of [
      "MappingRule-may_emit-ConversionWarning",
      "success_criterion_evaluates_task",
      "review_produces_review_finding",
      "ReviewEvent-produces-CritiqueArtifact",
      "ContextRefreshEvent-refreshes-ContextPackage",
      "Sectioning-creates-SectionAssignment",
      "Voting-consumes-VoteBallot",
      "ReviewAssignment-initiates-ReviewEvent",
    ]) {
      expect(relations).not.toContainEqual(expect.objectContaining({ id, status: "accepted" }));
    }
    expect(concepts.get("AggregationActivity")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("VotingActivity")).toMatchObject({ semantic_kind: "activity", status: "accepted" });
    expect(concepts.get("CompositionOutput")).toMatchObject({ semantic_kind: "information", status: "accepted" });
    expect(acceptedFact(relations, "MappingTestResult", "reports", "ConversionWarning")).toBe(true);
    expect(acceptedFact(relations, "SuccessCriterion", "applies_to", "Task")).toBe(true);
    expect(acceptedFact(relations, "ReviewActivity", "produces", "ReviewFinding")).toBe(true);
    expect(acceptedFact(relations, "ReviewActivity", "produces", "CritiqueArtifact")).toBe(true);
    expect(acceptedFact(relations, "Sectioning", "specifies", "SectionAssignment")).toBe(true);
    expect(acceptedFact(relations, "Voting", "governs", "VotingActivity")).toBe(true);
    expect(acceptedFact(relations, "VotingActivity", "consumes", "VoteBallot")).toBe(true);
    expect(acceptedFact(relations, "ReviewActivity", "produces", "ReviewEvent")).toBe(true);
  });
});
