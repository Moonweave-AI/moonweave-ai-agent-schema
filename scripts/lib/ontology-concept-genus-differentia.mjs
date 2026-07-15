const ontologyLanguages = Object.freeze(["zh", "en", "ja"]);

export const preferredSemanticKindGenus = Object.freeze({
  activity: Object.freeze({ zh: "活动", en: "activity", ja: "活動" }),
  capability: Object.freeze({ zh: "能力", en: "capability", ja: "能力" }),
  collection: Object.freeze({ zh: "集合", en: "collection", ja: "集合" }),
  entity: Object.freeze({ zh: "实体", en: "entity", ja: "実体" }),
  event: Object.freeze({ zh: "事件", en: "event", ja: "事象" }),
  information: Object.freeze({ zh: "信息记录", en: "information record", ja: "情報記録" }),
  quality: Object.freeze({ zh: "质量特征", en: "quality characteristic", ja: "品質特性" }),
  role: Object.freeze({ zh: "角色", en: "role", ja: "役割" }),
  specification: Object.freeze({ zh: "规范", en: "specification", ja: "仕様" }),
  state: Object.freeze({ zh: "状态", en: "state", ja: "状態" }),
});

const normalizeSemanticText = (value) =>
  value.normalize("NFKC").trim().toLocaleLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const occurrenceIndexes = (value, search) => {
  if (search.length === 0) return [];
  const indexes = [];
  let cursor = 0;
  while (cursor <= value.length - search.length) {
    const index = value.indexOf(search, cursor);
    if (index < 0) break;
    indexes.push(index);
    cursor = index + search.length;
  }
  return indexes;
};

const standaloneDisplayLabelIndexes = ({ sentence, label, acceptedLabels, language }) =>
  occurrenceIndexes(sentence, label).filter((index) =>
    !(
      language === "en" &&
      (/^[\p{L}\p{N}_]$/u.test(sentence[index - 1] ?? "") ||
        /^[\p{L}\p{N}_]$/u.test(sentence[index + label.length] ?? ""))
    ) && !acceptedLabels.some((candidate) => {
      if (candidate === label || candidate.length <= label.length) return false;
      return occurrenceIndexes(sentence, candidate).some((candidateIndex) =>
        index >= candidateIndex && index + label.length <= candidateIndex + candidate.length,
      );
    }),
  );

const firstSentence = (value, language) => {
  const text = value.trim();
  if (language !== "en") return text.split(/[。！？]/u, 1)[0].trim();
  const match = text.match(/^.*?[.!?](?=\s|$)/u);
  return (match?.[0] ?? text).replace(/[.!?]+$/u, "").trim();
};

const genericDifferentiaPatterns = Object.freeze({
  zh: Object.freeze([
    /^.{0,20}(?:仅|只是)?具有独立身份$/u,
    /^.{0,20}满足(?:该|本概念的)?(?:定义|身份条件)$/u,
    /^.{0,20}作为可查询的语义边界$/u,
    /^.{0,20}在 canonical 图中(?:存在|出现|参与)$/iu,
  ]),
  en: Object.freeze([
    /^.{0,40}\b(?:only |merely )?has (?:an? )?independent identity$/iu,
    /^.{0,40}\bsatisf(?:y|ies) (?:the )?(?:definition|identity conditions)$/iu,
    /^.{0,40}\bas a queryable semantic boundary$/iu,
    /^.{0,40}\b(?:exists|appears|participates) in (?:the )?canonical graph$/iu,
  ]),
  ja: Object.freeze([
    /^.{0,20}独立した同一性を持(?:つ|ちます)$/u,
    /^.{0,20}(?:定義|同一性条件)を満た(?:す|します)$/u,
    /^.{0,20}検索可能な意味境界(?:です|である)?$/u,
    /^.{0,20}canonical グラフで(?:存在|出現|参加)(?:する|します)$/iu,
  ]),
});

