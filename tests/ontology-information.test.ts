import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildEffectiveConceptStructures } from "../scripts/lib/ontology-concept-structure.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

interface LocalizedText {
  zh?: unknown;
  en?: unknown;
  ja?: unknown;
}

interface SourceClaim {
  source_id?: unknown;
  supports?: unknown;
  locator?: unknown;
}

interface OntologyExample {
  id: string;
  kind: "positive" | "counterexample" | "boundary" | "instance" | "case-fragment";
  scenario_id: string | null;
  descriptions: LocalizedText;
  field_values: Record<string, unknown>;
  related_node_ids: string[];
  related_relation_ids: string[];
  expected_result: LocalizedText;
  why_valid_or_invalid: LocalizedText;
  source_claims?: SourceClaim[];
}

interface InformationOwner {
  id: string;
  labels?: LocalizedText;
  definitions?: LocalizedText;
  purpose?: LocalizedText;
  includes?: LocalizedText[];
  excludes?: LocalizedText[];
  examples?: OntologyExample[];
  source_claims?: SourceClaim[];
  status: string;
}

interface ControlledValue {
  id: string;
  source_claims?: SourceClaim[];
}

interface StructureField {
  id: string;
  datatype: string;
  required: boolean;
  cardinality: { min: number; max: number | null };
  allowed_values: ControlledValue[];
  source_claims?: SourceClaim[];
}

interface Concept extends InformationOwner {
  module_id: string;
  short_definitions?: LocalizedText;
  why_needed?: LocalizedText;
  structure?: {
    identity_keys: string[];
    fields: StructureField[];
    constraints: Array<{ id: string; source_claims?: SourceClaim[] }>;
    required_relation_constraints: Array<{
      id: string;
      direction: "incoming" | "outgoing";
      predicate: string;
      target_concept_id: string;
      cardinality: { min: number; max: number | null };
      source_claims?: SourceClaim[];
    }>;
  };
  external_mappings?: Array<{ id: string; source_claims?: SourceClaim[] }>;
  replaced_by_ids?: string[];
  deprecation_reason?: LocalizedText | null;
}

interface Relation extends InformationOwner {
  predicate: string;
  source_id: string;
  target_id: string;
  cardinality?: {
    source: { min: number; max: number | null };
    target: { min: number; max: number | null };
  } | null;
  constraints?: Array<{ id: string; source_claims?: SourceClaim[] }>;
  conditions?: Array<{ id: string; source_claims?: SourceClaim[] }>;
}

interface CompetencyQuestion {
  id: string;
  query: string;
  expected_assertion: string;
  positive_example_ids: string[];
  counterexample_ids: string[];
}

interface OntologyModule extends InformationOwner {
  plane_id: string;
  competency_questions?: CompetencyQuestion[];
  interaction_contract?: {
    applicability: "operational" | "descriptive" | "mixed";
    facets: Record<
      "input" | "output" | "failure" | "recovery",
      { applicable: boolean; not_applicable_reason: LocalizedText | null }
    >;
  };
}

interface CasePathStep extends Record<string, unknown> {
  order: number;
  case_fragment_example_id: string;
  traversal_relation_id: string | null;
}

interface CasePath {
  id: string;
  steps: CasePathStep[];
  source_claims?: SourceClaim[];
}

interface CandidateOntology extends InformationOwner {
  short_definitions: LocalizedText;
  why_needed: LocalizedText;
  planes: InformationOwner[];
  modules: OntologyModule[];
  classes: Concept[];
  relations: Relation[];
  case_paths: CasePath[];
  global_constraints: Array<{ id: string; source_claims?: SourceClaim[] }>;
  [key: string]: unknown;
}

interface ExampleWithOwner {
  example: OntologyExample;
  ownerId: string;
  ownerKind: "root" | "plane" | "module" | "concept" | "relation";
}

interface LocatedSourceClaim {
  path: string;
  claim: SourceClaim;
}

const repositoryRoot = process.cwd();
const candidatePath = ontologyArtifactPath();
const sourceRegistryPath = resolve(repositoryRoot, "research/source-registry.csv");

let cachedCandidate: CandidateOntology | undefined;
let cachedRegistryIds: ReadonlySet<string> | undefined;

