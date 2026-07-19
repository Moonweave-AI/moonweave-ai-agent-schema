# Part 5: runtime-actors + runtime-artifacts modules
function L($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }
function D($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }

$LabelOverrides['runtime-actors'] = @(
    L 'OpenAI triage Agent 参与者平面' 'OpenAI triage agent actor plane' 'OpenAI triage Agent アクター平面'
    L 'LangSmith run_id 当 Actor' 'LangSmith run_id as Actor' 'LangSmith run_id を Actor とする'
    L 'Actor 与 TraceSpan 边界' 'Actor versus TraceSpan boundary' 'Actor と TraceSpan 境界'
    L 'CrewAI 多角色 Actor 实例' 'CrewAI multi-role actor instance' 'CrewAI マルチロール Actor 事例'
)
$DescOverrides['runtime-actors'] = @(
    D 'OpenAI Agents SDK triage_agent、booking_agent、refund_agent 映射 SoftwareActor/AgentActor；HumanOperatorRole 审批绑定 ActorRoleBinding；MCP ToolServiceActor 执行 tools/call。' 'OpenAI Agents SDK triage_agent, booking_agent, refund_agent map to SoftwareActor/AgentActor; HumanOperatorRole approval binds ActorRoleBinding; MCP ToolServiceActor executes tools/call.' 'OpenAI handoffs + MCP tools が runtime-actors 平面を構成する。'
    D 'LangSmith run_id 写入 actor_id 将 trace 观测当作责任主体；run 是 TraceSpan 不是 PROV Agent。' 'Writing LangSmith run_id to actor_id treats trace observation as responsible principal; run is TraceSpan not PROV Agent.' 'LangSmith run_id を actor_id に書くのは誤りである。'
    D 'Actor 是 PROV 责任主体；TraceSpan 是 OTel 操作投影；telemetry 可关联 actor_id 但 span 不能替代 Actor。' 'Actor is PROV responsible principal; TraceSpan is OTel operation projection; telemetry may correlate actor_id but span cannot replace Actor.' 'Actor と TraceSpan は別概念である。'
    D 'CrewAI Crew(agents=[researcher, writer]) kickoff() 归因 Actor actor_id=crewai-journalist 与 ReviewerRole；GenerativeModel gpt-4o 由 ModelActor 引用。' 'CrewAI Crew(agents=[researcher, writer]) kickoff() attributes Actor actor_id=crewai-journalist and ReviewerRole; GenerativeModel gpt-4o referenced by ModelActor.' 'CrewAI kickoff が複数 Actor/Role を归因する。'
)

$LabelOverrides['Actor'] = @(
    L 'PROV-O SoftwareAgent 审查' 'PROV-O SoftwareAgent review' 'PROV-O SoftwareAgent レビュー'
    L 'LangSmith span 当 Actor' 'LangSmith span as Actor' 'LangSmith span を Actor とする'
    L 'A2A AgentCard 名边界' 'A2A AgentCard name boundary' 'A2A AgentCard 名境界'
    L 'OpenAI triage agent 实例' 'OpenAI triage agent instance' 'OpenAI triage agent 事例'
)
$DescOverrides['Actor'] = @(
    D 'W3C PROV-O prov:SoftwareAgent(agent-reviewer-2) 关联 prov:Activity(review-exec-842)；actor_id 本地稳定，不复制 OpenAI assistant_id 原生字段。' 'W3C PROV-O prov:SoftwareAgent(agent-reviewer-2) associated with prov:Activity(review-exec-842); actor_id locally stable, not copying OpenAI assistant_id native field.' 'PROV-O SoftwareAgent が review Activity に関連する。'
    D 'LangSmith tool run span 写入 actor_id；span 描述操作 timing 不是责任主体，应保留 TraceSpan 并单独建模 Actor。' 'LangSmith tool run span written to actor_id; span describes operation timing not responsible principal; keep TraceSpan and model Actor separately.' 'tool run span は Actor ではない。'
    D 'A2A AgentCard.name=reviewer 是发现文档字段；Moonweave actor_id 是本地 opaque ID；RemoteAgentReference 存 card URL 不复制 name 到 actor_id。' 'A2A AgentCard.name=reviewer is discovery document field; Moonweave actor_id is local opaque ID; RemoteAgentReference stores card URL without copying name to actor_id.' 'AgentCard.name と actor_id は別ライフサイクルである。'
    D 'OpenAI Agents SDK triage_agent handoffs=[booking_agent, refund_agent] 映射 Actor actor_id=openai-triage-agent、actor_kind=SoftwareActor。' 'OpenAI Agents SDK triage_agent handoffs=[booking_agent, refund_agent] maps Actor actor_id=openai-triage-agent, actor_kind=SoftwareActor.' 'OpenAI triage_agent が Actor にマップされる。'
)

$LabelOverrides['AgentActor'] = @(
    L 'OpenAI Weather Agent' 'OpenAI Weather Agent' 'OpenAI Weather Agent'
    L 'AgentCard 复制为 actor_id' 'AgentCard copied to actor_id' 'AgentCard を actor_id に複製'
    L 'MCP client 连接边界' 'MCP client connection boundary' 'MCP client 接続境界'
    L 'CrewAI journalist agent' 'CrewAI journalist agent' 'CrewAI journalist agent'
)
$DescOverrides['AgentActor'] = @(
    D 'OpenAI Agents SDK Agent(name=, instructions="...", tools=[get_weather]) 映射 AgentActor actor_id=openai-weather-agent、runtime_configuration_ref=cfg:weather-v1。' 'OpenAI Agents SDK Agent(name=, instructions="...", tools=[get_weather]) maps AgentActor actor_id=openai-weather-agent, runtime_configuration_ref=cfg:weather-v1.' 'OpenAI Weather Agent が AgentActor にマップされる。'
    D 'A2A AgentCard skills/interfaces 复制进 actor_id 字段；发现文档可撤销，应保留 RemoteAgentReference 类型化引用。' 'Copying A2A AgentCard skills/interfaces into actor_id; discovery document can be withdrawn; retain RemoteAgentReference typed reference.' 'AgentCard フィールドの actor_id 複製は拒否する。'
    D 'MCP client 连接 https://tools.example/mcp 是 ToolServiceActor 边界；AgentActor 承担 agent 责任，MCP 是 tool 连接层。' 'MCP client connection https://tools.example/mcp is ToolServiceActor boundary; AgentActor bears agent responsibility, MCP is tool connection layer.' 'MCP 接続は ToolServiceActor 境界である。'
    D 'CrewAI Agent(role=, tools=[SerperDevTool()]) 映射 AgentActor actor_id=crewai-journalist、runtime_configuration_ref=cfg:crewai-journalist-v1。' 'CrewAI Agent(role=, tools=[SerperDevTool()]) maps AgentActor actor_id=crewai-journalist, runtime_configuration_ref=cfg:crewai-journalist-v1.' 'CrewAI journalist が AgentActor にマップされる。'
)

$LabelOverrides['SoftwareActor'] = @(
    L 'OTel service.name review-api' 'OTel service.name review-api' 'OTel service.name review-api'
    L 'Span name 当 SoftwareActor' 'Span name as SoftwareActor' 'Span name を SoftwareActor とする'
    L 'SoftwareActor 与 ModelActor 边界' 'SoftwareActor versus ModelActor boundary' 'SoftwareActor と ModelActor 境界'
    L 'support-agent worker 实例' 'support-agent worker instance' 'support-agent worker 事例'
)
$DescOverrides['SoftwareActor'] = @(
    D 'OpenTelemetry resource attribute service.name=review-api 标识部署服务 SoftwareActor actor_id=review-api-worker；不是 trace span 名称。' 'OpenTelemetry resource attribute service.name=review-api identifies deployed service SoftwareActor actor_id=review-api-worker; not trace span name.' 'OTel service.name が SoftwareActor を标识する。'
    D 'TraceSpan span_name=agent.tool_call 是单次操作名，不是长期 SoftwareActor 身份；span 不能写入 actor_id。' 'TraceSpan span_name=agent.tool_call is single operation name, not long-lived SoftwareActor identity; span cannot be actor_id.' 'span_name は SoftwareActor ではない。'
    D 'SoftwareActor 是软件责任主体；ModelActor 引用 GenerativeModel 资产；agent 进程 Actor 与 model 资产引用分离。' 'SoftwareActor is software responsible principal; ModelActor references GenerativeModel asset; agent process Actor separated from model asset reference.' 'SoftwareActor と ModelActor は分離する。'
    D 'SoftwareActor actor_id=support-agent-worker、service.name=support-agent-prod、deployment_ref=ecs/task:3。' 'SoftwareActor actor_id=support-agent-worker, service.name=support-agent-prod, deployment_ref=ecs/task:3.' 'support-agent-worker SoftwareActor を記録する。'
)

