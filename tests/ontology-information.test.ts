import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildEffectiveConceptStructures } from "../scripts/lib/ontology-concept-structure.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

import {
  candidateOntology,
  collectSourceClaims,
  duplicateValues,
  examplesWithOwners,
  hasText,
  isLocalized,
  localizedListIsComplete,
  repositoryRoot,
  registryIds,
  type CandidateOntology,
  type Concept,
  type InformationOwner,
  type OntologyExample,
  type Relation,
} from "./helpers/ontology-information-fixture";

describe("candidate ontology node information", () => {
  it("requires accepted concepts to have complete trilingual labels and definitions", () => {
    const invalid = candidateOntology().classes
      .filter((concept) => concept.status === "accepted")
      .filter(
        (concept) =>
          !isLocalized(concept.labels) ||
          !isLocalized(concept.short_definitions) ||
          !isLocalized(concept.definitions),
      )
      .map((concept) => concept.id);

    expect(invalid).toEqual([]);
  });

  it("requires the root and every domain and module to carry direct explanatory information", () => {
    const ontology = candidateOntology();
    const invalidRoot =
      isLocalized(ontology.labels) &&
      isLocalized(ontology.short_definitions) &&
      isLocalized(ontology.definitions) &&
      isLocalized(ontology.why_needed) &&
      localizedListIsComplete(ontology.includes) &&
      localizedListIsComplete(ontology.excludes) &&
      (ontology.examples?.length ?? 0) > 0 &&
      (ontology.source_claims?.length ?? 0) > 0
        ? []
        : [ontology.id];
    const invalidOrganizationalNodes = [...ontology.planes, ...ontology.modules]
      .filter(
        (node) =>
          !isLocalized(node.labels) ||
          !isLocalized(node.definitions) ||
          !isLocalized(node.purpose) ||
          !localizedListIsComplete(node.includes) ||
          !localizedListIsComplete(node.excludes) ||
          (node.examples?.length ?? 0) === 0 ||
          (node.source_claims?.length ?? 0) === 0,
      )
      .map((node) => node.id);

    expect([...invalidRoot, ...invalidOrganizationalNodes]).toEqual([]);
  });

  it("requires accepted concepts to explain necessity, inclusion, exclusion, and direct evidence", () => {
    const invalid = candidateOntology().classes
      .filter((concept) => concept.status === "accepted")
      .filter(
        (concept) =>
          !isLocalized(concept.why_needed) ||
          !localizedListIsComplete(concept.includes) ||
          !localizedListIsComplete(concept.excludes) ||
          (concept.source_claims?.length ?? 0) === 0,
      )
      .map((concept) => concept.id);

    expect(invalid).toEqual([]);
  });

  it("rejects generic information templates that only satisfy field presence", () => {
    const forbidden = [
      /synthetic audit scenario/iu,
      /is needed so this meaning can be distinguished, related, and validated consistently/iu,
      /objects that satisfy the formal definition and ownership boundary/iu,
      /classified as .* under the reviewed definition/iu,
      /the example satisfies the definition boundary and ownership conditions/iu,
    ];
    const invalid = candidateOntology().classes.flatMap((concept) => {
      const information = JSON.stringify({
        why_needed: concept.why_needed,
        includes: concept.includes,
        excludes: concept.excludes,
        examples: (concept.examples ?? []).filter(({ kind }) =>
          ["positive", "boundary", "counterexample"].includes(kind),
        ),
      });
      return forbidden.some((pattern) => pattern.test(information)) ? [concept.id] : [];
    });

    expect(invalid).toEqual([]);
  });

  it("does not duplicate the root software-defect path as one fragment per Module", () => {
    const invalid = candidateOntology().modules.flatMap((module) =>
      (module.examples ?? [])
        .filter((example) =>
          example.kind === "case-fragment" &&
          example.scenario_id === "software-defect-repair",
        )
        .map((example) => `${module.id}:${example.id}`),
    );

    expect(invalid).toEqual([]);
  });

  it("requires every accepted concept to have a positive and a counterexample or boundary example", () => {
    const invalid = candidateOntology().classes
      .filter((concept) => concept.status === "accepted")
      .filter((concept) => {
        const kinds = new Set((concept.examples ?? []).map((example) => example.kind));
        return !kinds.has("positive") ||
          (!kinds.has("counterexample") && !kinds.has("boundary"));
      })
      .map((concept) => concept.id);

    expect(invalid).toEqual([]);
  });

  it("resolves every example and competency-question reference", () => {
    const ontology = candidateOntology();
    const graphNodeIds = new Set([
      ontology.id,
      ...ontology.planes.map((plane) => plane.id),
      ...ontology.modules.map((module) => module.id),
      ...ontology.classes.map((concept) => concept.id),
    ]);
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const relationIds = new Set(ontology.relations.map((relation) => relation.id));
    const casePathIds = new Set(ontology.case_paths.map((path) => path.id));
    const examples = examplesWithOwners(ontology);
    const exampleById = new Map(examples.map(({ example }) => [example.id, example]));
    const invalidExampleReferences = examples.flatMap(({ example }) => [
      ...example.related_node_ids
        .filter((id) => !graphNodeIds.has(id))
        .map((id) => `${example.id}:node:${id}`),
      ...example.related_relation_ids
        .filter((id) => !relationIds.has(id))
        .map((id) => `${example.id}:relation:${id}`),
      ...(example.scenario_id !== null && !casePathIds.has(example.scenario_id)
        ? [`${example.id}:scenario:${example.scenario_id}`]
        : []),
    ]);
    const invalidQuestionReferences = ontology.modules.flatMap((module) =>
      (module.competency_questions ?? []).flatMap((question) => [
        ...question.positive_example_ids
          .filter((id) => exampleById.get(id)?.kind !== "positive")
          .map((id) => `${question.id}:positive:${id}`),
        ...question.counterexample_ids
          .filter((id) => !["counterexample", "boundary"].includes(exampleById.get(id)?.kind ?? ""))
          .map((id) => `${question.id}:counterexample:${id}`),
      ]),
    );
    const invalidConstraintReferences = ontology.classes.flatMap((concept) =>
      (concept.structure?.required_relation_constraints ?? [])
        .filter((constraint) => !conceptIds.has(constraint.target_concept_id))
        .map((constraint) => `${concept.id}:${constraint.id}:${constraint.target_concept_id}`),
    );

    expect([
      ...invalidExampleReferences,
      ...invalidQuestionReferences,
      ...invalidConstraintReferences,
    ]).toEqual([]);
  });

  it("binds every competency question to a unique owner/neighbor evidence pair", () => {
    const ontology = candidateOntology();
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const exampleById = new Map(
      examplesWithOwners(ontology).map(({ example }) => [example.id, example]),
    );
    const seenPairs = new Set<string>();
    const invalid = ontology.modules.flatMap((module) => {
      const questions = module.competency_questions ?? [];
      return questions.flatMap((question) => {
        const pairKey = JSON.stringify([
          [...question.positive_example_ids].sort(),
          [...question.counterexample_ids].sort(),
        ]);
        const problems = seenPairs.has(pairKey) ? [`${question.id}:reused-pair`] : [];
        seenPairs.add(pairKey);
        for (const exampleId of [
          ...question.positive_example_ids,
          ...question.counterexample_ids,
        ]) {
          const example = exampleById.get(exampleId);
          if (!example) {
            problems.push(`${question.id}:${exampleId}:missing-example`);
            continue;
          }
          const evidenceModuleIds = new Set(
            example.related_node_ids.map((conceptId) => conceptById.get(conceptId)?.module_id),
          );
          if (!evidenceModuleIds.has(module.id)) {
            problems.push(`${question.id}:${exampleId}:missing-owner`);
          }
          for (const relatedModuleId of question.related_module_ids) {
            if (!evidenceModuleIds.has(relatedModuleId)) {
              problems.push(`${question.id}:${exampleId}:missing-${relatedModuleId}`);
            }
          }
          for (const relationId of question.evidence_binding.relation_ids) {
            const relation = relationById.get(relationId);
            if (
              !relation ||
              !example.related_relation_ids.includes(relationId) ||
              !example.related_node_ids.includes(relation.source_id) ||
              !example.related_node_ids.includes(relation.target_id)
            ) {
              problems.push(`${question.id}:${exampleId}:${relationId}:open-evidence`);
            }
          }
        }
        if (
          question.evidence_binding.applicability === "boundary-comparison-only" &&
          !isLocalized(question.evidence_binding.not_applicable_reason)
        ) {
          problems.push(`${question.id}:missing-cross-module-na`);
        }
        return problems;
      });
    });

    expect(seenPairs.size).toBe(141);
    expect(invalid).toEqual([]);
  });

  it("closes each Module interaction contract through canonical facts or explicit N/A review", () => {
    const ontology = candidateOntology();
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const invalid = ontology.modules.flatMap((module) => {
      const contract = module.interaction_contract;
      if (!contract) return [`${module.id}:missing-interaction-contract`];
      const problems: string[] = [];
      for (const [facet, value] of Object.entries(contract.facets)) {
        if (value.applicable) {
          if (
            !isLocalized(value.description) ||
            value.not_applicable_reason !== null ||
            value.family_concept_ids.length === 0 ||
            value.relation_ids.length === 0
          ) {
            problems.push(`${module.id}:${facet}:incomplete-applicable-facet`);
          }
          for (const conceptId of value.family_concept_ids) {
            if (!conceptIds.has(conceptId)) problems.push(`${module.id}:${facet}:${conceptId}`);
          }
          for (const relationId of value.relation_ids) {
            const relation = relationById.get(relationId);
            if (!relation || relation.status !== "accepted" || relation.predicate === "is_a") {
              problems.push(`${module.id}:${facet}:${relationId}:invalid-fact`);
            }
          }
        } else if (
          value.description !== null ||
          value.family_concept_ids.length > 0 ||
          value.relation_ids.length > 0 ||
          !isLocalized(value.not_applicable_reason)
        ) {
          problems.push(`${module.id}:${facet}:invalid-na-facet`);
        }
      }
      return problems;
    });

    expect(invalid).toEqual([]);
  });

  it("closes every required relation constraint against an active canonical relation", () => {
    const ontology = candidateOntology();
    const invalid = ontology.classes.flatMap((concept) =>
      (concept.structure?.required_relation_constraints ?? []).flatMap((constraint) => {
        const cardinalityIsValid =
          constraint.cardinality.max === null ||
          constraint.cardinality.min <= constraint.cardinality.max;
        const factExists = ontology.relations.some(
          (relation) =>
            relation.status !== "deprecated" &&
            relation.predicate === constraint.predicate &&
            (constraint.direction === "outgoing"
              ? relation.source_id === concept.id &&
                relation.target_id === constraint.target_concept_id
              : relation.target_id === concept.id &&
                relation.source_id === constraint.target_concept_id),
        );
        return cardinalityIsValid && factExists
          ? []
          : [`${concept.id}:${constraint.id}`];
      }),
    );

    expect(invalid).toEqual([]);
  });

  it("projects required relation bounds onto the matching canonical relation contract", () => {
    const ontology = candidateOntology();
    const invalid = ontology.classes.flatMap((concept) =>
      (concept.structure?.required_relation_constraints ?? []).flatMap((constraint) => {
        const relation = ontology.relations.find(
          (candidate) =>
            candidate.predicate === constraint.predicate &&
            (constraint.direction === "outgoing"
              ? candidate.source_id === concept.id &&
                candidate.target_id === constraint.target_concept_id
              : candidate.target_id === concept.id &&
                candidate.source_id === constraint.target_concept_id),
        );
        const endpoint = constraint.direction === "outgoing" ? "target" : "source";
        const projectedBound = relation?.cardinality?.[endpoint];
        return projectedBound?.min === constraint.cardinality.min &&
          projectedBound.max === constraint.cardinality.max
          ? []
          : [`${concept.id}:${constraint.id}:${relation?.id ?? "missing-relation"}`];
      }),
    );

    expect(invalid).toEqual([]);
  });

  it("keeps every example id globally unique", () => {
    const ids = examplesWithOwners(candidateOntology()).map(({ example }) => example.id);
    expect(duplicateValues(ids)).toEqual([]);
  });

  it("keeps case paths as reference-only sequences of case-fragment examples", () => {
    const ontology = candidateOntology();
    const exampleOwners = new Map(
      examplesWithOwners(ontology).map((entry) => [entry.example.id, entry]),
    );
    const allowedStepKeys = [
      "case_fragment_example_id",
      "order",
      "traversal_relation_id",
    ];
    const invalidSteps = ontology.case_paths.flatMap((path) =>
      path.steps.flatMap((step, index) => {
        const ownedExample = exampleOwners.get(step.case_fragment_example_id);
        const validKeys = Object.keys(step).sort().join("|") === allowedStepKeys.join("|");
        const validFragment =
          ownedExample?.example.kind === "case-fragment" &&
          ownedExample.example.scenario_id === path.id &&
          ownedExample.ownerKind === "concept";
        const validOrder = step.order === index + 1;
        const validTraversalReference = index === 0
          ? step.traversal_relation_id === null
          : typeof step.traversal_relation_id === "string";
        return validKeys && validFragment && validOrder && validTraversalReference
          ? []
          : [`${path.id}:step-${index + 1}`];
      }),
    );

    expect(invalidSteps).toEqual([]);
  });

  it("requires traversal relations to connect adjacent case-fragment owners", () => {
    const ontology = candidateOntology();
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const exampleOwnerById = new Map(
      examplesWithOwners(ontology).map(({ example, ownerId }) => [example.id, ownerId]),
    );
    const invalidTraversals = ontology.case_paths.flatMap((path) =>
      path.steps.slice(1).flatMap((step, index) => {
        const previousOwner = exampleOwnerById.get(
          path.steps[index].case_fragment_example_id,
        );
        const currentOwner = exampleOwnerById.get(step.case_fragment_example_id);
        const relation = step.traversal_relation_id === null
          ? undefined
          : relationById.get(step.traversal_relation_id);
        const endpoints = relation === undefined
          ? new Set<string>()
          : new Set([relation.source_id, relation.target_id]);
        return previousOwner !== undefined &&
          currentOwner !== undefined &&
          endpoints.has(previousOwner) &&
          endpoints.has(currentOwner)
          ? []
          : [`${path.id}:step-${index + 2}:${step.traversal_relation_id ?? "null"}`];
      }),
    );

    expect(invalidTraversals).toEqual([]);
  });

  it("highlights the full observable execution loop through existing canonical relations", () => {
    const ontology = candidateOntology();
    const path = ontology.case_paths.find(({ id }) => id === "software-defect-repair");
    const exampleOwnerById = new Map(
      examplesWithOwners(ontology).map(({ example, ownerId }) => [example.id, ownerId]),
    );

    expect(path?.steps.map((step) => exampleOwnerById.get(step.case_fragment_example_id))).toEqual([
      "Goal",
      "TaskPlan",
      "TaskStep",
      "ToolCallPlan",
      "ToolCall",
      "ToolCallAttempt",
      "ToolResult",
      "EvaluationRun",
      "Feedback",
      "MemoryWrite",
      "MemoryRecord",
    ]);
    expect(path?.steps.slice(1).map((step) => step.traversal_relation_id)).not.toContain(null);
    expect(ontology.relations.filter(({ id }) => id.includes("-case-"))).toEqual([]);
  });

});
