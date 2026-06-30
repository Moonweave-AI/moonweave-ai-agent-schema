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

- Default route: `Evidence Atlas`, an audit board for `Source -> Claim -> Ontology Object -> Gap / Release Gate`.
- Left navigator: coverage summary, route navigation, theme coverage, source tier/status filters, and gap state.
- Center workspace: route-specific evidence views; the homepage is the four-column Evidence Flow Board.
- Right audit inspector: selected source, claim, ontology object, gap, risks, and release impact.
- Bottom status: research gate, theme count, venue checkpoints, and supported object count.
- Secondary explorer: the existing D3 ontology graph is preserved only under `Ontology Graph Explorer`.
- Browser data model: `coverageMatrix`, `evidenceFlows`, `objectSupportIndex`, `viewModels`, and `homeSummary` are embedded into `evidence-data`.

## Validation

The old six gates remain mandatory. New gates cover source catalog completeness, evidence coverage, theme coverage, venue coverage, evidence workbench data consistency, homepage redesign, workbench view model integrity, route switching, diagram exports, encoding, preview assets, and browser visual regression.

## Final Acceptance

- `references/source-catalog.yaml`, `references/evidence-matrix.yaml`, and `references/venue-coverage.yaml` are the durable research source of truth.
- Candidate or unresolved sources cannot support normative claims.
- `visualization/index.html` opens directly from disk and defaults to `Evidence Atlas`.
- The old full ontology graph appears only after switching to `Ontology Graph Explorer`.
- Preview assets cover desktop overview, evidence matrix, protocol flow, safety surface, evaluation coverage, mobile node detail, redesigned desktop/mobile Evidence Atlas, and graph explorer.
- Final release requires the full gate set in README to pass before push.
