# Moonweave Agent Ontology 统一图谱层级深化升级计划

> 版本：Draft 1.0
> 日期：2026-07-13
> 基线分支：`chore/agent-ontology-audit`
> 基线提交：`6c01220`
> 输入一：2026-07-03 快速会议记录
> 输入二：`research/agent-ontology-hierarchical-closure-audit-zh.md`
> 输入三：2026-07-13 用户关于统一图谱、逻辑层级和内嵌信息的四点反馈
> 文档性质：后续升级的实施合同；本文件本身不授权改写 ontology 或 UI
> 交付状态：已按本计划完成 TDD 实施、正式 v2 原子发布与全量验收（2026-07-13）

## 0. CAPABILITY：升级后究竟获得什么能力

本次升级面向本体维护者、Agent 工程师、研究审查者和第一次接触 Moonweave 的读者。升级完成后，用户仍然只面对当前这一张以 Agent Ontology 为中心、按 Domain/Plane → Module → Concept 逐层下钻的统一图谱；不同之处是，每个 Module 内不再只是平铺术语，而会继续形成由一般概念到具体概念的严谨专业化链。点击任一节点或边时，定义、边界、结构与约束、实例、正反例、主案例、来源、映射和治理信息都在当前图谱下方的同一张“节点/关系详细信息”表中解释，不跳到 ABox、TBox、Schema、Instance、Evidence 或 Case 等另一页面，也不产生第二棵本体树。

一句话能力声明：

> **保留现有 FIBO 式统一浏览骨架，在同一张图内补齐真正的抽象—具体概念层级和语义边，并让所有解释性、验证性与案例性信息附着于其对应节点或边。**

## 1. CONSTRAINTS：固定政策、架构偏好和禁止事项

### 1.1 已固定、实施不得重新讨论的产品政策

| ID | 固定政策 | 实施含义 |
|---|---|---|
| INV-01 | 保留当前中心节点和八个一级 Domain/Plane | 根视图继续显示截图中的八向辐射结构；不得用 Actor/Intent/Capability 等另一组根节点替换 |
| INV-02 | 保留 `adapter-plane` 的一级位置 | Adapter 继续与其他七个 Domain 并列；其内部仍需建立清晰层级和映射解释 |
| INV-03 | 唯一主导航为 `Agent Ontology → Domain → Module → Concept → Subconcept…` | 不新增 TBox/ABox/Schema/Instance 等主导航入口 |
| INV-04 | 树状逻辑指抽象概念到具体概念 | Concept 层级只能回答“X 是一种 Y”，不能把 schema、实例、页面或来源当成下位概念 |
| INV-05 | 对外只有一张 canonical concept graph | 所有用户可见节点和边来自同一 canonical 数据；不得维护第二张 GraphView |
| INV-06 | Schema、实例、来源、解释、案例、治理是信息 | 它们进入节点或边的详细信息，不生成影子节点、影子关系或独立页面 |
| INV-07 | 一个概念只有一个 canonical ID | 跨域使用采用引用和语义边；禁止复制定义形成同义节点 |
| INV-08 | 案例是原图路径的高亮 | 案例引用已有节点/边和说明片段；不得复制“案例 Goal”“案例 ToolCall”等节点 |
| INV-09 | 机器工件可以生成，但不能成为第二真相源 | canonical 根 Schema/类型由独立、版本化、人工评审的 artifact meta-schema source 生成；Concept payload Schema、OWL、SHACL、fixture 和内部 ViewModel 由 canonical 节点/边信息生成；二者均不承载第二份领域事实 |
| INV-10 | Hidden Chain-of-Thought 继续排除 | 只描述可观察计划、动作、决策、结果、摘要和证据 |
| INV-11 | 当前单页 DOM 大框架保留 | 继续使用 header、左侧目录、breadcrumb/定义、唯一图谱、图下单栏详情；不新增右栏 inspector、tabs 或平行工作台 |
| INV-12 | 语义事实只保存一次 | 一条父子关系、语义关系、案例或来源主张只能有一个 canonical 表达；其他位置通过索引反查 |

### 1.2 架构偏好

- 物理源码可按 Domain/Module 拆分，以便审查和版本控制；编译后仍是一个统一 canonical graph。
- UI 内部可以拆 React 组件、索引器和 ViewModel；这属于等价代码重构，不是页面或产品结构拆分。
- 多继承使用 DAG；默认树位置由一个 primary parent relation 决定，其他真实父关系不得因布局需要而删除。
- 信息过载通过聚焦式展开、折叠行和“展开全部”解决，不通过另开页面解决。
- `Core/Profile/Adapter` 只保留为适用范围、可移植性或所有权注解，不成为另一组导航树。
- “Schema”在用户界面统一称为“结构与约束”；内部导出文件仍可使用 JSON Schema 等标准名称。

### 1.3 明确禁止

以下 CSS class、route、tab 或产品表面不得新增：

```text
.viewer-nav
.inspector-panel
.catalog-section
.abox-*
.tbox-*
/abox
/tbox
/schema
/instances
/evidence
/case-study
```

以下图节点不得出现：

```text
某概念的 Schema
某概念的实例
某概念的来源
某概念的案例
PlaneIndividual
ModuleIndividual
JSON Schema 页面节点
SHACL 页面节点
Fixture 页面节点
```

上述禁令针对“为解释另一个 Concept 而生成的 annotation shadow node”，不按名称关键词误杀领域概念。若 `SchemaArtifact`、`SourceArtifact` 或 `ExampleDataset` 是 Agent 会生产、消费、版本化、授权、追踪并参与其他关系的真实运行产物，它可以作为普通 canonical Concept；其 `semantic_kind`、独立身份和生命周期必须通过审查。只有 `planes[]/modules[]/classes[]` 中的 canonical 实体可投影为 GraphNode，嵌套的 structure/example/source annotation 永远不得入图；测试必须检查 canonical collection 与 owner path，不得用 ID 或 label 是否包含 `Schema/Source/Example` 判断。

## 2. 对原审计报告的正式校正

### 2.1 原样保留的诊断

以下结论不受本次反馈影响：

- 当前 572 个 class 没有实际形成 concept specialization 层级；
- 大量 class 不参与具体语义边；
- 关系缺方向合同、基数、时态、逆关系、条件、正反例和来源定位；
- canonical JSON、说明文档、定义账本、Schema 和测试存在漂移；
- 当前 Schema 验证的是手写 GraphView，而不是 canonical JSON；
- 80/80 individual 的 `class_id` 不能解析；
- `InstructionConflict` 存在所有权不一致；
- 三语定义存在串义，且缺节点级正例、反例和案例；
- 当前 CQ 无法证明全局及 41 个模块闭环；
- 原报告对 41 个 Module 的逐项缺口仍是升级待办；
- Goal → Plan → Execution → Result → Evaluation → Feedback/Memory 的 Agent 逻辑链仍需补齐。

### 2.2 保留但重释

| 原报告概念 | 本计划中的准确含义 |
|---|---|
| “四类内容尚未分开” | 指字段职责和语义职责要区分，不指拆成四套页面或四张图 |
| upper category | 是节点的语义分类和审查信息，不是新的一级根树 |
| Definition/Plan/Execution/Result 四态 | 是同一 Module 内不同概念及关系，不是四张图 |
| Core/Profile/Adapter | 是节点/边的注解，不是主导航轴 |
| TBox/ABox | 只可作为内部标准术语解释类型与样例数据差异，不进入产品结构或导航 |
| fixture | 从节点内嵌正反例生成，不作为用户可见实例图 |
| governance graph | 来源、状态、版本、废弃信息附着在节点/边上 |
| professional/readable/case | 改为同一详情表的渐进展开，不建三套页面 |
| 限定关系实体化 | 仅当关系事实具有独立身份、生命周期和其他关系时采用，不普遍 reification |
| operational view | 最多是同一图谱的筛选状态，不能取代八个一级 Domain |

### 2.3 正式撤回

本计划撤回原报告中的以下方案：

1. “八个 Plane 只保留为 operational views”；
2. “Adapter 不再与其他 Domain 平级”；
3. 用 Actor/Intent/Capability 等新顶层树替换八个 Plane；
4. 把 Core/Profile/Adapter 或 TBox/ABox/Governance/Views 做成并列产品层；
5. 把专业版、可读版、案例版拆成独立页面或独立目录产品；
6. 让用户在多张图之间理解同一概念；
7. 为 Schema、实例、来源和治理另建图节点或关系。

### 2.4 原报告逐段修改清单

实施升级时应同时修订原报告，不能让旧建议继续作为冲突依据：

| 原报告位置 | 操作 | 精确替换方向 |
|---|---|---|
| 第 14–30 行，结论先行 | 替换 | 用本文件 0 节能力声明取代 TBox/ABox/治理/视图分产品表述 |
| 评级表“范围与最高层分类” | 拆成两行 | `信息架构与一级呈现：3/4`；`模块内概念专业化层级：0/4` |
| 评级表“实例、查询与约束验证” | 改名 | `节点内案例、结构约束与查询验证：1/4` |
| 第 47–86 行树状审计法 | 替换 | 采用本文件 3.1 的 L0–L5+ 逻辑层级；声明实例/schema 不构成层级 |
| 第 251–323 行“三个正交维度” | 整章替换 | 标题改为“一张统一图谱、一个真相源、逐层展开” |
| 第 309–320 行 Operational Views | 删除降级措辞 | 改为“八个 Domain 保留一级地位；筛选只改变可见关系” |
| 第 675–697 行 TBox/ABox 分工 | 整章替换 | 改为节点、边、Case Path、Generated Artifact 的信息合同 |
| 第 699–759 行定义模板 | 保留并改呈现 | 所有字段明确放入同一节点/边详情表 |
| 第 760–819 行主案例 | 改写 | 案例保存为已有节点/边引用序列及节点内片段，不建独立案例图 |
| 第 920–1002 行路线和仓库结构 | 替换 | 使用本文件 12–16 节路线；删除多产品页面目录 |
| 第 1023–1031 行最终判断 | 替换 | 使用本文件 18 节最终判断 |
| 附录 B 决策表 | 替换 | 八 Plane=Accept；Adapter 一级位置=Accept；分割用户呈现=Reject |

原报告建议替换后的开篇文字必须逐字使用：

> 当前八个一级领域、其下模块以及中心辐射式图谱呈现，已经构成合理的 FIBO 式组织与浏览骨架。当前问题不在于必须另建一套核心类型树，而在于各模块内部缺少由抽象概念向具体概念逐层展开的真实逻辑链，跨节点关系合同过薄，且定义、实例、结构约束、来源和案例尚未充分附着到对应节点和边上。
>
> 本轮升级保留 `Agent Ontology → Domain → Module → Concept` 的统一图谱，补齐 Concept 内部的多层专业化结构；Schema、实例、案例、来源、治理和外部映射均作为节点或边的信息呈现。机器验证工件从同一 canonical 图谱生成，但不成为另一套页面或本体结构。

### 2.5 三份指定资料如何进入计划，而不是被照搬成页面

