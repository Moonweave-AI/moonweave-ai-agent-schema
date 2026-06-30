import { describe, expect, it } from "vitest";
import { ontologyDataset } from "../src/data/ontology";
import { buildGraphIr, graphSeparatesProtocolFamilies, hasHiddenChainOfThoughtField } from "../src/lib/graph";

describe("graph IR", () => {
  it("builds a non-empty graph from accepted ontology artifacts", () => {
    const graph = buildGraphIr(ontologyDataset);

    expect(graph.nodes.length).toBeGreaterThan(8);
    expect(graph.edges.length).toBeGreaterThan(6);
    expect(graph.generated_from).toContain("docs/rfcs/0001-ontology-layers.md");
  });

  it("keeps protocol families visible as separate evidence-backed nodes", () => {
    const graph = buildGraphIr(ontologyDataset);

    expect(graphSeparatesProtocolFamilies(graph)).toBe(true);
  });

  it("keeps statechart and benchmark semantics out of core edges", () => {
    const graph = buildGraphIr(ontologyDataset);
    const adapterEdges = graph.edges.filter((edge) =>
      ["transitions_state_on_event", "evaluates_run_on_benchmark"].includes(edge.label)
    );

    expect(adapterEdges).toHaveLength(2);
    expect(adapterEdges.every((edge) => edge.disposition === "adapter")).toBe(true);
  });

  it("does not model hidden chain-of-thought storage", () => {
    expect(hasHiddenChainOfThoughtField(ontologyDataset)).toBe(false);
  });
});
