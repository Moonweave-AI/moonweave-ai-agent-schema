import { expect, test } from "@playwright/test";

import {
  switchToEnglish,
  waitForGraphStable,
} from "./helpers/graphify-ontology-fixture";

test.describe("ontology community graph accessibility", () => {
  test("provides keyboard-operable search and native community controls beside the canvas", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    await switchToEnglish(page);

    await expect(graph).toHaveRole("region");
    await expect(graph).toHaveAttribute(
      "aria-label",
      /node colors indicate canonical Module ownership/i,
    );
    const search = page.getByTestId("graph-node-search");
    await search.focus();
    await search.fill("Tool");
    const result = page.locator(".ontology-network-search-results button")
      .filter({ hasText: /^Tool/u }).first();
    await expect(result).toBeVisible();
    await result.focus();
    await result.press("Enter");
    await expect(page.locator(".entity-hero h2")).toHaveText("Tool");

    const communities = page.locator(".ontology-community-legend");
    await expect(communities).toHaveAttribute("aria-label", "Canonical Module communities");
    // Tool belongs to the first community; the focused node deliberately keeps
    // its own community visible, so exercise another native checkbox.
    const focusedCommunity = communities.getByRole("checkbox", { disabled: true });
    await expect(focusedCommunity).toHaveCount(1);
    const otherCommunity = communities.locator('input[type="checkbox"]:not(:disabled)').first();
    await otherCommunity.focus();
    await otherCommunity.press("Space");
    await expect(otherCommunity).not.toBeChecked();
    await otherCommunity.press("Space");
    await expect(otherCommunity).toBeChecked();
  });

  test("keeps reduced-motion focus transitions functional", async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const graph = await waitForGraphStable(page);
    await switchToEnglish(page);

    await page.getByTestId("graph-node-search").fill("Tool");
    await page.locator(".ontology-network-search-results button")
      .filter({ hasText: /^Tool/u }).first().click();
    await expect(page.locator(".entity-hero h2")).toHaveText("Tool");
    await expect(graph).toHaveAttribute("data-layout-status", "stable");
    await expect(graph).toHaveAttribute("data-physics-enabled", "false");
  });
});