const candidateOntology = (): CandidateOntology => {
  expect(
    existsSync(candidatePath),
    `Generate the strict candidate artifact before information validation: ${candidatePath}`,
  ).toBe(true);
  cachedCandidate ??= JSON.parse(readFileSync(candidatePath, "utf8")) as CandidateOntology;
  return cachedCandidate;
};

const parseCsv = (bytes: Buffer): readonly Readonly<Record<string, string>>[] => {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  const csv = bytes.toString("utf8").replace(/^\uFEFF/, "");

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      record.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      record.push(cell);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("Unterminated quoted cell in source-registry.csv");
  if (cell.length > 0 || record.length > 0) {
    record.push(cell);
    records.push(record);
  }

  const [headers, ...rows] = records;
  if (headers === undefined) return [];
  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Source registry row ${index + 2} has ${values.length} cells; expected ${headers.length}`,
      );
    }
    return Object.freeze(
      Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex]])),
    );
  });
};

const registryIds = (): ReadonlySet<string> => {
  expect(existsSync(sourceRegistryPath), `Missing source registry: ${sourceRegistryPath}`).toBe(true);
  cachedRegistryIds ??= new Set(
    parseCsv(readFileSync(sourceRegistryPath)).map((row) => row.id).filter(Boolean),
  );
  return cachedRegistryIds;
};

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isLocalized = (value: unknown): value is LocalizedText =>
  value !== null &&
  typeof value === "object" &&
  ["zh", "en", "ja"].every((language) =>
    hasText((value as Record<string, unknown>)[language]),
  );

const localizedListIsComplete = (value: unknown): value is LocalizedText[] =>
  Array.isArray(value) && value.length > 0 && value.every(isLocalized);

const duplicateValues = (values: readonly string[]): string[] => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
};

const examplesWithOwners = (ontology: CandidateOntology): ExampleWithOwner[] => [
  ...(ontology.examples ?? []).map((example) => ({
    example,
    ownerId: ontology.id,
    ownerKind: "root" as const,
  })),
  ...ontology.planes.flatMap((plane) =>
    (plane.examples ?? []).map((example) => ({
      example,
      ownerId: plane.id,
      ownerKind: "plane" as const,
    })),
  ),
  ...ontology.modules.flatMap((module) =>
    (module.examples ?? []).map((example) => ({
      example,
      ownerId: module.id,
      ownerKind: "module" as const,
    })),
  ),
  ...ontology.classes.flatMap((concept) =>
    (concept.examples ?? []).map((example) => ({
      example,
      ownerId: concept.id,
      ownerKind: "concept" as const,
    })),
  ),
  ...ontology.relations.flatMap((relation) =>
    (relation.examples ?? []).map((example) => ({
      example,
      ownerId: relation.id,
      ownerKind: "relation" as const,
    })),
  ),
];

const collectSourceClaims = (
  value: unknown,
  path = "$",
  claims: LocatedSourceClaim[] = [],
): LocatedSourceClaim[] => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSourceClaims(item, `${path}[${index}]`, claims));
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "source_claims" && Array.isArray(child)) {
        child.forEach((claim, index) =>
          claims.push({
            path: `${path}.source_claims[${index}]`,
            claim: claim as SourceClaim,
          }),
        );
      } else {
        collectSourceClaims(child, `${path}.${key}`, claims);
      }
    }
  }
  return claims;
};

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

  it("attaches one software-defect-repair case fragment to every Module", () => {
    const invalid = candidateOntology().modules
      .filter((module) =>
        !(module.examples ?? []).some(
          (example) =>
            example.kind === "case-fragment" &&
            example.scenario_id === "software-defect-repair" &&
            example.related_relation_ids.length > 0 &&
            example.related_node_ids.length >= 2,
        ),
      )
      .map(({ id }) => id);

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

  it("binds every Module example and competency question to concrete canonical facts", () => {
    const ontology = candidateOntology();
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const invalid = ontology.modules.flatMap((module) => {
      const exampleFacts = (module.examples ?? []).flatMap((example) =>
        example.related_relation_ids.flatMap((relationId) => {
          const relation = relationById.get(relationId);
          return relation &&
            example.related_node_ids.includes(relation.source_id) &&
            example.related_node_ids.includes(relation.target_id)
            ? []
            : [`${module.id}:example:${relationId}`];
        }),
      );
      const questions = module.competency_questions ?? [];
      const semanticQuestion = questions.find(({ id }) => id.endsWith("-cq-semantic-closure"));
      const semanticFact = semanticQuestion
        ? ontology.relations.find(
            (relation) =>
              semanticQuestion.query ===
              `relation(source=${relation.source_id}, predicate=${relation.predicate}, target=${relation.target_id})`,
          )
        : undefined;
      const taxonomyQuestion = questions.find(({ id }) => id.endsWith("-cq-taxonomy"));
      const taxonomyFact = taxonomyQuestion
        ? ontology.relations.find(
            (relation) =>
              relation.predicate === "is_a" &&
              taxonomyQuestion.query.includes(`id=${relation.id}`),
          )
        : undefined;

      return [
        ...((module.examples?.length ?? 0) > 0 &&
        (module.examples ?? []).every((example) => example.related_relation_ids.length > 0)
          ? []
          : [`${module.id}:example-without-fact`]),
        ...exampleFacts,
        ...(semanticFact &&
        semanticQuestion?.expected_assertion.includes(semanticFact.id)
          ? []
          : [`${module.id}:semantic-question`]),
        ...(taxonomyFact || taxonomyQuestion?.query.includes("flat-root-exception")
          ? []
          : [`${module.id}:taxonomy-question`]),
      ];
    });

    expect(invalid).toEqual([]);
  });

  it("closes each Module interaction contract through canonical facts or explicit N/A review", () => {
    const ontology = candidateOntology();
    const relationById = new Map(ontology.relations.map((relation) => [relation.id, relation]));
    const moduleByConceptId = new Map(
      ontology.classes.map((concept) => [concept.id, concept.module_id]),
    );
    const invalid = ontology.modules.flatMap((module) => {
      const contract = module.interaction_contract;
      const question = module.competency_questions?.find(({ id }) =>
        id.endsWith("-cq-interaction-closure"),
      );
      if (!contract || !question) return [`${module.id}:missing-interaction-contract-or-cq`];
      const problems: string[] = [];
      for (const [facet, value] of Object.entries(contract.facets)) {
        if (!value.applicable && !isLocalized(value.not_applicable_reason)) {
          problems.push(`${module.id}:${facet}:missing-na-reason`);
        }
        if (Object.keys(value).sort().join(",") !== "applicable,not_applicable_reason") {
          problems.push(`${module.id}:${facet}:duplicates-derived-relation-ids`);
        }
      }
      if (contract.applicability === "descriptive") {
        if (
          Object.values(contract.facets).some(({ applicable }) => applicable) ||
          !question.query.includes("applicability=descriptive")
        ) {
          problems.push(`${module.id}:descriptive-invents-flow`);
        }
        return problems;
      }

      for (const facet of ["input", "output"] as const) {
        const match = question.query.match(new RegExp(`${facet}=([^,)]+)`, "u"));
        const relation = match ? relationById.get(match[1]) : undefined;
        if (
          !contract.facets[facet].applicable ||
          !relation ||
          moduleByConceptId.get(relation.source_id) !== module.id ||
          !question.expected_assertion.includes(relation.id)
        ) {
          problems.push(`${module.id}:${facet}:unresolved-canonical-fact`);
        }
      }
      for (const facet of ["failure", "recovery"] as const) {
        const match = question.query.match(new RegExp(`${facet}=([^,)]+)`, "u"));
        const relationId = match?.[1];
        if (contract.facets[facet].applicable) {
          if (!relationId || relationId === "not-applicable" || !relationById.has(relationId)) {
            problems.push(`${module.id}:${facet}:unresolved-canonical-fact`);
          }
        } else if (relationId !== "not-applicable") {
          problems.push(`${module.id}:${facet}:missing-explicit-na`);
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

  it("keeps the software-defect-repair path at exactly ten fragments and nine canonical traversals", () => {
    const path = candidateOntology().case_paths.find(({ id }) => id === "software-defect-repair");

    expect(path?.steps.map(({ case_fragment_example_id }) => case_fragment_example_id)).toEqual([
      "Goal-case-software-defect-repair-01",
      "TaskPlan-case-software-defect-repair-02",
      "TaskStep-case-software-defect-repair-03",
      "ToolCall-case-software-defect-repair-04",
      "ToolCallAttempt-case-software-defect-repair-05",
      "ToolResult-case-software-defect-repair-06",
      "EvaluationRun-case-software-defect-repair-07",
      "Feedback-case-software-defect-repair-08",
      "MemoryWrite-case-software-defect-repair-09",
      "MemoryRecord-case-software-defect-repair-10",
    ]);
    expect(path?.steps.slice(1).map(({ traversal_relation_id }) => traversal_relation_id)).toEqual([
      "Goal-elaborated_by-TaskPlan",
      "TaskPlan-contains_step-TaskStep",
      "TaskStep-invokes-ToolCall",
      "ToolCall-has_attempt-ToolCallAttempt",
      "ToolCallAttempt-produces_result-ToolResult",
      "EvaluationRun-evaluates-ToolResult",
      "EvaluationRun-produces-Feedback",
      "Feedback-triggers-MemoryWrite",
      "MemoryWrite-produces-MemoryRecord",
    ]);
  });

  it("models one concrete MWA-217 repair instead of a plan-audit ontology-review template", () => {
    const ontology = candidateOntology();
    const path = ontology.case_paths.find(({ id }) => id === "software-defect-repair");
    const exampleById = new Map(
      examplesWithOwners(ontology).map(({ example }) => [example.id, example]),
    );
    const fragments = path?.steps.map(({ case_fragment_example_id }) =>
      exampleById.get(case_fragment_example_id),
    ) ?? [];
    const serialized = JSON.stringify(fragments);

    expect(serialized).toContain("MWA-217");
    expect(serialized).toContain("src/lib/ontology-index.ts");
    expect(serialized).toContain("tests/ontology-view-model.test.ts");
    expect(serialized).toContain("missing relation endpoint");
    expect(serialized).toContain("apply_patch");
    expect(serialized).toContain("regression");
    expect(serialized).not.toMatch(/plan-audit|ontology closure|search_documents/iu);

    expect(fragments[1]?.field_values.plan_id).toBe("plan-defect-MWA-217");
    expect(fragments[3]?.field_values).toMatchObject({
      call_id: "call-defect-MWA-217-apply-patch",
      operation_id: "apply_patch",
      arguments: {
        defect_id: "MWA-217",
        plan_id: "plan-defect-MWA-217",
        task_step_id: "step-guard-invalid-relation",
        affected_file: "src/lib/ontology-index.ts",
        failing_test: "tests/ontology-view-model.test.ts",
      },
    });
    expect(fragments[4]?.field_values.attempt_id).toBe(
      "attempt-call-defect-MWA-217-apply-patch-1",
    );
    expect(fragments[5]?.field_values.result_id).toBe("result-defect-MWA-217-patch");
    expect(fragments[6]?.field_values).toMatchObject({
      evaluation_run_id: "eval-defect-MWA-217-regression",
      subject_id: "result-defect-MWA-217-patch",
    });
    expect(fragments[8]?.field_values).toMatchObject({
      operation_id: "memory-op-defect-MWA-217-write",
      actor_id: "actor-defect-repair-agent",
      input_version: 0,
      output_version: 1,
    });
    expect(fragments[9]?.field_values).toMatchObject({
      memory_record_id: "memory-defect-MWA-217",
      provenance_ref: "eval-defect-MWA-217-regression",
    });

    for (let index = 1; index < fragments.length; index += 1) {
      expect(fragments[index]?.descriptions.en).toContain(fragments[index - 1]?.id);
    }
  });

  it("keeps the MWA-217 case timestamps strictly monotonic from Goal through MemoryRecord", () => {
    const ontology = candidateOntology();
    const path = ontology.case_paths.find(({ id }) => id === "software-defect-repair");
    const exampleById = new Map(
      examplesWithOwners(ontology).map(({ example }) => [example.id, example]),
    );
    const fragments = path?.steps.map(({ case_fragment_example_id }) =>
      exampleById.get(case_fragment_example_id),
    ) ?? [];
    const isoInstant = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\b/u;
    const timestampText = fragments.map((fragment) =>
      String(fragment?.descriptions.en).match(isoInstant)?.[0],
    );
    const timestamps = timestampText.map((value) => Date.parse(value ?? ""));

    expect(timestampText.every((value) => value !== undefined)).toBe(true);
    expect(timestamps.slice(1).every((value, index) => value > timestamps[index])).toBe(true);
    expect(fragments[1]?.field_values.created_at).toBe(timestampText[1]);
    expect(fragments[3]?.field_values.requested_at).toBe(timestampText[3]);
    expect(fragments[4]?.field_values.started_at).toBe(timestampText[4]);
    expect(fragments[5]?.field_values.received_at).toBe(timestampText[5]);
    expect(fragments[6]?.field_values.started_at).toBe(timestampText[6]);
    expect(fragments[8]?.field_values.occurred_at).toBe(timestampText[8]);
    expect(fragments[9]?.field_values.valid_from).toBe(timestampText[9]);
  });

  it("keeps main-case field values inside each owning Concept schema", () => {
    const ontology = candidateOntology();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const parentIdsByChildId = new Map<string, string[]>();
    for (const relation of ontology.relations.filter(({ predicate }) => predicate === "is_a")) {
      parentIdsByChildId.set(relation.source_id, [
        ...(parentIdsByChildId.get(relation.source_id) ?? []),
        relation.target_id,
      ]);
    }
    const allowedFieldIds = (conceptId: string): ReadonlySet<string> => {
      const visited = new Set<string>();
      const pending = [conceptId];
      const fields = new Set<string>();
      while (pending.length > 0) {
        const current = pending.pop();
        if (current === undefined || visited.has(current)) continue;
        visited.add(current);
        for (const field of conceptById.get(current)?.structure?.fields ?? []) fields.add(field.id);
        pending.push(...(parentIdsByChildId.get(current) ?? []));
      }
      return fields;
    };
    const invalid = examplesWithOwners(ontology)
      .filter(
        ({ example, ownerKind }) =>
          ownerKind === "concept" &&
          example.kind === "case-fragment" &&
          example.scenario_id === "software-defect-repair",
      )
      .flatMap(({ example, ownerId }) => {
        const allowed = allowedFieldIds(ownerId);
        return Object.keys(example.field_values)
          .filter((fieldId) => !allowed.has(fieldId))
          .map((fieldId) => `${ownerId}.${fieldId}`);
      });

    expect(invalid).toEqual([]);
  });

  it("replaces every Module optional-review template with a concrete MWA-217 local role", () => {
    const moduleFragments = candidateOntology().modules.flatMap((module) =>
      (module.examples ?? [])
        .filter(({ kind, scenario_id }) =>
          kind === "case-fragment" && scenario_id === "software-defect-repair",
        )
        .map((example) => ({ example, moduleId: module.id })),
    );
    const invalid = moduleFragments.flatMap(({ example, moduleId }) => {
      const information = JSON.stringify({
        descriptions: example.descriptions,
        expected_result: example.expected_result,
        why_valid_or_invalid: example.why_valid_or_invalid,
      });
      return information.includes("MWA-217") &&
        !/optional review branch|可选审查分支|任意レビュー分岐|query resolves uniquely|查询唯一解析|照会は関係/iu.test(
          information,
        )
        ? []
        : [moduleId];
    });

    expect(moduleFragments).toHaveLength(41);
    expect(invalid).toEqual([]);
  });

  it("resolves every nested source claim in source-registry.csv", () => {
    const knownSourceIds = registryIds();
    const unresolved = collectSourceClaims(candidateOntology())
      .filter(({ claim }) => !hasText(claim.source_id) || !knownSourceIds.has(claim.source_id))
      .map(({ path, claim }) => `${path}:${String(claim.source_id)}`);

    expect(unresolved).toEqual([]);
  });

  it("requires every source claim to state the exact assertion it supports", () => {
    const unsupported = collectSourceClaims(candidateOntology())
      .filter(({ claim }) => !hasText(claim.supports))
      .map(({ path }) => path);

    expect(unsupported).toEqual([]);
  });

  it("keeps source URLs in the registry and uses precise in-source locators on claims", () => {
    const invalid = collectSourceClaims(candidateOntology())
      .filter(
        ({ claim }) =>
          !hasText(claim.locator) ||
          String(claim.locator).startsWith("research/source-notes/") ||
          /https?:\/\//u.test(String(claim.locator)) ||
          !String(claim.locator).includes(">"),
      )
      .map(({ path, claim }) => `${path}:${String(claim.source_id)}`);

    expect(invalid).toEqual([]);
  });

  it("removes legacy plane and evidence-count boilerplate from semantic text", () => {
    expect(JSON.stringify(candidateOntology())).not.toMatch(
      /所属平面：|证据源\s*\d+\s*项|出典\s*\d+\s*件|它聚合\s*\d+\s*个类|\d+\s*個のクラスを束ねます/u,
    );
  });

  it("keeps local field ids unique and resolves identity keys through the accepted is_a graph", () => {
    const ontology = candidateOntology();
    const effectiveStructures = buildEffectiveConceptStructures(
      ontology as unknown as Parameters<typeof buildEffectiveConceptStructures>[0],
    );
    const invalid = ontology.classes.flatMap((concept) => {
      const localFields = concept.structure?.fields ?? [];
      const localFieldIds = localFields.map((field) => field.id);
      const effectiveFieldIds = new Set(
        effectiveStructures.get(concept.id)?.fields.map(({ id }) => id) ?? [],
      );
      const invalidIdentityKeys = (concept.structure?.identity_keys ?? []).filter(
        (id) => !effectiveFieldIds.has(id),
      );
      const invalidCardinalities = localFields
        .filter(
          (field) =>
            field.cardinality.max !== null &&
            field.cardinality.min > field.cardinality.max,
        )
        .map((field) => field.id);
      return [
        ...duplicateValues(localFieldIds).map((id) => `${concept.id}:duplicate:${id}`),
        ...invalidIdentityKeys.map((id) => `${concept.id}:identity:${id}`),
        ...invalidCardinalities.map((id) => `${concept.id}:cardinality:${id}`),
      ];
    });

    expect(invalid).toEqual([]);
  });

  it("uses concept-local field ids and preserves reviewed datatype, identity, and multiplicity", () => {
    const ontology = candidateOntology();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const allFields = ontology.classes.flatMap((concept) => concept.structure?.fields ?? []);
    const field = (conceptId: string, fieldId: string) =>
      conceptById.get(conceptId)?.structure?.fields.find(({ id }) => id === fieldId);

    expect(allFields.filter(({ id }) => id.includes("."))).toEqual([]);
    expect(field("ContentBlock", "token_count")?.datatype).toBe("integer");
    expect(field("Conversation", "conversation_id")?.required).toBe(true);
    expect(conceptById.get("Conversation")?.structure?.identity_keys).toContain("conversation_id");
    expect(field("PromptTemplateInstance", "variable_bindings")?.cardinality.max).toBe(null);
    expect(field("Command", "arguments")?.cardinality.max).toBe(null);
    expect(field("ToolCall", "arguments")?.datatype).toBe("object");
    expect(
      conceptById
        .get("ToolDefinition")
        ?.structure?.fields.filter(({ id }) => id === "description"),
    ).toHaveLength(1);
  });

  it("attaches every controlled value to one concrete concept field", () => {
    const ontology = candidateOntology();
    const invalid = ontology.classes.flatMap((concept) =>
      (concept.structure?.fields ?? []).flatMap((field) => [
        ...duplicateValues(field.allowed_values.map((value) => value.id)).map(
          (id) => `${concept.id}:${field.id}:duplicate:${id}`,
        ),
        ...field.allowed_values
          .filter((value) => !hasText(value.id) || !hasText(field.id))
          .map((value) => `${concept.id}:${field.id}:${value.id}`),
      ]),
    );

    expect(Object.hasOwn(ontology, "controlled_values")).toBe(false);
    expect(Object.hasOwn(ontology, "allowed_values")).toBe(false);
    expect(invalid).toEqual([]);
  });

  it("closes every frozen legacy disposition over a resolvable canonical target", () => {
    type LegacyRecord = {
      source_collection: string;
      id: string;
      original_json_pointer: string;
      payload_sha256: string;
    };
    type Disposition = LegacyRecord & {
      action: string;
      target_refs: string[];
      status: string;
    };
    const ontology = candidateOntology();
    const dispositionManifest = JSON.parse(
      readFileSync(
        resolve(repositoryRoot, "ontology/migration/legacy-v1/disposition-manifest.json"),
        "utf8",
      ),
    ) as { records: Disposition[] };
    const recordManifest = JSON.parse(
      readFileSync(
        resolve(repositoryRoot, "ontology/migration/legacy-v1/record-manifest.json"),
        "utf8",
      ),
    ) as LegacyRecord[];
    const examples = examplesWithOwners(ontology).map(({ example }) => example.id);
    const resolvable = new Set([
      ontology.id,
      ...ontology.planes.map(({ id }) => id),
      ...ontology.modules.map(({ id }) => id),
      ...ontology.classes.map(({ id }) => id),
      ...ontology.relations.map(({ id }) => id),
      ...ontology.global_constraints.map(({ id }) => id),
      ...((ontology.hygiene_gates as Array<{ id: string }>) ?? []).map(({ id }) => id),
      ...examples,
      ...ontology.classes.flatMap((concept) => [
        ...(concept.structure?.fields ?? []).map((field) => `${concept.id}.${field.id}`),
        ...(concept.external_mappings ?? []).map((mapping) => mapping.id),
      ]),
    ]);
    const key = (record: LegacyRecord) =>
      `${record.source_collection}\0${record.id}\0${record.original_json_pointer}`;
    const recordByKey = new Map(recordManifest.map((record) => [key(record), record]));
    const dispositionKeys = dispositionManifest.records.map(key);
    const unresolved = dispositionManifest.records.flatMap((record) =>
      record.target_refs
        .filter((targetRef) => !resolvable.has(targetRef))
        .map((targetRef) => `${key(record)} -> ${targetRef}`),
    );
    const hashDrift = dispositionManifest.records
      .filter((record) => recordByKey.get(key(record))?.payload_sha256 !== record.payload_sha256)
      .map(key);
    const targetless = dispositionManifest.records
      .filter(
        (record) =>
          record.target_refs.length === 0 && !/(?:remove|retire)/u.test(record.action),
      )
      .map(key);

    expect(dispositionManifest.records).toHaveLength(recordManifest.length);
    expect(new Set(dispositionKeys).size).toBe(recordManifest.length);
    expect(dispositionManifest.records.every(({ status }) => status === "accepted")).toBe(true);
    expect(hashDrift).toEqual([]);
    expect(unresolved).toEqual([]);
    expect(targetless).toEqual([]);
  });

  it("requires deprecated concepts to resolve a replacement or give a localized reason", () => {
    const ontology = candidateOntology();
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const invalid = ontology.classes
      .filter((concept) => concept.status === "deprecated")
      .filter((concept) => {
        const replacements = concept.replaced_by_ids ?? [];
        const replacementsResolve =
          replacements.length > 0 && replacements.every((id) => conceptIds.has(id));
        return !replacementsResolve && !isLocalized(concept.deprecation_reason);
      })
      .map((concept) => concept.id);

    expect(invalid).toEqual([]);
  });

  it("keeps examples, fields, constraints, and source claims out of graph element identity", () => {
    const ontology = candidateOntology();
    const graphElementIds = new Set([
      ontology.id,
      ...ontology.planes.map((plane) => plane.id),
      ...ontology.modules.map((module) => module.id),
      ...ontology.classes.map((concept) => concept.id),
      ...ontology.relations.map((relation) => relation.id),
    ]);
    const annotationIds = [
      ...examplesWithOwners(ontology).map(({ example }) => example.id),
      ...ontology.global_constraints.map((constraint) => constraint.id),
      ...ontology.classes.flatMap((concept) => [
        ...(concept.structure?.fields ?? []).map((field) => field.id),
        ...(concept.structure?.constraints ?? []).map((constraint) => constraint.id),
        ...(concept.structure?.required_relation_constraints ?? []).map(
          (constraint) => constraint.id,
        ),
      ]),
      ...ontology.relations.flatMap((relation) => [
        ...(relation.conditions ?? []).map((constraint) => constraint.id),
        ...(relation.constraints ?? []).map((constraint) => constraint.id),
      ]),
    ];
    const collisions = annotationIds.filter((id) => graphElementIds.has(id));

    expect(duplicateValues([
      ontology.id,
      ...ontology.planes.map((plane) => plane.id),
      ...ontology.modules.map((module) => module.id),
      ...ontology.classes.map((concept) => concept.id),
    ])).toEqual([]);
    expect(collisions).toEqual([]);
  });
});
