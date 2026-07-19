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
  readonly id?: unknown;
  readonly parent_relation?: unknown;
  readonly relations?: readonly Relation[];
};

const ontologyPath = (...segments: readonly string[]): string => resolve("ontology", ...segments);

describe("reward-model score ontology structure", () => {
  it("keeps a trained reward-model inference result separate from LearningSignal training data", () => {
    const scorePath = ontologyPath(
      "feedback-plane",
      "feedback-optimization-learning",
      "RewardModelScore",
      "node.yaml",
    );

    expect(existsSync(scorePath)).toBe(true);
    expect(existsSync(ontologyPath(
      "feedback-plane",
      "feedback-optimization-learning",
      "LearningSignal",
      "RewardLearningSignal",
      "node.yaml",
    ))).toBe(false);

    const score = parse(readFileSync(scorePath, "utf8")) as OntologyNode;
    expect(score.id).toBe("RewardModelScore");
    expect(score.parent_relation ?? null).toBeNull();
    expect(score.relations).toContainEqual(expect.objectContaining({
      id: "RewardModelScore-isAbout-CandidateArtifact",
      predicate: "is_about",
      target: "concept:Artifact",
    }));
  });
});
