import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { computeOntologyMetrics } from "../scripts/lib/ontology-build-validation.mjs";
import {
  assertArtifactPathSetsEqual,
  assertArtifactTreesEqual,
  assertExpectedReleaseArtifactPaths,
  assertPublishedArtifactsMatch,
  assertReleaseMatchesCandidate,
  candidateSourceFingerprint,
  createReleaseValidationWorkspace,
  executeReleaseLifecycle,
  ontologyReleaseArtifactPaths,
  publishArtifactTree,
  releaseValidationEnvironment,
  validateStagedOntologyRelease,
} from "../scripts/lib/ontology-release-pipeline.mjs";

const temporaryRoots: string[] = [];

const temporaryRoot = (): string => {
  const root = mkdtempSync(resolve(tmpdir(), "moonweave-release-pipeline-"));
  temporaryRoots.push(root);
  return root;
};

const writeArtifact = (root: string, path: string, contents = path): void => {
  const destination = resolve(root, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents, "utf8");
};

const writeExactReleaseTree = (root: string): void => {
  for (const path of ontologyReleaseArtifactPaths) writeArtifact(root, path);
};

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("ontology release lifecycle", () => {
  it("audits frozen lineage against current source without rewriting source", () => {
    const repositoryRoot = process.cwd();
    const migrationAuditPath = resolve(
      repositoryRoot,
      "scripts/verify-legacy-ontology-migration-audit.mjs",
    );
    const sourcePath = resolve(
      repositoryRoot,
      "ontology/source/agent-ontology.product.json",
    );
    const before = {
      bytes: readFileSync(sourcePath),
      mtimeMs: statSync(sourcePath).mtimeMs,
    };

    const result = spawnSync(process.execPath, [migrationAuditPath], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(readFileSync(sourcePath).equals(before.bytes)).toBe(true);
    expect(statSync(sourcePath).mtimeMs).toBe(before.mtimeMs);
  });

  it("rejects bypassing the release pipeline through a direct root builder write", () => {
    const repositoryRoot = process.cwd();
    const builderPath = resolve(repositoryRoot, "scripts/build-agent-ontology.mjs");
    for (const releaseArguments of [[], ["--release"]]) {
      const result = spawnSync(
        process.execPath,
        [builderPath, ...releaseArguments, "--output-root", repositoryRoot],
        { cwd: repositoryRoot, encoding: "utf8" },
      );

      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toMatch(
        /Direct builder writes into the repository root are forbidden/u,
      );
    }
  });

  it("runs migration and deterministic candidate preflight before transactional release", () => {
    const calls: string[] = [];

    executeReleaseLifecycle({
      mode: "release",
      verifyMigration: () => calls.push("migration"),
      validateDecisions: () => calls.push("decisions"),
      buildAndVerifyCandidates: () => calls.push("candidates"),
      buildAndVerifyRelease: () => calls.push("release-stage"),
      checkPublished: () => calls.push("check-published"),
      publishRelease: ({ validatePublished }) => {
        calls.push("publish");
        validatePublished();
        calls.push("commit");
      },
      runQualityGates: () => calls.push("quality"),
      validatePublishedRelease: () => calls.push("final-verify"),
    });

    expect(calls).toEqual([
      "migration",
      "decisions",
      "candidates",
      "release-stage",
      "quality",
      "publish",
      "final-verify",
      "commit",
    ]);
  });

  it("never enters the release transaction when candidate preflight fails", () => {
    const publishRelease = vi.fn();

    expect(() =>
      executeReleaseLifecycle({
        mode: "release",
        verifyMigration: () => undefined,
        validateDecisions: () => undefined,
        buildAndVerifyCandidates: () => {
          throw new Error("candidate mismatch");
        },
        buildAndVerifyRelease: () => undefined,
        checkPublished: () => undefined,
        publishRelease,
        runQualityGates: () => undefined,
        validatePublishedRelease: () => undefined,
      }),
    ).toThrow(/candidate mismatch/u);

    expect(publishRelease).not.toHaveBeenCalled();
  });

  it("uses check mode without publishing or running duplicate quality gates", () => {
    const calls: string[] = [];

    executeReleaseLifecycle({
      mode: "check",
      verifyMigration: () => calls.push("migration"),
      validateDecisions: () => calls.push("decisions"),
      buildAndVerifyCandidates: () => calls.push("candidates"),
      buildAndVerifyRelease: () => calls.push("release-stage"),
      checkPublished: () => calls.push("check-published"),
      publishRelease: () => calls.push("publish"),
      runQualityGates: () => calls.push("quality"),
      validatePublishedRelease: () => calls.push("final-verify"),
    });

    expect(calls).toEqual([
      "migration",
      "decisions",
      "candidates",
      "release-stage",
      "check-published",
    ]);
  });

  it("rejects an unsupported release lifecycle mode before invoking any phase", () => {
    const phase = vi.fn();

    expect(() =>
      executeReleaseLifecycle({
        mode: "preview" as never,
        verifyMigration: phase,
        validateDecisions: phase,
        buildAndVerifyCandidates: phase,
        buildAndVerifyRelease: phase,
        checkPublished: phase,
        publishRelease: phase,
        runQualityGates: phase,
        validatePublishedRelease: phase,
      }),
    ).toThrow(/Unknown ontology release lifecycle mode/u);
    expect(phase).not.toHaveBeenCalled();
  });
});

describe("staged artifact safeguards", () => {
  it("builds an isolated validation workspace with the staged release installed", () => {
    const root = temporaryRoot();
    const repository = resolve(root, "repository");
    const workspace = resolve(root, "validation");
    const stage = resolve(root, "stage");
    mkdirSync(resolve(repository, "node_modules"), { recursive: true });
    mkdirSync(resolve(repository, "dist"), { recursive: true });
    mkdirSync(stage, { recursive: true });
    writeFileSync(resolve(repository, "source.txt"), "working-tree-source", "utf8");
    writeFileSync(resolve(repository, "dist/old.js"), "old-build", "utf8");
    writeFileSync(resolve(repository, "artifact.json"), "previous-release", "utf8");
    writeFileSync(resolve(stage, "artifact.json"), "staged-release", "utf8");

    createReleaseValidationWorkspace({
      repositoryRoot: repository,
      workspaceRoot: workspace,
      releaseStageRoot: stage,
    });

    expect(readFileSync(resolve(workspace, "source.txt"), "utf8")).toBe(
      "working-tree-source",
    );
    expect(readFileSync(resolve(workspace, "artifact.json"), "utf8")).toBe(
      "staged-release",
    );
    expect(() => statSync(resolve(workspace, "dist/old.js"))).toThrow();
    expect(statSync(resolve(workspace, "node_modules")).isDirectory()).toBe(true);
    expect(releaseValidationEnvironment(workspace)).toEqual({
      MOONWEAVE_ONTOLOGY_ARTIFACT_PATH: resolve(
        workspace,
        "ontology/agent-ontology.json",
      ),
    });
  });

  it("allows only release metadata to change after candidate preflight", () => {
    const candidate = temporaryRoot();
    const release = temporaryRoot();
    const candidateCanonical = {
      artifact_metadata: { release_channel: "candidate", releasable: false },
      id: "same-ontology",
    };
    const releaseCanonical = {
      artifact_metadata: { release_channel: "release", releasable: true },
      id: "same-ontology",
    };
    for (const [root, canonical] of [
      [candidate, candidateCanonical],
      [release, releaseCanonical],
    ] as const) {
      mkdirSync(resolve(root, "ontology"), { recursive: true });
      writeFileSync(
        resolve(root, "ontology/agent-ontology.json"),
        JSON.stringify(canonical),
        "utf8",
      );
      writeFileSync(resolve(root, "source-index.json"), "same-index", "utf8");
    }

    expect(() => assertReleaseMatchesCandidate(candidate, release)).not.toThrow();
    writeFileSync(resolve(release, "source-index.json"), "drifted-index", "utf8");
    expect(() => assertReleaseMatchesCandidate(candidate, release)).toThrow(
      /source-index\.json drifted/u,
    );
  });

  it("compares complete artifact trees byte-for-byte", () => {
    const first = temporaryRoot();
    const second = temporaryRoot();
    writeFileSync(resolve(first, "artifact.json"), "same", "utf8");
    writeFileSync(resolve(second, "artifact.json"), "different", "utf8");

    expect(() => assertArtifactTreesEqual(first, second)).toThrow(
      /artifact\.json differs/u,
    );
  });

  it("reports missing and unexpected artifact-tree entries separately", () => {
    const expected = temporaryRoot();
    const actual = temporaryRoot();
    writeArtifact(expected, "expected-only.json");
    writeArtifact(actual, "actual-only.json");

    expect(() => assertArtifactTreesEqual(expected, actual)).toThrow(
      /actual-only\.json is unexpected[\s\S]*expected-only\.json is missing/u,
    );
    expect(() => assertArtifactTreesEqual(resolve(expected, "absent"), resolve(actual, "absent")))
      .not.toThrow();
  });

  it("checks exact release path sets independently from artifact bytes", () => {
    const expected = temporaryRoot();
    const actual = temporaryRoot();
    writeArtifact(expected, "artifact-a.json", "expected");
    writeArtifact(actual, "artifact-a.json", "actual");

    expect(() => assertArtifactPathSetsEqual(expected, actual)).not.toThrow();
    writeArtifact(actual, "artifact-b.json");
    expect(() => assertArtifactPathSetsEqual(expected, actual)).toThrow(
      /Release artifact paths differ from candidate/u,
    );

    const releaseStage = temporaryRoot();
    writeExactReleaseTree(releaseStage);
    expect(() => assertExpectedReleaseArtifactPaths(releaseStage)).not.toThrow();
    rmSync(resolve(releaseStage, ontologyReleaseArtifactPaths[0]));
    expect(() => assertExpectedReleaseArtifactPaths(releaseStage)).toThrow(
      /Release stage artifact paths must be exactly/u,
    );
  });

  it("rejects canonical drift beyond the two release metadata fields", () => {
    const candidate = temporaryRoot();
    const release = temporaryRoot();
    writeArtifact(
      candidate,
      "ontology/agent-ontology.json",
      JSON.stringify({
        artifact_metadata: { release_channel: "candidate", releasable: false },
        id: "candidate-id",
      }),
    );
    writeArtifact(
      release,
      "ontology/agent-ontology.json",
      JSON.stringify({
        artifact_metadata: { release_channel: "release", releasable: true },
        id: "drifted-id",
      }),
    );

    expect(() => assertReleaseMatchesCandidate(candidate, release)).toThrow(
      /canonical drifted/u,
    );
  });

  it("rejects a release stage that still reports a legacy collection", () => {
    const root = temporaryRoot();
    writeFileSync(
      resolve(root, "canonical.json"),
      JSON.stringify({
        artifact_metadata: {
          release_channel: "release",
          releasable: true,
          generated: true,
          do_not_edit: true,
          source_tree_sha256: "a".repeat(64),
        },
        ontology_metrics: {
          legacy_individuals_remaining: 1,
          legacy_data_properties_remaining: 0,
          legacy_axioms_remaining: 0,
        },
      }),
      "utf8",
    );

    expect(() =>
      validateStagedOntologyRelease({
        canonicalPath: resolve(root, "canonical.json"),
        expectedSourceFingerprint: "a".repeat(64),
      }),
    ).toThrow(/legacy_individuals_remaining=1/u);
  });

  it("validates every release metadata, fingerprint, and legacy-shape safeguard", () => {
    const root = temporaryRoot();
    const canonicalPath = resolve(root, "canonical.json");
    const fingerprint = "a".repeat(64);
    const validCanonical = {
      id: "agent-ontology",
      status: "accepted",
      review: { review_status: "accepted" },
      artifact_metadata: {
        release_channel: "release",
        releasable: true,
        generated: true,
        do_not_edit: true,
        source_tree_sha256: fingerprint,
      },
      ontology_metrics: {
        legacy_individuals_remaining: 0,
        legacy_data_properties_remaining: 0,
        legacy_axioms_remaining: 0,
      },
      planes: [],
      modules: [],
      classes: [],
      relations: [],
      case_paths: [],
      hygiene_gates: [],
    };
    const validate = (canonical: object, expectedSourceFingerprint = fingerprint): void => {
      writeFileSync(canonicalPath, JSON.stringify(canonical), "utf8");
      validateStagedOntologyRelease({ canonicalPath, expectedSourceFingerprint });
    };

    expect(() => validate(validCanonical)).not.toThrow();
    expect(() =>
      validate({
        ...validCanonical,
        artifact_metadata: { ...validCanonical.artifact_metadata, generated: false },
      }),
    ).toThrow(/generated must be true/u);
    expect(() => validate(validCanonical, "b".repeat(64))).toThrow(
      /does not match candidate/u,
    );
    expect(() => validate({ ...validCanonical, individuals: [] })).toThrow(
      /forbidden legacy field individuals/u,
    );
    expect(() =>
      validate({
        ...validCanonical,
        review: { review_status: "draft" },
      }),
    ).toThrow(/accepted review/u);
    expect(() =>
      validate({
        ...validCanonical,
        modules: [
          {
            id: "draft-module",
            status: "review",
            review: { review_status: "accepted" },
          },
        ],
      }),
    ).toThrow(/draft-module/u);
  });

  it("accepts only an unpublished candidate with a SHA-256 source fingerprint", () => {
    const root = temporaryRoot();
    const candidatePath = resolve(root, "candidate.json");
    const fingerprint = "c".repeat(64);
    const candidate = {
      artifact_metadata: {
        release_channel: "candidate",
        releasable: false,
        generated: true,
        do_not_edit: true,
        source_tree_sha256: fingerprint,
      },
    };
    const writeCandidate = (value: object): void =>
      writeFileSync(candidatePath, JSON.stringify(value), "utf8");

    writeCandidate(candidate);
    expect(candidateSourceFingerprint(candidatePath)).toBe(fingerprint);
    for (const artifact_metadata of [
      { ...candidate.artifact_metadata, release_channel: "release" },
      { ...candidate.artifact_metadata, releasable: true },
      { ...candidate.artifact_metadata, generated: false },
      { ...candidate.artifact_metadata, do_not_edit: false },
    ]) {
      writeCandidate({ artifact_metadata });
      expect(() => candidateSourceFingerprint(candidatePath)).toThrow(
        /inconsistent artifact metadata/u,
      );
    }
    writeCandidate({
      artifact_metadata: {
        ...candidate.artifact_metadata,
        source_tree_sha256: "not-a-sha256",
      },
    });
    expect(() => candidateSourceFingerprint(candidatePath)).toThrow(
      /invalid source fingerprint/u,
    );
  });

  it("checks published bytes, missing files, and obsolete generated artifacts", () => {
    const stage = temporaryRoot();
    const target = temporaryRoot();
    writeExactReleaseTree(stage);
    writeExactReleaseTree(target);
    expect(() => assertPublishedArtifactsMatch(stage, target)).not.toThrow();

    rmSync(resolve(target, ontologyReleaseArtifactPaths[0]));
    expect(() => assertPublishedArtifactsMatch(stage, target)).toThrow(/is missing/u);
    writeArtifact(target, ontologyReleaseArtifactPaths[0]);
    writeArtifact(target, ontologyReleaseArtifactPaths[1], "drifted");
    expect(() => assertPublishedArtifactsMatch(stage, target)).toThrow(/differs/u);
    writeArtifact(target, ontologyReleaseArtifactPaths[1]);
    writeArtifact(target, "schemas/generated/obsolete.json");
    expect(() => assertPublishedArtifactsMatch(stage, target)).toThrow(
      /obsolete artifacts/u,
    );
  });

  it("publishes only staged relative paths under the target root", () => {
    const stage = temporaryRoot();
    const target = temporaryRoot();
    writeFileSync(resolve(stage, "artifact.json"), "new", "utf8");

    publishArtifactTree({ stageRoot: stage, targetRoot: target });

    expect(readFileSync(resolve(target, "artifact.json"), "utf8")).toBe("new");
  });

  it("validates the published tree inside a transaction without accepting stale sidecars", () => {
    const stage = temporaryRoot();
    const target = temporaryRoot();
    writeExactReleaseTree(stage);
    for (const path of ontologyReleaseArtifactPaths) {
      writeArtifact(target, path, `previous-${path}`);
    }

    expect(() =>
      publishArtifactTree({
        stageRoot: stage,
        targetRoot: target,
        validatePublished: () => assertPublishedArtifactsMatch(stage, target),
      }),
    ).not.toThrow();
    expect(() => assertPublishedArtifactsMatch(stage, target)).not.toThrow();

    writeArtifact(
      target,
      "ontology/obsolete.json.txn-backup-stale-transaction",
      "stale",
    );
    expect(() => assertPublishedArtifactsMatch(stage, target)).toThrow(/obsolete artifacts/u);
  });

  it("rejects an empty release stage", () => {
    expect(() =>
      publishArtifactTree({ stageRoot: temporaryRoot(), targetRoot: temporaryRoot() }),
    ).toThrow(/contains no artifacts/u);
  });

  it("restores every published artifact when a quality gate fails", () => {
    const stage = temporaryRoot();
    const target = temporaryRoot();
    const artifactPath = resolve(target, "artifact.json");
    writeFileSync(resolve(stage, "artifact.json"), "candidate-release", "utf8");
    writeFileSync(artifactPath, "previous-release", "utf8");

    expect(() =>
      publishArtifactTree({
        stageRoot: stage,
        targetRoot: target,
        validatePublished: () => {
          expect(readFileSync(artifactPath, "utf8")).toBe("candidate-release");
          throw new Error("E2E failed");
        },
      }),
    ).toThrow(/E2E failed/u);

    expect(readFileSync(artifactPath, "utf8")).toBe("previous-release");
  });

  it("rejects validation workspaces inside the repository and missing dependencies", () => {
    const repository = temporaryRoot();
    mkdirSync(resolve(repository, "nested"), { recursive: true });
    expect(() =>
      createReleaseValidationWorkspace({
        repositoryRoot: repository,
        workspaceRoot: resolve(repository, "nested"),
        releaseStageRoot: temporaryRoot(),
      }),
    ).toThrow(/must be outside the repository root/u);

    expect(() =>
      createReleaseValidationWorkspace({
        repositoryRoot: repository,
        workspaceRoot: resolve(temporaryRoot(), "workspace"),
        releaseStageRoot: temporaryRoot(),
      }),
    ).toThrow(/requires installed node_modules/u);
  });
});

describe("migration metrics", () => {
  it("counts remaining legacy top-level records instead of hard-coding zero", () => {
    const canonical = {
      planes: [],
      modules: [],
      classes: [],
      relations: [],
      case_paths: [],
      individuals: [{ id: "legacy-individual" }],
      data_properties: [{ id: "legacy-field" }, { id: "legacy-field-2" }],
      axioms: [{ id: "legacy-axiom" }],
    };

    expect(computeOntologyMetrics(canonical)).toEqual(
      expect.objectContaining({
        legacy_individuals_remaining: 1,
        legacy_data_properties_remaining: 2,
        legacy_axioms_remaining: 1,
      }),
    );
  });
});
