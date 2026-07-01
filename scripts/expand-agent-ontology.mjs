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
  "adapter-plane": ["eng-proto-mcp-spec", "eng-proto-a2a-docs", "eng-val-jsonschema-spec"]
};

const moduleSpecs = [
  {
    id: "runtime-system",
    plane_id: "runtime-plane",
    label: "Runtime System Module",
    definition: "models the agent system boundary, runtime identity, ownership, and global execution envelope",
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
    label: "Runtime Actors Module",
    definition: "models participants that act, observe, authorize, generate, retrieve, rank, or execute inside the runtime",
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
    label: "Runtime Observability Module",
    definition: "models transcripts, trace events, snapshots, checkpoints, and observable audit records",
    class_ids: ["AgentTranscript", "TraceEvent", "StateSnapshot", "Checkpoint", "CommandExecution"],
    generated: [
      ["TraceSpan", "trace span"],
      ["TraceLink", "trace link"],
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
    label: "Runtime Artifacts Module",
    definition: "models artifacts and deliverables produced or consumed by runtime sessions",
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
    class_ids: ["OrchestrationPlane", "Task", "TaskDistribution"],
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
    label: "Actors And Delegation Module",
    definition: "models orchestrators, workers, subagents, handoffs, and responsibility transfer",
    class_ids: ["Orchestrator", "WorkerAgent", "Subagent", "Handoff"],
    generated: [
      ["DelegationEvent", "delegation event"],
      ["DelegationContract", "delegation contract"],
      ["WorkerPool", "worker pool"],
      ["SubagentRole", "subagent role"],
      ["SubagentContext", "subagent context"],
      ["HandoffTarget", "handoff target"],
      ["ResponsibilityTransfer", "responsibility transfer"],
      ["DelegationResult", "delegation result"]
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
      ["SynthesisOutput", "synthesis output"]
    ]
  },
  {
    id: "orchestration-evaluation",
    plane_id: "orchestration-plane",
    label: "Evaluation Loop Module",
    definition: "models evaluator-optimizer loops, review events, feedback events, and think-as-tool operations",
    class_ids: ["EvaluatorOptimizer", "ThinkAsTool", "ReviewEvent", "FeedbackEvent"],
    generated: [
      ["EvaluationCriterion", "evaluation criterion"],
      ["CritiqueArtifact", "critique artifact"],
      ["RevisionPlan", "revision plan"],
      ["ImprovementAttempt", "improvement attempt"],
      ["OptimizerState", "optimizer state"],
      ["ReflectionRecord", "reflection record"],
      ["FeedbackRouting", "feedback routing"],
      ["ReviewAssignment", "review assignment"]
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
    definition: "models trust boundaries, authority scopes, data zones, and boundary crossings",
    class_ids: ["SafetyPlane", "TrustBoundary"],
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
    definition: "models permission prompts, policy rules, decisions, and authorization outcomes",
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
    definition: "models sandboxing, sockets, proxies, network calls, and controlled execution paths",
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
    definition: "models pattern scans, injection signatures, tool-stream risks, and malicious instruction propagation",
    class_ids: ["PatternScan", "InjectionSignature"],
    generated: [
      ["PromptInjectionSignal", "prompt injection signal"],
      ["IndirectInjectionSignal", "indirect injection signal"],
      ["ToolStreamInjectionSignal", "tool stream injection signal"],
      ["MaliciousToolOutput", "malicious tool output"],
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
    definition: "models commit gates, redaction, disclosure filtering, and side-effect approval",
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
    class_ids: ["Metric", "EvaluationRun"],
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
    definition: "models protocol mappings for MCP, A2A, FIPA, KQML, and related message/capability protocols",
    class_ids: ["AdapterPlane", "ProtocolAdapter"],
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
    definition: "models framework mappings for graph runtimes, agent SDKs, crews, workflows, and subagent systems",
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
    id: "adapter-benchmarks-statecharts",
    plane_id: "adapter-plane",
    label: "Benchmark And Statechart Adapter Module",
    definition: "models benchmark, statechart, and schema/export mappings",
    class_ids: ["BenchmarkAdapter", "StatechartAdapter", "SchemaAdapter", "MappingRule", "ConversionWarning"],
    generated: [
      ["SWEBenchAdapter", "SWE-bench adapter"],
      ["OSWorldAdapter", "OSWorld adapter"],
      ["Tau2Adapter", "tau2 adapter"],
      ["AppWorldAdapter", "AppWorld adapter"],
      ["TerminalBenchAdapter", "Terminal-Bench adapter"],
      ["AgencyBenchAdapter", "AgencyBench adapter"],
      ["XStateAdapter", "XState adapter"],
      ["SCXMLAdapter", "SCXML adapter"]
    ]
  },
  {
    id: "adapter-schema-export",
    plane_id: "adapter-plane",
    label: "Schema And Export Adapter Module",
    definition: "models structural schema, semantic graph, and language profile mappings",
    class_ids: [],
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
    "defines the authorization envelope for an actor, tool, service, or runtime by naming the permissions, operations, resources, and limits it may exercise."
  ],
  [
    "DataZone",
    "groups data by trust, visibility, retention, and handling policy so that context, memory, tool output, and artifacts can carry boundary-aware controls."
  ],
  [
    "BoundaryCrossing",
    "captures a transfer of control, data, artifacts, or authority that crosses a trust boundary and therefore requires provenance, policy, and audit context."
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
    "marks the opacity, identity, authority, and accountability boundary created when work is delegated to a remote agent."
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
    "AutomatedReview",
    "records a machine-produced review pass over a task, output, plan, trace, or artifact, including findings and confidence."
  ],
  [
    "HumanReview",
    "records review evidence supplied by a human actor, including approval, requested changes, blocking concerns, or quality judgment."
  ],
  [
    "ReviewAssignment",
    "assigns a review responsibility to an actor, evaluator, or policy gate and states the artifact or decision being reviewed."
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
  ]
]);

const removedClassIds = new Set(["InfoPlane", "UserAgentMessage", "ToolMessage"]);
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
  ["ToolResultObservation", ownership("tool-plane", ["runtime-plane", "info-plane"], "may be converted into a tool observation message or context input")]
]);

