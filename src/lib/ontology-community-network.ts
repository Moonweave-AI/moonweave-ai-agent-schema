import type { Language } from "../i18n/ui-text";
import {
  ontologyEntityLabel,
  type OntologyEntityKind,
  type OntologyEntityRef,
  type OntologyIndex,
} from "./ontology-index";

export type OntologyGraphTheme = "dark" | "light";
export type CommunityEdgeEvidence = "canonical" | "derived";
export type CommunityEdgeLayoutRole =
  | "ownership"
  | "primary-backbone"
  | "secondary-backbone"
  | "cross-link"
  | "none";

export interface OntologyCommunityGraphAlgorithm {
  readonly engine: string;
  readonly assignment_policy: "canonical-module-owner";
  readonly diagnostic_engine: string;
  readonly diagnostic_community_count: number;
  readonly seed: number;
  readonly resolution: number;
  readonly oversized_fraction: number;
  readonly minimum_split_size: number;
  readonly cohesion_threshold: number;
  readonly cohesion_split_minimum_size: number;
}

export interface OntologyCommunityGraphCommunity {
  readonly id: number;
  readonly hub_ref: OntologyEntityRef;
  readonly owner_module_id: string | null;
  readonly label: string;
  readonly member_count: number;
  readonly cohesion: number;
  readonly member_signature: string;
  readonly member_refs: readonly OntologyEntityRef[];
}

export interface OntologyCommunityGraphNode {
  readonly ref: OntologyEntityRef;
  readonly community_id: number;
  readonly degree: number;
}

export interface OntologyCommunityGraphEdge {
  readonly id: string;
  readonly source: OntologyEntityRef;
  readonly target: OntologyEntityRef;
  readonly relation: string;
  readonly evidence: CommunityEdgeEvidence;
  readonly relation_kind: string;
  readonly layout_role: CommunityEdgeLayoutRole;
}

export interface OntologyCommunityGraphArtifact {
  readonly schema_version: "2.0.0";
  readonly source_sha256: string;
  readonly projection_sha256: string;
  readonly algorithm: OntologyCommunityGraphAlgorithm;
  readonly metrics: {
    readonly node_count: number;
    readonly edge_count: number;
    readonly community_count: number;
    readonly maximum_degree: number;
  };
  readonly communities: readonly OntologyCommunityGraphCommunity[];
  readonly nodes: readonly OntologyCommunityGraphNode[];
  readonly edges: readonly OntologyCommunityGraphEdge[];
}

export const GRAPHIFY_FORCE_ATLAS_OPTIONS = Object.freeze({
  layout: Object.freeze({ randomSeed: 42, improvedLayout: false }),
  physics: Object.freeze({
    enabled: true,
    solver: "forceAtlas2Based" as const,
    forceAtlas2Based: Object.freeze({
      gravitationalConstant: -60,
      centralGravity: 0.005,
      springLength: 120,
      springConstant: 0.08,
      damping: 0.4,
      avoidOverlap: 0.8,
    }),
    stabilization: Object.freeze({ iterations: 200, fit: true }),
  }),
});

export const ONTOLOGY_COMMUNITY_GRAPH_LIMITS = Object.freeze({
  nodes: 5_000,
  edges: 50_000,
  communities: 5_000,
  memberRefsPerCommunity: 5_000,
  totalMemberRefs: 5_000,
  validationErrors: 100,
});

const MAX_VALIDATION_ERROR_MESSAGE_LENGTH = 512;

interface BoundedValidationErrors {
  readonly add: (message: string) => void;
  readonly hasErrors: () => boolean;
  readonly finish: () => readonly string[];
}

