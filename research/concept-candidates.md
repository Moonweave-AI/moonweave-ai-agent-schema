# Phase 0B Concept Candidates

Generated: 2026-06-30
Status: initial Phase 0B extraction
Scope: candidate concepts only. Do not treat these as final schema fields until Phase 0C review.

## Status Legend

| status | meaning |
|---|---|
| candidate | Supported by at least one high-authority source and likely cross-track relevant. |
| needs-corroboration | Plausible but needs another authoritative source before design use. |
| adapter-only | Useful for framework/export mappings, not proven as core ontology. |
| term-collision | Needs naming decision because sources use the same word differently. |

## Candidates

| id | concept | working definition | candidate_layers | evidence_ids | status | notes |
|---|---|---|---|---|---|---|
| c-source-record | SourceRecord | Citable source with authority, recency, and extraction metadata. | L0, L8 | ont-owl-shacl-foundations | candidate | Needed for evidence provenance across all tracks. |
| c-extraction-activity | ExtractionActivity | Research activity that produces a candidate or implication from sources. | L0, L8 | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | candidate | PROV-style Activity candidate. |
| c-provenance-agent | ProvenanceAgent | Responsible actor in provenance, distinct from an AI agent. | L0, L8 | ont-owl-shacl-foundations | term-collision | Must not be confused with Agent entity in MAS. |
| c-ontology | Ontology | Formalized vocabulary of concepts and relations for a domain. | L1 | ont-owl-shacl-foundations | candidate | Semantic-web foundation. |
| c-concept | Concept | Domain term/entity candidate extracted from sources. | L1 | ont-owl-shacl-foundations | candidate | Needs SKOS follow-up for labels/synonyms. |
| c-relation | Relation | Typed association between two concepts or resources. | L1, L6 | ont-owl-shacl-foundations | candidate | RDF triple export path required. |
| c-rdf-graph | RDFGraph | Set of RDF triples used as semantic data graph. | L1, L6 | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | candidate | Needed for SHACL validation relations. |
| c-shape | Shape | Constraint construct for validating RDF data graphs. | L6 | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | candidate | Semantic validation candidate. |
| c-validation-report | ValidationReport | Machine-readable output from a validation run. | L8 | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | candidate | Needs separate JSON Schema and SHACL report variants. |
| c-competency-question | CompetencyQuestion | Requirement-style question an ontology should answer. | L0, L8 | ont-owl-shacl-foundations | needs-corroboration | LOT evidence; add Ontology 101/METHONTOLOGY. |
| c-agent | Agent | Autonomous or semi-autonomous actor in MAS/framework context. | L2 | mas-bdi-agentspeak-foundations, fw-langgraph-openai-crewai-foundations | candidate | Needs naming disambiguation from PROV Agent. |
| c-role | Role | Expected responsibility or behavioral position for an agent. | L2, L4 | mas-bdi-agentspeak-foundations, fw-langgraph-openai-crewai-foundations | needs-corroboration | Add O-MaSE/Gaia/Prometheus. |
| c-capability | Capability | Operation or behavior an agent can perform or advertise. | L2, L4 | mas-bdi-agentspeak-foundations, proto-fipa-mcp-a2a-foundations | candidate | Appears in OASIS and A2A discovery. |
| c-belief | Belief | Agent informational state. | L3 | mas-bdi-agentspeak-foundations | candidate | Foundational BDI evidence. |
| c-goal | Goal | Desired condition or motivational state. | L3 | mas-bdi-agentspeak-foundations, fw-langgraph-openai-crewai-foundations | term-collision | CrewAI "goal" may be prompt metadata. |
| c-intention | Intention | Commitment-bearing deliberative state or selected course of action. | L3 | mas-bdi-agentspeak-foundations | candidate | Needs lifecycle modeling. |
| c-commitment | Commitment | Persistence relation between an agent and an intention/task/plan. | L3, L4 | mas-bdi-agentspeak-foundations | candidate | Add OASIS detail extraction. |
| c-plan | Plan | Operational structure for pursuing goals or intentions. | L4 | mas-bdi-agentspeak-foundations | candidate | AgentSpeak supports trigger/context/body. |
| c-context-condition | ContextCondition | Applicability condition under which a plan or transition may execute. | L4, L7 | mas-bdi-agentspeak-foundations, state-scxml-xstate-foundations | candidate | AgentSpeak context and statechart guards may remain distinct. |
| c-event | Event | Occurrence that can trigger protocol, plan, or state transition behavior. | L4, L7 | mas-bdi-agentspeak-foundations, state-scxml-xstate-foundations, proto-fipa-mcp-a2a-foundations | candidate | Generic event concept; specialized events may remain layer-specific. |
| c-triggering-event | TriggeringEvent | Event that activates a plan or transition. | L4, L7 | mas-bdi-agentspeak-foundations, state-scxml-xstate-foundations | candidate | Crosses plan and statechart layers. |
| c-communication-mechanism | CommunicationMechanism | Means by which agents exchange information and coordinate. | L4 | mas-bdi-agentspeak-foundations, proto-fipa-mcp-a2a-foundations | candidate | Needs protocol-specific decomposition. |
| c-message | Message | Protocol-level communicative unit with participants and content. | L4 | proto-fipa-mcp-a2a-foundations | candidate | Add KQML and A2A proto extraction. |
| c-performative | Performative | Communicative act type of a message. | L4 | proto-fipa-mcp-a2a-foundations | needs-corroboration | FIPA-specific unless KQML supports mapping. |
| c-conversation | Conversation | Sequence of related communicative acts. | L4 | proto-fipa-mcp-a2a-foundations | candidate | FIPA conversation-id evidence. |
| c-tool | Tool | Invocable capability exposed to an agent/model with input schema. | L5, L6 | proto-fipa-mcp-a2a-foundations, fw-langgraph-openai-crewai-foundations | candidate | MCP/OpenAI/CrewAI corroboration. |
| c-resource | Resource | Context/data exposed to an agent/model. | L5 | proto-fipa-mcp-a2a-foundations | needs-corroboration | MCP-specific so far. |
| c-agent-card | AgentCard | Agent discovery metadata. | L2, L4 | proto-fipa-mcp-a2a-foundations | adapter-only | A2A-specific unless generalized as CapabilityAdvertisement. |
| c-task | Task | Durable or assigned unit of work. | L4, L5, L7 | proto-fipa-mcp-a2a-foundations, fw-langgraph-openai-crewai-foundations | candidate | A2A and CrewAI use different semantics. |
| c-artifact | Artifact | Produced output payload from a task/run. | L4, L8 | proto-fipa-mcp-a2a-foundations, fw-langgraph-openai-crewai-foundations | candidate | Add OpenAI results/source artifact evidence. |
| c-protocol-binding | ProtocolBinding | Mapping from abstract operation/data model to transport. | L5 | proto-fipa-mcp-a2a-foundations | candidate | A2A evidence strong. |
| c-abstract-operation | AbstractOperation | Transport-neutral protocol operation. | L5 | proto-fipa-mcp-a2a-foundations | adapter-only | A2A model; may generalize later. |
| c-mcp-server | MCPServer | MCP service exposing resources, prompts, or tools. | L5 | proto-fipa-mcp-a2a-foundations | adapter-only | MCP-specific. |
| c-mcp-client | MCPClient | Connector within an MCP host that calls MCP servers. | L5 | proto-fipa-mcp-a2a-foundations | adapter-only | MCP-specific. |
| c-machine | Machine | Statechart/state machine definition. | L7 | state-scxml-xstate-foundations | candidate | Needs SCXML details. |
| c-state-node | StateNode | Behavioral state in a machine. | L7 | state-scxml-xstate-foundations | candidate | |
| c-transition | Transition | Event-triggered relation from one state to another. | L7 | state-scxml-xstate-foundations | candidate | |
| c-guard | Guard | Condition controlling transition eligibility. | L7 | state-scxml-xstate-foundations | candidate | |
| c-action | Action | Side-effect or executable behavior associated with machine logic. | L7 | state-scxml-xstate-foundations | needs-corroboration | SCXML executable content needs deeper extraction. |
| c-parallel-state | ParallelState | State with simultaneously active regions. | L7 | state-scxml-xstate-foundations | candidate | Harel/XState evidence. |
| c-region | Region | Concurrent sub-area within a parallel state. | L7 | state-scxml-xstate-foundations | needs-corroboration | Need UML/SCXML terminology check. |
| c-actor-ref | ActorRef | Runtime actor reference in statechart/framework execution. | L5, L7 | state-scxml-xstate-foundations, fw-langgraph-openai-crewai-foundations | candidate | XState strong; MAS actor term collision possible. |
| c-snapshot | Snapshot | Captured state of an actor/run/machine. | L7, L8 | state-scxml-xstate-foundations, fw-langgraph-openai-crewai-foundations | candidate | LangGraph/OpenAI state/resume adds support. |
| c-path | Path | Event sequence through a state graph. | L8 | state-scxml-xstate-foundations | candidate | Verification artifact. |
| c-step | Step | Single transition step within a generated path. | L8 | state-scxml-xstate-foundations | adapter-only | XState graph utility concept. |
| c-graph-workflow | GraphWorkflow | Workflow as graph of nodes, edges, and shared state. | L5 | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific until cross-framework corroborated. |
| c-node | Node | Executable graph step that reads and updates workflow state. | L5 | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific. |
| c-edge | Edge | Routing relation between graph nodes. | L5 | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific. |
| c-state-schema | StateSchema | Shared workflow state structure. | L5, L6 | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific until corroborated. |
| c-handoff | Handoff | Delegation/control transfer from one agent to another. | L4, L5 | fw-langgraph-openai-crewai-foundations, proto-fipa-mcp-a2a-foundations | candidate | Needs relation semantics independent of implementation. |
| c-guardrail | Guardrail | Validation or policy check applied to input/output/tool call. | L6, L8 | fw-langgraph-openai-crewai-foundations, val-jsonschema-zod-pydantic-foundations | candidate | Runtime validation layer. |
| c-input | Input | Data entering a validation, tool, or agent run boundary. | L6, L8 | fw-langgraph-openai-crewai-foundations, val-jsonschema-zod-pydantic-foundations | needs-corroboration | Generic boundary concept. |
| c-output | Output | Data emitted from a validation, tool, or agent run boundary. | L6, L8 | fw-langgraph-openai-crewai-foundations, val-jsonschema-zod-pydantic-foundations | needs-corroboration | Generic boundary concept. |
| c-trace | Trace | End-to-end execution record composed of spans. | L8 | fw-langgraph-openai-crewai-foundations, ont-owl-shacl-foundations | candidate | Needs privacy/security constraints. |
| c-span | Span | Timed operation within a trace. | L8 | fw-langgraph-openai-crewai-foundations | adapter-only | OpenAI tracing-specific until corroborated. |
| c-session | Session | Persistent context carrier across turns/runs. | L8 | fw-langgraph-openai-crewai-foundations | needs-corroboration | Framework-specific details vary. |
| c-crew | Crew | CrewAI grouping of agents, tasks, and process. | L5 | fw-langgraph-openai-crewai-foundations | adapter-only | CrewAI-specific. |
| c-schema-artifact | SchemaArtifact | Versioned schema/validation artifact with dialect/generator provenance. | L6, L8 | val-jsonschema-zod-pydantic-foundations, ont-owl-shacl-foundations | candidate | Structural and semantic variants needed. |
| c-meta-schema | MetaSchema | Schema used to validate schema documents. | L6 | val-jsonschema-zod-pydantic-foundations | candidate | JSON Schema evidence. |
| c-dialect | Dialect | JSON Schema vocabulary/version declaration. | L6 | val-jsonschema-zod-pydantic-foundations | candidate | |
| c-validator | Validator | Engine/process that evaluates instances or graphs against schemas/shapes. | L6, L8 | val-jsonschema-zod-pydantic-foundations | candidate | |
| c-zod-schema | ZodSchema | Zod runtime schema that can generate JSON Schema with limitations. | L6 | val-jsonschema-zod-pydantic-foundations | adapter-only | Zod-specific. |
| c-pydantic-model | PydanticModel | Pydantic model or adapted type that can generate JSON Schema. | L6 | val-jsonschema-zod-pydantic-foundations | adapter-only | Pydantic-specific. |
| c-schema-conversion | SchemaConversion | Process converting one schema language/model to another. | L6, L8 | val-jsonschema-zod-pydantic-foundations | candidate | Needed to track generator mode and warnings. |
| c-conversion-warning | ConversionWarning | Recorded issue from schema-language conversion. | L6, L8 | val-jsonschema-zod-pydantic-foundations | candidate | Needed for Zod/Pydantic drift. |
| c-thought | Thought | Coherent intermediate reasoning unit produced or consumed during problem solving. | L3, L8 | mech-reasoning-topologies-foundations | candidate | Must not imply that hidden chain-of-thought is available or safe to store. |
| c-reasoning-trace | ReasoningTrace | Observable or summarized record of reasoning artifacts, decisions, paths, or steps. | L8 | mech-reasoning-topologies-foundations, fw-langgraph-openai-crewai-foundations | candidate | Full private reasoning should be optional or absent. |
| c-reasoning-path | ReasoningPath | One complete route through intermediate thoughts toward an answer. | L3, L8 | mech-reasoning-topologies-foundations | candidate | Self-consistency and ToT evidence. |
| c-reasoning-topology | ReasoningTopology | Structural organization of reasoning paths and thought dependencies. | L3, L8 | mech-reasoning-topologies-foundations | candidate | Chain/tree/graph family. |
| c-chain-topology | ChainTopology | Linear reasoning topology. | L3 | mech-reasoning-topologies-foundations | candidate | CoT family. |
| c-tree-topology | TreeTopology | Branching reasoning topology with expansion, evaluation, pruning, or backtracking. | L3, L8 | mech-reasoning-topologies-foundations | candidate | ToT/LATS family. |
| c-graph-topology | GraphTopology | Reasoning topology where thoughts can merge, aggregate, or depend on arbitrary prior thoughts. | L3, L8 | mech-reasoning-topologies-foundations | candidate | GoT family. |
| c-thought-evaluator | ThoughtEvaluator | Mechanism that scores, ranks, filters, or prunes thoughts. | L3, L8 | mech-reasoning-topologies-foundations, mech-action-reflection-loop-foundations | candidate | |
| c-search-controller | SearchController | Procedure that chooses which reasoning or action state to expand next. | L3, L8 | mech-reasoning-topologies-foundations, mech-action-reflection-loop-foundations | candidate | Search algorithm may remain runtime-specific. |
| c-branching-policy | BranchingPolicy | Rule controlling candidate thought generation breadth or branching. | L3, L8 | mech-reasoning-topologies-foundations | needs-corroboration | |
| c-backtracking-policy | BacktrackingPolicy | Rule for returning from failed or low-value branches. | L3, L8 | mech-reasoning-topologies-foundations | candidate | |
| c-answer-aggregation | AnswerAggregation | Mechanism combining multiple paths, votes, or transformed thoughts into a final answer. | L3, L8 | mech-reasoning-topologies-foundations | candidate | Self-consistency and GoT support. |
| c-reasoning-modality | ReasoningModality | Representational format used for reasoning, such as natural language, code, or symbolic table. | L3 | mech-reasoning-topologies-foundations | candidate | MoT evidence. |
| c-natural-language-reasoning | NaturalLanguageReasoning | Reasoning represented primarily as natural-language explanations or summaries. | L3 | mech-reasoning-topologies-foundations | candidate | |
| c-code-reasoning | CodeReasoning | Reasoning represented as executable or program-like steps. | L3, L5 | mech-reasoning-topologies-foundations | needs-corroboration | Distinguish from Tool execution. |
| c-symbolic-reasoning | SymbolicReasoning | Reasoning represented as formal symbolic structures or truth tables. | L3 | mech-reasoning-topologies-foundations | needs-corroboration | |
| c-reasoning-cost | ReasoningCost | Token, call, latency, or compute cost induced by a reasoning mechanism. | L8 | mech-reasoning-topologies-foundations, mech-subagent-orchestration-foundations | candidate | Needed for search and subagent tradeoffs. |
| c-reason-act-loop | ReasonActLoop | Iterative loop interleaving reasoning, action, and observation. | L3, L4, L5 | mech-action-reflection-loop-foundations | candidate | ReAct family. |
| c-action-step | ActionStep | Concrete operation chosen by an agent in an environment or tool interface. | L4, L5 | mech-action-reflection-loop-foundations | candidate | Distinct from statechart Action. |
| c-observation | Observation | Information returned from an environment or tool after an action. | L4, L8 | mech-action-reflection-loop-foundations | candidate | |
| c-environment | Environment | External system or task world that accepts actions and returns observations or feedback. | L4, L5 | mech-action-reflection-loop-foundations | candidate | |
| c-feedback-signal | FeedbackSignal | Scalar, binary, free-form, self-generated, or environment-provided signal used to improve behavior. | L8 | mech-action-reflection-loop-foundations | candidate | Source/trust metadata required. |
| c-reflection | Reflection | Textual or structured assessment of prior behavior, state, or goal alignment. | L3, L8 | mech-action-reflection-loop-foundations | candidate | Not automatically ground truth. |
| c-verbal-reinforcement-memory | VerbalReinforcementMemory | Memory buffer storing reflection text to influence later attempts. | L3, L8 | mech-action-reflection-loop-foundations | candidate | Reflexion evidence. |
| c-self-feedback | SelfFeedback | Feedback generated by the model about its own output or behavior. | L8 | mech-action-reflection-loop-foundations | candidate | Requires provenance/trust label. |
| c-refined-output | RefinedOutput | Candidate output after feedback-driven revision. | L8 | mech-action-reflection-loop-foundations | needs-corroboration | Self-Refine evidence. |
| c-planned-trajectory | PlannedTrajectory | Multi-step future action sequence generated before executing the next action. | L3, L4 | mech-action-reflection-loop-foundations | candidate | RAFA evidence. |
| c-replanning-event | ReplanningEvent | Event where the agent updates a plan after new feedback or state. | L4, L7 | mech-action-reflection-loop-foundations | candidate | |
| c-value-function | ValueFunction | Scoring function estimating usefulness of a state, trajectory, action, or thought. | L3, L8 | mech-action-reflection-loop-foundations | candidate | LATS/RAFA evidence. |
| c-search-tree | SearchTree | Tree of possible reasoning or action states explored by a planning algorithm. | L3, L8 | mech-action-reflection-loop-foundations, mech-reasoning-topologies-foundations | candidate | |
| c-goal-state-reflection | GoalStateReflection | Reflection comparing current observed state with desired goal state. | L3, L8 | mech-action-reflection-loop-foundations | candidate | ReflAct evidence. |
| c-orchestrator | Orchestrator | Controller or agent that decomposes work, delegates subtasks, routes messages, and synthesizes results. | L2, L4, L5 | mech-subagent-orchestration-foundations | candidate | May be human, agent, or runtime controller depending profile. |
| c-subagent | Subagent | Scoped agent instance delegated a bounded task by an orchestrator or peer. | L2, L5 | mech-subagent-orchestration-foundations | candidate | |
| c-worker-agent | WorkerAgent | Specialist or subagent that executes an assigned subtask and returns findings or artifacts. | L2, L5 | mech-subagent-orchestration-foundations | candidate | |
| c-delegation | Delegation | Assignment of a subtask or responsibility from one agent/controller to another. | L4, L5 | mech-subagent-orchestration-foundations, fw-langgraph-openai-crewai-foundations | candidate | |
| c-delegation-ownership | DelegationOwnership | Ownership semantics for who controls the next response or final synthesis after delegation. | L4, L5 | mech-subagent-orchestration-foundations | candidate | Handoff versus agents-as-tools distinction. |
| c-agents-as-tools | AgentsAsTools | Delegation pattern where a manager remains in control and calls specialists as bounded tools. | L5 | mech-subagent-orchestration-foundations | candidate | OpenAI/AOrchestra evidence. |
| c-task-decomposition | TaskDecomposition | Breaking a complex objective into bounded subtasks and dependencies. | L4, L5 | mech-subagent-orchestration-foundations | candidate | |
| c-subtask | Subtask | Bounded delegated unit of work with scoped input and expected output. | L4, L5 | mech-subagent-orchestration-foundations | candidate | |
| c-routing-policy | RoutingPolicy | Rule, model, or learned policy selecting which worker/model/tool handles work. | L5, L8 | mech-subagent-orchestration-foundations | candidate | |
| c-worker-selection | WorkerSelection | Concrete choice of worker, model, primitive, role, or tool for a subtask. | L5 | mech-subagent-orchestration-foundations | candidate | |
| c-orchestration-topology | OrchestrationTopology | Structural coordination pattern among multiple agents. | L4, L5 | mech-subagent-orchestration-foundations | candidate | Centralized/decentralized/hierarchical plus hybrid. |
| c-centralized-topology | CentralizedTopology | Multi-agent coordination pattern with one controlling coordinator. | L5 | mech-subagent-orchestration-foundations | candidate | |
| c-decentralized-topology | DecentralizedTopology | Peer-to-peer or group coordination pattern without a single controller. | L5 | mech-subagent-orchestration-foundations | needs-corroboration | |
| c-hierarchical-topology | HierarchicalTopology | Coordination pattern with top-level planner and specialized worker layers. | L5 | mech-subagent-orchestration-foundations | candidate | |
| c-dynamic-adaptive-control | DynamicAdaptiveControl | Runtime adjustment of roles, members, routing, or topology based on progress. | L5, L8 | mech-subagent-orchestration-foundations | candidate | |
| c-role-specialization | RoleSpecialization | Assignment of distinct responsibilities, expertise, prompts, or tools to agents. | L2, L5 | mech-subagent-orchestration-foundations | candidate | |
| c-sop-workflow | SOPWorkflow | Standard operating procedure encoded as a role/task sequence with expected artifacts. | L5, L8 | mech-subagent-orchestration-foundations | candidate | MetaGPT evidence. |
| c-conversation-pattern | ConversationPattern | Structured pattern for agent interaction, such as sequential, nested, group, or hierarchical chat. | L4, L5 | mech-subagent-orchestration-foundations | candidate | AutoGen evidence. |
| c-expert-recruitment | ExpertRecruitment | Selection or adjustment of agent group membership for the current task. | L5 | mech-subagent-orchestration-foundations | candidate | AgentVerse evidence. |
| c-group-decision | GroupDecision | Multi-agent discussion, debate, or voting process used to improve answer quality. | L4, L5 | mech-subagent-orchestration-foundations | candidate | Debate/AgentVerse evidence. |
| c-shared-message-pool | SharedMessagePool | Shared communication substrate used by roles to exchange structured messages. | L4, L5 | mech-subagent-orchestration-foundations | needs-corroboration | MetaGPT detail needs full extraction. |
| c-context-isolation | ContextIsolation | Separate context scope for a subagent or worker. | L5, L8 | mech-subagent-orchestration-foundations | candidate | |
| c-budget-policy | BudgetPolicy | Cost, token, latency, or model-selection constraint governing search or delegation. | L8 | mech-subagent-orchestration-foundations, mech-reasoning-topologies-foundations | candidate | |
| c-coordination-overhead | CoordinationOverhead | Extra prompts, traces, token cost, routing complexity, and reliability burden introduced by multi-agent systems. | L8 | mech-subagent-orchestration-foundations | candidate | |
| c-synthesis-step | SynthesisStep | Orchestrator step that merges worker results into a final or intermediate artifact. | L8 | mech-subagent-orchestration-foundations | candidate | |

## Coverage Notes

- Ontology, validation, protocols, statecharts, and LLM-framework tracks now have at least one Phase 0B extraction note.
- Agent mechanism research is now a separate Phase 0B track with initial coverage of reasoning topologies, action/reflection loops, and subagent orchestration.
- Many MAS methodology concepts still need O-MaSE/Gaia/MaSE/Prometheus corroboration.
- Framework-derived concepts are intentionally conservative; most remain adapter-only unless supported by protocol/MAS/statechart evidence.
