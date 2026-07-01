import { describe, expect, it } from "vitest";
import { relaxLiveForceFrame } from "../src/lib/live-force";

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
});
