# Source And Schema Governance

Status: accepted v1
Created: 2026-06-30

## Source Policy

All ontology, schema, graph, profile, and adapter artifacts must cite source IDs from `research/source-registry.csv`.

Engineering and living sources used for field-level schema or adapter claims must have a matching row in `research/living-source-metadata.csv` with `normalization_status=normalized`.

Future-dated sources are excluded from active evidence until the stated date has passed and the source is rechecked.

## Recheck Cadence

| source class | cadence | required action |
|---|---|---|
| official protocol spec | before any adapter field change | capture version/date and update metadata |
| official framework docs | before profile or adapter release | capture doc date, package version, or repository commit |
| GitHub repo | before release | capture default branch commit |
| release note/tag | before release | capture tag/version and date |
| benchmark site/repo | before eval adapter release | capture version, commit, or publication date |
| papers/static standards | when venue/status changes matter | update venue upgrade ledger |

## Schema Versioning

Use semantic versioning for public schema families:

- Patch: editorial metadata, examples, or non-normative docs.
- Minor: additive optional fields, new profile exports, or new adapter fixture families.
- Major: renamed fields, removed fields, changed relation semantics, required new fields, or trust-boundary rule changes.

Every public schema change must include:

1. Version note.
2. Source IDs.
3. Constraint/proposal IDs when derived from Phase 0/1 evidence.
4. Valid fixture update.
5. Invalid fixture update if behavior changes.

## Structural And Semantic Validation

JSON Schema Draft 2020-12 is the canonical structural baseline.

Zod and Pydantic are generated profiles. OWL/RDF, SHACL, and ShEx are semantic profiles. Semantic validation must not be treated as a JSON object validator unless bridged by explicit profile metadata.

Any unrepresentable profile behavior must emit `ConversionWarning` or `ConversionError`.

## Trust Boundary Governance

Every relation that crosses authority, remote execution, tool output, memory retrieval, resource access, or protocol metadata boundaries must reference a `TrustBoundary` artifact through `trust_boundary_id`.

A2A remote delegation, MCP capability surfaces, handoffs, agents-as-tools, and local subagent assignment must remain distinguishable relations.

## Release Gate

A release can be cut only when:

- RFC status and source gates pass.
- Ajv validates valid fixtures and rejects invalid fixtures.
- Typecheck, unit tests, build, and E2E pass.
- Frontend canvas is non-empty on desktop and mobile.
- No hidden chain-of-thought field appears in schema, fixtures, or rendered UI.
- No `needs-targeted-check` source is used for accepted field-level schema claims.
- Future-dated sources are not active evidence.
