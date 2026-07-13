/**
 * @deprecated Frozen one-time v1 -> v2 replay policy. Do not import this file
 * into the source-first builder or release pipeline; edit ontology/source/**.
 */
import { buildEffectiveConceptStructures } from "./ontology-concept-structure.mjs";

const VERSION_IRI = "https://moonweave.ai/ontology/agent-system/2.0.0/";

const localized = (zh, en, ja) => ({ zh, en, ja });

const LOCATORS = Object.freeze({
  engineering: "research/source-notes/phase-0b-expanded-engineering-corpus.md",
  literature: "research/source-notes/phase-0b-expanded-literature-corpus.md",
  ontology: "research/source-notes/cross-domain-ontology-pattern-review.md",
});

const claim = ({ sourceId, locator, subject, claimKind }) => ({
  source_id: sourceId,
  supports: `Supports the reviewed ${claimKind} for ${subject}; the Moonweave cardinality and validation boundary are an accepted design inference over this registered evidence.`,
  locator,
  evidence_kind: "design-inference",
  confidence: "medium",
  review_status: "accepted",
});

const reviewedField = ({
  conceptId,
  sourceId,
  locator,
  id,
  labels,
  datatype,
  required = false,
  definitions,
  example,
  allowedValues = [],
  pattern = null,
  repeatable = false,
}) => ({
  id,
  labels,
  datatype,
  required,
  cardinality: { min: required ? 1 : 0, max: repeatable ? null : 1 },
  definitions,
  allowed_values: allowedValues,
  pattern,
  example_value: example,
  source_claims: [
    claim({
      sourceId,
      locator,
      subject: `${conceptId}.${id}`,
      claimKind: "field semantics",
    }),
  ],
});

const reviewedConstraint = ({ conceptId, sourceId, locator, id, expression, explanations }) => ({
  id,
  severity: "error",
  expression_language: "plain",
  expression,
  explanations,
  source_claims: [
    claim({ sourceId, locator, subject: `${conceptId}.${id}`, claimKind: "plain constraint" }),
  ],
});

const reviewedRelationConstraint = ({
  conceptId,
  sourceId,
  locator,
  id,
  direction = "outgoing",
  predicate,
  targetConceptId,
  min = 1,
  max = 1,
  explanations,
}) => ({
  id,
  direction,
  predicate,
  target_concept_id: targetConceptId,
  cardinality: { min, max },
  explanations,
  source_claims: [
    claim({
      sourceId,
      locator,
      subject: `${conceptId}.${id}`,
      claimKind: "required relation constraint",
    }),
  ],
});

const f = (id, zhLabel, enLabel, jaLabel, datatype, example, zhDefinition, enDefinition, jaDefinition, options = {}) => ({
  id,
  labels: localized(zhLabel, enLabel, jaLabel),
  datatype,
  example,
  definitions: localized(zhDefinition, enDefinition, jaDefinition),
  ...options,
});

const c = (id, expression, zh, en, ja) => ({
  id,
  expression,
  explanations: localized(zh, en, ja),
});

const r = (id, predicate, targetConceptId, zh, en, ja, options = {}) => ({
  id,
  predicate,
  targetConceptId,
  explanations: localized(zh, en, ja),
  ...options,
});

const p = ({ moduleId, conceptId, sourceId, locator = LOCATORS.engineering, identityKeys, fields, constraints, relations }) => ({
  moduleId,
  conceptId,
  sourceId,
  locator,
  identityKeys,
  fields,
  constraints,
  relations,
});

