# Mechanism Continuity Map, 2022-2026

Date: 2026-06-30
Status: source-first continuity note

## Purpose

This note corrects the shallow mechanism framing from the earlier Phase 0B pass. It maps the continuity of agent mechanisms without deciding ontology layers, canonical relations, or schema fields.

## 2022-2023: Prompted Reasoning And Acting Primitives

The early backbone is not only "CoT." It includes multiple ways to turn language model inference into stepwise control:

- [Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903) established explicit intermediate reasoning as a performance lever for complex tasks.
- [Self-Consistency](https://arxiv.org/abs/2203.11171) shifted the mechanism from one trace to sampled trace ensembles and answer aggregation.
- [ReAct](https://arxiv.org/abs/2210.03629) connected reasoning tokens with environment actions and observations.
- [Program-of-Thoughts](https://arxiv.org/abs/2211.12588), [PAL](https://arxiv.org/abs/2211.10435), and [MRKL](https://arxiv.org/abs/2205.00445) moved some reasoning into symbolic/code/tool execution.
- [Toolformer](https://arxiv.org/abs/2302.04761) treated tool invocation as a learnable augmentation of language modeling.
- [Tree of Thoughts](https://arxiv.org/abs/2305.10601), [Graph of Thoughts](https://arxiv.org/abs/2308.09687), and [Least-to-Most Prompting](https://arxiv.org/abs/2205.10625) expanded decomposition and search over intermediate states.

The continuity point: these sources separate at least four mechanisms that later papers combine - trace generation, decomposition, action/observation loops, and external execution.

## 2023-2024: Search, Reflection, And Agent Frameworks

The next wave made control more explicit:

- [Reflexion](https://arxiv.org/abs/2303.11366) and [Self-Refine](https://arxiv.org/abs/2303.17651) made feedback and self-edit loops central.
- [RAP](https://arxiv.org/abs/2305.14992), [LATS](https://arxiv.org/abs/2310.04406), and [RAFA](https://arxiv.org/abs/2309.13354) connected language-model agents to search, value estimates, and reinforcement-learning-style control.
- [Generative Agents](https://arxiv.org/abs/2304.03442), [MemGPT](https://arxiv.org/abs/2310.08560), and early memory systems made persistence and retrieval part of the agent loop rather than a UI feature.
- [AutoGen](https://github.com/microsoft/autogen), [CAMEL](https://github.com/camel-ai/camel), [AgentVerse](https://github.com/OpenBMB/AgentVerse), [MetaGPT](https://github.com/FoundationAgents/MetaGPT), and [ChatDev](https://github.com/OpenBMB/ChatDev) made multi-agent roles, conversations, and workflow artifacts engineering concerns.

The continuity point: "agent" became an interaction process with state, tools, memory, and possibly multiple role-specialized workers.

## 2024-2025: Benchmarks, GUI/Web Agents, And Security Pressure

The mechanism corpus then widened because benchmark environments exposed failure modes:

- [SWE-bench](https://www.swebench.com/) evaluates software issue resolution and now has verified, multilingual, lite, full, and multimodal variants.
- [OSWorld](https://os-world.github.io/) evaluates real computer tasks in executable desktop environments and reports an OSWorld-Verified upgrade in 2025.
- [tau-bench](https://github.com/sierra-research/tau-bench) and [tau2/tau3-bench](https://github.com/sierra-research/tau2-bench) evaluate tool-agent-user interactions, with the newer repo adding voice and knowledge domains.
- [WebArena](https://webarena.dev/), [VisualWebArena](https://jykoh.com/vwa), [WorkArena](https://github.com/ServiceNow/WorkArena), [AppWorld](https://github.com/stonybrooknlp/appworld), and [Terminal-Bench](https://www.tbench.ai/) broaden environment realism.
- [Agent Security Bench](https://openreview.net/forum?id=V4y0CpX4hK), [AgentDojo](https://github.com/ethz-spylab/agentdojo), and [ToolEmu](https://github.com/ryoungj/ToolEmu) show that tool use introduces security and safety dimensions, not only task success.

The continuity point: benchmark design became part of mechanism understanding. A mechanism that improves a static QA task may fail when tools, user simulation, long context, GUI grounding, or adversarial tool streams are present.

## 2025-2026: Learned Orchestration, Context Control, And Agentic Memory

Recent sources make the mechanism landscape much broader:

- [COMPASS](https://aclanthology.org/2026.acl-long.152/) identifies context management as a bottleneck in long-horizon tool-interaction tasks and separates execution, strategic oversight, and context organization.
- [DeepPlanning](https://aclanthology.org/2026.acl-long.335/) evaluates long-horizon planning with verifiable constraints and active information gathering.
- [Agentic Memory](https://aclanthology.org/2026.acl-long.981/) exposes memory operations as actions and trains memory management into the agent policy.
- [MemPO](https://aclanthology.org/2026.findings-acl.1166.pdf), [Memory as Action](https://arxiv.org/pdf/2510.12635), [MemexRL](https://arxiv.org/pdf/2603.04257), [MAGMA](https://aclanthology.org/2026.acl-long.1709.pdf), and [AMA-Bench](https://arxiv.org/abs/2602.22769v2) show multiple competing ways to manage long-horizon state.
- [Conductor](https://openreview.net/forum?id=U23A2BUKYt), [MAS-Orchestra](https://icml.cc/virtual/2026/poster/66445), [ParaManager](https://arxiv.org/pdf/2604.17009), and [MALT](https://openreview.net/attachment?id=jXP9bgFack&name=pdf) move orchestration from fixed role prompts toward learned or optimized coordination.
- [ToolTree](https://openreview.net/forum?id=Ef5O9gNNLE), [CAR](https://aclanthology.org/2026.findings-acl.869.pdf), and [OrchestrationBench](https://openreview.net/pdf?id=Oljnxmf4pc) make tool planning, failure rectification, and workflow constraints first-class evaluation subjects.

The continuity point: modern mechanisms combine reasoning, search, tools, memory, context compression, orchestration, and safety. Phase 0C should not reduce them to a single "agent loop" without source-backed distinctions.

## Carry-Forward Questions

- Which mechanisms are inference-time procedures, which are learned policies, and which are engineering/runtime capabilities?
- Which claims require hidden chain-of-thought, and which can be represented through observable summaries, actions, traces, or state updates?
- When is multi-agent orchestration beneficial compared with a single agent plus tools? MAS-Orchestra warns that the answer depends on task structure and verification.
- Which benchmark axes are source evidence, and which are later schema design decisions?
