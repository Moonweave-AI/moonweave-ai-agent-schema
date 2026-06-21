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

## Phase 4.6: Homepage Redesign and Presentation Model

- [x] Replace the default homepage with `Evidence Atlas`.
- [x] Move the old D3 full graph into secondary `Ontology Graph Explorer`.
- [x] Add `coverageMatrix`, `evidenceFlows`, `objectSupportIndex`, `viewModels`, and `homeSummary` to embedded workbench data.
- [x] Implement Source -> Claim -> Ontology Object -> Gap / Gate flow board.
- [x] Implement System Blueprint, Protocol Flow, Runtime Trace, Safety Surface, and Evaluation Coverage route panes.
- [x] Add `check-homepage-redesign.mjs`.
- [x] Add `check-workbench-view-model.mjs`.
- [x] Add `check-view-routing.mjs`.
- [x] Add `check-browser-visual-regression.mjs`.
- [x] Generate redesigned desktop, mobile, and graph explorer browser screenshots.

## Phase 5: Final Validation

- [x] Run old six gates.
- [x] Run new source/evidence/theme/venue/workbench/view-model/homepage/routing/browser/diagram/encoding/preview gates.
- [x] Update README and README-zh.
- [x] Final context handoff with residual risks.
