import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  readonly related_node_ids?: readonly unknown[];
};

type ParentRelation = {
  readonly predicate?: unknown;
  readonly relation_kind?: unknown;
  readonly target?: unknown;
};

type Relation = {
  readonly predicate?: unknown;
  readonly target?: unknown;
  readonly relation_kind?: unknown;
};

type SourceClaim = {
  readonly id?: unknown;
  readonly evidence_kind?: unknown;
};

type OntologyNode = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly status?: unknown;
  readonly parent_relation?: ParentRelation | null;
  readonly relations?: readonly Relation[];
  readonly source_claims?: readonly SourceClaim[];
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const safetyRoot = resolve("ontology", "safety-plane");

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

const targetId = (target: unknown): string | null => {
  if (typeof target !== "string" || target.trim().length === 0) return null;
  const separator = target.indexOf(":");
  return separator < 0 ? target : target.slice(separator + 1);
};

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

describe("safety-plane directory-parent contracts", () => {
  const parsed = nodeFiles(safetyRoot).map((path) => ({
    path,
    node: parse(readFileSync(path, "utf8")) as OntologyNode,
  }));
  const nodeByPath = new Map(parsed.map(({ path, node }) => [path, node] as const));
  const nestedConcepts = parsed.filter(({ path, node }) => {
    if (node.kind !== "concept") return false;
    return nodeByPath.get(join(dirname(dirname(path)), "node.yaml"))?.kind === "concept";
  });

  it("uses a primary hierarchy or composition edge to every physical concept parent", () => {
    const violations = nestedConcepts.flatMap(({ path, node }) => {
      const parent = nodeByPath.get(join(dirname(dirname(path)), "node.yaml"));
      const parentId = typeof parent?.id === "string" ? parent.id : null;
      const relation = node.parent_relation;
      const validPredicate = relation?.predicate === "is_a" || relation?.predicate === "part_of";
      const validKind = (relation?.predicate === "is_a" && relation.relation_kind === "hierarchy")
        || (relation?.predicate === "part_of" && relation.relation_kind === "composition");
      const declaredTarget = targetId(relation?.target);

      return validPredicate && validKind && parentId
        && (declaredTarget === null || declaredTarget === parentId)
        ? []
        : [`${relative(safetyRoot, path).replaceAll("\\", "/")} must declare its physical parent as is_a/hierarchy or part_of/composition`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps inherited identity, required fields, and concrete parent shape in every subtype example", () => {
    const violations = nestedConcepts.flatMap(({ path, node }) => {
      if (node.parent_relation?.predicate !== "is_a") return [];
      const parent = nodeByPath.get(join(dirname(dirname(path)), "node.yaml"));
      if (!parent) return [`${relative(safetyRoot, path)} has no parent node`];

      const childFields = new Set(fieldIds(node));
      const childIdentity = new Set(strings(node.structure?.identity_keys));
      const missingFields = requiredFieldIds(parent).filter((id) => !childFields.has(id));
      const missingIdentity = strings(parent.structure?.identity_keys).filter((id) => !childIdentity.has(id));
      const missingExamples = (node.examples ?? []).flatMap((example, index) => {
        const values = isRecord(example.field_values) ? example.field_values : {};
        const missing = requiredFieldIds(node).filter((id) => !(id in values));
        return missing.length === 0
          ? []
          : [`example ${index} omits ${missing.join(", ")}`];
      });

      return missingFields.length === 0 && missingIdentity.length === 0 && missingExamples.length === 0
        ? []
        : [`${relative(safetyRoot, path).replaceAll("\\", "/")}: ${[
          missingFields.length > 0 ? `parent required fields ${missingFields.join(", ")}` : null,
          missingIdentity.length > 0 ? `parent identity ${missingIdentity.join(", ")}` : null,
          missingExamples.length > 0 ? missingExamples.join("; ") : null,
        ].filter(Boolean).join("; ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("classifies the OpenAI sandbox guide as official documentation rather than a normative specification", () => {
    const sandboxModule = nodeByPath.get(join(safetyRoot, "safety-sandbox-isolation", "node.yaml"));
    const claim = sandboxModule?.source_claims?.find((entry) => entry.id === "claim-module-openai-manifest");

    expect(claim?.evidence_kind).toBe("official-doc");
  });

  it("keeps pending requests and effect receipts as lifecycle records rather than faux components", () => {
    const toolApprovalModule = join(safetyRoot, "safety-tool-approval-execution");
    const pendingToolCallPath = join(toolApprovalModule, "PendingToolCall", "node.yaml");
    const legacyPendingToolCallPath = join(toolApprovalModule, "ToolApprovalGate", "PendingToolCall", "node.yaml");
    const toolResultRecordPath = join(toolApprovalModule, "ToolResultRecord", "node.yaml");
    const legacyToolResultRecordPath = join(toolApprovalModule, "SideEffect", "ToolResultRecord", "node.yaml");

    expect(existsSync(pendingToolCallPath)).toBe(true);
    expect(existsSync(legacyPendingToolCallPath)).toBe(false);
    expect(existsSync(toolResultRecordPath)).toBe(true);
    expect(existsSync(legacyToolResultRecordPath)).toBe(false);

    const pendingToolCall = parse(readFileSync(pendingToolCallPath, "utf8")) as OntologyNode;
    const toolResultRecord = parse(readFileSync(toolResultRecordPath, "utf8")) as OntologyNode;

    expect(pendingToolCall.parent_relation).toBeNull();
    expect(pendingToolCall.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        predicate: "awaits_decision_at",
        target: "concept:ToolApprovalGate",
        relation_kind: "association",
      }),
    ]));
    expect(toolResultRecord.parent_relation).toBeNull();
    expect(toolResultRecord.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        predicate: "documents_outcome_of",
        target: "concept:SideEffect",
        relation_kind: "association",
      }),
    ]));
  });

  it("uses documented tool-approval and tool-result names as canonical IDs", () => {
    const modulePath = join(safetyRoot, "safety-tool-approval-execution", "node.yaml");
    const legacyModulePath = join(safetyRoot, "safety-commit-redaction", "node.yaml");
    const canonicalNodeIds = [
      "ToolApprovalGate",
      "PendingToolCall",
      "ApprovalDecision",
      "RejectionDecision",
      "ToolResultRecord",
    ];
    const legacyNodeIds = new Set([
      "CommitGate",
      "CommitRequest",
      "CommitApproval",
      "CommitDenial",
      "EffectReceipt",
    ]);

    expect(existsSync(modulePath)).toBe(true);
    expect(existsSync(legacyModulePath)).toBe(false);

    const module = parse(readFileSync(modulePath, "utf8")) as OntologyNode;
    expect(module.id).toBe("safety-tool-approval-execution");
    for (const nodeId of canonicalNodeIds) {
      const nodePath = join(safetyRoot, "safety-tool-approval-execution", nodeId, "node.yaml");
      expect(existsSync(nodePath), `${nodeId} should use its canonical directory name`).toBe(true);
      const node = parse(readFileSync(nodePath, "utf8")) as OntologyNode;
      expect(node.id).toBe(nodeId);
    }
    expect(parsed.flatMap(({ node }) => typeof node.id === "string" && legacyNodeIds.has(node.id)
      ? [node.id]
      : [])).toEqual([]);
  });

  it("keeps safety example references bound to current ontology nodes", () => {
    const ontologyRoot = resolve("ontology");
    const currentNodeIds = new Set(nodeFiles(ontologyRoot).flatMap((path) => {
      const node = parse(readFileSync(path, "utf8")) as OntologyNode;
      return typeof node.id === "string" ? [node.id] : [];
    }));
    const violations = parsed.flatMap(({ path, node }) => (node.examples ?? []).flatMap((example, index) => (
      strings(example.related_node_ids).filter((id) => !currentNodeIds.has(id)).map((id) => (
        `${relative(safetyRoot, path).replaceAll("\\", "/")}: example ${index} references missing node ${id}`
      ))
    )));

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
