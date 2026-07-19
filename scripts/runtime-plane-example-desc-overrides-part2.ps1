# Part 2: execution-attempts leaf nodes + runtime-observability module nodes
function L($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }
function D($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }

$LabelOverrides['RunAttempt'] = @(
    L 'OpenAI Run in_progress 尝试' 'OpenAI Run in_progress attempt' 'OpenAI Run in_progress 試行'
    L '不可变违反：改写失败尝试' 'Immutability violation rewriting failed attempt' '不変性違反：失敗試行の書き換え'
    L 'RunAttempt 与 RetryActivity 分离' 'RunAttempt versus RetryActivity' 'RunAttempt と RetryActivity 分離'
    L 'OpenAI 第二次 RunAttempt' 'OpenAI second RunAttempt' 'OpenAI 2 回目 RunAttempt'
)
$DescOverrides['RunAttempt'] = @(
    D 'OpenAI runs.retrieve(thread_id, run_id) 返回 status=in_progress、started_at=2026-01-08T12:00:03Z；RunAttempt attempt_number=1、outcome=running 记录首次执行窗口，与 Execution.state 同步。' 'OpenAI runs.retrieve(thread_id, run_id) returns status=in_progress, started_at=2026-01-08T12:00:03Z; RunAttempt attempt_number=1, outcome=running records first execution window synchronized with Execution.state.' 'OpenAI Run in_progress を RunAttempt attempt_number=1 として記録する。'
    D '运维脚本将 RunAttempt attempt_number=1 的 outcome 从 failed UPDATE 为 succeeded；LangGraph fault-tolerance 要求每次 try 为不可变 Activity，应新建 attempt_number=2。' 'Ops script UPDATEs RunAttempt attempt_number=1 outcome from failed to succeeded; LangGraph fault-tolerance requires each try as immutable Activity—create attempt_number=2 instead.' '失敗 RunAttempt を UPDATE せず attempt_number=2 を新規作成する。'
    D 'OpenAI submit_tool_outputs 触发 RetryActivity（重新排队决策）；新 RunAttempt attempt_number=2 记录第二次 in_progress 窗口，RetryActivity 不替代 Attempt 记录。' 'OpenAI submit_tool_outputs triggers RetryActivity (re-queue decision); new RunAttempt attempt_number=2 records second in_progress window; RetryActivity does not replace Attempt record.' 'RetryActivity は判断、RunAttempt は各試行窗口を記録する。'
    D 'Run run_qVYsWok6 在 requires_action 后第二次 in_progress：RunAttempt attempt_id=openai-run-attempt-2、attempt_number=2、started_at=2026-01-08T12:00:05Z、outcome=completed。' 'Run run_qVYsWok6 enters in_progress again after requires_action: RunAttempt attempt_id=openai-run-attempt-2, attempt_number=2, started_at=2026-01-08T12:00:05Z, outcome=completed.' 'requires_action 後の 2 回目 RunAttempt を attempt_number=2 として記録する。'
)

$LabelOverrides['RetryActivity'] = @(
    L 'OpenAI submit_tool_outputs 重试' 'OpenAI submit_tool_outputs retry' 'OpenAI submit_tool_outputs 再試行'
    L 'LangGraph RetryPolicy 内部循环' 'LangGraph RetryPolicy internal loop' 'LangGraph RetryPolicy 内部ループ'
    L 'Temporal signal 与 RetryActivity 边界' 'Temporal signal versus RetryActivity' 'Temporal signal と RetryActivity 境界'
    L 'CrewAI kickoff 失败后重跑' 'CrewAI kickoff retry after failure' 'CrewAI kickoff 失敗後再実行'
)
$DescOverrides['RetryActivity'] = @(
    D 'Run status=requires_action 且 required_action.type=submit_tool_outputs 时，client.beta.threads.runs.submit_tool_outputs(thread_id, run_id, tool_outputs=[{tool_call_id:, output:}]) 创建 RetryActivity。' 'When Run status=requires_action with required_action.type=submit_tool_outputs, client.beta.threads.runs.submit_tool_outputs(thread_id, run_id, tool_outputs) creates RetryActivity.' 'submit_tool_outputs は RetryActivity として工具出力提交を記録する。'
    D 'LangGraph RetryPolicy(max_attempts=3) 在节点失败时自动重试；框架内部循环若无显式 retry 决策记录，不应创建 Moonweave RetryActivity。' 'LangGraph RetryPolicy(max_attempts=3) auto-retries on node failure; internal retry loop without explicit retry decision record should not create Moonweave RetryActivity.' 'LangGraph RetryPolicy の内部ループだけでは RetryActivity を作成しない。'
    D 'Temporal workflow.signal('', payload) 是 Workflow 外部信号；OpenAI submit_tool_outputs 才是 Assistants 栈上可映射的 RetryActivity 证据。' 'Temporal workflow.signal('', payload) is external Workflow signal; OpenAI submit_tool_outputs is mappable RetryActivity evidence on Assistants stack.' 'Temporal signal と OpenAI submit_tool_outputs は異なる Retry 証拠モデルである。'
    D 'Crew.kickoff() 第一次因 tool 超时失败；运维手动第二次 kickoff() 前记录 RetryActivity retry_reason=tool_timeout，随后 RunAttempt attempt_number=2 开始。' 'First Crew.kickoff() fails on tool timeout; before manual second kickoff(), RetryActivity retry_reason=tool_timeout is recorded, then RunAttempt attempt_number=2 starts.' 'Crew.kickoff 失敗後 RetryActivity を記録してから 2 回目 RunAttempt を開始する。'
)