// Each entry is a reviewed, Module-owned structure decision. These are annotations on
// canonical Concepts; none of them creates a Schema, instance, or evidence graph node.
const PATCH_SPECS = [
  p({
    moduleId: "runtime-system",
    conceptId: "RuntimeSession",
    sourceId: "eng-fw-openai-python-docs",
    identityKeys: ["session_id"],
    fields: [
      f("session_id", "会话标识", "session ID", "セッション ID", "string", "session-20260714-001", "在一次系统部署范围内稳定标识该运行会话。", "Stable identifier for this runtime session within one system deployment.", "一つのシステム配備内でこの実行セッションを安定して識別します。", { required: true, pattern: "^session-[A-Za-z0-9-]+$" }),
      f("lifecycle_state", "生命周期状态", "lifecycle state", "ライフサイクル状態", "string", "running", "会话在受控生命周期中的当前状态，而不是新的图节点。", "Current state in the controlled session lifecycle, not a separate graph node.", "制御されたセッションライフサイクル上の現在状態であり、別のグラフノードではありません。", { required: true }),
      f("start_time", "开始时间", "start time", "開始時刻", "date-time", "2026-07-13T01:00:00.000Z", "会话开始事件生效的 UTC 时间。", "UTC instant at which the session-start event took effect.", "セッション開始イベントが発効した UTC 時刻です。", { required: true }),
      f("end_time", "结束时间", "end time", "終了時刻", "date-time", null, "会话结束事件生效的 UTC 时间；活动会话为空。", "UTC instant at which the session-end event took effect; null while active.", "セッション終了イベントが発効した UTC 時刻で、実行中は空です。"),
    ],
    constraints: [c("runtime-session-lifecycle-order", "end_time is absent or end_time >= start_time", "结束时间若存在，不得早于开始时间。", "When present, end_time must not precede start_time.", "終了時刻がある場合、開始時刻より前であってはなりません。")],
    relations: [r("runtime-session-has-attempt", "has_attempt", "RunAttempt", "运行会话至少包含一次可审计的执行尝试。", "A runtime session contains at least one auditable run attempt.", "実行セッションには少なくとも一つの監査可能な実行試行が含まれます。", { max: null })],
  }),
  p({
    moduleId: "runtime-actors",
    conceptId: "Actor",
    sourceId: "eng-ont-palantir-core-concepts",
    locator: LOCATORS.ontology,
    identityKeys: ["actor_id"],
    fields: [
      f("actor_id", "主体标识", "actor ID", "アクター ID", "string", "actor-reviewer-001", "在系统边界内稳定标识承担行为或责任的主体。", "Stable identifier for the subject that bears actions or responsibilities within the system boundary.", "システム境界内で行為または責任を担う主体を安定して識別します。", { required: true }),
      f("actor_kind", "主体类别", "actor kind", "アクター種別", "string", "human", "区分人类、软件或外部服务主体的受控类别。", "Controlled category distinguishing human, software, or external-service actors.", "人間、ソフトウェア、外部サービスのアクターを区別する制御カテゴリです。", { required: true }),
      f("display_name", "显示名称", "display name", "表示名", "string", "Ontology reviewer", "供审计界面显示且不参与身份判定的名称。", "Human-readable name for audit displays that does not determine identity.", "監査表示用の可読名で、同一性判定には用いません。")
    ],
    constraints: [c("actor-kind-consistency", "actor_kind must agree with the most specific Actor subtype", "主体类别必须与其最具体的 Actor 下位类型一致。", "actor_kind must agree with the most specific Actor subtype.", "actor_kind は最も具体的な Actor 下位型と一致しなければなりません。")],
    relations: [r("actor-has-binding", "has_binding", "ActorBinding", "主体至少通过一个绑定说明其角色、能力或权限。", "An actor has at least one binding that states a role, capability, or authority.", "アクターには役割、能力、権限を示す少なくとも一つのバインディングがあります。", { max: null })],
  }),
  p({
    moduleId: "runtime-observability",
    conceptId: "TraceRecord",
    sourceId: "eng-fw-openai-tracing",
    identityKeys: ["trace_id"],
    fields: [
      f("trace_id", "追踪标识", "trace ID", "トレース ID", "string", "trace-8f2c1", "跨跨度稳定关联一次端到端运行追踪。", "Stable identifier correlating one end-to-end runtime trace across spans.", "複数スパンにまたがる一つのエンドツーエンド実行トレースを関連付けます。", { required: true }),
      f("sampled", "是否采样", "sampled", "サンプリング済み", "boolean", true, "说明该追踪是否依据采样决策保留。", "Whether this trace was retained by the applicable sampling decision.", "適用されたサンプリング判断によりこのトレースが保持されたかを示します。", { required: true })
    ],
    constraints: [c("trace-record-id-stable", "trace_id is immutable after the first span is recorded", "首个跨度记录后，追踪标识不可改变。", "trace_id is immutable after the first span is recorded.", "最初のスパン記録後、trace_id は変更できません。")],
    relations: [r("trace-record-contains-span", "contains_span", "TraceSpan", "追踪记录至少包含一个跨度。", "A trace record contains at least one span.", "トレース記録には少なくとも一つのスパンが含まれます。", { max: null })],
  }),
  p({
    moduleId: "runtime-artifacts",
    conceptId: "Artifact",
    sourceId: "eng-ont-prov-o",
    locator: LOCATORS.ontology,
    identityKeys: ["artifact_id", "version"],
    fields: [
      f("artifact_id", "产物标识", "artifact ID", "成果物 ID", "string", "artifact-report-001", "稳定标识跨版本的逻辑产物。", "Stable identifier for the logical artifact across versions.", "複数バージョンにまたがる論理成果物を安定して識別します。", { required: true }),
      f("version", "版本", "version", "バージョン", "string", "3", "标识不可变产物修订版的版本值。", "Version value identifying one immutable artifact revision.", "不変の成果物リビジョンを識別するバージョン値です。", { required: true }),
      f("status", "状态", "status", "状態", "string", "final", "草稿或定稿等受控状态；状态是字段而非下位概念。", "Controlled status such as draft or final; it is a field rather than a subtype.", "draft や final などの制御状態で、下位概念ではなくフィールドです。", { required: true })
    ],
    constraints: [c("artifact-revision-immutable", "changing content_hash requires a new version", "内容变化必须产生新版本，不得原地覆盖。", "A content change must create a new version rather than overwrite the revision in place.", "内容変更は新しいバージョンを生成し、同じリビジョンを上書きしてはなりません。")],
    relations: [r("artifact-generated-by-attempt", "generated_by", "RunAttempt", "产物必须可追溯到生成它的执行尝试。", "An artifact is traceable to the run attempt that generated it.", "成果物は生成した実行試行まで追跡できます。")],
  }),

  p({
    moduleId: "info-container-command",
    conceptId: "ExecutionObservation",
    sourceId: "eng-proto-cloudevents",
    identityKeys: ["observation_id"],
    fields: [
      f("observation_id", "观测标识", "observation ID", "観測 ID", "string", "obs-command-001", "稳定标识一次执行结果观测。", "Stable identifier for one observation of an execution result.", "一つの実行結果観測を安定して識別します。", { required: true }),
      f("observed_at", "观测时间", "observed at", "観測時刻", "date-time", "2026-07-13T01:02:03.000Z", "形成该观测记录的 UTC 时间。", "UTC instant at which the observation record was formed.", "この観測記録が形成された UTC 時刻です。", { required: true })
    ],
    constraints: [c("execution-observation-result-bound", "an observation identifies exactly one observed execution result", "执行观测只能描述一个明确的执行结果。", "An execution observation describes exactly one identified execution result.", "実行観測は一つの明確な実行結果だけを記述します。")],
    relations: [r("execution-observation-observes-result", "observes", "ExecutionResult", "执行观测必须指向被观测的执行结果。", "An execution observation points to the execution result it observes.", "実行観測は観測対象の実行結果を指します。")],
  }),
  p({
    moduleId: "info-output-disclosure",
    conceptId: "OutputWindow",
    sourceId: "eng-fw-openai-python-docs",
    identityKeys: ["window_id"],
    fields: [
      f("window_id", "窗口标识", "window ID", "ウィンドウ ID", "string", "window-head-tail-001", "标识一次可审计的输出窗口选择。", "Identifies one auditable output-window selection.", "一つの監査可能な出力ウィンドウ選択を識別します。", { required: true }),
      f("length_limit", "长度上限", "length limit", "長さ上限", "integer", 4096, "允许窗口包含的最大字符、字节或 token 数，由 unit 字段解释。", "Maximum characters, bytes, or tokens admitted by the window, interpreted by unit.", "ウィンドウに含められる文字、バイト、トークンの最大数で、unit が解釈します。", { required: true }),
      f("unit", "计量单位", "unit", "単位", "string", "token", "length_limit 使用的受控计量单位。", "Controlled measurement unit used by length_limit.", "length_limit が用いる制御された計量単位です。", { required: true })
    ],
    constraints: [c("output-window-positive-limit", "length_limit is an integer greater than zero", "输出窗口上限必须为正整数。", "The output-window limit must be a positive integer.", "出力ウィンドウ上限は正の整数でなければなりません。")],
    relations: [r("output-window-selects-stream", "selects_from", "OutputStream", "输出窗口必须说明从哪个输出流选择内容。", "An output window identifies the output stream from which it selects content.", "出力ウィンドウは内容を選択する出力ストリームを示します。")],
  }),
  p({
    moduleId: "info-storage-sources",
    conceptId: "SourceReference",
    sourceId: "eng-ont-prov-o",
    locator: LOCATORS.ontology,
    identityKeys: ["reference_id"],
    fields: [
      f("reference_id", "引用标识", "reference ID", "参照 ID", "string", "source-ref-001", "稳定标识该引用记录，而不是被引用资源本身。", "Stable identifier for this reference record, not for the referent itself.", "参照対象そのものではなく、この参照記録を安定して識別します。", { required: true }),
      f("canonical_uri", "规范 URI", "canonical URI", "正規 URI", "uri", "https://example.org/docs/runbook", "在可用时定位被引用资源的规范 URI。", "Canonical URI locating the referenced resource when available.", "利用可能な場合に参照資源を特定する正規 URI です。")
    ],
    constraints: [c("source-reference-version-location", "a reference resolves to a referent and carries a version or immutable digest", "引用必须可解析到指称对象，并带版本或不可变摘要。", "A reference resolves to a referent and carries either a version or an immutable digest.", "参照は対象へ解決でき、バージョンまたは不変ダイジェストを持たなければなりません。")],
    relations: [r("source-reference-has-location", "located_at", "SourceLocation", "来源引用必须有可定位到原内容的位置。", "A source reference has a location that can resolve to the original content.", "出典参照には原内容へ解決可能な位置があります。")],
  }),
  p({
    moduleId: "info-content-block-modality",
    conceptId: "ContentBlock",
    sourceId: "eng-proto-mcp-spec",
    identityKeys: ["block_id"],
    fields: [
      f("block_id", "内容块标识", "content-block ID", "コンテンツブロック ID", "string", "block-text-001", "在其所属消息或内容包内稳定标识内容块。", "Stable identifier for the block within its containing message or content package.", "所属メッセージまたはコンテンツパッケージ内でブロックを安定して識別します。", { required: true }),
      f("mime_type", "媒体类型", "media type", "メディアタイプ", "string", "text/plain", "说明内容的互联网媒体类型；它是字段而非图节点。", "Internet media type of the content; it is a field rather than a graph node.", "内容のインターネットメディアタイプで、グラフノードではなくフィールドです。", { required: true }),
      f("encoding", "编码", "encoding", "エンコーディング", "string", "utf-8", "解释内容字节所用的字符或二进制编码。", "Character or binary encoding used to interpret the content bytes.", "内容バイトを解釈する文字またはバイナリエンコーディングです。")
    ],
    constraints: [c("content-block-modality-compatible", "mime_type and encoding are compatible with the most specific ContentBlock subtype", "媒体类型和编码必须与内容块最具体的模态下位类型兼容。", "mime_type and encoding must be compatible with the most specific ContentBlock subtype.", "mime_type と encoding は最も具体的な ContentBlock のモダリティ下位型と互換でなければなりません。")],
    relations: [r("content-block-has-source", "has_source_reference", "SourceReference", "可审计内容块必须指向其来源引用。", "An auditable content block points to its source reference.", "監査可能なコンテンツブロックは出典参照を指します。")],
  }),
  p({
    moduleId: "info-messages-instructions",
    conceptId: "Message",
    sourceId: "eng-proto-a2a-spec",
    identityKeys: ["message_id"],
    fields: [
      f("message_id", "消息标识", "message ID", "メッセージ ID", "string", "msg-20260714-001", "在协议或会话范围内稳定标识消息。", "Stable identifier for the message within its protocol or conversation scope.", "プロトコルまたは会話範囲内でメッセージを安定して識別します。", { required: true }),
      f("conversation_id", "会话标识", "conversation ID", "会話 ID", "string", "conversation-001", "关联消息所属会话的标识值，而非独立概念节点。", "Identifier value correlating the containing conversation, not a separate Concept node.", "所属会話を関連付ける識別値で、独立した概念ノードではありません。", { required: true }),
      f("sequence_index", "顺序索引", "sequence index", "順序インデックス", "integer", 7, "消息在所属会话顺序中的零基或协议规定索引。", "Protocol-defined or zero-based position of the message in its conversation order.", "会話順序におけるプロトコル定義またはゼロ始まりの位置です。", { required: true }),
      f("correlation_id", "关联标识", "correlation ID", "相関 ID", "string", "corr-tool-call-001", "把请求、响应和相关事件关联起来的可选标识。", "Optional identifier correlating requests, responses, and related events.", "要求、応答、関連イベントを関連付ける任意の識別子です。")
    ],
    constraints: [c("message-sequence-nonnegative", "sequence_index is a non-negative integer unique within conversation_id", "顺序索引必须为非负整数，且在同一会话中唯一。", "sequence_index is a non-negative integer unique within conversation_id.", "sequence_index は非負整数で、同じ conversation_id 内で一意でなければなりません。")],
    relations: [
      r("message-contains-content", "contains_content_block", "ContentBlock", "消息至少包含一个可解释的内容块。", "A message contains at least one interpretable content block.", "メッセージには少なくとも一つの解釈可能なコンテンツブロックが含まれます。", { max: null }),
      r("message-part-of-conversation", "part_of_conversation", "Conversation", "消息必须归属于一个会话。", "A message belongs to one conversation.", "メッセージは一つの会話に属します。"),
      r("message-replies-to", "replies_to", "Message", "回复消息通过关系指向被回复消息，而不是创建 ReplyTo 节点。", "A reply points to the replied-to Message through a relation rather than a ReplyTo node.", "返信は ReplyTo ノードを作らず、関係で返信先 Message を指します。", { min: 0 })
    ],
  }),
  p({
    moduleId: "info-indexing",
    conceptId: "DiscoveryResult",
    sourceId: "eng-ont-microsoft-fabric-iq-ontology",
    locator: LOCATORS.ontology,
    identityKeys: ["result_id"],
    fields: [
      f("result_id", "发现结果标识", "discovery-result ID", "探索結果 ID", "string", "discovery-result-001", "稳定标识一项轻量发现结果。", "Stable identifier for one lightweight discovery result.", "一つの軽量探索結果を安定して識別します。", { required: true }),
      f("rank", "排序位置", "rank", "順位", "integer", 1, "结果在同一查询候选列表中的一基排序位置。", "One-based ordering position of the result within one query's candidates.", "一つのクエリ候補内での一始まりの順位です。", { required: true })
    ],
    constraints: [c("discovery-result-positive-rank", "rank is an integer greater than or equal to one", "发现结果排序位置必须大于等于一。", "A discovery-result rank must be an integer greater than or equal to one.", "探索結果の順位は一以上の整数でなければなりません。")],
    relations: [r("discovery-result-recorded-by", "records", "LightweightRetrievalTrace", "每项发现结果必须能由轻量检索追踪重放。", "Each discovery result is replayable from a lightweight retrieval trace.", "各探索結果は軽量検索トレースから再現できます。", { direction: "incoming" })],
  }),

  p({
    moduleId: "memory-ingestion",
    conceptId: "IngestionRun",
    sourceId: "eng-fw-langgraph-docs",
    identityKeys: ["ingestion_run_id"],
    fields: [
      f("ingestion_run_id", "摄取运行标识", "ingestion-run ID", "取り込み実行 ID", "string", "ingestion-run-001", "稳定标识一次从来源到记忆写入的摄取运行。", "Stable identifier for one source-to-memory ingestion run.", "出典から記憶書き込みまでの一回の取り込み実行を安定して識別します。", { required: true }),
      f("started_at", "开始时间", "started at", "開始時刻", "date-time", "2026-07-13T02:00:00.000Z", "摄取运行开始的 UTC 时间。", "UTC instant at which ingestion started.", "取り込みが開始した UTC 時刻です。", { required: true })
    ],
    constraints: [c("ingestion-run-provenance-complete", "every produced MemoryRecord retains the source and loader provenance of this run", "每个产出的记忆记录必须保留本次运行的来源和加载器谱系。", "Every produced MemoryRecord retains the source and loader provenance of this run.", "生成された各 MemoryRecord はこの実行の出典とローダー来歴を保持します。")],
    relations: [r("ingestion-run-writes-memory", "writes", "MemoryRecord", "成功的摄取运行至少写入一条可追溯的记忆记录。", "A successful ingestion run writes at least one traceable memory record.", "成功した取り込み実行は少なくとも一つの追跡可能な記憶記録を書き込みます。", { max: null })],
  }),
  p({
    moduleId: "memory-stores-scopes",
    conceptId: "MemoryRecord",
    sourceId: "lit-agent-evo-memory",
    locator: LOCATORS.literature,
    identityKeys: ["memory_record_id", "version"],
    fields: [
      f("memory_record_id", "记忆记录标识", "memory-record ID", "記憶記録 ID", "string", "memory-record-001", "稳定标识跨不可变版本的逻辑记忆记录。", "Stable identifier for the logical memory record across immutable versions.", "不変バージョンにまたがる論理記憶記録を安定して識別します。", { required: true }),
      f("version", "版本", "version", "バージョン", "integer", 4, "标识一项不可变记忆记录版本的递增值。", "Monotonic value identifying one immutable version of the memory record.", "記憶記録の一つの不変バージョンを識別する単調増加値です。", { required: true }),
      f("memory_kind", "记忆种类", "memory kind", "記憶種別", "string", ["SemanticMemory", "ReflectiveMemory"], "可组合标注情景、语义、程序、反思、偏好或经验种类。", "Composable tags for episodic, semantic, procedural, reflective, preference, or experience kind.", "エピソード、意味、手続き、内省、選好、経験の種別を組み合わせて示します。", { required: true, repeatable: true }),
      f("memory_scope", "记忆范围", "memory scope", "記憶スコープ", "string", ["TaskMemory", "CrossSessionMemory"], "可组合标注记录适用的会话、任务或跨会话范围。", "Composable session, task, or cross-session applicability scopes.", "セッション、タスク、セッション横断の適用範囲を組み合わせて示します。", { required: true, repeatable: true }),
      f("valid_from", "有效起点", "valid from", "有効開始", "date-time", "2026-07-13T02:05:00.000Z", "该版本开始适用于推理或上下文组装的 UTC 时间。", "UTC instant from which this version is valid for reasoning or context assembly.", "このバージョンが推論またはコンテキスト組み立てに有効となる UTC 時刻です。", { required: true }),
      f("valid_until", "有效终点", "valid until", "有効終了", "date-time", null, "该版本停止适用的 UTC 时间；当前版本为空。", "UTC instant after which this version is no longer valid; null for the current version.", "このバージョンが無効となる UTC 時刻で、現行版は空です。"),
      f("confidence", "置信度", "confidence", "信頼度", "number", 0.92, "记录内容在写入或验证时得到的零到一置信度。", "Zero-to-one confidence assigned when the record was written or validated.", "記録の書き込みまたは検証時に割り当てたゼロから一の信頼度です。", { required: true }),
      f("provenance_ref", "谱系引用", "provenance reference", "来歴参照", "string", "source-ref-001#span-4", "指向支持该记忆内容的不可变来源与位置。", "Points to the immutable source and location supporting the memory content.", "記憶内容を支持する不変の出典と位置を指します。", { required: true }),
      f("access_policy_id", "访问策略标识", "access-policy ID", "アクセス方針 ID", "string", "memory-policy-project-private", "标识读取、更新和披露该记录时适用的策略。", "Identifies the policy governing read, update, and disclosure of this record.", "記録の読み取り、更新、開示を統制する方針を識別します。", { required: true })
    ],
    constraints: [
      c("memory-record-version-immutable", "an update creates a new version and never changes an existing version in place", "更新必须创建新版本，禁止原地修改既有记忆版本。", "An update creates a new version and never changes an existing memory version in place.", "更新は新しいバージョンを作成し、既存の記憶バージョンをその場で変更してはなりません。"),
      c("memory-record-valid-confidence", "confidence is between zero and one, and valid_until is absent or no earlier than valid_from", "置信度必须位于零到一，且有效终点不得早于起点。", "Confidence is between zero and one, and valid_until is absent or no earlier than valid_from.", "confidence はゼロ以上一以下で、valid_until は空または valid_from 以後です。")
    ],
    relations: [
      r("memory-record-owned-by", "owned_by", "Actor", "记忆记录必须有可审计的责任主体。", "A memory record has an auditable responsible actor.", "記憶記録には監査可能な責任アクターがあります。"),
      r("memory-record-scoped-by", "scoped_by", "MemoryScope", "记忆记录必须明确适用范围。", "A memory record identifies its applicability scope.", "記憶記録は適用範囲を明示します。"),
      r("memory-record-member-of-namespace", "member_of", "MemoryNamespace", "记忆记录必须属于一个命名空间。", "A memory record belongs to one namespace.", "記憶記録は一つの名前空間に属します。"),
      r("memory-record-governed-by-retention", "governed_by", "MemoryRetentionPolicy", "记忆记录必须受保留策略约束。", "A memory record is governed by a retention policy.", "記憶記録は保持方針により統制されます。")
    ],
  }),
  p({
    moduleId: "memory-chunking-situating",
    conceptId: "Chunk",
    sourceId: "eng-fw-langgraph-docs",
    identityKeys: ["chunk_id"],
    fields: [
      f("chunk_id", "分块标识", "chunk ID", "チャンク ID", "string", "chunk-doc-001-04", "在来源文档版本内稳定标识该分块。", "Stable identifier for the chunk within a source-document version.", "出典文書バージョン内でチャンクを安定して識別します。", { required: true }),
      f("ordinal", "分块序号", "ordinal", "チャンク順序", "integer", 4, "分块在来源文档中的零基顺序位置。", "Zero-based order of the chunk in its source document.", "出典文書内でのゼロ始まりのチャンク順序です。", { required: true })
    ],
    constraints: [c("chunk-source-span-required", "the chunk boundary resolves to a non-empty span in exactly one source document version", "分块边界必须解析到一个来源文档版本中的非空区间。", "The chunk boundary resolves to a non-empty span in exactly one source-document version.", "チャンク境界は一つの出典文書バージョン内の空でない範囲へ解決されます。")],
    relations: [r("chunk-derived-from-document", "chunk_derived_from_document", "Document", "分块必须能追溯到被切分的来源文档。", "A chunk is traceable to the source document from which it was segmented.", "チャンクは分割元の出典文書まで追跡できます。")],
  }),
  p({
    moduleId: "memory-embedding-indexes",
    conceptId: "IndexVersion",
    sourceId: "lit-agent-memory-as-action",
    locator: LOCATORS.literature,
    identityKeys: ["index_id", "version"],
    fields: [
      f("index_id", "索引标识", "index ID", "インデックス ID", "string", "memory-index-main", "稳定标识跨版本的逻辑索引。", "Stable identifier for the logical index across versions.", "複数バージョンにまたがる論理インデックスを安定して識別します。", { required: true }),
      f("version", "索引版本", "index version", "インデックスバージョン", "string", "2026-07-13.3", "标识一项不可变索引快照的版本值。", "Version value identifying one immutable index snapshot.", "一つの不変インデックススナップショットを識別します。", { required: true }),
      f("built_at", "构建时间", "built at", "構築時刻", "date-time", "2026-07-13T02:10:00.000Z", "该索引版本完成构建的 UTC 时间。", "UTC instant at which this index version finished building.", "このインデックスバージョンの構築が完了した UTC 時刻です。", { required: true })
    ],
    constraints: [c("index-version-immutable", "refresh creates a new IndexVersion and preserves the superseded version", "索引刷新必须创建新版本并保留被替代版本。", "An index refresh creates a new IndexVersion and preserves the superseded version.", "インデックス更新は新しい IndexVersion を作成し、置換前のバージョンを保持します。")],
    relations: [r("index-version-version-of", "version_of", "Index", "索引版本必须指向其所属的逻辑索引。", "An index version points to the logical index it versions.", "インデックスバージョンは対応する論理インデックスを指します。")],
  }),
  p({
    moduleId: "memory-retrieval-ranking",
    conceptId: "RetrievalQuery",
    sourceId: "lit-agent-memory-as-action",
    locator: LOCATORS.literature,
    identityKeys: ["query_id"],
    fields: [
      f("query_id", "检索查询标识", "retrieval-query ID", "検索クエリ ID", "string", "retrieval-query-001", "稳定标识一次可重放的记忆检索查询。", "Stable identifier for one replayable memory-retrieval query.", "一つの再現可能な記憶検索クエリを安定して識別します。", { required: true }),
      f("query_text", "查询文本", "query text", "クエリテキスト", "string", "Which policy governed the last tool call?", "提交给检索阶段的规范化查询文本。", "Normalized query text submitted to retrieval.", "検索へ送られた正規化済みクエリテキストです。", { required: true }),
      f("top_k", "返回上限", "top k", "上位 k 件", "integer", 8, "选择阶段最多保留的候选数量。", "Maximum candidate count retained by the selection stage.", "選択段階が保持する候補数の上限です。", { required: true })
    ],
    constraints: [c("retrieval-query-positive-top-k", "top_k is an integer greater than zero", "检索返回上限必须为正整数。", "top_k must be an integer greater than zero.", "top_k は正の整数でなければなりません。")],
    relations: [r("retrieval-query-queries-version", "queries", "IndexVersion", "查询必须固定到一个可重放的索引版本。", "A retrieval query is pinned to one replayable index version.", "検索クエリは一つの再現可能なインデックスバージョンに固定されます。")],
  }),
  p({
    moduleId: "memory-context",
    conceptId: "ContextAssembly",
    sourceId: "eng-fw-langgraph-docs",
    identityKeys: ["assembly_id"],
    fields: [
      f("assembly_id", "上下文组装标识", "context-assembly ID", "コンテキスト組み立て ID", "string", "context-assembly-001", "稳定标识一次上下文选择、排序和预算应用活动。", "Stable identifier for one context selection, ordering, and budgeting activity.", "一回のコンテキスト選択、順序付け、予算適用活動を安定して識別します。", { required: true }),
      f("context_version", "上下文版本", "context version", "コンテキストバージョン", "string", "ctx-v12", "标识该活动产出的不可变上下文快照版本。", "Identifies the immutable context-snapshot version produced by this activity.", "この活動が生成した不変コンテキストスナップショットのバージョンです。", { required: true })
    ],
    constraints: [c("context-assembly-budget-complete", "every included source is ordered and counted against the applied ContextBudget", "每个纳入来源都必须有顺序并计入所用上下文预算。", "Every included source is ordered and counted against the applied ContextBudget.", "採用された各出典は順序付けされ、適用された ContextBudget に計上されます。")],
    relations: [r("context-assembly-produces-package", "produces", "ContextPackage", "上下文组装必须产出唯一规范的 ContextPackage，而不复制其定义。", "Context assembly produces the uniquely owned ContextPackage without duplicating its definition.", "コンテキスト組み立ては定義を複製せず、唯一所有される ContextPackage を生成します。")],
  }),
  p({
    moduleId: "memory-lifecycle",
    conceptId: "MemoryOperation",
    sourceId: "lit-agent-evo-memory",
    locator: LOCATORS.literature,
    identityKeys: ["operation_id"],
    fields: [
      f("operation_id", "操作标识", "operation ID", "操作 ID", "string", "memory-op-update-001", "稳定标识一次记忆生命周期操作。", "Stable identifier for one memory-lifecycle operation.", "一回の記憶ライフサイクル操作を安定して識別します。", { required: true }),
      f("occurred_at", "发生时间", "occurred at", "発生時刻", "date-time", "2026-07-13T02:15:00.000Z", "操作生效的 UTC 时间。", "UTC instant at which the operation took effect.", "操作が発効した UTC 時刻です。", { required: true }),
      f("reason", "操作原因", "operation reason", "操作理由", "string", "superseded by corrected provenance", "说明为何执行该生命周期操作的可审计原因。", "Auditable reason for performing the lifecycle operation.", "ライフサイクル操作を行った監査可能な理由です。", { required: true }),
      f("actor_id", "执行主体标识", "actor ID", "実行アクター ID", "string", "actor-memory-service", "标识发起或执行该记忆操作的主体。", "Identifies the actor that initiated or performed the memory operation.", "記憶操作を開始または実行したアクターを識別します。", { required: true }),
      f("policy_id", "策略标识", "policy ID", "方針 ID", "string", "memory-retention-policy-3", "标识授权并约束该操作的策略版本。", "Identifies the policy version authorizing and constraining the operation.", "操作を認可し制約する方針バージョンを識別します。", { required: true }),
      f("input_version", "输入版本", "input version", "入力バージョン", "integer", 3, "操作读取的记忆记录版本。", "Memory-record version read by the operation.", "操作が読み取った記憶記録バージョンです。", { required: true }),
      f("output_version", "输出版本", "output version", "出力バージョン", "integer", 4, "操作产生的新记忆记录版本；删除也以墓碑版本表达。", "New memory-record version produced by the operation; deletion is represented by a tombstone version.", "操作が生成した新しい記憶記録バージョンで、削除も墓石バージョンとして表します。", { required: true }),
      f("result_status", "操作结果", "result status", "操作結果", "string", "succeeded", "操作成功、失败、冲突或跳过的受控结果。", "Controlled succeeded, failed, conflicted, or skipped result of the operation.", "操作の succeeded、failed、conflicted、skipped の制御結果です。", { required: true }),
      f("error_code", "错误代码", "error code", "エラーコード", "string", null, "操作失败时的机器可读错误代码；成功时为空。", "Machine-readable error code when the operation fails; null on success.", "操作失敗時の機械可読エラーコードで、成功時は空です。")
    ],
    constraints: [c("memory-operation-version-transition", "a mutating operation records input_version and a distinct output_version", "产生修改的操作必须记录输入版本和不同的输出版本。", "A mutating operation records an input version and a distinct output version.", "変更を伴う操作は入力バージョンと異なる出力バージョンを記録します。")],
    relations: [r("memory-operation-acts-on-record", "acts_on", "MemoryRecord", "记忆操作必须明确作用于哪条记忆记录。", "A memory operation identifies the memory record on which it acts.", "記憶操作は対象となる記憶記録を明示します。")],
  }),

  p({
    moduleId: "orchestration-task-planning",
    conceptId: "Task",
    sourceId: "lit-agent-conductor",
    locator: LOCATORS.literature,
    identityKeys: ["task_id"],
    fields: [
      f("task_id", "任务标识", "task ID", "タスク ID", "string", "task-audit-001", "在计划和执行谱系中稳定标识任务。", "Stable identifier for the task across its planning and execution lineage.", "計画と実行の系譜にまたがってタスクを安定して識別します。", { required: true }),
      f("status", "任务状态", "task status", "タスク状態", "string", "ready", "任务在受控工作流生命周期中的当前状态。", "Current state of the task in its controlled workflow lifecycle.", "制御されたワークフローライフサイクル上のタスクの現在状態です。", { required: true }),
      f("priority", "优先级", "priority", "優先度", "integer", 2, "调度时用于比较任务的显式优先级；数值语义由项目策略规定。", "Explicit scheduling priority; the project policy defines its numeric ordering.", "スケジューリングで用いる明示的優先度で、数値順序はプロジェクト方針が定めます。", { required: true }),
      f("constraint_summary", "约束摘要", "constraint summary", "制約要約", "string", "finish before release cutoff without external write access", "以可读形式概括执行任务时必须满足的主要约束。", "Human-readable summary of the principal constraints governing task execution.", "タスク実行を統制する主要制約の可読要約です。", { required: true })
    ],
    constraints: [c("task-completion-evidenced", "status=completed only when a TaskCompletionCriterion is satisfied by an outcome", "只有结果满足任务完成标准时，任务状态才能为已完成。", "A task may be completed only when an outcome satisfies its TaskCompletionCriterion.", "結果が TaskCompletionCriterion を満たす場合にのみタスクを完了状態にできます。")],
    relations: [
      r("task-has-completion-criterion", "has_completion_criterion", "TaskCompletionCriterion", "任务必须有至少一个可判定的完成标准。", "A task has at least one decidable completion criterion.", "タスクには少なくとも一つの判定可能な完了基準があります。", { max: null }),
      r("task-constrained-by", "constrained_by", "TaskConstraint", "任务必须明确其适用约束。", "A task identifies its applicable constraints.", "タスクは適用される制約を明示します。", { max: null })
    ],
  }),
  p({
    moduleId: "orchestration-task-planning",
    conceptId: "TaskPlan",
    sourceId: "lit-agent-conductor",
    locator: LOCATORS.literature,
    identityKeys: ["plan_id", "version"],
    fields: [
      f("plan_id", "计划标识", "plan ID", "計画 ID", "string", "plan-audit-001", "稳定标识跨修订的逻辑任务计划。", "Stable identifier for the logical task plan across revisions.", "複数リビジョンにまたがる論理タスク計画を安定して識別します。", { required: true }),
      f("version", "计划版本", "plan version", "計画バージョン", "integer", 3, "标识一项不可变任务计划修订版。", "Identifies one immutable revision of the task plan.", "一つの不変タスク計画リビジョンを識別します。", { required: true }),
      f("status", "计划状态", "plan status", "計画状態", "string", "approved", "说明计划处于草拟、审查、批准、执行或关闭等受控状态。", "Controlled state such as drafted, reviewed, approved, executing, or closed.", "drafted、reviewed、approved、executing、closed などの制御状態です。", { required: true }),
      f("created_at", "创建时间", "created at", "作成時刻", "date-time", "2026-07-13T03:00:00.000Z", "该计划版本形成的 UTC 时间。", "UTC instant at which this plan version was created.", "この計画バージョンが作成された UTC 時刻です。", { required: true })
    ],
    constraints: [c("task-plan-version-immutable", "changing steps or dependencies creates a new plan version", "修改步骤或依赖必须生成新计划版本。", "Changing steps or dependencies creates a new plan version.", "ステップまたは依存関係の変更は新しい計画バージョンを生成します。")],
    relations: [r("task-plan-contains-step", "contains_step", "TaskStep", "任务计划至少包含一个有序步骤。", "A task plan contains at least one ordered task step.", "タスク計画には少なくとも一つの順序付きタスクステップが含まれます。", { max: null })],
  }),
  p({
    moduleId: "orchestration-actors-delegation",
    conceptId: "DelegationContract",
    sourceId: "eng-fw-openai-handoffs",
    identityKeys: ["delegation_id"],
    fields: [
      f("delegation_id", "委托标识", "delegation ID", "委譲 ID", "string", "delegation-001", "稳定标识委托方、受托方与工作范围之间的一次委托合同。", "Stable identifier for one delegation contract among delegator, delegatee, and work scope.", "委譲者、受任者、作業範囲の間の一つの委譲契約を安定して識別します。", { required: true }),
      f("status", "委托状态", "delegation status", "委譲状態", "string", "active", "委托合同在提议、接受、活动、完成或撤销生命周期中的状态。", "State in the proposed, accepted, active, completed, or revoked delegation lifecycle.", "proposed、accepted、active、completed、revoked の委譲ライフサイクル状態です。", { required: true }),
      f("created_at", "创建时间", "created at", "作成時刻", "date-time", "2026-07-13T03:05:00.000Z", "委托合同形成的 UTC 时间。", "UTC instant at which the delegation contract was formed.", "委譲契約が成立した UTC 時刻です。", { required: true }),
      f("delegator_id", "委托方标识", "delegator ID", "委譲者 ID", "string", "actor-orchestrator-001", "标识发出委托并承担授权责任的主体。", "Identifies the actor issuing the delegation and bearing authorization responsibility.", "委譲を発行し認可責任を負うアクターを識別します。", { required: true }),
      f("delegatee_id", "受托方标识", "delegatee ID", "受任者 ID", "string", "actor-worker-007", "标识接受委托并负责执行的主体。", "Identifies the actor accepting the delegation and responsible for performance.", "委譲を受け入れ実行責任を負うアクターを識別します。", { required: true }),
      f("task_id", "任务标识", "task ID", "タスク ID", "string", "task-audit-001", "固定本次委托所覆盖的任务。", "Pins the task covered by this delegation.", "この委譲が対象とするタスクを固定します。", { required: true }),
      f("budget_id", "预算标识", "budget ID", "予算 ID", "string", "delegation-budget-001", "标识限制受托执行的时间、成本或工具预算。", "Identifies the time, cost, or tool budget limiting delegated performance.", "委譲実行を制限する時間、コスト、ツール予算を識別します。", { required: true })
    ],
    constraints: [c("delegation-contract-bounded-authority", "delegated authority is no broader than the delegator's authority and the stated task scope", "被委托权限不得超出委托方权限或约定任务范围。", "Delegated authority is no broader than the delegator's authority or the stated task scope.", "委譲権限は委譲者の権限または明示されたタスク範囲を超えてはなりません。")],
    relations: [
      r("delegation-contract-grants-authority", "grants", "DelegatedAuthority", "委托合同必须明确授予的权限范围。", "A delegation contract identifies the authority it grants.", "委譲契約は付与する権限範囲を明示します。"),
      r("delegation-contract-constrained-budget", "constrained_by_budget", "DelegationBudget", "委托合同必须明确执行预算。", "A delegation contract identifies its execution budget.", "委譲契約は実行予算を明示します。")
    ],
  }),
  p({
    moduleId: "orchestration-routing-control",
    conceptId: "RoutingDecision",
    sourceId: "eng-fw-langgraph-graph-api",
    identityKeys: ["decision_id"],
    fields: [
      f("decision_id", "路由决定标识", "routing-decision ID", "ルーティング判断 ID", "string", "route-decision-001", "稳定标识一次可重放的路由选择。", "Stable identifier for one replayable routing choice.", "一つの再現可能なルーティング選択を安定して識別します。", { required: true }),
      f("decided_at", "决定时间", "decided at", "判断時刻", "date-time", "2026-07-13T03:06:00.000Z", "路由选择生效的 UTC 时间。", "UTC instant at which the routing choice took effect.", "ルーティング選択が発効した UTC 時刻です。", { required: true }),
      f("reason", "选择理由", "selection reason", "選択理由", "string", "policy condition matched retryable branch", "解释条件和策略如何支持所选目标。", "Explains how evaluated conditions and policy support the selected target.", "評価条件と方針が選択対象をどのように支持したかを説明します。", { required: true })
    ],
    constraints: [c("routing-decision-single-target", "a completed decision selects exactly one target unless its policy explicitly permits fan-out", "完成的路由决定只选择一个目标，除非策略明确允许扇出。", "A completed routing decision selects exactly one target unless its policy explicitly permits fan-out.", "完了したルーティング判断は、方針が明示的にファンアウトを許す場合を除き、一つの対象だけを選択します。")],
    relations: [r("routing-decision-selects-target", "selects", "RoutingTarget", "路由决定必须指向被选择的目标。", "A routing decision points to the target it selects.", "ルーティング判断は選択した対象を指します。")],
  }),
  p({
    moduleId: "orchestration-composition",
    conceptId: "OrchestrationTopology",
    sourceId: "eng-fw-maf-workflows",
    identityKeys: ["topology_id", "version"],
    fields: [
      f("topology_id", "拓扑标识", "topology ID", "トポロジー ID", "string", "topology-review-pipeline", "稳定标识跨修订的静态编排拓扑。", "Stable identifier for the static orchestration topology across revisions.", "複数リビジョンにまたがる静的オーケストレーショントポロジーを安定して識別します。", { required: true }),
      f("version", "拓扑版本", "topology version", "トポロジーバージョン", "integer", 2, "标识一项不可变拓扑规约修订版。", "Identifies one immutable revision of the topology specification.", "一つの不変トポロジー仕様リビジョンを識別します。", { required: true }),
      f("failure_policy", "失败策略", "failure policy", "失敗方針", "string", "stop-and-escalate", "说明任一组成部分失败时拓扑如何停止、重试或降级。", "States how the topology stops, retries, or degrades when a part fails.", "構成要素が失敗したときに停止、再試行、縮退する方法を示します。", { required: true })
    ],
    constraints: [c("orchestration-topology-acyclic-where-required", "sequential composition edges are acyclic unless an explicit bounded loop is declared", "顺序组合边必须无环，除非明确声明有界循环。", "Sequential composition edges are acyclic unless an explicit bounded loop is declared.", "順次構成辺は、明示的な有界ループが宣言されない限り非循環です。")],
    relations: [r("orchestration-topology-uses-pattern", "uses_pattern", "CompositionPattern", "编排拓扑必须使用至少一种明确的组合模式。", "An orchestration topology uses at least one explicit composition pattern.", "オーケストレーショントポロジーは少なくとも一つの明示的構成パターンを使用します。", { max: null })],
  }),
  p({
    moduleId: "orchestration-evaluation",
    conceptId: "ImprovementLoop",
    sourceId: "lit-mech-reflexion",
    locator: LOCATORS.literature,
    identityKeys: ["loop_id"],
    fields: [
      f("loop_id", "改进循环标识", "improvement-loop ID", "改善ループ ID", "string", "improvement-loop-001", "稳定标识一次有界的审核、修订与再尝试循环。", "Stable identifier for one bounded review, revision, and retry loop.", "一つの有界なレビュー、改訂、再試行ループを安定して識別します。", { required: true }),
      f("maximum_attempts", "最大尝试数", "maximum attempts", "最大試行数", "integer", 3, "循环在强制停止前允许包含的尝试上限。", "Maximum attempts the loop may contain before forced stopping.", "強制停止までにループが含められる試行数の上限です。", { required: true }),
      f("status", "循环状态", "loop status", "ループ状態", "string", "running", "说明循环处于活动、成功、失败、预算停止或人工停止状态。", "Whether the loop is active, succeeded, failed, budget-stopped, or human-stopped.", "ループが active、succeeded、failed、budget-stopped、human-stopped のいずれかを示します。", { required: true }),
      f("evaluated_subject_id", "被评对象标识", "evaluated-subject ID", "評価対象 ID", "string", "artifact-report-001@3", "固定循环正在改进的对象版本。", "Pins the subject version being improved by the loop.", "ループが改善する対象バージョンを固定します。", { required: true }),
      f("stop_reason", "停止原因", "stop reason", "停止理由", "string", null, "循环进入终态时记录成功、失败、预算、安全或人工停止原因。", "Success, failure, budget, safety, or human reason recorded when the loop terminates.", "ループ終端時に記録する成功、失敗、予算、安全、人間による停止理由です。")
    ],
    constraints: [c("improvement-loop-bounded", "maximum_attempts is positive and the loop stops no later than that count", "最大尝试数必须为正，且循环不得超过该上限。", "maximum_attempts is positive and the loop stops no later than that count.", "maximum_attempts は正で、ループはその回数までに停止しなければなりません。")],
    relations: [
      r("improvement-loop-contains-attempt", "contains_attempt", "ImprovementAttempt", "改进循环至少包含一次可追踪的改进尝试。", "An improvement loop contains at least one traceable improvement attempt.", "改善ループには少なくとも一つの追跡可能な改善試行が含まれます。", { max: null }),
      r("improvement-loop-uses-revision", "uses_revision", "RevisionPlan", "每次新尝试必须能追溯到适用的修订计划。", "Each new attempt is traceable to its applicable revision plan.", "各新規試行は適用された改訂計画まで追跡できます。", { max: null })
    ],
  }),

  p({
    moduleId: "tool-registry-definition",
    conceptId: "ToolDefinition",
    sourceId: "eng-fw-openai-tools",
    identityKeys: ["definition_id", "version"],
    fields: [
      f("definition_id", "定义标识", "definition ID", "定義 ID", "string", "tool-def-search-001", "稳定标识跨版本的逻辑工具定义。", "Stable identifier for the logical tool definition across versions.", "複数バージョンにまたがる論理ツール定義を安定して識別します。", { required: true }),
      f("name", "工具名称", "tool name", "ツール名", "string", "search_documents", "调用方用于引用工具的稳定名称。", "Stable name by which callers refer to the tool.", "呼び出し側がツールを参照する安定した名称です。", { required: true }),
      f("version", "定义版本", "definition version", "定義バージョン", "string", "2.1.0", "标识参数、结果和权限合同的一项不可变版本。", "Identifies one immutable version of the argument, result, and permission contract.", "引数、結果、権限契約の一つの不変バージョンを識別します。", { required: true }),
      f("argument_schema", "参数结构", "argument structure", "引数構造", "object", { type: "object", required: ["query"] }, "作为节点信息内嵌的参数结构，不生成 Schema 图节点。", "Argument structure embedded as node information; it does not create a Schema graph node.", "ノード情報として埋め込む引数構造で、Schema グラフノードを作りません。", { required: true }),
      f("result_schema", "结果结构", "result structure", "結果構造", "object", { type: "array", items: { type: "object" } }, "作为节点信息内嵌的返回结构，不生成 Schema 图节点。", "Result structure embedded as node information; it does not create a Schema graph node.", "ノード情報として埋め込む結果構造で、Schema グラフノードを作りません。", { required: true })
    ],
    constraints: [c("tool-definition-versioned-contract", "a breaking argument or result change requires a new definition version", "参数或结果的不兼容变更必须产生新定义版本。", "A breaking argument or result change requires a new definition version.", "引数または結果の互換性を壊す変更には新しい定義バージョンが必要です。")],
    relations: [r("tool-definition-describes-tool", "describes", "Tool", "工具定义必须指向其描述的工具。", "A tool definition points to the tool it describes.", "ツール定義は記述対象のツールを指します。")],
  }),
  p({
    moduleId: "tool-discovery-selection",
    conceptId: "SelectionDecision",
    sourceId: "lit-agent-toolorchestra",
    locator: LOCATORS.literature,
    identityKeys: ["selection_id"],
    fields: [
      f("selection_id", "选择决定标识", "selection-decision ID", "選択判断 ID", "string", "selection-tool-001", "稳定标识一次候选评估和选择决定。", "Stable identifier for one candidate assessment and selection decision.", "一回の候補評価と選択判断を安定して識別します。", { required: true }),
      f("decided_at", "决定时间", "decided at", "判断時刻", "date-time", "2026-07-13T03:20:00.000Z", "选择决定生效的 UTC 时间。", "UTC instant at which the selection decision took effect.", "選択判断が発効した UTC 時刻です。", { required: true }),
      f("reason", "选择理由", "selection reason", "選択理由", "string", "best capability match after permission filtering", "解释被选候选和被拒候选的评分、权限与策略依据。", "Explains the score, permission, and policy basis for selecting and rejecting candidates.", "候補の選択と拒否に関するスコア、権限、方針の根拠を説明します。", { required: true })
    ],
    constraints: [c("selection-decision-candidate-membership", "the selected candidate belongs to the evaluated candidate set and passed applicable permission filters", "被选候选必须属于已评估候选集并通过权限筛选。", "The selected candidate belongs to the evaluated candidate set and passed applicable permission filters.", "選択候補は評価済み候補集合に属し、適用される権限フィルターを通過していなければなりません。")],
    relations: [r("selection-decision-selects-candidate", "selects_candidate", "Candidate", "选择决定必须指向一个被评估候选。", "A selection decision points to one evaluated candidate.", "選択判断は一つの評価済み候補を指します。")],
  }),
  p({
    moduleId: "tool-invocation-execution",
    conceptId: "ToolCall",
    sourceId: "eng-fw-openai-tools",
    identityKeys: ["call_id"],
    fields: [
      f("call_id", "调用标识", "tool-call ID", "ツール呼び出し ID", "string", "tool-call-001", "稳定标识一次逻辑工具调用，重试尝试共享该调用标识。", "Stable identifier for one logical tool call shared by its retry attempts.", "再試行の各試行が共有する一つの論理ツール呼び出しを安定して識別します。", { required: true }),
      f("arguments", "调用参数", "arguments", "呼び出し引数", "object", { query: "ontology closure" }, "按所引用工具定义验证的结构化参数值。", "Structured argument values validated against the referenced ToolDefinition.", "参照する ToolDefinition に対して検証された構造化引数値です。", { required: true }),
      f("requested_at", "请求时间", "requested at", "要求時刻", "date-time", "2026-07-13T03:21:00.000Z", "调用被请求的 UTC 时间。", "UTC instant at which the call was requested.", "呼び出しが要求された UTC 時刻です。", { required: true }),
      f("idempotency_key", "幂等键", "idempotency key", "冪等キー", "string", "idem-task-audit-search", "在工具支持时用于阻止重复副作用的调用方键。", "Caller-provided key preventing duplicate effects when supported by the tool.", "ツールが対応する場合に重複副作用を防ぐ呼び出し側キーです。"),
      f("caller_id", "调用方标识", "caller ID", "呼び出し元 ID", "string", "actor-orchestrator-001", "标识请求该工具调用的主体。", "Identifies the actor requesting the tool call.", "ツール呼び出しを要求したアクターを識別します。", { required: true }),
      f("operation_id", "操作标识", "operation ID", "操作 ID", "string", "search_documents", "固定本次调用要执行的工具操作。", "Pins the tool operation to execute for this call.", "この呼び出しで実行するツール操作を固定します。", { required: true })
    ],
    constraints: [c("tool-call-arguments-conform", "arguments conform to the ToolDefinition version selected by the call plan", "调用参数必须符合调用计划选定的工具定义版本。", "Arguments conform to the ToolDefinition version selected by the call plan.", "呼び出し引数は呼び出し計画が選択した ToolDefinition バージョンに適合します。")],
    relations: [
      r("tool-call-invokes-tool", "invokes_tool", "Tool", "工具调用必须指向被调用的工具。", "A tool call points to the tool it invokes.", "ツール呼び出しは呼び出すツールを指します。"),
      r("tool-call-has-attempt", "has_attempt", "ToolCallAttempt", "工具调用至少包含一次实际执行尝试。", "A tool call contains at least one actual execution attempt.", "ツール呼び出しには少なくとも一つの実際の実行試行が含まれます。", { max: null }),
      r("tool-call-policy-decision", "tool_call_evaluated_by_policy_decision", "PolicyDecision", "执行前必须有适用的策略决定。", "A tool call has an applicable policy decision before execution.", "実行前に適用されるポリシー判断があります。"),
      r("tool-call-sandbox", "tool_call_executes_in_sandbox", "Sandbox", "有执行副作用的工具调用必须指定沙箱。", "A tool call with execution effects identifies its sandbox.", "実行副作用を持つツール呼び出しはサンドボックスを明示します。", { min: 0 }),
      r("tool-call-permission", "tool_call_requires_permission_scope", "PermissionScope", "工具调用必须声明所需权限范围。", "A tool call declares its required permission scope.", "ツール呼び出しは必要な権限範囲を宣言します。", { max: null })
    ],
  }),
  p({
    moduleId: "tool-invocation-execution",
    conceptId: "ToolCallAttempt",
    sourceId: "eng-fw-openai-tools",
    identityKeys: ["attempt_id"],
    fields: [
      f("attempt_id", "调用尝试标识", "attempt ID", "呼び出し試行 ID", "string", "tool-attempt-001-2", "稳定标识一次实际执行尝试；每次重试获得新标识。", "Stable identifier for one actual execution attempt; every retry gets a new identifier.", "一回の実際の実行試行を安定して識別し、再試行ごとに新しい識別子を持ちます。", { required: true }),
      f("attempt_number", "尝试序号", "attempt number", "試行番号", "integer", 2, "同一逻辑调用中从一开始的尝试序号。", "One-based attempt number within the same logical call.", "同じ論理呼び出し内で一から始まる試行番号です。", { required: true }),
      f("started_at", "开始时间", "started at", "開始時刻", "date-time", "2026-07-13T03:21:02.000Z", "该执行尝试开始的 UTC 时间。", "UTC instant at which this execution attempt started.", "この実行試行が開始した UTC 時刻です。", { required: true }),
      f("status", "尝试状态", "attempt status", "試行状態", "string", "succeeded", "尝试的活动、成功、失败、超时或取消状态。", "Active, succeeded, failed, timed-out, or cancelled state of the attempt.", "試行の active、succeeded、failed、timed-out、cancelled 状態です。", { required: true }),
      f("timeout_ms", "超时毫秒", "timeout milliseconds", "タイムアウトミリ秒", "integer", 30000, "该尝试在被判定超时前允许运行的最大毫秒数。", "Maximum milliseconds this attempt may run before timing out.", "この試行がタイムアウトするまでに実行できる最大ミリ秒数です。", { required: true }),
      f("sandbox_id", "沙箱标识", "sandbox ID", "サンドボックス ID", "string", "sandbox-readonly-001", "标识隔离该尝试进程、文件系统和网络的沙箱。", "Identifies the sandbox isolating process, filesystem, and network for this attempt.", "試行のプロセス、ファイルシステム、ネットワークを隔離するサンドボックスを識別します。", { required: true }),
      f("authorization_id", "授权标识", "authorization ID", "認可 ID", "string", "authorization-tool-search-001", "标识本次尝试所依据的授权授予或批准。", "Identifies the authorization grant or approval governing this attempt.", "この試行を統制する認可付与または承認を識別します。", { required: true })
    ],
    constraints: [
      c("tool-attempt-terminal-evidence", "a terminal attempt has exactly one ToolResult or ToolError and never reuses an attempt_id", "终态尝试必须有一个结果或错误，且不得复用尝试标识。", "A terminal attempt has exactly one ToolResult or ToolError and never reuses an attempt_id.", "終端状態の試行は一つの ToolResult または ToolError を持ち、attempt_id を再利用しません。"),
      c("tool-attempt-positive-timeout", "attempt_number and timeout_ms are positive integers", "尝试序号和超时毫秒必须为正整数。", "attempt_number and timeout_ms are positive integers.", "attempt_number と timeout_ms は正の整数です。")
    ],
    relations: [
      r("tool-attempt-produces-result", "produces_result", "ToolResult", "成功的调用尝试必须产生一个工具结果。", "A successful tool-call attempt produces one tool result.", "成功したツール呼び出し試行は一つのツール結果を生成します。", { min: 0 }),
      r("tool-attempt-emits-error", "emits_diagnostic", "ToolError", "失败的调用尝试必须产生一个工具错误诊断。", "A failed tool-call attempt emits one tool-error diagnostic.", "失敗したツール呼び出し試行は一つのツールエラー診断を生成します。", { min: 0 })
    ],
  }),
  p({
    moduleId: "tool-invocation-execution",
    conceptId: "ToolResult",
    sourceId: "eng-fw-openai-tools",
    identityKeys: ["result_id"],
    fields: [
      f("result_id", "结果标识", "result ID", "結果 ID", "string", "tool-result-001", "稳定标识一次调用尝试返回的工具结果。", "Stable identifier for the tool result returned by one call attempt.", "一つの呼び出し試行が返したツール結果を安定して識別します。", { required: true }),
      f("status", "结果状态", "result status", "結果状態", "string", "success", "区分成功、部分成功或协议级失败结果。", "Distinguishes success, partial success, or protocol-level failure results.", "成功、部分成功、プロトコルレベル失敗の結果を区別します。", { required: true }),
      f("received_at", "接收时间", "received at", "受信時刻", "date-time", "2026-07-13T03:21:03.000Z", "结果被运行时接收的 UTC 时间。", "UTC instant at which the runtime received the result.", "ランタイムが結果を受信した UTC 時刻です。", { required: true }),
      f("payload_digest", "载荷摘要", "payload digest", "ペイロードダイジェスト", "string", "sha256:4c3f...", "结果原始载荷的不可变内容摘要，用于完整性和去重。", "Immutable content digest of the raw result payload for integrity and deduplication.", "完全性と重複排除のための結果生ペイロードの不変内容ダイジェストです。", { required: true })
    ],
    constraints: [c("tool-result-distinct-from-outcome", "result status records the invocation response and does not by itself assert task or run success", "工具结果状态只描述调用响应，不得自动断言任务或运行成功。", "Tool-result status records the invocation response and does not by itself assert task or run success.", "ツール結果状態は呼び出し応答を記録するだけで、タスクまたは実行の成功を自動的に表明しません。")],
    relations: [r("tool-result-produced-by-attempt", "produces_result", "ToolCallAttempt", "工具结果必须可回查到产生它的调用尝试。", "A tool result is traceable to the tool-call attempt that produced it.", "ツール結果は生成したツール呼び出し試行まで追跡できます。", { direction: "incoming" })],
  }),
  p({
    moduleId: "tool-mcp-transport",
    conceptId: "MCPSession",
    sourceId: "eng-proto-mcp-2025-spec",
    identityKeys: ["mcp_session_id"],
    fields: [
      f("mcp_session_id", "MCP 会话标识", "MCP session ID", "MCP セッション ID", "string", "mcp-session-001", "稳定标识一次客户端与服务器之间的 MCP 会话。", "Stable identifier for one MCP session between a client and server.", "クライアントとサーバー間の一つの MCP セッションを安定して識別します。", { required: true }),
      f("protocol_version", "协议版本", "protocol version", "プロトコルバージョン", "string", "2025-11-25", "初始化期间协商并用于该会话的 MCP 协议版本。", "MCP protocol version negotiated during initialization and used by this session.", "初期化中に交渉され、このセッションで使用される MCP プロトコルバージョンです。", { required: true }),
      f("state", "会话状态", "session state", "セッション状態", "string", "initialized", "MCP 会话在初始化、活动、关闭或失败生命周期中的状态。", "State in the initialized, active, closed, or failed MCP lifecycle.", "initialized、active、closed、failed の MCP ライフサイクル状態です。", { required: true })
    ],
    constraints: [c("mcp-session-negotiated-before-use", "requests other than initialization occur only after protocol version and capabilities are negotiated", "除初始化外的请求只能在协议版本和能力协商完成后发生。", "Requests other than initialization occur only after protocol version and capabilities are negotiated.", "初期化以外の要求はプロトコルバージョンと能力の交渉後にのみ発生します。")],
    relations: [
      r("mcp-session-has-client", "has_participant", "MCPClient", "MCP 会话必须有一个客户端参与者。", "An MCP session has one client participant.", "MCP セッションには一つのクライアント参加者があります。"),
      r("mcp-session-has-server", "has_participant", "MCPServer", "MCP 会话必须有一个服务器参与者。", "An MCP session has one server participant.", "MCP セッションには一つのサーバー参加者があります。")
    ],
  }),

  p({
    moduleId: "safety-trust-boundary",
    conceptId: "BoundaryCrossing",
    sourceId: "eng-security-mcp-nsa-2026",
    identityKeys: ["crossing_id"],
    fields: [
      f("crossing_id", "跨界记录标识", "boundary-crossing ID", "境界通過 ID", "string", "crossing-tool-001", "稳定标识一次有身份、可审计的信任边界跨越。", "Stable identifier for one identity-bearing, auditable trust-boundary crossing.", "一つの独立した監査可能な信頼境界通過を安定して識別します。", { required: true }),
      f("direction", "跨越方向", "crossing direction", "通過方向", "string", "outbound", "说明载荷或动作相对于来源区和目标区的流向。", "Flow direction of the payload or action relative to source and target zones.", "送信元ゾーンと送信先ゾーンに対するペイロードまたは動作の流れ方向です。", { required: true }),
      f("purpose", "跨越目的", "crossing purpose", "通過目的", "string", "invoke approved external search tool", "允许审计者判断必要性和权限最小化的明确业务目的。", "Explicit business purpose used to assess necessity and least authority.", "必要性と最小権限を評価するための明示的な業務目的です。", { required: true }),
      f("occurred_at", "发生时间", "occurred at", "発生時刻", "date-time", "2026-07-13T04:00:00.000Z", "跨界动作实际发生的 UTC 时间。", "UTC instant at which the crossing actually occurred.", "境界通過動作が実際に発生した UTC 時刻です。", { required: true }),
      f("payload_digest", "载荷摘要", "payload digest", "ペイロードダイジェスト", "string", "sha256:9f44...", "跨界载荷或动作参数的不可变摘要，用于审计而不泄露内容。", "Immutable digest of the crossing payload or action parameters for audit without disclosure.", "内容を開示せず監査するための境界通過ペイロードまたは動作引数の不変ダイジェストです。", { required: true })
    ],
    constraints: [c("boundary-crossing-zones-distinct", "source zone and target zone are both identified and are not the same zone", "来源区和目标区必须明确且不得相同。", "Source and target zones are both identified and are not the same zone.", "送信元ゾーンと送信先ゾーンは共に識別され、同一ゾーンであってはなりません。")],
    relations: [
      r("boundary-crossing-source-zone", "has_source_zone", "DataZone", "跨界记录必须指向唯一来源数据区。", "A boundary crossing points to one source data zone.", "境界通過は一つの送信元データゾーンを指します。"),
      r("boundary-crossing-target-zone", "has_target_zone", "DataZone", "跨界记录必须指向唯一目标数据区。", "A boundary crossing points to one target data zone.", "境界通過は一つの送信先データゾーンを指します。"),
      r("boundary-crossing-policy-decision", "boundary_crossing_authorized_by", "PolicyDecision", "跨界动作必须由可追溯策略决定授权。", "A boundary crossing is authorized by a traceable policy decision.", "境界通過は追跡可能なポリシー判断によって認可されます。")
    ],
  }),
  p({
    moduleId: "safety-permission-policy",
    conceptId: "PolicyDecision",
    sourceId: "eng-fw-openai-guardrails",
    identityKeys: ["decision_id"],
    fields: [
      f("decision_id", "策略决定标识", "policy-decision ID", "ポリシー判断 ID", "string", "policy-decision-001", "稳定标识一次对主体、动作、资源和上下文的策略判断。", "Stable identifier for one policy decision over subject, action, resource, and context.", "主体、動作、資源、コンテキストに対する一つのポリシー判断を安定して識別します。", { required: true }),
      f("decision_kind", "决定结果", "decision kind", "判断種別", "string", "allow", "策略评估产生的允许、拒绝或升级结果。", "Allow, deny, or escalate outcome produced by policy evaluation.", "ポリシー評価が生成した allow、deny、escalate の結果です。", { required: true }),
      f("reason", "决定理由", "decision reason", "判断理由", "string", "scope and risk threshold satisfied", "说明适用规则、上下文和证据如何支持决定结果。", "Explains how applicable rules, context, and evidence support the outcome.", "適用規則、コンテキスト、証拠が判断結果をどう支持するかを説明します。", { required: true }),
      f("decided_at", "决定时间", "decided at", "判断時刻", "date-time", "2026-07-13T04:00:00.000Z", "策略决定生效的 UTC 时间。", "UTC instant at which the policy decision took effect.", "ポリシー判断が発効した UTC 時刻です。", { required: true }),
      f("policy_version", "策略版本", "policy version", "ポリシーバージョン", "string", "tool-egress-policy@5", "固定本次判断所依据的不可变策略版本。", "Pins the immutable policy version used for this decision.", "この判断に使用した不変ポリシーバージョンを固定します。", { required: true }),
      f("subject_id", "主体标识", "subject ID", "主体 ID", "string", "actor-orchestrator-001", "标识被评估权限的主体。", "Identifies the subject whose authority is evaluated.", "権限を評価する主体を識別します。", { required: true }),
      f("action", "动作", "action", "動作", "string", "invoke_tool", "本次策略判断评估的规范动作名称。", "Canonical action name evaluated by this policy decision.", "このポリシー判断が評価する canonical 動作名です。", { required: true }),
      f("resource_id", "资源标识", "resource ID", "資源 ID", "string", "tool:search_documents", "标识动作所作用的工具、数据或系统资源。", "Identifies the tool, data, or system resource on which the action operates.", "動作対象のツール、データ、システム資源を識別します。", { required: true }),
      f("context_digest", "上下文摘要", "context digest", "コンテキストダイジェスト", "string", "sha256:71b2...", "固定参与判断的环境、任务与风险上下文，而不复制敏感内容。", "Pins environment, task, and risk context used by the decision without copying sensitive content.", "機密内容を複製せず、判断に使った環境、タスク、リスク文脈を固定します。", { required: true }),
      f("issuer_id", "签发方标识", "issuer ID", "発行者 ID", "string", "policy-engine-main", "标识签发并负责该决定的策略执行主体。", "Identifies the policy-enforcement actor issuing and owning the decision.", "判断を発行し責任を負うポリシー実行主体を識別します。", { required: true }),
      f("valid_until", "有效终点", "valid until", "有効終了", "date-time", "2026-07-13T04:05:00.000Z", "该决定可以被执行组件复用到的最晚 UTC 时间。", "Latest UTC instant until which enforcement may reuse this decision.", "実行コンポーネントがこの判断を再利用できる最終 UTC 時刻です。", { required: true }),
      f("revoked_at", "撤销时间", "revoked at", "失効時刻", "date-time", null, "决定被提前撤销的 UTC 时间；未撤销时为空。", "UTC instant at which the decision was revoked early; null when not revoked.", "判断が早期失効した UTC 時刻で、失効していない場合は空です。")
    ],
    constraints: [
      c("policy-decision-subtype-outcome", "decision_kind agrees with the most specific AllowDecision, DenyDecision, or EscalationDecision subtype", "决定结果必须与允许、拒绝或升级下位类型一致。", "decision_kind agrees with the most specific AllowDecision, DenyDecision, or EscalationDecision subtype.", "decision_kind は最も具体的な AllowDecision、DenyDecision、EscalationDecision 下位型と一致します。"),
      c("policy-decision-validity-window", "decided_at <= valid_until and revoked_at is absent or between decided_at and valid_until", "有效终点不得早于决定时间；撤销时间若存在，必须位于有效窗口内。", "valid_until does not precede decided_at, and revoked_at is absent or lies within that window.", "valid_until は decided_at より前でなく、revoked_at は空または有効期間内です。")
    ],
    relations: [r("policy-decision-based-on-rule", "based_on", "PolicyRule", "策略决定必须可追溯到至少一条已评估规则。", "A policy decision is traceable to at least one evaluated rule.", "ポリシー判断は少なくとも一つの評価済み規則まで追跡できます。", { max: null })],
  }),
  p({
    moduleId: "safety-sandbox-network",
    conceptId: "NetworkCall",
    sourceId: "eng-security-mcp-nsa-2026",
    identityKeys: ["network_call_id"],
    fields: [
      f("network_call_id", "网络调用标识", "network-call ID", "ネットワーク呼び出し ID", "string", "network-call-001", "稳定标识一次实际网络交互尝试。", "Stable identifier for one actual network-interaction attempt.", "一回の実際のネットワーク対話試行を安定して識別します。", { required: true }),
      f("method", "方法", "method", "メソッド", "string", "POST", "网络协议中使用的请求方法或操作名称。", "Request method or operation name used by the network protocol.", "ネットワークプロトコルで使用する要求メソッドまたは操作名です。", { required: true }),
      f("started_at", "开始时间", "started at", "開始時刻", "date-time", "2026-07-13T04:05:00.000Z", "网络调用开始的 UTC 时间。", "UTC instant at which the network call started.", "ネットワーク呼び出しが開始した UTC 時刻です。", { required: true }),
      f("status", "调用状态", "call status", "呼び出し状態", "string", "allowed", "说明调用被允许、拒绝、成功、失败或超时。", "Whether the call was allowed, denied, succeeded, failed, or timed out.", "呼び出しが allowed、denied、succeeded、failed、timed-out のいずれかを示します。", { required: true })
    ],
    constraints: [c("network-call-decision-before-send", "an outbound call is evaluated by network policy before bytes are sent", "出站调用必须在发送字节前完成网络策略评估。", "An outbound call is evaluated by network policy before bytes are sent.", "送信ネットワーク呼び出しはバイト送信前にネットワーク方針で評価されます。")],
    relations: [r("network-call-targets-endpoint", "targets", "NetworkEndpoint", "网络调用必须指向一个明确端点。", "A network call targets one identified network endpoint.", "ネットワーク呼び出しは一つの識別済みネットワークエンドポイントを対象とします。")],
  }),
  p({
    moduleId: "safety-injection-defense",
    conceptId: "DefenseFinding",
    sourceId: "lit-agent-vigil-siren",
    locator: LOCATORS.literature,
    identityKeys: ["finding_id"],
    fields: [
      f("finding_id", "防御发现标识", "defense-finding ID", "防御所見 ID", "string", "defense-finding-001", "稳定标识一次扫描或污点分析形成的安全发现。", "Stable identifier for one security finding formed by scanning or taint analysis.", "スキャンまたは汚染解析により形成された一つのセキュリティ所見を安定して識別します。", { required: true }),
      f("confidence", "置信度", "confidence", "信頼度", "number", 0.94, "检测活动对该发现正确性的零到一置信度。", "Zero-to-one confidence assigned by the detection activity to the finding.", "検出活動が所見の正しさに割り当てたゼロから一の信頼度です。", { required: true }),
      f("risk_score", "风险分数", "risk score", "リスクスコア", "number", 0.88, "结合影响和可能性得到的零到一风险分数。", "Zero-to-one risk score combining impact and likelihood.", "影響と可能性を組み合わせたゼロから一のリスクスコアです。", { required: true }),
      f("observed_at", "发现时间", "observed at", "検出時刻", "date-time", "2026-07-13T04:10:00.000Z", "检测活动确认该发现的 UTC 时间。", "UTC instant at which the detection activity established the finding.", "検出活動が所見を確立した UTC 時刻です。", { required: true })
    ],
    constraints: [c("defense-finding-normalized-scores", "confidence and risk_score are numbers between zero and one inclusive", "置信度和风险分数必须位于零到一闭区间。", "confidence and risk_score are numbers between zero and one inclusive.", "confidence と risk_score はゼロ以上一以下の数値です。")],
    relations: [r("defense-finding-triggers-mitigation", "triggers", "MitigationAction", "达到适用阈值的发现必须触发一项可审计缓解动作。", "A finding meeting the applicable threshold triggers an auditable mitigation action.", "適用閾値に達した所見は監査可能な緩和動作を起動します。")],
  }),
  p({
    moduleId: "safety-commit-redaction",
    conceptId: "Redaction",
    sourceId: "eng-fw-openai-guardrails",
    identityKeys: ["redaction_id"],
    fields: [
      f("redaction_id", "脱敏标识", "redaction ID", "墨消し ID", "string", "redaction-001", "稳定标识一次可审计的信息脱敏动作。", "Stable identifier for one auditable information-redaction action.", "一回の監査可能な情報墨消し動作を安定して識別します。", { required: true }),
      f("applied_at", "应用时间", "applied at", "適用時刻", "date-time", "2026-07-13T04:12:00.000Z", "脱敏规则实际应用的 UTC 时间。", "UTC instant at which the redaction rule was applied.", "墨消し規則が実際に適用された UTC 時刻です。", { required: true }),
      f("replacement_marker", "替代标记", "replacement marker", "置換マーカー", "string", "[REDACTED]", "替代敏感内容且不泄露原文的显示标记。", "Display marker replacing sensitive content without disclosing it.", "機密内容を開示せず置換する表示マーカーです。", { required: true })
    ],
    constraints: [c("redaction-span-preserved", "redaction preserves the source span identity and never stores the sensitive value in replacement_marker", "脱敏必须保留来源区间身份，替代标记不得包含敏感原值。", "Redaction preserves source-span identity and never stores the sensitive value in replacement_marker.", "墨消しは出典範囲の同一性を保持し、replacement_marker に機密原値を保存しません。")],
    relations: [r("redaction-targets-sensitive-span", "targets", "SensitiveSpan", "脱敏动作必须指向被处理的敏感区间。", "A redaction action points to the sensitive span it processes.", "墨消し動作は処理対象の機密範囲を指します。")],
  }),

  p({
    moduleId: "feedback-warning-error",
    conceptId: "ErrorEvent",
    sourceId: "eng-fw-openai-tracing",
    identityKeys: ["error_event_id"],
    fields: [
      f("error_event_id", "错误事件标识", "error-event ID", "エラーイベント ID", "string", "error-event-001", "稳定标识一次实际发生的错误事件。", "Stable identifier for one error event that actually occurred.", "実際に発生した一つのエラーイベントを安定して識別します。", { required: true }),
      f("error_code", "错误代码", "error code", "エラーコード", "string", "TOOL_TIMEOUT", "用于稳定分类和聚合错误的机器可读代码。", "Machine-readable code for stable error classification and aggregation.", "安定したエラー分類と集計のための機械可読コードです。", { required: true }),
      f("severity", "严重度", "severity", "重大度", "string", "error", "说明错误影响程度的受控等级。", "Controlled level expressing the impact of the error.", "エラー影響度を表す制御レベルです。", { required: true }),
      f("retryable", "可重试", "retryable", "再試行可能", "boolean", true, "说明同等条件下创建新尝试是否是允许的恢复策略。", "Whether creating a new attempt under equivalent conditions is an allowed recovery strategy.", "同等条件で新しい試行を作ることが許可された回復戦略かを示します。", { required: true }),
      f("occurred_at", "发生时间", "occurred at", "発生時刻", "date-time", "2026-07-13T05:00:00.000Z", "错误实际发生的 UTC 时间。", "UTC instant at which the error actually occurred.", "エラーが実際に発生した UTC 時刻です。", { required: true })
    ],
    constraints: [c("error-event-retry-consistency", "retryable agrees with the linked FailureMode and applicable retry policy", "可重试标志必须与失败模式和适用重试策略一致。", "retryable agrees with the linked FailureMode and applicable retry policy.", "retryable は関連する FailureMode と適用される再試行方針に一致します。")],
    relations: [r("error-event-classified-by-mode", "classified_by", "FailureMode", "错误事件必须由一个明确失败模式分类。", "An error event is classified by one explicit failure mode.", "エラーイベントは一つの明示的な失敗モードで分類されます。")],
  }),
  p({
    moduleId: "feedback-review-optimization",
    conceptId: "Review",
    sourceId: "lit-mech-reflexion",
    locator: LOCATORS.literature,
    identityKeys: ["review_id"],
    fields: [
      f("review_id", "审核记录标识", "review ID", "レビュー ID", "string", "review-artifact-001", "稳定标识一项审核活动产生的审核记录。", "Stable identifier for the review record produced by one review activity.", "一つのレビュー活動が生成したレビュー記録を安定して識別します。", { required: true }),
      f("subject_version", "被审版本", "subject version", "対象バージョン", "string", "artifact-report-001@3", "固定本次审核所针对对象的不可变版本。", "Pins the immutable subject version examined by the review.", "このレビューが検査した不変対象バージョンを固定します。", { required: true }),
      f("status", "审核状态", "review status", "レビュー状態", "string", "completed", "审核记录的活动、完成、撤回或替代状态。", "Active, completed, withdrawn, or superseded state of the review record.", "レビュー記録の active、completed、withdrawn、superseded 状態です。", { required: true }),
      f("completed_at", "完成时间", "completed at", "完了時刻", "date-time", "2026-07-13T05:05:00.000Z", "审核完成的 UTC 时间；活动审核为空。", "UTC instant at which review completed; null while active.", "レビュー完了の UTC 時刻で、実行中は空です。")
    ],
    constraints: [c("review-subject-version-fixed", "findings and corrections refer to the same immutable subject_version reviewed", "发现和纠正必须指向本次审核固定的同一被审版本。", "Findings and corrections refer to the same immutable subject_version reviewed.", "所見と修正はレビュー対象として固定された同じ不変 subject_version を参照します。")],
    relations: [r("review-contains-finding", "contains_finding", "ReviewFinding", "完成的审核至少包含一项明确发现。", "A completed review contains at least one explicit finding.", "完了したレビューには少なくとも一つの明示的な所見が含まれます。", { max: null })],
  }),
  p({
    moduleId: "feedback-metrics-evaluation",
    conceptId: "EvaluationRun",
    sourceId: "lit-bench-agentbench",
    locator: LOCATORS.literature,
    identityKeys: ["evaluation_run_id"],
    fields: [
      f("evaluation_run_id", "评估运行标识", "evaluation-run ID", "評価実行 ID", "string", "evaluation-run-001", "稳定标识一次对固定对象版本的评估运行。", "Stable identifier for one evaluation run over a pinned subject version.", "固定された対象バージョンに対する一回の評価実行を安定して識別します。", { required: true }),
      f("started_at", "开始时间", "started at", "開始時刻", "date-time", "2026-07-13T05:10:00.000Z", "评估运行开始的 UTC 时间。", "UTC instant at which the evaluation run started.", "評価実行が開始した UTC 時刻です。", { required: true }),
      f("evaluator_id", "评估者标识", "evaluator ID", "評価者 ID", "string", "evaluator-regression-suite", "标识执行或负责本次评估的主体或系统。", "Identifies the actor or system that performed or owned the evaluation.", "評価を実行または担当した主体またはシステムを識別します。", { required: true }),
      f("status", "评估状态", "evaluation status", "評価状態", "string", "completed", "评估运行的排队、活动、完成、失败或取消状态。", "Queued, active, completed, failed, or cancelled state of the evaluation run.", "評価実行の queued、active、completed、failed、cancelled 状態です。", { required: true }),
      f("subject_id", "被评对象标识", "subject ID", "評価対象 ID", "string", "tool-result-001", "标识本次评估的对象。", "Identifies the subject evaluated by this run.", "この実行が評価する対象を識別します。", { required: true }),
      f("subject_version", "被评版本", "subject version", "評価対象バージョン", "string", "tool-result-001@sha256:4c3f", "固定被评对象的不可变版本或内容摘要。", "Pins the immutable version or content digest of the evaluated subject.", "評価対象の不変バージョンまたは内容ダイジェストを固定します。", { required: true })
    ],
    constraints: [c("evaluation-run-pinned-inputs", "subject version, scenario, rubric, metric definitions, and evaluator are fixed before measurements are produced", "产生测量前必须固定被评对象版本、场景、量规、指标定义和评估者。", "Subject version, scenario, rubric, metric definitions, and evaluator are fixed before measurements are produced.", "測定生成前に対象バージョン、シナリオ、ルーブリック、指標定義、評価者を固定します。")],
    relations: [
      r("evaluation-run-produces-measurement", "produces", "Measurement", "评估运行至少产生一项带单位和来源的测量。", "An evaluation run produces at least one measurement with unit and provenance.", "評価実行は単位と来歴を持つ少なくとも一つの測定を生成します。", { max: null }),
      r("evaluation-run-applies-rubric", "applies", "Rubric", "评估运行必须固定所用量规。", "An evaluation run pins the rubric it applies.", "評価実行は適用するルーブリックを固定します。"),
      r("evaluation-run-uses-scenario", "uses_scenario", "EvaluationScenario", "评估运行必须固定所用场景。", "An evaluation run pins the scenario it uses.", "評価実行は使用するシナリオを固定します。")
    ],
  }),
  p({
    moduleId: "feedback-logging",
    conceptId: "LogRecord",
    sourceId: "eng-fw-openai-tracing",
    identityKeys: ["log_record_id"],
    fields: [
      f("log_record_id", "日志记录标识", "log-record ID", "ログ記録 ID", "string", "log-record-001", "稳定标识一条不可变日志记录。", "Stable identifier for one immutable log record.", "一つの不変ログ記録を安定して識別します。", { required: true }),
      f("timestamp", "时间戳", "timestamp", "タイムスタンプ", "date-time", "2026-07-13T05:12:00.000Z", "日志事件发生或被观测的 UTC 时间。", "UTC instant at which the logged event occurred or was observed.", "ログ対象イベントが発生または観測された UTC 時刻です。", { required: true }),
      f("severity", "严重度", "severity", "重大度", "string", "info", "日志记录的受控严重度。", "Controlled severity of the log record.", "ログ記録の制御された重大度です。", { required: true }),
      f("body", "正文", "body", "本文", "string", "tool call completed", "经适用脱敏处理后的日志正文。", "Log body after applicable redaction has been applied.", "適用される墨消し処理後のログ本文です。", { required: true })
    ],
    constraints: [c("log-record-immutable-redacted", "a persisted log record is immutable and its body contains no value prohibited by the applicable disclosure policy", "持久化日志记录不可变，正文不得包含披露策略禁止的值。", "A persisted log record is immutable and its body contains no value prohibited by the applicable disclosure policy.", "永続化ログ記録は不変で、本文に適用開示方針が禁止する値を含めません。")],
    relations: [r("log-record-in-stream", "contains", "LogStream", "日志记录必须归属于一个有保留策略的日志流。", "A log record belongs to one log stream with a retention policy.", "ログ記録は保持方針を持つ一つのログストリームに属します。", { direction: "incoming" })],
  }),

  p({
    moduleId: "adapter-protocols",
    conceptId: "ProtocolMapping",
    sourceId: "eng-proto-a2a-spec",
    identityKeys: ["mapping_id", "external_version"],
    fields: [
      f("mapping_id", "协议映射标识", "protocol-mapping ID", "プロトコルマッピング ID", "string", "mapping-a2a-task", "稳定标识一条协议构造到规范概念的逻辑映射。", "Stable identifier for one logical mapping from a protocol construct to a canonical Concept.", "プロトコル構成要素から canonical Concept への一つの論理マッピングを安定して識別します。", { required: true }),
      f("external_version", "外部协议版本", "external protocol version", "外部プロトコルバージョン", "string", "A2A-0.3", "固定映射来源端所依据的协议版本。", "Pins the source protocol version to which the mapping applies.", "マッピング元に適用されるプロトコルバージョンを固定します。", { required: true }),
      f("direction", "映射方向", "mapping direction", "マッピング方向", "string", "external-to-canonical", "说明转换是外部到规范、规范到外部或双向。", "Whether conversion is external-to-canonical, canonical-to-external, or bidirectional.", "変換方向が external-to-canonical、canonical-to-external、bidirectional のいずれかを示します。", { required: true }),
      f("loss_kind", "损失类别", "loss kind", "損失種別", "string", "exact", "说明映射为精确、有损或不支持。", "Whether the mapping is exact, lossy, or unsupported.", "マッピングが exact、lossy、unsupported のいずれかを示します。", { required: true })
    ],
    constraints: [c("protocol-mapping-versioned-test", "an accepted mapping names both construct versions and has a conformance test for its declared direction", "已接受协议映射必须注明两端版本并具备对应方向的一致性测试。", "An accepted protocol mapping names both construct versions and has a conformance test for its declared direction.", "受理済みプロトコルマッピングは両端のバージョンを示し、宣言方向の適合性テストを持ちます。")],
    relations: [r("protocol-mapping-governs-adapter", "applies_to_adapter", "ProtocolAdapter", "协议映射必须指向使用该映射的协议适配器。", "A protocol mapping points to the protocol adapter that applies it.", "プロトコルマッピングはそれを適用するプロトコルアダプターを指します。")],
  }),
  p({
    moduleId: "adapter-frameworks",
    conceptId: "FrameworkMapping",
    sourceId: "eng-fw-microsoft-agent-framework-docs",
    identityKeys: ["mapping_id", "framework_version"],
    fields: [
      f("mapping_id", "框架映射标识", "framework-mapping ID", "フレームワークマッピング ID", "string", "mapping-langgraph-trace", "稳定标识一条框架构造到规范概念的映射。", "Stable identifier for one mapping from a framework construct to a canonical Concept.", "フレームワーク構成要素から canonical Concept への一つのマッピングを安定して識別します。", { required: true }),
      f("framework_version", "框架版本", "framework version", "フレームワークバージョン", "string", "1.0", "固定映射适用的外部框架版本。", "Pins the external framework version to which the mapping applies.", "マッピングが適用される外部フレームワークバージョンを固定します。", { required: true }),
      f("loss_kind", "损失类别", "loss kind", "損失種別", "string", "lossy", "说明映射精确、有损或不支持，并驱动警告。", "Declares exact, lossy, or unsupported mapping and drives warnings.", "exact、lossy、unsupported の種別を宣言し、警告を駆動します。", { required: true })
    ],
    constraints: [c("framework-mapping-unsupported-explicit", "unsupported framework semantics are recorded explicitly and never silently coerced into a core Concept", "不支持的框架语义必须显式记录，不得静默强制映射到核心概念。", "Unsupported framework semantics are recorded explicitly and never silently coerced into a core Concept.", "未対応のフレームワーク意味は明示的に記録し、core Concept へ暗黙変換してはなりません。")],
    relations: [r("framework-mapping-applies-adapter", "applies_to_adapter", "FrameworkAdapter", "框架映射必须指向使用它的框架适配器。", "A framework mapping points to the framework adapter that applies it.", "フレームワークマッピングはそれを適用するフレームワークアダプターを指します。")],
  }),
  p({
    moduleId: "adapter-benchmarks",
    conceptId: "BenchmarkAdapter",
    sourceId: "lit-bench-agentbench",
    locator: LOCATORS.literature,
    identityKeys: ["adapter_id", "benchmark_version"],
    fields: [
      f("adapter_id", "基准适配器标识", "benchmark-adapter ID", "ベンチマークアダプター ID", "string", "adapter-swebench", "稳定标识一个基准到规范图谱的适配器。", "Stable identifier for one benchmark-to-canonical-graph adapter.", "ベンチマークから canonical graph への一つのアダプターを安定して識別します。", { required: true }),
      f("benchmark_version", "基准版本", "benchmark version", "ベンチマークバージョン", "string", "SWE-bench Verified@2026-06", "固定任务、环境、轨迹和评分语义所依据的基准版本。", "Pins the benchmark version defining task, environment, trajectory, and scoring semantics.", "タスク、環境、軌跡、採点意味を定義するベンチマークバージョンを固定します。", { required: true }),
      f("conformance_status", "一致性状态", "conformance status", "適合状態", "string", "verified", "说明任务、环境、轨迹、指标和结果映射是否通过验证。", "Whether task, environment, trajectory, metric, and outcome mappings passed verification.", "タスク、環境、軌跡、指標、結果のマッピングが検証済みかを示します。", { required: true })
    ],
    constraints: [c("benchmark-adapter-five-facets", "the adapter covers task, environment, trajectory or action, metric, and outcome mappings", "基准适配器必须覆盖任务、环境、轨迹或动作、指标和结果五类映射。", "The adapter covers task, environment, trajectory or action, metric, and outcome mappings.", "アダプターはタスク、環境、軌跡または動作、指標、結果の五種類をマッピングします。")],
    relations: [r("benchmark-adapter-maps-task", "maps_task_to", "Task", "基准适配器必须把外部任务语义映射到规范 Task。", "A benchmark adapter maps external task semantics to canonical Task.", "ベンチマークアダプターは外部タスク意味を canonical Task へマッピングします。", { max: null })],
  }),
  p({
    moduleId: "adapter-statecharts",
    conceptId: "StatechartAdapter",
    sourceId: "eng-state-scxml",
    identityKeys: ["adapter_id", "dialect_version"],
    fields: [
      f("adapter_id", "状态图适配器标识", "statechart-adapter ID", "ステートチャートアダプター ID", "string", "adapter-scxml", "稳定标识一个状态图方言适配器。", "Stable identifier for one statechart-dialect adapter.", "一つのステートチャート方言アダプターを安定して識別します。", { required: true }),
      f("dialect_version", "方言版本", "dialect version", "方言バージョン", "string", "SCXML-1.0", "固定状态、转移、事件、守卫和动作映射所依据的方言版本。", "Pins the dialect version defining state, transition, event, guard, and action mappings.", "状態、遷移、イベント、ガード、動作のマッピングを定義する方言バージョンを固定します。", { required: true }),
      f("round_trip_loss", "往返损失", "round-trip loss", "ラウンドトリップ損失", "string", "history-state annotations are lossy", "明确规范图谱与状态图往返转换无法保留的语义。", "Explicit semantics not preserved by canonical-to-statechart round trips.", "canonical graph とステートチャートの往復変換で保持できない意味を明示します。", { required: true })
    ],
    constraints: [c("statechart-adapter-core-mappings", "state, transition, event, guard, action, history, final, and error constructs are mapped or explicitly unsupported", "状态、转移、事件、守卫、动作、历史、终态和错误构造必须映射或显式标为不支持。", "State, transition, event, guard, action, history, final, and error constructs are mapped or explicitly unsupported.", "状態、遷移、イベント、ガード、動作、履歴、終端、エラー構成要素はマッピング済みまたは明示的に未対応です。")],
    relations: [r("statechart-adapter-maps-state", "maps_state_to", "StateSnapshot", "状态图适配器必须说明外部状态如何映射到规范状态快照。", "A statechart adapter states how an external state maps to canonical StateSnapshot.", "ステートチャートアダプターは外部状態から canonical StateSnapshot へのマッピングを示します。", { max: null })],
  }),
  p({
    moduleId: "adapter-schema-export",
    conceptId: "SchemaAdapter",
    sourceId: "lit-val-jsonschema-spec",
    locator: LOCATORS.literature,
    identityKeys: ["adapter_id", "schema_version"],
    fields: [
      f("adapter_id", "结构导出适配器标识", "schema-adapter ID", "スキーマアダプター ID", "string", "adapter-json-schema", "稳定标识一种从统一规范图谱导出结构投影的适配器。", "Stable identifier for one adapter exporting a structural projection from the unified canonical graph.", "統一 canonical graph から構造投影を出力する一つのアダプターを安定して識別します。", { required: true }),
      f("schema_version", "目标规范版本", "target schema version", "対象スキーマバージョン", "string", "JSON-Schema-2020-12", "固定目标结构语言和版本。", "Pins the target structural language and version.", "対象構造言語とバージョンを固定します。", { required: true }),
      f("loss_kind", "导出损失类别", "export loss kind", "出力損失種別", "string", "lossy", "说明类、关系、字段、基数和约束导出是否精确、有损或不支持。", "Whether class, relation, field, cardinality, and constraint export is exact, lossy, or unsupported.", "クラス、関係、フィールド、基数、制約の出力が exact、lossy、unsupported のいずれかを示します。", { required: true })
    ],
    constraints: [c("schema-adapter-no-shadow-nodes", "exported annotations never become canonical graph nodes and every projection points back to its canonical owner", "导出注解不得成为规范图节点，且每个投影必须回指其规范所有者。", "Exported annotations never become canonical graph nodes, and every projection points back to its canonical owner.", "出力注釈は canonical graph ノードにならず、各投影は canonical 所有者を参照します。")],
    relations: [r("schema-adapter-produces-artifact", "produces", "SchemaArtifact", "结构导出适配器产生有身份和版本的 SchemaArtifact。", "A schema adapter produces an identity-bearing, versioned SchemaArtifact.", "スキーマアダプターは同一性とバージョンを持つ SchemaArtifact を生成します。", { max: null })],
  }),
  p({
    moduleId: "adapter-mapping-infrastructure",
    conceptId: "Adapter",
    sourceId: "eng-ont-microsoft-fabric-iq-ontology",
    locator: LOCATORS.ontology,
    identityKeys: ["adapter_id", "adapter_version"],
    fields: [
      f("adapter_id", "适配器标识", "adapter ID", "アダプター ID", "string", "adapter-a2a", "稳定标识跨版本的逻辑适配器。", "Stable identifier for the logical adapter across versions.", "複数バージョンにまたがる論理アダプターを安定して識別します。", { required: true }),
      f("adapter_version", "适配器版本", "adapter version", "アダプターバージョン", "string", "2.0.0", "标识一项不可变适配器实现和映射合同版本。", "Identifies one immutable adapter implementation and mapping-contract version.", "一つの不変アダプター実装とマッピング契約バージョンを識別します。", { required: true }),
      f("scope", "适用范围", "scope", "適用範囲", "string", ["task", "message", "trust"], "列出该适配器负责转换的构造范围。", "Construct scopes for which the adapter is responsible.", "アダプターが変換を担当する構成要素範囲です。", { required: true, repeatable: true }),
      f("status", "适配器状态", "adapter status", "アダプター状態", "string", "supported", "适配器处于实验、支持、弃用或撤回状态。", "Experimental, supported, deprecated, or withdrawn state of the adapter.", "アダプターの experimental、supported、deprecated、withdrawn 状態です。", { required: true })
    ],
    constraints: [c("adapter-version-conformance", "a supported adapter version has passing mapping tests for every declared scope", "受支持适配器版本必须对每个声明范围具有通过的映射测试。", "A supported adapter version has passing mapping tests for every declared scope.", "supported 状態のアダプターバージョンは宣言した各範囲の合格マッピングテストを持ちます。")],
    relations: [r("adapter-governed-by-mapping-rule", "governed_by", "MappingRule", "适配器必须由至少一条版本化映射规则约束。", "An adapter is governed by at least one versioned mapping rule.", "アダプターは少なくとも一つのバージョン付きマッピング規則により統制されます。", { max: null })],
  }),
  p({
    moduleId: "adapter-mapping-infrastructure",
    conceptId: "MappingRule",
    sourceId: "eng-ont-microsoft-fabric-iq-ontology",
    locator: LOCATORS.ontology,
    identityKeys: ["mapping_rule_id", "version"],
    fields: [
      f("mapping_rule_id", "映射规则标识", "mapping-rule ID", "マッピング規則 ID", "string", "mapping-rule-a2a-task", "稳定标识跨版本的逻辑映射规则。", "Stable identifier for the logical mapping rule across versions.", "複数バージョンにまたがる論理マッピング規則を安定して識別します。", { required: true }),
      f("version", "规则版本", "rule version", "規則バージョン", "string", "3", "标识一项不可变映射转换合同版本。", "Identifies one immutable version of the mapping transformation contract.", "一つの不変マッピング変換契約バージョンを識別します。", { required: true }),
      f("source_construct", "来源构造", "source construct", "変換元構成要素", "string", "a2a:Task", "带命名空间和版本语境的外部或规范来源构造。", "External or canonical source construct with namespace and version context.", "名前空間とバージョン文脈を持つ外部または canonical の変換元構成要素です。", { required: true }),
      f("target_construct", "目标构造", "target construct", "変換先構成要素", "string", "moonweave:Task", "带命名空间和版本语境的目标构造。", "Target construct with namespace and version context.", "名前空間とバージョン文脈を持つ変換先構成要素です。", { required: true }),
      f("direction", "规则方向", "rule direction", "規則方向", "string", "source-to-target", "说明规则可用于源到目标、目标到源或双向转换。", "Whether the rule supports source-to-target, target-to-source, or bidirectional conversion.", "規則が source-to-target、target-to-source、bidirectional のいずれを支援するかを示します。", { required: true }),
      f("mapping_kind", "映射类别", "mapping kind", "マッピング種別", "string", "exact", "说明转换精确、有损、较宽、较窄、相关或不支持。", "Whether conversion is exact, lossy, broader, narrower, related, or unsupported.", "変換が exact、lossy、broader、narrower、related、unsupported のいずれかを示します。", { required: true }),
      f("valid_from", "有效起点", "valid from", "有効開始", "date-time", "2026-07-13T06:00:00.000Z", "该映射规则版本开始有效的 UTC 时间。", "UTC instant from which this mapping-rule version is valid.", "このマッピング規則バージョンが有効となる UTC 時刻です。", { required: true })
    ],
    constraints: [c("mapping-rule-explicit-loss", "lossy or unsupported rules state affected semantics, remediation, and an accepted mapping test result", "有损或不支持规则必须说明受影响语义、补救办法和已接受测试结果。", "Lossy or unsupported rules state affected semantics, remediation, and an accepted mapping-test result.", "lossy または unsupported の規則は影響意味、対処、受理済みマッピングテスト結果を示します。")],
    relations: [r("mapping-rule-governs-adapter", "governs", "Adapter", "映射规则必须指向受其约束的适配器。", "A mapping rule points to the adapter it governs.", "マッピング規則は統制対象のアダプターを指します。")],
  }),
];

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const materializePatch = (spec) => ({
  module_id: spec.moduleId,
  concept_id: spec.conceptId,
  structure: {
    identity_keys: [...spec.identityKeys],
    fields: spec.fields.map((field) =>
      reviewedField({
        conceptId: spec.conceptId,
        sourceId: spec.sourceId,
        locator: spec.locator,
        ...field,
      }),
    ),
    constraints: spec.constraints.map((constraint) =>
      reviewedConstraint({
        conceptId: spec.conceptId,
        sourceId: spec.sourceId,
        locator: spec.locator,
        ...constraint,
      }),
    ),
    required_relation_constraints: spec.relations.map((relation) =>
      reviewedRelationConstraint({
        conceptId: spec.conceptId,
        sourceId: spec.sourceId,
        locator: spec.locator,
        ...relation,
      }),
    ),
  },
});

