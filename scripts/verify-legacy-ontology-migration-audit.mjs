import {
  runCliAdapter,
  runLegacyMigrationAuditCommand,
} from "./lib/ontology-maintenance-commands.mjs";

export const main = (options = {}) =>
  runLegacyMigrationAuditCommand({ arguments_: process.argv.slice(2), ...options });

await runCliAdapter({ moduleUrl: import.meta.url, scriptPath: process.argv[1], main });
