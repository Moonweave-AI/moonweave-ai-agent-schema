import { localized } from "./ontology-migration-factories.mjs";

const unique = (values) => [...new Set(values)];

const claimKey = (claim) => [claim.source_id, claim.locator, claim.evidence_kind].join("\0");

const compressClaims = (claims, maximum = 2) => {
  const byKey = new Map();
  for (const claim of claims ?? []) {
    const key = claimKey(claim);
    if (!byKey.has(key)) byKey.set(key, structuredClone(claim));
  }
  return [...byKey.values()]
    .sort((left, right) => {
      const official = (claim) => /^(eng-(?:proto|ont|state|val)|lit-val)-/u.test(claim.source_id) ? 0 : 1;
      return official(left) - official(right) || left.source_id.localeCompare(right.source_id);
    })
    .slice(0, maximum);
};

const relationPriority = (concept, relation) => {
  if (relation.predicate !== "is_a" && relation.source_id === concept.id) return 0;
  if (relation.predicate !== "is_a") return 1;
  if (relation.id === concept.primary_parent_relation_id) return 2;
  if (relation.source_id === concept.id) return 3;
  return 4;
};

const chooseAnchorRelation = (concept, incidentRelations) =>
  [...incidentRelations].sort((left, right) => {
    const priority = relationPriority(concept, left) - relationPriority(concept, right);
    return priority || left.id.localeCompare(right.id);
  })[0] ?? null;

const relationFact = (relation) =>
  localized(
    `canonical 事实 ${relation.id}（${relation.source_id} ${relation.predicate} ${relation.target_id}）`,
    `canonical fact ${relation.id} (${relation.source_id} ${relation.predicate} ${relation.target_id})`,
    `canonical 事実 ${relation.id}（${relation.source_id} ${relation.predicate} ${relation.target_id}）`,
  );

const domainScenarioIntroductions = Object.freeze({
  info: localized(
    "在一次多模态助手的上下文准备运行中，",
    "During a multimodal assistant run for context preparation,",
    "マルチモーダル支援エージェントのコンテキスト準備実行では、",
  ),
  orchestration: localized(
    "在一次协调器的任务分解与委派运行中，",
    "During a coordinator run for task decomposition and delegation,",
    "コーディネーターによるタスク分解と委任の実行では、",
  ),
  runtime: localized(
    "在一次带追踪与重试的任务执行中，",
    "During a traced task execution with retries,",
    "追跡と再試行を伴うタスク実行では、",
  ),
  adapter: localized(
    "在一次外部框架或协议的集成构建中，",
    "During an integration build for an external framework or protocol,",
    "外部フレームワークまたはプロトコルの統合ビルドでは、",
  ),
  tool: localized(
    "在一次智能体工具发现、选择与调用运行中，",
    "During an agent tool-use run for discovery, selection, and invocation,",
    "エージェントによるツールの発見・選択・呼び出し実行では、",
  ),
  safety: localized(
    "在一次受保护的授权与副作用处理运行中，",
    "During a guarded agent run for authorization and side-effect handling,",
    "認可と副作用を保護するエージェント実行では、",
  ),
  feedback: localized(
    "在一次评估、纠正与改进决策循环中，",
    "During an evaluation and correction cycle for improvement decisions,",
    "評価・修正・改善判断のサイクルでは、",
  ),
  memory: localized(
    "在一次检索增强的记忆接入与组装运行中，",
    "During a retrieval-augmented memory run for ingestion and assembly,",
    "検索拡張メモリの取り込みと組み立て実行では、",
  ),
});

const scenarioDomain = (moduleId) => {
  const candidate = typeof moduleId === "string" ? moduleId.split("-")[0] : "runtime";
  return Object.hasOwn(domainScenarioIntroductions, candidate) ? candidate : "runtime";
};

const compactExampleValue = (value) => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return String(value);
  return serialized.length <= 80 ? serialized : `${serialized.slice(0, 77)}...`;
};

const fieldEvidence = (fieldValues) => {
  const entries = Object.entries(fieldValues ?? {});
  if (entries.length === 0) return localized("", "", "");
  const rendered = entries.map(([id, value]) => `${id}=${compactExampleValue(value)}`).join(", ");
  return localized(
    `记录同时写入经审查字段 ${rendered}。`,
    `The record also binds reviewed fields ${rendered}.`,
    `記録には審査済み項目 ${rendered} も設定されます。`,
  );
};

