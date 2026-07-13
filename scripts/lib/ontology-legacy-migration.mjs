import {
  acceptedField,
  claimsFor,
  localized,
  versionIri,
} from "./ontology-migration-factories.mjs";

const addField = (concepts, conceptId, field) => {
  const index = concepts.findIndex(({ id }) => id === conceptId);
  if (index < 0) throw new Error(`Cannot attach field ${field.id}: Concept ${conceptId} is absent`);
  const concept = concepts[index];
  if (concept.structure.fields.some(({ id }) => id === field.id)) {
    throw new Error(`Concept ${conceptId} already has field ${field.id}`);
  }
  return [
    ...concepts.slice(0, index),
    {
      ...concept,
      structure: {
        ...concept.structure,
        fields: [...concept.structure.fields, field],
      },
    },
    ...concepts.slice(index + 1),
  ];
};

const replaceField = (concepts, conceptId, fieldId, replace) => {
  const index = concepts.findIndex(({ id }) => id === conceptId);
  if (index < 0) throw new Error(`Cannot update field ${fieldId}: Concept ${conceptId} is absent`);
  const concept = concepts[index];
  const fieldIndex = concept.structure.fields.findIndex(({ id }) => id === fieldId);
  if (fieldIndex < 0) throw new Error(`Concept ${conceptId} has no field ${fieldId}`);
  const fields = concept.structure.fields.map((field, current) =>
    current === fieldIndex ? replace(field) : field,
  );
  return [
    ...concepts.slice(0, index),
    { ...concept, structure: { ...concept.structure, fields } },
    ...concepts.slice(index + 1),
  ];
};

const upsertField = (concepts, conceptId, field) => {
  const concept = concepts.find(({ id }) => id === conceptId);
  const existing = concept?.structure.fields.find(({ id }) => id === field.id);
  if (!existing) return addField(concepts, conceptId, field);
  return replaceField(concepts, conceptId, field.id, (current) => ({
    ...current,
    source_claims: [
      ...current.source_claims,
      ...field.source_claims.filter(
        (claim) => !current.source_claims.some(
          (candidate) =>
            candidate.source_id === claim.source_id && candidate.supports === claim.supports,
        ),
      ),
    ],
  }));
};

export const conceptLocalFieldId = (fieldId) => fieldId.split(".").at(-1) ?? fieldId;

export const populateRequiredConceptExampleFields = ({ concepts, relations }) => {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  const parentsByConcept = new Map(concepts.map(({ id }) => [id, []]));
  for (const relation of relations) {
    if (relation.predicate === "is_a" && parentsByConcept.has(relation.source_id)) {
      parentsByConcept.get(relation.source_id).push(relation.target_id);
    }
  }
  const fieldCache = new Map();
  const effectiveFields = (conceptId) => {
    if (fieldCache.has(conceptId)) return fieldCache.get(conceptId);
    const fields = new Map();
    fieldCache.set(conceptId, fields);
    for (const parentId of parentsByConcept.get(conceptId) ?? []) {
      for (const [fieldId, field] of effectiveFields(parentId)) fields.set(fieldId, field);
    }
    for (const field of conceptById.get(conceptId)?.structure?.fields ?? []) {
      fields.set(field.id, field);
    }
    return fields;
  };
  const membershipKinds = new Set(["positive", "instance", "case-fragment"]);
  return concepts.map((concept) => {
    const fields = effectiveFields(concept.id);
    return {
      ...concept,
      examples: concept.examples.map((example) => {
        if (!membershipKinds.has(example.kind)) return example;
        const fieldValues = { ...example.field_values };
        for (const field of fields.values()) {
          if (
            (field.required || field.cardinality.min > 0) &&
            !Object.hasOwn(fieldValues, field.id)
          ) {
            const repeatable = field.cardinality.max === null || field.cardinality.max > 1;
            fieldValues[field.id] =
              repeatable && !Array.isArray(field.example_value)
                ? [field.example_value]
                : structuredClone(field.example_value);
          }
        }
        return { ...example, field_values: fieldValues };
      }),
    };
  });
};

