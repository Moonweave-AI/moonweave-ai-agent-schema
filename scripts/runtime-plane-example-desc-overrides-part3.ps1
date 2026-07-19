# Part 3: LangGraph checkpoint/state + observability events/records
function L($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }
function D($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }

$LabelOverrides['Checkpoint'] = @(
    L 'LangGraph CheckpointSaver.put' 'LangGraph CheckpointSaver.put' 'LangGraph CheckpointSaver.put'
    L 'OTel trace 非 Checkpoint' 'OTel trace not Checkpoint' 'OTel trace は Checkpoint ではない'
    L 'Checkpoint 与 StateSnapshot 边界' 'Checkpoint versus StateSnapshot' 'Checkpoint と StateSnapshot 境界'
    L 'PostgresSaver checkpoint 实例' 'PostgresSaver checkpoint instance' 'PostgresSaver checkpoint 事例'
)
$DescOverrides['Checkpoint'] = @(
    D 'LangGraph checkpointer.put(config, checkpoint, metadata, new_versions) 持久化 checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336、channel_values 与 pending_writes（docs.langchain.com/langgraph/persistence）。' 'LangGraph checkpointer.put(config, checkpoint, metadata, new_versions) persists checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336, channel_values, and pending_writes.' 'LangGraph checkpointer.put が checkpoint_id と channel_values を永続化する。'
    D 'OTel trace export JSON 含 trace_id/span 树但无 channel_values/next/checkpoint tuple，不是 LangGraph Checkpoint。' 'OTel trace export JSON has trace_id/span tree but no channel_values/next/checkpoint tuple, not LangGraph Checkpoint.' 'OTel trace は LangGraph Checkpoint ではない。'
    D 'Checkpoint 是存储 tuple；graph.get_state 返回 StateSnapshot 查询视图；put tuple 与 get_state view 角色不同。' 'Checkpoint is storage tuple; graph.get_state returns StateSnapshot query view; put tuple and get_state view have different roles.' 'Checkpoint tuple と StateSnapshot クエリ view は役割が異なる。'
    D 'LangGraph PostgresSaver 在 thread_id=thread-1 super-step 后写入 checkpoint，含 pending_writes 支持 HITL interrupt 后 resume。' 'LangGraph PostgresSaver writes checkpoint after super-step on thread_id=thread-1 with pending_writes supporting HITL interrupt resume.' 'PostgresSaver checkpoint は HITL resume を支持する。'
)

$LabelOverrides['StateSnapshot'] = @(
    L 'LangGraph graph.get_state' 'LangGraph graph.get_state' 'LangGraph graph.get_state'
    L 'Run.status 非 StateSnapshot' 'Run.status not StateSnapshot' 'Run.status は StateSnapshot ではない'
    L 'StateSnapshot 与 Checkpoint 边界' 'StateSnapshot versus Checkpoint' 'StateSnapshot と Checkpoint 境界'
    L 'thread-1 StateSnapshot 实例' 'thread-1 StateSnapshot instance' 'thread-1 StateSnapshot 事例'
)
$DescOverrides['StateSnapshot'] = @(
    D 'LangGraph graph.get_state(config={configurable:{thread_id:thread-1}}) 返回 StateSnapshot：values={messages:[...]}, next=("agent",), checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336。' 'LangGraph graph.get_state(config={configurable:{thread_id:thread-1}}) returns StateSnapshot: values={messages:[...]}, next=("agent",), checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336.' 'graph.get_state は values/next/checkpoint_id を返す StateSnapshot である。'
    D 'OpenAI runs.retrieve 返回 Run.status=in_progress 是 Execution 生命周期字段，不是 LangGraph StateSnapshot values/next。' 'OpenAI runs.retrieve returning Run.status=in_progress is Execution lifecycle field, not LangGraph StateSnapshot values/next.' 'Run.status は Execution ライフサイクルであり StateSnapshot ではない。'
    D 'StateSnapshot 是查询投影；Checkpoint tuple 是持久化存储；同一 checkpoint_id 可对应 Snapshot 视图与存储记录。' 'StateSnapshot is query projection; Checkpoint tuple is persistent storage; same checkpoint_id can have Snapshot view and storage record.' 'StateSnapshot はクエリ投影、Checkpoint は永続 tuple である。'
    D 'LangGraph time-travel：get_state(config, checkpoint_id=1f070a87...) 读取历史 super-step 的 values 与 next 指针用于 replay。' 'LangGraph time-travel: get_state(config, checkpoint_id=1f070a87...) reads historical super-step values and next pointer for replay.' 'time-travel get_state で歴史 super-step の values/next を読む。'
)

