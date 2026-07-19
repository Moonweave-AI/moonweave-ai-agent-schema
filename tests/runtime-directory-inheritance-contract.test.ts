import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Example = {
  readonly kind?: unknown;
  readonly field_values?: unknown;
};

type OntologyNode = {
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
const repairRoots = [
  join(ontologyRoot, "runtime-plane", "runtime-actors"),
  join(ontologyRoot, "runtime-plane", "runtime-artifacts"),
  join(ontologyRoot, "runtime-plane", "runtime-system"),
] as const;

const nodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  if (entry.isDirectory()) return nodeFiles(entryPath);
  return entry.isFile() && entry.name === "node.yaml" ? [entryPath] : [];
});

const strings = (values: readonly unknown[] | undefined): readonly string[] => (
  values?.flatMap((value) => typeof value === "string" && value.trim().length > 0
    ? [value]
    : []) ?? []
);

const fieldIds = (node: OntologyNode): readonly string[] => (
  node.structure?.fields?.flatMap((field) => typeof field.id === "string" && field.id.trim().length > 0
    ? [field.id]
    : []) ?? []
);

const requiredFieldIds = (node: OntologyNode): readonly string[] => (
  node.structure?.fields?.flatMap((field) => field.required === true
    && typeof field.id === "string"
    && field.id.trim().length > 0
    ? [field.id]
    : []) ?? []
);

const normalizeTarget = (target: unknown): string | null => {
  if (typeof target !== "string" || target.trim().length === 0) return null;
  const separator = target.indexOf(":");
  return separator < 0 ? target : target.slice(separator + 1);
};

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

describe("runtime directory-parent inheritance contracts", () => {
  const parsedNodes = repairRoots.flatMap((root) => nodeFiles(root)).map((path) => ({
    path,
    node: parse(readFileSync(path, "utf8")) as OntologyNode,
  }));
  const nodeByPath = new Map(parsedNodes.map(({ path, node }) => [path, node] as const));
  const candidates = parsedNodes.filter(({ path, node }) => (
    repairRoots.some((root) => path.startsWith(root))
    && node.kind === "concept"
    && node.parent_relation?.predicate === "is_a"
  ));

  it("anchors every hierarchy edge to the physical directory parent", () => {
    const violations = candidates.flatMap(({ path, node }) => {
      const parent = nodeByPath.get(join(dirname(path), "..", "node.yaml"));
      const parentId = typeof parent?.id === "string" && parent.id.trim().length > 0
        ? parent.id
        : null;
      if (!parentId) return [`${relative(ontologyRoot, path)} has no physical directory parent`];

      return node.parent_relation?.relation_kind === "hierarchy"
        && normalizeTarget(node.parent_relation?.target) === parentId
        ? []
        : [`${relative(ontologyRoot, path)} must be a hierarchy edge to ${parentId}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("carries every direct physical-parent contract on the same subtype record", () => {
    const violations = candidates.flatMap(({ path, node }) => {
      const parent = nodeByPath.get(join(dirname(path), "..", "node.yaml"));
      if (!parent) return [`${relative(ontologyRoot, path)} has no physical directory parent`];

      const childFields = new Set(fieldIds(node));
      const childIdentity = new Set(strings(node.structure?.identity_keys));
      const missingFields = requiredFieldIds(parent).filter((id) => !childFields.has(id));
      const missingIdentity = strings(parent.structure?.identity_keys).filter((id) => !childIdentity.has(id));

      return missingFields.length === 0 && missingIdentity.length === 0
        ? []
        : [`${relative(ontologyRoot, path)}: ${[
          missingFields.length > 0 ? `fields ${missingFields.join(", ")}` : null,
          missingIdentity.length > 0 ? `identity ${missingIdentity.join(", ")}` : null,
        ].filter(Boolean).join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("shows all required subtype values in its positive and instance examples", () => {
    const violations = candidates.flatMap(({ path, node }) => (
      (node.examples ?? []).flatMap((example, index) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = isRecord(example.field_values) ? example.field_values : {};
        const missing = requiredFieldIds(node).filter((id) => !(id in values));
        return missing.length === 0
          ? []
          : [`${relative(ontologyRoot, path)} example ${index} omits ${missing.join(", ")}`];
      })
    ));

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
