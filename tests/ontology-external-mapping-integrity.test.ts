import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type ExternalMapping = Readonly<{
  id: string;
  system: string;
  external_identifier: string;
  external_version: string;
  direction: string;
  conversion_note: Readonly<Record<"zh" | "en" | "ja", string>>;
}>;

type Example = Readonly<{
  id: string;
  field_values?: Readonly<Record<string, unknown>>;
}>;

type Concept = Readonly<{
  id: string;
  external_mappings?: readonly ExternalMapping[];
  examples?: readonly Example[];
}>;

type ModuleSource = Readonly<{ classes: readonly Concept[] }>;

const sourceRoot = resolve(import.meta.dirname, "../ontology/source");
const moduleSources = readdirSync(sourceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((plane) =>
    readdirSync(resolve(sourceRoot, plane.name))
      .filter((name) => name.endsWith(".json"))
      .map(
        (name) =>
          JSON.parse(
            readFileSync(resolve(sourceRoot, plane.name, name), "utf8"),
          ) as ModuleSource,
      ),
  );
const concepts = moduleSources.flatMap(({ classes }) => classes);
const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
const mappings = concepts.flatMap((concept) =>
  (concept.external_mappings ?? []).map((mapping) => ({
    ownerId: concept.id,
    mapping,
  })),
);

const placeholderVersion = /^(?:main|current|verified|legacy-v1-frozen-family)$/iu;

describe("active external mapping integrity", () => {
  it("uses auditable versions instead of migration or moving-branch placeholders", () => {
    expect(mappings.length).toBeGreaterThanOrEqual(24);
    for (const { ownerId, mapping } of mappings) {
      expect(mapping.external_version, `${ownerId}/${mapping.id}`).not.toMatch(
        placeholderVersion,
      );
      expect(mapping.external_version, `${ownerId}/${mapping.id}`).toMatch(/\d/u);
    }
  });

  it("separates the seven frozen-v1 migration crosswalks from real system mappings", () => {
    const legacyCrosswalks = mappings.filter(({ mapping }) =>
      mapping.id.endsWith("-external-family-mapping"),
    );
    expect(legacyCrosswalks).toHaveLength(7);
    for (const { ownerId, mapping } of legacyCrosswalks) {
      expect(mapping.system, ownerId).toBe("Moonweave Agent Ontology v1");
      expect(mapping.external_identifier, ownerId).toMatch(
        /^legacy-v1:adapter-mapping:/u,
      );
      expect(mapping.external_version, ownerId).toBe(
        "sha256:344b64a3cb2a2e14eefbfc499be6989f4944ec4d4757fc7e7738c1795bd2d91c",
      );
      expect(mapping.direction, ownerId).toBe("import-to-canonical");
    }

    expect(
      conceptById
        .get("A2AAdapter")
        ?.external_mappings?.find(({ id }) => id === "A2AAdapter-external-mapping"),
    ).toMatchObject({
      system: "A2A",
      external_identifier: "A2A",
      external_version: "1.0",
    });
    expect(
      conceptById
        .get("MCPAdapter")
        ?.external_mappings?.find(({ id }) => id === "MCPAdapter-external-mapping"),
    ).toMatchObject({
      system: "MCP",
      external_identifier: "MCP",
      external_version: "2025-11-25",
    });
  });

  it("keeps each concrete mapping explanation synchronized with its pinned version", () => {
    for (const { ownerId, mapping } of mappings.filter(
      ({ mapping: value }) => !value.id.endsWith("-external-family-mapping"),
    )) {
      for (const [language, explanation] of Object.entries(mapping.conversion_note)) {
        expect(explanation, `${ownerId}/${mapping.id}/${language}`).toContain(
          mapping.external_version,
        );
      }
    }
  });

  it("pins benchmark instance versions to the concrete mapping on their owner Concept", () => {
    for (const ownerId of [
      "AgencyBenchAdapter",
      "AppWorldAdapter",
      "OSWorldAdapter",
      "SWEBenchAdapter",
      "Tau2Adapter",
      "TerminalBenchAdapter",
    ]) {
      const owner = conceptById.get(ownerId);
      const mapping = owner?.external_mappings?.[0];
      expect(mapping, ownerId).toBeDefined();
      const expectedVersion = `${mapping?.external_identifier}@${mapping?.external_version}`;
      const versionedExamples = (owner?.examples ?? []).filter(
        ({ field_values: values }) => values?.benchmark_version !== undefined,
      );
      expect(versionedExamples.length, ownerId).toBeGreaterThan(0);
      for (const example of versionedExamples) {
        expect(example.field_values?.benchmark_version, example.id).toBe(expectedVersion);
      }
    }
  });
});
