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

type Source = {
  readonly id?: unknown;
};

type SourceClaim = {
  readonly id?: unknown;
  readonly source?: unknown;
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
  readonly sources?: readonly Source[];
  readonly source_claims?: readonly SourceClaim[];
};

const ontologyRoot = resolve("ontology");
const contextRoot = join(ontologyRoot, "memory-plane", "memory-context");

const candidatePaths = new Set([
  "node.yaml",
  "ContextArtifact/ContextExclusion/node.yaml",
  "ContextArtifact/ContextPackage/ContextIngressEvent/node.yaml",
  "ContextArtifact/ContextPackage/node.yaml",
  "ContextArtifact/ContextSummary/node.yaml",
  "ContextArtifact/ContextWindow/ContextSlot/ContextSourceRole/node.yaml",
  "ContextArtifact/ContextWindow/ContextSlot/node.yaml",
  "ContextArtifact/ContextWindow/VisibleContextWindow/node.yaml",
  "ContextArtifact/ContextWindow/node.yaml",
  "ContextArtifact/node.yaml",
  "ContextAssemblyActivity/ContextAssembly/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/ContextOrderingActivity/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/ContextSelectionActivity/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/ContextTrimmingActivity/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/node.yaml",
  "ContextAssemblyActivity/node.yaml",
  "ContextRefreshEvent/node.yaml",
  "ContextSpecification/ContextBudget/node.yaml",
  "ContextSpecification/ContextRule/ContextOrderingRule/node.yaml",
  "ContextSpecification/ContextRule/node.yaml",
  "ContextSpecification/node.yaml",
]) as const;

const retainedSubtypePaths = new Set([
  "ContextArtifact/ContextExclusion/node.yaml",
  "ContextArtifact/ContextPackage/node.yaml",
  "ContextArtifact/ContextSummary/node.yaml",
  "ContextArtifact/ContextWindow/VisibleContextWindow/node.yaml",
  "ContextArtifact/ContextWindow/node.yaml",
  "ContextAssemblyActivity/ContextAssembly/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/ContextOrderingActivity/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/ContextSelectionActivity/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/ContextTrimmingActivity/node.yaml",
  "ContextAssemblyActivity/ContextAssemblyPhase/node.yaml",
  "ContextSpecification/ContextRule/ContextOrderingRule/node.yaml",
]);

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

const identifiers = <T extends { readonly id?: unknown }>(values: readonly T[] | undefined): readonly string[] => (
  values?.flatMap((value) => typeof value.id === "string" && value.id.trim().length > 0
    ? [value.id]
    : []) ?? []
);

const fieldIds = (node: OntologyNode): readonly string[] => identifiers(node.structure?.fields);

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

describe("memory-context is_a inheritance contracts", () => {
  const parsedNodes = nodeFiles(contextRoot).map((path) => ({
    path,
    node: parse(readFileSync(path, "utf8")) as OntologyNode,
  }));
  const nodeByPath = new Map(parsedNodes.map(({ path, node }) => [path, node] as const));
  const candidates = parsedNodes.filter(({ node }) => (
    node.kind === "concept" && node.parent_relation?.predicate === "is_a"
  ));

  it("keeps the audited subtype set explicit", () => {
    expect(new Set(parsedNodes.map(({ path }) => relative(contextRoot, path).replaceAll("\\", "/"))))
      .toEqual(candidatePaths);
    expect(new Set(candidates.map(({ path }) => relative(contextRoot, path).replaceAll("\\", "/"))))
      .toEqual(retainedSubtypePaths);
  });

  it("retains each direct parent identity, required shape, and source declarations", () => {
    const violations = candidates.flatMap(({ path, node }) => {
      const parent = nodeByPath.get(join(dirname(path), "..", "node.yaml"));
      const physicalParentId = typeof parent?.id === "string" && parent.id.trim().length > 0
        ? parent.id
        : null;
      if (!parent || !physicalParentId) {
        return [`${relative(contextRoot, path)} has no physical parent node`];
      }

      const childFields = new Set(fieldIds(node));
      const childIdentity = new Set(strings(node.structure?.identity_keys));
      const childSources = new Set(identifiers(node.sources));
      const missingFields = requiredFieldIds(parent).filter((id) => !childFields.has(id));
      const missingIdentity = strings(parent.structure?.identity_keys).filter((id) => !childIdentity.has(id));
      const missingSources = identifiers(parent.sources).filter((id) => !childSources.has(id));
      const invalidClaimSources = (node.source_claims ?? []).flatMap((claim) => (
        typeof claim.source === "string" && childSources.has(claim.source)
          ? []
          : [`claim ${String(claim.id)} references an undeclared source ${String(claim.source)}`]
      ));
      const wrongEdge = node.parent_relation?.relation_kind !== "hierarchy"
        || normalizeTarget(node.parent_relation?.target) !== physicalParentId;

      return missingFields.length === 0
        && missingIdentity.length === 0
        && missingSources.length === 0
        && invalidClaimSources.length === 0
        && !wrongEdge
        ? []
        : [`${relative(contextRoot, path).replaceAll("\\", "/")}: ${[
          missingFields.length > 0 ? `fields ${missingFields.join(", ")}` : null,
          missingIdentity.length > 0 ? `identity ${missingIdentity.join(", ")}` : null,
          missingSources.length > 0 ? `sources ${missingSources.join(", ")}` : null,
          invalidClaimSources.length > 0 ? invalidClaimSources.join(", ") : null,
          wrongEdge ? "must be a hierarchy edge to its physical parent" : null,
        ].filter(Boolean).join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("makes inherited and local required values visible in usable subtype examples", () => {
    const violations = candidates.flatMap(({ path, node }) => (
      (node.examples ?? []).flatMap((example, index) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = isRecord(example.field_values) ? example.field_values : {};
        const missing = requiredFieldIds(node).filter((id) => !(id in values));
        return missing.length === 0
          ? []
          : [`${relative(contextRoot, path).replaceAll("\\", "/")} example ${index} omits ${missing.join(", ")}`];
      })
    ));

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
