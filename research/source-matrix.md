# Agent Ontology Engineering Source Matrix

Generated: 2026-06-30
Basis: `research/ai-agent-architecture-standards.md`
Purpose: authoritative source matrix for a framework-neutral agent ontology, schema contract, and XState-like visualization model.

## Matrix Columns

| Column | Meaning |
|---|---|
| `id` | Stable source identifier for citation and extraction work. |
| `domain` | One of ontology-engineering, multi-agent-systems, agent-protocols, statecharts, llm-agent-frameworks, schema-validation, agent-mechanisms. |
| `source` | Paper, standard, official documentation, or open-source project. |
| `source_type` | standard, paper, official-doc, repo, methodology, survey. |
| `authority` | primary, secondary, or implementation. |
| `key_concepts` | Concepts to extract into the ontology. |
| `schema_design_impact` | Concrete implication for canonical schema design. |
| `layers` | Phase 0 ontology layers affected. |
| `confidence` | high, medium, or low. |
| `status` | seeded, added, needs-full-extraction, or watch-current-docs. |

## Source Selection Rules

- Prefer primary standards, original papers, official docs, and maintained repositories.
- Treat surveys as secondary evidence for taxonomy coverage, not as schema truth.
- Put framework-specific concepts in adapter mappings unless they generalize cleanly.
- Every source must produce at least one schema implication or be removed from the matrix.
- Current framework docs should be rechecked before implementation because APIs change quickly.

## Phase 0B Source-First Expansion Notice

This matrix was created before the source-first correction in Phase 0B and is schema-facing by design. Do not treat it as the complete Phase 0B source inventory.

The expanded source corpus for Phase 0B is recorded in:

- `research/source-notes/phase-0b-expanded-literature-corpus.md` (149 literature, standards, and paper candidates)
- `research/source-notes/phase-0b-expanded-engineering-corpus.md` (179 official docs, repos, specs, and benchmark harnesses)
- `research/source-registry.md` (current Phase 0C preparation registry guide)
- `research/source-notes/phase-0c-preparation.md` (current Phase 0C preparation boundary)

During Phase 0C preparation, new sources should be added to the expanded corpus notes and regenerated into `research/source-registry.csv`, rather than added directly to this schema-facing matrix.

## 1. Ontology Engineering

