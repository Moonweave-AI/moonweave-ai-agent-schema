import { describe, expect, it } from "vitest";

import {
  concept,
  createRecordOperationsHarness,
  field,
  localized,
  relation,
} from "./helpers/record-operations-fixture";

describe("semantic-depth v3 example synchronization", () => {
  it("normalizes required, repeatable, controlled, and unknown example fields", () => {
    const fields = [
      field({ id: "required_scalar", required: true, exampleValue: "reviewed" }),
      field({ id: "required_many", required: true, max: null, exampleValue: "tag" }),
      field({ id: "minimum_many", min: 1, max: 3, exampleValue: "member" }),
      field({ id: "controlled", allowedValues: ["allowed"], exampleValue: "allowed" }),
      field({ id: "controlled_many", max: null, allowedValues: ["a", "b"], exampleValue: "a" }),
      field({ id: "optional" }),
    ];
    const accepted = concept({
      id: "Accepted",
      fields,
      examples: [
        { id: "positive", kind: "positive" },
        {
          id: "boundary",
          kind: "boundary",
          field_values: { required_scalar: "kept", controlled: "invalid", unknown: true },
        },
        {
          id: "case",
          kind: "case-fragment",
          field_values: { controlled_many: ["a", "b"] },
        },
        {
          id: "instance",
          kind: "instance",
          field_values: { controlled_many: ["a", "invalid"] },
        },
      ],
    });
    const deprecated = concept({
      id: "Deprecated",
      status: "deprecated",
      fields,
      examples: [{ id: "unchanged", kind: "positive", field_values: { unknown: true } }],
    });
    const effectiveStructures = new Map([
      [accepted.id, accepted.structure],
      [deprecated.id, deprecated.structure],
    ]);
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [accepted, deprecated] }],
      effectiveStructures,
    });

    harness.operations.synchronizeAcceptedConceptExamples();

    const examples = harness.allConcepts.get("Accepted")?.examples;
    expect(examples[0].field_values).toMatchObject({
      required_scalar: "reviewed",
      required_many: ["tag"],
      minimum_many: ["member"],
    });
    expect(examples[1].field_values).toEqual({
      required_scalar: "kept",
      controlled: "allowed",
    });
    expect(examples[2].field_values.controlled_many).toEqual(["a", "b"]);
    expect(examples[2].field_values.required_many).toEqual(["tag"]);
    expect(examples[3].field_values.controlled_many).toEqual(["a"]);
    expect(harness.allConcepts.get("Deprecated")?.examples[0].field_values).toEqual({
      unknown: true,
    });
  });

  it("rejects missing effective structures and required fields without reviewed values", () => {
    const missingStructure = concept({ id: "MissingStructure" });
    const missingHarness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [missingStructure] }],
      effectiveStructures: new Map(),
    });
    expect(() => missingHarness.operations.synchronizeAcceptedConceptExamples()).toThrow(
      "Missing effective structure for MissingStructure",
    );

    const invalidField = field({ id: "no_value", required: true, exampleValue: null });
    const invalid = concept({
      id: "Invalid",
      fields: [invalidField],
      examples: [{ id: "positive", kind: "positive", field_values: {} }],
    });
    const invalidHarness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [invalid] }],
      effectiveStructures: new Map([[invalid.id, invalid.structure]]),
    });
    expect(() => invalidHarness.operations.synchronizeAcceptedConceptExamples()).toThrow(
      "Required field no_value has no reviewed example_value",
    );
  });

  it("applies reviewed positive values and the FrontendViewAdapter boundary graph", () => {
    const frontend = concept({
      id: "FrontendViewAdapter",
      examples: [
        { id: "positive", kind: "positive", field_values: { retained: true } },
        { id: "boundary", kind: "boundary", related_node_ids: [], related_relation_ids: [] },
        { id: "instance", kind: "instance", field_values: { retained: true } },
      ],
    });
    const ordinary = concept({
      id: "Ordinary",
      examples: [
        { id: "positive", kind: "positive", field_values: { retained: true } },
        { id: "boundary", kind: "boundary", related_node_ids: ["Ordinary"] },
      ],
    });
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [frontend, ordinary] }],
    });

    harness.operations.applyReviewedExampleSemanticCorrections();

    const frontendExamples = harness.allConcepts.get(frontend.id)?.examples;
    expect(frontendExamples[0].field_values).toMatchObject({
      retained: true,
      adapter_id: "adapter-explorer-view",
      schema_version: "explorer-view@2",
    });
    expect(frontendExamples[1]).toMatchObject({
      related_node_ids: ["FrontendViewAdapter", "GraphIRAdapter", "ProjectionAdapter"],
      related_relation_ids: ["FrontendViewAdapter-is_a-ProjectionAdapter"],
    });
    expect(frontendExamples[2].field_values).toEqual({ retained: true });
    expect(harness.allConcepts.get(ordinary.id)?.examples).toEqual(ordinary.examples);
  });

  it("retains valid incident relations and deterministically falls back to parent, incident, or none", () => {
    const relations = [
      relation({ id: "A-is_a-Parent", sourceId: "A", targetId: "Parent", predicate: "is_a" }),
      relation({ id: "B-is_a-Parent", sourceId: "B", targetId: "Parent", predicate: "is_a" }),
      relation({ id: "C-relates_to-Target", sourceId: "C", targetId: "Target" }),
      relation({
        id: "Deprecated-relates_to-A",
        sourceId: "Deprecated",
        targetId: "A",
        status: "deprecated",
      }),
    ];
    const graphExample = (id: string, relationIds?: string[]) => ({
      id,
      kind: "positive",
      related_node_ids: [id.split("-")[0]],
      ...(relationIds === undefined ? {} : { related_relation_ids: relationIds }),
    });
    const classes = [
      concept({
        id: "A",
        primaryParentRelationId: "A-is_a-Parent",
        examples: [
          graphExample("A-valid", ["A-is_a-Parent", "C-relates_to-Target"]),
          { id: "A-instance", kind: "instance", related_node_ids: ["A"] },
        ],
      }),
      concept({
        id: "B",
        primaryParentRelationId: "B-is_a-Parent",
        examples: [graphExample("B-parent", ["missing"])],
      }),
      concept({ id: "C", examples: [graphExample("C-incident")] }),
      concept({ id: "D", examples: [graphExample("D-none", [])] }),
    ];
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes, relations }],
    });

    harness.operations.synchronizeAcceptedConceptExampleRelations();

    expect(harness.allConcepts.get("A")?.examples[0]).toMatchObject({
      related_relation_ids: ["A-is_a-Parent"],
      related_node_ids: ["A", "Parent"],
    });
    expect(harness.allConcepts.get("A")?.examples[1]).toEqual(classes[0].examples[1]);
    expect(harness.allConcepts.get("B")?.examples[0].related_relation_ids).toEqual([
      "B-is_a-Parent",
    ]);
    expect(harness.allConcepts.get("C")?.examples[0].related_relation_ids).toEqual([
      "C-relates_to-Target",
    ]);
    expect(harness.allConcepts.get("D")?.examples[0].related_relation_ids).toEqual([]);
  });

  it("keeps structured instances aligned with effective fields and adapter-family identity", () => {
    const adapterFamily = field({ id: "adapter_family", exampleValue: "generic" });
    const adapterId = field({ id: "adapter_id", exampleValue: "adapter-001" });
    const classes = [
      concept({ id: "Adapter" }),
      concept({
        id: "CrewAIAdapter",
        fields: [adapterFamily, adapterId],
        examples: [
          { id: "positive", kind: "positive", field_values: { adapter_id: "crew-001" } },
          {
            id: "CrewAIAdapter-example-instance-001",
            kind: "instance",
            field_values: { adapter_id: "stale", adapter_family: "stale", unknown: true },
          },
        ],
      }),
      concept({
        id: "CustomAdapter",
        fields: [adapterFamily, adapterId],
        examples: [{ id: "positive", kind: "positive", field_values: { adapter_id: "custom" } }],
      }),
      concept({
        id: "ExternalRecord",
        fields: [adapterFamily],
        examples: [],
      }),
      concept({ id: "NoFields", examples: [] }),
    ];
    const relations = [
      relation({ id: "CrewAIAdapter-is_a-Adapter", sourceId: "CrewAIAdapter", targetId: "Adapter", predicate: "is_a" }),
      relation({ id: "CustomAdapter-is_a-Adapter", sourceId: "CustomAdapter", targetId: "Adapter", predicate: "is_a" }),
      relation({ id: "Ignored-deprecated", sourceId: "ExternalRecord", targetId: "Adapter", predicate: "is_a", status: "deprecated" }),
      relation({ id: "Ignored-semantic", sourceId: "ExternalRecord", targetId: "Adapter" }),
    ];
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes, relations }],
    });

    harness.operations.ensureStructuredInstanceExamples();

    const crewInstance = harness.allConcepts.get("CrewAIAdapter")?.examples.find(
      ({ kind }: { kind: string }) => kind === "instance",
    );
    expect(crewInstance.field_values).toEqual({
      adapter_id: "crew-001",
      adapter_family: "crew-ai",
      unknown: true,
    });
    const customInstance = harness.allConcepts.get("CustomAdapter")?.examples.find(
      ({ kind }: { kind: string }) => kind === "instance",
    );
    expect(customInstance.field_values).toEqual({ adapter_id: "custom" });
    const externalInstance = harness.allConcepts.get("ExternalRecord")?.examples.find(
      ({ kind }: { kind: string }) => kind === "instance",
    );
    expect(externalInstance.field_values).toEqual({ adapter_family: "generic" });
    expect(harness.allConcepts.get("NoFields")?.examples).toEqual([]);
  });

  it("adds relation endpoints and ownership to empty or partially populated relation examples", () => {
    const relations = [
      relation({
        id: "A-relates_to-B",
        sourceId: "A",
        targetId: "B",
        examples: [{ id: "example", related_node_ids: ["A"], related_relation_ids: [] }],
      }),
      relation({ id: "C-relates_to-D", sourceId: "C", targetId: "D", examples: [] }),
    ];
    delete relations[1].examples;
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", relations }],
    });

    harness.operations.synchronizeAcceptedRelationExampleOwnership();

    expect(harness.allRelations.get("A-relates_to-B")?.examples[0]).toMatchObject({
      related_node_ids: ["A", "B"],
      related_relation_ids: ["A-relates_to-B"],
    });
    expect(harness.allRelations.get("C-relates_to-D")?.examples).toEqual([]);
  });
});