$LabelOverrides['StateDiff'] = @(
    L 'LangGraph 通道增量更新' 'LangGraph channel incremental update' 'LangGraph チャネル増分更新'
    L 'Git diff 非 StateDiff' 'Git diff not StateDiff' 'Git diff は StateDiff ではない'
    L 'StateDiff 与 StateSnapshot 边界' 'StateDiff versus StateSnapshot' 'StateDiff と StateSnapshot 境界'
    L 'messages 通道 diff 实例' 'messages channel diff instance' 'messages チャネル diff 事例'
)
$DescOverrides['StateDiff'] = @(
    D 'LangGraph 节点更新 messages 通道：StateDiff channel=messages、before_len=3、after_len=5、added_message_ids=[msg-4,msg-5]。' 'LangGraph node updates messages channel: StateDiff channel=messages, before_len=3, after_len=5, added_message_ids=[msg-4,msg-5].' 'LangGraph messages チャネル更新を StateDiff として記録する。'
    D 'GitHub PR unified diff 是 PatchArtifact 文本差异，不是 LangGraph runtime StateDiff channel 更新。' 'GitHub PR unified diff is PatchArtifact text diff, not LangGraph runtime StateDiff channel update.' 'Git PR diff は PatchArtifact であり StateDiff ではない。'
    D 'StateDiff 记录通道级 delta；StateSnapshot 是完整 values/next 视图；diff 可重建 snapshot 但不替代 snapshot 记录。' 'StateDiff records channel-level delta; StateSnapshot is full values/next view; diff can reconstruct snapshot but does not replace snapshot record.' 'StateDiff は delta、StateSnapshot は完全 view である。'
    D 'super-step N→N+1：StateDiff checkpoint_id=1f070a87...、channel=agent_state、patch={approved:true}。' 'super-step N→N+1: StateDiff checkpoint_id=1f070a87..., channel=agent_state, patch={approved:true}.' 'super-step 間の agent_state パッチを StateDiff として記録する。'
)

$LabelOverrides['StateRecord'] = @(
    L 'LangGraph channel_values 持久化' 'LangGraph channel_values persistence' 'LangGraph channel_values 永続化'
    L 'Span attributes 非 StateRecord' 'Span attributes not StateRecord' 'Span attributes は StateRecord ではない'
    L 'StateRecord 与 Checkpoint 边界' 'StateRecord versus Checkpoint' 'StateRecord と Checkpoint 境界'
    L 'Postgres 通道值记录实例' 'Postgres channel values record instance' 'Postgres チャネル値記録事例'
)
$DescOverrides['StateRecord'] = @(
    D 'LangGraph checkpointer 将 channel_values={messages, agent_state} 写入 StateRecord record_id=state-18，关联 checkpoint_id 与 thread_id=thread-1。' 'LangGraph checkpointer writes channel_values={messages, agent_state} to StateRecord record_id=state-18 linked to checkpoint_id and thread_id=thread-1.' 'checkpointer が channel_values を StateRecord として永続化する。'
    D 'OTel span attributes tool.output 是 TraceSpan 级属性，不是 LangGraph StateRecord channel_values 持久化。' 'OTel span attributes tool.output are TraceSpan-level attributes, not LangGraph StateRecord channel_values persistence.' 'Span attributes は TraceSpan 级であり StateRecord ではない。'
    D 'StateRecord 持久化通道值；Checkpoint 是版本化 tuple 含 metadata/new_versions；两者相关但 record_kind 不同。' 'StateRecord persists channel values; Checkpoint is versioned tuple with metadata/new_versions; related but different record_kind.' 'StateRecord と Checkpoint は record_kind が異なる。'
    D 'PostgresSaver 表 checkpoints 行 id=state-18 存 JSONB channel_values，供 get_state 与 replay 读取。' 'PostgresSaver checkpoints table row id=state-18 stores JSONB channel_values for get_state and replay reads.' 'PostgresSaver JSONB channel_values 行を StateRecord として読む。'
)

$LabelOverrides['ObservabilityRecord'] = @(
    L 'LangSmith trace JSONL 导出' 'LangSmith trace JSONL export' 'LangSmith trace JSONL エクスポート'
    L '单条 log line 非 ObservabilityRecord' 'Single log line not ObservabilityRecord' '単一 log line は ObservabilityRecord ではない'
    L 'ObservabilityRecord 与 Execution 边界' 'ObservabilityRecord versus Execution' 'ObservabilityRecord と Execution 境界'
    L 'LangSmith export run 501 实例' 'LangSmith export run 501 instance' 'LangSmith export run 501 事例'
)
$DescOverrides['ObservabilityRecord'] = @(
    D 'LangSmith client.export_runs(project_name=, run_type=) 输出 JSONL，每行含 run_id、trace_id、parent_run_id、inputs/outputs 与 latency_ms。' 'LangSmith client.export_runs(project_name=, run_type=) outputs JSONL with run_id, trace_id, parent_run_id, inputs/outputs, latency_ms per line.' 'LangSmith export_runs JSONL 各行が ObservabilityRecord 投影である。'
    D 'stdout 单行 {"level":"info","msg":"done"} 无 record_kind/recorded_at/trace 结构，不是 ObservabilityRecord。' 'stdout single line {"level":"info","msg":"done"} lacks record_kind/recorded_at/trace structure, not ObservabilityRecord.' '単一 stdout log line は ObservabilityRecord にならない。'
    D 'ObservabilityRecord 持久化观测投影（span/trace/transcript）；Execution 是 PROV Activity；telemetry 关联但不替代 Activity。' 'ObservabilityRecord persists observability projection (span/trace/transcript); Execution is PROV Activity; telemetry correlates but does not replace Activity.' 'ObservabilityRecord は投影、Execution は Activity である。'
    D 'LangSmith export 行 record_id=langsmith-export-501、trace_id=4bf92f3577b34da6a3ce929d0e0e4736、recorded_at=2026-01-15T10:00:05Z。' 'LangSmith export line record_id=langsmith-export-501, trace_id=4bf92f3577b34da6a3ce929d0e0e4736, recorded_at=2026-01-15T10:00:05Z.' 'LangSmith export 行 501 を ObservabilityRecord として保存する。'
)

