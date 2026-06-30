# Phase 0C Synthesis Constraints

Date: 2026-06-30
Status: complete Phase 0C synthesis artifact
Inputs:

- `research/source-registry.csv`
- `research/priority-a-source-queue.csv`
- `research/source-notes/priority-a-deep-read-ledger.md`

## Capability

Phase 0C turns the Phase 0 source registry and priority A deep-read ledger into evidence-backed constraints for later ontology, protocol, runtime, benchmark, validation, and security synthesis.

This artifact is not a canonical schema. It is the constraint layer that must be satisfied before proposing layers, relations, canonical fields, adapters, or implementation code.

## Fixed Rules

- Every synthesis claim must cite source IDs from `research/source-registry.csv`.
- Hidden chain-of-thought is not a required representation target.
- Protocol semantics, runtime/framework semantics, benchmark axes, validation systems, and security boundaries must remain separate until compared explicitly.
- Benchmark evidence can shape evaluation metadata, but must not be promoted directly into ontology categories.
- Living docs, repos, and specs require version/date metadata before field-level schema claims.

## Constraint Index

| id | family | constraint | evidence source ids | implication for Phase 0C |
|---|---|---|---|---|
| SC-PROTO-001 | protocol | Separate agent-to-tool/context protocols from agent-to-agent interoperability protocols. | `eng-proto-mcp-changelog`, `eng-proto-a2a-docs`, `eng-proto-mcp-spec`, `eng-proto-a2a-spec` | Do not collapse MCP tools/resources/prompts and A2A remote-agent tasks/messages into one relation type. |
| SC-PROTO-002 | protocol | Protocol version, discovery, capabilities, and cache/subscription semantics are first-class protocol metadata. | `eng-proto-mcp-changelog`, `eng-proto-mcp-2025-spec`, `eng-proto-mcp-spec` | Any later protocol model needs versioned capability surfaces before field-level contracts. |
| SC-PROTO-003 | protocol | Remote agents may be opaque and should not be modeled as sharing internal memory, tool inventory, or proprietary logic by default. | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example` | Later agent-to-agent relations need boundary/visibility fields distinct from local subagent structures. |
| SC-PROTO-004 | protocol | MCP/A2A security cannot be represented only as generic auth; tool metadata, remote messages, and task lifecycles carry trust boundaries. | `eng-proto-mcp-auth`, `eng-proto-oauth-rfc8414`, `eng-proto-oauth-rfc8707`, `eng-proto-oauth-rfc9728`, `lit-agent-msb` | Security model must include protocol resource, metadata, and delegation boundaries. |
| SC-RUNTIME-001 | runtime | Agent runtime primitives recur across frameworks but are not semantically identical. | `eng-fw-openai-python-docs`, `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-crewai-docs` | Phase 0C should define framework-neutral concepts only after mapping each framework's native terms. |
| SC-RUNTIME-002 | runtime | Handoffs, agents-as-tools, remote A2A agents, MCP tools, and subagents are different coordination mechanisms. | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-proto-a2a-docs`, `eng-proto-mcp-spec`, `eng-fw-deepagents-js-docs` | Later relations must distinguish ownership transfer, callable encapsulation, remote delegation, and tool invocation. |
| SC-RUNTIME-003 | runtime | Durable execution, persistence, sessions, checkpoints, interrupts, and human-in-the-loop are runtime capabilities, not prompt-only features. | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-deepagents-js-docs`, `eng-fw-openai-python-docs` | Runtime capability mapping must be separate from model reasoning mechanism mapping. |
| SC-RUNTIME-004 | runtime | Tracing, guardrails, validation gates, and observability are operational surfaces that affect schema and security boundaries. | `eng-fw-openai-tracing`, `eng-fw-openai-guardrails`, `eng-fw-crewai-docs`, `eng-fw-langgraph-docs` | Phase 0C needs observability/guardrail constraints before finalizing trace or run schemas. |
| SC-MECH-001 | mechanism | Observable reasoning support should use actions, observations, tool calls, summaries, plans, state updates, and safety decisions, not hidden chain-of-thought. | `lit-mech-compass`, `lit-state-stateflow`, `lit-agent-tooltree`, `lit-agent-etom` | Trace/schema proposals must avoid hidden CoT requirements. |
| SC-MECH-002 | mechanism | Memory is a family of mechanisms, not one field. | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` | Later memory model must compare working context, long-term memory, summaries, retrieval, update/discard actions, and policy-learned memory. |
| SC-MECH-003 | mechanism | Long-horizon planning requires global constraints, active information gathering, context control, and consistency checking. | `lit-mech-deepplanning`, `lit-mech-compass`, `lit-bench-agencybench` | Planning concepts need horizon, constraint, resource, and feedback dimensions. |
| SC-MECH-004 | mechanism | Tool planning and tool execution are distinct; benchmarks increasingly separate planning quality from execution quality. | `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-etom`, `eng-proto-mcp-spec` | Tool-use model should separate selection, argument construction, execution, observation, validation, and recovery. |
| SC-MECH-005 | mechanism | Multi-agent orchestration benefits are conditional on task structure, verification, worker capabilities, and cost. | `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-agent-paramanager`, `eng-fw-deepagents-js-docs` | Phase 0C must not treat multi-agent orchestration as universally superior to single-agent-plus-tools. |
| SC-MECH-006 | mechanism | State-machine workflows separate process grounding from subtask solving and provide testing/visualization hooks. | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-xstate-graph`, `eng-state-scxml` | Statechart concepts should be candidates for lifecycle/control-flow modeling, not necessarily the whole agent ontology. |
| SC-EVAL-001 | benchmark | Benchmarks differ by environment realism, scoring, artifact type, interaction horizon, and tool/API surface. | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-tau2`, `eng-bench-appworld`, `lit-bench-terminal`, `lit-bench-agencybench` | Evaluation metadata needs benchmark-specific axes instead of one generic score field. |
| SC-EVAL-002 | benchmark | Long-horizon benchmarks expose token, time, tool-call, sandbox, user-simulation, and feedback-loop pressure. | `lit-bench-agencybench`, `eng-bench-osworld-site`, `eng-bench-tau2`, `lit-bench-terminal` | Later run/eval schema should include resource and interaction-pressure metadata. |
| SC-EVAL-003 | benchmark | Software, terminal, browser, desktop, app/API, and customer-service benchmarks stress different agent capabilities. | `eng-bench-swebench-site`, `lit-bench-terminal`, `eng-bench-osworld-site`, `eng-bench-appworld`, `eng-bench-tau2` | Benchmark mapping should remain an adapter/eval surface until normalized. |
| SC-SEC-001 | security | Agent security is structural across prompts, tools, memory, routing, context, actions, and protocol metadata. | `lit-agent-asb`, `lit-agent-safeagent`, `lit-agent-etom`, `lit-agent-msb` | Threat model must precede any implementation-facing schema or protocol adapter work. |
| SC-SEC-002 | security | Guardrails can be runtime checks, executable policies, pre-commit verification, or generated safety stress tests. | `lit-agent-guardagent`, `lit-agent-safeagent`, `eng-fw-openai-guardrails` | Guardrail representation should include decision point, enforcement mode, and evidence/feedback. |
| SC-SEC-003 | security | Multi-agent and MCP ecosystems add cross-server, cross-agent, and message-propagation attack surfaces. | `lit-agent-asb`, `lit-agent-etom`, `lit-agent-msb`, `eng-proto-a2a-docs`, `eng-proto-mcp-spec` | Later relation modeling needs trust-boundary and propagation metadata. |
| SC-VAL-001 | validation | Structural validation and semantic validation are overlapping but non-equivalent. | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `lit-val-shacl`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey` | Keep JSON Schema/Pydantic/Zod validation separate from OWL/SHACL/ShEx semantic constraints. |
| SC-VAL-002 | validation | Runtime validator conversion to JSON Schema can be lossy or mode-dependent. | `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `eng-val-zod-release-430` | Canonical schema design cannot assume round-trip equivalence between Zod, Pydantic, OpenAPI, and JSON Schema. |
| SC-ONT-001 | ontology | LLM-assisted ontology engineering still needs human review, reproducible protocols, and standardized evaluation. | `lit-ont-llm-oe-slr`, `lit-ont-neon-gpt`, `lit-ont-kg-survey` | Ontology synthesis must preserve review status, provenance, and competency-question evidence. |
| SC-ONT-002 | ontology | OWL and SHACL serve complementary roles and require coordinated maintenance. | `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey`, `lit-val-shacl`, `lit-val-shacl-af` | Later ontology artifacts should distinguish class/property axioms from data-quality constraints. |

