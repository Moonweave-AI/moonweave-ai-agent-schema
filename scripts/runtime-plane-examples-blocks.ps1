# Real industry example blocks for runtime-plane nodes.
$ExampleBlocks = @{}

$ExampleBlocks['runtime-artifacts'] = @'
examples:
  - id: runtime-artifacts-positive
    kind: positive
    labels: {zh: A2A 协议 Artifact, en: A2A protocol Artifact, ja: A2A Artifact}
    descriptions:
      zh: "A2A Protocol v0.3 Artifact: artifactId=a1, name=itinerary, parts=[TextPart, DataPart], index=0 (a2a-protocol.org/specification)"
      en: "A2A Protocol v0.3 Artifact with artifactId, name, parts array, and index field."
      ja: "A2A Protocol v0.3 Artifact：artifactId、name、parts、index。"
    field_values: {artifact_id: a2a-itinerary-a1}
    related_node_ids: [Artifact, ExportArtifact, Execution]
    related_relation_ids: []
    expected_result: {zh: 将 A2A Artifact 映射为 PROV-O Entity。, en: Map A2A Artifact to PROV-O Entity., ja: A2A Artifact を PROV-O Entity にマップする。}
    why_valid_or_invalid: {zh: A2A Artifact 是任务可交付物，含 parts 与 index。, en: A2A Artifact is a task deliverable with parts and index., ja: A2A Artifact は task 成果物である。}
    synthetic: false
    source_claims: [claim-runtime-artifacts-entity]
  - id: runtime-artifacts-counterexample
    kind: counterexample
    labels: {zh: Docker 容器 ID, en: Docker container ID, ja: Docker container ID}
    descriptions: {zh: Docker 容器 sha256 标识运行环境，不是稳定 content digest 的输出。, en: Docker container ID identifies runtime environment, not stable content output., ja: Docker コンテナ ID は実行環境識別子である。}
    field_values: {container_id: sha256:abc123}
    related_node_ids: [Container]
    related_relation_ids: []
    expected_result: {zh: 分类为 Container，不是 Artifact。, en: Classify as Container, not Artifact., ja: Container として分類する。}
    why_valid_or_invalid: {zh: Docker 容器是瞬态执行载体。, en: Docker container is a transient execution carrier., ja: Docker コンテナは一時的载体である。}
    synthetic: true
    source_claims: [claim-runtime-artifacts-entity]
  - id: runtime-artifacts-boundary
    kind: boundary
    labels: {zh: LangSmith run.outputs, en: LangSmith run.outputs, ja: LangSmith run.outputs}
    descriptions: {zh: LangSmith run.outputs 是 trace 输出预览；Artifact 需独立 content_digest（docs.langchain.com/langsmith/export-traces）。, en: LangSmith run.outputs is trace preview; Artifact needs content_digest., ja: LangSmith run.outputs は trace プレビューである。}
    field_values: {run_id: 0192a3b4-c5d6-7890-abcd-ef1234567890}
    related_node_ids: [Artifact, TraceRecord]
    related_relation_ids: []
    expected_result: {zh: LangSmith output 为 trace 证据，Artifact 为 Entity。, en: LangSmith output is trace evidence; Artifact is Entity., ja: LangSmith output は trace 証拠である。}
    why_valid_or_invalid: {zh: LangSmith run 是 span 数据，不是 PROV Entity。, en: LangSmith run is span data, not PROV Entity., ja: LangSmith run は span データである。}
    synthetic: false
    source_claims: [claim-runtime-artifacts-entity]
  - id: runtime-artifacts-instance-patch-17
    kind: instance
    labels: {zh: GitHub Actions 构建产物, en: GitHub Actions build artifact, ja: GitHub Actions artifact}
    descriptions: {zh: "GitHub Actions: upload-artifact name=production-build, path=dist/, retention-days=90 (docs.github.com/actions)", en: "GitHub Actions artifact upload with name, path, retention.", ja: GitHub Actions artifact アップロード。}
    field_values: {artifact_id: gh-actions-production-build, content_digest: 'sha256:8b1a9953c4611296a827abf8c47804d78efc4f3c6b4b5c621c6efc72e6c4b0c6'}
    related_node_ids: [ExportArtifact, Execution]
    related_relation_ids: []
    expected_result: {zh: CI 构建产物为可验证 ExportArtifact。, en: CI build output as verifiable ExportArtifact., ja: CI 出力を ExportArtifact としてモデル化する。}
    why_valid_or_invalid: {zh: GitHub Actions artifacts 含 name/path/digest。, en: GitHub Actions artifacts include name/path/digest., ja: GitHub Actions artifacts は digest を含む。}
    synthetic: false
    source_claims: [claim-runtime-artifacts-entity]
'@

