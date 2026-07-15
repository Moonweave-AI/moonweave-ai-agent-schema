const MODULE_ID = "orchestration-delegation-handoff";

export const DELEGATION_NODE_INFORMATION_CONCEPT_IDS = Object.freeze([
  "DelegatedAuthority",
  "DelegationBudget",
  "ContextIsolation",
  "DelegationContext",
  "DelegationEvent",
  "DelegationResult",
  "DelegationOwnership",
  "Handoff",
  "ResponsibilityTransfer",
  "WorkerPool",
  "WorkerAvailability",
  "WorkerCapabilityMatch",
  "WorkerSelection",
]);

const field = (id, zh, en, ja, datatype, exampleValue, options = {}) => ({
  id,
  terms: [zh, en, ja],
  datatype,
  exampleValue,
  required: options.required ?? true,
  max: Object.hasOwn(options, "max") ? options.max : 1,
});

const id = (name, zh, en, ja, exampleValue) =>
  field(name, zh, en, ja, "string", exampleValue, { identity: true });
const ref = (name, zh, en, ja, exampleValue, options) =>
  field(name, zh, en, ja, "reference", exampleValue, options);
const optional = (options = {}) => ({ ...options, required: false });
const many = (options = {}) => ({ ...options, max: null });

const CONTRACTS = Object.freeze({
  DelegatedAuthority: {
    labels: ["受委派权限", "delegated authority", "委任権限"],
    identity: ["authority_id", "version"],
    fields: [
      id("authority_id", "权限 ID", "authority ID", "権限 ID", "authority-delegation-001"),
      id("version", "版本", "version", "版", "1"),
      ref("delegatee_id", "受托方 ID", "delegatee ID", "受任者 ID", "Actor:worker-007"),
      ref("permission_refs", "权限引用", "permission references", "権限参照", ["Permission:read-repo"], many()),
      ref("resource_scope_refs", "资源范围引用", "resource-scope references", "資源範囲参照", ["Repository:moonweave"], many(optional())),
      ref("approved_by", "批准者", "approved by", "承認者", "Actor:orchestrator-001"),
      field("valid_from", "生效时间", "valid from", "有効開始", "date-time", "2026-07-15T01:00:00Z"),
      field("valid_until", "失效时间", "valid until", "有効終了", "date-time", "2026-07-15T03:00:00Z", optional()),
    ],
    constraints: [["delegated-authority-bounded", "granted permissions and resource scopes do not exceed the delegator authority or delegated task scope", "权限不得超出委托方权限或任务范围。", "Delegated authority must remain within delegator authority and task scope.", "委任権限は委任者権限とタスク範囲を超えてはなりません。"]],
    relations: [["delegated-authority-granted-by-contract", "incoming", "grants", "DelegationContract", 1, 1]],
  },
  DelegationBudget: {
    labels: ["委派预算", "delegation budget", "委任予算"],
    identity: ["budget_id", "version"],
    fields: [
      id("budget_id", "预算 ID", "budget ID", "予算 ID", "delegation-budget-001"),
      id("version", "版本", "version", "版", "1"),
      field("token_limit", "令牌上限", "token limit", "トークン上限", "integer", 8192, optional()),
      field("time_limit_ms", "时间上限（毫秒）", "time limit in milliseconds", "時間上限（ミリ秒）", "integer", 120000, optional()),
      field("cost_limit", "成本上限", "cost limit", "費用上限", "number", 5, optional()),
      field("retry_limit", "重试上限", "retry limit", "再試行上限", "integer", 2, optional()),
      field("tool_call_limit", "工具调用上限", "tool-call limit", "ツール呼出上限", "integer", 20, optional()),
      field("context_token_limit", "上下文令牌上限", "context-token limit", "コンテキスト上限", "integer", 16000, optional()),
      ref("approved_by", "批准者", "approved by", "承認者", "Actor:orchestrator-001"),
      field("valid_from", "生效时间", "valid from", "有効開始", "date-time", "2026-07-15T01:00:00Z"),
      field("valid_until", "失效时间", "valid until", "有効終了", "date-time", "2026-07-15T03:00:00Z", optional()),
    ],
    constraints: [
      ["delegation-budget-has-limit", "at least one delegation limit is non-null and non-negative", "至少一个委派限额必须非空且非负。", "At least one delegation limit must be non-null and non-negative.", "少なくとも一つの委任上限が非 null かつ非負でなければなりません。"],
    ],
    relations: [["delegation-budget-used-by-contract", "incoming", "constrained_by_budget", "DelegationContract", 1, 1]],
  },
  ContextIsolation: {
    labels: ["上下文隔离", "context isolation", "コンテキスト分離"],
    identity: ["isolation_spec_id", "version"],
    fields: [
      id("isolation_spec_id", "隔离规范 ID", "isolation-spec ID", "分離仕様 ID", "context-isolation-001"),
      id("version", "版本", "version", "版", "1"),
      ref("allowed_surface_refs", "允许接口引用", "allowed-surface references", "許可面参照", ["MemorySurface:task"], many()),
      ref("denied_surface_refs", "拒绝接口引用", "denied-surface references", "拒否面参照", ["MemorySurface:private"], many(optional())),
      field("default_decision", "默认决定", "default decision", "既定判断", "string", "deny"),
      field("valid_from", "生效时间", "valid from", "有効開始", "date-time", "2026-07-15T01:00:00Z"),
    ],
    relations: [
      ["context-isolation-specified-by-contract", "incoming", "specifies", "DelegationContract", 1, 1],
      ["context-isolation-bounds-context", "outgoing", "bounds", "DelegationContext", 1, 1],
    ],
  },
  DelegationContext: {
    labels: ["委派上下文", "delegation context", "委任コンテキスト"],
    identity: ["context_id", "version"],
    fields: [
      id("context_id", "上下文 ID", "context ID", "コンテキスト ID", "delegation-context-001"),
      id("version", "版本", "version", "版", "1"),
      ref("delegation_id", "委派 ID", "delegation ID", "委任 ID", "DelegationContract:delegation-001"),
      field("content_digest", "内容摘要", "content digest", "内容ダイジェスト", "string", "sha256:delegation-context-001"),
      ref("allowed_reference_ids", "允许引用", "allowed references", "許可参照", ["SourceReference:spec"], many()),
      ref("excluded_reference_ids", "排除引用", "excluded references", "除外参照", ["SourceReference:secret"], many(optional())),
      field("created_at", "创建时间", "created at", "作成時刻", "date-time", "2026-07-15T01:00:00Z"),
    ],
    constraints: [["delegation-context-immutable-version", "context_id + version identifies immutable content_digest and reference membership", "同一上下文版本的摘要和成员不可原地改变。", "A delegation-context version is immutable.", "同一委任コンテキスト版は不変です。"]],
    relations: [["delegation-context-bounded-by-isolation", "incoming", "bounds", "ContextIsolation", 1, 1]],
  },
  DelegationEvent: {
    labels: ["委派事件", "delegation event", "委任イベント"],
    identity: ["delegation_event_id"],
    fields: [
      id("delegation_event_id", "事件 ID", "event ID", "イベント ID", "delegation-event-004"),
      ref("delegation_process_id", "委派过程 ID", "delegation-process ID", "委任プロセス ID", "DelegationProcess:001"),
      field("event_kind", "事件种类", "event kind", "イベント種別", "string", "accepted"),
      field("occurred_at", "发生时间", "occurred at", "発生時刻", "date-time", "2026-07-15T01:15:00Z"),
      field("sequence_index", "序号", "sequence index", "順序番号", "integer", 2),
      ref("actor_id", "行动者 ID", "actor ID", "実行者 ID", "Actor:worker-007"),
      ref("supersedes_event_id", "取代事件 ID", "superseded event ID", "置換イベント ID", "DelegationEvent:003", optional()),
    ],
    constraints: [["delegation-event-ordered-transition", "sequence_index is non-negative and event_kind follows an allowed delegation transition", "序号非负且事件种类必须形成合法委派转换。", "Delegation events use a non-negative sequence and an allowed transition.", "委任イベントは非負の順序と許可済み遷移に従います。"]],
    relations: [
      ["delegation-event-changes-process", "outgoing", "changes", "DelegationProcess", 1, 1],
      ["delegation-event-records-phase", "outgoing", "records_phase", "DelegationPhase", 1, 1],
    ],
  },
  DelegationResult: {
    labels: ["委派结果", "delegation result", "委任結果"],
    identity: ["delegation_result_id"],
    fields: [
      id("delegation_result_id", "结果 ID", "result ID", "結果 ID", "delegation-result-001"),
      ref("delegation_process_id", "委派过程 ID", "delegation-process ID", "委任プロセス ID", "DelegationProcess:001"),
      field("status", "结果状态", "result status", "結果状態", "string", "succeeded"),
      field("returned_at", "返回时间", "returned at", "返却時刻", "date-time", "2026-07-15T02:00:00Z"),
      ref("artifact_refs", "产物引用", "artifact references", "成果物参照", ["Artifact:report"], many(optional())),
      ref("warning_refs", "警告引用", "warning references", "警告参照", ["WarningEvent:001"], many(optional())),
      ref("provenance_ref", "来源引用", "provenance reference", "来歴参照", "TraceRecord:delegation-001"),
    ],
    relations: [["delegation-result-produced-by-process", "incoming", "produces", "DelegationProcess", 1, 1]],
  },
  DelegationOwnership: {
    labels: ["委派归属", "delegation ownership", "委任帰属"],
    identity: ["ownership_record_id"],
    fields: [
      id("ownership_record_id", "归属记录 ID", "ownership-record ID", "帰属記録 ID", "delegation-ownership-001"),
      ref("delegation_id", "委派 ID", "delegation ID", "委任 ID", "DelegationContract:delegation-001"),
      ref("delegator_id", "委托方 ID", "delegator ID", "委任者 ID", "Actor:orchestrator-001"),
      ref("delegatee_id", "受托方 ID", "delegatee ID", "受任者 ID", "Actor:worker-007"),
      ref("control_owner_id", "控制权所有者", "control owner", "制御所有者", "Actor:worker-007"),
      ref("answer_owner_id", "答案所有者", "answer owner", "回答所有者", "Actor:orchestrator-001"),
      ref("result_accountable_actor_id", "结果责任方", "result-accountable actor", "結果責任者", "Actor:orchestrator-001"),
      field("responsibility_scope", "责任范围", "responsibility scope", "責任範囲", "string", "task execution"),
      field("effective_at", "生效时间", "effective at", "発効時刻", "date-time", "2026-07-15T01:20:00Z"),
      field("return_condition", "交还条件", "return condition", "返還条件", "string", "result accepted", optional()),
    ],
    relations: [["delegation-ownership-produced-by-assignment", "incoming", "produces", "WorkerAssignment", 1, 1]],
  },
  Handoff: {
    labels: ["控制移交", "handoff", "引き継ぎ"],
    identity: ["handoff_event_id"],
    fields: [
      id("handoff_event_id", "移交事件 ID", "handoff-event ID", "引継イベント ID", "handoff-001"),
      ref("handoff_process_id", "移交过程 ID", "handoff-process ID", "引継プロセス ID", "HandoffProcess:001"),
      field("occurred_at", "发生时间", "occurred at", "発生時刻", "date-time", "2026-07-15T01:30:00Z"),
      ref("source_actor_id", "移交方", "source actor", "引継元", "Actor:orchestrator-001"),
      ref("target_actor_id", "接收方", "target actor", "引継先", "Actor:worker-007"),
      field("responsibility_scope", "责任范围", "responsibility scope", "責任範囲", "string", "task control"),
      ref("context_id", "上下文 ID", "context ID", "コンテキスト ID", "DelegationContext:001", optional()),
    ],
    constraints: [["handoff-actors-distinct", "source_actor_id differs from target_actor_id", "移交方与接收方必须不同。", "The source and target actors of a handoff differ.", "引継元と引継先は異ならなければなりません。"]],
    relations: [
      ["handoff-causes-transfer", "outgoing", "causes", "ResponsibilityTransfer", 1, 1],
      ["handoff-transfers-to-actor", "outgoing", "transfers_control_to", "AgentActor", 1, 1],
    ],
  },
  ResponsibilityTransfer: {
    labels: ["责任转移", "responsibility transfer", "責任移転"],
    identity: ["responsibility_transfer_id"],
    fields: [
      id("responsibility_transfer_id", "转移记录 ID", "transfer-record ID", "移転記録 ID", "responsibility-transfer-001"),
      ref("handoff_event_id", "移交事件 ID", "handoff-event ID", "引継イベント ID", "Handoff:001"),
      field("responsibility_scope", "责任范围", "responsibility scope", "責任範囲", "string", "task control"),
      ref("previous_owner_id", "原所有者", "previous owner", "旧所有者", "Actor:orchestrator-001"),
      ref("new_owner_id", "新所有者", "new owner", "新所有者", "Actor:worker-007"),
      field("effective_at", "生效时间", "effective at", "発効時刻", "date-time", "2026-07-15T01:30:00Z"),
      field("retained_scope", "保留范围", "retained scope", "保持範囲", "string", ["final answer"], many(optional())),
      field("excluded_scope", "排除范围", "excluded scope", "除外範囲", "string", ["billing authority"], many(optional())),
    ],
    constraints: [["responsibility-transfer-owner-change", "previous_owner_id differs from new_owner_id", "原所有者与新所有者必须不同。", "A responsibility transfer changes the owner.", "責任移転では所有者が変わります。"]],
    relations: [["responsibility-transfer-caused-by-handoff", "incoming", "causes", "Handoff", 1, 1]],
  },
  WorkerPool: {
    labels: ["工作者候选池", "worker pool", "ワーカープール"],
    identity: ["worker_pool_id", "version"],
    fields: [
      id("worker_pool_id", "候选池 ID", "worker-pool ID", "候補プール ID", "worker-pool-001"),
      id("version", "版本", "version", "版", "1"),
      ref("delegation_id", "委派 ID", "delegation ID", "委任 ID", "DelegationContract:delegation-001"),
      field("selection_scope", "选择范围", "selection scope", "選択範囲", "string", "repository audit"),
      field("created_at", "创建时间", "created at", "作成時刻", "date-time", "2026-07-15T01:05:00Z"),
    ],
    relations: [["worker-pool-contains-role", "outgoing", "contains", "WorkerRole", 1, null]],
  },
  WorkerAvailability: {
    labels: ["工作者可用性", "worker availability", "ワーカー可用性"],
    identity: ["availability_assessment_id", "worker_role_id"],
    fields: [
      ref("availability_assessment_id", "可用性评估 ID", "availability-assessment ID", "可用性評価 ID", "WorkerAvailabilityAssessment:001"),
      ref("worker_role_id", "工作者角色 ID", "worker-role ID", "ワーカーロール ID", "WorkerRole:007"),
      field("availability_status", "可用状态", "availability status", "可用状態", "string", "available"),
      field("load_ratio", "负载比率", "load ratio", "負荷率", "number", 0.35),
      field("assessed_at", "评估时间", "assessed at", "評価時刻", "date-time", "2026-07-15T01:10:00Z"),
      field("valid_until", "有效期至", "valid until", "有効期限", "date-time", "2026-07-15T01:20:00Z", optional()),
      field("reason", "判断理由", "reason", "判断理由", "string", "capacity and concurrency are available"),
    ],
    constraints: [["worker-availability-ratio", "load_ratio is between 0 and 1", "负载比率必须在 0 到 1 之间。", "Worker load ratio is normalized to [0,1].", "ワーカー負荷率は 0 から 1 の範囲です。"]],
    relations: [["worker-availability-produced-by-assessment", "incoming", "produces", "WorkerAvailabilityAssessment", 1, 1]],
  },
  WorkerCapabilityMatch: {
    labels: ["工作者能力匹配证据", "worker capability match", "ワーカー能力照合"],
    identity: ["matching_activity_id", "worker_role_id"],
    fields: [
      ref("matching_activity_id", "匹配活动 ID", "matching-activity ID", "照合活動 ID", "WorkerCapabilityMatching:001"),
      ref("worker_role_id", "工作者角色 ID", "worker-role ID", "ワーカーロール ID", "WorkerRole:007"),
      ref("requirement_ref", "需求引用", "requirement reference", "要件参照", "WorkItem:audit"),
      field("score", "匹配分数", "match score", "照合スコア", "number", 0.92),
      field("matched", "是否匹配", "matched", "照合成立", "boolean", true),
      field("reason", "匹配理由", "match reason", "照合理由", "string", "capability and authority satisfy the work requirement"),
      ref("evidence_refs", "证据引用", "evidence references", "証拠参照", ["CapabilityDescriptor:code-review"], many()),
      field("assessed_at", "评估时间", "assessed at", "評価時刻", "date-time", "2026-07-15T01:12:00Z"),
    ],
    constraints: [["worker-capability-match-score", "score is between 0 and 1", "匹配分数必须在 0 到 1 之间。", "Capability-match score is normalized to [0,1].", "能力照合スコアは 0 から 1 の範囲です。"]],
    relations: [
      ["worker-match-produced-by-matching", "incoming", "produces", "WorkerCapabilityMatching", 1, 1],
      ["worker-match-justifies-selection", "outgoing", "justifies", "WorkerSelection", 1, null],
    ],
  },
  WorkerSelection: {
    labels: ["工作者选择", "worker selection", "ワーカー選択"],
    identity: ["selection_id"],
    fields: [
      id("selection_id", "选择 ID", "selection ID", "選択 ID", "worker-selection-001"),
      ref("decision_activity_id", "决定活动 ID", "decision-activity ID", "判断活動 ID", "WorkerSelectionDecisionActivity:001"),
      ref("worker_pool_id", "候选池 ID", "worker-pool ID", "候補プール ID", "WorkerPool:001"),
      ref("selected_worker_role_id", "被选工作者角色 ID", "selected worker-role ID", "選択ワーカーロール ID", "WorkerRole:007"),
      field("decided_at", "决定时间", "decided at", "判断時刻", "date-time", "2026-07-15T01:15:00Z"),
      field("reason", "选择理由", "selection reason", "選択理由", "string", "best available capability match within delegation bounds"),
      field("rejected_candidate_reasons", "落选理由", "rejected-candidate reasons", "不選択理由", "string", ["WorkerRole:008 unavailable"], many(optional())),
    ],
    constraints: [["worker-selection-evidenced-membership", "selected_worker_role_id belongs to worker_pool_id and has accepted availability and capability evidence", "被选角色必须属于候选池并有可用性与能力证据。", "A selected worker belongs to the pool and has availability and capability evidence.", "選択ワーカーは候補プールに属し可用性・能力証拠を持ちます。"]],
    relations: [
      ["worker-selection-produced-by-decision", "incoming", "produces", "WorkerSelectionDecisionActivity", 1, 1],
      ["worker-selection-justified-by-match", "incoming", "justifies", "WorkerCapabilityMatch", 1, null],
    ],
  },
});