const createBoundedValidationErrors = (): BoundedValidationErrors => {
  let messages: readonly string[] = Object.freeze([]);
  let omittedCount = 0;
  const limit = ONTOLOGY_COMMUNITY_GRAPH_LIMITS.validationErrors;

  return Object.freeze({
    add: (message: string): void => {
      const boundedMessage = message.length <= MAX_VALIDATION_ERROR_MESSAGE_LENGTH
        ? message
        : `${message.slice(0, MAX_VALIDATION_ERROR_MESSAGE_LENGTH - 3)}...`;
      if (messages.length < limit) {
        messages = Object.freeze([...messages, boundedMessage]);
      } else {
        omittedCount += 1;
      }
    },
    hasErrors: (): boolean => messages.length > 0 || omittedCount > 0,
    finish: (): readonly string[] => {
      if (omittedCount === 0) return Object.freeze([...messages]);
      return Object.freeze([
        ...messages.slice(0, limit - 1),
        `validation error report truncated; ${omittedCount + 1} additional errors omitted`,
      ]);
    },
  });
};

export const communityProjectionFingerprint = (artifact: unknown): string => {
  const value = (artifact as { readonly projection_sha256?: unknown } | null)
    ?.projection_sha256;
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value)
    ? `sha256:${value}`
    : "sha256:invalid";
};

const COMMUNITY_PALETTES: Readonly<Record<OntologyGraphTheme, readonly string[]>> = {
  dark: Object.freeze([
    "#65B5F6", "#F4A261", "#F07178", "#4EC9B0", "#72C472",
    "#E6C65C", "#B39DDB", "#F38BA8", "#C49A78", "#9AA7B8",
  ]),
  light: Object.freeze([
    "#2F6FA3", "#B8611B", "#B84048", "#267D75", "#397D3C",
    "#947814", "#7656A8", "#A63F6D", "#805D45", "#667085",
  ]),
};

export interface OntologyNetworkNodeVisual {
  readonly id: OntologyEntityRef;
  readonly label: string;
  readonly titleText: string;
  readonly communityId: number;
  readonly communityLabel: string;
  readonly kind: OntologyEntityKind;
  readonly degree: number;
  readonly size: number;
  readonly baseFontSize: number;
  readonly color: {
    readonly background: string;
    readonly border: string;
    readonly highlight: { readonly background: string; readonly border: string };
    readonly hover: { readonly background: string; readonly border: string };
  };
  readonly font: { readonly size: number; readonly color: string; readonly face: string };
}

export interface OntologyNetworkEdgeVisual {
  readonly id: string;
  readonly from: OntologyEntityRef;
  readonly to: OntologyEntityRef;
  readonly label: "";
  readonly relation: string;
  readonly relationLabel: string;
  readonly titleText: string;
  readonly evidence: CommunityEdgeEvidence;
  readonly canonicalRelationId: string | null;
  readonly physics: boolean;
  readonly dashes: boolean;
  readonly width: number;
  readonly opacity: number;
  readonly color: string;
  readonly arrows: { readonly to: { readonly enabled: true; readonly scaleFactor: 0.5 } };
  readonly smooth: {
    readonly enabled: true;
    readonly type: "continuous" | "curvedCW" | "curvedCCW";
    readonly roundness: number;
  };
}

export interface OntologyNetworkCommunityVisual {
  readonly id: number;
  readonly label: string;
  readonly count: number;
  readonly color: string;
  readonly cohesion: number;
}

export interface OntologyCommunityNetworkModel {
  readonly nodes: readonly OntologyNetworkNodeVisual[];
  readonly edges: readonly OntologyNetworkEdgeVisual[];
  readonly communities: readonly OntologyNetworkCommunityVisual[];
  readonly maximumDegree: number;
  readonly algorithmLabel: string;
}

interface OntologyNetworkLocalizedText {
  readonly algorithmLabel: string;
  readonly degree: string;
  readonly canonicalRelation: string;
  readonly derivedView: string;
  readonly relationKind: string;
  readonly layoutRole: string;
  readonly kinds: Readonly<Record<OntologyEntityKind, string>>;
}

