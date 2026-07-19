import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Node = {
  readonly id?: unknown;
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly {
    readonly kind?: unknown;
    readonly field_values?: Readonly<Record<string, unknown>>;
  }[];
};

const root = (...segments: readonly string[]): string => resolve(
  "ontology",
  "tool-plane",
  "tool-discovery-selection",
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

describe("tool-discovery retained is_a contracts", () => {
  it("retains ToolSelectionActivity's decision-making contract in FallbackToolSelectionActivity", () => {
    const parent = node("ToolSelectionActivity");
    const child = node("ToolSelectionActivity", "FallbackToolSelectionActivity");

    expect(fieldIds(child)).toEqual(expect.arrayContaining(inheritedContract(parent)));
  });

  it("retains ToolCandidateAssessment's task context in ToolAvailabilityAssessment", () => {
    const parent = node("ToolSelectionActivity", "ToolCandidateAssessment");
    const child = node("ToolSelectionActivity", "ToolCandidateAssessment", "ToolAvailabilityAssessment");

    expect(fieldIds(child)).toEqual(expect.arrayContaining(inheritedContract(parent)));
  });

  it("retains ToolSelectionDecision's activity, candidate, and state contract in both decision specializations", () => {
    const parent = node("ToolSelectionDecision");
    const children = [
      node("ToolSelectionDecision", "FallbackToolSelectionDecision"),
      node("ToolSelectionDecision", "PreferredToolSelectionDecision"),
    ];

    for (const child of children) {
      expect(fieldIds(child), String(child.id)).toEqual(expect.arrayContaining(inheritedContract(parent)));
    }
  });

  it("shows all retained required fields in every positive and instance example", () => {
    const pairs = [
      { parent: node("ToolSelectionActivity"), child: node("ToolSelectionActivity", "FallbackToolSelectionActivity") },
      { parent: node("ToolSelectionActivity", "ToolCandidateAssessment"), child: node("ToolSelectionActivity", "ToolCandidateAssessment", "ToolAvailabilityAssessment") },
      { parent: node("ToolSelectionDecision"), child: node("ToolSelectionDecision", "FallbackToolSelectionDecision") },
      { parent: node("ToolSelectionDecision"), child: node("ToolSelectionDecision", "PreferredToolSelectionDecision") },
    ];

    for (const { parent, child } of pairs) {
      const required = [...new Set([...fieldIds(parent, true), ...fieldIds(child, true)])];
      for (const example of child.examples ?? []) {
        if (example.kind !== "positive" && example.kind !== "instance") continue;
        expect(Object.keys(example.field_values ?? {}), String(child.id)).toEqual(expect.arrayContaining(required));
      }
    }
  });
});
