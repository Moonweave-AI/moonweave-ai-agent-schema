import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Relation = {
  readonly id?: unknown;
  readonly predicate?: unknown;
  readonly target?: unknown;
};

type OntologyNode = {
  readonly parent_relation?: unknown;
  readonly relations?: readonly Relation[];
};

const ontologyPath = (...segments: readonly string[]): string => resolve("ontology", ...segments);

describe("trust-boundary ontology structure", () => {
  it("models a boundary crossing as a standalone runtime record, not as a compositional child of a boundary", () => {
    const crossingPath = ontologyPath(
      "safety-plane",
      "safety-trust-boundary",
      "BoundaryCrossing",
      "node.yaml",
    );

    expect(existsSync(crossingPath)).toBe(true);

    const crossing = parse(readFileSync(crossingPath, "utf8")) as OntologyNode;
    expect(crossing.parent_relation ?? null).toBeNull();
    expect(crossing.relations).toContainEqual(expect.objectContaining({
      id: "BoundaryCrossing-crosses-TrustBoundary",
      predicate: "crosses",
      target: "TrustBoundary",
    }));
  });
});