const addIdentityKey = (concepts, conceptId, fieldId) => {
  const index = concepts.findIndex(({ id }) => id === conceptId);
  if (index < 0) throw new Error(`Cannot add identity key ${fieldId}: Concept ${conceptId} is absent`);
  const concept = concepts[index];
  if (concept.structure.identity_keys.includes(fieldId)) return concepts;
  return [
    ...concepts.slice(0, index),
    {
      ...concept,
      structure: {
        ...concept.structure,
        identity_keys: [...concept.structure.identity_keys, fieldId],
      },
    },
    ...concepts.slice(index + 1),
  ];
};

const controlledTargets = {
  AdapterFamily: {
    conceptId: "Adapter",
    fieldId: "adapter_family",
    labels: localized("适配器族", "Adapter family", "アダプタファミリ"),
    definitions: localized(
      "标识适配器所面向的协议、框架、基准或导出构造族。",
      "Identifies the protocol, framework, benchmark, or export construct family addressed by an Adapter.",
      "アダプタが対象とするプロトコル、フレームワーク、ベンチマーク、またはエクスポート構成のファミリを識別します。",
    ),
  },
  DecisionKind: {
    conceptId: "PolicyDecision",
    fieldId: "decision_kind",
    labels: localized("决策种类", "Decision kind", "判断種別"),
    definitions: localized(
      "记录策略评估产生的允许、拒绝、升级、脱敏或沙箱处置。",
      "Records whether policy evaluation allows, denies, escalates, redacts, or sandboxes an operation.",
      "ポリシー評価が許可、拒否、エスカレーション、秘匿化、サンドボックス化のどれを決定したかを記録します。",
    ),
  },
  RiskLevel: {
    conceptId: "DefenseFinding",
    fieldId: "risk_level",
    labels: localized("风险等级", "Risk level", "リスクレベル"),
    definitions: localized(
      "表示防御发现经审查后的严重程度。",
      "Represents the reviewed severity of a defense finding.",
      "防御所見のレビュー済み重大度を表します。",
    ),
  },
  Status: {
    conceptId: "RunAttempt",
    fieldId: "status",
    labels: localized("执行状态", "Execution status", "実行状態"),
    definitions: localized(
      "记录一次执行尝试当前所处的受控生命周期状态。",
      "Records the controlled lifecycle state of one Run Attempt.",
      "一回の実行試行が現在置かれている統制済みライフサイクル状態を記録します。",
    ),
  },
  TransportKind: {
    conceptId: "MCPTransport",
    fieldId: "transport_kind",
    labels: localized("传输种类", "Transport kind", "転送種別"),
    definitions: localized(
      "标识 MCP 会话使用的已协商传输机制。",
      "Identifies the negotiated transport mechanism used by an MCP session.",
      "MCP セッションで使用する合意済み転送機構を識別します。",
    ),
  },
  Visibility: {
    conceptId: "Artifact",
    fieldId: "visibility",
    labels: localized("可见范围", "Visibility", "可視範囲"),
    definitions: localized(
      "标识产物可被公开、用户、会话或私有范围访问。",
      "Identifies whether an Artifact is accessible publicly, by a user, within a session, or privately.",
      "成果物が公開、ユーザー、セッション、または非公開のどの範囲でアクセス可能かを識別します。",
    ),
  },
};

