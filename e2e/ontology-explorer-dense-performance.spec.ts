import { expect, test } from "@playwright/test";

import {
  canvasSnapshot,
  expectFullGraphMetrics,
  waitForGraphStable,
} from "./helpers/graphify-ontology-fixture";

test.describe("Moonweave Graphify ontology explorer performance", () => {
  test("stabilizes the complete graph once and leaves the frozen canvas stationary", async ({ page }, testInfo) => {
    test.slow();
    test.skip(testInfo.project.name !== "chromium", "The full-graph timing gate runs once on desktop Chromium.");
    const startedAt = Date.now();
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    const stabilizationDuration = Date.now() - startedAt;

    await expectFullGraphMetrics(graph);
    expect(stabilizationDuration).toBeLessThan(45_000);
    const firstFrame = await canvasSnapshot(graph);
    await page.waitForTimeout(750);
    const secondFrame = await canvasSnapshot(graph);
    expect(secondFrame).toBe(firstFrame);
    await expect(graph).toHaveAttribute("data-physics-enabled", "false");
  });
});
