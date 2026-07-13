export const subprocessCoverageDirectoryEnvironmentVariable: string;

export const childProcessCoverageEnvironment: (
  environment?: NodeJS.ProcessEnv,
) => NodeJS.ProcessEnv;

interface V8ScriptCoverage {
  readonly url: string;
  readonly functions: readonly unknown[];
  readonly [key: string]: unknown;
}

interface V8ProcessCoverage {
  readonly result: readonly V8ScriptCoverage[];
  readonly [key: string]: unknown;
}

export const selectIncludedProcessCoverage: (
  rawCoverage: unknown,
  isIncluded: (filePath: string) => boolean,
) => V8ProcessCoverage;