$LabelOverrides['RuntimeBudget'] = @(
    L 'OpenAI Agents max_turns 预算' 'OpenAI Agents max_turns budget' 'OpenAI Agents max_turns 予算'
    L 'max_tokens 单次调用参数' 'max_tokens single-call parameter' 'max_tokens 単一呼び出し参数'
    L 'Temporal WorkflowExecutionTimeout' 'Temporal WorkflowExecutionTimeout' 'Temporal WorkflowExecutionTimeout'
    L 'CrewAI max_iter 预算实例' 'CrewAI max_iter budget instance' 'CrewAI max_iter 予算事例'
)
$DescOverrides['RuntimeBudget'] = @(
    D 'OpenAI Agents SDK Runner.run(agent, max_turns=10) 在启动前写入 RuntimeBudget budget_kind=max_turns、limit=10；超出时抛出 MaxTurnsExceeded。' 'OpenAI Agents SDK Runner.run(agent, max_turns=10) writes RuntimeBudget budget_kind=max_turns, limit=10 before start; exceeding raises MaxTurnsExceeded.' 'Runner.run(max_turns=10) は RuntimeBudget limit=10 を書き、超過時 MaxTurnsExceeded を投げる。'
    D 'OpenAI chat.completions max_tokens=4096 是单次模型调用参数，不是 Execution 级 RuntimeBudget；缺少 budget_kind 与 execution 引用时不建模。' 'OpenAI chat.completions max_tokens=4096 is single-call parameter, not Execution-level RuntimeBudget; without budget_kind and execution reference, do not model.' 'max_tokens=4096 は単一 API 呼び出し参数であり Execution 级 RuntimeBudget ではない。'
    D 'Temporal StartWorkflowOptions.WorkflowExecutionTimeout=30m 是 Workflow 级超时；OpenAI max_turns 是轮次预算；budget_kind 必须区分 workflow_timeout 与 max_turns。' 'Temporal WorkflowExecutionTimeout=30m is workflow-level timeout; OpenAI max_turns is turn budget; budget_kind must distinguish workflow_timeout vs max_turns.' 'Temporal timeout と OpenAI max_turns は budget_kind を分けて RuntimeBudget にマップする。'
    D 'CrewAI Agent(max_iter=15) 在 Crew.kickoff() 前写入 RuntimeBudget budget_kind=max_iterations、limit=15；第 15 次迭代后停止并记录 Execution outcome=completed。' 'CrewAI Agent(max_iter=15) writes RuntimeBudget budget_kind=max_iterations, limit=15 before Crew.kickoff(); stops after iteration 15 with Execution outcome=completed.' 'CrewAI max_iter=15 を RuntimeBudget として kickoff 前に記録する。'
)