$ExampleBlocks['runtime-execution-attempts'] = @'
examples:
  - id: runtime-execution-attempts-positive
    kind: positive
    labels: {zh: OpenAI Run 生命周期, en: OpenAI Run lifecycle, ja: OpenAI Run lifecycle}
    descriptions: {zh: "OpenAI Run run_qVYsWok6OCjHxkajpIrdHuVP: queued to in_progress to completed (openai-cookbook Assistants_API_overview)", en: "OpenAI Run status queued to in_progress to completed.", ja: OpenAI Run 状態遷移 queued から completed。}
    field_values: {execution_id: run-qvy-swok6, started_at: '2026-01-08T12:00:03Z'}
    related_node_ids: [Execution, RunAttempt]
    related_relation_ids: []
    expected_result: {zh: Run 为有时间边界的 Execution。, en: Run as time-bounded Execution., ja: Run を Execution として記録する。}
    why_valid_or_invalid: {zh: OpenAI 定义 Run 异步生命周期（developers.openai.com Assistants deep dive）。, en: OpenAI defines async Run lifecycle., ja: OpenAI は非同期 Run ライフサイクルを定義する。}
    synthetic: false
    source_claims: [claim-runtime-execution-activity]
  - id: runtime-execution-attempts-counterexample
    kind: counterexample
    labels: {zh: 单次 poll queued, en: Single poll on queued, ja: queued を1回 poll}
    descriptions: {zh: 只 poll 一次 Run.status=queued 就当作失败；OpenAI 要求 loop 到终端状态。, en: Poll Run.status once as queued and treat as failure; OpenAI requires loop to terminal state., ja: queued を1回 poll して失敗扱い。}
    field_values: {run_id: run-qvy-swok6, status: queued}
    related_node_ids: [RunAttempt]
    related_relation_ids: []
    expected_result: {zh: queued 不是完成；继续 poll。, en: queued is not completion; continue polling., ja: queued は完了ではない。}
    why_valid_or_invalid: {zh: Run 创建后立即 queued/in_progress。, en: Run returns queued/in_progress immediately., ja: Run は直後 queued/in_progress。}
    synthetic: true
    source_claims: [claim-runtime-execution-activity]
  - id: runtime-execution-attempts-boundary
    kind: boundary
    labels: {zh: max_turns 预算, en: max_turns budget, ja: max_turns 予算}
    descriptions: {zh: OpenAI Agents SDK Runner max_turns=10 是 RuntimeBudget，不是 Activity。, en: OpenAI Agents SDK max_turns=10 is RuntimeBudget not Activity., ja: max_turns=10 は RuntimeBudget。}
    field_values: {max_turns: 10}
    related_node_ids: [RuntimeBudget, Execution]
    related_relation_ids: []
    expected_result: {zh: 存储为 RunAttempt 引用的 RuntimeBudget。, en: Store as RuntimeBudget referenced by RunAttempt., ja: RuntimeBudget として保存する。}
    why_valid_or_invalid: {zh: 预算是约束 Entity，Execution 是 Activity。, en: Budget is constraint Entity; Execution is Activity., ja: 予算は制約 Entity。}
    synthetic: false
    source_claims: [claim-runtime-execution-activity]
  - id: runtime-execution-attempts-instance-attempt-2
    kind: instance
    labels: {zh: requires_action 重试, en: requires_action retry, ja: requires_action 再試行}
    descriptions: {zh: "OpenAI Run requires_action, submit_tool_outputs, then queued/in_progress/completed.", en: "OpenAI Run requires_action then submit_tool_outputs then completes.", ja: requires_action 後 submit_tool_outputs で完了。}
    field_values: {attempt_id: openai-run-attempt-2, execution_id: run-qvy-swok6}
    related_node_ids: [RunAttempt, RetryActivity, Execution]
    related_relation_ids: [RunAttempt-retries-RunAttempt]
    expected_result: {zh: 两次 attempt 独立记录。, en: Two attempts recorded independently., ja: 2 attempt を独立記録する。}
    why_valid_or_invalid: {zh: submit_tool_outputs 使 Run 回到 queued。, en: submit_tool_outputs returns Run to queued., ja: submit_tool_outputs で queued に戻る。}
    synthetic: false
    source_claims: [claim-runtime-execution-activity]
'@

$ExampleBlocks['runtime-observability'] = @'
examples:
  - id: runtime-observability-positive
    kind: positive
    labels: {zh: LangGraph + OTel + LangSmith, en: LangGraph plus OTel plus LangSmith, ja: LangGraph + OTel + LangSmith}
    descriptions: {zh: "LangGraph checkpoint + OTel span tree + LangSmith parent/child runs on thread_id=thread-1.", en: "LangGraph checkpoint, OTel spans, LangSmith runs on one thread.", ja: LangGraph checkpoint、OTel span、LangSmith runs。}
    field_values: {trace_id: 4bf92f3577b34da6a3ce929d0e0e4736, thread_id: thread-1}
    related_node_ids: [TraceRecord, TraceSpan, Checkpoint, StateSnapshot]
    related_relation_ids: []
    expected_result: {zh: 关联证据并保持 span/Checkpoint/Activity 区分。, en: Correlate evidence keeping span, Checkpoint, Activity distinct., ja: 証拠を相関しつつ区別を保持する。}
    why_valid_or_invalid: {zh: OTel 与 LangGraph 描述同一运行不同方面。, en: OTel and LangGraph describe different aspects of one run., ja: OTel と LangGraph は異なる側面を記述する。}
    synthetic: false
    source_claims: [claim-runtime-observability-signals]
  - id: runtime-observability-counterexample
    kind: counterexample
    labels: {zh: p99 延迟指标, en: p99 latency metric, ja: p99 レイテンシ}
    descriptions: {zh: Arize Phoenix p99 latency 无 execution_id，不是 Execution。, en: Arize Phoenix p99 latency without execution_id is not Execution., ja: p99 latency は Execution ではない。}
    field_values: {metric_name: llm_latency_p99}
    related_node_ids: [ObservableSummary]
    related_relation_ids: []
    expected_result: {zh: 分类为 ObservableSummary。, en: Classify as ObservableSummary., ja: ObservableSummary として分類する。}
    why_valid_or_invalid: {zh: OTel Metrics 是聚合信号。, en: OTel Metrics are aggregate signals., ja: OTel Metrics は集約シグナル。}
    synthetic: true
    source_claims: [claim-runtime-observability-signals]
  - id: runtime-observability-boundary
    kind: boundary
    labels: {zh: OTel Span Event, en: OTel Span Event, ja: OTel Span Event}
    descriptions: {zh: OpenTelemetry Span.add_event 产生 TraceEvent，须附着 Span。, en: OpenTelemetry Span.add_event produces TraceEvent attached to Span., ja: Span.add_event は TraceEvent を Span に付着させる。}
    field_values: {event_name: checkpoint_saved}
    related_node_ids: [TraceEvent, TraceSpan, ObservabilityEvent]
    related_relation_ids: []
    expected_result: {zh: 有 span 关联时映射 TraceEvent。, en: Map to TraceEvent with span association., ja: span 関連付けで TraceEvent にマップする。}
    why_valid_or_invalid: {zh: OTel Events 附着于 Span。, en: OTel Events attach to Span., ja: OTel Event は Span に付着する。}
    synthetic: false
    source_claims: [claim-runtime-observability-signals]
  - id: runtime-observability-instance-trace-842
    kind: instance
    labels: {zh: Langfuse trace, en: Langfuse trace, ja: Langfuse trace}
    descriptions: {zh: "Langfuse trace 容器含嵌套 generation/tool observations（langfuse.com/docs/observability/data-model）.", en: "Langfuse trace with nested generation and tool observations.", ja: Langfuse trace とネスト observation。}
    field_values: {trace_id: langfuse-trace-0192a3b4}
    related_node_ids: [TraceRecord, TraceSpan, AgentTranscript]
    related_relation_ids: []
    expected_result: {zh: 重建信号证据不等同 Execution。, en: Reconstruct signals without equating to Execution., ja: Execution と同一視しない。}
    why_valid_or_invalid: {zh: Langfuse 基于 OpenTelemetry。, en: Langfuse is OTel-based., ja: Langfuse は OTel ベース。}
    synthetic: false
    source_claims: [claim-runtime-observability-signals]
