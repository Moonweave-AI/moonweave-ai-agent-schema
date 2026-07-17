import type { OntologyCommunityGraphArtifact } from "../../src/lib/ontology-community-network";
import type { OntologyEntityRef, OntologyIndex } from "../../src/lib/ontology-index";

export const buildCommunityGraphFixture = (
  index: OntologyIndex,
): OntologyCommunityGraphArtifact => {
  const refs = [...index.entitiesByRef.values()]
    .filter((entity) => entity.data.status !== "deprecated")
    .map(({ ref }) => ref)
    .sort();
  const refSet = new Set(refs);
  const canonicalEdges = [...index.relationsById.values()]
    .filter((relation) => relation.status !== "deprecated")
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
      relation_kind: relation.relation_kind,
      layout_role: relation.layout_role ?? "none" as const,
    }));
  const rootEdges = [...index.planesById.values()].map((plane) => ({
    id: `derived:ontology-plane:${plane.id}`,
    source: index.rootRef,
    target: `plane:${plane.id}` as OntologyEntityRef,
    relation: "contains_domain",
    evidence: "derived" as const,
    relation_kind: "organization",
    layout_role: "ownership" as const,
  }));
  const moduleEdges = [...index.modulesById.values()].map((module) => ({
    id: `derived:plane-module:${module.plane_id}:${module.id}`,
    source: `plane:${module.plane_id}` as OntologyEntityRef,
    target: `module:${module.id}` as OntologyEntityRef,
    relation: "contains_module",
    evidence: "derived" as const,
    relation_kind: "organization",
    layout_role: "ownership" as const,
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
        relation_kind: "organization",
        layout_role: "ownership" as const,
      })));
  const edges = [...canonicalEdges, ...rootEdges, ...moduleEdges, ...moduleRootEdges]
    .sort((left, right) => left.id.localeCompare(right.id));
  const degrees = new Map(refs.map((ref) => [ref, 0]));
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  const maximumDegree = Math.max(1, ...degrees.values());
  const structuralGroups = [
    {
      members: refs.filter((ref) => ref === index.rootRef || ref.startsWith("plane:")),
      hub: index.rootRef,
      label: index.ontology.labels.en,
      ownerModuleId: null,
    },
    ...[...index.modulesById.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((module) => ({
        members: refs.filter((ref) => {
          if (ref === `module:${module.id}`) return true;
          const entity = index.entitiesByRef.get(ref);
          return entity?.kind === "concept" &&
            (entity.data as { readonly module_id: string }).module_id === module.id;
        }),
        hub: `module:${module.id}` as OntologyEntityRef,
        label: module.labels.en ?? module.id,
        ownerModuleId: module.id,
      })),
  ];
  const communityIdByRef = new Map(structuralGroups.flatMap((group, communityId) =>
    group.members.map((ref) => [ref, communityId] as const)));
  return {
    schema_version: "2.0.0",
    source_sha256: "fixture-community-source",
    projection_sha256: "f".repeat(64),
    algorithm: {
      engine: "canonical-module-anchors",
      assignment_policy: "canonical-module-owner",
      diagnostic_engine: "fixture-structural-detector",
      diagnostic_community_count: structuralGroups.length,
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
      community_count: structuralGroups.length,
      maximum_degree: maximumDegree,
    },
    communities: structuralGroups.map((group, id) => {
      return {
        id,
        hub_ref: group.hub,
        owner_module_id: group.ownerModuleId,
        label: group.label,
        member_count: group.members.length,
        cohesion: 0.5,
        member_signature: `fixture-community-${id}`,
        member_refs: group.members,
      };
    }),
    nodes: refs.map((ref) => ({
      ref,
      community_id: communityIdByRef.get(ref) ?? -1,
      degree: degrees.get(ref) ?? 0,
    })),
    edges,
  };
};
