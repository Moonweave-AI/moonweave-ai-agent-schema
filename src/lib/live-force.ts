export interface LiveForceNode {
  id: string;
  x: number;
  y: number;
  locked?: boolean;
  collisionRadius?: number;
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
  collisionRadius?: number;
  collisionStrength?: number;
  crossingStrength?: number;
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
  minimumDistance: 18,
  collisionRadius: 48,
  collisionStrength: 0.55,
  crossingStrength: 10
} satisfies Required<LiveForceOptions>;

function cappedVector(vector: LiveForceVelocity, maxLength: number): LiveForceVelocity {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= maxLength || length === 0) {
    return vector;
  }

  const scale = maxLength / length;
  return { x: vector.x * scale, y: vector.y * scale };
}

function deterministicUnitVector(id: string): LiveForceVelocity {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const angle = ((hash >>> 0) / 4294967295) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function applyForce(forces: Map<string, LiveForceVelocity>, node: LiveForceNode, x: number, y: number): void {
  if (node.locked) {
    return;
  }

  const force = forces.get(node.id);
  if (!force) {
    return;
  }

  force.x += x;
  force.y += y;
}

function orientation(a: LiveForceNode, b: LiveForceNode, c: LiveForceNode): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function edgesShareEndpoint(left: LiveForceEdge, right: LiveForceEdge): boolean {
  return left.source === right.source || left.source === right.target || left.target === right.source || left.target === right.target;
}

function segmentsCross(a: LiveForceNode, b: LiveForceNode, c: LiveForceNode, d: LiveForceNode): boolean {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);

  return first * second < 0 && third * fourth < 0;
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
      const rawDistance = Math.hypot(dx, dy);
      const fallback = deterministicUnitVector(`${left.id}:${right.id}`);
      const unitX = rawDistance === 0 ? fallback.x : dx / rawDistance;
      const unitY = rawDistance === 0 ? fallback.y : dy / rawDistance;
      const distance = Math.max(options.minimumDistance, rawDistance);
      const strength = options.repulsion / (distance * distance);
      const forceX = unitX * strength;
      const forceY = unitY * strength;
      const collisionTarget = (left.collisionRadius ?? options.collisionRadius) + (right.collisionRadius ?? options.collisionRadius);

      applyForce(forces, left, -forceX, -forceY);
      applyForce(forces, right, forceX, forceY);

      if (rawDistance < collisionTarget) {
        const collisionPush = (collisionTarget - rawDistance) * options.collisionStrength;
        applyForce(forces, left, -unitX * collisionPush, -unitY * collisionPush);
        applyForce(forces, right, unitX * collisionPush, unitY * collisionPush);
      }
    }
  }

  for (let index = 0; index < input.edges.length; index += 1) {
    const leftEdge = input.edges[index];
    const leftSource = nodeById.get(leftEdge.source);
    const leftTarget = nodeById.get(leftEdge.target);
    if (!leftSource || !leftTarget) {
      continue;
    }

    for (let nextIndex = index + 1; nextIndex < input.edges.length; nextIndex += 1) {
      const rightEdge = input.edges[nextIndex];
      if (edgesShareEndpoint(leftEdge, rightEdge)) {
        continue;
      }

      const rightSource = nodeById.get(rightEdge.source);
      const rightTarget = nodeById.get(rightEdge.target);
      if (!rightSource || !rightTarget || !segmentsCross(leftSource, leftTarget, rightSource, rightTarget)) {
        continue;
      }

      const edgeDx = leftTarget.x - leftSource.x;
      const edgeDy = leftTarget.y - leftSource.y;
      const edgeLength = Math.max(options.minimumDistance, Math.hypot(edgeDx, edgeDy));
      const perpX = -edgeDy / edgeLength;
      const perpY = edgeDx / edgeLength;

      applyForce(forces, leftSource, perpX * options.crossingStrength, perpY * options.crossingStrength);
      applyForce(forces, leftTarget, perpX * options.crossingStrength, perpY * options.crossingStrength);
      applyForce(forces, rightSource, -perpX * options.crossingStrength, -perpY * options.crossingStrength);
      applyForce(forces, rightTarget, -perpX * options.crossingStrength, -perpY * options.crossingStrength);
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
