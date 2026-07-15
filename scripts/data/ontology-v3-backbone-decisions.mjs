import { ADAPTER_BACKBONE_RELATION_DECISIONS } from "./backbone/adapter-relations.mjs";
import { ADAPTER_ROOT_STATUS_DECISIONS } from "./backbone/adapter-roots.mjs";
import { ADAPTER_SIBLING_COMPARISON_DECISIONS } from "./backbone/adapter-siblings.mjs";
import { FEEDBACK_BACKBONE_RELATION_DECISIONS } from "./backbone/feedback-relations.mjs";
import { FEEDBACK_ROOT_STATUS_DECISIONS } from "./backbone/feedback-roots.mjs";
import { FEEDBACK_SIBLING_COMPARISON_DECISIONS } from "./backbone/feedback-siblings.mjs";
import { INFO_BACKBONE_RELATION_DECISIONS } from "./backbone/info-relations.mjs";
import { INFO_ROOT_STATUS_DECISIONS } from "./backbone/info-roots.mjs";
import { INFO_SIBLING_COMPARISON_DECISIONS } from "./backbone/info-siblings.mjs";
import { MEMORY_BACKBONE_RELATION_DECISIONS } from "./backbone/memory-relations.mjs";
import { MEMORY_ROOT_STATUS_DECISIONS } from "./backbone/memory-roots.mjs";
import { MEMORY_SIBLING_COMPARISON_DECISIONS } from "./backbone/memory-siblings.mjs";
import { ORCHESTRATION_BACKBONE_RELATION_DECISIONS } from "./backbone/orchestration-relations.mjs";
import { ORCHESTRATION_ROOT_STATUS_DECISIONS } from "./backbone/orchestration-roots.mjs";
import { ORCHESTRATION_SIBLING_COMPARISON_DECISIONS } from "./backbone/orchestration-siblings.mjs";
import { RUNTIME_BACKBONE_RELATION_DECISIONS } from "./backbone/runtime-relations.mjs";
import { RUNTIME_ROOT_STATUS_DECISIONS } from "./backbone/runtime-roots.mjs";
import { RUNTIME_SIBLING_COMPARISON_DECISIONS } from "./backbone/runtime-siblings.mjs";
import { SAFETY_BACKBONE_RELATION_DECISIONS } from "./backbone/safety-relations.mjs";
import { SAFETY_ROOT_STATUS_DECISIONS } from "./backbone/safety-roots.mjs";
import { SAFETY_SIBLING_COMPARISON_DECISIONS } from "./backbone/safety-siblings.mjs";
import { TOOL_BACKBONE_RELATION_DECISIONS } from "./backbone/tool-relations.mjs";
import { TOOL_ROOT_STATUS_DECISIONS } from "./backbone/tool-roots.mjs";
import { TOOL_SIBLING_COMPARISON_DECISIONS } from "./backbone/tool-siblings.mjs";

const freezeCombined = (...groups) => Object.freeze(groups.flat());

export const ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS = freezeCombined(
  ADAPTER_BACKBONE_RELATION_DECISIONS,
  FEEDBACK_BACKBONE_RELATION_DECISIONS,
  INFO_BACKBONE_RELATION_DECISIONS,
  MEMORY_BACKBONE_RELATION_DECISIONS,
  ORCHESTRATION_BACKBONE_RELATION_DECISIONS,
  RUNTIME_BACKBONE_RELATION_DECISIONS,
  SAFETY_BACKBONE_RELATION_DECISIONS,
  TOOL_BACKBONE_RELATION_DECISIONS,
);

export const ONTOLOGY_V3_ROOT_STATUS_DECISIONS = freezeCombined(
  ADAPTER_ROOT_STATUS_DECISIONS,
  FEEDBACK_ROOT_STATUS_DECISIONS,
  INFO_ROOT_STATUS_DECISIONS,
  MEMORY_ROOT_STATUS_DECISIONS,
  ORCHESTRATION_ROOT_STATUS_DECISIONS,
  RUNTIME_ROOT_STATUS_DECISIONS,
  SAFETY_ROOT_STATUS_DECISIONS,
  TOOL_ROOT_STATUS_DECISIONS,
);

