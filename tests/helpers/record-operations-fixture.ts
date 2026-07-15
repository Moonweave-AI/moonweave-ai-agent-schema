const migrationModulePath: string =
  "../../scripts/migration/semantic-depth-v3/record-operations.mjs";
const { createRecordOperationPhases } = await import(migrationModulePath);

export type LooseRecord = Record<string, any>;

export const localized = (zh: string, en: string, ja: string) => ({ zh, en, ja });

export const field = ({
  id,
  required = false,
  min = 0,
  max = 1,
  exampleValue = `${id}-example`,
  allowedValues,
}: {
  id: string;
  required?: boolean;
  min?: number;
  max?: number | null;
  exampleValue?: unknown;
  allowedValues?: unknown[];
}): LooseRecord => ({
  id,
  labels: localized(id, id, id),
  definitions: localized(`${id}定义`, `${id} definition`, `${id}定義`),
  value_type: "string",
  required,
  cardinality: { min, max },
  example_value: exampleValue,
  ...(allowedValues === undefined
    ? {}
    : {
        allowed_values: allowedValues.map((value, index) => ({
          id: `${id}-${index}`,
          value,
          labels: localized(String(value), String(value), String(value)),
          definitions: localized("值", "value", "値"),
        })),
      }),
  source_claims: [{ source_id: "test-source", locator: "fixture", supports: id }],
});

export const concept = ({
  id,
  moduleId = "module-a",
  status = "accepted",
  primaryParentRelationId = null,
  fields = [],
  examples = [],
  ...overrides
}: {
  id: string;
  moduleId?: string;
  status?: string;
  primaryParentRelationId?: string | null;
  fields?: LooseRecord[];
  examples?: LooseRecord[];
  [key: string]: unknown;
}): LooseRecord => ({
  id,
  module_id: moduleId,
  labels: localized(`${id}中`, id, `${id}日`),
  definitions: localized(`${id}定义`, `${id} definition`, `${id}定義`),
  short_definitions: localized(`${id}短`, `${id} short`, `${id}短`),
  semantic_kind: "information",
  status,
  primary_parent_relation_id: primaryParentRelationId,
  root_status: primaryParentRelationId ? null : "composition-root",
  why_needed: localized("需要", "needed", "必要"),
  includes: [localized("纳入", "include", "含む")],
  excludes: [localized("排除", "exclude", "除外")],
  sibling_differentiation: [],
  examples: structuredClone(examples),
  source_claims: [{ source_id: "test-source", locator: "fixture", supports: id }],
  structure: {
    identity_keys: [],
    fields: structuredClone(fields),
    constraints: [],
    required_relation_constraints: [],
  },
  review: localized("复审", "reviewed", "再審査"),
  change_note: localized("变更", "changed", "変更"),
  ...structuredClone(overrides),
});

export const relation = ({
  id,
  sourceId,
  targetId,
  predicate = "relates_to",
  status = "accepted",
  examples = [],
  ...overrides
}: {
  id: string;
  sourceId: string;
  targetId: string;
  predicate?: string;
  status?: string;
  examples?: LooseRecord[];
  [key: string]: unknown;
}): LooseRecord => ({
  id,
  source_id: sourceId,
  target_id: targetId,
  predicate,
  relation_kind: predicate === "is_a" ? "hierarchy" : "semantic",
  status,
  definitions: localized("关系", "relation", "関係"),
  source_claims: [{ source_id: "test-source", locator: "fixture", supports: id }],
  examples: structuredClone(examples),
  ...structuredClone(overrides),
});

const valuesById = (moduleDocuments: Map<string, LooseRecord>, key: "classes" | "relations") =>
  [...moduleDocuments.values()].flatMap((entry) => entry.document[key]);

export const createRecordOperationsHarness = ({
  modules = [
    { id: "module-a", planeId: "plane-a", classes: [], relations: [] },
    { id: "module-b", planeId: "plane-b", classes: [], relations: [] },
  ],
  conceptOverrides = [],
  relationOverrides = [],
  effectiveStructures,
}: {
  modules?: Array<{
    id: string;
    planeId?: string;
    classes?: LooseRecord[];
    relations?: LooseRecord[];
  }>;
  conceptOverrides?: LooseRecord[];
  relationOverrides?: LooseRecord[];
  effectiveStructures?: Map<string, LooseRecord>;
} = {}) => {
  const moduleDocuments = new Map(
    modules.map(({ id, planeId = `plane-${id}`, classes = [], relations = [] }) => [
      id,
      {
        document: {
          module: { id, plane_id: planeId },
          classes: structuredClone(classes),
          relations: structuredClone(relations),
        },
      },
    ]),
  );
  const extraConcepts = new Map(conceptOverrides.map((value) => [value.id, value]));
  const extraRelations = new Map(relationOverrides.map((value) => [value.id, value]));
  const dynamicIndex = (key: "classes" | "relations", extras: Map<string, LooseRecord>) => {
    const current = () => new Map([
      ...valuesById(moduleDocuments, key).map((value) => [value.id, value] as const),
      ...extras,
    ]);
    return Object.assign(() => current(), {
      get: (id: string) => current().get(id),
      has: (id: string) => current().has(id),
      values: () => current().values(),
    });
  };
  const allConcepts = dynamicIndex("classes", extraConcepts);
  const allRelations = dynamicIndex("relations", extraRelations);
  const claimsFor = (record: LooseRecord) => structuredClone(
    record.source_claims ?? [{ source_id: "test-source", locator: "fixture", supports: record.id }],
  );
  const reviewFor = (planeId: string, note: LooseRecord) => ({ plane_id: planeId, note });
  const makeConcept = (parameters: LooseRecord) => concept({
    id: parameters.id,
    moduleId: parameters.moduleId,
    primaryParentRelationId: parameters.primaryParentRelationId,
    fields: parameters.structure?.fields ?? [],
    examples: parameters.examples ?? [],
    ...parameters,
    module_id: parameters.moduleId,
    semantic_kind: parameters.semanticKind,
    source_claims: parameters.sourceClaims,
  });
  const makeRelation = (parameters: LooseRecord) => relation({
    id: parameters.id,
    sourceId: parameters.sourceId,
    targetId: parameters.targetId,
    predicate: parameters.predicate,
    ...parameters,
    source_id: parameters.sourceId,
    target_id: parameters.targetId,
    relation_kind: parameters.relationKind,
    source_claims: parameters.sourceClaims,
  });
  const relationExamples = ({ id }: { id: string }) => [
    { id: `${id}-example-positive-001`, kind: "positive" },
    { id: `${id}-example-boundary-001`, kind: "boundary" },
  ];
  const conceptExamples = ({ id }: { id: string }) => [
    {
      id: `${id}-example-positive-001`,
      kind: "positive",
      related_node_ids: [id],
      related_relation_ids: [],
    },
    {
      id: `${id}-example-boundary-001`,
      kind: "boundary",
      related_node_ids: [id],
      related_relation_ids: [],
    },
  ];
  const defaultEffectiveStructures = new Map(
    valuesById(moduleDocuments, "classes").map((value) => [value.id, value.structure]),
  );
  const operations = createRecordOperationPhases({
    VERSION_IRI: "https://moonweave.ai/ontology/agent-system/3.0.0/",
    localized,
    moduleDocuments,
    allConcepts,
    allRelations,
    reviewFor,
    claimsFor,
    conceptExamples,
    makeConcept,
    relationExamples,
    makeRelation,
    buildEffectiveConceptStructures: () => effectiveStructures ?? defaultEffectiveStructures,
  });

  return { moduleDocuments, allConcepts, allRelations, operations };
};
