import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  coverageExcludedTestFiles,
  ontologyPerformanceTestFiles,
  ontologyValidationTestFiles,
  parseOntologyReleaseArguments,
  runNodeCommand,
  runOntologyReleaseCommand,
} from "../scripts/lib/ontology-release-command.mjs";
import { executeReleaseLifecycle } from "../scripts/lib/ontology-release-pipeline.mjs";

const repositoryRoot = process.cwd();
const temporaryRoot = resolve(repositoryRoot, "..", "release-command-test-workspace");

const successfulSpawn = (
  _executable?: string,
  _arguments?: readonly string[],
  _options?: Readonly<Record<string, unknown>>,
) => ({
  pid: 1,
  output: [],
  stdout: null,
  stderr: null,
  status: 0,
  signal: null,
});

const fakePipeline = () => {
  const assertPublishedArtifactsMatch = vi.fn();
  return {
    assertArtifactTreesEqual: vi.fn(),
    assertExpectedReleaseArtifactPaths: vi.fn(),
    assertPublishedArtifactsMatch,
    assertReleaseMatchesCandidate: vi.fn(),
    candidateSourceFingerprint: vi.fn(() => "a".repeat(64)),
    createReleaseValidationWorkspace: vi.fn(),
    executeReleaseLifecycle,
    publishArtifactTree: vi.fn(
      ({ validatePublished }: { validatePublished: () => void }) => validatePublished(),
    ),
    releaseValidationEnvironment: vi.fn(() => ({
      MOONWEAVE_ONTOLOGY_ARTIFACT_PATH: resolve(
        temporaryRoot,
        "validation-workspace/ontology/agent-ontology.json",
      ),
    })),
    validateStagedOntologyRelease: vi.fn(),
  };
};

