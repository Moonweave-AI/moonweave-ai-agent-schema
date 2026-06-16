# Ontology Coverage Report

## Summary

| Metric | Value |
| --- | --- |
| Total Subgraphs | 13 |
| Total NodeClass definitions | 277 |
| Total EdgeClass definitions | 144 |
| Total InterfaceContract definitions | 30 |
| Total StateMachine definitions | 21 |
| Total GraphConstraint definitions | 38 |
| Total YAML artifacts | 510 |
| Orphan nodes | 0 |
| Required edge failures | 0 |
| Constraint warnings/errors | 0 |

## Per-Subgraph Coverage

| Subgraph | Nodes | Edges | Contracts | States | Constraints |
| --- | --- | --- | --- | --- | --- |
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

3 pre-computed conceptual paths verified:
1. Agent Execution Path (12 nodes)
2. Context Tool Discovery Path (7 nodes)
3. Retrieval Pipeline Path (8 nodes)

## Minimum Non-Degradable Set

All 30 minimum non-degradable nodes are present in the ontology:
Agent, Goal, Task, DecisionLoop, ContextGraph, ProgressiveDisclosure, MemoryStore, MemoryRetriever, Plan, ToolDefinition, ToolCall, ToolResult, Workflow, Subagent, ExecutionHarness, Session, Trace, Sandbox, PolicyContract, PermissionPolicy, InformationFlowControl, EnvironmentAdapter, Protocol, CapabilityManifest, AgentSDK, SDKKernel, ToolAPI, WorkflowAPI, PolicyAPI, GraphValidator, GraphView.
