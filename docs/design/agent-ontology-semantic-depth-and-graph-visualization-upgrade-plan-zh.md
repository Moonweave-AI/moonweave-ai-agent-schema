# Moonweave Agent Ontology 语义纵深、模块边界与图谱呈现二次升级计划

> 状态：`Proposed`
> 计划版本：`1.0.0`
> 编制日期：2026-07-14
> 审计基线：`chore/agent-ontology-audit` / `34ef29f`
> 适用范围：本体内容、生成合同、Explorer 图谱、测试、发布与 GitHub Pages
> 前置文档：`docs/design/agent-ontology-unified-graph-upgrade-plan-zh.md`

本计划处理上一轮统一图谱升级后仍然存在的两类根本问题：

1. 内容虽然已经放入同一张图，但大量模块仍然边界重叠、名称生硬，概念仍以“模块直接挂一排节点”的方式平铺；
2. 图谱虽然使用 Cytoscape.js 和 fCoSE 名义上的力导布局，但节点实际上被预先锁定在全局同心层，标签、边和子树没有获得真正的避碰与交叉优化。

本文件是后续实施的唯一二次升级计划。它**不撤回**“一张统一图谱、信息附着节点和关系、不另建 ABox/TBox/Schema/Instance 页面”的产品决定；它撤回的是“八域之下必须固定为 41 个模块”“模块之下只需一层或两层 Concept”“当前同心圆视觉基线不得变化”这三项已经被事实证明不成立的实施假设。

---

## 0. CAPABILITY：升级完成后应获得什么

升级后的系统必须同时具备以下能力：

- 八个一级领域仍作为稳定入口；
- 二级模块由真实能力边界和可回答的问题决定，而不是为了保持 41 这个数字；
- “领域 → 模块 → 概念”只是最短路径，不是最大深度；概念可以继续自然分解到任意深度；
- `A` 与 `A-XXX` 不再无解释地平级；共享词头只触发审查，最终用真实的 `is_a`、`part_of`、`phase_of`、`specifies`、`produces` 等关系组织；
- 模块名和页面标签不再以“模块”结尾；
- 定义、边界、字段、约束、例子、来源、映射和治理状态继续附着在原节点或原关系上；
- 默认视图清楚表达逻辑层级，关系探索视图再展示跨层语义邻域；
- 图谱支持按方向、谓词和数量展开，支持折叠、仅保留选择、适配选择范围和场景重置；
- 视觉质量可以通过“零标签碰撞、主骨架零交叉、边不穿节点/标签、跨链交叉受限、层级无逆序、边标签受控、增量位置稳定”等指标验证；
- 源文件、生成物、生产构建和已部署站点可以用同一内容指纹核对。

成功标准不是“增加了几层”“换了一个布局库”或“多了几个按钮”，而是外部读者能沿着真实逻辑连续理解一个概念为什么位于这里、它与兄弟概念如何区分、它从哪里来、如何使用、与哪些概念发生什么关系。

---

## 1. 当前基线的可复现实证

### 1.1 本体数据不是“已经完成的深层层级”

对 `ontology/agent-ontology.json` 的只读统计结果如下：

| 指标 | 当前值 | 结论 |
|---|---:|---|
| 一级领域 | 8 | 一级框架可以保留 |
| 模块 | 41 | 数量是上一轮冻结结果，不是语义证明 |
| 概念 | 622 | 比旧迁移账本的 572 多 50 个 |
| 关系 | 925 | 关系数量本身不能证明逻辑清晰 |
| `is_a` | 385 | 大量概念仍没有分类父级 |
| 无模块内父概念的 Concept | 239 / 622（38.4%） | 仍然显著平铺 |
| 深度 1 | 297 | 绝大多数只下降一层 |
| 深度 2 | 74 | 少量形成中间层 |
| 深度 3 | 12 | 当前最深仅 3 层 |
| 深度 ≥4 | 0 | 尚未支持用户要求的任意逻辑纵深 |

`research/ontology-concept-hierarchy-migration-ledger.csv` 只有 572 行，其中 125 行被标记为 `keep_root`；但 canonical 已有 622 个 Concept。上一轮“572/572 accepted”只能证明旧术语做过迁移决定，不能证明新增锚点和最终层级形成了闭环。本轮必须建立 622 概念与新拆分概念的完整新账本，旧 `accepted` 不得直接继承。

当前最严重的 Module 直挂比例为：

| Module | 直挂 Concept / 总 Concept | 比例 |
|---|---:|---:|
| `orchestration-actors-delegation` | 17 / 25 | 68.0% |
| `orchestration-evaluation` | 9 / 14 | 64.3% |
| `runtime-system` | 9 / 14 | 64.3% |
| `memory-stores-scopes` | 5 / 8 | 62.5% |
| `feedback-review-optimization` | 9 / 15 | 60.0% |
| `info-indexing` | 8 / 14 | 57.1% |
| `orchestration-composition` | 9 / 16 | 56.3% |
| `safety-injection-defense` | 17 / 31 | 54.8% |

比例只是定位风险，不设置机械通过阈值；最终必须逐个解释 root，而不是把比例压低当成果。

### 1.2 41 个模块的文字边界大多是模板，不是领域边界

当前 41/41 Module 的 `includes` 都是同一句模板，只替换概念和关系数量：

> 本模块直接拥有 N 个概念和 N 条 source-owned 关系；定义、字段、约束、实例、引用和解释附着在对应 canonical 节点或关系上。

当前 41/41 Module 的 `excludes` 也都是同一句模板：

> 兄弟模块拥有的概念，以及与主图并行的 schema 图、实例图或案例影子图；跨模块语义只通过 canonical ID 和唯一关系事实引用。

这两句话可以作为全局治理政策，但不能回答“内容表示与消息有什么不同”“上下文窗口属于暂存还是记忆组装”“运行追踪与日志遥测如何分工”等模块边界问题。所有 Module 的 `purpose/includes/excludes/competency_questions` 都必须按真实领域逐项重写。

### 1.3 当前分类中存在 13 条跨 semantic kind 的 `is_a`

以下关系必须在本轮第一批重新审查；不能仅通过统一枚举值把错误隐藏掉：

| 当前关系 | 当前 kind | 处理方向 |
|---|---|---|
| `Conversation → ConversationElement` | collection → information | 新建共同上位概念，或改为组成关系 |
| `MessageHistory → ConversationElement` | collection → information | 改为组成/记录关系或同 kind 上位概念 |
| `OutputStream → OutputInformation` | collection → information | 改为 `contains` / `groups` 或重新定义上位概念 |
| `OutputWindow → OutputInformation` | specification → information | 窗口是选择规范，不是输出信息的一种 |
| `RevisionPlan → RevisionArtifact` | specification → information | 计划与制品分开，以 `describes` / `guides` 连接 |
| `MappingRule → MappingArtifact` | specification → information | 规则与映射制品分开 |
| `DatabaseRow → IngestibleResource` | information → entity | 重新定义 Resource 上位种类或改摄入对象关系 |
| `Document → IngestibleResource` | information → entity | 同上 |
| `GraphEdge → IngestibleResource` | information → entity | 同上 |
| `GraphNode → IngestibleResource` | information → entity | 同上 |
| `SourceAttachment → IngestibleResource` | information → entity | 同上 |
| `TextCorpus → IngestibleResource` | collection → entity | 同上 |
| `CandidateSet → RetrievalArtifact` | collection → information | 候选集合使用集合上位概念或组成关系 |

### 1.4 当前图谱的 fCoSE 没有真正参与排布

`src/components/OntologyGraph.tsx` 当前实现存在四个直接原因：

1. `hierarchicalRingPositions()` 只依据逻辑深度把同层节点均匀放在全局圆环上，不考虑同一子树的局部性、标签宽度或语义边；
2. fCoSE 的 `fixedNodeConstraint` 覆盖全部节点，布局引擎不能移动任何节点，自然无法避碰或降低交叉；
3. 所有边默认显示文字并使用曲线，缩小后仍无 `min-zoomed-font-size`；
4. `ontology-view-model.ts` 的邻域扩展同时拉入全部入边和出边，没有方向、谓词、数量或场景预算。

因此当前 `data-layout-engine="fcose-force"`、`data-crossing-policy="label-collision-and-crossing-relaxation"` 和 `data-drag-layout="continuous-local-force"` 描述的能力与实际行为不一致，必须删除或改成真实实现。

---

## 2. 资料结论与本项目的设计推论

### 2.1 本体模块与质量

