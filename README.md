# moonweave-ai-agent-schema

Agent Ontology Schema
=====================

A universal, graph-native agent ontology engineering foundation for comprehensive agent development.

## What This Is

This repository defines a **complete agent ontology** as a typed graph — not a flat taxonomy, not a vendor SDK directory, not a framework comparison list. Every concept is a `NodeClass`, every relationship is an `EdgeClass`, every constraint is a `GraphConstraint`, and every view is a `GraphView`.

The ontology covers the full stack of agentic systems:

| Subgraph | Scope |
| --- | --- |
| `00-meta-graph` | Ontology primitives: node/edge/constraint/view/evidence definitions |
| `01-agent-core-graph` | Agent identity, goals, tasks, capabilities, decision loop, cognitive core |
| `02-context-info-graph` | Context sources, messages, instructions, progressive disclosure, light indexes |
| `03-memory-graph` | Working/episodic/semantic/procedural/preference memory, retrieval, compaction |
| `04-reasoning-planning-graph` | Reasoning traces, plans, search spaces, reflection, replanning, budgets |
| `05-tool-action-graph` | Tool definition/discovery/invocation, computer use, side effects, code execution |
| `06-orchestration-graph` | Workflows, routing, parallelization, multi-agent, delegation, consensus |
| `07-runtime-harness-graph` | Sessions, runs, traces, checkpoints, sandboxes, budgets, recovery |
| `08-safety-policy-graph` | Trust boundaries, permissions, IFC, prompt injection defense, audit, rollback |
| `09-protocol-interop-graph` | Protocol roles, endpoints, capability manifests, task/message envelopes |
| `10-universal-sdk-graph` | Generic SDK kernel, API families, adapters, extensions, protocol bindings |
| `11-environment-adapter-graph` | Environment types, observations, actions, risk profiles, permission surfaces |
| `12-engineering-validation-graph` | Graph validators, coverage checkers, release gates |

## Design Principles

1. **Graph-native.** The ontology is a graph of typed nodes and edges. Tables and lists are secondary exports.
2. **Vendor-neutral.** No specific SDK, framework, or provider appears in the ontology backbone. Concrete implementations live in `references/non-normative-exemplars/`.
3. **Constraint-enforced.** Every `ToolCall` must have a `GUARDED_BY` edge. Every side-effecting action must connect to a `PolicyContract`. Every protocol endpoint must have an authorization scheme.
4. **Evidence-traced.** Every core node connects to an `EvidenceRef` linking back to source diagrams, papers, or protocol specifications.
5. **One-shot delivery.** This is not a multi-phase roadmap. It is a complete ontology engineering foundation delivered as a single coherent artifact.

## Repository Layout

```
agent-schema/
├── README.md
├── GOVERNANCE.md
├── ontology-manifest.yaml
├── graph.schema.json
├── ontology/                    # 13 graph modules
│   ├── 00-meta-graph/
│   │   ├── nodes/
│   │   ├── edges/
│   │   ├── contracts/
│   │   ├── states/
│   │   └── constraints/
│   ├── 01-agent-core-graph/
│   │   └── ...
│   └── ...
├── references/
│   ├── source-index.yaml
│   ├── local-diagram-extract.yaml
│   ├── papers.bib
│   ├── graph-evidence.yaml
│   └── non-normative-exemplars/
├── visualization/
│   ├── index.html
│   ├── vendor/d3.min.js
│   └── data/
├── tools/
└── reports/
```

## Visualization

Open `visualization/index.html` directly in a browser to explore the full ontology graph interactively. No local server is required: the page embeds the graph/path data and loads D3 from `visualization/vendor/d3.min.js`. The separate JSON files under `visualization/data/` remain available for validation and regeneration workflows.

The web interface supports:

- Full ontology graph view with all 13 subgraphs
- Agent execution path tracing
- Four-plane diagram view (Info / Memory / Tool / Orchestration)
- Runtime trust graph view
- Universal SDK graph view
- Node/edge search, filtering, and detail inspection
- Subgraph collapse/expand
- Path highlighting and neighbor expansion

## Key Graph Paths

```
Goal → Agent → DecisionLoop → Plan → ToolCall → PermissionPolicy → Executor → Sandbox → EnvironmentAction → ToolResult → Transcript → Trace
```

```
ContextSource → ProgressiveDisclosure → LightIndex → ToolSearch → DeferredToolDefinition → ToolSelection → ToolCall
```

```
Document → Chunk → ContextualizedChunk → SparseIndex/VectorIndex → RankFusion → Reranker → MemoryRetriever → ContextGraph
```

## Theoretical Foundations

- **CoALA** — Memory (working/episodic/semantic/procedural), action space (internal/external), decision loop
- **Agent Harness Survey** — H = (E, T, C, S, L, V) execution harness formalization
- **FAOS** — Three-layer enterprise ontology with neurosymbolic coupling
- **Parallax / Progent / FIDES** — Safety architectures: think-act separation, least privilege, information flow control
- **Hierarchical Memory Theory** — (α, C, τ) decomposition for agent memory systems
