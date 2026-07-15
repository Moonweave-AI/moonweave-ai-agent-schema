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

describe.runIf(existsSync(builderPath))("ontology generated projections", () => {
    it("stamps the generated root schema and TypeScript contract with deterministic provenance", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const canonical = readJson<{
        artifact_metadata: {
          generated_at: string;
          generator_version: string;
          source_tree_sha256: string;
        };
      }>(resolve(workspace.outputRoot, "ontology/agent-ontology.json"));
      const generatedSchema = readJson<{ $comment: string }>(
        resolve(workspace.outputRoot, "schemas/agent-ontology.schema.json"),
      );
      const generatedTypes = readFileSync(
        resolve(workspace.outputRoot, "src/lib/canonical-ontology-types.ts"),
        "utf8",
      );
      const contractFingerprint = createHash("sha256")
        .update(
          readFileSync(artifactContractPath),
        )
        .digest("hex");

      for (const value of [
        canonical.artifact_metadata.generator_version,
        canonical.artifact_metadata.source_tree_sha256,
        canonical.artifact_metadata.generated_at,
        contractFingerprint,
      ]) {
        expect(generatedSchema.$comment).toContain(value);
        expect(generatedTypes).toContain(value);
      }
    });

    it("generates precise TypeScript for union, tuple-like, record, and unusual property schemas", () => {
      const generatedTypes = generateCanonicalTypes({
        $defs: {
          canonicalArtifact: { $ref: "#/$defs/objectShape" },
          objectShape: {
            type: "object",
            additionalProperties: false,
            required: ["not-valid-identifier"],
            properties: {
              "not-valid-identifier": { type: ["string", "null"] },
            },
          },
          unionOnly: { anyOf: [{ type: "string" }, { type: "null" }] },
          arrayWithDefaultItems: { type: "array" },
          emptyIntersection: { allOf: [] },
          closedRecord: { type: "object", additionalProperties: false },
          indexedObject: {
            type: "object",
            properties: { fixed: { type: "boolean" } },
            additionalProperties: { type: "integer" },
          },
          unknownReference: { $ref: "#/$defs/not-in-definitions" },
        },
      });

      expect(generatedTypes).toContain('readonly "not-valid-identifier": string | null;');
      expect(generatedTypes).toContain("export type UnionOnly = string | null;");
      expect(generatedTypes).toContain("export type ArrayWithDefaultItems = ReadonlyArray<unknown>;");
      expect(generatedTypes).toContain("export type EmptyIntersection = unknown;");
      expect(generatedTypes).toContain(
        "export type ClosedRecord = Readonly<Record<string, never>>;",
      );
      expect(generatedTypes).toContain("readonly [key: string]: number;");
      expect(generatedTypes).toContain("export type UnknownReference = NotInDefinitions;");
    });

    it("emits only the new canonical shape and no migration payload or placeholders", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const canonical = readCandidate(workspace);
      const keys = collectKeys(canonical);
      const serialized = stableJson(canonical);

      for (const field of legacyTopLevelFields) {
        expect(canonical).not.toHaveProperty(field);
      }
      for (const field of migrationPayloadFields) {
        expect(keys, `Migration-only field ${field} leaked into canonical output`).not.toContain(field);
      }
      expect(serialized).not.toMatch(/\b(?:TODO|TBD|FIXME|PLACEHOLDER)\b|待补|占位/iu);
      expect(serialized).not.toMatch(/PlaneIndividual|ModuleIndividual/u);
      expect(canonical.classes.every((concept) => !("plane_id" in concept))).toBe(true);
      expect(canonical.classes.every((concept) => !("kind" in concept))).toBe(true);
      expect(canonical.planes.every((plane) => !("term_ids" in plane))).toBe(true);
      expect(canonical.planes.every((plane) => !("module_ids" in plane))).toBe(true);
      expect(canonical.modules.every((module) => !("class_ids" in module))).toBe(true);
    });

    it("preserves an explicit draft semantic_kind null instead of inferring from labels", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = module.classes[0];
        module.module.status = "review";
        concept.semantic_kind = null;
        concept.status = "draft";
        concept.review = { review_status: "draft", reviewers: [] };
        concept.labels = {
          zh: "安全策略能力活动",
          en: "Security Policy Capability Activity",
          ja: "セキュリティ方針能力アクティビティ",
        };
        module.classes[1].definitions = {
          zh: "工具调用尝试是一种活动，表示被调用能力限定为工具的一次执行。",
          en: "A Tool Call Attempt is an activity representing one execution whose invoked capability is a tool.",
          ja: "ツール呼び出し試行は活動の一種で、呼び出される能力をツールに限定した一回の実行を表します。",
        };
      });

      requireSuccessfulBuild(workspace);
      const concept = readCandidate(workspace).classes.find(
        (candidate) => candidate.id === "InvocationAttempt",
      );
      expect(concept?.semantic_kind).toBeNull();
    });

    it("emits exactly the authored relation facts and creates no alphabetical-neighbor relation", () => {
      const workspace = createWorkspace(({ module }) => {
        module.classes[0].labels = {
          zh: "甲相邻概念",
          en: "Alpha Adjacent Concept",
          ja: "アルファ隣接概念",
        };
        module.classes[1].labels = {
          zh: "乙相邻概念",
          en: "Beta Adjacent Concept",
          ja: "ベータ隣接概念",
        };
        module.classes[0].definitions = {
          zh: "甲相邻概念是一种活动，表示具有独立开始、终止与结果状态的一次执行。",
          en: "An Alpha Adjacent Concept is an activity representing one execution with its own start, termination, and result state.",
          ja: "アルファ隣接概念は活動の一種で、独自の開始、終了、結果状態を持つ一回の実行を表します。",
        };
        module.classes[1].definitions = {
          zh: "乙相邻概念是一种甲相邻概念，其被调用能力限定为工具。",
          en: "A Beta Adjacent Concept is an Alpha Adjacent Concept whose invoked capability is a tool.",
          ja: "ベータ隣接概念はアルファ隣接概念の一種で、呼び出される能力をツールに限定します。",
        };
        module.module.key_notion = module.classes[0].labels;
      });
      const authoredFacts = workspace.module.relations.map(
        ({ id, predicate, source_id: sourceId, target_id: targetId }) => ({
          id,
          predicate,
          source_id: sourceId,
          target_id: targetId,
        }),
      );

      requireSuccessfulBuild(workspace);
      const emittedFacts = readCandidate(workspace).relations.map(
        ({ id, predicate, source_id: sourceId, target_id: targetId }) => ({
          id,
          predicate,
          source_id: sourceId,
          target_id: targetId,
        }),
      );
      expect(emittedFacts).toEqual(authoredFacts);
    });

    it("derives all metric meanings from canonical arrays and nested information", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const canonical = readCandidate(workspace);

      expect(canonical.ontology_metrics).toEqual(derivedMetrics(canonical));
      expect(canonical.ontology_metrics).toEqual(
        expect.objectContaining({
          instance_examples: expect.any(Number),
          controlled_values: expect.any(Number),
          structure_fields: expect.any(Number),
          constraints: expect.any(Number),
          source_claims: expect.any(Number),
          legacy_individuals_remaining: 0,
          legacy_data_properties_remaining: 0,
          legacy_axioms_remaining: 0,
        }),
      );
    });

    it("validates the canonical against its generated strict root schema", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const canonical = readCandidate(workspace);
      const schema = readJson<AnySchema>(generatedSchemaPath(workspace));
      const ajv = new Ajv2020({ allErrors: true, strict: true });
      addFormats(ajv);
      const validate = ajv.compile(schema);

      expect(validate(canonical), JSON.stringify(validate.errors, null, 2)).toBe(true);

      const mixedShape = { ...canonical, terms: [] };
      expect(validate(mixedShape), "The generated schema accepted a mixed v1/v2 artifact").toBe(false);
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyword: "additionalProperties",
            params: expect.objectContaining({ additionalProperty: "terms" }),
          }),
        ]),
      );

      const inconsistentReleaseMetadata = clone(canonical);
      inconsistentReleaseMetadata.artifact_metadata.releasable = true;
      expect(
        validate(inconsistentReleaseMetadata),
        "A candidate artifact cannot claim to be releasable",
      ).toBe(false);
    });

    it("checks generated output without mutating source or candidate files", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const sourceBefore = treeSnapshot(workspace.sourceRoot);
      const candidateBefore = treeSnapshot(workspace.outputRoot);

      const result = runBuilder(workspace, ["--check"]);

      expect(result.status, diagnostics(result)).toBe(0);
      expectSameSnapshot(treeSnapshot(workspace.sourceRoot), sourceBefore);
      expectSameSnapshot(treeSnapshot(workspace.outputRoot), candidateBefore);
    });
});
