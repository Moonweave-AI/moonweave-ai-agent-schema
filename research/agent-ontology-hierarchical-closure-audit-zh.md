# Moonweave Agent Ontology 层级闭环与本体设计审计报告（中文完整版）

> 报告日期：2026-07-13
> 审计对象：`ontology/agent-ontology.json` 及其定义账本、生成器、Schema、测试、RFC 和研究资料
> 当前分支：`chore/agent-ontology-audit`
> 基线提交：`6c01220`（与审计时 `origin/main` 一致）
> 证据截止：2026-07-13
> 报告性质：架构与本体工程审计、修改建议；**本报告不直接改写规范本体**

## 0. 结论先行

Moonweave 当前成果已经是一套规模较大、来源意识较强、拥有多语定义和可视化支撑的 **Agent 工程词汇资产**；但若目标是“像 FIBO 一样，为 Agent 构建提供完整逻辑闭环的生产级本体工程”，当前版本还不能称为闭环的 canonical ontology。

根因不是术语数量不足，而是以下四件事尚未分开：

1. **本体定义图（TBox）**：类、上位类、关系、约束、策略、动作定义；
2. **运行实例图（ABox）**：Agent、Run、Task、Action Attempt、Event、Result、Artifact、状态快照；
3. **治理与溯源图**：来源、版本、提案、审查、迁移、废弃、证据；
4. **工程视图与适配层**：当前八个 plane、MCP/A2A/框架/benchmark 映射和前端投影。

当前八个 plane 更像七个运行关注视图加一个适配膜，而不是互斥、完备、可推理的第一层本体分类。它们把对象、过程、角色、信息、规范和实现映射混在同一层，因此即使继续补充更多术语，也不会自然形成闭环。

本报告的总建议是：

- 保留八 plane 作为 **operational views**，不要再让它们承担唯一的 `is-a` 层级；
- 建立跨 plane 的最小稳定语义核和真实类型 DAG；
- 以 `Core / Profile / Adapter` 作为正交所有权轴；
- 将运行实例、验证 shapes、治理元数据与 TBox 分离；
- 用一个“软件缺陷修复 Agent”贯穿概念、关系、实例、查询和验收；
- 暂停 `canonical-phase-1` 的冻结含义，先完成 P0 结构修复再重新发布。

### 0.1 审计评级

以下为本报告使用的 0–4 工程审计量表，不是外部标准认证：0=缺失，1=有片段，2=局部可用，3=系统化，4=可发布且可执行验证。

| 维度 | 当前评级 | 核心依据 |
|---|---:|---|
| 范围与最高层分类 | 1/4 | 有八个 concern plane，但没有互斥、完备的上位类别或显式 `domains[]` |
| 类型层级与逻辑表达 | 0/4 | 572 个类没有一条实际 `subClassOf/is_a` 断言，也没有 disjoint、inverse、cardinality |
| 全局 Agent 生命周期闭环 | 1/4 | 有局部边，但缺 `Intent/Action/Observation/Plan` 等锚点和明确主执行链 |
| 一级域与二级模块职责 | 2/4 | 41 个模块覆盖面广；大量模块缺输入—转换—输出—失败恢复闭环，且跨域重叠 |
| 关系与边合同 | 1/4 | 有 domain/range 和来源；缺基数、逆关系、时态、限定关系、成熟度、正反例 |
| 实例、查询与约束验证 | 1/4 | 有测试与字符串型 axiom；没有有效 ABox、SHACL、CQ fixture，80/80 个体类型悬空 |
| 来源与变更治理 | 3/4 | 361 条来源登记、多语账本、RFC 和测试基础较好；仍有定义串义、来源漂移和双真相源 |
| 解释、案例与可读性 | 1/4 | 多语字段覆盖高，但正例、反例、competency question 为零，且存在明显错译/串义 |

## 1. 审计目标、范围与方法

### 1.1 对会议要求的还原

2026-07-03 快速会议给出的要求可以归纳为六条验收原则：

1. 不能只堆概念，必须解释概念的定义、层级、关系、必要性和工程例子；
2. 先判断第一层是否闭环，再判断每个第一层下面的第二层是否闭环，逐层向下；
3. 去重、消歧、明确边界，特别是 runtime/情感、tool call/action、memory 层级、前端状态/内部状态；
4. 本体要能反向指导模块、状态机、前后端边界、任务分解和技术债治理；
5. 选择一个复杂主案例，完成“本体术语—实现构件—运行事实—验收查询”全映射；
6. 保持严谨版本，同时提供可读解释和案例版本；服务执行，不为抽象而抽象。

本报告据此把“闭环”定义为可测试的工程性质，而不是“术语看起来齐全”。

### 1.2 树状闭环审计法

审计顺序严格从树根向叶节点推进：

```text
L0 目标与范围：这个本体究竟服务什么 Agent 系统？明确不服务什么？
└─ L1 第一层：最高层类别/关注域能否覆盖完整 Agent 生命周期，且边界可判定？
   └─ L2 第二层：每个模块是否有明确输入、职责、输出、失败与恢复？
      └─ L3 概念与关系：术语能否归类，边能否表达时态、约束、证据和责任？
         └─ L4 实例与验证：能否用真实运行实例、CQ、SHACL/JSON Schema 和主案例验证？
```

对树上每个节点均检查七个问题：

1. **目的**：节点回答哪些 competency questions？
2. **边界**：包含什么、排除什么；与兄弟节点如何判界？
3. **入口**：接收哪些上游对象、事件或契约？
4. **内部语义**：有哪些状态、活动、决策和不变量？
5. **出口**：产出哪些事实、制品、结果或决策？
6. **异常闭环**：失败、拒绝、取消、重试、补偿、失效如何表达？
7. **证据治理**：由谁、依据什么、在何版本和时间下定义或断言？

二级模块不必复制整个 Agent 生命周期；它需要的是**职责闭环**。例如索引模块只需从版本化输入到版本化索引、失败和血缘闭环，不能被要求自行包含目标、规划、工具和反馈的全部语义。

### 1.3 证据范围与权威性

仓库现有来源登记共 361 条，其中明确标年 2022–2026 的条目为 150 条；本轮在此基础上深读和交叉核验 33 组最相关的一手资料。另保留 OWL、SHACL、PROV-O、SKOS、ODRL、FIPA 等早于时间窗但仍然有效的基础规范。

证据优先级为：

1. W3C/OASIS/ISO/NIST 等正式规范或国家/国际标准；
2. 同行评审的顶会、期刊和正式论文；
3. 协议、框架和开源项目的官方规范、官方文档与官方仓库；
4. 厂商官方产品文档；
5. 厂商白皮书和社区指南；
6. 二手解释仅用于发现线索，不用于支撑关键结论。

“参考所有相关资料”在开放研究问题上无法字面穷尽，因此本报告采取的是**覆盖主要学术架构、语义标准、运行框架、互操作协议、安全治理和评测体系的系统性权威样本**。来源事实与本报告的“本体推论”明确区分；后者是 Moonweave 的设计建议，不冒充来源原文结论。

### 1.4 证据局限

- 当前不存在一个被 W3C、ISO 和学界共同接受、覆盖 LLM Agent 全生命周期的单一本体标准；需要组合多类证据。
- Skan AOW 是厂商白皮书，不是形式化标准；Palantir 和 Fabric 是产品元模型，不是通用 Agent 本体。
- OASIS 2 是学术本体/W3C Community 工作，不是 W3C Recommendation。
- Fabric IQ 截至审计日仍带产品演进属性；框架 API 变化速度远高于核心本体。
- 2026 年同行评审材料相对有限，强学术证据主要集中于 2023–2025 年；2026 年资料更多来自正式文档、预览规范和安全社区成果。

## 2. 当前规范的可复核量化基线

### 2.1 规范实际规模

以下数字直接来自 `ontology/agent-ontology.json`，而不是说明文档：

| 元素 | 实际数量 | 结构判断 |
|---|---:|---|
| Plane | 8 | 都以 `Domain` 命名，但没有真正的最高层 domain taxonomy |
| Module | 41 | 是组织桶，不是类层级 |
| Class/Term | 572 | `terms` 与 `classes` 为完全重复副本 |
| Object property/Relation | 421 | `relations` 与 `object_properties` 为完全重复副本 |
| Data property | 102 | 82 条以 module 为 domain，20 条为 `any`，0 条 class-scoped |
| Individual | 80 | 80/80 的 `class_id` 均不能解析到实际 class |
| Axiom | 657 | 以 domain-range 和生成式治理语句为主，没有类层级逻辑 |
| `ontology_metrics.ontologies` | 49 | 生成器以 8 plane + 41 module 相加得到；没有对应的 ontology 实体数组，且不计顶层 artifact |

`ontology/agent-ontology.md` 仍报告 39 modules、545 classes、341 object properties、98 data properties、78 individuals、567 axioms，与 canonical JSON 已明显漂移。说明文档、定义账本、生成器和规范文件尚未形成单一真相源。

### 2.2 语义连通性

将 `module_composition`、`module_event`、`module_relation` 三类机械导航边排除，并且只承认 domain/range 都能解析为具体 class 的关系，得到：

- 291 条具体 class-to-class 语义边；
- 328 个弱连通分量；
- 302/572（52.8%）类为语义零度/单点节点；
- 最大弱连通分量仅覆盖 200/572 类。

| 当前一级 Plane | 类总数 | 参与真实语义边 | 连通率 | 闭环初判 |
|---|---:|---:|---:|---|
| info | 103 | 39 | 37.9% | 未闭环；来源、消息、上下文、披露混杂 |
| orchestration | 69 | 31 | 44.9% | 未闭环；缺 Intent 和清晰的计划—执行桥 |
| runtime | 56 | 34 | 60.7% | 局部最成熟；Actor、模型、角色混杂 |
| adapter | 39 | 11 | 28.2% | 不应与运行域平级；映射元模型不足 |
| tool | 83 | 44 | 53.0% | 调用局部成链；定义/选择/尝试/结果未严格分离 |
| safety | 78 | 25 | 32.1% | 横切约束未落实为限定关系和决策链 |
| feedback | 42 | 30 | 71.4% | 局部边较多；与 runtime/evaluation 重叠 |
| memory | 102 | 56 | 54.9% | 生命周期局部较强；核心被具体检索实现污染 |

