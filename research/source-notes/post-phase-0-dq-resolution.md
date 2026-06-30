# Post-Phase-0 Deferred Question Resolution

Date: 2026-06-30
Status: resolved for RFC drafting

## Scope

This artifact resolves `DQ-001` through `DQ-005` from Phase 0C so the project can move from provisional proposals to RFC drafts.

Inputs:

- `research/source-notes/phase-0c-completion.md`
- `research/source-notes/phase-0c-provisional-layer-relation-proposal.md`
- `research/source-notes/phase-0c-review-gate.md`
- `research/source-notes/phase-0c-final-closure-audit.md`
- `research/living-source-metadata.csv`
- `research/paper-venue-upgrade.csv`

## Decisions

| id | decision | disposition | rationale | constraints | source ids |
|---|---|---|---|---|---|
| DQ-001 | Evaluation and benchmark concepts remain profile/adapter-facing, not ontology core. | resolved | Benchmarks differ by environment, scoring, horizon, artifact, user simulation, and resource pressure. Core may reference evaluation evidence, but benchmark-specific axes stay in eval profiles/adapters. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-osworld-v2`, `eng-bench-tau2`, `eng-bench-tau2-verified`, `eng-bench-appworld`, `lit-bench-terminal`, `lit-bench-agencybench` |
| DQ-002 | Statecharts are a lifecycle/control-flow profile over runtime state, not core lifecycle primitives. | resolved | LangGraph-style durable runtime state, sessions, and checkpoints are broader than statechart semantics; XState/SCXML provide strong graph/testing profiles but do not define every agent runtime. | SC-RUNTIME-003, SC-MECH-006 | `eng-fw-langgraph-docs`, `eng-state-xstate-docs`, `eng-state-xstate-graph`, `eng-state-scxml`, `lit-state-stateflow`, `lit-state-metaagent` |
| DQ-003 | Memory/context must split into operation families before schema work. | resolved | Working context, retrieval, long-term memory, summaries, update/discard actions, and context budgets have different mechanisms and risks. A single memory field would lose meaningful distinctions. | SC-MECH-001, SC-MECH-002, SC-MECH-003 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` |
| DQ-004 | Trust boundaries should be standalone entities/relations and also referenced by cross-boundary relation attributes. | resolved | Standalone trust-boundary nodes support threat propagation and review; relation-level references keep schemas ergonomic and make every cross-boundary action auditable. | SC-PROTO-004, SC-SEC-001, SC-SEC-003 | `lit-agent-asb`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026`, `eng-proto-a2a-docs`, `eng-proto-mcp-spec` |
| DQ-005 | Start structural schema work from JSON Schema 2020-12-compatible core, with generated Zod/Pydantic profiles and separate OWL/SHACL/ShEx semantic constraints. | resolved | JSON Schema is the stable structural interchange baseline; Pydantic/Zod conversion modes are useful generated views but are not round-trip equivalent; OWL/SHACL/ShEx serve semantic graph roles. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-val-shacl`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey` |

## RFC Implications

| decision | RFC impact |
|---|---|
| DQ-001 | RFC 0001 should not promote `PL-07` into core. RFC 0002 may define evaluation metadata references. RFC 0003 may define benchmark adapters. |
| DQ-002 | RFC 0001 should keep runtime/session core separate from statechart profile. RFC 0003 should own statechart/profile mapping. |
| DQ-003 | RFC 0001 should split memory/context from task execution. RFC 0002 should avoid one generic `memory` field. |
| DQ-004 | RFC 0001 should include trust boundary as core/security-facing concept. RFC 0002 should require relation-level `trust_boundary_id` for cross-boundary links. RFC 0003 should map MCP/A2A trust metadata. |
| DQ-005 | RFC 0002 should define JSON Schema as the structural contract baseline, with generated Zod/Pydantic profiles and separate semantic validation artifacts. |

## Non-Goals

- These decisions do not create implementation code.
- These decisions do not finalize field names.
- These decisions do not certify every source as venue-upgraded or version-normalized.
- These decisions do not make benchmark or framework-specific fields part of ontology core.
