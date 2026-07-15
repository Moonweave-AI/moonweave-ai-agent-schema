const localized = (zh, en, ja) => Object.freeze({ zh, en, ja });

const applicable = (
  familyConceptIds,
  relationIds,
  sharedRelationRationales = {},
) => Object.freeze({
  applicable: true,
  family_concept_ids: Object.freeze([...familyConceptIds]),
  relation_ids: Object.freeze([...relationIds]),
  shared_relation_rationales: Object.freeze({ ...sharedRelationRationales }),
});

const notApplicable = Object.freeze({
  applicable: false,
  family_concept_ids: Object.freeze([]),
  relation_ids: Object.freeze([]),
  shared_relation_rationales: Object.freeze({}),
});

const contract = (
  applicability,
  representativeRelationId,
  input,
  output,
  failure = notApplicable,
  recovery = notApplicable,
  responsibilityBoundary = null,
) => Object.freeze({
  applicability,
  representative_relation_id: representativeRelationId,
  responsibility_boundary: responsibilityBoundary,
  facets: Object.freeze({ input, output, failure, recovery }),
});

const descriptive = (representativeRelationId, responsibilityBoundary) =>
  contract(
    "descriptive",
    representativeRelationId,
    notApplicable,
    notApplicable,
    notApplicable,
    notApplicable,
    responsibilityBoundary,
  );

const mappingBoundary = (kindZh, kindEn, kindJa) => localized(
  `本体只表达${kindZh}到 canonical 概念的对应；投影执行、映射应用及其失败恢复由“模式导出”和“映射规则与验证”承接。`,
  `This ontology only states correspondences from ${kindEn} to canonical concepts; schema export and mapping validation own projection execution, mapping application, failures, and recovery.`,
  `このオントロジーは${kindJa}から canonical 概念への対応だけを表します。投影実行、写像適用、失敗、回復は「スキーマ出力」と「写像規則・検証」が担います。`,
);

/**
 * Reviewed interaction contracts. Every applicable facet names the exact concept
 * families and accepted canonical facts that establish the responsibility handoff.
 * Nothing is inferred from relation order or from a predicate-name heuristic.
 */
