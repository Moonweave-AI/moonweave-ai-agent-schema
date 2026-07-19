import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Example = {
  readonly kind?: unknown;
  readonly field_values?: Readonly<Record<string, unknown>>;
};

type Node = {
  readonly engineering?: {
    readonly typical_output?: readonly {
      readonly format?: unknown;
    }[];
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const indexingNode = (...segments: readonly string[]): Node => parse(readFileSync(resolve(
  "ontology",
  "info-plane",
  "info-indexing",
  ...segments,
  "node.yaml",
), "utf8")) as Node;

const fieldIds = (value: Node, requiredOnly = false): readonly string[] => (value.structure?.fields ?? []).flatMap((field) => (
  typeof field.id === "string" && (!requiredOnly || field.required === true) ? [field.id] : []
));

describe("info-indexing retained is_a contracts", () => {
  it("keeps the complete DiscoveryActivity request contract in LightweightRetrieval", () => {
    const parent = indexingNode("DiscoveryActivity");
    const child = indexingNode("DiscoveryActivity", "LightweightRetrieval");
    const inherited = [...new Set([
      ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
      ...fieldIds(parent, true),
    ])];
    const requiredInExamples = [...new Set([...inherited, ...fieldIds(child, true)])];

    expect(fieldIds(child)).toEqual(expect.arrayContaining(inherited));
    for (const example of child.examples ?? []) {
      if (example.kind !== "positive" && example.kind !== "instance") continue;
      expect(Object.keys(example.field_values ?? {}), "positive and instance records retain the activity contract").toEqual(
        expect.arrayContaining(requiredInExamples),
      );
    }
    const output = String(child.engineering?.typical_output?.[0]?.format ?? "");
    for (const fieldId of requiredInExamples) {
      expect(output, `typical output retains ${fieldId}`).toContain(fieldId);
    }
  });

  it("keeps the complete DiscoveryIndex configuration contract in LightIndex", () => {
    const parent = indexingNode("DiscoveryIndex");
    const child = indexingNode("DiscoveryIndex", "LightIndex");
    const inherited = [...new Set([
      ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
      ...fieldIds(parent, true),
    ])];
    const requiredInExamples = [...new Set([...inherited, ...fieldIds(child, true)])];

    expect(fieldIds(child)).toEqual(expect.arrayContaining(inherited));
    for (const example of child.examples ?? []) {
      if (example.kind !== "positive" && example.kind !== "instance") continue;
      expect(Object.keys(example.field_values ?? {}), "positive and instance records retain the index contract").toEqual(
        expect.arrayContaining(requiredInExamples),
      );
    }
    const output = String(child.engineering?.typical_output?.[0]?.format ?? "");
    for (const fieldId of requiredInExamples) {
      expect(output, `typical output retains ${fieldId}`).toContain(fieldId);
    }
  });
});
