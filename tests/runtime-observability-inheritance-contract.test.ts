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
const observabilityRoot = join(ontologyRoot, "runtime-plane", "runtime-observability");

const nodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  if (entry.isDirectory()) return nodeFiles(entryPath);
  return entry.isFile() && entry.name === "node.yaml" ? [entryPath] : [];
});

const normalizeTarget = (target: unknown): string | null => {
  if (typeof target !== "string" || target.trim().length === 0) return null;
  const separator = target.indexOf(":");
  return separator < 0 ? target : target.slice(separator + 1);
};

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

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const candidatePaths = new Set([
  "CheckpointLifecycleActivity/CheckpointCaptureActivity/node.yaml",
  "CheckpointLifecycleActivity/ReplayActivity/node.yaml",
  "CheckpointLifecycleActivity/RestoreActivity/node.yaml",
  "ObservabilityEvent/CheckpointRestoreEvent/node.yaml",
  "ObservabilityEvent/ReplayEvent/node.yaml",
  "ObservabilityEvent/TelemetryEvent/node.yaml",
  "ObservabilityEvent/TraceEvent/node.yaml",
  "ObservabilityRecord/AgentTranscript/node.yaml",
  "ObservabilityRecord/AuditRecord/node.yaml",
  "ObservabilityRecord/ObservableSummary/node.yaml",
  "ObservabilityRecord/StateRecord/Checkpoint/node.yaml",
  "ObservabilityRecord/StateRecord/StateDiff/node.yaml",
  "ObservabilityRecord/StateRecord/StateSnapshot/node.yaml",
  "ObservabilityRecord/StateRecord/node.yaml",
  "ObservabilityRecord/TraceRecord/node.yaml",
  "ObservabilityRecord/TraceSpan/node.yaml",
]);

describe("runtime-observability is_a contracts", () => {
  const parsedNodes = nodeFiles(observabilityRoot).map((path) => ({
    path,
    node: parse(readFileSync(path, "utf8")) as OntologyNode,
  }));
  const nodeByPath = new Map(parsedNodes.map(({ path, node }) => [path, node] as const));
  const candidates = parsedNodes.filter(({ path, node }) => (
    path.startsWith(observabilityRoot)
    && node.kind === "concept"
    && node.parent_relation?.predicate === "is_a"
  ));

  it("keeps the intended 16 local hierarchy candidates in this repair slice", () => {
    expect(new Set(candidates.map(({ path }) => relative(observabilityRoot, path).replaceAll("\\", "/"))))
      .toEqual(candidatePaths);
    expect(candidates).toHaveLength(16);
  });

  it("keeps every retained subtype's direct parent fields and identity on the same record", () => {
    const violations = candidates.flatMap(({ path, node }) => {
      const physicalParentPath = join(dirname(path), "..", "node.yaml");
      const parent = nodeByPath.get(physicalParentPath);
      const physicalParentId = typeof parent?.id === "string" && parent.id.trim().length > 0
        ? parent.id
        : null;
      if (!parent || !physicalParentId) {
        return [`${relative(ontologyRoot, path)} has no physical directory parent node`];
      }

      const childFields = new Set(fieldIds(node));
      const childIdentity = new Set(strings(node.structure?.identity_keys));
      const missingFields = requiredFieldIds(parent).filter((id) => !childFields.has(id));
      const missingIdentity = strings(parent.structure?.identity_keys).filter((id) => !childIdentity.has(id));
      const wrongRelationKind = node.parent_relation?.relation_kind !== "hierarchy";
      const targetDrift = normalizeTarget(node.parent_relation?.target) !== physicalParentId;

      return missingFields.length === 0 && missingIdentity.length === 0 && !wrongRelationKind && !targetDrift
        ? []
        : [`${relative(ontologyRoot, path).replaceAll("\\", "/")} -> ${physicalParentId}: ${[
          missingFields.length > 0 ? `fields ${missingFields.join(", ")}` : null,
          missingIdentity.length > 0 ? `identity ${missingIdentity.join(", ")}` : null,
          wrongRelationKind ? "relation_kind must be hierarchy" : null,
          targetDrift ? "parent_relation target must match the physical directory parent" : null,
        ].filter(Boolean).join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("shows inherited required values in positive and instance subtype examples", () => {
    const violations = candidates.flatMap(({ path, node }) => {
      const required = requiredFieldIds(node);
      return (node.examples ?? []).flatMap((example, index) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = isRecord(example.field_values) ? example.field_values : {};
        const missing = required.filter((id) => !(id in values));
        return missing.length === 0
          ? []
          : [`${relative(ontologyRoot, path).replaceAll("\\", "/")} example ${index} omits ${missing.join(", ")}`];
      });
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
