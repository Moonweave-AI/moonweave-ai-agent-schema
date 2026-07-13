import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ontologyArtifactPath } from "./helpers/ontology-artifact";

type CsvRow = Readonly<Record<string, string>>;

type IndividualClassification =
  | "governance_metadata"
  | "controlled_value"
  | "positive_example"
  | "counterexample"
  | "runtime_reference"
  | "promote_to_concept"
  | "remove_invalid";

interface LegacyIndividual {
  id: string;
  class_id: string;
}

interface ControlledValue {
  id: string;
}

interface StructureField {
  id: string;
  allowed_values: ControlledValue[];
}

interface OntologyExample {
  id: string;
  kind: string;
}

interface CandidateConcept {
  id: string;
  module_id: string;
  structure?: {
    fields: StructureField[];
  };
  examples?: OntologyExample[];
}

interface CandidateRelation {
  id: string;
  examples?: OntologyExample[];
}

interface CandidateOntology {
  planes: Array<{ id: string }>;
  modules: Array<{ id: string }>;
  classes: CandidateConcept[];
  relations: CandidateRelation[];
  ontology_metrics: {
    controlled_values: number;
    legacy_individuals_remaining: number;
  };
  [key: string]: unknown;
}

const repositoryRoot = process.cwd();
const candidatePath = ontologyArtifactPath();
const individualLedgerPath = resolve(
  repositoryRoot,
  "research/ontology-individual-migration-ledger.csv",
);
const legacyIndividualsPath = resolve(
  repositoryRoot,
  "ontology/migration/legacy-v1/individuals.json",
);

const requiredLedgerColumns = [
  "individual_id",
  "current_class_id",
  "classification",
  "target_node_id",
  "target_field_id",
  "target_example_id",
  "action",
  "rationale",
  "reviewer",
  "status",
] as const;

const expectedClassificationByLegacyClass = new Map<string, IndividualClassification>([
  ["PlaneIndividual", "governance_metadata"],
  ["ModuleIndividual", "governance_metadata"],
  ["AdapterFamily", "controlled_value"],
  ["DecisionKind", "controlled_value"],
  ["RiskLevel", "controlled_value"],
  ["Status", "controlled_value"],
  ["TransportKind", "controlled_value"],
  ["Visibility", "controlled_value"],
]);

const acceptedClassifications = new Set<IndividualClassification>([
  "governance_metadata",
  "controlled_value",
  "positive_example",
  "counterexample",
  "runtime_reference",
  "promote_to_concept",
  "remove_invalid",
]);

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
    throw new Error("Unterminated quoted cell in the individual migration ledger");
  }
  if (cell.length > 0 || record.length > 0) {
    record.push(cell);
    records.push(record);
  }

  const [headers, ...rows] = records;
  if (headers === undefined) {
    return [];
  }
  expect(headers).toEqual(requiredLedgerColumns);

  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(
        `Individual ledger row ${index + 2} has ${values.length} cells; expected ${headers.length}`,
      );
    }
    return Object.freeze(
      Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex]])),
    );
  });
};

let cachedCandidate: CandidateOntology | undefined;
let cachedLedger: readonly CsvRow[] | undefined;
let cachedLegacyIndividuals: readonly LegacyIndividual[] | undefined;

const candidateOntology = (): CandidateOntology => {
  expect(
    existsSync(candidatePath),
    `Generate the strict candidate artifact before individual migration validation: ${candidatePath}`,
  ).toBe(true);
  cachedCandidate ??= JSON.parse(readFileSync(candidatePath, "utf8")) as CandidateOntology;
  return cachedCandidate;
};

const individualLedger = (): readonly CsvRow[] => {
  expect(
    existsSync(individualLedgerPath),
    `The reviewed 80-row individual migration ledger is required: ${individualLedgerPath}`,
  ).toBe(true);
  cachedLedger ??= parseCsv(readFileSync(individualLedgerPath));
  return cachedLedger;
};

const legacyIndividuals = (): readonly LegacyIndividual[] => {
  expect(
    existsSync(legacyIndividualsPath),
    `Lossless bootstrap evidence is required: ${legacyIndividualsPath}`,
  ).toBe(true);
  cachedLegacyIndividuals ??= JSON.parse(
    readFileSync(legacyIndividualsPath, "utf8"),
  ) as LegacyIndividual[];
  return cachedLegacyIndividuals;
};

const examplesByNodeId = (ontology: CandidateOntology): Map<string, OntologyExample[]> =>
  new Map([
    ...ontology.classes.map(
      (concept): [string, OntologyExample[]] => [concept.id, concept.examples ?? []],
    ),
    ...ontology.relations.map(
      (relation): [string, OntologyExample[]] => [relation.id, relation.examples ?? []],
    ),
  ]);

