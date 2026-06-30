# Phase 0C Provisional Layer / Relation Proposal

Date: 2026-06-30
Status: provisional Phase 0C synthesis proposal

## Scope

This artifact starts Phase 0C synthesis step 2: turn existing `SC-*` synthesis constraints into reversible layer and relation candidates.

Inputs:

- `research/source-registry.csv`
- `research/source-notes/priority-a-deep-read-ledger.md`
- `research/source-notes/phase-0c-synthesis-constraints.md`

Non-goals:

- No implementation code.
- No canonical schema files.
- No adapters.
- No final ontology layer stack.
- No final relation graph.
- No hidden chain-of-thought representation requirement.

## Reversibility Contract

All layer and relation proposals below are provisional. A later phase may delete, split, merge, rename, or demote any proposal if the evidence review changes.

Rollback rules:

- Rollback does not delete source evidence. It only changes the proposal status.
- Every proposal must keep at least one `SC-*` constraint ID and at least two registry source IDs unless it is explicitly marked weak.
- If a proposal crosses protocol, runtime, mechanism, benchmark, validation, or security boundaries, rollback should prefer splitting the proposal before deleting it.
- If an implementation-facing field would be required to make the proposal useful, the proposal stays deferred until post-Phase-0C.
- If source semantics conflict, preserve the conflict as a decision record instead of forcing normalization.

Proposal status values:

- `provisional`: candidate is evidence-backed but not accepted.
- `split-candidate`: candidate likely needs subdivision before schema work.
- `adapter-only-candidate`: candidate may belong outside ontology core.
- `defer`: evidence exists, but Phase 0C should not model it yet.
- `rollback`: proposal has been withdrawn or replaced.

## Provisional Layer Proposal

