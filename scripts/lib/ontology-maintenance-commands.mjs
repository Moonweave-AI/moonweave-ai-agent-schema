import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { parseCsv } from "./csv.mjs";
import {
  deterministicGeneratedAt,
  ONTOLOGY_GENERATOR_VERSION,
} from "./generation-metadata.mjs";
import { auditLegacyMigration } from "./ontology-legacy-audit.mjs";
import { runNodeCommand } from "./ontology-release-command.mjs";
import { validateOntologyDecisionBundles } from "./ontology-decision-validation.mjs";
import {
  assertPublishedContentSecurity,
  assertSourceUrlPolicy,
} from "./ontology-security-gates.mjs";
import { buildSourceIndexData } from "./source-index.mjs";
import { checkSourceLinks } from "./source-link-checker.mjs";
import { stableJson } from "./stable-json.mjs";

const defaultRepositoryRoot = resolve(import.meta.dirname, "../..");

export const parseNoArguments = (arguments_, commandName) => {
  if (arguments_.length > 0) {
    throw new Error(`${commandName} does not accept arguments: ${arguments_.join(" ")}`);
  }
  return {};
};

const positiveInteger = (value, option) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${option} requires a positive integer`);
  }
  return parsed;
};

export const parseSourceLinkArguments = (arguments_) => {
  const options = {
    referencedOnly: false,
    json: false,
    concurrency: 12,
    timeoutMs: 10_000,
    allowInconclusive: false,
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--referenced-only") options.referencedOnly = true;
    else if (argument === "--json") options.json = true;
    else if (argument === "--allow-inconclusive") options.allowInconclusive = true;
    else if (argument === "--concurrency" || argument === "--timeout-ms") {
      const value = arguments_[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${argument} requires a positive integer`);
      }
      index += 1;
      const parsed = positiveInteger(value, argument);
      if (argument === "--concurrency") options.concurrency = parsed;
      else options.timeoutMs = parsed;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
};

const listFiles = (root, predicate = () => true) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    return entry.isDirectory()
      ? listFiles(path, predicate)
      : predicate(path)
        ? [path]
        : [];
  });

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

export const loadProductSource = (repositoryRoot = defaultRepositoryRoot) =>
  readJson(resolve(repositoryRoot, "ontology/source/agent-ontology.product.json"));

export const loadRegistryAndAllowlist = (repositoryRoot = defaultRepositoryRoot) => ({
  registry: parseCsv(
    readFileSync(resolve(repositoryRoot, "research/source-registry.csv")),
  ).map(({ id, url }) => ({ id, url })),
  allowlist: readJson(resolve(repositoryRoot, "research/source-http-allowlist.json")),
});

const collectSourceClaims = (value, target) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSourceClaims(item, target));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value.source_claims)) {
    value.source_claims.forEach(({ source_id: sourceId }) => target.add(sourceId));
  }
  Object.values(value).forEach((item) => collectSourceClaims(item, target));
};

export const loadReferencedSourceIds = (repositoryRoot = defaultRepositoryRoot) => {
  const referencedIds = new Set();
  for (const path of listFiles(
    resolve(repositoryRoot, "ontology/source"),
    (filePath) => filePath.endsWith(".json"),
  )) {
    collectSourceClaims(readJson(path), referencedIds);
  }
  return referencedIds;
};

export const loadDecisionInputs = (repositoryRoot = defaultRepositoryRoot) => {
  const decisionRoot = resolve(
    repositoryRoot,
    "ontology/migration/legacy-v1/domain-decisions",
  );
  const legacy = readJson(
    resolve(
      repositoryRoot,
      "ontology/migration/legacy-v1/frozen-release/ontology/agent-ontology.json",
    ),
  );
  const bundles = readdirSync(decisionRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(resolve(decisionRoot, name)));
  const sourceIds = parseCsv(
    readFileSync(resolve(repositoryRoot, "research/source-registry.csv")),
  ).map(({ id }) => id);
  return { legacy, bundles, sourceIds };
};

