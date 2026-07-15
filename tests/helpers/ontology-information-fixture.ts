import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildEffectiveConceptStructures } from "../../scripts/lib/ontology-concept-structure.mjs";
import { ontologyArtifactPath } from "./ontology-artifact";

export interface LocalizedText {
  zh?: unknown;
  en?: unknown;
  ja?: unknown;
}

export interface SourceClaim {
  source_id?: unknown;
  supports?: unknown;
  locator?: unknown;
}

export interface OntologyExample {
  id: string;
  kind: "positive" | "counterexample" | "boundary" | "instance" | "case-fragment";
  scenario_id: string | null;
  descriptions: LocalizedText;
  field_values: Record<string, unknown>;
  related_node_ids: string[];
  related_relation_ids: string[];
  expected_result: LocalizedText;
  why_valid_or_invalid: LocalizedText;
  source_claims?: SourceClaim[];
}

export interface InformationOwner {
  id: string;
  labels?: LocalizedText;
  definitions?: LocalizedText;
  purpose?: LocalizedText;
  includes?: LocalizedText[];
  excludes?: LocalizedText[];
  examples?: OntologyExample[];
  source_claims?: SourceClaim[];
  status: string;
}

export interface ControlledValue {
  id: string;
  source_claims?: SourceClaim[];
}

export interface StructureField {
  id: string;
  datatype: string;
  required: boolean;
  cardinality: { min: number; max: number | null };
  allowed_values: ControlledValue[];
  source_claims?: SourceClaim[];
}

export interface Concept extends InformationOwner {
  module_id: string;
  short_definitions?: LocalizedText;
  why_needed?: LocalizedText;
  structure?: {
    identity_keys: string[];
    fields: StructureField[];
    constraints: Array<{ id: string; source_claims?: SourceClaim[] }>;
    required_relation_constraints: Array<{
      id: string;
      direction: "incoming" | "outgoing";
      predicate: string;
      target_concept_id: string;
      cardinality: { min: number; max: number | null };
      source_claims?: SourceClaim[];
    }>;
  };
  external_mappings?: Array<{ id: string; source_claims?: SourceClaim[] }>;
  replaced_by_ids?: string[];
  deprecation_reason?: LocalizedText | null;
}

export interface Relation extends InformationOwner {
  predicate: string;
  source_id: string;
  target_id: string;
  cardinality?: {
    source: { min: number; max: number | null };
    target: { min: number; max: number | null };
  } | null;
  constraints?: Array<{ id: string; source_claims?: SourceClaim[] }>;
  conditions?: Array<{ id: string; source_claims?: SourceClaim[] }>;
}

export interface CompetencyQuestion {
  id: string;
  query: string;
  expected_assertion: string;
  related_module_ids: string[];
  evidence_binding: {
    applicability: "relation-backed" | "boundary-comparison-only" | "owner-only";
    owner_concept_ids: string[];
    related_concept_ids: string[];
    relation_ids: string[];
    not_applicable_reason: LocalizedText | null;
  };
  positive_example_ids: string[];
  counterexample_ids: string[];
}

export interface OntologyModule extends InformationOwner {
  plane_id: string;
  competency_questions?: CompetencyQuestion[];
  interaction_contract?: {
    applicability: "operational" | "descriptive" | "mixed";
    facets: Record<
      "input" | "output" | "failure" | "recovery",
      {
        applicable: boolean;
        description: LocalizedText | null;
        family_concept_ids: string[];
        relation_ids: string[];
        not_applicable_reason: LocalizedText | null;
      }
    >;
  };
}

export interface CasePathStep extends Record<string, unknown> {
  order: number;
  case_fragment_example_id: string;
  traversal_relation_id: string | null;
}

export interface CasePath {
  id: string;
  steps: CasePathStep[];
  source_claims?: SourceClaim[];
}

export interface CandidateOntology extends InformationOwner {
  short_definitions: LocalizedText;
  why_needed: LocalizedText;
  planes: InformationOwner[];
  modules: OntologyModule[];
  classes: Concept[];
  relations: Relation[];
  case_paths: CasePath[];
  global_constraints: Array<{ id: string; source_claims?: SourceClaim[] }>;
  [key: string]: unknown;
}

