import { buildConcreteAgentPositiveScenario } from "./ontology-concept-examples.mjs";

const copiedModuleClaimPattern = /reviewed Module boundary/iu;
const fallbackDistinctionClaimPattern =
  /Provides evidence for the reviewed distinction/iu;
const genericPositivePattern =
  /In an auditable agent run|In a verifiable graph fragment|occupies the (?:source|target) endpoint|satisfies the identity conditions.*participates/iu;
const positiveExampleNeedsRewrite = (description) =>
  genericPositivePattern.test(description) ||
  /while the system|During an integration build that projects an external framework or protocol into the core ontology, the system records|[.!?]”[.!?]|[。．.!?！？]”[。．.!?！？]|[。．.!?！？]」/iu.test(description);
const genericBoundaryPattern = /A related object lacks/iu;
const forbiddenOperationalNotionPattern =
  /reviewed Module boundary|Provides evidence for the reviewed distinction|documented conceptual model|ontology-specific boundary/iu;

const localized = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const objectClaimKey = ({ source_id: sourceId, locator }) =>
  `${sourceId}\0${locator}`;

const operationalNotionFor = (operationalNotions, claim) => {
  const key = objectClaimKey(claim);
  const notion = operationalNotions instanceof Map
    ? operationalNotions.get(key)
    : operationalNotions?.[key];
  if (
    typeof notion !== "string" ||
    notion.trim().length < 12 ||
    forbiddenOperationalNotionPattern.test(notion)
  ) {
    throw new Error(
      `A specific operational notion is required for direct claim ${claim.source_id} at ${claim.locator}`,
    );
  }
  return notion.trim();
};

const rewriteClaims = ({ claims, operationalNotions, supportsFor }) =>
  claims.map((claim) => ({
    ...claim,
    supports: supportsFor(claim, operationalNotionFor(operationalNotions, claim)),
  }));

const englishLabel = (record) => record.labels?.en ?? record.id;

export const rewriteConceptDirectClaims = ({
  concept,
  module,
  operationalNotions,
  primaryBackboneRelationId = null,
}) => {
  if (concept.status !== "accepted") return concept;
  const backbone = primaryBackboneRelationId ?? concept.primary_parent_relation_id ??
    `reviewed root status ${concept.root_status ?? "unspecified"}`;
  const sourceClaims = rewriteClaims({
    claims: concept.source_claims ?? [],
    operationalNotions,
    supportsFor: (claim, notion) =>
      `Source ${claim.source_id} at locator "${claim.locator}" supports the operational notion for Concept ${concept.id} (${englishLabel(concept)}): ${notion} ` +
      `The owner ${module.id}, semantic kind ${concept.semantic_kind}, and backbone placement ${backbone} are Moonweave design inference choices; the source does not assert those ontology decisions.`,
  });
  return { ...concept, source_claims: sourceClaims };
};

export const rewriteRelationDirectClaims = ({
  relation,
  sourceConcept,
  targetConcept,
  module,
  operationalNotions,
}) => {
  if (relation.status !== "accepted") return relation;
  if (
    relation.source_id !== sourceConcept.id ||
    relation.target_id !== targetConcept.id
  ) {
    throw new Error(
      `Relation ${relation.id} endpoints do not match ${sourceConcept.id} -> ${targetConcept.id}`,
    );
  }
  const definition = relation.definitions?.en?.trim();
  if (!definition) throw new Error(`Relation ${relation.id} needs an English definition`);
  const sourceClaims = rewriteClaims({
    claims: relation.source_claims ?? [],
    operationalNotions,
    supportsFor: (claim, notion) =>
      `Source ${claim.source_id} at locator "${claim.locator}" supports the operational notion for Relation ${relation.id} (${englishLabel(relation)}): ` +
      `${sourceConcept.id} —${relation.predicate}→ ${targetConcept.id} means "${definition}" ${notion} ` +
      `The canonical direction, owner ${module.id}, relation kind ${relation.relation_kind}, and layout role ${relation.layout_role} are Moonweave design inference choices; the source does not assert those ontology decisions.`,
  });
  return { ...relation, source_claims: sourceClaims };
};

const contextIdentity = (value, path) =>
  value.id ?? value.sibling_concept_id ?? value.external_identifier ?? path;

