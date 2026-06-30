# PL/PR Core Profile Adapter Decision Matrix

Date: 2026-06-30
Status: accepted for RFC drafting

## Scope

This matrix converts the Phase 0C provisional layer/relation proposals into post-Phase-0 design dispositions.

Disposition values:

- `core`: belongs in the minimal ontology/schema contract.
- `core+profile`: has a minimal core anchor plus profile-specific detail.
- `profile`: belongs in an optional profile over the core.
- `adapter`: belongs in framework/protocol/benchmark/tooling adapters.
- `defer`: keep as unresolved design work.

## Layer Decisions

| id | disposition | decision | RFC owner | rationale | constraints | source ids |
|---|---|---|---|---|---|---|
| PL-00 | core | Evidence/provenance is core. | RFC 0001, RFC 0002 | Every claim, schema view, and adapter mapping needs source-backed provenance and review status. | SC-ONT-001, SC-VAL-001 | `lit-ont-llm-oe-slr`, `lit-ont-neon-gpt`, `lit-ont-kg-survey`, `lit-val-jsonschema-ietf` |
| PL-01 | core+profile | Actor taxonomy is core; protocol/security boundary details are profile-specific. | RFC 0001, RFC 0003 | Local agents, remote agents, humans, tools, and services need identity boundaries, but authorization/resource metadata differs by protocol. | SC-PROTO-001, SC-PROTO-003, SC-PROTO-004, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-proto-mcp-spec`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026`, `lit-agent-msb` |
| PL-02 | profile | Capability/resource surfaces are profile-level with protocol/runtime adapter mappings. | RFC 0003 | MCP discovery/version/cache/subscription, runtime tools, API operations, and schema views should not be flattened into one core layer. | SC-PROTO-002, SC-RUNTIME-001, SC-VAL-002 | `eng-proto-mcp-changelog`, `eng-proto-mcp-2025-spec`, `eng-proto-mcp-spec`, `eng-fw-openai-tools`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| PL-03 | core+profile | Runtime sessions/checkpoints are core anchors; framework specifics are profiles. | RFC 0001, RFC 0003 | Durable execution, sessions, checkpoints, and interrupts are runtime capabilities independent of reasoning prompts. | SC-RUNTIME-003, SC-RUNTIME-004, SC-MECH-006 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-openai-python-docs`, `eng-state-xstate-docs`, `eng-state-scxml` |
| PL-04 | core+profile | Goal/task/action/observation anchors are core; planning/execution/recovery detail is profile-specific. | RFC 0001, RFC 0002 | Observable task and action traces are needed, but planning, argument construction, execution, observation, and recovery remain separable. | SC-MECH-001, SC-MECH-003, SC-MECH-004 | `lit-mech-deepplanning`, `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-etom`, `eng-proto-mcp-spec` |
| PL-05 | profile | Memory/context is a profile family, not a single core field. | RFC 0001, RFC 0002 | Retrieval, long-term memory, working context, summaries, update/discard actions, and budget management need separate semantics. | SC-MECH-001, SC-MECH-002, SC-MECH-003 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` |
| PL-06 | profile | Orchestration/delegation is a coordination profile. | RFC 0001, RFC 0003 | Multi-agent orchestration is conditional and should not become default core architecture. | SC-RUNTIME-002, SC-MECH-005, SC-PROTO-003 | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-agent-paramanager` |
| PL-07 | adapter | Evaluation/benchmark layer remains adapter-facing. | RFC 0003 | Benchmark axes are too heterogeneous to become core ontology categories. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-osworld-v2`, `eng-bench-tau2`, `eng-bench-tau2-verified`, `eng-bench-appworld`, `lit-bench-terminal`, `lit-bench-agencybench` |
| PL-08 | core+profile | Trust boundary is core; threat models, guardrails, and policies are profiles. | RFC 0001, RFC 0002, RFC 0003 | Cross-boundary propagation must be auditable, while guardrail modes and threat models differ operationally. | SC-PROTO-004, SC-RUNTIME-004, SC-SEC-001, SC-SEC-002, SC-SEC-003 | `lit-agent-asb`, `lit-agent-safeagent`, `lit-agent-guardagent`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026`, `eng-fw-openai-guardrails` |
| PL-09 | core+profile | JSON Schema structural contract is core; OWL/SHACL/ShEx semantic constraints are profiles. | RFC 0002 | Structural validation and semantic graph constraints overlap but are not equivalent. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-val-shacl`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey` |

## Relation Decisions

| id | disposition | decision | RFC owner | rationale | constraints | source ids |
|---|---|---|---|---|---|---|
| PR-001 | profile | Capability exposure is profile-level. | RFC 0003 | Protocol discovery and runtime tool descriptors differ. | SC-PROTO-002, SC-RUNTIME-001, SC-VAL-002 | `eng-proto-mcp-changelog`, `eng-proto-mcp-2025-spec`, `eng-proto-mcp-spec`, `eng-fw-openai-tools` |
| PR-002 | profile | Tool/resource/API invocation splits by operation family. | RFC 0003 | MCP tool calls, resource reads/subscriptions, prompt retrieval, and API calls are not identical. | SC-PROTO-001, SC-PROTO-002, SC-RUNTIME-002, SC-MECH-004 | `eng-proto-mcp-spec`, `eng-proto-mcp-changelog`, `eng-fw-openai-tools`, `lit-agent-tooltree`, `lit-agent-etom` |
| PR-003 | adapter | Remote A2A delegation is protocol-adapter-owned. | RFC 0003 | Remote agents are opaque and cross protocol/security boundaries. | SC-PROTO-001, SC-PROTO-003, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example`, `lit-agent-msb` |
| PR-004 | profile | Handoff is a coordination profile relation. | RFC 0003 | Ownership transfer differs from tool calls and agents-as-tools. | SC-RUNTIME-002, SC-SEC-003 | `eng-fw-openai-handoffs`, `eng-fw-openai-python-docs`, `lit-agent-asb` |
| PR-005 | profile | Agent-as-tool is a coordination profile relation. | RFC 0003 | Caller retains orchestration ownership, unlike handoff. | SC-RUNTIME-002, SC-MECH-005 | `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `lit-agent-paramanager` |
| PR-006 | profile | Subagent assignment/context is a profile relation family. | RFC 0003 | Task assignment, context provisioning, and visibility scoping need separate semantics. | SC-RUNTIME-002, SC-PROTO-003, SC-MECH-002, SC-MECH-005 | `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-mech-compass` |
| PR-007 | core | Observable plan-to-goal relation is core. | RFC 0001, RFC 0002 | Core can represent observable plan artifacts without storing hidden reasoning. | SC-MECH-001, SC-MECH-003, SC-MECH-004 | `lit-mech-deepplanning`, `lit-mech-compass`, `lit-agent-orchestrationbench`, `lit-bench-agencybench` |
| PR-008 | profile | Capability selection is a planning/tool-use profile relation. | RFC 0003 | Selection belongs between planning and invocation, not core identity. | SC-MECH-004, SC-PROTO-002 | `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `eng-proto-mcp-spec`, `eng-proto-mcp-changelog` |
| PR-009 | profile | Argument construction is a tool-use/schema profile relation. | RFC 0002, RFC 0003 | Payload construction depends on capability schema views and validators. | SC-MECH-004, SC-VAL-002 | `lit-agent-etom`, `lit-agent-tooltree`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| PR-010 | core+profile | Execution observation is core; benchmark scoring artifacts are adapter/profile. | RFC 0001, RFC 0002, RFC 0003 | Observations are core trace evidence, but benchmark categories stay outside core. | SC-MECH-001, SC-MECH-004, SC-EVAL-001 | `lit-agent-etom`, `lit-agent-tooltree`, `eng-bench-appworld`, `lit-bench-terminal`, `eng-bench-swebench-site` |
| PR-011 | profile | Memory updates are profile operation families. | RFC 0002 | Store/retrieve/update/discard/summarize should not collapse into one core edge. | SC-MECH-001, SC-MECH-002 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` |
| PR-012 | profile | Context summarization is a context-management profile relation. | RFC 0002 | Summaries are observable artifacts, not hidden CoT. | SC-MECH-001, SC-MECH-002, SC-MECH-003 | `lit-mech-compass`, `lit-mech-deepplanning`, `eng-fw-deepagents-js-docs` |
| PR-013 | profile | Statechart transitions are profile-owned; XState/SCXML field mappings remain adapter-owned. | RFC 0003 | Statecharts provide a lifecycle/control-flow profile over runtime/session state, but they are not universal runtime core. | SC-MECH-006, SC-RUNTIME-003 | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-scxml` |
| PR-014 | core+profile | Session checkpoints are core anchors with runtime profiles. | RFC 0001, RFC 0003 | Resumable state is a runtime invariant, but implementation fields differ. | SC-RUNTIME-003, SC-RUNTIME-004 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-openai-python-docs` |
| PR-015 | core+profile | Structural validation is core; generated validator profiles are profiles. | RFC 0002 | JSON Schema is the structural baseline; Zod/Pydantic views are generated profiles. | SC-VAL-001, SC-VAL-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| PR-016 | profile | Semantic graph constraints are ontology/validation profiles. | RFC 0002 | OWL axioms, SHACL shapes, and ShEx shapes need separate profile semantics. | SC-VAL-001, SC-ONT-002 | `lit-val-shacl`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey`, `lit-val-shacl-af` |
| PR-017 | adapter | Benchmark evaluation relation is adapter-owned. | RFC 0003 | Benchmark-specific scoring and pressure axes should not pollute core. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-osworld-v2`, `eng-bench-tau2`, `eng-bench-tau2-verified`, `eng-bench-appworld`, `lit-bench-terminal` |
| PR-018 | profile | Guardrail enforcement is security/runtime profile-owned. | RFC 0002, RFC 0003 | Runtime checks, policies, verification, and safety stress tests differ. | SC-RUNTIME-004, SC-SEC-001, SC-SEC-002 | `lit-agent-guardagent`, `lit-agent-safeagent`, `eng-fw-openai-guardrails`, `lit-agent-asb` |
| PR-019 | core+profile | Trust-boundary crossing is core with profile attributes. | RFC 0001, RFC 0002, RFC 0003 | Standalone trust boundaries support propagation review; relation attributes keep implementation ergonomic. | SC-PROTO-004, SC-SEC-001, SC-SEC-003 | `lit-agent-asb`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-security-mcp-nsa-2026`, `eng-proto-a2a-docs`, `eng-proto-mcp-spec` |
| PR-020 | core | Source provenance relation is core. | RFC 0001, RFC 0002 | Every design claim must remain auditable against source evidence. | SC-ONT-001, SC-VAL-001 | `lit-ont-llm-oe-slr`, `lit-ont-kg-survey`, `lit-val-jsonschema-ietf` |
| PR-021 | core | Observable trace events are core. | RFC 0001, RFC 0002 | Auditable trace events are required without storing hidden chain-of-thought. | SC-MECH-001, SC-RUNTIME-004 | `lit-mech-compass`, `lit-state-stateflow`, `eng-fw-openai-tracing`, `eng-fw-openai-guardrails` |

## Decision Summary

| disposition | count |
|---|---:|
| `core` | 4 |
| `core+profile` | 9 |
| `profile` | 15 |
| `adapter` | 3 |

## RFC Handoff

- RFC 0001 owns ontology layer/core-profile-adapter boundaries.
- RFC 0002 owns schema contracts, validation baseline, provenance, trace, and security field constraints.
- RFC 0003 owns statechart, protocol, runtime, benchmark, and framework adapter mapping.