const meaningfulDifferentia = (value, language) => {
  const trimmed = value
    .replace(/^[\s,，:：;；、]+/u, "")
    .replace(/^(?:that|which|whose|and|is|are|の一種|であり|である|です)\b\s*/iu, "")
    .trim();
  const enoughContent = language === "en"
    ? trimmed.split(/\s+/u).filter(Boolean).length >= 5
    : [...trimmed].length >= 8;
  return enoughContent && !genericDifferentiaPatterns[language].some(
    (pattern) => pattern.test(trimmed),
  );
};

const englishFinitePredicateSource =
  "is|are|was|were|has|have|had|can|could|must|may|might|will|would|should|accepts|aligns|applies|assigns|asks|binds|bounds|captures|checks|classifies|compares|contains|converts|creates|defines|denotes|describes|determines|emits|evaluates|executes|exposes|forms|governs|groups|identifies|links|maps|marks|measures|organizes|points|produces|projects|provides|reads|records|recommends|references|reifies|represents|resolves|retains|returns|routes|selects|sets|specifies|states|stores|subscribes|summarizes|terminates|tracks|translates|uses|validates|yields";

const englishClauseHasFinitePredicate = (clause) => {
  const independentClause = clause.split(/\b(?:that|which|whose)\b/iu, 1)[0].trim();
  const finitePredicate = `(?:${englishFinitePredicateSource}|[a-z-]+(?:s|es))`;
  const pronounSubject = new RegExp(
    `^(?:it|this|that|they|these|those)\\s+(?:[a-z-]+ly\\s+)*${finitePredicate}\\b`,
    "iu",
  );
  const shortExplicitSubject = new RegExp(
    `^(?:[\\p{L}\\p{N}_-]+\\s+){1,3}${finitePredicate}\\b`,
    "iu",
  );
  return pronounSubject.test(independentClause) || shortExplicitSubject.test(independentClause);
};

const malformedDefinitionSyntax = (sentence, language) => {
  if (language === "zh") return /它族(?:把|将)|旧定义/u.test(sentence);
  if (language === "ja") return /それ定義|旧定義/u.test(sentence);
  if (language !== "en") return false;
  if (/\bthat\s+(?:A|An|The)\b/u.test(sentence)) return true;
  if (/\bthat\s+(?:a|an)\s+(?:it|this|that|they)\b/iu.test(sentence)) return true;
  if (/\b(?:a|an)\s+it\b/iu.test(sentence)) return true;
  if (/\blegacy\s+(?:definition|wording)\b/iu.test(sentence)) return true;
  const clauses = [...sentence.matchAll(
    /\b(?:differs\s+from\s+broader\s+members\s+in\s+that|distinguished\s+by\s+the\s+fact\s+that|(?:differentiating|defining)\s+condition\s+is\s+that)\s+([^.;!?]+)/giu,
  )].map((match) => match[1]);
  return clauses.some((clause) => !englishClauseHasFinitePredicate(clause));
};

export const acceptedConceptDisplayLabelViolations = (classes) =>
  ontologyLanguages.flatMap((language) => {
    const conceptIdsByLabel = new Map();
    for (const concept of classes) {
      if (concept?.status !== "accepted") continue;
      const label = concept.labels?.[language];
      if (typeof label !== "string" || label.trim().length === 0) continue;
      const normalizedLabel = normalizeSemanticText(label);
      conceptIdsByLabel.set(normalizedLabel, [
        ...(conceptIdsByLabel.get(normalizedLabel) ?? []),
        concept.id,
      ]);
    }
    return [...conceptIdsByLabel.entries()]
      .filter(([, conceptIds]) => conceptIds.length > 1)
      .map(([normalizedLabel, conceptIds]) => ({
        language,
        normalizedLabel,
        conceptIds: [...conceptIds].sort((left, right) => left.localeCompare(right, "en")),
      }))
      .sort((left, right) => left.normalizedLabel.localeCompare(right.normalizedLabel, language));
  });

