import { expect, test } from "@playwright/test";

import {
  expectFullGraphMetrics,
  FULL_GRAPH_METRICS,
  switchToEnglish,
  waitForGraphStable,
} from "./helpers/graphify-ontology-fixture";

test.describe("Moonweave Graphify ontology explorer core", () => {
  test("renders one complete community graph and freezes physics after stabilization", async ({ page }) => {
    test.slow();
    await page.goto("/");

    const graph = await waitForGraphStable(page);
    await expectFullGraphMetrics(graph);
    await expect(graph).toHaveAttribute(
      "data-community-engine",
      "canonical-module-anchors",
    );
    await expect(graph).toHaveAttribute(
      "data-community-assignment-policy",
      "canonical-module-owner",
    );
    await expect(graph).toHaveAttribute(
      "data-community-diagnostic-engine",
      "none",
    );
    await expect(graph).toHaveAttribute("data-community-seed", "42");
    await expect(graph).toHaveAttribute("data-node-color-policy", "canonical-module-owner");
    await expect(graph).toHaveAttribute("data-node-size-policy", "degree-linear-10-40");
    await expect(graph).toHaveAttribute("data-edge-label-policy", "hover-only");
    await expect(graph).toHaveAttribute("data-source-sha256", /^[a-f0-9]{64}$/u);
    await expect(graph).toHaveAttribute("data-projection-sha256", /^[a-f0-9]{64}$/u);

    await expect(page.getByTestId("graph-count")).toContainText(
      `${FULL_GRAPH_METRICS.nodes} nodes`,
    );
    await expect(page.getByTestId("graph-count")).toContainText(
      `${FULL_GRAPH_METRICS.edges} edges`,
    );
    await expect(page.locator(".ontology-community-legend input[type=checkbox]")).toHaveCount(
      FULL_GRAPH_METRICS.communities,
    );
    await expect(page.locator(".ontology-network-stage canvas")).toHaveCount(1);
  });

  test("filters a canonical Module community without changing the canonical graph artifact", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    const sourceHash = await graph.getAttribute("data-source-sha256");
    const firstCommunity = page.locator(".ontology-community-legend li")
      .filter({ has: page.locator('input[type="checkbox"]:not(:disabled)') })
      .first();
    const checkbox = firstCommunity.getByRole("checkbox");
    const memberCount = Number(await firstCommunity.locator("small").textContent());

    expect(memberCount).toBeGreaterThan(0);
    await checkbox.uncheck();
    await expect(graph).toHaveAttribute(
      "data-node-count",
      String(FULL_GRAPH_METRICS.nodes - memberCount),
    );
    expect(Number(await graph.getAttribute("data-edge-count"))).toBeLessThan(
      FULL_GRAPH_METRICS.edges,
    );
    await expect(graph).toHaveAttribute("data-layout-status", "stable");
    await expect(graph).toHaveAttribute("data-physics-enabled", "false");
    await expect(graph).toHaveAttribute("data-source-sha256", sourceHash!);

    await checkbox.check();
    await expectFullGraphMetrics(graph);
  });

  test("keeps the graph usable in both desktop and mobile projects", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    const bounds = await graph.boundingBox();

    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThan(280);
    expect(bounds!.height).toBeGreaterThan(480);
    await switchToEnglish(page);
    await expect(graph).toHaveAttribute(
      "aria-label",
      /colored by canonical Module ownership/i,
    );
    await expect(page.getByTestId("graph-node-search")).toBeVisible();
    const stageBounds = await page.locator(".ontology-network-stage").boundingBox();
    const legend = page.locator(".ontology-community-legend");
    const legendBounds = await legend.boundingBox();
    await expect(legend).toBeVisible();
    expect(stageBounds).not.toBeNull();
    expect(legendBounds).not.toBeNull();
    expect(legendBounds!.x).toBeGreaterThanOrEqual(stageBounds!.x);
    expect(legendBounds!.y).toBeGreaterThanOrEqual(stageBounds!.y);
    expect(legendBounds!.x + legendBounds!.width).toBeLessThanOrEqual(
      stageBounds!.x + stageBounds!.width,
    );
    expect(legendBounds!.y + legendBounds!.height).toBeLessThanOrEqual(
      stageBounds!.y + stageBounds!.height,
    );
  });

  test("captures the stabilized Graphify visual baseline", async ({ page }) => {
    test.skip(
      process.env.MOONWEAVE_VISUAL_BASELINE !== "1",
      "Visual baselines are updated only by the explicit capture command.",
    );
    test.slow();
    await page.goto("/");
    await waitForGraphStable(page);

    await expect(page.getByTestId("ontology-canvas")).toHaveScreenshot(
      "graphify-community-graph.png",
      { animations: "disabled", caret: "hide" },
    );
  });
});
