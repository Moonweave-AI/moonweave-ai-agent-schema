# Part 4: runtime-system module
function L($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }
function D($zh, $en, $ja) { return @{ zh = $zh; en = $en; ja = $ja } }

$LabelOverrides['runtime-system'] = @(
    L 'OpenAI Agents Session 跨 Run' 'OpenAI Agents Session across Runs' 'OpenAI Agents Session 複数 Run'
    L 'Linux PID 非 RuntimeSession' 'Linux PID not RuntimeSession' 'Linux PID は RuntimeSession ではない'
    L 'Session 与 Thread 映射边界' 'Session versus Thread mapping boundary' 'Session と Thread マッピング境界'
    L 'Cursor agent session 实例' 'Cursor agent session instance' 'Cursor agent session 事例'
)
$DescOverrides['runtime-system'] = @(
    D 'OpenAI Agents SDK SQLiteSession(session_id) 在 Runner.run 前 get_items() 加载历史，run 后 add_items() 追加新消息；同一 session_id 跨多次 Run 保留上下文。' 'OpenAI Agents SDK SQLiteSession(session_id) get_items() before Runner.run loads history, add_items() after appends new messages; same session_id retains context across Runs.' 'OpenAI SQLiteSession が run 間で履歴を永続化する。'
    D 'Linux worker PID=4820 无 session_id/store_ref/conversation state，是 ProcessHandle 不是 RuntimeSession。' 'Linux worker PID=4820 has no session_id/store_ref/conversation state; ProcessHandle not RuntimeSession.' 'PID 4820 は ProcessHandle であり RuntimeSession ではない。'
    D 'OpenAI Assistants Thread、Agents SDK Session、LangGraph thread_id 是不同 API 概念，均可映射 Moonweave RuntimeSession 但需 store_ref 与 system_id。' 'OpenAI Assistants Thread, Agents SDK Session, LangGraph thread_id are different API concepts, all mappable to RuntimeSession with store_ref and system_id.' 'Thread/Session/thread_id は別 API だが RuntimeSession にマップ可能である。'
    D 'Cursor IDE Chat session_id=cursor-agent-session-77 管理多轮对话与 devcontainer RuntimeEnvironment；LangGraph thread_id 可关联同一 RuntimeSession 存储。' 'Cursor IDE Chat session_id=cursor-agent-session-77 manages multi-turn dialogue and devcontainer RuntimeEnvironment; LangGraph thread_id can link same RuntimeSession store.' 'Cursor session-77 が Chat と devcontainer を管理する。'
)

$LabelOverrides['RuntimeSession'] = @(
    L 'OpenAI Agents Session 历史' 'OpenAI Agents Session history' 'OpenAI Agents Session 履歴'
    L 'Assistants Thread ID  alone' 'Assistants Thread ID alone' 'Assistants Thread ID のみ'
    L 'Session 与 Execution 边界' 'Session versus Execution boundary' 'Session と Execution 境界'
    L 'LangGraph PostgresSaver session' 'LangGraph PostgresSaver session' 'LangGraph PostgresSaver セッション'
)
$DescOverrides['RuntimeSession'] = @(
    D 'OpenAI Agents SDK Session(session_id="openai-session-support-73") 在 Runner.run 前加载 SQLite 历史，run 后 append items；store_ref=session-store/sqlite、system_id=support-agent-prod。' 'OpenAI Agents SDK Session(session_id="openai-session-support-73") loads SQLite history before Runner.run, appends after; store_ref=session-store/sqlite, system_id=support-agent-prod.' 'OpenAI Session が run 前後で SQLite 履歴を管理する。'
    D '仅有 Assistants thread_id=thread_abc 无 store_ref、system_id、lifecycle state，不是完整 RuntimeSession 记录。' 'Only Assistants thread_id=thread_abc without store_ref, system_id, lifecycle state is incomplete RuntimeSession record.' 'thread_id のみでは RuntimeSession 記録として不十分である。'
    D 'OpenAI Session 跨多次 Run 保留历史；每次 Run 是独立 Execution Activity；Session 连续性与 Execution timing 分开查询。' 'OpenAI Session retains history across Runs; each Run is separate Execution Activity; Session continuity and Execution timing queried separately.' 'Session は履歴、各 Run は独立 Execution である。'
    D 'LangGraph thread_id=thread-1、store_ref=checkpointer/postgres、PostgresSaver 持久化；interrupt 后 SessionResumeEvent 用同 thread 恢复。' 'LangGraph thread_id=thread-1, store_ref=checkpointer/postgres, PostgresSaver persistence; after interrupt SessionResumeEvent resumes same thread.' 'LangGraph thread-1 PostgresSaver セッションを interrupt 後 resume する。'
)

