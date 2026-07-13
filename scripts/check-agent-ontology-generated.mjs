import {
  runCliAdapter,
  runGeneratedCheckCommand,
} from "./lib/ontology-maintenance-commands.mjs";

export const main = (options = {}) =>
  runGeneratedCheckCommand({ arguments_: process.argv.slice(2), ...options });

await runCliAdapter({ moduleUrl: import.meta.url, scriptPath: process.argv[1], main });
