import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { buildEffectiveConceptStructures } from "./ontology-concept-structure.mjs";
import { stableJson } from "./stable-json.mjs";

const toPascalCase = (value) =>
  value
    .replace(/(^|[-_.:]+)([A-Za-z0-9])/g, (_match, _separator, letter) => letter.toUpperCase())
    .replace(/[^A-Za-z0-9_$]/g, "");

const propertyName = (value) =>
  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : JSON.stringify(value);

const schemaWithoutComposition = (schema) =>
  Object.fromEntries(
    Object.entries(schema).filter(
      ([key]) => !["allOf", "anyOf", "oneOf", "if", "then", "else"].includes(key),
    ),
  );

const schemaEnumValues = (schema, definitions, visited = new Set()) => {
  if (!schema || typeof schema !== "object") return [];
  if (Object.hasOwn(schema, "const")) return [schema.const];
  if (Array.isArray(schema.enum)) return schema.enum;
  if (schema.$ref) {
    const name = schema.$ref.split("/").at(-1);
    if (!name || visited.has(name) || !definitions[name]) return [];
    return schemaEnumValues(definitions[name], definitions, new Set([...visited, name]));
  }
  return [];
};

const conditionalPropertyConst = (entry, property) => {
  if (!entry?.if?.required?.includes(property)) return undefined;
  const condition = entry.if.properties?.[property];
  return condition && Object.hasOwn(condition, "const") ? condition.const : undefined;
};

const findFiniteConditionalDiscriminator = (schema, definitions) => {
  if (!Array.isArray(schema.allOf) || !schema.properties) return null;
  for (const [property, propertySchema] of Object.entries(schema.properties)) {
    const values = schemaEnumValues(propertySchema, definitions);
    if (values.length < 2) continue;
    if (
      schema.allOf.some(
        (entry) => conditionalPropertyConst(entry, property) !== undefined,
      )
    ) {
      return { property, values };
    }
  }
  return null;
};

const joinTypes = (members, operator) => {
  const unique = [...new Set(members.filter((member) => member !== "unknown"))];
  if (unique.length === 0) return "unknown";
  if (unique.length === 1) return unique[0];
  return unique
    .map((member) =>
      member.includes("\n") || /\s[&|]\s/u.test(member) ? `(${member})` : member,
    )
    .join(` ${operator} `);
};

const mergeConditionalPropertySchema = (baseSchema, conditionalSchema) => {
  if (!baseSchema) return conditionalSchema;
  if (
    conditionalSchema.$ref ||
    Object.hasOwn(conditionalSchema, "const") ||
    Array.isArray(conditionalSchema.enum) ||
    Object.hasOwn(conditionalSchema, "type")
  ) {
    return conditionalSchema;
  }
  return { allOf: [baseSchema, conditionalSchema] };
};

const compositionOnly = (schema) =>
  Object.fromEntries(
    ["allOf", "anyOf", "oneOf", "not"]
      .filter((key) => Object.hasOwn(schema, key))
      .map((key) => [key, schema[key]]),
  );

const schemaBaseType = (schema, definitionNames, definitions, level) => {
  if (!schema || Object.keys(schema).length === 0) return "unknown";
  if (schema.$ref) {
    const name = schema.$ref.split("/").at(-1);
    return definitionNames.get(name) ?? toPascalCase(name);
  }
  if (Object.hasOwn(schema, "const")) return JSON.stringify(schema.const);
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (Array.isArray(schema.type)) {
    return schema.type
      .map((type) =>
        schemaType(
          { ...schemaWithoutComposition(schema), type },
          definitionNames,
          definitions,
          level,
        ),
      )
      .join(" | ");
  }
  if (schema.type === "array") {
    return `ReadonlyArray<${schemaType(
      schema.items ?? {},
      definitionNames,
      definitions,
      level,
    )}>`;
  }
  if (schema.type === "string") return "string";
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "null") return "null";
  if (schema.type === "object" || schema.properties || schema.additionalProperties) {
    const entries = Object.entries(schema.properties ?? {});
    if (entries.length === 0) {
      return schema.additionalProperties === false
        ? "Readonly<Record<string, never>>"
        : "Readonly<Record<string, unknown>>";
    }
    const required = new Set(schema.required ?? []);
    const indent = "  ".repeat(level + 1);
    const closingIndent = "  ".repeat(level);
    const properties = entries.map(
      ([name, child]) =>
        `${indent}readonly ${propertyName(name)}${required.has(name) ? "" : "?"}: ${schemaType(
          child,
          definitionNames,
          definitions,
          level + 1,
        )};`,
    );
    if (schema.additionalProperties && schema.additionalProperties !== true) {
      properties.push(
        `${indent}readonly [key: string]: ${schemaType(
          schema.additionalProperties,
          definitionNames,
          definitions,
          level + 1,
        )};`,
      );
    }
    return `{\n${properties.join("\n")}\n${closingIndent}}`;
  }
  return "unknown";
};

