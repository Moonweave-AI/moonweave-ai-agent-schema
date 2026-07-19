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

const memoryRecord = (): Node => parse(readFileSync(resolve(
  "ontology",
  "memory-plane",
  "memory-stores-scopes",
  "MemoryEntity",
  "MemoryRecord",
  "node.yaml",
), "utf8")) as Node;

describe("MemoryRecord inheritance contract", () => {
  it("uses a real MemoryEntity subtype relation and retains its base identity", () => {
    const node = memoryRecord();
    expect(node.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
      target: "concept:MemoryEntity",
    });
    expect(node.structure?.identity_keys).toEqual([
      "memory_entity_id",
      "memory_record_id",
      "record_version",
    ]);
    const fields = new Set((node.structure?.fields ?? []).flatMap((field) => (
      typeof field.id === "string" ? [field.id] : []
    )));
    expect(fields).toContain("memory_entity_id");
    expect(fields).toContain("representation_kind");
    expect(fields).toContain("provenance_ref");
  });

  it("shows the inherited entity fields in its positive and instance records", () => {
    const omissions = (memoryRecord().examples ?? [])
      .filter((example) => example.kind === "positive" || example.kind === "instance")
      .flatMap((example) => {
        const values = example.field_values;
        if (typeof values !== "object" || values === null) return ["missing values"];
        return ["memory_entity_id", "representation_kind"].filter((field) => !(field in values));
      });
    expect(omissions, omissions.join(", ")).toEqual([]);
  });
});
