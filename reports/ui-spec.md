# agent-schema Workbench UI Specification

## Product Shape

The first screen is the **Evidence-to-Ontology Audit Workbench**, not the old full ontology canvas and not a landing page.

Default audit path:

```text
Source -> Claim -> Ontology Object -> Gap / Release Gate
```

The old D3 full graph is preserved as the secondary `Ontology Graph Explorer` route for drill-down after evidence selection. It is not the default homepage visual.

## Information Architecture

- Top command bar: global search, language switch, route selector, fit action, export entry points, and current gate state.
- Left navigator: coverage summary, route navigation, theme coverage, venue/year coverage, source tier, and gap state.
- Center workspace: route-specific operational view. The default route is `Evidence Atlas`.
- Right audit inspector: selected source, claim, ontology object, gap, source tier, supporting evidence, candidate evidence, and release impact.
- Bottom status strip: research gate, theme count, venue checkpoints, supported object count, and preview status.

## Routes

- `Evidence Atlas`: default homepage. Four fixed columns show Sources, Claims, Ontology Objects, and Gaps / Gates.
- `System Blueprint`: C4-style layered blueprint for Agent Core, Context, Memory, Reasoning, Tool, Runtime, Safety, Protocol, and Evaluation.
- `Protocol Flow`: swimlane/process view for MCP, A2A, tool calling, handoff, state flow, capability manifests, auth, streaming, and artifacts.
- `Runtime Trace`: timeline view for session, run, turn, event, trace, checkpoint, approval, recovery, and replay.
- `Safety Surface`: risk surface for trust boundary, taint, secret, least privilege, prompt injection, allow/deny, and audit.
- `Evaluation Coverage`: matrix view for benchmark, scenario, metric, trace replay, release gate, and residual gap.
- `Ontology Graph Explorer`: secondary D3 drill-down view. It inherits current selection/filter state but never replaces the default Evidence Atlas homepage.

## Evidence Atlas Layout

- Column 1, Sources: approved/exemplar/candidate sources with tier, status, year, summary, and theme tags.
- Column 2, Claims: claim-level assertions mapped from selected sources, including normative status and ontology impact.
- Column 3, Ontology Objects: supported nodes, edges, constraints, and views with object kind and bilingual label where available.
- Column 4, Gaps / Gates: open gaps, resolved gaps when enabled, and release-blocking gates.
- Right inspector: shows the selected path, approved evidence, candidate evidence, benchmark/view links, and release impact.

## Interaction Contract

- Opening `visualization/index.html` must show `Evidence Atlas` and the four evidence flow columns.
- The default homepage must not show the old full ontology graph.
- Selecting a source filters/highlights related claims, ontology objects, and gaps.
- Selecting a claim shows supported ontology objects and updates the inspector with source tier, claim text, ontology impact, and normative status.
- Selecting an ontology object shows approved evidence, candidate evidence, related gaps, benchmarks, and views.
- Selecting a gap shows required action, affected objects, blocking status, and related gate.
- Switching to `Ontology Graph Explorer` reveals the old D3 canvas with pan/zoom and inherited selection/focus.
- Search matches source ids, titles, claims, node ids, labels, predicates, views, and themes.
- Filters can combine theme, source tier, source status, year, and gap visibility.
- Export entry points include Mermaid, DOT, JSON, SVG, and PNG where available.

## Visual Rules

- Operational workbench styling: dense, scannable, and audit-focused.
- No marketing hero, no decorative dotted canvas on the default route, and no giant unreadable graph thumbnails as the first visual.
- Only local graph/process regions may use a subtle grid.
- Cards use at most 8px radius.
- Buttons prefer icons or compact icon+text with tooltips.
- Palette uses neutral surfaces plus semantic accents:
  - Research/evidence: cyan
  - Runtime: green
  - Protocol: violet
  - Safety: rose/red
  - Evaluation: amber/lime
  - Candidate/gap: yellow/red
- Text must wrap inside controls and cards on desktop and 390px mobile viewports.

## Data Sources

