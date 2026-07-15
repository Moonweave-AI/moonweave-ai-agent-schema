import { expect, type Locator, type Page } from "@playwright/test";

export const FULL_GRAPH_METRICS = Object.freeze({
  nodes: 753,
  edges: 1_300,
  communities: 36,
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
