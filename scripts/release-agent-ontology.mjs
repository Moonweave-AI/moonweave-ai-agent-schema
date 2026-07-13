import { pathToFileURL } from "node:url";

import { runOntologyReleaseCommand } from "./lib/ontology-release-command.mjs";

export const main = (options = {}) =>
  runOntologyReleaseCommand({ arguments_: process.argv.slice(2), ...options });

const executedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (executedDirectly) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
