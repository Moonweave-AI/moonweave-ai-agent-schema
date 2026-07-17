import { describe, expect, it } from "vitest";

import canonicalOntology from "../src/generated/agent-ontology.json";
import communityGraph from "../src/generated/ontology-community-graph.json";
import {
  buildOntologyCommunityNetworkModel,
  validateOntologyCommunityGraph,
  type OntologyCommunityGraphArtifact,
} from "../src/lib/ontology-community-network";
import { buildOntologyIndex } from "../src/lib/ontology-index";

const index = buildOntologyIndex(
  canonicalOntology as unknown as Parameters<typeof buildOntologyIndex>[0],
);
const artifact = communityGraph as unknown as OntologyCommunityGraphArtifact;

const percentile95 = (values: readonly number[]): number => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0;
};

describe("full community graph projection performance", () => {
  it("validates and maps the complete graph without blocking the UI budget", () => {
    expect(validateOntologyCommunityGraph(index, artifact)).toEqual([]);
    buildOntologyCommunityNetworkModel(index, artifact, "zh", "dark");
    const durations = Array.from({ length: 20 }, () => {
      const startedAt = performance.now();
      const model = buildOntologyCommunityNetworkModel(index, artifact, "zh", "dark");
      expect(model.nodes).toHaveLength(artifact.metrics.node_count);
      expect(model.edges).toHaveLength(artifact.metrics.edge_count);
      return performance.now() - startedAt;
    });

    expect(percentile95(durations)).toBeLessThan(120);
  });
});
