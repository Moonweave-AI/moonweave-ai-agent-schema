# Security, Memory, And Orchestration Mechanisms, 2025-2026

Date: 2026-06-30
Status: source-first note

## Purpose

This note records the recent mechanism evidence that most directly challenged the earlier shallow Phase 0B framing. It does not add canonical concepts or relation rows.

## Security Mechanisms

Priority sources:

- [Agent Security Bench](https://openreview.net/forum?id=V4y0CpX4hK) benchmarks prompt injection, memory poisoning, Plan-of-Thought backdoors, mixed attacks, and defenses across agents, tools, scenarios, and backbones.
- [Agents Under Siege](https://aclanthology.org/anthology-files/anthology-files/pdf/acl/2025.acl-long.476.pdf) targets pragmatic multi-agent systems with bandwidth, latency, topology, and defense constraints.
- [Conjunctive Prompt Attacks in Multi-Agent LLM Systems](https://aclanthology.org/2026.acl-long.1577.pdf) shows that benign-looking fragments can activate harmful behavior only when routed together.
- [VIGIL](https://aclanthology.org/2026.acl-long.443.pdf) proposes a verify-before-commit protocol for tool-stream injection and introduces SIREN.
- [ToolSafe](https://aclanthology.org/2026.findings-acl.1850.pdf) studies proactive step-level tool invocation safety and feedback.
- [MCP Security Bench](https://arxiv.org/pdf/2510.15994) focuses on MCP-specific attacks across planning, invocation, and response handling.
- [ACIArena](https://arxiv.org/pdf/2604.07775), [MASPI](https://openreview.net/pdf?id=1khmNRuIf9), and [TrojanTools](https://openreview.net/pdf/d28c9b8559a20b19a1ecacc0bb31c0a41f89bcfe.pdf) add multi-agent cascading and indirect prompt injection evidence.

Source-first observation: modern agent security is structural. It involves routing, tool metadata, tool outputs, memory retrieval, cross-agent trust, and commit points, not only single-prompt filtering.

## Memory And Context Mechanisms

Priority sources:

- [COMPASS](https://aclanthology.org/2026.acl-long.152/) treats context management as a bottleneck and separates execution, strategic oversight, and context organization.
- [Agentic Memory](https://aclanthology.org/2026.acl-long.981/) trains memory operations as policy actions.
- [MemPO](https://aclanthology.org/2026.findings-acl.1166.pdf) optimizes self-memory policies for long-horizon agents.
- [Memory as Action](https://arxiv.org/pdf/2510.12635) frames working memory editing as an action in the agent policy.
- [MemexRL](https://arxiv.org/pdf/2603.04257) uses indexed experience memory and dereferencing.
- [MAGMA](https://aclanthology.org/2026.acl-long.1709.pdf) uses multiple graph views for semantic, temporal, causal, and entity memory.
- [AMA-Bench](https://arxiv.org/abs/2602.22769v2), [EvoMemBench](https://arxiv.org/html/2605.18421), and [Evo-Memory](https://arxiv.org/html/2511.20857) broaden memory evaluation.

Source-first observation: memory is not one component. The sources distinguish context summaries, retrieval, graph memory, action-level memory editing, full-fidelity storage plus indices, and learned write/read policies.

## Orchestration Mechanisms

Priority sources:

- [Conductor](https://openreview.net/forum?id=U23A2BUKYt) trains a coordinator with RL to select communication topologies and prompt worker LLMs.
- [MAS-Orchestra](https://icml.cc/virtual/2026/poster/66445) formulates orchestration as function-calling RL and introduces MASBENCH axes.
- [ParaManager](https://arxiv.org/pdf/2604.17009) treats agents and tools through a unified agent-as-tool action space with state feedback.
- [MALT](https://openreview.net/attachment?id=jXP9bgFack&name=pdf) and related orchestration-trace learning papers add evidence that traces can train orchestration policies.
- [ToolTree](https://openreview.net/forum?id=Ef5O9gNNLE) plans tool trajectories with MCTS-style dual feedback.
- [CAR](https://aclanthology.org/2026.findings-acl.869.pdf) combines dynamic tool synthesis with global trajectory rectification.
- [PerspectiveGap](https://arxiv.org/html/2606.08878) moves evaluation earlier, testing whether a main agent can allocate role-specific context into subagent prompts before workers act.

Source-first observation: subagent orchestration now has at least three evidence families: framework engineering patterns, benchmarked prompting/delegation behavior, and learned orchestration policies.

## Carry-Forward Constraints

- Any future schema-facing trace model must avoid requiring hidden chain-of-thought while still representing observable actions, state updates, tool calls, summaries, and safety decisions.
- Any future protocol model must account for attack surfaces in tool metadata, remote agent messages, memory retrieval, and cross-agent routing.
- Any future orchestration model must distinguish fixed workflows, dynamic routing, learned coordinators, agents-as-tools, handoffs, and parallel delegation only after source review.