$LabelOverrides['ObservabilityEvent'] = @(
    L 'Langfuse observation 事件基类' 'Langfuse observation event base' 'Langfuse observation イベント基底'
    L '项目命名解析超时失败' 'Project-named parse timeout failure' 'プロジェクト名付き解析タイムアウト失敗'
    L 'OTel Log Record 非 ObservabilityEvent' 'OTel Log Record not ObservabilityEvent' 'OTel Log Record は ObservabilityEvent ではない'
    L '领域事件与 OTel Span Event 边界' 'Domain event versus OTel Span Event boundary' '領域イベントと OTel Span Event 境界'
    L 'obs-event-61 checkpoint.restored 实例' 'obs-event-61 checkpoint.restored instance' 'obs-event-61 checkpoint.restored 事例'
)
$DescOverrides['ObservabilityEvent'] = @(
    D 'Langfuse observation.create(type=, name=) 产生 ObservabilityEvent 基类记录，可特化为 TraceEvent/TelemetryEvent 子类型。' 'Langfuse observation.create(type=, name=) produces ObservabilityEvent base record specializing to TraceEvent/TelemetryEvent subtypes.' 'Langfuse observation.create が ObservabilityEvent 基底を生成する。'
    D 'Moonweave 项目命名失败通知 phase.parse.timeout：ObservabilityEvent event_name=phase.parse.timeout、source_run_ref=run-19、result_code=PARSE_TIMEOUT、diagnostic_evidence_ref=record-parse-timeout-19。' 'Moonweave project-named failure notification phase.parse.timeout: ObservabilityEvent event_name=phase.parse.timeout, source_run_ref=run-19, result_code=PARSE_TIMEOUT, diagnostic_evidence_ref=record-parse-timeout-19.' 'phase.parse.timeout 失敗通知 ObservabilityEvent を記録する。'
    D 'OpenTelemetry Logs Data Model Log Record 含 Resource/InstrumentationScope/Body/trace context，不是 Moonweave 自定义 ObservabilityEvent domain event。' 'OpenTelemetry Logs Data Model Log Record with Resource/InstrumentationScope/Body/trace context is not Moonweave custom ObservabilityEvent domain event.' 'OTel Log Record は ObservabilityEvent ではない。'
    D 'ObservabilityEvent 自定义 replay.started 可与 TraceEvent 关联；仅 TraceEvent 是附着 TraceSpan 的 OTel Span Event。' 'ObservabilityEvent custom replay.started may correlate with TraceEvent; only TraceEvent is OTel Span Event attached to TraceSpan.' 'replay.started ObservabilityEvent と TraceEvent は関連するが OTel Span Event は TraceEvent のみ。'
    D 'ObservabilityEvent event_id=obs-event-61、event_name=checkpoint.restored、occurred_at=2026-07-18T09:20:01Z、subject_ref=restore-op-44，关联 Checkpoint 与 RestoreActivity。' 'ObservabilityEvent event_id=obs-event-61, event_name=checkpoint.restored, occurred_at=2026-07-18T09:20:01Z, subject_ref=restore-op-44, linked to Checkpoint and RestoreActivity.' 'obs-event-61 checkpoint.restored ObservabilityEvent を記録する。'
)

