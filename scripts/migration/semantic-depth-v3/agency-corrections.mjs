import { ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS } from "../../data/ontology-v3-reviewed-relation-replacements.mjs";

const staleRelationIds = new Set(
  ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS.flatMap(
    ({ old_relation_id: oldId, new_relation_id: newId }) => [oldId, newId],
  ),
);

const cleanDirectClaims = (concept) => (concept.source_claims ?? []).map(
  (claim) => ({
    ...claim,
    supports:
      `Source ${claim.source_id} at locator "${claim.locator}" retains evidence for ` +
      `Concept ${concept.id}'s operational notion: ${concept.short_definitions.en} ` +
      `The v3 ontology review separately determines owner, semantic kind, agency, and backbone placement.`,
  }),
);

const hasStaleAgencyRelation = (value) => {
  const serialized = JSON.stringify(value);
  return [...staleRelationIds].some((relationId) => serialized.includes(relationId));
};

export const createAgencyCorrectionPhases = (context) => {
  const {
    localized,
    allConcepts,
    allRelations,
    conceptExamples,
    deprecateRelation,
    updateReviewedConcept,
    upsertReviewedRelation,
  } = context;

  const correctionDetailsByOldId = new Map([
    ["InstructionResolution-resolves-InstructionConflict", Object.freeze({
      oldId: "InstructionResolution-resolves-InstructionConflict",
      moduleId: "info-prompts-instructions",
      predicate: "resolves",
      sourceId: "InstructionResolutionActivity",
      targetId: "InstructionConflict",
      relationKind: "causal",
      reason: localized(
        "InstructionResolution 是记录冲突处理结果的信息对象，不能执行 resolves；InstructionResolutionActivity 应用优先级、权限、作用域与覆盖规则并解决 InstructionConflict，随后产生该结果记录。",
        "InstructionResolution is an information record of the conflict outcome and cannot perform resolves; InstructionResolutionActivity applies priority, authority, scope, and override rules to resolve InstructionConflict and then produces the result record.",
        "InstructionResolution は競合処理結果の情報記録であり resolves を実行できません。InstructionResolutionActivity が優先度・権限・範囲・上書き規則を適用して InstructionConflict を解決し、その後に結果記録を生成します。",
      ),
      definitions: localized(
        "指令解决活动依据可追溯的优先级、权限、作用域和覆盖规则解决一项指令冲突；解决结果另由 InstructionResolutionActivity-produces-InstructionResolution 记录。",
        "An instruction-resolution activity resolves an instruction conflict under traceable priority, authority, scope, and override rules; its result is recorded separately by InstructionResolutionActivity-produces-InstructionResolution.",
        "指示解決活動は追跡可能な優先度・権限・範囲・上書き規則に基づいて指示競合を解決し、結果は InstructionResolutionActivity-produces-InstructionResolution により別途記録されます。",
      ),
    })],
    ["InstructionResolution-resolves-Instruction", Object.freeze({
      oldId: "InstructionResolution-resolves-Instruction",
      moduleId: "info-prompts-instructions",
      predicate: "records_effective",
      sourceId: "InstructionResolution",
      targetId: "Instruction",
      relationKind: "information",
      reason: localized(
        "InstructionResolution 是解决活动产生的信息记录，不能对 Instruction 执行 resolves；它只记录冲突处理后哪些指令有效以及适用理由。",
        "InstructionResolution is an information record produced by resolution activity and cannot perform resolves on Instruction; it only records which instructions are effective after conflict handling and why.",
        "InstructionResolution は解決活動が生成する情報記録であり、Instruction に resolves を実行できません。競合処理後に有効な指示とその理由だけを記録します。",
      ),
      definitions: localized(
        "指令解决结果以非动作关系记录冲突处理后仍然有效的指令，并保留优先级、权限、作用域、覆盖或升级理由。",
        "An instruction-resolution result records through a non-action relation the instructions that remain effective after conflict handling, together with priority, authority, scope, override, or escalation rationale.",
        "指示解決結果は非動作関係により、競合処理後も有効な指示と、優先度・権限・範囲・上書き・上位判断の理由を記録します。",
      ),
    })],
    ["DefenseFinding-triggers-MitigationAction", Object.freeze({
      oldId: "DefenseFinding-triggers-MitigationAction",
      moduleId: "safety-injection-defense",
      predicate: "addresses",
      sourceId: "MitigationAction",
      targetId: "DefenseFinding",
      relationKind: "causal",
      cardinality: Object.freeze({
        source: Object.freeze({ min: 0, max: null }),
        target: Object.freeze({ min: 1, max: 1 }),
      }),
      reason: localized(
        "DefenseFinding 是检测与分析形成的安全发现记录，不是执行触发器；具有执行身份的 MitigationAction 在适用策略决定或授权下处置该发现指出的风险。",
        "DefenseFinding is a safety-finding record produced by detection and analysis, not an execution trigger; the identity-bearing MitigationAction addresses the risk identified by the finding under an applicable policy decision or authorization.",
        "DefenseFinding は検出・分析で形成された安全所見記録であり実行トリガーではありません。実行同一性を持つ MitigationAction が適用方針判断または認可の下で所見の示すリスクへ対処します。",
      ),
      definitions: localized(
        "缓解活动在适用策略决定或授权下处置防御发现指出的具体风险，并记录执行者、作用域、前后状态、验证与回滚结果；防御发现仅作为输入证据。",
        "A mitigation activity addresses the specific risk identified by a defense finding under an applicable policy decision or authorization and records actor, scope, before/after state, validation, and rollback outcome; the finding remains input evidence.",
        "緩和活動は適用方針判断または認可の下で防御所見が示す具体的リスクへ対処し、実行者・範囲・前後状態・検証・ロールバック結果を記録します。防御所見は入力証拠にとどまります。",
      ),
    })],
    ["Measurement-measures-Metric", Object.freeze({
      oldId: "Measurement-measures-Metric",
      moduleId: "feedback-metrics-evaluation",
      predicate: "conforms_to",
      sourceId: "Measurement",
      targetId: "Metric",
      relationKind: "governance",
      reason: localized(
        "Measurement 是一次观测的值记录，Metric 是可复用的测量规范；信息记录不执行 measures，二者应以非动作谓词 conforms_to 表达本次值遵循哪项指标定义。",
        "Measurement is an observed-value record and Metric is a reusable measurement specification; an information record does not perform measures, so the non-action predicate conforms_to states which metric definition governs the value.",
        "Measurement は一回の観測値記録で、Metric は再利用可能な測定仕様です。情報記録は measures を実行しないため、非動作述語 conforms_to により値が従う指標定義を表します。",
      ),
      definitions: localized(
        "测量记录遵循一项指标规范，该规范固定被测属性、单位、量表、聚合方法和比较方向；Measurement 与 Metric 保持独立身份。",
        "A measurement record conforms to a metric specification that fixes the measured property, unit, scale, aggregation method, and comparison direction; Measurement and Metric retain independent identities.",
        "測定記録は測定対象属性・単位・尺度・集約方法・比較方向を固定する指標仕様に従い、Measurement と Metric は独立同一性を保ちます。",
      ),
    })],
    ["Feedback-triggers-MemoryWrite", Object.freeze({
      oldId: "Feedback-triggers-MemoryWrite",
      moduleId: "memory-lifecycle",
      predicate: "responds_to",
      sourceId: "MemoryWrite",
      targetId: "Feedback",
      relationKind: "causal",
      reason: localized(
        "Feedback 是评估或审查形成的信息信号，只能作为记忆写入的依据，不能执行 triggers；具有活动身份的 MemoryWrite 在持久化策略或明确授权允许时响应这项反馈。",
        "Feedback is an information signal produced by evaluation or review and can only serve as evidence for a memory write, not execute triggers; the activity-typed MemoryWrite responds to that feedback when a persistence policy or explicit authorization permits it.",
        "Feedback は評価またはレビューで形成される情報信号であり、記憶書き込みの根拠にはなっても triggers を実行できません。activity 型の MemoryWrite が永続化方針または明示的認可の許可時にそのフィードバックへ応答します。",
      ),
      definitions: localized(
        "记忆写入活动在经审查的反馈被持久化策略或明确授权选中后，以该反馈作为写入依据；Feedback 保持输入信息身份，不取得触发或执行身份。",
        "A memory-write activity responds to reviewed feedback by using it as write evidence after a persistence policy or explicit authorization selects it; Feedback remains input information and does not acquire trigger or execution agency.",
        "記憶書き込み活動は、レビュー済みフィードバックが永続化方針または明示的認可により選択された後、それを書き込み根拠として応答します。Feedback は入力情報の同一性を保ち、起動・実行主体にはなりません。",
      ),
      condition: Object.freeze({
        id: "MemoryWrite-responds_to-Feedback-condition-persistence-authorized",
        severity: "error",
        expression_language: "plain",
        expression: "the Feedback is reviewed for memory use and a persistence policy or explicit authorization permits this MemoryWrite",
        explanations: localized(
          "该反馈已通过记忆用途审查，且持久化策略或明确授权允许本次记忆写入。",
          "The feedback has been reviewed for memory use, and a persistence policy or explicit authorization permits this memory write.",
          "当該フィードバックは記憶用途の審査を通過し、永続化方針または明示的認可がこの記憶書き込みを許可しています。",
        ),
      }),
    })],
  ]);
  const corrections = Object.freeze(
    ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS.map((decision) => {
      const details = correctionDetailsByOldId.get(decision.old_relation_id);
      if (!details) {
        throw new Error(`Missing agency semantics for ${decision.old_relation_id}`);
      }
      return Object.freeze({
        ...details,
        newId: decision.new_relation_id,
        affectedConceptIds: decision.affected_concept_ids,
      });
    }),
  );

  const rewriteAffectedConceptNarratives = () => {
    const affectedConceptIds = new Set(
      corrections.flatMap(({ affectedConceptIds: conceptIds }) => conceptIds),
    );
    for (const conceptId of [...affectedConceptIds].sort()) {
      const concept = allConcepts().get(conceptId);
      if (!concept || concept.status !== "accepted") {
        throw new Error(`Missing accepted agency-affected Concept ${conceptId}`);
      }
      const sourceClaims = cleanDirectClaims(concept);
      const incidentRelations = [...allRelations().values()]
        .filter((relation) =>
          relation.status === "accepted" &&
          (relation.source_id === conceptId || relation.target_id === conceptId))
        .sort((left, right) => {
          const leftPrimary = left.id === concept.primary_parent_relation_id ? 0 : 1;
          const rightPrimary = right.id === concept.primary_parent_relation_id ? 0 : 1;
          return leftPrimary - rightPrimary || left.id.localeCompare(right.id, "en");
        });
      const anchor = incidentRelations[0] ?? null;
      const generatedExamples = conceptExamples({
        id: concept.id,
        labels: concept.labels,
        definitions: concept.definitions,
        sourceClaims,
        relatedRelationIds: anchor ? [anchor.id] : [],
      });
      const preservedCaseFragments = (concept.examples ?? []).flatMap((example) => {
        if (example.kind !== "case-fragment") return [];
        if (example.id === "MemoryWrite-case-software-defect-repair-09") {
          return [{
            ...example,
            related_node_ids: ["MemoryWrite", "Feedback", "MemoryRecord"],
            related_relation_ids: [
              "MemoryWrite-responds_to-Feedback",
              "MemoryWrite-produces-MemoryRecord",
            ],
            expected_result: localized(
              "持久化策略允许 MemoryWrite 响应经回归验证的 Feedback，并由该活动产生一项新的 MemoryRecord；Feedback 本身不取得执行身份。",
              "The persistence policy permits MemoryWrite to respond to regression-verified Feedback and the activity produces one new MemoryRecord; Feedback itself acquires no execution agency.",
              "永続化方針は MemoryWrite が回帰検証済み Feedback へ応答することを許可し、その活動が新しい MemoryRecord を一件生成します。Feedback 自体は実行主体になりません。",
            ),
            source_claims: cleanDirectClaims(concept),
          }];
        }
        return hasStaleAgencyRelation(example) ? [] : [example];
      });
      updateReviewedConcept(conceptId, {
        source_claims: sourceClaims,
        why_needed: localized(
          `${concept.labels.zh}需要独立 canonical 身份，才能验证其定义、semantic kind 与真实关系端点，而不把信息记录、规范和活动的职责混为一体。`,
          `${concept.labels.en} needs an independent canonical identity so its definition, semantic kind, and real relation endpoints can be verified without conflating the responsibilities of records, specifications, and activities.`,
          `${concept.labels.ja}には独立した canonical 同一性が必要です。これにより、記録・仕様・活動の責務を混同せず、定義、semantic kind、実在関係端点を検証できます。`,
        ),
        includes: [localized(
          `纳入具有独立 canonical ID 且满足该正向身份条件的对象：“${concept.short_definitions.zh}”`,
          `Includes objects with an independent canonical ID that satisfy this positive identity condition: “${concept.short_definitions.en}”`,
          `独立 canonical ID を持ち、次の正の同一性条件を満たす対象を含みます：「${concept.short_definitions.ja}」`,
        )],
        excludes: [localized(
          `排除仅与${concept.labels.zh}共现、仅位于某条关系另一端，或不满足该正向身份条件的对象。`,
          `Excludes objects that merely co-occur with ${concept.labels.en}, occupy only the other endpoint of a relation, or fail its positive identity condition.`,
          `${concept.labels.ja}と共起するだけ、関係の反対端にあるだけ、または正の同一性条件を満たさない対象を除外します。`,
        )],
        examples: [...generatedExamples, ...preservedCaseFragments],
        sibling_differentiation: [],
      });
    }
  };

  const repairRemainingInformationAgency = () => {
    for (const correction of corrections) {
      const sourceConcept = allConcepts().get(correction.sourceId);
      if (!sourceConcept || sourceConcept.status !== "accepted") {
        throw new Error(`Missing accepted agency source Concept ${correction.sourceId}`);
      }
      deprecateRelation(
        correction.oldId,
        [correction.newId],
        correction.reason,
      );
      upsertReviewedRelation({
        id: correction.newId,
        moduleId: correction.moduleId,
        predicate: correction.predicate,
        sourceId: correction.sourceId,
        targetId: correction.targetId,
        relationKind: correction.relationKind,
        definitions: correction.definitions,
        cardinality: correction.cardinality,
        conditions: correction.condition
          ? [{ ...correction.condition, source_claims: cleanDirectClaims(sourceConcept) }]
          : [],
      });
    }

    const defenseFinding = allConcepts().get("DefenseFinding");
    const mitigationAction = allConcepts().get("MitigationAction");
    if (!defenseFinding || !mitigationAction) {
      throw new Error("DefenseFinding and MitigationAction are required for agency repair");
    }
    updateReviewedConcept("DefenseFinding", {
      structure: {
        ...defenseFinding.structure,
        required_relation_constraints: (
          defenseFinding.structure?.required_relation_constraints ?? []
        ).filter(({ id }) => id !== "defense-finding-triggers-mitigation"),
      },
    });
    const mitigationConstraint = {
      id: "mitigation-action-addresses-defense-finding",
      direction: "outgoing",
      predicate: "addresses",
      target_concept_id: "DefenseFinding",
      cardinality: { min: 1, max: 1 },
      explanations: localized(
        "本模块中的每项缓解活动必须明确处置一项防御发现，并保留适用策略决定或授权作为执行依据。",
        "Each mitigation activity in this module must explicitly address one defense finding and retain an applicable policy decision or authorization as its execution basis.",
        "本モジュールの各緩和活動は一つの防御所見へ明示的に対処し、適用方針判断または認可を実行根拠として保持しなければなりません。",
      ),
      source_claims: cleanDirectClaims(mitigationAction),
    };
    updateReviewedConcept("MitigationAction", {
      structure: {
        ...mitigationAction.structure,
        required_relation_constraints: [
          ...(mitigationAction.structure?.required_relation_constraints ?? [])
            .filter(({ id }) => id !== mitigationConstraint.id),
          mitigationConstraint,
        ],
      },
    });

    rewriteAffectedConceptNarratives();
  };

  return Object.freeze({ repairRemainingInformationAgency });
};
\n
