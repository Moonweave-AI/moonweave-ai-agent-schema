import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import Ajv2020, { type AnySchema, type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import moduleSourceFixture from "./fixtures/ontology-v2/module-source.valid.json";
import productSourceFixture from "./fixtures/ontology-v2/product-source.valid.json";

const artifactContractPath = resolve(
  process.cwd(),
  "schemas/source/agent-ontology-artifact-contract.json",
);

const artifactContract = existsSync(artifactContractPath)
  ? (JSON.parse(readFileSync(artifactContractPath, "utf8")) as Record<string, unknown>)
  : undefined;

const replaceConcept = (
  source: typeof moduleSourceFixture,
  conceptId: string,
  replacement: (concept: (typeof moduleSourceFixture.classes)[number]) => unknown,
) => ({
  ...source,
  classes: source.classes.map((concept) =>
    concept.id === conceptId ? replacement(concept) : concept,
  ),
});

const replaceRelation = (
  source: typeof moduleSourceFixture,
  relationId: string,
  replacement: (relation: (typeof moduleSourceFixture.relations)[number]) => unknown,
) => ({
  ...source,
  relations: source.relations.map((relation) =>
    relation.id === relationId ? replacement(relation) : relation,
  ),
});

const canonicalFixture = {
  id: productSourceFixture.product.id,
  labels: productSourceFixture.product.labels,
  short_definitions: productSourceFixture.product.short_definitions,
  definitions: productSourceFixture.product.definitions,
  why_needed: productSourceFixture.product.why_needed,
  includes: productSourceFixture.product.includes,
  excludes: productSourceFixture.product.excludes,
  examples: productSourceFixture.product.examples,
  source_claims: productSourceFixture.product.source_claims,
  status: productSourceFixture.product.status,
  review: productSourceFixture.product.review,
  date: productSourceFixture.product.date,
  artifact_metadata: {
    artifact_kind: "canonical-agent-ontology",
    contract_version: "1.0.0",
    canonical_version: productSourceFixture.product.canonical_version,
    release_channel: "candidate",
    releasable: false,
    generated: true,
    generated_from: [
      "ontology/source/agent-ontology.product.json",
      "ontology/source/tool/tool-invocation-execution.json",
    ],
    do_not_edit: true,
    generator_version: "1.0.0-test",
    generated_at: "2026-07-13T00:00:00.000Z",
    source_tree_sha256: "a".repeat(64),
  },
  planes: productSourceFixture.planes,
  modules: [moduleSourceFixture.module],
  classes: moduleSourceFixture.classes,
  relations: moduleSourceFixture.relations,
  global_constraints: productSourceFixture.global_constraints,
  case_paths: productSourceFixture.case_paths,
  hygiene_gates: productSourceFixture.hygiene_gates,
  ontology_metrics: {
    domains: 1,
    modules: 1,
    concepts: 2,
    taxonomy_roots: 1,
    is_a_relations: 1,
    semantic_relations: 0,
    instance_examples: 0,
    controlled_values: 0,
    structure_fields: 1,
    constraints: 0,
    source_claims: 6,
    case_paths: 0,
    legacy_individuals_remaining: 0,
    legacy_data_properties_remaining: 0,
    legacy_axioms_remaining: 0,
  },
};

const contractValidator = (
  definitionName: "productSource" | "moduleSource" | "canonicalArtifact",
): ValidateFunction => {
  if (artifactContract === undefined) {
    throw new Error(`Missing artifact contract: ${artifactContractPath}`);
  }

  const definitions = artifactContract.$defs;
  if (definitions === undefined || typeof definitions !== "object") {
    throw new Error("Artifact contract must expose a $defs object");
  }

  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    strictTypes: false,
  });
  addFormats(ajv);
  ajv.addKeyword({ keyword: "contract_version", schemaType: "string", valid: true });
  ajv.addKeyword({ keyword: "supported_canonical_major", schemaType: "number", valid: true });
  return ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $ref: `#/$defs/${definitionName}`,
    $defs: definitions,
  } as AnySchema);
};

const validationDiagnostics = (validate: ValidateFunction): string =>
  JSON.stringify(validate.errors ?? [], null, 2);