export const REVIEWED_STRUCTURE_PATCHES = deepFreeze(PATCH_SPECS.map(materializePatch));

const duplicateIds = (values) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
};

const mergeById = (existing = [], reviewed = []) => {
  const valuesById = new Map();
  for (const value of existing) valuesById.set(value.id, structuredClone(value));
  for (const value of reviewed) {
    const current = valuesById.get(value.id);
    const next = structuredClone(value);
    if (current?.allowed_values?.length && !next.allowed_values?.length) {
      next.allowed_values = structuredClone(current.allowed_values);
      if (
        !next.allowed_values.some(({ value }) => Object.is(value, next.example_value))
      ) {
        next.example_value = structuredClone(current.example_value);
      }
    }
    if (current?.source_claims?.length && next.source_claims) {
      const claims = [...current.source_claims, ...next.source_claims];
      next.source_claims = [...new Map(
        claims.map((sourceClaim) => [
          [sourceClaim.source_id, sourceClaim.locator, sourceClaim.supports].join("\0"),
          structuredClone(sourceClaim),
        ]),
      ).values()];
    }
    valuesById.set(value.id, next);
  }
  return [...valuesById.values()];
};

const assertRegistry = ({ patches, conceptById }) => {
  const duplicateConceptIds = duplicateIds(patches.map(({ concept_id: id }) => id));
  if (duplicateConceptIds.length) {
    throw new Error(`Reviewed structure patches repeat Concepts: ${duplicateConceptIds.join(", ")}`);
  }
  for (const patch of patches) {
    const concept = conceptById.get(patch.concept_id);
    if (!concept) throw new Error(`Reviewed structure target ${patch.concept_id} does not resolve`);
    if (concept.module_id !== patch.module_id) {
      throw new Error(
        `Reviewed structure target ${patch.concept_id} must be owned by ${patch.module_id}, found ${concept.module_id}`,
      );
    }
    const { identity_keys: identityKeys, fields, constraints, required_relation_constraints: relationConstraints } =
      patch.structure;
    for (const [kind, values] of [
      ["field", fields],
      ["constraint", constraints],
      ["required relation constraint", relationConstraints],
    ]) {
      const duplicates = duplicateIds(values.map(({ id }) => id));
      if (duplicates.length) {
        throw new Error(`${patch.concept_id} repeats ${kind} IDs: ${duplicates.join(", ")}`);
      }
    }
    const fieldIds = new Set(fields.map(({ id }) => id));
    const unresolvedIdentityKeys = identityKeys.filter((id) => !fieldIds.has(id));
    if (unresolvedIdentityKeys.length) {
      throw new Error(
        `${patch.concept_id} identity keys do not resolve to reviewed local fields: ${unresolvedIdentityKeys.join(", ")}`,
      );
    }
    for (const relationConstraint of relationConstraints) {
      if (!conceptById.has(relationConstraint.target_concept_id)) {
        throw new Error(
          `${patch.concept_id} relation target ${relationConstraint.target_concept_id} does not resolve`,
        );
      }
    }
  }
};

