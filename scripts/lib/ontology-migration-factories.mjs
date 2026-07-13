const VERSION_IRI = "https://moonweave.ai/ontology/agent-system/2.0.0/";

export const versionIri = VERSION_IRI;

export const localized = (zh, en, ja) => ({ zh, en, ja });

export const acceptedReview = (reviewer, note) => ({
  review_status: "accepted",
  reviewers: [
    {
      ...reviewer,
      decision_note: note,
    },
  ],
});

const reviewedSourceLocators = new Map([
  ["eng-ont-palantir-core-concepts", "Core concepts > Objects, properties, links, and actions"],
  ["eng-ont-microsoft-fabric-iq-ontology", "Overview > Ontology items, entity types, properties, and relationships"],
  ["eng-ont-prov-o", "W3C Recommendation > PROV-O classes and properties"],
  ["eng-proto-mcp-spec", "Specification > Architecture, base protocol, and server features"],
  ["eng-proto-mcp-auth", "Authorization specification > Authorization flow and protected-resource metadata"],
  ["eng-proto-a2a-spec", "Specification > Core concepts, Agent Card, Message, Task, and Artifact"],
  ["eng-proto-cloudevents", "CloudEvents specification > Context attributes"],
  ["eng-fw-openai-tracing", "Tracing guide > Traces, spans, and trace processors"],
  ["eng-fw-langgraph-docs", "Overview > Durable execution, human-in-the-loop, memory, and subgraphs"],
  ["eng-fw-crewai-docs", "Documentation > Agents, tasks, crews, flows, and processes"],
  ["eng-fw-microsoft-agent-framework-docs", "Overview > Agents, workflows, state, and orchestration"],
  ["eng-state-scxml", "W3C Recommendation > State machine concepts and executable content"],
  ["eng-val-jsonschema-spec", "Validation specification > Validation keywords"],
  ["lit-val-jsonschema-spec", "Validation specification > Validation keywords"],
  ["lit-mech-reflexion", "Sections 3–4 > Reflexion framework and episodic memory"],
  ["lit-agent-conductor", "Method and experiments > Conductor orchestration model"],
  ["lit-agent-toolorchestra", "Method > Tool orchestration and candidate selection"],
]);

export const sourceLocatorFor = (source) => {
  const reviewed = reviewedSourceLocators.get(source.id);
  if (reviewed) return reviewed;
  const type = String(source.source_type ?? "").toLowerCase();
  if (/repo|project|dataset/u.test(type)) {
    return `README > ${source.title} overview, architecture, and documented interfaces`;
  }
  if (/paper|acl|iclr|icml|neurips|emnlp|eacl|colm|arxiv|openreview|www|uist|k-cap|journal|survey|report/u.test(type)) {
    return `Paper > ${source.title}; abstract and method or system-architecture sections`;
  }
  if (/standard|spec|ietf|w3c|draft/u.test(type)) {
    return `Specification > ${source.title}; terminology, data model, and conformance sections`;
  }
  return `Documentation page > ${source.title} heading and documented conceptual model`;
};

export const sourceClaim = ({ sourceId, supports, sourceRegistryById }) => {
  const source = sourceRegistryById.get(sourceId);
  if (!source) throw new Error(`Cannot create source claim for unknown source ${sourceId}`);
  return {
    source_id: sourceId,
    supports,
    locator: sourceLocatorFor(source),
    evidence_kind: "design-inference",
    confidence: "medium",
    review_status: "accepted",
  };
};

export const claimsFor = ({ sourceIds, ownerId, assertion, sourceRegistryById }) =>
  [...new Set(sourceIds)].map((sourceId) =>
    sourceClaim({
      sourceId,
      supports: `${assertion} The ontology-specific boundary for ${ownerId} is an accepted design inference over this registered evidence.`,
      sourceRegistryById,
    }),
  );

const exampleId = (ownerId, suffix) => `${ownerId}-example-${suffix}`;

