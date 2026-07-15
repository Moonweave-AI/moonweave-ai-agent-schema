import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { ontologyArtifactPath } from "./helpers/ontology-artifact";

interface Relation {
  readonly id: string;
  readonly predicate: string;
  readonly source_id: string;
  readonly target_id: string;
  readonly direction: string;
  readonly status: string;
  readonly layout_role: "primary-backbone" | "secondary-backbone" | "cross-link" | null;
  readonly layout_parent_id: string | null;
  readonly layout_child_id: string | null;
  readonly definitions: Readonly<Record<string, string>>;
  readonly examples: readonly { readonly id: string }[];
  readonly source_claims: readonly { readonly source_id: string }[];
}

interface OntologyArtifact {
  readonly planes: readonly { readonly id: string }[];
  readonly modules: readonly { readonly id: string }[];
  readonly classes: readonly {
    readonly id: string;
    readonly status: string;
    readonly structure?: {
      readonly fields?: readonly { readonly id: string }[];
      readonly constraints?: readonly { readonly id: string }[];
    };
    readonly examples?: readonly { readonly id: string }[];
    readonly source_claims?: readonly { readonly source_id: string }[];
  }[];
  readonly relations: readonly Relation[];
  readonly examples: readonly { readonly id: string }[];
  readonly source_claims: readonly { readonly source_id: string }[];
  readonly case_paths: readonly {
    readonly id: string;
    readonly steps: readonly { readonly case_fragment_example_id: string }[];
  }[];
}

let cachedOntology: OntologyArtifact | undefined;

const ontology = (): OntologyArtifact => {
  const artifactPath = ontologyArtifactPath();
  expect(existsSync(artifactPath), `Build the candidate ontology first: ${artifactPath}`).toBe(true);
  cachedOntology ??= JSON.parse(readFileSync(artifactPath, "utf8")) as OntologyArtifact;
  return cachedOntology;
};

const acceptedBackbone = (artifact: OntologyArtifact): readonly Relation[] =>
  artifact.relations.filter(
    ({ status, layout_role: role }) =>
      status === "accepted" && (role === "primary-backbone" || role === "secondary-backbone"),
  );

const primaryBackbone = (artifact: OntologyArtifact): readonly Relation[] =>
  acceptedBackbone(artifact).filter(({ layout_role: role }) => role === "primary-backbone");