连通率不能单独证明语义质量，但超过一半的类不参与任何具体语义边，足以否定“整体关系闭环”这一判断。

### 2.3 已确认的 P0 结构缺陷

1. **没有真实类型树。** `is_a` 只作为一个谓词定义存在，572 个类没有实际继承断言；也没有 equivalence、disjointness、inverse、cardinality、key 或 property chain。
2. **`resource_type` 成为兜底桶。** 291/572 个类被归为 `resource_type`，其中大量实际是标量、状态、角色、活动或实现技术。
3. **个体类型全部悬空。** 80 个 individual 引用 `AdapterFamily`、`DecisionKind`、`ModuleIndividual`、`PlaneIndividual`、`RiskLevel`、`Status`、`TransportKind`、`Visibility`，这些类均不存在；其中 49 个还是 plane/module 治理元数据，被错误放进 subject graph。
4. **所有权不一致。** `info-messages-instructions.class_ids` 声明含 `InstructionConflict`，但该类 owner 是 `safety-injection-defense`，plane 的 `term_ids` 也不包含它。
5. **canonical Schema 没有验证 canonical JSON。** `schemas/agent-ontology.schema.json` 要求 `artifact_type=GraphView`、`artifacts`、`relations`；而 5.4 万行 canonical JSON 是另一种结构。`tests/schema-validation.test.ts` 验证的是 `src/data/ontology.ts`/fixture，不是 canonical artifact。
6. **公理数量不等于逻辑表达力。** 657 条 axiom 主要是 421 条 domain-range、102 条 datatype-range、41 条 observability、41 条 evidence、41 条 module-membership、8 条 coverage 加少数边界语句；大多是声明重复或自然语言模板。
7. **95 条自动模块边制造伪语义。** 生成器按模块内字母序前几个类自动构造 contains/relates/emits-event，例如 `AudioBlock → TraceEvent`；41 条 contains 只指向每模块一个类，却声称包含 siblings。
8. **主执行链断裂。** 没有明确的 `info→orchestration`、`orchestration→tool`、`runtime→tool` 主桥；`ContextAssembly` 没有生成唯一的 `ContextPackage`；`EvaluationRun` 没有明确评价 `RunAttempt/Trace`。
9. **关系合同过薄。** Object property 只有 id、label、family、definition、domain、range、acyclic、source；缺逆关系、基数、功能性、时态、断言来源、限定关系和生命周期。
10. **定义“存在”不等于定义“正确”。** 账本比 canonical 实体多 32 条陈旧项，507 个实体的来源集合漂移；至少存在 `ExecutionResult`、`InjectionSignature`、`ToolName/Version/Description` 等中文定义串义，中文中还混入日文假名。测试只检查三语正文是否与账本逐字相同，不检查语义对齐。
11. **案例和 CQ 实际缺失。** example、counterexample、competency question 字段均为零；但 Phase 1 completion 文档却将 CQ 标为 PASS。
12. **生成器固化了缺陷。** `scripts/expand-agent-ontology.mjs` 以标签关键词猜 term kind、自动造模块边/模块 data property/伪 individual/自然语言 axiom，再复制 `classes→terms`、`object_properties→relations`。因此不能只手改产物，必须改生成源和门禁。

### 2.4 现有测试的正确解读

本轮执行了：

```text
vitest run tests/ontology-artifact.test.ts tests/schema-validation.test.ts --reporter=verbose
```

结果为 2 个测试文件、27 个测试全部通过。这证明当前 artifact 满足**现有测试所声明的字符串、数量、来源存在性和局部图约束**；它不证明 canonical JSON 被其 Schema 验证，也不证明 subclass、个体类型、CQ、模块所有权或全局生命周期闭环。换言之，测试是绿的，但 oracle 覆盖了错误的契约边界。

## 3. 指定权威资料的深入对标

### 3.1 Palantir Foundry Ontology

[Palantir Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview) 将 Ontology 作为组织现实世界的 operational layer：语义部分由 object types、properties、link types 构成，动力部分由 actions、functions 和动态安全构成。[Core concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts) 进一步区分对象、属性、共享属性、链接、动作、角色、函数和接口。

Moonweave 最应吸收四点：