export const ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS = freezeCombined(
  ADAPTER_SIBLING_COMPARISON_DECISIONS,
  FEEDBACK_SIBLING_COMPARISON_DECISIONS,
  INFO_SIBLING_COMPARISON_DECISIONS,
  MEMORY_SIBLING_COMPARISON_DECISIONS,
  ORCHESTRATION_SIBLING_COMPARISON_DECISIONS,
  RUNTIME_SIBLING_COMPARISON_DECISIONS,
  SAFETY_SIBLING_COMPARISON_DECISIONS,
  TOOL_SIBLING_COMPARISON_DECISIONS,
);

const duplicateIds = (rows) => {
  const counts = new Map();
  for (const [id] of rows) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
};

export const validateOntologyV3BackboneDecisions = ({ concepts, relations }) => {
  for (const [name, rows] of [
    ["backbone", ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS],
    ["root", ONTOLOGY_V3_ROOT_STATUS_DECISIONS],
    ["sibling", ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS],
  ]) {
    const duplicates = duplicateIds(rows);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate explicit ${name} decisions: ${duplicates.join(", ")}`);
    }
  }

  const acceptedConcepts = new Map(
    [...concepts].filter(([, concept]) => concept.status === "accepted"),
  );
  const acceptedRelations = new Map(
    [...relations].filter(([, relation]) => relation.status === "accepted"),
  );
  if (ONTOLOGY_V3_ROOT_STATUS_DECISIONS.length !== acceptedConcepts.size) {
    throw new Error(
      `Explicit root decisions cover ${ONTOLOGY_V3_ROOT_STATUS_DECISIONS.length} of ${acceptedConcepts.size} accepted concepts`,
    );
  }
  const rootByConcept = new Map(ONTOLOGY_V3_ROOT_STATUS_DECISIONS);
  const backboneByRelation = new Map(
    ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS.map(([id, role, parentId, childId]) => [
      id,
      { role, parentId, childId },
    ]),
  );
  const primaryByChild = new Map();
  for (const [relationId, decision] of backboneByRelation) {
    const relation = acceptedRelations.get(relationId);
    if (!relation) throw new Error(`Explicit backbone relation is not accepted: ${relationId}`);
    const endpointIds = new Set([relation.source_id, relation.target_id]);
    if (
      !endpointIds.has(decision.parentId) ||
      !endpointIds.has(decision.childId) ||
      decision.parentId === decision.childId
    ) {
      throw new Error(`Explicit layout endpoints do not match ${relationId}`);
    }
    if (decision.role === "primary-backbone") {
      if (primaryByChild.has(decision.childId)) {
        throw new Error(`Multiple explicit primary backbones for ${decision.childId}`);
      }
      primaryByChild.set(decision.childId, relationId);
    }
  }
  for (const [conceptId, concept] of acceptedConcepts) {
    if (!rootByConcept.has(conceptId)) throw new Error(`Missing explicit root decision: ${conceptId}`);
    const rootStatus = rootByConcept.get(conceptId);
    if ((rootStatus === null) !== primaryByChild.has(conceptId)) {
      throw new Error(`Root/backbone decision mismatch for ${conceptId}`);
    }
    if (concept.id !== conceptId) throw new Error(`Invalid concept index for ${conceptId}`);
  }
  for (const [conceptId, siblingId, parentId] of ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS) {
    const concept = acceptedConcepts.get(conceptId);
    const sibling = acceptedConcepts.get(siblingId);
    if (!concept || !sibling) throw new Error(`Missing explicit sibling endpoint for ${conceptId}`);
    if (
      concept.module_id !== sibling.module_id ||
      concept.semantic_kind !== sibling.semantic_kind ||
      conceptId === siblingId ||
      primaryByChild.get(conceptId) == null ||
      primaryByChild.get(siblingId) == null
    ) {
      throw new Error(`Invalid explicit sibling comparison ${conceptId} -> ${siblingId}`);
    }
    const conceptBackbone = backboneByRelation.get(primaryByChild.get(conceptId));
    const siblingBackbone = backboneByRelation.get(primaryByChild.get(siblingId));
    if (conceptBackbone?.parentId !== parentId || siblingBackbone?.parentId !== parentId) {
      throw new Error(`Sibling comparison does not share explicit parent ${parentId}`);
    }
  }
};
