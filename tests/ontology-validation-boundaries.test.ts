import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validateReferencesAndInformation } from "../scripts/lib/ontology-reference-validation.mjs";
import { validateSemanticDepthContracts } from "../scripts/lib/ontology-semantic-depth-validation.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

type JsonRecord = Record<string, any>;
type Mutation = (canonical: JsonRecord) => JsonRecord;

const artifactPath = ontologyArtifactPath();
const canonical = JSON.parse(readFileSync(artifactPath, "utf8")) as JsonRecord;
const sourceIndex = JSON.parse(
  readFileSync(resolve(dirname(artifactPath), "../src/generated/source-index.json"), "utf8"),
) as JsonRecord;

const required = <Value>(value: Value | undefined, label: string): Value => {
  if (value === undefined) throw new Error(`Missing validation fixture: ${label}`);
  return value;
};

const replaceById = (
  records: readonly JsonRecord[],
  id: string,
  update: (record: JsonRecord) => JsonRecord,
): readonly JsonRecord[] => records.map((record) => record.id === id ? update(record) : record);

const updateModule = (
  value: JsonRecord,
  id: string,
  update: (module: JsonRecord) => JsonRecord,
): JsonRecord => ({ ...value, modules: replaceById(value.modules, id, update) });

const updateConcept = (
  value: JsonRecord,
  id: string,
  update: (concept: JsonRecord) => JsonRecord,
): JsonRecord => ({ ...value, classes: replaceById(value.classes, id, update) });

const updateRelation = (
  value: JsonRecord,
  id: string,
  update: (relation: JsonRecord) => JsonRecord,
): JsonRecord => ({ ...value, relations: replaceById(value.relations, id, update) });

const semanticContext = (value: JsonRecord, releaseChannel?: string) => ({
  modules: value.modules,
  classes: value.classes,
  relations: value.relations,
  moduleIds: new Set(value.modules.map(({ id }: JsonRecord) => id)),
  conceptIds: new Set(value.classes.map(({ id }: JsonRecord) => id)),
  moduleById: new Map(value.modules.map((record: JsonRecord) => [record.id, record])),
  conceptById: new Map(value.classes.map((record: JsonRecord) => [record.id, record])),
  relationById: new Map(value.relations.map((record: JsonRecord) => [record.id, record])),
  sourceFileByModule: new Map(),
  sourceLocationByConcept: new Map(),
  sourceLocationByRelation: new Map(),
  releaseChannel: releaseChannel ?? value.artifact_metadata.release_channel,
});

const firstModule = required(
  canonical.modules.find(({ status, boundary_decisions: decisions, overlap_checks: overlaps, competency_questions: questions }: JsonRecord) =>
    status === "accepted" && decisions.length > 0 && overlaps.length > 0 && questions.length > 1,
  ),
  "accepted Module with closure records",
);
const firstFacetName = required(
  Object.keys(firstModule.interaction_contract.facets)[0],
  "interaction facet",
);
const boundaryWithRelation = required(
  firstModule.boundary_decisions.find(({ relation_ids: relationIds }: JsonRecord) => relationIds.length > 0),
  "boundary decision with a Relation",
);
const firstOverlap = required(firstModule.overlap_checks[0], "overlap check");
const firstQuestion = required(firstModule.competency_questions[0], "competency question");
const secondQuestion = required(firstModule.competency_questions[1], "second competency question");
const primaryRelations = canonical.relations.filter(
  ({ status, layout_role: role }: JsonRecord) => status === "accepted" && role === "primary-backbone",
);
const primaryChildren = new Set(primaryRelations.map(({ layout_child_id: id }: JsonRecord) => id));
const directRootEdge = required(
  primaryRelations.find(({ layout_parent_id: parentId }: JsonRecord) => !primaryChildren.has(parentId)),
  "primary edge below a root",
);
const rootConcept = required(
  canonical.classes.find(({ id, status }: JsonRecord) => status === "accepted" && id === directRootEdge.layout_parent_id),
  "accepted root Concept",
);
const childConcept = required(
  canonical.classes.find(({ id }: JsonRecord) => id === directRootEdge.layout_child_id),
  "accepted non-root Concept",
);

