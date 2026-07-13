import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  REVIEWED_DISTINCT_FACT_GROUPS,
  REVIEWED_RELATION_MERGES,
  REVIEWED_RELATION_SPECIAL_DECISIONS,
  convergeReviewedRelations,
} from "../scripts/lib/ontology-reviewed-relations.mjs";

type LocalizedText = Readonly<Record<"zh" | "en" | "ja", string>>;

type SourceClaim = Readonly<{
  source_id: string;
  supports: string;
  locator: string;
  evidence_kind: string;
  confidence: string;
  review_status: string;
}>;

type RelationExample = Readonly<{
  id: string;
  related_relation_ids: readonly string[];
  source_claims: readonly SourceClaim[];
}>;

type Relation = Readonly<{
  id: string;
  predicate: string;
  source_id: string;
  target_id: string;
  source_claims: readonly SourceClaim[];
  examples: readonly RelationExample[];
  distinct_fact_rationale: LocalizedText | null;
}>;

type ModuleSource = Readonly<{ relations: readonly Relation[] }>;

const sourceRoot = resolve(import.meta.dirname, "../ontology/source");
const sourceRelations = readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((plane) =>
    readdirSync(resolve(sourceRoot, plane.name))
      .filter((name) => name.endsWith(".json"))
      .flatMap(
        (name) =>
          (JSON.parse(
            readFileSync(resolve(sourceRoot, plane.name, name), "utf8"),
          ) as ModuleSource).relations,
      ),
  );
const sourceRelationById = new Map(sourceRelations.map((relation) => [relation.id, relation]));

const claim = (id: string): SourceClaim => ({
  source_id: id,
  supports: `Evidence retained for ${id}.`,
  locator: `https://example.test/${id}`,
  evidence_kind: "design-inference",
  confidence: "medium",
  review_status: "accepted",
});

const relation = (
  id: string,
  sourceId: string,
  targetId: string,
  evidenceId = `claim-${id}`,
): Relation => ({
  id,
  predicate: id,
  source_id: sourceId,
  target_id: targetId,
  source_claims: [claim(evidenceId)],
  examples: [
    {
      id: `${id}-example`,
      related_relation_ids: [id],
      source_claims: [claim(evidenceId)],
    },
  ],
  distinct_fact_rationale: null,
});

const requiredSourceRelation = (id: string): Relation => {
  const candidate = sourceRelationById.get(id);
  if (!candidate) throw new Error(`Test fixture cannot resolve canonical relation ${id}`);
  return relation(id, candidate.source_id, candidate.target_id, `target-${id}`);
};

const fixture = () => {
  const byId = new Map<string, Relation>();
  const add = (value: Relation) => {
    const existing = byId.get(value.id);
    if (existing && (existing.source_id !== value.source_id || existing.target_id !== value.target_id)) {
      throw new Error(`Conflicting fixture endpoints for ${value.id}`);
    }
    byId.set(value.id, existing ?? value);
  };

  for (const { source_relation_id: sourceId, target_relation_id: targetId } of REVIEWED_RELATION_MERGES) {
    const target = requiredSourceRelation(targetId);
    add(target);
    add(relation(sourceId, target.source_id, target.target_id, `source-${sourceId}`));
  }

  for (const decision of REVIEWED_RELATION_SPECIAL_DECISIONS) {
    for (const targetId of decision.target_relation_ids) add(requiredSourceRelation(targetId));
    if (decision.source_relation_id === "uses_runtime_environment") {
      add(requiredSourceRelation(decision.source_relation_id));
      continue;
    }
    const endpointTemplate = requiredSourceRelation(
      decision.source_relation_id === "memory_update_updates_record"
        ? "MemoryUpdate-produces-MemoryRecord"
        : decision.source_relation_id === "maps_schema_profile_to_schema_artifact"
          ? "SchemaAdapter-produces-SchemaArtifact"
          : decision.target_relation_ids[0],
    );
    add(
      relation(
        decision.source_relation_id,
        endpointTemplate.source_id,
        decision.source_relation_id === "chunks_document" ? "Chunk" : endpointTemplate.target_id,
        `source-${decision.source_relation_id}`,
      ),
    );
  }

  for (const group of REVIEWED_DISTINCT_FACT_GROUPS) {
    for (const relationId of group.relation_ids) add(requiredSourceRelation(relationId));
  }

  const relations = [...byId.values()];
  const legacyRelations = relations.map(({ id }) => ({ id, source_ids: [`legacy-${id}`] }));
  const sourceRegistryById = new Map(
    relations.flatMap((item) =>
      item.source_claims.map(({ source_id: sourceId }) => [
        sourceId,
        { id: sourceId, title: sourceId, url: `https://example.test/${sourceId}` },
      ] as const),
    ),
  );
  return { relations, legacyRelations, sourceRegistryById };
};

