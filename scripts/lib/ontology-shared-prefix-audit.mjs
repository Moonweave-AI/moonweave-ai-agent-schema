const languages = Object.freeze(["zh", "en", "ja"]);

const stopWords = Object.freeze({
  id: new Set(["a", "an", "the", "of", "to", "for", "and", "or"]),
  zh: new Set(["的", "与", "和", "或", "及", "对", "从", "在"]),
  en: new Set(["a", "an", "the", "of", "to", "for", "and", "or", "in", "on"]),
  ja: new Set(["の", "と", "を", "に", "へ", "が", "で"]),
});

const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const han = /\p{Script=Han}/u;
const latinOrNumber = /[\p{Script=Latin}\p{Number}]/u;

const normalized = (value) => String(value ?? "")
  .normalize("NFKC")
  .toLocaleLowerCase("en")
  .trim();

const identifierTokens = (value) => String(value ?? "")
  .normalize("NFKC")
  .replace(/([a-z\d])([A-Z])/gu, "$1 $2")
  .replace(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2")
  .split(/[^\p{Letter}\p{Number}]+/u)
  .map((token) => token.toLocaleLowerCase("en"))
  .filter(Boolean);

const labelTokens = (value, language) => {
  const text = normalized(value);
  if (!text) return [];
  if (language === "en") {
    return text.split(/[^\p{Letter}\p{Number}]+/u).filter(Boolean);
  }
  const segmenter = new Intl.Segmenter(language, { granularity: "word" });
  return [...segmenter.segment(text)]
    .filter(({ isWordLike }) => isWordLike)
    .map(({ segment }) => normalized(segment))
    .filter(Boolean);
};

const meaningfulPrefix = (tokens, language) => tokens.some((token) => {
  if (stopWords[language].has(token)) return false;
  const size = [...token].length;
  if (cjk.test(token)) return size >= 2;
  return latinOrNumber.test(token) && size >= 3;
});

const commonTokenPrefix = (left, right) => {
  const length = Math.min(left.length, right.length);
  const result = [];
  for (let index = 0; index < length && left[index] === right[index]; index += 1) {
    result.push(left[index]);
  }
  return result;
};

const commonCjkPrefix = (leftValue, rightValue) => {
  const left = [...normalized(leftValue)];
  const right = [...normalized(rightValue)];
  const length = Math.min(left.length, right.length);
  const result = [];
  for (let index = 0; index < length && left[index] === right[index]; index += 1) {
    result.push(left[index]);
  }
  const prefix = result.join("").replace(/[\p{Punctuation}\p{Separator}]+$/gu, "");
  return han.test(prefix) && [...prefix].length >= 2 ? prefix : "";
};

const discoveryBasis = (left, right) => {
  const bases = [];
  const idPrefix = commonTokenPrefix(identifierTokens(left.id), identifierTokens(right.id));
  if (meaningfulPrefix(idPrefix, "id")) {
    bases.push({ surface: "canonical-id", prefix: idPrefix.join("-") });
  }
  for (const language of languages) {
    const prefixTokens = commonTokenPrefix(
      labelTokens(left.labels?.[language], language),
      labelTokens(right.labels?.[language], language),
    );
    const tokenPrefix = meaningfulPrefix(prefixTokens, language)
      ? prefixTokens.join(language === "en" ? " " : "")
      : "";
    const rawPrefix = language === "en"
      ? ""
      : commonCjkPrefix(left.labels?.[language], right.labels?.[language]);
    const prefix = tokenPrefix.length >= rawPrefix.length ? tokenPrefix : rawPrefix;
    if (prefix) bases.push({ surface: "label", language, prefix });
  }
  return bases;
};

const moduleAdjacencies = (modules) => {
  const result = new Set();
  const add = (left, right) => {
    if (!left || !right || left === right) return;
    result.add([left, right].sort().join("|"));
  };
  for (const module of modules) {
    for (const check of module.overlap_checks ?? []) add(module.id, check.other_module_id);
    for (const question of module.competency_questions ?? []) {
      for (const relatedId of question.related_module_ids ?? []) add(module.id, relatedId);
    }
  }
  return result;
};

const relationPairKey = (sourceId, targetId) => [sourceId, targetId].sort().join("|");

const directRelationEvidence = (left, right, relationsByPair) =>
  (relationsByPair.get(relationPairKey(left.id, right.id)) ?? [])
  .map((relation) => ({
    type: [left, right].some((concept) =>
      concept.primary_parent_relation_id === relation.id) ||
      (relation.layout_role === "primary-backbone" &&
        relationPairKey(relation.layout_child_id, relation.layout_parent_id) ===
          relationPairKey(left.id, right.id))
      ? "primary-parent-child"
      : "direct-canonical-relation",
    relation_id: relation.id,
    predicate: relation.predicate,
    source_id: relation.source_id,
    target_id: relation.target_id,
  }));

const explicitParentFromRelation = (concept, relationById) => {
  if (!concept.primary_parent_relation_id) return null;
  const relation = relationById.get(concept.primary_parent_relation_id);
  if (!relation || relation.status !== "accepted") {
    throw new Error(
      `Missing primary-parent relation ${concept.primary_parent_relation_id} for ${concept.id}`,
    );
  }
  if (relation.predicate !== "is_a" || relation.source_id !== concept.id) {
    throw new Error(
      `Primary-parent relation ${relation.id} for ${concept.id} must be canonical child-to-parent is_a`,
    );
  }
  return relation.target_id;
};

export const buildOntologyParentIndexes = ({ concepts, relations }) => {
  const relationById = new Map(relations.map((relation) => [relation.id, relation]));
  const primaryRelationByChildId = new Map();
  for (const relation of relations) {
    if (relation.status !== "accepted" || relation.layout_role !== "primary-backbone") continue;
    if (!relation.layout_child_id || !relation.layout_parent_id) {
      throw new Error(`Primary-backbone relation ${relation.id} must declare layout endpoints`);
    }
    const existing = primaryRelationByChildId.get(relation.layout_child_id);
    if (existing && existing.id !== relation.id) {
      throw new Error(
        `Multiple primary-backbone relations for ${relation.layout_child_id}: ` +
        `${existing.id}, ${relation.id}`,
      );
    }
    primaryRelationByChildId.set(relation.layout_child_id, relation);
  }
  const taxonomyEntries = concepts.map((concept) => [
    concept.id,
    explicitParentFromRelation(concept, relationById),
  ]);
  const logicalEntries = concepts.map((concept) => [
    concept.id,
    primaryRelationByChildId.get(concept.id)?.layout_parent_id ?? null,
  ]);
  return Object.freeze({
    taxonomy_parent_by_concept_id: Object.freeze(Object.fromEntries(taxonomyEntries)),
    logical_parent_by_concept_id: Object.freeze(Object.fromEntries(logicalEntries)),
  });
};

const backboneDepths = (concepts, logicalParentIndex) => {
  const conceptIds = new Set(concepts.map(({ id }) => id));
  const parentByConceptId = new Map(concepts.map((concept) => [
    concept.id,
    logicalParentIndex[concept.id] ?? null,
  ]));
  const depths = new Map();
  const depthFor = (conceptId, activePath = new Set()) => {
    if (depths.has(conceptId)) return depths.get(conceptId);
    if (activePath.has(conceptId)) {
      throw new Error(`Primary-backbone cycle while auditing shared prefixes at ${conceptId}`);
    }
    const parentId = parentByConceptId.get(conceptId);
    if (!parentId || !conceptIds.has(parentId)) {
      depths.set(conceptId, 0);
      return 0;
    }
    const nextPath = new Set(activePath);
    nextPath.add(conceptId);
    const depth = depthFor(parentId, nextPath) + 1;
    depths.set(conceptId, depth);
    return depth;
  };
  concepts.forEach(({ id }) => depthFor(id));
  return depths;
};

const sharedParentBasis = (left, right, parentIndexes) => {
  const result = [];
  const taxonomyParentId = parentIndexes.taxonomy_parent_by_concept_id[left.id] ?? null;
  if (taxonomyParentId &&
      taxonomyParentId === parentIndexes.taxonomy_parent_by_concept_id[right.id]) {
    result.push({ kind: "taxonomy", parent_id: taxonomyParentId });
  }
  const logicalParentId = parentIndexes.logical_parent_by_concept_id[left.id] ?? null;
  if (logicalParentId &&
      logicalParentId === parentIndexes.logical_parent_by_concept_id[right.id]) {
    result.push({ kind: "logical-backbone", parent_id: logicalParentId });
  }
  return result;
};

const siblingEvidence = (left, right, parentBasis) => {
  const sharedParentIds = new Set(parentBasis.map(({ parent_id: parentId }) => parentId));
  const matches = (concept, siblingId) => (concept.sibling_differentiation ?? [])
    .filter((entry) =>
      entry.sibling_concept_id === siblingId &&
      sharedParentIds.has(entry.shared_parent_concept_id));
  const leftMatching = matches(left, right.id);
  const rightMatching = matches(right, left.id);
  const matching = [...leftMatching, ...rightMatching];
  return matching.length === 0 ? [] : [{
    type: "sibling-differentiation",
    shared_parent_ids: [...new Set(matching.map((entry) =>
      entry.shared_parent_concept_id))].sort(),
    recorded_by_concept_ids: [...new Set([
      ...(leftMatching.length > 0 ? [left.id] : []),
      ...(rightMatching.length > 0 ? [right.id] : []),
    ])].sort(),
  }];
};

const splitIds = (value) => String(value ?? "").split("|").filter(Boolean);

const ledgerEvidenceForRow = (row, counterpartId) => {
  const mergeTargets = splitIds(row.merge_into_id);
  const replacementTargets = [
    ...mergeTargets,
    ...splitIds(row.split_into_ids),
  ];
  if (row.decision === "merge" && mergeTargets.length > 0) {
    return [{ type: "ledger-merge", concept_id: row.concept_id, target_ids: mergeTargets }];
  }
  if (row.decision === "deprecate" && replacementTargets.length > 0) {
    return [{
      type: "ledger-deprecate",
      concept_id: row.concept_id,
      target_ids: replacementTargets,
      counterpart_is_replacement: replacementTargets.includes(counterpartId),
    }];
  }
  if (row.decision === "convert_to_field" && row.convert_to_field_of) {
    return [{
      type: "ledger-field",
      concept_id: row.concept_id,
      target_id: row.convert_to_field_of,
      counterpart_is_owner: row.convert_to_field_of === counterpartId,
    }];
  }
  const controlledOwner = String(row.convert_to_allowed_value_of ?? "").split(".", 1)[0];
  if (row.decision === "convert_to_allowed_value" && controlledOwner) {
    return [{
      type: "ledger-controlled-value",
      concept_id: row.concept_id,
      target_id: row.convert_to_allowed_value_of,
      counterpart_is_owner: controlledOwner === counterpartId,
    }];
  }
  return [];
};

const ledgerEvidence = (left, right, rowByConceptId) => [
  ...ledgerEvidenceForRow(rowByConceptId.get(left.id) ?? {}, right.id),
  ...ledgerEvidenceForRow(rowByConceptId.get(right.id) ?? {}, left.id),
];

const evidencePriority = Object.freeze([
  "primary-parent-child",
  "sibling-differentiation",
  "direct-canonical-relation",
  "ledger-merge",
  "ledger-deprecate",
  "ledger-field",
  "ledger-controlled-value",
]);

const candidateEvidence = (
  left,
  right,
  relationsByPair,
  parentBasis,
  rowByConceptId,
) => {
  const evidence = [
    ...directRelationEvidence(left, right, relationsByPair),
    ...siblingEvidence(left, right, parentBasis),
    ...ledgerEvidence(left, right, rowByConceptId),
  ];
  return evidence.sort((a, b) =>
    evidencePriority.indexOf(a.type) - evidencePriority.indexOf(b.type) ||
    JSON.stringify(a).localeCompare(JSON.stringify(b), "en"));
};

const frozenRecord = (value) => Object.freeze(value);

const lexicalFamilies = (candidates) => {
  const byPrefix = new Map();
  for (const candidate of candidates) {
    for (const basis of candidate.discovery_basis) {
      const key = `${basis.surface}:${basis.language ?? "id"}:${basis.prefix}`;
      const current = byPrefix.get(key) ?? {
        prefix: basis.prefix,
        surface: basis.surface,
        language: basis.language ?? null,
        member_ids: new Set(),
        candidate_pair_ids: [],
        decision_types: [],
      };
      candidate.concept_ids.forEach((id) => current.member_ids.add(id));
      current.candidate_pair_ids.push(candidate.pair_id);
      current.decision_types.push(candidate.decision_type);
      byPrefix.set(key, current);
    }
  }
  return [...byPrefix.values()].map((family) => {
    const unresolvedCount = family.decision_types.filter((type) => type === "unresolved").length;
    return frozenRecord({
      prefix: family.prefix,
      surface: family.surface,
      language: family.language,
      member_ids: Object.freeze([...family.member_ids].sort()),
      candidate_pair_ids: Object.freeze([...family.candidate_pair_ids].sort()),
      unresolved_count: unresolvedCount,
      decision_status: unresolvedCount === 0 ? "decided" : "unresolved",
    });
  }).sort((left, right) =>
    `${left.surface}:${left.language}:${left.prefix}`.localeCompare(
      `${right.surface}:${right.language}:${right.prefix}`,
      "en",
    ));
};

export const buildSharedPrefixAudit = ({ concepts, modules, relations, ledgerRows }) => {
  const relevantConcepts = concepts
    .filter(({ status }) => status === "accepted" || status === "deprecated")
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
  const adjacentModules = moduleAdjacencies(modules);
  const acceptedRelations = relations.filter(({ status }) => status === "accepted");
  const relationsByPair = new Map();
  for (const relation of acceptedRelations) {
    const key = relationPairKey(relation.source_id, relation.target_id);
    relationsByPair.set(key, [...(relationsByPair.get(key) ?? []), relation]);
  }
  const parentIndexes = buildOntologyParentIndexes({ concepts: relevantConcepts, relations });
  const depths = backboneDepths(
    relevantConcepts,
    parentIndexes.logical_parent_by_concept_id,
  );
  const rowByConceptId = new Map(ledgerRows.map((row) => [row.concept_id, row]));
  const candidates = [];
  for (let leftIndex = 0; leftIndex < relevantConcepts.length; leftIndex += 1) {
    const left = relevantConcepts[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < relevantConcepts.length; rightIndex += 1) {
      const right = relevantConcepts[rightIndex];
      if (left.status === "deprecated" && right.status === "deprecated") continue;
      const sameModule = left.module_id === right.module_id;
      const adjacent = adjacentModules.has([left.module_id, right.module_id].sort().join("|"));
      if (!sameModule && !adjacent) continue;
      const bases = discoveryBasis(left, right);
      if (bases.length === 0) continue;
      const parentBasis = sharedParentBasis(left, right, parentIndexes);
      const evidence = candidateEvidence(
        left,
        right,
        relationsByPair,
        parentBasis,
        rowByConceptId,
      );
      const evidenceTypes = new Set(evidence.map(({ type }) => type));
      const directlyRelated = evidenceTypes.has("primary-parent-child") ||
        evidenceTypes.has("direct-canonical-relation");
      const hasTerminalLedgerDecision = [...evidenceTypes].some((type) =>
        type.startsWith("ledger-"));
      if (!directlyRelated && !hasTerminalLedgerDecision && parentBasis.length === 0) continue;
      const parentKinds = new Set(parentBasis.map(({ kind }) => kind));
      const peerBasis = directlyRelated
        ? "directly-related"
        : hasTerminalLedgerDecision
          ? "terminal-ledger-decision"
          : parentKinds.size === 2
            ? "same-taxonomy-and-logical-parent"
            : parentKinds.has("logical-backbone")
              ? "same-logical-parent"
              : "same-taxonomy-parent";
      const decisionType = evidence[0]?.type ?? "unresolved";
      candidates.push(frozenRecord({
        pair_id: `${left.id}|${right.id}`,
        concept_ids: Object.freeze([left.id, right.id]),
        module_ids: Object.freeze([...new Set([left.module_id, right.module_id])].sort()),
        scope: sameModule ? "same-module" : "adjacent-module",
        peer_basis: peerBasis,
        shared_parent_basis: Object.freeze(parentBasis.map(frozenRecord)),
        logical_depths: frozenRecord({ [left.id]: depths.get(left.id), [right.id]: depths.get(right.id) }),
        discovery_basis: Object.freeze(bases.map(frozenRecord)),
        decision_evidence: Object.freeze(evidence.map(frozenRecord)),
        decision_type: decisionType,
        decision_status: evidence.length > 0 ? "decided" : "unresolved",
      }));
    }
  }
  const decisionCounts = Object.fromEntries(
    [...evidencePriority, "unresolved"].map((type) => [
      type,
      candidates.filter(({ decision_type: candidateType }) => candidateType === type).length,
    ]),
  );
  const unresolvedCount = decisionCounts.unresolved;
  return frozenRecord({
    discovery_contract: frozenRecord({
      surfaces: Object.freeze(["canonical-id", "label:zh", "label:en", "label:ja"]),
      scope: "same-module-or-reviewed-adjacent-module",
      peer_rule: "same taxonomy parent, same logical-backbone parent, direct canonical relation, or terminal ledger disposition",
      parent_resolution: "taxonomy and logical-backbone parent indexes remain separate and are both audited",
      minimum_prefix: "two CJK code points or one non-stopword Latin token of three characters",
    }),
    candidate_count: candidates.length,
    decision_counts: frozenRecord(decisionCounts),
    unresolved_count: unresolvedCount,
    candidates: Object.freeze(candidates),
    lexical_families: Object.freeze(lexicalFamilies(candidates)),
  });
};

export const assertSharedPrefixAuditResolved = (audit) => {
  if (audit.unresolved_count === 0) return audit;
  const summary = audit.candidates
    .filter(({ decision_status }) => decision_status === "unresolved")
    .map(({ concept_ids, discovery_basis }) =>
      `${concept_ids.join(" <> ")} [${discovery_basis.map(({ surface, language, prefix }) =>
        `${surface}${language ? `:${language}` : ""}=${prefix}`).join(", ")}]`)
    .join("; ");
  throw new Error(
    `Shared-prefix audit found ${audit.unresolved_count} unresolved candidate pairs: ${summary}`,
  );
};
