# RFC 0004: Phase 1 Schema Workplan

Status: accepted
Created: 2026-06-30
Accepted: 2026-06-30
Depends on:

- `docs/rfcs/0001-ontology-layers.md`
- `docs/rfcs/0002-canonical-schema-contract.md`
- `docs/rfcs/0003-statechart-and-protocol-model.md`
- `research/pl-pr-core-profile-adapter-matrix.md`
- `ontology/agent-ontology.md`
- `ontology/agent-ontology.json`

## Purpose

Close Phase 1 and define the implementation workplan for the first executable ontology/schema/frontend slice.

This workplan is intentionally narrow: it migrates the frozen Phase 1 ontology release into reviewable module sources, a strict candidate, generated schemas/types/fixtures, and a local Moonweave-styled explorer. It does not reopen Phase 0 broad research.

The Phase 1 output is the agent-system ontology itself, not only the rules for designing one. RFC 0001-0003 define evidence and ownership boundaries. The legacy `ontology/agent-ontology.json` is now a frozen migration baseline: its planes, modules, classes, properties, individuals, axioms, and mappings require explicit dispositions, but it is not the editable source for the unified graph. Ontology-engineering metadata remains artifact metadata only, not an agent-system term family.

## Implementation Scope

1. Freeze `ontology/agent-ontology.json`, its definition ledger, and its legacy generator as read-only migration inputs with hashes and exactly-once record manifests.
2. Maintain the only editable ontology facts under `ontology/source/**`, using one product wrapper and recursively discovered Module wrappers. Forty-one is frozen v1 migration coverage, not a current upper bound; v3 currently accepts 47 capability-bounded Modules.
3. Generate a strict unpublished candidate from those sources without reading the legacy or published generated canonical.
4. Add valid and invalid fixtures for hierarchy, trust-boundary, provenance, observable trace, profile, and adapter rules.
5. Generate optional Zod, Pydantic, OWL/RDF, SHACL, and ShEx projections only from canonical node/relation information.
6. Build the sole visible graph from candidate `planes/modules/classes/relations`; structure, examples, instances, source claims, constraints, cases, and mappings remain inline information.
7. Switch canonical, Schema, generated types/index, fixtures/tests, and the React consumer atomically only after all migration and release gates pass.

## Non-Goals

- Do not implement production protocol adapters.
- Do not introduce a backend service.
- Do not store or display hidden chain-of-thought fields.
- Do not treat profile or adapter fields as canonical ontology truth.
- Do not use `needs-targeted-check` sources for accepted field-level schema claims.

## Phase Gates

| gate | required result |
|---|---|
| RFC freeze | RFC 0001, 0002, and 0003 are accepted. |
| Ontology system freeze | Legacy canonical, definition ledger, and generator hashes/counts/record pointers are captured; they are read-only migration inputs. |
| Source integrity | Every implementation source ID exists in `research/source-registry.csv`. |
| Living metadata | Every engineering source used for field-level schema claims is normalized. |
| Structural schema | Ajv validates accepted fixtures and rejects invalid fixtures. |
| Unified graph | The generated graph is non-empty and is derived only from canonical `planes/modules/classes/relations`; annotations and generated projections create no shadow graph elements. |
| Frontend | The explorer renders one non-empty canonical concept graph and one inline node/relation characteristics table. Schema constraints, examples, instances, evidence, statechart annotations, and adapter mappings appear only as information attached to the selected canonical node or relation; no competing graph or page is required. |

## Handoff To Later Phases

- Phase 2 refines the accepted ontology system into canonical structural schema without changing Phase 1 ownership boundaries.
- Phase 3 hardens the canonical schema family.
- Phase 4 implements generated Zod, Pydantic, OWL/RDF, SHACL, and ShEx exports.
- Phase 5 matures Graph IR and statechart fixtures.
- Phase 6 deepens the frontend interaction model and visual verification.
- Phase 7 adds protocol, framework, and benchmark adapters.
- Phase 8 adds release governance, CI, visual regression, and version policy.
