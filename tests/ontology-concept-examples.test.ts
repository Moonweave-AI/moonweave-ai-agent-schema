import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { enrichConceptExamplesWithRelations } from "../scripts/lib/ontology-concept-examples.mjs";

const text = (value: string) => ({ zh: value, en: value, ja: value });
const withoutTerminalPunctuation = (value: string) =>
  value.trim().replace(/[。．.!?！？]+$/gu, "");
const example = (kind: "positive" | "boundary") => ({
  id: `Child-example-${kind}`,
  kind,
  scenario_id: null,
  synthetic: true,
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

  it("writes concrete trilingual Agent scenarios for all eight ontology domains", () => {
    const modules = [
      "info-content-block-modality",
      "orchestration-delegation-handoff",
      "runtime-execution-attempts",
      "adapter-frameworks",
      "tool-invocation-execution",
      "safety-permission-policy",
      "feedback-metrics-evaluation",
      "memory-retrieval-ranking",
    ];
    const concepts = modules.flatMap((moduleId, index) => {
      const conceptId = `ScenarioConcept${index}`;
      const targetId = `ScenarioTarget${index}`;
      return [
        {
          id: conceptId,
          module_id: moduleId,
          labels: text(`scenario concept ${index}`),
          short_definitions: text(`scenario concept ${index} has a reviewed operational identity`),
          definitions: text(`Scenario concept ${index} is distinguished in a concrete Agent operation.`),
          why_needed: text("placeholder"),
          includes: [text("placeholder")],
          excludes: [text("placeholder")],
          semantic_kind: "information",
          primary_parent_relation_id: null,
          structure: {
            fields: [{ id: "sample", required: true, example_value: `value-${index}` }],
          },
          examples: [{ ...example("positive"), synthetic: true }],
          source_claims: [],
        },
        {
          id: targetId,
          module_id: moduleId,
          labels: text(`scenario target ${index}`),
          short_definitions: text(`scenario target ${index} is the reviewed destination`),
          definitions: text(`Scenario target ${index} is a concrete relation destination.`),
          why_needed: text("placeholder"),
          includes: [text("placeholder")],
          excludes: [text("placeholder")],
          semantic_kind: "information",
          primary_parent_relation_id: null,
          structure: { fields: [] },
          examples: [],
          source_claims: [],
        },
      ];
    });
    const relations = modules.map((_, index) => ({
      ...relation,
      id: `ScenarioConcept${index}-records-ScenarioTarget${index}`,
      predicate: "records",
      source_id: `ScenarioConcept${index}`,
      target_id: `ScenarioTarget${index}`,
    }));

    const enriched = enrichConceptExamplesWithRelations({ concepts, relations });
    const forbidden = /verifiable graph fragment|occupies the (?:source|target) endpoint|satisfies the identity conditions.*participates|in an auditable agent run/iu;
    const expectedScenarioCues = [
      "multimodal assistant run",
      "coordinator run",
      "traced task execution",
      "integration build",
      "agent tool-use run",
      "guarded agent run",
      "evaluation and correction cycle",
      "retrieval-augmented memory run",
    ];
    for (const [index, cue] of expectedScenarioCues.entries()) {
      const concept = enriched.find(({ id }) => id === `ScenarioConcept${index}`);
      const positive = concept?.examples.find(({ kind }) => kind === "positive");
      expect(positive, `domain scenario ${index}`).toBeDefined();
      expect(positive?.scenario_id).toBeNull();
      expect(positive?.descriptions.en).toContain(cue);
      expect(positive?.descriptions.en).toContain(
        `ScenarioConcept${index} records ScenarioTarget${index}`,
      );
      expect(positive?.descriptions.en).toContain(`value-${index}`);
      expect(positive?.descriptions.en).toContain(
        `Scenario concept ${index} is distinguished in a concrete Agent operation`,
      );
      expect(positive?.descriptions.en).toMatch(/^During .+, the system records /u);
      expect(positive?.descriptions.en).toContain("Its reviewed definition is “");
      expect(positive?.descriptions.en).toContain('. Its reviewed definition is “');
      expect(positive?.descriptions.en).not.toMatch(/while the system/u);
      expect(positive?.descriptions.zh).toMatch(/^在一次.+中，系统将/u);
      expect(positive?.descriptions.zh).toContain("其已审查定义是“");
      expect(positive?.descriptions.zh).not.toMatch(/系统正在.+时，系统/u);
      expect(positive?.descriptions.ja).toContain("審査済み定義は「");
      expect(positive?.descriptions.zh).not.toMatch(/[。．.!?！？]”[。．.!?！？]/u);
      expect(positive?.descriptions.en).not.toMatch(/[.!?]”[.!?]/u);
      expect(positive?.descriptions.ja).not.toMatch(/[。．.!?！？]」/u);
      expect(positive?.descriptions.en).not.toMatch(forbidden);
      expect(positive?.descriptions.zh).not.toBe(positive?.descriptions.en);
      expect(positive?.descriptions.ja).not.toBe(positive?.descriptions.en);
    }
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

  it("keeps every accepted source Concept positive example in a concrete Agent scenario", () => {
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
    const forbidden = /verifiable graph fragment|occupies the (?:source|target) endpoint|satisfies the identity conditions.*participates|in an auditable agent run/iu;
    const scenarioCue = /multimodal assistant run|coordinator run|traced task execution|integration build|agent tool-use run|guarded agent run|evaluation and correction cycle|retrieval-augmented memory run/iu;

    for (const concept of concepts.filter(({ status }) => status === "accepted")) {
      const positives = concept.examples.filter(({ kind }: { kind: string }) => kind === "positive");
      expect(positives.length, concept.id).toBeGreaterThan(0);
      for (const positive of positives) {
        expect(positive.scenario_id, `${concept.id}/${positive.id}`).toBeNull();
        expect(positive.synthetic, `${concept.id}/${positive.id}`).toBe(true);
        expect(positive.descriptions.en, `${concept.id}/${positive.id}`).toMatch(scenarioCue);
        expect(positive.descriptions.en, `${concept.id}/${positive.id}`).not.toMatch(forbidden);
        expect(positive.descriptions.en, `${concept.id}/${positive.id}`).toMatch(
          /^During .+, the system records /u,
        );
        expect(positive.descriptions.en, `${concept.id}/${positive.id}`).toContain(
          "Its reviewed definition is “",
        );
        expect(positive.descriptions.en, `${concept.id}/${positive.id}`).toContain(
          '. Its reviewed definition is “',
        );
        expect(positive.descriptions.en, `${concept.id}/${positive.id}`).not.toMatch(/while the system/u);
        expect(positive.descriptions.zh, `${concept.id}/${positive.id}`).toMatch(
          /^在一次.+中，系统将/u,
        );
        expect(positive.descriptions.zh, `${concept.id}/${positive.id}`).toContain(
          "其已审查定义是“",
        );
        expect(positive.descriptions.zh, `${concept.id}/${positive.id}`).not.toMatch(
          /系统正在.+时，系统/u,
        );
        expect(positive.descriptions.ja, `${concept.id}/${positive.id}`).toContain(
          "審査済み定義は「",
        );
        const relationId = positive.related_relation_ids[0];
        const fact = relationById.get(relationId);
        expect(fact, `${concept.id}/${positive.id}/${relationId}`).toBeDefined();
        expect(positive.descriptions.en).toContain(
          `${fact.source_id} ${fact.predicate} ${fact.target_id}`,
        );
        for (const language of ["zh", "en", "ja"] as const) {
          expect(positive.descriptions[language]).toContain(
            withoutTerminalPunctuation(concept.definitions[language]),
          );
        }
        expect(positive.descriptions.zh, `${concept.id}/${positive.id}`).not.toMatch(
          /[。．.!?！？]”[。．.!?！？]/u,
        );
        expect(positive.descriptions.en, `${concept.id}/${positive.id}`).not.toMatch(
          /[.!?]”[.!?]/u,
        );
        expect(positive.descriptions.ja, `${concept.id}/${positive.id}`).not.toMatch(
          /[。．.!?！？]」/u,
        );
        for (const value of Object.values(positive.field_values ?? {})) {
          const serialized = JSON.stringify(value);
          expect(positive.descriptions.en, `${concept.id}/${positive.id}/${serialized}`).toContain(
            serialized.length > 80 ? serialized.slice(0, 77) : serialized,
          );
        }
      }
    }
  });
});