$LabelOverrides['AgentSystem'] = @(
    L 'OpenAI 多 Agent handoff 系统' 'OpenAI multi-agent handoff system' 'OpenAI マルチ Agent handoff システム'
    L '单个 Agent 配置非 System' 'Single Agent config not System' '単一 Agent 設定は System ではない'
    L 'AgentSystem 与 RuntimeEnvironment 边界' 'AgentSystem versus RuntimeEnvironment' 'AgentSystem と RuntimeEnvironment 境界'
    L 'support-agent-prod 部署实例' 'support-agent-prod deployment instance' 'support-agent-prod デプロイ事例'
)
$DescOverrides['AgentSystem'] = @(
    D 'OpenAI Agents SDK 定义 triage_agent handoffs=[booking_agent, refund_agent]；AgentSystem system_id=support-agent-prod 拥有 Session 存储与多 Agent 边界。' 'OpenAI Agents SDK defines triage_agent handoffs=[booking_agent, refund_agent]; AgentSystem system_id=support-agent-prod owns Session storage and multi-agent boundary.' 'OpenAI handoffs が AgentSystem 境界を定義する。'
    D '单个 Agent(name=, tools=[get_weather]) 配置无 system_id/session store/多 agent 编排，不是 AgentSystem。' 'Single Agent(name=, tools=[get_weather]) config without system_id/session store/multi-agent orchestration is not AgentSystem.' '単一 Agent 設定は AgentSystem ではない。'
    D 'AgentSystem 是编排与 session 所有权边界；RuntimeEnvironment 是容器/进程/工作目录；系统配置与环境载体分离。' 'AgentSystem is orchestration and session ownership boundary; RuntimeEnvironment is container/process/workdir; system config separated from environment carrier.' 'AgentSystem は编排、RuntimeEnvironment は実行環境である。'
    D 'AgentSystem system_id=support-agent-prod、deployment_ref=ecs/support-agent:3、session_store_ref=redis://sessions/support-agent-prod。' 'AgentSystem system_id=support-agent-prod, deployment_ref=ecs/support-agent:3, session_store_ref=redis://sessions/support-agent-prod.' 'support-agent-prod AgentSystem デプロイを記録する。'
)

$LabelOverrides['SessionLifecycleEvent'] = @(
    L 'OpenAI Session 生命周期事件' 'OpenAI Session lifecycle event' 'OpenAI Session ライフサイクルイベント'
    L 'Run status 变更非 Session 事件' 'Run status change not Session event' 'Run status 変更は Session イベントではない'
    L 'Start/End 与 Pause/Resume 边界' 'Start End versus Pause Resume boundary' 'Start/End と Pause/Resume 境界'
    L 'session-90 生命周期序列' 'session-90 lifecycle sequence' 'session-90 ライフサイクル系列'
)
$DescOverrides['SessionLifecycleEvent'] = @(
    D 'OpenAI Agents SDK Session 产生 SessionStartEvent、SessionPauseEvent、SessionResumeEvent、SessionEndEvent；各事件含 session_id 与 event_time。' 'OpenAI Agents SDK Session emits SessionStartEvent, SessionPauseEvent, SessionResumeEvent, SessionEndEvent; each includes session_id and event_time.' 'OpenAI Session ライフサイクルイベント系列である。'
    D 'OpenAI runs.retrieve status=in_progress 是 Run/Execution 生命周期，不是 RuntimeSession SessionLifecycleEvent。' 'OpenAI runs.retrieve status=in_progress is Run/Execution lifecycle, not RuntimeSession SessionLifecycleEvent.' 'Run status は SessionLifecycleEvent ではない。'
    D 'SessionStartEvent/SessionEndEvent 标记会话边界；SessionPauseEvent/SessionResumeEvent 标记 interrupt 窗口；与 Execution started_at/ended_at 不同。' 'SessionStartEvent/SessionEndEvent mark session bounds; SessionPauseEvent/SessionResumeEvent mark interrupt window; differs from Execution started_at/ended_at.' 'Session イベントと Execution timing は別軸である。'
    D 'session_id=session-90 序列：SessionStartEvent(09:00)→SessionPauseEvent(09:10)→SessionResumeEvent(09:15)→SessionEndEvent(09:30)。' 'session_id=session-90 sequence: SessionStartEvent(09:00)→SessionPauseEvent(09:10)→SessionResumeEvent(09:15)→SessionEndEvent(09:30).' 'session-90 ライフサイクル系列を記録する。'
)