'@

$ExampleBlocks['runtime-system'] = @'
examples:
  - id: runtime-system-positive
    kind: positive
    labels: {zh: OpenAI Session, en: OpenAI Session, ja: OpenAI Session}
    descriptions: {zh: "OpenAI Agents SDK Session 跨 Runner.run 持久化历史（openai.github.io/openai-agents-python/sessions/）.", en: "OpenAI Agents SDK Session persists history across Runner.run.", ja: OpenAI Session は run 間で履歴を永続化する。}
    field_values: {session_id: openai-session-support-73}
    related_node_ids: [RuntimeSession, SessionResumeEvent, AgentSystem]
    related_relation_ids: []
    expected_result: {zh: 恢复同一会话。, en: Resume same session., ja: 同一会话を再開する。}
    why_valid_or_invalid: {zh: OpenAI Session 是 run 间持久化层。, en: OpenAI Session is persistence across runs., ja: OpenAI Session は永続化層である。}
    synthetic: false
    source_claims: [claim-runtime-system-session]
  - id: runtime-system-counterexample
    kind: counterexample
    labels: {zh: PID 当作 session, en: PID as session, ja: PID を session とする}
    descriptions: {zh: Linux PID 无 conversation state，不是 RuntimeSession。, en: Linux PID has no conversation state, not RuntimeSession., ja: PID は RuntimeSession ではない。}
    field_values: {pid: 4820}
    related_node_ids: [ProcessHandle]
    related_relation_ids: []
    expected_result: {zh: PID 是 ProcessHandle。, en: PID is ProcessHandle., ja: PID は ProcessHandle。}
    why_valid_or_invalid: {zh: 进程句柄可复用。, en: Process handles are reusable., ja: プロセスハンドルは再利用可能。}
    synthetic: true
    source_claims: [claim-runtime-system-session]
  - id: runtime-system-boundary
    kind: boundary
    labels: {zh: Session 与 Thread, en: Session versus Thread, ja: Session と Thread}
    descriptions: {zh: OpenAI Thread、Agents Session、LangGraph thread_id 不同但可映射 RuntimeSession。, en: OpenAI Thread, Agents Session, LangGraph thread_id differ but map to RuntimeSession., ja: Thread、Session、thread_id は別概念。}
    field_values: {session_id: openai-session-support-73, thread_id: thread_abc}
    related_node_ids: [RuntimeSession, Execution]
    related_relation_ids: []
    expected_result: {zh: 会话连续性与 Execution 分开查询。, en: Session continuity separate from Execution queries., ja: セッションと Execution を分離する。}
    why_valid_or_invalid: {zh: Session 跨 Activity 但不合并 timing。, en: Session scopes state without collapsing timing., ja: Session は timing を統合しない。}
    synthetic: false
    source_claims: [claim-runtime-system-session]
  - id: runtime-system-instance-sess-77
    kind: instance
    labels: {zh: Cursor agent session, en: Cursor agent session, ja: Cursor agent session}
    descriptions: {zh: Cursor IDE agent session 管理多轮对话与 devcontainer 环境。, en: Cursor IDE agent session with multi-turn dialogue and devcontainer., ja: Cursor agent session と devcontainer。}
    field_values: {session_id: cursor-agent-session-77}
    related_node_ids: [RuntimeSession, AgentSystem, Container, Execution]
    related_relation_ids: []
    expected_result: {zh: 区分会话、环境与 Execution。, en: Distinguish session, environment, Execution., ja: セッション、環境、Execution を区別する。}
    why_valid_or_invalid: {zh: Cursor session 是 IDE 运行时容器。, en: Cursor session is IDE runtime container., ja: Cursor session は IDE コンテナ。}
    synthetic: false
    source_claims: [claim-runtime-system-session]
