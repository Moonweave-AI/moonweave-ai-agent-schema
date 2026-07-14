import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const canonical = JSON.parse(
  readFileSync(new URL("../ontology/agent-ontology.json", import.meta.url), "utf8"),
) as {
  id: string;
  labels: Record<"zh" | "en" | "ja", string>;
  definitions: Record<"zh" | "en" | "ja", string>;
  planes: Array<{ id: string; labels: Record<string, string> }>;
  modules: Array<{ id: string; plane_id: string; labels: Record<string, string> }>;
  classes: Array<{
    id: string;
    module_id: string;
    labels: Record<"zh" | "en" | "ja", string>;
    short_definitions?: Record<"zh" | "en" | "ja", string>;
    definitions: Record<"zh" | "en" | "ja", string>;
    primary_parent_relation_id: string | null;
    source_claims: Array<{ source_id: string }>;
    examples: Array<{
      kind: string;
      labels: Record<"zh" | "en" | "ja", string>;
    }>;
    structure: {
      fields: Array<{ id: string; labels: Record<"zh" | "en" | "ja", string> }>;
      constraints: Array<{ id: string }>;
    };
    external_mappings?: Array<{
      id: string;
      system: string;
      external_identifier: string;
      external_version: string;
      canonical_target_ids: string[];
      mapping_kind: string;
      scope: Record<"zh" | "en" | "ja", string>;
      direction: string;
      loss_notes: Record<"zh" | "en" | "ja", string>;
      conversion_note: Record<"zh" | "en" | "ja", string>;
      conformance: {
        status: string;
        test_id: string;
        method: Record<"zh" | "en" | "ja", string>;
      };
      status: string;
    }>;
  }>;
  relations: Array<{
    id: string;
    predicate: string;
    source_id: string;
    target_id: string;
    relation_kind: string;
  }>;
  case_paths: Array<{
    id: string;
    labels: Record<"zh" | "en" | "ja", string>;
    steps: Array<{
      order: number;
      case_fragment_example_id: string;
      traversal_relation_id: string | null;
    }>;
  }>;
  ontology_metrics: {
    source_claims: number;
  };
};

const sourceIndex = JSON.parse(
  readFileSync(new URL("../src/generated/source-index.json", import.meta.url), "utf8"),
) as { sources: Array<{ id: string; title: string }> };

const graphUrl = (rootRef: string, focus: string) =>
  `/#root=${encodeURIComponent(rootRef)}&focus=${focus}`;

const pressGraphControl = async (page: Page, selector: string) => {
  const control = page.locator(selector).first();
  await control.focus();
  await control.press("Enter");
};

const parallelPair = (() => {
  const groups = new Map<string, typeof canonical.relations>();
  for (const relation of canonical.relations) {
    if (relation.predicate === "is_a") continue;
    const key = `${relation.source_id}\u0000${relation.target_id}`;
    groups.set(key, [...(groups.get(key) ?? []), relation]);
  }
  return [...groups.values()].find((relations) => relations.length > 1) ?? [];
})();

const leafConcept = canonical.classes.find((concept) => {
  if (!concept.primary_parent_relation_id) return false;
  const parentRelation = canonical.relations.find(
    ({ id }) => id === concept.primary_parent_relation_id,
  );
  const parent = canonical.classes.find(({ id }) => id === parentRelation?.target_id);
  if (!parent || parent.module_id !== concept.module_id) return false;
  const semanticRelations = canonical.relations.filter(
    (relation) =>
      relation.predicate !== "is_a" &&
      (relation.source_id === concept.id || relation.target_id === concept.id),
  );
  const directChildren = canonical.relations.filter(
    (relation) => relation.predicate === "is_a" && relation.target_id === concept.id,
  );
  return semanticRelations.length === 0 && directChildren.length === 0;
});

const structureConcept = canonical.classes.find(
  (concept) => (concept.structure?.fields?.length ?? 0) > 0,
);
const constraintConcept = canonical.classes.find(
  (concept) => (concept.structure?.constraints?.length ?? 0) > 0,
);
const instanceConcept = canonical.classes.find((concept) =>
  concept.examples?.some(({ kind }) => kind === "instance"),
);
const sourcedConcept = canonical.classes.find(
  (concept) => (concept.source_claims?.length ?? 0) > 0,
);
const mappedConcept = canonical.classes.find(
  (concept) => (concept.external_mappings?.length ?? 0) > 0,
);

