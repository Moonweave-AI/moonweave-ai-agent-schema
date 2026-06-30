# Diagram Alignment Report

[English](diagram-alignment.md) | [中文](diagram-alignment-zh.md)

## Source Diagram

The ontology is aligned against `Agent Structure Graph.pdf` and `Agent Structure Graph.vsdx`, represented as a four-plane architecture:

- Info Plane
- Memory Plane
- Tool Plane
- Orchestration Plane

The extracted mapping is stored in `references/local-diagram-extract.yaml`.

## Plane Coverage

| Plane | Coverage | Notes |
| --- | ---: | --- |
| Info Plane | 100% | context, chunks, embeddings, transcript, light index, output chunks |
| Memory Plane | 100% | retrieval and preference memory concepts |
| Tool Plane | 100% | tool call, sandbox, permission, policy, command/storage areas |
| Orchestration Plane | 100% | orchestrator, workers, gates, routing, parallelization, evaluation |

## Alignment Examples

| Diagram concept | Ontology node |
| --- | --- |
| ProgressiveDisclosure | `node.progressive_disclosure` |
| Agent Transcript | `node.transcript` |
| Embedding Model | `node.embedding_model` |
| Vector Database | `node.vector_store` |
| Tool Call | `node.tool_call` |
| Sandbox | `node.sandbox` |
| Permission | `node.permission_policy` |
| Orchestrator-workers | `node.orchestrator`, `node.worker` |
| Parallelization | `node.parallelization` |
| Subagent | `node.subagent` |

## Overall Alignment

All 95 extracted diagram concepts are mapped to ontology `NodeClass` definitions. The four source planes are covered at 100%.
