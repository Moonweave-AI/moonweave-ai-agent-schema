import { describe, expect, it } from "vitest";

import type { CanonicalConcept, CanonicalOntology } from "../src/lib/ontology-index";
import { deriveConversionWarnings } from "../src/profiles/conversionWarnings";
import {
  exportCanonicalJsonLd,
  exportConceptShacl,
  exportRelationOwl,
  semanticNamespaces,
} from "../src/profiles/semanticExports";
import { createZodProfileFromConcept } from "../src/profiles/zodProfile";
import { ontologyViewModelFixture } from "./fixtures/ontology-view-model.fixture";

const concept = {
  id: "ProfileSubject",
  module_id: "run-lifecycle",
  semantic_kind: "entity",
  structure: {
    identity_keys: ["status"],
    fields: [
      {
        id: "status",
        labels: { zh: "状态", en: "Status", ja: "状態" },
        datatype: "string",
        required: true,
        cardinality: { min: 1, max: 1 },
        definitions: { zh: "状态", en: "Status", ja: "状態" },
        allowed_values: [
          {
            id: "ready",
            value: "ready",
            labels: { zh: "就绪", en: "Ready", ja: "準備完了" },
            definitions: { zh: "就绪", en: "Ready", ja: "準備完了" },
            status: "accepted",
            source_claims: [],
          },
        ],
        pattern: null,
        example_value: "ready",
        source_claims: [],
      },
    ],
    constraints: [
      {
        id: "profile-warning",
        severity: "warning",
        expression: "status == ready",
        explanations: { zh: "检查状态", en: "Check status", ja: "状態を確認" },
        source_claims: [],
      },
    ],
    required_relation_constraints: [],
  },
  external_mappings: [
    {
      id: "lossy-map",
      system: "Example",
      external_identifier: "state",
      external_version: "1.0",
      canonical_target_ids: ["ProfileSubject"],
      mapping_kind: "lossy",
      scope: { zh: "状态字段", en: "State field", ja: "状態フィールド" },
      direction: "bidirectional",
      loss_notes: { zh: "枚举值有损", en: "Enum values are lossy", ja: "列挙値は非可逆" },
      conversion_note: { zh: "有损", en: "Lossy mapping", ja: "非可逆" },
      conformance: {
        status: "contract-tested",
        test_id: "lossy-map-contract-test",
        method: { zh: "验证映射合同", en: "Validate mapping contract", ja: "写像契約を検証" },
      },
      status: "accepted",
      source_claims: [],
    },
  ],
} as unknown as CanonicalConcept;

