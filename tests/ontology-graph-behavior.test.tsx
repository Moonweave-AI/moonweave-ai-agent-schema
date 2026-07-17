import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { OntologyGraph } from "../src/components/OntologyGraph";
import { buildOntologyIndex } from "../src/lib/ontology-index";
import { buildCommunityGraphFixture } from "./fixtures/ontology-community-graph.fixture";
import {
  fixtureRefs,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";

const index = buildOntologyIndex(
  ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
);
const communityGraph = buildCommunityGraphFixture(index);

const renderGraph = (overrides: Partial<Parameters<typeof OntologyGraph>[0]> = {}): string =>
  renderToStaticMarkup(
    <OntologyGraph
      index={index}
      language="en"
      theme="dark"
      canonicalFingerprint={`sha256:${communityGraph.source_sha256}`}
      focusedEntityRef={fixtureRefs.agentRun}
      focusedRelationId={null}
      onFocusEntity={vi.fn()}
      onFocusRelation={vi.fn()}
      communityGraph={communityGraph}
      {...overrides}
    />,
  );

describe("OntologyGraph Graphify presentation contract", () => {
  it("renders one community-colored ForceAtlas2 graph without hierarchy directions", () => {
    const html = renderGraph();

    expect((html.match(/data-testid="ontology-network-graph"/gu) ?? [])).toHaveLength(1);
    expect(html).toContain('data-layout-engine="vis-network-forceatlas2"');
    expect(html).toContain('data-node-color-policy="canonical-module-owner"');
    expect(html).toContain('data-node-size-policy="degree-linear-10-40"');
    expect(html).toContain('data-edge-label-policy="hover-only"');
    expect(html).not.toMatch(/hierarchy|relations mode|top.?down|left.?right/iu);
    expect(html).not.toContain("cytoscape-graph");
  });

  it("provides search and structural-community filters as the keyboard path for the canvas", () => {
    const html = renderGraph();
    const source = readFileSync(
      new URL("../src/components/OntologyGraph.tsx", import.meta.url),
      "utf8",
    );

    expect(html).toContain('data-testid="graph-node-search"');
    expect(html).toContain("Use search to focus a node or the directory");
    expect(html).toContain("Canonical Module communities");
    expect((html.match(/type="checkbox"/gu) ?? [])).toHaveLength(
      communityGraph.communities.length,
    );
    expect(html).not.toContain("graph-keyboard-controls");
    expect(source).toContain('htmlFor="ontology-network-search-input"');
    expect(source).toContain('<ul className="ontology-network-search-results">');
    expect(source).not.toMatch(/role="(?:listbox|option)"/u);
  });

  it("localizes the visible node and edge count", () => {
    const graphCount = (language: "zh" | "en" | "ja"): string =>
      renderGraph({ language }).match(
        /data-testid="graph-count">([\s\S]*?)<\/div>/u,
      )?.[1] ?? "";
    const zh = graphCount("zh");
    const en = graphCount("en");
    const ja = graphCount("ja");

    expect(zh).toContain("节点");
    expect(zh).toContain("关系");
    expect(zh).not.toMatch(/\bnodes?\b|\bedges?\b/iu);
    expect(en).toContain("nodes");
    expect(en).toContain("edges");
    expect(ja).toContain("ノード");
    expect(ja).toContain("関係");
    expect(ja).not.toMatch(/\bnodes?\b|\bedges?\b/iu);
  });

  it("does not create schema, example, source, or field nodes", () => {
    const html = renderGraph();
    const nodeCount = Number(html.match(/data-node-count="(\d+)"/u)?.[1]);

    expect(nodeCount).toBe(communityGraph.metrics.node_count);
    expect(html).not.toMatch(/abox-|tbox-|schema-node|example-node|source-claim-node/iu);
  });

  it("fails closed when the generated community projection is stale", () => {
    const html = renderGraph({
      communityGraph: {
        ...communityGraph,
        metrics: { ...communityGraph.metrics, node_count: 99 },
      },
    });

    expect(html).toContain('data-testid="community-graph-invalid"');
    expect(html).toContain("node_count 99");
    expect(html).not.toContain('data-testid="ontology-network-graph"');
  });
});
