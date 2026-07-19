import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id?: unknown;
  readonly required?: unknown;
};

type Example = {
  readonly kind?: unknown;
  readonly field_values?: Readonly<Record<string, unknown>>;
};

type Node = {
  readonly id?: unknown;
  readonly engineering?: {
    readonly typical_output?: readonly {
      readonly format?: unknown;
    }[];
  };
  readonly structure?: {
    readonly identity_keys?: readonly unknown[];
    readonly fields?: readonly Field[];
  };
  readonly examples?: readonly Example[];
};

const retrievalRoot = (...segments: readonly string[]): string => resolve(
  "ontology",
  "memory-plane",
  "memory-retrieval-ranking",
  ...segments,
  "node.yaml",
);

const node = (...segments: readonly string[]): Node => parse(readFileSync(
  retrievalRoot(...segments),
  "utf8",
)) as Node;

const fieldIds = (value: Node, requiredOnly = false): readonly string[] => (value.structure?.fields ?? []).flatMap((field) => (
  typeof field.id === "string" && (!requiredOnly || field.required === true) ? [field.id] : []
));

const pairs = [
  { child: ["RetrievalActivity", "CandidateGenerationActivity"], parent: ["RetrievalActivity"] },
  { child: ["RetrievalActivity", "RankingOperation"], parent: ["RetrievalActivity"] },
  { child: ["RetrievalActivity", "RetrievalRun"], parent: ["RetrievalActivity"] },
  { child: ["RetrievalActivity", "RankingOperation", "CandidateScoringActivity"], parent: ["RetrievalActivity", "RankingOperation"] },
  { child: ["RetrievalActivity", "RankingOperation", "RankFusion"], parent: ["RetrievalActivity", "RankingOperation"] },
  { child: ["RetrievalActivity", "RankingOperation", "RerankActivity"], parent: ["RetrievalActivity", "RankingOperation"] },
  { child: ["RetrievalActivity", "RankingOperation", "TopKSelection"], parent: ["RetrievalActivity", "RankingOperation"] },
  { child: ["RetrievalArtifact", "RetrievalRequest"], parent: ["RetrievalArtifact"] },
  { child: ["RetrievalArtifact", "RetrievalResult"], parent: ["RetrievalArtifact"] },
  { child: ["RetrievalArtifact", "RetrievalResult", "CandidateSet"], parent: ["RetrievalArtifact", "RetrievalResult"] },
  { child: ["RetrievalArtifact", "RetrievedCandidate"], parent: ["RetrievalArtifact"] },
  { child: ["RetrievalArtifact", "RetrievedCandidate", "RetrievedChunk"], parent: ["RetrievalArtifact", "RetrievedCandidate"] },
  { child: ["RetrievalArtifact", "RetrievedCandidate", "RetrievalScore", "LexicalScore"], parent: ["RetrievalArtifact", "RetrievedCandidate", "RetrievalScore"] },
  { child: ["RetrievalArtifact", "RetrievedCandidate", "RetrievalScore", "RerankScore"], parent: ["RetrievalArtifact", "RetrievedCandidate", "RetrievalScore"] },
  { child: ["RetrievalArtifact", "RetrievedCandidate", "RetrievalScore", "SimilarityScore"], parent: ["RetrievalArtifact", "RetrievedCandidate", "RetrievalScore"] },
] as const;

describe("memory-retrieval-ranking retained is_a contracts", () => {
  it("retains the immediate parent identity and required fields in every subtype source node", () => {
    for (const pair of pairs) {
      const child = node(...pair.child);
      const parent = node(...pair.parent);
      const inheritedContract = [
        ...(parent.structure?.identity_keys ?? []).filter((id): id is string => typeof id === "string"),
        ...fieldIds(parent, true),
      ];

      expect(fieldIds(child), `${String(child.id)} <- ${String(parent.id)}`).toEqual(
        expect.arrayContaining([...new Set(inheritedContract)]),
      );
    }
  });

  it("shows the retained contract in every positive and instance example", () => {
    for (const pair of pairs) {
      const child = node(...pair.child);
      const parent = node(...pair.parent);
      const required = [...new Set([
        ...fieldIds(parent, true),
        ...fieldIds(child, true),
      ])];

      for (const example of child.examples ?? []) {
        if (example.kind !== "positive" && example.kind !== "instance") continue;
        expect(Object.keys(example.field_values ?? {}), `${String(child.id)}/${String(example.kind)}`).toEqual(
          expect.arrayContaining(required),
        );
      }
    }
  });

  it("publishes the inherited and subtype contract in each API-shaped typical output", () => {
    for (const pair of pairs) {
      const child = node(...pair.child);
      const parent = node(...pair.parent);
      const output = String(child.engineering?.typical_output?.[0]?.format ?? "");
      const required = [...new Set([
        ...fieldIds(parent, true),
        ...fieldIds(child, true),
      ])];

      for (const fieldId of required) {
        expect(output, `${String(child.id)} typical output missing ${fieldId}`).toContain(fieldId);
      }
    }
  });
});