const relativeLabel = (repositoryRoot, path) =>
  relative(repositoryRoot, path).replaceAll("\\", "/");

const readJsonDocuments = (repositoryRoot, directory) =>
  listFiles(directory, (path) => path.endsWith(".json")).map((path) => ({
    label: relativeLabel(repositoryRoot, path),
    value: readJson(path),
  }));

export const loadSecurityInputs = (repositoryRoot = defaultRepositoryRoot) => {
  const sourceDocuments = readJsonDocuments(
    repositoryRoot,
    resolve(repositoryRoot, "ontology/source"),
  );
  const fixtureDocuments = readJsonDocuments(
    repositoryRoot,
    resolve(repositoryRoot, "fixtures"),
  );
  const generatedUiDocuments = readJsonDocuments(
    repositoryRoot,
    resolve(repositoryRoot, "src"),
  );
  const publishedCanonical = {
    label: "ontology/agent-ontology.json",
    value: readJson(resolve(repositoryRoot, "ontology/agent-ontology.json")),
  };
  const uiFiles = listFiles(
    resolve(repositoryRoot, "src"),
    (path) => /\.(?:ts|tsx)$/u.test(path),
  ).map((path) => ({
    label: relativeLabel(repositoryRoot, path),
    text: readFileSync(path, "utf8"),
  }));
  const { registry: sources, allowlist } = loadRegistryAndAllowlist(repositoryRoot);
  return {
    documents: [
      ...sourceDocuments,
      publishedCanonical,
      ...fixtureDocuments,
      ...generatedUiDocuments,
    ],
    sourceDocumentCount: sourceDocuments.length,
    fixtureDocumentCount: fixtureDocuments.length,
    uiFiles,
    sources,
    allowlist,
  };
};

export const classifySourceLinkFailures = (failures) => {
  const isInconclusive = ({ status }) =>
    status === null || status >= 500 || [401, 403, 408, 425, 429].includes(status);
  return {
    inconclusive: failures.filter(isInconclusive),
    broken: failures.filter((result) => !isInconclusive(result)),
  };
};

export const runBuildSourceIndexCommand = ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  readProductSource = loadProductSource,
  generatedAt = deterministicGeneratedAt,
  generatorVersion = ONTOLOGY_GENERATOR_VERSION,
  buildSourceIndex = buildSourceIndexData,
  stable = stableJson,
  mkdir = mkdirSync,
  write = writeFileSync,
} = {}) => {
  parseNoArguments(arguments_, "build-source-index");
  const outputPath = resolve(repositoryRoot, "src/generated/source-index.json");
  const productSource = readProductSource(repositoryRoot);
  const data = buildSourceIndex(repositoryRoot, {
    generatedAt: generatedAt(productSource.product.date),
    generatorVersion,
  });
  mkdir(resolve(outputPath, ".."), { recursive: true });
  write(outputPath, stable(data), "utf8");
  return { outputPath };
};

export const runGeneratedCheckCommand = ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  spawn = spawnSync,
  processObject = process,
  logger = console.log,
} = {}) => {
  parseNoArguments(arguments_, "check-agent-ontology-generated");
  runNodeCommand({
    label: "Check generated ontology artifacts",
    script: resolve(repositoryRoot, "scripts/release-agent-ontology.mjs"),
    args: ["--check"],
    cwd: repositoryRoot,
    spawn,
    processObject,
    logger,
  });
};

export const runCleanWorktreeCommand = ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  spawn = spawnSync,
} = {}) => {
  parseNoArguments(arguments_, "check-clean-worktree");
  const result = spawn(
    "git",
    ["status", "--porcelain", "--untracked-files=all"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || `git status failed with exit code ${result.status}`);
  }
  if (result.stdout.trim()) {
    throw new Error(`Validation changed or created repository files:\n${result.stdout.trim()}`);
  }
};

