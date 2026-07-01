import { describe, expect, it } from "vitest";
import { relaxLiveForceFrame } from "../src/lib/live-force";
import type { LiveForceEdge, LiveForceNode } from "../src/lib/live-force";

function nodeById(nodes: LiveForceNode[], id: string): LiveForceNode {
  const node = nodes.find((candidate) => candidate.id === id);
  if (!node) {
    throw new Error(`Missing node ${id}`);
  }

  return node;
}

function edgeMidpointDistance(nodes: LiveForceNode[], left: LiveForceEdge, right: LiveForceEdge): number {
  const leftSource = nodeById(nodes, left.source);
  const leftTarget = nodeById(nodes, left.target);
  const rightSource = nodeById(nodes, right.source);
  const rightTarget = nodeById(nodes, right.target);
  const leftMidpoint = { x: (leftSource.x + leftTarget.x) / 2, y: (leftSource.y + leftTarget.y) / 2 };
  const rightMidpoint = { x: (rightSource.x + rightTarget.x) / 2, y: (rightSource.y + rightTarget.y) / 2 };

  return Math.hypot(leftMidpoint.x - rightMidpoint.x, leftMidpoint.y - rightMidpoint.y);
}

describe("live force relaxation", () => {
  it("keeps the dragged node fixed and pulls connected nodes toward it", () => {
    const result = relaxLiveForceFrame({
      nodes: [
        { id: "dragged", x: 260, y: 0, locked: true },
        { id: "neighbor", x: 20, y: 0 },
        { id: "side", x: 20, y: 160 }
      ],
      edges: [{ source: "dragged", target: "neighbor" }],
      velocities: {},
      options: { idealEdgeLength: 120, maxStep: 24, attraction: 0.09, repulsion: 1800, damping: 0.72 }
    });

    expect(result.nodes.find((node) => node.id === "dragged")).toMatchObject({ x: 260, y: 0 });
    expect(result.nodes.find((node) => node.id === "neighbor")?.x).toBeGreaterThan(20);
  });

  it("caps per-frame movement so drag relaxation stays smooth", () => {
    const result = relaxLiveForceFrame({
      nodes: [
        { id: "dragged", x: 640, y: 0, locked: true },
        { id: "neighbor", x: 0, y: 0 },
        { id: "second", x: 0, y: 18 }
      ],
      edges: [
        { source: "dragged", target: "neighbor" },
        { source: "neighbor", target: "second" }
      ],
      velocities: {},
      options: { idealEdgeLength: 120, maxStep: 18, attraction: 0.16, repulsion: 2400, damping: 0.8 }
    });

    for (const node of result.nodes.filter((node) => !node.locked)) {
      const original = node.id === "neighbor" ? { x: 0, y: 0 } : { x: 0, y: 18 };
      const distance = Math.hypot(node.x - original.x, node.y - original.y);
      expect(distance).toBeLessThanOrEqual(18.001);
    }
  });

  it("separates overlapping nodes with a label-sized collision radius", () => {
    const initialNodes = [
      { id: "dragged", x: 0, y: 0, locked: true },
      { id: "clustered-a", x: 4, y: 0 },
      { id: "clustered-b", x: 6, y: 5 }
    ];
    const result = relaxLiveForceFrame({
      nodes: initialNodes,
      edges: [],
      velocities: {},
      options: {
        collisionRadius: 56,
        collisionStrength: 0.8,
        maxStep: 36,
        repulsion: 800,
        damping: 0.85
      }
    });

    const distance = Math.hypot(
      nodeById(result.nodes, "clustered-a").x - nodeById(result.nodes, "clustered-b").x,
      nodeById(result.nodes, "clustered-a").y - nodeById(result.nodes, "clustered-b").y
    );

    expect(distance).toBeGreaterThan(Math.hypot(initialNodes[1].x - initialNodes[2].x, initialNodes[1].y - initialNodes[2].y));
  });

  it("nudges independent crossing edges apart instead of leaving them stacked", () => {
    const edges = [
      { source: "a", target: "b" },
      { source: "c", target: "d" }
    ];
    const nodes = [
      { id: "a", x: -80, y: -80 },
      { id: "b", x: 80, y: 80 },
      { id: "c", x: -80, y: 80 },
      { id: "d", x: 80, y: -80 }
    ];
    const before = edgeMidpointDistance(nodes, edges[0], edges[1]);
    const result = relaxLiveForceFrame({
      nodes,
      edges,
      velocities: {},
      options: {
        crossingStrength: 30,
        attraction: 0,
        repulsion: 0,
        damping: 1,
        maxStep: 40
      }
    });
    const after = edgeMidpointDistance(result.nodes, edges[0], edges[1]);

    expect(after).toBeGreaterThan(before);
  });
});
