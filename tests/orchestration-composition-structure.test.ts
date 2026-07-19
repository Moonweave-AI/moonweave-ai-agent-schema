import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Relation = {
  readonly id?: string;
  readonly predicate: string;
  readonly target?: string;
  readonly relation_kind: string;
  readonly inverse_reading?: { readonly predicate: string };
};

type Example = {
  readonly id: string;
  readonly related_node_ids?: readonly string[];
  readonly related_relation_ids?: readonly string[];
};

type Field = {
  readonly id: string;
  readonly required: boolean;
};

type Node = {
  readonly id?: string;
  readonly semantics?: {
    readonly short_definition?: { readonly en?: string };
    readonly definition?: { readonly en?: string };
  };
  readonly parent_relation?: Relation;
  readonly relations?: readonly Relation[];
  readonly examples?: readonly Example[];
  readonly structure?: {
    readonly fields?: readonly Field[];
    readonly required_relations?: readonly Relation[];
  };
};

const compositionNode = (relativePath: string): Node => parse(readFileSync(
  resolve("ontology", "orchestration-plane", "orchestration-composition", relativePath, "node.yaml"),
  "utf8",
)) as Node;

const relation = (node: Node, predicate: string, target: string): Relation | undefined => (
  node.relations?.find((candidate) => candidate.predicate === predicate && candidate.target === target)
);

const example = (node: Node, id: string): Example | undefined => (
  node.examples?.find((candidate) => candidate.id === id)
);

const field = (node: Node, id: string): Field | undefined => (
  node.structure?.fields?.find((candidate) => candidate.id === id)
);

const compositionNodeFiles = (directory: string): readonly string[] => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = join(directory, entry.name);
  return entry.isDirectory()
    ? compositionNodeFiles(entryPath)
    : entry.isFile() && entry.name === "node.yaml"
      ? [entryPath]
      : [];
});

