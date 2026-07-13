import {
  runCleanWorktreeCommand,
  runCliAdapter,
} from "./lib/ontology-maintenance-commands.mjs";

export const main = (options = {}) =>
  runCleanWorktreeCommand({ arguments_: process.argv.slice(2), ...options });

await runCliAdapter({ moduleUrl: import.meta.url, scriptPath: process.argv[1], main });
