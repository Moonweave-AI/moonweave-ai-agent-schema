import { describe, expect, it } from "vitest";
import invalidFixture from "../fixtures/invalid/missing-trust-boundary.json";
import validFixture from "../fixtures/valid/agent-ontology.v1.json";
import { ontologyDataset } from "../src/data/ontology";
import { validateOntologyDataset } from "../src/lib/schemaValidation";

describe("canonical ontology JSON Schema", () => {
  it("accepts the valid fixture", () => {
    const result = validateOntologyDataset(validFixture);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts the implementation dataset", () => {
    const result = validateOntologyDataset(ontologyDataset);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects cross-boundary relations without trust_boundary_id", () => {
    const result = validateOntologyDataset(invalidFixture);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.instancePath.includes("/relations/0"))).toBe(true);
    expect(JSON.stringify(result.errors)).toContain("trust_boundary_id");
  });
});