# runtime-observability module
$LabelOverrides['runtime-observability'] = @(
    L 'LangGraph + OTel + LangSmith 关联' 'LangGraph OTel LangSmith correlation' 'LangGraph + OTel + LangSmith 相関'
    L 'Arize Phoenix p99 指标' 'Arize Phoenix p99 metric' 'Arize Phoenix p99 メトリック'
    L 'OTel Span.add_event 边界' 'OTel Span.add_event boundary' 'OTel Span.add_event 境界'
    L 'Langfuse trace 导出实例' 'Langfuse trace export instance' 'Langfuse trace エクスポート事例'
)
$DescOverrides['runtime-observability'] = @(
    D 'LangGraph thread_id=thread-1 的 graph.invoke 同时产生 PostgresSaver checkpoint、OTel TracerProvider span 树（trace_id=4bf92f3577b34da6a3ce929d0e0e4736）与 LangSmith parent/child runs；三类证据关联但概念边界保持。' 'LangGraph graph.invoke on thread_id=thread-1 produces PostgresSaver checkpoint, OTel span tree (trace_id=4bf92f3577b34da6a3ce929d0e0e4736), and LangSmith parent/child runs; correlate evidence while preserving concept boundaries.' 'LangGraph checkpoint、OTel span、LangSmith runs を相関しつつ概念境界を保持する。'
    D 'Arize Phoenix 导出 llm_latency_p99=820ms 聚合指标，无 execution_id 或 span_id；这是 ObservableSummary 不是 Execution 或 TraceRecord。' 'Arize Phoenix exports llm_latency_p99=820ms aggregate metric without execution_id or span_id; this is ObservableSummary not Execution or TraceRecord.' 'p99 latency は ObservableSummary であり Execution ではない。'
    D 'OpenTelemetry Span.add_event("checkpoint_saved", attributes={checkpoint_id:"1f070a87..."}) 产生 TraceEvent，必须附着 TraceSpan，不能独立为 ObservabilityRecord 根类型。' 'OpenTelemetry Span.add_event("checkpoint_saved", attributes={checkpoint_id:"1f070a87..."}) produces TraceEvent that must attach to TraceSpan, not stand alone as ObservabilityRecord root.' 'Span.add_event は TraceEvent として Span に付着させる。'
    D 'Langfuse trace langfuse-trace-0192a3b4 含 session_id、嵌套 generation/tool observations；基于 OTel 导出 JSONL，可重建 trace 树但不等同 Execution Activity。' 'Langfuse trace langfuse-trace-0192a3b4 includes session_id and nested generation/tool observations; OTel-based JSONL export reconstructs trace tree without equating to Execution Activity.' 'Langfuse trace は OTel ベースで Execution と同一視しない。'
)

$LabelOverrides['TraceSpan'] = @(
    L 'LangSmith RAG agent span 树' 'LangSmith RAG agent span tree' 'LangSmith RAG agent Span ツリー'
    L 'LangGraph StateSnapshot 非 Span' 'LangGraph StateSnapshot not Span' 'LangGraph StateSnapshot は Span ではない'
    L 'OTel SpanContext 与 Span 边界' 'OTel SpanContext versus Span' 'OTel SpanContext と Span 境界'
    L 'Langfuse llm-call generation span' 'Langfuse llm-call generation span' 'Langfuse llm-call generation span'
)
# TraceSpan descriptions already good - keep detailed versions
$DescOverrides['TraceSpan'] = @(
    D @'
LangSmith 中一次 RAG agent 调用的 trace（LangChain tracing docs）：
- 根 span: "agent.run" (duration: 3.2s)
  - 子 span: "retriever.search" (duration: 0.8s, documents: 5)
  - 子 span: "llm.generate" (duration: 2.1s, model: "gpt-4", tokens: 1500)
  - 子 span: "tool.execute" (duration: 0.3s, tool: "calculator")
'@ @'
LangSmith trace for one RAG agent call (LangChain tracing docs):
- Root span: "agent.run" (duration: 3.2s)
  - Child span: "retriever.search" (duration: 0.8s, documents: 5)
  - Child span: "llm.generate" (duration: 2.1s, model: "gpt-4", tokens: 1500)
  - Child span: "tool.execute" (duration: 0.3s, tool: "calculator")
'@ @'
LangSmith における 1 回の RAG agent 呼び出し trace（LangChain tracing docs）：
- ルート span: "agent.run" (duration: 3.2s)
  - 子 span: "retriever.search" (duration: 0.8s, documents: 5)
  - 子 span: "llm.generate" (duration: 2.1s, model: "gpt-4", tokens: 1500)
  - 子 span: "tool.execute" (duration: 0.3s, tool: "calculator")
'@
    D 'LangGraph graph.get_state(config) 返回 StateSnapshot（values、next、checkpoint_id），这是状态恢复记录，不是带 OTel trace_id/span_id 的 Span 导出。' 'LangGraph graph.get_state(config) returns StateSnapshot (values, next, checkpoint_id); that is state-restore record, not exported Span with OTel trace_id/span_id.' 'LangGraph get_state は StateSnapshot を返し OTel Span エクスポートではない。'
    D 'OpenTelemetry Trace API：SpanContext 含 W3C TraceContext TraceId/SpanId/TraceFlags，由 Tracer.start_span 生成；span.SpanContext() 返回传播标识，不是第二个 Span 操作。' 'OpenTelemetry Trace API: SpanContext holds W3C TraceContext TraceId/SpanId/TraceFlags from Tracer.start_span; span.SpanContext() returns propagation identity, not a second Span operation.' 'SpanContext は Span の不変識別部分であり 2 つ目の Span 操作ではない。'
    D @'
Langfuse JS SDK cookbook 嵌套 observation（langfuse.com/guides/cookbook/js_langfuse_sdk）：
- 根 span: "manual-observation"
  - 子 tool span: "fetch-weather" (asType: tool, city: Paris)
  - 子 generation span: "llm-call" (model: gpt-4, input_tokens: 10, output_tokens: 5)
'@ @'
Langfuse JS SDK cookbook nested observations:
- Root span: "manual-observation"
  - Child tool span: "fetch-weather" (asType: tool, city: Paris)
  - Child generation span: "llm-call" (model: gpt-4, input_tokens: 10, output_tokens: 5)
'@ @'
Langfuse JS SDK cookbook ネスト observation：
- ルート span: "manual-observation"
  - 子 tool span: "fetch-weather" (asType: tool, city: Paris)
  - 子 generation span: "llm-call" (model: gpt-4, input_tokens: 10, output_tokens: 5)
'@
)

