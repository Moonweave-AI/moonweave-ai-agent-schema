import { createHash } from "node:crypto";

import { loadOntologyTree, OntologySourceError } from "./ontology-yaml-source.mjs";

const hashJson = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

const PRIMARY_BACKBONE_RELATION_KINDS = Object.freeze({
  is_a: "hierarchy",
  part_of: "composition",
});

const deepFreeze = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const nested of Object.values(value)) deepFreeze(nested, seen);
  return Object.freeze(value);
};

const localizedFallback = (value, fallback = "Not yet documented") => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return Object.freeze({ zh: fallback, en: fallback, ja: fallback });
};

const sourceStatus = (node) => node.status === "accepted" ? "accepted" : "review";

const hasAcceptedReviewClosure = (value) => {
  if (Array.isArray(value)) return value.every(hasAcceptedReviewClosure);
  if (!value || typeof value !== "object") return true;
  return Object.entries(value).every(([key, nested]) => {
    if (key === "review_status") return nested === "accepted";
    if (key === "review" && nested && typeof nested === "object" && "status" in nested) {
      return nested.status === "accepted" && hasAcceptedReviewClosure(nested);
    }
    return hasAcceptedReviewClosure(nested);
  });
};

const hasManualNodeAcceptance = (node) =>
  node.status === "accepted" &&
  node.review?.status === "accepted" &&
  node.review?.method === "manual-semantic" &&
  typeof node.review?.reviewer === "string" &&
  node.review.reviewer.length > 0 &&
  typeof node.review?.reviewed_on === "string" &&
  node.review.reviewed_on.length > 0 &&
  hasAcceptedReviewClosure(node);

const isTreeReleasable = (tree) => {
  const sources = collectAllSources(tree.nodes);
  const sourceIds = new Set(sources.map(({ id }) => id));
  const sourcesAccepted = sources.every((source) =>
    typeof source.id === "string" &&
    source.id.length > 0 &&
    source.review?.status === "accepted" &&
    typeof source.review?.reviewed_on === "string" &&
    source.review.reviewed_on.length > 0 &&
    hasAcceptedReviewClosure(source));
  const claimsAccepted = tree.nodes.every((node) =>
    (node.source_claims ?? []).every((claim) =>
      claim.review_status === "accepted" &&
      sourceIds.has(claim.source ?? claim.source_id)));
  return sourcesAccepted && claimsAccepted && tree.nodes.every(hasManualNodeAcceptance);
};

const canonicalReview = (node) => {
  const review = node.review ?? {};
  const accepted = review.status === "accepted" && review.method === "manual-semantic";
  const note = localizedFallback(review.note, "Pending manual semantic review.");
  return {
    review_status: accepted ? "accepted" : "draft",
    reviewers: review.reviewer ? [{
      reviewer_id: review.reviewer,
      reviewer_role: "ontology",
      reviewer_kind: "automated-agent",
      reviewed_on: review.reviewed_on ?? "1970-01-01",
      decision_note: note,
    }] : [],
  };
};

const canonicalClaim = (claim) => ({
  source_id: claim.source ?? claim.source_id,
  supports: claim.supports,
  locator: claim.locator,
  evidence_kind: claim.evidence_kind,
  confidence: claim.confidence,
  review_status: claim.review_status ?? "draft",
});

const createClaimResolver = (node) => {
  const claims = Array.isArray(node.source_claims) ? node.source_claims : [];
  const claimsById = new Map(
    claims.filter((claim) => claim && typeof claim === "object" && claim.id)
      .map((claim) => [claim.id, claim]),
  );
  const resolveClaims = (value) => (Array.isArray(value) ? value : []).map((claim) => {
    const resolved = typeof claim === "string" ? claimsById.get(claim) : claim;
    if (!resolved) {
      throw new OntologySourceError(
        "UNKNOWN_SOURCE_CLAIM",
        `Node ${node.id} references unknown source claim ${String(claim)}`,
      );
    }
    return canonicalClaim(resolved);
  });
  return { claims, resolveClaims };
};

const normalizeEmbeddedClaims = (value, resolveClaims) => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeEmbeddedClaims(entry, resolveClaims));
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    key === "source_claims"
      ? resolveClaims(nested)
      : normalizeEmbeddedClaims(nested, resolveClaims),
  ]));
};

