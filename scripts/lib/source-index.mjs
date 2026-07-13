import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseCsv } from "./csv.mjs";
import { sha256 } from "./stable-json.mjs";

const GENERATED_FROM = [
  "ontology/source/agent-ontology.product.json",
  "research/living-source-metadata.csv",
  "research/source-registry.csv",
];

export const buildSourceIndexData = (
  repositoryRoot,
  { generatedAt, generatorVersion } = {},
) => {
  if (!generatedAt || !generatorVersion) {
    throw new Error("Source-index generation requires deterministic generatedAt and generatorVersion metadata");
  }
  const registryPath = resolve(repositoryRoot, "research/source-registry.csv");
  const livingPath = resolve(repositoryRoot, "research/living-source-metadata.csv");
  const productPath = resolve(
    repositoryRoot,
    "ontology/source/agent-ontology.product.json",
  );
  const registryBytes = readFileSync(registryPath);
  const livingBytes = readFileSync(livingPath);
  const productBytes = readFileSync(productPath);
  const registryRows = parseCsv(registryBytes);
  const livingRows = parseCsv(livingBytes);
  const livingById = new Map(livingRows.map((row) => [row.id, row]));

  const sources = registryRows
    .map((row) => {
      const living = livingById.get(row.id);
      return {
        id: row.id,
        corpus: row.corpus,
        area: row.area,
        title: row.title,
        url: row.url,
        year: row.year,
        source_type: row.source_type,
        priority: row.priority,
        status: row.status,
        why_it_matters: row.why_it_matters,
        source_file: row.source_file,
        living: living
          ? {
              normalized_class: living.normalized_class,
              normalized_version_or_date: living.normalized_version_or_date,
              last_checked: living.last_checked,
              normalization_status: living.normalization_status,
              note: living.note,
            }
          : null,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    generated: true,
    do_not_edit: true,
    generated_from: GENERATED_FROM,
    generator_version: generatorVersion,
    generated_at: generatedAt,
    registry_fingerprint: sha256(registryBytes),
    living_fingerprint: sha256(livingBytes),
    product_fingerprint: sha256(productBytes),
    generation_time_basis: {
      source: "ontology/source/agent-ontology.product.json",
      field: "product.date",
      override: "SOURCE_DATE_EPOCH",
    },
    sources,
  };
};
