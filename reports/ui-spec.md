# agent-schema Workbench UI Specification

## Product Shape

The first screen is an operational ontology workbench, not a landing page. The user should immediately see evidence coverage, ontology structure, and audit details.

## Layout

- Top command bar: global search, language, theme, fit, source tier filter, year filter, export menu.
- Left rail: view switcher with Evidence Matrix, Ontology Map, Protocol Flow, Runtime View, Safety Surface, Evaluation Coverage.
- Center canvas: D3 graph remains the primary inspectable object.
- Right audit panel: selected source, claim, node, edge, relation, gap, and validation status.
- Bottom strip: theme coverage count, normative source count, candidate gap count, preview/export status.

## View Behavior

- Evidence Matrix: rows are sources, columns are themes, cells show mapped claims and ontology impacts.
- Ontology Map: existing SG hierarchy remains, with source-tier and gap overlays.
- Protocol Flow: MCP/A2A/tool calling/handoff/state flow shown as a directed process.
- Runtime View: session, run, turn, event, trace, checkpoint, approval, and recovery surfaces.
- Safety Surface: trust boundary, prompt injection, taint, secret, least privilege, allow/deny decisions.
- Evaluation Coverage: benchmark, scenario, metric, release gate, trace replay, and residual gaps.

## Interaction Rules

- Search matches source ids, claims, node ids, labels, predicates, and themes.
- Clicking a source highlights all supported nodes, edges, constraints, and views.
- Clicking a node shows source claims, authority tier, unresolved gaps, and related benchmarks.
- Filters can combine theme, source tier, year, and normative status.
- Export menu must expose Mermaid, DOT, SVG, PNG, and JSON targets where available.
- Mobile layout collapses the left rail to tabs and the audit panel to a bottom drawer.

## Visual Rules

- Workbench density is high but ordered; avoid marketing hero sections.
- Cards use at most 8px radius.
- Buttons prefer icons or compact icon+text with tooltips.
- Palette uses neutral surfaces plus semantic colors for source tier, risk, and coverage.
- Text cannot overlap or overflow controls on desktop or mobile.

## Empty and Error States

- Empty filter: show "No sources match this filter" with reset action.
- Missing evidence: show gap id, severity, and required action.
- Broken export: show failing gate and exact file target.
- Candidate source: show yellow status and block normative claim display.

## Preview Targets

- `reports/previews/desktop-overview.png`
- `reports/previews/desktop-evidence-matrix.png`
- `reports/previews/desktop-protocol-flow.png`
- `reports/previews/desktop-safety-surface.png`
- `reports/previews/desktop-evaluation-coverage.png`
- `reports/previews/mobile-node-detail.png`
- `reports/previews/browser-desktop-overview.png`
- `reports/previews/browser-mobile-overview.png`

## Data Sources

- Ontology graph: embedded from `visualization/data/ontology.graph.json` into `<script id="data">`.
- Evidence workbench: embedded from `references/source-catalog.yaml` and `references/evidence-matrix.yaml` into `<script id="evidence-data">`.
- Venue coverage: validated by `references/venue-coverage.yaml`; summarized in reports, not rendered as a separate canvas layer in this batch.
- Object support index: generated from claim `supports_nodes`, `supports_edges`, `supports_constraints`, `supports_views`, and `candidate_nodes`.

## Component Contract

- `research-workbench`: left operational rail; owns view switching, source tier filter, source status filter, gap toggle, source list, and KPI counts.
- `evidence-audit`: right audit panel; owns selected source summary, claim list, gap list, and active claim context.
- `coverage-strip`: bottom summary; owns research gate state and theme/source/claim coverage status.
- `detail`: existing ontology detail panel; extended with evidence claims for selected nodes.
- `canvas`: existing D3 graph; remains pan/zoom capable and receives claim-supported node highlights through `pathNodes`.

## View Acceptance

- Evidence Matrix: source list and claim list must be populated from `evidence-data`; clicking a claim highlights supported ontology nodes.
- Ontology Map: existing graph layout remains visible; node detail shows evidence claims when available.
- Protocol Flow: view button is present, protocol claims are discoverable through source/claim search, and protocol nodes remain highlighted from MCP/A2A claims.
- Runtime View: runtime claims from official framework docs map to session, trace, checkpoint, approval, state, and API nodes.
- Safety Surface: safety claims from AgentDojo, Progent, Fides, and HITL docs map to trust, taint, least privilege, allow/deny, and injection-defense nodes.
- Evaluation Coverage: benchmark/evaluation claims map to release gate, coverage checker, benchmark candidate, trace replay, and runtime contract nodes.

## State Machine

- Default state: no filters, Evidence Matrix selected, all sources and claims visible.
- Filtered state: tier/status filters reduce source and claim lists without mutating graph data.
- Source selected: audit panel shows source summary and claim list for that source.
- Claim selected: supported nodes are assigned to `pathNodes`, first supported node opens in detail, and the graph zooms to the supported set.
- Gap overlay state: gap toggle shows resolved and informational gaps in addition to open gaps.
- Empty state: source and claim lists show explicit empty messages and keep reset controls visible.

## Export Behavior

- Mermaid and DOT source diagrams are validated under `reports/diagrams/`.
- SVG/PNG export entry points remain a UI requirement; current release verifies generated PNG previews and single-file direct-open graph behavior.
- JSON export uses the embedded ontology graph and evidence workbench data as the stable browser-side source.

## Responsive Behavior

- Desktop keeps left workbench, center canvas, right audit, and bottom coverage visible together.
- Mobile collapses the workbench into a top rail and keeps the audit panel as a bottom drawer with bounded height.
- Text-heavy lists use fixed panel widths, small type, wrapping, and no horizontal overflow.

## Final Gate Mapping

- `check-evidence-workbench-data.mjs` blocks stale or missing browser evidence data.
- `check-preview-screenshots.mjs` blocks missing overview, matrix, protocol, safety, evaluation, mobile, browser-desktop, or browser-mobile preview PNGs.
- `check-venue-coverage.mjs` blocks missing venue/year research review checkpoints.
