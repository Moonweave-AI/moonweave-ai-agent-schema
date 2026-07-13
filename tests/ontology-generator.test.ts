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

import { generateCanonicalTypes } from "../scripts/lib/ontology-build-artifacts.mjs";

type JsonObject = Record<string, unknown>;

interface ModuleSource extends JsonObject {
  module: JsonObject & { id: string };
  classes: Array<JsonObject & {
    id: string;
    module_id: string;
    semantic_kind?: string | null;
    primary_parent_relation_id?: string | null;
    status: string;
    review: JsonObject;
  }>;
  relations: Array<JsonObject & {
    id: string;
    predicate: string;
    source_id: string;
    target_id: string;
    status: string;
  }>;
}

interface CandidateArtifact extends JsonObject {
  artifact_metadata: {
    release_channel: "candidate" | "release";
    releasable: boolean;
    generated: boolean;
    do_not_edit: boolean;
    generated_at: string;
    source_tree_sha256: string;
  };
  planes: JsonObject[];
  modules: JsonObject[];
  classes: ModuleSource["classes"];
  relations: ModuleSource["relations"];
  case_paths: JsonObject[];
  ontology_metrics: Record<string, number>;
}

interface TestWorkspace {
  root: string;
  sourceRoot: string;
  outputRoot: string;
  productSourcePath: string;
  moduleSourcePath: string;
  product: JsonObject;
  module: ModuleSource;
}

const repositoryRoot = process.cwd();
const builderPath = resolve(repositoryRoot, "scripts/build-agent-ontology.mjs");
const artifactContractPath = resolve(
  repositoryRoot,
  "schemas/source/agent-ontology-artifact-contract.json",
);
const productFixturePath = resolve(
  repositoryRoot,
  "tests/fixtures/ontology-v2/product-source.valid.json",
);
const moduleFixturePath = resolve(
  repositoryRoot,
  "tests/fixtures/ontology-v2/module-source.valid.json",
);
const publishedCanonicalPath = resolve(repositoryRoot, "ontology/agent-ontology.json");

const expectedCandidateFiles = [
  "fixtures/generated/concept-payload-examples.json",
  "ontology/agent-ontology-definitions.json",
  "ontology/agent-ontology.json",
  "ontology/agent-ontology.md",
  "schemas/agent-ontology.schema.json",
  "schemas/generated/concept-payloads.schema.json",
  "src/generated/source-index.json",
  "src/lib/canonical-ontology-types.ts",
] as const;

const legacyTopLevelFields = [
  "terms",
  "object_properties",
  "data_properties",
  "individuals",
  "axioms",
  "adapter_mappings",
] as const;

const migrationPayloadFields = new Set([
  "migration_legacy",
  "legacy_payload",
  "legacy_record",
  "migration_decision",
  "original_json_pointer",
  "payload_sha256",
  "source_collection",
]);

const temporaryRoots: string[] = [];

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

const stableJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const clone = <T>(value: T): T => structuredClone(value);

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const listFiles = (root: string): string[] => {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    })
    .sort((left, right) => left.localeCompare(right));
};

const relativeFiles = (root: string): string[] =>
  listFiles(root).map((path) => relative(root, path).replaceAll("\\", "/"));

const treeSnapshot = (root: string): Map<string, { bytes: Buffer; mtimeMs: number }> =>
  new Map(
    listFiles(root).map((path) => [
      relative(root, path).replaceAll("\\", "/"),
      { bytes: readFileSync(path), mtimeMs: statSync(path).mtimeMs },
    ]),
  );

const expectSameSnapshot = (
  actual: Map<string, { bytes: Buffer; mtimeMs: number }>,
  expected: Map<string, { bytes: Buffer; mtimeMs: number }>,
): void => {
  expect([...actual.keys()]).toEqual([...expected.keys()]);

  for (const [path, expectedEntry] of expected) {
    const actualEntry = actual.get(path);
    expect(actualEntry, `Missing snapshotted file ${path}`).toBeDefined();
    expect(actualEntry?.bytes.equals(expectedEntry.bytes), `${path} bytes changed`).toBe(true);
    expect(actualEntry?.mtimeMs, `${path} was rewritten`).toBe(expectedEntry.mtimeMs);
  }
};

const writeWorkspaceSources = (workspace: TestWorkspace): void => {
  writeFileSync(workspace.productSourcePath, stableJson(workspace.product), "utf8");
  writeFileSync(workspace.moduleSourcePath, stableJson(workspace.module), "utf8");
};

