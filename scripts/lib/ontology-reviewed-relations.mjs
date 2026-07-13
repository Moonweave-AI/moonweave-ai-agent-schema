/**
 * @deprecated Frozen one-time v1 -> v2 replay policy. Do not import this file
 * into the source-first builder or release pipeline; edit ontology/source/**.
 */
import { sourceLocatorFor } from "./ontology-migration-factories.mjs";

const localized = (zh, en, ja) => ({ zh, en, ja });

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

/**
 * These decisions are deliberately about semantic identity, not naming style.
 * In a few cases the retained relation has a legacy-shaped ID because its
 * predicate is more specific than the later generic candidate.
 */
export const REVIEWED_RELATION_MERGES = deepFreeze([
  ["has_runtime_session", "AgentSystem-hosts-RuntimeSession"],
  ["artifact_produced_by_attempt", "Artifact-generated_by-RunAttempt"],
  ["boundary_crossing_has_source_zone", "BoundaryCrossing-has_source_zone-DataZone"],
  ["boundary_crossing_has_target_zone", "BoundaryCrossing-has_target_zone-DataZone"],
  ["crosses_trust_boundary", "BoundaryCrossing-crosses-TrustBoundary"],
  ["candidate_set_contains_chunk", "CandidateSet-contains-CandidateChunk"],
  ["capability_surface_advertises_descriptor", "CapabilitySurface-publishes-CapabilityDescriptor"],
  ["restore_event_restores_checkpoint", "CheckpointRestoreEvent-restores_from-Checkpoint"],
  ["checkpoint_captures_snapshot", "Checkpoint-captures-StateSnapshot"],
  ["chunking_run_produces_chunk", "ChunkingRun-produces-Chunk"],
  ["has_exit_status", "CommandOutputObservation-has_exit_status_observation-ExitStatusObservation"],
  ["commit_approval_authorizes_side_effect", "CommitApproval-authorizes-SideEffect"],
  ["commit_denial_blocks_side_effect", "CommitDenial-blocks-SideEffect"],
  ["commit_request_evaluated_by_commit_gate", "CommitRequest-evaluated_by-CommitGate"],
  ["assembles_context", "ContextAssembly-produces-ContextWindow"],
  ["excluded_from_context", "ContextSelectionDecision-suppresses-SuppressedContext"],
  ["delegates_authority_scope", "DelegationContract-grants-DelegatedAuthority"],
  ["EmbeddingRun-consumes-Chunk", "embedding_run_embeds_chunk"],
  ["embedding_run_produces_vector", "EmbeddingRun-produces-EmbeddingVector"],
  ["error_event_classified_by_failure_mode", "ErrorEvent-classified_by-FailureMode"],
  ["evaluation_run_uses_rubric", "EvaluationRun-applies-Rubric"],
  ["maps_framework_handoff_to_canonical_handoff", "FrameworkHandoffMapping-maps_to-Handoff"],
  ["maps_framework_trace_to_trace_record", "FrameworkTraceMapping-maps_to-TraceRecord"],
  ["index_build_run_produces_index_version", "IndexBuildRun-produces-IndexVersion"],
  ["overrides_instruction", "InstructionOverride-overrides-Instruction"],
  ["log_stream_carries_log_record", "LogStream-contains-LogRecord"],
  ["emits_conversion_warning", "MappingRule-may_emit-ConversionWarning"],
  ["mcp_elicitation_requests_additional_input", "MCPElicitation-requests-AdditionalInput"],
  ["mcp_server_exposes_tool_list", "MCPServer-publishes-MCPToolList"],
  ["mcp_session_uses_transport", "MCPSession-uses_transport-MCPTransport"],
  ["memory_file_materializes_record", "MemoryFile-materializes-MemoryRecord"],
  ["MemoryMerge-consumes-MemoryRecord", "memory_merge_combines_records"],
  ["memory_record_belongs_to_namespace", "MemoryRecord-member_of-MemoryNamespace"],
  ["memory_record_has_scope", "MemoryRecord-scoped_by-MemoryScope"],
  ["memory_validation_evaluates_record", "MemoryValidation-evaluates-MemoryRecord"],
  ["memory_write_creates_record", "MemoryWrite-produces-MemoryRecord"],
  ["has_content_block", "Message-contains_content_block-ContentBlock"],
  ["PatternScan-uses-InjectionSignature", "scans_for_signature"],
  ["maps_protocol_message_to_canonical_message", "ProtocolMessageMapping-maps_to-Message"],
  ["maps_protocol_task_to_canonical_task", "ProtocolTaskMapping-maps_to-Task"],
  ["maps_protocol_trust_to_trust_boundary", "ProtocolTrustMapping-maps_to-TrustBoundary"],
  ["redaction_applies_to_sensitive_span", "Redaction-targets-SensitiveSpan"],
  ["replay_event_replays_trace", "ReplayEvent-replays-TraceRecord"],
  ["retrieval_query_returns_candidate_set", "RetrievalQuery-produces-CandidateSet"],
  ["retrieval_query_searches_index", "RetrievalQuery-queries-IndexVersion"],
  ["ranked_by_score", "RetrievedContextCandidate-scored_by-RetrievalScore"],
  ["routes_to_target", "Route-points_to-RoutingTarget"],
  ["yields_run_outcome", "RunAttempt-produces-RunOutcome"],
  ["has_run_attempt", "RuntimeSession-has_attempt-RunAttempt"],
  ["has_access_path", "SourceReference-accessed_via-AccessPath"],
  ["has_source_location", "SourceReference-located_at-SourceLocation"],
  ["maps_statechart_state_to_snapshot", "StatechartAdapter-maps_state_to-StateSnapshot"],
  ["StopRetryLineage-links-ImprovementAttempt", "retries_from_attempt"],
  ["Synthesis-consumes-SynthesisInput", "synthesizes_from_input"],
  ["produces_synthesis_output", "Synthesis-produces-SynthesisOutput"],
  ["has_task_step", "TaskPlan-contains_step-TaskStep"],
  ["tool_call_retry_retries_attempt", "ToolCallRetry-retries-ToolCallAttempt"],
  ["tool_call_has_attempt", "ToolCall-has_attempt-ToolCallAttempt"],
  ["tool_candidate_set_contains_candidate", "ToolCandidateSet-contains-ToolCandidate"],
  ["tool_definition_defines_tool", "ToolDefinition-describes-Tool"],
  ["tool_registry_registers_tool_definition", "ToolRegistry-contains_definition-ToolDefinition"],
  ["tool_search_produces_candidate_set", "ToolSearch-produces-ToolCandidateSet"],
  ["TopKSelection-produces-RetrievedChunk", "top_k_selection_selects_retrieved_chunk"],
  ["trace_contains_span", "TraceRecord-contains_span-TraceSpan"],
  ["span_contains_event", "TraceSpan-records_event-TraceEvent"],
  ["warning_event_raises_warning", "WarningEvent-raises-Warning"],
  ["selects_worker_from_pool", "WorkerSelection-selects_from-WorkerPool"],
].map(([source_relation_id, target_relation_id]) => ({
  source_relation_id,
  target_relation_id,
  rationale: localized(
    `“${source_relation_id}”与“${target_relation_id}”表达同一可验证事实；保留语义边界更明确的目标关系，并迁移全部证据与示例。`,
    `“${source_relation_id}” and “${target_relation_id}” assert the same verifiable fact; the semantically sharper target is retained with all evidence and examples migrated.`,
    `「${source_relation_id}」と「${target_relation_id}」は同じ検証可能な事実を表すため、意味境界が明確な対象関係を残し、証拠と例をすべて移行します。`,
  ),
})));

