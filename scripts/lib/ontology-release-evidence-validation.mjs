import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseCsv } from "./csv.mjs";
import { reviewedRelationChangesForConcept } from "../data/ontology-v3-reviewed-relation-replacements.mjs";
import { loadFrozenV2SemanticBaseline } from "./ontology-v2-semantic-baseline.mjs";
import { reviewedConceptHistoryDecision } from "./ontology-v3-concept-history.mjs";
import { assertObjectEvidenceQuality } from "./ontology-v3-object-evidence.mjs";
import {
  ontologyValidationErrorCodes,
  validationError,
} from "./ontology-validation-error.mjs";

export const ontologyReleaseEvidencePaths = Object.freeze([
  "research/ontology-concept-semantic-depth-v3-ledger.csv",
  "research/ontology-module-boundary-v3.csv",
  "research/ontology-module-cq-v3.csv",
  "research/source-registry.csv",
  "research/living-source-metadata.csv",
]);

export const loadReleaseEvidence = ({ repositoryRoot, required = false }) => {
  const entries = ontologyReleaseEvidencePaths.flatMap((relativePath) => {
    const path = resolve(repositoryRoot, relativePath);
    return existsSync(path)
      ? [{ path, relativePath, bytes: readFileSync(path) }]
      : [];
  });
  if (entries.length !== 0 && entries.length !== ontologyReleaseEvidencePaths.length) {
    const found = new Set(entries.map(({ relativePath }) => relativePath));
    const missing = ontologyReleaseEvidencePaths.filter((path) => !found.has(path));
    throw validationError(
      ontologyValidationErrorCodes.releaseEvidenceInvalid,
      `Release evidence set is incomplete; missing ${missing.join(", ")}`,
    );
  }
  if (required && entries.length !== ontologyReleaseEvidencePaths.length) {
    throw validationError(
      ontologyValidationErrorCodes.releaseEvidenceInvalid,
      `Release requires all reviewed evidence files: ${ontologyReleaseEvidencePaths.join(", ")}`,
    );
  }

  for (const entry of entries) {
    if (entry.bytes.length === 0) {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `Release evidence ${entry.relativePath} is empty`,
      );
    }
  }

  const rowsByPath = new Map();
  for (const entry of entries.slice(0, 3)) {
    const rows = parseCsv(entry.bytes);
    if (rows.length === 0) {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `Release evidence ${entry.relativePath} is empty`,
      );
    }
    const pending = rows.filter(({ review_status: reviewStatus }) => reviewStatus !== "accepted");
    if (pending.length > 0) {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `Release evidence ${entry.relativePath} contains ${pending.length} non-accepted rows`,
      );
    }
    rowsByPath.set(entry.relativePath, rows);
  }
  return { entries, rowsByPath };
};

const splitEvidenceIds = (value) =>
  typeof value === "string" && value.length > 0
    ? value.split("|").filter(Boolean).sort()
    : [];

const duplicateColumnValues = (rows, column) => {
  const sortedValues = rows.map((row) => row[column]).sort();
  return [...new Set(
    sortedValues.filter((value, index) => index > 0 && value === sortedValues[index - 1]),
  )];
};

const assertEvidenceSetMatches = ({ label, rows, column, expectedValues }) => {
  const duplicates = duplicateColumnValues(rows, column);
  if (duplicates.length > 0) {
    throw validationError(
      ontologyValidationErrorCodes.releaseEvidenceInvalid,
      `${label} contains duplicate ${column} values: ${duplicates.join(", ")}`,
    );
  }
  const actual = new Set(rows.map((row) => row[column]));
  const expected = new Set(expectedValues);
  const missing = [...expected].filter((value) => !actual.has(value)).sort();
  const unexpected = [...actual].filter((value) => !expected.has(value)).sort();
  if (missing.length > 0 || unexpected.length > 0) {
    throw validationError(
      ontologyValidationErrorCodes.releaseEvidenceInvalid,
      `${label} does not mirror source ${column} values; missing [${missing.join(", ")}], unexpected [${unexpected.join(", ")}]`,
    );
  }
};

