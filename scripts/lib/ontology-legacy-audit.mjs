import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import { parseCsv } from "./csv.mjs";
import { validateOntologyDecisionBundles } from "./ontology-decision-validation.mjs";

export const legacyMigrationAuditAnchors = Object.freeze({
  frozenLegacySha256:
    "344b64a3cb2a2e14eefbfc499be6989f4944ec4d4757fc7e7738c1795bd2d91c",
  freezeManifestSha256:
    "438484fc4d0ab4b3e76c60c186e164a30d3b448ce7b0504a0460577e3265d388",
  recordManifestSha256:
    "fdff8b0e158346c195a5de11345b1a66931eb8369c4d2fb7a7756dae64e9c61e",
  dispositionManifestSha256:
    "51bdc4a39761b79482ec8e956e455adbea086b62af575e0dd3ad9d9f26acd911",
  domainDecisionTreeSha256:
    "6fe6d0406a510c835bd787ade7b0034a92de977b902cdf659ae246f9e744f95c",
  decisionConvergenceSha256:
    "e23bbf6165d163e6c672c80d133a296755a29bfe574dd2e7ad64fb22761cccdc",
  legacyRecordCount: 2881,
  conceptDecisionCount: 572,
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const listJsonFiles = (root) =>
  readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory()
        ? listJsonFiles(path)
        : entry.name.endsWith(".json")
          ? [path]
          : [];
    })
    .sort((left, right) => left.localeCompare(right));

