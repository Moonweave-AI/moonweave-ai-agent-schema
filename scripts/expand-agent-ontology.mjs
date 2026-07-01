import fs from "node:fs";

const ontologyPath = "ontology/agent-ontology.json";
const ontology = JSON.parse(fs.readFileSync(ontologyPath, "utf8"));
const definitionLedgerPath = "ontology/agent-ontology-definitions.json";
const definitionLedger = JSON.parse(fs.readFileSync(definitionLedgerPath, "utf8"));
const curatedDefinitions = definitionLedger.definitions ?? {};

const sourceFallback = {
  "runtime-plane": ["eng-fw-openai-python-docs", "eng-fw-langgraph-docs", "eng-fw-openai-tracing"],
  "info-plane": ["lit-mech-compass", "eng-fw-deepagents-js-docs", "eng-proto-mcp-spec"],
  "memory-plane": ["lit-mech-compass", "lit-mas-generative-agents", "eng-fw-langchain-agents"],
  "orchestration-plane": ["lit-agent-conductor", "eng-fw-langgraph-docs", "eng-fw-crewai-docs"],
  "tool-plane": ["eng-proto-mcp-spec", "eng-fw-openai-python-docs", "lit-mech-tool-use-evolution"],
  "safety-plane": ["lit-agent-safeagent", "eng-security-mcp-nsa-2026", "eng-fw-openai-guardrails"],
  "feedback-plane": ["lit-mech-reflexion", "lit-agent-conductor", "eng-fw-openai-tracing"],
  "adapter-plane": ["eng-proto-mcp-spec", "eng-proto-a2a-spec", "eng-val-jsonschema-spec", "eng-ont-fibo-ontology-guide"]
};

const moduleSpecs = [
  {
    id: "runtime-system",
    plane_id: "runtime-plane",
    label: "Runtime Session And Execution Envelope Module",
    definition: "models bounded runtime sessions, execution attempts, outcomes, environments, budgets, and lifecycle transitions as the envelope in which agent activity actually occurs",
    class_ids: ["AgentSystem", "RuntimeSession", "RuntimeBudget", "Container", "ProcessHandle", "WorkingDirectory", "EnvironmentVariable"],
    generated: [
      ["RuntimeEnvironment", "runtime environment"],
      ["SessionLifecycle", "session lifecycle"],
      ["SessionStartEvent", "session start event"],
      ["SessionEndEvent", "session end event"],
      ["SessionPauseEvent", "session pause event"],
      ["SessionResumeEvent", "session resume event"],
      ["RunAttempt", "run attempt"],
      ["RunOutcome", "run outcome"]
    ]
  },
  {
    id: "runtime-actors",
    plane_id: "runtime-plane",
    label: "Runtime Actor And Authority Module",
    definition: "models runtime actor identities, role bindings, capability bindings, authority scopes, local services, model-backed participants, human operators, and remote agent references",
    class_ids: ["AgentActor", "HumanOperator", "UserActor", "ModelActor", "GenerativeModel", "EmbeddingModel", "RerankerModel", "RemoteAgentReference"],
    generated: [
      ["DeveloperActor", "developer actor"],
      ["ReviewerActor", "reviewer actor"],
      ["ToolServiceActor", "tool service actor"],
      ["SystemServiceActor", "system service actor"],
      ["ExternalServiceActor", "external service actor"],
      ["ActorRoleBinding", "actor role binding"],
      ["ActorCapabilityBinding", "actor capability binding"],
      ["ActorAuthorityScope", "actor authority scope"]
    ]
  },
  {
    id: "runtime-observability",
    plane_id: "runtime-plane",
    label: "Runtime Trace And Checkpoint Module",
    definition: "models raw ordered execution evidence: transcripts, trace records, spans, span events, trace links, checkpoint restore events, snapshots, state diffs, replay events, audit records, and retention policy",
    class_ids: ["AgentTranscript", "TraceEvent", "StateSnapshot", "Checkpoint", "CommandExecution"],
    generated: [
      ["TraceRecord", "trace record"],
      ["TraceSpan", "trace span"],
      ["TraceLink", "trace link"],
      ["TraceContext", "trace context"],
      ["SpanAttribute", "span attribute"],
      ["SpanStatus", "span status"],
      ["AuditRecord", "audit record"],
      ["StateDiff", "state diff"],
      ["CheckpointRestoreEvent", "checkpoint restore event"],
      ["ReplayEvent", "replay event"],
      ["ObservableSummary", "observable summary"],
      ["TraceRetentionPolicy", "trace retention policy"]
    ]
  },
  {
    id: "runtime-artifacts",
    plane_id: "runtime-plane",
    label: "Runtime Artifact Provenance Module",
    definition: "models runtime artifacts as produced, consumed, derived, attributed, reviewed, exported, drafted, or finalized work products with execution provenance",
    class_ids: [],
    generated: [
      ["Artifact", "artifact"],
      ["DraftArtifact", "draft artifact"],
      ["FinalArtifact", "final artifact"],
      ["PatchArtifact", "patch artifact"],
      ["ReportArtifact", "report artifact"],
      ["SchemaArtifact", "schema artifact"],
      ["GraphArtifact", "graph artifact"],
      ["ExportArtifact", "export artifact"]
    ]
  },
  {
    id: "info-container-command",
    plane_id: "info-plane",
    label: "Execution Observation Ingress Module",
    definition: "models stdout, stderr, exit status, tool results, and other observable execution outputs only as they become context inputs",
    class_ids: ["StandardOutput", "StandardError", "CommandExitStatus"],
    generated: [
      ["ContextIngressEvent", "context ingress event"],
      ["CommandOutputObservation", "command output observation"],
      ["StandardOutputChunk", "standard output chunk"],
      ["StandardErrorChunk", "standard error chunk"],
      ["ExitStatusObservation", "exit status observation"],
      ["ExecutionResultReference", "execution result reference"],
      ["WorkingDirectoryReference", "working directory reference"],
      ["EnvironmentBindingReference", "environment binding reference"]
    ]
  },
  {
    id: "info-output-disclosure",
    plane_id: "info-plane",
    label: "Context Windowing & Disclosure Module",
    definition: "models visible context windows, disclosed output segments, selection decisions, citations, truncation, compression, and suppressed context spans",
    class_ids: ["OutputChunk", "OutputWindow", "HeadTailWindow", "LengthLimit", "OutputCitation"],
    generated: [
      ["OutputStream", "output stream"],
      ["OutputSegment", "output segment"],
      ["DisclosureStage", "disclosure stage"],
      ["VisibleContextWindow", "visible context window"],
      ["ContextSelectionDecision", "context selection decision"],
      ["SuppressedContext", "suppressed context"],
      ["DisclosedOutputSegment", "disclosed output segment"],
      ["TruncatedContextSpan", "truncated context span"]
    ]
  },
  {
    id: "info-storage-sources",
    plane_id: "info-plane",
    label: "Source & Resource Reference Module",
    definition: "models references, spans, locations, anchors, digests, versions, access paths, and trust annotations for source material entering context",
    class_ids: ["ResourceDescriptor", "TextDocument"],
    generated: [
      ["SourceReference", "source reference"],
      ["SourceSpan", "source span"],
      ["SourceLocation", "source location"],
      ["SourceAnchor", "source anchor"],
      ["SourceChecksum", "source checksum"],
      ["SourceVersion", "source version"],
      ["SourceProvenance", "source provenance"],
      ["CitationAnchor", "citation anchor"],
      ["ContentDigest", "content digest"],
      ["AccessPath", "access path"],
      ["DataZoneReference", "data zone reference"],
      ["TrustBoundaryReference", "trust boundary reference"],
      ["TextDocumentReference", "text document reference"],
      ["FileResourceReference", "file resource reference"],
      ["DatabaseRowReference", "database row reference"],
      ["GraphNodeReference", "graph node reference"],
      ["NetworkSourceReference", "network source reference"],
      ["SourceOffset", "source offset"],
      ["SourceLineRange", "source line range"],
      ["SourcePageRange", "source page range"],
      ["SourceCellRange", "source cell range"]
    ]
  },
  {
    id: "info-content-block-modality",
    plane_id: "info-plane",
    label: "Content Block & Modality Module",
    definition: "models bounded content blocks, modalities, encodings, mime types, token counts, and attachment blocks staged into context",
    class_ids: [],
    generated: [
      ["ContentBlock", "content block"],
      ["MessageContentBlock", "message content block"],
      ["MessageModality", "message modality"],
      ["TextBlock", "text block"],
      ["ImageBlock", "image block"],
      ["CodeBlock", "code block"],
      ["TableBlock", "table block"],
      ["AudioBlock", "audio block"],
      ["FileAttachmentBlock", "file attachment block"],
      ["StructuredDataBlock", "structured data block"],
      ["MimeType", "mime type"],
      ["Encoding", "encoding"],
      ["TokenCount", "token count"]
    ]
  },
  {
    id: "info-messages-instructions",
    plane_id: "info-plane",
    label: "Message, Instruction & Prompt Envelope Module",
    definition: "models message envelopes, instruction artifacts, prompt templates, role metadata, senders, receivers, conversation identity, and instruction conflict resolution",
    class_ids: ["Message", "Conversation", "MessageHistory", "Instruction", "SystemPrompt", "FewShotExample"],
    generated: [
      ["AssistantMessage", "assistant message"],
      ["SystemMessage", "system message"],
      ["UserMessage", "user message"],
      ["DeveloperMessage", "developer message"],
      ["ToolResultMessage", "tool result message"],
      ["ToolObservationMessage", "tool observation message"],
      ["ExternalAgentMessage", "external agent message"],
      ["ConversationTurn", "conversation turn"],
      ["ContextPackage", "context package"],
      ["MessageRole", "message role"],
      ["MessageSender", "message sender"],
      ["MessageReceiver", "message receiver"],
      ["ConversationId", "conversation id"],
      ["ReplyTo", "reply to"],
      ["ThreadId", "thread id"],
      ["TurnIndex", "turn index"],
      ["ProtocolEnvelope", "protocol envelope"],
      ["InstructionAuthority", "instruction authority"],
      ["InstructionPriority", "instruction priority"],
      ["InstructionScope", "instruction scope"],
      ["InstructionConflict", "instruction conflict"],
      ["InstructionResolution", "instruction resolution"],
      ["InstructionOverride", "instruction override"],
      ["InstructionApplicability", "instruction applicability"],
      ["InstructionProvenance", "instruction provenance"],
      ["PromptVariable", "prompt variable"],
      ["PromptTemplateInstance", "prompt template instance"]
    ]
  },
  {
    id: "info-indexing",
    plane_id: "info-plane",
    label: "Lightweight Context Discovery Module",
    definition: "models lightweight discovery pointers, retrieval queries, retrieved candidates, candidate ranks, scores, and index-version references used to select context",
    class_ids: ["LightIndex", "IndexPointer", "SearchResult", "SearchScore"],
    generated: [
      ["CandidateRank", "candidate rank"],
      ["IndexVersionReference", "index version reference"],
      ["DiscoverySurface", "discovery surface"],
      ["RetrievedCandidate", "retrieved candidate"],
      ["RetrievedContextCandidate", "retrieved context candidate"],
      ["RetrievalScore", "retrieval score"],
      ["LightweightRetrievalTrace", "lightweight retrieval trace"]
    ]
  },
  {
    id: "memory-ingestion",
    plane_id: "memory-plane",
    label: "Memory Ingestion Module",
    definition: "models source loading, memory files, document preparation, and ingestion events",
    class_ids: [
      "MemoryPlane",
      "MemoryStore",
      "MemoryFile",
      "Document",
      "StorageArea",
      "Resource",
      "FileSystem",
      "FileResource",
      "DirectoryResource",
      "Database",
      "DatabaseTable",
      "DatabaseRow",
      "GraphStore",
      "GraphNode",
      "GraphEdge",
      "TextCorpus"
    ],
    generated: [
      ["IngestionRun", "ingestion run"],
      ["DocumentLoader", "document loader"],
      ["DocumentMetadata", "document metadata"],
      ["SourceAttachment", "source attachment"],
      ["MemoryNamespace", "memory namespace"],
      ["MemoryScope", "memory scope"],
      ["IngestionPolicy", "ingestion policy"],
      ["DeduplicationEvent", "deduplication event"]
    ]
  },
  {
    id: "memory-chunking-situating",
    plane_id: "memory-plane",
    label: "Chunking And Situating Module",
    definition: "models chunking, chunk metadata, situating prompts, and document-local grounding",
    class_ids: ["Chunk", "ChunkingRun", "SituatingPromptRun"],
    generated: [
      ["ChunkBoundary", "chunk boundary"],
      ["ChunkOverlap", "chunk overlap"],
      ["ChunkProvenance", "chunk provenance"],
      ["SituatedChunk", "situated chunk"],
      ["ChunkContextNote", "chunk context note"],
      ["ChunkQualitySignal", "chunk quality signal"],
      ["ChunkCompression", "chunk compression"],
      ["ChunkReference", "chunk reference"]
    ]
  },
  {
    id: "memory-embedding-indexes",
    plane_id: "memory-plane",
    label: "Embedding And Index Module",
    definition: "models vector and lexical indexes used to retrieve memory",
    class_ids: [
      "VectorDatabase",
      "VectorIndex",
      "TfIdfIndex",
      "Embedding",
      "TextEmbedding",
      "GraphEmbedding",
      "IndexEntry",
      "IndexKey",
      "IndexRefreshEvent"
    ],
    generated: [
      ["EmbeddingRun", "embedding run"],
      ["EmbeddingVector", "embedding vector"],
      ["IndexShard", "index shard"],
      ["IndexBuildRun", "index build run"],
      ["IndexVersion", "index version"],
      ["HybridIndex", "hybrid index"],
      ["SparseVector", "sparse vector"],
      ["DenseVector", "dense vector"]
    ]
  },
  {
    id: "memory-retrieval-ranking",
    plane_id: "memory-plane",
    label: "Retrieval And Ranking Module",
    definition: "models retrieval queries, candidate sets, scoring, reranking, and rank fusion",
    class_ids: ["RetrievalQuery", "RetrievedChunk", "RankFusion"],
    generated: [
      ["CandidateSet", "candidate set"],
      ["CandidateChunk", "candidate chunk"],
      ["SimilarityScore", "similarity score"],
      ["LexicalScore", "lexical score"],
      ["RerankScore", "rerank score"],
      ["TopKSelection", "top-k selection"],
      ["RetrievalFilter", "retrieval filter"],
      ["RetrievalTrace", "retrieval trace"]
    ]
  },
  {
    id: "memory-context",
    plane_id: "memory-plane",
    label: "Context Assembly Module",
    definition: "models context windows, context assembly, summaries, and preference-guided memory inclusion",
    class_ids: ["ContextWindow", "ContextAssembly", "MemoryPreference"],
    generated: [
      ["ContextSlot", "context slot"],
      ["ContextBudget", "context budget"],
      ["ContextSummary", "context summary"],
      ["ContextSource", "context source"],
      ["ContextOrderingRule", "context ordering rule"],
      ["ContextExclusion", "context exclusion"],
      ["PreferenceMemory", "preference memory"],
      ["ContextRefreshEvent", "context refresh event"]
    ]
  },
  {
    id: "orchestration-task-planning",
    plane_id: "orchestration-plane",
    label: "Task Planning Module",
    definition: "models tasks, decomposition, work items, plans, and task dependencies",
    class_ids: ["Task"],
    generated: [
      ["Goal", "goal"],
      ["Objective", "objective"],
      ["WorkItem", "work item"],
      ["TaskPlan", "task plan"],
      ["TaskStep", "task step"],
      ["TaskDependency", "task dependency"],
      ["TaskConstraint", "task constraint"],
      ["TaskCompletionCriterion", "task completion criterion"]
    ]
  },
  {
    id: "orchestration-actors-delegation",
    plane_id: "orchestration-plane",
    label: "Coordination Roles And Delegation Module",
    definition: "models coordination roles, delegation contracts, handoffs, agents-as-tools, authority scope, context isolation, ownership, worker selection, and delegation budgets",
    class_ids: ["Orchestrator", "WorkerAgent", "Subagent", "Handoff", "TaskDistribution"],
    generated: [
      ["DelegationEvent", "delegation event"],
      ["DelegationContract", "delegation contract"],
      ["WorkerPool", "worker pool"],
      ["SubagentRole", "subagent role"],
      ["SubagentContext", "subagent context"],
      ["HandoffTarget", "handoff target"],
      ["ResponsibilityTransfer", "responsibility transfer"],
      ["DelegationResult", "delegation result"],
      ["DelegationOwnership", "delegation ownership"],
      ["AnswerOwnership", "answer ownership"],
      ["ControlOwnership", "control ownership"],
      ["AgentAsToolInvocation", "agent as tool invocation"],
      ["ContextIsolation", "context isolation"],
      ["DelegatedAuthority", "delegated authority"],
      ["DelegationBudget", "delegation budget"],
      ["WorkerSelection", "worker selection"],
      ["WorkerAvailability", "worker availability"],
      ["WorkerCapabilityMatch", "worker capability match"]
    ]
  },
  {
    id: "orchestration-routing-control",
    plane_id: "orchestration-plane",
    label: "Routing And Control Module",
    definition: "models gates, routes, control policies, branching, and downstream operation selection",
    class_ids: ["Gate", "Route"],
    generated: [
      ["RoutingPolicy", "routing policy"],
      ["RoutingDecision", "routing decision"],
      ["BranchCondition", "branch condition"],
      ["RoutingTarget", "routing target"],
      ["DownstreamOperation", "downstream operation"],
      ["GateCondition", "gate condition"],
      ["GateOutcome", "gate outcome"],
      ["RetryPolicy", "retry policy"],
      ["StopCondition", "stop condition"]
    ]
  },
  {
    id: "orchestration-composition",
    plane_id: "orchestration-plane",
    label: "Composition Patterns Module",
    definition: "models prompt chains, parallelization, sectioning, voting, and synthesis patterns",
    class_ids: ["PromptChain", "Parallelization", "Sectioning", "Voting", "Synthesis"],
    generated: [
      ["ChainStage", "chain stage"],
      ["ParallelBranch", "parallel branch"],
      ["SectionAssignment", "section assignment"],
      ["VoteBallot", "vote ballot"],
      ["AggregationRule", "aggregation rule"],
      ["SynthesisPlan", "synthesis plan"],
      ["SynthesisInput", "synthesis input"],
      ["SynthesisOutput", "synthesis output"],
      ["OrchestrationTopology", "orchestration topology"]
    ]
  },
  {
    id: "orchestration-evaluation",
    plane_id: "orchestration-plane",
    label: "Control Feedback Loop Module",
    definition: "models evaluator-optimizer control loops, review triggers, feedback routing, visible deliberation operations, revisions, and bounded stop or retry lineage",
    class_ids: ["EvaluatorOptimizer", "ThinkAsTool", "ReviewEvent", "FeedbackEvent"],
    generated: [
      ["CritiqueArtifact", "critique artifact"],
      ["RevisionPlan", "revision plan"],
      ["ImprovementAttempt", "improvement attempt"],
      ["OptimizerState", "optimizer state"],
      ["ReflectionRecord", "reflection record"],
      ["FeedbackRouting", "feedback routing"],
      ["ReviewAssignment", "review assignment"],
      ["StopRetryLineage", "stop retry lineage"]
    ]
  },
  {
    id: "tool-registry-definition",
    plane_id: "tool-plane",
    label: "Tool Registry And Definition Module",
    definition: "models tool registries, definitions, schemas, descriptors, and capability metadata",
    class_ids: ["ToolPlane", "Tool", "ToolRegistry", "ToolDefinition"],
    generated: [
      ["ToolName", "tool name"],
      ["ToolDescription", "tool description"],
      ["ToolArgumentSchema", "tool argument schema"],
      ["ToolResultSchema", "tool result schema"],
      ["ToolCapability", "tool capability"],
      ["ToolPermissionSpec", "tool permission spec"],
      ["ToolVersion", "tool version"],
      ["ToolDeprecationNotice", "tool deprecation notice"]
    ]
  },
  {
    id: "tool-discovery-selection",
    plane_id: "tool-plane",
    label: "Tool Discovery And Selection Module",
    definition: "models tool search, matching, ranking, selection, and fallback",
    class_ids: ["ToolSearch", "ToolMatch"],
    generated: [
      ["ToolSearchQuery", "tool search query"],
      ["ToolCandidate", "tool candidate"],
      ["ToolCandidateSet", "tool candidate set"],
      ["ToolEmbeddingMatch", "tool embedding match"],
      ["ToolRegexMatch", "tool regex match"],
      ["ToolSelectionDecision", "tool selection decision"],
      ["ToolFallback", "tool fallback"],
      ["ToolDisambiguationPrompt", "tool disambiguation prompt"]
    ]
  },
  {
    id: "tool-invocation-execution",
    plane_id: "tool-plane",
    label: "Tool Invocation And Execution Module",
    definition: "models tool calls, programmatic calls, execution requests, results, and transcripts",
    class_ids: [
      "ToolCall",
      "ToolResult",
      "ExecutionRequest",
      "ExecutionResult",
      "ProgrammaticToolCall",
      "ToolTranscript",
      "Command",
      "ShellCommand",
      "CommandArgument",
      "CommandArea"
    ],
    generated: [
      ["ToolArgument", "tool argument"],
      ["ToolCallPlan", "tool call plan"],
      ["ToolCallAttempt", "tool call attempt"],
      ["ToolCallRetry", "tool call retry"],
      ["ToolError", "tool error"],
      ["ToolWarning", "tool warning"],
      ["ToolSideEffect", "tool side effect"],
      ["ToolResultObservation", "tool result observation"]
    ]
  },
  {
    id: "tool-mcp-transport",
    plane_id: "tool-plane",
    label: "MCP Transport Module",
    definition: "models MCP client/server roles, session surfaces, discovery, and transport-level tool exposure",
    class_ids: ["MCPClient", "MCPServer"],
    generated: [
      ["MCPSession", "MCP session"],
      ["MCPToolList", "MCP tool list"],
      ["MCPResourceList", "MCP resource list"],
      ["MCPPromptList", "MCP prompt list"],
      ["MCPElicitation", "MCP elicitation"],
      ["MCPAuthorization", "MCP authorization"],
      ["MCPTransport", "MCP transport"],
      ["MCPServerCapability", "MCP server capability"]
    ]
  },
  {
    id: "safety-trust-boundary",
    plane_id: "safety-plane",
    label: "Trust Boundary Module",
    definition: "models trust boundaries, authority scopes, data zones, and auditable boundary-crossing events",
    class_ids: ["TrustBoundary"],
    generated: [
      ["AuthorityScope", "authority scope"],
      ["DataZone", "data zone"],
      ["BoundaryCrossing", "boundary crossing"],
      ["ExternalBoundary", "external boundary"],
      ["InternalBoundary", "internal boundary"],
      ["RemoteAgentBoundary", "remote agent boundary"],
      ["ToolBoundary", "tool boundary"],
      ["NetworkBoundary", "network boundary"]
    ]
  },
  {
    id: "safety-permission-policy",
    plane_id: "safety-plane",
    label: "Permission And Policy Module",
    definition: "models permission prompts, policy rules, scoped authority, decisions, grants, exceptions, and authorization outcomes",
    class_ids: ["PermissionPrompt", "PolicyRule", "PolicyDecision", "AllowDecision", "DenyDecision", "EscalationDecision"],
    generated: [
      ["AuthorizationGrant", "authorization grant"],
      ["CapabilityGrant", "capability grant"],
      ["PermissionScope", "permission scope"],
      ["PermissionResponse", "permission response"],
      ["PolicyCondition", "policy condition"],
      ["PolicyAction", "policy action"],
      ["PolicyException", "policy exception"],
      ["HumanApproval", "human approval"]
    ]
  },
  {
    id: "safety-sandbox-network",
    plane_id: "safety-plane",
    label: "Sandbox And Network Module",
    definition: "models sandbox execution boundaries, process and filesystem policy, network egress, sockets, proxies, and denied calls",
    class_ids: ["Sandbox", "SandboxCommand", "NetworkCall", "DomainSocket", "Socket", "Proxy", "SOCKSProxy", "HTTPProxy", "NetworkResource"],
    generated: [
      ["NetworkPolicy", "network policy"],
      ["FilesystemPolicy", "filesystem policy"],
      ["ProcessPolicy", "process policy"],
      ["OutboundRequest", "outbound request"],
      ["InboundResponse", "inbound response"],
      ["ProxyRoute", "proxy route"],
      ["DeniedNetworkCall", "denied network call"],
      ["SandboxEscapeRisk", "sandbox escape risk"]
    ]
  },
  {
    id: "safety-injection-defense",
    plane_id: "safety-plane",
    label: "Injection Defense Module",
    definition: "models injection detection, source-sink taint propagation, tool-stream risk, memory poisoning, and pre-execution risk signals",
    class_ids: ["PatternScan", "InjectionSignature"],
    generated: [
      ["PromptInjectionSignal", "prompt injection signal"],
      ["IndirectInjectionSignal", "indirect injection signal"],
      ["ToolStreamInjectionSignal", "tool stream injection signal"],
      ["MaliciousToolOutput", "malicious tool output"],
      ["TaintedSource", "tainted source"],
      ["TaintedSpan", "tainted span"],
      ["TaintPropagation", "taint propagation"],
      ["SourceSinkFlow", "source sink flow"],
      ["UntrustedInstructionCandidate", "untrusted instruction candidate"],
      ["InstructionConflict", "instruction conflict"],
      ["TrustedInstructionOverride", "trusted instruction override"],
      ["RiskSource", "risk source"],
      ["RiskSink", "risk sink"],
      ["MemoryPoisoningSignal", "memory poisoning signal"],
      ["PersistentContextRisk", "persistent context risk"],
      ["PoisonedRetrievedChunk", "poisoned retrieved chunk"],
      ["PoisonedToolDescription", "poisoned tool description"],
      ["ToolSchemaPoisoning", "tool schema poisoning"],
      ["ResourceContentPoisoning", "resource content poisoning"],
      ["QuarantineAction", "quarantine action"],
      ["SanitizationAction", "sanitization action"],
      ["InjectionScanResult", "injection scan result"],
      ["DefenseFinding", "defense finding"]
    ]
  },
  {
    id: "safety-commit-redaction",
    plane_id: "safety-plane",
    label: "Commit And Redaction Module",
    definition: "models side-effect commit gates, approval and denial outcomes, rollback linkage, redaction, disclosure filtering, and audit disclosure",
    class_ids: ["CommitGate", "Redaction", "DisclosureRule", "ProgressiveDisclosure", "SuppressedOutput"],
    generated: [
      ["CommitRequest", "commit request"],
      ["CommitApproval", "commit approval"],
      ["CommitDenial", "commit denial"],
      ["SideEffect", "side effect"],
      ["SensitiveSpan", "sensitive span"],
      ["RedactionRule", "redaction rule"],
      ["DisclosureFilter", "disclosure filter"],
      ["AuditDisclosure", "audit disclosure"]
    ]
  },
  {
    id: "feedback-warning-error",
    plane_id: "feedback-plane",
    label: "Warning And Error Module",
    definition: "models warnings, errors, diagnostics, and issue signals",
    class_ids: ["FeedbackPlane", "Warning", "ErrorStream"],
    generated: [
      ["ErrorEvent", "error event"],
      ["WarningEvent", "warning event"],
      ["DiagnosticMessage", "diagnostic message"],
      ["FailureMode", "failure mode"],
      ["RetryableError", "retryable error"],
      ["BlockingError", "blocking error"],
      ["RiskSignal", "risk signal"],
      ["ConfidenceSignal", "confidence signal"]
    ]
  },
  {
    id: "feedback-review-optimization",
    plane_id: "feedback-plane",
    label: "Review And Optimization Module",
    definition: "models feedback, review, recovery actions, and optimization loops",
    class_ids: ["Feedback", "Review", "RecoveryAction", "OptimizationLoop"],
    generated: [
      ["HumanReview", "human review"],
      ["AutomatedReview", "automated review"],
      ["ReviewFinding", "review finding"],
      ["Correction", "correction"],
      ["LearningSignal", "learning signal"],
      ["OptimizationTarget", "optimization target"],
      ["RecoveryPlan", "recovery plan"],
      ["RollbackAction", "rollback action"]
    ]
  },
  {
    id: "feedback-metrics-evaluation",
    plane_id: "feedback-plane",
    label: "Metrics And Evaluation Module",
    definition: "models metrics, evaluation runs, scoring rubrics, and benchmark observations",
    class_ids: ["Metric", "EvaluationRun", "EvaluationCriterion"],
    generated: [
      ["Score", "score"],
      ["Rubric", "rubric"],
      ["EvaluationScenario", "evaluation scenario"],
      ["SuccessCriterion", "success criterion"],
      ["CostMetric", "cost metric"],
      ["LatencyMetric", "latency metric"],
      ["SafetyMetric", "safety metric"],
      ["RobustnessMetric", "robustness metric"]
    ]
  },
  {
    id: "feedback-logging",
    plane_id: "feedback-plane",
    label: "Logging Module",
    definition: "models log listeners, streams, log records, and observability channels",
    class_ids: ["LogListener"],
    generated: [
      ["LogRecord", "log record"],
      ["LogStream", "log stream"],
      ["AuditLog", "audit log"],
      ["TelemetryEvent", "telemetry event"],
      ["TraceExport", "trace export"],
      ["LogSubscription", "log subscription"],
      ["ErrorListener", "error listener"],
      ["EventSink", "event sink"]
    ]
  },
  {
    id: "adapter-protocols",
    plane_id: "adapter-plane",
    label: "Protocol Adapter Module",
    definition: "models protocol adapter mappings for MCP, A2A, FIPA, KQML, and related message, task, capability, and trust constructs without redefining canonical agent-system terms",
    source_ids: ["eng-proto-mcp-spec", "eng-proto-a2a-spec", "eng-proto-fipa-acl", "lit-proto-kqml"],
    class_ids: ["ProtocolAdapter"],
    generated: [
      ["MCPAdapter", "MCP adapter"],
      ["A2AAdapter", "A2A adapter"],
      ["FIPAAdapter", "FIPA adapter"],
      ["KQMLAdapter", "KQML adapter"],
      ["ProtocolMessageMapping", "protocol message mapping"],
      ["ProtocolTaskMapping", "protocol task mapping"],
      ["ProtocolCapabilityMapping", "protocol capability mapping"],
      ["ProtocolTrustMapping", "protocol trust mapping"]
    ]
  },
  {
    id: "adapter-frameworks",
    plane_id: "adapter-plane",
    label: "Framework Adapter Module",
    definition: "models Phase-1 seed framework mappings for graph runtimes, agent SDKs, crews, workflows, handoffs, traces, and subagent systems",
    source_ids: ["eng-fw-langgraph-docs", "eng-fw-openai-python-docs", "eng-fw-crewai-docs", "eng-fw-deepagents-docs"],
    class_ids: ["FrameworkAdapter"],
    generated: [
      ["LangGraphAdapter", "LangGraph adapter"],
      ["OpenAIAgentsAdapter", "OpenAI Agents adapter"],
      ["CrewAIAdapter", "CrewAI adapter"],
      ["DeepAgentsAdapter", "Deep Agents adapter"],
      ["MicrosoftAgentFrameworkAdapter", "Microsoft Agent Framework adapter"],
      ["LangChainAdapter", "LangChain adapter"],
      ["FrameworkHandoffMapping", "framework handoff mapping"],
      ["FrameworkTraceMapping", "framework trace mapping"]
    ]
  },
  {
    id: "adapter-benchmarks",
    plane_id: "adapter-plane",
    label: "Benchmark Adapter Module",
    definition: "models evaluation benchmark mappings for tasks, environments, scoring rubrics, metrics, observations, user simulations, artifacts, and pressure axes without turning benchmark-specific fields into ontology core",
    source_ids: ["eng-bench-swebench-site", "eng-bench-osworld-site", "eng-bench-tau2", "eng-bench-appworld"],
    class_ids: ["BenchmarkAdapter"],
    generated: [
      ["SWEBenchAdapter", "SWE-bench adapter"],
      ["OSWorldAdapter", "OSWorld adapter"],
      ["Tau2Adapter", "tau2 adapter"],
      ["AppWorldAdapter", "AppWorld adapter"],
      ["TerminalBenchAdapter", "Terminal-Bench adapter"],
      ["AgencyBenchAdapter", "AgencyBench adapter"]
    ]
  },
  {
    id: "adapter-statecharts",
    plane_id: "adapter-plane",
    label: "Statechart Adapter Module",
    definition: "models statechart and state-machine mappings from XState, SCXML, and formal statechart concepts to runtime lifecycle, snapshot, transition, guard, action, and path profiles",
    source_ids: ["eng-state-xstate-docs", "eng-state-xstate-graph", "eng-state-scxml", "lit-state-harel"],
    class_ids: ["StatechartAdapter"],
    generated: [
      ["XStateAdapter", "XState adapter"],
      ["SCXMLAdapter", "SCXML adapter"]
    ]
  },
  {
    id: "adapter-schema-export",
    plane_id: "adapter-plane",
    label: "Schema And Export Adapter Module",
    definition: "models structural schema, semantic graph, and language profile mappings",
    source_ids: ["eng-val-jsonschema-spec", "eng-val-shacl", "eng-val-shex", "eng-ont-owl"],
    class_ids: ["SchemaAdapter"],
    generated: [
      ["JSONSchemaAdapter", "JSON Schema adapter"],
      ["ZodProfileAdapter", "Zod profile adapter"],
      ["PydanticProfileAdapter", "Pydantic profile adapter"],
      ["OWLExportAdapter", "OWL export adapter"],
      ["SHACLExportAdapter", "SHACL export adapter"],
      ["ShExExportAdapter", "ShEx export adapter"],
      ["GraphIRAdapter", "Graph IR adapter"],
      ["FrontendViewAdapter", "frontend view adapter"]
    ]
  },
  {
    id: "adapter-mapping-infrastructure",
    plane_id: "adapter-plane",
    label: "Adapter Mapping Infrastructure Module",
    definition: "models shared adapter mapping records, mapping direction, conversion warnings, unsupported semantics, loss notes, approximation evidence, and source-backed conversion governance across all adapter families",
    source_ids: ["eng-ont-fibo-ontology-guide", "eng-val-jsonschema-spec", "eng-val-zod-json-schema", "eng-val-pydantic-json-schema"],
    class_ids: ["MappingRule", "ConversionWarning"],
    generated: []
  }
];