$LabelOverrides['SessionStartEvent'] = @(
    L 'OpenAI SQLiteSession 创建' 'OpenAI SQLiteSession create' 'OpenAI SQLiteSession 作成'
    L 'Thread create 非 SessionStartEvent' 'Thread create not SessionStartEvent' 'Thread create は SessionStartEvent ではない'
    L 'SessionStart 与 Execution start 边界' 'SessionStart versus Execution start boundary' 'SessionStart と Execution start 境界'
    L 'session-71 启动实例' 'session-71 start instance' 'session-71 開始事例'
)
$DescOverrides['SessionStartEvent'] = @(
    D 'OpenAI Agents SDK SQLiteSession(session_id="session-71") 首次 Runner.run 前创建 SessionStartEvent event_time=2026-01-15T08:00:00Z、store_ref=session-store/sqlite。' 'OpenAI Agents SDK SQLiteSession(session_id="session-71") creates SessionStartEvent event_time=2026-01-15T08:00:00Z, store_ref=session-store/sqlite before first Runner.run.' 'SQLiteSession 初回 run 前 SessionStartEvent を生成する。'
    D 'OpenAI client.beta.threads.create() 创建 Thread 是对话容器 API，不是 Moonweave SessionStartEvent（需 system_id/store_ref）。' 'OpenAI client.beta.threads.create() creates Thread conversation container API, not Moonweave SessionStartEvent (needs system_id/store_ref).' 'threads.create は Thread API であり SessionStartEvent ではない。'
    D 'SessionStartEvent 标记会话上下文开始；Execution.started_at 标记单次 Run Activity 开始；一次 Session 可含多次 Execution start。' 'SessionStartEvent marks session context start; Execution.started_at marks single Run Activity start; one Session can contain multiple Execution starts.' 'SessionStart と Execution.started_at は別概念である。'
    D 'SessionStartEvent event_id=session-start-71、session_id=session-71、system_id=support-agent-prod、started_at=2026-01-15T08:00:00Z。' 'SessionStartEvent event_id=session-start-71, session_id=session-71, system_id=support-agent-prod, started_at=2026-01-15T08:00:00Z.' 'session-start-71 を記録する。'
)

$LabelOverrides['SessionResumeEvent'] = @(
    L 'OpenAI 中断 Run 恢复' 'OpenAI interrupted Run resume' 'OpenAI 中断 Run 再開'
    L '新 Thread 非 Resume' 'New Thread not Resume' '新 Thread は Resume ではない'
    L 'Resume 与 SessionStart 边界' 'Resume versus SessionStart boundary' 'Resume と SessionStart 境界'
    L 'session-93 HITL 恢复实例' 'session-93 HITL resume instance' 'session-93 HITL 再開事例'
)
$DescOverrides['SessionResumeEvent'] = @(
    D 'OpenAI Agents SDK 文档：interrupt 后 Runner.run(agent, session=same_session) 产生 SessionResumeEvent，从 SQLiteSession 加载中断前历史继续。' 'OpenAI Agents SDK docs: after interrupt, Runner.run(agent, session=same_session) produces SessionResumeEvent loading pre-interrupt history from SQLiteSession.' 'OpenAI interrupt 後 same session Runner.run が SessionResumeEvent を生成する。'
    D 'OpenAI client.beta.threads.create() 开新 Thread 是新建会话，不是 SessionResumeEvent（resume 必须同一 session_id）。' 'OpenAI client.beta.threads.create() new Thread is new session, not SessionResumeEvent (resume requires same session_id).' '新 Thread 作成は Resume ではない。'
    D 'SessionResumeEvent 继续已有 session_id；SessionStartEvent 初始化新 session；resume 不重置 session 标识。' 'SessionResumeEvent continues existing session_id; SessionStartEvent initializes new session; resume does not reset session identity.' 'Resume は同一 session_id 継続、Start は新規 session である。'
    D 'SessionResumeEvent event_id=session-resume-93、session_id=session-73、resumed_at=2026-01-15T09:15:00Z、prior_pause_event=session-pause-90。' 'SessionResumeEvent event_id=session-resume-93, session_id=session-73, resumed_at=2026-01-15T09:15:00Z, prior_pause_event=session-pause-90.' 'session-resume-93 HITL 再開を記録する。'
)

