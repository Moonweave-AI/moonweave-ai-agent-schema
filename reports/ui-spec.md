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
- `reports/previews/mobile-node-detail.png`