export const REVIEWED_RELATION_SPECIAL_DECISIONS = deepFreeze([
  {
    id: "chunking-input-not-output",
    source_relation_id: "chunks_document",
    target_relation_ids: ["ChunkingRun-consumes-Document"],
    action: "redirect_to_reviewed_relation",
    rationale: localized(
      "chunks_document 的旧值域 Chunk 混淆了输入与输出；分块运行消费 Document，并另由 produces 指向生成的 Chunk。",
      "The old Chunk range of chunks_document conflated input and output: a ChunkingRun consumes a Document and separately produces Chunks.",
      "chunks_document の旧 range である Chunk は入力と出力を混同していました。ChunkingRun は Document を消費し、生成 Chunk は別の produces で表します。",
    ),
  },
  {
    id: "goal-refinement-unification",
    source_relation_id: "decomposes_goal_into",
    target_relation_ids: ["Goal-refined_into-Objective"],
    action: "merge_into_reviewed_relation",
    rationale: localized(
      "目标分解与目标细化在当前闭环中是同一从 Goal 到可操作 Objective 的事实，统一为 refined_into。",
      "Goal decomposition and refinement are the same Goal-to-operational-Objective fact in this closure and are unified as refined_into.",
      "現在の閉ループでは目標分解と目標精緻化は Goal から実行可能な Objective への同一事実であり、refined_into に統合します。",
    ),
  },
  {
    id: "runtime-environment-host-versus-dependency",
    source_relation_id: "uses_runtime_environment",
    target_relation_ids: [
      "RunAttempt-occurs_in-RuntimeEnvironment",
      "uses_runtime_environment",
    ],
    action: "preserve_distinct_fact",
    rationale: localized(
      "occurs_in 固定执行尝试实际发生的宿主环境与时间边界；uses_runtime_environment 记录额外使用的运行依赖，两者不可互推。",
      "occurs_in identifies the host environment and temporal boundary where the attempt happens; uses_runtime_environment records an additional runtime dependency, so neither fact entails the other.",
      "occurs_in は試行が実際に生じるホスト環境と時間境界を特定し、uses_runtime_environment は追加の実行依存を記録するため、相互には導出できません。",
    ),
  },
  {
    id: "immutable-memory-update",
    source_relation_id: "memory_update_updates_record",
    target_relation_ids: [
      "MemoryUpdate-produces-MemoryRecord",
      "MemoryUpdate-supersedes-MemoryRecord",
    ],
    action: "retire_after_immutable_update_split",
    rationale: localized(
      "笼统的 updates 暗示原地修改，予以退役；不可变更新必须同时表达产生新版本与取代旧版本。",
      "The generic updates predicate implies in-place mutation and is retired; an immutable update is expressed by producing a new version and superseding the old one.",
      "一般的な updates は直接変更を示唆するため廃止し、不変更新は新版本の produces と旧版本の supersedes の二事実で表します。",
    ),
  },
  {
    id: "schema-profile-external-mapping",
    source_relation_id: "maps_schema_profile_to_schema_artifact",
    target_relation_ids: ["SchemaAdapter-produces-SchemaArtifact"],
    action: "migrate_to_structured_external_mapping",
    target_mapping_id: "SchemaAdapter-external-family-mapping",
    rationale: localized(
      "schema profile 到外部构造的对应属于带版本、方向与损失说明的 structured external mapping，不是运行时对象边；运行时仅保留 SchemaAdapter produces SchemaArtifact。",
      "A schema-profile correspondence belongs in a versioned, directional structured external mapping with loss notes, not in the runtime object graph; only SchemaAdapter produces SchemaArtifact remains as a runtime fact.",
      "schema profile の対応は版本・方向・損失注記を持つ structured external mapping に属し、実行時 object edge ではありません。実行時には SchemaAdapter produces SchemaArtifact のみを残します。",
    ),
  },
]);

