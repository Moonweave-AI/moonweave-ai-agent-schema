import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = (relativePath: string): string => readFileSync(
  resolve(import.meta.dirname, "..", relativePath),
  "utf8",
);

describe("Graphify full-graph browser performance contract", () => {
  it("uses one browser worker so concurrent pages cannot distort the timing gate", () => {
    const config = source("playwright.config.ts");

    expect(config).toMatch(/workers:\s*1/u);
    expect(config).not.toContain("workers: process.env.CI ? 1 : undefined");
  });

  it("requires the complete generated graph and exactly one live canvas", () => {
    const fixture = source("e2e/helpers/graphify-ontology-fixture.ts");

    expect(fixture).toContain("nodes: 753");
    expect(fixture).toContain("edges: 1_300");
    expect(fixture).toContain("communities: 36");
    expect(fixture).toMatch(/data-layout-engine[\s\S]*vis-network-forceatlas2/u);
    expect(fixture).toMatch(/data-physics-enabled[\s\S]*false/u);
    expect(fixture).toContain('graph.locator("canvas")).toHaveCount(1)');
  });

  it("times initial stabilization and verifies that the frozen canvas stops moving", () => {
    const spec = source("e2e/ontology-explorer-dense-performance.spec.ts");

    expect(spec).toContain("stabilizationDuration");
    expect(spec).toContain("toBeLessThan(45_000)");
    expect(spec).toContain("canvasSnapshot");
    expect(spec).toContain("page.waitForTimeout(750)");
    expect(spec).toContain("expect(secondFrame).toBe(firstFrame)");
  });

  it("runs the expensive full-graph timing gate only once on desktop Chromium", () => {
    const spec = source("e2e/ontology-explorer-dense-performance.spec.ts");

    expect(spec).toContain('testInfo.project.name !== "chromium"');
    expect(spec).toContain("The full-graph timing gate runs once on desktop Chromium");
    expect(spec).not.toMatch(/relations-mode|hierarchy|fCoSE|ELK|Cytoscape/iu);
  });
});