const updateFirstBoundary = (
  module: JsonRecord,
  update: (decision: JsonRecord) => JsonRecord,
): JsonRecord => ({
  ...module,
  boundary_decisions: replaceById(module.boundary_decisions, boundaryWithRelation.id, update),
});

const updateFirstOverlap = (
  module: JsonRecord,
  update: (overlap: JsonRecord) => JsonRecord,
): JsonRecord => ({
  ...module,
  overlap_checks: replaceById(module.overlap_checks, firstOverlap.id, update),
});

const updateQuestion = (
  module: JsonRecord,
  id: string,
  update: (question: JsonRecord) => JsonRecord,
): JsonRecord => ({
  ...module,
  competency_questions: replaceById(module.competency_questions, id, update),
});

describe("semantic-depth boundary validation", () => {
  const cases: readonly [string, Mutation, RegExp, string?][] = [
    ["forbids a Module label suffix", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module, labels: { ...module.labels, en: `${module.labels.en} Module` },
    })), /forbidden Module suffix/iu],
    ["forbids generic Module boundary prose", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module, purpose: { ...module.purpose, en: "Within the synthetic Module boundary" },
    })), /banned representative closure template/iu],
    ["requires one owned key notion", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module, key_notion: { zh: "不存在", en: "missing", ja: "存在しない" },
    })), /key_notion must resolve to exactly one/iu],
    ["requires the key notion in taxonomy roots", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module, taxonomy_contract: { ...module.taxonomy_contract, key_root_concept_ids: [] },
    })), /absent from taxonomy_contract/iu],
    ["rejects an unknown taxonomy root", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module,
      taxonomy_contract: {
        ...module.taxonomy_contract,
        flat_root_exception_concept_ids: [...module.taxonomy_contract.flat_root_exception_concept_ids, "missing-concept"],
      },
    })), /references non-owned or non-accepted Concept missing-concept/iu],
    ["rejects an unknown facet Concept", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module,
      interaction_contract: {
        ...module.interaction_contract,
        facets: {
          ...module.interaction_contract.facets,
          [firstFacetName]: {
            ...module.interaction_contract.facets[firstFacetName],
            family_concept_ids: ["missing-concept"],
          },
        },
      },
    })), /family_concept_ids references unknown Concept missing-concept/iu],
    ["rejects an unknown facet Relation", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module,
      interaction_contract: {
        ...module.interaction_contract,
        facets: {
          ...module.interaction_contract.facets,
          [firstFacetName]: {
            ...module.interaction_contract.facets[firstFacetName],
            relation_ids: ["missing-relation"],
          },
        },
      },
    })), /relation_ids references unknown Relation missing-relation/iu],
    ["rejects an unknown boundary Module", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstBoundary(module, (decision) => ({ ...decision, other_module_id: "missing-module" }))),
    /boundary_decisions references an unknown Module/iu],
    ["rejects an unknown boundary subject", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstBoundary(module, (decision) => ({ ...decision, subject_concept_ids: ["missing-concept"] }))),
    /references unknown Concept missing-concept/iu],
    ["rejects a missing boundary Relation", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstBoundary(module, (decision) => ({ ...decision, relation_ids: ["missing-relation"] }))),
    /missing or non-accepted Relation missing-relation/iu],
    ["forbids N/A prose beside cited Relations", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstBoundary(module, (decision) => ({
        ...decision,
        relation_not_applicable_reason: { zh: "不适用", en: "not applicable", ja: "適用外" },
      }))), /cannot state an N\/A reason/iu],
    ["requires trilingual N/A prose without Relations", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstBoundary(module, (decision) => ({
        ...decision, relation_ids: [], relation_not_applicable_reason: { en: "not applicable" },
      }))), /requires a trilingual relation_not_applicable_reason/iu],
    ["requires an accepted boundary review", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstBoundary(module, (decision) => ({
        ...decision, review: { ...decision.review, review_status: "proposed" },
      }))), /boundary_decisions must be accepted/iu],
    ["rejects an unknown overlap Module", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstOverlap(module, (overlap) => ({ ...overlap, other_module_id: "missing-module" }))),
    /overlap_checks references unknown Module/iu],
    ["rejects an unresolved overlap", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstOverlap(module, (overlap) => ({ ...overlap, result: "unresolved" }))),
    /cannot remain unresolved/iu],
    ["rejects an unknown overlap owner", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstOverlap(module, (overlap) => ({ ...overlap, owner_module_id: "missing-module" }))),
    /references unknown owner Module/iu],
    ["rejects an unknown overlap candidate", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstOverlap(module, (overlap) => ({ ...overlap, candidate_concept_ids: ["missing-concept"] }))),
    /overlap_checks references unknown Concept/iu],
    ["requires an accepted overlap review", (value) => updateModule(value, firstModule.id, (module) =>
      updateFirstOverlap(module, (overlap) => ({
        ...overlap, review: { ...overlap.review, review_status: "proposed" },
      }))), /overlap_checks must be accepted/iu],
    ["requires the containing CQ owner", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, firstQuestion.id, (question) => ({
        ...question, primary_owner_module_id: "missing-module",
      }))), /primary owner must exist and equal containing Module/iu],
    ["requires globally unique CQ semantic keys", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, secondQuestion.id, (question) => ({
        ...question, semantic_key: firstQuestion.semantic_key,
      }))), /semantic key .* must be globally unique/iu],
    ["rejects an unknown related CQ Module", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, firstQuestion.id, (question) => ({
        ...question, related_module_ids: ["missing-module"],
      }))), /references unknown related Module/iu],
    ["rejects non-owned CQ evidence", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, firstQuestion.id, (question) => ({
        ...question,
        evidence_binding: { ...question.evidence_binding, owner_concept_ids: ["missing-concept"] },
      }))), /owner evidence missing-concept is not an accepted Concept/iu],
    ["rejects undeclared related CQ evidence", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, firstQuestion.id, (question) => ({
        ...question,
        evidence_binding: { ...question.evidence_binding, related_concept_ids: ["missing-concept"] },
      }))), /related evidence missing-concept is not owned/iu],
    ["rejects a missing CQ evidence Relation", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, firstQuestion.id, (question) => ({
        ...question,
        evidence_binding: { ...question.evidence_binding, relation_ids: ["missing-relation"] },
      }))), /missing or non-accepted evidence Relation/iu],
    ["requires root status", (value) => updateConcept(value, rootConcept.id, (concept) => ({
      ...concept, root_status: null,
    })), /Accepted root Concept .* must declare root_status/iu],
    ["forbids root status on a non-root", (value) => updateConcept(value, childConcept.id, (concept) => ({
      ...concept, root_status: "module-key-root",
    })), /Accepted non-root Concept .* must set root_status=null/iu],
    ["forbids unresolved release roots", (value) => updateConcept(value, rootConcept.id, (concept) => ({
      ...concept, root_status: "unresolved-root",
    })), /Release cannot contain unresolved root_status/iu, "release"],
    ["rejects an alias equal to the canonical label", (value) => updateConcept(value, rootConcept.id, (concept) => ({
      ...concept,
      lexical_aliases: [...concept.lexical_aliases, { language: "en", value: concept.labels.en }],
    })), /lexical alias .* duplicates its canonical label/iu],
    ["rejects repeated aliases", (value) => updateConcept(value, rootConcept.id, (concept) => ({
      ...concept,
      lexical_aliases: [
        ...concept.lexical_aliases,
        { language: "en", value: "coverage boundary alias" },
        { language: "en", value: "coverage boundary alias" },
      ],
    })), /repeats lexical alias/iu],
    ["rejects two primary parents", (value) => ({
      ...value,
      relations: [...value.relations, {
        ...directRootEdge,
        id: "coverage-duplicate-primary",
        predicate: "coverage_relation",
      }],
    }), /more than one primary backbone relation/iu],
    ["rejects a primary-backbone cycle", (value) => ({
      ...value,
      relations: [...value.relations, {
        ...directRootEdge,
        id: "coverage-primary-cycle",
        predicate: "coverage_relation",
        source_id: rootConcept.id,
        target_id: childConcept.id,
        layout_child_id: rootConcept.id,
        layout_parent_id: childConcept.id,
      }],
    }), /Primary backbone cycle/iu],
    ["requires the child Module to allow its backbone predicate", (value) => updateModule(
      value,
      childConcept.module_id,
      (module) => ({
        ...module,
        taxonomy_contract: {
          ...module.taxonomy_contract,
          allowed_backbone_predicates: module.taxonomy_contract.allowed_backbone_predicates.filter(
            (predicate: string) => predicate !== directRootEdge.predicate,
          ),
        },
      }),
    ), /absent from Module .* allowed_backbone_predicates/iu],
  ];

  it.each(cases)("%s", (_name, mutate, expected, releaseChannel) => {
    expect(() => validateSemanticDepthContracts(
      semanticContext(mutate(canonical), releaseChannel),
    )).toThrow(expected);
  });
});

