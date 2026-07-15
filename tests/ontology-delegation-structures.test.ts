import { describe, expect, it } from "vitest";

import { buildOntologyIndex } from "../src/lib/ontology-index";
import {
  buildVisibleConceptGraph,
  createOntologyViewState,
} from "../src/lib/ontology-view-model";
import { buildEffectiveConceptStructures } from "../scripts/lib/ontology-concept-structure.mjs";
import {
  DELEGATION_NODE_INFORMATION_CONCEPT_IDS,
  createDelegationNodeInformationPhases,
} from "../scripts/migration/semantic-depth-v3/delegation-node-information.mjs";
import {
  fixtureRefs,
  ontologyViewModelFixture,
} from "./fixtures/ontology-view-model.fixture";

type JsonRecord = Readonly<Record<string, any>>;

const localized = (zh: string, en: string, ja: string) => ({ zh, en, ja });

const sourceClaim = (conceptId: string) => ({
  source_id: `source-${conceptId}`,
  supports: `Reviewed operational evidence for ${conceptId}.`,
  locator: `Documentation > ${conceptId}`,
  evidence_kind: "design-inference",
  confidence: "medium",
  review_status: "accepted",
});

const emptyStructure = () => ({
  identity_keys: [],
  fields: [],
  constraints: [],
  required_relation_constraints: [],
});

const concept = (id: string): JsonRecord => ({
  id,
  module_id: "orchestration-delegation-handoff",
  labels: localized(id, id, id),
  definitions: localized(`${id} 定义。`, `${id} definition.`, `${id} の定義。`),
  source_claims: [sourceClaim(id)],
  structure: emptyStructure(),
  examples: [],
  status: "accepted",
});

const relations = [
  {
    id: "SubagentContext-is_a-DelegationContext",
    predicate: "is_a",
    source_id: "SubagentContext",
    target_id: "DelegationContext",
    status: "accepted",
  },
];

const createHarness = () => {
  let concepts: JsonRecord[] = [
    ...DELEGATION_NODE_INFORMATION_CONCEPT_IDS.map(concept),
    concept("SubagentContext"),
  ];
  concepts = concepts.map((candidate) =>
    candidate.id === "WorkerPool"
      ? {
          ...candidate,
          structure: {
            ...candidate.structure,
            fields: [
              {
                id: "existing_note",
                labels: localized("既有说明", "existing note", "既存メモ"),
                datatype: "string",
                required: false,
                cardinality: { min: 0, max: 1 },
                definitions: localized("保留既有字段。", "Preserves an existing field.", "既存項目を保持します。"),
                allowed_values: [],
                pattern: null,
                example_value: "preserved",
                source_claims: [sourceClaim("WorkerPool")],
              },
            ],
          },
        }
      : candidate,
  );
  const inputSnapshot = structuredClone(concepts);
  const module = {
    id: "orchestration-delegation-handoff",
    source_claims: [sourceClaim("orchestration-delegation-handoff")],
  };
  const context = {
    localized,
    moduleDocuments: new Map([
      [module.id, { document: { module } }],
    ]),
    allConcepts: () => new Map(concepts.map((candidate) => [candidate.id, candidate])),
    claimsFor: (owner: JsonRecord) => structuredClone(owner.source_claims),
    updateReviewedConcept: (id: string, patch: JsonRecord) => {
      concepts = concepts.map((candidate) =>
        candidate.id === id
          ? { ...candidate, ...structuredClone(patch) }
          : candidate,
      );
    },
  };

  return {
    apply: () => createDelegationNodeInformationPhases(context).applyDelegationNodeInformation(),
    concepts: () => concepts,
    inputSnapshot,
  };
};

const assertLocalized = (value: JsonRecord, owner: string) => {
  for (const language of ["zh", "en", "ja"] as const) {
    expect(value[language], `${owner}/${language}`).toEqual(expect.any(String));
    expect(value[language].trim().length, `${owner}/${language}`).toBeGreaterThan(0);
  }
};

