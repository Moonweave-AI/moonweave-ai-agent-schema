import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildEffectiveConceptStructures } from "../scripts/lib/ontology-concept-structure.mjs";
import {
  REVIEWED_SUBTYPE_DISCRIMINATORS,
  REVIEWED_STRUCTURE_PATCHES,
  addStructuredInstanceExamples,
  applyReviewedStructurePatches,
  applyReviewedSubtypeDiscriminators,
} from "../scripts/lib/ontology-reviewed-structures.mjs";

type LocalizedText = Readonly<Record<"zh" | "en" | "ja", string>>;

type SourceClaim = Readonly<{
  source_id: string;
  supports: string;
  locator: string;
  evidence_kind: string;
  confidence: string;
  review_status: string;
}>;

type Concept = Readonly<{
  id: string;
  module_id: string;
  labels: LocalizedText;
  definitions: LocalizedText;
  source_claims: readonly SourceClaim[];
  structure: Readonly<{
    identity_keys: readonly string[];
    fields: readonly Readonly<{
      id: string;
      labels: LocalizedText;
      datatype: string;
      required: boolean;
      cardinality: Readonly<{ min: number; max: number | null }>;
      definitions: LocalizedText;
      allowed_values: readonly Readonly<{ id: string; value: unknown }>[];
      pattern: string | null;
      example_value: unknown;
      source_claims: readonly SourceClaim[];
    }>[];
    constraints: readonly Readonly<{
      id: string;
      explanations: LocalizedText;
      source_claims: readonly SourceClaim[];
    }>[];
    required_relation_constraints: readonly Readonly<{
      id: string;
      target_concept_id: string;
      explanations: LocalizedText;
      source_claims: readonly SourceClaim[];
    }>[];
  }>;
  examples: readonly Readonly<{
    id: string;
    kind: string;
    field_values: Readonly<Record<string, unknown>>;
    synthetic: boolean;
  }>[];
}>;

type ModuleSource = Readonly<{
  module: Readonly<{ id: string }>;
  classes: readonly Concept[];
  relations: readonly Readonly<{
    id: string;
    predicate: string;
    source_id: string;
    target_id: string;
    status: string;
  }>[];
}>;

const sourceRoot = resolve(import.meta.dirname, "../ontology/source");
const moduleSources = readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((plane) =>
    readdirSync(resolve(sourceRoot, plane.name))
      .filter((name) => name.endsWith(".json"))
      .map(
        (name) =>
          JSON.parse(
            readFileSync(resolve(sourceRoot, plane.name, name), "utf8"),
          ) as ModuleSource,
      ),
  );

const concepts = moduleSources.flatMap(({ classes }) => classes);
const relations = moduleSources.flatMap(({ relations: moduleRelations }) => moduleRelations);
const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
const registeredSourceIds = new Set(
  readFileSync(resolve(import.meta.dirname, "../research/source-registry.csv"), "utf8")
    .split(/\r?\n/u)
    .slice(1)
    .filter(Boolean)
    .map((row) => row.slice(0, row.indexOf(",")).replace(/^"|"$/gu, "")),
);
const localizedValues = (value: LocalizedText) => [value.zh, value.en, value.ja];
const hasCompleteLocalizedText = (value: LocalizedText) =>
  localizedValues(value).every((text) => typeof text === "string" && text.trim().length > 0);
const hasReviewedClaims = (claims: readonly SourceClaim[]) =>
  claims.length > 0 &&
  claims.every(
    (claim) =>
      registeredSourceIds.has(claim.source_id) &&
      claim.source_id.length > 0 &&
      claim.supports.length > 0 &&
      claim.locator.length > 0 &&
      claim.review_status === "accepted",
  );

