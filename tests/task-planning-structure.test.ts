import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Localized = {
  readonly zh?: unknown;
  readonly en?: unknown;
  readonly ja?: unknown;
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly field_values?: unknown;
};

type OntologyNode = {
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly relation_kind?: unknown;
    readonly target?: unknown;
    readonly distinct_fact_rationale?: Localized;
  } | null;
  readonly structure?: {
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

type A2ATaskNode = {
  readonly engineering?: {
    readonly typical_input?: readonly { readonly format?: unknown }[];
    readonly typical_output?: readonly { readonly format?: unknown }[];
  };
  readonly structure?: {
    readonly fields?: readonly Field[];
    readonly constraints?: readonly { readonly id?: unknown }[];
  };
};

const planningRoot = resolve(
  "ontology",
  "orchestration-plane",
  "orchestration-task-planning",
);

const nodeAt = (relativePath: string): OntologyNode => parse(readFileSync(
  join(planningRoot, relativePath, "node.yaml"),
  "utf8",
)) as OntologyNode;

const fieldIds = (node: OntologyNode): readonly string[] => (
  node.structure?.fields?.flatMap((field) => (
    typeof field.id === "string" ? [field.id] : []
  )) ?? []
);

const requiredFieldIds = (node: OntologyNode): readonly string[] => (
  node.structure?.fields?.flatMap((field) => (
    field.required === true && typeof field.id === "string" ? [field.id] : []
  )) ?? []
);

const isLocalized = (value: Localized | undefined): boolean => (
  [value?.zh, value?.en, value?.ja].every((entry) => (
    typeof entry === "string" && entry.trim().length > 0
  ))
);

const embeddedClaimReferences = (value: unknown, isTopLevel = true): readonly string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => embeddedClaimReferences(entry, false));
  }
  if (value === null || typeof value !== "object") return [];

  return Object.entries(value as Readonly<Record<string, unknown>>).flatMap(([key, nested]) => {
    if (key === "source_claims" && !isTopLevel) {
      return Array.isArray(nested)
        ? nested.filter((claim): claim is string => typeof claim === "string")
        : [];
    }
    return embeddedClaimReferences(nested, false);
  });
};

describe("task-planning structural repair", () => {
  it("keeps each retained is_a specialization's direct WorkSpecification or TaskCondition contract", () => {
    const parentByChild = new Map<string, string>([
      ["WorkSpecification/TaskPlan", "WorkSpecification"],
      ["WorkSpecification/TaskStep", "WorkSpecification"],
      ["TaskCondition/TaskCompletionCriterion", "TaskCondition"],
      ["TaskCondition/TaskConstraint", "TaskCondition"],
    ]);

    const violations = [...parentByChild].flatMap(([childPath, parentPath]) => {
      const child = nodeAt(childPath);
      const parent = nodeAt(parentPath);
      const missingFields = requiredFieldIds(parent).filter((field) => (
        !fieldIds(child).includes(field)
      ));
      const malformedExamples = (child.examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") {
          return [];
        }
        const values = example.field_values;
        const missing = requiredFieldIds(parent).filter((field) => (
          typeof values !== "object" || values === null || !(field in values)
        ));
        return missing.length === 0
          ? []
          : [`${childPath}:${String(example.id)} omits ${missing.join(", ")}`];
      });
      return [
        ...(missingFields.length === 0 ? [] : [`${childPath} omits ${missingFields.join(", ")}`]),
        ...malformedExamples,
      ];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps WorkSpecification specializations as actual hierarchy records with intact localized rationale", () => {
    const violations = ["WorkSpecification/TaskPlan", "WorkSpecification/TaskStep"].flatMap((path) => {
      const relation = nodeAt(path).parent_relation;
      const hasExpectedBackbone = relation?.predicate === "is_a"
        && relation.relation_kind === "hierarchy"
        && relation.target === "concept:WorkSpecification";
      return hasExpectedBackbone && isLocalized(relation.distinct_fact_rationale)
        ? []
        : [path];
    });

    expect(violations, violations.join(", ")).toEqual([]);
  });

  it("uses protocol-native A2A Task, Artifact, and Message shapes", () => {
    const task = nodeAt("Task") as A2ATaskNode;
    const input = JSON.parse(String(task.engineering?.typical_input?.[0]?.format)) as {
      readonly status?: { readonly state?: unknown };
      readonly artifacts?: unknown;
    };
    const output = JSON.parse(String(task.engineering?.typical_output?.[0]?.format)) as {
      readonly status?: { readonly state?: unknown };
      readonly artifacts?: unknown;
      readonly history?: unknown;
      readonly metadata?: unknown;
    };

    expect(input.status?.state).toBe("TASK_STATE_WORKING");
    expect(input).not.toHaveProperty("artifacts");
    expect(output.status?.state).toBe("TASK_STATE_COMPLETED");
    expect(output.artifacts).toEqual([
      { artifactId: "release-report", parts: [{ text: "Release approved" }] },
    ]);
    expect(output.history).toEqual([
      {
        messageId: "msg-release-approved",
        contextId: "ctx-release-2026-07",
        taskId: "task-7f83",
        role: "ROLE_AGENT",
        parts: [{ text: "Release approved" }],
      },
    ]);
    expect(output.metadata).toEqual({ origin: "release-manager" });
    expect(task.structure?.fields?.map((field) => field.id)).toContain("metadata");
    expect(task.structure?.constraints?.map((constraint) => constraint.id)).toContain(
      "a2a-task-artifact-omission-is-protocol-shaped",
    );
    expect(task.structure?.constraints?.map((constraint) => constraint.id)).toContain(
      "a2a-task-embedded-message-and-artifact-shapes",
    );
  });

  it("connects every retained external planning claim to the statement it supports", () => {
    const requiredUses = new Map<string, readonly string[]>([
      ["Goal", ["claim-goal-agent-projection"]],
      [".", ["claim-task-planning-openai"]],
      ["TaskCondition", ["claim-task-condition-openai", "claim-task-condition-plan"]],
      ["TaskCondition/TaskCompletionCriterion", ["claim-completion-criterion-openai"]],
      ["WorkSpecification", ["claim-work-spec-agents-binding"]],
      ["WorkSpecification/TaskPlan/TaskDependency", ["claim-task-dependency-plan-method"]],
    ]);

    const violations = [...requiredUses].flatMap(([path, claimIds]) => {
      const references = new Set(embeddedClaimReferences(nodeAt(path)));
      const missing = claimIds.filter((claimId) => !references.has(claimId));
      return missing.length === 0 ? [] : [`${path} omits ${missing.join(", ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
