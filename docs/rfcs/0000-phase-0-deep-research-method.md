# RFC 0000: Phase 0 Deep Research Method

Status: active
Created: 2026-06-30
Scope: research only. Do not design canonical schemas, implement frontend code, or choose runtime adapters in this phase.

## Purpose

Phase 0 establishes the evidence base for an agent ontology engineering framework. Its job is to identify, rank, deep-read, and extract authoritative sources before any schema or frontend implementation begins.

The current `research/source-matrix.md` is a seed matrix, not a finished research base. This RFC turns it into a long-running research program with seven parallel tracks and explicit completion gates.

## Temporal Policy

The project uses two temporal classes:

- `foundational`: older standards, papers, and methodologies that define enduring concepts. Examples: FIPA, KQML, BDI, AgentSpeak, Harel statecharts, SCXML, OWL, RDF, SHACL.
- `current`: sources published or materially updated between 2023-06-30 and 2026-06-30. These are mandatory for modern LLM agent frameworks, MCP/A2A, recent surveys, validation libraries, and implementation docs.

Every source note must include:

- `published_or_updated`
- `last_checked`
- `temporal_class`
- `authority_level`
- `deep_read_priority`

Foundational sources are allowed even when older than 2023-06-30, but they must be paired with current sources before they influence implementation-facing decisions.

## Phase Gates

### Phase 0A: Broad Candidate Screening

Goal: expand the source matrix to 150-250 candidate sources across the seven tracks.

Rules:

- Do not deep-read every source.
- Record only source quality, authority, topic coverage, freshness, and whether it deserves deep reading.
- Prefer primary sources, official docs, original papers, maintained repos, and high-quality surveys.
- Keep commentary, blog posts, and vendor comparisons as secondary or watchlist sources unless they contain otherwise hard-to-find implementation detail.

Artifacts:

- `research/source-matrix.md`
- `research/source-notes/phase-0a-screening-log.md`

Exit criteria:

- At least 150 candidates total.
- At least 20 candidates per track.
- At least 8 current sources per track where current sources exist.
- Each source has a deep-read priority: `A`, `B`, `C`, or `watch`.

### Phase 0B: Parallel Deep-Read Extraction

Goal: turn selected sources into structured evidence.

Rules:

- Deep-read only `A` and high-value `B` sources.
- Extract concepts, relations, lifecycle states, validation rules, protocol fields, and framework-specific adapter candidates.
- Separate fact from inference.
- Record contradictions explicitly.

Artifacts:

- `research/source-notes/<track>/<source-id>.md`
- `research/concept-candidates.md`
- `research/relation-candidates.md`
- `research/schema-implications.md`
- `research/contradictions-and-decisions.md`

Exit criteria:

- Each core concept has at least two authoritative supporting sources.
- Each modern framework mapping has at least one official documentation source and one repo or changelog source.
- Each unresolved conflict has an owner, affected layer, and decision deadline.

### Phase 0C: Synthesis Review

Goal: produce a research-backed ontology design brief without yet implementing it.

Artifacts:

- `docs/rfcs/0001-ontology-layers.md`
- `docs/rfcs/0002-canonical-schema-contract.md`
- `docs/rfcs/0003-statechart-and-protocol-model.md`

Exit criteria:

- Reviewer confirms no unsourced assertions.
- Core ontology is not polluted by framework-specific fields.
- Schema direction is justified by evidence, not preference.

## Parallel Track Protocol

Each track can run in a separate dmux pane, Codex child agent, or manual research lane. Tracks must not edit the same source note file concurrently.

Recommended parallel prompts:

```text
Track owner: Research <TRACK_NAME> for Phase 0A only. Do not design schemas. Expand candidate sources with authority, recency, source type, and deep-read priority. Write findings to research/source-notes/<track>/phase-0a-candidates.md.
```

