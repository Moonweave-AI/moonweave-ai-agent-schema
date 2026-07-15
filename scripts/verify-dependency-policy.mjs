import { assertReviewedDependencyPolicy, loadReviewedDependencyInputs } from "./lib/dependency-security-gates.mjs";
import { parseNoArguments, runCliAdapter } from "./lib/ontology-maintenance-commands.mjs";

export const main = ({ arguments_ = process.argv.slice(2), repositoryRoot, log = console.log } = {}) => {
  parseNoArguments(arguments_, "verify-dependency-policy");
  assertReviewedDependencyPolicy(loadReviewedDependencyInputs(repositoryRoot));
  log("Dependency policy passed: vis-network and vis-data lock, license, and evidence agree.");
};

await runCliAdapter({ moduleUrl: import.meta.url, scriptPath: process.argv[1], main });
