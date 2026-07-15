export const reviewedDeprecatedConceptHistory = Object.freeze({
  ActorAuthorityScope: Object.freeze({
    decision: "merge",
    mergeIntoId: "AuthorityScope",
  }),
  ChunkBoundary: Object.freeze({
    decision: "convert_to_field",
    convertToFieldOf: "ChunkMetadata",
  }),
  ChunkContextNote: Object.freeze({
    decision: "convert_to_field",
    convertToFieldOf: "ChunkMetadata",
  }),
  ChunkOverlap: Object.freeze({
    decision: "convert_to_field",
    convertToFieldOf: "ChunkMetadata",
  }),
  ChunkQualitySignal: Object.freeze({
    decision: "convert_to_field",
    convertToFieldOf: "ChunkMetadata",
  }),
  DisclosureStage: Object.freeze({
    decision: "split",
    splitIntoIds: Object.freeze([
      "DisclosureActivity",
      "DisclosurePublicationActivity",
      "DisclosureRecord",
      "DisclosureSelectionActivity",
      "DisclosureSuppressionActivity",
      "DisclosureTruncationActivity",
    ]),
  }),
  ExecutionRequest: Object.freeze({ decision: "deprecate" }),
  HandoffTarget: Object.freeze({ decision: "deprecate" }),
  MCPInteraction: Object.freeze({
    decision: "split",
    splitIntoIds: Object.freeze([
      "MCPMessage",
      "MCPNotification",
      "MCPRequest",
      "MCPResponse",
    ]),
  }),
  WorkerAgent: Object.freeze({ decision: "deprecate" }),
});

export const reviewedConceptHistoryDecision = ({ concept, baselineConcept }) => {
  if (concept.status === "deprecated") {
    const reviewedDecision = reviewedDeprecatedConceptHistory[concept.id];
    if (!reviewedDecision) {
      throw new Error(`Deprecated Concept ${concept.id} lacks a reviewed v3 history decision`);
    }
    return reviewedDecision;
  }
  if (!baselineConcept) return Object.freeze({ decision: "add" });
  if (baselineConcept.module_id !== concept.module_id) {
    return Object.freeze({ decision: "move_owner" });
  }
  if (baselineConcept.semantic_kind !== concept.semantic_kind) {
    return Object.freeze({ decision: "retype" });
  }
  if (baselineConcept.primary_parent_relation_id !== concept.primary_parent_relation_id) {
    return Object.freeze({ decision: "reparent" });
  }
  return Object.freeze({ decision: "keep" });
};
