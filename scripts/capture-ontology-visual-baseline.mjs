import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const playwrightCli = resolve(
  repositoryRoot,
  "node_modules/@playwright/test/cli.js",
);

const result = spawnSync(
  process.execPath,
  [
    playwrightCli,
    "test",
    "--grep",
    "visual baselines",
    "--update-snapshots",
    "--workers=1",
  ],
  {
    cwd: repositoryRoot,
    env: { ...process.env, MOONWEAVE_VISUAL_BASELINE: "1" },
    stdio: "inherit",
    windowsHide: true,
  },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`Visual baseline capture failed with exit code ${result.status}.`);
}