describe("orchestration composition structure", () => {
  it("keeps structural parts separate from occurred activity-to-artifact causality", () => {
    const activity = compositionNode("CompositionActivity");
    const topology = compositionNode("CompositionSpecification/OrchestrationTopology");

    expect(relation(topology, "contains", "concept:CompositionPart")).toMatchObject({
      relation_kind: "composition",
      inverse_reading: { predicate: "part_of_orchestration_topology" },
    });
    expect(relation(activity, "uses_topology", "concept:OrchestrationTopology")).toMatchObject({
      relation_kind: "association",
    });
    expect(relation(activity, "consumes", "concept:CompositionArtifact")).toMatchObject({
      relation_kind: "causal",
    });
    expect(relation(activity, "produces", "concept:CompositionArtifact")).toMatchObject({
      relation_kind: "causal",
    });
  });

  it("models concrete synthesis and voting input/output links as causal facts", () => {
    const synthesis = compositionNode("CompositionActivity/AggregationActivity/Synthesis");
    const voting = compositionNode("CompositionActivity/AggregationActivity/VotingActivity");

    expect(relation(synthesis, "consumes", "concept:SynthesisInput")).toMatchObject({ relation_kind: "causal" });
    expect(relation(synthesis, "produces", "concept:SynthesisOutput")).toMatchObject({ relation_kind: "causal" });
    expect(relation(voting, "consumes", "concept:VoteBallot")).toMatchObject({ relation_kind: "causal" });
    expect(relation(voting, "produces", "concept:CompositionOutput")).toMatchObject({ relation_kind: "causal" });
  });

  it("keeps composition artifacts as true subtypes rather than directory-implied parts", () => {
    const artifact = compositionNode("CompositionArtifact");
    const artifactNodes = [
      "CompositionArtifact/CompositionOutput",
      "CompositionArtifact/CompositionOutput/SynthesisOutput",
      "CompositionArtifact/SynthesisInput",
    ].map(compositionNode);

    expect(artifactNodes.map(({ parent_relation }) => ({
      predicate: parent_relation?.predicate,
      relation_kind: parent_relation?.relation_kind,
    }))).toEqual([
      { predicate: "is_a", relation_kind: "hierarchy" },
      { predicate: "is_a", relation_kind: "hierarchy" },
      { predicate: "is_a", relation_kind: "hierarchy" },
    ]);
    expect(artifact.semantics?.definition?.en).not.toContain("ballot record");
  });

  it("keeps a ballot as an independent input entity rather than an artifact-directory child", () => {
    const ballot = compositionNode("VoteBallot");
    const voting = compositionNode("CompositionActivity/AggregationActivity/VotingActivity");

    expect(ballot.parent_relation).toBeNull();
    expect(relation(voting, "consumes", "concept:VoteBallot")).toMatchObject({
      relation_kind: "causal",
    });
    expect(example(ballot, "vote-ballot-boundary-sdk-structured-output")?.related_node_ids).toContain("VotingActivity");
  });

  it("links retained artifact examples to the causal activity that consumes or produces them", () => {
    const output = compositionNode("CompositionArtifact/CompositionOutput");
    const synthesisInput = compositionNode("CompositionArtifact/SynthesisInput");
    const synthesisOutput = compositionNode("CompositionArtifact/CompositionOutput/SynthesisOutput");

    expect(example(output, "composition-output-instance-rejected-candidate")?.related_relation_ids)
      .toContain("VotingActivity-produces-CompositionOutput");
    expect(example(synthesisInput, "synthesis-input-positive-approved-reviews")?.related_relation_ids)
      .toContain("Synthesis-consumes-SynthesisInput");
    expect(example(synthesisOutput, "synthesis-output-positive-combined-reviews")?.related_relation_ids)
      .toContain("Synthesis-produces-SynthesisOutput");
  });

  it("keeps synthesized content provenance explicit instead of inferring it from material references", () => {
    const synthesisOutput = compositionNode("CompositionArtifact/CompositionOutput/SynthesisOutput");

    expect(field(synthesisOutput, "source_ref")).toMatchObject({ required: true });
  });

  it("keeps hierarchy and causal endpoint nodes explicit in retained artifact examples", () => {
    const output = compositionNode("CompositionArtifact/CompositionOutput");
    const synthesisInput = compositionNode("CompositionArtifact/SynthesisInput");
    const synthesisOutput = compositionNode("CompositionArtifact/CompositionOutput/SynthesisOutput");

    expect(example(output, "composition-output-positive-selected-review")?.related_node_ids)
      .toEqual(expect.arrayContaining(["CompositionArtifact", "CompositionActivity"]));
    expect(example(synthesisInput, "synthesis-input-positive-approved-reviews")?.related_node_ids)
      .toEqual(expect.arrayContaining(["CompositionArtifact", "Synthesis"]));
    expect(example(synthesisOutput, "synthesis-output-positive-combined-reviews")?.related_node_ids)
      .toEqual(expect.arrayContaining(["CompositionOutput", "Synthesis"]));
  });

  it("keeps every declared relation's source and target explicit in its composition examples", () => {
    const compositionRoot = resolve("ontology", "orchestration-plane", "orchestration-composition");
    const nodes = compositionNodeFiles(compositionRoot).map((file) => parse(readFileSync(file, "utf8")) as Node);
    const endpoints = new Map(nodes.flatMap((node) => [
      node.parent_relation,
      ...(node.relations ?? []),
      ...(node.structure?.required_relations ?? []),
    ].flatMap((candidate) => candidate?.id && candidate.target && node.id
      ? [[candidate.id, {
        source: node.id,
        target: candidate.target.replace(/^concept:/, ""),
      }] as const]
      : [])));
    const omissions = nodes.flatMap((node) => (node.examples ?? []).flatMap((candidate) => (
      candidate.related_relation_ids?.flatMap((relationId) => {
        const endpoint = endpoints.get(relationId);
        const relatedNodes = new Set(candidate.related_node_ids ?? []);
        return endpoint && relatedNodes.has(endpoint.source) && relatedNodes.has(endpoint.target)
          ? []
          : [`${node.id ?? "unknown"}/${candidate.id}:${relationId}`];
      }) ?? []
    )));

    expect(omissions).toEqual([]);
  });

  it("does not imply an output exists when an activity disposition permits none", () => {
    const activity = compositionNode("CompositionActivity");
    const aggregation = compositionNode("CompositionActivity/AggregationActivity");
    const synthesis = compositionNode("CompositionActivity/AggregationActivity/Synthesis");
    const voting = compositionNode("CompositionActivity/AggregationActivity/VotingActivity");

    expect(activity.semantics?.definition?.en).toContain("any output artifacts");
    expect(aggregation.semantics?.short_definition?.en).toContain("any attributable result");
    expect(synthesis.semantics?.short_definition?.en).toContain("completed or escalated");
    expect(synthesis.semantics?.definition?.en).toContain("failed, cancelled, or conflict-rejected");
    expect(voting.semantics?.short_definition?.en).toContain("when completed");
    expect(voting.semantics?.definition?.en).toContain("may have no CompositionOutput");
  });

  it("keeps a complete configuration separate from the abstract specification supertype", () => {
    const specification = compositionNode("CompositionSpecification");
    const configuration = compositionNode("CompositionSpecification/CompositionConfiguration");
    const abstractFieldIds = specification.structure?.fields?.map(({ id }) => id) ?? [];
    const configurationFieldIds = configuration.structure?.fields?.map(({ id }) => id) ?? [];

    expect(specification.semantics?.definition?.en).toContain("abstract declarative");
    expect(abstractFieldIds).not.toEqual(expect.arrayContaining([
      "topology_ref",
      "pattern_refs",
      "aggregation_rule_refs",
      "binding_ref",
    ]));
    expect(configuration.parent_relation).toMatchObject({
      predicate: "is_a",
      relation_kind: "hierarchy",
      target: "concept:CompositionSpecification",
    });
    expect(configurationFieldIds).toEqual(expect.arrayContaining([
      "configuration_id",
      "topology_ref",
      "pattern_refs",
      "aggregation_rule_refs",
      "binding_ref",
    ]));
  });

  it("makes specification-level membership and plan references explicit without treating them as runtime facts", () => {
    const pattern = compositionNode("CompositionSpecification/CompositionPattern");
    const synthesisPattern = compositionNode("CompositionSpecification/CompositionPattern/SynthesisPattern");
    const votingPattern = compositionNode("CompositionSpecification/CompositionPattern/Voting");

    expect(relation(pattern, "has_part", "concept:CompositionPart")).toMatchObject({
      relation_kind: "composition",
      inverse_reading: { predicate: "part_of_composition_pattern" },
    });
    expect(relation(synthesisPattern, "uses_plan", "concept:SynthesisPlan")).toMatchObject({
      relation_kind: "association",
    });
    expect(relation(votingPattern, "governed_by", "concept:VotingRule")).toMatchObject({
      relation_kind: "governance",
    });
  });

  it("keeps a reusable voting rule declarative while a voting activity consumes ballots", () => {
    const votingRule = compositionNode("CompositionSpecification/AggregationRule/VotingRule");

    expect(votingRule.semantics?.definition?.en).toContain("defines eligibility and decision parameters for local VoteBallot records");
    expect(votingRule.semantics?.definition?.en).not.toContain("consumes local VoteBallot records");
  });
});