export const applyReviewedStructurePatches = (
  concepts,
  patches = REVIEWED_STRUCTURE_PATCHES,
) => {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  assertRegistry({ patches, conceptById });
  const patchByConceptId = new Map(patches.map((patch) => [patch.concept_id, patch]));
  return concepts.map((concept) => {
    const patch = patchByConceptId.get(concept.id);
    if (!patch) return structuredClone(concept);
    const current = concept.structure ?? {
      identity_keys: [],
      fields: [],
      constraints: [],
      required_relation_constraints: [],
    };
    const fields = mergeById(current.fields, patch.structure.fields);
    const identityKeys = [
      ...new Set([...current.identity_keys, ...patch.structure.identity_keys]),
    ];
    const mergedFieldIds = new Set(fields.map(({ id }) => id));
    const unresolvedIdentityKeys = identityKeys.filter((id) => !mergedFieldIds.has(id));
    if (unresolvedIdentityKeys.length) {
      throw new Error(
        `${concept.id} merged identity keys do not resolve to fields: ${unresolvedIdentityKeys.join(", ")}`,
      );
    }
    return {
      ...structuredClone(concept),
      structure: {
        identity_keys: identityKeys,
        fields,
        constraints: mergeById(current.constraints, patch.structure.constraints),
        required_relation_constraints: mergeById(
          current.required_relation_constraints,
          patch.structure.required_relation_constraints,
        ),
      },
    };
  });
};