$LabelOverrides['TraceEvent'] = @(
    L 'OTel Span.add_event tool.output' 'OTel Span.add_event tool.output' 'OTel Span.add_event tool.output'
    L 'OpenAI Run step 非 TraceEvent' 'OpenAI Run step not TraceEvent' 'OpenAI Run step は TraceEvent ではない'
    L 'TraceEvent 与 TraceSpan 边界' 'TraceEvent versus TraceSpan' 'TraceEvent と TraceSpan 境界'
    L 'checkpoint_saved 事件实例' 'checkpoint_saved event instance' 'checkpoint_saved イベント事例'
)
$DescOverrides['TraceEvent'] = @(
    D 'OpenTelemetry span.add_event("tool.output", attributes={"tool.name":"read_file","bytes":4096}) 在 TraceSpan 上产生 TraceEvent，含 event timestamp 与 attributes。' 'OpenTelemetry span.add_event("tool.output", attributes={"tool.name":"read_file","bytes":4096}) produces TraceEvent on TraceSpan with event timestamp and attributes.' 'Span.add_event tool.output が TraceSpan 上の TraceEvent を生成する。'
    D 'OpenAI runs.steps.list step.type=tool_calls 是 Assistants Run Step 领域对象，不是 OTel Span.add_event TraceEvent。' 'OpenAI runs.steps.list step.type=tool_calls is Assistants Run Step domain object, not OTel Span.add_event TraceEvent.' 'OpenAI Run Step は OTel TraceEvent ではない。'
    D 'TraceEvent 附着宿主 TraceSpan；无 span_id 的独立日志行不是 TraceEvent。' 'TraceEvent attaches to host TraceSpan; standalone log line without span_id is not TraceEvent.' 'TraceEvent は宿主 TraceSpan に付着する。'
    D 'LangGraph checkpointer.put 后 OTel span.add_event("checkpoint_saved", attributes={checkpoint_id:"1f070a87..."}) 记录 checkpoint_saved TraceEvent。' 'After LangGraph checkpointer.put, OTel span.add_event("checkpoint_saved", attributes={checkpoint_id:"1f070a87..."}) records checkpoint_saved TraceEvent.' 'checkpointer.put 後 checkpoint_saved TraceEvent を記録する。'
)

$LabelOverrides['TelemetryEvent'] = @(
    L 'OTel metrics 导出批次' 'OTel metrics export batch' 'OTel metrics エクスポートバッチ'
    L 'LangSmith run latency 非 TelemetryEvent' 'LangSmith run latency not TelemetryEvent' 'LangSmith run latency は TelemetryEvent ではない'
    L 'TelemetryEvent 与 TraceEvent 边界' 'TelemetryEvent versus TraceEvent' 'TelemetryEvent と TraceEvent 境界'
    L 'agent_loop_turns 指标事件' 'agent_loop_turns metric event' 'agent_loop_turns メトリックイベント'
)
$DescOverrides['TelemetryEvent'] = @(
    D 'OpenTelemetry PeriodicExportingMetricReader 导出 OTLP metrics batch：metric agent_loop_turns、value=8、labels={service.name:"support-agent"}。' 'OpenTelemetry PeriodicExportingMetricReader exports OTLP metrics batch: metric agent_loop_turns, value=8, labels={service.name:"support-agent"}.' 'OTel metrics export batch が TelemetryEvent である。'
    D 'LangSmith run.latency_ms 是 TraceSpan/RunTree 属性，不是 OTel Metrics SDK TelemetryEvent 导出批次。' 'LangSmith run.latency_ms is TraceSpan/RunTree attribute, not OTel Metrics SDK TelemetryEvent export batch.' 'LangSmith latency は Trace 属性であり TelemetryEvent ではない。'
    D 'TelemetryEvent 承载 metrics 信号；TraceEvent 承载 span 内事件；同一运行可同时产生两者但 record_kind 不同。' 'TelemetryEvent carries metrics signal; TraceEvent carries in-span events; same run can produce both with different record_kind.' 'TelemetryEvent と TraceEvent は record_kind が異なる。'
    D 'Datadog Agent OTLP intake 收到 gauge agent.token_usage_total=1500 在 2026-01-15T10:00:12Z 作为 TelemetryEvent 批次成员。' 'Datadog Agent OTLP intake receives gauge agent.token_usage_total=1500 at 2026-01-15T10:00:12Z as TelemetryEvent batch member.' 'Datadog OTLP gauge を TelemetryEvent として記録する。'
)

$LabelOverrides['ReplayEvent'] = @(
    L 'LangGraph time-travel replay' 'LangGraph time-travel replay' 'LangGraph time-travel replay'
    L 'LangSmith playground 非 ReplayEvent' 'LangSmith playground not ReplayEvent' 'LangSmith playground は ReplayEvent ではない'
    L 'ReplayEvent 与 ReplayActivity 边界' 'ReplayEvent versus ReplayActivity' 'ReplayEvent と ReplayActivity 境界'
    L 'checkpoint 历史 replay 实例' 'checkpoint history replay instance' 'checkpoint 履歴 replay 事例'
)
$DescOverrides['ReplayEvent'] = @(
    D 'LangGraph graph.invoke(None, config={"configurable":{"thread_id":"thread-1","checkpoint_id":"1f070a87..."}}) time-travel 产生 ReplayEvent，重放历史 super-step 状态。' 'LangGraph graph.invoke(None, config={"configurable":{"thread_id":"thread-1","checkpoint_id":"1f070a87..."}}) time-travel produces ReplayEvent replaying historical super-step state.' 'LangGraph time-travel invoke が ReplayEvent を生成する。'
    D 'LangSmith playground 重跑 prompt 无 checkpoint_id/thread 证据，不是 LangGraph ReplayEvent。' 'LangSmith playground re-run prompt lacks checkpoint_id/thread evidence, not LangGraph ReplayEvent.' 'LangSmith playground は ReplayEvent ではない。'
    D 'ReplayEvent 是观测到的 replay 发生事件；ReplayActivity 是 PROV Activity 执行 replay 操作；事件记录 occurrence，Activity 记录 work。' 'ReplayEvent is observed replay occurrence event; ReplayActivity is PROV Activity performing replay; event records occurrence, Activity records work.' 'ReplayEvent は occurrence、ReplayActivity は Activity である。'
    D 'ReplayEvent event_id=replay-65、checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336、thread_id=thread-1、replayed_at=2026-01-15T11:00:00Z。' 'ReplayEvent event_id=replay-65, checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336, thread_id=thread-1, replayed_at=2026-01-15T11:00:00Z.' 'ReplayEvent replay-65 を checkpoint 履歴 replay として記録する。'
)