const safeSourceIds = (planeId, explicit = []) => [...new Set([...explicit, ...(sourceFallback[planeId] ?? [])])].slice(0, 4);
const cleanModuleLabel = (label) => label.replace(/\s+Module$/i, " module");
const cleanModuleScope = (module) => module.definition.replace(/^models\s+/i, "model ");
const kindPhrase = (kind) => kind.replace(/_/g, " ");
const classLabel = (id) => classById.get(id)?.label ?? id;
const normalizedTerm = (value) => value.toLowerCase().replace(/[-_/]+/g, " ").replace(/\s+/g, " ").trim();
const moduleSubject = (module) => module.definition.replace(/^models\s+/i, "").replace(/\.$/, "");
const moduleName = (module) => cleanModuleLabel(module.label);

const definitionsFor = (kind, item) => {
  const ledgerEntry = curatedDefinitions[item.id];
  if (!ledgerEntry?.definitions) {
    throw new Error(`Missing curated definitions for ${kind}:${item.id}`);
  }

  const definitions = ledgerEntry.definitions;
  for (const language of ["en", "zh", "ja"]) {
    if (typeof definitions[language] !== "string" || !definitions[language].trim()) {
      throw new Error(`Missing ${language} curated definition for ${kind}:${item.id}`);
    }
  }

  const canonicalEnglish = item.definition ?? item.statement;
  if (definitions.en !== canonicalEnglish) {
    throw new Error(`Curated English definition is stale for ${kind}:${item.id}`);
  }

  return definitions;
};

const attachDefinitions = (kind, item) => ({
  ...item,
  definitions: definitionsFor(kind, item)
});

