import { ONTOLOGY_V3_MODULE_BOUNDARIES } from "./ontology-v3-module-boundaries.mjs";

const reviewedCandidates = {
  "adapter-mapping-infrastructure->adapter-frameworks": ["MappingRule", "FrameworkMapping", "MappingArtifact", "LangGraphAdapter"],
  "adapter-mapping-infrastructure->adapter-schema-export": ["ConversionWarning", "SchemaAdapter", "MappingRule", "SchemaProjectionRun"],
  "adapter-mapping-infrastructure->adapter-protocols": ["MappingRule", "InteroperabilityAdapter", "MappingArtifact", "ProtocolMapping"],
  "adapter-protocols->tool-mcp-transport": ["ProtocolMapping", "MCPMessage", "FIPAAdapter", "MCPClient"],
  "adapter-protocols->info-messages-instructions": ["ProtocolMessageMapping", "Message", "ProtocolMapping", "ProtocolEnvelope"],
  "adapter-protocols->runtime-actors": ["ProtocolMapping", "ActorBinding", "FIPAAdapter", "ActorRoleBinding"],
  "adapter-frameworks->orchestration-composition": ["FrameworkMapping", "CompositionPart", "LangGraphAdapter", "AggregationActivity"],
  "adapter-frameworks->runtime-system": ["FrameworkTraceMapping", "SessionStartEvent", "FrameworkMapping", "RuntimeSession"],
  "adapter-frameworks->adapter-mapping-infrastructure": ["FrameworkMapping", "MappingRule", "FrameworkTraceMapping", "MappingArtifact"],
  "adapter-benchmarks->feedback-metrics-evaluation": ["AppWorldAdapter", "Score", "SWEBenchAdapter", "Metric"],
  "adapter-benchmarks->runtime-system": ["OSWorldAdapter", "RuntimeEnvironment", "Tau2Adapter", "Container"],
  "adapter-benchmarks->runtime-observability": ["AgencyBenchAdapter", "AuditRecord", "OSWorldAdapter", "StateRecord"],
  "adapter-statecharts->orchestration-routing-control": ["XStateAdapter", "GateCondition", "SCXMLAdapter", "ControlGate"],
  "adapter-statecharts->runtime-system": ["SCXMLAdapter", "SessionLifecycleEvent", "XStateAdapter", "RuntimeSession"],
  "adapter-statecharts->runtime-observability": ["XStateAdapter", "TraceEvent", "SCXMLAdapter", "StateSnapshot"],
  "adapter-schema-export->adapter-mapping-infrastructure": ["SchemaAdapter", "ConversionWarning", "SchemaProjectionRun", "MappingRule"],
  "adapter-schema-export->runtime-artifacts": ["SchemaProjectionRun", "SchemaArtifact", "PydanticProfileAdapter", "ExportArtifact"],

  "feedback-warning-error->runtime-observability": ["ErrorEvent", "TraceEvent", "ErrorStream", "SpanStatus"],
  "feedback-warning-error->runtime-execution-attempts": ["BlockingError", "RunAttempt", "FailureEvent", "RunResult"],
  "feedback-warning-error->feedback-review-optimization": ["ErrorEvent", "RecoveryAction", "ConfidenceSignal", "ReviewFinding"],
  "feedback-metrics-evaluation->orchestration-evaluation": ["EvaluationRun", "EvaluationAttempt", "Measurement", "StopRetryLineage"],
  "feedback-metrics-evaluation->feedback-logging": ["Measurement", "MeasurementReference", "Rubric", "MetricExportActivity"],
  "feedback-metrics-evaluation->adapter-benchmarks": ["Score", "AppWorldAdapter", "Metric", "SWEBenchAdapter"],
  "feedback-review-optimization->feedback-optimization-learning": ["CorrectionActivity", "ChangeProposal", "Feedback", "LearningSignal"],
  "feedback-review-optimization->feedback-warning-error": ["RecoveryAction", "ErrorEvent", "ReviewFinding", "ConfidenceSignal"],
  "feedback-review-optimization->feedback-metrics-evaluation": ["Feedback", "EvaluationRun", "Correction", "Score"],
  "feedback-optimization-learning->feedback-review-optimization": ["ChangeProposal", "CorrectionActivity", "LearningSignal", "Feedback"],
  "feedback-optimization-learning->feedback-metrics-evaluation": ["OptimizationTarget", "Measurement", "ChangeProposal", "Metric"],
  "feedback-optimization-learning->safety-commit-redaction": ["ChangeProposal", "EffectReceipt", "LearningSignal", "CommitApproval"],
  "feedback-logging->runtime-observability": ["AuditLog", "AuditRecord", "EventSink", "TelemetryEvent"],
  "feedback-logging->safety-commit-redaction": ["LogSubscription", "EffectReceipt", "TelemetryExportBatch", "CommitDenial"],
  "feedback-logging->feedback-metrics-evaluation": ["MeasurementReference", "Measurement", "MetricExportActivity", "Score"],

  "info-container-command->runtime-observability": ["CommandOutputObservation", "TraceEvent", "OutputChunk", "CommandExecution"],
  "info-container-command->runtime-execution-attempts": ["CommandOutputObservation", "RunResult", "ContextIngressEvent", "RunOutcome"],
  "info-container-command->feedback-warning-error": ["CommandOutputObservation", "FailureEvent", "StandardError", "DiagnosticMessage"],
  "info-container-command->memory-context": ["ContextIngressEvent", "ContextPackage", "CommandOutputObservation", "ContextSummary"],
  "info-content-block-modality->info-messages-instructions": ["MessageContentBlock", "Message", "TextBlock", "ConversationTurn"],
  "info-content-block-modality->info-storage-sources": ["FileAttachmentBlock", "SourceSpan", "AudioBlock", "SourceIdentity"],
  "info-indexing->memory-retrieval-ranking": ["DiscoveryScore", "RetrievalScore", "DiscoveryResult", "RetrievedCandidate"],
  "info-indexing->memory-context": ["DiscoveryResult", "ContextSelectionActivity", "DiscoveryIndex", "ContextArtifact"],
  "info-indexing->memory-embedding-indexes": ["IndexVersionReference", "IndexVersion", "DiscoveryIndex", "Index"],
  "info-messages-instructions->info-prompts-instructions": ["Message", "MessageHistory", "PromptTemplate", "InstructionMetadata"],
  "info-messages-instructions->runtime-system": ["MessageHistory", "SessionLifecycleEvent", "ConversationTurn", "SessionStartEvent"],
  "info-messages-instructions->tool-mcp-transport": ["ConversationElement", "MCPMessage", "Message", "MCPParticipant"],
  "info-messages-instructions->memory-context": ["Message", "ContextPackage", "ConversationTurn", "ContextArtifact"],
  "info-prompts-instructions->info-messages-instructions": ["PromptTemplate", "InstructionMetadata", "Message", "MessageHistory"],
  "info-prompts-instructions->info-content-block-modality": ["InstructionConflictDetectionActivity", "AudioBlock", "InstructionProcessing", "ImageBlock"],
  "info-prompts-instructions->safety-injection-defense": ["InstructionConflictDetectionActivity", "PromptInjectionSignal", "InstructionResolution", "InstructionConflict"],
  "info-output-disclosure->safety-disclosure-redaction": ["SuppressedContext", "ProgressiveDisclosure", "OutputWindow", "DisclosureRule"],
  "info-output-disclosure->runtime-artifacts": ["DisclosureRecord", "ReportArtifact", "DisclosedOutputSegment", "ExportArtifact"],
  "info-output-disclosure->memory-context": ["ContextSelectionDecision", "VisibleContextWindow", "OutputWindow", "ContextPackage"],
  "info-storage-sources->memory-ingestion": ["TextDocumentReference", "TextDocument", "FileResourceReference", "IngestibleResource"],
  "info-storage-sources->runtime-artifacts": ["SourceIdentity", "GraphArtifact", "ResourceDescriptor", "PatchArtifact"],

  "memory-ingestion->info-storage-sources": ["TextDocument", "TextDocumentReference", "IngestibleResource", "DatabaseRowReference"],
  "memory-ingestion->memory-stores-scopes": ["IngestibleResource", "MemoryStore", "DocumentLoader", "MemoryRecord"],
  "memory-ingestion->memory-chunking-situating": ["Document", "Chunk", "IngestibleResource", "ChunkingRun"],
  "memory-chunking-situating->memory-ingestion": ["Chunk", "Document", "ChunkingRun", "IngestibleResource"],
  "memory-chunking-situating->memory-embedding-indexes": ["Chunk", "EmbeddingRun", "ChunkArtifact", "EmbeddingVector"],
  "memory-chunking-situating->memory-context": ["Chunk", "ContextExclusion", "ChunkArtifact", "ContextArtifact"],
  "memory-embedding-indexes->memory-retrieval-ranking": ["IndexVersion", "RetrievalRequest", "Index", "RetrievalRun"],
  "memory-embedding-indexes->runtime-actors": ["EmbeddingRun", "EmbeddingModel", "Embedding", "Model"],
  "memory-embedding-indexes->memory-stores-scopes": ["VectorDatabase", "MemoryStore", "Index", "MemoryRecord"],
  "memory-retrieval-ranking->info-indexing": ["RetrievalScore", "DiscoveryScore", "RetrievedCandidate", "DiscoveryResult"],
  "memory-retrieval-ranking->memory-embedding-indexes": ["RetrievalRequest", "IndexVersion", "RetrievalRun", "Index"],
  "memory-retrieval-ranking->memory-context": ["RetrievedChunk", "ContextPackage", "RetrievedCandidate", "ContextSlot"],
  "memory-context->info-output-disclosure": ["VisibleContextWindow", "ContextSelectionDecision", "ContextArtifact", "OutputWindow"],
  "memory-context->info-messages-instructions": ["ContextPackage", "Message", "ContextArtifact", "ConversationTurn"],
  "memory-context->info-indexing": ["ContextArtifact", "DiscoveryResult", "ContextSelectionActivity", "CandidateRank"],
  "memory-lifecycle->memory-stores-scopes": ["MemoryCompaction", "MemoryRecord", "MemoryConflict", "MemoryItem"],
  "memory-lifecycle->feedback-review-optimization": ["MemoryWrite", "Feedback", "MemoryUpdate", "HumanReview"],
  "memory-stores-scopes->memory-lifecycle": ["MemoryRecord", "MemoryCompaction", "MemoryItem", "MemoryConflict"],
  "memory-stores-scopes->memory-embedding-indexes": ["MemoryStore", "VectorDatabase", "MemoryScope", "IndexActivity"],

  "orchestration-task-planning->runtime-execution-attempts": ["TaskCompletionCriterion", "RunOutcome", "Task", "RunAttempt"],
  "orchestration-task-planning->orchestration-routing-control": ["TaskCondition", "RoutingCondition", "TaskCompletionCriterion", "GateCondition"],
  "orchestration-actors-delegation->orchestration-delegation-handoff": ["Orchestrator", "DelegationContext", "WorkerRole", "TaskDistribution"],
  "orchestration-actors-delegation->tool-invocation-execution": ["Orchestrator", "AgentAsToolInvocation", "ProgrammaticToolCall", "AnswerOwnership"],
  "orchestration-actors-delegation->runtime-actors": ["CoordinationOwnershipRecord", "ActorRoleBinding", "Orchestrator", "ActorBinding"],
  "orchestration-actors-delegation->orchestration-composition": ["CoordinationOwnershipRecord", "CompositionPart", "AnswerOwnership", "SectionAssignment"],
  "orchestration-delegation-handoff->orchestration-actors-delegation": ["DelegationContext", "Orchestrator", "TaskDistribution", "WorkerRole"],
  "orchestration-delegation-handoff->tool-invocation-execution": ["Handoff", "AgentAsToolInvocation", "ProgrammaticToolCall", "DelegationContract"],
  "orchestration-delegation-handoff->tool-discovery-selection": ["WorkerSelection", "PromptSelectionDecision", "WorkerSelectionDecisionActivity", "SelectionDecision"],
  "orchestration-delegation-handoff->runtime-actors": ["TaskDistribution", "AgentActor", "DelegationContract", "ActorBinding"],
  "orchestration-routing-control->orchestration-composition": ["Route", "CompositionPart", "RoutingCondition", "AggregationActivity"],
  "orchestration-routing-control->safety-permission-policy": ["RoutingCondition", "AuthorizationRevocation", "ControlGate", "AuthorizationArtifact"],
  "orchestration-routing-control->runtime-execution-attempts": ["RetryPolicy", "RetryActivity", "RoutingCondition", "RunAttempt"],
  "orchestration-composition->orchestration-routing-control": ["AggregationActivity", "RoutingCondition", "CompositionOutput", "RoutingPolicy"],
  "orchestration-composition->orchestration-task-planning": ["OrchestrationTopology", "TaskPlan", "CompositionPart", "TaskCompletionCriterion"],
  "orchestration-composition->runtime-artifacts": ["SynthesisInput", "SchemaArtifact", "SynthesisOutput", "ReportArtifact"],
  "orchestration-evaluation->feedback-review-optimization": ["FeedbackRouting", "FeedbackEvent", "ImprovementAttempt", "RevisionPlan"],
  "orchestration-evaluation->feedback-metrics-evaluation": ["EvaluationAttempt", "EvaluationRun", "ImprovementAttempt", "Measurement"],
  "orchestration-evaluation->orchestration-routing-control": ["StopRetryLineage", "StopCondition", "ImprovementAttempt", "GateCondition"],

  "runtime-actors->orchestration-actors-delegation": ["ActorBinding", "CoordinationOwnershipRecord", "ActorRoleBinding", "Orchestrator"],
  "runtime-actors->runtime-system": ["AgentActor", "RuntimeSession", "Model", "SessionLifecycleEvent"],
  "runtime-actors->memory-embedding-indexes": ["EmbeddingModel", "EmbeddingRun", "Model", "Embedding"],
  "runtime-system->runtime-execution-attempts": ["RuntimeEnvironment", "RunAttempt", "ProcessHandle", "RuntimeBudget"],
  "runtime-system->safety-sandbox-network": ["Container", "ProcessPolicy", "RuntimeEnvironment", "Sandbox"],
  "runtime-execution-attempts->tool-invocation-execution": ["RunAttempt", "ToolCallAttempt", "RunOutcome", "ToolResult"],
  "runtime-execution-attempts->orchestration-routing-control": ["RetryActivity", "RetryPolicy", "RunAttempt", "RoutingCondition"],
  "runtime-execution-attempts->feedback-warning-error": ["RunAttempt", "BlockingError", "RunResult", "FailureEvent"],
  "runtime-observability->feedback-logging": ["AuditRecord", "AuditLog", "TelemetryEvent", "EventSink"],
  "runtime-observability->runtime-execution-attempts": ["TraceEvent", "RunAttempt", "ObservabilityEvent", "RunOutcome"],
  "runtime-observability->runtime-system": ["Checkpoint", "RuntimeSession", "TraceEvent", "SessionPauseEvent"],
  "runtime-artifacts->runtime-observability": ["ExportArtifact", "TraceEvent", "SchemaArtifact", "ObservabilityEvent"],
  "runtime-artifacts->runtime-execution-attempts": ["SchemaArtifact", "RunAttempt", "ExportArtifact", "RunResult"],
  "runtime-artifacts->info-storage-sources": ["SchemaArtifact", "SourceIdentity", "PatchArtifact", "NetworkSourceReference"],
  "runtime-artifacts->feedback-review-optimization": ["ExportArtifact", "Correction", "ReportArtifact", "ReviewFinding"],

  "safety-trust-boundary->safety-permission-policy": ["BoundaryCrossing", "PolicyDecision", "AuthorityScope", "PolicyEvaluation"],
  "safety-trust-boundary->runtime-system": ["BoundaryCrossing", "SessionLifecycleEvent", "AuthorityScope", "RuntimeEnvironment"],
  "safety-permission-policy->safety-trust-boundary": ["PolicyDecision", "BoundaryCrossing", "AuthorizationArtifact", "AuthorityScope"],
  "safety-permission-policy->runtime-actors": ["AuthorizationGrant", "ActorBinding", "AuthorizationRequest", "ActorRoleBinding"],
  "safety-permission-policy->safety-commit-redaction": ["PolicyDecision", "CommitApproval", "AllowDecision", "CommitDenial"],
  "safety-sandbox-network->safety-network-control": ["Sandbox", "ProxyRoute", "SandboxEscapeRisk", "SOCKSProxy"],
  "safety-sandbox-network->runtime-system": ["Sandbox", "Container", "ProcessPolicy", "RuntimeEnvironment"],
  "safety-sandbox-network->safety-permission-policy": ["ProcessPolicy", "AuthorizationRequest", "Sandbox", "PolicyCondition"],
  "safety-network-control->safety-sandbox-network": ["ProxyRoute", "ProcessPolicy", "Proxy", "Sandbox"],
  "safety-network-control->safety-permission-policy": ["NetworkPolicy", "AuthorizationRequest", "NetworkCall", "AuthorizationGrant"],
  "safety-network-control->tool-invocation-execution": ["ProxyRoute", "ToolCallAttempt", "NetworkCall", "ToolResult"],
  "safety-network-control->tool-mcp-transport": ["ProxyRoute", "MCPServer", "Socket", "MCPParticipant"],
  "safety-injection-defense->info-prompts-instructions": ["PromptInjectionSignal", "InstructionConflictDetectionActivity", "InstructionConflict", "InstructionResolution"],
  "safety-injection-defense->memory-ingestion": ["PatternScan", "SourceAttachment", "PoisonedContent", "DocumentLoader"],
  "safety-injection-defense->memory-context": ["PoisonedContent", "ContextArtifact", "DetectionActivity", "ContextExclusion"],
  "safety-commit-redaction->safety-permission-policy": ["CommitApproval", "PolicyDecision", "CommitDenial", "AllowDecision"],
  "safety-commit-redaction->tool-invocation-execution": ["SideEffect", "Command", "EffectReceipt", "ToolCall"],
  "safety-commit-redaction->runtime-observability": ["EffectReceipt", "ObservabilityEvent", "CommitApproval", "CheckpointActivity"],
  "safety-commit-redaction->safety-disclosure-redaction": ["CommitRequest", "EffectReceipt", "SensitiveSpan", "Redaction"],
  "safety-disclosure-redaction->info-output-disclosure": ["ProgressiveDisclosure", "SuppressedContext", "DisclosureRule", "OutputWindow"],
  "safety-disclosure-redaction->info-content-block-modality": ["SensitiveSpan", "FileAttachmentBlock", "AuditDisclosure", "AudioBlock"],
  "safety-disclosure-redaction->feedback-logging": ["AuditDisclosure", "AuditLog", "DisclosureRule", "LogSubscription"],
  "safety-disclosure-redaction->safety-commit-redaction": ["SensitiveSpan", "Redaction", "CommitRequest", "EffectReceipt"],

  "tool-registry-definition->tool-discovery-selection": ["ToolDefinition", "ToolMatch", "ToolRegistry", "ToolFallback"],
  "tool-registry-definition->tool-invocation-execution": ["ResourceDefinition", "ToolCall", "ToolDefinition", "ResourceSubscription"],
  "tool-registry-definition->runtime-actors": ["RegistryEntry", "Model", "HostedTool", "ActorBinding"],
  "tool-discovery-selection->tool-registry-definition": ["ToolMatch", "ToolDefinition", "ToolFallback", "RegistryEntry"],
  "tool-discovery-selection->orchestration-routing-control": ["DiscoveryCandidateSet", "Route", "ToolSelectionDecision", "RoutingPolicy"],
  "tool-discovery-selection->tool-invocation-execution": ["ToolCandidate", "PreExecutionSafetyCheck", "SelectionDecision", "ToolResult"],
  "tool-invocation-execution->runtime-execution-attempts": ["ToolCallAttempt", "RunAttempt", "ToolResult", "RunOutcome"],
  "tool-invocation-execution->orchestration-actors-delegation": ["AgentAsToolInvocation", "Orchestrator", "ProgrammaticToolCall", "AnswerOwnership"],
  "tool-invocation-execution->orchestration-delegation-handoff": ["AgentAsToolInvocation", "DelegationContext", "ProgrammaticToolCall", "HandoffProcess"],
  "tool-invocation-execution->tool-registry-definition": ["ToolCall", "ResourceDefinition", "ResourceSubscription", "ToolDefinition"],
  "tool-invocation-execution->safety-commit-redaction": ["Command", "SideEffect", "ToolCall", "EffectReceipt"],
  "tool-mcp-transport->adapter-protocols": ["MCPMessage", "ProtocolMapping", "MCPParticipant", "FIPAAdapter"],
  "tool-mcp-transport->tool-invocation-execution": ["MCPAuthorization", "PromptGetRequest", "MCPServer", "ResourceReadRequest"],
  "tool-mcp-transport->safety-network-control": ["MCPParticipant", "NetworkEndpoint", "MCPServer", "NetworkPolicy"],
};

