<div align="center">

# moonweave-ai-agent-schema

**A graph-native ontology foundation for agent engineering**

Graph-native · Vendor-neutral · Constraint-enforced · Evidence-traced

[English](README.md) | [中文](README-zh.md)

</div>

---

## What This Repository Is

`moonweave-ai-agent-schema` is a universal ontology engineering foundation for designing, researching, and building agent systems. It is not a vendor SDK catalog, not a framework comparison table, and not a flat taxonomy.

The repository models the full agent stack as a typed graph:

- every concept is a `NodeClass`
- every relationship is an `EdgeClass`
- every quality rule is a `GraphConstraint`
- every engineering perspective is a `GraphView`
- every core design decision is traceable through evidence references

The goal is to make agent development start from a rigorous, inspectable, and extensible ontology rather than from scattered modules, provider APIs, or one-off diagrams.

## Design Principles

| Principle | Meaning |
| --- | --- |
| Graph-native | Define nodes, edges, constraints, and views first; tables are secondary exports |
| Vendor-neutral | The ontology backbone does not depend on any provider, SDK, framework, or protocol implementation |
| Intra-subgraph hierarchy | Every SG module has its own root anchor, semantic groups, node roles, and parent-child levels |
| Engineering-ready | Runtime, tool invocation, policy, environment, SDK, and validation layers are first-class |
| Evidence-traced | Core nodes and relations link back to diagrams, papers, official documents, and engineering references |
| Constraint-enforced | The ontology is validated by executable quality gates, not only described in prose |

## Ontology Map

| ID | Subgraph | Scope |
| --- | --- | --- |
| 00 | Meta Graph | Ontology primitives: nodes, edges, constraints, views, evidence, namespaces |
| 01 | Agent Core | Agent identity, goals, tasks, capabilities, decision loop, cognitive core |
| 02 | Context Info | Context sources, messages, instructions, progressive disclosure, light indexes |
| 03 | Memory | Working, episodic, semantic, procedural, preference memory; retrieval and compaction |
| 04 | Reasoning Planning | Reasoning traces, plans, search spaces, reflection, replanning, thinking budgets |
| 05 | Tool Action | Tool definition, discovery, matching, invocation, results, side effects, code execution |
| 06 | Orchestration | Workflows, routing, parallelization, multi-agent delegation, consensus |
| 07 | Runtime Harness | Sessions, runs, executors, sandboxes, checkpoints, retry, recovery |
| 08 | Safety Policy | Trust boundaries, permissions, information flow control, injection defense, audit, rollback |
| 09 | Protocol Interop | Protocol roles, endpoints, capability manifests, task and message envelopes |
| 10 | Universal SDK | Generic SDK kernel, API families, plugins, adapters, protocol bindings |
| 11 | Environment Adapter | Environment types, observations, actions, state, permission surfaces, risk profiles |
| 12 | Engineering Validation | Graph validators, coverage checks, required-edge checks, release gates |

## Repository Layout

```text
moonweave-ai-agent-schema/
|-- README.md
|-- README-zh.md
|-- GOVERNANCE.md
|-- GOVERNANCE-zh.md
|-- ontology-manifest.yaml
|-- graph.schema.json
|-- ontology/                         # 13 ontology subgraphs, 510 YAML artifacts
|-- references/                       # evidence index, papers, source diagram extraction, exemplars
|-- visualization/                    # direct-open interactive ontology graph
|   |-- index.html
|   |-- vendor/d3.min.js
|   `-- data/
|-- tools/                            # minimal validation gate toolchain
|   |-- validate-graph.mjs
|   |-- validate-constraints.mjs
|   |-- check-orphan-nodes.mjs
|   |-- check-required-edges.mjs
|   |-- check-visualization-framework.mjs
|   `-- lib/
`-- reports/                          # English reports plus matching -zh versions
```

## Visualization

Open this file directly in a browser:

```text
visualization/index.html
```

No local server is required. The page embeds the graph data and loads D3 from `visualization/vendor/d3.min.js`.

The visualization supports:

- full graph browsing across all 13 ontology subgraphs
- hierarchy-aware layout inside every SG, with level columns, semantic group lanes, and parent links
- class-bundled relation diagrams inside each subgraph
- English/Chinese language switching
- node, edge, and relation-class detail panels
- precise edge-instance highlighting for selected nodes
- search, path highlighting, and focused graph inspection

## Validation Gates

Only the minimal quality gate toolchain is kept in this repository:

```powershell
node .\tools\validate-graph.mjs
node .\tools\validate-constraints.mjs
node .\tools\check-orphan-nodes.mjs
node .\tools\check-required-edges.mjs
node .\tools\check-visualization-framework.mjs
```

These checks cover:

- node and edge IDs
- required fields
- intra-subgraph hierarchy invariants: one root anchor per SG, same-subgraph parent links, and non-flat levels
- endpoint reference integrity
- 38 graph constraints
- orphan nodes
- required edges
- direct-open visualization behavior and critical interaction logic

## Current Scale

| Metric | Value |
| --- | ---: |
| Ontology subgraphs | 13 |
| YAML artifacts | 510 |
| NodeClass definitions | 277 |
| EdgeClass definitions | 144 |
| InterfaceContract definitions | 30 |
| StateMachine definitions | 21 |
| GraphConstraint definitions | 38 |
| Intra-subgraph roots | 13 |
| Orphan nodes | 0 |
| Required-edge failures | 0 |

## Evidence and Exemplars

`references/` stores two kinds of material:

- normative evidence: source index, papers, graph evidence, and source diagram extraction
- non-normative exemplars: SDK, framework, protocol, runtime, and safety patterns from real engineering systems

Concrete implementations stay outside the ontology backbone so the schema remains universal.
