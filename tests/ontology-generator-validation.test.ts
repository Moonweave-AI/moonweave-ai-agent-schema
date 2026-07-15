import { createHash } from "node:crypto";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import Ajv2020, { type AnySchema } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { afterEach, describe, expect, it } from "vitest";

import {
  generateCanonicalMarkdown,
  generateCanonicalTypes,
} from "../scripts/lib/ontology-build-artifacts.mjs";
import {
  loadAndValidateSources,
  mergeAndValidateCanonical,
} from "../scripts/lib/ontology-build-validation.mjs";
import { parseCsv, parseCsvLine, stringifyCsv } from "../scripts/lib/csv.mjs";
import {
  deterministicGeneratedAt,
  ONTOLOGY_GENERATOR_VERSION,
} from "../scripts/lib/generation-metadata.mjs";
import { finalizeCanonicalWithMetrics } from "../scripts/lib/ontology-semantic-depth-validation.mjs";

import {
  artifactContractPath,
  builderPath,
  canonicalPath,
  clone,
  cloneRelationWithIdentity,
  collectKeys,
  createWorkspace,
  derivedMetrics,
  diagnostics,
  expectBuildFailure,
  expectSameSnapshot,
  expectedCandidateFiles,
  generatedSchemaPath,
  legacyTopLevelFields,
  listFiles,
  migrationPayloadFields,
  publishedCanonicalPath,
  readCandidate,
  readJson,
  relativeFiles,
  releaseEvidencePaths,
  repositoryRoot,
  requireSuccessfulBuild,
  runBuilder,
  sha256,
  stableJson,
  treeSnapshot,
  writeReleaseEvidence,
  type CandidateArtifact,
  type JsonObject,
  type ModuleSource,
  type TestWorkspace,
} from "./helpers/ontology-generator-workspace";

