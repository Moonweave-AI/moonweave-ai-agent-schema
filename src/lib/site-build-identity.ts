const fullLowercaseGitSha = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u;

declare const __MOONWEAVE_BUILD_COMMIT_SHA__: string;

export const assertBuildCommitSha = (value: unknown): string => {
  if (typeof value !== "string" || !fullLowercaseGitSha.test(value)) {
    throw new Error("Compiled build commit must be a full lowercase Git SHA");
  }
  return value;
};

export const compiledBuildCommitSha = assertBuildCommitSha(
  __MOONWEAVE_BUILD_COMMIT_SHA__,
);