$LabelOverrides['CheckpointRestoreEvent'] = @(
    L 'LangGraph interrupt 后 resume' 'LangGraph interrupt resume' 'LangGraph interrupt 後 resume'
    L 'Pod restart 非 CheckpointRestoreEvent' 'Pod restart not CheckpointRestoreEvent' 'Pod restart は CheckpointRestoreEvent ではない'
    L 'RestoreEvent 与 RestoreActivity 边界' 'RestoreEvent versus RestoreActivity' 'RestoreEvent と RestoreActivity 境界'
    L 'HITL approve 后 restore 实例' 'HITL approve restore instance' 'HITL approve 後 restore 事例'
)
$DescOverrides['CheckpointRestoreEvent'] = @(
    D 'LangGraph interrupt 后 graph.invoke(resume_command, config={configurable:{thread_id:thread-1}}) 从 checkpoint 恢复，产生 CheckpointRestoreEvent checkpoint_id=1f070a87...。' 'After LangGraph interrupt, graph.invoke(resume_command, config={configurable:{thread_id:thread-1}}) restores from checkpoint producing CheckpointRestoreEvent checkpoint_id=1f070a87....' 'LangGraph resume が CheckpointRestoreEvent を生成する。'
    D 'Kubernetes Pod container restart 是 RuntimeEnvironment/Container 生命周期，不是 LangGraph CheckpointRestoreEvent。' 'Kubernetes Pod container restart is RuntimeEnvironment/Container lifecycle, not LangGraph CheckpointRestoreEvent.' 'K8s Pod restart は CheckpointRestoreEvent ではない。'
    D 'CheckpointRestoreEvent 记录 restore 发生；RestoreActivity 是执行 restore 的 Activity；事件与 Activity 分开保存。' 'CheckpointRestoreEvent records restore occurrence; RestoreActivity is Activity performing restore; save event and Activity separately.' 'RestoreEvent と RestoreActivity は分離保存する。'
    D 'HITL approve 后 CheckpointRestoreEvent event_id=restore-61、thread_id=thread-1、restored_checkpoint_id=1f070a87...、restored_at=2026-01-15T10:30:00Z。' 'After HITL approve, CheckpointRestoreEvent event_id=restore-61, thread_id=thread-1, restored_checkpoint_id=1f070a87..., restored_at=2026-01-15T10:30:00Z.' 'HITL approve 後 restore-61 CheckpointRestoreEvent を記録する。'
)

$LabelOverrides['CheckpointLifecycleActivity'] = @(
    L 'LangGraph CheckpointSaver 生命周期' 'LangGraph CheckpointSaver lifecycle' 'LangGraph CheckpointSaver ライフサイクル'
    L 'S3 backup 非 CheckpointLifecycleActivity' 'S3 backup not CheckpointLifecycleActivity' 'S3 backup は CheckpointLifecycleActivity ではない'
    L 'Capture 与 Restore Activity 边界' 'Capture versus Restore Activity boundary' 'Capture と Restore Activity 境界'
    L 'PostgresSaver put/get 周期' 'PostgresSaver put get cycle' 'PostgresSaver put/get 周期'
)
$DescOverrides['CheckpointLifecycleActivity'] = @(
    D 'LangGraph CheckpointSaver 对 thread_id=thread-1 执行 put/get 周期：CheckpointCaptureActivity 写 checkpoint，RestoreActivity 读 get_state 恢复。' 'LangGraph CheckpointSaver put/get cycle on thread_id=thread-1: CheckpointCaptureActivity writes checkpoint, RestoreActivity reads get_state restore.' 'CheckpointSaver put/get 周期が CheckpointLifecycleActivity である。'
    D 'AWS S3 备份 LangGraph DB 是运维备份 Activity，不是 CheckpointSaver put/get 生命周期 Activity。' 'AWS S3 backup of LangGraph DB is ops backup Activity, not CheckpointSaver put/get lifecycle Activity.' 'S3 DB 备份は CheckpointLifecycleActivity ではない。'
    D 'CheckpointLifecycleActivity 分组 capture/restore/replay；CheckpointCaptureActivity 与 RestoreActivity 是子 Activity 类型，不可合并为单一 span。' 'CheckpointLifecycleActivity groups capture/restore/replay; CheckpointCaptureActivity and RestoreActivity are child Activity types, not merged into single span.' 'Capture/Restore は子 Activity として分離する。'
    D 'PostgresSaver 在 super-step 边界：CheckpointCaptureActivity activity_id=cp-life-31 put checkpoint_id=1f070a87...；随后 RestoreActivity get_state。' 'PostgresSaver at super-step boundary: CheckpointCaptureActivity activity_id=cp-life-31 put checkpoint_id=1f070a87...; then RestoreActivity get_state.' 'PostgresSaver super-step 境界で capture/restore 周期を記録する。'
)

