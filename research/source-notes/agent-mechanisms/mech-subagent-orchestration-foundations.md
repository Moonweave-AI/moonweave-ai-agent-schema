# mech-subagent-orchestration-foundations: Subagent Orchestration, Delegation, And Routing

metadata:
  domain: agent-mechanisms
  source_type: multi-source deep-read note
  authority_level: mixed-primary-implementation-and-survey
  temporal_class: current
  published_or_updated: 2023-2026
  last_checked: 2026-06-30
  url: multiple; see covered sources
  deep_read_priority: A

## Covered Sources

| evidence_id | source | source_type | authority | temporal_class |
|---|---|---|---|---|
| cand-mech-autogen-2024 | [AutoGen](http://ryenwhite.com/papers/WuiCOLM2024.pdf) | paper | primary | current |
| cand-mech-metagpt-2023 | [MetaGPT](https://arxiv.org/html/2308.00352v7) | paper | primary | current |
| cand-mech-camel-2023 | [CAMEL](https://proceedings.neurips.cc/paper_files/paper/2023/file/a3621ee907def47c1b952ade25c67698-Paper-Conference.pdf) | paper | primary | current |
| cand-mech-agentverse-2024 | [AgentVerse](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) | paper | primary | current |
| cand-mech-chatdev-2024 | [ChatDev](https://aclanthology.org/anthology-files/pdf/acl/2024.acl-long.810.pdf) | paper | primary | current |
| cand-mech-debate-du-2024 | [Multiagent Debate](https://proceedings.mlr.press/v235/du24e.html) | paper | primary | current |
| cand-mech-orchestration-survey-2026 | [LLM-Based Multi-Agent Orchestration](https://www.mdpi.com/1999-5903/18/6/326) | survey | secondary | current |
| cand-mech-openai-orchestration-docs | [OpenAI Orchestration and Handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration) | official-doc | primary | current-docs |
| cand-mech-anthropic-research-system-2025 | [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | engineering-writeup | primary | current |
| cand-mech-aorchestra-2026 | [AOrchestra](https://arxiv.org/pdf/2602.03786) | paper | primary | current |
| cand-mech-uno-orchestra-2026 | [Uno-Orchestra](https://arxiv.org/html/2605.05007v1) | paper | primary | current |
| cand-mech-agentorchestra-2025 | [AgentOrchestra](https://arxiv.org/html/2506.12508v1) | paper | primary | current |

## Why This Source Matters

Subagent orchestration is a mechanism layer that cuts across MAS theory, protocols, and frameworks. These sources show multiple ownership models: conversation programming, role-playing, SOP-based assembly lines, expert recruitment, group decision/debate, supervisor-worker patterns, agents-as-tools, handoffs, dynamic subagent creation, and learned routing under budget.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| Orchestrator | Agent/controller that decomposes work, delegates subtasks, routes messages, and synthesizes results. | Anthropic lead researcher, AgentOrchestra planner, Uno-Orchestra policy, AOrchestra central orchestrator. | high | L2, L4, L5 |
| Subagent | Scoped agent instance delegated a bounded task by an orchestrator or peer. | Anthropic subagents, AOrchestra sub-agent-as-tools, OpenAI agents-as-tools. | high | L2, L5 |
| WorkerAgent | Subagent or specialist that executes an assigned subtask and returns findings/artifacts. | Orchestrator-worker pattern in Anthropic and orchestration survey; AutoGen conversable agents. | high | L2, L5 |
| Delegation | Assignment of a subtask or responsibility from one agent/controller to another. | OpenAI handoffs/agents-as-tools, Anthropic subagents, AgentOrchestra delegation. | high | L4, L5 |
| DelegationOwnership | Who owns final user-facing answer or conversation branch after delegation. | OpenAI distinguishes handoffs from agents-as-tools by ownership transfer versus manager retention. | high | L4, L5 |
| Handoff | Delegation pattern where control moves to a specialist. | OpenAI orchestration docs; prior framework notes. | high | L4, L5 |
| AgentsAsTools | Delegation pattern where manager remains in control and calls a specialist as a bounded capability. | OpenAI docs and AOrchestra sub-agent-as-tools evidence. | high | L5 |
| TaskDecomposition | Breaking a complex objective into subtasks, often with dependencies. | MetaGPT, AgentVerse, Anthropic, Uno-Orchestra, AgentOrchestra. | high | L4, L5 |
| Subtask | Bounded unit of delegated work with input, expected output, and possibly dependencies. | Anthropic creates specific research tasks; Uno-Orchestra emits subtasks and routing decisions. | high | L4, L5 |
| RoutingPolicy | Rule, model, or learned policy selecting which worker/model/tool handles each task. | Uno-Orchestra jointly learns decomposition and routing; OpenAI routing guidance; AutoGen group chat selection. | high | L5, L8 |
| WorkerSelection | Concrete choice of worker, model, primitive, role, or tool for a subtask. | Uno-Orchestra routes each subtask to a model/primitive pair; AOrchestra selects tools/models. | high | L5 |
| OrchestrationTopology | Structural coordination pattern among agents. | 2026 survey proposes centralized, decentralized, hierarchical plus dynamic-adaptive axis. | high | L4, L5 |
| CentralizedTopology | Coordination pattern with one controlling coordinator/supervisor. | Survey, Anthropic lead researcher, AgentOrchestra planner. | high | L5 |
| DecentralizedTopology | Coordination pattern with peer-to-peer or group communication rather than one supervisor. | Survey and debate/group collaboration sources. | medium | L5 |
| HierarchicalTopology | Coordination pattern with top-level planner and nested or specialized workers. | AgentOrchestra and orchestration survey. | high | L5 |
| DynamicAdaptiveControl | Runtime adjustment of roles, members, routing, or topology based on progress. | AgentVerse adjusts group composition; AOrchestra dynamically creates subagents; Uno-Orchestra learns selective delegation. | high | L5, L8 |
| RoleSpecialization | Assignment of distinct responsibilities, expertise, or prompts to agents. | MetaGPT roles/SOPs, CAMEL role-playing, ChatDev software roles. | high | L2, L5 |
| SOPWorkflow | Standard operating procedure encoded as role/task sequence and expected artifacts. | MetaGPT encodes SOPs into prompt sequences and structured handoffs. | high | L5, L8 |
| ConversationPattern | Structured pattern for agent interaction, such as sequential, nested, group, or hierarchical chat. | AutoGen supports flexible conversation patterns and conversation programming. | high | L4, L5 |
| ExpertRecruitment | Selecting or adjusting agent group membership for the current task. | AgentVerse uses expert recruitment as a stage. | high | L5 |
| GroupDecision | Multi-agent discussion or debate process used to improve answer quality. | AgentVerse collaborative decision-making; multiagent debate. | high | L4, L5 |
| SharedMessagePool | Shared communication substrate or pool used by roles to exchange structured messages. | MetaGPT uses structured messages and publish/subscribe-like coordination. | medium | L4, L5 |
| ContextIsolation | Separate context windows or scoped context for subagents. | Anthropic uses parallel subagents with their own contexts; AOrchestra highlights context isolation tradeoffs. | high | L5, L8 |
| BudgetPolicy | Cost, token, latency, or model-selection constraints governing delegation/search. | Anthropic reports token cost tradeoffs; Uno-Orchestra optimizes under explicit cost budget; AOrchestra targets performance-cost tradeoff. | high | L8 |
| CoordinationOverhead | Extra prompts, traces, token cost, routing complexity, and reliability burden introduced by multi-agent systems. | Anthropic and OpenAI both warn about cost/complexity; AOrchestra discusses overhead and context routing issues. | high | L8 |
| SynthesisStep | Orchestrator step that merges worker results into final or intermediate artifact. | Anthropic lead researcher synthesizes subagent results; OpenAI agents-as-tools keeps manager synthesis. | high | L8 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| decomposes | Orchestrator | Task | Anthropic, AgentOrchestra, Uno-Orchestra. | high | Task concept already exists. |
| creates | Orchestrator | Subagent | Anthropic spawns subagents; AOrchestra creates agents on demand. | high | |
| delegates | Orchestrator | Subtask | OpenAI, Anthropic, AgentOrchestra. | high | |
| assigned_to | Subtask | WorkerAgent | Uno-Orchestra routes subtasks to workers/model-primitive pairs. | high | |
| selects | RoutingPolicy | WorkerAgent | Uno-Orchestra and OpenAI routing guidance. | high | |
| has_topology | Orchestrator | OrchestrationTopology | 2026 orchestration survey. | high | |
| transfers_control_to | Handoff | Subagent | OpenAI handoffs. | high | |
| calls_as_tool | AgentsAsTools | Subagent | OpenAI agents-as-tools and AOrchestra. | high | |
| specializes | RoleSpecialization | Agent | CAMEL, MetaGPT, ChatDev. | high | |
| structures | SOPWorkflow | ConversationPattern | MetaGPT and ChatDev. | medium | |
| recruits | ExpertRecruitment | WorkerAgent | AgentVerse. | high | |
| discusses_with | GroupDecision | WorkerAgent | AgentVerse and debate sources. | high | |
| isolates_context_for | ContextIsolation | Subagent | Anthropic and AOrchestra. | high | |
| limits | BudgetPolicy | Delegation | Anthropic, Uno-Orchestra, AOrchestra. | high | |
| synthesizes | Orchestrator | Artifact | Anthropic, OpenAI agents-as-tools. | high | Artifact concept already exists. |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| task_analyzed | Orchestrator | user request | no | Anthropic, AgentOrchestra | |
| subtasks_created | TaskDecomposition | decomposition step | no | Uno-Orchestra, Anthropic | |
| worker_selected | RoutingPolicy | subtask ready | no | Uno-Orchestra, AOrchestra | |
| subagent_spawned | Subagent | dynamic creation or tool call | no | Anthropic, AOrchestra | |
| control_transferred | Handoff | handoff selected | no | OpenAI | |
| bounded_worker_called | AgentsAsTools | manager tool call | no | OpenAI | |
| worker_result_returned | WorkerAgent | subtask completion | no | Anthropic, OpenAI | |
| result_synthesized | SynthesisStep | enough worker results | maybe | Anthropic | |
| more_research_requested | Orchestrator | insufficient evidence | no | Anthropic research loop | |
| budget_exhausted | BudgetPolicy | cost/token/latency threshold | yes | Anthropic, Uno-Orchestra | |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| Delegation should record ownership semantics. | DelegationOwnership | OpenAI handoffs versus agents-as-tools | structural enum | Frameworks may use different names. |
| Subagent execution should record context scope and visible inputs. | ContextIsolation | Anthropic and AOrchestra | provenance/security constraint | Needed for privacy and reproducibility. |
| Routing decisions should record selected worker/model/tool and reason when available. | RoutingPolicy | Uno-Orchestra, AOrchestra | provenance schema | Learned routers may not expose reasons. |
| Orchestration topology should be explicit when modeling a multi-agent workflow. | OrchestrationTopology | 2026 survey | profile/enum | Topologies can be hybrid. |
| Budget policy should attach to both search and delegation. | BudgetPolicy | Anthropic, Uno-Orchestra, AOrchestra | structural schema | Token/cost data may be provider-specific. |
| Worker output should have an expected contract. | Subtask, WorkerAgent | OpenAI specialist guidance; ChatDev and MetaGPT structured outputs | schema/validation | Overly rigid contracts can block exploratory work. |

## Schema Implications

Facts only. No final schema decisions.

- Subagent orchestration needs concepts for delegation ownership, not just an edge from Agent to Agent.
- Handoff and agents-as-tools should remain distinct because they differ in who owns the next user-facing answer.
- Dynamic creation sources support representing subagent configuration as instruction, context, tools, and model-like facets, but the exact tuple should remain a runtime/profile candidate until Phase 0C.
- Orchestration topology should be independent from transport protocol; MCP/A2A can carry parts of the workflow but do not define the whole mechanism.
- Budget/cost and traceability are mechanism-level constraints, not afterthought observability fields.
- Context isolation is both a capability and a risk control; it needs input/output/provenance metadata.

## Framework Or Standard Specificity

Core candidates:

- Orchestrator
- Subagent
- Delegation
- DelegationOwnership
- TaskDecomposition
- RoutingPolicy
- OrchestrationTopology
- ContextIsolation
- BudgetPolicy

Likely adapter/runtime-only until Phase 0C:

- AutoGen GroupChatManager policies.
- MetaGPT exact SOP artifact types.
- ChatDev chat-chain phases.
- OpenAI SDK API object names.
- AOrchestra four-field tuple as a fixed schema.
- Uno-Orchestra training pipeline and reward design.

## Contradictions And Open Questions

- OpenAI guidance says add specialists only when the contract changes; Anthropic evidence shows multi-agent research can substantially outperform single agents in breadth-heavy research but at much higher token cost. The schema should capture both value and overhead.
- Subagent-as-tool keeps manager ownership; handoff transfers control. Treating both as generic delegation would erase an important engineering distinction.
- Static role systems such as MetaGPT/ChatDev provide structure, while AOrchestra/Uno-Orchestra argue for dynamic creation/routing. Phase 0C needs a static/dynamic axis.
- Decentralized debate and centralized supervisor-worker orchestration both use multiple agents but imply different trace, state, and responsibility models.
- Context isolation reduces context pollution but can also hide relevant information from workers; subtask contracts and synthesis records need provenance.

## Follow-Up Sources

- Full official docs extraction for LangGraph supervisors/subgraphs, CrewAI delegation, AutoGen group chat, and Microsoft Agent Framework workflows.
- Additional empirical benchmarks for when multi-agent orchestration beats single-agent or single-loop systems.
- Security review for worker permissions, context filtering, secret exposure, and trace retention.