const commonInformation = (node) => {
  const semantics = node.semantics ?? {};
  const { claims, resolveClaims } = createClaimResolver(node);
  return {
    labels: localizedFallback(node.labels, node.id),
    short_definitions: localizedFallback(
      semantics.short_definition ?? node.short_definitions,
      node.id,
    ),
    definitions: localizedFallback(semantics.definition ?? node.definitions, node.id),
    why_needed: localizedFallback(semantics.why_needed ?? node.why_needed, node.id),
    includes: semantics.includes ?? node.includes ?? [],
    excludes: semantics.excludes ?? node.excludes ?? [],
    examples: normalizeEmbeddedClaims(node.examples ?? [], resolveClaims),
    source_claims: claims.map(canonicalClaim),
    status: sourceStatus(node),
    review: canonicalReview(node),
    introduced_in: node.introduced_in ?? null,
    change_note: node.change_note ?? {},
    resolveClaims,
  };
};

const withoutResolver = ({ resolveClaims: _resolveClaims, ...value }) => value;

const compilePlane = (node) => {
  const common = commonInformation(node);
  return {
    id: node.id,
    ...withoutResolver(common),
    purpose: localizedFallback(node.purpose ?? node.semantics?.why_needed, node.id),
  };
};

const emptyInteractionFacet = Object.freeze({
  applicable: false,
  description: null,
  family_concept_ids: Object.freeze([]),
  relation_ids: Object.freeze([]),
  not_applicable_reason: Object.freeze({
    zh: "该模块尚未声明此交互面。",
    en: "This interaction facet is not declared for the module.",
    ja: "この相互作用ファセットはモジュールで宣言されていません。",
  }),
});

const compileModule = (node, planeId) => {
  const common = commonInformation(node);
  const contract = node.module_contract ?? {};
  return {
    id: node.id,
    plane_id: planeId,
    ...withoutResolver(common),
    purpose: localizedFallback(node.purpose ?? node.semantics?.why_needed, node.id),
    interaction_contract: contract.interaction_contract ?? {
      applicability: "descriptive",
      facets: {
        input: emptyInteractionFacet,
        output: emptyInteractionFacet,
        failure: emptyInteractionFacet,
        recovery: emptyInteractionFacet,
      },
      review: canonicalReview(node),
    },
    taxonomy_contract: contract.taxonomy_contract ?? {
      applicability: "mixed-backbone",
      hierarchy_policy: "arbitrary-depth-reviewed-backbone",
      key_root_concept_ids: [],
      allowed_backbone_predicates: ["is_a"],
      flat_root_exception_concept_ids: [],
      not_applicable_reason: null,
      review: canonicalReview(node),
    },
    competency_questions: contract.competency_questions ?? [],
    key_notion: contract.key_notion ?? null,
    owns_when: contract.owns_when ?? localizedFallback(null),
    references_when: contract.references_when ?? localizedFallback(null),
    boundary_decisions: contract.boundary_decisions ?? [],
    overlap_checks: contract.overlap_checks ?? [],
  };
};

const compileConcept = (node, moduleId) => {
  const common = commonInformation(node);
  const semantics = node.semantics ?? {};
  const structure = normalizeEmbeddedClaims(
    node.structure ?? { identity_keys: [], fields: [], constraints: [], required_relations: [] },
    common.resolveClaims,
  );
  const parentRelationId = node.parent_relation?.id ?? null;
  return {
    id: node.id,
    module_id: moduleId,
    ...withoutResolver(common),
    semantic_kind: semantics.semantic_kind ?? node.semantic_kind ?? "entity",
    primary_parent_relation_id: parentRelationId,
    structure,
    external_mappings: normalizeEmbeddedClaims(
      node.external_mappings ?? [],
      common.resolveClaims,
    ),
    applicability: node.applicability ?? {
      description: localizedFallback(null),
      lifecycle_position: localizedFallback(null),
      solves_problem: localizedFallback(null),
      typical_inputs: [],
      typical_outputs: [],
    },
    deprecated_in: null,
    replaced_by_ids: [],
    deprecation_reason: {},
    lexical_aliases: semantics.aliases ?? node.lexical_aliases ?? [],
    sibling_differentiation: node.sibling_differentiation ?? null,
    root_status: parentRelationId ? null : "module-key-root",
  };
};