const inversePredicates = new Map([
  ["is_a", "has_subtype"],
  ["contains", "part_of"],
  ["part_of", "contains"],
  ["produces", "produced_by"],
  ["generated_by", "generates"],
  ["generates", "generated_by"],
  ["consumes", "consumed_by"],
  ["uses", "used_by"],
  ["hosts", "hosted_by"],
  ["member_of", "has_member"],
  ["maps_to", "mapped_from"],
  ["describes", "described_by"],
  ["described_by", "describes"],
  ["evaluates", "evaluated_by"],
  ["evaluated_by", "evaluates"],
  ["applies", "applied_by"],
  ["invokes", "invoked_by"],
  ["references", "referenced_by"],
  ["reads", "read_by"],
  ["writes", "written_by"],
  ["triggers", "triggered_by"],
  ["blocks", "blocked_by"],
  ["authorizes", "authorized_by"],
  ["governs", "governed_by"],
  ["governed_by", "governs"],
  ["creates", "created_by"],
  ["captures", "captured_by"],
  ["references_execution_result", "execution_result_referenced_by"],
  ["contains_block", "block_of"],
  ["exposes", "exposed_by"],
  ["contains_turn", "turn_of"],
  ["contains_segment", "segment_of"],
  ["located_at", "location_of"],
  ["stores", "stored_in"],
  ["acts_on", "acted_on_by"],
  ["has_binding", "binding_of"],
  ["contains_span", "span_of"],
  ["commits_to", "committed_to_by"],
  ["has_condition", "condition_of"],
  ["uses_pattern", "pattern_used_by"],
  ["contains_attempt", "attempt_of"],
  ["crosses", "crossed_by"],
  ["constrained_by", "constrains"],
  ["maps_task_to", "task_mapped_from"],
  ["maps_agent_to", "agent_mapped_from"],
  ["maps_state_to", "state_mapped_from"],
  ["contains_definition", "definition_in"],
  ["consumes_query", "query_consumed_by"],
  ["plans", "planned_by"],
  ["has_participant", "participant_in"],
  ["classified_by", "classifies"],
  ["uses_scenario", "scenario_used_by"],
  ["elaborated_by", "elaborates"],
  ["contains_step", "step_of"],
  ["has_attempt", "attempt_of"],
  ["produces_result", "produced_by_attempt"],
]);

const inversePredicate = (predicate) =>
  inversePredicates.get(predicate) ?? `is_target_of_${predicate}`;

const relationConditionSpecs = new Map([
  ["HumanActor-may_review-AgentActor", ["review authority is active for the human actor", "人工主体具备有效审核权限。", "The human actor has active review authority.", "人間アクターに有効なレビュー権限があります。"]],
  ["MappingRule-may_emit-ConversionWarning", ["conversion is lossy, ambiguous, or unsupported", "转换存在有损、歧义或不支持语义。", "The conversion is lossy, ambiguous, or unsupported.", "変換が損失的、曖昧、または未対応です。"]],
  ["ToolCallAttempt-may_cause-ToolSideEffect", ["the invoked tool performs an externally observable state change", "被调用工具产生外部可观察状态变化。", "The invoked tool performs an externally observable state change.", "呼び出されたツールが外部から観測可能な状態変更を行います。"]],
  ["MCPSession-may_emit-ToolError", ["a protocol, authorization, or transport failure occurs", "发生协议、授权或传输失败。", "A protocol, authorization, or transport failure occurs.", "プロトコル、認可、または転送の失敗が発生します。"]],
  ["CommitGate-may_produce-CommitApproval", ["all applicable policy and authority conditions evaluate to allow", "所有适用策略与权限条件均判定为允许。", "All applicable policy and authority conditions evaluate to allow.", "適用される方針と権限条件がすべて許可と評価されます。"]],
  ["CommitGate-may_produce-CommitDenial", ["at least one required policy or authority condition fails", "至少一项必需策略或权限条件失败。", "At least one required policy or authority condition fails.", "必須の方針または権限条件が少なくとも一つ失敗します。"]],
  ["Redaction-may_produce-SuppressedOutput", ["partial disclosure cannot satisfy the applicable redaction policy", "部分披露无法满足适用的脱敏策略。", "Partial disclosure cannot satisfy the applicable redaction policy.", "部分開示では適用される墨消し方針を満たせません。"]],
  ["PolicyDecision-may_apply_exception-PolicyException", ["the exception is active and its explicit applicability condition matches", "策略例外处于有效期内且显式适用条件匹配。", "The exception is active and its explicit applicability condition matches.", "例外が有効で、明示された適用条件に一致します。"]],
  ["Score-may_trigger-Correction", ["the measured score is below the applicable acceptance threshold", "测量分数低于适用的接受阈值。", "The measured score is below the applicable acceptance threshold.", "測定スコアが適用される受入閾値を下回ります。"]],
  ["IngestionRun-may_emit-ErrorEvent", ["access, parsing, validation, or policy processing fails", "访问、解析、验证或策略处理失败。", "Access, parsing, validation, or policy processing fails.", "アクセス、解析、検証、または方針処理が失敗します。"]],
]);