$LabelOverrides['SessionPauseEvent'] = @(
    L 'LangGraph interrupt 暂停' 'LangGraph interrupt pause' 'LangGraph interrupt 一時停止'
    L 'Run cancelled 非 SessionPause' 'Run cancelled not SessionPause' 'Run cancelled は SessionPause ではない'
    L 'Pause 与 SessionEnd 边界' 'Pause versus SessionEnd boundary' 'Pause と SessionEnd 境界'
    L 'session-90 interrupt 实例' 'session-90 interrupt instance' 'session-90 interrupt 事例'
)
$DescOverrides['SessionPauseEvent'] = @(
    D 'LangGraph graph.invoke 触发 interrupt(value={"approval":required}) 产生 SessionPauseEvent session_id=langgraph-thread-1、paused_at=2026-01-15T09:10:00Z，checkpoint 保留状态。' 'LangGraph graph.invoke triggers interrupt(value={"approval":required}) producing SessionPauseEvent session_id=langgraph-thread-1, paused_at=2026-01-15T09:10:00Z with checkpoint preserving state.' 'LangGraph interrupt が SessionPauseEvent を生成する。'
    D 'OpenAI runs.cancel(run_id) 取消单次 Run 是 Execution 终止，不是 RuntimeSession SessionPauseEvent（session 仍可 resume）。' 'OpenAI runs.cancel(run_id) cancels single Run terminating Execution, not RuntimeSession SessionPauseEvent (session can still resume).' 'runs.cancel は Execution 終了であり SessionPause ではない。'
    D 'SessionPauseEvent 临时中断可 resume；SessionEndEvent 终止会话；pause 保留 session_id 与 store 历史。' 'SessionPauseEvent temporarily interrupts resumable; SessionEndEvent terminates session; pause retains session_id and store history.' 'Pause は再開可能、End はセッション終了である。'
    D 'SessionPauseEvent event_id=session-pause-90、session_id=session-90、paused_at=2026-01-15T09:10:00Z、reason=human_approval_required。' 'SessionPauseEvent event_id=session-pause-90, session_id=session-90, paused_at=2026-01-15T09:10:00Z, reason=human_approval_required.' 'session-pause-90 interrupt を記録する。'
)

$LabelOverrides['SessionEndEvent'] = @(
    L 'OpenAI Session 结束' 'OpenAI Session end' 'OpenAI Session 終了'
    L 'Process exit 非 SessionEnd' 'Process exit not SessionEnd' 'Process exit は SessionEnd ではない'
    L 'SessionEnd 与 Execution completed 边界' 'SessionEnd versus Execution completed boundary' 'SessionEnd と Execution completed 境界'
    L 'session-99 关闭实例' 'session-99 close instance' 'session-99 クローズ事例'
)
$DescOverrides['SessionEndEvent'] = @(
    D 'OpenAI Agents SDK session.close() 或 TTL 过期产生 SessionEndEvent session_id=session-99、ended_at=2026-01-15T10:00:00Z；store 标记 closed。' 'OpenAI Agents SDK session.close() or TTL expiry produces SessionEndEvent session_id=session-99, ended_at=2026-01-15T10:00:00Z; store marked closed.' 'OpenAI session.close が SessionEndEvent を生成する。'
    D 'worker 进程 exit(code=0) 是 ProcessHandle/RuntimeEnvironment 事件，不是 RuntimeSession SessionEndEvent。' 'worker process exit(code=0) is ProcessHandle/RuntimeEnvironment event, not RuntimeSession SessionEndEvent.' 'process exit は SessionEnd ではない。'
    D 'SessionEndEvent 关闭会话上下文；Execution completed 结束单次 Run；session 结束后不可 SessionResumeEvent。' 'SessionEndEvent closes session context; Execution completed ends single Run; after session end no SessionResumeEvent.' 'SessionEnd 後は Resume 不可、Execution completed は Run 終了である。'
    D 'SessionEndEvent event_id=session-end-99、session_id=session-99、ended_at=2026-01-15T10:00:00Z、reason=user_logout。' 'SessionEndEvent event_id=session-end-99, session_id=session-99, ended_at=2026-01-15T10:00:00Z, reason=user_logout.' 'session-end-99 クローズを記録する。'
)

