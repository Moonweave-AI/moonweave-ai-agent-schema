import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly field_values?: Readonly<Record<string, unknown>>;
};

type Node = {
  readonly id?: unknown;
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const root = (...segments: readonly string[]): string => resolve(
  "ontology",
  "info-plane",
  "info-output-disclosure",
  ...segments,
  "node.yaml",
);

const node = (...segments: readonly string[]): Node => parse(readFileSync(root(...segments), "utf8")) as Node;

const fieldIds = (value: Node, requiredOnly = false): readonly string[] => (value.structure?.fields ?? []).flatMap((field) => (
  typeof field.id === "string" && (!requiredOnly || field.required === true) ? [field.id] : []
));

const inheritedContract = (parent: Node): readonly string[] => [...new Set([
  ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
  ...fieldIds(parent, true),
])];

const deliveryActivities = [
  ["DisclosureActivity", "DisclosurePublicationActivity"],
  ["DisclosureActivity", "DisclosureSelectionActivity"],
  ["DisclosureActivity", "DisclosureSuppressionActivity"],
  ["DisclosureActivity", "DisclosureTruncationActivity"],
] as const;

describe("info-output-disclosure retained is_a contracts", () => {
  it("retains the output-delivery activity contract in every specialized delivery activity", () => {
    const parent = node("DisclosureActivity");
    const required = inheritedContract(parent);

    for (const path of deliveryActivities) {
      expect(fieldIds(node(...path)), path.join("/")).toEqual(expect.arrayContaining(required));
    }
  });

  it("retains output window mode and specification in HeadTailWindow", () => {
    const parent = node("OutputWindow");
    const child = node("OutputWindow", "HeadTailWindow");

    expect(fieldIds(child)).toEqual(expect.arrayContaining(inheritedContract(parent)));
  });

  it("shows inherited fields alongside local specialization fields in positive and instance examples", () => {
    const pairs = [
      ...deliveryActivities.map((path) => ({ parent: node("DisclosureActivity"), child: node(...path) })),
      { parent: node("OutputWindow"), child: node("OutputWindow", "HeadTailWindow") },
    ];

    for (const { parent, child } of pairs) {
      const required = [...new Set([...inheritedContract(parent), ...fieldIds(child, true)])];
      for (const example of child.examples ?? []) {
        if (example.kind !== "positive" && example.kind !== "instance") continue;
        expect(Object.keys(example.field_values ?? {}), `${String(child.id)}:${String(example.id)}`).toEqual(
          expect.arrayContaining(required),
        );
      }
    }
  });
});
