const decisionKinds = new Set([
  "keep_root",
  "keep_reparent",
  "retype",
  "move_owner",
  "convert_to_field",
  "convert_to_controlled_value",
  "merge",
  "deprecate",
  "remove_invalid",
]);

const retainedDecisionKinds = new Set([
  "keep_root",
  "keep_reparent",
  "retype",
  "move_owner",
  "deprecate",
]);

const semanticKinds = new Set([
  "entity",
  "activity",
  "event",
  "information",
  "specification",
  "quality",
  "collection",
  "role",
  "capability",
  "state",
]);

const relationKinds = new Set([
  "composition",
  "causal",
  "temporal",
  "information",
  "governance",
  "mapping",
]);

const localizedComplete = (value) =>
  value && [value.zh, value.en, value.ja].every((text) => typeof text === "string" && text.trim());

const push = (errors, condition, message) => {
  if (!condition) errors.push(message);
};

const duplicateValues = (values) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
};

const detectHierarchyCycle = (retainedIds, parentIdsByConcept) => {
  const visiting = new Set();
  const visited = new Set();

  const visit = (id, path) => {
    if (visiting.has(id)) {
      const cycleStart = path.indexOf(id);
      return [...path.slice(cycleStart), id];
    }
    if (visited.has(id)) return null;
    visiting.add(id);
    for (const parentId of parentIdsByConcept.get(id) ?? []) {
      if (!retainedIds.has(parentId)) continue;
      const cycle = visit(parentId, [...path, id]);
      if (cycle) return cycle;
    }
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const id of retainedIds) {
    const cycle = visit(id, []);
    if (cycle) return cycle;
  }
  return null;
};

