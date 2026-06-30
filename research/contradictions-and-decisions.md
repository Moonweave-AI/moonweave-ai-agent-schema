# Phase 0B Contradictions And Decision Register

Generated: 2026-06-30
Status: initial Phase 0B register
Scope: unresolved issues, candidate decisions, and required follow-up. No final schema decisions yet.

## Open Contradictions

| id | contradiction_or_tension | evidence_ids | affected_layers | owner | deadline | current_handling |
|---|---|---|---|---|---|---|
| cd-agent-term-collision | "Agent" means provenance responsible actor in PROV-O, autonomous MAS entity in BDI/OASIS, framework runtime primitive in OpenAI/CrewAI, and "actor" in XState runtime. | ont-owl-shacl-foundations, mas-bdi-agentspeak-foundations, state-scxml-xstate-foundations, fw-langgraph-openai-crewai-foundations | L0, L2, L5, L7, L8 | ontology-engineering | Before Phase 0C | Keep separate candidate names: ProvenanceAgent, MASAgent, FrameworkAgent, ActorRef. |
| cd-goal-desire-collision | BDI uses desire/goal as motivational mental state; CrewAI uses goal as agent prompt metadata. | mas-bdi-agentspeak-foundations, fw-langgraph-openai-crewai-foundations | L2, L3, L5 | multi-agent-systems | Before Phase 0C | Do not merge CrewAI goal into BDI Goal without methodology corroboration. |
| cd-structural-vs-semantic-validation | JSON Schema validates JSON structures; SHACL validates RDF graphs. | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | L6, L8 | schema-validation | Before Phase 0C | Maintain separate validation artifacts. |
| cd-mcp-a2a-layering | MCP is agent-to-tool/context; A2A is agent-to-agent communication/coordination. | proto-fipa-mcp-a2a-foundations | L4, L5 | agent-protocols | Before Phase 0C | Keep distinct protocol layers. |
| cd-fipa-modern-message-gap | FIPA ACL has performatives, content language, ontology, and conversation control; modern LLM framework messages often omit formal speech-act fields. | proto-fipa-mcp-a2a-foundations, fw-langgraph-openai-crewai-foundations | L4, L5 | agent-protocols | Before Phase 0C | Make performative optional or profile-specific until more evidence. |
| cd-a2a-normative-source | A2A v1.0 states proto is normative while generated JSON artifacts are convenience outputs. | proto-fipa-mcp-a2a-foundations | L5, L6, L8 | agent-protocols | Before Phase 0C | Track normative status for every imported schema/source. |
| cd-framework-core-pollution | LangGraph, OpenAI Agents, and CrewAI fields are useful but framework-specific. | fw-langgraph-openai-crewai-foundations | L2, L5, L6, L8 | llm-agent-frameworks | Before Phase 0C | Classify framework fields as adapter-only until cross-source support. |
| cd-handoff-semantics | Handoff may be modeled as tool call, graph routing, or delegation depending on framework/protocol. | fw-langgraph-openai-crewai-foundations, proto-fipa-mcp-a2a-foundations | L4, L5 | llm-agent-frameworks | Before Phase 0C | Keep Handoff relation generic with implementation-specific mapping. |
| cd-schema-conversion-loss | Zod/Pydantic runtime schemas can contain features not faithfully expressible in JSON Schema. | val-jsonschema-zod-pydantic-foundations | L6, L8 | schema-validation | Before Phase 0C | Require ConversionWarning/ConversionError artifact. |
| cd-statechart-runtime-mapping | SCXML executable content and XState implementation fields are not one-to-one. | state-scxml-xstate-foundations | L7 | statecharts | Before Phase 0C | Separate canonical behavior graph from XState adapter fields. |
| cd-tracing-privacy | Trace/span artifacts are useful for observability but can contain sensitive user/tool/model data. | fw-langgraph-openai-crewai-foundations | L8 | security-review | Before implementation | Mark tracing fields security-sensitive; require privacy review. |
| cd-fipa-source-availability | Canonical FIPA URLs were partially inaccessible during fetch; mirror sources were used for content verification. | proto-fipa-mcp-a2a-foundations | L4, L8 | agent-protocols | Before Phase 0C | Locate archived canonical PDFs or stable copies. |
| cd-mechanism-vs-protocol-layering | Reasoning/action/orchestration mechanisms cut across protocols and frameworks, but protocol specs only describe envelopes, transport, task, and tool surfaces. | mech-reasoning-topologies-foundations, mech-action-reflection-loop-foundations, mech-subagent-orchestration-foundations, proto-fipa-mcp-a2a-foundations | L3, L4, L5, L8 | agent-mechanisms | Before Phase 0C | Maintain a separate mechanism track and avoid treating MCP/A2A/framework APIs as the mechanism model. |
| cd-cot-observability | CoT papers treat intermediate reasoning as useful evidence, while production systems may not expose or permit storage of private hidden reasoning. | mech-reasoning-topologies-foundations, fw-langgraph-openai-crewai-foundations | L3, L8 | security-review | Before implementation | Model reasoning summaries/observable trace events; do not require full hidden CoT. |
| cd-linear-vs-search-reasoning | CoT/ReAct use mostly linear traces, while ToT/GoT/LATS use branching or graph search with evaluators, budgets, and backtracking. | mech-reasoning-topologies-foundations, mech-action-reflection-loop-foundations | L3, L8 | agent-mechanisms | Before Phase 0C | Represent topology and controller separately from trace text. |
| cd-reflection-memory-contamination | Reflection memory can improve later attempts, but self-generated reflections may preserve wrong lessons or stale assumptions. | mech-action-reflection-loop-foundations | L3, L8 | security-review | Before implementation | Treat reflection as generated evidence with source/trust/review metadata. |
| cd-subagent-overhead | Subagents can improve breadth, specialization, and context isolation, but they add token cost, routing complexity, traces, and reliability burden. | mech-subagent-orchestration-foundations | L5, L8 | agent-mechanisms | Before Phase 0C | Add BudgetPolicy and CoordinationOverhead candidates; require benchmark evidence before recommending multi-agent use. |
| cd-static-vs-dynamic-orchestration | MetaGPT/ChatDev-style static roles and SOPs improve structure, while AOrchestra/Uno-Orchestra/AgentVerse emphasize dynamic creation, recruitment, and routing. | mech-subagent-orchestration-foundations | L2, L5, L8 | agent-mechanisms | Before Phase 0C | Track static/dynamic-adaptive orchestration as an explicit axis. |
| cd-handoff-vs-agents-as-tools | Handoff transfers control to a specialist, while agents-as-tools keeps manager ownership and uses specialists as bounded capabilities. | mech-subagent-orchestration-foundations, fw-langgraph-openai-crewai-foundations | L4, L5 | llm-agent-frameworks | Before Phase 0C | Add DelegationOwnership and avoid flattening both into generic delegation. |
| cd-context-isolation-vs-context-sharing | Context isolation reduces contamination and enables parallelism, but workers may miss relevant information and synthesis can lose detail. | mech-subagent-orchestration-foundations | L5, L8 | agent-mechanisms | Before Phase 0C | Record scoped inputs, returned artifacts, and synthesis provenance. |

