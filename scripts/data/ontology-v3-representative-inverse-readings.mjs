const localized = (zh, en, ja) => Object.freeze({ zh, en, ja });
const inverse = (predicate, zh, en, ja) => Object.freeze({
  predicate,
  labels: localized(zh, en, ja),
});

/**
 * Reviewed inverse readings for every Module representative relation. These are
 * query/UI readings of one canonical fact, never a second reverse assertion.
 */
export const ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS = Object.freeze({
  "BenchmarkAdapter-maps_action_to-ToolCallAttempt": inverse("receives_benchmark_action_mapping_from", "接收基准动作映射自", "receives benchmark action mapping from", "ベンチマーク動作写像を受ける"),
  "FrameworkAdapter-maps_tool_to-Tool": inverse("receives_framework_tool_mapping_from", "接收框架工具映射自", "receives framework tool mapping from", "フレームワークツール写像を受ける"),
  "MappingRule-specifies-MappingArtifact": inverse("specified_by_mapping_rule", "由映射规则规定", "specified by mapping rule", "写像規則で規定される"),
  "maps_protocol_capability_to_canonical_capability": inverse("receives_protocol_capability_mapping_from", "接收协议能力映射自", "receives protocol-capability mapping from", "プロトコル能力写像を受ける"),
  "SchemaProjectionRun-produces-SchemaArtifact": inverse("produced_by_schema_projection_run", "由模式投影运行产生", "produced by schema-projection run", "スキーマ投影実行で生成される"),
  "StatechartAdapter-maps_action_to-Command": inverse("receives_statechart_action_mapping_from", "接收状态图动作映射自", "receives statechart-action mapping from", "状態図動作写像を受ける"),

  "ErrorListener-observes-ErrorEvent": inverse("observed_by_error_listener", "由错误监听器观测", "observed by error listener", "エラーリスナーに観測される"),
  "EvaluationRun-uses-EvaluationSpecification": inverse("used_by_evaluation_run", "供评估运行使用", "used by evaluation run", "評価実行に使用される"),
  "OptimizationLoop-consumes-LearningSignal": inverse("consumed_by_optimization_loop", "由优化循环消费", "consumed by optimization loop", "最適化ループに消費される"),
  "ReviewActivity-evaluates-OptimizationTarget": inverse("evaluated_by_review_activity", "由审查活动评估", "evaluated by review activity", "レビュー活動に評価される"),
  "ErrorEvent-emits-DiagnosticMessage": inverse("emitted_by_error_event", "由错误事件发出", "emitted by error event", "エラーイベントから発行される"),

  "ExecutionObservation-observes-ExecutionResult": inverse("observed_by_execution_observation", "由执行观测记录", "observed by execution observation", "実行観測に記録される"),
  "ContentBlock-located_at_source_span-SourceSpan": inverse("locates_content_block", "定位内容块", "locates content block", "内容ブロックを位置付ける"),
  "DiscoveryActivity-uses-LightIndex": inverse("used_by_discovery_activity", "供发现活动使用", "used by discovery activity", "発見活動に使用される"),
  "Message-carries_instruction-Instruction": inverse("carried_by_message", "由消息承载", "carried by message", "メッセージに運ばれる"),
  "DisclosureActivity-produces-DisclosureRecord": inverse("produced_by_disclosure_activity", "由披露活动产生", "produced by disclosure activity", "開示活動で生成される"),
  "InstructionParsingActivity-consumes-PromptTemplateInstance": inverse("consumed_by_instruction_parsing_activity", "由指令解析活动消费", "consumed by instruction-parsing activity", "指示解析活動に消費される"),
  "SourceReference-located_at-SourceLocation": inverse("location_of_source_reference", "定位来源引用", "location of source reference", "出典参照の位置である"),

  "ChunkingRun-consumes-Document": inverse("consumed_by_chunking_run", "由分块运行消费", "consumed by chunking run", "チャンク化実行に消費される"),
  "ContextAssembly-consumes-MemoryRecord": inverse("consumed_by_context_assembly", "由上下文组装消费", "consumed by context assembly", "文脈組立てに消費される"),
  "EmbeddingRun-uses-EmbeddingModel": inverse("used_by_embedding_run", "供嵌入运行使用", "used by embedding run", "埋め込み実行に使用される"),
  "IngestionRun-reads-IngestibleResource": inverse("read_by_ingestion_run", "由摄入运行读取", "read by ingestion run", "取込み実行に読み取られる"),
  "MemoryOperation-acts_on-MemoryRecord": inverse("acted_on_by_memory_operation", "由记忆操作作用于", "acted on by memory operation", "記憶操作の対象となる"),
  "RetrievalRun-reads-IndexVersion": inverse("read_by_retrieval_run", "由检索运行读取", "read by retrieval run", "検索実行に読み取られる"),
  "MemoryEntity-stored_in-MemoryStore": inverse("stores_memory_entity", "存储记忆实体", "stores memory entity", "記憶エンティティを格納する"),

  delegates_to_subagent: inverse("receives_delegation_from_agent_actor", "接收智能体参与者委派", "receives delegation from agent actor", "エージェントアクターから委任を受ける"),
  "VotingActivity-consumes-VoteBallot": inverse("consumed_by_voting_activity", "由投票活动消费", "consumed by voting activity", "投票活動に消費される"),
  "DelegationProcess-governed_by-DelegationContract": inverse("governs_delegation_process", "治理委派过程", "governs delegation process", "委任プロセスを統治する"),
  "ImprovementLoop-uses_revision-RevisionPlan": inverse("used_by_improvement_loop", "供改进循环使用", "used by improvement loop", "改善ループに使用される"),
  "Gate-evaluates-GateCondition": inverse("evaluated_by_gate", "由门控评估", "evaluated by gate", "ゲートに評価される"),
  "Goal-elaborated_by-TaskPlan": inverse("elaborates_goal", "展开目标", "elaborates goal", "目標を展開する"),

  "Actor-has_binding-ActorBinding": inverse("binds_actor", "绑定参与者", "binds actor", "アクターを束縛する"),
  "Artifact-generated_by-RunAttempt": inverse("generates_artifact", "生成产物", "generates artifact", "成果物を生成する"),
  "RunAttempt-produces-RunResult": inverse("produced_by_run_attempt", "由执行尝试产生", "produced by run attempt", "実行試行で生成される"),
  "RestoreActivity-consumes-Checkpoint": inverse("consumed_by_restore_activity", "由恢复活动消费", "consumed by restore activity", "復元活動に消費される"),
  opens_runtime_session: inverse("opened_by_session_start_event", "由会话启动事件打开", "opened by session-start event", "セッション開始イベントで開かれる"),

  "CommitRequest-evaluated_by-CommitGate": inverse("evaluates_commit_request", "评估提交请求", "evaluates commit request", "コミット要求を評価する"),
  "Redaction-targets-SensitiveSpan": inverse("targeted_by_redaction", "由删减处理定位", "targeted by redaction", "墨消し処理の対象となる"),
  "PatternScan-scans-UntrustedInstructionCandidate": inverse("scanned_by_pattern_scan", "由模式扫描检查", "scanned by pattern scan", "パターンスキャンに検査される"),
  "OutboundRequest-initiates-NetworkCall": inverse("initiated_by_outbound_request", "由出站请求发起", "initiated by outbound request", "送信要求で開始される"),
  "PolicyEvaluation-consumes-AuthorizationRequest": inverse("consumed_by_policy_evaluation", "由策略评估消费", "consumed by policy evaluation", "ポリシー評価に消費される"),
  "Sandbox-constrained_by-IsolationSpecification": inverse("constrains_sandbox", "约束沙箱", "constrains sandbox", "サンドボックスを制約する"),
  "BoundaryCrossing-authorized_by-AuthorityScope": inverse("authorizes_boundary_crossing", "授权边界穿越", "authorizes boundary crossing", "境界横断を認可する"),

  "ToolSearch-consumes_query-ToolSearchQuery": inverse("consumed_by_tool_search", "由工具搜索消费", "consumed by tool search", "ツール検索に消費される"),
  "InvocationExecutionRequest-instantiates-InvocationSpecification": inverse("instantiated_by_invocation_execution_request", "由调用执行请求实例化", "instantiated by invocation-execution request", "呼出し実行要求で具体化される"),
  "MCPRequest-expects-MCPResponse": inverse("expected_by_mcp_request", "由 MCP 请求期待", "expected by MCP request", "MCP 要求に期待される"),
  "RegistryEntry-describes-ToolSpecification": inverse("described_by_registry_entry", "由注册条目描述", "described by registry entry", "レジストリ項目に記述される"),
});