$LabelOverrides['TraceRecord'] = @(
    L 'LangSmith trace 树' 'LangSmith trace tree' 'LangSmith trace ツリー'
    L '单个 span 无 trace 容器' 'Single span without trace container' '単一 span に trace 容器なし'
    L 'TraceRecord 与 Execution 边界' 'TraceRecord versus Execution' 'TraceRecord と Execution 境界'
    L 'Langfuse trace 导出' 'Langfuse trace export' 'Langfuse trace エクスポート'
)
$DescOverrides['TraceRecord'] = @(
    D 'LangSmith client.list_runs(project_name=, trace_id=4bf92f3577b34da6a3ce929d0e0e4736) 返回 root run agent.run 与 child runs retriever.search、llm.generate、tool.execute，共享 trace_id。' 'LangSmith client.list_runs(project_name=, trace_id=4bf92f...) returns root run agent.run and child runs retriever.search, llm.generate, tool.execute sharing trace_id.' 'LangSmith list_runs は同一 trace_id 下の root/child runs を返す。'
    D '仅导出单个 span_id=00f067aa0ba902b7 无 trace 级容器与 export scope，不能建模 TraceRecord，应保留 TraceSpan。' 'Exporting only span_id=00f067aa0ba902b7 without trace-level container and export scope cannot model TraceRecord; keep TraceSpan.' '単一 span_id だけでは TraceRecord にならず TraceSpan を保持する。'
    D 'LangSmith trace 报告 Execution timing 与 tool 调用，但不替代 PROV-O Activity；TraceRecord 是观测证据，Execution 是业务 Activity。' 'LangSmith trace reports Execution timing and tool calls but does not replace PROV-O Activity; TraceRecord is observational evidence, Execution is business Activity.' 'trace は Execution を置換する観測証拠である。'
    D 'Langfuse traces.export(trace_id=langfuse-trace-0192a3b4) JSONL 含 session_id 与嵌套 observations，可重建完整 trace 树。' 'Langfuse traces.export(trace_id=langfuse-trace-0192a3b4) JSONL includes session_id and nested observations reconstructing full trace tree.' 'Langfuse export JSONL で trace ツリーを再構築できる。'
)

