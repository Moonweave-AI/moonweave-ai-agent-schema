import {
  childProcessCoverageEnvironment,
  subprocessCoverageDirectoryEnvironmentVariable,
} from "../../scripts/lib/subprocess-v8-coverage.mjs";

if (process.env[subprocessCoverageDirectoryEnvironmentVariable]) {
  const childEnvironment = childProcessCoverageEnvironment(process.env);
  process.env.NODE_V8_COVERAGE = childEnvironment.NODE_V8_COVERAGE;
}