const exactGeneratedClassDefinitions = new Map([
  [
    "ContextIngressEvent",
    "observable event in which a message, instruction, source span, retrieved candidate, tool observation, execution output, or summarized artifact becomes available to a model call or agent step."
  ],
  [
    "ContextPackage",
    "bundles the exact message envelopes, instructions, content blocks, source references, retrieval candidates, tool observations, citations, exclusions, and budget metadata visible to one model call or agent step."
  ],
  [
    "Message",
    "represents an observable communication envelope with role, sender, receiver, content blocks, conversation identity, turn order, and protocol binding."
  ],
  [
    "Conversation",
    "groups ordered message turns, instructions, tool observations, and context packages that share a conversation or thread identity."
  ],
  [
    "MessageHistory",
    "records the retained observable sequence of messages and turns available for session continuity, replay, retrieval, or context assembly."
  ],
  [
    "Instruction",
    "records a directive that constrains agent behavior and carries authority, scope, priority, provenance, and conflict-resolution metadata."
  ],
  [
    "SystemPrompt",
    "captures high-authority system-level instruction content that frames model behavior for a session, task, or model call."
  ],
  [
    "FewShotExample",
    "stores an example input-output or demonstration pattern used to condition behavior while remaining traceable as context content."
  ],
  [
    "AssistantMessage",
    "records an assistant-authored message envelope that may contain model output, tool-call intent, citations, or disclosed reasoning summaries."
  ],
  [
    "SystemMessage",
    "records a system-authored message envelope carrying high-authority constraints, instructions, or session framing for the visible context."
  ],
  [
    "UserMessage",
    "records a user-authored message envelope that introduces request content, constraints, corrections, attachments, or feedback into context."
  ],
  [
    "DeveloperMessage",
    "records a developer-authored message envelope that supplies implementation guidance, policy, constraints, or task framing below system authority and above ordinary user content."
  ],
  [
    "ToolResultMessage",
    "represents the message-form of a tool result when returned data, warning, error, or artifact content is staged into subsequent context."
  ],
  [
    "ToolObservationMessage",
    "represents an observation derived from tool or environment interaction that becomes visible to later agent reasoning or action selection."
  ],
  [
    "ExternalAgentMessage",
    "records a message envelope exchanged with a remote or peer agent across an interoperability or trust boundary."
  ],
  [
    "ConversationTurn",
    "identifies one ordered exchange position in a conversation and binds message content to turn index, role, sender, and reply context."
  ],
  [
    "MessageRole",
    "classifies the role under which a message is interpreted, such as system, developer, user, assistant, tool, or external agent."
  ],
  [
    "MessageContentBlock",
    "links a message envelope to one or more typed content blocks so multimodal content can be cited, filtered, or budgeted."
  ],
  [
    "MessageModality",
    "classifies message content by modality such as text, image, code, table, audio, file attachment, or structured data."
  ],
  [
    "MessageSender",
    "identifies the actor, service, tool, user, or remote agent that authored or emitted a message envelope."
  ],
  [
    "MessageReceiver",
    "identifies the actor, model call, tool, user, or remote agent intended to receive or interpret a message envelope."
  ],
  [
    "ConversationId",
    "carries the stable conversation identifier used to correlate turns, replies, sessions, protocol messages, and persisted history."
  ],
  [
    "ReplyTo",
    "records the prior message or turn that a message responds to so conversation structure is not reduced to a flat list."
  ],
  [
    "ThreadId",
    "carries a persistent thread identifier used to resume or group related conversations, tasks, and session state."
  ],
  [
    "TurnIndex",
    "records the ordinal position of a message or interaction within a conversation or execution trace."
  ],
  [
    "ProtocolEnvelope",
    "captures protocol-level wrapping around a message, including task identity, sender, receiver, artifact references, and capability metadata without promoting adapter-specific fields into core."
  ],
  [
    "InstructionAuthority",
    "states the authority level and source of an instruction so conflicts among system, developer, user, policy, retrieved, or tool-originated directives can be resolved."
  ],
  [
    "InstructionPriority",
    "records the precedence ordering used when multiple applicable instructions compete for control of a model call or agent step."
  ],
  [
    "InstructionScope",
    "bounds where an instruction applies, such as session, task, tool call, retrieved document, output format, or trust boundary."
  ],
  [
    "InstructionConflict",
    "records an incompatibility between two or more instructions together with affected scope, authority, and resolution evidence."
  ],
  [
    "InstructionResolution",
    "records the selected outcome for an instruction conflict, including which directive was followed, overridden, ignored, narrowed, or escalated."
  ],
  [
    "InstructionOverride",
    "records an authorized replacement or narrowing of one instruction by another with higher authority or more specific scope."
  ],
  [
    "InstructionApplicability",
    "states the conditions under which an instruction is active, inactive, inherited, or limited for a context package or agent step."
  ],
  [
    "InstructionProvenance",
    "links an instruction to its source message, policy, prompt template, retrieved artifact, protocol envelope, or human approval record."
  ],
  [
    "PromptVariable",
    "identifies a named placeholder in a prompt template and the source value or binding that populates it for a model call."
  ],
  [
    "PromptTemplateInstance",
    "records one filled prompt template instance with bindings, source references, and authority metadata used in a context package."
  ],
  [
    "SourceReference",
    "identifies a cited or retrievable source object by stable reference without claiming ownership of the storage system that hosts it."
  ],
  [
    "SourceSpan",
    "identifies the precise portion of a source that supports a context block, retrieval candidate, citation, summary, or disclosed output segment."
  ],
  [
    "SourceLocation",
    "records a source position such as URI, file path, database locator, graph identifier, page, line, offset, or cell reference."
  ],
  [
    "SourceAnchor",
    "provides a stable anchor that can re-identify a source span after chunking, rendering, indexing, or document revision."
  ],
  [
    "SourceChecksum",
    "records a digest or checksum used to detect whether cited source material has changed since ingestion or context staging."
  ],
  [
    "SourceVersion",
    "records the version, revision, timestamp, commit, snapshot, or release identifier associated with a source reference."
  ],
  [
    "SourceProvenance",
    "links a source reference to acquisition, ingestion, transformation, trust boundary, and evidence metadata."
  ],
  [
    "CitationAnchor",
    "binds a visible citation to the exact source reference and span that support a message, output, summary, or artifact claim."
  ],
  [
    "ContentDigest",
    "records a compact fingerprint of content used for deduplication, integrity checks, cache validation, or citation stability."
  ],
  [
    "AccessPath",
    "describes the path or handle through which a source reference can be retrieved, subject to permission, policy, and trust boundary controls."
  ],
  [
    "DataZoneReference",
    "points from a context artifact to the data zone whose visibility, retention, and handling policy governs that artifact."
  ],
  [
    "TrustBoundaryReference",
    "points from a context artifact to the trust boundary crossed or relied on by its source, transport, retrieval, or disclosure path."
  ],
  [
    "TextDocumentReference",
    "references a text document as source evidence while keeping the document store and ingestion system outside the context-ingress owner domain."
  ],
  [
    "FileResourceReference",
    "references a file-like resource by path, URI, version, digest, or span without modeling the full file system as context input."
  ],
  [
    "DatabaseRowReference",
    "references a specific database row, query result, or table slice that can support context content without owning the database."
  ],
  [
    "GraphNodeReference",
    "references a graph node or graph-local identifier that can support context content without owning the graph store."
  ],
  [
    "NetworkSourceReference",
    "references network-originated content or an endpoint-derived source while preserving trust-boundary and access-path metadata."
  ],
  [
    "SourceOffset",
    "records byte, character, token, or structural offsets used to locate a source span precisely."
  ],
  [
    "SourceLineRange",
    "records line-based source span boundaries used for code, logs, terminal output, documents, or text files."
  ],
  [
    "SourcePageRange",
    "records page-based source span boundaries used for paginated documents, PDFs, or rendered reports."
  ],
  [
    "SourceCellRange",
    "records table, sheet, notebook, or matrix cell ranges that support context content or citations."
  ],
  [
    "ResourceDescriptor",
    "summarizes identity, type, provenance, location, access hints, and trust metadata for a source or resource reference staged into context."
  ],
  [
    "TextDocument",
    "represents a text-bearing information source that can be referenced, chunked, indexed, cited, or assembled into context with source provenance."
  ],
  [
    "ContentBlock",
    "represents a bounded unit of context content with modality, encoding, source reference, token budget, and visibility metadata."
  ],
  [
    "TextBlock",
    "represents textual content staged into context, including natural language, logs, excerpts, summaries, or prompt fragments."
  ],
  [
    "ImageBlock",
    "represents image content or image-derived observations staged into context with source and modality metadata."
  ],
  [
    "CodeBlock",
    "represents source code, patches, stack traces, shell snippets, or executable text staged into context."
  ],
  [
    "TableBlock",
    "represents tabular content staged into context, including rows, columns, cell ranges, and source anchors."
  ],
  [
    "AudioBlock",
    "represents audio content or transcribed audio observations staged into context with modality and source metadata."
  ],
  [
    "FileAttachmentBlock",
    "represents an attached file or file excerpt made visible to a model call, including digest, mime type, and access reference."
  ],
  [
    "StructuredDataBlock",
    "represents JSON, records, schemas, tables, graph fragments, or other structured payloads staged into context."
  ],
  [
    "MimeType",
    "classifies the media type of a content block or attachment so parsers, renderers, and safety controls can interpret it correctly."
  ],
  [
    "Encoding",
    "records the character, binary, token, compression, or serialization encoding used by a content block or source span."
  ],
  [
    "TokenCount",
    "records the token budget contribution of a content block, message, retrieved candidate, or context package."
  ],
  [
    "LightIndex",
    "represents a lightweight discovery surface or pointer set used to find candidate context without owning the full indexing system."
  ],
  [
    "IndexPointer",
    "points from a context selection process to an index entry, search surface, or retrieval handle that may produce candidate content."
  ],
  [
    "SearchResult",
    "records a candidate returned by a search or discovery surface, including source reference, score, rank, and selection status."
  ],
  [
    "SearchScore",
    "records the score attached to a retrieved candidate, search result, index hit, or source pointer during context discovery."
  ],
  [
    "CandidateRank",
    "records the ordinal rank assigned to a retrieved candidate after scoring, filtering, or reranking."
  ],
  [
    "IndexVersionReference",
    "references the index version, snapshot, build, or configuration that produced a discovery candidate."
  ],
  [
    "DiscoverySurface",
    "identifies a lightweight surface such as search, file listing, memory namespace, tool descriptor list, or protocol resource list used to discover context candidates."
  ],
  [
    "RetrievedCandidate",
    "represents content returned by retrieval before the system decides whether it enters the context package."
  ],
  [
    "RetrievedContextCandidate",
    "represents a retrieved candidate evaluated specifically for inclusion in a model-call or agent-step context package."
  ],
  [
    "RetrievalScore",
    "records relevance, confidence, similarity, lexical match, or rerank evidence attached to a retrieved context candidate."
  ],
  [
    "LightweightRetrievalTrace",
    "records observable query, candidate, score, rank, and source-reference evidence for a lightweight context discovery pass."
  ],
  [
    "OutputChunk",
    "represents a bounded segment of command, tool, model, process, or artifact output prepared for citation, truncation, disclosure, or later context staging."
  ],
  [
    "OutputWindow",
    "identifies the visible or retained range of output that may be shown, cited, summarized, or passed into later context."
  ],
  [
    "OutputStream",
    "records an ordered stream of output segments produced by a model, command, process, or tool before windowing or disclosure."
  ],
  [
    "OutputSegment",
    "records an addressable segment within an output stream with ordering, source, visibility, and optional citation metadata."
  ],
  [
    "HeadTailWindow",
    "retains the beginning and ending spans of long output so important setup and terminal evidence can remain visible under length limits."
  ],
  [
    "LengthLimit",
    "states a byte, line, token, or segment limit that constrains output visibility, context inclusion, or progressive disclosure."
  ],
  [
    "DisclosureStage",
    "records a step in which output or context content is revealed, withheld, escalated, redacted, or released across a boundary."
  ],
  [
    "VisibleContextWindow",
    "represents the portion of content visible to a specific actor, model call, or agent step after selection, truncation, suppression, and disclosure controls."
  ],
  [
    "ContextSelectionDecision",
    "records why a candidate, message, source span, summary, or observation was selected, deferred, suppressed, or excluded from context."
  ],
  [
    "SuppressedContext",
    "records content intentionally kept out of visible context because of policy, trust boundary, relevance, privacy, or budget constraints."
  ],
  [
    "DisclosedOutputSegment",
    "represents an output segment that has been made visible to a recipient or downstream context together with citation and boundary metadata."
  ],
  [
    "TruncatedContextSpan",
    "records the portion of content removed or shortened by a context window, length limit, summarization, or output clipping decision."
  ],
  [
    "OutputCitation",
    "links visible output or a disclosed segment to the source span, retrieval candidate, trace event, or artifact that supports it."
  ],
  [
    "CommandOutputObservation",
    "records observable command output as context-ingress evidence without owning the command execution or container that produced it."
  ],
  [
    "StandardOutput",
    "captures the stdout stream emitted by a command, process, sandbox, or tool execution as observable output available for staging into context."
  ],
  [
    "StandardOutputChunk",
    "represents a bounded stdout segment with ordering, source span, truncation, and context-selection metadata."
  ],
  [
    "StandardErrorChunk",
    "represents a bounded stderr segment with ordering, diagnostic meaning, source span, truncation, and context-selection metadata."
  ],
  [
    "CommandExitStatus",
    "records the exit code or termination status produced by a command execution as observable evidence for later decisions."
  ],
  [
    "ExitStatusObservation",
    "represents an exit status after it has been observed and staged as context evidence for an agent step."
  ],
  [
    "ExecutionResultReference",
    "references a runtime or tool execution result whose observable output or status is being staged into context."
  ],
  [
    "WorkingDirectoryReference",
    "references the working directory relevant to observed execution output without making the directory itself a context-ingress artifact."
  ],
  [
    "EnvironmentBindingReference",
    "references a runtime environment binding relevant to observed execution output without exposing hidden or secret values by default."
  ],
  [
    "CommandExecution",
    "records a runtime event in which a command is executed in a shell, container, sandbox, or environment and produces observable status, output, side effects, or trace evidence."
  ],
  [
    "Command",
    "describes a tool- or runtime-level operation request that may be invoked with arguments, permissions, working directory, and observable results."
  ],
  [
    "ShellCommand",
    "describes a shell-level command invocation with command text, arguments, environment, working directory, and sandbox or permission context."
  ],
  [
    "CommandArgument",
    "records a structured or textual argument supplied to a command or shell invocation before execution."
  ],
  [
    "CommandArea",
    "groups command-related inputs, outputs, status observations, and execution controls for a terminal or runtime interaction surface."
  ],
  [
    "Container",
    "describes a runtime execution environment with filesystem state, process isolation, network settings, and session-local resources."
  ],
  [
    "ProcessHandle",
    "identifies the operating-system process reference used to monitor, stop, or correlate an execution attempt."
  ],
  [
    "WorkingDirectory",
    "records the filesystem location that scopes relative paths and process execution for a runtime or tool invocation."
  ],
  [
    "EnvironmentVariable",
    "captures a runtime name-value configuration binding, including process environment settings that may affect command execution, tool behavior, or secret handling."
  ],
  [
    "FileSystem",
    "represents a filesystem resource surface governed by runtime, safety, and access policy rather than a context input artifact."
  ],
  [
    "Resource",
    "represents an addressable information, capability, storage, or artifact surface that may be described, referenced, retrieved, or governed by policy."
  ],
  [
    "FileResource",
    "represents a file-like resource with path, version, digest, permissions, and possible source spans available through a resource surface."
  ],
  [
    "DirectoryResource",
    "represents a directory-like resource that scopes files, paths, discovery, permissions, and traversal policy."
  ],
  [
    "Database",
    "represents a database resource surface whose rows or query results may be referenced as context evidence through source references."
  ],
  [
    "DatabaseTable",
    "represents a structured table within a database resource surface whose rows or slices may be referenced as context evidence."
  ],
  [
    "DatabaseRow",
    "represents a database row or query-result row that may be addressed through a source reference, subject to policy and provenance."
  ],
  [
    "GraphStore",
    "represents a graph storage or graph retrieval surface whose nodes and edges may be referenced without making the store itself a context artifact."
  ],
  [
    "GraphNode",
    "represents an addressable node in a graph store that may carry properties, labels, provenance, and context-relevant references."
  ],
  [
    "GraphEdge",
    "represents an addressable relationship in a graph store connecting graph nodes with labels, direction, provenance, and context relevance."
  ],
  [
    "StorageArea",
    "represents a bounded storage surface or namespace governed by memory, runtime, access, and trust policies."
  ],
  [
    "TextCorpus",
    "represents a collection of text documents or text-bearing records prepared for ingestion, retrieval, citation, or context assembly."
  ],
  [
    "NetworkResource",
    "represents network-originated or network-accessible resources governed by transport, trust-boundary, and safety policy controls."
  ],
  [
    "Embedding",
    "records a dense, sparse, lexical, or graph representation used by memory and retrieval indexes to compare or retrieve source material."
  ],
  [
    "TextEmbedding",
    "records a text-derived representation used by retrieval indexes for similarity search, ranking, clustering, or context selection."
  ],
  [
    "GraphEmbedding",
    "records a graph-derived representation used to retrieve or rank graph nodes, edges, neighborhoods, or structured context candidates."
  ],
  [
    "IndexEntry",
    "records an addressable item inside a retrieval index, including key, source reference, representation, and index-version metadata."
  ],
  [
    "IndexKey",
    "records the key or lookup handle used to retrieve an index entry or candidate set from a memory or discovery index."
  ],
  [
    "IndexRefreshEvent",
    "records an observable memory-index update, rebuild, or refresh event and the index version it produces."
  ],
  [
    "DisclosureRule",
    "defines a safety or policy rule that determines when content may be revealed, redacted, delayed, summarized, or blocked for a recipient."
  ],
  [
    "ProgressiveDisclosure",
    "records a controlled release pattern in which content is revealed in stages under policy, trust-boundary, and context-window constraints."
  ],
  [
    "SuppressedOutput",
    "records output withheld from a viewer or downstream context because of policy, privacy, safety, boundary, or budget constraints."
  ],
  [
    "ToolResultObservation",
    "records the observable content, warning, error, artifact reference, or side effect returned by a tool execution for tracing and possible context staging."
  ],
  [
    "AuthorityScope",
    "defines the canonical authorization envelope for an actor, tool, service, or runtime by naming permitted operations, protected resources, data zones, trust boundaries, expiry, and enforcement limits."
  ],
  [
    "DataZone",
    "groups data by trust, visibility, retention, and handling policy so that context, memory, tool output, and artifacts can carry boundary-aware controls."
  ],
  [
    "TrustBoundary",
    "defines a boundary where identity, authority, visibility, execution control, data handling, or accountability assumptions change and therefore must be explicit in safety decisions."
  ],
  [
    "BoundaryCrossing",
    "captures an observable transfer of control, data, artifact, message, or authority across a trust boundary, carrying source actor, target actor, source zone, target zone, direction, transferred object, authority basis, policy decision, protocol or tool context, and trace evidence."
  ],
  [
    "PermissionPrompt",
    "records a request for authority before an action proceeds, including requesting actor, operation, protected resource, scope, decision options, and approval channel."
  ],
  [
    "PolicyRule",
    "defines a safety or governance rule that can evaluate actor authority, requested operation, protected resource, data zone, trust boundary, runtime context, and enforcement action."
  ],
  [
    "PolicyDecision",
    "records the concrete allow, deny, escalate, redact, quarantine, sandbox, or approval-required outcome produced by evaluating a policy rule against a requested operation."
  ],
  [
    "AllowDecision",
    "records a policy decision that permits a bounded operation to proceed under stated scope, conditions, trace evidence, and expiry."
  ],
  [
    "DenyDecision",
    "records a policy decision that prevents an operation, tool call, network request, disclosure, or side effect from proceeding and preserves the denial reason."
  ],
  [
    "EscalationDecision",
    "records a policy decision that routes a request to a higher-authority reviewer, human approval, stricter sandbox, or additional verification path."
  ],
  [
    "HumanApproval",
    "records explicit human authorization or rejection for an action, permission request, side effect, disclosure, or policy exception with actor and trace provenance."
  ],
  [
    "Sandbox",
    "defines an isolated execution boundary that constrains process, filesystem, environment, network, credentials, and side effects for commands or tool calls."
  ],
  [
    "SandboxCommand",
    "records a command executed within a sandbox, including command text, arguments, working directory, environment exposure, policy constraints, output, and side effects."
  ],
  [
    "NetworkCall",
    "records an attempted or completed network operation with destination, protocol, method, credential scope, proxy route, data zone, policy decision, and trace evidence."
  ],
  [
    "DomainSocket",
    "records use of a local domain socket as a communication surface whose boundary, permission, credential, and sandbox implications must be explicit."
  ],
  [
    "Socket",
    "records a communication endpoint used by sandboxed processes, proxies, tools, or network calls and links it to protocol, route, policy, and trace evidence."
  ],
  [
    "Proxy",
    "represents a controlled proxy surface that mediates outbound or inbound traffic according to network policy, credential scope, logging, and data-zone constraints."
  ],
  [
    "SOCKSProxy",
    "represents a SOCKS proxy route used to mediate network egress while preserving policy, target, credential, and audit metadata."
  ],
  [
    "HTTPProxy",
    "represents an HTTP or HTTPS proxy route used to mediate requests and responses under egress policy, credential scope, and disclosure controls."
  ],
  [
    "NetworkResource",
    "identifies a network-originated resource or endpoint whose content, credentials, response data zone, and trust boundary affect agent safety decisions."
  ],
  [
    "AuthorizationGrant",
    "records an authorization result or credential-like grant issued after a policy decision, including grant scope, protected resource, subject actor, validity window, revocation state, and audit basis."
  ],
  [
    "CapabilityGrant",
    "records a grant for a specific tool, capability, resource surface, or operation so authorization can be checked at the point of invocation rather than inferred from actor identity alone."
  ],
  [
    "PermissionScope",
    "bounds a single permission request or response by naming the requested operation, protected resource, actor, data zone, trust boundary, duration, and allowed side effects."
  ],
  [
    "PermissionResponse",
    "records the response to a permission prompt, including allow, deny, escalate, conditionally allow, expiry, user or policy authority, and traceable rationale."
  ],
  [
    "PolicyCondition",
    "states a safety policy predicate over subject actor, requested operation, protected resource, data zone, trust boundary, policy basis, runtime state, and enforcement mode."
  ],
  [
    "PolicyAction",
    "describes the enforcement action chosen by a policy decision, such as allow, deny, redact, quarantine, require approval, route to sandbox, limit network egress, or escalate."
  ],
  [
    "PolicyException",
    "records a bounded exception to a policy rule with exception scope, authorized actor, protected resource, expiration, revocation condition, compensating control, and audit reason."
  ],
  [
    "RemoteAgentBoundary",
    "marks the opacity, identity, authority, and accountability trust boundary created when work, messages, tasks, or artifacts are delegated to or received from a remote agent."
  ],
  [
    "NetworkPolicy",
    "defines allowed and denied network egress or ingress conditions, including destination host, port, protocol, method, proxy route, credential scope, data zone, and denial reason."
  ],
  [
    "FilesystemPolicy",
    "defines filesystem read, write, execute, path, retention, and redaction constraints applied to sandbox commands, tool calls, side effects, and artifacts."
  ],
  [
    "ProcessPolicy",
    "defines process execution constraints such as command allowlist, argument limits, environment exposure, timeout, retry policy, resource limits, and sandbox escape handling."
  ],
  [
    "OutboundRequest",
    "records a boundary-crossing outbound request from a tool, sandbox, protocol adapter, or remote-agent interaction, including target endpoint, method, credential scope, data zone, and policy decision."
  ],
  [
    "InboundResponse",
    "records an inbound response returned across a boundary, including origin, response data zone, status, tool or protocol context, injection scan result, and disclosure handling."
  ],
  [
    "ProxyRoute",
    "records the controlled proxy path used for network traffic, including proxy kind, target endpoint, allowed protocol, credential boundary, egress policy, and trace evidence."
  ],
  [
    "DeniedNetworkCall",
    "records a network call blocked by policy or sandbox control, including requested destination, protected data zone, denial reason, policy decision, and trace event."
  ],
  [
    "SandboxEscapeRisk",
    "records evidence that a command, process, file operation, network route, or tool result may bypass or weaken the intended sandbox isolation boundary."
  ],
  [
    "PromptInjectionSignal",
    "records evidence that a message, source span, retrieved content, or tool result contains instructions attempting to override trusted instructions, manipulate tool arguments, exfiltrate data, or bypass policy."
  ],
  [
    "IndirectInjectionSignal",
    "records evidence that untrusted external content can influence agent behavior after retrieval, summarization, memory persistence, tool observation, or protocol translation."
  ],
  [
    "ToolStreamInjectionSignal",
    "records evidence that streamed tool output, tool result messages, logs, or remote artifacts attempt to inject instructions into later context, tool arguments, routing, or disclosure decisions."
  ],
  [
    "MaliciousToolOutput",
    "records tool, resource, sandbox, or remote-agent output that carries untrusted instructions, exfiltration cues, policy-bypass attempts, deceptive tool guidance, or prompt-injection content."
  ],
  [
    "TaintedSource",
    "identifies an untrusted or policy-sensitive source whose content must be tracked before it enters context, memory, a tool argument, a network request, or disclosed output."
  ],
  [
    "TaintedSpan",
    "identifies the exact span of message, source, retrieved chunk, tool result, or output segment that carries tainted content for downstream source-sink analysis."
  ],
  [
    "TaintPropagation",
    "reifies the propagation of taint from one source span, context package, memory item, tool result, or artifact to another observable object."
  ],
  [
    "SourceSinkFlow",
    "records a source-to-sink risk path from untrusted content to a protected sink such as tool arguments, network calls, memory writes, side effects, or disclosed output."
  ],
  [
    "UntrustedInstructionCandidate",
    "records an instruction-like text or structured directive from an untrusted source before it is accepted, ignored, quarantined, overridden, or escalated."
  ],
  [
    "InstructionConflict",
    "records a safety-relevant conflict between trusted instructions and untrusted or lower-authority instruction candidates, including affected scope and resolution."
  ],
  [
    "TrustedInstructionOverride",
    "records that a higher-authority instruction, policy, or approval overrides an untrusted or lower-authority instruction candidate for a bounded scope."
  ],
  [
    "RiskSource",
    "classifies the origin of a safety risk, such as external message, retrieved document, tool output, remote agent artifact, memory item, network response, or user-supplied file."
  ],
  [
    "RiskSink",
    "classifies the protected destination that tainted content may influence, such as tool invocation, credentialed request, filesystem write, memory update, network call, or final disclosure."
  ],
  [
    "MemoryPoisoningSignal",
    "records evidence that persistent memory, retrieved chunks, indexes, summaries, or long-term context may contain instructions or data intended to corrupt later agent behavior."
  ],
  [
    "PersistentContextRisk",
    "records a risk that unsafe, stale, adversarial, or over-authoritative content will persist across sessions, retrieval, summaries, checkpoints, or memory writes."
  ],
  [
    "PoisonedRetrievedChunk",
    "identifies a retrieved memory or document chunk that contains unsafe instructions, misleading metadata, tainted spans, or prompt-injection content."
  ],
  [
    "PoisonedToolDescription",
    "identifies a tool description, MCP tool list entry, capability advertisement, or help text that attempts to manipulate selection, arguments, permissions, or trust."
  ],
  [
    "ToolSchemaPoisoning",
    "records adversarial or unsafe changes to tool schema, argument descriptions, defaults, examples, or metadata that could alter tool selection or invocation."
  ],
  [
    "ResourceContentPoisoning",
    "records adversarial content in resources, files, web pages, protocol artifacts, or database rows that can later be retrieved into context or tool execution."
  ],
  [
    "InjectionScanResult",
    "records the result of scanning content for injection or taint risk, including matched signal, affected span, source, confidence, policy decision, and downstream sink if known."
  ],
  [
    "DefenseFinding",
    "records a safety finding emitted by injection defense or taint analysis before it is converted into feedback metrics, review findings, blocking errors, or policy decisions."
  ],
  [
    "QuarantineAction",
    "records an action that isolates content, tool output, retrieved memory, or artifact from normal context and execution flow until review or policy resolution."
  ],
  [
    "SanitizationAction",
    "records an action that removes, rewrites, masks, neutralizes, or narrows unsafe content before it can affect context, tool arguments, memory, or disclosure."
  ],
  [
    "CommitGate",
    "represents a side-effect gate that blocks or delays writes, external actions, network effects, commits, or disclosures until policy checks, approvals, or rollback controls are satisfied."
  ],
  [
    "CommitRequest",
    "records a request to perform a side effect such as file write, repository commit, network mutation, external API action, memory write, or disclosure release."
  ],
  [
    "CommitApproval",
    "records an approval outcome that authorizes a bounded side effect, including approver or policy authority, protected resource, scope, conditions, expiry, and trace evidence."
  ],
  [
    "CommitDenial",
    "records a denial outcome that blocks a requested side effect, including policy basis, denial reason, affected resource, actor, and audit trace."
  ],
  [
    "SideEffect",
    "records an externally visible or persistent effect produced by a tool call, sandbox command, network call, memory write, file write, commit, or protocol operation."
  ],
  [
    "SensitiveSpan",
    "identifies a span of output, source, message, trace, artifact, or memory content that requires redaction, suppression, masking, delayed disclosure, or restricted routing."
  ],
  [
    "Redaction",
    "records the operation that masks, removes, replaces, summarizes, or withholds sensitive content before it is shown, exported, stored, or sent across a boundary."
  ],
  [
    "RedactionRule",
    "defines a policy rule for detecting, masking, suppressing, summarizing, or replacing sensitive spans before content crosses an output or trust boundary."
  ],
  [
    "DisclosureFilter",
    "applies disclosure policy to output windows, context packages, artifacts, traces, or messages, deciding whether content is released, redacted, suppressed, or escalated."
  ],
  [
    "AuditDisclosure",
    "records the auditable disclosure decision for released, redacted, or suppressed content, including filter, policy, recipient boundary, sensitive span, and trace evidence."
  ],
  [
    "MCPAdapter",
    "maps MCP client/server concepts for tools, resources, prompts, discovery, authorization, transport, and capability metadata into adapter-level ontology records."
  ],
  [
    "A2AAdapter",
    "maps agent-to-agent remote agent identity, task lifecycle, message and artifact exchange, opaque execution boundaries, and delegation metadata into adapter records."
  ],
  [
    "ProtocolAdapter",
    "adapter membrane component that maps protocol-native envelopes, messages, tasks, capabilities, identity, and trust metadata to canonical agent-system terms without importing protocol fields into core."
  ],
  [
    "FIPAAdapter",
    "maps FIPA ACL communicative acts, message parameters, interaction protocols, and agent-management constructs to canonical message, actor, conversation, route, and protocol mapping terms."
  ],
  [
    "KQMLAdapter",
    "maps KQML performatives, content-language metadata, conversation controls, sender and receiver roles, and message envelopes to canonical communication and routing terms."
  ],
  [
    "FrameworkAdapter",
    "phase-1 seed adapter family for aligning framework-native agents, graph runtimes, crews, workflows, handoffs, traces, tools, memory, and subagent constructs to canonical ontology anchors."
  ],
  [
    "LangGraphAdapter",
    "maps LangGraph graph runtime constructs such as nodes, edges, durable execution, checkpoints, state updates, streams, and graph API operations to canonical orchestration and runtime terms."
  ],
  [
    "OpenAIAgentsAdapter",
    "maps OpenAI Agents SDK constructs such as agents, tools, agents-as-tools, handoffs, guardrails, sessions, and tracing spans to canonical orchestration, tool, safety, and runtime terms."
  ],
  [
    "CrewAIAdapter",
    "maps CrewAI agents, tasks, crews, processes, flows, guardrails, memory, knowledge, and observability constructs to canonical actor, task, orchestration, memory, safety, and feedback terms."
  ],
  [
    "DeepAgentsAdapter",
    "maps Deep Agents planning, subagents, filesystem context, interrupts, long-term memory, MCP tools, and isolated subagent context to canonical orchestration, memory, tool, runtime, and adapter terms."
  ],
  [
    "MicrosoftAgentFrameworkAdapter",
    "maps Microsoft Agent Framework agent and workflow constructs, multi-agent coordination, runtime services, and integration surfaces to canonical actor, orchestration, tool, runtime, and adapter terms."
  ],
  [
    "LangChainAdapter",
    "maps LangChain agent-loop, middleware, tool, structured-output, context, and integration constructs to canonical task, tool, context, runtime, and adapter terms."
  ],
  [
    "FrameworkHandoffMapping",
    "directional mapping record that aligns a framework-native handoff construct with canonical Handoff, responsibility transfer, authority scope, visible context, and result ownership terms."
  ],
  [
    "FrameworkTraceMapping",
    "directional mapping record that aligns framework-native trace, span, run, checkpoint, or stream constructs with canonical TraceRecord, TraceSpan, TraceEvent, RuntimeSession, and artifact provenance terms."
  ],
  [
    "BenchmarkAdapter",
    "adapter family that maps benchmark tasks, scenarios, environments, scoring rubrics, metrics, observations, user simulations, artifacts, and pressure axes into evaluation profiles without changing ontology core."
  ],
  [
    "SWEBenchAdapter",
    "maps SWE-bench software-issue tasks, repository patches, tests, resolved status, leaderboard variants, and coding-agent artifacts to canonical task, artifact, run, and evaluation metric terms."
  ],
  [
    "OSWorldAdapter",
    "maps OSWorld computer-use environments, desktop tasks, execution observations, success checks, and environment pressure into canonical runtime, tool, artifact, and evaluation terms."
  ],
  [
    "Tau2Adapter",
    "maps tau2 conversational task environments, knowledge constraints, user-simulation conditions, task outcomes, and benchmark verification signals into canonical evaluation adapter terms."
  ],
  [
    "AppWorldAdapter",
    "maps AppWorld application and API tasks, controllable app state, state-based tests, tool/API calls, and benchmark observations into canonical task, tool, state, and evaluation terms."
  ],
  [
    "TerminalBenchAdapter",
    "maps Terminal-Bench shell tasks, container-like terminal execution, command artifacts, grading checks, and resource pressure into canonical runtime, command, artifact, and evaluation terms."
  ],
  [
    "AgencyBenchAdapter",
    "maps AgencyBench long-horizon tasks, tool-call pressure, context length, multi-step observations, and scoring evidence into canonical task, runtime, tool, and evaluation adapter terms."
  ],
  [
    "StatechartAdapter",
    "adapter family that maps state-machine and statechart constructs to runtime lifecycle profiles while keeping XState, SCXML, and formal statechart fields outside ontology core."
  ],
  [
    "XStateAdapter",
    "maps XState machines, actors, states, transitions, events, guards, actions, snapshots, graph paths, and model-based testing constructs to canonical runtime statechart profile terms."
  ],
  [
    "SCXMLAdapter",
    "maps SCXML state machines, states, transitions, events, executable content, datamodel elements, and interoperability semantics to canonical statechart profile and runtime lifecycle terms."
  ],
  [
    "SchemaAdapter",
    "adapter family that projects canonical ontology terms into structural schemas, semantic graph shapes, language profiles, Graph IR, and frontend views while preserving provenance and conversion warnings."
  ],
  [
    "JSONSchemaAdapter",
    "projects canonical structural contracts into JSON Schema Draft 2020-12 compatible schemas, separating JSON validation from semantic graph validation and recording conversion warnings."
  ],
  [
    "ZodProfileAdapter",
    "projects canonical schemas into Zod runtime schemas and JSON Schema exports while recording unrepresentable runtime features, input/output mode differences, and metadata registry effects."
  ],
  [
    "PydanticProfileAdapter",
    "projects canonical schemas into Pydantic schema profiles such as BaseModel and TypeAdapter JSON Schema output, separating Pydantic schema conversion from framework-specific agent runtime semantics."
  ],
  [
    "OWLExportAdapter",
    "projects canonical ontology terms into OWL/RDF export artifacts while keeping OWL axioms and semantic reasoning separate from the canonical structural JSON schema contract."
  ],
  [
    "SHACLExportAdapter",
    "projects canonical ontology terms into SHACL shapes and validation reports for RDF graph constraints, separate from JSON Schema structural validation."
  ],
  [
    "ShExExportAdapter",
    "projects canonical ontology terms into ShEx shape expressions for RDF graph validation, keeping ShEx semantics distinct from SHACL and JSON Schema outputs."
  ],
  [
    "GraphIRAdapter",
    "projects ontology planes, modules, classes, relations, provenance, and adapter mappings into the explorer Graph IR without changing canonical ontology semantics."
  ],
  [
    "FrontendViewAdapter",
    "projects canonical ontology and Graph IR records into frontend explorer views, filters, localized labels, and inspector panels without creating new ontology terms."
  ],
  [
    "MappingRule",
    "directional mapping artifact that records how an external construct maps to a canonical term or how a canonical term projects to an external construct, including source, version, scope, and loss notes."
  ],
  [
    "ConversionWarning",
    "conversion governance event that records mapping loss, approximation, unsupported semantics, ambiguity, non-round-trip behavior, or review requirements during adapter conversion."
  ],
  [
    "ProtocolMessageMapping",
    "aligns protocol-specific message envelopes with canonical message, artifact, actor, and trace concepts without making protocol fields part of core."
  ],
  [
    "ProtocolTaskMapping",
    "aligns protocol task lifecycle states with canonical goals, tasks, work items, artifacts, and observable trace events."
  ],
  [
    "ProtocolCapabilityMapping",
    "aligns protocol capability advertisements with tool, resource, prompt, actor, and permission surfaces exposed across a protocol boundary."
  ],
  [
    "ProtocolTrustMapping",
    "aligns protocol identity, authentication, authorization, and opacity metadata with trust-boundary and authority-scope concepts."
  ],
  [
    "RemoteAgentBoundary",
    "marks the opacity, identity, authority, and accountability trust boundary created when work, messages, tasks, or artifacts are delegated to or received from a remote agent."
  ],
  [
    "RuntimeEnvironment",
    "describes the concrete execution environment for a session, including container, sandbox, working directory, process settings, model/tool availability, and runtime configuration."
  ],
  [
    "RunAttempt",
    "records one individual execution attempt within a session or task, including retry lineage, invoked inputs, observed events, and attempt-level status."
  ],
  [
    "RunOutcome",
    "records the terminal result of a run attempt or session, including success, failure, cancellation, produced artifacts, and final observable state."
  ],
  [
    "SessionLifecycle",
    "defines the ordered lifecycle of a runtime session from start through pause, resume, checkpoint, completion, cancellation, or end."
  ],
  [
    "SessionStartEvent",
    "records the observable event that opens a runtime session and binds the session to initial actor, environment, goal, and context state."
  ],
  [
    "SessionPauseEvent",
    "records an observable transition where a session stops progressing while preserving resumable state and pending work."
  ],
  [
    "SessionResumeEvent",
    "records the observable transition that restores a paused session from retained state, checkpoint, or external continuation."
  ],
  [
    "SessionEndEvent",
    "records the observable closure of a runtime session, including final status, cleanup, artifacts, and remaining audit references."
  ],
  [
    "AgentSystem",
    "runtime arrangement that coordinates actors, models, tools, memory, policies, traces, sessions, and artifacts to perform bounded agent work."
  ],
  [
    "RuntimeSession",
    "bounded execution episode that groups attempts, actors, environment, budget, context, trace records, checkpoints, state, and artifacts under one session identity."
  ],
  [
    "RuntimeBudget",
    "runtime limit record for time, token, cost, retry, tool-call, context-window, or resource consumption constraints applied to an execution attempt or session."
  ],
  [
    "AgentActor",
    "runtime identity capable of acting, observing, invoking tools, receiving delegation, emitting trace events, and being accountable for session activity."
  ],
  [
    "UserActor",
    "human or client-side participant whose requests, feedback, approvals, corrections, or attachments enter the runtime as observable inputs."
  ],
  [
    "DeveloperActor",
    "runtime participant responsible for developer-level instructions, implementation constraints, environment setup, or review decisions."
  ],
  [
    "HumanOperator",
    "person who can approve, pause, resume, redirect, review, or supply missing information during a runtime session."
  ],
  [
    "ModelActor",
    "model-backed runtime participant that generates, embeds, ranks, evaluates, transforms, or classifies information while producing traceable spans and budget use."
  ],
  [
    "GenerativeModel",
    "model actor specialized for generating text, code, structured output, plans, summaries, or tool-call arguments within a traced runtime step."
  ],
  [
    "EmbeddingModel",
    "model actor specialized for producing vector or lexical representations used by retrieval, indexing, matching, or context-selection steps."
  ],
  [
    "RerankerModel",
    "model actor specialized for reordering retrieved candidates, tool options, source spans, or answer candidates using relevance evidence."
  ],
  [
    "ReviewerActor",
    "runtime participant that inspects outputs, trace evidence, artifacts, or policy-sensitive decisions and records review findings or approval state."
  ],
  [
    "ToolServiceActor",
    "runtime participant representing a callable service or tool endpoint that executes requests and returns observable results, warnings, errors, or artifacts."
  ],
  [
    "SystemServiceActor",
    "runtime participant representing an internal service such as scheduler, sandbox, storage, telemetry, or policy mediator used by the agent system."
  ],
  [
    "ExternalServiceActor",
    "runtime participant outside the controlled system that can receive requests, return results, or introduce trust-boundary and provenance obligations."
  ],
  [
    "RemoteAgentReference",
    "opaque reference to a remote agent participant whose identity, authority, task state, and artifacts are visible while its private tools, memory, and reasoning remain outside the local runtime."
  ],
  [
    "ActorRoleBinding",
    "assignment record that binds a runtime actor to a responsibility-bearing role so delegation, review, approval, and accountability remain traceable."
  ],
  [
    "ActorCapabilityBinding",
    "binding record that connects a runtime actor to callable, observable, retrieval, generation, or review capabilities together with allowed conditions of use."
  ],
  [
    "ActorAuthorityScope",
    "authority-scope record that bounds the operations, resources, tools, data zones, and trust boundaries a runtime actor may access."
  ],
  [
    "AgentTranscript",
    "ordered runtime transcript of messages, actions, tool calls, model outputs, policy decisions, warnings, and artifact references that were actually visible or emitted."
  ],
  [
    "TraceRecord",
    "trace container for one runtime workflow or session segment, grouping spans, trace context, links, ordered events, retention policy, and root-span identity."
  ],
  [
    "TraceSpan",
    "operation interval or unit of work inside a trace, with parent span, timing, status, attributes, contained events, and links to related spans."
  ],
  [
    "TraceLink",
    "non-parent causal or contextual association between spans, events, traces, attempts, or artifacts when ordinary parent-child trace structure is insufficient."
  ],
  [
    "TraceContext",
    "correlation context carrying trace identifiers, parent context, sampling state, propagation metadata, and boundary information for a trace record."
  ],
  [
    "SpanAttribute",
    "keyed attribute attached to a trace span to record operation name, model/tool identity, status detail, latency, token use, or other observable metadata."
  ],
  [
    "SpanStatus",
    "status record for a trace span, such as unset, ok, error, cancelled, blocked, retried, or degraded, with optional diagnostic context."
  ],
  [
    "TraceEvent",
    "observable runtime occurrence such as a message, action, tool call, state update, warning, policy decision, artifact update, or checkpoint event."
  ],
  [
    "TraceRetentionPolicy",
    "policy governing trace storage duration, sampling, redaction, visibility, export destination, deletion, privacy class, and no-retention modes."
  ],
  [
    "AuditRecord",
    "raw audit evidence attached to a runtime session or trace, preserving what happened and who or what was associated without performing feedback interpretation."
  ],
  [
    "Checkpoint",
    "saved continuation point that captures session state so a runtime can resume, branch, recover, inspect, or time travel from a known state."
  ],
  [
    "StateSnapshot",
    "captured runtime state for a session, actor, graph, tool, or statechart step, used for inspection, recovery, replay, or lifecycle transition."
  ],
  [
    "StateDiff",
    "difference record from one state snapshot to another, showing changed values, channels, artifacts, or lifecycle positions between two captured states."
  ],
  [
    "CheckpointRestoreEvent",
    "observable event that restores a runtime session, actor, graph, or workflow from a saved checkpoint and records restore provenance."
  ],
  [
    "ReplayEvent",
    "observable event that replays a trace, span, session segment, checkpoint, or artifact lineage for debugging, evaluation, reproduction, or review."
  ],
  [
    "ObservableSummary",
    "observable runtime summary that compresses prior events, state, transcript, or artifact evidence for context budget, review, or handoff without storing private reasoning transcripts."
  ],
  [
    "Artifact",
    "runtime work product with provenance, produced or consumed by attempts, events, actors, tools, or sessions and traceable through derivation, attribution, review, and export."
  ],
  [
    "DraftArtifact",
    "artifact lifecycle state representing an incomplete, tentative, or reviewable work product that may later be revised, finalized, or discarded."
  ],
  [
    "FinalArtifact",
    "artifact lifecycle state representing a completed or accepted work product with terminal provenance, review, and delivery evidence."
  ],
  [
    "PatchArtifact",
    "artifact form that represents a proposed or applied code, document, configuration, or data change together with source and execution provenance."
  ],
  [
    "ReportArtifact",
    "artifact form that summarizes findings, evaluations, evidence, decisions, or progress produced by a runtime session or review pass."
  ],
  [
    "GraphArtifact",
    "artifact form that serializes graph structure, topology, node-edge evidence, layout metadata, or ontology/trace graph projections."
  ],
  [
    "SchemaArtifact",
    "runtime-produced or runtime-consumed schema artifact, limited to the schema object used during execution and not redefining adapter export semantics."
  ],
  [
    "ExportArtifact",
    "artifact state or form prepared for transfer outside the runtime boundary, carrying export profile, visibility, provenance, and review metadata."
  ],
  [
    "EnvironmentVariable",
    "captures a runtime name-value configuration binding, including process environment settings that may affect command execution, tool behavior, or secret handling."
  ],
  [
    "IngestionRun",
    "records one source-ingestion execution that loads, parses, deduplicates, annotates, or attaches documents for memory and retrieval use."
  ],
  [
    "MCPSession",
    "records the MCP client/server connection context in which capabilities, requests, responses, authorization, and transport metadata are exchanged."
  ],
  [
    "ContextBudget",
    "defines the token, window, cost, freshness, and priority limits used when deciding what information may enter a runtime context."
  ],
  [
    "ContextExclusion",
    "records information intentionally omitted, redacted, deferred, or blocked from context because of privacy, trust-boundary, relevance, or budget policy."
  ],
  [
    "ContextRefreshEvent",
    "records an observable update that replaces stale context, re-runs retrieval, or reorders context after new evidence or state changes."
  ],
  [
    "ContextSlot",
    "identifies a reserved position or segment in the context window, such as system instruction, task state, retrieved evidence, memory, or tool result."
  ],
  [
    "ContextSource",
    "identifies the origin of context content, such as a message, memory record, retrieval result, document chunk, tool result, or artifact."
  ],
  [
    "ContextSummary",
    "stores a compressed or condensed representation of prior state, evidence, or conversation used to fit the context budget without storing hidden reasoning."
  ],
  [
    "Goal",
    "high-level user or system intent that motivates an agent workflow before it is decomposed into operational objectives, tasks, or success criteria."
  ],
  [
    "Objective",
    "operational and measurable target derived from a goal that can be assigned, checked, and traced through tasks, constraints, and completion criteria."
  ],
  [
    "TaskDistribution",
    "observable delegation event that assigns a task or work item to a worker, subagent, route, or tool while preserving assignment scope and responsibility evidence."
  ],
  [
    "TaskPlan",
    "organizes a goal into ordered tasks, work items, dependencies, constraints, and completion criteria that can be delegated and audited."
  ],
  [
    "TaskStep",
    "identifies one executable or reviewable step within a task plan, including ordering, dependency, owner, and completion evidence."
  ],
  [
    "TaskDependency",
    "states that one task, step, or work item depends on another result, condition, resource, or approval before it can proceed."
  ],
  [
    "TaskConstraint",
    "records a planning constraint such as deadline, budget, authority, capability, context, safety, or dependency limit that shapes task execution."
  ],
  [
    "TaskCompletionCriterion",
    "states the observable condition used to decide whether a task, step, or work item has been completed satisfactorily."
  ],
  [
    "WorkItem",
    "assignable unit of planned work derived from a task and scoped to an actor, tool, subagent, route, or artifact outcome."
  ],
  [
    "Orchestrator",
    "coordination role that decomposes goals, chooses workflow topology, delegates work, routes control, tracks ownership, and synthesizes results."
  ],
  [
    "WorkerAgent",
    "coordinated agent role that receives scoped work from an orchestrator and returns observable results, evidence, warnings, or completion status."
  ],
  [
    "Subagent",
    "worker agent operating under a coordinating role with bounded context, authority, tools, memory access, budget, and reporting obligations."
  ],
  [
    "Handoff",
    "control-transfer event that moves responsibility for a task, conversation, route, or runtime state to another agent actor or remote delegate."
  ],
  [
    "HandoffTarget",
    "actor, remote agent, route, or protocol endpoint that receives control or responsibility after a handoff."
  ],
  [
    "ResponsibilityTransfer",
    "records which responsibility changes owner during delegation or handoff, including task custody, control custody, answer ownership, and audit accountability."
  ],
  [
    "DelegationContract",
    "specifies delegated work, expected result, authority scope, visible context, budget, completion criteria, and ownership boundaries between delegator and delegatee."
  ],
  [
    "DelegationEvent",
    "observable event that initiates, updates, cancels, or completes delegated work under a delegation contract."
  ],
  [
    "DelegationResult",
    "observable result returned by a worker, subagent, tool-like agent, or remote delegate, including artifacts, status, warnings, and provenance."
  ],
  [
    "WorkerPool",
    "candidate set of workers, subagents, models, tools, or remote delegates available for selection by capability, load, cost, authority, and trust boundary."
  ],
  [
    "SubagentRole",
    "delegated role profile that defines a subagent's task specialty, authority, tool access, memory access, context scope, and reporting duty."
  ],
  [
    "SubagentContext",
    "scoped context package visible to a subagent, including allowed messages, sources, memory, task state, tool results, and exclusions."
  ],
  [
    "DelegationOwnership",
    "records the responsibility split between delegator and delegatee, including retained answer ownership, transferred control, authority scope, and result accountability."
  ],
  [
    "AnswerOwnership",
    "records which coordinating actor is accountable for the final response or artifact after delegation, handoff, review, or synthesis."
  ],
  [
    "ControlOwnership",
    "records which actor currently controls the next workflow step, including whether control is retained by a manager or transferred through handoff."
  ],
  [
    "AgentAsToolInvocation",
    "bounded invocation in which a managing agent calls another agent as a tool-like helper while retaining final answer ownership and workflow control."
  ],
  [
    "ContextIsolation",
    "bounds the messages, memory, tools, and source material visible to a worker or subagent during delegated work."
  ],
  [
    "DelegatedAuthority",
    "states the permissions, tools, memory surfaces, data zones, and operations a delegate may use on behalf of the orchestrator."
  ],
  [
    "DelegationBudget",
    "sets token, time, cost, retry, tool-call, or context limits that constrain delegated work and routing choices."
  ],
  [
    "WorkerSelection",
    "decision event that chooses a worker, subagent, model, tool, or route from a candidate pool using capability, availability, cost, safety, and context-fit evidence."
  ],
  [
    "WorkerAvailability",
    "records whether a worker or subagent can accept work, including load, lifecycle state, capability readiness, and fallback status."
  ],
  [
    "WorkerCapabilityMatch",
    "records the evidence that a worker, subagent, model, or tool matches the required task capability, modality, authority, or domain."
  ],
  [
    "Route",
    "control-flow edge or routing selection that sends work to a downstream actor, tool, branch, protocol, operation, or stop path."
  ],
  [
    "RoutingPolicy",
    "policy used by orchestration to choose a branch, worker, tool, protocol, retry, escalation, or stop path from current state and evidence."
  ],
  [
    "RoutingDecision",
    "observable decision event that applies routing policy to select a routing target and record why that target was chosen."
  ],
  [
    "RoutingTarget",
    "typed endpoint selected by a route, such as a worker, subagent, tool, branch, protocol adapter, operation handle, or stop path."
  ],
  [
    "BranchCondition",
    "condition over task state, trace evidence, policy, feedback, or capability match that determines which branch may run next."
  ],
  [
    "DownstreamOperation",
    "target operation handle that a route can invoke or continue, including a branch, actor action, tool path, protocol handoff, or stop path."
  ],
  [
    "GateCondition",
    "condition checked at a workflow gate to decide whether control may proceed, block, redirect, escalate, retry, or stop."
  ],
  [
    "GateOutcome",
    "observable result of a workflow gate, such as allowed, blocked, redirected, escalated, retried, or stopped."
  ],
  [
    "RetryPolicy",
    "policy bounding when an orchestration loop may retry work, including retry count, changed context, backoff, escalation, and failure conditions."
  ],
  [
    "StopCondition",
    "condition under which an orchestration loop must stop because success, failure, budget exhaustion, safety, or human decision has been reached."
  ],
  [
    "PromptChain",
    "ordered sequence of prompt or model-call stages used to decompose, transform, verify, or synthesize work while preserving stage provenance."
  ],
  [
    "ChainStage",
    "one ordered stage in a prompt chain with explicit input, output, dependency, guard, and handoff or routing context."
  ],
  [
    "Parallelization",
    "orchestration pattern that runs multiple branches, sections, workers, or candidate attempts concurrently under a shared control objective."
  ],
  [
    "ParallelBranch",
    "one branch in a parallelized workflow with its own assigned work, context slice, output, and merge expectations."
  ],
  [
    "Sectioning",
    "parallelization pattern that splits a larger artifact, task, or context into sections assigned to different workers or passes."
  ],
  [
    "SectionAssignment",
    "assignment record connecting a section of work to a worker, context slice, expected output, and synthesis role."
  ],
  [
    "Voting",
    "parallel evaluation pattern that compares multiple candidate outputs or decisions and selects or aggregates a result using a voting rule."
  ],
  [
    "VoteBallot",
    "record of a worker, evaluator, model, or rule casting a choice, score, preference, or rationale summary in a voting workflow."
  ],
  [
    "AggregationRule",
    "composition rule that governs how parallel outputs, votes, section results, or evidence fragments are merged into a synthesis."
  ],
  [
    "Synthesis",
    "observable event that combines worker outputs, retrieved evidence, tool results, votes, and feedback into a coherent artifact."
  ],
  [
    "SynthesisPlan",
    "plan describing which inputs, votes, sections, evidence, and precedence rules a synthesis step must combine."
  ],
  [
    "SynthesisInput",
    "worker output, retrieved evidence, tool result, vote, review signal, or artifact fragment consumed by a synthesis step."
  ],
  [
    "SynthesisOutput",
    "coherent artifact, answer, plan, summary, or decision produced by a synthesis step with provenance back to its inputs."
  ],
  [
    "OrchestrationTopology",
    "describes the coordination shape of a workflow, such as centralized manager-worker, hierarchical crew, graph route, parallel branch, or dynamic swarm."
  ],
  [
    "EvaluatorOptimizer",
    "control-loop role that reviews an output or attempt, emits feedback, and chooses whether revision, retry, escalation, or stop should occur."
  ],
  [
    "ReviewEvent",
    "observable control-loop event that requests or performs review of an output, state, plan, safety condition, evidence bundle, or completion claim."
  ],
  [
    "FeedbackEvent",
    "observable control-loop event that returns critique, warning, preference, correction, approval, or revision signal to a task, route, worker, or optimizer."
  ],
  [
    "ThinkAsTool",
    "visible deliberation or review operation exposed as a bounded tool-like step with explicit inputs, outputs, and audit metadata."
  ],
  [
    "CritiqueArtifact",
    "observable critique result produced by a review or evaluator step, including findings, requested changes, confidence, and provenance."
  ],
  [
    "RevisionPlan",
    "planned remediation path that states what to change, which prior attempt it revises, and which criterion or feedback triggered the revision."
  ],
  [
    "ImprovementAttempt",
    "bounded retry or revision attempt launched from feedback, review, gate outcome, or stop-retry lineage."
  ],
  [
    "OptimizerState",
    "runtime-visible state of an evaluator-optimizer loop, including current attempt, selected feedback, budget, stopping context, and candidate quality."
  ],
  [
    "ReflectionRecord",
    "observable review summary or rationale artifact used for improvement while excluding private reasoning transcripts."
  ],
  [
    "FeedbackRouting",
    "control decision that sends feedback to a task, worker, route, revision plan, gate, or optimizer loop."
  ],
  [
    "ReviewAssignment",
    "assigns review responsibility to a human, model, evaluator, policy gate, or worker and identifies the artifact or decision under review."
  ],
  [
    "StopRetryLineage",
    "links a review, failure, or gate outcome to the bounded retry, revision, stop, or rollback path chosen for an orchestration loop."
  ],
  [
    "EvaluationCriterion",
    "feedback-domain criterion that defines the scoring, success, benchmark, rubric, or metric condition used to assess agent behavior."
  ],
  [
    "AutomatedReview",
    "records a machine-produced review pass over a task, output, plan, trace, or artifact, including findings and confidence."
  ],
  [
    "HumanReview",
    "records review evidence supplied by a human actor, including approval, requested changes, blocking concerns, or quality judgment."
  ],
  [
    "ReviewFinding",
    "records a specific issue, observation, or recommendation discovered during human or automated review."
  ],
  [
    "Correction",
    "records a concrete change proposed or applied in response to feedback, diagnostics, failed validation, or review findings."
  ],
  [
    "OptimizationTarget",
    "states the measurable property an evaluator-optimizer loop is trying to improve, such as correctness, latency, cost, safety, or coverage."
  ],
  [
    "LearningSignal",
    "captures feedback or evidence that may update future policy, retrieval, tool choice, or orchestration behavior."
  ],
  [
    "ConfidenceSignal",
    "records an explicit confidence estimate or uncertainty signal attached to an observation, decision, answer, retrieval result, or review."
  ],
  [
    "RiskSignal",
    "records evidence that an action, output, tool result, boundary crossing, or instruction may be unsafe or policy-sensitive."
  ],
  [
    "FailureMode",
    "classifies a recurring way an agent run, tool invocation, retrieval, policy gate, or protocol interaction can fail."
  ],
  [
    "RetryableError",
    "identifies an error that may be retried under bounded policy because the failure is transient, recoverable, or externally caused."
  ],
  [
    "ErrorListener",
    "subscribes to runtime, sandbox, tool, protocol, or log events in order to detect and route errors for diagnosis."
  ],
  [
    "StandardError",
    "captures the stderr stream emitted by a command, process, sandbox, or tool execution as observable diagnostic output."
  ]
]);