export const validateOntologyDecisionBundles = ({ legacy, bundles, sourceIds }) => {
  const errors = [];
  const legacyConceptIds = new Set(legacy.classes.map(({ id }) => id));
  const legacyModuleIds = new Set(legacy.modules.map(({ id }) => id));
  const sourceIdSet = new Set(sourceIds);
  const decisions = bundles.flatMap((bundle) => bundle.concept_decisions ?? []);
  const moduleReviews = bundles.flatMap((bundle) =>
    (bundle.modules ?? []).map((module) => ({ ...module, reviewer: bundle.reviewer })),
  );
  const anchors = bundles.flatMap((bundle) => bundle.new_anchors ?? []);

  push(errors, bundles.length > 0, "At least one reviewed decision bundle is required");
  for (const [index, bundle] of bundles.entries()) {
    push(errors, Array.isArray(bundle.review_scope), `Bundle ${index} lacks review_scope`);
    push(errors, bundle.reviewer?.reviewer_role === "ontology", `Bundle ${index} reviewer role is not ontology`);
    push(errors, Boolean(bundle.reviewer?.reviewer_id), `Bundle ${index} lacks reviewer_id`);
    push(errors, /^\d{4}-\d{2}-\d{2}$/u.test(bundle.reviewer?.reviewed_on ?? ""), `Bundle ${index} has invalid reviewed_on`);
  }

  const decisionIds = decisions.map(({ concept_id: id }) => id);
  const duplicateDecisionIds = duplicateValues(decisionIds);
  push(errors, duplicateDecisionIds.length === 0, `Duplicate Concept decisions: ${duplicateDecisionIds.join(", ")}`);
  push(errors, decisions.length === legacyConceptIds.size, `Expected ${legacyConceptIds.size} Concept decisions; found ${decisions.length}`);
  const unknownDecisionIds = decisionIds.filter((id) => !legacyConceptIds.has(id));
  const missingDecisionIds = [...legacyConceptIds].filter((id) => !decisionIds.includes(id));
  push(errors, unknownDecisionIds.length === 0, `Unknown Concept decisions: ${unknownDecisionIds.join(", ")}`);
  push(errors, missingDecisionIds.length === 0, `Missing Concept decisions: ${missingDecisionIds.join(", ")}`);

  const anchorIds = anchors.map(({ id }) => id);
  const duplicateAnchorIds = duplicateValues(anchorIds);
  push(errors, duplicateAnchorIds.length === 0, `Duplicate anchors: ${duplicateAnchorIds.join(", ")}`);
  const collidingAnchorIds = anchorIds.filter((id) => legacyConceptIds.has(id));
  push(errors, collidingAnchorIds.length === 0, `Anchors collide with legacy IDs: ${collidingAnchorIds.join(", ")}`);

  const decisionById = new Map(decisions.map((decision) => [decision.concept_id, decision]));
  const retainedDecisions = decisions.filter(({ decision }) => retainedDecisionKinds.has(decision));
  const retainedIds = new Set([...retainedDecisions.map(({ concept_id: id }) => id), ...anchorIds]);
  const moduleByConceptId = new Map([
    ...retainedDecisions.map(({ concept_id, target_module_id }) => [concept_id, target_module_id]),
    ...anchors.map(({ id, module_id }) => [id, module_id]),
  ]);

  for (const decision of decisions) {
    const prefix = `Concept decision ${decision.concept_id}`;
    push(errors, decisionKinds.has(decision.decision), `${prefix} has invalid decision ${decision.decision}`);
    push(errors, legacyModuleIds.has(decision.target_module_id), `${prefix} targets unknown Module ${decision.target_module_id}`);
    push(errors, localizedComplete(decision.rationale), `${prefix} lacks trilingual rationale`);
    push(errors, Array.isArray(decision.additional_parent_ids), `${prefix} lacks additional_parent_ids`);
    if (decision.labels) push(errors, localizedComplete(decision.labels), `${prefix} has incomplete labels`);

    if (retainedDecisionKinds.has(decision.decision)) {
      push(errors, semanticKinds.has(decision.semantic_kind), `${prefix} has invalid semantic_kind ${decision.semantic_kind}`);
      if (decision.decision === "keep_root") {
        push(errors, decision.primary_parent_id === null, `${prefix} keep_root must not name a parent`);
      }
      const parents = [decision.primary_parent_id, ...(decision.additional_parent_ids ?? [])].filter(Boolean);
      push(errors, !parents.includes(decision.concept_id), `${prefix} cannot inherit from itself`);
      for (const parentId of parents) {
        push(errors, retainedIds.has(parentId), `${prefix} references non-retained parent ${parentId}`);
      }
      push(errors, duplicateValues(parents).length === 0, `${prefix} repeats a parent`);
    }

    if (["convert_to_field", "convert_to_controlled_value"].includes(decision.decision)) {
      push(errors, retainedIds.has(decision.target_concept_id), `${prefix} targets non-retained owner ${decision.target_concept_id}`);
      push(errors, Boolean(decision.target_field_id), `${prefix} lacks target_field_id`);
    }
    if (decision.decision === "merge") {
      push(errors, retainedIds.has(decision.target_concept_id), `${prefix} lacks retained replacement/merge target`);
      push(errors, decision.target_concept_id !== decision.concept_id, `${prefix} cannot target itself`);
    }
    if (decision.decision === "deprecate" && decision.target_concept_id !== null) {
      push(errors, retainedIds.has(decision.target_concept_id), `${prefix} names a non-retained replacement`);
      push(errors, decision.target_concept_id !== decision.concept_id, `${prefix} cannot replace itself`);
    }
  }

  for (const anchor of anchors) {
    const prefix = `Anchor ${anchor.id}`;
    push(errors, legacyModuleIds.has(anchor.module_id), `${prefix} targets unknown Module ${anchor.module_id}`);
    push(errors, localizedComplete(anchor.labels), `${prefix} lacks trilingual labels`);
    push(errors, localizedComplete(anchor.short_definitions), `${prefix} lacks short definitions`);
    push(errors, localizedComplete(anchor.definitions), `${prefix} lacks formal definitions`);
    push(errors, localizedComplete(anchor.why_needed), `${prefix} lacks why_needed`);
    push(errors, Array.isArray(anchor.includes) && anchor.includes.length > 0, `${prefix} lacks includes`);
    push(errors, Array.isArray(anchor.excludes) && anchor.excludes.length > 0, `${prefix} lacks excludes`);
    push(errors, semanticKinds.has(anchor.semantic_kind), `${prefix} has invalid semantic_kind ${anchor.semantic_kind}`);
    push(errors, Array.isArray(anchor.parent_ids), `${prefix} lacks parent_ids`);
    for (const parentId of anchor.parent_ids ?? []) {
      push(errors, retainedIds.has(parentId), `${prefix} references non-retained parent ${parentId}`);
      push(errors, parentId !== anchor.id, `${prefix} cannot inherit from itself`);
    }
    for (const sourceId of anchor.source_ids ?? []) {
      push(errors, sourceIdSet.has(sourceId), `${prefix} references unknown source ${sourceId}`);
    }
    push(errors, localizedComplete(anchor.rationale), `${prefix} lacks trilingual rationale`);
  }

  const moduleIds = moduleReviews.map(({ module_id: id }) => id);
  const duplicateModuleIds = duplicateValues(moduleIds);
  push(errors, duplicateModuleIds.length === 0, `Duplicate Module reviews: ${duplicateModuleIds.join(", ")}`);
  push(errors, moduleReviews.length === legacyModuleIds.size, `Expected ${legacyModuleIds.size} Module reviews; found ${moduleReviews.length}`);
  push(errors, [...legacyModuleIds].every((id) => moduleIds.includes(id)), "Module reviews do not cover the legacy Module set exactly");

  const normalizedFacts = [];
  for (const moduleReview of moduleReviews) {
    const prefix = `Module review ${moduleReview.module_id}`;
    push(errors, legacyModuleIds.has(moduleReview.module_id), `${prefix} is unknown`);
    push(errors, ["specialization", "flat-root-exception"].includes(moduleReview.taxonomy_applicability), `${prefix} has invalid taxonomy_applicability`);
    push(errors, localizedComplete(moduleReview.rationale), `${prefix} lacks trilingual rationale`);
    const ownedRetained = [...moduleByConceptId].filter(([, moduleId]) => moduleId === moduleReview.module_id).map(([id]) => id);
    push(errors, ownedRetained.length > 0, `${prefix} owns no retained Concept`);
    const hasLocalSpecialization = retainedDecisions.some((decision) =>
      decision.target_module_id === moduleReview.module_id &&
      decision.primary_parent_id &&
      moduleByConceptId.get(decision.primary_parent_id) === moduleReview.module_id,
    ) || anchors.some((anchor) =>
      anchor.module_id === moduleReview.module_id &&
      (anchor.parent_ids ?? []).some((parentId) => moduleByConceptId.get(parentId) === moduleReview.module_id),
    );
    if (moduleReview.taxonomy_applicability === "specialization") {
      push(errors, hasLocalSpecialization, `${prefix} claims specialization but has no Module-local is_a chain`);
    }
    const semanticRelations = moduleReview.semantic_relations ?? [];
    push(errors, semanticRelations.length > 0, `${prefix} has no reviewed semantic relations`);
    for (const relation of semanticRelations) {
      const fact = JSON.stringify([relation.source_id, relation.predicate, relation.target_id]);
      normalizedFacts.push(fact);
      push(errors, retainedIds.has(relation.source_id), `${prefix} relation source ${relation.source_id} is not retained`);
      push(errors, retainedIds.has(relation.target_id), `${prefix} relation target ${relation.target_id} is not retained`);
      push(errors, moduleByConceptId.get(relation.source_id) === moduleReview.module_id, `${prefix} does not own relation source ${relation.source_id}`);
      push(errors, typeof relation.predicate === "string" && relation.predicate.trim(), `${prefix} has empty relation predicate`);
      push(errors, relationKinds.has(relation.relation_kind), `${prefix} has invalid relation kind ${relation.relation_kind}`);
      push(errors, localizedComplete(relation.rationale), `${prefix} relation lacks trilingual rationale`);
    }
  }
  const duplicateFacts = duplicateValues(normalizedFacts);
  push(errors, duplicateFacts.length === 0, `Duplicate reviewed semantic facts: ${duplicateFacts.join(", ")}`);

  const parentIdsByConcept = new Map();
  for (const decision of retainedDecisions) {
    parentIdsByConcept.set(
      decision.concept_id,
      [decision.primary_parent_id, ...(decision.additional_parent_ids ?? [])].filter(Boolean),
    );
  }
  for (const anchor of anchors) parentIdsByConcept.set(anchor.id, anchor.parent_ids ?? []);
  const cycle = detectHierarchyCycle(retainedIds, parentIdsByConcept);
  push(errors, !cycle, `Reviewed is_a hierarchy contains a cycle: ${cycle?.join(" -> ") ?? ""}`);

  const removedIds = decisions
    .filter(({ decision }) => !retainedDecisionKinds.has(decision))
    .map(({ concept_id: id }) => id);
  for (const removedId of removedIds) {
    const stillReferenced = [...parentIdsByConcept.values()].some((parents) => parents.includes(removedId));
    push(errors, !stillReferenced, `Removed Concept ${removedId} remains an is_a parent`);
  }

  if (errors.length > 0) {
    throw new Error(`Ontology decision validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  }

  return {
    bundleCount: bundles.length,
    conceptDecisionCount: decisions.length,
    retainedConceptCount: retainedIds.size,
    anchorCount: anchors.length,
    moduleReviewCount: moduleReviews.length,
    semanticRelationCount: normalizedFacts.length,
  };
};
