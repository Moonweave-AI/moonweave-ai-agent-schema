# agent-schema Source Matrix

This report summarizes the initial evidence base for the v2 upgrade. The durable machine-readable source of truth is `references/source-catalog.yaml`; claim-level mappings live in `references/evidence-matrix.yaml`.

## Coverage

| Theme | Initial authoritative coverage |
| --- | --- |
| Cognitive loop | CoALA, ReAct, Wang survey, Xi survey |
| Planning/reasoning | ReAct, Tree of Thoughts, planning survey, Anthropic workflows |
| Reflection | Reflexion, Generative Agents, Tree of Thoughts, planning survey |
| Memory | CoALA, Generative Agents, Voyager, 2026 memory survey, LlamaIndex docs |
| Tool use | Toolformer, MCP, OpenAI Agents SDK, Tool/action benchmark sources |
| Multi-agent | A2A, Anthropic workflows, CrewAI, Microsoft Agent Framework, Xi survey |
| Protocol interop | MCP, A2A, OpenAI Agents SDK, Microsoft Agent Framework |
| Runtime/state | OpenAI Agents SDK, LangGraph, Microsoft Agent Framework, Google ADK, SWE-agent |
| Observability | OpenAI Agents SDK, Microsoft Agent Framework, Google ADK, CrewAI, evaluation survey |
| Evaluation | AgentBench, WebArena, SWE-bench, SWE-agent, AgentDojo, evaluation survey |
| Safety/security | AgentDojo, Progent, Fides, LangChain HITL, OpenAI guardrail surfaces |
| Permissions | Progent, Fides, A2A auth, OpenAI approvals, LangChain HITL |
| UI/graph presentation | C4, BPMN, Graphviz dot, Mermaid, SWE-agent ACI |

## Source Tier Notes

- Tier A sources are normative by default when their domain matches the ontology claim.
- Tier B sources require explicit approval in the catalog and cannot silently override Tier A sources.
- Tier C sources may inform examples only.
- Unverified placeholder sources are blocked from normative evidence.

## Known Gaps

- The current matrix is an authoritative seed, not a final exhaustive venue crawl.
- The next research pass must add explicit included/excluded records for each named venue and year.
- Planned v2 view ids in the evidence matrix still need matching `GraphView` artifacts.