describe("semantic-depth v3 deprecated-relation narrative repair", () => {
  const deprecatedId = "Legacy-is_a-WrongKind";

  it("does not treat a still-valid predicate as a deprecated relation-id narrative", () => {
    const handoff = concept({
      id: "Handoff",
      structure: {
        identity_keys: ["handoff_id"],
        fields: [],
        constraints: [],
        required_relation_constraints: [{
          id: "handoff-target",
          direction: "outgoing",
          predicate: "transfers_control_to",
          target_concept_id: "AgentActor",
          cardinality: { min: 1, max: 1 },
        }],
      },
    });
    const harness = createRecordOperationsHarness({
      modules: [{
        id: "module-a",
        classes: [handoff],
        relations: [
          relation({
            id: "transfers_control_to",
            sourceId: "Handoff",
            targetId: "HandoffTarget",
            predicate: "transfers_control_to",
            status: "deprecated",
          }),
          relation({
            id: "Handoff-transfers_control_to-AgentActor",
            sourceId: "Handoff",
            targetId: "AgentActor",
            predicate: "transfers_control_to",
          }),
        ],
      }],
    });

    expect(() => harness.operations.removeDeprecatedRelationNarratives()).not.toThrow();
    expect(
      harness.allConcepts.get("Handoff")?.structure.required_relation_constraints[0],
    ).toMatchObject({ predicate: "transfers_control_to", target_concept_id: "AgentActor" });
  });

  it("fails when authoritative fields or primary taxonomy still assert a deprecated fact", () => {
    const deprecated = relation({
      id: deprecatedId,
      sourceId: "Legacy",
      targetId: "WrongKind",
      predicate: "is_a",
      status: "deprecated",
    });
    const definitionHarness = createRecordOperationsHarness({
      modules: [{
        id: "module-a",
        classes: [concept({
          id: "DefinitionLeak",
          definitions: localized(deprecatedId, deprecatedId, deprecatedId),
        })],
        relations: [deprecated],
      }],
    });
    expect(() => definitionHarness.operations.removeDeprecatedRelationNarratives()).toThrow(
      "DefinitionLeak.definitions still asserts a deprecated relation",
    );

    const parentHarness = createRecordOperationsHarness({
      modules: [{
        id: "module-a",
        classes: [concept({ id: "ParentLeak", primaryParentRelationId: deprecatedId })],
        relations: [deprecated],
      }],
    });
    expect(() => parentHarness.operations.removeDeprecatedRelationNarratives()).toThrow(
      `ParentLeak still uses deprecated primary parent ${deprecatedId}`,
    );
  });

  it("rebuilds explanatory narratives from accepted source, target, and no-anchor states", () => {
    const contaminated = localized(deprecatedId, deprecatedId, deprecatedId);
    const clean = localized("清洁", "clean", "クリーン");
    const source = concept({
      id: "Source",
      primaryParentRelationId: "Source-relates_to-Target",
      why_needed: contaminated,
      includes: [contaminated, clean],
      excludes: [clean, contaminated],
      sibling_differentiation: [contaminated, clean],
      examples: [
        { id: "clean-case", kind: "case-fragment", note: clean },
        { id: "stale-case", kind: "case-fragment", note: contaminated },
      ],
      review: contaminated,
      change_note: clean,
    });
    const targeted = concept({
      id: "Targeted",
      definitions: undefined,
      why_needed: clean,
      includes: [clean],
      excludes: [clean],
      examples: undefined,
      review: clean,
      change_note: contaminated,
    });
    const lonely = concept({
      id: "Lonely",
      why_needed: contaminated,
      includes: [clean],
      excludes: [clean],
      sibling_differentiation: [],
      examples: [],
    });
    const cleanConcept = concept({ id: "Untouched" });
    const deprecatedConcept = concept({
      id: "AlreadyDeprecated",
      status: "deprecated",
      why_needed: contaminated,
    });
    const relations = [
      relation({ id: deprecatedId, sourceId: "Legacy", targetId: "WrongKind", status: "deprecated" }),
      relation({ id: "Source-relates_to-Target", sourceId: "Source", targetId: "Target" }),
      relation({ id: "Source-also-Other", sourceId: "Source", targetId: "Other" }),
      relation({ id: "Other-relates_to-Targeted", sourceId: "Other", targetId: "Targeted" }),
    ];
    const harness = createRecordOperationsHarness({
      modules: [{
        id: "module-a",
        classes: [source, targeted, lonely, cleanConcept, deprecatedConcept],
        relations,
      }],
    });

    harness.operations.removeDeprecatedRelationNarratives();

    const repairedSource = harness.allConcepts.get("Source");
    expect(repairedSource?.why_needed).not.toEqual(contaminated);
    expect(repairedSource?.includes[1]).toEqual(clean);
    expect(repairedSource?.sibling_differentiation).toEqual([clean]);
    expect(repairedSource?.examples.some(({ id }: { id: string }) => id === "clean-case")).toBe(true);
    expect(JSON.stringify(repairedSource)).not.toContain(deprecatedId);
    expect(repairedSource?.examples[0].descriptions.en).toContain("source endpoint");

    const repairedTarget = harness.allConcepts.get("Targeted");
    expect(repairedTarget?.examples[0].descriptions.en).toContain("target endpoint");
    expect(repairedTarget?.change_note).not.toEqual(contaminated);
    expect(harness.allConcepts.get("Lonely")?.examples[0]).not.toHaveProperty("descriptions");
    expect(harness.allConcepts.get("Untouched")).toEqual(cleanConcept);
    expect(harness.allConcepts.get("AlreadyDeprecated")?.why_needed).toEqual(contaminated);
  });
});