function schemaType(schema, definitionNames, definitions, level = 0) {
  if (!schema || Object.keys(schema).length === 0) return "unknown";
  if (schema.$ref || Object.hasOwn(schema, "const") || schema.enum) {
    return schemaBaseType(schema, definitionNames, definitions, level);
  }

  const discriminator = findFiniteConditionalDiscriminator(schema, definitions);
  if (discriminator) {
    const baseSchema = schemaWithoutComposition(schema);
    return joinTypes(
      discriminator.values.map((value) => {
        const activeSchemas = [];
        const unconditionalSchemas = [];
        for (const entry of schema.allOf) {
          const conditionalValue = conditionalPropertyConst(entry, discriminator.property);
          if (conditionalValue === undefined) {
            if (!entry.if) unconditionalSchemas.push(entry);
            continue;
          }
          const activeSchema = Object.is(conditionalValue, value) ? entry.then : entry.else;
          if (activeSchema) activeSchemas.push(activeSchema);
        }
        const required = new Set([
          ...(baseSchema.required ?? []),
          discriminator.property,
        ]);
        let properties = {
          ...(baseSchema.properties ?? {}),
          [discriminator.property]: { const: value },
        };
        for (const activeSchema of activeSchemas) {
          for (const property of activeSchema.required ?? []) required.add(property);
          properties = Object.fromEntries([
            ...Object.entries(properties),
            ...Object.entries(activeSchema.properties ?? {}).map(([name, propertySchema]) => [
              name,
              mergeConditionalPropertySchema(properties[name], propertySchema),
            ]),
          ]);
        }
        const branchBase = {
          ...baseSchema,
          required: [...required],
          properties,
        };
        const branchMembers = [
          schemaBaseType(branchBase, definitionNames, definitions, level),
          ...unconditionalSchemas.map((entry) =>
            schemaType(entry, definitionNames, definitions, level),
          ),
        ];
        for (const activeSchema of activeSchemas) {
          const remainingComposition = compositionOnly(activeSchema);
          if (Object.keys(remainingComposition).length > 0) {
            branchMembers.push(
              schemaType(remainingComposition, definitionNames, definitions, level),
            );
          }
        }
        return joinTypes(branchMembers, "&");
      }),
      "|",
    );
  }

  const baseType = schemaBaseType(
    schemaWithoutComposition(schema),
    definitionNames,
    definitions,
    level,
  );
  const intersectionMembers = baseType === "unknown" ? [] : [baseType];
  for (const entry of schema.allOf ?? []) {
    if (entry.if) continue;
    intersectionMembers.push(schemaType(entry, definitionNames, definitions, level));
  }
  const unionSchemas = schema.oneOf ?? schema.anyOf;
  if (unionSchemas) {
    intersectionMembers.push(
      joinTypes(
        unionSchemas.map((entry) =>
          schemaType(entry, definitionNames, definitions, level),
        ),
        "|",
      ),
    );
  }
  return joinTypes(intersectionMembers, "&");
}

const generationProvenance = (metadata) =>
  metadata
    ? [
        `generator_version=${metadata.generatorVersion}`,
        `source_fingerprint=${metadata.sourceFingerprint}`,
        `artifact_contract_sha256=${metadata.contractFingerprint}`,
        `generated_at=${metadata.generatedAt}`,
      ]
    : [];

