import { describe, expect, it } from "vitest";

import {
  concept,
  createRecordOperationsHarness,
  field,
  localized,
  relation,
} from "./helpers/record-operations-fixture";

describe("semantic-depth v3 record operations", () => {
  it("fails fast when a relation owner or reviewed replacement definition is absent", () => {
    const oldRelation = relation({
      id: "Old-is_a-Target",
      sourceId: "Old",
      targetId: "Target",
      predicate: "is_a",
    });
    const { operations } = createRecordOperationsHarness({
      modules: [{ id: "module-a", relations: [oldRelation] }],
    });

    expect(() => operations.locateRelationOwner("missing")).toThrow(
      "Cannot locate relation missing",
    );
    expect(() => operations.replaceRelation({
      oldId: oldRelation.id,
      newId: "Unreviewed-relation",
      predicate: "contains",
    })).toThrow("Missing reviewed replacement definition for Unreviewed-relation");
  });

  it("replaces invalid taxonomy while preserving explicit targets and primary-parent semantics", () => {
    const source = concept({
      id: "OutputStream",
      primaryParentRelationId: "OutputStream-is_a-OutputInformation",
    });
    const oldRelation = relation({
      id: "OutputStream-is_a-OutputInformation",
      sourceId: source.id,
      targetId: "OutputInformation",
      predicate: "is_a",
    });
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [source], relations: [oldRelation] }],
    });

    const replacement = harness.operations.replaceRelation({
      oldId: oldRelation.id,
      newId: "OutputStream-contains-OutputInformation",
      predicate: "contains",
    });

    expect(replacement).toMatchObject({
      predicate: "contains",
      source_id: "OutputStream",
      target_id: "OutputInformation",
      relation_kind: "composition",
    });
    expect(replacement.source_claims[0].supports).toContain(oldRelation.id);
    expect(harness.allConcepts.get(source.id)?.primary_parent_relation_id).toBeNull();

    const second = relation({
      id: "CandidateSet-old-parent",
      sourceId: "CandidateSet",
      targetId: "OldTarget",
      predicate: "is_a",
    });
    const candidate = concept({
      id: "CandidateSet",
      primaryParentRelationId: second.id,
    });
    const secondHarness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [candidate], relations: [second] }],
    });
    secondHarness.operations.replaceRelation({
      oldId: second.id,
      newId: "CandidateSet-is_a-RetrievalCollection",
      predicate: "is_a",
      relationKind: "hierarchy",
      targetId: "RetrievalCollection",
    });
    expect(secondHarness.allRelations.get("CandidateSet-is_a-RetrievalCollection")).toMatchObject({
      target_id: "RetrievalCollection",
      relation_kind: "hierarchy",
    });
    expect(secondHarness.allConcepts.get(candidate.id)?.primary_parent_relation_id).toBe(
      "CandidateSet-is_a-RetrievalCollection",
    );
  });

  it("refreshes every accepted reviewed replacement and preserves only custom examples", () => {
    const registry = createRecordOperationsHarness().operations
      .REVIEWED_REPLACEMENT_RELATION_DEFINITIONS;
    const relations = Object.keys(registry).map((id) => relation({
      id,
      sourceId: `${id}-source`,
      targetId: `${id}-target`,
      examples: [
        { id: `${id}-example-positive-001`, kind: "stale" },
        { id: `${id}-custom`, kind: "case-fragment" },
      ],
    }));
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", relations }],
    });

    harness.operations.applyReviewedReplacementRelationDefinitions();

    for (const [id, definitions] of Object.entries(registry)) {
      const updated = harness.allRelations.get(id);
      expect(updated?.status).toBe("accepted");
      expect(updated?.definitions).toEqual(definitions);
      expect(updated?.definitions).not.toBe(definitions);
      expect(updated?.examples.map(({ id: exampleId }: { id: string }) => exampleId)).toEqual([
        `${id}-example-positive-001`,
        `${id}-example-boundary-001`,
        `${id}-custom`,
      ]);
    }

    const rejected = structuredClone(relations);
    rejected[0].status = "deprecated";
    const invalidHarness = createRecordOperationsHarness({
      modules: [{ id: "module-a", relations: rejected }],
    });
    expect(() => invalidHarness.operations.applyReviewedReplacementRelationDefinitions()).toThrow(
      `Reviewed replacement relation is not accepted: ${rejected[0].id}`,
    );
  });

  it("enforces module ownership and uniqueness for direct additions", () => {
    const existingConcept = concept({ id: "Existing" });
    const existingRelation = relation({
      id: "Existing-relates_to-Target",
      sourceId: "Existing",
      targetId: "Target",
    });
    const harness = createRecordOperationsHarness({
      modules: [{
        id: "module-a",
        classes: [existingConcept],
        relations: [existingRelation],
      }],
    });

    expect(() => harness.operations.addConceptTo("missing", concept({ id: "New" }))).toThrow(
      "Missing module missing",
    );
    expect(() => harness.operations.addConceptTo("module-a", existingConcept)).toThrow(
      "Duplicate concept Existing",
    );
    harness.operations.addConceptTo("module-a", concept({ id: "New" }));
    expect(harness.allConcepts.has("New")).toBe(true);

    expect(() => harness.operations.addRelationTo("missing", existingRelation)).toThrow(
      "Missing module missing",
    );
    expect(() => harness.operations.addRelationTo("module-a", existingRelation)).toThrow(
      `Duplicate relation ${existingRelation.id}`,
    );
    harness.operations.addRelationTo("module-a", relation({
      id: "New-relates_to-Target",
      sourceId: "New",
      targetId: "Target",
    }));
    expect(harness.allRelations.has("New-relates_to-Target")).toBe(true);
  });

  it("upserts Concepts without silently transferring ownership", () => {
    const existing = concept({ id: "Existing", moduleId: "module-a" });
    const harness = createRecordOperationsHarness({
      modules: [
        { id: "module-a", classes: [existing] },
        { id: "module-b" },
      ],
    });
    const baseParameters = {
      id: "Existing",
      moduleId: "module-a",
      labels: localized("更新", "updated", "更新"),
      definitions: localized("更新定义", "updated definition", "更新定義"),
      semanticKind: "information",
    };

    expect(() => harness.operations.upsertReviewedConcept({
      ...baseParameters,
      id: "MissingOwner",
      moduleId: "missing",
    })).toThrow("Missing module missing");
    expect(() => harness.operations.upsertReviewedConcept({
      ...baseParameters,
      moduleId: "module-b",
    })).toThrow("Cannot upsert Existing: owned by module-a");

    const updated = harness.operations.upsertReviewedConcept(baseParameters);
    expect(updated.labels.en).toBe("updated");
    expect(harness.moduleDocuments.get("module-a")?.document.classes).toHaveLength(1);

    const customReview = { reviewer: "fixture" };
    const inserted = harness.operations.upsertReviewedConcept({
      ...baseParameters,
      id: "Inserted",
      sourceClaims: [{ source_id: "custom" }],
      review: customReview,
    });
    expect(inserted.source_claims).toEqual([{ source_id: "custom" }]);
    expect(inserted.review).toEqual(customReview);
    expect(harness.allConcepts.has("Inserted")).toBe(true);
  });

  it("updates and deprecates Concepts with explicit failure modes", () => {
    const current = concept({
      id: "Current",
      primaryParentRelationId: "Current-is_a-Parent",
      examples: [{ id: "example", kind: "positive" }],
    });
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [current] }],
      conceptOverrides: [concept({ id: "Orphan", moduleId: "missing" })],
    });

    expect(() => harness.operations.updateReviewedConcept("Missing", {})).toThrow(
      "Cannot update missing concept Missing",
    );
    expect(() => harness.operations.updateReviewedConcept("Orphan", {})).toThrow(
      "Cannot update Orphan: missing owner missing",
    );
    expect(harness.operations.updateReviewedConcept("Current", { semantic_kind: "entity" }))
      .toMatchObject({ id: "Current", semantic_kind: "entity" });

    const deprecated = harness.operations.deprecateConcept(
      "Current",
      ["Replacement"],
      localized("原因", "reason", "理由"),
    );
    expect(deprecated).toMatchObject({
      status: "deprecated",
      primary_parent_relation_id: null,
      root_status: "composition-root",
      replaced_by_ids: ["Replacement"],
      examples: [],
    });
  });

  it("moves upserted relations to one owner and deprecates facts idempotently", () => {
    const relationId = "Source-relates_to-Target";
    const parented = concept({ id: "Source", primaryParentRelationId: relationId });
    const unrelated = concept({ id: "Other", primaryParentRelationId: "Other-parent" });
    const harness = createRecordOperationsHarness({
      modules: [
        {
          id: "module-a",
          classes: [parented, unrelated],
          relations: [relation({ id: relationId, sourceId: "Source", targetId: "Target" })],
        },
        {
          id: "module-b",
          relations: [relation({ id: relationId, sourceId: "Source", targetId: "OldTarget" })],
        },
      ],
    });

    expect(() => harness.operations.upsertReviewedRelation({
      id: "missing",
      moduleId: "missing",
    })).toThrow("Missing module missing");
    const customReview = { reviewer: "fixture" };
    harness.operations.upsertReviewedRelation({
      id: relationId,
      moduleId: "module-b",
      predicate: "contains",
      sourceId: "Source",
      targetId: "Target",
      relationKind: "composition",
      sourceClaims: [{ source_id: "custom" }],
      review: customReview,
    });
    expect(harness.moduleDocuments.get("module-a")?.document.relations).toHaveLength(0);
    expect(harness.allRelations.get(relationId)).toMatchObject({
      predicate: "contains",
      source_claims: [{ source_id: "custom" }],
      review: customReview,
    });

    harness.operations.deprecateRelation("absent", [], localized("无", "none", "なし"));
    harness.operations.deprecateRelation(
      relationId,
      ["Replacement-relation"],
      localized("原因", "reason", "理由"),
    );
    expect(harness.allRelations.get(relationId)).toMatchObject({
      status: "deprecated",
      layout_role: "cross-link",
      layout_parent_id: null,
      layout_child_id: null,
      replaced_by_ids: ["Replacement-relation"],
    });
    expect(harness.allConcepts.get("Source")?.primary_parent_relation_id).toBeNull();
    expect(harness.allConcepts.get("Other")?.primary_parent_relation_id).toBe("Other-parent");
  });

  it("promotes projection fields, ignores unrelated modules, and rejects incomplete contracts", () => {
    const schemaVersion = field({ id: "schema_version" });
    const lossKind = field({ id: "loss_kind", exampleValue: "exact" });
    const schema = concept({
      id: "SchemaAdapter",
      fields: [schemaVersion, lossKind, field({ id: "schema_only" })],
      structure: {
        identity_keys: ["schema_version", "loss_kind"],
        fields: [schemaVersion, lossKind, field({ id: "schema_only" })],
        constraints: [],
        required_relation_constraints: [],
      },
    });
    const projection = concept({
      id: "ProjectionAdapter",
      fields: [field({ id: "projection_only" })],
      structure: {
        identity_keys: ["schema_version"],
        fields: [field({ id: "projection_only" })],
        constraints: [],
        required_relation_constraints: [],
      },
    });
    const unrelated = concept({ id: "Unrelated" });
    const harness = createRecordOperationsHarness({
      modules: [
        { id: "module-a", classes: [schema, projection, unrelated] },
        { id: "module-b", classes: [concept({ id: "OnlyOneAdapter" })] },
      ],
    });

    harness.operations.repairProjectionAdapterStructure();
    const promoted = harness.allConcepts.get("ProjectionAdapter");
    expect(promoted?.structure.identity_keys).toEqual(["schema_version"]);
    expect(promoted?.structure.fields.map(({ id }: { id: string }) => id)).toEqual([
      "projection_only",
      "schema_version",
      "loss_kind",
    ]);
    expect(harness.allConcepts.get("SchemaAdapter")?.structure.fields.map(
      ({ id }: { id: string }) => id,
    )).toEqual(["schema_only"]);
    expect(harness.allConcepts.get("Unrelated")).toEqual(unrelated);

    const incompleteHarness = createRecordOperationsHarness({
      modules: [{
        id: "module-a",
        classes: [
          concept({ id: "SchemaAdapter", fields: [field({ id: "schema_version" })] }),
          concept({ id: "ProjectionAdapter" }),
        ],
      }],
    });
    expect(() => incompleteHarness.operations.repairProjectionAdapterStructure()).toThrow(
      "SchemaAdapter must define schema_version and loss_kind before promotion",
    );
  });
});
