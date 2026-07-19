import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
};

type Localized = {
  readonly zh?: unknown;
  readonly en?: unknown;
  readonly ja?: unknown;
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly descriptions?: Localized;
  readonly field_values?: unknown;
};

type OntologyNode = {
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly relation_kind?: unknown;
    readonly target?: unknown;
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
    readonly constraints?: readonly unknown[];
  };
  readonly examples?: readonly Example[];
};

const delegationRoot = resolve(
  "ontology",
  "orchestration-plane",
  "orchestration-delegation-handoff",
);

const nodeAt = (relativePath: string): OntologyNode => parse(readFileSync(
  join(delegationRoot, relativePath, "node.yaml"),
  "utf8",
)) as OntologyNode;

const fieldIds = (node: OntologyNode): readonly string[] => (
  node.structure?.fields?.flatMap((field) => typeof field.id === "string" ? [field.id] : []) ?? []
);

const localized = (value: Localized | undefined): boolean => (
  [value?.zh, value?.en, value?.ja].every((entry) => (
    typeof entry === "string" && entry.trim().length > 0
  ))
);

describe("delegation and handoff repair slice", () => {
  it("keeps each retained is_a subtype's direct parent contract on the same record", () => {
    const expectedInheritedFields = new Map<string, readonly string[]>([
      [
        "CollaborationProcess/DelegationProcess/DelegationContext/SubagentContext",
        ["allowed_context_refs", "isolation_policy_ref", "worker_visible_inputs"],
      ],
      [
        "CollaborationProcess/DelegationProcess/DelegationPhase/AcceptancePhase",
        ["phase_name", "ordinal", "entry_evidence", "exit_criteria"],
      ],
      [
        "CollaborationProcess/DelegationProcess/DelegationPhase/CompletionPhase",
        ["phase_name", "ordinal", "entry_evidence", "exit_criteria"],
      ],
      [
        "CollaborationProcess/DelegationProcess/DelegationPhase/InitiationPhase",
        ["phase_name", "ordinal", "entry_evidence", "exit_criteria"],
      ],
      [
        "CollaborationProcess/DelegationProcess/DelegationPhase/RevocationPhase",
        ["phase_name", "ordinal", "entry_evidence", "exit_criteria"],
      ],
    ]);

    const violations = [...expectedInheritedFields].flatMap(([relativePath, required]) => {
      const present = new Set(fieldIds(nodeAt(relativePath)));
      const missing = required.filter((field) => !present.has(field));
      return missing.length === 0 ? [] : [`${relativePath} omits ${missing.join(", ")}`];
    });

    expect(violations, violations.join("\n")).toEqual([]);

    const inheritedExampleViolations = [...expectedInheritedFields].flatMap(([relativePath, required]) => (
      (nodeAt(relativePath).examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const values = example.field_values;
        const missing = required.filter((field) => (
          typeof values !== "object" || values === null || !(field in values)
        ));
        return missing.length === 0
          ? []
          : [`${relativePath}:${String(example.id)} omits ${missing.join(", ")}`];
      })
    ));
    expect(inheritedExampleViolations, inheritedExampleViolations.join("\n")).toEqual([]);

    const subagentContext = nodeAt(
      "CollaborationProcess/DelegationProcess/DelegationContext/SubagentContext",
    );
    expect(subagentContext.structure?.identity_keys).toContain("delegation_id");

    const ownership = nodeAt("CollaborationProcess/DelegationProcess/WorkerAssignment/DelegationOwnership");
    expect(ownership.parent_relation).toMatchObject({
      predicate: "part_of",
      relation_kind: "composition",
      target: "concept:WorkerAssignment",
    });
  });

  it("gives the local module and the empty-capability boundary inspectable structure", () => {
    const module = nodeAt(".");
    expect(fieldIds(module).length).toBeGreaterThan(0);
    expect(module.structure?.constraints?.length).toBeGreaterThan(0);

    const malformedExamples = (module.examples ?? []).flatMap((example) => (
      localized(example.descriptions)
      && typeof example.field_values === "object"
      && example.field_values !== null
      && Object.keys(example.field_values).length > 0
        ? []
        : [String(example.id)]
    ));
    expect(malformedExamples, malformedExamples.join(", ")).toEqual([]);

    const capabilities = nodeAt("A2AAgentCapabilities");
    const boundary = capabilities.examples?.find((example) => (
      example.id === "a2a-agent-capabilities-boundary-empty"
    ));
    expect(boundary?.field_values).toEqual({ capabilities: {} });
  });
});
