# agent-schema Source Matrix

This report summarizes the evidence base for the v2 upgrade. The durable machine-readable source of truth is split across `references/source-catalog.yaml`, `references/evidence-matrix.yaml`, and `references/venue-coverage.yaml`.

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

## Venue Coverage Gate

`references/venue-coverage.yaml` records the required 2022-2026 review scope for NeurIPS, ICLR, ICML, ACL, EMNLP, NAACL, COLING, WWW, CHI, UIST, SOSP, OSDI, USENIX Security, IEEE S&P, CCS, and NDSS. `tools/check-venue-coverage.mjs` expands the compact year arrays into 80 venue/year checkpoints and verifies:

- every required venue/year has a reviewed entry
- every entry records search queries, reviewed themes, included or excluded sources, and exclusion rationale
- included source ids resolve to `source-catalog.yaml`
- `gap.venue_exhaustive_index` is not high/blocking unless explicitly reopened

## Exclusions

Excluded papers and search bands are not treated as failed research. They are auditable decisions: a source is excluded when it does not support a named ontology node, edge, constraint, view, benchmark, protocol, runtime, safety, evaluation, or presentation claim.

## Residual Gaps

- Future releases should continue refining venue entries as new 2026 proceedings and agent safety papers become available.
- Candidate sources can inform examples, but they still cannot support normative claims.
- Browser-captured screenshots can replace the current generated PNG previews if a Playwright browser dependency is later accepted.