export interface ExampleWithOwner {
  example: OntologyExample;
  ownerId: string;
  ownerKind: "root" | "plane" | "module" | "concept" | "relation";
}

export interface LocatedSourceClaim {
  path: string;
  claim: SourceClaim;
}

export const repositoryRoot = process.cwd();
const candidatePath = ontologyArtifactPath();
const sourceRegistryPath = resolve(repositoryRoot, "research/source-registry.csv");

let cachedCandidate: CandidateOntology | undefined;
let cachedRegistryIds: ReadonlySet<string> | undefined;

export const candidateOntology = (): CandidateOntology => {
  expect(
    existsSync(candidatePath),
    `Generate the strict candidate artifact before information validation: ${candidatePath}`,
  ).toBe(true);
  cachedCandidate ??= JSON.parse(readFileSync(candidatePath, "utf8")) as CandidateOntology;
  return cachedCandidate;
};

export const parseCsv = (bytes: Buffer): readonly Readonly<Record<string, string>>[] => {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  const csv = bytes.toString("utf8").replace(/^\uFEFF/, "");

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      record.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      record.push(cell);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("Unterminated quoted cell in source-registry.csv");
  if (cell.length > 0 || record.length > 0) {
    record.push(cell);
    records.push(record);
  }

  const [headers, ...rows] = records;
  if (headers === undefined) return [];
  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Source registry row ${index + 2} has ${values.length} cells; expected ${headers.length}`,
      );
    }
    return Object.freeze(
      Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex]])),
    );
  });
};

export const registryIds = (): ReadonlySet<string> => {
  expect(existsSync(sourceRegistryPath), `Missing source registry: ${sourceRegistryPath}`).toBe(true);
  cachedRegistryIds ??= new Set(
    parseCsv(readFileSync(sourceRegistryPath)).map((row) => row.id).filter(Boolean),
  );
  return cachedRegistryIds;
};

export const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isLocalized = (value: unknown): value is LocalizedText =>
  value !== null &&
  typeof value === "object" &&
  ["zh", "en", "ja"].every((language) =>
    hasText((value as Record<string, unknown>)[language]),
  );

export const localizedListIsComplete = (value: unknown): value is LocalizedText[] =>
  Array.isArray(value) && value.length > 0 && value.every(isLocalized);

export const duplicateValues = (values: readonly string[]): string[] => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
};

export const examplesWithOwners = (ontology: CandidateOntology): ExampleWithOwner[] => [
  ...(ontology.examples ?? []).map((example) => ({
    example,
    ownerId: ontology.id,
    ownerKind: "root" as const,
  })),
  ...ontology.planes.flatMap((plane) =>
    (plane.examples ?? []).map((example) => ({
      example,
      ownerId: plane.id,
      ownerKind: "plane" as const,
    })),
  ),
  ...ontology.modules.flatMap((module) =>
    (module.examples ?? []).map((example) => ({
      example,
      ownerId: module.id,
      ownerKind: "module" as const,
    })),
  ),
  ...ontology.classes.flatMap((concept) =>
    (concept.examples ?? []).map((example) => ({
      example,
      ownerId: concept.id,
      ownerKind: "concept" as const,
    })),
  ),
  ...ontology.relations.flatMap((relation) =>
    (relation.examples ?? []).map((example) => ({
      example,
      ownerId: relation.id,
      ownerKind: "relation" as const,
    })),
  ),
];

export const collectSourceClaims = (
  value: unknown,
  path = "$",
  claims: LocatedSourceClaim[] = [],
): LocatedSourceClaim[] => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSourceClaims(item, `${path}[${index}]`, claims));
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "source_claims" && Array.isArray(child)) {
        child.forEach((claim, index) =>
          claims.push({
            path: `${path}.source_claims[${index}]`,
            claim: claim as SourceClaim,
          }),
        );
      } else {
        collectSourceClaims(child, `${path}.${key}`, claims);
      }
    }
  }
  return claims;
};
