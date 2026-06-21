# agent-schema Upgrade Context Handoff

## Current Phase

Final v2 release validation and push.

## Completed

- Baseline bootstrap commit created: `36d9dc7 Bootstrap agent-schema v2 evidence workbench`.
- Durable anti-forgetting records are present and updated.
- `references/source-catalog.yaml` contains the approved/candidate source catalog.
- `references/evidence-matrix.yaml` contains claim-level ontology mappings and resolved venue gap status.
- `references/venue-coverage.yaml` covers the required 16 venues across 2022-2026 and is checked as 80 expanded checkpoints.
- `graph.schema.json` includes v2 primitives for `SourceClaim`, `BenchmarkRef`, `EvidenceRef`, and `GraphView`.
- Meta graph includes `source_claim` and `benchmark_ref` nodes.
- Engineering validation views include research evidence, protocol flow, runtime trace, safety surface, evaluation coverage, UI flow, and workbench architecture.
- `tools/build-visualization-data.mjs` embeds both ontology graph data and evidence workbench data into `visualization/index.html`.
- `visualization/index.html` is a direct-open evidence workbench with source filters, claim lists, gap audit, claim-to-node highlighting, and node evidence backreferences.
- Preview assets include desktop overview, evidence matrix, protocol flow, safety surface, evaluation coverage, mobile node detail, browser desktop capture, and browser mobile capture.
- README, README-zh, source matrix, UI spec, and upgrade plan include the final gate set and v2 contracts.

## Validation Summary

The full final gate set passed on 2026-06-21:

```powershell
node .\tools\validate-graph.mjs
node .\tools\validate-constraints.mjs
node .\tools\check-orphan-nodes.mjs
node .\tools\check-required-edges.mjs
node .\tools\check-visualization-framework.mjs
node .\tools\check-visualization-detail-contract.mjs
node .\tools\check-source-catalog.mjs
node .\tools\check-evidence-coverage.mjs
node .\tools\check-theme-coverage.mjs
node .\tools\check-venue-coverage.mjs
node .\tools\check-evidence-workbench-data.mjs
node .\tools\check-diagram-exports.mjs
node .\tools\check-i18n-encoding.mjs
node .\tools\check-preview-screenshots.mjs
```

Output summary:

- Graph: 279 nodes, 144 edge classes.
- Constraints: 38 passed, 0 errors, 0 warnings.
- Orphans: 0.
- Required-edge failures: 0.
- Visualization: 466 expanded edges; detail contract matches source graph.
- Source catalog: 34 sources.
- Evidence matrix: 35 claims.
- Theme coverage: all 13 required themes covered.
- Venue coverage: 16 venues x 5 years = 80 checkpoints.
- Evidence workbench data: 175 supported ontology objects.
- Preview assets: 8 PNG targets, including browser desktop and browser mobile captures from Edge headless.

## Residual Risks

- Browser-captured screenshots are implemented through local Chromium-family headless mode; Playwright remains optional and is not required for this static release.
- Venue coverage is auditable and gate-enforced, but future 2026 proceedings should be reviewed when final proceedings pages change.

## Next Command

```powershell
node .\tools\validate-graph.mjs
```
