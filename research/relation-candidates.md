# Phase 0B Relation Candidates

Generated: 2026-06-30
Status: initial Phase 0B extraction
Scope: candidate relations only. These are not final schema edges.

## Relation Candidates

| id | relation | source_concept | target_concept | evidence_ids | status | notes |
|---|---|---|---|---|---|---|
| r-source-produced-by-activity | produced_by | SourceRecord | ExtractionActivity | ont-owl-shacl-foundations | candidate | PROV-style provenance. |
| r-activity-attributed-to-agent | attributed_to | ExtractionActivity | ProvenanceAgent | ont-owl-shacl-foundations | candidate | Distinguish from MAS Agent. |
| r-ontology-has-concept | has_concept | Ontology | Concept | ont-owl-shacl-foundations | candidate | |
| r-ontology-has-relation | has_relation | Ontology | Relation | ont-owl-shacl-foundations | candidate | |
| r-relation-has-domain | has_domain | Relation | Concept | ont-owl-shacl-foundations | candidate | RDFS follow-up needed. |
| r-relation-has-range | has_range | Relation | Concept | ont-owl-shacl-foundations | candidate | RDFS follow-up needed. |
| r-shape-validates-graph | validates_graph | Shape | RDFGraph | ont-owl-shacl-foundations, val-jsonschema-zod-pydantic-foundations | candidate | Semantic validation. |
| r-validation-run-produces-report | produces_report | Validator | ValidationReport | val-jsonschema-zod-pydantic-foundations | candidate | Applies to JSON Schema and SHACL variants. |
| r-agent-has-belief | has_belief | Agent | Belief | mas-bdi-agentspeak-foundations | candidate | Foundational BDI. |
| r-agent-has-goal | has_goal | Agent | Goal | mas-bdi-agentspeak-foundations | candidate | Goal/desire naming unresolved. |
| r-agent-has-intention | has_intention | Agent | Intention | mas-bdi-agentspeak-foundations | candidate | |
| r-agent-committed-to | committed_to | Agent | Commitment | mas-bdi-agentspeak-foundations | candidate | Needs commitment target relation. |
| r-intention-realized-by-plan | realized_by | Intention | Plan | mas-bdi-agentspeak-foundations | needs-corroboration | AgentSpeak/BDI bridge. |
| r-plan-triggered-by-event | triggered_by | Plan | TriggeringEvent | mas-bdi-agentspeak-foundations | candidate | |
| r-plan-enabled-by-context | enabled_by | Plan | ContextCondition | mas-bdi-agentspeak-foundations | candidate | ContextCondition not yet in concept table; add if retained. |
| r-agent-entrusts-task-to-agent | entrusts_task_to | Agent | Agent | mas-bdi-agentspeak-foundations | needs-corroboration | OASIS v2 deeper extraction needed. |
| r-agent-communicates-with-agent | communicates_with | Agent | Agent | mas-bdi-agentspeak-foundations, proto-fipa-mcp-a2a-foundations | candidate | Protocol-specific edges should specialize this. |
| r-message-has-performative | has_performative | Message | Performative | proto-fipa-mcp-a2a-foundations | needs-corroboration | FIPA-specific unless generalized. |
| r-message-sent-by | sent_by | Message | Agent | proto-fipa-mcp-a2a-foundations | candidate | |
| r-message-received-by | received_by | Message | Agent | proto-fipa-mcp-a2a-foundations | candidate | |
| r-message-uses-ontology | uses_ontology | Message | Ontology | proto-fipa-mcp-a2a-foundations | candidate | |
| r-message-part-of-conversation | part_of_conversation | Message | Conversation | proto-fipa-mcp-a2a-foundations | candidate | |
| r-server-exposes-tool | exposes_tool | MCPServer | Tool | proto-fipa-mcp-a2a-foundations | adapter-only | MCP-specific. |
| r-client-calls-tool | calls_tool | MCPClient | Tool | proto-fipa-mcp-a2a-foundations | adapter-only | MCP-specific. |
| r-agent-advertises-agent-card | advertises | Agent | AgentCard | proto-fipa-mcp-a2a-foundations | adapter-only | A2A-specific. |
| r-task-produces-artifact | produces_artifact | Task | Artifact | proto-fipa-mcp-a2a-foundations | candidate | A2A strong; framework corroboration needed. |
| r-operation-bound-to-protocol | bound_to | AbstractOperation | ProtocolBinding | proto-fipa-mcp-a2a-foundations | candidate | A2A model. |
| r-machine-has-state | has_state | Machine | StateNode | state-scxml-xstate-foundations | candidate | |
| r-state-has-transition | has_transition | StateNode | Transition | state-scxml-xstate-foundations | candidate | |
| r-transition-triggered-by-event | triggered_by | Transition | Event | state-scxml-xstate-foundations, mas-bdi-agentspeak-foundations | candidate | Cross-layer event model. |
| r-transition-guarded-by | guarded_by | Transition | Guard | state-scxml-xstate-foundations | candidate | |
| r-transition-has-action | has_action | Transition | Action | state-scxml-xstate-foundations | needs-corroboration | Entry/exit actions may be state-owned. |
| r-state-contains-state | contains_state | StateNode | StateNode | state-scxml-xstate-foundations | candidate | Hierarchy. |
| r-parallel-has-region | has_region | ParallelState | Region | state-scxml-xstate-foundations | needs-corroboration | Region concept not yet extracted separately. |
| r-actor-emits-snapshot | emits_snapshot | ActorRef | Snapshot | state-scxml-xstate-foundations | candidate | |
| r-path-contains-step | contains_step | Path | Step | state-scxml-xstate-foundations | candidate | Step concept may be verification-layer only. |
| r-graph-has-node | has_node | GraphWorkflow | Node | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific. |
| r-graph-has-edge | has_edge | GraphWorkflow | Edge | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific. |
| r-node-reads-state | reads_state | Node | StateSchema | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific. |
| r-node-updates-state | updates_state | Node | StateSchema | fw-langgraph-openai-crewai-foundations | adapter-only | LangGraph-specific. |
| r-agent-hands-off-to-agent | hands_off_to | Agent | Agent | fw-langgraph-openai-crewai-foundations | candidate | OpenAI handoffs, LangGraph routing follow-up. |
| r-guardrail-validates-input | validates_input | Guardrail | Input | fw-langgraph-openai-crewai-foundations | candidate | Runtime validation. |
| r-guardrail-validates-output | validates_output | Guardrail | Output | fw-langgraph-openai-crewai-foundations | candidate | Runtime validation. |
| r-trace-contains-span | contains_span | Trace | Span | fw-langgraph-openai-crewai-foundations | candidate | |
| r-crew-has-agent | has_agent | Crew | Agent | fw-langgraph-openai-crewai-foundations | adapter-only | CrewAI-specific. |
| r-task-assigned-to-agent | assigned_to | Task | Agent | fw-langgraph-openai-crewai-foundations | candidate | CrewAI/OASIS/A2A need reconciliation. |
| r-schema-declares-dialect | declares_dialect | SchemaArtifact | Dialect | val-jsonschema-zod-pydantic-foundations | candidate | |
| r-meta-schema-validates-schema | validates_schema | MetaSchema | SchemaArtifact | val-jsonschema-zod-pydantic-foundations | candidate | |
| r-zod-generates-json-schema | generates_schema | ZodSchema | SchemaArtifact | val-jsonschema-zod-pydantic-foundations | adapter-only | |
| r-pydantic-generates-json-schema | generates_schema | PydanticModel | SchemaArtifact | val-jsonschema-zod-pydantic-foundations | adapter-only | |
| r-schema-conversion-produces-warning | produces_warning | SchemaConversion | ConversionWarning | val-jsonschema-zod-pydantic-foundations | candidate | |
| r-reasoning-trace-contains-thought | contains_thought | ReasoningTrace | Thought | mech-reasoning-topologies-foundations | candidate | Trace may contain summaries or visible reasoning artifacts, not hidden CoT. |
| r-reasoning-topology-contains-path | contains_path | ReasoningTopology | ReasoningPath | mech-reasoning-topologies-foundations | candidate | |
| r-topology-structures-path | structures_path | ReasoningTopology | ReasoningPath | mech-reasoning-topologies-foundations | candidate | |
| r-tree-branches-from-thought | branches_from | TreeTopology | Thought | mech-reasoning-topologies-foundations | candidate | |
| r-graph-merges-thoughts | merges_thoughts | GraphTopology | Thought | mech-reasoning-topologies-foundations | candidate | |
| r-evaluator-evaluates-thought | evaluates | ThoughtEvaluator | Thought | mech-reasoning-topologies-foundations | candidate | |
| r-search-controller-selects-thought | selects | SearchController | Thought | mech-reasoning-topologies-foundations | candidate | |
| r-answer-aggregation-aggregates-path | aggregates | AnswerAggregation | ReasoningPath | mech-reasoning-topologies-foundations | candidate | |
| r-thought-uses-modality | uses_modality | Thought | ReasoningModality | mech-reasoning-topologies-foundations | candidate | |
| r-search-controller-uses-branching-policy | uses_policy | SearchController | BranchingPolicy | mech-reasoning-topologies-foundations | needs-corroboration | |
| r-search-controller-uses-backtracking-policy | uses_policy | SearchController | BacktrackingPolicy | mech-reasoning-topologies-foundations | candidate | |
| r-reason-act-loop-has-action-step | has_action_step | ReasonActLoop | ActionStep | mech-action-reflection-loop-foundations | candidate | |
| r-action-step-produces-observation | produces_observation | ActionStep | Observation | mech-action-reflection-loop-foundations | candidate | |
| r-environment-returns-observation | returns_observation | Environment | Observation | mech-action-reflection-loop-foundations | candidate | |
| r-observation-triggers-replanning | triggers | Observation | ReplanningEvent | mech-action-reflection-loop-foundations | candidate | |
| r-feedback-generates-reflection | generates | FeedbackSignal | Reflection | mech-action-reflection-loop-foundations | candidate | |
| r-reflection-stored-in-memory | stored_in | Reflection | VerbalReinforcementMemory | mech-action-reflection-loop-foundations | candidate | |
| r-self-feedback-refines-output | refines | SelfFeedback | RefinedOutput | mech-action-reflection-loop-foundations | candidate | |
| r-value-function-scores-search-tree | scores | ValueFunction | SearchTree | mech-action-reflection-loop-foundations | candidate | |
| r-planned-trajectory-has-action-step | has_action_step | PlannedTrajectory | ActionStep | mech-action-reflection-loop-foundations | candidate | |
| r-goal-state-reflection-compares-goal | compares_to_goal | GoalStateReflection | Goal | mech-action-reflection-loop-foundations | candidate | Goal concept has MAS evidence; semantics need reconciliation. |
| r-orchestrator-decomposes-task | decomposes | Orchestrator | Task | mech-subagent-orchestration-foundations | candidate | |
| r-orchestrator-creates-subagent | creates | Orchestrator | Subagent | mech-subagent-orchestration-foundations | candidate | |
| r-orchestrator-delegates-subtask | delegates | Orchestrator | Subtask | mech-subagent-orchestration-foundations | candidate | |
| r-subtask-assigned-to-worker | assigned_to | Subtask | WorkerAgent | mech-subagent-orchestration-foundations | candidate | |
| r-routing-policy-selects-worker | selects | RoutingPolicy | WorkerAgent | mech-subagent-orchestration-foundations | candidate | |
| r-worker-selection-selects-subagent | selects | WorkerSelection | Subagent | mech-subagent-orchestration-foundations | candidate | |
| r-orchestrator-has-topology | has_topology | Orchestrator | OrchestrationTopology | mech-subagent-orchestration-foundations | candidate | |
| r-orchestration-topology-has-centralized-profile | has_profile | OrchestrationTopology | CentralizedTopology | mech-subagent-orchestration-foundations | candidate | |
| r-orchestration-topology-has-decentralized-profile | has_profile | OrchestrationTopology | DecentralizedTopology | mech-subagent-orchestration-foundations | needs-corroboration | Hybrid topologies require care. |
| r-orchestration-topology-has-hierarchical-profile | has_profile | OrchestrationTopology | HierarchicalTopology | mech-subagent-orchestration-foundations | candidate | |
| r-handoff-transfers-control-to-subagent | transfers_control_to | Handoff | Subagent | mech-subagent-orchestration-foundations, fw-langgraph-openai-crewai-foundations | candidate | |
| r-agents-as-tools-calls-subagent | calls_as_tool | AgentsAsTools | Subagent | mech-subagent-orchestration-foundations | candidate | |
| r-delegation-has-ownership | has_ownership | Delegation | DelegationOwnership | mech-subagent-orchestration-foundations | candidate | |
| r-role-specialization-specializes-agent | specializes | RoleSpecialization | Agent | mech-subagent-orchestration-foundations | candidate | |
| r-sop-structures-conversation-pattern | structures | SOPWorkflow | ConversationPattern | mech-subagent-orchestration-foundations | needs-corroboration | |
| r-expert-recruitment-selects-worker | selects | ExpertRecruitment | WorkerAgent | mech-subagent-orchestration-foundations | candidate | |
| r-group-decision-involves-worker | involves | GroupDecision | WorkerAgent | mech-subagent-orchestration-foundations | candidate | |
| r-shared-message-pool-contains-message | contains_message | SharedMessagePool | Message | mech-subagent-orchestration-foundations | needs-corroboration | |
| r-context-isolation-scopes-subagent | scopes | ContextIsolation | Subagent | mech-subagent-orchestration-foundations | candidate | |
| r-budget-policy-limits-delegation | limits | BudgetPolicy | Delegation | mech-subagent-orchestration-foundations | candidate | |
| r-budget-policy-limits-search-controller | limits | BudgetPolicy | SearchController | mech-reasoning-topologies-foundations, mech-subagent-orchestration-foundations | candidate | |
| r-coordination-overhead-affects-orchestrator | affects | CoordinationOverhead | Orchestrator | mech-subagent-orchestration-foundations | candidate | |
| r-orchestrator-synthesizes-artifact | synthesizes | Orchestrator | Artifact | mech-subagent-orchestration-foundations | candidate | |
| r-synthesis-step-produces-artifact | produces_artifact | SynthesisStep | Artifact | mech-subagent-orchestration-foundations | candidate | |

## Relation Review Notes

- Candidate relations are intentionally verbose at this stage; Phase 0C can merge or rename them.
- Relation direction follows extraction convenience, not final API ergonomics.
- Adapter-only relations are still valuable because they define future import/export mappings.
