# agent-schema Upgrade Context Handoff

## Current Phase

Phase 0/1/2/3/4 bootstrap is active: durable records, source catalog, evidence matrix, UI specification, schema v2 primitives, GraphView artifacts, workbench shell, previews, and new gates are in place.

## Completed

- Repository baseline checked: clean `main...origin/main`.
- Existing plan order locked: research -> UI specification -> ontology/tooling/frontend execution.
- Durable record files created:
  - `reports/upgrade-worklog.md`
  - `reports/context-handoff.md`
  - `reports/decision-log.md`
  - `reports/progress-board.md`
  - `reports/risk-register.md`
- Initial source catalog and evidence matrix created under `references/`.
- Initial UI specification and upgrade plan reports created under `reports/`.
- Initial diagram-as-code previews created under `reports/diagrams/`.
- `graph.schema.json` now includes `SourceClaim` and `BenchmarkRef`.
- Meta graph now has `node.source_claim` and `node.benchmark_ref`.
- Seven GraphView YAML artifacts were added under `ontology/12-engineering-validation-graph/views/`.
- `visualization/index.html` now includes the evidence workbench shell.
- Four PNG previews were generated under `reports/previews/`.
- Existing six validation gates passed after the ontology changes.
- New six validation gates passed after the research/design additions.

## In Progress

- Expand venue-by-venue paper coverage beyond the initial authoritative seed.
- Add deeper graph overlays that use `references/evidence-matrix.yaml` directly at runtime.
- Replace static preview drawings with browser-captured screenshots if Playwright is later introduced.

## Blockers

- Full "all papers across all venues" coverage remains an auditable ongoing matrix, not an unverifiable claim. The release gate requires explicit coverage records and gap notes.

## Next Command

```powershell
node .\tools\check-source-catalog.mjs
node .\tools\check-evidence-coverage.mjs
node .\tools\check-theme-coverage.mjs
node .\tools\check-diagram-exports.mjs
node .\tools\check-i18n-encoding.mjs
node .\tools\check-preview-screenshots.mjs
node .\tools\check-visualization-framework.mjs
node .\tools\check-visualization-detail-contract.mjs
```
