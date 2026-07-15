import { runZeroToleranceNpmAudit } from "./lib/dependency-security-gates.mjs";
import { parseNoArguments, runCliAdapter } from "./lib/ontology-maintenance-commands.mjs";

export const main = ({ arguments_ = process.argv.slice(2), ...options } = {}) => {
  parseNoArguments(arguments_, "audit-npm-dependencies");
  return runZeroToleranceNpmAudit(options);
};

await runCliAdapter({ moduleUrl: import.meta.url, scriptPath: process.argv[1], main });