## Implementation Contract For Later Phases

Phase 0C synthesis is ready to proceed into proposal drafting only when each proposed layer/relation/schema field has:

- At least one constraint ID from this document.
- At least two supporting source IDs when the claim is central.
- A decision on whether the claim belongs to ontology core, protocol mapping, runtime mapping, benchmark/eval mapping, validation mapping, or security model.
- A clear non-goal if the claim is intentionally deferred.

## Excluded Living Sources

- `eng-proto-mcp-2026-rc` is future-dated relative to 2026-06-30 and is excluded from Phase 0C evidence until its publication date can be verified.

## Non-Goals

- No runtime code.
- No canonical schema files.
- No adapters.
- No front-end or visualization work.
- No final ontology layers or relation graph yet.

## Open Questions

| id | question | blocked area |
|---|---|---|
| OQ-0C-001 | Should Phase 0C define one minimal core ontology plus adapters, or a richer ontology with profile-specific projections? | ontology shape |
| OQ-0C-002 | What is the minimum observable trace model that supports evaluation and debugging without hidden CoT? | trace/safety |
| OQ-0C-003 | Should benchmark axes be represented as first-class evaluation entities or external metadata attached to runs? | benchmark/eval |
| OQ-0C-004 | Where should protocol versioning and capability discovery live: protocol adapter layer, core ontology metadata, or both? | protocol |
| OQ-0C-005 | Which validation stack is canonical for implementation: JSON Schema first, Zod/Pydantic first, or generated views from a neutral schema? | validation |

## Handoff

Phase 0C completion artifacts:

- `research/source-notes/phase-0c-provisional-layer-relation-proposal.md`
- `research/source-notes/phase-0c-review-gate.md`
- `research/source-notes/phase-0c-completion.md`
- `research/source-notes/phase-0c-final-closure-audit.md`

Next post-Phase-0C step:

1. Resolve deferred questions `DQ-001` through `DQ-005` with targeted source reads only.
2. Produce a core/profile/adapter decision matrix for all `PL-*` and `PR-*` IDs.
3. Only after that matrix is reviewed, start canonical schema proposals.
