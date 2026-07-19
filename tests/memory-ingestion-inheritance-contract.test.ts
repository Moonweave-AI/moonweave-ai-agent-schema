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
  readonly engineering?: {
    readonly typical_input?: readonly {
      readonly format?: unknown;
    }[];
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const ingestionRoot = (...segments: readonly string[]): string => resolve(
  "ontology",
  "memory-plane",
  "memory-ingestion",
  ...segments,
  "node.yaml",
);

const node = (...segments: readonly string[]): Node => parse(readFileSync(
  ingestionRoot(...segments),
  "utf8",
)) as Node;

const fieldIds = (value: Node, requiredOnly = false): readonly string[] => (value.structure?.fields ?? []).flatMap((field) => (
  typeof field.id === "string" && (!requiredOnly || field.required === true) ? [field.id] : []
));

const pairs = [
  { child: ["Document", "TextDocument"], parent: ["Document"] },
  { child: ["IngestibleCollection", "TextCorpus"], parent: ["IngestibleCollection"] },
  { child: ["IngestibleResource", "Database"], parent: ["IngestibleResource"] },
  { child: ["IngestibleResource", "DirectoryResource"], parent: ["IngestibleResource"] },
  { child: ["IngestibleResource", "FileResource"], parent: ["IngestibleResource"] },
  { child: ["IngestibleResource", "FileSystem"], parent: ["IngestibleResource"] },
  { child: ["IngestibleResource", "GraphStore"], parent: ["IngestibleResource"] },
  { child: ["IngestionActivity", "IngestionPhase"], parent: ["IngestionActivity"] },
  { child: ["IngestionActivity", "IngestionPhase", "DeduplicationActivity"], parent: ["IngestionActivity", "IngestionPhase"] },
  { child: ["IngestionActivity", "IngestionPhase", "NormalizationActivity"], parent: ["IngestionActivity", "IngestionPhase"] },
  { child: ["IngestionActivity", "IngestionRun"], parent: ["IngestionActivity"] },
] as const;

describe("memory-ingestion retained is_a contracts", () => {
  it("retains immediate parent identity and required fields in every subtype source node", () => {
    for (const pair of pairs) {
      const child = node(...pair.child);
      const parent = node(...pair.parent);
      const childFields = fieldIds(child);
      const inheritedContract = [
        ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
        ...fieldIds(parent, true),
      ];

      expect(childFields, `${String(child.id)} <- ${String(parent.id)}`).toEqual(
        expect.arrayContaining([...new Set(inheritedContract)]),
      );
    }
  });

  it("shows the retained contract in each positive and instance example", () => {
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

  it("shows the IngestionPhase contract in the normalization API-shaped input", () => {
    const normalization = node("IngestionActivity", "IngestionPhase", "NormalizationActivity");
    const input = String(normalization.engineering?.typical_input?.[0]?.format ?? "");

    expect(input).toContain('"phase_kind": "normalize"');
    expect(input).toContain('"input_resource_refs": ["dir-policy-2026-07"]');
  });
});