const acceptedParentRelationsByChild = ({ classes, relations }) => {
  const acceptedConceptById = new Map(
    classes
      .filter(({ status }) => status === "accepted")
      .map((concept) => [concept.id, concept]),
  );
  const result = new Map();
  for (const relation of relations) {
    if (relation.status !== "accepted" || relation.predicate !== "is_a") continue;
    const child = acceptedConceptById.get(relation.source_id);
    const parent = acceptedConceptById.get(relation.target_id);
    if (!child || !parent || child.semantic_kind !== parent.semantic_kind) continue;
    result.set(child.id, [
      ...(result.get(child.id) ?? []),
      { relation, parent },
    ]);
  }
  return result;
};

const orderedParentCandidates = (concept, parentRelations) =>
  [...parentRelations].sort((left, right) => {
    const leftPrimary = left.relation.id === concept.primary_parent_relation_id ? 0 : 1;
    const rightPrimary = right.relation.id === concept.primary_parent_relation_id ? 0 : 1;
    const leftBackbone = left.relation.layout_role === "primary-backbone" ? 0 : 1;
    const rightBackbone = right.relation.layout_role === "primary-backbone" ? 0 : 1;
    return leftPrimary - rightPrimary || leftBackbone - rightBackbone ||
      left.relation.id.localeCompare(right.relation.id, "en");
  });

const localizedParentGenusTokens = (parent, language) => [
  parent.labels[language],
  ...(language === "en" ? [parent.id] : []),
]
  .map(normalizeSemanticText)
  .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);

const englishTerm = (value) =>
  `(?<![\\p{L}\\p{N}])${escapeRegExp(value)}(?![\\p{L}\\p{N}])`;

const explicitClassificationMatch = ({ sentence, subjectTokens, genusTokens, language }) => {
  for (const subjectToken of subjectTokens) {
    for (const genusToken of genusTokens) {
      const subject = language === "en"
        ? `(?<subject>${englishTerm(subjectToken)})`
        : `(?<subject>${escapeRegExp(subjectToken)})`;
      const genus = language === "en"
        ? `(?<genus>${englishTerm(genusToken)})`
        : `(?<genus>${escapeRegExp(genusToken)})`;
      const patterns = language === "zh"
        ? [
            `${subject}\\s*(?:是|为)\\s*(?:一(?:种|类|项|个))?\\s*${genus}`,
            `(?:作为|身为)\\s*${genus}\\s*[，,；;：:]?\\s*${subject}`,
            `${subject}\\s*(?:属于|归入|归属于)\\s*${genus}`,
            `${subject}\\s*是[^。！？；;，,]{1,48}的\\s*${genus}`,
          ]
        : language === "en"
          ? [
              `(?:a|an|the)?\\s*${subject}\\s+(?:is|are)\\s+(?:a|an|the)?\\s*${genus}`,
              `as\\s+(?:a|an|the)?\\s*${genus}\\s*[,;:]\\s*${subject}`,
              `${subject}\\s+belongs\\s+to\\s+(?:a|an|the)?\\s*${genus}(?:\\s+category)?`,
            ]
          : [
              `${subject}\\s*は\\s*${genus}(?:[（(][^）)]{1,80}[）)])?\\s*(?:の一種|の一つ|であり|です|として|のうち)` ,
              `${genus}(?:[（(][^）)]{1,80}[）)])?\\s*に属する\\s*${subject}`,
            ];
      for (const source of patterns) {
        const match = new RegExp(source, "diu").exec(sentence);
        if (!match?.groups || !match.indices?.groups) continue;
        return {
          genusLabel: genusToken,
          genusIndex: match.indices.groups.genus[0],
          subjectToken,
          subjectIndex: match.indices.groups.subject[0],
        };
      }
    }
  }
  return null;
};

