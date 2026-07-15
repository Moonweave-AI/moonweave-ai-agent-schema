/**
 * FROZEN HISTORICAL REPLAY ONLY.
 *
 * This one-time v1 -> v2 reconstruction is not part of the source-first build
 * or release path. ontology/source/** is authoritative after cutover. Writing
 * historical replay output requires the explicit --legacy-replay flag.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { parseCsv } from "./lib/csv.mjs";
import {
  attachConvertedControlledValue,
  attachConvertedField,
  conceptLocalFieldId,
  migrateLegacyAdapterMappings,
  migrateLegacyDataProperties,
  migrateLegacyIndividuals,
  populateRequiredConceptExampleFields,
  reviewedConceptDefinitions,
} from "./lib/ontology-legacy-migration.mjs";
import {
  acceptedConcept,
  acceptedRelation,
  acceptedReview,
  claimsFor,
  localized,
  positiveAndBoundaryExamples,
  sourceLocatorFor,
  versionIri,
} from "./lib/ontology-migration-factories.mjs";
import { validateOntologyDecisionBundles } from "./lib/ontology-decision-validation.mjs";
import { addStructuredInstanceExamples, applyReviewedStructurePatches, applyReviewedSubtypeDiscriminators, reviewedStructurePatchesForHistoricalReplay } from "./lib/ontology-reviewed-structures.mjs";
import { applyReviewedAdapterMappings } from "./lib/ontology-reviewed-adapter-mappings.mjs";
import {
  HISTORICAL_REPLAY_DISTINCT_FACT_GROUPS,
  REVIEWED_DISTINCT_FACT_GROUPS,
  convergeReviewedRelations,
} from "./lib/ontology-reviewed-relations.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(repositoryRoot, "ontology/source");
const decisionRoot = resolve(repositoryRoot, "ontology/migration/legacy-v1/domain-decisions");
const frozenLegacyRoot = resolve(repositoryRoot, "ontology/migration/legacy-v1/frozen-release");
const expectedLegacyHash = "344b64a3cb2a2e14eefbfc499be6989f4944ec4d4757fc7e7738c1795bd2d91c";
const expectedFreezeManifestHash = "438484fc4d0ab4b3e76c60c186e164a30d3b448ce7b0504a0460577e3265d388";
const expectedRecordManifestHash = "fdff8b0e158346c195a5de11345b1a66931eb8369c4d2fb7a7756dae64e9c61e";
const arguments_ = process.argv.slice(2);
const checkOnly = arguments_.length === 1 && arguments_[0] === "--check";
const legacyReplay = arguments_.length === 1 && arguments_[0] === "--legacy-replay";
if (!checkOnly && !legacyReplay) {
  if (arguments_.length === 0) {
    throw new Error(
      "Historical reviewed migration replay is disabled by default; use --legacy-replay explicitly or run the source-first legacy audit.",
    );
  }
  throw new Error(`Unknown argument: ${arguments_.join(" ")}`);
}

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const listJsonFiles = (root) =>
  readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory() ? listJsonFiles(path) : entry.name.endsWith(".json") ? [path] : [];
    })
    .sort((left, right) => left.localeCompare(right));

const legacyCanonicalPath = resolve(frozenLegacyRoot, "ontology/agent-ontology.json");
const freezeManifestPath = resolve(frozenLegacyRoot, "freeze-manifest.json");
const freezeManifestBytes = readFileSync(freezeManifestPath);
if (sha256(freezeManifestBytes) !== expectedFreezeManifestHash) {
  throw new Error("The frozen release manifest changed from its independently reviewed SHA-256 anchor.");
}
const freezeManifest = JSON.parse(freezeManifestBytes.toString("utf8"));
for (const artifact of freezeManifest.artifacts) {
  const artifactPath = resolve(frozenLegacyRoot, artifact.path);
  const actualHash = sha256(readFileSync(artifactPath));
  if (actualHash !== artifact.sha256) {
    throw new Error(
      `Frozen legacy artifact ${artifact.path} changed: expected ${artifact.sha256}, received ${actualHash}`,
    );
  }
}
const legacyBytes = readFileSync(legacyCanonicalPath);
if (sha256(legacyBytes) !== expectedLegacyHash) {
  throw new Error(
    "The reviewed migration can run only against the frozen v1 canonical baseline; its SHA-256 changed.",
  );
}
const legacy = JSON.parse(legacyBytes.toString("utf8"));
const definitionLedger = readJson(resolve(frozenLegacyRoot, "ontology/agent-ontology-definitions.json"));
const registryRows = parseCsv(readFileSync(resolve(repositoryRoot, "research/source-registry.csv")));
const sourceRegistryById = new Map(registryRows.map((row) => [row.id, row]));
const withoutLegacySemanticBoilerplate = (value) => {
  if (typeof value === "string") {
    return value
      .replace(/\s*所属平面：[^。]+。?/gu, "")
      .replace(/\s*证据源\s*\d+\s*项。?/gu, "")
      .replace(/\s*出典\s*\d+\s*件。?/gu, "")
      .replace(/\s*它聚合\s*\d+\s*个类。?/gu, "")
      .replace(/\s*\d+\s*個のクラスを束ねます。?/gu, "")
      .trim();
  }
  if (Array.isArray(value)) return value.map(withoutLegacySemanticBoilerplate);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, withoutLegacySemanticBoilerplate(child)]),
  );
};
const withDirectSourceLocators = (value) => {
  if (Array.isArray(value)) return value.map(withDirectSourceLocators);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      key === "source_claims" && Array.isArray(child)
        ? child.map((claim) => {
            const source = sourceRegistryById.get(claim.source_id);
            if (!source?.url) {
              throw new Error(`Source claim ${claim.source_id} has no direct registry URL`);
            }
            return { ...claim, locator: sourceLocatorFor(source) };
          })
        : withDirectSourceLocators(child),
    ]),
  );
};
const compressSourceClaims = (value) => {
  if (Array.isArray(value)) return value.map(compressSourceClaims);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (key !== "source_claims" || !Array.isArray(child)) {
        return [key, compressSourceClaims(child)];
      }
      const claimsByEvidence = new Map();
      for (const claim of child) {
        const evidenceKey = [claim.source_id, claim.locator, claim.evidence_kind].join("\0");
        if (!claimsByEvidence.has(evidenceKey)) claimsByEvidence.set(evidenceKey, claim);
      }
      const claims = [...claimsByEvidence.values()]
        .sort((left, right) => {
          const sourcePriority = (claim) =>
            /^(eng-(?:proto|ont|state|val)|lit-val)-/u.test(claim.source_id) ? 0 : 1;
          return sourcePriority(left) - sourcePriority(right) ||
            left.source_id.localeCompare(right.source_id);
        });
      const nestedExplanatoryRecord =
        Object.hasOwn(value, "kind") ||
        Object.hasOwn(value, "query") ||
        Object.hasOwn(value, "datatype") ||
        Object.hasOwn(value, "value") ||
        (Object.hasOwn(value, "direction") && !Object.hasOwn(value, "relation_kind"));
      const maximum = nestedExplanatoryRecord ? 1 : 2;
      return [key, claims.slice(0, maximum)];
    }),
  );
};
const normalizeControlledReleaseDates = (value, releaseDate) => {
  if (Array.isArray(value)) {
    return value.map((child) => normalizeControlledReleaseDates(child, releaseDate));
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (key === "reviewed_on" && typeof child === "string" && child > releaseDate) {
        return [key, releaseDate];
      }
      if (typeof child === "string" && child.startsWith("2026-07-13T")) {
        return [key, child.replace("2026-07-13T", `${releaseDate}T`)];
      }
      if (typeof child === "string" && child.startsWith("2026-07-13.")) {
        return [key, child.replace("2026-07-13.", `${releaseDate}.`)];
      }
      return [key, normalizeControlledReleaseDates(child, releaseDate)];
    }),
  );
};
const legacyConceptById = new Map(legacy.classes.map((concept) => [concept.id, concept]));
const legacyModuleById = new Map(legacy.modules.map((module) => [module.id, module]));
const legacyPlaneById = new Map(legacy.planes.map((plane) => [plane.id, plane]));

const sourceFiles = listJsonFiles(sourceRoot).map((path) => ({ path, value: readJson(path) }));
const productEntry = sourceFiles.find(({ value }) => value.source_kind === "agent-ontology-product");
const currentModuleEntries = sourceFiles.filter(({ value }) => value.source_kind === "agent-ontology-module");
const legacyModuleEntries = currentModuleEntries.filter(({ value }) => legacyModuleById.has(value.module.id));
if (!productEntry || legacyModuleEntries.length !== legacy.modules.length) {
  throw new Error(
    `Expected one product source and exactly-once coverage of every frozen v1 Module source; found ${Boolean(productEntry)}/${legacyModuleEntries.length} of ${legacy.modules.length}`,
  );
}
const moduleEntryById = new Map(legacyModuleEntries.map((entry) => [entry.value.module.id, entry]));

const decisionBundles = listJsonFiles(decisionRoot).map(readJson);
validateOntologyDecisionBundles({
  legacy,
  bundles: decisionBundles,
  sourceIds: registryRows.map(({ id }) => id),
});
const conceptDecisions = decisionBundles.flatMap((bundle) =>
  bundle.concept_decisions.map((decision) => ({
    ...decision,
    reviewer: bundle.reviewer,
  })),
);
const anchors = decisionBundles.flatMap((bundle) =>
  bundle.new_anchors.map((anchor) => ({ ...anchor, reviewer: bundle.reviewer })),
);
const moduleDecisions = decisionBundles.flatMap((bundle) =>
  bundle.modules.map((module) => ({ ...module, reviewer: bundle.reviewer })),
);
const decisionByConceptId = new Map(conceptDecisions.map((decision) => [decision.concept_id, decision]));
if (conceptDecisions.length !== 572 || decisionByConceptId.size !== 572) {
  throw new Error(
    `Reviewed domain decisions must cover 572 unique legacy Concepts; found ${conceptDecisions.length}/${decisionByConceptId.size}`,
  );
}
const missingDecisions = legacy.classes.filter(({ id }) => !decisionByConceptId.has(id));
if (missingDecisions.length > 0) {
  throw new Error(`Missing Concept decisions: ${missingDecisions.map(({ id }) => id).join(", ")}`);
}
const frozenModuleCount = legacy.modules.length;
if (
  moduleDecisions.length !== frozenModuleCount ||
  new Set(moduleDecisions.map(({ module_id: id }) => id)).size !== frozenModuleCount
) {
  throw new Error(`Reviewed v1 Module decisions must cover all ${frozenModuleCount} frozen Modules exactly once`);
}
const moduleDecisionById = new Map(moduleDecisions.map((decision) => [decision.module_id, decision]));

const removedDecisions = new Set([
  "convert_to_field",
  "convert_to_controlled_value",
  "merge",
  "remove_invalid",
]);
const retainedDecisions = conceptDecisions.filter(({ decision }) => !removedDecisions.has(decision));
const anchorIds = new Set(anchors.map(({ id }) => id));
if (anchorIds.size !== anchors.length) throw new Error("New anchor IDs are not unique");
for (const id of anchorIds) {
  if (legacyConceptById.has(id)) throw new Error(`New anchor ${id} collides with a legacy Concept`);
}

const labelsById = new Map();
for (const decision of retainedDecisions) {
  const sourceConcept = currentModuleEntries
    .flatMap(({ value }) => value.classes)
    .find(({ id }) => id === decision.concept_id);
  const labels = decision.labels ?? sourceConcept?.labels;
  if (!labels || [labels.zh, labels.en, labels.ja].some((text) => !text?.trim())) {
    throw new Error(`Reviewed Concept ${decision.concept_id} lacks complete zh/en/ja labels`);
  }
  labelsById.set(decision.concept_id, labels);
}
anchors.forEach((anchor) => labelsById.set(anchor.id, anchor.labels));

const finalIds = new Set([...retainedDecisions.map(({ concept_id: id }) => id), ...anchorIds]);
const parentIdsByConcept = new Map();
for (const decision of retainedDecisions) {
  parentIdsByConcept.set(
    decision.concept_id,
    [decision.primary_parent_id, ...(decision.additional_parent_ids ?? [])].filter(Boolean),
  );
}
anchors.forEach((anchor) => parentIdsByConcept.set(anchor.id, anchor.parent_ids ?? []));
for (const [conceptId, parentIds] of parentIdsByConcept) {
  for (const parentId of parentIds) {
    if (!finalIds.has(parentId)) {
      throw new Error(`Reviewed parent ${parentId} of ${conceptId} is not a retained or new Concept`);
    }
  }
}

const sourceIdsByConcept = new Map();
retainedDecisions.forEach(({ concept_id: id }) =>
  sourceIdsByConcept.set(id, legacyConceptById.get(id).source_ids),
);
anchors.forEach((anchor) => sourceIdsByConcept.set(anchor.id, anchor.source_ids));
const moduleIdByConcept = new Map();
retainedDecisions.forEach((decision) =>
  moduleIdByConcept.set(decision.concept_id, decision.target_module_id),
);
anchors.forEach((anchor) => moduleIdByConcept.set(anchor.id, anchor.module_id));
const rationaleByConceptId = new Map([
  ...retainedDecisions.map((decision) => [decision.concept_id, decision.rationale]),
  ...anchors.map((anchor) => [anchor.id, anchor.rationale]),
]);

const primaryRelationId = (childId, parentId) =>
  parentId ? `${childId}-is_a-${parentId}` : null;
let concepts = [];
for (const decision of retainedDecisions) {
  const legacyConcept = legacyConceptById.get(decision.concept_id);
  const primaryParentId = decision.primary_parent_id ?? null;
  let concept = acceptedConcept({
    base: {
      id: decision.concept_id,
      module_id: decision.target_module_id,
      definitions: reviewedConceptDefinitions({
        decision,
        legacyDefinitions: legacyConcept.definitions,
      }),
    },
    labels: labelsById.get(decision.concept_id),
    semanticKind: decision.semantic_kind,
    primaryParentRelationId: primaryRelationId(decision.concept_id, primaryParentId),
    parentLabels: primaryParentId ? labelsById.get(primaryParentId) : null,
    rationale: decision.rationale,
    sourceIds: legacyConcept.source_ids,
    sourceRegistryById,
    reviewer: decision.reviewer,
    applicability: decision.target_module_id.startsWith("adapter-") ? ["adapter"] : ["core"],
  });
  if (decision.decision === "deprecate") {
    concept = {
      ...concept,
      status: "deprecated",
      deprecated_in: versionIri,
      replaced_by_ids: decision.target_concept_id ? [decision.target_concept_id] : [],
      deprecation_reason: decision.rationale,
    };
  }
  concepts.push(concept);
}
for (const anchor of anchors) {
  const primaryParentId = anchor.parent_ids[0] ?? null;
  concepts.push(
    acceptedConcept({
      base: {
        id: anchor.id,
        module_id: anchor.module_id,
        short_definitions: anchor.short_definitions,
        definitions: anchor.definitions,
        why_needed: anchor.why_needed,
        includes: anchor.includes,
        excludes: anchor.excludes,
      },
      labels: anchor.labels,
      semanticKind: anchor.semantic_kind,
      primaryParentRelationId: primaryRelationId(anchor.id, primaryParentId),
      parentLabels: primaryParentId ? labelsById.get(primaryParentId) : null,
      rationale: anchor.rationale,
      sourceIds: anchor.source_ids,
      sourceRegistryById,
      reviewer: anchor.reviewer,
      applicability: anchor.module_id.startsWith("adapter-") ? ["adapter"] : ["core"],
    }),
  );
}

for (const decision of conceptDecisions) {
  const frozenConcept = legacyConceptById.get(decision.concept_id);
  const legacyConcept = {
    ...frozenConcept,
    labels: decision.labels,
    source_ids: frozenConcept.source_ids,
  };
  if (decision.decision === "convert_to_field") {
    concepts = attachConvertedField({ concepts, decision, legacyConcept, sourceRegistryById });
  }
  if (decision.decision === "convert_to_controlled_value") {
    concepts = attachConvertedControlledValue({ concepts, decision, legacyConcept, sourceRegistryById });
  }
}

const conceptById = () => new Map(concepts.map((concept) => [concept.id, concept]));
const planeByModuleId = new Map(legacy.modules.map((module) => [module.id, module.plane_id]));
const boundaryContextFor = (sourceId, targetId, relationKind) => {
  if (relationKind === "hierarchy") return null;
  const sourcePlane = planeByModuleId.get(moduleIdByConcept.get(sourceId));
  const targetPlane = planeByModuleId.get(moduleIdByConcept.get(targetId));
  if (sourcePlane === targetPlane) return null;
  if (!finalIds.has("TrustBoundary")) {
    throw new Error(`Cross-Domain relation ${sourceId} -> ${targetId} requires retained TrustBoundary`);
  }
  const defaultContext = {
    trust_boundary_concept_id: "TrustBoundary",
    authority_basis: localized(
      "该关系跨越本体领域边界；运行时是否跨越信任边界仍须由具体策略决定。",
      "The relation crosses ontology Domain ownership; a concrete policy still decides whether a runtime trust boundary is crossed.",
      "この関係は本体ドメインの所有境界を越えます。実行時の信頼境界通過は具体的ポリシーが判断します。",
    ),
    protocol_or_resource_context: localized(
      "端点通过 canonical ID 引用，绝不复制跨域概念。",
      "Endpoints use canonical ID references and never duplicate a cross-Domain Concept.",
      "端点は canonical ID で参照され、ドメイン横断概念を複製しません。",
    ),
  };
  return {
    ...defaultContext,
    authority_basis: localized(
      `${sourceId} 仍由 ${sourcePlane} 拥有，${targetId} 仍由 ${targetPlane} 拥有；该 ${relationKind} 事实只建立跨域依赖，不转移规范所有权。运行时授权必须由具体 PolicyDecision、AuthorizationGrant 或协议会话证明。`,
      `${sourceId} remains owned by ${sourcePlane} and ${targetId} by ${targetPlane}; this ${relationKind} fact establishes a cross-Domain dependency without transferring canonical ownership. Runtime authority must be evidenced by a concrete PolicyDecision, AuthorizationGrant, or protocol session.`,
      `${sourceId} は ${sourcePlane}、${targetId} は ${targetPlane} に引き続き所有されます。この ${relationKind} 事実は正規所有権を移さずドメイン横断依存だけを表し、実行時権限には具体的な PolicyDecision、AuthorizationGrant、またはプロトコルセッションの証拠が必要です。`,
    ),
    protocol_or_resource_context: localized(
      `查询必须沿 ${sourceId} → ${targetId} 的 canonical ID 与该关系自身的来源主张执行；协议版本、资源标识和信任判定保留在两端节点的信息合同中。`,
      `Queries follow the canonical ${sourceId} → ${targetId} assertion and this relation's own source claims; protocol version, resource identity, and trust decisions remain in the endpoint information contracts.`,
      `問い合わせは ${sourceId} → ${targetId} の canonical ID と当該関係固有の出典主張に従います。プロトコル版、資源識別、信頼判断は両端ノードの情報契約に保持されます。`,
    ),
  };
};

const relationSources = (sourceId, targetId) =>
  [...new Set([...(sourceIdsByConcept.get(sourceId) ?? []), ...(sourceIdsByConcept.get(targetId) ?? [])])].slice(0, 3);
const ontologyReviewer = {
  reviewer_id: "codex-hierarchy-ontology-reviewer",
  reviewer_role: "ontology",
  reviewer_kind: "automated-agent",
  reviewed_on: "2026-07-13",
};
let relations = [];
for (const [childId, parentIds] of parentIdsByConcept) {
  for (const parentId of parentIds) {
    const childLabels = labelsById.get(childId);
    const parentLabels = labelsById.get(parentId);
    const differentia = rationaleByConceptId.get(childId);
    const hierarchyDefinitions = localized(
      `${childLabels.zh} 是一种 ${parentLabels.zh}。区分特征：${differentia.zh}`,
      `${childLabels.en} is a kind of ${parentLabels.en}. Reviewed differentia: ${differentia.en}`,
      `${childLabels.ja} は ${parentLabels.ja} の一種です。審査済みの種差：${differentia.ja}`,
    );
    const relationId = `${childId}-is_a-${parentId}`;
    relations.push(
      acceptedRelation({
        id: relationId,
        predicate: "is_a",
        sourceId: childId,
        targetId: parentId,
        relationKind: "hierarchy",
        legacyTemplateDefinitions: localized(
          `${childLabels.zh}是一种${parentLabels.zh}，并增加了经审查的区分特征。`,
          `${childLabels.en} is a kind of ${parentLabels.en} with an accepted differentia.`,
          `${childLabels.ja}は、レビュー済みの種差を加えた${parentLabels.ja}の一種です。`,
        ),
        definitions: hierarchyDefinitions,
        sourceIds: relationSources(childId, parentId),
        sourceRegistryById,
        reviewer: ontologyReviewer,
        rationale: localized(
          "七问审查确认该边表达严格的具体到一般专业化，而非组成、时序或使用关系。",
          "The seven-question review confirmed strict specific-to-general specialization rather than composition, sequence, or use.",
          "七問レビューにより、構成・順序・利用ではなく厳密な具体から一般への特殊化であることを確認しました。",
        ),
      }),
    );
  }
}

const placeholderRelation = (relation) =>
  ["module_composition", "module_event", "module_relation"].includes(relation.family) ||
  /_(?:contains|relates|emits_event)$/u.test(relation.id);
const relationKindForFamily = (family) => {
  if (/composition|chunking|envelope|modality/u.test(family)) return "composition";
  if (/temporal|lifecycle/u.test(family)) return "temporal";
  if (/adapter|mapping|schema/u.test(family)) return "mapping";
  if (/permission|trust|safety|governance|commit/u.test(family)) return "governance";
  if (/flow|execution|feedback|event/u.test(family)) return "causal";
  return "information";
};
const resolveLegacyEndpoint = (id) => {
  if (finalIds.has(id)) return id;
  const decision = decisionByConceptId.get(id);
  if (decision?.decision === "merge") return decision.target_concept_id;
  return null;
};
const relationDisposition = new Map();
const usedRelationIds = new Set(relations.map(({ id }) => id));
const factKeys = new Set(relations.map((relation) => `${relation.source_id}\0${relation.predicate}\0${relation.target_id}`));
const legacyRelationReviewer = {
  reviewer_id: "codex-legacy-relation-reviewer",
  reviewer_role: "ontology",
  reviewer_kind: "automated-agent",
  reviewed_on: "2026-07-13",
};
for (const legacyRelation of legacy.relations) {
  const sourceId = resolveLegacyEndpoint(legacyRelation.domain);
  const targetId = resolveLegacyEndpoint(legacyRelation.range);
  const factKey = `${sourceId}\0${legacyRelation.id}\0${targetId}`;
  if (
    placeholderRelation(legacyRelation) ||
    legacyRelation.family === "taxonomy" ||
    !sourceId ||
    !targetId ||
    sourceId === targetId ||
    usedRelationIds.has(legacyRelation.id) ||
    factKeys.has(factKey)
  ) {
    relationDisposition.set(legacyRelation.id, {
      action: placeholderRelation(legacyRelation)
        ? "remove_generated_placeholder"
        : "retire_after_endpoint_or_semantic_review",
      target_relation_id: "",
    });
    continue;
  }
  const relationKind = relationKindForFamily(legacyRelation.family);
  relations.push(
    acceptedRelation({
      id: legacyRelation.id,
      predicate: legacyRelation.id,
      sourceId,
      targetId,
      relationKind,
      definitions: legacyRelation.definitions,
      sourceIds: legacyRelation.source_ids,
      sourceRegistryById,
      reviewer: legacyRelationReviewer,
      rationale: localized(
        "该旧关系通过了端点、方向、来源与非占位语义审查，并迁入唯一 canonical 关系集合。",
        "The legacy relation passed endpoint, direction, evidence, and non-placeholder semantic review and was migrated into the sole canonical relation set.",
        "旧関係は端点、方向、出典、非プレースホルダー意味のレビューを通過し、唯一の canonical 関係集合へ移行されました。",
      ),
      boundaryContext: boundaryContextFor(sourceId, targetId, relationKind),
    }),
  );
  usedRelationIds.add(legacyRelation.id);
  factKeys.add(factKey);
  relationDisposition.set(legacyRelation.id, {
    action: "migrate_reviewed_relation",
    target_relation_id: legacyRelation.id,
  });
}

for (const moduleDecision of moduleDecisions) {
  for (const relation of moduleDecision.semantic_relations ?? []) {
    if (!finalIds.has(relation.source_id) || !finalIds.has(relation.target_id)) {
      throw new Error(`Reviewed semantic relation has missing endpoint: ${relation.source_id} -> ${relation.target_id}`);
    }
    const id = `${relation.source_id}-${relation.predicate}-${relation.target_id}`;
    const factKey = `${relation.source_id}\0${relation.predicate}\0${relation.target_id}`;
    if (factKeys.has(factKey)) continue;
    if (usedRelationIds.has(id)) throw new Error(`Reviewed relation ID collision: ${id}`);
    relations.push(
      acceptedRelation({
        id,
        predicate: relation.predicate,
        sourceId: relation.source_id,
        targetId: relation.target_id,
        relationKind: relation.relation_kind,
        definitions: relation.rationale,
        sourceIds: relationSources(relation.source_id, relation.target_id),
        sourceRegistryById,
        reviewer: moduleDecision.reviewer,
        rationale: relation.rationale,
        boundaryContext: boundaryContextFor(
          relation.source_id,
          relation.target_id,
          relation.relation_kind,
        ),
      }),
    );
    usedRelationIds.add(id);
    factKeys.add(factKey);
  }
}

// The migration review identified fourteen otherwise isolated accepted Concepts. These facts
// are direct consequences of their reviewed definitions and decision rationales; they close
// the graph without inventing a parent merely to add depth.
const reviewedIsolationClosureSpecs = [
  ["info-messages-instructions", "ContextPackage", "contains", "FewShotExample", "上下文包可把少样本示例作为有来源的上下文信息纳入。", "A ContextPackage can contain a FewShotExample as provenance-bearing context information.", "ContextPackage は FewShotExample を来歴付き文脈情報として含められます。", "composition"],
  ["memory-ingestion", "FileSystem", "hosts", "DirectoryResource", "文件系统承载目录资源，但文件系统表面本身不等同于被摄取资源。", "A FileSystem hosts DirectoryResource objects without being identical to the ingested resource.", "FileSystem は DirectoryResource を保持しますが、取り込み対象そのものとは同一ではありません。", "composition"],
  ["memory-ingestion", "StorageArea", "stores", "FileResource", "存储区域为文件资源提供受策略约束的存放表面。", "A StorageArea stores FileResource objects on a policy-bounded storage surface.", "StorageArea は方針で境界付けられた保存面に FileResource を格納します。", "composition"],
  ["orchestration-actors-delegation", "DelegationContract", "bounds", "SubagentContext", "委托合同界定子智能体可见上下文，而不复制上下文内容。", "A DelegationContract bounds the context visible to a subagent without copying its content.", "DelegationContract は内容を複製せずサブエージェント可視文脈を境界付けます。", "governance"],
  ["orchestration-actors-delegation", "WorkerSelection", "evaluates", "WorkerAvailability", "工作者选择评估带时间的可用性记录。", "WorkerSelection evaluates the time-bearing WorkerAvailability record.", "WorkerSelection は時点付き WorkerAvailability 記録を評価します。", "information"],
  ["runtime-system", "ProcessHandle", "correlates", "RunAttempt", "进程句柄把操作系统进程引用关联到一次执行尝试。", "A ProcessHandle correlates an operating-system process reference with a RunAttempt.", "ProcessHandle は OS プロセス参照を RunAttempt と相関付けます。", "information"],
  ["safety-injection-defense", "ResourceContentPoisoning", "affects", "PoisonedContent", "资源内容投毒事件指向受影响内容，不把事件误作内容子类。", "A ResourceContentPoisoning event points to affected PoisonedContent instead of becoming a content subtype.", "ResourceContentPoisoning 事象は影響対象 PoisonedContent を指し、内容下位型にはなりません。", "causal"],
  ["safety-injection-defense", "ToolSchemaPoisoning", "affects", "PoisonedContent", "工具 Schema 投毒事件指向受影响内容，不把变更过程误作内容。", "A ToolSchemaPoisoning event points to affected PoisonedContent rather than treating the change process as content.", "ToolSchemaPoisoning 事象は影響対象 PoisonedContent を指し、変更過程を内容として扱いません。", "causal"],
  ["safety-injection-defense", "PatternScan", "scans", "UntrustedInstructionCandidate", "模式扫描在接受前检查未受信指令候选。", "PatternScan checks an UntrustedInstructionCandidate before acceptance.", "PatternScan は受理前に UntrustedInstructionCandidate を検査します。", "causal"],
  ["safety-sandbox-network", "NetworkCall", "accesses", "NetworkResource", "网络调用访问网络资源，同时保留端点、响应内容和信任边界的区别。", "A NetworkCall accesses a NetworkResource while preserving the distinction among endpoint, response content, and trust boundary.", "NetworkCall は NetworkResource へアクセスし、端点・応答内容・信頼境界の区別を保持します。", "causal"],
  ["tool-invocation-execution", "ToolCallPlan", "constrained_by", "ConditionalToolEnabled", "条件启用规范约束工具调用计划何时可执行。", "ConditionalToolEnabled constrains when a ToolCallPlan may execute.", "ConditionalToolEnabled は ToolCallPlan を実行できる条件を制約します。", "governance"],
  ["tool-invocation-execution", "PromptInstantiation", "uses", "PromptTemplate", "提示实例化活动使用模板并绑定参数，不与模板或结果同一。", "PromptInstantiation uses a PromptTemplate while remaining distinct from the template and its result.", "PromptInstantiation は PromptTemplate を使用し、テンプレートや結果とは別です。", "causal"],
  ["tool-invocation-execution", "ResourceSubscription", "subscribes_to", "ResourceDefinition", "资源订阅以资源定义为选择和交付范围。", "A ResourceSubscription uses a ResourceDefinition as its selection and delivery scope.", "ResourceSubscription は ResourceDefinition を選択・配送範囲として使用します。", "information"],
  ["tool-invocation-execution", "PreExecutionSafetyCheck", "uses_pattern", "UnsafeArgumentPattern", "执行前安全检查使用版本化不安全参数模式。", "A PreExecutionSafetyCheck uses a versioned UnsafeArgumentPattern.", "PreExecutionSafetyCheck は版付き UnsafeArgumentPattern を使用します。", "governance"],
];
for (const [moduleId, sourceId, predicate, targetId, zh, en, ja, relationKind] of reviewedIsolationClosureSpecs) {
  const id = `${sourceId}-${predicate}-${targetId}`;
  const factKey = `${sourceId}\0${predicate}\0${targetId}`;
  if (factKeys.has(factKey)) continue;
  const moduleDecision = moduleDecisionById.get(moduleId);
  if (!moduleDecision || !finalIds.has(sourceId) || !finalIds.has(targetId)) {
    throw new Error(`Reviewed isolation closure ${id} has an unresolved review or endpoint`);
  }
  const rationale = localized(zh, en, ja);
  relations.push(
    acceptedRelation({
      id,
      predicate,
      sourceId,
      targetId,
      relationKind,
      definitions: rationale,
      sourceIds: relationSources(sourceId, targetId),
      sourceRegistryById,
      reviewer: moduleDecision.reviewer,
      rationale,
      boundaryContext: boundaryContextFor(sourceId, targetId, relationKind),
    }),
  );
  usedRelationIds.add(id);
  factKeys.add(factKey);
}

const relationConvergence = convergeReviewedRelations({
  relations,
  legacyRelations: legacy.relations,
  sourceRegistryById,
  distinctFactGroups: [
    ...REVIEWED_DISTINCT_FACT_GROUPS,
    ...HISTORICAL_REPLAY_DISTINCT_FACT_GROUPS,
  ],
});
relations = relationConvergence.relations;
for (const [relationId, disposition] of relationConvergence.dispositionByRelationId) {
  relationDisposition.set(relationId, disposition);
}

const caseReviewer = {
  reviewer_id: "codex-case-path-reviewer",
  reviewer_role: "domain",
  reviewer_kind: "automated-agent",
  reviewed_on: "2026-07-13",
};
const caseEdges = [
  ["Goal", "elaborated_by", "TaskPlan"],
  ["TaskPlan", "contains_step", "TaskStep"],
  ["TaskStep", "invokes", "ToolCall"],
  ["ToolCall", "has_attempt", "ToolCallAttempt"],
  ["ToolCallAttempt", "produces_result", "ToolResult"],
  ["EvaluationRun", "evaluates", "ToolResult"],
  ["EvaluationRun", "produces", "Feedback"],
  ["Feedback", "triggers", "MemoryWrite"],
  ["MemoryWrite", "produces", "MemoryRecord"],
];
const relationIdByFact = new Map(
  relations.map((relation) => [
    `${relation.source_id}\0${relation.predicate}\0${relation.target_id}`,
    relation.id,
  ]),
);
const caseRelationIds = caseEdges.map(([sourceId, predicate, targetId]) => {
  if (!finalIds.has(sourceId) || !finalIds.has(targetId)) {
    throw new Error(`Main case requires retained Concepts ${sourceId}/${targetId}`);
  }
  const id = relationIdByFact.get(`${sourceId}\0${predicate}\0${targetId}`);
  if (!id) {
    throw new Error(
      `Main case must reuse an existing canonical relation: ${sourceId} ${predicate} ${targetId}`,
    );
  }
  return id;
});

const caseNodeIds = [
  "Goal",
  "TaskPlan",
  "TaskStep",
  "ToolCall",
  "ToolCallAttempt",
  "ToolResult",
  "EvaluationRun",
  "Feedback",
  "MemoryWrite",
  "MemoryRecord",
];
concepts = concepts.map((concept) => {
  const index = caseNodeIds.indexOf(concept.id);
  if (index < 0) return concept;
  const fragmentId = `${concept.id}-case-software-defect-repair-${String(index + 1).padStart(2, "0")}`;
  const labels = labelsById.get(concept.id);
  const incomingRelationId = index === 0 ? null : caseRelationIds[index - 1];
  return {
    ...concept,
    examples: [
      ...concept.examples,
      {
        id: fragmentId,
        kind: "case-fragment",
        labels: localized(
          `${labels.zh}的软件缺陷修复片段`,
          `${labels.en} fragment in software defect repair`,
          `ソフトウェア欠陥修復における${labels.ja}断片`,
        ),
        scenario_id: "software-defect-repair",
        descriptions: localized(
          `第 ${index + 1} 步由${labels.zh}承担，并保持原 canonical 节点身份。`,
          `Step ${index + 1} is carried by ${labels.en} while preserving the original canonical node identity.`,
          `第 ${index + 1} ステップは${labels.ja}が担い、元の canonical ノード同一性を保持します。`,
        ),
        field_values: {},
        related_node_ids: [concept.id],
        related_relation_ids: incomingRelationId ? [incomingRelationId] : [],
        expected_result: localized(
          "案例沿现有关系前进，不创建影子节点。",
          "The case advances along existing relations without creating shadow nodes.",
          "事例は既存関係に沿って進み、シャドーノードを作成しません。",
        ),
        why_valid_or_invalid: localized(
          "该片段直接附着于承担此步骤的 canonical Concept。",
          "The fragment is attached directly to the canonical Concept that performs this step.",
          "この断片は当該ステップを担う canonical Concept に直接付属します。",
        ),
        synthetic: true,
        verified_version: versionIri,
        source_claims: [],
      },
    ],
  };
});

const individualResult = migrateLegacyIndividuals({
  concepts,
  individuals: readJson(resolve(repositoryRoot, "ontology/migration/legacy-v1/individuals.json")),
  sourceRegistryById,
});
concepts = individualResult.concepts;
const dataPropertyResult = migrateLegacyDataProperties({
  concepts,
  properties: readJson(resolve(repositoryRoot, "ontology/migration/legacy-v1/data-properties.json")),
  sourceRegistryById,
});
concepts = dataPropertyResult.concepts;
const adapterMappingResult = migrateLegacyAdapterMappings({
  concepts,
  mappings: readJson(resolve(repositoryRoot, "ontology/migration/legacy-v1/adapter-mappings.json")),
  sourceRegistryById,
  canonicalTargetIdByLegacyId: new Map(
    conceptDecisions.map((decision) => [
      decision.concept_id,
      decision.decision === "merge" ? decision.target_concept_id : decision.concept_id,
    ]),
  ),
});
concepts = adapterMappingResult.concepts;
concepts = applyReviewedAdapterMappings({ concepts, sourceRegistryById });
concepts = applyReviewedStructurePatches(
  concepts,
  reviewedStructurePatchesForHistoricalReplay({ concepts, relations }),
);
concepts = applyReviewedSubtypeDiscriminators({ concepts, relations });
concepts = addStructuredInstanceExamples(concepts, relations);
concepts = populateRequiredConceptExampleFields({ concepts, relations });


const { buildReviewedModuleClosure } = await import("./migration/legacy-reviewed-module-closure.mjs");
const { writeLegacyMigrationOutputs } = await import("./migration/legacy-reviewed-output-writer.mjs");

const reviewedClosure = buildReviewedModuleClosure({
  concepts,
  relations,
  legacyModuleEntries,
  legacyModuleById,
  moduleDecisionById,
  moduleIdByConcept,
  productEntry,
  legacyPlaneById,
  sourceRegistryById,
  caseNodeIds,
  caseRelationIds,
  caseReviewer,
});
concepts = reviewedClosure.concepts;
relations = reviewedClosure.relations;

await writeLegacyMigrationOutputs({
  relations,
  repositoryRoot,
  legacy,
  definitionLedger,
  concepts,
  updatedModules: reviewedClosure.updatedModules,
  updatedPlanes: reviewedClosure.updatedPlanes,
  productSource: reviewedClosure.productSource,
  moduleEntryById,
  moduleIdByConcept,
  relationDisposition,
  individualResult,
  dataPropertyResult,
  adapterMappingResult,
  checkOnly,
  legacyReplay,
  expectedLegacyHash,
  expectedRecordManifestHash,
  conceptDecisions,
  removedDecisions,
  productEntry,
  decisionByConceptId,
  primaryRelationId,
  anchors,
  normalizeControlledReleaseDates,
  compressSourceClaims,
  withDirectSourceLocators,
  withoutLegacySemanticBoilerplate,
});