describe("ontology release command", () => {
  it("keeps package and isolated-release ontology validation scopes aligned", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const [packageContractCommand, packagePerformanceCommand] =
      packageJson.scripts["ontology:validate"]?.split(" && ") ?? [];
    const packageContractArguments = packageContractCommand?.split(/\s+/u);
    const packagePerformanceArguments = packagePerformanceCommand?.split(/\s+/u);

    expect(packageContractArguments).toEqual([
      "vitest",
      "run",
      "--exclude",
      ...coverageExcludedTestFiles,
    ]);
    expect(new Set(ontologyValidationTestFiles).size).toBe(
      ontologyValidationTestFiles.length,
    );
    expect(ontologyValidationTestFiles).not.toContain(
      "tests/ontology-layout-dense-scenes.test.ts",
    );
    expect(ontologyValidationTestFiles).not.toContain(
      "tests/ontology-layout-performance.test.ts",
    );
    expect(ontologyValidationTestFiles).not.toContain(
      "tests/ontology-relation-layout.test.ts",
    );
    expect(packagePerformanceArguments).toEqual([
      "vitest",
      "run",
      ...ontologyPerformanceTestFiles,
      "--maxWorkers=1",
      "--no-file-parallelism",
    ]);
  });

  it("runs every ontology contract in release validation or an explicit isolated gate", () => {
    const isolatedOntologyTests = new Set([
      "tests/ontology-client-loading.test.ts",
      ...ontologyPerformanceTestFiles,
    ]);
    const discoveredOntologyTests = readdirSync(resolve(repositoryRoot, "tests"))
      .filter((file) => /^ontology-.*\.test\.(?:ts|tsx)$/u.test(file))
      .map((file) => `tests/${file}`)
      .sort();

    expect(discoveredOntologyTests.filter((file) =>
      !ontologyValidationTestFiles.includes(file) && !isolatedOntologyTests.has(file)))
      .toEqual([]);
  });

  it("excludes only the wall-clock community-network benchmark from coverage", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const packageCoverageArguments = packageJson.scripts["test:coverage"]
      ?.split(/\s+/u)
      .slice(2);
    const packageCoverageExclusions = packageCoverageArguments
      ?.flatMap((argument, index, arguments_) =>
        argument === "--exclude" ? [arguments_[index + 1]] : [])
      .filter((value): value is string => value !== undefined);

    expect(coverageExcludedTestFiles).toEqual([
      "tests/ontology-community-network-performance.test.ts",
    ]);
    expect(packageCoverageExclusions).toEqual(coverageExcludedTestFiles);
    expect(packageJson.scripts["test:unit"]).toBe("vitest run");
  });

  it("exposes a portable deterministic community-projection verification command", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts["ontology:communities:verify"]).toBe(
      "npm run ontology:communities:test && npm run ontology:communities:generate && " +
      "npm run ontology:communities:check && git diff --exit-code -- " +
      "src/generated/ontology-community-graph.json",
    );
    expect(packageJson.scripts["ontology:verify"]).toMatch(
      /^npm run ontology:communities:verify &&/u,
    );
  });

  it("pins the Python community-projection toolchain in validation and deployment CI", () => {
    const requirements = readFileSync(
      resolve(repositoryRoot, "requirements-graph-visualization.txt"),
      "utf8",
    );
    const validationWorkflow = readFileSync(
      resolve(repositoryRoot, ".github/workflows/ontology-validation.yml"),
      "utf8",
    );
    const deploymentWorkflow = readFileSync(
      resolve(repositoryRoot, ".github/workflows/deploy.yml"),
      "utf8",
    );
    const setupPython =
      "actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1";
    const dependencyInstall =
      "python -m pip install --disable-pip-version-check --require-hashes --requirement " +
      "requirements-graph-visualization.txt";

    expect(requirements).toMatch(
      /^networkx==3\.6\.1 \\\r?\n\s+--hash=sha256:[a-f0-9]{64}$/mu,
    );

    for (const workflow of [validationWorkflow, deploymentWorkflow]) {
      expect(workflow).toContain(setupPython);
      expect(workflow).toContain('python-version: "3.13.5"');
      expect(workflow).toContain("cache-dependency-path: requirements-graph-visualization.txt");
      expect(workflow).toContain(dependencyInstall);
    }
    expect(validationWorkflow).toContain(
      "run: npm run ontology:communities:verify",
    );
  });

  it("accepts only the release default and the exact --check form", () => {
    expect(parseOntologyReleaseArguments([])).toEqual({ mode: "release" });
    expect(parseOntologyReleaseArguments(["--check"])).toEqual({ mode: "check" });
    for (const arguments_ of [["--unknown"], ["--check", "extra"], ["release"]]) {
      expect(() => parseOntologyReleaseArguments(arguments_)).toThrow(/Unknown argument/u);
    }
  });

  it("turns spawn errors and non-zero exits into labelled command failures", () => {
    const base = {
      label: "Synthetic gate",
      script: resolve(repositoryRoot, "scripts/synthetic-gate.mjs"),
      cwd: repositoryRoot,
      processObject: { execPath: process.execPath, env: {} },
      logger: vi.fn(),
    };

    expect(() =>
      runNodeCommand({
        ...base,
        spawn: () => ({ ...successfulSpawn(), error: new Error("spawn unavailable") }),
      }),
    ).toThrow(/spawn unavailable/u);
    expect(() =>
      runNodeCommand({
        ...base,
        spawn: () => ({ ...successfulSpawn(), status: 7 }),
      }),
    ).toThrow(/Synthetic gate failed with exit code 7/u);

    const spawn = vi.fn(successfulSpawn);
    runNodeCommand({ ...base, args: ["--safe"], spawn });
    expect(spawn).toHaveBeenCalledWith(
      process.execPath,
      [base.script, "--safe"],
      expect.objectContaining({ cwd: repositoryRoot, stdio: "inherit" }),
    );
  });

  it("runs the complete release orchestration with injected commands and no recursive Vitest", () => {
    const pipeline = fakePipeline();
    const spawn = vi.fn(successfulSpawn);
    const removeTemporaryRoot = vi.fn();
    const logger = vi.fn();

    runOntologyReleaseCommand({
      arguments_: [],
      repositoryRoot,
      makeTemporaryRoot: () => temporaryRoot,
      removeTemporaryRoot,
      spawn,
      processObject: { execPath: process.execPath, env: { SOURCE_DATE_EPOCH: "1" } },
      logger,
      pipeline,
    });

    const spawnedCommands = spawn.mock.calls.map(([executable, arguments_, options]) => ({
      executable,
      arguments: arguments_ as string[],
      options,
    }));
    const spawnedArguments = spawnedCommands.map(({ arguments: commandArguments }) =>
      commandArguments);
    expect(spawnedArguments).toHaveLength(27);
    expect(spawnedArguments[0]?.at(0)).toMatch(/verify-dependency-policy\.mjs$/u);
    expect(spawnedArguments[1]?.at(0)).toMatch(/audit-npm-dependencies\.mjs$/u);
    expect(spawnedArguments[2]?.at(0)).toMatch(/verify-ontology-security\.mjs$/u);
    expect(spawnedArguments[3]).toEqual(
      expect.arrayContaining(["--referenced-only", "--allow-inconclusive"]),
    );
    expect(spawnedArguments.filter((arguments_) => arguments_.includes("--output-root")))
      .toHaveLength(4);
    const communityGenerations = spawnedCommands.filter(
      ({ arguments: commandArguments }) =>
        commandArguments[0]?.endsWith("generate-ontology-community-graph.py"),
    );
    expect(communityGenerations).toHaveLength(4);
    const communityGeneration = communityGenerations.find(
      ({ arguments: commandArguments }) =>
        commandArguments.includes(
          resolve(temporaryRoot, "release/ontology/agent-ontology.json"),
        ),
    );
    expect(communityGeneration).toEqual(expect.objectContaining({
      executable: "python",
      arguments: [
        expect.stringMatching(/generate-ontology-community-graph\.py$/u),
        "--input",
        resolve(temporaryRoot, "release/ontology/agent-ontology.json"),
        "--output",
        resolve(
          temporaryRoot,
          "release/src/generated/ontology-community-graph.json",
        ),
      ],
    }));
    const communityVerifications = spawnedCommands.filter(
      ({ arguments: commandArguments }) =>
        commandArguments[0]?.endsWith("verify-ontology-community-graph.mjs"),
    );
    expect(communityVerifications).toHaveLength(4);
    const communityVerification = communityVerifications.find(({ options }) =>
      (options as { cwd?: string }).cwd === resolve(temporaryRoot, "release"));
    expect(communityVerification).toEqual(expect.objectContaining({
      executable: process.execPath,
      options: expect.objectContaining({ cwd: resolve(temporaryRoot, "release") }),
    }));
    const performanceInvocation = spawnedArguments.find((arguments_) =>
      arguments_[2] === ontologyPerformanceTestFiles[0]);
    expect(performanceInvocation).toEqual([
      expect.stringMatching(/vitest\.mjs$/u),
      "run",
      ...ontologyPerformanceTestFiles,
      "--maxWorkers=1",
      "--no-file-parallelism",
    ]);
    const coverageInvocation = spawnedArguments.find((arguments_) =>
      arguments_.includes("--coverage"));
    expect(coverageInvocation).toEqual([
      expect.stringMatching(/vitest\.mjs$/u),
      "run",
      "--coverage",
      "--exclude",
      ...coverageExcludedTestFiles,
      "--coverage.reportsDirectory",
      resolve(temporaryRoot, "coverage"),
    ]);
    expect(
      spawnedArguments.some((arguments_) =>
        arguments_[0]?.endsWith("write-site-build-manifest.mjs")),
    ).toBe(true);
    expect(
      spawnedArguments.some((arguments_) =>
        arguments_[0]?.endsWith("verify-site-artifact.mjs")),
    ).toBe(true);
    const stagedSiteVerification = spawn.mock.calls.find(([, arguments_]) =>
      (arguments_ as string[])[0]?.endsWith("verify-site-artifact.mjs"));
    expect(stagedSiteVerification?.[2]).toEqual(
      expect.objectContaining({
        cwd: resolve(temporaryRoot, "validation-workspace"),
        env: expect.objectContaining({
          MOONWEAVE_ONTOLOGY_ARTIFACT_PATH: resolve(
            temporaryRoot,
            "validation-workspace/ontology/agent-ontology.json",
          ),
        }),
      }),
    );
    expect(
      spawnedArguments.some(
        (arguments_) =>
          arguments_[0]?.endsWith("vitest.mjs") &&
          arguments_.includes("tests/ontology-release-command.test.ts"),
      ),
    ).toBe(true);
    const browserContractInvocation = spawnedArguments.find((arguments_) =>
      /@playwright[\\/]test[\\/]cli\.js$/u.test(arguments_[0] ?? ""));
    expect(browserContractInvocation).toEqual([
      expect.stringMatching(/@playwright[\\/]test[\\/]cli\.js$/u),
      "test",
      "--output",
      resolve(temporaryRoot, "playwright-results"),
    ]);
    expect(pipeline.createReleaseValidationWorkspace).toHaveBeenCalledOnce();
    expect(pipeline.publishArtifactTree).toHaveBeenCalledOnce();
    expect(pipeline.assertPublishedArtifactsMatch).toHaveBeenCalledOnce();
    expect(removeTemporaryRoot).toHaveBeenCalledWith(temporaryRoot);
    expect(logger).toHaveBeenCalledWith(
      expect.stringMatching(/release artifacts materialized after portable quality gates passed/iu),
    );
  });

  it("uses check mode without coverage, E2E, or publication and still cleans up", () => {
    const pipeline = fakePipeline();
    const spawn = vi.fn(successfulSpawn);
    const removeTemporaryRoot = vi.fn();

    runOntologyReleaseCommand({
      arguments_: ["--check"],
      repositoryRoot,
      makeTemporaryRoot: () => temporaryRoot,
      removeTemporaryRoot,
      spawn,
      processObject: { execPath: process.execPath, env: {} },
      logger: vi.fn(),
      pipeline,
    });

    expect(spawn).toHaveBeenCalledTimes(13);
    expect(
      spawn.mock.calls.some(([, arguments_]) =>
        /(?:verify-dependency-policy|audit-npm-dependencies)\.mjs$/u.test(
          (arguments_ as string[])[0] ?? "",
        )),
    ).toBe(false);
    expect(
      spawn.mock.calls.some(([, arguments_]) => (arguments_ as string[]).includes("--coverage")),
    ).toBe(false);
    expect(pipeline.publishArtifactTree).not.toHaveBeenCalled();
    expect(pipeline.assertPublishedArtifactsMatch).toHaveBeenCalledOnce();
    expect(removeTemporaryRoot).toHaveBeenCalledWith(temporaryRoot);
  });

  it("propagates a labelled preflight failure and cleans up without entering the lifecycle", () => {
    const pipeline = fakePipeline();
    const removeTemporaryRoot = vi.fn();
    const spawn = vi.fn((_executable?: string, arguments_?: readonly string[]) => ({
      ...successfulSpawn(),
      status: arguments_?.[0]?.endsWith("verify-ontology-security.mjs") ? 9 : 0,
    }));

    expect(() =>
      runOntologyReleaseCommand({
        arguments_: [],
        repositoryRoot,
        makeTemporaryRoot: () => temporaryRoot,
        removeTemporaryRoot,
        spawn,
        processObject: { execPath: process.execPath, env: {} },
        logger: vi.fn(),
        pipeline,
      }),
    ).toThrow(/Validate repository published-content security failed with exit code 9/u);

    expect(pipeline.assertArtifactTreesEqual).not.toHaveBeenCalled();
    expect(removeTemporaryRoot).toHaveBeenCalledWith(temporaryRoot);
  });

  it("keeps the root script as a thin adapter and rejects bad CLI input in a subprocess", () => {
    const rootScript = resolve(repositoryRoot, "scripts/release-agent-ontology.mjs");
    const source = readFileSync(rootScript, "utf8");
    expect(source).toContain("runOntologyReleaseCommand");
    expect(source.split(/\r?\n/u).length).toBeLessThanOrEqual(30);
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-example-field-semantics.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-external-mapping-integrity.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-release-command.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-runtime.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-source-claim-relevance.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-source-text-integrity.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-semantic-golden-paths.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-semantic-integrity.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/ontology-semantic-depth-release.test.ts",
    );
    expect(ontologyValidationTestFiles).toContain(
      "tests/site-build-scripts.test.ts",
    );

    const result = spawnSync(process.execPath, [rootScript, "--unknown"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/Unknown argument: --unknown/u);
  });
});
