import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly field_values?: unknown;
};

type Node = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly relation_kind?: unknown;
    readonly target?: unknown;
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const ontologyRoot = resolve("ontology");
const commandRoot = join(ontologyRoot, "info-plane", "info-container-command");

const nodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  if (entry.isDirectory()) return nodeFiles(entryPath);
  return entry.isFile() && entry.name === "node.yaml" ? [entryPath] : [];
});

const strings = (values: readonly unknown[] | undefined): readonly string[] => (
  values?.flatMap((value) => typeof value === "string" && value.trim().length > 0 ? [value] : []) ?? []
);

const fieldIds = (node: Node): readonly string[] => (
  node.structure?.fields?.flatMap((field) => (
    typeof field.id === "string" && field.id.trim().length > 0 ? [field.id] : []
  )) ?? []
);

const requiredFieldIds = (node: Node): readonly string[] => (
  node.structure?.fields?.flatMap((field) => (
    field.required === true && typeof field.id === "string" && field.id.trim().length > 0
      ? [field.id]
      : []
  )) ?? []
);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const targetId = (target: unknown): string | null => {
  if (typeof target !== "string" || target.trim().length === 0) return null;
  const separator = target.indexOf(":");
  return separator < 0 ? target : target.slice(separator + 1);
};

describe("info-container-command is_a contracts", () => {
  const parsed = nodeFiles(commandRoot).map((path) => ({
    path,
    node: parse(readFileSync(path, "utf8")) as Node,
  }));
  const nodesByPath = new Map(parsed.map(({ path, node }) => [path, node] as const));
  const children = parsed.filter(({ node }) => node.kind === "concept" && node.parent_relation?.predicate === "is_a");

  it("keeps the ten command-observation, reference, stream, and chunk specializations in the scoped hierarchy", () => {
    expect(new Set(children.map(({ path }) => relative(commandRoot, path).replaceAll("\\", "/")))).toEqual(new Set([
      "ExecutionObservation/CommandOutputObservation/node.yaml",
      "ExecutionObservation/ExitStatusObservation/node.yaml",
      "ExecutionReference/EnvironmentBindingReference/node.yaml",
      "ExecutionReference/ExecutionResultReference/node.yaml",
      "ExecutionReference/WorkingDirectoryReference/node.yaml",
      "OutputStream/OutputSegment/OutputChunk/StandardErrorChunk/node.yaml",
      "OutputStream/OutputSegment/OutputChunk/StandardOutputChunk/node.yaml",
      "OutputStream/OutputSegment/OutputChunk/node.yaml",
      "OutputStream/StandardError/node.yaml",
      "OutputStream/StandardOutput/node.yaml",
    ]));
  });

  it("retains every immediate-parent required field and identity key in the same source record", () => {
    const violations = children.flatMap(({ path, node }) => {
      const parent = nodesByPath.get(join(dirname(dirname(path)), "node.yaml"));
      if (!parent || typeof parent.id !== "string") return [`${relative(ontologyRoot, path)} has no physical parent node`];

      const childFields = new Set(fieldIds(node));
      const childIdentity = new Set(strings(node.structure?.identity_keys));
      const missingFields = requiredFieldIds(parent).filter((id) => !childFields.has(id));
      const missingIdentity = strings(parent.structure?.identity_keys).filter((id) => !childIdentity.has(id));
      const parentDrift = targetId(node.parent_relation?.target) !== parent.id;
      const wrongRelationKind = node.parent_relation?.relation_kind !== "hierarchy";

      return missingFields.length === 0 && missingIdentity.length === 0 && !parentDrift && !wrongRelationKind
        ? []
        : [`${relative(ontologyRoot, path).replaceAll("\\", "/")}: ${[
          missingFields.length > 0 ? `fields ${missingFields.join(", ")}` : null,
          missingIdentity.length > 0 ? `identity ${missingIdentity.join(", ")}` : null,
          parentDrift ? "target drifts from physical parent" : null,
          wrongRelationKind ? "relation_kind is not hierarchy" : null,
        ].filter(Boolean).join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("shows all required subtype fields, including inherited parent fields, in positive and instance examples", () => {
    const violations = children.flatMap(({ path, node }) => {
      const parent = nodesByPath.get(join(dirname(dirname(path)), "node.yaml"));
      const required = new Set([
        ...requiredFieldIds(parent ?? {}),
        ...requiredFieldIds(node),
      ]);

      return (node.examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = isRecord(example.field_values) ? example.field_values : {};
        const missing = [...required].filter((id) => !(id in values));
        return missing.length === 0
          ? []
          : [`${relative(ontologyRoot, path).replaceAll("\\", "/")}/${example.id ?? "<example>"}: ${missing.join(", ")}`];
      });
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
