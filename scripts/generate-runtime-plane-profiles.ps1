# Generates scripts/runtime-plane-example-profiles.json from embedded node profiles.
$ErrorActionPreference = 'Stop'
$out = Join-Path $PSScriptRoot 'runtime-plane-example-profiles.json'

function ex($id, $zhLabel, $enLabel, $jaLabel, $zh, $en, $ja, $fv, $nodes, $rels, $claims, $src = $null) {
    $o = [ordered]@{
        id = $id
        labels = @{ zh = $zhLabel; en = $enLabel; ja = $jaLabel }
        descriptions = @{ zh = $zh; en = $en; ja = $ja }
        field_values = $fv
        related_node_ids = $nodes
        related_relation_ids = $rels
        source_claims = $claims
    }
    if ($src) { $o.example_source = $src }
    return [pscustomobject]$o
}

$P = @{}

# --- runtime-plane root ---
$P['runtime-plane'] = @(
    ex 'runtime-plane-openai-assistants-run' 'OpenAI Assistants Run 完整运行时证据' 'OpenAI Assistants Run full runtime evidence' 'OpenAI Assistants Run 完全ランタイム証拠' `
        'OpenAI Assistants API 中，client.beta.threads.runs.create(thread_id, assistant_id) 创建 Run run_qVYsWok6OCjHxkajpIrdHuVP。状态 queued→in_progress→completed；Run Steps 含 message_creation 与 tool_calls；Messages API 写入 report.txt；LangSmith trace 关联同一 run 的 span 树。' `
        'In OpenAI Assistants API, client.beta.threads.runs.create(thread_id, assistant_id) creates Run run_qVYsWok6OCjHxkajpIrdHuVP. Status flows queued→in_progress→completed; Run Steps include message_creation and tool_calls; Messages API writes report.txt; LangSmith trace correlates span tree for the same run.' `
        'OpenAI Assistants API で client.beta.threads.runs.create が Run を作成。queued→in_progress→completed、Run Steps、Messages、LangSmith trace が同一 run に相関する。' `
        @{ execution_id = 'run-qvy-swok6'; thread_id = 'thread_abc' } @('Execution','RunAttempt','TraceRecord','Artifact') @() @('claim-runtime-plane-boundary') 'https://developers.openai.com/docs/assistants'
    ex 'runtime-plane-plan-without-run' '无 Run 的已批准计划' 'Approved plan without Run' 'Run のない承認済み計画' `
        'Temporal Workflow 规划器在 TaskQueue=planner 上批准 5 个 TaskStep，但 thread_id、run_id、started_at 均为空；PROV-O prov:Plan 描述意图，不是 prov:Activity。' `
        'Temporal planner approves five TaskSteps on TaskQueue=planner but thread_id, run_id, and started_at are absent; PROV-O prov:Plan describes intent, not prov:Activity.' `
        'Temporal プランナーが TaskStep を承認するが run_id も started_at もなく、PROV-O Plan は Activity ではない。' `
        @{ plan_id = 'plan-42' } @() @() @('claim-runtime-plane-boundary')
    ex 'runtime-plane-memory-boundary' '跨会话记忆与 Runtime 边界' 'Cross-session memory versus Runtime' 'セッション横断メモリと Runtime 境界' `
        'LangGraph CheckpointSaver 恢复 thread_id=thread-1 后，Cursor 全局 rules/.cursorrules 编码偏好仍跨 Chat 会话存在；读取偏好的 Execution 已结束，但持久归属在 Memory 平面。' `
        'After LangGraph CheckpointSaver resumes thread_id=thread-1, Cursor global rules/.cursorrules coding preference persists across Chat sessions; the Execution that read it ended, but durable ownership belongs to Memory plane.' `
        'LangGraph 再開後も Cursor rules はセッション横断で存続し、Execution 終了後の永続帰属は Memory 平面にある。' `
        @{ memory_key = 'preferences/code-style' } @() @() @('claim-runtime-plane-boundary')
    ex 'runtime-plane-langgraph-thread-1' 'LangGraph thread-1 图执行' 'LangGraph thread-1 graph execution' 'LangGraph thread-1 グラフ実行' `
        'LangGraph graph.invoke({"configurable":{"thread_id":"thread-1"}}) 产生：Execution（started_at/ended_at）、PostgresSaver checkpoint_id=1f070a87…、StateSnapshot.values/next、LangSmith 子 run（retriever.search、llm.generate、tool.execute）。' `
        'LangGraph graph.invoke with thread_id=thread-1 produces Execution timing, PostgresSaver checkpoint_id=1f070a87…, StateSnapshot values/next, and LangSmith child runs (retriever.search, llm.generate, tool.execute).' `
        'LangGraph graph.invoke(thread_id=thread-1) は Execution、checkpoint、StateSnapshot、LangSmith 子 run を生成する。' `
        @{ execution_id = 'langgraph-thread-1-run'; thread_id = 'thread-1' } @('Execution','RunAttempt','TraceRecord','Checkpoint','StateSnapshot') @() @('claim-runtime-plane-boundary') 'https://docs.langchain.com/oss/python/langgraph/persistence'
)