const distinctGroup = (id, relation_ids, zh, en, ja) => ({
  id,
  relation_ids,
  distinct_fact_rationale: localized(zh, en, ja),
});

export const REVIEWED_DISTINCT_FACT_GROUPS = deepFreeze([
  distinctGroup(
    "content-provenance-versus-reference",
    ["derived_from_source", "has_source_reference"],
    "derived_from_source 断言内容值由来源推导；has_source_reference 仅断言内容块携带可解析引用，引用存在不等于已发生派生。",
    "derived_from_source asserts derivation of the content value; has_source_reference only records a resolvable citation, whose presence does not prove derivation.",
    "derived_from_source は内容値の導出を断言し、has_source_reference は解決可能な参照の保持だけを示すため、参照の存在だけでは導出を証明しません。",
  ),
  distinctGroup(
    "instruction-type-versus-override-action",
    ["InstructionOverride-is_a-Instruction", "InstructionOverride-overrides-Instruction"],
    "is_a 给出 InstructionOverride 的概念归属；overrides 指向被遮蔽的另一条 Instruction，是独立的操作事实。",
    "is_a classifies InstructionOverride, while overrides points to the other Instruction whose effect is displaced; these are independent facts.",
    "is_a は InstructionOverride の概念所属を示し、overrides は効力を置き換えられる別の Instruction を指す独立した操作事実です。",
  ),
  distinctGroup(
    "artifact-attempt-input-versus-output",
    ["artifact_consumed_by_attempt", "Artifact-generated_by-RunAttempt"],
    "consumed_by_attempt 把 Artifact 标为尝试输入；generated_by 把它标为该尝试的新输出，同一尝试可承担不同角色。",
    "consumed_by_attempt marks an Artifact as an attempt input, whereas generated_by marks it as that attempt's new output.",
    "consumed_by_attempt は Artifact を試行入力として、generated_by は同試行の新出力として区別します。",
  ),
  distinctGroup(
    "state-diff-before-versus-after",
    ["state_diff_from_snapshot", "state_diff_to_snapshot"],
    "from_snapshot 指向差异计算的基线快照；to_snapshot 指向应用差异后的结果快照。",
    "from_snapshot identifies the baseline snapshot; to_snapshot identifies the resulting snapshot after the diff is applied.",
    "from_snapshot は差分の基準 snapshot、to_snapshot は差分適用後の結果 snapshot を示します。",
  ),
  distinctGroup(
    "trace-link-source-versus-target",
    ["trace_link_source_span", "trace_link_target_span"],
    "source_span 是跨轨迹链接的发出端，target_span 是到达端；交换角色会改变因果读法。",
    "source_span is the emitting end of a cross-trace link and target_span is its receiving end; swapping them changes the causal reading.",
    "source_span は trace link の発信端、target_span は到達端であり、役割交換は因果的読解を変えます。",
  ),
  distinctGroup(
    "runtime-environment-host-versus-dependency",
    ["RunAttempt-occurs_in-RuntimeEnvironment", "uses_runtime_environment"],
    "occurs_in 固定尝试实际发生的宿主环境与时间边界；uses_runtime_environment 记录额外运行依赖，二者不可互推。",
    "occurs_in fixes the host and temporal boundary of execution; uses_runtime_environment records an additional runtime dependency, and neither entails the other.",
    "occurs_in は実行のホストと時間境界を固定し、uses_runtime_environment は追加実行依存を記録するため、相互に導出できません。",
  ),
  distinctGroup(
    "retry-type-versus-lineage",
    ["ToolCallRetry-is_a-ToolCallAttempt", "ToolCallRetry-retries-ToolCallAttempt"],
    "is_a 说明重试本身是一种调用尝试；retries 指向它所接续的先前尝试。",
    "is_a classifies the retry as a ToolCallAttempt; retries identifies the prior attempt whose lineage it continues.",
    "is_a は再試行自体を ToolCallAttempt と分類し、retries は系譜上の先行試行を指します。",
  ),
  distinctGroup(
    "mcp-error-emission-versus-renegotiation",
    ["MCPSession-may_emit-ToolError", "MCPSession-renegotiates_after-ToolError"],
    "may_emit 表示会话可能产生工具错误；renegotiates_after 表示会话观察到错误后改变协商状态，发生错误不必然触发重协商。",
    "may_emit records possible error production; renegotiates_after records a negotiation-state transition after an observed error, which is not automatic for every error.",
    "may_emit はエラー生成可能性を、renegotiates_after は観測後の交渉状態遷移を表し、すべてのエラーが再交渉を生むわけではありません。",
  ),
  distinctGroup(
    "boundary-crossing-source-versus-target-actor",
    ["boundary_crossing_has_source_actor", "boundary_crossing_has_target_actor"],
    "source_actor 发起跨界传递，target_actor 接收传递；两端角色不能因端点类型相同而合并。",
    "source_actor initiates the boundary crossing and target_actor receives it; identical endpoint types do not make the roles interchangeable.",
    "source_actor は境界越えを開始し、target_actor は受領するため、同じ endpoint 型でも役割は統合できません。",
  ),
  distinctGroup(
    "boundary-crossing-source-versus-target-zone",
    ["BoundaryCrossing-has_source_zone-DataZone", "BoundaryCrossing-has_target_zone-DataZone"],
    "source_zone 是数据离开的区域，target_zone 是数据进入的区域；方向决定适用的信任与披露策略。",
    "source_zone is where data leaves and target_zone is where it enters; direction determines the applicable trust and disclosure policies.",
    "source_zone はデータの出発領域、target_zone は到達領域であり、方向が適用する信頼・開示方針を決めます。",
  ),
  distinctGroup(
    "learning-signal-type-versus-provenance",
    ["LearningSignal-is_a-Feedback", "learning_signal_derived_from_feedback"],
    "is_a 说明 LearningSignal 属于 Feedback；derived_from_feedback 记录生成该信号的具体反馈来源。",
    "is_a classifies LearningSignal as Feedback; derived_from_feedback records the particular feedback provenance from which the signal was computed.",
    "is_a は LearningSignal を Feedback と分類し、derived_from_feedback は信号を生成した具体的 feedback 来歴を記録します。",
  ),
  distinctGroup(
    "chunk-compression-input-versus-output",
    ["ChunkCompression-consumes-Chunk", "ChunkCompression-produces-Chunk"],
    "consumes 指向压缩前的 Chunk 版本，produces 指向压缩后的新 Chunk 版本，不允许原地覆盖。",
    "consumes identifies the pre-compression Chunk version and produces the new compressed version; in-place overwrite is not implied.",
    "consumes は圧縮前 Chunk 版、produces は新しい圧縮後版を示し、直接上書きは認めません。",
  ),
  distinctGroup(
    "context-assembly-input-versus-inclusion",
    ["ContextAssembly-consumes-RetrievedChunk", "context_assembly_includes_retrieved_chunk"],
    "consumes 记录 RetrievedChunk 作为组装活动的候选输入；includes 记录它通过选择后实际进入最终上下文。",
    "consumes records a RetrievedChunk as an assembly input candidate; includes records that it survived selection and entered the final context.",
    "consumes は RetrievedChunk を組立入力候補として記録し、includes は選択後に最終 context へ入った事実を記録します。",
  ),
  distinctGroup(
    "index-refresh-new-versus-replaced-version",
    ["IndexRefreshEvent-produces-IndexVersion", "IndexRefreshEvent-supersedes-IndexVersion"],
    "produces 指向刷新生成的新索引版本；supersedes 指向被其取代的旧版本。",
    "produces identifies the new index version created by refresh; supersedes identifies the old version it replaces.",
    "produces は刷新で生成した新 index 版、supersedes は置換される旧版を指します。",
  ),
  distinctGroup(
    "source-attachment-type-versus-description",
    ["SourceAttachment-is_a-IngestibleResource", "SourceAttachment-describes-IngestibleResource"],
    "is_a 说明附件本身可被摄取；describes 指向附件所描述的另一项资源，不能把描述对象与附件身份混为一谈。",
    "is_a says the attachment itself is ingestible; describes points to another resource represented by the attachment, so object and attachment identity remain separate.",
    "is_a は添付自体が取込可能であることを示し、describes は添付が表現する別 resource を指すため、両者の識別は分離されます。",
  ),
  distinctGroup(
    "memory-merge-input-versus-output",
    ["memory_merge_combines_records", "MemoryMerge-produces-MemoryRecord"],
    "combines_records 指向合并读取的一个或多个旧记录；produces 指向合并产生的新不可变记录。",
    "combines_records identifies one or more old input records; produces identifies the new immutable record emitted by the merge.",
    "combines_records は結合対象の旧入力 record、produces は結合で生成する新しい不変 record を示します。",
  ),
  distinctGroup(
    "memory-update-new-versus-replaced-version",
    ["MemoryUpdate-produces-MemoryRecord", "MemoryUpdate-supersedes-MemoryRecord"],
    "produces 指向更新生成的新不可变记录版本；supersedes 指向被取代且仍保留的旧版本。",
    "produces identifies the new immutable record version; supersedes identifies the retained old version that it replaces.",
    "produces は更新で生成した新しい不変 record 版、supersedes は保持されたまま置換される旧版を指します。",
  ),
  distinctGroup(
    "log-subscription-registration-versus-configuration",
    ["log_subscription_registers_listener", "LogSubscription-configures-LogListener"],
    "registers_listener 记录监听器加入订阅的成员事实；configures 记录订阅向该监听器施加的过滤、投递或保留配置。",
    "registers_listener records listener membership in the subscription; configures records the filtering, delivery, or retention settings applied to that listener.",
    "registers_listener は listener の購読参加を、configures はその listener に適用する filter・配信・保持設定を記録します。",
  ),
  distinctGroup(
    "review-finding-production-versus-composition",
    ["review_produces_review_finding", "Review-contains_finding-ReviewFinding"],
    "produces 记录审查活动形成发现的因果事实；contains_finding 记录完成后的审查记录由哪些发现组成。",
    "produces records the causal creation of a finding by review activity; contains_finding records which findings compose the completed review record.",
    "produces は review 活動による finding 生成を、contains_finding は完了 review 記録を構成する finding を記録します。",
  ),
  distinctGroup(
    "ingestion-document-input-versus-output",
    ["ingestion_run_loads_document", "IngestionRun-produces-Document"],
    "loads_document 指向摄取运行读取的既有 Document 输入；produces 指向规范化、带版本且可索引的新 Document 输出。",
    "loads_document identifies an existing Document read as ingestion input; produces identifies the normalized, versioned, indexable Document output.",
    "loads_document は取込入力として読む既存 Document、produces は正規化・版本化され索引可能な新 Document 出力を示します。",
  ),
  distinctGroup(
    "memory-compaction-input-versus-output",
    ["memory_compaction_compacts_record", "MemoryCompaction-produces-MemoryRecord"],
    "compacts_record 指向压缩所读取的旧记录；produces 指向压缩后的新不可变记录版本。",
    "compacts_record identifies the old record read by compaction; produces identifies the new immutable compacted record version.",
    "compacts_record は圧縮対象の旧 record、produces は圧縮後の新しい不変 record 版を示します。",
  ),
  distinctGroup(
    "memory-consolidation-input-versus-output",
    ["memory_consolidation_merges_records", "MemoryConsolidation-produces-MemoryRecord"],
    "merges_records 指向巩固活动读取的多个旧记录；produces 指向巩固后生成的新记录。",
    "merges_records identifies the old records read by consolidation; produces identifies the new consolidated record.",
    "merges_records は統合で読む複数の旧 record、produces は統合後に生成する新 record を示します。",
  ),
  distinctGroup(
    "memory-supersession-old-versus-new-version",
    ["memory_supersession_replaces_record", "MemorySupersession-produces-MemoryRecord"],
    "replaces_record 指向被取代但保留审计身份的旧记录；produces 指向承担后继身份的新记录。",
    "replaces_record identifies the old record retained for audit; produces identifies the new successor record.",
    "replaces_record は監査用に保持される旧 record、produces は後継となる新 record を示します。",
  ),
  distinctGroup(
    "rank-fusion-input-versus-output-order",
    ["rank_fusion_combines_candidate_set", "RankFusion-orders-CandidateSet"],
    "combines_candidate_set 指向参与融合的候选集合输入；orders 指向融合后带统一次序的候选集合输出。",
    "combines_candidate_set identifies candidate-set inputs to fusion; orders identifies the candidate set carrying the fused output order.",
    "combines_candidate_set は融合入力の候補集合、orders は融合後の統一次序を持つ候補集合出力を示します。",
  ),
]);

