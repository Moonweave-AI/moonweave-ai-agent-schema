import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const COLLECTIONS = [
  "planes",
  "modules",
  "terms",
  "classes",
  "relations",
  "object_properties",
  "data_properties",
  "individuals",
  "axioms",
  "adapter_mappings",
];

const DEFINITION_COLLECTIONS = [
  "planes",
  "modules",
  "terms",
  "relations",
  "data_properties",
  "individuals",
  "axioms",
];

const BASELINE_ARTIFACTS = [
  "ontology/agent-ontology.json",
  "ontology/agent-ontology-definitions.json",
  "ontology/agent-ontology.md",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const payloadSha256 = (value) => sha256(Buffer.from(JSON.stringify(value), "utf8"));
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const escapePointer = (value) => value.replaceAll("~", "~0").replaceAll("/", "~1");

const parseArguments = () => {
  const result = { legacyRoot: null, outputRoot: null };
  for (let index = 2; index < process.argv.length; index += 1) {
    const argument = process.argv[index];
    if (argument === "--legacy-root") result.legacyRoot = process.argv[++index];
    else if (argument === "--output-root") result.outputRoot = process.argv[++index];
    else throw new Error(`Unknown bootstrap argument: ${argument}`);
  }
  if (!result.legacyRoot || !result.outputRoot) {
    throw new Error(
      "Usage: node scripts/bootstrap-legacy-ontology.mjs --legacy-root <path> --output-root <path>",
    );
  }
  return {
    legacyRoot: resolve(result.legacyRoot),
    outputRoot: resolve(result.outputRoot),
  };
};

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const recordId = (collection, record) => {
  const id = collection === "adapter_mappings" ? record.adapter : record.id;
  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Legacy ${collection} record is missing its stable identifier`);
  }
  return id;
};

const recordEvidence = (collection, record, index) => ({
  source_collection: collection,
  id: recordId(collection, record),
  original_json_pointer: `/${collection}/${index}`,
  payload_sha256: payloadSha256(record),
});

const normalizedSources = (sourceIds) =>
  Array.isArray(sourceIds)
    ? [...new Set(sourceIds.filter((item) => typeof item === "string"))].sort()
    : [];

const sameStringArray = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const writeJson = (directory, filename, value) => {
  writeFileSync(resolve(directory, filename), stableJson(value), "utf8");
};

const { legacyRoot, outputRoot } = parseArguments();
const canonicalPath = resolve(legacyRoot, "ontology/agent-ontology.json");
const definitionPath = resolve(legacyRoot, "ontology/agent-ontology-definitions.json");
const canonical = readJson(canonicalPath);
const definitionLedger = readJson(definitionPath);

for (const collection of COLLECTIONS) {
  if (!Array.isArray(canonical[collection])) {
    throw new Error(`Frozen canonical is missing legacy collection ${collection}`);
  }
}

const records = COLLECTIONS.flatMap((collection) =>
  canonical[collection].map((record, index) => recordEvidence(collection, record, index)),
);
const evidenceByCollectionAndId = new Map(
  records.map((record) => [`${record.source_collection}\u0000${record.id}`, record]),
);

const dedupGroups = [
  ...canonical.terms.map((record) => ({
    canonical_target_id: record.id,
    canonical_kind: "concept",
    source_records: [
      evidenceByCollectionAndId.get(`terms\u0000${record.id}`),
      evidenceByCollectionAndId.get(`classes\u0000${record.id}`),
    ],
  })),
  ...canonical.relations.map((record) => ({
    canonical_target_id: record.id,
    canonical_kind: "relation",
    source_records: [
      evidenceByCollectionAndId.get(`relations\u0000${record.id}`),
      evidenceByCollectionAndId.get(`object_properties\u0000${record.id}`),
    ],
  })),
];

for (const group of dedupGroups) {
  if (group.source_records.some((record) => record === undefined)) {
    throw new Error(`Incomplete duplicate group for ${group.canonical_target_id}`);
  }
}

const definedIds = new Set(
  DEFINITION_COLLECTIONS.flatMap((collection) =>
    canonical[collection].map((record) => recordId(collection, record)),
  ),
);
const staleDefinitions = Object.entries(definitionLedger.definitions)
  .filter(([id]) => id !== "agent-system-ontology" && !definedIds.has(id))
  .map(([id, record]) => ({
    source_collection: "definition_ledger",
    id,
    original_json_pointer: `/definitions/${escapePointer(id)}`,
    payload_sha256: payloadSha256(record),
  }));

const sourceSetDrifts = DEFINITION_COLLECTIONS.flatMap((collection) =>
  canonical[collection].flatMap((record, index) => {
    const canonicalSourceIds = normalizedSources(record.source_ids);
    const definitionSourceIds = normalizedSources(definitionLedger.definitions[record.id]?.source_ids);
    return sameStringArray(canonicalSourceIds, definitionSourceIds)
      ? []
      : [
          {
            id: record.id,
            canonical_collection: collection,
            canonical_json_pointer: `/${collection}/${index}/source_ids`,
            definition_json_pointer: `/definitions/${escapePointer(record.id)}/source_ids`,
            canonical_source_ids: canonicalSourceIds,
            definition_source_ids: definitionSourceIds,
          },
        ];
  }),
);

const memberships = new Map();
canonical.modules.forEach((module, moduleIndex) => {
  module.class_ids.forEach((conceptId, classIndex) => {
    const entries = memberships.get(conceptId) ?? [];
    entries.push({
      module_id: module.id,
      pointer: `/modules/${moduleIndex}/class_ids/${classIndex}`,
    });
    memberships.set(conceptId, entries);
  });
});

const termIndexes = new Map(canonical.terms.map((record, index) => [record.id, index]));
const classIndexes = new Map(canonical.classes.map((record, index) => [record.id, index]));
const ownershipConflicts = canonical.classes.flatMap((concept, classIndex) => {
  const entries = memberships.get(concept.id) ?? [];
  const membershipModuleIds = [...new Set(entries.map((entry) => entry.module_id))].sort();
  const conflicts =
    membershipModuleIds.length !== 1 || !membershipModuleIds.includes(concept.module_id);
  if (!conflicts) return [];

  const evidencePointers = [
    `/classes/${classIndex}/module_id`,
    ...entries.map((entry) => entry.pointer),
  ];
  const termIndex = termIndexes.get(concept.id);
  if (termIndex !== undefined) evidencePointers.unshift(`/terms/${termIndex}/module_id`);

  return [
    {
      concept_id: concept.id,
      declared_module_id: concept.module_id,
      membership_module_ids: membershipModuleIds,
      evidence_json_pointers: evidencePointers,
    },
  ];
});

const baseline = {
  artifacts: BASELINE_ARTIFACTS.map((path) => ({
    path,
    sha256: sha256(readFileSync(resolve(legacyRoot, path))),
  })),
  collections: Object.fromEntries(
    COLLECTIONS.map((collection) => [
      collection,
      {
        count: canonical[collection].length,
        ids: canonical[collection].map((record) => recordId(collection, record)),
      },
    ]),
  ),
};

const outputDirectory = resolve(outputRoot, "ontology/migration/legacy-v1");
mkdirSync(outputDirectory, { recursive: true });

const bootstrapManifest = {
  manifest_version: "1.0.0",
  baseline,
  records,
  dedup_groups: dedupGroups,
  stale_definitions: staleDefinitions,
  source_set_drifts: sourceSetDrifts,
  ownership_conflicts: ownershipConflicts,
};

writeJson(outputDirectory, "bootstrap-manifest.json", bootstrapManifest);
writeJson(outputDirectory, "baseline-manifest.json", baseline);
writeJson(
  outputDirectory,
  "record-manifest.json",
  records.map((record) => ({
    ...record,
    action: "pending-review",
    target_refs: [],
    rationale: "Lossless bootstrap only; no semantic disposition has been inferred.",
    reviewer: null,
    status: "draft",
  })),
);
writeJson(
  outputDirectory,
  "dedup-decisions.json",
  dedupGroups.map((group) => ({
    ...group,
    action: "deduplicate-exact-legacy-copy",
    rationale: "The two frozen collections contain byte-equivalent JSON payloads for this ID.",
    reviewer: null,
    status: "draft",
  })),
);
writeJson(outputDirectory, "relation-records.json", canonical.relations);
writeJson(outputDirectory, "data-properties.json", canonical.data_properties);
writeJson(outputDirectory, "individuals.json", canonical.individuals);
writeJson(outputDirectory, "axioms.json", canonical.axioms);
writeJson(outputDirectory, "adapter-mappings.json", canonical.adapter_mappings);
writeJson(outputDirectory, "stale-definitions.json", staleDefinitions);
writeJson(outputDirectory, "source-claim-drift.json", sourceSetDrifts);
writeJson(outputDirectory, "ownership-conflicts.json", ownershipConflicts);
