import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
};

type OntologyNode = {
  readonly id?: unknown;
  readonly parent_relation?: {
    readonly predicate?: unknown;
    readonly target?: unknown;
  };
  readonly structure?: {
    readonly fields?: readonly Field[];
  };
};

const ontologyPath = (...segments: readonly string[]): string => resolve("ontology", ...segments);

describe("preference-example ontology structure", () => {
  it("uses the DPO-style PreferenceExample name while retaining the LearningSignal parent contract", () => {
    const examplePath = ontologyPath(
      "feedback-plane",
      "feedback-optimization-learning",
      "LearningSignal",
      "PreferenceExample",
      "node.yaml",
    );

    expect(existsSync(examplePath)).toBe(true);
    expect(existsSync(ontologyPath(
      "feedback-plane",
      "feedback-optimization-learning",
      "LearningSignal",
      "PreferenceLearningSignal",
      "node.yaml",
    ))).toBe(false);

    const example = parse(readFileSync(examplePath, "utf8")) as OntologyNode;
    const fields = new Set((example.structure?.fields ?? []).flatMap((field) => (
      typeof field.id === "string" ? [field.id] : []
    )));

    expect(example.id).toBe("PreferenceExample");
    expect(example.parent_relation).toEqual(expect.objectContaining({
      predicate: "is_a",
      target: "concept:LearningSignal",
    }));
    expect([...fields]).toEqual(expect.arrayContaining([
      "signal_id",
      "learning_objective",
      "dataset_ref",
      "source_ref",
      "transformation_policy_ref",
      "chosen_ref",
      "rejected_ref",
    ]));
  });
});
