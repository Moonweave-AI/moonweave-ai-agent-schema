import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type UnknownRecord = Record<string, unknown>;

const localeKeys = ["zh", "en", "ja"] as const;
const requiredExampleKinds = new Set([
  "positive",
  "counterexample",
  "boundary",
  "instance",
]);
const retiredGovernanceKeys = new Set([
  "review",
  "review_status",
  "reviewers",
  "maturity",
  "maturity_changes",
  "change_history",
  "change_log",
  "adaptation_mapping",
  "adaptation_mappings",
  "axioms",
  "axiom_validation",
  "axioms_and_validation",
]);

const isRecord = (value: unknown): value is UnknownRecord => (
  Boolean(value) && typeof value === "object" && !Array.isArray(value)
);

const nonBlankString = (value: unknown): value is string => (
  typeof value === "string" && value.trim().length > 0
);

const isLocalePlaceholder = (value: string): boolean => {
  const normalized = value.trim();
  return /^(?:\?+|\uFF1F+|\uFFFD+)$/.test(normalized);
};

const nodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  if (entry.isDirectory()) return nodeFiles(entryPath);
  return entry.isFile() && entry.name === "node.yaml" ? [entryPath] : [];
});

const localizedIssues = (
  value: unknown,
  location: string,
  issues: string[],
): void => {
  if (!isRecord(value)) {
    issues.push(`${location} must be a zh/en/ja localized object`);
    return;
  }

  for (const locale of localeKeys) {
    if (!nonBlankString(value[locale])) {
      issues.push(`${location}.${locale} must be non-empty`);
    } else if (isLocalePlaceholder(value[locale])) {
      issues.push(`${location}.${locale} must contain a real localized value rather than a placeholder`);
    }
  }

  for (const key of Object.keys(value)) {
    if (!localeKeys.includes(key as (typeof localeKeys)[number])) {
      issues.push(`${location}.${key} is not a supported locale key; quote punctuation or use a block mapping so the localized text stays intact`);
    }
  }
};

const containsNotApplicablePlaceholder = (value: unknown): boolean => {
  if (typeof value === "string") {
    return /not applicable|不适用|不適用/iu.test(value);
  }
  if (Array.isArray(value)) return value.some(containsNotApplicablePlaceholder);
  return isRecord(value) && Object.values(value).some(containsNotApplicablePlaceholder);
};

const retiredGovernanceIssues = (
  value: unknown,
  location: string,
  issues: string[],
): void => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => retiredGovernanceIssues(entry, `${location}[${index}]`, issues));
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, nested] of Object.entries(value)) {
    if (retiredGovernanceKeys.has(key)) {
      issues.push(`${location}.${key} is a retired governance section or field`);
    }
    retiredGovernanceIssues(nested, `${location}.${key}`, issues);
  }
};

const sourceClaimIssues = (
  value: unknown,
  location: string,
  sourceIds: ReadonlySet<string>,
  claimIds: ReadonlySet<string>,
  issues: string[],
): void => {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(`${location} must contain at least one source claim`);
    return;
  }

  value.forEach((claim, index) => {
    const claimLocation = `${location}[${index}]`;
    if (typeof claim === "string") {
      if (!claimIds.has(claim)) {
        issues.push(`${claimLocation} references unknown claim ${claim}`);
      }
      return;
    }
    if (!isRecord(claim)) {
      issues.push(`${claimLocation} must be a claim id or claim object`);
      return;
    }
    const sourceId = claim.source ?? claim.source_id;
    if (!nonBlankString(sourceId) || !sourceIds.has(sourceId)) {
      issues.push(`${claimLocation} must reference a declared source`);
    }
  });
};