const NETWORK_MODEL_TEXT: Readonly<Record<Language, OntologyNetworkLocalizedText>> = {
  zh: {
    algorithmLabel: "规范模块社区",
    degree: "连接度",
    canonicalRelation: "规范关系",
    derivedView: "派生视图",
    relationKind: "关系类型",
    layoutRole: "布局角色",
    kinds: { root: "本体", plane: "领域", module: "模块", concept: "概念" },
  },
  en: {
    algorithmLabel: "Canonical Module communities",
    degree: "degree",
    canonicalRelation: "canonical relation",
    derivedView: "derived view",
    relationKind: "relation kind",
    layoutRole: "layout role",
    kinds: { root: "Ontology", plane: "Domain", module: "Module", concept: "Concept" },
  },
  ja: {
    algorithmLabel: "正規モジュールコミュニティ",
    degree: "次数",
    canonicalRelation: "正規関係",
    derivedView: "派生ビュー",
    relationKind: "関係種別",
    layoutRole: "レイアウト役割",
    kinds: { root: "オントロジー", plane: "ドメイン", module: "モジュール", concept: "概念" },
  },
};

const rounded = (value: number): number => Math.round(value * 10) / 10;

const communityColor = (communityId: number, theme: OntologyGraphTheme): string => {
  const palette = COMMUNITY_PALETTES[theme];
  return palette[Math.abs(communityId) % palette.length];
};

const derivedRelationLabel = (relation: string, language: Language): string => {
  const labels: Readonly<Record<string, Readonly<Record<Language, string>>>> = {
    contains_domain: { zh: "包含领域", en: "contains domain", ja: "ドメインを含む" },
    contains_module: { zh: "包含边界", en: "contains boundary", ja: "境界を含む" },
    contains_root_concept: { zh: "引入根概念", en: "introduces root concept", ja: "ルート概念を導入" },
  };
  return labels[relation]?.[language] ?? relation.replaceAll("_", " ");
};

const localizedRelationLabel = (
  index: OntologyIndex,
  edge: OntologyCommunityGraphEdge,
  language: Language,
): string => {
  const relation = edge.evidence === "canonical" ? index.relationsById.get(edge.id) : undefined;
  return relation?.labels?.[language] ?? relation?.predicate ?? derivedRelationLabel(edge.relation, language);
};

const entityLabel = (
  index: OntologyIndex,
  ref: OntologyEntityRef,
  language: Language,
): string => {
  const entity = index.entitiesByRef.get(ref);
  return entity ? ontologyEntityLabel(entity, language) : ref;
};

type OntologyEdgeSmooth = OntologyNetworkEdgeVisual["smooth"];

const compareStableIdentifiers = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const edgePairKey = (edge: OntologyCommunityGraphEdge): string =>
  compareStableIdentifiers(edge.source, edge.target) <= 0
    ? `${edge.source}\u0000${edge.target}`
    : `${edge.target}\u0000${edge.source}`;

const curvedRoundness = (index: number, edgeCount: number): number => {
  const levelCount = Math.ceil(edgeCount / 2);
  const level = Math.floor(index / 2);
  const maximum = Math.min(0.72, 0.12 + (levelCount - 1) * 0.1);
  const value = levelCount === 1
    ? 0.12
    : 0.12 + level * ((maximum - 0.12) / (levelCount - 1));
  return Math.round(value * 1_000) / 1_000;
};

const edgeSmoothGeometry = (
  edges: readonly OntologyCommunityGraphEdge[],
): ReadonlyMap<string, OntologyEdgeSmooth> => {
  const groups = new Map<string, OntologyCommunityGraphEdge[]>();
  for (const edge of edges) {
    const key = edgePairKey(edge);
    groups.set(key, [...(groups.get(key) ?? []), edge]);
  }

  return new Map([...groups.values()].flatMap(
    (group): ReadonlyArray<readonly [string, OntologyEdgeSmooth]> => {
      const ordered = [...group].sort(
        ({ id: left }, { id: right }) => compareStableIdentifiers(left, right),
      );
      if (ordered.length === 1) {
        return [[ordered[0].id, {
          enabled: true,
          type: "continuous",
          roundness: 0.2,
        } satisfies OntologyEdgeSmooth] as const];
      }

      return ordered.map((edge, index) => {
        const clockwiseFromCanonicalOrder = index % 2 === 0;
        const followsCanonicalEndpointOrder =
          compareStableIdentifiers(edge.source, edge.target) <= 0;
        const type = clockwiseFromCanonicalOrder === followsCanonicalEndpointOrder
          ? "curvedCW" as const
          : "curvedCCW" as const;
        return [edge.id, {
          enabled: true,
          type,
          roundness: curvedRoundness(index, ordered.length),
        } satisfies OntologyEdgeSmooth] as const;
      });
    },
  ));
};

