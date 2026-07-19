import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = { readonly id?: unknown };
type Example = {
  readonly kind?: unknown;
  readonly field_values?: unknown;
};
type Node = {
  readonly parent_relation?: unknown;
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const memoryFile = (): Node => parse(readFileSync(resolve(
  "ontology",
  "memory-plane",
  "memory-stores-scopes",
  "MemoryEntity",
  "MemoryFile",
  "node.yaml",
), "utf8")) as Node;

describe("MemoryFile inheritance contract", () => {
  it("retains MemoryEntity as its actual subtype contract rather than a bespoke primary edge", () => {
    const node = memoryFile();
    expect(node.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
      target: "concept:MemoryEntity",
    });

    const fieldIds = new Set((node.structure?.fields ?? []).flatMap((field) => (
      typeof field.id === "string" ? [field.id] : []
    )));
    for (const parentField of ["memory_entity_id", "representation_kind", "provenance_ref"]) {
      expect(fieldIds).toContain(parentField);
    }
    expect(node.structure?.identity_keys).toContain("memory_entity_id");
  });

  it("shows inherited entity identity and representation in usable positive and instance shapes", () => {
    const cases = (memoryFile().examples ?? []).filter((example) => (
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
