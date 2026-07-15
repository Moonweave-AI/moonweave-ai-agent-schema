const localized = (zh, en, ja) => Object.freeze({ zh, en, ja });

const reviewedPair = (reverseRelationId, rationale) => Object.freeze({
  reverse_relation_id: reverseRelationId,
  rationale,
});

/**
 * A pair belongs here only when two accepted assertions connect the same class
 * endpoints in opposite directions but encode different facts. Exact inverses
 * must be represented once with inverse_reading and therefore do not belong here.
 */
export const ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS = Object.freeze({
  "Message-references_context-ContextPackage": reviewedPair(
    "ContextPackage-contains_message-Message",
    localized(
      "ContextPackage contains Message 表达包内成员关系；Message references ContextPackage 表达消息引用用于解释或继续生成的版本化上下文，引用目标不必是包含该消息的同一包。",
      "ContextPackage contains Message states package membership, whereas Message references ContextPackage cites versioned context used to interpret or continue the message; the referenced package need not be the package containing that message.",
      "ContextPackage contains Message はパッケージ内所属を表し、Message references ContextPackage はメッセージの解釈・継続生成に使う版管理済み文脈を参照します。参照先は当該メッセージを含む同一パッケージとは限りません。",
    ),
  ),
  "InstructionProcessing-has_phase-InstructionConflictDetectionActivity": reviewedPair(
    "InstructionConflictDetectionActivity-is_a-InstructionProcessing",
    localized(
      "is_a 断言冲突检测活动的活动类型；has_phase 断言一次复合 InstructionProcessing 运行包含该阶段，类型归属与运行组成不是互逆事实。",
      "is_a classifies conflict detection as an instruction-processing activity type, while has_phase states that a composite InstructionProcessing run includes that stage; type membership and run composition are not inverse facts.",
      "is_a は競合検出を指示処理活動型として分類し、has_phase は複合 InstructionProcessing 実行がその段階を含むことを表します。型所属と実行構成は逆関係ではありません。",
    ),
  ),
  "InstructionProcessing-has_phase-InstructionParsingActivity": reviewedPair(
    "InstructionParsingActivity-is_a-InstructionProcessing",
    localized(
      "is_a 断言解析活动的活动类型；has_phase 断言一次复合 InstructionProcessing 运行包含解析阶段，不能用分类边代替阶段组成。",
      "is_a classifies parsing as an instruction-processing activity type, while has_phase states that a composite InstructionProcessing run includes a parsing stage; the taxonomy edge cannot replace phase composition.",
      "is_a は解析を指示処理活動型として分類し、has_phase は複合 InstructionProcessing 実行が解析段階を含むことを表します。分類辺は段階構成を代替できません。",
    ),
  ),
  "InstructionProcessing-has_phase-InstructionResolutionActivity": reviewedPair(
    "InstructionResolutionActivity-is_a-InstructionProcessing",
    localized(
      "is_a 断言解决活动的活动类型；has_phase 断言一次复合 InstructionProcessing 运行包含解决阶段，二者分别回答“是什么”和“由什么阶段组成”。",
      "is_a classifies resolution as an instruction-processing activity type, while has_phase states that a composite InstructionProcessing run includes a resolution stage; they answer what it is and what stages compose the run, respectively.",
      "is_a は解決を指示処理活動型として分類し、has_phase は複合 InstructionProcessing 実行が解決段階を含むことを表し、それぞれ「何であるか」と「どの段階で構成されるか」に答えます。",
    ),
  ),
  "Execution-has_attempt-RunAttempt": reviewedPair(
    "RunAttempt-is_a-Execution",
    localized(
      "RunAttempt is_a Execution 表达单次尝试本身是一类执行活动；Execution has_attempt RunAttempt 表达跨重试聚合的一次执行包含哪些尝试，活动分类与聚合成员关系不可合并。",
      "RunAttempt is_a Execution classifies one attempt as an execution activity, whereas Execution has_attempt RunAttempt identifies the attempts contained by a retry-spanning execution aggregate; activity type and aggregate membership must remain distinct.",
      "RunAttempt is_a Execution は一回の試行を実行活動型として分類し、Execution has_attempt RunAttempt は再試行をまたぐ実行集約に含まれる試行を示します。活動型と集約所属は分離が必要です。",
    ),
  ),
  "MCPResponse-responds_to-MCPRequest": reviewedPair(
    "MCPRequest-expects-MCPResponse",
    localized(
      "expects 是请求发出时的前瞻响应契约，即使尚无响应也成立；responds_to 是实际响应产生后的关联事实，不能由期望自动推导。",
      "expects is a prospective response contract that holds when the request is issued even before a response exists; responds_to is the correlation fact of an actual response and cannot be inferred from expectation alone.",
      "expects は応答がまだ存在しなくても要求発行時に成立する前向き応答契約であり、responds_to は実際の応答生成後の相関事実です。期待だけから実応答を推論できません。",
    ),
  ),
  "AuthorizationRequest-precedes-PolicyEvaluation": reviewedPair(
    "PolicyEvaluation-consumes-AuthorizationRequest",
    localized(
      "precedes 约束请求与评估的时间顺序；consumes 约束评估读取哪一份请求作为信息输入，时间先后并不自动证明消费关系。",
      "precedes constrains temporal order between request and evaluation, while consumes identifies the request record read as evaluation input; temporal order alone does not establish consumption.",
      "precedes は要求と評価の時間順序を制約し、consumes は評価入力として読む要求記録を特定します。時間的先行だけでは消費関係を証明しません。",
    ),
  ),
});

const isLocalized = (value) => value !== null && typeof value === "object" &&
  ["zh", "en", "ja"].every((language) =>
    typeof value[language] === "string" && value[language].trim().length > 0,
  );

export const validateOntologyV3DirectionalDistinctFacts = (
  specifications = ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS,
  relations = null,
) => {
  const relationById = relations instanceof Map
    ? relations
    : Array.isArray(relations)
      ? new Map(relations.map((relation) => [relation.id, relation]))
      : null;
  for (const [relationId, specification] of Object.entries(specifications)) {
    if (!isLocalized(specification.rationale)) {
      throw new Error(`${relationId} is missing a trilingual distinct-fact rationale`);
    }
    if (!specification.reverse_relation_id || specification.reverse_relation_id === relationId) {
      throw new Error(`${relationId} must name a different reverse-direction relation`);
    }
    if (!relationById) continue;
    const relation = relationById.get(relationId);
    const reverse = relationById.get(specification.reverse_relation_id);
    if (!relation || relation.status !== "accepted" || !reverse || reverse.status !== "accepted") {
      throw new Error(`${relationId} distinct-fact pair must resolve to two accepted relations`);
    }
    if (relation.source_id !== reverse.target_id || relation.target_id !== reverse.source_id) {
      throw new Error(`${relationId} and ${reverse.id} are not a reverse-direction endpoint pair`);
    }
  }
  return Object.freeze({ reviewed_pair_count: Object.keys(specifications).length });
};

export const ontologyV3DirectionalDistinctFacts = ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS;
export const ontologyV3DirectionalDistinctFactValidation =
  validateOntologyV3DirectionalDistinctFacts();
