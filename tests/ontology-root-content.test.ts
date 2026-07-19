import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type RootNode = {
  readonly semantics: {
    readonly short_definition: { readonly en: string };
    readonly definition: { readonly en: string };
  };
  readonly engineering: {
    readonly explanation: { readonly en: string };
    readonly typical_input: readonly unknown[];
    readonly typical_output: readonly unknown[];
  };
  readonly structure: {
    readonly fields: readonly { readonly id: string }[];
    readonly constraints: readonly { readonly id: string }[];
  };
  readonly examples: readonly { readonly kind: string }[];
  readonly sources: readonly {
    readonly id: string;
    readonly review?: unknown;
    readonly status?: unknown;
  }[];
  readonly source_claims: readonly { readonly source: string }[];
};

const rootNode = (): RootNode => parse(
  readFileSync(resolve("ontology", "node.yaml"), "utf8"),
) as RootNode;

describe("ontology root content", () => {
  it("keeps the root definition, engineering guidance, examples, structure, and evidence distinct", () => {
    const node = rootNode();

    expect(node.semantics.short_definition.en).not.toEqual(node.semantics.definition.en);
    expect(node.engineering.explanation.en).not.toEqual(node.semantics.definition.en);
    expect(node.engineering.typical_input).not.toHaveLength(0);
    expect(node.engineering.typical_output).not.toHaveLength(0);
    expect(node.structure.fields.map(({ id }) => id)).toEqual(["id", "domain_ids"]);
    expect(node.structure.constraints.map(({ id }) => id)).toEqual([
      "root-id-is-stable",
      "domain-boundaries-are-explicit",
    ]);
    expect(new Set(node.examples.map(({ kind }) => kind))).toEqual(new Set([
      "positive",
      "counterexample",
      "boundary",
      "instance",
    ]));

    const sourceIds = new Set(node.sources.map(({ id }) => id));
    expect(sourceIds).toEqual(new Set([
      "eng-ont-prov-o",
      "eng-proto-a2a-spec",
      "eng-proto-mcp-spec",
    ]));
    expect(node.source_claims.map(({ source }) => source).every((source) => sourceIds.has(source))).toBe(true);
    expect(node.sources.every((source) => source.review === undefined && source.status === undefined)).toBe(true);
  });
});
