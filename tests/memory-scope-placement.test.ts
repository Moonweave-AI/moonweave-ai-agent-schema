import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Node = {
  readonly parent_relation?: unknown;
  readonly relations?: readonly { readonly id?: unknown; readonly predicate?: unknown; readonly target?: unknown }[];
  readonly examples?: readonly { readonly kind?: unknown; readonly related_relation_ids?: readonly unknown[] }[];
};

const moduleRootPath = resolve(
  "ontology", "memory-plane", "memory-stores-scopes", "MemoryScope", "node.yaml",
);
const legacyPath = resolve(
  "ontology", "memory-plane", "memory-stores-scopes", "MemoryEntity", "MemoryRecord", "MemoryScope", "node.yaml",
);

describe("MemoryScope placement", () => {
  it("models scope as a reusable boundary that bounds records, not as a record child", () => {
    expect(existsSync(moduleRootPath)).toBe(true);
    expect(existsSync(legacyPath)).toBe(false);
    const node = parse(readFileSync(moduleRootPath, "utf8")) as Node;
    expect(node.parent_relation).toBeNull();
    expect(node.relations).toContainEqual(expect.objectContaining({
      id: "MemoryScope-bounds-MemoryRecord",
      predicate: "bounds",
      target: "concept:MemoryRecord",
    }));
    for (const example of (node.examples ?? []).filter((entry) => (
      entry.kind === "positive" || entry.kind === "instance"
    ))) {
      expect(example.related_relation_ids).toContain("MemoryScope-bounds-MemoryRecord");
    }
  });
});
