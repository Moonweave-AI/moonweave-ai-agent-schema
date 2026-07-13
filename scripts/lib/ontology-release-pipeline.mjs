import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  symlinkSync,
} from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import { writeFileTransaction } from "./atomic-write.mjs";

export const ontologyReleaseArtifactPaths = Object.freeze([
  "fixtures/generated/concept-payload-examples.json",
  "ontology/agent-ontology-definitions.json",
  "ontology/agent-ontology.json",
  "ontology/agent-ontology.md",
  "schemas/agent-ontology.schema.json",
  "schemas/generated/concept-payloads.schema.json",
  "src/generated/source-index.json",
  "src/lib/canonical-ontology-types.ts",
]);

export const releaseValidationEnvironment = (workspaceRoot) => ({
  MOONWEAVE_ONTOLOGY_ARTIFACT_PATH: resolve(
    workspaceRoot,
    "ontology/agent-ontology.json",
  ),
});

const normalizePath = (value) => value.replaceAll("\\", "/");

const pathWithinRoot = (root, path) => {
  const relativePath = relative(resolve(root), resolve(path));
  return (
    relativePath === "" ||
    (!isAbsolute(relativePath) &&
      relativePath !== ".." &&
      !relativePath.startsWith("../") &&
      !relativePath.startsWith("..\\"))
  );
};