const controlledFieldMetadata = {
  "Artifact.status": {
    labels: localized("产物状态", "Artifact status", "成果物状態"),
    definitions: localized(
      "标识产物当前处于草稿、最终或其他经治理的发布状态；状态变化不改变产物的内容种类。",
      "Identifies an Artifact's governed draft, final, or other release state without changing its content kind.",
      "成果物の下書き・最終などの統制済み公開状態を識別し、内容種別は変更しません。",
    ),
  },
  "RuntimeSession.lifecycle_state": {
    labels: localized("会话生命周期状态", "Session lifecycle state", "セッションライフサイクル状態"),
    definitions: localized(
      "记录运行会话当前所处的受控生命周期状态；状态转移由具名会话生命周期事件表达。",
      "Records a RuntimeSession's current controlled lifecycle state; named session lifecycle events express transitions.",
      "実行セッションの現在の統制済みライフサイクル状態を記録し、遷移は記名セッションライフサイクルイベントで表します。",
    ),
  },
  "MemoryRecord.memory_kind": {
    labels: localized("记忆种类", "Memory kind", "記憶種別"),
    definitions: localized(
      "标识记忆记录的语义或功能种类，例如情景、语义、程序、偏好、经验或反思；该维度独立于记忆持续时长和可见范围。",
      "Identifies a MemoryRecord's semantic or functional kind, such as episodic, semantic, procedural, preference, experience, or reflective; this dimension is independent of duration and scope.",
      "記憶レコードの意味的または機能的な種別（エピソード、意味、手続き、選好、経験、内省など）を識別し、持続期間と可視範囲から独立させます。",
    ),
  },
  "MemoryRecord.memory_duration": {
    labels: localized("记忆持续时长", "Memory duration", "記憶持続期間"),
    definitions: localized(
      "标识记忆记录按保留与使用周期划分的持续时长，例如工作、短期或长期；该维度独立于记忆种类和可见范围。",
      "Identifies a MemoryRecord's retention and use duration, such as working, short-term, or long-term; this dimension is independent of kind and scope.",
      "記憶レコードの保持・利用周期（作業、短期、長期など）を識別し、記憶種別と可視範囲から独立させます。",
    ),
  },
  "MemoryRecord.memory_scope": {
    labels: localized("记忆适用范围", "Memory scope", "記憶適用範囲"),
    definitions: localized(
      "标识记忆记录可被复用的边界，例如任务内、会话内或跨会话；该维度独立于记忆种类和持续时长。",
      "Identifies the boundary within which a MemoryRecord may be reused, such as task, session, or cross-session; this dimension is independent of kind and duration.",
      "記憶レコードを再利用できる境界（タスク内、セッション内、セッション横断など）を識別し、記憶種別と持続期間から独立させます。",
    ),
  },
};

const convertedFieldSpecs = {
  CommandExitStatus: {
    datatype: "object",
    required: true,
    exampleValue: { code: 0, signal: null, reason: "completed" },
  },
  Encoding: {
    datatype: "string",
    cardinality: { min: 0, max: null },
    exampleValue: "utf-8",
  },
  MessageModality: { datatype: "string", required: true, exampleValue: "text" },
  MimeType: { datatype: "string", exampleValue: "text/plain" },
  TokenCount: { datatype: "integer", exampleValue: 128 },
  ConversationId: {
    datatype: "string",
    required: true,
    identityKey: true,
    exampleValue: "conversation-001",
  },
  MessageReceiver: {
    datatype: "reference",
    cardinality: { min: 0, max: null },
    exampleValue: "AgentActor:assistant-001",
  },
  MessageRole: { datatype: "string", required: true, exampleValue: "user" },
  MessageSender: {
    datatype: "reference",
    required: true,
    exampleValue: "UserActor:user-001",
  },
  PromptVariable: {
    datatype: "object",
    cardinality: { min: 0, max: null },
    exampleValue: { name: "repository", value: "moonweave-ai", source: "user" },
  },
  ReplyTo: { datatype: "reference", exampleValue: "Message:message-000" },
  ThreadId: { datatype: "string", exampleValue: "thread-001" },
  TurnIndex: { datatype: "integer", required: true, exampleValue: 1 },
  LengthLimit: {
    datatype: "object",
    exampleValue: { value: 4096, unit: "token" },
  },
  EnvironmentVariable: {
    datatype: "object",
    cardinality: { min: 0, max: null },
    exampleValue: { name: "LOG_LEVEL", value_reference: "env:LOG_LEVEL" },
  },
  ToolArgumentSchema: { datatype: "object", exampleValue: { type: "object" } },
  ToolDescription: { datatype: "string", exampleValue: "Reads a versioned resource." },
  ToolName: {
    datatype: "string",
    required: true,
    identityKey: true,
    exampleValue: "read_resource",
  },
  ToolResultSchema: { datatype: "object", exampleValue: { type: "object" } },
  ToolVersion: {
    datatype: "string",
    required: true,
    identityKey: true,
    exampleValue: "2.0.0",
  },
  CommandArea: { datatype: "reference", exampleValue: "WorkingDirectory:/workspace" },
  CommandArgument: {
    datatype: "object",
    cardinality: { min: 0, max: null },
    exampleValue: { position: 0, value: "--version" },
  },
  ToolArgument: {
    datatype: "object",
    cardinality: { min: 0, max: null },
    exampleValue: { name: "path", value: "README.md" },
  },
};

