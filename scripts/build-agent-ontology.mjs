import {
  existsSync,
  realpathSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { relative, resolve } from "node:path";

import { writeFileTransaction } from "./lib/atomic-write.mjs";
import {
  deterministicGeneratedAt,
  ONTOLOGY_GENERATOR_VERSION,
} from "./lib/generation-metadata.mjs";
import { buildArtifactBytes } from "./lib/ontology-build-artifacts.mjs";
import {
  loadAndValidateSources,
  mergeAndValidateCanonical,
} from "./lib/ontology-build-validation.mjs";
import { buildSourceIndexData } from "./lib/source-index.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const parseArguments = (arguments_) => {
  const options = {
    sourceRoot: resolve(repositoryRoot, "ontology/source"),
    outputRoot: resolve(repositoryRoot, "build/agent-ontology-candidate"),
    artifactContractPath: resolve(
      repositoryRoot,
      "schemas/source/agent-ontology-artifact-contract.json",
    ),
    check: false,
    releaseChannel: "candidate",
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (argument === "--release") {
      options.releaseChannel = "release";
      continue;
    }
    const value = arguments_[index + 1];
    if (["--source-root", "--output-root", "--artifact-contract"].includes(argument)) {
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
      index += 1;
      if (argument === "--source-root") options.sourceRoot = resolve(value);
      if (argument === "--output-root") options.outputRoot = resolve(value);
      if (argument === "--artifact-contract") options.artifactContractPath = resolve(value);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
};

const listFiles = (root) => {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    })
    .sort((left, right) => left.localeCompare(right));
};

const normalizedRelativeFiles = (root) =>
  listFiles(root).map((path) => relative(root, path).replaceAll("\\", "/"));

const comparablePath = (path) => {
  const absolute = resolve(path);
  const canonical = existsSync(absolute) ? realpathSync.native(absolute) : absolute;
  return process.platform === "win32" ? canonical.toLowerCase() : canonical;
};

const checkArtifacts = (outputRoot, artifacts) => {
  const actualFiles = normalizedRelativeFiles(outputRoot);
  const expectedFiles = [...artifacts.keys()].sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error(
      `Generated artifacts are stale: expected [${expectedFiles.join(", ")}], found [${actualFiles.join(", ")}]`,
    );
  }
  for (const [path, expected] of artifacts) {
    const actual = readFileSync(resolve(outputRoot, path), "utf8");
    if (actual !== expected) throw new Error(`Generated artifact is stale: ${path}`);
  }
};

const writeArtifacts = (outputRoot, artifacts) => {
  writeFileTransaction(
    new Map(
      [...artifacts].map(([path, contents]) => [resolve(outputRoot, path), contents]),
    ),
  );
};

const main = () => {
  const options = parseArguments(process.argv.slice(2));
  if (comparablePath(options.outputRoot) === comparablePath(repositoryRoot)) {
    throw new Error(
      "Direct builder writes into the repository root are forbidden; use scripts/release-agent-ontology.mjs so migration, determinism, quality, and rollback gates cannot be bypassed.",
    );
  }
  const loaded = loadAndValidateSources({
    sourceRoot: options.sourceRoot,
    artifactContractPath: options.artifactContractPath,
  });
  const generatedAt = deterministicGeneratedAt(loaded.productEntry.data.product.date);
  const sourceIndex = buildSourceIndexData(repositoryRoot, {
    generatedAt,
    generatorVersion: ONTOLOGY_GENERATOR_VERSION,
  });
  const canonical = mergeAndValidateCanonical({
    ...loaded,
    contractVersion: loaded.contract.contract_version,
    sourceIndex,
    generatorVersion: ONTOLOGY_GENERATOR_VERSION,
    generatedAt,
    releaseChannel: options.releaseChannel,
  });
  const artifacts = buildArtifactBytes({
    canonical,
    contract: loaded.contract,
    contractFingerprint: loaded.contractFingerprint,
    sourceIndex,
    generatedAt,
  });
  if (options.check) checkArtifacts(options.outputRoot, artifacts);
  else writeArtifacts(options.outputRoot, artifacts);
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