export const generateCanonicalTypes = (contract, metadata = null) => {
  const definitions = contract.$defs;
  const definitionNames = new Map(
    Object.keys(definitions).map((name) => [name, toPascalCase(name)]),
  );
  const declarations = Object.entries(definitions).map(
    ([name, schema]) =>
      `export type ${definitionNames.get(name)} = ${schemaType(
        schema,
        definitionNames,
        definitions,
      )};`,
  );
  return [
    "// Generated from schemas/source/agent-ontology-artifact-contract.json.",
    "// Do not edit: change the reviewed artifact contract and rebuild instead.",
    ...generationProvenance(metadata).map((entry) => `// ${entry}`),
    "",
    ...declarations,
    "",
    "export type CanonicalAgentOntology = CanonicalArtifact;",
    "",
  ].join("\n");
};

const strictifySchema = (value) => {
  if (Array.isArray(value)) return value.map(strictifySchema);
  if (!value || typeof value !== "object") return value;
  const result = Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      if (["$defs", "properties", "patternProperties", "dependentSchemas"].includes(key)) {
        return [
          key,
          Object.fromEntries(
            Object.entries(child).map(([name, schema]) => [name, strictifySchema(schema)]),
          ),
        ];
      }
      return [key, strictifySchema(child)];
    }),
  );
  if (Array.isArray(result.required)) {
    result.properties = result.properties ?? {};
    for (const name of result.required) {
      if (!Object.hasOwn(result.properties, name)) result.properties[name] = {};
    }
  }
  if (!Object.hasOwn(result, "type") && !Object.hasOwn(result, "$ref")) {
    if (
      Object.hasOwn(result, "properties") ||
      Object.hasOwn(result, "required") ||
      Object.hasOwn(result, "additionalProperties") ||
      Object.hasOwn(result, "minProperties") ||
      Object.hasOwn(result, "maxProperties")
    ) {
      result.type = "object";
    } else if (
      Object.hasOwn(result, "items") ||
      Object.hasOwn(result, "contains") ||
      Object.hasOwn(result, "minItems") ||
      Object.hasOwn(result, "maxItems") ||
      Object.hasOwn(result, "uniqueItems")
    ) {
      result.type = "array";
    } else if (
      Object.hasOwn(result, "minLength") ||
      Object.hasOwn(result, "maxLength") ||
      Object.hasOwn(result, "pattern") ||
      Object.hasOwn(result, "format")
    ) {
      result.type = "string";
    } else if (
      Object.hasOwn(result, "minimum") ||
      Object.hasOwn(result, "maximum") ||
      Object.hasOwn(result, "exclusiveMinimum") ||
      Object.hasOwn(result, "exclusiveMaximum")
    ) {
      result.type = "number";
    }
  }
  return result;
};

export const generateCanonicalSchema = (contract, metadata = null) => ({
  $schema: contract.$schema,
  $id: `${contract.$id}/canonical`,
  title: "Moonweave canonical Agent Ontology",
  description:
    "Generated strict root schema for the single canonical Agent Ontology artifact.",
  $comment: [
    "Generated from schemas/source/agent-ontology-artifact-contract.json",
    "do_not_edit=true",
    ...generationProvenance(metadata),
  ].join("; "),
  $ref: "#/$defs/canonicalArtifact",
  $defs: strictifySchema(structuredClone(contract.$defs)),
});

const localized = (value, language = "zh") =>
  value?.[language] ?? value?.en ?? value?.ja ?? "";

const renderList = (values, language) =>
  values?.length ? values.map((value) => `  - ${localized(value, language)}`).join("\n") : "  - 不适用";

