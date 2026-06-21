# agent-schema Upgrade Progress Board

## Phase 0: Anti-Forgetting Workspace

- [x] Create worklog.
- [x] Create context handoff.
- [x] Create decision log.
- [x] Create progress board.
- [x] Create risk register.

## Phase 1: Research Catalog and Evidence Matrix

- [x] Create source catalog.
- [x] Create evidence matrix.
- [x] Record source tiers and required themes.
- [x] Add source catalog gate.
- [x] Add evidence coverage gate.
- [x] Add theme coverage gate.
- [x] Expand venue-by-venue paper coverage beyond the initial authoritative seed.
- [x] Add venue coverage gate.

## Phase 2: UI Specification

- [x] Create high-fidelity UI specification.
- [x] Create diagram-as-code previews.
- [x] Define generated preview asset list.
- [x] Add diagram export gate.
- [x] Add preview image gate.
- [x] Generate initial static preview PNGs.
- [x] Generate final preview PNGs for overview, evidence, protocol, safety, evaluation, mobile detail, browser desktop, and browser mobile.
- [x] Complete browser-captured visual QA through local Edge headless screenshots.

## Phase 3: Ontology v2 and Data Model

- [x] Extend schema with SourceClaim and BenchmarkRef.
- [x] Clean legacy source index and BibTeX placeholders.
- [x] Add research/evidence view layer.
- [x] Run old and new gates after the first ontology batch.

## Phase 4: Workbench Frontend

- [x] Add static evidence workbench UI layer.
- [x] Preserve direct-open D3 graph.
- [x] Add responsive side/detail panels.
- [x] Generate preview PNGs.
- [x] Bind source/claim/gap data into the workbench from embedded evidence data.
- [x] Add node detail evidence backreferences.

## Phase 4.5: Venue and Workbench Data Gates

- [x] Add `references/venue-coverage.yaml`.
- [x] Add `tools/check-venue-coverage.mjs`.
- [x] Add `tools/check-evidence-workbench-data.mjs`.
- [x] Embed `evidence-data` into `visualization/index.html`.

## Phase 5: Final Validation

- [x] Run old six gates.
- [x] Run new source/evidence/theme/venue/workbench/diagram/encoding/preview gates.
- [x] Update README and README-zh.
- [x] Final context handoff with residual risks.