'@

# Actor subtree
$ExampleBlocks['Actor'] = @'
examples:
  - id: actor-positive
    kind: positive
    labels: {zh: PROV-O SoftwareAgent, en: PROV-O SoftwareAgent, ja: PROV-O SoftwareAgent}
    descriptions: {zh: "W3C PROV-O prov:SoftwareAgent 关联到 review Activity（w3.org/TR/prov-o/）.", en: "W3C PROV-O SoftwareAgent associated with review Activity.", ja: PROV-O SoftwareAgent が Activity に関連。}
    field_values: {actor_id: prov-software-agent-review, actor_kind: SoftwareActor}
    related_node_ids: [Actor, SoftwareActor, Execution]
    related_relation_ids: []
    expected_result: {zh: 参与者与 Execution 分开保存。, en: Keep actor separate from Execution., ja: Actor と Execution を分離する。}
    why_valid_or_invalid: {zh: PROV Agent 承担责任，Activity 有时间边界。, en: PROV Agent bears responsibility; Activity is time-bounded., ja: PROV Agent は責任主体。}
    synthetic: false
    source_claims: [claim-actor-boundary]
  - id: actor-counterexample
    kind: counterexample
    labels: {zh: LangSmith span 当 Actor, en: LangSmith span as Actor, ja: LangSmith span を Actor とする}
    descriptions: {zh: LangSmith tool run span 被写入 actor_id；span 是观测不是责任主体。, en: LangSmith tool run span placed in actor_id; span is observation not principal., ja: tool run span は Actor ではない。}
    field_values: {run_id: langsmith-tool-run-1}
    related_node_ids: [TraceSpan]
    related_relation_ids: []
    expected_result: {zh: 拒绝；span 是遥测。, en: Reject; span is telemetry., ja: span はテレメトリー。}
    why_valid_or_invalid: {zh: Span 描述操作不是责任主体。, en: Span describes operation not responsible principal., ja: Span は操作を記述する。}
    synthetic: true
    source_claims: [claim-actor-boundary]
  - id: actor-boundary
    kind: boundary
    labels: {zh: A2A AgentCard 名称, en: A2A AgentCard name, ja: A2A AgentCard 名}
    descriptions: {zh: A2A AgentCard.name 复制到 actor_id；发现文档不是本地身份。, en: A2A AgentCard.name copied to actor_id; discovery doc is not local identity., ja: AgentCard 名は actor_id ではない。}
    field_values: {agent_card_name: reviewer}
    related_node_ids: [A2AAgentCard]
    related_relation_ids: []
    expected_result: {zh: 存储类型化 card 引用。, en: Store typed card reference., ja: 型付き card 参照を保存する。}
    why_valid_or_invalid: {zh: 发现文档与本地身份生命周期不同。, en: Discovery doc and local identity have different lifecycles., ja: ライフサイクルが異なる。}
    synthetic: true
    source_claims: [claim-actor-boundary]
  - id: actor-instance
    kind: instance
    labels: {zh: OpenAI triage agent, en: OpenAI triage agent, ja: OpenAI triage agent}
    descriptions: {zh: "OpenAI Agents SDK triage_agent with handoffs=[booking_agent, refund_agent].", en: "OpenAI Agents SDK triage_agent with handoffs.", ja: OpenAI triage_agent と handoffs。}
    field_values: {actor_id: openai-triage-agent, actor_kind: SoftwareActor}
    related_node_ids: [Actor, AgentActor, Execution]
    related_relation_ids: []
    expected_result: {zh: 多次 Execution 归因同一 Actor。, en: Multiple Executions attribute to one Actor., ja: 複数 Execution を同一 Actor に帰属。}
    why_valid_or_invalid: {zh: OpenAI Agent 是配置原语，Actor 是本地投影。, en: OpenAI Agent is config primitive; Actor is local projection., ja: OpenAI Agent は設定プリミティブ。}
    synthetic: false
    source_claims: [claim-actor-boundary]
'@