const createWorkspace = (
  mutate?: (workspace: TestWorkspace) => void,
  outputDirectoryName = "agent-ontology-candidate",
): TestWorkspace => {
  const root = mkdtempSync(join(tmpdir(), "moonweave-ontology-generator-"));
  temporaryRoots.push(root);

  const sourceRoot = resolve(root, "ontology/source");
  const productSourcePath = resolve(sourceRoot, "agent-ontology.product.json");
  const moduleSourcePath = resolve(
    sourceRoot,
    "tool/tool-invocation-execution.json",
  );
  const workspace: TestWorkspace = {
    root,
    sourceRoot,
    outputRoot: resolve(root, `build/${outputDirectoryName}`),
    productSourcePath,
    moduleSourcePath,
    product: readJson<JsonObject>(productFixturePath),
    module: readJson<ModuleSource>(moduleFixturePath),
  };

  mkdirSync(dirname(productSourcePath), { recursive: true });
  mkdirSync(dirname(moduleSourcePath), { recursive: true });
  mutate?.(workspace);
  writeWorkspaceSources(workspace);
  return workspace;
};

const forbiddenCanonicalPreload = (workspace: TestWorkspace): string => {
  const preloadPath = resolve(workspace.root, "forbid-published-canonical.cjs");
  const preload = String.raw`
const fs = require("node:fs");
const moduleBuiltin = require("node:module");
const path = require("node:path");
const forbidden = path.resolve(process.env.MOONWEAVE_FORBIDDEN_CANONICAL).toLowerCase();
const isForbidden = (candidate) =>
  typeof candidate === "string" && path.resolve(candidate).toLowerCase() === forbidden;
const fail = (candidate) => {
  throw new Error("Builder attempted to read the frozen published canonical: " + candidate);
};
const readFileSync = fs.readFileSync;
fs.readFileSync = function (candidate, ...args) {
  if (isForbidden(candidate)) fail(candidate);
  return readFileSync.call(this, candidate, ...args);
};
const readFile = fs.readFile;
fs.readFile = function (candidate, ...args) {
  if (isForbidden(candidate)) fail(candidate);
  return readFile.call(this, candidate, ...args);
};
const promiseReadFile = fs.promises.readFile.bind(fs.promises);
fs.promises.readFile = function (candidate, ...args) {
  if (isForbidden(candidate)) return Promise.reject(new Error("Builder attempted to read the frozen published canonical: " + candidate));
  return promiseReadFile(candidate, ...args);
};
moduleBuiltin.syncBuiltinESMExports();
`;
  writeFileSync(preloadPath, preload, "utf8");
  return preloadPath;
};

const runBuilder = (
  workspace: TestWorkspace,
  extraArguments: string[] = [],
  options: { forbidPublishedCanonical?: boolean } = {},
): SpawnSyncReturns<string> => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    SOURCE_DATE_EPOCH: "1783900800",
  };

  if (options.forbidPublishedCanonical) {
    const preloadPath = forbiddenCanonicalPreload(workspace);
    env.MOONWEAVE_FORBIDDEN_CANONICAL = publishedCanonicalPath;
    env.NODE_OPTIONS = [env.NODE_OPTIONS, `--require=${preloadPath}`].filter(Boolean).join(" ");
  }

  return spawnSync(
    process.execPath,
    [
      builderPath,
      "--source-root",
      workspace.sourceRoot,
      "--output-root",
      workspace.outputRoot,
      "--artifact-contract",
      artifactContractPath,
      ...extraArguments,
    ],
    {
      cwd: workspace.root,
      encoding: "utf8",
      env,
    },
  );
};

