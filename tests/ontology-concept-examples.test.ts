import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { enrichConceptExamplesWithRelations } from "../scripts/lib/ontology-concept-examples.mjs";

const text = (value: string) => ({ zh: value, en: value, ja: value });
const example = (kind: "positive" | "boundary") => ({
  id: `Child-example-${kind}`,
  kind,
  descriptions: text("base"),
  field_values: {},
  related_node_ids: ["Child"],
  related_relation_ids: [],
  expected_result: text("base"),
  why_valid_or_invalid: text("base"),
  source_claims: [],
});
const relation = {
  id: "Child-is_a-Parent",
  predicate: "is_a",
  source_id: "Child",
  target_id: "Parent",
  status: "accepted",
  source_claims: [{
    source_id: "source-1",
    supports: "supports relation",
    locator: "Section > relation",
    evidence_kind: "design-inference",
  }],
};

describe("Concept examples anchored to the unified graph", () => {
  it("adds an actual incident relation without mutating the input graph", () => {
    const concepts = [
      {
        id: "Child",
        primary_parent_relation_id: relation.id,
        examples: [example("positive"), example("boundary")],
      },
      { id: "Parent", primary_parent_relation_id: null, examples: [] },
    ];
    const before = structuredClone(concepts);

    const enriched = enrichConceptExamplesWithRelations({ concepts, relations: [relation] });

    expect(concepts).toEqual(before);
    expect(enriched).not.toBe(concepts);
    for (const enrichedExample of enriched[0].examples) {
      expect(enrichedExample.related_node_ids).toEqual(["Child", "Parent"]);
      expect(enrichedExample.related_relation_ids).toEqual([relation.id]);
      expect(enrichedExample.descriptions.en).toContain(relation.id);
      expect(enrichedExample.source_claims).toEqual(relation.source_claims);
    }
  });

  it("keeps non-classification examples unchanged", () => {
    const instance = { ...example("positive"), id: "Child-instance", kind: "instance" };
    const [enriched] = enrichConceptExamplesWithRelations({
      concepts: [{ id: "Child", primary_parent_relation_id: relation.id, examples: [instance] }],
      relations: [relation],
    });

    expect(enriched.examples[0]).toEqual(instance);
    expect(enriched.examples[0]).not.toBe(instance);
  });

  it("derives concept-specific boundaries from reviewed parents, siblings, fields, and facts", () => {
    const concepts = [
      {
        id: "Parent",
        labels: text("parent"),
        definitions: text("Parent is the reviewed common genus."),
        why_needed: text("placeholder"),
        includes: [text("placeholder")],
        excludes: [text("placeholder")],
        semantic_kind: "information",
        primary_parent_relation_id: null,
        structure: { fields: [] },
        examples: [example("positive"), example("boundary")],
        source_claims: [],
      },
      {
        id: "Child",
        labels: text("child"),
        definitions: text("Child is a Parent distinguished by a reviewed discriminator."),
        why_needed: text("placeholder"),
        includes: [text("placeholder")],
        excludes: [text("placeholder")],
        semantic_kind: "information",
        primary_parent_relation_id: relation.id,
        structure: {
          fields: [{ id: "discriminator", required: true, example_value: "reviewed" }],
        },
        examples: [
          example("positive"),
          example("boundary"),
          {
            ...example("positive"),
            id: "Child-example-instance-001",
            kind: "instance",
            field_values: { discriminator: "reviewed" },
          },
        ],
        source_claims: [],
      },
      {
        id: "Sibling",
        labels: text("sibling"),
        definitions: text("Sibling is a Parent with a different reviewed discriminator."),
        why_needed: text("placeholder"),
        includes: [text("placeholder")],
        excludes: [text("placeholder")],
        semantic_kind: "information",
        primary_parent_relation_id: "Sibling-is_a-Parent",
        structure: { fields: [] },
        examples: [example("positive"), example("boundary")],
        source_claims: [],
      },
      {
        id: "Target",
        labels: text("target"),
        definitions: text("Target is the reviewed endpoint."),
        why_needed: text("placeholder"),
        includes: [text("placeholder")],
        excludes: [text("placeholder")],
        semantic_kind: "information",
        primary_parent_relation_id: null,
        structure: { fields: [] },
        examples: [example("positive"), example("boundary")],
        source_claims: [],
      },
    ];
    const semanticFact = {
      ...relation,
      id: "Child-references-Target",
      predicate: "references",
      source_id: "Child",
      target_id: "Target",
    };

    const enriched = enrichConceptExamplesWithRelations({
      concepts,
      relations: [
        relation,
        { ...relation, id: "Sibling-is_a-Parent", source_id: "Sibling" },
        semanticFact,
      ],
    });
    const child = enriched.find(({ id }) => id === "Child");
    expect(child).toBeDefined();
    if (child === undefined) throw new Error("Expected hardened Child concept");
    const positive = child.examples.find(({ kind }) => kind === "positive");
    const boundary = child.examples.find(({ kind }) => kind === "boundary");
    expect(positive).toBeDefined();
    expect(boundary).toBeDefined();
    if (positive === undefined || boundary === undefined) {
      throw new Error("Expected positive and boundary examples for Child");
    }

    expect(child.why_needed.en).toContain(semanticFact.id);
    expect(child.why_needed.en).toContain("Sibling");
    expect(child.includes[0].en).toContain("discriminator");
    expect(child.excludes[0].en).toContain("Sibling");
    expect(positive.field_values).toEqual({ discriminator: "reviewed" });
    expect(positive.related_relation_ids).toContain(semanticFact.id);
    expect(boundary.related_node_ids).toContain("Sibling");
    expect(boundary.descriptions.en).toContain("Sibling");
    expect(JSON.stringify(child)).not.toMatch(/synthetic audit scenario|classified as .*under the reviewed definition|definition boundary and ownership conditions/iu);
  });

  it("ensures every accepted source Concept with an incident relation cites a real fact", () => {
    const sourceRoot = resolve(import.meta.dirname, "../ontology/source");
    const moduleFiles = readdirSync(sourceRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((plane) =>
        readdirSync(resolve(sourceRoot, plane.name))
          .filter((name) => name.endsWith(".json"))
          .map((name) => resolve(sourceRoot, plane.name, name)),
      );
    const modules = moduleFiles.map((path) => JSON.parse(readFileSync(path, "utf8")));
    const concepts = modules.flatMap(({ classes }) => classes);
    const relations = modules.flatMap(({ relations: facts }) => facts);
    const relationById = new Map(relations.map((fact) => [fact.id, fact]));
    const incidentIds = new Set(
      relations.flatMap(({ source_id: sourceId, target_id: targetId }) => [sourceId, targetId]),
    );

    for (const concept of concepts.filter(({ id }) => incidentIds.has(id))) {
      for (const item of concept.examples.filter(({ kind }: { kind: string }) =>
        ["positive", "boundary", "counterexample"].includes(kind),
      )) {
        expect(item.related_relation_ids.length, `${concept.id}/${item.id}`).toBeGreaterThan(0);
        for (const relationId of item.related_relation_ids) {
          const fact = relationById.get(relationId);
          expect(fact, `${concept.id}/${item.id}/${relationId}`).toBeDefined();
          expect(
            fact.source_id === concept.id || fact.target_id === concept.id,
            `${concept.id}/${item.id}/${relationId}`,
          ).toBe(true);
        }
      }
    }
  });
});