# --- runtime-execution-attempts module ---
$P['runtime-execution-attempts'] = @(
    ex 'runtime-execution-openai-run-lifecycle' 'OpenAI Run 生命周期' 'OpenAI Run lifecycle' 'OpenAI Run ライフサイクル' `
        'OpenAI Assistants runs.create 返回 Run id=run_qVYsWok6OCjHxkajpIrdHuVP，status 从 queued 经 in_progress 到 completed；runs.steps.list 列出 message_creation 与 tool_calls 步骤。' `
        'OpenAI Assistants runs.create returns Run id=run_qVYsWok6OCjHxkajpIrdHuVP with status queued→in_progress→completed; runs.steps.list lists message_creation and tool_calls steps.' `
        'OpenAI runs.create は queued→in_progress→completed と Run Steps を返す。' `
        @{ execution_id = 'run-qvy-swok6'; started_at = '2026-01-08T12:00:03Z' } @('Execution','RunAttempt') @() @('claim-runtime-execution-activity')
    ex 'runtime-execution-poll-queued-once' '单次 poll queued 误判' 'Single poll on queued misjudged' 'queued 1回 poll の誤判定' `
        '客户端只调用一次 runs.retrieve(run_id) 见 status=queued 即标记 failed；OpenAI 文档要求 loop 直到 completed/failed/cancelled/expired 终端状态。' `
        'Client calls runs.retrieve(run_id) once, sees status=queued, marks failed; OpenAI docs require polling until terminal completed/failed/cancelled/expired.' `
        'runs.retrieve を1回だけ呼び queued を failed と誤判定する；OpenAI は终端状態まで poll を要求する。' `
        @{ run_id = 'run-qvy-swok6'; status = 'queued' } @('RunAttempt') @() @('claim-runtime-execution-activity')
    ex 'runtime-execution-max-turns-budget' 'max_turns 预算边界' 'max_turns budget boundary' 'max_turns 予算境界' `
        'OpenAI Agents SDK Runner.run(agent, max_turns=10) 的 max_turns 是 RuntimeBudget 约束；Execution Activity 记录实际 agent loop，预算字段不合并为 Activity。' `
        'OpenAI Agents SDK Runner.run(agent, max_turns=10) sets RuntimeBudget; Execution Activity records the actual agent loop without merging budget fields into Activity.' `
        'Runner.run(max_turns=10) は RuntimeBudget；Execution Activity と予算は分離する。' `
        @{ max_turns = 10 } @('RuntimeBudget','Execution') @() @('claim-runtime-execution-activity')
    ex 'runtime-execution-requires-action-retry' 'requires_action 工具重试' 'requires_action tool retry' 'requires_action ツール再試行' `
        'Run status=requires_action 时 submit_tool_outputs(run_id, tool_outputs=[{tool_call_id, output}]) 使 Run 回到 queued→in_progress；第二次 RunAttempt attempt_number=2 独立记录。' `
        'When Run status=requires_action, submit_tool_outputs(run_id, tool_outputs) returns Run to queued→in_progress; second RunAttempt attempt_number=2 is recorded independently.' `
        'requires_action 後 submit_tool_outputs で queued に戻り、2 回目 RunAttempt が独立記録される。' `
        @{ attempt_id = 'openai-run-attempt-2'; execution_id = 'run-qvy-swok6' } @('RunAttempt','RetryActivity','Execution') @('RunAttempt-retries-RunAttempt') @('claim-runtime-execution-activity')
)

