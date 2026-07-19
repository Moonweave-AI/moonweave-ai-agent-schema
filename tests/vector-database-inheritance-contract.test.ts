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

const vectorDatabase = (): Node => parse(readFileSync(resolve(
  "ontology", "memory-plane", "memory-stores-scopes", "MemoryStore", "VectorDatabase", "node.yaml",
), "utf8")) as Node;

describe("VectorDatabase inheritance contract", () => {
  it("models a vector backend as a true MemoryStore subtype with the Store contract retained", () => {
    const node = vectorDatabase();
    expect(node.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
      target: "concept:MemoryStore",
    });
    expect(node.structure?.identity_keys).toEqual(["store_id", "vector_database_id"]);
    const fieldIds = new Set((node.structure?.fields ?? []).flatMap((field) => (
      typeof field.id === "string" ? [field.id] : []
    )));
    for (const inheritedField of [
      "store_id",
      "backend_kind",
      "operation_interface_ref",
      "namespace_addressing_mode",
      "write_audit_mode",
    ]) expect(fieldIds).toContain(inheritedField);
  });

  it("keeps the Store identity and operation contract visible in valid backend examples", () => {
    const omissions = (vectorDatabase().examples ?? [])
      .filter((example) => example.kind === "positive" || example.kind === "instance")
      .flatMap((example) => {
        const values = example.field_values;
        if (typeof values !== "object" || values === null) return ["missing values"];
        return [
          "store_id",
          "backend_kind",
          "operation_interface_ref",
          "namespace_addressing_mode",
          "write_audit_mode",
        ].filter((field) => !(field in values));
      });
    expect(omissions, omissions.join(", ")).toEqual([]);
  });
});