ontology.planes = ontology.planes.map((plane) => ({ ...plane, ...(planeDefinitionOverrides.get(plane.id) ?? {}) }));

const classById = new Map(ontology.terms.filter((term) => !removedClassIds.has(term.id)).map((term) => [term.id, { ...term }]));
const generatedClassIds = new Set(moduleSpecs.flatMap((module) => module.generated.map(([id]) => id)));
const generatedKindOverrides = new Map([
  ["RuntimeSession", "object_type"],
  ["RuntimeEnvironment", "object_type"],
  ["RuntimeBudget", "policy_type"]
]);
const classKindOverrides = new Map([
  ["RuntimeSession", "object_type"],
  ["RuntimeEnvironment", "object_type"],
  ["RuntimeBudget", "policy_type"]
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
  ["invokes", "invokes", "tool_flow", "event_type", "object_type", false],
  ["returns", "returns", "tool_flow", "event_type", "resource_type", false],
  ["retrieves", "retrieves", "memory_flow", "event_type", "resource_type", false],
  ["ranks", "ranks", "memory_flow", "event_type", "resource_type", false],
  ["summarizes", "summarizes", "memory_flow", "event_type", "resource_type", false],
  ["indexes", "indexes", "information_flow", "index_type", "resource_type", false],
  ["maps_to", "maps to", "adapter_mapping", "adapter_type", "any", false],
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
  ["crosses_trust_boundary", "crosses trust boundary", "trust_boundary", "SourceReference", "TrustBoundaryReference", false],
  ["belongs_to_data_zone", "belongs to data zone", "trust_boundary", "SourceReference", "DataZoneReference", false],
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
const existingRelations = ontology.relations.filter((relation) => !regeneratedModulePropertyIds.has(relation.id)).map((relation) => ({
  id: relation.id,
  label: relation.label,
  family: relation.family,
  definition: relation.definition,
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
  ["authorizes", "links a permission or policy decision to the event it allows to proceed."],
  ["blocks", "links a permission or policy decision to the event it prevents from executing."],
  ["escalates", "links a safety, review, or runtime event to a higher-authority decision path."],
  ["delegates", "links an actor or orchestrator to the agent, worker, or remote participant receiving responsibility."],
  ["routes", "links a routing event to the downstream branch, handler, or operation selected for execution."],
  ["invokes", "links an action event to the tool, function, service, or execution surface being called."],
  ["returns", "links a tool or action event to the result, error, artifact, or warning returned to the runtime."],
  ["retrieves", "links a retrieval event to the memory record, source chunk, or indexed resource it returns."],
  ["ranks", "links a ranking event to the candidate set, result list, or scored resource it orders."],
  ["summarizes", "links a compression or synthesis event to the shorter context, disclosure, or artifact it creates."],
  ["indexes", "links an indexing process to the resource, chunk, vector, key, or pointer made searchable."],
  ["maps_to", "links an adapter term to the external protocol, framework, benchmark, or export construct it represents."],
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
  ["crosses_trust_boundary", "links a source or context artifact to the trust boundary crossed by its retrieval, transport, disclosure, or execution path."],
  ["belongs_to_data_zone", "links a source or context artifact to the data zone governing its visibility, retention, and allowed use."],
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
for (const [id, label, family, domain, range, acyclic] of objectPropertySeeds) {
  generatedObjectProperties.push({
    id,
    label,
    family,
    definition: objectPropertyDefinitions.get(id),
    domain,
    range,
    acyclic,
    source_ids: ["eng-ont-go-overview", "eng-ont-cidoc-crm", "eng-ont-palantir-core-concepts"]
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
  const definitions = {
    Status: `status value "${label}" used to classify the lifecycle position of sessions, runs, tasks, tools, or validation gates.`,
    DecisionKind: `decision outcome "${label}" used by permission, policy, safety, or review flows.`,
    RiskLevel: `risk level "${label}" used to rank safety, protocol, tool, network, or data-boundary exposure.`,
    TransportKind: `transport option "${label}" used by protocol endpoints, streaming channels, and tool/resource exchange surfaces.`,
    Visibility: `visibility value "${label}" used to scope whether an artifact, trace, memory item, or disclosure is public, user-visible, session-bound, or private.`,
    AdapterFamily: `adapter family "${label}" used to map an external protocol, framework, benchmark, or runtime profile without redefining ontology core.`
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

fs.writeFileSync(ontologyPath, `${JSON.stringify(ontology, null, 2)}\n`);
