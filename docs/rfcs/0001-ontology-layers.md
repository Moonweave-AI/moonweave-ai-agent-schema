# RFC 0001: Ontology Layers

Status: accepted
Created: 2026-06-30
Accepted: 2026-06-30

> **2026-07-13 clarification:** RFC 0005 clarifies that Core/Profile/Adapter are ownership and applicability annotations only. They do not define a competing user navigation hierarchy. The canonical Explorer retains `Agent Ontology -> Domain -> Module -> Concept`, including `adapter-plane` as a first-level Domain.

> **2026-07-14 v3 clarification:** Domain and Module remain stable navigation entries, but Module count and Concept depth are not fixed. Below a Module, reviewed `is_a` and structural Relation facts form an arbitrary-depth logical backbone; schema, examples, sources, and cases remain inline information rather than parallel graph layers.

Depends on:

- `research/source-notes/phase-0c-completion.md`
- `research/source-notes/post-phase-0-dq-resolution.md`
- `research/pl-pr-core-profile-adapter-matrix.md`

## Purpose

Define the ontology layer direction after Phase 0 without creating implementation code, generated schema files, or protocol adapters.

The core decision is to keep the ontology small and evidence-backed, with profiles and adapters carrying framework, protocol, benchmark, validation, and statechart-specific semantics.

## Ontology Architecture

Ontology layers are ownership strata, not node buckets. Each layer defines:

- the minimal class/relation anchors it owns;
- the profile or adapter semantics it excludes;
- the evidence path that justifies the boundary: `PL/PR -> SC -> source IDs`.

The architecture uses three disposition levels:

| disposition | owns | excludes |
|---|---|---|
| Core anchors | Framework-neutral concepts and relations required for evidence, actor/trust identity, runtime/session observability, task/action/observation, and structural validation. | Protocol-specific fields, framework-native object names, benchmark scoring axes, hidden chain-of-thought, and private remote-agent internals. |
| Profile families | Optional mechanism, memory/context, orchestration, validation, security, lifecycle, and statechart semantics over core anchors. | Claims that a mechanism family is mandatory for every agent system. |
| Adapter membranes | Concrete protocol, framework, benchmark, validator, and statechart implementation mappings. | Canonical ontology ownership unless a later RFC promotes a concept with cross-source evidence. |

This means the system can later analyze an agent architecture through the following planes and flows. These are analytical ownership/applicability perspectives attached to the canonical eight-Domain graph; they are not an additional navigation hierarchy or another set of user-visible Planes:

- evidence/provenance plane: sources, constraints, decisions, review state;
- actor/trust plane: actors, opaque external actor references, services, tools, humans, and boundary crossings;
- runtime/trace plane: sessions, checkpoints, observable events, artifacts, and resumability anchors;
- task/action plane: goals, tasks, observable plans, actions, observations, and results;
- profile planes: memory/context, orchestration, statechart lifecycle, guardrail/policy, and validation views;
- adapter membranes: MCP, A2A, OpenAI/LangGraph/CrewAI/Deep Agents, benchmark harnesses, XState/SCXML, Zod/Pydantic/OWL/SHACL/ShEx.

## Non-Goals

- Do not define final field names.
- Do not implement JSON Schema, Zod, Pydantic, OWL, SHACL, or ShEx artifacts.
- Do not create runtime adapters.
- Do not model hidden chain-of-thought.
- Do not promote benchmark categories or framework fields into ontology core.

## Layer Model

