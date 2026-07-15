import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = (relativePath: string): string => readFileSync(
  resolve(import.meta.dirname, "..", relativePath),
  "utf8",
);

describe("Graphify ontology explorer E2E interaction contract", () => {
  it("uses search and the unified detail panel as the keyboard-safe canvas path", () => {
    const spec = source("e2e/ontology-explorer.spec.ts");

    expect(spec).toContain('getByTestId("graph-node-search")');
    expect(spec).toContain('getByRole("option")');
    expect(spec).toContain('getByTestId("ontology-characteristics")');
    expect(spec).toContain("focus=node");
  });

  it("filters only the visual community projection and keeps canonical identity stable", () => {
    const spec = source("e2e/ontology-explorer-core.spec.ts");

    expect(spec).toContain('getAttribute("data-source-sha256")');
    expect(spec).toContain("checkbox.uncheck()");
    expect(spec).toContain("checkbox.check()");
    expect(spec).toContain("expectFullGraphMetrics(graph)");
    expect(spec).toContain('data-physics-enabled", "false"');
  });

  it("updates language and theme without reflow but tests an explicit reflow transition", () => {
    const spec = source("e2e/ontology-explorer.spec.ts");

    expect(spec).toContain("updates language and theme in place without re-running");
    expect(spec).toContain('getByRole("button", { name: "Reflow"');
    expect(spec).toContain('data-layout-status", "stabilizing"');
    expect(spec).toContain('data-layout-status", "stable"');
  });

  it("runs the full-graph timing and frozen-frame gate once on desktop Chromium", () => {
    const spec = source("e2e/ontology-explorer-dense-performance.spec.ts");

    expect(spec.match(/test\.slow\(\)/gu)).toHaveLength(1);
    expect(spec.match(/test\.skip\(testInfo\.project\.name !== "chromium"/gu)).toHaveLength(1);
    expect(spec).toContain("canvasSnapshot");
    expect(spec).toContain("expect(secondFrame).toBe(firstFrame)");
    expect(spec).not.toMatch(/120-node|relations-mode|hierarchy|fCoSE|ELK|Cytoscape/iu);
  });
});
