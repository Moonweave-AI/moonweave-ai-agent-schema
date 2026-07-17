import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  assertOntologyArtifactSize,
  ontologyArtifactSizeLimits,
} from "../scripts/lib/ontology-artifact-size.mjs";
import { ontologyArtifactPath } from "./helpers/ontology-artifact";

describe("ontology artifact size release gate", () => {
  it("bounds raw, minified, and gzip artifact volume", () => {
    const raw = readFileSync(ontologyArtifactPath());
    const ontology = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
    const { measurements, limits } = assertOntologyArtifactSize({
      canonicalBytes: raw,
      canonical: ontology,
    });

    expect(limits).toEqual(ontologyArtifactSizeLimits);
    expect(measurements.raw_bytes).toBeLessThanOrEqual(limits.raw_bytes);
    expect(measurements.minified_bytes).toBeLessThanOrEqual(limits.minified_bytes);
    expect(measurements.gzip_bytes).toBeLessThanOrEqual(limits.gzip_bytes);
  });
});