const conceptLedgerKeyColumns = Object.freeze([
  "concept_id",
  "current_domain_id",
  "current_module_id",
  "current_label_zh",
  "current_semantic_kind",
  "current_primary_parent_relation_id",
  "current_depth",
  "current_root_status",
  "lexical_family",
  "definition_family",
  "decision",
  "target_domain_id",
  "target_module_id",
  "proposed_label_zh",
  "proposed_semantic_kind",
  "proposed_primary_parent_relation_id",
  "proposed_backbone_relation_id",
  "convert_to_field_of",
  "convert_to_allowed_value_of",
  "merge_into_id",
  "split_into_ids",
  "required_relation_changes",
  "owner_rationale",
  "source_ids",
  "positive_example_id",
  "boundary_example_id",
  "domain_reviewer",
  "ontology_reviewer",
  "language_reviewer",
  "review_status",
]);

const reviewedReplacementFields = ({ concept, decision }) => {
  const replacementConceptIds = [...(concept.replaced_by_ids ?? [])].sort();
  const splitIntoIds = decision.splitIntoIds ??
    (replacementConceptIds.length > 1 ? replacementConceptIds : []);
  const mergeIntoId = decision.mergeIntoId ??
    (replacementConceptIds.length === 1 && splitIntoIds.length === 0
      ? replacementConceptIds[0]
      : "");
  return { mergeIntoId, replacementConceptIds, splitIntoIds };
};

export const expectedConceptLedgerRelationChanges = ({
  conceptId,
  decision,
  replacementConceptIds,
}) => {
  const reviewedRelationChanges = reviewedRelationChangesForConcept(conceptId);
  if (reviewedRelationChanges.length > 0) return reviewedRelationChanges.join("|");
  if (decision === "add") return "new reviewed concept; no v2 record to migrate";
  if (["reparent", "move_owner"].includes(decision)) {
    return "owner/backbone updated in source";
  }
  return replacementConceptIds.length > 0
    ? `deprecated references migrate to ${replacementConceptIds.join("|")}`
    : "reviewed without relation replacement";
};

const assertAcceptedConceptTargets = ({ concept, ids, conceptById, column }) => {
  for (const targetId of ids) {
    const target = conceptById.get(targetId);
    if (!target || target.status !== "accepted") {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `Concept ledger row ${concept.id} ${column} references non-accepted Concept ${targetId}`,
      );
    }
  }
};

