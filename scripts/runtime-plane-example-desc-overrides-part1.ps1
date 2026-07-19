# Unique real-case descriptions and labels for runtime-plane examples (4 per node).
$DescOverrides = @{}
$LabelOverrides = @{}

function L($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }
function D($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }

# runtime-plane
$LabelOverrides['runtime-plane'] = @(
    L 'OpenAI Assistants Run 完整运行时证据' 'OpenAI Assistants Run full runtime evidence' 'OpenAI Assistants Run 完全ランタイム証拠'
    L 'Temporal 已批准但未启动的 Workflow' 'Temporal approved but not started Workflow' 'Temporal 承認済み未開始 Workflow'
    L 'Cursor 跨会话 rules 与 Runtime 边界' 'Cursor cross-session rules versus Runtime' 'Cursor セッション横断 rules と Runtime 境界'
    L 'LangGraph thread-1 图执行实例' 'LangGraph thread-1 graph execution instance' 'LangGraph thread-1 グラフ実行事例'
)
$DescOverrides['runtime-plane'] = @(
    D 'OpenAI Assistants API：client.beta.threads.runs.create(thread_id=, assistant_id=) 创建 Run run_qVYsWok6OCjHxkajpIrdHuVP；status queued→in_progress→completed；runs.steps.list 返回 message_creation 与 tool_calls；Messages API 写入 report.txt；LangSmith project trace 关联同一 run_id。' 'OpenAI Assistants API client.beta.threads.runs.create(thread_id=, assistant_id=) creates Run run_qVYsWok6OCjHxkajpIrdHuVP; status queued→in_progress→completed; runs.steps.list returns message_creation and tool_calls; Messages API writes report.txt; LangSmith project trace correlates same run_id.' 'OpenAI Assistants API で runs.create が Run を作成し、Run Steps・Messages・LangSmith trace が同一 run に相関する。'
    D 'Temporal StartWorkflowExecution 在 TaskQueue=planner 上仅注册 WorkflowExecution（workflow_id=plan-42）但 worker 未 poll；无 started_at、RunAttempt 或 trace_id；PROV-O prov:Plan 不是 prov:Activity。' 'Temporal StartWorkflowExecution registers WorkflowExecution workflow_id=plan-42 on TaskQueue=planner but worker never polls; no started_at, RunAttempt, or trace_id; PROV-O prov:Plan is not prov:Activity.' 'Temporal で Workflow が登録されただけでは started_at も RunAttempt もなく、PROV Plan は Activity ではない。'
    D 'LangGraph 恢复 thread_id=thread-1 后，Cursor 全局 .cursor/rules 编码偏好仍跨 Chat 会话存在；读取该偏好的 Execution 已 ended_at，但持久归属在 Memory 平面而非 Runtime Activity。' 'After LangGraph resumes thread_id=thread-1, Cursor global .cursor/rules coding preference persists across Chat sessions; Execution that read it has ended_at, but durable ownership belongs to Memory plane not Runtime Activity.' 'LangGraph 再開後も Cursor rules はセッション横断で存続し、Execution 終了後の永続帰属は Memory 平面にある。'
    D 'LangGraph graph.invoke(input, config={configurable:{thread_id:thread-1}}) 在 2026-08-03T20:28:43Z–20:28:46Z 执行；PostgresSaver 写入 checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336；LangSmith 导出 retriever.search、llm.generate、tool.execute 子 run。' 'LangGraph graph.invoke with thread_id=thread-1 runs 2026-08-03T20:28:43Z–20:28:46Z; PostgresSaver writes checkpoint_id=1f070a87-33b3-6d36-8001-50c306580336; LangSmith exports retriever.search, llm.generate, tool.execute child runs.' 'LangGraph graph.invoke(thread_id=thread-1) は checkpoint と LangSmith 子 run を生成する。'
)

