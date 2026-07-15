import { describe, expect, it } from "vitest";

import {
  assertObjectEvidenceQuality,
  objectClaimKey,
  objectEvidenceFallbackMetrics,
  objectEvidenceVolumeMetrics,
  rewriteConceptDirectClaims,
  rewriteGenericConceptExamples,
  rewriteObjectEvidenceTree,
  rewriteObjectReview,
  rewriteRelationDirectClaims,
} from "../scripts/lib/ontology-v3-object-evidence.mjs";
import { validateReleaseObjectEvidence } from "../scripts/lib/ontology-release-evidence-validation.mjs";

const localized = (value: string) => ({ zh: value, en: value, ja: value });

const directClaim = {
  source_id: "official-runtime-docs",
  supports: "Provides evidence for the reviewed distinction of ExampleConcept.",
  locator: "Guide > Runtime lifecycle",
  evidence_kind: "design-inference",
  confidence: "medium",
  review_status: "accepted",
};

const moduleRecord = {
  id: "runtime-example",
  plane_id: "runtime-plane",
  labels: localized("Runtime example"),
};

const conceptRecord = {
  id: "ExampleConcept",
  module_id: moduleRecord.id,
  labels: localized("Example concept"),
  short_definitions: localized("An addressable runtime record with a stable identity."),
  semantic_kind: "information",
  primary_parent_relation_id: "ExampleConcept-is_a-RuntimeRecord",
  root_status: null,
  status: "accepted",
  source_claims: [directClaim],
  sibling_differentiation: [
    {
      sibling_concept_id: "SiblingConcept",
      shared_parent_concept_id: "RuntimeRecord",
      differentia: localized(
        "ExampleConcept has a stable runtime identity; SiblingConcept is only a specification.",
      ),
      source_claims: [directClaim],
    },
  ],
  structure: {
    fields: [
      {
        id: "record_id",
        labels: localized("record ID"),
        example_value: "record-001",
      },
    ],
  },
  examples: [
    {
      id: "ExampleConcept-example-positive-001",
      kind: "positive",
      labels: localized("positive"),
      descriptions: localized(
        "In an auditable agent run, ExampleConcept-001 satisfies the generic definition.",
      ),
      field_values: {},
      related_node_ids: ["ExampleConcept"],
      related_relation_ids: [],
      expected_result: localized("generic result"),
      why_valid_or_invalid: localized("generic reason"),
      source_claims: [directClaim],
    },
    {
      id: "ExampleConcept-example-boundary-001",
      kind: "boundary",
      labels: localized("boundary"),
      descriptions: localized("A related object lacks the differentia required by Example concept."),
      field_values: {},
      related_node_ids: ["ExampleConcept"],
      related_relation_ids: [],
      expected_result: localized("generic result"),
      why_valid_or_invalid: localized("generic reason"),
      source_claims: [directClaim],
    },
  ],
  review: {
    review_status: "accepted",
    reviewers: [
      {
        reviewer_id: "runtime-domain-reviewer",
        reviewer_role: "domain",
        reviewer_kind: "automated-agent",
        reviewed_on: "2026-07-14",
        decision_note: localized("same note"),
      },
      {
        reviewer_id: "ontology-reviewer",
        reviewer_role: "ontology",
        reviewer_kind: "automated-agent",
        reviewed_on: "2026-07-14",
        decision_note: localized("same note"),
      },
    ],
  },
};

const siblingConcept = {
  ...conceptRecord,
  id: "SiblingConcept",
  labels: localized("Sibling concept"),
  semantic_kind: "specification",
  primary_parent_relation_id: "SiblingConcept-is_a-RuntimeRecord",
  source_claims: [],
  sibling_differentiation: [],
  examples: [],
};

const relationRecord = {
  id: "ExampleConcept-recorded_by-SiblingConcept",
  module_id: moduleRecord.id,
  labels: localized("recorded by"),
  definitions: localized("An example record is governed by one sibling specification."),
  predicate: "recorded_by",
  source_id: "ExampleConcept",
  target_id: "SiblingConcept",
  relation_kind: "information",
  layout_role: "cross-link",
  status: "accepted",
  source_claims: [directClaim],
};

