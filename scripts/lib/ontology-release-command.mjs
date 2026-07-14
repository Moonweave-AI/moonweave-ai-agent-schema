import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  assertArtifactTreesEqual,
  assertExpectedReleaseArtifactPaths,
  assertPublishedArtifactsMatch,
  assertReleaseMatchesCandidate,
  candidateSourceFingerprint,
  createReleaseValidationWorkspace,
  executeReleaseLifecycle,
  publishArtifactTree,
  releaseValidationEnvironment,
  validateStagedOntologyRelease,
} from "./ontology-release-pipeline.mjs";

const defaultRepositoryRoot = resolve(import.meta.dirname, "../..");

export const ontologyValidationTestFiles = Object.freeze([
  "tests/ontology-bootstrap.test.ts",
  "tests/ontology-components-behavior.test.tsx",
  "tests/ontology-concept-examples.test.ts",
  "tests/ontology-contract.test.ts",
  "tests/ontology-controlled-values.test.ts",
  "tests/ontology-domain-decisions.test.ts",
  "tests/ontology-example-field-semantics.test.ts",
  "tests/ontology-external-mapping-integrity.test.ts",
  "tests/ontology-generator.test.ts",
  "tests/ontology-graph-behavior.test.tsx",
  "tests/ontology-information.test.ts",
  "tests/ontology-legacy-audit.test.ts",
  "tests/ontology-legacy-migration.test.ts",
  "tests/ontology-maintenance-commands.test.ts",
  "tests/ontology-multilingual-semantic-integrity.test.ts",
  "tests/ontology-relations.test.ts",
  "tests/ontology-release-command.test.ts",
  "tests/ontology-release-pipeline.test.ts",
  "tests/ontology-reviewed-adapter-mappings.test.ts",
  "tests/ontology-reviewed-relations.test.ts",
  "tests/ontology-reviewed-structures.test.ts",
  "tests/ontology-runtime.test.ts",
  "tests/ontology-security-gates.test.ts",
  "tests/ontology-source-claim-relevance.test.ts",
  "tests/ontology-source-text-integrity.test.ts",
  "tests/ontology-taxonomy.test.ts",
  "tests/ontology-ui-contract.test.tsx",
  "tests/ontology-view-model.test.ts",
  "tests/schema-validation.test.ts",
  "tests/source-registry.test.ts",
  "tests/source-link-checker.test.ts",
  "tests/atomic-write.test.ts",
  "tests/generation-metadata.test.ts",
  "tests/graph.test.ts",
  "tests/profile-projection.test.ts",
]);

const defaultPipeline = Object.freeze({
  assertArtifactTreesEqual,
  assertExpectedReleaseArtifactPaths,
  assertPublishedArtifactsMatch,
  assertReleaseMatchesCandidate,
  candidateSourceFingerprint,
  createReleaseValidationWorkspace,
  executeReleaseLifecycle,
  publishArtifactTree,
  releaseValidationEnvironment,
  validateStagedOntologyRelease,
});

export const parseOntologyReleaseArguments = (arguments_) => {
  if (arguments_.length === 0) return { mode: "release" };
  if (arguments_.length === 1 && arguments_[0] === "--check") return { mode: "check" };
  throw new Error(`Unknown argument: ${arguments_.join(" ")}`);
};