$LabelOverrides['HumanActor'] = @(
    L 'PROV-O Person 人工审查' 'PROV-O Person human review' 'PROV-O Person 人的レビュー'
    L 'user message 发送者非 HumanActor' 'User message sender not HumanActor' 'user message 送信者は HumanActor ではない'
    L 'HumanActor 与 UserActor 边界' 'HumanActor versus UserActor boundary' 'HumanActor と UserActor 境界'
    L '审查员 human-reviewer-1' 'Reviewer human-reviewer-1' 'レビュアー human-reviewer-1'
)
$DescOverrides['HumanActor'] = @(
    D 'W3C PROV-O prov:Person(human-reviewer-1) 关联 HumanReview Activity；承担审查责任，不是 Messages API role=user 消息发送者。' 'W3C PROV-O prov:Person(human-reviewer-1) associated with HumanReview Activity; bears review responsibility, not Messages API role=user message sender.' 'PROV-O Person が HumanReview Activity に関連する。'
    D 'Anthropic Messages role=user 消息发送者是 UserActor；HumanActor 是承担运行时责任的人（审查员/操作员）。' 'Anthropic Messages role=user message sender is UserActor; HumanActor is person bearing runtime responsibility (reviewer/operator).' 'role=user は UserActor、审查责任者は HumanActor である。'
    D 'HumanActor 泛化人类责任主体；UserActor 专指对话 user 角色；DeveloperRole/HumanOperatorRole 是 HumanActor 子类 runtime role。' 'HumanActor generalizes human responsible principal; UserActor specifically dialogue user role; DeveloperRole/HumanOperatorRole are HumanActor subtype runtime roles.' 'HumanActor/UserActor/RuntimeRole は階層が異なる。'
    D 'HumanActor actor_id=human-reviewer-1、actor_kind=HumanActor、role_ref=ReviewerRole、associated_activity=review-exec-842。' 'HumanActor actor_id=human-reviewer-1, actor_kind=HumanActor, role_ref=ReviewerRole, associated_activity=review-exec-842.' 'human-reviewer-1 HumanActor を記録する。'
)

$LabelOverrides['UserActor'] = @(
    L 'Anthropic Messages role=user' 'Anthropic Messages role=user' 'Anthropic Messages role=user'
    L 'OpenAI end-user id 当 UserActor' 'OpenAI end-user id as UserActor' 'OpenAI end-user id を UserActor とする'
    L 'UserActor 与 HumanOperatorRole 边界' 'UserActor versus HumanOperatorRole boundary' 'UserActor と HumanOperatorRole 境界'
    L 'thread 用户消息发送者' 'Thread user message sender' 'thread ユーザーメッセージ送信者'
)
$DescOverrides['UserActor'] = @(
    D 'Anthropic Messages API messages=[{role:"user", content:"Review this patch"}] 发送者映射 UserActor actor_id=user-alice-1，是对话输入方不是审查操作员。' 'Anthropic Messages API messages=[{role:"user", content:"Review this patch"}] sender maps UserActor actor_id=user-alice-1, dialogue input party not review operator.' 'Anthropic role=user が UserActor である。'
    D 'OpenAI metadata.end_user_id 是计费/滥用追踪字段，无对话 message 证据时不单独建模 UserActor。' 'OpenAI metadata.end_user_id is billing/abuse tracking field; without dialogue message evidence do not alone model UserActor.' 'end_user_id だけでは UserActor にならない。'
    D 'UserActor 是对话 user 角色；HumanOperatorRole 是 HITL 审批操作员；同一自然人可兼有两者但 actor_id 必须分开。' 'UserActor is dialogue user role; HumanOperatorRole is HITL approval operator; same person may have both but actor_id must be separate.' 'UserActor と HumanOperatorRole は actor_id を分離する。'
    D 'UserActor actor_id=user-alice-1、thread_id=thread_abc、last_message_id=msg-user-12、sent_at=2026-01-15T09:00:00Z。' 'UserActor actor_id=user-alice-1, thread_id=thread_abc, last_message_id=msg-user-12, sent_at=2026-01-15T09:00:00Z.' 'user-alice-1 UserActor を thread メッセージに関連付ける。'
)

$LabelOverrides['ModelActor'] = @(
    L 'OpenAI Agents Agent.model' 'OpenAI Agents Agent.model' 'OpenAI Agents Agent.model'
    L 'model 名称字符串当 Actor' 'Model name string as Actor' 'model 名文字列を Actor とする'
    L 'ModelActor 与 GenerativeModel 边界' 'ModelActor versus GenerativeModel boundary' 'ModelActor と GenerativeModel 境界'
    L 'gpt-5-nano ModelActor 实例' 'gpt-5-nano ModelActor instance' 'gpt-5-nano ModelActor 事例'
)
$DescOverrides['ModelActor'] = @(
    D 'OpenAI Agents SDK Agent(model=) 映射 ModelActor actor_id=model-actor-gpt5nano，引用 GenerativeModel 资产而非复制 model 字符串到 actor_id。' 'OpenAI Agents SDK Agent(model=) maps ModelActor actor_id=model-actor-gpt5nano referencing GenerativeModel asset not copying model string to actor_id.' 'OpenAI Agent.model が ModelActor 参照である。'
    D 'LangSmith run.extra.metadata.model=gpt-4o 是 span 元数据，不是 Moonweave ModelActor 本地身份。' 'LangSmith run.extra.metadata.model=gpt-4o is span metadata, not Moonweave ModelActor local identity.' 'LangSmith model メタデータは ModelActor ではない。'
    D 'ModelActor 是引用 model 资产的 SoftwareActor 子类；GenerativeModel 是 model 资产 Entity；Actor 引用 Model 不合并。' 'ModelActor is SoftwareActor subtype referencing model asset; GenerativeModel is model asset Entity; Actor references Model without merging.' 'ModelActor は GenerativeModel を参照する。'
    D 'ModelActor actor_id=model-actor-gpt5nano、model_ref=GenerativeModel:gpt-5-nano、invoked_by=openai-weather-agent。' 'ModelActor actor_id=model-actor-gpt5nano, model_ref=GenerativeModel:gpt-5-nano, invoked_by=openai-weather-agent.' 'model-actor-gpt5nano ModelActor を記録する。'
)

$LabelOverrides['ToolServiceActor'] = @(
    L 'MCP filesystem.read 工具服务' 'MCP filesystem.read tool service' 'MCP filesystem.read ツールサービス'
    L 'OpenAI function 名当 ToolServiceActor' 'OpenAI function name as ToolServiceActor' 'OpenAI function 名を ToolServiceActor とする'
    L 'ToolServiceActor 与 AgentActor 边界' 'ToolServiceActor versus AgentActor boundary' 'ToolServiceActor と AgentActor 境界'
    L 'MCP repo read 服务实例' 'MCP repo read service instance' 'MCP repo read サービス事例'
)
$DescOverrides['ToolServiceActor'] = @(
    D 'MCP tools/call name=filesystem.read arguments={path:"/repo/README.md"} 由 ToolServiceActor actor_id=mcp-filesystem-svc 执行，非 AgentActor 责任。' 'MCP tools/call name=filesystem.read arguments={path:"/repo/README.md"} executed by ToolServiceActor actor_id=mcp-filesystem-svc, not AgentActor responsibility.' 'MCP tools/call が ToolServiceActor によって実行される。'
    D 'OpenAI function tool name=get_weather 是 schema 定义，不是独立 ToolServiceActor；需 MCP/HTTP 服务端点才建模 ToolServiceActor。' 'OpenAI function tool name=get_weather is schema definition, not independent ToolServiceActor; need MCP/HTTP service endpoint to model ToolServiceActor.' 'function 名だけでは ToolServiceActor にならない。'
    D 'ToolServiceActor 执行 tool 调用；AgentActor 编排并承担 agent 责任；tools/call 归因 ToolServiceActor，handoff 归因 AgentActor。' 'ToolServiceActor executes tool invocation; AgentActor orchestrates and bears agent responsibility; tools/call attributes ToolServiceActor, handoff attributes AgentActor.' 'tools/call は ToolServiceActor、handoff は AgentActor である。'
    D 'ToolServiceActor actor_id=mcp-filesystem-svc、server_url=https://tools.example/mcp、tool_name=filesystem.read。' 'ToolServiceActor actor_id=mcp-filesystem-svc, server_url=https://tools.example/mcp, tool_name=filesystem.read.' 'mcp-filesystem-svc ToolServiceActor を記録する。'
)