$P['Execution'] = @(
    ex 'execution-openai-assistants-run' 'OpenAI Assistants Run 生命周期' 'OpenAI Assistants Run lifecycle' 'OpenAI Assistants Run ライフサイクル' `
        'OpenAI Assistants API 中，通过 client.beta.threads.runs.create(thread_id=thread_id, assistant_id=assistant_id) 创建 Run。Run 对象包含 id、status、started_at、completed_at 等字段。状态流转为 queued → in_progress → requires_action（如需工具调用）→ completed/failed/cancelled/expired。每个 Run 产生 Run Steps，步骤类型为 message_creation 或 tool_calls。可通过 client.beta.threads.runs.steps.list(thread_id, run_id) 查询所有步骤。' `
        'In OpenAI Assistants API, create a Run via client.beta.threads.runs.create(thread_id, assistant_id). Run object contains id, status, started_at, completed_at fields. Status flow is queued → in_progress → requires_action → completed/failed/cancelled/expired. Each Run produces Run Steps of type message_creation or tool_calls.' `
        'OpenAI Assistants API で runs.create により Run を作成。status は queued→in_progress→requires_action→completed 等。Run Steps は message_creation または tool_calls。' `
        @{ execution_id = 'run-qvy-swok6'; state = 'completed'; started_at = '2026-01-08T12:00:03Z'; ended_at = '2026-01-08T12:00:06Z' } @('Execution','RunAttempt') @() @('claim-execution-activity') 'https://developers.openai.com/docs/assistants'
    ex 'execution-prov-plan-not-activity' 'PROV Plan 非 Activity' 'PROV Plan is not Activity' 'PROV Plan は Activity ではない' `
        'LangGraph StateGraph 编译后仅有节点定义与边；在 graph.invoke 调用前，规划器输出的 TaskStep 列表是 PROV prov:Plan，缺少 execution_id、started_at 与 RunAttempt 证据。' `
        'After LangGraph StateGraph compile, only node/edge definitions exist; before graph.invoke, planner TaskStep list is PROV prov:Plan without execution_id, started_at, or RunAttempt evidence.' `
        'graph.invoke 前の TaskStep 一覧は prov:Plan であり execution_id も started_at もない。' `
        @{ plan_id = 'plan-42' } @() @() @('claim-execution-task-separation')
    ex 'execution-langsmith-span-boundary' 'LangSmith span 与 Execution 边界' 'LangSmith span versus Execution boundary' 'LangSmith span と Execution 境界' `
        'LangSmith RunTree 中 llm.generate（parent_run_id=agent.run）与 tool.execute 是 TraceSpan 子操作；agent.run 根 run 才对应一次完整 agent Execution，子 run 不得提升为 Execution。' `
        'In LangSmith RunTree, llm.generate (parent_run_id=agent.run) and tool.execute are TraceSpan child operations; only agent.run root maps to one full agent Execution.' `
        'LangSmith 子 run（llm.generate）は TraceSpan であり、根 run のみが Execution に対応する。' `
        @{ execution_id = 'run-qvy-swok6' } @('Execution','TraceSpan') @() @('claim-execution-activity')
    ex 'execution-langgraph-invoke' 'LangGraph graph.invoke 执行' 'LangGraph graph.invoke execution' 'LangGraph graph.invoke 実行' `
        'LangGraph graph.invoke(input, config={"configurable":{"thread_id":"thread-1"}}) 在 2026-08-03T20:28:43Z 开始、20:28:46Z 结束；每个 super-step 调用 checkpointer.put 写入 checkpoint；LangSmith 导出 trace_id 与 Execution 关联。' `
        'LangGraph graph.invoke(input, config={"configurable":{"thread_id":"thread-1"}}) starts 2026-08-03T20:28:43Z and ends 20:28:46Z; each super-step calls checkpointer.put; LangSmith exports trace_id correlated to Execution.' `
        'LangGraph graph.invoke は super-step ごとに checkpoint を書き、LangSmith trace と相関する。' `
        @{ execution_id = 'langgraph-thread-1-run'; state = 'completed'; started_at = '2026-08-03T20:28:43Z'; ended_at = '2026-08-03T20:28:46Z' } @('Execution','RunAttempt','Checkpoint','TraceRecord') @() @('claim-execution-activity')
)