export const runNodeCommand = ({
  label,
  script,
  args = [],
  cwd,
  environment = {},
  spawn = spawnSync,
  processObject = process,
  logger = console.log,
}) => {
  logger(`\n[ontology release] ${label}`);
  const result = spawn(processObject.execPath, [script, ...args], {
    cwd,
    env: { ...processObject.env, ...environment },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
};

export const runOntologyReleaseCommand = ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  makeTemporaryRoot = () =>
    mkdtempSync(join(tmpdir(), "moonweave-ontology-release-")),
  removeTemporaryRoot = (root) => rmSync(root, { recursive: true, force: true }),
  spawn = spawnSync,
  processObject = process,
  logger = console.log,
  pipeline = defaultPipeline,
} = {}) => {
  const { mode } = parseOntologyReleaseArguments(arguments_);
  const scriptsRoot = resolve(repositoryRoot, "scripts");
  const paths = {
    migrationAudit: resolve(scriptsRoot, "verify-legacy-ontology-migration-audit.mjs"),
    decisions: resolve(scriptsRoot, "validate-ontology-domain-decisions.mjs"),
    builder: resolve(scriptsRoot, "build-agent-ontology.mjs"),
    security: resolve(scriptsRoot, "verify-ontology-security.mjs"),
    sourceLinks: resolve(scriptsRoot, "check-source-links.mjs"),
  };
  const runNode = (label, script, args = [], options = {}) =>
    runNodeCommand({
      label,
      script,
      args,
      cwd: options.cwd ?? repositoryRoot,
      environment: options.environment ?? {},
      spawn,
      processObject,
      logger,
    });

  const temporaryRoot = makeTemporaryRoot();
  const candidateA = resolve(temporaryRoot, "candidate-a");
  const candidateB = resolve(temporaryRoot, "candidate-b");
  const releaseStage = resolve(temporaryRoot, "release");
  const validationWorkspace = resolve(temporaryRoot, "validation-workspace");
  const canonicalPath = (root) => resolve(root, "ontology/agent-ontology.json");
  let sourceFingerprint = null;

  const buildCandidate = (outputRoot) =>
    runNode("Build candidate", paths.builder, ["--output-root", outputRoot]);

  const runQualityGates = () => {
    pipeline.createReleaseValidationWorkspace({
      repositoryRoot,
      workspaceRoot: validationWorkspace,
      releaseStageRoot: releaseStage,
    });
    const validationPaths = {
      vitest: resolve(validationWorkspace, "node_modules/vitest/vitest.mjs"),
      typescript: resolve(validationWorkspace, "node_modules/typescript/bin/tsc"),
      vite: resolve(validationWorkspace, "node_modules/vite/bin/vite.js"),
      playwright: resolve(validationWorkspace, "node_modules/@playwright/test/cli.js"),
      security: resolve(validationWorkspace, "scripts/verify-ontology-security.mjs"),
    };
    const validationCommand = {
      cwd: validationWorkspace,
      environment: pipeline.releaseValidationEnvironment(validationWorkspace),
    };
    runNode(
      "Validate ontology contracts",
      validationPaths.vitest,
      ["run", ...ontologyValidationTestFiles],
      validationCommand,
    );
    runNode(
      "Validate published-content security",
      validationPaths.security,
      [],
      validationCommand,
    );
    runNode(
      "Run unit and integration coverage",
      validationPaths.vitest,
      [
        "run",
        "--coverage",
        "--coverage.reportsDirectory",
        resolve(temporaryRoot, "coverage"),
      ],
      validationCommand,
    );
    runNode(
      "Typecheck",
      validationPaths.typescript,
      ["-b", "--pretty", "false"],
      validationCommand,
    );
    runNode(
      "Build application",
      validationPaths.vite,
      [
        "build",
        "--outDir",
        resolve(temporaryRoot, "application-build"),
        "--emptyOutDir",
      ],
      validationCommand,
    );
    runNode(
      "Run ontology explorer E2E",
      validationPaths.playwright,
      [
        "test",
        "e2e/ontology-explorer.spec.ts",
        "--output",
        resolve(temporaryRoot, "playwright-results"),
      ],
      {
        cwd: validationWorkspace,
        environment: {
          PLAYWRIGHT_HTML_OUTPUT_DIR: resolve(temporaryRoot, "playwright-report"),
        },
      },
    );
  };

  try {
    runNode("Validate repository published-content security", paths.security);
    runNode("Check referenced source links", paths.sourceLinks, [
      "--referenced-only",
      "--allow-inconclusive",
    ]);
    pipeline.executeReleaseLifecycle({
      mode,
      verifyMigration: () =>
        runNode(
          "Audit frozen v1 lineage against the source-first ontology",
          paths.migrationAudit,
        ),
      validateDecisions: () =>
        runNode("Validate reviewed Domain decisions", paths.decisions),
      buildAndVerifyCandidates: () => {
        buildCandidate(candidateA);
        buildCandidate(candidateB);
        pipeline.assertArtifactTreesEqual(candidateA, candidateB);
        sourceFingerprint = pipeline.candidateSourceFingerprint(canonicalPath(candidateA));
      },
      buildAndVerifyRelease: () => {
        runNode("Build isolated release stage", paths.builder, [
          "--release",
          "--output-root",
          releaseStage,
        ]);
        pipeline.assertExpectedReleaseArtifactPaths(releaseStage);
        pipeline.assertReleaseMatchesCandidate(candidateA, releaseStage);
        pipeline.validateStagedOntologyRelease({
          canonicalPath: canonicalPath(releaseStage),
          expectedSourceFingerprint: sourceFingerprint,
        });
      },
      checkPublished: () =>
        pipeline.assertPublishedArtifactsMatch(releaseStage, repositoryRoot),
      publishRelease: ({ validatePublished }) =>
        pipeline.publishArtifactTree({
          stageRoot: releaseStage,
          targetRoot: repositoryRoot,
          validatePublished,
        }),
      runQualityGates,
      validatePublishedRelease: () =>
        pipeline.assertPublishedArtifactsMatch(releaseStage, repositoryRoot),
    });
    logger(
      mode === "check"
        ? "\nOntology migration, candidate determinism, and published artifacts are current."
        : "\nOntology release committed after all quality gates passed.",
    );
  } finally {
    removeTemporaryRoot(temporaryRoot);
  }
};
