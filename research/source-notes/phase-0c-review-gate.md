# Phase 0C Review Gate

Date: 2026-06-30
Status: complete

## Scope

This review gate validates the Phase 0C provisional layer/relation proposal against the synthesis constraints.

Inputs:

- `research/source-registry.csv`
- `research/source-notes/priority-a-deep-read-ledger.md`
- `research/source-notes/phase-0c-synthesis-constraints.md`
- `research/source-notes/phase-0c-provisional-layer-relation-proposal.md`

Non-goals:

- No implementation code.
- No canonical schema.
- No adapter design.
- No final ontology layer stack.
- No final relation graph.

## Review Lanes

| lane | reviewed scope | result |
|---|---|---|
| Protocol/runtime boundary review | `PL-01`, `PL-02`, `PL-03`, `PL-06`, `PR-001` through `PR-006`, `PR-013`, `PR-014` | Accepted with split-candidate changes for actor/security boundaries, capability surfaces, invocation families, local subagent context, orchestration/delegation, and statechart profile status. |
| Mechanism/orchestration review | `PL-04`, `PL-05`, `PL-06`, `PR-006` through `PR-013`, `PR-021` | Accepted with stricter observable-plan, memory/context, task-vs-execution, trace-vs-eval, and conditional multi-agent boundaries. |
| Evaluation/security/validation/ontology review | `PL-00`, `PL-07`, `PL-08`, `PL-09`, `PR-015` through `PR-020`, `BD-*`, `DQ-*` | Accepted with adapter-only eval status, split-candidate safety/validation statuses, added SHACL/ShEx evidence, and expanded evaluation pressure question. |

## Accepted Review Decisions

