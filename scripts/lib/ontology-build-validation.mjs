import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { buildEffectiveConceptStructures } from "./ontology-concept-structure.mjs";
import { assertPublishedContentSecurity } from "./ontology-security-gates.mjs";
import { sha256, sourceTreeFingerprint } from "./stable-json.mjs";

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

export const loadAndValidateSources = ({ sourceRoot, artifactContractPath }) => {
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
  if (files.length === 0) throw new Error(`No ontology source JSON files found under ${sourceRoot}`);

  const entries = files.map((path) => {
    const bytes = readFileSync(path);
    let data;
    try {
      data = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(`Invalid JSON in ${path}: ${error.message}`);
    }
    if (!validateSource(data)) {
      throw new Error(
        `Source contract rejected reviewed information in ${normalizePath(relative(sourceRoot, path))}: ${formatAjvErrors(validateSource.errors)}`,
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

  return {
    contract,
    contractFingerprint: sha256(contractBytes),
    productEntry: productEntries[0],
    moduleEntries,
    sourceFingerprint: sourceTreeFingerprint(
      entries.map(({ relativePath, bytes }) => [relativePath, bytes]),
    ),
    generatedFrom: entries.map(({ relativePath }) => `ontology/source/${relativePath}`),
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

const findHierarchyCycle = (conceptIds, hierarchyRelations) => {
  const parentsByChild = new Map([...conceptIds].map((id) => [id, []]));
  for (const relation of hierarchyRelations) {
    parentsByChild.get(relation.source_id)?.push({
      parentId: relation.target_id,
      relationId: relation.id,
    });
  }
  const visiting = new Set();
  const visited = new Set();
  const nodePath = [];
  const relationPath = [];

  const visit = (id) => {
    if (visiting.has(id)) {
      const start = nodePath.indexOf(id);
      return {
        nodes: [...nodePath.slice(start), id],
        relations: relationPath.slice(start),
      };
    }
    if (visited.has(id)) return null;
    visiting.add(id);
    nodePath.push(id);
    for (const edge of parentsByChild.get(id) ?? []) {
      relationPath.push(edge.relationId);
      const cycle = visit(edge.parentId);
      if (cycle) return cycle;
      relationPath.pop();
    }
    nodePath.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const id of conceptIds) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return null;
};

const walkObject = (value, visitor, path = "$") => {
  visitor(value, path);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walkObject(child, visitor, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) =>
      walkObject(child, visitor, `${path}.${key}`),
    );
  }
};

const collectExamples = (canonical) => {
  const examples = [];
  const ownerByExampleId = new Map();
  const collect = (ownerType, owner) => {
    for (const example of owner.examples ?? []) {
      examples.push(example);
      if (ownerByExampleId.has(example.id)) {
        throw new Error(`Duplicate example id ${example.id}`);
      }
      ownerByExampleId.set(example.id, { ownerType, ownerId: owner.id, example });
    }
  };
  collect("ontology", canonical);
  canonical.planes.forEach((record) => collect("plane", record));
  canonical.modules.forEach((record) => collect("module", record));
  canonical.classes.forEach((record) => collect("concept", record));
  canonical.relations.forEach((record) => collect("relation", record));
  return { examples, ownerByExampleId };
};

const scalarMatchesFieldDatatype = (field, value) => {
  const datatype = field.datatype.toLowerCase();
  if (datatype === "integer") return Number.isInteger(value);
  if (datatype === "number") return typeof value === "number" && Number.isFinite(value);
  if (datatype === "boolean") return typeof value === "boolean";
  if (datatype === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (datatype === "reference") return typeof value === "string" && value.length > 0;
  if (datatype === "date-time") {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
  }
  if (datatype === "uri") {
    if (typeof value !== "string") return false;
    try {
      return Boolean(new URL(value));
    } catch {
      return false;
    }
  }
  return typeof value === "string";
};

const validateScalarFieldValue = ({ conceptId, exampleId, field, value }) => {
  if (!scalarMatchesFieldDatatype(field, value)) {
    throw new Error(
      `Concept example ${exampleId} field ${field.id} must match datatype ${field.datatype} on ${conceptId}`,
    );
  }
  if (
    field.allowed_values.length > 0 &&
    !field.allowed_values.some(({ value: allowedValue }) =>
      Object.is(allowedValue, value),
    )
  ) {
    throw new Error(
      `Concept example ${exampleId} field ${field.id} uses a value outside its reviewed allowed_values`,
    );
  }
  if (field.pattern && typeof value === "string" && !new RegExp(field.pattern, "u").test(value)) {
    throw new Error(
      `Concept example ${exampleId} field ${field.id} does not match its reviewed pattern`,
    );
  }
};

const validateConceptExampleFields = ({ canonical, ownerByExampleId }) => {
  const effectiveStructures = buildEffectiveConceptStructures(canonical);
  const membershipExamples = new Set(["positive", "instance", "case-fragment"]);

  for (const { ownerType, ownerId, example } of ownerByExampleId.values()) {
    if (ownerType !== "concept") continue;
    const fields = new Map(
      effectiveStructures.get(ownerId).fields.map((field) => [field.id, field]),
    );
    for (const fieldId of Object.keys(example.field_values)) {
      if (!fields.has(fieldId)) {
        throw new Error(
          `Concept example ${example.id} contains unknown or undeclared field ${fieldId} on ${ownerId}`,
        );
      }
    }
    if (membershipExamples.has(example.kind)) {
      for (const field of fields.values()) {
        if ((field.required || field.cardinality.min > 0) && !Object.hasOwn(example.field_values, field.id)) {
          throw new Error(
            `Concept example ${example.id} is missing required field ${field.id} on ${ownerId}`,
          );
        }
      }
    }
    for (const [fieldId, value] of Object.entries(example.field_values)) {
      const field = fields.get(fieldId);
      const repeatable = field.cardinality.max === null || field.cardinality.max > 1;
      if (repeatable) {
        if (!Array.isArray(value)) {
          throw new Error(
            `Concept example ${example.id} repeatable field ${fieldId} must be represented by an array`,
          );
        }
        if (value.length < field.cardinality.min) {
          throw new Error(`Concept example ${example.id} field ${fieldId} is below cardinality min`);
        }
        if (field.cardinality.max !== null && value.length > field.cardinality.max) {
          throw new Error(`Concept example ${example.id} field ${fieldId} exceeds cardinality max`);
        }
        value.forEach((item) =>
          validateScalarFieldValue({ conceptId: ownerId, exampleId: example.id, field, value: item }),
        );
      } else {
        validateScalarFieldValue({ conceptId: ownerId, exampleId: example.id, field, value });
      }
    }
  }
};

const validateInformationQuality = (canonical) => {
  const incidentConceptIds = new Set(
    canonical.relations
      .filter(({ status }) => status === "accepted")
      .flatMap(({ source_id: sourceId, target_id: targetId }) => [sourceId, targetId]),
  );
  const forbiddenConceptTemplates = [
    /synthetic audit scenario/iu,
    /is needed so this meaning can be distinguished, related, and validated consistently/iu,
    /objects that satisfy the formal definition and ownership boundary/iu,
    /classified as .* under the reviewed definition/iu,
    /the example satisfies the definition boundary and ownership conditions/iu,
  ];
  for (const concept of canonical.classes.filter(({ status }) => status === "accepted")) {
    if (!incidentConceptIds.has(concept.id)) {
      throw new Error(
        `Accepted Concept ${concept.id} is isolated; add a reviewed fact or keep it out of the accepted graph`,
      );
    }
    const reviewableInformation = JSON.stringify({
      why_needed: concept.why_needed,
      includes: concept.includes,
      excludes: concept.excludes,
      examples: concept.examples.filter(({ kind }) =>
        ["positive", "boundary", "counterexample"].includes(kind),
      ),
    });
    const forbidden = forbiddenConceptTemplates.find((pattern) =>
      pattern.test(reviewableInformation),
    );
    if (forbidden) {
      throw new Error(
        `Concept ${concept.id} still uses generic information template ${forbidden.source}`,
      );
    }
  }

  if (canonical.case_paths.some(({ id }) => id === "software-defect-repair")) {
    for (const module of canonical.modules) {
      const fragment = module.examples.find(
        ({ kind, scenario_id: scenarioId }) =>
          kind === "case-fragment" && scenarioId === "software-defect-repair",
      );
      if (
        !fragment ||
        fragment.related_node_ids.length < 2 ||
        fragment.related_relation_ids.length === 0
      ) {
        throw new Error(
          `Module ${module.id} must attach a relation-backed software-defect-repair case fragment`,
        );
      }
    }
  }
};

const validateReferencesAndInformation = (canonical, sourceIndex) => {
  const nodeIds = new Set([
    canonical.id,
    ...canonical.planes.map(({ id }) => id),
    ...canonical.modules.map(({ id }) => id),
    ...canonical.classes.map(({ id }) => id),
  ]);
  const relationIds = new Set(canonical.relations.map(({ id }) => id));
  const conceptIds = new Set(canonical.classes.map(({ id }) => id));
  const registryIds = new Set(sourceIndex.sources.map(({ id }) => id));
  const { examples, ownerByExampleId } = collectExamples(canonical);

  for (const concept of canonical.classes) {
    const fieldIds = new Set();
    for (const field of concept.structure?.fields ?? []) {
      if (fieldIds.has(field.id)) throw new Error(`Concept ${concept.id} repeats field id ${field.id}`);
      if (!new Set(["string", "integer", "number", "boolean", "object", "reference", "date-time", "uri"]).has(field.datatype)) {
        throw new Error(
          `Concept ${concept.id} field ${field.id} has unsupported datatype ${field.datatype}`,
        );
      }
      if (field.cardinality.max !== null && field.cardinality.min > field.cardinality.max) {
        throw new Error(
          `Concept ${concept.id} field ${field.id} has cardinality min greater than max`,
        );
      }
      fieldIds.add(field.id);
    }

    const constraintIds = new Set();
    for (const constraint of concept.structure?.required_relation_constraints ?? []) {
      if (constraintIds.has(constraint.id)) {
        throw new Error(
          `Concept ${concept.id} repeats required relation constraint id ${constraint.id}`,
        );
      }
      constraintIds.add(constraint.id);
      if (!conceptIds.has(constraint.target_concept_id)) {
        throw new Error(
          `Required relation constraint ${constraint.id} on ${concept.id} has unresolved target concept ${constraint.target_concept_id}`,
        );
      }
      if (
        constraint.cardinality.max !== null &&
        constraint.cardinality.min > constraint.cardinality.max
      ) {
        throw new Error(
          `Required relation constraint ${constraint.id} on ${concept.id} has cardinality min greater than max`,
        );
      }

      const hasMatchingFact = canonical.relations.some((relation) => {
        if (relation.status === "deprecated" || relation.predicate !== constraint.predicate) {
          return false;
        }
        return constraint.direction === "outgoing"
          ? relation.source_id === concept.id &&
              relation.target_id === constraint.target_concept_id
          : relation.target_id === concept.id &&
              relation.source_id === constraint.target_concept_id;
      });
      if (!hasMatchingFact) {
        throw new Error(
          `Required relation constraint ${constraint.id} on ${concept.id} has no matching canonical relation fact for ${constraint.predicate} ${constraint.target_concept_id}`,
        );
      }
    }
  }
  validateConceptExampleFields({ canonical, ownerByExampleId });
  validateInformationQuality(canonical);

  for (const concept of canonical.classes) {
    for (const mapping of concept.external_mappings ?? []) {
      for (const targetId of mapping.canonical_target_ids) {
        if (!conceptIds.has(targetId)) {
          throw new Error(
            `External mapping ${mapping.id} on ${concept.id} has unresolved canonical target ${targetId}`,
          );
        }
      }
    }
  }

  for (const example of examples) {
    for (const id of example.related_node_ids ?? []) {
      if (!nodeIds.has(id)) throw new Error(`Example ${example.id} has unresolved node reference ${id}`);
    }
    for (const id of example.related_relation_ids ?? []) {
      if (!relationIds.has(id)) {
        throw new Error(`Example ${example.id} has unresolved relation reference ${id}`);
      }
    }
  }

  walkObject(canonical, (value, path) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    if (
      typeof value.reviewed_on === "string" &&
      value.reviewed_on > canonical.date
    ) {
      throw new Error(
        `Review date ${value.reviewed_on} at ${path} is later than controlled release date ${canonical.date}`,
      );
    }
    if (Object.hasOwn(value, "source_claims") && Array.isArray(value.source_claims)) {
      const evidenceKeys = value.source_claims.map((claim) =>
        [claim.source_id, claim.locator, claim.evidence_kind].join("\0"),
      );
      if (new Set(evidenceKeys).size !== evidenceKeys.length) {
        throw new Error(`Duplicate source evidence at ${path}.source_claims`);
      }
      if (value.source_claims.length > 2) {
        throw new Error(
          `Source evidence at ${path}.source_claims must be compressed to at most two direct claims`,
        );
      }
      for (const claim of value.source_claims) {
        if (!registryIds.has(claim.source_id)) {
          throw new Error(`Unresolved source claim ${claim.source_id} at ${path}`);
        }
        if (!claim.supports?.trim() || !claim.locator?.trim()) {
          throw new Error(`Incomplete source claim ${claim.source_id} at ${path}`);
        }
        if (/https?:\/\//u.test(claim.locator)) {
          throw new Error(
            `Source claim ${claim.source_id} at ${path} must use an in-source locator; the URL belongs in the source registry`,
          );
        }
      }
    }
  });

  for (const module of canonical.modules) {
    for (const question of module.competency_questions ?? []) {
      for (const id of [
        ...(question.positive_example_ids ?? []),
        ...(question.counterexample_ids ?? []),
      ]) {
        if (!ownerByExampleId.has(id)) {
          throw new Error(`Competency question ${question.id} has unresolved example ${id}`);
        }
      }
    }
  }

  for (const path of canonical.case_paths) {
    let previousOwner = null;
    for (const step of [...path.steps].sort((left, right) => left.order - right.order)) {
      const owner = ownerByExampleId.get(step.case_fragment_example_id);
      if (!owner || owner.example.kind !== "case-fragment") {
        throw new Error(
          `Case path ${path.id} references non-case-fragment example ${step.case_fragment_example_id}`,
        );
      }
      if (step.traversal_relation_id !== null) {
        const relation = canonical.relations.find(({ id }) => id === step.traversal_relation_id);
        if (!relation) {
          throw new Error(`Case path ${path.id} has unresolved traversal relation ${step.traversal_relation_id}`);
        }
        if (
          previousOwner?.ownerType === "concept" &&
          owner.ownerType === "concept" &&
          !(
            (relation.source_id === previousOwner.ownerId && relation.target_id === owner.ownerId) ||
            (relation.target_id === previousOwner.ownerId && relation.source_id === owner.ownerId)
          )
        ) {
          throw new Error(
            `Case path ${path.id} traversal ${relation.id} does not connect adjacent fragment owners`,
          );
        }
      }
      previousOwner = owner;
    }
  }
};

export const mergeAndValidateCanonical = ({
  productEntry,
  moduleEntries,
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
    if (prior) {
      throw new Error(`Duplicate normalized fact under relation IDs ${prior.id} and ${relation.id}`);
    }
    facts.set(factKey, relation);

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

  const canonical = {
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
    ontology_metrics: {},
  };

  assertPublishedContentSecurity({
    documents: [{ label: "generated canonical ontology", value: canonical }],
    uiFiles: [],
  });

  validateReferencesAndInformation(canonical, sourceIndex);
  canonical.ontology_metrics = computeOntologyMetrics(canonical);

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

const countNamedArrayItems = (value, names, predicate = () => true) => {
  if (Array.isArray(value)) {
    return value.reduce(
      (total, item) => total + countNamedArrayItems(item, names, predicate),
      0,
    );
  }
  if (value === null || typeof value !== "object") return 0;
  return Object.entries(value).reduce((total, [key, child]) => {
    const local = names.has(key) && Array.isArray(child) ? child.filter(predicate).length : 0;
    return total + local + countNamedArrayItems(child, names, predicate);
  }, 0);
};

export const computeOntologyMetrics = (canonical) => {
  const activeHierarchy = canonical.relations.filter(
    ({ predicate, status }) => predicate === "is_a" && status !== "deprecated",
  );
  const conceptsWithParents = new Set(activeHierarchy.map(({ source_id: sourceId }) => sourceId));
  return {
    domains: canonical.planes.length,
    modules: canonical.modules.length,
    concepts: canonical.classes.length,
    taxonomy_roots: canonical.classes.filter(
      ({ id, status }) => status !== "deprecated" && !conceptsWithParents.has(id),
    ).length,
    is_a_relations: activeHierarchy.length,
    semantic_relations: canonical.relations.filter(
      ({ predicate, status }) => predicate !== "is_a" && status !== "deprecated",
    ).length,
    instance_examples: countNamedArrayItems(
      canonical,
      new Set(["examples"]),
      (item) => item && typeof item === "object" && item.kind === "instance",
    ),
    controlled_values: countNamedArrayItems(canonical, new Set(["allowed_values"])),
    structure_fields: countNamedArrayItems(canonical, new Set(["fields"])),
    constraints: countNamedArrayItems(
      canonical,
      new Set(["constraints", "required_relation_constraints", "conditions", "global_constraints"]),
    ),
    source_claims: countNamedArrayItems(canonical, new Set(["source_claims"])),
    case_paths: canonical.case_paths.length,
    legacy_individuals_remaining: Array.isArray(canonical.individuals)
      ? canonical.individuals.length
      : 0,
    legacy_data_properties_remaining: Array.isArray(canonical.data_properties)
      ? canonical.data_properties.length
      : 0,
    legacy_axioms_remaining: Array.isArray(canonical.axioms)
      ? canonical.axioms.length
      : 0,
  };
};