const withoutTerminalPunctuation = (value) =>
  value.trim().replace(/[。．.!?！？]+$/gu, "");

export const buildConcreteAgentPositiveScenario = ({ concept: inputConcept, anchor = null, fieldValues = {} }) => {
  const concept = {
    ...inputConcept,
    definitions: inputConcept.definitions ?? inputConcept.short_definitions,
  };
  if (!concept.definitions) {
    throw new Error(`Concept ${concept.id} has no localized definition for its positive scenario`);
  }
  const reviewedDefinition = localized(
    withoutTerminalPunctuation(concept.definitions.zh),
    withoutTerminalPunctuation(concept.definitions.en),
    withoutTerminalPunctuation(concept.definitions.ja),
  );
  const introduction = domainScenarioIntroductions[scenarioDomain(concept.module_id)];
  const fields = fieldEvidence(fieldValues);
  if (anchor === null) {
    return Object.freeze({
      descriptions: localized(
        `${introduction.zh}系统实例化${concept.labels.zh}（${concept.id}）。其已审查定义是“${reviewedDefinition.zh}”。${fields.zh}`,
        `${introduction.en} the system materializes ${concept.labels.en} (${concept.id}). Its reviewed definition is “${reviewedDefinition.en}”. ${fields.en}`.trim(),
        `${introduction.ja}システムは${concept.labels.ja}（${concept.id}）を具体化します。審査済み定義は「${reviewedDefinition.ja}」です。${fields.ja}`,
      ),
      expected_result: localized(
        `该运行保留 ${concept.id} 的定义身份和可验证字段。`,
        `The run preserves ${concept.id}'s defined identity and verifiable fields.`,
        `この実行は ${concept.id} の定義済み同一性と検証可能な項目を保持します。`,
      ),
      why_valid_or_invalid: localized(
        "该说明给出具体领域操作、完整定义和实际字段值，而不是只复述类型标签。",
        "The scenario gives a concrete domain operation, the complete definition, and actual field values instead of merely repeating a type label.",
        "この説明は型ラベルの反復ではなく、具体的な領域操作、完全な定義、実際の項目値を示します。",
      ),
    });
  }
  const endpointRole = anchor.source_id === concept.id
    ? localized("源端点", "source", "始点")
    : localized("目标端点", "target", "終点");
  const directedFact = `${anchor.source_id} ${anchor.predicate} ${anchor.target_id}`;
  return Object.freeze({
    descriptions: localized(
      `${introduction.zh}系统将${concept.labels.zh}（${concept.id}）记录为 ${directedFact} 的${endpointRole.zh}。其已审查定义是“${reviewedDefinition.zh}”。${fields.zh}`,
      `${introduction.en} the system records ${concept.labels.en} (${concept.id}) as the ${endpointRole.en} of ${directedFact}. Its reviewed definition is “${reviewedDefinition.en}”. ${fields.en}`.trim(),
      `${introduction.ja}システムは${concept.labels.ja}（${concept.id}）を ${directedFact} の${endpointRole.ja}として記録します。審査済み定義は「${reviewedDefinition.ja}」です。${fields.ja}`,
    ),
    expected_result: localized(
      `该运行可查询 ${concept.id} 以及方向保持不变的事实 ${anchor.id}。`,
      `The run can query ${concept.id} together with direction-preserving fact ${anchor.id}.`,
      `この実行では ${concept.id} と方向を保持した事実 ${anchor.id} を共に照会できます。`,
    ),
    why_valid_or_invalid: localized(
      `该场景同时给出真实运行语境、${anchor.id} 的 canonical 方向、概念定义和可用字段值。`,
      `The scenario combines a real operational context, the canonical direction of ${anchor.id}, the concept definition, and available field values.`,
      `このシナリオは実際の運用文脈、${anchor.id} の canonical 方向、概念定義、利用可能な項目値を組み合わせます。`,
    ),
  });
};

const joinLocalizedIds = (ids) => ids.join("、");

const informationContractIsComplete = (concept) =>
  concept.labels && concept.definitions && concept.semantic_kind && concept.structure;

