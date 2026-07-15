import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  assertOntologyArtifactSize,
  ontologyArtifactSizeLimits,
} from "../scripts/lib/ontology-artifact-size.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

describe("ontology artifact size release gate", () => {
  it("bounds raw, minified, gzip, and recursive evidence volume", () => {
    const raw = readFileSync(ontologyArtifactPath());
    const ontology = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
    const { measurements, limits } = assertOntologyArtifactSize({
      canonicalBytes: raw,
      canonical: ontology,
    });

    expect(limits).toEqual(ontologyArtifactSizeLimits);
    expect(measurements.nested_claim_count).toBeGreaterThan(0);
    expect(measurements.nested_copied_direct_support_count).toBe(0);
    expect(measurements.raw_bytes).toBeLessThanOrEqual(limits.raw_bytes);
    expect(measurements.minified_bytes).toBeLessThanOrEqual(limits.minified_bytes);
    expect(measurements.gzip_bytes).toBeLessThanOrEqual(limits.gzip_bytes);
    expect(measurements.nested_support_bytes).toBeLessThanOrEqual(
      limits.nested_support_bytes,
    );
    expect(measurements.average_nested_support_bytes).toBeLessThanOrEqual(
      limits.average_nested_support_bytes,
    );
    expect(measurements.maximum_nested_support_bytes).toBeLessThanOrEqual(
      limits.maximum_nested_support_bytes,
    );
  });
});
