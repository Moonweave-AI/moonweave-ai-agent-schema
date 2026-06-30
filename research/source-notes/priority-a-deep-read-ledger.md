# Priority A Deep-Read Ledger

Date: 2026-06-30
Status: Phase 0C preparation source-spine deep-read complete

## Scope

The full priority A queue contains 229 sources after the final Phase 0C closure audit. This ledger deep-reads the priority A source spine: the authoritative sources needed to cover each Phase 0C synthesis family without loading all 229 full texts into context.

The remaining priority A rows are preserved in `research/priority-a-source-queue.csv` for later targeted extraction.

## Deep-Read Sources

| family | source ids / sources | extraction result |
|---|---|---|
| Protocol boundary | `eng-proto-mcp-changelog`, `eng-proto-a2a-docs` | MCP is the agent-to-tool/context protocol surface; A2A is agent-to-agent interoperability. MCP draft changes emphasize stateless requests, discovery, capability metadata, tasks extension, subscriptions, MRTR, cache hints, and tracing metadata. A2A emphasizes opaque, secure, extensible collaboration across framework/vendor boundaries and explicitly positions itself as complementary to MCP. |
| OpenAI runtime | `eng-fw-openai-python-docs`, `eng-fw-openai-python-repo` | OpenAI Agents SDK exposes agents, sandbox agents, tools, agents-as-tools, handoffs, guardrails, sessions, human-in-the-loop, MCP server tool calling, tracing, and realtime agents. Repo metadata confirms active open-source implementation and release cadence. |
| LangChain/LangGraph/Deep Agents | `eng-fw-langgraph-docs`, `eng-fw-deepagents-js-docs` | LangGraph is a low-level stateful orchestration runtime with durable execution, streaming, human-in-the-loop, persistence, and memory. Deep Agents is a harness above the core tool loop with planning, subagents, filesystem/context handling, long-term memory, MCP support, interrupts, and isolated subagent contexts. |
| Microsoft / MCP-native runtimes | `eng-fw-microsoft-agent-framework-current`, `eng-fw-mcp-agent-docs` | Microsoft Agent Framework targets production-grade .NET/Python agents and multi-agent workflows. mcp-agent centers MCP server capabilities, augmented LLMs, workflow patterns, and execution engines such as asyncio/Temporal. |
| CrewAI | `eng-fw-crewai-docs` | CrewAI frames collaborative agents, crews, flows, guardrails, memory, knowledge, and observability as production concepts. Exact field mapping should wait for Phase 0C source normalization. |
| Context and memory mechanisms | `lit-mech-compass`, `lit-agent-agemem` | COMPASS treats context management as the long-horizon bottleneck and separates tactical execution, strategic oversight, and context organization. Agentic Memory treats memory operations as policy actions and trains store/retrieve/update/summarize/discard decisions. |
| Long-horizon planning | `lit-mech-deepplanning` | DeepPlanning focuses on multi-day travel and multi-product shopping tasks with active information gathering, local constraints, and global constrained optimization. It warns that local step reasoning is insufficient for real long-horizon planning. |
| Learned orchestration | `lit-agent-conductor`, `lit-agent-mas-orchestra`, `lit-agent-paramanager` | Conductor trains coordination over heterogeneous worker LLMs. MAS-Orchestra frames MAS design as function-calling RL and cautions that MAS gains depend on task structure and verification. ParaManager normalizes agents and tools into a learnable action space with parallel decomposition and explicit state feedback. |
| Tool planning and orchestration benchmarks | `lit-agent-tooltree`, `lit-agent-orchestrationbench`, `lit-agent-etom` | ToolTree uses MCTS-like trajectory search with pre/post execution feedback. OrchestrationBench separates workflow planning from tool execution under domain/business constraints. ETOM evaluates multi-hop MCP tool orchestration, cross-server planning, functional overlap, and out-of-scope robustness. |
| State-machine agent workflows | `lit-state-stateflow`, `lit-state-metaagent`, `eng-state-xstate-docs`, `eng-state-xstate-graph`, `eng-state-xstate-releases`, `eng-state-scxml` | StateFlow models LLM task-solving as state machines separating process grounding from sub-task actions. MetaAgent constructs FSM-based MAS. XState and SCXML provide current and standard engineering evidence for states, transitions, actors, graph/path traversal, model-based testing, and interoperability. |
| Benchmarks and eval realism | `eng-bench-swebench-site`, `eng-bench-osworld-site`, `eng-bench-tau2`, `lit-bench-agencybench`, `eng-bench-appworld`, `lit-bench-terminal` | SWE-bench exposes software issue resolution variants and `% Resolved`. OSWorld provides executable computer environments. tau3 adds voice, knowledge, and task fixes. AgencyBench stresses 1M-token, 90-tool-call, hours-long tasks. AppWorld provides controllable apps/APIs and state-based tests. Terminal-Bench stresses shell execution in container-like environments. |
| Agent security | `lit-agent-asb`, `lit-agent-guardagent`, `lit-agent-safeagent` | ASB covers prompt injection, memory poisoning, backdoors, mixed attacks, and defenses across tools/scenarios/backbones. GuardAgent converts safety guard requests into executable guardrail checks. SafeAgent decomposes risks into instruction, context, and action sources and uses automated risk simulation. |
| Ontology and validation | `lit-ont-llm-oe-slr`, `lit-ont-owl-shacl-lessons`, `lit-ont-shacl-shex-survey`, `lit-val-jsonschema-ietf`, `eng-val-zod-json-schema`, `eng-val-pydantic-json-schema` | LLM ontology engineering lacks standardized task definitions and reproducible protocols. OWL+SHACL needs both automatic and manual constraint work. SHACL/ShEx practice reports documentation/tooling/performance/expressiveness gaps. JSON Schema 2020-12 is the stable structural baseline; Zod and Pydantic expose practical conversion modes and limitations. |

## Carry-Forward Constraints

- Do not require hidden chain-of-thought. Use observable traces, actions, tool calls, summaries, state updates, and safety decisions.
- Do not flatten handoffs, agents-as-tools, remote A2A agents, and MCP tools into one relation without source-backed semantics.
- Treat benchmark evidence as evaluation context, not as ontology categories.
- Treat memory as a mechanism family: summaries, retrieval, graph memory, action-level memory editing, indexed evidence, and learned policies are distinct.
- Treat security as structural: tool metadata, tool output, remote agent routing, memory retrieval, trace retention, and commit points are all attack surfaces.
- Treat JSON Schema, Zod, Pydantic, OWL, SHACL, and ShEx as overlapping but non-equivalent validation systems.

## Remaining Queue

`research/priority-a-source-queue.csv` contains the complete 229-source priority A list. During Phase 0C and post-Phase-0C, fetch additional full text only when a synthesis claim depends on that exact source.
