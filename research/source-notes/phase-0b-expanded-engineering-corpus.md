# Phase 0B Expanded Engineering Corpus

Date: 2026-06-30
Status: source-first expansion corpus
Scope: official docs, maintained repositories, specs, SDKs, benchmark harnesses, release notes, and implementation references.

## Reading Status Legend

| status | meaning |
|---|---|
| fetched | Full or substantial content was fetched/read in this or a previous Phase 0B pass. |
| search-verified | Search result or official/repo metadata was verified; full extraction still pending. |
| known-primary | Stable primary URL recorded; needs fresh fetch before Phase 0C use. |
| watch | Useful source but not enough authority for direct schema influence. |

## Engineering And Official Source Candidates

| id | area | source | source_type | priority | status | why it matters |
|---|---|---|---|---:|---|---|
| eng-fw-langgraph-docs | framework-runtime | [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/overview) | official-doc | A | search-verified | Durable, stateful, graph-based agent orchestration. |
| eng-fw-langgraph-repo | framework-runtime | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | repo | A | search-verified | Current implementation and release cadence. |
| eng-fw-langgraph-js | framework-runtime | [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs) | repo | B | known-primary | TypeScript parity and JS adapter concerns. |
| eng-fw-langgraph-graph-api | framework-runtime | [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) | official-doc | A | search-verified | StateGraph, nodes, edges, reducers, routing. |
| eng-fw-langchain-agents | framework | [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents) | official-doc | A | search-verified | Agent loop, middleware, structured output, context. |
| eng-fw-langchain-repo | framework | [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | repo | B | known-primary | Broad framework ecosystem and integration surface. |
| eng-fw-deepagents-docs | harness | [Deep Agents docs](https://docs.langchain.com/oss/python/deepagents/overview) | official-doc | A | search-verified | Planning, subagents, filesystem, context management. |
| eng-fw-deepagents-repo | harness | [langchain-ai/deepagents](https://github.com/langchain-ai/deepagents) | repo | B | known-primary | Practical subagent harness implementation. |
| eng-fw-langsmith-docs | observability | [LangSmith docs](https://docs.smith.langchain.com/) | official-doc | B | known-primary | Tracing, evaluation, deployment feedback. |
| eng-fw-crewai-docs | framework | [CrewAI docs](https://docs.crewai.com/) | official-doc | A | known-primary | Role/task/crew/process abstraction. |
| eng-fw-crewai-repo | framework | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | repo | A | known-primary | Maintained framework implementation. |
| eng-fw-crewai-agents | framework | [CrewAI agents](https://docs.crewai.com/concepts/agents) | official-doc | A | known-primary | Agent role, goal, backstory, tools. |
| eng-fw-crewai-tasks | framework | [CrewAI tasks](https://docs.crewai.com/concepts/tasks) | official-doc | A | known-primary | Task contract and expected outputs. |
| eng-fw-crewai-flows | framework | [CrewAI flows](https://docs.crewai.com/concepts/flows) | official-doc | A | known-primary | Event-driven orchestration. |
| eng-fw-crewai-processes | framework | [CrewAI processes](https://docs.crewai.com/concepts/processes) | official-doc | B | known-primary | Sequential/hierarchical execution modes. |
| eng-fw-openai-agents-guide | framework | [OpenAI Agents guide](https://developers.openai.com/api/docs/guides/agents) | official-doc | A | known-primary | Current OpenAI agent development surface. |
| eng-fw-openai-orchestration | framework | [OpenAI orchestration and handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration) | official-doc | A | fetched | Handoffs versus agents-as-tools. |
| eng-fw-openai-python-docs | framework | [OpenAI Agents SDK Python docs](https://openai.github.io/openai-agents-python/) | official-doc | A | fetched | Agents, tools, handoffs, guardrails, tracing. |
| eng-fw-openai-python-repo | framework | [openai-agents-python](https://github.com/openai/openai-agents-python/) | repo | A | fetched | Current repo metadata and release cadence. |
| eng-fw-openai-js-repo | framework | [openai-agents-js](https://github.com/openai/openai-agents-js) | repo | A | known-primary | TypeScript agent SDK implementation. |
| eng-fw-openai-handoffs | framework | [OpenAI handoffs docs](https://openai.github.io/openai-agents-python/handoffs/) | official-doc | A | known-primary | Delegation ownership transfer. |
| eng-fw-openai-tools | framework | [OpenAI tools docs](https://openai.github.io/openai-agents-python/tools/) | official-doc | A | known-primary | Function/MCP/hosted tools and agents-as-tools. |
| eng-fw-openai-tracing | observability | [OpenAI tracing docs](https://openai.github.io/openai-agents-python/tracing/) | official-doc | A | known-primary | Trace/span implications. |
| eng-fw-openai-guardrails | validation | [OpenAI guardrails docs](https://openai.github.io/openai-agents-python/guardrails/) | official-doc | A | known-primary | Runtime validation gates. |
| eng-fw-microsoft-agent-framework-docs | framework-runtime | [Microsoft Agent Framework docs](https://learn.microsoft.com/en-us/agent-framework/overview/) | official-doc | A | search-verified | Python/.NET agents and workflows. |
| eng-fw-microsoft-agent-framework-repo | framework-runtime | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | repo | A | search-verified | Production-grade multi-agent workflows. |
| eng-fw-maf-workflows | framework-runtime | [Microsoft Agent Framework workflows](https://learn.microsoft.com/en-us/agent-framework/workflows/) | official-doc | A | search-verified | Sequential, concurrent, handoff, group patterns. |
| eng-fw-maf-migration-autogen | framework | [Migration from AutoGen](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen) | official-doc | B | search-verified | Evolution from AutoGen to MAF. |
| eng-fw-autogen-docs | framework | [AutoGen docs](https://microsoft.github.io/autogen/) | official-doc | A | known-primary | AgentChat/Core framework docs. |
| eng-fw-autogen-repo | framework | [microsoft/autogen](https://github.com/microsoft/autogen) | repo | A | known-primary | Current AutoGen implementation. |
| eng-fw-autogen-core | framework | [AutoGen Core docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/index.html) | official-doc | B | known-primary | Event-driven core abstractions. |
| eng-fw-autogen-agentchat | framework | [AutoGen AgentChat docs](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/index.html) | official-doc | A | known-primary | Conversational multi-agent surface. |
| eng-fw-semantic-kernel-agents | framework | [Semantic Kernel agents](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/) | official-doc | B | known-primary | Enterprise agent/plugin patterns. |
| eng-fw-semantic-kernel-repo | framework | [microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel) | repo | B | known-primary | Cross-language agent/plugin implementation. |
| eng-fw-google-adk-docs | framework | [Google ADK docs](https://google.github.io/adk-docs/) | official-doc | A | search-verified | Agent, workflow, task, deployment. |
| eng-fw-google-adk-repo | framework | [google/adk-python](https://github.com/google/adk-python/) | repo | A | search-verified | ADK 2.0 workflow runtime and task API. |
| eng-fw-google-adk-docs-repo | docs | [google/adk-docs](https://github.com/google/adk-docs) | repo | A | search-verified | Official docs repo and llms.txt context. |
| eng-fw-google-adk-ts | framework | [ADK TypeScript docs](https://adk.dev/get-started/typescript/) | official-doc | B | search-verified | TypeScript ADK implementation surface. |
| eng-fw-llamaindex-agents | framework | [LlamaIndex agents docs](https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/) | official-doc | A | known-primary | Agent deployment and tool/RAG integration. |
| eng-fw-llamaindex-workflows | framework-runtime | [LlamaIndex workflows](https://docs.llamaindex.ai/en/stable/module_guides/workflow/) | official-doc | A | known-primary | Event workflow runtime. |
| eng-fw-llamaindex-repo | framework | [run-llama/llama_index](https://github.com/run-llama/llama_index) | repo | B | known-primary | Implementation and examples. |
| eng-fw-pydantic-ai-docs | framework | [Pydantic AI docs](https://pydantic.dev/docs/ai/overview/) | official-doc | A | search-verified | Type-safe agent framework and dependency injection. |
| eng-fw-pydantic-ai-repo | framework | [pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai/) | repo | A | search-verified | Current v2+ implementation and release cadence. |
| eng-fw-pydantic-ai-agents | framework | [Pydantic AI agents](https://pydantic.dev/docs/ai/core-concepts/agent/) | official-doc | A | search-verified | Agent graph execution and run modes. |
| eng-fw-pydantic-graph | workflow | [pydantic-graph](https://ai.pydantic.dev/graph/) | official-doc | B | search-verified | Type-centric finite state machine/workflow. |
| eng-fw-dspy-docs | framework | [DSPy docs](https://dspy.ai/) | official-doc | A | known-primary | Declarative LM programs and optimization. |
| eng-fw-dspy-repo | framework | [stanfordnlp/dspy](https://github.com/stanfordnlp/dspy) | repo | B | known-primary | Optimizers/evaluation implementation. |
| eng-fw-vercel-ai-sdk-docs | framework | [Vercel AI SDK docs](https://v6.ai-sdk.dev/docs/introduction) | official-doc | A | search-verified | TS toolkit, agents, workflows, harnesses. |
| eng-fw-vercel-ai-repo | framework | [vercel/ai](https://github.com/vercel/ai) | repo | A | known-primary | AI SDK implementation. |
| eng-fw-vercel-agents | framework | [Vercel AI SDK agents](https://sdk.vercel.ai/docs/agents/overview) | official-doc | A | search-verified | ToolLoopAgent, HarnessAgent, runtime context. |
| eng-fw-vercel-subagents | framework | [Vercel AI SDK subagents](https://sdk.vercel.ai/docs/agents/subagents) | official-doc | B | search-verified | Subagent support in TS agent surface. |
| eng-fw-mastra-docs | framework | [Mastra docs](https://mastra.ai/) | official-doc | A | search-verified | TypeScript agents, workflows, memory, observability. |
| eng-fw-mastra-repo | framework | [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | repo | B | known-primary | TS implementation and examples. |
| eng-fw-agno-docs | framework | [Agno docs](https://docs.agno.com/) | official-doc | B | known-primary | Agent framework formerly phidata. |
| eng-fw-agno-repo | framework | [agno-agi/agno](https://github.com/agno-agi/agno) | repo | B | known-primary | Multi-agent framework implementation. |
| eng-fw-smolagents-docs | framework | [smolagents docs](https://huggingface.co/docs/smolagents/index) | official-doc | A | search-verified | CodeAgent, ToolCallingAgent, sandboxed execution. |
| eng-fw-smolagents-repo | framework | [huggingface/smolagents](https://github.com/huggingface/smolagents) | repo | A | known-primary | HF agent implementation. |
| eng-fw-strands-docs | framework | [Strands Agents docs](https://strandsagents.com/) | official-doc | A | search-verified | Model-driven agent SDK. |
| eng-fw-strands-repo | framework | [strands-agents/sdk-python](https://github.com/strands-agents/sdk-python) | repo | A | search-verified | Python/TS harness implementation. |
| eng-fw-beeai-docs | framework | [BeeAI docs](https://i-am-bee.github.io/beeai-framework/) | official-doc | B | known-primary | Agent framework and ACP history. |
| eng-fw-beeai-repo | framework | [i-am-bee/beeai-framework](https://github.com/i-am-bee/beeai-framework) | repo | B | known-primary | Implementation reference. |
| eng-fw-haystack-agents | framework | [Haystack agents docs](https://docs.haystack.deepset.ai/docs/agents) | official-doc | B | known-primary | Pipeline/tool agent model. |
| eng-fw-haystack-repo | framework | [deepset-ai/haystack](https://github.com/deepset-ai/haystack) | repo | B | known-primary | Production RAG/agent framework. |
| eng-code-openhands-docs | coding-agent | [OpenHands docs](https://docs.openhands.dev/) | official-doc | A | search-verified | Coding agent SDK, GUI, cloud/local runtime. |
| eng-code-openhands-repo | coding-agent | [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | repo | A | search-verified | Self-hosted coding agent control center. |
| eng-code-openhands-sdk | coding-agent | [OpenHands software-agent-sdk](https://github.com/OpenHands/software-agent-sdk) | repo | A | search-verified | Core agent SDK and server. |
| eng-code-swe-agent-repo | coding-agent | [SWE-agent](https://github.com/SWE-agent/SWE-agent) | repo | A | known-primary | SWE-bench agent scaffold and harness. |
| eng-code-mini-swe-agent | coding-agent | [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent) | repo | A | known-primary | Minimal coding agent scaffold. |
| eng-code-aider | coding-agent | [Aider](https://github.com/Aider-AI/aider) | repo | B | known-primary | Git-aware coding agent implementation. |
| eng-code-cline | coding-agent | [Cline](https://github.com/cline/cline) | repo | B | known-primary | IDE coding agent implementation. |
| eng-code-roo | coding-agent | [Roo Code](https://github.com/RooVetGit/Roo-Code) | repo | B | known-primary | Open coding agent fork/ecosystem. |
| eng-code-continue | coding-agent | [Continue](https://github.com/continuedev/continue) | repo | B | known-primary | Open-source AI code assistant. |
| eng-proto-mcp-spec | protocol | [MCP specification](https://modelcontextprotocol.io/specification/) | official-spec | A | fetched | Agent-to-tool/context protocol. |
| eng-proto-mcp-repo | protocol | [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol) | repo | A | search-verified | Spec, docs, schema source of truth. |
| eng-proto-mcp-changelog | protocol | [MCP changelog](https://modelcontextprotocol.io/specification/draft/changelog) | official-doc | A | search-verified | Current feature/deprecation evolution. |
| eng-proto-mcp-2026-rc | protocol | [MCP 2026 release candidate blog](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/) | official-blog | A | future-dated-excluded | Future-dated relative to 2026-06-30; excluded until publication can be verified. |
| eng-proto-mcp-2025-spec | protocol | [MCP 2025-11-25 specification](https://modelcontextprotocol.io/specification/2025-11-25.md) | official-spec | A | search-verified | Current stable spec baseline before 2026 RC. |
| eng-proto-mcp-basic | protocol | [MCP 2025-06-18 basic](https://modelcontextprotocol.io/specification/2025-06-18/basic) | official-spec | A | search-verified | Base protocol, lifecycle, authorization. |
| eng-proto-mcp-elicitation | protocol | [MCP elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation) | official-spec | A | search-verified | Interactive data request flow. |
| eng-proto-mcp-auth | protocol | [MCP authorization](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/ff960c9e/docs/specification/2025-06-18/basic/authorization.mdx) | official-spec | A | search-verified | OAuth resource metadata and resource indicators. |
| eng-proto-mcp-ts-sdk | protocol-sdk | [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | repo | A | known-primary | Official TS SDK. |
| eng-proto-mcp-python-sdk | protocol-sdk | [modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk) | repo | A | known-primary | Official Python SDK. |
| eng-proto-mcp-inspector | protocol-tool | [MCP Inspector](https://github.com/modelcontextprotocol/inspector) | repo | B | known-primary | Debugging and conformance aid. |
| eng-proto-a2a-spec | protocol | [A2A specification](https://a2a-protocol.org/latest/specification/) | official-spec | A | search-verified | Agent-to-agent interoperability. |
| eng-proto-a2a-docs | protocol | [A2A docs](https://a2a-protocol.org/dev/) | official-doc | A | search-verified | A2A vs MCP boundaries. |
| eng-proto-a2a-repo | protocol | [a2aproject/A2A](https://github.com/a2aproject/A2A) | repo | A | search-verified | Linux Foundation protocol repo. |
| eng-proto-a2a-python | protocol-sdk | [A2A Python SDK](https://github.com/a2aproject/a2a-python) | repo | A | known-primary | Python implementation. |
| eng-proto-a2a-js | protocol-sdk | [A2A JavaScript SDK](https://github.com/a2aproject/a2a-js) | repo | A | known-primary | JS/TS implementation. |
| eng-proto-agent-protocol | protocol | [Agent Protocol](https://langchain-ai.github.io/agent-protocol/) | spec | B | known-primary | Thread/run/state deployment protocol. |
| eng-proto-ag-ui | protocol-ui | [AG-UI docs](https://docs.ag-ui.com/) | official-doc | A | known-primary | Agent-to-UI event stream protocol. |
| eng-proto-ag-ui-repo | protocol-ui | [ag-ui-protocol/ag-ui](https://github.com/ag-ui-protocol/ag-ui) | repo | A | known-primary | Reference protocol packages. |
| eng-proto-copilotkit | protocol-ui | [CopilotKit](https://docs.copilotkit.ai/) | docs | B | known-primary | AG-UI reference ecosystem. |
| eng-proto-a2ui-repo | protocol-ui | [google/A2UI](https://github.com/google/A2UI) | repo | A | search-verified | Declarative UI generated by agents. |
| eng-proto-a2ui-mcp | protocol-ui | [A2UI over MCP](https://github.com/google/A2UI/blob/main/docs/guides/a2ui_over_mcp.md) | guide | A | search-verified | A2UI payloads over MCP resources/tools. |
| eng-proto-agent-client | protocol-client | [Agent Client Protocol](https://agentclientprotocol.com/) | spec | A | search-verified | Editor/CLI to coding agent protocol. |
| eng-proto-agent-client-repo | protocol-client | [zed-industries/agent-client-protocol](https://github.com/zed-industries/agent-client-protocol) | repo | A | search-verified | ACP spec and implementations. |
| eng-proto-openapi | protocol | [OpenAPI specification](https://spec.openapis.org/oas/latest.html) | standard | A | known-primary | HTTP API/tool surface modeling. |
| eng-proto-asyncapi | protocol | [AsyncAPI specification](https://www.asyncapi.com/docs/reference/specification/latest) | standard | A | known-primary | Event-driven API bindings. |
| eng-proto-cloudevents | protocol | [CloudEvents spec](https://github.com/cloudevents/spec) | standard | A | known-primary | Event envelope interoperability. |
| eng-proto-jsonrpc | protocol | [JSON-RPC 2.0](https://www.jsonrpc.org/specification) | standard | A | known-primary | MCP/A2A transport substrate. |
| eng-proto-oauth-rfc8414 | security | [OAuth authorization server metadata RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) | standard | A | known-primary | MCP auth discovery dependency. |
| eng-proto-oauth-rfc8707 | security | [OAuth resource indicators RFC 8707](https://www.rfc-editor.org/rfc/rfc8707) | standard | A | known-primary | MCP resource-bound token request. |
| eng-proto-oauth-rfc9728 | security | [OAuth protected resource metadata RFC 9728](https://www.rfc-editor.org/rfc/rfc9728) | standard | A | known-primary | MCP protected resource metadata. |
| eng-val-jsonschema-spec | validation | [JSON Schema spec repo](https://github.com/json-schema-org/json-schema-spec) | repo/spec | A | search-verified | Core/validation vocabularies. |
| eng-val-jsonschema-ietf | validation | [IETF JSON Schema draft](https://datatracker.ietf.org/doc/html/draft-ietf-jsonschema-json-schema-01) | standards-draft | A | search-verified | 2026 standards-track direction. |
| eng-val-jsonschema-test-suite | validation | [JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite) | repo | A | known-primary | Validator conformance. |
| eng-val-python-jsonschema | validation | [python-jsonschema docs](https://python-jsonschema.readthedocs.io/en/stable/) | official-doc | B | search-verified | Python validator behavior and error structures. |
| eng-val-ajv-docs | validation | [Ajv docs](https://ajv.js.org/) | official-doc | A | known-primary | JS JSON Schema/JTD validator. |
| eng-val-ajv-repo | validation | [ajv-validator/ajv](https://github.com/ajv-validator/ajv) | repo | A | known-primary | Implementation and release behavior. |
| eng-val-zod-docs | validation | [Zod docs](https://zod.dev/) | official-doc | A | known-primary | TypeScript validation and JSON Schema conversion. |
| eng-val-zod-json-schema | validation | [Zod JSON Schema](https://zod.dev/json-schema) | official-doc | A | search-verified | toJSONSchema conversion and unrepresentable types. |
| eng-val-zod-release-430 | validation | [Zod v4.3.0 release](https://github.com/colinhacks/zod/releases/tag/v4.3.0) | release-note | A | search-verified | fromJSONSchema and round-trip caveats. |
| eng-val-pydantic-json-schema | validation | [Pydantic JSON Schema](https://pydantic.dev/docs/validation/dev/concepts/json_schema/) | official-doc | A | search-verified | Validation/serialization modes and OpenAPI 3.1. |
| eng-val-pydantic-core | validation | [pydantic-core](https://github.com/pydantic/pydantic-core) | repo | A | known-primary | Runtime validation engine. |
| eng-val-typebox-docs | validation | [TypeBox docs](https://sinclairzx81.github.io/typebox/) | official-doc | A | known-primary | JSON Schema as TypeScript builder. |
| eng-val-typebox-repo | validation | [sinclairzx81/typebox](https://github.com/sinclairzx81/typebox) | repo | A | known-primary | Implementation and compiler. |
| eng-val-cue-docs | validation | [CUE docs](https://cuelang.org/docs/) | official-doc | B | known-primary | Constraint language and validation. |
| eng-val-cue-openapi | validation | [CUE and OpenAPI](https://cuelang.org/docs/concept/how-cue-works-with-openapi/) | official-doc | B | search-verified | OpenAPI conversion limits. |
| eng-val-shacl | validation | [SHACL Recommendation](https://www.w3.org/TR/shacl/) | standard | A | known-primary | RDF graph validation. |
| eng-val-pyshacl | validation | [pySHACL](https://github.com/RDFLib/pySHACL) | repo | B | known-primary | Python SHACL engine. |
| eng-val-jena-shacl | validation | [Apache Jena SHACL](https://jena.apache.org/documentation/shacl/) | official-doc | B | known-primary | Java RDF validation engine. |
| eng-val-shex | validation | [ShEx semantics](https://shex.io/shex-semantics/) | standard | B | known-primary | RDF shape language alternative. |
| eng-ont-owl | ontology | [OWL 2 overview](https://www.w3.org/TR/owl2-overview/) | standard | A | known-primary | Ontology language baseline. |
| eng-ont-rdf | ontology | [RDF 1.1 Concepts](https://www.w3.org/TR/rdf11-concepts/) | standard | A | known-primary | Graph data model baseline. |
| eng-ont-rdfs | ontology | [RDF Schema 1.1](https://www.w3.org/TR/rdf-schema/) | standard | A | known-primary | Class/property/domain/range baseline. |
| eng-ont-skos | ontology | [SKOS Reference](https://www.w3.org/TR/skos-reference/) | standard | A | known-primary | Concept scheme and labels. |
| eng-ont-jsonld | ontology | [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) | standard | A | known-primary | JSON to RDF graph compatibility. |
| eng-ont-prov-o | provenance | [PROV-O](https://www.w3.org/TR/prov-o/) | standard | A | known-primary | Provenance model. |
| eng-state-scxml | statecharts | [SCXML](https://www.w3.org/TR/scxml/) | standard | A | known-primary | State machine notation and execution. |
| eng-state-xstate-docs | statecharts | [XState docs](https://stately.ai/docs) | official-doc | A | known-primary | XState v5 machines, actors, snapshots. |
| eng-state-xstate-repo | statecharts | [statelyai/xstate](https://github.com/statelyai/xstate) | repo | A | known-primary | Runtime implementation and graph utilities. |
| eng-state-xstate-graph | statecharts | [XState graph docs](https://stately.ai/docs/graph) | official-doc | A | known-primary | Path generation/model-based testing. |
| eng-state-stately-studio | statecharts | [Stately Studio](https://stately.ai/) | official-doc | B | known-primary | Visual modeling affordances. |
| eng-state-uml | statecharts | [OMG UML specification](https://www.omg.org/spec/UML/) | standard | B | known-primary | UML state machine alignment. |
| eng-bench-swebench-repo | benchmark | [SWE-bench repo](https://github.com/SWE-bench/SWE-bench) | repo | A | search-verified | Real-world software issue benchmark. |
| eng-bench-swebench-site | benchmark | [SWE-bench leaderboard](https://www.swebench.com/) | official-site | A | search-verified | Current variants and leaderboard. |
| eng-bench-terminal | benchmark | [Terminal-Bench](https://github.com/harbor-framework/terminal-bench) | repo | A | search-verified | Terminal task execution harness. |
| eng-bench-terminal-21 | benchmark | [Terminal-Bench 2.1](https://github.com/harbor-framework/terminal-bench-2-1) | repo | A | search-verified | Verified benchmark iteration. |
| eng-bench-osworld-repo | benchmark | [OSWorld repo](https://github.com/xlang-ai/OSWorld) | repo | A | search-verified | Real computer environment. |
| eng-bench-osworld-site | benchmark | [OSWorld site](https://os-world.github.io/) | official-site | A | search-verified | OSWorld-Verified and results. |
| eng-bench-webarena | benchmark | [WebArena](https://webarena.dev) | project | A | known-primary | Web agent environment. |
| eng-bench-visualwebarena | benchmark | [VisualWebArena](https://jykoh.com/vwa) | project | A | known-primary | Visual web benchmark. |
| eng-bench-browsergym | benchmark | [BrowserGym](https://github.com/ServiceNow/BrowserGym) | repo | A | known-primary | Browser agent benchmark infrastructure. |
| eng-bench-appworld | benchmark | [AppWorld](https://github.com/StonyBrookNLP/appworld) | repo | A | known-primary | App/API execution benchmark. |
| eng-bench-tau | benchmark | [tau-bench](https://github.com/sierra-research/tau-bench) | repo | A | search-verified | Original tau-bench; now outdated. |
| eng-bench-tau2 | benchmark | [tau2/tau3-bench](https://github.com/sierra-research/tau2-bench) | repo | A | search-verified | Current tau benchmark with voice/knowledge/task fixes. |
| eng-bench-agentbench | benchmark | [AgentBench](https://github.com/THUDM/AgentBench) | repo | A | search-verified | Multi-environment agent benchmark. |
| eng-bench-visualagentbench | benchmark | [VisualAgentBench](https://github.com/THUDM/VisualAgentBench) | repo | B | search-verified | Visual foundation agent benchmark. |
| eng-bench-gaia | benchmark | [GAIA dataset](https://huggingface.co/datasets/gaia-benchmark/GAIA) | dataset | A | known-primary | General assistant benchmark. |
| eng-bench-agencybench | benchmark | [AgencyBench](https://github.com/GAIR-NLP/AgencyBench) | repo | A | search-verified | 1M-token long-horizon benchmark. |
| eng-bench-agentcompany | benchmark | [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany) | repo | B | known-primary | Simulated company benchmark. |
| eng-bench-workarena | benchmark | [WorkArena](https://github.com/ServiceNow/WorkArena) | repo | B | known-primary | Enterprise workflow web benchmark. |
| eng-bench-webvoyager | benchmark | [WebVoyager](https://github.com/MinorJerry/WebVoyager) | repo | B | known-primary | Web navigation benchmark. |
| eng-bench-androidworld | benchmark | [AndroidWorld](https://github.com/google-research/android_world) | repo | B | known-primary | Android/mobile agent benchmark. |
| eng-bench-mind2web | benchmark | [Mind2Web](https://github.com/OSU-NLP-Group/Mind2Web) | repo | B | known-primary | Web task dataset/benchmark. |
| eng-agent-browser-use-repo | browser-agent | [browser-use](https://github.com/browser-use/browser-use) | repo | A | search-verified | Browser automation agent framework. |
| eng-agent-browser-use-docs | browser-agent | [browser-use docs](https://docs.browser-use.com/open-source/introduction) | official-doc | A | search-verified | Open-source browser agent docs. |
| eng-agent-browser-use-bench | browser-agent | [browser-use benchmark](https://github.com/browser-use/benchmark) | repo | B | search-verified | 100 real-world browser tasks. |
| eng-agent-browser-use-webui | browser-agent | [browser-use web-ui](https://github.com/browser-use/web-ui) | repo | B | search-verified | Gradio UI and persistent browser sessions. |
| eng-agent-ui-tars | gui-agent | [UI-TARS](https://github.com/bytedance/UI-TARS/) | repo | A | search-verified | GUI/computer-use multimodal agent model. |
| eng-agent-ui-tars-desktop | gui-agent | [UI-TARS desktop](https://github.com/bytedance/UI-TARS-desktop) | repo | A | search-verified | Desktop and browser GUI agent stack. |
| eng-agent-midscene | browser-agent | [Midscene](https://github.com/web-infra-dev/Midscene) | repo | B | known-primary | Browser automation with visual grounding. |
| eng-agent-weboperator | browser-agent | [WebOperator](https://github.com/kagnlp/WebOperator) | repo | B | search-verified | Tree-search web agent with backtracking. |
| eng-agent-cua | computer-use | [Cua](https://github.com/trycua/cua) | repo | B | known-primary | Computer-use agent stack. |
| eng-agent-stagehand | browser-agent | [Browserbase Stagehand](https://github.com/browserbase/stagehand) | repo | B | known-primary | Browser automation framework for LLMs. |
| eng-agent-playwright-mcp | browser-tooling | [Playwright MCP](https://github.com/microsoft/playwright-mcp) | repo | A | known-primary | Browser automation exposed over MCP. |
| eng-agent-tangle-browser-driver | browser-agent | [agent-browser-driver](https://github.com/tangle-network/agent-browser-driver) | repo | C | search-verified | Browser driver with hybrid observation and cost claims. |
| eng-fw-openai-agents-release | framework | [openai-agents-python releases](https://github.com/openai/openai-agents-python/releases) | repo/release | A | search-verified | Release cadence and version evidence for Agents SDK. |
| eng-fw-openai-agents-js | framework | [openai-agents-js](https://github.com/openai/openai-agents-js) | repo | A | search-verified | JavaScript/TypeScript Agents SDK implementation. |
| eng-fw-microsoft-agent-framework-current | framework | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | repo | A | search-verified | Current repo metadata, release cadence, and multi-language workflow evidence. |
| eng-fw-google-adk-a2a-example | framework | [Google ADK + A2A cross-language example](https://developers.googleblog.com/build-cross-language-multi-agent-team-with-google-agent-development-kit-and-a2a/) | official-blog | B | search-verified | Current official example of A2A-connected multi-agent services. |
| eng-fw-mcp-agent-repo | framework-runtime | [lastmile-ai/mcp-agent](https://github.com/lastmile-ai/mcp-agent) | repo | A | search-verified | MCP-native agent framework with workflow patterns and Temporal durability. |
| eng-fw-mcp-agent-docs | framework-runtime | [mcp-agent docs](https://docs.mcp-agent.com/mcp-agent-sdk/overview) | official-doc | A | search-verified | MCP server aggregation, agents, workflows, execution engines. |
| eng-fw-deepagents-js-docs | harness | [Deep Agents JS docs](https://docs.langchain.com/oss/javascript/deepagents/overview) | official-doc | A | search-verified | Subagents, filesystem context, memory, MCP, and interrupts in JS harness. |
| eng-bench-ainativebench | benchmark | [AINativeBench](https://github.com/AINativeOps/AINativeBench) | repo | B | search-verified | AI-native application benchmark with MCP/A2A variants. |
| eng-state-xstate-releases | statecharts | [XState releases](https://github.com/statelyai/xstate/releases) | repo/release | A | search-verified | Current release evidence for XState statecharts/actors runtime. |
| eng-state-xstate-scxml | statecharts | [XState SCXML docs](https://statelyai-xstate.mintlify.app/advanced/scxml) | official-doc | A | search-verified | SCXML import/interoperability and feature support notes. |
| eng-state-statechartx | statecharts | [StatechartX](https://github.com/comalice/statechartx/tree/dev-docs-rework) | repo | C | search-verified | Go statechart implementation with SCXML conformance claims; alpha. |
| eng-fw-agenticx | framework | [AgenticX](https://github.com/clawbundle/AgenticX) | repo | C | search-verified | Broad agent framework with protocols/security/storage tiers; watch source. |

## Coverage Notes

- This corpus contains more than 175 engineering/official sources across frameworks, protocols, validation, ontology, statecharts, benchmarks, and agent implementations.
- Sources are not schema decisions. They are the expanded evidence base required before Phase 0C synthesis.
- Before Phase 0C, priority A docs/repos need focused extraction notes that record API concepts, version/date, release status, and implementation caveats.
