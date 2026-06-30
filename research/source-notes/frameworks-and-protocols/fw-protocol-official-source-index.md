# Official Engineering Source Index

Date: 2026-06-30
Status: source-first index note

## Purpose

This is a compact index of high-priority official engineering sources from the 167-row engineering corpus. It exists so later Phase 0C work can cite the right source family instead of relying on memory.

## Priority A Sources

| area | sources to deep-read first |
|---|---|
| OpenAI runtime | [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/), [OpenAI Agents SDK repo](https://github.com/openai/openai-agents-python), [OpenAI platform docs](https://platform.openai.com/docs) |
| LangChain/LangGraph | [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/overview), [LangGraph repo](https://github.com/langchain-ai/langgraph), [LangChain agents docs](https://docs.langchain.com/oss/python/langchain/agents) |
| Microsoft | [Microsoft Agent Framework repo](https://github.com/microsoft/agent-framework), [AutoGen repo](https://github.com/microsoft/autogen), [Semantic Kernel repo](https://github.com/microsoft/semantic-kernel), [Playwright MCP](https://github.com/microsoft/playwright-mcp) |
| Google | [ADK Python repo](https://github.com/google/adk-python), [ADK docs repo](https://github.com/google/adk-docs), [A2A Protocol](https://a2a-protocol.org/dev/) |
| Typed agent frameworks | [Pydantic AI docs](https://pydantic.dev/docs/ai/overview/), [Pydantic AI repo](https://github.com/pydantic/pydantic-ai), [Zod JSON Schema](https://zod.dev/json-schema), [Pydantic JSON Schema](https://docs.pydantic.dev/latest/concepts/json_schema/) |
| Multi-agent frameworks | [CrewAI docs](https://docs.crewai.com/), [CrewAI repo](https://github.com/crewAIInc/crewAI), [CAMEL repo](https://github.com/camel-ai/camel), [MetaGPT repo](https://github.com/FoundationAgents/MetaGPT) |
| Agent protocols | [MCP docs](https://modelcontextprotocol.io/), [MCP spec changelog](https://modelcontextprotocol.io/specification/draft/changelog), [MCP spec repo](https://github.com/modelcontextprotocol/modelcontextprotocol), [A2A repo](https://github.com/a2aproject/A2A), [AG-UI repo](https://github.com/ag-ui-protocol/ag-ui) |
| Benchmarks | [SWE-bench](https://www.swebench.com/), [Terminal-Bench](https://www.tbench.ai/), [OSWorld](https://os-world.github.io/), [tau2/tau3-bench](https://github.com/sierra-research/tau2-bench), [AgentBench](https://github.com/THUDM/AgentBench) |
| Computer/browser agents | [OpenHands](https://github.com/All-Hands-AI/OpenHands), [browser-use](https://github.com/browser-use/browser-use), [UI-TARS](https://github.com/bytedance/UI-TARS), [OmniParser](https://github.com/microsoft/OmniParser), [Stagehand](https://github.com/browserbase/stagehand) |

## Evidence Quality Rules For Phase 0C

- Prefer official docs and repos over blog posts for field semantics.
- Use release notes and changelogs for fast-moving APIs.
- Treat examples as usage evidence, not normative protocol definitions.
- Cross-check any term shared across frameworks, such as agent, session, memory, trace, handoff, supervisor, tool, workflow, and guardrail.
- For security-relevant sources, record threat model and execution boundary before extracting schema implications.