const inheritedFields = (conceptId: string) => {
  const visited = new Set<string>();
  const pending = canonical.relations
    .filter(({ predicate, source_id }) => predicate === "is_a" && source_id === conceptId)
    .map(({ target_id }) => target_id);
  const fields: Array<{ id: string; labels: Record<"zh" | "en" | "ja", string> }> = [];
  while (pending.length > 0) {
    const parentId = pending.shift()!;
    if (visited.has(parentId)) continue;
    visited.add(parentId);
    const parent = canonical.classes.find(({ id }) => id === parentId);
    if (!parent) continue;
    fields.push(...(parent.structure?.fields ?? []));
    pending.push(
      ...canonical.relations
        .filter(({ predicate, source_id }) => predicate === "is_a" && source_id === parentId)
        .map(({ target_id }) => target_id),
    );
  }
  return fields;
};

const disclosureConcept = canonical.classes.find((concept) => {
  const relationCount = canonical.relations.filter(
    ({ source_id, target_id }) => source_id === concept.id || target_id === concept.id,
  ).length;
  return Math.max(
    concept.structure?.fields?.length ?? 0,
    concept.structure?.constraints?.length ?? 0,
    concept.examples?.length ?? 0,
    concept.source_claims?.length ?? 0,
    relationCount,
  ) > 5;
});

const visualBaselineEnabled =
  process.platform === "win32" &&
  process.env.MOONWEAVE_VISUAL_BASELINE === "1";

