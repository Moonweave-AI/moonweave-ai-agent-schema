import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { assertPublishedContentSecurity } from "./ontology-security-gates.mjs";
import { sha256, sourceTreeFingerprint } from "./stable-json.mjs";
import { loadFrozenV2SemanticBaseline } from "./ontology-v2-semantic-baseline.mjs";
import {
  loadReleaseEvidence,
  ontologyReleaseEvidencePaths,
  validateConceptLedgerMirrorsSources,
  validateReleaseEvidenceMirrorsSources,
  validateReleaseObjectEvidence,
} from "./ontology-release-evidence-validation.mjs";
import {
  computeOntologyMetrics,
  finalizeCanonicalWithMetrics,
  findHierarchyCycle,
  validateSemanticDepthContracts,
} from "./ontology-semantic-depth-validation.mjs";
import {
  validateAcceptedReferenceTargets,
  validateReferencesAndInformation,
} from "./ontology-reference-validation.mjs";
import {
  OntologyBuildValidationError,
  ontologyValidationErrorCodes,
  validationError,
} from "./ontology-validation-error.mjs";

export {
  computeOntologyMetrics,
  loadReleaseEvidence,
  OntologyBuildValidationError,
  ontologyReleaseEvidencePaths,
  ontologyValidationErrorCodes,
  validateAcceptedReferenceTargets,
  validateConceptLedgerMirrorsSources,
};

const normalizePath = (value) => value.replaceAll("\\", "/");

const listJsonFiles = (root) =>
  readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory() ? listJsonFiles(path) : entry.name.endsWith(".json") ? [path] : [];
    })
    .sort((left, right) => left.localeCompare(right));

const formatAjvErrors = (errors) =>
  (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");


export const loadAndValidateSources = ({
  sourceRoot,
  artifactContractPath,
  releaseEvidence = loadReleaseEvidence({
    repositoryRoot: resolve(sourceRoot, "../.."),
  }),
  semanticBaseline = loadFrozenV2SemanticBaseline(),
}) => {
  const contractBytes = readFileSync(artifactContractPath);
  const contract = JSON.parse(contractBytes.toString("utf8"));
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    strictTypes: false,
  });
  addFormats(ajv);
  ajv.addKeyword({ keyword: "contract_version", schemaType: "string", valid: true });
  ajv.addKeyword({ keyword: "supported_canonical_major", schemaType: "number", valid: true });
  const validateSource = ajv.compile(contract);
  const files = listJsonFiles(sourceRoot);
  if (files.length === 0) {
    throw validationError(
      ontologyValidationErrorCodes.sourceContractInvalid,
      `No ontology source JSON files found under ${sourceRoot}`,
    );
  }

  const entries = files.map((path) => {
    const bytes = readFileSync(path);
    let data;
    try {
      data = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw validationError(
        ontologyValidationErrorCodes.sourceContractInvalid,
        `Invalid JSON in ${path}: ${error.message}`,
      );
    }
    if (!validateSource(data)) {
      const entityId = data?.module?.id ?? data?.product?.id ?? "unknown-entity";
      throw validationError(
        ontologyValidationErrorCodes.sourceContractInvalid,
        `Source contract rejected entity ${entityId} in ${normalizePath(relative(sourceRoot, path))}: ${formatAjvErrors(validateSource.errors)}`,
      );
    }
    assertPublishedContentSecurity({
      documents: [{ label: normalizePath(relative(sourceRoot, path)), value: data }],
      uiFiles: [],
    });
    return {
      path,
      relativePath: normalizePath(relative(sourceRoot, path)),
      bytes,
      data,
    };
  });

  const productEntries = entries.filter(
    ({ data }) => data.source_kind === "agent-ontology-product",
  );
  const moduleEntries = entries.filter(
    ({ data }) => data.source_kind === "agent-ontology-module",
  );
  if (productEntries.length !== 1) {
    throw new Error(`Expected exactly one product source; found ${productEntries.length}`);
  }
  if (moduleEntries.length === 0) throw new Error("Expected at least one Module source");
  if (productEntries.length + moduleEntries.length !== entries.length) {
    throw new Error("Every source file must be an agent-ontology-product or agent-ontology-module source");
  }

  const contractVersion = contract.contract_version;
  for (const entry of entries) {
    if (entry.data.contract_version !== contractVersion) {
      throw new Error(
        `Contract version mismatch in ${entry.relativePath}: expected ${contractVersion}, received ${entry.data.contract_version}`,
      );
    }
  }

  const fingerprintEntries = [
    ...entries.map(({ relativePath, bytes }) => [
      `ontology/source/${relativePath}`,
      bytes,
    ]),
    ...releaseEvidence.entries.map(({ relativePath, bytes }) => [relativePath, bytes]),
    ...(releaseEvidence.entries.length > 0
      ? [["scripts/data/ontology-v2-semantic-baseline.ndjson", semanticBaseline.bytes]]
      : []),
  ];
  return {
    contract,
    contractFingerprint: sha256(contractBytes),
    productEntry: productEntries[0],
    moduleEntries,
    releaseEvidence,
    semanticBaseline,
    sourceFingerprint: sourceTreeFingerprint(fingerprintEntries),
    generatedFrom: fingerprintEntries.map(([relativePath]) => relativePath),
  };
};