## Provisional Decisions

| id | decision | basis | status | revisit |
|---|---|---|---|---|
| pd-phase0-boundary | Phase 0 remains research-only: no canonical schema, frontend, or runtime adapter implementation. | RFC 0000 | accepted-for-phase0 | Phase 0C exit |
| pd-source-evidence-required | Candidate concepts/relations must carry evidence IDs. | RFC 0000 and PROV-O evidence | accepted-for-phase0 | Phase 0C review |
| pd-use-2020-12-as-stable-json-schema-baseline | JSON Schema 2020-12 remains stable baseline; 2026 IETF draft is watch/current-draft. | JSON Schema spec index; IETF draft status | provisional | Before implementation |
| pd-separate-validation-artifacts | Keep JSON Schema validation, SHACL validation, and runtime guardrails as distinct artifacts. | JSON Schema/SHACL/OpenAI evidence | provisional | Phase 0C |
| pd-adapter-only-framework-fields | LangGraph/CrewAI/OpenAI-specific field names are adapter-only unless corroborated. | Framework docs and MAS/protocol evidence | provisional | Phase 0C |
| pd-track-normative-status | Store normative/generated/mirror/release-note status for each source and schema artifact. | A2A/FIPA source evidence | provisional | Phase 0C |
| pd-add-agent-mechanisms-track | Add Agent Mechanisms And Orchestration as Phase 0 Track 7. | Mechanism search found substantial evidence not covered by protocol/framework tracks. | accepted-for-phase0 | Phase 0C |
| pd-mechanisms-crosscut-layers | Treat reasoning topology, action/reflection loops, and subagent orchestration as cross-cutting mechanism evidence rather than framework adapter fields. | CoT/ToT/GoT/ReAct/Reflexion/LATS/RAFA/AutoGen/OpenAI/Anthropic evidence | provisional | Phase 0C |
| pd-no-hidden-cot-requirement | Do not require full hidden chain-of-thought capture in any future schema direction. | CoT observability conflict and tracing privacy concerns | provisional | Before implementation |
| pd-delegation-ownership-required | Track whether delegation transfers ownership or keeps a manager in control. | OpenAI handoffs versus agents-as-tools evidence | provisional | Phase 0C |

