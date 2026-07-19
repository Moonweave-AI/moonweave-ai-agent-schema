import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

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

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Example = {
  readonly id?: unknown;
  readonly kind?: unknown;
  readonly field_values?: unknown;
};

type Source = {
  readonly id?: unknown;
  readonly source_type?: unknown;
};

type SourceClaim = {
  readonly id?: unknown;
  readonly source?: unknown;
  readonly evidence_kind?: unknown;
};

type Relation = {
  readonly id?: unknown;
  readonly predicate?: unknown;
  readonly relation_kind?: unknown;
  readonly target?: unknown;
};

type Node = {
  readonly parent_relation?: ParentRelation | null;
  readonly relations?: readonly Relation[];
  readonly structure?: {
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
  readonly sources?: readonly Source[];
  readonly source_claims?: readonly SourceClaim[];
};

const routingRoot = resolve(
  "ontology",
  "orchestration-plane",
  "orchestration-routing-control",
);

const nodeAt = (relativePath: string): Node => parse(readFileSync(resolve(
  routingRoot,
  relativePath,
  "node.yaml",
), "utf8")) as Node;

const fieldIds = (node: Node): readonly string[] => node.structure?.fields?.flatMap((field) => (
  typeof field.id === "string" ? [field.id] : []
)) ?? [];

const requiredFieldIds = (node: Node): readonly string[] => node.structure?.fields?.flatMap((field) => (
  field.required === true && typeof field.id === "string" ? [field.id] : []
)) ?? [];

const hasField = (value: unknown, field: string): boolean => (
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.hasOwn(value, field)
);

const isLocalized = (value: ParentRelation["distinct_fact_rationale"]): boolean => (
  [value?.zh, value?.en, value?.ja].every((entry) => typeof entry === "string" && entry.trim().length > 0)
);

describe("routing-control structural repair", () => {
  it("models RetryPolicy as an optional composition of RoutingSpecification", () => {
    expect(nodeAt("RoutingSpecification/RetryPolicy").parent_relation).toMatchObject({
      predicate: "part_of",
      relation_kind: "composition",
      target: "concept:RoutingSpecification",
    });
    expect(nodeAt("RoutingSpecification/RetryPolicy").parent_relation?.source_claims).toContain(
      "moonweave-retry-policy-composition",
    );
  });

  it("uses composition only for the routing-profile components that physically belong to RoutingSpecification", () => {
    const violations = [
      "RoutingSpecification/RetryPolicy",
      "RoutingSpecification/Route",
      "RoutingSpecification/RoutingCondition",
      "RoutingSpecification/RoutingPolicy",
    ].flatMap((path) => {
      const relation = nodeAt(path).parent_relation;
      const valid = relation?.predicate === "part_of"
        && relation.relation_kind === "composition"
        && relation.target === "concept:RoutingSpecification"
        && Array.isArray(relation.source_claims)
        && relation.source_claims.length > 0
        && isLocalized(relation.distinct_fact_rationale);
      return valid ? [] : [path];
    });

    expect(violations, violations.join(", ")).toEqual([]);
  });

  it("uses hierarchy only for the three genuine RoutingCondition specializations and retains their contract", () => {
    const parent = nodeAt("RoutingSpecification/RoutingCondition");
    const parentRequired = requiredFieldIds(parent);
    const violations = [
      "RoutingSpecification/RoutingCondition/BranchCondition",
      "RoutingSpecification/RoutingCondition/GateCondition",
      "RoutingSpecification/RoutingCondition/StopCondition",
    ].flatMap((path) => {
      const child = nodeAt(path);
      const relation = child.parent_relation;
      const missingFields = parentRequired.filter((field) => !fieldIds(child).includes(field));
      const malformedExamples = (child.examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const missing = parentRequired.filter((field) => !hasField(example.field_values, field));
        return missing.length === 0 ? [] : [`${path}:${String(example.id)} omits ${missing.join(", ")}`];
      });
      const validRelation = relation?.predicate === "is_a"
        && relation.relation_kind === "hierarchy"
        && relation.target === "concept:RoutingCondition"
        && isLocalized(relation.distinct_fact_rationale);
      return [
        ...(validRelation ? [] : [`${path} has no RoutingCondition hierarchy relation`]),
        ...(missingFields.length === 0 ? [] : [`${path} omits ${missingFields.join(", ")}`]),
        ...malformedExamples,
      ];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("anchors every local composition or hierarchy decision in an explicit local design inference", () => {
    const paths = [
      "RoutingSpecification/RetryPolicy",
      "RoutingSpecification/Route",
      "RoutingSpecification/RoutingCondition",
      "RoutingSpecification/RoutingPolicy",
      "RoutingSpecification/RoutingCondition/BranchCondition",
      "RoutingSpecification/RoutingCondition/GateCondition",
      "RoutingSpecification/RoutingCondition/StopCondition",
    ];
    const violations = paths.flatMap((path) => {
      const node = nodeAt(path);
      const claimsById = new Map((node.source_claims ?? []).flatMap((claim) => (
        typeof claim.id === "string" ? [[claim.id, claim] as const] : []
      )));
      const sourceTypeById = new Map((node.sources ?? []).flatMap((source) => (
        typeof source.id === "string" && typeof source.source_type === "string"
          ? [[source.id, source.source_type] as const]
          : []
      )));
      return (node.parent_relation?.source_claims ?? []).flatMap((claimId) => {
        if (typeof claimId !== "string") return [`${path} has a non-string structural claim reference`];
        const claim = claimsById.get(claimId);
        const valid = claim?.evidence_kind === "design-inference"
          && typeof claim.source === "string"
          && sourceTypeById.get(claim.source) === "design-inference";
        return valid ? [] : [`${path}:${claimId} is not a local design inference`];
      });
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("gives every positive and concrete example the required shape of its own node", () => {
    const paths = [
      ".",
      "GateOutcome",
      "RoutingDecision",
      "RoutingSpecification",
      "RoutingSpecification/RetryPolicy",
      "RoutingSpecification/Route",
      "RoutingSpecification/RoutingCondition",
      "RoutingSpecification/RoutingCondition/BranchCondition",
      "RoutingSpecification/RoutingCondition/GateCondition",
      "RoutingSpecification/RoutingCondition/StopCondition",
      "RoutingSpecification/RoutingPolicy",
      "RoutingTarget",
      "SuccessorDispatch",
    ];
    const violations = paths.flatMap((path) => {
      const required = requiredFieldIds(nodeAt(path));
      return (nodeAt(path).examples ?? []).flatMap((example) => {
        if (example.kind !== "positive" && example.kind !== "instance") return [];
        const missing = required.filter((field) => !hasField(example.field_values, field));
        return missing.length === 0 ? [] : [`${path}:${String(example.id)} omits ${missing.join(", ")}`];
      });
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps outcome, target, decision, and dispatch as independent root records with their factual links", () => {
    for (const path of ["GateOutcome", "RoutingTarget", "RoutingDecision", "SuccessorDispatch"]) {
      expect(nodeAt(path).parent_relation ?? null).toBeNull();
    }
    expect(nodeAt("GateOutcome").relations).toContainEqual(expect.objectContaining({
      id: "GateOutcome-outcome_of-Gate",
      predicate: "outcome_of",
      relation_kind: "information",
      target: "concept:Gate",
    }));
    expect(nodeAt("RoutingDecision").relations).toContainEqual(expect.objectContaining({
      id: "RoutingDecision-records-RoutingTarget",
      predicate: "records",
      relation_kind: "information",
      target: "concept:RoutingTarget",
    }));
    expect(nodeAt("SuccessorDispatch").relations).toContainEqual(expect.objectContaining({
      id: "SuccessorDispatch-follows-GateOutcome",
      predicate: "follows",
      relation_kind: "temporal",
      target: "concept:GateOutcome",
    }));
    expect(nodeAt("SuccessorDispatch").relations).toContainEqual(expect.objectContaining({
      id: "SuccessorDispatch-targets-RoutingTarget",
      predicate: "targets",
      relation_kind: "information",
      target: "concept:RoutingTarget",
    }));
  });

  it("labels claims from official documentation as official-doc evidence rather than normative standards", () => {
    const paths = [
      ".",
      "GateOutcome",
      "RoutingDecision",
      "RoutingSpecification",
      "RoutingSpecification/RetryPolicy",
      "RoutingSpecification/Route",
      "RoutingSpecification/RoutingCondition",
      "RoutingSpecification/RoutingCondition/BranchCondition",
      "RoutingSpecification/RoutingCondition/GateCondition",
      "RoutingSpecification/RoutingCondition/StopCondition",
      "RoutingSpecification/RoutingPolicy",
      "RoutingTarget",
      "SuccessorDispatch",
    ];
    const violations = paths.flatMap((path) => {
      const node = nodeAt(path);
      const sourceTypeById = new Map((node.sources ?? []).flatMap((source) => (
        typeof source.id === "string" && typeof source.source_type === "string"
          ? [[source.id, source.source_type] as const]
          : []
      )));
      return (node.source_claims ?? []).flatMap((claim) => (
        typeof claim.source === "string" && ["official-documentation", "official-doc"].includes(String(sourceTypeById.get(claim.source)))
          && claim.evidence_kind !== "official-doc"
          ? [`${path}:${claim.source} is not official-doc evidence`]
          : []
      ));
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("uses the canonical official-doc source type for documentation sources", () => {
    const paths = [
      ".",
      "GateOutcome",
      "RoutingDecision",
      "RoutingSpecification",
      "RoutingSpecification/RetryPolicy",
      "RoutingSpecification/Route",
      "RoutingSpecification/RoutingCondition",
      "RoutingSpecification/RoutingCondition/BranchCondition",
      "RoutingSpecification/RoutingCondition/GateCondition",
      "RoutingSpecification/RoutingCondition/StopCondition",
      "RoutingSpecification/RoutingPolicy",
      "RoutingTarget",
      "SuccessorDispatch",
    ];
    const violations = paths.flatMap((path) => (nodeAt(path).sources ?? []).flatMap((source) => (
      source.source_type === "official-documentation"
        ? [`${path}:${String(source.id)} uses legacy official-documentation`]
        : []
    )));

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps every declared source and source claim in this slice attributable", () => {
    const paths = [
      ".",
      "GateOutcome",
      "RoutingDecision",
      "RoutingSpecification",
      "RoutingSpecification/RetryPolicy",
      "RoutingSpecification/Route",
      "RoutingSpecification/RoutingCondition",
      "RoutingSpecification/RoutingCondition/BranchCondition",
      "RoutingSpecification/RoutingCondition/GateCondition",
      "RoutingSpecification/RoutingCondition/StopCondition",
      "RoutingSpecification/RoutingPolicy",
      "RoutingTarget",
      "SuccessorDispatch",
    ];
    const violations = paths.flatMap((path) => {
      const node = nodeAt(path);
      const declared = new Set((node.sources ?? []).flatMap((source) => (
        typeof source.id === "string" ? [source.id] : []
      )));
      const claimed = new Set((node.source_claims ?? []).flatMap((claim) => (
        typeof claim.source === "string" ? [claim.source] : []
      )));
      const danglingClaims = (node.source_claims ?? []).flatMap((claim) => (
        typeof claim.source === "string" && !declared.has(claim.source)
          ? [`${path}:${String(claim.id)} has no declared source`]
          : []
      ));
      const unusedSources = [...declared].flatMap((sourceId) => (
        claimed.has(sourceId) ? [] : [`${path}:${sourceId} is never claimed`]
      ));
      return [...danglingClaims, ...unusedSources];
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