$ExampleBlocks['AgentActor'] = @'
examples:
  - id: agent-actor-positive
    kind: positive
    labels: {zh: OpenAI Weather Agent, en: OpenAI Weather Agent, ja: OpenAI Weather Agent}
    descriptions: {zh: "OpenAI Agents SDK Agent(name=Weather Agent, instructions=..., tools=[get_weather]).", en: "OpenAI Agents SDK Weather Agent with instructions and tools.", ja: OpenAI Weather Agent 定義。}
    field_values: {actor_id: openai-weather-agent, actor_kind: SoftwareActor, runtime_configuration_ref: 'cfg:weather-v1'}
    related_node_ids: [AgentActor, Execution]
    related_relation_ids: []
    expected_result: {zh: Execution 归因本地 AgentActor。, en: Attribute executions to local AgentActor., ja: Execution を AgentActor に帰属。}
    why_valid_or_invalid: {zh: SDK Agent 与 Moonweave AgentActor 分离。, en: SDK Agent separate from Moonweave AgentActor., ja: SDK Agent と AgentActor は分離。}
    synthetic: false
    source_claims: [claim-agent-actor-sdk, claim-local-runtime-identity]
  - id: agent-actor-counterexample
    kind: counterexample
    labels: {zh: AgentCard 当身份, en: AgentCard as identity, ja: AgentCard を identity とする}
    descriptions: {zh: AgentCard skills/interfaces 复制到 actor_id。, en: AgentCard skills/interfaces copied into actor_id., ja: AgentCard フィールドを actor_id に複製。}
    field_values: {actor_id: agent-reviewer-2, agent_card_name: reviewer}
    related_node_ids: [AgentActor, A2AAgentCard]
    related_relation_ids: [AgentActor-has-A2AAgentCardReference]
    expected_result: {zh: 拒绝；保留类型化引用。, en: Reject; retain typed reference., ja: 型付き参照のみ保持。}
    why_valid_or_invalid: {zh: 发现文档可撤销。, en: Discovery document can be withdrawn., ja: 発見文書は撤回され得る。}
    synthetic: true
    source_claims: [claim-a2a-card-boundary]
  - id: agent-actor-boundary
    kind: boundary
    labels: {zh: MCP client 连接, en: MCP client connection, ja: MCP client 接続}
    descriptions: {zh: MCP client 连接 tool server 不是 AgentActor。, en: MCP client connection to tool server is not AgentActor., ja: MCP client 接続は AgentActor ではない。}
    field_values: {mcp_server_url: 'https://tools.example/mcp', actor_id: openai-weather-agent}
    related_node_ids: [AgentActor, ToolServiceActor]
    related_relation_ids: []
    expected_result: {zh: MCP 为连接边界，Agent 责任在 actor_id。, en: MCP is connection boundary; agent responsibility on actor_id., ja: MCP は接続境界。}
    why_valid_or_invalid: {zh: MCP 定义 host-client-server 架构。, en: MCP defines host-client-server architecture., ja: MCP は host-client-server。}
    synthetic: true
    source_claims: [claim-mcp-boundary]
  - id: agent-actor-instance-agent-reviewer-2
    kind: instance
    labels: {zh: CrewAI journalist agent, en: CrewAI journalist agent, ja: CrewAI journalist agent}
    descriptions: {zh: "CrewAI Agent(role=Investigative Journalist, tools=[SerperDevTool()]).", en: "CrewAI Investigative Journalist agent with SerperDevTool.", ja: CrewAI Investigative Journalist agent。}
    field_values: {actor_id: crewai-journalist, actor_kind: SoftwareActor, runtime_configuration_ref: 'cfg:crewai-journalist-v1'}
    related_node_ids: [AgentActor, Execution]
    related_relation_ids: []
    expected_result: {zh: 多次 Execution 归因同一责任主体。, en: Multiple executions attribute to one responsible party., ja: 複数実行を同一主体に帰属。}
    why_valid_or_invalid: {zh: CrewAI Agent 是 persona 配置；AgentActor 是本地身份。, en: CrewAI Agent is persona config; AgentActor is local identity., ja: CrewAI Agent は persona 設定。}
    synthetic: false
    source_claims: [claim-agent-actor-sdk]
'@

$ExampleBlocks['Execution'] = @'
examples:
  - id: execution-positive
    kind: positive
    labels: {zh: OpenAI Assistants Run, en: OpenAI Assistants Run, ja: OpenAI Assistants Run}
    descriptions: {zh: "OpenAI Run on Thread: queued to in_progress to completed with run steps.", en: "OpenAI Assistants Run lifecycle with run steps.", ja: OpenAI Run ライフサイクル。}
    field_values: {execution_id: run-qvy-swok6, state: completed, started_at: '2026-01-08T12:00:03Z', ended_at: '2026-01-08T12:00:06Z'}
    related_node_ids: [Execution, RunAttempt]
    related_relation_ids: []
    expected_result: {zh: 记录为 PROV Activity。, en: Record as PROV Activity., ja: PROV Activity として記録する。}
    why_valid_or_invalid: {zh: OpenAI Run 有时间边界与状态。, en: OpenAI Run has time boundary and status., ja: OpenAI Run は時間境界を持つ。}
    synthetic: false
    source_claims: [claim-execution-activity]
  - id: execution-counterexample
    kind: counterexample
    labels: {zh: 已批准计划, en: Approved plan, ja: 承認済み計画}
    descriptions: {zh: 规划器批准步骤但无 session/attempt/timestamp。, en: Planner approves steps but no session, attempt, or timestamp., ja: 計画のみで実行なし。}
    field_values: {plan_id: plan-42}
    related_node_ids: []
    related_relation_ids: []
    expected_result: {zh: 不要创建 Execution。, en: Do not create Execution., ja: Execution を作成しない。}
    why_valid_or_invalid: {zh: PROV Plan 不是 Activity。, en: PROV Plan is not Activity., ja: PROV Plan は Activity ではない。}
    synthetic: true
    source_claims: [claim-execution-task-separation]
  - id: execution-boundary
    kind: boundary
    labels: {zh: Execution 与 span, en: Execution and span, ja: Execution と span}
    descriptions: {zh: LangSmith llm/tool child runs 是 span，不是完整 agent Execution。, en: LangSmith llm/tool child runs are spans, not full agent Execution., ja: LangSmith child runs は span。}
    field_values: {execution_id: run-qvy-swok6}
    related_node_ids: [Execution, TraceSpan]
    related_relation_ids: []
    expected_result: {zh: 业务 Execution 与可观测子操作分开。, en: Separate business Execution from observability suboperations., ja: Execution と span を分離する。}
    why_valid_or_invalid: {zh: Span 是 trace 中一个操作。, en: Span is one operation in trace., ja: Span は1操作。}
    synthetic: false
    source_claims: [claim-execution-activity]
  - id: execution-instance-exec-842
    kind: instance
    labels: {zh: LangGraph invoke, en: LangGraph invoke, ja: LangGraph invoke}
    descriptions: {zh: "LangGraph graph.invoke with thread_id=thread-1 produces checkpoint and step events.", en: "LangGraph graph.invoke with thread_id produces checkpoint and steps.", ja: LangGraph invoke と checkpoint。}
    field_values: {execution_id: langgraph-thread-1-run, state: completed, started_at: '2026-08-03T20:28:43Z', ended_at: '2026-08-03T20:28:46Z'}
    related_node_ids: [Execution, RunAttempt, Checkpoint, TraceRecord]
    related_relation_ids: []
    expected_result: {zh: 一致执行历史保留 plan/attempt/telemetry 边界。, en: Coherent execution history with boundaries preserved., ja: 境界を保持した実行履歴。}
    why_valid_or_invalid: {zh: LangGraph 每 super-step 写 checkpoint。, en: LangGraph writes checkpoint each super-step., ja: LangGraph は super-step ごとに checkpoint。}
    synthetic: false
    source_claims: [claim-execution-activity]