$LabelOverrides['SystemServiceActor'] = @(
    L 'LangGraph PostgresSaver 检查点服务' 'LangGraph PostgresSaver checkpointer service' 'LangGraph PostgresSaver チェックポインタサービス'
    L 'PostgreSQL 连接串当 Actor' 'PostgreSQL connection string as Actor' 'PostgreSQL 接続文字列を Actor とする'
    L 'SystemServiceActor 与 Container 边界' 'SystemServiceActor versus Container boundary' 'SystemServiceActor と Container 境界'
    L 'checkpointer/postgres 服务实例' 'checkpointer postgres service instance' 'checkpointer/postgres サービス事例'
)
$DescOverrides['SystemServiceActor'] = @(
    D 'LangGraph PostgresSaver(conn_string=postgresql://...) 作为 SystemServiceActor actor_id=langgraph-postgres-checkpointer，执行 checkpointer.put/get 系统服务。' 'LangGraph PostgresSaver(conn_string=postgresql://...) as SystemServiceActor actor_id=langgraph-postgres-checkpointer performing checkpointer.put/get system service.' 'PostgresSaver が SystemServiceActor として checkpoint サービスを提供する。'
    D '裸 postgresql://user:pass@host/db 连接串无服务行为证据，不是 SystemServiceActor；需 checkpointer/session store 服务角色。' 'Bare postgresql://user:pass@host/db connection string without service behavior evidence is not SystemServiceActor; needs checkpointer/session store service role.' '接続文字列だけでは SystemServiceActor にならない。'
    D 'SystemServiceActor 是运行时基础设施服务；Container 是执行环境载体；Postgres 服务 Actor 与 Docker 容器分离。' 'SystemServiceActor is runtime infrastructure service; Container is execution environment carrier; Postgres service Actor separated from Docker container.' 'SystemServiceActor と Container は分離する。'
    D 'SystemServiceActor actor_id=langgraph-postgres-checkpointer、service_kind=checkpointer、store_ref=checkpointer/postgres。' 'SystemServiceActor actor_id=langgraph-postgres-checkpointer, service_kind=checkpointer, store_ref=checkpointer/postgres.' 'langgraph-postgres-checkpointer SystemServiceActor を記録する。'
)

$LabelOverrides['ExternalServiceActor'] = @(
    L 'A2A 远程 review 服务' 'A2A remote review service' 'A2A リモート review サービス'
    L 'HTTP 404 当 ExternalServiceActor' 'HTTP 404 as ExternalServiceActor' 'HTTP 404 を ExternalServiceActor とする'
    L 'ExternalServiceActor 与 RemoteAgentReference 边界' 'ExternalServiceActor versus RemoteAgentReference boundary' 'ExternalServiceActor と RemoteAgentReference 境界'
    L 'a2a-review.example.com 实例' 'a2a-review.example.com instance' 'a2a-review.example.com 事例'
)
$DescOverrides['ExternalServiceActor'] = @(
    D 'A2A Protocol AgentCard url=https://review.example.com/.well-known/agent.json 引用 ExternalServiceActor actor_id=a2a-review-remote，执行远程 review 任务。' 'A2A Protocol AgentCard url=https://review.example.com/.well-known/agent.json references ExternalServiceActor actor_id=a2a-review-remote executing remote review task.' 'A2A AgentCard URL が ExternalServiceActor を参照する。'
    D 'HTTP 404 响应无 AgentCard/服务端点身份，不是 ExternalServiceActor；需稳定远程服务引用与能力证据。' 'HTTP 404 response without AgentCard/service endpoint identity is not ExternalServiceActor; needs stable remote service reference and capability evidence.' 'HTTP 404 だけでは ExternalServiceActor にならない。'
    D 'ExternalServiceActor 是远程服务责任主体；RemoteAgentReference 是发现/card 引用 Entity；card 引用不等于本地 Actor 身份。' 'ExternalServiceActor is remote service responsible principal; RemoteAgentReference is discovery/card reference Entity; card reference is not local Actor identity.' 'ExternalServiceActor と RemoteAgentReference は分離する。'
    D 'ExternalServiceActor actor_id=a2a-review-remote、agent_card_url=https://review.example.com/.well-known/agent.json、capability=review_patch。' 'ExternalServiceActor actor_id=a2a-review-remote, agent_card_url=https://review.example.com/.well-known/agent.json, capability=review_patch.' 'a2a-review-remote ExternalServiceActor を記録する。'
)

$LabelOverrides['ActorBinding'] = @(
    L 'OpenAI handoff 绑定' 'OpenAI handoff binding' 'OpenAI handoff バインディング'
    L '全局 tools 列表非 Binding' 'Global tools list not Binding' 'グローバル tools 一覧は Binding ではない'
    L 'ActorBinding 与 ActorRoleBinding 边界' 'ActorBinding versus ActorRoleBinding boundary' 'ActorBinding と ActorRoleBinding 境界'
    L 'triage→booking handoff 实例' 'triage to booking handoff instance' 'triage→booking handoff 事例'
)
$DescOverrides['ActorBinding'] = @(
    D 'OpenAI Agents SDK triage_agent handoffs=[booking_agent] 产生 ActorBinding binding_id=handoff-triage-booking、source_actor=triage_agent、target_scope=booking_agent。' 'OpenAI Agents SDK triage_agent handoffs=[booking_agent] produces ActorBinding binding_id=handoff-triage-booking, source_actor=triage_agent, target_scope=booking_agent.' 'OpenAI handoffs が ActorBinding を生成する。'
    D 'Agent tools=[get_weather, read_file] 全局列表无 source/target scope，不是 ActorBinding。' 'Agent tools=[get_weather, read_file] global list without source/target scope is not ActorBinding.' 'tools 一覧だけでは ActorBinding にならない。'
    D 'ActorBinding 泛化 actor 间绑定；ActorRoleBinding 绑定 role；ActorCapabilityBinding 绑定 capability；handoff 是 AgentBinding 子类型。' 'ActorBinding generalizes inter-actor binding; ActorRoleBinding binds role; ActorCapabilityBinding binds capability; handoff is AgentBinding subtype.' 'Binding 类型は scope によって分離する。'
    D 'ActorBinding binding_id=handoff-triage-booking、source_actor_id=openai-triage-agent、target_actor_id=openai-booking-agent。' 'ActorBinding binding_id=handoff-triage-booking, source_actor_id=openai-triage-agent, target_actor_id=openai-booking-agent.' 'handoff-triage-booking ActorBinding を記録する。'
)

$LabelOverrides['ActorRoleBinding'] = @(
    L 'CrewAI Senior Data Researcher 角色绑定' 'CrewAI Senior Data Researcher role binding' 'CrewAI Senior Data Researcher ロールバインディング'
    L 'OpenAI instructions 文本非 RoleBinding' 'OpenAI instructions text not RoleBinding' 'OpenAI instructions テキストは RoleBinding ではない'
    L 'RoleBinding 与 RuntimeRole 边界' 'RoleBinding versus RuntimeRole boundary' 'RoleBinding と RuntimeRole 境界'
    L 'researcher task-61 绑定实例' 'researcher task-61 binding instance' 'researcher task-61 バインディング事例'
)
$DescOverrides['ActorRoleBinding'] = @(
    D 'CrewAI Agent(role=) 绑定 Task task-61 产生 ActorRoleBinding binding_id=role-researcher-task61、role=Senior Data Researcher、task_id=task-61。' 'CrewAI Agent(role=) bound to Task task-61 produces ActorRoleBinding binding_id=role-researcher-task61, role=Senior Data Researcher, task_id=task-61.' 'CrewAI role が Task に ActorRoleBinding される。'
    D 'OpenAI Agent instructions="You are a researcher..." 是自然语言配置，不是 scoped ActorRoleBinding 记录。' 'OpenAI Agent instructions="You are a researcher..." is natural language config, not scoped ActorRoleBinding record.' 'instructions テキストだけでは RoleBinding にならない。'
    D 'ActorRoleBinding 将 RuntimeRole 绑定到 actor/task scope；RuntimeRole 是角色定义；binding 是 scoped 关联记录。' 'ActorRoleBinding binds RuntimeRole to actor/task scope; RuntimeRole is role definition; binding is scoped association record.' 'RuntimeRole 定義と RoleBinding 記録は分離する。'
    D 'ActorRoleBinding binding_id=role-researcher-task61、actor_id=crewai-journalist、role_ref=ReviewerRole、scope_ref=task-61。' 'ActorRoleBinding binding_id=role-researcher-task61, actor_id=crewai-journalist, role_ref=ReviewerRole, scope_ref=task-61.' 'role-researcher-task61 ActorRoleBinding を記録する。'
)

