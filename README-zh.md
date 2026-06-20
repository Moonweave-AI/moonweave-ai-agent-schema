<div align="center">

# moonweave-ai-agent-schema

**面向 Agent 工程的通用本体图谱基础设施**

图优先 · 厂商中立 · 约束可执行 · 证据可追溯

[English](README.md) | [中文](README-zh.md)

</div>

---

## 项目定位

`moonweave-ai-agent-schema` 是一套面向 Agent 设计、研究与工程落地的通用本体工程底座。它不是 SDK 清单，不是框架评测表，也不是扁平分类法。

项目以 typed graph 方式组织完整 Agent 栈：

- 每一个概念都是 `NodeClass`
- 每一种关系都是 `EdgeClass`
- 每一条质量要求都是 `GraphConstraint`
- 每一个工程视角都是 `GraphView`
- 每一个关键设计判断都可以追溯到 evidence reference

目标是让 Agent 开发从严谨、可检查、可扩展的本体开始，而不是从零散模块、厂商 API 或临时架构图开始。

## 设计原则

| 原则 | 含义 |
| --- | --- |
| 图优先 | 先定义节点、边、约束、视图，再导出表格或文档 |
| 厂商中立 | 本体主干不依赖任何提供商、SDK、框架或协议实现 |
| 子图内层级 | 每个 SG 模块都拥有根锚点、层级列、语义方向泳道、细分分组、节点角色和父子链接 |
| 工程可用 | 运行时、工具调用、安全策略、环境适配、SDK、校验门禁都是一等结构 |
| 证据可追溯 | 核心节点与关系连接到源图、论文、官方资料和工程参考 |
| 约束可执行 | 本体不是静态说明，而是能被质量门禁验证的工程资产 |

## 本体全景

| 编号 | 子图 | 覆盖范围 |
| --- | --- | --- |
| 00 | Meta Graph | 本体元模型：节点、边、约束、视图、证据、命名空间 |
| 01 | Agent Core | 智能体身份、目标、任务、能力、决策循环、认知核心 |
| 02 | Context Info | 上下文源、消息、指令、渐进式披露、轻量索引 |
| 03 | Memory | 工作记忆、情景记忆、语义记忆、程序性记忆、偏好记忆、检索与压缩 |
| 04 | Reasoning Planning | 推理轨迹、计划、搜索空间、反思、重规划、思考预算 |
| 05 | Tool Action | 工具定义、发现、匹配、调用、结果、副作用、代码执行 |
| 06 | Orchestration | 工作流、路由、并行化、多智能体委派、共识 |
| 07 | Runtime Harness | 会话、运行、执行器、沙箱、检查点、重试、恢复 |
| 08 | Safety Policy | 信任边界、权限、信息流控制、注入防御、审计、回滚 |
| 09 | Protocol Interop | 协议角色、端点、能力清单、任务信封、消息信封 |
| 10 | Universal SDK | 通用 SDK 内核、API 家族、插件、适配器、协议绑定 |
| 11 | Environment Adapter | 环境类型、观测、动作、状态、权限面、风险画像 |
| 12 | Engineering Validation | 图验证器、覆盖率检查、必需边检查、发布门禁 |

## 仓库结构

```text
moonweave-ai-agent-schema/
|-- README.md
|-- README-zh.md
|-- GOVERNANCE.md
|-- GOVERNANCE-zh.md
|-- ontology-manifest.yaml
|-- graph.schema.json
|-- ontology/                         # 13 个本体子图，510 个 YAML artifact
|-- references/                       # 证据索引、论文、源图抽取、非规范示例
|-- visualization/                    # 可直接打开的交互式本体图谱网页
|   |-- index.html
|   |-- vendor/d3.min.js
|   `-- data/
|-- tools/                            # 最小质量门禁工具集
|   |-- build-visualization-data.mjs
|   |-- validate-graph.mjs
|   |-- validate-constraints.mjs
|   |-- check-orphan-nodes.mjs
|   |-- check-required-edges.mjs
|   |-- check-visualization-framework.mjs
|   |-- check-visualization-detail-contract.mjs
|   `-- lib/
`-- reports/                          # 英文报告与对应 -zh 中文版本
```

## 可视化入口

直接打开：

```text
visualization/index.html
```

无需启动服务器。页面内嵌图数据，并使用本地 `visualization/vendor/d3.min.js`。

可视化支持：

- 浏览 13 个本体子图的完整图结构
- 每个 SG 内部按层级列、语义方向泳道、细分分组和父子链接展示，而不是节点平铺
- 查看板块内关系类收束图
- 中英文双语切换
- 节点、边、关系类详情面板
- 节点点击后的精确边实例高亮
- 搜索、路径高亮和聚焦检查

## 质量门禁

当前仓库只保留最小质量门禁工具链：

```powershell
node .\tools\validate-graph.mjs
node .\tools\validate-constraints.mjs
node .\tools\check-orphan-nodes.mjs
node .\tools\check-required-edges.mjs
node .\tools\check-visualization-framework.mjs
node .\tools\check-visualization-detail-contract.mjs
```

这些检查覆盖：

- 节点与边 ID
- 必填字段
- SG 内层级不变量：每个 SG 一个根锚点、同 SG 父节点链接、非平铺层级、语义方向和细分分组
- 边端点引用完整性
- 38 条图约束
- 孤立节点
- required edges
- 必填的中英双语节点说明
- 可视化详情面板数据契约：内嵌节点、父子层级、边端点、边类型中英双语标签、运行时详情索引
- 可视化直开能力和关键交互逻辑

## 当前规模

| 指标 | 数量 |
| --- | ---: |
| 本体子图 | 13 |
| YAML artifact | 510 |
| NodeClass | 277 |
| EdgeClass | 144 |
| InterfaceContract | 30 |
| StateMachine | 21 |
| GraphConstraint | 38 |
| SG 内根锚点 | 13 |
| SG 内语义方向泳道 | 114 |
| 孤立节点 | 0 |
| required edge 失败 | 0 |

## 证据与示例

`references/` 保留两类材料：

- 规范证据：source index、papers、graph evidence、source diagram extraction
- 非规范示例：真实工程中的 SDK、框架、协议、运行时、安全模式

具体实现不进入本体主干，从而保证 schema 的通用性。
