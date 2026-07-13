# Moonweave Agent Ontology 层级闭环与本体设计审计报告（中文完整版）

> **方向修订说明（2026-07-13）：** 本报告的量化诊断和逐模块缺口仍有效；关于将八个 Domain 降为 views、将 Adapter 移出一级结构、以及以 TBox/ABox/Governance 拆分用户呈现的建议，已由 `docs/design/agent-ontology-unified-graph-upgrade-plan-zh.md` 修订和取代。

> **读数说明（2026-07-13）：** 第 0.1 节评级及第 2 节数字是冻结的 v1 审计基线，用于证明迁移前缺陷。第 0.2 节记录已经通过原子发布门禁的 v2 正式产物；正式规模只读取根 `ontology/agent-ontology.json` 的 `ontology_metrics`，不再引用 candidate 或手工统计。

> 报告日期：2026-07-13
> 审计对象：`ontology/agent-ontology.json` 及其定义账本、生成器、Schema、测试、RFC 和研究资料
> 当前分支：`chore/agent-ontology-audit`
> 基线提交：`6c01220`（与审计时 `origin/main` 一致）
> 证据截止：2026-07-13
> 报告性质：架构与本体工程审计、修改建议；**本报告不直接改写规范本体**

## 0. 结论先行

当前八个一级领域、其下模块以及中心辐射式图谱呈现，已经构成合理的 FIBO 式组织与浏览骨架。当前问题不在于必须另建一套核心类型树，而在于各模块内部缺少由抽象概念向具体概念逐层展开的真实逻辑链，跨节点关系合同过薄，且定义、实例、结构约束、来源和案例尚未充分附着到对应节点和边上。

本轮升级保留 `Agent Ontology → Domain → Module → Concept` 的统一图谱，补齐 Concept 内部的多层专业化结构；Schema、实例、案例、来源、治理和外部映射均作为节点或边的信息呈现。机器验证工件从同一 canonical 图谱生成，但不成为另一套页面或本体结构。

因此，本报告后续所说的“职责分开”，统一解释为**同一节点或边内部的信息字段、验证职责和生成职责清楚分工**，而不是拆出 TBox、ABox、Schema、Instance、Evidence、Governance 或 Case 页面。`Core/Profile/Adapter` 只作为适用范围和所有权注解；八个 Domain（包括 `adapter-plane`）均保留一级地位。

### 0.1 v1 基线审计评级（历史）

以下为本报告在冻结 v1 基线上使用的 0–4 工程审计量表，不是外部标准认证：0=缺失，1=有片段，2=局部可用，3=系统化，4=可发布且可执行验证。它保留为迁移证据，不代表当前 v2 release 的评级。

| 维度 | v1 基线评级 | 核心依据 |
|---|---:|---|
| 信息架构与一级呈现 | 3/4 | 中心节点、八个一级 Domain 与其 Module 已形成合理浏览骨架；仍需统一数据合同和可验证的 root path |
| 模块内概念专业化层级 | 0/4 | 572 个 Concept 没有一条实际 `is_a` 断言，Module 内仍是平铺词表 |
| 类型层级与逻辑表达 | 0/4 | 572 个类没有一条实际 `subClassOf/is_a` 断言，也没有 disjoint、inverse、cardinality |
| 全局 Agent 生命周期闭环 | 1/4 | 有局部边，但缺 `Intent/Action/Observation/Plan` 等锚点和明确主执行链 |
| 一级域与二级模块职责 | 2/4 | 41 个模块覆盖面广；大量模块缺输入—转换—输出—失败恢复闭环，且跨域重叠 |
| 关系与边合同 | 1/4 | 有 domain/range 和来源；缺基数、逆关系、时态、限定关系、成熟度、正反例 |
| 节点内案例、结构约束与查询验证 | 1/4 | 有测试与字符串型 axiom；案例、字段、约束和 CQ 尚未有效附着到 canonical 节点/边，80/80 legacy individual 类型悬空 |
| 来源与变更治理 | 3/4 | 361 条来源登记、多语账本、RFC 和测试基础较好；仍有定义串义、来源漂移和双真相源 |
| 解释、案例与可读性 | 1/4 | 多语字段覆盖高，但正例、反例、competency question 为零，且存在明显错译/串义 |

