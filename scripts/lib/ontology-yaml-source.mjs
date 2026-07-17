import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

import { isAlias, isMap, isSeq, parseDocument } from "yaml";

const DEFAULT_LIMITS = Object.freeze({
  maxNodes: 5_000,
  maxDepth: 64,
  maxFileBytes: 1024 * 1024,
  maxTotalBytes: 64 * 1024 * 1024,
});

const KIND_TRANSITIONS = Object.freeze({
  ontology: Object.freeze(["domain"]),
  domain: Object.freeze(["module"]),
  module: Object.freeze(["concept"]),
  concept: Object.freeze(["concept"]),
});

const NODE_KINDS = new Set(Object.keys(KIND_TRANSITIONS));

export class OntologySourceError extends Error {
  constructor(code, message, details = {}) {
    super(`${code}: ${message}`);
    this.name = "OntologySourceError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

const sourceError = (code, message, details) =>
  new OntologySourceError(code, message, details);

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const deepFreeze = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  if (value instanceof Map) {
    for (const [key, nested] of value) {
      deepFreeze(key, seen);
      deepFreeze(nested, seen);
    }
    return Object.freeze(value);
  }
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
};

const assertNoYamlIndirection = (node, sourcePath) => {
  if (!node) return;
  if (isAlias(node) || node.anchor) {
    throw sourceError(
      "YAML_ALIAS_FORBIDDEN",
      `YAML anchors, aliases, and merge indirection are forbidden in ${sourcePath}`,
      { sourcePath },
    );
  }
  if (isMap(node)) {
    for (const pair of node.items) {
      if (pair.key?.value === "<<") {
        throw sourceError(
          "YAML_ALIAS_FORBIDDEN",
          `YAML merge keys are forbidden in ${sourcePath}`,
          { sourcePath },
        );
      }
      assertNoYamlIndirection(pair.key, sourcePath);
      assertNoYamlIndirection(pair.value, sourcePath);
    }
  } else if (isSeq(node)) {
    for (const item of node.items) assertNoYamlIndirection(item, sourcePath);
  }
};

const parseNodeYaml = (bytes, sourcePath) => {
  const text = bytes.toString("utf8");
  let document;
  try {
    document = parseDocument(text, {
      customTags: [],
      maxAliasCount: 0,
      prettyErrors: true,
      schema: "core",
      strict: true,
      uniqueKeys: true,
    });
  } catch (error) {
    throw sourceError("INVALID_YAML", `Unable to parse ${sourcePath}`, {
      sourcePath,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
  if (document.errors.length > 0) {
    throw sourceError("INVALID_YAML", `Invalid YAML in ${sourcePath}`, {
      sourcePath,
      errors: document.errors.map((error) => error.message),
    });
  }
  assertNoYamlIndirection(document.contents, sourcePath);
  let value;
  try {
    value = document.toJS({ maxAliasCount: 0, mapAsMap: false });
  } catch (error) {
    throw sourceError("INVALID_YAML", `Unable to materialize ${sourcePath}`, {
      sourcePath,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
  if (!isRecord(value)) {
    throw sourceError("INVALID_YAML", `${sourcePath} must contain one mapping`, {
      sourcePath,
    });
  }
  return value;
};

const normalizedLimits = (limits = {}) => {
  const merged = { ...DEFAULT_LIMITS, ...limits };
  for (const [name, value] of Object.entries(merged)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new TypeError(`${name} must be a positive safe integer`);
    }
  }
  return Object.freeze(merged);
};

const safeDirectoryEntries = (directory, sourceRoot) => {
  const entries = readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    const metadata = lstatSync(path);
    if (metadata.isSymbolicLink()) {
      throw sourceError(
        "SOURCE_ENTRY_FORBIDDEN",
        `Symbolic links are forbidden in the ontology source: ${relative(sourceRoot, path)}`,
        { path },
      );
    }
  }
  return entries;
};

const validateNodeEnvelope = (node, sourcePath) => {
  if (node.schema !== "moonweave.ai/ontology-node/v1") {
    throw sourceError("INVALID_YAML", `${sourcePath} has an unsupported schema`, {
      sourcePath,
    });
  }
  if (typeof node.id !== "string" || node.id.trim() !== node.id || node.id.length === 0) {
    throw sourceError("INVALID_YAML", `${sourcePath} has an invalid node id`, {
      sourcePath,
    });
  }
  if (!NODE_KINDS.has(node.kind)) {
    throw sourceError("INVALID_YAML", `${sourcePath} has an invalid node kind`, {
      sourcePath,
    });
  }
};

/**
 * Loads the single canonical YAML directory tree without reading or writing any
 * path outside the explicitly supplied source directory.
 */
export const loadOntologyTree = async ({ sourceDir, limits } = {}) => {
  if (typeof sourceDir !== "string" || sourceDir.length === 0) {
    throw new TypeError("sourceDir is required");
  }
  const sourceRoot = resolve(sourceDir);
  let canonicalRoot;
  try {
    canonicalRoot = realpathSync.native(sourceRoot);
  } catch {
    throw sourceError("ROOT_NODE_MISSING", `Ontology source directory is missing: ${sourceRoot}`);
  }
  const bounded = normalizedLimits(limits);
  const nodes = [];
  const nodeIds = new Set();
  const parentById = new Map();
  const pathById = new Map();
  const sourceFiles = [];
  const hasher = createHash("sha256");
  let totalBytes = 0;

  const visitNodeDirectory = (directory, parent, depth) => {
    if (depth > bounded.maxDepth) {
      throw sourceError("SOURCE_ENTRY_FORBIDDEN", `Ontology tree exceeds maxDepth=${bounded.maxDepth}`);
    }
    const entries = safeDirectoryEntries(directory, canonicalRoot);
    const unexpected = entries.filter((entry) =>
      entry.name !== "node.yaml" && !entry.isDirectory());
    if (unexpected.length > 0) {
      throw sourceError(
        "SOURCE_ENTRY_FORBIDDEN",
        `Only node.yaml and direct child-node directories are allowed; found ${unexpected[0].name}`,
        { path: resolve(directory, unexpected[0].name) },
      );
    }
    const nodeEntry = entries.find((entry) => entry.name === "node.yaml");
    if (!nodeEntry || !nodeEntry.isFile()) {
      if (depth === 0) {
        throw sourceError("ROOT_NODE_MISSING", `Missing ${resolve(directory, "node.yaml")}`);
      }
      throw sourceError("SOURCE_ENTRY_FORBIDDEN", `Missing node.yaml in ${directory}`);
    }
    const nodePath = resolve(directory, "node.yaml");
    const metadata = lstatSync(nodePath);
    if (metadata.size > bounded.maxFileBytes) {
      throw sourceError("SOURCE_ENTRY_FORBIDDEN", `${nodePath} exceeds the per-file size limit`);
    }
    totalBytes += metadata.size;
    if (totalBytes > bounded.maxTotalBytes) {
      throw sourceError("SOURCE_ENTRY_FORBIDDEN", "Ontology source exceeds the total size limit");
    }
    const bytes = readFileSync(nodePath);
    const sourcePath = relative(canonicalRoot, nodePath).replaceAll("\\", "/");
    const node = parseNodeYaml(bytes, sourcePath);
    validateNodeEnvelope(node, sourcePath);
    if (depth === 0 && node.kind !== "ontology") {
      throw sourceError("INVALID_HIERARCHY", "The root node must have kind ontology");
    }
    if (depth > 0 && basename(directory) !== node.id) {
      throw sourceError(
        "NODE_ID_PATH_MISMATCH",
        `Directory ${basename(directory)} must equal node id ${node.id}`,
        { sourcePath },
      );
    }
    if (nodeIds.has(node.id)) {
      throw sourceError("DUPLICATE_NODE_ID", `Duplicate node id: ${node.id}`, {
        sourcePath,
      });
    }
    if (parent && !KIND_TRANSITIONS[parent.kind].includes(node.kind)) {
      throw sourceError(
        "INVALID_HIERARCHY",
        `Invalid kind transition ${parent.kind} -> ${node.kind} at ${sourcePath}`,
        { sourcePath, parentId: parent.id },
      );
    }
    nodeIds.add(node.id);
    nodes.push(deepFreeze({ ...node, source_path: sourcePath }));
    pathById.set(node.id, sourcePath);
    if (parent) parentById.set(node.id, parent.id);
    sourceFiles.push(sourcePath);
    hasher.update(sourcePath, "utf8");
    hasher.update("\0");
    hasher.update(bytes);
    hasher.update("\0");
    if (nodes.length > bounded.maxNodes) {
      throw sourceError("SOURCE_ENTRY_FORBIDDEN", `Ontology tree exceeds maxNodes=${bounded.maxNodes}`);
    }

    for (const childEntry of entries.filter((entry) => entry.isDirectory())) {
      visitNodeDirectory(resolve(directory, childEntry.name), node, depth + 1);
    }
  };

  visitNodeDirectory(canonicalRoot, null, 0);
  const root = nodes[0];
  const result = {
    root,
    rootId: root.id,
    nodes: Object.freeze([...nodes]),
    nodesById: new Map(nodes.map((node) => [node.id, node])),
    parentById,
    pathById,
    sourceFiles: Object.freeze([...sourceFiles]),
    sourceTreeSha256: hasher.digest("hex"),
  };
  return deepFreeze(result);
};