'@

$ExampleBlocks['RuntimeSession'] = @'
examples:
  - id: runtime-session-positive
    kind: positive
    labels: {zh: OpenAI Session 历史, en: OpenAI Session history, ja: OpenAI Session 履歴}
    descriptions: {zh: "OpenAI Agents SDK Session 在 run 前加载历史、run 后追加 items.", en: "OpenAI Agents SDK Session loads history before run and appends after.", ja: OpenAI Session は run 前後で履歴を管理する。}
    field_values: {session_id: openai-session-support-73, system_id: support-agent-prod, store_ref: session-store/sqlite}
    related_node_ids: [RuntimeSession, AgentSystem, SessionStartEvent]
    related_relation_ids: [RuntimeSession-part-of-AgentSystem]
    expected_result: {zh: 跨 run 保留对话上下文。, en: Retain conversation context across runs., ja: run 間でコンテキストを保持する。}
    why_valid_or_invalid: {zh: OpenAI Sessions docs 定义持久化行为。, en: OpenAI Sessions docs define persistence behavior., ja: OpenAI Sessions が永続化を定義する。}
    synthetic: false
    source_claims: [claim-runtime-session-history]
  - id: runtime-session-counterexample
    kind: counterexample
    labels: {zh: OpenAI Thread ID  alone, en: OpenAI Thread ID alone, ja: OpenAI Thread ID のみ}
    descriptions: {zh: Assistants Thread ID 无 store_ref/lifecycle 不是完整 RuntimeSession 记录。, en: Assistants Thread ID without store_ref is incomplete RuntimeSession record., ja: Thread ID のみでは不十分。}
    field_values: {thread_id: thread_abc}
    related_node_ids: []
    related_relation_ids: []
    expected_result: {zh: Thread 可引用但需 Session 包装。, en: Thread may be referenced but needs Session wrapper., ja: Thread は Session で包装する。}
    why_valid_or_invalid: {zh: Thread 是对话容器，Session 是 Moonweave 会话记录。, en: Thread is conversation container; Session is Moonweave session record., ja: Thread と Session は別概念。}
    synthetic: true
    source_claims: [claim-runtime-session-history]
  - id: runtime-session-boundary
    kind: boundary
    labels: {zh: Session 与 Execution, en: Session versus Execution, ja: Session と Execution}
    descriptions: {zh: OpenAI Session 跨多次 Run；每次 Run 是独立 Execution。, en: OpenAI Session spans multiple Runs; each Run is separate Execution., ja: Session は複数 Run を包含する。}
    field_values: {session_id: openai-session-support-73}
    related_node_ids: [RuntimeSession, Execution]
    related_relation_ids: []
    expected_result: {zh: 会话连续性与 Execution 分开。, en: Session continuity separate from Execution., ja: セッションと Execution を分離する。}
    why_valid_or_invalid: {zh: Session 限定状态不合并 timing。, en: Session scopes state without collapsing timing., ja: timing を統合しない。}
    synthetic: false
    source_claims: [claim-runtime-session-history]
  - id: runtime-session-instance-session-73
    kind: instance
    labels: {zh: LangGraph thread-1 session, en: LangGraph thread-1 session, ja: LangGraph thread-1 session}
    descriptions: {zh: "LangGraph thread_id=thread-1 with PostgresSaver backend and resume after interrupt.", en: "LangGraph thread_id=thread-1 with PostgresSaver and resume.", ja: LangGraph thread-1 と PostgresSaver。}
    field_values: {session_id: langgraph-thread-1, system_id: support-agent-prod, store_ref: checkpointer/postgres}
    related_node_ids: [RuntimeSession, AgentSystem, SessionResumeEvent, Checkpoint]
    related_relation_ids: [RuntimeSession-part-of-AgentSystem]
    expected_result: {zh: 暂停后历史仍可标识。, en: History remains identifiable after pause., ja: 停止後も履歴は識別可能。}
    why_valid_or_invalid: {zh: LangGraph thread 是 checkpoint 序列键。, en: LangGraph thread is checkpoint sequence key., ja: LangGraph thread は checkpoint キー。}
    synthetic: false
    source_claims: [claim-runtime-session-history]
'@