### 0.2 v2 正式发布可复核快照

正式产物位于 `ontology/agent-ontology.json`。数量直接读取其中由 builder 生成的 `ontology_metrics`，不得从 Markdown、旧集合或 UI 卡片反推。该产物具有 `artifact_metadata.release_channel=release`、`releasable=true`，并与根 Schema、生成类型、fixture、Markdown 和 source index 在同一事务内发布。

以下为 2026-07-13 原子发布后的唯一正式读数：

| 指标 | 2026-07-13 v2 release | 核验口径 |
|---|---:|---|
| Domain | 8 | `ontology_metrics.domains` |
| Module | 41 | `ontology_metrics.modules` |
| Concept | 622 | `ontology_metrics.concepts` |
| taxonomy root | 239 | `ontology_metrics.taxonomy_roots` |
| `is_a` relation | 385 | `ontology_metrics.is_a_relations` |
| semantic relation | 540 | `ontology_metrics.semantic_relations` |
| relation 总数 | 925 | `is_a_relations + semantic_relations`，不含派生组织边 |
| structure field | 266 | `ontology_metrics.structure_fields` |
| controlled value | 73 | `ontology_metrics.controlled_values` |
| instance example | 166 | `ontology_metrics.instance_examples` |
| constraint | 124 | `ontology_metrics.constraints` |
| source claim | 7,242 | `ontology_metrics.source_claims`；同一来源可直接附着到多个 owner |
| case path | 1 | `ontology_metrics.case_paths` |
| legacy individual/data property/axiom remaining | 0 / 0 / 0 | 三个 `legacy_*_remaining` 指标 |

`research/source-registry.csv` 当前另有 373 条来源记录；来源登记数与 `source_claims` 是不同口径，前者是可复用来源身份，后者是附着到具体节点、关系、字段、约束或例子的直接支持主张，禁止相加或互相替代。发布门禁会校验 canonical、Schema、Markdown、fixture、类型和 source index 同步；若构建输出变化，必须通过同一原子发布命令更新本快照和全部生成产物。

## 1. 审计目标、范围与方法

### 1.1 对会议要求的还原

2026-07-03 快速会议给出的要求可以归纳为六条验收原则：

1. 不能只堆概念，必须解释概念的定义、层级、关系、必要性和工程例子；
2. 先判断第一层是否闭环，再判断每个第一层下面的第二层是否闭环，逐层向下；
3. 去重、消歧、明确边界，特别是 runtime/情感、tool call/action、memory 层级、前端状态/内部状态；
4. 本体要能反向指导模块、状态机、前后端边界、任务分解和技术债治理；
5. 选择一个复杂主案例，完成“本体术语—实现构件—运行事实—验收查询”全映射；
6. 在同一节点/关系详情中同时提供严谨定义、可读解释和案例信息；服务执行，不为抽象而抽象，也不拆成多个版本或页面。

本报告据此把“闭环”定义为可测试的工程性质，而不是“术语看起来齐全”。

### 1.2 树状闭环审计法

审计顺序严格沿唯一主层级从树根向叶节点推进：

```text
L0  Agent Ontology：总体目标、覆盖范围和全局解释
└─ L1  Domain / Plane：一类完整的 Agent 工程问题域
   └─ L2  Module：Domain 内不重叠的逻辑主题
      └─ L3  上位概念：Module 内最一般的概念
         └─ L4  中间概念：在父概念上增加明确区分特征
            └─ L5+ 下位概念：继续由抽象向具体专业化
```