$LabelOverrides['ActorCapabilityBinding'] = @(
    L 'MCP filesystem.read 能力绑定' 'MCP filesystem.read capability binding' 'MCP filesystem.read ケイパビリティバインディング'
    L 'OpenAI tools 数组非 CapabilityBinding' 'OpenAI tools array not CapabilityBinding' 'OpenAI tools 配列は CapabilityBinding ではない'
    L 'CapabilityBinding 与 ToolServiceActor 边界' 'CapabilityBinding versus ToolServiceActor boundary' 'CapabilityBinding と ToolServiceActor 境界'
    L 'repo read 能力 scope 实例' 'repo read capability scope instance' 'repo read ケイパビリティ scope 事例'
)
$DescOverrides['ActorCapabilityBinding'] = @(
    D 'MCP tools/list 返回 filesystem.read；ActorCapabilityBinding binding_id=cap-fs-read-repo、capability=filesystem.read、scope_ref=repo:moonweave/schema。' 'MCP tools/list returns filesystem.read; ActorCapabilityBinding binding_id=cap-fs-read-repo, capability=filesystem.read, scope_ref=repo:moonweave/schema.' 'MCP filesystem.read が repo scope に CapabilityBinding される。'
    D 'OpenAI Agent tools=[get_weather] 是工具 schema 列表，无 capability+scope 绑定记录，不是 ActorCapabilityBinding。' 'OpenAI Agent tools=[get_weather] is tool schema list without capability+scope binding record, not ActorCapabilityBinding.' 'tools 配列だけでは CapabilityBinding にならない。'
    D 'ActorCapabilityBinding 记录 actor 在 scope 内可用 capability；ToolServiceActor 是执行服务主体；capability 绑定与 tool 服务 Actor 分离。' 'ActorCapabilityBinding records actor capability available within scope; ToolServiceActor is execution service principal; capability binding separated from tool service Actor.' 'CapabilityBinding と ToolServiceActor は分離する。'
    D 'ActorCapabilityBinding binding_id=cap-fs-read-repo、actor_id=openai-weather-agent、capability=filesystem.read、scope_ref=repo:moonweave/schema。' 'ActorCapabilityBinding binding_id=cap-fs-read-repo, actor_id=openai-weather-agent, capability=filesystem.read, scope_ref=repo:moonweave/schema.' 'cap-fs-read-repo CapabilityBinding を記録する。'
)

$LabelOverrides['RuntimeRole'] = @(
    L 'CrewAI Agent role 字段' 'CrewAI Agent role field' 'CrewAI Agent role フィールド'
    L 'OpenAI agent name 非 RuntimeRole' 'OpenAI agent name not RuntimeRole' 'OpenAI agent name は RuntimeRole ではない'
    L 'RuntimeRole 与 Actor 边界' 'RuntimeRole versus Actor boundary' 'RuntimeRole と Actor 境界'
    L 'Data Analysis Specialist 角色' 'Data Analysis Specialist role' 'Data Analysis Specialist ロール'
)
$DescOverrides['RuntimeRole'] = @(
    D 'CrewAI Agent(role=, goal="...", backstory="...") 的 role 字段定义 RuntimeRole role_id=senior-data-researcher。' 'CrewAI Agent(role=, goal="...", backstory="...") role field defines RuntimeRole role_id=senior-data-researcher.' 'CrewAI Agent.role が RuntimeRole を定義する。'
    D 'OpenAI Agents SDK Agent(name=) 的 name 是 agent 配置名，不是 CrewAI 式 RuntimeRole 定义。' 'OpenAI Agents SDK Agent(name=) name is agent config name, not CrewAI-style RuntimeRole definition.' 'OpenAI Agent.name は RuntimeRole ではない。'
    D 'RuntimeRole 是角色定义 Entity；Actor 是责任主体；ActorRoleBinding 将 role 绑定到 actor scope。' 'RuntimeRole is role definition Entity; Actor is responsible principal; ActorRoleBinding binds role to actor scope.' 'RuntimeRole 定義と Actor 主体は分離する。'
    D 'RuntimeRole role_id=data-analysis-specialist、label="Data Analysis Specialist"、framework=crewai。' 'RuntimeRole role_id=data-analysis-specialist, label="Data Analysis Specialist", framework=crewai.' 'data-analysis-specialist RuntimeRole を記録する。'
)

$LabelOverrides['ReviewerRole'] = @(
    L 'CrewAI Data Analysis Specialist 审查' 'CrewAI Data Analysis Specialist review' 'CrewAI Data Analysis Specialist レビュー'
    L 'GitHub CODEOWNERS 非 ReviewerRole' 'GitHub CODEOWNERS not ReviewerRole' 'GitHub CODEOWNERS は ReviewerRole ではない'
    L 'ReviewerRole 与 HumanActor 边界' 'ReviewerRole versus HumanActor boundary' 'ReviewerRole と HumanActor 境界'
    L 'reviewer-role 实例' 'reviewer-role instance' 'reviewer-role 事例'
)
$DescOverrides['ReviewerRole'] = @(
    D 'CrewAI crafting-effective-agents 指南：Agent(role=) 承担审查分析任务，映射 ReviewerRole role_id=reviewer-role。' 'CrewAI crafting-effective-agents guide: Agent(role=) performs review analysis mapping ReviewerRole role_id=reviewer-role.' 'CrewAI Data Analysis Specialist が ReviewerRole である。'
    D 'GitHub CODEOWNERS @team-review 是仓库治理配置，不是运行时 ReviewerRole Activity 证据。' 'GitHub CODEOWNERS @team-review is repository governance config, not runtime ReviewerRole Activity evidence.' 'CODEOWNERS は ReviewerRole ではない。'
    D 'ReviewerRole 是审查 runtime role 定义；HumanActor 是承担审查的人；SoftwareActor AgentActor 是可自动化审查 agent。' 'ReviewerRole is review runtime role definition; HumanActor is person performing review; SoftwareActor AgentActor is automatable review agent.' 'ReviewerRole/HumanActor/AgentActor は層が異なる。'
    D 'ReviewerRole role_id=reviewer-role、label="Data Analysis Specialist"、bound_actor=human-reviewer-1、task_scope=review-exec-842。' 'ReviewerRole role_id=reviewer-role, label="Data Analysis Specialist", bound_actor=human-reviewer-1, task_scope=review-exec-842.' 'reviewer-role ReviewerRole を記録する。'
)

$LabelOverrides['HumanOperatorRole'] = @(
    L 'OpenAI HITL 审批操作员' 'OpenAI HITL approval operator' 'OpenAI HITL 承認オペレータ'
    L 'UserActor 对话用户非 Operator' 'UserActor dialogue user not Operator' 'UserActor 対話ユーザーは Operator ではない'
    L 'OperatorRole 与 DeveloperRole 边界' 'OperatorRole versus DeveloperRole boundary' 'OperatorRole と DeveloperRole 境界'
    L 'operator-role 审批实例' 'operator-role approval instance' 'operator-role 承認事例'
)
$DescOverrides['HumanOperatorRole'] = @(
    D 'OpenAI Agents SDK human-in-the-loop：Runner.run 触发 approval 时 HumanOperatorRole role_id=operator-role 绑定 operator@corp.com 执行 approve/reject。' 'OpenAI Agents SDK human-in-the-loop: Runner.run triggers approval where HumanOperatorRole role_id=operator-role binds operator@corp.com to approve/reject.' 'OpenAI HITL approval が HumanOperatorRole である。'
    D 'Anthropic Messages role=user 是对话输入 UserActor，不是 HITL HumanOperatorRole 审批操作员。' 'Anthropic Messages role=user is dialogue input UserActor, not HITL HumanOperatorRole approval operator.' 'role=user は UserActor、HITL 承認者は HumanOperatorRole である。'
    D 'HumanOperatorRole 是运行时审批/操作 role；DeveloperRole 是 IDE 开发者触发 agent；operator 与 developer 职责不同。' 'HumanOperatorRole is runtime approval/operation role; DeveloperRole is IDE developer triggering agent; operator and developer duties differ.' 'HumanOperatorRole と DeveloperRole は分離する。'
    D 'HumanOperatorRole role_id=operator-role、operator_id=operator@corp.com、approval_request_id=appr-900、decision=approved。' 'HumanOperatorRole role_id=operator-role, operator_id=operator@corp.com, approval_request_id=appr-900, decision=approved.' 'operator-role 承認 decision を記録する。'
)

