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

describe("deterministic ontology builder contract", () => {
  it("finalizes metrics without mutating the validated canonical draft", () => {
    const draft = {
      id: "immutable-draft",
      planes: [],
      modules: [],
      classes: [],
      relations: [],
      case_paths: [],
      ontology_metrics: { sentinel: true },
    };
    const before = structuredClone(draft);

    const canonical = finalizeCanonicalWithMetrics(draft);

    expect(draft).toEqual(before);
    expect(canonical).not.toBe(draft);
    expect(canonical.ontology_metrics).not.toBe(draft.ontology_metrics);
    expect(canonical.ontology_metrics).toEqual(
      expect.objectContaining({ domains: 0, modules: 0, concepts: 0 }),
    );
  });

  it("merges a canonical candidate without mutating loaded source records", () => {
    const workspace = createWorkspace();
    const loaded = loadAndValidateSources({
      sourceRoot: workspace.sourceRoot,
      artifactContractPath,
    });
    const generatedAt = deterministicGeneratedAt(
      String((loaded.productEntry.data.product as JsonObject).date),
      "1783900800",
    );
    const sourceRecordsBefore = structuredClone({
      product: loaded.productEntry.data,
      modules: loaded.moduleEntries.map(({ data }) => data),
    });

    const canonical = mergeAndValidateCanonical({
      ...loaded,
      contractVersion: loaded.contract.contract_version,
      sourceIndex: readJson<JsonObject>(
        resolve(repositoryRoot, "src/generated/source-index.json"),
      ),
      generatorVersion: ONTOLOGY_GENERATOR_VERSION,
      generatedAt,
      releaseChannel: "candidate",
    });

    expect({
      product: loaded.productEntry.data,
      modules: loaded.moduleEntries.map(({ data }) => data),
    }).toEqual(sourceRecordsBefore);
    expect(canonical).not.toBe(loaded.productEntry.data.product);
    expect(loaded.productEntry.data.product).not.toHaveProperty("ontology_metrics");
  });

  it("publishes the source-only v2 builder entry point", () => {
    expect(
      existsSync(builderPath),
      "Phase 1 requires scripts/build-agent-ontology.mjs; the frozen published canonical is not a builder input",
    ).toBe(true);
  });

  describe.runIf(existsSync(builderPath))("candidate generation", () => {
    it("builds the fixed unpublished candidate without reading the published canonical", () => {
      const workspace = createWorkspace();

      expect(existsSync(resolve(workspace.root, "ontology/agent-ontology.json"))).toBe(false);
      requireSuccessfulBuild(workspace, { forbidPublishedCanonical: true });

      const canonical = readCandidate(workspace);
      expect(canonical.artifact_metadata).toEqual(
        expect.objectContaining({
          release_channel: "candidate",
          releasable: false,
          generated: true,
          do_not_edit: true,
          generated_at: "2026-07-13T00:00:00.000Z",
          source_tree_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      );
    });

    it("fingerprints complete reviewed evidence without turning it into graph elements", () => {
      const workspace = createWorkspace();
      writeReleaseEvidence(workspace);
      requireSuccessfulBuild(workspace);
      const first = readCandidate(workspace);

      expect(first.artifact_metadata.generated_from).toEqual(
        expect.arrayContaining([...releaseEvidencePaths]),
      );
      const graphIds = [
        ...first.modules.map(({ id }) => id),
        ...first.classes.map(({ id }) => id),
        ...first.relations.map(({ id }) => id),
      ];
      expect(graphIds.some((id) => String(id).startsWith("research/"))).toBe(false);

      const registryPath = resolve(workspace.root, releaseEvidencePaths[3]);
      writeFileSync(
        registryPath,
        `${readFileSync(registryPath, "utf8")}synthetic-source-2,accepted\n`,
        "utf8",
      );
      requireSuccessfulBuild(workspace);
      expect(readCandidate(workspace).artifact_metadata.source_tree_sha256).not.toBe(
        first.artifact_metadata.source_tree_sha256,
      );
    });

    it("builds a releasable artifact only when all reviewed evidence mirrors source", () => {
      const workspace = createWorkspace((candidateWorkspace) => {
        candidateWorkspace.product = {
          ...candidateWorkspace.product,
          product: {
            ...(candidateWorkspace.product.product as JsonObject),
            status: "accepted",
          },
        };
      });
      writeReleaseEvidence(workspace);

      const result = runBuilder(workspace, ["--release"]);
      expect(result.status, diagnostics(result)).toBe(0);
      expect(readCandidate(workspace).artifact_metadata).toEqual(
        expect.objectContaining({ release_channel: "release", releasable: true }),
      );
    });

    it("renders a non-taxonomic primary backbone recursively in generated Markdown", () => {
      const text = (value: string) => ({ zh: value, en: value, ja: value });
      const canonical = {
        id: "synthetic-ontology",
        definitions: text("Synthetic ontology"),
        artifact_metadata: {
          canonical_version: "https://example.test/ontology/2.0.0/",
          generator_version: "test-generator/2.0.0",
          generated_from: ["ontology/source/synthetic.json"],
          source_tree_sha256: "a".repeat(64),
        },
        planes: [{ id: "runtime", labels: text("Runtime"), definitions: text("Runtime domain") }],
        modules: [{
          id: "execution",
          plane_id: "runtime",
          labels: text("Execution"),
          definitions: text("Execution module"),
        }],
        classes: [
          {
            id: "Execution",
            module_id: "execution",
            labels: text("Execution"),
            definitions: text("Execution root"),
          },
          {
            id: "ExecutionAttempt",
            module_id: "execution",
            labels: text("Execution attempt"),
            definitions: text("One execution attempt"),
            structure: {
              identity_keys: ["attempt_id"],
              fields: [{
                id: "attempt_id",
                labels: text("Attempt identifier"),
                datatype: "string",
                required: true,
                cardinality: { min: 1, max: 1 },
                definitions: text("Stable identifier for one execution attempt"),
                allowed_values: [],
                pattern: null,
                example_value: "attempt-001",
                source_claims: [],
              }],
              constraints: [],
              required_relation_constraints: [],
            },
            examples: [{
              id: "ExecutionAttempt-example-positive-001",
              kind: "positive",
              labels: text("Successful execution attempt"),
              descriptions: text("A tool run records one stable attempt identifier."),
              related_node_ids: ["ExecutionAttempt"],
              related_relation_ids: [],
              expected_result: text("The attempt can be retrieved by its identifier."),
              why_valid_or_invalid: text("The record satisfies the reviewed identity condition."),
            }],
            source_claims: [{
              source_id: "official-execution-spec",
              supports: "Supports stable attempt identity.",
              locator: "Execution model > Attempt identity",
              evidence_kind: "official",
              confidence: "high",
              review_status: "accepted",
            }],
          },
        ],
        relations: [{
          id: "Execution-has_phase-ExecutionAttempt",
          predicate: "has_phase",
          source_id: "Execution",
          target_id: "ExecutionAttempt",
          status: "accepted",
          layout_role: "primary-backbone",
          layout_parent_id: "Execution",
          layout_child_id: "ExecutionAttempt",
          definitions: text("Execution has an attempt phase"),
          relation_kind: "composition",
          temporal_scope: "valid-time",
          cardinality: {
            source: { min: 1, max: 1 },
            target: { min: 1, max: null },
          },
          inverse_reading: {
            predicate: "phase_of",
            labels: text("phase of"),
          },
          conditions: [],
          constraints: [],
          examples: [{
            id: "Execution-has_phase-ExecutionAttempt-example-positive-001",
            kind: "positive",
            labels: text("Execution attempt phase"),
            descriptions: text("An execution records its first attempt phase."),
            related_node_ids: ["Execution", "ExecutionAttempt"],
            related_relation_ids: ["Execution-has_phase-ExecutionAttempt"],
            expected_result: text("The attempt is reachable from the execution."),
            why_valid_or_invalid: text("The explicit relation preserves the reviewed endpoints."),
          }],
          source_claims: [{
            source_id: "official-execution-spec",
            supports: "Supports execution phase composition.",
            locator: "Execution model > Attempt phases",
            evidence_kind: "official",
            confidence: "high",
            review_status: "accepted",
          }],
        }],
      } as unknown as Parameters<typeof generateCanonicalMarkdown>[0];

      const markdown = generateCanonicalMarkdown(canonical, "2026-07-14T00:00:00.000Z");
      expect(markdown).toContain("- **Execution** `Execution`");
      expect(markdown).toContain("  - **Execution attempt** `ExecutionAttempt`");
      expect(markdown.indexOf("`Execution`")).toBeLessThan(
        markdown.indexOf("`ExecutionAttempt`"),
      );
      expect(markdown).toContain("Stable identifier for one execution attempt");
      expect(markdown).toContain("A tool run records one stable attempt identifier.");
      expect(markdown).toContain("Execution model > Attempt identity");
      expect(markdown).toContain("An execution records its first attempt phase.");
      expect(markdown).toContain("Execution model > Attempt phases");
      expect(markdown).toMatch(/[^\n]\n$/u);
    });

    it("derives the read-only definition, payload-schema, and fixture projections from canonical IDs", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const canonical = readCandidate(workspace);
      const definitionLedger = readJson<{
        generated: boolean;
        do_not_edit: boolean;
        canonical_version: string;
        definitions: Record<string, { canonical_kind: string }>;
      }>(resolve(workspace.outputRoot, "ontology/agent-ontology-definitions.json"));
      const payloadSchemas = readJson<{
        $comment: string;
        $defs: Record<string, { properties: { "@type": { const: string } } }>;
      }>(resolve(workspace.outputRoot, "schemas/generated/concept-payloads.schema.json"));
      const fixtures = readJson<{
        generated: boolean;
        examples: Array<{ concept_id: string; payload: { "@type": string } }>;
      }>(resolve(workspace.outputRoot, "fixtures/generated/concept-payload-examples.json"));
      const sourceIndex = readJson<{
        generated: boolean;
        do_not_edit: boolean;
        generated_from: string[];
        generator_version: string;
        generated_at: string;
        product_fingerprint: string;
        generation_time_basis: {
          source: string;
          field: string;
          override: string;
        };
      }>(resolve(workspace.outputRoot, "src/generated/source-index.json"));
      const generatedMarkdown = readFileSync(
        resolve(workspace.outputRoot, "ontology/agent-ontology.md"),
        "utf8",
      );

      expect(definitionLedger).toEqual(
        expect.objectContaining({ generated: true, do_not_edit: true }),
      );
      expect(definitionLedger.canonical_version).toBe(
        (canonical.artifact_metadata as CandidateArtifact["artifact_metadata"] & {
          canonical_version: string;
        }).canonical_version,
      );
      expect(Object.keys(definitionLedger.definitions).sort()).toEqual(
        [
          canonical.id,
          ...canonical.planes.map(({ id }) => id),
          ...canonical.modules.map(({ id }) => id),
          ...canonical.classes.map(({ id }) => id),
          ...canonical.relations.map(({ id }) => id),
        ].sort(),
      );
      expect(payloadSchemas.$comment).toContain("generated=true");
      expect(Object.values(payloadSchemas.$defs).map((schema) => schema.properties["@type"].const).sort()).toEqual(
        canonical.classes.map(({ id }) => id).sort(),
      );
      expect(fixtures.examples.map(({ concept_id }) => concept_id).sort()).toEqual(
        canonical.classes.map(({ id }) => id).sort(),
      );
      expect(fixtures.examples.every(({ concept_id, payload }) => payload["@type"] === concept_id)).toBe(true);
      expect(sourceIndex).toEqual(
        expect.objectContaining({
          generated: true,
          do_not_edit: true,
          generated_from: [
            "ontology/source/agent-ontology.product.json",
            "research/living-source-metadata.csv",
            "research/source-registry.csv",
          ],
          generator_version: "moonweave-ontology-builder/2.0.0",
          generated_at: "2026-07-13T00:00:00.000Z",
          product_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
          generation_time_basis: {
            source: "ontology/source/agent-ontology.product.json",
            field: "product.date",
            override: "SOURCE_DATE_EPOCH",
          },
        }),
      );
      expect(
        generatedMarkdown
          .split(/\r?\n/u)
          .filter((line) => /[\t ]+$/u.test(line)),
        "generated Markdown must stay clean under git diff --check",
      ).toEqual([]);

      const ajv = new Ajv2020({ allErrors: true, strict: true });
      addFormats(ajv);
      const validatePayload = ajv.compile(payloadSchemas as AnySchema);
      for (const { concept_id: conceptId, payload } of fixtures.examples) {
        expect(validatePayload(payload), `${conceptId}: ${JSON.stringify(validatePayload.errors)}`).toBe(true);
      }
    });

    it("produces byte-identical artifacts from the same source tree", () => {
      const first = createWorkspace(undefined, "candidate-a");
      const secondOutputRoot = resolve(first.root, "build/candidate-b");

      requireSuccessfulBuild(first);
      const firstBytes = new Map(
        listFiles(first.outputRoot).map((path) => [
          relative(first.outputRoot, path).replaceAll("\\", "/"),
          readFileSync(path),
        ]),
      );

      const second = { ...first, outputRoot: secondOutputRoot };
      requireSuccessfulBuild(second);
      const secondBytes = new Map(
        listFiles(second.outputRoot).map((path) => [
          relative(second.outputRoot, path).replaceAll("\\", "/"),
          readFileSync(path),
        ]),
      );

      expect([...secondBytes.keys()]).toEqual([...firstBytes.keys()]);
      for (const [path, bytes] of firstBytes) {
        expect(secondBytes.get(path)?.equals(bytes), `${path} was nondeterministic`).toBe(true);
      }
      expect(sha256(readFileSync(canonicalPath(first)))).toBe(
        sha256(readFileSync(canonicalPath(second))),
      );
    });

    it("projects repeatable Concept fields as arrays with item schemas and array fixtures", () => {
      const workspace = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as JsonObject & {
          structure: { fields: Array<JsonObject & { cardinality: { min: number; max: number | null } }> };
          examples: Array<JsonObject & { field_values: Record<string, unknown> }>;
        };
        concept.structure.fields[0].cardinality = { min: 1, max: null };
        concept.examples[0].field_values.attempt_id = ["attempt-001"];
        const child = module.classes[1] as unknown as JsonObject & {
          examples: Array<JsonObject & { field_values: Record<string, unknown> }>;
        };
        child.examples[0].field_values.attempt_id = ["attempt-002"];
      });

      requireSuccessfulBuild(workspace);
      const payloadSchemas = readJson<{
        $defs: Record<string, { properties: Record<string, JsonObject> }>;
      }>(resolve(workspace.outputRoot, "schemas/generated/concept-payloads.schema.json"));
      const fixtures = readJson<{
        examples: Array<{ concept_id: string; payload: Record<string, unknown> }>;
      }>(resolve(workspace.outputRoot, "fixtures/generated/concept-payload-examples.json"));
      const attemptSchema = payloadSchemas.$defs.InvocationAttempt.properties.attempt_id;
      const attemptFixture = fixtures.examples.find(
        ({ concept_id: conceptId }) => conceptId === "InvocationAttempt",
      );

      expect(attemptSchema).toMatchObject({
        type: "array",
        minItems: 1,
        items: { type: "string" },
      });
      expect(attemptFixture?.payload.attempt_id).toEqual(["attempt-001"]);
    });

    it("validates and projects every supported scalar field datatype", () => {
      const scalarValues = [
        ["integer_value", "integer", 7],
        ["number_value", "number", 1.5],
        ["boolean_value", "boolean", true],
        ["object_value", "object", { status: "ok" }],
        ["reference_value", "reference", "ToolCallAttempt"],
        ["date_time_value", "date-time", "2026-07-13T00:00:00.000Z"],
        ["uri_value", "uri", "https://moonweave.ai/examples/attempt-001"],
      ] as const;
      const workspace = createWorkspace(({ module }) => {
        const concept = module.classes[0] as unknown as JsonObject & {
          structure: { fields: JsonObject[] };
          examples: Array<JsonObject & { field_values: Record<string, unknown> }>;
        };
        const template = concept.structure.fields[0];
        for (const [id, datatype, value] of scalarValues) {
          concept.structure.fields.push({
            ...clone(template),
            id,
            datatype,
            required: false,
            cardinality: { min: 0, max: 1 },
            example_value: value,
          });
          concept.examples[0].field_values[id] = value;
        }
        concept.structure.fields.push({
          ...clone(template),
          id: "controlled_code",
          required: false,
          cardinality: { min: 0, max: 1 },
          allowed_values: [
            {
              id: "ControlledCodeOK",
              value: "OK",
              labels: { zh: "成功", en: "OK", ja: "成功" },
              definitions: {
                zh: "受控成功代码。",
                en: "The controlled success code.",
                ja: "制御された成功コード。",
              },
              status: "accepted",
              source_claims: [],
            },
          ],
          pattern: "^[A-Z]+$",
          example_value: "OK",
        });
        concept.examples[0].field_values.controlled_code = "OK";
      });

      requireSuccessfulBuild(workspace);
      const payloadSchemas = readJson<{
        $defs: Record<string, { properties: Record<string, JsonObject> }>;
      }>(resolve(workspace.outputRoot, "schemas/generated/concept-payloads.schema.json"));
      const properties = payloadSchemas.$defs.InvocationAttempt.properties;
      expect(properties).toEqual(
        expect.objectContaining({
          integer_value: expect.objectContaining({ type: "integer" }),
          number_value: expect.objectContaining({ type: "number" }),
          boolean_value: expect.objectContaining({ type: "boolean" }),
          object_value: expect.objectContaining({ type: "object" }),
          reference_value: expect.objectContaining({ type: "string" }),
          date_time_value: expect.objectContaining({ type: "string", format: "date-time" }),
          uri_value: expect.objectContaining({ type: "string", format: "uri" }),
          controlled_code: expect.objectContaining({ enum: ["OK"], pattern: "^[A-Z]+$" }),
        }),
      );
    });

    it("projects inherited fields and constraints into child Concept payload artifacts", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const payloadSchemas = readJson<{
        $defs: Record<
          string,
          {
            properties: Record<string, JsonObject>;
            required: string[];
            $comment: string;
          }
        >;
      }>(resolve(workspace.outputRoot, "schemas/generated/concept-payloads.schema.json"));
      const fixtures = readJson<{
        examples: Array<{ concept_id: string; payload: Record<string, unknown> }>;
      }>(resolve(workspace.outputRoot, "fixtures/generated/concept-payload-examples.json"));

      const childSchema = payloadSchemas.$defs.ToolCallAttempt;
      const childFixture = fixtures.examples.find(
        ({ concept_id: conceptId }) => conceptId === "ToolCallAttempt",
      );
      expect(childSchema.properties.attempt_id).toBeDefined();
      expect(childSchema.required).toContain("attempt_id");
      expect(JSON.parse(childSchema.$comment)).toMatchObject({
        canonical_concept_id: "ToolCallAttempt",
        identity_keys: ["attempt_id"],
      });
      expect(childFixture?.payload.attempt_id).toBe("attempt-001");
    });

    it("generates useful TypeScript for object schemas with conditional anyOf rules", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const generatedTypes = readFileSync(
        resolve(workspace.outputRoot, "src/lib/canonical-ontology-types.ts"),
        "utf8",
      );

      expect(generatedTypes).toMatch(
        /export type LocalizedDraftText = \{[\s\S]*readonly zh\?: NonEmptyString;[\s\S]*readonly en\?: NonEmptyString;[\s\S]*readonly ja\?: NonEmptyString;[\s\S]*\};/u,
      );
      expect(generatedTypes).not.toContain(
        "export type LocalizedDraftText = unknown | unknown | unknown;",
      );
      expect(generatedTypes).toContain(
        'export type RootStatus = "domain-upper-root" | "module-key-root" | "composition-root" | "unresolved-root";',
      );
      expect(generatedTypes).toContain(
        'export type RelationLayoutRole = "primary-backbone" | "secondary-backbone" | "cross-link" | "none";',
      );
      const conceptDeclaration = generatedTypes.slice(
        generatedTypes.indexOf("export type Concept ="),
        generatedTypes.indexOf("export type InverseReading ="),
      );
      const relationDeclaration = generatedTypes.slice(
        generatedTypes.indexOf("export type Relation ="),
        generatedTypes.indexOf("export type CasePathStep ="),
      );
      expect(conceptDeclaration).toContain('readonly status: "accepted";');
      expect(conceptDeclaration).toContain("readonly labels: LocalizedText;");
      expect(conceptDeclaration).toContain("readonly definitions: LocalizedText;");
      expect(conceptDeclaration).toContain("readonly primary_parent_relation_id: Identifier | null;");
      expect(conceptDeclaration).toContain("readonly root_status: RootStatus | null;");
      expect(conceptDeclaration).toContain("readonly structure: ConceptStructure;");
      expect(conceptDeclaration).toContain("readonly external_mappings: ReadonlyArray<ExternalMapping>;");
      expect(conceptDeclaration).toContain("readonly applicability: ReadonlyArray<\"core\" | \"profile\" | \"adapter\">;");
      expect(conceptDeclaration).toContain('readonly status: "deprecated";');
      expect(conceptDeclaration).toContain("readonly deprecated_in: NonEmptyString;");
      expect(conceptDeclaration).toContain("readonly replaced_by_ids: ReadonlyArray<Identifier>;");
      expect(conceptDeclaration).toContain("readonly deprecation_reason: LocalizedText | null;");
      expect(relationDeclaration).toContain('readonly status: "accepted";');
      expect(relationDeclaration).toContain("readonly labels: LocalizedText;");
      expect(relationDeclaration).toContain("readonly definitions: LocalizedText;");
      expect(relationDeclaration).toContain("readonly layout_role: RelationLayoutRole;");
      expect(relationDeclaration).toContain("readonly cardinality: RelationCardinality | null;");
      expect(relationDeclaration).toContain("readonly inverse_reading: InverseReading;");
      expect(relationDeclaration).toContain("readonly conditions: ReadonlyArray<Constraint>;");
      expect(relationDeclaration).toContain("readonly boundary_context: BoundaryContext | null;");
    });

    it("type-checks accepted and deprecated lifecycle branches as non-empty required contracts", () => {
      const workspace = createWorkspace();
      requireSuccessfulBuild(workspace);
      const assertionPath = resolve(workspace.root, "generated-types-contract.test.ts");
      const generatedTypesImport = `./${relative(
        workspace.root,
        resolve(workspace.outputRoot, "src/lib/canonical-ontology-types.ts"),
      )}`
        .replaceAll("\\", "/")
        .replace(/\.ts$/u, ".js");
      writeFileSync(
        assertionPath,
        `import type { Concept, Relation } from "${generatedTypesImport}";

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;
type IsRequired<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

type AcceptedConcept = Extract<Concept, { readonly status: "accepted" }>;
type DeprecatedConcept = Extract<Concept, { readonly status: "deprecated" }>;
type AcceptedRelation = Extract<Relation, { readonly status: "accepted" }>;
type DeprecatedRelation = Extract<Relation, { readonly status: "deprecated" }>;

type _AcceptedConceptExists = Assert<IsNever<AcceptedConcept> extends false ? true : false>;
type _AcceptedConceptLabelsRequired = Assert<IsRequired<AcceptedConcept, "labels">>;
type _AcceptedConceptDefinitionsRequired = Assert<IsRequired<AcceptedConcept, "definitions">>;
type _DeprecatedConceptExists = Assert<IsNever<DeprecatedConcept> extends false ? true : false>;
type _DeprecatedConceptVersionRequired = Assert<IsRequired<DeprecatedConcept, "deprecated_in">>;
type _DeprecatedConceptReasonRequired = Assert<IsRequired<DeprecatedConcept, "deprecation_reason">>;
type _AcceptedRelationExists = Assert<IsNever<AcceptedRelation> extends false ? true : false>;
type _AcceptedRelationLabelsRequired = Assert<IsRequired<AcceptedRelation, "labels">>;
type _AcceptedRelationDefinitionsRequired = Assert<IsRequired<AcceptedRelation, "definitions">>;
type _DeprecatedRelationExists = Assert<IsNever<DeprecatedRelation> extends false ? true : false>;
type _DeprecatedRelationVersionRequired = Assert<IsRequired<DeprecatedRelation, "deprecated_in">>;
type _DeprecatedRelationReasonRequired = Assert<IsRequired<DeprecatedRelation, "deprecation_reason">>;

export {};
`,
        "utf8",
      );

      const result = spawnSync(
        process.execPath,
        [
          resolve(repositoryRoot, "node_modules/typescript/bin/tsc"),
          assertionPath,
          "--noEmit",
          "--strict",
          "--skipLibCheck",
          "--target",
          "ES2022",
          "--module",
          "NodeNext",
          "--moduleResolution",
          "NodeNext",
        ],
        { cwd: workspace.root, encoding: "utf8" },
      );
      expect(result.status, diagnostics(result)).toBe(0);
    });
  });
});
