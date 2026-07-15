import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { isMainModule } from "./lib/cli-entrypoint.mjs";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const ref = (kind, id) => `${kind}:${id}`;
const canonicalNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error("Projection fingerprints require finite numbers");
  if (Number.isInteger(value)) return `n${value};`;
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value, false);
  return `n0x${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")};`;
};

const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  if (value === null) return "z";
  if (typeof value === "boolean") return value ? "b1" : "b0";
  if (typeof value === "number") return canonicalNumber(value);
  if (typeof value === "string") return `s${JSON.stringify(value)}`;
  throw new Error(`Unsupported projection value: ${typeof value}`);
};

const projectionSha256 = (artifact) => {
  const payload = Object.fromEntries(
    Object.entries(artifact ?? {}).filter(([key]) => key !== "projection_sha256"),
  );
  return sha256(canonicalJson(payload));
};

const expectedProjection = (ontology) => {
  const acceptedConcepts = ontology.classes.filter(({ status }) => status === "accepted");
  const acceptedIds = new Set(acceptedConcepts.map(({ id }) => id));
  const nodeRefs = new Set([
    ref("root", ontology.id),
    ...ontology.planes.map(({ id }) => ref("plane", id)),
    ...ontology.modules.map(({ id }) => ref("module", id)),
    ...acceptedConcepts.map(({ id }) => ref("concept", id)),
  ]);
  const canonicalEdges = new Map(ontology.relations
    .filter(({ status }) => status === "accepted")
    .map((relation) => [relation.id, {
      source: ref("concept", relation.source_id),
      target: ref("concept", relation.target_id),
      relation: relation.predicate,
      evidence: "canonical",
    }]));
  const derivedEdges = new Map();
  for (const plane of ontology.planes) {
    derivedEdges.set(`derived:ontology-plane:${plane.id}`, {
      source: ref("root", ontology.id),
      target: ref("plane", plane.id),
      relation: "contains_domain",
      evidence: "derived",
    });
  }
  for (const module of ontology.modules) {
    derivedEdges.set(`derived:plane-module:${module.plane_id}:${module.id}`, {
      source: ref("plane", module.plane_id),
      target: ref("module", module.id),
      relation: "contains_module",
      evidence: "derived",
    });
    for (const concept of acceptedConcepts.filter(({ module_id, root_status: rootStatus }) =>
      module_id === module.id && ["module-key-root", "composition-root"].includes(rootStatus))) {
      derivedEdges.set(`derived:module-root:${module.id}:${concept.id}`, {
        source: ref("module", module.id),
        target: ref("concept", concept.id),
        relation: "contains_root_concept",
        evidence: "derived",
      });
    }
  }
  return { acceptedIds, nodeRefs, canonicalEdges, derivedEdges };
};