const fieldConcept = required(
  canonical.classes.find(({ id, structure, examples }: JsonRecord) =>
    structure?.fields?.some(({ required: isRequired }: JsonRecord) => isRequired) &&
    examples?.some(({ kind }: JsonRecord) => kind === "positive") &&
    !canonical.relations.some(({ predicate, status, target_id: targetId }: JsonRecord) =>
      predicate === "is_a" && status === "accepted" && targetId === id,
    ),
  ),
  "Concept with required fields and a positive example",
);
const requiredField = required(
  fieldConcept.structure.fields.find(({ required: isRequired }: JsonRecord) => isRequired),
  "required field",
);
const fieldExample = required(
  fieldConcept.examples.find(({ kind, field_values: values }: JsonRecord) =>
    kind === "positive" && Object.hasOwn(values, requiredField.id),
  ),
  "positive field example",
);
const constraintConcept = required(
  canonical.classes.find(({ structure }: JsonRecord) =>
    (structure?.required_relation_constraints?.length ?? 0) > 0,
  ),
  "Concept with a required Relation constraint",
);
const firstConstraint = constraintConcept.structure.required_relation_constraints[0];
const mappedConcept = required(
  canonical.classes.find(({ external_mappings: mappings }: JsonRecord) =>
    mappings?.some(({ canonical_target_ids: ids }: JsonRecord) => ids.length > 0),
  ),
  "Concept with an external mapping",
);
const acceptedRelation = required(
  canonical.relations.find(({ status }: JsonRecord) => status === "accepted"),
  "accepted Relation",
);
const deprecatedConcept = required(
  canonical.classes.find(({ status }: JsonRecord) => status === "deprecated"),
  "deprecated Concept",
);
const deprecatedRelation = required(
  canonical.relations.find(({ status }: JsonRecord) => status === "deprecated"),
  "deprecated Relation",
);
const moduleExample = required(firstModule.examples[0], "Module example");
const registeredClaimOwner = required(
  canonical.classes.find(({ source_claims: claims }: JsonRecord) => claims?.length > 0),
  "Concept with source claims",
);

