import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type LocalizedText = Readonly<Record<string, string>>;

type Example = {
  readonly id: string;
  readonly labels: LocalizedText;
  readonly descriptions: LocalizedText;
};

type SourceClaim = {
  readonly source_id: string;
};

type SourceClaimOwner = {
  readonly id: string;
  readonly examples?: readonly Example[];
  readonly source_claims?: readonly SourceClaim[];
};

type Plane = SourceClaimOwner;

type Module = SourceClaimOwner & {
  readonly plane_id: string;
};

type Concept = SourceClaimOwner & {
  readonly module_id: string;
  readonly primary_parent_relation_id: string | null;
};

type Relation = SourceClaimOwner & {
  readonly predicate: string;
  readonly relation_kind: string;
  readonly source_id: string;
  readonly target_id: string;
};

type CaseStep = {
  readonly order: number;
  readonly case_fragment_example_id: string;
  readonly traversal_relation_id: string | null;
};

type CasePath = SourceClaimOwner & {
  readonly steps: readonly CaseStep[];
};

type CanonicalArtifact = SourceClaimOwner & {
  readonly planes: readonly Plane[];
  readonly modules: readonly Module[];
  readonly classes: readonly Concept[];
  readonly relations: readonly Relation[];
  readonly case_paths: readonly CasePath[];
};

type SourceIndex = {
  readonly sources: readonly { readonly id: string }[];
};

const generated = <T>(name: string): T => JSON.parse(readFileSync(resolve(
  "src",
  "generated",
  name,
), "utf8")) as T;

const artifact = generated<CanonicalArtifact>("agent-ontology.json");
const sourceIndex = generated<SourceIndex>("source-index.json");
const documentedItems = [
  ...artifact.planes,
  ...artifact.modules,
  ...artifact.classes,
];
const exampleOwners = [artifact, ...documentedItems, ...artifact.relations];

const assertAcyclicHierarchy = (relations: readonly Relation[]) => {
  const parentsByChild = new Map<string, readonly string[]>();
  for (const relation of relations.filter(({ predicate }) => predicate === "is_a")) {
    parentsByChild.set(
      relation.source_id,
      [...(parentsByChild.get(relation.source_id) ?? []), relation.target_id],
    );
  }
  const complete = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string): void => {
    if (complete.has(id)) return;
    expect(visiting.has(id), `hierarchy cycle includes ${id}`).toBe(false);
    visiting.add(id);
    for (const parent of parentsByChild.get(id) ?? []) visit(parent);
    visiting.delete(id);
    complete.add(id);
  };
  for (const id of parentsByChild.keys()) visit(id);
};

describe("ontology examples upgrade consumer contract", () => {
  it("keeps the generated artifact free of the retired example kind classification", () => {
    const examples = exampleOwners.flatMap((item) => item.examples ?? []);

    expect(examples.length).toBeGreaterThan(0);
    for (const example of examples) {
      expect(Object.hasOwn(example, "kind")).toBe(false);
      expect(example.id.trim()).not.toHaveLength(0);
      expect(example.labels.en?.trim()).not.toHaveLength(0);
      expect(example.descriptions.en?.trim()).not.toHaveLength(0);
    }
  });

  it("ships the authoritative-source baseline and keeps every published claim identified", () => {
    expect(new Set(sourceIndex.sources.map((source) => source.id)).size).toBeGreaterThanOrEqual(66);
    expect(new Set(documentedItems.map((item) => item.id)).size).toBe(documentedItems.length);
    for (const item of exampleOwners) {
      for (const claim of item.source_claims ?? []) {
        expect(claim.source_id.trim(), `${item.id} has an empty source reference`).not.toHaveLength(0);
      }
    }
  });

  it("continues to publish a connected, browseable hierarchy with valid ownership and relation endpoints", () => {
    expect(artifact.id.trim()).not.toHaveLength(0);
    expect(artifact.planes.length).toBeGreaterThan(0);
    expect(artifact.modules.length).toBeGreaterThan(0);
    expect(artifact.classes.length).toBeGreaterThan(0);

    const planeIds = new Set(artifact.planes.map(({ id }) => id));
    const moduleIds = new Set(artifact.modules.map(({ id }) => id));
    const conceptIds = new Set(artifact.classes.map(({ id }) => id));
    const relationIds = new Set(artifact.relations.map(({ id }) => id));
    const entityIds = new Set([...planeIds, ...moduleIds, ...conceptIds]);

    expect(entityIds.size).toBe(documentedItems.length);
    for (const module of artifact.modules) expect(planeIds.has(module.plane_id)).toBe(true);
    for (const concept of artifact.classes) {
      expect(moduleIds.has(concept.module_id)).toBe(true);
      if (!concept.primary_parent_relation_id) continue;
      const parentRelation = artifact.relations.find(({ id }) => id === concept.primary_parent_relation_id);
      expect(parentRelation, `${concept.id} has a missing primary parent relation`).toBeDefined();
      expect(
        parentRelation?.source_id === concept.id || parentRelation?.target_id === concept.id,
        `${concept.id} primary parent relation does not touch the concept`,
      ).toBe(true);
    }
    for (const relation of artifact.relations) {
      expect(relation.id.trim()).not.toHaveLength(0);
      expect(relation.predicate.trim()).not.toHaveLength(0);
      expect(relation.relation_kind.trim()).not.toHaveLength(0);
      expect(entityIds.has(relation.source_id), `${relation.id} has a missing source endpoint`).toBe(true);
      expect(entityIds.has(relation.target_id), `${relation.id} has a missing target endpoint`).toBe(true);
    }
    expect(relationIds.size).toBe(artifact.relations.length);
    assertAcyclicHierarchy(artifact.relations);
  });

  it("keeps every case path ordered with stable case identifiers", () => {
    const conceptIds = new Set(artifact.classes.map(({ id }) => id));

    for (const path of artifact.case_paths) {
      expect(path.steps.length, `${path.id} has no steps`).toBeGreaterThan(0);
      path.steps.forEach((step, index) => {
        expect(step.order).toBe(index + 1);
        expect(step.case_fragment_example_id.trim()).not.toHaveLength(0);
        const caseMarker = step.case_fragment_example_id.indexOf("-case-");
        expect(caseMarker, `${step.case_fragment_example_id} is not a stable case identifier`).toBeGreaterThan(0);
        expect(conceptIds.has(step.case_fragment_example_id.slice(0, caseMarker))).toBe(true);
        if (step.traversal_relation_id) expect(step.traversal_relation_id.trim()).not.toHaveLength(0);
      });
    }
  });
});