const diagnostics = (result: SpawnSyncReturns<string>): string =>
  [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n");

const requireSuccessfulBuild = (
  workspace: TestWorkspace,
  options: { forbidPublishedCanonical?: boolean } = {},
): SpawnSyncReturns<string> => {
  const result = runBuilder(workspace, [], options);
  expect(result.status, diagnostics(result)).toBe(0);
  expect(relativeFiles(workspace.outputRoot)).toEqual(expectedCandidateFiles);
  return result;
};

const expectBuildFailure = (
  workspace: TestWorkspace,
  expectedDiagnostic: RegExp,
): void => {
  const result = runBuilder(workspace);
  expect(result.status, "Malformed source unexpectedly produced a candidate").not.toBe(0);
  expect(diagnostics(result)).toMatch(expectedDiagnostic);
  expect(relativeFiles(workspace.outputRoot)).toEqual([]);
};

const canonicalPath = (workspace: TestWorkspace): string =>
  resolve(workspace.outputRoot, "ontology/agent-ontology.json");

const generatedSchemaPath = (workspace: TestWorkspace): string =>
  resolve(workspace.outputRoot, "schemas/agent-ontology.schema.json");

const readCandidate = (workspace: TestWorkspace): CandidateArtifact =>
  readJson<CandidateArtifact>(canonicalPath(workspace));

const collectKeys = (value: unknown, keys = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, keys);
    }
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      collectKeys(child, keys);
    }
  }

  return keys;
};

const countNamedArrayItems = (
  value: unknown,
  names: ReadonlySet<string>,
  predicate: (item: unknown) => boolean = () => true,
): number => {
  if (Array.isArray(value)) {
    return value.reduce(
      (total, item) => total + countNamedArrayItems(item, names, predicate),
      0,
    );
  }

  if (value === null || typeof value !== "object") {
    return 0;
  }

  return Object.entries(value).reduce((total, [key, child]) => {
    const localCount =
      names.has(key) && Array.isArray(child) ? child.filter(predicate).length : 0;
    return total + localCount + countNamedArrayItems(child, names, predicate);
  }, 0);
};

const derivedMetrics = (canonical: CandidateArtifact): Record<string, number> => {
  const activeIsARelations = canonical.relations.filter(
    (relation) => relation.predicate === "is_a" && relation.status !== "deprecated",
  );
  const conceptsWithParents = new Set(activeIsARelations.map((relation) => relation.source_id));

  return {
    domains: canonical.planes.length,
    modules: canonical.modules.length,
    concepts: canonical.classes.length,
    taxonomy_roots: canonical.classes.filter(
      (concept) => concept.status !== "deprecated" && !conceptsWithParents.has(concept.id),
    ).length,
    is_a_relations: activeIsARelations.length,
    semantic_relations: canonical.relations.filter(
      (relation) => relation.predicate !== "is_a" && relation.status !== "deprecated",
    ).length,
    instance_examples: countNamedArrayItems(
      canonical,
      new Set(["examples"]),
      (item) =>
        item !== null &&
        typeof item === "object" &&
        (item as JsonObject).kind === "instance",
    ),
    controlled_values: countNamedArrayItems(canonical, new Set(["allowed_values"])),
    structure_fields: countNamedArrayItems(canonical, new Set(["fields"])),
    constraints: countNamedArrayItems(
      canonical,
      new Set([
        "constraints",
        "required_relation_constraints",
        "conditions",
        "global_constraints",
      ]),
    ),
    source_claims: countNamedArrayItems(canonical, new Set(["source_claims"])),
    case_paths: canonical.case_paths.length,
    legacy_individuals_remaining: 0,
    legacy_data_properties_remaining: 0,
    legacy_axioms_remaining: 0,
  };
};

const cloneRelationWithIdentity = (
  relation: ModuleSource["relations"][number],
  id: string,
): ModuleSource["relations"][number] => {
  const duplicate = clone(relation);
  duplicate.id = id;

  if (Array.isArray(duplicate.examples)) {
    duplicate.examples = duplicate.examples.map((value, index) => {
      const example = clone(value as JsonObject);
      example.id = `${id}-example-${index + 1}`;
      example.related_relation_ids = [id];
      return example;
    });
  }

  return duplicate;
};

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("deterministic ontology builder contract", () => {
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
        concept.semantic_kind = null;
        concept.status = "draft";
        concept.review = { review_status: "draft", reviewers: [] };
        concept.labels = {
          zh: "安全策略能力活动",
          en: "Security Policy Capability Activity",
          ja: "セキュリティ方針能力アクティビティ",
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

    it("fails duplicate normalized facts even when relation IDs differ", () => {
      const workspace = createWorkspace(({ module }) => {
        module.relations.push(
          cloneRelationWithIdentity(module.relations[0], "duplicate-is-a-fact"),
        );
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

      const result = runBuilder(workspace, ["--release"]);
      expect(result.status).not.toBe(0);
      expect(diagnostics(result)).toMatch(/Release requires every published record to be reviewed/iu);
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
