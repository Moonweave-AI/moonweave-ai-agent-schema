# agent-schema v2 Release Notes

## Highlights

- Replaced the default visualization homepage with `Evidence Atlas`, an audit board for `Source -> Claim -> Ontology Object -> Gap / Release Gate`.
- Moved the old D3 full ontology graph into the secondary `Ontology Graph Explorer` route while preserving direct-open static HTML behavior.
- Added audited research source, evidence claim, and venue/year coverage data.
- Added SourceClaim, BenchmarkRef, and expanded GraphView modeling support.
- Added venue coverage, evidence workbench data, workbench view model, homepage redesign, view routing, and browser visual regression gates.
- Added final preview assets for overview, evidence, protocol, safety, evaluation, mobile detail, redesigned desktop/mobile Evidence Atlas, and graph explorer.

## Validation

Run the full gate set from README before publishing. The release is blocked if any ontology, evidence, venue, workbench-data, view-model, homepage, routing, encoding, diagram, preview, or browser visual regression gate fails.

## Compatibility

Existing ontology YAML remains compatible. New evidence fields are additive, and stricter normative coverage is enforced by tooling rather than by breaking existing node files.