```text
Track owner: Deep-read only priority A sources for <TRACK_NAME>. Extract concepts, relations, lifecycle states, validation constraints, protocol fields, and contradictions. Use the extraction template in RFC 0000. Do not propose final schema.
```

## Extraction Template

Use this template for every deep-read source:

```markdown
# <source-id>: <title>

metadata:
  domain:
  source_type:
  authority_level:
  temporal_class:
  published_or_updated:
  last_checked:
  url:
  deep_read_priority:

## Why This Source Matters

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|

## Schema Implications

Facts only. No final schema decisions.

## Framework Or Standard Specificity

Which fields are core candidates? Which are adapter-only?

## Contradictions And Open Questions

## Follow-Up Sources
```

## Track 1: Ontology Engineering

Research questions:

- Which ontology engineering methods are still relevant for a hybrid JSON/semantic-web engineering project?
- How should OWL, RDF, SHACL, SKOS, PROV-O, JSON-LD, and upper ontologies be balanced?
- What evidence exists after 2023-06-30 about LLM-assisted ontology engineering, OWL+SHACL co-development, and knowledge graph lifecycle governance?
- Which methodology artifacts should exist before schema work begins?

Candidate source expansion strategy:

- Start with METHONTOLOGY, Ontology 101, NeOn, LOT, MOMO, ODPs, BFO, DOLCE, UFO/gUFO.
- Add W3C standards and current working drafts that affect validation or provenance.
- Add 2023-2026 papers on LLM-assisted ontology engineering, ontology/KG lifecycle, SHACL generation, and ontology reuse.

Deep-read standards:

- Priority A: primary methods, W3C standards, and papers with explicit methodology or validation implications.
- Priority B: tools that operationalize OWL/SHACL/RDF/JSON-LD workflow.
- Priority C/watch: commentary or broad summaries.

Product paths:

- `research/source-notes/ontology-engineering/`
- `research/concept-candidates.md`
- `research/schema-implications.md`

Definition of Done:

- At least 25 candidates.
- At least 10 current sources.
- At least 8 priority A sources deep-read before Phase 0C.
- Clear evidence on whether JSON Schema-first and JSON-LD/OWL export is acceptable.

## Track 2: Multi-Agent Systems

Research questions:

- Which classical MAS concepts must be first-class in the ontology?
- How do BDI, AgentSpeak, OASIS, O-MaSE, Gaia, MaSE, and Prometheus differ in role, goal, plan, capability, and organization modeling?
- What changed in 2023-2026 LLM-based MAS surveys around communication, collaboration, memory, planning, evaluation, and coordination?
- Which concepts are enduring MAS theory versus LLM-era implementation fashion?

Candidate source expansion strategy:

- Start with Wooldridge/Jennings, BDI, AgentSpeak, Jason, OASIS v2, O-MaSE, Gaia, MaSE, Prometheus, Tropos.
- Add 2023-2026 surveys on LLM-based multi-agent systems, communication-centric MAS, collaboration mechanisms, and orchestration.
- Add maintained academic resource lists only as discovery aids, not primary evidence.

Deep-read standards:

- Priority A: original concepts and recent surveys with explicit taxonomies.
- Priority B: implementation frameworks with formal semantics or strong documentation.
- Priority C/watch: benchmark lists and broad application surveys.

Product paths:

- `research/source-notes/multi-agent-systems/`
- `research/concept-candidates.md`
- `research/relation-candidates.md`

Definition of Done:

- At least 25 candidates.
- At least 10 current sources.
- Classical MAS concepts are separated from LLM-specific system patterns.
- Every proposed mental-state concept has direct BDI/AgentSpeak/OASIS evidence.

## Track 3: Agent Protocols

Research questions:

- What is the minimum canonical message/protocol model that covers FIPA, KQML, MCP, A2A, Agent Protocol, OpenAPI, AsyncAPI, and CloudEvents?
- How do agent-to-tool, agent-to-agent, event-driven, and API-facing protocols differ?
- How should task lifecycle, message lifecycle, artifact streaming, discovery, security, and version negotiation be represented?
- Which protocol fields are normative and which are implementation conveniences?