export const reviewedConceptDefinitions = ({ decision, legacyDefinitions }) =>
  decision.definitions ??
  (decision.decision === "retype" ? decision.rationale : legacyDefinitions);

const valueLabels = {
  AdapterA2A: localized("A2A 适配器族", "A2A adapter family", "A2A アダプタファミリ"),
  AdapterCrewAI: localized("CrewAI 适配器族", "CrewAI adapter family", "CrewAI アダプタファミリ"),
  AdapterDeepAgents: localized("Deep Agents 适配器族", "Deep Agents adapter family", "Deep Agents アダプタファミリ"),
  AdapterFIPA: localized("FIPA 适配器族", "FIPA adapter family", "FIPA アダプタファミリ"),
  AdapterKQML: localized("KQML 适配器族", "KQML adapter family", "KQML アダプタファミリ"),
  AdapterLangGraph: localized("LangGraph 适配器族", "LangGraph adapter family", "LangGraph アダプタファミリ"),
  AdapterMCP: localized("MCP 适配器族", "MCP adapter family", "MCP アダプタファミリ"),
  AdapterOpenAIAgents: localized("OpenAI Agents 适配器族", "OpenAI Agents adapter family", "OpenAI Agents アダプタファミリ"),
  DecisionAllow: localized("允许", "Allow", "許可"),
  DecisionDeny: localized("拒绝", "Deny", "拒否"),
  DecisionEscalate: localized("升级处理", "Escalate", "エスカレーション"),
  DecisionRedact: localized("脱敏", "Redact", "秘匿化"),
  DecisionSandbox: localized("沙箱执行", "Sandbox", "サンドボックス"),
  RiskCritical: localized("严重", "Critical", "重大"),
  RiskHigh: localized("高", "High", "高"),
  RiskLow: localized("低", "Low", "低"),
  RiskMedium: localized("中", "Medium", "中"),
  StatusBlocked: localized("已阻断", "Blocked", "遮断済み"),
  StatusCompleted: localized("已完成", "Completed", "完了"),
  StatusFailed: localized("已失败", "Failed", "失敗"),
  StatusPaused: localized("已暂停", "Paused", "一時停止"),
  StatusReady: localized("就绪", "Ready", "準備完了"),
  StatusRunning: localized("运行中", "Running", "実行中"),
  TransportHttp: localized("HTTP", "HTTP", "HTTP"),
  TransportSse: localized("服务器发送事件", "Server-Sent Events", "Server-Sent Events"),
  TransportStdio: localized("标准输入输出", "Standard I/O", "標準入出力"),
  TransportWebSocket: localized("WebSocket", "WebSocket", "WebSocket"),
  VisibilityPrivate: localized("私有", "Private", "非公開"),
  VisibilityPublic: localized("公开", "Public", "公開"),
  VisibilitySession: localized("会话内", "Session", "セッション"),
  VisibilityUser: localized("用户范围", "User", "ユーザー"),
};

const controlledValueToken = (individual) =>
  individual.id
    .replace(/^(Adapter|Decision|Risk|Status|Transport|Visibility)/, "")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();