$LabelOverrides['DeveloperRole'] = @(
    L 'Cursor IDE 开发者触发 agent' 'Cursor IDE developer triggers agent' 'Cursor IDE 開発者が agent を起動'
    L 'git commit author 非 DeveloperRole' 'git commit author not DeveloperRole' 'git commit author は DeveloperRole ではない'
    L 'DeveloperRole 与 HumanOperatorRole 边界' 'DeveloperRole versus HumanOperatorRole boundary' 'DeveloperRole と HumanOperatorRole 境界'
    L 'developer-role Cursor 会话' 'developer-role Cursor session' 'developer-role Cursor セッション'
)
$DescOverrides['DeveloperRole'] = @(
    D 'Cursor IDE 开发者打开 Chat session_id=cursor-agent-session-77 触发 agent run，映射 DeveloperRole role_id=developer-role、developer_id=dev-bob。' 'Cursor IDE developer opens Chat session_id=cursor-agent-session-77 triggering agent run mapping DeveloperRole role_id=developer-role, developer_id=dev-bob.' 'Cursor Chat 起動が DeveloperRole である。'
    D 'git commit author=dev-bob 是 VCS 元数据，不是运行时 DeveloperRole Activity 证据。' 'git commit author=dev-bob is VCS metadata, not runtime DeveloperRole Activity evidence.' 'git author は DeveloperRole ではない。'
    D 'DeveloperRole 是 IDE/开发场景触发 agent 的 role；HumanOperatorRole 是 HITL 审批；developer 触发 run，operator 审批 run。' 'DeveloperRole is IDE/dev scenario triggering agent role; HumanOperatorRole is HITL approval; developer triggers run, operator approves run.' 'DeveloperRole は run 起動、HumanOperatorRole は承認である。'
    D 'DeveloperRole role_id=developer-role、developer_id=dev-bob、session_id=cursor-agent-session-77、triggered_at=2026-01-15T08:30:00Z。' 'DeveloperRole role_id=developer-role, developer_id=dev-bob, session_id=cursor-agent-session-77, triggered_at=2026-01-15T08:30:00Z.' 'developer-role Cursor セッションを記録する。'
)

$LabelOverrides['RemoteAgentReference'] = @(
    L 'A2A AgentCard URL 引用' 'A2A AgentCard URL reference' 'A2A AgentCard URL 参照'
    L 'assistant_id 当 RemoteReference' 'assistant_id as RemoteReference' 'assistant_id を RemoteReference とする'
    L 'RemoteReference 与 ExternalServiceActor 边界' 'RemoteReference versus ExternalServiceActor boundary' 'RemoteReference と ExternalServiceActor 境界'
    L 'review.example.com card 实例' 'review.example.com card instance' 'review.example.com card 事例'
)
$DescOverrides['RemoteAgentReference'] = @(
    D 'A2A Protocol discovery：GET https://review.example.com/.well-known/agent.json 返回 AgentCard；RemoteAgentReference ref_id=a2a-card-review、card_url=上述 URL。' 'A2A Protocol discovery: GET https://review.example.com/.well-known/agent.json returns AgentCard; RemoteAgentReference ref_id=a2a-card-review, card_url above URL.' 'A2A AgentCard URL が RemoteAgentReference である。'
    D 'OpenAI assistant_id=asst_abc 是本地 Assistants 配置 ID，不是 A2A RemoteAgentReference card URL。' 'OpenAI assistant_id=asst_abc is local Assistants config ID, not A2A RemoteAgentReference card URL.' 'assistant_id は RemoteAgentReference ではない。'
    D 'RemoteAgentReference 是发现/card 引用 Entity；ExternalServiceActor 是远程服务责任主体；card 引用用于发现，Actor 用于归因。' 'RemoteAgentReference is discovery/card reference Entity; ExternalServiceActor is remote service responsible principal; card reference for discovery, Actor for attribution.' 'RemoteAgentReference と ExternalServiceActor は分離する。'
    D 'RemoteAgentReference ref_id=a2a-card-review、card_url=https://review.example.com/.well-known/agent.json、discovered_at=2026-01-15T08:00:00Z。' 'RemoteAgentReference ref_id=a2a-card-review, card_url=https://review.example.com/.well-known/agent.json, discovered_at=2026-01-15T08:00:00Z.' 'a2a-card-review RemoteAgentReference を記録する。'
)

$LabelOverrides['Model'] = @(
    L 'OpenAI gpt-4o 模型资产' 'OpenAI gpt-4o model asset' 'OpenAI gpt-4o モデル資産'
    L 'LangSmith model 字符串非 Model' 'LangSmith model string not Model' 'LangSmith model 文字列は Model ではない'
    L 'Model 与 GenerativeModel 边界' 'Model versus GenerativeModel boundary' 'Model と GenerativeModel 境界'
    L 'model-g-12 gpt-4o 实例' 'model-g-12 gpt-4o instance' 'model-g-12 gpt-4o 事例'
)
$DescOverrides['Model'] = @(
    D 'OpenAI Agents SDK Agent(model=) 引用 Model model_id=model-g-12、provider=openai、model_name=gpt-4o 作为生成模型资产。' 'OpenAI Agents SDK Agent(model=) references Model model_id=model-g-12, provider=openai, model_name=gpt-4o as generative model asset.' 'OpenAI gpt-4o が Model 資産として参照される。'
    D 'LangSmith run.extra.metadata.model= 是 span 元数据字符串，不是 Moonweave Model 资产记录。' 'LangSmith run.extra.metadata.model= is span metadata string, not Moonweave Model asset record.' 'LangSmith model 文字列は Model 資産ではない。'
    D 'Model 是模型资产基类；GenerativeModel/EmbeddingModel/RerankerModel 是子类；ModelActor 引用 Model 不合并 span metadata。' 'Model is model asset base class; GenerativeModel/EmbeddingModel/RerankerModel are subtypes; ModelActor references Model without merging span metadata.' 'Model 階層と ModelActor 参照は分離する。'
    D 'Model model_id=model-g-12、provider=openai、model_name=gpt-4o、model_kind=GenerativeModel。' 'Model model_id=model-g-12, provider=openai, model_name=gpt-4o, model_kind=GenerativeModel.' 'model-g-12 gpt-4o Model を記録する。'
)

$LabelOverrides['GenerativeModel'] = @(
    L 'OpenAI gpt-4o LangSmith generation' 'OpenAI gpt-4o LangSmith generation' 'OpenAI gpt-4o LangSmith generation'
    L 'tokenizer 配置非 GenerativeModel' 'Tokenizer config not GenerativeModel' 'tokenizer 設定は GenerativeModel ではない'
    L 'GenerativeModel 与 ModelActor 边界' 'GenerativeModel versus ModelActor boundary' 'GenerativeModel と ModelActor 境界'
    L 'gpt-4o generation run 实例' 'gpt-4o generation run instance' 'gpt-4o generation run 事例'
)
$DescOverrides['GenerativeModel'] = @(
    D 'LangSmith generation run name=llm.generate、model=gpt-4o、input_tokens=1200、output_tokens=300；映射 GenerativeModel model_id=model-g-12。' 'LangSmith generation run name=llm.generate, model=gpt-4o, input_tokens=1200, output_tokens=300; maps GenerativeModel model_id=model-g-12.' 'LangSmith llm.generate が GenerativeModel gpt-4o である。'
    D 'tiktoken encoding cl100k_base 是 tokenizer 配置，不是 GenerativeModel 资产记录。' 'tiktoken encoding cl100k_base is tokenizer config, not GenerativeModel asset record.' 'tokenizer 設定は GenerativeModel ではない。'
    D 'GenerativeModel 是文本生成 model 资产；ModelActor 是引用 model 的 Actor；generation span 报告调用，Model 记录资产。' 'GenerativeModel is text generation model asset; ModelActor is Actor referencing model; generation span reports invocation, Model records asset.' 'GenerativeModel 資産と ModelActor 参照は分離する。'
    D 'GenerativeModel model_id=model-g-12、model_name=gpt-4o、provider=openai、max_output_tokens=4096。' 'GenerativeModel model_id=model-g-12, model_name=gpt-4o, provider=openai, max_output_tokens=4096.' 'model-g-12 GenerativeModel gpt-4o を記録する。'
)

