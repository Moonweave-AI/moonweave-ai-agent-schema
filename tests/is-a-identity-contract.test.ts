import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Example = {
  readonly kind?: unknown;
  readonly field_values?: unknown;
};

type OntologyNode = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly parent_relation?: {
    readonly predicate?: unknown;
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
  };
  readonly examples?: readonly Example[];
};

const nodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  if (entry.isDirectory()) return nodeFiles(entryPath);
  return entry.isFile() && entry.name === "node.yaml" ? [entryPath] : [];
});

const nodeId = (node: OntologyNode): string | null => (
  typeof node.id === "string" && node.id.trim().length > 0 ? node.id : null
);

const identityKeys = (node: OntologyNode): readonly string[] => (
  (node.structure?.identity_keys ?? []).flatMap((key) => (
    typeof key === "string" && key.trim().length > 0 ? [key] : []
  ))
);

const directoryParentPath = (childNodePath: string): string => (
  join(dirname(dirname(childNodePath)), "node.yaml")
);

const hasFieldValue = (example: Example, key: string): boolean => (
  Boolean(example.field_values)
  && typeof example.field_values === "object"
  && !Array.isArray(example.field_values)
  && Object.hasOwn(example.field_values, key)
);

describe("registry is_a identity contract", () => {
  it("retains every parent identity key and displays it in positive and instance examples", () => {
    const registryRoot = resolve("ontology", "tool-plane", "tool-registry-definition");
    const parsed = nodeFiles(registryRoot).map((path) => ({
      path,
      node: parse(readFileSync(path, "utf8")) as OntologyNode,
    }));
    const nodesByPath = new Map(parsed.map(({ path, node }) => [path, node] as const));
    const violations = parsed.flatMap(({ path, node }) => {
      if (node.kind !== "concept" || node.parent_relation?.predicate !== "is_a") return [];

      const parent = nodesByPath.get(directoryParentPath(path));
      const parentId = nodeId(parent ?? {}) ?? "<missing directory parent>";
      const inheritedKeys = identityKeys(parent ?? {});
      const childKeys = new Set(identityKeys(node));
      const missingKeys = inheritedKeys.filter((key) => !childKeys.has(key));
      const exampleIssues = (node.examples ?? []).flatMap((example) => (
        example.kind === "positive" || example.kind === "instance"
          ? inheritedKeys.filter((key) => !hasFieldValue(example, key)).map((key) => (
            `${relative(registryRoot, path).replaceAll("\\", "/")} ${example.kind} example omits inherited identity key ${key}`
          ))
          : []
      ));
      return [
        ...missingKeys.map((key) => (
          `${relative(registryRoot, path).replaceAll("\\", "/")} is_a ${parentId} but omits inherited identity key ${key}`
        )),
        ...exampleIssues,
      ];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
