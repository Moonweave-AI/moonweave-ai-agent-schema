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
  const fact = relationFact(anchor);
  const contrastText = contrast?.concept
    ? localized(
        `；该记录不与边界对照项 ${contrast.concept.id} 混用`,
        `; the record is not conflated with boundary contrast ${contrast.concept.id}`,
        `。境界対照 ${contrast.concept.id} と混同しません`,
      )
    : localized("", "", "");
  return {
    ...structuredClone(original),
    scenario_id: null,
    descriptions: localized(
      `在可核验图谱片段中，${concept.id} 以自身 canonical ID 参与${fact.zh}${contrastText.zh}。${concept.definitions.zh}`,
      `In a verifiable graph fragment, ${concept.id} participates in ${fact.en} under its own canonical ID${contrastText.en}. ${concept.definitions.en}`,
      `検証可能なグラフ断片で、${concept.id} は自身の canonical ID により${fact.ja}へ参加します${contrastText.ja}。${concept.definitions.ja}`,
    ),
    field_values: fieldValues,
    related_node_ids: unique([concept.id, anchor.source_id, anchor.target_id]),
    related_relation_ids: [anchor.id],
    expected_result: localized(
      `查询必须解析到 ${anchor.id} 的 ${concept.id} 端点，并通过该节点的字段与种差校验。`,
      `The query must resolve ${concept.id} as an endpoint of ${anchor.id} and validate the node's fields and differentia.`,
      `照会は ${anchor.id} の端点として ${concept.id} を解決し、ノードの項目と種差を検証しなければなりません。`,
    ),
    why_valid_or_invalid: localized(
      `示例复用真实端点和关系 ${anchor.id}，没有用名称相似性替代关系或类型断言。`,
      `The example reuses the actual endpoints and relation ${anchor.id}; name similarity does not substitute for a relation or type assertion.`,
      `この例は実在する端点と関係 ${anchor.id} を再利用し、名称類似性で関係または型アサーションを代替しません。`,
    ),
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
