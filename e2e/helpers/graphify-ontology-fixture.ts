import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, type Locator, type Page } from "@playwright/test";

interface GeneratedCommunityGraphMetrics {
  readonly metrics: {
    readonly node_count: number;
    readonly edge_count: number;
    readonly community_count: number;
  };
}

const communityGraph = JSON.parse(readFileSync(resolve(
  import.meta.dirname,
  "../../src/generated/ontology-community-graph.json",
), "utf8")) as GeneratedCommunityGraphMetrics;

export const FULL_GRAPH_METRICS = Object.freeze({
  nodes: communityGraph.metrics.node_count,
  edges: communityGraph.metrics.edge_count,
  communities: communityGraph.metrics.community_count,
});

export const ontologyNetwork = (page: Page): Locator =>
  page.getByTestId("ontology-network-graph");

export const waitForGraphStable = async (page: Page): Promise<Locator> => {
  const graph = ontologyNetwork(page);
  await expect(graph).toBeVisible({ timeout: 60_000 });
  await expect(graph).toHaveAttribute(
    "data-layout-engine",
    "vis-network-forceatlas2",
  );
  await expect(graph).toHaveAttribute("data-layout-status", "stable", {
    timeout: 60_000,
  });
  await expect(graph).toHaveAttribute("data-physics-enabled", "false");
  await expect(graph.locator("canvas")).toHaveCount(1);
  return graph;
};

export const expectFullGraphMetrics = async (graph: Locator): Promise<void> => {
  await expect(graph).toHaveAttribute(
    "data-node-count",
    String(FULL_GRAPH_METRICS.nodes),
  );
  await expect(graph).toHaveAttribute(
    "data-edge-count",
    String(FULL_GRAPH_METRICS.edges),
  );
  await expect(graph).toHaveAttribute(
    "data-community-count",
    String(FULL_GRAPH_METRICS.communities),
  );
};

export const switchToEnglish = async (page: Page): Promise<void> => {
  await page.getByTestId("language-en").click();
  await expect(page.getByTestId("language-en")).toHaveAttribute("aria-pressed", "true");
};

export const canvasSnapshot = async (graph: Locator): Promise<string> =>
  graph.locator("canvas").evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL("image/png"),
  );