| id | status | provisional layer | intent | includes | excludes / rollback trigger | constraints | source ids |
|---|---|---|---|---|---|---|---|
| PL-00 | provisional | Evidence and provenance layer | Preserve why each future ontology or schema claim exists. | source ID, evidence family, review status, decision note, competency-question trace | Roll back if provenance becomes implicit metadata; keep source IDs even if layer is demoted. | SC-ONT-001, SC-VAL-001 | `lit-ont-llm-oe-slr`, `lit-ont-neon-gpt`, `lit-ont-kg-survey`, `lit-val-jsonschema-ietf` |
| PL-01 | split-candidate | Actor and boundary layer | Separate actor/visibility taxonomy from trust/security boundary modeling before relation normalization. | agent, human, remote agent endpoint, local subagent, tool server, protocol boundary, visibility boundary, authorization/resource boundary | Split actor taxonomy from security/trust boundary modeling if authorization semantics require protocol-specific treatment. | SC-PROTO-001, SC-PROTO-003, SC-PROTO-004, SC-RUNTIME-001, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-proto-mcp-spec`, `eng-proto-mcp-auth`, `eng-proto-oauth-rfc8414`, `eng-proto-oauth-rfc8707`, `eng-proto-oauth-rfc9728`, `eng-fw-deepagents-js-docs`, `lit-agent-msb` |
| PL-02 | split-candidate | Capability and resource surface layer | Separate protocol capability metadata from runtime adapter capability surfaces before modeling concrete invocations. | MCP tool/resource/prompt metadata, capability version, discovery, cache/subscription metadata, runtime tool descriptor, generated schema view as adapter evidence | Split MCP protocol capability surfaces from runtime/API/schema adapter surfaces; do not use validator-conversion evidence as capability-exposure evidence. | SC-PROTO-002, SC-RUNTIME-001, SC-VAL-002 | `eng-proto-mcp-changelog`, `eng-proto-mcp-2025-spec`, `eng-proto-mcp-spec`, `eng-fw-openai-tools`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| PL-03 | provisional | Runtime state and session layer | Keep durable execution and session lifecycle concepts separate from reasoning mechanisms. | session, checkpoint, persistence, interrupt, human approval point, run lifecycle, trace anchor | Split if statecharts become the lifecycle core rather than one modeling option. | SC-RUNTIME-003, SC-RUNTIME-004, SC-MECH-006 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-openai-python-docs`, `eng-state-xstate-docs`, `eng-state-scxml` |
| PL-04 | split-candidate | Task, plan, and execution layer | Review-bundle observable task decomposition, planning, action selection, execution, observation, and recovery without collapsing them into one schema layer. | goal, task, observable plan artifact, step, action, argument construction, execution result, observation, recovery action | Split before canonicalization if planning, execution, observation, and recovery require separate lifecycles or trace semantics. | SC-MECH-001, SC-MECH-003, SC-MECH-004 | `lit-mech-deepplanning`, `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-etom`, `eng-proto-mcp-spec` |
| PL-05 | split-candidate | Memory and context layer | Treat memory and context as a family of mechanisms rather than one field. | working context, retrieved evidence, summary, long-term memory, memory update, discard action, context budget | Split into memory, retrieval, and context-management layers if the terms become overloaded. | SC-MECH-001, SC-MECH-002, SC-MECH-003 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` |
| PL-06 | split-candidate | Orchestration and delegation layer | Distinguish coordination forms before selecting relation names, while preventing multi-agent orchestration from becoming the default architecture. | handoff, agents-as-tools, remote delegation, local subagent, worker pool, orchestration policy, parallel decomposition, task-structure/cost/verification condition | Split into local runtime coordination and remote A2A delegation if visibility, ownership, and trust boundaries diverge. | SC-RUNTIME-002, SC-MECH-005, SC-PROTO-003 | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example`, `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-agent-paramanager` |
| PL-07 | adapter-only-candidate | Evaluation and benchmark layer | Keep benchmark axes as evaluation metadata until normalization is justified. | benchmark, environment, scoring mode, artifact type, horizon, resource pressure, user simulation, feedback loop | Roll back to adapter-only if benchmark categories start leaking into core ontology classes. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-tau2`, `eng-bench-appworld`, `lit-bench-terminal`, `lit-bench-agencybench` |
| PL-08 | split-candidate | Safety, security, and policy layer | Represent trust, threat, guardrail, and policy boundaries across prompts, tools, memory, routing, context, and protocols without treating them as one lifecycle. | threat surface, trust boundary, guardrail, policy check, safety decision, propagation path, authorization context | Split threat modeling, policy enforcement, authorization context, and guardrail evidence if their review or runtime lifecycles diverge. | SC-PROTO-004, SC-RUNTIME-004, SC-SEC-001, SC-SEC-002, SC-SEC-003 | `lit-agent-asb`, `lit-agent-safeagent`, `lit-agent-guardagent`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-fw-openai-guardrails` |
| PL-09 | split-candidate | Validation and semantic constraint layer | Keep structural validation, runtime validator conversion, and semantic graph constraints comparable but distinct. | JSON Schema, Zod/Pydantic schema view, validation mode, SHACL shape, ShEx shape, OWL axiom, data-quality constraint | Split structural schema work, runtime validator profiles, OWL axioms, SHACL shapes, and ShEx shapes if tooling or ownership diverges. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-val-shacl`, `lit-val-shacl-af`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey` |

## Provisional Relation Proposal

