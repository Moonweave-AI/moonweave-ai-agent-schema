import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import ontology from "../ontology/agent-ontology.json";

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

function collectSourceIds(value: unknown, ids = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSourceIds(item, ids));
    return ids;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (key === "source_ids" && Array.isArray(nested)) {
        nested.forEach((sourceId) => ids.add(String(sourceId)));
      } else {
        collectSourceIds(nested, ids);
      }
    }
  }

  return ids;
}

describe("canonical agent ontology artifact", () => {
  const planes = new Map(ontology.planes.map((plane) => [plane.id, plane]));
  const modules = new Map(ontology.modules.map((module) => [module.id, module]));
  const classes = new Map(ontology.classes.map((klass) => [klass.id, klass]));
  const sourceRegistry = parseCsv(join(process.cwd(), "research", "source-registry.csv"));
  const livingMetadata = parseCsv(join(process.cwd(), "research", "living-source-metadata.csv"));
  const sourceRows = new Map(sourceRegistry.map((row) => [row.id, row]));
  const livingRows = new Map(livingMetadata.map((row) => [row.id, row]));

  it("stays at production ontology-family scale instead of a demo graph", () => {
    expect(ontology.ontology_metrics.domains).toBe(1);
    expect(ontology.planes.length).toBeGreaterThanOrEqual(8);
    expect(ontology.modules.length).toBeGreaterThanOrEqual(36);
    expect(ontology.classes.length).toBeGreaterThanOrEqual(400);
    expect(ontology.object_properties.length).toBeGreaterThanOrEqual(150);
    expect(ontology.data_properties.length).toBeGreaterThanOrEqual(90);
    expect(ontology.individuals.length).toBeGreaterThanOrEqual(70);
    expect(ontology.axioms.length).toBeGreaterThanOrEqual(350);
  });

  it("keeps metrics synchronized with concrete arrays", () => {
    expect(ontology.ontology_metrics.planes).toBe(ontology.planes.length);
    expect(ontology.ontology_metrics.modules).toBe(ontology.modules.length);
    expect(ontology.ontology_metrics.classes).toBe(ontology.classes.length);
    expect(ontology.ontology_metrics.object_properties).toBe(ontology.object_properties.length);
    expect(ontology.ontology_metrics.data_properties).toBe(ontology.data_properties.length);
    expect(ontology.ontology_metrics.individuals).toBe(ontology.individuals.length);
    expect(ontology.ontology_metrics.axioms).toBe(ontology.axioms.length);
  });

  it("resolves plane/module/class references", () => {
    const badModulePlanes = ontology.modules.filter((module) => !planes.has(module.plane_id)).map((module) => module.id);
    const badClassPlanes = ontology.classes.filter((klass) => !planes.has(klass.plane_id)).map((klass) => klass.id);
    const badClassModules = ontology.classes.filter((klass) => !modules.has(klass.module_id)).map((klass) => klass.id);
    const badModuleClasses = ontology.modules.flatMap((module) =>
      module.class_ids.filter((classId) => !classes.has(classId)).map((classId) => `${module.id}:${classId}`)
    );

    expect(badModulePlanes).toEqual([]);
    expect(badClassPlanes).toEqual([]);
    expect(badClassModules).toEqual([]);
    expect(badModuleClasses).toEqual([]);
  });

  it("keeps canonical ontology source evidence valid and normalized", () => {
    const sourceIds = [...collectSourceIds(ontology)].sort();
    const missing = sourceIds.filter((sourceId) => !sourceRows.has(sourceId));
    const unresolvedLiving = sourceIds.filter(
      (sourceId) => sourceRows.get(sourceId)?.source_type === "living" && livingRows.get(sourceId)?.normalization_status !== "normalized"
    );
    const excludedEvidence = sourceIds.filter((sourceId) =>
      ["future-dated-excluded", "needs-targeted-check"].includes(sourceRows.get(sourceId)?.status ?? "")
    );

    expect(missing).toEqual([]);
    expect(unresolvedLiving).toEqual([]);
    expect(excludedEvidence).toEqual([]);
  });

  it("does not model ontology metadata or hidden chain-of-thought as subject classes", () => {
    const classIds = new Set(ontology.classes.map((klass) => klass.id));
    const metadataTerms = ontology.artifact_metadata.non_subject_metadata_terms;

    expect(metadataTerms.filter((term) => classIds.has(term))).toEqual([]);
    expect(JSON.stringify(ontology)).not.toContain("HiddenChainOfThought");
  });

  it("uses concrete subject definitions instead of generation placeholders", () => {
    const placeholderPatterns = [
      /agent-system class governed by its assigned module/i,
      /the module record defines scope/i,
      /object property for .* links between agent-system classes/i,
      /object property linking (the )?.*Module/i,
      /data property for recording .* values on agent-system resources/i,
      /data property recording .* for (claims in )?the .*Module/i,
      /controlled individual representing the .*Module/i,
      /controlled vocabulary individual for/i
    ];

    const definitionRows = [
      ...ontology.modules.map((item) => ["module", item.id, item.definition]),
      ...ontology.classes.map((item) => ["class", item.id, item.definition]),
      ...ontology.object_properties.map((item) => ["object_property", item.id, item.definition]),
      ...ontology.data_properties.map((item) => ["data_property", item.id, item.definition]),
      ...ontology.individuals.map((item) => ["individual", item.id, item.definition])
    ];

    const placeholderDefinitions = definitionRows
      .filter(([, , definition]) => placeholderPatterns.some((pattern) => pattern.test(definition)))
      .map(([kind, id, definition]) => `${kind}:${id}:${definition}`);

    expect(placeholderDefinitions).toEqual([]);
  });
});