const generatedClassDefinition = (module, id, label, kind) => {
  const exactDefinition = exactGeneratedClassDefinitions.get(id);
  if (exactDefinition) {
    return exactDefinition;
  }

  const lower = normalizedTerm(label);
  const subject = moduleSubject(module);
  const moduleLabel = moduleName(module);

  if (lower.includes("adapter")) {
    if (lower.includes("schema") || lower.includes("zod") || lower.includes("pydantic") || lower.includes("owl") || lower.includes("shacl") || lower.includes("shex")) {
      return `${label} converts canonical ontology and schema artifacts into a structural, language, or semantic profile while preserving provenance and conversion warnings.`;
    }
    if (lower.includes("graph ir") || lower.includes("frontend")) {
      return `${label} projects ontology entities, relations, review state, and evidence metadata into graph or view-specific presentation artifacts.`;
    }
    if (lower.includes("xstate") || lower.includes("scxml") || lower.includes("statechart")) {
      return `${label} maps runtime lifecycle concepts to statechart machines, states, transitions, events, guards, actions, and snapshots.`;
    }
    if (lower.includes("bench") || lower.includes("world") || lower.includes("tau") || lower.includes("agency")) {
      return `${label} maps benchmark tasks, scenarios, scoring rubrics, observations, and pressure axes into an evaluation adapter without changing core ontology semantics.`;
    }
    if (lower.includes("langgraph") || lower.includes("openai") || lower.includes("crewai") || lower.includes("deep agents") || lower.includes("microsoft") || lower.includes("langchain")) {
      return `${label} translates framework-native agents, tools, handoffs, workflow state, traces, and memory surfaces into canonical profile and adapter concepts.`;
    }
    if (lower.includes("fipa") || lower.includes("kqml")) {
      return `${label} maps legacy multi-agent communication acts, performatives, and message envelopes into the protocol adapter layer.`;
    }
    return `${label} records an implementation-specific mapping between ${subject} and the canonical agent ontology without promoting adapter fields into core.`;
  }

  if (lower.includes("authority scope")) {
    return `${label} binds an actor or runtime role to the resources, operations, tools, and data zones it is authorized to access.`;
  }
  if (lower.includes("capability binding")) {
    return `${label} connects an actor to a callable, observable, or retrieval capability together with the conditions under which it may be used.`;
  }
  if (lower.includes("role binding")) {
    return `${label} assigns an actor to a responsibility-bearing role so delegation, review, approval, and accountability can be traced.`;
  }
  if (lower.includes("actor")) {
    return `${label} identifies a participant that can act, observe, authorize, execute, retrieve, or receive delegated responsibility in a runtime session.`;
  }
  if (lower.includes("agent") || lower.includes("worker") || lower.includes("orchestrator") || lower.includes("evaluator")) {
    return `${label} denotes a coordinated agent role with a bounded responsibility, context surface, and observable contribution to the workflow.`;
  }

  if (lower.includes("boundary")) {
    if (lower.includes("network")) {
      return `${label} marks the edge between the runtime and network-accessible resources, transports, proxies, or remote services.`;
    }
    if (lower.includes("remote agent")) {
      return `${label} marks the opacity and authority boundary introduced when work is delegated to an external or remote agent.`;
    }
    if (lower.includes("tool")) {
      return `${label} marks the trust edge where model-controlled intent becomes an executable tool request or receives tool output.`;
    }
    if (lower.includes("internal")) {
      return `${label} separates trusted runtime components, local stores, and internal services from less-trusted execution or data surfaces.`;
    }
    if (lower.includes("external")) {
      return `${label} marks interaction with organizations, services, users, or systems outside the controlled agent runtime.`;
    }
    return `${label} identifies a policy-relevant trust edge where authority, data handling, provenance, and audit requirements may change.`;
  }
  if (lower.includes("data zone")) {
    return `${label} classifies data by trust level, retention, visibility, and allowed use before it enters context, memory, tools, or artifacts.`;
  }
  if (lower.includes("crossing")) {
    return `${label} records the observed movement of data, control, artifacts, or authority from one bounded zone to another.`;
  }

  if (lower.includes("permission") || lower.includes("authorization") || lower.includes("grant")) {
    return `${label} captures an authorization prompt, rule, grant, or outcome that determines whether a requested action may proceed.`;
  }
  if (lower.includes("capability")) {
    return `${label} describes an advertised ability, operation, or surface that can be discovered, authorized, invoked, or mapped across a protocol boundary.`;
  }
  if (lower.includes("deny") || lower.includes("denial") || lower.includes("block")) {
    return `${label} records a safety or policy outcome that prevents a requested operation and preserves the reason for audit.`;
  }
  if (lower.includes("approval") || lower.includes("allow")) {
    return `${label} records a policy outcome that permits a requested action under stated conditions and trace evidence.`;
  }
  if (lower.includes("policy") || lower.includes("rule") || lower.includes("condition") || lower.includes("gate")) {
    return `${label} defines a decision condition that constrains routing, access, execution, disclosure, or lifecycle progression.`;
  }

  if (lower.includes("tool call")) {
    return `${label} tracks planning, attempt, retry, or execution details for invoking a tool with arguments and observing its result.`;
  }
  if (lower.includes("tool result")) {
    return `${label} captures observable content, metadata, warning, or error returned by a tool after execution.`;
  }
  if (lower.includes("tool argument")) {
    return `${label} describes the structured input supplied to a tool invocation and checked against the tool definition.`;
  }
  if (lower.includes("tool capability")) {
    return `${label} describes an advertised operation a tool can perform, including its boundary, permissions, and schema surface.`;
  }
  if (lower.includes("tool") && lower.includes("schema")) {
    return `${label} specifies the argument or result structure that validates a tool-facing interaction.`;
  }
  if (lower.includes("tool") && (lower.includes("candidate") || lower.includes("search") || lower.includes("match") || lower.includes("selection") || lower.includes("fallback"))) {
    return `${label} supports tool discovery by recording queries, candidates, matching evidence, ranking decisions, or fallback choices.`;
  }
  if (lower.includes("tool")) {
    return `${label} describes a callable external or hosted capability together with its identity, version, permissions, and observable execution surface.`;
  }

  if (lower.includes("request")) {
    return `${label} records a proposed operation, outbound call, commit action, or execution step before it is approved, denied, or fulfilled.`;
  }
  if (lower.includes("response")) {
    return `${label} records the observable reply from a service, tool, sandbox, or peer actor after a request crosses a runtime boundary.`;
  }
  if (lower.includes("command")) {
    return `${label} describes a shell or process-level operation, its arguments, working directory, output streams, and lifecycle status.`;
  }
  if (lower.includes("process handle")) {
    return `${label} identifies the operating-system process reference used to monitor, stop, or correlate command execution.`;
  }
  if (lower.includes("sandbox")) {
    return `${label} describes the controlled execution environment, restriction, or risk context used to isolate potentially unsafe operations.`;
  }
  if (lower.includes("network") || lower.includes("socket") || lower.includes("proxy") || lower.includes("http")) {
    return `${label} records a network path, endpoint, proxy, or access decision that affects runtime isolation and tool execution.`;
  }

  if (lower.includes("task plan")) {
    return `${label} organizes goals into ordered tasks, work items, dependencies, constraints, and completion criteria.`;
  }
  if (lower.includes("task dependency")) {
    return `${label} states that one task, work item, or step requires another result before it can safely proceed.`;
  }
  if (lower.includes("task constraint") || lower.includes("completion criterion") || lower.includes("success criterion")) {
    return `${label} records the condition used to judge whether a task, plan, or evaluation objective is acceptable.`;
  }
  if (lower.includes("task") || lower.includes("work item") || lower.includes("goal") || lower.includes("objective")) {
    return `${label} captures units of intended work, decomposition, responsibility, and observable progress in an agent workflow.`;
  }
  if (lower.includes("delegation") || lower.includes("handoff") || lower.includes("subagent") || lower.includes("responsibility transfer")) {
    return `${label} records transfer of responsibility, context, authority, or result ownership between coordinating agents.`;
  }
  if (lower.includes("route") || lower.includes("routing") || lower.includes("downstream")) {
    return `${label} selects the next operation, branch, actor, or tool path based on state, policy, or observed results.`;
  }
  if (lower.includes("prompt chain") || lower.includes("chain stage")) {
    return `${label} describes an ordered prompt sequence or stage used to decompose, transform, review, or synthesize work.`;
  }
  if (lower.includes("parallel") || lower.includes("section") || lower.includes("vote") || lower.includes("synthesis") || lower.includes("aggregation")) {
    return `${label} describes a coordination pattern for splitting work, combining outputs, voting across candidates, or producing a synthesized result.`;
  }

  if (lower.includes("memory namespace") || lower.includes("memory scope")) {
    return `${label} bounds where stored experience, preferences, documents, or summaries may be read, updated, or reused.`;
  }
  if (lower.includes("preference memory")) {
    return `${label} stores stable user or task preferences that can guide context assembly without becoming hidden reasoning.`;
  }
  if (lower.includes("memory")) {
    return `${label} describes persisted or retrievable context that may be stored, updated, summarized, ranked, or discarded under policy.`;
  }
  if (lower.includes("chunk")) {
    return `${label} describes a document fragment, overlap, metadata record, grounding note, or quality signal used for retrieval and context assembly.`;
  }
  if (lower.includes("embedding") || lower.includes("vector")) {
    return `${label} records dense, sparse, or lexical representation used to index, compare, and retrieve context or tool descriptions.`;
  }
  if (lower.includes("tf idf") || lower.includes("index")) {
    return `${label} describes a retrieval index or lookup structure that supports lexical, vector, graph, or lightweight discovery operations.`;
  }
  if (lower.includes("retrieval") || lower.includes("candidate") || lower.includes("rank") || lower.includes("top k") || lower.includes("similarity") || lower.includes("search result")) {
    return `${label} records query-time retrieval, candidate construction, scoring, reranking, and selection evidence for context or tool choice.`;
  }
  if (lower.includes("context")) {
    return `${label} describes assembled runtime context, budget, ordering, source inclusion, refresh, or exclusion decisions.`;
  }
  if (lower.includes("summary") || lower.includes("summar")) {
    return `${label} captures an observable condensation of prior state, content, or events used to fit a context budget.`;
  }

  if (lower.includes("message") || lower.includes("conversation") || lower.includes("prompt") || lower.includes("instruction") || lower.includes("few shot") || lower.includes("demonstration")) {
    return `${label} records an observable communication, instruction, prompt, example, or turn that can be traced without storing hidden reasoning.`;
  }
  if (lower.includes("transcript")) {
    return `${label} preserves the ordered observable exchange among actors, tools, messages, outputs, and results in a session.`;
  }
  if (lower.includes("output") || lower.includes("disclosure") || lower.includes("redaction") || lower.includes("sensitive span")) {
    return `${label} governs what content is emitted, hidden, redacted, compressed, or progressively revealed to a viewer or downstream system.`;
  }
  if (lower.includes("window") || lower.includes("limit")) {
    return `${label} constrains how much generated or retrieved content is visible, retained, compressed, or carried forward.`;
  }

  if (lower.includes("trace") || lower.includes("span") || lower.includes("checkpoint") || lower.includes("snapshot") || lower.includes("replay") || lower.includes("state diff")) {
    return `${label} captures observable runtime state, event ordering, retention, checkpointing, or replay evidence for audit and debugging.`;
  }
  if (lower.includes("session") || lower.includes("run") || lower.includes("lifecycle") || lower.includes("environment")) {
    return `${label} describes the bounded runtime execution context, lifecycle transition, attempt, outcome, or environment in which agent activity occurs.`;
  }
  if (lower.includes("event")) {
    return `${label} denotes an observable occurrence in the agent system that can be ordered, linked to actors or resources, and audited.`;
  }
  if (lower.includes("attempt")) {
    return `${label} records one concrete try within a run, review loop, tool call, or optimization process so retries and outcomes remain auditable.`;
  }

  if (lower.includes("artifact")) {
    return `${label} describes a produced, consumed, exported, drafted, or finalized work product with provenance and review state.`;
  }
  if (lower.includes("file") || lower.includes("directory") || lower.includes("database") || lower.includes("graph") || lower.includes("document") || lower.includes("source") || lower.includes("resource") || lower.includes("metadata")) {
    return `${label} identifies an information source, storage object, document, graph element, or metadata record available to the agent system.`;
  }
  if (lower.includes("ingestion") || lower.includes("loader") || lower.includes("attachment") || lower.includes("deduplication")) {
    return `${label} records how source material is loaded, attached, deduplicated, prepared, and made available for memory or retrieval.`;
  }

  if (lower.includes("evaluation") || lower.includes("metric") || lower.includes("score") || lower.includes("rubric") || lower.includes("benchmark") || lower.includes("scenario") || lower.includes("criterion")) {
    return `${label} captures an evaluation unit, scoring rule, metric, benchmark observation, or success condition for assessing agent behavior.`;
  }
  if (lower.includes("review") || lower.includes("feedback") || lower.includes("critique") || lower.includes("correction") || lower.includes("optimization")) {
    return `${label} records evaluator feedback, critique artifacts, corrective actions, and optimization-loop evidence over an agent run or task.`;
  }
  if (lower.includes("optimizer state")) {
    return `${label} captures the current variables, candidate quality, loop status, and stopping context for an evaluator-optimizer process.`;
  }
  if (lower.includes("recovery") || lower.includes("revision") || lower.includes("rollback")) {
    return `${label} describes a planned or executed remediation step used to recover from a failed, unsafe, or low-quality agent trajectory.`;
  }
  if (lower.includes("reflection")) {
    return `${label} stores an observable review or rationale summary for improvement without requiring private hidden chain-of-thought.`;
  }
  if (lower.includes("injection") || lower.includes("scan") || lower.includes("signature") || lower.includes("quarantine") || lower.includes("sanitization") || lower.includes("finding")) {
    return `${label} captures detection, evidence, or mitigation of malicious instruction propagation, prompt injection, or unsafe tool-stream content.`;
  }
  if (lower.includes("warning") || lower.includes("error") || lower.includes("diagnostic") || lower.includes("failure") || lower.includes("confidence") || lower.includes("risk") || lower.includes("signal")) {
    return `${label} captures risk, uncertainty, degraded confidence, blocking failures, or diagnostic evidence that affects runtime decisions.`;
  }
  if (lower.includes("side effect")) {
    return `${label} records an external state change that may require approval, sandboxing, redaction, or rollback evidence.`;
  }
  if (lower.includes("elicitation")) {
    return `${label} captures a protocol-level request for additional user or client-provided information during an interaction.`;
  }
  if (lower.includes("transport")) {
    return `${label} describes the protocol channel, session mechanics, and delivery surface used to exchange agent, tool, or resource messages.`;
  }
  if (lower.includes("log") || lower.includes("telemetry") || lower.includes("audit") || lower.includes("listener") || lower.includes("sink")) {
    return `${label} records observable logging, telemetry, audit, or event-stream infrastructure used to inspect agent behavior.`;
  }

  return `${label} is a ${kindPhrase(kind)} in the ${moduleLabel} that gives a named, source-backed concept within ${subject}.`;
};