export const positiveAndBoundaryExamples = ({
  ownerId,
  labels,
  definitions,
  parentLabels = null,
  relatedNodeIds = [ownerId],
  relatedRelationIds = [],
  positiveDescriptions = null,
  boundaryDescriptions = null,
}) => [
  {
    id: exampleId(ownerId, "positive-001"),
    kind: "positive",
    labels: localized(
      `${labels.zh}正例`,
      `Positive example of ${labels.en}`,
      `${labels.ja}の正例`,
    ),
    scenario_id: null,
    descriptions:
      positiveDescriptions ??
      localized(
        `在合成审计场景 ${ownerId}-scenario-001 中，系统以 ${ownerId}-001 记录一项${labels.zh}；记录满足该概念的正式定义，并可沿 canonical ID 回查其结构、关系和来源。`,
        `In synthetic audit scenario ${ownerId}-scenario-001, the system records ${ownerId}-001 as ${labels.en}; the record satisfies the formal definition and remains traceable through its canonical ID to structure, relations, and evidence.`,
        `合成監査シナリオ ${ownerId}-scenario-001 で、システムは ${ownerId}-001 を${labels.ja}として記録します。この記録は正式定義を満たし、canonical ID から構造・関係・出典を追跡できます。`,
      ),
    field_values: {},
    related_node_ids: relatedNodeIds,
    related_relation_ids: relatedRelationIds,
    expected_result: localized(
      `该对象按定义被识别为${labels.zh}。`,
      `The object is classified as ${labels.en} under the reviewed definition.`,
      `この対象はレビュー済み定義により${labels.ja}として分類されます。`,
    ),
    why_valid_or_invalid: localized(
      `该例满足${labels.zh}的定义边界和归属条件。`,
      `The example satisfies the definition boundary and ownership conditions of ${labels.en}.`,
      `この例は${labels.ja}の定義境界と所属条件を満たします。`,
    ),
    synthetic: true,
    verified_version: VERSION_IRI,
    source_claims: [],
  },
  {
    id: exampleId(ownerId, "boundary-001"),
    kind: "boundary",
    labels: localized(
      `${labels.zh}边界例`,
      `Boundary case for ${labels.en}`,
      `${labels.ja}の境界例`,
    ),
    scenario_id: null,
    descriptions:
      boundaryDescriptions ??
      (parentLabels
        ? localized(
          `某对象只满足上位概念${parentLabels.zh}，但缺少${labels.zh}的区分特征。`,
          `An object satisfies the broader ${parentLabels.en} concept but lacks the differentia of ${labels.en}.`,
          `対象は上位概念${parentLabels.ja}を満たしますが、${labels.ja}の種差を欠きます。`,
        )
        : localized(
          `某对象与${labels.zh}有关，但没有满足其完整定义边界。`,
          `An object is related to ${labels.en} but does not satisfy its complete definition boundary.`,
          `対象は${labels.ja}に関連しますが、完全な定義境界を満たしません。`,
        )),
    field_values: {},
    related_node_ids: relatedNodeIds,
    related_relation_ids: relatedRelationIds,
    expected_result: localized(
      `验证器不得把该对象归类为${labels.zh}。`,
      `Validation must not classify the object as ${labels.en}.`,
      `検証器はこの対象を${labels.ja}として分類してはなりません。`,
    ),
    why_valid_or_invalid: localized(
      `相关性或共享上位概念不足以证明严格的概念成员资格。`,
      "Relatedness or a shared broader concept is insufficient for strict concept membership.",
      "関連性または共通の上位概念だけでは、厳密な概念所属を証明できません。",
    ),
    synthetic: true,
    verified_version: VERSION_IRI,
    source_claims: [],
  },
].map((example) => ({
  ...example,
  descriptions: localized(
    `${example.descriptions.zh} 审查定义：${definitions.zh}`,
    `${example.descriptions.en} Reviewed definition: ${definitions.en}`,
    `${example.descriptions.ja} 審査済み定義：${definitions.ja}`,
  ),
}));

