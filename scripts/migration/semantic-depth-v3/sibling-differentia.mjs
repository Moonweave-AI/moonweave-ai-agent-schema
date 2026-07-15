const stableVariantIndex = (conceptId, siblingId, parentId) => {
  const key = `${conceptId}\0${siblingId}\0${parentId}`;
  const hash = [...key].reduce(
    (value, character) =>
      Math.imul(value, 31) + (character.codePointAt(0) ?? 0) >>> 0,
    2166136261,
  );
  return hash % 4;
};

const sharedIdentityContext = ({
  concept,
  sibling,
  parent,
  conceptBackboneRelationId,
  siblingBackboneRelationId,
}) => ({
  zh: `父节点 ${parent.id}：${concept.id}（semantic kind=${concept.semantic_kind}，骨架 ${conceptBackboneRelationId}）；${sibling.id}（semantic kind=${sibling.semantic_kind}，骨架 ${siblingBackboneRelationId}）`,
  en: `parent ${parent.id}: ${concept.id} (semantic kind=${concept.semantic_kind}, backbone ${conceptBackboneRelationId}); ${sibling.id} (semantic kind=${sibling.semantic_kind}, backbone ${siblingBackboneRelationId})`,
  ja: `親 ${parent.id}：${concept.id}（semantic kind=${concept.semantic_kind}、バックボーン ${conceptBackboneRelationId}）；${sibling.id}（semantic kind=${sibling.semantic_kind}、バックボーン ${siblingBackboneRelationId}）`,
});

const conditionText = (value) => value.trim().replace(/[.!?。！？]+$/u, "");

const siblingClaimKey = ({ source_id: sourceId, locator }) =>
  `${sourceId}\0${locator}`;

const displayedSiblingClaimKey = (claim) =>
  siblingClaimKey(claim).replace("\0", "::");

const compactConditionText = (value, maximumLength = 70) => {
  const normalized = conditionText(value).replace(/\s+/gu, " ");
  return normalized.length <= maximumLength
    ? normalized
    : `${normalized.slice(0, maximumLength - 1).trimEnd()}…`;
};

const endpointEvidenceClause = (endpoint) =>
  `${endpoint.id}="${compactConditionText(endpoint.short_definitions.en)}"`;

export const buildBilateralSiblingEvidenceClaims = ({
  concept,
  sibling,
  path = "$.sibling_differentiation[0]",
}) => {
  const claimsByKey = new Map();
  const register = (endpoint, claims) => {
    if (!Array.isArray(claims) || claims.length === 0) {
      throw new Error(`Sibling endpoint ${endpoint.id} has no direct evidence`);
    }
    for (const claim of claims) {
      const key = siblingClaimKey(claim);
      const existing = claimsByKey.get(key);
      claimsByKey.set(key, {
        claim: existing?.claim ?? claim,
        endpointIds: new Set([...(existing?.endpointIds ?? []), endpoint.id]),
      });
    }
  };
  register(concept, concept.source_claims);
  register(sibling, sibling.source_claims);

  const endpointById = new Map([
    [concept.id, concept],
    [sibling.id, sibling],
  ]);
  const evidenceKindRank = new Map([
    ["normative", 0],
    ["official", 1],
    ["peer-reviewed", 2],
    ["vendor", 3],
    ["design-inference", 4],
  ]);
  const confidenceRank = new Map([["high", 0], ["medium", 1], ["low", 2]]);
  const rankedEntries = [...claimsByKey.entries()].sort(
    ([leftKey, left], [rightKey, right]) =>
      (evidenceKindRank.get(left.claim.evidence_kind) ?? 9) -
        (evidenceKindRank.get(right.claim.evidence_kind) ?? 9) ||
      (confidenceRank.get(left.claim.confidence) ?? 9) -
        (confidenceRank.get(right.claim.confidence) ?? 9) ||
      leftKey.localeCompare(rightKey, "en"),
  );
  const sharedEntry = rankedEntries.find(([, { endpointIds }]) =>
    endpointIds.size === 2,
  );
  const selectedEntries = sharedEntry
    ? [sharedEntry]
    : [
        rankedEntries.find(([, { endpointIds }]) => endpointIds.has(concept.id)),
        rankedEntries.find(([, { endpointIds }]) => endpointIds.has(sibling.id)),
      ].filter(Boolean);
  if (
    selectedEntries.length === 0 ||
    ![concept.id, sibling.id].every((endpointId) =>
      selectedEntries.some(([, { endpointIds }]) => endpointIds.has(endpointId)))
  ) {
    throw new Error(`Sibling evidence does not cover ${concept.id} and ${sibling.id}`);
  }
  return selectedEntries
    .map(([, { claim, endpointIds }]) => {
      const scopedEndpointIds = [...endpointIds].sort((left, right) =>
        left.localeCompare(right, "en"),
      );
      const scope = scopedEndpointIds.length === 2
        ? `shared endpoints ${scopedEndpointIds[0]} and ${scopedEndpointIds[1]}`
        : `endpoint ${scopedEndpointIds[0]} only`;
      const endpointClauses = scopedEndpointIds
        .map((endpointId) => endpointEvidenceClause(endpointById.get(endpointId)))
        .join("; ");
      const coverageClause = scopedEndpointIds.length === 1
        ? `Evidence supports ${scopedEndpointIds[0]} only; it does not support ${scopedEndpointIds[0] === concept.id ? sibling.id : concept.id}.`
        : "Evidence independently supports both endpoints.";
      return {
        ...claim,
        supports:
          `Root object ${concept.id}; nested object ${sibling.id} at ${path}; ` +
          `claim key ${displayedSiblingClaimKey(claim)}. Source ${claim.source_id} applies to this ` +
          `nested object because the evidence is bound to the stated endpoint scope. ` +
          `Sibling evidence scope: ${scope}. Conditions: ${endpointClauses}. ${coverageClause} ` +
          `Moonweave contextualization of shared-parent/backbone placement; not an additional ` +
          `assertion by ${claim.source_id}.`,
        review_status: "accepted",
      };
    });
};