const renderConcept = ({
  concept,
  depth,
  moduleId,
  childrenByParent,
  conceptById,
  relationById,
  language,
}) => {
  const prefix = "  ".repeat(depth);
  const primaryParent = concept.primary_parent_relation_id
    ? relationById.get(concept.primary_parent_relation_id)
    : null;
  const lines = [
    `${prefix}- **${localized(concept.labels, language) || concept.id}** \`${concept.id}\``,
    `${prefix}  - 定义：${localized(concept.definitions, language)}`,
  ];
  if (primaryParent) lines.push(`${prefix}  - 直接上位：\`${primaryParent.target_id}\``);
  if (concept.why_needed) lines.push(`${prefix}  - 为什么需要：${localized(concept.why_needed, language)}`);
  if (concept.includes) lines.push(`${prefix}  - 包含：\n${renderList(concept.includes, language)}`);
  if (concept.excludes) lines.push(`${prefix}  - 不包含：\n${renderList(concept.excludes, language)}`);
  if (concept.structure) {
    lines.push(
      `${prefix}  - 结构与约束：${concept.structure.fields.length} 个字段，${
        concept.structure.constraints.length + concept.structure.required_relation_constraints.length
      } 条约束`,
    );
  }
  if (concept.examples) lines.push(`${prefix}  - 正反例与实例：${concept.examples.length} 项`);
  if (concept.source_claims) lines.push(`${prefix}  - 直接来源主张：${concept.source_claims.length} 项`);
  for (const childId of childrenByParent.get(concept.id) ?? []) {
    const child = conceptById.get(childId);
    if (!child || child.module_id !== moduleId) continue;
    const primary = child.primary_parent_relation_id
      ? relationById.get(child.primary_parent_relation_id)
      : null;
    if (primary?.target_id !== concept.id) continue;
    lines.push(
      renderConcept({
        concept: child,
        depth: depth + 1,
        moduleId,
        childrenByParent,
        conceptById,
        relationById,
        language,
      }),
    );
  }
  return lines.join("\n");
};

export const generateCanonicalMarkdown = (canonical, generatedAt) => {
  const conceptById = new Map(canonical.classes.map((concept) => [concept.id, concept]));
  const relationById = new Map(canonical.relations.map((relation) => [relation.id, relation]));
  const childrenByParent = new Map(canonical.classes.map(({ id }) => [id, []]));
  for (const relation of canonical.relations) {
    if (relation.predicate === "is_a" && relation.status !== "deprecated") {
      childrenByParent.get(relation.target_id)?.push(relation.source_id);
    }
  }
  childrenByParent.forEach((ids) => ids.sort());
  const moduleByPlane = new Map(canonical.planes.map(({ id }) => [id, []]));
  canonical.modules.forEach((module) => moduleByPlane.get(module.plane_id)?.push(module));
  const conceptsByModule = new Map(canonical.modules.map(({ id }) => [id, []]));
  canonical.classes.forEach((concept) => conceptsByModule.get(concept.module_id)?.push(concept));

  const lines = [
    "# Moonweave Agent Ontology",
    "",
    "> generated: true",
    "> do_not_edit: true",
    "> generated_from: `ontology/source/**`",
    `> source_fingerprint: \`${canonical.artifact_metadata.source_tree_sha256}\``,
    `> generator_version: \`${canonical.artifact_metadata.generator_version}\``,
    `> generated_at: \`${generatedAt}\``,
    "",
    localized(canonical.definitions, "zh"),
    "",
    "所有定义、结构约束、实例、正反例、来源、映射和治理信息都附着于下列同一概念层级中的节点或关系。",
    "",
  ];

  for (const plane of canonical.planes) {
    lines.push(`## ${localized(plane.labels, "zh") || plane.id}`, "", localized(plane.definitions, "zh"), "");
    for (const module of moduleByPlane.get(plane.id) ?? []) {
      lines.push(`### ${localized(module.labels, "zh") || module.id}`, "", localized(module.definitions, "zh"), "");
      const concepts = conceptsByModule.get(module.id) ?? [];
      const moduleConceptIds = new Set(concepts.map(({ id }) => id));
      const roots = concepts.filter((concept) => {
        const parents = canonical.relations.filter(
          (relation) =>
            relation.predicate === "is_a" &&
            relation.status !== "deprecated" &&
            relation.source_id === concept.id,
        );
        return parents.every((relation) => !moduleConceptIds.has(relation.target_id));
      });
      for (const root of roots.sort((left, right) => left.id.localeCompare(right.id))) {
        lines.push(
          renderConcept({
            concept: root,
            depth: 0,
            moduleId: module.id,
            childrenByParent,
            conceptById,
            relationById,
            language: "zh",
          }),
          "",
        );
      }
    }
  }
  lines.push("## 关系合同", "");
  for (const relation of canonical.relations) {
    lines.push(
      `- \`${relation.source_id}\` — **${relation.predicate}** → \`${relation.target_id}\` (\`${relation.id}\`)`,
      relation.definitions ? `  - ${localized(relation.definitions, "zh")}` : "",
    );
  }
  return `${lines.join("\n").replace(/\n{3,}/gu, "\n\n")}\n`;
};

