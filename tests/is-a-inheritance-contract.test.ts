import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type OntologyNode = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly target?: unknown;
  };
  readonly structure?: {
    readonly fields?: readonly Field[];
  };
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

const requiredFieldIds = (node: OntologyNode): ReadonlySet<string> => new Set(
  (node.structure?.fields ?? []).flatMap((field) => (
    field.required === true && typeof field.id === "string" && field.id.trim().length > 0
      ? [field.id]
      : []
  )),
);

const fieldIds = (node: OntologyNode): ReadonlySet<string> => new Set(
  (node.structure?.fields ?? []).flatMap((field) => (
    typeof field.id === "string" && field.id.trim().length > 0 ? [field.id] : []
  )),
);

const directoryParentId = (
  childNodePath: string,
  nodesByPath: ReadonlyMap<string, OntologyNode>,
): string | null => {
  const parentNodePath = join(dirname(dirname(childNodePath)), "node.yaml");
  return nodeId(nodesByPath.get(parentNodePath) ?? {});
};

const declaredTargetId = (target: unknown): string | null => {
  if (typeof target !== "string" || target.trim().length === 0) return null;
  const separator = target.indexOf(":");
  return separator < 0 ? target : target.slice(separator + 1);
};

describe("is_a inheritance contract", () => {
  it("resolves an is_a parent from the concept directory even when parent_relation omits target", () => {
    const ontologyRoot = resolve("ontology");
    const parsed = nodeFiles(ontologyRoot).map((path) => ({
      path,
      node: parse(readFileSync(path, "utf8")) as OntologyNode,
    }));
    const nodesByPath = new Map(parsed.map(({ path, node }) => [path, node] as const));
    const proxyRoutePath = resolve(
      "ontology",
      "safety-plane",
      "safety-network-control",
      "NetworkRoute",
      "ProxyRoute",
      "node.yaml",
    );

    expect(directoryParentId(proxyRoutePath, nodesByPath)).toBe("NetworkRoute");
  });

  it("rejects an explicit is_a target that disagrees with the compiler-derived directory parent", () => {
    const ontologyRoot = resolve("ontology");
    const parsed = nodeFiles(ontologyRoot).map((path) => ({
      path,
      node: parse(readFileSync(path, "utf8")) as OntologyNode,
    }));
    const nodesByPath = new Map(parsed.map(({ path, node }) => [path, node] as const));
    const violations = parsed.flatMap(({ path, node }) => {
      if (node.kind !== "concept" || node.parent_relation?.predicate !== "is_a") return [];

      const declaredParentId = declaredTargetId(node.parent_relation.target);
      const directoryParent = directoryParentId(path, nodesByPath);
      if (!declaredParentId || declaredParentId === directoryParent) return [];

      return [`${relative(ontologyRoot, path).replaceAll("\\", "/")} declares is_a ${declaredParentId}, but its compiler-derived directory parent is ${directoryParent}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("requires a retained is_a child to carry every required field of the parent until an explicit field-equivalence mechanism exists", () => {
    const ontologyRoot = resolve("ontology");
    const parsed = nodeFiles(ontologyRoot).map((path) => ({
      path,
      node: parse(readFileSync(path, "utf8")) as OntologyNode,
    }));
    const nodesByPath = new Map(parsed.map(({ path, node }) => [path, node] as const));

    const violations = parsed.flatMap(({ path, node }) => {
      if (node.kind !== "concept" || node.parent_relation?.predicate !== "is_a") return [];

      const parentId = directoryParentId(path, nodesByPath);
      const parent = nodesByPath.get(join(dirname(dirname(path)), "node.yaml"));
      if (!parent) return [];

      const childFields = fieldIds(node);
      const missing = [...requiredFieldIds(parent)].filter((id) => !childFields.has(id));
      return missing.length === 0
        ? []
        : [`${relative(ontologyRoot, path).replaceAll("\\", "/")} is_a ${parentId} but omits required parent fields: ${missing.join(", ")}`];
    });

    expect(violations, violations.slice(0, 80).join("\n")).toEqual([]);
  });
});
