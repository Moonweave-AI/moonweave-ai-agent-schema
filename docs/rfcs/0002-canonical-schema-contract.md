# RFC 0002: Canonical Schema Contract

Status: accepted
Created: 2026-06-30
Accepted: 2026-06-30
Depends on:

- `docs/rfcs/0001-ontology-layers.md`
- `research/source-notes/post-phase-0-dq-resolution.md`
- `research/pl-pr-core-profile-adapter-matrix.md`
- `research/living-source-metadata.csv`

## Purpose

Define the schema contract direction after Phase 0.

This RFC does not create schema files. It defines what must be true before canonical schema artifacts are generated.

## Contract Direction

The canonical structural contract should use JSON Schema Draft 2020-12 as the normative structural dialect, with generated profile views for runtime validator ecosystems such as Zod and Pydantic.

Semantic validation remains separate through ontology/graph profiles such as OWL, SHACL, and ShEx.

## Non-Goals

- Do not generate schema files.
- Do not generate TypeScript, Python, Zod, Pydantic, OWL, SHACL, or ShEx code.
- Do not claim round-trip equivalence between JSON Schema and runtime validator profiles.
- Do not encode private chain-of-thought.
- Do not use benchmark fields as core schema fields.

## Required Schema Families

| family | disposition | purpose | source proposals |
|---|---|---|---|
| Provenance metadata | core | Track source IDs, review status, derivation, and decision evidence. | `PL-00`, `PR-020` |
| Actor/boundary references | core+profile | Distinguish local agents, remote agents, humans, tools, services, and trust boundaries. | `PL-01`, `PR-019` |
| Runtime/session metadata | core+profile | Support runs, sessions, checkpoints, resumability, and trace anchors. | `PL-03`, `PR-014`, `PR-021` |
| Observable trace events | core | Support action summaries, tool calls, state updates, safety decisions, observations, and artifacts without hidden CoT. | `PR-021`, `PR-010` |
| Goal/task/action/plan artifacts | core+profile | Represent observable goals, tasks, plans, steps, actions, and observations. | `PL-04`, `PR-007`, `PR-010` |
| Trust and security metadata | core+profile | Attach trust-boundary and authority metadata to cross-boundary relations. | `PL-08`, `PR-018`, `PR-019` |
| Structural validation | core+profile | Define structural payload validation using JSON Schema-compatible contracts. | `PL-09`, `PR-015` |
| Semantic constraints | profile | Represent OWL axioms, SHACL shapes, and ShEx shapes separately from structural schema. | `PR-016` |
| Memory/context operations | profile | Represent retrieval, summary, store/update/discard, and context budget profiles. | `PL-05`, `PR-011`, `PR-012` |
| Protocol/runtime adapters | adapter/profile | Generate MCP, A2A, OpenAI, LangGraph, XState, Zod, Pydantic, and benchmark views only from reviewed mappings. | `PL-02`, `PL-06`, `PL-07`, `PR-001` through `PR-006`, `PR-013`, `PR-017` |

## Field-Level Constraints

Future schema fields must follow these constraints:

1. Every top-level artifact must carry stable ID, artifact type, provenance/source reference, and review status.
2. Every canonical field, profile mapping, adapter mapping, and conversion warning must carry `source_ids`, normalized source/version metadata when the source is living, derivation note, and review status.
3. Any field derived from a living doc/repo must cite a row in `research/living-source-metadata.csv` with `normalization_status=normalized`, or must remain draft/profile-only until checked.
4. `TrustBoundary` must be a top-level artifact. Every cross-boundary relation must carry `trust_boundary_id`, source actor, target actor, direction, authority basis, and protocol/resource context when authority, remote execution, tool output, memory retrieval, or protocol metadata crosses actors or systems.
5. Trace fields must capture observable events, not hidden chain-of-thought.
6. Generated Zod/Pydantic profiles must record bidirectional conversion warnings: canonical-to-profile projection loss and imported-profile-to-canonical loss.
7. OWL/SHACL/ShEx artifacts must not be folded into JSON object validation.
8. Generic runtime trace telemetry such as timestamps, event order, tool-call events, and resource observations may exist in core/profile trace artifacts; benchmark-specific score, horizon, user-simulation, sandbox semantics, and pressure interpretation remain eval adapter metadata.

## JSON Schema Dialect Policy

Draft 2020-12 is the normative structural dialect for canonical schema proposals.

Required future schema rules:

- Every schema document must declare `$schema`.
- Every schema document must define stable `$id` and version metadata.
- Reference resolution rules must be explicit before schema generation.
- Vocabulary policy must be explicit, including which vocabularies are allowed, required, or profile-only.
- `format` behavior must specify whether each format is assertion, annotation, or profile-only.
- Property closure policy must be explicit, including use of `additionalProperties` and `unevaluatedProperties`.
- Schema evolution must use versioned contracts rather than silent field reinterpretation.

## Validation Stack

| layer | contract |
|---|---|
| Structural baseline | JSON Schema Draft 2020-12 canonical structural contract. |
| TypeScript profile | Generated Zod view, lossy where Zod has unrepresentable or mode-specific semantics. |
| Python profile | Generated Pydantic view, mode-aware for validation vs serialization. |
| Semantic graph profile | OWL/SHACL/ShEx artifacts for graph semantics and data quality. |
| Runtime guardrail profile | Guardrail/policy checks as runtime profile artifacts, not schema core. |

## Source Evidence

| claim | constraints | source ids |
|---|---|---|
| JSON Schema and runtime validators are not round-trip equivalent. | SC-VAL-002 | `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| Structural and semantic validation are distinct. | SC-VAL-001, SC-ONT-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `lit-val-shacl`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey` |
| Observable trace should not require hidden CoT. | SC-MECH-001, SC-RUNTIME-004 | `lit-mech-compass`, `lit-state-stateflow`, `eng-fw-openai-tracing`, `eng-fw-openai-guardrails` |
| Guardrail modes differ operationally. | SC-SEC-002 | `lit-agent-guardagent`, `lit-agent-safeagent`, `eng-fw-openai-guardrails` |
| Trust boundaries are structural for protocols and multi-agent systems. | SC-PROTO-004, SC-SEC-001, SC-SEC-003 | `lit-agent-asb`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026` |

## Acceptance Criteria

This RFC is accepted when:

- The schema contract starts from structural JSON Schema-compatible artifacts.
- Zod/Pydantic are generated profiles, not canonical truth.
- OWL/SHACL/ShEx remain semantic profiles.
- Semantic artifacts cannot be referenced as JSON object validators except through structural metadata links.
- `TrustBoundary` exists as a top-level artifact and every cross-boundary relation references it through `trust_boundary_id`.
- Provenance metadata is mandatory for every field, profile mapping, adapter mapping, and conversion warning.
- No field-level schema or profile-generation rule is finalized before living source metadata is checked.

## Consequences

- Implementation requires generators or hand-written profiles later.
- Some runtime fields remain adapter-only.
- Schema work becomes reviewable because every field family has a source and disposition.

## Phase 1 Gate Record

- Source ID integrity: passed against `research/source-registry.csv`.
- Living source normalization: passed for all engineering sources used by field-level schema constraints.
- Canonical/profile split: passed; JSON Schema Draft 2020-12 is canonical structural baseline, while Zod, Pydantic, OWL, SHACL, and ShEx remain generated profiles.
- Cross-boundary constraint: passed; trust-boundary references are mandatory for cross-boundary relation fields.
- Hidden chain-of-thought policy: passed; trace fields represent observable events only.