const compileRelation = ({ relation, sourceNode, targetId, primary }) => {
  const { resolveClaims } = createClaimResolver(sourceNode);
  const predicate = relation.predicate;
  const normalized = normalizeEmbeddedClaims(relation, resolveClaims);
  const layoutRole = primary
    ? "primary-backbone"
    : normalized.layout_role ?? (predicate === "is_a" ? "secondary-backbone" : "cross-link");
  const parentToChild = primary && normalized.endpoint_order === "parent-to-child";
  const sourceId = parentToChild ? targetId : sourceNode.id;
  const semanticTargetId = parentToChild ? sourceNode.id : targetId;
  const { endpoint_order: _endpointOrder, target: _target, target_id: _targetId, ...details } = normalized;
  return {
    ...details,
    source_id: sourceId,
    target_id: semanticTargetId,
    direction: normalized.direction ?? "source-to-target",
    relation_kind: normalized.relation_kind ?? (predicate === "is_a" ? "hierarchy" : "semantic"),
    status: sourceStatus(sourceNode),
    review: canonicalReview(sourceNode),
    introduced_in: normalized.introduced_in ?? null,
    deprecated_in: null,
    replaced_by_ids: [],
    deprecation_reason: {},
    change_note: normalized.change_note ?? {},
    labels: localizedFallback(normalized.labels, predicate),
    definitions: localizedFallback(normalized.definition ?? normalized.definitions, predicate),
    cardinality: normalized.cardinality ?? null,
    cardinality_not_applicable_reason: normalized.cardinality_not_applicable_reason ?? null,
    inverse_reading: normalized.inverse_reading ?? null,
    conditions: normalized.conditions ?? [],
    temporal_scope: normalized.temporal_scope ?? "timeless",
    boundary_context: normalized.boundary_context ?? null,
    constraints: normalized.constraints ?? [],
    examples: normalized.examples ?? [],
    source_claims: normalized.source_claims ?? [],
    distinct_fact_rationale: normalized.distinct_fact_rationale ?? null,
    layout_role: layoutRole,
    layout_parent_id: primary ? targetId : normalized.layout_parent_id ?? null,
    layout_child_id: primary ? sourceNode.id : normalized.layout_child_id ?? null,
  };
};

const compileRelations = (tree) => {
  const relations = [];
  const relationIds = new Set();
  for (const node of tree.nodes.filter(({ kind }) => kind === "concept")) {
    const parentId = tree.parentById.get(node.id);
    if (node.parent_relation) {
      const parent = tree.nodesById.get(parentId);
      if (!parent || parent.kind !== "concept") {
        throw new OntologySourceError(
          "INVALID_PRIMARY_PARENT",
          `Concept ${node.id} declares parent_relation without a concept directory parent`,
        );
      }
      if (node.status === "accepted") {
        const expectedKind = PRIMARY_BACKBONE_RELATION_KINDS[node.parent_relation.predicate];
        if (!expectedKind || node.parent_relation.relation_kind !== expectedKind) {
          throw new OntologySourceError(
            "INVALID_PRIMARY_PARENT",
            `Accepted concept ${node.id} must use is_a/hierarchy or part_of/composition for its directory parent`,
          );
        }
      }
      relations.push(compileRelation({
        relation: node.parent_relation,
        sourceNode: node,
        targetId: parent.id,
        primary: true,
      }));
    } else if (tree.nodesById.get(parentId)?.kind === "concept") {
      throw new OntologySourceError(
        "INVALID_PRIMARY_PARENT",
        `Nested concept ${node.id} must describe its parent_relation`,
      );
    }
    for (const relation of node.relations ?? []) {
      const rawTarget = relation.target ?? relation.target_id;
      const targetId = typeof rawTarget === "string" && rawTarget.includes(":")
        ? rawTarget.slice(rawTarget.indexOf(":") + 1)
        : rawTarget;
      if (!tree.nodesById.has(targetId)) {
        throw new OntologySourceError(
          "UNKNOWN_RELATION_TARGET",
          `Relation ${relation.id} references unknown target ${String(rawTarget)}`,
        );
      }
      relations.push(compileRelation({
        relation,
        sourceNode: node,
        targetId,
        primary: false,
      }));
    }
  }
  for (const relation of relations) {
    if (!relation.id || relationIds.has(relation.id)) {
      throw new OntologySourceError(
        "DUPLICATE_RELATION_ID",
        `Relation id is missing or duplicated: ${String(relation.id)}`,
      );
    }
    relationIds.add(relation.id);
  }
  return relations.sort((left, right) => left.id.localeCompare(right.id));
};

const ontologyMetrics = ({ planes, modules, classes, relations }) => ({
  domains: planes.length,
  modules: modules.length,
  concepts: classes.length,
  taxonomy_roots: classes.filter(({ primary_parent_relation_id: id }) => !id).length,
  is_a_relations: relations.filter(({ predicate }) => predicate === "is_a").length,
  semantic_relations: relations.filter(({ predicate }) => predicate !== "is_a").length,
  instance_examples: classes.flatMap(({ examples }) => examples)
    .filter(({ kind }) => kind === "instance").length,
  controlled_values: classes.flatMap(({ structure }) => structure?.fields ?? [])
    .flatMap(({ allowed_values: values }) => values ?? []).length,
  structure_fields: classes.flatMap(({ structure }) => structure?.fields ?? []).length,
  constraints: classes.flatMap(({ structure }) => structure?.constraints ?? []).length,
  source_claims: [...planes, ...modules, ...classes, ...relations]
    .flatMap(({ source_claims: claims }) => claims ?? []).length,
  case_paths: 0,
});

