import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type SourceClaim = {
  readonly id?: unknown;
  readonly evidence_kind?: unknown;
};

type ParentRelation = {
  readonly predicate?: unknown;
  readonly relation_kind?: unknown;
  readonly target?: unknown;
  readonly source_claims?: readonly unknown[];
  readonly distinct_fact_rationale?: {
    readonly zh?: unknown;
    readonly en?: unknown;
    readonly ja?: unknown;
  };
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly field_values?: unknown;
};

type Node = {
  readonly id?: unknown;
  readonly parent_relation?: ParentRelation | null;
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
  readonly source_claims?: readonly SourceClaim[];
};

const compositionRoot = resolve(
  "ontology",
  "orchestration-plane",
  "orchestration-composition",
);

const nodeAt = (relativePath: string): Node => parse(readFileSync(resolve(
  compositionRoot,
  relativePath,
  "node.yaml",
), "utf8")) as Node;

const fieldIds = (node: Node): readonly string[] => node.structure?.fields?.flatMap((field) => (
  typeof field.id === "string" ? [field.id] : []
)) ?? [];

const requiredFieldIds = (node: Node): readonly string[] => node.structure?.fields?.flatMap((field) => (
  field.required === true && typeof field.id === "string" ? [field.id] : []
)) ?? [];

const identityKeys = (node: Node): readonly string[] => node.structure?.identity_keys?.flatMap((key) => (
  typeof key === "string" ? [key] : []
)) ?? [];

const hasField = (value: unknown, field: string): boolean => (
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.hasOwn(value, field)
);

const hasLocalizedRationale = (value: ParentRelation["distinct_fact_rationale"]): boolean => (
  [value?.zh, value?.en, value?.ja].every((entry) => typeof entry === "string" && entry.trim().length > 0)
);

const hierarchyPairs = [
  ["CompositionActivity/AggregationActivity", "CompositionActivity"],
  ["CompositionActivity/AggregationActivity/Synthesis", "CompositionActivity/AggregationActivity"],
  ["CompositionActivity/AggregationActivity/VotingActivity", "CompositionActivity/AggregationActivity"],
  ["CompositionArtifact/CompositionOutput", "CompositionArtifact"],
  ["CompositionArtifact/CompositionOutput/SynthesisOutput", "CompositionArtifact/CompositionOutput"],
  ["CompositionArtifact/SynthesisInput", "CompositionArtifact"],
  ["CompositionSpecification/AggregationRule/MergeRule", "CompositionSpecification/AggregationRule"],
  ["CompositionSpecification/AggregationRule/VotingRule", "CompositionSpecification/AggregationRule"],
  ["CompositionSpecification/CompositionPart/ChainStage", "CompositionSpecification/CompositionPart"],
  ["CompositionSpecification/CompositionPart/ParallelBranch", "CompositionSpecification/CompositionPart"],
  ["CompositionSpecification/CompositionPart/SectionAssignment", "CompositionSpecification/CompositionPart"],
  ["CompositionSpecification/CompositionPattern/Parallelization", "CompositionSpecification/CompositionPattern"],
  ["CompositionSpecification/CompositionPattern/PromptChain", "CompositionSpecification/CompositionPattern"],
  ["CompositionSpecification/CompositionPattern/Sectioning", "CompositionSpecification/CompositionPattern"],
  ["CompositionSpecification/CompositionPattern/SynthesisPattern", "CompositionSpecification/CompositionPattern"],
  ["CompositionSpecification/CompositionPattern/Voting", "CompositionSpecification/CompositionPattern"],
] as const;

describe("orchestration-composition inheritance contract", () => {
  it("keeps each repaired specialization attached only to its immediate parent", () => {
    const violations = hierarchyPairs.flatMap(([childPath, parentPath]) => {
      const child = nodeAt(childPath);
      const parent = nodeAt(parentPath);
      const relation = child.parent_relation;
      const valid = relation?.predicate === "is_a"
        && relation.relation_kind === "hierarchy"
        && relation.target === `concept:${String(parent.id)}`
        && hasLocalizedRationale(relation.distinct_fact_rationale);
      return valid ? [] : [`${childPath} does not state its immediate ${String(parent.id)} hierarchy`];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("carries the immediate parent identity and required contract into every specialization", () => {
    const violations = hierarchyPairs.flatMap(([childPath, parentPath]) => {
      const child = nodeAt(childPath);
      const parent = nodeAt(parentPath);
      const missingIdentity = identityKeys(parent).filter((key) => !identityKeys(child).includes(key));
      const missingFields = requiredFieldIds(parent).filter((field) => !fieldIds(child).includes(field));
      return [
        ...(missingIdentity.length === 0 ? [] : [`${childPath} omits parent identity ${missingIdentity.join(", ")}`]),
        ...(missingFields.length === 0 ? [] : [`${childPath} omits parent fields ${missingFields.join(", ")}`]),
      ];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("makes positive and instance records complete against both the child and immediate parent contracts", () => {
    const violations = hierarchyPairs.flatMap(([childPath, parentPath]) => {
      const child = nodeAt(childPath);
      const required = [...new Set([...requiredFieldIds(nodeAt(parentPath)), ...requiredFieldIds(child)])];
      return (child.examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const missing = required.filter((field) => !hasField(example.field_values, field));
        return missing.length === 0 ? [] : [`${childPath}:${String(example.id)} omits ${missing.join(", ")}`];
      });
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("grounds each hierarchy assertion in a declared local design-inference claim", () => {
    const violations = hierarchyPairs.flatMap(([childPath]) => {
      const child = nodeAt(childPath);
      const claimsById = new Map((child.source_claims ?? []).flatMap((claim) => (
        typeof claim.id === "string" ? [[claim.id, claim] as const] : []
      )));
      const relationClaims = child.parent_relation?.source_claims ?? [];
      if (relationClaims.length === 0) return [`${childPath} has no hierarchy source claim`];
      return relationClaims.flatMap((claimId) => {
        const claim = typeof claimId === "string" ? claimsById.get(claimId) : undefined;
        return claim?.evidence_kind === "design-inference"
          ? []
          : [`${childPath}:${String(claimId)} is not a declared design-inference claim`];
      });
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
