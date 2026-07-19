import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Node = {
  readonly parent_relation?: unknown;
  readonly relations?: readonly { readonly id?: unknown; readonly predicate?: unknown; readonly target?: unknown }[];
  readonly examples?: readonly { readonly kind?: unknown; readonly related_relation_ids?: readonly unknown[] }[];
};

const lifecyclePath = resolve(
  "ontology", "memory-plane", "memory-lifecycle", "MemoryTombstone", "node.yaml",
);
const legacyPath = resolve(
  "ontology", "memory-plane", "memory-stores-scopes", "MemoryEntity", "MemoryRecord", "MemoryTombstone", "node.yaml",
);

describe("MemoryTombstone placement", () => {
  it("keeps a deletion marker as a lifecycle artifact with a record-marking relation", () => {
    expect(existsSync(lifecyclePath)).toBe(true);
    expect(existsSync(legacyPath)).toBe(false);
    const node = parse(readFileSync(lifecyclePath, "utf8")) as Node;
    expect(node.parent_relation).toBeNull();
    expect(node.relations).toContainEqual(expect.objectContaining({
      id: "MemoryTombstone-marks_deletion_of-MemoryRecord",
      predicate: "marks_deletion_of",
      target: "concept:MemoryRecord",
    }));
    for (const example of (node.examples ?? []).filter((entry) => (
      entry.kind === "positive" || entry.kind === "instance"
    ))) {
      expect(example.related_relation_ids).toContain("MemoryTombstone-marks_deletion_of-MemoryRecord");
    }
  });
});