const shortDefinition = (definitions) => ({
  zh: definitions.zh.split(/[。！？]/u)[0].trim() + "。",
  en: definitions.en.split(/(?<=[.!?])\s/u)[0].trim(),
  ja: definitions.ja.split(/[。！？]/u)[0].trim() + "。",
});

export const acceptedConcept = ({
  base,
  labels,
  semanticKind,
  primaryParentRelationId,
  parentLabels,
  rationale,
  sourceIds,
  sourceRegistryById,
  reviewer,
  applicability = ["core"],
}) => {
  const sourceClaims =
    base.source_claims ??
    claimsFor({
      sourceIds,
      ownerId: base.id,
      assertion: `Provides evidence for the reviewed distinction of ${base.id}: ${rationale.en}`,
      sourceRegistryById,
    });
  const examples = (
    base.examples ??
    positiveAndBoundaryExamples({
      ownerId: base.id,
      labels,
      definitions: base.definitions,
      parentLabels,
    })
  ).map((example) => ({
    ...example,
    source_claims: example.source_claims?.length ? example.source_claims : sourceClaims,
  }));
  return ({
  id: base.id,
  module_id: base.module_id,
  labels,
  short_definitions: base.short_definitions ?? shortDefinition(base.definitions),
  definitions: base.definitions,
  why_needed:
    base.why_needed ??
    localized(
      `需要${labels.zh}，以便在其所属模块中稳定区分、关联并验证这类语义。`,
      `${labels.en} is needed so this meaning can be distinguished, related, and validated consistently within its owning Module.`,
      `${labels.ja}は、所属モジュール内でこの意味を一貫して区別、関連付け、検証するために必要です。`,
    ),
  includes:
    base.includes ??
    [
      localized(
        `满足${labels.zh}正式定义和归属边界的对象。`,
        `Objects that satisfy the formal definition and ownership boundary of ${labels.en}.`,
        `${labels.ja}の正式定義と所属境界を満たす対象。`,
      ),
    ],
  excludes:
    base.excludes ??
    [
      parentLabels
        ? localized(
            `仅满足上位概念${parentLabels.zh}、但缺少本概念区分特征的对象。`,
            `Objects that satisfy only the broader ${parentLabels.en} concept and lack this concept's differentia.`,
            `上位概念${parentLabels.ja}だけを満たし、この概念の種差を欠く対象。`,
          )
        : localized(
            `仅名称相关、但不满足${labels.zh}定义边界的对象。`,
            `Merely related objects that do not satisfy the definition boundary of ${labels.en}.`,
            `名称上関連するだけで、${labels.ja}の定義境界を満たさない対象。`,
          ),
    ],
  semantic_kind: semanticKind,
  primary_parent_relation_id: primaryParentRelationId,
  structure: base.structure ?? {
    identity_keys: [],
    fields: [],
    constraints: [],
    required_relation_constraints: [],
  },
  examples,
  source_claims: sourceClaims,
  external_mappings: base.external_mappings ?? [],
  applicability,
  status: "accepted",
  review: acceptedReview(reviewer, rationale),
  introduced_in: VERSION_IRI,
  deprecated_in: null,
  replaced_by_ids: [],
  deprecation_reason: null,
  change_note: rationale,
  });
};

const predicateLabels = new Map([
  ["is_a", localized("是一种", "is a", "の一種である")],
  ["contains", localized("包含", "contains", "含む")],
  ["uses", localized("使用", "uses", "使用する")],
  ["produces", localized("产生", "produces", "生成する")],
  ["consumes", localized("消费", "consumes", "消費する")],
  ["records", localized("记录", "records", "記録する")],
  ["evaluates", localized("评估", "evaluates", "評価する")],
  ["triggers", localized("触发", "triggers", "起動する")],
  ["updates", localized("更新", "updates", "更新する")],
  ["has_part", localized("具有组成部分", "has part", "部分を持つ")],
  ["part_of", localized("组成", "is part of", "一部である")],
  ["precedes", localized("先于", "precedes", "先行する")],
  ["follows", localized("后续于", "follows", "後続する")],
  ["references", localized("引用", "references", "参照する")],
  ["maps_to", localized("映射到", "maps to", "写像する")],
]);

const relationLabels = (predicate) =>
  predicateLabels.get(predicate) ??
  localized(
    predicate.replaceAll("_", " "),
    predicate.replaceAll("_", " "),
    predicate.replaceAll("_", " "),
  );

