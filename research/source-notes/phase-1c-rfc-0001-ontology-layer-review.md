# Phase 1C RFC 0001 Ontology Layer Review

Date: 2026-06-30
Status: complete
Gate result: passed

## Scope

Phase 1C reviews and freezes the RFC 0001 ontology layer boundary:

- core anchors;
- profile-owned mechanism and lifecycle families;
- adapter-owned protocol/framework/benchmark mappings;
- observable trace policy;
- hidden chain-of-thought exclusion;
- traceability through `PL-*`, `PR-*`, `SC-*`, and source IDs.

Checked artifacts:

- `docs/rfcs/0001-ontology-layers.md`
- `docs/rfcs/0003-statechart-and-protocol-model.md`
- `research/pl-pr-core-profile-adapter-matrix.md`
- `research/source-notes/phase-0b-expanded-literature-corpus.md`
- `research/source-notes/phase-0b-expanded-engineering-corpus.md`
- `research/source-notes/priority-a-deep-read-ledger.md`
- `research/source-notes/phase-0c-synthesis-constraints.md`
- `research/source-notes/phase-0c-provisional-layer-relation-proposal.md`
- `research/source-notes/phase-0c-review-gate.md`
- `research/source-notes/post-phase-0-dq-resolution.md`
- Phase 0 mechanism, protocol, MAS, statechart, ontology, validation, and benchmark notes.

## Phase 0 Evidence Basis

The Phase 1C decision is grounded in the Phase 0 evidence corpus, not in a
new ad hoc ontology proposal.

Evidence families reviewed:

- Ontology engineering and provenance: OWL/RDF/SHACL/PROV evidence plus LLM-assisted ontology engineering constraints.
- Agent mechanisms: CoT, self-consistency, ReAct, ToT, GoT, MoT, Reflexion, self-refinement, planning/search, reflection, feedback, memory, and learned orchestration evidence.
- Multi-agent systems: BDI/AgentSpeak/OASIS foundations plus current LLM-MAS orchestration evidence.
- Protocols: FIPA, MCP, A2A, OAuth/resource metadata, and adjacent agent/client/UI protocols.
- Frameworks: OpenAI Agents SDK, LangGraph, Deep Agents, CrewAI, Microsoft Agent Framework, and related official docs/repos.
- Statecharts: Harel statecharts, SCXML, XState machines/actors/graph/path evidence.
- Validation: JSON Schema, Zod, Pydantic, Ajv, SHACL, ShEx, OWL.
- Benchmarks and security: SWE-bench, OSWorld, tau2, AppWorld, Terminal-Bench, AgencyBench, Agent Security Bench, MCP Security Bench, SafeAgent, GuardAgent, and related current sources.

## Architecture Conclusion

The ontology must be a structured engineering system, not a loose node list.
Phase 1C freezes RFC 0001 around three ownership strata:

| stratum | role | examples |
|---|---|---|
| Core anchors | Minimal framework-neutral entities and relations needed for auditability and interoperability. | Evidence/Provenance, Actor identity, TrustBoundary, RuntimeSession, observable TraceEvent, Goal/Task/Action/Observation, SchemaArtifact. |
| Profile families | Optional mechanism, lifecycle, security, validation, memory/context, and orchestration semantics over the core. | Memory operations, context summarization, handoff, agents-as-tools, local subagent assignment, guardrail modes, statechart lifecycle profile, semantic validation profile. |
| Adapter membranes | Concrete protocol, framework, benchmark, validator, and statechart implementation mappings. | MCP, A2A, OpenAI/LangGraph/CrewAI/Deep Agents, benchmark scoring axes, XState/SCXML fields, Zod/Pydantic conversions. |

This matches the desired plane-oriented ontology style:

- evidence/provenance plane;
- actor/trust plane;
- runtime/trace plane;
- task/action plane;
- memory/context profile plane;
- orchestration profile plane;
- statechart lifecycle profile plane;
- protocol/tool/framework/benchmark adapter membranes.

## Boundary Review

