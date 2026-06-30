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
const generatedClassDefinition = (module) =>
  `agent-system class governed by its assigned module in ${module.plane_id}; the module record defines scope, source evidence, and downstream constraints`;

const classById = new Map(ontology.terms.map((term) => [term.id, { ...term }]));
const generatedClassIds = new Set(moduleSpecs.flatMap((module) => module.generated.map(([id]) => id)));

const idToSourceIds = (id, planeId) => classById.get(id)?.source_ids ?? safeSourceIds(planeId);

for (const module of moduleSpecs) {
  for (const [id, label] of module.generated) {
    const generatedPayload = {
      id,
      kind: label.includes("adapter") ? "adapter_type" : label.includes("policy") || label.includes("rule") || label.includes("condition") ? "policy_type" : label.includes("event") || label.includes("run") || label.includes("call") || label.includes("review") || label.includes("execution") || label.includes("decision") ? "event_type" : label.includes("actor") || label.includes("agent") || label.includes("model") ? "actor_type" : label.includes("index") || label.includes("vector") ? "index_type" : label.includes("command") || label.includes("action") ? "action_type" : "resource_type",
      plane_id: module.plane_id,
      module_id: module.id,
      label,
      definition: generatedClassDefinition(module),
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
for (const [id, label, family, domain, range, acyclic] of objectPropertySeeds) {
  generatedObjectProperties.push({
    id,
    label,
    family,
    definition: `object property for ${label} links between agent-system classes`,
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
      definition: `object property linking the ${module.label} to classes it contains`,
      domain: module.id,
      range: first,
      acyclic: true,
      source_ids: module.source_ids
    },
    {
      id: `${modulePrefix}_relates`,
      label: `${module.label.toLowerCase()} relates`,
      family: "module_relation",
      definition: `object property linking two classes governed by the ${module.label}`,
      domain: first,
      range: second,
      acyclic: false,
      source_ids: module.source_ids
    },
    {
      id: `${modulePrefix}_emits_event`,
      label: `${module.label.toLowerCase()} emits event`,
      family: "module_event",
      definition: `object property linking ${module.label} operations to observable events`,
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
  dataProperties.push({
    id,
    label,
    definition: `data property for recording ${label.replace("has ", "")} values on agent-system resources, events, and policies`,
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
      definition: `data property recording operational state for the ${module.label}`,
      domain: module.id,
      range: "string",
      source_ids: module.source_ids
    },
    {
      id: `${prefix}_has_evidence_strength`,
      label: `${module.label.toLowerCase()} has evidence strength`,
      definition: `data property recording evidence strength for claims in the ${module.label}`,
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

const individuals = [
  ...ontology.planes.map((plane) => ({
    id: `Individual_${plane.id.replace(/-/g, "_")}`,
    label: plane.label,
    class_id: "PlaneIndividual",
    definition: `controlled individual representing the ${plane.label}`,
    source_ids: ["eng-ont-go-overview", "eng-ont-palantir-core-concepts"]
  })),
  ...moduleList.map((module) => ({
    id: `Individual_${module.id.replace(/-/g, "_")}`,
    label: module.label,
    class_id: "ModuleIndividual",
    definition: `controlled individual representing the ${module.label}`,
    source_ids: module.source_ids
  })),
  ...controlledIndividuals.map(([id, label, classId]) => ({
    id,
    label,
    class_id: classId,
    definition: `controlled vocabulary individual for ${classId}`,
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
