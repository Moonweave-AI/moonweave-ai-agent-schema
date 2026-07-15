import { describe, expect, it } from "vitest";

import {
  GRAPHIFY_FORCE_ATLAS_OPTIONS,
  buildOntologyCommunityNetworkModel,
  validateOntologyCommunityGraph,
  type OntologyCommunityGraphArtifact,
} from "../src/lib/ontology-community-network";
import { buildOntologyIndex } from "../src/lib/ontology-index";
import { buildCommunityGraphFixture } from "./fixtures/ontology-community-graph.fixture";
import { ontologyViewModelFixture } from "./fixtures/ontology-view-model.fixture";

const index = buildOntologyIndex(
  ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
);
const fullArtifact = buildCommunityGraphFixture(index);

const artifact: OntologyCommunityGraphArtifact = {
  schema_version: "1.0.0",
  source_sha256: "fixture-sha256",
  projection_sha256: "fixture-projection-sha256",
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
    node_count: 4,
    edge_count: 4,
    community_count: 2,
    maximum_degree: 20,
  },
  communities: [
    {
      id: 0,
      hub_ref: "concept:AgentRun",
      label: "Agent run",
      member_count: 3,
      cohesion: 0.5,
      member_signature: "community-0",
      member_refs: ["concept:AgentRun", "concept:RunResult", "concept:Tool"],
    },
    {
      id: 1,
      hub_ref: "concept:LeafRun",
      label: "Leaf run",
      member_count: 1,
      cohesion: 1,
      member_signature: "community-1",
      member_refs: ["concept:LeafRun"],
    },
  ],
  nodes: [
    { ref: "concept:AgentRun", community_id: 0, degree: 20 },
    { ref: "concept:RunResult", community_id: 0, degree: 3 },
    { ref: "concept:Tool", community_id: 0, degree: 1 },
    { ref: "concept:LeafRun", community_id: 1, degree: 1 },
  ],
  edges: [
    {
      id: "AgentRun-produces-RunResult",
      source: "concept:AgentRun",
      target: "concept:RunResult",
      relation: "produces",
      evidence: "canonical",
    },
    {
      id: "AgentRun-finalizes-RunResult",
      source: "concept:AgentRun",
      target: "concept:RunResult",
      relation: "finalizes",
      evidence: "canonical",
    },
    {
      id: "RunResult-describes-AgentRun",
      source: "concept:RunResult",
      target: "concept:AgentRun",
      relation: "describes",
      evidence: "canonical",
    },
    {
      id: "derived-module-root",
      source: "concept:Tool",
      target: "concept:LeafRun",
      relation: "contains_root_concept",
      evidence: "derived",
    },
  ],
};

describe("Graphify-inspired ontology community network", () => {
  it("keeps the single ForceAtlas2Based policy and freezes after 200 iterations", () => {
    expect(GRAPHIFY_FORCE_ATLAS_OPTIONS).toMatchObject({
      layout: { randomSeed: 42 },
      physics: {
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -60,
          centralGravity: 0.005,
          springLength: 120,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0.8,
        },
        stabilization: { iterations: 200, fit: true },
      },
    });
  });

  it("maps color to community, size to degree, and labels only structural hubs", () => {
    const model = buildOntologyCommunityNetworkModel(index, artifact, "en", "dark");
    const hub = model.nodes.find(({ id }) => id === "concept:AgentRun");
    const medium = model.nodes.find(({ id }) => id === "concept:RunResult");
    const leaf = model.nodes.find(({ id }) => id === "concept:Tool");

    expect(hub).toMatchObject({ size: 40, baseFontSize: 12, communityId: 0 });
    expect(medium).toMatchObject({ size: 14.5, baseFontSize: 12, communityId: 0 });
    expect(leaf).toMatchObject({ size: 11.5, baseFontSize: 0, communityId: 0 });
    expect(hub?.color.background).toBe(medium?.color.background);
    expect(model.communities[0]).toMatchObject({ id: 0, label: "AgentRun", count: 3 });
  });

  it("preserves canonical direction and parallel predicates while hiding edge labels", () => {
    const model = buildOntologyCommunityNetworkModel(index, artifact, "en", "dark");
    const canonical = model.edges.filter(({ evidence }) => evidence === "canonical");
    const derived = model.edges.find(({ evidence }) => evidence === "derived");

    expect(canonical).toHaveLength(3);
    expect(canonical.map(({ from, to, relation }) => ({ from, to, relation }))).toEqual(expect.arrayContaining([
      { from: "concept:AgentRun", to: "concept:RunResult", relation: "produces" },
      { from: "concept:AgentRun", to: "concept:RunResult", relation: "finalizes" },
      { from: "concept:RunResult", to: "concept:AgentRun", relation: "describes" },
    ]));
    expect(canonical.every(({ label, dashes, width }) => label === "" && !dashes && width === 2))
      .toBe(true);
    expect(derived).toMatchObject({ dashes: true, width: 1, opacity: 0.35 });
  });

  it("assigns stable, non-overlapping curves to parallel and reverse predicates", () => {
    const model = buildOntologyCommunityNetworkModel(index, artifact, "en", "dark");
    const reversedModel = buildOntologyCommunityNetworkModel(
      index,
      { ...artifact, edges: [...artifact.edges].reverse() },
      "en",
      "dark",
    );
    const relationshipEdges = model.edges.filter(({ evidence }) => evidence === "canonical");
    const geometryById = new Map(model.edges.map(({ id, smooth }) => [id, smooth]));
    const reversedGeometryById = new Map(
      reversedModel.edges.map(({ id, smooth }) => [id, smooth]),
    );

    expect(geometryById).toEqual(reversedGeometryById);
    expect(relationshipEdges.every(({ smooth }) => smooth.type !== "continuous")).toBe(true);

    const physicalCurves = relationshipEdges.map(({ from, to, smooth }) => {
      const followsCanonicalEndpointOrder = from <= to;
      const physicalSide = followsCanonicalEndpointOrder
        ? smooth.type
        : smooth.type === "curvedCW" ? "curvedCCW" : "curvedCW";
      return `${physicalSide}:${smooth.roundness}`;
    });
    expect(new Set(physicalCurves).size).toBe(relationshipEdges.length);
    expect(model.edges.find(({ evidence }) => evidence === "derived")?.smooth).toEqual({
      enabled: true,
      type: "continuous",
      roundness: 0.2,
    });
  });

  it("rejects stale or internally inconsistent community artifacts", () => {
    expect(validateOntologyCommunityGraph(
      index,
      fullArtifact,
      `sha256:${fullArtifact.source_sha256}`,
    )).toEqual([]);
    expect(validateOntologyCommunityGraph(index, {
      ...fullArtifact,
      metrics: { ...fullArtifact.metrics, node_count: 99 },
      nodes: [...fullArtifact.nodes, fullArtifact.nodes[0]],
    })).toEqual(expect.arrayContaining([
      expect.stringContaining("node_count"),
      expect.stringContaining("duplicate node"),
    ]));
    expect(validateOntologyCommunityGraph(
      index,
      {
        ...fullArtifact,
        source_sha256: "stale-source",
        edges: fullArtifact.edges.slice(1),
        metrics: { ...fullArtifact.metrics, edge_count: fullArtifact.edges.length - 1 },
      },
      `sha256:${fullArtifact.source_sha256}`,
    )).toEqual(expect.arrayContaining([
      expect.stringContaining("source_sha256"),
      expect.stringContaining("edge set"),
    ]));
  });
});