const hasLocalizedText = (value: LocalizedText | null | undefined) =>
  value !== null &&
  value !== undefined &&
  [value.zh, value.en, value.ja].every((text) => text.trim().length > 0);

describe("reviewed relation convergence registry", () => {
  it("encodes exactly 67 unique, resolvable safe merges", () => {
    expect(REVIEWED_RELATION_MERGES).toHaveLength(67);
    expect(new Set(REVIEWED_RELATION_MERGES.map(({ source_relation_id }) => source_relation_id)).size).toBe(67);
    expect(new Set(REVIEWED_RELATION_MERGES.map(({ target_relation_id }) => target_relation_id)).size).toBe(67);
    expect(
      REVIEWED_RELATION_MERGES.filter(({ target_relation_id }) => !sourceRelationById.has(target_relation_id)),
    ).toEqual([]);
  });

  it("documents every retained same-endpoint fact group with a concrete trilingual rationale", () => {
    expect(REVIEWED_DISTINCT_FACT_GROUPS.length).toBeGreaterThanOrEqual(15);
    for (const group of REVIEWED_DISTINCT_FACT_GROUPS) {
      expect(group.relation_ids.length, group.id).toBeGreaterThan(1);
      expect(hasLocalizedText(group.distinct_fact_rationale), group.id).toBe(true);
      expect(new Set(group.relation_ids).size, group.id).toBe(group.relation_ids.length);
      for (const relationId of group.relation_ids) {
        expect(sourceRelationById.has(relationId), relationId).toBe(true);
      }
    }
  });
});

