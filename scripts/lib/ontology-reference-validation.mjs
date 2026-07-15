import { buildEffectiveConceptStructures } from "./ontology-concept-structure.mjs";

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

export const validateAcceptedReferenceTargets = (
  canonical,
  suppliedOwnerByExampleId = null,
) => {
  const conceptById = new Map(canonical.classes.map((concept) => [concept.id, concept]));
  const relationById = new Map(
    canonical.relations.map((relation) => [relation.id, relation]),
  );
  const nodeStatusById = new Map([
    [canonical.id, "accepted"],
    ...canonical.planes.map((record) => [record.id, record.status ?? "accepted"]),
    ...canonical.modules.map((record) => [record.id, record.status ?? "accepted"]),
    ...canonical.classes.map((record) => [record.id, record.status ?? "accepted"]),
  ]);
  const { ownerByExampleId } = suppliedOwnerByExampleId
    ? { ownerByExampleId: suppliedOwnerByExampleId }
    : collectExamples(canonical);

  for (const relation of canonical.relations.filter(
    ({ status }) => status === "accepted",
  )) {
    for (const endpointId of [relation.source_id, relation.target_id]) {
      if (conceptById.get(endpointId)?.status === "deprecated") {
        throw new Error(
          `Accepted Relation ${relation.id} references deprecated endpoint ${endpointId}`,
        );
      }
    }
  }

  for (const concept of canonical.classes.filter(
    ({ status }) => status === "accepted",
  )) {
    if (concept.primary_parent_relation_id !== null) {
      const primaryParent = relationById.get(concept.primary_parent_relation_id);
      if (primaryParent?.status === "deprecated") {
        throw new Error(
          `Accepted Concept ${concept.id} primary parent references deprecated Relation ${concept.primary_parent_relation_id}`,
        );
      }
      if (
        primaryParent &&
        (conceptById.get(primaryParent.source_id)?.status === "deprecated" ||
          conceptById.get(primaryParent.target_id)?.status === "deprecated")
      ) {
        throw new Error(
          `Accepted Concept ${concept.id} primary parent Relation ${primaryParent.id} has a deprecated endpoint`,
        );
      }
    }

    for (const constraint of concept.structure?.required_relation_constraints ?? []) {
      if (conceptById.get(constraint.target_concept_id)?.status === "deprecated") {
        throw new Error(
          `Accepted Concept ${concept.id} structure references deprecated target ${constraint.target_concept_id}`,
        );
      }
    }
    for (const mapping of concept.external_mappings ?? []) {
      for (const targetId of mapping.canonical_target_ids) {
        if (conceptById.get(targetId)?.status === "deprecated") {
          throw new Error(
            `Accepted Concept ${concept.id} external mapping ${mapping.id} references deprecated target ${targetId}`,
          );
        }
      }
    }
  }

  const ownerStatus = ({ ownerType, ownerId }) => {
    if (ownerType === "ontology") return "accepted";
    if (ownerType === "plane") {
      return canonical.planes.find(({ id }) => id === ownerId)?.status ?? "accepted";
    }
    if (ownerType === "module") {
      return canonical.modules.find(({ id }) => id === ownerId)?.status ?? "accepted";
    }
    if (ownerType === "concept") return conceptById.get(ownerId)?.status;
    if (ownerType === "relation") return relationById.get(ownerId)?.status;
    return undefined;
  };

  for (const exampleOwner of ownerByExampleId.values()) {
    if (ownerStatus(exampleOwner) !== "accepted") continue;
    for (const nodeId of exampleOwner.example.related_node_ids ?? []) {
      if (nodeStatusById.get(nodeId) === "deprecated") {
        throw new Error(
          `Accepted example ${exampleOwner.example.id} references deprecated node ${nodeId}`,
        );
      }
    }
    for (const relationId of exampleOwner.example.related_relation_ids ?? []) {
      if (relationById.get(relationId)?.status === "deprecated") {
        throw new Error(
          `Accepted example ${exampleOwner.example.id} references deprecated Relation ${relationId}`,
        );
      }
    }
  }

  for (const module of canonical.modules.filter(
    ({ status }) => status === "accepted",
  )) {
    for (const question of module.competency_questions ?? []) {
      for (const exampleId of [
        ...(question.positive_example_ids ?? []),
        ...(question.counterexample_ids ?? []),
      ]) {
        const exampleOwner = ownerByExampleId.get(exampleId);
        if (exampleOwner && ownerStatus(exampleOwner) === "deprecated") {
          throw new Error(
            `Accepted competency question ${question.id} references example ${exampleId} owned by deprecated ${exampleOwner.ownerType} ${exampleOwner.ownerId}`,
          );
        }
      }
    }
  }
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

};

