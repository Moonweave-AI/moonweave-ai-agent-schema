import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const builderPath = resolve(import.meta.dirname, "build-agent-ontology.mjs");

console.warn(
  "[deprecated] ontology:expand now delegates to the source-first v2 builder. " +
    "Edit ontology/source/**; never edit generated canonical artifacts.",
);

const result = spawnSync(
  process.execPath,
  [builderPath, ...process.argv.slice(2)],
  { cwd: repositoryRoot, encoding: "utf8", stdio: "inherit" },
);

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
