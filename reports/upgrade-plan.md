# agent-schema v2 Upgrade Plan

## Execution Order

1. Research: source catalog, evidence matrix, venue coverage matrix, source matrix report, and coverage gates.
2. UI design: workbench IA, interactions, visual rules, responsive behavior, state machine, and preview assets.
3. Implementation: schema, ontology views, validators, generated visualization data, evidence workbench, docs, screenshots, release notes, and push.

## Data Model Upgrades

- Add `SourceClaim` and `BenchmarkRef` to the public schema.
- Extend `EvidenceRef` with source authority, verification, venue, year, DOI/arXiv/repo/url, claim scope, and confidence.
- Extend `GraphView` with audience, notation, layout engine, source filters, export targets, and acceptance queries.
- Add `VenueCoverage` as an auditable references-level contract checked by `tools/check-venue-coverage.mjs`.
- Add `VisualizationData.evidenceWorkbench` through the embedded `<script id="evidence-data">` payload.
- Keep current ontology YAML compatible while using new gates to enforce evidence quality over time.

## Workbench Upgrade

The visualization is a static direct-open evidence workbench:

- Left rail: views, source tier/status filters, gap toggle, source list, and KPI counts.
- Center: existing D3 ontology graph with retained hierarchy and relation detail behavior.
- Right audit rail: source claims, linked ontology nodes/edges/views, gaps, risks, and export targets.
- Bottom: coverage summary, timeline, and gate status.
- Node details: evidence claims are shown for supported ontology nodes.
- Claim click: supported ontology nodes are highlighted through the existing graph path/focus mechanism.

## Validation

The old six gates remain mandatory. New gates cover source catalog completeness, evidence coverage, theme coverage, venue coverage, evidence workbench data consistency, diagram exports, encoding, and preview assets.

## Final Acceptance

- `references/source-catalog.yaml`, `references/evidence-matrix.yaml`, and `references/venue-coverage.yaml` are the durable research source of truth.
- Candidate or unresolved sources cannot support normative claims.
- `visualization/index.html` opens directly from disk and includes both graph data and evidence workbench data.
- Preview assets cover desktop overview, evidence matrix, protocol flow, safety surface, evaluation coverage, and mobile node detail.
- Final release requires all 14 gates in README to pass before push.