| 资料 | 本计划吸收的工程原则 | 明确不照搬的内容 | 对应落实点 |
|---|---|---|---|
| [Palantir Foundry Ontology](https://www.palantir.com/docs/foundry/ontology/overview) | 语义对象、属性和链接与动作/函数共同服务可执行用例；类型拥有丰富 metadata、security/governance 语境 | 不复制 Palantir 产品导航、Object Explorer、Ontology Manager 或其页面拆分；不把产品文档当通用本体标准 | 4.4–4.9 节节点/边信息合同，5.8 节同页详情，8.19 节复用现有 `eng-ont-palantir-*` 来源 |
| [Microsoft Fabric IQ Ontology](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview) | entity type 统一名称、描述、标识、属性和约束；relationship 是 typed directional link，可带属性和 cardinality；graph representation 支持导航与推理 | 不把 entity instance、property 或 relationship 变成 Moonweave 的平行导航树；不因文档处于 preview 就把其设计当稳定标准 | 4.4–4.8 节 Concept/field/relation 合同，5.6 节方向与多边，8.19 节 living-source 复核 |
| [Skan Agentic Ontology of Work](https://www.skan.ai/whitepapers/agentic-ontology-of-work) | canonical entity、attribute、relationship、governance constraint、lifecycle 和行业案例应共同支撑可解释、可审计的 Agent work model | 不采用其厂商术语直接替换 Moonweave 八域；不把四层 stack 复制成第二根树；不把厂商白皮书标成同行评审标准 | 4.6/4.10 节案例信息与路径，10 节模块闭环，8.19 节以 `vendor-whitepaper/B` 登记 |

FIBO 对本计划的主要启示是保留模块化、逐层专业化、统一标识和可审查定义的本体工程方式；它不是要求 Moonweave 复制某个站点皮肤。用户提供截图中的中心—八域辐射和当前单列详情表就是本次升级的视觉基线，外部资料只能补强其逻辑和信息合同，不能推翻这一基线。

## 3. IMPLEMENTATION CONTRACT：目标逻辑层级

### 3.1 唯一主层级

```text
L0  Agent Ontology：总体目标、覆盖范围和全局解释
└─ L1  Domain / Plane：一类完整的 Agent 工程问题域
   └─ L2  Module：Domain 内不重叠的逻辑主题
      └─ L3  上位概念：Module 内最一般的概念
         └─ L4  中间概念：在父概念上增加明确区分特征
            └─ L5+ 下位概念：继续由抽象向具体专业化
```

实例、Schema、来源、解释、案例、状态和治理信息不构成 L6，也不构成另一棵树；它们附着在 L0–Ln 中相应节点和边的信息中。

### 3.2 三类层级边必须区分但共用一张图

| 层级 | 语义 | canonical 保存方式 | 图上行为 |
|---|---|---|---|
| Agent Ontology → Domain | `contains_domain` | 由 `planes[]` 存在关系派生 | 根节点向外辐射八域 |
| Domain → Module | `contains_module` | 由 `module.plane_id` 派生 | 选中 Domain 后显示直属 Module |
| Module → Root Concept | `declares_concept` | 由 `class.module_id` 且无模块内 `is_a` 父关系派生 | 显示该模块的一棵或多棵概念树根 |
| Child Concept → Parent Concept | `is_a` | 只存于唯一 `relations[]` 记录 | 布局父概念在内、子概念在外；详情显示“X 是一种 Y” |

前三类都在同一画布显示，但 `contains_* / declares_concept` 是组织边，`is_a` 是严格语义边；组织归属不得伪装成第二个 `is_a` 父类。

### 3.3 `is_a` 审查七问

每条 `Child --is_a→ Parent` 必须全部回答“是”：

1. Child 的任一有效实例都属于 Parent 吗？
2. Child 的定义能写成“Parent + 区分特征”吗？
3. 这不是 `part_of`、`uses`、`produces`、`invokes` 或 `participates_in` 吗？
4. 加入后仍然无环吗？
5. Child 的结构约束没有违反 Parent 的约束吗？
6. 该中间层不是为了增加层数而虚构的吗？
7. Child 与其兄弟概念有可说明的区分标准吗？

任一问题为“否”时，禁止使用 `is_a`，必须改用其他语义关系或取消该边。

### 3.4 用户示例所表达的原则及 DAG 校正

本计划完全采纳“机器学习 → 更具体方法 → 更具体算法”的原则。落到严格学科语义时，强化学习并不总是深度学习的子类，因此更严谨的示范是：

```text
机器学习方法
├─ 深度学习方法
└─ 强化学习方法
   └─ 深度强化学习方法
      └─ 基于价值的深度强化学习方法
         └─ DQN
```

`深度强化学习方法` 同时可 `is_a` 深度学习方法和强化学习方法。这说明默认呈现可以是树，但真实语义允许多父 DAG。

### 3.5 多继承与默认树位置

- 每个 Concept 可以有多个 `is_a` 出边，但只能选择一个 `primary_parent_relation_id` 作为默认目录和 radial layout 路径。
- 其他父边由 `relations[]` 反查，使用次要线型显示；不得复制节点。
- 主父边用实线，额外父边用虚线；两者在关系详情中语义地位相同，视觉差异只服务布局。
- 多继承节点必须在 `change_note` 或 relation rationale 中说明从各父概念继承的区分维度。
- diamond 结构必须执行属性、allowed values、required relation 和 cardinality 冲突检查。
- `primary_parent_relation_id` 只引用现有 relation，不重复保存 parent ID。
- `children_ids`、incoming/outgoing relation IDs、breadcrumb 全部运行时派生，禁止手写。

## 4. 单一 canonical 图谱数据合同

### 4.1 顶层结构

升级后的统一产物仍为 `ontology/agent-ontology.json`。建议保留兼容名称 `planes`、`modules`、`classes`，避免无价值的大规模 ID 迁移；删除当前重复或错误的平行集合。

```json
{
  "id": "agent-system-ontology",
  "labels": {"zh": "Agent 本体", "en": "Agent Ontology", "ja": "..."},
  "short_definitions": {"zh": "...", "en": "...", "ja": "..."},
  "definitions": {"zh": "...", "en": "...", "ja": "..."},
  "why_needed": {"zh": "...", "en": "...", "ja": "..."},
  "includes": [],
  "excludes": [],
  "examples": [],
  "source_claims": [],
  "status": "draft-hierarchy-upgrade",
  "date": "YYYY-MM-DD",
  "artifact_metadata": {},
  "planes": [],
  "modules": [],
  "classes": [],
  "relations": [],
  "global_constraints": [],
  "case_paths": [],
  "hygiene_gates": [],
  "ontology_metrics": {}
}
```

顶层这些本体说明字段就是 `Agent Ontology` 根节点的信息合同；不再另建 `root` 副本。`global_constraints[]` 只容纳确实作用于整张本体的约束，`case_paths[]` 只容纳根级案例序列索引，二者在根节点详情中呈现，不是平行图谱或第二套页面。editable source 与 canonical 只保存复数三语 `labels/definitions/examples`；旧消费者若需要单数 `label/definition`，只在一个 release 的 compatibility export 中生成，不写回 canonical。

迁移后删除：

| 当前字段 | 处理 | 原因 |
|---|---|---|
| `terms` | 删除 | 与 `classes` 完全重复 |
| `object_properties` | 迁移到唯一 `relations` 后删除 | 与 `relations` 重复；避免两份边事实 |
| `data_properties` | 迁入所属节点 `structure.fields[]` 后删除 | Schema 是节点信息，不是平行图层 |
| `individuals` | 按 4.7 分类迁入节点信息后删除 | 不再维护独立 ABox 式集合 |
| `axioms` | 迁入节点/边 `constraints[]` 或根 `global_constraints[]` | 约束附着被约束对象 |
| `adapter_mappings` | 迁入 Adapter Concept 的 `external_mappings[]` | 映射由一个 canonical Adapter 节点拥有，目标侧反查 |

`plane.term_ids`、`plane.module_ids`、`module.class_ids` 在 source 中删除，由 `module.plane_id`、`class.module_id` 和 relation 索引派生；若为兼容导出临时保留，必须标记为 generated 且禁止手改，并在下一 major release 删除。

当前 `classes[].plane_id` 也从可编辑 source 和新 canonical 删除，由 `class.module_id → module.plane_id` 唯一推导；当前由标签猜出的 `classes[].kind` 经人工迁移后由受控的 `semantic_kind` 取代。兼容消费者若暂时仍要求 `plane_id` 或 `kind`，只能在单独命名、明确 deprecated 的 compatibility export 中生成只读投影，不能写入 canonical，也不能和 source 字段双向编辑。

### 4.2 Domain/Plane 节点合同

每个 `planes[]` 元素增加：

```json
{
  "id": "tool-plane",
  "labels": {"zh": "能力与资源调用域", "en": "Tool Domain", "ja": "..."},
  "definitions": {"zh": "...", "en": "...", "ja": "..."},
  "purpose": {"zh": "该领域解决什么问题", "en": "...", "ja": "..."},
  "includes": [{"zh": "包含什么", "en": "...", "ja": "..."}],
  "excludes": [{"zh": "明确不包含什么", "en": "...", "ja": "..."}],
  "examples": [],
  "source_claims": [],
  "status": "draft|review|accepted|deprecated",
  "introduced_in": "version IRI",
  "change_note": {"zh": "...", "en": "...", "ja": "..."}
}
```

Domain 的入口概念、出口概念、依赖域和被依赖域不得再以 ID 数组复制到节点。它们由唯一 `relations[]` 中已审查的跨域关系和 Module 输入/输出关系反查；详情表可以显示派生分组，但 source 不保存 `depends_on_plane_ids/used_by_plane_ids` 这一对互逆副本。

### 4.3 Module 节点合同

每个 `modules[]` 元素增加：

```json
{
  "id": "tool-invocation-execution",
  "plane_id": "tool-plane",
  "labels": {},
  "definitions": {},
  "purpose": {},
  "includes": [],
  "excludes": [],
  "interaction_contract": {
    "applicability": "operational|descriptive|mixed",
    "not_applicable_reasons": {}
  },
  "taxonomy_contract": {
    "applicability": "specialization|flat-root-exception",
    "not_applicable_reason": null,
    "reviewer": null,
    "review_status": "draft|accepted"
  },
  "examples": [],
  "competency_questions": [],
  "source_claims": [],
  "status": "draft|review|accepted|deprecated",
  "introduced_in": "version IRI",
  "change_note": {}
}
```

一个 Module 发布前必须：

- 有且仅有一个 `plane_id`；
- 至少有一个由关系索引推导出的 root Concept；
- 默认至少形成一条两级以上真实 Concept 专业化链；若该专业领域经审查确实只有不可再专业化的 root concepts，必须使用 `taxonomy_contract.applicability=flat-root-exception`，填写三语 `not_applicable_reason`、reviewer 和 accepted review status；不得只在 `change_note` 随手说明，也不得为过门禁虚构父类；
- 写清与所有兄弟 Module 的边界；
- `interaction_contract.applicability=operational` 时，至少能从唯一语义关系集合推导出一个 input 和一个 output，并审查 failure/recovery；`descriptive` 模块不得为了过门禁虚构流程关系，而应在 `not_applicable_reasons` 说明为何无运行输入、输出、失败或恢复；`mixed` 必须分别标出适用部分；
- input、output、failure、recovery 和跨域使用均从 `relations[]` 的关系类型、端点及 Module ownership 派生，不在 Module 再保存 `*_concept_ids` 副本；
- 所有 competency question 有 query/assertion 和正反例。

### 4.4 Concept 节点合同

每个 `classes[]` 元素最终必须具有：

```json
{
  "id": "ToolCallAttempt",
  "module_id": "tool-invocation-execution",
  "labels": {"zh": "工具调用尝试", "en": "Tool Call Attempt", "ja": "..."},
  "short_definitions": {"zh": "...", "en": "...", "ja": "..."},
  "definitions": {"zh": "...", "en": "...", "ja": "..."},
  "why_needed": {"zh": "...", "en": "...", "ja": "..."},
  "includes": [{"zh": "...", "en": "...", "ja": "..."}],
  "excludes": [{"zh": "...", "en": "...", "ja": "..."}],
  "semantic_kind": "entity|role|capability|information|specification|activity|event|state|quality|collection",
  "primary_parent_relation_id": "ToolCallAttempt-is_a-InvocationAttempt",
  "structure": {
    "identity_keys": ["attempt_id"],
    "fields": [],
    "constraints": [],
    "required_relation_constraints": []
  },
  "examples": [],
  "source_claims": [],
  "external_mappings": [],
  "applicability": ["core"],
  "status": "draft|review|accepted|deprecated",
  "introduced_in": "version IRI",
  "deprecated_in": null,
  "replaced_by_ids": [],
  "change_note": {"zh": "...", "en": "...", "ja": "..."}
}
```

禁止在 Concept 节点重复保存：

```text
parent_id / additional_parent_ids
children_ids
incoming_relation_ids
outgoing_relation_ids
breadcrumb
plane_label / module_label
source title/url copies
```

这些信息全部由唯一 relation、所属 ID 和 source registry 索引派生。`primary_parent_relation_id` 是布局选择引用，不是第二个 parent 事实。

`semantic_kind` 是唯一人工审查的概念范畴；不再同时维护 `kind=activity_type` 一类近义字段。`applicability[]` 的每个元素只能为 `core`、`profile` 或 `adapter`，可以多选，但不得写成一个包含竖线的字符串。

### 4.5 节点结构与约束

`structure.fields[]` 的精确字段：

```json
{
  "id": "attempt_id",
  "labels": {"zh": "尝试标识", "en": "Attempt ID", "ja": "..."},
  "datatype": "string",
  "required": true,
  "cardinality": {"min": 1, "max": 1},
  "definitions": {"zh": "...", "en": "...", "ja": "..."},
  "allowed_values": [],
  "pattern": null,
  "example_value": "attempt-001",
  "source_claims": []
}
```

`structure.constraints[]` 的精确字段：

```json
{
  "id": "ToolCallAttempt-requires-run",
  "severity": "error|warning|info",
  "expression_language": "plain|json-schema|shacl|custom",
  "expression": "每次 ToolCallAttempt 必须属于一个 RunAttempt",
  "explanations": {"zh": "...", "en": "...", "ja": "..."},
  "source_claims": []
}
```

界面只显示“结构与约束”，不显示“跳转到 Schema”。需要下载 JSON Schema 时，由这些字段生成文件。

### 4.6 Example、Counterexample 和 Case Fragment 合同

不再使用多个互相重叠的例子数组，统一为 `examples[]`：

```json
{
  "id": "ToolCallAttempt-example-retry-001",
  "kind": "positive|counterexample|boundary|instance|case-fragment",
  "labels": {"zh": "首次调用超时后的第二次尝试", "en": "...", "ja": "..."},
  "scenario_id": "software-defect-repair",
  "descriptions": {"zh": "...", "en": "...", "ja": "..."},
  "field_values": {"attempt_id": "attempt-002", "retry_index": 1},
  "related_node_ids": ["ToolCall", "ToolResult"],
  "related_relation_ids": [],
  "expected_result": {"zh": "...", "en": "...", "ja": "..."},
  "why_valid_or_invalid": {"zh": "...", "en": "...", "ja": "..."},
  "synthetic": true,
  "verified_version": "version IRI",
  "source_claims": []
}
```

- `positive`：典型正例；
- `counterexample`：不是该概念的例子，并解释原因；
- `boundary`：容易混淆的边界；
- `instance`：字段化示例对象；
- `case-fragment`：主案例在该节点的片段。

同一个 `scenario_id` 把分散在不同节点和关系上的片段连接起来。播放案例时，UI 只高亮这些已有节点/关系，不创建案例节点。

### 4.7 当前 80 个 Individual 的迁移规则

实施时先生成 `research/ontology-individual-migration-ledger.csv`，每个现有 individual 恰好选择一类：

| 迁移类别 | 处理方式 | 示例 |
|---|---|---|
| `governance_metadata` | 合并进对应 Plane/Module 的 status/change/source 信息 | `PlaneIndividual`、`ModuleIndividual` |
| `controlled_value` | 放入具体 field 的 `allowed_values[]` | Status、RiskLevel、Visibility、TransportKind |
| `positive_example` | 放入对应 Concept/Relation 的 `examples[kind=instance]` | 可解释对象样例 |
| `counterexample` | 放入 `examples[kind=counterexample]` | 易混淆但不属于该概念的对象 |
| `runtime_reference` | 放入案例片段，仅保留引用和字段值 | 某次 Run/ToolCall/Message |
| `promote_to_concept` | 仅当它实际上表示可复用类型时提升为 Concept | 必须经过 ontology reviewer 批准 |
| `remove_invalid` | 无主体语义且无治理价值时删除 | 自动生成的无效导航个体 |

迁移表必需列：

```text
individual_id,current_class_id,classification,target_node_id,target_field_id,
target_example_id,action,rationale,reviewer,status
```

验收条件为 80/80 行有唯一 action、目标存在、无悬空 `class_id`；迁移结束后顶层 `individuals[]` 数量为 0。

### 4.8 Relation 边合同

`relations[]` 是唯一逻辑边集合：

```json
{
  "id": "MCPAdapter-is_a-ProtocolAdapter",
  "predicate": "is_a",
  "source_id": "MCPAdapter",
  "target_id": "ProtocolAdapter",
  "direction": "source-to-target",
  "relation_kind": "hierarchy|composition|causal|temporal|information|governance|mapping",
  "labels": {"zh": "是一种", "en": "is a", "ja": "..."},
  "definitions": {"zh": "MCP 适配器是协议适配器的一种。", "en": "...", "ja": "..."},
  "cardinality": null,
  "cardinality_not_applicable_reason": {"zh": "分类继承不使用实例关系基数。", "en": "Taxonomic inheritance does not use instance-relation cardinality.", "ja": "..."},
  "inverse_reading": {
    "predicate": "has_subtype",
    "labels": {"zh": "有下位概念", "en": "has subtype", "ja": "..."}
  },
  "conditions": [],
  "temporal_scope": "timeless|valid-time|transaction-time",
  "constraints": [],
  "examples": [],
  "source_claims": [],
  "status": "draft|review|accepted|deprecated",
  "introduced_in": "version IRI",
  "change_note": {}
}
```

关系只保存一次。节点详情通过 source/target 反查入边和出边；不得再在 class 内维护 `outgoing_relations[]` 副本。

`inverse_reading` 只是同一条 assertion 的反向自然语言读法，不是第二条 relation，也没有另一个 relation ID。禁止为 `A --uses→ B` 再保存一条仅表达同一事实的 `B --used_by→ A`；反向详情由索引和 `inverse_reading` 派生。只有当第二条记录具有不同限定条件、时态、证据或独立事实身份，无法从第一条完整推出时，才可另建 relation，并必须填写 `distinct_fact_rationale`。

对于 `is_a`：canonical 方向永远是 Child → Parent；布局仍把 Parent 放在内圈、Child 放在外圈。默认线可无箭头，选中后必须显示语义方向和句子“Child 是一种 Parent”。

`cardinality` 只适用于实例层语义关系的约束投影；`is_a`、组织边或其他不适用关系必须为 `null` 并给出三语 `cardinality_not_applicable_reason`，不得为了字段完整性臆造 `0..*`。当 `cardinality` 非空时，source/target 的 `min/max` 才进入一致性校验；未知上限使用 `null`，与“不适用”严格区分。

### 4.9 Source Claim 合同

节点、字段、约束、关系和例子都使用同一 `source_claims[]` 结构：

```json
{
  "source_id": "eng-proto-mcp-spec",
  "supports": "该来源具体支持哪一句定义、哪条关系或哪个字段",
  "locator": "section/page/heading/paragraph",
  "evidence_kind": "normative|official|peer-reviewed|vendor|design-inference",
  "confidence": "high|medium|low",
  "review_status": "draft|accepted"
}
```

标题、年份、URL、作者和权威等级从 `research/source-registry.csv` 关联读取，不复制到每个节点。禁止再把整个 Plane 的 source IDs 合并成某个 Class 的直接来源。

### 4.10 Case Path 合同

根级 `case_paths[]` 不是图节点集合，只是原图高亮脚本：

```json
{
  "id": "software-defect-repair",
  "labels": {},
  "descriptions": {},
  "steps": [
    {"order": 1, "case_fragment_example_id": "Goal-case-software-defect-repair-01", "traversal_relation_id": null},
    {"order": 2, "case_fragment_example_id": "TaskPlan-case-software-defect-repair-02", "traversal_relation_id": "..."},
    {"order": 3, "case_fragment_example_id": "ToolCall-case-software-defect-repair-03", "traversal_relation_id": "..."}
  ],
  "source_claims": [],
  "status": "draft|accepted"
}
```

每个 `case-fragment` example ID 在全本体唯一，并因其嵌套位置天然拥有一个 node/relation owner；片段解释、field values 和 related IDs 只保存在该 example。`case_paths.steps[]` 只保存顺序、fragment 引用及从上一 fragment 到本 fragment 的已有 traversal relation，不再复制 `node_id/explanation`。builder 由 example owner 反推出节点；每个 step 引用和 relation 必须可解析，且 traversal relation 的端点必须连接相邻 fragment owners。禁止在 path 嵌入另一份节点定义或案例说明。

### 4.11 Metrics 合同

`ontology_metrics` 全部由 builder 计算，禁止手填。迁移后至少包含：

```json
{
  "domains": 8,
  "modules": 41,
  "concepts": 0,
  "taxonomy_roots": 0,
  "is_a_relations": 0,
  "semantic_relations": 0,
  "instance_examples": 0,
  "controlled_values": 0,
  "structure_fields": 0,
  "constraints": 0,
  "source_claims": 0,
  "case_paths": 0,
  "legacy_individuals_remaining": 0,
  "legacy_data_properties_remaining": 0,
  "legacy_axioms_remaining": 0
}
```

UI 的“本体规模”从 `concepts/semantic_relations/instance_examples/controlled_values/structure_fields/constraints/source_claims` 读取，不再把已删除的顶层 `individuals=80` 显示为现行实例数。若为迁移审计保留 legacy 指标，只显示在治理行且 release gate 要求均为 0。派生组织边不写入 canonical metrics；可见 edge count 由 ViewModel 在运行时单独计算。

## 5. 统一图谱的呈现和交互合同

### 5.1 保留当前 DOM 大框架

升级前后均保持：

```text
全局 Header：品牌 / 语言 / 主题 / 下载
└─ 主工作区
   ├─ 左侧 sticky 层级目录
   └─ 单一内容栏
      ├─ breadcrumb
      ├─ 当前节点名称与一句话定义
      ├─ 唯一 Cytoscape 图谱
      └─ 单栏“节点/关系详细信息”表
```

不得新增右侧 inspector、底部平行面板、Schema view、Statechart view、Evidence view、Adapter view 或 Minimap。内部拆组件后，基线截图除新增信息行和选中状态外，整体布局必须保持一致。

### 5.2 React 状态必须分开，但页面不分开

当前 `selectedRef` 同时承担图根和详情焦点，必须改成：

```ts
const [graphRootRef, setGraphRootRef] = useState(rootRef);
const [focusedEntityRef, setFocusedEntityRef] = useState(rootRef);
const [focusedRelationId, setFocusedRelationId] = useState<string | null>(null);
const [directoryExpandedRefs, setDirectoryExpandedRefs] = useState<Set<string>>(new Set([rootRef]));
const [graphExpandedRefs, setGraphExpandedRefs] = useState<Set<string>>(new Set([rootRef]));
```

行为合同：

- 点击左侧目录或 breadcrumb：同时更新 `graphRootRef` 和 `focusedEntityRef`，清空 `focusedRelationId`；
- 点击目录折叠箭头：只以新 `Set` 更新 `directoryExpandedRefs`，不改变图谱拓扑；
- 单击图节点：只更新 `focusedEntityRef`，图根、布局语境和节点数不变；
- 显式展开按钮或双击图节点：只以新 `Set` 更新 `graphExpandedRefs`，必要时才改变可见拓扑；
- 单击图边：只设置 `focusedRelationId`，同一张详情表切换为边信息；
- 点击“返回节点”：清空 `focusedRelationId`，恢复 `focusedEntityRef` 的节点信息；
- 两个 Set 状态都必须 immutable update（`new Set(previous)`），禁止原地 `.add/.delete` 后复用同一引用；
- 任何操作都不跳路由、不切换页面、不打开另一张图。

URL hash 必须同时保存图谱语境和焦点：节点使用 `#root=<encoded-ref>&focus=node:<encoded-id>`，关系使用 `#root=<encoded-ref>&focus=relation:<encoded-id>`。刷新时先恢复 root/graph expansion，再恢复 focus；若 hash 中 root 无法容纳 focus，按 focus 的 canonical primary path 确定性修复 root 并显示一次非阻塞提示，不能静默回到根图导致焦点不可见。

### 5.3 根、Domain、Module 和 Concept 的可见邻域

| 当前图根 | 默认可见内容 |
|---|---|
| Agent Ontology | 根 + 八个 Domain |
| Domain | 当前 Domain + 上位 Agent Ontology + 直属 Module |
| Module | 当前 Module + 上位 Domain + root Concepts |
| Concept | 当前 Concept + primary parent + additional parents + direct children + 与当前 Concept 直接相关的语义边 |

只有用户显式展开时才继续下一层；不得一次渲染 572 个 Concept。

### 5.4 图节点点击合同

单击任一节点后，必须同时发生：

1. 节点获得 selected/focused 样式；
2. 当前画布中已经可见的直接 incoming/outgoing 边保持可见并高亮；尚未进入当前可见拓扑的关系在详情表完整列出，并以“展开相邻节点（+N）”触发显式展开，单击本身不得偷偷增加节点；
3. 详情表标题、IRI、定义、全部层级/入边/出边、例子、结构、来源同步到该节点；
4. 图根不变；
5. URL hash 更新为 5.2 规定的 `#root=…&focus=node:…`，刷新后同时恢复该焦点和图谱语境；
6. aria-live 区域播报“已选择：{节点名称}”。

当前 `src/App.tsx:3424-3448` 只切换 Cytoscape 内部 select/expand、叶节点直接 return，必须删除这一行为分歧。

### 5.5 图边点击合同

单击任一关系边后，同一详情表按以下顺序显示：

1. 关系名称、ID、状态；
2. `source — predicate → target`；
3. 自然语言定义；
4. 方向和 relation kind；
5. domain/range 或端点限制；
6. 基数；
7. inverse reading（由同一 edge 派生，不是第二 assertion）；
8. conditions 和 temporal scope；
9. 正例、反例、主案例片段；
10. source claims；
11. introduced/deprecated/replacement/change note。

关系边不得跳转“关系页面”。键盘聚焦边后按 Enter 必须获得相同行为。

### 5.6 方向和多重边

- semantic relation 的箭头必须严格使用 canonical `source_id → target_id`；
- 当前 `App.tsx:3088-3107` 先把 incoming/outgoing 压成 neighbor，再在 3189 统一画成 current→neighbor，会反转 incoming 边，必须重写；
- 同一 source/target 可以有多条 predicate，去重键必须是 relation ID，禁止按 neighbor ID 去重；
- hover/focus 同时显示 incoming 和 outgoing，禁止“存在 incoming 时隐藏 outgoing”；
- hierarchy、semantic、additional-parent 三种线型可不同，但不能改变语义方向；
- focused neighborhood 中每条 hierarchy/semantic edge 在可读 zoom 下显示 predicate label；密集全景可渐隐未聚焦 label，但选中 edge、选中路径和当前节点的直接边必须同时显示 label、方向箭头和自然语言 tooltip；
- graph count 显示实际可见 node count 和 visible edge count。canonical relation edge 使用 relation ID；派生组织边使用稳定 ID（如 `derived:contains-module:<plane>:<module>`），二者在详情中区分，但不得把所有 edge count 错称为 relation ID 数；schema/example/source 均不计为节点或边。

### 5.7 叶节点不得失去图谱

即使一个 Concept 没有语义邻边，也必须显示：

```text
当前 Concept --is_a→ primary parent
```

有 additional parents 时一并显示。canonical edge data 始终 `source=Child,target=Parent`；布局和阅读位置仍是 Parent 在内圈、Child 在外圈，不得为视觉顺序反转箭头。只有根本不存在合法父关系的 root Concept，才显示 Module→Concept 组织边。删除当前“无关系即隐藏 canvas”的期望，`graph-empty-state` 仅用于数据损坏或真的没有任何上位归属的异常状态。

### 5.8 图下详细信息表的固定行序

所有信息继续使用当前单栏表格；可折叠，但不得变成 tabs/cards/pages。

| 顺序 | 行标题 | 必须内容 |
|---:|---|---|
| 1 | 逻辑定位 | breadcrumb、所属 Domain/Module、primary parent、其他父概念、direct children |
| 2 | 定义与边界 | short definition、formal definition、why needed、includes、excludes、易混淆项 |
| 3 | 语义关系 | incoming/outgoing 分组，每项完整显示源—谓词→目标、方向和定义 |
| 4 | 工程解释 | 在 Agent 生命周期中的位置、解决的问题、典型输入/输出 |
| 5 | 正例与反例 | 至少一条 positive 和一条 counterexample/boundary |
| 6 | 实例说明 | `examples[kind=instance]` 的字段和值，标注 synthetic/real/reference |
| 7 | 结构与约束 | identity keys、字段、datatype、required、cardinality、allowed values、constraint、最小 JSON 片段 |
| 8 | 公理与验证 | 精确 constraint/axiom 文本、severity、验证作用；禁止泛化占位话术 |
| 9 | 主案例片段 | scenario ID、该节点在路径中的前后步骤和解释；点击只高亮原图 |
| 10 | 适配映射 | 外部术语、版本、方向、损失和目标 Concept |
| 11 | 来源与引用 | title、year、authority、URL、locator，以及“支持哪条主张” |
| 12 | 成熟度与变更 | status、version IRI、introduced/deprecated、replacement、change note |

Domain 和 Module 没有实例字段时，该行显示“本节点为领域/模块组织节点，不适用实例说明”，不得用其他内容冒充。

### 5.9 禁止静默截断

当前代码在关系、字段、公理、individual、adapter、class、source 等多处使用 `.slice(0, N)`。升级后：

- 数据查询层返回全部结果和总数；
- 初始 DOM 可只展开前 N 项，但必须显示“已显示 N / 共 M 项”；
- 提供原位按钮“展开全部（共 M 项）”和“收起”；
- 展开仍发生在同一表格单元格；
- 搜索、复制和可访问性树能访问展开后的所有项；
- 测试中禁止无 disclosure 元数据的 `.slice(0,`。

### 5.10 关系案例高亮

主案例入口放在根节点或相关节点的“主案例片段”行，不放进 header tab。点击“高亮此案例”后：

- 保留当前唯一图谱；
- 图中存在的 case nodes/relations 高亮；
- 尚未展开的 step 以“下一步 +N”提示，不自动一次展开全图；
- 详情表显示当前 step 解释；
- 退出高亮恢复原图，不改变 canonical data。

## 6. 精确 UI 文案修改

### 6.1 现有中文文案逐行替换

修改 `src/App.tsx:334-518`，后续迁入 `src/i18n/ui-text.ts`：

| 当前 key | 当前中文 | 新中文 |
|---|---|---|
| `title` | 本体查看器 | 本体查看器（保持不变） |
| `viewer` | 查看器 | 查看器（保持不变） |
| `searchPlaceholder` | 类、模块、平面、来源 | 领域、模块、概念、关系、来源、案例 |
| `structure` | 结构 | 本体图谱 |
| `hierarchy` | 根节点语义邻域 | 逻辑层级与语义关系 |
| `classes` | 类 | 概念 |
| `objectProperties` | 关系谓词 | 语义关系 |
| `dataProperties` | 数据字段 | 结构字段 |
| `planeContents` | 平面内容 | 领域内容 |
| `relations` | 与当前根节点相关的类间关系 | 当前节点的入边与出边 |
| `scalarFields` | 当前根节点可用的字面量字段 | 当前节点的结构字段与约束 |
| `browseLogs` | 浏览本体记录 | 本体规模 |
| `ontologicalCharacteristic` | 本体特征 | 节点与关系详细信息 |
| `metaInformation` | 元信息 | 来源与治理信息 |
| `instanceClassification` | 实例分类 | 逻辑定位 |
| `hasPart` | 组成部分 | 直属下位节点 |
| `containsClasses` | 包含类 | 直属概念 |
| `relationPredicates` | 关系谓词 | 语义关系 |
| `literalFields` | 字面量字段 | 结构与约束 |
| `canonicalOwner` | 规范归属域 | 规范归属领域 |
| `participatingPlanes` | 参与域 | 关联领域 |
| `individuals` | 个体 | 实例说明 |
| `adapterMapping` | 适配映射 | 外部映射 |
| `graphEmptyTitle` | 没有可展示的图谱 | 图谱层级数据不完整 |
| `graphEmptyBody` | 没有可展示的下一级节点或关系…… | 当前节点缺少可解析的上位归属、下位概念或语义关系，请检查 canonical 层级数据。 |

“本体规模”数字绑定同步改为：旧 class 数 → `metrics.concepts`；旧 object property 数 → `metrics.semantic_relations`；旧 individual 数 → `metrics.instance_examples`；旧 data property 数 → `metrics.structure_fields`；旧 axiom 数 → `metrics.constraints`。`controlled_values` 和 `source_claims` 增加为同一区域的可选统计，不新建页面。不得继续显示 legacy `individuals=80` 让用户误以为存在独立实例层。

### 6.2 新增中文 key

```ts
logicalPosition: "逻辑定位"
primaryParent: "直接上位概念"
additionalParents: "其他上位概念"
directChildren: "直接下位概念"
definitionBoundary: "定义与边界"
whyNeeded: "为什么需要"
includes: "包含"
excludes: "不包含"
incomingRelations: "入边"
outgoingRelations: "出边"
engineeringExplanation: "工程解释"
positiveExamples: "正例"
counterexamples: "反例与边界例"
instanceExamples: "实例说明"
structureConstraints: "结构与约束"
validationRules: "公理与验证"
caseFragments: "主案例片段"
sourceClaims: "来源与引用"
maturityChanges: "成熟度与变更"
showAll: (total: number) => `展开全部（共 ${total} 项）`
showingCount: (shown: number, total: number) => `已显示 ${shown} / 共 ${total} 项`
collapseList: "收起"
focusNode: (label: string) => `已选择：${label}`
focusRelation: (label: string) => `已选择关系：${label}`
backToNode: "返回节点说明"
highlightCase: "在当前图谱中高亮此案例"
clearCaseHighlight: "退出案例高亮"
expandAdjacentNodes: (count: number) => `展开相邻节点（+${count}）`
syntheticExample: "合成示例"
realExample: "真实记录引用"
notApplicable: "不适用"
```

### 6.3 英文和日文必须同步修改

关键新英文：

```text
Ontology Viewer
Viewer
Ontology graph
Logical hierarchy and semantic relations
Concept
Node and relation details
Logical position
Direct broader concept
Additional broader concepts
Direct narrower concepts
Definition and boundary
Why this concept is needed
Structure and constraints
Positive examples
Counterexamples and boundary cases
Instance examples
Case fragment
Source claims
Maturity and change history
```

关键新日文：

```text
本体ビューア
ビューア
本体グラフ
論理階層と意味関係
概念
ノードと関係の詳細
論理的位置
直接上位概念
その他の上位概念
直接下位概念
定義と境界
この概念が必要な理由
構造と制約
正例
反例と境界例
インスタンス例
主要ケース断片
出典主張
成熟度と変更履歴
```

所有实体 label、definition、example 正文必须来自 canonical；`src/i18n/ui-text.ts` 只保存界面词，禁止再放实体 ID override 或词级拼接翻译。

### 6.4 kind 可见名称

| 内部 kind | 中文 | 英文 | 日文 |
|---|---|---|---|
| domain root | 本体 | Ontology | 本体 |
| plane | 领域 | Domain | ドメイン |
| module | 模块 | Module | モジュール |
| class | 概念 | Concept | 概念 |

内部 JSON 字段可以继续叫 `plane/class` 保持兼容，但外部呈现不再把 Concept 误读成具体 instance。

## 7. 单一真相源和生成流程

### 7.1 逻辑上一个图，物理上按 Module 审查

建议的可维护 source 结构：

```text
ontology/source/
  agent-ontology.product.json
  runtime/*.json
  info/*.json
  memory/*.json
  orchestration/*.json
  tool/*.json
  safety/*.json
  feedback/*.json
  adapter/*.json
```

每个 Module source 文件同时保存该 Module 的 node information、Concept 和 relation；schema/example/source 直接嵌在对应对象。物理拆文件不改变 UI，也不产生另一棵树。

跨 Module relation 也只能落盘一次：默认存放在 `source_id` Concept 所属 Module 的 source 文件中，`is_a` 因 source 恒为 Child，所以由 Child 所属 Module 拥有。组织边由归属派生，不写 relation source。builder 必须以 relation ID 和标准化事实键 `(source_id,predicate,target_id,conditions,temporal_scope)` 双重去重；同 ID 重复或不同 ID 表达同一限定事实都失败。UI 如需显示 `owner_module_id`，只在 runtime index 中由文件位置/`source_id.module_id` 派生，不写入 canonical，不允许人工填写第二份 owner；跨域 relation 仍遵守 source-owner 规则，无例外副本。

独立受控输入 `schemas/source/agent-ontology-artifact-contract.json` 只定义 canonical 文件本身的字段形状、枚举和状态条件，不定义任何领域概念或关系，因此不是第二套本体。根级 `schemas/agent-ontology.schema.json` 和 TypeScript canonical types 由它生成；各 Concept 的 payload Schema、fixture、OWL/SHACL 投影则由节点/边信息生成。构建顺序必须先用 artifact contract 校验可编辑 source 的形状，再构建 output，再用生成的根 Schema 校验 output。禁止从已经生成的数据样本反推一个“刚好能通过”的根 Schema。

在“本体领域语义节点/边内容”范围内，唯一允许人工编辑的是 `ontology/source/**`。另有三类职责不同的人工受控输入：`research/source-registry.csv` 与 living metadata 维护外部证据身份，`schemas/source/agent-ontology-artifact-contract.json` 维护工件结构，RFC/迁移 ledger 维护决策和审计；它们均不得定义或复制 Concept/Relation 事实。应用代码、测试和文档仍按各自职责维护，但不得重新手写 Concept、relation、定义或例子。以下均为生成物：

```text
ontology/agent-ontology.json
ontology/agent-ontology.md
schemas/agent-ontology.schema.json
src/lib/canonical-ontology-types.ts
src/generated/source-index.json
可选 OWL/SHACL/fixture/export
```

前端 internal ViewModel 是运行时从 canonical 计算出的临时投影，不落盘、不被人工编辑，也不反向成为数据源。

生成物必须在文件头或 metadata 中声明：

```text
generated: true
generated_from: ontology/source/**
do_not_edit: true
generator_version: <commit-or-version>
```

### 7.2 构建顺序

```text
1. 读取并校验 `schemas/source/agent-ontology-artifact-contract.json`
2. 读取 product manifest 和 41 个 module source
3. 校验 ID 唯一、plane/module 归属和三语信息
4. 合并 classes 和 relations
5. 建 relation index
6. 校验 is_a 无环、primary parent、multiple parent 冲突
7. 校验 node/edge examples、source claims 和 constraints
8. 迁移/检查 controlled values
9. 读取 `research/source-registry.csv` 与 living metadata，校验 claim 并生成 source index
10. 计算 metrics
11. 生成 canonical JSON 和 Markdown
12. 由 artifact contract 生成根 JSON Schema 与 TypeScript 类型
13. 由 canonical 节点/边信息生成 Concept payload Schema、fixture 和可选语义导出
14. 先用根 JSON Schema 校验 canonical，再运行 unit/integration/E2E
```

构建不得读取上一轮 `ontology/agent-ontology.json` 作为 source。

### 7.3 一次性迁移阶段

为防止同时存在两套可编辑真相，又避免严格新 Schema 提前丢弃尚未语义归位的 legacy 集合，采用“只读基线 + migration-only 输入 + candidate build + 原子切换”：

1. 记录当前 `ontology/agent-ontology.json` 的 SHA-256、各集合 ID 清单和 count，冻结为只读 release baseline；
2. 一次性 bootstrap 写出 41 个 Module source 初稿，并把暂不能无损归位的 `data_properties/individuals/axioms/adapter_mappings/stale definitions` 写入 `ontology/migration/legacy-v1/` 下的 typed ledger；该目录永不进入 UI 或发布 canonical；
3. 每个 legacy record 以 `(source_collection,id,original_json_pointer)` 为键，在 Module source 或 migration ledger 中必须恰好出现一次；`terms/classes`、`relations/object_properties` 的同语义重复记录各自留有迁移证据，但共同指向一个 canonical target；manifest 保存原集合、原 JSON Pointer、dedup decision、目标/待定状态和 payload hash；
4. bootstrap 完成后，builder 永远不再读取旧 generated canonical；后续编辑只发生在 Module source、migration ledger 和受控决策表；
5. Phase 1–4 的新 builder 输出到未发布的 candidate 目录并以严格新 meta-schema 校验；仓库对外仍使用冻结的旧 canonical，禁止混合 old/new 字段；
6. 当 572 Concept、421 relation、102 field、80 individual、657 axiom、adapter mapping 与 definition drift 全部在新 shape 有 accepted 去向后，在一个原子 PR 中同时替换 canonical、根 Schema、generated types/source index、测试和 UI consumer；
7. 原子切换后的 canonical 不包含 `migration_legacy`、`terms/object_properties/data_properties/individuals/axioms/adapter_mappings` 等过渡字段；严格 Schema 使用 `additionalProperties:false`；
8. 删除手写 GraphView 数据链，CI 加入 `build → git diff --exit-code`；任何直接编辑 generated artifact 的 PR 失败；
9. 切换完成后，migration payload 按 RFC 决定删除或只读归档，审计 ledger 保留；它们永远不能重新成为运行时 source。

这允许暂时存在两个**只读输出版本**（旧 release 与新 candidate），但始终只有一套可编辑的新语义 source；不允许出现两个可编辑 canonical。

## 8. 逐文件、逐段修改计划

### 8.1 新增 RFC 0005

新增 `docs/rfcs/0005-unified-concept-hierarchy-and-node-information.md`，必须包含：

```text
# RFC 0005: Unified Concept Hierarchy And Node Information
Status: proposed
Supersedes presentation implications in RFC 0001/0002/0004
Decision 1: retain eight Domains and adapter-plane
Decision 2: Domain→Module→Concept is the sole navigation hierarchy
Decision 3: Concept→Concept is_a expresses general-to-specific logic
Decision 4: schema/instance/example/source/governance are node/edge information
Decision 5: machine artifacts are generated, not parallel products
Decision 6: one canonical graph and one editable source
Decision 7: main cases highlight existing graph paths
Acceptance criteria: use this plan sections 1 and 17
```

RFC 0005 通过前，不实施大规模 572 Concept 重排。

### 8.2 `docs/rfcs/0001-ontology-layers.md`

不篡改历史决策正文；在 metadata 后新增：

> **2026-07-13 clarification:** RFC 0005 clarifies that Core/Profile/Adapter are ownership and applicability annotations only. They do not define a competing user navigation hierarchy. The canonical Explorer retains `Agent Ontology → Domain → Module → Concept`, including `adapter-plane` as a first-level Domain.

在 Consequences 后追加：

> Generated views are machine projections of the same canonical node/edge information. They are not independent ontology pages, graphs, or editable truth sources.

### 8.3 `docs/rfcs/0002-canonical-schema-contract.md`

在 Contract Direction 后新增：

> Structural and semantic validation responsibilities may differ internally, but all constraints presented to users remain attached to the corresponding canonical node or relation under “Structure and constraints”. No Schema node family or Schema navigation page is introduced.

将“Required Schema Families”解释为 information families，不得在 UI 中成为 node buckets。

### 8.4 `docs/rfcs/0004-phase-1-schema-workplan.md`

替换 Frontend gate：

当前：

> The explorer renders a non-empty graph, inspector, evidence ledger, schema view, statechart view, and adapter map.

新文案：

> The explorer renders one non-empty canonical concept graph and one inline node/relation characteristics table. Schema constraints, examples, instances, evidence, statechart annotations, and adapter mappings appear only as information attached to the selected canonical node or relation; no competing graph or page is required.

### 8.5 `docs/design/ontology-explorer-art-direction.md`

精确操作：

- Visual Thesis 增加“one graph, one hierarchy, inline information”；
- Component Inventory 中 `Topbar: brand, view tabs, exports` 改为 `Topbar: brand, language, theme, export`；
- 删除 `Inspector` 和 `Detail panels` 两项；
- 增加 `Inline characteristics: hierarchy, definitions, relations, examples, structure, sources, mappings, changes`；
- Interaction Principle 1 改为“点击节点更新同页特征表；显式展开才改变拓扑”；
- 删除 Desktop Schema Contract wireframe；
- Desktop Atlas 改为 header + left tree + one graph + inline characteristics；
- Mobile 只按上述四块垂直排列；
- 增加禁止项：“No ABox/TBox/Schema/Instance routes, tabs, inspectors, or parallel graphs.”；
- Reference Library 中 React Flow 仅保留历史参考，实际引擎标明 Cytoscape + fCoSE。

### 8.6 `docs/governance/source-and-schema-governance.md`

新增 Single Graph Governance：

```text
- A source claim is attached directly to the node, relation, field, constraint, or example it supports.
- Plane-wide sources must not be inherited as direct class evidence.
- Generated schemas and fixtures must carry the canonical node/relation IDs they were generated from.
- No hand-written GraphView may participate in release validation.
- UI navigation surfaces are not ontology products and cannot own semantic truth.
```

Release Gate 增加：

- canonical JSON validates against its actual Schema；
- all published concepts have a path to Module root；
- all `is_a` edges pass the seven-question review；
- schema/example/source annotations never enter graph elements；
- single-page/no-competing-tab E2E passes。

### 8.7 `research/agent-ontology-hierarchical-closure-audit-zh.md`

按 2.4 完成文案校正；在标题后新增：

> **方向修订说明（2026-07-13）：** 本报告的量化诊断和逐模块缺口仍有效；关于将八个 Domain 降为 views、将 Adapter 移出一级结构、以及以 TBox/ABox/Governance 拆分用户呈现的建议，已由 `docs/design/agent-ontology-unified-graph-upgrade-plan-zh.md` 修订和取代。

### 8.8 `ontology/agent-ontology.json`

按以下顺序迁移：

1. 增加 root/plane/module/class/relation 信息合同；
2. 增加真实 `is_a` relation；
3. 修复关系端点和方向；
4. 迁移 data properties 到 class structure；
5. 迁移 individuals；
6. 迁移 axioms；
7. 迁移 adapter mappings；
8. 删除重复数组；
9. 重新计算 metrics；
10. status 改为 `draft-hierarchy-upgrade`，通过所有 gate 后才发布新 version IRI。

不得直接手改该生成文件；上述步骤发生在 `ontology/source/**`、migration-only ledgers 和 generator candidate output。1–9 未全部完成前，不覆盖当前发布 canonical；首次提交新 shape 时按 7.3 原子切换，不允许 persistent old/new 混合字段。

### 8.9 `ontology/agent-ontology-definitions.json`

- 先把 1914 条定义按 ID 合并到唯一 source node/relation；
- 生成 1882 canonical 实体对账表，处理 32 条陈旧项；
- 对 507 个 source set 漂移逐条选择 canonical claim；
- 修复中文/日文串义；
- 三语 labels、short definitions、formal definitions、why needed、examples 全部进入 node/edge；
- 完成后删除手工定义账本；如需导出，改为 generated read-only ledger。

### 8.10 `scripts/expand-agent-ontology.mjs`

该脚本不做增量修补，重构为确定性 builder：

- 删除读取 `ontology/agent-ontology.json` 的入口；
- 删除标签关键词推断 kind；
- 删除按字母序自动造 contains/relates/emits_event；
- 删除自动造 module data properties；
- 删除 plane/module individuals；
- 删除自然语言 statement 冒充 axiom；
- 删除 `terms=classes`、`relations=object_properties` 复制；
- 增加 source module loader；
- 增加 `buildIndexes`、`validateHierarchy`、`validateNodeInformation`、`validateRelations`、`computeMetrics`；
- 输出 canonical JSON、Markdown 和 machine exports；
- 输出必须排序稳定，同一输入连续两次 build byte-identical。

建议将脚本改名 `scripts/build-agent-ontology.mjs`；保留旧命令一个 release，打印 deprecation warning 后调用新 builder。

### 8.10A `schemas/source/agent-ontology-artifact-contract.json`

新增该人工评审、版本化的 meta-schema source，职责仅为描述 canonical artifact 的 JSON 形状：

- 固定 `$id`、contract version、支持的 canonical major version；
- 定义 localized text、status、semantic kind、source claim、field、constraint、example、Plane、Module、Concept、Relation、CasePath 与 metrics 的结构；
- 表达 accepted/draft 的结构条件，但不枚举 Moonweave 的具体 Concept/Relation ID；
- 不含任何领域定义、例子、来源 claim 或 Module 清单；
- 由 generator 规范化输出 `schemas/agent-ontology.schema.json` 和 `src/lib/canonical-ontology-types.ts`；
- 修改必须由 architect + schema reviewer 审核并产生 contract changelog；breaking change 提升 contract major；
- 测试先用它验证每个 module source 的 shape，再验证合并 candidate，最后验证生成 canonical；坏 canonical 数据不得影响该 contract 的生成结果。

这份文件是数据容器合同，不是 TBox 页面、第二概念树或第二领域真相源。

### 8.11 `schemas/agent-ontology.schema.json`

整体替换当前 `artifact_type=GraphView` schema，验证 4 节的真实 canonical root；该文件由独立的 `schemas/source/agent-ontology-artifact-contract.json` 生成，不从 canonical 数据内容反推，也不手改。meta-schema source 必须版本化、code reviewed，并先验证 editable module source，再验证生成 output。`$defs` 至少包含：

```text
localizedText
sourceClaim
example
fieldConstraint
nodeConstraint
plane
module
concept
relation
casePath
reviewStatus
semanticKind
cardinality
```

关键 Schema 规则：

- `additionalProperties: false`；
- root/Plane/Module/Concept 统一使用 `labels/definitions/examples`，禁止 canonical 单数 `label/definition` 或 `engineering_examples`；
- 三语 labels/definitions 在 accepted 状态必填；
- accepted Concept 至少一 source claim、一 positive example、一 counterexample/boundary；
- relation source/target 结构上为非空 ID，引用完整性由集成测试验证；
- `primary_parent_relation_id` 可空，仅 root Concept 允许为空；
- examples 中 `kind=case-fragment` 时 `scenario_id` 必填；
- `is_a` 的 relation_kind 必须为 hierarchy；
- `inverse_reading` 只能包含 predicate/三语 labels，不得引用第二个 relation ID；
- `is_a`/组织关系的 `cardinality` 必须为 `null` 且 `cardinality_not_applicable_reason` 三语完整；实例语义关系若 `cardinality` 非空则不得同时填写 N/A reason；
- `case_paths.steps[]` 只能引用唯一 `case-fragment` example 和可选 traversal relation，不得复制 node/explanation；
- `schema/example/source` 不定义任何 graph-node discriminator。

该严格新 Schema 在 Phase 1–4 先验证 candidate；直到 migration manifest 100% 清空并原子切换时才替换当前发布 Schema。旧 canonical 只由冻结的旧 Schema 验证，任何过渡 `migration_legacy` 字段都只能存在 migration-only 输入，不能为了兼容而加入新发布 Schema。

### 8.12 `src/App.tsx`

可见 DOM 大框架保留，只做内部抽取：

- 保留 page shell、header、left directory、content、graph、characteristics；
- 删除本地 canonical interface 和 `as unknown as AgentOntology`；
- 删除实体 label override 和词级实体翻译；
- 删除 maturityForPlane/maturityForClass 推断；
- 删除 substring/statement 猜关联；
- 同时加载 generated canonical 与 `src/generated/source-index.json`，禁止浏览器运行时解析 CSV 或把 registry metadata 手抄进 `uiText`；
- 采用 5.2 的五类 root/focus/directory-expand/graph-expand state；
- `App` 最终只组合数据索引、状态和三个现有视觉区域；目标小于 400 行；
- 组件抽取不得改变页面路线或大框架布局。

### 8.13 新增前端内部文件

这些是代码维护文件，不是新页面：

| 文件 | 唯一职责 |
|---|---|
| `src/lib/canonical-ontology-types.ts` | 由 canonical artifact contract 生成的 TypeScript 类型；禁止手改 |
| `src/lib/ontology-index.ts` | ID、归属、父子、入边/出边、source、constraint、example、mapping 索引 |
| `src/lib/ontology-view-model.ts` | 从 graph root/expanded/focus 计算唯一可见 graph 和详情 |
| `src/components/OntologyDirectory.tsx` | 递归目录，支持任意 Concept 深度；多父只按 primary path 放置一次 |
| `src/components/OntologyGraph.tsx` | Cytoscape、fCoSE、方向、多边、focus/expand 和键盘交互 |
| `src/components/OntologyCharacteristics.tsx` | 同一节点/边详情表 12 行 |
| `src/i18n/ui-text.ts` | 只保存界面词，不保存实体语义 |
| `src/generated/source-index.json` | 由 source registry/living metadata 生成的只读前端来源索引，含 registry fingerprint；禁止手改 |

`ontology-view-model` 必须有断言：

```ts
schemaFieldNodeCount === 0
exampleNodeCount === 0
sourceClaimNodeCount === 0
constraintNodeCount === 0
```

`App`/`ontology-index` 的输入明确为 `canonicalOntology + generatedSourceIndex`；节点只保存 `source_claims[].source_id/supports/locator`，title/year/type/priority/URL 从 source index 连接。source index 复制的是外部资料展示 metadata，不复制节点 claim，也不参与图节点构造。CI 必须比较其 `registry_fingerprint` 与 CSV/living metadata 当前字节指纹，漂移即失败。

### 8.14 `src/data/ontology.ts`、`src/lib/types.ts`、`src/lib/graph.ts`

- 停止手写 12 artifacts/8 relations 的 GraphView；
- 所有相关测试迁至 canonical 后删除 `src/data/ontology.ts`；
- `src/lib/types.ts` 的 public `OntologyDataset/GraphIr` 第二产品模型删除；
- 内部 render node/edge type 移至 `ontology-view-model.ts`，明确 `internal`；
- `src/lib/graph.ts` 被 `buildVisibleConceptGraph` 取代，或删除；
- `hasHiddenChainOfThoughtField` 可移到 canonical validator 继续保留。

### 8.15 `src/lib/schemaValidation.ts` 和 profiles

- `validateOntologyDataset` 改名 `validateCanonicalOntology`；
- 输入直接是 `ontology/agent-ontology.json`；
- `src/profiles/zodProfile.ts` 删除当前手写 `OntologyArtifact/GraphView/ConversionWarning` union；若保留该文件，只能导出从 canonical Concept `structure` 生成 Zod profile 的纯函数，不保存实体或 source IDs；
- `src/profiles/semanticExports.ts` 保留通用 namespace 常量，删除静态 `TrustBoundaryShape` 等领域事实，改为从 canonical class/relation/constraint/source claim 生成 JSON-LD/OWL/SHACL 的纯函数；
- `src/profiles/conversionWarnings.ts` 中两条手写 warning 迁入相应 Adapter Concept 的 `examples/constraints/external_mappings` 后删除；需要消费 warning 时由 ontology index 按 `node_id/relation_id/field_id` 派生；
- Zod/Pydantic/semantic export 只从 canonical 信息生成；conversion warning 只关联 canonical `node_id/relation_id/field_id`；
- 任何 profile 输出都不进入 UI navigation。

### 8.15A 旧 GraphView 测试与 fixture 的逐文件迁移

- `tests/source-gate.test.ts` 删除对 `adapterSpecs/ontologyDataset/conversionWarnings` 的 import；改为递归遍历 canonical root、Plane、Module、Concept、Relation、field、constraint、example、mapping 的 `source_claims`，并同时校验 generated source index 与 living metadata；RFC accepted 状态测试保留；
- `fixtures/valid/agent-ontology.v1.json` 重写为最小新 canonical：一个 root、一个 Plane、一个 Module、父/子两个 Concept、一条 Child→Parent `is_a`、内嵌 field/example/source claim；不再出现 `artifact_type=GraphView`；
- `fixtures/invalid/missing-trust-boundary.json` 不再伪装成旧 GraphView；若测试的是边界约束，改为一个跨 trust-boundary relation 缺 boundary context 的新 canonical 负例，并让预期错误精确指向 relation ID；
- `tests/schema-validation.test.ts` 使用上述新正/负 fixture 和真实 generated canonical；
- `tests/graph.test.ts` 使用最小 canonical fixture，断言只构造 root/Plane/Module/Concept 节点；
- `tests/live-force.test.ts` 仅在其 DOM contract 仍适用时保留；不得让它重新引入旧 GraphView 类型；
- 迁移这些消费者并确认 `rg "src/data/ontology|OntologyDataset|artifact_type.*GraphView" src tests fixtures` 仅在明确的 migration rejection fixture 中命中后，才删除 `src/data/ontology.ts`。

### 8.16 `src/styles/app.css`

保留当前视觉语言、single-column content 和 responsive layout；只新增：

```text
.is-focused-node
.is-primary-parent-edge
.is-additional-parent-edge
.is-incoming-edge
.is-outgoing-edge
.is-focused-edge
.detail-disclosure
.detail-count
.source-claim-link
.schema-field-table
.example-positive
.example-counterexample
.case-path-highlight
.sr-live-selection
```

内部可拆为 `shell.css/tree.css/graph.css/characteristics.css`，但视觉回归基线除新增状态外不得变化。

### 8.17 `e2e/ontology-explorer.spec.ts`

原样保留：

- 单页 graph 非空；
- 无 `.viewer-nav`、`.filter-group`、`.inspector-panel`、`.catalog-section`；
- 语言/主题全局；
- sticky 左目录；
- mobile 无水平溢出；
- canonical 三语定义；
- FIBO-like single-column table。

替换测试：

```text
"hides the graph surface when ... no visible relations"
```

改为：

```text
"keeps the parent hierarchy visible for a semantic leaf concept"
```

新断言：叶节点 canvas 存在，当前节点和 primary parent 可见，至少一条 hierarchy edge。

### 8.18 README 和命令

同步修改 `README.md`、`docs/README.zh.md`、`docs/README.ja.md` 和其他对 Explorer 架构作出承诺的入口文档；不得只改中文版本。英文主 README 统一写：

> Moonweave exposes one canonical ontology graph. Definitions, structure constraints, examples, instances, source claims, mappings, and governance are information attached to canonical nodes and relations.

中文说明统一为：

> Moonweave 对外呈现一张 canonical Agent Ontology 图谱。定义、结构约束、实例、正反例、来源声明、映射和治理信息均附着在对应节点或关系上，不另建平行本体或浏览页面。

日文说明表达同一合同，不得保留“Schema view”“ABox view”或多工作台路线。所有“类数量”“关系数量”“实例数量”“公理数量”改为读取生成的 metrics；README 不再手写会漂移的数字。

`ontology/agent-ontology.md` 改为生成文件，并按 `Domain → Module → Concept → Subconcept` 顺序输出。每个 Concept 的定义、边界、结构、实例和来源紧随该 Concept，禁止生成“全局 Schema 章”“全局 Instance 章”或把同一关系再抄成第二份目录。文件顶部写入 source fingerprint、generator version 和 `generated_at` 元数据；`generated_at` 必须取 `SOURCE_DATE_EPOCH`，未设置时取 product manifest 中已纳入 source fingerprint 的 release date，禁止调用 wall-clock `now()`，从而保证同输入 byte-identical。canonical JSON、source index 和所有 export 使用同一规则；人工编辑生成文件必须在构建时失败。

`package.json` 建议命令：

```json
{
  "ontology:build": "node scripts/build-agent-ontology.mjs",
  "ontology:validate": "vitest run tests/schema-validation.test.ts tests/ontology-artifact.test.ts tests/ontology-taxonomy.test.ts tests/ontology-information.test.ts tests/ontology-relations.test.ts tests/ontology-controlled-values.test.ts tests/ontology-generator.test.ts tests/source-registry.test.ts tests/source-gate.test.ts tests/graph.test.ts tests/ontology-view-model.test.ts",
  "ontology:check-generated": "npm run ontology:build && git diff --exit-code",
  "test:ontology-ui": "playwright test e2e/ontology-explorer.spec.ts"
}
```

不用 `tests/ontology-*.test.ts`，因为 Windows npm shell 不保证展开 glob。CI 在 Windows 和 Linux 各运行一次 `npm run ontology:validate` smoke test；任一显式文件改名时必须同步修改 script，找不到测试文件应非零退出。

### 8.19 来源登记文件

修改 `research/source-registry.csv`：

- 沿用现有列 `id,corpus,area,title,url,year,source_type,priority,status,why_it_matters,source_file`；本轮不另造一套 `authors_or_org/authority_tier/accessed_at` 列；
- 保留现有稳定 `id`，不得因标题格式调整而重编号；
- 复核并复用现有 `eng-ont-palantir-overview`、`eng-ont-palantir-core-concepts`，不得再建第三个含义相同的 Palantir 根记录；
- 新增 `eng-ont-microsoft-fabric-iq-ontology`，URL 使用 `https://learn.microsoft.com/en-us/fabric/iq/ontology/overview`，标题使用页面当前标题 `What is ontology (preview)?`，`source_type=official-doc`、`priority=A`，并在 `why_it_matters` 中只记录 entity type、property、typed directional relationship、constraint 和 graph representation 可支持的信息合同；
- 新增 `eng-ont-skan-agentic-ontology-of-work`，URL 使用 `https://www.skan.ai/whitepapers/agentic-ontology-of-work`，标题使用 `AI Agents Needed a Common Language. So We Built One.`，`year=2026`、`source_type=vendor-whitepaper`、`priority=B`，并说明它支持 canonical entity、attribute、relationship、governance constraint、lifecycle example 等参考模式，但不是中立标准；
- 在来源类型 validator 和 `research/source-registry.md` 的受控词表中新增 `vendor-whitepaper`，定义为“由产品厂商发布、包含技术/方法论主张但未经独立标准组织或同行评审背书的白皮书”；不得把它折叠到 `paper` 或 `standard`；
- Palantir 与 Microsoft 记录标为产品/官方工程文档，Skan 记录标为厂商白皮书，不把三者伪装成同行评审论文；
- 三项资料的 `source_file` 都指向 `research/source-notes/cross-domain-ontology-pattern-review.md`，并在该笔记中各加一个“不支持什么”段落：产品实现不是 FIBO/OWL 规范、厂商白皮书不是学术共识、外部页面的信息架构不等于 Moonweave 必须复制其页面布局；
- `why_it_matters` 只描述其可支持的设计主张，例如“对象/属性/关系组成统一语义层”“typed directional relationship 具有属性与基数规则”“canonical entities 的属性、关系、约束和案例共同解释工作”，不得写成超出原文的结论；
- 对 2022–2026 年论文继续记录 DOI/arXiv/出版社永久链接，并区分同行评审版本与预印本；若同一工作有正式版本，只让正式版本承担主要 claim；
- URL、标题、来源类型或优先级缺失时，validator 必须失败；`year` 对 living official doc 可为 `current`，但论文不得为空；不允许用 Plane 级来源替 Concept 补位。

修改 `research/living-source-metadata.csv`：

- 沿用现有列 `id,area,title,source_type,priority,url,normalized_class,normalized_version_or_date,last_checked,normalization_status,note`；
- 只存会持续变化的官方文档/厂商页面版本、最后核验时间和规范化状态；若需要内容指纹，先通过 RFC 给现有表加 `content_fingerprint`，不得临时把它塞进 `note`；
- 复核现有两条 Palantir 行，并为 Microsoft/Skan 新增与 registry 同 ID 的行；本轮计划基线的 `last_checked` 为 `2026-07-13`，实施日若更晚则使用真实核验日；
- `normalized_class` 统一为 `living-doc`，`normalized_version_or_date` 写“页面标题 + preview/current 状态 + checked 日期”，`normalization_status=normalized`；
- 每次发布前运行 link check；页面迁移时更新 URL，但保留 source ID 和历史别名；
- 该文件负责“资料是否仍可访问”，`source-registry.csv` 负责“资料是什么”，二者不得互相复制全文元数据。

新增 `tests/source-registry.test.ts`，至少断言：所有 `source_claim.source_id` 可解析到 registry 的 `id`；`priority` 与 `source_type` 为受控值；URL 可解析；living 表与 registry 的同名 ID/URL 一致；generated source index 的 registry/living fingerprint 与当前 CSV 字节一致；同一 claim 不会因 Plane 继承被冒充为 Concept 直接证据；source index 不复制 node-level `supports/locator`；上述三类用户指定资料均已登记且由至少一个明确设计 claim 引用。

## 9. 572 Concept 逐项迁移工作表

### 9.1 必须先建立迁移账本

新增 `research/ontology-concept-hierarchy-migration-ledger.csv`。当前 572 个 Concept 必须一概一行，不允许批量默认通过。

精确列：

```text
concept_id,current_plane_id,current_module_id,current_kind,
decision,proposed_kind,primary_parent_relation_id,additional_parent_relation_ids,
target_plane_id,target_module_id,convert_to_field_id,convert_to_allowed_value_of,
merge_into_id,replaced_by_id,definition_action,example_action,source_action,
required_new_relation_ids,rationale,reviewer,review_status
```

`decision` 只能为：

```text
keep_root
keep_reparent
retype
move_owner
convert_to_field
convert_to_controlled_value
merge
split
deprecate
remove_invalid
```

门禁：572/572 行必须有 decision、rationale、reviewer、review_status；`accepted` 之前不得自动生成 `is_a`。

### 9.2 新锚点命名说明

以下表中以 `+` 开头的名称是**拟新增的上位锚点候选**。它们是升级任务的明确工作项，不是已经批准的产品真相。新增前必须补：定义、区分特征、父概念、至少两条独立权威来源或一条规范来源、正反例和 reviewer。未通过审查时，使用现有最一般 Concept 作为临时 root，不得为了层数硬造节点。

## 10. 41 个 Module 的具体升级清单

### 10.1 Runtime Domain

| Module | 建议的内部层级骨架（左侧更一般） | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `runtime-system` | `AgentSystem`; `RuntimeEnvironment → Container/WorkingDirectory`; `RuntimeSession → RunAttempt`; `+SessionLifecycleEvent → SessionStart/Pause/Resume/EndEvent` | `SessionLifecycle` 改为生命周期说明或 controlled state，不与 event 并列；`EnvironmentVariable` 迁为 RuntimeEnvironment 的结构字段/值对象；补 System hosts Session、Session has Attempt、Attempt occursIn Environment、Attempt consumes Budget、event changes session state；RunOutcome 不作为 RunAttempt 子类，使用 produces 关系 | 从 AgentSystem 可沿关系到 Session→Attempt→Outcome；四类 lifecycle event 均有共同父；pause/resume/terminate 有合法状态转换和反例 |
| `runtime-actors` | `+Actor → +HumanActor → User/Developer/Reviewer/HumanOperator`; `+SoftwareActor → AgentActor/ExternalServiceActor/SystemServiceActor/ToolServiceActor`; `+Model → Generative/Embedding/RerankerModel`; `+RoleBinding`; `+CapabilityBinding`; `+AuthorityBinding` | `Orchestrator/Subagent/Worker` 不在此复制，跨域引用角色；ModelActor 不再作为所有模型的必然父，模型与 Actor 通过 uses/hosts；`RemoteAgentReference` 保持 Reference 而非 Agent 子类；现有 Actor*Binding 统一父锚；补 Actor bears Role/Capability/Authority | 每个人类/软件主体有真实父链；模型与 actor 不再混型；给定 Actor 能查到 role/capability/authority 而不复制概念 |
| `runtime-observability` | `+ObservabilityRecord → TraceRecord/AuditRecord/AgentTranscript`; `TraceRecord → TraceSpan → TraceEvent`; `+StateRecord → StateSnapshot/StateDiff/Checkpoint`; `+TraceMetadata → TraceContext/TraceLink/SpanAttribute/SpanStatus` | `CommandExecution` 作为 activity，通过 observedBy/recordedIn 连接 Trace，不作为 record 子类；CheckpointRestore/Replay 为 event；RetentionPolicy 是 specification；补 span start/end、parent/link、status、sampling/retention、TraceEvent belongsTo Attempt/Actor；ObservableSummary derivedFrom Trace | 任一 TraceEvent 可追到 span/trace/run/actor；Checkpoint 可追到 snapshot 和 restore event；raw trace 与 evaluation/feedback 明确分离 |
| `runtime-artifacts` | `Artifact → ExportArtifact/PatchArtifact/ReportArtifact/GraphArtifact/SchemaArtifact` | `DraftArtifact`、`FinalArtifact` 迁为 `Artifact.status.allowed_values`，除非审查证明它们有额外本体语义；补 version、format、generatedBy、usedBy、derivedFrom、reviewedBy、addressesTask；Artifact revision 不可原地覆盖 | 所有 artifact subtype 都能回到 Artifact；每个 example 有 producer/version/status；Draft/Final 不再造成伪 `is_a` |

### 10.2 Info Domain

| Module | 建议的内部层级骨架 | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `info-container-command` | `+ExecutionObservation → CommandOutputObservation/ExitStatusObservation`; `+OutputChunk → StandardOutputChunk/StandardErrorChunk`; `+ExecutionReference → ExecutionResultReference/WorkingDirectoryReference/EnvironmentBindingReference` | `CommandExitStatus` 与 `ExitStatusObservation` 去重：状态值迁 field，观测保留 Concept；Command 行为归 Tool，通过 observes/producedBy 连接；`ContextIngressEvent` 明确为 event；补 stdout/stderr chunks partOf stream、observation references attempt/result | 从 ToolCallAttempt 可沿 result→observation→stdout/stderr/exit status 完整查询；无行为类被误放为信息子类 |
| `info-output-disclosure` | `+OutputInformation → OutputStream → OutputSegment → OutputChunk`; `OutputWindow → HeadTailWindow/VisibleContextWindow`; `+DisclosureArtifact → DisclosedOutputSegment/SuppressedContext/TruncatedContextSpan`; `ContextSelectionDecision/DisclosureStage` 独立 | `LengthLimit` 迁为 OutputWindow field；ProgressiveDisclosure 只在 Safety 有 canonical owner，本模块通过 relation 引用；补 request→selection/decision→window→disclosed/suppressed output→citation/audit | 给定输出可查为何显示/截断/抑制、显示给谁、引用何处；字段和状态不再作为伪类 |
| `info-storage-sources` | `SourceReference → File/DatabaseRow/GraphNode/Network/TextDocumentReference`; `SourceLocation → Line/Page/Cell/Offset/Span`; `+SourceIdentity → SourceVersion/ContentDigest/SourceChecksum`; `SourceProvenance/CitationAnchor/SourceAnchor` | 明确 Reference→Referent：FileResourceReference→FileResource 等；`DataZoneReference` 与 DataZone 只保留清晰 reference 关系；AccessPath/ResourceDescriptor 作为信息对象；TrustBoundaryReference 不替代 Safety TrustBoundary；补 version/location/checksum/provenance | 六类 reference 均能解析到 referent/location/version；删除重复 belongs-to-data-zone 语义；每个 source example 可定位到原内容 |
| `info-content-block-modality` | `ContentBlock → TextBlock/CodeBlock/ImageBlock/AudioBlock/TableBlock/StructuredDataBlock/FileAttachmentBlock`; `MessageContentBlock` 通过 partOf/usedIn，不作为必要子类 | `Encoding`、`MimeType`、`TokenCount` 迁入 ContentBlock fields；`MessageModality` 迁 controlled value；补 containsBlock、transcodedFrom、transcribedAs、locatedAtSourceSpan；不得自动把 AudioBlock 连到 TraceEvent | 所有 modality subtype 能读成“是一种 ContentBlock”；每种至少一正例/反例；schema 展示 encoding/mime/token 而图中无这些影子节点 |
| `info-messages-instructions` | `Message → User/System/Developer/Assistant/ToolResult/ToolObservation/ExternalAgentMessage`; `+ConversationElement → Conversation/ConversationTurn/MessageHistory`; `Instruction → SystemPrompt/InstructionOverride/TrustedInstructionOverride(跨域引用)`；`+InstructionMetadata → Authority/Priority/Scope/Applicability/Provenance`; `ContextPackage` 独立 information artifact | `ConversationId/ThreadId/TurnIndex` 迁 fields；MessageSender/Receiver/Role 改 role/value 或 relation；ReplyTo 改 relation；PromptVariable 为 PromptTemplate field/value object；`InstructionConflict` canonical owner 只在 Safety，本模块引用；补 envelope contains message、message carries content/instruction、reply/correlation | 消息 subtype 完整；Conversation→Turn→Message 可顺序查询；instruction 冲突无双归属；ID/index 不作为概念节点 |
| `info-indexing` | `+DiscoveryIndex → LightIndex`; `+DiscoveryResult → SearchResult/RetrievedCandidate/RetrievedContextCandidate`; `+DiscoveryScore → SearchScore/RetrievalScore`; `IndexPointer/IndexVersionReference`; `CandidateRank` 为 measurement/value | 保留该 Module 作为轻量信息发现，不复制 Memory 的持久索引；通过 indexes/references 映射 Memory IndexVersion；补 query→index→result/candidate→score/rank→selection；`LightweightRetrievalTrace` 连接 Runtime Trace | Info discovery 和 Memory retrieval 有明确边界说明；所有候选有 query/index version/score；没有同义 Score 重复定义 |

### 10.3 Memory Domain

| Module | 建议的内部层级骨架 | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `memory-ingestion` | `+IngestibleResource → FileResource/DirectoryResource/Database/DatabaseTable/DatabaseRow/GraphStore/GraphNode/GraphEdge/TextCorpus/Document`; `+IngestionComponent → DocumentLoader/IngestionPolicy`; `IngestionRun`; `SourceAttachment`; `DeduplicationEvent` | 泛型 `Resource` 改为该域明确的 Stored/IngestibleResource，避免与 Tool capability resource 混淆；FileSystem/StorageArea 作为 environment/store；补 run uses loader/policy、reads resource、produces document/metadata/attachment、deduplicates、writes memory、result/error/provenance | 从 source 到 MemoryRecord 的 ingestion 链无断点；任一 resource kind 有边界例；Tool Resource 不再映到此泛型 Resource |
| `memory-stores-scopes` | `+MemoryEntity → MemoryRecord/MemoryItem/MemoryFile`; `MemoryStore`; `MemoryScope/MemoryNamespace`; `+MemoryKind → Episodic/Semantic/Procedural/Reflective/Preference/Experience`; `+MemoryDuration → Working/ShortTerm/LongTerm`; owner scope 作为可组合值 | 不把 kind、duration、owner scope 压成单互斥树；Session/Task/CrossSession 是 scope values 或组合 profile；合并 PreferenceMemory/MemoryPreference；补 owner、valid time、access policy、confidence、provenance、supersession | 同一 MemoryRecord 可同时标注 kind/duration/scope 而不多重伪继承；每个 store/record 可查 owner和policy |
| `memory-chunking-situating` | `+ChunkArtifact → Chunk/SituatedChunk/ChunkReference`; `+ChunkMetadata → Boundary/Overlap/Provenance/QualitySignal/ContextNote`; `+ChunkProcessingActivity → ChunkingRun/SituatingPromptRun/ChunkCompression` | `ChunkCompression` 审查为 activity 或 strategy，不能作为无父 resource；补 run uses strategy/config/model、consumes Document、produces Chunk、situating consumes Chunk produces SituatedChunk；保留 source span | 给定 Chunk 可追到原文、边界、run、策略和质量；叶节点仍显示父链；不再“ChunkingRun chunks Chunk”缺 Document |
| `memory-embedding-indexes` | `+Representation → Embedding → Text/GraphEmbedding`; `+VectorRepresentation → Dense/Sparse/EmbeddingVector`; `+Index → Vector/Hybrid/TfIdfIndex`; `+IndexActivity → EmbeddingRun/IndexBuildRun/IndexRefreshEvent`; `IndexVersion → IndexShard/IndexEntry/IndexKey` 用 part-of/has，不一定 is_a | VectorDatabase 是 backend/store profile，不是 Index 子类；EmbeddingModel 引用 Runtime Model；补 vector represents Chunk、generatedBy run/model、entry belongsTo version/shard、refresh supersedes version、staleness/compatibility | representation/index/activity 三类不混；具体后端仍在同图但标 profile；索引版本和刷新不可原地变更 |
| `memory-retrieval-ranking` | `+RetrievalArtifact → RetrievalQuery/CandidateSet/CandidateChunk/RetrievedChunk`; `+RetrievalScore → Lexical/Similarity/RerankScore`; `+RankingOperation → RankFusion/TopKSelection`; `RetrievalFilter/RetrievalTrace` | CandidateSet contains CandidateChunk；RetrievedChunk 是 selection output，不是 Candidate 子类；补 query uses filter/index version、candidate scoredBy metric/model、fusion/rerank produces order、topK selects、trace records；安全扫描后才能进 Context | 每次 retrieval 可重放 query/filter/index/version/score/rank/topK；score 定义、单位和模型可见 |
| `memory-context` | `+ContextArtifact → ContextWindow/ContextSummary/ContextSlot/ContextSource`; `ContextAssembly`; `+ContextRule → ContextOrderingRule/ContextBudget/ContextExclusion`; `ContextRefreshEvent` | 与 Info 的 ContextPackage 确定唯一 canonical identity：建议 ContextPackage 归 Info，Memory produces/refreshes it；Assembly consumes sources/candidates、applies rules、produces immutable context version、deliveredTo run/model | 一个上下文快照有输入、顺序、预算、排除、版本和消费者；无 ContextPackage/Window 重复定义 |
| `memory-lifecycle` | `+MemoryOperation → MemoryWrite/Update/Merge/Delete/Discard/Eviction/Expiration/Supersession/Compaction/Consolidation/Validation/Reflection/Decay`; `MemoryAuditEvent/MemoryConflict` 分别为 event/state | 15 个操作不再只星形指向 MemoryRecord；统一字段 actor/reason/policy/input version/output version/result/error/time；所有修改产生新版本，旧记录 superseded/expired，不原地 mutate；补冲突处理和合法状态转换 | 15/15 operation 有父链和统一合同；Update/Merge/Compaction 有 before/after；失败和冲突有恢复路径 |

### 10.4 Orchestration Domain

| Module | 建议的内部层级骨架 | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `orchestration-task-planning` | `+IntentionalEntity → Objective/Goal/+Intent`; `+WorkSpecification → Task/TaskPlan/TaskStep/WorkItem`; `+TaskCondition → CompletionCriterion/Constraint/Dependency` | 新增 Intent；Objective/Goal 写清差异；TaskDefinition/TaskInstance 若暂不拆类，至少在 schema/status 中明确；TaskPlan contains Step、Task dependsOn Task、criterion evaluates outcome；不得把 Plan 当运行实例 | Objective→Intent→Goal→Plan→Task/Step→Outcome 主链可查询；每个 Task 有 criterion/constraint/status |
| `orchestration-actors-delegation` | `+CoordinationRole → OrchestratorRole/SubagentRole/WorkerRole`; `+DelegationProcess → DelegationContract/Event/Result`; `Handoff/ResponsibilityTransfer`; `+WorkerSelectionProcess → Pool/Availability/CapabilityMatch/Selection/Distribution`; `AgentAsToolInvocation` 通过 Tool relation | Orchestrator/Subagent/WorkerAgent 改 role 或 role-bearing Actor pattern，不作为固定 actor subtype；DelegatedAuthority/Budget/Context/Ownership 作为 Delegation 信息或相关 Concept；明确 delegator/delegatee/performer/task/scope/authority/budget/status/result | 任一 delegation 可回答谁委托谁做什么、依据何权限、结果何在；Handoff 与 Agent-as-tool 不混 |
| `orchestration-routing-control` | `+RoutingSpecification → RoutingPolicy/Route/RetryPolicy/StopCondition`; `+RoutingDecisionProcess → RoutingDecision/RoutingTarget`; `+ControlGate → Gate/GateCondition/GateOutcome/BranchCondition`; `DownstreamOperation` 为 target/reference | 补 policy has condition、decision evaluates condition、selects route/target、gate produces outcome、outcome triggers operation、retry creates new attempt、stop terminates；Decision 不与 policy 混型 | 可从条件重放到 decision→route/target→gate outcome；Retry/Stop 有明确互斥和终止证据 |
| `orchestration-composition` | `OrchestrationTopology`; `+CompositionPattern → PromptChain/Parallelization/Sectioning/Voting/Synthesis`; `+CompositionPart → ChainStage/ParallelBranch/SectionAssignment/VoteBallot/SynthesisInput`; `AggregationRule/SynthesisPlan/SynthesisOutput` | 分开 topology specification 与 run/result；branch/stage 是 topology part；Voting consumes ballots produces decision，Synthesis consumes inputs produces output；并发/顺序/fan-in/failure policy 进入结构约束 | 五种 pattern 均有 input/part/output/failure；静态 topology 与运行 event 不混 |
| `orchestration-evaluation` | `+ImprovementLoop → EvaluatorOptimizer/ImprovementAttempt`; `+ReviewCoordination → ReviewAssignment/ReviewEvent/FeedbackRouting`; `+RevisionArtifact → CritiqueArtifact/ReflectionRecord/RevisionPlan/OptimizerState/StopRetryLineage`; `ThinkAsTool` 为 adapter/profile annotation | 通用 Review/Evaluation canonical identity 归 Feedback，本模块通过 relation 使用；补 assignment→review→critique/feedback→revision→attempt→stop；ThinkAsTool 不作为通用 core subtype | 一次优化循环可追到被评对象、feedback、revision、新 attempt、stop reason；不复制 Feedback Review 概念 |

### 10.5 Tool Domain

| Module | 建议的内部层级骨架 | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `tool-registry-definition` | `Tool → Function/Computer/Shell/Hosted/LocalRuntimeTool`; `HostedTool → HostedMCPTool`; `+ToolSpecification → ToolDefinition/PromptDefinition/ResourceDefinition`; `+ToolMetadata → Description/PermissionSpec/DeprecationNotice`; `ToolRegistry`; `CapabilityDescriptor/Surface/ToolCapability` | ToolName/Version/Description 迁 fields，ToolDescription Concept 仅在需独立 provenance 时保留 value object；Argument/ResultSchema 迁 `structure`；补 definition describes tool、tool exposes operation/capability、registry contains definition、provider/endpoint/status/compatibility/replacement | Tool、definition、implementation、registry、capability 不混；具体 tool subtype 有父链；静态 schema 在节点详情而非图节点 |
| `tool-discovery-selection` | `+DiscoveryActivity → ToolSearch`; `+Candidate → Tool/Capability/Prompt/ResourceCandidate`; `+CandidateSet → ToolCandidateSet`; `+MatchAssessment → ToolMatch/EmbeddingMatch/RegexMatch`; `+SelectionDecision → Tool/Capability/Prompt/ResourceSelectionDecision`; `ToolFallback/DisambiguationPrompt` | 四套候选/决策共享父锚但保留对象区别；补 query→surface/search→candidate set→match/score/rank→policy filter→decision/fallback；选择理由和拒绝理由入 schema | 任一 selection 可追到 requirement/query、候选、评分、权限和理由；候选类型不互相复制定义 |
| `tool-invocation-execution` | `+InvocationSpecification → ExecutionRequest/ToolCallPlan`; `+Invocation → ToolCall/ProgrammaticToolCall/Command/ShellCommand/PromptGetRequest/ResourceReadRequest`; `+InvocationAttempt → ToolCallAttempt/ToolCallRetry`; `+InvocationResult → ToolResult/ExecutionResult/ResourceReadResult/ToolError/Warning`; `+InvocationEffect → ToolSideEffect`; argument/template/approval/safety 为信息或相关概念 | CommandArgument/ToolArgument 作为 field binding；ConditionalToolEnabled 是 condition；PromptTemplate/ResourceTemplate 归 definition/profile；补 caller、operation、args、attempt、run、authorization、sandbox、timeout、idempotency、result/error/effect/compensation；retry 新 ID | `Definition ≠ Plan ≠ Call ≠ Attempt ≠ Result ≠ Outcome` 可从图和详情读懂；每次 attempt 有 result/error；副作用与返回值分开 |
| `tool-mcp-transport` | `+MCPParticipant → MCPClient/MCPServer`; `MCPSession`; `+MCPCapability → ServerCapability/ToolList/ResourceList/PromptList/RootList/ResourceTemplateList`; `+MCPInteraction → SamplingRequest/Elicitation/AdditionalInput/Authorization`; `MCPTransport` | 保留在 Tool 一级 Domain 内，不迁走；通过 Adapter MCPAdapter 映射协议版本；补 initialize/version/capability negotiation、request/response/error/notification/subscription/close、auth/consent；MCP 列表 contains definition | 能从 MCPSession 查版本、双方、capability 和交互；MCP 特有节点有 profile 标签但仍在统一图谱 |

### 10.6 Safety Domain

| Module | 建议的内部层级骨架 | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `safety-trust-boundary` | `TrustBoundary → Internal/ExternalBoundary`; `ExternalBoundary → Network/RemoteAgent/ToolBoundary`（逐项审查是否严格子类）；`DataZone`; `BoundaryCrossing`; `AuthorityScope` | BoundaryCrossing 保持有身份的过程/记录概念；补 source/target zone、actor、payload/action、direction、purpose、authority、policy decision、protocol、trace/time；DataZone contains resource/actor；Reference 留 Info | 任一 crossing 可完整回答从哪到哪、谁、什么、为何、凭何权限、何时；边界类型均有正反例 |
| `safety-permission-policy` | `+PolicySpecification → PolicyRule/PolicyCondition/PolicyAction/PolicyException`; `PolicyDecision → Allow/Deny/EscalationDecision`; `+AuthorizationArtifact → AuthorizationGrant/CapabilityGrant/HumanApproval/PermissionScope`; `PermissionPrompt/Response` | PolicyDecision retype 为 decision record/event 上位；补 request→rule evaluation→decision→grant/approval/obligation→enforcement；subject/action/resource/context/issuer/reason/validity/revocation 全部结构化 | Allow/Deny/Escalate 是 PolicyDecision 子类；任一授权可追到 rule/context/enforcement outcome |
| `safety-sandbox-network` | `+IsolationSpecification → Filesystem/Process/NetworkPolicy`; `Sandbox`; `+NetworkEndpoint → Proxy/HTTPProxy/SOCKSProxy/Socket/DomainSocket`; `+NetworkInteraction → OutboundRequest/NetworkCall/InboundResponse/DeniedNetworkCall`; `ProxyRoute`; `SandboxEscapeRisk` | 明确 endpoint subtype；SandboxCommand 引用 Tool Command；补 sandbox contains process/mount/policy、request routedBy proxy→call→response/deny、policy evaluates call、escape risk→finding→decision；NetworkResource 不与 Memory Resource 混 | 一次 network call 有 request/route/policy/response or denial；Sandbox 约束和逃逸风险可查 |
| `safety-injection-defense` | `+ThreatSignal → Prompt/Indirect/ToolStream/MemoryPoisoning/PersistentContextRisk`; `+PoisonedContent → MaliciousToolOutput/PoisonedChunk/Description/Schema/ResourceContent`; `+DetectionActivity → PatternScan/InjectionScanResult`; `DefenseFinding`; `+TaintEntity → TaintedSource/TaintedSpan/SourceSinkFlow/TaintPropagation`; `+MitigationAction → Sanitization/Quarantine/TrustedOverride` | `InstructionConflict` 在此唯一拥有；InjectionSignature 为 scan pattern/signature，不得保留工具定义串义；补 source→taint→sink、scan→finding→risk→policy decision→mitigation→validation；risk score/confidence fields | 任一 finding 有被扫对象、signature、source/sink、confidence、decision、mitigation 和复检；无孤立威胁名词 |
| `safety-commit-redaction` | `+SideEffectCommitment → CommitRequest/Gate/Approval/Denial`; `SideEffect`; `+DisclosureControl → DisclosureRule/Filter/ProgressiveDisclosure/Redaction/RedactionRule/SuppressedOutput/AuditDisclosure`; `SensitiveSpan` | `CommitGate` 改 label/ID alias 为 `SideEffectCommitGate`，避免 Git commit；两条子树不混；补 request→gate→decision→effect→audit/rollback 及 output→sensitive span→rule→redaction/suppression→disclosure | 副作用批准与信息脱敏两条流程各自闭环；共享 PolicyDecision 而不复制 |

### 10.7 Feedback Domain

| Module | 建议的内部层级骨架 | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `feedback-warning-error` | `+DiagnosticSignal → Warning/RiskSignal/ConfidenceSignal/DiagnosticMessage`; `+FailureEvent → ErrorEvent/WarningEvent`; `FailureMode`; `BlockingError/RetryableError` 作为 mode 或 event subtype 经审查；`ErrorStream` | 分清发生事件、分类和消息；补 causedBy、affects Attempt/Action、severity、retryable、resolution、outcome；ErrorStream contains event/record | 任一错误可定位发生位置、mode、severity、retryability、resolution；Warning 不在 event/signal 间混型 |
| `feedback-review-optimization` | `+ReviewActivity → HumanReview/AutomatedReview`; `Review → ReviewFinding`; `+CorrectionActivity → Correction/RecoveryAction/RollbackAction`; `RecoveryPlan`; `OptimizationLoop/Target`; `Feedback/LearningSignal` | 统一 ReviewActivity generates Review record；补 reviewer/assignment、subject version、finding、feedback、correction/new version、reevaluation；LearningSignal 只能产生 change proposal，不自动改 policy/core | 旧制品→review→finding→correction→新制品→reevaluation 完整；ReviewEvent 跨域不再断链 |
| `feedback-metrics-evaluation` | `+EvaluationSpecification → Scenario/Rubric/Criterion/SuccessCriterion`; `EvaluationRun`; `Metric → Cost/Latency/Robustness/SafetyMetric`; `+Measurement → Score` | 增加 Measurement，分开 metric definition 与 observed value；补 run evaluates subject under scenario/rubric、measurement has metric/unit/value/time/confidence/provenance、outcome satisfies criterion | 任一 Score 可查 metric/subject/run/unit/evaluator/evidence；EvaluationRun 明确连接 RunAttempt/Trace/Artifact/Outcome |
| `feedback-logging` | `+LogArtifact → LogRecord/TelemetryEvent/AuditLog`; `LogStream`; `+LogConsumer → Listener/Sink/Subscription`; `TraceExport` | ErrorListener/LogListener 共父；补 timestamp/severity/body/attributes/resource/scope/trace/span/actor/run/retention/integrity/redaction/export；Telemetry 不等于 Evaluation | 任一 log 可追到 run/trace/actor和retention；sink/export 实现不污染 LogRecord 定义 |

### 10.8 Adapter Domain

| Module | 建议的内部层级骨架 | 必须执行的具体修改 | Module 验收 |
|---|---|---|---|
| `adapter-protocols` | `Adapter（由 mapping-infrastructure 唯一拥有） → +InteroperabilityAdapter → ProtocolAdapter → A2A/MCP/FIPA/KQMLAdapter`; `+ProtocolMapping → Capability/Message/Task/TrustMapping` | 保留一级 Adapter Domain；四个具体 adapter 必须有 version/scope/direction/loss/conformance；Mapping 作为有信息的 mapping relation 或 Concept，不能两者重复；MCP Tool/A2A Task 指向正确核心 Concept | 至少形成四层黄金链；每个 protocol mapping 有外部 QName/version/target/loss/test |
| `adapter-frameworks` | `Adapter（跨模块父概念） → FrameworkAdapter → CrewAI/DeepAgents/LangChain/LangGraph/Microsoft/OpenAIAgentsAdapter`; `+FrameworkMapping → Handoff/TraceMapping` | 框架名保持下位 Concept；补 Agent/Role/Task/Plan/Tool/Memory/Guardrail/State/Result mapping；记录 unsupported semantics 和版本；不复制框架类树 | 任一框架升级只影响该 adapter node/mapping；核心 Concept ID 不变 |
| `adapter-benchmarks` | `Adapter（跨模块父概念） → BenchmarkAdapter → AgencyBench/AppWorld/OSWorld/SWEBench/Tau2/TerminalBenchAdapter` | 补 BenchmarkTask→Task、Environment→RuntimeEnvironment、Action→ActionAttempt、Observation→Observation、Artifact→Artifact、Score→Measurement、Success→Outcome；记录 benchmark/version/evaluator/loss | 每个 benchmark 至少覆盖 task/environment/trajectory/metric/outcome 五类映射 |
| `adapter-statecharts` | `Adapter（跨模块父概念） → StatechartAdapter → SCXML/XStateAdapter` | 补 State、Transition、Event、Guard、Action、History/Final/Error 映射；说明 StateSnapshot 与 state、Routing Gate 与 guard 的关系及 round-trip loss | SCXML/XState mapping 可验证且不把 statechart 页面加进 UI |
| `adapter-schema-export` | `Adapter（跨模块父概念） → SchemaAdapter → JSONSchema/OWL/SHACL/ShEx/Zod/Pydantic/GraphIR/FrontendViewAdapter` | 具体 adapter 全部为统一图谱的 export mapping；补 class/relation/field/cardinality/enum/constraint/IRI/annotation 映射、unsupported/lossy、warning、round-trip；“某节点的 Schema annotation”永不入图，但有独立身份/版本/生产消费关系的 `SchemaArtifact` 仍是 `runtime-artifacts` 中的合法 Concept | 每种 export 可追到生成它的 canonical node/field/relation；UI graph element count 不包含 annotation/export projection shadow nodes，但可包含经过审查的 SchemaArtifact Concept |
| `adapter-mapping-infrastructure` | `+Adapter`（所有 Adapter Module 共用的唯一父概念）; `+MappingArtifact → MappingRule/ConversionWarning/+MappingTestResult/+CoverageReport`; `+MappingActivity`（仅确有运行实例时） | MappingRule 补 source/target construct/version/direction/kind/transform/pre-postcondition/authority/evidence/validity/loss；warning 有 severity/affected mapping/remediation；避免直接重复 mapping edge | Adapter root 只在本模块定义一次，其他模块跨模块引用；coverage 可计算 exact/lossy/unsupported 数量 |

### 10.9 41 个 Module 的共同完成条件

每个 Module 单独完成时必须满足：

1. 所有当前 Concept 在迁移账本中有决定；
2. root Concept 明确；
3. 默认至少一条真实专业化链；确无 subtype 结构时必须有 ontology reviewer 接受的 `taxonomy_contract.applicability=flat-root-exception`、三语理由和 root concept 集，且仍以非 `is_a` 关系证明模块闭环；
4. 所有 `is_a` 通过七问；
5. input/output/failure/recovery 有关系或 N/A 理由；
6. 与兄弟 Module 的 includes/excludes 清楚；
7. 跨域概念只引用，不复制；
8. 每个 accepted Concept 有 short/formal definition、why needed、正例、反例、source claim；
9. 每个 accepted relation 有方向、定义、端点、基数或 N/A、正反例和来源；
10. 至少两个 Module CQ 和一个主案例片段通过；
11. 图上能从 Module 逐层展开到叶概念；
12. 详情表能在同一页面显示全部信息。

## 11. TDD 测试计划

所有实现遵循 RED → GREEN → IMPROVE。不得先批量生成 572 个 parent，再补测试。

### 11.1 Canonical Schema 测试

重写 `tests/schema-validation.test.ts`：

```text
accepts ontology/agent-ontology.json as the canonical artifact
accepts a minimal AgentOntology→Domain→Module→Concept fixture
rejects a concept missing accepted trilingual information
rejects a concept with malformed structure fields
rejects a relation with malformed cardinality
rejects a case fragment without scenario_id
rejects generated graph-view fields at the canonical root
```

不得再导入 `src/data/ontology.ts`。

### 11.2 Taxonomy 测试

新增 `tests/ontology-taxonomy.test.ts`：

```text
keeps exactly eight first-level domains including adapter-plane
keeps every module owned by exactly one domain
keeps every concept owned by exactly one module
resolves every is_a source and target to a concept
never uses a plane or module as an is_a endpoint
keeps the is_a graph acyclic
requires each non-root concept to have at least one is_a parent
requires each module to expose at least one derived root concept
requires each module to contain a real specialization chain or an accepted flat-root-exception
rejects a flat-root-exception without localized rationale and ontology reviewer
requires primary_parent_relation_id to resolve to an outgoing is_a relation
allows multiple inheritance without duplicating the concept node
keeps InstructionConflict under one canonical module
keeps the approved golden hierarchy chains stable
```

### 11.3 节点信息测试

新增 `tests/ontology-information.test.ts`：

```text
requires accepted concepts to have trilingual labels and definitions
requires the root and every accepted domain and module to have trilingual definition purpose boundaries example and source claim
requires why_needed, includes and excludes for accepted concepts
requires one positive and one counterexample or boundary example
requires every example reference to resolve
keeps every example id globally unique
requires every case path step to reference one case-fragment example without copied node or explanation
requires traversal relations to connect adjacent case-fragment owners
requires every source claim to resolve in source-registry.csv
requires every source claim to state what it supports
requires structure field ids to be unique within a concept
requires controlled values to be attached to a concrete field
requires deprecated concepts to name a replacement or reason
keeps examples, schema fields, source claims and constraints out of graph nodes
```

### 11.4 关系测试

新增 `tests/ontology-relations.test.ts`：

```text
resolves every relation endpoint
preserves every canonical relation direction
allows multiple predicates between the same endpoint pair
derives inverse reading from one canonical assertion
rejects redundant inverse assertions with the same qualifiers and evidence
allows a second directional assertion only with a distinct_fact_rationale
owns each relation in the source concepts module file and each is_a in the child module file
rejects the same normalized fact under different relation ids or source files
keeps min cardinality less than or equal to max
distinguishes an unknown maximum from cardinality not applicable
requires a localized not applicable reason when cardinality is null
rejects invented instance cardinality on is_a relations
requires accepted relations to have definition and source claim
requires accepted relations to have positive and counterexample information
requires cross-boundary relations to identify boundary context
removes every generated module_relates and module_emits_event placeholder
keeps is_a relation_kind equal to hierarchy
```

### 11.5 Individual 迁移测试

新增 `tests/ontology-controlled-values.test.ts`：

```text
classifies all 80 legacy individuals in the migration ledger
contains no PlaneIndividual or ModuleIndividual concept node
contains no unresolved individual class reference
attaches every controlled value to an existing node field
attaches every instance example to an existing node or relation
contains no top-level individuals array after migration
```

### 11.6 Generator 测试

新增 `tests/ontology-generator.test.ts`：

```text
builds from ontology/source without reading generated canonical JSON
captures every legacy collection/id/json-pointer record and payload hash exactly once during bootstrap
keeps migration-only records out of candidate and published canonical artifacts
never emits a canonical artifact containing both legacy and new-shape fields
produces byte-identical output twice
fails when reviewed information is missing
fails when an is_a cycle is introduced
fails when module ownership is inconsistent
does not infer semantic_kind from labels
does not generate semantic relations from alphabetic neighbors
does not emit terms or object_properties duplicates
does not emit plane or module individuals
regenerates metrics from actual arrays
reports instance_examples controlled_values fields constraints and source_claims with the new metric meanings
keeps all legacy_remaining metrics at zero for a releasable artifact
leaves the worktree clean in --check mode
```

### 11.7 Graph/ViewModel 单元测试

重写 `tests/graph.test.ts`，新增 `tests/ontology-view-model.test.ts`：

```text
builds the only visible graph from canonical ontology
renders root to eight domains
renders domain to modules
renders module to derived root concepts
renders primary and additional is_a parent edges
keeps incoming and outgoing semantic directions
preserves parallel predicates between two nodes
keeps a leaf graph visible through its parent path
focuses a node without changing graph root
expands a node only through an explicit expand action
focuses an edge without creating a new route or page
never emits schema, example, source, constraint or case nodes
returns complete result counts without silent truncation
```

### 11.8 现有 ontology 测试拆分

`tests/ontology-artifact.test.ts` 当前体量继续增长会掩盖 contract。执行：

- 保留八域规模、ID、来源、Hidden CoT、局部领域语义的测试；
- 删除以伪 axiom/object-property 数量达到某阈值作为质量门；
- 将 taxonomy 移到 `ontology-taxonomy.test.ts`；
- 将关系合同移到 `ontology-relations.test.ts`；
- 将定义/案例/结构移到 `ontology-information.test.ts`；
- 每个 Domain 保留一个独立 describe，失败能定位到具体 Domain/Module。

### 11.9 E2E 产品合同

更新 `e2e/ontology-explorer.spec.ts`，至少包含：

```text
renders exactly one ontology graph surface
contains no TBox ABox Schema or Instance navigation
keeps the FIBO-like single-column characteristics table
clicking a graph node updates the same characteristics table
clicking a graph node does not change graph root or node count
restores graph root and focused node or relation from the combined URL hash after refresh
explicit expand changes visible topology
clicking a relation shows the contract in the same table
keeps incoming relation direction correct
keeps parallel predicates visible
shows predicate label and direction arrow on the focused canvas edge
keeps a semantic leaf connected to its parent
keeps leaf is_a edge data source=child and target=parent while laying out parent inward
shows structure constraints and instance examples without graph nodes
shows direct source claims rather than plane-wide inherited sources
expands every truncated list with an explicit total
switches labels definitions examples and relation text across zh en ja
supports keyboard node and edge focus
keeps mobile width within the viewport
keeps reduced-motion behavior
```

### 11.10 Golden hierarchy

第一条 UI/数据联合黄金链选用 `adapter-protocols`，候选为：

```text
+Adapter
└─ +InteroperabilityAdapter
   └─ ProtocolAdapter
      └─ MCPAdapter
```

其中 `Adapter` 只在 `adapter-mapping-infrastructure` 定义一次，`adapter-protocols` 通过跨模块 `is_a` 引用它；目录不复制该节点，图谱按关系显示同一 ID。

执行前由 ontology reviewer 确认两个新增锚点定义和来源。若未批准，则黄金链缩为 `ProtocolAdapter → MCPAdapter`，测试仍验证任意深度递归，不得用虚构概念满足截图。

黄金链每个节点和三条 `is_a` relation 必须同时具有：定义、边界、why needed、结构说明、正例、反例、source claim；E2E 从 Module 逐层展开并截图验证。

## 12. 分阶段实施顺序

### Phase 0：方向纠偏与基线冻结

目标：先消除文档冲突，防止团队按旧报告拆页面。

任务：

1. 合并本计划；
2. 提交 RFC 0005；
3. 给原报告加修订说明并按 2.4 改写；
4. 更新 RFC 0001/0002/0004 clarification；
5. 更新 art direction 的单页禁令；
6. 保存 desktop 1360×900、mobile 390×844 的当前视觉基线；
7. 记录现有 graph node click、leaf empty state 和 characteristics table 行为。

验收：所有文档一致写“八域保留、单图保留、信息内嵌”；不存在要求 Schema/ABox/TBox 独立页面的未修订 accepted 文案。

### Phase 1：先写失败测试和 canonical 合同

RED：

- 写 11.1–11.7 的第一批失败测试；
- current canonical 必须因缺 hierarchy/information contract 而失败；
- current Schema 必须因验证错对象而被测试识别。

GREEN：

- 先建立独立 artifact meta-schema source、最小 product source、一个 pilot Module source 和最小 deterministic builder；
- 对冻结旧 canonical 执行 7.3 的一次性 lossless bootstrap，生成 hash/count/ID manifest 和 migration-only ledgers；
- 只在新 source 中语义迁一个 pilot Module 和黄金链；
- builder 只从新 source 生成 candidate canonical，candidate 通过结构验证；其他 40 Module 可暂为 draft 并由 coverage report 标红；
- 不手改或替换当前发布 canonical，不允许 pilot 先落到 generated JSON 再反向补 source。

IMPROVE：

- 提取共享 validator/index；
- 保持测试错误信息指向 node/relation ID。

验收：pilot Module 完整，其他 40 Module 有明确 missing-information report；所有 legacy ID 被 bootstrap manifest 捕获；没有默认假数据；builder 日志证明未读取旧 canonical 作为持续 source。

### Phase 2：扩展唯一可编辑 source 和确定性 builder

任务：

1. 将 Phase 1 的最小 source 扩展为 41 个 module source 初稿；
2. 将 definition ledger 内容合并进去；
3. 将最小 builder 扩展为完整 deterministic builder；
4. 删除标签推断和自动伪边；
5. candidate canonical/Markdown/metrics/source-index/root-schema/types 统一生成；
6. candidate 设置 `generated/do_not_edit`，但尚不覆盖发布 canonical；
7. CI 增加 clean-build check；
8. 旧 `ontology:expand` 暂时转调新 builder 并报警。

验收：从 clean checkout 两次生成 candidate byte-identical；生成后 git diff 为空；source IDs/count 未无解释丢失；每个仍未归位 legacy item 都在 migration ledger 中且 payload hash 与 baseline 一致；严格新 Schema 尚未用于验证/发布旧 shape canonical。

### Phase 3：按 Domain 人工建立概念层级

按风险和主闭环顺序，而非文件字母序：

```text
Runtime
→ Orchestration
→ Tool
→ Safety
→ Feedback
→ Memory
→ Info
→ Adapter
```

每个 Domain 的实施循环：

1. 填完该域迁移账本；
2. 先审 root concepts；
3. 再审第一层 children；
4. 再向叶子展开；
5. 审 multi-parent；
6. 审非 `is_a` 关系；
7. 补 node/edge information；
8. 跑该 Domain CQ 和主案例片段；
9. code-reviewer 和 ontology reviewer 双审；
10. 合并后才进入下一 Domain。

验收：每个 Domain 独立满足 10.9，不允许等八域全部结束才发现树根错误。

### Phase 4：迁移 individuals、fields、axioms 和 mappings

任务：

- 80 个 individual 按 4.7 迁移；
- 102 data property 迁入 node structure，并删除 module-level boilerplate；
- 657 axioms 中重复声明/模板删除，真实约束附着目标对象；
- adapter mappings 迁到 adapter nodes，目标侧反向索引；
- 修复 32 stale definitions、507 source set drift 和三语串义。
- 逐项清空 migration-only ledgers，验证每个 baseline ID 都有 accepted target、merge/deprecate/remove decision；
- 最后一项清空后执行原子切换：同一 PR 替换发布 canonical、根 Schema、generated types/source index、fixture、tests 和 App consumer；不得先发布严格 Schema 或半迁移 canonical。

验收：顶层 individuals/data_properties/axioms/adapter_mappings 不再作为平行信息体系；迁移 ledger 100% accepted；新发布 canonical 严格通过 `additionalProperties:false` Schema；旧字段与 `migration_legacy` 为 0；不存在任何一个提交让 UI 读取 old/new 混合 shape。

### Phase 5：统一图谱 ViewModel 和单页交互

- **RED：**先写 node focus、edge focus、leaf hierarchy、direction、multi-edge、no-shadow-node E2E。
- **GREEN：**实现五类状态、递归目录、visible graph builder、统一 characteristics。
- **IMPROVE：**拆 `App.tsx`，保持 DOM/截图大框架不变。

验收：第五节所有交互合同通过；无新 route/tab/inspector；图和详情不再脱节。

### Phase 6：导出、文档和发布治理

任务：

- 从 `schemas/source/agent-ontology-artifact-contract.json` 生成 canonical 根 JSON Schema/TypeScript types；从同一 canonical 节点/边信息生成 Concept payload Schema、可选 OWL/SHACL 和 fixtures；
- 更新 README、ontology.md、source registry；
- 增加 migration guide 和 alias/deprecation；
- 运行完整 coverage、build、E2E、visual regression；
- 状态由 `draft-hierarchy-upgrade` 经 review 改为新 canonical release。

验收：所有 generated artifacts 能回指 canonical node/relation IDs；UI 不新增展示表面。

## 13. 建议的 PR/提交边界

避免把文档、572 Concept 和 4000 行 UI 一次性塞进一个 PR：

| PR | 范围 | 禁止混入 |
|---|---|---|
| PR-00 | 本计划、RFC 0005、原报告/设计文档纠偏、视觉基线 | ontology 大规模重排 |
| PR-01 | meta-schema source、失败测试、lossless bootstrap、最小 source/builder、pilot candidate | 手改/替换发布 canonical、UI 重构 |
| PR-02 | 扩展 41 source modules、完整 builder、candidate clean check | 572 Concept 语义批量决定、发布严格新 Schema |
| PR-03 | Runtime hierarchy + information | 其他 Domain |
| PR-04 | Orchestration | 其他 Domain |
| PR-05 | Tool | 其他 Domain |
| PR-06 | Safety | 其他 Domain |
| PR-07 | Feedback | 其他 Domain |
| PR-08 | Memory | 其他 Domain |
| PR-09 | Info | 其他 Domain |
| PR-10 | Adapter | 其他 Domain |
| PR-11 | individual/field/axiom/mapping cleanup + migration manifest 清零 + old/new 原子 cutover | 视觉调整、半迁移发布 |
| PR-12 | ViewModel + node/edge focus + characteristics | 新页面、新导航 |
| PR-13 | export/docs/release gates | 新本体概念 |

每个 PR 使用 conventional commit，先附 RED 测试证据，再附 GREEN 和 coverage。

## 14. 安全、性能、可访问性和失败恢复

### 14.1 安全

- source URL 只允许 `https:` 或明确批准的 `http:`；禁止 `javascript:`；
- React 不使用 `dangerouslySetInnerHTML` 渲染 definitions/examples；
- example payload 以 escaped `<pre>` 显示；
- 下载文件名来自固定映射，不从节点 label 直接拼接路径；
- external mapping 和 tool output 示例按不可信内容展示，不执行；
- Hidden CoT 检查递归覆盖 source/canonical/fixtures/UI text；
- source claim locator 不得泄露本地绝对敏感路径。

### 14.2 性能

- `ontology-index` 一次 O(N+E) 构建并 memoize；
- UI 不在每次 render 全量 filter 572×421；
- 默认可见 graph 建议软上限 80 nodes，但达到上限时必须显示“还有 N 个未展开节点”，不能静默丢失；
- 详情长列表使用 disclosure/虚拟化，数据仍完整；
- focus node 不重新运行全图 layout；expand 才局部布局；
- 1360×900 上首次交互目标 <200ms，focus 更新目标 <100ms；实际阈值以 CI 环境基线校准。

### 14.3 可访问性

- graph container 保留语义说明，并提供可键盘访问的节点/边序列；
- Tab 聚焦节点，Enter focus，Space/显式按钮 expand，Escape 返回 graph root；
- focus 更新使用 `aria-live=polite`；
- 不以颜色单独区分 primary/additional/semantic edge，增加线型和标签；
- relation label 在 focus 时可见，不只 hover；
- `prefers-reduced-motion` 下关闭动画；
- characteristics 表始终是 screen reader fallback。

### 14.4 失败与恢复

- source build 失败：不覆盖上一次 generated artifact；临时文件验证通过后原子替换；
- hierarchy cycle：输出完整 cycle path 和 relation IDs；
- unresolved source/node/relation：输出 owner Module 和 source file；
- UI 遇到坏引用：显示单一 inline data error，不隐藏整张图，不猜测替代节点；
- case path step 缺失：案例高亮禁用并显示缺失 ID；
- export 失败：不影响 graph browsing；
- migration rollback 使用上一 version IRI 和 source tag，不使用 `git reset --hard`。

## 15. NON-GOALS

本升级明确不负责：

- 重新设计八个一级 Domain 的视觉位置；
- 把 Adapter 移出一级结构；
- 新建 ABox/TBox/Schema/Instance/Evidence/Case 产品页面；
- 构建生产运行时 Agent 数据库；
- 在图中显示真实用户数据或私有运行记录；
- 保存私有思维链；
- 让某个框架 API 类树成为 canonical ontology；
- 一次性添加情感、VRM、机器人或具身完整子本体；这些以后仍在同一 Domain/Module/Concept 机制下扩展；
- 为追求层数而虚构中间概念；
- 为追求边数保留生成式伪关系。

## 16. OPEN QUESTIONS 与默认决定

以下不阻塞 Phase 0–2，但必须在对应 Domain 实施前解决：

| 问题 | 默认决定 | 最迟决策点 |
|---|---|---|
| 新上位锚点的最终英文 ID | 使用 10 节 `+` 候选；未经 source/reviewer 不 accepted | 每个 Domain PR 开始前 |
| multi-parent 的 primary parent | 以最能表达 genus–differentia 且利于当前 Module 浏览者理解者为主父 | 该 Concept taxonomy review |
| `DraftArtifact/FinalArtifact` 是否彻底移为状态 | 默认迁 controlled value；若有独立约束/关系再保留 Concept | Runtime PR |
| `MessageContentBlock` 是 subtype 还是 usage role | 默认使用 `part_of/used_in`，不做 subtype | Info PR |
| Memory type 的多维分类如何序列化 | 默认 kind/duration/scope 三组 allowed values，不压成单树 | Memory PR |
| 是否保留 generated definition ledger | 默认只生成 read-only 对账文件，不再人工编辑 | Builder PR |
| 是否输出 OWL/SHACL | 允许生成；不是当前 UI release blocker | Phase 6 |
| 是否用 URL hash 分享 focus | 默认实现 `#root=<ref>&focus=node:<id>` / `focus=relation:<id>`，不引入 router | UI PR |

如果某一问题会改变八域、单图或内嵌信息三个固定政策，必须回到用户/产品决策，不得由实现者自行改变。

## 17. Definition of Done

### 17.0 正式实施证据

2026-07-13 的最终原子发布以 `ontology/source/**` 为唯一可编辑语义源，并同时发布 canonical JSON、根 Schema、生成 TypeScript 类型、fixture、Markdown 与 source index。正式根产物为 `release_channel=release`、`releasable=true`，source tree SHA-256 为 `93fd085ebe90e6d754d894c00b56fe90c302dcf1a0008e3de6e3426dc8a76d38`。

| 验收面 | 正式结果 |
|---|---|
| 规模与层级 | 8 Domain、41 Module、622 Concept、385 条 `is_a`、540 条 semantic relation；0 unresolved endpoint、0 `is_a` cycle |
| 冻结 v1 谱系 | 2,881/2,881 legacy record、572/572 legacy Concept、80/80 legacy individual 均有 accepted 决定；当前 source target 6,023，未解析 0 |
| 节点/边信息 | 166 个结构化 instance example、266 个结构字段、124 个约束、73 个受控值、7,242 个直接 source claim、1 条主案例路径 |
| 证据相关性 | 373 个 registry source；领域级 FIBO Guide 误用由 79 降为 0，只保留 2 条产品级本体工程约束；递归测试防回归 |
| 关系语义闭环 | 24 条 Info 关系的三语定义与 48 个正例/边界例逐谓词对齐；7 个已合并旧谓词的 14 个案例只作为唯一 canonical 边内迁移信息；2 个错挂 `chunks_document` 案例移除；通用定义模板、错误 owner 和缺失双端点均由递归门禁阻断 |
| 单图呈现 | 唯一 Explorer route、唯一 graph surface；Schema、实例、来源、约束和案例只作节点/边信息；桌面与移动均通过 |
| 合同与生成 | 生成类型是 UI consumer 的类型真相源；运行时拒绝 v1/GraphView/缺元数据产物；clean 双构建 byte-identical |
| 自动验证 | contract 35 文件/354 项、全量 40 文件/369 项、Playwright 26/26 项全部通过 |
| 覆盖率 | Statements 93.18%、Branches 80.38%、Functions 94.59%、Lines 94.46% |
| 安全与来源链接 | 42 个 source 文档、3 个 fixture、17 个 UI 文件与 373 个 registry URL 通过安全门；124 个被引用链接中 0 broken，网络超时或 403 记为 inconclusive 而非伪报通过 |
| 视觉回归 | 1360×900 desktop 与 390×844 mobile 的 Windows 像素基线连续复现；其他 OS 仍执行完整结构、响应式、键盘、主题和 reduced-motion E2E |

### 17.1 数据与层级

- [x] 八个 Domain 全部保留，含 `adapter-plane`；
- [x] 41 个 Module 全部保留或有独立批准的 deprecation decision；
- [x] 41/41 Module 均有真实 specialization chain，或有 reviewer 接受的 `flat-root-exception` 与三语理由；
- [x] 572/572 legacy Concept 在迁移账本中有决定；
- [x] 每个 accepted Concept 是 root 或至少有一个有效 `is_a` parent；
- [x] 0 个 unresolved relation endpoint；
- [x] 0 个 `is_a` cycle；
- [x] 0 个 Plane/Module 作为 `is_a` endpoint；
- [x] 多继承 Concept 恰好一个 primary parent relation；
- [x] 0 个 `terms/classes`、`relations/object_properties` 持久化重复；
- [x] 0 个自动 module relation/event/data-property/individual；
- [x] 80/80 legacy individual 有迁移决定，顶层无悬空 individual；
- [x] canonical JSON 通过真正同结构 Schema。

### 17.2 节点和边信息

- [x] root、8/8 Domain、41/41 Module 均有三语定义、目的、includes/excludes、至少一例和直接 source claim；
- [x] accepted Concept 100% 有三语 labels、short/formal definition、why needed、includes、excludes；
- [x] accepted Concept 100% 有正例和反例/boundary；
- [x] accepted Concept 100% 有 source claim；
- [x] accepted relation 100% 有定义、方向、端点、relation kind、来源、正反例；
- [x] 适用基数的关系均有 source/target `min/max`，未知上限只将相应 `max` 写 `null`；不适用基数的关系将整个 `cardinality` 写 `null` 并给出三语 N/A reason；两者不混写、不臆造；
- [x] source claim 逐条说明 supports 和 locator；
- [x] 32 stale ledger items 处理完；
- [x] 507 source set drift 处理完；
- [x] 已发现中文/日文串义全部人工复核。

### 17.3 呈现

- [x] 只有一个 Explorer route 和一个 graph surface；
- [x] 无 ABox/TBox/Schema/Instance 独立导航；
- [x] 根视图保持中心 + 八域辐射；
- [x] Concept 可递归展开任意层；
- [x] 叶节点仍显示上位链；
- [x] node click 更新同一详情表，不改变 graph root；
- [x] edge click 在同一详情表显示 relation contract；
- [x] incoming/outgoing 方向正确；
- [x] 同端点多 predicate 不丢；
- [x] focused neighborhood/selected path 的 canvas edge 显示 predicate label 与方向箭头；
- [x] schema/example/source/constraint/case 的 graph element 数恒为 0；
- [x] 所有列表无静默截断；
- [x] 三语、主题、mobile、keyboard、reduced-motion 通过。

### 17.4 工程

- [x] clean build byte-identical；
- [x] generated file 手改会被 CI 拒绝；
- [x] 旧手写 `src/data/ontology.ts` GraphView 不再参与构建/测试；
- [x] `App.tsx` 内部拆分不改变单页布局；
- [x] unit/integration/E2E 全部通过；
- [x] 代码覆盖率 ≥80%；
- [x] visual baseline 除明确新增信息/状态外无非预期漂移；
- [x] source registry、canonical、Markdown、metrics 同步。

## 18. HANDOFF

本计划已经把产品方向落实到层级、数据、交互、文案、41 个 Module、文件和测试，并完成正式 v2 发布。572 个 legacy Concept 的处理不是按名称批量猜测父关系，而是由冻结基线、逐项 decision ledger、Domain review、`is_a` 无环/端点/主父验证和 source-first 重建共同约束。

后续维护必须继续遵循以下顺序：

1. 新 Domain/Module/Concept/Relation 先修改 `ontology/source/**`，同步补定义、边界、示例、来源和 review；
2. 层级或关系变化先写失败测试，再更新 source，禁止直接编辑 canonical 或生成类型；
3. 来源先验证“实际支持什么”，Moonweave 的闭包、映射和粒度决定保留为 design inference；
4. UI 只消费 canonical index/ViewModel，任何新增信息继续附着在原节点或边；
5. 每次发布运行 `npm run ontology:release`，由原子事务同步全部生成工件并执行覆盖率、安全、链接、构建、E2E 与视觉回归；
6. 发布失败时保留上一完整 release，修复 source/test 后重跑，不进行局部手工切换。

最终升级判断：

> **不改变当前八域、41 个 Module 和中心辐射式逐层浏览方式；只在这一统一骨架中把平铺术语深化成真正的概念专业化链，把跨概念语义落实为清晰关系，并把定义、结构约束、实例、正反例、来源、映射和治理信息完整附着在对应节点和边上。升级的结果必须是一张更深、更清楚、更能解释的图，而不是更多页面。**
