import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ontologyArtifactPath } from "./helpers/ontology-artifact";

type CsvRow = Readonly<Record<string, string>>;

interface LocalizedText {
  zh?: string;
  en?: string;
  ja?: string;
}

interface Review {
  review_status: string;
  reviewers: Array<{
    reviewer_id: string;
    reviewer_role: string;
  }>;
}

interface Plane {
  id: string;
}

interface OntologyModule {
  id: string;
  plane_id: string;
  taxonomy_contract: {
    applicability: "specialization" | "flat-root-exception";
    not_applicable_reason: LocalizedText | null;
    review: Review;
  };
}

interface Concept {
  id: string;
  module_id: string;
  primary_parent_relation_id?: string | null;
}

interface Relation {
  id: string;
  predicate: string;
  source_id: string;
  target_id: string;
  relation_kind: string;
}

interface CandidateOntology {
  planes: Plane[];
  modules: OntologyModule[];
  classes: Concept[];
  relations: Relation[];
}

const repositoryRoot = process.cwd();
const candidatePath = ontologyArtifactPath();
const hierarchyLedgerPath = resolve(
  repositoryRoot,
  "research/ontology-concept-hierarchy-migration-ledger.csv",
);

const requiredHierarchyLedgerColumns = [
  "concept_id",
  "current_plane_id",
  "current_module_id",
  "current_kind",
  "decision",
  "proposed_kind",
  "primary_parent_relation_id",
  "additional_parent_relation_ids",
  "target_plane_id",
  "target_module_id",
  "target_concept_id",
  "convert_to_field_id",
  "convert_to_allowed_value_of",
  "merge_into_id",
  "replaced_by_id",
  "definition_action",
  "example_action",
  "source_action",
  "required_new_relation_ids",
  "rationale",
  "reviewer",
  "review_status",
] as const;

const expectedDomainIds = [
  "adapter-plane",
  "feedback-plane",
  "info-plane",
  "memory-plane",
  "orchestration-plane",
  "runtime-plane",
  "safety-plane",
  "tool-plane",
] as const;

const localizedTextIsComplete = (value: LocalizedText | null): boolean =>
  value !== null &&
  [value.zh, value.en, value.ja].every(
    (text) => typeof text === "string" && text.trim().length > 0,
  );

const duplicateValues = (values: readonly string[]): string[] => {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
};