const activeTransactionSidecars = (targetRoot) => {
  const journalPath = resolve(targetRoot, ".moonweave.txn-journal");
  if (!existsSync(journalPath)) return new Set();
  let metadata;
  try {
    metadata = JSON.parse(readFileSync(journalPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Cannot validate published artifacts because the active transaction journal is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (typeof metadata.transactionId !== "string" || !Array.isArray(metadata.records)) {
    throw new Error("Cannot validate published artifacts because the active transaction journal is malformed");
  }
  const sidecars = new Set();
  for (const record of metadata.records) {
    const { destination, stage, backup } = record ?? {};
    if (
      typeof destination !== "string" ||
      typeof stage !== "string" ||
      typeof backup !== "string" ||
      !pathWithinRoot(targetRoot, destination) ||
      !pathWithinRoot(targetRoot, stage) ||
      !pathWithinRoot(targetRoot, backup) ||
      stage !== `${destination}.txn-stage-${metadata.transactionId}` ||
      backup !== `${destination}.txn-backup-${metadata.transactionId}`
    ) {
      throw new Error("Cannot validate published artifacts because the active transaction journal has invalid sidecars");
    }
    sidecars.add(normalizePath(relative(targetRoot, stage)));
    sidecars.add(normalizePath(relative(targetRoot, backup)));
  }
  return sidecars;
};

const listFiles = (root) => {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(root, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Generated artifact trees cannot contain symbolic links: ${path}`);
      }
      return entry.isDirectory() ? listFiles(path) : [path];
    })
    .sort((left, right) => left.localeCompare(right));
};

const artifactTree = (root) =>
  new Map(
    listFiles(root).map((path) => [
      normalizePath(relative(root, path)),
      readFileSync(path),
    ]),
  );

const destinationWithin = (root, artifactPath) => {
  const rootPath = resolve(root);
  const destination = resolve(rootPath, artifactPath);
  const relativeDestination = relative(rootPath, destination);
  if (
    relativeDestination === "" ||
    relativeDestination.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    relativeDestination === ".." ||
    isAbsolute(relativeDestination)
  ) {
    throw new Error(`Artifact path escapes the release target: ${artifactPath}`);
  }
  return destination;
};

export const assertArtifactTreesEqual = (expectedRoot, actualRoot) => {
  const expected = artifactTree(expectedRoot);
  const actual = artifactTree(actualRoot);
  const paths = [...new Set([...expected.keys(), ...actual.keys()])].sort();
  const differences = paths.flatMap((path) => {
    if (!expected.has(path)) return [`${path} is unexpected`];
    if (!actual.has(path)) return [`${path} is missing`];
    return expected.get(path).equals(actual.get(path)) ? [] : [`${path} differs`];
  });
  if (differences.length > 0) {
    throw new Error(`Artifact trees are not byte-identical:\n- ${differences.join("\n- ")}`);
  }
};

export const assertArtifactPathSetsEqual = (expectedRoot, actualRoot) => {
  const expectedPaths = [...artifactTree(expectedRoot).keys()];
  const actualPaths = [...artifactTree(actualRoot).keys()];
  if (JSON.stringify(expectedPaths) !== JSON.stringify(actualPaths)) {
    throw new Error(
      `Release artifact paths differ from candidate: expected [${expectedPaths.join(", ")}], received [${actualPaths.join(", ")}]`,
    );
  }
};

export const assertExpectedReleaseArtifactPaths = (stageRoot) => {
  const actualPaths = [...artifactTree(stageRoot).keys()];
  if (JSON.stringify(actualPaths) !== JSON.stringify(ontologyReleaseArtifactPaths)) {
    throw new Error(
      `Release stage artifact paths must be exactly [${ontologyReleaseArtifactPaths.join(", ")}]; received [${actualPaths.join(", ")}]`,
    );
  }
};

export const assertReleaseMatchesCandidate = (candidateRoot, releaseRoot) => {
  assertArtifactPathSetsEqual(candidateRoot, releaseRoot);
  const candidate = artifactTree(candidateRoot);
  const release = artifactTree(releaseRoot);
  for (const [artifactPath, candidateBytes] of candidate) {
    const releaseBytes = release.get(artifactPath);
    if (artifactPath !== "ontology/agent-ontology.json") {
      if (!candidateBytes.equals(releaseBytes)) {
        throw new Error(
          `Release artifact ${artifactPath} drifted after candidate preflight`,
        );
      }
      continue;
    }
    const candidateCanonical = JSON.parse(candidateBytes.toString("utf8"));
    const releaseCanonical = JSON.parse(releaseBytes.toString("utf8"));
    releaseCanonical.artifact_metadata = {
      ...releaseCanonical.artifact_metadata,
      release_channel: candidateCanonical.artifact_metadata.release_channel,
      releasable: candidateCanonical.artifact_metadata.releasable,
    };
    if (JSON.stringify(releaseCanonical) !== JSON.stringify(candidateCanonical)) {
      throw new Error(
        "Release canonical drifted from candidate beyond release_channel and releasable metadata",
      );
    }
  }
};

export const assertPublishedArtifactsMatch = (stageRoot, targetRoot) => {
  assertExpectedReleaseArtifactPaths(stageRoot);
  const staged = artifactTree(stageRoot);
  const activeSidecars = activeTransactionSidecars(targetRoot);
  const differences = [];
  for (const [artifactPath, expectedBytes] of staged) {
    const publishedPath = destinationWithin(targetRoot, artifactPath);
    if (!existsSync(publishedPath)) {
      differences.push(`${artifactPath} is missing`);
      continue;
    }
    if (!readFileSync(publishedPath).equals(expectedBytes)) {
      differences.push(`${artifactPath} differs`);
    }
  }
  if (differences.length > 0) {
    throw new Error(`Published ontology artifacts are stale:\n- ${differences.join("\n- ")}`);
  }

  const dedicatedGeneratedRoots = [
    "fixtures/generated",
    "schemas/generated",
    "src/generated",
  ];
  const unexpected = dedicatedGeneratedRoots.flatMap((relativeRoot) => {
    const root = resolve(targetRoot, relativeRoot);
    return listFiles(root)
      .map((path) => normalizePath(relative(targetRoot, path)))
      .filter((path) => !staged.has(path) && !activeSidecars.has(path));
  });
  for (const relativeRoot of ["ontology", "schemas"]) {
    const root = resolve(targetRoot, relativeRoot);
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const path = `${relativeRoot}/${entry.name}`;
      if (!staged.has(path) && !activeSidecars.has(path)) unexpected.push(path);
    }
  }
  if (unexpected.length > 0) {
    throw new Error(
      `Published generated directories contain obsolete artifacts:\n- ${unexpected.join("\n- ")}`,
    );
  }
};

const requiredReleaseMetadata = {
  release_channel: "release",
  releasable: true,
  generated: true,
  do_not_edit: true,
};

const legacyMetricNames = [
  "legacy_individuals_remaining",
  "legacy_data_properties_remaining",
  "legacy_axioms_remaining",
];

const forbiddenLegacyFields = [
  "migration_legacy",
  "terms",
  "object_properties",
  "data_properties",
  "individuals",
  "axioms",
  "adapter_mappings",
];

const releaseLifecycleRecords = (canonical) => {
  const concepts = canonical.classes ?? [];
  return [
    { kind: "ontology", value: canonical, allowDeprecated: false, requiresReview: true },
    ...(canonical.planes ?? []).map((value) => ({
      kind: "plane",
      value,
      allowDeprecated: false,
      requiresReview: true,
    })),
    ...(canonical.modules ?? []).map((value) => ({
      kind: "module",
      value,
      allowDeprecated: false,
      requiresReview: true,
    })),
    ...concepts.map((value) => ({
      kind: "concept",
      value,
      allowDeprecated: true,
      requiresReview: true,
    })),
    ...(canonical.relations ?? []).map((value) => ({
      kind: "relation",
      value,
      allowDeprecated: true,
      requiresReview: true,
    })),
    ...(canonical.case_paths ?? []).map((value) => ({
      kind: "case path",
      value,
      allowDeprecated: false,
      requiresReview: true,
    })),
    ...(canonical.hygiene_gates ?? []).map((value) => ({
      kind: "hygiene gate",
      value,
      allowDeprecated: false,
      requiresReview: false,
    })),
    ...concepts.flatMap((concept) =>
      (concept.structure?.fields ?? []).flatMap((field) =>
        (field.allowed_values ?? []).map((value) => ({
          kind: `controlled value on ${concept.id}.${field.id}`,
          value,
          allowDeprecated: false,
          requiresReview: false,
        })),
      ),
    ),
    ...concepts.flatMap((concept) =>
      (concept.external_mappings ?? []).map((value) => ({
        kind: `external mapping on ${concept.id}`,
        value,
        allowDeprecated: false,
        requiresReview: false,
      })),
    ),
  ];
};

const assertReleaseLifecycle = (canonical) => {
  for (const { kind, value, allowDeprecated, requiresReview } of releaseLifecycleRecords(
    canonical,
  )) {
    const acceptedStatuses = allowDeprecated ? new Set(["accepted", "deprecated"]) : new Set(["accepted"]);
    if (!acceptedStatuses.has(value?.status)) {
      throw new Error(
        `Release ${kind} ${value?.id ?? "<missing-id>"} must have accepted lifecycle status`,
      );
    }
    if (requiresReview && value?.review?.review_status !== "accepted") {
      throw new Error(
        `Release ${kind} ${value?.id ?? "<missing-id>"} must have an accepted review`,
      );
    }
  }
};

export const validateStagedOntologyRelease = ({
  canonicalPath,
  expectedSourceFingerprint,
}) => {
  const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
  const metadata = canonical.artifact_metadata ?? {};
  for (const [name, expected] of Object.entries(requiredReleaseMetadata)) {
    if (metadata[name] !== expected) {
      throw new Error(
        `Staged canonical ${name} must be ${JSON.stringify(expected)}; received ${JSON.stringify(metadata[name])}`,
      );
    }
  }
  if (metadata.source_tree_sha256 !== expectedSourceFingerprint) {
    throw new Error(
      `Release source fingerprint ${metadata.source_tree_sha256} does not match candidate ${expectedSourceFingerprint}`,
    );
  }
  for (const name of forbiddenLegacyFields) {
    if (Object.hasOwn(canonical, name)) {
      throw new Error(`Staged canonical still contains forbidden legacy field ${name}`);
    }
  }
  for (const name of legacyMetricNames) {
    const value = canonical.ontology_metrics?.[name];
    if (value !== 0) {
      throw new Error(`Staged canonical release gate requires ${name}=0; received ${name}=${value}`);
    }
  }
  assertReleaseLifecycle(canonical);
  return canonical;
};

export const candidateSourceFingerprint = (canonicalPath) => {
  const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
  const metadata = canonical.artifact_metadata ?? {};
  if (
    metadata.release_channel !== "candidate" ||
    metadata.releasable !== false ||
    metadata.generated !== true ||
    metadata.do_not_edit !== true
  ) {
    throw new Error("Candidate preflight produced inconsistent artifact metadata");
  }
  if (!/^[a-f0-9]{64}$/u.test(metadata.source_tree_sha256 ?? "")) {
    throw new Error("Candidate preflight produced an invalid source fingerprint");
  }
  return metadata.source_tree_sha256;
};

export const publishArtifactTree = ({
  stageRoot,
  targetRoot,
  validatePublished = () => {},
}) => {
  const staged = artifactTree(stageRoot);
  if (staged.size === 0) throw new Error(`Release stage ${stageRoot} contains no artifacts`);
  const writes = new Map(
    [...staged].map(([artifactPath, bytes]) => [
      destinationWithin(targetRoot, artifactPath),
      bytes,
    ]),
  );
  return writeFileTransaction(writes, {
    afterPublish: validatePublished,
    transactionRoot: targetRoot,
  });
};

export const createReleaseValidationWorkspace = ({
  repositoryRoot,
  workspaceRoot,
  releaseStageRoot,
}) => {
  const relativeWorkspace = relative(resolve(repositoryRoot), resolve(workspaceRoot));
  const workspaceIsOutside =
    isAbsolute(relativeWorkspace) || relativeWorkspace.split(/[\\/]/u)[0] === "..";
  if (!workspaceIsOutside) {
    throw new Error("Release validation workspace must be outside the repository root");
  }
  const excludedTopLevel = new Set([
    ".git",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "playwright-report",
    "test-results",
  ]);
  cpSync(repositoryRoot, workspaceRoot, {
    recursive: true,
    filter: (source) => {
      const relativeSource = normalizePath(relative(repositoryRoot, source));
      if (relativeSource === "") return true;
      if (excludedTopLevel.has(relativeSource.split("/")[0])) return false;
      return !/\.txn-(?:stage|backup)-/u.test(relativeSource);
    },
  });
  const nodeModulesSource = resolve(repositoryRoot, "node_modules");
  if (!existsSync(nodeModulesSource)) {
    throw new Error("Release validation requires installed node_modules");
  }
  symlinkSync(
    nodeModulesSource,
    resolve(workspaceRoot, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  publishArtifactTree({ stageRoot: releaseStageRoot, targetRoot: workspaceRoot });
};

export const executeReleaseLifecycle = ({
  mode,
  verifyMigration,
  validateDecisions,
  buildAndVerifyCandidates,
  buildAndVerifyRelease,
  runQualityGates,
  checkPublished,
  publishRelease,
  validatePublishedRelease,
}) => {
  if (mode !== "check" && mode !== "release") {
    throw new Error(`Unknown ontology release lifecycle mode: ${mode}`);
  }
  verifyMigration();
  validateDecisions();
  buildAndVerifyCandidates();
  buildAndVerifyRelease();
  if (mode === "check") {
    checkPublished();
    return;
  }
  runQualityGates();
  publishRelease({ validatePublished: validatePublishedRelease });
};