export const migrateLegacyIndividuals = ({
  concepts: inputConcepts,
  individuals,
  sourceRegistryById,
}) => {
  let concepts = inputConcepts;
  const controlledGroups = Object.groupBy(
    individuals.filter(({ class_id: classId }) => controlledTargets[classId]),
    ({ class_id: classId }) => classId,
  );

  for (const [classId, values] of Object.entries(controlledGroups)) {
    const target = controlledTargets[classId];
    const sourceIds = [...new Set(values.flatMap(({ source_ids: ids }) => ids))];
    const allowedValues = values.map((individual) => ({
      id: individual.id,
      value: controlledValueToken(individual),
      labels: valueLabels[individual.id],
      definitions: individual.definitions,
      status: "accepted",
      source_claims: claimsFor({
        sourceIds: individual.source_ids,
        ownerId: individual.id,
        assertion: `Supports the reviewed controlled value ${individual.id}.`,
        sourceRegistryById,
      }),
    }));
    concepts = addField(
      concepts,
      target.conceptId,
      acceptedField({
        id: target.fieldId,
        labels: target.labels,
        datatype: "string",
        definitions: target.definitions,
        exampleValue: allowedValues[0].value,
        sourceIds,
        sourceRegistryById,
        allowedValues,
      }),
    );
  }

  const rows = individuals.map((individual) => {
    if (individual.class_id === "PlaneIndividual") {
      const targetNodeId = individual.id
        .replace(/^Individual_/, "")
        .replace(/_/g, "-");
      return {
        individual_id: individual.id,
        current_class_id: individual.class_id,
        classification: "governance_metadata",
        target_node_id: targetNodeId,
        target_field_id: "",
        target_example_id: "",
        action: "merged into Domain status, review, and change metadata",
        rationale: "This legacy record represented a navigation/governance node, not an Agent-system instance.",
        reviewer: "codex-individual-migration-reviewer",
        status: "accepted",
      };
    }
    if (individual.class_id === "ModuleIndividual") {
      const targetNodeId = individual.id
        .replace(/^Individual_/, "")
        .replace(/_/g, "-");
      return {
        individual_id: individual.id,
        current_class_id: individual.class_id,
        classification: "governance_metadata",
        target_node_id: targetNodeId,
        target_field_id: "",
        target_example_id: "",
        action: "merged into Module status, review, and change metadata",
        rationale: "This legacy record represented Module governance metadata rather than a runtime individual.",
        reviewer: "codex-individual-migration-reviewer",
        status: "accepted",
      };
    }
    const target = controlledTargets[individual.class_id];
    if (!target) throw new Error(`No reviewed classification for individual ${individual.id}`);
    return {
      individual_id: individual.id,
      current_class_id: individual.class_id,
      classification: "controlled_value",
      target_node_id: target.conceptId,
      target_field_id: target.fieldId,
      target_example_id: "",
      action: `attached to ${target.conceptId}.${target.fieldId}.allowed_values`,
      rationale: "The record denotes a reusable enumerated value, not a separately navigable Concept or ABox individual.",
      reviewer: "codex-individual-migration-reviewer",
      status: "accepted",
    };
  });
  return { concepts, rows };
};

const genericFieldTargets = {
  has_byte_count: ["Artifact", "byte_count", localized("字节数", "Byte count", "バイト数"), 1024],
  has_confidence: ["Measurement", "confidence", localized("置信度", "Confidence", "信頼度"), 0.9],
  has_cost: ["RuntimeBudget", "cost", localized("成本", "Cost", "コスト"), 1.25],
  has_description: ["ToolDefinition", "description", localized("说明", "Description", "説明"), "Read a resource"],
  has_duration_ms: ["RunAttempt", "duration_ms", localized("持续毫秒数", "Duration milliseconds", "継続時間ミリ秒"), 1250],
  has_end_time: ["RuntimeSession", "end_time", localized("结束时间", "End time", "終了時刻"), "2026-07-13T12:01:00Z"],
  has_error_code: ["ErrorEvent", "error_code", localized("错误代码", "Error code", "エラーコード"), "TIMEOUT"],
  has_hash: ["Artifact", "content_hash", localized("内容摘要", "Content hash", "内容ハッシュ"), "sha256:…"],
  has_identifier: ["AgentSystem", "system_id", localized("系统标识", "System ID", "システム ID"), "agent-system-001"],
  has_label: ["Artifact", "display_label", localized("显示名称", "Display label", "表示名"), "repair-report"],
  has_priority: ["Instruction", "priority", localized("优先级", "Priority", "優先度"), 10],
  has_rank: ["DiscoveryResult", "rank", localized("排序位置", "Rank", "順位"), 1],
  has_retry_count: ["RunAttempt", "retry_count", localized("重试次数", "Retry count", "再試行回数"), 1],
  has_score: ["Score", "value", localized("分值", "Score value", "スコア値"), 0.85],
  has_start_time: ["RuntimeSession", "start_time", localized("开始时间", "Start time", "開始時刻"), "2026-07-13T12:00:00Z"],
  has_status: ["RunAttempt", "legacy_status_text", localized("旧状态文本", "Legacy status text", "旧状態テキスト"), "running"],
  has_timestamp: ["TraceEvent", "timestamp", localized("时间戳", "Timestamp", "タイムスタンプ"), "2026-07-13T12:00:01Z"],
  has_token_count: ["ContentBlock", "token_count", localized("令牌数", "Token count", "トークン数"), 128],
  has_uri: ["SourceReference", "uri", localized("资源标识符", "Resource URI", "リソース URI"), "https://example.invalid/source"],
  has_warning_code: ["Warning", "warning_code", localized("警告代码", "Warning code", "警告コード"), "W_RETRY"],
};

