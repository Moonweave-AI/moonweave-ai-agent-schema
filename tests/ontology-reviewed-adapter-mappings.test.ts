import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseCsv } from "../scripts/lib/csv.mjs";
import {
  REVIEWED_ADAPTER_MAPPINGS,
  applyReviewedAdapterMappings,
} from "../scripts/lib/ontology-reviewed-adapter-mappings.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");
const registryRows = parseCsv(
  readFileSync(resolve(repositoryRoot, "research/source-registry.csv")),
);
const sourceRegistryById = new Map(registryRows.map((row) => [row.id, row]));

const allConceptIds = new Set(
  REVIEWED_ADAPTER_MAPPINGS.flatMap((mapping) => [
    mapping.concept_id,
    ...mapping.canonical_target_ids,
  ]),
);
const concepts = [...allConceptIds].map((id) => ({ id, external_mappings: [] }));

describe("reviewed concrete Adapter mappings", () => {
  it("covers every concrete Adapter once with a resolvable, versioned mapping contract", () => {
    const adapterIds = REVIEWED_ADAPTER_MAPPINGS.map(({ concept_id: id }) => id);

    expect(REVIEWED_ADAPTER_MAPPINGS).toHaveLength(24);
    expect(new Set(adapterIds).size).toBe(adapterIds.length);
    for (const mapping of REVIEWED_ADAPTER_MAPPINGS) {
      expect(mapping.external_identifier, mapping.concept_id).toMatch(/\S/u);
      expect(mapping.external_version, mapping.concept_id).toMatch(/\S/u);
      expect(
        ["import-to-canonical", "export-from-canonical", "bidirectional"],
        mapping.concept_id,
      ).toContain(mapping.direction);
      expect(mapping.canonical_target_ids.length, mapping.concept_id).toBeGreaterThan(0);
      expect(mapping.scope.en, mapping.concept_id).toMatch(/\S/u);
      expect(mapping.loss.en, mapping.concept_id).toMatch(/\S/u);
      expect(mapping.conformance.status, mapping.concept_id).toBe("contract-tested");
      expect(mapping.conformance.test_id, mapping.concept_id).toBe(
        `${mapping.concept_id}-mapping-contract-test`,
      );
      expect(sourceRegistryById.has(mapping.source_id), mapping.source_id).toBe(true);
    }
  });

  it("covers the required benchmark task/environment/trajectory/metric/outcome boundary", () => {
    const requiredTargets = [
      "Task",
      "RuntimeEnvironment",
      "ToolCallAttempt",
      "CommandOutputObservation",
      "Artifact",
      "Score",
      "RunOutcome",
    ];
    const benchmarkMappings = REVIEWED_ADAPTER_MAPPINGS.filter(({ concept_id: id }) =>
      id.endsWith("BenchAdapter") ||
      ["AgencyBenchAdapter", "AppWorldAdapter", "OSWorldAdapter", "SWEBenchAdapter", "Tau2Adapter"].includes(id),
    );

    expect(benchmarkMappings).toHaveLength(6);
    for (const mapping of benchmarkMappings) {
      expect(mapping.canonical_target_ids, mapping.concept_id).toEqual(
        expect.arrayContaining(requiredTargets),
      );
    }
  });

  it("attaches mappings as immutable Concept information rather than graph nodes", () => {
    const before = structuredClone(concepts);
    const transformed = applyReviewedAdapterMappings({
      concepts,
      sourceRegistryById,
    });

    expect(concepts).toEqual(before);
    expect(transformed).not.toBe(concepts);
    for (const specification of REVIEWED_ADAPTER_MAPPINGS) {
      const owner = transformed.find(({ id }) => id === specification.concept_id);
      expect(owner?.external_mappings).toHaveLength(1);
      expect(owner?.external_mappings[0]).toMatchObject({
        id: `${specification.concept_id}-external-mapping`,
        external_version: specification.external_version,
        direction: specification.direction,
        canonical_target_ids: specification.canonical_target_ids,
        conformance: specification.conformance,
        status: "accepted",
      });
      expect(
        (owner?.external_mappings[0] as { source_claims?: readonly unknown[] } | undefined)
          ?.source_claims,
      ).toHaveLength(1);
    }
  });

  it("fails closed for unresolved canonical targets", () => {
    expect(() =>
      applyReviewedAdapterMappings({
        concepts: concepts.filter(({ id }) => id !== "Task"),
        sourceRegistryById,
      }),
    ).toThrow(/unresolved canonical targets/u);
  });
});
