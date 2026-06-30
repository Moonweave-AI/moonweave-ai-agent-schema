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

This workplan is intentionally narrow: it turns the concrete accepted ontology system in `ontology/agent-ontology.md` and `ontology/agent-ontology.json` into reviewable schemas, fixtures, profile sketches, Graph IR, and a local Moonweave-styled explorer. It does not reopen Phase 0 broad research.

The Phase 1 output is the agent-system ontology itself, not only the rules for designing one. RFC 0001-0003 define boundaries; `ontology/agent-ontology.json` defines concrete agent-system planes, modules, classes, object properties, data properties, controlled individuals, axioms, adapter mappings, and hygiene gates that downstream implementation must consume. Ontology-engineering metadata remains artifact metadata only, not an agent-system term family.

## Implementation Scope

1. Treat `ontology/agent-ontology.json` as the concrete Phase 1 ontology source of truth.
2. Generate a JSON Schema Draft 2020-12 structural contract from the accepted ontology system.
3. Add valid and invalid fixtures for trust-boundary, provenance, observable trace, profile, and adapter rules.
4. Add generated profile sketches for Zod, Pydantic, OWL/RDF, SHACL, and ShEx exports.
5. Build Graph IR from ontology planes, modules, classes, properties, individuals, axioms, relations, and adapter mappings rather than hand-written demo nodes.
6. Implement a local React explorer using canonical ontology fixtures only.
7. Verify source IDs, living metadata, schema validation, graph constraints, and frontend rendering.

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
| Ontology system freeze | `ontology/agent-ontology.md` and `ontology/agent-ontology.json` exist and define agent-system planes, modules, classes, properties, individuals, axioms, adapter mappings, and hygiene gates. |
| Source integrity | Every implementation source ID exists in `research/source-registry.csv`. |
| Living metadata | Every engineering source used for field-level schema claims is normalized. |
| Structural schema | Ajv validates accepted fixtures and rejects invalid fixtures. |
| Graph IR | Generated graph is non-empty and is generated from ontology planes/modules/classes/properties/individuals/axioms/adapter mappings, with MCP, A2A, statechart, and benchmark semantics separated. |
| Frontend | The explorer renders a non-empty graph, inspector, evidence ledger, schema view, statechart view, and adapter map. |

## Handoff To Later Phases

- Phase 2 refines the accepted ontology system into canonical structural schema without changing Phase 1 ownership boundaries.
- Phase 3 hardens the canonical schema family.
- Phase 4 implements generated Zod, Pydantic, OWL/RDF, SHACL, and ShEx exports.
- Phase 5 matures Graph IR and statechart fixtures.
- Phase 6 deepens the frontend interaction model and visual verification.
- Phase 7 adds protocol, framework, and benchmark adapters.
- Phase 8 adds release governance, CI, visual regression, and version policy.
