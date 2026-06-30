# Phase 0A Screening Log

Date: 2026-06-30
Scope: broad candidate screening only.

## Summary

Phase 0A expanded the source matrix from a 72-row seed matrix to a combined 249-row candidate base:

| group | count |
|---|---:|
| curated seed rows | 72 |
| Phase 0A candidate rows | 177 |
| combined matrix rows | 249 |

Candidate rows by track:

| track | candidate rows |
|---|---:|
| ontology engineering | 25 |
| multi-agent systems | 26 |
| agent protocols | 33 |
| statecharts | 21 |
| modern LLM agent frameworks | 40 |
| schema validation | 32 |

## Method Used

- Read current seed matrix in `research/source-matrix.md`.
- Created Phase 0 research method in `docs/rfcs/0000-phase-0-deep-research-method.md`.
- Used Exa searches for current sources across ontology engineering, MAS surveys, protocols, statecharts, LLM frameworks, and schema validation.
- Used Context7 to verify LangGraph as a current high-authority framework documentation source.
- Added foundational sources only where they define enduring concepts that current sources build on.

## Search Notes

Successful first-pass discovery produced strong current candidates for:

- OWL and SHACL co-development.
- LLM-assisted ontology engineering.
- Ontology and knowledge graph lifecycle tooling.
- Current LLM multi-agent system surveys.
- Communication-centric LLM-MAS surveys.
- A2A v1.0 specification and SDK ecosystem.
- OpenAI Agents SDK current docs.
- XState v5 graph, machines, actors, and path generation docs.
- JSON Schema IETF draft work and Zod 4 JSON Schema export.

Some broad parallel Exa queries timed out. Those were replaced by narrower searches for:

- current LLM-MAS surveys,
- A2A protocol sources,
- OpenAI Agents SDK sources,
- statechart docs,
- schema validation docs.

The timed-out searches should be repeated during Phase 0B only when a specific missing source family blocks extraction.

## Current Source Policy

The user requested authority and freshness for 2023-06-30 through 2026-06-30. The matrix now separates:

- `current`: published or materially updated in the requested window.
- `current-docs`: live docs or maintained repos checked in the requested window.
- `foundational`: older concept-defining standards and papers.
- `watch`: secondary sources that may help discovery but cannot support final schema claims alone.

Foundational rows remain necessary for FIPA, KQML, BDI, AgentSpeak, Harel statecharts, SCXML, OWL, RDF, and SHACL. They must be paired with current sources before implementation-facing decisions.

## Phase 0B Priority A Queue

Start deep-reading with these source families:

1. Ontology engineering
   - METHONTOLOGY.
   - Ontology Development 101.
   - OWL 2, RDF 1.1, RDFS, SKOS, JSON-LD, PROV-O, SHACL.
   - LOT methodology.
   - OWL+SHACL co-development paper.
   - LLM ontology engineering systematic review.

2. Multi-agent systems
   - Wooldridge and Jennings.
   - BDI Rao and Georgeff.
   - AgentSpeak.
   - OASIS v2.
   - O-MaSE, Gaia, MaSE, Prometheus.
   - Current LLM-MAS communication and collaboration surveys.

3. Agent protocols
   - FIPA ACL, Communicative Act Library, Interaction Protocol Library, Agent Management, Ontology Service.
   - KQML.
   - MCP latest specification and tools/resources/prompts/auth pages.
   - A2A latest and v1.0 specifications plus v1 changes.
   - Agent Protocol streaming spec.

4. Statecharts
   - Harel statecharts.
   - SCXML.
   - UML state machine spec and formalization survey.
   - XState v5 docs: machines, actors, graph/paths, releases.

5. Modern LLM agent frameworks
   - LangGraph graph API, checkpointers, interrupts.
   - CrewAI agents, tasks, flows, memory.
   - OpenAI Agents SDK guide, Python docs, handoffs, running agents, tracing, guardrails.
   - Microsoft Agent Framework overview, workflows, repo.
   - Pydantic AI and DSPy as schema-first/declarative counterpoints.

6. Schema validation
   - JSON Schema 2020-12 and IETF draft.
   - JSON Schema Test Suite.
   - Zod JSON Schema export and metadata.
   - Pydantic JSON Schema.
   - Ajv, TypeBox, SHACL validation reports, ShEx.
   - Formal JSON Schema semantics.

## Do Not Do Yet

- Do not create canonical schema files.
- Do not implement frontend.
- Do not collapse the six tracks into a single ontology layer.
- Do not cite candidate rows as final evidence until a source note exists.
- Do not treat framework docs as core ontology truth without cross-track corroboration.

## Next Action

Begin Phase 0B with track-level source notes. Recommended first batch:

- `research/source-notes/ontology-engineering/ont-owl-shacl-foundations.md`
- `research/source-notes/multi-agent-systems/mas-bdi-agentspeak-foundations.md`
- `research/source-notes/agent-protocols/proto-fipa-mcp-a2a-foundations.md`
- `research/source-notes/statecharts/state-scxml-xstate-foundations.md`
- `research/source-notes/llm-agent-frameworks/fw-langgraph-openai-crewai-foundations.md`
- `research/source-notes/schema-validation/val-jsonschema-zod-pydantic-foundations.md`
