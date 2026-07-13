import { describe, expect, it } from "vitest";

import publishedOntology from "../ontology/agent-ontology.json";
import missingTrustBoundary from "../fixtures/invalid/missing-trust-boundary.json";
import minimalCanonical from "../fixtures/valid/agent-ontology.v1.json";
import {
  createOntologyAjv,
  validateCanonicalOntology,
} from "../src/lib/schemaValidation";

describe("published canonical ontology schema", () => {
  it("validates the published ontology with the published root schema", () => {
    const result = validateCanonicalOntology(publishedOntology);

    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects an object that does not satisfy the root contract", () => {
    const result = validateCanonicalOntology({});

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validates the minimal v2 canonical fixture instead of the retired GraphView shape", () => {
    const result = validateCanonicalOntology(minimalCanonical);

    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a boundary-crossing relation without context and names the relation ID", () => {
    const result = validateCanonicalOntology(missingTrustBoundary);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        keyword: "required",
        recordId: "boundary-source-crosses-trust-boundary-without-context",
        params: { missingProperty: "boundary_context" },
      }),
    );
  });

  it("creates an AJV 2020 validator with format support", () => {
    const ajv = createOntologyAjv();
    const validate = ajv.compile({
      type: "string",
      format: "uri",
    });

    expect(validate("https://moonweave.ai/ontology/agent-system/2.0.0/")).toBe(true);
    expect(validate("not a URI")).toBe(false);
  });
});