$LabelOverrides['EmbeddingModel'] = @(
    L 'OpenAI text-embedding-3-small' 'OpenAI text-embedding-3-small' 'OpenAI text-embedding-3-small'
    L '向量数组当 EmbeddingModel' 'Vector array as EmbeddingModel' 'ベクトル配列を EmbeddingModel とする'
    L 'EmbeddingModel 与 TraceSpan 边界' 'EmbeddingModel versus TraceSpan boundary' 'EmbeddingModel と TraceSpan 境界'
    L 'model-e-3 retriever 实例' 'model-e-3 retriever instance' 'model-e-3 retriever 事例'
)
$DescOverrides['EmbeddingModel'] = @(
    D 'OpenAI embeddings.create(model=, input="...") 在 LangSmith retriever.search span 中引用 EmbeddingModel model_id=model-e-3、dimensions=1536。' 'OpenAI embeddings.create(model=, input="...") referenced in LangSmith retriever.search span as EmbeddingModel model_id=model-e-3, dimensions=1536.' 'OpenAI text-embedding-3-small が EmbeddingModel である。'
    D 'numpy array shape=(1536,) 是 embedding 输出向量，不是 EmbeddingModel 资产定义。' 'numpy array shape=(1536,) is embedding output vector, not EmbeddingModel asset definition.' 'ベクトル配列は EmbeddingModel 資産定義ではない。'
    D 'EmbeddingModel 是 embedding 模型资产；TraceSpan retriever.search 记录调用 timing；model 资产与 span 分离。' 'EmbeddingModel is embedding model asset; TraceSpan retriever.search records invocation timing; model asset separated from span.' 'EmbeddingModel 資産と retriever span は分離する。'
    D 'EmbeddingModel model_id=model-e-3、model_name=text-embedding-3-small、provider=openai、dimensions=1536。' 'EmbeddingModel model_id=model-e-3, model_name=text-embedding-3-small, provider=openai, dimensions=1536.' 'model-e-3 EmbeddingModel を記録する。'
)

$LabelOverrides['RerankerModel'] = @(
    L 'Cohere rerank-v3 LangSmith tool run' 'Cohere rerank-v3 LangSmith tool run' 'Cohere rerank-v3 LangSmith tool run'
    L 'sort() 本地排序非 RerankerModel' 'Local sort not RerankerModel' 'sort() ローカルソートは RerankerModel ではない'
    L 'RerankerModel 与 EmbeddingModel 边界' 'RerankerModel versus EmbeddingModel boundary' 'RerankerModel と EmbeddingModel 境界'
    L 'model-r-2 rerank 实例' 'model-r-2 rerank instance' 'model-r-2 rerank 事例'
)
$DescOverrides['RerankerModel'] = @(
    D 'Cohere rerank(model=, query="...", documents=[...]) 在 LangSmith tool run name=rerank 中映射 RerankerModel model_id=model-r-2、top_n=5。' 'Cohere rerank(model=, query="...", documents=[...]) in LangSmith tool run name=rerank maps RerankerModel model_id=model-r-2, top_n=5.' 'Cohere rerank-v3 が RerankerModel である。'
    D 'Python sorted(docs, key=score) 是本地排序逻辑，不是 Cohere RerankerModel 资产。' 'Python sorted(docs, key=score) is local sorting logic, not Cohere RerankerModel asset.' 'sorted() は RerankerModel ではない。'
    D 'RerankerModel 是 rerank 模型资产；EmbeddingModel 是向量模型；retriever pipeline 可先后引用两者。' 'RerankerModel is rerank model asset; EmbeddingModel is vector model; retriever pipeline may reference both sequentially.' 'RerankerModel と EmbeddingModel は別資産である。'
    D 'RerankerModel model_id=model-r-2、model_name=rerank-v3、provider=cohere、top_n=5。' 'RerankerModel model_id=model-r-2, model_name=rerank-v3, provider=cohere, top_n=5.' 'model-r-2 RerankerModel を記録する。'
)

# runtime-artifacts module
$LabelOverrides['runtime-artifacts'] = @(
    L 'A2A Protocol v0.3 Artifact' 'A2A Protocol v0.3 Artifact' 'A2A Protocol v0.3 Artifact'
    L 'Docker 容器 ID 非 Artifact' 'Docker container ID not Artifact' 'Docker container ID は Artifact ではない'
    L 'LangSmith run.outputs 边界' 'LangSmith run.outputs boundary' 'LangSmith run.outputs 境界'
    L 'GitHub Actions 构建产物' 'GitHub Actions build artifact' 'GitHub Actions ビルド artifact'
)
$DescOverrides['runtime-artifacts'] = @(
    D 'A2A Protocol v0.3 Artifact：artifactId=a1、name=itinerary、parts=[TextPart, DataPart]、index=0（a2a-protocol.org/specification）。' 'A2A Protocol v0.3 Artifact: artifactId=a1, name=itinerary, parts=[TextPart, DataPart], index=0 (a2a-protocol.org/specification).' 'A2A Artifact artifactId=a1 が PROV Entity である。'
    D 'Docker container sha256:abc123 标识运行环境 Container，不是稳定 content digest 的 Artifact 输出。' 'Docker container sha256:abc123 identifies runtime Container environment, not stable content digest Artifact output.' 'Docker container ID は Artifact ではない。'
    D 'LangSmith run.outputs 是 trace 输出预览；Artifact 需 content_digest 与独立检索；trace preview 不是 PROV Entity。' 'LangSmith run.outputs is trace output preview; Artifact needs content_digest and independent retrieval; trace preview is not PROV Entity.' 'LangSmith outputs は trace 証拠、Artifact は Entity である。'
    D 'GitHub Actions upload-artifact name=production-build、path=dist/、retention-days=90（docs.github.com/actions）映射 ExportArtifact。' 'GitHub Actions upload-artifact name=production-build, path=dist/, retention-days=90 (docs.github.com/actions) maps ExportArtifact.' 'GitHub Actions artifact が ExportArtifact である。'
)

$LabelOverrides['Artifact'] = @(
    L 'A2A Artifact parts' 'A2A Artifact parts' 'A2A Artifact parts'
    L '进程句柄非 Artifact' 'Process handle not Artifact' 'プロセスハンドルは Artifact ではない'
    L 'Span event 与 Artifact 边界' 'Span event versus Artifact boundary' 'Span event と Artifact 境界'
    L 'OpenAI assistant message 输出' 'OpenAI assistant message output' 'OpenAI assistant message 出力'
)
$DescOverrides['Artifact'] = @(
    D 'A2A Artifact artifactId=a2a-report-a1、name=report、parts=[TextPart, FilePart]、content_digest=sha256:8b1a9953...；PROV-O Entity 由 Execution 生成。' 'A2A Artifact artifactId=a2a-report-a1, name=report, parts=[TextPart, FilePart], content_digest=sha256:8b1a9953...; PROV-O Entity generated by Execution.' 'A2A Artifact parts が PROV Entity である。'
    D 'ProcessHandle PID=4820 指向 worker 进程，无稳定内容输出与 content_digest，不是 Artifact。' 'ProcessHandle PID=4820 points to worker process without stable content output and content_digest, not Artifact.' 'PID は Artifact ではない。'
    D 'OTel span.add_event("artifact_uploaded") 报告上传发生；Artifact 内容在独立 Entity 记录；event 是证据，Artifact 是输出。' 'OTel span.add_event("artifact_uploaded") reports upload occurrence; Artifact content in independent Entity record; event is evidence, Artifact is output.' 'span event と Artifact Entity は分離する。'
    D 'OpenAI Assistants Messages API 返回 assistant role message 文本作为 Run 输出 Artifact artifact_id=openai-message-output-22、media_type=text/plain。' 'OpenAI Assistants Messages API returns assistant role message text as Run output Artifact artifact_id=openai-message-output-22, media_type=text/plain.' 'OpenAI assistant message が Artifact 出力である。'
)

