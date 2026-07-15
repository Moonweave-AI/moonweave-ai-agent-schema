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
  ontologyCommunityArtifactPath,
  publishArtifactTree,
  releaseValidationEnvironment,
  validateStagedOntologyRelease,
} from "./ontology-release-pipeline.mjs";
import { currentCommitSha, currentRef } from "./site-build-metadata.mjs";

const defaultRepositoryRoot = resolve(import.meta.dirname, "../..");

export const ontologyValidationTestFiles = Object.freeze([
  "tests/dependency-security-gates.test.ts",
  "tests/graph-accessibility.test.tsx",
  "tests/ontology-backbone.test.ts",
  "tests/ontology-bootstrap.test.ts",
  "tests/ontology-bootstrap-runtime.test.tsx",
  "tests/ontology-components-behavior.test.tsx",
  "tests/ontology-concept-examples.test.ts",
  "tests/ontology-concept-genus-differentia.test.ts",
  "tests/ontology-contract.test.ts",
  "tests/ontology-controlled-values.test.ts",
  "tests/ontology-domain-closure.test.ts",
  "tests/ontology-domain-decisions.test.ts",
  "tests/ontology-delegation-structures.test.ts",
  "tests/ontology-deprecated-visibility.test.tsx",
  "tests/ontology-e2e-interaction-contract.test.ts",
  "tests/ontology-e2e-long-task-contract.test.ts",
  "tests/ontology-example-field-semantics.test.ts",
  "tests/ontology-external-mapping-integrity.test.ts",
  "tests/ontology-generator.test.ts",
  "tests/ontology-generator-projections.test.ts",
  "tests/ontology-generator-validation.test.ts",
  "tests/ontology-community-artifact.test.ts",
  "tests/ontology-community-network.test.ts",
  "tests/ontology-graph-behavior.test.tsx",
  "tests/ontology-graph-runtime-lifecycle.test.tsx",
  "tests/ontology-information.test.ts",
  "tests/ontology-information-integrity.test.ts",
  "tests/ontology-information-projection.test.ts",
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
  "tests/ontology-module-boundary.test.ts",
  "tests/ontology-module-owner-consistency.test.ts",
  "tests/ontology-artifact-size.test.ts",
  "tests/ontology-language-naturalness.test.ts",
  "tests/ontology-semantic-golden-paths.test.ts",
  "tests/ontology-semantic-integrity.test.ts",
  "tests/ontology-shared-prefix-audit.test.ts",
  "tests/ontology-semantic-differentia-agency.test.ts",
  "tests/ontology-semantic-depth-release.test.ts",
  "tests/ontology-validation-boundaries.test.ts",
  "tests/ontology-v3-object-evidence.test.ts",
  "tests/ontology-record-operations-core.test.ts",
  "tests/ontology-record-operations-synchronization.test.ts",
  "tests/ontology-layout-worker-contract.test.ts",
  "tests/ontology-scene.test.ts",
  "tests/ontology-ui-contract.test.tsx",
  "tests/ontology-view-model.test.ts",
  "tests/schema-validation.test.ts",
  "tests/site-build-manifest.test.ts",
  "tests/site-build-scripts.test.ts",
  "tests/source-registry.test.ts",
  "tests/source-link-checker.test.ts",
  "tests/atomic-write.test.ts",
  "tests/generation-metadata.test.ts",
  "tests/graph.test.ts",
  "tests/profile-projection.test.ts",
]);

export const ontologyPerformanceTestFiles = Object.freeze([
  "tests/ontology-community-network-performance.test.ts",
]);