| layer | disposition | source proposal ids | role | constraints | source ids |
|---|---|---|---|---|---|
| Evidence and provenance | core | `PL-00`, `PR-020` | Preserve source IDs, review status, decision evidence, and derivation trace. | SC-ONT-001, SC-VAL-001 | `lit-ont-llm-oe-slr`, `lit-ont-neon-gpt`, `lit-ont-kg-survey`, `lit-val-jsonschema-ietf` |
| Actor and boundary | core+profile | `PL-01`, `PR-019` | Represent framework-neutral actor identity, local actor references, opaque external actor endpoint identity, humans, tools, services, and trust-boundary crossings. Protocol-specific authorization, A2A task/message metadata, and remote internals remain profile/adapter-owned. | SC-PROTO-001, SC-PROTO-003, SC-PROTO-004, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-proto-mcp-spec`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026`, `lit-agent-msb` |
| Runtime session and trace | core+profile | `PL-03`, `PR-014`, `PR-021` | Represent sessions, checkpoints, resumability, and observable trace events only. Runtime framework details and trace/span field names remain profiles/adapters. | SC-RUNTIME-003, SC-RUNTIME-004, SC-MECH-001, SC-MECH-006 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-openai-python-docs`, `eng-fw-openai-tracing`, `lit-mech-compass` |
| Task, plan, action, observation | core+profile | `PL-04`, `PR-007`, `PR-010` | Represent observable goal/task/action/observation structures and plan artifacts without private reasoning text or named reasoning-mechanism internals. | SC-MECH-001, SC-MECH-003, SC-MECH-004 | `lit-mech-deepplanning`, `lit-mech-compass`, `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-etom` |
| Security and policy | core+profile | `PL-08`, `PR-018`, `PR-019` | Represent trust boundaries as core anchors; leave guardrail modes and threat models to profiles. | SC-PROTO-004, SC-RUNTIME-004, SC-SEC-001, SC-SEC-002, SC-SEC-003 | `lit-agent-asb`, `lit-agent-safeagent`, `lit-agent-guardagent`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026`, `eng-fw-openai-guardrails` |
| Structural and semantic validation | core+profile | `PL-09`, `PR-015`, `PR-016` | Keep structural schema validation separate from semantic graph constraints. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-val-shacl`, `lit-ont-owl-shacl-lessons` |
| Capability/resource surfaces | profile | `PL-02`, `PR-001`, `PR-002`, `PR-008`, `PR-009` | Model protocol/runtime capability exposure and invocation families outside core. | SC-PROTO-001, SC-PROTO-002, SC-RUNTIME-001, SC-RUNTIME-002, SC-MECH-004, SC-VAL-002 | `eng-proto-mcp-changelog`, `eng-proto-mcp-2025-spec`, `eng-proto-mcp-spec`, `eng-fw-openai-tools`, `lit-agent-tooltree`, `lit-agent-etom` |
| Memory and context | profile | `PL-05`, `PR-011`, `PR-012` | Split memory/context operations before schema work. | SC-MECH-001, SC-MECH-002, SC-MECH-003 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` |
| Orchestration profile | profile | `PL-06`, `PR-004`, `PR-005`, `PR-006` | Model handoff, agents-as-tools, and local subagent assignment as coordination profiles. | SC-RUNTIME-002, SC-MECH-005, SC-PROTO-003 | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-agent-paramanager` |
| Remote A2A delegation | adapter | `PR-003` | Keep opaque remote-agent delegation in protocol adapters. | SC-PROTO-001, SC-PROTO-003, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example`, `lit-agent-msb` |
| Evaluation and benchmark | adapter | `PL-07`, `PR-017` | Keep benchmark-specific scoring, pressure axes, and environments in eval adapters. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-osworld-v2`, `eng-bench-tau2`, `eng-bench-tau2-verified`, `eng-bench-appworld`, `lit-bench-terminal`, `lit-bench-agencybench` |
| Statechart lifecycle | profile+adapter | `PR-013` | Treat statecharts as a lifecycle/control-flow profile over `RuntimeSession` state; keep XState/SCXML field mappings and execution semantics adapter-owned. | SC-MECH-006, SC-RUNTIME-003 | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-scxml` |

## Core Invariants

1. Every ontology claim must cite source IDs from `research/source-registry.csv`.
2. Core ontology must not include framework-specific field names unless corroborated across sources.
3. Core ontology must not require hidden chain-of-thought storage.
4. Core plan/trace concepts must not require CoT, ReAct, ToT, GoT, MoT, Reflexion, self-reflection, task-decomposition controllers, learned orchestrators, or other named mechanism internals. Those are mechanism profiles; core records only observable artifacts, events, summaries, decisions, actions, observations, state updates, and results.
5. Protocol semantics, runtime semantics, benchmark axes, validation systems, security policy, guardrail, and threat-model semantics remain profile-specific unless a later RFC explicitly maps them; trust-boundary entities and crossings are core anchors.
6. Trust-boundary crossings are first-class evidence because protocol and multi-agent systems can propagate authority, content, and taint.
7. TrustBoundary is a core anchor only for auditable boundary identity and crossings. Core must not encode protocol-specific authorization models, MCP tool/resource/prompt metadata, A2A task/message fields, remote-agent internal memory, remote-agent tool inventory, proprietary remote-agent logic, guardrail modes, or threat-model taxonomies.
8. Opaque external actor references may appear as core actor anchors only for identity, provenance, and boundary crossing. A2A delegation, task/message fields, remote memory, and remote tool inventory remain adapter-owned.
9. Benchmark evidence cited near core rows is evaluation pressure evidence only; benchmark scoring, pressure axes, environment categories, and leaderboard metrics do not define ontology core taxonomy.