$LabelOverrides['PatchArtifact'] = @(
    L 'GitHub PR unified diff' 'GitHub PR unified diff' 'GitHub PR unified diff'
    L 'LangGraph StateDiff 非 PatchArtifact' 'LangGraph StateDiff not PatchArtifact' 'LangGraph StateDiff は PatchArtifact ではない'
    L 'PatchArtifact 与 ReportArtifact 边界' 'PatchArtifact versus ReportArtifact boundary' 'PatchArtifact と ReportArtifact 境界'
    L 'patch-17 PR diff 实例' 'patch-17 PR diff instance' 'patch-17 PR diff 事例'
)
$DescOverrides['PatchArtifact'] = @(
    D 'GitHub REST API pulls/17/files 返回 unified diff patch；PatchArtifact artifact_id=patch-17、media_type=text/x-diff、content_digest=sha256:...' 'GitHub REST API pulls/17/files returns unified diff patch; PatchArtifact artifact_id=patch-17, media_type=text/x-diff, content_digest=sha256:...' 'GitHub PR unified diff が PatchArtifact である。'
    D 'LangGraph StateDiff channel=messages patch 是运行时状态 delta，不是 Git unified diff PatchArtifact。' 'LangGraph StateDiff channel=messages patch is runtime state delta, not Git unified diff PatchArtifact.' 'StateDiff は PatchArtifact ではない。'
    D 'PatchArtifact 是代码/文本 patch 输出；ReportArtifact 是研究报告；patch diff 与 narrative report 媒体类型不同。' 'PatchArtifact is code/text patch output; ReportArtifact is research report; patch diff and narrative report differ in media type.' 'PatchArtifact と ReportArtifact は媒体类型が異なる。'
    D 'PatchArtifact artifact_id=patch-17、pr_number=17、repo=moonweave/schema、lines_changed=42。' 'PatchArtifact artifact_id=patch-17, pr_number=17, repo=moonweave/schema, lines_changed=42.' 'patch-17 PatchArtifact を記録する。'
)

$LabelOverrides['ReportArtifact'] = @(
    L 'A2A TextPart 研究报告' 'A2A TextPart research report' 'A2A TextPart 研究レポート'
    L 'LangSmith run.outputs 非 ReportArtifact' 'LangSmith run.outputs not ReportArtifact' 'LangSmith run.outputs は ReportArtifact ではない'
    L 'ReportArtifact 与 ExportArtifact 边界' 'ReportArtifact versus ExportArtifact boundary' 'ReportArtifact と ExportArtifact 境界'
    L 'report-22 研究输出实例' 'report-22 research output instance' 'report-22 研究出力事例'
)
$DescOverrides['ReportArtifact'] = @(
    D 'A2A Protocol Artifact parts=[TextPart(text="Research findings...")]、artifactId=report-22、name=research_report；任务可交付研究报告。' 'A2A Protocol Artifact parts=[TextPart(text="Research findings...")], artifactId=report-22, name=research_report; task deliverable research report.' 'A2A TextPart research report が ReportArtifact である。'
    D 'LangSmith run.outputs={"summary":"..."} 是 trace 预览，无 content_digest 与独立检索，不是 ReportArtifact Entity。' 'LangSmith run.outputs={"summary":"..."} is trace preview without content_digest and independent retrieval, not ReportArtifact Entity.' 'LangSmith outputs は ReportArtifact ではない。'
    D 'ReportArtifact 是 narrative/report 文本输出；ExportArtifact 是 CI/打包导出；research report 与 build artifact 用途不同。' 'ReportArtifact is narrative/report text output; ExportArtifact is CI/package export; research report and build artifact differ in purpose.' 'ReportArtifact と ExportArtifact は用途が異なる。'
    D 'ReportArtifact artifact_id=report-22、media_type=text/markdown、word_count=1800、generated_by=review-exec-842。' 'ReportArtifact artifact_id=report-22, media_type=text/markdown, word_count=1800, generated_by=review-exec-842.' 'report-22 ReportArtifact を記録する。'
)

$LabelOverrides['GraphArtifact'] = @(
    L 'LangGraph 状态图 JSON 导出' 'LangGraph state graph JSON export' 'LangGraph 状態グラフ JSON エクスポート'
    L 'Mermaid 渲染图非 GraphArtifact' 'Mermaid render not GraphArtifact' 'Mermaid レンダリングは GraphArtifact ではない'
    L 'GraphArtifact 与 SchemaArtifact 边界' 'GraphArtifact versus SchemaArtifact boundary' 'GraphArtifact と SchemaArtifact 境界'
    L 'graph-8 state graph 实例' 'graph-8 state graph instance' 'graph-8 state graph 事例'
)
$DescOverrides['GraphArtifact'] = @(
    D 'LangGraph 导出 compiled StateGraph JSON：nodes=[agent, tools]、edges=[...]；GraphArtifact artifact_id=graph-8、media_type=application/json。' 'LangGraph exports compiled StateGraph JSON: nodes=[agent, tools], edges=[...]; GraphArtifact artifact_id=graph-8, media_type=application/json.' 'LangGraph StateGraph JSON が GraphArtifact である。'
    D 'Mermaid flowchart 渲染 PNG 是可视化图像，不是 LangGraph state graph 结构 JSON GraphArtifact。' 'Mermaid flowchart rendered PNG is visualization image, not LangGraph state graph structure JSON GraphArtifact.' 'Mermaid PNG は GraphArtifact ではない。'
    D 'GraphArtifact 是图结构/runtime graph 导出；SchemaArtifact 是 JSON Schema/RDF/SHACL；graph topology 与 validation schema 分离。' 'GraphArtifact is graph structure/runtime graph export; SchemaArtifact is JSON Schema/RDF/SHACL; graph topology separated from validation schema.' 'GraphArtifact と SchemaArtifact は分離する。'
    D 'GraphArtifact artifact_id=graph-8、graph_kind=langgraph_state、node_count=5、edge_count=6。' 'GraphArtifact artifact_id=graph-8, graph_kind=langgraph_state, node_count=5, edge_count=6.' 'graph-8 GraphArtifact を記録する。'
)

$LabelOverrides['ExportArtifact'] = @(
    L 'GitHub Actions upload-artifact' 'GitHub Actions upload artifact' 'GitHub Actions upload-artifact'
    L 'S3 object 非 ExportArtifact' 'S3 object not ExportArtifact' 'S3 object は ExportArtifact ではない'
    L 'ExportArtifact 与 ReportArtifact 边界' 'ExportArtifact versus ReportArtifact boundary' 'ExportArtifact と ReportArtifact 境界'
    L 'export-5 production-build 实例' 'export-5 production-build instance' 'export-5 production-build 事例'
)
$DescOverrides['ExportArtifact'] = @(
    D 'GitHub Actions actions/upload-artifact@v4 name=production-build、path=dist/、retention-days=90；ExportArtifact artifact_id=export-5、content_digest=sha256:...' 'GitHub Actions actions/upload-artifact@v4 name=production-build, path=dist/, retention-days=90; ExportArtifact artifact_id=export-5, content_digest=sha256:...' 'GitHub upload-artifact が ExportArtifact である。'
    D '裸 s3://bucket/key 对象无 CI export 元数据与 retention 策略，不是 Moonweave ExportArtifact 记录。' 'Bare s3://bucket/key object without CI export metadata and retention policy is not Moonweave ExportArtifact record.' 'S3 object だけでは ExportArtifact にならない。'
    D 'ExportArtifact 是 CI/打包导出产物；ReportArtifact 是 agent 研究报告；build dist/ 与 research markdown 用途不同。' 'ExportArtifact is CI/package export product; ReportArtifact is agent research report; build dist/ and research markdown differ in purpose.' 'ExportArtifact と ReportArtifact は用途が異なる。'
    D 'ExportArtifact artifact_id=export-5、name=production-build、path=dist/、workflow_run_id=9001。' 'ExportArtifact artifact_id=export-5, name=production-build, path=dist/, workflow_run_id=9001.' 'export-5 ExportArtifact を記録する。'
)