const generatedMetadata = (canonical, generatedAt) => ({
  generated: true,
  generated_from: "ontology/source/**",
  do_not_edit: true,
  generator_version: canonical.artifact_metadata.generator_version,
  source_fingerprint: canonical.artifact_metadata.source_tree_sha256,
  generated_at: generatedAt,
});

const compactDefinition = (canonicalKind, entity, owner = {}) => ({
  canonical_kind: canonicalKind,
  id: entity.id,
  ...owner,
  labels: entity.labels,
  short_definitions: entity.short_definitions ?? null,
  definitions: entity.definitions,
  why_needed: entity.why_needed ?? null,
  source_claims: entity.source_claims ?? [],
  status: entity.status,
});

export const generateDefinitionLedger = (canonical, generatedAt) => ({
  ...generatedMetadata(canonical, generatedAt),
  artifact_type: "generated-canonical-definition-ledger",
  canonical_version: canonical.artifact_metadata.canonical_version,
  definitions: Object.fromEntries([
    [canonical.id, compactDefinition("ontology", canonical)],
    ...canonical.planes.map((plane) => [plane.id, compactDefinition("plane", plane)]),
    ...canonical.modules.map((module) => [
      module.id,
      compactDefinition("module", module, { plane_id: module.plane_id }),
    ]),
    ...canonical.classes.map((concept) => [
      concept.id,
      compactDefinition("concept", concept, { module_id: concept.module_id }),
    ]),
    ...canonical.relations.map((relation) => [
      relation.id,
      compactDefinition("relation", relation, {
        source_id: relation.source_id,
        predicate: relation.predicate,
        target_id: relation.target_id,
      }),
    ]),
  ]),
});

const fieldJsonSchema = (field) => {
  const datatype = field.datatype.toLowerCase();
  const datatypeSchemas = {
    string: { type: "string" },
    reference: { type: "string" },
    integer: { type: "integer" },
    number: { type: "number" },
    boolean: { type: "boolean" },
    object: { type: "object" },
    "date-time": { type: "string", format: "date-time" },
    uri: { type: "string", format: "uri" },
  };
  const itemSchema = datatypeSchemas[datatype];
  if (!itemSchema) throw new Error(`Unsupported field datatype ${field.datatype} on ${field.id}`);
  const constrainedItemSchema = { ...itemSchema };
  if (field.allowed_values?.length) {
    constrainedItemSchema.enum = field.allowed_values.map(({ value }) => value);
  }
  if (field.pattern && constrainedItemSchema.type === "string") {
    constrainedItemSchema.pattern = field.pattern;
  }
  const repeatable = field.cardinality.max === null || field.cardinality.max > 1;
  const schema = repeatable
    ? {
        type: "array",
        items: constrainedItemSchema,
        minItems: field.cardinality.min,
        ...(field.cardinality.max === null ? {} : { maxItems: field.cardinality.max }),
      }
    : constrainedItemSchema;
  return {
    ...schema,
    title: field.labels.en,
    description: field.definitions.en,
    $comment: `canonical_field_id=${field.id}`,
  };
};

const sampleValue = (field, schema) => {
  if (schema.type === "array") {
    if (Array.isArray(field.example_value)) return field.example_value;
    const itemValue = sampleValue(field, schema.items);
    return Array.from(
      { length: Math.max(schema.minItems ?? 0, 1) },
      () => structuredClone(itemValue),
    );
  }
  if (field.example_value !== null && field.example_value !== undefined) return field.example_value;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.format === "date-time") return "2026-07-13T00:00:00.000Z";
  if (schema.type === "integer" || schema.type === "number") return 0;
  if (schema.type === "boolean") return false;
  if (schema.type === "object") return {};
  return `${field.id}-example`;
};