const expectValid = (
  definitionName: "productSource" | "moduleSource" | "canonicalArtifact",
  value: unknown,
) => {
  const validate = contractValidator(definitionName);
  expect(validate(value), validationDiagnostics(validate)).toBe(true);
};

const expectInvalid = (
  definitionName: "productSource" | "moduleSource" | "canonicalArtifact",
  value: unknown,
): string => {
  const validate = contractValidator(definitionName);
  expect(validate(value), "The malformed fixture unexpectedly satisfied the contract").toBe(false);
  return validationDiagnostics(validate);
};

describe("ontology v2 artifact contract bootstrap", () => {
  it("publishes the independently reviewed Draft 2020-12 artifact contract", () => {
    expect(
      artifactContract,
      `Phase 1 requires ${artifactContractPath} before source or canonical data can be built`,
    ).toBeDefined();
    expect(artifactContract?.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(artifactContract?.$id).toBeTypeOf("string");
    expect(artifactContract?.contract_version).toBeTypeOf("string");
    expect(artifactContract?.supported_canonical_major).toBeTypeOf("number");
    expect(artifactContract?.$defs).toEqual(
      expect.objectContaining({
        productSource: expect.any(Object),
        moduleSource: expect.any(Object),
        canonicalArtifact: expect.any(Object),
      }),
    );
  });
});

describe.runIf(artifactContract !== undefined)("ontology v2 source and canonical shapes", () => {
  it("accepts the minimal reviewed product source", () => {
    expectValid("productSource", productSourceFixture);
  });

  it("accepts the minimal reviewed module source", () => {
    expectValid("moduleSource", moduleSourceFixture);
  });

  it("accepts the minimal AgentOntology -> Domain -> Module -> Concept canonical root", () => {
    expectValid("canonicalArtifact", canonicalFixture);
  });

  it("allows incomplete trilingual information while a concept is draft", () => {
    const draftSource = replaceConcept(
      moduleSourceFixture,
      "ToolCallAttempt",
      (concept) => ({
        ...concept,
        labels: {
          zh: concept.labels.zh,
          en: concept.labels.en,
        },
        definitions: {
          zh: concept.definitions.zh,
          en: concept.definitions.en,
        },
        why_needed: {
          zh: concept.why_needed.zh,
          en: concept.why_needed.en,
        },
        examples: [],
        source_claims: [],
        status: "draft",
      }),
    );

    expectValid("moduleSource", draftSource);
  });

  it("rejects the same incomplete information once the concept is accepted", () => {
    const acceptedSource = replaceConcept(
      moduleSourceFixture,
      "ToolCallAttempt",
      (concept) => ({
        ...concept,
        labels: {
          zh: concept.labels.zh,
          en: concept.labels.en,
        },
        definitions: {
          zh: concept.definitions.zh,
          en: concept.definitions.en,
        },
        why_needed: {
          zh: concept.why_needed.zh,
          en: concept.why_needed.en,
        },
        examples: [],
        source_claims: [],
        status: "accepted",
      }),
    );

    expectInvalid("moduleSource", acceptedSource);
  });

  it("rejects accepted canonical lifecycle state with a draft review decision", () => {
    expectInvalid("canonicalArtifact", {
      ...canonicalFixture,
      status: "accepted",
      review: {
        ...canonicalFixture.review,
        review_status: "draft",
      },
    });
  });

  it("requires a release-channel canonical artifact and review to be accepted", () => {
    expectInvalid("canonicalArtifact", {
      ...canonicalFixture,
      status: "review",
      artifact_metadata: {
        ...canonicalFixture.artifact_metadata,
        release_channel: "release",
        releasable: true,
      },
    });
  });

  it("rejects a deprecated relation without a reviewed retirement contract", () => {
    const malformedSource = replaceRelation(
      moduleSourceFixture,
      "ToolCallAttempt-is_a-InvocationAttempt",
      (relation) => {
        const {
          deprecated_in: _deprecatedIn,
          replaced_by_ids: _replacedByIds,
          deprecation_reason: _deprecationReason,
          ...withoutRetirement
        } = relation;
        return {
          ...withoutRetirement,
          status: "deprecated",
          review: { ...relation.review, review_status: "draft" },
        };
      },
    );

    expectInvalid("moduleSource", malformedSource);
  });

  it("keeps field requiredness and minimum cardinality bidirectionally consistent", () => {
    const malformedSource = replaceConcept(
      moduleSourceFixture,
      "InvocationAttempt",
      (concept) => ({
        ...concept,
        structure: {
          ...concept.structure,
          fields: concept.structure.fields.map((field, index) =>
            index === 0
              ? {
                  ...field,
                  required: false,
                  cardinality: { ...field.cardinality, min: 1 },
                }
              : field,
          ),
        },
      }),
    );

    expectInvalid("moduleSource", malformedSource);
  });

  it("rejects a zero maximum instead of projecting it as an optional scalar", () => {
    const malformedSource = replaceConcept(
      moduleSourceFixture,
      "InvocationAttempt",
      (concept) => ({
        ...concept,
        structure: {
          ...concept.structure,
          fields: concept.structure.fields.map((field, index) =>
            index === 0
              ? {
                  ...field,
                  required: false,
                  cardinality: { min: 0, max: 0 },
                }
              : field,
          ),
        },
      }),
    );

    expectInvalid("moduleSource", malformedSource);
  });

  it("rejects a structure field without a datatype", () => {
    const malformedSource = replaceConcept(
      moduleSourceFixture,
      "InvocationAttempt",
      (concept) => {
        const [field, ...remainingFields] = concept.structure.fields;
        const { datatype: _removedDatatype, ...fieldWithoutDatatype } = field;

        return {
          ...concept,
          structure: {
            ...concept.structure,
            fields: [fieldWithoutDatatype, ...remainingFields],
          },
        };
      },
    );

    expect(expectInvalid("moduleSource", malformedSource)).toContain("datatype");
  });

  it("rejects invented cardinality on an is_a relation", () => {
    const malformedSource = replaceRelation(
      moduleSourceFixture,
      "ToolCallAttempt-is_a-InvocationAttempt",
      (relation) => ({
        ...relation,
        cardinality: {
          source: { min: 0, max: null },
          target: { min: 0, max: null },
        },
      }),
    );

    expect(expectInvalid("moduleSource", malformedSource)).toContain("cardinality");
  });

  it("rejects a case-fragment example without scenario_id", () => {
    const malformedSource = replaceConcept(
      moduleSourceFixture,
      "ToolCallAttempt",
      (concept) => {
        const [example, ...remainingExamples] = concept.examples;
        const { scenario_id: _removedScenarioId, ...caseFragment } = example;

        return {
          ...concept,
          examples: [
            {
              ...caseFragment,
              kind: "case-fragment",
            },
            ...remainingExamples,
          ],
        };
      },
    );

    expect(expectInvalid("moduleSource", malformedSource)).toContain("scenario_id");
  });

  it("rejects legacy duplicate collections at the canonical root", () => {
    const legacyRoot = {
      ...canonicalFixture,
      terms: [],
      object_properties: [],
      data_properties: [],
      individuals: [],
      axioms: [],
      adapter_mappings: [],
    };

    expect(expectInvalid("canonicalArtifact", legacyRoot)).toContain("additionalProperties");
  });

  it("rejects a generated GraphView as the canonical artifact", () => {
    const graphViewRoot = {
      id: "agent-ontology-graph-view",
      artifact_type: "GraphView",
      version: "1.0.0",
      title: "Agent Ontology Graph View",
      review_status: "accepted",
      generated_from: ["ontology/agent-ontology.json"],
      artifacts: [],
      relations: [],
    };

    expect(expectInvalid("canonicalArtifact", graphViewRoot)).toContain("required");
  });

  it("rejects an inverse reading that points to a second relation id", () => {
    const malformedSource = replaceRelation(
      moduleSourceFixture,
      "ToolCallAttempt-is_a-InvocationAttempt",
      (relation) => ({
        ...relation,
        inverse_reading: {
          ...relation.inverse_reading,
          relation_id: "InvocationAttempt-has_subtype-ToolCallAttempt",
        },
      }),
    );

    expect(expectInvalid("moduleSource", malformedSource)).toContain("relation_id");
  });
});