const contextStatement = (value) =>
  value.definitions?.en ??
  value.differentia?.en ??
  value.descriptions?.en ??
  value.scope?.en ??
  value.method?.en ??
  value.expression ??
  null;

const compactText = (value, maximumLength = 220) => {
  const normalized = String(value).replace(/\s+/gu, " ").trim();
  return normalized.length <= maximumLength
    ? normalized
    : `${normalized.slice(0, maximumLength - 1).trimEnd()}…`;
};

const nestedApplicationReason = (value, contextId, path) => {
  const statement = contextStatement(value);
  if (typeof statement === "string" && statement.trim().length > 0) {
    return `its reviewed statement is "${compactText(statement)}"`;
  }
  const label = value.labels?.en;
  if (typeof label === "string" && label.trim().length > 0) {
    return `the reviewed nested object is labeled "${compactText(label)}"`;
  }
  if (typeof value.kind === "string" && value.kind.trim().length > 0) {
    return `the reviewed nested object has kind "${compactText(value.kind)}"`;
  }
  return `the reviewed field at ${path} identifies ${contextId}`;
};

const displayedClaimKey = (claim) => objectClaimKey(claim).replace("\0", "::");
const endpointScopedSiblingEvidencePattern = /Sibling evidence scope:/u;

export const rewriteObjectEvidenceTree = ({ record }) => {
  if (record.status !== "accepted") return record;
  const directClaims = record.source_claims ?? [];
  if (directClaims.length === 0) {
    throw new Error(`Accepted object ${record.id} has no direct claim evidence baseline`);
  }
  for (const claim of directClaims) {
    if (
      copiedModuleClaimPattern.test(claim.supports) ||
      fallbackDistinctionClaimPattern.test(claim.supports) ||
      !claim.supports.includes(record.id)
    ) {
      throw new Error(
        `Object ${record.id} direct claims must be rewritten before its evidence tree`,
      );
    }
  }

  const visit = (value, path, root = false) => {
    if (Array.isArray(value)) {
      return value.map((item, index) => visit(item, `${path}[${index}]`));
    }
    if (!value || typeof value !== "object") return value;
    const contextId = contextIdentity(value, path);
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => {
        if (key !== "source_claims" || !Array.isArray(child)) {
          return [key, visit(child, `${path}.${key}`)];
        }
        if (root) {
          return [key, directClaims.map((claim) => ({ ...claim }))];
        }
        if (
          typeof value.sibling_concept_id === "string" &&
          child.length > 0 &&
          child.every(({ supports }) =>
            typeof supports === "string" &&
            endpointScopedSiblingEvidencePattern.test(supports))
        ) {
          return [key, child.map((claim) => ({ ...claim }))];
        }
        return [
          key,
          directClaims.map((claim) => ({
            ...claim,
            supports: path.startsWith("$.examples[")
              ? `Root object ${record.id}; nested object ${contextId} at ${path}; claim key ${displayedClaimKey(claim)}. ` +
                `Source ${claim.source_id} applies to this nested object because its exact path and object identity ` +
                `bind the claim. Moonweave contextualization of root evidence; not an additional assertion by ${claim.source_id}.`
              : `Root object ${record.id}; nested object ${contextId} at ${path}; claim key ${displayedClaimKey(claim)}. ` +
                `Source ${claim.source_id} at locator "${claim.locator}" applies to this nested object because ` +
                `${nestedApplicationReason(value, contextId, path)}. This reuse is a Moonweave contextualization ` +
                `of the root object's direct evidence, not an additional assertion made by ${claim.source_id}.`,
          })),
        ];
      }),
    );
  };

  return visit(record, "$", true);
};

const reviewerByRole = (record, role) =>
  record.review?.reviewers?.find(({ reviewer_role: reviewerRole }) => reviewerRole === role);

const reviewedLabel = (record) => englishLabel(record);

