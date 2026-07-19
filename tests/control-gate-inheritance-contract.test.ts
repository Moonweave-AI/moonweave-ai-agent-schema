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

const node = (segments: readonly string[]): Node => parse(readFileSync(resolve(
  "ontology",
  "orchestration-plane",
  "orchestration-routing-control",
  ...segments,
  "node.yaml",
), "utf8")) as Node;

const fieldIds = (value: Node): ReadonlySet<string> => new Set((value.structure?.fields ?? []).flatMap((field) => (
  typeof field.id === "string" ? [field.id] : []
)));

describe("ControlGate inheritance contract", () => {
  it("keeps the generic workflow-gate identity and makes ControlGate its actual subtype", () => {
    const gate = node(["Gate"]);
    const controlGate = node(["Gate", "ControlGate"]);

    expect(gate.structure?.identity_keys).toContain("gate_id");
    expect(fieldIds(gate)).toContain("gate_id");
    expect(controlGate.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
      target: "concept:Gate",
    });
    expect(controlGate.structure?.identity_keys).toContain("gate_id");
  });

  it("uses the gate's own required shape in its positive and concrete examples", () => {
    const gate = node(["Gate"]);
    const requiredFields = ["gate_id", "protected_transition", "gate_inputs", "allowed_outcomes"];
    const omissions = (gate.examples ?? []).flatMap((example) => {
      if (example.kind !== "positive" && example.kind !== "instance") return [];
      const values = example.field_values;
      if (typeof values !== "object" || values === null || Array.isArray(values)) {
        return [`${String(example.kind)} is missing field values`];
      }
      return requiredFields
        .filter((field) => !Object.hasOwn(values, field))
        .map((field) => `${String(example.kind)} omits ${field}`);
    });

    expect(omissions, omissions.join("\n")).toEqual([]);
  });

  it("retains inherited gate data in the subtype and its usable examples", () => {
    const controlGate = node(["Gate", "ControlGate"]);
    const inheritedFields = ["gate_id", "protected_transition", "gate_inputs", "allowed_outcomes"];

    for (const field of inheritedFields) expect(fieldIds(controlGate)).toContain(field);

    const omissions = (controlGate.examples ?? []).flatMap((example) => {
      if (example.kind !== "positive" && example.kind !== "instance") return [];
      const values = example.field_values;
      if (typeof values !== "object" || values === null || Array.isArray(values)) {
        return [`${String(example.kind)} is missing field values`];
      }
      return inheritedFields
        .filter((field) => !Object.hasOwn(values, field))
        .map((field) => `${String(example.kind)} omits ${field}`);
    });

    expect(omissions, omissions.join("\n")).toEqual([]);
  });
});