$LabelOverrides['CheckpointCaptureActivity'] = @(
    L 'LangGraph checkpointer.put 捕获' 'LangGraph checkpointer.put capture' 'LangGraph checkpointer.put キャプチャ'
    L '手动 JSON 快照非 CaptureActivity' 'Manual JSON snapshot not CaptureActivity' '手動 JSON スナップショットは CaptureActivity ではない'
    L 'Capture 与 StateSnapshot 边界' 'Capture versus StateSnapshot boundary' 'Capture と StateSnapshot 境界'
    L 'super-step checkpoint 捕获实例' 'super-step checkpoint capture instance' 'super-step checkpoint キャプチャ事例'
)
$DescOverrides['CheckpointCaptureActivity'] = @(
    D 'LangGraph checkpointer.put(config, checkpoint, metadata, new_versions) 在 super-step 结束捕获 CheckpointCaptureActivity，写入 checkpoint_id 与 channel_values。' 'LangGraph checkpointer.put(config, checkpoint, metadata, new_versions) at super-step end captures CheckpointCaptureActivity writing checkpoint_id and channel_values.' 'checkpointer.put が CheckpointCaptureActivity として super-step checkpoint を捕獲する。'
    D '开发者手动 json.dump(state) 到 /tmp/snap.json 无 checkpointer.put metadata/new_versions，不是 CheckpointCaptureActivity。' 'Developer manual json.dump(state) to /tmp/snap.json without checkpointer.put metadata/new_versions is not CheckpointCaptureActivity.' '手動 json.dump は CheckpointCaptureActivity ではない。'
    D 'CheckpointCaptureActivity 是写 checkpoint 的 Activity；StateSnapshot 是 get_state 读视图；capture 写、snapshot 读。' 'CheckpointCaptureActivity is Activity writing checkpoint; StateSnapshot is get_state read view; capture writes, snapshot reads.' 'Capture は書込 Activity、Snapshot は読取 view である。'
    D 'CheckpointCaptureActivity activity_id=cp-capture-31、checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336、thread_id=thread-1、captured_at=2026-01-15T10:00:01Z。' 'CheckpointCaptureActivity activity_id=cp-capture-31, checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336, thread_id=thread-1, captured_at=2026-01-15T10:00:01Z.' 'cp-capture-31 が super-step checkpoint を捕獲する。'
)

$LabelOverrides['RestoreActivity'] = @(
    L 'LangGraph graph.get_state 恢复' 'LangGraph graph.get_state restore' 'LangGraph graph.get_state 復元'
    L 'OpenAI Thread 加载非 RestoreActivity' 'OpenAI Thread load not RestoreActivity' 'OpenAI Thread 読込は RestoreActivity ではない'
    L 'Restore 与 Replay 边界' 'Restore versus Replay boundary' 'Restore と Replay 境界'
    L 'interrupt 后 get_state 实例' 'get_state after interrupt instance' 'interrupt 後 get_state 事例'
)
$DescOverrides['RestoreActivity'] = @(
    D 'LangGraph graph.get_state(config={configurable:{thread_id:thread-1}}) 在 interrupt 后 RestoreActivity 读取 checkpoint values/next 准备 resume。' 'LangGraph graph.get_state(config={configurable:{thread_id:thread-1}}) after interrupt RestoreActivity reads checkpoint values/next preparing resume.' 'interrupt 後 get_state が RestoreActivity として checkpoint を読む。'
    D 'OpenAI client.beta.threads.messages.list(thread_id) 加载对话历史是 RuntimeSession 操作，不是 LangGraph RestoreActivity。' 'OpenAI client.beta.threads.messages.list(thread_id) loading conversation history is RuntimeSession operation, not LangGraph RestoreActivity.' 'OpenAI Thread messages.list は RuntimeSession 操作である。'
    D 'RestoreActivity 读取 checkpoint 恢复执行上下文；ReplayActivity 重放历史 super-step；restore 继续，replay 重演。' 'RestoreActivity reads checkpoint restoring execution context; ReplayActivity replays historical super-step; restore continues, replay re-enacts.' 'Restore は継続、Replay は再演である。'
    D 'RestoreActivity activity_id=restore-44、checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336、thread_id=thread-1、restored_at=2026-01-15T10:20:00Z。' 'RestoreActivity activity_id=restore-44, checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336, thread_id=thread-1, restored_at=2026-01-15T10:20:00Z.' 'restore-44 が interrupt 後 checkpoint を復元する。'
)

