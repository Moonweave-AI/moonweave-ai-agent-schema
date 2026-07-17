import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SHA256_HEX = /^[a-f0-9]{64}$/u;
const GIT_SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u;

export const sha256Bytes = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const currentRelationCount = (relations) => (
  Array.isArray(relations)
    ? relations.filter((relation) => relation?.status !== "deprecated").length
    : 0
);

const gitCandidates = () => [
  process.env.GIT_EXECUTABLE,
  "git",
  path.resolve(path.dirname(process.execPath), "..", "..", "native", "git", "cmd", "git.exe"),
  process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "Git", "cmd", "git.exe") : null,
].filter(Boolean);

export const gitValue = (root, args) => {
  let lastError = null;
  for (const executable of gitCandidates()) {
    try {
      return execFileSync(executable, args, {
        cwd: root,
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Git is unavailable: ${lastError?.message ?? "no executable candidate"}`);
};

export const currentCommitSha = (root) => {
  const value = (process.env.GITHUB_SHA || gitValue(root, ["rev-parse", "HEAD"])).toLowerCase();
  if (!GIT_SHA.test(value)) throw new Error(`Invalid commit SHA: ${value}`);
  return value;
};

export const currentRef = (root) => process.env.GITHUB_REF_NAME
  || gitValue(root, ["branch", "--show-current"])
  || "detached-head";

export const readCanonicalIdentity = (root) => {
  const canonicalPath = path.join(root, "src", "generated", "agent-ontology.json");
  const canonicalBytes = fs.readFileSync(canonicalPath);
  const canonical = JSON.parse(canonicalBytes.toString("utf8"));
  const metadata = canonical.artifact_metadata ?? {};
  const sourceFingerprint = String(metadata.source_tree_sha256 ?? "");
  if (!SHA256_HEX.test(sourceFingerprint)) {
    throw new Error("Canonical artifact_metadata.source_tree_sha256 must be lowercase SHA-256");
  }
  return {
    canonical,
    canonicalBytes,
    sourceFingerprint,
  };
};

export const readCommunityProjectionIdentity = (root, canonicalBytes) => {
  const projectionPath = path.join(root, "src", "generated", "ontology-community-graph.json");
  const projection = JSON.parse(fs.readFileSync(projectionPath, "utf8"));
  const projectionFingerprint = String(projection?.projection_sha256 ?? "");
  if (!SHA256_HEX.test(projectionFingerprint)) {
    throw new Error("Community projection_sha256 must be lowercase SHA-256");
  }
  if (projection?.source_sha256 !== sha256Bytes(canonicalBytes)) {
    throw new Error("Community projection source_sha256 must match the canonical artifact");
  }
  return { projectionFingerprint };
};

export const expectedSiteBuildManifest = (root, options = {}) => {
  const identity = readCanonicalIdentity(root);
  const communityIdentity = readCommunityProjectionIdentity(root, identity.canonicalBytes);
  const metrics = identity.canonical.ontology_metrics;
  if (!metrics || !Number.isInteger(metrics.modules) || !Number.isInteger(metrics.concepts)) {
    throw new Error("Canonical ontology_metrics must provide module and concept counts");
  }
  const relationCount = Number(metrics.is_a_relations) + Number(metrics.semantic_relations);
  const actualCounts = {
    modules: identity.canonical.modules.length,
    concepts: identity.canonical.classes.length,
    relations: currentRelationCount(identity.canonical.relations),
  };
  if (
    metrics.modules !== actualCounts.modules ||
    metrics.concepts !== actualCounts.concepts ||
    relationCount !== actualCounts.relations
  ) {
    throw new Error(
      `Canonical metrics/count mismatch: ${metrics.modules}/${metrics.concepts}/${relationCount} != ${actualCounts.modules}/${actualCounts.concepts}/${actualCounts.relations}`,
    );
  }
  return {
    schema_version: "1.0.0",
    commit_sha: options.commitSha ?? currentCommitSha(root),
    built_from_ref: options.builtFromRef ?? currentRef(root),
    canonical_version: String(identity.canonical.artifact_metadata?.canonical_version ?? identity.canonical.id),
    generator_version: String(identity.canonical.artifact_metadata?.generator_version ?? "unknown"),
    source_fingerprint: identity.sourceFingerprint,
    canonical_fingerprint: `sha256:${sha256Bytes(identity.canonicalBytes)}`,
    community_projection_fingerprint: `sha256:${communityIdentity.projectionFingerprint}`,
    module_count: metrics.modules,
    concept_count: metrics.concepts,
    relation_count: relationCount,
  };
};