export const acceptedRelation = ({
  id,
  predicate,
  sourceId,
  targetId,
  relationKind,
  definitions,
  sourceIds,
  sourceRegistryById,
  reviewer,
  rationale,
  boundaryContext = null,
}) => {
  const labels = relationLabels(predicate);
  const sourceClaims = claimsFor({
    sourceIds,
    ownerId: id,
    assertion: `Supports the reviewed ${predicate} relation from ${sourceId} to ${targetId}.`,
    sourceRegistryById,
  });
  const examples = positiveAndBoundaryExamples({
    ownerId: id,
    labels,
    definitions,
    relatedNodeIds: [...new Set([sourceId, targetId])],
    relatedRelationIds: [id],
    positiveDescriptions: localized(
      `在合成运行 ${id}-scenario-001 中，${sourceId} 通过“${labels.zh}”明确指向 ${targetId}；记录保留 source→target 方向、谓词和限定条件。`,
      `In synthetic run ${id}-scenario-001, ${sourceId} explicitly ${labels.en} ${targetId}; the assertion preserves its source-to-target direction, predicate, and qualifiers.`,
      `合成実行 ${id}-scenario-001 で、${sourceId} は「${labels.ja}」により ${targetId} を明示的に指します。アサーションは source→target の方向、述語、限定条件を保持します。`,
    ),
    boundaryDescriptions: localized(
      `${sourceId} 与 ${targetId} 同时出现但没有可验证的“${labels.zh}”断言；仅共现不能建立该关系。`,
      `${sourceId} and ${targetId} co-occur without a verifiable ${labels.en} assertion; co-occurrence alone does not establish this relation.`,
      `${sourceId} と ${targetId} は同時に現れますが、検証可能な「${labels.ja}」アサーションがなく、共起だけではこの関係を成立させません。`,
    ),
  }).map((example) => ({ ...example, source_claims: sourceClaims }));
  const conditionSpec = relationConditionSpecs.get(id);
  const conditions = conditionSpec
    ? [
        {
          id: `${id}-condition-001`,
          severity: "error",
          expression_language: "plain",
          expression: conditionSpec[0],
          explanations: localized(conditionSpec[1], conditionSpec[2], conditionSpec[3]),
          source_claims: sourceClaims,
        },
      ]
    : [];
  const inverse = inversePredicate(predicate);
  return {
    id,
    predicate,
    source_id: sourceId,
    target_id: targetId,
    direction: "source-to-target",
    relation_kind: relationKind,
    labels,
    definitions,
    cardinality: null,
    cardinality_not_applicable_reason:
      predicate === "is_a"
        ? localized(
            "分类继承不使用实例关系基数。",
            "Taxonomic inheritance does not use instance-relation cardinality.",
            "分類継承にはインスタンス関係の基数を用いません。",
          )
        : localized(
            "该本体关系记录可查询的语义事实，但不对所有运行实例施加统一基数。",
            "This ontology relation records a queryable semantic fact without imposing one universal cardinality on all runtime instances.",
            "この本体関係は検索可能な意味事実を記録しますが、すべての実行インスタンスに一律の基数を課しません。",
          ),
    inverse_reading: {
      predicate: inverse,
      labels: localized(
        `反向：${labels.zh}`,
        inverse.replaceAll("_", " "),
        `逆方向：${labels.ja}`,
      ),
    },
    conditions,
    temporal_scope: relationKind === "temporal" || relationKind === "causal" ? "valid-time" : "timeless",
    boundary_context: boundaryContext,
    constraints: [],
    examples,
    source_claims: sourceClaims,
    distinct_fact_rationale: null,
    status: "accepted",
    review: acceptedReview(reviewer, rationale),
    introduced_in: VERSION_IRI,
    deprecated_in: null,
    replaced_by_ids: [],
    deprecation_reason: null,
    change_note: rationale,
  };
};

export const acceptedField = ({
  id,
  labels,
  datatype,
  definitions,
  exampleValue,
  sourceIds,
  sourceRegistryById,
  allowedValues = [],
  required = false,
  cardinality = { min: required ? 1 : 0, max: 1 },
}) => ({
  id,
  labels,
  datatype,
  required,
  cardinality,
  definitions,
  allowed_values: allowedValues,
  pattern: null,
  example_value: exampleValue,
  source_claims: claimsFor({
    sourceIds,
    ownerId: id,
    assertion: `Supports the reviewed structure field ${id}.`,
    sourceRegistryById,
  }),
});
