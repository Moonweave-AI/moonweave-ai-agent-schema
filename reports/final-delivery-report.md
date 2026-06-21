# agent-schema v2 Final Delivery Report

## Scope

This release moves `agent-schema` from a prototype ontology visualization toward a release-ready v2 evidence workbench. The release target is a static, direct-open repository artifact with auditable research data, claim-level ontology evidence, gate-enforced coverage, and durable handoff records.

## Delivered Artifacts

- Research data: `references/source-catalog.yaml`, `references/evidence-matrix.yaml`, `references/venue-coverage.yaml`.
- Ontology data model: `SourceClaim`, `BenchmarkRef`, expanded `EvidenceRef`, and expanded `GraphView`.
- GraphView layer: research evidence, protocol flow, runtime trace, safety surface, evaluation coverage, UI flow, and workbench architecture.
- Workbench UI: default Evidence Atlas with Source, Claim, Ontology Object, and Gap / Gate columns; old D3 graph moved to secondary Ontology Graph Explorer.
- View routes: System Blueprint, Protocol Flow, Runtime Trace, Safety Surface, Evaluation Coverage, and Ontology Graph Explorer.
- Validation gates: old six gates plus source, evidence, theme, venue, evidence workbench data, workbench view model, homepage redesign, view routing, diagram, encoding, preview, and browser visual regression gates.
- Reports: source matrix, UI spec, upgrade plan, worklog, handoff, decision log, progress board, risk register.
- Preview assets: desktop overview, evidence matrix, protocol flow, safety surface, evaluation coverage, mobile node detail, browser desktop/mobile overview, redesigned desktop/mobile Evidence Atlas, and graph explorer.

## Data Contract Status

- `SourceCatalog`: implemented in `references/source-catalog.yaml`.
- `EvidenceMatrix`: implemented in `references/evidence-matrix.yaml`.
- `VenueCoverage`: implemented in `references/venue-coverage.yaml`.
- `SourceClaim`: implemented in schema, meta graph, and evidence matrix claim records.
- `BenchmarkRef`: implemented in schema and meta graph; benchmark claims can map to it as candidate/evaluation evidence.
- `GraphView`: implemented as YAML artifacts under `ontology/12-engineering-validation-graph/views/`.
- `VisualizationData`: implemented through embedded `data` and `evidence-data` JSON payloads in `visualization/index.html`, including `coverageMatrix`, `evidenceFlows`, `objectSupportIndex`, `viewModels`, and `homeSummary`.

## Presentation Contract

- Default homepage: `Evidence Atlas`.
- Default audit path: `Source -> Claim -> Ontology Object -> Gap / Release Gate`.
- Secondary graph route: `Ontology Graph Explorer`.
- Regression rule: the full ontology graph must not be the first visual after opening `visualization/index.html`.

## Acceptance

The release is acceptable only when the full gate set in README passes and local `HEAD` is pushed to the configured remote branch.

## Residual Risks

- Browser-captured screenshots are generated with the local Chromium-family browser available to preview and visual regression gates; Playwright is not required.
- Venue coverage must be maintained as 2026 proceedings and security papers change.