export const ONTOLOGY_V3_INTERACTION_CONTRACTS = Object.freeze({
  "adapter-benchmarks": descriptive(
    "BenchmarkAdapter-maps_action_to-ToolCallAttempt",
    mappingBoundary("基准语义", "benchmark semantics", "ベンチマーク意味論"),
  ),
  "adapter-frameworks": descriptive(
    "FrameworkAdapter-maps_tool_to-Tool",
    mappingBoundary("框架语义", "framework semantics", "フレームワーク意味論"),
  ),
  "adapter-mapping-infrastructure": contract(
    "mixed",
    "MappingRule-specifies-MappingArtifact",
    applicable(
      ["MappingRule"],
      ["MappingRule-specifies-MappingArtifact"],
      {
        "MappingRule-specifies-MappingArtifact": localized(
          "在输入面，该事实以 MappingRule 端点标明供适配与验证读取的规范，不把 MappingArtifact 误当成已经执行完成的产物。",
          "On the input facet, this fact uses the MappingRule endpoint to identify the specification read by adaptation and validation; it does not claim that a MappingArtifact has already been produced by execution.",
          "入力面では、この事実の MappingRule 端点が適応・検証で読み取る仕様を示し、MappingArtifact が実行済み成果物であるとは主張しません。",
        ),
      },
    ),
    applicable(
      ["MappingArtifact"],
      ["MappingRule-specifies-MappingArtifact"],
      {
        "MappingRule-specifies-MappingArtifact": localized(
          "在输出面，该事实以 MappingArtifact 端点标明规则所规定的可交付信息形态；这里表达规范交接，而非虚构一个投影执行活动。",
          "On the output facet, this fact uses the MappingArtifact endpoint to identify the deliverable information form specified by the rule; it expresses a specification handoff, not an invented projection activity.",
          "出力面では、この事実の MappingArtifact 端点が規則で定められた引渡し可能な情報形態を示します。これは仕様の受け渡しであり、架空の投影実行活動ではありません。",
        ),
      },
    ),
    applicable(["ConversionWarning"], ["MappingTestResult-reports-ConversionWarning"]),
  ),
  "adapter-protocols": descriptive(
    "maps_protocol_capability_to_canonical_capability",
    mappingBoundary("协议语义", "protocol semantics", "プロトコル意味論"),
  ),
  "adapter-schema-export": contract(
    "mixed",
    "SchemaProjectionRun-produces-SchemaArtifact",
    applicable(
      ["ProjectionAdapter", "MappingRule", "Tool"],
      [
        "SchemaProjectionRun-uses-ProjectionAdapter",
        "SchemaProjectionRun-applies-MappingRule",
        "SchemaProjectionRun-projects-Tool",
      ],
    ),
    applicable(["SchemaArtifact"], ["SchemaProjectionRun-produces-SchemaArtifact"]),
  ),
  "adapter-statecharts": descriptive(
    "StatechartAdapter-maps_action_to-Command",
    mappingBoundary("状态图语义", "statechart semantics", "ステートチャート意味論"),
  ),

  "feedback-logging": contract(
    "operational",
    "ErrorListener-observes-ErrorEvent",
    applicable(
      ["TelemetryEvent", "LogStream", "TraceRecord"],
      ["EventSink-receives-TelemetryEvent", "LogConsumer-consumes-LogStream", "TraceExportActivity-consumes-TraceRecord"],
    ),
    applicable(
      ["ToolTranscript", "TelemetryExportBatch", "TraceExport"],
      ["ToolTranscript-records-ToolCallAttempt", "TelemetryExportActivity-produces-TelemetryExportBatch", "TraceExportActivity-produces-TraceExport"],
    ),
    applicable(["ErrorEvent", "ErrorListener"], ["ErrorListener-observes-ErrorEvent", "LogListener-routes_failure_to-ErrorListener"]),
    applicable(["RecoveryAction"], ["ErrorListener-triggers-RecoveryAction"]),
  ),
  "feedback-metrics-evaluation": contract(
    "operational",
    "EvaluationRun-uses-EvaluationSpecification",
    applicable(["EvaluationSpecification", "ToolResult"], ["EvaluationRun-uses-EvaluationSpecification", "EvaluationRun-evaluates-ToolResult"]),
    applicable(["Feedback", "Measurement"], ["EvaluationRun-produces-Feedback", "EvaluationRun-produces-Measurement", "Measurement-conforms_to-Metric"]),
    notApplicable,
    applicable(["Correction"], ["Score-may_trigger-Correction"]),
  ),
  "feedback-optimization-learning": contract(
    "operational",
    "OptimizationLoop-consumes-LearningSignal",
    applicable(["LearningSignal", "Metric", "Measurement"], ["OptimizationLoop-consumes-LearningSignal", "OptimizationLoop-uses-Metric", "OptimizationLoop-consumes-Measurement"]),
    applicable(["ChangeProposal"], ["OptimizationLoop-produces-ChangeProposal"]),
    notApplicable,
    applicable(["CorrectionActivity"], ["ChangeProposal-guides-CorrectionActivity"]),
  ),
  "feedback-review-optimization": contract(
    "operational",
    "ReviewActivity-evaluates-OptimizationTarget",
    applicable(["OptimizationTarget"], ["ReviewActivity-evaluates-OptimizationTarget"]),
    applicable(
      ["Review", "ReviewFinding", "CritiqueArtifact", "ReviewEvent"],
      ["ReviewActivity-produces-Review", "ReviewActivity-produces-ReviewFinding", "ReviewActivity-produces-CritiqueArtifact", "ReviewActivity-produces-ReviewEvent"],
    ),
    notApplicable,
    applicable(["Correction", "CorrectionActivity", "EvaluationRun"], ["Feedback-motivates-Correction", "ChangeProposal-guides-CorrectionActivity", "CorrectionActivity-followed_by-EvaluationRun"]),
  ),
  "feedback-warning-error": contract(
    "mixed",
    "ErrorEvent-emits-DiagnosticMessage",
    applicable(
      ["ErrorEvent", "WarningEvent"],
      ["ErrorEvent-classified_by-FailureMode", "WarningEvent-raises-Warning"],
      {
        "ErrorEvent-classified_by-FailureMode": localized(
          "在输入面，该事实以 ErrorEvent 端点标明等待诊断分类的观测事件；FailureMode 尚不是另一次输入。",
          "On the input facet, this fact uses the ErrorEvent endpoint to identify an observed event awaiting diagnostic classification; FailureMode is not treated as a second input.",
          "入力面では、この事実の ErrorEvent 端点が診断分類を待つ観測イベントを示し、FailureMode を別の入力とは扱いません。",
        ),
        "WarningEvent-raises-Warning": localized(
          "在输入面，该事实以 WarningEvent 端点标明触发解释的事件；它与随后形成的 Warning 信息记录保持身份分离。",
          "On the input facet, this fact uses the WarningEvent endpoint to identify the event that triggers interpretation while keeping it distinct from the resulting Warning information record.",
          "入力面では、この事実の WarningEvent 端点が解釈を起動するイベントを示し、後に形成される Warning 情報記録とは同一視しません。",
        ),
      },
    ),
    applicable(
      ["DiagnosticMessage", "Warning"],
      ["ErrorEvent-emits-DiagnosticMessage", "WarningEvent-raises-Warning"],
      {
        "WarningEvent-raises-Warning": localized(
          "在输出面，同一事实以 Warning 端点标明可被日志、审查或策略消费的诊断信息，而不是再次把 WarningEvent 当作输出。",
          "On the output facet, the same fact uses the Warning endpoint to identify diagnostic information consumable by logging, review, or policy, rather than treating WarningEvent itself as the output.",
          "出力面では、同じ事実の Warning 端点がログ、レビュー、方針で利用できる診断情報を示し、WarningEvent 自体を出力とは扱いません。",
        ),
      },
    ),
    applicable(
      ["BlockingError", "FailureMode"],
      ["blocking_error_blocks_run_attempt", "ErrorEvent-classified_by-FailureMode"],
      {
        "ErrorEvent-classified_by-FailureMode": localized(
          "在失败面，同一事实以 FailureMode 端点表达对 ErrorEvent 的失败判定；只有分类结果而非事件共现决定失败语义。",
          "On the failure facet, the same fact uses the FailureMode endpoint to express adjudication of the ErrorEvent; the classification, not event co-occurrence, determines failure semantics.",
          "失敗面では、同じ事実の FailureMode 端点が ErrorEvent の失敗判定を表し、イベントの共起ではなく分類結果が失敗意味を決めます。",
        ),
      },
    ),
    applicable(["RecoveryPlan"], ["retryable_error_triggers_recovery_plan"]),
  ),

  "info-container-command": contract(
    "operational",
    "ExecutionObservation-observes-ExecutionResult",
    applicable(["ExecutionResult", "TraceEvent"], ["ExecutionObservation-observes-ExecutionResult", "derived_from_trace_event"]),
    applicable(["CommandOutputObservation", "ContextPackage"], ["ContextIngressEvent-makes_available-CommandOutputObservation", "ingested_into_context"]),
    applicable(["StandardErrorChunk"], ["has_stderr_chunk"]),
  ),
  "info-content-block-modality": descriptive(
    "ContentBlock-located_at_source_span-SourceSpan",
    localized(
      "本体只定义内容块的值、模态与内部表示；读取、摄入、分块和处理失败由“记忆摄入”与“分块和语境化”承接。",
      "This ontology only defines content-block values, modalities, and internal representation; memory ingestion and chunking own reading, ingestion, processing, failures, and recovery.",
      "このオントロジーは内容ブロックの値、モダリティ、内部表現だけを定義します。読取り、取込み、分割、処理失敗、回復は「記憶取込み」と「チャンク化・文脈化」が担います。",
    ),
  ),
  "info-indexing": contract(
    "operational",
    "DiscoveryActivity-uses-LightIndex",
    applicable(["LightIndex"], ["DiscoveryActivity-uses-LightIndex"]),
    applicable(["DiscoveryResult", "LightweightRetrievalTrace"], ["DiscoveryActivity-produces-DiscoveryResult", "LightweightRetrievalTrace-records-DiscoveryResult"]),
  ),
  "info-messages-instructions": contract(
    "mixed",
    "Message-carries_instruction-Instruction",
    applicable(["Message"], ["ProtocolEnvelope-wraps-Message", "ConversationTurn-contains_message-Message"]),
    applicable(["Instruction", "ContentBlock"], ["Message-carries_instruction-Instruction", "Message-contains_content_block-ContentBlock"]),
  ),
  "info-output-disclosure": contract(
    "operational",
    "DisclosureActivity-produces-DisclosureRecord",
    applicable(["OutputSegment", "VisibleContextWindow"], ["DisclosureRecord-references-OutputSegment", "ContextSelectionDecision-selects_from-VisibleContextWindow"]),
    applicable(["DisclosureRecord", "DisclosedOutputSegment"], ["DisclosureActivity-produces-DisclosureRecord", "DisclosurePublicationActivity-produces-DisclosedOutputSegment"]),
    applicable(["DisclosureSuppressionActivity", "SuppressedContext"], ["DisclosureSuppressionActivity-suppresses-SuppressedContext"]),
  ),
  "info-prompts-instructions": contract(
    "operational",
    "InstructionParsingActivity-consumes-PromptTemplateInstance",
    applicable(["PromptTemplateInstance"], ["InstructionParsingActivity-consumes-PromptTemplateInstance"]),
    applicable(["Instruction", "InstructionResolution"], ["InstructionParsingActivity-produces-Instruction", "InstructionResolutionActivity-produces-InstructionResolution", "InstructionResolution-records_effective-Instruction"]),
    applicable(["InstructionConflict"], ["InstructionConflictDetectionActivity-detects-InstructionConflict"]),
    applicable(["InstructionResolutionActivity"], ["InstructionResolutionActivity-resolves-InstructionConflict"]),
  ),
  "info-storage-sources": descriptive(
    "SourceReference-located_at-SourceLocation",
    localized(
      "本体只定义来源身份、定位与引用；资源读取和摄入由“记忆摄入”承接，后续查找由“检索与排序”承接。",
      "This ontology only defines source identity, location, and citation; memory ingestion owns resource reads and ingestion, while retrieval and ranking own subsequent lookup.",
      "このオントロジーは出典の同一性、位置、参照だけを定義します。資源の読取りと取込みは「記憶取込み」、後続検索は「検索・順位付け」が担います。",
    ),
  ),

  "memory-chunking-situating": contract(
    "operational",
    "ChunkingRun-consumes-Document",
    applicable(["Document", "Chunk"], ["ChunkingRun-consumes-Document", "SituatingPromptRun-consumes-Chunk"]),
    applicable(["Chunk", "SituatedChunk"], ["ChunkingRun-produces-Chunk", "SituatingPromptRun-produces-SituatedChunk"]),
  ),
  "memory-context": contract(
    "operational",
    "ContextAssembly-consumes-MemoryRecord",
    applicable(["MemoryRecord", "RetrievedChunk", "DiscoveryResult"], ["ContextAssembly-consumes-MemoryRecord", "ContextAssembly-consumes-RetrievedChunk", "ContextAssembly-consumes-DiscoveryResult"]),
    applicable(["ContextPackage", "ContextWindow", "ContextExclusion"], ["ContextAssembly-produces-ContextPackage", "ContextAssembly-produces-ContextWindow", "ContextAssembly-records-ContextExclusion"]),
  ),
  "memory-embedding-indexes": contract(
    "operational",
    "EmbeddingRun-uses-EmbeddingModel",
    applicable(["EmbeddingModel", "Representation"], ["EmbeddingRun-uses-EmbeddingModel", "IndexBuildRun-consumes-Representation"]),
    applicable(["EmbeddingVector", "IndexVersion"], ["EmbeddingRun-produces-EmbeddingVector", "IndexBuildRun-produces-IndexVersion"]),
  ),
  "memory-ingestion": contract(
    "operational",
    "IngestionRun-reads-IngestibleResource",
    applicable(["IngestibleResource", "DocumentLoader", "IngestibleInformation"], ["IngestionRun-reads-IngestibleResource", "IngestionRun-uses-DocumentLoader", "NormalizationActivity-consumes-IngestibleInformation"]),
    applicable(["Document", "DocumentMetadata", "MemoryRecord"], ["IngestionRun-produces-Document", "IngestionRun-produces-DocumentMetadata", "IngestionRun-writes-MemoryRecord"]),
    applicable(["ErrorEvent"], ["IngestionRun-may_emit-ErrorEvent"]),
  ),
  "memory-lifecycle": contract(
    "operational",
    "MemoryOperation-acts_on-MemoryRecord",
    applicable(["MemoryRecord", "Feedback"], ["MemoryOperation-acts_on-MemoryRecord", "MemoryValidation-evaluates-MemoryRecord", "MemoryWrite-responds_to-Feedback"]),
    applicable(["MemoryOperationResult", "MemoryRecord", "MemoryTombstone"], ["MemoryOperation-produces-MemoryOperationResult", "MemoryWrite-produces-MemoryRecord", "MemoryDelete-produces-MemoryTombstone"]),
    applicable(["ErrorEvent", "MemoryConflict"], ["MemoryOperationResult-records-ErrorEvent", "memory_conflict_flags_record"]),
    applicable(["MemoryConsolidation"], ["MemoryConflict-resolved_by-MemoryConsolidation"]),
  ),
  "memory-retrieval-ranking": contract(
    "operational",
    "RetrievalRun-reads-IndexVersion",
    applicable(["IndexVersion"], ["RetrievalRun-reads-IndexVersion"]),
    applicable(["CandidateSet", "RetrievalResult"], ["RetrievalRun-produces-CandidateSet", "RetrievalRun-produces-RetrievalResult"]),
  ),
  "memory-stores-scopes": descriptive(
    "MemoryEntity-stored_in-MemoryStore",
    localized(
      "本体只定义记忆实体、存储身份与作用域；写入、变更和删除由“记忆生命周期”承接，读取与排序由“检索与排序”承接。",
      "This ontology only defines memory entities, store identity, and scope; memory lifecycle owns writes, changes, and deletion, while retrieval and ranking own reads and ranking.",
      "このオントロジーは記憶実体、ストア同一性、作用域だけを定義します。書込み、変更、削除は「記憶ライフサイクル」、読取りと順位付けは「検索・順位付け」が担います。",
    ),
  ),

  "orchestration-actors-delegation": contract(
    "mixed",
    "delegates_to_subagent",
    applicable(["SubagentRole"], ["delegates_to_subagent"]),
    applicable(["AgentAsToolInvocation"], ["uses_agent_as_tool"]),
  ),
  "orchestration-composition": contract(
    "operational",
    "VotingActivity-consumes-VoteBallot",
    applicable(["VoteBallot"], ["VotingActivity-consumes-VoteBallot"]),
    applicable(["SynthesisOutput", "CompositionOutput"], ["Synthesis-produces-SynthesisOutput", "VotingActivity-produces-CompositionOutput"]),
  ),
  "orchestration-delegation-handoff": contract(
    "operational",
    "DelegationProcess-governed_by-DelegationContract",
    applicable(
      ["DelegationContract", "ContextIsolation", "DelegationContext", "WorkerPool", "WorkItem"],
      [
        "DelegationProcess-governed_by-DelegationContract",
        "DelegationContract-specifies-ContextIsolation",
        "ContextIsolation-bounds-DelegationContext",
        "DelegationContract-specifies-WorkItem",
        "WorkerSelectionProcess-uses-WorkerPool",
        "TaskDistribution-assigns-WorkItem",
      ],
    ),
    applicable(["DelegationResult", "WorkerAvailability", "WorkerCapabilityMatch", "WorkerSelection", "Handoff", "ResponsibilityTransfer"], ["DelegationProcess-produces-DelegationResult", "WorkerAvailabilityAssessment-produces-WorkerAvailability", "WorkerCapabilityMatching-produces-WorkerCapabilityMatch", "WorkerSelectionDecisionActivity-produces-WorkerSelection", "HandoffProcess-produces-Handoff", "HandoffProcess-results_in-ResponsibilityTransfer"]),
  ),
  "orchestration-evaluation": contract(
    "operational",
    "ImprovementLoop-uses_revision-RevisionPlan",
    applicable(["RevisionPlan"], ["ImprovementLoop-uses_revision-RevisionPlan"]),
    applicable(["ReflectionRecord"], ["ThinkAsTool-produces-ReflectionRecord"]),
    applicable(["StopCondition"], ["terminates_on_condition"]),
    applicable(["CorrectionActivity"], ["RevisionAttempt-coordinates-CorrectionActivity"]),
  ),
  "orchestration-routing-control": contract(
    "operational",
    "Gate-evaluates-GateCondition",
    applicable(["GateCondition", "RoutingPolicy"], ["Gate-evaluates-GateCondition", "RoutingDecision-applies-RoutingPolicy"]),
    applicable(["GateOutcome", "RoutingTarget"], ["Gate-produces-GateOutcome", "RoutingDecision-selects-RoutingTarget"]),
    applicable(["RuntimeSession"], ["StopCondition-terminates-RuntimeSession"]),
    applicable(["RetryActivity", "RetryPolicy"], ["RetryActivity-governed_by-RetryPolicy"]),
  ),
  "orchestration-task-planning": contract(
    "operational",
    "Goal-elaborated_by-TaskPlan",
    applicable(
      ["Goal"],
      ["Goal-elaborated_by-TaskPlan"],
      {
        "Goal-elaborated_by-TaskPlan": localized(
          "在输入面，该事实以 Goal 端点固定待展开的意图约束，防止把尚未规划的目标误当成计划。",
          "On the input facet, this fact uses the Goal endpoint to fix the intention to be elaborated, preventing an unplanned goal from being mistaken for a plan.",
          "入力面では、この事実の Goal 端点が展開対象の意図制約を固定し、未計画の目標を計画と誤認することを防ぎます。",
        ),
      },
    ),
    applicable(
      ["TaskPlan"],
      ["Goal-elaborated_by-TaskPlan"],
      {
        "Goal-elaborated_by-TaskPlan": localized(
          "在输出面，同一事实以 TaskPlan 端点标明对目标的结构化展开结果；方向仍保持 Goal 到 TaskPlan，不复制第二条反向事实。",
          "On the output facet, the same fact uses the TaskPlan endpoint to identify the structured elaboration of the goal; the Goal-to-TaskPlan direction is preserved instead of duplicating an inverse fact.",
          "出力面では、同じ事実の TaskPlan 端点が目標の構造化展開結果を示し、逆向き事実を複製せず Goal から TaskPlan への方向を保持します。",
        ),
      },
    ),
  ),

  "runtime-actors": contract(
    "mixed",
    "Actor-has_binding-ActorBinding",
    applicable(["Model"], ["ModelActor-uses-Model"]),
    applicable(["ActorBinding"], ["Actor-has_binding-ActorBinding"]),
  ),
  "runtime-artifacts": contract(
    "mixed",
    "Artifact-generated_by-RunAttempt",
    applicable(["Artifact"], ["artifact_consumed_by_attempt"]),
    applicable(["Artifact"], ["Artifact-generated_by-RunAttempt"]),
  ),
  "runtime-execution-attempts": contract(
    "operational",
    "RunAttempt-produces-RunResult",
    applicable(["Task", "ContextPackage", "RuntimeEnvironment"], ["run_attempt_belongs_to_task", "ContextPackage-delivered_to-RunAttempt", "RunAttempt-occurs_in-RuntimeEnvironment"]),
    applicable(["RunResult", "RunOutcome"], ["RunAttempt-produces-RunResult", "RunResult-evidences-RunOutcome"]),
    applicable(["BlockingError", "RunAttempt"], ["blocking_error_blocks_run_attempt"]),
    applicable(["RunAttempt", "RetryPolicy"], ["RetryActivity-creates-RunAttempt", "RetryActivity-governed_by-RetryPolicy"]),
  ),
  "runtime-observability": contract(
    "operational",
    "RestoreActivity-consumes-Checkpoint",
    applicable(["Checkpoint", "TraceRecord"], ["RestoreActivity-consumes-Checkpoint", "ReplayActivity-uses-TraceRecord"]),
    applicable(["Checkpoint", "StateSnapshot", "StateDiff"], ["CheckpointActivity-produces-Checkpoint", "RestoreActivity-produces-StateSnapshot", "RestoreActivity-produces-StateDiff"]),
    applicable(["ErrorEvent"], ["trace_event_records_error_event"]),
    applicable(["RestoreActivity"], ["CheckpointRestoreEvent-triggers-RestoreActivity"]),
  ),
  "runtime-system": contract(
    "operational",
    "opens_runtime_session",
    applicable(
      ["SessionStartEvent", "SessionResumeEvent", "Checkpoint"],
      ["opens_runtime_session", "resumes_from_checkpoint"],
      {
        opens_runtime_session: localized(
          "在输入面，该事实以 SessionStartEvent 端点表达开启请求；尚未把 RuntimeSession 当作已经存在的输入。",
          "On the input facet, this fact uses the SessionStartEvent endpoint to express the opening request; RuntimeSession is not treated as a pre-existing input.",
          "入力面では、この事実の SessionStartEvent 端点が開始要求を表し、RuntimeSession を既存入力とは扱いません。",
        ),
        resumes_from_checkpoint: localized(
          "在输入面，该事实以 SessionResumeEvent 与 Checkpoint 两个端点固定恢复请求及其不可替换的来源快照。",
          "On the input facet, this fact uses the SessionResumeEvent and Checkpoint endpoints to fix the recovery request and its non-substitutable source snapshot.",
          "入力面では、この事実の SessionResumeEvent と Checkpoint 端点が回復要求と置換不能な出典スナップショットを固定します。",
        ),
      },
    ),
    applicable(
      ["RuntimeSession", "TraceEvent"],
      ["opens_runtime_session", "emits_trace_event"],
      {
        opens_runtime_session: localized(
          "在输出面，同一事实以 RuntimeSession 端点标明由启动事件打开的会话；它不把事件与持续会话合并为一个概念。",
          "On the output facet, the same fact uses the RuntimeSession endpoint to identify the session opened by the start event without merging the event and the enduring session into one concept.",
          "出力面では、同じ事実の RuntimeSession 端点が開始イベントで開かれたセッションを示し、イベントと持続するセッションを一概念に統合しません。",
        ),
      },
    ),
    notApplicable,
    applicable(
      ["SessionResumeEvent", "RuntimeSession", "Checkpoint"],
      ["SessionLifecycleEvent-changes_state_of-RuntimeSession", "resumes_from_checkpoint"],
      {
        resumes_from_checkpoint: localized(
          "在恢复面，同一事实证明恢复动作确实从指定 Checkpoint 续接；会话状态变化另由生命周期关系表达，二者不相互替代。",
          "On the recovery facet, the same fact proves that resumption continues from the specified Checkpoint; the lifecycle relation separately expresses the session-state change, and neither substitutes for the other.",
          "回復面では、同じ事実が指定 Checkpoint から再開したことを証明します。セッション状態変化は別のライフサイクル関係で表し、両者は代替しません。",
        ),
      },
    ),
  ),

  "safety-commit-redaction": contract(
    "operational",
    "CommitRequest-evaluated_by-CommitGate",
    applicable(["CommitRequest", "PolicyDecision"], ["CommitRequest-evaluated_by-CommitGate", "commit_gate_emits_policy_decision"]),
    applicable(
      ["CommitApproval", "CommitDenial"],
      ["CommitGate-may_produce-CommitApproval", "CommitGate-may_produce-CommitDenial"],
      {
        "CommitGate-may_produce-CommitDenial": localized(
          "在输出面，该事实以 CommitDenial 端点标明提交门产生的可审计否决记录；否决记录本身仍是信息对象。",
          "On the output facet, this fact uses the CommitDenial endpoint to identify the auditable denial record produced by the commit gate; the record remains an information object.",
          "出力面では、この事実の CommitDenial 端点がコミットゲートの監査可能な拒否記録を示し、記録自体は情報対象のままです。",
        ),
      },
    ),
    applicable(
      ["CommitDenial", "SideEffect"],
      ["CommitGate-may_produce-CommitDenial", "CommitDenial-blocks-SideEffect"],
      {
        "CommitGate-may_produce-CommitDenial": localized(
          "在失败面，同一事实确认阻断依据确由 CommitGate 产生；随后由 CommitDenial-blocks-SideEffect 明确其对外部效果的阻断作用。",
          "On the failure facet, the same fact confirms that the blocking decision was produced by CommitGate; CommitDenial-blocks-SideEffect then states its blocking effect on the external side effect.",
          "失敗面では、同じ事実が阻断判断を CommitGate が生成したことを確認し、CommitDenial-blocks-SideEffect が外部効果への阻断作用を明示します。",
        ),
      },
    ),
    applicable(["RollbackAction"], ["side_effect_has_rollback_action"]),
  ),
  "safety-disclosure-redaction": contract(
    "operational",
    "Redaction-targets-SensitiveSpan",
    applicable(["SensitiveSpan", "OutputWindow"], ["Redaction-targets-SensitiveSpan", "disclosure_filter_suppresses_output_window"]),
    applicable(["SuppressedOutput", "AuditDisclosure"], ["Redaction-may_produce-SuppressedOutput", "audit_disclosure_records_disclosure_filter"]),
  ),
  "safety-injection-defense": contract(
    "operational",
    "PatternScan-scans-UntrustedInstructionCandidate",
    applicable(["UntrustedInstructionCandidate"], ["PatternScan-scans-UntrustedInstructionCandidate"]),
    applicable(["InjectionScanResult", "DefenseFinding"], ["PatternScan-produces-InjectionScanResult", "InjectionScanResult-supports-DefenseFinding"]),
    applicable(["PersistentContextRisk", "PoisonedContent"], ["ThreatSignal-indicates-PersistentContextRisk", "ResourceContentPoisoning-affects-PoisonedContent"]),
    applicable(["MitigationAction", "TrustedInstructionOverride"], ["MitigationAction-addresses-DefenseFinding", "InstructionConflict-resolved_by-TrustedInstructionOverride"]),
  ),
  "safety-network-control": contract(
    "operational",
    "OutboundRequest-initiates-NetworkCall",
    applicable(["OutboundRequest", "NetworkResource", "NetworkEndpoint"], ["OutboundRequest-initiates-NetworkCall", "NetworkCall-accesses-NetworkResource", "NetworkCall-targets-NetworkEndpoint"]),
    applicable(["InboundResponse"], ["NetworkCall-produces-InboundResponse"]),
    applicable(["DeniedNetworkCall"], ["NetworkCall-may_produce-DeniedNetworkCall", "DeniedNetworkCall-denied_under-NetworkPolicy"]),
  ),
  "safety-permission-policy": contract(
    "operational",
    "PolicyEvaluation-consumes-AuthorizationRequest",
    applicable(["AuthorizationRequest", "PolicySpecification"], ["PolicyEvaluation-consumes-AuthorizationRequest", "PolicyEvaluation-uses-PolicySpecification"]),
    applicable(["PolicyDecision"], ["PolicyEvaluation-produces-PolicyDecision"]),
  ),
  "safety-sandbox-network": contract(
    "mixed",
    "Sandbox-constrained_by-IsolationSpecification",
    applicable(["IsolationSpecification"], ["Sandbox-constrained_by-IsolationSpecification"]),
    notApplicable,
    applicable(["SandboxEscapeRisk"], ["SandboxEscapeRisk-threatens-Sandbox"]),
    notApplicable,
    localized(
      "该本体只声明隔离规范如何约束沙箱以及逃逸风险如何威胁沙箱；沙箱的创建、命令执行和恢复由“工具调用执行”与“运行时系统”负责。",
      "This ontology only states how isolation specifications constrain sandboxes and how escape risks threaten them; tool invocation and runtime system own sandbox creation, command execution, and recovery.",
      "このオントロジーは隔離仕様によるサンドボックス制約と脱出リスクによる脅威だけを表します。サンドボックス作成、コマンド実行、回復は「ツール呼出し実行」と「ランタイムシステム」が担います。",
    ),
  ),
  "safety-trust-boundary": contract(
    "mixed",
    "BoundaryCrossing-authorized_by-AuthorityScope",
    applicable(["BoundaryCrossing", "AuthorityScope"], ["BoundaryCrossing-authorized_by-AuthorityScope"]),
    applicable(["TraceEvent"], ["boundary_crossing_recorded_by_trace_event"]),
  ),

  "tool-discovery-selection": contract(
    "operational",
    "ToolSearch-consumes_query-ToolSearchQuery",
    applicable(["ToolSearchQuery"], ["ToolSearch-consumes_query-ToolSearchQuery"]),
    applicable(["ToolCandidateSet"], ["ToolSearch-produces-ToolCandidateSet"]),
    applicable(["ToolCandidate"], ["tool_selection_decision_rejects_candidate"]),
    applicable(["ToolFallback", "Tool"], ["ToolFallback-responds_to-ToolSelectionDecision", "tool_fallback_replaces_tool"]),
  ),
  "tool-invocation-execution": contract(
    "operational",
    "InvocationExecutionRequest-instantiates-InvocationSpecification",
    applicable(
      ["InvocationExecutionRequest", "InvocationSpecification", "AgentAsToolInvocation"],
      ["InvocationExecutionRequest-instantiates-InvocationSpecification", "uses_agent_as_tool"],
    ),
    applicable(["InvocationResult", "ToolResult"], ["InvocationAttempt-produces-InvocationResult", "ToolCallAttempt-produces_result-ToolResult"]),
    applicable(["ToolError"], ["ToolCallAttempt-emits_diagnostic-ToolError"]),
    applicable(["ToolCallAttempt", "RecoveryAction"], ["ToolCallRetry-retries-ToolCallAttempt", "ToolSideEffect-recovered_by-RecoveryAction"]),
  ),
  "tool-mcp-transport": contract(
    "operational",
    "MCPRequest-expects-MCPResponse",
    applicable(["MCPRequest"], ["MCPRequest-expects-MCPResponse"]),
    applicable(["MCPResponse"], ["MCPResponse-responds_to-MCPRequest"]),
    applicable(["ToolError"], ["MCPSession-may_emit-ToolError"]),
    applicable(["MCPSession"], ["MCPSession-renegotiates_after-ToolError"]),
  ),
  "tool-registry-definition": contract(
    "mixed",
    "RegistryEntry-describes-ToolSpecification",
    applicable(["ToolSpecification"], ["RegistryEntry-describes-ToolSpecification"]),
    applicable(["RegistryEntry"], ["RegistrationActivity-produces-RegistryEntry"]),
  ),
});

