export interface LiveForceNode {
  id: string;
  x: number;
  y: number;
  locked?: boolean;
}

export interface LiveForceEdge {
  source: string;
  target: string;
}

export interface LiveForceVelocity {
  x: number;
  y: number;
}

export interface LiveForceOptions {
  idealEdgeLength?: number;
  attraction?: number;
  repulsion?: number;
  damping?: number;
  maxStep?: number;
  minimumDistance?: number;
}

export interface LiveForceFrameInput {
  nodes: LiveForceNode[];
  edges: LiveForceEdge[];
  velocities: Record<string, LiveForceVelocity>;
  options?: LiveForceOptions;
}

export interface LiveForceFrameResult {
  nodes: LiveForceNode[];
  velocities: Record<string, LiveForceVelocity>;
}

const defaultOptions = {
  idealEdgeLength: 160,
  attraction: 0.045,
  repulsion: 2600,
  damping: 0.68,
  maxStep: 14,
  minimumDistance: 18
} satisfies Required<LiveForceOptions>;

function cappedVector(vector: LiveForceVelocity, maxLength: number): LiveForceVelocity {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= maxLength || length === 0) {
    return vector;
  }

  const scale = maxLength / length;
  return { x: vector.x * scale, y: vector.y * scale };
}

export function relaxLiveForceFrame(input: LiveForceFrameInput): LiveForceFrameResult {
  const options = { ...defaultOptions, ...input.options };
  const nodeById = new Map(input.nodes.map((node) => [node.id, node]));
  const forces = new Map(input.nodes.map((node) => [node.id, { x: 0, y: 0 }]));

  for (let index = 0; index < input.nodes.length; index += 1) {
    const left = input.nodes[index];
    for (let nextIndex = index + 1; nextIndex < input.nodes.length; nextIndex += 1) {
      const right = input.nodes[nextIndex];
      const dx = right.x - left.x;
      const dy = right.y - left.y;
      const distance = Math.max(options.minimumDistance, Math.hypot(dx, dy));
      const strength = options.repulsion / (distance * distance);
      const forceX = (dx / distance) * strength;
      const forceY = (dy / distance) * strength;
      const leftForce = forces.get(left.id);
      const rightForce = forces.get(right.id);

      if (leftForce && !left.locked) {
        leftForce.x -= forceX;
        leftForce.y -= forceY;
      }

      if (rightForce && !right.locked) {
        rightForce.x += forceX;
        rightForce.y += forceY;
      }
    }
  }

  for (const edge of input.edges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) {
      continue;
    }

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(options.minimumDistance, Math.hypot(dx, dy));
    const stretch = distance - options.idealEdgeLength;
    const forceX = (dx / distance) * stretch * options.attraction;
    const forceY = (dy / distance) * stretch * options.attraction;
    const sourceForce = forces.get(source.id);
    const targetForce = forces.get(target.id);

    if (sourceForce && !source.locked) {
      sourceForce.x += forceX;
      sourceForce.y += forceY;
    }

    if (targetForce && !target.locked) {
      targetForce.x -= forceX;
      targetForce.y -= forceY;
    }
  }

  const velocities: Record<string, LiveForceVelocity> = {};
  const nodes = input.nodes.map((node) => {
    if (node.locked) {
      velocities[node.id] = { x: 0, y: 0 };
      return { ...node };
    }

    const previousVelocity = input.velocities[node.id] ?? { x: 0, y: 0 };
    const force = forces.get(node.id) ?? { x: 0, y: 0 };
    const velocity = cappedVector(
      {
        x: (previousVelocity.x + force.x) * options.damping,
        y: (previousVelocity.y + force.y) * options.damping
      },
      options.maxStep
    );

    velocities[node.id] = velocity;
    return {
      ...node,
      x: node.x + velocity.x,
      y: node.y + velocity.y
    };
  });

  return { nodes, velocities };
}
