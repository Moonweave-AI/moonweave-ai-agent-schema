import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { describe, expect, expectTypeOf, it } from "vitest";

import {
  createOntologyRuntime,
  ontologyMetricValue,
} from "../src/lib/ontology-runtime";
import type {
  CanonicalAgentOntology,
  CanonicalConceptContract,
  CanonicalModuleContract,
  CanonicalPlaneContract,
  CanonicalRelationContract,
  CanonicalSourceClaim as GeneratedCanonicalSourceClaim,
  CasePath,
  CasePathStep,
  Constraint,
  Example,
  Field,
  LocalizedText,
} from "../src/lib/canonical-ontology-types";
import type {
  CanonicalCasePath,
  CanonicalCasePathStep,
  CanonicalConcept,
  CanonicalConstraint,
  CanonicalExample,
  CanonicalField,
  CanonicalModule,
  CanonicalOntology,
  CanonicalPlane,
  CanonicalRelation,
  CanonicalSourceClaim,
  LocalizedText as ConsumerLocalizedText,
} from "../src/lib/ontology-index";
import { ontologyViewModelFixture } from "./fixtures/ontology-view-model.fixture";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

const sourceIndex = {
  registry_fingerprint: "fixture-registry",
  living_fingerprint: "fixture-living",
  sources: [],
};

const runtimeOntologyFixture = {
  ...ontologyViewModelFixture,
  artifact_metadata: {
    ...ontologyViewModelFixture.artifact_metadata,
    artifact_kind: "canonical-agent-ontology",
    contract_version: "2.0.0",
    generated_at: "2026-07-13T00:00:00.000Z",
    source_tree_sha256: "0".repeat(64),
  },
} as const;

describe("ontology application runtime boundary", () => {
  it("uses the generated artifact contract as the consumer type source of truth", () => {
    expectTypeOf<CanonicalOntology>().toEqualTypeOf<CanonicalAgentOntology>();
    expectTypeOf<CanonicalPlane>().toEqualTypeOf<CanonicalPlaneContract>();
    expectTypeOf<CanonicalModule>().toEqualTypeOf<CanonicalModuleContract>();
    expectTypeOf<CanonicalConcept>().toEqualTypeOf<CanonicalConceptContract>();
    expectTypeOf<CanonicalRelation>().toEqualTypeOf<CanonicalRelationContract>();
    expectTypeOf<CanonicalField>().toEqualTypeOf<Field>();
    expectTypeOf<CanonicalConstraint>().toEqualTypeOf<Constraint>();
    expectTypeOf<CanonicalExample>().toEqualTypeOf<Example>();
    expectTypeOf<CanonicalSourceClaim>().toEqualTypeOf<GeneratedCanonicalSourceClaim>();
    expectTypeOf<CanonicalCasePath>().toEqualTypeOf<CasePath>();
    expectTypeOf<CanonicalCasePathStep>().toEqualTypeOf<CasePathStep>();
    expectTypeOf<ConsumerLocalizedText>().toEqualTypeOf<LocalizedText>();
  });

  it("indexes the generated canonical artifact through the same boundary used by the application", () => {
    const canonicalPath = ontologyArtifactPath();
    const artifactRoot = dirname(canonicalPath);
    const canonical = JSON.parse(readFileSync(canonicalPath, "utf8"));
    const generatedSourceIndex = JSON.parse(
      readFileSync(resolve(artifactRoot, "source-index.json"), "utf8"),
    );

    const runtime = createOntologyRuntime(canonical, generatedSourceIndex);
    expect(runtime.index.conceptsById.size).toBe(canonical.classes.length);
    expect(runtime.index.modulesById.size).toBe(canonical.modules.length);
    expect(runtime.index.planesById.size).toBe(canonical.planes.length);
    expect(runtime.index.sourcesById.size).toBe(generatedSourceIndex.sources.length);
  });

  it("validates both generated inputs and derives runtime-only indexes", () => {
    const runtime = createOntologyRuntime(runtimeOntologyFixture, sourceIndex);
    const expectedSemanticRelations = runtimeOntologyFixture.relations.filter(
      ({ predicate }) => predicate !== "is_a",
    ).length;

    expect(runtime.index.ontology).toBe(runtime.ontology);
    expect(runtime.sourceIndex).toBe(sourceIndex);
    expect(runtime.semanticRelationCount).toBe(expectedSemanticRelations);
    expect(ontologyMetricValue(runtime, "domains", 99)).toBe(
      runtimeOntologyFixture.ontology_metrics.domains,
    );
  });

  it("rejects malformed canonical and source-index inputs before indexing", () => {
    expect(() => createOntologyRuntime({}, sourceIndex)).toThrow(
      "Canonical ontology is malformed",
    );
    expect(() => createOntologyRuntime(runtimeOntologyFixture, {})).toThrow(
      "Generated source index is malformed",
    );
    expect(() => createOntologyRuntime(null, sourceIndex)).toThrow(
      "Canonical ontology is malformed",
    );
  });

  it.each([
    {
      name: "retired GraphView projection",
      value: {
        id: "agent-ontology-graph-view",
        artifact_type: "GraphView",
        version: "1.0.0",
        artifacts: [],
        relations: [],
      },
    },
    {
      name: "legacy root without artifact metadata",
      value: { ...runtimeOntologyFixture, artifact_metadata: undefined },
    },
    {
      name: "legacy metadata without the v2 artifact discriminator",
      value: ontologyViewModelFixture,
    },
    {
      name: "wrong canonical artifact kind",
      value: {
        ...runtimeOntologyFixture,
        artifact_metadata: {
          ...runtimeOntologyFixture.artifact_metadata,
          artifact_kind: "GraphView",
        },
      },
    },
    {
      name: "unsupported artifact contract version",
      value: {
        ...runtimeOntologyFixture,
        artifact_metadata: {
          ...runtimeOntologyFixture.artifact_metadata,
          contract_version: "0.1.0",
        },
      },
    },
    {
      name: "metadata carrying retired release state",
      value: {
        ...runtimeOntologyFixture,
        artifact_metadata: {
          ...runtimeOntologyFixture.artifact_metadata,
          release_channel: "candidate",
          releasable: false,
        },
      },
    },
    {
      name: "v2 root missing a required root collection",
      value: { ...runtimeOntologyFixture, hygiene_gates: undefined },
    },
    {
      name: "v2 root missing ontology metrics",
      value: { ...runtimeOntologyFixture, ontology_metrics: undefined },
    },
    {
      name: "v2 metrics missing a required counter",
      value: {
        ...runtimeOntologyFixture,
        ontology_metrics: {
          ...runtimeOntologyFixture.ontology_metrics,
          source_claims: undefined,
        },
      },
    },
  ])("rejects $name before graph indexing", ({ value }) => {
    expect(() => createOntologyRuntime(value, sourceIndex)).toThrow(
      "Canonical ontology is malformed",
    );
  });
});