export const migrateLegacyDataProperties = ({
  concepts: inputConcepts,
  properties,
  sourceRegistryById,
}) => {
  let concepts = inputConcepts;
  const rows = [];
  for (const property of properties) {
    const target = genericFieldTargets[property.id];
    if (!target) {
      rows.push({
        data_property_id: property.id,
        action: "remove_generated_module_boilerplate",
        target_node_id: "",
        target_field_id: "",
        rationale:
          property.id.endsWith("_has_state")
            ? "Module lifecycle state is already represented by governed Module status and must not be duplicated as a scalar field."
            : "Evidence strength belongs to individual source-claim confidence and must not be copied into one module-wide scalar.",
        reviewer: "codex-field-migration-reviewer",
        status: "accepted",
      });
      continue;
    }
    const [conceptId, fieldId, labels, exampleValue] = target;
    const field = acceptedField({
      id: fieldId,
      labels,
      datatype: property.range,
      definitions: property.definitions,
      exampleValue,
      sourceIds: property.source_ids,
      sourceRegistryById,
    });
    concepts = upsertField(concepts, conceptId, field);
    rows.push({
      data_property_id: property.id,
      action: "attach_to_concept_structure",
      target_node_id: conceptId,
      target_field_id: fieldId,
      rationale: "The scalar is useful node information and is therefore owned by one concrete Concept field, not a parallel data-property graph.",
      reviewer: "codex-field-migration-reviewer",
      status: "accepted",
    });
  }
  return { concepts, rows };
};

export const attachConvertedField = ({
  concepts,
  decision,
  legacyConcept,
  sourceRegistryById,
}) => {
  if (!decision.target_concept_id || !decision.target_field_id) {
    throw new Error(`Converted Concept ${decision.concept_id} lacks target_concept_id/target_field_id`);
  }
  const labels = decision.labels ?? legacyConcept.labels;
  const fieldId = conceptLocalFieldId(decision.target_field_id);
  const spec = convertedFieldSpecs[decision.concept_id] ?? {
    datatype: "string",
    exampleValue: labels.en,
  };
  let next = addField(
    concepts,
    decision.target_concept_id,
    acceptedField({
      id: fieldId,
      labels,
      datatype: spec.datatype,
      definitions: decision.rationale,
      exampleValue: spec.exampleValue,
      sourceIds: legacyConcept.source_ids,
      sourceRegistryById,
      required: spec.required ?? false,
      cardinality:
        spec.cardinality ?? { min: spec.required ? 1 : 0, max: 1 },
    }),
  );
  if (spec.identityKey) {
    next = addIdentityKey(next, decision.target_concept_id, fieldId);
  }
  return next;
};