describe("deterministic ontology builder validation gates", () => {
  describe.runIf(existsSync(builderPath))("semantic build failures", () => {
    const firstConceptWithFields = (module: ModuleSource) =>
      module.classes[0] as unknown as JsonObject & {
        structure: {
          fields: Array<JsonObject & {
            id: string;
            datatype: string;
            cardinality: { min: number; max: number | null };
          }>;
        };
        examples: Array<
          JsonObject & {
            kind: string;
            field_values: Record<string, unknown>;
          }
        >;
      };

    it("fails accepted concepts whose reviewed information is missing", () => {
      const workspace = createWorkspace(({ module }) => {
        module.classes[0].source_claims = [];
      });

      expectBuildFailure(workspace, /InvocationAttempt|source_claims|reviewed information/iu);
    });

    it("fails when an accepted evidence ledger is not a double-set mirror of source", () => {
      const workspace = createWorkspace();
      writeReleaseEvidence(workspace, { conceptIds: [workspace.module.classes[0].id] });

      expectBuildFailure(
        workspace,
        /ontology-concept-semantic-depth-v3-ledger.*does not mirror source.*ToolCallAttempt/iu,
      );
    });

    it("fails duplicate normalized facts even when relation IDs differ", () => {
      const workspace = createWorkspace(({ module }) => {
        module.relations.push(
          cloneRelationWithIdentity(module.relations[0], "duplicate-is-a-fact"),
        );
      });

      expectBuildFailure(workspace, /duplicate.*fact|normalized fact/iu);
    });

    it("permits only an empty deprecated lineage alias that points to its accepted fact", () => {
      const workspace = createWorkspace(({ module }) => {
        const accepted = module.relations[0];
        const alias = cloneRelationWithIdentity(accepted, "legacy-tool-attempt-is-a");
        alias.status = "deprecated";
        alias.layout_role = "cross-link";
        alias.layout_parent_id = null;
        alias.layout_child_id = null;
        alias.examples = [];
        alias.deprecated_in = "https://moonweave.ai/ontology/agent-system/2.0.0/";
        alias.replaced_by_ids = [accepted.id];
        alias.deprecation_reason = {
          zh: "旧关系 ID 仅保留迁移追溯。",
          en: "The legacy relation ID is retained only for migration traceability.",
          ja: "旧関係 ID は移行の追跡可能性だけのために保持されます。",
        };
        module.relations.push(alias);
      });

      requireSuccessfulBuild(workspace);
    });

    it("does not exempt a deprecated duplicate that fails the lineage-alias contract", () => {
      const workspace = createWorkspace(({ module }) => {
        const accepted = module.relations[0];
        const duplicate = cloneRelationWithIdentity(accepted, "legacy-unlinked-duplicate");
        duplicate.status = "deprecated";
        duplicate.examples = [];
        duplicate.deprecated_in = "https://moonweave.ai/ontology/agent-system/2.0.0/";
        duplicate.replaced_by_ids = [];
        duplicate.deprecation_reason = {
          zh: "没有指向已接受替代项。",
          en: "No accepted replacement is declared.",
          ja: "承認済みの置換先が宣言されていません。",
        };
        module.relations.push(duplicate);
      });

      expectBuildFailure(workspace, /duplicate.*fact|normalized fact/iu);
    });

    it("fails duplicate IDs within and across canonical entity kinds", () => {
      const duplicateConcept = createWorkspace(({ module }) => {
        const duplicate = clone(module.classes[0]);
        duplicate.labels = {
          ...(duplicate.labels as JsonObject),
          en: "Duplicate invocation attempt",
        };
        module.classes.push(duplicate);
      });
      expectBuildFailure(duplicateConcept, /Concept IDs are not unique.*InvocationAttempt/iu);

      const crossKindDuplicate = createWorkspace(({ module }) => {
        module.module.id = "InvocationAttempt";
      });
      expectBuildFailure(crossKindDuplicate, /node IDs collide across kinds.*InvocationAttempt/iu);
    });

    it("fails when an is_a cycle is introduced", () => {
      const workspace = createWorkspace(({ module }) => {
        const reverse = cloneRelationWithIdentity(
          module.relations[0],
          "InvocationAttempt-is_a-ToolCallAttempt",
        );
        reverse.source_id = "InvocationAttempt";
        reverse.target_id = "ToolCallAttempt";
        module.relations.push(reverse);
        module.classes[0].primary_parent_relation_id = reverse.id;
      });

      expectBuildFailure(workspace, /is_a.*cycle|cycle.*is_a|taxonomy cycle/iu);
    });

    it("fails when a concept's Module ownership is inconsistent with its source file", () => {
      const workspace = createWorkspace(({ module }) => {
        module.classes[1].module_id = "foreign-module";
      });

      expectBuildFailure(workspace, /ToolCallAttempt.*(?:owner|ownership|module)|module.*ToolCallAttempt/iu);
    });

    it("fails Modules whose parent Domain and relations whose endpoints do not resolve", () => {
      const missingDomain = createWorkspace(({ module }) => {
        module.module.plane_id = "missing-domain";
      });
      expectBuildFailure(missingDomain, /Module.*missing-domain|missing-domain.*Domain/iu);

      const missingEndpoint = createWorkspace(({ module }) => {
        module.relations[0].target_id = "MissingConcept";
      });
      expectBuildFailure(missingEndpoint, /unresolved Concept endpoint.*MissingConcept/iu);
    });

    it("fails hierarchy relations with a non-hierarchy relation kind", () => {
      const workspace = createWorkspace(({ module }) => {
        module.relations[0].relation_kind = "semantic";
      });

      expectBuildFailure(workspace, /relation_kind.*equal to constant|relation_kind.*allowed values/iu);
    });

    it("fails an accepted non-root concept without one valid primary parent relation", () => {
      const workspace = createWorkspace(({ module }) => {
        module.classes[1].primary_parent_relation_id = null;
      });

      expectBuildFailure(workspace, /ToolCallAttempt.*primary parent|primary parent.*ToolCallAttempt/iu);
    });

    it("fails Module key notions that do not resolve to one owned accepted Concept", () => {
      const workspace = createWorkspace(({ module }) => {
        module.module.key_notion = {
          zh: "不存在的关键概念",
          en: "Missing Key Concept",
          ja: "存在しない主要概念",
        };
      });

      expectBuildFailure(workspace, /key notion.*exactly one|key_notion.*Concept/iu);
    });

    it("requires a Module key notion to match all three owned labels exactly", () => {
      const workspace = createWorkspace(({ module }) => {
        const keyNotion = clone(module.module.key_notion) as {
          zh: string;
          en: string;
          ja: string;
        };
        module.module.key_notion = { ...keyNotion, en: keyNotion.en.toLowerCase() };
      });

      expectBuildFailure(workspace, /key notion.*exactly one|key_notion.*Concept/iu);
    });

    it("fails copied Module boundary prose and legacy Module label suffixes", () => {
      const copiedTemplate = createWorkspace(({ module }) => {
        module.module.purpose = {
          zh: "本模块在边界内以事实为代表闭包。",
          en: "Within the Tool Module boundary, this Module uses a representative closure fact.",
          ja: "代表閉包。",
        };
      });
      expectBuildFailure(copiedTemplate, /template|representative closure|代表闭包/iu);

      const circularNotApplicableReason = createWorkspace(({ module }) => {
        const interactionContract = module.module.interaction_contract as JsonObject;
        const facets = interactionContract.facets as JsonObject;
        const failureFacet = facets.failure as JsonObject;
        failureFacet.applicable = false;
        failureFacet.description = null;
        failureFacet.family_concept_ids = [];
        failureFacet.relation_ids = [];
        failureFacet.not_applicable_reason = {
          zh: "工具调用没有已接受的 failure 关系；该面明确不适用。",
          en: "Tool invocation has no accepted failure relation, so the facet is explicitly not applicable.",
          ja: "ツール呼び出しには承認済みの failure 関係がなく、この面は明示的に非適用です。",
        };
      });
      expectBuildFailure(
        circularNotApplicableReason,
        /template|not applicable|不适用|非適用/iu,
      );

      const legacySuffix = createWorkspace(({ module }) => {
        module.module.labels = {
          ...(module.module.labels as JsonObject),
          zh: "工具调用执行模块",
        };
      });
      expectBuildFailure(legacySuffix, /label.*模块|模块.*label|suffix/iu);
    });

    it("fails competency-question owner drift and duplicate semantic keys", () => {
      const wrongOwner = createWorkspace(({ module }) => {
        const questions = module.module.competency_questions as JsonObject[];
        questions[0].primary_owner_module_id = "foreign-module";
      });
      expectBuildFailure(wrongOwner, /competency question.*owner|primary owner/iu);

      const duplicateSemanticKey = createWorkspace(({ module }) => {
        const questions = module.module.competency_questions as JsonObject[];
        questions[1].semantic_key = questions[0].semantic_key;
      });
      expectBuildFailure(duplicateSemanticKey, /semantic key.*unique|duplicate.*semantic/iu);
    });

    it("fails invalid root status and cross-kind is_a assertions", () => {
      const invalidRoot = createWorkspace(({ module }) => {
        module.classes[0].root_status = null;
      });
      expectBuildFailure(
        invalidRoot,
        /\[ROOT_STATUS_INVALID\].*tool\/tool-invocation-execution\.json#\/classes\/0.*InvocationAttempt.*root_status/iu,
      );

      const crossKind = createWorkspace(({ module }) => {
        module.classes[0].semantic_kind = "entity";
        module.classes[0].definitions = {
          zh: "调用尝试是一种实体，表示一次具有独立开始、终止与结果状态的执行对象。",
          en: "An Invocation Attempt is an entity that represents one execution object with its own start, termination, and result state.",
          ja: "呼び出し試行は実体の一種で、独自の開始、終了、結果状態を持つ一回の実行対象を表します。",
        };
        module.classes[1].definitions = {
          zh: "工具调用尝试是一种活动，表示以工具作为被调用能力的一次执行尝试。",
          en: "A Tool Call Attempt is an activity that represents one execution attempt whose invoked capability is a tool.",
          ja: "ツール呼び出し試行は活動の一種で、呼び出される能力をツールに限定した一回の実行試行を表します。",
        };
      });
      expectBuildFailure(crossKind, /cross-kind is_a|semantic kind.*is_a|is_a.*semantic kind/iu);
    });

    it("rejects a lexical alias that merely repeats the canonical label", () => {
      const workspace = createWorkspace(({ module }) => {
        const labels = module.classes[0].labels as JsonObject;
        module.classes[0].lexical_aliases = [{
          language: "en",
          value: labels.en,
          alias_kind: "synonym",
        }];
      });

      expectBuildFailure(workspace, /lexical alias.*canonical label/iu);
    });

    it("fails layout endpoints that do not preserve canonical relation endpoints", () => {
      const workspace = createWorkspace(({ module }) => {
        module.relations[0].layout_parent_id = "ToolCallAttempt";
        module.relations[0].layout_child_id = "InvocationAttempt";
      });

      expectBuildFailure(workspace, /layout parent.*canonical target|layout.*endpoint/iu);
    });

    it("fails duplicate primary backbone parents and backbone cycles", () => {
      const duplicateParent = createWorkspace(({ module }) => {
        const taxonomy = module.module.taxonomy_contract as JsonObject;
        taxonomy.allowed_backbone_predicates = ["is_a", "specializes"];
        const duplicate = cloneRelationWithIdentity(
          module.relations[0],
          "ToolCallAttempt-specializes-InvocationAttempt",
        );
        duplicate.predicate = "specializes";
        module.relations.push(duplicate);
      });
      expectBuildFailure(
        duplicateParent,
        /primary backbone.*(?:duplicate|more than one)|more than one primary backbone/iu,
      );

      const cycle = createWorkspace(({ module }) => {
        const taxonomy = module.module.taxonomy_contract as JsonObject;
        taxonomy.allowed_backbone_predicates = ["is_a", "contains"];
        const reverse = cloneRelationWithIdentity(
          module.relations[0],
          "InvocationAttempt-contains-ToolCallAttempt",
        );
        reverse.predicate = "contains";
        reverse.relation_kind = "composition";
        reverse.source_id = "InvocationAttempt";
        reverse.target_id = "ToolCallAttempt";
        reverse.layout_parent_id = "ToolCallAttempt";
        reverse.layout_child_id = "InvocationAttempt";
        module.relations.push(reverse);
      });
      expectBuildFailure(cycle, /primary backbone.*cycle|backbone cycle/iu);
    });

    it("fails a Concept example whose field_values contains an undeclared field", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.examples[0].field_values.unreviewed_field = "must-not-pass";
      });

      expectBuildFailure(workspace, /unreviewed_field.*(?:unknown|undeclared)|(?:unknown|undeclared).*unreviewed_field/iu);
    });

    it("fails a Concept example whose field value has the wrong datatype", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.examples[0].field_values.attempt_id = 42;
      });

      expectBuildFailure(workspace, /attempt_id.*string|string.*attempt_id/iu);
    });

    it("fails duplicate fields and invalid field cardinality bounds", () => {
      const duplicateField = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields.push(clone(concept.structure.fields[0]));
      });
      expectBuildFailure(duplicateField, /InvocationAttempt.*repeats field id attempt_id/iu);

      const invalidCardinality = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].cardinality = { min: 2, max: 1 };
      });
      expectBuildFailure(invalidCardinality, /cardinality min greater than max/iu);
    });

    it("fails field values outside reviewed allowed values or patterns", () => {
      const outsideAllowedValues = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].allowed_values = [
          {
            id: "AttemptAllowed",
            value: "attempt-allowed",
            labels: { zh: "允许", en: "Allowed", ja: "許可" },
            definitions: {
              zh: "唯一允许的尝试标识。",
              en: "The only allowed attempt identifier.",
              ja: "唯一許可された試行識別子。",
            },
            status: "accepted",
            source_claims: [],
          },
        ];
      });
      expectBuildFailure(outsideAllowedValues, /attempt_id.*outside.*allowed_values/iu);

      const patternMismatch = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].pattern = "^approved-";
      });
      expectBuildFailure(patternMismatch, /attempt_id.*reviewed pattern/iu);
    });

    it("fails a positive Concept example that omits a required inherited or local field", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        delete concept.examples[0].field_values.attempt_id;
      });

      expectBuildFailure(workspace, /attempt_id.*required|required.*attempt_id/iu);
    });

    it("fails a repeatable Concept field represented by a scalar example value", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].cardinality = { min: 1, max: null };
      });

      expectBuildFailure(workspace, /attempt_id.*array|array.*attempt_id/iu);
    });

    it("fails repeatable field arrays below or above their reviewed cardinality", () => {
      const belowMinimum = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].cardinality = { min: 2, max: 3 };
        concept.examples[0].field_values.attempt_id = ["attempt-001"];
      });
      expectBuildFailure(belowMinimum, /attempt_id.*below cardinality min/iu);

      const aboveMaximum = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].cardinality = { min: 1, max: 2 };
        concept.examples[0].field_values.attempt_id = [
          "attempt-001",
          "attempt-002",
          "attempt-003",
        ];
      });
      expectBuildFailure(aboveMaximum, /attempt_id.*exceeds cardinality max/iu);
    });

    it("fails non-string URI values and duplicate example IDs", () => {
      const invalidUri = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].datatype = "uri";
        concept.examples[0].field_values.attempt_id = 42;
      });
      expectBuildFailure(invalidUri, /attempt_id.*datatype uri/iu);

      const duplicateExample = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as {
          examples: Array<{ id: string }>;
        };
        concept.examples[1].id = concept.examples[0].id;
      });
      expectBuildFailure(duplicateExample, /Duplicate example id/iu);
    });

    it("fails an external mapping whose canonical target id does not resolve", () => {
      const workspace = createWorkspace(({ module }) => {
        module.classes[0].external_mappings = [
          {
            id: "InvocationAttempt-invalid-external-mapping",
            system: "example-system",
            external_identifier: "example:attempt",
            external_version: "1.0",
            canonical_target_ids: ["MissingCanonicalConcept"],
            mapping_kind: "related",
            scope: {
              zh: "调用尝试映射。",
              en: "Invocation-attempt mapping.",
              ja: "呼び出し試行の写像。",
            },
            direction: "bidirectional",
            loss_notes: {
              zh: "无已知损失。",
              en: "No known loss.",
              ja: "既知の損失はありません。",
            },
            conversion_note: {
              zh: "无效的外部映射目标。",
              en: "Invalid external mapping target.",
              ja: "無効な外部マッピング対象。",
            },
            conformance: {
              status: "contract-tested",
              test_id: "InvocationAttempt-invalid-external-mapping-test",
              method: {
                zh: "验证目标可解析。",
                en: "Validate target resolution.",
                ja: "対象の解決を検証します。",
              },
            },
            status: "accepted",
            source_claims: [],
          },
        ];
      });

      expectBuildFailure(
        workspace,
        /external mapping.*MissingCanonicalConcept|MissingCanonicalConcept.*external mapping/iu,
      );
    });

    it("fails examples and competency questions with unresolved canonical references", () => {
      const unresolvedNode = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as {
          examples: Array<{ related_node_ids: string[] }>;
        };
        concept.examples[0].related_node_ids = ["MissingConcept"];
      });
      expectBuildFailure(unresolvedNode, /unresolved node reference MissingConcept/iu);

      const unresolvedRelation = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as {
          examples: Array<{ related_relation_ids: string[] }>;
        };
        concept.examples[0].related_relation_ids = ["MissingRelation"];
      });
      expectBuildFailure(unresolvedRelation, /unresolved relation reference MissingRelation/iu);

      const unresolvedCompetencyExample = createWorkspace(({ module }) => {
        const reviewedModule = module.module as unknown as {
          competency_questions: Array<{ positive_example_ids: string[] }>;
        };
        reviewedModule.competency_questions[0].positive_example_ids = ["MissingExample"];
      });
      expectBuildFailure(unresolvedCompetencyExample, /Competency question.*MissingExample/iu);
    });

    it("fails unregistered or URL-shaped direct source-claim locators", () => {
      const unregisteredSource = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as {
          source_claims: Array<{ source_id: string }>;
        };
        concept.source_claims[0].source_id = "missing-source";
      });
      expectBuildFailure(unregisteredSource, /Unresolved source claim missing-source/iu);

      const urlLocator = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as {
          source_claims: Array<{ locator: string }>;
        };
        concept.source_claims[0].locator = "https://example.invalid/section";
      });
      expectBuildFailure(urlLocator, /must use an in-source locator.*URL.*source registry/iu);
    });

    it("fails blank supports and locator text after semantic trimming", () => {
      const blankSupports = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as {
          source_claims: Array<{ supports: string }>;
        };
        concept.source_claims[0].supports = "   ";
      });
      expectBuildFailure(blankSupports, /Incomplete source claim/iu);

      const blankLocator = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as {
          source_claims: Array<{ locator: string }>;
        };
        concept.source_claims[0].locator = "   ";
      });
      expectBuildFailure(blankLocator, /Incomplete source claim/iu);
    });

    it("resolves an incoming required-relation constraint against the authored fact", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as JsonObject & {
          structure: { required_relation_constraints: JsonObject[] };
        };
        concept.structure.required_relation_constraints.push({
          id: "invocation-attempt-has-incoming-tool-specialization",
          direction: "incoming",
          predicate: "is_a",
          target_concept_id: "ToolCallAttempt",
          cardinality: { min: 1, max: 1 },
          explanations: {
            zh: "至少一个工具调用尝试专门化调用尝试。",
            en: "At least one tool call attempt specializes invocation attempt.",
            ja: "少なくとも一つのツール呼び出し試行が呼び出し試行を特殊化する。",
          },
          source_claims: [],
        });
      });

      requireSuccessfulBuild(workspace);
    });

    it("fails duplicate, unresolved, and impossible required-relation constraints", () => {
      const constraint = {
        id: "invocation-attempt-has-incoming-tool-specialization",
        direction: "incoming",
        predicate: "is_a",
        target_concept_id: "ToolCallAttempt",
        cardinality: { min: 1, max: 1 },
        explanations: {
          zh: "调用尝试关联工具调用尝试。",
          en: "Invocation attempt relates to a tool call attempt.",
          ja: "呼び出し試行はツール呼び出し試行に関連する。",
        },
        source_claims: [],
      };
      const duplicateConstraint = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as JsonObject & {
          structure: { required_relation_constraints: JsonObject[] };
        };
        concept.structure.required_relation_constraints.push(clone(constraint), clone(constraint));
      });
      expectBuildFailure(duplicateConstraint, /repeats required relation constraint id/iu);

      const unresolvedTarget = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as JsonObject & {
          structure: { required_relation_constraints: JsonObject[] };
        };
        concept.structure.required_relation_constraints.push({
          ...clone(constraint),
          target_concept_id: "MissingConcept",
        });
      });
      expectBuildFailure(unresolvedTarget, /unresolved target concept MissingConcept/iu);

      const impossibleBounds = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as JsonObject & {
          structure: { required_relation_constraints: JsonObject[] };
        };
        concept.structure.required_relation_constraints.push({
          ...clone(constraint),
          cardinality: { min: 2, max: 1 },
        });
      });
      expectBuildFailure(impossibleBounds, /cardinality min greater than max/iu);
    });

    it("fails a required relation constraint that has no matching canonical relation fact", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as JsonObject & {
          structure: {
            required_relation_constraints: JsonObject[];
          };
        };
        concept.structure.required_relation_constraints.push({
          id: "invocation-attempt-has-tool-call-attempt",
          direction: "outgoing",
          predicate: "has_attempt",
          target_concept_id: "ToolCallAttempt",
          cardinality: { min: 1, max: null },
          explanations: {
            zh: "调用尝试必须关联至少一次工具调用尝试。",
            en: "An invocation attempt must relate to at least one tool-call attempt.",
            ja: "呼び出し試行は少なくとも一つのツール呼び出し試行に関連する必要がある。",
          },
          source_claims: [],
        });
      });

      expectBuildFailure(
        workspace,
        /required relation constraint.*has_attempt|has_attempt.*matching canonical relation/iu,
      );
    });

    it("fails an unsupported field datatype instead of silently projecting it as string", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = firstConceptWithFields(module);
        concept.structure.fields[0].datatype = "mystery-binary";
      });

      expectBuildFailure(workspace, /unsupported.*datatype.*mystery-binary|mystery-binary.*unsupported/iu);
    });

    it("rejects non-accepted Concepts in a release-channel build", () => {
      const workspace = createWorkspace(({ module }) => {
        module.classes[0].status = "draft";
        module.classes[0].review = { review_status: "draft", reviewers: [] };
      });
      writeReleaseEvidence(workspace);

      const result = runBuilder(workspace, ["--release"]);
      expect(result.status).not.toBe(0);
      expect(diagnostics(result)).toMatch(
        /Release requires every published record to be reviewed|key_notion.*accepted Concept|release evidence.*non-accepted rows/iu,
      );
    });

    it("rejects a release-channel build without the complete reviewed evidence set", () => {
      const workspace = createWorkspace();
      const result = runBuilder(workspace, ["--release"]);

      expect(result.status).not.toBe(0);
      expect(diagnostics(result)).toMatch(/Release requires all reviewed evidence files/iu);
    });

    it("fails invalid source and target cardinality on semantic relation facts", () => {
      const invalidRelationCardinality = (
        side: "source" | "target",
      ): TestWorkspace =>
        createWorkspace(({ module }) => {
          const relation = module.relations[0] as unknown as JsonObject & {
            cardinality: {
              source: { min: number; max: number | null };
              target: { min: number; max: number | null };
            } | null;
          };
          relation.predicate = "depends_on";
          relation.relation_kind = "causal";
          relation.cardinality = {
            source: { min: 0, max: 1 },
            target: { min: 0, max: 1 },
          };
          relation.cardinality[side] = { min: 2, max: 1 };
          relation.cardinality_not_applicable_reason = null;
          module.classes[1].primary_parent_relation_id = null;
        });

      for (const side of ["source", "target"] as const) {
        expectBuildFailure(
          invalidRelationCardinality(side),
          new RegExp(`${side} cardinality min greater than max`, "iu"),
        );
      }
    });
  });
});