const duplicateIds = (records) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const { id } of records) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].sort();
};

const stableFactPart = (value) => JSON.stringify(value ?? null);
const normalizedFactKey = (relation) =>
  [
    relation.source_id,
    relation.predicate,
    relation.target_id,
    stableFactPart(relation.conditions ?? []),
    relation.temporal_scope ?? null,
    stableFactPart(relation.boundary_context ?? null),
  ].join("\u0000");

const isDeprecatedLineageAliasOf = (alias, accepted) =>
  alias.status === "deprecated" &&
  accepted.status === "accepted" &&
  Array.isArray(alias.replaced_by_ids) &&
  alias.replaced_by_ids.includes(accepted.id) &&
  Array.isArray(alias.examples) &&
  alias.examples.length === 0;


export const mergeAndValidateCanonical = ({
  productEntry,
  moduleEntries,
  releaseEvidence = { entries: [], rowsByPath: new Map() },
  semanticBaseline = loadFrozenV2SemanticBaseline(),
  contractVersion,
  sourceFingerprint,
  generatedFrom,
  sourceIndex,
  generatorVersion,
  generatedAt,
  releaseChannel = "candidate",
}) => {
  const productSource = productEntry.data;
  const product = productSource.product;
  const planeOrder = new Map(productSource.planes.map(({ id }, index) => [id, index]));
  const sortedModuleEntries = [...moduleEntries].sort((left, right) => {
    const leftPlane = planeOrder.get(left.data.module.plane_id) ?? Number.MAX_SAFE_INTEGER;
    const rightPlane = planeOrder.get(right.data.module.plane_id) ?? Number.MAX_SAFE_INTEGER;
    return leftPlane - rightPlane || left.data.module.id.localeCompare(right.data.module.id);
  });
  const modules = sortedModuleEntries.map(({ data }) => structuredClone(data.module));
  const classes = sortedModuleEntries.flatMap(({ data }) => structuredClone(data.classes));
  const relations = sortedModuleEntries.flatMap(({ data }) => structuredClone(data.relations));
  const planes = structuredClone(productSource.planes);

  for (const [label, records] of [
    ["Plane", planes],
    ["Module", modules],
    ["Concept", classes],
    ["Relation", relations],
  ]) {
    const duplicates = duplicateIds(records);
    if (duplicates.length > 0) throw new Error(`${label} IDs are not unique: ${duplicates.join(", ")}`);
  }
  const allNodeRecords = [
    { id: product.id },
    ...planes,
    ...modules,
    ...classes,
  ];
  const crossKindDuplicates = duplicateIds(allNodeRecords);
  if (crossKindDuplicates.length > 0) {
    throw new Error(`Canonical node IDs collide across kinds: ${crossKindDuplicates.join(", ")}`);
  }

  const planeIds = new Set(planes.map(({ id }) => id));
  const moduleIds = new Set(modules.map(({ id }) => id));
  const conceptIds = new Set(classes.map(({ id }) => id));
  const moduleById = new Map(modules.map((record) => [record.id, record]));
  const conceptById = new Map(classes.map((record) => [record.id, record]));
  const relationById = new Map(relations.map((record) => [record.id, record]));
  const sourceFileByModule = new Map(
    sortedModuleEntries.map((entry) => [entry.data.module.id, entry]),
  );
  const sourceLocationByConcept = new Map(
    sortedModuleEntries.flatMap((entry) =>
      entry.data.classes.map((concept, index) => [
        concept.id,
        `${entry.relativePath}#/classes/${index}`,
      ]),
    ),
  );
  const sourceLocationByRelation = new Map(
    sortedModuleEntries.flatMap((entry) =>
      entry.data.relations.map((relation, index) => [
        relation.id,
        `${entry.relativePath}#/relations/${index}`,
      ]),
    ),
  );

  validateReleaseEvidenceMirrorsSources({
    releaseEvidence,
    modules,
    classes,
    relations,
    semanticBaseline,
    releaseChannel,
  });

  for (const module of modules) {
    if (!planeIds.has(module.plane_id)) {
      throw new Error(`Module ${module.id} ownership references unknown Plane ${module.plane_id}`);
    }
  }
  for (const entry of sortedModuleEntries) {
    for (const concept of entry.data.classes) {
      if (concept.module_id !== entry.data.module.id) {
        throw new Error(
          `Concept ${concept.id} Module ownership ${concept.module_id} conflicts with source-file owner ${entry.data.module.id}`,
        );
      }
      if (!moduleIds.has(concept.module_id)) {
        throw new Error(`Concept ${concept.id} references unknown Module ${concept.module_id}`);
      }
    }
    for (const relation of entry.data.relations) {
      const sourceConcept = conceptById.get(relation.source_id);
      if (sourceConcept && sourceConcept.module_id !== entry.data.module.id) {
        throw new Error(
          `Relation ${relation.id} owner must be source Concept module ${sourceConcept.module_id}, not ${entry.data.module.id}`,
        );
      }
    }
  }

  const facts = new Map();
  for (const relation of relations) {
    if (!conceptIds.has(relation.source_id) || !conceptIds.has(relation.target_id)) {
      throw new Error(
        `Relation ${relation.id} has unresolved Concept endpoint ${relation.source_id} -> ${relation.target_id}`,
      );
    }
    if (relation.predicate === "is_a" && relation.relation_kind !== "hierarchy") {
      throw new Error(`is_a relation ${relation.id} must use relation_kind=hierarchy`);
    }
    const sourcePlaneId = moduleById.get(conceptById.get(relation.source_id).module_id).plane_id;
    const targetPlaneId = moduleById.get(conceptById.get(relation.target_id).module_id).plane_id;
    if (
      relation.relation_kind !== "hierarchy" &&
      sourcePlaneId !== targetPlaneId &&
      relation.boundary_context == null
    ) {
      throw new Error(
        `Cross-Domain relation ${relation.id} is missing boundary_context (${sourcePlaneId} -> ${targetPlaneId})`,
      );
    }
    const factKey = normalizedFactKey(relation);
    const prior = facts.get(factKey);
    const isReviewedLineageAlias = prior && (
      isDeprecatedLineageAliasOf(prior, relation) ||
      isDeprecatedLineageAliasOf(relation, prior)
    );
    if (prior && !isReviewedLineageAlias) {
      throw new Error(`Duplicate normalized fact under relation IDs ${prior.id} and ${relation.id}`);
    }
    facts.set(
      factKey,
      prior?.status === "accepted" ? prior : relation,
    );

    for (const side of ["source", "target"]) {
      const bound = relation.cardinality?.[side];
      if (bound && bound.max !== null && bound.min > bound.max) {
        throw new Error(`Relation ${relation.id} has ${side} cardinality min greater than max`);
      }
    }
  }

  const activeHierarchy = relations.filter(
    ({ predicate, status }) => predicate === "is_a" && status !== "deprecated",
  );
  const hierarchyCycle = findHierarchyCycle(conceptIds, activeHierarchy);
  if (hierarchyCycle) {
    throw new Error(
      `is_a taxonomy cycle: ${hierarchyCycle.nodes.join(" -> ")} via ${hierarchyCycle.relations.join(", ")}`,
    );
  }
  const parentsByConcept = new Map(classes.map(({ id }) => [id, []]));
  activeHierarchy.forEach((relation) => parentsByConcept.get(relation.source_id).push(relation));
  for (const concept of classes) {
    const parents = parentsByConcept.get(concept.id);
    const primaryId = concept.primary_parent_relation_id ?? null;
    if (primaryId !== null) {
      const primary = relationById.get(primaryId);
      if (!primary || primary.predicate !== "is_a" || primary.source_id !== concept.id) {
        throw new Error(
          `Concept ${concept.id} primary parent ${primaryId} must resolve to an outgoing is_a relation`,
        );
      }
    }
    if (concept.status === "accepted" && parents.length > 0 && primaryId === null) {
      throw new Error(`Accepted non-root Concept ${concept.id} is missing a valid primary parent relation`);
    }
    if (parents.length === 0 && primaryId !== null) {
      throw new Error(`Root Concept ${concept.id} cannot name primary parent relation ${primaryId}`);
    }
  }

  validateSemanticDepthContracts({
    modules,
    classes,
    relations,
    moduleIds,
    conceptIds,
    moduleById,
    conceptById,
    relationById,
    sourceFileByModule,
    sourceLocationByConcept,
    sourceLocationByRelation,
    releaseChannel,
  });

  for (const module of modules) {
    const moduleConcepts = classes.filter(({ module_id: moduleId }) => moduleId === module.id);
    if (moduleConcepts.length === 0) throw new Error(`Module ${module.id} declares no Concepts`);
    if (module.status !== "accepted") continue;
    const authoredSpecializations = activeHierarchy.filter(
      ({ source_id: sourceId }) => conceptById.get(sourceId)?.module_id === module.id,
    );
    if (
      module.taxonomy_contract.applicability === "specialization" &&
      authoredSpecializations.length === 0
    ) {
      throw new Error(`Accepted Module ${module.id} has no real specialization chain`);
    }
    if (module.taxonomy_contract.applicability === "flat-root-exception") {
      const ontologyReviewer = module.taxonomy_contract.review.reviewers.some(
        ({ reviewer_role: role }) => role === "ontology",
      );
      if (!ontologyReviewer) {
        throw new Error(`Flat-root exception for Module ${module.id} lacks an ontology reviewer`);
      }
    }
  }

  const canonicalDraft = Object.freeze({
    id: product.id,
    labels: structuredClone(product.labels),
    short_definitions: structuredClone(product.short_definitions),
    definitions: structuredClone(product.definitions),
    why_needed: structuredClone(product.why_needed),
    includes: structuredClone(product.includes),
    excludes: structuredClone(product.excludes),
    examples: structuredClone(product.examples),
    source_claims: structuredClone(product.source_claims),
    status: product.status,
    review: structuredClone(product.review),
    date: product.date,
    artifact_metadata: {
      artifact_kind: "canonical-agent-ontology",
      contract_version: contractVersion,
      canonical_version: product.canonical_version,
      release_channel: releaseChannel,
      releasable: releaseChannel === "release",
      generated: true,
      do_not_edit: true,
      generated_from: [...generatedFrom].sort(),
      generator_version: generatorVersion,
      generated_at: generatedAt,
      source_tree_sha256: sourceFingerprint,
    },
    planes,
    modules,
    classes,
    relations,
    global_constraints: structuredClone(productSource.global_constraints),
    case_paths: structuredClone(productSource.case_paths),
    hygiene_gates: structuredClone(productSource.hygiene_gates),
  });

  assertPublishedContentSecurity({
    documents: [{ label: "generated canonical ontology", value: canonicalDraft }],
    uiFiles: [],
  });

  validateReferencesAndInformation(canonicalDraft, sourceIndex);
  validateReleaseObjectEvidence({ canonical: canonicalDraft, releaseEvidence });
  const canonical = finalizeCanonicalWithMetrics(canonicalDraft);

  if (releaseChannel === "release") {
    const nonAccepted = [canonical, ...planes, ...modules, ...classes, ...relations].filter(
      ({ status }) => status !== "accepted" && status !== "deprecated",
    );
    if (nonAccepted.length > 0) {
      throw new Error(
        `Release requires every published record to be reviewed: ${nonAccepted
          .slice(0, 12)
          .map(({ id }) => id)
          .join(", ")}`,
      );
    }
  }

  return canonical;
};