export const validateConceptLedgerMirrorsSources = ({
  rows,
  modules,
  classes,
  relations,
  baseline = loadFrozenV2SemanticBaseline(),
}) => {
  const ledgerPath = ontologyReleaseEvidencePaths[0];
  assertEvidenceSetMatches({
    label: ledgerPath,
    rows,
    column: "concept_id",
    expectedValues: classes.map(({ id }) => id),
  });

  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const conceptById = new Map(classes.map((concept) => [concept.id, concept]));
  const primaryBackboneByChild = new Map(
    relations
      .filter(
        ({ status, layout_role: layoutRole }) =>
          status === "accepted" && layoutRole === "primary-backbone",
      )
      .map((relation) => [relation.layout_child_id, relation.id]),
  );

  for (const row of rows) {
    for (const column of conceptLedgerKeyColumns) {
      if (!Object.hasOwn(row, column)) {
        throw validationError(
          ontologyValidationErrorCodes.releaseEvidenceInvalid,
          `${ledgerPath} row ${row.concept_id} is missing key column ${column}`,
        );
      }
    }
    const concept = conceptById.get(row.concept_id);
    const module = moduleById.get(concept.module_id);
    const before = baseline.concepts.get(concept.id);
    const decision = reviewedConceptHistoryDecision({
      concept,
      baselineConcept: before,
    });
    const { mergeIntoId, replacementConceptIds, splitIntoIds } =
      reviewedReplacementFields({ concept, decision });
    const domainReviewer = concept.review?.reviewers?.find(
      ({ reviewer_role: reviewerRole }) => reviewerRole === "domain",
    )?.reviewer_id ?? "";
    const ontologyReviewer = concept.review?.reviewers?.find(
      ({ reviewer_role: reviewerRole }) => reviewerRole === "ontology",
    )?.reviewer_id ?? "";
    const expected = {
      current_domain_id: before ? baseline.modulePlane.get(before.module_id) ?? "" : "",
      current_module_id: before?.module_id ?? "",
      current_label_zh: before?.labels.zh ?? "",
      current_semantic_kind: before?.semantic_kind ?? "",
      current_primary_parent_relation_id: before?.primary_parent_relation_id ?? "",
      current_depth: before ? String(baseline.depths.get(concept.id)) : "",
      current_root_status: before
        ? before.primary_parent_relation_id
          ? ""
          : "unreviewed-v2-root"
        : "",
      lexical_family: concept.labels.zh.replace(
        /[角色活动事件记录结果规则规范集合对象]/gu,
        "",
      ),
      definition_family: concept.semantic_kind,
      decision: decision.decision,
      target_domain_id: module.plane_id,
      target_module_id: concept.module_id,
      proposed_label_zh: concept.labels.zh,
      proposed_semantic_kind: concept.semantic_kind,
      proposed_primary_parent_relation_id: concept.primary_parent_relation_id ?? "",
      proposed_backbone_relation_id: primaryBackboneByChild.get(concept.id) ?? "",
      convert_to_field_of: decision.convertToFieldOf ?? "",
      convert_to_allowed_value_of: decision.convertToAllowedValueOf ?? "",
      merge_into_id: mergeIntoId,
      split_into_ids: splitIntoIds.join("|"),
      required_relation_changes: expectedConceptLedgerRelationChanges({
        conceptId: concept.id,
        decision: decision.decision,
        replacementConceptIds,
      }),
      owner_rationale: `${module.labels.zh}按 identity、semantic kind 和主问题唯一拥有该概念。`,
      source_ids: (concept.source_claims ?? [])
        .map(({ source_id: sourceId }) => sourceId)
        .sort()
        .join("|"),
      positive_example_id:
        concept.examples?.find(({ kind }) => kind === "positive")?.id ?? "",
      boundary_example_id:
        concept.examples?.find(({ kind }) => ["boundary", "counterexample"].includes(kind))
          ?.id ?? "",
      domain_reviewer: domainReviewer,
      ontology_reviewer: ontologyReviewer,
      language_reviewer: "moonweave-trilingual-terminology-reviewer",
      review_status: concept.review?.review_status ?? "",
    };

    for (const [column, expectedValue] of Object.entries(expected)) {
      if (row[column] !== expectedValue) {
        throw validationError(
          ontologyValidationErrorCodes.releaseEvidenceInvalid,
          `${ledgerPath} row ${concept.id} ${column} does not mirror source; expected ${JSON.stringify(expectedValue)}, found ${JSON.stringify(row[column])}`,
        );
      }
    }
    assertAcceptedConceptTargets({
      concept,
      ids: [
        decision.convertToFieldOf,
        decision.convertToAllowedValueOf,
        mergeIntoId,
        ...splitIntoIds,
      ].filter(Boolean),
      conceptById,
      column: "migration target",
    });
    for (const replacementId of replacementConceptIds) {
      if (![mergeIntoId, ...splitIntoIds].includes(replacementId)) {
        throw validationError(
          ontologyValidationErrorCodes.releaseEvidenceInvalid,
          `${ledgerPath} row ${concept.id} does not represent source replaced_by_id ${replacementId} in merge_into_id or split_into_ids`,
        );
      }
    }

    if (!before && decision.decision !== "add") {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `${ledgerPath} row ${concept.id} is absent from frozen v2 and must use decision add`,
      );
    }
    if (before && decision.decision === "add") {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `${ledgerPath} row ${concept.id} exists in frozen v2 and cannot use decision add`,
      );
    }
  }
};

