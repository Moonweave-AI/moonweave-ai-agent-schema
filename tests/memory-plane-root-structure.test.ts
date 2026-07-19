import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const memoryPlane = (): RecordValue => parse(readFileSync(
  resolve("ontology", "memory-plane", "node.yaml"),
  "utf8",
)) as RecordValue;

const fieldIds = (node: RecordValue): readonly string[] => {
  const structure = node.structure;
  if (!isRecord(structure) || !Array.isArray(structure.fields)) return [];
  return structure.fields.flatMap((field) => (
    isRecord(field) && typeof field.id === "string" ? [field.id] : []
  ));
};

describe("memory-plane root boundary", () => {
  it("makes durable memory lifecycle and scope inspectable rather than treating context as a synonym", () => {
    const node = memoryPlane();
    const structure = isRecord(node.structure) ? node.structure : {};
    expect(structure.identity_keys).toEqual(["domain_id"]);
    expect(fieldIds(node)).toEqual([
      "domain_id",
      "managed_concerns",
      "persistence_boundary",
    ]);

    const examples = Array.isArray(node.examples) ? node.examples : [];
    expect(new Set(examples.flatMap((example) => (
      isRecord(example) && typeof example.kind === "string" ? [example.kind] : []
    )))).toEqual(new Set(["positive", "counterexample", "boundary", "instance"]));

    const malformedExamples = examples.flatMap((example) => {
      if (!isRecord(example) || !isRecord(example.field_values)) return ["missing field shape"];
      return ["domain_id", "managed_concerns", "persistence_boundary"].filter((field) => (
        !(field in example.field_values)
      ));
    });
    expect(malformedExamples, malformedExamples.join(", ")).toEqual([]);
  });

  it("separates direct source facts from the local domain taxonomy", () => {
    const node = memoryPlane();
    const sources = Array.isArray(node.sources) ? node.sources : [];
    const sourceIds = new Set(sources.flatMap((source) => (
      isRecord(source) && typeof source.id === "string" ? [source.id] : []
    )));
    for (const sourceId of [
      "langgraph-persistence-docs",
      "openai-agents-sdk-sessions",
      "letta-stateful-agents",
      "rag-paper",
      "moonweave-ontology-design",
    ]) expect(sourceIds).toContain(sourceId);

    const claims = Array.isArray(node.source_claims) ? node.source_claims : [];
    const boundaryClaim = claims.find((claim) => (
      isRecord(claim) && claim.id === "claim-memory-domain-boundary"
    ));
    expect(boundaryClaim).toMatchObject({
      source: "moonweave-ontology-design",
      evidence_kind: "ontology-design-inference",
    });
  });
});