- [FIBO 官方说明](https://edmcouncil.org/frameworks/industry-models/fibo/)展示了稳定领域入口、模块化维护和层级浏览，但并不要求所有领域具有相同层数或相同模块数量。
- [FIBO 开发流程](https://spec.edmcouncil.org/fibo/page/development-process)区分开发与生产成熟度，并要求生产模型经过一致性、完整性和文档审查。本项目应恢复 `provisional → accepted` 的实质审查，而不是让自动生成 reviewer 一次性接受全部概念。
- [FIBO 2025 Q1 Release Notes](https://spec.edmcouncil.org/fibo/release-notes)包含移动概念到更通用模块、消除重复、统一术语和补定义等真实重构，说明“模块和 owner 可调整”本来就是成熟本体治理的一部分。
- 2023 年 [Modular Ontology Modeling](https://journals.sagepub.com/doi/10.3233/SW-222886)把模块定义为围绕关键概念及其关系组织的、可嵌套或可连接的部分，并用用例、competency question、关键概念和模块图推动建模。
- 2023 年 [A conceptual model for ontology quality assessment](https://journals.sagepub.com/doi/10.3233/SW-233393)把 taxonomy、cohesion、coupling、documentation 等放在不同质量维度，说明“有关系”和“有模块”不足以证明模块质量。

Moonweave 的设计推论是：模块之间允许存在语义关联，甚至允许复用一个 canonical Concept；但**主所有权必须唯一、职责问题必须可区分、UI 中不得复制节点**。所谓“不重叠”不等于切断跨模块关系，而是同一概念不在多个模块重复定义，两个模块不能回答同一组核心问题。

### 2.2 统一图谱和节点内信息

- [Palantir Ontology](https://www.palantir.com/docs/foundry/ontology/overview)把对象、属性、链接、动作、函数和治理连接为一个运营语义层。
- [Microsoft Fabric Ontology](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)把 entity type、property、typed directional relationship、constraint 和 graph representation 组织为共享语义层。
- [Skan Agentic Ontology of Work](https://www.skan.ai/whitepapers/agentic-ontology-of-work)可作为工作、属性、关系和治理的厂商案例，但不是中立标准。

Moonweave 继续采用“一张 canonical 图 + 节点/边内信息”。Schema 字段、实例、正反例、来源声明和案例不会变成第二套图元，也不会被拆成平行页面。

### 2.3 图谱布局与交互

- [ELK Layered 官方说明](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html)明确支持分层、交叉最小化、正交/折线路由和跨层关系。
- [ELK 2025 分层算法说明](https://eclipse.dev/elk/blog/posts/2025/25-08-21-layered.html)把布局分为 cycle breaking、layer assignment、crossing minimization、node placement、edge routing 五阶段，并支持复用旧位置的 interactive 策略。
- 2023 年 [The Eclipse Layout Kernel](https://arxiv.org/abs/2311.00533)说明 ELK/elkjs 面向有内在方向的 node-link diagram，并支持 compound graph 和 ports。
- [elkjs 官方仓库](https://github.com/kieler/elkjs)提供 Web Worker 用法，适合把布局计算移出主线程。
- [Cytoscape.js 性能指南](https://js.cytoscape.org/#performance)明确指出标签绘制成本高，建议避免常显边标签并用 `min-zoomed-font-size`。
- [Cytoscape.js 标签文档](https://js.cytoscape.org/#style/labels)提供 CJK `anywhere`、`ellipsis`、标签宽度和端点避让能力。
- [Neo4j Bloom Scene interactions](https://neo4j.com/docs/bloom-user-guide/current/bloom-visual-tour/bloom-scene-interactions/)的关键经验是按关系类型、方向和数量限制展开，支持折叠/筛选/分组和多布局，而不是把整个数据库一次性扔入力导图。
- [Neo4j Bloom Perspectives](https://neo4j.com/docs/bloom-user-guide/current/bloom-perspectives/bloom-perspectives/)表明同一图可以按业务目的控制可见类别、关系、属性和样式。
- [Graphviz dot](https://graphviz.org/docs/layouts/dot/)适合作为离线分层布局对照；[concentrate](https://graphviz.org/docs/attrs/concentrate/)可用于多边路径聚合对照，但不作为交互主引擎。
- [yFiles Hierarchical Layout](https://docs.yworks.com/yfiles-html/dguide/hierarchical_layout/)和其 label/folding/LOD 设计作为商业质量参照，不引入商业依赖。
- [Sigma.js WebGL Renderer](https://www.sigmajs.org/docs/advanced/renderers/)适合更大图量，但不会自动解决层级、标签避碰和现有无障碍合同，因此本轮不迁移。

最终技术决定：继续使用 Cytoscape.js 渲染；默认“逻辑层级”使用 ELK Layered；主动切换的“关系探索”才使用有真实自由度的 fCoSE。

---

## 3. CONSTRAINTS 与 NON-GOALS

### 3.1 不可改变的产品原则

1. 保留当前八个一级领域；
2. 保留单页 Explorer 和一张 canonical 图；
3. Module、Concept、Relation 都在同一图中；
4. 定义、Schema、约束、实例、例子、来源和治理信息附着原节点/边；
5. 不新建 ABox/TBox/Schema/Instance/Citation 独立导航；
6. canonical ID 与展示标签分离：可改中文名而不必立即改稳定 ID；
7. canonical relation 方向不能为了布局被反写；
8. 所有自动生成物都从 `ontology/source/**` 产生，不直接编辑 `ontology/agent-ontology.json`。

### 3.2 本轮不做

- 不部署 Neo4j 数据库；
- 不复制 Neo4j Bloom 的产品外壳；
- 不迁移到 Sigma.js、yFiles 或商业图谱 SDK；
- 不把“层数越深”当成质量指标；
- 不按字符串前缀自动生成父概念；
- 不为了达到 root 百分比阈值硬造 `XXXBase`、`XXXArtifact`、`XXXEntity`；
- 不把字段、枚举、状态值、ID、计数、长度或 MIME type 提升为 Concept；
- 不在本计划阶段直接改 622 个概念；本文件给出可执行迁移顺序和逐项合同。

---

## 4. IMPLEMENTATION CONTRACT：从固定三层改为任意纵深逻辑骨架

### 4.1 节点层数不再是 schema 约束

稳定组织入口仍为：

`Agent Ontology —contains→ Domain —contains→ Module`

Module 以下不再规定 `L3/L4/L5` 的最大或最小层数。一个模块可以出现：

`Module —owns→ 上位概念 ⇒ 中位概念 ⇒ 下位概念 ⇒ 更具体概念 ⇒ …`

是否继续向下，只由以下问题决定：

- 子概念是否继承父概念全部必要特征；
- 子概念是否有可说明的区分特征；
- 新层是否消除了平级混乱；
- 新层是否能被至少一个用例或 competency question 使用；
- 新层是否比把差异放在字段/枚举中更准确。

### 4.2 “共享词头”只触发审查，不自动等于 `is_a`

对 `A`、`A-XXX`、`XXX-A` 采用四步判定：

1. 如果“每个 A-XXX 都是一种 A”成立，建立 `A-XXX is_a A`；
2. 如果 A-XXX 是 A 的组成、阶段、规范、输入、输出或记录，使用真实语义关系；
3. 如果 XXX 只是 A 的状态、值、标识或度量，降为 A 的字段或受控值；
4. 如果 A 和 A-XXX 实际同义，合并并保留 alias，不保留两个平级节点。

不得用名字相似代替语义审查，也不得因为 semantic kind 不同而强行 `is_a`。

### 4.3 分类父级和图上逻辑骨架必须分开但不复制关系

保留 `primary_parent_relation_id`，它只允许指向 Concept 发出的 canonical `is_a`。

为 canonical Relation 新增可选信息：

`layout_role: "primary-backbone" | "secondary-backbone" | "cross-link" | "none"`

规则：

- `layout_role` 只是附着在原关系上的布局解释，不生成第二条关系；
- `is_a` 的 canonical 方向仍为 child → parent，布局计算可临时反向为 parent → child；
- `part_of/specifies/produces/phase_of` 等关系若承担模块内主逻辑链，可以标记 `primary-backbone`；
- 一个 Concept 最多只有一条进入它的 `primary-backbone` 布局父边；额外父边为 `secondary-backbone`；
- 全部 primary backbone 组合必须无环；
- Module 到其根 Concept 的 ownership 边由 `module_id` 派生，不写成伪 `is_a`；
- 布局元数据不改变关系方向、基数、来源和定义。

这使“委派契约不是一种委派过程”仍可被放在“委派”逻辑骨架下，同时边明确显示“规定/约束”而不是伪装成“是一种”。

### 4.4 “协同角色与委派”的目标示例

当前 17 个根概念不能继续直接挂在 Module 下。以下示例仍用“⇒”表示候选 `is_a`，其余边显式写 predicate：

`协同角色`

- `协调角色 ⇒ 编排者角色 / 子智能体角色 / 工作者角色`
- `运行主体 —bears_role→ 协调角色`
- `角色绑定 —records→ 协调归属`；`角色绑定 —binds_context→ 子智能体上下文`

`委派与移交`

- `协作过程 ⇒ 委派过程 / 移交过程`
- `委派阶段 ⇒ 发起阶段 / 接受阶段 / 撤销阶段 / 完成阶段`；`委派阶段 —phase_of→ 委派过程`
- `移交过程 ⇒ 控制移交 / 责任转移`
- `委派约定 ⇒ 委派契约`
  - `委派契约 specifies 委派权限`
  - `委派契约 specifies 委派预算`
  - `委派契约 specifies 委派上下文`
  - `委派契约 specifies 委派目标`
- `协作事件 ⇒ 委派事件 / 移交事件`；`委派事件 —records_phase→ 委派阶段`
- `协作结果 ⇒ 委派结果 / 移交结果`；`委派过程 —produces→ 委派结果`
- `工作者选派 —uses→ 候选池 —contains→ 候选者`
- `可用性判断 —precedes→ 能力匹配 —precedes→ 工作者选择 —precedes→ 工作分配`，四者都 `—phase_of→ 工作者选派`

其中“委派预算”如果只是数字和单位，应成为 `委派契约.budget` 字段；只有预算本身有来源、版本、批准、有效期和独立关系时才保留 Concept。其他“委派 XXX”逐个使用同一判定，不一律保留为类。

---

## 5. 逐层审计流程

每个 Domain 必须按相同顺序执行，但结论不要求相同：

1. 写出 Domain 要支持的闭环用例；
2. 为现有每个 Module 写 3–8 个不重复的 competency questions；
3. 建立 Module × CQ 矩阵；
4. 两个 Module 回答同一个核心 CQ 时，选择“合并、拆分、移动 owner、缩小边界”之一；
5. 为每个 Module 写唯一 `key_notion`、唯一 owner 规则、输入、输出、失败和恢复；
6. 从 key notion 向下审查所有 Concept；
7. 对同词头、同定义、同 kind、同端点关系和同 source claim 做重复检测；
8. 逐条决定 `keep/reparent/retype/move/field/value/merge/split/deprecate`；
9. 先形成可读模块图，再写 JSON；
10. 用 CQ、正例、反例、黄金路径和图谱截图共同验收。

### 5.1 Module 边界模板必须换成真实问题

每个模块 source 文件新增：

`key_notion`、`owns_when`、`references_when`、`boundary_decisions`、`overlap_checks`。

其中：

- `owns_when`：一句可判定的 owner 规则；
- `references_when`：说明其他模块什么时候只引用该概念；
- `boundary_decisions`：逐条记录与兄弟模块的边界；
- `overlap_checks`：列出最容易混淆的 Concept ID 和最终 owner。

全局“信息不成为影子节点”政策移到 product-level hygiene gate，不能继续冒充每个模块的 `excludes`。

### 5.2 中文命名与文案规则

展示标签逐行执行：

- Module 中文 label 使用 2–10 字自然名词短语；
- 删除结尾“模块”；
- 避免“信息产物、能力表面、流程闭包、代表闭包、摄入界面”等没有领域必要性的生硬组合；
- `Artifact` 按语境翻译为“记录、文档、结果、计划、产物”，不统一翻译为“信息制品”；
- `Ingress` 在用户界面优先写“接入/进入”，只有数据管线技术语境使用“摄入”；
- `Surface` 按语境写“接口/入口/可用能力”，不机械写“表面”；
- 定义第一句必须是“上位种类 + 区分特征”，但不得复制标签两次；
- `purpose` 说明用户借此完成什么，不写“本模块以 X relation Y 为代表闭包”；
- `includes` 列真实拥有的概念家族和活动；
- `excludes` 列最容易误入的相邻语义及其 owner；
- 正例必须能对应实际 Agent 构建或运行情境；
- 反例必须解释为什么属于另一个模块或只是字段。

新增 lint，拒绝以下中文片段：

`模块$`、`本模块在“.*”边界内`、`以 .* 为代表闭包`、`把概念层级、语义关系和节点内信息组织成`。

英文、日文不从中文逐字机翻；三语 reviewer 分别确认术语自然性。

---

## 6. 二级模块逐项重构决定

模块数量不是目标。以下给出 **47 个候选模块**：在 41 个现有模块上拆出 6 个边界明确的新模块。实施时只有 CQ 和 owner 审查可以否决某次拆分；不得为了继续显示“41”而合回。

### 6.1 上下文摄入与暂存域

| 当前 ID / 新 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `info-container-command` | 执行观测 | 保留、改名 | 只拥有“执行结果如何成为可见上下文证据”；命令执行归 Tool/Runtime，stdout/stderr/exit status 在本模块作为观测与分块 |
| `info-content-block-modality` | 内容表示 | 保留、改名 | 只拥有 Text/Code/Image/Audio/Table/StructuredData/FileAttachment 等内容载体；MessageContentBlock 移到“消息与会话”或改为关系 |
| `info-indexing` | 上下文发现 | 保留、收窄 | 只拥有本次上下文会话内的轻量候选发现视图；持久索引、向量和版本归 Memory，工具选择归 Tool |
| `info-messages-instructions` | 消息与会话 | 拆分后保留 ID | 只拥有 Conversation—has_turn→Turn—contains_message→Message—contains→Content 的会话结构和消息包络 |
| `info-prompts-instructions` | 提示与指令 | 新增 | 拥有 PromptTemplate/PromptInstance/Instruction/InstructionMetadata/InstructionResolution；InstructionConflict 唯一 owner 仍在 Safety |
| `info-output-disclosure` | 输出披露 | 收窄、改名 | 只拥有输出选择、截断、抑制和披露证据；ContextWindow 移到 Memory，上下文预算不再与输出披露混用 |
| `info-storage-sources` | 来源与定位 | 保留、改名 | 拥有 SourceReference/Location/Identity/Version/Digest/CitationAnchor；资源实体本身归其业务域 |

本域必须先解决三组重叠：

1. `内容表示` 只描述内容“是什么形式”；`消息与会话` 描述内容“位于哪个消息包络”；两者通过 `Message contains ContentBlock` 连接；
2. `消息与会话` 描述发言和顺序；`提示与指令` 描述规范模型行为的内容；同一 Message 可以 `carries Instruction`，但 Instruction 不是 Message 子类；
3. `上下文发现` 产生候选；`上下文组装` 选择并排列候选；`输出披露` 决定运行结果向谁显示多少。

### 6.2 控制与编排域

| 当前 ID / 新 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `orchestration-task-planning` | 目标与任务规划 | 保留、改名 | 组织 Objective/Goal/Plan/Task/Step/Condition；运行中的 Attempt 归 Runtime |
| `orchestration-actors-delegation` | 协同角色 | 拆分后保留 ID | 只拥有协调角色、角色绑定和队伍角色；运行主体归 Runtime |
| `orchestration-delegation-handoff` | 委派与移交 | 新增 | 拥有 Delegation/Handoff/WorkerSelection 的过程、约定、事件和结果 |
| `orchestration-routing-control` | 路由与门控 | 保留、改名 | 拥有 RoutingSpecification/Decision/Route/ControlGate/Retry/Stop 的控制逻辑 |
| `orchestration-composition` | 协作组合 | 保留、改名 | 拥有 Chain/Parallel/Voting/Synthesis 等组合模式和 topology；执行事件归 Runtime |
| `orchestration-evaluation` | 改进循环编排 | 收窄、改名 | 只拥有“如何安排评估—反馈—修订—重试”；Review、Metric、Finding 的语义归 Feedback |

本域的跨域原则：Role 不等于 Actor，Plan 不等于 Run，Review orchestration 不等于 Review content，Agent-as-tool 调用不等于 Delegation。

### 6.3 运行状态与轨迹域

| 当前 ID / 新 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `runtime-actors` | 运行参与者与绑定 | 收窄、改名 | 拥有 Actor、Model、Runtime Binding；权限与 Policy 移到 Safety，协同 Role 移到 Orchestration |
| `runtime-system` | 运行环境与会话 | 拆分后保留 ID | 拥有 AgentSystem/RuntimeEnvironment/WorkingDirectory/RuntimeSession/Lifecycle |
| `runtime-execution-attempts` | 执行尝试与结果 | 新增 | 拥有通用 Execution/Attempt/Outcome/Result/Budget；ToolCallAttempt 作为 Tool 专化引用 |
| `runtime-observability` | 追踪与检查点 | 收窄、改名 | 拥有 Trace/Span/Event/Snapshot/Diff/Checkpoint/Replay；日志流归 Feedback，进入上下文的观测归 Info |
| `runtime-artifacts` | 运行产物 | 保留、改名 | 拥有 Patch/Report/Graph/Schema/Export 等有身份和版本的产物；draft/final 降为状态值 |

### 6.4 互操作适配域

| 当前 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `adapter-mapping-infrastructure` | 映射规则与验证 | 保留、改名 | 唯一拥有 Adapter 上位概念、MappingRule、MappingTest、Coverage、ConversionWarning |
| `adapter-protocols` | 协议映射 | 保留、改名 | A2A/MCP/FIPA/KQML 等协议语义到 core ontology 的版本化映射 |
| `adapter-frameworks` | 框架映射 | 保留、改名 | CrewAI/LangGraph/OpenAI Agents 等框架映射，不复制框架完整类树 |
| `adapter-benchmarks` | 基准映射 | 保留、改名 | Benchmark Task/Environment/Trajectory/Metric/Outcome 到 core 的映射 |
| `adapter-statecharts` | 状态图映射 | 保留、改名 | SCXML/XState State/Transition/Event/Guard/Action 映射 |
| `adapter-schema-export` | 模式导出 | 保留、改名 | JSON Schema/OWL/SHACL/ShEx/Zod/Pydantic 等投影与 round-trip loss |

所有具体 Adapter 通过跨模块 `is_a Adapter` 形成真实纵深；`MappingRule` 不是一种 `MappingArtifact`，规则、执行记录和报告必须分开。

### 6.5 能力与资源调用域

| 当前 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `tool-registry-definition` | 能力定义与注册 | 保留、改名 | Tool/Capability/Definition/Registry/Metadata；name/version/schema 通常是字段 |
| `tool-discovery-selection` | 能力发现与选择 | 保留、改名 | Search/CandidateSet/MatchAssessment/SelectionDecision/Fallback |
| `tool-invocation-execution` | 调用与执行 | 保留、改名 | InvocationSpecification—governs→Invocation—has_attempt→Attempt—produces→Result/Error，Invocation—has_effect→Effect；通用 Attempt 对齐 Runtime |
| `tool-mcp-transport` | MCP 交互 | 保留、改名 | MCP Participant/Session/Capability/Transport/Request/Response/Subscription；协议版本映射归 Adapter |

### 6.6 信任、策略与安全域

| 当前 ID / 新 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `safety-trust-boundary` | 信任边界与数据区 | 保留、改名 | TrustBoundary/DataZone/BoundaryCrossing/AuthorityScope |
| `safety-permission-policy` | 授权与策略决策 | 保留、改名 | Policy/Rule/Condition/Decision/Grant/Approval/Revocation |
| `safety-sandbox-network` | 执行隔离 | 拆分后保留 ID | 只拥有 Sandbox/Filesystem/Process/Mount/IsolationSpecification/EscapeRisk |
| `safety-network-control` | 网络访问控制 | 新增 | 拥有 Endpoint/Request/Route/Proxy/Response/DeniedCall/NetworkPolicy |
| `safety-injection-defense` | 注入与内容投毒防御 | 保留、改名 | ThreatSignal/PoisonedContent/Detection/Finding/Taint/Mitigation；InstructionConflict 唯一 owner 在此 |
| `safety-commit-redaction` | 副作用提交控制 | 拆分后保留 ID | 只拥有 CommitRequest/Gate/Approval/Denial/Effect/Rollback；中文必须明确不是 Git commit |
| `safety-disclosure-redaction` | 披露与脱敏 | 新增 | 拥有 DisclosureRule/SensitiveSpan/Redaction/Suppression/AuditDisclosure；与 Info 输出披露通过 policy decision 连接 |

“执行隔离”和“网络访问控制”都受 Policy 约束，但一个回答“进程能接触什么运行资源”，另一个回答“流量能去哪里”；“输出披露”描述实际显示结果，“披露与脱敏”描述安全规则和变换，不能重复定义 ProgressiveDisclosure。

### 6.7 可观测性与反馈域

| 当前 ID / 新 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `feedback-warning-error` | 故障与诊断 | 保留、改名 | DiagnosticSignal/FailureMode/FailureEvent/Resolution；事件、模式、消息分开 |
| `feedback-metrics-evaluation` | 评估与度量 | 保留、改名 | EvaluationSpecification/Run/Metric/Measurement/Score/Criterion |
| `feedback-review-optimization` | 审查与纠正 | 拆分后保留 ID | ReviewActivity/Review/Finding/Correction/Recovery/Reevaluation |
| `feedback-optimization-learning` | 优化与学习 | 新增 | OptimizationLoop/Target/LearningSignal/ChangeProposal；不得直接自动修改 core policy |
| `feedback-logging` | 日志与遥测 | 收窄、改名 | LogRecord/AuditLog/Stream/Sink/Subscription/TelemetryExportBatch/MeasurementReference/TraceExport；原始 TelemetryEvent 归 Runtime，Metric/Measurement 归“评估与度量” |

### 6.8 记忆与上下文持久化域

| 当前 ID | 页面名称 | 决定 | 唯一 owner 与必须改动 |
|---|---|---|---|
| `memory-ingestion` | 记忆接入 | 保留、改名 | IngestibleContent/IngestionRun/Loader/Policy/Deduplication/Attachment；Resource 不再泛指一切实体 |
| `memory-chunking-situating` | 分块与语境化 | 保留、改名 | Chunk/Boundary/Overlap/Provenance/ChunkingRun/SituatingRun/Compression |
| `memory-embedding-indexes` | 表示与索引 | 保留、改名 | Representation/Embedding/Vector/Index/Version/Shard/Entry/Build/Refresh |
| `memory-retrieval-ranking` | 检索与排序 | 保留、改名 | Query/CandidateSet/Score/RankFusion/Rerank/TopK/Trace |
| `memory-context` | 上下文组装 | 扩大并改名 | ContextWindow/Summary/Slot/Source/Assembly/Ordering/Budget/Exclusion/Refresh；接收 Info 发现候选 |
| `memory-lifecycle` | 记忆生命周期 | 保留、改名 | MemoryOperation ⇒ Write/Update/Merge/Delete/Evict/Expire/Supersede/Consolidate/Validate/Reflect |
| `memory-stores-scopes` | 记忆对象与存储 | 收窄、改名 | MemoryRecord/Item/File/Store/Namespace；kind/duration/scope/retention 作为可组合 facet，不做单互斥树 |

---

## 7. 每个模块的概念纵深施工图

下表只用“⇒”表示候选 `is_a`；“—关系→”一律表示组成、阶段、先后、产出、引用或治理等非分类关系。不得把一条过程链、消息链或组成链因为排版成一行就解释为 `is_a`。任何候选分类在写入 source 前仍须有定义、区分特征、正反例和来源；任何非分类边也须验证方向、基数、逆关系和例外。表格的目的不是一次性制造新节点，而是规定逐模块审查时不得继续把相关概念全挂在 Module 下。

### 7.1 上下文摄入与暂存

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 执行观测 | `执行观测 ⇒ 命令输出观测 / 退出状态观测`；`输出分块 ⇒ 标准输出分块 / 标准错误分块`；`执行引用 ⇒ 结果引用 / 工作目录引用 / 环境绑定引用`；`上下文进入事件 —admits→ 执行观测` | `标准输出/标准错误` 是流还是记录必须统一；退出码降为字段，退出状态观测保留；`上下文进入事件` 不得作为观测 subtype |
| 内容表示 | `内容块 ⇒ 文本块 / 代码块 / 图像块 / 音频块 / 表格块 / 结构化数据块 / 文件附件块`；`消息 —contains→ 内容块` | `mime_type/encoding/token_count/modality` 降为字段；删除伪概念“消息内容关联”；`ContentBlock` 与具体块形成可展开分类树 |
| 上下文发现 | `发现活动 ⇒ 轻量检索`；`发现结果 ⇒ 候选集合`；`候选集合 —contains→ 候选项`；`发现活动 —produces→ 相关性测量 / 排名观测`；`索引引用 ⇒ 版本引用 / 指针引用` | 当前 8 个根重新归入四条骨架；`LightIndex` 必须定义为 Memory Index 的会话视图，不新建第二个持久索引；CandidateRank 通常为字段，评分值不得与观测记录混成共同 subtype |
| 消息与会话 | `会话 —has_turn→ 会话轮次 —contains_message→ 消息`；`消息 ⇒ 系统消息 / 开发者消息 / 用户消息 / 助手消息 / 工具结果消息 / 工具观测消息 / 外部智能体消息`；`消息包络 ⇒ 协议消息包络 / 会话消息包络`；`消息 —references_context→ ContextPackage` | `ContextPackage` 只由 Memory 上下文组装拥有；`ConversationId/ThreadId/TurnIndex` 降字段；`MessageHistory` 改为有序集合或 `Conversation —has_history→ MessageHistory`；不得把会话、轮次、消息写成分类链 |
| 提示与指令 | `提示规范 ⇒ 提示模板`；`提示内容 ⇒ 提示实例`；`提示实例 —instantiates→ 提示模板`；`指令 ⇒ 系统指令 / 开发者指令 / 用户指令 / 覆盖指令`；`指令 —has_authority/priority/scope/source→ 指令元数据`；`指令处理 ⇒ 解析活动 / 冲突检测活动 / 解决活动` | 模板是 specification、实例是 information，二者不得用同一个 `is_a` 父类强行抹平 kind；`PromptVariable` 优先降为模板字段；`FewShotExample` 是提示组成或节点内 Example，由独立身份判定；`InstructionConflict` 仅 Safety 拥有，本模块用关系引用 |
| 输出披露 | `披露活动 ⇒ 选择活动 / 截断活动 / 抑制活动 / 发布活动`；`披露决定 ⇒ 显示决定 / 截断决定 / 抑制决定`；`披露活动 —produces→ 披露记录`；`披露记录 —references→ 内容片段`；`披露记录 —has_outcome→ 显示 / 截断 / 抑制受控值`；`输出窗口规范 ⇒ 首尾窗口规范 / 长度窗口规范` | 记录和片段不得形成 `is_a`；显示/截断/抑制是记录 outcome，不建立状态伪类。删除“上下文窗口”标签；`LengthLimit` 降字段；ProgressiveDisclosure 若指安全策略移到 Safety，若指显示过程则保留活动并改名 |
| 来源与定位 | `来源引用 ⇒ 文件引用 / 数据库行引用 / 图节点引用 / 网络资源引用 / 文本文档引用`；`来源位置 ⇒ 行位置 / 页位置 / 单元格位置 / 字节偏移 / 文本跨度`；`来源引用 —has_location→ 来源位置`；`来源身份信息 —has_version/digest/checksum→ 版本标识 / 摘要 / 校验和`；`来源锚 ⇒ 引用锚 / 内容锚` | 当前 `访问路径、资源描述符、来源锚、来源位置、来源来历、来源引用、文本文档、信任边界引用、来源身份信息` 不再九个平级根；Reference 与 referent 用关系区分；版本、摘要和校验和不得伪装成“来源身份”的 subtype |

精确 owner 迁移：

- `OutputStream/OutputSegment/OutputChunk` 从 `info-output-disclosure` 移到 `info-container-command`；若这些名称需要覆盖非执行输出，则在执行观测中保留具体 `ExecutionOutput*`，通用 ContentBlock 仍由“内容表示”拥有；
- `RetrievalScore/RetrievedCandidate/RetrievedContextCandidate` 从 `info-indexing` 移到 `memory-retrieval-ranking`；Info 只保留会话级 `DiscoveryScore/DiscoveryCandidate`；
- `TextDocument` 实体移到 Memory 接入，Info 只保留 `TextDocumentReference`；
- `VisibleContextWindow` 的 canonical owner 为 Memory 上下文组装；Info 输出披露只引用它并记录显示决定。

### 7.2 控制与编排

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 目标与任务规划 | `意图实体 ⇒ 目标`；`目标 —specified_by→ 工作规约`；`任务计划 —realizes→ 目标`；`任务计划 —contains→ 任务 —contains→ 任务步骤`；`任务 —has_condition→ 前置条件 / 完成标准 / 约束 / 依赖` | Objective/Goal/Intent 给出差异；“可达”作为经评估状态或证据，不建 `ReachableGoal` 伪类；Plan、TaskDefinition 与运行实例不混；`工作项` 若与 Task 同义则合并 |
| 协同角色 | `协调角色 ⇒ 编排者角色 / 子智能体角色 / 工作者角色 / 审查者角色`；`角色绑定 ⇒ 协调归属 / 主体角色绑定`；`运行主体 —bears_role→ 协调角色` | Orchestrator/Subagent/Worker 不再作为永久 Actor subtype；`子智能体上下文` 移到委派约定或上下文绑定 |
| 委派与移交 | `协作过程 ⇒ 委派过程 / 移交过程`；`委派阶段 ⇒ 发起阶段 / 接受阶段 / 撤销阶段 / 完成阶段`；`委派阶段 —phase_of→ 委派过程`；`移交过程 ⇒ 控制移交 / 责任转移`；`委派约定 ⇒ 委派契约`；`工作者选派 —uses→ 候选池 —contains→ 候选者`；`可用性判断 —precedes→ 能力匹配 —precedes→ 选择 —precedes→ 分配`，四者均 `—phase_of→ 工作者选派` | 17 个当前根逐项归类；权限、预算、上下文、目标若只是契约字段则降字段，有独立身份才保留 Concept；`委派事件/结果` 分别挂在 Event/Outcome 上位概念并与过程连接 |
| 路由与门控 | `路由规约 ⇒ 路由策略 / 重试策略 / 停止条件`；`路由处理 —has_phase→ 条件评估 —precedes→ 路由决定`；`路由决定 —selects→ 路由目标`；`控制门 —has_condition→ 门条件`；`控制门 —produces→ 门结果 —governs→ 下游操作` | `Route/GateOutcome` 均不是规约或 Gate subtype；Retry 产生新 Attempt；Stop 必须带终止证据；当前根收敛为规约、处理、门三组 |
| 协作组合 | `组合模式 ⇒ 提示链 / 并行 / 分区 / 投票 / 综合模式`；`组合部件 ⇒ 链阶段 / 并行分支 / 分区任务 / 投票票据 / 综合输入`；`组合活动 ⇒ 聚合活动 / 综合活动`；`组合拓扑 —contains→ 组合部件`；`组合活动 —produces→ 组合输出` | `拓扑、计划、输入、输出、活动` 不得都作为 CompositionPattern subtype |
| 改进循环编排 | `改进循环 ⇒ 评估者—优化器循环 / 审查—修订循环`；`改进尝试 ⇒ 评估尝试 / 修订尝试`；`审查协调 —dispatches/routes/retries→ 改进尝试`；`评估尝试 —precedes→ 修订尝试` | `ReviewEvent/Review/Finding/Feedback/RevisionPlan` 迁 Feedback 或 Runtime owner；本模块只保留控制顺序、停止条件和重试 lineage |

### 7.3 运行状态与轨迹

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 运行参与者与绑定 | `运行主体 ⇒ 人类主体 / 软件主体`；`软件主体 ⇒ 智能体主体 / 外部服务主体 / 系统服务主体`；`运行模型 ⇒ 生成模型 / 嵌入模型 / 重排模型`；`主体绑定 ⇒ 角色绑定 / 能力绑定 / 权限绑定` | 权限绑定 canonical owner 改 Safety 授权；Model 不默认 `is_a` Actor；`远程智能体引用` 移 Info 来源引用或保留 Reference kind |
| 运行环境与会话 | `运行环境 ⇒ 沙箱环境 / 本地环境 / 远程环境`；`智能体系统 —runs_in→ 运行环境`；`运行会话 —has_state→ 启动 / 活跃 / 暂停 / 已结束状态`；`会话生命周期事件 ⇒ 启动事件 / 暂停事件 / 恢复事件 / 结束事件`；`会话生命周期事件 —affects→ 运行会话` | `工作目录` 是环境组成；`进程句柄` 是引用或字段；`SessionLifecycle` 作为状态机/说明，不与事件平级 |
| 执行尝试与结果 | `执行活动 ⇒ 执行尝试 ⇒ 首次尝试 / 重试尝试`；`执行 —has_attempt→ 执行尝试 —produces→ 执行结果`；`执行结果 —has_outcome→ 成功 / 失败 / 取消受控值`；`运行预算 ⇒ 时间预算 / 成本预算 / token 预算 / 调用预算` | `Execution ≠ Attempt ≠ Result ≠ Outcome`；成功/失败/取消默认不是 Result subtype；预算 facet 是否独立 Concept 逐项判定；ToolCallAttempt 作为具体专化或跨域映射，不重复定义 |
| 追踪与检查点 | `可观测记录 ⇒ 追踪记录 / 状态记录`；`追踪记录 —records→ Trace —contains→ Span —contains→ TraceEvent`；`状态记录 ⇒ 状态快照 / 状态差异`；`检查点 —captures→ 状态快照`；`检查点活动 ⇒ 恢复活动 / 回放活动`；`Trace —has_context/link/attribute/status→ 追踪元数据` | `CommandExecution` 是被观测活动；`RetentionPolicy` 移 Policy 或作为字段；Trace、Span、Event 不得再写成分类链；AgentTranscript 与消息历史边界明确 |
| 运行产物 | `运行产物 ⇒ 补丁 / 报告 / 图 / 模式 / 导出产物`；`运行产物 —has_version→ 产物版本` | `DraftArtifact/FinalArtifact` 默认降为 status；每个产物有 generatedBy/derivedFrom/reviewedBy/version；只有版本本身有独立身份时才建 Version Concept，禁止按状态建伪类 |

### 7.4 互操作适配

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 映射规则与验证 | `适配器`；`映射规范 —contains→ 映射规则`；`映射验证 —contains_test→ 映射测试 —produces→ 测试结果 / 映射报告 / 转换警告`；`映射报告 ⇒ 覆盖报告` | Adapter 唯一在此定义；Warning 是验证输出，不是 Report subtype；修正伪关系 `MappingRule is_a MappingArtifact`；每条规则有 source/target/version/direction/loss |
| 协议映射 | `适配器 ⇒ 互操作适配器 ⇒ 协议适配器 ⇒ A2A / MCP / FIPA / KQML 适配器`；`协议映射 ⇒ 能力映射 / 消息映射 / 任务映射 / 信任映射`；`协议适配器 —applies→ 协议映射` | `ProtocolMappingRule` 接入共同 MappingSpecification；协议实例与协议 adapter 不同 kind |
| 框架映射 | `适配器 ⇒ 框架适配器 ⇒ CrewAI / DeepAgents / LangChain / LangGraph / Microsoft / OpenAI Agents 适配器`；`框架映射 ⇒ 角色映射 / 任务映射 / 工具映射 / 记忆映射 / 状态映射 / 追踪映射` | 6 个具体 adapter 不再与 FrameworkMappingRule 平级；版本和 unsupported semantics 附在节点 |
| 基准映射 | `适配器 ⇒ 基准适配器 ⇒ AgencyBench / AppWorld / OSWorld / SWE-bench / τ² / TerminalBench 适配器`；`基准映射 ⇒ 任务映射 / 环境映射 / 动作映射 / 观测映射 / 轨迹映射 / 评分映射` | 具体 benchmark 都要覆盖 task/environment/trajectory/metric/outcome；不复制 benchmark 全部 ontology |
| 状态图映射 | `适配器 ⇒ 状态图适配器 ⇒ SCXML / XState 适配器`；`状态图映射 ⇒ 状态映射 / 转移映射 / 事件映射 / Guard 映射 / Action 映射 / History 映射` | 当前 3 个 Concept 已有浅链，但要补 Mapping 子树与 round-trip loss |
| 模式导出 | `适配器 ⇒ 投影适配器`；`投影适配器 ⇒ 结构模式适配器 / 语义图适配器 / GraphIR 适配器 / 前端视图适配器` | Schema annotation 仍是节点内信息；只有有身份和版本的 SchemaArtifact 才作为 Runtime Artifact |

`adapter-schema-export` 的内部树进一步拆为：

- `ProjectionAdapter ⇒ StructuralSchemaAdapter ⇒ JSONSchema / Zod / Pydantic Adapter`；
- `ProjectionAdapter ⇒ SemanticGraphAdapter ⇒ OWL / SHACL / ShEx Adapter`；
- `ProjectionAdapter ⇒ GraphIRAdapter`；
- `ProjectionAdapter ⇒ FrontendViewAdapter`。

这四类仍位于一个“模式导出”模块，但不再伪装成同一种 Schema Adapter。

### 7.5 能力与资源调用

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 能力定义与注册 | `能力定义 ⇒ 工具定义 / Prompt 定义 / 资源定义`；`工具 ⇒ 函数工具 / 计算机工具 / Shell 工具 / 托管工具 / 本地工具`；`托管工具 ⇒ MCP 工具`；`注册表 —contains→ 注册项 —describes→ 能力定义` | ToolName/Version/Description/ArgumentSchema/ResultSchema 优先字段；Tool、Definition、Implementation、Registry 不混型 |
| 能力发现与选择 | `发现活动 ⇒ 工具搜索`；`候选 ⇒ 工具候选 / 能力候选 / Prompt 候选 / 资源候选`；`候选集合 —contains→ 候选`；`匹配评估 ⇒ 语义匹配 / 正则匹配 / 能力匹配`；`选择决定 ⇒ 工具选择 / 能力选择 / Prompt 选择 / 资源选择` | 当前 8 个根收敛；Fallback 与 Decision 用结果关系，不伪 `is_a` |
| 调用与执行 | `调用规范 —governs→ 调用计划`；`执行请求 —instantiates→ 调用规范`；`调用 ⇒ 工具调用 / 程序化调用 / 命令 / Shell 命令 / Prompt 请求 / 资源读取`；`调用 —has_attempt→ 调用尝试 ⇒ 首次尝试 / 重试尝试`；`调用尝试 —produces→ 调用结果 ⇒ 工具结果 / 资源结果 / 错误结果 / 警告结果`；`调用 —has_effect→ 副作用` | 参数是 binding/field；定义、计划、调用、尝试、结果、效应六者分开；审批与安全检查引用 Safety |
| MCP 交互 | `MCP 参与方 ⇒ Client / Server`；`MCP 会话 —has_participant→ MCP 参与方`；`MCP 能力 ⇒ Tool / Resource / Prompt / Root / Sampling / Elicitation 能力`；`MCP 消息 ⇒ 请求 / 响应 / 通知`；`请求 —expects→ 响应`；`MCP 会话 —carries→ MCP 消息`；`MCP 会话 —establishes→ 订阅 / 授权`；`补充输入 —responds_to→ 补充请求` | 当前 8 个根归入参与方、会话、能力、消息、交互约定、传输；DefinitionList 是集合，不与 Capability 强行同 kind |

### 7.6 信任、策略与安全

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 信任边界与数据区 | `信任边界 ⇒ 内部边界 / 外部边界`；`外部边界 ⇒ 网络边界 / 远程智能体边界 / 工具边界`；`数据区 ⇒ 受信区 / 隔离区 / 不受信区`；`边界穿越 ⇒ 入站穿越 / 出站穿越` | `权限范围` 移授权 facet；每个 crossing 有 source/target/actor/payload/authority/time |
| 授权与策略决策 | `策略规范 —contains→ 策略规则 —has_condition/action/exception→ 条件 / 动作 / 例外`；`策略决定 ⇒ 允许决定 / 拒绝决定 / 升级决定`；`授权凭据 ⇒ 能力令牌 / 身份凭据`；`授权授予 ⇒ 能力授予`；`人工批准事件 —authorizes→ 授权授予`；`许可交互 —has_prompt/response→ 许可提示 / 许可响应`；`授权请求 —precedes→ 策略评估 —produces→ 策略决定 —governs→ 执行` | PermissionScope 是否字段或 Concept 按独立身份判定；凭据、授予、批准事件不得混成一个分类树 |
| 执行隔离 | `隔离规范 —has_constraint→ 文件系统 / 进程 / 挂载 / 系统调用约束`；`沙箱 ⇒ 容器沙箱 / 进程沙箱`；`隔离风险 ⇒ 沙箱逃逸风险` | NetworkEndpoint/Request/Response/Proxy 全部迁新模块；SandboxCommand 引用 Tool Command |
| 网络访问控制 | `网络端点 ⇒ HTTP / Socket / DomainSocket / Proxy 端点`；`网络交互 —starts_with→ 出站请求 —causes→ 网络调用 —completed_by→ 入站响应`；`网络调用 —may_produce→ 被拒网络调用事件`；`网络调用 —routed_via→ 代理路由记录` | `NetworkResource` 与 Memory Resource 分离；每次调用必须有 policy decision 和 response/denial 二选一；不得把请求、调用、响应写成分类链 |
| 注入与内容投毒防御 | `威胁信号 ⇒ 直接提示注入信号 / 间接注入信号 / 工具流注入信号 / 记忆投毒信号 / 持久上下文风险信号`；`威胁信号 —indicates→ 注入或投毒威胁`；`污染断言 —targets→ 工具输出 / Chunk / 描述 / Schema / 资源内容`；仅确有独立身份时建立 `受污染工具输出 / 受污染 Chunk / 受污染描述 / 受污染 Schema / 受污染资源内容`；`检测活动 ⇒ 扫描活动 / 复检活动`；`扫描活动 —produces→ 发现`；`污点角色 ⇒ 源角色 / Sink 角色`；`污点 Span —locates→ 受影响内容`；`污点流 —connects→ 源角色 / 污点 Span / Sink 角色`；`缓解活动 ⇒ 清洗 / 隔离 / 可信覆盖` | Span 是定位范围而非 Role；不得断言所有 ToolOutput/Chunk/Schema 天生“受污染”；当前 17 个根不再星形；`注入特征规范` 属检测规范；`InstructionConflict` 在此；`source—taints→span—flows_to→sink—produces→finding—supports→decision—triggers→mitigation—precedes→recheck` |
| 副作用提交控制 | `副作用请求 ⇒ 提交请求`；`提交控制 —uses→ 提交门 —produces→ 批准决定 / 拒绝决定`；`副作用 —has_reversibility→ 可逆 / 不可逆受控值`；`补偿活动 ⇒ 回滚 / 撤销` | Commit 全部中文明确为“副作用提交”；批准/拒绝是决定，不是 Gate subtype；可逆性是 facet，不建立 SideEffect subtype；所有披露、SensitiveSpan、Redaction 迁新模块 |
| 披露与脱敏 | `披露规则 ⇒ 允许规则 / 截断规则 / 抑制规则 / 脱敏规则`；`敏感内容 ⇒ 秘密 / 个人数据`；`敏感 Span —locates→ 敏感内容`；`披露变换 ⇒ 脱敏 / 遮蔽 / 抑制变换`；`披露审计记录 —has_outcome→ 已披露 / 被抑制受控值`；`披露规则 —governs→ Info 披露活动` | Span 是定位范围，不是 Content subtype；披露 outcome 不建立记录子类；与 Info 只用关系连接；同一个 ProgressiveDisclosure 只保留一个 canonical owner |

### 7.7 可观测性与反馈

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 故障与诊断 | `诊断信号 ⇒ 警告信号 / 风险信号 / 置信信号`；`诊断信号 —communicated_by→ 诊断消息`；`故障事件 ⇒ 错误事件 / 警告事件`；`故障模式 ⇒ 阻断模式 / 可重试模式 / 可降级模式`；`恢复处理 ⇒ 重试处理 / 降级处理 / 终止处理`；`错误流 —contains→ 故障事件` | Message 是信号载体，不是 Signal subtype；Warning 的 signal 与 event 分开；每个错误有位置、severity、retryability、resolution |
| 评估与度量 | `评估规范 —contains→ 场景 / Rubric / Criterion / SuccessCriterion`；`评估运行 —uses→ 评估规范`；`评估运行 —evaluates→ Subject`；`评估运行 —produces→ 测量`；`指标 ⇒ 成本指标 / 延迟指标 / 稳健性指标 / 安全指标`；`测量 —has_value→ 分数 / 布尔结果 / 分布结果` | Metric definition 与 observed Measurement 分开；`Score` 是值或测量结果，不直接挂 Module |
| 审查与纠正 | `审查活动 ⇒ 人工审查 / 自动审查`；`审查活动 —produces→ 审查记录 —contains→ 发现 / 建议`；`纠正活动 ⇒ 修正活动 / 恢复活动 / 回滚活动`；`恢复计划 —guides→ 纠正活动`；`纠正活动 —precedes→ 再评估活动` | 当前 9 个根收敛；旧/新版本和再评估形成闭环 |
| 优化与学习 | `优化循环 ⇒ 参数优化 / 策略优化 / Prompt 优化`；`优化循环 —optimizes→ 优化目标`；`学习信号 ⇒ 反馈信号 / 奖励信号 / 偏好信号`；`变更提议 ⇒ 参数变更 / 策略变更 / Prompt 变更提议`；`学习信号 —supports→ 变更提议` | Feedback 记录若为 information，通过关系承载 FeedbackSignal，不与 signal 混型；LearningSignal 只能触发 proposal；实际发布需 Safety policy/approval；与 Orchestration 改进循环区分“内容”与“编排” |
| 日志与遥测 | `日志记录 ⇒ 应用日志记录 / 工具日志记录`；`审计日志 —derived_from→ 审计记录`；`遥测导出批次 —contains→ 指标观测引用`；`指标观测引用 —references→ 评估与度量的 Measurement`；`日志流 —contains→ 日志记录`；`订阅 —observes→ 日志流`；`消费者 —holds→ 订阅`；`消费者 —delivers_to→ Sink`；`导出活动 ⇒ Trace 导出 / Log 导出 / Metric 导出` | 本模块不拥有通用 TelemetryEvent、Counter/Gauge/Histogram 或 Measurement，只拥有它们的导出批次与引用；`AuditRecord` 是记录、`AuditLog` 是派生集合，二者不得互为 subtype；TraceRecord 不在此复制；`ErrorListener/LogListener` 统一为 Consumer |

Runtime/Feedback owner 固定如下：

- Runtime 唯一拥有原始 `Trace/Span/TraceEvent/TelemetryEvent/Checkpoint/StateSnapshot`；
- Feedback 的“评估与度量”唯一拥有 `Metric/Measurement` 以及 Counter/Gauge/Histogram 测量类别；
- Feedback 的“日志与遥测”唯一拥有 `LogConsumer/Listener/Subscription/Sink/Export/TelemetryExportBatch/MeasurementReference`，只引用原始事件和测量；
- 删除“导出 TelemetryEvent”这个模糊分支；导出管线发生的动作建 `TelemetryExportActivity`，形成的集合建 `TelemetryExportBatch`，都不得与原始 `TelemetryEvent` 同名；
- `AuditRecord/AuditLog` 若分别保留，必须以 `AuditLog derived_from AuditRecord` 明确，不允许两个模块用同义定义重复拥有。

### 7.8 记忆与上下文持久化

| 模块 | 候选逻辑骨架 | 必须逐项处理 |
|---|---|---|
| 记忆接入 | `可接入内容 ⇒ 文档 / 文本语料 / 数据记录 / 图记录 / 文件内容`；`接入组件 ⇒ Loader`；`接入活动 ⇒ 接入运行 / 去重活动 / 规范化活动`；`接入活动 —uses→ Loader / 接入策略`；`接入活动 —attaches_source→ 来源附件` | 修正 6 条 entity/information kind 错配；Policy 不是 Loader subtype；FileSystem/StorageArea 是环境或存储，不是 IngestibleContent subtype |
| 分块与语境化 | `分块产物 ⇒ Chunk ⇒ 语境化 Chunk`；`Chunk —has_reference→ Chunk 引用`；`Chunk —has_metadata→ 分块元数据`；`分块处理 ⇒ 分块运行 / 语境化运行 / 压缩活动`；`分块运行 —consumes→ 文档 —produces→ Chunk` | Compression 是 activity/strategy 二选一；边界、重叠、来源、质量、上下文注记默认是 metadata 字段或值对象，不建平级伪类；保留 source span |
| 表示与索引 | `表示 ⇒ 嵌入 ⇒ 文本嵌入 / 图嵌入`；`向量表示 ⇒ 稠密向量 / 稀疏向量`；`索引 ⇒ 向量索引 / 混合索引 / TF-IDF 索引`；`索引活动 ⇒ 构建活动 / 刷新活动`；`索引版本 —contains→ 分片 —contains→ 条目` | VectorDatabase 是 backend/store，不是 Index subtype；IndexEntry/Key/Shard 与 Version 用组成关系；Model 引用 Runtime |
| 检索与排序 | `检索请求 —has_query→ Query`；`检索集合 ⇒ 候选集合`；`候选集合 —contains→ 候选 Chunk`；`检索评分 ⇒ 词汇评分 / 相似度评分 / 重排评分`；`排序活动 ⇒ 融合活动 / 重排活动 / TopK 选择`；`检索活动 —produces→ 检索结果 —contains→ 已检索 Chunk` | 修正 `CandidateSet is_a RetrievalArtifact`；候选与最终结果分开；每次检索可重放 filter/index version/model/score/order |
| 上下文组装 | `上下文产物 ⇒ ContextWindow / ContextSummary`；`ContextWindow —contains→ ContextSlot —references→ ContextSource`；`上下文组装 —has_phase→ 选择 / 排序 / 裁剪活动`；`上下文规则 ⇒ 顺序规则 / 预算规则 / 排除规则 / 刷新规则`；`上下文事件 ⇒ 刷新事件 / 失效事件`；`上下文组装 —produces→ 不可变上下文版本` | Slot 是结构位置、Source 是引用，二者不得作为上下文产物 subtype；从 Info 接收 Candidate；`ContextPackage` 只保留一个 owner；输出披露不在此 |
| 记忆生命周期 | `记忆操作 ⇒ 写入 / 更新 / 合并 / 删除 / 丢弃 / 驱逐 / 过期 / 替代 / 压缩 / 巩固 / 验证 / 反思 / 衰减操作`；`记忆事件 ⇒ 审计事件 / 冲突事件`；`记忆操作 —produces→ 新记忆版本` | 15 个操作不再直接挂 Module，而是挂“记忆操作”骨架；统一 actor/reason/policy/input/output/result/error |
| 记忆对象与存储 | `记忆实体 ⇒ 记录 / 条目 / 文件`；`记忆存储 ⇒ 本地存储 / 远程存储 / 向量后端`；`记忆实体 —stored_in→ 记忆存储`；`记忆实体 —scoped_by→ 记忆命名空间` | Episodic/Semantic/Procedural、Working/Short/LongTerm、Session/Task/CrossSession 均改为独立可组合 facet，不建错误单继承树 |

---

## 8. 概念迁移账本与审查门

### 8.1 不覆盖旧账本，新增 v3 全量账本

新增 `research/ontology-concept-semantic-depth-v3-ledger.csv`。生成脚本先为当前 622 个 Concept 一概生成一行，随后再加入本轮人工批准的新 Concept；任何 Concept 不允许因为“不在 572 legacy 账本中”而跳过。

固定列为：

`concept_id,current_domain_id,current_module_id,current_label_zh,current_semantic_kind,current_primary_parent_relation_id,current_depth,current_root_status,lexical_family,definition_family,decision,target_domain_id,target_module_id,proposed_label_zh,proposed_semantic_kind,proposed_primary_parent_relation_id,proposed_backbone_relation_id,convert_to_field_of,convert_to_allowed_value_of,merge_into_id,split_into_ids,required_relation_changes,owner_rationale,source_ids,positive_example_id,boundary_example_id,domain_reviewer,ontology_reviewer,language_reviewer,review_status`

`decision` 只能为：

`keep`、`reparent`、`retype`、`move_owner`、`convert_to_field`、`convert_to_controlled_value`、`merge`、`split`、`deprecate`、`remove_invalid`。

删除 `keep_root` 这个决策。一个 Concept 可以最终是 root，但必须在 `root_status` 中选择：

- `domain-upper-root`：能作为跨模块上位概念；
- `module-key-root`：就是该模块关键概念；
- `composition-root`：靠结构关系组织而非 subtype；
- `unresolved-root`：只允许 provisional，不得发布 accepted。

### 8.2 新增模块边界矩阵

新增 `research/ontology-module-boundary-v3.csv`，每个候选 Module 一行：

`module_id,label_zh,key_notion,primary_cq_ids,owns_when,references_when,input_family_ids,output_family_ids,failure_family_ids,recovery_family_ids,overlap_module_ids,overlap_concept_ids,decision,reviewer,review_status`。

再新增 `research/ontology-module-cq-v3.csv`，每个 CQ 一行，并记录唯一 primary owner。该 CSV 是审查工作表，不是脱离 source 的第二权威输入；accepted 行必须回写对应 Module source 的 `competency_questions[].semantic_key/primary_owner_module_id`，随后由 builder 从 source 反向生成并比对 CSV。若同一 `semantic_key` 有两个 primary module、source 与账本 owner 不一致，或账本存在 source 中不存在的 accepted CQ，构建失败。

### 8.3 全量审查门

每个 Concept 发布为 accepted 前必须同时满足：

1. owner 唯一；
2. semantic kind 明确；
3. 是合法 root，或有真实分类/结构骨架父关系；
4. 与最相似兄弟 Concept 有区分说明；
5. 不只是字段、状态或枚举值；
6. 三语标签自然；
7. 定义没有模板句；
8. 至少一个正例；
9. 至少一个反例或边界例；
10. source claim 实际支持该概念或明确标为 design inference；
11. Domain reviewer 与 ontology reviewer 不是同一个自动生成占位身份；
12. 图中能沿主骨架从 Module 到达。

### 8.4 自动检测只报候选，不自动改本体

新增审计器输出：

- 同词头兄弟；
- A 与 A-XXX 同级；
- 高定义相似度；
- 相同 source claim 与相同端点关系；
- semantic kind 不同的 `is_a`；
- Module 直接根节点清单；
- depth 分布；
- 未进入 primary backbone 的 accepted Concept；
- 只有模板 `includes/excludes/purpose` 的 Module；
- 以“模块”结尾的三语展示标签。

首轮必须单列的高风险词族为：`委派`、`上下文`、`消息`、`提示`、`输出`、`检索`、`来源`、`会话`、`执行`、`调用`、`计划`、`策略`、`审查`、`评估`、`日志`、`记忆`。报告对每个词族输出 `member_ids/common_parent_ids/direct_module_siblings/candidate_missing_anchor/decision_status`。同词头只产生待审候选，绝不能据词形自动生成 `A-XXX is_a A`。

这些检查生成 `research/generated/ontology-semantic-depth-audit.json`，但不会自动创建父类或修改关系。

---

## 9. Canonical 合同的精确修改

### 9.1 Module

在现有 `schemas/source/agent-ontology-artifact-contract.json` 的 `$defs.module` 以及 `src/lib/canonical-ontology-types.ts` 中加入：

- `key_notion: LocalizedText`
- `owns_when: LocalizedText`
- `references_when: LocalizedText`
- `boundary_decisions: ModuleBoundaryDecision[]`
- `overlap_checks: ModuleOverlapCheck[]`

`ModuleBoundaryDecision` 的 JSON shape 固定为：

- `other_module_id: Identifier`；
- `subject_concept_ids: Identifier[]`，至少 1 个、去重；
- `decision: "owns" | "references" | "moves-to" | "splits-with" | "deprecates"`；
- `owner_module_id: Identifier`；`deprecates` 时仍填写弃用前 owner；
- `rationale: LocalizedText`；
- `relation_ids: Identifier[]`，允许空数组但必须存在；
- `source_claims: SourceClaim[]`，至少 1 条；
- `review: Review`，Module accepted 时必须 accepted。

`ModuleOverlapCheck` 的 JSON shape 固定为：

- `other_module_id: Identifier`；
- `semantic_area: LocalizedText`；
- `candidate_concept_ids: Identifier[]`，至少 1 个、去重；
- `overlap_reason: LocalizedText`；
- `disambiguation_test: LocalizedText`，必须能据输入判断 owner；
- `result: "distinct" | "move-owner" | "merge" | "split" | "unresolved"`；
- `owner_module_id: Identifier | null`，仅 `unresolved` 可为 `null`；
- `source_claims: SourceClaim[]`，至少 1 条；
- `review: Review`；accepted Module 禁止保留 `unresolved`。

保留 `purpose/includes/excludes`，但 validator 新增：

- 内容不能等于全局模板；
- `includes` 至少列两个真实概念家族或明确的 flat exception；
- `excludes` 至少点名一个容易混淆的相邻语义及 owner；
- 中文 label 不得以“模块”结尾；
- `key_notion` 必须解析到该 Module 唯一拥有的 accepted Concept。

### 9.2 Concept

保留 `module_id`、`semantic_kind` 和 `primary_parent_relation_id`。新增并对 accepted Concept 设为 required：

- `root_status: "domain-upper-root" | "module-key-root" | "composition-root" | "unresolved-root" | null`；
- `lexical_aliases: Array<{ language: "zh" | "en" | "ja"; value: NonEmptyString; alias_kind: "synonym" | "abbreviation" | "legacy-label" }>`，允许空数组，三字段均 required，`language+value` 去重；
- `sibling_differentiation: Array<{ sibling_concept_id: Identifier; shared_parent_concept_id: Identifier | null; differentia: LocalizedText; source_claims: SourceClaim[] }>`，有兄弟时至少 1 项，无兄弟时为空数组。

其中：

- 非 root 的 `root_status=null`；
- root 的 `root_status` 使用 8.1 的受控值；
- `sibling_differentiation` 至少说明最易混淆 sibling ID、共同上位概念和区分特征；
- `lexical_aliases` 只用于检索，不生成影子节点；
- `semantic_kind` 的 `?` 复合临时值必须在本轮清零，改为一个明确 kind 或重新建模关系。

### 9.3 CompetencyQuestion

在现有 `$defs.competencyQuestion` 和对应 TypeScript 类型中新增：

- `semantic_key: Identifier`：表达问题语义的稳定 key，不从自然语言问题自动哈希；
- `primary_owner_module_id: Identifier`：必须等于承载该 CQ 的 Module ID；
- `related_module_ids: Identifier[]`：允许空数组，用于记录被引用但不拥有此 CQ 的模块。

三个字段对 accepted Module 的全部 CQ 都 required。Builder 以 `semantic_key` 建唯一索引：重复 key、owner 不存在、owner 与 source 容器不一致均失败。`research/ontology-module-cq-v3.csv` 由 source 生成后与审查账本逐行比对，不能成为绕过 source schema 的旁路。

### 9.4 Relation

新增：

`layout_role`、`layout_parent_id`、`layout_child_id`。

约束：

- `layout_parent_id/layout_child_id` 必须等于 canonical source/target 之一；
- `is_a` 的 layout parent 必须是 canonical target，layout child 必须是 canonical source；
- 非 `is_a` 根据实际逻辑指定 parent/child，不改变 canonical direction；
- `layout_role="primary-backbone"` 时两端必须是 Concept；
- `primary-backbone` 无环；
- 不允许只为布局创建没有语义定义、来源和例子的 canonical relation；
- 默认 `layout_role="cross-link"`，只有人工审查的结构关系进入层级布局。

### 9.5 生成 metrics

`ontology_metrics` 新增：

`module_count_by_domain`、`root_status_counts`、`concept_depth_histogram`、`max_concept_depth`、`unresolved_root_count`、`cross_kind_is_a_count`、`primary_backbone_cycle_count`、`template_text_violation_count`、`module_label_suffix_violation_count`、`unowned_cq_count`。

这些数字从 source 生成；README 和计划不得手写为长期真相。

---

## 10. 图谱呈现的目标架构

### 10.1 保留渲染器，替换布局责任

目标链路：

`canonical ontology → ontology index → visible scene → layout projection → ELK Worker → preset positions → Cytoscape render`

其中：

- canonical ontology 保存真实节点和真实关系；
- visible scene 只选择当前可见子图；
- layout projection 只选择 ownership 和 backbone 关系；
- ELK 只计算坐标和 bend points；
- Cytoscape 继续负责节点、边、选择、缩放、拖动和事件；
- OntologyCharacteristics 继续显示唯一完整详情；
- fCoSE 只在“关系探索”模式使用。

### 10.2 两种模式

#### 逻辑层级（默认）

- 输入：root/domain/module ownership、primary/secondary backbone；
- 布局：ELK Layered；
- 默认方向：自上而下，可切换从左到右；
- semantic cross-link 只渲染，不影响 rank；
- 单击只聚焦，不重排；
- 展开/折叠改变 topology 时执行增量 ELK；
- 用户手动拖动后节点成为 manual pin，重置布局时清除。

#### 关系探索（主动切换）

- 输入：当前 scene 的全部可见 canonical relations；
- 布局：fCoSE；
- 只固定焦点和必要的 ancestor path，不固定全部节点；
- `randomize=false`，复用逻辑层级坐标作为初始位置；
- 按方向、predicate 和 limit 拉入语义邻居；
- 切回逻辑层级时恢复 ELK backbone 坐标，不把 fCoSE 位置写回 canonical。

### 10.3 ELK 投影规则

`LayoutProjectionNode`：

`ref,logicalDepth,ownershipParentRef,semanticPrimaryParentRef,width,height,previousPosition,isPinned`。

`LayoutProjectionEdge`：

`canonicalRelationId,parentRef,childRef,role,priority`。

只允许三类投影边：

1. root/domain/module ownership；
2. `layout_role=primary-backbone`；
3. `layout_role=secondary-backbone`。

禁止把全部 925 条 semantic relations 交给默认层级布局。canonical `is_a` 为 child→parent，但投影临时使用 parent→child；渲染箭头仍遵循 canonical。

首轮 ELK 参数：

```text
elk.algorithm=layered
elk.direction=DOWN
elk.edgeRouting=ORTHOGONAL
elk.layered.crossingMinimization.strategy=LAYER_SWEEP
elk.layered.considerModelOrder.strategy=PREFER_NODES
elk.spacing.nodeNode=54
elk.layered.spacing.nodeNodeBetweenLayers=92
elk.spacing.edgeNode=28
elk.separateConnectedComponents=true
```

增量展开增加：

```text
elk.interactive=true
elk.layered.crossingMinimization.semiInteractive=true
```

这些值必须通过 3 个高密度 fixture 调优，不得只在根视图验收。ELK 返回的每条 edge `sections[].startPoint/bendPoints/endPoint` 必须随坐标一起保留，不能只取 node position 后让 Cytoscape 再随机路由。

### 10.4 节点

| 类型 | 基础直径 | 默认标签 |
|---|---:|---|
| Ontology root | 56px | 始终显示 |
| Domain | 50px | 始终显示 |
| Module | 44px | structure LOD 以上显示 |
| 非叶 Concept | 36px | structure LOD 以上显示 |
| 叶 Concept | 30px | relations LOD 以上显示 |
| Focus | 基础 +6px 外环 | 完整显示 |

状态不依赖互相覆盖的颜色：

- domain/kind 使用填充色；
- focus 使用高对比外环；
- expanded 使用内环；
- hidden children 使用 `+N` badge；
- case path 使用第二外环；
- provisional/deprecated 使用角标或描边样式。

节点尺寸传给 ELK 时必须包含标签 bounding box。中文使用与 Cytoscape 相同字体执行 `measureText()`，不能按字符数估算。

### 10.5 标签

- 默认 `text-wrap: ellipsis`；
- `text-max-width: 112px`；
- CJK `text-overflow-wrap: anywhere`；
- focus/hover 切换完整 `wrap`；
- `min-zoomed-font-size: 9px`；
- 边端点在可用时使用 `outside-to-node-or-label`；
- 标签优先级：focus > ancestor path > case path > expanded non-leaf > module/domain > leaf；
- edge label 默认空字符串；
- 只有 focused/hover/case-path edge 显示 predicate；
- 同一画面同时显示的边标签最多 12 条，超出时按优先级隐藏并在 legend 说明。

### 10.6 边

| 边族 | 默认样式 | 默认文字 | 是否参与 ELK |
|---|---|---|---|
| ownership | ELK bend points 驱动的细实线 `segments` | 无 | 是 |
| primary backbone | 主色较粗 orthogonal `segments` | 无 | 是 |
| secondary backbone | ELK bend points 驱动的较淡虚线 `segments` | 无 | 是 |
| semantic cross-link | 低透明度细 `bezier` | 无 | 否 |
| focused relation | 高对比、带方向箭头 | 显示 | 否，除非本身 backbone |
| case path | 独立颜色和层级 | 显示 | 否 |

不同 predicate 不得因为同端点而合并。同端点且同 predicate 的多条事实可以聚合成一条带数量 badge 的 scene edge，点击后在原详情区列出每条 canonical relation。

ELK bend point 到 Cytoscape 的映射固定如下：

1. 有两个以上 bend point 时使用 `curve-style: segments`；
2. 对 source `S`、target `T` 和每个 bend point `B`，计算 `weight=dot(B-S,T-S)/|T-S|²` 与 `signedDistance=cross(T-S,B-S)/|T-S|`，按路径顺序写入 `segment-weights/segment-distances`；
3. 只有一个正交拐点且无需保持多段路径时可用 `taxi`，否则不得用 `taxi` 近似丢失 ELK 路由；
4. 无 bend point 的边使用 straight/bezier；同端点平行边在转换后施加稳定的对称 offset；
5. 改变 canonical 箭头方向只改 `source-arrow/target-arrow`，不得反转 ELK 的 parent→child 路由点序列；
6. 坐标和路由统一按画布原点归一化，ResizeObserver 只触发重新测量，不二次缩放 bend point。

三个 dense fixture 的 release 阈值固定为：`primaryBackboneCrossingCount===0`、`edgeNodeIntersectionCount===0`、`edgeLabelCollisionCount===0`、`semanticCrossLinkBackboneCrossingCount<=2` 且不超过可见 cross-link 的 5%、`edgeRouteCollisionEstimate<=2`。共享端点起始 8px 内的合法汇聚不计碰撞；任何阈值调整必须附 before/after 图和原因，不能直接放宽测试。

### 10.7 交互

单击节点：

- 更新 focus；
- 坐标不变；
- 高亮 primary parent、children、semantic incoming、semantic outgoing；
- 同页详情滚动到该节点。

双击节点：

- 默认只展开逻辑子节点；
- 不自动拉入全部语义邻居；
- 展开前显示将加入的节点数。

右键或键盘 `Shift+F10` 菜单：

- 展开子概念；
- 展开上位概念；
- 展开入向关系；
- 展开出向关系；
- 选择 predicate；
- 设置最多加入 N 个节点，默认 12；
- 折叠分支；
- 移除此节点；
- 仅保留选择；
- 适配选择范围。

画布工具栏：

- 放大、缩小；
- 适配全部；
- 适配选择；
- 重置场景；
- 重置布局；
- 逻辑层级 / 关系探索；
- 自上而下 / 从左到右；
- 关系类型筛选；
- 关系标签开关；
- 可折叠 legend。

所有操作必须有按钮和键盘路径，不能只有鼠标右键。

### 10.8 语义缩放和场景预算

| LOD | Zoom | 显示 |
|---|---:|---|
| overview | `<0.45` | 圆点、focus/path、Domain/Module、primary backbone |
| structure | `0.45–0.80` | 非叶标签、primary/secondary backbone |
| relations | `0.80–1.35` | 全部节点标签、focus semantic neighborhood |
| detail | `≥1.35` | 完整 hover/focus 标签、选中边文字、badge、方向提示 |

硬预算：

- scene 默认最多 120 nodes；
- scene 默认最多 220 edges；
- 单次 semantic expansion 最多 12 个新节点；
- 单次 hierarchy expansion 可以超过 12 个，但先显示数量并允许分批；
- 超限不静默截断，保留“尚有 N 个未显示”；
- 用户必须能折叠已经展开的任意节点。

### 10.9 画布尺寸和移动端

- desktop `height: clamp(38rem, 72dvh, 64rem)`；
- tablet 至少 34rem；
- mobile 至少 32rem；
- 工具栏位于画布左上；
- legend 位于右下并可折叠；
- mobile 的 context menu 改为同页 bottom sheet；
- 画布容器使用 `contain: layout paint`；
- reduced motion 时坐标直接应用，不执行补间动画。

---

## 11. 逐文件、逐字段修改清单

本节是实施时的文件级 checklist。所有“生成文件”只能由 release pipeline 改写。

### 11.1 `ontology/source/agent-ontology.product.json`

逐行修改：

1. product `includes` 中“八个领域、四十一个模块”改为不手写模块数量：

   > 八个 Agent 工程领域，以及按能力边界组织、可独立审查的模块、概念和关系。

2. product 示例中的“领域、模块和概念层级”改为：

   > 工程师沿领域、模块和任意深度的逻辑骨架定位 Agent 构件，并在同一节点或关系查看结构、案例与来源。

3. 八个 Domain 的 `includes/excludes/purpose` 逐域改写，删除统计数量和统一模板；
4. case path review note 删除“41 模块已完成”的结论，改为本轮发布实际生成 metrics；
5. `hygiene_gates` 新增：

   - `no-module-label-suffix`；
   - `no-template-module-copy`；
   - `no-unresolved-accepted-root`；
   - `no-cross-kind-is-a`；
   - `primary-backbone-acyclic`；
   - `every-primary-cq-has-one-owner`。

6. Product review 只能在全部 v3 ledger accepted 后更新。

### 11.2 41 个现有 Module source

每个 `ontology/source/<domain>/<module-id>.json` 都执行：

1. `labels.zh` 按第 6 节逐行替换，删除“模块”；
2. `labels.en/ja` 同步用自然领域名称，不保留 `Module/モジュール` 后缀作为页面 label；
3. 重写 `definitions`，第一句说明关键概念和边界；
4. 重写 `purpose`，删除“代表闭包”模板；
5. 重写 `includes`，点名本模块拥有的概念家族；
6. 重写 `excludes`，点名最容易混淆的相邻模块和 owner；
7. 新增 `key_notion/owns_when/references_when/boundary_decisions/overlap_checks`；
8. 重写 3–8 个 `competency_questions`，不得只替换模块名；
9. 按第 7 节迁移 Concept 与 Relation；
10. 仅 owner 移动或 reparent 且指称、`semantic_kind`、身份条件不变时保留旧 Concept ID；
11. 标签/定义变化导致指称改变，或 `semantic_kind` 变化时，创建语义准确的新 ID；旧 ID 设置 `status=deprecated`、`deprecated_in`、`replaced_by_ids`、`deprecation_reason`，并迁移关系、例子、claims 与 CQ，禁止就地语义突变。例如把 `WorkerAgent` 的语义改成角色时必须新建 `WorkerRole` 并弃用旧 ID，不能只保留 `WorkerAgent` 名称却改写成 Role；
12. 被合并、拆分或降为字段/受控值的 Concept 使用相同的正式 deprecation metadata，并在 v3 ledger 记录 replacement/field owner；
13. 同步重写 `interaction_contract.applicability`、`facets.input/output/failure/recovery` 及各 facet 新增的 `description/family_concept_ids/relation_ids`，删除旧 owner 和旧模块名；`applicable=false` 时数组必须为空且 `not_applicable_reason` 必填；
14. 同步重写 `taxonomy_contract.applicability/not_applicable_reason` 及新增的 `hierarchy_policy/key_root_concept_ids/allowed_backbone_predicates/flat_root_exception_concept_ids`，使其与任意深度 backbone 一致；
15. 同步修改 `examples[].labels/descriptions/why_valid_or_invalid/related_node_ids/related_relation_ids`，不得保留已迁移节点的旧案例叙述；
16. 同步修改 `source_claims[].supports`，区分外部事实与本轮 design inference，不得让 claim 继续“支持”已撤回边界；
17. 同步修改 `review.reviewers[].decision_note` 与 `change_note`，准确说明拆分、移动、reparent、retype 和弃用决定；
18. 每个 CQ 同步写入 `semantic_key/primary_owner_module_id/related_module_ids`；
19. 所有 automated reviewer 占位必须由领域 reviewer 与 ontology reviewer 分别再审。

改名完成检查不是只搜索 `labels`：对每个旧中文/英文/日文模块名执行全仓 `rg`，在该 source 的 `definitions/purpose/includes/excludes/interaction_contract/taxonomy_contract/examples/competency_questions/source_claims/review/change_note` 中命中数必须为 0；仅 deprecation/history 文本可保留，并须显式标注历史名称。

### 11.3 新增 6 个 Module source

新增：

- `ontology/source/info/info-prompts-instructions.json`；
- `ontology/source/orchestration/orchestration-delegation-handoff.json`；
- `ontology/source/runtime/runtime-execution-attempts.json`；
- `ontology/source/safety/safety-network-control.json`；
- `ontology/source/safety/safety-disclosure-redaction.json`；
- `ontology/source/feedback/feedback-optimization-learning.json`。

每个新文件从空白 module contract 建立，不复制旧文件全文后批量替换名称。旧模块中的 Concept 和 source-owned relation 用 `git mv` 等价的 owner 迁移方式移动；只有纯 owner 移动/reparent 才保持 canonical ID，任何指称或 kind 变化按 11.2 的新 ID + deprecation 规则处理。

### 11.4 13 条跨 kind `is_a`

在相应 source 文件中逐条执行第 1.3 节的处理，并为每条关系在 v3 ledger 记录：

`keep_after_retype`、`replace_with_relation`、`replace_parent` 或 `deprecate`。

新增测试 fixture 必须覆盖：

- collection 不能 `is_a information`；
- specification 不能 `is_a information`；
- information 不能 `is_a entity`；
- 若上下位都改为同一受控 kind，必须提供重新定义说明，不能只改枚举。

### 11.5 Source schema

修改：

- `schemas/source/agent-ontology-artifact-contract.json` 中的 `$defs.interactionFacet`、`$defs.interactionContract`、`$defs.taxonomyContract`、`$defs.module`、`$defs.concept`、`$defs.competencyQuestion`、`$defs.relation`、`$defs.ontologyMetrics`；
- 生成的 `schemas/agent-ontology.schema.json` 和 `schemas/generated/concept-payloads.schema.json`；
- `tests/fixtures/ontology-v2/product-source.valid.json`、`tests/fixtures/ontology-v2/module-source.valid.json`；
- 为本轮新增对应 invalid fixtures。

精确加入第 9 节字段、枚举和 conditional constraints。Schema 要拒绝未知字段，避免 builder 静默忽略 `layout_role`。

`$defs.interactionFacet` 新增 required 字段 `description: LocalizedText | null`、`family_concept_ids: Identifier[]`、`relation_ids: Identifier[]`；`applicable=true` 时 `description` 非空且两个 ID 数组至少一个非空，`applicable=false` 时 description 为 null、数组为空、`not_applicable_reason` 非空。`$defs.taxonomyContract` 新增 required 字段 `hierarchy_policy: "arbitrary-depth-reviewed-backbone"`、`key_root_concept_ids: Identifier[]`、`allowed_backbone_predicates: Identifier[]`、`flat_root_exception_concept_ids: Identifier[]`，并把 `applicability` 扩为 `"specialization" | "mixed-backbone" | "flat-root-exception"`；accepted Module 不得以空数组逃避 taxonomy 审查。

### 11.6 Builder 与生成物

修改 `scripts/lib/ontology-build-validation.mjs`：

- 递归发现 `ontology/source/<domain>/*.json` 中 `source_kind=agent-ontology-module` 的文件，不硬编码 47；
- 将发现的 Module ID 集合与 accepted `research/ontology-module-boundary-v3.csv` 做双向集合校验；47 只是一轮候选结果，不是 builder 常量；
- 校验 Module label suffix；
- 校验模板文案；
- 校验 key notion owner；
- 从 source 的 `competency_questions[].semantic_key/primary_owner_module_id` 校验 CQ 唯一 owner，并与 CQ ledger 比对；
- 校验 relation layout endpoints；
- 校验 primary backbone DAG；
- 校验 root_status；
- 输出新 metrics；
- 发现 `semantic_kind` 临时复合值时失败；
- 失败信息精确到 source path、JSON Pointer、entity ID。

同时修改 `loadAndValidateSources/sourceTreeFingerprint/generatedFrom` 的接线：`loadAndValidateSources` 仍只把 `ontology/source/**/*.json` 解析为 ontology source；另新增 `loadReleaseEvidence` 读取三个 accepted v3 ledger 和两个 source registry CSV 的 raw bytes。`sourceTreeFingerprint` 接收 source + evidence 两类有序 entry，`generated_from` 记录全部 repo-relative path；CSV 只参与审查门与指纹，不被解析成 graph node/edge。

同步修改 `scripts/lib/ontology-build-validation.d.mts`：为新增 Module/Concept/CQ/Relation 字段补全只读输入类型，为 validation diagnostics 增加对应 error code；禁止用 `Record<string, unknown>` 绕过 schema。

修改 `scripts/lib/ontology-build-artifacts.mjs`：

- 生成 Markdown 时按 backbone 递归，而不是只按 Module→Concept 平铺；
- 每个 Concept 后紧跟自己的定义、结构、例子、来源；
- 不生成独立 Schema/Instance 章节；
- 生成 graph diagnostics；
- 所有产物带 source fingerprint 和 generator version。

同步修改 `scripts/lib/ontology-build-artifacts.d.mts`：`computeOntologyMetrics` 返回值从 `Record<string, number>` 改为明确的 `OntologyMetrics`，其中 `module_count_by_domain/root_status_counts/concept_depth_histogram` 是只读 map，其他项为 number；release pipeline 的调用声明同步更新。

`ontology/agent-ontology.json`、`ontology/agent-ontology-definitions.json`、`ontology/agent-ontology.md`、`schemas/agent-ontology.schema.json`、`schemas/generated/concept-payloads.schema.json`、`src/generated/source-index.json` 和 metrics 均由 `npm run ontology:release` 生成，禁止手改。

### 11.7 Research 与来源

新增：

- `research/ontology-concept-semantic-depth-v3-ledger.csv`；
- `research/ontology-module-boundary-v3.csv`；
- `research/ontology-module-cq-v3.csv`；
- `research/source-notes/ontology-engineering/semantic-depth-module-boundary-and-graph-layout-2023-2026.md`。

三个 v3 CSV 在审查阶段可编辑；一旦行标记 accepted，该决定必须镜像进对应 source 字段，并作为 release evidence 纳入 source fingerprint。CSV 不直接生成额外 graph node/edge，也不在产品 UI 形成第二套结构。

在 `research/source-registry.csv` 登记第 2 节新用资料，至少包括 MOMo 2023、Ontology Quality 2023、ELK 2023/官方文档、Cytoscape、Neo4j Bloom、Graphviz。living doc 同步进入 `research/living-source-metadata.csv`；论文和 living doc 不混类型。

### 11.8 `src/lib/canonical-ontology-types.ts`

加入：

- `RootStatus`；
- `RelationLayoutRole`；
- `ModuleBoundaryDecision`；
- `ModuleOverlapCheck`；
- `CompetencyQuestion.semantic_key/primary_owner_module_id/related_module_ids`；
- 新 Module 字段；
- Relation layout parent/child；
- 新 metrics。

所有类型保持 `readonly`；reducer 和 builder 不原地 mutate array、Set 或 Map。

### 11.9 `src/lib/ontology-index.ts`

新增索引：

- `primaryBackboneChildrenByRef`；
- `secondaryBackboneChildrenByRef`；
- `backboneParentByRef`；
- `semanticIncomingByRef`；
- `semanticOutgoingByRef`；
- `relationsByPredicate`；
- `directChildCountByRef`；
- `semanticDegreeByRef`；
- `moduleKeyNotionById`。

构建时检测循环和重复 primary backbone；不在 UI render 时重复扫描 925 条关系。

### 11.10 `src/lib/ontology-view-model.ts`

将当前 `graphExpandedRefs: ReadonlySet` 替换为不可变的 scoped expansion map：

`hierarchyChildren,semanticDirection,predicates,limit`。

为 `VisibleOntologyNode` 增加：

`layoutParentRef,ownershipParentRef,semanticPrimaryParentRef,logicalDepth,directChildCount,hiddenChildCount,semanticDegree,isExpanded,isExpandable,isOnFocusPath,isPinned`。

为 `VisibleOntologyEdge` 增加：

`family,direction,parallelGroupKey,parallelCount,labelPriority,affectsHierarchyLayout`。

删除 `addExpandedNeighborhood()` 一次性混入全部入/出邻居的行为，拆为：

- `expandHierarchyChildren`；
- `expandHierarchyParent`；
- `expandSemanticIncoming`；
- `expandSemanticOutgoing`；
- `collapseBranch`；
- `dismissSceneNodes`；
- `retainSceneSelection`。

加入 120/220 scene budget 和精确 hidden counts；超限返回诊断对象，不抛出难懂异常，也不静默截断。

### 11.11 新增 `src/lib/ontology-layout.ts`

固定导出：

- `buildHierarchyLayoutProjection(index, view)`；
- `measureOntologyNode(label, kind, locale, state)`；
- `createElkGraph(projection, options)`；
- `normalizeElkPositions(result)`；
- `layoutTopologySignature(projection)`；
- `graphLodForZoom(zoom)`；
- `verifyLayoutInvariants(nodes, edges, positions)`。

`verifyLayoutInvariants` 至少返回：

`nodeLabelOverlapCount,primaryHierarchyViolationCount,backboneCycleCount,unplacedNodeCount,primaryBackboneCrossingCount,edgeNodeIntersectionCount,edgeLabelCollisionCount,semanticCrossLinkBackboneCrossingCount,edgeRouteCollisionEstimate`。

`ontology-layout.ts` 同时实现 `elkSectionsToCytoscapeSegments()`，严格按 10.6 的 projection 公式生成 `segmentWeights/segmentDistances`；自环单独生成 loop route，不进入 `|T-S|²` 为零的公式。

### 11.12 新增 `src/workers/ontology-layout.worker.ts`

Request：

`requestId,topologySignature,mode,direction,nodes,edges,previousPositions,pins,options`。

Response：

`requestId,topologySignature,positions,bendPoints,durationMs,diagnostics,error`。

要求：

- 使用 `elkjs`；
- Worker 内使用 `import ELK from "elkjs/lib/elk.bundled.js"`；主线程不 import ELK；
- `useOntologyGraphController.ts` 用 `new Worker(new URL("../workers/ontology-layout.worker.ts", import.meta.url), { type: "module" })` 交给 Vite 独立分包；
- ELK 类型从包内 declaration 导入；若 bundled subpath 无法解析，只新增精确的 `src/types/elkjs-bundled.d.ts` re-export，禁止声明 `any`；
- 主线程忽略旧 request；
- unmount 时 terminate；
- Worker error 时回退 Cytoscape `breadthfirst` 并显示可见状态；
- 不回退到当前同心圆；
- 不把 Worker 结果写入 ontology source。

#### 11.12.1 `package.json` 与 `package-lock.json`

- 用项目现有 npm 工作流把 `elkjs` 加入 runtime `dependencies`，不使用 CDN；
- 提交 `package.json` 与 npm 生成的 `package-lock.json`，不得手改 lock integrity；
- `typecheck` 必须覆盖 Worker module 和 bundled import；
- `build` 必须产生独立 Worker chunk，bundle 检查确认主应用 chunk 未重复打入 ELK；
- 运行 `npm audit`、license 检查和现有 dependency review；高危问题未解释/未修复不得合并。

### 11.13 `src/components/OntologyGraph.tsx`

必须删除：

- `hierarchicalRingPositions()`；
- 对全部节点的 `fixedNodeConstraint`；
- 默认所有边 `label: data(label)`；
- 声称未实现能力的三个 data attribute；
- topology/theme/language 任一变化都销毁 Cytoscape core 的路径。

必须加入：

- 初始化 `layout: { name: "preset" }`；
- Cytoscape core 只创建一次；
- topology 变化用 `cy.batch()` 增删；
- theme 只更新 style；
- language 变化重新测量并发起 Worker；
- focus/hover 只切 class；
- zoom 切换 LOD class；
- ResizeObserver 防抖；
- drag end 记录 manual pin；
- background tap 清 edge focus；
- stale Worker response 防护；
- reduced-motion 直接落坐标。

将画布 data attribute 精确改为：

```text
data-layout-engine="elk-layered"
data-layout-mode="hierarchy|relations"
data-layout-policy="canonical-backbone-layered"
data-lod-level="overview|structure|relations|detail"
data-layout-invariant="pending|true|false"
data-drag-layout="manual-pin-with-reset"
data-crossing-policy="elk-layered-crossing-minimization"
```

### 11.14 新增前端文件

新增：

- `src/components/graph/GraphToolbar.tsx`；
- `src/components/graph/GraphContextMenu.tsx`；
- `src/components/graph/GraphLegend.tsx`；
- `src/components/graph/GraphExpansionMenu.tsx`；
- `src/components/graph/GraphStatus.tsx`；
- `src/hooks/useOntologyGraphController.ts`。

`OntologyGraph.tsx` 保持在 800 行以下；新组件每个只承担一个交互职责。

### 11.15 `src/App.tsx`

新增 state：

`graphLayoutMode,graphLayoutDirection,visibleRelationPredicates,graphLodOverride,graphExpansionState,graphSelection,manualPins`。

新增 callback：

`expandGraphRef(ref, scope)`、`collapseGraphRef(ref)`、`dismissGraphRefs(refs)`、`retainGraphSelection()`、`fitGraphSelection()`、`resetGraphScene()`、`resetGraphLayout()`。

URL hash 至少稳定保存 `root/focus/layoutMode/direction`；predicate list 排序后序列化。选择节点只更新 focus，不隐式改变 root。

### 11.16 `src/i18n/ui-text.ts`

中英日逐行新增：

| key | 中文 |
|---|---|
| `graphModeHierarchy` | 逻辑层级 |
| `graphModeRelations` | 关系探索 |
| `expandChildren` | 展开子概念 |
| `expandParent` | 展开上位概念 |
| `expandIncoming` | 展开入向关系 |
| `expandOutgoing` | 展开出向关系 |
| `selectPredicates` | 选择关系类型 |
| `addAtMostNodes` | 最多加入 {count} 个节点 |
| `collapseBranch` | 折叠分支 |
| `retainSelection` | 仅保留选择 |
| `fitAll` | 适配全部 |
| `fitSelection` | 适配选择 |
| `resetScene` | 重置场景 |
| `resetLayout` | 重置布局 |
| `showRelationLabels` | 显示关系名称 |
| `hideRelationLabels` | 隐藏关系名称 |
| `hiddenNeighbors` | 尚有 {count} 个节点未显示 |
| `sceneBudgetReached` | 当前图谱已达到显示上限，请筛选关系或折叠分支 |
| `layoutFallback` | 自动布局暂时不可用，已切换到基础分层布局 |

删除或改写仍把二级节点称为“模块”的用户界面说明；类型 legend 可以显示“模块节点”，但实体 label 不带后缀。

### 11.17 `src/styles/app.css`

删除把现有像素基线当成冻结合同的注释；新增：

`.graph-toolbar`、`.graph-context-menu`、`.graph-legend`、`.graph-expansion-menu`、`.graph-status`、`.graph-hidden-count`、`.is-context-dimmed`、`.is-manually-pinned`、`.lod-overview`、`.lod-structure`、`.lod-relations`、`.lod-detail`。

实现第 10.9 节高度、WCAG 对比度、focus visible、mobile bottom sheet、reduced motion。不能用 CSS 隐藏布局碰撞来伪造“零重叠”。

### 11.18 `docs/design/ontology-explorer-art-direction.md`

撤回：

- 中心辐射/全局同心环是固定视觉语言；
- 所有关系名称常显；
- visual baseline 除状态外不得变化。

写入：

- Neo4j-like 指 scene exploration 和圆形节点，不等于 Neo4j 服务；
- 层级模式与关系模式；
- LOD、场景预算和按需标签；
- 三个密集模块作为视觉基准；
- 单图和同页详情保持不变。

### 11.19 README 与生成文档

修改 `README.md`、`docs/README.zh.md`、`docs/README.ja.md`：

- 不再写固定 41 modules；
- 不再宣称 fCoSE 是默认层级布局；
- 说明模块标签简化、任意纵深、ELK 逻辑层级和 fCoSE 关系探索；
- 统计数字从 generated metrics 读取；
- 继续声明节点信息不成为第二套图。

---

## 12. TDD：先写哪些失败测试

### 12.1 Module 与文案

新增 `tests/ontology-module-boundary.test.ts`：

- `rejects a module label ending with 模块`
- `rejects copied generic purpose includes and excludes`
- `requires one accepted key notion per module`
- `requires each competency question to have one primary owner`
- `requires overlap decisions for referenced sibling modules`
- `keeps canonical concept ownership unique across split modules`
- `includes accepted ledgers and registries in source_tree_sha256`
- `changes source_tree_sha256 when accepted release evidence changes`
- `lists release evidence paths in generated_from without creating graph elements`

新增 `tests/ontology-language-naturalness.test.ts`：

- `rejects banned template phrases`
- `rejects unresolved semantic-kind question marks`
- `requires artifact translations to use reviewed domain terms`
- `requires trilingual labels after each module rename`

### 12.2 Concept 纵深

扩展 `tests/ontology-taxonomy.test.ts`：

- `rejects cross-kind is_a without an approved kind compatibility rule`
- `requires every accepted root to declare a reviewed root_status`
- `rejects unresolved-root in a release artifact`
- `requires primary_parent_relation_id to reference a canonical is_a`
- `keeps taxonomy acyclic at arbitrary depth`
- `keeps the delegation golden backbone continuous`
- `keeps context discovery assembly and disclosure as separate owners`
- `keeps instruction conflict owned only by safety`

新增 `tests/ontology-backbone.test.ts`：

- `resolves every layout parent and child to canonical relation endpoints`
- `reverses is_a only in layout projection`
- `never reverses the rendered canonical direction`
- `keeps primary backbone acyclic`
- `allows a non-taxonomic semantic relation in the backbone`
- `does not persist ownership shadow relations`
- `does not create schema example source or case graph elements`

### 12.3 Layout

新增 `tests/ontology-layout.test.ts`：

1. 8 层人工 Concept 链可布局；
2. child rank 严格位于 parent 下一层；
3. 同层 label bounding box 零重叠；
4. semantic cross-link 不改变 rank；
5. 相同输入和 model order 坐标稳定；
6. 增量展开旧节点 median displacement <16px、P95 <48px；
7. focus 位移 <24px；
8. 长中文、英文、日文标签测量正确；
9. stale Worker response 不覆盖新布局；
10. Worker error 触发可见 fallback；
11. manual pin 保持，reset 后释放；
12. canonical direction 与 layout direction 分离；
13. ELK 多 bend-point route 精确转换为 Cytoscape `segments`；
14. self-loop 不进入零长度 chord 计算；
15. delegation/context/memory 三个 dense fixture 的 `primaryBackboneCrossingCount===0`；
16. 三个 dense fixture 的 `edgeNodeIntersectionCount===0` 和 `edgeLabelCollisionCount===0`；
17. `semanticCrossLinkBackboneCrossingCount<=2` 且 ≤5%，`edgeRouteCollisionEstimate<=2`；
18. 对同一 route 输入，segment weights/distances 稳定。

### 12.4 ViewModel 与交互

扩展 `tests/ontology-view-model.test.ts`：

- `expands hierarchy children without semantic neighbors`
- `expands incoming and outgoing relations independently`
- `filters by predicate`
- `limits one semantic expansion to twelve nodes`
- `reports exact hidden counts`
- `collapses a branch`
- `dismisses nodes without mutating the ontology index`
- `retains selection`
- `enforces the 120 node and 220 edge scene budgets`
- `keeps arbitrary concept depth`
- `keeps reducer inputs immutable`

扩展 `tests/ontology-graph-behavior.test.tsx`：

- `initializes Cytoscape with preset layout`
- `requests ELK layout in hierarchy mode`
- `uses fCoSE only in relations mode`
- `does not fix every node in fCoSE`
- `does not recreate core on theme change`
- `changes LOD on zoom`
- `hides edge labels by default`
- `shows labels for focused edges only`
- `opens equivalent mouse and keyboard expansion menus`
- `drops stale layout responses`
- `disables position animation for reduced motion`

### 12.5 E2E

扩展 `e2e/ontology-explorer.spec.ts`：

1. root → domain → module → 6 层 concept 连续展开；
2. 委派主链不再显示 17 个平级根；
3. 内容表示、消息与会话、提示与指令各有独立入口和边界详情；
4. ContextWindow 只在 Memory owner 出现；
5. 高 degree 节点展开前显示数量和筛选；
6. 折叠后节点/边数量恢复；
7. 缩小后边标签消失，focus 后相关标签出现；
8. 逻辑层级/关系探索切换；
9. Fit selection 和 Reset layout；
10. 中文/英文/日文、light/dark、desktop/mobile；
11. 键盘完整操作；
12. 截图诊断同时断言：

   - `nodeLabelOverlapCount===0`
   - `primaryHierarchyViolationCount===0`
   - `primaryBackboneCrossingCount===0`
   - `edgeNodeIntersectionCount===0`
   - `edgeLabelCollisionCount===0`
   - `semanticCrossLinkBackboneCrossingCount<=2` 且比例 `<=0.05`
   - `edgeRouteCollisionEstimate<=2`
   - `visibleEdgeLabelCount<=12`
   - `layoutRequestIsCurrent===true`

### 12.6 密集视觉 fixture

新增三个 source-derived fixture，不手写第二套 ontology：

- `delegation-dense-scene`：协同角色、委派、移交、选派；
- `context-dense-scene`：内容、消息、提示、发现、组装、披露；
- `memory-record-high-degree-scene`：MemoryRecord 及 32 度邻域。

视觉回归必须覆盖这三者，不能再只用根视图证明“图谱美观”。

---

## 13. 性能、可访问性、安全和失败恢复

### 13.1 性能目标

- 120 nodes / 220 edges 的 ELK Worker 布局 P95 <700ms；
- 布局不产生主线程 >50ms long task；
- focus/hover class 更新 <16ms；
- 常规 pan/zoom 维持 45–60 FPS；
- topology 未变化时不重新布局；
- theme 切换不 destroy Cytoscape core；
- locale 变化只重新测量和布局，不重新解析 canonical JSON；
- scene 外的 622+ Concept 只留在 index，不全部进入 Cytoscape。

性能失败不通过提高 budget 隐藏，也不通过关闭标签碰撞检测伪装修复。

### 13.2 可访问性

- graph keyboard proxy 保留；
- 每个可见节点都可通过目录或搜索访问；
- context menu 有 `menu/menuitem` 语义、焦点圈和 Escape 关闭；
- 状态、错误、隐藏数量通过 `aria-live` 宣告；
- 颜色不作为唯一状态编码；
- 触摸目标至少 44×44 CSS px；
- Canvas 详情在 DOM 中有等价文本；
- reduced motion 遵循系统设置。

### 13.3 安全

- 节点标签、定义、来源 locator 和例子都作为纯文本渲染；
- 不使用 `dangerouslySetInnerHTML`；
- 外链通过现有 URL allowlist；
- Worker message 只接受 schema 验证后的布局数据；
- scene budget 同时作为拒绝异常大投影的资源保护；
- build manifest 不包含 token、机器路径或环境秘密；
- 新依赖 `elkjs` 在提交前执行 license、lockfile 和漏洞审查。

### 13.4 失败恢复

- Module 拆分失败：保留上一完整 canonical release，不发布半拆分 owner；
- source 构建失败：不覆盖上一 generated artifact；
- ELK Worker 失败：可见提示并回退 breadthfirst；
- 布局 invariant 失败：保留旧稳定坐标并显示诊断；
- Pages 部署失败：不替换上一 deployment；
- post-deploy fingerprint 不一致：部署 job 失败并阻止标记 release complete；
- 任何迁移都通过 immutable 新对象生成，不原地覆盖旧对象。

---

## 14. 实施阶段和提交边界

### Phase 0：冻结事实与写 RED 测试

修改/新增：

- 本计划列出的 v3 ledger 空表与生成器；
- Module template/naming tests；
- cross-kind `is_a` tests；
- backbone contract tests；
- dense layout fixtures；
- 当前基线统计快照。

完成门：

- 新测试按预期失败；
- 旧 generated artifact 可从 clean checkout 重建；
- 记录 622/925/239/最大深度 3 的基线，不把它作为未来固定值。

建议提交：

`test: add semantic depth and module boundary red gates`

### Phase 1：扩展 source contract 和 builder

先改 Schema、builder、types、fixtures，再生成空字段迁移骨架。所有现有 Module 暂为 provisional，不得用默认字符串自动补 accepted。

完成门：

- 新字段 unknown/required/conditional 测试通过；
- primary backbone 可在最小 fixture 生成；
- 旧 source 缺字段时给出精确 JSON Pointer；
- 生成物仍 deterministic。

建议提交：

`feat: add module boundary and logical backbone contracts`

### Phase 2：Info + Memory 内容重构

顺序：

1. 来源与定位；
2. 内容表示；
3. 消息与会话；
4. 提示与指令；
5. 表示与索引；
6. 上下文发现；
7. 检索与排序；
8. 上下文组装；
9. 输出披露；
10. 执行观测；
11. 记忆接入、分块、生命周期、对象与存储。

这个顺序先确定 canonical 信息对象，再确定发现、组装和披露 owner，避免三者互相迁回。

完成门：

- 本两域所有 v3 ledger 行 accepted；
- 3 组重叠决策完成；
- cross-kind 相关关系修复；
- context dense golden graph 通过。

建议提交：

`refactor: rebuild context and memory semantic boundaries`

### Phase 3：Orchestration + Runtime + Feedback 内容重构

顺序：

1. 运行参与者与绑定；
2. 协同角色；
3. 目标与任务规划；
4. 运行环境与会话；
5. 执行尝试与结果；
6. 委派与移交；
7. 路由与门控、协作组合；
8. 追踪与检查点、运行产物；
9. 故障与诊断、评估与度量、审查与纠正、优化与学习；
10. 改进循环编排和日志与遥测。

完成门：

- Role/Actor、Plan/Run、Review/Review orchestration、Trace/Log 各有唯一 owner；
- delegation dense golden graph 不再平铺；
- 任一执行能沿 plan→attempt→result→evaluation→feedback→revision。

建议提交：

`refactor: deepen orchestration runtime and feedback ontology`

### Phase 4：Tool + Safety + Adapter 内容重构

顺序：

1. 能力定义与注册；
2. 调用与执行；
3. 授权与策略决策；
4. 信任边界与数据区；
5. 执行隔离、网络访问控制；
6. 注入与内容投毒防御；
7. 副作用提交控制、披露与脱敏；
8. 能力发现与选择、MCP 交互；
9. 映射规则与验证；
10. 五类具体 Adapter mapping。

完成门：

- Definition/Invocation/Attempt/Result/Effect 分开；
- Safety 两个拆分模块各自闭环；
- Adapter 形成 Adapter→category→specific adapter 的真实层级；
- 映射规则、报告、警告不再跨 kind `is_a`。

建议提交：

`refactor: clarify tool safety and adapter concept ownership`

### Phase 5：ELK 布局和 Scene 交互

严格按以下 RED→GREEN 顺序：

1. `ontology-layout.test.ts`；
2. `ontology-view-model.test.ts`；
3. Worker；
4. hierarchy mode；
5. LOD 和按需标签；
6. scoped expansion/collapse；
7. relations mode；
8. toolbar/context menu/legend；
9. accessibility；
10. dense E2E 与视觉基线。

建议拆为：

- `feat: add elk logical hierarchy layout`
- `feat: add scoped graph exploration controls`
- `test: add dense ontology visual regression gates`

### Phase 6：文档、生成物和发布

执行：

- `npm run ontology:release`
- `npm run ontology:check`
- `npm run ontology:validate`
- `npm run test:coverage`
- `npm run typecheck`
- `npm run build`
- `npm run e2e`

最后更新三语 README、art direction、source notes 和本计划状态。生成物和文档必须在同一原子 release 中提交。

建议提交：

`docs: publish semantic depth and graph exploration architecture`

---

## 15. 生产站点必须证明是最新构建

当前 `.github/workflows/deploy.yml` 只在 `main` push 或手工 dispatch 时发布。把 feature branch 推到远端并不会自动更新正式 Pages，这是预期行为；但正式合并后必须有机器可验证的最新构建证据。

### 15.1 新增构建清单

新增 `scripts/write-site-build-manifest.mjs`，在 Vite build 完成后生成 `dist/build-manifest.json`。仓库现有 `.gitignore` 已忽略 `dist/`，因此本地构建不会产生待提交的 manifest，也不新增 `public/` 影子源文件：

`commit_sha,source_fingerprint,canonical_fingerprint,generator_version,built_from_ref,module_count,concept_count,relation_count`。

要求：

- `commit_sha` 来自 CI `GITHUB_SHA`，本地为明确的 git HEAD；
- 不写 wall-clock 时间作为一致性输入；
- module/concept/relation count 来自 generated metrics；
- manifest 不参与 ontology source fingerprint；
- `canonical_fingerprint` 固定为 `sha256:<lowercase-hex>`，输入是 checkout 中 `ontology/agent-ontology.json` 的原始 committed bytes，不做 JSON reserialize 或换行转换；
- manifest 的 `source_fingerprint` 直接复制 canonical `artifact_metadata.source_tree_sha256` 的裸 64 位 lowercase hex，保持现有 schema、runtime 和 release regex 合同；其输入扩展为全部 `ontology/source/**/*.json`、三个 accepted v3 ledger、`research/source-registry.csv` 和 `research/living-source-metadata.csv`；
- source tree 算法固定为：按 POSIX 风格 repo-relative path 做 ordinal 排序，对每个文件依次输入 `UTF8(path)+NUL+ASCII(byteLength)+NUL+rawBytes`，最后取裸 `lowercase-hex` SHA-256；不加 `sha256:` 前缀、不 reserialize JSON、不改 CSV 换行；
- 校验脚本用同一共享函数重新计算，不能另发明第二种摘要；
- script 先验证 `dist/index.html` 存在，再以原子 rename 写 manifest；
- 页面“关于/诊断”区域显示短 SHA 和 ontology fingerprint。

由于 manifest 在 Vite build 后写入，页面采用运行时加载而不是把 SHA 假装烘焙进 `index.html`：

- 新增 `src/lib/site-build-manifest.ts`，定义 readonly `SiteBuildManifest` 和 Zod schema；
- `loadSiteBuildManifest()` 通过 `fetch(import.meta.env.BASE_URL + "build-manifest.json", { cache: "no-store" })` 加载，并验证 SHA、fingerprint 和 count；
- `App.tsx` 保存 `loading | ready | error` 状态；ready 时在同页诊断区渲染 `data-build-commit="<full-sha>"`、短 SHA 和 fingerprint，error 时显示“构建信息暂不可用”但不阻断 ontology；
- 不把 manifest 内容复制进第二个 JS 常量，不在客户端重新计算 git SHA；
- 新增 `tests/site-build-manifest.test.ts` 覆盖 base URL、schema 拒绝、HTTP/JSON error、`no-store`；`tests/app-behavior.test.tsx` 覆盖 ready/error DOM。

### 15.2 构建前验证

新增 `scripts/verify-site-artifact.mjs`：

- `dist/build-manifest.json` 存在；
- manifest SHA 等于当前 checkout；
- canonical fingerprint 等于 `ontology/agent-ontology.json`；
- `dist/index.html` 引用本次生成的 hashed assets；
- production bundle 包含新 Module label 和 `data-layout-engine="elk-layered"`；
- production bundle 不包含 `canonical-primary-path-rings`、`continuous-local-force` 或旧中文“协同角色与委派模块”。

`package.json` 新增：

- `site:manifest`
- `site:verify`

并把 `build` 调整为：

`npm run typecheck && vite build && npm run site:manifest && npm run site:verify`。

### 15.3 Workflow 修改

`.github/workflows/deploy.yml`：

1. checkout 保留完整 SHA；
2. `npm ci` 后运行完整 `npm run verify`；
3. Upload 前单独运行 `npm run site:verify`；
4. 上传 `dist`；
5. `deploy` job 增加 `outputs.page_url: ${{ steps.deployment.outputs.page_url }}`，继续保留 step `id: deployment`；
6. deploy 后新增 `verify-deployment` job，固定 `needs: deploy`，URL 从 `${{ needs.deploy.outputs.page_url }}` 读取；
7. 该 job 独立执行 `actions/checkout@v6`、`actions/setup-node@v6`（Node 24 + npm cache）、`npm ci` 和 `node node_modules/@playwright/test/cli.js install --with-deps chromium`；不得假设继承 build job 的 workspace 或 node_modules；
8. 新增 `scripts/verify-deployment.mjs`，用 deployment URL 获取 `build-manifest.json`，断言远端 `commit_sha` 与 `GITHUB_SHA` 相同；
9. 新增 `e2e/deployment-fingerprint.spec.ts`，用 Playwright 打开 deployment URL，等待 `[data-build-commit]`，断言完整 SHA 与 manifest 相同；不能用原始首页 HTTP 文本检查运行时内容；
10. manifest fetch 或浏览器断言任一失败，workflow 红灯，不宣称站点已更新。

`verify-deployment` 显式设置 `DEPLOYMENT_URL=${{ needs.deploy.outputs.page_url }}` 与 `EXPECTED_COMMIT_SHA=${{ github.sha }}`；两个验证脚本只读取这两个环境变量，不猜测仓库 Pages URL。

分支预览通过 `workflow_dispatch` 选择 ref，产物名称包含 branch 和 SHA；正式 URL 仍只由 main 发布，避免 feature branch 覆盖生产。

---

## 16. Definition of Done

### 16.1 内容

- [ ] 八个 Domain 保留且各自闭环说明通过；
- [ ] 47 个候选 Module 均有 keep/split/merge/reject 决定；最终 accepted Module 集合全部通过 CQ/owner 审查，数量由 metrics 生成而非写死；
- [ ] 所有页面 Module label 不以“模块”结尾；
- [ ] 0 个 Module 使用旧 purpose/includes/excludes 模板；
- [ ] 当前 622 个 Concept 与所有新增/拆分 Concept 在 v3 ledger 有决定；
- [ ] 0 个 accepted unresolved root；
- [ ] 0 个 cross-kind `is_a`；
- [ ] 0 个 primary backbone cycle；
- [ ] 0 个无 owner 的 primary CQ；
- [ ] `A` 与 `A-XXX` 同级候选全部有关系/字段/合并决定；
- [ ] 委派、上下文、执行、评估、记忆五条黄金链连续；
- [ ] 所有 Concept 有自然三语定义、正例、边界例和实际来源；
- [ ] 字段、枚举、状态和 ID 不再伪装 Concept；
- [ ] Schema/example/source/case graph element count 仍为 0。

### 16.2 图谱

- [ ] 默认使用真实 ELK Layered；
- [ ] fCoSE 不再固定所有节点；
- [ ] 同心圆函数和虚假 data attribute 删除；
- [ ] 任意 8 层 fixture 可展开；
- [ ] dense scenes 的节点标签重叠为 0；
- [ ] primary hierarchy 逆序为 0；
- [ ] dense scenes 的 primary backbone crossing、edge-node intersection、edge-label collision 均为 0；
- [ ] semantic cross-link 穿越 backbone ≤2 且 ≤5%，总 route collision estimate ≤2；
- [ ] 默认边标签为 0，focus 后最多 12；
- [ ] 按方向、predicate、limit 展开；
- [ ] 任意展开节点可折叠；
- [ ] scene budget 不静默截断；
- [ ] 单击不重排；
- [ ] 增量位移满足阈值；
- [ ] 三语、主题、移动端、键盘、reduced-motion 通过；
- [ ] 页面仍只有一张 graph 和一个同页详情来源。

### 16.3 工程与发布

- [ ] source schema、builder、generated types 同步；
- [ ] clean release byte-identical；
- [ ] unit/integration/E2E 全绿；
- [ ] statements/branches/functions/lines 均 ≥80%；
- [ ] elkjs license/security 审查通过；
- [ ] 120/220 layout P95 <700ms；
- [ ] 主线程无布局 >50ms long task；
- [ ] GitHub Pages manifest SHA 与部署 commit 一致；
- [ ] production bundle 不含旧布局标记或旧模块标签；
- [ ] 远端分支、main 和生产站点三者状态被明确区分。

---

## 17. OPEN QUESTIONS 与默认决定

| 问题 | 默认决定 | 谁可改变 |
|---|---|---|
| 最终是否必须 47 个 Module | 否；47 是有明确拆分理由的候选结果 | Domain + ontology reviewer，以 CQ 矩阵为证 |
| 是否更改现有 module ID | 默认不改，只改 labels；新拆分用新 ID | 架构 reviewer，需 migration alias |
| 是否把所有 shared-prefix 概念都放到一个父类 | 否 | ontology reviewer，以 `is_a`/relation 判定为证 |
| 是否允许非 `is_a` 进入默认逻辑骨架 | 允许，必须引用原 canonical relation | ontology reviewer |
| 是否更换 Cytoscape | 否 | 独立渲染器 RFC 和规模 benchmark |
| 是否部署 Neo4j | 否 | 独立数据平台 RFC |
| 是否默认显示所有 semantic relations | 否，只显示 focus neighborhood | 产品/可视化 reviewer |
| 是否给 Module 另建详情页面 | 否，仍在同页信息区 | 产品负责人 |
| feature branch 是否更新正式 Pages | 否；使用手工 preview，main 才正式发布 | 发布治理 RFC |

---

## 18. HANDOFF

实施者应从 Phase 0 的 RED tests 和 622 行 v3 ledger 开始，而不是先改图的颜色或批量加父概念。每个 Domain 的内容审查完成后，先用纯数据生成模块骨架图，确认 owner、父链和关系，再进入 UI 布局；UI 的任务是忠实呈现逻辑，不是用漂亮坐标掩盖错误层级。

最终判断句：

> Moonweave 保留 FIBO 式的稳定领域入口和单一图谱，但不再把“Domain—Module—Concept”当作三层上限，也不再把共享词头概念机械平铺。模块边界由问题和 owner 决定，概念纵深由真实分类与结构关系决定，图谱由 ELK 层级和受控关系探索清楚呈现；所有解释仍回到同一节点和同一关系。

---

## 附录 A：41 个现有 Module 中文 label 的逐行替换

以下是 source JSON `labels.zh` 的 literal replacement；新拆分模块见 11.3。

| ID | 当前文字 | 替换为 |
|---|---|---|
| `info-container-command` | 执行观测摄入模块 | 执行观测 |
| `info-content-block-modality` | 内容块与模态模块 | 内容表示 |
| `info-indexing` | 轻量上下文发现模块 | 上下文发现 |
| `info-messages-instructions` | 消息、指令与提示包络模块 | 消息与会话 |
| `info-output-disclosure` | 上下文窗口与披露模块 | 输出披露 |
| `info-storage-sources` | 来源与资源引用模块 | 来源与定位 |
| `orchestration-actors-delegation` | 协同角色与委派模块 | 协同角色 |
| `orchestration-composition` | 组合模式模块 | 协作组合 |
| `orchestration-evaluation` | 控制反馈循环模块 | 改进循环编排 |
| `orchestration-routing-control` | 路由与控制模块 | 路由与门控 |
| `orchestration-task-planning` | 任务规划模块 | 目标与任务规划 |
| `runtime-actors` | 运行参与者与权限模块 | 运行参与者与绑定 |
| `runtime-artifacts` | 运行产物溯源模块 | 运行产物 |
| `runtime-observability` | 运行追踪与检查点模块 | 追踪与检查点 |
| `runtime-system` | 运行会话与执行包络模块 | 运行环境与会话 |
| `adapter-benchmarks` | 基准适配模块 | 基准映射 |
| `adapter-frameworks` | 框架适配模块 | 框架映射 |
| `adapter-mapping-infrastructure` | 适配映射基础设施模块 | 映射规则与验证 |
| `adapter-protocols` | 协议适配模块 | 协议映射 |
| `adapter-schema-export` | 模式与导出适配模块 | 模式导出 |
| `adapter-statecharts` | 状态图适配模块 | 状态图映射 |
| `tool-discovery-selection` | 能力发现与选择模块 | 能力发现与选择 |
| `tool-invocation-execution` | 调用与执行模块 | 调用与执行 |
| `tool-mcp-transport` | MCP 协议表面模块 | MCP 交互 |
| `tool-registry-definition` | 能力注册与定义模块 | 能力定义与注册 |
| `safety-commit-redaction` | 提交与脱敏模块 | 副作用提交控制 |
| `safety-injection-defense` | 注入防御模块 | 注入与内容投毒防御 |
| `safety-permission-policy` | 权限与策略模块 | 授权与策略决策 |
| `safety-sandbox-network` | 沙箱与网络模块 | 执行隔离 |
| `safety-trust-boundary` | 信任边界模块 | 信任边界与数据区 |
| `feedback-logging` | 遥测、审计与导出管线模块 | 日志与遥测 |
| `feedback-metrics-evaluation` | 指标与评估模块 | 评估与度量 |
| `feedback-review-optimization` | 审查与优化模块 | 审查与纠正 |
| `feedback-warning-error` | 警告与错误模块 | 故障与诊断 |
| `memory-chunking-situating` | 分块与定位模块 | 分块与语境化 |
| `memory-context` | 上下文组装模块 | 上下文组装 |
| `memory-embedding-indexes` | 嵌入与索引模块 | 表示与索引 |
| `memory-ingestion` | 记忆摄入模块 | 记忆接入 |
| `memory-lifecycle` | 记忆生命周期操作模块 | 记忆生命周期 |
| `memory-retrieval-ranking` | 检索与排序模块 | 检索与排序 |
| `memory-stores-scopes` | 记忆存储、范围与类型模块 | 记忆对象与存储 |

英文和日文行必须在同一个提交中完成对应替换，不能让中文先发布、其他语言继续显示旧边界。