export const validateReleaseEvidenceMirrorsSources = ({
  releaseEvidence,
  modules,
  classes,
  relations,
  semanticBaseline,
  releaseChannel,
}) => {
  if (releaseEvidence.entries.length === 0) {
    if (releaseChannel === "release") {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `Release requires all reviewed evidence files: ${ontologyReleaseEvidencePaths.join(", ")}`,
      );
    }
    return;
  }

  const [conceptLedgerPath, moduleLedgerPath, competencyQuestionLedgerPath] =
    ontologyReleaseEvidencePaths;
  const conceptRows = releaseEvidence.rowsByPath.get(conceptLedgerPath) ?? [];
  const moduleRows = releaseEvidence.rowsByPath.get(moduleLedgerPath) ?? [];
  const competencyQuestionRows =
    releaseEvidence.rowsByPath.get(competencyQuestionLedgerPath) ?? [];

  validateConceptLedgerMirrorsSources({
    rows: conceptRows,
    modules,
    classes,
    relations,
    baseline: semanticBaseline,
  });
  assertEvidenceSetMatches({
    label: moduleLedgerPath,
    rows: moduleRows,
    column: "module_id",
    expectedValues: modules.map(({ id }) => id),
  });

  const sourceQuestions = modules.flatMap((module) =>
    (module.competency_questions ?? []).map((question) => ({
      ...question,
      containingModuleId: module.id,
    })),
  );
  assertEvidenceSetMatches({
    label: competencyQuestionLedgerPath,
    rows: competencyQuestionRows,
    column: "semantic_key",
    expectedValues: sourceQuestions.map(({ semantic_key: semanticKey }) => semanticKey),
  });
  const duplicateQuestionIds = duplicateColumnValues(competencyQuestionRows, "cq_id");
  if (duplicateQuestionIds.length > 0) {
    throw validationError(
      ontologyValidationErrorCodes.releaseEvidenceInvalid,
      `${competencyQuestionLedgerPath} contains duplicate cq_id values: ${duplicateQuestionIds.join(", ")}`,
    );
  }

  const rowBySemanticKey = new Map(
    competencyQuestionRows.map((row) => [row.semantic_key, row]),
  );
  for (const question of sourceQuestions) {
    const row = rowBySemanticKey.get(question.semantic_key);
    const sourceRelatedModules = [...question.related_module_ids].sort();
    if (
      row.cq_id !== question.id ||
      row.primary_owner_module_id !== question.primary_owner_module_id ||
      row.primary_owner_module_id !== question.containingModuleId ||
      JSON.stringify(splitEvidenceIds(row.related_module_ids)) !==
        JSON.stringify(sourceRelatedModules)
    ) {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `${competencyQuestionLedgerPath} row ${question.semantic_key} does not mirror its source CQ id, owner, or related modules`,
      );
    }
  }

  const rowByModuleId = new Map(moduleRows.map((row) => [row.module_id, row]));
  for (const module of modules) {
    const ledgerQuestionIds = splitEvidenceIds(rowByModuleId.get(module.id).primary_cq_ids);
    const sourceQuestionIds = (module.competency_questions ?? [])
      .map(({ id }) => id)
      .sort();
    if (JSON.stringify(ledgerQuestionIds) !== JSON.stringify(sourceQuestionIds)) {
      throw validationError(
        ontologyValidationErrorCodes.releaseEvidenceInvalid,
        `${moduleLedgerPath} row ${module.id} does not mirror source primary CQ IDs`,
      );
    }
  }
};

export const validateReleaseObjectEvidence = ({ canonical, releaseEvidence }) => {
  if ((releaseEvidence?.entries ?? []).length === 0) return null;
  return assertObjectEvidenceQuality(canonical);
};