export const validateReferencesAndInformation = (canonical, sourceIndex) => {
  const nodeIds = new Set([
    canonical.id,
    ...canonical.planes.map(({ id }) => id),
    ...canonical.modules.map(({ id }) => id),
    ...canonical.classes.map(({ id }) => id),
  ]);
  const relationIds = new Set(canonical.relations.map(({ id }) => id));
  const conceptIds = new Set(canonical.classes.map(({ id }) => id));
  const conceptById = new Map(canonical.classes.map((concept) => [concept.id, concept]));
  const relationById = new Map(canonical.relations.map((relation) => [relation.id, relation]));
  const registryIds = new Set(sourceIndex.sources.map(({ id }) => id));
  const { examples, ownerByExampleId } = collectExamples(canonical);
  validateAcceptedReferenceTargets(canonical, ownerByExampleId);

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
    if (example.kind === "case-fragment") {
      const relatedConceptIds = (example.related_node_ids ?? []).filter((id) => conceptIds.has(id));
      const relatedModuleIds = new Set(
        relatedConceptIds.map((id) => conceptById.get(id)?.module_id).filter(Boolean),
      );
      if (relatedModuleIds.size > 1) {
        const hasActualCrossModuleFact = (example.related_relation_ids ?? []).some((relationId) => {
          const relation = relationById.get(relationId);
          if (!relation || relation.status !== "accepted") return false;
          if (!relatedConceptIds.includes(relation.source_id) || !relatedConceptIds.includes(relation.target_id)) {
            return false;
          }
          return conceptById.get(relation.source_id)?.module_id !== conceptById.get(relation.target_id)?.module_id;
        });
        if (!hasActualCrossModuleFact) {
          throw new Error(
            `Case fragment ${example.id} spans neighboring Modules without an accepted cross-module relation over its cited endpoints`,
          );
        }
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

  const competencyQuestionPairOwner = new Map();
  for (const module of canonical.modules) {
    for (const question of module.competency_questions ?? []) {
      const pairKey = JSON.stringify([
        [...(question.positive_example_ids ?? [])].sort(),
        [...(question.counterexample_ids ?? [])].sort(),
      ]);
      if (competencyQuestionPairOwner.has(pairKey)) {
        throw new Error(
          `Competency questions ${competencyQuestionPairOwner.get(pairKey)} and ${question.id} reuse the same positive/counterexample pair`,
        );
      }
      competencyQuestionPairOwner.set(pairKey, question.id);
      for (const id of [
        ...(question.positive_example_ids ?? []),
        ...(question.counterexample_ids ?? []),
      ]) {
        if (!ownerByExampleId.has(id)) {
          throw new Error(`Competency question ${question.id} has unresolved example ${id}`);
        }
      }
      for (const exampleId of [
        ...(question.positive_example_ids ?? []),
        ...(question.counterexample_ids ?? []),
      ]) {
        const exampleOwner = ownerByExampleId.get(exampleId);
        const example = exampleOwner.example;
        const touchedConceptIds = [
          ...(example.related_node_ids ?? []),
          ...(exampleOwner.ownerType === "concept" ? [exampleOwner.ownerId] : []),
        ];
        const evidenceModuleIds = new Set(
          touchedConceptIds
            .map((conceptId) => conceptById.get(conceptId)?.module_id)
            .filter(Boolean),
        );
        if (!evidenceModuleIds.has(module.id)) {
          throw new Error(
            `Competency question ${question.id} example ${exampleId} does not touch an owner Concept from ${module.id}`,
          );
        }
        if (question.evidence_binding.applicability !== "owner-only") {
          for (const relatedModuleId of question.related_module_ids) {
            if (!evidenceModuleIds.has(relatedModuleId)) {
              throw new Error(
                `Competency question ${question.id} example ${exampleId} does not touch related Module ${relatedModuleId}`,
              );
            }
          }
        }
        if (question.evidence_binding.applicability === "relation-backed") {
          for (const relationId of question.evidence_binding.relation_ids) {
            if (!(example.related_relation_ids ?? []).includes(relationId)) {
              throw new Error(
                `Competency question ${question.id} example ${exampleId} omits bound Relation ${relationId}`,
              );
            }
          }
        } else {
          const citedCrossModuleRelation = (example.related_relation_ids ?? []).find((relationId) => {
            const relation = relationById.get(relationId);
            return relation &&
              conceptById.get(relation.source_id)?.module_id !==
                conceptById.get(relation.target_id)?.module_id;
          });
          if (citedCrossModuleRelation) {
            throw new Error(
              `Competency question ${question.id} marks cross-module relation evidence N/A but example ${exampleId} cites cross-module Relation ${citedCrossModuleRelation}`,
            );
          }
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

\n
