/**
 * Reviewed semantic boundaries and competency questions for the 47 v3 modules.
 *
 * Domain files keep each review surface below 800 lines; this index owns exact
 * coverage validation and exposes the immutable aggregate consumed by migration.
 */

import { ADAPTER_MODULE_BOUNDARIES } from "./module-boundaries/adapter.mjs";
import { FEEDBACK_MODULE_BOUNDARIES } from "./module-boundaries/feedback.mjs";
import { INFO_MODULE_BOUNDARIES } from "./module-boundaries/info.mjs";
import { MEMORY_MODULE_BOUNDARIES } from "./module-boundaries/memory.mjs";
import { ORCHESTRATION_MODULE_BOUNDARIES } from "./module-boundaries/orchestration.mjs";
import { RUNTIME_MODULE_BOUNDARIES } from "./module-boundaries/runtime.mjs";
import { SAFETY_MODULE_BOUNDARIES } from "./module-boundaries/safety.mjs";
import { TOOL_MODULE_BOUNDARIES } from "./module-boundaries/tool.mjs";
import { deepFreeze } from "./module-boundaries/deep-freeze.mjs";

export const EXPECTED_ONTOLOGY_V3_MODULE_IDS = Object.freeze([
  "adapter-benchmarks",
  "adapter-frameworks",
  "adapter-mapping-infrastructure",
  "adapter-protocols",
  "adapter-schema-export",
  "adapter-statecharts",
  "feedback-logging",
  "feedback-metrics-evaluation",
  "feedback-optimization-learning",
  "feedback-review-optimization",
  "feedback-warning-error",
  "info-container-command",
  "info-content-block-modality",
  "info-indexing",
  "info-messages-instructions",
  "info-output-disclosure",
  "info-prompts-instructions",
  "info-storage-sources",
  "memory-chunking-situating",
  "memory-context",
  "memory-embedding-indexes",
  "memory-ingestion",
  "memory-lifecycle",
  "memory-retrieval-ranking",
  "memory-stores-scopes",
  "orchestration-actors-delegation",
  "orchestration-composition",
  "orchestration-delegation-handoff",
  "orchestration-evaluation",
  "orchestration-routing-control",
  "orchestration-task-planning",
  "runtime-actors",
  "runtime-artifacts",
  "runtime-execution-attempts",
  "runtime-observability",
  "runtime-system",
  "safety-commit-redaction",
  "safety-disclosure-redaction",
  "safety-injection-defense",
  "safety-network-control",
  "safety-permission-policy",
  "safety-sandbox-network",
  "safety-trust-boundary",
  "tool-discovery-selection",
  "tool-invocation-execution",
  "tool-mcp-transport",
  "tool-registry-definition"
]);

export const ONTOLOGY_V3_MODULE_BOUNDARIES = deepFreeze({
  ...ADAPTER_MODULE_BOUNDARIES,
  ...FEEDBACK_MODULE_BOUNDARIES,
  ...INFO_MODULE_BOUNDARIES,
  ...MEMORY_MODULE_BOUNDARIES,
  ...ORCHESTRATION_MODULE_BOUNDARIES,
  ...RUNTIME_MODULE_BOUNDARIES,
  ...SAFETY_MODULE_BOUNDARIES,
  ...TOOL_MODULE_BOUNDARIES,
});

const forbiddenLocalizedProse = [
  ["legacy quoted-boundary template", /本模块在“.*”边界内/u],
  ["legacy representative-closure template", /以 .* 为代表闭包/u],
  ["legacy graph-information template", /把概念层级、语义关系和节点内信息组织成/u],
];