实例、Schema、来源、解释、案例、状态和治理信息不构成 L6，也不构成另一棵树；它们附着在 L0–Ln 中相应节点和边的信息中。Domain→Module 与 Module→root Concept 是组织归属；只有 `Child Concept --is_a→ Parent Concept` 表达严格的抽象—具体语义。

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

仓库现有来源登记共 373 条，其中明确标年 2022–2026 的条目为 157 条；本轮在此基础上深读和交叉核验至少 33 组最相关的一手资料。另保留 OWL、SHACL、PROV-O、SKOS、ODRL、FIPA 等早于时间窗但仍然有效的基础规范。

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

## 2. 冻结 v1 规范的可复核量化基线

### 2.1 规范实际规模

以下数字直接来自审计时冻结的 v1 `ontology/agent-ontology.json`，而不是说明文档。它们保留用于迁移对账；当前 v2 release 的新合同读数见 0.2，不能把两组口径混成同一个“当前规模”：

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

| v1 一级 Plane | 类总数 | 参与真实语义边 | 连通率 | v1 闭环初判 |
|---|---:|---:|---:|---|
| info | 103 | 39 | 37.9% | 未闭环；来源、消息、上下文、披露混杂 |
| orchestration | 69 | 31 | 44.9% | 未闭环；缺 Intent 和清晰的计划—执行桥 |
| runtime | 56 | 34 | 60.7% | 局部最成熟；Actor、模型、角色混杂 |
| adapter | 39 | 11 | 28.2% | 保留一级 Adapter Domain；v1 映射元模型不足，需在本域内部补齐专业化链、版本、方向与损失说明 |
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

Moonweave 的 v1 基线缺少这种明确的数据绑定、身份键、实例来源和 query/use-case gate。Fabric 不足以覆盖 Agent 内部规划、运行和记忆，但它很好地说明：**概念定义、数据映射、实例说明和 Agent 消费必须有清楚职责，不能在同一字段中混写。** 这里的职责区分不导出第二棵实例树或独立页面；在 Moonweave 中，实例与映射仍作为对应 canonical 节点或关系的附着信息，并从同一图谱生成验证工件。

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

## 4. 一张统一图谱、一个真相源、逐层展开

Moonweave 的目标元架构不是多套并列产品，而是一个逻辑层级、一个 canonical 图谱和一套可拆分审查的物理源码：

```text
Agent Ontology
├─ Info Domain
├─ Orchestration Domain
├─ Runtime Domain
├─ Tool Domain
├─ Safety Domain
├─ Feedback Domain
├─ Memory Domain
└─ Adapter Domain
   └─ Module
      └─ general Concept
         └─ more-specific Concept
```

八个 Domain 均保留一级位置，包括 Adapter。每个 Domain 内以现有 Module 划分不重叠的逻辑主题；每个 Module 下由一般 Concept 到更具体 Concept 递归展开。一个 Concept 只有一个 canonical ID；跨域复用通过引用和语义关系表达，不复制节点。

### 4.1 图中层级边

| 图中层级 | 语义 | 保存方式 |
|---|---|---|
| Agent Ontology→Domain | `contains_domain` | 从 `planes[]` 派生 |
| Domain→Module | `contains_module` | 从 `module.plane_id` 派生 |
| Module→root Concept | `declares_concept` | 从 `class.module_id` 和无模块内父关系派生 |
| Child Concept→Parent Concept | `is_a` | 在唯一 `relations[]` 中保存，方向为具体→抽象 |

前三类是组织归属，最后一类是严格专业化语义。`is_a` 必须能写成“Child 是一种 Parent”，不能用来表达部分、使用、产生、调用、参与或工作流先后。允许多父 DAG，但默认目录和布局只引用一个明确的 primary parent relation；额外父边不得导致节点复制。

### 4.2 节点和边的信息合同

每个 root、Domain、Module、Concept 和 relation 都在同一 canonical 记录中保存其适用信息：三语标签与定义、目的、必要性、包含/排除边界、结构字段、约束、关系方向与基数、正反例、实例片段、来源主张、案例路径引用、映射、状态和变更。`Core/Profile/Adapter` 只作为所有权或适用范围注解，不成为另一棵树。