const compileCanonical = (tree) => {
  const root = tree.root;
  const domains = tree.nodes.filter(({ kind }) => kind === "domain");
  const modules = tree.nodes.filter(({ kind }) => kind === "module");
  const concepts = tree.nodes.filter(({ kind }) => kind === "concept");
  const nearestAncestor = (nodeId, kind) => {
    let currentId = tree.parentById.get(nodeId);
    while (currentId) {
      const current = tree.nodesById.get(currentId);
      if (current?.kind === kind) return current.id;
      currentId = tree.parentById.get(currentId);
    }
    throw new OntologySourceError("INVALID_HIERARCHY", `${nodeId} has no ${kind} ancestor`);
  };
  const planes = domains.map(compilePlane);
  const compiledModules = modules.map((node) => compileModule(node, nearestAncestor(node.id, "domain")));
  const classes = concepts.map((node) => compileConcept(node, nearestAncestor(node.id, "module")));
  const relations = compileRelations(tree);
  const common = commonInformation(root);
  const release = root.release ?? { version: "0.0.0", date: "1970-01-01" };
  const releasable = isTreeReleasable(tree);
  const partial = {
    id: root.id,
    ...withoutResolver(common),
    status: sourceStatus(root),
    date: release.date,
    canonical_version: `https://moonweave.ai/ontology/agent-system/${release.version}/`,
    planes,
    modules: compiledModules,
    classes,
    relations,
    global_constraints: root.global_constraints ?? [],
    case_paths: root.case_paths ?? [],
    hygiene_gates: root.hygiene_gates ?? [],
  };
  return {
    ...partial,
    ontology_metrics: ontologyMetrics(partial),
    artifact_metadata: {
      artifact_kind: "canonical-agent-ontology",
      contract_version: "2.0.0",
      canonical_version: partial.canonical_version,
      generated: true,
      do_not_edit: true,
      generator_version: "moonweave-yaml-tree-compiler/1.0.0",
      generated_at: `${release.date}T00:00:00.000Z`,
      source_tree_sha256: tree.sourceTreeSha256,
      generated_from: tree.sourceFiles,
      release_channel: releasable ? "release" : "candidate",
      releasable,
    },
  };
};

const entityRef = (kind, id) => `${kind}:${id}`;

