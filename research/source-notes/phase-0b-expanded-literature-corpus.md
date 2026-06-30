# Phase 0B Expanded Literature Corpus

Date: 2026-06-30
Status: source-first expansion corpus
Scope: papers, surveys, benchmark papers, and standards-track technical papers relevant to agent ontology, mechanisms, protocols, validation, runtime engineering, and evaluation.

## Reading Status Legend

| status | meaning |
|---|---|
| fetched | Full or substantial content was fetched/read in this or a previous Phase 0B pass. |
| search-verified | Search result or official listing was verified; full extraction still pending. |
| known-primary | Stable primary URL recorded; needs fresh full extraction before Phase 0C use. |
| needs-venue-check | Candidate appears relevant but venue/date details must be verified before authority claims. |

## Literature Candidates

| id | area | source | year | venue_or_type | priority | status | why it matters |
|---|---|---|---:|---|---:|---|---|
| lit-mech-cot | reasoning | [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://proceedings.neurips.cc/paper_files/paper/2022/file/9d5609613524ecf4f15af0f7b31abca4-Paper-Conference.pdf) | 2022 | NeurIPS | A | fetched | Starting point for visible intermediate reasoning traces. |
| lit-mech-self-consistency | reasoning | [Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/pdf/2203.11171) | 2022 | paper | A | fetched | Multi-path sampling and answer aggregation. |
| lit-mech-zero-shot-cot | reasoning | [Large Language Models are Zero-Shot Reasoners](https://arxiv.org/abs/2205.11916) | 2022 | paper | B | known-primary | Prompt-only reasoning trigger without demonstrations. |
| lit-mech-least-to-most | reasoning | [Least-to-Most Prompting Enables Complex Reasoning](https://webdocs.cs.ualberta.ca/~dale/papers/iclr23a.pdf) | 2023 | ICLR | A | search-verified | Decomposition followed by sequential subproblem solving. |
| lit-mech-pal | reasoning | [PAL: Program-Aided Language Models](https://arxiv.org/abs/2211.10435) | 2023 | ICML | B | known-primary | Code-as-reasoning separation from natural-language CoT. |
| lit-mech-pot | reasoning | [Program of Thoughts Prompting](https://arxiv.org/abs/2211.12588) | 2023 | paper | B | known-primary | Programmatic thought representation. |
| lit-mech-plan-solve | reasoning | [Plan-and-Solve Prompting](https://aclanthology.org/2023.acl-long.147.pdf) | 2023 | ACL | B | search-verified | Explicit planning before solving. |
| lit-mech-step-back | reasoning | [Take a Step Back: Evoking Reasoning via Abstraction](https://arxiv.org/abs/2310.06117) | 2024 | paper | B | known-primary | Abstraction-first reasoning pattern. |
| lit-mech-react | agent-loop | [ReAct: Synergizing Reasoning and Acting](https://openreview.net/attachment?id=tvI4u1ylcqs&name=pdf) | 2023 | ICLR | A | fetched | Interleaves reasoning, action, and observation. |
| lit-mech-reflexion | agent-loop | [Reflexion: Language Agents with Verbal Reinforcement Learning](https://ar5iv.labs.arxiv.org/html/2303.11366) | 2023 | paper | A | fetched | Feedback-to-reflection memory without weight updates. |
| lit-mech-self-refine | agent-loop | [Self-Refine: Iterative Refinement with Self-Feedback](https://arxiv.org/pdf/2303.17651) | 2023 | paper | A | fetched | Generate, critique, refine loop. |
| lit-mech-tot | reasoning-search | [Tree of Thoughts](https://proceedings.neurips.cc/paper/2023/file/271db9922b8d1f4dd7aaef84ed5ac703-Paper-Conference.pdf) | 2023 | NeurIPS | A | fetched | Tree search over thought states. |
| lit-mech-got | reasoning-search | [Graph of Thoughts](https://export.arxiv.org/pdf/2308.09687v2) | 2023 | paper | A | fetched | Arbitrary thought graph and thought transformations. |
| lit-mech-demystifying-topologies | reasoning-survey | [Demystifying Chains, Trees, and Graphs of Thoughts](https://arxiv.org/html/2401.14295v4) | 2024 | survey | A | fetched | Reasoning topology taxonomy. |
| lit-mech-prompt-report | reasoning-survey | [The Prompt Report](https://arxiv.org/html/2406.06608v6) | 2024 | survey | B | fetched | Broad prompting taxonomy and vocabulary. |
| lit-mech-rap | reasoning-planning | [Reasoning via Planning](https://arxiv.org/abs/2305.14992) | 2023 | paper | A | search-verified | World-model planning for reasoning. |
| lit-mech-lats | reasoning-planning | [Language Agent Tree Search](https://proceedings.mlr.press/v235/zhou24r.html) | 2024 | ICML | A | fetched | MCTS plus reasoning, acting, planning, reflections. |
| lit-mech-rafa | reasoning-planning | [Reason for Future, Act for Now](https://proceedings.mlr.press/v235/liu24ab.html) | 2024 | ICML | A | fetched | Long-horizon planning with memory buffer and replanning. |
| lit-mech-exact | reasoning-planning | [ExACT: Reflective-MCTS and Exploratory Learning](https://arxiv.org/html/2410.02052) | 2024 | paper | B | search-verified | Reflective MCTS and exploration learning. |
| lit-mech-advocate | reflection | [ADVOCATE: Anticipatory Reflection for LLM Agents](https://aclanthology.org/2024.findings-emnlp.53.pdf) | 2024 | Findings EMNLP | B | search-verified | Anticipatory reflection and plan revision. |
| lit-mech-reflact | reflection | [ReflAct: World-Grounded Decision Making via Goal-State Reflection](https://aclanthology.org/2025.emnlp-main.1697/) | 2025 | EMNLP | A | fetched | Goal-state reflection as ReAct backbone alternative. |
| lit-mech-recap | planning | [RECAP: Recursive Context-Aware Reasoning and Planning](https://proceedings.neurips.cc/paper_files/paper/2025/file/88af3540325dd0b70617a9ab605f294d-Paper-Conference.pdf) | 2025 | NeurIPS | A | search-verified | Shared-context recursive planning and long-horizon continuity. |
| lit-mech-compass | context | [COMPASS: Enhancing Agent Long-Horizon Reasoning with Evolving Context](https://aclanthology.org/2026.acl-long.152/) | 2026 | ACL | A | search-verified | Separates tactical execution, strategic oversight, and context management. |
| lit-mech-deepplanning | planning-benchmark | [DeepPlanning](https://aclanthology.org/2026.acl-long.335/) | 2026 | ACL | A | search-verified | Long-horizon constrained planning with verifiable constraints. |
| lit-mech-plan-rewardbench | reward-modeling | [Plan-RewardBench](https://aclanthology.org/2026.acl-long.1062/) | 2026 | ACL | A | search-verified | Trajectory-level reward modeling for tool-integrated agents. |
| lit-mech-lumina | evaluation | [LUMINA](https://aclanthology.org/2026.findings-acl.190/) | 2026 | Findings ACL | B | search-verified | Oracle counterfactual analysis of planning/state/context capabilities. |
| lit-mech-elpo | agentic-rl | [Error-Localized Policy Optimization for Tool-Integrated LLM Reasoning](https://aclanthology.org/2026.acl-long.504/) | 2026 | ACL | A | search-verified | Step-local credit assignment for long-horizon tool trajectories. |
| lit-mech-topt | tool-planning | [Cost-Aware Optimal Tool-Chain Planning](https://aclanthology.org/2026.findings-acl.860.pdf) | 2026 | Findings ACL | A | search-verified | Multi-solution tool graph planning and cost-aware optimality. |
| lit-mech-carl | planning-rl | [CARL: Constraint-Aware Reinforcement Learning for Planning with LLMs](https://aclanthology.org/2026.findings-acl.1069.pdf) | 2026 | Findings ACL | B | search-verified | Constraint-aware planning without multi-agent scaffolding. |
| lit-mech-octotools | tool-planning | [OctoTools](https://aclanthology.org/2026.acl-long.1.pdf) | 2026 | ACL | A | search-verified | Tool cards, planner-executor workflow, multi-agent tool use. |
| lit-mech-deepagent | tool-use | [DeepAgent](https://arxiv.org/html/2510.21618v3) | 2026 | WWW | A | search-verified | Tool discovery, memory folding, ToolPO for open toolsets. |
| lit-mech-autotool | tool-use-rl | [AutoTool](https://openreview.net/pdf?id=52c4trAbmd) | 2026 | ICLR | A | search-verified | Dynamic tool selection and integration for agentic reasoning. |
| lit-mech-long-short-tool-rl | tool-use-rl | [Entropy-Based Long-Short Reasoning Fusion for Tool Use](https://openreview.net/pdf?id=zFkopTvclB) | 2026 | ICLR | B | search-verified | Auto-scaling thinking length for efficient tool use. |
| lit-mech-mot-logical | reasoning-modality | [Learning to Reason via Mixture-of-Thought](https://arxiv.org/pdf/2505.15817) | 2025 | paper | A | fetched | Natural language, code, and truth-table reasoning modalities. |
| lit-mech-mor | reasoning-modality | [Mixture of Reasonings](https://arxiv.org/html/2507.00606) | 2025 | paper | B | search-verified | Adaptive mixture of reasoning strategies. |
| lit-mech-malt | multi-agent-training | [MALT: Improving Reasoning with Multi-Agent LLM Training](https://openreview.net/attachment?id=jXP9bgFack&name=pdf) | 2025 | COLM | A | search-verified | Generator/verifier/refiner training with multi-agent search tree. |
| lit-mech-rema | multi-agent-rl | [ReMA: Learning to Meta-think with Multi-agent RL](https://proceedings.neurips.cc/paper_files/paper/2025/file/b83514e453ff03741a5fb3e5e49f709b-Paper-Conference.pdf) | 2025 | NeurIPS | A | search-verified | Meta-thinking agent and reasoning agent trained with MARL. |
| lit-mech-sirius | multi-agent-learning | [SiriuS: Self-improving Multi-agent Systems via Bootstrapped Reasoning](https://proceedings.neurips.cc/paper_files/paper/2025/file/b45279ac82cb017a5f55ea7d3653193a-Paper-Conference.pdf) | 2025 | NeurIPS | A | search-verified | Experience library and trajectory augmentation for MAS optimization. |
| lit-mech-owl | multi-agent-learning | [OWL: Optimized Workforce Learning](https://proceedings.neurips.cc/paper_files/paper/2025/file/48dcc43a534c5b582f9d0fdb778e9b84-Paper-Conference.pdf) | 2025 | NeurIPS | A | search-verified | Domain-agnostic planner, coordinator, and worker nodes. |
| lit-mech-g-memory | multi-agent-memory | [G-Memory](https://proceedings.neurips.cc/paper_files/paper/2025/file/136a45cd9b841bf785625709a19c6508-Paper-Conference.pdf) | 2025 | NeurIPS | A | search-verified | Hierarchical memory for multi-agent systems. |
| lit-mech-pnlc | planning-rl | [Planning without Search](https://proceedings.neurips.cc/paper_files/paper/2025/file/0e87f947391341256517bdc5d206e539-Paper-Conference.pdf) | 2025 | NeurIPS | B | search-verified | Goal-conditioned value functions for interactive planning. |
| lit-mech-rl-orchestration-traces | multi-agent-rl | [RL for LLM-based MAS through Orchestration Traces](https://arxiv.org/html/2605.02801) | 2026 | paper | A | search-verified | Orchestration traces as credit/reward unit. |
| lit-mech-tool-use-evolution | tool-use-survey | [The Evolution of Tool Use in LLM Agents](https://arxiv.org/pdf/2603.22862) | 2026 | survey | A | search-verified | Single-tool calls to multi-tool orchestration. |
| lit-survey-agentic-llms | agent-survey | [Agentic Large Language Models, a survey](https://arxiv.org/abs/2503.23037v2) | 2025 | survey | A | search-verified | Organizes agentic LLMs by reason, act, interact. |
| lit-survey-language-to-action | agent-survey | [From Language to Action](https://link.springer.com/article/10.1007/s10462-025-11471-9) | 2026 | survey | A | search-verified | Review of 2023-2025 autonomous agents and tool users. |
| lit-survey-plangenllms | planning-survey | [PlanGenLLMs](https://aclanthology.org/anthology-files/anthology-files/pdf/acl/2025.acl-long.958.pdf) | 2025 | ACL | A | search-verified | Planning capability survey with evaluation criteria. |
| lit-survey-agent-orchestration | orchestration-survey | [LLM-Based Multi-Agent Orchestration](https://www.mdpi.com/1999-5903/18/6/326) | 2026 | survey | A | fetched | Orchestration topology, frameworks, protocol stack. |
| lit-mas-camel | multi-agent | [CAMEL](https://proceedings.neurips.cc/paper_files/paper/2023/file/a3621ee907def47c1b952ade25c67698-Paper-Conference.pdf) | 2023 | NeurIPS | A | fetched | Role-playing communicative agents. |
| lit-mas-agentverse | multi-agent | [AgentVerse](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) | 2024 | ICLR | A | fetched | Expert recruitment, decision-making, action, evaluation stages. |
| lit-mas-autogen | multi-agent | [AutoGen](http://ryenwhite.com/papers/WuiCOLM2024.pdf) | 2024 | COLM | A | fetched | Conversable agents and conversation programming. |
| lit-mas-metagpt | multi-agent | [MetaGPT](https://arxiv.org/html/2308.00352v7) | 2024 | ICLR | A | fetched | SOP-based multi-agent collaboration. |
| lit-mas-chatdev | multi-agent | [ChatDev](https://aclanthology.org/anthology-files/pdf/acl/2024.acl-long.810.pdf) | 2024 | ACL | A | fetched | Chat-chain and communicative dehallucination. |
| lit-mas-debate-du | multi-agent-debate | [Improving Factuality and Reasoning through Multiagent Debate](https://proceedings.mlr.press/v235/du24e.html) | 2024 | ICML | A | fetched | Multi-round debate for factuality and reasoning. |
| lit-mas-mad | multi-agent-debate | [Encouraging Divergent Thinking through Multi-Agent Debate](https://arxiv.org/pdf/2305.19118) | 2024 | EMNLP | B | search-verified | Judge-managed debate and degeneration-of-thought issue. |
| lit-mas-generative-agents | simulation | [Generative Agents](https://doi.org/10.1145/3586183.3606763) | 2023 | UIST | A | known-primary | Memory, reflection, planning for social simulation agents. |
| lit-mas-agentorchestra | orchestration | [AgentOrchestra](https://arxiv.org/html/2506.12508v1) | 2025 | paper | B | fetched | Hierarchical planning and specialized subagents. |
| lit-mas-aorchestra | orchestration | [AOrchestra](https://arxiv.org/pdf/2602.03786) | 2026 | paper | A | fetched | Dynamic subagent creation. |
| lit-mas-uno-orchestra | orchestration | [Uno-Orchestra](https://arxiv.org/html/2605.05007v1) | 2026 | paper | A | fetched | Selective delegation under cost budget. |
| lit-mas-paramanager | orchestration | [Small Model as Master Orchestrator](https://arxiv.org/pdf/2604.17009) | 2026 | paper | A | search-verified | Agent-as-tool action space and parallel decomposition. |
| lit-mas-aios | runtime | [AIOS: LLM Agent Operating System](https://openreview.net/attachment?id=L4HHkCDz2x&name=pdf) | 2025 | COLM | A | search-verified | Kernel-style scheduling, memory, storage, tool, access control. |
| lit-mas-factored-agents | architecture | [Factored Agents](https://www.arxiv.org/pdf/2503.22931v1) | 2025 | COLM | B | search-verified | Planner/memorizer split for robust tool use. |
| lit-mas-hima | multi-agent | [Society of Mind Meets Real-Time Strategy](https://openreview.net/forum?id=VYdbeSoXWD) | 2025 | COLM | B | search-verified | Hierarchical imitation multi-agent control. |
| lit-security-mas-code | security | [Multi-Agent Systems Execute Arbitrary Malicious Code](https://openreview.net/forum?id=DAozI4etUp) | 2025 | COLM | A | search-verified | Control-flow hijacking risk in deployed MAS. |
| lit-tool-toolformer | tool-use | [Toolformer](https://arxiv.org/abs/2302.04761) | 2023 | NeurIPS | A | known-primary | Self-supervised tool-use decisions. |
| lit-tool-mrkl | tool-use | [MRKL Systems](https://arxiv.org/abs/2205.00445) | 2022 | paper | B | known-primary | Modular neural-symbolic tool routing. |
| lit-tool-gorilla | tool-use | [Gorilla: Large Language Model Connected with Massive APIs](https://arxiv.org/abs/2305.15334) | 2023 | paper | B | known-primary | API selection and calling at scale. |
| lit-tool-toollm | tool-use | [ToolLLM / ToolBench](https://arxiv.org/abs/2307.16789) | 2023 | paper | A | known-primary | Large-scale tool-use instruction data and benchmark. |
| lit-tool-api-bank | tool-use | [API-Bank](https://arxiv.org/abs/2304.08244) | 2023 | EMNLP | B | known-primary | Tool-augmented LLM benchmark. |
| lit-tool-stabletoolbench | tool-use | [StableToolBench](https://arxiv.org/abs/2403.07714) | 2024 | paper | B | known-primary | Stable tool-use benchmark and evaluation. |
| lit-tool-toolsandbox | tool-use | [ToolSandbox](https://arxiv.org/abs/2410.11042) | 2024 | paper | B | known-primary | Stateful tool-use evaluation. |
| lit-tool-mcp-flow | protocol-tool-use | [MCP-Flow](https://2026.aclweb.org/program/accepted_papers/) | 2026 | ACL listing | B | search-verified | Agents mastering real-world MCP tools. |
| lit-tool-search-o1 | search-tool-use | [Search-o1](https://2025.emnlp.org/program/main_papers/) | 2025 | EMNLP listing | B | search-verified | Agentic search-enhanced reasoning models. |
| lit-bench-swebench | benchmark | [SWE-bench](https://github.com/SWE-bench/SWE-bench) | 2024 | ICLR Oral | A | search-verified | Real GitHub issue resolution benchmark. |
| lit-bench-swebench-mm | benchmark | [SWE-bench Multimodal](https://github.com/SWE-bench/SWE-bench) | 2025 | ICLR | A | search-verified | Visual software-domain generalization. |
| lit-bench-terminal | benchmark | [Terminal-Bench](https://github.com/harbor-framework/terminal-bench) | 2026 | paper/repo | A | search-verified | Hard terminal tasks in container environments. |
| lit-bench-osworld | benchmark | [OSWorld](https://github.com/xlang-ai/OSWorld) | 2024 | NeurIPS | A | search-verified | Real computer environment for multimodal agents. |
| lit-bench-webarena | benchmark | [WebArena](https://webarena.dev) | 2024 | ICLR | A | known-primary | Self-hostable realistic web environment. |
| lit-bench-visualwebarena | benchmark | [VisualWebArena](https://jykoh.com/vwa) | 2024 | paper | A | known-primary | Visual web-agent benchmark. |
| lit-bench-webvoyager | benchmark | [WebVoyager](https://arxiv.org/abs/2401.13919) | 2024 | paper | A | search-verified | End-to-end web agent with multimodal models. |
| lit-bench-workarena | benchmark | [WorkArena](https://arxiv.org/abs/2403.07718) | 2024 | paper | B | known-primary | Enterprise web workflow benchmark. |
| lit-bench-appworld | benchmark | [AppWorld](https://d6108366.hf-mirror.com/papers/2407.18901) | 2024 | paper | A | search-verified | Execution environment with 457 APIs and state-based tests. |
| lit-bench-tau | benchmark | [tau-bench](https://arxiv.org/abs/2406.12045) | 2024 | paper | A | search-verified | Tool-agent-user interaction with policy constraints. |
| lit-bench-tau2 | benchmark | [tau2-bench](https://arxiv.org/abs/2506.07982) | 2025 | paper | A | search-verified | Dual-control conversational agent evaluation. |
| lit-bench-agentbench | benchmark | [AgentBench](https://github.com/THUDM/AgentBench) | 2024 | ICLR | A | search-verified | Multi-environment benchmark for LLM-as-agent. |
| lit-bench-gaia | benchmark | [GAIA](https://arxiv.org/abs/2311.12983) | 2023 | ICLR | A | known-primary | General AI assistant benchmark with tools/reasoning. |
| lit-bench-agencybench | benchmark | [AgencyBench](https://github.com/GAIR-NLP/AgencyBench) | 2026 | ACL | A | search-verified | Long-horizon 1M-token real-world agent tasks. |
| lit-bench-agentcompany | benchmark | [TheAgentCompany](https://arxiv.org/abs/2412.14161) | 2025 | paper | B | search-verified | Simulated software company benchmark. |
| lit-bench-realm | benchmark | [REALM-Bench](https://arxiv.org/pdf/2502.18836v1) | 2025 | paper | C | search-verified | Real-world planning benchmark for LLMs and MAS. |
| lit-bench-executable-suite | benchmark | [Executable Benchmarking Suite for Tool-Using Agents](https://arxiv.org/html/2605.11030v1) | 2026 | paper | B | search-verified | Evidence-admission contract for executable agent benchmarks. |
| lit-bench-deepresearch | benchmark | [Ready For General Agents? Let's Test It](https://iclr-blogposts.github.io/2026/blog/2026/general-agent-evaluation/) | 2026 | ICLR blogpost | C | search-verified | Cross-benchmark interface/evaluation contract critique. |
| lit-gui-uitars | gui-agent | [UI-TARS](https://arxiv.org/abs/2501.12326) | 2025 | paper | A | search-verified | Native GUI agent and system-2 reasoning for GUI tasks. |
| lit-gui-uitars2 | gui-agent | [UI-TARS-2 Technical Report](https://arxiv.org/abs/2509.02544) | 2025 | technical report | A | search-verified | All-in-one GUI/game/code/tool-use agent model. |
| lit-gui-seeclick | gui-agent | [SeeClick](https://arxiv.org/abs/2401.10935) | 2024 | ACL | A | search-verified | GUI grounding for visual agents. |
| lit-gui-os-atlas | gui-agent | [OS-ATLAS](https://arxiv.org/abs/2410.23218) | 2025 | ICLR | A | search-verified | Foundation action model for GUI agents. |
| lit-gui-gui-actor | gui-agent | [GUI-Actor](https://arxiv.org/abs/2506.03143) | 2025 | paper | B | search-verified | Coordinate-free visual grounding. |
| lit-gui-androidworld | gui-agent | [AndroidWorld](https://arxiv.org/abs/2405.14573) | 2024 | paper | B | search-verified | Mobile agent benchmark. |
| lit-gui-mind2web | web-agent | [Mind2Web](https://arxiv.org/abs/2306.06070) | 2023 | NeurIPS | A | known-primary | Web task generalization from websites. |
| lit-gui-online-mind2web | web-agent | [Online-Mind2Web](https://arxiv.org/abs/2504.01382) | 2025 | paper | B | search-verified | Online web navigation benchmark. |
| lit-gui-weboperator | web-agent | [WebOperator](https://github.com/kagnlp/WebOperator) | 2026 | repo/paper | B | search-verified | Tree search and safe backtracking in web environments. |
| lit-security-ipiguard | security | [IPIGuard](https://2025.emnlp.org/program/main_papers/) | 2025 | EMNLP listing | A | search-verified | Tool dependency graph defense for indirect prompt injection. |
| lit-security-evo-attacker | security | [Evo-Attacker](https://2026.aclweb.org/program/accepted_papers/) | 2026 | ACL listing | A | search-verified | Long-horizon tool attacks on LLM-MAS. |
| lit-security-wasp | security | [WASP](https://cua.ai/blog/neurips-2025-cua-papers) | 2025 | NeurIPS list | B | search-verified | Prompt injection attacks on computer-use agents. |
| lit-ont-llm-oe-slr | ontology | [Large Language Models for Ontology Engineering: SLR](https://www.semantic-web-journal.net/content/large-language-models-ontology-engineering-systematic-literature-review) | 2025 | Semantic Web Journal | A | search-verified | Systematic review of LLM-assisted ontology engineering. |
| lit-ont-kg-survey | ontology | [LLM-empowered knowledge graph construction](https://arxiv.org/html/2510.20345v1) | 2025 | survey | A | search-verified | LLMs across ontology engineering, extraction, fusion. |
| lit-ont-neon-gpt | ontology | [NeOn-GPT extended pipeline](https://www.semantic-web-journal.net/system/files/swj4014.pdf) | 2026 | Semantic Web Journal | A | search-verified | Methodology-grounded ontology construction and verification. |
| lit-ont-owl-shacl-lessons | ontology-validation | [Lessons Learned from Combined OWL and SHACL Development](https://dl.acm.org/doi/full/10.1145/3731443.3771340) | 2025 | K-CAP | A | search-verified | Joint OWL/SHACL engineering lessons. |
| lit-ont-shacl-shex-survey | ontology-validation | [Community Survey on SHACL and ShEx](https://arxiv.org/html/2606.03502) | 2026 | paper | A | search-verified | RDF validation practice gaps and tooling needs. |
| lit-ont-wikontic | ontology | [Wikontic](https://aclanthology.org/2026.eacl-long.388.pdf) | 2026 | EACL | A | search-verified | Ontology-aware KG construction with Wikidata constraints. |
| lit-ont-ontokg | ontology | [OntoKG](https://www.arxiv.org/pdf/2604.02618) | 2026 | paper | B | search-verified | Ontology-oriented property graph schema design. |
| lit-ont-ontogenia | ontology | [Ontology Generation using Large Language Models](https://arxiv.org/abs/2503.05388) | 2025 | paper | B | search-verified | Metacognitive prompting and ontology design patterns. |
| lit-ont-cqbycq | ontology | [CQbyCQ](https://arxiv.org/abs/2409.04543) | 2024 | paper | B | search-verified | Competency questions to OWL-compliant schemas. |
| lit-ont-edc | ontology | [Extract-Define-Canonicalize](https://arxiv.org/abs/2406.09164) | 2024 | paper | B | search-verified | Schema normalization from LLM extraction. |
| lit-val-jsonschema-foundations | validation | [Foundations of JSON Schema](https://doi.org/10.1145/2872427.2883029) | 2016 | WWW | B | known-primary | Formal semantics baseline. |
| lit-val-jsonschema-ietf | validation | [IETF JSON Schema draft](https://datatracker.ietf.org/doc/html/draft-ietf-jsonschema-json-schema-01) | 2026 | IETF draft | A | search-verified | Current standards-track direction. |
| lit-val-jsonschema-spec | validation | [JSON Schema Validation Specification](https://github.com/json-schema-org/json-schema-spec/blob/main/specs/jsonschema-validation.md) | 2026 | specification | A | search-verified | Structural validation vocabulary and dialect evolution. |
| lit-val-shacl | validation | [SHACL Recommendation](https://www.w3.org/TR/shacl/) | 2017 | W3C standard | A | known-primary | Semantic graph validation baseline. |
| lit-val-shacl-af | validation | [SHACL Advanced Features](https://www.w3.org/TR/shacl-af/) | 2017 | W3C note | B | known-primary | Advanced RDF validation features. |
| lit-agent-orchestrationbench | orchestration-benchmark | [OrchestrationBench](https://openreview.net/pdf?id=Oljnxmf4pc) | 2026 | ICLR paper | A | search-verified | Workflow planning and constraint-aware tool execution benchmark. |
| lit-agent-conductor | orchestration-learning | [Learning to Orchestrate Agents in Natural Language with the Conductor](https://openreview.net/forum?id=U23A2BUKYt) | 2026 | ICLR poster | A | search-verified | RL-trained coordinator over heterogeneous worker LLMs. |
| lit-agent-tooltree | tool-planning | [ToolTree](https://openreview.net/forum?id=Ef5O9gNNLE) | 2026 | ICLR paper | A | search-verified | MCTS-style tool trajectory planning with pre/post execution feedback. |
| lit-agent-paramanager | orchestration-learning | [Small Model as Master Orchestrator](https://arxiv.org/pdf/2604.17009) | 2026 | arXiv | A | search-verified | Agent-as-tool abstraction and parallel subtask decomposition. |
| lit-agent-mas-orchestra | orchestration-learning | [MAS-Orchestra](https://icml.cc/virtual/2026/poster/66445) | 2026 | ICML poster | A | search-verified | Holistic MAS orchestration with controlled benchmark axes. |
| lit-agent-perspectivegap | subagent-prompting | [PerspectiveGap](https://arxiv.org/html/2606.08878) | 2026 | arXiv | B | search-verified | Tests whether a main agent can allocate role-specific context before workers act. |
| lit-agent-car | dynamic-tools | [CAR: Dynamic Tool Synthesis and Global Trajectory Rectification](https://aclanthology.org/2026.findings-acl.869.pdf) | 2026 | ACL Findings | A | search-verified | Tool synthesis plus trajectory-level failure diagnosis and rectification. |
| lit-agent-conjunctive-prompt-attacks | security | [Conjunctive Prompt Attacks in Multi-Agent LLM Systems](https://aclanthology.org/2026.acl-long.1577.pdf) | 2026 | ACL | A | search-verified | Routing-aware multi-agent attack surface across star, chain, and DAG topologies. |
| lit-agent-asb | security | [Agent Security Bench](https://openreview.net/forum?id=V4y0CpX4hK) | 2025 | ICLR | A | search-verified | Benchmark of attacks and defenses across agent prompts, tools, memory, and scenarios. |
| lit-agent-vigil-siren | security | [VIGIL: Defending LLM Agents Against Tool Stream Injection](https://aclanthology.org/2026.acl-long.443.pdf) | 2026 | ACL | A | search-verified | Verify-before-commit defense and SIREN tool-stream injection benchmark. |
| lit-agent-aciaarena | security | [ACIArena](https://arxiv.org/pdf/2604.07775) | 2026 | arXiv | B | search-verified | Agent cascading injection benchmark for MAS robustness. |
| lit-agent-maspi | security | [MASPI](https://openreview.net/pdf?id=1khmNRuIf9) | 2026 | OpenReview | B | search-verified | Unified environment for MAS prompt injection robustness. |
| lit-agent-toolsafe | security | [ToolSafe](https://aclanthology.org/2026.findings-acl.1850.pdf) | 2026 | ACL Findings | A | search-verified | Step-level tool invocation guardrail and feedback framework. |
| lit-agent-msb | protocol-security | [MCP Security Bench](https://arxiv.org/pdf/2510.15994) | 2025 | arXiv | A | search-verified | MCP-specific attacks across planning, invocation, and response handling. |
| lit-agent-trojantools | security | [TrojanTools](https://openreview.net/pdf/d28c9b8559a20b19a1ecacc0bb31c0a41f89bcfe.pdf) | 2026 | OpenReview | B | search-verified | Adaptive indirect prompt injection via malicious tool calling. |
| lit-agent-under-siege | security | [Agents Under Siege](https://aclanthology.org/anthology-files/anthology-files/pdf/acl/2025.acl-long.476.pdf) | 2025 | ACL | A | search-verified | Optimized prompt propagation attacks in practical MAS constraints. |
| lit-agent-ama-bench | memory | [AMA-Bench](https://arxiv.org/abs/2602.22769v2) | 2026 | arXiv | B | search-verified | Long-horizon memory evaluation for agent-environment trajectories. |
| lit-agent-agemem | memory | [Agentic Memory](https://aclanthology.org/2026.acl-long.981/) | 2026 | ACL | A | search-verified | LTM/STM memory operations as tool-like actions trained with RL. |
| lit-agent-evomembench | memory | [EvoMemBench](https://arxiv.org/html/2605.18421) | 2026 | arXiv | B | search-verified | Self-evolving agent memory benchmark across memory scope/content axes. |
| lit-agent-memexrl | memory | [Memex(RL)](https://arxiv.org/pdf/2603.04257) | 2026 | arXiv | B | search-verified | Indexed experience memory with learned compression and dereferencing. |
| lit-agent-memory-as-action | memory | [Memory as Action](https://arxiv.org/pdf/2510.12635) | 2025 | arXiv | B | search-verified | Treats working-memory editing as intrinsic agent action. |
| lit-agent-mempo | memory | [MemPO](https://aclanthology.org/2026.findings-acl.1166.pdf) | 2026 | ACL Findings | A | search-verified | Self-memory policy optimization for long-horizon agents. |
| lit-agent-evo-memory | memory | [Evo-Memory](https://arxiv.org/html/2511.20857) | 2025 | arXiv | B | search-verified | Streaming benchmark for test-time learning with evolving memory. |
| lit-agent-magma | memory | [MAGMA](https://aclanthology.org/2026.acl-long.1709.pdf) | 2026 | ACL | A | search-verified | Multi-graph agentic memory over semantic, temporal, causal, and entity views. |
| lit-agent-deepplanning | planning-benchmark | [DEEPPLANNING](https://aclanthology.org/2026.acl-long.335.pdf) | 2026 | ACL | A | search-verified | Long-horizon planning with verifiable constraints and active information gathering. |
| lit-agent-etom | protocol-tool-use | [ETOM: Five-Level Benchmark for Tool Orchestration within the MCP Ecosystem](https://aclanthology.org/2026.findings-eacl.75.pdf) | 2026 | EACL Findings | A | search-verified | MCP-structured multi-hop tool orchestration benchmark with equal function sets. |
| lit-agent-guardagent | security | [GuardAgent](https://proceedings.mlr.press/v267/xiang25a.html) | 2025 | ICML | A | search-verified | Knowledge-enabled guardrail agent with executable safety policy checks. |
| lit-agent-safeagent | security | [SafeAgent](https://aclanthology.org/2026.acl-long.1501.pdf) | 2026 | ACL | A | search-verified | Automated risk simulator and threat model for multi-turn tool-augmented agents. |
| lit-agent-toolorchestra | orchestration-learning | [ToolOrchestra](https://openreview.net/pdf/a99d11745db82cbe0860c9c778e8d463f86f4578.pdf) | 2026 | ICLR | A | search-verified | Small orchestrator trained with outcome, efficiency, and preference rewards. |
| lit-agent-memoryagentbench | memory-benchmark | [MemoryAgentBench](https://github.com/HUST-AI-HYZ/MemoryAgentBench) | 2026 | ICLR/repo | A | search-verified | Incremental multi-turn memory benchmark with released evaluation code. |
| lit-state-stateflow | statecharts | [StateFlow](https://openreview.net/forum?id=3nTbuygoop) | 2024 | COLM | A | search-verified | Models LLM task solving as state machines with process grounding and actions. |
| lit-state-metaagent | statecharts-mas | [MetaAgent](https://proceedings.mlr.press/v267/zhang25bc.html) | 2025 | ICML | A | search-verified | Automatically constructs finite-state-machine-based multi-agent systems. |

## Coverage Notes

- This corpus contains more than 145 paper/standard candidates across mechanism, orchestration, benchmark, protocol-adjacent, ontology, and validation concerns.
- Current 2024-2026 sources dominate the corpus, but foundational papers are retained when they define still-used mechanism vocabulary.
- Before Phase 0C, `needs-venue-check` and `known-primary` rows must be upgraded through full fetch or official listing verification.
- This corpus is source material only. It intentionally avoids layer, relation, and canonical schema decisions.
