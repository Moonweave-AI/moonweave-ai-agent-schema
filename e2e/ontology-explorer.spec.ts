import { expect, test } from "@playwright/test";

test.describe("Moonweave ontology explorer", () => {
  test("renders a non-empty ontology graph and inspector", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "本体查看器" })).toBeVisible();
    await expect(page.getByTestId("ontology-canvas")).toBeVisible();
    await expect(page.getByTestId("cytoscape-graph")).toBeVisible();
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-layout-engine", "fcose-force");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-hover-relations", "predecessor");

    const nodeCount = Number(await page.getByTestId("graph-count").getAttribute("data-node-count"));
    expect(nodeCount).toBeGreaterThan(0);

    await expect(page.getByTestId("left-statistics")).toContainText("本体统计");
    await expect(page.getByTestId("left-statistics")).toContainText("413");
    await expect(page.getByTestId("inspector-panel")).toHaveCount(0);
  });

  test("keeps language and theme controls global without redundant filter tabs", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".viewer-nav")).toHaveCount(0);
    await expect(page.locator(".filter-group")).toHaveCount(0);
    await expect(page.locator(".viewer-header").getByRole("button", { name: "全部" })).toHaveCount(0);
    await expect(page.locator(".viewer-header").getByRole("button", { name: "领域" })).toHaveCount(0);
    await expect(page.locator(".viewer-header").getByRole("button", { name: "适配器" })).toHaveCount(0);
    await expect(page.locator(".viewer-header").getByRole("button", { name: "信任" })).toHaveCount(0);

    await page.getByTestId("language-en").click();
    await expect(page.getByRole("heading", { name: "Ontology Viewer" })).toBeVisible();

    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByTestId("language-zh").click();
    await expect(page.getByRole("heading", { name: "本体查看器" })).toBeVisible();
  });

  test("keeps text inside the workbench at mobile widths", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole("heading", { name: "本体查看器" })).toBeVisible();
    await expect(page.getByTestId("ontology-canvas")).toBeVisible();

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
  });

  test("shows concrete localized module definitions instead of generic placeholders", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.getByRole("button", { name: "安全平面 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();

    await expect(page.getByRole("heading", { name: "信任边界模块" })).toBeVisible();
    await expect(page.locator(".entity-hero")).toContainText("权限范围");
    await expect(page.locator(".entity-hero")).toContainText("数据区域");
    await expect(page.locator(".entity-hero")).toContainText("边界跨越");
    await expect(page.locator(".entity-hero")).not.toContainText("定义该平面内部的一组相关类、关系和约束");
  });

  test("uses a FIBO-like single-column ontology characteristic table", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.getByRole("button", { name: "安全平面 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();

    await expect(page.getByTestId("ontology-characteristics")).toBeVisible();
    await expect(page.getByTestId("ontology-characteristics")).toContainText("本体特征");
    await expect(page.getByTestId("ontology-characteristics")).toContainText("包含类");
    await expect(page.getByTestId("ontology-characteristics")).toContainText("权限范围");
    await expect(page.locator(".catalog-section")).toHaveCount(0);
  });

  test("shows concept-specific localized class explanations instead of class templates", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.getByRole("button", { name: "安全平面 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();
    await page.getByRole("button", { name: /权限范围/ }).click();

    await expect(page.getByRole("heading", { name: "权限范围" })).toBeVisible();
    await expect(page.locator(".entity-hero")).toContainText("访问");
    await expect(page.locator(".entity-hero")).toContainText("授权");
    await expect(page.locator(".entity-hero")).not.toContainText("表示资源类，位于信任边界模块，用于建模");
  });
});