export const REVIEWED_SUBTYPE_DISCRIMINATORS = deepFreeze([
  {
    parent_id: "Message",
    field_id: "message_role",
    children: [
      ["AssistantMessage", "assistant", { sender_id: "AgentActor:assistant-001", receiver_id: "UserActor:user-001" }],
      ["DeveloperMessage", "developer", { sender_id: "HumanActor:developer-001", receiver_id: "AgentActor:assistant-001" }],
      ["ExternalAgentMessage", "external-agent", { sender_id: "RemoteAgent:external-001", receiver_id: "AgentActor:assistant-001" }],
      ["SystemMessage", "system", { sender_id: "RuntimeSystem:system-001", receiver_id: "AgentActor:assistant-001" }],
      ["ToolObservationMessage", "tool", { sender_id: "Tool:tool-001", receiver_id: "AgentActor:assistant-001" }],
      ["ToolResultMessage", "tool", { sender_id: "Tool:tool-001", receiver_id: "AgentActor:assistant-001" }],
      ["UserMessage", "user", { sender_id: "UserActor:user-001", receiver_id: "AgentActor:assistant-001" }],
    ],
  },
  {
    parent_id: "ContentBlock",
    field_id: "modality",
    children: [
      ["AudioBlock", "audio", { block_id: "block-audio-001", mime_type: "audio/wav", encoding: "binary" }],
      ["CodeBlock", "code", { block_id: "block-code-001", mime_type: "text/x-code", encoding: "utf-8" }],
      ["FileAttachmentBlock", "file", { block_id: "block-file-001", mime_type: "application/octet-stream", encoding: "binary" }],
      ["ImageBlock", "image", { block_id: "block-image-001", mime_type: "image/png", encoding: "binary" }],
      ["StructuredDataBlock", "structured-data", { block_id: "block-data-001", mime_type: "application/json", encoding: "utf-8" }],
      ["TableBlock", "table", { block_id: "block-table-001", mime_type: "text/csv", encoding: "utf-8" }],
      ["TextBlock", "text", { block_id: "block-text-001", mime_type: "text/plain", encoding: "utf-8" }],
    ],
  },
]);

