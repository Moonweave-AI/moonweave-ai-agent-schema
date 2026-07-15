import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { sha256 } from "./stable-json.mjs";

export const frozenV2SemanticBaselinePath = resolve(
  import.meta.dirname,
  "../data/ontology-v2-semantic-baseline.ndjson",
);

export const frozenV2SemanticBaselineSha256 =
  "5084b713f4eb69da445e2741af4696126ca196a05b56ea8e6fcb5b8120d5db33";

const fail = (message) => {
  throw new Error(`Frozen v2 semantic baseline is invalid: ${message}`);
};

const uniqueMap = (records, label) => {
  const result = new Map();
  for (const record of records) {
    if (!record.id || result.has(record.id)) {
      fail(`${label} records must have unique non-empty IDs; repeated ${record.id ?? ""}`);
    }
    result.set(record.id, record);
  }
  return result;
};

export const loadFrozenV2SemanticBaseline = () => {
  const bytes = readFileSync(frozenV2SemanticBaselinePath);
  const actualSha256 = sha256(bytes);
  if (actualSha256 !== frozenV2SemanticBaselineSha256) {
    fail(
      `SHA-256 changed; expected ${frozenV2SemanticBaselineSha256}, found ${actualSha256}`,
    );
  }

  const records = bytes
    .toString("utf8")
    .trim()
    .split(/\r?\n/u)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        fail(`line ${index + 1} is not valid JSON (${error.message})`);
      }
    });
  const [metadata, ...body] = records;
  if (
    metadata?.record_type !== "metadata" ||
    metadata.format !== "moonweave-frozen-v2-semantic-baseline@1" ||
    metadata.do_not_edit !== true
  ) {
    fail("the metadata record or immutable format marker is missing");
  }
  if (body.at(-1)?.record_type !== "end") fail("the terminal record is missing");

  const unexpected = body.filter(
    ({ record_type: recordType }) =>
      !["module", "concept", "end"].includes(recordType),
  );
  if (unexpected.length > 0) fail(`unexpected record type ${unexpected[0].record_type}`);
  if (body.filter(({ record_type: recordType }) => recordType === "end").length !== 1) {
    fail("the terminal record must occur exactly once");
  }

  const modules = uniqueMap(
    body.filter(({ record_type: recordType }) => recordType === "module"),
    "Module",
  );
  const conceptRecords = body.filter(
    ({ record_type: recordType }) => recordType === "concept",
  );
  const conceptRecordById = uniqueMap(conceptRecords, "Concept");
  if (
    modules.size !== metadata.module_count ||
    conceptRecordById.size !== metadata.concept_count
  ) {
    fail(
      `record counts changed; expected ${metadata.module_count}/${metadata.concept_count}, found ${modules.size}/${conceptRecordById.size}`,
    );
  }

  const modulePlane = new Map(
    [...modules.values()].map(({ id, plane_id: planeId }) => [id, planeId]),
  );
  const concepts = new Map(
    conceptRecords.map((record) => [
      record.id,
      Object.freeze({
        id: record.id,
        module_id: record.module_id,
        labels: Object.freeze({ zh: record.label_zh }),
        semantic_kind: record.semantic_kind,
        primary_parent_relation_id: record.primary_parent_relation_id || null,
      }),
    ]),
  );
  const depths = new Map(
    conceptRecords.map(({ id, depth }) => {
      if (!Number.isInteger(depth) || depth < 0) fail(`Concept ${id} has invalid depth`);
      return [id, depth];
    }),
  );
  for (const concept of concepts.values()) {
    if (!modulePlane.has(concept.module_id)) {
      fail(`Concept ${concept.id} references unknown Module ${concept.module_id}`);
    }
  }

  return Object.freeze({
    path: frozenV2SemanticBaselinePath,
    bytes,
    sha256: actualSha256,
    metadata: Object.freeze(metadata),
    concepts,
    modulePlane,
    depths,
    relationCount: metadata.relation_count,
    rootCount: metadata.root_count,
    maxDepth: metadata.max_depth,
  });
};
