import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { writeFileTransaction } from "./lib/atomic-write.mjs";
import { compileOntologyBundle } from "./lib/ontology-yaml-compiler.mjs";
import { loadOntologyTree } from "./lib/ontology-yaml-source.mjs";
import { sha256, stableJson } from "./lib/stable-json.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");

const parseArguments = (arguments_) => {
  const options = {
    sourceDir: resolve(repositoryRoot, "ontology"),
    outputDir: resolve(repositoryRoot, "src/generated"),
    check: false,
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--source-dir" || argument === "--output-dir") {
      const value = arguments_[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
      index += 1;
      if (argument === "--source-dir") options.sourceDir = resolve(value);
      else options.outputDir = resolve(value);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
};

const assertOutputOutsideSource = (sourceDir, outputDir) => {
  const path = relative(sourceDir, outputDir);
  if (path === "" || (!path.startsWith("..\\") && !path.startsWith("../") && path !== "..")) {
    throw new Error("Generated output must remain outside the canonical YAML source tree");
  }
};

const artifactBytes = (bundle) => {
  const canonicalBytes = stableJson(bundle.canonical);
  const communityGraph = {
    ...bundle.communityGraph,
    source_sha256: sha256(canonicalBytes),
  };
  return new Map([
    ["agent-ontology.json", canonicalBytes],
    ["ontology-community-graph.json", stableJson(communityGraph)],
    ["source-index.json", stableJson(bundle.sourceIndex)],
  ]);
};

const verifyArtifacts = (outputDir, artifacts) => {
  for (const [name, expected] of artifacts) {
    const path = resolve(outputDir, name);
    if (!existsSync(path) || readFileSync(path, "utf8") !== expected) {
      throw new Error(`Generated ontology artifact is stale: ${name}`);
    }
  }
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  assertOutputOutsideSource(options.sourceDir, options.outputDir);
  const bundle = await compileOntologyBundle({ sourceDir: options.sourceDir });
  const sourceAfterCompile = await loadOntologyTree({ sourceDir: options.sourceDir });
  if (sourceAfterCompile.sourceTreeSha256 !== bundle.sourceTreeSha256) {
    throw new Error("Canonical YAML source changed while the read-only build was running");
  }
  const artifacts = artifactBytes(bundle);
  if (options.check) {
    verifyArtifacts(options.outputDir, artifacts);
    return;
  }
  writeFileTransaction(
    new Map([...artifacts].map(([name, contents]) => [resolve(options.outputDir, name), contents])),
    { transactionRoot: options.outputDir },
  );
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

