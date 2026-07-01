<div align="center">
  <img src="assets/moonweave-agent-ontology-mark.svg" alt="Moonweave Agent Ontology 标识" width="152" />

  <h1>Moonweave Agent Ontology</h1>

  <p>
    面向智能体系统的证据约束型本体工程框架：
    上下文输入、控制编排、运行轨迹、互操作适配、能力与资源调用、信任与安全、可观测反馈、记忆持久化、结构化模式与图谱浏览。
  </p>

  <p>
    <a href="https://moonweave-ai.github.io/moonweave-ai-agent-schema/">在线浏览器</a>
    · <a href="../README.md">英文文档</a>
    · <a href="README.ja.md">日文文档</a>
    · <a href="../ontology/agent-ontology.json">规范本体 JSON</a>
    · <a href="../schemas/agent-ontology.schema.json">JSON Schema</a>
  </p>
</div>

## 项目定位

Moonweave Agent Ontology 是一个面向智能体系统的规范本体产物。它不是提示词集合、
不是排行榜，也不是一次性的图谱样机。这个仓库的核心是一个可被模式、图谱中间表示、
前端浏览器、语义导出和协议适配器共同消费的本体工程基座。

当前版本的权威入口是：

- `ontology/agent-ontology.json`：机器可读的规范本体；
- `ontology/agent-ontology.md`：人工可读的本体摘要；
- `schemas/agent-ontology.schema.json`：JSON Schema Draft 2020-12 结构化契约；
- `fixtures/`：有效与无效样例；
- `src/`：React 与 TypeScript 实现的本体浏览器；
- `research/` 与 `docs/rfcs/`：Phase 0/1 的证据、来源登记、约束、决策与 RFC。

后续以规范本体、模式、研究登记、RFC、样例、测试和浏览器作为唯一有效产品面。

## 为什么智能体系统需要本体

现代智能体系统已经不再是一次模型调用。一个真实系统通常同时包含运行会话、
可恢复状态、检索上下文、记忆库、工具调用、子智能体、交接、远程委派、协议边界、
权限提示、安全决策、人工审核、评测压力和部署适配器。

如果没有本体，这些结构会被不同框架各自命名，难以互通。一个“交接”、
一个“工具调用”、一个“智能体卡片”、一个“检查点”、一个“评测轨迹”都可能是真实对象，
但它们并不属于同一层。这个项目通过核心层、剖面层和适配器层划分语义边界，
让模式、图谱、前端检查、语义导出和下游适配保持稳定。

## 本体工程参照

本项目借鉴成熟领域本体的工程方法，但不把它们的领域内容塞进智能体本体。