| id | status | provisional relation | source node type | target node type | semantics | rollback trigger | constraints | source ids |
|---|---|---|---|---|---|---|---|---|
| PR-001 | split-candidate | exposes_capability_surface | protocol server or runtime adapter | tool/resource/prompt/API capability | A protocol server or runtime adapter advertises discoverable callable or consumable capabilities; protocol metadata and runtime/schema views remain separate until split. | Split MCP discovery/version/cache/subscription metadata from runtime adapter and generated schema views. | SC-PROTO-002, SC-RUNTIME-001, SC-VAL-002 | `eng-proto-mcp-changelog`, `eng-proto-mcp-2025-spec`, `eng-proto-mcp-spec`, `eng-fw-openai-tools`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| PR-002 | split-candidate | invokes_tool_or_resource | agent/action | tool/resource/prompt/API operation | An agent or action uses a tool-like surface without transferring agent ownership; tool calls, resource reads/subscriptions, prompt retrieval, and API calls are not assumed equivalent. | Split by MCP tool call, resource read/subscribe, prompt retrieval, and API operation call before canonicalization. | SC-PROTO-001, SC-PROTO-002, SC-RUNTIME-002, SC-MECH-004 | `eng-proto-mcp-spec`, `eng-proto-mcp-changelog`, `eng-fw-openai-tools`, `lit-agent-tooltree`, `lit-agent-etom` |
| PR-003 | provisional | delegates_to_remote_agent | agent/runtime | remote A2A agent | A local agent requests work from an opaque remote agent across an interoperability boundary. | Roll back if remote-agent semantics are handled entirely by protocol adapters. | SC-PROTO-001, SC-PROTO-003, SC-RUNTIME-002, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example`, `lit-agent-msb` |
| PR-004 | provisional | hands_off_to_agent | agent | agent | Responsibility or conversation/task ownership moves from one agent to another. | Split if ownership transfer and routing hints need separate relations. | SC-RUNTIME-002, SC-SEC-003 | `eng-fw-openai-handoffs`, `eng-fw-openai-python-docs`, `lit-agent-asb` |
| PR-005 | provisional | calls_agent_as_tool | agent/action | agent-as-tool | An agent is encapsulated as a callable unit while the caller retains orchestration ownership. | Roll back if this is represented as a specialized tool invocation with agent metadata. | SC-RUNTIME-002, SC-MECH-005 | `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `lit-agent-paramanager` |
| PR-006 | split-candidate | assigns_subagent_context | orchestrator agent | local subagent/context | A parent or orchestrator assigns task intent, scope, and possibly isolated context to a local subagent; task assignment and context provisioning may be separate. | Split task assignment from context/visibility scoping before canonicalization; keep local subagents distinct from opaque remote agents. | SC-RUNTIME-002, SC-PROTO-003, SC-MECH-002, SC-MECH-005 | `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-mech-compass` |
| PR-007 | provisional | plans_task_for_goal | observable plan artifact | goal/task | An observable plan artifact, summary, constraint set, or trace event decomposes or orders tasks to satisfy a goal under constraints and feedback. | Roll back if plans require hidden reasoning text or are only benchmark artifacts rather than reusable task concepts. | SC-MECH-001, SC-MECH-003, SC-MECH-004 | `lit-mech-deepplanning`, `lit-mech-compass`, `lit-agent-orchestrationbench`, `lit-bench-agencybench` |
| PR-008 | provisional | selects_capability_for_step | plan step/action | capability surface | A planning or execution step selects a capability before argument construction and invocation. | Split if selection, argument construction, and execution require independent relation families. | SC-MECH-004, SC-PROTO-002 | `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `eng-proto-mcp-spec`, `eng-proto-mcp-changelog` |
| PR-009 | provisional | constructs_arguments_for_invocation | action | invocation payload/schema view | An action prepares inputs for a tool/API/capability invocation. | Roll back if argument construction belongs only in trace events, not ontology relations. | SC-MECH-004, SC-VAL-002 | `lit-agent-etom`, `lit-agent-tooltree`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` |
| PR-010 | split-candidate | observes_execution_result | execution | observation/artifact | An execution produces observable results, artifacts, errors, or state deltas; benchmark-specific artifact scoring remains an eval mapping concern. | Split core observation from benchmark artifact/error/state scoring if eval categories start leaking into core ontology. | SC-MECH-001, SC-MECH-004, SC-EVAL-001 | `lit-agent-etom`, `lit-agent-tooltree`, `eng-bench-appworld`, `lit-bench-terminal`, `eng-bench-swebench-site` |
| PR-011 | split-candidate | updates_memory_from_observation | observation/action | memory/context item | A memory or context mechanism stores, updates, retrieves, or discards information based on observable events; summarization is handled by PR-012 unless later split. | Split into store, retrieve, update, discard, and policy-learned memory actions if mechanism comparison needs finer granularity. | SC-MECH-001, SC-MECH-002 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-openai-python-docs`, `eng-fw-deepagents-js-docs` |
| PR-012 | provisional | summarizes_context_for_stage | context manager | stage/task/session | A context mechanism compresses or selects relevant information for a future stage without requiring hidden CoT. | Roll back if summaries should be modeled as artifacts only. | SC-MECH-001, SC-MECH-002, SC-MECH-003 | `lit-mech-compass`, `lit-mech-deepplanning`, `eng-fw-deepagents-js-docs` |
| PR-013 | adapter-only-candidate | transitions_state_on_event | statechart state | statechart state | A state/event/guard transition advances a state-machine profile over lifecycle or process modeling, not a generic runtime primitive by default. | Keep as statechart profile unless later evidence promotes state-machine transitions into core runtime lifecycle relations. | SC-MECH-006, SC-RUNTIME-003 | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-scxml` |
| PR-014 | provisional | checkpoints_session_state | session/run | checkpoint/persistence record | A runtime records resumable execution state, often with interrupt or human-in-the-loop semantics. | Split if checkpoints, persistence, and approval interrupts become separate lifecycle relations. | SC-RUNTIME-003, SC-RUNTIME-004 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-openai-python-docs` |
| PR-015 | split-candidate | validates_artifact_against_structural_schema | artifact/payload | JSON Schema or generated runtime schema profile | JSON Schema-like structural validation checks shape, type, and field constraints; generated Zod/Pydantic views are adapter/profile evidence, not round-trip-equivalent core schema. | Split JSON Schema structural validation from generated runtime validator profiles before canonical schema work. | SC-VAL-001, SC-VAL-002 | `lit-val-jsonschema-ietf`, `lit-val-jsonschema-spec`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `eng-val-zod-release-430` |
| PR-016 | split-candidate | constrains_graph_with_semantic_shape | ontology graph/data graph | SHACL/ShEx/OWL constraint | Semantic graph constraints and ontology axioms validate or infer meaning beyond structural JSON validation, but OWL axioms, SHACL shapes, and ShEx shapes are not assumed equivalent. | Split into OWL axiom, SHACL shape, and ShEx shape relations before ontology constraint work. | SC-VAL-001, SC-ONT-002 | `lit-val-shacl`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey`, `lit-val-shacl-af` |
| PR-017 | adapter-only-candidate | evaluates_run_on_benchmark | run/session/artifact | benchmark/eval scenario | A run is measured in a benchmark environment with benchmark-specific scoring and pressure axes. | Keep adapter-only if benchmark axes are too heterogeneous for core ontology. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-tau2`, `eng-bench-appworld`, `lit-bench-terminal`, `lit-bench-agencybench` |
| PR-018 | split-candidate | enforces_guardrail_at_decision_point | guardrail/policy | action/tool/response/routing decision | A guardrail or policy constrains a decision point and may record evidence or feedback; runtime checks, executable policies, pre-commit verification, and safety stress-test generation remain distinct. | Split enforcement, checking, verification, and generated stress-test semantics before schema work. | SC-RUNTIME-004, SC-SEC-001, SC-SEC-002 | `lit-agent-guardagent`, `lit-agent-safeagent`, `eng-fw-openai-guardrails`, `lit-agent-asb` |
| PR-019 | split-candidate | crosses_trust_boundary | interaction/message/invocation | trust boundary | An interaction crosses a security or protocol boundary and may propagate tainted content or authority. | Do not finalize until DQ-004 resolves standalone trust-boundary edge vs relation attribute modeling. | SC-PROTO-004, SC-SEC-001, SC-SEC-003 | `lit-agent-asb`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-proto-a2a-docs`, `eng-proto-mcp-spec` |
| PR-020 | provisional | derives_claim_from_source | constraint/proposal/decision | source evidence | A synthesis claim is explicitly derived from registry evidence and remains auditable. | Roll back only if provenance is enforced outside relation modeling; source IDs must remain. | SC-ONT-001, SC-VAL-001 | `lit-ont-llm-oe-slr`, `lit-ont-kg-survey`, `lit-val-jsonschema-ietf` |
| PR-021 | provisional | records_observable_trace_event | run/session | trace event | A runtime records observable trace events such as action summaries, tool calls, state updates, safety decisions, and artifacts without requiring hidden CoT. | Split into trace, observation, and audit-log relations if operational surfaces diverge. | SC-MECH-001, SC-RUNTIME-004 | `lit-mech-compass`, `lit-state-stateflow`, `eng-fw-openai-tracing`, `eng-fw-openai-guardrails` |