const facetNames = Object.freeze(["input", "output", "failure", "recovery"]);

const duplicateValues = (values) => values.filter(
  (value, index) => values.indexOf(value) !== index,
);

const isLocalizedRationale = (value) => value !== null && typeof value === "object" &&
  ["zh", "en", "ja"].every((language) =>
    typeof value[language] === "string" && value[language].trim().length > 0,
  );

export const validateOntologyV3InteractionContracts = (
  contracts = ONTOLOGY_V3_INTERACTION_CONTRACTS,
  expectedModuleIds = Object.keys(ONTOLOGY_V3_INTERACTION_CONTRACTS),
  concepts = null,
  relations = null,
) => {
  const configuredModuleIds = Object.keys(contracts).sort();
  const expected = [...expectedModuleIds].sort();
  if (JSON.stringify(configuredModuleIds) !== JSON.stringify(expected)) {
    throw new Error(`Interaction-contract module coverage mismatch: expected ${expected.join(", ")}; received ${configuredModuleIds.join(", ")}`);
  }

  const conceptById = concepts instanceof Map
    ? concepts
    : Array.isArray(concepts) ? new Map(concepts.map((concept) => [concept.id, concept])) : null;
  const relationById = relations instanceof Map
    ? relations
    : Array.isArray(relations) ? new Map(relations.map((relation) => [relation.id, relation])) : null;
  let applicableFacetCount = 0;
  let referencedRelationCount = 0;
  let sharedRelationBridgeCount = 0;

  for (const moduleId of configuredModuleIds) {
    const specification = contracts[moduleId];
    if (!["operational", "descriptive", "mixed"].includes(specification.applicability)) {
      throw new Error(`${moduleId} has invalid interaction applicability ${specification.applicability}`);
    }
    if (!specification.representative_relation_id) throw new Error(`${moduleId} has no reviewed representative relation`);
    if (Object.keys(specification.facets).sort().join("|") !== [...facetNames].sort().join("|")) {
      throw new Error(`${moduleId} must define exactly input, output, failure, and recovery facets`);
    }

    for (const facetName of facetNames) {
      const facet = specification.facets[facetName];
      const sharedRelationRationales = facet.shared_relation_rationales ?? {};
      if (duplicateValues(facet.family_concept_ids).length || duplicateValues(facet.relation_ids).length) {
        throw new Error(`${moduleId}.${facetName} contains duplicate interaction references`);
      }
      for (const relationId of Object.keys(sharedRelationRationales)) {
        if (!facet.relation_ids.includes(relationId)) {
          throw new Error(`${moduleId}.${facetName} explains relation ${relationId} without referencing it`);
        }
      }
      if (facet.applicable !== (facet.family_concept_ids.length > 0 && facet.relation_ids.length > 0)) {
        throw new Error(`${moduleId}.${facetName} applicability must match non-empty families and relations`);
      }
      if (!facet.applicable) continue;
      applicableFacetCount += 1;
      referencedRelationCount += facet.relation_ids.length;

      if (conceptById && relationById) {
        const selectedRelations = facet.relation_ids.map((relationId) => {
          const relation = relationById.get(relationId);
          if (!relation || relation.status !== "accepted") {
            throw new Error(`${moduleId}.${facetName} references missing or non-accepted relation ${relationId}`);
          }
          if (relation.predicate === "is_a") {
            throw new Error(`${moduleId}.${facetName} cannot present is_a as an interaction fact: ${relationId}`);
          }
          return relation;
        });
        for (const conceptId of facet.family_concept_ids) {
          const concept = conceptById.get(conceptId);
          if (!concept || concept.status !== "accepted") {
            throw new Error(`${moduleId}.${facetName} references missing or non-accepted concept ${conceptId}`);
          }
          if (!selectedRelations.some((relation) => relation.source_id === conceptId || relation.target_id === conceptId)) {
            throw new Error(`${moduleId}.${facetName} concept ${conceptId} is not an endpoint of its declared relations`);
          }
        }
      }
    }

    const facetsByRelation = new Map();
    for (const facetName of facetNames) {
      for (const relationId of specification.facets[facetName].relation_ids) {
        const names = facetsByRelation.get(relationId) ?? [];
        facetsByRelation.set(relationId, [...names, facetName]);
      }
    }
    for (const [relationId, sharingFacets] of facetsByRelation) {
      if (sharingFacets.length < 2) continue;
      sharedRelationBridgeCount += 1;
      for (const facetName of sharingFacets) {
        const rationale = specification.facets[facetName]
          .shared_relation_rationales?.[relationId];
        if (!isLocalizedRationale(rationale)) {
          throw new Error(
            `${moduleId}.${facetName} reuses interaction relation ${relationId} without an explicit trilingual facet-role rationale`,
          );
        }
      }
    }
    for (const facetName of facetNames) {
      const rationales = specification.facets[facetName].shared_relation_rationales ?? {};
      for (const relationId of Object.keys(rationales)) {
        if ((facetsByRelation.get(relationId)?.length ?? 0) < 2) {
          throw new Error(`${moduleId}.${facetName} marks non-shared relation ${relationId} as a shared bridge`);
        }
      }
    }

    if (relationById && conceptById) {
      const representativeRelation = relationById.get(specification.representative_relation_id);
      if (!representativeRelation || representativeRelation.status !== "accepted") {
        throw new Error(`${moduleId} representative relation is missing or non-accepted: ${specification.representative_relation_id}`);
      }
      const endpointModules = [representativeRelation.source_id, representativeRelation.target_id]
        .map((conceptId) => conceptById.get(conceptId)?.module_id);
      if (!endpointModules.includes(moduleId)) {
        throw new Error(`${moduleId} representative relation has no endpoint owned by the module: ${specification.representative_relation_id}`);
      }
    }
  }

  return Object.freeze({
    module_count: configuredModuleIds.length,
    applicable_facet_count: applicableFacetCount,
    referenced_relation_count: referencedRelationCount,
    shared_relation_bridge_count: sharedRelationBridgeCount,
  });
};

export const ontologyV3InteractionContracts = ONTOLOGY_V3_INTERACTION_CONTRACTS;
export const ontologyV3InteractionContractValidation = validateOntologyV3InteractionContracts();