describe("canonical-only profile projections", () => {
  it("builds Zod validation from a canonical Concept structure", () => {
    const profile = createZodProfileFromConcept(concept);

    expect(profile.safeParse({ status: "ready" }).success).toBe(true);
    expect(profile.safeParse({ status: "unknown" }).success).toBe(false);
    expect(profile.safeParse({}).success).toBe(false);
  });

  it("derives conversion warnings from canonical mappings and constraints", () => {
    const ontology = {
      ...(ontologyViewModelFixture as unknown as CanonicalOntology),
      classes: [concept],
    };
    const warnings = deriveConversionWarnings(ontology);

    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ node_id: concept.id, mapping_id: "lossy-map" }),
        expect.objectContaining({ node_id: concept.id, id: "constraint-warning:ProfileSubject:profile-warning" }),
      ]),
    );
    expect(warnings.every(({ node_id }) => node_id === concept.id)).toBe(true);
  });

  it("projects JSON-LD and SHACL only from supplied canonical facts", () => {
    const ontology = ontologyViewModelFixture as unknown as CanonicalOntology;
    const jsonLd = JSON.stringify(exportCanonicalJsonLd(ontology));
    const shacl = exportConceptShacl(concept);

    expect(jsonLd).toContain("AgentRun");
    expect(jsonLd).not.toContain("TrustBoundaryShape");
    expect(shacl).toContain("ProfileSubject/status");
    expect(shacl).not.toContain("ObservableTraceEvent");
  });

  it("projects every supported field datatype and cardinality into runtime validation", () => {
    const datatypeConcept = {
      id: "DatatypeSubject",
      module_id: "run-lifecycle",
      semantic_kind: "entity",
      structure: {
        fields: [
          { id: "text", datatype: "string", required: true, pattern: "^[A-Z]+$" },
          { id: "iri", datatype: "iri", required: true },
          { id: "timestamp", datatype: "date-time", required: true },
          { id: "count", datatype: "integer", required: true },
          { id: "score", datatype: "number", required: true },
          { id: "enabled", datatype: "boolean", required: true },
          { id: "items", datatype: "array", required: true },
          { id: "metadata", datatype: "object", required: true },
          { id: "payload", datatype: "json", required: true },
          { id: "unknown", datatype: "custom", required: false },
          {
            id: "controlled",
            datatype: "string",
            required: true,
            allowed_values: [{ value: "accepted" }, "legacy"],
          },
          {
            id: "unboundedTags",
            datatype: "string",
            required: true,
            cardinality: { min: 1, max: null },
          },
          {
            id: "boundedTags",
            datatype: "string",
            required: true,
            cardinality: { min: 1, max: 2 },
          },
        ],
      },
    } as unknown as CanonicalConcept;
    const profile = createZodProfileFromConcept(datatypeConcept);
    const valid = {
      text: "READY",
      iri: "https://moonweave.ai/agent/1",
      timestamp: "2026-07-13T00:00:00Z",
      count: 3,
      score: 0.75,
      enabled: true,
      items: [1],
      metadata: { owner: "agent" },
      payload: { event: "done" },
      controlled: "accepted",
      unboundedTags: ["one", "two", "three"],
      boundedTags: ["one", "two"],
    };

    expect(profile.safeParse(valid).success).toBe(true);
    expect(profile.safeParse({ ...valid, text: "not-uppercase" }).success).toBe(false);
    expect(profile.safeParse({ ...valid, count: 1.5 }).success).toBe(false);
    expect(profile.safeParse({ ...valid, controlled: "other" }).success).toBe(false);
    expect(profile.safeParse({ ...valid, unboundedTags: [] }).success).toBe(false);
    expect(profile.safeParse({ ...valid, boundedTags: ["one", "two", "three"] }).success).toBe(false);
    expect(profile.safeParse({ ...valid, extra: true }).success).toBe(false);
  });

  it("supports concepts without declared structure fields", () => {
    const empty = createZodProfileFromConcept({
      id: "EmptySubject",
      module_id: "run-lifecycle",
      semantic_kind: "entity",
    } as unknown as CanonicalConcept);

    expect(empty.safeParse({}).success).toBe(true);
    expect(empty.safeParse({ unexpected: true }).success).toBe(false);
  });

  it("covers lossless, unsupported, malformed and fallback warning branches", () => {
    const warningConcept = {
      id: "WarningSubject",
      module_id: "run-lifecycle",
      semantic_kind: "entity",
      external_mappings: [
        null,
        "invalid",
        { id: "exact", mapping_kind: "exact" },
        { id: "unsupported", mapping_kind: "unsupported", conversion_note: { en: "Cannot convert" } },
        { id: "lossy-no-en", mapping_kind: "lossy", conversion_note: { zh: "有损" } },
        { id: "lossy-no-note", mapping_kind: "lossy" },
      ],
      structure: {
        constraints: [
          { id: "warning-without-en", severity: "warning", explanations: { zh: "警告" } },
          { id: "error", severity: "error", explanations: { en: "Error" } },
        ],
      },
    } as unknown as CanonicalConcept;
    const warnings = deriveConversionWarnings({
      ...(ontologyViewModelFixture as unknown as CanonicalOntology),
      classes: [warningConcept],
    });

    expect(warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ mapping_id: "unsupported", severity: "error", message: "Cannot convert" }),
      expect.objectContaining({ mapping_id: "lossy-no-en", severity: "warning", message: "lossy" }),
      expect.objectContaining({ mapping_id: "lossy-no-note", severity: "warning", message: "lossy" }),
      expect.objectContaining({ id: "constraint-warning:WarningSubject:warning-without-en", message: "warning-without-en" }),
    ]));
    expect(warnings).toHaveLength(4);
  });

  it("supports explicit and fallback semantic bases without inventing facts", () => {
    const fallbackOntology = {
      ...(ontologyViewModelFixture as unknown as CanonicalOntology),
      artifact_metadata: undefined,
    } as unknown as CanonicalOntology;
    const jsonLd = exportCanonicalJsonLd(fallbackOntology);
    expect(jsonLd["@graph"][0]?.["@id"]).toContain(semanticNamespaces.mw);

    const noMaxConcept = {
      id: "NoMax",
      module_id: "run-lifecycle",
      semantic_kind: "entity",
      structure: {
        fields: [{ id: "value", datatype: "string", required: false, labels: {} }],
      },
    } as unknown as CanonicalConcept;
    const shacl = exportConceptShacl(noMaxConcept, "https://example.test/base/");
    expect(shacl).toContain("https://example.test/base/NoMax/value");
    expect(shacl).toContain('sh:name "value"');
    expect(shacl).not.toContain("sh:maxCount");

    const relation = {
      id: "rel with space",
      predicate: "connects",
      source_id: "Source Concept",
      target_id: "Target Concept",
    } as unknown as Parameters<typeof exportRelationOwl>[0];
    expect(exportRelationOwl(relation)).toContain("rel%20with%20space");
    expect(exportRelationOwl(relation, "https://example.test/ontology/")).toContain(
      "https://example.test/ontology/Source%20Concept",
    );
  });
});
