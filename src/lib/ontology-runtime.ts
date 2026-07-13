import {
  buildOntologyIndex,
  type CanonicalOntology,
  type OntologyIndex,
  type OntologySourceIndexDocument,
} from "./ontology-index";

export interface OntologyRuntime {
  readonly ontology: CanonicalOntology;
  readonly sourceIndex: OntologySourceIndexDocument;
  readonly index: OntologyIndex;
  readonly semanticRelationCount: number;
}

const ROOT_ARRAY_FIELDS = [
  "includes",
  "excludes",
  "examples",
  "source_claims",
  "planes",
  "modules",
  "classes",
  "relations",
  "global_constraints",
  "case_paths",
  "hygiene_gates",
] as const;

const ONTOLOGY_METRIC_FIELDS = [
  "domains",
  "modules",
  "concepts",
  "taxonomy_roots",
  "is_a_relations",
  "semantic_relations",
  "instance_examples",
  "controlled_values",
  "structure_fields",
  "constraints",
  "source_claims",
  "case_paths",
  "legacy_individuals_remaining",
  "legacy_data_properties_remaining",
  "legacy_axioms_remaining",
] as const;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isLocalizedText = (value: unknown): boolean =>
  isRecord(value) && ["zh", "en", "ja"].every((language) =>
    isNonEmptyString(value[language]),
  );

const isRootReview = (value: unknown): boolean =>
  isRecord(value) &&
  (value.review_status === "draft" || value.review_status === "accepted") &&
  Array.isArray(value.reviewers);

const isOntologyMetrics = (value: unknown): boolean =>
  isRecord(value) && ONTOLOGY_METRIC_FIELDS.every((field) => {
    const metric = value[field];
    return Number.isInteger(metric) && (metric as number) >= 0;
  });

const isArtifactMetadata = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  if (
    value.artifact_kind !== "canonical-agent-ontology" ||
    value.contract_version !== "1.0.0" ||
    !isNonEmptyString(value.canonical_version) ||
    value.generated !== true ||
    value.do_not_edit !== true ||
    !isNonEmptyString(value.generator_version) ||
    !isNonEmptyString(value.generated_at) ||
    !Number.isFinite(Date.parse(value.generated_at)) ||
    typeof value.source_tree_sha256 !== "string" ||
    !/^[a-f0-9]{64}$/u.test(value.source_tree_sha256)
  ) {
    return false;
  }

  if (
    !Array.isArray(value.generated_from) ||
    value.generated_from.length === 0 ||
    !value.generated_from.every(isNonEmptyString) ||
    new Set(value.generated_from).size !== value.generated_from.length
  ) {
    return false;
  }

  return value.release_channel === "release"
    ? value.releasable === true
    : value.release_channel === "candidate" && value.releasable === false;
};

const isCanonicalOntology = (value: unknown): value is CanonicalOntology => {
  if (!isRecord(value)) return false;
  const candidate = value;
  return (
    isNonEmptyString(candidate.id) &&
    isLocalizedText(candidate.labels) &&
    isLocalizedText(candidate.short_definitions) &&
    isLocalizedText(candidate.definitions) &&
    isLocalizedText(candidate.why_needed) &&
    (candidate.status === "draft-hierarchy-upgrade" ||
      candidate.status === "review" ||
      candidate.status === "accepted") &&
    isRootReview(candidate.review) &&
    typeof candidate.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/u.test(candidate.date) &&
    ROOT_ARRAY_FIELDS.every((name) => Array.isArray(candidate[name])) &&
    isOntologyMetrics(candidate.ontology_metrics) &&
    isArtifactMetadata(candidate.artifact_metadata)
  );
};

const isSourceIndex = (value: unknown): value is OntologySourceIndexDocument => {
  if (!isRecord(value)) return false;
  const candidate = value;
  return (
    typeof candidate.registry_fingerprint === "string" &&
    Array.isArray(candidate.sources)
  );
};

export const createOntologyRuntime = (
  ontologyValue: unknown,
  sourceIndexValue: unknown,
): OntologyRuntime => {
  if (!isCanonicalOntology(ontologyValue)) {
    throw new Error("Canonical ontology is malformed");
  }
  if (!isSourceIndex(sourceIndexValue)) {
    throw new Error("Generated source index is malformed");
  }

  return {
    ontology: ontologyValue,
    sourceIndex: sourceIndexValue,
    index: buildOntologyIndex(ontologyValue, sourceIndexValue),
    semanticRelationCount: ontologyValue.relations.reduce(
      (count, relation) => count + (relation.predicate === "is_a" ? 0 : 1),
      0,
    ),
  };
};

export const ontologyMetricValue = (
  runtime: OntologyRuntime,
  name: keyof NonNullable<CanonicalOntology["ontology_metrics"]>,
  fallback: number,
): number => runtime.ontology.ontology_metrics?.[name] ?? fallback;