const legacyRelationEnrichment = ({ concept, anchor }) => ({
  ...structuredClone(concept),
  examples: concept.examples.map((example) => {
    if (!["positive", "boundary", "counterexample"].includes(example.kind)) {
      return structuredClone(example);
    }
    const fact = relationFact(anchor);
    return {
      ...structuredClone(example),
      descriptions: localized(
        `${example.descriptions.zh} ${fact.zh}`,
        `${example.descriptions.en} ${fact.en}`,
        `${example.descriptions.ja} ${fact.ja}`,
      ),
      related_node_ids: unique([...example.related_node_ids, anchor.source_id, anchor.target_id]),
      related_relation_ids: unique([...example.related_relation_ids, anchor.id]),
      source_claims: compressClaims(anchor.source_claims),
    };
  }),
});

const parentIdFor = (concept, relationById) => {
  const relation = concept.primary_parent_relation_id
    ? relationById.get(concept.primary_parent_relation_id)
    : null;
  return relation?.predicate === "is_a" && relation.source_id === concept.id
    ? relation.target_id
    : null;
};

const chooseContrast = ({ concept, conceptById, parentById, childrenByParent, anchor }) => {
  const parentId = parentById.get(concept.id) ?? null;
  const siblingId = parentId
    ? (childrenByParent.get(parentId) ?? [])
        .filter((id) => id !== concept.id)
        .sort((left, right) => left.localeCompare(right))[0] ?? null
    : null;
  if (siblingId) return { kind: "sibling", concept: conceptById.get(siblingId), parentId };
  if (parentId) return { kind: "parent", concept: conceptById.get(parentId), parentId };
  if (anchor) {
    const otherId = anchor.source_id === concept.id ? anchor.target_id : anchor.source_id;
    if (otherId !== concept.id && conceptById.has(otherId)) {
      return { kind: "related-endpoint", concept: conceptById.get(otherId), parentId: null };
    }
  }
  const childId = [...(childrenByParent.get(concept.id) ?? [])].sort((left, right) =>
    left.localeCompare(right),
  )[0];
  return childId
    ? { kind: "child", concept: conceptById.get(childId), parentId: concept.id }
    : null;
};

const reviewedFieldValues = (concept) => {
  const existing = concept.examples.find(({ kind }) => kind === "positive")?.field_values ?? {};
  if (Object.keys(existing).length > 0) return structuredClone(existing);
  const instance = concept.examples.find(({ kind }) => kind === "instance")?.field_values ?? {};
  if (Object.keys(instance).length > 0) return structuredClone(instance);
  return Object.fromEntries(
    (concept.structure.fields ?? [])
      .filter(({ example_value: value }) => value !== null && value !== undefined)
      .map((field) => [field.id, field.example_value]),
  );
};

const evidenceFields = (concept) =>
  (concept.structure.fields ?? [])
    .filter(({ required }) => required)
    .concat((concept.structure.fields ?? []).filter(({ required }) => !required))
    .map(({ id }) => id)
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, 3);

const whyNeeded = ({ concept, anchor, contrast, fields }) => {
  const fact = relationFact(anchor);
  const contrastId = contrast?.concept?.id;
  const distinction = contrastId
    ? localized(
        `并保持与 ${contrastId} 的定义边界`,
        `while preserving its reviewed boundary from ${contrastId}`,
        `${contrastId} との審査済み境界を保ちながら`,
      )
    : localized("", "", "");
  const fieldText = fields.length
    ? localized(
        `；节点字段 ${joinLocalizedIds(fields)} 使该区别可验证`,
        `; node fields ${fields.join(", ")} make that distinction testable`,
        `。ノード項目 ${joinLocalizedIds(fields)} によりその区別を検証できます`,
      )
    : localized("", "", "");
  return localized(
    `${concept.labels.zh}为${fact.zh}提供明确端点${distinction.zh}${fieldText.zh}。`,
    `${concept.labels.en} provides an explicit endpoint for ${fact.en} ${distinction.en}${fieldText.en}.`,
    `${concept.labels.ja}は${fact.ja}の明確な端点を提供し、${distinction.ja}${fieldText.ja}。`,
  );
};

