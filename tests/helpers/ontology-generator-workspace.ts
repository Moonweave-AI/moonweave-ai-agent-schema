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
} from "../../scripts/lib/ontology-build-artifacts.mjs";
import {
  loadAndValidateSources,
  mergeAndValidateCanonical,
} from "../../scripts/lib/ontology-build-validation.mjs";
import { parseCsv, parseCsvLine, stringifyCsv } from "../../scripts/lib/csv.mjs";
import {
  deterministicGeneratedAt,
  ONTOLOGY_GENERATOR_VERSION,
} from "../../scripts/lib/generation-metadata.mjs";
import { finalizeCanonicalWithMetrics } from "../../scripts/lib/ontology-semantic-depth-validation.mjs";

export type JsonObject = Record<string, unknown>;

export interface ModuleSource extends JsonObject {
  module: JsonObject & {
    id: string;
    competency_questions: Array<JsonObject & {
      id: string;
      semantic_key: string;
      primary_owner_module_id: string;
      related_module_ids: string[];
    }>;
  };
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

export interface CandidateArtifact extends JsonObject {
  artifact_metadata: {
    release_channel: "candidate" | "release";
    releasable: boolean;
    generated: boolean;
    do_not_edit: boolean;
    generated_at: string;
    generated_from: string[];
    source_tree_sha256: string;
  };
  planes: JsonObject[];
  modules: JsonObject[];
  classes: ModuleSource["classes"];
  relations: ModuleSource["relations"];
  case_paths: JsonObject[];
  ontology_metrics: Record<string, unknown>;
}

export interface TestWorkspace {
  root: string;
  sourceRoot: string;
  outputRoot: string;
  productSourcePath: string;
  moduleSourcePath: string;
  product: JsonObject;
  module: ModuleSource;
}

export const repositoryRoot = process.cwd();
export const builderPath = resolve(repositoryRoot, "scripts/build-agent-ontology.mjs");
export const artifactContractPath = resolve(
  repositoryRoot,
  "schemas/source/agent-ontology-artifact-contract.json",
);
export const productFixturePath = resolve(
  repositoryRoot,
  "tests/fixtures/ontology-v2/product-source.valid.json",
);
export const moduleFixturePath = resolve(
  repositoryRoot,
  "tests/fixtures/ontology-v2/module-source.valid.json",
);
export const publishedCanonicalPath = resolve(repositoryRoot, "ontology/agent-ontology.json");
export const releaseEvidencePaths = [
  "research/ontology-concept-semantic-depth-v3-ledger.csv",
  "research/ontology-module-boundary-v3.csv",
  "research/ontology-module-cq-v3.csv",
  "research/source-registry.csv",
  "research/living-source-metadata.csv",
] as const;

export const expectedCandidateFiles = [
  "fixtures/generated/concept-payload-examples.json",
  "ontology/agent-ontology-definitions.json",
  "ontology/agent-ontology.json",
  "ontology/agent-ontology.md",
  "schemas/agent-ontology.schema.json",
  "schemas/generated/concept-payloads.schema.json",
  "src/generated/source-index.json",
  "src/lib/canonical-ontology-types.ts",
] as const;

export const legacyTopLevelFields = [
  "terms",
  "object_properties",
  "data_properties",
  "individuals",
  "axioms",
  "adapter_mappings",
] as const;

export const migrationPayloadFields = new Set([
  "migration_legacy",
  "legacy_payload",
  "legacy_record",
  "migration_decision",
  "original_json_pointer",
  "payload_sha256",
  "source_collection",
]);

const temporaryRoots: string[] = [];

export const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

export const stableJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export const clone = <T>(value: T): T => structuredClone(value);

export const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

export const listFiles = (root: string): string[] => {
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

export const relativeFiles = (root: string): string[] =>
  listFiles(root).map((path) => relative(root, path).replaceAll("\\", "/"));

export const treeSnapshot = (root: string): Map<string, { bytes: Buffer; mtimeMs: number }> =>
  new Map(
    listFiles(root).map((path) => [
      relative(root, path).replaceAll("\\", "/"),
      { bytes: readFileSync(path), mtimeMs: statSync(path).mtimeMs },
    ]),
  );

export const expectSameSnapshot = (
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

export const writeWorkspaceSources = (workspace: TestWorkspace): void => {
  writeFileSync(workspace.productSourcePath, stableJson(workspace.product), "utf8");
  writeFileSync(workspace.moduleSourcePath, stableJson(workspace.module), "utf8");
};

export const writeReleaseEvidence = (
  workspace: TestWorkspace,
  options: { conceptIds?: readonly string[] } = {},
): void => {
  const conceptIds = options.conceptIds ?? workspace.module.classes.map(({ id }) => id);
  const repositoryConceptLedger = readFileSync(
    resolve(repositoryRoot, releaseEvidencePaths[0]),
  );
  const conceptColumns = parseCsvLine(
    repositoryConceptLedger.toString("utf8").split(/\r?\n/u)[0],
  );
  const repositoryRowsById = new Map(
    parseCsv(repositoryConceptLedger).map((row) => [row.concept_id, row]),
  );
  const conceptRows = conceptIds.map((conceptId) => {
    const concept = workspace.module.classes.find(({ id }) => id === conceptId) as
      | (ModuleSource["classes"][number] & {
          labels: { zh: string };
          examples: Array<{ id: string; kind: string }>;
          source_claims: Array<{ source_id: string }>;
          review: {
            review_status: string;
            reviewers: Array<{ reviewer_id: string; reviewer_role: string }>;
          };
        })
      | undefined;
    const repositoryRow = repositoryRowsById.get(conceptId);
    if (!concept || !repositoryRow) throw new Error(`Missing fixture ledger row ${conceptId}`);
    const primaryBackbone = workspace.module.relations.find(
      (relation) =>
        relation.status === "accepted" &&
        relation.layout_role === "primary-backbone" &&
        relation.layout_child_id === conceptId,
    );
    return {
      ...repositoryRow,
      target_domain_id: workspace.module.module.plane_id as string,
      target_module_id: concept.module_id,
      proposed_label_zh: concept.labels.zh,
      proposed_semantic_kind: concept.semantic_kind ?? "",
      proposed_primary_parent_relation_id: concept.primary_parent_relation_id ?? "",
      proposed_backbone_relation_id: primaryBackbone?.id ?? "",
      definition_family: concept.semantic_kind ?? "",
      owner_rationale: `${(workspace.module.module.labels as { zh: string }).zh}按 identity、semantic kind 和主问题唯一拥有该概念。`,
      source_ids: concept.source_claims.map(({ source_id: sourceId }) => sourceId).sort().join("|"),
      positive_example_id:
        concept.examples.find(({ kind }) => kind === "positive")?.id ?? "",
      boundary_example_id:
        concept.examples.find(({ kind }) => ["boundary", "counterexample"].includes(kind))?.id ?? "",
      domain_reviewer:
        concept.review.reviewers.find(({ reviewer_role: role }) => role === "domain")
          ?.reviewer_id ?? "",
      ontology_reviewer:
        concept.review.reviewers.find(({ reviewer_role: role }) => role === "ontology")
          ?.reviewer_id ?? "",
      review_status: concept.review.review_status,
    };
  });
  const conceptDocument = stringifyCsv(conceptColumns, conceptRows);
  const questionRows = workspace.module.module.competency_questions
    .map((question) => [
      question.semantic_key,
      question.id,
      question.primary_owner_module_id,
      [...question.related_module_ids].sort().join("|"),
      "accepted",
    ].join(","))
    .join("\n");
  const questionIds = workspace.module.module.competency_questions
    .map(({ id }) => id)
    .sort()
    .join("|");
  const evidence = new Map<string, string>([
    [
      releaseEvidencePaths[0],
      conceptDocument,
    ],
    [
      releaseEvidencePaths[1],
      `module_id,primary_cq_ids,review_status\n${workspace.module.module.id},${questionIds},accepted\n`,
    ],
    [
      releaseEvidencePaths[2],
      `semantic_key,cq_id,primary_owner_module_id,related_module_ids,review_status\n${questionRows}\n`,
    ],
    [releaseEvidencePaths[3], "source_id,review_status\nsynthetic-source,accepted\n"],
    [releaseEvidencePaths[4], "source_id,review_status\nsynthetic-source,accepted\n"],
  ]);
  for (const [relativePath, contents] of evidence) {
    const path = resolve(workspace.root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents, "utf8");
  }
};

export const createWorkspace = (
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

export const forbiddenCanonicalPreload = (workspace: TestWorkspace): string => {
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

export const runBuilder = (
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

export const diagnostics = (result: SpawnSyncReturns<string>): string =>
  [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n");

export const requireSuccessfulBuild = (
  workspace: TestWorkspace,
  options: { forbidPublishedCanonical?: boolean } = {},
): SpawnSyncReturns<string> => {
  const result = runBuilder(workspace, [], options);
  expect(result.status, diagnostics(result)).toBe(0);
  expect(relativeFiles(workspace.outputRoot)).toEqual(expectedCandidateFiles);
  return result;
};

export const expectBuildFailure = (
  workspace: TestWorkspace,
  expectedDiagnostic: RegExp,
): void => {
  const result = runBuilder(workspace);
  expect(result.status, "Malformed source unexpectedly produced a candidate").not.toBe(0);
  expect(diagnostics(result)).toMatch(expectedDiagnostic);
  expect(relativeFiles(workspace.outputRoot)).toEqual([]);
};

export const canonicalPath = (workspace: TestWorkspace): string =>
  resolve(workspace.outputRoot, "ontology/agent-ontology.json");

export const generatedSchemaPath = (workspace: TestWorkspace): string =>
  resolve(workspace.outputRoot, "schemas/agent-ontology.schema.json");

export const readCandidate = (workspace: TestWorkspace): CandidateArtifact =>
  readJson<CandidateArtifact>(canonicalPath(workspace));

export const collectKeys = (value: unknown, keys = new Set<string>()): Set<string> => {
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

export const countNamedArrayItems = (
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

export const derivedMetrics = (canonical: CandidateArtifact): Record<string, unknown> => {
  const activeIsARelations = canonical.relations.filter(
    (relation) => relation.predicate === "is_a" && relation.status !== "deprecated",
  );
  const conceptsWithBackboneParents = new Set(
    canonical.relations
      .filter(
        (relation) =>
          relation.status !== "deprecated" && relation.layout_role === "primary-backbone",
      )
      .map((relation) => String(relation.layout_child_id)),
  );
  const moduleCountByDomain = canonical.modules.reduce<Record<string, number>>(
    (counts, module) => {
      const planeId = String(module.plane_id);
      return { ...counts, [planeId]: (counts[planeId] ?? 0) + 1 };
    },
    {},
  );
  const rootStatusCounts = canonical.classes
    .filter(
      (concept) =>
        concept.status !== "deprecated" && !conceptsWithBackboneParents.has(concept.id),
    )
    .reduce<Record<string, number>>((counts, concept) => {
      const rootStatus = String(concept.root_status ?? "missing");
      return { ...counts, [rootStatus]: (counts[rootStatus] ?? 0) + 1 };
    }, {});
  const primaryBackboneParent = new Map(
    canonical.relations
      .filter(
        (relation) =>
          relation.status !== "deprecated" && relation.layout_role === "primary-backbone",
      )
      .map((relation) => [String(relation.layout_child_id), String(relation.layout_parent_id)]),
  );
  const depthMemo = new Map<string, number>();
  const depthFor = (conceptId: string): number => {
    const cached = depthMemo.get(conceptId);
    if (cached !== undefined) return cached;
    const parentId = primaryBackboneParent.get(conceptId);
    const depth = parentId === undefined ? 0 : depthFor(parentId) + 1;
    depthMemo.set(conceptId, depth);
    return depth;
  };
  for (const concept of canonical.classes.filter(({ status }) => status !== "deprecated")) {
    depthFor(concept.id);
  }
  const conceptDepthHistogram = [...depthMemo.values()].reduce<Record<string, number>>(
    (counts, depth) => ({
      ...counts,
      [String(depth)]: (counts[String(depth)] ?? 0) + 1,
    }),
    {},
  );

  return {
    domains: canonical.planes.length,
    modules: canonical.modules.length,
    concepts: canonical.classes.length,
    taxonomy_roots: canonical.classes.filter(
      (concept) =>
        concept.status !== "deprecated" && !conceptsWithBackboneParents.has(concept.id),
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
    module_count_by_domain: moduleCountByDomain,
    root_status_counts: rootStatusCounts,
    concept_depth_histogram: conceptDepthHistogram,
    max_concept_depth: Math.max(0, ...depthMemo.values()),
    unresolved_root_count: canonical.classes.filter(
      (concept) => concept.status !== "deprecated" && concept.root_status === "unresolved-root",
    ).length,
    cross_kind_is_a_count: 0,
    primary_backbone_cycle_count: 0,
    template_text_violation_count: 0,
    module_label_suffix_violation_count: 0,
    unowned_cq_count: 0,
  };
};

export const cloneRelationWithIdentity = (
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