const planeDefinitionOverrides = new Map([
  [
    "info-plane",
    {
      label: "Context Ingress & Staging Domain",
      definition:
        "Context Ingress & Staging Domain is the operational concern domain for observable content becoming available to an agent step or model call. It models message and instruction envelopes, source references, content blocks, context windows, lightweight discovery pointers, disclosed output segments, and execution observations as they are selected, transformed, cited, suppressed, or staged into context."
    }
  ],
  [
    "orchestration-plane",
    {
      label: "Control & Orchestration Domain",
      definition:
        "Control & Orchestration Domain is the operational concern domain for transforming goals into executable, delegated, routed, reviewed, and synthesized workflows. It models objectives, task plans, delegation ownership, handoffs, agents-as-tools, context isolation, worker selection, routing targets, gates, topology, prompt chains, parallel composition, synthesis provenance, and bounded feedback or retry loops."
    }
  ],
  [
    "runtime-plane",
    {
      label: "Runtime State & Trace Domain",
      definition:
        "Runtime State & Trace Domain is the operational concern domain for bounded execution episodes and raw runtime evidence. It models sessions, attempts, outcomes, actors, environments, budgets, trace records, spans, events, checkpoints, snapshots, state diffs, replay evidence, transcripts, retention policy, and artifact provenance so agent activity can be audited, recovered, replayed, and exported without storing hidden reasoning text."
    }
  ],
  [
    "adapter-plane",
    {
      label: "Interoperability & Adapter Domain",
      definition:
        "Interoperability & Adapter Domain is an operational concern domain that acts as the adapter membrane for external protocols, frameworks, benchmarks, statecharts, schema profiles, semantic exports, language profiles, Graph IR, and frontend views. It records directional mappings between external constructs and canonical ontology terms, preserves source and version provenance, surfaces conversion loss or unsupported semantics, and prevents adapter-specific fields from redefining ontology core."
    }
  ]
]);

const removedClassIds = new Set(["InfoPlane", "OrchestrationPlane", "AdapterPlane", "SafetyPlane", "UserAgentMessage", "ToolMessage"]);
const ownership = (canonical_owner_plane, participating_planes = [], context_ingress_role) => ({
  canonical_owner_plane,
  participating_planes: [...new Set([canonical_owner_plane, ...participating_planes])],
  ...(context_ingress_role ? { context_ingress_role } : {})
});
const classOwnershipOverrides = new Map([
  ["CommandExecution", ownership("runtime-plane", ["info-plane", "tool-plane", "safety-plane"], "produces observable command output, exit status, and trace evidence that may be staged into context")],
  ["Container", ownership("runtime-plane", ["tool-plane", "safety-plane"], "provides the execution environment whose observations may later enter context")],
  ["ProcessHandle", ownership("runtime-plane", ["tool-plane", "safety-plane"], "correlates observed process output with the runtime execution attempt")],
  ["WorkingDirectory", ownership("runtime-plane", ["tool-plane", "safety-plane", "info-plane"], "is referenced when command observations need path context")],
  ["EnvironmentVariable", ownership("runtime-plane", ["tool-plane", "safety-plane"], "may explain execution behavior without exposing secret values into context by default")],
  ["Command", ownership("tool-plane", ["runtime-plane", "safety-plane", "info-plane"], "may produce output observations selected for later context")],
  ["ShellCommand", ownership("tool-plane", ["runtime-plane", "safety-plane", "info-plane"], "may produce stdout, stderr, and status observations selected for later context")],
  ["CommandArgument", ownership("tool-plane", ["runtime-plane", "safety-plane"], "helps interpret the command execution that produced context-visible observations")],
  ["CommandArea", ownership("tool-plane", ["runtime-plane", "info-plane"], "groups command observations before they are staged into context")],
  ["FileSystem", ownership("memory-plane", ["runtime-plane", "tool-plane", "safety-plane", "info-plane"], "is referenced through file-resource references when file content enters context")],
  ["Database", ownership("memory-plane", ["tool-plane", "adapter-plane", "info-plane"], "is referenced through row or query references when database content enters context")],
  ["DatabaseTable", ownership("memory-plane", ["tool-plane", "adapter-plane", "info-plane"], "is referenced through table or row pointers when structured data enters context")],
  ["DatabaseRow", ownership("memory-plane", ["tool-plane", "adapter-plane", "info-plane"], "is referenced through row references when structured data enters context")],
  ["GraphStore", ownership("memory-plane", ["adapter-plane", "info-plane"], "is referenced through graph-node references when graph content enters context")],
  ["GraphNode", ownership("memory-plane", ["adapter-plane", "info-plane"], "may be cited through graph-node references in context")],
  ["GraphEdge", ownership("memory-plane", ["adapter-plane", "info-plane"], "may be cited through graph references in context")],
  ["StorageArea", ownership("memory-plane", ["runtime-plane", "safety-plane", "info-plane"], "bounds source references and storage descriptors used for context staging")],
  ["Resource", ownership("memory-plane", ["tool-plane", "adapter-plane", "info-plane"], "may be described by a context-stage resource descriptor")],
  ["FileResource", ownership("memory-plane", ["tool-plane", "safety-plane", "info-plane"], "may be referenced by a file-resource reference when staged into context")],
  ["DirectoryResource", ownership("memory-plane", ["tool-plane", "safety-plane", "info-plane"], "may be referenced through access-path metadata when staged into context")],
  ["TextCorpus", ownership("memory-plane", ["info-plane"], "provides source material that may be referenced or chunked into context")],
  ["NetworkResource", ownership("safety-plane", ["adapter-plane", "tool-plane", "info-plane"], "may be referenced as network-originated content with boundary metadata")],
  ["Embedding", ownership("memory-plane", ["info-plane"], "supports retrieval and ranking before selected candidates enter context")],
  ["TextEmbedding", ownership("memory-plane", ["info-plane"], "supports similarity retrieval before selected text candidates enter context")],
  ["GraphEmbedding", ownership("memory-plane", ["info-plane"], "supports graph retrieval before selected graph candidates enter context")],
  ["IndexEntry", ownership("memory-plane", ["info-plane"], "may be referenced by a lightweight context-discovery pointer")],
  ["IndexKey", ownership("memory-plane", ["info-plane"], "may be referenced by a lightweight context-discovery pointer")],
  ["IndexRefreshEvent", ownership("memory-plane", ["feedback-plane", "info-plane"], "explains which index version produced candidates staged into context")],
  ["DisclosureRule", ownership("safety-plane", ["info-plane", "feedback-plane"], "may suppress, redact, or release context-visible content")],
  ["ProgressiveDisclosure", ownership("safety-plane", ["info-plane", "feedback-plane"], "controls staged revelation of context or output content")],
  ["SuppressedOutput", ownership("safety-plane", ["info-plane", "feedback-plane"], "records withheld output that may be represented as suppressed context")],
  ["ToolResultObservation", ownership("tool-plane", ["runtime-plane", "info-plane"], "may be converted into a tool observation message or context input")],
  ["RuntimeBudget", ownership("runtime-plane", ["orchestration-plane", "tool-plane", "feedback-plane", "safety-plane"], "constrains attempts and sessions while routing, tools, metrics, and safety policies may reference it")],
  ["RuntimeEnvironment", ownership("runtime-plane", ["tool-plane", "safety-plane", "adapter-plane"], "anchors actual execution without owning sandbox, protocol, or framework-specific runtime fields")],
  ["ActorAuthorityScope", ownership("runtime-plane", ["safety-plane", "orchestration-plane"], "records runtime actor authority while safety owns policy enforcement")],
  ["ActorCapabilityBinding", ownership("runtime-plane", ["tool-plane", "adapter-plane"], "binds runtime actors to capabilities without redefining tool or protocol capability catalogs")],
  ["ActorRoleBinding", ownership("runtime-plane", ["orchestration-plane", "feedback-plane"], "assigns runtime accountability without redefining orchestration roles or review ownership")],
  ["RemoteAgentReference", ownership("runtime-plane", ["adapter-plane", "safety-plane", "orchestration-plane"], "references opaque remote participants across protocol and trust boundaries")],
  ["TraceRetentionPolicy", ownership("runtime-plane", ["safety-plane", "feedback-plane"], "governs raw trace retention while safety owns redaction and feedback owns interpreted telemetry")],
  ["AuditRecord", ownership("runtime-plane", ["feedback-plane", "safety-plane"], "stores raw runtime audit evidence before interpretation, diagnostics, or disclosure decisions")],
  ["ObservableSummary", ownership("runtime-plane", ["memory-plane", "info-plane", "feedback-plane"], "summarizes observable runtime evidence without becoming long-term memory or hidden reasoning")],
  ["Checkpoint", ownership("runtime-plane", ["memory-plane", "adapter-plane"], "captures resumable session state without becoming long-term memory store semantics")],
  ["StateSnapshot", ownership("runtime-plane", ["adapter-plane", "memory-plane"], "captures runtime state for recovery, replay, and statechart profiles")],
  ["SchemaArtifact", ownership("runtime-plane", ["adapter-plane", "feedback-plane"], "represents runtime-produced schema artifacts without redefining export or validation profiles")],
  ["EvaluationCriterion", ownership("feedback-plane", ["orchestration-plane", "adapter-plane"], "defines feedback and benchmark criteria consumed by orchestration control loops without owning their routing logic")],
  ["Gate", ownership("orchestration-plane", ["safety-plane"], "controls workflow progression while safety gates own policy enforcement")],
  ["GateCondition", ownership("orchestration-plane", ["safety-plane"], "checks workflow progression conditions that may reference safety or policy state")],
  ["GateOutcome", ownership("orchestration-plane", ["safety-plane", "feedback-plane"], "returns a workflow outcome that may trigger safety escalation, retry, or review")],
  ["ReviewEvent", ownership("orchestration-plane", ["feedback-plane", "safety-plane"], "routes review as a control-loop event while feedback evidence remains in the feedback domain")],
  ["FeedbackEvent", ownership("orchestration-plane", ["feedback-plane"], "routes feedback into control flow while feedback records and metrics remain in the feedback domain")],
  ["AgentAsToolInvocation", ownership("orchestration-plane", ["tool-plane", "runtime-plane"], "uses another agent through a tool-like invocation while retaining manager ownership")],
  ["Handoff", ownership("orchestration-plane", ["runtime-plane", "adapter-plane"], "transfers control across agent roles or protocol boundaries")]
]);

