/**
 * @deprecated Frozen one-time v1 -> v2 replay policy. Do not import this file
 * into the source-first builder or release pipeline; edit ontology/source/**.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildEffectiveConceptStructures } from "./ontology-concept-structure.mjs";

const VERSION_IRI = "https://moonweave.ai/ontology/agent-system/2.0.0/";
const localized = (zh, en, ja) => ({ zh, en, ja });
const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};
const registryPath = resolve(
  import.meta.dirname,
  "../data/ontology-reviewed-structure-patches.json",
);

export const REVIEWED_STRUCTURE_PATCHES = deepFreeze(
  JSON.parse(readFileSync(registryPath, "utf8")),
);

const V3_ADDITIONAL_STRUCTURE_CONCEPT_IDS = new Set([
  "Instruction",
  "OptimizationLoop",
  "RunAttempt",
]);

export const reviewedStructurePatchesForHistoricalReplay = ({ concepts, relations }) => {
  const conceptIds = new Set(concepts.map(({ id }) => id));
  const hasRequiredFact = (conceptId, constraint) => {
    const outgoing = constraint.direction === "outgoing";
    const sourceId = outgoing ? conceptId : constraint.target_concept_id;
    const targetId = outgoing ? constraint.target_concept_id : conceptId;
    return relations.some(
      (relation) =>
        relation.source_id === sourceId &&
        relation.predicate === constraint.predicate &&
        relation.target_id === targetId,
    );
  };
  return REVIEWED_STRUCTURE_PATCHES.filter((patch) => {
    if (!V3_ADDITIONAL_STRUCTURE_CONCEPT_IDS.has(patch.concept_id)) return true;
    return conceptIds.has(patch.concept_id) &&
      patch.structure.required_relation_constraints.every((constraint) =>
        hasRequiredFact(patch.concept_id, constraint),
      );
  });
};

const duplicateIds = (values) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
};

const mergeById = (existing = [], reviewed = []) => {
  const valuesById = new Map();
  for (const value of existing) valuesById.set(value.id, structuredClone(value));
  for (const value of reviewed) {
    const current = valuesById.get(value.id);
    const next = structuredClone(value);
    if (current?.allowed_values?.length && !next.allowed_values?.length) {
      next.allowed_values = structuredClone(current.allowed_values);
      if (
        !next.allowed_values.some(({ value }) => Object.is(value, next.example_value))
      ) {
        next.example_value = structuredClone(current.example_value);
      }
    }
    if (current?.source_claims?.length && next.source_claims) {
      const claims = [...current.source_claims, ...next.source_claims];
      next.source_claims = [...new Map(
        claims.map((sourceClaim) => [
          [sourceClaim.source_id, sourceClaim.locator, sourceClaim.supports].join("\0"),
          structuredClone(sourceClaim),
        ]),
      ).values()];
    }
    valuesById.set(value.id, next);
  }
  return [...valuesById.values()];
};

const LEGACY_MODULE_OWNER_BY_CONCEPT_ID = new Map([
  ["DelegationContract", "orchestration-actors-delegation"],
  ["Instruction", "info-messages-instructions"],
  ["NetworkCall", "safety-sandbox-network"],
  ["OptimizationLoop", "feedback-review-optimization"],
  ["Redaction", "safety-commit-redaction"],
  ["RunAttempt", "runtime-system"],
]);

const assertRegistry = ({ patches, conceptById }) => {
  const duplicateConceptIds = duplicateIds(patches.map(({ concept_id: id }) => id));
  if (duplicateConceptIds.length) {
    throw new Error(`Reviewed structure patches repeat Concepts: ${duplicateConceptIds.join(", ")}`);
  }
  for (const patch of patches) {
    const concept = conceptById.get(patch.concept_id);
    if (!concept) throw new Error(`Reviewed structure target ${patch.concept_id} does not resolve`);
    const legacyOwner = LEGACY_MODULE_OWNER_BY_CONCEPT_ID.get(patch.concept_id);
    if (concept.module_id !== patch.module_id && concept.module_id !== legacyOwner) {
      throw new Error(
        `Reviewed structure target ${patch.concept_id} must be owned by ${patch.module_id}, found ${concept.module_id}`,
      );
    }
    const { identity_keys: identityKeys, fields, constraints, required_relation_constraints: relationConstraints } =
      patch.structure;
    for (const [kind, values] of [
      ["field", fields],
      ["constraint", constraints],
      ["required relation constraint", relationConstraints],
    ]) {
      const duplicates = duplicateIds(values.map(({ id }) => id));
      if (duplicates.length) {
        throw new Error(`${patch.concept_id} repeats ${kind} IDs: ${duplicates.join(", ")}`);
      }
    }
    const fieldIds = new Set(fields.map(({ id }) => id));
    const unresolvedIdentityKeys = identityKeys.filter((id) => !fieldIds.has(id));
    if (unresolvedIdentityKeys.length) {
      throw new Error(
        `${patch.concept_id} identity keys do not resolve to reviewed local fields: ${unresolvedIdentityKeys.join(", ")}`,
      );
    }
    for (const relationConstraint of relationConstraints) {
      if (!conceptById.has(relationConstraint.target_concept_id)) {
        throw new Error(
          `${patch.concept_id} relation target ${relationConstraint.target_concept_id} does not resolve`,
        );
      }
    }
  }
};

export const applyReviewedStructurePatches = (
  concepts,
  patches = REVIEWED_STRUCTURE_PATCHES,
) => {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
  assertRegistry({ patches, conceptById });
  const patchByConceptId = new Map(patches.map((patch) => [patch.concept_id, patch]));
  return concepts.map((concept) => {
    const patch = patchByConceptId.get(concept.id);
    if (!patch) return structuredClone(concept);
    const current = concept.structure ?? {
      identity_keys: [],
      fields: [],
      constraints: [],
      required_relation_constraints: [],
    };
    const fields = mergeById(current.fields, patch.structure.fields);
    const identityKeys = [
      ...new Set([...current.identity_keys, ...patch.structure.identity_keys]),
    ];
    const mergedFieldIds = new Set(fields.map(({ id }) => id));
    const unresolvedIdentityKeys = identityKeys.filter((id) => !mergedFieldIds.has(id));
    if (unresolvedIdentityKeys.length) {
      throw new Error(
        `${concept.id} merged identity keys do not resolve to fields: ${unresolvedIdentityKeys.join(", ")}`,
      );
    }
    return {
      ...structuredClone(concept),
      structure: {
        identity_keys: identityKeys,
        fields,
        constraints: mergeById(current.constraints, patch.structure.constraints),
        required_relation_constraints: mergeById(
          current.required_relation_constraints,
          patch.structure.required_relation_constraints,
        ),
      },
    };
  });
};

export const REVIEWED_SUBTYPE_DISCRIMINATORS = deepFreeze([
  {
    parent_id: "Message",
    field_id: "message_role",
    children: [
      ["AssistantMessage", "assistant", { sender_id: "AgentActor:assistant-001", receiver_id: "UserActor:user-001" }],
      ["DeveloperMessage", "developer", { sender_id: "HumanActor:developer-001", receiver_id: "AgentActor:assistant-001" }],
      ["ExternalAgentMessage", "external-agent", { sender_id: "RemoteAgent:external-001", receiver_id: "AgentActor:assistant-001" }],
      ["SystemMessage", "system", { sender_id: "RuntimeSystem:system-001", receiver_id: "AgentActor:assistant-001" }],
      ["ToolObservationMessage", "tool", { sender_id: "Tool:tool-001", receiver_id: "AgentActor:assistant-001" }],
      ["ToolResultMessage", "tool", { sender_id: "Tool:tool-001", receiver_id: "AgentActor:assistant-001" }],
      ["UserMessage", "user", { sender_id: "UserActor:user-001", receiver_id: "AgentActor:assistant-001" }],
    ],
  },
  {
    parent_id: "ContentBlock",
    field_id: "modality",
    children: [
      ["AudioBlock", "audio", { block_id: "block-audio-001", mime_type: "audio/wav", encoding: "binary" }],
      ["CodeBlock", "code", { block_id: "block-code-001", mime_type: "text/x-code", encoding: "utf-8" }],
      ["FileAttachmentBlock", "file", { block_id: "block-file-001", mime_type: "application/octet-stream", encoding: "binary" }],
      ["ImageBlock", "image", { block_id: "block-image-001", mime_type: "image/png", encoding: "binary" }],
      ["StructuredDataBlock", "structured-data", { block_id: "block-data-001", mime_type: "application/json", encoding: "utf-8" }],
      ["TableBlock", "table", { block_id: "block-table-001", mime_type: "text/csv", encoding: "utf-8" }],
      ["TextBlock", "text", { block_id: "block-text-001", mime_type: "text/plain", encoding: "utf-8" }],
    ],
  },
]);

const controlledDiscriminatorValue = ({ field, value, childId }) => ({
  id: `${field.id}_${String(value).replaceAll(/[^A-Za-z0-9]+/gu, "_")}`,
  value,
  labels: localized(value, value, value),
  definitions: localized(
    `${value} 是 ${field.labels.zh} 的受控值，并由 ${childId} 下位概念进一步限定。`,
    `${value} is a controlled ${field.labels.en} value further constrained by the ${childId} subtype.`,
    `${value} は ${field.labels.ja} の統制値で、${childId} 下位概念によりさらに限定されます。`,
  ),
  status: "accepted",
  source_claims: field.source_claims.map((sourceClaim) => ({
    ...structuredClone(sourceClaim),
    supports: `Supports the reviewed ${field.id} discriminator value ${value} for ${childId}.`,
  })),
});

export const applyReviewedSubtypeDiscriminators = ({
  concepts,
  relations,
  specifications = REVIEWED_SUBTYPE_DISCRIMINATORS,
}) => specifications.reduce((currentConcepts, specification) => {
  const conceptById = new Map(currentConcepts.map((concept) => [concept.id, concept]));
  const parent = conceptById.get(specification.parent_id);
  if (!parent) throw new Error(`Subtype discriminator parent ${specification.parent_id} does not resolve`);
  const parentField = parent.structure?.fields.find(({ id }) => id === specification.field_id);
  if (!parentField) {
    throw new Error(
      `Subtype discriminator field ${specification.parent_id}.${specification.field_id} does not resolve`,
    );
  }
  const directChildren = new Set(
    relations
      .filter(
        (relation) =>
          relation.predicate === "is_a" && relation.target_id === specification.parent_id,
      )
      .map(({ source_id: sourceId }) => sourceId),
  );
  const controlledByValue = new Map();
  for (const [childId, value] of specification.children) {
    if (!conceptById.has(childId) || !directChildren.has(childId)) {
      throw new Error(`${childId} must be a direct is_a child of ${specification.parent_id}`);
    }
    if (!controlledByValue.has(value)) {
      controlledByValue.set(
        value,
        controlledDiscriminatorValue({ field: parentField, value, childId }),
      );
    }
  }
  const reviewedParentField = {
    ...structuredClone(parentField),
    allowed_values: [...controlledByValue.values()].map((value) => structuredClone(value)),
  };
  const updatedById = new Map([
    [
      parent.id,
      {
        ...structuredClone(parent),
        structure: {
          ...structuredClone(parent.structure),
          fields: parent.structure.fields.map((field) =>
            field.id === reviewedParentField.id ? reviewedParentField : structuredClone(field),
          ),
        },
      },
    ],
  ]);
  for (const [childId, value, fieldExamples] of specification.children) {
    const child = conceptById.get(childId);
    const reviewedFields = [
      ...Object.entries({ [specification.field_id]: value, ...fieldExamples }).map(
        ([fieldId, exampleValue]) => {
          const baseField = parent.structure.fields.find(({ id }) => id === fieldId);
          if (!baseField) {
            throw new Error(`Subtype discriminator override ${childId}.${fieldId} does not resolve`);
          }
          return {
            ...structuredClone(baseField),
            allowed_values:
              fieldId === specification.field_id
                ? [structuredClone(controlledByValue.get(value))]
                : structuredClone(baseField.allowed_values),
            example_value: structuredClone(exampleValue),
          };
        },
      ),
    ];
    const reviewedFieldById = new Map(reviewedFields.map((field) => [field.id, field]));
    const currentStructure = child.structure ?? {
      identity_keys: [],
      fields: [],
      constraints: [],
      required_relation_constraints: [],
    };
    updatedById.set(childId, {
      ...structuredClone(child),
      structure: {
        ...structuredClone(currentStructure),
        fields: [
          ...currentStructure.fields
            .filter(({ id }) => !reviewedFieldById.has(id))
            .map((field) => structuredClone(field)),
          ...reviewedFields,
        ],
      },
    });
  }
  return currentConcepts.map((concept) =>
    structuredClone(updatedById.get(concept.id) ?? concept),
  );
}, concepts.map((concept) => structuredClone(concept)));

const uniqueClaims = (claims) => {
  const byIdentity = new Map();
  for (const sourceClaim of claims) {
    const key = [sourceClaim.source_id, sourceClaim.locator, sourceClaim.supports].join("\0");
    if (!byIdentity.has(key)) byIdentity.set(key, structuredClone(sourceClaim));
  }
  return [...byIdentity.values()];
};

const structuredInstanceExample = (concept, fields) => {
  const labels = concept.labels;
  return {
    id: `${concept.id}-example-instance-001`,
    kind: "instance",
    labels: localized(
      `${labels.zh}结构化实例`,
      `Structured instance of ${labels.en}`,
      `${labels.ja}の構造化インスタンス`,
    ),
    scenario_id: null,
    descriptions: localized(
      `该合成记录逐项使用${labels.zh}节点内“结构与约束”字段中可用的非空样例值，用于验证信息附着于节点而不生成实例图。`,
      `This synthetic record uses every available non-null field example from the ${labels.en} node's structure contract to validate inline information without creating an instance graph.`,
      `この合成記録は${labels.ja}ノードの構造契約にある利用可能な非空フィールド例を用い、インスタンスグラフを作らずノード内情報を検証します。`,
    ),
    field_values: Object.fromEntries(
      fields
        .filter(
          (field) =>
            field.example_value !== null && field.example_value !== undefined,
        )
        .map((field) => {
          const repeatable = field.cardinality.max === null || field.cardinality.max > 1;
          const value = repeatable && !Array.isArray(field.example_value)
            ? [field.example_value]
            : field.example_value;
          return [field.id, structuredClone(value)];
        }),
    ),
    related_node_ids: [concept.id],
    related_relation_ids: [],
    expected_result: localized(
      "字段值通过该 Concept 的结构与约束验证，且实例仅作为节点内说明信息显示。",
      "Field values satisfy the Concept structure contract, and the instance remains explanatory information on the node.",
      "フィールド値は Concept の構造契約を満たし、インスタンスはノード内の説明情報として保持されます。",
    ),
    why_valid_or_invalid: localized(
      "每个字段键与节点字段 ID 完全一致；单值直接取经审查样例，可重复字段按其基数组装为数组。",
      "Every field key exactly matches a node field ID; scalar values come from reviewed examples and repeatable fields are assembled as arrays according to cardinality.",
      "各フィールドキーはノードのフィールド ID と一致し、単一値はレビュー済み例から取得し、反復可能フィールドは基数に従って配列化します。",
    ),
    synthetic: true,
    verified_version: VERSION_IRI,
    source_claims: uniqueClaims(fields.flatMap(({ source_claims: claims }) => claims)),
  };
};

export const addStructuredInstanceExamples = (concepts, relations = []) => {
  const effectiveByConceptId = buildEffectiveConceptStructures({
    classes: concepts,
    relations,
  });
  return concepts.map((concept) => {
    const cloned = structuredClone(concept);
    const fields = effectiveByConceptId.get(concept.id)?.fields ?? [];
    if (!fields.length) return cloned;
    const instance = structuredInstanceExample(cloned, fields);
    return {
      ...cloned,
      examples: [
        ...(cloned.examples ?? []).filter(({ id }) => id !== instance.id),
        instance,
      ],
    };
  });
};