const claimKey = (claim) =>
  [
    claim?.source_id,
    claim?.supports,
    claim?.locator,
    claim?.evidence_kind,
    claim?.confidence,
    claim?.review_status,
  ].join("\0");

const mergeClaims = (...claimGroups) => {
  const byKey = new Map();
  for (const claim of claimGroups.flat()) {
    if (claim && typeof claim === "object") byKey.set(claimKey(claim), structuredClone(claim));
  }
  return [...byKey.values()];
};

const lookupSource = (sourceRegistryById, sourceId) =>
  sourceRegistryById instanceof Map
    ? sourceRegistryById.get(sourceId)
    : sourceRegistryById?.[sourceId];

const claimsFromLegacyRecord = ({ legacyRecord, targetRelationId, sourceRegistryById }) =>
  (legacyRecord?.source_ids ?? []).flatMap((sourceId) => {
    const source = lookupSource(sourceRegistryById, sourceId);
    if (!source) return [];
    const locator = sourceLocatorFor({
      ...source,
      id: source.id ?? sourceId,
      title: source.title ?? source.label ?? sourceId,
    });
    return [{
      source_id: sourceId,
      supports: `Supports the reviewed convergence of ${legacyRecord.id} into ${targetRelationId}; the semantic identity decision is an accepted ontology-design inference.`,
      locator,
      evidence_kind: "design-inference",
      confidence: "medium",
      review_status: "accepted",
    }];
  });