1. **语义对象与受控动作分离**：Action 有参数、前置规则、提交条件、权限和副作用，不是一个普通名词；
2. **关系是正式合同**：[link metadata](https://www.palantir.com/docs/foundry/object-link-types/link-type-metadata) 明确端点、方向、基数和 backing/join；
3. **权限附着到对象、属性和动作**，而不是只在 Safety 目录里声明抽象规则；
4. **本体本身可治理**：通过 [branching/proposals](https://www.palantir.com/docs/foundry/ontologies/branching-ontology)、状态和 migration 管理变更。

不宜照搬的是 Foundry 的数据表/RID/索引和平台权限实现，也不宜把所有事件都压成“对象”。Moonweave 应保留 Event、ActionAttempt、Run 和 StateTransition 的本体差异。

### 3.2 Microsoft Fabric IQ Ontology

[Fabric IQ Ontology Overview](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview) 和 [官方教程](https://learn.microsoft.com/en-us/fabric/iq/ontology/tutorial-0-introduction) 围绕 Entity Type、Property、定向 Relationship、Data Binding、Identity Key、实例图、来源与查询展开。

最重要的启发不是术语本身，而是分层：

```text
定义图：Entity Type / Property / Relationship / Rule
         ↓ binding + identity key
实例图：Entity Instance / Relationship Instance / lineage
         ↓ query / agent grounding
消费层：Graph query / Natural language / Agent
```

Moonweave 当前缺少这种明确的数据绑定、身份键、实例来源和 query/use-case gate。Fabric 不足以覆盖 Agent 内部规划、运行和记忆，但它很好地说明：**类定义、数据映射、实例图和 Agent 消费不能在同一数组中混为一谈。**

### 3.3 Skan Agentic Ontology of Work（AOW）

本轮阅读了 [AOW 官方页面](https://www.skan.ai/whitepapers/agentic-ontology-of-work) 和其 [43 页官方 PDF v1.0](https://44522681.fs1.hubspotusercontent-na1.net/hubfs/44522681/Whitepapers/Ontology%20of%20Work_PDF%20-%2020260127.pdf)，并检查了四层图、semantic graph、11 阶段 lifecycle、关系矩阵和 registry 页面。

AOW 的四层检查表是：

| 层 | 代表概念 | 对 Moonweave 的用途 |
|---|---|---|
| Perception | Signal、Event、State、Document、Log、Observation | 校验 info/runtime 是否能把环境事实送入认知 |
| Cognition | Objective、Intent、Context、Policy、Plan | 暴露当前缺失的 Intent 和不完整的 Goal/Plan 链 |
| Execution | Orchestrator、Agent、Skill、Action、Result | 暴露 Action、Skill、Result 的定义/实例混用 |
| Assurance | Confidence、Outcome、Feedback、Memory、Guardian、Provenance | 校验结果—业务效果—反馈—记忆是否闭环 |

AOW 建议的生命周期可概括为：

```text
Objective → Intent → Context → Policy → Plan
→ Agent/Skill/Action → Result → Assurance → Outcome
→ Feedback → Memory → 后续 Context/Policy/Plan
```

它对 Moonweave 最有价值的是**生命周期覆盖检查和 Result/Outcome 区分**。但 AOW 是厂商白皮书，不是 OWL/SHACL 形式规范；其 `Guardian → Everything`、关系矩阵、基数和约束都不足以直接成为 canonical semantics，文档中版本称谓也存在不一致。应当把它当作闭环需求基准，而不是复制其四层为本体类树。

### 3.4 FIBO 与 W3C 语义标准

[FIBO](https://spec.edmcouncil.org/fibo/index.html) 的可迁移价值在治理和模块化：稳定 IRI/import、模块依赖、成熟度、定义来源、弃用、发布门禁和 competency questions。金融领域类树不能照搬，但“产品—领域—模块—ontology 文件”的治理思想应当进入 Moonweave。

语义技术应各司其职：

- [OWL 2](https://www.w3.org/TR/owl2-overview/)：类、继承、等价、析取、属性特征和可推理语义；
- [SHACL](https://www.w3.org/TR/shacl/)：闭世界必填项、基数、路径、严重性和数据图验证报告；
- [PROV-O](https://www.w3.org/TR/prov-o/)：Entity/Activity/Agent 以及 generated、used、derived、associated、attributed 等限定血缘；
- [SKOS](https://www.w3.org/TR/skos-reference/)：首选标签、同义词、定义、说明、正例和跨词表映射；
- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)：交换与语义标识；
- JSON Schema/Zod：API 和 artifact 的结构契约，而不是本体推理替代品。

### 3.5 四类资料的综合结论

| 来源族 | 最强能力 | Moonweave 应吸收 | 必须避免 |
|---|---|---|---|
| Palantir/Fabric | operational semantics、关系、动作、绑定和治理 | 对象/动作分离、基数、实例绑定、身份键、分支迁移 | 产品内部类型和数据实现反向支配核心 |
| AOW/OASIS 2/CoALA | Agent 生命周期、目标任务、委托、认知与记忆 | 完整闭环、模板/规划/执行/结果分离 | 把概念图直接误当形式本体 |
| MCP/A2A/框架 | 调用、消息、状态、handoff、checkpoint、审批 | 作为版本化 adapter/profile，验证核心可映射性 | 用快速变化的 SDK 类定义核心语义 |
| FIBO/W3C | 模块化、形式语义、来源、验证、版本 | 稳定 IRI、imports、OWL+SHACL+PROV、成熟度 | 为追求形式复杂度而脱离工程查询 |

## 4. 建议的目标元架构：三个正交维度

单独把八 plane 重新排序仍然不够。建议采用三个正交维度，使“是什么”“由谁维护”“从哪里看”分离。

### 4.1 维度 A：本体工件层

```text
Ontology Product / Release（发布、版本、依赖、治理）
├─ Core TBox（跨框架稳定语义）
├─ Profile TBox（规划、记忆、评测、安全、具身等可选语义）
├─ Adapter Mapping（MCP、A2A、OpenAI、LangGraph、benchmark 等）
├─ Shapes & Schemas（SHACL、JSON Schema、状态机约束）
├─ ABox Fixtures / Runtime Graph（实例、轨迹、结果、证据）
└─ Views & Documentation（当前 plane、图谱、专业版/可读版/案例版）
```

这一结构落实 RFC 0001 的 `Core / Profile / Adapter` 意图，也避免 adapter 与 runtime、memory 等运行域平级。

### 4.2 维度 B：核心语义树

建议的第一层核心类别不是产品模块名，而是互斥程度更高的本体范畴：

```text
Agent System Entity
├─ Actor / Identity / Role
│  ├─ HumanActor, SoftwareAgent, ServiceActor
│  ├─ AgentIdentity, Credential, Endpoint
│  └─ Role, RoleAssignment, AuthorityBinding
├─ Intent / Goal / Norm
│  ├─ Objective, Intent, Goal, SuccessCriterion
│  └─ Policy, Rule, Permission, Prohibition, Duty
├─ Capability / Procedure / Resource
│  ├─ CapabilityDefinition, Skill, ProcedureTemplate
│  ├─ ToolDefinition, ToolOperation, ModelCapability
│  └─ InformationResource, ComputeResource
├─ Task / Plan / Commitment
│  ├─ TaskDefinition, TaskInstance, Plan, PlanStep
│  └─ Assignment, Delegation, Commitment, Budget
├─ Execution / Interaction
│  ├─ Run, Attempt, ActionDefinition, ActionAttempt
│  ├─ ToolInvocation, ModelInvocation, MessageExchange
│  └─ StateTransition, BoundaryCrossing
├─ Observation / Result / State
│  ├─ Observation, Event, Result, Error
│  ├─ Artifact, StateSnapshot, StateChange
│  └─ Outcome, GoalStatus, TerminationReason
├─ Information / Knowledge / Memory
│  ├─ Message, Content, Claim, ContextSnapshot
│  ├─ MemoryRecord, Store, RetrievalRun
│  └─ KnowledgeUpdate, Reflection, IndexVersion
└─ Evidence / Provenance / Time / Trust
   ├─ EvidenceRecord, ProvenanceRecord, Attribution
   ├─ TemporalEntity, ValidityInterval, Version
   └─ TrustBoundary, Risk, Assurance, Evaluation
```

`Policy/Risk/Privacy`、`Evaluation`、`Memory architecture`、`Planning topology` 可以作为 Core 上的横切 profiles；其对象仍要落回上面稳定的类别。

### 4.3 维度 C：Operational Views

当前 plane 保留为面向工程人员的查询视图：

- `info`：当前交互中的输入、载荷、来源、上下文投影与披露；
- `orchestration`：目标、计划、任务分解、分派、路由和停止；
- `runtime`：Run、Actor instance、状态转换、事件、trace、artifact；
- `tool`：能力注册、发现、选择、调用和结果；
- `safety`：边界、授权、风险、审批、执行监督和审计；
- `feedback`：评价、诊断、纠正、学习信号和再验证；
- `memory`：摄取、存储、检索、上下文组装、保留和失效；
- `adapter` 不再作为运行视图，而是单独的 mapping layer。

同一个核心概念可以出现在多个 view 中，但必须只有一个 canonical owner，并由 view membership 投影，而不是复制类。

## 5. 第一层全局闭环分析

### 5.1 应当成立的全局不变量

最小 Agent 闭环应当能以明确实体和边表达：

```text
Observation/Input
  → Objective/Intent/Goal
  → Context + PolicyDecision
  → Plan/Task/Assignment
  → CapabilitySelection
  → Authorized ActionAttempt / ToolInvocation / ModelInvocation
  → Result + Observation + Artifact + StateChange
  → OutcomeEvaluation + GoalStatus
  → Feedback/Reflection
  → MemoryWrite / PolicyChangeProposal / PlanRevision
  → Replanning or Termination
```

并且每一步都可回答：谁执行、依据什么、使用哪个版本、穿越什么边界、产生什么副作用、证据在哪里、能否撤销或重放。

### 5.2 当前第一层为什么不闭环

- 缺 `Intent`、通用 `Action`、`Observation`、`Plan`、`ModelInvocation`、`Evidence/ProvenanceRecord` 等核心锚点；
- `Goal/TaskPlan/TaskStep` 没有稳定连接到 `TaskDistribution/Route/ToolCallPlan`；
- `AgentActor` 与 `Orchestrator/Subagent/WorkerAgent` 没有 role binding；
- tool 调用与 runtime attempt 没有唯一执行身份；
- Result、Artifact、Outcome、Evaluation 混用，无法证明“动作成功”与“业务目标达成”的区别；
- Context assembly、visible window、context package 分散在 Memory/Info，缺唯一不可变上下文快照；
- Feedback 与 raw telemetry、review activity、learning update 混用；
- Safety 主要是目录和直接边，没有形成 request→decision→enforcement→audit 的可追溯链；
- Adapter 只有映射输出，没有版本化输入、损失、约束保持和 conformance test。

### 5.3 第一层重构的最低接受条件

P0 完成时，至少应通过以下闭环查询：

1. 给定一个 Objective，能否沿图找到 Intent、Plan、Task、执行者、每次 Attempt、Result、Outcome 和终止原因？
2. 给定一次 ToolInvocation，能否找到 ToolOperation、参数绑定、授权依据、sandbox、trace、result/error、副作用和重试？
3. 给定一个 Artifact/Claim，能否找到生成活动、使用输入、责任主体、来源版本和评价？
4. 给定一条 MemoryRecord，能否找到摄取/写入动作、来源、访问范围、失效条件、后继版本和哪些运行使用过它？
5. 给定一个 PolicyDecision，能否找到 policy/rule、subject、action、resource、context、时间、理由和 enforcement outcome？
6. 给定外部 MCP/A2A 对象，能否找到明确版本的 adapter mapping、语义损失和验证结果，而不改变核心定义？

## 6. 第二层逐域、逐模块闭环审计

“当前数量/连通”中的连通数，指模块实际拥有的类中，至少参与一条两端都可解析为具体 class 的非模板对象关系。闭环判定同时考虑流程、边界和约束，不能由连通数单独决定。

### 6.1 `info-plane`

建议的域内闭环是：

```text
Source/Input → Validate/Parse → Normalize/Stage → Context Projection
→ Disclosure Decision → Visible Output → Expire/Clear
```

只在当前交互中暂存的输入归 Info；可供未来运行检索的持久内容归 Memory；执行事实和日志归 Runtime；披露许可由 Safety 决定。

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `info-container-command` | 11/5 | 部分闭环 | 命令、执行和输出观察混在信息域；`CommandExitStatus`、`CommandOutputObservation` 类型不准。收窄为 Runtime I/O 信息模型；Command/Execution 迁入 Tool/Execution，补 `attempt produces observation`、stdout/stderr/exit status、environment binding、source span。 |
| `info-content-block-modality` | 13/2 | 未闭环 | 多数模态块是孤立名词，`MessageContentBlock` 与 `ContentBlock` 边界不清。以 `ContentBlock` 为核心，媒体类型作为分类/profile；补 contains、encoding、size/token count、transcode、transcription、source location。 |
| `info-indexing` | 11/2 | 未闭环且重复 | 与 Memory indexing/retrieval 重复，Query→Candidate→Score→Rank→Selection 未成链。通用检索概念合并到 Memory；Info 若保留，只作为跨注册表轻量 discovery view。 |
| `info-messages-instructions` | 32/14 | 部分闭环且有所有权缺陷 | 消息、会话、prompt 和 instruction governance 混组；模块还多声明一个归 Safety 所有的 `InstructionConflict`。拆为 Messaging 与 Instruction Governance；补 envelope/content、conversation correlation、applicability、authority、scope、conflict resolution 和有效时间。 |
| `info-output-disclosure` | 13/9 | 部分闭环 | Window/truncation/suppression 有局部链，但 request→rule→decision→recipient→audit 不完整，且 `ProgressiveDisclosure` 在 Safety 重复。保留信息披露视图，共用 Safety 的 PolicyDecision；补 purpose、sensitivity、boundary、redacted artifact 和 audit。 |
| `info-storage-sources` | 23/7 | 未闭环 | Source、Reference、Location、Version、Checksum、DataZone 混杂，与 Memory ingestion 重叠。只保留 Source/Reference/Location 核心；补 reference→referent/version/location、checksum validation，以及 PROV 风格的 generation/derivation/attribution。 |

需要统一的 Reference/Projection 模式包括：

```text
TextDocumentReference ──refersTo──> TextDocument
FileResourceReference ──refersTo──> FileResource
DatabaseRowReference ──refersTo──> DatabaseRow
GraphNodeReference ──refersTo──> GraphNode
IndexVersionReference ──refersTo──> IndexVersion
RetrievedContextCandidate ──projects──> RetrievedChunk
```

当前这些对均没有明确 referent/projection 边；`SourceReference` 还通过两条不同关系分别指向 `DataZoneReference` 和 `DataZone`，应消歧而不是并存。

### 6.2 `orchestration-plane`

建议的域内闭环是：

```text
Objective/Intent → Plan → Task decomposition/dependency
→ Assignment/Delegation → Route/Control → Progress/Stall
→ Replan/Stop → Result aggregation
```

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `orchestration-task-planning` | 9/5 | 部分闭环 | 缺 Intent；Objective/Goal/Task/Plan/criterion 区别不完整，约束与执行状态断开。拆开 TaskDefinition/TaskInstance、Plan/PlanRevision；形成 Objective→Intent→Goal→Plan→Task/Step→Attempt→Outcome，并补 constraints、dependencies、success criteria。 |
| `orchestration-actors-delegation` | 23/14 | 部分闭环 | Orchestrator/Subagent/Worker 被当成固定 actor 类型；委托参与方、任务、权限、预算、承诺和结果不全。改用 temporally scoped RoleAssignment；把 Delegation 提升为限定实体，记录 delegator、delegatee、performer、task、scope、authority、status、result。 |
| `orchestration-routing-control` | 11/4 | 未闭环 | Policy、Condition、Decision、Route、Target、Gate、Outcome 没有形成可重放决策链。补 condition evaluation、decision rationale、selected target、gate outcome、retry next attempt、stop condition 和 termination。 |
| `orchestration-composition` | 14/4 | 未闭环 | Chain、parallel、vote、segment、aggregate、synthesis 只是并列名词。拆分 TopologySpecification 与 CompositionRun；明确 stage/branch 输入输出、顺序/并发约束、fan-in、ballot、aggregation rule 和 failure policy。 |
| `orchestration-evaluation` | 12/4 | 未闭环且重叠 | 与 Feedback review/metrics 重复；critic→revision→reevaluation→stop 断裂，`ThinkAsTool` 是实现模式。通用概念合并到 Evaluation & Learning；这里只保留 orchestration loop profile。 |

该域还必须区分：

- Goal 是期望状态；Objective 是带业务语境和成功标准的目标声明；Intent 是 Actor 对 Objective 的情境化承诺/方向；
- TaskDefinition 是要做什么；TaskInstance 是在某次运行中要完成的工作；
- Plan 是组织 Task/Step 的规格；PlanRevision 是不可变修订；
- Assignment 分配责任；Delegation 还转移一定的裁量权/权限；
- RoutingDecision 是决策记录，不等于 Route 本身。

### 6.3 `runtime-plane`

建议的域内闭环是：

```text
Run creation → Actor/Role binding → State transition
→ ActionAttempt/Event → Result/Artifact → Pause/Resume/Terminate
→ immutable trace and provenance
```

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `runtime-system` | 15/10 | 部分闭环 | System、Session、Attempt、Lifecycle、Event、Outcome 层次不严；缺预算、环境组成和状态机。保留 Runtime Execution 核心；补 System hosts Session、Session contains Attempts、Environment contains process/container/workdir、attempt consumes budget、pause/resume/terminate transitions。 |
| `runtime-actors` | 16/7 | 未闭环 | 身份、角色、能力和模型混为 actor；Embedding/Generative/RerankerModel 不是当然的行动主体。模型迁至 Model/Capability profile；引入 AgentIdentity、ActorInstance、RoleAssignment、CapabilityBinding、AuthorityBinding。 |
| `runtime-observability` | 17/14 | 接近局部闭环 | Trace/Span/Event/Snapshot/Checkpoint 是当前最成熟模块之一；仍缺采样、时间、因果、attribute value、retention、error status 和敏感信息处理。保留并对齐 [OpenTelemetry trace/log 语义](https://opentelemetry.io/docs/specs/otel/)。 |
| `runtime-artifacts` | 8/3 | 未闭环 | Draft/Final/Patch/Report/Graph/Schema 大多孤立，类型与状态混淆。只保留 Artifact 核心；Draft/Final 改 ArtifactStatus，具体制品改 ArtifactType/profile；补 generatedBy、usedBy、derivedFrom、versionOf、format、review 和 addressesTask。 |

该域必须固定以下身份不变量：

```text
AgentDefinition ≠ ActorInstance ≠ RoleAssignment
Run ≠ Attempt ≠ ActionAttempt ≠ Event
StateSnapshot ≠ StateTransition ≠ Checkpoint
TraceRecord ≠ Evaluation ≠ Feedback
```

### 6.4 `adapter-plane`

Adapter 的正确闭环是：

```text
External construct/version → Mapping assertion → Transform
→ Constraint/loss validation → Mapping test → Coverage report
→ Drift detection → Migration/deprecation
```

它应从一级运行域移出，成为正交 mapping layer。

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `adapter-protocols` | 9/4 | 未闭环 | A2A/MCP/FIPA/KQML 名称被固化为类；无版本、方向、等价程度、损失或测试。具体 adapter 改为版本化 `AdapterSpec` 实例；每条映射记录 source QName、target IRI、exact/broader/narrower/lossy、transform 和 conformance result。 |
| `adapter-frameworks` | 9/2 | 未闭环 | 只映射 handoff/trace，Agent/Tool/Memory/Guardrail/State/Result 不完整。迁至独立适配包，框架名为版本化实例，显式记录 unsupported semantics。 |
| `adapter-benchmarks` | 7/1 | 未闭环 | 只有 score→Metric，缺 task/environment/action/observation/artifact/success mapping。迁为 Evaluation profile adapter；补 BenchmarkTask、Environment、Trajectory、Metric、Outcome 和 evaluator mapping。 |
| `adapter-statecharts` | 3/1 | 未闭环 | 只映射 state→Snapshot，缺 transition/event/guard/action/history/final/error。补完整状态机映射和 round-trip 限制；XState/SCXML 为 adapter 实例。 |
| `adapter-schema-export` | 9/1 | 未闭环 | 只把 schema profile 连到 artifact，缺 class/property/constraint/IRI 映射和往返验证。改为 Serialization/Export layer；记录 unsupported/lossy semantics、conversion warning、round-trip test。 |
| `adapter-mapping-infrastructure` | 2/2 | 骨架连通、元模型不足 | `MappingRule` 与 `ConversionWarning` 无法表达复杂映射。新增 MappingSet、MappingAssertion、MappingRun、MappingTestResult、CoverageReport、validity interval 和 supersession。 |

现有 MCP mapping 把 `Resource` 指向 Memory ingestion，A2A mapping 又把 `Artifact` 映成 `ToolResult`，正说明核心概念不稳定会让适配层反向污染本体。应先稳定核心，再重建 adapter。

### 6.5 `tool-plane`

建议的域内闭环是：

```text
Register → Discover → Match/Rank → Policy filter → Select
→ Bind arguments → Authorize → Invoke/Attempt
→ Result/Error/Effect → Health/Feedback
```

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `tool-registry-definition` | 22/14 | 部分闭环 | Capability、Tool、Definition、Schema、Registry、Implementation 边界不清。分成 CapabilityDefinition、ToolSpecification、ToolOperation、ToolImplementation、RegistryEntry；补 provider、endpoint、effect、status、compatibility、deprecation/replacement。 |
| `tool-discovery-selection` | 16/6 | 未闭环 | Tool/Capability/Prompt/Resource 各复制 Candidate/Decision；query→score→rank→decision 不统一。抽象 CandidateSet、MatchAssessment、Ranking、SelectionDecision；连接 capability requirement、policy、permission 和历史评价。 |
| `tool-invocation-execution` | 31/14 | 部分闭环 | 规格、调用、尝试、执行、结果、观察、错误、副作用、审批混杂。严格分为 InvocationSpecification、Invocation、Attempt、Result/Error、Effect；补 actor、run、sandbox、policy、trace、timeout、idempotency、retry 和 compensation。 |
| `tool-mcp-transport` | 14/10 | 局部闭环但错层 | MCP 特有传输进入 Tool 核心，生命周期仍不全。整体迁至 MCP adapter/profile；核心只保留协议中立 Tool/Resource/Prompt capability；补 initialize、capability/version negotiation、request/response/error、notification、subscription、authorization、close。 |

必须固定：

```text
CapabilityDefinition ≠ Skill ≠ ToolDefinition ≠ ToolOperation
ActionDefinition ≠ InvocationSpecification
ToolInvocation ≠ InvocationAttempt ≠ ToolExecution
ToolResult ≠ Observation ≠ Artifact ≠ Outcome
SideEffect ≠ Result；重试必须产生新的 Attempt
```

### 6.6 `safety-plane`

建议的域内闭环是：

```text
Subject/Action/Resource/Context request
→ Policy/Rule evaluation → Allow/Deny/Obligation/Escalate
→ Approval/Grant → Enforcement → Audit/Incident
→ Risk treatment / Policy change proposal
```

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `safety-trust-boundary` | 9/3 | 未闭环 | boundary 类型孤立；缺 zone、crossing object、purpose、actor、authentication 和 time。用限定 `BoundaryCrossing` 连接 source/target zone、actor、data/action、direction、authority、policy decision、trace 和 time。 |
| `safety-permission-policy` | 14/4 | 未闭环 | Rule、Condition、Decision、Grant、Approval、Exception 没有完整链；AuthorityScope/DelegatedAuthority/PermissionScope 断裂。采用 ODRL 风格 Policy→Rule→Evaluation→Decision→Grant/Obligation→Enforcement；补 subject/action/resource/context、issuer、validity、revocation。 |
| `safety-sandbox-network` | 17/3 | 未闭环 | Sandbox、process/filesystem/network policy 和 call 没有组成关系，大量 Proxy/Socket 实现孤立。拆 Sandbox Isolation 与 Network Control profile；补 sandbox contains process/mount/policy、request→call→response/deny、escape finding→decision→audit。 |
| `safety-injection-defense` | 25/5 | 未闭环 | Threat/taint/pollution 术语多但 Scan→Finding→Flow→Risk→Decision→Mitigation→Validation 断裂。重构为 ThreatSignal、DetectionRun、Finding、TaintFlow、Mitigation、Validation；记录 source/sink、payload、confidence、policy 和 rescan。 |
| `safety-commit-redaction` | 13/10 | 局部关系较强但混两条流程 | 副作用提交门与输出脱敏是不同生命周期。拆为 Effect Commitment 和 Disclosure/Redaction；`CommitGate` 改名 `SideEffectCommitGate`，分别补 rollback/audit 与 sensitive span/redacted artifact/recipient。 |

安全不是“所有类都直接连到 Guardian/TrustBoundary”。需要把委托、授权、审批、边界穿越等 n-ary 事实提升为实体，以保存参与方、范围、依据、时间、状态和证据。

### 6.7 `feedback-plane`

建议的域内闭环是：

```text
Outcome/Trace/Artifact → Metric/Evaluation/Review
→ Finding/Diagnosis → Recommendation/Correction
→ New Attempt/Revision → Re-evaluation
→ LearningSignal / ChangeProposal
```

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `feedback-warning-error` | 10/9 | 接近局部闭环 | Signal、Event、Message、FailureMode 混用；缺 cause、affected attempt、severity、resolution、outcome。建立 FailureEvent/FailureMode/DiagnosticRecord 分工，补 causedBy、affects、retryable、resolvedBy。 |
| `feedback-review-optimization` | 12/8 | 部分闭环 | Review→Finding→Feedback→Correction 有骨架，但 reviewer/assignment、被评版本、新版本和再评价缺失。与 orchestration evaluation 合并公共核心；形成旧制品→review→finding→correction→新修订→reevaluation 的不可变链。 |
| `feedback-metrics-evaluation` | 11/5 | 未闭环 | Metric、Score、Criterion、Rubric、Run 缺单位、测量对象、阈值、置信度和来源。分开 MetricDefinition 与 Measurement；EvaluationRun 连接 scenario、subject、rubric、criterion、measurement、evaluator 和 Outcome。 |
| `feedback-logging` | 9/8 | 接近局部闭环 | Stream/subscription/listener/sink/export 已连，但偏实现；缺 actor/run/trace context、schema version、retention、integrity、redaction。保留语义 LogRecord，传输实现下沉 profile。 |

`FeedbackEvent` 位于 Orchestration，`Feedback` 位于 Feedback，两者尚有 carries 边；但 `ReviewEvent` 与 `Review` 都被标成 event 且互不相连，导致 `Artifact→ReviewEvent` 与 `Review→ReviewFinding` 断链。建议统一 Activity/Record 模式：`ReviewActivity generates ReviewRecord`。

### 6.8 `memory-plane`

建议的域内闭环是：

```text
Ingest → Validate/Deduplicate → Chunk/Situate
→ Represent/Index → Retrieve/Rank → Context assembly
→ Use → Feedback → Retain/Expire/Supersede/Delete
```

| 二级模块 | 当前/连通 | 判定 | 主要问题与修改意见 |
|---|---:|---|---|
| `memory-ingestion` | 19/4 | 未闭环 | Resource、filesystem/database/graph store 与 ingestion process 混杂，和 Info Sources 重复。拆 Source Catalog 与 IngestionProcess；补 loader/policy、read→document/metadata/attachment→dedup/validation→memory write→result/error、provenance/boundary。 |
| `memory-stores-scopes` | 20/11 | 部分闭环 | Working/Task/Session/Episodic/Semantic 等重叠维度被当单一类型。只保留 Store、Record、Namespace、Scope、Retention；memory kind、owner scope、purpose、access mode 使用可组合分类/profile。 |
| `memory-chunking-situating` | 11/5 | 未闭环 | ChunkingRun 到 Chunk 有骨架，但 strategy/config、overlap、quality、context note、situating conversion 不全。补 run uses strategy/config/model、chunk boundary/source span/quality、situating run produces situated chunk/context note。 |
| `memory-embedding-indexes` | 17/6 | 未闭环且实现偏重 | TF-IDF、VectorDatabase、GraphEmbedding 等实现进入核心；vector/model/run/entry/version/refresh 未闭合。核心只保留 Representation、Index、IndexVersion、Build/RefreshRun；后端迁 profile；补 represents、generatedBy、builtFrom、supersedes、staleness。 |
| `memory-retrieval-ranking` | 11/8 | 部分闭环 | 主链较好，但 filter、trace、rerank score、模型/索引版本、trust policy 不全。统一 RetrievalRun，完整记录 query、filter、index version、candidate、score model/metric、fusion/rerank、top-k、decision trace、安全过滤。 |
| `memory-context` | 9/7 | 部分闭环 | Assembly/Budget/Ordering/Exclusion/Slot/Summary 局部连通，但与 Info 的 ContextPackage/VisibleWindow 重复。建立唯一不可变 `ContextSnapshot/Package`；assembly 记录输入、slot、ordering、budget、policy、version、consumer。 |
| `memory-lifecycle` | 15/15 | 表面全连通、实质未闭环 | 模块内部边为 0；15 个操作只是分别指向 MemoryRecord 的星型关系，缺 actor、reason、before/after version、policy、result 和 failure。抽象 MemoryOperation；所有更新产生新版本，用 supersession/expiration 标记旧记录，禁止原地变更。 |

Memory 至少需要四个彼此正交的分类维度：

1. 内容性质：episodic / semantic / procedural / evidence；
2. 所有者/范围：working / task / session / agent / shared；
3. 生命周期：candidate / verified / active / stale / expired / superseded / deleted；
4. 表示与访问：text / structured / vector / graph，以及 retrieve/read/write/learn。

不能把这些维度压成互斥的单一 MemoryType 树，也不能把 Session/Checkpoint 直接等同于长期记忆。

## 7. 第三层：概念归类与消歧规则

### 7.1 用上位范畴替代标签猜测

每个 class 必须声明一个经过审查的 upper category：

| 上位范畴 | 判定问题 | 例子 |
|---|---|---|
| Continuant/Entity | 是否可在一段时间内保持身份？ | Actor、ToolDefinition、Artifact、MemoryRecord |
| Role/Disposition/Capability | 是否依赖 bearer 和 context 才存在？ | OrchestratorRole、ReviewerRole、Capability |
| Specification/InformationArtifact | 是否描述应当发生什么或表达内容？ | Plan、Policy、Schema、PromptTemplate |
| Occurrent/Activity/Event | 是否在时间中发生？ | Run、ActionAttempt、ReviewActivity、StateTransition |
| Observation/Record | 是否记录对发生事实的观察或表示？ | ToolResult、TraceEvent、PolicyDecisionRecord |
| Quality/Measurement/Value | 是否依附于对象并可测量？ | Confidence、RiskScore、TokenCount |
| Collection/Structure | 是否组织多个成员？ | CandidateSet、PlanStepGraph、ContextSnapshot |

由此修复诸如 Conversation=event、ConversationTurn=resource、PolicyDecision=policy、CommandExitStatus=action、GenerativeModel=actor 等错型。

### 7.2 标量与值对象规则

下列概念默认应建为 data property 或受控值，而非独立 `resource_type`：

`ConversationId`、`ThreadId`、`TurnIndex`、`TokenCount`、`MimeType`、`Encoding`、`LengthLimit`、`ToolName`、`ToolVersion`、`SourceChecksum`。

只有满足至少一项时才提升为 ValueObject：

- 具有单位、置信度、来源或有效时间；
- 需要跨实体复用身份；
- 有独立生命周期、版本或审批；
- 多字段共同构成不可分语义。

### 7.3 四态分离

所有核心流程对象都应检查四态：

```text
Description/Template → Configuration/Plan → Execution/Event → Result/Evidence
```

例如：

- `TaskDescription → TaskPlan → TaskExecution → TaskResult`；
- `ToolDefinition/Operation → InvocationSpecification → InvocationAttempt → ToolResult`；
- `PolicyDefinition → EvaluationRequest → PolicyDecision → EnforcementRecord`；
- `MetricDefinition → EvaluationPlan → EvaluationRun → Measurement`；
- `MemoryPolicy → MemoryOperationPlan → MemoryOperation → MemoryRecordVersion`。

这条规则可以系统性消除“定义类与运行类同名”“事件与记录混用”的大部分问题。

## 8. 关系与边的重设计

### 8.1 每个关系类型的最低合同

每个 canonical relation 至少需要：

1. 稳定 ID/IRI、首选中英标签和规范逆关系；
2. genus–differentia 定义、包含/不包含说明；
3. domain/range 和最小/最大基数；
4. static/runtime/derived/asserted 等断言性质；
5. symmetric/transitive/reflexive/functional/acyclic 等逻辑性质；
6. 有效时间、事务时间、可变性；
7. assertion provenance、authority、confidence、evidence requirement；
8. `draft→review→active→deprecated→retired` 生命周期；
9. introducedIn、deprecatedIn、supersededBy、owner、source、rationale；
10. 正例、反例、外部映射和 SHACL/JSON Schema 验证规则。

### 8.2 关系族

| 关系族 | 建议关系 |
|---|---|
| 分类/结构 | `subClassOf`、`instanceOf`、`partOf`、`hasPart`、`implements`、`realizes` |
| 目标/规划 | `pursues`、`decomposesInto`、`plannedBy`、`hasStep`、`dependsOn`、`satisfiesCriterion` |
| 角色/委托 | `bearsRole`、`assignedTo`、`delegatedBy`、`delegatedTo`、`actsOnBehalfOf` |
| 能力/调用 | `declaresCapability`、`requiresCapability`、`selects`、`invokes`、`attempts`、`uses` |
| 运行/状态 | `performedBy`、`triggeredBy`、`transitionsFrom`、`transitionsTo`、`causedBy`、`emits` |
| 结果/评价 | `generates`、`producesResult`、`producesArtifact`、`evaluates`、`measures`、`achievesOutcome` |
| 治理/安全 | `constrainedBy`、`requiresPermission`、`decidedBy`、`approvedBy`、`enforcedBy`、`crossesBoundary` |
| 溯源/版本 | `used`、`wasGeneratedBy`、`wasDerivedFrom`、`wasAttributedTo`、`wasRevisionOf`、`supersedes` |
| 适配 | `exactMappingTo`、`broaderMappingTo`、`narrowerMappingTo`、`lossyMappingTo`、`supersedesMapping` |

### 8.3 必须实体化的限定关系

简单二元边无法承载参与方、时间、范围和证据时，应提升为实体：

| 限定实体 | 必需角色/属性 |
|---|---|
| `Delegation` | delegator、delegatee、performer、task、scope、authority basis、budget、valid time、status |
| `PermissionDecision` | policy/rule、subject、action、resource、context、decision、reason、issuer、validity |
| `Invocation` | caller、operation、argument binding、attempt、runtime、boundary、authorization、result/effect |
| `BoundaryCrossing` | source zone、target zone、actor、payload/action、direction、protocol、purpose、decision、trace |
| `StateTransition` | from/to state、trigger、guard、action、actor、time、run、outcome |
| `Evaluation` | evaluator、subject、criterion/rubric、evidence、measurement、confidence、decision |
| `ProvenanceQualification` | entity/activity/agent、role、plan、time、source selector、attribution |
| `MappingAssertion` | source/target construct、versions、direction、mapping kind、transform、loss、test result |

这也落实 RFC 0002 对跨边界关系的要求，而不是让 `MemoryUpdate→TrustBoundary` 这样的直接边绕过语境。

## 9. TBox、ABox、Shapes 与治理图的分工

| 工件 | 保存什么 | 不应保存什么 |
|---|---|---|
| Core/Profile TBox | 类型、关系、定义、形式公理、imports、语义注解 | 某次具体工具调用和日志 |
| Adapter graph | 外部术语到核心的版本化映射、转换和损失 | 核心概念的唯一权威定义 |
| SHACL shapes | 必填、基数、路径、状态转换、跨字段闭环约束 | 开放世界语义的全部推理 |
| JSON Schema | canonical artifact 和 API 交换结构 | `is-a` 的领域语义 |
| Runtime ABox | 具体 Agent/Run/Attempt/Message/Result/Artifact/Decision | plane/module 等工程元数据个体 |
| Governance graph | release、proposal、review、source claim、owner、maturity、migration | Agent 运行中的业务事实 |
| Views/docs | 面向角色的投影、解释、主案例、图形 | 复制并成为第二真相源 |

建议最少生成五个发布工件：

```text
core.ttl / profiles/*.ttl
shapes/*.ttl
agent-ontology.schema.json
adapter-mappings/*.jsonld
fixtures/software-defect-agent/*.jsonld
```

canonical source 必须可以从干净 checkout 重建全部工件；生成器不得把上一轮生成产物吞回作为源。

## 10. 定义、解释、正反例与多语质量

### 10.1 每个术语的统一模板

每个发布级术语至少包含：

1. stable ID/IRI、中文名、英文名、日文名、同义词和弃用别名；
2. `上位概念 + 区分特征` 的一句话定义；
3. canonical owner、Core/Profile/Adapter disposition、upper category；
4. 包含范围和明确的“不包含什么”；
5. 它回答的 competency questions；
6. identity rule、必要属性、状态和生命周期；
7. 关键入边、出边、逆关系和基数；
8. 权限、风险和信任边界；
9. source claim、证据段落、维护者、状态、版本和变更记录；
10. 主案例中的正例；
11. 易混淆反例；
12. 外部框架映射、映射方向和语义损失；
13. 对应 SHACL/JSON Schema/fixture 断言。

### 10.2 示例：`ToolInvocation`

**建议定义：** 在特定 Run 中，由一个 Actor 按某个 InvocationSpecification 对恰好一个 ToolOperation 发起的一次调用活动；它具有参数绑定、授权上下文、执行环境和唯一身份，并产生一个或多个 Attempt。

**包含：** caller、operation、arguments、run、policy decision、boundary、start time、attempts。
**不包含：** Tool 的静态定义、调用结果、业务 Outcome、私有思维链。

**正例：** 修复 Agent 在 Run `run-42` 中调用 `git.diff` operation，传入 repo 和 revision 参数，经只读策略批准后产生 `attempt-1`。
**反例：** “Git 工具支持 diff”是 Capability/ToolDefinition；“diff 返回三个文件”是 ToolResult；“补丁修复了缺陷”是 Outcome。

### 10.3 示例：限定关系 `Delegation`

```json
{
  "id": "delegation-17",
  "delegator": "orchestrator-actor-1",
  "delegatee": "worker-actor-3",
  "performer": "worker-actor-3",
  "task": "task-instance-write-test",
  "authority_basis": "permission-grant-8",
  "scope": ["tests/**"],
  "budget": {"tool_calls": 12},
  "valid_from": "2026-07-13T06:30:00Z",
  "status": "accepted",
  "source_run": "run-42"
}
```

简单的 `AgentA delegates TaskB to AgentC` 无法表达上述范围、授权、预算和时间，因此不满足生产要求。

### 10.4 多语质量门禁

当前“字段非空且与 ledger 相同”的测试只能证明复制一致，不能证明翻译正确。建议：

- 定义源以一门 canonical language 和一条 claim ID 为主，其他语言各自有 reviewer/status；
- 自动检查跨语言中的专名、否定词、上位概念、枚举和引用 ID 是否一致；
- 检测跨术语的异常相同正文、错误语言字符和目标域关键词漂移；
- Core 和 P0 关系必须至少一名领域 reviewer 人工通过；
- 翻译变更独立版本化，不能因为英文不变就跳过审查；
- examples/counterexamples 同样需要多语语义对齐，不只翻译 label。

## 11. 贯穿主案例：软件缺陷修复 Agent

按照会议“只选一个复杂主案例并贯穿全工程”的要求，建议使用软件缺陷修复 Agent。它同时覆盖信息、计划、工具、安全、运行、反馈、记忆和治理，比多个彼此割裂的小例子更能暴露断链。

### 11.1 实例流程

```text
1. UserActor 发出 Message，承载 DefectReport
2. Ingress 解析来源并形成不可变 ContextSnapshot v1
3. AgentActor 采纳 Objective：“修复缺陷且不破坏既有行为”
4. Objective 产生 Intent、SuccessCriteria 和 Plan v1
5. Plan 分解为 reproduce / write-test / patch / verify 四个 TaskInstance
6. OrchestratorRole 通过 Delegation 把任务分给 WorkerRole
7. PolicyDecision 授权读取仓库，限制写入路径，并要求执行测试前审批
8. ToolInvocation 读取文件；ActionAttempt 产生 Observation/TraceEvent
9. 首次 TestAttempt 失败，产生 TestResult、FailureEvent 和诊断 Evidence
10. PlanRevision v2 基于证据更改修复步骤，不覆盖 Plan v1
11. PatchAttempt 产生 PatchArtifact；副作用经 SideEffectCommitGate 批准
12. VerificationRun 产生 TestResult 和 Measurement
13. Evaluation 判断 Result 满足 SuccessCriteria，形成 Outcome 和 GoalStatus
14. ReviewActivity 产生 ReviewFinding；若失败则触发 Correction/Replan
15. MemoryWrite 保存经验证的知识和 provenance；旧记录按版本失效
16. TerminationEvent 关闭 Task/Goal，并生成可审计 RunSummary
```

### 11.2 主案例与当前 view 的映射

| View | 主案例中的对象/活动 | 必须交给其他域的接口 |
|---|---|---|
| Info | Message、DefectReport、SourceReference、Context projection、Disclosure | ContextSnapshot 交给 Orchestration/Runtime；披露请求交 Safety |
| Orchestration | Objective、Intent、PlanRevision、Task、Delegation、StopCondition | Task/assignment 交 Runtime；capability requirement 交 Tool |
| Runtime | Run、Attempt、ActorInstance、StateTransition、Trace、Artifact | 原始事实交 Evaluation；checkpoint 可被恢复但不等于 Memory |
| Tool | ToolOperation、SelectionDecision、Invocation、Result、Effect | 权限请求交 Safety；Result/Observation 交 Runtime/Context |
| Safety | PolicyRequest、Decision、Grant、BoundaryCrossing、Approval、Audit | enforcement outcome 回 Runtime；incident 回 Feedback |
| Feedback | EvalRun、Measurement、ReviewFinding、Correction、LearningSignal | plan/tool/policy/memory change 只能形成提案，不能无治理地直接改定义 |
| Memory | Ingestion、MemoryRecordVersion、RetrievalRun、ContextAssembly、Expiration | versioned ContextSnapshot 交 Runtime；usage/provenance 回写 |
| Adapter | MCP/A2A/OpenAI/LangGraph 等外部构件映射 | 只映射，不拥有核心事实 |

### 11.3 主案例必须回答的 competency questions

CQ 应具有稳定 ID、自然语言、预期查询、fixture 和 pass/fail oracle。建议的最小集合：

| ID | 问题 | 预期证据路径 |
|---|---|---|
| CQ-01 | 哪个 Objective 触发了这个 Run，成功标准是什么？ | Run→realizes Task→supports Goal/Objective→criterion |
| CQ-02 | 哪个 Agent 定义、运行实例、角色和模型版本生成了补丁？ | Artifact→wasGeneratedBy Attempt→performedBy Actor→definition/role/model binding |
| CQ-03 | 哪次 ActionAttempt 失败，重试是否复用了副作用？ | Invocation→attempts→error/effect/idempotency/retry |
| CQ-04 | 哪个 PolicyDecision 授权写文件，范围和有效期是什么？ | Attempt→permission decision→rule/subject/action/resource/context/validity |
| CQ-05 | 这次调用穿越了什么 TrustBoundary，使用哪个协议版本？ | Invocation→BoundaryCrossing→zones/protocol/authentication |
| CQ-06 | 补丁是 Artifact、测试输出是 Result、修复成功是 Outcome，三者如何关联？ | Attempt→Artifact/Result→Evaluation→Outcome |
| CQ-07 | 哪个 ContextSnapshot 被模型/Agent 使用，包含哪些来源版本？ | ModelInvocation→used Context→assembledFrom Source/Memory versions |
| CQ-08 | 哪条 Memory 影响决策，源代码更新后是否失效？ | PlanRevision→informedBy MemoryRecord→validity/supersession |
| CQ-09 | 哪些 Claim 是观测事实、推导、猜测或已验证事实？ | Claim→epistemic status/provenance/evaluation |
| CQ-10 | 谁把任务委托给谁，是否超出授权和预算？ | Delegation→participants/task/scope/authority/budget/usage |
| CQ-11 | Review 针对哪个 Artifact 版本，Finding 产生了哪个修订？ | ReviewActivity→used Artifact vN→Finding→Correction→Artifact vN+1 |
| CQ-12 | 为什么流程停止：成功、预算耗尽、拒绝、取消还是不可恢复失败？ | Goal/Task→TerminationEvent→reason/evidence |
| CQ-13 | 这个外部 MCP Tool 如何映射到核心 ToolOperation，映射是否有损？ | AdapterSpec→MappingAssertion→version/loss/test |
| CQ-14 | 本体术语本身由哪些来源和提案支持，何时生效？ | Term→SourceClaim/Proposal/Review/Release |
| CQ-15 | 是否存在已完成但没有 Result/termination reason 的 Task？ | SHACL/query negative fixture |

## 12. 可执行约束与验证体系

### 12.1 建议的 SHACL 约束

1. 每个 `TaskExecution` 至少 `realizes` 一个 `TaskDefinition`；
2. 每个 `ToolInvocation` 恰好调用一个 `ToolOperation`，且有 caller、run、argument binding、result 或 error；
3. 每个 retry 都产生新的 Attempt ID，并明确 `retryOf`；
4. 每个 `Delegation` 具有 delegator、delegatee、task、scope 和 authority/policy basis；
5. 每个外部调用或消息声明所跨 TrustBoundary、协议版本和认证上下文；
6. 每个 Artifact、Claim、Reflection、PlanRevision 具有生成活动和来源；
7. 每个 MemoryWrite 记录来源、写入动作、访问范围、taint/integrity、retention 和新版本；
8. 每个 PolicyDecision 可追到 policy/rule、subject、action、resource、context 和 enforcement outcome；
9. 完成状态 Task 具有 Result/Outcome 或明确的无结果终止原因；
10. 标记为 verified 的派生 Claim 必须具有 evidence 和 Evaluation；
11. EvalRun 记录 benchmark/version、task、agent configuration、environment、evaluator 和结果；
12. Adapter mapping 记录 source/target version、direction、mapping kind 和 test result。

### 12.2 结构和语义门禁

| 门禁 | 失败条件 | 严重性 |
|---|---|---|
| Canonical JSON Schema | canonical artifact 自身不通过 Schema | Blocker |
| Referential integrity | 任一 class/property/individual/mapping 引用悬空 | Blocker |
| Ownership | 同一术语多 owner 或 owner 与 module/plane 清单不一致 | Blocker |
| Type DAG | released Core class 无上位类、出现非法环或违反 disjointness | Blocker |
| Relation contract | Core relation 缺 domain/range/inverse/cardinality/definition | Blocker |
| Main lifecycle | CQ-01 至 CQ-15 任一核心路径失败 | Blocker |
| ABox conformance | 正例 fixture 不通过、反例 fixture 意外通过 | Blocker |
| Source claim | Core 定义无可定位一手来源或明确设计推论 | Blocker |
| Multilingual review | 中文/日文错语种、串义或未审查 | Major |
| Connectivity | released Core 类未参与任何 CQ、关系或例子 | Major/Blocker 由 owner 裁决 |
| Adapter drift | 外部版本更新后 mapping test 失败 | Major，不阻塞无关 Core release |
| Documentation drift | 指标、树和文档不是从同一源生成 | Blocker |

### 12.3 测试层次

- **Unit**：ID、IRI、enum、definition、inverse、cardinality、owner、source claim；
- **Integration**：OWL reasoning、SHACL validation、JSON Schema、mapping transform、生成器可重复性；
- **End-to-end**：软件缺陷修复 fixture 的 15 个 CQ；
- **Mutation/negative**：删掉 permission、source、result、version 或 boundary 时，必须触发预期 shape；
- **Regression**：定义账本、source registry、Markdown、Graph IR、前端只由 canonical source 生成；
- **Coverage**：不只统计代码行；还统计 Core class/relationship/CQ/example/shape 的语义覆盖，目标至少 80%。

## 13. 2022–2026 研究与官方工程证据矩阵

### 13.1 Agent 架构、推理、规划与记忆

| 一手来源 | 来源事实摘要 | 对本体的直接设计推论 |
|---|---|---|
| [ReAct, ICLR 2023](https://openreview.net/forum?id=WE_vluYUL-X) | 推理与面向环境的动作交替，动作产生观察 | 显式 `ActionAttempt→Observation→Decision` 循环；私有思维链不作为必需事实 |
| [Reflexion, NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html) | 将反馈转成反思并写入情景记忆供后续试次使用 | Reflection 是有来源的派生信息；连接 Trial、Feedback、Trajectory、Memory、LaterTrial |
| [CoALA, TMLR 2024](https://openreview.net/pdf?id=1i6ZCvflQJ) | 区分 working/episodic/semantic/procedural memory、动作空间和决策过程 | 分开 MemoryType、MemoryOperation、internal/external action 和 access mode |
| [Voyager, 2023](https://arxiv.org/abs/2305.16291) | 自动课程、代码技能库、环境反馈和自验证 | Skill 需要 candidate→validated→active/deprecated 生命周期及 composition/provenance |
| [Generative Agents, UIST 2023](https://dl.acm.org/doi/10.1145/3586183.3606763) | 记忆流、相关性/近因性/重要性检索、反思和计划 | 分开 MemoryRecord、RetrievalRun/Score、Reflection、Plan，并保留 derivedFrom |
| [Toolformer, NeurIPS 2023](https://proceedings.neurips.cc/paper_files/paper/2023/hash/d842425e4bf79ba039352da0f658a906-Abstract-Conference.html) | 学习选择 API、时机、参数和使用结果 | 分开 ToolDefinition、Operation、SelectionDecision、ArgumentBinding、Invocation、Result |
| [LATS, ICML 2024](https://proceedings.mlr.press/v235/zhou24r.html) | MCTS、价值估计、反思和反馈联合规划 | Plan 不能只允许线性列表；SearchRun/StateNode/CandidateAction/ValueEstimate 为可选 profile |
| [AutoGen, COLM 2024](https://www.microsoft.com/en-us/research/publication/autogen-enabling-next-gen-llm-applications-via-multi-agent-conversation-framework/) | 对话 Agent 可组合 LLM、人类和工具 | Agent 不等于 LLM；分开 Actor、Role、Capability、RuntimeInstance、ModelBackend |
| [Magentic-One, 2024](https://www.microsoft.com/en-us/research/publication/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/) | 任务/进度账本，区分验证事实、待查、推导和猜测，检测停滞并重规划 | 引入 TaskLedger、Claim/EpistemicStatus、StallDetection、ReplanningEvent |
| [MetaGPT, ICLR 2024](https://proceedings.iclr.cc/paper_files/paper/2024/hash/6507b115562bb0a305f1958ccc87355a-Abstract-Conference.html) | SOP、角色协作和中间产物 | 区分 ProcedureTemplate 与执行，加入 Phase、RoleAssignment、VerificationGate |
| [AgentNet, NeurIPS 2025](https://proceedings.neurips.cc/paper_files/paper/2025/hash/9a379c1b05793d1c42dc832269834515-Abstract-Conference.html) | 动态演化、去中心化 DAG 和路由 | OrchestrationTopology 是版本化实体；支持 centralized/decentralized/hybrid profile |
| [Multi-Agent Failure Benchmark, NeurIPS 2025](https://proceedings.neurips.cc/paper_files/paper/2025/hash/b1041e52d3be19f0a9bc491657488e4a-Abstract-Datasets_and_Benchmarks_Track.html) | 从多框架轨迹归纳系统、交互、验证等故障 | FailureEvent/Mode 需定位 component、interaction、stage、cause、impact、recovery |
| [OASIS 2, 2023](https://arxiv.org/abs/2306.10061) / [W3C Community](https://www.w3.org/community/oasis/oasis-version-2/) | Agent→Behaviour→GoalDescription→TaskDescription，并区分模板、规划、执行和委托角色 | 为跨 plane 的 Goal/Task/Plan/Entrustment/Execution/CommitmentStatus 骨架提供直接依据 |

### 13.2 协议、身份、政策与语义标准

| 一手来源 | 对 Moonweave 的用途 |
|---|---|
| [MCP 规范 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18) | Host/Client/Server、能力协商、Tool/Resource/Prompt、授权和生命周期映射；MCP 是 adapter，不是完整 Agent ontology |
| [A2A 最新规范](https://a2a-protocol.org/latest/specification/) | AgentCard、Message、Task/TaskState、Artifact、stream/update/security；外部 Task 不等于内部 TaskPlan |
| [DID Core 1.0, W3C Recommendation 2022](https://www.w3.org/TR/did-core/) | AgentIdentity、verification method、service endpoint、rotation/revocation 的可选 profile |
| [Verifiable Credentials 2.0, W3C Recommendation 2025](https://www.w3.org/TR/vc-data-model-2.0/) | capability/role/delegation credential 的 issuer、subject、proof、expiry、status |
| [ODRL 2.2](https://www.w3.org/TR/odrl-model/) | Permission、Prohibition、Duty、Constraint、Consequence/Remedy；Safety 不能化约为 `allowed:boolean` |
| [PROV-O](https://www.w3.org/TR/prov-o/) | Entity/Activity/Agent 和限定 provenance，为运行轨迹、制品、反思、计划修订提供映射 |
| [SOSA/SSN](https://www.w3.org/TR/vocab-ssn/) | Sensor/Observation、Actuator/Actuation、Procedure/Result；支持事件中心的感知与动作模式 |
| [DCAT 3, W3C Recommendation 2024](https://www.w3.org/TR/vocab-dcat-3/) | 逻辑资产、Distribution、DataService、版本链和 checksum 分离，用于工具/模型/数据/benchmark 目录 |
| [DPV 2.0, 2024](https://www.w3.org/community/reports/dpvcg/CG-FINAL-dpv-20240801/) | 隐私作为跨 data flow/action 的 profile：purpose、legal basis、jurisdiction、recipient、retention |

### 13.3 安全、治理与评测

| 一手来源 | 对 Moonweave 的用途 |
|---|---|
| [NIST AI RMF 1.0, 2023](https://doi.org/10.6028/NIST.AI.100-1) / [GenAI Profile, 2024](https://doi.org/10.6028/NIST.AI.600-1) | `Govern→Map→Measure→Manage`；建立 Risk→Assessment→Control→Treatment→ResidualRisk→Review |
| [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) | 组织级 AI management system、audit、corrective action 和持续改进应作为治理 profile，不与单次 Run 混层 |
| [OWASP Agentic Top 10 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/) | 目标劫持、工具滥用、身份权限、供应链、代码执行、记忆污染、Agent 通信和级联故障的跨域 threat model |
| [AgentBench, ICLR 2024](https://proceedings.iclr.cc/paper_files/paper/2024/hash/e9df36b21ff4ee211a8b71ee8b7e9f57-Abstract-Conference.html) | `Benchmark→Environment→TaskInstance→EvalRun→Trajectory→MetricResult` 统一评测骨架 |
| [OSWorld, NeurIPS 2024](https://papers.nips.cc/paper_files/paper/2024/hash/5d413e48f84dc61244b6be550f1cd8f5-Abstract-Datasets_and_Benchmarks_Track.html) | EnvironmentSnapshot、setup、side effect、evaluator artifact 和最终状态断言 |
| [τ-bench, ICLR 2025](https://openreview.net/pdf?id=roNSXZpUDN) | Initial/Goal/ObservedFinalState、PolicySet、UserSimulator、TrialGroup 和 pass^k reliability |
| [AgentDojo, NeurIPS 2024](https://proceedings.neurips.cc/paper_files/paper/2024/hash/97091a5177d8dc64b1da8bf3e1f6fb54-Abstract-Datasets_and_Benchmarks_Track.html) | 把 benign task、注入源/载荷、攻击目标、安全属性、防御和轨迹连成 SecurityEvalCase |
| [ToolEmu, ICLR 2024](https://proceedings.iclr.cc/paper_files/paper/2024/hash/7274ed909a312d4d869cc328ad1c5f04-Abstract-Conference.html) | 区分 Real/EmulatedEnvironment，记录 emulator、evaluator、risk scenario 和 validity evidence |

### 13.4 官方框架与开源项目只作为映射验证

- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)：区分 Agent definition、Runner/Run、Tool、Handoff、Agent-as-tool、Session、Guardrail、Trace/Span；尤其验证 Handoff 与 tool invocation 不同。
- [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview)：State、Node、Edge、Thread、Checkpoint、Interrupt、Store；验证 checkpoint/replay/approval/幂等，但 Checkpoint 不等于 Memory。
- [AutoGen](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/framework/message-and-communication.html)：direct messaging 与 pub/sub、team/runtime；验证消息和团队 profile。
- [Semantic Kernel Process](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/process/process-core-components)：Process/Step/Event/State、pause/resume/nesting；验证确定性 workflow 与自治 Agent 分离。
- [CrewAI](https://docs.crewai.com/)：Crew 与 Flow、Agent/Role/Goal/Task、guardrail 和 persistence；验证自治协作与确定性流程是不同 profile。

这些框架的 API 类变化快，只应用来验证核心可映射性，不应成为 core class 的命名来源。

## 14. 分阶段修改路线与验收标准

### 14.1 P0：修复规范根与全局闭环

1. 将 `canonical-phase-1` 改为历史里程碑或审计中状态，暂停其“生产冻结”含义；
2. 定义真正覆盖 canonical source 的 JSON Schema，并让 canonical JSON 自身接受验证；
3. 将手工源拆成模块化 source manifests，禁止生成器读取上一轮生成物作为源；
4. 删除 95 条自动 module 伪边、82 条 module data property、49 个 plane/module 伪 individual；
5. 修复 80/80 individual 类型、`InstructionConflict` 所有权、重复 arrays 和非 class 端点；
6. 引入 Core/Profile/Adapter disposition、稳定 IRI/import/version/maturity/owner/review status；
7. 建立最小上位类型 DAG，优先 Actor、Role、Capability、InformationArtifact、Process/Event、Action、Observation、Decision、State、Policy、Evidence；
8. 补齐 Objective/Intent/Plan/Task/ModelInvocation/ActionAttempt/Observation/Result/Artifact/Outcome/Evaluation/MemoryUpdate 主链；
9. 以 BoundaryCrossing、Delegation、Invocation、PolicyDecision、Evaluation 为限定关系；
10. 建立软件缺陷修复正反 fixture 和 CQ-01 至 CQ-15 的 executable gates。

**P0 验收：** canonical source 单一、可重建；所有引用解析；主案例闭环；released Core class 具有上位类、定义、来源、例子和至少一个 CQ；无 Blocker shape violation。

### 14.2 P1：逐域修复职责闭环

建议顺序不是按 plane 编号，而是按主执行链：

```text
Runtime identity/state
→ Orchestration goal/task/plan/delegation
→ Tool definition/selection/invocation
→ Safety decision/enforcement/boundary
→ Result/artifact/outcome
→ Feedback/evaluation/revision
→ Memory/context/version lifecycle
→ Info projection/disclosure
```

P1 还包括：

- 统一 Reference/Referent、Actor/Role、Activity/Record、Decision/Outcome、Definition/Execution；
- 合并 Orchestration evaluation 与 Feedback evaluation 的公共核心；
- 合并 Info indexing 与 Memory retrieval 的通用查询/候选/排名模式；
- 从 core 移出 TF-IDF/vector backend、Proxy/Socket、具体框架/benchmark 类；
- 为 41 个模块分别写 scope、CQ、input/output contract、failure/recovery 和 imports；
- 人工重审中日定义，补齐正例、反例和易混淆项。

**P1 验收：** 每个模块所有 CQ 可在主 fixture 或模块 fixture 上运行；没有未解释的兄弟重叠；每个流程模块有失败、取消、重试/补偿或明确声明不适用。

### 14.3 P2：适配、导出和高级 profiles

- 把 MCP、A2A、FIPA、OpenAI、LangGraph、AutoGen、CrewAI、benchmark、XState/SCXML 建成版本化 adapter packages；
- 每个 mapping 记录 exact/broader/narrower/lossy、transform、constraint preservation 和 test result；
- 生成 OWL/JSON-LD、SHACL、JSON Schema、Graph IR、Markdown 和前端数据；
- 建 Planning topology、Memory architecture、Risk/privacy、Evaluation、Embodiment 等 profiles；
- 引入 ontology branch/proposal/rebase/migration/deprecation 流程；
- 建 adapter drift、round-trip、source-ledger、多语和 CQ coverage dashboard。

**P2 验收：** 任一框架版本升级只导致对应 adapter/profile 测试变化，不迫使 core 重新定义；所有发布工件可由单一源确定性生成。

### 14.4 建议的仓库结构

```text
ontology/
  source/
    product.*
    core/
    profiles/
    adapters/
    governance/
  generated/
    agent-ontology.json
    agent-ontology.jsonld
    agent-ontology.ttl
    shapes/
    schemas/
  fixtures/
    software-defect-agent/
research/
  source-registry.*
  source-claims/
docs/
  professional/
  readable/
  case-study/
```

具体格式可在实现 RFC 中决定；关键是不再让 generated JSON 反过来充当 source。

## 15. 需要保留的现有资产与明确非目标

### 15.1 应保留

- 稳定 ID、唯一 label、较丰富的来源登记和 Phase 0 研究笔记；
- Hidden Chain-of-Thought 不进入 subject ontology 的原则；
- Runtime trace/checkpoint、Tool MCP、Memory retrieval/lifecycle、Feedback logging/review 的局部种子；
- 三语展示目标，但需重新建立语义审查；
- 图谱浏览器作为 view，不作为独立真相源；
- 现有 572 术语作为迁移候选池，逐个 keep/merge/split/move/deprecate，不建议全部推倒。

### 15.2 非目标

- 不复制 Palantir、Fabric、OpenAI、LangGraph 或任何单一框架的 API 类树；
- 不把所有工程约束强塞进 OWL；开放世界推理和闭世界验证分工；
- 不保存或要求暴露私有思维链；只建模可观察动作、决策记录、证据和必要解释；
- 不把 embodiment、情感、VRM、机器人控制立即塞进 core；先以可选 profile 扩展稳定的 Actor/Action/Observation/State 核心；
- 不为“类数更多、边数更多”优化；发布指标转向 CQ coverage、shape conformance、可追溯性和 mapping quality；
- 不允许学习信号直接无治理地修改 Policy/Core ontology；只能形成 ChangeProposal，经审查和版本化生效。

## 16. 本报告的最终判断

当前 Moonweave Agent Ontology 的优势是**资料资产、覆盖广度和局部工程语义**；短板是**最高层分类、形式逻辑、跨域主链、限定关系、实例验证和生成治理**。

最合理的演进策略不是继续在八个 plane 中扩充术语，也不是全部重做，而是：

> **保留术语和证据资产，重建语义骨架；保留八域为视图，建立真正核心类型 DAG；分开定义、运行、治理和适配；以一个可执行主案例和 competency questions 驱动逐层闭环。**

当 P0 验收条件全部满足后，Moonweave 才适合重新声明新的 canonical release；当 41 个模块逐个通过职责闭环门禁、外部框架只通过 adapter 接入、主案例能回答全部 CQ 时，才真正接近 FIBO 式的生产级本体工程，而不只是一个大型术语目录。

## 附录 A：本地证据入口

- [Canonical ontology](../ontology/agent-ontology.json)
- [Canonical 说明文档](../ontology/agent-ontology.md)
- [多语定义账本](../ontology/agent-ontology-definitions.json)
- [当前生成器](../scripts/expand-agent-ontology.mjs)
- [当前 GraphView Schema](../schemas/agent-ontology.schema.json)
- [Ontology artifact tests](../tests/ontology-artifact.test.ts)
- [Schema validation tests](../tests/schema-validation.test.ts)
- [RFC 0001：Ontology layers](../docs/rfcs/0001-ontology-layers.md)
- [RFC 0002：Canonical schema contract](../docs/rfcs/0002-canonical-schema-contract.md)
- [RFC 0003：Statechart and protocol](../docs/rfcs/0003-statechart-and-protocol-model.md)
- [RFC 0004：Phase 1 workplan](../docs/rfcs/0004-phase-1-schema-workplan.md)
- [Phase 1 freeze note](source-notes/phase-1-completion-ontology-system-freeze.md)
- [Source registry](source-registry.csv)
- [FIBO alignment review](source-notes/fibo-alignment-review.md)

## 附录 B：建议的发布决策记录

| 决策 | 建议状态 | 理由 |
|---|---|---|
| 八 plane 是否继续作为第一层 `is-a` 分类 | Reject | 混合对象、过程、规范、信息和适配，无法互斥完备 |
| 八 plane 是否保留 | Accept as views | 工程导航和职责查询仍有价值 |
| Adapter 是否与 Runtime/Tool 平级 | Reject | RFC 已将其定义为正交 ownership/membrane |
| 是否继续手改 canonical JSON | Reject | 生成器会重新吸收和复制缺陷 |
| 是否采用单一工具/框架术语作为核心 | Reject | 版本快变且语义不完整 |
| 是否采用 Core/Profile/Adapter + TBox/ABox/Governance 分层 | Accept | 同时吸收 FIBO、W3C、Palantir、Fabric 和 Agent runtime 的互补优势 |
| 是否以 CQ 和主案例作为发布门禁 | Accept | 将“看起来完整”变成可执行验收 |
| 是否立即扩展情感/具身/VRM | Defer to profile | 核心 Agent 循环尚未闭合，先稳定可复用骨架 |
