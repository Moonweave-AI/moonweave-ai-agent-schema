import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import canonicalOntology from "../src/generated/agent-ontology.json";
import communityGraph from "../src/generated/ontology-community-graph.json";

describe("YAML community projection and vis-network runtime boundary", () => {
  it("compiles deterministic module communities and uses one seeded browser layout", () => {
    const compiler = readFileSync(
      resolve("scripts/lib/ontology-yaml-compiler.mjs"), "utf8");
    const graphComponent = readFileSync(resolve("src/components/OntologyGraph.tsx"), "utf8");
    const runtime = readFileSync(resolve("src/lib/ontology-network-runtime.ts"), "utf8");
    const networkModel = readFileSync(resolve("src/lib/ontology-community-network.ts"), "utf8");

    expect(compiler).toContain('assignment_policy: "canonical-module-owner"');
    expect(compiler).toContain("seed: 42");
    expect(compiler).toContain('diagnostic_engine: "none"');
    expect(graphComponent).toContain("ontology-community-graph.json");
    expect(graphComponent).not.toMatch(/new Worker|cytoscape|elkjs|fcose/iu);
    expect(runtime).toContain('import("vis-network")');
    expect(networkModel).toContain('solver: "forceAtlas2Based"');
    expect(runtime).toContain('network.once("stabilizationIterationsDone"');
    expect(runtime).toContain("network.stabilize(");
  });

  it("publishes a complete one-community-per-node projection with canonical direction", () => {
    const memberships = communityGraph.communities.flatMap((community) =>
      community.member_refs.map((ref) => [ref, community.id] as const));
    const assigned = new Map(memberships);

    expect(communityGraph.schema_version).toBe("2.0.0");
    expect(communityGraph.algorithm.seed).toBe(42);
    expect(communityGraph.nodes).toHaveLength(communityGraph.metrics.node_count);
    expect(communityGraph.edges).toHaveLength(communityGraph.metrics.edge_count);
    expect(assigned.size).toBe(communityGraph.nodes.length);
    for (const node of communityGraph.nodes) {
      expect(assigned.get(node.ref)).toBe(node.community_id);
    }
    expect(communityGraph.edges.filter(({ evidence }) => evidence === "canonical"))
      .toHaveLength(canonicalOntology.relations.filter(({ status }) => status !== "deprecated").length);
  });

  it("does not use layout communities as schema, example, or source nodes", () => {
    expect(communityGraph.nodes.every(({ ref }) =>
      /^(?:root|plane|module|concept):/u.test(ref))).toBe(true);
    expect(JSON.stringify(communityGraph.nodes)).not.toMatch(
      /(?:schema|example|source-claim|field):/iu,
    );
  });
});