Candidate source expansion strategy:

- Start with FIPA ACL, Communicative Act Library, Interaction Protocol Library, Agent Management, Ontology Service, and KQML.
- Add current MCP specification pages, SDK docs, authorization docs, and change logs.
- Add A2A v1.0 specification, repository, SDKs, and release notes.
- Add Agent Protocol, OpenAPI 3.1, AsyncAPI, CloudEvents, JSON-RPC, SSE, and OAuth references where protocol shape depends on them.

Deep-read standards:

- Priority A: normative protocol specifications.
- Priority B: official SDKs and current migration/release notes.
- Priority C/watch: explainer blogs and comparisons.

Product paths:

- `research/source-notes/agent-protocols/`
- `research/relation-candidates.md`
- `research/contradictions-and-decisions.md`

Definition of Done:

- At least 25 candidates.
- At least 12 current sources.
- Normative versus non-normative artifacts are explicitly labeled.
- MCP and A2A are not collapsed into one protocol layer.

## Track 4: Statecharts

Research questions:

- Which statechart concepts are required for agent lifecycle, task lifecycle, protocol lifecycle, and frontend visualization?
- What does SCXML require that XState does not directly expose, and vice versa?
- How do statechart testing, graph path generation, snapshots, actors, and visual modeling affect research artifacts?
- Which features belong in the canonical statechart model versus adapter-only XState fields?

Candidate source expansion strategy:

- Start with Harel statecharts, SCXML, UML state machines, XState v5 docs, Stately Studio, and statecharts.dev.
- Add current XState repo, changelog, graph/path docs, model-based testing docs, and actor model docs.
- Add statechart execution/testing libraries for cross-implementation sanity checks.

Deep-read standards:

- Priority A: Harel, SCXML, XState v5 docs, graph/path docs.
- Priority B: UML formalization and model-based testing surveys.
- Priority C/watch: tutorials and older runtime libraries.

Product paths:

- `research/source-notes/statecharts/`
- `research/schema-implications.md`
- `research/contradictions-and-decisions.md`

Definition of Done:

- At least 20 candidates.
- At least 8 current sources.
- Clear distinction between statechart semantics and visualization convenience.
- Evidence supports nested states, parallel regions, guards, actions, actors, snapshots, and path generation.

## Track 5: Modern LLM Agent Frameworks

Research questions:

- Which abstractions recur across modern LLM agent frameworks after 2023?
- Which fields are framework-neutral versus adapter-only?
- How do LangGraph, CrewAI, OpenAI Agents SDK, Microsoft Agent Framework, AutoGen, Semantic Kernel, LlamaIndex, Pydantic AI, Google ADK, DSPy, and adjacent projects model tools, memory, state, handoffs, tracing, and evaluation?
- What changed between 2023-06-30 and 2026-06-30?

Candidate source expansion strategy:

- Use official docs first, then maintained repos, then release notes/changelogs.
- Use Context7 for current framework documentation before deep extraction.
- Add recent surveys only to identify missing frameworks and evaluation dimensions.

Deep-read standards:

- Priority A: official docs for current APIs and concepts.
- Priority B: repos, changelogs, examples, and migration docs.
- Priority C/watch: vendor comparisons and practitioner summaries.

Product paths:

- `research/source-notes/llm-agent-frameworks/`
- `research/schema-implications.md`
- `research/contradictions-and-decisions.md`

Definition of Done:

- At least 35 candidates.
- At least 20 current sources.
- Each framework has at least one official doc and one repo/release-note source.
- Core ontology candidate fields are separated from adapter-only fields.

## Track 6: Schema Validation

Research questions:

