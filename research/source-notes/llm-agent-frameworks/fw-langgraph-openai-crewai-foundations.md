# fw-langgraph-openai-crewai-foundations: LangGraph, OpenAI Agents SDK, and CrewAI Foundations

metadata:
  domain: llm-agent-frameworks
  source_type: source-family
  authority_level: official-docs-plus-repos
  temporal_class: current-docs
  published_or_updated: checked 2026-06-30
  last_checked: 2026-06-30
  url: https://docs.langchain.com/oss/python/langgraph/graph-api
  deep_read_priority: A

## Covered Sources

| source_id | title | url | authority | temporal_class |
|---|---|---|---|---|
| cand-fw-langgraph-graph-api | LangGraph Graph API | https://docs.langchain.com/oss/python/langgraph/graph-api | official-doc | current-docs |
| cand-fw-langgraph-repo | langchain-ai/langgraph | https://github.com/langchain-ai/langgraph/ | repo | current-docs |
| cand-fw-crewai-agents | CrewAI Agents | https://docs.crewai.com/concepts/agents | official-doc | current-docs |
| cand-fw-crewai-tasks | CrewAI Tasks | https://docs.crewai.com/concepts/tasks | official-doc | current-docs |
| cand-fw-openai-agents-python-docs | OpenAI Agents SDK Python docs | https://openai.github.io/openai-agents-python/ | official-doc | current-docs |
| cand-fw-openai-handoffs | OpenAI Agents SDK handoffs | https://openai.github.io/openai-agents-python/handoffs/ | official-doc | current-docs |
| cand-fw-openai-guardrails | OpenAI Agents SDK guardrails | https://openai.github.io/openai-agents-python/guardrails/ | official-doc | current-docs |
| cand-fw-openai-tracing | OpenAI Agents SDK tracing | https://openai.github.io/openai-agents-python/tracing/ | official-doc | current-docs |
| cand-fw-openai-running | OpenAI running agents | https://developers.openai.com/api/docs/guides/agents/running-agents | official-doc | current-docs |

## Why This Source Family Matters

These sources define current framework abstractions that are likely to influence adapter mappings: graph/state orchestration in LangGraph, role/task/crew workflows in CrewAI, and agent loop/handoffs/guardrails/tracing/sessions in OpenAI Agents SDK. They should not define the core ontology alone, because they are framework-specific.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| Graph Workflow | Agent/workflow behavior modeled as graph of state, nodes, and edges. | LangGraph Graph API models workflows using State, Nodes, and Edges. | high | L5 |
| State Schema | Shared data structure representing current workflow snapshot. | LangGraph docs define State as application snapshot shared through nodes. | high | L6 |
| Node | Function encoding a computation step over state. | LangGraph nodes receive state and return updates. | high | L5 |
| Edge | Routing relation deciding which node runs next. | LangGraph edges determine next node, including conditional branches. | high | L5 |
| Checkpointer | Persistence component saving execution state. | LangGraph compile can use checkpointers and resumes from checkpoints. | high | L8 |
| Interrupt | Human-in-the-loop pause/resume primitive. | LangGraph interrupt examples and OpenAI running agents approval/resume guidance. | high | L7, L8 |
| Agent Loop | Runtime loop of model calls, tool calls, handoffs, and final output. | OpenAI running agents docs define the loop. | high | L5 |
| Handoff | Delegation from one agent to another specialist. | OpenAI Agents handoffs are represented as tools to the LLM. | high | L4, L5 |
| Guardrail | Validation/check applied to inputs, outputs, or tool calls. | OpenAI Agents guardrails validate user input, agent output, and tool invocations. | high | L6, L8 |
| Trace | End-to-end record of workflow execution. | OpenAI tracing defines traces and spans for runs, tools, handoffs, guardrails. | high | L8 |
| Session | Persistent memory/state carrier across turns. | OpenAI running agents docs present sessions as persistent chat state/resumable run support. | high | L8 |
| CrewAI Agent | Role/goal/backstory/tool-bearing agent. | CrewAI docs define agents with role, goal, backstory, tools, memory, delegation settings. | high | L2, L5 |
| CrewAI Task | Description/expected output assigned to an agent, optionally with context. | CrewAI task examples define description, expected_output, agent, context. | high | L4, L5 |
| Crew | Group of agents and tasks with a process. | CrewAI examples instantiate Crew with agents, tasks, and process. | high | L5 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| graph_has_node | Graph Workflow | Node | LangGraph Graph API. | high | Adapter relation. |
| graph_has_edge | Graph Workflow | Edge | LangGraph Graph API. | high | Adapter relation. |
| node_reads_state | Node | State Schema | LangGraph nodes receive state. | high | |
| node_updates_state | Node | State Schema | LangGraph nodes return state updates. | high | |
| graph_uses_checkpointer | Graph Workflow | Checkpointer | LangGraph compile with checkpointer. | high | |
| interrupt_resumes_with_command | Interrupt | ResumeCommand | LangGraph Command(resume=...). | high | Adapter relation. |
| agent_loop_invokes_tool | Agent Loop | Tool | OpenAI running agents loop executes tool calls. | high | Core-adjacent, needs protocol/tool source. |
| agent_hands_off_to_agent | Agent | Agent | OpenAI handoffs. | high | Cross-framework relation candidate. |
| guardrail_validates_input | Guardrail | Input | OpenAI input guardrails. | high | Validation relation. |
| guardrail_validates_output | Guardrail | Output | OpenAI output guardrails. | high | Validation relation. |
| trace_contains_span | Trace | Span | OpenAI tracing docs. | high | Provenance/observability relation. |
| crew_has_agent | Crew | CrewAI Agent | CrewAI examples. | high | Adapter relation. |
| task_assigned_to_agent | CrewAI Task | CrewAI Agent | CrewAI task definitions. | high | Adapter relation. |
| task_uses_context | CrewAI Task | Task | CrewAI context field. | medium | Context may be previous task output. |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| graph_compiled | Graph Workflow | compile() called | no | LangGraph compile performs checks and configures runtime args. | Adapter state. |
| checkpoint_saved | Checkpointer | super-step boundary | no | LangGraph checkpointing. | Needs exact persistence model per backend. |
| interrupted | Run | interrupt/approval/tool work pause | no | LangGraph/OpenAI running agents. | Must carry resume state. |
| resumed | Run | resume command/state | no | LangGraph Command(resume), OpenAI resume from state. | |
| final_output_returned | Agent Loop | no more tool work or handoffs | yes | OpenAI running agents loop. | |
| handoff_invoked | Handoff | model selects handoff tool | no | OpenAI handoffs are represented as tools. | |
| guardrail_tripwire_triggered | Guardrail | validation detects blocked condition | maybe | OpenAI guardrail tripwires halt execution. | |
| trace_exported | Trace | trace processor flush/export | yes | OpenAI tracing. | Observability artifact state. |
| crew_kickoff | Crew | crew execution begins | no | CrewAI examples use kickoff. | |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| LangGraph resume-sensitive node logic should be idempotent around checkpoints/interrupts. | Node | LangGraph docs warn nodes can re-run from start after resume. | runtime/process | Framework-specific but important for adapter guidance. |
| A handoff should record source agent, destination agent, and optional model-generated metadata. | Handoff | OpenAI handoff input_type and callbacks. | structural | Handoffs in other frameworks may not expose tool-like shape. |
| Guardrails must record boundary: input, output, or tool. | Guardrail | OpenAI guardrails have workflow boundaries. | structural | Other frameworks use different guardrail vocabulary. |
| CrewAI role/goal/backstory should remain adapter fields until corroborated by MAS theory. | CrewAI Agent | CrewAI official docs. | evidence | "Goal" overlaps BDI Goal but may just be prompt text. |
| Trace/span data must be privacy-aware. | Trace | OpenAI tracing notes disabling and ZDR unavailability. | security | Observability can leak sensitive content. |

