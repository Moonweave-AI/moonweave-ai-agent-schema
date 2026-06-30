import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { adapterSpecs, ontologyDataset } from "../src/data/ontology";
import { conversionWarnings } from "../src/profiles/conversionWarnings";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(path: string): Array<Record<string, string>> {
  const [headerLine, ...lines] = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function implementationSourceIds(): string[] {
  const artifactSources = ontologyDataset.artifacts.flatMap((artifact) => artifact.provenance.source_ids);
  const relationSources = ontologyDataset.relations.flatMap((relation) => relation.provenance.source_ids);
  const adapterSources = adapterSpecs.flatMap((adapter) => adapter.source_ids);
  const warningSources = conversionWarnings.flatMap((warning) => warning.source_ids);

  return [...new Set([...artifactSources, ...relationSources, ...adapterSources, ...warningSources])].sort();
}

describe("Phase 1 source gate", () => {
  const sourceRegistry = parseCsv(join(process.cwd(), "research", "source-registry.csv"));
  const livingMetadata = parseCsv(join(process.cwd(), "research", "living-source-metadata.csv"));
  const sourceRows = new Map(sourceRegistry.map((row) => [row.id, row]));
  const livingRows = new Map(livingMetadata.map((row) => [row.id, row]));

  it("uses only source IDs present in the registry", () => {
    const missing = implementationSourceIds().filter((sourceId) => !sourceRows.has(sourceId));

    expect(missing).toEqual([]);
  });

  it("uses only normalized living engineering sources for field-level claims", () => {
    const nonNormalized = implementationSourceIds()
      .filter((sourceId) => sourceId.startsWith("eng-"))
      .filter((sourceId) => livingRows.get(sourceId)?.normalization_status !== "normalized");

    expect(nonNormalized).toEqual([]);
  });

  it("excludes future-dated sources from active implementation evidence", () => {
    const used = new Set(implementationSourceIds());
    const futureDatedUsed = sourceRegistry
      .filter((row) => row.status === "future-dated-excluded")
      .filter((row) => used.has(row.id))
      .map((row) => row.id);

    expect(futureDatedUsed).toEqual([]);
  });

  it("freezes the first three RFCs as accepted", () => {
    const rfcPaths = [
      "docs/rfcs/0001-ontology-layers.md",
      "docs/rfcs/0002-canonical-schema-contract.md",
      "docs/rfcs/0003-statechart-and-protocol-model.md"
    ];

    const statuses = rfcPaths.map((path) => readFileSync(join(process.cwd(), path), "utf8").match(/^Status: (.+)$/m)?.[1]);

    expect(statuses).toEqual(["accepted", "accepted", "accepted"]);
  });
});