const isLocalized = (value) => value !== null && typeof value === "object" &&
  ["zh", "en", "ja"].every((language) =>
    typeof value[language] === "string" && value[language].trim().length > 0,
  );

export const validateOntologyV3RepresentativeInverseReadings = (
  readings = ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS,
  interactionContracts = null,
  relations = null,
) => {
  const ids = Object.keys(readings).sort();
  if (interactionContracts) {
    const expected = Object.values(interactionContracts)
      .map(({ representative_relation_id: relationId }) => relationId)
      .sort();
    if (JSON.stringify(ids) !== JSON.stringify(expected)) {
      throw new Error("Representative inverse-reading coverage does not match interaction contracts");
    }
  }
  const relationById = relations instanceof Map
    ? relations
    : Array.isArray(relations)
      ? new Map(relations.map((relation) => [relation.id, relation]))
      : null;
  for (const [relationId, reading] of Object.entries(readings)) {
    if (!reading.predicate || /^(?:inverse_of_|is_target_of_)/u.test(reading.predicate)) {
      throw new Error(`${relationId} uses a generated inverse predicate`);
    }
    if (!isLocalized(reading.labels)) {
      throw new Error(`${relationId} is missing trilingual inverse labels`);
    }
    if (relationById) {
      const relation = relationById.get(relationId);
      if (!relation || relation.status !== "accepted") {
        throw new Error(`${relationId} inverse reading does not resolve to an accepted relation`);
      }
    }
  }
  return Object.freeze({ reviewed_inverse_count: ids.length });
};

export const ontologyV3RepresentativeInverseReadings =
  ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS;
export const ontologyV3RepresentativeInverseReadingValidation =
  validateOntologyV3RepresentativeInverseReadings();
