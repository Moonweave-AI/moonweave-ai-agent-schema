# mas-bdi-agentspeak-foundations: BDI, AgentSpeak, OASIS, and LLM-MAS Foundations

metadata:
  domain: multi-agent-systems
  source_type: source-family
  authority_level: mixed-primary-secondary
  temporal_class: foundational-plus-current
  published_or_updated: 1991 to 2026-05-29
  last_checked: 2026-06-30
  url: https://jmvidal.cse.sc.edu/library/rao91a.pdf
  deep_read_priority: A

## Covered Sources

| source_id | title | url | authority | temporal_class |
|---|---|---|---|---|
| mas-bdi-rao-georgeff-1991 | Modeling Rational Agents within a BDI-Architecture | https://jmvidal.cse.sc.edu/library/rao91a.pdf | paper | foundational |
| mas-bdi-theory-practice-1995 | BDI Agents: From Theory to Practice | https://cdn.aaai.org/ICMAS/1995/ICMAS95-042.pdf | paper | foundational |
| mas-agentspeak-1996 | AgentSpeak(L): BDI agents speak out in a logical computable language | https://link.springer.com/chapter/10.1007/BFb0031845 | paper | foundational |
| mas-oasis-v2-2023 | OASIS version 2 | https://arxiv.org/html/2306.10061v2 | ontology-paper | current |
| cand-mas-llm-multiagents-2024 | Large Language Model Based Multi-agents | https://www.ijcai.org/proceedings/2024/890 | survey | current |
| cand-mas-communication-2026 | Beyond Self-Talk | https://journal.hep.com.cn/fcs/EN/10.1007/s11704-026-50857-y | survey | current |

## Why This Source Family Matters

BDI and AgentSpeak provide the durable mental-state and plan-execution vocabulary. OASIS v2 gives a current ontology view of agents, commitments, tasks, and behavioristic modeling. Recent LLM-MAS surveys provide current evidence on profiling, communication, collaboration, and benchmarking, but remain secondary evidence for final ontology choices.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| Belief | Informational state of an agent. | BDI papers treat belief as one of the major mental attitudes. | high | L3 |
| Desire/Goal | Motivational state or desired condition. | BDI work treats desires/goals as motivational states. | high | L3 |
| Intention | Deliberative commitment to a course of action or partial plan. | Rao and Georgeff model intentions as first-class and commitment-bearing. | high | L3 |
| Commitment Strategy | Policy governing persistence or abandonment of intentions/goals. | BDI formalism compares commitment strategies under changing beliefs/goals/intentions. | high | L3 |
| Plan | Operational structure connecting triggers, context, and actions/subgoals. | AgentSpeak abstracts practical BDI systems with plans and operational semantics. | high | L4 |
| Triggering Event | Event that activates an AgentSpeak-style plan. | AgentSpeak links events to plan derivation and execution. | high | L4 |
| Context Condition | Condition under which a plan is applicable. | AgentSpeak plans include context-like applicability. | high | L4 |
| Agent Template | Reusable agent description. | OASIS v2 discusses agent templates and concrete agents. | medium | L2 |
| Concrete Agent | Actual agent instance. | OASIS v2 differentiates templates from concrete agents. | medium | L2 |
| Commitment | Agent relation to task/plan fulfillment. | OASIS v2 focuses on commitments, plans, and entrustments. | high | L3, L4 |
| Entrustment | Delegation-like relation assigning a task/plan to another agent. | OASIS v2 introduces and revises entrustment modeling. | medium | L4 |
| Agent Profile | Role/persona/capability description in LLM-MAS. | IJCAI 2024 survey highlights profiling and communication methods. | medium | L2 |
| Communication Mechanism | How agents exchange information and coordinate behavior. | 2026 communication-centric survey centers architecture, goals, protocols, strategies, objects, and content. | high | L4 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| agent_has_belief | Agent | Belief | BDI architecture models beliefs as informational state. | high | Core mental-state candidate. |
| agent_has_goal | Agent | Goal | BDI architecture models goals/desires as motivational state. | high | Keep goal/desire naming decision open. |
| agent_committed_to_intention | Agent | Intention | BDI intention is commitment-bearing. | high | Needs lifecycle state. |
| intention_realized_by_plan | Intention | Plan | BDI/AgentSpeak bridge theory to practical plan libraries. | medium | Direct mapping varies by implementation. |
| event_triggers_plan | Triggering Event | Plan | AgentSpeak uses triggering events. | high | Protocol events may also trigger plans. |
| context_enables_plan | Context Condition | Plan | AgentSpeak plans are selected under conditions. | high | Candidate for validation constraints. |
| agent_entrusts_task | Agent | Agent | OASIS v2 models entrustments around agents/plans/tasks. | medium | Needs deeper extraction from OASIS sections. |
| agent_communicates_with | Agent | Agent | LLM-MAS surveys center communication for coordination. | high | Needs protocol-specific refinement. |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| belief_updated | Belief Base | observation/message/tool result | no | BDI treats beliefs as dynamic informational state. | Candidate state, needs source pairing with implementation docs. |
| goal_adopted | Goal | deliberation/user task | no | BDI motivational state. | Naming may become desire/goal depending on source synthesis. |
| intention_committed | Intention | goal selected for action | no | BDI commitment strategies. | Should include commitment policy. |
| intention_dropped | Intention | achieved, unachievable, or commitment condition changes | maybe | BDI commitment strategy discussion. | Terminal for a specific intention instance. |
| plan_triggered | Plan | matching triggering event | no | AgentSpeak plan execution model. | |
| plan_failed | Plan Execution | action failure or context invalidation | maybe | Practical BDI systems distinguish attempts/failures. | Needs runtime-specific evidence. |
| communication_round | Multi-agent Interaction | message exchange | no | LLM-MAS communication surveys. | Belongs in protocol/interaction layer. |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| Mental-state concepts must not be collapsed into implementation prompt fields. | Agent, Belief, Goal, Intention | BDI treats these as conceptual attitudes; CrewAI/OpenAI model prompt fields differently. | semantic | LLM frameworks may use role/goal text casually. |
| A Plan should specify trigger and applicability context when claiming AgentSpeak compatibility. | Plan | AgentSpeak operational semantics. | structural + semantic | Some modern frameworks do not expose formal plan objects. |
| Commitment lifecycle should record adoption and abandonment conditions. | Intention, Commitment | BDI commitment strategies. | semantic | May overfit BDI if used for all agents. |
| LLM-MAS communication claims need protocol-layer evidence. | CommunicationMechanism | Recent surveys are secondary evidence. | evidence | Surveys alone cannot define canonical protocol fields. |

