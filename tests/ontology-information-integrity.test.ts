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

describe("candidate ontology case, evidence, and annotation integrity", () => {
  it("keeps the software-defect-repair path at exactly eleven fragments and ten canonical traversals", () => {
    const path = candidateOntology().case_paths.find(({ id }) => id === "software-defect-repair");

    expect(path?.steps.map(({ case_fragment_example_id }) => case_fragment_example_id)).toEqual([
      "Goal-case-software-defect-repair-01",
      "TaskPlan-case-software-defect-repair-02",
      "TaskStep-case-software-defect-repair-03",
      "ToolCallPlan-case-software-defect-repair-03a",
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
      "TaskStep-specifies-ToolCallPlan",
      "ToolCallPlan-plans-ToolCall",
      "ToolCall-has_attempt-ToolCallAttempt",
      "ToolCallAttempt-produces_result-ToolResult",
      "EvaluationRun-evaluates-ToolResult",
      "EvaluationRun-produces-Feedback",
      "MemoryWrite-responds_to-Feedback",
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
    expect(fragments[4]?.field_values).toMatchObject({
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
    expect(fragments[5]?.field_values.attempt_id).toBe(
      "attempt-call-defect-MWA-217-apply-patch-1",
    );
    expect(fragments[6]?.field_values.result_id).toBe("result-defect-MWA-217-patch");
    expect(fragments[7]?.field_values).toMatchObject({
      evaluation_run_id: "eval-defect-MWA-217-regression",
      subject_id: "result-defect-MWA-217-patch",
    });
    expect(fragments[9]?.field_values).toMatchObject({
      operation_id: "memory-op-defect-MWA-217-write",
      actor_id: "actor-defect-repair-agent",
      input_version: 0,
      output_version: 1,
    });
    expect(fragments[10]?.field_values).toMatchObject({
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
    expect(fragments[4]?.field_values.requested_at).toBe(timestampText[4]);
    expect(fragments[5]?.field_values.started_at).toBe(timestampText[5]);
    expect(fragments[6]?.field_values.received_at).toBe(timestampText[6]);
    expect(fragments[7]?.field_values.started_at).toBe(timestampText[7]);
    expect(fragments[9]?.field_values.occurred_at).toBe(timestampText[9]);
    expect(fragments[10]?.field_values.valid_from).toBe(timestampText[10]);
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

  it("keeps the software-defect path at the root without per-Module shadow fragments", () => {
    const ontology = candidateOntology();
    const moduleFragments = ontology.modules.flatMap((module) =>
      (module.examples ?? [])
        .filter(({ kind, scenario_id }) =>
          kind === "case-fragment" && scenario_id === "software-defect-repair",
        )
        .map((example) => ({ example, moduleId: module.id })),
    );
    const rootPath = ontology.case_paths.find(({ id }) => id === "software-defect-repair");
    const caseFragmentIds = new Set(
      examplesWithOwners(ontology)
        .filter(({ example }) => example.kind === "case-fragment")
        .map(({ example }) => example.id),
    );
    const unresolvedSteps = rootPath?.steps
      .filter(({ case_fragment_example_id }) => !caseFragmentIds.has(case_fragment_example_id))
      .map(({ case_fragment_example_id }) => case_fragment_example_id) ?? ["missing-root-path"];

    expect(moduleFragments).toEqual([]);
    expect(rootPath?.steps.length).toBeGreaterThan(0);
    expect(unresolvedSteps).toEqual([]);
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