## Deferred-Question Resolutions

| deferred question | resolution |
|---|---|
| `DQ-001` | Evaluation remains adapter-facing; core may reference evaluation evidence but does not absorb benchmark axes. |
| `DQ-002` | Statecharts are a lifecycle/control-flow profile over runtime state, not universal core lifecycle semantics. |
| `DQ-003` | Memory/context is split into operation families: retrieval, summary, long-term memory, update/discard, and budget management. |
| `DQ-004` | Trust boundaries are standalone entities/relations and also referenced by relation attributes. |
| `DQ-005` | Structural schema work starts from JSON Schema; semantic graph constraints remain separate. |

## Boundary Decisions

| boundary | decision | constraints | source ids |
|---|---|---|---|
| MCP vs A2A | Keep MCP tool/resource/prompt surfaces distinct from A2A remote-agent tasks/messages. | SC-PROTO-001, SC-PROTO-003, SC-RUNTIME-002 | `eng-proto-mcp-spec`, `eng-proto-mcp-changelog`, `eng-proto-a2a-docs`, `eng-proto-a2a-spec` |
| Handoff vs agents-as-tools | Keep ownership transfer distinct from callable encapsulation. | SC-RUNTIME-002, SC-MECH-005 | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `lit-agent-paramanager` |
| Local subagent vs remote agent | Local context assignment and opaque remote delegation are different profile relations. | SC-PROTO-003, SC-RUNTIME-002, SC-MECH-005 | `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `lit-agent-conductor`, `lit-agent-mas-orchestra` |
| Structural vs semantic validation | JSON Schema-like validation and OWL/SHACL/ShEx constraints remain separate. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `eng-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-val-shacl`, `lit-ont-owl-shacl-lessons` |
| Observable trace vs hidden CoT | Store observable trace events, summaries, tool calls, decisions, state updates, and artifacts; do not require private reasoning text. | SC-MECH-001, SC-RUNTIME-004, SC-SEC-001 | `lit-mech-compass`, `lit-state-stateflow`, `eng-fw-openai-tracing`, `lit-agent-safeagent` |
| Mechanism profile vs core plan artifact | Treat CoT/ReAct/ToT/GoT/MoT/reflection/search/orchestration internals as optional mechanism profiles. Core may represent only observable plans, actions, observations, summaries, state updates, decisions, and artifacts. | SC-MECH-001, SC-MECH-003, SC-MECH-004, SC-MECH-005 | `lit-mech-compass`, `lit-mech-deepplanning`, `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-paramanager` |
| Statechart profile vs runtime core | Statecharts are a lifecycle/control-flow profile over runtime/session state, not the universal runtime ontology. XState/SCXML execution fields remain adapter-owned. | SC-MECH-006, SC-RUNTIME-003 | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-scxml` |
| External actor anchor vs A2A remote delegation | Core can identify an opaque external actor endpoint and boundary crossing; A2A task/message/delegation metadata stays in protocol adapters. | SC-PROTO-003, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example`, `lit-agent-msb` |

## Acceptance Criteria

This RFC is accepted when:

- Every layer disposition maps to `research/pl-pr-core-profile-adapter-matrix.md`.
- No adapter-only row is promoted into core.
- Security and provenance remain first-class.
- RFC 0002 can define schema contract constraints without inventing framework-specific fields.
- RFC 0003 can define protocol/statechart/benchmark adapter mappings without rewriting the core ontology.
- Each accepted layer has traceability through `PL-*` or `PR-*`, `SC-*`, and source IDs.

## Phase 1 Gate Record

- Source ID integrity: passed against `research/source-registry.csv`.
- Living source normalization: passed for field-affecting engineering sources in `research/living-source-metadata.csv`.
- Adapter-only pollution check: passed; A2A remote delegation, statechart transition semantics, and benchmark scoring remain adapter/profile-owned.
- Hidden chain-of-thought policy: passed; only observable trace events may be represented.
- Phase 1C ontology boundary review: passed after tightening architecture, mechanism-profile, TrustBoundary, external actor, and statechart wording.

## Consequences

- Core ontology stays smaller than the Phase 0C proposal surface.
- Some useful concepts remain profile or adapter-owned.
- Later implementation will need generated views, not one monolithic schema.
- Review effort shifts from "what fields exist?" to "which profile owns this semantics?"

Generated views are machine projections of the same canonical node/edge information. They are not independent ontology pages, graphs, or editable truth sources.