$P['RunAttempt'] = @(
    ex 'run-attempt-openai-in-progress' 'OpenAI Run in_progress 尝试' 'OpenAI Run in_progress attempt' 'OpenAI Run in_progress 試行' `
        'OpenAI runs.retrieve 返回 Run status=in_progress、started_at=2026-01-08T12:00:03Z；RunAttempt attempt_number=1、outcome=running 记录首次执行尝试，与 Execution state 同步。' `
        'OpenAI runs.retrieve returns Run status=in_progress, started_at=2026-01-08T12:00:03Z; RunAttempt attempt_number=1, outcome=running records first try synchronized with Execution state.' `
        'OpenAI Run in_progress を RunAttempt attempt_number=1 として記録する。' `
        @{ attempt_id = 'openai-run-attempt-1'; attempt_number = 1; outcome = 'running' } @('RunAttempt','Execution') @('RunAttempt-part_of-Execution') @('claim-run-attempt')
    ex 'run-attempt-mutating-failed' '不可变违反：改写失败尝试' 'Immutability violation: rewriting failed attempt' '不変性違反：失敗試行の書き換え' `
        '运维脚本将 RunAttempt attempt_number=1 的 outcome 从 failed 直接 UPDATE 为 succeeded；LangGraph fault-tolerance 要求每次 try 为不可变 Activity 记录，应新建 attempt_number=2。' `
        'Ops script UPDATEs RunAttempt attempt_number=1 outcome from failed to succeeded; LangGraph fault-tolerance requires each try as immutable Activity—create attempt_number=2 instead.' `
        '失敗 RunAttempt を UPDATE せず、新しい attempt_number=2 を作成する必要がある。' `
        @{ attempt_id = 'openai-run-attempt-1'; outcome = 'failed' } @('RunAttempt') @() @('claim-run-attempt')
    ex 'run-attempt-retry-activity-split' 'RunAttempt 与 RetryActivity 分离' 'RunAttempt versus RetryActivity split' 'RunAttempt と RetryActivity の分離' `
        'OpenAI submit_tool_outputs 触发 RetryActivity（决策：重新排队 Run）；新 RunAttempt attempt_number=2 记录第二次 in_progress 窗口，RetryActivity 不替代 Attempt 记录。' `
        'OpenAI submit_tool_outputs triggers RetryActivity (decision to re-queue Run); new RunAttempt attempt_number=2 records second in_progress window; RetryActivity does not replace Attempt record.' `
        'RetryActivity は再試行判断、RunAttempt は各試行窗口を記録する。' `
        @{ attempt_id = 'openai-run-attempt-2' } @('RunAttempt','RetryActivity') @('RunAttempt-retries-RunAttempt') @('claim-run-attempt')
    ex 'run-attempt-openai-attempt-2' 'OpenAI 第二次 RunAttempt' 'OpenAI second RunAttempt' 'OpenAI 2 回目 RunAttempt' `
        'Run run_qVYsWok6 在 requires_action 后第二次进入 in_progress：RunAttempt attempt_id=openai-run-attempt-2、attempt_number=2、started_at=2026-01-08T12:00:05Z、outcome=completed。' `
        'Run run_qVYsWok6 enters in_progress again after requires_action: RunAttempt attempt_id=openai-run-attempt-2, attempt_number=2, started_at=2026-01-08T12:00:05Z, outcome=completed.' `
        'requires_action 後の 2 回目 RunAttempt を attempt_number=2 として記録する。' `
        @{ attempt_id = 'openai-run-attempt-2'; attempt_number = 2; outcome = 'completed' } @('RunAttempt','Execution') @('RunAttempt-part_of-Execution') @('claim-run-attempt')
)

