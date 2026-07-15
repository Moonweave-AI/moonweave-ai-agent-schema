import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  validateOntologyCommunityArtifact,
  verifyOntologyCommunityArtifact,
} from "../scripts/verify-ontology-community-graph.mjs";

const canonicalBytes = readFileSync("ontology/agent-ontology.json");
const ontology = JSON.parse(canonicalBytes.toString("utf8"));
const artifact = JSON.parse(readFileSync(
  "src/generated/ontology-community-graph.json", "utf8"));

describe("generated ontology community artifact", () => {
  it("matches the canonical file fingerprint, accepted relation direction, and ownership closure", () => {
    expect(validateOntologyCommunityArtifact({ ontology, canonicalBytes, artifact })).toEqual([]);
    expect(verifyOntologyCommunityArtifact()).toMatchObject({
      nodeCount: 753,
      edgeCount: 1300,
      communityCount: 36,
      canonicalEdgeCount: 1091,
      derivedEdgeCount: 209,
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
});