const embeddedClaimIssues = (
  value: unknown,
  location: string,
  sourceIds: ReadonlySet<string>,
  claimIds: ReadonlySet<string>,
  issues: string[],
  topLevel = true,
): void => {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => embeddedClaimIssues(
      entry,
      `${location}[${index}]`,
      sourceIds,
      claimIds,
      issues,
      false,
    ));
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, nested] of Object.entries(value)) {
    if (key === "source_claims" && !topLevel) {
      if (Array.isArray(nested) && nested.length > 0) {
        sourceClaimIssues(nested, `${location}.${key}`, sourceIds, claimIds, issues);
      }
      continue;
    }
    embeddedClaimIssues(nested, `${location}.${key}`, sourceIds, claimIds, issues, false);
  }
};

const declaredRelationIds = (node: UnknownRecord): readonly string[] => {
  const parentRelation = node.parent_relation;
  const parentId = isRecord(parentRelation) && nonBlankString(parentRelation.id)
    ? [parentRelation.id]
    : [];
  const directIds = Array.isArray(node.relations)
    ? node.relations.flatMap((relation) => isRecord(relation) && nonBlankString(relation.id)
      ? [relation.id]
      : [])
    : [];
  const requiredIds = isRecord(node.structure) && Array.isArray(node.structure.required_relations)
    ? node.structure.required_relations.flatMap((relation) => isRecord(relation) && nonBlankString(relation.id)
      ? [relation.id]
      : [])
    : [];
  return [...parentId, ...directIds, ...requiredIds];
};