describe("semantic-depth v3 reviewed anchors", () => {
  const anchorParameters = {
    moduleId: "module-a",
    id: "RetrievalArtifact",
    labels: localized("检索产物", "retrieval artifact", "検索成果物"),
    definitions: localized("检索产物定义", "retrieval artifact definition", "検索成果物定義"),
    semanticKind: "information",
  };

  it("requires the retrieval-query evidence anchor", () => {
    const harness = createRecordOperationsHarness({ modules: [{ id: "module-a" }] });
    expect(() => harness.operations.addReviewedAnchor(anchorParameters)).toThrow(
      "RetrievalQuery is missing",
    );
  });

  it("adds root and child anchors with canonical or fallback parent labels", () => {
    const retrievalQuery = concept({
      id: "RetrievalQuery",
      fields: [field({ id: "top_k" })],
      structure: {
        identity_keys: [],
        fields: [field({ id: "top_k" })],
        constraints: [{ id: "retrieval-query-positive-top-k" }],
        required_relation_constraints: [],
      },
    });
    const parent = concept({ id: "Parent" });
    const harness = createRecordOperationsHarness({
      modules: [{ id: "module-a", classes: [retrievalQuery, parent] }],
    });

    const root = harness.operations.addReviewedAnchor(anchorParameters);
    expect(root.primary_parent_relation_id).toBeNull();
    expect(harness.allRelations.has("RetrievalArtifact-is_a-Parent")).toBe(false);

    harness.operations.addReviewedAnchor({
      ...anchorParameters,
      id: "RetrievalResult",
      parentId: "Parent",
    });
    expect(harness.allRelations.get("RetrievalResult-is_a-Parent")?.definitions.en).toContain(
      parent.labels.en,
    );

    harness.operations.addReviewedAnchor({
      ...anchorParameters,
      id: "FallbackChild",
      parentId: "UnresolvedParent",
    });
    expect(harness.allRelations.get("FallbackChild-is_a-UnresolvedParent")?.definitions).toEqual({
      zh: `${anchorParameters.labels.zh}是一种UnresolvedParent。`,
      en: `${anchorParameters.labels.en} is a kind of UnresolvedParent.`,
      ja: `${anchorParameters.labels.ja}はUnresolvedParentの一種です。`,
    });
  });
});