export const rewriteObjectReview = ({
  record,
  module,
  reviewedOn,
  useCase,
  ontologyInvariants,
  languageReviewerId = null,
  primaryBackboneRelationId = null,
}) => {
  const domainReviewer = reviewerByRole(record, "domain");
  const ontologyReviewer = reviewerByRole(record, "ontology");
  if (!domainReviewer || !ontologyReviewer) {
    throw new Error(`${record.id} needs distinct domain and ontology reviewer identities`);
  }
  const schemaReviewer = languageReviewerId
    ? {
        reviewer_id: languageReviewerId,
        reviewer_role: "schema",
        reviewer_kind: "automated-agent",
        reviewed_on: reviewedOn,
        decision_note: localized(
          `${record.id} 的中英日术语、标签与定义表达已分别复核，语言审查不决定 owner、kind 或父关系。`,
          `Terminology, labels, and definition wording for ${record.id} were reviewed across three languages; language review does not decide owner, kind, or parent placement.`,
          `${record.id} の中英日三言語の用語・ラベル・定義表現を個別に審査し、言語審査は owner・kind・親配置を決定しません。`,
        ),
      }
    : reviewerByRole(record, "schema") ?? null;
  const reviewerIds = [
    domainReviewer.reviewer_id,
    ontologyReviewer.reviewer_id,
    schemaReviewer?.reviewer_id,
  ].filter(Boolean);
  if (new Set(reviewerIds).size !== reviewerIds.length) {
    throw new Error(`${record.id} reuses one identity across domain, ontology, or language review`);
  }

  const isRelation = typeof record.predicate === "string";
  const parent = primaryBackboneRelationId ?? record.primary_parent_relation_id ??
    (isRelation
      ? `layout role ${record.layout_role}`
      : `reviewed root ${record.root_status ?? "unspecified"}`);
  const domain = {
    ...domainReviewer,
    reviewed_on: reviewedOn,
    decision_note: localized(
      `领域审查确认 ${record.id}（${record.labels?.zh ?? record.id}）由 ${module.id} 拥有，用于“${useCase.zh}”；领域审查不决定 semantic kind 或父关系。`,
      `Domain review confirms ${record.id} (${reviewedLabel(record)}) is owned by ${module.id} for the use case “${useCase.en}”; domain review does not decide semantic kind or parent placement.`,
      `ドメイン審査は ${record.id}（${record.labels?.ja ?? record.id}）を ${module.id} が「${useCase.ja}」用途で所有することを確認し、semantic kind や親配置は決定しません。`,
    ),
  };
  const conceptOntologyNote = localized(
    `本体审查确认 ${record.id} 的 semantic kind 为 ${record.semantic_kind}，主父或骨架为 ${parent}，并满足“${ontologyInvariants.zh}”；本体审查不决定领域用例。`,
    `Ontology review confirms ${record.id} has semantic kind ${record.semantic_kind}, primary parent or backbone ${parent}, and invariants “${ontologyInvariants.en}”; ontology review does not decide the domain use case.`,
    `本体審査は ${record.id} の semantic kind が ${record.semantic_kind}、主親または骨格が ${parent} であり、「${ontologyInvariants.ja}」を満たすことを確認し、ドメイン用途は決定しません。`,
  );
  const relationOntologyNote = localized(
    `本体审查确认 ${record.id} 的 predicate 为 ${record.predicate}，方向为 ${record.source_id} → ${record.target_id}，relation kind 为 ${record.relation_kind}，layout role 为 ${record.layout_role}，并满足“${ontologyInvariants.zh}”；本体审查不决定领域用例。`,
    `Ontology review confirms Relation ${record.id} has predicate ${record.predicate}, direction ${record.source_id} → ${record.target_id}, relation kind ${record.relation_kind}, layout role ${record.layout_role}, and invariants “${ontologyInvariants.en}”; ontology review does not decide the domain use case.`,
    `本体審査は関係 ${record.id} の predicate が ${record.predicate}、方向が ${record.source_id} → ${record.target_id}、relation kind が ${record.relation_kind}、layout role が ${record.layout_role} であり、「${ontologyInvariants.ja}」を満たすことを確認し、ドメイン用途は決定しません。`,
  );
  const ontology = {
    ...ontologyReviewer,
    reviewed_on: reviewedOn,
    decision_note: isRelation ? relationOntologyNote : conceptOntologyNote,
  };
  const preserved = (record.review?.reviewers ?? []).filter(
    ({ reviewer_role: reviewerRole }) =>
      !["domain", "ontology", "schema"].includes(reviewerRole),
  );
  return {
    ...record,
    review: {
      ...record.review,
      reviewers: [domain, ontology, ...(schemaReviewer ? [schemaReviewer] : []), ...preserved],
    },
  };
};

