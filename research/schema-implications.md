# Phase 0B Schema Implications

Generated: 2026-06-30
Status: initial evidence-backed implications
Scope: implications only. No canonical schema is selected in Phase 0B.

## Cross-Track Implications

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-provenance-first | Every concept, relation, validation result, and schema implication needs source and extraction provenance. | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | high | keep-for-Phase-0C |
| si-two-validation-layers | Structural JSON validation and semantic RDF/graph validation should be modeled as separate validation layers. | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | high | keep-for-Phase-0C |
| si-term-agent-disambiguation | The schema needs a naming strategy for PROV Agent, MAS Agent, runtime Actor, and framework Agent. | ont-owl-shacl-foundations, mas-bdi-agentspeak-foundations, state-scxml-xstate-foundations, fw-langgraph-openai-crewai-foundations | high | unresolved |
| si-core-vs-adapter | Framework-specific fields should live in adapter mappings unless corroborated by MAS/protocol/statechart sources. | mas-bdi-agentspeak-foundations, proto-fipa-mcp-a2a-foundations, fw-langgraph-openai-crewai-foundations | high | keep-for-Phase-0C |
| si-current-doc-recheck | Current framework docs and protocol specs should be rechecked before implementation. | fw-langgraph-openai-crewai-foundations, proto-fipa-mcp-a2a-foundations, val-jsonschema-zod-pydantic-foundations | high | keep-for-implementation |

## Ontology And Provenance

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-uri-safe-ids | Semantic export requires stable IDs that can map to IRIs. | ont-owl-shacl-foundations | high | candidate |
| si-rdf-export-path | Relations need enough structure to export subject-predicate-object triples, while n-ary relations need qualification/reification handling. | ont-owl-shacl-foundations | high | candidate |
| si-competency-questions | Requirements/competency questions should be first-class research artifacts connected to candidates. | ont-owl-shacl-foundations | medium | needs-corroboration |
| si-llm-output-reviewed | LLM-assisted extraction should be modeled as an extraction activity with review status, not as authority. | ont-owl-shacl-foundations | high | candidate |

## Multi-Agent Systems

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-bdi-mental-states | Belief, Goal/Desire, Intention, Commitment, and Plan deserve deep consideration as MAS core concepts. | mas-bdi-agentspeak-foundations | high | candidate |
| si-plan-trigger-context | AgentSpeak-style compatibility requires plan trigger and context/applicability fields. | mas-bdi-agentspeak-foundations | high | candidate |
| si-mental-state-optional | Not every agent must have BDI mental states; architecture taxonomy is needed. | mas-bdi-agentspeak-foundations, fw-langgraph-openai-crewai-foundations | medium | unresolved |
| si-communication-dimensions | Communication needs dimensions beyond raw messages: participants, content, protocols, strategies, and coordination purpose. | mas-bdi-agentspeak-foundations, proto-fipa-mcp-a2a-foundations | high | candidate |

## Protocols

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-message-envelope | Canonical Message should separate performative/type, participants, content, content description, and conversation control. | proto-fipa-mcp-a2a-foundations | high | candidate |
| si-agent-tool-vs-agent-agent | Agent-to-tool integration and agent-to-agent delegation/coordination should be separate protocol layers. | proto-fipa-mcp-a2a-foundations, fw-langgraph-openai-crewai-foundations | high | candidate |
| si-a2a-task-artifact | A2A evidence supports Task, Message, Artifact, AgentCard, ProtocolBinding, and streaming update artifacts. | proto-fipa-mcp-a2a-foundations | high | adapter-plus-core-review |
| si-normative-artifact-tracking | Schema artifacts must track whether they are normative specs, generated convenience schemas, SDK bindings, or docs. | proto-fipa-mcp-a2a-foundations | high | candidate |
| si-tool-trust-boundary | Tool metadata and annotations need trust/provenance fields. | proto-fipa-mcp-a2a-foundations | high | security-review-required |

## Statecharts

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-statechart-core | Machine, StateNode, Transition, Event, Guard, Action, FinalState, ParallelRegion, Snapshot, Path are statechart candidates. | state-scxml-xstate-foundations | high | candidate |
| si-execution-vs-visual | Behavioral semantics and visualization fields must remain separate. | state-scxml-xstate-foundations | high | candidate |
| si-actor-lifecycle | Runtime actor lifecycle should distinguish invoked/spawned or equivalent lifecycle-control modes when XState adapter is enabled. | state-scxml-xstate-foundations | medium | adapter-only |
| si-path-coverage | Generated paths should carry coverage semantics such as shortest/simple/all where applicable. | state-scxml-xstate-foundations | high | candidate |