$LabelOverrides['TraceContext'] = @(
    L 'W3C traceparent 传播' 'W3C traceparent propagation' 'W3C traceparent 伝播'
    L 'Datadog trace_id 单独字段' 'Datadog trace_id field alone' 'Datadog trace_id 単独フィールド'
    L 'TraceContext 与 TraceSpan 边界' 'TraceContext versus TraceSpan' 'TraceContext と TraceSpan 境界'
    L 'OpenTelemetry inject/extract 实例' 'OpenTelemetry inject extract instance' 'OpenTelemetry inject/extract 事例'
)
$DescOverrides['TraceContext'] = @(
    D 'OpenTelemetry propagators.inject(carrier) 写入 W3C traceparent=00-{trace_id}-{span_id}-01；HTTP 下游服务 extract 后继续同一 trace。' 'OpenTelemetry propagators.inject(carrier) writes W3C traceparent=00-{trace_id}-{span_id}-01; downstream HTTP service extract continues same trace.' 'OTel inject/extract で W3C traceparent を HTTP ヘッダに伝播する。'
    D 'Datadog APM 日志仅含 dd.trace_id 无 span_id/trace_flags 完整 SpanContext，不能单独建模 TraceContext。' 'Datadog APM log containing only dd.trace_id without span_id/trace_flags complete SpanContext cannot alone model TraceContext.' 'dd.trace_id だけでは完全 TraceContext にならない。'
    D 'TraceContext 是 TraceSpan 的传播标识部分（part_of）；Tracer.start_span 创建 Span 操作，SpanContext() 返回标识但不等于第二个 Span。' 'TraceContext is propagation identity part_of TraceSpan; Tracer.start_span creates Span operation, SpanContext() returns identity but is not a second Span.' 'TraceContext は TraceSpan の part_of 伝播識別子である。'
    D 'Python OTel：context.attach(set_span_in_context(span)) 后 requests 出站调用 inject traceparent 头 trace_id=4bf92f3577b34da6a3ce929d0e0e4736、span_id=00f067aa0ba902b7。' 'Python OTel: after context.attach(set_span_in_context(span)), outbound requests inject traceparent header trace_id=4bf92f3577b34da6a3ce929d0e0e4736, span_id=00f067aa0ba902b7.' 'Python OTel で traceparent ヘッダに trace_id/span_id を注入する。'
)

$LabelOverrides['TraceLink'] = @(
    L 'OTel Span Link 跨 trace' 'OTel Span Link cross-trace' 'OTel Span Link トレース横断'
    L 'parent_run_id 不是 Link' 'parent_run_id is not Link' 'parent_run_id は Link ではない'
    L 'TraceLink 与 TraceSpan 边界' 'TraceLink versus TraceSpan' 'TraceLink と TraceSpan 境界'
    L '分布式 retriever 子 trace Link' 'Distributed retriever child trace link' '分散 retriever 子 trace Link'
)
$DescOverrides['TraceLink'] = @(
    D 'OpenTelemetry span.add_link(SpanContext(trace_id=aaa..., span_id=bbb...)) 将当前 span 链接到异步 retriever 子 trace，Link 含 trace_state 与 attributes。' 'OpenTelemetry span.add_link(SpanContext(trace_id=aaa..., span_id=bbb...)) links current span to async retriever child trace with trace_state and attributes.' 'OTel add_link で非同期 retriever 子 trace を現在 span にリンクする。'
    D 'LangSmith parent_run_id 表示父子 run 嵌套，是 TraceSpan 层级不是 OTel Span Link；缺少 link context 时不建模 TraceLink。' 'LangSmith parent_run_id denotes parent-child run nesting, TraceSpan hierarchy not OTel Span Link; without link context do not model TraceLink.' 'LangSmith parent_run_id はネストであり OTel Span Link ではない。'
    D 'TraceLink 附着宿主 TraceSpan；单独 trace_id/span_id 对无宿主 span 时保留 TraceContext 而非 TraceLink。' 'TraceLink attaches to host TraceSpan; standalone trace_id/span_id pair without host span keeps TraceContext not TraceLink.' 'TraceLink は宿主 TraceSpan に付着する。'
    D 'RAG 管道中 agent.run span 通过 add_link 关联后台 batch retriever trace（trace_id=c7d8...）；两 trace 异步合流分析 latency。' 'In RAG pipeline, agent.run span add_link associates background batch retriever trace (trace_id=c7d8...); two traces merge asynchronously for latency analysis.' 'RAG で agent.run span が batch retriever trace に Link する。'
)
