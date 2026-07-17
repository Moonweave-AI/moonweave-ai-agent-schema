import { expect, test } from "@playwright/test";

import {
  expectFullGraphMetrics,
  switchToEnglish,
  waitForGraphStable,
} from "./helpers/graphify-ontology-fixture";

test.describe("Moonweave Graphify ontology explorer interactions", () => {
  test("focuses a node through search and keeps its explanation in the unified page", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    await switchToEnglish(page);

    const search = page.getByTestId("graph-node-search");
    await search.fill("Tool");
    const toolResult = page.getByRole("option").filter({ hasText: /^Tool/u }).first();
    await expect(toolResult).toBeVisible();
    await toolResult.click();

    await expect(search).toHaveValue("");
    await expect(page.locator(".entity-hero h2")).toHaveText("Tool");
    await expect(page.getByTestId("ontology-characteristics")).toBeVisible();
    await expect(page.getByTestId("ontology-characteristics").locator(":scope > table")).toBeVisible();
    await expect(page).toHaveURL(/focus=node%3ATool|focus=node:Tool/u);
    await expectFullGraphMetrics(graph);
    await expect(graph).toHaveAttribute("data-layout-status", "stable");
    await expect(graph).toHaveAttribute("data-physics-enabled", "false");
  });

  test("updates language and theme in place without re-running the force layout", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    const sourceHash = await graph.getAttribute("data-source-sha256");

    await switchToEnglish(page);
    await expect(page.getByRole("heading", { name: "Ontology relation graph" })).toBeVisible();
    await page.getByTestId("theme-light").click();
    await expect(page.getByTestId("theme-light")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.waitForTimeout(250);
    await expect(graph).toHaveAttribute("data-layout-status", "stable");
    await expect(graph).toHaveAttribute("data-physics-enabled", "false");
    await expect(graph).toHaveAttribute("data-source-sha256", sourceHash!);
    await expectFullGraphMetrics(graph);
  });

  test("offers explicit fit and reflow actions", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    await switchToEnglish(page);

    await expect(page.getByRole("button", { name: "Fit graph", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reflow", exact: true }).click();
    await expect(graph).toHaveAttribute("data-layout-status", "stabilizing");
    await expect(graph).toHaveAttribute("data-physics-enabled", "true");
    await expect(graph).toHaveAttribute("data-layout-status", "stable", { timeout: 60_000 });
    await expect(graph).toHaveAttribute("data-physics-enabled", "false");

  });
});
