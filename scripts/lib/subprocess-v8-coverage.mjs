import { fileURLToPath } from "node:url";

export const subprocessCoverageDirectoryEnvironmentVariable =
  "MOONWEAVE_VITEST_SUBPROCESS_V8_COVERAGE";

export const childProcessCoverageEnvironment = (environment = process.env) => {
  const childEnvironment = { ...environment };
  const coverageDirectory =
    environment[subprocessCoverageDirectoryEnvironmentVariable];
  if (coverageDirectory) {
    childEnvironment.NODE_V8_COVERAGE = coverageDirectory;
  } else {
    delete childEnvironment.NODE_V8_COVERAGE;
  }
  return childEnvironment;
};

export const selectIncludedProcessCoverage = (rawCoverage, isIncluded) => {
  if (!rawCoverage || typeof rawCoverage !== "object" || !Array.isArray(rawCoverage.result)) {
    throw new Error("Raw subprocess V8 coverage must contain a valid result array");
  }

  const result = rawCoverage.result.filter((entry) => {
    if (!entry || typeof entry !== "object" || typeof entry.url !== "string") {
      throw new Error("Raw subprocess V8 coverage entry must contain a valid URL");
    }
    if (!entry.url.startsWith("file://")) return false;
    return isIncluded(fileURLToPath(entry.url));
  });

  return { ...rawCoverage, result };
};
