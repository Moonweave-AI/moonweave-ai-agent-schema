#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  loadOntologyArtifacts,
  normalizeNodeIds,
} from "./lib/ontology-loader.mjs";
import {
  KEY_PATHS,
  formatEdge,
  formatNode,
} from "./lib/graph-utils.mjs";
import { parseYaml } from "./lib/yaml.mjs";

const graphPath = join(ROOT, "visualization", "data", "ontology.graph.json");
const htmlPath = join(ROOT, "visualization", "index.html");
const sourceCatalogPath = join(ROOT, "references", "source-catalog.yaml");
const evidenceMatrixPath = join(ROOT, "references", "evidence-matrix.yaml");
const venueCoveragePath = join(ROOT, "references", "venue-coverage.yaml");

function bareNodeId(id) {
  return String(id || "").replace(/^node\./, "");
}

function subgraphIndex(subgraph) {
  const match = String(subgraph || "").match(/^(\d{2})-/);
  if (!match) throw new Error(`Cannot infer subgraph index from '${subgraph}'`);
  return Number(match[1]);
}

function extractEmbeddedGraph(html) {
  const match = html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Missing embedded graph data script.");
  return JSON.parse(match[1]);
}

function expandedEdges(edges, nodeIndex) {
  const out = [];
  for (const edge of edges) {
    const sg = subgraphIndex(edge.subgraph);
    for (const source of normalizeNodeIds(edge.source_domain)) {
      for (const target of normalizeNodeIds(edge.target_range)) {
        const sourceIndex = nodeIndex.get(source);
        const targetIndex = nodeIndex.get(target);
        if (sourceIndex === undefined || targetIndex === undefined) {
          throw new Error(`Edge ${edge.id} references missing endpoint ${source} -> ${target}`);
        }
        out.push([edge.predicate, sourceIndex, targetIndex, sg]);
      }
    }
  }
  return out;
}

function compactNodes(nodes) {
  return nodes.map((node) => [
    bareNodeId(node.id),
    node.label,
    node.label_zh,
    subgraphIndex(node.subgraph),
    node.description,
    node.intra_level,
    node.intra_group,
    node.intra_group_zh,
    node.intra_role,
    node.parent_node ? bareNodeId(node.parent_node) : null,
    node.intra_axis,
    node.intra_axis_zh,
    node.description_zh,
  ]);
}

function compactPaths(nodeIndex) {
  return KEY_PATHS.map((path) => ({
    id: path.id,
    label: path.label,
    nodes: path.nodes.map((id) => {
      const idx = nodeIndex.get(id);
      if (idx === undefined) throw new Error(`Path ${path.id} references missing node ${id}`);
      return idx;
    }),
  }));
}

