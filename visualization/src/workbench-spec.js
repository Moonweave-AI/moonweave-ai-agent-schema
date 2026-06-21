export const defaultRoute = "evidence-atlas";

export const workbenchRoutes = [
  "evidence-atlas",
  "system-blueprint",
  "protocol-flow",
  "runtime-trace",
  "safety-surface",
  "evaluation-coverage",
  "ontology-graph-explorer",
];

export const workbenchModules = {
  "data-adapter": "Builds WorkbenchViewModel from embedded ontology and evidence JSON.",
  state: "Owns route, filters, selection, hover, language, and theme.",
  "layout-shell": "Owns top command bar, coverage navigator, workspace, inspector, and status bar.",
  "views/evidence-atlas": "Default source -> claim -> ontology object -> gap flow board.",
  "views/system-blueprint": "C4-style architecture blueprint.",
  "views/protocol-flow": "Protocol swimlane for MCP, A2A, tools, handoff, auth, state, and artifacts.",
  "views/runtime-trace": "Runtime execution timeline.",
  "views/safety-surface": "Security and permission surface.",
  "views/evaluation-coverage": "Benchmark, scenario, metric, and release-gate matrix.",
  "views/ontology-graph-explorer": "Secondary full D3 graph drill-down.",
};

export const defaultInteractionContract = [
  "Opening visualization/index.html shows evidence-atlas, not the full graph canvas.",
  "Clicking a source filters claims and preserves source audit context.",
  "Clicking a claim shows supported ontology objects and highlights them for graph drill-down.",
  "Clicking an ontology object shows approved evidence and release impact in the inspector.",
  "Clicking ontology-graph-explorer opens the preserved D3 canvas as a secondary view.",
];
