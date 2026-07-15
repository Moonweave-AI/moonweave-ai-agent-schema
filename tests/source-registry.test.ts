import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { validateSourceUrlPolicy } from "../scripts/lib/ontology-security-gates.mjs";

type CsvRow = Readonly<Record<string, string>>;

const CONTROLLED_PRIORITIES = new Set(["A", "B", "C"]);
const CONTROLLED_SOURCE_TYPES = new Set([
  "ACL",
  "ACL Findings",
  "ACL listing",
  "arXiv",
  "COLM",
  "dataset",
  "docs",
  "EACL",
  "EACL Findings",
  "EMNLP",
  "EMNLP listing",
  "Findings ACL",
  "Findings EMNLP",
  "guide",
  "ICLR",
  "ICLR blogpost",
  "ICLR Oral",
  "ICLR paper",
  "ICLR poster",
  "ICLR/repo",
  "ICML",
  "ICML poster",
  "IETF draft",
  "journal-paper",
  "K-CAP",
  "methodology",
  "NeurIPS",
  "NeurIPS list",
  "official-blog",
  "official-doc",
  "official-docs",
  "official-guidance",
  "official-site",
  "official-spec",
  "official-viewer",
  "ontology-paper",
  "OpenReview",
  "paper",
  "paper/repo",
  "project",
  "release-note",
  "repo",
  "repo/docs",
  "repo/paper",
  "repo/release",
  "repo/spec",
  "repo-doc",
  "repo-source",
  "Semantic Web Journal",
  "spec",
  "specification",
  "standard",
  "standards-draft",
  "survey",
  "technical report",
  "UIST",
  "vendor-whitepaper",
  "W3C note",
  "W3C standard",
  "WWW"
]);

const registryPath = join(process.cwd(), "research", "source-registry.csv");
const livingPath = join(process.cwd(), "research", "living-source-metadata.csv");
const generatedIndexPath = join(process.cwd(), "src", "generated", "source-index.json");
const httpAllowlistPath = join(process.cwd(), "research", "source-http-allowlist.json");
const productPath = join(process.cwd(), "ontology", "source", "agent-ontology.product.json");

function parseCsvLine(line: string): readonly string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  if (quoted) {
    throw new Error(`Unterminated quoted CSV cell: ${line}`);
  }

  return [...cells, current];
}

function parseCsv(csvBytes: Buffer): readonly CsvRow[] {
  const [headerLine, ...dataLines] = csvBytes.toString("utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return dataLines.map((line) => {
    const cells = parseCsvLine(line);
    expect(cells, `CSV column count mismatch for row: ${line}`).toHaveLength(headers.length);
    return Object.freeze(Object.fromEntries(headers.map((header, index) => [header, cells[index]])));
  });
}

