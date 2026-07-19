const localized = (value: string) => ({
  zh: value,
  en: value,
  ja: value,
});

const sourceClaim = (ownerId: string, index: number) => ({
  source_id: `source-${ownerId}-${index}`,
  supports: `Claim ${index} for ${ownerId}`,
  locator: `section-${index}`,
  evidence_kind: "official",
  confidence: "high",
});

const example = (ownerId: string, index: number) => ({
  id: `${ownerId}-example-${index}`,
  labels: localized(`${ownerId} example ${index}`),
  scenario_id: null,
  descriptions: localized(`Example ${index} for ${ownerId}`),
  field_values: { sequence: index },
  related_node_ids: [],
  related_relation_ids: [],
  expected_result: localized(`Expected result ${index}`),
  why_valid_or_invalid: localized(`Reason ${index}`),
  synthetic: true,
  verified_version: "https://moonweave.ai/ontology/agent-system/2.0.0/",
  source_claims: [],
});

const field = (ownerId: string, index: number) => ({
  id: `${ownerId.toLowerCase()}_field_${index}`,
  labels: localized(`${ownerId} field ${index}`),
  datatype: "string",
  required: index === 1,
  cardinality: { min: index === 1 ? 1 : 0, max: 1 },
  definitions: localized(`Field ${index} for ${ownerId}`),
  allowed_values: [],
  pattern: null,
  example_value: `value-${index}`,
  source_claims: [],
});

const constraint = (ownerId: string, index: number) => ({
  id: `${ownerId}-constraint-${index}`,
  labels: localized(`${ownerId} constraint ${index}`),
  definitions: localized(`Constraint ${index} for ${ownerId}`),
  explanations: localized(`Constraint ${index} for ${ownerId}`),
  expression_language: "plain",
  expression: `${ownerId.toLowerCase()}_field_${index} != null`,
  severity: "error",
  source_claims: [],
});

const plane = (id: string) => ({
  id,
  labels: localized(id),
  definitions: localized(`Definition for ${id}`),
  purpose: localized(`Purpose for ${id}`),
  includes: [localized(`${id} included scope`)],
  excludes: [localized(`${id} excluded scope`)],
  examples: [example(id, 1)],
  source_claims: [sourceClaim(id, 1)],
  status: "accepted",
});

const module = (id: string, planeId: string) => ({
  id,
  plane_id: planeId,
  labels: localized(id),
  definitions: localized(`Definition for ${id}`),
  purpose: localized(`Purpose for ${id}`),
  includes: [localized(`${id} included scope`)],
  excludes: [localized(`${id} excluded scope`)],
  interaction_contract: {
    applicability: "operational",
    not_applicable_reasons: {},
  },
  taxonomy_contract: {
    applicability: "specialization",
    not_applicable_reason: null,
  },
  examples: [example(id, 1)],
  source_claims: [sourceClaim(id, 1)],
  status: "accepted",
});

type ConceptOptions = {
  primaryParentRelationId?: string | null;
  richAnnotations?: boolean;
};

const concept = (id: string, moduleId: string, options: ConceptOptions = {}) => ({
  id,
  module_id: moduleId,
  labels: localized(id),
  short_definitions: localized(`Short definition for ${id}`),
  definitions: localized(`Formal definition for ${id}`),
  why_needed: localized(`Why ${id} is needed`),
  includes: [localized(`${id} included scope`)],
  excludes: [localized(`${id} excluded scope`)],
  semantic_kind: "entity",
  primary_parent_relation_id: options.primaryParentRelationId ?? null,
  structure: {
    identity_keys: options.richAnnotations ? [`${id.toLowerCase()}_field_1`] : [],
    fields: options.richAnnotations
      ? Array.from({ length: 7 }, (_, index) => field(id, index + 1))
      : [],
    constraints: options.richAnnotations
      ? Array.from({ length: 6 }, (_, index) => constraint(id, index + 1))
      : [],
    required_relation_constraints: [],
  },
  examples: options.richAnnotations
    ? Array.from({ length: 8 }, (_, index) => example(id, index + 1))
    : [example(id, 1), example(id, 2)],
  source_claims: options.richAnnotations
    ? Array.from({ length: 9 }, (_, index) => sourceClaim(id, index + 1))
    : [sourceClaim(id, 1)],
  applicability: ["core"],
  status: "accepted",
});

type RelationOptions = {
  kind?: "hierarchy" | "semantic";
  predicate?: string;
};

const relation = (
  id: string,
  sourceId: string,
  targetId: string,
  options: RelationOptions = {},
) => {
  const relationKind = options.kind ?? "semantic";
  const predicate = options.predicate ?? "relates_to";

  return {
    id,
    predicate,
    source_id: sourceId,
    target_id: targetId,
    direction: "source-to-target",
    relation_kind: relationKind,
    labels: localized(predicate),
    definitions: localized(`${sourceId} ${predicate} ${targetId}`),
    cardinality: null,
    cardinality_not_applicable_reason: localized(
      relationKind === "hierarchy"
        ? "Taxonomy does not use instance cardinality"
        : "This test relation has no cardinality assertion",
    ),
    inverse_reading: {
      predicate: relationKind === "hierarchy" ? "has_subtype" : `inverse_${predicate}`,
      labels: localized(relationKind === "hierarchy" ? "has subtype" : `inverse ${predicate}`),
    },
    conditions: [],
    temporal_scope: "timeless",
    constraints: [],
    examples: [example(id, 1), example(id, 2)],
    source_claims: [sourceClaim(id, 1)],
    status: "accepted",
  };
};

