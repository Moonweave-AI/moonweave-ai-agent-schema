import type { ReleaseLifecycleDependencies } from "./ontology-release-pipeline.mjs";

export interface ReleaseCommandProcess {
  readonly execPath: string;
  readonly env: Readonly<Record<string, string | undefined>>;
}

export interface SpawnResult {
  readonly error?: Error;
  readonly status: number | null;
}

export type Spawn = (
  executable: string,
  arguments_: readonly string[],
  options: Readonly<Record<string, unknown>>,
) => SpawnResult;

export interface ReleasePipelineDependencies {
  readonly assertArtifactTreesEqual: (expectedRoot: string, actualRoot: string) => void;
  readonly assertExpectedReleaseArtifactPaths: (stageRoot: string) => void;
  readonly assertPublishedArtifactsMatch: (stageRoot: string, targetRoot: string) => void;
  readonly assertReleaseMatchesCandidate: (candidateRoot: string, releaseRoot: string) => void;
  readonly candidateSourceFingerprint: (canonicalPath: string) => string;
  readonly createReleaseValidationWorkspace: (options: {
    readonly repositoryRoot: string;
    readonly workspaceRoot: string;
    readonly releaseStageRoot: string;
  }) => void;
  readonly executeReleaseLifecycle: (options: ReleaseLifecycleDependencies) => void;
  readonly publishArtifactTree: (options: {
    readonly stageRoot: string;
    readonly targetRoot: string;
    readonly validatePublished: () => unknown;
  }) => unknown;
  readonly releaseValidationEnvironment: (
    workspaceRoot: string,
  ) => Readonly<Record<string, string>>;
  readonly validateStagedOntologyRelease: (options: {
    readonly canonicalPath: string;
    readonly expectedSourceFingerprint: string;
  }) => unknown;
}

export interface ReleaseCommandOptions {
  readonly arguments_?: readonly string[];
  readonly repositoryRoot?: string;
  readonly makeTemporaryRoot?: () => string;
  readonly removeTemporaryRoot?: (root: string) => void;
  readonly spawn?: Spawn;
  readonly processObject?: ReleaseCommandProcess;
  readonly logger?: (message: string) => void;
  readonly pipeline?: ReleasePipelineDependencies;
}

export const ontologyValidationTestFiles: readonly string[];
export function parseOntologyReleaseArguments(
  arguments_: readonly string[],
): Readonly<{ mode: "check" | "release" }>;
export function runNodeCommand(options: Readonly<Record<string, unknown>>): void;
export function runOntologyReleaseCommand(options?: ReleaseCommandOptions): void;