$ExampleBlocks['Checkpoint'] = @'
examples:
  - id: checkpoint-positive
    kind: positive
    labels: {zh: LangGraph CheckpointSaver, en: LangGraph CheckpointSaver, ja: LangGraph CheckpointSaver}
    descriptions: {zh: "LangGraph checkpointer.put stores checkpoint_id, channel_values (docs.langchain.com/langgraph/persistence).", en: "LangGraph checkpointer.put stores checkpoint_id and channel_values.", ja: LangGraph checkpointer.put。}
    field_values: {checkpoint_id: 1f070a87-33b3-6d36-8001-50c306580336, thread_id: thread-1}
    related_node_ids: [Checkpoint, StateSnapshot, StateRecord]
    related_relation_ids: []
    expected_result: {zh: 持久化图状态快照。, en: Persist graph state snapshot., ja: グラフ状態を永続化する。}
    why_valid_or_invalid: {zh: LangGraph checkpoint 是 super-step 快照。, en: LangGraph checkpoint is super-step snapshot., ja: LangGraph checkpoint は super-step スナップショット。}
    synthetic: false
    source_claims: [claim-langgraph-checkpoint]
  - id: checkpoint-counterexample
    kind: counterexample
    labels: {zh: OTel trace 当 checkpoint, en: OTel trace as checkpoint, ja: OTel trace を checkpoint とする}
    descriptions: {zh: OTel trace export 无 channel_values/next，不是 LangGraph Checkpoint。, en: OTel trace export lacks channel_values/next, not LangGraph Checkpoint., ja: OTel trace は Checkpoint ではない。}
    field_values: {trace_id: 4bf92f3577b34da6a3ce929d0e0e4736}
    related_node_ids: [TraceRecord]
    related_relation_ids: []
    expected_result: {zh: trace 是 TraceRecord，不是 Checkpoint。, en: Trace is TraceRecord not Checkpoint., ja: trace は TraceRecord。}
    why_valid_or_invalid: {zh: OTel 与 LangGraph 状态模型不同。, en: OTel and LangGraph state models differ., ja: 状態モデルが異なる。}
    synthetic: true
    source_claims: [claim-langgraph-checkpoint]
  - id: checkpoint-boundary
    kind: boundary
    labels: {zh: Checkpoint 与 StateSnapshot, en: Checkpoint versus StateSnapshot, ja: Checkpoint と StateSnapshot}
    descriptions: {zh: LangGraph Checkpoint tuple 与 graph.get_state StateSnapshot 相关但角色不同。, en: LangGraph Checkpoint tuple related to StateSnapshot but different roles., ja: Checkpoint tuple と StateSnapshot。}
    field_values: {checkpoint_id: 1f070a87-33b3-6d36-8001-50c306580336}
    related_node_ids: [Checkpoint, StateSnapshot]
    related_relation_ids: []
    expected_result: {zh: 分别保留存储 tuple 与查询 snapshot。, en: Keep storage tuple and query snapshot separate., ja: tuple と snapshot を分離する。}
    why_valid_or_invalid: {zh: LangGraph 区分 put tuple 与 get_state view。, en: LangGraph distinguishes put tuple from get_state view., ja: put と get_state は別役割。}
    synthetic: false
    source_claims: [claim-langgraph-checkpoint]
  - id: checkpoint-instance-cp-18
    kind: instance
    labels: {zh: PostgresSaver checkpoint, en: PostgresSaver checkpoint, ja: PostgresSaver checkpoint}
    descriptions: {zh: "LangGraph PostgresSaver persists thread_id checkpoint with pending writes.", en: "LangGraph PostgresSaver persists thread checkpoint with pending writes.", ja: PostgresSaver checkpoint。}
    field_values: {checkpoint_id: 1f070a87-33b3-6d36-8001-50c306580336, thread_id: thread-1}
    related_node_ids: [Checkpoint, RestoreActivity]
    related_relation_ids: []
    expected_result: {zh: 故障后可从 checkpoint 恢复。, en: Recover from checkpoint after failure., ja: checkpoint から復旧可能。}
    why_valid_or_invalid: {zh: PostgresSaver 支持持久化与 HITL resume。, en: PostgresSaver supports persistence and HITL resume., ja: PostgresSaver は永続化を支持する。}
    synthetic: false
    source_claims: [claim-langgraph-checkpoint]
'@

