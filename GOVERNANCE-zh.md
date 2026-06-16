# 本体治理规则

[English](GOVERNANCE.md) | [中文](GOVERNANCE-zh.md)

本文件定义 `moonweave-ai-agent-schema` 的命名、结构、扩展、生命周期和校验规则。目标是让本体长期保持通用、可维护、可验证，而不是退化为某个 SDK、框架或提供商的临时映射表。

## 1. 命名规则

| Artifact | 命名格式 | 示例 |
| --- | --- | --- |
| NodeClass | `node.<snake_case>` | `node.tool_call` |
| EdgeClass | `edge.<UPPER_SNAKE_CASE>` | `edge.INVOKES` |
| InterfaceContract | `contract.<snake_case>` | `contract.invocable` |
| StateMachine | `state.<snake_case>` | `state.tool_call_lifecycle` |
| GraphConstraint | `constraint.<snake_case>` | `constraint.tool_call_must_be_guarded` |
| EvidenceRef | `evidence.<source>.<path>` | `evidence.diagram.tool_plane.tool_call` |

## 2. Artifact 类型

每个 YAML 文件必须声明且只声明一种 `artifact`：

- `NodeClass`：本体概念节点。
- `EdgeClass`：节点之间的有向关系类型。
- `InterfaceContract`：节点可实现的接口契约。
- `StateMachine`：节点或流程的生命周期状态机。
- `GraphConstraint`：图结构约束或工程质量规则。
- `GraphView`：面向文档、可视化或实现的图视图。
- `EvidenceRef`：连接论文、官方资料、源图或工程证据的引用。

## 3. 必填字段

`NodeClass` 必须包含：

- `id`
- `artifact`
- `label`
- `label_zh`
- `description`

`EdgeClass` 必须包含：

- `id`
- `artifact`
- `predicate`
- `source_domain`
- `target_range`
- `description`

## 4. 厂商中立

- 本体主干不得以厂商、产品、具体 SDK 或具体框架作为节点 ID 或边 predicate。
- 现实工程实现只能放入 `references/non-normative-exemplars/`，作为非规范示例。
- 抽象命名必须保持通用：使用 `tool_server`，而不是协议专有服务器名；使用 `capability_manifest`，而不是某个协议的专有卡片名。

## 5. 扩展规则

- 新增节点必须至少通过一条已定义边连接到现有节点。
- 新增边必须声明清晰的 `source_domain` 和 `target_range`。
- 新增子图必须提供 `GraphView` 或等价视图定义。
- 新增核心概念应补充 evidence reference。
- 不允许引入孤立节点。

## 6. 生命周期

每个 artifact 必须携带 `status` 字段：

- `active`：当前有效。
- `deprecated`：已不推荐，但仍保留兼容。
- `removed`：已移除，仅可在历史记录中追溯。

弃用 artifact 至少保留一个版本周期后才能移除。

## 7. 不可降级约束

以下规则属于强制约束：

- `ToolCall` 必须由 `PolicyContract` 守护。
- 具有副作用的 `EnvironmentAction` 必须存在权限路径。
- 记忆写入操作必须连接到写入策略。
- `ProtocolEndpoint` 必须有授权方案，或明确声明公共端点策略。
- SDK 抽象不得依赖具体厂商。
- 发布前必须通过 `GraphValidator` 所代表的完整校验门禁。

## 8. 本地校验

```powershell
node .\tools\validate-graph.mjs
node .\tools\validate-constraints.mjs
node .\tools\check-orphan-nodes.mjs
node .\tools\check-required-edges.mjs
node .\tools\check-visualization-framework.mjs
```