| id | decision | reason | constraints | source ids |
|---|---|---|---|---|
| RG-001 | Mark `PL-01` as `split-candidate`. | Actor/visibility taxonomy and protocol/security boundary modeling should not be collapsed. | SC-PROTO-003, SC-PROTO-004, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-proto-mcp-spec`, `eng-proto-mcp-auth`, `eng-proto-oauth-rfc8414`, `eng-proto-oauth-rfc8707`, `eng-proto-oauth-rfc9728`, `lit-agent-msb` |
| RG-002 | Mark `PL-02` and `PR-001` as `split-candidate`. | MCP capability/version/cache/subscription metadata, runtime tool descriptors, and generated schema views have different semantics. | SC-PROTO-002, SC-RUNTIME-001, SC-VAL-002 | `eng-proto-mcp-changelog`, `eng-proto-mcp-2025-spec`, `eng-proto-mcp-spec`, `eng-fw-openai-tools`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| RG-003 | Mark `PL-04` as `split-candidate`. | Planning, execution, observation, validation, and recovery are useful as a review bundle but should not become one schema layer. | SC-MECH-001, SC-MECH-003, SC-MECH-004 | `lit-mech-deepplanning`, `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-etom`, `eng-proto-mcp-spec` |
| RG-004 | Mark `PL-06` as `split-candidate` and add A2A evidence. | Local runtime coordination and remote A2A delegation differ by ownership, visibility, trust, and protocol boundary. | SC-PROTO-001, SC-PROTO-003, SC-RUNTIME-002, SC-MECH-005 | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example`, `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-agent-paramanager` |
| RG-005 | Mark `PL-08` as `split-candidate`. | Threat modeling, authorization context, guardrails, policy checks, safety decisions, and propagation paths can have different lifecycles. | SC-PROTO-004, SC-RUNTIME-004, SC-SEC-001, SC-SEC-002, SC-SEC-003 | `lit-agent-asb`, `lit-agent-safeagent`, `lit-agent-guardagent`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-fw-openai-guardrails` |
| RG-006 | Keep `PL-09` as `split-candidate` and add SHACL/ShEx evidence. | Structural validation, runtime validator profiles, OWL axioms, SHACL shapes, and ShEx shapes are overlapping but non-equivalent. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-val-shacl`, `lit-val-shacl-af`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey` |
| RG-007 | Mark `PR-002` as `split-candidate`. | Tool calls, resource reads/subscriptions, prompt retrieval, and API calls should not be treated as identical invocation operations. | SC-PROTO-001, SC-PROTO-002, SC-RUNTIME-002, SC-MECH-004 | `eng-proto-mcp-spec`, `eng-proto-mcp-changelog`, `eng-fw-openai-tools`, `lit-agent-tooltree`, `lit-agent-etom` |
| RG-008 | Mark `PR-006` as `split-candidate`. | Task assignment, context provisioning, and visibility scoping are distinct, and local subagents must stay distinct from opaque remote agents. | SC-RUNTIME-002, SC-PROTO-003, SC-MECH-002, SC-MECH-005 | `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-mech-compass` |
| RG-009 | Keep `PR-007` provisional only with an observable-plan boundary. | Plan representation must mean an observable plan artifact, summary, constraint set, or trace event, not hidden chain-of-thought. | SC-MECH-001, SC-MECH-003, SC-MECH-004 | `lit-mech-deepplanning`, `lit-mech-compass`, `lit-agent-orchestrationbench`, `lit-bench-agencybench` |
| RG-010 | Mark `PR-010` as `split-candidate`. | Core execution observations should not absorb benchmark-specific artifact/error/state scoring categories. | SC-MECH-001, SC-MECH-004, SC-EVAL-001 | `lit-agent-etom`, `lit-agent-tooltree`, `eng-bench-appworld`, `lit-bench-terminal`, `eng-bench-swebench-site` |
| RG-011 | Mark `PR-011` as `split-candidate` and keep summarization in `PR-012`. | Memory store, retrieve, update, discard, and summarize operations should remain comparable but separable. | SC-MECH-001, SC-MECH-002 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` |
| RG-012 | Demote `PR-013` to `adapter-only-candidate`. | Statechart transitions are strong profile evidence but not yet a generic runtime primitive across frameworks. | SC-MECH-006, SC-RUNTIME-003 | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-scxml` |
| RG-013 | Mark `PR-015` as `split-candidate`. | JSON Schema structural validation and generated Zod/Pydantic profile views should not be treated as round-trip equivalent. | SC-VAL-001, SC-VAL-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `eng-val-zod-release-430` |
| RG-014 | Mark `PR-016` as `split-candidate`. | OWL axioms, SHACL shapes, and ShEx shapes have different semantic and validation roles. | SC-VAL-001, SC-ONT-002 | `lit-val-shacl`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey`, `lit-val-shacl-af` |
| RG-015 | Keep `PL-07` and `PR-017` as `adapter-only-candidate`. | Benchmark/eval axes are useful metadata but should not yet become core ontology classes or relations. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-tau2`, `eng-bench-appworld`, `lit-bench-terminal`, `lit-bench-agencybench` |
| RG-016 | Mark `PR-018` as `split-candidate`. | Runtime checks, executable policies, pre-commit verification, and generated safety stress tests are distinct guardrail modes. | SC-RUNTIME-004, SC-SEC-001, SC-SEC-002 | `lit-agent-guardagent`, `lit-agent-safeagent`, `eng-fw-openai-guardrails`, `lit-agent-asb` |
| RG-017 | Mark `PR-019` as `split-candidate`. | Trust-boundary modeling must remain unresolved until standalone-edge vs relation-attribute semantics are decided. | SC-PROTO-004, SC-SEC-001, SC-SEC-003 | `lit-agent-asb`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-proto-a2a-docs`, `eng-proto-mcp-spec` |
| RG-018 | Expand `DQ-001` with `SC-EVAL-002`. | Evaluation ontology status depends on resource and interaction-pressure axes, not only benchmark heterogeneity. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-appworld`, `eng-bench-tau2`, `lit-bench-terminal`, `lit-bench-agencybench` |

## No-Change Decisions

| id | decision | reason | constraints | source ids |
|---|---|---|---|---|
| RG-NC-001 | Keep `PR-003`, `PR-004`, and `PR-005` provisional. | Remote delegation, handoff, and agents-as-tools remain distinct enough for proposal review, provided trust-boundary semantics stay external. | SC-PROTO-001, SC-PROTO-003, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `lit-agent-paramanager`, `lit-agent-msb` |
| RG-NC-002 | Keep `PR-008` and `PR-009` provisional. | Capability selection and argument construction already preserve planning-vs-execution separation. | SC-MECH-004, SC-PROTO-002, SC-VAL-002 | `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `eng-proto-mcp-spec`, `eng-proto-mcp-changelog`, `lit-agent-etom`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| RG-NC-003 | Keep `PR-014`, `PR-020`, and `PR-021` provisional. | Session checkpoints, provenance, and observable trace events remain useful without forcing schema finalization. | SC-RUNTIME-003, SC-RUNTIME-004, SC-ONT-001, SC-VAL-001, SC-MECH-001 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-openai-python-docs`, `lit-ont-llm-oe-slr`, `lit-ont-kg-survey`, `lit-val-jsonschema-ietf`, `lit-mech-compass`, `lit-state-stateflow`, `eng-fw-openai-tracing`, `eng-fw-openai-guardrails` |

## Gate Outcome

Phase 0C passes the review gate with all proposals still provisional.

Excluded source note: `eng-proto-mcp-2026-rc` is future-dated relative to 2026-06-30 and is not counted as Phase 0C evidence.

Accepted conditions:

- Layer and relation proposals now carry explicit rollback/split/adapter-only status where evidence requires caution.
- MCP vs A2A, handoff vs agent-as-tool, local subagent vs remote agent, structural validation vs semantic constraints, benchmark metadata vs ontology core, and observable trace vs hidden chain-of-thought boundaries are preserved.
- Multi-agent orchestration remains conditional on task structure, verification, worker capability, and cost.
- No canonical schema, adapter, or implementation code was created.

Remaining blockers before canonical schema work:

- Resolve whether `PL-07` stays adapter-only.
- Resolve whether statecharts are core lifecycle primitives or profile-specific.
- Split memory/context operations if needed.
- Decide whether trust boundaries are standalone relations or attributes on cross-boundary relations.
- Decide whether structural validation starts from JSON Schema core, neutral ontology views, or generated runtime profiles.
