# agent-schema v2 Release Notes

## Highlights

- Added an evidence-first workbench to `visualization/index.html` while preserving direct-open static HTML behavior.
- Added audited research source, evidence claim, and venue/year coverage data.
- Added SourceClaim, BenchmarkRef, and expanded GraphView modeling support.
- Added venue coverage and evidence workbench data gates.
- Added final preview assets for overview, evidence, protocol, safety, evaluation, mobile detail, browser desktop, and browser mobile.

## Validation

Run the full gate set from README before publishing. The release is blocked if any ontology, evidence, venue, workbench-data, encoding, diagram, or preview gate fails.

## Compatibility

Existing ontology YAML remains compatible. New evidence fields are additive, and stricter normative coverage is enforced by tooling rather than by breaking existing node files.
