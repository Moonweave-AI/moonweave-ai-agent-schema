import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { isMainModule } from "./lib/cli-entrypoint.mjs";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const ref = (kind, id) => `${kind}:${id}`;
const displayLabel = (record) => ["en", "zh", "ja"]
  .map((language) => record?.labels?.[language])
  .find((label) => typeof label === "string" && label.trim())?.trim() ?? record?.id;
const projectionSha256 = (artifact) => {
  const { algorithm, metrics, communities, nodes, edges } = artifact ?? {};
  return sha256(JSON.stringify({ algorithm, metrics, communities, nodes, edges }));
};

const primaryBackboneParentByChild = (ontology, currentConcepts) => {
  const currentById = new Map(currentConcepts.map((concept) => [concept.id, concept]));
  const parents = new Map();
  for (const relation of ontology.relations.filter(({ status }) => status !== "deprecated")) {
    const source = currentById.get(relation.source_id);
    const fallbackPrimary = relation.layout_role == null
      && relation.predicate === "is_a"
      && source?.primary_parent_relation_id === relation.id;
    if (relation.layout_role !== "primary-backbone" && !fallbackPrimary) continue;
    const parentId = relation.layout_parent_id ?? (
      relation.predicate === "is_a" ? relation.target_id : relation.source_id
    );
    const childId = relation.layout_child_id ?? (
      relation.predicate === "is_a" ? relation.source_id : relation.target_id
    );
    if (
      parentId === childId ||
      !currentById.has(parentId) ||
      !currentById.has(childId) ||
      ![relation.source_id, relation.target_id].includes(parentId) ||
      ![relation.source_id, relation.target_id].includes(childId)
    ) {
      throw new Error(
        `Primary-backbone relation ${relation.id} has invalid endpoints ${parentId}->${childId}`,
      );
    }
    if (parents.has(childId)) {
      throw new Error(`Accepted concept ${childId} has more than one primary-backbone parent`);
    }
    parents.set(childId, parentId);
  }
  return parents;
};

const moduleEntryConcepts = (module, currentConcepts, parentByChild) => {
  const currentById = new Map(currentConcepts.map((concept) => [concept.id, concept]));
  return currentConcepts.filter((concept) => {
    if (concept.module_id !== module.id) return false;
    const parent = currentById.get(parentByChild.get(concept.id));
    return parent?.module_id !== module.id;
  });
};

const expectedProjection = (ontology) => {
  const currentConcepts = ontology.classes.filter(({ status }) => status !== "deprecated");
  const parentByChild = primaryBackboneParentByChild(ontology, currentConcepts);
  const nodeRefs = new Set([
    ref("root", ontology.id),
    ...ontology.planes.map(({ id }) => ref("plane", id)),
    ...ontology.modules.map(({ id }) => ref("module", id)),
    ...currentConcepts.map(({ id }) => ref("concept", id)),
  ]);
  const canonicalEdges = new Map(ontology.relations
    .filter(({ status }) => status !== "deprecated")
    .map((relation) => [relation.id, {
      source: ref("concept", relation.source_id),
      target: ref("concept", relation.target_id),
      relation: relation.predicate,
      evidence: "canonical",
      relation_kind: relation.relation_kind,
      layout_role: relation.layout_role ?? "none",
    }]));
  const derivedEdges = new Map();
  for (const plane of ontology.planes) {
    derivedEdges.set(`derived:ontology-plane:${plane.id}`, {
      source: ref("root", ontology.id),
      target: ref("plane", plane.id),
      relation: "contains_domain",
      evidence: "derived",
      relation_kind: "organization",
      layout_role: "ownership",
    });
  }
  for (const module of ontology.modules) {
    derivedEdges.set(`derived:plane-module:${module.plane_id}:${module.id}`, {
      source: ref("plane", module.plane_id),
      target: ref("module", module.id),
      relation: "contains_module",
      evidence: "derived",
      relation_kind: "organization",
      layout_role: "ownership",
    });
    for (const concept of moduleEntryConcepts(module, currentConcepts, parentByChild)) {
      derivedEdges.set(`derived:module-root:${module.id}:${concept.id}`, {
        source: ref("module", module.id),
        target: ref("concept", concept.id),
        relation: "contains_root_concept",
        evidence: "derived",
        relation_kind: "organization",
        layout_role: "ownership",
      });
    }
  }
  const navigationRefs = [
    ref("root", ontology.id),
    ...ontology.planes.map(({ id }) => ref("plane", id)),
  ].sort();
  const expectedCommunities = [
    {
      id: 0,
      label: displayLabel(ontology),
      hubRef: ref("root", ontology.id),
      ownerModuleId: null,
      memberRefs: navigationRefs,
    },
    ...ontology.modules
      .slice()
      .sort(({ id: left }, { id: right }) => left.localeCompare(right))
      .map((module, index) => ({
        id: index + 1,
        label: displayLabel(module),
        hubRef: ref("module", module.id),
        ownerModuleId: module.id,
        memberRefs: [
          ref("module", module.id),
          ...currentConcepts
            .filter(({ module_id: moduleId }) => moduleId === module.id)
            .map(({ id }) => ref("concept", id)),
        ].sort(),
      })),
  ];
  return { nodeRefs, canonicalEdges, derivedEdges, expectedCommunities };
};

