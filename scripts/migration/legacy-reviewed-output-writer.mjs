import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { writeFileTransaction } from "../lib/atomic-write.mjs";
import { stringifyCsv } from "../lib/csv.mjs";
import {
  acceptedLegacyAxiomRows,
  conceptLocalFieldId,
} from "../lib/ontology-legacy-migration.mjs";
import { localized } from "../lib/ontology-migration-factories.mjs";
import { stableJson } from "../lib/stable-json.mjs";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const historicalSourceErrors = (source) => {
  const errors = [];
  if (typeof source?.contract_version !== "string") errors.push("contract_version");
  if (source?.source_kind === "agent-ontology-product") {
    for (const key of ["product", "planes", "global_constraints", "case_paths", "hygiene_gates"]) {
      if (!(key in source)) errors.push(key);
    }
  } else if (source?.source_kind === "agent-ontology-module") {
    if (!source.module?.id) errors.push("module.id");
    if (!Array.isArray(source.classes)) errors.push("classes");
    if (!Array.isArray(source.relations)) errors.push("relations");
  } else errors.push("source_kind");
  return errors;
};

export const writeLegacyMigrationOutputs = async (context) => {
  let {
    relations,
    repositoryRoot,
    legacy,
    definitionLedger,
    concepts,
    updatedModules,
    updatedPlanes,
    productSource,
    moduleEntryById,
    moduleIdByConcept,
    relationDisposition,
    individualResult,
    dataPropertyResult,
    adapterMappingResult,
    checkOnly,
    legacyReplay,
    expectedLegacyHash,
    expectedRecordManifestHash,
    conceptDecisions,
    removedDecisions,
    productEntry,
    decisionByConceptId,
    primaryRelationId,
    anchors,
    normalizeControlledReleaseDates,
    compressSourceClaims,
    withDirectSourceLocators,
    withoutLegacySemanticBoilerplate,
  } = context;
  const product = productSource.product;

const reverseGroups = new Map();
for (const relation of relations) {
  if (relation.source_id === relation.target_id) continue;
  const key = [relation.source_id, relation.target_id].sort().join("\0");
  reverseGroups.set(key, [...(reverseGroups.get(key) ?? []), relation]);
}
relations = relations.map((relation) => {
  const group = reverseGroups.get([relation.source_id, relation.target_id].sort().join("\0")) ?? [];
  const reversed = group.some(
    (candidate) =>
      candidate.id !== relation.id &&
      candidate.source_id === relation.target_id &&
      candidate.target_id === relation.source_id,
  );
  return reversed
    ? {
        ...relation,
        distinct_fact_rationale: localized(
          "该方向记录具有独立谓词和工程含义，不能由反向事实完整推出。",
          "This direction has an independent predicate and engineering meaning that cannot be fully inferred from the reverse fact.",
          "この方向は独立した述語と工学的意味を持ち、逆方向事実から完全には推論できません。",
        ),
      }
    : relation;
});

let sourceOutputs = [{ path: productEntry.path, value: productSource }];
for (const [moduleId, entry] of moduleEntryById) {
  sourceOutputs.push({
    path: entry.path,
    value: {
      source_kind: "agent-ontology-module",
      contract_version: entry.value.contract_version,
      module: updatedModules.find(({ id }) => id === moduleId),
      classes: concepts.filter(({ module_id: owner }) => owner === moduleId),
      relations: relations
        .filter((relation) => moduleIdByConcept.get(relation.source_id) === moduleId)
        .sort((left, right) => left.id.localeCompare(right.id)),
    },
  });
}
sourceOutputs = sourceOutputs.map((output) => ({
  ...output,
  value: normalizeControlledReleaseDates(
    compressSourceClaims(
      withDirectSourceLocators(withoutLegacySemanticBoilerplate(output.value)),
    ),
    productSource.product.date,
  ),
}));

for (const output of sourceOutputs) {
  const historicalErrors = historicalSourceErrors(output.value);
  if (historicalErrors.length > 0) {
    throw new Error(
      `Reviewed source failed frozen v1-to-v2 replay shape at ${relative(repositoryRoot, output.path)}: ${historicalErrors.join(", ")}`,
    );
  }
}

const modulePlaneById = new Map(updatedModules.map((module) => [module.id, module.plane_id]));
const hierarchyRows = legacy.classes.map((legacyConcept) => {
  const decision = decisionByConceptId.get(legacyConcept.id);
  const primaryId = primaryRelationId(legacyConcept.id, decision.primary_parent_id ?? null) ?? "";
  const additional = (decision.additional_parent_ids ?? []).map(
    (parentId) => `${legacyConcept.id}-is_a-${parentId}`,
  );
  return {
    concept_id: legacyConcept.id,
    current_plane_id: legacyConcept.plane_id,
    current_module_id: legacyConcept.module_id,
    current_kind: legacyConcept.kind,
    decision: decision.decision,
    proposed_kind: decision.semantic_kind ?? "",
    primary_parent_relation_id: primaryId,
    additional_parent_relation_ids: additional.length ? JSON.stringify(additional) : "",
    target_plane_id: modulePlaneById.get(decision.target_module_id) ?? "",
    target_module_id: decision.target_module_id,
    target_concept_id: decision.target_concept_id ?? "",
    convert_to_field_id:
      decision.decision === "convert_to_field"
        ? conceptLocalFieldId(decision.target_field_id ?? "")
        : "",
    convert_to_allowed_value_of:
      decision.decision === "convert_to_controlled_value"
        ? `${decision.target_concept_id}.${conceptLocalFieldId(decision.target_field_id)}`
        : "",
    merge_into_id: decision.decision === "merge" ? decision.target_concept_id ?? "" : "",
    replaced_by_id: decision.decision === "deprecate" ? decision.target_concept_id ?? "" : "",
    definition_action: removedDecisions.has(decision.decision)
      ? "migrate definition into reviewed target information"
      : "retain and clarify trilingual definition",
    example_action: removedDecisions.has(decision.decision)
      ? "explain disposition in target field or Concept"
      : "add positive and boundary examples",
    source_action: "convert legacy source IDs into direct reviewed source claims",
    required_new_relation_ids: JSON.stringify([primaryId, ...additional].filter(Boolean)),
    rationale: `${decision.rationale.zh} / ${decision.rationale.en}`,
    reviewer: decision.reviewer.reviewer_id,
    review_status: "accepted",
  };
});

const relationRows = legacy.relations.map((relation) => {
  const disposition = relationDisposition.get(relation.id);
  return {
    relation_id: relation.id,
    action: disposition.action,
    target_relation_id: disposition.target_relation_id,
    target_relation_ids: JSON.stringify(disposition.target_relation_ids ?? []),
    target_mapping_id: disposition.target_mapping_id ?? "",
    rationale:
      disposition.rationale?.en ??
      (disposition.action === "migrate_reviewed_relation"
        ? "Endpoint, direction, evidence, and non-placeholder semantics were accepted and enriched in the canonical relation contract."
        : "The relation was a generated placeholder, used a pseudo endpoint, duplicated taxonomy, or lost its subject after reviewed concept disposition."),
    reviewer: "codex-legacy-relation-reviewer",
    status: "accepted",
  };
});
const axiomRows = acceptedLegacyAxiomRows(
  readJson(resolve(repositoryRoot, "ontology/migration/legacy-v1/axioms.json")),
);
const staleDefinitionIds = new Set(
  readJson(resolve(repositoryRoot, "ontology/migration/legacy-v1/stale-definitions.json")).map(({ id }) => id),
);
const finalGraphIds = new Set([
  product.id,
  ...updatedPlanes.map(({ id }) => id),
  ...updatedModules.map(({ id }) => id),
  ...concepts.map(({ id }) => id),
  ...relations.map(({ id }) => id),
  ...productSource.global_constraints.map(({ id }) => id),
  ...productSource.hygiene_gates.map(({ id }) => id),
]);
const definitionRows = Object.values(definitionLedger.definitions).map((record) => ({
  definition_id: record.id,
  action: staleDefinitionIds.has(record.id)
    ? "remove_stale_generated_definition"
    : finalGraphIds.has(record.id)
      ? "merge_into_canonical_owner"
      : "retire_with_reviewed_legacy_disposition",
  target_id: finalGraphIds.has(record.id) ? record.id : "",
  rationale: staleDefinitionIds.has(record.id)
    ? "The definition referred to a generated relation record absent from the frozen canonical inventory."
    : finalGraphIds.has(record.id)
      ? "The trilingual definition is now stored once with its canonical node, relation, or root constraint."
      : "The owning legacy record was removed, merged, or converted during reviewed migration; no detached definition remains.",
  reviewer: "codex-definition-migration-reviewer",
  status: "accepted",
}));
const driftRows = readJson(
  resolve(repositoryRoot, "ontology/migration/legacy-v1/source-claim-drift.json"),
).map((record) => ({
  entity_id: record.id,
  decision: "retain canonical record source set and convert it into direct scoped claims",
  selected_source_ids: JSON.stringify(record.canonical_source_ids),
  rejected_source_ids: JSON.stringify(
    record.definition_source_ids.filter((id) => !record.canonical_source_ids.includes(id)),
  ),
  rationale:
    "The frozen canonical record was the published ownership source; definition-ledger-only IDs were not silently promoted to direct evidence.",
  reviewer: "codex-source-drift-reviewer",
  status: "accepted",
}));

const recordManifestPath = resolve(repositoryRoot, "ontology/migration/legacy-v1/record-manifest.json");
const recordManifestBytes = readFileSync(recordManifestPath);
if (sha256(recordManifestBytes) !== expectedRecordManifestHash) {
  throw new Error("The legacy record manifest changed from its independently reviewed SHA-256 anchor.");
}
const recordManifest = JSON.parse(recordManifestBytes.toString("utf8"));
const hierarchyById = new Map(hierarchyRows.map((row) => [row.concept_id, row]));
const relationByLegacyId = new Map(relationRows.map((row) => [row.relation_id, row]));
const fieldByLegacyId = new Map(dataPropertyResult.rows.map((row) => [row.data_property_id, row]));
const individualByLegacyId = new Map(individualResult.rows.map((row) => [row.individual_id, row]));
const axiomByLegacyId = new Map(axiomRows.map((row) => [row.axiom_id, row]));
const adapterByName = new Map(adapterMappingResult.rows.map((row) => [row.adapter, row]));
const dispositions = recordManifest.map((record) => {
  let action = "retain_canonical_owner";
  let targetRefs = [record.id];
  if (["classes", "terms"].includes(record.source_collection)) {
    const row = hierarchyById.get(record.id);
    action = row.decision;
    targetRefs = [
      row.merge_into_id ||
        row.replaced_by_id ||
        (row.convert_to_allowed_value_of ? row.convert_to_allowed_value_of : "") ||
        (row.convert_to_field_id ? `${row.target_concept_id}.${row.convert_to_field_id}` : "") ||
        (finalGraphIds.has(record.id) ? record.id : ""),
    ].filter(Boolean);
  } else if (["relations", "object_properties"].includes(record.source_collection)) {
    const row = relationByLegacyId.get(record.id);
    action = row.action;
    targetRefs = [
      row.target_relation_id,
      ...JSON.parse(row.target_relation_ids || "[]"),
      row.target_mapping_id,
    ].filter(Boolean);
    targetRefs = [...new Set(targetRefs)];
  } else if (record.source_collection === "data_properties") {
    const row = fieldByLegacyId.get(record.id);
    action = row.action;
    targetRefs = row.target_node_id ? [`${row.target_node_id}.${row.target_field_id}`] : [];
  } else if (record.source_collection === "individuals") {
    const row = individualByLegacyId.get(record.id);
    action = row.action;
    targetRefs = [
      row.target_node_id,
      row.target_node_id && row.target_field_id
        ? `${row.target_node_id}.${row.target_field_id}`
        : "",
      row.target_example_id,
    ].filter(Boolean);
  } else if (record.source_collection === "axioms") {
    const row = axiomByLegacyId.get(record.id);
    action = row.action;
    targetRefs = row.target_id ? [row.target_id] : [];
  } else if (record.source_collection === "adapter_mappings") {
    const row = adapterByName.get(record.id);
    action = row?.action ?? "attach_external_mapping_to_adapter_concept";
    targetRefs = row ? [row.target_node_id, row.target_mapping_id] : [];
  }
  return {
    source_collection: record.source_collection,
    id: record.id,
    original_json_pointer: record.original_json_pointer,
    payload_sha256: record.payload_sha256,
    action,
    target_refs: targetRefs,
    reviewer: "codex-migration-disposition-reviewer",
    status: "accepted",
  };
});
const dispositionKeys = new Set();
for (const disposition of dispositions) {
  const key = `${disposition.source_collection}\0${disposition.id}\0${disposition.original_json_pointer}`;
  if (dispositionKeys.has(key)) throw new Error(`Duplicate legacy disposition record ${key}`);
  dispositionKeys.add(key);
  const manifestRecord = recordManifest.find(
    (record) =>
      record.source_collection === disposition.source_collection &&
      record.id === disposition.id &&
      record.original_json_pointer === disposition.original_json_pointer,
  );
  if (!manifestRecord || manifestRecord.payload_sha256 !== disposition.payload_sha256) {
    throw new Error(`Disposition payload hash drifted for ${key}`);
  }
  const pointerParts = disposition.original_json_pointer
    .split("/")
    .slice(1)
    .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
  const [collection, indexText] = pointerParts;
  const frozenRecord = legacy[collection]?.[Number(indexText)];
  if (
    collection !== disposition.source_collection ||
    frozenRecord === undefined ||
    sha256(Buffer.from(JSON.stringify(frozenRecord), "utf8")) !== disposition.payload_sha256
  ) {
    throw new Error(`Disposition does not match the frozen record payload for ${key}`);
  }
}
const nestedTargetRefs = new Set([
  ...concepts.flatMap((concept) => [
    ...concept.structure.fields.map((field) => `${concept.id}.${field.id}`),
    ...concept.examples.map((example) => example.id),
    ...concept.external_mappings.map((mapping) => mapping.id),
  ]),
  ...updatedModules.flatMap((module) => module.examples.map((example) => example.id)),
  ...updatedPlanes.flatMap((plane) => plane.examples.map((example) => example.id)),
  ...relations.flatMap((relation) => relation.examples.map((example) => example.id)),
  ...productEntry.value.product.examples.map((example) => example.id),
]);
const resolvableTargetRefs = new Set([...finalGraphIds, ...nestedTargetRefs]);
for (const disposition of dispositions) {
  const unresolved = disposition.target_refs.filter((targetRef) => !resolvableTargetRefs.has(targetRef));
  if (unresolved.length > 0) {
    throw new Error(
      `Disposition ${disposition.source_collection}/${disposition.id} has unresolved targets: ${unresolved.join(", ")}`,
    );
  }
  if (
    disposition.target_refs.length === 0 &&
    !/(?:remove|retire)/u.test(disposition.action)
  ) {
    throw new Error(
      `Disposition ${disposition.source_collection}/${disposition.id} action ${disposition.action} requires a target`,
    );
  }
}
if (
  dispositions.length !== 2881 ||
  dispositionKeys.size !== recordManifest.length ||
  dispositions.some(({ status }) => status !== "accepted")
) {
  throw new Error("The reviewed disposition manifest must accept all 2,881 legacy records");
}

const migrationWrites = new Map(
  sourceOutputs.map((output) => [output.path, stableJson(output.value)]),
);
const writeResearchCsv = (name, columns, rows) => {
  const path = resolve(repositoryRoot, `research/${name}`);
  migrationWrites.set(path, stringifyCsv(columns, rows));
};
writeResearchCsv(
  "ontology-concept-hierarchy-migration-ledger.csv",
  [
    "concept_id",
    "current_plane_id",
    "current_module_id",
    "current_kind",
    "decision",
    "proposed_kind",
    "primary_parent_relation_id",
    "additional_parent_relation_ids",
    "target_plane_id",
    "target_module_id",
    "target_concept_id",
    "convert_to_field_id",
    "convert_to_allowed_value_of",
    "merge_into_id",
    "replaced_by_id",
    "definition_action",
    "example_action",
    "source_action",
    "required_new_relation_ids",
    "rationale",
    "reviewer",
    "review_status",
  ],
  hierarchyRows,
);
writeResearchCsv(
  "ontology-individual-migration-ledger.csv",
  [
    "individual_id",
    "current_class_id",
    "classification",
    "target_node_id",
    "target_field_id",
    "target_example_id",
    "action",
    "rationale",
    "reviewer",
    "status",
  ],
  individualResult.rows,
);
writeResearchCsv(
  "ontology-data-property-migration-ledger.csv",
  ["data_property_id", "action", "target_node_id", "target_field_id", "rationale", "reviewer", "status"],
  dataPropertyResult.rows,
);
writeResearchCsv(
  "ontology-axiom-migration-ledger.csv",
  ["axiom_id", "action", "target_id", "rationale", "reviewer", "status"],
  axiomRows,
);
writeResearchCsv(
  "ontology-relation-migration-ledger.csv",
  [
    "relation_id",
    "action",
    "target_relation_id",
    "target_relation_ids",
    "target_mapping_id",
    "rationale",
    "reviewer",
    "status",
  ],
  relationRows,
);
writeResearchCsv(
  "ontology-adapter-mapping-migration-ledger.csv",
  ["adapter", "action", "target_node_id", "target_mapping_id", "rationale", "reviewer", "status"],
  adapterMappingResult.rows,
);
writeResearchCsv(
  "ontology-definition-migration-ledger.csv",
  ["definition_id", "action", "target_id", "rationale", "reviewer", "status"],
  definitionRows,
);
writeResearchCsv(
  "ontology-source-claim-drift-resolution-ledger.csv",
  ["entity_id", "decision", "selected_source_ids", "rejected_source_ids", "rationale", "reviewer", "status"],
  driftRows,
);
const dispositionPath = resolve(repositoryRoot, "ontology/migration/legacy-v1/disposition-manifest.json");
migrationWrites.set(
  dispositionPath,
  stableJson({
    generated: true,
    do_not_edit: true,
    baseline_sha256: expectedLegacyHash,
    reviewed_on: "2026-07-13",
    counts: {
      records: dispositions.length,
      accepted: dispositions.filter(({ status }) => status === "accepted").length,
    },
    records: dispositions,
  }),
);
if (checkOnly) {
  const invalidReplayTargets = [];
  for (const [path, expected] of migrationWrites) {
    const repositoryRelativePath = relative(repositoryRoot, path).replaceAll("\\", "/");
    if (repositoryRelativePath.startsWith("../") || !Buffer.byteLength(expected)) {
      invalidReplayTargets.push(repositoryRelativePath);
    }
  }
  if (invalidReplayTargets.length > 0) {
    throw new Error(
      `Historical replay produced invalid or out-of-repository targets: ${invalidReplayTargets.join(", ")}`,
    );
  }
} else if (legacyReplay) {
  writeFileTransaction(migrationWrites);
}

console.log(
  JSON.stringify(
    {
      decisions: conceptDecisions.length,
      anchors: anchors.length,
      canonical_concepts: concepts.length,
      canonical_relations: relations.length,
      legacy_records_disposed: dispositions.length,
      mode: checkOnly ? "historical-replay-check" : "explicit-legacy-replay",
    },
    null,
    2,
  ),
);

};
