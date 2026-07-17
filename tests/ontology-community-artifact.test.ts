import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  validateOntologyCommunityArtifact,
  verifyOntologyCommunityArtifact,
} from "../scripts/verify-ontology-community-graph.mjs";

const canonicalBytes = readFileSync("src/generated/agent-ontology.json");
const ontology = JSON.parse(canonicalBytes.toString("utf8"));
const artifact = JSON.parse(readFileSync(
  "src/generated/ontology-community-graph.json", "utf8"));

describe("generated ontology community artifact", () => {
  it("matches the canonical file fingerprint, current relation direction, and ownership closure", () => {
    const currentConcepts = ontology.classes.filter(
      ({ status }: { status: string }) => status !== "deprecated",
    );
    const currentRelations = ontology.relations.filter(
      ({ status }: { status: string }) => status !== "deprecated",
    );
    const currentById = new Map<string, { id: string; module_id: string }>(currentConcepts.map(
      (concept: { id: string; module_id: string }) => [concept.id, concept],
    ));
    const parentByChild = new Map<string, string>(currentRelations
      .filter((relation: { layout_role?: string }) =>
        relation.layout_role === "primary-backbone")
      .map((relation: {
        predicate: string;
        source_id: string;
        target_id: string;
        layout_parent_id?: string | null;
        layout_child_id?: string | null;
      }) => [
        relation.layout_child_id ?? (
          relation.predicate === "is_a" ? relation.source_id : relation.target_id
        ),
        relation.layout_parent_id ?? (
          relation.predicate === "is_a" ? relation.target_id : relation.source_id
        ),
      ]),
    );
    const moduleEntryCount = currentConcepts.filter((concept: {
      id: string;
      module_id: string;
    }) => {
      const parentId = parentByChild.get(concept.id);
      const parent = parentId ? currentById.get(parentId) : undefined;
      return parent?.module_id !== concept.module_id;
    }).length;
    const derivedEdgeCount = ontology.planes.length + ontology.modules.length + moduleEntryCount;
    expect(validateOntologyCommunityArtifact({ ontology, canonicalBytes, artifact })).toEqual([]);
    expect(verifyOntologyCommunityArtifact()).toMatchObject({
      nodeCount: 1 + ontology.planes.length + ontology.modules.length + currentConcepts.length,
      edgeCount: currentRelations.length + derivedEdgeCount,
      communityCount: ontology.modules.length + 1,
      canonicalEdgeCount: currentRelations.length,
      derivedEdgeCount,
    });
  });

  it("rejects a stale fingerprint, duplicate membership, and reversed canonical edge", () => {
    const altered = structuredClone(artifact);
    altered.source_sha256 = "stale";
    altered.communities[1].member_refs.push(altered.communities[0].member_refs[0]);
    const canonical = altered.edges.find((edge: { evidence: string }) =>
      edge.evidence === "canonical");
    [canonical.source, canonical.target] = [canonical.target, canonical.source];

    expect(validateOntologyCommunityArtifact({
      ontology,
      canonicalBytes,
      artifact: altered,
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("source_sha256"),
      expect.stringContaining("duplicate community membership"),
      expect.stringContaining("direction mismatch"),
    ]));
  });

  it("binds every visual projection field and rejects unknown evidence kinds", () => {
    const altered = structuredClone(artifact);
    altered.algorithm.resolution = 999;
    altered.communities[0].label = "tampered-community-label";
    altered.metrics.maximum_degree = -1;
    altered.edges[0].evidence = "inferred";

    expect(validateOntologyCommunityArtifact({
      ontology,
      canonicalBytes,
      artifact: altered,
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("projection_sha256"),
      expect.stringContaining("invalid edge evidence"),
    ]));
  });

  it("rejects duplicate community IDs and hubs outside their communities", () => {
    const altered = structuredClone(artifact);
    altered.communities[1].id = altered.communities[0].id;
    altered.communities[0].hub_ref = "concept:not-a-community-member";

    expect(validateOntologyCommunityArtifact({
      ontology,
      canonicalBytes,
      artifact: altered,
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("duplicate community id"),
      expect.stringContaining("hub_ref is not a member"),
    ]));
  });

  it("requires community IDs to be non-negative safe integers", () => {
    const altered = structuredClone(artifact);
    const originalId = altered.communities[0].id;
    altered.communities[0].id = String(originalId);
    for (const node of altered.nodes) {
      if (node.community_id === originalId) node.community_id = String(originalId);
    }

    expect(validateOntologyCommunityArtifact({
      ontology,
      canonicalBytes,
      artifact: altered,
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("community id must be a non-negative safe integer"),
    ]));
  });

  it("rejects community membership that contradicts canonical Module ownership", () => {
    const altered = structuredClone(artifact);
    const sourceCommunity = altered.communities.find(
      ({ owner_module_id: owner, member_refs: members }: {
        owner_module_id: string | null;
        member_refs: string[];
      }) => owner && members.some((ref: string) => ref.startsWith("concept:")),
    );
    const targetCommunity = altered.communities.find(
      ({ owner_module_id: owner }: { owner_module_id: string | null }) =>
        owner && owner !== sourceCommunity.owner_module_id,
    );
    const movedConcept = sourceCommunity.member_refs.find(
      (ref: string) => ref.startsWith("concept:"),
    );
    sourceCommunity.member_refs = sourceCommunity.member_refs.filter(
      (ref: string) => ref !== movedConcept,
    );
    targetCommunity.member_refs.push(movedConcept);

    expect(validateOntologyCommunityArtifact({
      ontology,
      canonicalBytes,
      artifact: altered,
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("members do not match canonical Module ownership"),
    ]));
  });
});