const conceptPayloadProjection = (concept, effectiveStructure) => {
  const fields = effectiveStructure.fields;
  const fieldSchemas = Object.fromEntries(fields.map((field) => [field.id, fieldJsonSchema(field)]));
  const requiredFields = fields
    .filter(({ required, cardinality }) => required || cardinality.min > 0)
    .map(({ id }) => id);
  const schema = {
    type: "object",
    additionalProperties: false,
    title: `${concept.labels.en} payload`,
    description: concept.definitions.en,
    properties: {
      "@type": { const: concept.id },
      ...fieldSchemas,
    },
    required: ["@type", ...requiredFields],
    $comment: JSON.stringify({
      canonical_concept_id: concept.id,
      identity_keys: effectiveStructure.identity_keys,
      node_constraint_ids: effectiveStructure.constraints.map(({ id }) => id),
      required_relation_constraint_ids: effectiveStructure.required_relation_constraints.map(
        ({ id }) => id,
      ),
    }),
  };
  const payload = Object.fromEntries([
    ["@type", concept.id],
    ...fields
      .filter(({ required, example_value: exampleValue }) =>
        required || (exampleValue !== null && exampleValue !== undefined),
      )
      .map((field) => [field.id, sampleValue(field, fieldSchemas[field.id])]),
  ]);
  return { schema, payload };
};

export const generateConceptPayloadArtifacts = (canonical, generatedAt) => {
  const effectiveStructures = buildEffectiveConceptStructures(canonical);
  const projections = canonical.classes.map((concept) => ({
    concept,
    ...conceptPayloadProjection(concept, effectiveStructures.get(concept.id)),
  }));
  return {
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://moonweave.ai/schemas/generated/concept-payloads.schema.json",
      $comment: [
        "generated=true",
        "generated_from=ontology/source/**",
        "do_not_edit=true",
        `generator_version=${canonical.artifact_metadata.generator_version}`,
        `source_fingerprint=${canonical.artifact_metadata.source_tree_sha256}`,
        `generated_at=${generatedAt}`,
      ].join("; "),
      title: "Moonweave generated canonical Concept payload schemas",
      oneOf: projections.map(({ concept }) => ({ $ref: `#/$defs/${concept.id}` })),
      $defs: Object.fromEntries(projections.map(({ concept, schema }) => [concept.id, schema])),
    },
    fixtures: {
      ...generatedMetadata(canonical, generatedAt),
      artifact_type: "generated-canonical-concept-payload-examples",
      examples: projections.map(({ concept, payload }) => ({ concept_id: concept.id, payload })),
    },
  };
};

export const validateGeneratedCanonical = ({ canonical, generatedSchema }) => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(generatedSchema);
  if (!validate(canonical)) {
    throw new Error(
      `Generated canonical failed its strict root schema: ${JSON.stringify(validate.errors, null, 2)}`,
    );
  }
};

export const buildArtifactBytes = ({
  canonical,
  contract,
  contractFingerprint,
  sourceIndex,
  generatedAt,
}) => {
  const provenance = {
    generatorVersion: canonical.artifact_metadata.generator_version,
    sourceFingerprint: canonical.artifact_metadata.source_tree_sha256,
    contractFingerprint,
    generatedAt,
  };
  const generatedSchema = generateCanonicalSchema(contract, provenance);
  validateGeneratedCanonical({ canonical, generatedSchema });
  const conceptPayloadArtifacts = generateConceptPayloadArtifacts(canonical, generatedAt);
  return new Map([
    [
      "fixtures/generated/concept-payload-examples.json",
      stableJson(conceptPayloadArtifacts.fixtures),
    ],
    [
      "ontology/agent-ontology-definitions.json",
      stableJson(generateDefinitionLedger(canonical, generatedAt)),
    ],
    ["ontology/agent-ontology.json", stableJson(canonical)],
    ["ontology/agent-ontology.md", generateCanonicalMarkdown(canonical, generatedAt)],
    ["schemas/agent-ontology.schema.json", stableJson(generatedSchema)],
    [
      "schemas/generated/concept-payloads.schema.json",
      stableJson(conceptPayloadArtifacts.schema),
    ],
    ["src/generated/source-index.json", stableJson(sourceIndex)],
    ["src/lib/canonical-ontology-types.ts", generateCanonicalTypes(contract, provenance)],
  ]);
};