## Schema Implications

Facts only, no final schema decisions:

- Framework-neutral core should not absorb LangGraph node/edge/checkpointer or CrewAI backstory as mandatory fields.
- Adapter mappings likely need FrameworkAdapter, RuntimeGraph, ToolBinding, Handoff, Guardrail, Session, Trace, Span, and TaskAssignment artifacts.
- Handoff is corroborated by OpenAI and LangGraph multi-agent patterns, but exact control-transfer semantics differ.
- Checkpoint/resume and interrupt state are important runtime evidence for statechart/protocol layers.
- CrewAI task description/expected_output/context map naturally to task specification evidence, but the exact field names are framework-specific.

## Framework Or Standard Specificity

Core candidates needing cross-track corroboration:

- Tool, Task, Handoff, Guardrail, Trace, Session, Run, Agent, Role, Goal.

Adapter-only candidates:

- LangGraph StateGraph, Node, Edge, Checkpointer, Command(resume), thread_id.
- CrewAI role, goal, backstory, crew, process, verbose, allow_delegation.
- OpenAI Agents Runner, trace/span field names, specific guardrail tripwire exception classes.

## Contradictions And Open Questions

| issue | evidence | impact | owner | deadline |
|---|---|---|---|---|
| Frameworks use "agent" and "task" differently. | CrewAI role/task/crew; OpenAI agent loop; LangGraph graph runtime. | Need framework-neutral abstractions plus adapter mappings. | research/llm-agent-frameworks | Before Phase 0C |
| Handoff can be a tool-like call, graph routing command, or crew delegation. | OpenAI handoffs; LangGraph Command/routing; CrewAI delegation. | Need relation semantics independent of implementation. | research/llm-agent-frameworks | Before Phase 0C |
| "Goal" in CrewAI may be prompt metadata rather than BDI Goal. | CrewAI docs versus BDI theory. | Avoid merging without MAS support. | research/llm-agent-frameworks | Before Phase 0C |
| Tracing is useful but sensitive. | OpenAI tracing supports disable and ZDR caveat. | Need privacy/security review before implementation. | research/security-review | Before implementation phase |

## Follow-Up Sources

- LangGraph checkpointers, interrupts, memory, and multi-agent docs.
- CrewAI flows and memory docs.
- OpenAI Agents SDK results, sessions, tools, and JavaScript SDK docs/repo.
- Microsoft Agent Framework workflows and repo for cross-language current evidence.
- Pydantic AI and DSPy for schema-first/declarative contrasts.
