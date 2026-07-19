import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Localized = { readonly zh: string; readonly en: string; readonly ja: string };

type FeedbackPlane = {
  readonly semantics: {
    readonly short_definition: Localized;
    readonly definition: Localized;
    readonly why_needed: Localized;
  };
  readonly engineering: {
    readonly explanation: Localized;
    readonly typical_input: readonly unknown[];
    readonly typical_output: readonly unknown[];
  };
  readonly structure: {
    readonly fields: readonly { readonly id: string }[];
    readonly constraints: readonly { readonly id: string }[];
  };
  readonly examples: readonly {
    readonly kind: string;
    readonly descriptions: Localized;
    readonly source_claims: readonly string[];
  }[];
  readonly sources: readonly { readonly id: string }[];
  readonly source_claims: readonly { readonly id: string; readonly source: string }[];
};

const feedbackPlane = (): FeedbackPlane => parse(
  readFileSync(resolve("ontology", "feedback-plane", "node.yaml"), "utf8"),
) as FeedbackPlane;

describe("feedback-plane content", () => {
  it("keeps quality judgments distinct from raw observability and links every displayed example to evidence", () => {
    const node = feedbackPlane();

    expect(node.semantics.short_definition.en).not.toEqual(node.semantics.definition.en);
    expect(node.semantics.why_needed.en).not.toEqual(node.semantics.definition.en);
    expect(node.engineering.explanation.en).not.toEqual(node.semantics.definition.en);
    expect(node.engineering.typical_input).not.toHaveLength(0);
    expect(node.engineering.typical_output).not.toHaveLength(0);
    expect(node.structure.fields.map(({ id }) => id)).toEqual(["id", "module_ids"]);
    expect(node.structure.constraints.map(({ id }) => id)).toEqual([
      "feedback-requires-a-quality-criterion",
      "feedback-proposal-is-not-runtime-execution",
    ]);
    expect(new Set(node.examples.map(({ kind }) => kind))).toEqual(new Set([
      "positive",
      "counterexample",
      "boundary",
      "instance",
    ]));
    expect(node.examples.every(({ descriptions, source_claims }) => (
      Boolean(descriptions.zh) && Boolean(descriptions.en) && Boolean(descriptions.ja) && source_claims.length > 0
    ))).toBe(true);

    const sourceIds = new Set(node.sources.map(({ id }) => id));
    expect(node.source_claims.every(({ source }) => sourceIds.has(source))).toBe(true);
    const claimIds = new Set(node.source_claims.map(({ id }) => id));
    expect(node.examples.every(({ source_claims }) => source_claims.every((id) => claimIds.has(id)))).toBe(true);
  });
});