## Boundary Decisions To Preserve

Excluded living source: `eng-proto-mcp-2026-rc` is future-dated relative to 2026-06-30 and is not evidence for any provisional layer or relation until publication is verified.

These are not final decisions. They are guardrails for later proposal review.

| id | boundary | preserve because | constraints | source ids |
|---|---|---|---|---|
| BD-001 | MCP tool/resource/prompt surfaces vs A2A remote-agent tasks/messages | The evidence frames these as complementary but different protocol families. | SC-PROTO-001, SC-PROTO-003, SC-RUNTIME-002 | `eng-proto-mcp-spec`, `eng-proto-mcp-changelog`, `eng-proto-a2a-docs`, `eng-proto-a2a-spec` |
| BD-002 | Handoff vs agent-as-tool vs subagent assignment vs remote delegation | The coordination mechanisms differ by ownership, visibility, and runtime boundary. | SC-RUNTIME-002, SC-MECH-005, SC-SEC-003 | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `eng-proto-a2a-docs`, `lit-agent-paramanager` |
| BD-003 | Planning, argument construction, invocation, observation, validation, recovery | Tool-use evidence separates planning quality from execution quality and from post-execution feedback. | SC-MECH-004, SC-MECH-001 | `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-etom`, `eng-proto-mcp-spec` |
| BD-004 | Runtime/session lifecycle vs model reasoning mechanism | Durable execution and state transitions are runtime surfaces, not prompt-only mechanisms. | SC-RUNTIME-003, SC-MECH-006 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `lit-state-stateflow`, `eng-state-xstate-docs` |
| BD-005 | Structural schema validation vs semantic graph constraints | JSON Schema/Zod/Pydantic and OWL/SHACL/ShEx overlap but are not equivalent. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-val-shacl`, `lit-ont-owl-shacl-lessons` |
| BD-006 | Benchmark/eval metadata vs ontology core | Benchmark families stress different capabilities and should not automatically become core classes. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-appworld`, `eng-bench-tau2`, `lit-bench-terminal` |
| BD-007 | Observable trace vs hidden chain-of-thought | Phase 0C needs auditable events without requiring private reasoning text. | SC-MECH-001, SC-RUNTIME-004, SC-SEC-001 | `lit-mech-compass`, `lit-state-stateflow`, `eng-fw-openai-tracing`, `lit-agent-safeagent` |

