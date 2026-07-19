import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Relation = { readonly id?: unknown; readonly predicate?: unknown; readonly target?: unknown };
type Node = {
  readonly parent_relation?: unknown;
  readonly relations?: readonly Relation[];
  readonly examples?: readonly { readonly kind?: unknown; readonly related_relation_ids?: readonly unknown[] }[];
};

const lifecyclePath = resolve(
  "ontology",
  "memory-plane",
  "memory-lifecycle",
  "MemoryRetentionPolicy",
  "node.yaml",
);
const legacyPath = resolve(
  "ontology",
  "memory-plane",
  "memory-stores-scopes",
  "MemoryEntity",
  "MemoryRecord",
  "MemoryRetentionPolicy",
  "node.yaml",
);

describe("MemoryRetentionPolicy placement", () => {
  it("treats a reusable retention policy as a lifecycle policy, not as a part or subtype of one record", () => {
    expect(existsSync(lifecyclePath)).toBe(true);
    expect(existsSync(legacyPath)).toBe(false);

    const node = parse(readFileSync(lifecyclePath, "utf8")) as Node;
    expect(node.parent_relation).toBeNull();
    expect(node.relations).toContainEqual(expect.objectContaining({
      id: "MemoryRetentionPolicy-governs-MemoryRecord",
      predicate: "governs",
      target: "concept:MemoryRecord",
    }));
    for (const example of (node.examples ?? []).filter((entry) => (
      entry.kind === "positive" || entry.kind === "instance"
    ))) {
      expect(example.related_relation_ids).toContain("MemoryRetentionPolicy-governs-MemoryRecord");
    }
  });
});