describe("ontology v3 object evidence", () => {
  it("rewrites every Concept direct claim with explicit object and inference boundaries", () => {
    const before = structuredClone(conceptRecord);
    const rewritten = rewriteConceptDirectClaims({
      concept: conceptRecord,
      module: moduleRecord,
      operationalNotions: new Map([
        [
          objectClaimKey(directClaim),
          "The runtime emits one addressable record per completed lifecycle transition.",
        ],
      ]),
    });

    expect(conceptRecord).toEqual(before);
    expect(rewritten).not.toBe(conceptRecord);
    expect(rewritten.source_claims[0]).not.toBe(conceptRecord.source_claims[0]);
    expect(rewritten.source_claims[0].supports).toMatch(
      /official-runtime-docs.*Guide > Runtime lifecycle.*ExampleConcept.*Example concept/iu,
    );
    expect(rewritten.source_claims[0].supports).toMatch(
      /one addressable record per completed lifecycle transition/iu,
    );
    expect(rewritten.source_claims[0].supports).toMatch(
      /owner runtime-example.*semantic kind information.*backbone.*Moonweave design inference/iu,
    );
    expect(rewritten.source_claims[0].supports).not.toMatch(
      /reviewed Module boundary|Provides evidence for the reviewed distinction/iu,
    );

    expect(() =>
      rewriteConceptDirectClaims({
        concept: conceptRecord,
        module: moduleRecord,
        operationalNotions: new Map(),
      }),
    ).toThrow(/operational notion.*official-runtime-docs.*Runtime lifecycle/iu);

    const tree = rewriteObjectEvidenceTree({ record: rewritten });
    const nestedClaims = [
      tree.sibling_differentiation[0].source_claims[0],
      ...tree.examples.map(({ source_claims: claims }) => claims[0]),
    ];
    expect(nestedClaims).toHaveLength(3);
    for (const claim of nestedClaims) {
      expect(objectClaimKey(claim)).toBe(objectClaimKey(tree.source_claims[0]));
      expect(claim.supports).not.toContain(tree.source_claims[0].supports);
      expect(claim.supports).not.toMatch(
        /reviewed Module boundary|Provides evidence for the reviewed distinction/iu,
      );
      expect(claim.supports).toMatch(
        /Root object ExampleConcept.*nested object.*at \$.*claim key official-runtime-docs::Guide > Runtime lifecycle/iu,
      );
      expect(claim.supports).toMatch(/applies to this nested object because/iu);
      expect(claim.supports).toMatch(/Moonweave contextualization/iu);
    }
    const positiveClaim = tree.examples[0].source_claims[0];
    expect(positiveClaim.supports).toContain("exact path and object identity");
    expect(positiveClaim.supports.match(/Guide > Runtime lifecycle/gu)).toHaveLength(1);
    expect(positiveClaim.supports).not.toContain(tree.examples[0].descriptions.en);
    expect(objectEvidenceVolumeMetrics({ classes: [tree], relations: [] })).toMatchObject({
      nested_claim_count: 3,
      nested_copied_direct_support_count: 0,
    });
  });

  it("rewrites Relation claims with ID, predicate, direction, and definition", () => {
    const rewritten = rewriteRelationDirectClaims({
      relation: relationRecord,
      sourceConcept: conceptRecord,
      targetConcept: siblingConcept,
      module: moduleRecord,
      operationalNotions: new Map([
        [
          objectClaimKey(directClaim),
          "The runtime record links to the specification that governed its creation.",
        ],
      ]),
    });

    expect(rewritten).not.toBe(relationRecord);
    expect(rewritten.source_claims[0].supports).toMatch(
      /ExampleConcept-recorded_by-SiblingConcept.*recorded_by/iu,
    );
    expect(rewritten.source_claims[0].supports).toMatch(
      /ExampleConcept.*—recorded_by→.*SiblingConcept/iu,
    );
    expect(rewritten.source_claims[0].supports).toContain(
      relationRecord.definitions.en,
    );
    expect(rewritten.source_claims[0].supports).toMatch(/Moonweave design inference/iu);
  });

  it("separates domain, ontology, and language review identities and decisions", () => {
    const rewritten = rewriteObjectReview({
      record: conceptRecord,
      module: moduleRecord,
      reviewedOn: "2026-07-14",
      useCase: localized("replay one runtime transition from its durable record"),
      ontologyInvariants: localized("stable identity and one accepted primary parent"),
      languageReviewerId: "trilingual-reviewer",
    });
    const domain = rewritten.review.reviewers.find(
      ({ reviewer_role: role }: { reviewer_role: string }) => role === "domain",
    );
    const ontology = rewritten.review.reviewers.find(
      ({ reviewer_role: role }: { reviewer_role: string }) => role === "ontology",
    );
    const language = rewritten.review.reviewers.find(
      ({ reviewer_role: role }: { reviewer_role: string }) => role === "schema",
    );

    expect(new Set(rewritten.review.reviewers.map(({ reviewer_id: id }) => id)).size).toBe(3);
    expect(domain?.decision_note.en).toMatch(/owned by runtime-example.*replay/iu);
    expect(ontology?.decision_note.en).toMatch(
      /semantic kind information.*primary parent.*stable identity/iu,
    );
    expect(language?.decision_note.en).toMatch(/terminology.*three languages/iu);
    expect(domain?.decision_note).not.toEqual(ontology?.decision_note);
    expect(conceptRecord.review.reviewers).toHaveLength(2);

    const reviewedRelation = rewriteObjectReview({
      record: { ...relationRecord, review: conceptRecord.review },
      module: moduleRecord,
      reviewedOn: "2026-07-14",
      useCase: localized("trace which specification governed a runtime record"),
      ontologyInvariants: localized("accepted endpoints and canonical direction"),
      languageReviewerId: "trilingual-reviewer",
    });
    const relationOntologyNote = reviewedRelation.review.reviewers.find(
      ({ reviewer_role: role }: { reviewer_role: string }) => role === "ontology",
    )?.decision_note.en;
    expect(relationOntologyNote).toMatch(/predicate recorded_by/iu);
    expect(relationOntologyNote).toMatch(/ExampleConcept.*→.*SiblingConcept/iu);
    expect(relationOntologyNote).toMatch(/relation kind information.*layout role cross-link/iu);
    expect(relationOntologyNote).not.toMatch(/reviewed root|not-applicable/iu);
  });

  it("grounds only generic examples in accepted facts and reviewed siblings", () => {
    const conceptById = new Map([
      [conceptRecord.id, conceptRecord],
      [siblingConcept.id, siblingConcept],
    ]);
    const rewritten = rewriteGenericConceptExamples({
      concept: conceptRecord,
      relations: [relationRecord],
      conceptById,
    });
    const positive = rewritten.examples.find(({ kind }: { kind: string }) => kind === "positive");
    const boundary = rewritten.examples.find(({ kind }: { kind: string }) => kind === "boundary");

    expect(conceptRecord.examples[0].descriptions.en).toMatch(/In an auditable agent run/iu);
    expect(positive?.descriptions.en).not.toMatch(/In an auditable agent run/iu);
    expect(positive?.descriptions.en).toMatch(/traced task execution/iu);
    expect(positive?.descriptions.en).toMatch(/recorded_by/iu);
    expect(positive?.descriptions.en).toContain("ExampleConcept recorded_by SiblingConcept");
    expect(positive?.descriptions.en).toContain(
      conceptRecord.short_definitions.en.replace(/[.!?]+$/u, ""),
    );
    expect(positive?.why_valid_or_invalid.en).toMatch(/real operational context.*canonical direction/iu);
    expect(positive?.related_node_ids).toEqual(["ExampleConcept", "SiblingConcept"]);
    expect(positive?.related_relation_ids).toEqual([relationRecord.id]);
    expect(boundary?.descriptions.en).not.toMatch(/A related object lacks/iu);
    expect(boundary?.descriptions.en).toMatch(/SiblingConcept.*stable runtime identity/iu);
    expect(boundary?.related_node_ids).toEqual(["ExampleConcept", "SiblingConcept"]);
    expect(boundary?.related_relation_ids).toEqual([]);
  });

  it("re-renders a reviewed positive scenario when synchronized field values are absent from its prose", () => {
    const fieldValues = {
      adapter_id: "adapter-a2a",
      scope: ["task", "message", "trust"],
    };
    const positive = {
      ...conceptRecord.examples[0],
      descriptions: localized(
        "During a traced task execution, the reviewed record participates in one accepted fact.",
      ),
      field_values: fieldValues,
    };
    const concept = {
      ...conceptRecord,
      examples: [positive],
    };

    const rewritten = rewriteGenericConceptExamples({
      concept,
      relations: [relationRecord],
      conceptById: new Map([
        [concept.id, concept],
        [siblingConcept.id, siblingConcept],
      ]),
    });

    expect(positive.descriptions.en).not.toContain('"adapter-a2a"');
    expect(rewritten.examples[0].descriptions.en).toContain('adapter_id="adapter-a2a"');
    expect(rewritten.examples[0].descriptions.en).toContain(
      'scope=["task","message","trust"]',
    );
    expect(rewritten.examples[0].field_values).toEqual(fieldValues);
  });

  it("uses a real field example value when no accepted relation can ground a positive", () => {
    const withoutSibling = {
      ...conceptRecord,
      sibling_differentiation: [],
      examples: [conceptRecord.examples[0]],
    };
    const rewritten = rewriteGenericConceptExamples({
      concept: withoutSibling,
      relations: [],
      conceptById: new Map([[withoutSibling.id, withoutSibling]]),
    });
    expect(rewritten.examples[0].descriptions.en).toMatch(/record_id.*record-001/iu);
    expect(rewritten.examples[0].descriptions.en).toContain(
      conceptRecord.short_definitions.en.replace(/[.!?]+$/u, ""),
    );
    expect(rewritten.examples[0].field_values).toEqual({ record_id: "record-001" });
    expect(rewritten.examples[0].related_node_ids).toEqual(["ExampleConcept"]);
    expect(rewritten.examples[0].related_relation_ids).toEqual([]);
  });

  it("counts and rejects every fallback family until all counts reach zero", () => {
    const initial = objectEvidenceFallbackMetrics({
      classes: [conceptRecord],
      relations: [relationRecord],
    });
    expect(initial).toEqual({
      fallback_concept_claim_count: 1,
      fallback_relation_claim_count: 1,
      copied_module_claim_count: 0,
      recursive_fallback_claim_count: 5,
      recursive_non_object_specific_claim_count: 5,
      nested_copied_direct_support_count: 3,
      nested_non_contextual_claim_count: 3,
      generic_positive_example_count: 1,
      generic_boundary_example_count: 1,
      same_reviewer_note_count: 1,
    });
    expect(() =>
      assertObjectEvidenceQuality({ classes: [conceptRecord], relations: [relationRecord] }),
    ).toThrow(/fallback_concept_claim_count=1.*same_reviewer_note_count=1/iu);

    const reviewedConcept = rewriteObjectReview({
      record: rewriteGenericConceptExamples({
        concept: rewriteConceptDirectClaims({
          concept: conceptRecord,
          module: moduleRecord,
          operationalNotions: new Map([
            [objectClaimKey(directClaim), "One lifecycle transition emits one durable record."],
          ]),
        }),
        relations: [relationRecord],
        conceptById: new Map([
          [conceptRecord.id, conceptRecord],
          [siblingConcept.id, siblingConcept],
        ]),
      }),
      module: moduleRecord,
      reviewedOn: "2026-07-14",
      useCase: localized("replay one runtime transition"),
      ontologyInvariants: localized("stable identity and one accepted primary parent"),
      languageReviewerId: "trilingual-reviewer",
    });
    const cleanConcept = rewriteObjectEvidenceTree({ record: reviewedConcept });
    const cleanRelation = rewriteObjectEvidenceTree({
      record: rewriteRelationDirectClaims({
        relation: relationRecord,
        sourceConcept: conceptRecord,
        targetConcept: siblingConcept,
        module: moduleRecord,
        operationalNotions: new Map([
          [objectClaimKey(directClaim), "The durable record cites its governing specification."],
        ]),
      }),
    });
    expect(
      objectEvidenceFallbackMetrics({ classes: [cleanConcept], relations: [cleanRelation] }),
    ).toEqual({
      fallback_concept_claim_count: 0,
      fallback_relation_claim_count: 0,
      copied_module_claim_count: 0,
      recursive_fallback_claim_count: 0,
      recursive_non_object_specific_claim_count: 0,
      nested_copied_direct_support_count: 0,
      nested_non_contextual_claim_count: 0,
      generic_positive_example_count: 0,
      generic_boundary_example_count: 0,
      same_reviewer_note_count: 0,
    });
    expect(() =>
      assertObjectEvidenceQuality({ classes: [cleanConcept], relations: [cleanRelation] }),
    ).not.toThrow();
    expect(
      objectEvidenceVolumeMetrics({ classes: [cleanConcept], relations: [cleanRelation] }),
    ).toMatchObject({
      nested_claim_count: 3,
      nested_copied_direct_support_count: 0,
    });
  });

  it("enforces object-specific evidence on source-merged release-evidence candidates", () => {
    const canonical = { classes: [conceptRecord], relations: [relationRecord] };

    expect(() =>
      validateReleaseObjectEvidence({
        canonical,
        releaseEvidence: { entries: [], rowsByPath: new Map() },
      }),
    ).not.toThrow();
    expect(() =>
      validateReleaseObjectEvidence({
        canonical,
        releaseEvidence: {
          entries: [{ relativePath: "research/ontology-concept-semantic-depth-v3-ledger.csv" }],
          rowsByPath: new Map(),
        },
      }),
    ).toThrow(/Object evidence fallback gate failed.*fallback_concept_claim_count=1/iu);
  });
});