describe("delegation node information migration", () => {
  it("adds resolvable local identity and required core fields without mutating its input", () => {
    const harness = createHarness();
    harness.apply();

    expect(harness.inputSnapshot.every((candidate) => candidate.structure.identity_keys.length === 0)).toBe(true);
    for (const conceptId of DELEGATION_NODE_INFORMATION_CONCEPT_IDS) {
      const patched = harness.concepts().find(({ id }) => id === conceptId);
      expect(patched, conceptId).toBeDefined();
      if (patched === undefined) throw new Error(`Missing patched concept ${conceptId}`);
      expect(patched.structure.identity_keys.length, conceptId).toBeGreaterThan(0);
      const fieldsById = new Map(
        patched.structure.fields.map((field: JsonRecord) => [field.id, field]),
      );
      for (const identityKey of patched.structure.identity_keys) {
        expect(fieldsById.get(identityKey), `${conceptId}.${identityKey}`).toMatchObject({
          required: true,
          cardinality: { min: 1, max: 1 },
        });
      }
      for (const field of patched.structure.fields) {
        assertLocalized(field.labels, `${conceptId}.${field.id}.labels`);
        assertLocalized(field.definitions, `${conceptId}.${field.id}.definitions`);
        expect(field.example_value, `${conceptId}.${field.id}.example_value`).not.toBeUndefined();
        if (Array.isArray(field.example_value)) {
          expect(
            field.cardinality.max,
            `${conceptId}.${field.id} repeatable example cardinality`,
          ).toBeNull();
        }
        expect(field.source_claims.length, `${conceptId}.${field.id}.source_claims`).toBeGreaterThan(0);
        expect(field.source_claims.every((claim: JsonRecord) => claim.review_status === "accepted")).toBe(true);
      }
      expect(
        patched.structure.fields.some((field: JsonRecord) => field.required),
        `${conceptId} required core fields`,
      ).toBe(true);
    }
    expect(
      harness.concepts().find(({ id }) => id === "WorkerPool")?.structure.fields,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ id: "existing_note" })]));
  });

  it("is idempotent and lets SubagentContext inherit the DelegationContext contract", () => {
    const harness = createHarness();
    harness.apply();
    const once = structuredClone(harness.concepts());
    harness.apply();
    expect(harness.concepts()).toEqual(once);

    const effective = buildEffectiveConceptStructures({
      classes: harness.concepts(),
      relations,
    });
    const delegationContext = effective.get("DelegationContext");
    const subagentContext = effective.get("SubagentContext");
    expect(subagentContext?.identity_keys).toEqual(delegationContext?.identity_keys);
    expect(subagentContext?.fields).toEqual(delegationContext?.fields);
    expect(subagentContext?.identity_keys).toEqual(["context_id", "version"]);
  });

  it("makes at least one delegation-budget limit mandatory as a cross-field constraint", () => {
    const harness = createHarness();
    harness.apply();
    const budget = harness.concepts().find(({ id }) => id === "DelegationBudget");
    const limitIds = [
      "token_limit",
      "time_limit_ms",
      "cost_limit",
      "retry_limit",
      "tool_call_limit",
      "context_token_limit",
    ];

    expect(budget?.structure.fields.map(({ id }: JsonRecord) => id)).toEqual(
      expect.arrayContaining(limitIds),
    );
    expect(budget?.structure.constraints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "delegation-budget-has-limit",
          severity: "error",
          expression: expect.stringMatching(/at least one|至少一个/iu),
        }),
      ]),
    );
  });

  it("keeps delegation fields and constraints as node details instead of graph elements", () => {
    const harness = createHarness();
    harness.apply();
    const delegationContext = harness.concepts().find(({ id }) => id === "DelegationContext");
    if (delegationContext === undefined) throw new Error("DelegationContext was not patched");
    const ontology = {
      ...ontologyViewModelFixture,
      classes: ontologyViewModelFixture.classes.map((candidate) =>
        candidate.id === "AgentRun"
          ? { ...candidate, structure: delegationContext.structure }
          : candidate,
      ),
    };
    const index = buildOntologyIndex(
      ontology as unknown as Parameters<typeof buildOntologyIndex>[0],
    );
    const graph = buildVisibleConceptGraph(
      index,
      createOntologyViewState(index, { graphRootRef: fixtureRefs.agentRun }),
    );
    const fieldIds = new Set(
      delegationContext.structure.fields.map(({ id }: JsonRecord) => id),
    );

    expect(graph.nodes.some(({ id }) => fieldIds.has(id))).toBe(false);
    expect(graph.diagnostics).toMatchObject({
      schemaFieldNodeCount: 0,
      exampleNodeCount: 0,
      sourceClaimNodeCount: 0,
      constraintNodeCount: 0,
    });
  });
});