const incidentAcceptedRelations = ({ concept, relations, conceptById }) =>
  relations
    .filter(
      (relation) =>
        relation.status === "accepted" &&
        (relation.source_id === concept.id || relation.target_id === concept.id) &&
        conceptById.get(relation.source_id)?.status === "accepted" &&
        conceptById.get(relation.target_id)?.status === "accepted",
    )
    .sort((left, right) => {
      const leftPrimary = left.id === concept.primary_parent_relation_id ? 0 : 1;
      const rightPrimary = right.id === concept.primary_parent_relation_id ? 0 : 1;
      return leftPrimary - rightPrimary || left.id.localeCompare(right.id, "en");
    });

const rewritePositiveExample = ({ example, concept, anchor, field }) => {
  if (anchor) {
    const scenario = buildConcreteAgentPositiveScenario({
      concept,
      anchor,
      fieldValues: example.field_values ?? {},
    });
    return {
      ...example,
      descriptions: scenario.descriptions,
      related_node_ids: [anchor.source_id, anchor.target_id],
      related_relation_ids: [anchor.id],
      expected_result: scenario.expected_result,
      why_valid_or_invalid: scenario.why_valid_or_invalid,
    };
  }
  if (!field) throw new Error(`Generic positive example ${example.id} has no accepted fact or real field example_value`);
  const fieldValues = {
    ...(example.field_values ?? {}),
    [field.id]: structuredClone(field.example_value),
  };
  const scenario = buildConcreteAgentPositiveScenario({ concept, fieldValues });
  return {
    ...example,
    descriptions: scenario.descriptions,
    field_values: fieldValues,
    related_node_ids: [concept.id],
    related_relation_ids: [],
    expected_result: scenario.expected_result,
    why_valid_or_invalid: scenario.why_valid_or_invalid,
  };
};

const positiveExampleMissesFieldValues = (example) => {
  const description = example.descriptions?.en ?? "";
  return Object.values(example.field_values ?? {}).some((value) => {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return !description.includes(String(value));
    const rendered = serialized.length <= 80
      ? serialized
      : `${serialized.slice(0, 77)}...`;
    return !description.includes(rendered);
  });
};

const rewriteBoundaryExample = ({ example, concept, sibling, differentia, anchor, conceptById }) => {
  if (sibling) {
    return {
      ...example,
      descriptions: localized(
        `${sibling.id}（${sibling.labels.zh}）是已审定的兄弟对照；它不满足 ${concept.id} 的种差：“${differentia.zh}”，因此不得归类为 ${concept.labels.zh}。`,
        `${sibling.id} (${sibling.labels.en}) is the reviewed sibling contrast. It does not satisfy ${concept.id}'s differentia: “${differentia.en}”, so it must not be classified as ${concept.labels.en}.`,
        `${sibling.id}（${sibling.labels.ja}）は審査済み兄弟対照で、${concept.id} の種差「${differentia.ja}」を満たさないため ${concept.labels.ja} に分類できません。`,
      ),
      related_node_ids: [concept.id, sibling.id],
      related_relation_ids: [],
      expected_result: localized(
        `${sibling.id} 保持其兄弟类型。`,
        `${sibling.id} remains in its reviewed sibling type.`,
        `${sibling.id} は審査済み兄弟型を維持します。`,
      ),
      why_valid_or_invalid: localized(
        `明确种差而非共现决定成员资格。`,
        `The explicit differentia, not co-occurrence, determines membership.`,
        `共起ではなく明示種差が所属を決定します。`,
      ),
    };
  }
  if (!anchor) throw new Error(`Generic boundary example ${example.id} has no reviewed sibling or accepted relation contrast`);
  const otherId = anchor.source_id === concept.id ? anchor.target_id : anchor.source_id;
  const other = conceptById.get(otherId);
  return {
    ...example,
    descriptions: localized(
      `${other.id}（${other.labels.zh}）只是已接受事实 ${anchor.id} 的另一端；参与 ${anchor.predicate} 不满足 ${concept.id} 的种差“${concept.short_definitions.zh}”。`,
      `${other.id} (${other.labels.en}) is only the other endpoint of accepted fact ${anchor.id}; participation in ${anchor.predicate} does not satisfy ${concept.id}'s differentia “${concept.short_definitions.en}”.`,
      `${other.id}（${other.labels.ja}）は承認済み事実 ${anchor.id} の他端にすぎず、${anchor.predicate} への参加は ${concept.id} の種差「${concept.short_definitions.ja}」を満たしません。`,
    ),
    related_node_ids: [anchor.source_id, anchor.target_id],
    related_relation_ids: [anchor.id],
    expected_result: localized(
      `${other.id} 不被归类为 ${concept.id}。`,
      `${other.id} is not classified as ${concept.id}.`,
      `${other.id} は ${concept.id} に分類されません。`,
    ),
    why_valid_or_invalid: localized(
      `关系另一端不自动继承 ${concept.id} 的类型。`,
      `The other relation endpoint does not inherit ${concept.id}'s type.`,
      `関係の他端は ${concept.id} の型を自動継承しません。`,
    ),
  };
};