$P['RetryActivity'] = @(
    ex 'retry-activity-openai-submit-tool' 'OpenAI submit_tool_outputs 重试' 'OpenAI submit_tool_outputs retry' 'OpenAI submit_tool_outputs 再試行' `
        'Run status=requires_action 且 required_action.type=submit_tool_outputs 时，client.beta.threads.runs.submit_tool_outputs(thread_id, run_id, tool_outputs=[{tool_call_id:"call_abc", output:"42"}]) 创建 RetryActivity 记录工具输出提交决策。' `
        'When Run status=requires_action with required_action.type=submit_tool_outputs, client.beta.threads.runs.submit_tool_outputs(thread_id, run_id, tool_outputs) creates RetryActivity recording tool-output submission decision.' `
        'submit_tool_outputs は RetryActivity として工具出力提交を記録する。' `
        @{ retry_id = 'openai-retry-submit-1'; run_id = 'run-qvy-swok6' } @('RetryActivity','RunAttempt','Execution') @() @('claim-retry-activity')
    ex 'retry-activity-langgraph-auto-retry' 'LangGraph 自动重试非 RetryActivity' 'LangGraph auto-retry is not RetryActivity' 'LangGraph 自動再試行は RetryActivity ではない' `
        'LangGraph RetryPolicy(max_attempts=3) 在节点失败时自动重试；框架内部重试循环若无显式 retry 决策记录，不应创建 Moonweave RetryActivity。' `
        'LangGraph RetryPolicy(max_attempts=3) auto-retries on node failure; internal retry loop without explicit retry decision record should not create Moonweave RetryActivity.' `
        'LangGraph RetryPolicy の内部ループだけでは RetryActivity を作成しない。' `
        @{ max_attempts = 3 } @('RunAttempt') @() @('claim-retry-activity')
    ex 'retry-activity-temporal-signal' 'Temporal 信号与 RetryActivity 边界' 'Temporal signal versus RetryActivity' 'Temporal signal と RetryActivity 境界' `
        'Temporal workflow.signal("retry_step", payload) 是 Workflow 外部信号；OpenAI submit_tool_outputs 才是 Assistants 栈上可映射的 RetryActivity 证据。' `
        'Temporal workflow.signal("retry_step", payload) is external Workflow signal; OpenAI submit_tool_outputs is mappable RetryActivity evidence on Assistants stack.' `
        'Temporal signal と OpenAI submit_tool_outputs は異なる Retry 証拠モデルである。' `
        @{ signal_name = 'retry_step' } @('RetryActivity','Execution') @() @('claim-retry-activity')
    ex 'retry-activity-crewai-kickoff-retry' 'CrewAI kickoff 失败后重跑' 'CrewAI kickoff retry after failure' 'CrewAI kickoff 失敗後再実行' `
        'Crew.kickoff() 第一次因 tool 超时失败；运维手动第二次 kickoff() 前记录 RetryActivity retry_reason=tool_timeout，随后 RunAttempt attempt_number=2 开始。' `
        'First Crew.kickoff() fails on tool timeout; before manual second kickoff(), RetryActivity retry_reason=tool_timeout is recorded, then RunAttempt attempt_number=2 starts.' `
        'Crew.kickoff 失敗後、RetryActivity を記録してから 2 回目 RunAttempt を開始する。' `
        @{ retry_id = 'crewai-retry-4'; retry_reason = 'tool_timeout' } @('RetryActivity','RunAttempt','Execution') @() @('claim-retry-activity')
)