export const coverageExcludedTestFiles = Object.freeze([
  "tests/ontology-community-network-performance.test.ts",
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

const runCommand = ({
  label,
  executable,
  script,
  args = [],
  cwd,
  environment = {},
  spawn = spawnSync,
  processObject = process,
  logger = console.log,
}) => {
  logger(`\n[ontology release] ${label}`);
  const result = spawn(executable, [script, ...args], {
    cwd,
    env: { ...processObject.env, ...environment },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
};

export const runNodeCommand = (options) =>
  runCommand({
    ...options,
    executable: options.processObject?.execPath ?? process.execPath,
  });

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
    dependencyPolicy: resolve(scriptsRoot, "verify-dependency-policy.mjs"),
    dependencyAudit: resolve(scriptsRoot, "audit-npm-dependencies.mjs"),
    communityGenerator: resolve(scriptsRoot, "generate-ontology-community-graph.py"),
    communityVerifier: resolve(scriptsRoot, "verify-ontology-community-graph.mjs"),
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
  const runPython = (label, script, args = [], options = {}) =>
    runCommand({
      label,
      executable: "python",
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
  const liveCandidate = resolve(temporaryRoot, "candidate-live-source");
  const releaseStage = resolve(temporaryRoot, "release");
  const validationWorkspace = resolve(temporaryRoot, "validation-workspace");
  const canonicalPath = (root) => resolve(root, "ontology/agent-ontology.json");
  const communityArtifactPath = (root) =>
    resolve(root, ontologyCommunityArtifactPath);
  let sourceFingerprint = null;

  const materializeCommunityProjection = (outputRoot) => {
    runPython(
      "Generate deterministic NetworkX community projection",
      paths.communityGenerator,
      [
        "--input",
        canonicalPath(outputRoot),
        "--output",
        communityArtifactPath(outputRoot),
      ],
    );
    runNode(
      "Verify NetworkX community projection",
      paths.communityVerifier,
      [],
      { cwd: outputRoot },
    );
  };

  const buildCandidate = (outputRoot) => {
    runNode("Build candidate", paths.builder, ["--output-root", outputRoot]);
    materializeCommunityProjection(outputRoot);
  };

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
      siteManifest: resolve(validationWorkspace, "scripts/write-site-build-manifest.mjs"),
      siteVerify: resolve(validationWorkspace, "scripts/verify-site-artifact.mjs"),
    };
    const validationCommand = {
      cwd: validationWorkspace,
      environment: {
        ...pipeline.releaseValidationEnvironment(validationWorkspace),
        GITHUB_SHA:
          processObject.env.GITHUB_SHA ?? currentCommitSha(repositoryRoot),
        GITHUB_REF_NAME:
          processObject.env.GITHUB_REF_NAME ?? currentRef(repositoryRoot),
      },
    };
    runNode(
      "Validate ontology contracts",
      validationPaths.vitest,
      ["run", ...ontologyValidationTestFiles],
      validationCommand,
    );
    runNode(
      "Validate isolated community-network model performance",
      validationPaths.vitest,
      [
        "run",
        ...ontologyPerformanceTestFiles,
        "--maxWorkers=1",
        "--no-file-parallelism",
      ],
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
        "--exclude",
        ...coverageExcludedTestFiles,
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
      ["build", "--emptyOutDir"],
      validationCommand,
    );
    runNode(
      "Write staged site build manifest",
      validationPaths.siteManifest,
      [],
      validationCommand,
    );
    runNode(
      "Verify staged site artifact",
      validationPaths.siteVerify,
      [],
      validationCommand,
    );
    runNode(
      "Run complete browser contract suite",
      validationPaths.playwright,
      [
        "test",
        "--output",
        resolve(temporaryRoot, "playwright-results"),
      ],
      {
        cwd: validationWorkspace,
        environment: {
          ...validationCommand.environment,
          PLAYWRIGHT_HTML_OUTPUT_DIR: resolve(temporaryRoot, "playwright-report"),
        },
      },
    );
  };

  try {
    if (mode === "release") {
      runNode("Validate locked dependency policy", paths.dependencyPolicy);
      runNode("Audit all known dependency vulnerabilities", paths.dependencyAudit);
    }
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
        materializeCommunityProjection(releaseStage);
        pipeline.assertExpectedReleaseArtifactPaths(releaseStage);
        pipeline.assertReleaseMatchesCandidate(candidateA, releaseStage);
        pipeline.validateStagedOntologyRelease({
          canonicalPath: canonicalPath(releaseStage),
          expectedSourceFingerprint: sourceFingerprint,
          recordArtifactSize: (record) =>
            logger(`\n[ontology release] Artifact size gate ${JSON.stringify(record)}`),
        });
      },
      checkPublished: () =>
        pipeline.assertPublishedArtifactsMatch(releaseStage, repositoryRoot),
      publishRelease: ({ validatePublished }) => {
        buildCandidate(liveCandidate);
        pipeline.assertArtifactTreesEqual(candidateA, liveCandidate);
        return pipeline.publishArtifactTree({
          stageRoot: releaseStage,
          targetRoot: repositoryRoot,
          validatePublished,
        });
      },
      runQualityGates,
      validatePublishedRelease: () =>
        pipeline.assertPublishedArtifactsMatch(releaseStage, repositoryRoot),
    });
    logger(
      mode === "check"
        ? "\nOntology migration, candidate determinism, and published artifacts are current."
        : "\nOntology release artifacts materialized after portable quality gates passed; " +
          "runner-specific visual review remains required before publication.",
    );
  } finally {
    removeTemporaryRoot(temporaryRoot);
  }
};
