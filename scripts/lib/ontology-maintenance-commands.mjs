import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadOntologyTree } from "./ontology-yaml-source.mjs";
import {
  assertPublishedContentSecurity,
  assertSourceUrlPolicy,
} from "./ontology-security-gates.mjs";
import { checkSourceLinks } from "./source-link-checker.mjs";

const defaultRepositoryRoot = resolve(import.meta.dirname, "../..");

const sourceFailureKey = (id, url, status) => `${id}\u0000${url}\u0000${status}`;

// The current OpenAI documentation edge can return 404 to a GitHub-hosted
// link-check request while returning an access-control response elsewhere.
// Keep this exception source-, URL-, and status-specific: strict validation
// still fails on it, and unrelated 404 responses remain broken links.
const KNOWN_INCONCLUSIVE_SOURCE_FAILURES = new Set([
  sourceFailureKey(
    "openai-responses-rubric",
    "https://developers.openai.com/api/docs/guides/responses",
    404,
  ),
]);

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
      : predicate(path) ? [path] : [];
  });

export const classifySourceLinkFailures = (failures) => {
  const isInconclusive = ({ id, url, status }) =>
    status === null ||
    status >= 500 ||
    [401, 403, 408, 425, 429].includes(status) ||
    KNOWN_INCONCLUSIVE_SOURCE_FAILURES.has(sourceFailureKey(id, url, status));
  return {
    inconclusive: failures.filter(isInconclusive),
    broken: failures.filter((result) => !isInconclusive(result)),
  };
};

const collectAllSources = (nodes) => {
  const seen = new Map();
  for (const node of nodes) {
    for (const source of node.sources ?? []) {
      if (source && typeof source === "object" && source.id && !seen.has(source.id)) {
        seen.set(source.id, source);
      }
    }
  }
  return [...seen.values()];
};

const loadYamlSourceInputs = async (repositoryRoot) => {
  const tree = await loadOntologyTree({ sourceDir: resolve(repositoryRoot, "ontology") });
  const sources = collectAllSources(tree.nodes);
  const referencedIds = new Set(tree.nodes.flatMap((node) =>
    (node.source_claims ?? []).map((claim) => claim.source).filter(Boolean)));
  return { tree, sources, referencedIds };
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
  loadYamlInputs = loadYamlSourceInputs,
  checkLinks = checkSourceLinks,
  log = console.log,
  warn = console.warn,
  error = console.error,
} = {}) => {
  const options = parseSourceLinkArguments(arguments_);
  const { sources, referencedIds } = await loadYamlInputs(repositoryRoot);
  assertSourceUrlPolicy(sources, []);
  const missingReferenced = [...referencedIds].filter(
    (id) => !sources.some((source) => source.id === id),
  );
  if (missingReferenced.length > 0) {
    const message = `Published source claims absent from the source registry: ${missingReferenced.join(", ")}`;
    if (!options.allowInconclusive) throw new Error(message);
    warn(`? ${message}`);
  }
  const selected = options.referencedOnly
    ? sources.filter(({ id }) => referencedIds.has(id))
    : sources;
  const report = await checkLinks(selected, {
    concurrency: options.concurrency,
    timeoutMs: options.timeoutMs,
  });
  const { broken, inconclusive } = classifySourceLinkFailures(report.failures);
  const result = { ...report, broken, inconclusive, unregisteredReferencedIds: missingReferenced };
  if (options.json) log(JSON.stringify(result, null, 2));
  else {
    log(`Checked ${report.checked} ontology source links; ${broken.length} broken and ${inconclusive.length} inconclusive.`);
    broken.forEach(({ id, url, diagnostic }) => error(`- ${id} ${url}: ${diagnostic}`));
    inconclusive.forEach(({ id, url, diagnostic }) => warn(`? ${id} ${url}: ${diagnostic}`));
  }
  if (broken.length > 0 || (!options.allowInconclusive && inconclusive.length > 0)) {
    throw new Error(`Source link check failed with ${broken.length} broken and ${inconclusive.length} inconclusive result(s)`);
  }
  return result;
};

export const runOntologySecurityCommand = async ({
  arguments_ = [],
  repositoryRoot = defaultRepositoryRoot,
  log = console.log,
} = {}) => {
  parseNoArguments(arguments_, "verify-ontology-security");
  const { tree, sources } = await loadYamlSourceInputs(repositoryRoot);
  const generatedDocuments = listFiles(
    resolve(repositoryRoot, "src/generated"),
    (path) => path.endsWith(".json"),
  ).map((path) => ({
    label: relative(repositoryRoot, path).replaceAll("\\", "/"),
    value: JSON.parse(readFileSync(path, "utf8")),
  }));
  const uiFiles = listFiles(
    resolve(repositoryRoot, "src"),
    (path) => /\.(?:ts|tsx)$/u.test(path),
  ).map((path) => ({
    label: relative(repositoryRoot, path).replaceAll("\\", "/"),
    text: readFileSync(path, "utf8"),
  }));
  assertPublishedContentSecurity({
    documents: [
      ...tree.nodes.map((value) => ({ label: value.source_path, value })),
      ...generatedDocuments,
    ],
    uiFiles,
  });
  assertSourceUrlPolicy(sources, []);
  log(`Ontology security gate passed: ${tree.nodes.length} YAML nodes, ${generatedDocuments.length} generated artifacts, ${uiFiles.length} UI files, and ${sources.length} source URLs checked.`);
};

export const runCliAdapter = async ({
  moduleUrl,
  scriptPath,
  main,
  consoleObject = console,
  processObject = process,
}) => {
  if (scriptPath === undefined || moduleUrl !== pathToFileURL(resolve(scriptPath)).href) return false;
  try {
    await main();
  } catch (error) {
    consoleObject.error(error instanceof Error ? error.message : String(error));
    processObject.exitCode = 1;
  }
  return true;
};
