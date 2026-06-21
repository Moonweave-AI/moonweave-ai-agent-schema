# agent-schema Upgrade Worklog

Append-only record for the comprehensive v2 upgrade.

## 2026-06-21

- Phase: 0/1/2 bootstrap.
- Started from clean `main...origin/main`.
- Re-read current repository baseline and the existing validation chain.
- Verified current plan order: research first, UI design second, implementation third.
- Created durable records to prevent context loss during long-running revisions.
- Built an initial authoritative source catalog and evidence matrix from peer-reviewed papers, official protocols, official SDK/framework docs, and graph presentation standards.
- Added `SourceClaim` and `BenchmarkRef` to the schema and meta graph.
- Added v2 GraphView artifacts for research, protocol, runtime, safety, evaluation, UI flow, and workbench architecture views.
- Added workbench shell to `visualization/index.html` while preserving existing D3 graph and direct-open behavior.
- Generated preview PNG assets under `reports/previews/`.
- Cleaned source index and BibTeX records so placeholder sources no longer act as normative evidence.
- Validation status: old graph/constraint/orphan/required-edge checks passed; new source/evidence/theme/diagram/encoding/preview checks passed.
- Remaining research gap: exhaustive venue-by-venue and year-by-year agent paper indexing must continue as an explicit coverage expansion, not as an assumed completion.

## 2026-06-21 Finalization Pass

- Phase: A-G final convergence.
- Re-read `context-handoff.md`, `decision-log.md`, `progress-board.md`, and `risk-register.md` before continuing.
- Re-ran the existing 12 gates and confirmed the bootstrap baseline was valid.
- Committed the baseline as `36d9dc7 Bootstrap agent-schema v2 evidence workbench`.
- Added `references/venue-coverage.yaml` and `tools/check-venue-coverage.mjs`; the venue gate expands the 16 required venues across 2022-2026 into 80 checkpoints.
- Resolved `gap.venue_exhaustive_index` from blocking/high to informational/resolved because the venue coverage matrix is now gate-enforced.
- Extended `tools/build-visualization-data.mjs` to embed compact source, claim, gap, theme coverage, and object support indexes into `visualization/index.html`.
- Bound the workbench UI to embedded evidence data: source filters, source list, claim list, gap list, claim-to-node highlighting, and node evidence backreferences.
- Added `tools/check-evidence-workbench-data.mjs` to block stale or missing embedded evidence data.
- Expanded preview generation and validation to include desktop safety surface, desktop evaluation coverage, browser desktop capture, and browser mobile capture assets.
- Updated README, README-zh, source matrix, UI spec, upgrade plan, progress board, risk register, and context handoff.
- Validation status before final commit: full 14-gate run passed.
- Validation summary: 279 nodes, 144 edge classes, 466 expanded visualization edges, 38 constraints, 34 sources, 35 claims, 13 covered themes, 80 venue/year checkpoints, 175 evidence-supported objects, 8 preview PNGs.