const inclusionBoundary = ({ concept, anchor, fields }) => {
  const fieldText = fields.length
    ? localized(
        `可由字段 ${joinLocalizedIds(fields)} 检验`,
        `can be checked through fields ${fields.join(", ")}`,
        `項目 ${joinLocalizedIds(fields)} で検査できます`,
      )
    : localized(
        `可由关系 ${anchor.id} 的端点角色检验`,
        `can be checked through its endpoint role in ${anchor.id}`,
        `関係 ${anchor.id} の端点役割で検査できます`,
      );
  return localized(
    `纳入符合下列已审查种差的${concept.labels.zh}：${concept.definitions.zh}；该种差${fieldText.zh}。`,
    `Includes ${concept.labels.en} records satisfying this reviewed differentia: ${concept.definitions.en} The differentia ${fieldText.en}.`,
    `次の審査済み種差を満たす${concept.labels.ja}を含みます：${concept.definitions.ja} 種差は${fieldText.ja}。`,
  );
};

const exclusionBoundary = ({ concept, contrast, anchor }) => {
  const other = contrast?.concept;
  if (contrast?.kind === "sibling") {
    return localized(
      `${other.labels.zh}虽与本概念同属 ${contrast.parentId}，但其定义为“${other.definitions.zh}”，不得替代${concept.labels.zh}。`,
      `${other.id} shares parent ${contrast.parentId}, but its reviewed definition is “${other.definitions.en}”; it must not be substituted for ${concept.id}.`,
      `${other.id} は同じ上位 ${contrast.parentId} を持ちますが、審査済み定義は「${other.definitions.ja}」であり、${concept.id} の代用にはできません。`,
    );
  }
  if (contrast?.kind === "parent") {
    return localized(
      `仅能识别为上位概念 ${other.id} 的对象不在范围内；它尚未证明${concept.labels.zh}的种差或关系端点 ${anchor.id}。`,
      `An object identified only as broader concept ${other.id} is excluded until it proves ${concept.id}'s differentia or its endpoint role in ${anchor.id}.`,
      `上位概念 ${other.id} としか識別できない対象は、${concept.id} の種差または ${anchor.id} の端点役割を証明するまで範囲外です。`,
    );
  }
  if (other) {
    return localized(
      `${other.labels.zh}只是关系 ${anchor.id} 的另一端；相关联不表示它是${concept.labels.zh}。`,
      `${other.id} is only the other endpoint of ${anchor.id}; relatedness does not make it a ${concept.id}.`,
      `${other.id} は ${anchor.id} のもう一方の端点にすぎず、関連するだけで ${concept.id} にはなりません。`,
    );
  }
  return localized(
    `未能作为 ${anchor.id} 中 ${concept.id} 端点且不满足已审查种差的对象不在范围内。`,
    `Objects that cannot occupy the ${concept.id} endpoint of ${anchor.id} and do not meet the reviewed differentia are excluded.`,
    `${anchor.id} の ${concept.id} 端点を担えず、審査済み種差を満たさない対象は範囲外です。`,
  );
};

const positiveExample = ({ concept, original, anchor, contrast, fieldValues }) => {
  const scenario = buildConcreteAgentPositiveScenario({ concept, anchor, fieldValues });
  return {
    ...structuredClone(original),
    scenario_id: null,
    descriptions: scenario.descriptions,
    field_values: fieldValues,
    related_node_ids: unique([concept.id, anchor.source_id, anchor.target_id]),
    related_relation_ids: [anchor.id],
    expected_result: scenario.expected_result,
    why_valid_or_invalid: scenario.why_valid_or_invalid,
    source_claims: compressClaims(anchor.source_claims?.length ? anchor.source_claims : concept.source_claims),
  };
};

