# Agent Benchmarks And Evaluation Expansion

Date: 2026-06-30
Status: source-first note

## Purpose

This note records the benchmark surface needed before Phase 0C. It avoids converting benchmark axes into ontology categories.

## Benchmark Families

| family | source anchors | evaluation pressure |
|---|---|---|
| Software engineering agents | [SWE-bench](https://www.swebench.com/), [SWE-agent](https://github.com/SWE-agent/SWE-agent), [mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent) | Patch generation, issue resolution, repo state, tool use, verified subsets, multilingual/multimodal variants. |
| Terminal agents | [Terminal-Bench](https://www.tbench.ai/), [terminal-bench repo](https://github.com/laude-institute/terminal-bench) | Shell tasks, environment setup, command execution, verifiable outputs. |
| GUI and computer-use agents | [OSWorld](https://os-world.github.io/), [OmniParser](https://github.com/microsoft/OmniParser), [UI-TARS](https://github.com/bytedance/UI-TARS), [Windows Agent Arena](https://microsoft.github.io/WindowsAgentArena/) | Multimodal grounding, executable environments, cross-app workflows, desktop state. |
| Web agents | [WebArena](https://webarena.dev/), [VisualWebArena](https://jykoh.com/vwa), [WorkArena](https://github.com/ServiceNow/WorkArena), [Mind2Web](https://arxiv.org/abs/2306.06070), [Online-Mind2Web](https://arxiv.org/abs/2504.01382) | Browser interaction, site generalization, DOM/vision grounding, task completion. |
| Tool-agent-user interaction | [tau-bench](https://github.com/sierra-research/tau-bench), [tau2/tau3-bench](https://github.com/sierra-research/tau2-bench) | User simulation, domain policies, tool correctness, knowledge retrieval, voice modality. |
| App/API worlds | [AppWorld](https://github.com/stonybrooknlp/appworld), [API-Bank](https://github.com/AlibabaResearch/DAMO-ConvAI/tree/main/api-bank), [ToolBench](https://github.com/OpenBMB/ToolBench), [RestBench](https://github.com/microsoft/RestBench) | API planning, tool schemas, argument extraction, app state, execution verification. |
| General agent and long-horizon tasks | [AgentBench](https://github.com/THUDM/AgentBench), [AgencyBench](https://aclanthology.org/2026.acl-long.337.pdf), [GAIA](https://huggingface.co/spaces/gaia-benchmark/leaderboard), [BrowseComp](https://openai.com/index/browsecomp/) | Long horizon, user feedback, tool budgets, multimodal/general reasoning. |
| Planning and orchestration | [DeepPlanning](https://aclanthology.org/2026.acl-long.335/), [OrchestrationBench](https://openreview.net/pdf?id=Oljnxmf4pc), [Plan-RewardBench](https://aclanthology.org/2026.acl-long.1062/) | Global constraints, active information gathering, plan quality, tool execution separation. |
| Safety and security | [Agent Security Bench](https://openreview.net/forum?id=V4y0CpX4hK), [AgentDojo](https://github.com/ethz-spylab/agentdojo), [ToolEmu](https://github.com/ryoungj/ToolEmu), [MCP Security Bench](https://arxiv.org/pdf/2510.15994) | Prompt injection, tool risk, memory poisoning, MCP-specific attacks, utility/security tradeoff. |

## Important Source Observations

- SWE-bench reports multiple benchmark slices and a `% Resolved` metric. The current site includes verified, multilingual, lite, full, and multimodal views.
- tau-bench's original repo warns that tasks are outdated and points users to tau2/tau3-bench for latest fixed tasks and new domains.
- tau2/tau3-bench adds banking knowledge, voice full-duplex evaluation, task fixes, release notes, and leaderboard updates.
- OSWorld provides executable desktop environments and an OSWorld-Verified upgrade with updated results, making it important for real computer-use evaluation.
- DeepPlanning argues that many benchmarks emphasize local step reasoning and underrepresent global constrained optimization.
- OrchestrationBench disentangles workflow planning from constraint-aware tool execution, which is directly relevant to subagent orchestration research.
- Agent Security Bench and MCP Security Bench show that security needs benchmarked attack/defense scenarios, not only informal policy text.

## Evaluation Axes To Preserve For Later

The benchmark corpus suggests several axes that Phase 0C may need to compare, but not yet formalize:

- Task horizon and number of tool calls.
- Executable environment realism.
- User simulation and feedback loops.
- Tool/API schema fidelity.
- Plan correctness versus execution correctness.
- Context length and memory pressure.
- Cost, latency, and token/resource budgets.
- Safety under prompt injection, memory poisoning, tool stream injection, and multi-agent propagation.
- Reproducibility of setup, dataset versions, and scoring.

## Follow-Up

Before schema synthesis, create a normalized benchmark ledger that records task type, environment, scoring metric, artifact output, human/user simulation use, tool count, context requirements, and known caveats.