const hashFileTree = (root, files) => {
  const hash = createHash("sha256");
  for (const path of files) {
    hash.update(relative(root, path).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return hash.digest("hex");
};

const recordKey = (record) =>
  `${record.source_collection}\0${record.id}\0${record.original_json_pointer}`;

const decodePointerToken = (token) => token.replaceAll("~1", "/").replaceAll("~0", "~");

const valueAtJsonPointer = (document, pointer) => {
  if (pointer === "") return document;
  if (typeof pointer !== "string" || !pointer.startsWith("/")) {
    throw new Error(`Invalid legacy JSON pointer ${String(pointer)}`);
  }
  let value = document;
  for (const token of pointer.slice(1).split("/").map(decodePointerToken)) {
    if (value === null || value === undefined || !Object.hasOwn(value, token)) {
      throw new Error(`Legacy JSON pointer ${pointer} does not resolve`);
    }
    value = value[token];
  }
  return value;
};

export const assertRecordManifestIntegrity = ({
  legacy,
  recordManifest,
  expectedRecordCount = legacyMigrationAuditAnchors.legacyRecordCount,
}) => {
  if (!Array.isArray(recordManifest) || recordManifest.length !== expectedRecordCount) {
    throw new Error(
      `Legacy record manifest must contain ${expectedRecordCount} records; found ${recordManifest?.length ?? "invalid"}`,
    );
  }
  const keys = new Set();
  for (const record of recordManifest) {
    const key = recordKey(record);
    if (keys.has(key)) throw new Error(`Duplicate legacy record manifest entry ${key}`);
    keys.add(key);
    const pointerCollection = record.original_json_pointer
      ?.split("/")
      .slice(1, 2)
      .map(decodePointerToken)[0];
    if (pointerCollection !== record.source_collection) {
      throw new Error(
        `Legacy record ${key} points into ${pointerCollection ?? "an invalid collection"}`,
      );
    }
    const frozenRecord = valueAtJsonPointer(legacy, record.original_json_pointer);
    const actualHash = sha256(Buffer.from(JSON.stringify(frozenRecord), "utf8"));
    if (actualHash !== record.payload_sha256) {
      throw new Error(
        `Legacy record ${key} payload hash drifted: expected ${record.payload_sha256}, received ${actualHash}`,
      );
    }
  }
  return keys;
};

export const collectSourceTargetRefs = (sourceDocuments) => {
  const targetRefs = new Set();
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (typeof value.id === "string" && value.id.trim()) targetRefs.add(value.id);
    for (const child of Object.values(value)) visit(child);
  };
  sourceDocuments.forEach(visit);

  for (const document of sourceDocuments) {
    for (const concept of document.classes ?? []) {
      for (const field of concept.structure?.fields ?? []) {
        targetRefs.add(`${concept.id}.${field.id}`);
      }
    }
    for (const relation of document.relations ?? []) {
      targetRefs.add(
        `${relation.source_id}-${relation.predicate}-${relation.target_id}`,
      );
    }
  }
  return targetRefs;
};

export const assertDispositionManifestIntegrity = ({
  dispositionManifest,
  recordManifest,
  sourceTargetRefs,
  expectedBaselineSha256 = legacyMigrationAuditAnchors.frozenLegacySha256,
  expectedRecordCount = legacyMigrationAuditAnchors.legacyRecordCount,
}) => {
  if (dispositionManifest.baseline_sha256 !== expectedBaselineSha256) {
    throw new Error("Legacy disposition manifest is anchored to the wrong frozen baseline");
  }
  if (
    dispositionManifest.counts?.records !== expectedRecordCount ||
    dispositionManifest.counts?.accepted !== expectedRecordCount ||
    dispositionManifest.records?.length !== expectedRecordCount
  ) {
    throw new Error(
      `Legacy disposition manifest must accept all ${expectedRecordCount} records`,
    );
  }
  const manifestByKey = new Map(recordManifest.map((record) => [recordKey(record), record]));
  const dispositionKeys = new Set();
  const unresolved = [];
  for (const disposition of dispositionManifest.records) {
    const key = recordKey(disposition);
    if (dispositionKeys.has(key)) {
      throw new Error(`Duplicate legacy disposition ${key}`);
    }
    dispositionKeys.add(key);
    const manifestRecord = manifestByKey.get(key);
    if (!manifestRecord || manifestRecord.payload_sha256 !== disposition.payload_sha256) {
      throw new Error(`Legacy disposition ${key} does not match its frozen record`);
    }
    if (
      disposition.status !== "accepted" ||
      typeof disposition.reviewer !== "string" ||
      !disposition.reviewer.trim() ||
      typeof disposition.action !== "string" ||
      !disposition.action.trim() ||
      !Array.isArray(disposition.target_refs)
    ) {
      throw new Error(`Legacy disposition ${key} is not a complete accepted review`);
    }
    for (const targetRef of disposition.target_refs) {
      if (!sourceTargetRefs.has(targetRef)) unresolved.push(`${key} -> ${targetRef}`);
    }
    if (
      disposition.target_refs.length === 0 &&
      !/(?:remove|retire)/u.test(disposition.action)
    ) {
      throw new Error(
        `Legacy disposition ${key} action ${disposition.action} requires a current-source target`,
      );
    }
  }
  const missing = [...manifestByKey.keys()].filter((key) => !dispositionKeys.has(key));
  if (missing.length > 0) {
    throw new Error(`Legacy dispositions are missing frozen records: ${missing.join(", ")}`);
  }
  if (unresolved.length > 0) {
    throw new Error(
      `Legacy dispositions have unresolved current-source targets: ${unresolved.join(", ")}`,
    );
  }
  return dispositionKeys;
};

const relationFactId = ({ source_id: sourceId, predicate, target_id: targetId }) =>
  [sourceId, predicate, targetId].every((value) => typeof value === "string" && value)
    ? `${sourceId}-${predicate}-${targetId}`
    : null;

export const assertDecisionTargetsResolve = ({
  bundles,
  sourceTargetRefs,
  convergenceMappings = [],
}) => {
  const requiredRefs = [];
  const convergenceByLegacyFact = new Map();
  for (const mapping of convergenceMappings) {
    if (
      convergenceByLegacyFact.has(mapping.legacy_fact_id) ||
      !Array.isArray(mapping.target_relation_ids) ||
      mapping.target_relation_ids.length === 0
    ) {
      throw new Error(`Invalid domain-decision convergence mapping ${mapping.legacy_fact_id}`);
    }
    convergenceByLegacyFact.set(mapping.legacy_fact_id, mapping.target_relation_ids);
  }
  const usedConvergenceFacts = new Set();
  const retainedKinds = new Set([
    "keep_root",
    "keep_reparent",
    "retype",
    "move_owner",
    "deprecate",
  ]);
  for (const bundle of bundles) {
    for (const decision of bundle.concept_decisions ?? []) {
      requiredRefs.push(decision.target_module_id);
      if (retainedKinds.has(decision.decision)) requiredRefs.push(decision.concept_id);
      requiredRefs.push(
        decision.primary_parent_id,
        ...(decision.additional_parent_ids ?? []),
        decision.target_concept_id,
      );
      if (decision.target_field_id) {
        const localFieldId = decision.target_field_id.split(".").at(-1);
        requiredRefs.push(
          `${decision.target_concept_id}.${localFieldId}`,
        );
      }
    }
    for (const anchor of bundle.new_anchors ?? []) {
      requiredRefs.push(anchor.id, anchor.module_id, ...(anchor.parent_ids ?? []));
    }
    for (const moduleReview of bundle.modules ?? []) {
      requiredRefs.push(moduleReview.module_id);
      for (const relation of moduleReview.semantic_relations ?? []) {
        const legacyFactId = relationFactId(relation);
        requiredRefs.push(
          relation.source_id,
          relation.target_id,
        );
        if (sourceTargetRefs.has(legacyFactId)) requiredRefs.push(legacyFactId);
        else {
          const convergedTargets = convergenceByLegacyFact.get(legacyFactId);
          if (!convergedTargets) requiredRefs.push(legacyFactId);
          else {
            requiredRefs.push(...convergedTargets);
            usedConvergenceFacts.add(legacyFactId);
          }
        }
      }
    }
  }
  const unusedConvergenceFacts = [...convergenceByLegacyFact.keys()].filter(
    (legacyFactId) => !usedConvergenceFacts.has(legacyFactId),
  );
  if (unusedConvergenceFacts.length > 0) {
    throw new Error(
      `Domain-decision convergence mappings do not match reviewed facts: ${unusedConvergenceFacts.join(", ")}`,
    );
  }
  const unresolved = [
    ...new Set(
      requiredRefs.filter(
        (targetRef) => typeof targetRef === "string" && !sourceTargetRefs.has(targetRef),
      ),
    ),
  ].sort();
  if (unresolved.length > 0) {
    throw new Error(
      `Reviewed legacy decisions have unresolved current-source targets: ${unresolved.join(", ")}`,
    );
  }
};

const assertFrozenRelease = ({ frozenLegacyRoot }) => {
  const freezeManifestPath = resolve(frozenLegacyRoot, "freeze-manifest.json");
  const freezeManifestBytes = readFileSync(freezeManifestPath);
  if (sha256(freezeManifestBytes) !== legacyMigrationAuditAnchors.freezeManifestSha256) {
    throw new Error("The frozen v1 release manifest changed from its reviewed SHA-256 anchor");
  }
  const freezeManifest = JSON.parse(freezeManifestBytes.toString("utf8"));
  for (const artifact of freezeManifest.artifacts ?? []) {
    const actualHash = sha256(readFileSync(resolve(frozenLegacyRoot, artifact.path)));
    if (actualHash !== artifact.sha256) {
      throw new Error(
        `Frozen v1 artifact ${artifact.path} changed: expected ${artifact.sha256}, received ${actualHash}`,
      );
    }
  }
  const legacyPath = resolve(frozenLegacyRoot, "ontology/agent-ontology.json");
  const legacyBytes = readFileSync(legacyPath);
  const legacyHash = sha256(legacyBytes);
  if (legacyHash !== legacyMigrationAuditAnchors.frozenLegacySha256) {
    throw new Error("The frozen v1 canonical artifact changed from its reviewed SHA-256 anchor");
  }
  return { legacy: JSON.parse(legacyBytes.toString("utf8")), legacyHash };
};

export const auditLegacyMigration = ({ repositoryRoot }) => {
  const migrationRoot = resolve(repositoryRoot, "ontology/migration/legacy-v1");
  const frozenLegacyRoot = resolve(migrationRoot, "frozen-release");
  const { legacy, legacyHash } = assertFrozenRelease({ frozenLegacyRoot });

  const recordManifestPath = resolve(migrationRoot, "record-manifest.json");
  const recordManifestBytes = readFileSync(recordManifestPath);
  if (sha256(recordManifestBytes) !== legacyMigrationAuditAnchors.recordManifestSha256) {
    throw new Error("The v1 record manifest changed from its reviewed SHA-256 anchor");
  }
  const recordManifest = JSON.parse(recordManifestBytes.toString("utf8"));
  assertRecordManifestIntegrity({ legacy, recordManifest });

  const sourceRoot = resolve(repositoryRoot, "ontology/source");
  const sourceFiles = listJsonFiles(sourceRoot);
  const sourceDocuments = sourceFiles.map(readJson);
  const productCount = sourceDocuments.filter(
    ({ source_kind: sourceKind }) => sourceKind === "agent-ontology-product",
  ).length;
  const moduleCount = sourceDocuments.filter(
    ({ source_kind: sourceKind }) => sourceKind === "agent-ontology-module",
  ).length;
  if (productCount !== 1 || moduleCount !== 41) {
    throw new Error(
      `Current source tree must contain one product and 41 Module documents; found ${productCount}/${moduleCount}`,
    );
  }
  const sourceTargetRefs = collectSourceTargetRefs(sourceDocuments);
  const dispositionManifestPath = resolve(migrationRoot, "disposition-manifest.json");
  const dispositionManifestBytes = readFileSync(dispositionManifestPath);
  if (
    sha256(dispositionManifestBytes) !==
    legacyMigrationAuditAnchors.dispositionManifestSha256
  ) {
    throw new Error("The accepted v1 disposition manifest changed from its reviewed SHA-256 anchor");
  }
  const dispositionManifest = JSON.parse(dispositionManifestBytes.toString("utf8"));
  assertDispositionManifestIntegrity({
    dispositionManifest,
    recordManifest,
    sourceTargetRefs,
  });

  const decisionRoot = resolve(migrationRoot, "domain-decisions");
  const decisionFiles = listJsonFiles(decisionRoot);
  if (
    hashFileTree(decisionRoot, decisionFiles) !==
    legacyMigrationAuditAnchors.domainDecisionTreeSha256
  ) {
    throw new Error("The 572 reviewed v1 Concept decisions changed from their SHA-256 anchor");
  }
  const bundles = decisionFiles.map(readJson);
  const sourceRegistryRows = parseCsv(
    readFileSync(resolve(repositoryRoot, "research/source-registry.csv")),
  );
  const decisionResult = validateOntologyDecisionBundles({
    legacy,
    bundles,
    sourceIds: sourceRegistryRows.map(({ id }) => id),
  });
  if (decisionResult.conceptDecisionCount !== legacyMigrationAuditAnchors.conceptDecisionCount) {
    throw new Error(
      `Reviewed legacy decisions must cover ${legacyMigrationAuditAnchors.conceptDecisionCount} Concepts`,
    );
  }
  const convergenceAuditPath = resolve(
    migrationRoot,
    "domain-decision-convergence.json",
  );
  const convergenceAuditBytes = readFileSync(convergenceAuditPath);
  if (
    sha256(convergenceAuditBytes) !==
    legacyMigrationAuditAnchors.decisionConvergenceSha256
  ) {
    throw new Error("The domain-decision convergence audit changed from its SHA-256 anchor");
  }
  const convergenceAudit = JSON.parse(convergenceAuditBytes.toString("utf8"));
  if (
    convergenceAudit.artifact_kind !== "legacy-domain-decision-convergence-audit" ||
    convergenceAudit.status !== "accepted" ||
    convergenceAudit.do_not_edit !== true
  ) {
    throw new Error("Legacy domain-decision convergence audit is not accepted and frozen");
  }
  assertDecisionTargetsResolve({
    bundles,
    sourceTargetRefs,
    convergenceMappings: convergenceAudit.mappings,
  });

  return Object.freeze({
    frozenLegacySha256: legacyHash,
    legacyRecordCount: recordManifest.length,
    acceptedDispositionCount: dispositionManifest.counts.accepted,
    conceptDecisionCount: decisionResult.conceptDecisionCount,
    moduleDecisionCount: decisionResult.moduleReviewCount,
    currentSourceDocumentCount: sourceFiles.length,
    currentSourceTargetCount: sourceTargetRefs.size,
    unresolvedTargetCount: 0,
    auditedSourceRoot: relative(repositoryRoot, sourceRoot).replaceAll("\\", "/"),
  });
};