Schema、fixture、JSON-LD、OWL、SHACL、Markdown、类型和前端索引可以由这些信息确定性生成，但都是只读机器投影。它们不创建图节点、不拥有领域事实，也不能被生成器读回作为新一轮 source。

### 4.3 同页呈现和筛选

根视图继续是中心节点加八域辐射；进入 Domain 后显示直属 Module，进入 Module 后显示其根概念和递归子概念。点击节点或边只更新图下同一张详细信息表；只有显式展开才改变拓扑。筛选只改变同一图谱的可见关系，不改变 Domain 一级地位，不创建 operational view 产品。

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

## 9. 节点、边、Case Path 与 Generated Artifact 的信息合同

用户面对的始终是同一张 canonical 图谱。传统本体工程中的 TBox/ABox、结构 Schema、语义 shape 和治理职责仍可用于内部验证分工，但不得变成用户要在其间切换的页面、图或导航层。

| canonical 宿主 | 直接保存的信息 | 由其生成但不回写的工件 |
|---|---|---|
| Domain/Module/Concept node | 标签、定义、边界、结构字段、约束、正反例、实例片段、来源、映射、状态和变更 | JSON Schema 片段、fixture、Markdown、类型、可选 RDF/SHACL 投影 |
| Relation edge | predicate、方向、端点、关系种类、基数/不适用理由、条件、正反例、来源和映射 | 边验证规则、语义导出、关系文档 |
| Case Path | 已有节点内 `case-fragment` example 与边 ID 的有序引用；解释片段仍只保存在其节点内 example 中 | 同一图中的路径高亮、CQ fixture 和验收报告 |
| Artifact meta-schema source | canonical 构建合同、版本和封闭属性政策 | canonical 根 Schema 和生成类型 |

实例片段只是对应 Concept 的正例、反例或 boundary example；来源主张附着到它直接支持的节点、边、字段、约束或案例片段；治理信息附着到其治理对象。它们都不创建 `PlaneIndividual`、`ModuleIndividual`、Schema/Instance/Source/Case 影子节点。

物理源码可以按 Domain/Module 拆分，builder 将其编译成一个 canonical `planes[]/modules[]/classes[]/relations[]` 图。所有机器工件都携带来源 canonical ID，必须能从干净 checkout 字节级重建；生成器不得读取上一轮输出作为输入，前端也不得维护手写 GraphView。

## 10. 定义、解释、正反例与多语质量

### 10.1 每个术语的统一模板

每个发布级术语至少包含：

1. stable ID/IRI、中文名、英文名、日文名、同义词和弃用别名；
2. `上位概念 + 区分特征` 的一句话定义；
3. canonical owner、Domain/Module path、Core/Profile/Adapter 适用范围注解和真实 `is_a` parent；
4. 包含范围和明确的“不包含什么”；
5. 它回答的 competency questions；
6. identity rule、必要属性、状态和生命周期；
7. 关键入边、出边、逆关系和基数；
8. 权限、风险和信任边界；
9. source claim、证据段落、维护者、状态、版本和变更记录；
10. 主案例中的正例；
11. 易混淆反例；
12. 外部框架映射、映射方向和语义损失；
13. 可生成 SHACL/JSON Schema/fixture 的结构与约束信息；这些信息仍显示在本节点详情中。

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

按照会议“只选一个复杂主案例并贯穿全工程”的要求，建议使用软件缺陷修复 Agent。它同时覆盖信息、计划、工具、安全、运行、反馈、记忆和适配，比多个彼此割裂的小例子更能暴露断链。案例保存为**已有 canonical 节点和边的有序引用序列**，并在节点内保存所需实例片段；它只在原图上高亮路径，不创建独立案例图或复制案例专用节点。

### 11.1 原图路径及节点内实例片段

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

