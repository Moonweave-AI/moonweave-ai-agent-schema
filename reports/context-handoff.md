# agent-schema Upgrade Context Handoff

## Current Phase

Homepage presentation redesign complete, committed, pushed, and verified on `origin/main`.

## Completed

- Baseline bootstrap commit created: `36d9dc7 Bootstrap agent-schema v2 evidence workbench`.
- Final v2 gate commit already existed before this redesign: `02a4486 Finalize agent-schema v2 release gates`.
- Durable anti-forgetting records are present and updated.
- `references/source-catalog.yaml` contains 34 approved/exemplar/candidate source records.
- `references/evidence-matrix.yaml` contains 35 claim-level ontology mappings.
- `references/venue-coverage.yaml` covers 16 required venues across 2022-2026 as 80 review checkpoints.
- `graph.schema.json` includes v2 primitives for `SourceClaim`, `BenchmarkRef`, `EvidenceRef`, and `GraphView`.
- `tools/build-visualization-data.mjs` now embeds ontology graph data plus workbench data: `coverageMatrix`, `evidenceFlows`, `objectSupportIndex`, `viewModels`, and `homeSummary`.
- `visualization/index.html` now defaults to `Evidence Atlas`, not the old full ontology graph.
- The homepage shows the audit path `Source -> Claim -> Ontology Object -> Gap / Release Gate`.
- The old D3 full ontology graph is preserved only in the secondary `Ontology Graph Explorer` route.
- Implemented route panes for Evidence Atlas, System Blueprint, Protocol Flow, Runtime Trace, Safety Surface, Evaluation Coverage, and Ontology Graph Explorer.
- Added gates: `check-workbench-view-model.mjs`, `check-homepage-redesign.mjs`, `check-view-routing.mjs`, and `check-browser-visual-regression.mjs`.
- Updated README, README-zh, UI spec, upgrade plan, final delivery report, release notes, decision log, progress board, and risk register.
- Preview assets now include 11 PNG targets, including redesigned desktop/mobile Evidence Atlas and graph explorer captures.
- Release commit pushed: `781202190594031ba4223990898683eb234bcbf0` (`Redesign agent-schema evidence audit workbench`).
- Remote verification passed: local `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` all resolved to `781202190594031ba4223990898683eb234bcbf0` before this handoff record update.

## Validation Summary

The full final gate set passed on 2026-06-21 22:49 +08:00:

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
node .\tools\check-workbench-view-model.mjs
node .\tools\check-homepage-redesign.mjs
node .\tools\check-view-routing.mjs
node .\tools\check-diagram-exports.mjs
node .\tools\check-i18n-encoding.mjs
node .\tools\check-preview-screenshots.mjs
node .\tools\check-browser-visual-regression.mjs
```

Output summary:

- Graph: 279 nodes, 144 edge classes.
- Expanded visualization edges: 466.
- Constraints: 38 passed, 0 errors, 0 warnings.
- Orphans: 0.
- Required-edge failures: 0.
- Source catalog: 34 sources.
- Evidence matrix: 35 claims.
- Theme coverage: all 13 required themes covered.
- Venue coverage: 16 venues x 5 years = 80 checkpoints.
- Evidence workbench data: 175 supported ontology objects.
- Workbench view model: 7 routes, 35 evidence flows, 13 coverage rows.
- Homepage redesign: default route is `evidence-atlas`; old graph is secondary.
- Preview assets: 11 PNG targets.
- Browser visual regression: 3 captures from local Edge headless.

## Residual Risks

- Browser-captured screenshots depend on a Chromium-family browser; this machine used Microsoft Edge and the gate supports `BROWSER_BIN` override.
- Venue coverage is auditable and gate-enforced, but future 2026 proceedings should be reviewed when final proceedings pages change.

## Next Command

```powershell
git status --short --branch
```
