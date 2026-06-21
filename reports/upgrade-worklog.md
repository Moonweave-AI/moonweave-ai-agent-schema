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