const assertLocalizedText = (value, path) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(path + " must be localized text");
  }
  for (const language of ["zh", "en", "ja"]) {
    if (typeof value[language] !== "string" || value[language].trim().length === 0) {
      throw new TypeError(path + "." + language + " must be a non-empty string");
    }
  }
  for (const [name, pattern] of forbiddenLocalizedProse) {
    if (pattern.test(value.zh)) throw new Error(path + " contains " + name);
  }
  if (/模块\s*[。！？!?]?$/u.test(value.zh)) {
    throw new Error(path + ".zh ends in the legacy module-label suffix");
  }
  if (/\bmodule\s*[.!?]?$/iu.test(value.en)) {
    throw new Error(path + ".en ends in the legacy module-label suffix");
  }
  if (/モジュール\s*[。！？!?]?$/u.test(value.ja)) {
    throw new Error(path + ".ja ends in the legacy module-label suffix");
  }
};

const assertString = (value, path) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(path + " must be a non-empty string");
  }
};

export const validateOntologyV3ModuleBoundaries = (
  boundaries = ONTOLOGY_V3_MODULE_BOUNDARIES,
  expectedModuleIds = EXPECTED_ONTOLOGY_V3_MODULE_IDS,
) => {
  const actualIds = Object.keys(boundaries).sort();
  const expectedIds = [...expectedModuleIds].sort();
  if (actualIds.length !== 47 || expectedIds.length !== 47) {
    throw new Error("Ontology v3 boundary configuration must cover exactly 47 modules");
  }
  if (actualIds.join("\n") !== expectedIds.join("\n")) {
    const missing = expectedIds.filter((id) => !actualIds.includes(id));
    const extra = actualIds.filter((id) => !expectedIds.includes(id));
    throw new Error("Ontology v3 module coverage mismatch; missing=" + missing.join(",") + "; extra=" + extra.join(","));
  }

  const expectedIdSet = new Set(expectedIds);
  const semanticKeys = new Set();
  const localizedQuestions = { zh: new Set(), en: new Set(), ja: new Set() };
  let questionCount = 0;
  let boundaryCount = 0;

  for (const moduleId of expectedIds) {
    const specification = boundaries[moduleId];
    assertLocalizedText(specification.purpose, moduleId + ".purpose");
    assertLocalizedText(specification.owns_when, moduleId + ".owns_when");
    assertLocalizedText(specification.references_when, moduleId + ".references_when");

    for (const field of ["includes", "excludes"]) {
      if (!Array.isArray(specification[field]) || specification[field].length < (field === "includes" ? 2 : 1)) {
        throw new Error(moduleId + "." + field + " has insufficient entries");
      }
      specification[field].forEach((text, index) => assertLocalizedText(text, moduleId + "." + field + "[" + index + "]"));
    }

    const questions = specification.competency_questions;
    if (!Array.isArray(questions) || questions.length !== 3) {
      throw new Error(moduleId + " must define exactly three competency questions");
    }
    const competencyQuestionPeers = new Set();
    questions.forEach((question, index) => {
      const path = moduleId + ".competency_questions[" + index + "]";
      assertString(question.semantic_key, path + ".semantic_key");
      if (!question.semantic_key.startsWith(moduleId + ".")) {
        throw new Error(path + ".semantic_key must be namespaced by its owner");
      }
      if (semanticKeys.has(question.semantic_key)) {
        throw new Error("Duplicate competency-question semantic key " + question.semantic_key);
      }
      semanticKeys.add(question.semantic_key);
      if (!Array.isArray(question.related_module_ids) || question.related_module_ids.length === 0) {
        throw new Error(path + ".related_module_ids must identify at least one boundary peer");
      }
      for (const relatedModuleId of question.related_module_ids) {
        if (!expectedIdSet.has(relatedModuleId) || relatedModuleId === moduleId) {
          throw new Error(path + " has an invalid related module " + relatedModuleId);
        }
        competencyQuestionPeers.add(relatedModuleId);
      }
      assertLocalizedText(question.questions, path + ".questions");
      for (const language of ["zh", "en", "ja"]) {
        if (localizedQuestions[language].has(question.questions[language])) {
          throw new Error("Repeated " + language + " competency question at " + path);
        }
        localizedQuestions[language].add(question.questions[language]);
      }
      assertString(question.query, path + ".query");
      assertString(question.expected_assertion, path + ".expected_assertion");
      if (question.query === question.expected_assertion) {
        throw new Error(path + " must distinguish query intent from expected assertion");
      }
      questionCount += 1;
    });

    if (!Array.isArray(specification.boundary_decisions) || specification.boundary_decisions.length === 0) {
      throw new Error(moduleId + " must define a primary adjacent-module boundary");
    }
    if (!Array.isArray(specification.overlap_checks) || specification.overlap_checks.length === 0) {
      throw new Error(moduleId + " must define a primary adjacent-module overlap check");
    }
    const overlapPeers = new Set(specification.overlap_checks.map(({ other_module_id: otherModuleId }) => otherModuleId));
    const boundaryPeers = new Set(specification.boundary_decisions.map(({ other_module_id: otherModuleId }) => otherModuleId));
    if (boundaryPeers.size !== specification.boundary_decisions.length) {
      throw new Error(moduleId + " has duplicate boundary-decision peers");
    }
    if (overlapPeers.size !== specification.overlap_checks.length) {
      throw new Error(moduleId + " has duplicate overlap-check peers");
    }
    if (
      boundaryPeers.size !== overlapPeers.size
      || [...boundaryPeers].some((otherModuleId) => !overlapPeers.has(otherModuleId))
    ) {
      throw new Error(moduleId + " boundary-decision and overlap-check peer sets must match exactly");
    }
    for (const relatedModuleId of competencyQuestionPeers) {
      if (!boundaryPeers.has(relatedModuleId)) {
        throw new Error(moduleId + " competency-question peer " + relatedModuleId + " has no boundary decision");
      }
      if (!overlapPeers.has(relatedModuleId)) {
        throw new Error(moduleId + " competency-question peer " + relatedModuleId + " has no overlap check");
      }
    }
    specification.boundary_decisions.forEach((decision, index) => {
      const path = moduleId + ".boundary_decisions[" + index + "]";
      if (!expectedIdSet.has(decision.other_module_id) || decision.other_module_id === moduleId) {
        throw new Error(path + " has an invalid adjacent module");
      }
      if (!expectedIdSet.has(decision.owner_module_id)) throw new Error(path + " has an invalid owner");
      if (!["owns", "references", "moves-to", "splits-with", "deprecates"].includes(decision.decision)) {
        throw new Error(path + " has an invalid decision");
      }
      if (!overlapPeers.has(decision.other_module_id)) {
        throw new Error(path + " has no matching overlap check");
      }
      assertLocalizedText(decision.rationale, path + ".rationale");
      boundaryCount += 1;
    });
    specification.overlap_checks.forEach((check, index) => {
      const path = moduleId + ".overlap_checks[" + index + "]";
      if (!expectedIdSet.has(check.other_module_id) || check.other_module_id === moduleId) {
        throw new Error(path + " has an invalid adjacent module");
      }
      if (check.result !== "distinct" || !expectedIdSet.has(check.owner_module_id)) {
        throw new Error(path + " must record an adjudicated distinct owner");
      }
      assertLocalizedText(check.semantic_area, path + ".semantic_area");
      assertLocalizedText(check.overlap_reason, path + ".overlap_reason");
      assertLocalizedText(check.disambiguation_test, path + ".disambiguation_test");
    });
  }

  if (questionCount !== 141 || semanticKeys.size !== 141) {
    throw new Error("Ontology v3 boundary configuration must contain 141 unique competency questions");
  }
  return Object.freeze({
    module_count: actualIds.length,
    competency_question_count: questionCount,
    boundary_decision_count: boundaryCount,
  });
};

export const ontologyV3ModuleBoundaries = ONTOLOGY_V3_MODULE_BOUNDARIES;
export const expectedOntologyV3ModuleIds = EXPECTED_ONTOLOGY_V3_MODULE_IDS;
export const ontologyV3ModuleBoundaryValidation = validateOntologyV3ModuleBoundaries();