| 参照体系 | 借鉴模式 | 在本项目中的结果 |
|---|---|---|
| [FIBO](https://github.com/edmcouncil/fibo) 与 [FIBO 本体浏览器](https://spec.edmcouncil.org/fibo/ontology) | 本体族、稳定标识、成熟度、卫生检查、来源与发布产物分离 | 智能体本体作为受治理的产品，而不是扁平概念表。 |
| [Gene Ontology](https://geneontology.org/docs/ontology-documentation/) | 正交维度、受控词表、`is_a` 与 `part_of` 等有向无环关系 | 智能体平面保持正交；分类和组成关系保持可检查。 |
| [CIDOC CRM](https://cidoc-crm.org/) | 以事件连接人、物、地点和活动 | 运行历史以可观察事件连接参与者、工具、资源、策略和输出。 |
| [Palantir Ontology](https://www.palantir.com/docs/foundry/ontology/overview/) | 业务对象、链接、动作、函数组成的可操作语义层 | 智能体术语区分对象、事件、动作、策略、资源、参与者、索引、适配器和关系。 |
| [DBpedia Ontology](https://www.dbpedia.org/resources/ontology/) 与 [FOAF](http://xmlns.com/foaf/spec/) | 网络标识、轻量词表和开放关联数据实践 | 每个术语都可以通过稳定 IRI 导出，并连接到语义网剖面。 |
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | 溯源、生成、归属和审计 | 来源编号、约束编号、提案编号、评审状态和推导说明成为治理数据。 |

## 当前本体规模

| 指标 | 当前值 |
|---|---:|
| 领域 | 1 |
| 平面 | 8 |
| 模块 | 39 |
| 类 | 545 |
| 对象属性 | 341 |
| 数据属性 | 98 |
| 注释属性 | 12 |
| 个体 | 78 |
| 公理 | 567 |
| 数据类型 | 8 |
| 本体分区 | 47 |

## 八个运行关注域

Moonweave Agent Schema 通过八个运行关注域组织 agent 系统：上下文摄入与暂存、控制编排、运行执行、互操作适配、能力与资源调用、信任与安全治理、可观测反馈，以及记忆与上下文持久化。

| 运行关注域 | 范围 |
|---|---|
| 上下文摄入与暂存域 | 描述可观察内容如何进入某次模型调用或智能体步骤的可见上下文：消息与指令包络、来源引用、内容块、上下文窗口、轻量发现指针、已披露输出片段和执行观测。 |
| 控制与编排域 | 目标、可操作目标、任务计划、委派归属、交接、智能体作为工具调用、上下文隔离、工作者选择、路由目标、闸门、编排拓扑、提示链、并行组合、综合来源，以及有边界的反馈与重试循环。 |
| 运行状态与轨迹域 | 运行执行包络与原始运行证据：运行会话、运行尝试、结果、参与者权限绑定、轨迹、跨度与事件结构、检查点、快照、状态差异、恢复与回放事件，以及运行产物的生成、消费和派生来历。 |
| 互操作适配域 | 外部协议、框架、基准、状态图、模式与导出、语言剖面、图谱中间表示和前端投影进入规范本体前的适配膜；它记录方向性映射、来源与版本溯源、转换警告，并防止适配器专属字段污染核心术语。 |
| 能力与资源调用域 | 能力注册表、工具/资源/提示/API 定义、发现与选择、Schema 符合、工具执行、资源读取、提示实例化、MCP 协议表面、授权桥接、诊断、追踪/上下文交接和可审计副作用。 |
| 信任、策略与安全域 | 围绕信任边界、权限范围、权限提示、策略决策、沙箱与网络控制、来源到接收方注入防御、记忆投毒信号、副作用提交门、脱敏和审计披露形成可审计安全传播图。 |
| 可观测反馈域 | 警告、错误、反馈、批评、审查、指标、基准观察、遥测、审计日志、优化循环、恢复和诊断。 |
| 记忆与上下文持久化域 | 记忆摄入、文件、文档、分块、定位、嵌入、检索、排序、上下文组装、摘要、偏好和持久化策略。 |

## 层边界

- 核心术语必须在智能体系统中具有广泛可观察性。
- 剖面术语描述可复用但可选的视图，例如记忆、编排、验证和生命周期。
- 适配器术语只负责映射外部协议、框架和基准，不污染核心层。
- 隐藏思维链不是必需字段、样例、模式对象或界面展示对象。
- 基准分数和环境压力属于评测适配器元数据，不属于本体核心。
- 跨越权限、远程执行、工具输出、记忆检索或协议元数据的关系必须引用信任边界。

## 目录结构

```text
.
|-- ontology/
|   |-- agent-ontology.json
|   `-- agent-ontology.md
|-- schemas/
|   `-- agent-ontology.schema.json
|-- fixtures/
|   |-- valid/
|   `-- invalid/
|-- research/
|   |-- source-registry.csv
|   |-- living-source-metadata.csv
|   |-- pl-pr-core-profile-adapter-matrix.md
|   `-- source-notes/
|-- docs/
|   |-- README.zh.md
|   |-- README.ja.md
|   |-- assets/
|   |-- design/
|   |-- governance/
|   `-- rfcs/
|-- src/
|-- tests/
|-- e2e/
`-- scripts/
```

## 本地运行

安装依赖：

```bash
npm ci
```

启动本体浏览器：

```bash
npm run dev
```

执行验证：

```bash
npm run verify
npm run e2e
```

重新生成扩展本体：

```bash
npm run ontology:expand
```

## 证据与治理

本体是证据约束型产物。已接受的术语和关系必须追溯到 Phase 0 来源登记、
综合约束和 Phase 1 RFC 决策。

关键治理文件：

- `research/source-registry.csv`：来源登记表；
- `research/living-source-metadata.csv`：动态来源的版本、日期与归一化状态；
- `research/source-notes/fibo-alignment-review.md`：FIBO 对齐审查；
- `research/source-notes/cross-domain-ontology-pattern-review.md`：跨领域本体模式修正；
- `docs/governance/source-and-schema-governance.md`：来源复查、模式版本和信任边界政策；
- `docs/rfcs/0001-ontology-layers.md`：本体层边界；
- `docs/rfcs/0002-canonical-schema-contract.md`：规范模式契约；
- `docs/rfcs/0003-statechart-and-protocol-model.md`：状态机与协议建模边界。

## 当前状态

Phase 0 和 Phase 1 已针对当前规范产物关闭。后续阶段应当：

1. 从规范本体生成生产级模式、剖面和语义导出；
2. 将图谱中间表示和状态机视图作为投影，而不是事实源；
3. 持续提升 Moonweave 风格的本体浏览器；
4. 为 MCP、A2A、框架映射和基准映射补充适配器样例。

## 在线发布

在线浏览器：

[https://moonweave-ai.github.io/moonweave-ai-agent-schema/](https://moonweave-ai.github.io/moonweave-ai-agent-schema/)

界面保持 Moonweave 的月色研究室视觉语言，同时采用接近 FIBO 的本体族浏览结构：
领域、平面、模块、类、关系、标量字段、个体、公理和证据。
