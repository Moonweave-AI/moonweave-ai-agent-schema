import { describe, expect, it } from "vitest";

import {
  buildOntologyIndex,
  ontologyLogicalDepth,
  ontologyPrimaryPath,
} from "../src/lib/ontology-index";
import {
  fixtureRefs,
  inheritanceProjectionFixture,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";

const buildFixtureIndex = () =>
  buildOntologyIndex(
    ontologyViewModelFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
  );

const ids = <T extends { id: string }>(values: readonly T[] | undefined) =>
  (values ?? []).map(({ id }) => id).sort();

describe("canonical ontology index", () => {
  it("indexes the canonical root and all eight first-level domains without a GraphView shadow model", () => {
    const index = buildFixtureIndex();

    expect(index.rootRef).toBe(fixtureRefs.root);
    expect(index.entitiesByRef.get(fixtureRefs.root)?.kind).toBe("root");
    expect(index.organizationalChildrenByRef.get(fixtureRefs.root)).toHaveLength(8);
    expect(index.organizationalChildrenByRef.get(fixtureRefs.root)).toEqual(
      expect.arrayContaining([
        "plane:runtime-plane",
        "plane:orchestration-plane",
        "plane:tool-plane",
        "plane:safety-plane",
        "plane:feedback-plane",
        "plane:memory-plane",
        "plane:info-plane",
        "plane:adapter-plane",
      ]),
    );
  });

  it("indexes domain-to-module ownership without inventing canonical containment relations", () => {
    const index = buildFixtureIndex();

    expect(index.organizationalChildrenByRef.get(fixtureRefs.runtimePlane)).toEqual([
      "module:run-lifecycle",
      "module:runtime-observability",
    ]);
    expect(index.planeByModuleId.get("run-lifecycle")?.id).toBe("runtime-plane");
    expect(index.moduleByConceptId.get("AgentRun")?.id).toBe("run-lifecycle");
    expect(index.relationsById.has("derived:contains-module:runtime-plane:run-lifecycle")).toBe(
      false,
    );
  });

  it("derives module root concepts only from current is_a parentage", () => {
    const index = buildFixtureIndex();

    expect(index.rootConceptRefsByModuleId.get("run-lifecycle")).toEqual([
      fixtureRefs.runtimeEntity,
      fixtureRefs.executableEntity,
      fixtureRefs.runResult,
    ]);
    expect(index.rootConceptRefsByModuleId.get("tool-catalog")).toEqual([fixtureRefs.tool]);
  });

  it("keeps the primary parent separate from additional reviewed parents and indexes direct children", () => {
    const index = buildFixtureIndex();

    expect(index.primaryParentRelationByConceptId.get("AgentRun")?.id).toBe(
      "AgentRun-is_a-RuntimeEntity",
    );
    expect(ids(index.additionalParentRelationsByConceptId.get("AgentRun"))).toEqual([
      "AgentRun-is_a-ExecutableEntity",
    ]);
    expect(ids(index.directChildRelationsByConceptId.get("AgentRun"))).toEqual([
      "LeafRun-is_a-AgentRun",
    ]);
  });

  it("keeps cross-module specialization depth separate from the non-duplicating directory path", () => {
    const crossModuleParent = {
      ...ontologyViewModelFixture.relations[0],
      id: "AgentRun-is_a-Tool",
      source_id: "AgentRun",
      target_id: "Tool",
    };
    const ontology = {
      ...ontologyViewModelFixture,
      classes: ontologyViewModelFixture.classes.map((concept) =>
        concept.id === "AgentRun"
          ? { ...concept, primary_parent_relation_id: crossModuleParent.id }
          : concept,
      ),
      relations: [
        ...ontologyViewModelFixture.relations.filter(
          ({ id }) => id !== "AgentRun-is_a-RuntimeEntity",
        ),
        crossModuleParent,
      ],
    };
    const index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );

    expect(ontologyPrimaryPath(index, fixtureRefs.agentRun)).toEqual([
      fixtureRefs.root,
      fixtureRefs.runtimePlane,
      fixtureRefs.runLifecycleModule,
      fixtureRefs.agentRun,
    ]);
    expect(ontologyLogicalDepth(index, fixtureRefs.tool)).toBe(3);
    expect(ontologyLogicalDepth(index, fixtureRefs.agentRun)).toBe(4);
  });

  it("derives logical depth from the unified primary backbone, including semantic edges", () => {
    const ontology = {
      ...ontologyViewModelFixture,
      relations: ontologyViewModelFixture.relations.map((relation) =>
        relation.id === "AgentRun-produces-RunResult"
          ? {
              ...relation,
              layout_role: "primary-backbone",
              layout_parent_id: "AgentRun",
              layout_child_id: "RunResult",
            }
          : relation),
    };
    const index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );

    expect(ontologyLogicalDepth(index, fixtureRefs.agentRun)).toBe(4);
    expect(ontologyLogicalDepth(index, fixtureRefs.runResult)).toBe(5);
  });

  it("preserves canonical incoming and outgoing directions, including hierarchy edges", () => {
    const index = buildFixtureIndex();

    expect(ids(index.outgoingRelationsByConceptId.get("AgentRun"))).toEqual([
      "AgentRun-finalizes-RunResult",
      "AgentRun-is_a-ExecutableEntity",
      "AgentRun-is_a-RuntimeEntity",
      "AgentRun-produces-RunResult",
    ]);
    expect(ids(index.incomingRelationsByConceptId.get("AgentRun"))).toEqual([
      "LeafRun-is_a-AgentRun",
      "RunResult-describes-AgentRun",
    ]);
  });

  it("does not collapse parallel predicates between the same ordered endpoints", () => {
    const index = buildFixtureIndex();
    const parallelRelations = index.outgoingRelationsByConceptId
      .get("AgentRun")
      ?.filter(
        (relation) =>
          relation.source_id === "AgentRun" && relation.target_id === "RunResult",
      );

    expect(ids(parallelRelations)).toEqual([
      "AgentRun-finalizes-RunResult",
      "AgentRun-produces-RunResult",
    ]);
    expect(parallelRelations?.map(({ predicate }) => predicate).sort()).toEqual([
      "finalizes",
      "produces",
    ]);
  });

  it("indexes only root, plane, module and concept entities as graph-node candidates", () => {
    const index = buildFixtureIndex();
    const indexedKinds = [...index.entitiesByRef.values()].map(({ kind }) => kind);

    expect(index.entitiesByRef.size).toBe(25);
    expect(new Set(indexedKinds)).toEqual(new Set(["root", "plane", "module", "concept"]));
    expect(index.entitiesByRef.has("field:agentrun_field_1")).toBe(false);
    expect(index.entitiesByRef.has("example:AgentRun-example-1")).toBe(false);
    expect(index.entitiesByRef.has("source:source-AgentRun-1")).toBe(false);
    expect(index.entitiesByRef.has("constraint:AgentRun-constraint-1")).toBe(false);
    expect(index.entitiesByRef.has("case:case-path-that-must-not-become-a-node")).toBe(false);
  });

  it("indexes relation-owned case fragments as edge information, never as graph nodes", () => {
    const relationExample = {
      ...ontologyViewModelFixture.relations[3].examples[0],
      id: "relation-case-fragment",
      kind: "case-fragment",
      scenario_id: "relation-owned-case",
    };
    const ontology = {
      ...ontologyViewModelFixture,
      relations: ontologyViewModelFixture.relations.map((relation, position) =>
        position === 3 ? { ...relation, examples: [relationExample] } : relation,
      ),
      case_paths: [
        ...ontologyViewModelFixture.case_paths,
        {
          id: "relation-owned-case",
          labels: { zh: "关系案例", en: "Relation case", ja: "関係ケース" },
          descriptions: { zh: "关系案例", en: "Relation case", ja: "関係ケース" },
          steps: [
            {
              order: 1,
              case_fragment_example_id: relationExample.id,
              traversal_relation_id: ontologyViewModelFixture.relations[3].id,
            },
          ],
          source_claims: [],
          status: "accepted",
          review: { review_status: "accepted", reviewers: [] },
        },
      ],
    };
    const index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );

    expect(index.examplesById.get(relationExample.id)?.scenario_id).toBe(
      "relation-owned-case",
    );
    expect(index.exampleOwnerRelationIdById.get(relationExample.id)).toBe(
      ontologyViewModelFixture.relations[3].id,
    );
    expect(index.entitiesByRef.has(`example:${relationExample.id}`)).toBe(false);
  });

  it("derives AssistantMessage and AudioBlock fields from is_a without persisting copies", () => {
    const index = buildOntologyIndex(
      inheritanceProjectionFixture as unknown as Parameters<typeof buildOntologyIndex>[0],
    );

    expect(index.conceptsById.get("AssistantMessage")?.structure?.fields?.map(({ id }) => id))
      .toEqual(["assistant_role"]);
    expect(index.effectiveFieldsByConceptId.get("AssistantMessage")).toMatchObject([
      { field: { id: "assistant_role", required: true }, declaredOnId: "AssistantMessage", inheritanceDepth: 0 },
      { field: { id: "message_id", required: true }, declaredOnId: "Message", inheritanceDepth: 1 },
    ]);
    expect(index.conceptsById.get("AudioBlock")?.structure?.fields?.map(({ id }) => id))
      .toEqual(["sample_rate_hz"]);
    expect(index.effectiveFieldsByConceptId.get("AudioBlock")).toMatchObject([
      { field: { id: "sample_rate_hz" }, declaredOnId: "AudioBlock", inheritanceDepth: 0 },
      { field: { id: "media_type", required: true }, declaredOnId: "MediaBlock", inheritanceDepth: 1 },
    ]);
  });

  it("keeps deprecated is_a relations as history without using them for active hierarchy or field inheritance", () => {
    const deprecatedParentRelationId = "AssistantMessage-is_a-Message";
    const ontology = {
      ...inheritanceProjectionFixture,
      relations: inheritanceProjectionFixture.relations.map((relation) =>
        relation.id === deprecatedParentRelationId
          ? { ...relation, status: "deprecated" }
          : relation,
      ),
    };
    const index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );

    expect(index.relationsById.get(deprecatedParentRelationId)?.status).toBe("deprecated");
    expect(index.outgoingRelationsByConceptId.get("AssistantMessage")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: deprecatedParentRelationId, status: "deprecated" }),
      ]),
    );
    expect(index.primaryParentRelationByConceptId.has("AssistantMessage")).toBe(false);
    expect(ids(index.directChildRelationsByConceptId.get("Message"))).not.toContain(
      deprecatedParentRelationId,
    );
    expect(index.effectiveFieldsByConceptId.get("AssistantMessage")).toMatchObject([
      {
        field: { id: "assistant_role", required: true },
        declaredOnId: "AssistantMessage",
        inheritanceDepth: 0,
      },
    ]);
    expect(
      index.effectiveFieldsByConceptId
        .get("AssistantMessage")
        ?.some(({ field }) => field.id === "message_id"),
    ).toBe(false);
  });

  it("accepts a subtype discriminator that narrows an inherited controlled value", () => {
    const parentField = inheritanceProjectionFixture.classes
      .find(({ id }) => id === "MediaBlock")
      ?.structure.fields.find(({ id }) => id === "media_type");
    expect(parentField).toBeDefined();

    const allowedAudio = { id: "media_type_audio", value: "audio" };
    const allowedImage = { id: "media_type_image", value: "image" };
    const ontologyWithDiscriminator = {
      ...inheritanceProjectionFixture,
      classes: inheritanceProjectionFixture.classes.map((concept) => {
        if (concept.id === "MediaBlock") {
          return {
            ...concept,
            structure: {
              ...concept.structure,
              fields: concept.structure.fields.map((field) =>
                field.id === "media_type"
                  ? { ...field, allowed_values: [allowedAudio, allowedImage] }
                  : field,
              ),
            },
          };
        }
        if (concept.id === "AudioBlock") {
          return {
            ...concept,
            structure: {
              ...concept.structure,
              fields: [
                ...concept.structure.fields,
                {
                  ...parentField!,
                  allowed_values: [allowedAudio],
                  example_value: "audio",
                },
              ],
            },
          };
        }
        return concept;
      }),
    };

    const index = buildOntologyIndex(
      ontologyWithDiscriminator as unknown as Parameters<typeof buildOntologyIndex>[0],
    );
    expect(
      index.effectiveFieldsByConceptId.get("AudioBlock")
        ?.find(({ field }) => field.id === "media_type"),
    ).toMatchObject({
      declaredOnId: "AudioBlock",
      inheritanceDepth: 0,
      field: { allowed_values: [allowedAudio] },
    });

    const ontologyWithInvalidValue = {
      ...ontologyWithDiscriminator,
      classes: ontologyWithDiscriminator.classes.map((concept) =>
        concept.id === "AudioBlock"
          ? {
              ...concept,
              structure: {
                ...concept.structure,
                fields: concept.structure.fields.map((field) =>
                  field.id === "media_type"
                    ? { ...field, allowed_values: [{ id: "media_type_video", value: "video" }] }
                    : field,
                ),
              },
            }
          : concept,
      ),
    };
    expect(() =>
      buildOntologyIndex(
        ontologyWithInvalidValue as unknown as Parameters<typeof buildOntologyIndex>[0],
      ),
    ).toThrow(/Conflicting inherited field media_type on AudioBlock/);

    const replaceAudioDiscriminator = (
      transform: (field: typeof parentField & Record<string, unknown>) => Record<string, unknown>,
    ) => ({
      ...ontologyWithDiscriminator,
      classes: ontologyWithDiscriminator.classes.map((concept) =>
        concept.id === "AudioBlock"
          ? {
              ...concept,
              structure: {
                ...concept.structure,
                fields: concept.structure.fields.map((field) =>
                  field.id === "media_type"
                    ? transform(field as typeof parentField & Record<string, unknown>)
                    : field,
                ),
              },
            }
          : concept,
      ),
    });
    const incompatibleRefinements = [
      replaceAudioDiscriminator((field) => ({ ...field, datatype: "integer" })),
      replaceAudioDiscriminator((field) => ({ ...field, required: false })),
      replaceAudioDiscriminator((field) => ({
        ...field,
        cardinality: { min: 0, max: 1 },
      })),
      replaceAudioDiscriminator((field) => ({
        ...field,
        cardinality: { min: 1, max: null },
      })),
      replaceAudioDiscriminator((field) => ({
        ...field,
        cardinality: { min: 1, max: 2 },
      })),
      replaceAudioDiscriminator((field) => ({ ...field, allowed_values: [] })),
    ];
    for (const incompatible of incompatibleRefinements) {
      expect(() =>
        buildOntologyIndex(incompatible as unknown as Parameters<typeof buildOntologyIndex>[0]),
      ).toThrow(/Conflicting inherited field media_type on AudioBlock/);
    }

    const ontologyWithOpenParent = {
      ...ontologyWithDiscriminator,
      classes: ontologyWithDiscriminator.classes.map((concept) =>
        concept.id === "MediaBlock"
          ? {
              ...concept,
              structure: {
                ...concept.structure,
                fields: concept.structure.fields.map((field) =>
                  field.id === "media_type" ? { ...field, allowed_values: [] } : field,
                ),
              },
            }
          : concept,
      ),
    };
    expect(() =>
      buildOntologyIndex(ontologyWithOpenParent as unknown as Parameters<typeof buildOntologyIndex>[0]),
    ).not.toThrow();

    const ontologyWithParentPattern = {
      ...ontologyWithDiscriminator,
      classes: ontologyWithDiscriminator.classes.map((concept) => {
        if (concept.id !== "MediaBlock" && concept.id !== "AudioBlock") return concept;
        return {
          ...concept,
          structure: {
            ...concept.structure,
            fields: concept.structure.fields.map((field) =>
              field.id === "media_type"
                ? { ...field, pattern: concept.id === "MediaBlock" ? "^audio$" : "^.+$" }
                : field,
            ),
          },
        };
      }),
    };
    expect(() =>
      buildOntologyIndex(ontologyWithParentPattern as unknown as Parameters<typeof buildOntologyIndex>[0]),
    ).toThrow(/Conflicting inherited field media_type on AudioBlock/);

    const mediaTemplate = inheritanceProjectionFixture.classes.find(({ id }) => id === "MediaBlock")!;
    const audioTemplate = inheritanceProjectionFixture.classes.find(({ id }) => id === "AudioBlock")!;
    const hierarchyTemplate = inheritanceProjectionFixture.relations.find(
      ({ id }) => id === "AudioBlock-is_a-MediaBlock",
    )!;
    const inheritedThroughNearerRefinement = {
      ...inheritanceProjectionFixture,
      classes: [
        ...inheritanceProjectionFixture.classes,
        {
          ...mediaTemplate,
          id: "GeneralMediaBlock",
          primary_parent_relation_id: null,
          structure: {
            ...mediaTemplate.structure,
            fields: [{ ...parentField!, allowed_values: [allowedAudio, allowedImage] }],
          },
        },
        {
          ...audioTemplate,
          id: "AIndirectMediaBlock",
          primary_parent_relation_id: "AIndirectMediaBlock-is_a-GeneralMediaBlock",
          structure: { ...audioTemplate.structure, fields: [] },
        },
        {
          ...audioTemplate,
          id: "ZRefinedMediaBlock",
          primary_parent_relation_id: "ZRefinedMediaBlock-is_a-GeneralMediaBlock",
          structure: {
            ...audioTemplate.structure,
            fields: [{ ...parentField!, allowed_values: [allowedAudio] }],
          },
        },
        {
          ...audioTemplate,
          id: "RefinementLeaf",
          primary_parent_relation_id: "RefinementLeaf-is_a-AIndirectMediaBlock",
          structure: { ...audioTemplate.structure, fields: [] },
        },
      ],
      relations: [
        ...inheritanceProjectionFixture.relations,
        {
          ...hierarchyTemplate,
          id: "AIndirectMediaBlock-is_a-GeneralMediaBlock",
          source_id: "AIndirectMediaBlock",
          target_id: "GeneralMediaBlock",
        },
        {
          ...hierarchyTemplate,
          id: "ZRefinedMediaBlock-is_a-GeneralMediaBlock",
          source_id: "ZRefinedMediaBlock",
          target_id: "GeneralMediaBlock",
        },
        {
          ...hierarchyTemplate,
          id: "RefinementLeaf-is_a-AIndirectMediaBlock",
          source_id: "RefinementLeaf",
          target_id: "AIndirectMediaBlock",
        },
        {
          ...hierarchyTemplate,
          id: "RefinementLeaf-is_a-ZRefinedMediaBlock",
          source_id: "RefinementLeaf",
          target_id: "ZRefinedMediaBlock",
        },
      ],
    };
    const refinementIndex = buildOntologyIndex(
      inheritedThroughNearerRefinement as unknown as Parameters<typeof buildOntologyIndex>[0],
    );
    expect(
      refinementIndex.effectiveFieldsByConceptId.get("RefinementLeaf")
        ?.find(({ field }) => field.id === "media_type"),
    ).toMatchObject({ declaredOnId: "ZRefinedMediaBlock", inheritanceDepth: 1 });
  });

  it("deduplicates a diamond field declaration and rejects conflicting field semantics", () => {
    const sharedField = {
      ...ontologyViewModelFixture.classes[0].structure.fields[0],
      id: "shared_field",
      labels: { zh: "共享字段", en: "Shared field", ja: "共有フィールド" },
      definitions: { zh: "共享定义", en: "Shared definition", ja: "共有定義" },
    };
    const withFields = ontologyViewModelFixture.classes.map((concept) => {
      if (concept.id === "RunResult") {
        return { ...concept, structure: { ...concept.structure, fields: [sharedField] } };
      }
      return concept;
    });
    const hierarchyTemplate = ontologyViewModelFixture.relations[0];
    const diamondOntology = {
      ...ontologyViewModelFixture,
      classes: withFields,
      relations: [
        ...ontologyViewModelFixture.relations,
        { ...hierarchyTemplate, id: "RuntimeEntity-is_a-RunResult", source_id: "RuntimeEntity", target_id: "RunResult" },
        { ...hierarchyTemplate, id: "ExecutableEntity-is_a-RunResult", source_id: "ExecutableEntity", target_id: "RunResult" },
      ],
    };
    const diamondIndex = buildOntologyIndex(
      diamondOntology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );

    expect(
      diamondIndex.effectiveFieldsByConceptId.get("AgentRun")
        ?.filter(({ field }) => field.id === "shared_field"),
    ).toEqual([
      expect.objectContaining({ declaredOnId: "RunResult", inheritanceDepth: 2 }),
    ]);

    const conflictingOntology = {
      ...ontologyViewModelFixture,
      classes: ontologyViewModelFixture.classes.map((concept) => {
        if (concept.id !== "RuntimeEntity" && concept.id !== "ExecutableEntity") return concept;
        return {
          ...concept,
          structure: {
            ...concept.structure,
            fields: [{
              ...sharedField,
              datatype: concept.id === "RuntimeEntity" ? "string" : "integer",
            }],
          },
        };
      }),
    };
    expect(() => buildOntologyIndex(
      conflictingOntology as unknown as Parameters<typeof buildOntologyIndex>[0],
    )).toThrow(/Conflicting inherited field shared_field on AgentRun/);
  });
});
