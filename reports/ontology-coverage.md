# Ontology Coverage Report

[English](ontology-coverage.md) | [中文](ontology-coverage-zh.md)

## Summary

| Metric | Value |
| --- | ---: |
| Total subgraphs | 13 |
| NodeClass definitions | 277 |
| EdgeClass definitions | 144 |
| InterfaceContract definitions | 30 |
| StateMachine definitions | 21 |
| GraphConstraint definitions | 38 |
| YAML artifacts | 510 |
| Intra-subgraph roots | 13 |
| Subgraphs with non-flat internal levels | 13 |
| Orphan nodes | 0 |
| Required-edge failures | 0 |
| Constraint warnings/errors | 0 |

## Per-Subgraph Coverage

| Subgraph | Nodes | Edges | Contracts | States | Constraints |
| --- | ---: | ---: | ---: | ---: | ---: |
| 00-meta-graph | 13 | 9 | 2 | 1 | 3 |
| 01-agent-core-graph | 16 | 11 | 2 | 2 | 2 |
| 02-context-info-graph | 24 | 9 | 2 | 1 | 3 |
| 03-memory-graph | 21 | 12 | 3 | 1 | 2 |
| 04-reasoning-planning-graph | 16 | 9 | 2 | 2 | 2 |
| 05-tool-action-graph | 26 | 13 | 3 | 2 | 4 |
| 06-orchestration-graph | 24 | 12 | 2 | 2 | 2 |
| 07-runtime-harness-graph | 26 | 14 | 3 | 3 | 4 |
| 08-safety-policy-graph | 26 | 12 | 3 | 2 | 5 |
| 09-protocol-interop-graph | 19 | 14 | 2 | 2 | 2 |
| 10-universal-sdk-graph | 28 | 13 | 2 | 1 | 5 |
| 11-environment-adapter-graph | 23 | 9 | 3 | 1 | 2 |
| 12-engineering-validation-graph | 15 | 7 | 1 | 1 | 2 |

## Key Graph Paths

Three precomputed conceptual paths are present:

1. Agent Execution Path
2. Context Tool Discovery Path
3. Retrieval Pipeline Path

## Minimum Non-Degradable Set

All minimum non-degradable concepts are represented, including agent core, context, memory, reasoning, tool/action, orchestration, runtime, safety/policy, protocol, SDK, environment, and validation concepts.

## Intra-Subgraph Hierarchy

Every subgraph now has a local hierarchy model: one level-0 anchor, semantic groups, role labels, and parent links for all non-root nodes. This prevents SG internals from collapsing into a flat list and gives the visualization enough structure to render SG internals as layered architecture rather than peer-level node clouds.
