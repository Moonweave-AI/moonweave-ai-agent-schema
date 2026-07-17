import { expect, test } from "@playwright/test";

test.describe("ontology directory reading space", () => {
  test("keeps a human-usable hierarchy viewport instead of a narrow strip", async ({
    page,
  }) => {
    await page.goto("/");

    const directoryPanel = page.locator(".directory-panel");
    const directoryTree = page.locator(".directory-tree");
    const rootRow = directoryTree
      .locator('[data-directory-depth="0"]')
      .first()
      .locator(":scope > .tree-row");

    await expect(directoryPanel).toBeVisible();
    await expect(directoryTree).toBeVisible();
    await expect(rootRow).toBeVisible();

    const panelBounds = await directoryPanel.boundingBox();
    const treeBounds = await directoryTree.boundingBox();
    const rootBounds = await rootRow.boundingBox();

    expect(panelBounds).not.toBeNull();
    expect(treeBounds).not.toBeNull();
    expect(rootBounds).not.toBeNull();

    // The hierarchy is the sidebar's primary reading surface. Titles, search,
    // and statistics must not squeeze it into the roughly 100px strip that
    // triggered the regression report.
    expect(treeBounds!.height).toBeGreaterThanOrEqual(320);
    expect(treeBounds!.width).toBeGreaterThanOrEqual(240);
    expect(rootBounds!.height).toBeGreaterThanOrEqual(44);
  });

  test("keeps the complete hierarchy inside a 720px desktop viewport", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 1181,
      "The stacked mobile layout is covered by the shared viewport test.",
    );
    await page.setViewportSize({ width: 1440, height: 720 });
    await page.goto("/");

    const panelBounds = await page.locator(".directory-panel").boundingBox();
    const contentBounds = await page.locator(".directory-content").boundingBox();
    const treeBounds = await page.locator(".directory-tree").boundingBox();
    expect(panelBounds).not.toBeNull();
    expect(contentBounds).not.toBeNull();
    expect(treeBounds).not.toBeNull();
    expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(721);
    expect(contentBounds!.y + contentBounds!.height).toBeLessThanOrEqual(721);
    expect(treeBounds!.y + treeBounds!.height).toBeLessThanOrEqual(721);
    expect(treeBounds!.height).toBeGreaterThanOrEqual(230);
  });

  test("keeps the full directory reading region inside a 600px desktop viewport", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 1181,
      "The stacked mobile layout is covered by the shared viewport test.",
    );
    await page.setViewportSize({ width: 1440, height: 600 });
    await page.goto("/");

    const panelBounds = await page.locator(".directory-panel").boundingBox();
    const contentBounds = await page.locator(".directory-content").boundingBox();
    const treeBounds = await page.locator(".directory-tree").boundingBox();
    expect(panelBounds).not.toBeNull();
    expect(contentBounds).not.toBeNull();
    expect(treeBounds).not.toBeNull();

    const panelBottom = panelBounds!.y + panelBounds!.height;
    const contentBottom = contentBounds!.y + contentBounds!.height;
    expect(panelBottom).toBeLessThanOrEqual(601);
    expect(contentBottom).toBeLessThanOrEqual(panelBottom + 1);
    expect(treeBounds!.height).toBeGreaterThanOrEqual(180);
    await expect(
      page.locator('[data-directory-depth="0"]').first().locator(":scope > .tree-row"),
    ).toBeInViewport();
  });

  test("keeps the directory sticky while the long detail document scrolls", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) < 1181,
      "The stacked mobile directory intentionally scrolls with the document.",
    );
    await page.setViewportSize({ width: 1440, height: 720 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(499);

    const panelBounds = await page.locator(".directory-panel").boundingBox();
    expect(panelBounds).not.toBeNull();
    expect(panelBounds!.y).toBeGreaterThanOrEqual(23);
    expect(panelBounds!.y).toBeLessThanOrEqual(25);
    expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(721);
  });

  test("keeps hierarchy controls and long labels accessible", async ({ page }) => {
    await page.goto("/");

    const rootItem = page.locator('[data-directory-ref="root:agent-system-ontology"]');
    const panelToggle = page.locator(".panel-control > button");
    const rootToggle = rootItem.locator(":scope > .tree-row > .tree-toggle");
    const rootButton = rootItem.locator(":scope > .tree-row > .tree-button");
    await expect(rootItem).not.toHaveAttribute("role", "treeitem");
    await expect(rootItem).not.toHaveAttribute("aria-expanded", /.+/u);
    await expect(rootToggle).toHaveAttribute("aria-expanded", "true");
    await expect(rootButton).toHaveAttribute("aria-current", "page");
    await expect(rootToggle).toHaveAccessibleName(/Collapse.*Agent System Ontology/u);
    await rootToggle.focus();
    await expect(rootToggle).toBeFocused();

    const panelToggleBounds = await panelToggle.boundingBox();
    const toggleBounds = await rootToggle.boundingBox();
    const rootButtonBounds = await rootButton.boundingBox();
    expect(panelToggleBounds).not.toBeNull();
    expect(toggleBounds).not.toBeNull();
    expect(rootButtonBounds).not.toBeNull();
    expect(panelToggleBounds!.height).toBeGreaterThanOrEqual(44);
    expect(toggleBounds!.width).toBeGreaterThanOrEqual(24);
    expect(toggleBounds!.height).toBeGreaterThanOrEqual(44);
    expect(rootButtonBounds!.height).toBeGreaterThanOrEqual(44);

    await page.locator("#ontology-search").fill("disclosure publication");
    const result = page
      .locator('[data-directory-ref="concept:DisclosurePublicationActivity"]')
      .getByRole("button", { name: /disclosure publication activity.*Concept/u });
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("title", "disclosure publication activity");
    expect(await result.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  });

  test("keeps the directory complete and stacked on mobile", async ({ page }) => {
    test.skip(
      (page.viewportSize()?.width ?? Number.POSITIVE_INFINITY) > 820,
      "This regression assertion targets the stacked mobile layout.",
    );
    await page.goto("/");

    const directoryPanel = page.locator(".directory-panel");
    const directoryTree = page.locator(".directory-tree");
    const statistics = page.getByTestId("left-statistics");
    const contentPanel = page.locator(".content-panel");

    await expect(directoryPanel).toBeVisible();
    await expect(directoryTree).toBeVisible();
    await expect(statistics).toBeVisible();
    await expect(contentPanel).toBeVisible();

    const panelBounds = await directoryPanel.boundingBox();
    const treeBounds = await directoryTree.boundingBox();
    const statisticsBounds = await statistics.boundingBox();
    const contentBounds = await contentPanel.boundingBox();

    expect(panelBounds).not.toBeNull();
    expect(treeBounds).not.toBeNull();
    expect(statisticsBounds).not.toBeNull();
    expect(contentBounds).not.toBeNull();
    expect(treeBounds!.height).toBeGreaterThanOrEqual(320);
    const panelBottom = panelBounds!.y + panelBounds!.height;
    const statisticsBottom = statisticsBounds!.y + statisticsBounds!.height;
    expect(statisticsBottom).toBeLessThanOrEqual(panelBottom + 8);
    expect(contentBounds!.y).toBeGreaterThanOrEqual(panelBottom);
  });
});
