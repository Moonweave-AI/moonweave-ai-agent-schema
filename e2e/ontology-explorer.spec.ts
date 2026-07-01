import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const canonicalOntology = JSON.parse(readFileSync(new URL("../ontology/agent-ontology.json", import.meta.url), "utf8"));
const trustBoundaryModule = canonicalOntology.modules.find((item: { id: string }) => item.id === "safety-trust-boundary");
const authorityScopeClass = canonicalOntology.classes.find((item: { id: string }) => item.id === "AuthorityScope");

test.describe("Moonweave ontology explorer", () => {
  test("renders a non-empty ontology graph and inspector", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "本体查看器" })).toBeVisible();
    await expect(page.getByTestId("ontology-canvas")).toBeVisible();
    await expect(page.getByTestId("cytoscape-graph")).toBeVisible();
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-layout-engine", "fcose-force");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-hover-relations", "predecessor");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-drag-layout", "continuous-local-force");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-crossing-policy", "label-collision-and-crossing-relaxation");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-pan-during-drag", "locked");

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

  test("keeps the domain directory floating while browsing the ontology", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    const directory = page.locator(".directory-panel");
    await expect(directory).toBeVisible();
    await expect(directory).toHaveCSS("position", "sticky");
    await expect(directory).toHaveCSS("z-index", "8");
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

    await page.getByRole("button", { name: "信任、策略与安全域 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();

    await expect(page.getByRole("heading", { name: "信任边界模块" })).toBeVisible();
    await expect(page.locator(".entity-hero")).toContainText(trustBoundaryModule.definitions.zh);
    await expect(page.locator(".entity-hero")).not.toContainText("定义该平面内部的一组相关类、关系和约束");
  });

  test("reads multilingual entity definitions from canonical ontology JSON", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.getByTestId("language-en").click();
    await page.locator("#ontology-search").fill("AuthorityScope");
    await page.getByRole("button", { name: "authority scope Class", exact: true }).click();
    await expect(page.locator(".entity-hero")).toContainText(authorityScopeClass.definitions.en);

    await page.getByTestId("language-zh").click();
    await expect(page.locator(".entity-hero")).toContainText(authorityScopeClass.definitions.zh);

    await page.getByTestId("language-ja").click();
    await expect(page.locator(".entity-hero")).toContainText(authorityScopeClass.definitions.ja);
  });

  test("uses a FIBO-like single-column ontology characteristic table", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.getByRole("button", { name: "信任、策略与安全域 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();

    await expect(page.getByTestId("ontology-characteristics")).toBeVisible();
    await expect(page.getByTestId("ontology-characteristics")).toContainText("本体特征");
    await expect(page.getByTestId("ontology-characteristics")).toContainText("包含类");
    await expect(page.getByTestId("ontology-characteristics")).toContainText("权限范围");
    await expect(page.locator(".catalog-section")).toHaveCount(0);
  });

  test("hides the graph surface when the selected ontology node has no visible relations", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.locator("#ontology-search").fill("ContextExclusion");
    await page.getByRole("button", { name: /上下文排除|context exclusion/i }).click();

    await expect(page.getByTestId("ontology-canvas")).toHaveCount(0);
    await expect(page.getByTestId("graph-empty-state")).toBeVisible();
    await expect(page.getByTestId("graph-empty-state")).toContainText(/没有可展示的下一级节点或关系|No visible child nodes or relations/i);
  });

  test("shows concept-specific localized class explanations instead of class templates", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 1360, height: 900 });

    await page.getByRole("button", { name: "信任、策略与安全域 平面" }).click();
    await page.getByRole("button", { name: "信任边界模块 模块" }).click();
    await page.getByRole("button", { name: /权限范围/ }).click();

    await expect(page.getByRole("heading", { name: "权限范围" })).toBeVisible();
    await expect(page.locator(".entity-hero")).toContainText("访问");
    await expect(page.locator(".entity-hero")).toContainText("授权");
    await expect(page.locator(".entity-hero")).not.toContainText("表示资源类，位于信任边界模块，用于建模");
  });
});
