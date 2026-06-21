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
| Intra-subgraph hierarchy | Every SG module has its own root anchor, level columns, semantic axis lanes, fine-grained groups, node roles, and parent-child links |
| Engineering-ready | Runtime, tool invocation, policy, environment, SDK, and validation layers are first-class |
| Evidence-traced | Core nodes and relations link back to diagrams, papers, official documents, engineering references, and claim-level evidence matrix records |
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
|-- ontology/                         # 13 ontology subgraphs, 512 YAML artifacts
|-- references/                       # source catalog, evidence matrix, venue coverage, papers, source diagram extraction, exemplars
|-- visualization/                    # direct-open evidence audit workbench and graph explorer
|   |-- index.html
|   |-- src/
|   |-- vendor/d3.min.js
|   `-- data/
|-- tools/                            # minimal validation gate toolchain
|   |-- build-visualization-data.mjs
|   |-- validate-graph.mjs
|   |-- validate-constraints.mjs
|   |-- check-orphan-nodes.mjs
|   |-- check-required-edges.mjs
|   |-- check-visualization-framework.mjs
|   |-- check-visualization-detail-contract.mjs
|   `-- lib/
`-- reports/                          # reports, upgrade records, diagrams, and preview assets
```

## Visualization

Open this file directly in a browser:

```text
visualization/index.html
```

No local server is required. The page embeds the ontology graph and evidence workbench data, and loads D3 from `visualization/vendor/d3.min.js`.

The default homepage is **Evidence Atlas**, an audit workbench organized as:

```text
Source -> Claim -> Ontology Object -> Gap / Release Gate
```

The full D3 ontology graph is preserved as the secondary `Ontology Graph Explorer` route for drill-down. It is no longer the default first visual.

The visualization supports:

- data-bound Evidence Atlas with source, claim, ontology object, gap, and release gate columns
- System Blueprint, Protocol Flow, Runtime Trace, Safety Surface, Evaluation Coverage, and Ontology Graph Explorer routes
- full graph browsing across all 13 ontology subgraphs inside the secondary graph explorer
- hierarchy-aware layout inside every SG, with level columns, semantic axis lanes, fine-grained groups, and parent links
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
node .\tools\check-visualization-detail-contract.mjs
node .\tools\check-source-catalog.mjs
node .\tools\check-evidence-coverage.mjs
node .\tools\check-theme-coverage.mjs
node .\tools\check-venue-coverage.mjs
node .\tools\check-evidence-workbench-data.mjs
node .\tools\check-workbench-view-model.mjs
node .\tools\check-homepage-redesign.mjs
node .\tools\check-view-routing.mjs
node .\tools\check-diagram-exports.mjs
node .\tools\check-i18n-encoding.mjs
node .\tools\check-preview-screenshots.mjs
node .\tools\check-browser-visual-regression.mjs
```

These checks cover:

- node and edge IDs
- required fields
- required bilingual node descriptions
- intra-subgraph hierarchy invariants: one root anchor per SG, same-subgraph parent links, non-flat levels, semantic axes, and fine-grained groups
- endpoint reference integrity
- 38 graph constraints
- orphan nodes
- required edges
- direct-open visualization behavior and critical interaction logic
- visualization detail-panel contract: embedded nodes, parent links, edge endpoints, predicate bilingual labels, and runtime detail indexes
- source catalog completeness and approved/candidate source separation
- claim-level evidence coverage over ontology nodes, edges, constraints, and planned views
- required research theme coverage across the agent stack
- venue/year coverage across the required 2022-2026 conference scope
- embedded evidence workbench data consistency with the YAML source of truth
- workbench view model integrity across coverage matrix, evidence flows, object support indexes, route legends, and acceptance queries
- default homepage redesign: Evidence Atlas must be the first route, and the old D3 graph must remain secondary
- route switching for Evidence Atlas, System Blueprint, Protocol Flow, Runtime Trace, Safety Surface, Evaluation Coverage, and Ontology Graph Explorer
- diagram-as-code exports, UTF-8 integrity, generated preview PNG assets, and browser-captured desktop/mobile/graph-explorer previews

## Current Scale

| Metric | Value |
| --- | ---: |
| Ontology subgraphs | 13 |
| YAML artifacts | 512 |
| NodeClass definitions | 279 |
| EdgeClass definitions | 144 |
| InterfaceContract definitions | 30 |
| StateMachine definitions | 21 |
| GraphConstraint definitions | 38 |
| Intra-subgraph roots | 13 |
| Intra-subgraph semantic axes | 114 |
| Orphan nodes | 0 |
| Required-edge failures | 0 |

## Evidence and Exemplars

`references/` stores three kinds of material:

- source catalog, evidence matrix, and venue coverage: audited 2022-2026 source records, venue/year review checkpoints, and claim-level ontology mappings
- normative evidence: source index, papers, graph evidence, and source diagram extraction
- non-normative exemplars: SDK, framework, protocol, runtime, and safety patterns from real engineering systems

Concrete implementations stay outside the ontology backbone so the schema remains universal.

## Upgrade Records

The v2 upgrade is tracked through durable handoff files to avoid context loss during long-running revisions:

- `reports/upgrade-worklog.md`
- `reports/context-handoff.md`
- `reports/decision-log.md`
- `reports/progress-board.md`
- `reports/risk-register.md`
- `reports/source-matrix.md`
- `reports/ui-spec.md`
- `reports/previews/*.png`
