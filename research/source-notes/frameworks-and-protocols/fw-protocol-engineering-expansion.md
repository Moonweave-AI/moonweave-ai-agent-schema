# Framework And Protocol Engineering Expansion

Date: 2026-06-30
Status: source-first note

## Purpose

This note organizes official docs, repos, specs, and changelogs gathered for Phase 0B. It does not decide schema layers or relation names.

## Protocol Sources

Priority protocol sources:

- [MCP specification changelog](https://modelcontextprotocol.io/specification/draft/changelog) records current draft-level changes such as stateless requests, `server/discover`, capability metadata, cache hints, extension fields, and multi round-trip request handling.
- [A2A Protocol docs](https://a2a-protocol.org/dev/) describe A2A as an open agent-to-agent interoperability protocol maintained under the Linux Foundation, complementary to MCP.
- [A2A GitHub repo](https://github.com/a2aproject/A2A) provides spec and SDK evidence for agent cards, tasks, messages, artifacts, and extensions.
- [Agent Client Protocol](https://agentclientprotocol.com/) and [AG-UI](https://github.com/ag-ui-protocol/ag-ui) add adjacent client-agent and agent-UI interaction evidence.
- [OpenAPI](https://spec.openapis.org/oas/latest.html), [AsyncAPI](https://www.asyncapi.com/docs/reference/specification/latest), [CloudEvents](https://cloudevents.io/), and [OAuth 2.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1) remain relevant boundary sources rather than agent-specific mechanisms.

Source-first observation: MCP and A2A solve different interoperability problems. The A2A docs explicitly position MCP as agent-to-tool communication and A2A as agent-to-agent communication. That distinction is evidence for later analysis, not yet a schema rule.

## Runtime And Framework Sources

Priority framework/runtime sources:

- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/overview) describe a low-level orchestration runtime for long-running, stateful agents, with durable execution, streaming, human-in-the-loop, persistence, and memory.
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) describe a small primitive set: agents, tools, handoffs/agents-as-tools, guardrails, sessions, tracing, MCP server tool calling, and sandbox agents.
- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework) and Microsoft Learn pages provide current evidence for enterprise-grade agent workflows and .NET/Python integration.
- [AutoGen](https://github.com/microsoft/autogen), [Semantic Kernel](https://github.com/microsoft/semantic-kernel), [CrewAI](https://github.com/crewAIInc/crewAI), [Google ADK](https://github.com/google/adk-python), [Pydantic AI](https://github.com/pydantic/pydantic-ai), [LlamaIndex](https://github.com/run-llama/llama_index), [DSPy](https://github.com/stanfordnlp/dspy), [Vercel AI SDK](https://v6.ai-sdk.dev/docs/introduction), [Mastra](https://mastra.ai/), [smolagents](https://github.com/huggingface/smolagents), [Strands Agents](https://strandsagents.com/), and [OpenHands](https://github.com/All-Hands-AI/OpenHands) represent the engineering corpus that must be compared before Phase 0C.

Source-first observation: framework docs use overlapping words such as agent, tool, handoff, supervisor, workflow, state, memory, session, trace, and guardrail, but these terms do not always mean the same thing. Phase 0C must not flatten them without checking each official source.

## Implementation Evidence To Extract Later

| source family | extraction target |
|---|---|
| MCP | capability negotiation, tool/resource/prompt lists, auth, cache, tasks, tracing metadata, transport semantics |
| A2A | agent discovery, task lifecycle, message/artifact structures, opacity/security claims, extension governance |
| LangGraph | graph state, durable execution, checkpointing, interrupts, subgraphs, supervisor patterns, persistence |
| OpenAI Agents SDK | runner loop, handoffs vs agents-as-tools, guardrails, sessions, tracing, sandbox agents, MCP integration |
| Microsoft Agent Framework | workflow primitives, interop story, state handling, deployment/runtime assumptions |
| CrewAI/AutoGen/ADK/Pydantic AI | delegation, group chat, typed validation, tool schemas, memory/session behavior |

## Carry-Forward Risks

- Protocol specs are versioned. Later field-level claims must cite exact spec versions or changelog dates.
- Framework docs are fast-moving. Later comparisons need official docs plus repo/changelog evidence.
- "Agent-as-tool" appears in both research and SDK documentation. Phase 0C should compare semantics before deciding whether it is an ontology concept, runtime pattern, or protocol pattern.
- Security and auth cannot be appended later as an afterthought because MCP/A2A/tool frameworks expose cross-boundary execution.