const updateFieldConcept = (
  value: JsonRecord,
  updateField: (field: JsonRecord) => JsonRecord,
  updateExample: (example: JsonRecord) => JsonRecord = (example) => example,
): JsonRecord => updateConcept(value, fieldConcept.id, (concept) => ({
  ...concept,
  structure: {
    ...concept.structure,
    fields: replaceById(concept.structure.fields, requiredField.id, updateField),
  },
  examples: replaceById(concept.examples, fieldExample.id, updateExample),
}));

describe("reference and information boundary validation", () => {
  const cases: readonly [string, Mutation, RegExp][] = [
    ["rejects duplicate example IDs", (value) => ({
      ...value, examples: [...(value.examples ?? []), { ...moduleExample }],
    }), /Duplicate example id/iu],
    ["rejects deprecated accepted-Relation endpoints", (value) => updateConcept(
      value,
      acceptedRelation.target_id,
      (concept) => ({ ...concept, status: "deprecated" }),
    ), /Accepted Relation .* references deprecated endpoint/iu],
    ["rejects a deprecated primary parent", (value) => updateRelation(
      value,
      directRootEdge.id,
      (relation) => ({ ...relation, status: "deprecated" }),
    ), /primary parent references deprecated Relation/iu],
    ["rejects deprecated nodes from accepted examples", (value) => updateModule(
      value,
      firstModule.id,
      (module) => ({
        ...module,
        examples: replaceById(module.examples, moduleExample.id, (example) => ({
          ...example, related_node_ids: [deprecatedConcept.id],
        })),
      }),
    ), /Accepted example .* references deprecated node/iu],
    ["rejects deprecated Relations from accepted examples", (value) => updateModule(
      value,
      firstModule.id,
      (module) => ({
        ...module,
        examples: replaceById(module.examples, moduleExample.id, (example) => ({
          ...example, related_relation_ids: [deprecatedRelation.id],
        })),
      }),
    ), /Accepted example .* references deprecated Relation/iu],
    ["rejects duplicate field IDs", (value) => updateConcept(value, fieldConcept.id, (concept) => ({
      ...concept,
      structure: { ...concept.structure, fields: [...concept.structure.fields, { ...requiredField }] },
    })), /repeats field id/iu],
    ["rejects unsupported field datatypes", (value) => updateFieldConcept(
      value,
      (field) => ({ ...field, datatype: "unsupported" }),
    ), /unsupported datatype/iu],
    ["rejects impossible field cardinality", (value) => updateFieldConcept(
      value,
      (field) => ({ ...field, cardinality: { min: 2, max: 1 } }),
    ), /cardinality min greater than max/iu],
    ["rejects duplicate constraint IDs", (value) => updateConcept(value, constraintConcept.id, (concept) => ({
      ...concept,
      structure: {
        ...concept.structure,
        required_relation_constraints: [
          ...concept.structure.required_relation_constraints,
          { ...firstConstraint },
        ],
      },
    })), /repeats required relation constraint id/iu],
    ["rejects unresolved constraint targets", (value) => updateConcept(value, constraintConcept.id, (concept) => ({
      ...concept,
      structure: {
        ...concept.structure,
        required_relation_constraints: replaceById(
          concept.structure.required_relation_constraints,
          firstConstraint.id,
          (constraint) => ({ ...constraint, target_concept_id: "missing-concept" }),
        ),
      },
    })), /unresolved target concept missing-concept/iu],
    ["rejects impossible constraint cardinality", (value) => updateConcept(value, constraintConcept.id, (concept) => ({
      ...concept,
      structure: {
        ...concept.structure,
        required_relation_constraints: replaceById(
          concept.structure.required_relation_constraints,
          firstConstraint.id,
          (constraint) => ({ ...constraint, cardinality: { min: 2, max: 1 } }),
        ),
      },
    })), /constraint .* cardinality min greater than max/iu],
    ["requires a canonical fact for each constraint", (value) => updateConcept(value, constraintConcept.id, (concept) => ({
      ...concept,
      structure: {
        ...concept.structure,
        required_relation_constraints: replaceById(
          concept.structure.required_relation_constraints,
          firstConstraint.id,
          (constraint) => ({ ...constraint, predicate: "missing-predicate" }),
        ),
      },
    })), /has no matching canonical relation fact/iu],
    ["rejects undeclared example fields", (value) => updateFieldConcept(
      value,
      (field) => field,
      (example) => ({ ...example, field_values: { ...example.field_values, missing_field: "x" } }),
    ), /unknown or undeclared field missing_field/iu],
    ["requires mandatory example fields", (value) => updateFieldConcept(
      value,
      (field) => field,
      (example) => {
        const { [requiredField.id]: _removed, ...fieldValues } = example.field_values;
        return { ...example, field_values: fieldValues };
      },
    ), /is missing required field/iu],
    ["requires arrays for repeatable fields", (value) => updateFieldConcept(
      value,
      (field) => ({ ...field, cardinality: { min: 1, max: 2 } }),
    ), /repeatable field .* must be represented by an array/iu],
    ["enforces repeatable minimums", (value) => updateFieldConcept(
      value,
      (field) => ({ ...field, cardinality: { min: 2, max: 3 } }),
      (example) => ({
        ...example, field_values: { ...example.field_values, [requiredField.id]: [example.field_values[requiredField.id]] },
      }),
    ), /below cardinality min/iu],
    ["enforces repeatable maximums", (value) => updateFieldConcept(
      value,
      (field) => ({ ...field, cardinality: { min: 1, max: 2 } }),
      (example) => ({
        ...example,
        field_values: {
          ...example.field_values,
          [requiredField.id]: [
            example.field_values[requiredField.id],
            example.field_values[requiredField.id],
            example.field_values[requiredField.id],
          ],
        },
      }),
    ), /exceeds cardinality max/iu],
    ["rejects unresolved external mapping targets", (value) => updateConcept(value, mappedConcept.id, (concept) => ({
      ...concept,
      external_mappings: concept.external_mappings.map((mapping: JsonRecord, index: number) =>
        index === 0 ? { ...mapping, canonical_target_ids: ["missing-concept"] } : mapping,
      ),
    })), /unresolved canonical target missing-concept/iu],
    ["rejects unresolved example nodes", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module,
      examples: replaceById(module.examples, moduleExample.id, (example) => ({
        ...example, related_node_ids: ["missing-node"],
      })),
    })), /unresolved node reference missing-node/iu],
    ["rejects unresolved example Relations", (value) => updateModule(value, firstModule.id, (module) => ({
      ...module,
      examples: replaceById(module.examples, moduleExample.id, (example) => ({
        ...example, related_relation_ids: ["missing-relation"],
      })),
    })), /unresolved relation reference missing-relation/iu],
    ["rejects future review dates", (value) => ({ ...value, reviewed_on: "9999-12-31" }),
      /later than controlled release date/iu],
    ["rejects duplicate direct evidence", (value) => updateConcept(value, registeredClaimOwner.id, (concept) => ({
      ...concept, source_claims: [concept.source_claims[0], concept.source_claims[0]],
    })), /Duplicate source evidence/iu],
    ["limits direct evidence volume", (value) => updateConcept(value, registeredClaimOwner.id, (concept) => ({
      ...concept,
      source_claims: [
        concept.source_claims[0],
        { ...concept.source_claims[0], locator: `${concept.source_claims[0].locator} second` },
        { ...concept.source_claims[0], locator: `${concept.source_claims[0].locator} third` },
      ],
    })), /compressed to at most two direct claims/iu],
    ["rejects unresolved source claims", (value) => updateConcept(value, registeredClaimOwner.id, (concept) => ({
      ...concept,
      source_claims: [{ ...concept.source_claims[0], source_id: "missing-source" }],
    })), /Unresolved source claim missing-source/iu],
    ["rejects incomplete source claims", (value) => updateConcept(value, registeredClaimOwner.id, (concept) => ({
      ...concept, source_claims: [{ ...concept.source_claims[0], supports: "" }],
    })), /Incomplete source claim/iu],
    ["keeps URLs in the source registry", (value) => updateConcept(value, registeredClaimOwner.id, (concept) => ({
      ...concept, source_claims: [{ ...concept.source_claims[0], locator: "https://example.test/section" }],
    })), /URL belongs in the source registry/iu],
    ["rejects reused CQ example pairs", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, secondQuestion.id, (question) => ({
        ...question,
        positive_example_ids: [...firstQuestion.positive_example_ids],
        counterexample_ids: [...firstQuestion.counterexample_ids],
      }))), /reuse the same positive\/counterexample pair/iu],
    ["rejects unresolved CQ examples", (value) => updateModule(value, firstModule.id, (module) =>
      updateQuestion(module, firstQuestion.id, (question) => ({
        ...question, positive_example_ids: ["missing-example"],
      }))), /has unresolved example missing-example/iu],
    ["requires case-fragment steps", (value) => ({
      ...value,
      case_paths: value.case_paths.map((path: JsonRecord, pathIndex: number) => pathIndex === 0
        ? {
            ...path,
            steps: path.steps.map((step: JsonRecord, stepIndex: number) => stepIndex === 0
              ? { ...step, case_fragment_example_id: moduleExample.id }
              : step),
          }
        : path),
    }), /references non-case-fragment example/iu],
    ["rejects unresolved case traversals", (value) => ({
      ...value,
      case_paths: value.case_paths.map((path: JsonRecord, pathIndex: number) => pathIndex === 0
        ? {
            ...path,
            steps: path.steps.map((step: JsonRecord, stepIndex: number) => stepIndex === 1
              ? { ...step, traversal_relation_id: "missing-relation" }
              : step),
          }
        : path),
    }), /unresolved traversal relation missing-relation/iu],
  ];

  it.each(cases)("%s", (_name, mutate, expected) => {
    expect(() => validateReferencesAndInformation(mutate(canonical), sourceIndex)).toThrow(expected);
  });
});