describe("canonical ontology backbone", () => {
  it("resolves every layout parent and child to canonical relation endpoints", () => {
    const artifact = ontology();
    const conceptIds = new Set(artifact.classes.map(({ id }) => id));
    const violations = acceptedBackbone(artifact).flatMap((relation) => {
      const endpointIds = new Set([relation.source_id, relation.target_id]);
      return relation.layout_parent_id != null &&
        relation.layout_child_id != null &&
        relation.layout_parent_id !== relation.layout_child_id &&
        endpointIds.has(relation.layout_parent_id) &&
        endpointIds.has(relation.layout_child_id) &&
        conceptIds.has(relation.layout_parent_id) &&
        conceptIds.has(relation.layout_child_id)
        ? []
        : [relation.id];
    });

    expect(violations).toEqual([]);
  });

  it("reverses is_a only in layout projection", () => {
    const violations = acceptedBackbone(ontology())
      .filter(({ predicate }) => predicate === "is_a")
      .filter(
        (relation) =>
          relation.layout_parent_id !== relation.target_id ||
          relation.layout_child_id !== relation.source_id,
      )
      .map(({ id }) => id);

    expect(violations).toEqual([]);
  });

  it("never reverses the rendered canonical direction", () => {
    const artifact = ontology();
    const reversedForLayout = acceptedBackbone(artifact).filter(
      (relation) =>
        relation.layout_child_id === relation.target_id &&
        relation.layout_parent_id === relation.source_id,
    );
    const violations = reversedForLayout.filter(
      (relation) =>
        relation.direction !== "source-to-target" ||
        relation.source_id !== relation.layout_parent_id ||
        relation.target_id !== relation.layout_child_id,
    );

    expect(reversedForLayout.length).toBeGreaterThan(0);
    expect(violations.map(({ id }) => id)).toEqual([]);
  });

  it("keeps primary backbone acyclic", () => {
    const parentByChild = new Map(
      primaryBackbone(ontology()).map((relation) => [
        relation.layout_child_id as string,
        relation.layout_parent_id as string,
      ]),
    );
    const cycles = [...parentByChild].flatMap(([start]) => {
      const visited = new Set<string>();
      let current: string | undefined = start;
      while (current !== undefined) {
        if (visited.has(current)) return [start];
        visited.add(current);
        current = parentByChild.get(current);
      }
      return [];
    });

    expect(cycles).toEqual([]);
  });

  it("records the actual primary relation instead of root_status=null for non-roots", () => {
    const artifact = ontology();
    const nonRootIds = new Set(
      primaryBackbone(artifact).map(({ layout_child_id: childId }) => childId),
    );
    const violations = artifact.classes
      .filter(({ id, status }) => status === "accepted" && nonRootIds.has(id))
      .filter((concept) =>
        /backbone=root_status=null|reviewed root status null/iu.test(JSON.stringify(concept)),
      )
      .map(({ id }) => id);

    expect(violations).toEqual([]);
  });

  it("allows a non-taxonomic semantic relation in the backbone", () => {
    const semanticBackbone = primaryBackbone(ontology()).filter(
      ({ predicate }) => predicate !== "is_a",
    );
    const incomplete = semanticBackbone.filter(
      (relation) =>
        Object.values(relation.definitions).some((value) => value.trim().length === 0) ||
        relation.examples.length === 0 ||
        relation.source_claims.length === 0,
    );

    expect(semanticBackbone.length).toBeGreaterThan(0);
    expect(incomplete.map(({ id }) => id)).toEqual([]);
  });

  it("does not persist ownership shadow relations", () => {
    const artifact = ontology();
    const organizationalIds = new Set([
      ...artifact.planes.map(({ id }) => id),
      ...artifact.modules.map(({ id }) => id),
    ]);
    const shadowRelations = artifact.relations.filter(
      ({ source_id: sourceId, target_id: targetId }) =>
        organizationalIds.has(sourceId) || organizationalIds.has(targetId),
    );

    expect(shadowRelations.map(({ id }) => id)).toEqual([]);
  });

  it("does not create schema example source or case graph elements", () => {
    const artifact = ontology();
    const graphEntityIds = new Set(artifact.classes.map(({ id }) => id));
    const annotationIds = new Set([
      ...artifact.classes.flatMap(({ structure }) => [
        ...(structure?.fields ?? []).map(({ id }) => id),
        ...(structure?.constraints ?? []).map(({ id }) => id),
      ]),
      ...artifact.classes.flatMap(({ examples = [] }) => examples.map(({ id }) => id)),
      ...artifact.relations.flatMap(({ examples }) => examples.map(({ id }) => id)),
      ...artifact.examples.map(({ id }) => id),
      ...artifact.classes.flatMap(({ source_claims = [] }) =>
        source_claims.map(({ source_id: sourceId }) => sourceId),
      ),
      ...artifact.relations.flatMap(({ source_claims: claims }) =>
        claims.map(({ source_id: sourceId }) => sourceId),
      ),
      ...artifact.source_claims.map(({ source_id: sourceId }) => sourceId),
      ...artifact.case_paths.flatMap(({ id, steps }) => [
        id,
        ...steps.map(({ case_fragment_example_id: exampleId }) => exampleId),
      ]),
    ]);
    const leakedAnnotations = [...annotationIds].filter((id) => graphEntityIds.has(id));

    expect(leakedAnnotations).toEqual([]);
    expect(
      artifact.relations.every(
        ({ source_id: sourceId, target_id: targetId }) =>
          graphEntityIds.has(sourceId) && graphEntityIds.has(targetId),
      ),
    ).toBe(true);
  });
});