const identityConditions = ({ concept, sibling }) => ({
  zh: `${concept.id} 条件：“${conditionText(concept.short_definitions.zh)}”；${sibling.id} 条件：“${conditionText(sibling.short_definitions.zh)}”`,
  en: `${concept.id} condition: “${conditionText(concept.short_definitions.en)}”; ${sibling.id} condition: “${conditionText(sibling.short_definitions.en)}”`,
  ja: `${concept.id} の条件：「${conditionText(concept.short_definitions.ja)}」；${sibling.id} の条件：「${conditionText(sibling.short_definitions.ja)}」`,
});

export const buildBilateralSiblingDifferentia = (parameters) => {
  const { concept, sibling, parent } = parameters;
  const context = sharedIdentityContext(parameters);
  const conditions = identityConditions({ concept, sibling });
  const variant = stableVariantIndex(concept.id, sibling.id, parent.id);
  const templates = [
    {
      zh: `共享父节点对照：${context.zh}。双端条件：${conditions.zh}。逐端验证；父节点不证明任一身份。`,
      en: `Shared-parent contrast: ${context.en}. Endpoint conditions: ${conditions.en}. Verify each endpoint; the parent proves neither identity.`,
      ja: `共有親対照：${context.ja}。両端条件：${conditions.ja}。各端を検証し、親だけでは同一性を証明しません。`,
    },
    {
      zh: `端点特定对照：${context.zh}。双端条件：${conditions.zh}。条件不得互借；各自成立后方可归类。`,
      en: `Endpoint-specific contrast: ${context.en}. Endpoint conditions: ${conditions.en}. Conditions cannot be borrowed; classify each endpoint only from its own evidence.`,
      ja: `端点別対照：${context.ja}。両端条件：${conditions.ja}。条件を流用せず、各端を固有の証拠で分類します。`,
    },
    {
      zh: `正向身份比较：${context.zh}。双端条件：${conditions.zh}。仅依据各自定义与骨架逐端验证。`,
      en: `Positive identity comparison: ${context.en}. Endpoint conditions: ${conditions.en}. Verify each endpoint from its own definition and backbone.`,
      ja: `正の同一性比較：${context.ja}。両端条件：${conditions.ja}。各端を固有の定義とバックボーンで検証します。`,
    },
    {
      zh: `已审查兄弟区分：${context.zh}。双端条件：${conditions.zh}。任一条件成立不推出另一端。`,
      en: `Reviewed sibling distinction: ${context.en}. Endpoint conditions: ${conditions.en}. Either condition leaves the other unproven.`,
      ja: `審査済み兄弟区別：${context.ja}。両端条件：${conditions.ja}。一方の成立は他方を証明しません。`,
    },
  ];
  return Object.freeze({ ...templates[variant] });
};