- Ontology graph: embedded from `visualization/data/ontology.graph.json` into `<script id="data">`.
- Workbench data: embedded from `references/source-catalog.yaml`, `references/evidence-matrix.yaml`, and `references/venue-coverage.yaml` into `<script id="evidence-data">`.
- `coverageMatrix`: theme x source/status/year/tier coverage rows.
- `evidenceFlows`: source -> claim -> supported object -> gap/gate edges.
- `objectSupportIndex`: node/edge/view/constraint -> claim/source backreference index.
- `viewModels`: route-level lanes, legends, filters, notation, layout engine, and acceptance queries.
- `homeSummary`: source count, claim count, normative coverage, candidate gaps, venue checkpoints, supported object count, and gate status.

## Component Contract

- `audit-shell`: owns route state and the default `data-route="evidence-atlas"` contract.
- `coverage-navigator`: owns summary KPIs, route navigation, theme coverage, and coverage filters.
- `audit-workspace`: owns route panes and renders the active view.
- `evidence-flow-board`: owns the four Evidence Atlas columns.
- `audit-inspector`: owns selected source/claim/object/gap audit details and release impact.
- `audit-status-bar`: owns bottom gate/coverage state.
- `canvas`: preserved D3 graph, mounted only inside `Ontology Graph Explorer`.
- Legacy `research-workbench`, `evidence-audit`, and `coverage-strip`: hidden compatibility surfaces, not homepage structure.

## State Machine

- Default state: route `evidence-atlas`, no filters, source/claim/object/gap indexes loaded.
- Filtered state: query/tier/status/year/theme filters reduce source and claim lists without mutating embedded data.
- Source selected: claims and supported objects narrow to that source; inspector shows source summary.
- Claim selected: object column shows supported ontology objects; inspector shows claim evidence and ontology impact.
- Object selected: inspector shows approved/candidate evidence and related release implications.
- Gap selected: inspector shows severity, blocking status, required action, and related gate.
- Explorer state: route `ontology-graph-explorer`; D3 graph becomes visible and uses current path/focus.
- Empty state: route panes show explicit empty messages and keep reset/search controls visible.

## Route Acceptance

- Evidence Atlas: four columns are visible, populated from `evidenceFlows`, and selectable.
- System Blueprint: C4-style lanes and evidence-backed system components are visible.
- Protocol Flow: MCP/A2A/tool/handoff/state lanes are visible and route selection works.
- Runtime Trace: session/run/turn/event/checkpoint/approval/recovery lanes are visible.
- Safety Surface: trust boundary, taint, privilege, allow/deny, and audit lanes are visible.
- Evaluation Coverage: benchmark, scenario, metric, trace replay, and gate lanes are visible.
- Ontology Graph Explorer: old D3 graph is visible only here and remains pan/zoom capable.

## Responsive Behavior

- Desktop: navigator, workspace, inspector, and bottom status are visible together.
- Mobile: topbar becomes a vertical command stack; navigator, workspace, inspector, and status become a single-column audit flow.
- Mobile inspector behaves as a bounded section/drawer below the active workspace.
- Lists use fixed max heights with vertical scrolling; no horizontal overflow is allowed at 390px width.

## Preview Targets

- `reports/previews/desktop-overview.png`
- `reports/previews/desktop-evidence-matrix.png`
- `reports/previews/desktop-protocol-flow.png`
- `reports/previews/desktop-safety-surface.png`
- `reports/previews/desktop-evaluation-coverage.png`
- `reports/previews/mobile-node-detail.png`
- `reports/previews/browser-desktop-overview.png`
- `reports/previews/browser-mobile-overview.png`
- `reports/previews/browser-redesign-desktop.png`
- `reports/previews/browser-redesign-mobile.png`
- `reports/previews/browser-graph-explorer.png`

## Gate Mapping

- `check-homepage-redesign.mjs` blocks regressions where the default route is not Evidence Atlas or the homepage shows the old graph.
- `check-workbench-view-model.mjs` blocks missing coverage matrix, evidence flows, object support indexes, route view models, legends, or acceptance queries.
- `check-view-routing.mjs` blocks missing route buttons/panes and route state regressions.
- `check-browser-visual-regression.mjs` blocks missing desktop/mobile Evidence Atlas and graph explorer screenshots.
- `check-evidence-workbench-data.mjs` blocks stale or missing embedded source/claim/object data.
- `check-preview-screenshots.mjs` blocks missing PNG preview assets and critical workbench snippets.