describe("candidate ontology legacy individual migration", () => {
  it("contains no top-level individuals array after migration", () => {
    const ontology = candidateOntology();

    expect(Object.hasOwn(ontology, "individuals")).toBe(false);
    expect(ontology.ontology_metrics.legacy_individuals_remaining).toBe(0);
  });

  it("classifies all 80 legacy individuals exactly once with accepted decisions", () => {
    const rows = individualLedger();
    const legacy = legacyIndividuals();
    const legacyById = new Map(legacy.map((individual) => [individual.id, individual]));
    const incompleteRows = rows
      .filter((row) => {
        const classification = row.classification as IndividualClassification;
        return (
          row.status !== "accepted" ||
          !acceptedClassifications.has(classification) ||
          row.action.trim().length === 0 ||
          row.rationale.trim().length === 0 ||
          row.reviewer.trim().length === 0 ||
          legacyById.get(row.individual_id)?.class_id !== row.current_class_id
        );
      })
      .map((row) => row.individual_id);

    expect(legacy).toHaveLength(80);
    expect(rows).toHaveLength(80);
    expect(duplicateValues(rows.map((row) => row.individual_id))).toEqual([]);
    expect([...rows.map((row) => row.individual_id)].sort()).toEqual(
      [...legacyById.keys()].sort(),
    );
    expect(incompleteRows).toEqual([]);
  });

  it("resolves every legacy individual class to its reviewed migration category", () => {
    const unresolved = individualLedger()
      .filter((row) => {
        const expected = expectedClassificationByLegacyClass.get(row.current_class_id);
        return expected === undefined || expected !== row.classification;
      })
      .map(
        (row) =>
          `${row.individual_id}:${row.current_class_id}->${row.classification}`,
      );

    expect(unresolved).toEqual([]);
  });

  it("attaches every migrated controlled value to its declared existing concept field", () => {
    const ontology = candidateOntology();
    const conceptById = new Map(ontology.classes.map((concept) => [concept.id, concept]));
    const invalidAttachments = individualLedger().flatMap((row) => {
      if (row.classification !== "controlled_value") {
        return [];
      }

      const concept = conceptById.get(row.target_node_id);
      const field = concept?.structure?.fields.find(
        (candidateField) => candidateField.id === row.target_field_id,
      );
      const controlledValue = field?.allowed_values.find(
        (value) => value.id === row.individual_id,
      );
      return concept !== undefined && field !== undefined && controlledValue !== undefined
        ? []
        : [
            `${row.individual_id}:${row.target_node_id}/${row.target_field_id}`,
          ];
    });

    expect(invalidAttachments).toEqual([]);
  });

  it("keeps every canonical controlled value inline under a concrete field", () => {
    const ontology = candidateOntology();
    const inlineControlledValues = ontology.classes.flatMap((concept) =>
      (concept.structure?.fields ?? []).flatMap((field) =>
        field.allowed_values.map((value) => ({
          concept_id: concept.id,
          field_id: field.id,
          value_id: value.id,
        })),
      ),
    );
    const invalidInlineValues = inlineControlledValues
      .filter(
        (item) =>
          item.concept_id.trim().length === 0 ||
          item.field_id.trim().length === 0 ||
          item.value_id.trim().length === 0,
      )
      .map((item) => item.value_id);

    expect(Object.hasOwn(ontology, "controlled_values")).toBe(false);
    expect(Object.hasOwn(ontology, "allowed_values")).toBe(false);
    expect(invalidInlineValues).toEqual([]);
    expect(ontology.ontology_metrics.controlled_values).toBe(
      inlineControlledValues.length,
    );
  });

  it("attaches migrated examples and runtime references to an existing node or relation", () => {
    const ontology = candidateOntology();
    const nodeExamples = examplesByNodeId(ontology);
    const expectedKind = new Map<string, string>([
      ["positive_example", "instance"],
      ["counterexample", "counterexample"],
      ["runtime_reference", "case-fragment"],
    ]);
    const invalidAttachments = individualLedger().flatMap((row) => {
      const kind = expectedKind.get(row.classification);
      if (kind === undefined) {
        return [];
      }
      const example = nodeExamples
        .get(row.target_node_id)
        ?.find((candidateExample) => candidateExample.id === row.target_example_id);
      return example?.kind === kind
        ? []
        : [
            `${row.individual_id}:${row.target_node_id}/${row.target_example_id}:${kind}`,
          ];
    });

    expect(invalidAttachments).toEqual([]);
  });

  it("resolves governance, promoted-concept, and removal targets by classification", () => {
    const ontology = candidateOntology();
    const governanceNodeIds = new Set([
      ...ontology.planes.map((plane) => plane.id),
      ...ontology.modules.map((module) => module.id),
    ]);
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const invalidTargets = individualLedger().flatMap((row) => {
      if (row.classification === "governance_metadata") {
        return governanceNodeIds.has(row.target_node_id) ? [] : [row.individual_id];
      }
      if (row.classification === "promote_to_concept") {
        return conceptIds.has(row.target_node_id) ? [] : [row.individual_id];
      }
      if (row.classification === "remove_invalid") {
        return row.target_node_id === "" &&
          row.target_field_id === "" &&
          row.target_example_id === ""
          ? []
          : [row.individual_id];
      }
      return [];
    });

    expect(invalidTargets).toEqual([]);
  });

  it("does not turn PlaneIndividual or ModuleIndividual records into concept nodes", () => {
    const ontology = candidateOntology();
    const conceptIds = new Set(ontology.classes.map((concept) => concept.id));
    const forbiddenClassIds = ["PlaneIndividual", "ModuleIndividual"];
    const forbiddenLegacyNodeIds = individualLedger()
      .filter((row) => forbiddenClassIds.includes(row.current_class_id))
      .map((row) => row.individual_id);

    expect(forbiddenClassIds.filter((id) => conceptIds.has(id))).toEqual([]);
    expect(forbiddenLegacyNodeIds.filter((id) => conceptIds.has(id))).toEqual([]);
  });
});