const controlledDiscriminatorValue = ({ field, value, childId }) => ({
  id: `${field.id}_${String(value).replaceAll(/[^A-Za-z0-9]+/gu, "_")}`,
  value,
  labels: localized(value, value, value),
  definitions: localized(
    `${value} 是 ${field.labels.zh} 的受控值，并由 ${childId} 下位概念进一步限定。`,
    `${value} is a controlled ${field.labels.en} value further constrained by the ${childId} subtype.`,
    `${value} は ${field.labels.ja} の統制値で、${childId} 下位概念によりさらに限定されます。`,
  ),
  status: "accepted",
  source_claims: field.source_claims.map((sourceClaim) => ({
    ...structuredClone(sourceClaim),
    supports: `Supports the reviewed ${field.id} discriminator value ${value} for ${childId}.`,
  })),
});

export const applyReviewedSubtypeDiscriminators = ({
  concepts,
  relations,
  specifications = REVIEWED_SUBTYPE_DISCRIMINATORS,
}) => specifications.reduce((currentConcepts, specification) => {
  const conceptById = new Map(currentConcepts.map((concept) => [concept.id, concept]));
  const parent = conceptById.get(specification.parent_id);
  if (!parent) throw new Error(`Subtype discriminator parent ${specification.parent_id} does not resolve`);
  const parentField = parent.structure?.fields.find(({ id }) => id === specification.field_id);
  if (!parentField) {
    throw new Error(
      `Subtype discriminator field ${specification.parent_id}.${specification.field_id} does not resolve`,
    );
  }
  const directChildren = new Set(
    relations
      .filter(
        (relation) =>
          relation.predicate === "is_a" && relation.target_id === specification.parent_id,
      )
      .map(({ source_id: sourceId }) => sourceId),
  );
  const controlledByValue = new Map();
  for (const [childId, value] of specification.children) {
    if (!conceptById.has(childId) || !directChildren.has(childId)) {
      throw new Error(`${childId} must be a direct is_a child of ${specification.parent_id}`);
    }
    if (!controlledByValue.has(value)) {
      controlledByValue.set(
        value,
        controlledDiscriminatorValue({ field: parentField, value, childId }),
      );
    }
  }
  const reviewedParentField = {
    ...structuredClone(parentField),
    allowed_values: [...controlledByValue.values()].map((value) => structuredClone(value)),
  };
  const updatedById = new Map([
    [
      parent.id,
      {
        ...structuredClone(parent),
        structure: {
          ...structuredClone(parent.structure),
          fields: parent.structure.fields.map((field) =>
            field.id === reviewedParentField.id ? reviewedParentField : structuredClone(field),
          ),
        },
      },
    ],
  ]);
  for (const [childId, value, fieldExamples] of specification.children) {
    const child = conceptById.get(childId);
    const reviewedFields = [
      ...Object.entries({ [specification.field_id]: value, ...fieldExamples }).map(
        ([fieldId, exampleValue]) => {
          const baseField = parent.structure.fields.find(({ id }) => id === fieldId);
          if (!baseField) {
            throw new Error(`Subtype discriminator override ${childId}.${fieldId} does not resolve`);
          }
          return {
            ...structuredClone(baseField),
            allowed_values:
              fieldId === specification.field_id
                ? [structuredClone(controlledByValue.get(value))]
                : structuredClone(baseField.allowed_values),
            example_value: structuredClone(exampleValue),
          };
        },
      ),
    ];
    const reviewedFieldById = new Map(reviewedFields.map((field) => [field.id, field]));
    const currentStructure = child.structure ?? {
      identity_keys: [],
      fields: [],
      constraints: [],
      required_relation_constraints: [],
    };
    updatedById.set(childId, {
      ...structuredClone(child),
      structure: {
        ...structuredClone(currentStructure),
        fields: [
          ...currentStructure.fields
            .filter(({ id }) => !reviewedFieldById.has(id))
            .map((field) => structuredClone(field)),
          ...reviewedFields,
        ],
      },
    });
  }
  return currentConcepts.map((concept) =>
    structuredClone(updatedById.get(concept.id) ?? concept),
  );
}, concepts.map((concept) => structuredClone(concept)));