export const validateOntologyCommunityArtifact = ({
  ontology,
  canonicalBytes,
  artifact,
}) => {
  const errors = [];
  if (artifact?.schema_version !== "2.0.0") errors.push("schema_version must be 2.0.0");
  if (artifact?.source_sha256 !== sha256(canonicalBytes)) {
    errors.push("source_sha256 does not match src/generated/agent-ontology.json");
  }
  if (artifact?.projection_sha256 !== projectionSha256(artifact)) {
    errors.push("projection_sha256 does not match the community graph content");
  }
  if (artifact?.algorithm?.seed !== 42) errors.push("community seed must be 42");
  if (artifact?.algorithm?.engine !== "canonical-module-anchors") {
    errors.push("community engine must be canonical-module-anchors");
  }
  if (artifact?.algorithm?.assignment_policy !== "canonical-module-owner") {
    errors.push("community assignment_policy must be canonical-module-owner");
  }
  if (typeof artifact?.algorithm?.diagnostic_engine !== "string" ||
      !artifact.algorithm.diagnostic_engine) {
    errors.push("community diagnostic_engine must be recorded");
  }
  if (!Number.isSafeInteger(artifact?.algorithm?.diagnostic_community_count) ||
      artifact.algorithm.diagnostic_community_count < 1) {
    errors.push("community diagnostic_community_count must be a positive safe integer");
  }
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
    errors.push("node set does not match current canonical projection");
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
    if (community.member_signature !== sha256(JSON.stringify(members))) {
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
  if (communities.length !== expected.expectedCommunities.length) {
    errors.push("visible communities must contain one navigation community and one per Module");
  }
  const communityById = new Map(communities.map((community) => [community.id, community]));
  for (const expectedCommunity of expected.expectedCommunities) {
    const community = communityById.get(expectedCommunity.id);
    if (!community) {
      errors.push(`canonical owner community is missing: ${expectedCommunity.id}`);
      continue;
    }
    if (community.owner_module_id !== expectedCommunity.ownerModuleId) {
      errors.push(`community ${community.id} owner_module_id does not match canonical owner`);
    }
    if (community.label !== expectedCommunity.label) {
      errors.push(`community ${community.id} label does not match its canonical owner`);
    }
    if (community.hub_ref !== expectedCommunity.hubRef) {
      errors.push(`community ${community.id} hub_ref is not its canonical owner anchor`);
    }
    const actualMembers = Array.isArray(community.member_refs)
      ? community.member_refs.slice().sort()
      : [];
    if (actualMembers.length !== expectedCommunity.memberRefs.length ||
        actualMembers.some((member, index) => member !== expectedCommunity.memberRefs[index])) {
      errors.push(`community ${community.id} members do not match canonical Module ownership`);
    }
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
    if (edge.relation_kind !== expectedEdge.relation_kind) {
      errors.push(`relation_kind mismatch: ${edge.id}`);
    }
    if (edge.layout_role !== expectedEdge.layout_role) {
      errors.push(`layout_role mismatch: ${edge.id}`);
    }
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
  const canonicalPath = path.join(root, "src", "generated", "agent-ontology.json");
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
    `Verified ontology community graph: ${result.nodeCount} nodes, ` +
    `${result.edgeCount} edges, ${result.communityCount} communities`,
  );
}