export const validateOntologyCommunityArtifact = ({
  ontology,
  canonicalBytes,
  artifact,
}) => {
  const errors = [];
  if (artifact?.schema_version !== "1.0.0") errors.push("schema_version must be 1.0.0");
  if (artifact?.source_sha256 !== sha256(canonicalBytes)) {
    errors.push("source_sha256 does not match ontology/agent-ontology.json");
  }
  if (artifact?.projection_sha256 !== projectionSha256(artifact)) {
    errors.push("projection_sha256 does not match the community graph content");
  }
  if (artifact?.algorithm?.seed !== 42) errors.push("community seed must be 42");
  const expected = expectedProjection(ontology);
  const nodes = Array.isArray(artifact?.nodes) ? artifact.nodes : [];
  const edges = Array.isArray(artifact?.edges) ? artifact.edges : [];
  const communities = Array.isArray(artifact?.communities) ? artifact.communities : [];
  const nodeRefs = new Set();
  for (const node of nodes) {
    if (nodeRefs.has(node.ref)) errors.push(`duplicate node: ${node.ref}`);
    nodeRefs.add(node.ref);
  }
  if (nodeRefs.size !== expected.nodeRefs.size ||
      [...expected.nodeRefs].some((nodeRef) => !nodeRefs.has(nodeRef))) {
    errors.push("node set does not match accepted canonical projection");
  }
  if (artifact?.metrics?.node_count !== nodes.length) errors.push("node_count is stale");
  if (artifact?.metrics?.edge_count !== edges.length) errors.push("edge_count is stale");
  if (artifact?.metrics?.community_count !== communities.length) {
    errors.push("community_count is stale");
  }

  const memberships = new Map();
  const communityIds = new Set();
  for (const community of communities) {
    if (!Number.isSafeInteger(community.id) || community.id < 0) {
      errors.push(`community id must be a non-negative safe integer: ${community.id}`);
    }
    if (communityIds.has(community.id)) {
      errors.push(`duplicate community id: ${community.id}`);
    }
    communityIds.add(community.id);
    const members = Array.isArray(community.member_refs) ? community.member_refs : [];
    if (community.member_count !== members.length) {
      errors.push(`community ${community.id} member_count is stale`);
    }
    if (!members.includes(community.hub_ref)) {
      errors.push(`community ${community.id} hub_ref is not a member`);
    }
    if (community.member_signature !== sha256(members.slice().sort().join("\n"))) {
      errors.push(`community ${community.id} member_signature is stale`);
    }
    for (const member of members) {
      if (memberships.has(member)) errors.push(`duplicate community membership: ${member}`);
      memberships.set(member, community.id);
    }
  }
  if (memberships.size !== nodeRefs.size ||
      nodes.some((node) => memberships.get(node.ref) !== node.community_id)) {
    errors.push("community assignments do not cover each node exactly once");
  }

  const edgeIds = new Set();
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) errors.push(`duplicate edge: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeRefs.has(edge.source) || !nodeRefs.has(edge.target)) {
      errors.push(`edge endpoint missing: ${edge.id}`);
    }
    if (edge.evidence !== "canonical" && edge.evidence !== "derived") {
      errors.push(`invalid edge evidence: ${edge.id}`);
      continue;
    }
    const expectedEdge = edge.evidence === "canonical"
      ? expected.canonicalEdges.get(edge.id)
      : expected.derivedEdges.get(edge.id);
    if (!expectedEdge) {
      errors.push(`unexpected ${edge.evidence} edge: ${edge.id}`);
      continue;
    }
    if (edge.source !== expectedEdge.source || edge.target !== expectedEdge.target) {
      errors.push(`direction mismatch: ${edge.id}`);
    }
    if (edge.relation !== expectedEdge.relation) errors.push(`predicate mismatch: ${edge.id}`);
  }
  for (const id of [...expected.canonicalEdges.keys(), ...expected.derivedEdges.keys()]) {
    if (!edgeIds.has(id)) errors.push(`projection edge missing: ${id}`);
  }

  const degrees = new Map([...nodeRefs].map((nodeRef) => [nodeRef, 0]));
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  for (const node of nodes) {
    if (node.degree !== degrees.get(node.ref)) errors.push(`degree mismatch: ${node.ref}`);
  }
  const maximumDegree = Math.max(0, ...degrees.values());
  if (artifact?.metrics?.maximum_degree !== maximumDegree) errors.push("maximum_degree is stale");
  return errors;
};

export const verifyOntologyCommunityArtifact = ({ root = process.cwd() } = {}) => {
  const canonicalPath = path.join(root, "ontology", "agent-ontology.json");
  const artifactPath = path.join(root, "src", "generated", "ontology-community-graph.json");
  const canonicalBytes = fs.readFileSync(canonicalPath);
  const ontology = JSON.parse(canonicalBytes.toString("utf8"));
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const errors = validateOntologyCommunityArtifact({ ontology, canonicalBytes, artifact });
  if (errors.length > 0) throw new Error(`Community graph verification failed:\n- ${errors.join("\n- ")}`);
  const canonicalEdgeCount = artifact.edges.filter(({ evidence }) =>
    evidence === "canonical").length;
  return Object.freeze({
    nodeCount: artifact.nodes.length,
    edgeCount: artifact.edges.length,
    communityCount: artifact.communities.length,
    canonicalEdgeCount,
    derivedEdgeCount: artifact.edges.length - canonicalEdgeCount,
    sourceSha256: artifact.source_sha256,
    projectionSha256: artifact.projection_sha256,
  });
};

if (isMainModule(import.meta.url)) {
  const result = verifyOntologyCommunityArtifact();
  console.log(
    `Verified NetworkX community graph: ${result.nodeCount} nodes, ` +
    `${result.edgeCount} edges, ${result.communityCount} communities`,
  );
}
