import type { OntologyCommunityGraphArtifact } from "../../src/lib/ontology-community-network";
import type { OntologyEntityRef, OntologyIndex } from "../../src/lib/ontology-index";

export const buildCommunityGraphFixture = (
  index: OntologyIndex,
): OntologyCommunityGraphArtifact => {
  const refs = [...index.entitiesByRef.values()]
    .filter((entity) => entity.kind !== "concept" || entity.data.status === "accepted")
    .map(({ ref }) => ref)
    .sort();
  const refSet = new Set(refs);
  const canonicalEdges = [...index.relationsById.values()]
    .filter((relation) => relation.status === "accepted")
    .filter((relation) => {
      const source = `concept:${relation.source_id}` as OntologyEntityRef;
      const target = `concept:${relation.target_id}` as OntologyEntityRef;
      return refSet.has(source) && refSet.has(target);
    })
    .map((relation) => ({
      id: relation.id,
      source: `concept:${relation.source_id}` as OntologyEntityRef,
      target: `concept:${relation.target_id}` as OntologyEntityRef,
      relation: relation.predicate,
      evidence: "canonical" as const,
    }));
  const rootEdges = [...index.planesById.values()].map((plane) => ({
    id: `derived:ontology-plane:${plane.id}`,
    source: index.rootRef,
    target: `plane:${plane.id}` as OntologyEntityRef,
    relation: "contains_domain",
    evidence: "derived" as const,
  }));
  const moduleEdges = [...index.modulesById.values()].map((module) => ({
    id: `derived:plane-module:${module.plane_id}:${module.id}`,
    source: `plane:${module.plane_id}` as OntologyEntityRef,
    target: `module:${module.id}` as OntologyEntityRef,
    relation: "contains_module",
    evidence: "derived" as const,
  }));
  const moduleRootEdges = [...index.rootConceptRefsByModuleId.entries()]
    .flatMap(([moduleId, rootRefs]) => rootRefs
      .filter((rootRef) => refSet.has(rootRef))
      .map((rootRef) => ({
        id: `derived:module-root:${moduleId}:${index.entitiesByRef.get(rootRef)?.id ?? rootRef}`,
        source: `module:${moduleId}` as OntologyEntityRef,
        target: rootRef,
        relation: "contains_root_concept",
        evidence: "derived" as const,
      })));
  const edges = [...canonicalEdges, ...rootEdges, ...moduleEdges, ...moduleRootEdges]
    .sort((left, right) => left.id.localeCompare(right.id));
  const degrees = new Map(refs.map((ref) => [ref, 0]));
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  const maximumDegree = Math.max(1, ...degrees.values());
  return {
    schema_version: "1.0.0",
    source_sha256: "fixture-community-source",
    projection_sha256: "f".repeat(64),
    algorithm: {
      engine: "networkx-louvain",
      seed: 42,
      resolution: 1,
      oversized_fraction: 0.25,
      minimum_split_size: 10,
      cohesion_threshold: 0.05,
      cohesion_split_minimum_size: 50,
    },
    metrics: {
      node_count: refs.length,
      edge_count: edges.length,
      community_count: 1,
      maximum_degree: maximumDegree,
    },
    communities: [{
      id: 0,
      hub_ref: refs.find((ref) => ref.includes("AgentRun")) ?? refs[0],
      label: "Fixture community",
      member_count: refs.length,
      cohesion: 0.5,
      member_signature: "fixture-community",
      member_refs: refs,
    }],
    nodes: refs.map((ref) => ({ ref, community_id: 0, degree: degrees.get(ref) ?? 0 })),
    edges,
  };
};