| Domain | 主案例中的 canonical Concept/关系及节点内片段 | 必须交给其他域的接口 |
|---|---|---|
| Info | Message、DefectReport、SourceReference、Context projection、Disclosure | ContextSnapshot 交给 Orchestration/Runtime；披露请求交 Safety |
| Orchestration | Objective、Intent、PlanRevision、Task、Delegation、StopCondition | Task/assignment 交 Runtime；capability requirement 交 Tool |
| Runtime | Run、Attempt、ActorInstance、StateTransition、Trace、Artifact | 原始事实交 Evaluation；checkpoint 可被恢复但不等于 Memory |
| Tool | ToolOperation、SelectionDecision、Invocation、Result、Effect | 权限请求交 Safety；Result/Observation 交 Runtime/Context |
| Safety | PolicyRequest、Decision、Grant、BoundaryCrossing、Approval、Audit | enforcement outcome 回 Runtime；incident 回 Feedback |
| Feedback | EvalRun、Measurement、ReviewFinding、Correction、LearningSignal | plan/tool/policy/memory change 只能形成提案，不能无治理地直接改定义 |
| Memory | Ingestion、MemoryRecordVersion、RetrievalRun、ContextAssembly、Expiration | versioned ContextSnapshot 交 Runtime；usage/provenance 回写 |
| Adapter | MCP/A2A/OpenAI/LangGraph 等外部构件映射 | 保持一级 Domain；映射信息引用 canonical 节点，不复制核心事实 |

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

本节由 `docs/design/agent-ontology-unified-graph-upgrade-plan-zh.md` 的 Phase 0–6 和原子切换规则取代。关键路线如下；每一阶段都在同一图谱和同一 editable source 上增量收敛，不创建专业版/可读版/案例版等平行产品。

### 14.1 Phase 0：方向纠偏和基线冻结

1. 接受 RFC 0005，明确八域、Adapter 一级位置、统一图谱和节点内信息合同；
2. 修订 RFC 0001/0002/0004、art direction、governance 和本报告中的冲突表述；
3. 冻结旧 canonical 的 hash、集合 ID、数量和 desktop/mobile 视觉基线；
4. 建立禁止平行 route/tab/GraphView 的测试边界。

### 14.2 Phase 1：先写失败测试和独立构建合同

1. 先以 RED 测试锁定 canonical meta-schema、八域/41 模块、节点/边信息、`is_a` 方向和七问审查；
2. 从独立 `schemas/source/agent-ontology-artifact-contract.json` 生成 canonical 根 Schema；
3. 建立只读取 `ontology/source/**` 的确定性 builder，禁止读取 generated canonical；
4. bootstrap 41 个 Module source，并以 exactly-once manifest 记录每一条 legacy record 的去向。

### 14.3 Phase 2–4：按主执行链逐域完成实质迁移

迁移顺序为 Runtime→Orchestration→Tool→Safety→Feedback→Memory→Info→Adapter。每个 Module 先确定 scope、根概念和真实抽象—具体链，再补语义边、结构字段、约束、正反例、来源、映射和失败/恢复闭环。572 Concept、421 relation、102 field、80 individual、657 axiom、adapter mapping、32 stale definition 和 507 source-set drift 都必须在账本中恰好有一个人工可审查决定；不得根据名称或当前 bucket 机械推断 `is_a`。

### 14.4 Phase 5：原子切换和单页 UI 消费

旧 release 在迁移期间保持只读；candidate 通过严格 meta-schema、引用、无环、primary parent、source、案例和模块闭环门禁后，才在同一个原子变更中替换 canonical、根 Schema、generated types/source index、Markdown、fixtures、测试和 UI consumer。切换后的顶层不再保留 `terms/object_properties/data_properties/individuals/axioms/adapter_mappings` 重复集合。

UI 只从 canonical index/ViewModel 读取数据，并保持 header、左侧目录、breadcrumb/定义、唯一 graph、图下单栏详情。节点点击只改变 focus，显式展开才改变 topology；Case Path 只高亮已有节点/边。

