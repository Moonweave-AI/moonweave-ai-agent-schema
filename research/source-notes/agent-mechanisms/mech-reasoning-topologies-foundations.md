# mech-reasoning-topologies-foundations: Reasoning Topologies And Thought Structures

metadata:
  domain: agent-mechanisms
  source_type: multi-source deep-read note
  authority_level: mixed-primary-and-survey
  temporal_class: mixed-foundational-and-current
  published_or_updated: 2022-2026
  last_checked: 2026-06-30
  url: multiple; see covered sources
  deep_read_priority: A

## Covered Sources

| evidence_id | source | source_type | authority | temporal_class |
|---|---|---|---|---|
| cand-mech-cot-2022 | [Chain-of-Thought Prompting](https://proceedings.neurips.cc/paper_files/paper/2022/file/9d5609613524ecf4f15af0f7b31abca4-Paper-Conference.pdf) | paper | primary | foundational |
| cand-mech-self-consistency-2022 | [Self-Consistency Improves Chain of Thought](https://arxiv.org/pdf/2203.11171) | paper | primary | foundational |
| cand-mech-tot-2023 | [Tree of Thoughts](https://proceedings.neurips.cc/paper/2023/file/271db9922b8d1f4dd7aaef84ed5ac703-Paper-Conference.pdf) | paper | primary | current |
| cand-mech-got-2023 | [Graph of Thoughts](https://export.arxiv.org/pdf/2308.09687v2) | paper | primary | current |
| cand-mech-demystifying-topologies-2024 | [Demystifying Chains, Trees, and Graphs of Thoughts](https://arxiv.org/html/2401.14295v4) | survey | secondary | current |
| cand-mech-mot-logical-2025 | [Learning to Reason via Mixture-of-Thought](https://arxiv.org/pdf/2505.15817) | paper | primary | current |
| cand-mech-prompt-report-2024 | [The Prompt Report](https://arxiv.org/html/2406.06608v6) | survey | secondary | current |

## Why This Source Matters

Phase 0B needs a mechanism layer because protocol and framework sources do not explain the internal reasoning structures that modern agents use. These sources show that CoT, self-consistency, ToT, GoT, and MoT are not just names for prompts; they differ in topology, sampling, evaluation, aggregation, modality, cost, and observability.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| Thought | Coherent intermediate reasoning unit produced or consumed during problem solving. | CoT models intermediate natural-language steps; ToT and GoT explicitly treat thoughts as units explored, evaluated, or connected. | high | L3, L8 |
| ReasoningTrace | Ordered or structured record of reasoning artifacts, steps, or summaries. | CoT uses a series of intermediate steps; Prompt Report and topology survey treat prompt-execution traces as analyzable artifacts. | medium | L8 |
| ReasoningPath | One complete route through intermediate thoughts toward an answer. | Self-consistency samples multiple reasoning paths and marginalizes over them; ToT explores multiple paths. | high | L3, L8 |
| ReasoningTopology | Structural organization of reasoning paths and thought dependencies. | Demystifying C/T/G frames CoT, ToT, and GoT as topology families; GoT models thoughts as graph vertices with dependencies as edges. | high | L3, L8 |
| ChainTopology | Linear topology where intermediate reasoning is produced in sequence. | CoT and the topology survey use chain/path structures for single-path reasoning. | high | L3 |
| TreeTopology | Branching topology where thoughts form search states with expansion, evaluation, pruning, and backtracking. | ToT generalizes CoT by exploring coherent text units as tree nodes and supports BFS/DFS, evaluation, pruning, and backtracking. | high | L3, L8 |
| GraphTopology | Non-tree topology where thoughts can merge, aggregate, transform, and feed back into later thoughts. | GoT models arbitrary graphs where vertices are thoughts and edges are dependencies; it supports aggregation and feedback loops. | high | L3, L8 |
| ThoughtEvaluator | Mechanism that scores, ranks, filters, or prunes thoughts. | ToT uses self-evaluation to select promising thoughts; LATS uses value functions, but this note only records the topology-side evidence. | high | L3, L8 |
| SearchController | Procedure that chooses which thought/state to expand next. | ToT supports BFS and DFS; topology survey identifies algorithms executed over reasoning structures. | high | L3, L8 |
| BranchingPolicy | Rule or parameter controlling how many candidate thoughts are generated from a state. | ToT exposes breadth and candidate generation as modular choices. | medium | L3, L8 |
| BacktrackingPolicy | Rule for returning from failed or low-value branches to earlier states. | ToT explicitly supports backtracking when a state is evaluated as unpromising. | high | L3, L8 |
| AnswerAggregation | Mechanism for combining multiple paths or votes into a final answer. | Self-consistency selects the most consistent answer across sampled paths; GoT supports aggregation of thoughts. | high | L3, L8 |
| ReasoningModality | Representational format used for reasoning, such as natural language, code, or symbolic table. | MoT studies natural language, code, and truth-table modalities for logical reasoning. | high | L3 |
| NaturalLanguageReasoning | Reasoning modality represented primarily as natural-language explanations. | CoT and most prompt taxonomies use natural-language intermediate steps. | high | L3 |
| CodeReasoning | Reasoning modality represented as executable or program-like steps. | Program-of-Thoughts and MoT include code as a reasoning format. | medium | L3, L5 |
| SymbolicReasoning | Reasoning modality represented as formal symbolic structures or truth tables. | MoT introduces truth-table reasoning for logical cases and treats it as complementary to natural language and code. | high | L3 |
| ReasoningCost | Token, call, or compute expense induced by a reasoning mechanism. | ToT/GoT and topology surveys discuss cost tradeoffs; GoT reports task-dependent quality and cost changes relative to ToT. | medium | L8 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| contains_step | ReasoningTrace | Thought | CoT and Prompt Report treat reasoning as intermediate steps. | high | Trace may be recorded as summary, not full private chain. |
| contains_path | ReasoningTopology | ReasoningPath | Self-consistency and ToT require multiple paths. | high | |
| structures_path | ReasoningTopology | ReasoningPath | Topology survey explicitly organizes reasoning schemes by structure. | high | |
| branches_from | TreeTopology | Thought | ToT expands candidate thoughts from a state. | high | |
| merges_thoughts | GraphTopology | Thought | GoT supports aggregation of arbitrary thoughts via graph edges. | high | |
| evaluates | ThoughtEvaluator | Thought | ToT and GoT require thought scoring/filtering. | high | |
| selects | SearchController | Thought | ToT search algorithms choose which states remain or expand. | high | |
| aggregates | AnswerAggregation | ReasoningPath | Self-consistency marginalizes over sampled reasoning paths. | high | |
| uses_modality | Thought | ReasoningModality | MoT uses multiple reasoning modalities. | high | |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| thought_generated | Thought | model call or transformation | no | CoT, ToT, GoT | |
| thought_evaluated | Thought | evaluator prompt or scoring step | no | ToT, GoT | |
| path_sampled | ReasoningPath | self-consistency decoding | no | Self-consistency | |
| branch_pruned | TreeTopology | evaluator threshold or search budget | no | ToT | |
| thoughts_aggregated | GraphTopology | merge/aggregation operation | no | GoT | |
| answer_selected | AnswerAggregation | vote, marginalization, or score selection | yes | Self-consistency, ToT | |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| Topology type should be explicit when a reasoning artifact is represented. | ReasoningTopology | Demystifying C/T/G, ToT, GoT | enum/profile | Overfitting to current terminology. |
| Tree/graph reasoning needs node and edge identity if represented as data. | TreeTopology, GraphTopology | ToT, GoT | structural schema | Too much detail may expose private reasoning. |
| Search mechanisms should record budget and stopping criteria where available. | SearchController | ToT, GoT | structural plus provenance | Some runtime systems do not expose this. |
| Reasoning modalities should be distinguishable from tools. | ReasoningModality | MoT, Program-of-Thoughts | ontology constraint | Code reasoning can blur into tool execution. |
| Full hidden chain-of-thought should not be required for interoperability. | ReasoningTrace | Production systems may expose summaries/traces rather than private reasoning. | privacy/security constraint | Storing private reasoning can be unsafe or unavailable. |

## Schema Implications

Facts only. No final schema decisions.

- A mechanism layer needs to represent topology separately from protocol messages and framework nodes.
- `ReasoningTrace` should allow observable summaries, sampled paths, decisions, and metadata without requiring full hidden chain-of-thought.
- `ThoughtEvaluator`, `SearchController`, `BranchingPolicy`, and `AnswerAggregation` are mechanism candidates that may sit in an execution/evaluation layer rather than ontology core.
- MoT evidence means reasoning representation should not assume natural language only.
- Reasoning topology and cost/budget metadata are tightly linked; search-heavy mechanisms can be much more expensive than one-pass prompting.

## Framework Or Standard Specificity

Core candidates:

- Thought
- ReasoningTopology
- ReasoningPath
- ChainTopology
- TreeTopology
- GraphTopology
- ReasoningModality
- AnswerAggregation

Likely adapter/runtime-only until Phase 0C:

- Exact ToT BFS/DFS fields
- GoT thought-transformation operators
- MoT training pipeline details
- Prompt-report technique names that do not generalize beyond prompting

## Contradictions And Open Questions

- CoT papers make intermediate reasoning central, but production systems may not expose or permit storage of private chain-of-thought. Phase 0C needs a distinction between `privateReasoning`, `reasoningSummary`, and `observableTrace`.
- ToT and GoT use "thought" as an explicit unit, while some frameworks expose graph nodes or tool calls instead. The schema should not equate thought nodes with framework workflow nodes without evidence.
- MoT uses "modality" for reasoning format, which can collide with multimodal input/output terminology.
- Search-based reasoning improves some tasks but carries cost and latency implications; mechanism representation needs budget metadata.

## Follow-Up Sources

- Program-of-Thoughts full extraction.
- RAP and Algorithm-of-Thought extraction.
- Current model-provider guidance on hidden reasoning, reasoning summaries, and trace privacy before implementation.