export const runSourceLinkCheckCommand = async ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  loadRegistry = loadRegistryAndAllowlist,
  loadReferencedIds = loadReferencedSourceIds,
  assertUrlPolicy = assertSourceUrlPolicy,
  checkLinks = checkSourceLinks,
  log = console.log,
  warn = console.warn,
  error = console.error,
} = {}) => {
  const options = parseSourceLinkArguments(arguments_);
  const { registry, allowlist } = loadRegistry(repositoryRoot);
  assertUrlPolicy(registry, allowlist);
  const referencedIds = options.referencedOnly
    ? loadReferencedIds(repositoryRoot)
    : new Set();
  const missingReferenced = [...referencedIds].filter(
    (id) => !registry.some((source) => source.id === id),
  );
  if (missingReferenced.length > 0) {
    throw new Error(
      `Referenced source IDs are absent from the registry: ${missingReferenced.join(", ")}`,
    );
  }
  const selected = options.referencedOnly
    ? registry.filter(({ id }) => referencedIds.has(id))
    : registry;
  const report = await checkLinks(selected, {
    concurrency: options.concurrency,
    timeoutMs: options.timeoutMs,
  });
  const { broken, inconclusive } = classifySourceLinkFailures(report.failures);
  if (options.json) {
    log(JSON.stringify({ ...report, broken, inconclusive }, null, 2));
  } else {
    log(
      `Checked ${report.checked} ${options.referencedOnly ? "referenced " : ""}source links; ${broken.length} broken and ${inconclusive.length} inconclusive.`,
    );
    broken.forEach(({ id, url, diagnostic }) =>
      error(`- ${id} ${url}: ${diagnostic}`),
    );
    inconclusive.forEach(({ id, url, diagnostic }) =>
      warn(`? ${id} ${url}: ${diagnostic}`),
    );
  }
  if (broken.length > 0 || (!options.allowInconclusive && inconclusive.length > 0)) {
    throw new Error(
      `Source link check failed with ${broken.length} broken source link${broken.length === 1 ? "" : "s"} and ${inconclusive.length} inconclusive result${inconclusive.length === 1 ? "" : "s"}`,
    );
  }
  return { ...report, broken, inconclusive };
};

export const runOntologyDecisionCommand = ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  loadInputs = loadDecisionInputs,
  validate = validateOntologyDecisionBundles,
  log = console.log,
} = {}) => {
  parseNoArguments(arguments_, "validate-ontology-domain-decisions");
  const inputs = loadInputs(repositoryRoot);
  const result = validate(inputs);
  log(JSON.stringify(result, null, 2));
  return result;
};

export const runLegacyMigrationAuditCommand = ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  audit = auditLegacyMigration,
  log = console.log,
} = {}) => {
  parseNoArguments(arguments_, "verify-legacy-ontology-migration-audit");
  const result = audit({ repositoryRoot });
  log(JSON.stringify({ mode: "source-first-read-only-audit", ...result }, null, 2));
  return result;
};

export const runOntologySecurityCommand = ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  loadInputs = loadSecurityInputs,
  assertContent = assertPublishedContentSecurity,
  assertUrls = assertSourceUrlPolicy,
  log = console.log,
} = {}) => {
  parseNoArguments(arguments_, "verify-ontology-security");
  const inputs = loadInputs(repositoryRoot);
  assertContent({ documents: inputs.documents, uiFiles: inputs.uiFiles });
  assertUrls(inputs.sources, inputs.allowlist);
  log(
    `Ontology security gate passed: ${inputs.sourceDocumentCount} source documents, ${inputs.fixtureDocumentCount} fixtures, ${inputs.uiFiles.length} UI source files, and ${inputs.sources.length} registry URLs checked.`,
  );
};

export const runCliAdapter = async ({
  moduleUrl,
  scriptPath,
  main,
  consoleObject = console,
  processObject = process,
}) => {
  if (scriptPath === undefined || moduleUrl !== pathToFileURL(resolve(scriptPath)).href) {
    return false;
  }
  try {
    await main();
  } catch (error_) {
    consoleObject.error(error_ instanceof Error ? error_.message : String(error_));
    processObject.exitCode = 1;
  }
  return true;
};