$LabelOverrides['RuntimeEnvironment'] = @(
    L 'Docker devcontainer + LangGraph' 'Docker devcontainer plus LangGraph' 'Docker devcontainer + LangGraph'
    L 'cloud region 字符串非 Environment' 'Cloud region string not Environment' 'cloud region 文字列は Environment ではない'
    L 'Environment 与 Container 边界' 'Environment versus Container boundary' 'Environment と Container 境界'
    L 'env-prod-a 生产环境实例' 'env-prod-a production environment instance' 'env-prod-a 本番環境事例'
)
$DescOverrides['RuntimeEnvironment'] = @(
    D 'Cursor devcontainer.json + Docker image python:3.12 + LangGraph thread_id=thread-1 构成 RuntimeEnvironment env_id=env-prod-a，含 Container、ProcessHandle、WorkingDirectory。' 'Cursor devcontainer.json + Docker image python:3.12 + LangGraph thread_id=thread-1 forms RuntimeEnvironment env_id=env-prod-a with Container, ProcessHandle, WorkingDirectory.' 'devcontainer + LangGraph thread が RuntimeEnvironment を構成する。'
    D '字符串 region=us-east-1 无 container/process/workdir 证据，不是 RuntimeEnvironment 记录。' 'String region=us-east-1 without container/process/workdir evidence is not RuntimeEnvironment record.' 'region 文字列だけでは RuntimeEnvironment にならない。'
    D 'RuntimeEnvironment 聚合环境载体；Container 是镜像/实例；ProcessHandle 是 PID；WorkingDirectory 是路径；Environment 是组合边界。' 'RuntimeEnvironment aggregates environment carriers; Container is image/instance; ProcessHandle is PID; WorkingDirectory is path; Environment is composition boundary.' 'Environment は Container/Process/Workdir を束ねる。'
    D 'RuntimeEnvironment env_id=env-prod-a、container_digest=sha256:abc...、workdir=/workspace/project、process_pid=4820。' 'RuntimeEnvironment env_id=env-prod-a, container_digest=sha256:abc..., workdir=/workspace/project, process_pid=4820.' 'env-prod-a 本番 RuntimeEnvironment を記録する。'
)

$LabelOverrides['Container'] = @(
    L 'Docker 镜像 digest 固定' 'Docker image digest pin' 'Docker イメージ digest 固定'
    L 'Kubernetes Pod name 非 Container' 'Kubernetes Pod name not Container' 'Kubernetes Pod name は Container ではない'
    L 'Container 与 Artifact 边界' 'Container versus Artifact boundary' 'Container と Artifact 境界'
    L 'python:3.12-slim 实例' 'python 3.12 slim instance' 'python:3.12-slim 事例'
)
$DescOverrides['Container'] = @(
    D 'Docker docker run python:3.12-slim@sha256:abc123... 固定 Container image_digest=sha256:abc123、container_id=cr-11，作为 agent worker 运行环境。' 'Docker docker run python:3.12-slim@sha256:abc123... pins Container image_digest=sha256:abc123, container_id=cr-11 as agent worker runtime.' 'Docker digest 固定 Container が worker 環境である。'
    D 'Kubernetes Pod metadata.name=worker-7 无 image digest/容器/filesystem 边界，不是 Moonweave Container 记录。' 'Kubernetes Pod metadata.name=worker-7 without image digest/container/filesystem boundary is not Moonweave Container record.' 'Pod name だけでは Container 記録にならない。'
    D 'Container 是瞬态执行载体；Artifact 是稳定 content digest 输出；Docker 容器 ID 不是 Artifact。' 'Container is transient execution carrier; Artifact is stable content digest output; Docker container ID is not Artifact.' 'Container は実行载体、Artifact は出力 Entity である。'
    D 'Container container_id=cr-11、image_ref=python:3.12-slim、image_digest=sha256:abc123、c runtime_started_at=2026-01-15T08:00:00Z。' 'Container container_id=cr-11, image_ref=python:3.12-slim, image_digest=sha256:abc123, runtime_started_at=2026-01-15T08:00:00Z.' 'cr-11 python:3.12-slim Container を記録する。'
)

