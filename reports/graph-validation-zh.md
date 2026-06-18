# 图谱校验报告

[English](graph-validation.md) | [中文](graph-validation-zh.md)

## 摘要

当前本体图谱通过结构校验、约束校验、孤立节点检查、必需边检查和可视化框架检查。

| 检查项 | 结果 |
| --- | --- |
| NodeClass ID 格式 | PASS |
| EdgeClass ID 格式 | PASS |
| 节点必填字段 | PASS |
| SG 内层级字段 | PASS |
| SG 内父子链接 | PASS |
| 边必填字段 | PASS |
| 重复 ID | 0 |
| 边端点引用 | PASS |
| 跨子图引用 | PASS |
| 图约束 | 38/38 PASS |
| 孤立节点 | 0 |
| required edge 失败 | 0 |
| 可视化框架 | PASS |

## 结构校验

- 所有 `NodeClass` 均符合 `node.*` 命名规则。
- 所有 `NodeClass` 均声明 `intra_level`、`intra_group`、`intra_group_zh` 和 `intra_role`。
- 每个 SG 都有且只有一个 `intra_level: 0` 根锚点，每个非根节点都指向同 SG 中更低层级的父节点。
- 所有 `EdgeClass` 均符合 `edge.*` 命名规则。
- 所有边的 `source_domain` 与 `target_range` 均能解析到已定义节点。
- 跨子图关系没有悬空端点。

## 约束校验

关键不可降级约束均已通过：

- `tool_call_must_be_guarded`
- `side_effect_must_have_policy`
- `memory_write_must_have_policy`
- `protocol_endpoint_must_have_auth`
- `least_privilege_must_be_monotonic`
- `subagent_must_have_delegation_contract`
- `sdk_must_not_depend_on_vendor`
- `release_gate_must_check_all`

## 可视化数据

| 文件 | 结果 |
| --- | --- |
| `ontology.graph.json` | 277 nodes, 144 edges |
| SG 内层级 | 13 个根锚点，所有 SG 均为非平铺内部层级 |
| `ontology.subgraphs.json` | 13 subgraphs |
| `ontology.paths.json` | 3 paths |
| `ontology.constraints.json` | 38 constraints |
| `ontology.evidence.json` | evidence refs 可用 |