export const attachConvertedControlledValue = ({
  concepts,
  decision,
  legacyConcept,
  sourceRegistryById,
}) => {
  if (!decision.target_concept_id || !decision.target_field_id) {
    throw new Error(`Controlled-value Concept ${decision.concept_id} lacks its target field`);
  }
  const concept = concepts.find(({ id }) => id === decision.target_concept_id);
  const fieldId = conceptLocalFieldId(decision.target_field_id);
  const metadataKey = `${decision.target_concept_id}.${fieldId}`;
  const existing = concept?.structure.fields.find(({ id }) => id === fieldId);
  const fieldMetadata = controlledFieldMetadata[metadataKey] ?? {
    labels: localized("受控分类", "Controlled classification", "統制分類"),
    definitions: localized(
      "保存经本体审查的受控分类值。",
      "Stores a controlled classification value accepted by ontology review.",
      "本体レビューで承認された統制分類値を保存します。",
    ),
  };
  let next = concepts;
  if (!existing) {
    next = addField(
      next,
      decision.target_concept_id,
      acceptedField({
        id: fieldId,
        labels: fieldMetadata.labels,
        datatype: "string",
        definitions: fieldMetadata.definitions,
        exampleValue: decision.concept_id,
        sourceIds: legacyConcept.source_ids,
        sourceRegistryById,
      }),
    );
  }
  const labels = decision.labels ?? legacyConcept.labels;
  return replaceField(next, decision.target_concept_id, fieldId, (field) => ({
    ...field,
    allowed_values: [
      ...field.allowed_values,
      {
        id: decision.concept_id,
        value: decision.concept_id,
        labels,
        definitions: legacyConcept.definitions,
        status: "accepted",
        source_claims: claimsFor({
          sourceIds: legacyConcept.source_ids,
          ownerId: decision.concept_id,
          assertion: `Supports controlled value ${decision.concept_id}.`,
          sourceRegistryById,
        }),
      },
    ],
  }));
};

const adapterOwners = {
  MCP: "MCPAdapter",
  A2A: "A2AAdapter",
  "FIPA-KQML": "ProtocolAdapter",
  "LangGraph/OpenAI/CrewAI/DeepAgents": "FrameworkAdapter",
  Statechart: "StatechartAdapter",
  Benchmark: "BenchmarkAdapter",
  Schema: "SchemaAdapter",
};

export const migrateLegacyAdapterMappings = ({
  concepts: inputConcepts,
  mappings,
  sourceRegistryById,
  canonicalTargetIdByLegacyId = new Map(),
}) => {
  let concepts = inputConcepts;
  const rows = [];
  for (const mapping of mappings) {
    const ownerId = adapterOwners[mapping.adapter];
    const index = concepts.findIndex(({ id }) => id === ownerId);
    if (index < 0) throw new Error(`Adapter mapping ${mapping.adapter} has no owner Concept ${ownerId}`);
    const owner = concepts[index];
    const canonicalTargetIds = mapping.maps_to.map((legacyTargetId) => {
      const targetId = canonicalTargetIdByLegacyId.get(legacyTargetId) ?? legacyTargetId;
      if (!concepts.some(({ id }) => id === targetId)) {
        throw new Error(
          `Adapter mapping ${mapping.adapter} target ${legacyTargetId} has no reviewed canonical target`,
        );
      }
      return targetId;
    });
    const externalMapping = {
      id: `${ownerId}-external-family-mapping`,
      system: mapping.adapter,
      external_identifier: `${mapping.adapter}:family`,
      external_version: "legacy-v1-frozen-family",
      canonical_target_ids: [...new Set(canonicalTargetIds)],
      mapping_kind: "related",
      scope: localized(
        `冻结 v1 所登记的 ${mapping.adapter} 适配器族概念范围。`,
        `The ${mapping.adapter} adapter-family concept range registered by frozen v1.`,
        `凍結 v1 に登録された ${mapping.adapter} アダプタファミリの概念範囲。`,
      ),
      direction: "bidirectional",
      loss_notes: localized(
        "族级记录不声明具体外部构造的逐字段语义；具体适配器节点的评审映射承担版本、范围与损失说明。",
        "The family-level record does not assert field-by-field semantics for concrete external constructs; reviewed concrete Adapter mappings carry version, scope, and loss details.",
        "ファミリ単位の記録は具体的な外部構成のフィールド別意味を主張せず、版・範囲・損失は審査済み具体 Adapter 写像が担います。",
      ),
      conversion_note: localized(
        `该族映射覆盖以下 canonical Concept：${mapping.maps_to.join("、")}。具体构造仍须逐项版本审查。`,
        `This family mapping covers these canonical Concepts: ${canonicalTargetIds.join(", ")}. Concrete constructs still require version-specific review.`,
        `このファミリ写像は次の canonical Concept を対象とします：${mapping.maps_to.join("、")}。具体的構成はバージョン別レビューが必要です。`,
      ),
      conformance: {
        status: "contract-tested",
        test_id: `${ownerId}-external-family-mapping-contract-test`,
        method: localized(
          "验证族级映射只有一个 Adapter 所有者，且所有 canonical 目标与来源均可解析。",
          "Validates that the family mapping has one Adapter owner and that every canonical target and source resolves.",
          "ファミリ写像が一つの Adapter 所有者を持ち、全 canonical 対象と出典を解決できることを検証します。",
        ),
      },
      status: "accepted",
      source_claims: claimsFor({
        sourceIds: mapping.source_ids,
        ownerId,
        assertion: `Supports the reviewed ${mapping.adapter} adapter-family mapping.`,
        sourceRegistryById,
      }),
    };
    concepts = [
      ...concepts.slice(0, index),
      { ...owner, external_mappings: [...owner.external_mappings, externalMapping] },
      ...concepts.slice(index + 1),
    ];
    rows.push({
      adapter: mapping.adapter,
      action: "attach_external_mapping_to_adapter_concept",
      target_node_id: ownerId,
      target_mapping_id: externalMapping.id,
      rationale: "The mapping is owned once by its canonical Adapter Concept and is reverse-indexed at runtime.",
      reviewer: "codex-adapter-migration-reviewer",
      status: "accepted",
    });
  }
  return { concepts, rows };
};

