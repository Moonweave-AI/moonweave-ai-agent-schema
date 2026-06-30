# proto-fipa-mcp-a2a-foundations: FIPA, MCP, and A2A Protocol Foundations

metadata:
  domain: agent-protocols
  source_type: source-family
  authority_level: mixed-primary
  temporal_class: foundational-plus-current
  published_or_updated: 2001 to 2026
  last_checked: 2026-06-30
  url: https://a2a-protocol.org/v1.0.0/specification/
  deep_read_priority: A

## Covered Sources

| source_id | title | url | authority | temporal_class |
|---|---|---|---|---|
| proto-fipa-acl-2002 | FIPA ACL Message Structure Specification | http://www.fipa.org/specs/fipa00061/ | standard | foundational |
| proto-fipa-acl-mirror | FIPA ACL Message Structure Specification PDF mirror | https://ppgia.pucpr.br/~fabricio/ftp/Aulas/Mestrado/AS/Aula3/SC00061G_FIPA_ACL.pdf | mirror of standard content | foundational |
| proto-fipa-act-2002 | FIPA Communicative Act Library | http://www.fipa.org/specs/fipa00037/ | standard | foundational |
| cand-proto-mcp-latest | MCP latest specification | https://modelcontextprotocol.io/specification/latest | standard | current |
| cand-proto-mcp-tools | MCP tools concept docs | https://modelcontextprotocol.io/docs/concepts/tools | official-doc | current |
| proto-a2a | A2A v1.0 specification | https://a2a-protocol.org/v1.0.0/specification/ | standard | current |
| cand-proto-a2a-v1-release | A2A v1.0 announcement | https://github.com/a2aproject/A2A/blob/main/docs/announcing-1.0.md | release-note | current |

## Why This Source Family Matters

This family separates three protocol layers that can otherwise blur together: FIPA ACL for speech-act message semantics, MCP for agent-to-tool/context integration, and A2A for agent-to-agent discovery, delegation, tasks, and artifact exchange.

Note: the canonical FIPA URLs were partially inaccessible during this check because of redirects or missing site content. The FIPA ACL message content was verified through an accessible PDF mirror and bibliographic record while retaining the original FIPA URL as canonical.

## Concepts

| concept | definition | source evidence | confidence | candidate layer |
|---|---|---|---|---|
| Performative | Speech-act type of an agent message. | FIPA ACL marks performative as the mandatory ACL message parameter. | high | L4 |
| Sender | Agent that performs the communicative act. | FIPA ACL message parameters include sender. | high | L4 |
| Receiver | Intended recipient(s) of the communicative act. | FIPA ACL message parameters include receiver. | high | L4 |
| Content | Message payload interpreted under language/ontology. | FIPA ACL defines content plus language and ontology parameters. | high | L4, L6 |
| Content Language | Language in which message content is expressed. | FIPA ACL uses language parameter. | high | L4 |
| Message Ontology | Ontology used to give meaning to content symbols. | FIPA ACL includes ontology parameter. | high | L4, L6 |
| Conversation ID | Identifier for an ongoing sequence of communicative acts. | FIPA ACL includes conversation-id for conversation control. | high | L4 |
| MCP Host | LLM application initiating MCP connections. | MCP overview defines hosts, clients, and servers. | high | L5 |
| MCP Server | Service exposing context and capabilities. | MCP overview defines servers as providers of resources/tools/prompts. | high | L5 |
| MCP Tool | Invocable function exposed by a server with an input schema. | MCP tools docs define name, description, inputSchema, and optional outputSchema. | high | L5, L6 |
| MCP Resource | Context/data exposed by MCP servers. | MCP spec lists resources as server features. | high | L5 |
| A2A AgentCard | Discovery metadata for an agent. | A2A v1.0 canonical data model includes AgentCard. | high | L2, L4 |
| A2A Task | Stateful durable work unit. | A2A spec defines Task as fundamental unit of work with lifecycle. | high | L4, L7 |
| A2A Message | Interaction payload in A2A operations. | A2A data model includes Message. | high | L4 |
| A2A Artifact | Output payload that may be chunked or streamed. | A2A data model and streaming events include artifacts. | high | L4, L7 |
| Protocol Binding | Mapping from abstract operations to transport/protocol. | A2A separates data model, operations, and protocol bindings. | high | L5 |

## Relations

| relation | source | target | evidence | confidence | notes |
|---|---|---|---|---|---|
| message_has_performative | Message | Performative | FIPA ACL mandatory parameter. | high | Core speech-act relation. |
| message_sent_by | Message | Agent | FIPA sender parameter. | high | Participant relation. |
| message_received_by | Message | Agent | FIPA receiver parameter. | high | Participant relation. |
| message_uses_ontology | Message | Ontology | FIPA ontology parameter. | high | Semantic interpretation relation. |
| message_part_of_conversation | Message | Conversation | FIPA conversation-id parameter. | high | Conversation control relation. |
| mcp_server_exposes_tool | MCP Server | MCP Tool | MCP tools/list operation. | high | Agent-to-tool layer. |
| mcp_client_calls_tool | MCP Client | MCP Tool | MCP tools/call operation. | high | Tool invocation relation. |
| a2a_agent_advertises_card | Agent | AgentCard | A2A discovery. | high | Discovery relation. |
| a2a_message_updates_task | Message | Task | A2A operations may return task/message and accept additional messages for non-terminal tasks. | high | Stateful interaction relation. |
| task_produces_artifact | Task | Artifact | A2A TaskArtifactUpdateEvent. | high | Output relation. |
| operation_bound_to_protocol | Abstract Operation | Protocol Binding | A2A layer 2 to layer 3 separation. | high | Keeps canonical operations transport-neutral. |