$ExampleBlocks['Artifact'] = @'
examples:
  - id: artifact-positive
    kind: positive
    labels: {zh: A2A Artifact parts, en: A2A Artifact parts, ja: A2A Artifact parts}
    descriptions: {zh: "A2A Artifact with artifactId, name, parts TextPart+FilePart (a2a-protocol.org).", en: "A2A Artifact with artifactId, name, and multimodal parts.", ja: A2A Artifact と parts。}
    field_values: {artifact_id: a2a-report-a1, media_type: text/plain, content_digest: 'sha256:8b1a9953c4611296a827abf8c47804d78efc4f3c6b4b5c621c6efc72e6c4b0c6'}
    related_node_ids: [Artifact, Execution]
    related_relation_ids: [Artifact-generated_by-Execution]
    expected_result: {zh: 独立检索验证的 Entity。, en: Independently retrievable verifiable Entity., ja: 独立取得可能な Entity。}
    why_valid_or_invalid: {zh: A2A Artifact 是任务输出 Entity。, en: A2A Artifact is task output Entity., ja: A2A Artifact は task 出力。}
    synthetic: false
    source_claims: [claim-artifact-entity]
  - id: artifact-counterexample
    kind: counterexample
    labels: {zh: 进程句柄, en: Process handle, ja: プロセスハンドル}
    descriptions: {zh: PID 指向 worker 无稳定内容输出。, en: PID points to worker without stable content output., ja: PID は安定出力を持たない。}
    field_values: {pid: 4820}
    related_node_ids: [ProcessHandle]
    related_relation_ids: []
    expected_result: {zh: 分类为 ProcessHandle。, en: Classify as ProcessHandle., ja: ProcessHandle として分類。}
    why_valid_or_invalid: {zh: 句柄可复用。, en: Handle may be reused., ja: ハンドルは再利用可能。}
    synthetic: true
    source_claims: [claim-artifact-entity]
  - id: artifact-boundary
    kind: boundary
    labels: {zh: span event 与 Artifact, en: Span event versus Artifact, ja: span event と Artifact}
    descriptions: {zh: OTel span event artifact_uploaded 报告上传；内容在 Artifact 记录。, en: OTel span event reports upload; content in Artifact record., ja: span event は証拠、内容は Artifact。}
    field_values: {artifact_id: a2a-report-a1}
    related_node_ids: [Artifact, TraceEvent]
    related_relation_ids: []
    expected_result: {zh: event 为证据，Artifact 为 Entity。, en: Event as evidence; Artifact as Entity., ja: event と Artifact を分離。}
    why_valid_or_invalid: {zh: 遥测描述发生，Artifact 是输出。, en: Telemetry describes occurrence; Artifact is output., ja: テレメトリーと Entity は別。}
    synthetic: true
    source_claims: [claim-artifact-entity]
  - id: artifact-instance-report-22
    kind: instance
    labels: {zh: OpenAI message output, en: OpenAI message output, ja: OpenAI message output}
    descriptions: {zh: "OpenAI Assistants Messages API 返回 assistant message 文本作为 run 输出 Artifact.", en: "OpenAI Assistants Messages API assistant message text as run output Artifact.", ja: OpenAI assistant message を Artifact として。}
    field_values: {artifact_id: openai-message-output-22, media_type: text/plain}
    related_node_ids: [Artifact, Execution, TraceSpan]
    related_relation_ids: [Artifact-generated_by-Execution]
    expected_result: {zh: 输出来源链接到 Run 而非 span。, en: Link output provenance to Run not span., ja: 出力プロヴナンスを Run にリンク。}
    why_valid_or_invalid: {zh: Message 是 Run 产物；span 仅报告生成。, en: Message is Run product; span only reports generation., ja: Message は Run 产物。}
    synthetic: false
    source_claims: [claim-artifact-entity]
'@

$ExampleBlocks['TraceRecord'] = @'
examples:
  - id: trace-record-positive
    kind: positive
    labels: {zh: LangSmith trace tree, en: LangSmith trace tree, ja: LangSmith trace tree}
    descriptions: {zh: "LangSmith trace 含 root run 与 child runs（retriever, llm, tool）.", en: "LangSmith trace with root and child runs.", ja: LangSmith root/child runs。}
    field_values: {trace_id: 4bf92f3577b34da6a3ce929d0e0e4736, record_id: langsmith-trace-root}
    related_node_ids: [TraceRecord, TraceSpan]
    related_relation_ids: []
    expected_result: {zh: 分组同一 trace_id 下所有 span。, en: Group all spans under trace_id., ja: trace_id 下の span をグループ化。}
    why_valid_or_invalid: {zh: LangSmith trace 对应 OTel trace。, en: LangSmith trace maps to OTel trace., ja: LangSmith trace は OTel trace。}
    synthetic: false
    source_claims: [claim-otel-trace-record]
  - id: trace-record-counterexample
    kind: counterexample
    labels: {zh: 单个 span, en: Single span, ja: 単一 span}
    descriptions: {zh: 只有一个 span 无 trace 容器不是 TraceRecord。, en: One span without trace container is not TraceRecord., ja: 単一 span は TraceRecord ではない。}
    field_values: {span_id: 00f067aa0ba902b7}
    related_node_ids: [TraceSpan]
    related_relation_ids: []
    expected_result: {zh: 保留 TraceSpan。, en: Keep TraceSpan., ja: TraceSpan を保持。}
    why_valid_or_invalid: {zh: TraceRecord 是 trace 级集合。, en: TraceRecord is trace-level collection., ja: TraceRecord は trace レベル集合。}
    synthetic: true
    source_claims: [claim-otel-trace-record]
  - id: trace-record-boundary
    kind: boundary
    labels: {zh: TraceRecord 与 Execution, en: TraceRecord versus Execution, ja: TraceRecord と Execution}
    descriptions: {zh: LangSmith trace 报告 Execution 不替代 Execution。, en: LangSmith trace reports Execution without replacing it., ja: trace は Execution を置換しない。}
    field_values: {trace_id: 4bf92f3577b34da6a3ce929d0e0e4736}
    related_node_ids: [TraceRecord, Execution]
    related_relation_ids: []
    expected_result: {zh: 遥测与 Activity 分开。, en: Keep telemetry and Activity separate., ja: テレメトリーと Activity を分離。}
    why_valid_or_invalid: {zh: Trace 是观测证据。, en: Trace is observational evidence., ja: trace は観測証拠。}
    synthetic: false
    source_claims: [claim-otel-trace-record]
  - id: trace-record-instance-trace-900
    kind: instance
    labels: {zh: Langfuse trace export, en: Langfuse trace export, ja: Langfuse trace export}
    descriptions: {zh: "Langfuse trace 含 session_id 与嵌套 observations.", en: "Langfuse trace with session_id and nested observations.", ja: Langfuse trace export。}
    field_values: {trace_id: langfuse-trace-0192a3b4, record_id: langfuse-trace-root}
    related_node_ids: [TraceRecord, TraceSpan, AgentTranscript]
    related_relation_ids: []
    expected_result: {zh: 可重建完整 trace 树。, en: Reconstruct full trace tree., ja: trace ツリーを再構築可能。}
    why_valid_or_invalid: {zh: Langfuse trace 基于 OTel。, en: Langfuse trace is OTel-based., ja: Langfuse は OTel ベース。}
    synthetic: false
    source_claims: [claim-otel-trace-record]
'@