const mergeById = (existing, reviewed) => {
  const values = new Map((existing ?? []).map((value) => [value.id, structuredClone(value)]));
  for (const value of reviewed) values.set(value.id, structuredClone(value));
  return [...values.values()];
};

const scopedClaims = (claims, support) => claims.map((claim) => ({
  ...structuredClone(claim),
  supports: `${claim.supports} ${support}`,
}));

export const createDelegationNodeInformationPhases = (context) => {
  const {
    localized,
    moduleDocuments,
    allConcepts,
    allRelations,
    claimsFor,
    updateReviewedConcept,
  } = context;

  const projectRequiredRelationCardinality = (conceptId, constraint) => {
    if (typeof allRelations !== "function") return;
    const relation = [...allRelations().values()].find((candidate) =>
      candidate.status === "accepted" &&
      candidate.predicate === constraint.predicate &&
      (constraint.direction === "outgoing"
        ? candidate.source_id === conceptId &&
          candidate.target_id === constraint.target_concept_id
        : candidate.target_id === conceptId &&
          candidate.source_id === constraint.target_concept_id),
    );
    if (!relation) {
      throw new Error(
        `Required relation constraint ${conceptId}.${constraint.id} has no accepted canonical fact`,
      );
    }
    const side = constraint.direction === "outgoing" ? "target" : "source";
    const cardinality = relation.cardinality ?? {
      source: { min: 0, max: null },
      target: { min: 0, max: null },
    };
    const replacement = {
      ...relation,
      cardinality: {
        source: { ...cardinality.source },
        target: { ...cardinality.target },
        [side]: { ...constraint.cardinality },
      },
      cardinality_not_applicable_reason: null,
    };
    for (const entry of moduleDocuments.values()) {
      entry.document.relations = (entry.document.relations ?? []).map((candidate) =>
        candidate.id === relation.id ? replacement : candidate,
      );
    }
  };

  const applyDelegationNodeInformation = () => {
    const module = moduleDocuments.get(MODULE_ID)?.document?.module;
    if (!module) throw new Error(`Missing module source ${MODULE_ID}`);

    for (const conceptId of DELEGATION_NODE_INFORMATION_CONCEPT_IDS) {
      const concept = allConcepts().get(conceptId);
      if (!concept) throw new Error(`Missing delegation information Concept ${conceptId}`);
      const contract = CONTRACTS[conceptId];
      const claims = claimsFor(concept, module);
      if (!Array.isArray(claims) || claims.length === 0) {
        throw new Error(`Delegation information Concept ${conceptId} has no reviewed source claims`);
      }
      const [conceptZh, conceptEn, conceptJa] = contract.labels;
      const reviewedFields = contract.fields.map((candidate) => {
        const [zh, en, ja] = candidate.terms;
        return {
          id: candidate.id,
          labels: localized(zh, en, ja),
          datatype: candidate.datatype,
          required: candidate.required,
          cardinality: { min: candidate.required ? 1 : 0, max: candidate.max },
          definitions: localized(
            `记录${conceptZh}的${zh}，用于识别、验证或重放该节点实例。`,
            `Records the ${en} needed to identify, validate, or replay a ${conceptEn} instance.`,
            `${conceptJa}インスタンスの識別・検証・再生に必要な${ja}を記録します。`,
          ),
          allowed_values: [],
          pattern: contract.identity.includes(candidate.id)
            ? "^[A-Za-z0-9][A-Za-z0-9._:-]*$"
            : null,
          example_value: structuredClone(candidate.exampleValue),
          source_claims: scopedClaims(
            claims,
            `This scoped claim supports the reviewed ${conceptId}.${candidate.id} field contract.`,
          ),
        };
      });
      const reviewedConstraints = (contract.constraints ?? []).map(
        ([constraintId, expression, zh, en, ja]) => ({
          id: constraintId,
          severity: "error",
          expression_language: "plain",
          expression,
          explanations: localized(zh, en, ja),
          source_claims: scopedClaims(
            claims,
            `This scoped claim supports the reviewed ${conceptId}.${constraintId} constraint.`,
          ),
        }),
      );
      const reviewedRelations = (contract.relations ?? []).map(
        ([relationId, direction, predicate, targetId, min, max]) => ({
          id: relationId,
          direction,
          predicate,
          target_concept_id: targetId,
          cardinality: { min, max },
          explanations: localized(
            `${conceptZh}实例必须通过 ${predicate} 与 ${targetId} 保持该端点合同。`,
            `A ${conceptEn} instance preserves its ${predicate} endpoint contract with ${targetId}.`,
            `${conceptJa}インスタンスは ${targetId} との ${predicate} 端点契約を保持します。`,
          ),
          source_claims: scopedClaims(
            claims,
            `This scoped claim supports the reviewed ${conceptId}.${relationId} relation constraint.`,
          ),
        }),
      );
      const current = concept.structure ?? {
        identity_keys: [], fields: [], constraints: [], required_relation_constraints: [],
      };
      updateReviewedConcept(conceptId, {
        structure: {
          identity_keys: [...new Set([...current.identity_keys, ...contract.identity])],
          fields: mergeById(current.fields, reviewedFields),
          constraints: mergeById(current.constraints, reviewedConstraints),
          required_relation_constraints: mergeById(
            current.required_relation_constraints,
            reviewedRelations,
          ),
        },
      });
      for (const constraint of reviewedRelations) {
        projectRequiredRelationCardinality(conceptId, constraint);
      }
    }
  };

  return Object.freeze({ applyDelegationNodeInformation });
};
\n
