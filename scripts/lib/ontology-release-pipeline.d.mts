export type ReleaseMode = "check" | "release";

export interface ReleaseLifecycleDependencies {
  mode: ReleaseMode;
  verifyMigration: () => unknown;
  validateDecisions: () => unknown;
  buildAndVerifyCandidates: () => unknown;
  buildAndVerifyRelease: () => unknown;
  runQualityGates: () => unknown;
  checkPublished: () => unknown;
  publishRelease: (options: { validatePublished: () => unknown }) => unknown;
  validatePublishedRelease: () => unknown;
}

export const ontologyReleaseArtifactPaths: ReadonlyArray<string>;

export function releaseValidationEnvironment(workspaceRoot: string): {
  MOONWEAVE_ONTOLOGY_ARTIFACT_PATH: string;
};

export function assertArtifactTreesEqual(expectedRoot: string, actualRoot: string): void;

export function assertArtifactPathSetsEqual(expectedRoot: string, actualRoot: string): void;

export function assertExpectedReleaseArtifactPaths(stageRoot: string): void;

export function assertReleaseMatchesCandidate(candidateRoot: string, releaseRoot: string): void;

export function assertPublishedArtifactsMatch(stageRoot: string, targetRoot: string): void;

export function validateStagedOntologyRelease(options: {
  canonicalPath: string;
  expectedSourceFingerprint: string;
}): Record<string, unknown>;

export function candidateSourceFingerprint(canonicalPath: string): string;

export function publishArtifactTree(options: {
  stageRoot: string;
  targetRoot: string;
  validatePublished?: () => unknown;
}): { changed: number; unchanged: number };

export function createReleaseValidationWorkspace(options: {
  repositoryRoot: string;
  workspaceRoot: string;
  releaseStageRoot: string;
}): void;

export function executeReleaseLifecycle(dependencies: ReleaseLifecycleDependencies): void;