function replaceEmbeddedGraph(html, raw) {
  const json = JSON.stringify(raw);
  return html.replace(
    /<script type="application\/json" id="data">[\s\S]*?<\/script>/,
    `<script type="application/json" id="data">${json}</script>`,
  );
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function objectSupportIndex(claims) {
  const index = {};
  const buckets = [
    "supports_nodes",
    "supports_edges",
    "supports_constraints",
    "supports_views",
    "candidate_nodes",
  ];

  for (const claim of claims) {
    for (const bucket of buckets) {
      for (const objectId of asArray(claim[bucket])) {
        if (!index[objectId]) index[objectId] = [];
        index[objectId].push(claim.id);
      }
    }
  }
  return index;
}

function objectLabel(objectId, nodeById, edgeById, viewById) {
  const node = nodeById.get(objectId);
  if (node) {
    return {
      id: objectId,
      kind: "node",
      label: node.label || objectId,
      label_zh: node.label_zh || node.label || objectId,
      subgraph: node.subgraph || "",
      role: node.intra_role || "node",
    };
  }
  const edge = edgeById.get(objectId);
  if (edge) {
    return {
      id: objectId,
      kind: "edge",
      label: edge.predicate || objectId,
      label_zh: edge.predicate_zh || edge.predicate || objectId,
      subgraph: edge.subgraph || "",
      role: "edge",
    };
  }
  const view = viewById.get(objectId);
  if (view) {
    return {
      id: objectId,
      kind: "view",
      label: view.label || objectId,
      label_zh: view.label_zh || view.label || objectId,
      subgraph: view.subgraph || "",
      role: "view",
    };
  }
  return {
    id: objectId,
    kind: objectId.startsWith("view.") ? "view" : objectId.startsWith("edge.") ? "edge" : "node",
    label: objectId,
    label_zh: objectId,
    subgraph: "",
    role: "candidate",
  };
}

function buildCoverageMatrix(requiredThemes, sources, claims) {
  return requiredThemes.map((theme) => {
    const themeSources = sources.filter((source) => source.themes.includes(theme));
    const themeClaims = claims.filter((claim) => claim.themes.includes(theme));
    return {
      theme,
      source_ids: themeSources.map((source) => source.id),
      claim_ids: themeClaims.map((claim) => claim.id),
      source_count: themeSources.length,
      claim_count: themeClaims.length,
      tiers: Object.fromEntries(["A", "B", "C"].map((tier) => [
        tier,
        themeSources.filter((source) => source.tier === tier).length,
      ])),
      statuses: Object.fromEntries(["approved", "candidate", "exemplar", "local"].map((status) => [
        status,
        themeSources.filter((source) => source.status === status).length,
      ])),
      years: Object.fromEntries([...new Set(themeSources.map((source) => source.year))].sort().map((year) => [
        year,
        themeSources.filter((source) => source.year === year).length,
      ])),
    };
  });
}

function claimObjectIds(claim) {
  return [
    ...asArray(claim.supports_nodes),
    ...asArray(claim.supports_edges),
    ...asArray(claim.supports_constraints),
    ...asArray(claim.supports_views),
    ...asArray(claim.candidate_nodes),
  ];
}

function buildEvidenceFlows(claims, gaps, nodeById, edgeById, viewById) {
  const activeGaps = gaps.filter((gap) => gap.status !== "resolved");
  return claims.map((claim) => {
    const objects = claimObjectIds(claim).map((objectId) => objectLabel(objectId, nodeById, edgeById, viewById));
    return {
      id: `flow.${claim.id.replace(/^claim\./, "")}`,
      source_id: claim.source_id,
      claim_id: claim.id,
      object_ids: objects.map((object) => object.id),
      objects,
      gap_ids: activeGaps
        .filter((gap) => String(gap.description || "").toLowerCase().includes("view") && objects.some((object) => object.kind === "view"))
        .map((gap) => gap.id),
      gate_ids: ["check-source-catalog", "check-evidence-coverage", "check-venue-coverage", "check-evidence-workbench-data"],
    };
  });
}

function buildViewModels(claims, sources, gaps, themeCoverage, graphViews) {
  const graphViewById = new Map(graphViews.map((view) => [view.id, view]));
  const routeSpecs = [
    {
      route: "evidence-atlas",
      label: "Evidence Atlas",
      kind: "flow-board",
      graph_view_id: "view.research_evidence_matrix",
      lanes: ["Sources", "Claims", "Ontology Objects", "Gaps / Gates"],
      theme_filters: themeCoverage.map((row) => row.theme),
      legend: ["Tier A approved", "Tier B approved", "Candidate / gap", "Release gate"],
    },
    {
      route: "system-blueprint",
      label: "System Blueprint",
      kind: "c4-blueprint",
      graph_view_id: "view.workbench_architecture",
      lanes: ["Cognitive Core", "Context & Memory", "Tools & Protocol", "Runtime & Safety", "Evaluation"],
      theme_filters: ["cognitive-loop", "memory", "tool-use", "runtime-state", "safety-security", "evaluation"],
      legend: ["Core capability", "Runtime boundary", "Governance boundary"],
    },
    {
      route: "protocol-flow",
      label: "Protocol Flow",
      kind: "swimlane",
      graph_view_id: "view.protocol_flow",
      lanes: ["Client", "MCP Server", "Agent Runtime", "A2A Peer", "Artifacts"],
      theme_filters: ["protocol-interop", "tool-use", "permissions", "runtime-state"],
      legend: ["Capability discovery", "Tool/resource exposure", "Task handoff"],
    },
    {
      route: "runtime-trace",
      label: "Runtime Trace",
      kind: "timeline",
      graph_view_id: "view.runtime_trace_flow",
      lanes: ["Session", "Run", "Turn", "Event", "Checkpoint", "Approval", "Recovery"],
      theme_filters: ["runtime-state", "observability", "evaluation"],
      legend: ["State", "Trace", "Human review", "Recovery"],
    },
    {
      route: "safety-surface",
      label: "Safety Surface",
      kind: "risk-surface",
      graph_view_id: "view.safety_surface",
      lanes: ["Trust Boundary", "Untrusted Data", "Taint", "Privilege", "Allow / Deny", "Audit"],
      theme_filters: ["safety-security", "permissions", "tool-use"],
      legend: ["Boundary", "Attack path", "Control", "Evidence"],
    },
    {
      route: "evaluation-coverage",
      label: "Evaluation Coverage",
      kind: "coverage-matrix",
      graph_view_id: "view.evaluation_coverage",
      lanes: ["Benchmark", "Scenario", "Metric", "Trace Replay", "Release Gate"],
      theme_filters: ["evaluation", "observability", "runtime-state"],
      legend: ["Benchmark", "Metric", "Gate", "Gap"],
    },
    {
      route: "ontology-graph-explorer",
      label: "Ontology Graph Explorer",
      kind: "d3-graph-drilldown",
      graph_view_id: "",
      lanes: ["Full Ontology Canvas"],
      theme_filters: themeCoverage.map((row) => row.theme),
      legend: ["Secondary explorer", "Pan/zoom", "Node detail", "Evidence backreference"],
    },
  ];

  return routeSpecs.map((spec) => {
    const graphView = graphViewById.get(spec.graph_view_id);
    const filteredClaims = claims.filter((claim) =>
      !spec.theme_filters.length || claim.themes.some((theme) => spec.theme_filters.includes(theme))
    );
    const filteredSources = sources.filter((source) =>
      !spec.theme_filters.length || source.themes.some((theme) => spec.theme_filters.includes(theme))
    );
    return {
      ...spec,
      source_ids: filteredSources.map((source) => source.id),
      claim_ids: filteredClaims.map((claim) => claim.id),
      gap_ids: gaps.filter((gap) => gap.status !== "resolved").map((gap) => gap.id),
      acceptance_queries: asArray(graphView?.acceptance_queries),
      notation: asArray(graphView?.diagram_notation),
      layout_engine: graphView?.layout_engine || spec.kind,
    };
  });
}

function buildHomeSummary(sources, claims, gaps, coverageMatrix, venueCoverage, objectSupport) {
  const venueCount = asArray(venueCoverage.coverage_policy?.required_venues).length;
  const yearCount = asArray(venueCoverage.coverage_policy?.years).length;
  return {
    route: "evidence-atlas",
    source_count: sources.length,
    claim_count: claims.length,
    normative_claim_count: claims.filter((claim) => claim.status === "normative").length,
    approved_source_count: sources.filter((source) => source.status === "approved").length,
    candidate_gap_count: gaps.filter((gap) => gap.status !== "resolved").length,
    venue_checkpoints: venueCount * yearCount,
    theme_count: coverageMatrix.length,
    supported_object_count: Object.keys(objectSupport).length,
    gate_status: "passed",
  };
}

function buildEvidenceWorkbench(nodes, edges, views) {
  const catalog = parseYaml(readFileSync(sourceCatalogPath, "utf8"));
  const matrix = parseYaml(readFileSync(evidenceMatrixPath, "utf8"));
  const venueCoverage = parseYaml(readFileSync(venueCoveragePath, "utf8"));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const viewById = new Map(views.map((view) => [view.id, view]));
  const sources = asArray(catalog.sources).map((source) => ({
    id: source.id,
    title: source.title,
    type: source.source_type,
    tier: source.authority_tier,
    status: source.normative_status,
    venue: source.venue,
    year: source.year,
    themes: asArray(source.themes),
    url: source.url || "",
    summary: source.reading?.summary || "",
    impact: source.reading?.ontology_impact || "",
  }));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const claims = asArray(matrix.claims).map((claim) => {
    const source = sourceById.get(claim.source_id);
    return {
      id: claim.id,
      source_id: claim.source_id,
      source_title: source?.title || claim.source_id,
      source_tier: source?.tier || "",
      source_status: source?.status || "",
      status: claim.status,
      themes: asArray(claim.themes),
      claim: claim.claim,
      ontology_impact: claim.ontology_impact,
      supports_nodes: asArray(claim.supports_nodes),
      supports_edges: asArray(claim.supports_edges),
      supports_constraints: asArray(claim.supports_constraints),
      supports_views: asArray(claim.supports_views),
      candidate_nodes: asArray(claim.candidate_nodes),
    };
  });
  const requiredThemes = asArray(catalog.coverage_policy?.required_themes);
  const themeCoverage = requiredThemes.map((theme) => ({
    theme,
    sources: sources.filter((source) => source.themes.includes(theme)).length,
    claims: claims.filter((claim) => claim.themes.includes(theme)).length,
  }));
  const gaps = asArray(matrix.gaps);
  const objectSupport = objectSupportIndex(claims);
  const coverageMatrix = buildCoverageMatrix(requiredThemes, sources, claims);
  const evidenceFlows = buildEvidenceFlows(claims, gaps, nodeById, edgeById, viewById);
  const viewModels = buildViewModels(claims, sources, gaps, themeCoverage, views);

  return {
    schema_version: "2.0",
    generated_at: new Date().toISOString(),
    sources,
    claims,
    gaps,
    themeCoverage,
    coverageMatrix,
    evidenceFlows,
    objectSupport,
    objectSupportIndex: objectSupport,
    viewModels,
    homeSummary: buildHomeSummary(sources, claims, gaps, coverageMatrix, venueCoverage, objectSupport),
  };
}

function replaceEmbeddedEvidence(html, workbench) {
  const script = `<script type="application/json" id="evidence-data">${JSON.stringify(workbench)}</script>`;
  if (/<script type="application\/json" id="evidence-data">[\s\S]*?<\/script>/.test(html)) {
    return html.replace(
      /<script type="application\/json" id="evidence-data">[\s\S]*?<\/script>/,
      script,
    );
  }
  return html.replace(
    /(<script type="application\/json" id="data">[\s\S]*?<\/script>)/,
    `$1\n${script}`,
  );
}

function main() {
  const { nodes, edges, views } = loadOntologyArtifacts();
  const nodeIndex = new Map(nodes.map((node, idx) => [node.id, idx]));
  const previousGraph = JSON.parse(readFileSync(graphPath, "utf8"));
  const html = readFileSync(htmlPath, "utf8");
  const previousRaw = extractEmbeddedGraph(html);

  const graph = {
    ...previousGraph,
    nodes: nodes.map(formatNode),
    edges: edges.map(formatEdge),
  };

  const raw = {
    ...previousRaw,
    nodes: compactNodes(nodes),
    edges: expandedEdges(edges, nodeIndex),
    paths: compactPaths(nodeIndex),
  };
  const workbench = buildEvidenceWorkbench(nodes, edges, views);

  writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
  writeFileSync(htmlPath, replaceEmbeddedEvidence(replaceEmbeddedGraph(html, raw), workbench), "utf8");

  console.log("Visualization data rebuilt.");
  console.log(`Nodes: ${nodes.length}`);
  console.log(`Edge classes: ${edges.length}`);
  console.log(`Expanded edges: ${raw.edges.length}`);
  console.log(`Evidence sources: ${workbench.sources.length}`);
  console.log(`Evidence claims: ${workbench.claims.length}`);
}

main();
