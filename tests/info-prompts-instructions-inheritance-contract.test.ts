import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = { readonly id?: unknown; readonly required?: unknown };
type Example = { readonly kind?: unknown; readonly field_values?: Readonly<Record<string, unknown>> };
type Node = {
  readonly id?: unknown;
  readonly structure?: { readonly identity_keys?: readonly unknown[]; readonly fields?: readonly Field[] };
  readonly examples?: readonly Example[];
};

const promptsRoot = (...segments: readonly string[]): string => resolve(
  "ontology",
  "info-plane",
  "info-prompts-instructions",
  ...segments,
  "node.yaml",
);

const node = (...segments: readonly string[]): Node => parse(readFileSync(promptsRoot(...segments), "utf8")) as Node;

const fieldIds = (value: Node, requiredOnly = false): readonly string[] => (value.structure?.fields ?? []).flatMap((field) => (
  typeof field.id === "string" && (!requiredOnly || field.required === true) ? [field.id] : []
));

const metadataChildren = [
  ["Instruction", "InstructionMetadata", "InstructionApplicability"],
  ["Instruction", "InstructionMetadata", "InstructionAuthority"],
  ["Instruction", "InstructionMetadata", "InstructionPriority"],
  ["Instruction", "InstructionMetadata", "InstructionProvenance"],
  ["Instruction", "InstructionMetadata", "InstructionScope"],
] as const;

describe("prompt and instruction retained is_a contracts", () => {
  it("retains InstructionMetadata kind/value contract in every specialised metadata record", () => {
    const parent = node("Instruction", "InstructionMetadata");
    const inherited = [
      ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
      ...fieldIds(parent, true),
    ];

    for (const childPath of metadataChildren) {
      const child = node(...childPath);
      expect(fieldIds(child), String(child.id)).toEqual(expect.arrayContaining([...new Set(inherited)]));
      for (const example of child.examples ?? []) {
        if (example.kind === "positive" || example.kind === "instance") {
          expect(Object.keys(example.field_values ?? {}), `${String(child.id)}/${String(example.kind)}`).toEqual(
            expect.arrayContaining([...new Set([...inherited, ...fieldIds(child, true)])]),
          );
        }
      }
    }
  });

  it("retains the Instruction role origin in a SystemInstruction", () => {
    const child = node("Instruction", "SystemInstruction");
    expect(fieldIds(child)).toContain("role_origin");
    for (const example of child.examples ?? []) {
      if (example.kind === "positive" || example.kind === "instance") {
        expect(example.field_values?.role_origin).toBe("system");
      }
    }
  });

  it("retains the complete resolution outcome contract in an override record", () => {
    const parent = node("InstructionProcessing", "InstructionResolutionActivity", "InstructionResolution");
    const child = node("InstructionProcessing", "InstructionResolutionActivity", "InstructionResolution", "InstructionOverrideResolution");
    const inherited = [
      ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
      ...fieldIds(parent, true),
    ];

    expect(fieldIds(child)).toEqual(expect.arrayContaining([...new Set(inherited)]));
    for (const example of child.examples ?? []) {
      if (example.kind === "positive" || example.kind === "instance") {
        expect(Object.keys(example.field_values ?? {}), `${String(child.id)}/${String(example.kind)}`).toEqual(
          expect.arrayContaining([...new Set([...inherited, ...fieldIds(child, true)])]),
        );
      }
    }
  });
});
