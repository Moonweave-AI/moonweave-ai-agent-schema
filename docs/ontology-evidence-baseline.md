# 本体术语与证据基线

本文件不是节点模板，也不替代逐节点审查。它记录本轮人工重构可复核的首选资料；每个节点只能引用实际支持其定义、边界或接口的资料，并在节点自身说明这种对应关系。

## 协议与运行时

- [Model Context Protocol Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)：MCP 的规范术语是 Host、Client、Server、Session、Transport、Request、Response、Notification、Tool、Resource、Prompt、Roots、Sampling、Elicitation。协议消息采用 JSON-RPC 2.0；`tools/list`、`tools/call`、`resources/read` 和 `prompts/get` 是各自能力的真实方法名。
- [A2A Protocol Specification 1.0](https://a2a-protocol.org/latest/specification/)：仅对协议对象使用 Agent Card、Task、TaskStatus、TaskState、Message、Part、Artifact、SendMessageRequest 等名称。A2A 的 `Task` 不应被泛化为任意内部执行或计划。
- [PROV-O](https://www.w3.org/TR/prov-o/)：用 Entity、Activity、Agent 区分信息/工件、已经发生的过程和承担责任的主体；不能把三者混作同一个“运行对象”。
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/)：观测数据采用 Trace、Span、Log Record、Metric 和 Event 等标准名词，避免为同一语义创造平行的“诊断”实体树。

## 记忆、上下文与检索

- [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)：Checkpointer 保存 thread-scoped checkpoint，Store 保存跨 thread 的应用数据；它们是不同的持久化边界。
- [LangGraph Memory](https://docs.langchain.com/oss/python/langgraph/add-memory)：给出了 `thread_id`、`store.search` / `store.put` 等真实工程接口，并明确短期线程记忆、长时跨会话记忆、消息裁剪和摘要的用途。
- [CoALA](https://arxiv.org/abs/2309.02427)：为工作、情节、语义和程序性记忆提供认知架构层面的分类依据，而非某一产品 API。
- [MemGPT](https://arxiv.org/abs/2310.08560)：把有限上下文窗口与外部记忆层的管理问题区分开来；它支持 Context Window、Context Management 和 Memory Tier 等边界，不等同于任何单一向量数据库实现。
- [Generative Agents](https://arxiv.org/abs/2304.03442)：支持 memory stream、检索和反思之间的工程分工。
- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)：支持检索器、检索语料和生成过程的区分；不把 embedding、index、retrieval result 和最终答案混为一物。

## 内容、工具与模式互操作

- [OpenAI Responses: conversation state](https://developers.openai.com/api/docs/guides/conversation-state)：`Conversation` 是可持久化的会话状态对象；它保存 message、tool call、tool output 等 items。它不能作为任意内部“消息历史”或 MCP/A2A `Message` 的同义词。
- [OpenAI Responses: text generation](https://developers.openai.com/api/docs/guides/text)、[images and vision](https://developers.openai.com/api/docs/guides/images-vision) 与 [file inputs](https://developers.openai.com/api/docs/guides/file-inputs)：它们给出真实的 `input_text`、`input_image`、`input_file` 输入项及 `output_text` 的工程形状。它们能支撑本产品的内容项/API 示例，不能把 OpenAI 的类型名泛化为跨协议标准。
- [OpenAI Responses: using tools](https://developers.openai.com/api/docs/guides/tools)：区分 hosted tool、function tool、hosted MCP tool、shell、computer use 与将 specialist 暴露为 tool 的实际运行时选择；非 OpenAI 工具目录或通用能力模型需要另有自己的出处。
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986)：为 URI、相对引用、authority、path、query 和 fragment 的名称及语法约束提供依据；它不定义某个产品资源的业务权限或内容语义。
- [PROV-DM](https://www.w3.org/TR/prov-dm/)：补充 Entity、Activity、Agent、Generation、Usage、Derivation 等来源链语义；版本、引用、位置或内容摘要只能在其实际支持的 provenance 范围内引用。
- [JSON Schema Draft 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core)：`$schema`、`$id`、`$ref`、vocabularies 与 schema resources 的权威定义；它不是运行时值校验结果或 SHACL/OWL 的别名。
- [SHACL](https://www.w3.org/TR/shacl/)：NodeShape、PropertyShape、target、constraint component 与 validation report 的依据；它不等同 JSON Schema 的关键词集合。
- [OWL 2 Overview](https://www.w3.org/TR/owl2-overview/)：class、property、axiom 等描述逻辑/本体语言概念的依据；仅在语义图导出确实使用 OWL 时采用，不能把应用级关系表误称 OWL。
- [OpenAPI Specification 3.1.0](https://spec.openapis.org/oas/v3.1.0)：HTTP API 的 paths、operations、parameters、request body、responses 与 component schemas 的术语依据；不能据此为非 HTTP 的 MCP JSON-RPC 方法捏造 REST endpoint。

## 资料使用规则

1. 官方协议、标准与一手文档优先于博客、二手文章和臆测。
2. API 输入输出必须来自该节点所对应的规范或官方实现；抽象概念可以说明数据形状，但不能伪造“官方接口”。
3. 论文只能支撑论文实际提出的抽象或实验结论；产品特定行为必须另引该产品的官方文档。
4. 来源字段应说明“该节点从哪里来”，而不是把一串未关联的链接堆在全局目录中。
5. A2A、MCP、PROV-O、OpenTelemetry 与本体内部术语之间只允许明确的边界说明，不再保留独立的“适配映射”详情区。