describe("reviewed Concept structure registry", () => {
  it("covers all 41 Modules with an existing, correctly owned key Concept", () => {
    const moduleIds = moduleSources.map(({ module }) => module.id).sort();
    const coveredModuleIds = [...new Set(REVIEWED_STRUCTURE_PATCHES.map(({ module_id }) => module_id))].sort();

    expect(moduleIds).toHaveLength(41);
    expect(coveredModuleIds).toEqual(moduleIds);
    expect(Object.isFrozen(REVIEWED_STRUCTURE_PATCHES)).toBe(true);
    for (const patch of REVIEWED_STRUCTURE_PATCHES) {
      expect(conceptById.get(patch.concept_id)?.module_id).toBe(patch.module_id);
    }
  });

  it("gives every reviewed key Concept local identity, fields, plain constraints, and relations", () => {
    const patchConceptIds = REVIEWED_STRUCTURE_PATCHES.map(({ concept_id }) => concept_id);
    expect(new Set(patchConceptIds).size).toBe(patchConceptIds.length);

    for (const patch of REVIEWED_STRUCTURE_PATCHES) {
      const fieldIds = patch.structure.fields.map(({ id }) => id);
      const constraintIds = patch.structure.constraints.map(({ id }) => id);
      const relationConstraintIds = patch.structure.required_relation_constraints.map(({ id }) => id);

      expect(patch.structure.identity_keys.length, patch.concept_id).toBeGreaterThan(0);
      expect(fieldIds.length, patch.concept_id).toBeGreaterThan(0);
      expect(constraintIds.length, patch.concept_id).toBeGreaterThan(0);
      expect(relationConstraintIds.length, patch.concept_id).toBeGreaterThan(0);
      expect(new Set(fieldIds).size, patch.concept_id).toBe(fieldIds.length);
      expect(new Set(constraintIds).size, patch.concept_id).toBe(constraintIds.length);
      expect(new Set(relationConstraintIds).size, patch.concept_id).toBe(relationConstraintIds.length);
      expect(patch.structure.identity_keys.every((id) => fieldIds.includes(id))).toBe(true);
      expect(fieldIds.every((id) => /^[A-Za-z][A-Za-z0-9_:-]*$/.test(id) && !id.includes("."))).toBe(true);

      for (const field of patch.structure.fields) {
        expect(hasCompleteLocalizedText(field.labels), `${patch.concept_id}.${field.id} labels`).toBe(true);
        expect(hasCompleteLocalizedText(field.definitions), `${patch.concept_id}.${field.id} definitions`).toBe(true);
        expect(hasReviewedClaims(field.source_claims), `${patch.concept_id}.${field.id} sources`).toBe(true);
        expect(field).toHaveProperty("example_value");
      }
      for (const constraint of patch.structure.constraints) {
        expect(constraint.expression_language).toBe("plain");
        expect(hasCompleteLocalizedText(constraint.explanations)).toBe(true);
        expect(hasReviewedClaims(constraint.source_claims)).toBe(true);
      }
      for (const constraint of patch.structure.required_relation_constraints) {
        expect(conceptById.has(constraint.target_concept_id), `${patch.concept_id} -> ${constraint.target_concept_id}`).toBe(true);
        expect(hasCompleteLocalizedText(constraint.explanations)).toBe(true);
        expect(hasReviewedClaims(constraint.source_claims)).toBe(true);
      }
    }
  });

  it("substantively structures the priority closed-loop Concepts", () => {
    const priorityIds = [
      "RuntimeSession",
      "Task",
      "TaskPlan",
      "ToolCall",
      "ToolCallAttempt",
      "ToolResult",
      "MemoryRecord",
      "Message",
      "EvaluationRun",
      "PolicyDecision",
      "BoundaryCrossing",
      "Adapter",
      "MappingRule",
    ];
    const patchById = new Map(REVIEWED_STRUCTURE_PATCHES.map((patch) => [patch.concept_id, patch]));

    for (const conceptId of priorityIds) {
      const patch = patchById.get(conceptId);
      expect(patch, conceptId).toBeDefined();
      expect(patch?.structure.fields.length, conceptId).toBeGreaterThanOrEqual(3);
      expect(patch?.structure.required_relation_constraints.length, conceptId).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("reviewed Concept structure transforms", () => {
  it("applies patches without mutating input and is idempotent", () => {
    const before = JSON.stringify(concepts);
    const once = applyReviewedStructurePatches(concepts) as readonly Concept[];
    const twice = applyReviewedStructurePatches(once) as readonly Concept[];

    expect(JSON.stringify(concepts)).toBe(before);
    expect(twice).toEqual(once);
    expect(once).not.toBe(concepts);
    for (const concept of once) {
      const fieldIds = concept.structure.fields.map(({ id }) => id);
      const constraintIds = concept.structure.constraints.map(({ id }) => id);
      const relationConstraintIds = concept.structure.required_relation_constraints.map(({ id }) => id);
      expect(new Set(fieldIds).size, `${concept.id} merged fields`).toBe(fieldIds.length);
      expect(new Set(constraintIds).size, `${concept.id} merged constraints`).toBe(constraintIds.length);
      expect(new Set(relationConstraintIds).size, `${concept.id} merged relation constraints`).toBe(
        relationConstraintIds.length,
      );
    }
    for (const patch of REVIEWED_STRUCTURE_PATCHES) {
      const concept = once.find(({ id }) => id === patch.concept_id);
      expect(concept?.structure.identity_keys).toEqual(
        expect.arrayContaining([...patch.structure.identity_keys]),
      );
      for (const field of patch.structure.fields) {
        const matching = concept?.structure.fields.filter(({ id }) => id === field.id) ?? [];
        expect(matching).toHaveLength(1);
        expect(matching[0]).toMatchObject({
          id: field.id,
          labels: field.labels,
          datatype: field.datatype,
          required: field.required,
          cardinality: field.cardinality,
          definitions: field.definitions,
          pattern: field.pattern,
        });
        expect(matching[0].source_claims).toEqual(
          expect.arrayContaining([...field.source_claims]),
        );
      }
    }
  });

  it("adds one structured synthetic instance to every field-bearing Concept", () => {
    const structured = applyReviewedStructurePatches(concepts) as readonly Concept[];
    const before = JSON.stringify(structured);
    const withInstances = addStructuredInstanceExamples(structured, relations) as readonly Concept[];
    const idempotent = addStructuredInstanceExamples(withInstances, relations) as readonly Concept[];
    const effectiveById = buildEffectiveConceptStructures({
      classes: structured,
      relations,
    });

    expect(JSON.stringify(structured)).toBe(before);
    expect(idempotent).toEqual(withInstances);

    for (const concept of withInstances) {
      const fields = effectiveById.get(concept.id)?.fields ?? [];
      const instances = concept.examples.filter(({ kind }) => kind === "instance");
      if (fields.length === 0) {
        expect(instances).toHaveLength(0);
        continue;
      }
      expect(instances).toHaveLength(1);
      expect(instances[0].id).toBe(`${concept.id}-example-instance-001`);
      expect(instances[0].synthetic).toBe(true);
      const sampledFields = fields.filter(
        ({ example_value: value }) => value !== null && value !== undefined,
      );
      expect(Object.keys(instances[0].field_values).sort()).toEqual(
        sampledFields.map(({ id }) => String(id)).sort(),
      );
      for (const field of sampledFields) {
        const repeatable = field.cardinality.max === null || field.cardinality.max > 1;
        const expectedValue = repeatable && !Array.isArray(field.example_value)
          ? [field.example_value]
          : field.example_value;
        expect(instances[0].field_values[String(field.id)]).toEqual(expectedValue);
      }
    }
  });

  it("narrows message roles and content modalities on real subtypes without duplicating graph nodes", () => {
    const structured = applyReviewedStructurePatches(concepts) as readonly Concept[];
    const before = JSON.stringify(structured);
    const specialized = applyReviewedSubtypeDiscriminators({
      concepts: structured,
      relations,
    }) as readonly Concept[];
    const idempotent = applyReviewedSubtypeDiscriminators({
      concepts: specialized,
      relations,
    }) as readonly Concept[];
    const withInstances = addStructuredInstanceExamples(specialized, relations) as readonly Concept[];

    expect(JSON.stringify(structured)).toBe(before);
    expect(idempotent).toEqual(specialized);
    expect(REVIEWED_SUBTYPE_DISCRIMINATORS).toHaveLength(2);

    const message = specialized.find(({ id }) => id === "Message");
    const assistant = specialized.find(({ id }) => id === "AssistantMessage");
    const contentBlock = specialized.find(({ id }) => id === "ContentBlock");
    const audio = specialized.find(({ id }) => id === "AudioBlock");
    expect(
      message?.structure.fields.find(({ id }) => id === "message_role")?.allowed_values
        .map(({ value }: { value: unknown }) => value),
    ).toEqual(expect.arrayContaining(["user", "assistant", "developer", "system", "tool"]));
    expect(
      assistant?.structure.fields.find(({ id }) => id === "message_role")?.allowed_values
        .map(({ value }: { value: unknown }) => value),
    ).toEqual(["assistant"]);
    expect(
      contentBlock?.structure.fields.find(({ id }) => id === "modality")?.allowed_values
        .map(({ value }: { value: unknown }) => value),
    ).toEqual(expect.arrayContaining(["text", "image", "audio", "code", "file"]));
    expect(
      audio?.structure.fields.find(({ id }) => id === "modality")?.allowed_values
        .map(({ value }: { value: unknown }) => value),
    ).toEqual(["audio"]);

    const assistantInstance = withInstances
      .find(({ id }) => id === "AssistantMessage")
      ?.examples.find(({ kind }) => kind === "instance");
    const audioInstance = withInstances
      .find(({ id }) => id === "AudioBlock")
      ?.examples.find(({ kind }) => kind === "instance");
    expect(assistantInstance?.field_values).toMatchObject({
      message_id: "msg-20260714-001",
      message_role: "assistant",
      sender_id: "AgentActor:assistant-001",
    });
    expect(audioInstance?.field_values).toMatchObject({
      block_id: "block-audio-001",
      modality: "audio",
      mime_type: "audio/wav",
      encoding: "binary",
    });
  });

  it("rejects patches whose target Concept or owner does not resolve", () => {
    expect(() => applyReviewedStructurePatches(concepts.filter(({ id }) => id !== "RuntimeSession"))).toThrow(
      /RuntimeSession/u,
    );
    expect(() =>
      applyReviewedStructurePatches(
        concepts.map((concept) =>
          concept.id === "RuntimeSession" ? { ...concept, module_id: "runtime-actors" } : concept,
        ),
      ),
    ).toThrow(/runtime-system/u);
  });

  it("rejects duplicate and internally unresolved reviewed structure decisions", () => {
    const base = structuredClone(REVIEWED_STRUCTURE_PATCHES[0]);
    const applyWith = (patches: unknown[]) =>
      applyReviewedStructurePatches(
        concepts,
        patches as unknown as typeof REVIEWED_STRUCTURE_PATCHES,
      );

    expect(() => applyWith([base, structuredClone(base)])).toThrow(/repeat Concepts/u);
    expect(() =>
      applyWith([
        {
          ...base,
          structure: {
            ...base.structure,
            fields: [...base.structure.fields, base.structure.fields[0]],
          },
        },
      ]),
    ).toThrow(/repeats field IDs/u);
    expect(() =>
      applyWith([
        {
          ...base,
          structure: { ...base.structure, identity_keys: ["missing_local_field"] },
        },
      ]),
    ).toThrow(/identity keys do not resolve/u);
    expect(() =>
      applyWith([
        {
          ...base,
          structure: {
            ...base.structure,
            required_relation_constraints: [
              {
                ...base.structure.required_relation_constraints[0],
                target_concept_id: "MissingConcept",
              },
            ],
          },
        },
      ]),
    ).toThrow(/MissingConcept/u);

    const withBrokenExistingIdentity = concepts.map((concept) =>
      concept.id === base.concept_id
        ? {
            ...concept,
            structure: {
              ...concept.structure,
              identity_keys: ["legacy_missing_field"],
            },
          }
        : concept,
    );
    expect(() =>
      applyReviewedStructurePatches(withBrokenExistingIdentity, [base]),
    ).toThrow(/merged identity keys/u);
  });
});
