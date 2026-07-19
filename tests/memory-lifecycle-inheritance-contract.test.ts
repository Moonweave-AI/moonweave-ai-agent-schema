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
  readonly id?: unknown;
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const lifecycleRoot = (...segments: readonly string[]): string => resolve(
  "ontology",
  "memory-plane",
  "memory-lifecycle",
  ...segments,
  "node.yaml",
);

const node = (...segments: readonly string[]): Node => parse(readFileSync(
  lifecycleRoot(...segments),
  "utf8",
)) as Node;

const fieldIds = (value: Node, requiredOnly = false): readonly string[] => (value.structure?.fields ?? []).flatMap((field) => (
  typeof field.id === "string" && (!requiredOnly || field.required === true) ? [field.id] : []
));

const pairs = [
  { child: ["MemoryOperation", "MemoryAdmissionOperation"], parent: ["MemoryOperation"] },
  { child: ["MemoryOperation", "MemoryAdmissionOperation", "MemoryDiscard"], parent: ["MemoryOperation", "MemoryAdmissionOperation"] },
  { child: ["MemoryOperation", "MemoryAdmissionOperation", "MemoryWrite"], parent: ["MemoryOperation", "MemoryAdmissionOperation"] },
  { child: ["MemoryOperation", "MemoryAssessmentOperation"], parent: ["MemoryOperation"] },
  { child: ["MemoryOperation", "MemoryAssessmentOperation", "MemoryValidation"], parent: ["MemoryOperation", "MemoryAssessmentOperation"] },
  { child: ["MemoryOperation", "MemoryDispositionOperation"], parent: ["MemoryOperation"] },
  { child: ["MemoryOperation", "MemoryDispositionOperation", "MemoryDecay"], parent: ["MemoryOperation", "MemoryDispositionOperation"] },
  { child: ["MemoryOperation", "MemoryDispositionOperation", "MemoryDelete"], parent: ["MemoryOperation", "MemoryDispositionOperation"] },
  { child: ["MemoryOperation", "MemoryDispositionOperation", "MemoryEviction"], parent: ["MemoryOperation", "MemoryDispositionOperation"] },
  { child: ["MemoryOperation", "MemoryDispositionOperation", "MemoryExpiration"], parent: ["MemoryOperation", "MemoryDispositionOperation"] },
  { child: ["MemoryOperation", "MemoryResolutionOperation"], parent: ["MemoryOperation"] },
  { child: ["MemoryOperation", "MemoryResolutionOperation", "MemoryConflictResolution"], parent: ["MemoryOperation", "MemoryResolutionOperation"] },
  { child: ["MemoryOperation", "MemoryRevisionOperation"], parent: ["MemoryOperation"] },
  { child: ["MemoryOperation", "MemoryRevisionOperation", "MemoryUpdate"], parent: ["MemoryOperation", "MemoryRevisionOperation"] },
  { child: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation"], parent: ["MemoryOperation", "MemoryRevisionOperation"] },
  { child: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation", "MemoryCompaction"], parent: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation"] },
  { child: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation", "MemoryConsolidation"], parent: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation"] },
  { child: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation", "MemoryMerge"], parent: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation"] },
  { child: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation", "MemoryReflection"], parent: ["MemoryOperation", "MemoryRevisionOperation", "MemorySynthesisOperation"] },
] as const;

describe("memory-lifecycle retained is_a contracts", () => {
  it("keeps the complete executed-disposition contract on MemoryDelete", () => {
    const deletion = node("MemoryOperation", "MemoryDispositionOperation", "MemoryDelete");
    const disposition = node("MemoryOperation", "MemoryDispositionOperation");
    const requiredDispositionFields = fieldIds(disposition, true);

    expect(fieldIds(deletion), "MemoryDelete must retain every required MemoryDispositionOperation field").toEqual(
      expect.arrayContaining(requiredDispositionFields),
    );

    for (const example of deletion.examples ?? []) {
      if (example.kind !== "positive" && example.kind !== "instance") continue;
      expect(Object.keys(example.field_values ?? {}), `MemoryDelete/${String(example.kind)}`).toEqual(
        expect.arrayContaining(requiredDispositionFields),
      );
    }
  });

  it("retains every immediate parent identity and required field in each subtype source node", () => {
    for (const pair of pairs) {
      const child = node(...pair.child);
      const parent = node(...pair.parent);
      const requiredParentContract = [...new Set([
        ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
        ...fieldIds(parent, true),
      ])];

      expect(fieldIds(child), `${String(child.id)} <- ${String(parent.id)}`).toEqual(
        expect.arrayContaining(requiredParentContract),
      );
    }
  });

  it("shows inherited and local required fields in every positive and instance contract", () => {
    for (const pair of pairs) {
      const child = node(...pair.child);
      const parent = node(...pair.parent);
      const required = [...new Set([
        ...fieldIds(parent, true),
        ...fieldIds(child, true),
      ])];

      for (const example of child.examples ?? []) {
        if (example.kind !== "positive" && example.kind !== "instance") continue;
        expect(Object.keys(example.field_values ?? {}), `${String(child.id)}/${String(example.kind)}`).toEqual(
          expect.arrayContaining(required),
        );
      }
    }
  });
});