export const validateOntologyCommunityGraph = (
  index: OntologyIndex,
  artifact: OntologyCommunityGraphArtifact,
  expectedSourceFingerprint?: string,
): readonly string[] => {
  if (
    !artifact || typeof artifact !== "object" ||
    !Array.isArray(artifact.nodes) ||
    !Array.isArray(artifact.edges) ||
    !Array.isArray(artifact.communities) ||
    !artifact.metrics || typeof artifact.metrics !== "object" ||
    !artifact.algorithm || typeof artifact.algorithm !== "object"
  ) return Object.freeze(["community artifact has an invalid top-level shape"]);
  const errors = createBoundedValidationErrors();
  const limits = ONTOLOGY_COMMUNITY_GRAPH_LIMITS;
  if (artifact.nodes.length > limits.nodes) {
    errors.add(`nodes exceed the ${limits.nodes} item limit`);
  }
  if (artifact.edges.length > limits.edges) {
    errors.add(`edges exceed the ${limits.edges} item limit`);
  }
  if (artifact.communities.length > limits.communities) {
    errors.add(`communities exceed the ${limits.communities} item limit`);
  }
  if (errors.hasErrors()) return errors.finish();

  let totalMemberRefs = 0;
  for (const community of artifact.communities) {
    if (!community || !Array.isArray(community.member_refs)) continue;
    if (community.member_refs.length > limits.memberRefsPerCommunity) {
      errors.add(
        `community ${community.id} member_refs exceed the ${limits.memberRefsPerCommunity} item limit`,
      );
      return errors.finish();
    }
    totalMemberRefs += community.member_refs.length;
    if (totalMemberRefs > limits.totalMemberRefs) {
      errors.add(
        `community member_refs exceed the aggregate ${limits.totalMemberRefs} item limit`,
      );
      return errors.finish();
    }
  }

  if (artifact.schema_version !== "2.0.0") errors.add("schema_version must be 2.0.0");
  if (artifact.algorithm.seed !== 42) errors.add("community seed must be 42");
  if (artifact.algorithm.engine !== "canonical-module-anchors") {
    errors.add("community engine must be canonical-module-anchors");
  }
  if (artifact.algorithm.assignment_policy !== "canonical-module-owner") {
    errors.add("community assignment_policy must be canonical-module-owner");
  }
  if (
    typeof artifact.algorithm.diagnostic_engine !== "string" ||
    artifact.algorithm.diagnostic_engine.trim().length === 0
  ) {
    errors.add("community diagnostic_engine must be recorded");
  }
  if (
    !Number.isSafeInteger(artifact.algorithm.diagnostic_community_count) ||
    artifact.algorithm.diagnostic_community_count < 1
  ) {
    errors.add("community diagnostic_community_count must be a positive safe integer");
  }
  if (!/^[a-f0-9]{64}$/u.test(artifact.projection_sha256)) {
    errors.add("projection_sha256 must be lowercase SHA-256");
  }
  const expectedSource = expectedSourceFingerprint?.replace(/^sha256:/u, "");
  if (expectedSource && artifact.source_sha256 !== expectedSource) {
    errors.add("source_sha256 does not match the loaded canonical ontology");
  }

  const expectedNodeRefs = new Set<OntologyEntityRef>(
    [...index.entitiesByRef.values()]
      .filter((entity) => entity.data.status !== "deprecated")
      .map(({ ref }) => ref),
  );
  const nodeRefs = new Set<OntologyEntityRef>();
  for (const node of artifact.nodes) {
    if (!node || typeof node.ref !== "string") {
      errors.add("community artifact contains an invalid node");
      continue;
    }
    if (nodeRefs.has(node.ref)) errors.add(`duplicate node: ${node.ref}`);
    nodeRefs.add(node.ref);
    if (!index.entitiesByRef.has(node.ref)) errors.add(`unknown node: ${node.ref}`);
    if (!Number.isSafeInteger(node.degree) || node.degree < 0) {
      errors.add(`invalid degree: ${node.ref}`);
    }
  }
  if (
    nodeRefs.size !== expectedNodeRefs.size ||
    [...expectedNodeRefs].some((ref) => !nodeRefs.has(ref))
  ) {
    errors.add("node set does not match the current canonical ontology projection");
  }
  if (artifact.metrics.node_count !== artifact.nodes.length) {
    errors.add(`node_count ${artifact.metrics.node_count} != ${artifact.nodes.length}`);
  }
  if (artifact.metrics.edge_count !== artifact.edges.length) {
    errors.add(`edge_count ${artifact.metrics.edge_count} != ${artifact.edges.length}`);
  }
  if (artifact.metrics.community_count !== artifact.communities.length) {
    errors.add(`community_count ${artifact.metrics.community_count} != ${artifact.communities.length}`);
  }

  const memberships = new Map<OntologyEntityRef, number>();
  const communityIds = new Set<number>();
  for (const community of artifact.communities) {
    if (!community || !Number.isSafeInteger(community.id) || community.id < 0) {
      errors.add("community artifact contains an invalid community");
      continue;
    }
    if (communityIds.has(community.id)) errors.add(`duplicate community id: ${community.id}`);
    communityIds.add(community.id);
    if (!Array.isArray(community.member_refs)) {
      errors.add(`community ${community.id} member_refs must be an array`);
      continue;
    }
    if (community.member_count !== community.member_refs.length) {
      errors.add(`community ${community.id} member_count is stale`);
    }
    if (!community.member_refs.includes(community.hub_ref)) {
      errors.add(`community ${community.id} hub is not a member`);
    }
    for (const ref of community.member_refs) {
      if (memberships.has(ref)) errors.add(`duplicate community membership: ${ref}`);
      memberships.set(ref, community.id);
      if (!nodeRefs.has(ref)) errors.add(`community member is not a node: ${ref}`);
    }
  }
  for (const node of artifact.nodes) {
    if (memberships.get(node.ref) !== node.community_id) {
      errors.add(`community assignment mismatch: ${node.ref}`);
    }
  }
  const canonicalLabel = (
    entity: Readonly<{ readonly id: string; readonly labels: Readonly<Record<string, unknown>> }>,
  ): string => {
    for (const language of ["en", "zh", "ja"] as const) {
      const label = entity.labels[language];
      if (typeof label === "string" && label.trim().length > 0) return label.trim();
    }
    return entity.id;
  };
  const expectedCommunities = [
    {
      id: 0,
      label: canonicalLabel(index.ontology),
      hubRef: index.rootRef,
      ownerModuleId: null,
      memberRefs: [
        index.rootRef,
        ...[...index.planesById.values()].map(({ id }) => `plane:${id}` as OntologyEntityRef),
      ].sort(compareStableIdentifiers),
    },
    ...[...index.modulesById.values()]
      .sort(({ id: left }, { id: right }) => compareStableIdentifiers(left, right))
      .map((module, offset) => ({
        id: offset + 1,
        label: canonicalLabel(module),
        hubRef: `module:${module.id}` as OntologyEntityRef,
        ownerModuleId: module.id,
        memberRefs: [
          `module:${module.id}` as OntologyEntityRef,
          ...[...index.conceptsById.values()]
            .filter((concept) => concept.status !== "deprecated" && concept.module_id === module.id)
            .map(({ id }) => `concept:${id}` as OntologyEntityRef),
        ].sort(compareStableIdentifiers),
      })),
  ];
  if (artifact.communities.length !== expectedCommunities.length) {
    errors.add("visible communities must contain one navigation community and one per Module");
  }
  const communityById = new Map(artifact.communities.map((community) => [community.id, community]));
  for (const expectedCommunity of expectedCommunities) {
    const community = communityById.get(expectedCommunity.id);
    if (!community) {
      errors.add(`canonical owner community is missing: ${expectedCommunity.id}`);
      continue;
    }
    if (community.owner_module_id !== expectedCommunity.ownerModuleId) {
      errors.add(`community ${community.id} owner_module_id does not match canonical owner`);
    }
    if (community.label !== expectedCommunity.label) {
      errors.add(`community ${community.id} label does not match its canonical owner`);
    }
    if (community.hub_ref !== expectedCommunity.hubRef) {
      errors.add(`community ${community.id} hub_ref is not its canonical owner anchor`);
    }
    const actualMembers = [...community.member_refs].sort(compareStableIdentifiers);
    if (
      actualMembers.length !== expectedCommunity.memberRefs.length ||
      actualMembers.some((member, index) => member !== expectedCommunity.memberRefs[index])
    ) {
      errors.add(`community ${community.id} members do not match canonical Module ownership`);
    }
  }

  const expectedEdges = new Map<string, Readonly<{
    source: OntologyEntityRef;
    target: OntologyEntityRef;
      relation: string;
      evidence: CommunityEdgeEvidence;
      relation_kind: string;
      layout_role: CommunityEdgeLayoutRole;
  }>>();
  for (const relation of index.relationsById.values()) {
    if (relation.status === "deprecated") continue;
    expectedEdges.set(relation.id, {
      source: `concept:${relation.source_id}`,
      target: `concept:${relation.target_id}`,
      relation: relation.predicate,
      evidence: "canonical",
      relation_kind: relation.relation_kind,
      layout_role: relation.layout_role ?? "none",
    });
  }
  for (const plane of index.planesById.values()) {
    expectedEdges.set(`derived:ontology-plane:${plane.id}`, {
      source: index.rootRef,
      target: `plane:${plane.id}`,
      relation: "contains_domain",
      evidence: "derived",
      relation_kind: "organization",
      layout_role: "ownership",
    });
  }
  for (const module of index.modulesById.values()) {
    expectedEdges.set(`derived:plane-module:${module.plane_id}:${module.id}`, {
      source: `plane:${module.plane_id}`,
      target: `module:${module.id}`,
      relation: "contains_module",
      evidence: "derived",
      relation_kind: "organization",
      layout_role: "ownership",
    });
    for (const rootRef of index.rootConceptRefsByModuleId.get(module.id) ?? []) {
      if (!expectedNodeRefs.has(rootRef)) continue;
      const rootId = index.entitiesByRef.get(rootRef)?.id;
      if (!rootId) continue;
      expectedEdges.set(`derived:module-root:${module.id}:${rootId}`, {
        source: `module:${module.id}`,
        target: rootRef,
        relation: "contains_root_concept",
        evidence: "derived",
        relation_kind: "organization",
        layout_role: "ownership",
      });
    }
  }

  const edgeIds = new Set<string>();
  const degrees = new Map([...nodeRefs].map((ref) => [ref, 0]));
  for (const edge of artifact.edges) {
    if (!edge || typeof edge.id !== "string") {
      errors.add("community artifact contains an invalid edge");
      continue;
    }
    if (edgeIds.has(edge.id)) errors.add(`duplicate edge: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeRefs.has(edge.source) || !nodeRefs.has(edge.target)) {
      errors.add(`edge endpoint missing: ${edge.id}`);
    }
    const expected = expectedEdges.get(edge.id);
    if (!expected) errors.add(`unexpected projection edge: ${edge.id}`);
    else if (
      edge.source !== expected.source ||
      edge.target !== expected.target ||
      edge.relation !== expected.relation ||
      edge.evidence !== expected.evidence ||
      edge.relation_kind !== expected.relation_kind ||
      edge.layout_role !== expected.layout_role
    ) errors.add(`projection edge semantics mismatch: ${edge.id}`);
    if (nodeRefs.has(edge.source)) {
      degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    }
    if (nodeRefs.has(edge.target)) {
      degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
    }
  }
  if (
    edgeIds.size !== expectedEdges.size ||
    [...expectedEdges.keys()].some((id) => !edgeIds.has(id))
  ) {
    errors.add("edge set does not match the canonical and ownership projection");
  }
  for (const node of artifact.nodes) {
    if (node.degree !== degrees.get(node.ref)) errors.add(`degree mismatch: ${node.ref}`);
  }
  const maximumDegree = Math.max(0, ...degrees.values());
  if (artifact.metrics.maximum_degree !== maximumDegree) {
    errors.add("maximum_degree is stale");
  }
  return errors.finish();
};

export const buildOntologyCommunityNetworkModel = (
  index: OntologyIndex,
  artifact: OntologyCommunityGraphArtifact,
  language: Language,
  theme: OntologyGraphTheme,
): OntologyCommunityNetworkModel => {
  const text = NETWORK_MODEL_TEXT[language];
  const maximumDegree = Math.max(artifact.metrics.maximum_degree, 1);
  const labelThreshold = maximumDegree * 0.15;
  const communityLabels = new Map(artifact.communities.map((community) => [
    community.id,
    entityLabel(index, community.hub_ref, language) || community.label,
  ]));
  const fontColor = theme === "dark" ? "#F7FAFC" : "#172033";
  const edgeColor = theme === "dark" ? "#A7B4C7" : "#556274";
  const smoothGeometryByEdgeId = edgeSmoothGeometry(artifact.edges);

  const nodes = artifact.nodes.map((node): OntologyNetworkNodeVisual => {
    const entity = index.entitiesByRef.get(node.ref);
    const kind = entity?.kind ?? "concept";
    const label = entity ? ontologyEntityLabel(entity, language) : node.ref;
    const color = communityColor(node.community_id, theme);
    const communityLabel = communityLabels.get(node.community_id) ?? `Community ${node.community_id}`;
    const conceptModuleId = entity?.kind === "concept"
      ? (entity.data as { readonly module_id: string }).module_id
      : null;
    const structuralHub = entity !== undefined && (
      entity.kind !== "concept" ||
      (conceptModuleId !== null &&
        (index.rootConceptRefsByModuleId.get(conceptModuleId) ?? []).includes(node.ref))
    );
    const baseFontSize = structuralHub || node.degree >= labelThreshold ? 12 : 0;
    return {
      id: node.ref,
      label,
      titleText: `${label}\n${communityLabel}\n${text.kinds[kind]} · ${text.degree} ${node.degree}`,
      communityId: node.community_id,
      communityLabel,
      kind,
      degree: node.degree,
      size: rounded(10 + 30 * (node.degree / maximumDegree)),
      baseFontSize,
      color: {
        background: color,
        border: color,
        highlight: { background: theme === "dark" ? "#FFFFFF" : "#F8FAFC", border: color },
        hover: { background: theme === "dark" ? "#EAF6FF" : "#FFFFFF", border: color },
      },
      font: { size: baseFontSize, color: fontColor, face: "Inter, system-ui, sans-serif" },
    };
  });

  const edges = artifact.edges.map((edge): OntologyNetworkEdgeVisual => {
    const relationLabel = localizedRelationLabel(index, edge, language);
    const sourceLabel = entityLabel(index, edge.source, language);
    const targetLabel = entityLabel(index, edge.target, language);
    const canonical = edge.evidence === "canonical";
    const participatesInStructuralLayout = edge.layout_role === "ownership" ||
      edge.layout_role === "primary-backbone";
    return {
      id: edge.id,
      from: edge.source,
      to: edge.target,
      label: "",
      relation: edge.relation,
      relationLabel,
      titleText: `${sourceLabel} → ${relationLabel} → ${targetLabel}\n${canonical ? text.canonicalRelation : text.derivedView} · ${text.relationKind}: ${edge.relation_kind} · ${text.layoutRole}: ${edge.layout_role}`,
      evidence: edge.evidence,
      canonicalRelationId: canonical ? edge.id : null,
      physics: participatesInStructuralLayout,
      dashes: !canonical,
      width: canonical ? 2 : 1,
      opacity: canonical ? 0.7 : 0.35,
      color: edgeColor,
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      smooth: smoothGeometryByEdgeId.get(edge.id) ?? {
        enabled: true,
        type: "continuous",
        roundness: 0.2,
      },
    };
  });

  const communities = artifact.communities.map((community): OntologyNetworkCommunityVisual => ({
    id: community.id,
    label: communityLabels.get(community.id) ?? community.label,
    count: community.member_count,
    color: communityColor(community.id, theme),
    cohesion: community.cohesion,
  }));

  return {
    nodes,
    edges,
    communities,
    maximumDegree,
    algorithmLabel: text.algorithmLabel,
  };
};