export const ONTOLOGY_V3_OVERLAP_CANDIDATES = Object.freeze(
  Object.fromEntries(
    Object.entries(reviewedCandidates).map(([adjacency, conceptIds]) => [
      adjacency,
      Object.freeze([...conceptIds]),
    ]),
  ),
);

const expectedAdjacencies = (boundaries) => Object.entries(boundaries)
  .flatMap(([moduleId, specification]) =>
    specification.overlap_checks.map(({ other_module_id: otherModuleId }) =>
      `${moduleId}->${otherModuleId}`,
    ),
  )
  .sort();

export const validateOntologyV3OverlapCandidates = (
  candidates = ONTOLOGY_V3_OVERLAP_CANDIDATES,
  boundaries = ONTOLOGY_V3_MODULE_BOUNDARIES,
  concepts = null,
  keyConceptIds = null,
  relations = null,
) => {
  const expected = expectedAdjacencies(boundaries);
  const received = Object.keys(candidates).sort();
  if (JSON.stringify(expected) !== JSON.stringify(received)) {
    throw new Error(`Overlap-candidate adjacency coverage mismatch: expected ${expected.length}; received ${received.length}`);
  }

  const conceptById = concepts instanceof Map
    ? concepts
    : Array.isArray(concepts) ? new Map(concepts.map((concept) => [concept.id, concept])) : null;
  const relationValues = relations instanceof Map
    ? [...relations.values()]
    : Array.isArray(relations) ? relations : null;
  const keyByModule = keyConceptIds instanceof Map
    ? keyConceptIds
    : keyConceptIds && typeof keyConceptIds === "object" ? new Map(Object.entries(keyConceptIds)) : null;

  for (const adjacency of expected) {
    const [moduleId, otherModuleId] = adjacency.split("->");
    const conceptIds = candidates[adjacency];
    if (conceptIds.length < 2 || conceptIds.length > 4 || new Set(conceptIds).size !== conceptIds.length) {
      throw new Error(`${adjacency} must declare two to four unique overlap candidates`);
    }
    if (!conceptById) continue;

    const ownerIds = new Set();
    for (const conceptId of conceptIds) {
      const concept = conceptById.get(conceptId);
      if (!concept || concept.status !== "accepted") {
        throw new Error(`${adjacency} references missing or non-accepted concept ${conceptId}`);
      }
      if (concept.module_id !== moduleId && concept.module_id !== otherModuleId) {
        throw new Error(`${adjacency} candidate ${conceptId} belongs to unrelated module ${concept.module_id}`);
      }
      if (keyByModule && (conceptId === keyByModule.get(moduleId) || conceptId === keyByModule.get(otherModuleId))) {
        throw new Error(`${adjacency} repeats a key notion instead of naming the competing concept: ${conceptId}`);
      }
      ownerIds.add(concept.module_id);
    }
    if (!ownerIds.has(moduleId) || !ownerIds.has(otherModuleId)) {
      throw new Error(`${adjacency} must name competing concepts from both module owners`);
    }

    if (relationValues) {
      const crossEndpointIds = new Set(
        relationValues
          .filter((relation) => {
            if (relation.status !== "accepted") return false;
            const sourceModuleId = conceptById.get(relation.source_id)?.module_id;
            const targetModuleId = conceptById.get(relation.target_id)?.module_id;
            return (
              (sourceModuleId === moduleId && targetModuleId === otherModuleId) ||
              (sourceModuleId === otherModuleId && targetModuleId === moduleId)
            );
          })
          .flatMap((relation) => [relation.source_id, relation.target_id]),
      );
      if (crossEndpointIds.size > 0 && !conceptIds.some((conceptId) => crossEndpointIds.has(conceptId))) {
        throw new Error(`${adjacency} ignores every endpoint of its accepted cross-module relation`);
      }
    }
  }

  return Object.freeze({
    adjacency_count: expected.length,
    candidate_reference_count: expected.reduce(
      (count, adjacency) => count + candidates[adjacency].length,
      0,
    ),
  });
};

export const ontologyV3OverlapCandidates = ONTOLOGY_V3_OVERLAP_CANDIDATES;
export const ontologyV3OverlapCandidateValidation = validateOntologyV3OverlapCandidates();