$LabelOverrides['ReplayActivity'] = @(
    L 'LangGraph time-travel replay Activity' 'LangGraph time-travel replay Activity' 'LangGraph time-travel replay Activity'
    L '单元测试 mock 非 ReplayActivity' 'Unit test mock not ReplayActivity' 'ユニットテスト mock は ReplayActivity ではない'
    L 'Replay 与 Restore 边界' 'Replay versus Restore boundary' 'Replay と Restore 境界'
    L '历史 checkpoint replay 实例' 'Historical checkpoint replay instance' '履歴 checkpoint replay 事例'
)
$DescOverrides['ReplayActivity'] = @(
    D 'LangGraph graph.invoke(None, config={"configurable":{"thread_id":"thread-1","checkpoint_id":"1f070a87..."}}) time-travel ReplayActivity 重放历史 super-step 而非继续 forward。' 'LangGraph graph.invoke(None, config={"configurable":{"thread_id":"thread-1","checkpoint_id":"1f070a87..."}}) time-travel ReplayActivity re-enacts historical super-step rather than continuing forward.' 'time-travel invoke が ReplayActivity として歴史 super-step を再演する。'
    D 'pytest mock graph.invoke 无 checkpoint_id/thread 生产证据，不是 ReplayActivity。' 'pytest mock graph.invoke without checkpoint_id/thread production evidence is not ReplayActivity.' 'pytest mock は ReplayActivity ではない。'
    D 'ReplayActivity 重放历史；RestoreActivity 从 checkpoint 继续 forward；replay 用 checkpoint_id 定位历史点。' 'ReplayActivity re-enacts history; RestoreActivity continues forward from checkpoint; replay uses checkpoint_id to locate historical point.' 'Replay は再演、Restore は forward 継続である。'
    D 'ReplayActivity activity_id=replay-45、checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336、thread_id=thread-1、replayed_at=2026-01-15T11:05:00Z。' 'ReplayActivity activity_id=replay-45, checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336, thread_id=thread-1, replayed_at=2026-01-15T11:05:00Z.' 'replay-45 が履歴 checkpoint を replay する。'
)

$LabelOverrides['ObservableSummary'] = @(
    L 'Arize Phoenix LLM p99 摘要' 'Arize Phoenix LLM p99 summary' 'Arize Phoenix LLM p99 サマリー'
    L '单次 span latency 非 Summary' 'Single span latency not Summary' '単一 span latency は Summary ではない'
    L 'Summary 与 TraceRecord 边界' 'Summary versus TraceRecord boundary' 'Summary と TraceRecord 境界'
    L 'support-agent p99 实例' 'support-agent p99 instance' 'support-agent p99 事例'
)
$DescOverrides['ObservableSummary'] = @(
    D 'Arize Phoenix export_project 生成 ObservableSummary：metric=llm_latency_p99、value_ms=820、window=24h、service=support-agent。' 'Arize Phoenix export_project generates ObservableSummary: metric=llm_latency_p99, value_ms=820, window=24h, service=support-agent.' 'Arize Phoenix p99 が ObservableSummary である。'
    D 'LangSmith 单 run latency_ms=820 是 TraceSpan 属性，不是跨 run 聚合 ObservableSummary。' 'LangSmith single run latency_ms=820 is TraceSpan attribute, not cross-run aggregate ObservableSummary.' '単一 run latency は TraceSpan 属性である。'
    D 'ObservableSummary 是聚合统计；TraceRecord 是单次 trace 导出；metrics 与 traces 信号分离。' 'ObservableSummary is aggregate statistic; TraceRecord is single trace export; metrics and traces signals separated.' 'Summary は集計、TraceRecord は単一 trace である。'
    D 'ObservableSummary summary_id=obs-70、metric_name=llm_latency_p99、value=820、unit=ms、computed_at=2026-01-15T12:00:00Z。' 'ObservableSummary summary_id=obs-70, metric_name=llm_latency_p99, value=820, unit=ms, computed_at=2026-01-15T12:00:00Z.' 'obs-70 p99 サマリーを記録する。'
)

$LabelOverrides['AuditRecord'] = @(
    L 'OpenAI 组织审计日志' 'OpenAI organization audit log' 'OpenAI 組織監査ログ'
    L 'TraceSpan 非 AuditRecord' 'TraceSpan not AuditRecord' 'TraceSpan は AuditRecord ではない'
    L 'Audit 与 AgentTranscript 边界' 'Audit versus AgentTranscript boundary' 'Audit と AgentTranscript 境界'
    L 'API key 轮换审计实例' 'API key rotation audit instance' 'API key ローテーション監査事例'
)
$DescOverrides['AuditRecord'] = @(
    D 'OpenAI 组织 audit log export 含 event=api_key.created、actor=admin@corp.com、resource=sk-...、timestamp=2026-01-15T09:00:00Z。' 'OpenAI organization audit log export includes event=api_key.created, actor=admin@corp.com, resource=sk-..., timestamp=2026-01-15T09:00:00Z.' 'OpenAI audit log export が AuditRecord である。'
    D 'OTel TraceSpan name=agent.tool_call 是操作追踪，不是组织级 AuditRecord 合规日志。' 'OTel TraceSpan name=agent.tool_call is operation trace, not organization-level AuditRecord compliance log.' 'TraceSpan は AuditRecord ではない。'
    D 'AuditRecord 记录管理/合规事件；AgentTranscript 记录对话内容；audit 不含完整 message body。' 'AuditRecord records admin/compliance events; AgentTranscript records conversation content; audit excludes full message body.' 'Audit は管理イベント、Transcript は対話内容である。'
    D 'AuditRecord audit_id=audit-301、event_type=api_key.rotated、actor_id=admin@corp.com、recorded_at=2026-01-15T09:30:00Z。' 'AuditRecord audit_id=audit-301, event_type=api_key.rotated, actor_id=admin@corp.com, recorded_at=2026-01-15T09:30:00Z.' 'audit-301 API key ローテーション監査を記録する。'
)