const parseCsv = (bytes: Buffer): readonly CsvRow[] => {
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
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      record.push(cell);
      if (record.some((value) => value.length > 0)) {
        records.push(record);
      }
      record = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) {
    throw new Error("Unterminated quoted cell in the hierarchy migration ledger");
  }
  if (cell.length > 0 || record.length > 0) {
    record.push(cell);
    records.push(record);
  }

  const [headers, ...rows] = records;
  if (headers === undefined) {
    return [];
  }
  expect(headers).toEqual(requiredHierarchyLedgerColumns);

  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Hierarchy ledger row ${index + 2} has ${values.length} cells; expected ${headers.length}`,
      );
    }
    return Object.freeze(
      Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex]])),
    );
  });
};

let cachedCandidate: CandidateOntology | undefined;
let cachedHierarchyLedger: readonly CsvRow[] | undefined;

const candidateOntology = (): CandidateOntology => {
  expect(
    existsSync(candidatePath),
    `Generate the strict candidate artifact before taxonomy validation: ${candidatePath}`,
  ).toBe(true);
  cachedCandidate ??= JSON.parse(readFileSync(candidatePath, "utf8")) as CandidateOntology;
  return cachedCandidate;
};

const hierarchyLedger = (): readonly CsvRow[] => {
  expect(
    existsSync(hierarchyLedgerPath),
    `The 572-row reviewed hierarchy ledger is required: ${hierarchyLedgerPath}`,
  ).toBe(true);
  cachedHierarchyLedger ??= parseCsv(readFileSync(hierarchyLedgerPath));
  return cachedHierarchyLedger;
};

const isARelations = (ontology: CandidateOntology): Relation[] =>
  ontology.relations.filter((relation) => relation.predicate === "is_a");

const cycleParticipants = (
  conceptIds: readonly string[],
  hierarchyRelations: readonly Relation[],
): string[] => {
  const parentsByChild = new Map<string, string[]>();
  for (const relation of hierarchyRelations) {
    parentsByChild.set(relation.source_id, [
      ...(parentsByChild.get(relation.source_id) ?? []),
      relation.target_id,
    ]);
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const inCycle = new Set<string>();

  const visit = (conceptId: string): void => {
    if (active.has(conceptId)) {
      inCycle.add(conceptId);
      return;
    }
    if (visited.has(conceptId)) {
      return;
    }

    active.add(conceptId);
    for (const parentId of parentsByChild.get(conceptId) ?? []) {
      if (active.has(parentId)) {
        inCycle.add(conceptId);
        inCycle.add(parentId);
      } else {
        visit(parentId);
        if (inCycle.has(parentId)) {
          inCycle.add(conceptId);
        }
      }
    }
    active.delete(conceptId);
    visited.add(conceptId);
  };

  for (const conceptId of conceptIds) {
    visit(conceptId);
  }
  return [...inCycle].sort();
};

const splitRelationIds = (value: string): string[] => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error(`Invalid relation-id list in hierarchy ledger: ${value}`);
    }
    return parsed;
  }
  return trimmed.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
};

describe("candidate ontology taxonomy", () => {
  it("keeps exactly eight first-level domains including adapter-plane", () => {
    const ontology = candidateOntology();
    const ids = ontology.planes.map((plane) => plane.id);

    expect(ids).toHaveLength(8);
    expect(duplicateValues(ids)).toEqual([]);
    expect([...ids].sort()).toEqual(expectedDomainIds);
  });

  it("keeps all 41 modules owned by exactly one existing domain", () => {
    const ontology = candidateOntology();
    const domainIds = new Set(ontology.planes.map((plane) => plane.id));
    const invalidOwners = ontology.modules
      .filter((module) => !domainIds.has(module.plane_id))
      .map((module) => `${module.id}:${module.plane_id}`);

    expect(ontology.modules).toHaveLength(41);
    expect(duplicateValues(ontology.modules.map((module) => module.id))).toEqual([]);
    expect(invalidOwners).toEqual([]);
  });

  it("keeps every concept node uniquely owned by one existing module", () => {
    const ontology = candidateOntology();
    const moduleIds = new Set(ontology.modules.map((module) => module.id));
    const invalidOwners = ontology.classes
      .filter((concept) => !moduleIds.has(concept.module_id))
      .map((concept) => `${concept.id}:${concept.module_id}`);

    expect(duplicateValues(ontology.classes.map((concept) => concept.id))).toEqual([]);
    expect(invalidOwners).toEqual([]);
  });

  it("resolves every is_a endpoint to a concept and never to a domain or module", () => {
    const ontology = candidateOntology();
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const organizationalIds = new Set([
      ...ontology.planes.map((plane) => plane.id),
      ...ontology.modules.map((module) => module.id),
    ]);
    const invalidEndpoints = isARelations(ontology).flatMap((relation) =>
      [relation.source_id, relation.target_id]
        .filter((endpoint) => !conceptIds.has(endpoint) || organizationalIds.has(endpoint))
        .map((endpoint) => `${relation.id}:${endpoint}`),
    );

    expect(invalidEndpoints).toEqual([]);
  });

  it("keeps the is_a graph acyclic", () => {
    const ontology = candidateOntology();
    expect(
      cycleParticipants(
        ontology.classes.map((concept) => concept.id),
        isARelations(ontology),
      ),
    ).toEqual([]);
  });

  it("requires every non-root concept to expose at least one is_a parent", () => {
    const ontology = candidateOntology();
    const hierarchyRelations = isARelations(ontology);
    const missingParents = ontology.classes
      .filter((concept) => concept.primary_parent_relation_id != null)
      .filter(
        (concept) =>
          !hierarchyRelations.some((relation) => relation.source_id === concept.id),
      )
      .map((concept) => concept.id);

    expect(missingParents).toEqual([]);
  });

  it("derives at least one module-local root concept for every module", () => {
    const ontology = candidateOntology();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const hierarchyRelations = isARelations(ontology);
    const modulesWithoutRoots = ontology.modules
      .filter((module) => {
        const ownedConcepts = ontology.classes.filter(
          (concept) => concept.module_id === module.id,
        );
        return !ownedConcepts.some((concept) =>
          hierarchyRelations
            .filter((relation) => relation.source_id === concept.id)
            .every(
              (relation) => conceptById.get(relation.target_id)?.module_id !== module.id,
            ),
        );
      })
      .map((module) => module.id);

    expect(modulesWithoutRoots).toEqual([]);
  });

  it("requires a real specialization chain or an accepted flat-root exception", () => {
    const ontology = candidateOntology();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const hierarchyRelations = isARelations(ontology);
    const invalidModules = ontology.modules.flatMap((module) => {
      const hasLocalSpecialization = hierarchyRelations.some(
        (relation) =>
          conceptById.get(relation.source_id)?.module_id === module.id &&
          conceptById.get(relation.target_id)?.module_id === module.id,
      );
      if (module.taxonomy_contract.applicability === "specialization") {
        return hasLocalSpecialization ? [] : [`${module.id}:missing-specialization`];
      }

      const contract = module.taxonomy_contract;
      const acceptedOntologyReviewer = contract.review.reviewers.some(
        (reviewer) =>
          reviewer.reviewer_role === "ontology" && reviewer.reviewer_id.trim().length > 0,
      );
      return !hasLocalSpecialization &&
        localizedTextIsComplete(contract.not_applicable_reason) &&
        contract.review.review_status === "accepted" &&
        acceptedOntologyReviewer
        ? []
        : [`${module.id}:invalid-flat-root-exception`];
    });

    expect(invalidModules).toEqual([]);
  });

  it("requires primary_parent_relation_id to select one outgoing is_a assertion", () => {
    const ontology = candidateOntology();
    const hierarchyRelations = isARelations(ontology);
    const invalidPrimaryParents = ontology.classes.flatMap((concept) => {
      const outgoing = hierarchyRelations.filter(
        (relation) => relation.source_id === concept.id,
      );
      if (outgoing.length === 0) {
        return concept.primary_parent_relation_id == null
          ? []
          : [`${concept.id}:root-has-primary-parent`];
      }
      return outgoing.some(
        (relation) => relation.id === concept.primary_parent_relation_id,
      )
        ? []
        : [`${concept.id}:missing-or-invalid-primary-parent`];
    });

    expect(invalidPrimaryParents).toEqual([]);
  });

  it("represents reviewed multiple inheritance with edges from one concept node", () => {
    const ontology = candidateOntology();
    const hierarchyById = new Map(
      isARelations(ontology).map((relation) => [relation.id, relation]),
    );
    const conceptCounts = new Map<string, number>();
    for (const concept of ontology.classes) {
      conceptCounts.set(concept.id, (conceptCounts.get(concept.id) ?? 0) + 1);
    }

    const invalidMultipleInheritance = hierarchyLedger().flatMap((row) => {
      const additionalRelationIds = splitRelationIds(row.additional_parent_relation_ids ?? "");
      if (additionalRelationIds.length === 0) {
        return [];
      }
      const expectedRelationIds = [
        row.primary_parent_relation_id,
        ...additionalRelationIds,
      ].filter(Boolean);
      const relations = expectedRelationIds.map((id) => hierarchyById.get(id));
      return conceptCounts.get(row.concept_id) === 1 &&
        relations.every(
          (relation) => relation?.source_id === row.concept_id && relation.predicate === "is_a",
        )
        ? []
        : [row.concept_id];
    });

    expect(invalidMultipleInheritance).toEqual([]);
  });

  it("keeps every legacy concept decision unique and accepted in the hierarchy ledger", () => {
    const rows = hierarchyLedger();
    const incomplete = rows
      .filter(
        (row) =>
          row.review_status !== "accepted" ||
          row.reviewer.trim().length === 0 ||
          row.decision.trim().length === 0 ||
          row.rationale.trim().length === 0,
      )
      .map((row) => row.concept_id);

    expect(rows).toHaveLength(572);
    expect(duplicateValues(rows.map((row) => row.concept_id))).toEqual([]);
    expect(incomplete).toEqual([]);
  });

  it("keeps InstructionConflict in the reviewed safety-injection-defense module only", () => {
    const ontology = candidateOntology();
    const concepts = ontology.classes.filter(
      (concept) => concept.id === "InstructionConflict",
    );
    const ledgerRows = hierarchyLedger().filter(
      (row) => row.concept_id === "InstructionConflict",
    );

    expect(concepts).toHaveLength(1);
    expect(concepts[0]?.module_id).toBe("safety-injection-defense");
    expect(ledgerRows).toHaveLength(1);
    expect(ledgerRows[0]?.target_module_id).toBe("safety-injection-defense");
    expect(ledgerRows[0]?.review_status).toBe("accepted");
  });

  it("keeps the approved MCPAdapter to ProtocolAdapter golden hierarchy edge", () => {
    const ontology = candidateOntology();
    const goldenRelations = isARelations(ontology).filter(
      (relation) =>
        relation.source_id === "MCPAdapter" && relation.target_id === "ProtocolAdapter",
    );

    expect(goldenRelations).toHaveLength(1);
    expect(goldenRelations[0]).toMatchObject({
      id: "MCPAdapter-is_a-ProtocolAdapter",
      predicate: "is_a",
      relation_kind: "hierarchy",
    });
  });
});