const classSourceIdOverrides = new Map([
  ["ProtocolAdapter", ["eng-proto-mcp-spec", "eng-proto-a2a-spec", "eng-proto-fipa-acl", "lit-proto-kqml"]],
  ["MCPAdapter", ["eng-proto-mcp-spec", "eng-proto-mcp-auth", "eng-proto-mcp-repo", "eng-proto-mcp-changelog"]],
  ["A2AAdapter", ["eng-proto-a2a-spec", "eng-proto-a2a-docs", "eng-proto-a2a-repo", "eng-proto-a2a-js"]],
  ["FIPAAdapter", ["eng-proto-fipa-acl", "eng-proto-fipa-act", "eng-proto-fipa-ip", "eng-proto-fipa-agent-management"]],
  ["KQMLAdapter", ["lit-proto-kqml", "eng-proto-kqml-spec"]],
  ["ProtocolMessageMapping", ["eng-proto-mcp-spec", "eng-proto-a2a-spec", "eng-proto-fipa-acl", "lit-proto-kqml"]],
  ["ProtocolTaskMapping", ["eng-proto-a2a-spec", "eng-proto-a2a-docs", "eng-proto-mcp-spec"]],
  ["ProtocolCapabilityMapping", ["eng-proto-mcp-spec", "eng-proto-mcp-elicitation", "eng-proto-a2a-spec"]],
  ["ProtocolTrustMapping", ["eng-proto-mcp-auth", "eng-proto-oauth-rfc9728", "eng-proto-a2a-spec"]],
  ["FrameworkAdapter", ["eng-fw-langgraph-docs", "eng-fw-openai-python-docs", "eng-fw-crewai-docs", "eng-fw-deepagents-docs"]],
  ["LangGraphAdapter", ["eng-fw-langgraph-docs", "eng-fw-langgraph-graph-api", "eng-fw-langgraph-repo", "eng-fw-langgraph-js"]],
  ["OpenAIAgentsAdapter", ["eng-fw-openai-python-docs", "eng-fw-openai-handoffs", "eng-fw-openai-tracing", "eng-fw-openai-tools"]],
  ["CrewAIAdapter", ["eng-fw-crewai-docs", "eng-fw-crewai-agents", "eng-fw-crewai-flows", "eng-fw-crewai-tasks"]],
  ["DeepAgentsAdapter", ["eng-fw-deepagents-docs", "eng-fw-deepagents-js-docs", "eng-fw-deepagents-repo"]],
  [
    "MicrosoftAgentFrameworkAdapter",
    ["eng-fw-microsoft-agent-framework-docs", "eng-fw-microsoft-agent-framework-repo", "eng-fw-microsoft-agent-framework-current"]
  ],
  ["LangChainAdapter", ["eng-fw-langchain-agents", "eng-fw-langchain-repo", "eng-fw-langgraph-docs"]],
  ["FrameworkHandoffMapping", ["eng-fw-openai-handoffs", "eng-fw-openai-orchestration", "eng-fw-langgraph-docs", "eng-fw-crewai-flows"]],
  ["FrameworkTraceMapping", ["eng-fw-openai-tracing", "eng-fw-langgraph-docs", "eng-fw-openai-python-docs"]],
  ["BenchmarkAdapter", ["eng-bench-swebench-site", "eng-bench-osworld-site", "eng-bench-tau2", "eng-bench-appworld"]],
  ["SWEBenchAdapter", ["eng-bench-swebench-site", "eng-bench-swebench-repo", "lit-bench-swebench"]],
  ["OSWorldAdapter", ["eng-bench-osworld-site", "eng-bench-osworld-repo", "lit-bench-osworld", "eng-bench-osworld-v2"]],
  ["Tau2Adapter", ["eng-bench-tau2", "eng-bench-tau2-verified", "lit-bench-tau2"]],
  ["AppWorldAdapter", ["eng-bench-appworld", "lit-bench-appworld"]],
  ["TerminalBenchAdapter", ["eng-bench-terminal", "eng-bench-terminal-21", "lit-bench-terminal"]],
  ["AgencyBenchAdapter", ["eng-bench-agencybench", "lit-bench-agencybench"]],
  ["StatechartAdapter", ["eng-state-xstate-docs", "eng-state-scxml", "lit-state-harel", "lit-state-stateflow"]],
  ["XStateAdapter", ["eng-state-xstate-docs", "eng-state-xstate-graph", "eng-state-scxml", "eng-state-xstate-repo"]],
  ["SCXMLAdapter", ["eng-state-scxml", "eng-state-xstate-scxml", "lit-state-harel"]],
  ["SchemaAdapter", ["eng-val-jsonschema-spec", "eng-val-shacl", "eng-val-shex", "eng-ont-owl"]],
  ["JSONSchemaAdapter", ["eng-val-jsonschema-spec", "eng-val-jsonschema-ietf", "lit-val-jsonschema-ietf", "eng-val-jsonschema-test-suite"]],
  ["ZodProfileAdapter", ["eng-val-zod-docs", "eng-val-zod-json-schema", "eng-val-zod-release-430"]],
  ["PydanticProfileAdapter", ["eng-val-pydantic-json-schema", "eng-val-pydantic-core"]],
  ["OWLExportAdapter", ["eng-ont-owl", "lit-ont-owl-shacl-lessons"]],
  ["SHACLExportAdapter", ["eng-val-shacl", "lit-val-shacl", "lit-ont-shacl-shex-survey", "eng-val-pyshacl"]],
  ["ShExExportAdapter", ["eng-val-shex", "lit-ont-shacl-shex-survey"]],
  ["GraphIRAdapter", ["eng-ont-fibo-viewer", "eng-ont-fibo-ontology-guide", "eng-val-jsonschema-spec"]],
  ["FrontendViewAdapter", ["eng-ont-fibo-viewer", "eng-ont-fibo-ontology-guide", "eng-val-jsonschema-spec"]],
  ["MappingRule", ["eng-ont-fibo-ontology-guide", "eng-val-jsonschema-spec", "eng-val-shacl", "eng-val-zod-json-schema"]],
  ["ConversionWarning", ["eng-val-zod-json-schema", "eng-val-pydantic-json-schema", "eng-val-shacl", "eng-val-shex"]]
]);

ontology.planes = ontology.planes.map((plane) => ({ ...plane, ...(planeDefinitionOverrides.get(plane.id) ?? {}) }));

const classById = new Map(ontology.terms.filter((term) => !removedClassIds.has(term.id)).map((term) => [term.id, { ...term }]));
const generatedClassIds = new Set(moduleSpecs.flatMap((module) => module.generated.map(([id]) => id)));
const generatedKindOverrides = new Map([
  ["RuntimeSession", "object_type"],
  ["RuntimeEnvironment", "object_type"],
  ["RuntimeBudget", "policy_type"],
  ["RunOutcome", "object_type"],
  ["SessionLifecycle", "object_type"],
  ["ActorAuthorityScope", "policy_type"],
  ["ActorCapabilityBinding", "relation_type"],
  ["ActorRoleBinding", "relation_type"],
  ["TraceRecord", "object_type"],
  ["TraceContext", "object_type"],
  ["SpanAttribute", "resource_type"],
  ["SpanStatus", "resource_type"],
  ["TraceRetentionPolicy", "policy_type"],
  ["AgentAsToolInvocation", "event_type"],
  ["AnswerOwnership", "object_type"],
  ["ControlOwnership", "object_type"],
  ["ContextIsolation", "policy_type"],
  ["DelegatedAuthority", "policy_type"],
  ["DelegationBudget", "policy_type"],
  ["DelegationOwnership", "object_type"],
  ["DownstreamOperation", "action_type"],
  ["EvaluationCriterion", "policy_type"],
  ["OrchestrationTopology", "object_type"],
  ["Route", "relation_type"],
  ["RoutingTarget", "object_type"],
  ["StopRetryLineage", "event_type"],
  ["WorkerAvailability", "object_type"],
  ["WorkerCapabilityMatch", "object_type"],
  ["WorkerSelection", "event_type"],
  ["ProtocolMessageMapping", "relation_type"],
  ["ProtocolTaskMapping", "relation_type"],
  ["ProtocolCapabilityMapping", "relation_type"],
  ["ProtocolTrustMapping", "relation_type"],
  ["FrameworkHandoffMapping", "relation_type"],
  ["FrameworkTraceMapping", "relation_type"],
  ["MappingRule", "relation_type"],
  ["ConversionWarning", "event_type"],
  ["TrustBoundary", "object_type"],
  ["RemoteAgentBoundary", "object_type"],
  ["ExternalBoundary", "object_type"],
  ["InternalBoundary", "object_type"],
  ["ToolBoundary", "object_type"],
  ["NetworkBoundary", "object_type"],
  ["BoundaryCrossing", "event_type"],
  ["AuthorityScope", "policy_type"],
  ["PermissionScope", "policy_type"],
  ["AuthorizationGrant", "policy_type"],
  ["CapabilityGrant", "policy_type"],
  ["PermissionResponse", "policy_type"],
  ["PolicyDecision", "policy_type"],
  ["PolicyRule", "policy_type"],
  ["PolicyCondition", "policy_type"],
  ["PolicyAction", "policy_type"],
  ["PolicyException", "policy_type"],
  ["HumanApproval", "policy_type"],
  ["NetworkPolicy", "policy_type"],
  ["FilesystemPolicy", "policy_type"],
  ["ProcessPolicy", "policy_type"],
  ["OutboundRequest", "event_type"],
  ["InboundResponse", "event_type"],
  ["DeniedNetworkCall", "event_type"],
  ["SandboxEscapeRisk", "event_type"],
  ["PromptInjectionSignal", "event_type"],
  ["IndirectInjectionSignal", "event_type"],
  ["ToolStreamInjectionSignal", "event_type"],
  ["MemoryPoisoningSignal", "event_type"],
  ["PersistentContextRisk", "event_type"],
  ["TaintPropagation", "relation_type"],
  ["SourceSinkFlow", "relation_type"],
  ["UntrustedInstructionCandidate", "resource_type"],
  ["InstructionConflict", "event_type"],
  ["TrustedInstructionOverride", "policy_type"],
  ["RiskSource", "resource_type"],
  ["RiskSink", "resource_type"],
  ["CommitApproval", "policy_type"],
  ["CommitDenial", "policy_type"],
  ["SideEffect", "event_type"],
  ["SensitiveSpan", "resource_type"]
]);
const classKindOverrides = new Map([
  ["RuntimeSession", "object_type"],
  ["RuntimeEnvironment", "object_type"],
  ["RuntimeBudget", "policy_type"],
  ["RunOutcome", "object_type"],
  ["SessionLifecycle", "object_type"],
  ["ActorAuthorityScope", "policy_type"],
  ["ActorCapabilityBinding", "relation_type"],
  ["ActorRoleBinding", "relation_type"],
  ["TraceRecord", "object_type"],
  ["TraceContext", "object_type"],
  ["SpanAttribute", "resource_type"],
  ["SpanStatus", "resource_type"],
  ["TraceRetentionPolicy", "policy_type"],
  ["AgentAsToolInvocation", "event_type"],
  ["AnswerOwnership", "object_type"],
  ["ControlOwnership", "object_type"],
  ["ContextIsolation", "policy_type"],
  ["DelegatedAuthority", "policy_type"],
  ["DelegationBudget", "policy_type"],
  ["DelegationOwnership", "object_type"],
  ["DownstreamOperation", "action_type"],
  ["EvaluationCriterion", "policy_type"],
  ["OrchestrationTopology", "object_type"],
  ["Route", "relation_type"],
  ["RoutingTarget", "object_type"],
  ["StopRetryLineage", "event_type"],
  ["WorkerAvailability", "object_type"],
  ["WorkerCapabilityMatch", "object_type"],
  ["WorkerSelection", "event_type"],
  ["ProtocolMessageMapping", "relation_type"],
  ["ProtocolTaskMapping", "relation_type"],
  ["ProtocolCapabilityMapping", "relation_type"],
  ["ProtocolTrustMapping", "relation_type"],
  ["FrameworkHandoffMapping", "relation_type"],
  ["FrameworkTraceMapping", "relation_type"],
  ["MappingRule", "relation_type"],
  ["ConversionWarning", "event_type"],
  ["TrustBoundary", "object_type"],
  ["RemoteAgentBoundary", "object_type"],
  ["ExternalBoundary", "object_type"],
  ["InternalBoundary", "object_type"],
  ["ToolBoundary", "object_type"],
  ["NetworkBoundary", "object_type"],
  ["BoundaryCrossing", "event_type"],
  ["AuthorityScope", "policy_type"],
  ["PermissionScope", "policy_type"],
  ["AuthorizationGrant", "policy_type"],
  ["CapabilityGrant", "policy_type"],
  ["PermissionResponse", "policy_type"],
  ["PolicyDecision", "policy_type"],
  ["PolicyRule", "policy_type"],
  ["PolicyCondition", "policy_type"],
  ["PolicyAction", "policy_type"],
  ["PolicyException", "policy_type"],
  ["HumanApproval", "policy_type"],
  ["NetworkPolicy", "policy_type"],
  ["FilesystemPolicy", "policy_type"],
  ["ProcessPolicy", "policy_type"],
  ["OutboundRequest", "event_type"],
  ["InboundResponse", "event_type"],
  ["DeniedNetworkCall", "event_type"],
  ["SandboxEscapeRisk", "event_type"],
  ["PromptInjectionSignal", "event_type"],
  ["IndirectInjectionSignal", "event_type"],
  ["ToolStreamInjectionSignal", "event_type"],
  ["MemoryPoisoningSignal", "event_type"],
  ["PersistentContextRisk", "event_type"],
  ["TaintPropagation", "relation_type"],
  ["SourceSinkFlow", "relation_type"],
  ["UntrustedInstructionCandidate", "resource_type"],
  ["InstructionConflict", "event_type"],
  ["TrustedInstructionOverride", "policy_type"],
  ["RiskSource", "resource_type"],
  ["RiskSink", "resource_type"],
  ["CommitApproval", "policy_type"],
  ["CommitDenial", "policy_type"],
  ["SideEffect", "event_type"],
  ["SensitiveSpan", "resource_type"]
]);