$LabelOverrides['AgentTranscript'] = @(
    L 'OpenAI Thread Messages 列表' 'OpenAI Thread Messages list' 'OpenAI Thread Messages 一覧'
    L 'LangSmith run.inputs 非 Transcript' 'LangSmith run.inputs not Transcript' 'LangSmith run.inputs は Transcript ではない'
    L 'Transcript 与 TraceSpan 边界' 'Transcript versus TraceSpan boundary' 'Transcript と TraceSpan 境界'
    L 'support thread 18 条消息实例' 'support thread 18 messages instance' 'support thread 18 メッセージ事例'
)
$DescOverrides['AgentTranscript'] = @(
    D 'OpenAI client.beta.threads.messages.list(thread_id=, order="asc") 返回 role=user/assistant 消息序列，AgentTranscript transcript_id=transcript-18、message_count=18。' 'OpenAI client.beta.threads.messages.list(thread_id=, order="asc") returns role=user/assistant message sequence, AgentTranscript transcript_id=transcript-18, message_count=18.' 'OpenAI messages.list が AgentTranscript 対話転写である。'
    D 'LangSmith run.inputs={"query":"..."} 是 trace 输入预览，不是完整 Thread Messages AgentTranscript。' 'LangSmith run.inputs={"query":"..."} is trace input preview, not full Thread Messages AgentTranscript.' 'LangSmith run.inputs は Transcript ではない。'
    D 'AgentTranscript 持久化对话条目；TraceSpan 记录操作 timing；transcript 内容不等于 span attributes。' 'AgentTranscript persists dialogue items; TraceSpan records operation timing; transcript content is not span attributes.' 'Transcript は対話、TraceSpan は操作 timing である。'
    D 'AgentTranscript transcript_id=transcript-18、thread_id=thread_abc、message_count=18、last_message_at=2026-01-15T10:15:00Z。' 'AgentTranscript transcript_id=transcript-18, thread_id=thread_abc, message_count=18, last_message_at=2026-01-15T10:15:00Z.' 'transcript-18 に 18 件メッセージを記録する。'
)

$LabelOverrides['TraceRetentionPolicy'] = @(
    L 'LangSmith 项目 trace 保留' 'LangSmith project trace retention' 'LangSmith プロジェクト trace 保持'
    L 'Execution 超时非 RetentionPolicy' 'Execution timeout not RetentionPolicy' 'Execution timeout は RetentionPolicy ではない'
    L 'Retention 与 RuntimeBudget 边界' 'Retention versus RuntimeBudget boundary' 'Retention と RuntimeBudget 境界'
    L '7 天保留策略实例' '7-day retention policy instance' '7 日保持ポリシー事例'
)
$DescOverrides['TraceRetentionPolicy'] = @(
    D 'LangSmith project settings trace_ttl_days=7 定义 TraceRetentionPolicy policy_id=langsmith-7d、retention_days=7、scope=project:support-agent。' 'LangSmith project settings trace_ttl_days=7 defines TraceRetentionPolicy policy_id=langsmith-7d, retention_days=7, scope=project:support-agent.' 'LangSmith trace_ttl_days=7 が TraceRetentionPolicy である。'
    D 'OpenAI Run max_completion_tokens 是单次生成预算，不是 trace 保留 TraceRetentionPolicy。' 'OpenAI Run max_completion_tokens is single-generation budget, not trace retention TraceRetentionPolicy.' 'max_completion_tokens は RetentionPolicy ではない。'
    D 'TraceRetentionPolicy 控制 observability 数据 TTL；RuntimeBudget 控制 execution 资源；策略对象与运行时预算分离。' 'TraceRetentionPolicy controls observability data TTL; RuntimeBudget controls execution resources; policy object separated from runtime budget.' 'Retention は TTL、RuntimeBudget は実行资源である。'
    D 'TraceRetentionPolicy policy_id=retention-90、retention_days=90、applies_to=trace_exports、effective_at=2026-01-01T00:00:00Z。' 'TraceRetentionPolicy policy_id=retention-90, retention_days=90, applies_to=trace_exports, effective_at=2026-01-01T00:00:00Z.' 'retention-90 90 日 trace 保持ポリシーを記録する。'
)