$LabelOverrides['SchemaArtifact'] = @(
    L 'OpenAI function tool JSON Schema' 'OpenAI function tool JSON Schema' 'OpenAI function tool JSON Schema'
    L 'OpenAPI spec 全文非 SchemaArtifact' 'Full OpenAPI spec not SchemaArtifact' 'OpenAPI spec 全文は SchemaArtifact ではない'
    L 'SchemaArtifact 子类型边界' 'SchemaArtifact subtype boundary' 'SchemaArtifact サブタイプ境界'
    L 'agent-output-v3 schema 实例' 'agent-output-v3 schema instance' 'agent-output-v3 schema 事例'
)
$DescOverrides['SchemaArtifact'] = @(
    D 'OpenAI function calling tools=[{type:"function", function:{name:"get_weather", parameters:{type:"object", properties:{city:{type:"string"}}}}}] 映射 SchemaArtifact。' 'OpenAI function calling tools=[{type:"function", function:{name:"get_weather", parameters:{type:"object", properties:{city:{type:"string"}}}}}] maps SchemaArtifact.' 'OpenAI function parameters JSON Schema が SchemaArtifact である。'
    D '完整 OpenAPI 3.1 spec YAML 含 paths/servers 是 API 文档，不是单个 agent tool SchemaArtifact。' 'Full OpenAPI 3.1 spec YAML with paths/servers is API documentation, not single agent tool SchemaArtifact.' 'OpenAPI spec 全文は SchemaArtifact ではない。'
    D 'SchemaArtifact 基类；JSONSchemaArtifact/RDFSchemaArtifact/SHACLShapesArtifact 是子类；按 schema 语言分型。' 'SchemaArtifact base class; JSONSchemaArtifact/RDFSchemaArtifact/SHACLShapesArtifact are subtypes; typed by schema language.' 'SchemaArtifact 子类型按 schema 语言分离。'
    D 'SchemaArtifact artifact_id=agent-output-v3、schema_kind=json_schema、validates=agent_final_output。' 'SchemaArtifact artifact_id=agent-output-v3, schema_kind=json_schema, validates=agent_final_output.' 'agent-output-v3 SchemaArtifact を記録する。'
)

$LabelOverrides['JSONSchemaArtifact'] = @(
    L 'OpenAI function parameters schema' 'OpenAI function parameters schema' 'OpenAI function parameters schema'
    L 'JSON 实例数据非 JSONSchemaArtifact' 'JSON instance data not JSONSchemaArtifact' 'JSON インスタンスデータは JSONSchemaArtifact ではない'
    L 'JSONSchema 与 SHACL 边界' 'JSONSchema versus SHACL boundary' 'JSONSchema と SHACL 境界'
    L 'tool-output-v1 JSON Schema 实例' 'tool-output-v1 JSON Schema instance' 'tool-output-v1 JSON Schema 事例'
)
$DescOverrides['JSONSchemaArtifact'] = @(
    D 'OpenAI function parameters: {type:"object", properties:{location:{type:"string"}}, required:["location"]} 映射 JSONSchemaArtifact artifact_id=tool-output-v1。' 'OpenAI function parameters: {type:"object", properties:{location:{type:"string"}}, required:["location"]} maps JSONSchemaArtifact artifact_id=tool-output-v1.' 'OpenAI function parameters が JSONSchemaArtifact である。'
    D 'agent 输出 JSON {"location":"Paris"} 是实例数据 Entity，不是 JSONSchemaArtifact 模式定义。' 'Agent output JSON {"location":"Paris"} is instance data Entity, not JSONSchemaArtifact schema definition.' 'JSON インスタンスは JSONSchemaArtifact ではない。'
    D 'JSONSchemaArtifact 是 JSON Schema 结构；SHACLShapesArtifact 是 SHACL 约束；同一 agent 输出可用 JSON Schema 验证，ontology 用 SHACL。' 'JSONSchemaArtifact is JSON Schema structure; SHACLShapesArtifact is SHACL constraints; same agent output may validate with JSON Schema, ontology with SHACL.' 'JSONSchema と SHACL は別 schema 言語である。'
    D 'JSONSchemaArtifact artifact_id=tool-output-v1、schema_version=draft-2020-12、validates_tool=get_weather。' 'JSONSchemaArtifact artifact_id=tool-output-v1, schema_version=draft-2020-12, validates_tool=get_weather.' 'tool-output-v1 JSONSchemaArtifact を記録する。'
)

$LabelOverrides['RDFSchemaArtifact'] = @(
    L 'W3C RDF Schema 导出' 'W3C RDF Schema export' 'W3C RDF Schema エクスポート'
    L 'JSON-LD @context 片段非完整 RDFS' 'JSON-LD context snippet not full RDFS' 'JSON-LD @context 断片は完全 RDFS ではない'
    L 'RDFSchema 与 JSONSchema 边界' 'RDFSchema versus JSONSchema boundary' 'RDFSchema と JSONSchema 境界'
    L 'rdfs-runtime-v1 导出实例' 'rdfs-runtime-v1 export instance' 'rdfs-runtime-v1 エクスポート事例'
)
$DescOverrides['RDFSchemaArtifact'] = @(
    D 'W3C RDF/RDFS 导出 runtime-plane 类层次：rdfs:Class Execution、rdfs:subClassOf prov:Activity；RDFSchemaArtifact artifact_id=rdfs-runtime-v1、format=ttl。' 'W3C RDF/RDFS export runtime-plane class hierarchy: rdfs:Class Execution, rdfs:subClassOf prov:Activity; RDFSchemaArtifact artifact_id=rdfs-runtime-v1, format=ttl.' 'W3C RDFS 导出が RDFSchemaArtifact である。'
    D 'JSON-LD @context {"Execution":"mw:Execution"} 是 context 片段，不是完整 RDFS ontology 导出 RDFSchemaArtifact。' 'JSON-LD @context {"Execution":"mw:Execution"} is context snippet, not complete RDFS ontology export RDFSchemaArtifact.' '@context 断片は RDFSchemaArtifact ではない。'
    D 'RDFSchemaArtifact 是 RDF/RDFS 结构 schema；JSONSchemaArtifact 是 JSON Schema；ontology 导出与 agent tool schema 分离。' 'RDFSchemaArtifact is RDF/RDFS structure schema; JSONSchemaArtifact is JSON Schema; ontology export separated from agent tool schema.' 'RDFSchema と JSONSchema は分離する。'
    D 'RDFSchemaArtifact artifact_id=rdfs-runtime-v1、format=text/turtle、class_count=73。' 'RDFSchemaArtifact artifact_id=rdfs-runtime-v1, format=text/turtle, class_count=73.' 'rdfs-runtime-v1 RDFSchemaArtifact を記録する。'
)

$LabelOverrides['SHACLShapesArtifact'] = @(
    L 'W3C SHACL shapes 验证工件' 'W3C SHACL shapes validation artifact' 'W3C SHACL shapes 検証 artifact'
    L 'JSON Schema 非 SHACL' 'JSON Schema not SHACL' 'JSON Schema は SHACL ではない'
    L 'SHACL 与 RDFSchema 边界' 'SHACL versus RDFSchema boundary' 'SHACL と RDFSchema 境界'
    L 'runtime-v1 SHACL shapes 实例' 'runtime-v1 SHACL shapes instance' 'runtime-v1 SHACL shapes 事例'
)
$DescOverrides['SHACLShapesArtifact'] = @(
    D 'W3C SHACL shapes 约束 Execution：sh:targetClass mw:Execution；sh:property sh:path mw:execution_id、sh:datatype xsd:string；SHACLShapesArtifact artifact_id=runtime-v1。' 'W3C SHACL shapes constrain Execution: sh:targetClass mw:Execution; sh:property sh:path mw:execution_id, sh:datatype xsd:string; SHACLShapesArtifact artifact_id=runtime-v1.' 'W3C SHACL shapes が SHACLShapesArtifact である。'
    D 'OpenAI function JSON Schema required=[location] 是 JSON Schema 验证，不是 SHACL shapes 约束。' 'OpenAI function JSON Schema required=[location] is JSON Schema validation, not SHACL shapes constraint.' 'JSON Schema は SHACL ではない。'
    D 'SHACLShapesArtifact 是 SHACL 约束；RDFSchemaArtifact 是 RDFS 类层次；validation shapes 与 taxonomy schema 分离。' 'SHACLShapesArtifact is SHACL constraints; RDFSchemaArtifact is RDFS class hierarchy; validation shapes separated from taxonomy schema.' 'SHACL shapes と RDFS taxonomy は分離する。'
    D 'SHACLShapesArtifact artifact_id=runtime-v1、target_class=Execution、constraint_count=12、format=ttl。' 'SHACLShapesArtifact artifact_id=runtime-v1, target_class=Execution, constraint_count=12, format=ttl.' 'runtime-v1 SHACLShapesArtifact を記録する。'
)