$LabelOverrides['ProcessHandle'] = @(
    L 'Docker exec worker PID' 'Docker exec worker PID' 'Docker exec worker PID'
    L 'OpenAI run_id 非 ProcessHandle' 'OpenAI run_id not ProcessHandle' 'OpenAI run_id は ProcessHandle ではない'
    L 'ProcessHandle 与 Execution 边界' 'ProcessHandle versus Execution boundary' 'ProcessHandle と Execution 境界'
    L 'PID 4820 实例' 'PID 4820 instance' 'PID 4820 事例'
)
$DescOverrides['ProcessHandle'] = @(
    D 'Docker CLI docker exec worker ps aux 返回 PID=4820 作为 ProcessHandle process_id=4820、command=python agent_worker.py、container_id=cr-11。' 'Docker CLI docker exec worker ps aux returns PID=4820 as ProcessHandle process_id=4820, command=python agent_worker.py, container_id=cr-11.' 'docker exec ps が ProcessHandle PID=4820 を返す。'
    D 'OpenAI Run id=run_qVYsWok6 是 Execution 标识，不是 OS ProcessHandle PID。' 'OpenAI Run id=run_qVYsWok6 is Execution identifier, not OS ProcessHandle PID.' 'OpenAI run_id は ProcessHandle ではない。'
    D 'ProcessHandle 指向 OS 进程；Execution 是逻辑 agent work Activity；同一 ProcessHandle 可承载多次 Execution。' 'ProcessHandle points to OS process; Execution is logical agent work Activity; one ProcessHandle can host multiple Executions.' 'ProcessHandle は OS 进程、Execution は論理 Activity である。'
    D 'ProcessHandle handle_id=proc-27、process_id=4820、command=python agent_worker.py、started_at=2026-01-15T08:00:05Z。' 'ProcessHandle handle_id=proc-27, process_id=4820, command=python agent_worker.py, started_at=2026-01-15T08:00:05Z.' 'proc-27 PID 4820 ProcessHandle を記録する。'
)

$LabelOverrides['WorkingDirectory'] = @(
    L 'Cursor workspace /project' 'Cursor workspace project path' 'Cursor workspace /project'
    L 'S3 bucket 前缀非 WorkingDirectory' 'S3 bucket prefix not WorkingDirectory' 'S3 bucket プレフィックスは WorkingDirectory ではない'
    L 'WorkingDirectory 与 Artifact 边界' 'WorkingDirectory versus Artifact boundary' 'WorkingDirectory と Artifact 境界'
    L '/workspace/project 实例' '/workspace/project instance' '/workspace/project 事例'
)
$DescOverrides['WorkingDirectory'] = @(
    D 'Cursor IDE workspace 根路径 /workspace/project 作为 WorkingDirectory path=/workspace/project、env_id=env-prod-a；agent 工具 read_file 相对此路径。' 'Cursor IDE workspace root /workspace/project as WorkingDirectory path=/workspace/project, env_id=env-prod-a; agent tool read_file relative to this path.' 'Cursor workspace /workspace/project が WorkingDirectory である。'
    D 'S3 uri s3://artifacts/build/ 是远程对象存储前缀，不是本地 filesystem WorkingDirectory。' 'S3 uri s3://artifacts/build/ is remote object storage prefix, not local filesystem WorkingDirectory.' 'S3 prefix は WorkingDirectory ではない。'
    D 'WorkingDirectory 是运行时 cwd 引用；PatchArtifact/ExportArtifact 是生成输出 Entity；路径引用不等于 Artifact。' 'WorkingDirectory is runtime cwd reference; PatchArtifact/ExportArtifact are generated output Entity; path reference is not Artifact.' 'WorkingDirectory は cwd 参照、Artifact は出力 Entity である。'
    D 'WorkingDirectory workdir_id=workdir-5、path=/workspace/project、container_id=cr-11、resolved_at=2026-01-15T08:00:01Z。' 'WorkingDirectory workdir_id=workdir-5, path=/workspace/project, container_id=cr-11, resolved_at=2026-01-15T08:00:01Z.' 'workdir-5 /workspace/project を記録する。'
)