## Schema Implications

Facts only, no final schema decisions:

- Belief, Goal/Desire, Intention, Plan, Commitment, Role/Profile, and CommunicationMechanism are concept candidates.
- AgentSpeak suggests plan fields such as trigger, contextCondition, body/action sequence, subgoals, and failure handling.
- OASIS v2 supports representing agents behavioristically through capabilities, tasks, commitments, plans, and entrustments.
- Recent LLM-MAS surveys support communication-centric dimensions, but final fields need protocol and framework corroboration.

## Framework Or Standard Specificity

Core candidates:

- Belief, Goal, Intention, Plan, Commitment, Role, Capability, CommunicationMechanism.

Adapter-only or source-specific candidates:

- AgentSpeak plan syntax, BDI modal logic notation, OASIS blockchain-specific modeling, LLM-MAS survey taxonomy labels.

## Contradictions And Open Questions

| issue | evidence | impact | owner | deadline |
|---|---|---|---|---|
| Desire versus Goal naming varies across BDI, AgentSpeak, and modern frameworks. | BDI uses belief/desire/intention; many frameworks expose goals. | Need canonical naming or aliases. | research/multi-agent-systems | Before Phase 0C |
| Mental-state models may not fit purely reactive or tool-only agents. | BDI papers focus rational agents; LLM frameworks often expose loops/tools. | Need optionality and agent architecture taxonomy. | research/multi-agent-systems | Before Phase 0C |
| LLM-MAS surveys are current but secondary. | IJCAI 2024 and 2026 communication survey synthesize literature. | Use for coverage, not final schema truth alone. | research/multi-agent-systems | Before Phase 0C |

## Follow-Up Sources

- Wooldridge and Jennings for autonomy/reactivity/proactivity/social ability.
- O-MaSE, Gaia, MaSE, Prometheus for organization, role, and protocol modeling.
- Full OASIS v2 sections on commitments, plans, and entrustments.
- Current Five Ws communication survey for cross-domain communication dimensions.