const rewriteRelationIds = (ids, redirects) => [
  ...new Set(
    (ids ?? []).flatMap((id) => redirects.has(id) ? redirects.get(id) : [id]),
  ),
];

const rewriteExample = (example, redirects) => ({
  ...structuredClone(example),
  related_relation_ids: rewriteRelationIds(example.related_relation_ids, redirects),
});

const mergeExamples = (targetExamples, incomingExamples, redirects) => {
  const byId = new Map();
  for (const example of [...(targetExamples ?? []), ...(incomingExamples ?? [])]) {
    const rewritten = rewriteExample(example, redirects);
    const existing = byId.get(rewritten.id);
    byId.set(
      rewritten.id,
      existing
        ? {
            ...existing,
            related_relation_ids: rewriteRelationIds(
              [...(existing.related_relation_ids ?? []), ...(rewritten.related_relation_ids ?? [])],
              redirects,
            ),
            source_claims: mergeClaims(existing.source_claims ?? [], rewritten.source_claims ?? []),
          }
        : rewritten,
    );
  }
  return [...byId.values()];
};

const relationSetKey = (relationIds) => [...relationIds].sort().join("\0");

/**
 * Converges the independently reviewed relation set without mutating its inputs.
 * The returned disposition map is intended to overlay the legacy migration
 * ledger; it deliberately contains only decisions owned by this review pass.
 */
