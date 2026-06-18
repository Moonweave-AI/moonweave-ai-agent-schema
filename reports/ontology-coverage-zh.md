# 本体覆盖率报告

[English](ontology-coverage.md) | [中文](ontology-coverage-zh.md)

## 摘要

| 指标 | 数量 |
| --- | ---: |
| 本体子图 | 13 |
| NodeClass | 277 |
| EdgeClass | 144 |
| InterfaceContract | 30 |
| StateMachine | 21 |
| GraphConstraint | 38 |
| YAML artifact | 510 |
| SG 内根锚点 | 13 |
| 具备非平铺内部层级的 SG | 13 |
| 孤立节点 | 0 |
| required edge 失败 | 0 |
| 约束 warning/error | 0 |

## 子图覆盖率

| 子图 | 节点 | 边 | 契约 | 状态机 | 约束 |
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

## 关键图路径

当前包含 3 条预置概念路径：

1. Agent Execution Path
2. Context Tool Discovery Path
3. Retrieval Pipeline Path

## 最小不可降级集合

Agent core、context、memory、reasoning、tool/action、orchestration、runtime、safety/policy、protocol、SDK、environment、validation 等核心概念均已覆盖。

## SG 内层级

每个 SG 都已经具备本地层级模型：一个 L0 根锚点、语义分组、节点角色，以及所有非根节点的父节点链接。这避免 SG 内部概念退化为平铺列表，也让可视化能够以层级架构图而不是同级节点云的方式呈现板块内部结构。
