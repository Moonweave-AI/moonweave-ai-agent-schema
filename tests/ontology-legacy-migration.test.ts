import { describe, expect, it } from "vitest";

import {
  attachConvertedControlledValue,
  reviewedConceptDefinitions,
} from "../scripts/lib/ontology-legacy-migration.mjs";

const localized = (value: string) => ({
  zh: `${value}-zh`,
  en: `${value}-en`,
  ja: `${value}-ja`,
});

const emptyConcept = {
  id: "MemoryRecord",
  structure: { fields: [] },
};

describe("reviewed legacy ontology migration", () => {
  it("names each orthogonal memory dimension instead of emitting a generic classification field", () => {
    const concepts = attachConvertedControlledValue({
      concepts: [emptyConcept],
      decision: {
        concept_id: "EpisodicMemory",
        decision: "convert_to_controlled_value",
        target_concept_id: "MemoryRecord",
        target_field_id: "MemoryRecord.memory_kind",
        labels: localized("episodic-memory"),
        rationale: localized("episodic-memory-controlled-value"),
      },
      legacyConcept: {
        labels: localized("episodic-memory"),
        definitions: localized("episodic-memory-definition"),
        source_ids: [],
      },
      sourceRegistryById: new Map(),
    });

    const field = concepts[0].structure.fields[0];
    expect(field.id).toBe("memory_kind");
    expect(field.labels).toEqual({
      zh: "记忆种类",
      en: "Memory kind",
      ja: "記憶種別",
    });
    expect(field.definitions.en).toContain("semantic or functional kind");
    expect(field.labels.en).not.toBe("Controlled classification");
  });

  it("uses the reviewed retype rationale as the corrected canonical definition", () => {
    expect(
      reviewedConceptDefinitions({
        decision: {
          decision: "retype",
          rationale: localized("reviewed-activity-definition"),
        },
        legacyDefinitions: localized("legacy-artifact-definition"),
      }),
    ).toEqual(localized("reviewed-activity-definition"));
  });

  it("preserves accepted legacy wording unless review explicitly retypes or overrides it", () => {
    const legacyDefinitions = localized("accepted-legacy-definition");
    expect(
      reviewedConceptDefinitions({
        decision: { decision: "keep_reparent", rationale: localized("review-note") },
        legacyDefinitions,
      }),
    ).toBe(legacyDefinitions);

    const override = localized("explicit-definition-override");
    expect(
      reviewedConceptDefinitions({
        decision: {
          decision: "keep_reparent",
          rationale: localized("review-note"),
          definitions: override,
        },
        legacyDefinitions,
      }),
    ).toBe(override);
  });
});