$P['RuntimeBudget'] = @(
    ex 'runtime-budget-openai-max-turns' 'OpenAI Agents max_turns 预算' 'OpenAI Agents max_turns budget' 'OpenAI Agents max_turns 予算' `
        'OpenAI Agents SDK Runner.run(agent, max_turns=10) 在启动前写入 RuntimeBudget budget_kind=max_turns、limit=10；超出时 Runner 抛出 MaxTurnsExceeded 而非静默截断。' `
        'OpenAI Agents SDK Runner.run(agent, max_turns=10) writes RuntimeBudget budget_kind=max_turns, limit=10 before start; exceeding raises MaxTurnsExceeded instead of silent truncation.' `
        'Runner.run(max_turns=10) は RuntimeBudget limit=10 を書き、超過時 MaxTurnsExceeded を投げる。' `
        @{ budget_id = 'openai-max-turns-10'; budget_kind = 'max_turns'; limit = 10 } @('RuntimeBudget','Execution') @() @('claim-runtime-budget')
    ex 'runtime-budget-token-limit-only' '仅 token 上限非完整预算' 'Token limit alone not full budget' 'token 上限のみは完全予算ではない' `
        'OpenAI chat.completions max_tokens=4096 是单次模型调用参数，不是 Execution 级 RuntimeBudget；缺少 budget_kind 与 execution 引用时不建模为 RuntimeBudget。' `
        'OpenAI chat.completions max_tokens=4096 is single-call parameter, not Execution-level RuntimeBudget; without budget_kind and execution reference, do not model as RuntimeBudget.' `
        'max_tokens=4096 は単一 API 呼び出し参数であり Execution 级 RuntimeBudget ではない。' `
        @{ max_tokens = 4096 } @() @() @('claim-runtime-budget')
    ex 'runtime-budget-temporal-timeout' 'Temporal workflow timeout 边界' 'Temporal workflow timeout boundary' 'Temporal workflow timeout 境界' `
        'Temporal StartWorkflowOptions.WorkflowExecutionTimeout=30m 是 Workflow 级超时；OpenAI max_turns 是轮次预算；两者均可映射 RuntimeBudget 但 budget_kind 必须区分 workflow_timeout 与 max_turns。' `
        'Temporal WorkflowExecutionTimeout=30m is workflow-level timeout; OpenAI max_turns is turn budget; both map to RuntimeBudget but budget_kind must distinguish workflow_timeout vs max_turns.' `
        'Temporal timeout と OpenAI max_turns は budget_kind を分けて RuntimeBudget にマップする。' `
        @{ budget_kind = 'workflow_timeout'; limit = '30m' } @('RuntimeBudget','Execution') @() @('claim-runtime-budget')
    ex 'runtime-budget-crewai-max-iter' 'CrewAI max_iter 预算实例' 'CrewAI max_iter budget instance' 'CrewAI max_iter 予算事例' `
        'CrewAI Agent(max_iter=15) 在 Crew.kickoff() 前写入 RuntimeBudget budget_kind=max_iterations、limit=15；第 15 次迭代后停止并记录 Execution outcome=completed。' `
        'CrewAI Agent(max_iter=15) writes RuntimeBudget budget_kind=max_iterations, limit=15 before Crew.kickoff(); stops after iteration 15 with Execution outcome=completed.' `
        'CrewAI max_iter=15 を RuntimeBudget として kickoff 前に記録する。' `
        @{ budget_id = 'crewai-max-iter-15'; budget_kind = 'max_iterations'; limit = 15 } @('RuntimeBudget','Execution') @() @('claim-runtime-budget')
)

# Continue with remaining nodes - I'll add them in the same file
# Due to size, export what we have and append rest via second script section

$json = $P | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($out, $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $($P.Count) node profiles to $out"
