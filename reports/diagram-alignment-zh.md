# 源图对齐报告

[English](diagram-alignment.md) | [中文](diagram-alignment-zh.md)

## 源图

本体已与 `Agent Structure Graph.pdf` 和 `Agent Structure Graph.vsdx` 对齐。源图被视为四平面架构：

- 信息平面
- 记忆平面
- 工具平面
- 编排平面

抽取映射保存在 `references/local-diagram-extract.yaml`。

## 平面覆盖率

| 平面 | 覆盖率 | 说明 |
| --- | ---: | --- |
| 信息平面 | 100% | 上下文、分块、嵌入、转录、轻量索引、输出块 |
| 记忆平面 | 100% | 记忆检索与偏好记忆 |
| 工具平面 | 100% | 工具调用、沙箱、权限、策略、指令区、存储区 |
| 编排平面 | 100% | 编排器、工作者、门控、路由、并行化、评估 |

## 对齐示例

| 源图概念 | 本体节点 |
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

## 总体结论

源图抽取出的 95 个概念均已映射到本体 `NodeClass`。四个源图平面均达到 100% 覆盖。
