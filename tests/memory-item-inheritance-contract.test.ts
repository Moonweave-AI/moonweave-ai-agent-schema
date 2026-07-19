import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = { readonly id?: unknown };
type Example = { readonly kind?: unknown; readonly field_values?: unknown };
type Node = {
  readonly parent_relation?: unknown;
  readonly structure?: { readonly identity_keys?: readonly unknown[]; readonly fields?: readonly Field[] };
  readonly examples?: readonly Example[];
};

const memoryItem = (): Node => parse(readFileSync(resolve(
  "ontology",
  "memory-plane",
  "memory-stores-scopes",
  "MemoryEntity",
  "MemoryItem",
  "node.yaml",
), "utf8")) as Node;

describe("MemoryItem inheritance contract", () => {
  it("uses MemoryEntity as a genuine is_a parent while preserving concrete Store identity", () => {
    const node = memoryItem();
    expect(node.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
      target: "concept:MemoryEntity",
    });
    expect(node.structure?.identity_keys).toEqual([
      "memory_entity_id",
      "memory_store_ref",
      "namespace_path",
      "item_key",
    ]);

    const fields = new Set((node.structure?.fields ?? []).flatMap((field) => (
      typeof field.id === "string" ? [field.id] : []
    )));
    for (const inheritedField of ["memory_entity_id", "representation_kind", "provenance_ref"]) {
      expect(fields).toContain(inheritedField);
    }
  });

  it("keeps the inherited entity shape visible in valid Store-item cases", () => {
    const cases = (memoryItem().examples ?? []).filter((example) => (
      example.kind === "positive" || example.kind === "instance"
    ));
    const omissions = cases.flatMap((example) => {
      const values = example.field_values;
      if (typeof values !== "object" || values === null) return ["missing values"];
      return ["memory_entity_id", "representation_kind"].filter((field) => !(field in values));
    });
    expect(omissions, omissions.join(", ")).toEqual([]);
  });
});
