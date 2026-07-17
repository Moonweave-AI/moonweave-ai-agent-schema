import { describe, expect, it } from "vitest";

import {
  GRAPHIFY_FORCE_ATLAS_OPTIONS,
  ONTOLOGY_COMMUNITY_GRAPH_LIMITS,
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
  schema_version: "2.0.0",
  source_sha256: "fixture-sha256",
  projection_sha256: "fixture-projection-sha256",
  algorithm: {
    engine: "canonical-module-anchors",
    assignment_policy: "canonical-module-owner",
    diagnostic_engine: "fixture-structural-detector",
    diagnostic_community_count: 2,
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
      owner_module_id: null,
      label: "Agent run",
      member_count: 3,
      cohesion: 0.5,
      member_signature: "community-0",
      member_refs: ["concept:AgentRun", "concept:RunResult", "concept:Tool"],
    },
    {
      id: 1,
      hub_ref: "concept:LeafRun",
      owner_module_id: "fixture-leaf-module",
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
      layout_role: "cross-link",
      relation_kind: "causal",
    },
    {
      id: "AgentRun-finalizes-RunResult",
      source: "concept:AgentRun",
      target: "concept:RunResult",
      relation: "finalizes",
      evidence: "canonical",
      layout_role: "cross-link",
      relation_kind: "causal",
    },
    {
      id: "RunResult-describes-AgentRun",
      source: "concept:RunResult",
      target: "concept:AgentRun",
      relation: "describes",
      evidence: "canonical",
      layout_role: "cross-link",
      relation_kind: "information",
    },
    {
      id: "derived-module-root",
      source: "concept:Tool",
      target: "concept:LeafRun",
      relation: "contains_root_concept",
      evidence: "derived",
      layout_role: "ownership",
      relation_kind: "composition",
    },
  ],
};