const inferredGeneratedKind = (id, label) => {
  const override = generatedKindOverrides.get(id);
  if (override) {
    return override;
  }

  const terms = new Set(label.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const hasAny = (...values) => values.some((value) => terms.has(value));

  if (hasAny("adapter")) return "adapter_type";
  if (hasAny("policy", "rule", "condition")) return "policy_type";
  if (hasAny("event", "run", "call", "review", "execution", "decision", "attempt", "outcome")) return "event_type";
  if (hasAny("actor", "agent", "model")) return "actor_type";
  if (hasAny("index", "vector")) return "index_type";
  if (hasAny("command", "action")) return "action_type";
  return "resource_type";
};

const idToSourceIds = (id, planeId) => classById.get(id)?.source_ids ?? safeSourceIds(planeId);

for (const module of moduleSpecs) {
  for (const [id, label] of module.generated) {
    const kind = inferredGeneratedKind(id, label);
    const generatedPayload = {
      id,
      kind,
      plane_id: module.plane_id,
      module_id: module.id,
      label,
      definition: generatedClassDefinition(module, id, label, kind),
      source_ids: safeSourceIds(module.plane_id, module.source_ids)
    };
    if (!classById.has(id)) {
      classById.set(id, generatedPayload);
    } else if (generatedClassIds.has(id)) {
      classById.set(id, { ...classById.get(id), ...generatedPayload });
    } else {
      classById.set(id, { ...classById.get(id), plane_id: module.plane_id, module_id: module.id });
    }
  }
  for (const id of module.class_ids) {
    if (classById.has(id)) {
      classById.set(id, { ...classById.get(id), plane_id: module.plane_id, module_id: module.id });
    }
  }
}

const classes = [...classById.values()]
  .map((item) => {
    const definition = exactGeneratedClassDefinitions.get(item.id) ?? item.definition;
    return {
      ...item,
      ...(classOwnershipOverrides.get(item.id) ?? {}),
      source_ids: classSourceIdOverrides.get(item.id) ?? item.source_ids,
      definition,
      kind: classKindOverrides.get(item.id) ?? item.kind
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const moduleList = moduleSpecs.map((module) => ({
  id: module.id,
  plane_id: module.plane_id,
  label: module.label,
  definition: module.definition,
  source_ids: safeSourceIds(module.plane_id, module.source_ids),
  class_ids: [...new Set([...module.class_ids, ...module.generated.map(([id]) => id)])].filter((id) => classById.has(id)).sort()
}));

const objectPropertySeeds = [
  ["has_part", "has part", "composition", "any", "any", true],
  ["is_part_of", "is part of", "composition", "any", "any", true],
  ["precedes", "precedes", "temporal", "event_type", "event_type", true],
  ["follows", "follows", "temporal", "event_type", "event_type", true],
  ["uses", "uses", "event", "event_type", "resource_type", false],
  ["generates", "generates", "event", "event_type", "resource_type", false],
  ["observes", "observes", "observability", "actor_type", "event_type", false],
  ["controls", "controls", "governance", "actor_type", "object_type", false],
  ["authorizes", "authorizes", "safety_flow", "policy_type", "event_type", false],
  ["blocks", "blocks", "safety_flow", "policy_type", "event_type", false],
  ["escalates", "escalates", "safety_flow", "event_type", "event_type", false],
  ["delegates", "delegates", "orchestration_flow", "actor_type", "actor_type", false],
  ["routes", "routes", "orchestration_flow", "event_type", "event_type", false],
  ["has_runtime_session", "has runtime session", "runtime_execution", "AgentSystem", "RuntimeSession", true],
  ["has_run_attempt", "has run attempt", "runtime_execution", "RuntimeSession", "RunAttempt", true],
  ["yields_run_outcome", "yields run outcome", "runtime_execution", "RunAttempt", "RunOutcome", true],
  ["run_attempt_belongs_to_task", "run attempt belongs to task", "runtime_execution", "RunAttempt", "Task", false],
  ["uses_runtime_environment", "uses runtime environment", "runtime_execution", "RunAttempt", "RuntimeEnvironment", false],
  ["constrained_by_runtime_budget", "constrained by runtime budget", "runtime_execution", "RunAttempt", "RuntimeBudget", false],
  ["opens_runtime_session", "opens runtime session", "runtime_execution", "SessionStartEvent", "RuntimeSession", true],
  ["closes_runtime_session", "closes runtime session", "runtime_execution", "SessionEndEvent", "RuntimeSession", true],
  ["pauses_with_snapshot", "pauses with snapshot", "runtime_execution", "SessionPauseEvent", "StateSnapshot", false],
  ["resumes_from_checkpoint", "resumes from checkpoint", "runtime_execution", "SessionResumeEvent", "Checkpoint", false],
  ["participates_in_session", "participates in session", "runtime_execution", "AgentActor", "RuntimeSession", false],
  ["associated_with_attempt", "associated with attempt", "runtime_execution", "AgentActor", "RunAttempt", false],
  ["has_actor_role_binding", "has actor role binding", "runtime_execution", "AgentActor", "ActorRoleBinding", false],
  ["has_actor_authority_scope", "has actor authority scope", "runtime_execution", "AgentActor", "ActorAuthorityScope", false],
  ["has_actor_capability_binding", "has actor capability binding", "runtime_execution", "AgentActor", "ActorCapabilityBinding", false],
  ["remote_agent_crosses_trust_boundary", "remote agent crosses trust boundary", "runtime_execution", "RemoteAgentReference", "TrustBoundary", false],
  ["session_has_trace", "session has trace", "runtime_execution", "RuntimeSession", "TraceRecord", true],
  ["trace_contains_span", "trace contains span", "runtime_execution", "TraceRecord", "TraceSpan", true],
  ["trace_has_context", "trace has context", "runtime_execution", "TraceRecord", "TraceContext", false],
  ["span_contains_event", "span contains event", "runtime_execution", "TraceSpan", "TraceEvent", true],
  ["span_has_parent_span", "span has parent span", "runtime_execution", "TraceSpan", "TraceSpan", true],
  ["span_has_attribute", "span has attribute", "runtime_execution", "TraceSpan", "SpanAttribute", false],
  ["span_has_status", "span has status", "runtime_execution", "TraceSpan", "SpanStatus", false],
  ["trace_link_source_span", "trace link source span", "runtime_execution", "TraceLink", "TraceSpan", false],
  ["trace_link_target_span", "trace link target span", "runtime_execution", "TraceLink", "TraceSpan", false],
  ["trace_event_belongs_to_span", "trace event belongs to span", "runtime_execution", "TraceEvent", "TraceSpan", false],
  ["trace_event_ordered_before", "trace event ordered before", "runtime_execution", "TraceEvent", "TraceEvent", true],
  ["trace_event_caused_by", "trace event caused by", "runtime_execution", "TraceEvent", "TraceEvent", false],
  ["checkpoint_captures_snapshot", "checkpoint captures snapshot", "runtime_execution", "Checkpoint", "StateSnapshot", true],
  ["checkpoint_belongs_to_session", "checkpoint belongs to session", "runtime_execution", "Checkpoint", "RuntimeSession", false],
  ["checkpoint_has_parent", "checkpoint has parent", "runtime_execution", "Checkpoint", "Checkpoint", true],
  ["state_diff_from_snapshot", "state diff from snapshot", "runtime_execution", "StateDiff", "StateSnapshot", false],
  ["state_diff_to_snapshot", "state diff to snapshot", "runtime_execution", "StateDiff", "StateSnapshot", false],
  ["restore_event_restores_checkpoint", "restore event restores checkpoint", "runtime_execution", "CheckpointRestoreEvent", "Checkpoint", false],
  ["replay_event_replays_trace", "replay event replays trace", "runtime_execution", "ReplayEvent", "TraceRecord", false],
  ["artifact_produced_by_attempt", "artifact produced by attempt", "runtime_execution", "Artifact", "RunAttempt", false],
  ["artifact_produced_by_event", "artifact produced by event", "runtime_execution", "Artifact", "TraceEvent", false],
  ["artifact_consumed_by_attempt", "artifact consumed by attempt", "runtime_execution", "Artifact", "RunAttempt", false],
  ["artifact_derived_from", "artifact derived from", "runtime_execution", "Artifact", "Artifact", true],
  ["artifact_attributed_to_actor", "artifact attributed to actor", "runtime_execution", "Artifact", "AgentActor", false],
  ["artifact_reviewed_by", "artifact reviewed by", "runtime_execution", "Artifact", "ReviewEvent", false],
  ["artifact_exported_as", "artifact exported as", "runtime_execution", "Artifact", "ExportArtifact", false],
  ["decomposes_goal_into", "decomposes goal into", "orchestration_flow", "Goal", "Objective", true],
  ["has_task_step", "has task step", "orchestration_flow", "TaskPlan", "TaskStep", true],
  ["depends_on_task", "depends on task", "orchestration_flow", "TaskStep", "TaskStep", true],
  ["assigns_work_item_to", "assigns work item to", "orchestration_flow", "TaskDistribution", "WorkerAgent", false],
  ["retains_answer_ownership", "retains answer ownership", "orchestration_flow", "AgentAsToolInvocation", "AnswerOwnership", false],
  ["transfers_control_to", "transfers control to", "orchestration_flow", "Handoff", "HandoffTarget", false],
  ["uses_agent_as_tool", "uses agent as tool", "orchestration_flow", "Orchestrator", "AgentAsToolInvocation", false],
  ["isolates_context_for", "isolates context for", "orchestration_flow", "ContextIsolation", "Subagent", false],
  ["delegates_authority_scope", "delegates authority scope", "orchestration_flow", "DelegationContract", "DelegatedAuthority", false],
  ["selects_worker_from_pool", "selects worker from pool", "orchestration_flow", "WorkerSelection", "WorkerPool", false],
  ["routes_to_target", "routes to target", "orchestration_flow", "Route", "RoutingTarget", false],
  ["has_control_topology", "has control topology", "orchestration_flow", "TaskPlan", "OrchestrationTopology", false],
  ["constrained_by_budget", "constrained by budget", "orchestration_flow", "DelegationContract", "DelegationBudget", false],
  ["synthesizes_from_input", "synthesizes from input", "orchestration_flow", "Synthesis", "SynthesisInput", false],
  ["produces_synthesis_output", "produces synthesis output", "orchestration_flow", "Synthesis", "SynthesisOutput", false],
  ["triggers_revision_attempt", "triggers revision attempt", "orchestration_flow", "FeedbackEvent", "ImprovementAttempt", false],
  ["terminates_on_condition", "terminates on condition", "orchestration_flow", "StopRetryLineage", "StopCondition", false],
  ["retries_from_attempt", "retries from attempt", "orchestration_flow", "StopRetryLineage", "ImprovementAttempt", false],
  ["invokes", "invokes", "tool_flow", "event_type", "object_type", false],
  ["returns", "returns", "tool_flow", "event_type", "resource_type", false],
  ["retrieves", "retrieves", "memory_flow", "event_type", "resource_type", false],
  ["ranks", "ranks", "memory_flow", "event_type", "resource_type", false],
  ["summarizes", "summarizes", "memory_flow", "event_type", "resource_type", false],
  ["indexes", "indexes", "information_flow", "index_type", "resource_type", false],
  ["maps_to", "maps to", "adapter_mapping", "adapter_type", "any", false],
  ["maps_external_construct_to_canonical", "maps external construct to canonical", "adapter_mapping", "MappingRule", "any", false],
  ["maps_canonical_term_to_external_construct", "maps canonical term to external construct", "adapter_mapping", "MappingRule", "any", false],
  ["emits_conversion_warning", "emits conversion warning", "adapter_mapping", "MappingRule", "ConversionWarning", false],
  ["maps_protocol_message_to_canonical_message", "maps protocol message to canonical message", "adapter_mapping", "ProtocolMessageMapping", "Message", false],
  ["maps_protocol_task_to_canonical_task", "maps protocol task to canonical task", "adapter_mapping", "ProtocolTaskMapping", "Task", false],
  ["maps_protocol_capability_to_canonical_capability", "maps protocol capability to canonical capability", "adapter_mapping", "ProtocolCapabilityMapping", "ToolCapability", false],
  ["maps_protocol_trust_to_trust_boundary", "maps protocol trust to trust boundary", "adapter_mapping", "ProtocolTrustMapping", "TrustBoundary", false],
  ["maps_framework_handoff_to_canonical_handoff", "maps framework handoff to canonical handoff", "adapter_mapping", "FrameworkHandoffMapping", "Handoff", false],
  ["maps_framework_trace_to_trace_record", "maps framework trace to trace record", "adapter_mapping", "FrameworkTraceMapping", "TraceRecord", false],
  ["maps_statechart_state_to_snapshot", "maps statechart state to snapshot", "adapter_mapping", "StatechartAdapter", "StateSnapshot", false],
  ["maps_benchmark_score_to_metric", "maps benchmark score to metric", "adapter_mapping", "BenchmarkAdapter", "Metric", false],
  ["maps_schema_profile_to_schema_artifact", "maps schema profile to schema artifact", "adapter_mapping", "SchemaAdapter", "SchemaArtifact", false],
  ["has_sender", "has sender", "message_envelope", "Message", "MessageSender", false],
  ["has_receiver", "has receiver", "message_envelope", "Message", "MessageReceiver", false],
  ["has_role", "has role", "message_envelope", "Message", "MessageRole", false],
  ["has_content_block", "has content block", "message_envelope", "Message", "ContentBlock", false],
  ["part_of_conversation", "part of conversation", "message_envelope", "Message", "Conversation", false],
  ["reply_to", "reply to", "message_envelope", "Message", "Message", false],
  ["has_turn_index", "has turn index", "message_envelope", "ConversationTurn", "TurnIndex", false],
  ["uses_protocol_envelope", "uses protocol envelope", "message_envelope", "Message", "ProtocolEnvelope", false],
  ["has_instruction_authority", "has instruction authority", "instruction_flow", "Instruction", "InstructionAuthority", false],
  ["has_instruction_scope", "has instruction scope", "instruction_flow", "Instruction", "InstructionScope", false],
  ["has_instruction_priority", "has instruction priority", "instruction_flow", "Instruction", "InstructionPriority", false],
  ["conflicts_with_instruction", "conflicts with instruction", "instruction_flow", "Instruction", "Instruction", false],
  ["overrides_instruction", "overrides instruction", "instruction_flow", "InstructionOverride", "Instruction", false],
  ["has_source_reference", "has source reference", "source_reference", "ContentBlock", "SourceReference", false],
  ["has_source_span", "has source span", "source_reference", "SourceReference", "SourceSpan", false],
  ["has_source_location", "has source location", "source_reference", "SourceReference", "SourceLocation", false],
  ["has_mime_type", "has mime type", "content_modality", "ContentBlock", "MimeType", false],
  ["has_checksum", "has checksum", "source_reference", "SourceReference", "SourceChecksum", false],
  ["has_version", "has version", "source_reference", "SourceReference", "SourceVersion", false],
  ["has_access_path", "has access path", "source_reference", "SourceReference", "AccessPath", false],
  ["crosses_trust_boundary", "crosses trust boundary", "trust_boundary", "BoundaryCrossing", "TrustBoundary", false],
  ["belongs_to_data_zone", "belongs to data zone", "trust_boundary", "SourceReference", "DataZoneReference", false],
  ["boundary_crossing_has_source_actor", "boundary crossing has source actor", "safety_propagation", "BoundaryCrossing", "AgentActor", false],
  ["boundary_crossing_has_target_actor", "boundary crossing has target actor", "safety_propagation", "BoundaryCrossing", "AgentActor", false],
  ["boundary_crossing_has_source_zone", "boundary crossing has source zone", "safety_propagation", "BoundaryCrossing", "DataZone", false],
  ["boundary_crossing_has_target_zone", "boundary crossing has target zone", "safety_propagation", "BoundaryCrossing", "DataZone", false],
  ["boundary_crossing_authorized_by", "boundary crossing authorized by", "safety_propagation", "BoundaryCrossing", "PolicyDecision", false],
  ["boundary_crossing_recorded_by_trace_event", "boundary crossing recorded by trace event", "safety_propagation", "BoundaryCrossing", "TraceEvent", false],
  ["source_reference_belongs_to_data_zone", "source reference belongs to data zone", "safety_propagation", "SourceReference", "DataZone", false],
  ["context_window_crosses_trust_boundary", "context window crosses trust boundary", "safety_propagation", "VisibleContextWindow", "TrustBoundary", false],
  ["message_scanned_by_pattern_scan", "message scanned by pattern scan", "safety_propagation", "Message", "PatternScan", false],
  ["instruction_flagged_as_prompt_injection", "instruction flagged as prompt injection", "safety_propagation", "Instruction", "PromptInjectionSignal", false],
  ["tool_result_flagged_as_tool_stream_injection", "tool result flagged as tool stream injection", "safety_propagation", "ToolResult", "ToolStreamInjectionSignal", false],
  ["tool_result_scanned_by_pattern_scan", "tool result scanned by pattern scan", "safety_propagation", "ToolResult", "PatternScan", false],
  ["tool_call_requires_permission_scope", "tool call requires permission scope", "permission_flow", "ToolCall", "PermissionScope", false],
  ["tool_call_evaluated_by_policy_decision", "tool call evaluated by policy decision", "permission_flow", "ToolCall", "PolicyDecision", false],
  ["tool_call_executes_in_sandbox", "tool call executes in sandbox", "permission_flow", "ToolCall", "Sandbox", false],
  ["mcp_authorization_maps_to_authorization_grant", "MCP authorization maps to authorization grant", "permission_flow", "MCPAuthorization", "AuthorizationGrant", false],
  ["commit_request_evaluated_by_commit_gate", "commit request evaluated by commit gate", "commit_control", "CommitRequest", "CommitGate", false],
  ["commit_gate_emits_policy_decision", "commit gate emits policy decision", "commit_control", "CommitGate", "PolicyDecision", false],
  ["commit_approval_authorizes_side_effect", "commit approval authorizes side effect", "commit_control", "CommitApproval", "SideEffect", false],
  ["commit_denial_blocks_side_effect", "commit denial blocks side effect", "commit_control", "CommitDenial", "SideEffect", false],
  ["side_effect_produced_by_tool_call", "side effect produced by tool call", "commit_control", "SideEffect", "ToolCall", false],
  ["side_effect_produced_by_sandbox_command", "side effect produced by sandbox command", "commit_control", "SideEffect", "SandboxCommand", false],
  ["side_effect_produced_by_network_call", "side effect produced by network call", "commit_control", "SideEffect", "NetworkCall", false],
  ["side_effect_has_rollback_action", "side effect has rollback action", "commit_control", "SideEffect", "RollbackAction", false],
  ["output_segment_has_sensitive_span", "output segment has sensitive span", "disclosure_control", "OutputSegment", "SensitiveSpan", false],
  ["disclosure_filter_suppresses_output_window", "disclosure filter suppresses output window", "disclosure_control", "DisclosureFilter", "OutputWindow", false],
  ["redaction_applies_to_sensitive_span", "redaction applies to sensitive span", "disclosure_control", "Redaction", "SensitiveSpan", false],
  ["audit_disclosure_records_disclosure_filter", "audit disclosure records disclosure filter", "disclosure_control", "AuditDisclosure", "DisclosureFilter", false],
  ["ingested_into_context", "ingested into context", "context_ingress", "ContextIngressEvent", "ContextPackage", false],
  ["selected_for_context", "selected for context", "context_ingress", "RetrievedContextCandidate", "ContextPackage", false],
  ["excluded_from_context", "excluded from context", "context_ingress", "ContextSelectionDecision", "SuppressedContext", false],
  ["compressed_into_summary", "compressed into summary", "context_ingress", "ContentBlock", "ContextSummary", false],
  ["truncated_by_window", "truncated by window", "context_ingress", "ContentBlock", "TruncatedContextSpan", false],
  ["ranked_by_score", "ranked by score", "context_ingress", "RetrievedContextCandidate", "RetrievalScore", false],
  ["derived_from_source", "derived from source", "context_ingress", "ContentBlock", "SourceReference", false],
  ["derived_from_trace_event", "derived from trace event", "context_ingress", "CommandOutputObservation", "TraceEvent", false],
  ["has_visible_window", "has visible window", "context_disclosure", "ContextPackage", "VisibleContextWindow", false],
  ["suppressed_by_rule", "suppressed by rule", "context_disclosure", "SuppressedContext", "DisclosureRule", false],
  ["redacted_by_policy", "redacted by policy", "context_disclosure", "ContentBlock", "PolicyRule", false],
  ["cites_source", "cites source", "context_disclosure", "OutputCitation", "SourceSpan", false],
  ["displayed_to_actor", "displayed to actor", "context_disclosure", "DisclosedOutputSegment", "AgentActor", false],
  ["released_to_boundary", "released to boundary", "context_disclosure", "DisclosedOutputSegment", "TrustBoundary", false],
  ["produced_by_command_execution", "produced by command execution", "execution_observation", "CommandOutputObservation", "CommandExecution", false],
  ["has_stdout_chunk", "has stdout chunk", "execution_observation", "CommandOutputObservation", "StandardOutputChunk", false],
  ["has_stderr_chunk", "has stderr chunk", "execution_observation", "CommandOutputObservation", "StandardErrorChunk", false],
  ["has_exit_status", "has exit status", "execution_observation", "CommandOutputObservation", "ExitStatusObservation", false],
  ["observed_as_context_input", "observed as context input", "execution_observation", "CommandOutputObservation", "ContextIngressEvent", false],
  ["summarized_as_context_input", "summarized as context input", "execution_observation", "CommandOutputObservation", "ContextSummary", false]
];

const regeneratedModulePropertyIds = new Set(
  moduleSpecs.flatMap((module) => {
    const prefix = module.id.replace(/-/g, "_");
    return [`${prefix}_contains`, `${prefix}_relates`, `${prefix}_emits_event`];
  })
);
const obsoleteRelationIds = new Set([
  "adapter_benchmarks_statecharts_contains",
  "adapter_benchmarks_statecharts_relates",
  "adapter_benchmarks_statecharts_emits_event"
]);
const existingRelationDefinitionOverrides = new Map([
  [
    "maps_external_term_to",
    "legacy adapter summary relation that links an external protocol, framework, benchmark, statechart, or schema term to a canonical ontology term; use maps_external_construct_to_canonical for precise directional mapping records."
  ]
]);
const existingRelations = ontology.relations.filter((relation) => !regeneratedModulePropertyIds.has(relation.id) && !obsoleteRelationIds.has(relation.id)).map((relation) => ({
  id: relation.id,
  label: relation.label,
  family: relation.family,
  definition: existingRelationDefinitionOverrides.get(relation.id) ?? relation.definition,
  domain: relation.domain,
  range: relation.range,
  acyclic: Boolean(relation.acyclic),
  source_ids: relation.source_ids
}));

const generatedObjectProperties = [];
const objectPropertyDefinitions = new Map([
  ["has_part", "links an agent-system whole to a component that is structurally included in it."],
  ["is_part_of", "links an agent-system component back to the larger structure that contains it."],
  ["precedes", "orders observable events when one event occurs before another in a run, task, or protocol flow."],
  ["follows", "orders observable events when one event occurs after another in a run, task, or protocol flow."],
  ["uses", "links an event or action to the resource, tool, model, memory item, or policy it consumes."],
  ["generates", "links an event or action to the artifact, result, trace, warning, or resource it produces."],
  ["observes", "links an actor or runtime surface to an event that it records or monitors."],
  ["controls", "links an actor, policy, or runtime controller to the object whose behavior it constrains."],
  ["authorizes", "legacy summary relation for a policy or permission artifact allowing an event; use concrete authorizes relations such as commit_approval_authorizes_side_effect for specific safety audit edges."],
  ["blocks", "legacy summary relation for a policy or permission artifact blocking an event; use concrete blocks relations such as commit_denial_blocks_side_effect for specific safety audit edges."],
  ["escalates", "links a safety, review, or runtime event to a higher-authority decision path."],
  ["delegates", "links an actor or orchestrator to the agent, worker, or remote participant receiving responsibility."],
  ["routes", "links a routing event to the downstream branch, handler, or operation selected for execution."],
  ["has_runtime_session", "links an agent system to a bounded runtime session so actors, attempts, traces, checkpoints, and artifacts are grouped under one execution episode."],
  ["has_run_attempt", "links a runtime session to an individual execution attempt, including retries and resumed attempts that occur inside the same session boundary."],
  ["yields_run_outcome", "links a run attempt to its terminal outcome record so success, failure, cancellation, produced artifacts, and final state remain auditable."],
  ["run_attempt_belongs_to_task", "links an execution attempt to the task or work item it realizes, keeping orchestration intent separate from observed runtime execution."],
  ["uses_runtime_environment", "links an execution attempt to the concrete container, sandbox, working directory, model/tool availability, and configuration used at runtime."],
  ["constrained_by_runtime_budget", "links an execution attempt to the token, time, cost, retry, tool-call, or context budget that bounded the run."],
  ["opens_runtime_session", "links a session start event to the runtime session it opens with initial actor, environment, goal, and context state."],
  ["closes_runtime_session", "links a session end event to the runtime session it closes, preserving terminal status, cleanup evidence, and artifact references."],
  ["pauses_with_snapshot", "links a pause event to the state snapshot retained so the runtime can later resume or inspect the paused session."],
  ["resumes_from_checkpoint", "links a session resume event to the checkpoint used to restore state, pending work, and execution context."],
  ["participates_in_session", "links a runtime actor identity to the session in which it acts, observes, authorizes, generates, retrieves, ranks, reviews, or executes."],
  ["associated_with_attempt", "links a runtime actor to the execution attempt for which it bears participation, responsibility, or provenance evidence."],
  ["has_actor_role_binding", "links a runtime actor to the role assignment that explains its delegated responsibility, review duty, approval authority, or accountability."],
  ["has_actor_authority_scope", "links a runtime actor to the authority scope bounding permitted tools, operations, resources, data zones, and boundaries."],
  ["has_actor_capability_binding", "links a runtime actor to the callable, observable, generation, retrieval, ranking, or review capability it may use under stated conditions."],
  ["remote_agent_crosses_trust_boundary", "links an opaque remote agent reference to the trust boundary crossed by task, message, artifact, or status exchange."],
  ["session_has_trace", "links a runtime session to the trace record that contains its root span, spans, events, links, context, and retention policy."],
  ["trace_contains_span", "links a trace record to an operation span so runtime work is represented as nested or related units of work."],
  ["trace_has_context", "links a trace record to the propagation and correlation context that carries identifiers, sampling state, and boundary metadata."],
  ["span_contains_event", "links a trace span to timestamped events such as model calls, tool calls, handoffs, warnings, state updates, or artifact updates."],
  ["span_has_parent_span", "links a span to its parent span, forming the nested trace tree used to reconstruct execution order and causal containment."],
  ["span_has_attribute", "links a trace span to keyed observable metadata such as operation name, model or tool identity, token use, latency, status detail, or boundary tag."],
  ["span_has_status", "links a trace span to its status record so errors, cancellation, blocking, retry, or degraded execution can be inspected without reinterpretation."],
  ["trace_link_source_span", "links a trace link object to the source span that participates in a non-parent causal or contextual relationship."],
  ["trace_link_target_span", "links a trace link object to the target span reached by a non-parent causal or contextual relationship."],
  ["trace_event_belongs_to_span", "links an observable runtime event to the span interval in which it occurred, preserving trace-local ordering and containment."],
  ["trace_event_ordered_before", "orders two trace events when one occurred before the other within a span, session, run attempt, or replayable trace sequence."],
  ["trace_event_caused_by", "links a trace event to the prior event that triggered, produced, or explains it, without collapsing causal evidence into narrative text."],
  ["checkpoint_captures_snapshot", "links a checkpoint to the state snapshot it saved so resume, branch, time travel, or recovery can start from a known state."],
  ["checkpoint_belongs_to_session", "links a checkpoint to the runtime session or thread boundary whose state it preserves."],
  ["checkpoint_has_parent", "links a checkpoint to the prior checkpoint from which it was derived, enabling checkpoint lineage and branch reconstruction."],
  ["state_diff_from_snapshot", "links a state diff to the source snapshot whose values, channels, artifacts, or lifecycle position are being compared."],
  ["state_diff_to_snapshot", "links a state diff to the target snapshot that shows the resulting values, channels, artifacts, or lifecycle position after change."],
  ["restore_event_restores_checkpoint", "links a checkpoint restore event to the checkpoint used to rehydrate state, pending writes, or interrupted work."],
  ["replay_event_replays_trace", "links a replay event to the trace record replayed for debugging, evaluation, reproduction, review, or audit."],
  ["artifact_produced_by_attempt", "links a runtime artifact to the run attempt that produced or finalized it."],
  ["artifact_produced_by_event", "links a runtime artifact to the trace event that emitted, updated, or materialized it."],
  ["artifact_consumed_by_attempt", "links a runtime artifact to the run attempt that read, transformed, cited, validated, or incorporated it."],
  ["artifact_derived_from", "links a runtime artifact to an earlier artifact from which it was revised, summarized, patched, converted, or exported."],
  ["artifact_attributed_to_actor", "links a runtime artifact to the actor responsible for creating, approving, modifying, or delivering it."],
  ["artifact_reviewed_by", "links a runtime artifact to the review event that inspected, accepted, rejected, or requested changes to it."],
  ["artifact_exported_as", "links a runtime artifact to the export artifact or delivery form prepared for a recipient, adapter, or trust boundary."],
  ["decomposes_goal_into", "links a high-level goal to the operational objective that makes the goal measurable, assignable, and traceable."],
  ["has_task_step", "links a task plan to an ordered step that contributes to completion of the planned work."],
  ["depends_on_task", "links a task step to another task step whose result, approval, resource, or state must exist before it can proceed."],
  ["assigns_work_item_to", "links a task distribution event to the worker agent that receives the scoped work item."],
  ["retains_answer_ownership", "links an agent-as-tool invocation to the ownership record showing the managing agent remains accountable for the final answer."],
  ["transfers_control_to", "links a handoff event to the target actor, route, or endpoint that receives control of the next workflow step."],
  ["uses_agent_as_tool", "links an orchestrator to a bounded invocation where another agent is called as a helper while manager control is retained."],
  ["isolates_context_for", "links a context-isolation policy to the subagent whose visible messages, tools, memory, and sources are scoped by it."],
  ["delegates_authority_scope", "links a delegation contract to the authority scope that specifies which tools, memory, data zones, and operations may be used."],
  ["selects_worker_from_pool", "links a worker-selection decision to the candidate worker pool from which a subagent, model, tool, or delegate is chosen."],
  ["routes_to_target", "links a route to the typed downstream target it selects, such as a worker, tool, branch, protocol adapter, operation, or stop path."],
  ["has_control_topology", "links a task plan to the orchestration topology that structures manager-worker, hierarchical, graph, parallel, or dynamic coordination."],
  ["constrained_by_budget", "links a delegation contract to the token, time, cost, retry, context, or tool-call budget governing delegated work."],
  ["synthesizes_from_input", "links a synthesis event to the worker output, retrieved evidence, vote, tool result, or feedback input it consumes."],
  ["produces_synthesis_output", "links a synthesis event to the coherent answer, artifact, summary, plan, or decision it produces."],
  ["triggers_revision_attempt", "links feedback returned into a control loop to the bounded improvement attempt launched from that feedback."],
  ["terminates_on_condition", "links stop-retry lineage to the stop condition that ended a loop, branch, retry sequence, or delegated attempt."],
  ["retries_from_attempt", "links stop-retry lineage to the improvement attempt from which the next bounded retry or revision is derived."],
  ["invokes", "links an action event to the tool, function, service, or execution surface being called."],
  ["returns", "links a tool or action event to the result, error, artifact, or warning returned to the runtime."],
  ["retrieves", "links a retrieval event to the memory record, source chunk, or indexed resource it returns."],
  ["ranks", "links a ranking event to the candidate set, result list, or scored resource it orders."],
  ["summarizes", "links a compression or synthesis event to the shorter context, disclosure, or artifact it creates."],
  ["indexes", "links an indexing process to the resource, chunk, vector, key, or pointer made searchable."],
  [
    "maps_to",
    "legacy summary relation linking adapter family records to canonical terms; precise directional mapping is represented by maps_external_construct_to_canonical and maps_canonical_term_to_external_construct."
  ],
  [
    "maps_external_construct_to_canonical",
    "links a mapping rule from an external protocol, framework, benchmark, statechart, schema, export, or frontend construct to the canonical ontology term it aligns with."
  ],
  [
    "maps_canonical_term_to_external_construct",
    "links a mapping rule from a canonical ontology term to the external protocol, framework, benchmark, statechart, schema, export, or frontend construct it projects into."
  ],
  [
    "emits_conversion_warning",
    "links a mapping rule to the conversion warning emitted when an adapter mapping loses information, approximates semantics, encounters unsupported features, or requires review."
  ],
  [
    "maps_protocol_message_to_canonical_message",
    "links a protocol message mapping to the canonical Message term used for protocol-native envelopes, performatives, task messages, or tool-context messages."
  ],
  [
    "maps_protocol_task_to_canonical_task",
    "links a protocol task mapping to the canonical Task term used for protocol-native task lifecycle, delegation, or request records."
  ],
  [
    "maps_protocol_capability_to_canonical_capability",
    "links a protocol capability mapping to the canonical ToolCapability term used for external tool, resource, prompt, service, or agent capability advertisements."
  ],
  [
    "maps_protocol_trust_to_trust_boundary",
    "links a protocol trust mapping to the canonical TrustBoundary term used for identity, authorization, opacity, remote-agent, or protected-resource metadata."
  ],
  [
    "maps_framework_handoff_to_canonical_handoff",
    "links a framework handoff mapping to the canonical Handoff term used for framework-native handoff, delegation, responsibility transfer, and ownership semantics."
  ],
  [
    "maps_framework_trace_to_trace_record",
    "links a framework trace mapping to the canonical TraceRecord term used for framework-native runs, traces, spans, streams, checkpoints, and observable events."
  ],
  [
    "maps_statechart_state_to_snapshot",
    "links a statechart adapter to the canonical StateSnapshot term used when state-machine states, snapshots, or lifecycle positions are projected into runtime state profiles."
  ],
  [
    "maps_benchmark_score_to_metric",
    "links a benchmark adapter to the canonical Metric term used when benchmark scores, success rates, grading checks, rubrics, or pressure axes are represented as evaluation evidence."
  ],
  [
    "maps_schema_profile_to_schema_artifact",
    "links a schema adapter to the canonical SchemaArtifact term used for JSON Schema, OWL, SHACL, ShEx, Zod, Pydantic, Graph IR, or frontend projection outputs."
  ],
  ["has_sender", "links a message envelope to the actor, service, user, tool, or remote agent that emitted it."],
  ["has_receiver", "links a message envelope to the actor, model call, user, tool, or remote agent intended to receive it."],
  ["has_role", "links a message envelope to the role under which the receiver should interpret it."],
  ["has_content_block", "links a message envelope to a typed content block so multimodal content can be budgeted, cited, filtered, or staged."],
  ["part_of_conversation", "links a message or turn to the conversation or thread that supplies ordering and continuity."],
  ["reply_to", "links a message to the prior message or turn it answers, corrects, extends, or cites."],
  ["has_turn_index", "links a conversation turn to its ordinal position so history is not reduced to an unordered set."],
  ["uses_protocol_envelope", "links a message to protocol-level wrapping such as task identity, artifact references, sender, receiver, or capability metadata."],
  ["has_instruction_authority", "links an instruction to the authority source used to resolve conflicts among system, developer, user, policy, retrieved, or tool-originated directives."],
  ["has_instruction_scope", "links an instruction to the session, task, tool call, source span, or trust boundary where it applies."],
  ["has_instruction_priority", "links an instruction to the precedence ordering used when multiple directives compete."],
  ["conflicts_with_instruction", "links two instructions whose requested behavior, scope, or authority cannot both be satisfied."],
  ["overrides_instruction", "links an authorized instruction override to the lower-priority or narrower instruction it replaces or limits."],
  ["has_source_reference", "links a context artifact, content block, citation, or retrieval candidate to the source reference that supports it."],
  ["has_source_span", "links a source reference to the exact span, row, range, page, line, offset, or anchor used as evidence."],
  ["has_source_location", "links a source reference to the URI, path, database locator, graph identifier, page, line, or cell location used to recover it."],
  ["has_mime_type", "links a content block or attachment to the media type required for parsing, rendering, safety checks, or model handling."],
  ["has_checksum", "links a source reference to a digest used to detect content drift after ingestion or context staging."],
  ["has_version", "links a source reference to the version, revision, snapshot, commit, or release that was cited."],
  ["has_access_path", "links a source reference to the permitted path or handle used to retrieve it under policy."],
  ["crosses_trust_boundary", "links a boundary-crossing event to the trust boundary crossed by transferred data, control, artifact, message, or authority."],
  ["belongs_to_data_zone", "links a source or context artifact to the data zone governing its visibility, retention, and allowed use."],
  ["boundary_crossing_has_source_actor", "links a boundary-crossing event to the actor, service, tool, user, or remote agent that sends, emits, delegates, or initiates the transfer."],
  ["boundary_crossing_has_target_actor", "links a boundary-crossing event to the actor, service, tool, user, or remote agent that receives, interprets, executes, or stores the transferred object."],
  ["boundary_crossing_has_source_zone", "links a boundary-crossing event to the source data zone whose trust, retention, visibility, or handling policy applies before transfer."],
  ["boundary_crossing_has_target_zone", "links a boundary-crossing event to the destination data zone whose trust, retention, visibility, or handling policy applies after transfer."],
  ["boundary_crossing_authorized_by", "links a boundary-crossing event to the policy decision that allowed, denied, escalated, sandboxed, or constrained that transfer."],
  ["boundary_crossing_recorded_by_trace_event", "links a boundary-crossing event to the observable trace event that records timestamp, actor, request, policy, and result evidence."],
  ["source_reference_belongs_to_data_zone", "links a source reference to the data zone that governs its classification, trust, retention, memory use, tool exposure, and disclosure routing."],
  ["context_window_crosses_trust_boundary", "links a visible context window to the trust boundary it crosses when content from another actor, zone, tool, memory, or remote agent becomes visible."],
  ["message_scanned_by_pattern_scan", "links a message envelope to the pattern scan that inspected its content blocks, instructions, attachments, or source references for injection and policy risk."],
  ["instruction_flagged_as_prompt_injection", "links an instruction or instruction-like candidate to the prompt-injection signal that explains the attempted override, manipulation, exfiltration, or policy bypass."],
  ["tool_result_flagged_as_tool_stream_injection", "links a tool result to the tool-stream injection signal that marks unsafe instructions, deceptive tool guidance, or exfiltration cues in returned output."],
  ["tool_result_scanned_by_pattern_scan", "links a tool result to the scan that inspected logs, streamed chunks, artifacts, status text, or result messages before reuse in context or action selection."],
  ["tool_call_requires_permission_scope", "links a tool call to the permission scope describing requested operation, protected resource, actor, data zone, trust boundary, duration, and side effects."],
  ["tool_call_evaluated_by_policy_decision", "links a tool call to the policy decision that allowed, denied, escalated, sandboxed, or constrained execution before side effects occur."],
  ["tool_call_executes_in_sandbox", "links a tool call to the sandbox boundary used to constrain process, filesystem, network, credential, and side-effect behavior during execution."],
  ["mcp_authorization_maps_to_authorization_grant", "links MCP authorization metadata or flow output to the canonical authorization grant that records scope, actor, resource, expiry, and audit basis."],
  ["commit_request_evaluated_by_commit_gate", "links a requested side effect to the commit gate that evaluates policy, approval, rollback, sandbox, and disclosure requirements before release."],
  ["commit_gate_emits_policy_decision", "links a commit gate to the policy decision it emits so side-effect approval, denial, escalation, or conditional release is traceable."],
  ["commit_approval_authorizes_side_effect", "links an approval outcome to the bounded side effect it authorizes, preserving scope, approver, policy basis, protected resource, and expiry."],
  ["commit_denial_blocks_side_effect", "links a denial outcome to the side effect it blocks, preserving actor, requested operation, protected resource, policy basis, and audit reason."],
  ["side_effect_produced_by_tool_call", "links a persistent or external side effect to the tool call that produced or attempted it, keeping tool execution distinct from commit authorization."],
  ["side_effect_produced_by_sandbox_command", "links a persistent or external side effect to the sandbox command that produced or attempted it under execution policy."],
  ["side_effect_produced_by_network_call", "links a persistent or external side effect to the network call that produced or attempted it under egress and credential policy."],
  ["side_effect_has_rollback_action", "links a side effect to the rollback action that can compensate, revert, delete, revoke, or neutralize the effect after approval or failure."],
  ["output_segment_has_sensitive_span", "links an output segment to the sensitive span requiring redaction, masking, suppression, delayed release, or restricted routing."],
  ["disclosure_filter_suppresses_output_window", "links a disclosure filter to the output window it suppresses or limits because sensitive spans, policy, recipient boundary, or data-zone controls apply."],
  ["redaction_applies_to_sensitive_span", "links a redaction operation to the sensitive span it masks, removes, replaces, summarizes, or withholds before disclosure."],
  ["audit_disclosure_records_disclosure_filter", "links an audit disclosure record to the disclosure filter whose decision released, redacted, suppressed, or escalated content."],
  ["ingested_into_context", "links an observable context-ingress event to the context package made visible to a model call or agent step."],
  ["selected_for_context", "links a retrieved candidate, source span, message, or observation to the context package that includes it."],
  ["excluded_from_context", "links a selection decision to content that was intentionally omitted, suppressed, deferred, or blocked."],
  ["compressed_into_summary", "links source content or output to the observable summary used to fit a context budget."],
  ["truncated_by_window", "links content to the context or output windowing decision that shortened it."],
  ["ranked_by_score", "links a retrieved context candidate to the score or rank evidence used during context selection."],
  ["derived_from_source", "links a content block, output segment, or summary to the source reference it was derived from."],
  ["derived_from_trace_event", "links a context observation to the observable runtime trace event that produced it."],
  ["has_visible_window", "links a context package to the visible window available to a model call, actor, or downstream recipient."],
  ["suppressed_by_rule", "links suppressed context or output to the disclosure, redaction, privacy, safety, or boundary rule that withheld it."],
  ["redacted_by_policy", "links content to the policy rule that removed or masked sensitive spans before disclosure or context staging."],
  ["cites_source", "links a visible output citation to the precise source span that supports the displayed claim or segment."],
  ["displayed_to_actor", "links a disclosed output segment to the actor or recipient that can see it."],
  ["released_to_boundary", "links a disclosed output segment to the trust boundary or external boundary it is allowed to cross."],
  ["produced_by_command_execution", "links command output observation to the runtime command execution event that produced it."],
  ["has_stdout_chunk", "links a command output observation to a bounded stdout chunk selected for staging, display, or audit."],
  ["has_stderr_chunk", "links a command output observation to a bounded stderr chunk selected for diagnostics, staging, or audit."],
  ["has_exit_status", "links a command output observation to the observed exit status or termination code."],
  ["observed_as_context_input", "links execution output to the context-ingress event that makes it visible to a model call or agent step."],
  ["summarized_as_context_input", "links execution output to the summary that carries it forward under context budget limits."]
]);
const objectPropertySourceIds = (family) => {
  if (family === "runtime_execution") {
    return [
      "eng-fw-openai-tracing",
      "eng-fw-langgraph-docs",
      "eng-ont-prov-o",
      "eng-proto-a2a-spec",
      "eng-state-xstate-docs"
    ];
  }

  if (family === "orchestration_flow") {
    return [
      "lit-agent-conductor",
      "lit-agent-orchestrationbench",
      "eng-fw-openai-orchestration",
      "eng-fw-langgraph-graph-api"
    ];
  }

  if (family === "adapter_mapping") {
    return [
      "eng-proto-mcp-spec",
      "eng-proto-a2a-spec",
      "eng-state-xstate-docs",
      "eng-val-jsonschema-spec",
      "eng-ont-fibo-ontology-guide"
    ];
  }

  if (
    [
      "safety_flow",
      "trust_boundary",
      "safety_propagation",
      "permission_flow",
      "commit_control",
      "disclosure_control"
    ].includes(family)
  ) {
    return [
      "lit-agent-safeagent",
      "eng-fw-openai-guardrails",
      "eng-security-mcp-nsa-2026",
      "lit-agent-toolsafe",
      "eng-fw-openai-tracing"
    ];
  }

  return ["eng-ont-go-overview", "eng-ont-cidoc-crm", "eng-ont-palantir-core-concepts"];
};
for (const [id, label, family, domain, range, acyclic] of objectPropertySeeds) {
  generatedObjectProperties.push({
    id,
    label,
    family,
    definition: objectPropertyDefinitions.get(id),
    domain,
    range,
    acyclic,
    source_ids: objectPropertySourceIds(family)
  });
}

for (const module of moduleList) {
  const classIds = module.class_ids;
  const first = classIds[0] ?? "AgentSystem";
  const second = classIds[1] ?? first;
  const modulePrefix = module.id.replace(/-/g, "_");
  const moduleGeneratedProperties = [
    {
      id: `${modulePrefix}_contains`,
      label: `${module.label.toLowerCase()} contains`,
      family: "module_composition",
      definition: `declares ${classLabel(first)} and sibling terms as members of the ${cleanModuleLabel(module.label)} scope.`,
      domain: module.id,
      range: first,
      acyclic: true,
      source_ids: module.source_ids
    },
    {
      id: `${modulePrefix}_relates`,
      label: `${module.label.toLowerCase()} relates`,
      family: "module_relation",
      definition: `connects ${classLabel(first)} to ${classLabel(second)} when both participate in ${cleanModuleScope(module)}.`,
      domain: first,
      range: second,
      acyclic: false,
      source_ids: module.source_ids
    },
    {
      id: `${modulePrefix}_emits_event`,
      label: `${module.label.toLowerCase()} emits event`,
      family: "module_event",
      definition: `connects operations in the ${cleanModuleLabel(module.label)} to observable TraceEvent records.`,
      domain: first,
      range: "TraceEvent",
      acyclic: false,
      source_ids: module.source_ids
    }
  ];

  generatedObjectProperties.push(
    ...(module.id.startsWith("info-")
      ? moduleGeneratedProperties.filter((property) => property.family !== "module_relation")
      : moduleGeneratedProperties)
  );
}

const propertyById = new Map([...existingRelations, ...generatedObjectProperties].map((prop) => [prop.id, prop]));
const objectProperties = [...propertyById.values()].sort((a, b) => a.id.localeCompare(b.id));

const dataPropertySeeds = [
  ["has_identifier", "has identifier", "string"],
  ["has_label", "has label", "string"],
  ["has_description", "has description", "string"],
  ["has_status", "has status", "string"],
  ["has_timestamp", "has timestamp", "date-time"],
  ["has_start_time", "has start time", "date-time"],
  ["has_end_time", "has end time", "date-time"],
  ["has_duration_ms", "has duration in milliseconds", "integer"],
  ["has_priority", "has priority", "integer"],
  ["has_rank", "has rank", "integer"],
  ["has_score", "has score", "number"],
  ["has_confidence", "has confidence", "number"],
  ["has_cost", "has cost", "number"],
  ["has_token_count", "has token count", "integer"],
  ["has_byte_count", "has byte count", "integer"],
  ["has_retry_count", "has retry count", "integer"],
  ["has_error_code", "has error code", "string"],
  ["has_warning_code", "has warning code", "string"],
  ["has_uri", "has URI", "string"],
  ["has_hash", "has hash", "string"]
];

const dataProperties = [];
for (const [id, label, range] of dataPropertySeeds) {
  const scalar = label.replace("has ", "");
  dataProperties.push({
    id,
    label,
    definition: `captures ${scalar} as a ${range} scalar on agent-system artifacts, resources, events, policies, or adapter records.`,
    domain: "any",
    range,
    source_ids: ["eng-ont-palantir-core-concepts", "eng-val-jsonschema-spec"]
  });
}

for (const module of moduleList) {
  const prefix = module.id.replace(/-/g, "_");
  dataProperties.push(
    {
      id: `${prefix}_has_state`,
      label: `${module.label.toLowerCase()} has state`,
      definition: `captures the lifecycle or operating state of terms in the ${cleanModuleLabel(module.label)}.`,
      domain: module.id,
      range: "string",
      source_ids: module.source_ids
    },
    {
      id: `${prefix}_has_evidence_strength`,
      label: `${module.label.toLowerCase()} has evidence strength`,
      definition: `captures source-support strength for claims attached to the ${cleanModuleLabel(module.label)}.`,
      domain: module.id,
      range: "number",
      source_ids: module.source_ids
    }
  );
}

const controlledIndividuals = [
  ["StatusReady", "status ready", "Status"],
  ["StatusRunning", "status running", "Status"],
  ["StatusPaused", "status paused", "Status"],
  ["StatusBlocked", "status blocked", "Status"],
  ["StatusCompleted", "status completed", "Status"],
  ["StatusFailed", "status failed", "Status"],
  ["RiskLow", "risk low", "RiskLevel"],
  ["RiskMedium", "risk medium", "RiskLevel"],
  ["RiskHigh", "risk high", "RiskLevel"],
  ["RiskCritical", "risk critical", "RiskLevel"],
  ["DecisionAllow", "decision allow", "DecisionKind"],
  ["DecisionDeny", "decision deny", "DecisionKind"],
  ["DecisionEscalate", "decision escalate", "DecisionKind"],
  ["DecisionRedact", "decision redact", "DecisionKind"],
  ["DecisionSandbox", "decision sandbox", "DecisionKind"],
  ["TransportStdio", "transport stdio", "TransportKind"],
  ["TransportHttp", "transport HTTP", "TransportKind"],
  ["TransportSse", "transport SSE", "TransportKind"],
  ["TransportWebSocket", "transport WebSocket", "TransportKind"],
  ["VisibilityPrivate", "visibility private", "Visibility"],
  ["VisibilitySession", "visibility session", "Visibility"],
  ["VisibilityUser", "visibility user", "Visibility"],
  ["VisibilityPublic", "visibility public", "Visibility"],
  ["AdapterMCP", "adapter MCP", "AdapterFamily"],
  ["AdapterA2A", "adapter A2A", "AdapterFamily"],
  ["AdapterFIPA", "adapter FIPA", "AdapterFamily"],
  ["AdapterKQML", "adapter KQML", "AdapterFamily"],
  ["AdapterLangGraph", "adapter LangGraph", "AdapterFamily"],
  ["AdapterOpenAIAgents", "adapter OpenAI Agents", "AdapterFamily"],
  ["AdapterCrewAI", "adapter CrewAI", "AdapterFamily"],
  ["AdapterDeepAgents", "adapter Deep Agents", "AdapterFamily"]
];

const controlledIndividualDefinition = (label, classId) => {
  if (classId === "AdapterFamily") {
    const adapterDefinitions = new Map([
      [
        "adapter MCP",
        "enumerates the MCP adapter family for tool, resource, prompt, discovery, authorization, elicitation, JSON-RPC message, and client-server capability exchange mappings."
      ],
      [
        "adapter A2A",
        "enumerates the A2A adapter family for remote agent identity, task lifecycle, message exchange, artifact exchange, opacity boundaries, and delegation metadata mappings."
      ],
      [
        "adapter FIPA",
        "enumerates the FIPA adapter family for agent communication acts, interaction protocols, agent management, message parameters, and conversation semantics mappings."
      ],
      [
        "adapter KQML",
        "enumerates the KQML adapter family for speech-act style message performatives, content-language metadata, sender and receiver roles, conversation control, and routing mappings."
      ],
      [
        "adapter LangGraph",
        "enumerates the LangGraph adapter family for graph runtime nodes, edges, durable execution, state updates, checkpoints, streams, and graph API mappings."
      ],
      [
        "adapter OpenAI Agents",
        "enumerates the OpenAI Agents adapter family for agent SDK handoffs, tools, tracing spans, guardrails, sessions, and hosted tool mappings."
      ],
      [
        "adapter CrewAI",
        "enumerates the CrewAI adapter family for agent roles, crews, tasks, flows, processes, tool assignments, and multi-agent collaboration mappings."
      ],
      [
        "adapter Deep Agents",
        "enumerates the Deep Agents adapter family for subagents, planning tools, file-system state, context quarantine, interrupts, and long-running task mappings."
      ]
    ]);

    return adapterDefinitions.get(label) ?? `adapter family "${label}" used to map an external protocol, framework, benchmark, or runtime profile without redefining ontology core.`;
  }

  const definitions = {
    Status: `status value "${label}" used to classify the lifecycle position of sessions, runs, tasks, tools, or validation gates.`,
    DecisionKind: `decision outcome "${label}" used by permission, policy, safety, or review flows.`,
    RiskLevel: `risk level "${label}" used to rank safety, protocol, tool, network, or data-boundary exposure.`,
    TransportKind: `transport option "${label}" used by protocol endpoints, streaming channels, and tool/resource exchange surfaces.`,
    Visibility: `visibility value "${label}" used to scope whether an artifact, trace, memory item, or disclosure is public, user-visible, session-bound, or private.`
  };

  return definitions[classId] ?? `enumerated value "${label}" used by ${classId} controlled vocabularies.`;
};

const individuals = [
  ...ontology.planes.map((plane) => ({
    id: `Individual_${plane.id.replace(/-/g, "_")}`,
    label: plane.label,
    class_id: "PlaneIndividual",
    definition: `enumerates the ${plane.label} as a selectable ontology plane for navigation, export, and validation.`,
    source_ids: ["eng-ont-go-overview", "eng-ont-palantir-core-concepts"]
  })),
  ...moduleList.map((module) => ({
    id: `Individual_${module.id.replace(/-/g, "_")}`,
    label: module.label,
    class_id: "ModuleIndividual",
    definition: `enumerates the ${cleanModuleLabel(module.label)} for artifacts that ${cleanModuleScope(module)}.`,
    source_ids: module.source_ids
  })),
  ...controlledIndividuals.map(([id, label, classId]) => ({
    id,
    label,
    class_id: classId,
    definition: controlledIndividualDefinition(label, classId),
    source_ids: ["eng-ont-go-annotations", "eng-ont-palantir-core-concepts"]
  }))
].sort((a, b) => a.id.localeCompare(b.id));

const axioms = [];
for (const plane of ontology.planes) {
  axioms.push({
    id: `AX_${plane.id.replace(/-/g, "_")}_term_resolution`,
    type: "coverage",
    statement: `Every term listed by ${plane.id} resolves to exactly one class in the ontology.`,
    source_ids: ["eng-ont-go-overview", "eng-ont-fibo-ontology-guide"]
  });
}
for (const module of moduleList) {
  axioms.push(
    {
      id: `AX_${module.id.replace(/-/g, "_")}_plane_membership`,
      type: "module-membership",
      statement: `Every class in ${module.id} belongs to ${module.plane_id}.`,
      source_ids: module.source_ids
    },
    {
      id: `AX_${module.id.replace(/-/g, "_")}_has_source`,
      type: "evidence",
      statement: `Every class in ${module.id} has at least one registered source identifier.`,
      source_ids: module.source_ids
    },
    {
      id: `AX_${module.id.replace(/-/g, "_")}_event_observable`,
      type: "observability",
      statement: `Runtime events modeled by ${module.id} must be observable or summarized; private hidden reasoning is not required.`,
      source_ids: ["lit-mech-compass", "eng-fw-openai-tracing"]
    }
  );
}
for (const prop of objectProperties) {
  axioms.push({
    id: `AX_${prop.id}_domain_range`,
    type: "domain-range",
    statement: `${prop.id} has domain ${prop.domain} and range ${prop.range}.`,
    source_ids: prop.source_ids
  });
}
for (const prop of dataProperties) {
  axioms.push({
    id: `AX_${prop.id}_datatype`,
    type: "datatype-range",
    statement: `${prop.id} has datatype range ${prop.range}.`,
    source_ids: prop.source_ids
  });
}
axioms.push(
  {
    id: "AX_no_metadata_terms_in_subject_terms",
    type: "scope",
    statement: "Ontology-engineering metadata classes are artifact metadata only and cannot be agent-system classes.",
    source_ids: ["eng-ont-fibo-ontology-guide", "eng-ont-palantir-core-concepts"]
  },
  {
    id: "AX_no_hidden_chain_of_thought_required",
    type: "privacy",
    statement: "The ontology supports observable summaries, traces, events, actions, and decisions without requiring hidden chain-of-thought text.",
    source_ids: ["lit-mech-compass", "eng-fw-openai-tracing", "lit-agent-safeagent"]
  },
  {
    id: "AX_adapter_terms_do_not_redefine_core",
    type: "adapter-boundary",
    statement: "Adapter mappings may reference core terms but cannot redefine their meaning.",
    source_ids: ["eng-proto-mcp-spec", "eng-proto-a2a-docs", "eng-ont-fibo-ontology-guide"]
  }
);

ontology.definition = "Canonical domain for the agent-system ontology family.";
ontology.source_ids = [...new Set(ontology.design_references.flatMap((reference) => reference.source_ids ?? []))].sort();
ontology.modules = moduleList.map((item) => attachDefinitions("module", item));
ontology.classes = classes.map((item) => attachDefinitions("class", item));
ontology.terms = ontology.classes;
ontology.object_properties = objectProperties.map((item) => attachDefinitions("object_property", item));
ontology.relations = ontology.object_properties;
ontology.data_properties = dataProperties.sort((a, b) => a.id.localeCompare(b.id)).map((item) => attachDefinitions("data_property", item));
ontology.individuals = individuals.map((item) => attachDefinitions("individual", item));
ontology.axioms = axioms.sort((a, b) => a.id.localeCompare(b.id)).map((item) => attachDefinitions("axiom", item));

for (const plane of ontology.planes) {
  const moduleClassIds = classes.filter((klass) => klass.plane_id === plane.id).map((klass) => klass.id);
  plane.module_ids = moduleList.filter((module) => module.plane_id === plane.id).map((module) => module.id).sort();
  plane.term_ids = [...new Set(moduleClassIds)].filter((id) => classById.has(id)).sort();
}
ontology.planes = ontology.planes.map((item) => attachDefinitions("plane", { ...item, source_ids: safeSourceIds(item.id, item.source_ids) }));
ontology.definitions = attachDefinitions("ontology", ontology).definitions;

ontology.ontology_metrics = {
  domains: 1,
  planes: ontology.planes.length,
  modules: ontology.modules.length,
  classes: ontology.classes.length,
  object_properties: ontology.object_properties.length,
  data_properties: ontology.data_properties.length,
  annotation_properties: 12,
  individuals: ontology.individuals.length,
  axioms: ontology.axioms.length,
  datatypes: 8,
  ontologies: ontology.planes.length + ontology.modules.length
};

ontology.hygiene_gates = [
  ...new Set([
    ...ontology.hygiene_gates,
    "every module has id, plane_id, label, definition, source_ids, and class_ids",
    "every class has id, kind, plane_id, module_id, label, definition, and source_ids",
    "every object property has id, family, label, definition, domain, range, and source_ids",
    "every data property has id, label, definition, domain, range, and source_ids",
    "every individual has id, label, class_id, definition, and source_ids",
    "every axiom has id, type, statement, and source_ids",
    "every ontology entity has canonical definitions.en, definitions.zh, and definitions.ja",
    "definition_domain_consistency_check",
    "definition_plane_leakage_check",
    "definition_language_alignment_check"
  ])
];

ontology.artifact_metadata = {
  ...ontology.artifact_metadata,
  non_subject_metadata_terms: [
    ...new Set([...(ontology.artifact_metadata.non_subject_metadata_terms ?? []), "OrchestrationPlane"])
  ]
};

fs.writeFileSync(ontologyPath, `${JSON.stringify(ontology, null, 2)}\n`);