export const preferredConceptGenus = ({ concept, classes, relations }) => {
  const parentRelations = acceptedParentRelationsByChild({ classes, relations })
    .get(concept.id) ?? [];
  const preferredParent = orderedParentCandidates(concept, parentRelations)[0]?.parent;
  if (preferredParent) {
    return {
      source: "is_a-parent",
      conceptId: preferredParent.id,
      labels: preferredParent.labels,
    };
  }
  const labels = preferredSemanticKindGenus[concept.semantic_kind];
  return labels
    ? { source: "semantic-kind", conceptId: null, labels }
    : null;
};

export const conceptGenusDifferentiaViolations = ({ classes, relations }) => {
  const parentRelationsByChild = acceptedParentRelationsByChild({ classes, relations });
  const acceptedLabelsByLanguage = Object.fromEntries(
    ontologyLanguages.map((language) => [
      language,
      classes
        .filter(({ status }) => status === "accepted")
        .map((item) => item.labels?.[language])
        .filter((value) => typeof value === "string")
        .map(normalizeSemanticText),
    ]),
  );
  const violations = [];
  for (const concept of classes.filter(({ status }) => status === "accepted")) {
    const parentRelations = parentRelationsByChild.get(concept.id) ?? [];
    const orderedParents = orderedParentCandidates(concept, parentRelations);
    const fallbackGenus = preferredSemanticKindGenus[concept.semantic_kind];
    for (const language of ontologyLanguages) {
      const definition = concept.definitions?.[language];
      const label = concept.labels?.[language];
      if (typeof definition !== "string" || typeof label !== "string") {
        violations.push({
          conceptId: concept.id,
          language,
          reason: "missing-localized-definition",
          expectedGenusConceptIds: orderedParents.map(({ parent }) => parent.id),
        });
        continue;
      }
      const rawSentence = firstSentence(definition, language);
      const sentence = normalizeSemanticText(rawSentence);
      const normalizedLabel = normalizeSemanticText(label);
      const acceptedLabels = acceptedLabelsByLanguage[language];
      const genusLabels = orderedParents.length > 0
        ? orderedParents.flatMap(({ parent }) => localizedParentGenusTokens(parent, language))
        : fallbackGenus
          ? [normalizeSemanticText(fallbackGenus[language])]
          : [];
      const subjectTokens = [
        normalizedLabel,
        ...(language === "en" ? [normalizeSemanticText(concept.id)] : []),
      ].filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);
      const classification = explicitClassificationMatch({
        sentence,
        subjectTokens,
        genusTokens: genusLabels,
        language,
      });
      if (!classification) {
        violations.push({
          conceptId: concept.id,
          language,
          reason: orderedParents.length > 0
            ? "missing-real-parent-genus"
            : "missing-semantic-kind-genus",
          expectedGenusConceptIds: orderedParents.map(({ parent }) => parent.id),
        });
        continue;
      }
      const sentenceWithoutGenus =
        `${sentence.slice(0, classification.genusIndex)} ` +
        sentence.slice(classification.genusIndex + classification.genusLabel.length);
      const subjectOccurrences = standaloneDisplayLabelIndexes({
        sentence: sentenceWithoutGenus,
        label: normalizedLabel,
        acceptedLabels,
        language,
      }).length;
      if (subjectOccurrences > 1) {
        violations.push({
          conceptId: concept.id,
          language,
          reason: "display-label-repeated",
          expectedGenusConceptIds: orderedParents.map(({ parent }) => parent.id),
        });
      }
      const differentia = sentenceWithoutGenus.replace(classification.subjectToken, " ");
      if (malformedDefinitionSyntax(rawSentence, language)) {
        violations.push({
          conceptId: concept.id,
          language,
          reason: "malformed-definition-syntax",
          expectedGenusConceptIds: orderedParents.map(({ parent }) => parent.id),
        });
      }
      if (!meaningfulDifferentia(differentia, language)) {
        violations.push({
          conceptId: concept.id,
          language,
          reason: "generic-differentia",
          expectedGenusConceptIds: orderedParents.map(({ parent }) => parent.id),
        });
      }
    }
  }
  return violations;
};