const boundaryExample = ({ concept, original, anchor, contrast }) => {
  const other = contrast?.concept;
  const parentOrRelation = contrast?.kind === "sibling"
    ? `shared parent ${contrast.parentId}`
    : `relation ${anchor.id}`;
  const description = other
    ? localized(
        `${other.id} 用作${concept.id}的边界对照：两者可见于同一图谱片段，但 ${other.id} 的已审查定义是“${other.definitions.zh}”。不能因 ${parentOrRelation} 而把它归入${concept.id}。`,
        `${other.id} is the boundary contrast for ${concept.id}. Both may occur in one graph fragment, but ${other.id}'s reviewed definition is “${other.definitions.en}”. ${parentOrRelation} does not make it a ${concept.id}.`,
        `${other.id} は ${concept.id} の境界対照です。同じグラフ断片に現れ得ますが、${other.id} の審査済み定義は「${other.definitions.ja}」です。${parentOrRelation} だけで ${concept.id} にはなりません。`,
      )
    : localized(
        `${anchor.id} 的端点共现但缺少 ${concept.id} 的已审查种差；该片段不得推断类型成员资格。`,
        `The endpoints of ${anchor.id} co-occur without ${concept.id}'s reviewed differentia; the fragment must not infer type membership.`,
        `${anchor.id} の端点は共起しますが ${concept.id} の審査済み種差を欠くため、型所属を推論してはなりません。`,
      );
  return {
    ...structuredClone(original),
    scenario_id: null,
    descriptions: description,
    field_values: {},
    related_node_ids: unique([
      concept.id,
      anchor.source_id,
      anchor.target_id,
      ...(other ? [other.id] : []),
    ]),
    related_relation_ids: [anchor.id],
    expected_result: localized(
      `${other?.id ?? "该对象"} 保持其原有类型，验证器不得凭关系共现把它提升为 ${concept.id}。`,
      `${other?.id ?? "The object"} retains its own type; validation must not promote it to ${concept.id} from relation co-occurrence.`,
      `${other?.id ?? "対象"} は元の型を維持し、関係の共起だけで ${concept.id} へ昇格してはなりません。`,
    ),
    why_valid_or_invalid: localized(
      `边界例点名实际对照节点，并保留 ${anchor.id} 的方向；只有显式 is_a 或完整种差才支持成员资格。`,
      `The boundary names an actual contrast node and preserves the direction of ${anchor.id}; only an explicit is_a fact or the complete differentia supports membership.`,
      `境界例は実在する対照ノードを示し、${anchor.id} の方向を保持します。明示的 is_a または完全な種差だけが所属を支持します。`,
    ),
    source_claims: compressClaims(anchor.source_claims?.length ? anchor.source_claims : concept.source_claims),
  };
};

export const enrichConceptExamplesWithRelations = ({ concepts, relations }) => {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  const relationById = new Map(relations.map((relation) => [relation.id, relation]));
  const incidentByConcept = new Map(concepts.map(({ id }) => [id, []]));
  const parentById = new Map();
  const childrenByParent = new Map();

  for (const concept of concepts) {
    const parentId = parentIdFor(concept, relationById);
    if (!parentId) continue;
    parentById.set(concept.id, parentId);
    childrenByParent.set(parentId, [...(childrenByParent.get(parentId) ?? []), concept.id]);
  }
  for (const relation of relations) {
    if (relation.status !== "accepted") continue;
    if (!conceptById.has(relation.source_id) || !conceptById.has(relation.target_id)) continue;
    incidentByConcept.get(relation.source_id).push(relation);
    if (relation.target_id !== relation.source_id) incidentByConcept.get(relation.target_id).push(relation);
  }

  return concepts.map((concept) => {
    const anchor = chooseAnchorRelation(concept, incidentByConcept.get(concept.id) ?? []);
    if (!anchor) return structuredClone(concept);
    if (!informationContractIsComplete(concept)) return legacyRelationEnrichment({ concept, anchor });

    const contrast = chooseContrast({ concept, conceptById, parentById, childrenByParent, anchor });
    const fields = evidenceFields(concept);
    const fieldValues = reviewedFieldValues(concept);
    return {
      ...structuredClone(concept),
      why_needed: whyNeeded({ concept, anchor, contrast, fields }),
      includes: [inclusionBoundary({ concept, anchor, fields })],
      excludes: [exclusionBoundary({ concept, contrast, anchor })],
      source_claims: compressClaims(concept.source_claims),
      examples: concept.examples.map((example) => {
        if (example.kind === "positive") {
          return positiveExample({ concept, original: example, anchor, contrast, fieldValues });
        }
        if (["boundary", "counterexample"].includes(example.kind)) {
          return boundaryExample({ concept, original: example, anchor, contrast });
        }
        return {
          ...structuredClone(example),
          source_claims: compressClaims(example.source_claims),
        };
      }),
    };
  });
};