# runtime-execution-attempts module
$LabelOverrides['runtime-execution-attempts'] = @(
    L 'OpenAI Run 生命周期' 'OpenAI Run lifecycle' 'OpenAI Run ライフサイクル'
    L 'queued 单次 poll 误判' 'Single poll on queued misjudged' 'queued 1回 poll 誤判定'
    L 'max_turns 与 Execution 边界' 'max_turns versus Execution boundary' 'max_turns と Execution 境界'
    L 'requires_action 第二次尝试' 'requires_action second attempt' 'requires_action 2 回目試行'
)
$DescOverrides['runtime-execution-attempts'] = @(
    D 'OpenAI runs.create(thread_id, assistant_id) 返回 Run id=run_qVYsWok6OCjHxkajpIrdHuVP，status 从 queued 经 in_progress 到 completed；runs.steps.list(thread_id, run_id) 列出 message_creation 与 tool_calls 步骤。' 'OpenAI runs.create(thread_id, assistant_id) returns Run id=run_qVYsWok6OCjHxkajpIrdHuVP with status queued→in_progress→completed; runs.steps.list lists message_creation and tool_calls steps.' 'OpenAI runs.create は queued→in_progress→completed と Run Steps を返す。'
    D '客户端只调用一次 runs.retrieve(run_id) 见 status=queued 即标记 failed；OpenAI 文档要求 loop 直到 completed/failed/cancelled/expired 终端状态。' 'Client calls runs.retrieve(run_id) once, sees status=queued, marks failed; OpenAI docs require polling until terminal completed/failed/cancelled/expired.' 'runs.retrieve を1回だけ呼び queued を failed と誤判定する；OpenAI は终端状態まで poll を要求する。'
    D 'OpenAI Agents SDK Runner.run(agent, max_turns=10) 的 max_turns 是 RuntimeBudget 约束；Execution Activity 记录实际 agent loop，budget 字段不合并为 Activity。' 'OpenAI Agents SDK Runner.run(agent, max_turns=10) sets RuntimeBudget; Execution Activity records the actual agent loop without merging budget into Activity.' 'Runner.run(max_turns=10) は RuntimeBudget；Execution Activity と予算は分離する。'
    D 'Run status=requires_action 时 submit_tool_outputs(run_id, tool_outputs=[{tool_call_id:, output:}]) 使 Run 回到 queued→in_progress；RunAttempt attempt_number=2 独立记录。' 'When Run status=requires_action, submit_tool_outputs(run_id, tool_outputs) returns Run to queued→in_progress; RunAttempt attempt_number=2 is recorded independently.' 'requires_action 後 submit_tool_outputs で queued に戻り、2 回目 RunAttempt が独立記録される。'
)

# Execution
$LabelOverrides['Execution'] = @(
    L 'OpenAI Assistants Run 生命周期' 'OpenAI Assistants Run lifecycle' 'OpenAI Assistants Run ライフサイクル'
    L 'LangGraph 编译图非 Execution' 'LangGraph compiled graph not Execution' 'LangGraph コンパイル済みグラフは Execution ではない'
    L 'LangSmith 子 run 与 Execution 边界' 'LangSmith child run versus Execution' 'LangSmith 子 run と Execution 境界'
    L 'LangGraph graph.invoke 执行' 'LangGraph graph.invoke execution' 'LangGraph graph.invoke 実行'
)
$DescOverrides['Execution'] = @(
    D 'OpenAI Assistants API 中，通过 client.beta.threads.runs.create(thread_id=thread_id, assistant_id=assistant_id) 创建 Run。Run 对象包含 id、status、started_at、completed_at 等字段。状态流转为 queued → in_progress → requires_action（如需工具调用）→ completed/failed/cancelled/expired。每个 Run 产生 Run Steps，步骤类型为 message_creation 或 tool_calls。可通过 client.beta.threads.runs.steps.list(thread_id, run_id) 查询所有步骤。' 'In OpenAI Assistants API, create a Run via client.beta.threads.runs.create(thread_id, assistant_id). Run object contains id, status, started_at, completed_at fields. Status flow is queued → in_progress → requires_action → completed/failed/cancelled/expired. Each Run produces Run Steps of type message_creation or tool_calls.' 'OpenAI Assistants API で runs.create により Run を作成。status は queued→in_progress→requires_action→completed 等。Run Steps は message_creation または tool_calls。'
    D 'LangGraph StateGraph.compile() 后仅有节点/边定义；graph.invoke 调用前 planner 输出的 TaskStep 列表是 PROV prov:Plan，缺少 execution_id、started_at 与 RunAttempt 证据。' 'After LangGraph StateGraph.compile(), only node/edge definitions exist; before graph.invoke, planner TaskStep list is PROV prov:Plan without execution_id, started_at, or RunAttempt evidence.' 'graph.invoke 前の TaskStep 一覧は prov:Plan であり execution_id も started_at もない。'
    D 'LangSmith RunTree 中 llm.generate（parent_run_id=agent.run）与 tool.execute 是 TraceSpan 子操作；agent.run 根 run 才对应一次完整 agent Execution，子 run 不得提升为 Execution。' 'In LangSmith RunTree, llm.generate (parent_run_id=agent.run) and tool.execute are TraceSpan child operations; only agent.run root maps to one full agent Execution.' 'LangSmith 子 run（llm.generate）は TraceSpan であり、根 run のみが Execution に対応する。'
    D 'LangGraph graph.invoke(input, config={configurable:{thread_id:thread-1}}) 在 2026-08-03T20:28:43Z 开始、20:28:46Z 结束；每个 super-step 调用 checkpointer.put；LangSmith 导出 trace_id 与 Execution 关联。' 'LangGraph graph.invoke(input, config={configurable:{thread_id:thread-1}}) starts 2026-08-03T20:28:43Z and ends 20:28:46Z; each super-step calls checkpointer.put; LangSmith exports trace_id correlated to Execution.' 'LangGraph graph.invoke は super-step ごとに checkpoint を書き、LangSmith trace と相関する。'
)

# RunAttempt, RetryActivity, RuntimeBudget - continue in part 2
