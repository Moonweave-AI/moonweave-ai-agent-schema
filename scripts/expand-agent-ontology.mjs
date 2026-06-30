import fs from "node:fs";

const ontologyPath = "ontology/agent-ontology.json";
const ontology = JSON.parse(fs.readFileSync(ontologyPath, "utf8"));

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
    class_ids: ["AgentSystem", "RuntimeSession", "RuntimeBudget"],
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
    class_ids: ["AgentTranscript", "TraceEvent", "StateSnapshot", "Checkpoint"],
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
    label: "Container And Command Module",
    definition: "models command areas, execution containers, shell commands, process output, and command lifecycle",
    class_ids: ["InfoPlane", "Container", "CommandArea", "Command", "CommandExecution"],
    generated: [
      ["ShellCommand", "shell command"],
      ["CommandArgument", "command argument"],
      ["CommandExitStatus", "command exit status"],
      ["StandardOutput", "standard output"],
      ["StandardError", "standard error"],
      ["ProcessHandle", "process handle"],
      ["WorkingDirectory", "working directory"],
      ["EnvironmentVariable", "environment variable"]
    ]
  },
  {
    id: "info-output-disclosure",
    plane_id: "info-plane",
    label: "Output And Disclosure Module",
    definition: "models output chunking, visible windows, compression, progressive disclosure, and display policy",
    class_ids: ["OutputChunk", "OutputWindow", "ProgressiveDisclosure", "LightIndex"],
    generated: [
      ["OutputStream", "output stream"],
      ["OutputSegment", "output segment"],
      ["HeadTailWindow", "head tail window"],
      ["LengthLimit", "length limit"],
      ["DisclosureStage", "disclosure stage"],
      ["DisclosureRule", "disclosure rule"],
      ["SuppressedOutput", "suppressed output"],
      ["OutputCitation", "output citation"]
    ]
  },
  {
    id: "info-storage-sources",
    plane_id: "info-plane",
    label: "Storage And Sources Module",
    definition: "models files, databases, graphs, text corpora, network resources, and resource metadata",
    class_ids: ["StorageArea", "Resource", "FileSystem", "Database", "GraphStore", "TextCorpus", "NetworkResource"],
    generated: [
      ["FileResource", "file resource"],
      ["DirectoryResource", "directory resource"],
      ["DatabaseTable", "database table"],
      ["DatabaseRow", "database row"],
      ["GraphNode", "graph node"],
      ["GraphEdge", "graph edge"],
      ["TextDocument", "text document"],
      ["ResourceDescriptor", "resource descriptor"]
    ]
  },
  {
    id: "info-messages-instructions",
    plane_id: "info-plane",
    label: "Messages And Instructions Module",
    definition: "models messages, conversations, histories, instructions, system prompts, and demonstrations",
    class_ids: ["Message", "Conversation", "MessageHistory", "UserAgentMessage", "Instruction", "SystemPrompt", "FewShotExample"],
    generated: [
      ["AssistantMessage", "assistant message"],
      ["ToolMessage", "tool message"],
      ["SystemMessage", "system message"],
      ["ConversationTurn", "conversation turn"],
      ["InstructionPriority", "instruction priority"],
      ["InstructionScope", "instruction scope"],
      ["PromptVariable", "prompt variable"],
      ["PromptTemplateInstance", "prompt template instance"]
    ]
  },
  {
    id: "info-indexing",
    plane_id: "info-plane",
    label: "Information Indexing Module",
    definition: "models indexes, embeddings, lookup structures, and lightweight discovery surfaces",
    class_ids: ["Embedding", "LightIndex"],
    generated: [
      ["IndexEntry", "index entry"],
      ["IndexKey", "index key"],
      ["IndexPointer", "index pointer"],
      ["IndexRefreshEvent", "index refresh event"],
      ["SearchResult", "search result"],
      ["SearchScore", "search score"],
      ["TextEmbedding", "text embedding"],
      ["GraphEmbedding", "graph embedding"]
    ]
  },
  {
    id: "memory-ingestion",
    plane_id: "memory-plane",
    label: "Memory Ingestion Module",
    definition: "models source loading, memory files, document preparation, and ingestion events",
    class_ids: ["MemoryPlane", "MemoryStore", "MemoryFile", "Document"],
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
    class_ids: ["VectorDatabase", "VectorIndex", "TfIdfIndex"],
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
    class_ids: ["ToolCall", "ToolResult", "ExecutionRequest", "ExecutionResult", "ProgrammaticToolCall", "ToolTranscript"],
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
    class_ids: ["Sandbox", "SandboxCommand", "NetworkCall", "DomainSocket", "Socket", "Proxy", "SOCKSProxy", "HTTPProxy"],
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
    class_ids: ["CommitGate", "Redaction"],
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

const exactGeneratedClassDefinitions = new Map([
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

const classById = new Map(ontology.terms.map((term) => [term.id, { ...term }]));
const generatedClassIds = new Set(moduleSpecs.flatMap((module) => module.generated.map(([id]) => id)));

const idToSourceIds = (id, planeId) => classById.get(id)?.source_ids ?? safeSourceIds(planeId);

for (const module of moduleSpecs) {
  for (const [id, label] of module.generated) {
    const kind = label.includes("adapter") ? "adapter_type" : label.includes("policy") || label.includes("rule") || label.includes("condition") ? "policy_type" : label.includes("event") || label.includes("run") || label.includes("call") || label.includes("review") || label.includes("execution") || label.includes("decision") ? "event_type" : label.includes("actor") || label.includes("agent") || label.includes("model") ? "actor_type" : label.includes("index") || label.includes("vector") ? "index_type" : label.includes("command") || label.includes("action") ? "action_type" : "resource_type";
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
      classById.set(id, { ...classById.get(id), module_id: module.id });
    }
  }
  for (const id of module.class_ids) {
    if (classById.has(id)) {
      classById.set(id, { ...classById.get(id), module_id: module.id });
    }
  }
}

const classes = [...classById.values()].sort((a, b) => a.id.localeCompare(b.id));

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
  ["maps_to", "maps to", "adapter_mapping", "adapter_type", "any", false]
];

const existingRelations = ontology.relations.map((relation) => ({
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
  ["maps_to", "links an adapter term to the external protocol, framework, benchmark, or export construct it represents."]
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
  generatedObjectProperties.push(
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

ontology.modules = moduleList;
ontology.classes = classes;
ontology.terms = classes;
ontology.object_properties = objectProperties;
ontology.relations = objectProperties;
ontology.data_properties = dataProperties.sort((a, b) => a.id.localeCompare(b.id));
ontology.individuals = individuals;
ontology.axioms = axioms.sort((a, b) => a.id.localeCompare(b.id));

for (const plane of ontology.planes) {
  const moduleClassIds = moduleList
    .filter((module) => module.plane_id === plane.id)
    .flatMap((module) => module.class_ids);
  plane.module_ids = moduleList.filter((module) => module.plane_id === plane.id).map((module) => module.id).sort();
  plane.term_ids = [...new Set([...plane.term_ids, ...moduleClassIds])].filter((id) => classById.has(id)).sort();
}

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
    "every axiom has id, type, statement, and source_ids"
  ])
];

fs.writeFileSync(ontologyPath, `${JSON.stringify(ontology, null, 2)}\n`);