## Deferred Questions

| id | question | reason for deferral | constraints | source ids |
|---|---|---|---|---|
| DQ-001 | Should `PL-07` remain adapter-only or become a first-class evaluation ontology layer? | Benchmark axes are heterogeneous and may overfit core modeling; resource and interaction-pressure axes are also central. | SC-EVAL-001, SC-EVAL-002, SC-EVAL-003 | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-appworld`, `eng-bench-tau2`, `lit-bench-terminal`, `lit-bench-agencybench` |
| DQ-002 | Should statecharts become core lifecycle primitives or a profile over runtime state? | State-machine evidence is strong but not universal across agent frameworks. | SC-MECH-006, SC-RUNTIME-003 | `lit-state-stateflow`, `eng-state-xstate-docs`, `eng-state-scxml`, `eng-fw-langgraph-docs` |
| DQ-003 | Should memory/context be one layer or split into memory, retrieval, summary, and budget-management layers? | Memory mechanisms have different learning, policy, and storage semantics. | SC-MECH-002, SC-MECH-003 | `lit-agent-agemem`, `lit-mech-compass`, `eng-fw-deepagents-js-docs` |
| DQ-004 | Should trust boundaries be standalone relations or attributes on every cross-boundary relation? | Security evidence suggests propagation paths matter, but schema ergonomics are unknown. | SC-PROTO-004, SC-SEC-001, SC-SEC-003 | `lit-agent-asb`, `lit-agent-msb`, `eng-proto-mcp-auth`, `eng-proto-a2a-docs` |
| DQ-005 | Should validation start from JSON Schema, a neutral ontology view, or generated Zod/Pydantic profiles? | Validator conversion is practical but lossy and mode-dependent. | SC-VAL-001, SC-VAL-002, SC-ONT-002 | `lit-val-jsonschema-ietf`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema`, `lit-ont-owl-shacl-lessons` |

## Next Review Gate

Before Phase 0C can advance from proposal drafting to proposal review, run these checks:

- Every `PL-*`, `PR-*`, `BD-*`, and `DQ-*` row cites at least one `SC-*` ID.
- Every cited source ID exists in `research/source-registry.csv`.
- Every relation that crosses protocol/runtime/security boundaries has an explicit rollback trigger.
- Any relation that resembles implementation detail is marked `adapter-only-candidate` or deferred.
- Contradictions are recorded rather than normalized away.