const compileCommunityGraph = (canonical, tree) => {
  const orderedModules = canonical.modules.slice()
    .sort(({ id: left }, { id: right }) => left.localeCompare(right));
  const nodeRecords = [
    { ref: entityRef("root", canonical.id), ownerModuleId: null },
    ...canonical.planes.map(({ id }) => ({ ref: entityRef("plane", id), ownerModuleId: null })),
    ...canonical.modules.map(({ id }) => ({ ref: entityRef("module", id), ownerModuleId: id })),
    ...canonical.classes.map(({ id, module_id: moduleId }) => ({
      ref: entityRef("concept", id),
      ownerModuleId: moduleId,
    })),
  ];
  const moduleCommunityId = new Map(
    orderedModules.map(({ id }, index) => [id, index + 1]),
  );
  const edges = [];
  for (const plane of canonical.planes) {
    edges.push({
      id: `derived:ontology-plane:${plane.id}`,
      source: entityRef("root", canonical.id),
      target: entityRef("plane", plane.id),
      relation: "contains_domain",
      evidence: "derived",
      relation_kind: "organization",
      layout_role: "ownership",
    });
  }
  for (const module of orderedModules) {
    edges.push({
      id: `derived:plane-module:${module.plane_id}:${module.id}`,
      source: entityRef("plane", module.plane_id),
      target: entityRef("module", module.id),
      relation: "contains_module",
      evidence: "derived",
      relation_kind: "organization",
      layout_role: "ownership",
    });
  }
  const primaryBackboneParent = new Map();
  for (const relation of canonical.relations) {
    if (relation.layout_role !== "primary-backbone") continue;
    const childId = relation.layout_child_id
      ?? (relation.predicate === "is_a" ? relation.source_id : relation.target_id);
    if (!primaryBackboneParent.has(childId)) {
      primaryBackboneParent.set(childId, relation);
    }
  }
  for (const concept of canonical.classes) {
    const parentId = tree.parentById.get(concept.id);
    if (tree.nodesById.get(parentId)?.kind !== "module") continue;
    const backbone = primaryBackboneParent.get(concept.id);
    const backboneParentId = backbone
      ? (backbone.layout_parent_id
        ?? (backbone.predicate === "is_a" ? backbone.target_id : backbone.source_id))
      : null;
    const backboneParentModule = backboneParentId
      ? canonical.classes.find(({ id }) => id === backboneParentId)?.module_id
      : null;
    if (backboneParentModule === concept.module_id) continue;
    edges.push({
      id: `derived:module-root:${concept.module_id}:${concept.id}`,
      source: entityRef("module", concept.module_id),
      target: entityRef("concept", concept.id),
      relation: "contains_root_concept",
      evidence: "derived",
      relation_kind: "organization",
      layout_role: "ownership",
    });
  }
  for (const relation of canonical.relations) {
    edges.push({
      id: relation.id,
      source: entityRef("concept", relation.source_id),
      target: entityRef("concept", relation.target_id),
      relation: relation.predicate,
      evidence: "canonical",
      relation_kind: relation.relation_kind,
      layout_role: relation.layout_role,
    });
  }
  edges.sort((left, right) => left.id.localeCompare(right.id));
  const degree = new Map(nodeRecords.map(({ ref }) => [ref, 0]));
  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  const nodes = nodeRecords.map(({ ref, ownerModuleId }) => ({
    ref,
    community_id: ownerModuleId ? moduleCommunityId.get(ownerModuleId) : 0,
    degree: degree.get(ref) ?? 0,
  })).sort((left, right) => left.ref.localeCompare(right.ref));
  const rootMembers = nodes.filter(({ community_id: id }) => id === 0).map(({ ref }) => ref);
  const communities = [{
    id: 0,
    hub_ref: entityRef("root", canonical.id),
    owner_module_id: null,
    label: canonical.labels.en,
    member_count: rootMembers.length,
    cohesion: 0,
    member_signature: hashJson(rootMembers),
    member_refs: rootMembers,
  }];
  for (const module of orderedModules) {
    const id = moduleCommunityId.get(module.id);
    const members = nodes.filter(({ community_id: communityId }) => communityId === id)
      .map(({ ref }) => ref);
    communities.push({
      id,
      hub_ref: entityRef("module", module.id),
      owner_module_id: module.id,
      label: module.labels.en,
      member_count: members.length,
      cohesion: 0,
      member_signature: hashJson(members),
      member_refs: members,
    });
  }
  const projection = { communities, nodes, edges };
  const algorithm = {
    engine: "canonical-module-anchors",
    assignment_policy: "canonical-module-owner",
    diagnostic_engine: "none",
    diagnostic_community_count: communities.length,
    seed: 42,
    resolution: 1,
    oversized_fraction: 0.25,
    minimum_split_size: 10,
    cohesion_threshold: 0.05,
    cohesion_split_minimum_size: 50,
  };
  const metrics = {
    node_count: nodes.length,
    edge_count: edges.length,
    community_count: communities.length,
    maximum_degree: Math.max(0, ...nodes.map(({ degree: value }) => value)),
  };
  return {
    schema_version: "2.0.0",
    source_sha256: hashJson(canonical),
    projection_sha256: hashJson({ algorithm, metrics, ...projection }),
    algorithm,
    metrics,
    ...projection,
  };
};

const collectAllSources = (nodes) => {
  const seen = new Map();
  for (const node of nodes) {
    for (const source of node.sources ?? []) {
      if (source && typeof source === "object" && source.id && !seen.has(source.id)) {
        seen.set(source.id, source);
      }
    }
  }
  return [...seen.values()].sort((left, right) => left.id.localeCompare(right.id));
};

const compileSourceIndex = (tree, sourceTreeSha256, sourceFiles) => {
  const sources = collectAllSources(tree.nodes);
  return {
    schema_version: "1.0.0",
    generated_from: sourceFiles.map((path) => `ontology/${path}`),
    source_tree_sha256: sourceTreeSha256,
    registry_fingerprint: hashJson(sources),
    sources,
  };
};

export const compileOntologyBundle = async ({ sourceDir, limits } = {}) => {
  const tree = await loadOntologyTree({ sourceDir, limits });
  const canonical = compileCanonical(tree);
  const sourceIndex = compileSourceIndex(tree, tree.sourceTreeSha256, tree.sourceFiles);
  const communityGraph = compileCommunityGraph(canonical, tree);
  return deepFreeze({
    canonical,
    communityGraph,
    sourceIndex,
    sourceTreeSha256: tree.sourceTreeSha256,
  });
};
