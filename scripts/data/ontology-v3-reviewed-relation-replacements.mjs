const reviewedReplacement = (oldRelationId, newRelationId, affectedConceptIds) =>
  Object.freeze({
    old_relation_id: oldRelationId,
    new_relation_id: newRelationId,
    affected_concept_ids: Object.freeze([...affectedConceptIds]),
    review_status: "accepted",
  });

export const ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS = Object.freeze([
  reviewedReplacement(
    "InstructionResolution-resolves-InstructionConflict",
    "InstructionResolutionActivity-resolves-InstructionConflict",
    ["InstructionConflict", "InstructionResolution", "InstructionResolutionActivity"],
  ),
  reviewedReplacement(
    "InstructionResolution-resolves-Instruction",
    "InstructionResolution-records_effective-Instruction",
    ["Instruction", "InstructionResolution"],
  ),
  reviewedReplacement(
    "DefenseFinding-triggers-MitigationAction",
    "MitigationAction-addresses-DefenseFinding",
    ["DefenseFinding", "MitigationAction"],
  ),
  reviewedReplacement(
    "Measurement-measures-Metric",
    "Measurement-conforms_to-Metric",
    ["Measurement", "Metric"],
  ),
  reviewedReplacement(
    "Feedback-triggers-MemoryWrite",
    "MemoryWrite-responds_to-Feedback",
    ["Feedback", "MemoryWrite"],
  ),
]);

export const reviewedRelationChangesForConcept = (conceptId) =>
  ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS
    .filter(({ affected_concept_ids: conceptIds }) => conceptIds.includes(conceptId))
    .map(({ old_relation_id: oldId, new_relation_id: newId }) => `${oldId}→${newId}`)
    .sort((left, right) => left.localeCompare(right, "en"));

export const validateReviewedRelationReplacements = () => {
  const oldIds = ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS.map(
    ({ old_relation_id: id }) => id,
  );
  const newIds = ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS.map(
    ({ new_relation_id: id }) => id,
  );
  if (new Set(oldIds).size !== oldIds.length || new Set(newIds).size !== newIds.length) {
    throw new Error("Reviewed relation replacements must have unique old and new IDs");
  }
  if (ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS.some((replacement) =>
    replacement.review_status !== "accepted" ||
    replacement.old_relation_id === replacement.new_relation_id ||
    replacement.affected_concept_ids.length < 2)) {
    throw new Error("Reviewed relation replacements contain an incomplete decision");
  }
};

validateReviewedRelationReplacements();
