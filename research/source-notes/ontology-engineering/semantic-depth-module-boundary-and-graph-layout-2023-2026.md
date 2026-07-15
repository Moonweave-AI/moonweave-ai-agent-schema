# Agent Ontology 语义纵深、模块边界与图布局证据说明（2023–2026）

## 结论

Moonweave 保留八个稳定领域入口与一张 canonical 图，但模块由 competency question 和唯一 owner 划界，概念层级由真实分类或结构关系决定。默认图只投影 ownership 与经审查 backbone；关系探索再按方向、predicate 和数量加入 cross-link。

## 内容工程依据

- Modular Ontology Modeling（2023）：以用例、competency question、关键概念和模块关系组织可嵌套模块。
- Ontology Quality Assessment（2023）：分别评估 taxonomy、cohesion、coupling 与 documentation；关系数量不能替代模块质量。
- FIBO、Palantir、Microsoft Fabric Ontology 与 Skan AOW：支持稳定领域入口、共享语义层、typed relation 与节点内治理信息，但不要求固定层数或固定模块数。

## 图布局依据

- ELK Layered 负责 cycle breaking、layer assignment、crossing minimization、node placement 与 edge routing；elkjs 通过 Worker 将计算移出主线程。
- Cytoscape.js 继续负责渲染和事件；标签按 LOD 与 focus 显示，不再让全边标签参与默认画面。
- Neo4j Bloom 的场景经验用于受控展开、折叠与关系过滤；Graphviz dot 仅作离线对照。

## 本轮设计推论

1. key notion、owns_when、references_when、边界决定和重叠检查附着 Module；不另建页面。
2. primary_parent_relation_id 仅表达严格 is_a；layout_role 附着原 Relation，不复制事实。
3. 六组拆分采用唯一 owner；跨模块语义通过 canonical relation 引用。
4. Schema、实例、来源、例子和案例仍是原节点或原关系的信息。
5. 构建、canonical、站点与部署使用可验证指纹，不以人工截图宣称“已更新”。
