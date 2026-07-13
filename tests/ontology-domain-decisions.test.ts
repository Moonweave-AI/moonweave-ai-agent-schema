import { describe, expect, it } from "vitest";

import { validateOntologyDecisionBundles } from "../scripts/lib/ontology-decision-validation.mjs";

const localized = (value: string) => ({ zh: `${value}-zh`, en: `${value}-en`, ja: `${value}-ja` });

const legacy = {
  modules: [{ id: "module-a" }],
  classes: [{ id: "Parent" }, { id: "Child" }],
};

const acceptedBundle = () => ({
  review_scope: ["module-a"],
  reviewer: {
    reviewer_id: "ontology-reviewer",
    reviewer_role: "ontology",
    reviewer_kind: "automated-agent",
    reviewed_on: "2026-07-13",
  },
  modules: [
    {
      module_id: "module-a",
      taxonomy_applicability: "specialization",
      rationale: localized("module-rationale"),
      semantic_relations: [
        {
          source_id: "Child",
          predicate: "uses",
          target_id: "Parent",
          relation_kind: "information",
          rationale: localized("relation-rationale"),
        },
      ],
    },
  ],
  concept_decisions: [
    {
      concept_id: "Parent",
      decision: "keep_root",
      semantic_kind: "entity",
      primary_parent_id: null,
      additional_parent_ids: [],
      target_module_id: "module-a",
      target_concept_id: null,
      target_field_id: null,
      rationale: localized("parent-rationale"),
    },
    {
      concept_id: "Child",
      decision: "keep_reparent",
      semantic_kind: "entity",
      primary_parent_id: "Parent",
      additional_parent_ids: [],
      target_module_id: "module-a",
      target_concept_id: null,
      target_field_id: null,
      rationale: localized("child-rationale"),
    },
  ],
  new_anchors: [],
});

describe("reviewed ontology domain-decision validation", () => {
  it("accepts exact coverage, a real specialization chain, and source-owned relations", () => {
    expect(
      validateOntologyDecisionBundles({
        legacy,
        bundles: [acceptedBundle()],
        sourceIds: ["source-a"],
      }),
    ).toEqual({
      bundleCount: 1,
      conceptDecisionCount: 2,
      retainedConceptCount: 2,
      anchorCount: 0,
      moduleReviewCount: 1,
      semanticRelationCount: 1,
    });
  });

  it("rejects an is_a cycle with the reviewed path in the error", () => {
    const bundle = acceptedBundle();
    bundle.concept_decisions[0] = {
      ...bundle.concept_decisions[0],
      decision: "keep_reparent",
      primary_parent_id: "Child",
    };

    expect(() =>
      validateOntologyDecisionBundles({ legacy, bundles: [bundle], sourceIds: [] }),
    ).toThrow(/contains a cycle: (Parent -> Child -> Parent|Child -> Parent -> Child)/u);
  });

  it("rejects semantic assertions stored outside the source Concept owner Module", () => {
    const twoModuleLegacy = {
      modules: [{ id: "module-a" }, { id: "module-b" }],
      classes: [{ id: "Parent" }, { id: "Child" }],
    };
    const bundle = acceptedBundle();
    bundle.modules.push({
      module_id: "module-b",
      taxonomy_applicability: "flat-root-exception",
      rationale: localized("module-b-rationale"),
      semantic_relations: [
        {
          source_id: "Child",
          predicate: "references",
          target_id: "Parent",
          relation_kind: "information",
          rationale: localized("misowned-relation"),
        },
      ],
    });
    bundle.concept_decisions[0] = {
      ...bundle.concept_decisions[0],
      target_module_id: "module-b",
    };

    expect(() =>
      validateOntologyDecisionBundles({ legacy: twoModuleLegacy, bundles: [bundle], sourceIds: [] }),
    ).toThrow(/does not own relation source Child/u);
  });
});