function duplicateIds(rows: readonly CsvRow[]): readonly string[] {
  const counts = rows.reduce<ReadonlyMap<string, number>>(
    (currentCounts, row) => {
      const nextCounts = new Map(currentCounts);
      nextCounts.set(row.id, (currentCounts.get(row.id) ?? 0) + 1);
      return nextCounts;
    },
    new Map()
  );

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
    .sort();
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const registryBytes = readFileSync(registryPath);
const livingBytes = readFileSync(livingPath);
const productBytes = readFileSync(productPath);
const registryRows = parseCsv(registryBytes);
const livingRows = parseCsv(livingBytes);
const registryById = new Map(registryRows.map((row) => [row.id, row]));

describe("source registry contract", () => {
  it("uses unique, non-empty stable IDs in both CSV inputs", () => {
    expect(registryRows.every((row) => row.id.trim().length > 0)).toBe(true);
    expect(livingRows.every((row) => row.id.trim().length > 0)).toBe(true);
    expect(duplicateIds(registryRows)).toEqual([]);
    expect(duplicateIds(livingRows)).toEqual([]);
  });

  it("accepts only controlled priorities and source types", () => {
    const invalidRows = registryRows
      .filter(
        (row) =>
          !CONTROLLED_PRIORITIES.has(row.priority) ||
          !CONTROLLED_SOURCE_TYPES.has(row.source_type) ||
          !row.title.trim() ||
          !row.url.trim()
      )
      .map((row) => `${row.id}:${row.priority}:${row.source_type}`);

    expect(CONTROLLED_SOURCE_TYPES.has("vendor-whitepaper")).toBe(true);
    expect(invalidRows).toEqual([]);
  });

  it("defaults to HTTPS and allows only exact, audited historical HTTP URLs", () => {
    const allowlist = JSON.parse(readFileSync(httpAllowlistPath, "utf8")) as readonly {
      source_id: string;
      url: string;
      reason: string;
      approved_by: string;
      approved_on: string;
      review_by: string;
    }[];

    expect(
      validateSourceUrlPolicy(
        registryRows.map(({ id, url }) => ({ id, url })),
        allowlist,
      ),
    ).toEqual([]);
    expect(registryRows.filter(({ url }) => url.startsWith("http://"))).toHaveLength(
      allowlist.length,
    );
  });

  it("keeps every living-source ID and URL aligned with the registry", () => {
    const mismatches = livingRows
      .filter((livingRow) => registryById.get(livingRow.id)?.url !== livingRow.url)
      .map((livingRow) => ({
        id: livingRow.id,
        livingUrl: livingRow.url,
        registryUrl: registryById.get(livingRow.id)?.url ?? "<missing>"
      }));

    expect(mismatches).toEqual([]);
  });

  it("registers the three user-specified ontology references without reclassification", () => {
    const expectedRows = [
      {
        id: "eng-ont-palantir-overview",
        title: "Palantir Ontology overview",
        url: "https://palantir.com/docs/foundry/ontology/overview/",
        source_type: "official-doc",
        priority: "A"
      },
      {
        id: "eng-ont-palantir-core-concepts",
        title: "Palantir Ontology core concepts",
        url: "https://palantir.com/docs/foundry/ontology/core-concepts/",
        source_type: "official-doc",
        priority: "A"
      },
      {
        id: "eng-ont-microsoft-fabric-iq-ontology",
        title: "What is ontology (preview)?",
        url: "https://learn.microsoft.com/en-us/fabric/iq/ontology/overview",
        source_type: "official-doc",
        priority: "A"
      },
      {
        id: "eng-ont-skan-agentic-ontology-of-work",
        title: "AI Agents Needed a Common Language. So We Built One.",
        url: "https://www.skan.ai/whitepapers/agentic-ontology-of-work",
        source_type: "vendor-whitepaper",
        priority: "B"
      }
    ] as const;

    for (const expectedRow of expectedRows) {
      expect(registryById.get(expectedRow.id)).toMatchObject(expectedRow);
    }
  });
});

describe("generated source index contract", () => {
  it("is generated from the exact registry and living CSV bytes", () => {
    expect(
      existsSync(generatedIndexPath),
      "Missing src/generated/source-index.json; CSV contract checks passed, so generate the source index next."
    ).toBe(true);

    const sourceIndex = JSON.parse(readFileSync(generatedIndexPath, "utf8")) as {
      registry_fingerprint?: string;
      living_fingerprint?: string;
      product_fingerprint?: string;
      sources?: readonly Readonly<Record<string, unknown>>[];
    };

    expect(sourceIndex.registry_fingerprint).toBe(sha256(registryBytes));
    expect(sourceIndex.living_fingerprint).toBe(sha256(livingBytes));
    expect(sourceIndex.product_fingerprint).toBe(sha256(productBytes));
    expect(Array.isArray(sourceIndex.sources)).toBe(true);
    expect(sourceIndex.sources).toHaveLength(registryRows.length);

    const forbiddenClaimFields = (sourceIndex.sources ?? []).flatMap((source) =>
      ["supports", "locator"].filter((field) => Object.hasOwn(source, field)).map((field) => `${String(source.id)}:${field}`)
    );
    expect(forbiddenClaimFields).toEqual([]);
  });
});