export const ontologyViewModelFixture = {
  id: "agent-system-ontology",
  labels: localized("Agent Ontology"),
  short_definitions: localized("A single canonical Agent concept graph"),
  definitions: localized("The canonical Agent ontology used by the view-model contract tests"),
  why_needed: localized("It makes graph projection deterministic"),
  includes: [localized("Agent ontology concepts")],
  excludes: [localized("Annotation shadow nodes")],
  examples: [example("agent-system-ontology", 1)],
  source_claims: [sourceClaim("agent-system-ontology", 1)],
  status: "accepted",
  date: "2026-07-13",
  artifact_metadata: {
    canonical_version: "https://moonweave.ai/ontology/agent-system/2.0.0/",
    base_iri: "https://moonweave.ai/ontology/agent-system/",
    version_iri: "https://moonweave.ai/ontology/agent-system/2.0.0/",
    generated: true,
    generated_from: ["tests/fixtures/ontology-view-model.fixture.ts"],
    do_not_edit: true,
    generator_version: "2.0.0-test",
  },
  planes: [
    plane("runtime-plane"),
    plane("orchestration-plane"),
    plane("tool-plane"),
    plane("safety-plane"),
    plane("feedback-plane"),
    plane("memory-plane"),
    plane("info-plane"),
  ],
  modules: [
    module("run-lifecycle", "runtime-plane"),
    module("runtime-observability", "runtime-plane"),
    module("orchestration-control", "orchestration-plane"),
    module("tool-catalog", "tool-plane"),
    module("safety-policy", "safety-plane"),
    module("feedback-evaluation", "feedback-plane"),
    module("memory-context", "memory-plane"),
    module("info-evidence", "info-plane"),
  ],
  classes: [
    concept("RuntimeEntity", "run-lifecycle"),
    concept("ExecutableEntity", "run-lifecycle"),
    concept("RunResult", "run-lifecycle"),
    concept("AgentRun", "run-lifecycle", {
      primaryParentRelationId: "AgentRun-is_a-RuntimeEntity",
      richAnnotations: true,
    }),
    concept("LeafRun", "run-lifecycle", {
      primaryParentRelationId: "LeafRun-is_a-AgentRun",
    }),
    concept("Trace", "runtime-observability"),
    concept("Tool", "tool-catalog"),
  ],
  relations: [
    relation("AgentRun-is_a-RuntimeEntity", "AgentRun", "RuntimeEntity", {
      kind: "hierarchy",
      predicate: "is_a",
    }),
    relation("AgentRun-is_a-ExecutableEntity", "AgentRun", "ExecutableEntity", {
      kind: "hierarchy",
      predicate: "is_a",
    }),
    relation("LeafRun-is_a-AgentRun", "LeafRun", "AgentRun", {
      kind: "hierarchy",
      predicate: "is_a",
    }),
    relation("AgentRun-produces-RunResult", "AgentRun", "RunResult", {
      predicate: "produces",
    }),
    relation("AgentRun-finalizes-RunResult", "AgentRun", "RunResult", {
      predicate: "finalizes",
    }),
    relation("RunResult-describes-AgentRun", "RunResult", "AgentRun", {
      predicate: "describes",
    }),
  ],
  global_constraints: [],
  case_paths: [
    {
      id: "case-path-that-must-not-become-a-node",
      labels: localized("Case path annotation"),
      steps: [],
    },
  ],
  hygiene_gates: ["schema/example/source/constraint/case records never become graph nodes"],
  ontology_metrics: {
    domains: 8,
    modules: 9,
    concepts: 7,
    taxonomy_roots: 5,
    is_a_relations: 3,
    semantic_relations: 3,
    instance_examples: 6,
    controlled_values: 0,
    structure_fields: 7,
    constraints: 6,
    source_claims: 39,
    case_paths: 1,
  },
};

export const fixtureRefs = {
  root: "root:agent-system-ontology",
  runtimePlane: "plane:runtime-plane",
  toolPlane: "plane:tool-plane",
  runLifecycleModule: "module:run-lifecycle",
  toolCatalogModule: "module:tool-catalog",
  runtimeEntity: "concept:RuntimeEntity",
  executableEntity: "concept:ExecutableEntity",
  runResult: "concept:RunResult",
  agentRun: "concept:AgentRun",
  leafRun: "concept:LeafRun",
  tool: "concept:Tool",
} as const;

const inheritedFieldConcept = (
  id: string,
  parentId: string | null,
  fieldId: string,
  required: boolean,
) => ({
  ...concept(id, "run-lifecycle", {
    primaryParentRelationId: parentId ? `${id}-is_a-${parentId}` : null,
  }),
  structure: {
    identity_keys: [],
    fields: [
      {
        ...field(id, 1),
        id: fieldId,
        required,
        cardinality: { min: required ? 1 : 0, max: 1 },
        labels: localized(`${id} ${fieldId}`),
        definitions: localized(`${fieldId} declared by ${id}`),
      },
    ],
    constraints: [],
    required_relation_constraints: [],
  },
});

/** Separate fixture: canonical stores only local fields; consumers derive inherited fields. */
export const inheritanceProjectionFixture = {
  ...ontologyViewModelFixture,
  classes: [
    ...ontologyViewModelFixture.classes,
    inheritedFieldConcept("Message", null, "message_id", true),
    inheritedFieldConcept("AssistantMessage", "Message", "assistant_role", true),
    inheritedFieldConcept("MediaContent", null, "media_type", true),
    inheritedFieldConcept("AudioContent", "MediaContent", "sample_rate_hz", false),
  ],
  relations: [
    ...ontologyViewModelFixture.relations,
    relation("AssistantMessage-is_a-Message", "AssistantMessage", "Message", {
      kind: "hierarchy",
      predicate: "is_a",
    }),
    relation("AudioContent-is_a-MediaContent", "AudioContent", "MediaContent", {
      kind: "hierarchy",
      predicate: "is_a",
    }),
  ],
};