test.describe("Moonweave unified ontology explorer", () => {
  test("renders the preserved single-page shell and exactly one canonical graph", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "本体查看器" })).toBeVisible();
    await expect(page.getByTestId("ontology-canvas")).toBeVisible();
    await expect(page.getByTestId("cytoscape-graph")).toHaveCount(1);
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-layout-engine", "fcose-force");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-layout-policy", "canonical-primary-path-rings");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-layout-invariant", "true");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-hover-relations", "incoming-and-outgoing");
    await expect(page.locator(".viewer-nav, .filter-group, .inspector-panel, .catalog-section")).toHaveCount(0);
    await expect(page.locator('a[href*="abox"],a[href*="tbox"],a[href*="schema"],a[href*="instances"]')).toHaveCount(0);
    const viewportWidth = page.viewportSize()?.width ?? 1360;
    await expect(page.locator(".directory-panel")).toHaveCSS(
      "position",
      viewportWidth > 1180 ? "sticky" : "relative",
    );
    await expect(page.getByTestId("ontology-characteristics")).toBeVisible();
    await expect(page.locator("[data-detail-row]")).toHaveCount(12);
    const sourceClaimMetric = page
      .getByTestId("left-statistics")
      .locator(".metric-stack > div")
      .filter({ hasText: "来源主张" });
    await expect(sourceClaimMetric.locator("strong")).toHaveText(
      String(canonical.ontology_metrics.source_claims),
    );

    const nodeCount = Number(await page.getByTestId("graph-count").getAttribute("data-node-count"));
    expect(nodeCount).toBe(9);
  });

  test("matches the unified-graph desktop and mobile visual baselines", async ({ page }) => {
    test.skip(
      !visualBaselineEnabled,
      "Pixel baselines are runner-specific and are reviewed on the Windows CI validation job.",
    );
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/");

    const graph = page.getByTestId("cytoscape-graph");
    await expect(graph).toHaveAttribute("data-layout-invariant", "true");
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    await expect(page).toHaveScreenshot("ontology-explorer.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
      threshold: 0.2,
    });
  });

  test("node focus keeps graph root and topology; explicit expand changes it", async ({ page }) => {
    await page.goto("/");
    const canvas = page.getByTestId("cytoscape-graph");
    const beforeRoot = await canvas.getAttribute("data-graph-root");
    const beforeNodes = await page.getByTestId("graph-count").getAttribute("data-node-count");
    const plane = canonical.planes[0];

    await pressGraphControl(page, `[data-graph-node="plane:${plane.id}"]`);
    await expect(page.getByRole("heading", { name: plane.labels.zh })).toBeVisible();
    await expect(canvas).toHaveAttribute("data-graph-root", beforeRoot!);
    await expect(page.getByTestId("graph-count")).toHaveAttribute("data-node-count", beforeNodes!);
    await expect(page).toHaveURL(new RegExp(`root=${encodeURIComponent(`root:${canonical.id}`)}.*focus=node:${plane.id}`));

    await page.getByRole("button", { name: /展开相邻节点/ }).first().click();
    const afterNodes = Number(await page.getByTestId("graph-count").getAttribute("data-node-count"));
    expect(afterNodes).toBeGreaterThan(Number(beforeNodes));
  });

  test("restores combined node and relation hash into the same graph and details table", async ({ page }) => {
    const relation = canonical.relations.find(({ predicate }) => predicate !== "is_a")!;
    await page.goto(graphUrl(`concept:${relation.source_id}`, `relation:${encodeURIComponent(relation.id)}`));

    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-graph-root", `concept:${relation.source_id}`);
    await expect(page.getByTestId("ontology-characteristics")).toContainText(relation.id);
    await page.reload();
    await expect(page.getByTestId("ontology-characteristics")).toContainText(relation.id);
    await expect(page.locator("[data-detail-row]")).toHaveCount(12);
    await page.getByRole("button", { name: /返回节点说明/ }).click();
    await expect(page.getByRole("button", { name: /返回节点说明/ })).toHaveCount(0);
    await expect(page).toHaveURL(
      new RegExp(`focus=node:${encodeURIComponent(relation.source_id)}`),
    );
  });

  test("preserves a valid graph context and reports an invalid hash focus", async ({ page }) => {
    const module = canonical.modules[0];
    await page.goto(graphUrl(`module:${module.id}`, "node:MissingConcept"));

    await expect(page.locator(".context-repair-notice")).toContainText("链接中的焦点不存在");
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute(
      "data-graph-root",
      `module:${module.id}`,
    );
    await expect(page).toHaveURL(
      new RegExp(`root=${encodeURIComponent(`module:${module.id}`)}.*focus=node:${module.id}`),
    );
  });

  test("preserves incoming direction and parallel predicates on focused canvas edges", async ({ page }) => {
    expect(parallelPair.length).toBeGreaterThan(1);
    const [first, second] = parallelPair;
    await page.goto(graphUrl(`concept:${first.source_id}`, `node:${encodeURIComponent(first.source_id)}`));

    const firstEdge = page.locator(`[data-graph-edge="${first.id}"]`);
    const secondEdge = page.locator(`[data-graph-edge="${second.id}"]`);
    await expect(firstEdge).toHaveAttribute("data-source", `concept:${first.source_id}`);
    await expect(firstEdge).toHaveAttribute("data-target", `concept:${first.target_id}`);
    await expect(firstEdge).toHaveAttribute("data-direction", "source-to-target");
    const sourceLabel = canonical.classes.find(({ id }) => id === first.source_id)?.labels.zh;
    const targetLabel = canonical.classes.find(({ id }) => id === first.target_id)?.labels.zh;
    await expect(firstEdge).toHaveAttribute(
      "aria-label",
      new RegExp(`${sourceLabel ?? first.source_id}.*${targetLabel ?? first.target_id}`),
    );
    await expect(secondEdge).toHaveAttribute("data-source", `concept:${second.source_id}`);
    await expect(secondEdge).toHaveAttribute("data-target", `concept:${second.target_id}`);

    const incoming = canonical.relations.find(
      (relation) => relation.target_id === first.source_id && relation.source_id !== first.source_id,
    );
    if (incoming) {
      await expect(page.locator(`[data-graph-edge="${incoming.id}"]`)).toHaveAttribute(
        "data-source",
        `concept:${incoming.source_id}`,
      );
    }
    await pressGraphControl(page, `[data-graph-edge="${first.id}"]`);
    await expect(page.getByTestId("ontology-characteristics")).toContainText(first.id);
  });

  test("keeps a semantic leaf connected child-to-parent while laying the parent inward", async ({ page }) => {
    expect(leafConcept).toBeTruthy();
    const concept = leafConcept!;
    const parentEdge = canonical.relations.find(({ id }) => id === concept.primary_parent_relation_id)!;
    await page.goto(graphUrl(`concept:${concept.id}`, `node:${encodeURIComponent(concept.id)}`));

    await expect(page.getByTestId("cytoscape-graph")).toBeVisible();
    const edge = page.locator(`[data-graph-edge="${parentEdge.id}"]`);
    await expect(edge).toHaveAttribute("data-source", `concept:${concept.id}`);
    await expect(edge).toHaveAttribute("data-target", `concept:${parentEdge.target_id}`);
    const childDepth = Number(await page.locator(`[data-graph-node="concept:${concept.id}"]`).getAttribute("data-layout-depth"));
    const parentDepth = Number(await page.locator(`[data-graph-node="concept:${parentEdge.target_id}"]`).getAttribute("data-layout-depth"));
    expect(parentDepth).toBeLessThan(childDepth);
  });

  test("shows structure, instances and direct source claims as information rather than graph nodes", async ({ page }) => {
    expect(structureConcept).toBeTruthy();
    await page.goto(graphUrl(`concept:${structureConcept!.id}`, `node:${encodeURIComponent(structureConcept!.id)}`));

    await expect(page.getByTestId("ontology-characteristics")).toContainText(
      structureConcept!.structure.fields[0].labels.zh,
    );
    expect(constraintConcept).toBeTruthy();
    await page.goto(graphUrl(`concept:${constraintConcept!.id}`, `node:${encodeURIComponent(constraintConcept!.id)}`));
    await expect(page.getByTestId("ontology-characteristics")).toContainText(
      constraintConcept!.structure.constraints[0].id,
    );
    expect(instanceConcept).toBeTruthy();
    await page.goto(graphUrl(`concept:${instanceConcept!.id}`, `node:${encodeURIComponent(instanceConcept!.id)}`));
    const instance = instanceConcept!.examples.find(({ kind }) => kind === "instance")!;
    await expect(page.getByTestId("ontology-characteristics")).toContainText(instance.labels.zh);
    expect(sourcedConcept).toBeTruthy();
    const source = sourceIndex.sources.find(({ id }) => id === sourcedConcept!.source_claims[0].source_id);
    await page.goto(graphUrl(`concept:${sourcedConcept!.id}`, `node:${encodeURIComponent(sourcedConcept!.id)}`));
    if (source) await expect(page.getByTestId("ontology-characteristics")).toContainText(source.title);
    await expect(page.locator('[data-graph-node^="field:"], [data-graph-node^="example:"], [data-graph-node^="source:"], [data-graph-node^="constraint:"], [data-graph-node^="case:"]')).toHaveCount(0);
    expect(disclosureConcept).toBeTruthy();
    await page.goto(graphUrl(`concept:${disclosureConcept!.id}`, `node:${encodeURIComponent(disclosureConcept!.id)}`));
    const disclosure = page.getByRole("button", { name: /展开全部/ }).first();
    await expect(disclosure).toBeVisible();
    await disclosure.click();
    await expect(page.getByRole("button", { name: "收起" }).first()).toBeVisible();
  });

  test("shows inherited fields for the real AssistantMessage and AudioBlock nodes without graph field nodes", async ({ page }) => {
    for (const conceptId of ["AssistantMessage", "AudioBlock"]) {
      const concept = canonical.classes.find(({ id }) => id === conceptId);
      expect(concept, `${conceptId} must exist in canonical`).toBeTruthy();
      const inherited = inheritedFields(conceptId);
      expect(inherited.length, `${conceptId} must inherit at least one structure field`).toBeGreaterThan(0);

      await page.goto(graphUrl(`concept:${conceptId}`, `node:${encodeURIComponent(conceptId)}`));
      const details = page.getByTestId("ontology-characteristics");
      await expect(details).toContainText("本地声明字段");
      await expect(details).toContainText("继承字段");
      await expect(details).toContainText(inherited[0].labels.zh);
      await expect(page.locator('[data-graph-node^="field:"]')).toHaveCount(0);
    }
  });

  test("discloses every structured external mapping field and all canonical targets", async ({ page }) => {
    expect(mappedConcept).toBeTruthy();
    const concept = mappedConcept!;
    const mapping = concept.external_mappings![0];
    await page.goto(graphUrl(`concept:${concept.id}`, `node:${encodeURIComponent(concept.id)}`));

    const mappingSection = page.locator('[data-disclosure-id="external-mappings"]');
    await expect(mappingSection).toContainText(mapping.external_version);
    await expect(mappingSection).toContainText(mapping.scope.zh);
    await expect(mappingSection).toContainText(mapping.direction);
    await expect(mappingSection).toContainText(mapping.mapping_kind);
    await expect(mappingSection).toContainText(mapping.loss_notes.zh);
    await expect(mappingSection).toContainText(mapping.conversion_note.zh);
    await expect(mappingSection).toContainText(mapping.conformance.status);
    await expect(mappingSection).toContainText(mapping.conformance.test_id);
    await expect(mappingSection).toContainText(mapping.conformance.method.zh);

    const targets = page.locator(`[data-disclosure-id="${mapping.id}-targets"]`);
    const expandTargets = targets.locator(".detail-disclosure-button");
    if (await expandTargets.count()) await expandTargets.click();
    for (const targetId of mapping.canonical_target_ids) {
      const target = canonical.classes.find(({ id }) => id === targetId);
      await expect(targets).toContainText(target?.labels.zh ?? targetId);
    }
  });

  test("highlights a real case path in the same graph and exposes the current step", async ({ page }) => {
    const path = canonical.case_paths.find(({ steps }) => steps.length > 0);
    expect(path).toBeTruthy();
    await page.goto("/");

    const rootCases = page.locator('[data-disclosure-id="root-case-paths"]');
    const caseArticle = rootCases.locator("article", { hasText: path!.labels.zh }).first();
    await expect(caseArticle).toBeVisible();
    await caseArticle.getByRole("button", { name: "在当前图谱中高亮此案例" }).click();
    await expect(caseArticle).toContainText("当前步骤");
    const highlightedGraphItems = page.locator(
      ".graph-keyboard-controls .case-path-highlight",
    );
    const hiddenStepNotice = page.locator(".case-next-step");
    expect((await highlightedGraphItems.count()) + (await hiddenStepNotice.count()))
      .toBeGreaterThan(0);
    await caseArticle.getByRole("button", { name: "退出案例高亮" }).click();
  });

  test("switches canonical labels and definitions across all three languages", async ({ page }) => {
    const concept = structureConcept ?? canonical.classes[0];
    await page.goto(graphUrl(`concept:${concept.id}`, `node:${encodeURIComponent(concept.id)}`));
    const heroDefinitions = concept.short_definitions ?? concept.definitions;
    await expect(page.locator(".entity-hero")).toContainText(heroDefinitions.zh);
    await page.getByTestId("language-en").click();
    await expect(page.locator(".entity-hero")).toContainText(heroDefinitions.en);
    await page.getByTestId("language-ja").click();
    await expect(page.locator(".entity-hero")).toContainText(heroDefinitions.ja);
  });

  test("supports keyboard focus, theme, mobile width and reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const plane = canonical.planes[0];
    await pressGraphControl(page, `[data-graph-node="plane:${plane.id}"]`);
    await expect(page.getByRole("heading", { name: plane.labels.zh })).toBeVisible();
    const countBeforeSpace = Number(
      await page.getByTestId("graph-count").getAttribute("data-node-count"),
    );
    const planeControl = page.locator(`[data-graph-node="plane:${plane.id}"]`);
    await planeControl.focus();
    await planeControl.press("Space");
    expect(Number(await page.getByTestId("graph-count").getAttribute("data-node-count")))
      .toBeGreaterThan(countBeforeSpace);
    await page.locator(`[data-graph-node="plane:${plane.id}"]`).focus();
    await page.locator(`[data-graph-node="plane:${plane.id}"]`).press("Escape");
    await expect(page.locator(".entity-hero h2")).toContainText(canonical.labels.zh);
    await expect(page.getByTestId("cytoscape-graph")).toHaveAttribute("data-reduced-motion", "true");
    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.setViewportSize({ width: 390, height: 844 });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(392);
  });
});
