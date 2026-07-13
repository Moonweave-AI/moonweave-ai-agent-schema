import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
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
  it("keeps package and isolated-release ontology validation scopes identical", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const packageValidationFiles = packageJson.scripts["ontology:validate"]
      ?.split(/\s+/u)
      .slice(2);

    expect(packageValidationFiles).toEqual(ontologyValidationTestFiles);
    expect(new Set(ontologyValidationTestFiles).size).toBe(
      ontologyValidationTestFiles.length,
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

    const spawnedArguments = spawn.mock.calls.map(([, arguments_]) => arguments_ as string[]);
    expect(spawnedArguments).toHaveLength(13);
    expect(spawnedArguments[0]?.at(0)).toMatch(/verify-ontology-security\.mjs$/u);
    expect(spawnedArguments[1]).toEqual(
      expect.arrayContaining(["--referenced-only", "--allow-inconclusive"]),
    );
    expect(spawnedArguments.filter((arguments_) => arguments_.includes("--output-root")))
      .toHaveLength(3);
    expect(spawnedArguments.some((arguments_) => arguments_.includes("--coverage"))).toBe(true);
    expect(
      spawnedArguments.some(
        (arguments_) =>
          arguments_[0]?.endsWith("vitest.mjs") &&
          arguments_.includes("tests/ontology-release-command.test.ts"),
      ),
    ).toBe(true);
    expect(pipeline.createReleaseValidationWorkspace).toHaveBeenCalledOnce();
    expect(pipeline.publishArtifactTree).toHaveBeenCalledOnce();
    expect(pipeline.assertPublishedArtifactsMatch).toHaveBeenCalledOnce();
    expect(removeTemporaryRoot).toHaveBeenCalledWith(temporaryRoot);
    expect(logger).toHaveBeenCalledWith(
      expect.stringMatching(/release committed after all quality gates passed/iu),
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

    expect(spawn).toHaveBeenCalledTimes(7);
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
    const spawn = vi.fn(() => ({ ...successfulSpawn(), status: 9 }));

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

    const result = spawnSync(process.execPath, [rootScript, "--unknown"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/Unknown argument: --unknown/u);
  });
});