describe("convergeReviewedRelations", () => {
  it("immutably merges evidence and examples into each reviewed target and is idempotent", () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const once = convergeReviewedRelations(input);
    const twice = convergeReviewedRelations({
      ...input,
      relations: once.relations,
    });
    const byId = new Map(once.relations.map((item) => [item.id, item]));

    expect(JSON.stringify(input)).toBe(before);
    expect(twice.relations).toEqual(once.relations);
    for (const { source_relation_id: sourceId, target_relation_id: targetId } of REVIEWED_RELATION_MERGES) {
      expect(byId.has(sourceId), sourceId).toBe(false);
      const target = byId.get(targetId);
      expect(target, targetId).toBeDefined();
      expect(target?.source_claims.some(({ source_id: claimId }) => claimId === `source-${sourceId}`)).toBe(true);
      expect(
        target?.examples.some(
          (example) =>
            example.id === `${sourceId}-example` &&
            example.related_relation_ids.includes(targetId) &&
            !example.related_relation_ids.includes(sourceId),
        ),
      ).toBe(true);
      expect(once.dispositionByRelationId.get(sourceId)).toMatchObject({
        action: "merge_into_reviewed_relation",
        target_relation_id: targetId,
      });
    }

    const retiredIds = new Set([
      ...REVIEWED_RELATION_MERGES.map(({ source_relation_id }) => source_relation_id),
      "chunks_document",
      "decomposes_goal_into",
      "memory_update_updates_record",
      "maps_schema_profile_to_schema_artifact",
    ]);
    expect(
      once.relations.flatMap((item) =>
        item.examples.flatMap((example) =>
          example.related_relation_ids.filter((id) => retiredIds.has(id)),
        ),
      ),
    ).toEqual([]);
  });

  it("applies the five explicit domain decisions instead of guessing by endpoint", () => {
    const input = fixture();
    const output = convergeReviewedRelations({
      ...input,
      relations: input.relations.map((item) =>
        item.id === "SchemaAdapter-produces-SchemaArtifact"
          ? {
              ...item,
              examples: item.examples.map((example) => ({
                ...example,
                related_relation_ids: [
                  ...example.related_relation_ids,
                  "maps_schema_profile_to_schema_artifact",
                ],
              })),
            }
          : item,
      ),
    });
    const byId = new Map(output.relations.map((item) => [item.id, item]));

    expect(byId.has("chunks_document")).toBe(false);
    expect(byId.get("ChunkingRun-consumes-Document")?.source_claims).toEqual(
      expect.arrayContaining([expect.objectContaining({ source_id: "source-chunks_document" })]),
    );
    expect(output.dispositionByRelationId.get("chunks_document")).toMatchObject({
      action: "redirect_to_reviewed_relation",
      target_relation_id: "ChunkingRun-consumes-Document",
    });

    expect(byId.has("decomposes_goal_into")).toBe(false);
    expect(output.dispositionByRelationId.get("decomposes_goal_into")).toMatchObject({
      action: "merge_into_reviewed_relation",
      target_relation_id: "Goal-refined_into-Objective",
    });

    expect(byId.has("RunAttempt-occurs_in-RuntimeEnvironment")).toBe(true);
    expect(byId.has("uses_runtime_environment")).toBe(true);
    expect(hasLocalizedText(byId.get("RunAttempt-occurs_in-RuntimeEnvironment")?.distinct_fact_rationale)).toBe(true);
    expect(hasLocalizedText(byId.get("uses_runtime_environment")?.distinct_fact_rationale)).toBe(true);
    expect(output.dispositionByRelationId.get("uses_runtime_environment")?.action).toBe("preserve_distinct_fact");

    expect(byId.has("memory_update_updates_record")).toBe(false);
    for (const relationId of [
      "MemoryUpdate-produces-MemoryRecord",
      "MemoryUpdate-supersedes-MemoryRecord",
    ]) {
      expect(byId.get(relationId)?.source_claims).toEqual(
        expect.arrayContaining([expect.objectContaining({ source_id: "source-memory_update_updates_record" })]),
      );
    }
    expect(output.dispositionByRelationId.get("memory_update_updates_record")).toMatchObject({
      action: "retire_after_immutable_update_split",
      target_relation_ids: [
        "MemoryUpdate-produces-MemoryRecord",
        "MemoryUpdate-supersedes-MemoryRecord",
      ],
    });

    expect(byId.has("maps_schema_profile_to_schema_artifact")).toBe(false);
    expect(byId.has("SchemaAdapter-produces-SchemaArtifact")).toBe(true);
    expect(output.dispositionByRelationId.get("maps_schema_profile_to_schema_artifact")).toMatchObject({
      action: "migrate_to_structured_external_mapping",
      target_mapping_id: "SchemaAdapter-external-family-mapping",
    });
    expect(
      output.relations.flatMap((item) =>
        item.examples.flatMap(({ related_relation_ids: relationIds }) => relationIds),
      ),
    ).not.toContain("maps_schema_profile_to_schema_artifact");
  });

  it("preserves only enumerated multi-facts and applies their reviewed rationale", () => {
    const { relations } = convergeReviewedRelations(fixture());
    const groups = new Map<string, Relation[]>();
    for (const item of relations) {
      const key = `${item.source_id}\0${item.target_id}`;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    const actualMultiGroups = [...groups.values()]
      .filter((items) => items.length > 1)
      .map((items) => items.map(({ id }) => id).sort().join("|"))
      .sort();
    const expectedMultiGroups = REVIEWED_DISTINCT_FACT_GROUPS.map((group) =>
      [...group.relation_ids].sort().join("|"),
    ).sort();

    expect(actualMultiGroups).toEqual(expectedMultiGroups);
    for (const items of groups.values()) {
      if (items.length < 2) continue;
      expect(items.every((item) => hasLocalizedText(item.distinct_fact_rationale))).toBe(true);
    }
  });

  it("fails closed when a required target or an unreviewed same-endpoint edge is introduced", () => {
    const input = fixture();
    expect(() =>
      convergeReviewedRelations({
        ...input,
        relations: input.relations.filter(({ id }) => id !== REVIEWED_RELATION_MERGES[0].target_relation_id),
      }),
    ).toThrow(/target relation/u);

    expect(() =>
      convergeReviewedRelations({
        ...input,
        relations: [...input.relations, relation("unreviewed_parallel_fact", "ContentBlock", "SourceReference")],
      }),
    ).toThrow(/unreviewed same-endpoint/iu);
  });

  it("reconstructs registered legacy evidence when the source edge was already removed", () => {
    const input = fixture();
    const decision = REVIEWED_RELATION_MERGES[0];
    const registrySourceId = "registered-legacy-source";
    const output = convergeReviewedRelations({
      relations: input.relations.filter(({ id }) => id !== decision.source_relation_id),
      legacyRelations: input.legacyRelations.map((legacy) =>
        legacy.id === decision.source_relation_id
          ? { ...legacy, source_ids: [registrySourceId] }
          : legacy,
      ),
      sourceRegistryById: new Map([
        [registrySourceId, {
          id: registrySourceId,
          title: "Registered legacy source",
          url: "https://example.test/registered-legacy-source",
        }],
      ]),
    });
    const target = output.relations.find(({ id }) => id === decision.target_relation_id);
    const reconstructed = target?.source_claims.find(({ source_id }) => source_id === registrySourceId);

    expect(reconstructed?.locator).toContain("Registered legacy source");
    expect(reconstructed?.locator).not.toContain("https://");
    expect(reconstructed?.supports).toContain(decision.source_relation_id);
  });

  it("supports object registries and merges duplicate example identities without losing claims", () => {
    const input = fixture();
    const decision = REVIEWED_RELATION_MERGES[0];
    const source = input.relations.find(({ id }) => id === decision.source_relation_id);
    const target = input.relations.find(({ id }) => id === decision.target_relation_id);
    if (!source || !target) throw new Error("Fixture relation missing");
    const sharedExampleId = "shared-example-id";
    const registrySourceId = "object-registry-source";
    const relations = input.relations.map((item) => {
      if (item.id === source.id) {
        return {
          ...item,
          examples: [{
            ...item.examples[0],
            id: sharedExampleId,
            related_relation_ids: undefined as unknown as readonly string[],
          }],
        };
      }
      if (item.id === target.id) {
        return {
          ...item,
          examples: [{ ...item.examples[0], id: sharedExampleId }],
        };
      }
      return item;
    });
    const output = convergeReviewedRelations({
      relations,
      legacyRelations: input.legacyRelations.map((legacy) =>
        legacy.id === decision.source_relation_id
          ? { ...legacy, source_ids: [registrySourceId] }
          : legacy,
      ),
      sourceRegistryById: {
        [registrySourceId]: {
          id: registrySourceId,
          label: "Object registry source",
          locator: "research/object-registry-source.md",
        },
      },
    });
    const merged = output.relations.find(({ id }) => id === decision.target_relation_id);
    const examples = merged?.examples.filter(({ id }) => id === sharedExampleId) ?? [];

    expect(examples).toHaveLength(1);
    expect(examples[0].source_claims).toHaveLength(2);
    expect(
      merged?.source_claims.find(({ source_id }) => source_id === registrySourceId)?.locator,
    ).toBe("Documentation page > Object registry source heading and documented conceptual model");
  });

  it("rejects malformed inputs, duplicate IDs, incomplete role groups, and changed role endpoints", () => {
    const input = fixture();
    expect(() => convergeReviewedRelations({ relations: null as never })).toThrow(/relations must be an array/u);
    expect(() => convergeReviewedRelations({
      relations: input.relations,
      legacyRelations: null as never,
    })).toThrow(/legacyRelations must be an array/u);
    expect(() => convergeReviewedRelations({ relations: [{}] as never })).toThrow(/must have an id/u);
    expect(() => convergeReviewedRelations({
      relations: [input.relations[0], input.relations[0]],
    })).toThrow(/Duplicate relation id/u);

    expect(() => convergeReviewedRelations({
      ...input,
      relations: input.relations.filter(({ id }) => id !== "uses_runtime_environment"),
    })).toThrow(/uses_runtime_environment/u);
    expect(() => convergeReviewedRelations({
      ...input,
      relations: input.relations.filter(({ id }) => id !== "SchemaAdapter-produces-SchemaArtifact"),
    })).toThrow(/SchemaAdapter-produces-SchemaArtifact/u);
    expect(() => convergeReviewedRelations({
      ...input,
      relations: input.relations.filter(({ id }) => id !== "derived_from_source"),
    })).toThrow(/derived_from_source/u);
    expect(() => convergeReviewedRelations({
      ...input,
      relations: input.relations.map((item) =>
        item.id === "has_source_reference" ? { ...item, target_id: "DifferentSourceReference" } : item,
      ),
    })).toThrow(/does not share endpoints/u);
  });
});
