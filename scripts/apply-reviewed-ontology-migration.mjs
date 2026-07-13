/**
 * FROZEN HISTORICAL REPLAY ONLY.
 *
 * This one-time v1 -> v2 reconstruction is not part of the source-first build
 * or release path. ontology/source/** is authoritative after cutover. Writing
 * historical replay output requires the explicit --legacy-replay flag.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { relative, resolve } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { writeFileTransaction } from "./lib/atomic-write.mjs";
import { parseCsv, stringifyCsv } from "./lib/csv.mjs";
import { enrichConceptExamplesWithRelations } from "./lib/ontology-concept-examples.mjs";
import {
  additionalRootConstraints,
  acceptedLegacyAxiomRows,
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
import {
  addStructuredInstanceExamples,
  applyReviewedStructurePatches,
  applyReviewedSubtypeDiscriminators,
} from "./lib/ontology-reviewed-structures.mjs";
import { applyReviewedAdapterMappings } from "./lib/ontology-reviewed-adapter-mappings.mjs";
import { convergeReviewedRelations } from "./lib/ontology-reviewed-relations.mjs";
import { stableJson } from "./lib/stable-json.mjs";

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
const moduleEntries = sourceFiles.filter(({ value }) => value.source_kind === "agent-ontology-module");
if (!productEntry || moduleEntries.length !== 41) {
  throw new Error(`Expected one product source and 41 Module sources; found ${Boolean(productEntry)}/${moduleEntries.length}`);
}
const moduleEntryById = new Map(moduleEntries.map((entry) => [entry.value.module.id, entry]));

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
if (moduleDecisions.length !== 41 || new Set(moduleDecisions.map(({ module_id: id }) => id)).size !== 41) {
  throw new Error("Reviewed Module decisions must cover all 41 Modules exactly once");
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
  const sourceConcept = moduleEntries
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
concepts = applyReviewedStructurePatches(concepts);
concepts = applyReviewedSubtypeDiscriminators({ concepts, relations });
concepts = addStructuredInstanceExamples(concepts, relations);
concepts = populateRequiredConceptExampleFields({ concepts, relations });

const requiredCardinalityByFact = new Map();
const registerRequiredCardinality = ({ concept, constraint }) => {
  const outgoing = constraint.direction === "outgoing";
  const sourceId = outgoing ? concept.id : constraint.target_concept_id;
  const targetId = outgoing ? constraint.target_concept_id : concept.id;
  const endpoint = outgoing ? "target" : "source";
  const factKey = `${sourceId}\0${constraint.predicate}\0${targetId}`;
  const current = requiredCardinalityByFact.get(factKey) ?? {};
  const existing = current[endpoint];
  if (
    existing &&
    (existing.min !== constraint.cardinality.min ||
      existing.max !== constraint.cardinality.max)
  ) {
    throw new Error(
      `Required relation constraints disagree on ${sourceId} ${constraint.predicate} ${targetId} ${endpoint} cardinality`,
    );
  }
  requiredCardinalityByFact.set(factKey, {
    ...current,
    [endpoint]: structuredClone(constraint.cardinality),
  });
};
for (const concept of concepts) {
  for (const constraint of concept.structure?.required_relation_constraints ?? []) {
    registerRequiredCardinality({ concept, constraint });
  }
}
const resolvedRequiredCardinalityFacts = new Set();
relations = relations.map((relation) => {
  const factKey = `${relation.source_id}\0${relation.predicate}\0${relation.target_id}`;
  const reviewed = requiredCardinalityByFact.get(factKey);
  if (!reviewed) return relation;
  resolvedRequiredCardinalityFacts.add(factKey);
  return {
    ...relation,
    cardinality: {
      source: reviewed.source ?? { min: 0, max: null },
      target: reviewed.target ?? { min: 0, max: null },
    },
    cardinality_not_applicable_reason: null,
  };
});
const unresolvedRequiredCardinalityFacts = [...requiredCardinalityByFact.keys()].filter(
  (factKey) => !resolvedRequiredCardinalityFacts.has(factKey),
);
if (unresolvedRequiredCardinalityFacts.length > 0) {
  throw new Error(
    `Required relation cardinality has no canonical fact: ${unresolvedRequiredCardinalityFacts.join(", ")}`,
  );
}
concepts = enrichConceptExamplesWithRelations({ concepts, relations });

const interactionMode = (moduleId) =>
  new Set([
    "runtime-actors",
    "info-content-block-modality",
    "info-storage-sources",
    "memory-stores-scopes",
    "tool-registry-definition",
    "adapter-protocols",
    "adapter-frameworks",
    "adapter-benchmarks",
    "adapter-statecharts",
    "adapter-schema-export",
  ]).has(moduleId)
    ? "descriptive"
    : moduleId === "adapter-mapping-infrastructure"
      ? "mixed"
      : "operational";
const interactionPredicatePatterns = Object.freeze({
  input: Object.freeze([
    /consumes|reads|receives|requests|queries|uses|observes|evaluates|applies/u,
    /selects_from|responds_to|based_on|references|refers_to|scans/u,
    /governed_by|constrained_by|requires|belongs_to|sourced_from|derived_from/u,
    /triggered_by|informs|targets|measures|assessed_against|has_source/u,
  ]),
  output: Object.freeze([
    /produces|produced_by|emits|writes|returns|records|recorded_by/u,
    /exports|publishes|generates|creates|materializes|makes_available/u,
    /delivered_to|displayed_to|released_to|appended|summarizes/u,
    /selects|resolves|updates|triggers|raises|routes|stores/u,
    /opens|closes|captures|restores|retrieves|orders|fills|flags/u,
    /maps_|projects|warns|verifies|elaborated_by|prescribes/u,
  ]),
  failure: Object.freeze([
    /error|failure|warning|warns|blocks|denied|rejects|risk/u,
    /threatens|suppresses|may_cause|prevents|conflict|flags|raises|diagnostic/u,
  ]),
  recovery: Object.freeze([
    /recover|retr(?:y|ies)|rollback|restore|resume|replay|refresh/u,
    /supersed|resolve|correct|renegotiat|fallback|revision|compensat/u,
  ]),
});
// These facets are not inferred from labels. Every override names an already reviewed,
// accepted fact whose semantics directly express a Module-level failure or recovery path.
// Cross-Module facts are valid here because canonical endpoint ownership is unchanged.
const reviewedInteractionRelationIds = new Map([
  ["runtime-system", { failure: "blocking_error_blocks_run_attempt" }],
  ["runtime-artifacts", { recovery: "correction_applies_to_artifact" }],
  ["orchestration-routing-control", { recovery: "RetryPolicy-creates_new-RunAttempt" }],
  ["tool-mcp-transport", { failure: "MCPSession-may_emit-ToolError" }],
  ["feedback-logging", { recovery: "ErrorListener-triggers-RecoveryAction" }],
  ["feedback-metrics-evaluation", { recovery: "CorrectionActivity-followed_by-EvaluationRun" }],
  ["feedback-review-optimization", { failure: "retryable_error_triggers_recovery_plan" }],
]);
const interactionRelation = (relationsForModule, facet) =>
  [...relationsForModule]
    .sort((left, right) => left.id.localeCompare(right.id))
    .find((relation) =>
      interactionPredicatePatterns[facet].some((pattern) => pattern.test(relation.predicate)),
    ) ?? null;
const interactionFacet = ({ relation, moduleLabels, facet, mode }) => ({
  applicable: relation !== null,
  not_applicable_reason:
    relation !== null
      ? null
      : localized(
          mode === "descriptive"
            ? `${moduleLabels.zh}是描述型模块；${facet} 不构成模块级运行事实，因此不为通过门禁而虚构关系。`
            : `${moduleLabels.zh}当前没有已接受的 canonical ${facet} 关系；本发布将该项明确标为不适用，而不以字段或示例伪造一条边。`,
          mode === "descriptive"
            ? `${moduleLabels.en} is descriptive; ${facet} is not a Module-level runtime fact, so no relation is invented to satisfy a gate.`
            : `${moduleLabels.en} has no accepted canonical ${facet} relation in this release; the facet is explicitly not applicable instead of being fabricated from fields or examples.`,
          mode === "descriptive"
            ? `${moduleLabels.ja}は記述型モジュールであり、${facet} はモジュール単位の実行事実ではないため、ゲート通過用の関係を捏造しません。`
            : `${moduleLabels.ja}には本リリースで承認済み canonical ${facet} 関係がなく、項目や例から辺を捏造せず明示的に非適用とします。`,
        ),
});
const mergeRelationClaims = (relationList) => {
  const claims = new Map();
  for (const claim of relationList.flatMap((relation) => relation?.source_claims ?? [])) {
    const key = `${claim.source_id}\0${claim.supports}\0${claim.locator}`;
    claims.set(key, claim);
  }
  return [...claims.values()];
};

const updatedModules = moduleEntries.map(({ value }) => {
  const base = value.module;
  const old = legacyModuleById.get(base.id);
  const decision = moduleDecisionById.get(base.id);
  const ownedConcepts = concepts.filter(({ module_id: moduleId }) => moduleId === base.id);
  if (ownedConcepts.length === 0) throw new Error(`Reviewed Module ${base.id} has no retained Concepts`);
  const mode = interactionMode(base.id);
  const moduleSemanticRelations = relations.filter(
    (relation) =>
      relation.predicate !== "is_a" &&
      moduleIdByConcept.get(relation.source_id) === base.id,
  );
  const interactionEvidence = Object.fromEntries(
    ["input", "output", "failure", "recovery"].map((facet) => [
      facet,
      mode === "descriptive" ? null : interactionRelation(moduleSemanticRelations, facet),
    ]),
  );
  for (const [facet, relationId] of Object.entries(
    reviewedInteractionRelationIds.get(base.id) ?? {},
  )) {
    const relation = relations.find(({ id }) => id === relationId);
    if (!relation || relation.status !== "accepted" || relation.predicate === "is_a") {
      throw new Error(`Reviewed ${facet} relation ${relationId} for ${base.id} is unresolved`);
    }
    const sourceModule = moduleIdByConcept.get(relation.source_id);
    const targetModule = moduleIdByConcept.get(relation.target_id);
    if (sourceModule !== base.id && targetModule !== base.id) {
      throw new Error(`Reviewed ${facet} relation ${relationId} is not incident to ${base.id}`);
    }
    interactionEvidence[facet] = relation;
  }
  if (mode !== "descriptive" && (!interactionEvidence.input || !interactionEvidence.output)) {
    throw new Error(
      `${mode} Module ${base.id} must resolve accepted canonical input and output relations`,
    );
  }
  const representativeRelation = (decision.semantic_relations ?? [])
    .map((relation) =>
      relations.find(
        (candidate) =>
          candidate.source_id === relation.source_id &&
          candidate.predicate === relation.predicate &&
          candidate.target_id === relation.target_id,
      ),
    )
    .find(Boolean);
  if (!representativeRelation) {
    throw new Error(`Reviewed Module ${base.id} has no resolvable semantic closure relation`);
  }
  const moduleRelationCount = relations.filter(
    (relation) => moduleIdByConcept.get(relation.source_id) === base.id,
  ).length;
  const taxonomyRelation = relations.find(
    (relation) =>
      relation.predicate === "is_a" &&
      moduleIdByConcept.get(relation.source_id) === base.id &&
      moduleIdByConcept.get(relation.target_id) === base.id,
  );
  if (decision.taxonomy_applicability === "specialization" && !taxonomyRelation) {
    throw new Error(`Specialization Module ${base.id} has no module-local is_a relation`);
  }
  const [moduleExampleBase] = positiveAndBoundaryExamples({
    ownerId: base.id,
    labels: base.labels,
    definitions: base.definitions,
    relatedNodeIds: [
      base.id,
      representativeRelation.source_id,
      representativeRelation.target_id,
    ],
    relatedRelationIds: [representativeRelation.id],
    positiveDescriptions: localized(
      `在 ${base.labels.zh} 的合成审计场景中，${representativeRelation.source_id} 通过 ${representativeRelation.predicate} 指向 ${representativeRelation.target_id}；该事实直接复用 canonical 节点与关系，定义、字段、约束、实例和来源都作为对应节点或关系的信息呈现。`,
      `In a synthetic audit scenario for ${base.labels.en}, ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id}. The fact reuses canonical nodes and one canonical relation, while definitions, fields, constraints, instances, and sources remain information on those nodes or the relation.`,
      `${base.labels.ja}の合成監査シナリオで、${representativeRelation.source_id} は ${representativeRelation.predicate} により ${representativeRelation.target_id} を指します。この事実は canonical ノードと単一の canonical 関係を再利用し、定義・項目・制約・インスタンス・出典は対応ノードまたは関係の情報として保持します。`,
    ),
  });
  const semanticQuestion = {
    id: `${base.id}-cq-semantic-closure`,
    questions: localized(
      `本模块能否以唯一 canonical 关系证明 ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id}，且不创建影子节点或平行实例图？`,
      `Can this Module prove ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} through one canonical relation without creating shadow nodes or a parallel instance graph?`,
      `本モジュールはシャドーノードや並行インスタンスグラフを作らず、単一の canonical 関係で ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} を証明できるか。`,
    ),
    query: `relation(source=${representativeRelation.source_id}, predicate=${representativeRelation.predicate}, target=${representativeRelation.target_id})`,
    expected_assertion: `${representativeRelation.id} is the unique accepted canonical fact for this source/predicate/target triple`,
    positive_example_ids: [`${representativeRelation.id}-example-positive-001`],
    counterexample_ids: [`${representativeRelation.id}-example-boundary-001`],
    source_claims: representativeRelation.source_claims,
    review: acceptedReview(decision.reviewer, decision.rationale),
  };
  const taxonomyQuestion = taxonomyRelation
    ? {
        id: `${base.id}-cq-taxonomy`,
        questions: localized(
          `专业化事实 ${taxonomyRelation.source_id} is_a ${taxonomyRelation.target_id} 是否保持具体到一般方向、具有经审查种差且不形成环？`,
          `Does the specialization fact ${taxonomyRelation.source_id} is_a ${taxonomyRelation.target_id} preserve the specific-to-general direction, carry a reviewed differentia, and remain acyclic?`,
          `特殊化事実 ${taxonomyRelation.source_id} is_a ${taxonomyRelation.target_id} は具体から一般への方向、審査済み種差、非循環性を保つか。`,
        ),
        query: `relation(id=${taxonomyRelation.id}, predicate=is_a) AND acyclic=true`,
        expected_assertion: `${taxonomyRelation.id} resolves from ${taxonomyRelation.source_id} to ${taxonomyRelation.target_id} with accepted review evidence`,
        positive_example_ids: [`${taxonomyRelation.id}-example-positive-001`],
        counterexample_ids: [`${taxonomyRelation.id}-example-boundary-001`],
        source_claims: taxonomyRelation.source_claims,
        review: acceptedReview(decision.reviewer, decision.rationale),
      }
    : {
        id: `${base.id}-cq-taxonomy`,
        questions: localized(
          "本模块的平坦根例外是否具有已接受理由，且没有伪造专业化边？",
          "Does this Module's flat-root exception have an accepted rationale without fabricated specialization edges?",
          "本モジュールの平坦ルート例外は承認済み理由を持ち、偽の特殊化辺を作っていないか。",
        ),
        query: `taxonomy(module=${base.id}, applicability=flat-root-exception)`,
        expected_assertion: `Module ${base.id} resolves an accepted flat-root-exception without a fabricated is_a relation`,
        positive_example_ids: [`${ownedConcepts[0].id}-example-positive-001`],
        counterexample_ids: [`${ownedConcepts[0].id}-example-boundary-001`],
        source_claims: [],
        review: acceptedReview(decision.reviewer, decision.rationale),
      };
  const evidencedInteractionRelations = [
    ...new Map(
      [
        interactionEvidence.input,
        interactionEvidence.output,
        interactionEvidence.failure,
        interactionEvidence.recovery,
      ]
        .filter(Boolean)
        .map((relation) => [relation.id, relation]),
    ).values(),
  ];
  const moduleCaseRelations = [
    ...new Map(
      [representativeRelation, ...evidencedInteractionRelations].map((relation) => [
        relation.id,
        relation,
      ]),
    ).values(),
  ];
  const moduleCaseRelationIds = moduleCaseRelations.map(({ id }) => id);
  const moduleCaseNodeIds = [
    ...new Set(
      moduleCaseRelations.flatMap(({ source_id: sourceId, target_id: targetId }) => [
        sourceId,
        targetId,
      ]),
    ),
  ];
  const moduleExample = {
    ...moduleExampleBase,
    id: `${base.id}-case-software-defect-repair`,
    kind: "case-fragment",
    scenario_id: "software-defect-repair",
    labels: localized(
      `软件缺陷修复：${base.labels.zh}片段`,
      `Software defect repair: ${base.labels.en} fragment`,
      `ソフトウェア欠陥修復：${base.labels.ja}断片`,
    ),
    descriptions: localized(
      `在软件缺陷修复场景中，本模块只复用已接受关系 ${moduleCaseRelationIds.join("、")}；片段把 ${moduleCaseNodeIds.join("、")} 作为同一 canonical 图中的可选审查分支，不把字段、实例或来源提升为影子节点。`,
      `In the software-defect-repair scenario, this Module reuses only accepted relations ${moduleCaseRelationIds.join(", ")}. The fragment treats ${moduleCaseNodeIds.join(", ")} as an optional review branch of the same canonical graph without promoting fields, instances, or sources to shadow nodes.`,
      `ソフトウェア欠陥修復シナリオで、本モジュールは承認済み関係 ${moduleCaseRelationIds.join("、")} だけを再利用します。${moduleCaseNodeIds.join("、")} を同じ canonical グラフの任意レビュー分岐として扱い、項目・インスタンス・出典をシャドーノードへ昇格しません。`,
    ),
    related_node_ids: moduleCaseNodeIds,
    related_relation_ids: moduleCaseRelationIds,
    expected_result: localized(
      "查询逐一解析这些关系及端点；未被本次修复运行触发的可选分支保持未断言，而不是伪造事件。",
      "The query resolves every listed relation and endpoint; optional branches not exercised by this repair run remain unasserted rather than becoming fabricated events.",
      "照会は列挙された各関係と端点を解決し、この修復実行で使われない任意分岐は偽イベントにせず未アサートのままにします。",
    ),
    why_valid_or_invalid: localized(
      "片段仅引用 source 中已有的 accepted 事实，并明确区分“该模块可解释此场景”与“本次运行已经发生该事件”。",
      "The fragment cites only accepted facts already present in source and distinguishes a Module that can explain the scenario from an event asserted to have occurred in this run.",
      "断片は source に既存の accepted 事実だけを参照し、「シナリオを説明できるモジュール」と「今回の実行で発生したと断言するイベント」を区別します。",
    ),
    source_claims: mergeRelationClaims(moduleCaseRelations),
  };
  const interactionQuestion =
    mode === "descriptive"
      ? {
          id: `${base.id}-cq-interaction-closure`,
          questions: localized(
            "本描述型模块是否明确拒绝虚构运行输入、输出、失败或恢复边，同时仍通过代表性 canonical 关系解释其专业边界？",
            "Does this descriptive Module explicitly reject invented runtime input, output, failure, or recovery edges while still explaining its professional boundary through a representative canonical relation?",
            "本記述型モジュールは実行入力・出力・失敗・回復の辺を捏造せず、代表 canonical 関係で専門境界を説明しているか。",
          ),
          query: `interaction(module=${base.id}, applicability=descriptive, invented_runtime_relations=0)`,
          expected_assertion: `${base.id} marks input, output, failure, and recovery not applicable and retains ${representativeRelation.id} only as a reviewed domain fact`,
          positive_example_ids: [`${representativeRelation.id}-example-positive-001`],
          counterexample_ids: [`${representativeRelation.id}-example-boundary-001`],
          source_claims: representativeRelation.source_claims,
          review: acceptedReview(decision.reviewer, decision.rationale),
        }
      : {
          id: `${base.id}-cq-interaction-closure`,
          questions: localized(
            `本模块能否由唯一关系集合证明输入 ${interactionEvidence.input.id} 与输出 ${interactionEvidence.output.id}，并对失败与恢复分别给出 canonical 关系或明确不适用结论？`,
            `Can this Module prove input ${interactionEvidence.input.id} and output ${interactionEvidence.output.id} from the sole relation set while giving either a canonical relation or an explicit not-applicable decision for failure and recovery?`,
            `本モジュールは唯一の関係集合から入力 ${interactionEvidence.input.id} と出力 ${interactionEvidence.output.id} を証明し、失敗と回復に canonical 関係または明示的な非適用判断を示せるか。`,
          ),
          query: [
            `interaction(module=${base.id}`,
            `input=${interactionEvidence.input.id}`,
            `output=${interactionEvidence.output.id}`,
            `failure=${interactionEvidence.failure?.id ?? "not-applicable"}`,
            `recovery=${interactionEvidence.recovery?.id ?? "not-applicable"})`,
          ].join(","),
          expected_assertion: evidencedInteractionRelations
            .map(({ id }) => id)
            .join(" + "),
          positive_example_ids: evidencedInteractionRelations.map(
            ({ id }) => `${id}-example-positive-001`,
          ),
          counterexample_ids: evidencedInteractionRelations.map(
            ({ id }) => `${id}-example-boundary-001`,
          ),
          source_claims: mergeRelationClaims(evidencedInteractionRelations),
          review: acceptedReview(decision.reviewer, decision.rationale),
        };
  return {
    id: base.id,
    plane_id: base.plane_id,
    labels: base.labels,
    definitions: base.definitions,
    purpose: localized(
      `本模块在“${base.labels.zh}”边界内，以 ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} 为代表闭包，把概念层级、语义关系和节点内信息组织成可查询、可验证的一张统一图。`,
      `Within the ${base.labels.en} boundary, this Module uses ${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} as a representative closure fact and organizes taxonomy, semantic relations, and node information as one queryable, verifiable graph.`,
      `${base.labels.ja}の境界内で、${representativeRelation.source_id} ${representativeRelation.predicate} ${representativeRelation.target_id} を代表閉包事実とし、分類・意味関係・ノード内情報を検索・検証可能な単一グラフとして組織します。`,
    ),
    includes: [
      localized(
        `本模块直接拥有 ${ownedConcepts.length} 个概念和 ${moduleRelationCount} 条 source-owned 关系；定义、字段、约束、实例、引用和解释附着在对应 canonical 节点或关系上。`,
        `${ownedConcepts.length} directly owned Concepts and ${moduleRelationCount} source-owned relations; definitions, fields, constraints, instances, citations, and explanations are attached to the corresponding canonical node or relation.`,
        `本モジュールが直接所有する ${ownedConcepts.length} 個の概念と ${moduleRelationCount} 本の source-owned 関係。定義・項目・制約・インスタンス・引用・説明は対応する canonical ノードまたは関係に付属します。`,
      ),
    ],
    excludes: [
      localized(
        "兄弟模块拥有的概念，以及与主图并行的 schema 图、实例图或案例影子图；跨模块语义只通过 canonical ID 和唯一关系事实引用。",
        "Concepts owned by sibling Modules and any schema, instance, or case shadow graph parallel to the primary graph; cross-Module meaning is referenced only through canonical IDs and one relation fact.",
        "兄弟モジュール所有の概念、および主グラフと並行する schema・instance・事例のシャドーグラフ。モジュール横断意味は canonical ID と一つの関係事実だけで参照します。",
      ),
    ],
    interaction_contract: {
      applicability: mode,
      facets: {
        input: interactionFacet({
          relation: interactionEvidence.input,
          moduleLabels: base.labels,
          facet: "input",
          mode,
        }),
        output: interactionFacet({
          relation: interactionEvidence.output,
          moduleLabels: base.labels,
          facet: "output",
          mode,
        }),
        failure: interactionFacet({
          relation: interactionEvidence.failure,
          moduleLabels: base.labels,
          facet: "failure",
          mode,
        }),
        recovery: interactionFacet({
          relation: interactionEvidence.recovery,
          moduleLabels: base.labels,
          facet: "recovery",
          mode,
        }),
      },
      review: acceptedReview(decision.reviewer, decision.rationale),
    },
    taxonomy_contract: {
      applicability: decision.taxonomy_applicability,
      not_applicable_reason:
        decision.taxonomy_applicability === "flat-root-exception" ? decision.rationale : null,
      review: acceptedReview(decision.reviewer, decision.rationale),
    },
    examples: [
      {
        ...moduleExample,
        expected_result: localized(
          `查询唯一解析到关系 ${representativeRelation.id}，并从模块页直接追踪两个端点及其内嵌信息。`,
          `The query resolves uniquely to ${representativeRelation.id} and traces both endpoints and their embedded information directly from the Module page.`,
          `照会は関係 ${representativeRelation.id} に一意に解決し、モジュールページから両端点と内蔵情報を直接追跡できます。`,
        ),
        why_valid_or_invalid: localized(
          "该例复用唯一 canonical 事实，不复制节点、关系、schema 或实例层。",
          "The example reuses one canonical fact without duplicating nodes, relations, schema, or an instance layer.",
          "この例は単一の canonical 事実を再利用し、ノード・関係・schema・instance 層を複製しません。",
        ),
      },
    ],
    competency_questions: [semanticQuestion, taxonomyQuestion, interactionQuestion],
    source_claims: claimsFor({
      sourceIds: old.source_ids,
      ownerId: base.id,
      assertion: `Provides evidence for the reviewed Module boundary of ${base.id}: ${decision.rationale.en}`,
      sourceRegistryById,
    }),
    status: "accepted",
    review: acceptedReview(decision.reviewer, decision.rationale),
    introduced_in: versionIri,
    change_note: decision.rationale,
  };
});

const planeReviewer = {
  reviewer_id: "codex-domain-architecture-reviewer",
  reviewer_role: "architecture",
  reviewer_kind: "automated-agent",
  reviewed_on: "2026-07-13",
};
const updatedPlanes = productEntry.value.planes.map((base) => {
  const old = legacyPlaneById.get(base.id);
  const moduleCount = updatedModules.filter(({ plane_id: planeId }) => planeId === base.id).length;
  const note = localized(
    `保留该一级领域，并在其 ${moduleCount} 个模块内建立专业化层级和语义闭环。`,
    `Retains this first-level Domain while establishing specialization and semantic closure inside its ${moduleCount} Modules.`,
    `この第一階層ドメインを維持し、配下の ${moduleCount} モジュール内に特殊化と意味閉包を確立します。`,
  );
  const examples = positiveAndBoundaryExamples({
    ownerId: base.id,
    labels: base.labels,
    definitions: base.definitions,
    relatedNodeIds: [base.id],
  });
  return {
    id: base.id,
    labels: base.labels,
    definitions: base.definitions,
    purpose: localized(
      `该领域界定${base.labels.zh}相关的完整 Agent 工程问题空间。`,
      `This Domain bounds the complete Agent-engineering problem space associated with ${base.labels.en}.`,
      `このドメインは${base.labels.ja}に関する完全な Agent 工学問題空間を区切ります。`,
    ),
    includes: [
      localized(
        `直属的 ${moduleCount} 个模块及其 canonical 概念。`,
        `${moduleCount} directly owned Modules and their canonical Concepts.`,
        `直接所有する ${moduleCount} モジュールと canonical 概念。`,
      ),
    ],
    excludes: [
      localized(
        "其他一级领域直接拥有的概念；跨域关系不改变规范归属。",
        "Concepts directly owned by other first-level Domains; cross-Domain relations do not change canonical ownership.",
        "他の第一階層ドメインが直接所有する概念。ドメイン横断関係は canonical 所有を変更しません。",
      ),
    ],
    examples: [examples[0]],
    source_claims: claimsFor({
      sourceIds: old.source_ids,
      ownerId: base.id,
      assertion: `Provides evidence for the reviewed Domain boundary of ${base.id}: ${base.definitions.en}`,
      sourceRegistryById,
    }),
    status: "accepted",
    review: acceptedReview(planeReviewer, note),
    introduced_in: versionIri,
    change_note: note,
  };
});

const rootReviewNote = localized(
  "八域、41 模块、逐层概念专业化和内嵌信息合同已完成统一图谱审查。",
  "The eight Domains, 41 Modules, layered Concept specialization, and inline information contract passed unified-graph review.",
  "八ドメイン、41 モジュール、段階的概念特殊化、埋め込み情報契約が統一グラフレビューを通過しました。",
);
const product = {
  ...productEntry.value.product,
  status: "accepted",
  review: acceptedReview(planeReviewer, rootReviewNote),
  canonical_version: versionIri,
};
const migratedRootConstraints = additionalRootConstraints({ sourceRegistryById });
const migratedRootConstraintIds = new Set(
  migratedRootConstraints.map(({ id }) => id),
);
const casePath = {
  id: "software-defect-repair",
  labels: localized("软件缺陷修复闭环", "Software defect repair loop", "ソフトウェア欠陥修復ループ"),
  descriptions: localized(
    "从目标、计划、任务步骤、工具调用和结果，经过评估与反馈写入记忆的原图高亮路径。",
    "A highlight path over existing nodes from goal, plan, task step, tool call and result through evaluation and feedback into memory.",
    "目標、計画、タスクステップ、ツール呼び出しと結果から、評価とフィードバックを経て記憶へ書き込む既存ノード上の強調経路。",
  ),
  steps: caseNodeIds.map((nodeId, index) => ({
    order: index + 1,
    case_fragment_example_id: `${nodeId}-case-software-defect-repair-${String(index + 1).padStart(2, "0")}`,
    traversal_relation_id: index === 0 ? null : caseRelationIds[index - 1],
  })),
  source_claims: claimsFor({
    sourceIds: ["lit-agent-conductor", "lit-mech-reflexion", "eng-fw-openai-tracing"],
    ownerId: "software-defect-repair",
    assertion: "Supports the observable plan-execute-evaluate-feedback case path.",
    sourceRegistryById,
  }),
  status: "accepted",
  review: acceptedReview(caseReviewer, rootReviewNote),
};
const productSource = {
  source_kind: "agent-ontology-product",
  contract_version: productEntry.value.contract_version,
  product,
  planes: updatedPlanes,
  global_constraints: [
    ...productEntry.value.global_constraints.filter(
      ({ id }) => !migratedRootConstraintIds.has(id),
    ),
    ...migratedRootConstraints,
  ],
  case_paths: [casePath],
  hygiene_gates: productEntry.value.hygiene_gates,
};

const reverseGroups = new Map();
for (const relation of relations) {
  if (relation.source_id === relation.target_id) continue;
  const key = [relation.source_id, relation.target_id].sort().join("\0");
  reverseGroups.set(key, [...(reverseGroups.get(key) ?? []), relation]);
}
relations = relations.map((relation) => {
  const group = reverseGroups.get([relation.source_id, relation.target_id].sort().join("\0")) ?? [];
  const reversed = group.some(
    (candidate) =>
      candidate.id !== relation.id &&
      candidate.source_id === relation.target_id &&
      candidate.target_id === relation.source_id,
  );
  return reversed
    ? {
        ...relation,
        distinct_fact_rationale: localized(
          "该方向记录具有独立谓词和工程含义，不能由反向事实完整推出。",
          "This direction has an independent predicate and engineering meaning that cannot be fully inferred from the reverse fact.",
          "この方向は独立した述語と工学的意味を持ち、逆方向事実から完全には推論できません。",
        ),
      }
    : relation;
});

let sourceOutputs = [{ path: productEntry.path, value: productSource }];
for (const [moduleId, entry] of moduleEntryById) {
  sourceOutputs.push({
    path: entry.path,
    value: {
      source_kind: "agent-ontology-module",
      contract_version: entry.value.contract_version,
      module: updatedModules.find(({ id }) => id === moduleId),
      classes: concepts.filter(({ module_id: owner }) => owner === moduleId),
      relations: relations
        .filter((relation) => moduleIdByConcept.get(relation.source_id) === moduleId)
        .sort((left, right) => left.id.localeCompare(right.id)),
    },
  });
}
sourceOutputs = sourceOutputs.map((output) => ({
  ...output,
  value: normalizeControlledReleaseDates(
    compressSourceClaims(
      withDirectSourceLocators(withoutLegacySemanticBoilerplate(output.value)),
    ),
    productSource.product.date,
  ),
}));

const contract = readJson(resolve(repositoryRoot, "schemas/source/agent-ontology-artifact-contract.json"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(contract);
for (const output of sourceOutputs) {
  if (!validate(output.value)) {
    throw new Error(
      `Reviewed source failed artifact contract at ${relative(repositoryRoot, output.path)}: ${JSON.stringify(validate.errors, null, 2)}`,
    );
  }
}

const modulePlaneById = new Map(updatedModules.map((module) => [module.id, module.plane_id]));
const hierarchyRows = legacy.classes.map((legacyConcept) => {
  const decision = decisionByConceptId.get(legacyConcept.id);
  const primaryId = primaryRelationId(legacyConcept.id, decision.primary_parent_id ?? null) ?? "";
  const additional = (decision.additional_parent_ids ?? []).map(
    (parentId) => `${legacyConcept.id}-is_a-${parentId}`,
  );
  return {
    concept_id: legacyConcept.id,
    current_plane_id: legacyConcept.plane_id,
    current_module_id: legacyConcept.module_id,
    current_kind: legacyConcept.kind,
    decision: decision.decision,
    proposed_kind: decision.semantic_kind ?? "",
    primary_parent_relation_id: primaryId,
    additional_parent_relation_ids: additional.length ? JSON.stringify(additional) : "",
    target_plane_id: modulePlaneById.get(decision.target_module_id) ?? "",
    target_module_id: decision.target_module_id,
    target_concept_id: decision.target_concept_id ?? "",
    convert_to_field_id:
      decision.decision === "convert_to_field"
        ? conceptLocalFieldId(decision.target_field_id ?? "")
        : "",
    convert_to_allowed_value_of:
      decision.decision === "convert_to_controlled_value"
        ? `${decision.target_concept_id}.${conceptLocalFieldId(decision.target_field_id)}`
        : "",
    merge_into_id: decision.decision === "merge" ? decision.target_concept_id ?? "" : "",
    replaced_by_id: decision.decision === "deprecate" ? decision.target_concept_id ?? "" : "",
    definition_action: removedDecisions.has(decision.decision)
      ? "migrate definition into reviewed target information"
      : "retain and clarify trilingual definition",
    example_action: removedDecisions.has(decision.decision)
      ? "explain disposition in target field or Concept"
      : "add positive and boundary examples",
    source_action: "convert legacy source IDs into direct reviewed source claims",
    required_new_relation_ids: JSON.stringify([primaryId, ...additional].filter(Boolean)),
    rationale: `${decision.rationale.zh} / ${decision.rationale.en}`,
    reviewer: decision.reviewer.reviewer_id,
    review_status: "accepted",
  };
});

const relationRows = legacy.relations.map((relation) => {
  const disposition = relationDisposition.get(relation.id);
  return {
    relation_id: relation.id,
    action: disposition.action,
    target_relation_id: disposition.target_relation_id,
    target_relation_ids: JSON.stringify(disposition.target_relation_ids ?? []),
    target_mapping_id: disposition.target_mapping_id ?? "",
    rationale:
      disposition.rationale?.en ??
      (disposition.action === "migrate_reviewed_relation"
        ? "Endpoint, direction, evidence, and non-placeholder semantics were accepted and enriched in the canonical relation contract."
        : "The relation was a generated placeholder, used a pseudo endpoint, duplicated taxonomy, or lost its subject after reviewed concept disposition."),
    reviewer: "codex-legacy-relation-reviewer",
    status: "accepted",
  };
});
const axiomRows = acceptedLegacyAxiomRows(
  readJson(resolve(repositoryRoot, "ontology/migration/legacy-v1/axioms.json")),
);
const staleDefinitionIds = new Set(
  readJson(resolve(repositoryRoot, "ontology/migration/legacy-v1/stale-definitions.json")).map(({ id }) => id),
);
const finalGraphIds = new Set([
  product.id,
  ...updatedPlanes.map(({ id }) => id),
  ...updatedModules.map(({ id }) => id),
  ...concepts.map(({ id }) => id),
  ...relations.map(({ id }) => id),
  ...productSource.global_constraints.map(({ id }) => id),
  ...productSource.hygiene_gates.map(({ id }) => id),
]);
const definitionRows = Object.values(definitionLedger.definitions).map((record) => ({
  definition_id: record.id,
  action: staleDefinitionIds.has(record.id)
    ? "remove_stale_generated_definition"
    : finalGraphIds.has(record.id)
      ? "merge_into_canonical_owner"
      : "retire_with_reviewed_legacy_disposition",
  target_id: finalGraphIds.has(record.id) ? record.id : "",
  rationale: staleDefinitionIds.has(record.id)
    ? "The definition referred to a generated relation record absent from the frozen canonical inventory."
    : finalGraphIds.has(record.id)
      ? "The trilingual definition is now stored once with its canonical node, relation, or root constraint."
      : "The owning legacy record was removed, merged, or converted during reviewed migration; no detached definition remains.",
  reviewer: "codex-definition-migration-reviewer",
  status: "accepted",
}));
const driftRows = readJson(
  resolve(repositoryRoot, "ontology/migration/legacy-v1/source-claim-drift.json"),
).map((record) => ({
  entity_id: record.id,
  decision: "retain canonical record source set and convert it into direct scoped claims",
  selected_source_ids: JSON.stringify(record.canonical_source_ids),
  rejected_source_ids: JSON.stringify(
    record.definition_source_ids.filter((id) => !record.canonical_source_ids.includes(id)),
  ),
  rationale:
    "The frozen canonical record was the published ownership source; definition-ledger-only IDs were not silently promoted to direct evidence.",
  reviewer: "codex-source-drift-reviewer",
  status: "accepted",
}));

const recordManifestPath = resolve(repositoryRoot, "ontology/migration/legacy-v1/record-manifest.json");
const recordManifestBytes = readFileSync(recordManifestPath);
if (sha256(recordManifestBytes) !== expectedRecordManifestHash) {
  throw new Error("The legacy record manifest changed from its independently reviewed SHA-256 anchor.");
}
const recordManifest = JSON.parse(recordManifestBytes.toString("utf8"));
const hierarchyById = new Map(hierarchyRows.map((row) => [row.concept_id, row]));
const relationByLegacyId = new Map(relationRows.map((row) => [row.relation_id, row]));
const fieldByLegacyId = new Map(dataPropertyResult.rows.map((row) => [row.data_property_id, row]));
const individualByLegacyId = new Map(individualResult.rows.map((row) => [row.individual_id, row]));
const axiomByLegacyId = new Map(axiomRows.map((row) => [row.axiom_id, row]));
const adapterByName = new Map(adapterMappingResult.rows.map((row) => [row.adapter, row]));
const dispositions = recordManifest.map((record) => {
  let action = "retain_canonical_owner";
  let targetRefs = [record.id];
  if (["classes", "terms"].includes(record.source_collection)) {
    const row = hierarchyById.get(record.id);
    action = row.decision;
    targetRefs = [
      row.merge_into_id ||
        row.replaced_by_id ||
        (row.convert_to_allowed_value_of ? row.convert_to_allowed_value_of : "") ||
        (row.convert_to_field_id ? `${row.target_concept_id}.${row.convert_to_field_id}` : "") ||
        (finalGraphIds.has(record.id) ? record.id : ""),
    ].filter(Boolean);
  } else if (["relations", "object_properties"].includes(record.source_collection)) {
    const row = relationByLegacyId.get(record.id);
    action = row.action;
    targetRefs = [
      row.target_relation_id,
      ...JSON.parse(row.target_relation_ids || "[]"),
      row.target_mapping_id,
    ].filter(Boolean);
    targetRefs = [...new Set(targetRefs)];
  } else if (record.source_collection === "data_properties") {
    const row = fieldByLegacyId.get(record.id);
    action = row.action;
    targetRefs = row.target_node_id ? [`${row.target_node_id}.${row.target_field_id}`] : [];
  } else if (record.source_collection === "individuals") {
    const row = individualByLegacyId.get(record.id);
    action = row.action;
    targetRefs = [
      row.target_node_id,
      row.target_node_id && row.target_field_id
        ? `${row.target_node_id}.${row.target_field_id}`
        : "",
      row.target_example_id,
    ].filter(Boolean);
  } else if (record.source_collection === "axioms") {
    const row = axiomByLegacyId.get(record.id);
    action = row.action;
    targetRefs = row.target_id ? [row.target_id] : [];
  } else if (record.source_collection === "adapter_mappings") {
    const row = adapterByName.get(record.id);
    action = row?.action ?? "attach_external_mapping_to_adapter_concept";
    targetRefs = row ? [row.target_node_id, row.target_mapping_id] : [];
  }
  return {
    source_collection: record.source_collection,
    id: record.id,
    original_json_pointer: record.original_json_pointer,
    payload_sha256: record.payload_sha256,
    action,
    target_refs: targetRefs,
    reviewer: "codex-migration-disposition-reviewer",
    status: "accepted",
  };
});
const dispositionKeys = new Set();
for (const disposition of dispositions) {
  const key = `${disposition.source_collection}\0${disposition.id}\0${disposition.original_json_pointer}`;
  if (dispositionKeys.has(key)) throw new Error(`Duplicate legacy disposition record ${key}`);
  dispositionKeys.add(key);
  const manifestRecord = recordManifest.find(
    (record) =>
      record.source_collection === disposition.source_collection &&
      record.id === disposition.id &&
      record.original_json_pointer === disposition.original_json_pointer,
  );
  if (!manifestRecord || manifestRecord.payload_sha256 !== disposition.payload_sha256) {
    throw new Error(`Disposition payload hash drifted for ${key}`);
  }
  const pointerParts = disposition.original_json_pointer
    .split("/")
    .slice(1)
    .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
  const [collection, indexText] = pointerParts;
  const frozenRecord = legacy[collection]?.[Number(indexText)];
  if (
    collection !== disposition.source_collection ||
    frozenRecord === undefined ||
    sha256(Buffer.from(JSON.stringify(frozenRecord), "utf8")) !== disposition.payload_sha256
  ) {
    throw new Error(`Disposition does not match the frozen record payload for ${key}`);
  }
}
const nestedTargetRefs = new Set([
  ...concepts.flatMap((concept) => [
    ...concept.structure.fields.map((field) => `${concept.id}.${field.id}`),
    ...concept.examples.map((example) => example.id),
    ...concept.external_mappings.map((mapping) => mapping.id),
  ]),
  ...updatedModules.flatMap((module) => module.examples.map((example) => example.id)),
  ...updatedPlanes.flatMap((plane) => plane.examples.map((example) => example.id)),
  ...relations.flatMap((relation) => relation.examples.map((example) => example.id)),
  ...productEntry.value.product.examples.map((example) => example.id),
]);
const resolvableTargetRefs = new Set([...finalGraphIds, ...nestedTargetRefs]);
for (const disposition of dispositions) {
  const unresolved = disposition.target_refs.filter((targetRef) => !resolvableTargetRefs.has(targetRef));
  if (unresolved.length > 0) {
    throw new Error(
      `Disposition ${disposition.source_collection}/${disposition.id} has unresolved targets: ${unresolved.join(", ")}`,
    );
  }
  if (
    disposition.target_refs.length === 0 &&
    !/(?:remove|retire)/u.test(disposition.action)
  ) {
    throw new Error(
      `Disposition ${disposition.source_collection}/${disposition.id} action ${disposition.action} requires a target`,
    );
  }
}
if (
  dispositions.length !== 2881 ||
  dispositionKeys.size !== recordManifest.length ||
  dispositions.some(({ status }) => status !== "accepted")
) {
  throw new Error("The reviewed disposition manifest must accept all 2,881 legacy records");
}

const migrationWrites = new Map(
  sourceOutputs.map((output) => [output.path, stableJson(output.value)]),
);
const writeResearchCsv = (name, columns, rows) => {
  const path = resolve(repositoryRoot, `research/${name}`);
  migrationWrites.set(path, stringifyCsv(columns, rows));
};
writeResearchCsv(
  "ontology-concept-hierarchy-migration-ledger.csv",
  [
    "concept_id",
    "current_plane_id",
    "current_module_id",
    "current_kind",
    "decision",
    "proposed_kind",
    "primary_parent_relation_id",
    "additional_parent_relation_ids",
    "target_plane_id",
    "target_module_id",
    "target_concept_id",
    "convert_to_field_id",
    "convert_to_allowed_value_of",
    "merge_into_id",
    "replaced_by_id",
    "definition_action",
    "example_action",
    "source_action",
    "required_new_relation_ids",
    "rationale",
    "reviewer",
    "review_status",
  ],
  hierarchyRows,
);
writeResearchCsv(
  "ontology-individual-migration-ledger.csv",
  [
    "individual_id",
    "current_class_id",
    "classification",
    "target_node_id",
    "target_field_id",
    "target_example_id",
    "action",
    "rationale",
    "reviewer",
    "status",
  ],
  individualResult.rows,
);
writeResearchCsv(
  "ontology-data-property-migration-ledger.csv",
  ["data_property_id", "action", "target_node_id", "target_field_id", "rationale", "reviewer", "status"],
  dataPropertyResult.rows,
);
writeResearchCsv(
  "ontology-axiom-migration-ledger.csv",
  ["axiom_id", "action", "target_id", "rationale", "reviewer", "status"],
  axiomRows,
);
writeResearchCsv(
  "ontology-relation-migration-ledger.csv",
  [
    "relation_id",
    "action",
    "target_relation_id",
    "target_relation_ids",
    "target_mapping_id",
    "rationale",
    "reviewer",
    "status",
  ],
  relationRows,
);
writeResearchCsv(
  "ontology-adapter-mapping-migration-ledger.csv",
  ["adapter", "action", "target_node_id", "target_mapping_id", "rationale", "reviewer", "status"],
  adapterMappingResult.rows,
);
writeResearchCsv(
  "ontology-definition-migration-ledger.csv",
  ["definition_id", "action", "target_id", "rationale", "reviewer", "status"],
  definitionRows,
);
writeResearchCsv(
  "ontology-source-claim-drift-resolution-ledger.csv",
  ["entity_id", "decision", "selected_source_ids", "rejected_source_ids", "rationale", "reviewer", "status"],
  driftRows,
);
const dispositionPath = resolve(repositoryRoot, "ontology/migration/legacy-v1/disposition-manifest.json");
migrationWrites.set(
  dispositionPath,
  stableJson({
    generated: true,
    do_not_edit: true,
    baseline_sha256: expectedLegacyHash,
    reviewed_on: "2026-07-13",
    counts: {
      records: dispositions.length,
      accepted: dispositions.filter(({ status }) => status === "accepted").length,
    },
    records: dispositions,
  }),
);
if (checkOnly) {
  const stale = [];
  for (const [path, expected] of migrationWrites) {
    if (!existsSync(path)) {
      stale.push(`${relative(repositoryRoot, path).replaceAll("\\", "/")}: missing`);
      continue;
    }
    if (!readFileSync(path).equals(Buffer.from(expected))) {
      stale.push(`${relative(repositoryRoot, path).replaceAll("\\", "/")}: differs`);
    }
  }
  if (stale.length > 0) {
    throw new Error(`Reviewed migration outputs are stale:\n- ${stale.join("\n- ")}`);
  }
} else if (legacyReplay) {
  writeFileTransaction(migrationWrites);
}

console.log(
  JSON.stringify(
    {
      decisions: conceptDecisions.length,
      anchors: anchors.length,
      canonical_concepts: concepts.length,
      canonical_relations: relations.length,
      legacy_records_disposed: dispositions.length,
      mode: checkOnly ? "historical-replay-check" : "explicit-legacy-replay",
    },
    null,
    2,
  ),
);
