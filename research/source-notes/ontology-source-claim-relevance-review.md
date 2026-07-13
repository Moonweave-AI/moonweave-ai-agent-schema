# Agent Ontology 领域来源相关性复核

日期：2026-07-13
状态：P0 来源纠偏已深读，供 source-first 本体证据使用

## 1. 复核边界

本轮只修正“来源是否真正支持 owner 所陈述的领域事实”，不把本体建模方法论当成领域事实证据。Gene Ontology、CIDOC CRM 与 FIBO 仍可用于解释 DAG、属性、关系和模块化等建模方法，但不得用于证明 MCP 传输、命令输出、指令优先级、框架 trace/handoff、基准得分或状态图快照等领域语义。

每个受影响 owner 遵循两条规则：

1. `source_claims` 只陈述外部资料直接支持的事实，并给出可定位章节；
2. Moonweave 自己作出的枚举闭包、跨系统映射和粒度选择写入 `review.decision_note` 或 `change_note`，不伪装成外部规范已经定义的事实。

## 2. 新增权威来源与允许主张

| source id | 权威来源 | 可支持的领域事实 | 不可外推的内容 |
|---|---|---|---|
| `eng-std-posix-shell-2024` | [POSIX.1-2024 Shell Command Language](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html) | 2.7 重定向、2.8.2 退出状态、2.9 命令执行以及标准输出/标准错误语义 | 不定义 Moonweave 的 ContextIngress 或 ContextSummary 类型 |
| `eng-spec-openai-model-2025-10-27` | [OpenAI Model Spec 2025-10-27](https://model-spec.openai.com/2025-10-27) | Chain of command 中的 authority level、scope、冲突与 override | 不把厂商专有层级直接宣称为所有 agent 的唯一标准 |
| `eng-security-nist-abac` | [NIST SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/upd2/final) | subject、object、operation、environment attribute 和 policy 决定 allow/deny 的访问控制语义 | `public/user/session/private` 四值闭包是 Moonweave 设计 |
| `eng-security-cvss-v4` | [CVSS v4.0 Specification](https://www.first.org/cvss/v4.0/specification-document) | Section 6 明确定义 Low、Medium、High、Critical 定性严重度 | DefenseFinding 不因此自动成为 CVSS vulnerability/vector |
| `eng-policy-opa` | [Open Policy Agent documentation](https://www.openpolicyagent.org/docs) | 策略评估接收结构化输入并可返回非布尔的结构化 decision，且 decision 与 enforcement 分离 | `escalate/redact/sandbox` 是 Moonweave 的响应动作词表 |
| `eng-proto-mcp-tasks-2025` | [MCP Tasks 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks) | working、input-required、completed、failed、cancelled 及状态迁移/终态语义 | `ready/paused/blocked` 是跨协议规范化映射 |
| `eng-fw-langgraph-interrupts` | [LangGraph Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) | 执行 pause、保存状态、等待外部输入和 resume | 只支撑 paused 的运行语义，不定义整个 RunAttempt 枚举 |
| `eng-proto-mcp-transports-2025` | [MCP Transports 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) | stdio、Streamable HTTP、SSE 流/兼容语义和 pluggable custom transport | WebSocket 不是该版本的标准 MCP transport |
| `eng-proto-websocket-rfc6455` | [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html) | WebSocket 协议机制 | 把 WebSocket 用作 MCP custom transport 是 Moonweave mapping |
| `eng-proto-rfc9530-digest-fields` | [RFC 9530](https://www.rfc-editor.org/rfc/rfc9530.html) | HTTP 内容/表示的 digest 完整性元数据 | 不规定 Moonweave SourceChecksum 节点结构 |

## 3. 已登记来源的精确复用

- `eng-proto-a2a-spec`：只用于 A2A 任务、消息、产物与会话包络事实。
- `eng-proto-mcp-2025-spec`：只用于 MCP tool/resource/prompt、ContentBlock 与外部构造族事实。
- `eng-ont-prov-o`：只用于 Entity/Activity、derivation、quotation、primary source、revision 与 location 等 provenance 事实。
- `eng-fw-openai-handoffs`：只用于 agent handoff/delegation 构造映射。
- `eng-fw-openai-tracing`：只用于 trace/span/run-event 构造映射。
- `eng-bench-osworld-site` 与 `eng-bench-swebench-site`：只用于 benchmark score/metric 映射。
- `eng-state-xstate-docs`：只用于 state 与 actor snapshot 的映射。
- `lit-mech-compass`：只用于 agent 运行中上下文选择、演化与压缩的论文证据；Moonweave 的具体边名仍为设计决定。

## 4. 设计决定的记录模板

受影响字段和关系的 `review.decision_note` / `change_note` 应明确表达：

> 外部来源支持领域构造本身；Moonweave 为统一图查询而选择当前 owner、受控值闭包或映射方向。该选择是已审查的本体设计，不是来源中的原生 taxonomy。

因此，`source_claims.supports` 不再使用“外部来源支持 Moonweave 特定边界”这一不可证实的模板句，而改为说明规范/论文实际定义了什么，以及该事实为什么是当前 owner 的证据基础。

## 5. FIBO 工程指南越界引用清理

最终发布前的全树复核发现，FIBO Ontology Guide 曾在 7 个 Module source 中被重复附着到 79 条协议、框架、映射、Schema 导出、状态图和工具能力主张。该指南只直接支持命名、IRI、注解、模块化和本体卫生实践，不能证明这些领域事实，因此本轮完成如下替换：

- framework handoff / trace 改引 OpenAI Agents SDK 对应 handoff 与 tracing 官方文档；
- protocol message / task / capability / trust 改引 FIPA ACL、A2A、MCP 与 MCP Authorization 规范；
- mapping rule / warning / test result 改引 JSON Schema、JSON Schema Test Suite 与 Zod JSON Schema 转换文档；
- graph projection / graph IR 改引 Microsoft Fabric IQ Ontology 与 W3C RDF；
- statechart snapshot 改引 XState 官方文档；tool capability 改引 MCP Tools 规范。

`eng-ont-fibo-ontology-guide` 现在只允许出现在产品级 ontology-engineering constraints 中。`tests/ontology-source-claim-relevance.test.ts` 递归扫描整个 `ontology/source/**` 并把任何新的领域级 FIBO 引用视为失败，从而防止相同误用回归。
