# RFC 0003: Statechart And Protocol Model

Status: accepted
Created: 2026-06-30
Accepted: 2026-06-30
Depends on:

- `docs/rfcs/0001-ontology-layers.md`
- `docs/rfcs/0002-canonical-schema-contract.md`
- `research/living-source-metadata.csv`
- `research/pl-pr-core-profile-adapter-matrix.md`

## Purpose

Define how statecharts, agent protocols, framework runtimes, and benchmark environments map to the core/profile/adapter model.

This RFC is adapter-facing. It does not implement adapters.

## Non-Goals

- Do not implement MCP, A2A, OpenAI, LangGraph, XState, or benchmark adapters.
- Do not make statecharts the universal runtime lifecycle.
- Do not collapse MCP tool/resource/prompt semantics into A2A remote-agent semantics.
- Do not treat benchmark score fields as ontology core.

## Adapter Families

| family | disposition | owns |
|---|---|---|
| MCP profile | profile/adapter | Tool/resource/prompt capability surfaces, discovery, versioning, cache/subscription metadata, auth/resource metadata, and elicitation metadata. |
| A2A profile | adapter | Remote-agent identity, task/message exchange, opacity/visibility, interop boundaries, delegation metadata. |
| Framework runtime profiles | profile/adapter | OpenAI Agents, LangGraph, Microsoft Agent Framework, CrewAI, Deep Agents, and other runtime terms. |
| Statechart profile | profile/adapter | Reusable lifecycle/control-flow profile with SCXML/XState-like states, transitions, guards, path generation, and model-based testing over runtime/session state. |
| Benchmark/eval adapters | adapter | SWE-bench, OSWorld, tau2, AppWorld, Terminal-Bench, AgencyBench, and candidate benchmark-specific metrics/pressure axes. |
| Validation generator profiles | profile/adapter | Zod, Pydantic, OWL, SHACL, ShEx, and related generated views. |

## Protocol Boundaries

| boundary | model decision | constraints | source ids |
|---|---|---|---|
| MCP vs A2A | MCP is agent-to-tool/context/resource/prompt surface; A2A is remote agent interoperability. A2A field names and task/message details remain draft-only until A2A sources are version-normalized. | SC-PROTO-001, SC-PROTO-003 | `eng-proto-mcp-spec`, `eng-proto-mcp-changelog`, `eng-proto-a2a-docs`, `eng-proto-a2a-spec` |
| MCP metadata | Version, discovery, capabilities, cache/subscription, auth/resource, and elicitation metadata remain protocol-profile fields. | SC-PROTO-002, SC-PROTO-004 | `eng-proto-mcp-2025-spec`, `eng-proto-mcp-auth`, `eng-proto-mcp-elicitation`, `eng-proto-mcp-changelog`, `eng-security-mcp-nsa-2026` |
| Remote opacity | Remote A2A agents do not share internal memory, tool inventory, or proprietary logic by default. | SC-PROTO-003, SC-SEC-003 | `eng-proto-a2a-docs`, `eng-proto-a2a-spec`, `eng-fw-google-adk-a2a-example`, `lit-agent-msb` |
| Coordination semantics | Handoff, agents-as-tools, remote delegation, and local subagent assignment are separate relations. | SC-RUNTIME-002, SC-MECH-005 | `eng-fw-openai-handoffs`, `eng-fw-openai-tools`, `eng-fw-deepagents-js-docs`, `lit-agent-paramanager` |

## Statechart Profile

Statecharts are not core lifecycle primitives. They are a profile over runtime/session state.

Statechart profile may include:

- state
- transition
- event
- guard
- action
- final state
- path
- shortest path
- model-based test path
- SCXML/XState adapter metadata

Statechart profile must not claim:

- all runtime sessions are state machines
- all task planning is a statechart
- XState implementation fields are canonical ontology fields
- SCXML executable content maps one-to-one to every runtime

Evidence:

| claim | constraints | source ids |
|---|---|---|
| State-machine workflows provide testing and visualization hooks. | SC-MECH-006 | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-xstate-graph`, `eng-state-scxml` |
| Runtime durable execution is broader than statecharts. | SC-RUNTIME-003 | `eng-fw-langgraph-docs`, `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs`, `eng-fw-openai-python-docs` |

## Benchmark Adapter Model

Benchmark adapters must remain separate from ontology core.

Benchmark adapter candidate axes may include:

- benchmark ID
- environment type
- interaction horizon
- scoring mode
- artifact type
- resource pressure interpretation
- sandbox/tool/API surface
- user-simulation mode
- feedback-loop structure

These are candidate axes, not field-level adapter contracts. Benchmark versions and source rows must be normalized before final adapter fields are accepted.

Evidence:

| benchmark family | source ids |
|---|---|
| software issue resolution | `eng-bench-swebench-site`, `eng-bench-swebench-repo` |
| desktop/computer environments | `eng-bench-osworld-site`, `eng-bench-osworld-repo`, `eng-bench-osworld-v2` |
| customer-service / user simulation | `eng-bench-tau2`, `eng-bench-tau2-verified` |
| API/app state testing | `eng-bench-appworld`, `lit-bench-appworld` |
| terminal execution | `lit-bench-terminal`, `eng-bench-terminal` |
| long-horizon pressure | `lit-bench-agencybench`, `eng-bench-agencybench` |

## Living Source Gate

Before implementing any adapter or finalizing field-level adapter contracts:

1. The source row must exist in `research/source-registry.csv`.
2. Engineering/living source rows must have a normalization row in `research/living-source-metadata.csv`.
3. Literature/static rows may be cited through `research/source-registry.csv` and, where venue status matters, `research/paper-venue-upgrade.csv`.
4. If an engineering/living source has `normalization_status=needs-targeted-check`, adapter fields may be drafted but not finalized.
5. If a source is future-dated relative to 2026-06-30, it cannot be used as active evidence until rechecked.
6. Any claim based on a `needs-targeted-check` source must be labeled draft-only in adapter specs.

## Acceptance Criteria

This RFC is accepted when:

- MCP and A2A are modeled as separate adapter families.
- MCP tool/resource/prompt invocation remains separate from agent-as-tool and A2A delegation.
- Handoff, agents-as-tools, local subagent assignment, and remote delegation remain distinct.
- Statechart transitions stay profile/adapter-owned.
- Benchmark metrics and pressure interpretations stay adapter-owned until benchmark versions are normalized.
- Living source metadata gates field-level adapter claims.

## Consequences

- Adapter implementation will require per-family mapping specs.
- Some highly useful framework fields remain out of core.
- Evaluation, protocol, and statechart surfaces can evolve independently without rewriting ontology core.

## Phase 1 Gate Record

- Source ID integrity: passed against `research/source-registry.csv`.
- Living source normalization: passed for protocol, framework, statechart, and benchmark sources cited by accepted adapter claims.
- Protocol separation: passed; MCP, A2A, handoff, agents-as-tools, local subagent assignment, and remote delegation remain distinct.
- Adapter-only pollution check: passed; benchmark score/pressure semantics and statechart transitions do not enter ontology core.
- Future-dated source exclusion: passed; future-dated source rows are not used as active evidence.