export const acceptedLegacyAxiomRows = (axioms) =>
  axioms.map((axiom) => {
    const retained = [
      "AX_adapter_terms_do_not_redefine_core",
      "AX_no_hidden_chain_of_thought_required",
      "AX_no_metadata_terms_in_subject_terms",
    ].includes(axiom.id);
    return {
      axiom_id: axiom.id,
      action: retained ? "migrate_to_root_constraint_or_hygiene_gate" : "remove_generated_or_redundant_template",
      target_id: retained
        ? axiom.id === "AX_no_hidden_chain_of_thought_required"
          ? "global-no-hidden-chain-of-thought"
          : axiom.id
        : "",
      rationale: retained
        ? "This axiom expresses a genuine whole-ontology invariant and is retained once at the root."
        : "The record mechanically restated membership, evidence, datatype, or domain/range already represented by canonical ownership, fields, and relations.",
      reviewer: "codex-axiom-migration-reviewer",
      status: "accepted",
    };
  });

export const additionalRootConstraints = ({ sourceRegistryById }) => [
  {
    id: "AX_adapter_terms_do_not_redefine_core",
    severity: "error",
    expression_language: "plain",
    expression: "Adapter mappings may reference core Concepts but cannot redefine their canonical meaning.",
    explanations: localized(
      "适配映射可以引用核心概念，但不能重定义其 canonical 语义。",
      "Adapter mappings may reference core Concepts but cannot redefine their canonical meaning.",
      "アダプタ写像はコア概念を参照できますが、その canonical な意味を再定義できません。",
    ),
    source_claims: claimsFor({
      sourceIds: ["eng-proto-mcp-spec", "eng-proto-a2a-docs", "eng-ont-fibo-ontology-guide"],
      ownerId: "AX_adapter_terms_do_not_redefine_core",
      assertion: "Supports separation between canonical core meaning and adapter mappings.",
      sourceRegistryById,
    }),
  },
  {
    id: "AX_no_metadata_terms_in_subject_terms",
    severity: "error",
    expression_language: "plain",
    expression: "Ontology-engineering annotations are artifact metadata and cannot become Agent-system Concepts solely to explain another node.",
    explanations: localized(
      "本体工程注解属于产物元数据，不能仅为解释另一节点而成为 Agent 系统概念。",
      "Ontology-engineering annotations are artifact metadata and cannot become Agent-system Concepts solely to explain another node.",
      "本体工学注釈は成果物メタデータであり、別ノードを説明するだけの Agent システム概念にはできません。",
    ),
    source_claims: claimsFor({
      sourceIds: ["eng-ont-fibo-ontology-guide", "eng-ont-palantir-core-concepts"],
      ownerId: "AX_no_metadata_terms_in_subject_terms",
      assertion: "Supports keeping ontology metadata separate from domain subject Concepts.",
      sourceRegistryById,
    }),
  },
];

export const migrationVersion = versionIri;