## Framework Adapters

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-langgraph-adapter | LangGraph mapping likely needs GraphWorkflow, StateSchema, Node, Edge, Checkpointer, Interrupt, ResumeCommand, and thread/session metadata. | fw-langgraph-openai-crewai-foundations | high | adapter-only |
| si-openai-adapter | OpenAI Agents mapping likely needs AgentLoop, ToolCall, Handoff, Guardrail, Session, Trace, Span, and RunResult artifacts. | fw-langgraph-openai-crewai-foundations | high | adapter-only |
| si-crewai-adapter | CrewAI mapping likely needs Crew, Agent role/goal/backstory, Task description/expected_output/context, process, memory, and delegation settings. | fw-langgraph-openai-crewai-foundations | high | adapter-only |
| si-handoff-generalization | Handoff appears cross-framework relevant, but exact semantics must be normalized without adopting one framework's mechanism. | fw-langgraph-openai-crewai-foundations, proto-fipa-mcp-a2a-foundations | medium | unresolved |
| si-tracing-privacy | Trace/span support requires privacy controls and redaction policy before implementation. | fw-langgraph-openai-crewai-foundations | high | security-review-required |

## Schema Validation

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-json-schema-dialect | JSON Schema artifacts should record dialect/version and validator support. | val-jsonschema-zod-pydantic-foundations | high | candidate |
| si-generator-mode | Generated schemas should record generator, generator version if known, target dialect, and input/output mode. | val-jsonschema-zod-pydantic-foundations | high | candidate |
| si-conversion-warnings | Schema conversion should produce explicit warnings/errors for unrepresentable runtime schema features. | val-jsonschema-zod-pydantic-foundations | high | candidate |
| si-ajv-config | Validator configuration should be explicit because draft support changes behavior and implementation cost. | val-jsonschema-zod-pydantic-foundations | medium | adapter-only |
| si-ietf-draft-watch | The 2026 IETF JSON Schema draft is current but should remain watch/current-draft, not implementation baseline. | val-jsonschema-zod-pydantic-foundations | high | watch |

## Agent Mechanisms And Orchestration

| id | implication | evidence_ids | confidence | decision_status |
|---|---|---|---|---|
| si-mechanism-track-added | Phase 0 needs an explicit mechanism/orchestration track because reasoning and delegation mechanisms cut across MAS, protocols, frameworks, and validation. | mech-reasoning-topologies-foundations, mech-action-reflection-loop-foundations, mech-subagent-orchestration-foundations | high | accepted-for-phase0 |
| si-reasoning-topology | Reasoning mechanisms should represent topology separately from workflow graph/framework node concepts. | mech-reasoning-topologies-foundations | high | candidate |
| si-cot-observability | ReasoningTrace should allow summaries, visible reasoning artifacts, and metadata without requiring storage of private hidden chain-of-thought. | mech-reasoning-topologies-foundations, fw-langgraph-openai-crewai-foundations | high | security-review-required |
| si-reasoning-modality | Reasoning representation should not assume natural language only; code and symbolic/truth-table modalities need room as mechanism evidence. | mech-reasoning-topologies-foundations | medium | candidate |
| si-search-controller-budget | Search-heavy mechanisms need optional controller, evaluator, branching, stopping, and budget metadata when those details are exposed. | mech-reasoning-topologies-foundations, mech-action-reflection-loop-foundations | high | candidate |
| si-action-observation-feedback-loop | Agent execution should distinguish action, observation, feedback, reflection, and memory updates rather than collapsing them into one tool-call record. | mech-action-reflection-loop-foundations | high | candidate |
| si-feedback-provenance | Feedback and reflection artifacts need source/trust metadata because self-feedback, environment feedback, and evaluator feedback carry different reliability. | mech-action-reflection-loop-foundations | high | candidate |
| si-reflection-memory-risk | Reflection memory should be treated as generated evidence with provenance and review status, not as authoritative knowledge. | mech-action-reflection-loop-foundations | high | security-review-required |
| si-delegation-ownership | Handoff and agents-as-tools should remain distinct because they differ in ownership of the next response and final synthesis. | mech-subagent-orchestration-foundations, fw-langgraph-openai-crewai-foundations | high | candidate |
| si-orchestration-topology | Multi-agent workflows should carry orchestration topology metadata such as centralized, decentralized, hierarchical, and dynamic-adaptive profiles. | mech-subagent-orchestration-foundations | high | candidate |
| si-context-isolation | Subagent execution should record context scope, visible inputs, returned artifacts, and synthesis provenance. | mech-subagent-orchestration-foundations | high | security-review-required |
| si-budget-policy | Delegation and search should support explicit token/cost/latency budget policies and observed cost records. | mech-reasoning-topologies-foundations, mech-subagent-orchestration-foundations | high | candidate |
| si-mechanism-vs-protocol | Mechanism concepts such as ReasonActLoop, SearchController, and Orchestrator should not be collapsed into protocol envelopes such as MCP tools or A2A tasks. | mech-action-reflection-loop-foundations, mech-subagent-orchestration-foundations, proto-fipa-mcp-a2a-foundations | high | keep-for-Phase-0C |

## Implementation Boundaries From Phase 0

- Do not create canonical schema files until Phase 0C source review is complete.
- Do not build the frontend or XState visualizer in Phase 0.
- Do not let one framework's field names become core ontology fields without cross-track support.
- Do not collapse A2A, MCP, FIPA, and framework tool calls into one generic protocol object.
- Do not require hidden chain-of-thought capture; model reasoning summaries or observable trace events instead.