export const rewriteGenericConceptExamples = ({ concept, relations, conceptById }) => {
  if (concept.status !== "accepted") return concept;
  const incident = incidentAcceptedRelations({ concept, relations, conceptById });
  const anchor = incident[0] ?? null;
  const field = (concept.structure?.fields ?? []).find(
    ({ example_value: exampleValue }) => exampleValue !== undefined && exampleValue !== null,
  ) ?? null;
  const siblingDecision = (concept.sibling_differentiation ?? []).find(
    ({ sibling_concept_id: siblingId }) => conceptById.get(siblingId)?.status === "accepted",
  );
  const sibling = siblingDecision
    ? conceptById.get(siblingDecision.sibling_concept_id)
    : null;
  const examples = (concept.examples ?? []).map((example) => {
    if (
      example.kind === "positive" &&
      (
        positiveExampleNeedsRewrite(example.descriptions?.en ?? "") ||
        positiveExampleMissesFieldValues(example)
      )
    ) {
      return rewritePositiveExample({ example, concept, anchor, field });
    }
    if (
      ["boundary", "counterexample"].includes(example.kind) &&
      genericBoundaryPattern.test(example.descriptions?.en ?? "")
    ) {
      return rewriteBoundaryExample({
        example,
        concept,
        sibling,
        differentia: siblingDecision?.differentia,
        anchor,
        conceptById,
      });
    }
    return example;
  });
  return { ...concept, examples };
};

const hasFallbackClaim = (record) =>
  (record.source_claims ?? []).some(({ supports }) =>
    copiedModuleClaimPattern.test(supports) ||
    fallbackDistinctionClaimPattern.test(supports),
  );

const sourceClaimEntriesInTree = (value, path = "$", result = []) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      sourceClaimEntriesInTree(item, `${path}[${index}]`, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source_claims" && Array.isArray(child)) {
      result.push(...child.map((claim) => ({ claim, path, root: path === "$" })));
      continue;
    }
    sourceClaimEntriesInTree(child, `${path}.${key}`, result);
  }
  return result;
};

const isDirectObjectSpecificClaim = (record, claim) => {
  const supports = claim.supports ?? "";
  const commonParts = [
    `Source ${claim.source_id}`,
    claim.locator,
    record.id,
    englishLabel(record),
    "Moonweave design inference",
  ];
  if (!commonParts.every((part) => supports.includes(part))) return false;
  if (typeof record.predicate === "string") {
    return [record.predicate, record.source_id, record.target_id]
      .every((part) => supports.includes(part));
  }
  return [record.module_id, record.semantic_kind, "backbone"]
    .every((part) => supports.includes(part));
};

const isNestedContextualClaim = (record, claim, path) => {
  const supports = claim.supports ?? "";
  return [
    `Root object ${record.id}`,
    "nested object",
    `at ${path}`,
    `claim key ${displayedClaimKey(claim)}`,
    `Source ${claim.source_id}`,
    claim.locator,
    "applies to this nested object because",
    "Moonweave contextualization",
    "not an additional assertion",
  ].every((part) => supports.includes(part));
};

const acceptedEvidenceRecords = ({ classes, relations }) => [
  ...classes.filter(({ status }) => status === "accepted"),
  ...relations.filter(({ status }) => status === "accepted"),
];