export const convergeReviewedRelations = ({
  relations,
  legacyRelations = [],
  sourceRegistryById = new Map(),
}) => {
  if (!Array.isArray(relations)) throw new TypeError("relations must be an array");
  if (!Array.isArray(legacyRelations)) throw new TypeError("legacyRelations must be an array");

  const relationById = new Map();
  for (const relation of relations) {
    if (!relation?.id) throw new TypeError("Every relation must have an id");
    if (relationById.has(relation.id)) throw new Error(`Duplicate relation id: ${relation.id}`);
    relationById.set(relation.id, structuredClone(relation));
  }
  const legacyById = new Map(legacyRelations.map((relation) => [relation.id, relation]));
  const dispositionByRelationId = new Map();
  const redirects = new Map(
    REVIEWED_RELATION_MERGES.map(({ source_relation_id: sourceId, target_relation_id: targetId }) => [
      sourceId,
      [targetId],
    ]),
  );
  for (const decision of REVIEWED_RELATION_SPECIAL_DECISIONS) {
    if (decision.action === "preserve_distinct_fact") continue;
    redirects.set(
      decision.source_relation_id,
      decision.action === "migrate_to_structured_external_mapping"
        ? []
        : [...decision.target_relation_ids],
    );
  }

  const mergeIntoTargets = ({
    sourceId,
    targetIds,
    action,
    rationale,
  }) => {
    const source = relationById.get(sourceId);
    const targets = targetIds.map((targetId) => {
      const target = relationById.get(targetId);
      if (!target) throw new Error(`Required target relation ${targetId} for ${sourceId} does not exist`);
      return target;
    });
    const legacyClaims = targetIds.flatMap((targetId) =>
      claimsFromLegacyRecord({
        legacyRecord: legacyById.get(sourceId),
        targetRelationId: targetId,
        sourceRegistryById,
      }),
    );
    const incomingClaims = mergeClaims(source?.source_claims ?? [], legacyClaims);
    const incomingExamples = source?.examples ?? [];

    for (const [index, target] of targets.entries()) {
      relationById.set(target.id, {
        ...target,
        source_claims: mergeClaims(target.source_claims ?? [], incomingClaims),
        examples: mergeExamples(
          target.examples ?? [],
          index === 0 ? incomingExamples : [],
          redirects,
        ),
      });
    }
    relationById.delete(sourceId);
    dispositionByRelationId.set(sourceId, {
      action,
      target_relation_id: targetIds.length === 1 ? targetIds[0] : "",
      target_relation_ids: [...targetIds],
      rationale,
    });
  };

  for (const decision of REVIEWED_RELATION_MERGES) {
    mergeIntoTargets({
      sourceId: decision.source_relation_id,
      targetIds: [decision.target_relation_id],
      action: "merge_into_reviewed_relation",
      rationale: decision.rationale,
    });
  }

  for (const decision of REVIEWED_RELATION_SPECIAL_DECISIONS) {
    if (decision.action === "preserve_distinct_fact") {
      for (const relationId of decision.target_relation_ids) {
        if (!relationById.has(relationId)) {
          throw new Error(`Required target relation ${relationId} for ${decision.source_relation_id} does not exist`);
        }
      }
      dispositionByRelationId.set(decision.source_relation_id, {
        action: decision.action,
        target_relation_id: decision.source_relation_id,
        target_relation_ids: [...decision.target_relation_ids],
        rationale: decision.rationale,
      });
      continue;
    }
    if (decision.action === "migrate_to_structured_external_mapping") {
      if (!relationById.has(decision.target_relation_ids[0])) {
        throw new Error(`Required target relation ${decision.target_relation_ids[0]} for ${decision.source_relation_id} does not exist`);
      }
      relationById.delete(decision.source_relation_id);
      dispositionByRelationId.set(decision.source_relation_id, {
        action: decision.action,
        target_relation_id: "",
        target_relation_ids: [],
        target_mapping_id: decision.target_mapping_id,
        rationale: decision.rationale,
      });
      continue;
    }
    mergeIntoTargets({
      sourceId: decision.source_relation_id,
      targetIds: decision.target_relation_ids,
      action: decision.action,
      rationale: decision.rationale,
    });
  }

  for (const [id, relation] of relationById) {
    relationById.set(id, {
      ...relation,
      examples: (relation.examples ?? []).map((example) => rewriteExample(example, redirects)),
    });
  }

  const reviewedGroupBySet = new Map();
  for (const group of REVIEWED_DISTINCT_FACT_GROUPS) {
    const groupRelations = group.relation_ids.map((relationId) => {
      const relation = relationById.get(relationId);
      if (!relation) throw new Error(`Required retained relation ${relationId} does not exist`);
      return relation;
    });
    const endpointKeys = new Set(
      groupRelations.map((relation) => `${relation.source_id}\0${relation.target_id}`),
    );
    if (endpointKeys.size !== 1) throw new Error(`Reviewed distinct-fact group ${group.id} does not share endpoints`);
    reviewedGroupBySet.set(relationSetKey(group.relation_ids), group);
    for (const relation of groupRelations) {
      relationById.set(relation.id, {
        ...relation,
        distinct_fact_rationale: structuredClone(group.distinct_fact_rationale),
      });
    }
  }

  const endpointGroups = Map.groupBy(
    [...relationById.values()],
    (relation) => `${relation.source_id}\0${relation.target_id}`,
  );
  for (const groupRelations of endpointGroups.values()) {
    if (groupRelations.length < 2) continue;
    const relationIds = groupRelations.map(({ id }) => id);
    if (!reviewedGroupBySet.has(relationSetKey(relationIds))) {
      throw new Error(`Unreviewed same-endpoint relation facts: ${relationIds.sort().join(", ")}`);
    }
  }

  return {
    relations: [...relationById.values()],
    dispositionByRelationId,
  };
};