| topic | decision | traceability |
|---|---|---|
| Evidence/Provenance | Core. Every claim, schema view, and adapter mapping must remain source-backed. | `PL-00`, `PR-020`, SC-ONT-001, SC-VAL-001, `lit-ont-llm-oe-slr`, `lit-ont-neon-gpt`, `lit-ont-kg-survey`, `lit-val-jsonschema-ietf` |
| Actor/TrustBoundary | Core+profile. Core owns identity and boundary-crossing anchors; authorization, threat models, guardrail modes, and protocol details remain profiles/adapters. | `PL-01`, `PL-08`, `PR-019`, SC-PROTO-004, SC-SEC-001, SC-SEC-003, `lit-agent-asb`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026` |
| RuntimeSession/TraceEvent | Core+profile. Core stores observable events, summaries, tool calls, actions, observations, decisions, state updates, artifacts, and checkpoint anchors only. | `PL-03`, `PR-014`, `PR-021`, SC-RUNTIME-003, SC-RUNTIME-004, SC-MECH-001, `eng-fw-openai-tracing`, `eng-fw-langgraph-docs`, `lit-mech-compass` |
| Memory/Context | Profile. Memory is a mechanism family, not one core field. | `PL-05`, `PR-011`, `PR-012`, SC-MECH-001, SC-MECH-002, SC-MECH-003, `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-deepagents-js-docs` |
| Orchestration | Profile. Handoff, agents-as-tools, and local subagent assignment are coordination profiles; remote A2A delegation is adapter-owned. | `PL-06`, `PR-004`, `PR-005`, `PR-006`, `PR-003`, SC-RUNTIME-002, SC-MECH-005, SC-PROTO-003, `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `lit-agent-paramanager` |
| A2A/MCP/frameworks | Do not pollute core. Core may reference actor/tool/boundary anchors; protocol and framework fields remain profile/adapter-owned. | SC-PROTO-001, SC-PROTO-002, SC-PROTO-003, `eng-proto-mcp-spec`, `eng-proto-a2a-docs`, `eng-fw-openai-python-docs`, `eng-fw-langgraph-docs` |
| Benchmarks | Adapter. Benchmark metrics, pressure axes, environments, and leaderboard scoring are eval adapter concerns. | `PL-07`, `PR-017`, SC-EVAL-001, SC-EVAL-002, SC-EVAL-003, `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-tau2`, `eng-bench-appworld`, `lit-bench-terminal` |
| Statecharts | Profile+adapter. Statecharts are lifecycle/control-flow profiles over runtime/session state; XState/SCXML fields and execution semantics are adapter-owned. | `PR-013`, SC-MECH-006, SC-RUNTIME-003, `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-scxml` |
| Hidden CoT | Excluded from core and from required fields. Named reasoning mechanisms remain mechanism profiles. | SC-MECH-001, SC-RUNTIME-004, SC-SEC-001, `lit-mech-compass`, `lit-state-stateflow`, `eng-fw-openai-tracing`, `lit-agent-safeagent` |

## Applied Tightening

Edited `docs/rfcs/0001-ontology-layers.md`:

- Added an ontology architecture section defining core anchors, profile families, and adapter membranes.
- Clarified that layers are ownership strata, not node buckets.
- Clarified external actor handling: core may store opaque external actor endpoint identity and boundary crossings, but not remote-agent internals.
- Clarified TrustBoundary: core owns auditable boundary identity and crossings only.
- Strengthened hidden-CoT and mechanism-profile exclusion for CoT, ReAct, ToT, GoT, MoT, Reflexion, self-reflection, task-decomposition controllers, learned orchestrators, and related mechanism internals.
- Clarified RuntimeSession/TraceEvent as observable-only.
- Added boundary rows for mechanism profile vs core plan artifact, statechart profile vs runtime core, and external actor anchor vs A2A remote delegation.
- Added Phase 1C gate record.

Edited `research/pl-pr-core-profile-adapter-matrix.md`:

- Corrected `PR-013` from adapter-only to profile-owned statechart transition semantics, with XState/SCXML fields remaining adapter-owned.
- Updated disposition summary from profile 14 / adapter 4 to profile 15 / adapter 3.

## Subagent Review Results

Ontology reviewer:

- Result: PASS.
- Adapter-only concepts promoted to core: 0.
- Hidden CoT required fields: 0.
- Missing traceability: 0.
- Confirmed RFC 0001 references `PL-00` through `PL-09`, `PR-001` through `PR-021`, 24 `SC-*` IDs, and 52 source IDs before the final tightening.
- Suggested architecture wording was incorporated.

Mechanism/orchestration reviewer:

- Result: PASS with pre-freeze tightening.
- Identified statechart disposition wording ambiguity; corrected to profile over runtime/session state with XState/SCXML adapter ownership.
- Identified remote actor ambiguity; clarified opaque external actor endpoint identity only.
- Requested explicit exclusion of CoT/ReAct/ToT/GoT/MoT/reflection/orchestration internals from core plan relations; incorporated.
- Requested benchmark evidence labeling as evaluation pressure only; incorporated.

Security/trust reviewer:

- Result: PASS.
- Adapter-only concepts promoted to core: 0.
- Hidden CoT required fields: 0.
- Blocking TrustBoundary traceability gaps: 0.
- TrustBoundary hardening wording was incorporated.

## Local Verification

Post-edit checks:

| Check | Result |
|---|---:|
| Unique source IDs in RFC 0001 + PL/PR matrix | 54 |
| Missing source IDs | 0 |
| RFC 0001 `PL-*` refs | 10 |
| RFC 0001 `PR-*` refs | 21 |
| RFC 0001 `SC-*` refs | 24 |
| RFC proposal IDs missing from matrix | 0 |
| Adapter-only concept promoted to core | 0 |
| Hidden CoT required fields | 0 |

## Gate Decision

| Phase 1C gate | Required | Observed | Result |
|---|---:|---:|---|
| Adapter-only concepts promoted to core | 0 | 0 | PASS |
| Hidden CoT as required field | 0 | 0 | PASS |
| Layer rows traceable to `SC-*`, `PL/PR`, and source IDs | yes | yes | PASS |

Phase 1C is complete. RFC 0001 is ready to serve as the frozen ontology layer
boundary for the rest of Phase 1.

## Handoff To Phase 1D

Phase 1D should review RFC 0002 schema contract constraints against the frozen
RFC 0001 boundaries:

- provenance required for every artifact;
- observable trace only;
- cross-boundary relations require TrustBoundary references;
- memory/context remains profile-owned;
- benchmark, MCP, A2A, framework, and statechart fields do not enter canonical core schema;
- JSON Schema structural contract remains separate from semantic profiles.