### 14.5 Phase 6：导出、治理和完整验证

JSON Schema、类型、Markdown、fixture 以及可选 OWL/SHACL/ShEx 均从 canonical 生成并携带 canonical ID。最终门禁包括 byte-identical clean build、canonical 真 Schema 校验、0 unresolved endpoint、0 `is_a` cycle、41/41 Module 闭环、572/572 legacy Concept 决定、80/80 legacy individual 决定、三语/主题/mobile/keyboard/reduced-motion、单页 E2E 和覆盖率不低于 80%。

### 14.6 规范源码结构

```text
ontology/
  source/
    ontology.json
    <domain>/<module>.json
  migration/legacy-v1/
  generated/
schemas/
  source/agent-ontology-artifact-contract.json
  generated/
src/generated/
```

`ontology/agent-ontology.json` 是发布用 generated canonical，不再人工编辑；migration 目录不进入 UI 或发布工件，也永远不能重新成为运行时 source。

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

当前 Moonweave Agent Ontology 的优势是**八域统一浏览骨架、资料资产、覆盖广度和局部工程语义**；短板是**Module 内真实专业化层级、跨域主链、关系合同、节点内案例/约束、来源精度和生成治理**。

最合理的演进策略是：

> **保留现有 FIBO 式中心—八域—模块统一图谱，在每个 Module 内建立可审查的抽象—具体 Concept 链和跨节点语义边；把定义、结构约束、实例、来源、案例、映射与治理全部附着到对应节点或边；所有机器工件从一个 editable source 和一个 canonical graph 确定性生成。**

当前 v2 release 已满足上述条件：41 个 Module 均有真实 specialization chain 或经审查的 flat-root exception，572 个 legacy Concept 和 2,881 条 legacy record 均有 exactly-once 决定，主案例复用原图节点与关系回答 CQ，单页呈现、确定性生成、覆盖率和原子发布门禁全部通过。后续演进必须继续沿同一 source-first 合同增量审查，不能退回平铺术语目录或平行展示体系。

## 附录 A：本地证据入口

- [Canonical ontology](../ontology/agent-ontology.json)
- [Canonical 说明文档](../ontology/agent-ontology.md)
- [生成的多语定义对账表](../ontology/agent-ontology-definitions.json)
- [source-first builder](../scripts/build-agent-ontology.mjs)
- [生成的 canonical 根 Schema](../schemas/agent-ontology.schema.json)
- [Canonical contract tests](../tests/ontology-contract.test.ts)
- [Taxonomy tests](../tests/ontology-taxonomy.test.ts)
- [Node information tests](../tests/ontology-information.test.ts)
- [Relation contract tests](../tests/ontology-relations.test.ts)
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
| 八 plane 是否继续作为第一层 Domain | Accept | 构成已批准的 FIBO 式统一浏览骨架；Domain/Module 组织边不得伪装为 Concept `is_a` |
| 八 plane 是否保留一级呈现 | Accept | 中心—八域辐射是产品基线；筛选只改变可见关系 |
| Adapter 是否与 Runtime/Tool 平级 | Accept | `adapter-plane` 保留一级 Domain；外部映射仍引用而不复制 canonical Concept |
| 是否继续手改 canonical JSON | Reject | 生成器会重新吸收和复制缺陷 |
| 是否采用单一工具/框架术语作为核心 | Reject | 版本快变且语义不完整 |
| 是否把 Core/Profile/Adapter 或 TBox/ABox/Governance 做成平行用户呈现 | Reject | 仅保留内部职责/注解；Schema、实例、来源、案例和治理均附着在同一节点或边 |
| 是否以 CQ 和主案例作为发布门禁 | Accept | 将“看起来完整”变成可执行验收 |
| 是否立即扩展情感/具身/VRM | Defer to profile | 核心 Agent 循环尚未闭合，先稳定可复用骨架 |