const uniqueClaims = (claims) => {
  const byIdentity = new Map();
  for (const sourceClaim of claims) {
    const key = [sourceClaim.source_id, sourceClaim.locator, sourceClaim.supports].join("\0");
    if (!byIdentity.has(key)) byIdentity.set(key, structuredClone(sourceClaim));
  }
  return [...byIdentity.values()];
};

const structuredInstanceExample = (concept, fields) => {
  const labels = concept.labels;
  return {
    id: `${concept.id}-example-instance-001`,
    kind: "instance",
    labels: localized(
      `${labels.zh}结构化实例`,
      `Structured instance of ${labels.en}`,
      `${labels.ja}の構造化インスタンス`,
    ),
    scenario_id: null,
    descriptions: localized(
      `该合成记录逐项使用${labels.zh}节点内“结构与约束”字段中可用的非空样例值，用于验证信息附着于节点而不生成实例图。`,
      `This synthetic record uses every available non-null field example from the ${labels.en} node's structure contract to validate inline information without creating an instance graph.`,
      `この合成記録は${labels.ja}ノードの構造契約にある利用可能な非空フィールド例を用い、インスタンスグラフを作らずノード内情報を検証します。`,
    ),
    field_values: Object.fromEntries(
      fields
        .filter(
          (field) =>
            field.example_value !== null && field.example_value !== undefined,
        )
        .map((field) => {
          const repeatable = field.cardinality.max === null || field.cardinality.max > 1;
          const value = repeatable && !Array.isArray(field.example_value)
            ? [field.example_value]
            : field.example_value;
          return [field.id, structuredClone(value)];
        }),
    ),
    related_node_ids: [concept.id],
    related_relation_ids: [],
    expected_result: localized(
      "字段值通过该 Concept 的结构与约束验证，且实例仅作为节点内说明信息显示。",
      "Field values satisfy the Concept structure contract, and the instance remains explanatory information on the node.",
      "フィールド値は Concept の構造契約を満たし、インスタンスはノード内の説明情報として保持されます。",
    ),
    why_valid_or_invalid: localized(
      "每个字段键与节点字段 ID 完全一致；单值直接取经审查样例，可重复字段按其基数组装为数组。",
      "Every field key exactly matches a node field ID; scalar values come from reviewed examples and repeatable fields are assembled as arrays according to cardinality.",
      "各フィールドキーはノードのフィールド ID と一致し、単一値はレビュー済み例から取得し、反復可能フィールドは基数に従って配列化します。",
    ),
    synthetic: true,
    verified_version: VERSION_IRI,
    source_claims: uniqueClaims(fields.flatMap(({ source_claims: claims }) => claims)),
  };
};

export const addStructuredInstanceExamples = (concepts, relations = []) => {
  const effectiveByConceptId = buildEffectiveConceptStructures({
    classes: concepts,
    relations,
  });
  return concepts.map((concept) => {
    const cloned = structuredClone(concept);
    const fields = effectiveByConceptId.get(concept.id)?.fields ?? [];
    if (!fields.length) return cloned;
    const instance = structuredInstanceExample(cloned, fields);
    return {
      ...cloned,
      examples: [
        ...(cloned.examples ?? []).filter(({ id }) => id !== instance.id),
        instance,
      ],
    };
  });
};