| id | source | source_type | authority | key_concepts | schema_design_impact | layers | confidence | status |
|---|---|---:|---:|---|---|---|---:|---|
| ont-methontology-1997 | [METHONTOLOGY: From Ontological Art Towards Ontological Engineering](https://aaai.org/papers/0005-ss97-06-005-methontology-from-ontological-art-towards-ontological-engineering/) | methodology | primary | specification, conceptualization, formalization, implementation, maintenance | Add lifecycle fields for ontology artifacts: `scope`, `competencyQuestions`, `conceptualModel`, `formalModel`, `implementationTarget`, `maintenanceStatus`. | L0, L1, L6 | high | added |
| ont-ontology101-2001 | [Ontology Development 101](https://protege.stanford.edu/publications/ontology_development/ontology101.pdf) | methodology | primary | classes, slots, facets, instances, reuse, iteration | Add explicit separation between `Class`, `Property`, `Constraint`, `Instance`, and `Example`; support iterative revision notes. | L1, L6 | high | added |
| ont-owl2-2012 | [OWL 2 Web Ontology Language Document Overview](https://www.w3.org/TR/owl2-overview/) | standard | primary | ontology, class, object property, data property, individual, axiom, profile | Ensure conceptual ontology can export to OWL class/property/individual/axiom structures without losing IDs or provenance. | L1, L6 | high | added |
| ont-rdf11-2014 | [RDF 1.1 Concepts and Abstract Syntax](https://www.w3.org/TR/rdf11-concepts/) | standard | primary | IRI, literal, blank node, triple, graph, dataset | Canonical IDs should be URI-safe; relationships should be serializable as subject-predicate-object triples. | L0, L1, L6 | high | added |
| ont-rdfs-2014 | [RDF Schema 1.1](https://www.w3.org/TR/rdf-schema/) | standard | primary | class, property, domain, range, subclass, subproperty | Add `domain`, `range`, `subClassOf`, and `subPropertyOf` fields for ontology relations. | L1, L6 | high | added |
| ont-skos-2009 | [SKOS Simple Knowledge Organization System Reference](https://www.w3.org/TR/skos-reference/) | standard | primary | concept scheme, broader, narrower, related, prefLabel, altLabel | Use SKOS-like label and taxonomy fields for human-facing concept browsing and synonym management. | L0, L1, L7 | high | added |
| ont-jsonld11-2020 | [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) | standard | primary | context, compaction, expansion, IRI mapping, graph data | Add optional `@context` generation path for JSON artifacts that need semantic web compatibility. | L0, L6 | high | added |
| ont-prov-o-2013 | [PROV-O: The PROV Ontology](https://www.w3.org/TR/prov-o/) | standard | primary | entity, activity, agent, derivation, attribution, generation | Add required provenance fields: `derivedFrom`, `wasAttributedTo`, `generatedAt`, `extractionActivity`, `reviewStatus`. | L0, L8 | high | added |
| ont-shacl-2017 | [SHACL: Shapes Constraint Language](https://www.w3.org/TR/shacl/) | standard | primary | node shape, property shape, target, constraint component, validation report | Add SHACL target mapping for semantic validation beyond JSON Schema structural checks. | L6, L8 | high | added |
| ont-bfo-2020 | [Basic Formal Ontology](https://basic-formal-ontology.org/) | ontology | primary | continuant, occurrent, role, function, process, disposition | Use as optional upper-ontology alignment for role/function/process distinctions; do not force into MVP core. | L1, L2 | medium | needs-full-extraction |
| ont-odp | [Ontology Design Patterns](https://ontologydesignpatterns.org/) | methodology | secondary | content patterns, modeling pattern reuse, competency questions | Track reusable modeling patterns for provenance, roles, plans, events, and collections. | L1, L4, L6 | medium | needs-full-extraction |
| ont-dcterms | [DCMI Metadata Terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) | standard | primary | title, creator, contributor, created, modified, source, license | Reuse common metadata names for `SourceRecord`, `SchemaArtifact`, and `DecisionRecord`. | L0 | high | added |

## 2. Multi-Agent Systems

| id | source | source_type | authority | key_concepts | schema_design_impact | layers | confidence | status |
|---|---|---:|---:|---|---|---|---:|---|
| mas-wooldridge-jennings-1995 | [Intelligent Agents: Theory and Practice](https://link.springer.com/article/10.1007/BF00805258) | paper | primary | autonomy, reactivity, proactiveness, social ability | Add agent property facets separate from implementation capabilities: `autonomyLevel`, `reactivity`, `proactivity`, `socialAbility`. | L2, L3 | high | seeded |
| mas-atal-survey-1994 | [Agent Theories, Architectures, and Languages: A Survey](https://eprints.soton.ac.uk/252177/) | survey | secondary | agent theories, architectures, languages, deliberative/reactive split | Add architecture taxonomy field for agents and workflows; use survey only for coverage checks. | L2, L3 | medium | seeded |
| mas-bdi-rao-georgeff-1991 | [Modeling Rational Agents within a BDI-Architecture](https://jmvidal.cse.sc.edu/library/rao91a.pdf) | paper | primary | belief, desire, intention, commitment, possible worlds | Model `Belief`, `Goal`, and `Intention` as distinct classes; add commitment strategy metadata. | L3 | high | seeded |
| mas-bdi-theory-practice-1995 | [BDI Agents: From Theory to Practice](https://cdn.aaai.org/ICMAS/1995/ICMAS95-042.pdf) | paper | primary | BDI theory, PRS, dMARS, practical agent systems | Add bridge fields between mental-state theory and executable plan libraries. | L3, L8 | high | seeded |
| mas-agentspeak-1996 | [AgentSpeak(L): BDI Agents Speak Out in a Logical Computable Language](https://link.springer.com/chapter/10.1007/BFb0031845) | paper | primary | beliefs, triggering events, contexts, plan bodies, goals | Add AgentSpeak-like `Plan` fields: `trigger`, `contextCondition`, `body`, `subgoals`, `failureHandling`. | L3, L4 | high | seeded |
| mas-jason | [Jason AgentSpeak Interpreter](https://jason-lang.github.io/) | repo | implementation | AgentSpeak runtime, selection functions, belief revision, internal actions | Adapter should preserve runtime hooks such as `selectEvent`, `selectOption`, `selectIntention`, and belief revision function. | L3, L5 | high | seeded |
| mas-bdi-survey-2020 | [BDI Agent Architectures: A Survey](https://www.ijcai.org/proceedings/2020/0684.pdf) | survey | secondary | BDI architecture variants, practical implementation concerns | Use as taxonomy coverage check for BDI constructs and plan lifecycle edge cases. | L3, L8 | medium | seeded |
| mas-oasis-v2-2023 | [OASIS v2: Ontology for Agents, Systems and Integration of Services](https://arxiv.org/abs/2306.10061) | ontology-paper | primary | agent template, concrete agent, behavior, goal, task, commitment, entrustment | Add behavioristic modeling path: represent agents through capabilities, tasks, commitments, and entrustments. | L2, L3, L4 | high | seeded |
| mas-mas-ontology-2016 | [MAS Ontology: Ontology for Multiagent Systems](https://www.scitepress.org/PublishedPapers/2016/58701/) | ontology-paper | primary | methodology, phase, work product, autonomy, sociality, mobility | Add methodology/work-product dimension for research provenance and engineering process artifacts. | L0, L2, L8 | medium | seeded |
| mas-omase-2007 | [O-MaSE: A Customizable Approach to Developing Multiagent Development Processes](https://doi.org/10.1007/978-3-540-79488-2_1) | methodology | primary | organization, role, goal, capability, protocol, method fragment | Add `Organization`, `Role`, `Goal`, `Capability`, and `Protocol` as first-class entities, with method-fragment provenance. | L2, L4, L8 | high | seeded |
| mas-gaia-2000 | [The Gaia Methodology for Agent-Oriented Analysis and Design](https://link.springer.com/article/10.1023/A:1010071910869) | methodology | primary | roles, permissions, responsibilities, protocols, organizations | Add role schema fields for permissions, responsibilities, liveness/safety properties, and protocol participation. | L2, L4, L8 | medium | needs-full-extraction |
| mas-jade | [JADE Agent Framework](https://jade.tilab.com/) | repo | implementation | FIPA-compliant agents, containers, DF, AMS, ACL messaging | Add implementation mapping for FIPA platform concepts and directory services. | L2, L4, L5 | high | seeded |

## 3. Agent Protocols

| id | source | source_type | authority | key_concepts | schema_design_impact | layers | confidence | status |
|---|---|---:|---:|---|---|---|---:|---|
| proto-fipa-acl-2002 | [FIPA ACL Message Structure Specification](http://www.fipa.org/specs/fipa00061/) | standard | primary | performative, sender, receiver, content, language, ontology, protocol, conversation-id | Canonical `Message` must separate speech act, participants, content, content description, and conversation control. | L4, L6 | high | seeded |
| proto-fipa-act-2002 | [FIPA Communicative Act Library Specification](http://www.fipa.org/specs/fipa00037/) | standard | primary | inform, request, agree, refuse, cfp, propose, failure | Use controlled vocabulary for `performative`; allow extensions but require provenance. | L4 | high | added |
| proto-fipa-ip-2002 | [FIPA Interaction Protocol Library](http://www.fipa.org/specs/fipa00025/) | standard | primary | request, query, contract-net, subscribe, propose, auction protocols | Model `Protocol` as stateful interaction templates with roles, allowed performatives, and termination conditions. | L4, L7 | high | seeded |
| proto-fipa-agent-management | [FIPA Agent Management Specification](http://www.fipa.org/specs/fipa00023/) | standard | primary | AMS, DF, ACC, AID, registration, lifecycle | Add `AgentIdentifier`, `DirectoryService`, `Platform`, and FIPA lifecycle state mapping. | L2, L4 | high | seeded |
| proto-fipa-ontology-service | [FIPA Ontology Service Specification](http://www.fipa.org/specs/fipa00086/) | standard | primary | ontology agent, ontology registration, lookup, translation | Add `OntologyRegistry` and `OntologyMapping` entities for cross-agent semantic mediation. | L0, L4, L6 | medium | needs-full-extraction |
| proto-kqml-1994 | [KQML as an Agent Communication Language](https://doi.org/10.1145/191246.191322) | paper | primary | performatives, content layer, message layer, communication layer, facilitators | Preserve layered message design and facilitator pattern for brokered communication. | L4 | high | seeded |
| proto-kqml-spec | [KQML Specification](https://www.cs.umbc.edu/kqml/kqmlspec/spec.html) | specification | primary | ask, tell, subscribe, achieve, register, routing | Add legacy performative mapping table and message-layer compatibility notes. | L4, L5 | medium | seeded |
| proto-mcp | [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/) | standard | primary | tools, resources, prompts, transports, JSON-RPC, capability discovery | Canonical `Tool` and `Resource` schemas should align with MCP discoverability, input schemas, and transport-neutral invocation. | L2, L4, L5, L6 | high | seeded |
| proto-a2a | [Agent2Agent Protocol](https://github.com/a2aproject/A2A) | standard/repo | primary | agent card, task lifecycle, messages, artifacts, streaming, push notifications | Add `AgentCard`, remote capability advertisement, task lifecycle, and artifact/message stream schema. | L2, L4, L5, L7 | high | seeded |
| proto-agent-protocol | [Agent Protocol](https://langchain-ai.github.io/agent-protocol/) | specification | primary | agent search, schemas, threads, runs, streaming, state snapshots | Add deployment-facing entities for thread/run/state/config schema introspection. | L4, L5, L6, L8 | medium | added |
| proto-openapi | [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) | standard | primary | paths, operations, parameters, request bodies, responses, schema object | Use OpenAPI mapping for HTTP tool/API surfaces; keep separate from ontology core. | L5, L6 | high | added |
| proto-asyncapi | [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/latest) | standard | primary | channels, messages, operations, bindings, event-driven APIs | Use for pub/sub and event bus adapter mappings; add channel/message binding fields. | L4, L5, L6 | high | added |
| proto-cloudevents | [CloudEvents Specification](https://github.com/cloudevents/spec) | standard | primary | event envelope, source, type, subject, id, time, data | Add optional common event envelope for cross-runtime state/protocol events. | L4, L6, L8 | high | added |

## 4. Statecharts

| id | source | source_type | authority | key_concepts | schema_design_impact | layers | confidence | status |
|---|---|---:|---:|---|---|---|---:|---|
| state-harel-1987 | [Statecharts: A Visual Formalism for Complex Systems](https://doi.org/10.1016/0167-6423(87)90035-9) | paper | primary | hierarchy, orthogonality, broadcast events, visual state modeling | XState-like model must support nested states, parallel regions, events, and visual decomposition. | L1, L7 | high | added |
| state-scxml-2015 | [SCXML: State Machine Notation for Control Abstraction](https://www.w3.org/TR/scxml/) | standard | primary | state, transition, event, datamodel, executable content, invoke, final | Add SCXML-compatible fields for state IDs, initial states, data model, invocations, transitions, and final states. | L1, L7 | high | seeded |
| state-uml | [OMG UML Specification](https://www.omg.org/spec/UML/) | standard | primary | state machine, region, transition, trigger, guard, effect, pseudostate | Use as secondary standard alignment for regions, guards, effects, and composite state terminology. | L1, L7 | medium | needs-full-extraction |
| state-xstate-docs | [XState and Stately Documentation](https://stately.ai/docs) | official-doc | primary | machine, actor, event, context, guard, action, invoked actor, snapshot | Canonical visual graph should separate `machine`, `stateNode`, `transition`, `event`, `guard`, `action`, and `actorRef`. | L7 | high | watch-current-docs |
| state-xstate-repo | [statelyai/xstate](https://github.com/statelyai/xstate) | repo | implementation | actor-based orchestration, statecharts, graph utilities, model-based testing | Adapter should export to XState-compatible machine JSON or a deterministic graph subset. | L5, L7, L8 | high | watch-current-docs |
| state-stately-studio | [Stately Studio](https://stately.ai) | official-doc | implementation | visual design, simulation, collaboration, generated diagrams | Frontend MVP should learn from visual panels: graph, code/schema, events, actors, snapshot/state. | L7 | medium | watch-current-docs |
| state-sismic | [Sismic Statechart Interpreter](https://sismic.readthedocs.io/) | repo | implementation | YAML statecharts, execution, testing, contracts | Use as cross-check that statechart artifacts are not too XState-specific. | L7, L8 | medium | needs-full-extraction |
| state-scion | [SCION-CORE](https://github.com/jbeard4/SCION-CORE) | repo | implementation | SCXML runtime, execution semantics, JavaScript interpreter | Use as interoperability check for SCXML imports/exports and execution semantics. | L7 | low | needs-full-extraction |

## 5. Modern LLM Agent Frameworks

| id | source | source_type | authority | key_concepts | schema_design_impact | layers | confidence | status |
|---|---|---:|---:|---|---|---|---:|---|
| fw-langgraph-docs | [LangGraph Documentation](https://docs.langchain.com/oss/python/langgraph/overview) | official-doc | primary | StateGraph, node, edge, state schema, reducers, checkpointing, persistence, human-in-the-loop | Add framework adapter mapping for graph, node, edge, state channels, checkpoints, and thread-scoped persistence. | L5, L6, L8 | high | watch-current-docs |
| fw-langgraph-repo | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | repo | implementation | resilient language agents as graphs | Use implementation repository for fixture parity and graph export examples. | L5, L8 | high | watch-current-docs |
| fw-crewai-docs | [CrewAI Documentation](https://docs.crewai.com/) | official-doc | primary | agent, task, crew, flow, process, memory, tools | Adapter should map role/goal/backstory/task/crew/process into framework-specific extensions. | L2, L5, L6 | high | watch-current-docs |
| fw-crewai-repo | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | repo | implementation | role-based agents, crews, flows, MCP integration | Use as implementation source for required/optional fields and execution modes. | L5, L8 | high | watch-current-docs |
| fw-openai-agents-python | [OpenAI Agents SDK Python](https://openai.github.io/openai-agents-python/) | official-doc | primary | agent, handoff, tool, guardrail, tracing, session | Add handoff, guardrail, trace, and session concepts as adapter fields; keep core neutral. | L2, L5, L8 | high | watch-current-docs |
| fw-openai-agents-js | [OpenAI Agents SDK JavaScript](https://github.com/openai/openai-agents-js) | repo | implementation | TypeScript agents, tools, handoffs, guardrails | Use for TypeScript schema ergonomics and JS runtime adapter fixtures. | L5, L6, L8 | high | watch-current-docs |
| fw-microsoft-agent-framework-docs | [Microsoft Agent Framework Documentation](https://learn.microsoft.com/en-us/agent-framework/overview/) | official-doc | primary | agents, workflows, orchestration patterns, human-in-the-loop, hosting | Adapter should map graph-based workflows, durable execution, and hosting concepts without becoming Azure-specific. | L5, L8 | high | watch-current-docs |
| fw-microsoft-agent-framework-repo | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | repo | implementation | Python/.NET agents, workflows, A2A hosting, durable tasks | Use for cross-language adapter constraints and A2A integration fixtures. | L5, L8 | high | watch-current-docs |
| fw-autogen | [Microsoft AutoGen](https://microsoft.github.io/autogen/) | official-doc/repo | implementation | conversable agents, group chat, user proxy, tool execution | Keep as historical adapter source for conversation-centric multi-agent systems and group chat abstractions. | L5 | medium | watch-current-docs |
| fw-semantic-kernel-agents | [Semantic Kernel Agent Framework](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/) | official-doc | primary | agents, plugins, orchestration, conversations | Use as Microsoft ecosystem cross-check, especially for tool/plugin terminology. | L5 | medium | watch-current-docs |
| fw-llamaindex-workflows | [LlamaIndex Workflows](https://docs.llamaindex.ai/en/stable/module_guides/workflow/) | official-doc | primary | event-driven workflows, steps, events, context, agents | Add event-driven workflow mapping distinct from graph-edge propagation. | L4, L5, L7 | medium | watch-current-docs |
| fw-pydantic-ai | [Pydantic AI](https://ai.pydantic.dev/) | official-doc/repo | primary | agents, dependencies, tools, structured outputs, type-safe validation | Use as schema-first agent framework reference for typed dependencies and output validation. | L5, L6 | medium | watch-current-docs |
| fw-dspy-2024 | [DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines](https://arxiv.org/abs/2310.03714) | paper/repo | primary | signatures, modules, optimizers, declarative LM programs | Add optional `Signature` and optimization/evaluation metadata for prompt-program style agents. | L2, L5, L8 | high | seeded |
| fw-google-adk | [Google Agent Development Kit](https://google.github.io/adk-docs/) | official-doc | primary | agents, tools, sessions, artifacts, callbacks, deployment | Use as vendor-neutrality check and adapter candidate for session/artifact concepts. | L5, L8 | medium | needs-full-extraction |
| fw-swarm | [OpenAI Swarm](https://github.com/openai/swarm) | repo | implementation | educational handoffs, routines, lightweight agents | Use only as historical context for handoff modeling; prefer Agents SDK for current schema. | L5 | medium | seeded |

## 6. Schema Validation

| id | source | source_type | authority | key_concepts | schema_design_impact | layers | confidence | status |
|---|---|---:|---:|---|---|---|---:|---|
| val-json-schema-core-2020-12 | [JSON Schema Core 2020-12](https://json-schema.org/draft/2020-12/json-schema-core) | standard | primary | schema document, vocabulary, dialect, `$id`, `$ref`, annotations | Canonical JSON schemas must define `$id`, `$schema`, stable refs, and versioned dialects. | L6 | high | added |
| val-json-schema-validation-2020-12 | [JSON Schema Validation 2020-12](https://json-schema.org/draft/2020-12/json-schema-validation) | standard | primary | assertions, annotations, formats, required, enum, dependent schemas | Use validation keywords for structural invariants; reserve SHACL/OWL for graph-semantic constraints. | L6, L8 | high | added |
| val-json-schema-site | [JSON Schema Specification](https://json-schema.org/specification) | standard | primary | core, validation, vocabularies, output formats | Track canonical spec bundle and output format for validation reports. | L6, L8 | high | added |
| val-zod | [Zod Documentation](https://zod.dev/) | official-doc/repo | primary | TypeScript-first schemas, inference, metadata, registries, JSON Schema export | Generate TypeScript-first authoring schemas and export JSON Schema while preserving metadata and IDs. | L6 | high | watch-current-docs |
| val-ajv | [Ajv JSON Schema Validator](https://ajv.js.org/) | repo | implementation | JSON Schema validation, formats, strict mode, code generation | Use as primary JS validator candidate for fixtures and CI validation. | L6, L8 | high | added |
| val-typebox | [TypeBox](https://github.com/sinclairzx81/typebox) | repo | implementation | JSON Schema builders with static TypeScript types | Alternative if JSON Schema should be source of truth with TypeScript inference. | L6 | medium | needs-full-extraction |
| val-pydantic | [Pydantic Documentation](https://docs.pydantic.dev/latest/) | official-doc/repo | primary | Python validation, BaseModel, JSON Schema, strict mode | Use for Python adapter generation and validation fixtures across LangGraph/CrewAI ecosystems. | L5, L6 | high | added |
| val-typescript | [TypeScript Handbook](https://www.typescriptlang.org/docs/) | official-doc | primary | structural typing, discriminated unions, generics, literal types | Use discriminated unions for `SourceRecord`, `StateNode`, `Transition`, and framework adapters. | L6 | high | added |
| val-jtd-rfc8927 | [RFC 8927: JSON Type Definition](https://www.rfc-editor.org/rfc/rfc8927) | standard | primary | closed schemas, discriminators, nullable, refs | Consider as a compact alternative for transport schemas; not primary because JSON Schema has broader ecosystem fit. | L6 | medium | needs-full-extraction |
| val-cue | [CUE Language](https://cuelang.org/docs/) | official-doc/repo | primary | constraints as values, unification, validation, data templating | Candidate for future configuration validation and schema composition; not MVP source of truth. | L6, L8 | medium | needs-full-extraction |
| val-openapi-schema | [OpenAPI Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) | standard | primary | schema object, request/response validation, nullable, discriminator | Use for API-facing exports, but do not treat OpenAPI Schema as the ontology source of truth. | L5, L6 | high | added |
| val-shacl | [SHACL Validation Reports](https://www.w3.org/TR/shacl/#validation-report) | standard | primary | conforms, result, focus node, result path, severity, message | Add semantic validation output schema aligned with SHACL reports for ontology graph checks. | L6, L8 | high | added |

## Cross-Domain Schema Implications

| schema concern | primary sources | design decision |
|---|---|---|
| Stable identity | RDF 1.1, JSON Schema Core, FIPA AID, A2A Agent Card | Every entity gets a stable `id`; globally addressable entities may also expose `iri` or `uri`. |
| Provenance | PROV-O, DCMI Terms, METHONTOLOGY | `SourceRecord`, `ExtractionActivity`, and `DecisionRecord` are mandatory for research-derived concepts. |
| Mental state | BDI papers, AgentSpeak, OASIS v2 | `Belief`, `Goal`, `Intention`, and `Plan` are distinct; do not collapse them into a single `Prompt` or `Task`. |
| Agent capability | O-MaSE, OASIS v2, MCP, CrewAI, OpenAI Agents SDK | `Capability` should link to `Tool`, `Policy`, `InputSchema`, `OutputSchema`, `Permission`, and `Provider`. |
| Communication | FIPA ACL, KQML, A2A, Agent Protocol | `Message` requires envelope fields, content semantics, conversation/thread control, and protocol binding. |
| State machines | Harel, SCXML, XState, LangGraph | Use a canonical statechart subset with nested states, parallel regions, transitions, events, guards, actions, invoked actors, and snapshots. |
| Runtime mappings | LangGraph, CrewAI, OpenAI Agents SDK, MAF, Pydantic AI | Framework-specific fields belong in `FrameworkMapping` records, not in the core entity definitions. |
| Validation | JSON Schema, Zod, SHACL, Ajv, Pydantic | Use JSON Schema/Zod/Pydantic for structural validation; use SHACL/OWL for graph-semantic validation. |
| Event-driven systems | AsyncAPI, CloudEvents, CrewAI Flows, LlamaIndex Workflows | Event envelopes and channel bindings should be adapter-level concepts linked to canonical `Event`. |
| Human-in-the-loop | LangGraph, OpenAI Agents SDK, MAF, A2A | Add gate/approval concepts as explicit state transitions, not hidden runtime flags. |

## Recommended Extraction Order

1. Extract source records and provenance model from PROV-O, DCMI Terms, RDF 1.1, and JSON Schema Core.
2. Freeze `Agent`, `Role`, `Capability`, `Task`, `Goal`, `Plan`, `Message`, `Protocol`, `StateMachine`, and `FrameworkMapping`.
3. Deep-extract FIPA ACL, FIPA Interaction Protocols, BDI/AgentSpeak, OASIS v2, and O-MaSE.
4. Build a minimal statechart schema from Harel, SCXML, and XState.
5. Map LangGraph, CrewAI, OpenAI Agents SDK, Microsoft Agent Framework, MCP, and A2A into adapter records.
6. Add validation fixtures for one single-agent workflow, one handoff workflow, and one contract-net protocol workflow.

## Gaps To Close Before Schema v0.1

- Confirm whether the canonical serialization is JSON Schema-first or JSON-LD/OWL-first.
- Decide how much BFO or upper-ontology alignment is valuable for MVP.
- Deep-read FIPA Ontology Service before modeling ontology translation.
- Decide whether SCXML export is a hard requirement or only an interoperability reference.
- Validate current status of rapidly changing framework docs before adapter schemas are finalized.
- Add exact fixture examples for ECC/Codex roles once the core schema IDs are stable.

## Phase 0A Candidate Pool: First Expansion

This pool is intentionally broader and less deeply extracted than the curated matrix above. Rows marked `phase0a-candidate` are screening candidates, not final schema evidence. Deep-reading happens in Phase 0B.

Columns:

- `recency`: `current` means published or materially updated between 2023-06-30 and 2026-06-30; `current-docs` means live docs or maintained repo checked in this window; `foundational` means older but concept-defining; `watch` means useful but secondary.
- `quality`: `A` primary/official/original, `B` strong secondary or maintained implementation, `C` contextual, `watch` monitor only.
- `deep_read`: `A` must deep-read, `B` likely deep-read, `C` skim if needed, `watch` do not rely on directly.

### Phase 0A.1 Ontology Engineering Candidates

| id | domain | source | source_type | authority | recency | quality | theme | deep_read | status |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| cand-ont-neon | ontology-engineering | [NeOn Methodology](https://link.springer.com/book/10.1007/978-3-642-24794-1) | methodology | primary | foundational | A | networked ontology lifecycle and reuse | B | phase0a-candidate |
| cand-ont-lot | ontology-engineering | [LOT: Linked Open Terms methodology](https://lot.linkeddata.es/) | methodology | primary | current-docs | A | lightweight ontology publication workflow | A | phase0a-candidate |
| cand-ont-momo | ontology-engineering | [MOMO modular ontology modeling](https://ceur-ws.org/) | methodology | secondary | current | B | modular ontology modeling patterns | B | phase0a-candidate |
| cand-ont-ontoclean | ontology-engineering | [OntoClean](https://www.researchgate.net/publication/226964944_OntoClean_Improving_Ontological_Analysis) | methodology | primary | foundational | A | metaproperties for taxonomy quality | B | phase0a-candidate |
| cand-ont-dolce | ontology-engineering | [DOLCE ontology overview](https://www.loa.istc.cnr.it/dolce/overview.html) | ontology | primary | foundational | A | upper ontology alignment | B | phase0a-candidate |
| cand-ont-ufo | ontology-engineering | [Unified Foundational Ontology resources](https://nemo.inf.ufes.br/en/ufo/) | ontology | primary | foundational | A | roles, relators, situations, types | B | phase0a-candidate |
| cand-ont-gufo-2026 | ontology-engineering | [gUFO: A Gentle Foundational Ontology for Semantic Web Knowledge Graphs](https://arxiv.org/pdf/2603.20948) | paper | primary | current | A | UFO implementation in OWL and SHACL | A | phase0a-candidate |
| cand-ont-ontouml | ontology-engineering | [OntoUML](https://ontouml.org/) | methodology/tooling | primary | current-docs | A | conceptual modeling with UFO | B | phase0a-candidate |
| cand-ont-owl-shacl-lessons-2025 | ontology-engineering | [Lessons Learned from the Combined Development of OWL and SHACL](https://doi.org/10.1145/3731443.3771340) | paper | primary | current | A | OWL and SHACL co-development | A | phase0a-candidate |
| cand-ont-llm-oe-slr | ontology-engineering | [Large Language Models for Ontology Engineering: A Systematic Literature Review](https://www.semantic-web-journal.net/content/large-language-models-ontology-engineering-systematic-literature-review) | survey | secondary | current | B | LLM-assisted ontology engineering | A | phase0a-candidate |
| cand-ont-ontoripple-2026 | ontology-engineering | [OntoRipple: Making Waves in the Knowledge Graph Lifecycle](https://davidchavesfraga.com/outcomes/papers/2026/conde2026ontoripple.pdf) | paper/tool | primary | current | A | ontology change impact on mappings and shapes | A | phase0a-candidate |
| cand-ont-continuum-2026 | ontology-engineering | [Knowledge Graph Re-engineering Along the Ontological Continuum](https://ar5iv.labs.arxiv.org/html/2605.22093) | paper | primary | current | B | fit-for-purpose ontology reuse | B | phase0a-candidate |
| cand-ont-webscale-kg-2026 | ontology-engineering | [The co-evolution of ontologies and extensive knowledge graphs on a web scale](https://link.springer.com/article/10.1007/s11227-026-08380-1) | paper | secondary | current | B | KG lifecycle and validation at scale | B | phase0a-candidate |
| cand-ont-shacl-ontologies-2026 | ontology-engineering | [SHACL validation in the presence of ontologies](https://www.netidee.at/sites/default/files/2026-01/SHACL_Validation.pdf) | paper | primary | current | A | OWL and SHACL semantic gap | A | phase0a-candidate |
| cand-ont-shacl12-core | ontology-engineering | [SHACL 1.2 Core Working Draft](https://www.w3.org/TR/shacl12-core/) | standard-draft | primary | current | A | emerging SHACL features | B | phase0a-candidate |
| cand-ont-shacl-af | ontology-engineering | [SHACL Advanced Features](https://www.w3.org/TR/shacl-af/) | standard-note | primary | foundational | A | rules, functions, advanced validation | B | phase0a-candidate |
| cand-ont-shex | ontology-engineering | [Shape Expressions](https://shex.io/) | standard/tooling | primary | current-docs | A | alternative RDF shape language | B | phase0a-candidate |
| cand-ont-rml | ontology-engineering | [RML Mapping Language](https://rml.io/specs/rml/) | standard | primary | current-docs | A | mappings from heterogeneous data to RDF | B | phase0a-candidate |
| cand-ont-astrea | ontology-engineering | [Astrea SHACL generator](https://astrea.linkeddata.es/) | tool/paper | implementation | current-docs | B | generating SHACL from ontologies | B | phase0a-candidate |
| cand-ont-oops | ontology-engineering | [OOPS ontology pitfall scanner](https://oops.linkeddata.es/) | tool | implementation | current-docs | B | ontology quality pitfalls | B | phase0a-candidate |
| cand-ont-robot | ontology-engineering | [ROBOT ontology tool](https://robot.obolibrary.org/) | tool | implementation | current-docs | B | ontology automation and quality checks | B | phase0a-candidate |
| cand-ont-widoco | ontology-engineering | [Widoco ontology documentation generator](https://github.com/dgarijo/Widoco) | repo | implementation | current-docs | B | ontology publication artifacts | C | phase0a-candidate |
| cand-ont-protege | ontology-engineering | [Protege](https://protege.stanford.edu/) | tool | implementation | current-docs | A | ontology editing and OWL workflows | B | phase0a-candidate |
| cand-ont-webprotege | ontology-engineering | [WebProtege](https://webprotege.stanford.edu/) | tool | implementation | current-docs | B | collaborative ontology editing | C | phase0a-candidate |
| cand-ont-ontoportal | ontology-engineering | [OntoPortal](https://ontoportal.org/) | platform | implementation | current-docs | B | ontology registry and metadata | B | phase0a-candidate |

### Phase 0A.2 Multi-Agent Systems Candidates

| id | domain | source | source_type | authority | recency | quality | theme | deep_read | status |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| cand-mas-wooldridge-book | multi-agent-systems | [An Introduction to MultiAgent Systems](https://mitpress.mit.edu/9780262232036/an-introduction-to-multiagent-systems/) | book | primary | foundational | A | MAS concepts and architecture | B | phase0a-candidate |
| cand-mas-prometheus | multi-agent-systems | [Prometheus methodology](https://doi.org/10.1007/978-3-540-25928-2_14) | methodology | primary | foundational | A | goal, role, scenario, plan design | A | phase0a-candidate |
| cand-mas-mase | multi-agent-systems | [Multiagent Systems Engineering](https://doi.org/10.1023/A:1014543720834) | methodology | primary | foundational | A | agentTool, goals, conversations, roles | A | phase0a-candidate |
| cand-mas-tropos | multi-agent-systems | [Tropos: An Agent-Oriented Software Development Methodology](https://doi.org/10.1023/A:1010071910869) | methodology | primary | foundational | A | goals, actors, dependencies | B | phase0a-candidate |
| cand-mas-message | multi-agent-systems | [MESSAGE methodology](https://www.researchgate.net/publication/220798695_MESSAGE_Methodology_for_Engineering_Systems_of_Software_Agents) | methodology | primary | foundational | B | MAS analysis/design models | B | phase0a-candidate |
| cand-mas-adelfe | multi-agent-systems | [ADELFE methodology](https://doi.org/10.1007/978-3-540-24620-6_13) | methodology | primary | foundational | B | adaptive multi-agent systems | C | phase0a-candidate |
| cand-mas-ingenias | multi-agent-systems | [INGENIAS methodology](https://ingenias.sourceforge.net/) | methodology/tool | implementation | foundational | B | organizational and interaction models | C | phase0a-candidate |
| cand-mas-passi | multi-agent-systems | [PASSI methodology](https://doi.org/10.1007/3-540-70657-7_5) | methodology | primary | foundational | B | requirements-to-code MAS process | C | phase0a-candidate |
| cand-mas-llm-multiagents-2024 | multi-agent-systems | [Large Language Model based Multi-Agents: A Survey of Progress and Challenges](https://arxiv.org/abs/2402.01680) | survey | secondary | current | B | LLM-MAS taxonomy, profiles, communication | A | phase0a-candidate |
| cand-mas-collab-2025 | multi-agent-systems | [Multi-Agent Collaboration Mechanisms: A Survey of LLMs](https://arxiv.org/abs/2501.06322) | survey | secondary | current | B | collaboration actors, structures, strategies | A | phase0a-candidate |
| cand-mas-communication-2026 | multi-agent-systems | [Beyond Self-Talk: A Communication-Centric Survey of LLM-Based MAS](https://arxiv.org/html/2502.14321v3) | survey | secondary | current | B | communication-centric MAS taxonomy | A | phase0a-candidate |
| cand-mas-five-ws-2026 | multi-agent-systems | [The Five Ws of Multi-Agent Communication](https://arxiv.org/pdf/2602.11583) | survey | secondary | current | B | who, whom, when, what, why communication model | A | phase0a-candidate |
| cand-mas-harmony-2025 | multi-agent-systems | [LLMs Working in Harmony](https://arxiv.org/abs/2504.01963) | survey | secondary | current | B | architecture, memory, planning, frameworks | B | phase0a-candidate |
| cand-mas-orchestration-2026 | multi-agent-systems | [LLM-Based Multi-Agent Orchestration](https://www.preprints.org/manuscript/202604.2147) | survey | secondary | current | C | orchestration topology and protocol comparison | C | phase0a-candidate |
| cand-mas-agentic-reasoning-2026 | multi-agent-systems | [Agentic Reasoning for Large Language Models](https://arxiv.org/pdf/2601.12538v1) | survey | secondary | current | B | collective multi-agent reasoning | B | phase0a-candidate |
| cand-mas-agentic-llms-2025 | multi-agent-systems | [Agentic Large Language Models, a Survey](https://arxiv.org/abs/2503.23037) | survey | secondary | current | B | agentic LLM capabilities and architectures | B | phase0a-candidate |
| cand-mas-coordination-2025 | multi-agent-systems | [Multi-Agent Coordination across Diverse Applications](https://arxiv.org/pdf/2502.14743) | survey | secondary | current | B | coordination mechanisms and domains | B | phase0a-candidate |
| cand-mas-frameworks-benchmark-2026 | multi-agent-systems | [Understanding Multi-Agent LLM Frameworks](https://arxiv.org/pdf/2602.03128) | survey/benchmark | secondary | current | B | framework comparison and benchmark dimensions | B | phase0a-candidate |
| cand-mas-generative-agents-2023 | multi-agent-systems | [Generative Agents: Interactive Simulacra of Human Behavior](https://doi.org/10.1145/3586183.3606763) | paper | primary | current | A | memory, planning, reflection, social simulation | A | phase0a-candidate |
| cand-mas-camel | multi-agent-systems | [CAMEL-AI](https://github.com/camel-ai/camel) | repo | implementation | current-docs | B | role-playing communicative agents | B | phase0a-candidate |
| cand-mas-metagpt | multi-agent-systems | [MetaGPT](https://github.com/FoundationAgents/MetaGPT) | repo/paper | implementation | current-docs | B | SOP-based software agent organization | B | phase0a-candidate |
| cand-mas-chatdev | multi-agent-systems | [ChatDev](https://github.com/OpenBMB/ChatDev) | repo/paper | implementation | current-docs | B | chat-chain software company simulation | C | phase0a-candidate |
| cand-mas-agentverse | multi-agent-systems | [AgentVerse](https://github.com/OpenBMB/AgentVerse) | repo/paper | implementation | current-docs | B | multi-agent environment and tasks | C | phase0a-candidate |
| cand-mas-jadex | multi-agent-systems | [Jadex](https://www.activecomponents.org/) | repo/framework | implementation | current-docs | B | BDI agent platform implementation | B | phase0a-candidate |
| cand-mas-spade | multi-agent-systems | [SPADE](https://spade-mas.readthedocs.io/) | repo/framework | implementation | current-docs | B | XMPP-based Python MAS platform | C | phase0a-candidate |
| cand-mas-mesa | multi-agent-systems | [Mesa](https://mesa.readthedocs.io/) | repo/framework | implementation | current-docs | B | agent-based modeling concepts | C | phase0a-candidate |

### Phase 0A.3 Agent Protocol Candidates

| id | domain | source | source_type | authority | recency | quality | theme | deep_read | status |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| cand-proto-fipa-abstract | agent-protocols | [FIPA Abstract Architecture Specification](http://www.fipa.org/specs/fipa00001/) | standard | primary | foundational | A | agent platform abstractions | A | phase0a-candidate |
| cand-proto-fipa-sl | agent-protocols | [FIPA SL Content Language Specification](http://www.fipa.org/specs/fipa00008/) | standard | primary | foundational | A | semantic content language | B | phase0a-candidate |
| cand-proto-fipa-request | agent-protocols | [FIPA Request Interaction Protocol](http://www.fipa.org/specs/fipa00026/) | standard | primary | foundational | A | request protocol lifecycle | A | phase0a-candidate |
| cand-proto-fipa-query | agent-protocols | [FIPA Query Interaction Protocol](http://www.fipa.org/specs/fipa00027/) | standard | primary | foundational | A | query-if/query-ref flow | A | phase0a-candidate |
| cand-proto-fipa-contract-net | agent-protocols | [FIPA Contract Net Interaction Protocol](http://www.fipa.org/specs/fipa00029/) | standard | primary | foundational | A | call-for-proposal protocol | A | phase0a-candidate |
| cand-proto-fipa-subscribe | agent-protocols | [FIPA Subscribe Interaction Protocol](http://www.fipa.org/specs/fipa00035/) | standard | primary | foundational | A | subscription and notification flow | B | phase0a-candidate |
| cand-proto-jsonrpc | agent-protocols | [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification) | standard | primary | foundational | A | request/response/error envelope | B | phase0a-candidate |
| cand-proto-sse | agent-protocols | [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html) | standard | primary | current-docs | A | streaming event delivery | B | phase0a-candidate |
| cand-proto-websocket | agent-protocols | [RFC 6455 WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455) | standard | primary | foundational | A | bidirectional transport | C | phase0a-candidate |
| cand-proto-jcs | agent-protocols | [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785) | standard | primary | foundational | A | canonical JSON signatures | B | phase0a-candidate |
| cand-proto-jws | agent-protocols | [RFC 7515 JSON Web Signature](https://www.rfc-editor.org/rfc/rfc7515) | standard | primary | foundational | A | signed agent cards and artifacts | C | phase0a-candidate |
| cand-proto-oauth-security | agent-protocols | [OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700) | standard | primary | current | A | protocol security requirements | B | phase0a-candidate |
| cand-proto-pkce | agent-protocols | [RFC 7636 PKCE](https://www.rfc-editor.org/rfc/rfc7636) | standard | primary | foundational | A | OAuth proof key extension | C | phase0a-candidate |
| cand-proto-device-code | agent-protocols | [RFC 8628 OAuth Device Authorization Grant](https://www.rfc-editor.org/rfc/rfc8628) | standard | primary | foundational | A | device authorization flow | C | phase0a-candidate |
| cand-proto-mcp-latest | agent-protocols | [MCP Latest Specification](https://modelcontextprotocol.io/specification/latest) | standard | primary | current | A | agent-to-tool protocol base | A | phase0a-candidate |
| cand-proto-mcp-auth | agent-protocols | [MCP Authorization](https://modelcontextprotocol.io/specification/latest/basic/authorization) | standard | primary | current | A | authorization model | A | phase0a-candidate |
| cand-proto-mcp-tools | agent-protocols | [MCP Tools](https://modelcontextprotocol.io/docs/concepts/tools) | official-doc | primary | current | A | tool discovery and invocation | A | phase0a-candidate |
| cand-proto-mcp-resources | agent-protocols | [MCP Resources](https://modelcontextprotocol.io/docs/concepts/resources) | official-doc | primary | current | A | resource exposure | B | phase0a-candidate |
| cand-proto-mcp-prompts | agent-protocols | [MCP Prompts](https://modelcontextprotocol.io/docs/concepts/prompts) | official-doc | primary | current | A | prompt templates | B | phase0a-candidate |
| cand-proto-mcp-sampling | agent-protocols | [MCP Sampling](https://modelcontextprotocol.io/docs/concepts/sampling) | official-doc | primary | current | B | server-requested model sampling | B | phase0a-candidate |
| cand-proto-mcp-sdk-ts | agent-protocols | [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | repo | implementation | current-docs | B | protocol implementation details | B | phase0a-candidate |
| cand-proto-mcp-sdk-python | agent-protocols | [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) | repo | implementation | current-docs | B | protocol implementation details | B | phase0a-candidate |
| cand-proto-a2a-latest | agent-protocols | [A2A Latest Specification](https://a2a-protocol.org/latest/specification/) | standard | primary | current | A | agent card, task, message, artifact | A | phase0a-candidate |
| cand-proto-a2a-v1 | agent-protocols | [A2A v1.0 Specification](https://a2a-protocol.org/v1.0.0/specification/) | standard | primary | current | A | normative protocol v1 data model | A | phase0a-candidate |
| cand-proto-a2a-whats-new | agent-protocols | [What's New in A2A v1.0](https://github.com/a2aproject/A2A/blob/main/docs/whats-new-v1.md) | release-note | primary | current | A | version changes and breaking changes | A | phase0a-candidate |
| cand-proto-a2a-python | agent-protocols | [A2A Python SDK](https://github.com/a2aproject/a2a-python) | repo | implementation | current-docs | B | SDK data model mapping | B | phase0a-candidate |
| cand-proto-a2a-js | agent-protocols | [A2A JavaScript SDK](https://github.com/a2aproject/a2a-js) | repo | implementation | current-docs | B | SDK data model mapping | B | phase0a-candidate |
| cand-proto-agent-streaming | agent-protocols | [Agent Streaming Protocol](https://langchain-ai.github.io/agent-protocol/streaming) | specification | primary | current-docs | B | live run observation events | B | phase0a-candidate |
| cand-proto-openapi-311 | agent-protocols | [OpenAPI Specification 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) | standard | primary | current | A | HTTP API contracts and JSON Schema alignment | B | phase0a-candidate |
| cand-proto-asyncapi-3 | agent-protocols | [AsyncAPI Specification 3.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0) | standard | primary | current | A | event-driven API contracts | B | phase0a-candidate |
| cand-proto-cloudevents-102 | agent-protocols | [CloudEvents 1.0.2](https://github.com/cloudevents/spec) | standard | primary | current-docs | A | event envelope interoperability | B | phase0a-candidate |
| cand-proto-anp | agent-protocols | [Agent Network Protocol](https://agent-network-protocol.com/) | protocol | secondary | current-docs | C | decentralized agent discovery | watch | phase0a-candidate |
| cand-proto-agntcy | agent-protocols | [Cisco AGNTCY](https://agntcy.org/) | project | implementation | current-docs | C | internet of agents components | watch | phase0a-candidate |

### Phase 0A.4 Statecharts Candidates

| id | domain | source | source_type | authority | recency | quality | theme | deep_read | status |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| cand-state-harel-original | statecharts | [Statecharts: A Visual Formalism for Complex Systems](https://doi.org/10.1016/0167-6423(87)90035-9) | paper | primary | foundational | A | hierarchy and concurrency | A | phase0a-candidate |
| cand-state-scxml-rec | statecharts | [W3C SCXML Recommendation](https://www.w3.org/TR/scxml/) | standard | primary | foundational | A | state machine notation and execution | A | phase0a-candidate |
| cand-state-uml-25 | statecharts | [OMG UML Specification](https://www.omg.org/spec/UML/) | standard | primary | current-docs | A | UML behavioral state machines | B | phase0a-candidate |
| cand-state-uml-formalization-2023 | statecharts | [Formalizing UML State Machines for Automated Verification](https://dl.acm.org/doi/10.1145/3579821) | survey | secondary | current | B | formal semantics and verification | B | phase0a-candidate |
| cand-state-xstate-v5-docs | statecharts | [XState documentation](https://stately.ai/docs) | official-doc | primary | current-docs | A | actors, machines, transitions, snapshots | A | phase0a-candidate |
| cand-state-xstate-releases | statecharts | [XState releases and changelog](https://github.com/statelyai/xstate/releases) | release-note | primary | current-docs | A | current behavior and API changes | A | phase0a-candidate |
| cand-state-xstate-graph | statecharts | [XState graph and paths](https://stately.ai/docs/graph) | official-doc | primary | current-docs | A | graph traversal and model-based testing | A | phase0a-candidate |
| cand-state-xstate-machines | statecharts | [XState machines](https://stately.ai/docs/machines) | official-doc | primary | current-docs | A | machine definitions and transitions | A | phase0a-candidate |
| cand-state-xstate-actors | statecharts | [XState actors](https://stately.ai/docs/actors) | official-doc | primary | current-docs | A | actor model and invocation | A | phase0a-candidate |
| cand-state-stately-studio | statecharts | [Stately Studio](https://stately.ai/) | official-doc | primary | current-docs | B | visual state modeling | B | phase0a-candidate |
| cand-state-statecharts-dev | statecharts | [statecharts.dev](https://statecharts.dev/) | reference | secondary | current-docs | B | educational statechart semantics | C | phase0a-candidate |
| cand-state-sismic | statecharts | [Sismic](https://sismic.readthedocs.io/) | repo/docs | implementation | current-docs | B | executable YAML statecharts | B | phase0a-candidate |
| cand-state-scion | statecharts | [SCION-CORE](https://github.com/jbeard4/SCION-CORE) | repo | implementation | current-docs | C | SCXML runtime implementation | C | phase0a-candidate |
| cand-state-qt-scxml | statecharts | [Qt SCXML](https://doc.qt.io/qt-6/qtscxml-index.html) | official-doc | implementation | current-docs | B | SCXML runtime and code generation | C | phase0a-candidate |
| cand-state-spring-statemachine | statecharts | [Spring Statemachine](https://spring.io/projects/spring-statemachine) | framework-doc | implementation | current-docs | B | enterprise state machine runtime | C | phase0a-candidate |
| cand-state-boost-sml | statecharts | [Boost.SML](https://boost-ext.github.io/sml/) | repo/docs | implementation | current-docs | B | compile-time state machines | C | phase0a-candidate |
| cand-state-mermaid | statecharts | [Mermaid state diagrams](https://mermaid.js.org/syntax/stateDiagram.html) | docs | implementation | current-docs | B | lightweight visualization output | C | phase0a-candidate |
| cand-state-plantuml | statecharts | [PlantUML state diagrams](https://plantuml.com/state-diagram) | docs | implementation | current-docs | B | text-to-diagram output | C | phase0a-candidate |
| cand-state-tla | statecharts | [TLA+](https://lamport.azurewebsites.net/tla/tla.html) | formal-method | primary | foundational | B | state transition specification and invariants | C | phase0a-candidate |
| cand-state-uppaal | statecharts | [UPPAAL](https://uppaal.org/) | tool | implementation | current-docs | B | timed automata verification | C | phase0a-candidate |
| cand-state-model-based-testing | statecharts | [Model-based testing overview](https://en.wikipedia.org/wiki/Model-based_testing) | reference | secondary | current-docs | C | testing from behavior models | watch | phase0a-candidate |

### Phase 0A.5 Modern LLM Agent Framework Candidates

| id | domain | source | source_type | authority | recency | quality | theme | deep_read | status |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| cand-fw-langgraph-graph-api | llm-agent-frameworks | [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api) | official-doc | primary | current-docs | A | graph, node, edge, state schema | A | phase0a-candidate |
| cand-fw-langgraph-checkpointers | llm-agent-frameworks | [LangGraph checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) | official-doc | primary | current-docs | A | persistence and checkpoints | A | phase0a-candidate |
| cand-fw-langgraph-hitl | llm-agent-frameworks | [LangGraph human-in-the-loop](https://docs.langchain.com/oss/python/langgraph/interrupts) | official-doc | primary | current-docs | A | interrupts and resumable workflows | A | phase0a-candidate |
| cand-fw-langgraph-platform | llm-agent-frameworks | [LangGraph Platform](https://docs.langchain.com/langgraph-platform/) | official-doc | primary | current-docs | B | deployment and runtime concepts | B | phase0a-candidate |
| cand-fw-langchain-agents | llm-agent-frameworks | [LangChain agents](https://docs.langchain.com/oss/python/langchain/agents) | official-doc | primary | current-docs | B | higher-level agent abstractions | B | phase0a-candidate |
| cand-fw-deepagents | llm-agent-frameworks | [Deep Agents](https://github.com/langchain-ai/deepagents) | repo | implementation | current-docs | B | subagents, filesystem, planning harness | C | phase0a-candidate |
| cand-fw-crewai-agents | llm-agent-frameworks | [CrewAI Agents](https://docs.crewai.com/concepts/agents) | official-doc | primary | current-docs | A | role, goal, backstory, tools | A | phase0a-candidate |
| cand-fw-crewai-tasks | llm-agent-frameworks | [CrewAI Tasks](https://docs.crewai.com/concepts/tasks) | official-doc | primary | current-docs | A | task description, expected output, context | A | phase0a-candidate |
| cand-fw-crewai-flows | llm-agent-frameworks | [CrewAI Flows](https://docs.crewai.com/concepts/flows) | official-doc | primary | current-docs | A | event-driven orchestration | A | phase0a-candidate |
| cand-fw-crewai-memory | llm-agent-frameworks | [CrewAI Memory](https://docs.crewai.com/concepts/memory) | official-doc | primary | current-docs | B | memory scopes and storage | B | phase0a-candidate |
| cand-fw-crewai-mcp | llm-agent-frameworks | [CrewAI MCP Integration](https://docs.crewai.com/en/mcp/overview) | official-doc | primary | current-docs | B | MCP tool integration | B | phase0a-candidate |
| cand-fw-openai-agents-guide | llm-agent-frameworks | [OpenAI Agents SDK guide](https://developers.openai.com/api/docs/guides/agents) | official-doc | primary | current-docs | A | SDK capability map and orchestration | A | phase0a-candidate |
| cand-fw-openai-agents-python-docs | llm-agent-frameworks | [OpenAI Agents SDK Python docs](https://openai.github.io/openai-agents-python/) | official-doc | primary | current-docs | A | agents, tools, handoffs, guardrails, sessions | A | phase0a-candidate |
| cand-fw-openai-agents-python-repo | llm-agent-frameworks | [openai-agents-python](https://github.com/openai/openai-agents-python) | repo | implementation | current-docs | A | SDK data model and examples | A | phase0a-candidate |
| cand-fw-openai-agents-js-repo | llm-agent-frameworks | [openai-agents-js](https://github.com/openai/openai-agents-js) | repo | implementation | current-docs | A | TypeScript SDK model | A | phase0a-candidate |
| cand-fw-openai-handoffs | llm-agent-frameworks | [OpenAI Agents handoffs](https://openai.github.io/openai-agents-python/handoffs/) | official-doc | primary | current-docs | A | delegation and ownership transfer | A | phase0a-candidate |
| cand-fw-openai-running | llm-agent-frameworks | [OpenAI running agents](https://developers.openai.com/api/docs/guides/agents/running-agents) | official-doc | primary | current-docs | A | runtime loop, state, pauses, resume | A | phase0a-candidate |
| cand-fw-openai-tracing | llm-agent-frameworks | [OpenAI Agents tracing](https://openai.github.io/openai-agents-python/tracing/) | official-doc | primary | current-docs | A | trace and span model | B | phase0a-candidate |
| cand-fw-openai-guardrails | llm-agent-frameworks | [OpenAI Agents guardrails](https://openai.github.io/openai-agents-python/guardrails/) | official-doc | primary | current-docs | A | input/output validation gates | B | phase0a-candidate |
| cand-fw-maf-docs | llm-agent-frameworks | [Microsoft Agent Framework overview](https://learn.microsoft.com/en-us/agent-framework/overview/) | official-doc | primary | current-docs | A | agents and workflows | A | phase0a-candidate |
| cand-fw-maf-repo | llm-agent-frameworks | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | repo | implementation | current-docs | A | Python/.NET workflow implementation | A | phase0a-candidate |
| cand-fw-maf-workflows | llm-agent-frameworks | [Microsoft Agent Framework workflows](https://learn.microsoft.com/en-us/agent-framework/workflows/) | official-doc | primary | current-docs | A | graph workflows and orchestration | A | phase0a-candidate |
| cand-fw-autogen-docs | llm-agent-frameworks | [Microsoft AutoGen](https://microsoft.github.io/autogen/) | official-doc | primary | current-docs | B | conversation agents and group chat | B | phase0a-candidate |
| cand-fw-autogen-repo | llm-agent-frameworks | [microsoft/autogen](https://github.com/microsoft/autogen) | repo | implementation | current-docs | B | maintained framework history | B | phase0a-candidate |
| cand-fw-semantic-kernel-agents | llm-agent-frameworks | [Semantic Kernel Agent Framework](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/) | official-doc | primary | current-docs | B | agents, plugins, conversations | B | phase0a-candidate |
| cand-fw-semantic-kernel-repo | llm-agent-frameworks | [microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel) | repo | implementation | current-docs | B | plugin and agent implementation | C | phase0a-candidate |
| cand-fw-llamaindex-workflows | llm-agent-frameworks | [LlamaIndex Workflows](https://docs.llamaindex.ai/en/stable/module_guides/workflow/) | official-doc | primary | current-docs | B | events, steps, workflow context | B | phase0a-candidate |
| cand-fw-llamaindex-agents | llm-agent-frameworks | [LlamaIndex agents](https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/) | official-doc | primary | current-docs | B | agent deployment concepts | C | phase0a-candidate |
| cand-fw-pydantic-ai-docs | llm-agent-frameworks | [Pydantic AI](https://ai.pydantic.dev/) | official-doc | primary | current-docs | A | type-safe agents and tools | A | phase0a-candidate |
| cand-fw-pydantic-ai-repo | llm-agent-frameworks | [pydantic-ai](https://github.com/pydantic/pydantic-ai) | repo | implementation | current-docs | A | implementation and examples | B | phase0a-candidate |
| cand-fw-google-adk-docs | llm-agent-frameworks | [Google Agent Development Kit docs](https://google.github.io/adk-docs/) | official-doc | primary | current-docs | B | agents, sessions, tools, artifacts | B | phase0a-candidate |
| cand-fw-google-adk-repo | llm-agent-frameworks | [google/adk-python](https://github.com/google/adk-python) | repo | implementation | current-docs | B | Python implementation | B | phase0a-candidate |
| cand-fw-dspy-docs | llm-agent-frameworks | [DSPy documentation](https://dspy.ai/) | official-doc | primary | current-docs | A | signatures, modules, optimizers | A | phase0a-candidate |
| cand-fw-dspy-repo | llm-agent-frameworks | [stanfordnlp/dspy](https://github.com/stanfordnlp/dspy) | repo | implementation | current-docs | A | declarative LM program implementation | B | phase0a-candidate |
| cand-fw-mastra | llm-agent-frameworks | [Mastra](https://mastra.ai/) | official-doc/repo | implementation | current-docs | B | TypeScript agent framework | B | phase0a-candidate |
| cand-fw-vercel-ai-sdk | llm-agent-frameworks | [Vercel AI SDK](https://ai-sdk.dev/docs) | official-doc | primary | current-docs | B | tools, structured output, agent loops | B | phase0a-candidate |
| cand-fw-strands | llm-agent-frameworks | [AWS Strands Agents](https://strandsagents.com/) | official-doc/repo | primary | current-docs | B | model-driven agent SDK | B | phase0a-candidate |
| cand-fw-beeai | llm-agent-frameworks | [BeeAI Framework](https://github.com/i-am-bee/beeai-framework) | repo | implementation | current-docs | B | agent workflows and ACP history | C | phase0a-candidate |
| cand-fw-agno | llm-agent-frameworks | [Agno](https://github.com/agno-agi/agno) | repo | implementation | current-docs | B | agent framework formerly phidata | C | phase0a-candidate |
| cand-fw-haystack-agents | llm-agent-frameworks | [Haystack agents](https://docs.haystack.deepset.ai/docs/agents) | official-doc | primary | current-docs | B | pipeline and tool-based agents | C | phase0a-candidate |

### Phase 0A.6 Schema Validation Candidates

| id | domain | source | source_type | authority | recency | quality | theme | deep_read | status |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| cand-val-json-schema-ietf-2026 | schema-validation | [IETF JSON Schema draft](https://datatracker.ietf.org/doc/html/draft-ietf-jsonschema-json-schema-01) | standard-draft | primary | current | A | possible standards-track direction | A | phase0a-candidate |
| cand-val-json-schema-output | schema-validation | [JSON Schema output specification](https://json-schema.org/draft/2020-12/json-schema-core#name-output-formats) | standard | primary | foundational | A | validation report structure | B | phase0a-candidate |
| cand-val-json-schema-test-suite | schema-validation | [JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite) | repo | primary | current-docs | A | conformance tests | A | phase0a-candidate |
| cand-val-json-schema-org-repo | schema-validation | [JSON Schema organization](https://github.com/json-schema-org) | repo/org | primary | current-docs | A | spec, tests, tooling ecosystem | B | phase0a-candidate |
| cand-val-zod-json-schema | schema-validation | [Zod JSON Schema export](https://zod.dev/json-schema) | official-doc | primary | current-docs | A | Zod to JSON Schema conversion | A | phase0a-candidate |
| cand-val-zod-metadata | schema-validation | [Zod metadata and registries](https://zod.dev/metadata) | official-doc | primary | current-docs | A | schema IDs and metadata | A | phase0a-candidate |
| cand-val-zod-v4 | schema-validation | [Zod v4 documentation](https://zod.dev/v4) | official-doc | primary | current-docs | A | current Zod behavior | B | phase0a-candidate |
| cand-val-ajv-guide | schema-validation | [Ajv schema language guide](https://ajv.js.org/guide/schema-language.html) | official-doc | primary | current-docs | A | JSON Schema and JTD support | A | phase0a-candidate |
| cand-val-ajv-repo | schema-validation | [ajv-validator/ajv](https://github.com/ajv-validator/ajv) | repo | implementation | current-docs | A | validator implementation | B | phase0a-candidate |
| cand-val-typebox-docs | schema-validation | [TypeBox](https://sinclairzx81.github.io/typebox/) | official-doc | primary | current-docs | A | JSON Schema as TS builder | A | phase0a-candidate |
| cand-val-typebox-repo | schema-validation | [sinclairzx81/typebox](https://github.com/sinclairzx81/typebox) | repo | implementation | current-docs | A | implementation and compiler | B | phase0a-candidate |
| cand-val-pydantic-json-schema | schema-validation | [Pydantic JSON Schema](https://docs.pydantic.dev/latest/concepts/json_schema/) | official-doc | primary | current-docs | A | Python model to JSON Schema | A | phase0a-candidate |
| cand-val-pydantic-core | schema-validation | [pydantic-core](https://github.com/pydantic/pydantic-core) | repo | implementation | current-docs | A | validation engine | B | phase0a-candidate |
| cand-val-cue-docs | schema-validation | [CUE documentation](https://cuelang.org/docs/) | official-doc | primary | current-docs | B | constraints as data | B | phase0a-candidate |
| cand-val-jtd-rfc | schema-validation | [RFC 8927 JSON Type Definition](https://www.rfc-editor.org/rfc/rfc8927) | standard | primary | foundational | A | closed JSON type schema | B | phase0a-candidate |
| cand-val-openapi-schema-31 | schema-validation | [OpenAPI 3.1 Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) | standard | primary | current | A | JSON Schema dialect in APIs | A | phase0a-candidate |
| cand-val-shacl-report | schema-validation | [SHACL Validation Reports](https://www.w3.org/TR/shacl/#validation-report) | standard | primary | foundational | A | semantic validation output | A | phase0a-candidate |
| cand-val-shex | schema-validation | [Shape Expressions](https://shex.io/shex-semantics/) | standard | primary | current-docs | A | RDF shape validation alternative | B | phase0a-candidate |
| cand-val-typescript-handbook | schema-validation | [TypeScript Handbook](https://www.typescriptlang.org/docs/) | official-doc | primary | current-docs | A | discriminated unions and structural typing | B | phase0a-candidate |
| cand-val-valibot | schema-validation | [Valibot](https://valibot.dev/) | official-doc/repo | primary | current-docs | B | modular TS validation | C | phase0a-candidate |
| cand-val-arktype | schema-validation | [ArkType](https://arktype.io/) | official-doc/repo | primary | current-docs | B | TypeScript syntax as schema | C | phase0a-candidate |
| cand-val-effect-schema | schema-validation | [Effect Schema](https://effect.website/docs/schema/introduction/) | official-doc | primary | current-docs | B | typed schema and transformations | C | phase0a-candidate |
| cand-val-io-ts | schema-validation | [io-ts](https://github.com/gcanti/io-ts) | repo | implementation | current-docs | B | runtime codecs and static types | C | phase0a-candidate |
| cand-val-typia | schema-validation | [Typia](https://typia.io/) | official-doc/repo | implementation | current-docs | B | TS transformer-based validation | C | phase0a-candidate |
| cand-val-json-schema-to-ts | schema-validation | [json-schema-to-ts](https://github.com/ThomasAribart/json-schema-to-ts) | repo | implementation | current-docs | B | TS types from JSON Schema | B | phase0a-candidate |
| cand-val-zod-openapi | schema-validation | [zod-openapi](https://github.com/samchungy/zod-openapi) | repo | implementation | current-docs | B | OpenAPI generation from Zod | B | phase0a-candidate |
| cand-val-zod-to-json-schema | schema-validation | [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema) | repo | implementation | current-docs | B | legacy Zod conversion behavior | C | phase0a-candidate |
| cand-val-valbridge | schema-validation | [valbridge](https://github.com/vectorfy-co/valbridge) | repo | implementation | current | C | Zod/Pydantic conversion and drift | watch | phase0a-candidate |
| cand-val-typecarta | schema-validation | [typecarta](https://github.com/pedroanisio/typecarta) | repo/spec | secondary | current | C | schema language preservation criteria | watch | phase0a-candidate |
| cand-val-benchmark | schema-validation | [schema-validator-benchmark](https://github.com/softnetics/schema-validator-benchmark) | repo | secondary | current | C | validator performance comparison | watch | phase0a-candidate |
| cand-val-json-schema-formal-2016 | schema-validation | [Foundations of JSON Schema](https://doi.org/10.1145/2872427.2883029) | paper | primary | foundational | A | formal semantics | B | phase0a-candidate |
| cand-val-json-schema-ai-2026 | schema-validation | [JSON Schema Is the Most Important API Standard of the AI Era](https://www.prateek-sharma.com/blog/json-schema-ai-era-api-standard/) | commentary | secondary | current | C | AI tool-call schema context | watch | phase0a-candidate |

### Phase 0A.7 Agent Mechanism And Orchestration Candidates

| id | domain | source | source_type | authority | recency | quality | theme | deep_read | status |
|---|---|---|---:|---:|---:|---:|---|---:|---|
| cand-mech-cot-2022 | agent-mechanisms | [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://proceedings.neurips.cc/paper_files/paper/2022/file/9d5609613524ecf4f15af0f7b31abca4-Paper-Conference.pdf) | paper | primary | foundational | A | intermediate reasoning steps | A | phase0a-candidate |
| cand-mech-self-consistency-2022 | agent-mechanisms | [Self-Consistency Improves Chain of Thought Reasoning in Language Models](https://arxiv.org/pdf/2203.11171) | paper | primary | foundational | A | sampled reasoning paths and answer aggregation | A | phase0a-candidate |
| cand-mech-zero-shot-cot-2022 | agent-mechanisms | [Large Language Models are Zero-Shot Reasoners](https://arxiv.org/abs/2205.11916) | paper | primary | foundational | A | zero-shot step-by-step prompting | B | phase0a-candidate |
| cand-mech-least-to-most-2022 | agent-mechanisms | [Least-to-Most Prompting Enables Complex Reasoning in Large Language Models](https://webdocs.cs.ualberta.ca/~dale/papers/iclr23a.pdf) | paper | primary | foundational | A | decomposition then sequential subproblem solving | A | phase0a-candidate |
| cand-mech-pot-2023 | agent-mechanisms | [Program of Thoughts Prompting](https://arxiv.org/abs/2211.12588) | paper | primary | foundational | B | code-mediated reasoning | B | phase0a-candidate |
| cand-mech-plan-and-solve-2023 | agent-mechanisms | [Plan-and-Solve Prompting](https://aclanthology.org/2023.acl-long.147.pdf) | paper | primary | foundational | A | planning before solving | B | phase0a-candidate |
| cand-mech-step-back-2023 | agent-mechanisms | [Take a Step Back: Evoking Reasoning via Abstraction](https://arxiv.org/abs/2310.06117) | paper | primary | current | B | abstraction before reasoning | B | phase0a-candidate |
| cand-mech-react-2023 | agent-mechanisms | [ReAct: Synergizing Reasoning and Acting in Language Models](https://openreview.net/attachment?id=tvI4u1ylcqs&name=pdf) | paper | primary | foundational | A | interleaved reasoning, action, observation | A | phase0a-candidate |
| cand-mech-reflexion-2023 | agent-mechanisms | [Reflexion: Language Agents with Verbal Reinforcement Learning](https://ar5iv.labs.arxiv.org/html/2303.11366) | paper | primary | foundational | A | verbal reflection memory from feedback | A | phase0a-candidate |
| cand-mech-self-refine-2023 | agent-mechanisms | [Self-Refine: Iterative Refinement with Self-Feedback](https://arxiv.org/pdf/2303.17651) | paper | primary | foundational | A | generate, critique, refine loop | A | phase0a-candidate |
| cand-mech-tot-2023 | agent-mechanisms | [Tree of Thoughts](https://proceedings.neurips.cc/paper/2023/file/271db9922b8d1f4dd7aaef84ed5ac703-Paper-Conference.pdf) | paper | primary | current | A | tree search over thoughts | A | phase0a-candidate |
| cand-mech-got-2023 | agent-mechanisms | [Graph of Thoughts](https://export.arxiv.org/pdf/2308.09687v2) | paper | primary | current | A | graph topology and thought transformations | A | phase0a-candidate |
| cand-mech-demystifying-topologies-2024 | agent-mechanisms | [Demystifying Chains, Trees, and Graphs of Thoughts](https://arxiv.org/html/2401.14295v4) | survey | secondary | current | A | reasoning topology taxonomy | A | phase0a-candidate |
| cand-mech-prompt-report-2024 | agent-mechanisms | [The Prompt Report](https://arxiv.org/html/2406.06608v6) | survey | secondary | current | A | prompt technique taxonomy | B | phase0a-candidate |
| cand-mech-lats-2024 | agent-mechanisms | [Language Agent Tree Search](https://proceedings.mlr.press/v235/zhou24r.html) | paper | primary | current | A | MCTS, value function, self-reflection, environment feedback | A | phase0a-candidate |
| cand-mech-rafa-2024 | agent-mechanisms | [Reason for Future, Act for Now](https://proceedings.mlr.press/v235/liu24ab.html) | paper | primary | current | A | long-horizon planning, memory buffer, replanning | A | phase0a-candidate |
| cand-mech-rap-2023 | agent-mechanisms | [Reasoning via Planning](https://arxiv.org/abs/2305.14992) | paper | primary | foundational | B | world model and planning search | B | phase0a-candidate |
| cand-mech-exact-2024 | agent-mechanisms | [ExACT: Teaching AI Agents to Explore with Reflective-MCTS and Exploratory Learning](https://arxiv.org/html/2410.02052) | paper | primary | current | B | reflective MCTS and debate-based evaluation | B | phase0a-candidate |
| cand-mech-reflact-2025 | agent-mechanisms | [ReflAct: World-Grounded Decision Making via Goal-State Reflection](https://aclanthology.org/2025.emnlp-main.1697/) | paper | primary | current | A | goal-state reflection and belief grounding | A | phase0a-candidate |
| cand-mech-advocate-2024 | agent-mechanisms | [ADVOCATE: Anticipatory Reflection for LLM Agents](https://aclanthology.org/2024.findings-emnlp.53.pdf) | paper | primary | current | B | anticipatory reflection and plan revision | B | phase0a-candidate |
| cand-mech-recap-2025 | agent-mechanisms | [RECAP: Recursive Context-Aware Planning](https://proceedings.neurips.cc/paper_files/paper/2025/file/88af3540325dd0b70617a9ab605f294d-Paper-Conference.pdf) | paper | primary | current | B | recursive planning for long horizon tasks | B | phase0a-candidate |
| cand-mech-mot-logical-2025 | agent-mechanisms | [Learning to Reason via Mixture-of-Thought for Logical Reasoning](https://arxiv.org/pdf/2505.15817) | paper | primary | current | A | natural language, code, and truth-table reasoning modalities | A | phase0a-candidate |
| cand-mech-mor-2025 | agent-mechanisms | [Mixture of Reasonings](https://arxiv.org/html/2507.00606) | paper | primary | current | B | adaptive reasoning strategy mixture | B | phase0a-candidate |
| cand-mech-mot-latent-2025 | agent-mechanisms | [Mixture of Thoughts: Latent-Level Multi-LLM Collaboration](https://jacobfa.github.io/papers/MoT.pdf) | paper | primary | current | B | latent expert routing and hidden-state fusion | watch | phase0a-candidate |
| cand-mech-toolformer-2023 | agent-mechanisms | [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/abs/2302.04761) | paper | primary | foundational | A | learned tool-use decisions | B | phase0a-candidate |
| cand-mech-mrkl-2022 | agent-mechanisms | [MRKL Systems](https://arxiv.org/abs/2205.00445) | paper | primary | foundational | B | modular neural-symbolic tool routing | B | phase0a-candidate |
| cand-mech-saycan-2022 | agent-mechanisms | [Do As I Can, Not As I Say](https://say-can.github.io/) | paper/project | primary | foundational | B | affordance-grounded action selection | B | phase0a-candidate |
| cand-mech-generative-agents-2023 | agent-mechanisms | [Generative Agents](https://doi.org/10.1145/3586183.3606763) | paper | primary | current | A | memory, reflection, planning architecture | A | phase0a-candidate |
| cand-mech-debate-du-2024 | agent-mechanisms | [Improving Factuality and Reasoning through Multiagent Debate](https://proceedings.mlr.press/v235/du24e.html) | paper | primary | current | A | multiple agents debate and converge | A | phase0a-candidate |
| cand-mech-mad-2024 | agent-mechanisms | [Encouraging Divergent Thinking through Multi-Agent Debate](https://arxiv.org/pdf/2305.19118) | paper | primary | current | B | judge-managed debate and divergence | B | phase0a-candidate |
| cand-mech-camel-2023 | agent-mechanisms | [CAMEL: Communicative Agents for Mind Exploration](https://proceedings.neurips.cc/paper_files/paper/2023/file/a3621ee907def47c1b952ade25c67698-Paper-Conference.pdf) | paper | primary | current | A | role-playing and inception prompting | A | phase0a-candidate |
| cand-mech-autogen-2024 | agent-mechanisms | [AutoGen: Enabling Next-Gen LLM Applications](http://ryenwhite.com/papers/WuiCOLM2024.pdf) | paper | primary | current | A | conversable agents and conversation programming | A | phase0a-candidate |
| cand-mech-metagpt-2023 | agent-mechanisms | [MetaGPT](https://arxiv.org/html/2308.00352v7) | paper | primary | current | A | SOP-based role specialization and structured handoffs | A | phase0a-candidate |
| cand-mech-chatdev-2024 | agent-mechanisms | [ChatDev](https://aclanthology.org/anthology-files/pdf/acl/2024.acl-long.810.pdf) | paper | primary | current | A | chat chain and communicative dehallucination | B | phase0a-candidate |
| cand-mech-agentverse-2024 | agent-mechanisms | [AgentVerse](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) | paper | primary | current | A | expert recruitment, group decision, action, evaluation | A | phase0a-candidate |
| cand-mech-bolaa-2023 | agent-mechanisms | [BOLAA: Benchmarking and Orchestrating LLM-Augmented Autonomous Agents](https://arxiv.org/abs/2308.05960) | paper | primary | current | B | benchmarking orchestration strategies | C | phase0a-candidate |
| cand-mech-orchestration-survey-2026 | agent-mechanisms | [LLM-Based Multi-Agent Orchestration](https://www.mdpi.com/1999-5903/18/6/326) | survey | secondary | current | A | centralized, decentralized, hierarchical, dynamic-adaptive topology | A | phase0a-candidate |
| cand-mech-openai-orchestration-docs | agent-mechanisms | [OpenAI Orchestration and Handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration) | official-doc | primary | current-docs | A | handoffs versus agents-as-tools | A | phase0a-candidate |
| cand-mech-openai-agents-python-repo | agent-mechanisms | [openai-agents-python](https://github.com/openai/openai-agents-python/) | repo | implementation | current-docs | A | agents, handoffs, guardrails, sessions, tracing | B | phase0a-candidate |
| cand-mech-anthropic-research-system-2025 | agent-mechanisms | [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | engineering-writeup | primary | current | A | orchestrator-worker research system and cost tradeoffs | A | phase0a-candidate |
| cand-mech-anthropic-orchestrator-workers | agent-mechanisms | [Orchestrator-workers cookbook pattern](https://github.com/anthropics/claude-cookbooks/blob/001e5ca1e735563cdaf9ee5c06019a6f608fd403/patterns/agents/orchestrator_workers.ipynb) | repo/example | implementation | current-docs | B | dynamic subtask delegation | B | phase0a-candidate |
| cand-mech-aorchestra-2026 | agent-mechanisms | [AOrchestra](https://arxiv.org/pdf/2602.03786) | paper | primary | current | A | dynamic sub-agent creation and four-field agent abstraction | A | phase0a-candidate |
| cand-mech-uno-orchestra-2026 | agent-mechanisms | [Uno-Orchestra](https://arxiv.org/html/2605.05007v1) | paper | primary | current | A | unified decomposition and routing under cost budget | A | phase0a-candidate |
| cand-mech-agentorchestra-2025 | agent-mechanisms | [AgentOrchestra](https://arxiv.org/html/2506.12508v1) | paper | primary | current | B | hierarchical planner and specialized agents | B | phase0a-candidate |
| cand-mech-paramanager-2026 | agent-mechanisms | [Small Model as Master Orchestrator](https://arxiv.org/pdf/2604.17009) | paper | primary | current | B | parallel subtask decomposition and agent-as-tool action space | B | phase0a-candidate |
| cand-mech-enterprise-orchestration-2026 | agent-mechanisms | [The Orchestration of Multi-Agent Systems](https://arxiv.org/html/2601.13671v1) | paper | secondary | current | B | enterprise control unit, recovery, traceability | C | phase0a-candidate |