- Which validation layers are needed: structural, semantic graph, runtime, code generation, API contract, and AI tool-call contract?
- Where do JSON Schema, Zod, Pydantic, Ajv, TypeBox, CUE, JTD, OpenAPI Schema, SHACL, TypeScript, and emerging validation tools overlap or diverge?
- What current evidence exists about schema drift, bidirectional conversion, and cross-language contracts?
- Which validation artifacts must be generated before frontend or runtime work begins?

Candidate source expansion strategy:

- Start with JSON Schema 2020-12, IETF JSON Schema drafts, JSON Schema Test Suite, SHACL, Zod 4, Pydantic v2, Ajv, TypeBox, CUE, JTD, OpenAPI Schema.
- Add current converter/benchmark projects only if maintained and technically specific.
- Add papers on formal JSON Schema semantics and validation complexity.

Deep-read standards:

- Priority A: standards and official docs.
- Priority B: maintained validators/converters with test suite claims.
- Priority C/watch: comparison blogs.

Product paths:

- `research/source-notes/schema-validation/`
- `research/schema-implications.md`
- `research/contradictions-and-decisions.md`

Definition of Done:

- At least 25 candidates.
- At least 10 current sources.
- Clear evidence for structural versus semantic validation split.
- Conversion limits between JSON Schema, Zod, Pydantic, TypeScript, and SHACL are documented.

## Track 7: Agent Mechanisms And Orchestration

Research questions:

- Which mechanism primitives underlie LLM agents beyond framework APIs and protocol envelopes?
- How do CoT, self-consistency, ReAct, ToT, GoT, MoT, Reflexion, Self-Refine, planning/search, debate, verification, memory/reflection, and subagent orchestration differ?
- Which mechanisms are core ontology candidates versus prompting/runtime strategies?
- How should subagent orchestration represent task decomposition, routing, worker selection, topology, budget, feedback, state, evaluator/verifier roles, and context isolation?

Candidate source expansion strategy:

- Start with CoT, Self-Consistency, Zero-shot CoT, Least-to-Most, Program-of-Thoughts, Plan-and-Solve, Step-Back, ReAct, Reflexion, Self-Refine, Tree of Thoughts, Graph of Thoughts, Mixture-of-Thought, LATS, RAFA, RAP, and multi-agent debate.
- Add current surveys on reasoning topologies, prompt taxonomies, LLM agent mechanisms, and multi-agent orchestration.
- Add implementation-facing sources for AutoGen, CAMEL, MetaGPT, ChatDev, AgentVerse, OpenAI Agents orchestration, Anthropic multi-agent research, AOrchestra, Uno-Orchestra, and AgentOrchestra.

Deep-read standards:

- Priority A: original papers and high-quality surveys with explicit mechanism taxonomies.
- Priority B: framework docs, repos, and production writeups that implement or operationalize the mechanisms.
- Priority C/watch: commentary, benchmark lists, and broad comparisons.

Product paths:

- `research/source-notes/agent-mechanisms/`
- `research/concept-candidates.md`
- `research/relation-candidates.md`
- `research/schema-implications.md`
- `research/contradictions-and-decisions.md`

Definition of Done:

- At least 40 mechanism/orchestration candidates.
- At least 15 current mechanism/orchestration sources.
- Core mechanism types are separated from framework/protocol artifacts.
- Evidence covers reasoning topology, action loops, feedback/reflection, search/planning, orchestration topology, context isolation, and delegation ownership.

## Review Checklist

Before Phase 0C:

- No source without a reason to exist.
- No current framework claim without a current official source.
- No implementation-facing decision based only on a survey.
- No canonical ontology field based only on one vendor framework.
- No deep-read note without direct evidence.
- No unresolved contradiction hidden inside summary prose.

## Strategic Compact Points

Use `/compact` after:

- Phase 0A candidate pool reaches 150+ sources.
- Each batch of track-level deep-read notes is completed.
- Before starting Phase 0C synthesis.

Before compacting, make sure current conclusions are written to files, not only present in chat context.