## Required Follow-Up Before Phase 0C

| id | task | target_artifact | priority | reason |
|---|---|---|---|---|
| fu-ontology-methods | Deep-read METHONTOLOGY, Ontology 101, JSON-LD, SKOS, RDFS, and PROV-DM. | ontology-engineering notes | A | Current note lacks full method and label/context evidence. |
| fu-mas-methods | Deep-read O-MaSE, Gaia, MaSE, Prometheus, Wooldridge/Jennings. | multi-agent-systems notes | A | Role, organization, capability, and protocol concepts need stronger MAS support. |
| fu-protocol-interactions | Deep-read FIPA Request/Query/Contract-Net/Subscribe, MCP resources/prompts/auth, A2A proto, Agent Protocol. | agent-protocol notes | A | Task/message lifecycle needs protocol-specific details. |
| fu-statechart-scxml | Deep-read SCXML data model, invoke, executable content, final/history, and UML alignment. | statecharts notes | A | XState evidence currently stronger than SCXML details. |
| fu-framework-breadth | Add Microsoft Agent Framework, Pydantic AI, DSPy, AutoGen/Semantic Kernel, LangGraph repo/release notes. | llm-agent-frameworks notes | A | Framework mapping exit criteria require official docs plus repo/changelog. |
| fu-validation-suite | Deep-read JSON Schema Core/Validation 2020-12, JSON Schema Test Suite, TypeBox, OpenAPI 3.1, ShEx. | schema-validation notes | A | Need conformance and conversion limits. |
| fu-security-review | Review tool invocation, tracing, remote protocols, and schema conversion trust boundaries. | contradictions/security notes | B | Security issues identified in MCP/OpenAI/tracing evidence. |
| fu-agent-mechanisms-breadth | Deep-read remaining mechanism sources: Program-of-Thoughts, Least-to-Most, Plan-and-Solve, RAP, ADVOCATE, RECAP, Toolformer, MRKL, Generative Agents. | agent-mechanisms notes | A | Initial notes cover the backbone but not the full candidate pool. |
| fu-orchestration-frameworks | Deep-read LangGraph supervisor/subgraph docs, CrewAI delegation/process docs, AutoGen group chat docs, Microsoft Agent Framework workflows, and OpenAI SDK handoff repo examples. | agent-mechanisms and llm-agent-frameworks notes | A | Need official implementation evidence for current orchestration patterns. |
| fu-reasoning-privacy | Research provider guidance on hidden reasoning, reasoning summaries, trace redaction, and retention. | schema-implications and contradictions/security notes | A | CoT observability affects schema safety. |
| fu-orchestration-benchmarks | Compare benchmark evidence for single-agent, search-based, and multi-agent orchestration approaches. | agent-mechanisms notes | B | Subagent overhead requires empirical tradeoff evidence. |

## Review Gates Not Yet Met

- Each core concept does not yet have two authoritative supporting sources.
- Each modern framework mapping does not yet have both official documentation and repo/changelog evidence.
- Each unresolved conflict has an owner/deadline, but decisions are not reviewed.
- No Phase 0C synthesis RFC has been drafted.
- Agent mechanism track now exists, but many candidates still need second-source corroboration before Phase 0C.