## States And Lifecycle Elements

| state/event | owner entity | trigger | terminal? | evidence | notes |
|---|---|---|---|---|---|
| tools_listed | MCP Tool Catalog | tools/list request | no | MCP tools docs. | Supports capability discovery. |
| tool_called | MCP Tool Invocation | tools/call request | maybe | MCP tools docs. | May produce isError result. |
| task_submitted | A2A Task | SendMessage/SendStreamingMessage | no | A2A async task model. | Exact enum needs proto extraction. |
| task_working | A2A Task | server begins work | no | A2A lifecycle references non-terminal tasks. | |
| input_required | A2A Task | human/client input needed | no | A2A v0.2.6/current lifecycle docs mention input-required. | Needs v1.0 enum verification. |
| task_completed | A2A Task | successful terminal result | yes | A2A stream closes at terminal completed state. | |
| task_failed | A2A Task | unrecoverable failure | yes | A2A terminal failed state. | |
| task_canceled | A2A Task | cancellation accepted | yes | A2A terminal canceled state. | Spelling standardized in v1.0. |
| task_rejected | A2A Task | request rejected | yes | A2A terminal rejected state. | |

## Validation Or Constraint Ideas

| constraint | applies_to | source evidence | validation style | risk |
|---|---|---|---|---|
| A FIPA-compatible message must have a performative. | Message | FIPA ACL says performative is mandatory. | structural | Not all protocols use speech-act semantics. |
| Message semantics should separate content from language/ontology metadata. | Message | FIPA ACL content, language, ontology fields. | structural + semantic | Modern natural-language messages may lack formal ontology. |
| MCP tool definitions require an inputSchema and stable name. | MCP Tool | MCP Tool type includes name and inputSchema. | structural | Output schema is optional, so do not require globally. |
| MCP tool annotations are untrusted unless server is trusted. | MCP Tool | MCP tools docs warn annotations are untrusted. | security | Trust boundary must be modeled. |
| A2A task streaming must close on terminal task states. | A2A Task Stream | A2A v1.0 streaming rules. | protocol | Transport-specific streams may differ. |
| A2A generated JSON artifacts are non-normative relative to proto. | A2A SchemaArtifact | A2A v1.0 normative content statement. | evidence | Must track normative source versus generated schema. |

## Schema Implications

Facts only, no final schema decisions:

- Message should separate participants, communicative act, content, content metadata, and conversation control.
- Tool invocation should be modeled separately from agent-to-agent task delegation.
- MCP and A2A solve different layers; A2A v1.0 release material explicitly says MCP is for tool/context integration and A2A is for communication/coordination between agents.
- A2A suggests durable Task, Message, Artifact, AgentCard, Part, Extension, Operation, and ProtocolBinding candidates.
- Normative status must be tracked per artifact, especially where generated schemas are convenience outputs.

## Framework Or Standard Specificity

Core candidates:

- Message, Performative, Participant, Conversation, Tool, Resource, AgentCard, Task, Artifact, ProtocolBinding.

Adapter-only or standard-specific candidates:

- FIPA ACL parameter names, FIPA communicative-act vocabulary, MCP JSON-RPC method names, A2A proto field names, A2A binding-specific endpoints.

## Contradictions And Open Questions

| issue | evidence | impact | owner | deadline |
|---|---|---|---|---|
| FIPA speech-act semantics are richer than current LLM message payload conventions. | FIPA ACL performatives and rational effects; modern framework docs use messages/tool calls. | Need optional performative layer. | research/agent-protocols | Before Phase 0C |
| MCP and A2A are often conflated but define different interoperability layers. | MCP spec; A2A v1.0 announcement. | Need separate agent-to-tool and agent-to-agent protocol layers. | research/agent-protocols | Before Phase 0C |
| A2A normative source is proto, while tooling may publish JSON artifacts. | A2A v1.0 normative content. | Schema generator must track normative provenance. | research/agent-protocols | Before Phase 0C |
| FIPA canonical source availability is degraded. | FIPA URL fetch failures; mirror accessible. | Need archived canonical PDFs before Phase 0C. | research/agent-protocols | Before Phase 0C |

## Follow-Up Sources

- FIPA Request, Query, Contract Net, and Subscribe interaction protocol PDFs.
- FIPA Agent Management and Ontology Service.
- MCP authorization, resources, prompts, sampling, elicitation, and transport pages.
- A2A proto file and v1.0 change guide.
- Agent Protocol streaming and thread/run/state model.