const nestedCopiedDirectSupportCount = (records) => records.reduce((count, record) => {
  const directByKey = new Map(
    (record.source_claims ?? []).map((claim) => [objectClaimKey(claim), claim.supports]),
  );
  return count + sourceClaimEntriesInTree(record)
    .filter(({ root }) => !root)
    .filter(({ claim }) => {
      const direct = directByKey.get(objectClaimKey(claim));
      return typeof direct === "string" && claim.supports?.includes(direct);
    }).length;
}, 0);

export const objectEvidenceVolumeMetrics = ({ classes, relations }) => {
  const records = acceptedEvidenceRecords({ classes, relations });
  const entries = records.flatMap((record) =>
    sourceClaimEntriesInTree(record)
      .filter(({ root }) => !root)
      .map((entry) => ({ ...entry, record })),
  );
  const byteCounts = entries.map(({ claim }) =>
    Buffer.byteLength(claim.supports ?? "", "utf8"));
  return Object.freeze({
    nested_claim_count: entries.length,
    nested_support_bytes: byteCounts.reduce((sum, count) => sum + count, 0),
    maximum_nested_support_bytes: Math.max(0, ...byteCounts),
    nested_copied_direct_support_count: nestedCopiedDirectSupportCount(records),
  });
};

export const objectEvidenceFallbackMetrics = ({ classes, relations }) => {
  const acceptedConcepts = classes.filter(({ status }) => status === "accepted");
  const acceptedRelations = relations.filter(({ status }) => status === "accepted");
  const records = [...acceptedConcepts, ...acceptedRelations];
  const recursiveClaimEntries = records
    .flatMap((record) =>
      sourceClaimEntriesInTree(record).map((entry) => ({ ...entry, record })),
    );
  const recursiveClaims = recursiveClaimEntries.map(({ claim }) => claim);
  return Object.freeze({
    fallback_concept_claim_count: acceptedConcepts.filter(hasFallbackClaim).length,
    fallback_relation_claim_count: acceptedRelations.filter(hasFallbackClaim).length,
    copied_module_claim_count: recursiveClaims
      .filter(({ supports }) => copiedModuleClaimPattern.test(supports)).length,
    recursive_fallback_claim_count: recursiveClaims
      .filter(({ supports }) =>
        copiedModuleClaimPattern.test(supports) ||
        fallbackDistinctionClaimPattern.test(supports),
      ).length,
    recursive_non_object_specific_claim_count: recursiveClaimEntries
      .filter(({ claim, path, record, root }) =>
        root
          ? !isDirectObjectSpecificClaim(record, claim)
          : !isNestedContextualClaim(record, claim, path))
      .length,
    nested_copied_direct_support_count: nestedCopiedDirectSupportCount(records),
    nested_non_contextual_claim_count: recursiveClaimEntries
      .filter(({ claim, path, record, root }) =>
        !root && !isNestedContextualClaim(record, claim, path))
      .length,
    generic_positive_example_count: acceptedConcepts
      .flatMap(({ examples = [] }) => examples)
      .filter(
        (example) =>
          example.kind === "positive" &&
          positiveExampleNeedsRewrite(example.descriptions?.en ?? ""),
      ).length,
    generic_boundary_example_count: acceptedConcepts
      .flatMap(({ examples = [] }) => examples)
      .filter(
        (example) =>
          ["boundary", "counterexample"].includes(example.kind) &&
          genericBoundaryPattern.test(example.descriptions?.en ?? ""),
      ).length,
    same_reviewer_note_count: acceptedConcepts.filter((concept) => {
      const domain = reviewerByRole(concept, "domain")?.decision_note;
      const ontology = reviewerByRole(concept, "ontology")?.decision_note;
      return domain && ontology && JSON.stringify(domain) === JSON.stringify(ontology);
    }).length,
  });
};

export const assertObjectEvidenceQuality = (canonical) => {
  const metrics = objectEvidenceFallbackMetrics(canonical);
  const failures = Object.entries(metrics)
    .filter(([, count]) => count !== 0)
    .map(([name, count]) => `${name}=${count}`);
  if (failures.length > 0) {
    throw new Error(`Object evidence fallback gate failed: ${failures.join(", ")}`);
  }
  return metrics;
};
