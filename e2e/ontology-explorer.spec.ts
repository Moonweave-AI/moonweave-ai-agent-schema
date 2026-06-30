import { expect, test } from "@playwright/test";

test.describe("Moonweave ontology explorer", () => {
  test("renders a non-empty ontology graph and inspector", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "本体查看器" })).toBeVisible();
    await expect(page.getByTestId("ontology-canvas")).toBeVisible();
    await expect(page.getByTestId("cytoscape-graph")).toBeVisible();

    const nodeCount = Number(await page.getByTestId("graph-count").getAttribute("data-node-count"));
    expect(nodeCount).toBeGreaterThan(0);

    await expect(page.getByTestId("inspector-panel")).toContainText("本体统计");
    await expect(page.getByTestId("inspector-panel")).toContainText("413");
  });

  test("switches language and theme controls from the directory panel", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "目录" }).click();
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Ontology Viewer" })).toBeVisible();

    await page.getByRole("button", { name: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "中文" }).click();
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

    await page.getByRole("button", { name: "目录" }).click();
    await page.getByRole("button", { name: "安全平面 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();

    await expect(page.getByRole("heading", { name: "信任边界模块" })).toBeVisible();
    await expect(page.locator(".entity-hero")).toContainText("权限范围");
    await expect(page.locator(".entity-hero")).toContainText("数据区域");
    await expect(page.locator(".entity-hero")).toContainText("边界跨越");
    await expect(page.locator(".entity-hero")).not.toContainText("定义该平面内部的一组相关类、关系和约束");
  });

  test("shows concept-specific localized class explanations instead of class templates", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.getByRole("button", { name: "目录" }).click();
    await page.getByRole("button", { name: "安全平面 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();
    await page.getByRole("button", { name: /权限范围/ }).click();

    await expect(page.getByRole("heading", { name: "权限范围" })).toBeVisible();
    await expect(page.locator(".entity-hero")).toContainText("访问");
    await expect(page.locator(".entity-hero")).toContainText("授权");
    await expect(page.locator(".entity-hero")).not.toContainText("表示资源类，位于信任边界模块，用于建模");
  });
});