const validateNode = (path: string, relationIds: ReadonlySet<string>): readonly string[] => {
  const issues: string[] = [];
  const displayPath = relative(resolve("ontology"), path).replaceAll("\\", "/") || "node.yaml";
  const node = parse(readFileSync(path, "utf8")) as unknown;

  if (!isRecord(node)) return [`${displayPath}: document must be a YAML object`];
  const at = (suffix: string): string => `${displayPath}:${suffix}`;

  localizedIssues(node.labels, at("labels"), issues);

  const semantics = node.semantics;
  if (!isRecord(semantics)) {
    issues.push(`${at("semantics")} must be an object`);
  } else {
    localizedIssues(semantics.short_definition, at("semantics.short_definition"), issues);
    localizedIssues(semantics.definition, at("semantics.definition"), issues);
    localizedIssues(semantics.why_needed, at("semantics.why_needed"), issues);
    for (const locale of localeKeys) {
      if (
        isRecord(semantics.short_definition) &&
        isRecord(semantics.definition) &&
        nonBlankString(semantics.short_definition[locale]) &&
        semantics.short_definition[locale] === semantics.definition[locale]
      ) {
        issues.push(`${at(`semantics.short_definition.${locale}`)} must differ from the formal definition`);
      }
    }
    for (const key of ["includes", "excludes"] as const) {
      const entries = semantics[key];
      if (!Array.isArray(entries) || entries.length === 0) {
        issues.push(`${at(`semantics.${key}`)} must contain clear boundary entries`);
      } else {
        entries.forEach((entry, index) => localizedIssues(
          entry,
          at(`semantics.${key}[${index}]`),
          issues,
        ));
      }
    }
  }

  const engineering = node.engineering;
  if (!isRecord(engineering)) {
    issues.push(`${at("engineering")} must be an object`);
  } else {
    localizedIssues(engineering.explanation, at("engineering.explanation"), issues);
    for (const locale of localeKeys) {
      if (
        isRecord(semantics) &&
        isRecord(semantics.definition) &&
        isRecord(engineering.explanation) &&
        nonBlankString(semantics.definition[locale]) &&
        semantics.definition[locale] === engineering.explanation[locale]
      ) {
        issues.push(`${at(`engineering.explanation.${locale}`)} must not repeat the formal definition`);
      }
    }
    for (const key of ["typical_input", "typical_output"] as const) {
      const entries = engineering[key];
      if (!Array.isArray(entries) || entries.length === 0) {
        issues.push(`${at(`engineering.${key}`)} must provide a concrete integration shape`);
      } else if (containsNotApplicablePlaceholder(entries)) {
        issues.push(`${at(`engineering.${key}`)} must not use a not-applicable placeholder`);
      }
    }
    const implementations = engineering.reference_implementations;
    if (!Array.isArray(implementations) || implementations.length === 0) {
      issues.push(`${at("engineering.reference_implementations")} must cite a real implementation or official API`);
    } else {
      implementations.forEach((implementation, index) => {
        if (!isRecord(implementation)) {
          issues.push(`${at(`engineering.reference_implementations[${index}]`)} must be an object`);
          return;
        }
        if (!nonBlankString(implementation.name) || !nonBlankString(implementation.description)) {
          issues.push(`${at(`engineering.reference_implementations[${index}]`)} must name and explain the implementation`);
        }
        if (!nonBlankString(implementation.url) || !implementation.url.startsWith("https://")) {
          issues.push(`${at(`engineering.reference_implementations[${index}].url`)} must be an https URL`);
        }
      });
    }
  }

  const structure = node.structure;
  if (!isRecord(structure)) {
    issues.push(`${at("structure")} must be an object`);
  } else {
    const fields = structure.fields;
    if (!Array.isArray(fields) || fields.length === 0) {
      issues.push(`${at("structure.fields")} must contain explicit fields`);
    } else {
      fields.forEach((field, index) => {
        if (!isRecord(field)) {
          issues.push(`${at(`structure.fields[${index}]`)} must be an object`);
          return;
        }
        if (!nonBlankString(field.id) || !nonBlankString(field.datatype) || typeof field.required !== "boolean") {
          issues.push(`${at(`structure.fields[${index}]`)} must declare id, datatype, and required`);
        }
        localizedIssues(field.labels, at(`structure.fields[${index}].labels`), issues);
        localizedIssues(field.definitions, at(`structure.fields[${index}].definitions`), issues);
        if (!isRecord(field.cardinality) || typeof field.cardinality.min !== "number" || !(typeof field.cardinality.max === "number" || field.cardinality.max === null)) {
          issues.push(`${at(`structure.fields[${index}].cardinality`)} must declare numeric min and numeric-or-null max`);
        }
      });
    }
    const constraints = structure.constraints;
    if (!Array.isArray(constraints) || constraints.length === 0) {
      issues.push(`${at("structure.constraints")} must contain enforceable constraints`);
    } else {
      constraints.forEach((constraint, index) => {
        if (!isRecord(constraint)) {
          issues.push(`${at(`structure.constraints[${index}]`)} must be an object`);
          return;
        }
        if (!nonBlankString(constraint.id) || !nonBlankString(constraint.expression)) {
          issues.push(`${at(`structure.constraints[${index}]`)} must declare id and expression`);
        }
        localizedIssues(constraint.explanation, at(`structure.constraints[${index}].explanation`), issues);
      });
    }
  }

  const sources = Array.isArray(node.sources) ? node.sources : [];
  if (sources.length === 0) issues.push(`${at("sources")} must contain authoritative sources`);
  const sourceIds = new Set<string>();
  sources.forEach((source, index) => {
    if (!isRecord(source)) {
      issues.push(`${at(`sources[${index}]`)} must be an object`);
      return;
    }
    if (!nonBlankString(source.id) || sourceIds.has(source.id)) {
      issues.push(`${at(`sources[${index}].id`)} must be a unique non-empty id`);
    } else {
      sourceIds.add(source.id);
    }
    if (!nonBlankString(source.title) || !nonBlankString(source.source_type) || !nonBlankString(source.relevance)) {
      issues.push(`${at(`sources[${index}]`)} must declare title, source_type, and relevance`);
    }
    if (!nonBlankString(source.url) || !source.url.startsWith("https://")) {
      issues.push(`${at(`sources[${index}].url`)} must be an https URL`);
    }
  });

  const topLevelClaims = Array.isArray(node.source_claims) ? node.source_claims : [];
  if (topLevelClaims.length === 0) issues.push(`${at("source_claims")} must contain evidence claims`);
  const claimIds = new Set<string>();
  topLevelClaims.forEach((claim, index) => {
    if (!isRecord(claim)) {
      issues.push(`${at(`source_claims[${index}]`)} must be a claim object`);
      return;
    }
    if (!nonBlankString(claim.id) || claimIds.has(claim.id)) {
      issues.push(`${at(`source_claims[${index}].id`)} must be a unique non-empty id`);
    } else {
      claimIds.add(claim.id);
    }
    if (!nonBlankString(claim.source) || !sourceIds.has(claim.source)) {
      issues.push(`${at(`source_claims[${index}].source`)} must reference a declared source`);
    }
    for (const key of ["supports", "locator", "evidence_kind", "confidence"] as const) {
      if (!nonBlankString(claim[key])) {
        issues.push(`${at(`source_claims[${index}].${key}`)} must be non-empty`);
      }
    }
  });

  const examples = node.examples;
  if (!Array.isArray(examples) || examples.length === 0) {
    issues.push(`${at("examples")} must contain positive, counterexample, boundary, and instance cases`);
  } else {
    const kinds = new Set<string>();
    examples.forEach((example, index) => {
      if (!isRecord(example)) {
        issues.push(`${at(`examples[${index}]`)} must be an object`);
        return;
      }
      if (!nonBlankString(example.id) || !nonBlankString(example.kind)) {
        issues.push(`${at(`examples[${index}]`)} must declare id and kind`);
      } else {
        kinds.add(example.kind);
        if (!requiredExampleKinds.has(example.kind)) {
          issues.push(`${at(`examples[${index}].kind`)} has an unsupported kind ${example.kind}`);
        }
      }
      localizedIssues(example.labels, at(`examples[${index}].labels`), issues);
      localizedIssues(example.descriptions, at(`examples[${index}].descriptions`), issues);
      localizedIssues(example.expected_result, at(`examples[${index}].expected_result`), issues);
      localizedIssues(example.why_valid_or_invalid, at(`examples[${index}].why_valid_or_invalid`), issues);
      if (!isRecord(example.field_values) || Object.keys(example.field_values).length === 0) {
        issues.push(`${at(`examples[${index}].field_values`)} must show a concrete, inspectable shape`);
      }
      if (!Array.isArray(example.related_relation_ids)) {
        issues.push(`${at(`examples[${index}].related_relation_ids`)} must be an array of declared relation ids`);
      } else {
        example.related_relation_ids.forEach((relationId, relationIndex) => {
          if (!nonBlankString(relationId) || !relationIds.has(relationId)) {
            issues.push(`${at(`examples[${index}].related_relation_ids[${relationIndex}]`)} must reference a declared live relation id`);
          }
        });
      }
      sourceClaimIssues(example.source_claims, at(`examples[${index}].source_claims`), sourceIds, claimIds, issues);
    });
    for (const kind of requiredExampleKinds) {
      if (!kinds.has(kind)) issues.push(`${at("examples")} is missing a ${kind} case`);
    }
  }

  embeddedClaimIssues(node, at("$"), sourceIds, claimIds, issues);
  retiredGovernanceIssues(node, at("$"), issues);
  return issues;
};

describe("manual ontology node quality gate", () => {
  it("requires every retained node to carry distinct semantics, real engineering shapes, examples, constraints, evidence, and no retired governance sections", () => {
    const ontologyRoot = resolve("ontology");
    const paths = nodeFiles(ontologyRoot);
    const relationIds = new Set(paths.flatMap((path) => {
      const node = parse(readFileSync(path, "utf8")) as unknown;
      return isRecord(node) ? declaredRelationIds(node) : [];
    }));
    const issues = paths.flatMap((path) => validateNode(path, relationIds));

    expect(issues.length, issues.slice(0, 80).join("\n")).toBe(0);
  });
});