describe("Graphify-inspired ontology community network", () => {
  it("anchors visible communities to canonical Module owners", () => {
    expect(fullArtifact.algorithm).toMatchObject({
      engine: "canonical-module-anchors",
      assignment_policy: "canonical-module-owner",
      diagnostic_engine: "fixture-structural-detector",
    });
    expect(fullArtifact.communities).toHaveLength(index.modulesById.size + 1);
    expect(fullArtifact.communities[0]).toMatchObject({
      id: 0,
      hub_ref: index.rootRef,
      owner_module_id: null,
    });
    for (const community of fullArtifact.communities.slice(1)) {
      expect(community.owner_module_id).toBeTruthy();
      expect(community.hub_ref).toBe(`module:${community.owner_module_id}`);
      expect(community.member_refs.every((ref) => {
        if (ref === community.hub_ref) return true;
        const entity = index.entitiesByRef.get(ref);
        if (entity?.kind !== "concept") return false;
        return index.conceptsById.get(entity.data.id)?.module_id === community.owner_module_id;
      })).toBe(true);
    }
  });

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

  it("maps color to canonical owner communities, size to degree, and labels structural hubs", () => {
    const model = buildOntologyCommunityNetworkModel(index, artifact, "en", "dark");
    const hub = model.nodes.find(({ id }) => id === "concept:AgentRun");
    const medium = model.nodes.find(({ id }) => id === "concept:RunResult");
    const leaf = model.nodes.find(({ id }) => id === "concept:Tool");

    expect(hub).toMatchObject({ size: 40, baseFontSize: 12, communityId: 0 });
    expect(medium).toMatchObject({ size: 14.5, baseFontSize: 12, communityId: 0 });
    expect(leaf).toMatchObject({ size: 11.5, baseFontSize: 12, communityId: 0 });
    expect(hub?.color.background).toBe(medium?.color.background);
    expect(model.communities[0]).toMatchObject({ id: 0, label: "AgentRun", count: 3 });
  });

  it("localizes community and tooltip chrome without translating canonical identifiers", () => {
    const zh = buildOntologyCommunityNetworkModel(index, artifact, "zh", "dark");
    const en = buildOntologyCommunityNetworkModel(index, artifact, "en", "dark");
    const ja = buildOntologyCommunityNetworkModel(index, artifact, "ja", "dark");

    expect(zh.algorithmLabel).toBe("规范模块社区");
    expect(zh.nodes[0].titleText).toContain("概念 · 连接度");
    expect(zh.edges[0].titleText).toContain("规范关系 · 关系类型");
    expect(en.algorithmLabel).toBe("Canonical Module communities");
    expect(en.nodes[0].titleText).toContain("Concept · degree");
    expect(en.edges[0].titleText).toContain("canonical relation · relation kind");
    expect(ja.algorithmLabel).toBe("正規モジュールコミュニティ");
    expect(ja.nodes[0].titleText).toContain("概念 · 次数");
    expect(ja.edges[0].titleText).toContain("正規関係 · 関係種別");
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
    expect(canonical[0]?.titleText).toContain(
      "relation kind: causal · layout role: cross-link",
    );
    expect(canonical.every(({ physics }) => physics === false)).toBe(true);
    expect(derived?.physics).toBe(true);
    expect(derived).toMatchObject({ dashes: true, width: 1, opacity: 0.35 });
  });

  it("lets only ownership and the unique primary backbone influence physics", () => {
    const roleArtifact = {
      ...artifact,
      edges: artifact.edges.map((edge, index) => index === 0
        ? { ...edge, layout_role: "primary-backbone" as const }
        : index === 1
          ? { ...edge, layout_role: "secondary-backbone" as const }
          : edge),
    };
    const model = buildOntologyCommunityNetworkModel(index, roleArtifact, "en", "dark");

    expect(model.edges[0].physics).toBe(true);
    expect(model.edges[1].physics).toBe(false);
    expect(model.edges[2].physics).toBe(false);
    expect(model.edges[3].physics).toBe(true);
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

    const ownedCommunities = fullArtifact.communities.filter(
      ({ owner_module_id: ownerModuleId }) => ownerModuleId !== null,
    );
    const sourceCommunity = ownedCommunities.find(({ member_refs: memberRefs }) =>
      memberRefs.some((ref) => ref.startsWith("concept:")),
    )!;
    const targetCommunity = ownedCommunities.find(({ id }) => id !== sourceCommunity.id)!;
    const movedRef = sourceCommunity.member_refs.find((ref) => ref.startsWith("concept:"))!;
    const reassignedArtifact = {
      ...fullArtifact,
      communities: fullArtifact.communities.map((community) => {
        if (community.id === sourceCommunity.id) {
          const memberRefs = community.member_refs.filter((ref) => ref !== movedRef);
          return { ...community, member_refs: memberRefs, member_count: memberRefs.length };
        }
        if (community.id === targetCommunity.id) {
          const memberRefs = [...community.member_refs, movedRef];
          return { ...community, member_refs: memberRefs, member_count: memberRefs.length };
        }
        return community;
      }),
      nodes: fullArtifact.nodes.map((node) => node.ref === movedRef
        ? { ...node, community_id: targetCommunity.id }
        : node),
    };
    expect(validateOntologyCommunityGraph(index, reassignedArtifact)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("members do not match canonical Module ownership"),
      ]),
    );
  });

  it("rejects hostile artifact collections before traversing them", () => {
    const limits = ONTOLOGY_COMMUNITY_GRAPH_LIMITS;
    const oversizedArtifacts: ReadonlyArray<readonly [string, OntologyCommunityGraphArtifact]> = [
      [
        `nodes exceed the ${limits.nodes} item limit`,
        {
          ...fullArtifact,
          nodes: new Array(limits.nodes + 1).fill(fullArtifact.nodes[0]),
        },
      ],
      [
        `edges exceed the ${limits.edges} item limit`,
        {
          ...fullArtifact,
          edges: new Array(limits.edges + 1).fill(fullArtifact.edges[0]),
        },
      ],
      [
        `communities exceed the ${limits.communities} item limit`,
        {
          ...fullArtifact,
          communities: new Array(limits.communities + 1).fill(fullArtifact.communities[0]),
        },
      ],
      [
        `community 0 member_refs exceed the ${limits.memberRefsPerCommunity} item limit`,
        {
          ...fullArtifact,
          communities: [
            {
              ...fullArtifact.communities[0],
              member_refs: new Array(limits.memberRefsPerCommunity + 1).fill(index.rootRef),
            },
          ],
        },
      ],
      [
        `community member_refs exceed the aggregate ${limits.totalMemberRefs} item limit`,
        {
          ...fullArtifact,
          communities: fullArtifact.communities.slice(0, 2).map((community) => ({
            ...community,
            member_refs: new Array(Math.floor(limits.totalMemberRefs / 2) + 1)
              .fill(index.rootRef),
          })),
        },
      ],
    ];

    for (const [expectedError, oversizedArtifact] of oversizedArtifacts) {
      expect(validateOntologyCommunityGraph(index, oversizedArtifact)).toEqual([expectedError]);
    }
  });

  it("caps hostile validation error floods and reports truncation", () => {
    const limits = ONTOLOGY_COMMUNITY_GRAPH_LIMITS;
    const hostileArtifact = {
      ...fullArtifact,
      metrics: { ...fullArtifact.metrics, node_count: limits.nodes },
      nodes: Array.from({ length: limits.nodes }, (_, position) => ({
        ref: `concept:hostile-${position}` as const,
        community_id: 0,
        degree: 0,
      })),
    };

    const errors = validateOntologyCommunityGraph(index, hostileArtifact);

    expect(errors).toHaveLength(limits.validationErrors);
    expect(errors[0]).toBe("unknown node: concept:hostile-0");
    expect(errors.at(-1)).toMatch(
      /^validation error report truncated; \d+ additional errors omitted$/u,
    );
  });
});
