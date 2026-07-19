# Rewrite orchestration-routing-control examples: remove kind taxonomy, add real industry cases.
$ErrorActionPreference = 'Stop'
$Root = (Join-Path $PSScriptRoot '..\ontology\orchestration-plane\orchestration-routing-control') | Resolve-Path

function Set-NodeExamples {
    param([string]$RelPath, [string]$YamlBlock)
    $full = Join-Path $Root $RelPath
    $content = Get-Content -Raw -Path $full -Encoding UTF8
    $block = ($YamlBlock -replace "`r`n", "`n").TrimEnd()
    $newExamples = "examples:`n$block`n"
    if ($content -match '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):)') {
        $newContent = [regex]::Replace($content, '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):)', $newExamples, 1)
    } else {
        throw "No examples anchor in $RelPath"
    }
    [IO.File]::WriteAllText($full, $newContent, [Text.UTF8Encoding]::new($false))
    Write-Host "OK $RelPath"
}

$blocks = @{}

$blocks['node.yaml'] = @'
  - id: routing-langgraph-conditional-edges
    labels:
      zh: LangGraph 条件路由
      en: LangGraph conditional routing
      ja: LangGraph 条件ルーティング
    descriptions:
      zh: LangGraph StateGraph 使用 add_conditional_edges("classifier", route_by_severity, {"high": "security_review", "low": "general_support"})：route_by_severity 检查 state["severity"]，severity="high" 时进入 security_review 节点。
      en: LangGraph StateGraph uses add_conditional_edges("classifier", route_by_severity, {"high": "security_review", "low": "general_support"}) where route_by_severity checks state["severity"] and routes to security_review when severity="high".
      ja: LangGraph add_conditional_edges で route_by_severity が state["severity"] を検査し severity="high" で security_review へ遷移。
    field_values: {source: LangGraph, api: add_conditional_edges, router: route_by_severity}
    related_node_ids: [RoutingDecision, BranchCondition, Route]
    source_claims: [claim-orchestration-routing-control-module]
    synthetic: false
  - id: routing-semantic-router-layer
    labels:
      zh: Semantic Router 语义路由
      en: Semantic Router semantic routing
      ja: Semantic Router セマンティックルーティング
    descriptions:
      zh: aurelio-labs/semantic-router 定义 Route(name="billing", utterances=["I want a refund", "check my bill"]) 与 Route(name="tech", utterances=["app crashed"])；SemanticRouter(encoder=OpenAIEncoder, routes=routes) 对用户输入做 embedding cosine similarity 选最高分 Route。
      en: aurelio-labs/semantic-router defines Route(name="billing", utterances=["I want a refund"]) and Route(name="tech", utterances=["app crashed"]); SemanticRouter(encoder=OpenAIEncoder, routes=routes) picks highest cosine-similarity Route for user input.
      ja: semantic-router の Route 定義を SemanticRouter に渡し embedding cosine similarity で最適 Route を選択。
    field_values: {source: semantic-router, api: SemanticRouter, method: cosine similarity}
    related_node_ids: [RoutingPolicy, RoutingCondition, Route]
    source_claims: [claim-orchestration-routing-control-module]
    synthetic: false
  - id: routing-openai-agents-handoff
    labels:
      zh: OpenAI Agents SDK 交接路由
      en: OpenAI Agents SDK handoff routing
      ja: OpenAI Agents SDK ハンドオフルーティング
    descriptions:
      zh: OpenAI Agents SDK 中 triage_agent = Agent(name="Triage", handoffs=[billing_agent, technical_agent])；Runner.run(triage_agent, "I need a refund") 在 RunResult.new_items 产生 HandoffOutputItem(source_agent=triage, target_agent=billing)。
      en: OpenAI Agents SDK triage_agent = Agent(name="Triage", handoffs=[billing_agent, technical_agent]); Runner.run(triage_agent, "I need a refund") produces HandoffOutputItem(source_agent=triage, target_agent=billing) in RunResult.new_items.
      ja: triage_agent handoffs で Runner.run が HandoffOutputItem を new_items に記録。
    field_values: {source: OpenAI Agents SDK, api: handoffs, method: model-driven selection}
    related_node_ids: [RoutingDecision, SuccessorDispatch, RoutingTarget]
    source_claims: [claim-orchestration-routing-control-module]
    synthetic: false
  - id: routing-opa-gate-retry
    labels:
      zh: OPA 门控与 LangGraph 重试路由
      en: OPA gate with LangGraph retry routing
      ja: OPA ゲートと LangGraph リトライ
    descriptions:
      zh: Open Policy Agent bundle data/support/allow.rego 对 input.ticket.risk 求值；LangGraph retry_router 在 state["attempts"]<3 返回 "retry" 否则 END，与 GateOutcome result=block 联动 SuccessorDispatch dispatch_status=withheld。
      en: OPA bundle data/support/allow.rego evaluates input.ticket.risk; LangGraph retry_router returns "retry" when state["attempts"]<3 else END, linked with GateOutcome result=block and SuccessorDispatch dispatch_status=withheld.
      ja: OPA allow.rego と LangGraph retry_router が attempts<3 で retry、GateOutcome block と SuccessorDispatch withheld を連動。
    field_values: {source: OPA, api: rego eval, retry: retry_router}
    related_node_ids: [Gate, GateOutcome, RetryPolicy, SuccessorDispatch]
    source_claims: [claim-orchestration-routing-control-boundary]
    synthetic: false
'@

$blocks['RoutingDecision/node.yaml'] = @'
  - id: routing-decision-langgraph-command-review
    labels:
      zh: LangGraph Command 路由决策
      en: LangGraph Command routing decision
      ja: LangGraph Command ルーティング決定
    descriptions:
      zh: LangGraph classify 节点返回 Command(update={"route_class": "review"}, goto="review") 当 state["risk"]=="high"；Moonweave 本地 RoutingDecision 记录 decision_id=route-2026-07-18-001、selected_target=review、native_return_ref=Command(goto=review)。
      en: LangGraph classify returns Command(update={"route_class": "review"}, goto="review") when state["risk"]=="high"; Moonweave local RoutingDecision records decision_id=route-2026-07-18-001, selected_target=review, native_return_ref=Command(goto=review).
      ja: LangGraph Command(goto=review) を RoutingDecision として decision_id/selected_target/native_return_ref に記録。
    field_values: {decision_id: route-2026-07-18-001, selected_target: review, native_return_ref: Command(goto=review)}
    related_node_ids: [RoutingDecision, RoutingTarget]
    source_claims: [claim-routing-decision-langgraph]
    synthetic: false
  - id: routing-decision-conditional-edges-tools
    labels:
      zh: LangGraph 工具分支决策
      en: LangGraph tool-branch routing decision
      ja: LangGraph ツール分岐決定
    descriptions:
      zh: LangGraph agent 节点后 should_continue(state) 检查 state["messages"][-1].tool_calls：有 tool_calls 返回 "tools" 否则 END；add_conditional_edges("agent", should_continue, {"tools": "tools", END: END}) 产生一次 RoutingDecision selected_target=tools。
      en: LangGraph should_continue(state) checks state["messages"][-1].tool_calls returning "tools" or END; add_conditional_edges("agent", should_continue, {"tools": "tools", END: END}) yields RoutingDecision selected_target=tools.
      ja: should_continue が tool_calls を検査し add_conditional_edges で tools/END に RoutingDecision を生成。
    field_values: {selected_target: tools, native_return_ref: tools, selection_basis: {has_tool_calls: true}}
    related_node_ids: [RoutingDecision, BranchCondition]
    source_claims: [claim-routing-decision-langgraph]
    synthetic: false
  - id: routing-decision-semantic-router-billing
    labels:
      zh: Semantic Router 账单路由决策
      en: Semantic Router billing routing decision
      ja: Semantic Router 請求ルーティング決定
    descriptions:
      zh: semantic-router 对 "I want a refund for order 884" 调用 router() 返回 name="billing"（score=0.91>threshold=0.82）；本地 RoutingDecision 记录 selected_target=billing_handler、selection_basis={matched_route: billing, score: 0.91}。
      en: semantic-router router("I want a refund for order 884") returns name="billing" (score=0.91>threshold=0.82); local RoutingDecision records selected_target=billing_handler, selection_basis={matched_route: billing, score: 0.91}.
      ja: router() が billing route を score=0.91 で選択し RoutingDecision に記録。
    field_values: {selected_target: billing_handler, selection_basis: {matched_route: billing, score: 0.91}}
    related_node_ids: [RoutingDecision, Route, RoutingTarget]
    source_claims: [claim-routing-decision-local]
    synthetic: false
  - id: routing-decision-openai-handoff-output
    labels:
      zh: OpenAI HandoffOutputItem 路由决策
      en: OpenAI HandoffOutputItem routing decision
      ja: OpenAI HandoffOutputItem ルーティング決定
    descriptions:
      zh: OpenAI Agents SDK Runner.run 后 RunResult.new_items 含 HandoffOutputItem(source_agent=triage_agent, target_agent=billing_agent)；映射 RoutingDecision selected_target=billing_agent、native_return_ref=handoff:billing_agent、recorded_at 为 handoff 完成时刻。
      en: OpenAI Agents SDK RunResult.new_items includes HandoffOutputItem(source_agent=triage_agent, target_agent=billing_agent); maps to RoutingDecision selected_target=billing_agent, native_return_ref=handoff:billing_agent at handoff completion time.
      ja: HandoffOutputItem を RoutingDecision に写像し selected_target=billing_agent を記録。
    field_values: {selected_target: billing_agent, native_return_ref: handoff:billing_agent}
    related_node_ids: [RoutingDecision, SuccessorDispatch]
    source_claims: [claim-routing-decision-local]
    synthetic: false
  - id: routing-decision-langgraph-end
    labels:
      zh: LangGraph 路由到 END
      en: LangGraph route to END
      ja: LangGraph END へのルーティング
    descriptions:
      zh: LangGraph finalize 节点路由函数 return END 当 state["approved"]==True；RoutingDecision 记录 selected_target=END、selection_basis={route_class: finish}、native_return_ref=END，表示图执行终止而非失败。
      en: LangGraph finalize router returns END when state["approved"]==True; RoutingDecision records selected_target=END, selection_basis={route_class: finish}, native_return_ref=END as graph termination not failure.
      ja: approved=True で END を返し RoutingDecision に selected_target=END を記録。
    field_values: {selected_target: END, selection_basis: {route_class: finish}, native_return_ref: END}
    related_node_ids: [RoutingDecision, StopCondition]
    source_claims: [claim-routing-decision-langgraph]
    synthetic: false
'@

$blocks['RoutingTarget/RoutingDecision/node.yaml'] = $blocks['RoutingDecision/node.yaml']

$blocks['RoutingTarget/node.yaml'] = @'
  - id: routing-target-langgraph-node-name
    labels:
      zh: LangGraph 节点名路由目标
      en: LangGraph node-name routing target
      ja: LangGraph ノード名ルーティング対象
    descriptions:
      zh: LangGraph add_conditional_edges("classifier", route_ticket, {"auto": "auto_reply", "human": "human_review"}) 中 path_map 值 "human_review" 对应 RoutingTarget target_id=human_review、target_kind=worker_node，由 builder.add_node("human_review", human_review_fn) 注册。
      en: LangGraph add_conditional_edges path_map value "human_review" maps to RoutingTarget target_id=human_review, target_kind=worker_node registered via builder.add_node("human_review", human_review_fn).
      ja: path_map の human_review が add_node 登録済み RoutingTarget に対応。
    field_values: {target_id: human_review, target_kind: worker_node, graph_node: human_review}
    related_node_ids: [RoutingTarget, Route, RoutingDecision]
    source_claims: [claim-routing-target-001]
    synthetic: false
  - id: routing-target-semantic-router-handler
    labels:
      zh: Semantic Router 处理器目标
      en: Semantic Router handler routing target
      ja: Semantic Router ハンドラ対象
    descriptions:
      zh: semantic-router Route(name="billing", function=billing_handler) 中 billing_handler 为 RoutingTarget；router("check my invoice") 匹配 billing 后 dispatch 到该 callable，field_values 含 handler_ref=billing_handler.__name__。
      en: semantic-router Route(name="billing", function=billing_handler) maps billing_handler as RoutingTarget; router("check my invoice") matches billing then dispatches to callable handler_ref=billing_handler.__name__.
      ja: Route function=billing_handler が RoutingTarget として dispatch される。
    field_values: {target_id: billing_handler, handler_ref: billing_handler}
    related_node_ids: [RoutingTarget, Route]
    source_claims: [claim-routing-target-001]
    synthetic: false
  - id: routing-target-openai-subagent
    labels:
      zh: OpenAI Agents 子 Agent 目标
      en: OpenAI Agents sub-agent routing target
      ja: OpenAI Agents サブエージェント対象
    descriptions:
      zh: OpenAI Agents SDK billing_agent = Agent(name="Billing agent", instructions="Handle refunds") 作为 handoff 目标 RoutingTarget；HandoffOutputItem.target_agent.name="Billing agent" 与 target_id=billing_agent 对齐。
      en: OpenAI Agents SDK billing_agent = Agent(name="Billing agent", instructions="Handle refunds") is handoff RoutingTarget; HandoffOutputItem.target_agent.name aligns with target_id=billing_agent.
      ja: billing_agent Agent 定義が handoff RoutingTarget となる。
    field_values: {target_id: billing_agent, target_kind: agent, name: Billing agent}
    related_node_ids: [RoutingTarget, RoutingDecision]
    source_claims: [claim-routing-target-001]
    synthetic: false
  - id: routing-target-langgraph-send-worker
    labels:
      zh: LangGraph Send 动态 worker 目标
      en: LangGraph Send dynamic worker routing target
      ja: LangGraph Send 動的 worker 対象
    descriptions:
      zh: LangGraph map_reduce 中 return [Send("worker", {"item": x}) for x in state["items"]] 每个 Send 的 node="worker" 与 arg={"item": x} 定义 RoutingTarget target_id=worker、payload_projection=item，扇出到同一图节点。
      en: LangGraph map_reduce returns [Send("worker", {"item": x}) for x in state["items"]]; each Send node="worker" with arg defines RoutingTarget target_id=worker, payload_projection=item for fan-out.
      ja: Send("worker", {"item": x}) が worker RoutingTarget を扇出定義。
    field_values: {target_id: worker, target_kind: graph_node, api: Send}
    related_node_ids: [RoutingTarget, SuccessorDispatch]
    source_claims: [claim-routing-target-001]
    synthetic: false
'@

$blocks['RoutingSpecification/Route/node.yaml'] = @'
  - id: route-langgraph-path-map-billing
    labels:
      zh: LangGraph 账单分支静态 Route
      en: LangGraph billing branch static Route
      ja: LangGraph 請求 branch static Route
    descriptions:
      zh: LangGraph classify 节点配置 Route routing_specification_id=route-billing：source_control_ref=classify-request、target_ref=target-billing-worker、condition_refs=[condition-billing-intent]；path_map {"billing": "billing_handler"} 与 transfer_contract payload_schema_ref=support-ticket-v3 固定传递字段 ticket_id/customer_id/intent。
      en: LangGraph Route routing_specification_id=route-billing with source_control_ref=classify-request, target_ref=target-billing-worker, path_map {"billing": "billing_handler"}, transfer_contract payload_schema_ref=support-ticket-v3 projecting ticket_id/customer_id/intent.
      ja: route-billing が path_map と transfer_contract で billing_handler への静的 Route を定義。
    field_values: {routing_specification_id: route-billing, target_ref: target-billing-worker, transfer_contract: {payload_schema_ref: support-ticket-v3}}
    related_node_ids: [Route, BranchCondition, RoutingTarget]
    source_claims: [claim-route-001]
    synthetic: false
  - id: route-semantic-router-billing-primary
    labels:
      zh: Semantic Router 主账单 Route
      en: Semantic Router primary billing Route
      ja: Semantic Router 主請求 Route
    descriptions:
      zh: semantic-router Route(name="billing", utterances=["refund", "invoice", "charge dispute"], score_threshold=0.82) 注册为 Route route-billing-primary；RouteLayer 索引 utterance embedding，匹配后 candidate_route_refs 含 route-billing-primary。
      en: semantic-router Route(name="billing", utterances=["refund", "invoice", "charge dispute"], score_threshold=0.82) registers Route route-billing-primary indexed by RouteLayer utterance embeddings.
      ja: Route(name="billing") が route-billing-primary として RouteLayer に索引登録。
    field_values: {routing_specification_id: route-billing-primary, score_threshold: 0.82}
    related_node_ids: [Route, BranchCondition]
    source_claims: [claim-route-001]
    synthetic: false
  - id: route-crewai-task-routing
    labels:
      zh: CrewAI 任务路由 Route
      en: CrewAI task routing Route
      ja: CrewAI タスクルーティング Route
    descriptions:
      zh: CrewAI 多 Agent crew 中 research_task 的 context 依赖 analysis_task 输出：Crew Process.sequential 定义 Route source_control_ref=research_complete、target_ref=analysis_task、transfer_contract delivery_mode=task-output-projection 传递 expected_output JSON。
      en: CrewAI sequential Process defines Route source_control_ref=research_complete, target_ref=analysis_task, transfer_contract delivery_mode=task-output-projection passing expected_output JSON between tasks.
      ja: CrewAI sequential Process が task 間 Route と transfer_contract を定義。
    field_values: {source_control_ref: research_complete, target_ref: analysis_task, delivery_mode: task-output-projection}
    related_node_ids: [Route, RoutingTarget]
    source_claims: [claim-route-003]
    synthetic: false
  - id: route-autogen-groupchat-speaker
    labels:
      zh: AutoGen GroupChat 发言 Route
      en: AutoGen GroupChat speaker Route
      ja: AutoGen GroupChat 発言 Route
    descriptions:
      zh: AG2 GroupChatManager.select_speaker 根据 messages 选下一 Agent：Route route-next-speaker 固定 source_control_ref=groupchat_manager、target_ref=coder_agent、condition_refs=[turn-policy-v2]，transfer_contract 投影 last_message 与 shared_context。
      en: AG2 GroupChatManager.select_speaker picks next agent; Route route-next-speaker fixes source_control_ref=groupchat_manager, target_ref=coder_agent, condition_refs=[turn-policy-v2], transfer_contract projects last_message and shared_context.
      ja: GroupChatManager select_speaker が Route route-next-speaker で coder_agent へ遷移定義。
    field_values: {routing_specification_id: route-next-speaker, target_ref: coder_agent}
    related_node_ids: [Route, RoutingPolicy]
    source_claims: [claim-route-001]
    synthetic: false
'@

$blocks['RoutingSpecification/RoutingCondition/BranchCondition/node.yaml'] = @'
  - id: branch-langgraph-should-continue
    labels:
      zh: LangGraph should_continue 分支条件
      en: LangGraph should_continue branch condition
      ja: LangGraph should_continue 分岐条件
    descriptions:
      zh: LangGraph add_conditional_edges("agent", should_continue, {"tools": "tools", END: END}) 中 should_continue(state) 检查 state["messages"][-1].tool_calls：非空返回 "tools" 否则 END；BranchCondition branch-condition-tool-loop expression=has_tool_calls、match_value=tools、candidate_route_refs=[route-tools-loop]、precedence=10。
      en: LangGraph should_continue(state) checks state["messages"][-1].tool_calls returning "tools" or END; BranchCondition branch-condition-tool-loop sets expression=has_tool_calls, match_value=tools, candidate_route_refs=[route-tools-loop], precedence=10.
      ja: should_continue が tool_calls を検査し BranchCondition で tools/END 分岐を宣言。
    field_values: {routing_specification_id: branch-condition-tool-loop, expression: has_tool_calls, match_value: tools}
    related_node_ids: [BranchCondition, Route, RoutingPolicy]
    source_claims: [claim-branch-condition-001]
    synthetic: false
  - id: branch-semantic-router-billing-intent
    labels:
      zh: Semantic Router 账单意图分支
      en: Semantic Router billing-intent branch
      ja: Semantic Router 請求 intent 分岐
    descriptions:
      zh: semantic-router Route(name="billing") 匹配时 BranchCondition branch-condition-billing 记录 match_value=billing、expression=cosine_similarity>0.82、candidate_route_refs=[route-billing-primary, route-billing-fallback]、precedence=20、input_schema_ref=routing-state@3。
      en: semantic-router billing match yields BranchCondition branch-condition-billing with match_value=billing, expression=cosine_similarity>0.82, candidate_route_refs=[route-billing-primary, route-billing-fallback], precedence=20.
      ja: billing マッチ時 BranchCondition が candidate_route_refs と precedence=20 を記録。
    field_values: {match_value: billing, precedence: 20, candidate_route_refs: [route-billing-primary, route-billing-fallback]}
    related_node_ids: [BranchCondition, Route]
    source_claims: [claim-branch-condition-001]
    synthetic: false
  - id: branch-langgraph-route-by-severity
    labels:
      zh: LangGraph severity 分支条件
      en: LangGraph severity branch condition
      ja: LangGraph severity 分岐条件
    descriptions:
      zh: LangGraph route_by_severity(state) 读取 state["severity"]：high 返回 "escalate"、medium 返回 "review"、low 返回 "handle"；BranchCondition expression=state.severity in {high,medium,low}、candidate_route_refs 对应三条 Route、precedence 按 severity 降序 30/20/10。
      en: LangGraph route_by_severity reads state["severity"] returning escalate/review/handle; BranchCondition maps severities to candidate_route_refs with precedence 30/20/10.
      ja: route_by_severity が severity 別 candidate_route_refs と precedence を BranchCondition に宣言。
    field_values: {expression: state.severity, match_value: high, precedence: 30}
    related_node_ids: [BranchCondition, RoutingCondition]
    source_claims: [claim-branch-condition-003]
    synthetic: false
  - id: branch-opa-support-tier
    labels:
      zh: OPA 支持层级分支条件
      en: OPA support-tier branch condition
      ja: OPA サポート tier 分岐条件
    descriptions:
      zh: OPA rego 规则 support/tier.rego 中 tier := "premium" if input.customer.plan == "enterprise" 否则 "standard"；BranchCondition expression_language=rego@1、expression=data.support.tier、match_value=premium、candidate_route_refs=[route-premium-queue, route-standard-queue]。
      en: OPA support/tier.rego sets tier premium for enterprise plan else standard; BranchCondition expression_language=rego@1, expression=data.support.tier, match_value=premium, candidate_route_refs=[route-premium-queue, route-standard-queue].
      ja: OPA tier.rego 評価結果を BranchCondition match_value=premium として Route 候補に写像。
    field_values: {expression_language: rego@1, expression: data.support.tier, match_value: premium}
    related_node_ids: [BranchCondition, GateCondition]
    source_claims: [claim-branch-condition-001]
    synthetic: false
'@

$blocks['Gate/node.yaml'] = @'
  - id: gate-opa-quality-evaluator
    labels:
      zh: OPA 质量门控能力
      en: OPA quality gate capability
      ja: OPA 品質ゲート能力
    descriptions:
      zh: Open Policy Agent bundle quality/gate.rego 注册 Gate gate-support-quality：gate_kind=control、decision_function_ref=quality-gate-evaluator@3、version=3；输入 schema 含 draft.content_score 与 draft.pii_detected，输出 allow/block/revise 集合。
      en: OPA bundle quality/gate.rego registers Gate gate-support-quality with gate_kind=control, decision_function_ref=quality-gate-evaluator@3, version=3; input schema includes draft.content_score and draft.pii_detected, outcomes allow/block/revise.
      ja: OPA quality/gate.rego が Gate gate-support-quality を decision_function_ref@3 で登録。
    field_values: {gate_id: gate-support-quality, gate_kind: control, decision_function_ref: quality-gate-evaluator@3, version: "3"}
    related_node_ids: [Gate, ControlGate, GateCondition]
    source_claims: [claim-gate-001]
    synthetic: false
  - id: gate-langgraph-interrupt-human
    labels:
      zh: LangGraph 人工中断门控
      en: LangGraph human-interrupt gate
      ja: LangGraph 人間 interrupt ゲート
    descriptions:
      zh: LangGraph compile(interrupt_before=["human_review"]) 在 human_review 节点前暂停；Gate gate-human-approval gate_kind=approval、decision_function_ref=langgraph:interrupt@1，求值接口对应 checkpointer.get_state(thread_id) 是否含 pending interrupt。
      en: LangGraph compile(interrupt_before=["human_review"]) pauses before human_review; Gate gate-human-approval gate_kind=approval, decision_function_ref=langgraph:interrupt@1 evaluates checkpointer pending interrupt state.
      ja: interrupt_before=["human_review"] が Gate gate-human-approval approval 能力に対応。
    field_values: {gate_id: gate-human-approval, gate_kind: approval, decision_function_ref: langgraph:interrupt@1}
    related_node_ids: [Gate, ControlGate]
    source_claims: [claim-gate-001]
    synthetic: false
  - id: gate-guardrails-ai-validator
    labels:
      zh: Guardrails AI 验证门控
      en: Guardrails AI validation gate
      ja: Guardrails AI 検証ゲート
    descriptions:
      zh: guardrails-ai Guard().use(ProfanityFree(), ToxicLanguage()) 包装 LLM 调用构成 Gate gate-content-safety：decision_function_ref=guardrails:validator@2、gate_kind=safety；验证失败返回 GateOutcome result=block 而非直接抛异常。
      en: guardrails-ai Guard().use(ProfanityFree(), ToxicLanguage()) wraps LLM calls as Gate gate-content-safety with decision_function_ref=guardrails:validator@2, gate_kind=safety returning GateOutcome block on failure.
      ja: Guardrails Guard が Gate gate-content-safety safety 能力を構成。
    field_values: {gate_id: gate-content-safety, gate_kind: safety, decision_function_ref: guardrails:validator@2}
    related_node_ids: [Gate, GateOutcome]
    source_claims: [claim-gate-002]
    synthetic: false
  - id: gate-nemo-guardrails-colang
    labels:
      zh: NeMo Guardrails Colang 门控
      en: NeMo Guardrails Colang gate
      ja: NeMo Guardrails Colang ゲート
    descriptions:
      zh: NVIDIA NeMo Guardrails config.co 定义 define user ask about competitors -> bot refuse competitor discussion；Gate gate-competitor-policy gate_kind=control、decision_function_ref=nemo:rails/competitor@1、version=1，由 Rails.generate 在推理前求值。
      en: NVIDIA NeMo Guardrails config.co defines competitor refusal rail; Gate gate-competitor-policy gate_kind=control, decision_function_ref=nemo:rails/competitor@1, version=1 evaluated by Rails.generate before inference.
      ja: NeMo Guardrails config.co が Gate gate-competitor-policy を定義。
    field_values: {gate_id: gate-competitor-policy, gate_kind: control, decision_function_ref: nemo:rails/competitor@1}
    related_node_ids: [Gate, ControlGate]
    source_claims: [claim-gate-002]
    synthetic: false
'@

$blocks['SuccessorDispatch/node.yaml'] = @'
  - id: dispatch-langgraph-send-fanout
    labels:
      zh: LangGraph Send 扇出调度
      en: LangGraph Send fan-out dispatch
      ja: LangGraph Send ファンアウト
    descriptions:
      zh: LangGraph map_node 返回 [Send("worker", {"item": item}) for item in state["items"]]；每个 Send 产生 SuccessorDispatch dispatch_id=dispatch-2026-07-18-003、successor_target_ref=worker、dispatch_status=scheduled、gate_outcome_ref=gate-outcome-884（allow）。
      en: LangGraph map_node returns Send list fan-out; each Send yields SuccessorDispatch dispatch_id=dispatch-2026-07-18-003, successor_target_ref=worker, dispatch_status=scheduled, gate_outcome_ref=gate-outcome-884 (allow).
      ja: Send リスト各要素が SuccessorDispatch scheduled 記録を生成。
    field_values: {dispatch_id: dispatch-2026-07-18-003, successor_target_ref: worker, dispatch_status: scheduled}
    related_node_ids: [SuccessorDispatch, RoutingTarget, GateOutcome]
    source_claims: [claim-successor-dispatch-langgraph]
    synthetic: false
  - id: dispatch-langgraph-command-goto-merge
    labels:
      zh: LangGraph Command.goto 后继调度
      en: LangGraph Command.goto successor dispatch
      ja: LangGraph Command.goto 後続
    descriptions:
      zh: LangGraph reducer 节点 return Command(goto="merge") 在 GateOutcome allow 后；SuccessorDispatch dispatch_id=dispatch-2026-07-18-001、successor_target_ref=merge、dispatch_status=scheduled、recorded_at=2026-07-18T09:31:05Z。
      en: LangGraph reducer returns Command(goto="merge") after GateOutcome allow; SuccessorDispatch records dispatch_id=dispatch-2026-07-18-001, successor_target_ref=merge, dispatch_status=scheduled.
      ja: Command(goto=merge) が allow GateOutcome 後に SuccessorDispatch scheduled を記録。
    field_values: {dispatch_id: dispatch-2026-07-18-001, successor_target_ref: merge, dispatch_status: scheduled}
    related_node_ids: [SuccessorDispatch, RoutingDecision]
    source_claims: [claim-successor-dispatch-langgraph]
    synthetic: false
  - id: dispatch-openai-handoff-scheduled
    labels:
      zh: OpenAI Handoff 后继调度
      en: OpenAI Handoff successor dispatch
      ja: OpenAI Handoff 後続
    descriptions:
      zh: OpenAI Agents SDK HandoffOutputItem 完成后主机创建 SuccessorDispatch successor_target_ref=billing_agent、dispatch_status=scheduled；gate_outcome_ref 引用 triage 阶段 policy allow 的 GateOutcome gate-outcome-triage-12。
      en: After OpenAI HandoffOutputItem completes, host creates SuccessorDispatch successor_target_ref=billing_agent, dispatch_status=scheduled, gate_outcome_ref=gate-outcome-triage-12 from triage policy allow.
      ja: HandoffOutputItem 後 billing_agent への SuccessorDispatch scheduled を記録。
    field_values: {successor_target_ref: billing_agent, dispatch_status: scheduled, gate_outcome_ref: gate-outcome-triage-12}
    related_node_ids: [SuccessorDispatch, RoutingTarget]
    source_claims: [claim-successor-dispatch-local]
    synthetic: false
  - id: dispatch-gate-block-withheld
    labels:
      zh: 门控 block 后 withheld 调度
      en: Gate block withheld dispatch
      ja: ゲート block withheld
    descriptions:
      zh: OPA quality-gate-evaluator@3 返回 block 时 GateOutcome result=block；SuccessorDispatch dispatch_id=dispatch-2026-07-18-002、successor_target_ref=deploy、dispatch_status=withheld、gate_outcome_ref=gate-outcome-901，满足 withheld-on-block 约束。
      en: OPA quality-gate-evaluator@3 block yields GateOutcome result=block; SuccessorDispatch dispatch_status=withheld, successor_target_ref=deploy, gate_outcome_ref=gate-outcome-901 per withheld-on-block constraint.
      ja: GateOutcome block に対し deploy への SuccessorDispatch withheld を記録。
    field_values: {dispatch_id: dispatch-2026-07-18-002, dispatch_status: withheld, gate_outcome_ref: gate-outcome-901}
    related_node_ids: [SuccessorDispatch, GateOutcome]
    source_claims: [claim-successor-dispatch-local]
    synthetic: false
'@

$blocks['RoutingSpecification/RoutingPolicy/node.yaml'] = @'
  - id: policy-semantic-router-multi-route
    labels:
      zh: Semantic Router 多 Route 策略
      en: Semantic Router multi-route policy
      ja: Semantic Router 複数 Route ポリシー
    descriptions:
      zh: semantic-router SemanticRouter(routes=[billing_route, tech_route, sales_route]) 构成 RoutingPolicy policy-intent-routing@2：组合 BranchCondition branch-billing/branch-tech，precedence 20/15/10，default_route_ref=route-general-fallback。
      en: semantic-router SemanticRouter(routes=[billing_route, tech_route, sales_route]) forms RoutingPolicy policy-intent-routing@2 composing BranchConditions with precedence 20/15/10 and default_route_ref=route-general-fallback.
      ja: 複数 Route の SemanticRouter が RoutingPolicy policy-intent-routing@2 を構成。
    field_values: {routing_specification_id: policy-intent-routing, version: "2", default_route_ref: route-general-fallback}
    related_node_ids: [RoutingPolicy, BranchCondition, Route]
    source_claims: [claim-routing-policy-001]
    synthetic: false
  - id: policy-langgraph-supervisor-routing
    labels:
      zh: LangGraph Supervisor 路由策略
      en: LangGraph supervisor routing policy
      ja: LangGraph Supervisor ルーティングポリシー
    descriptions:
      zh: LangGraph supervisor 模式 supervisor_node 调用 route_to_agent(state) 选 researcher/coder/reviewer：RoutingPolicy policy-supervisor-v1 绑定 condition_refs=[branch-needs-research, branch-needs-code]、evaluation_order=precedence-desc、max_branches=1。
      en: LangGraph supervisor route_to_agent selects researcher/coder/reviewer; RoutingPolicy policy-supervisor-v1 binds condition_refs and evaluation_order=precedence-desc, max_branches=1.
      ja: supervisor route_to_agent が RoutingPolicy policy-supervisor-v1 で条件を束ねる。
    field_values: {routing_specification_id: policy-supervisor-v1, evaluation_order: precedence-desc}
    related_node_ids: [RoutingPolicy, BranchCondition]
    source_claims: [claim-routing-policy-001]
    synthetic: false
  - id: policy-openai-triage-handoffs
    labels:
      zh: OpenAI Triage handoff 策略
      en: OpenAI Triage handoff policy
      ja: OpenAI Triage handoff ポリシー
    descriptions:
      zh: OpenAI customer_service 示例 triage_agent handoffs=[billing_agent, technical_agent, sales_agent]；RoutingPolicy policy-triage-handoff 声明 eligible_target_types=[agent]、condition_refs=[intent-billing, intent-technical]、fallback_target_ref=general_agent。
      en: OpenAI customer_service triage_agent handoffs list forms RoutingPolicy policy-triage-handoff with eligible_target_types=[agent] and fallback_target_ref=general_agent.
      ja: triage handoffs リストが RoutingPolicy policy-triage-handoff を定義。
    field_values: {routing_specification_id: policy-triage-handoff, fallback_target_ref: general_agent}
    related_node_ids: [RoutingPolicy, RoutingTarget]
    source_claims: [claim-routing-policy-001]
    synthetic: false
  - id: policy-crewai-process-routing
    labels:
      zh: CrewAI Process 路由策略
      en: CrewAI Process routing policy
      ja: CrewAI Process ルーティングポリシー
    descriptions:
      zh: CrewAI Crew(process=Process.sequential) 中 task 顺序由 Process 定义：RoutingPolicy policy-crew-sequential@1 固定 evaluation_order=fixed-list、condition_refs=[task-research-done, task-analysis-ready]、default_route_ref=next_task_in_crew。
      en: CrewAI Process.sequential task order defines RoutingPolicy policy-crew-sequential@1 with evaluation_order=fixed-list and default_route_ref=next_task_in_crew.
      ja: CrewAI Process.sequential が RoutingPolicy policy-crew-sequential@1 を定義。
    field_values: {routing_specification_id: policy-crew-sequential, evaluation_order: fixed-list}
    related_node_ids: [RoutingPolicy, Route]
    source_claims: [claim-routing-policy-001]
    synthetic: false
'@

$blocks['RoutingSpecification/RoutingCondition/StopCondition/node.yaml'] = @'
  - id: stop-langgraph-max-iterations
    labels:
      zh: LangGraph 最大迭代停止
      en: LangGraph max-iterations stop
      ja: LangGraph 最大反復停止
    descriptions:
      zh: LangGraph while-loop 图配置 StopCondition stop-max-iterations@1：expression=state["iteration"]>=10、match_value=stop、关联 Route route-end-loop→END；recursion_limit=10 与 compile 参数对齐。
      en: LangGraph while-loop StopCondition stop-max-iterations@1 expression=state["iteration"]>=10, match_value=stop, Route route-end-loop→END aligned with recursion_limit=10.
      ja: iteration>=10 の StopCondition が END へ route-end-loop を停止。
    field_values: {routing_specification_id: stop-max-iterations, expression: state.iteration>=10, match_value: stop}
    related_node_ids: [StopCondition, Route, RetryPolicy]
    source_claims: [claim-stop-condition-001]
    synthetic: false
  - id: stop-openai-max-turns
    labels:
      zh: OpenAI Agents max_turns 停止
      en: OpenAI Agents max_turns stop
      ja: OpenAI Agents max_turns 停止
    descriptions:
      zh: OpenAI Agents SDK Runner.run(agent, input, max_turns=5) 达到 turn 上限停止；StopCondition stop-max-turns@1 expression=turn_count>=5、match_value=halt，映射 RoutingDecision selected_target=END。
      en: OpenAI Agents SDK Runner.run(..., max_turns=5) stop at turn limit; StopCondition stop-max-turns@1 expression=turn_count>=5, match_value=halt maps to RoutingDecision selected_target=END.
      ja: max_turns=5 が StopCondition stop-max-turns@1 を満たし halt。
    field_values: {expression: turn_count>=5, match_value: halt}
    related_node_ids: [StopCondition, RoutingDecision]
    source_claims: [claim-stop-condition-001]
    synthetic: false
  - id: stop-semantic-router-no-match
    labels:
      zh: Semantic Router 无匹配停止
      en: Semantic Router no-match stop
      ja: Semantic Router 無マッチ停止
    descriptions:
      zh: semantic-router 所有 Route score<threshold 时 router() 返回 None；StopCondition stop-no-route-match expression=all_scores_below_threshold、match_value=stop、default_action=END，防止无限 fallback LLM。
      en: semantic-router returns None when all scores<threshold; StopCondition stop-no-route-match expression=all_scores_below_threshold, match_value=stop, default_action=END prevents infinite LLM fallback.
      ja: 全 score<threshold で StopCondition stop-no-route-match が stop を宣言。
    field_values: {match_value: stop, default_action: END}
    related_node_ids: [StopCondition, BranchCondition]
    source_claims: [claim-stop-condition-001]
    synthetic: false
  - id: stop-autogen-max-round
    labels:
      zh: AutoGen 最大轮次停止
      en: AutoGen max-round stop
      ja: AutoGen 最大ラウンド停止
    descriptions:
      zh: AG2 GroupChat max_round=12 配置 StopCondition stop-groupchat-round@1：expression=round>=12、match_value=terminate；GroupChatManager 在 round 12 后不再 select_speaker，RoutingDecision selected_target=END。
      en: AG2 GroupChat max_round=12 defines StopCondition stop-groupchat-round@1 expression=round>=12; GroupChatManager stops select_speaker after round 12.
      ja: max_round=12 が StopCondition stop-groupchat-round@1 を満たし terminate。
    field_values: {expression: round>=12, match_value: terminate}
    related_node_ids: [StopCondition, RoutingPolicy]
    source_claims: [claim-stop-condition-001]
    synthetic: false
'@

$blocks['RoutingSpecification/RoutingCondition/GateCondition/node.yaml'] = @'
  - id: gate-condition-opa-allow-input
    labels:
      zh: OPA allow 输入门控条件
      en: OPA allow-input gate condition
      ja: OPA allow 入力ゲート条件
    descriptions:
      zh: OPA data.support.allow 规则 default allow=false；GateCondition gate-condition-support-allow@2 expression=input.ticket.severity!="critical" && input.customer.verified==true、match_value=allow、gate_ref=gate-support-quality、candidate_route_refs=[route-auto-resolve, route-human-queue]。
      en: OPA data.support.allow default false; GateCondition gate-condition-support-allow@2 expression checks severity and verified flag, match_value=allow, gate_ref=gate-support-quality.
      ja: OPA allow 規則が GateCondition gate-condition-support-allow@2 を構成。
    field_values: {gate_ref: gate-support-quality, match_value: allow, expression: input.ticket.severity!=critical}
    related_node_ids: [GateCondition, Gate, GateOutcome]
    source_claims: [claim-gate-condition-001]
    synthetic: false
  - id: gate-condition-langgraph-interrupt-pending
    labels:
      zh: LangGraph interrupt 待批门控
      en: LangGraph interrupt-pending gate condition
      ja: LangGraph interrupt 承認待ち
    descriptions:
      zh: LangGraph checkpointer.get_tuple(config) 返回 pending_writes 含 ("human_review",) 时 GateCondition gate-condition-interrupt@1 match_value=block、gate_ref=gate-human-approval，阻止 SuccessorDispatch 到 deploy 直到 Command(resume=...) 。
      en: LangGraph checkpointer pending_writes on human_review triggers GateCondition gate-condition-interrupt@1 match_value=block, gate_ref=gate-human-approval until Command(resume=...).
      ja: pending interrupt が GateCondition block を満たし deploy dispatch を withheld。
    field_values: {gate_ref: gate-human-approval, match_value: block}
    related_node_ids: [GateCondition, ControlGate, SuccessorDispatch]
    source_claims: [claim-gate-condition-001]
    synthetic: false
  - id: gate-condition-guardrails-toxic
    labels:
      zh: Guardrails 毒性检测门控
      en: Guardrails toxic-language gate condition
      ja: Guardrails 毒性検出ゲート
    descriptions:
      zh: guardrails-ai ToxicLanguage validator 返回 ValidationOutcome.fail 时 GateCondition gate-condition-toxic@1 match_value=block、gate_ref=gate-content-safety、expression=toxic_score>0.7，candidate_route_refs=[route-safe-response-only]。
      en: guardrails-ai ToxicLanguage fail yields GateCondition gate-condition-toxic@1 match_value=block, gate_ref=gate-content-safety, expression=toxic_score>0.7.
      ja: ToxicLanguage fail が GateCondition block を trigger。
    field_values: {gate_ref: gate-content-safety, match_value: block, expression: toxic_score>0.7}
    related_node_ids: [GateCondition, Gate]
    source_claims: [claim-gate-condition-001]
    synthetic: false
  - id: gate-condition-nemo-competitor
    labels:
      zh: NeMo 竞品话题门控
      en: NeMo competitor-topic gate condition
      ja: NeMo 競合話題ゲート
    descriptions:
      zh: NeMo Guardrails Colang define user ask about competitors -> bot refuse；GateCondition gate-condition-competitor@1 match_value=revise、gate_ref=gate-competitor-policy，求值由 Rails.generate messages 预处理触发。
      en: NeMo Guardrails competitor rail defines GateCondition gate-condition-competitor@1 match_value=revise, gate_ref=gate-competitor-policy evaluated in Rails.generate preprocessing.
      ja: NeMo competitor rail が GateCondition revise を宣言。
    field_values: {gate_ref: gate-competitor-policy, match_value: revise}
    related_node_ids: [GateCondition, Gate]
    source_claims: [claim-gate-condition-001]
    synthetic: false
'@

$blocks['RoutingSpecification/RoutingCondition/node.yaml'] = @'
  - id: routing-condition-branch-parent
    labels:
      zh: BranchCondition 父类路由条件
      en: BranchCondition parent routing condition
      ja: BranchCondition 親ルーティング条件
    descriptions:
      zh: RoutingCondition 作为 BranchCondition/GateCondition/StopCondition 父类：LangGraph route_by_severity 返回 label 前需满足 RoutingCondition input_schema_ref=routing-state@3、result_type=boolean、expression_language=python@3.11 通用字段约束。
      en: RoutingCondition parent of Branch/Gate/Stop conditions enforces input_schema_ref=routing-state@3, result_type=boolean, expression_language=python@3.11 before LangGraph route_by_severity label selection.
      ja: RoutingCondition が Branch/Gate/Stop 共通の input_schema_ref/result_type を定義。
    field_values: {input_schema_ref: routing-state@3, result_type: boolean}
    related_node_ids: [RoutingCondition, BranchCondition, GateCondition, StopCondition]
    source_claims: [claim-routing-condition-001]
    synthetic: false
  - id: routing-condition-cel-expression
    labels:
      zh: CEL 表达式路由条件
      en: CEL expression routing condition
      ja: CEL 式ルーティング条件
    descriptions:
      zh: Google CEL 表达式 state.intent == 'billing' && state.confidence > 0.8 编译为 RoutingCondition routing_specification_id=condition-billing-intent@3、expression_language=cel@1、valid_from=2026-07-16T00:00:00Z。
      en: Google CEL state.intent == 'billing' && state.confidence > 0.8 compiles to RoutingCondition condition-billing-intent@3 with expression_language=cel@1.
      ja: CEL 式が RoutingCondition condition-billing-intent@3 を構成。
    field_values: {routing_specification_id: condition-billing-intent, expression_language: cel@1}
    related_node_ids: [RoutingCondition, BranchCondition]
    source_claims: [claim-routing-condition-001]
    synthetic: false
  - id: routing-condition-opa-rego
    labels:
      zh: OPA Rego 路由条件
      en: OPA Rego routing condition
      ja: OPA Rego ルーティング条件
    descriptions:
      zh: OPA bundle support/routing.rego 包 allow_route if input.plan == "enterprise" 导出为 RoutingCondition expression_language=rego@1、expression=data.support.allow_route、eligible_target_types=[worker, human-review]。
      en: OPA support/routing.rego allow_route rule exports RoutingCondition expression_language=rego@1, expression=data.support.allow_route, eligible_target_types=[worker, human-review].
      ja: OPA routing.rego が RoutingCondition rego@1 条件をエクスポート。
    field_values: {expression_language: rego@1, expression: data.support.allow_route}
    related_node_ids: [RoutingCondition, GateCondition]
    source_claims: [claim-routing-condition-001]
    synthetic: false
  - id: routing-condition-semantic-threshold
    labels:
      zh: Semantic Router 阈值路由条件
      en: Semantic Router threshold routing condition
      ja: Semantic Router 閾値条件
    descriptions:
      zh: semantic-router Route.score_threshold=0.82 与 RouteLayer.fit() 优化阈值构成 RoutingCondition routing_specification_id=condition-embedding-match@1、result_type=similarity_score、match_value=above_threshold。
      en: semantic-router Route.score_threshold=0.82 and RouteLayer.fit() optimized thresholds form RoutingCondition condition-embedding-match@1, result_type=similarity_score.
      ja: score_threshold と RouteLayer.fit が RoutingCondition embedding 条件を定義。
    field_values: {result_type: similarity_score, match_value: above_threshold}
    related_node_ids: [RoutingCondition, BranchCondition]
    source_claims: [claim-routing-condition-001]
    synthetic: false
'@

$blocks['RoutingSpecification/RetryPolicy/node.yaml'] = @'
  - id: retry-langgraph-attempts-router
    labels:
      zh: LangGraph 重试路由策略
      en: LangGraph retry routing policy
      ja: LangGraph リトライポリシー
    descriptions:
      zh: LangGraph retry_router(state) 在 state["attempts"]<3 返回 "retry" 否则 END；RetryPolicy policy-retry-transient@1 max_attempts=3、backoff_seconds=[1,2,4]、retry_condition_ref=condition-transient-error、stop_condition_ref=stop-max-attempts。
      en: LangGraph retry_router returns "retry" when state["attempts"]<3 else END; RetryPolicy policy-retry-transient@1 max_attempts=3, backoff_seconds=[1,2,4], stop_condition_ref=stop-max-attempts.
      ja: retry_router と RetryPolicy policy-retry-transient@1 が attempts<3 で retry。
    field_values: {routing_specification_id: policy-retry-transient, max_attempts: 3, backoff_seconds: [1, 2, 4]}
    related_node_ids: [RetryPolicy, StopCondition, RoutingDecision]
    source_claims: [claim-retry-policy-001]
    synthetic: false
  - id: retry-temporal-workflow
    labels:
      zh: Temporal 工作流重试
      en: Temporal workflow retry policy
      ja: Temporal ワークフローリトライ
    descriptions:
      zh: Temporal Python SDK @workflow.defn 中 retry_policy=RetryPolicy(initial_interval=timedelta(seconds=1), maximum_attempts=5, backoff_coefficient=2.0) 映射 RetryPolicy policy-temporal-agent@2、retryable_error_types=[TransientError]。
      en: Temporal RetryPolicy(initial_interval=1s, maximum_attempts=5, backoff_coefficient=2.0) maps to RetryPolicy policy-temporal-agent@2 with retryable_error_types=[TransientError].
      ja: Temporal RetryPolicy が policy-temporal-agent@2 に写像。
    field_values: {routing_specification_id: policy-temporal-agent, max_attempts: 5, backoff_coefficient: 2.0}
    related_node_ids: [RetryPolicy, Route]
    source_claims: [claim-retry-policy-001]
    synthetic: false
  - id: retry-openai-responses
    labels:
      zh: OpenAI API 重试策略
      en: OpenAI API retry policy
      ja: OpenAI API リトライ
    descriptions:
      zh: OpenAI Python SDK DefaultRetryStrategy(max_retries=2) 对 429/5xx 重试；RetryPolicy policy-openai-http@1 max_attempts=2、backoff_seconds=[0.5,1.0]、retry_condition_ref=condition-http-retryable。
      en: OpenAI DefaultRetryStrategy(max_retries=2) on 429/5xx maps RetryPolicy policy-openai-http@1 max_attempts=2, backoff_seconds=[0.5, 1.0].
      ja: OpenAI max_retries=2 が RetryPolicy policy-openai-http@1 に対応。
    field_values: {max_attempts: 2, backoff_seconds: [0.5, 1.0]}
    related_node_ids: [RetryPolicy, StopCondition]
    source_claims: [claim-retry-policy-001]
    synthetic: false
  - id: retry-crewai-task-retry
    labels:
      zh: CrewAI 任务重试
      en: CrewAI task retry policy
      ja: CrewAI タスクリトライ
    descriptions:
      zh: CrewAI Task max_retries=3 与 retry_on_failure=True 配置映射 RetryPolicy policy-crew-task@1；失败时 Route route-retry-same-task 回到同一 agent 节点，stop_condition_ref=stop-task-max-retries。
      en: CrewAI Task max_retries=3 retry_on_failure=True maps RetryPolicy policy-crew-task@1 with Route route-retry-same-task and stop_condition_ref=stop-task-max-retries.
      ja: CrewAI max_retries=3 が RetryPolicy policy-crew-task@1 を構成。
    field_values: {routing_specification_id: policy-crew-task, max_attempts: 3}
    related_node_ids: [RetryPolicy, Route]
    source_claims: [claim-retry-policy-001]
    synthetic: false
'@

$blocks['RoutingSpecification/node.yaml'] = @'
  - id: routing-spec-langgraph-stategraph
    labels:
      zh: LangGraph StateGraph 路由规范
      en: LangGraph StateGraph routing specification
      ja: LangGraph StateGraph ルーティング仕様
    descriptions:
      zh: LangGraph StateGraph(AgentState) 编译前 add_node/add_edge/add_conditional_edges 集合构成 RoutingSpecification routing-spec-support-v3@1：含 Route、BranchCondition、RetryPolicy 引用，valid_from=2026-07-16T00:00:00Z。
      en: LangGraph StateGraph compile-time add_node/add_edge/add_conditional_edges form RoutingSpecification routing-spec-support-v3@1 bundling Route, BranchCondition, RetryPolicy refs.
      ja: StateGraph 構築時の edge/conditional 定義が RoutingSpecification routing-spec-support-v3@1。
    field_values: {routing_specification_id: routing-spec-support-v3, version: "1"}
    related_node_ids: [RoutingSpecification, Route, RoutingPolicy]
    source_claims: [claim-routing-specification-001]
    synthetic: false
  - id: routing-spec-semantic-router-index
    labels:
      zh: Semantic Router 索引路由规范
      en: Semantic Router index routing specification
      ja: Semantic Router 索引ルーティング仕様
    descriptions:
      zh: semantic-router SemanticRouter.save("routes.json") 持久化 RouteLayer 索引构成 RoutingSpecification routing-spec-intent-v2：encoder=OpenAIEncoder、routes 列表版本化、auto_sync=local。
      en: semantic-router SemanticRouter.save("routes.json") persisted RouteLayer index forms RoutingSpecification routing-spec-intent-v2 with encoder=OpenAIEncoder, versioned routes, auto_sync=local.
      ja: RouteLayer 索引保存が RoutingSpecification routing-spec-intent-v2。
    field_values: {routing_specification_id: routing-spec-intent-v2, encoder: OpenAIEncoder}
    related_node_ids: [RoutingSpecification, Route, BranchCondition]
    source_claims: [claim-routing-specification-001]
    synthetic: false
  - id: routing-spec-openai-multi-agent
    labels:
      zh: OpenAI 多 Agent 路由规范
      en: OpenAI multi-agent routing specification
      ja: OpenAI マルチエージェント仕様
    descriptions:
      zh: OpenAI Agents SDK 项目定义 triage/billing/technical Agent 与 handoffs 列表构成 RoutingSpecification routing-spec-customer-service@1：default_agent=triage、handoff_targets=[billing, technical]、max_turns=8。
      en: OpenAI Agents SDK triage/billing/technical agents and handoffs form RoutingSpecification routing-spec-customer-service@1 with default_agent=triage, max_turns=8.
      ja: handoffs 定義が RoutingSpecification routing-spec-customer-service@1。
    field_values: {routing_specification_id: routing-spec-customer-service, max_turns: 8}
    related_node_ids: [RoutingSpecification, RoutingPolicy]
    source_claims: [claim-routing-specification-001]
    synthetic: false
  - id: routing-spec-opa-bundle
    labels:
      zh: OPA 策略包路由规范
      en: OPA bundle routing specification
      ja: OPA バンドルルーティング仕様
    descriptions:
      zh: OPA bundle tar.gz 含 support/allow.rego、support/routing.rego、quality/gate.rego 发布为 RoutingSpecification routing-spec-opa-support@4；decision_function_ref 与 Gate/Route 条件版本绑定 valid_from=2026-07-01T00:00:00Z。
      en: OPA bundle with allow.rego, routing.rego, gate.rego publishes RoutingSpecification routing-spec-opa-support@4 binding Gate/Route condition versions valid_from=2026-07-01.
      ja: OPA bundle が RoutingSpecification routing-spec-opa-support@4 を公開。
    field_values: {routing_specification_id: routing-spec-opa-support, version: "4"}
    related_node_ids: [RoutingSpecification, GateCondition, Route]
    source_claims: [claim-routing-specification-001]
    synthetic: false
'@

$blocks['GateOutcome/node.yaml'] = @'
  - id: gate-outcome-opa-allow
    labels:
      zh: OPA allow 门控结果
      en: OPA allow gate outcome
      ja: OPA allow ゲート結果
    descriptions:
      zh: OPA eval -d bundle/data input.json 返回 {"allow": true} 时 GateOutcome outcome_id=gate-outcome-884、gate_ref=gate-support-quality、result=allow、evaluated_at=2026-07-18T09:30:00Z、input_digest=sha256:abc123。
      en: OPA eval returns {"allow": true} yielding GateOutcome outcome_id=gate-outcome-884, gate_ref=gate-support-quality, result=allow, evaluated_at=2026-07-18T09:30:00Z.
      ja: OPA allow=true が GateOutcome gate-outcome-884 result=allow を生成。
    field_values: {outcome_id: gate-outcome-884, result: allow, gate_ref: gate-support-quality}
    related_node_ids: [GateOutcome, Gate, SuccessorDispatch]
    source_claims: [claim-gate-outcome-001]
    synthetic: false
  - id: gate-outcome-opa-block
    labels:
      zh: OPA block 门控结果
      en: OPA block gate outcome
      ja: OPA block ゲート結果
    descriptions:
      zh: OPA quality-gate-evaluator@3 对 draft.pii_detected=true 返回 block；GateOutcome outcome_id=gate-outcome-901、result=block、rationale_ref=pii-policy-v2，触发 SuccessorDispatch dispatch_status=withheld。
      en: OPA quality-gate-evaluator@3 blocks on draft.pii_detected=true; GateOutcome outcome_id=gate-outcome-901, result=block triggers SuccessorDispatch withheld.
      ja: pii_detected で GateOutcome gate-outcome-901 block が SuccessorDispatch withheld を起動。
    field_values: {outcome_id: gate-outcome-901, result: block}
    related_node_ids: [GateOutcome, SuccessorDispatch]
    source_claims: [claim-gate-outcome-001]
    synthetic: false
  - id: gate-outcome-guardrails-fail
    labels:
      zh: Guardrails 验证失败结果
      en: Guardrails validation fail outcome
      ja: Guardrails 検証失敗結果
    descriptions:
      zh: guardrails-ai Guard.validate(output) 返回 ValidationOutcome.fail 与 error_spans；GateOutcome outcome_id=gate-outcome-toxic-55、gate_ref=gate-content-safety、result=block、evaluated_at 对齐 validator 调用时刻。
      en: guardrails-ai Guard.validate fail yields GateOutcome outcome_id=gate-outcome-toxic-55, gate_ref=gate-content-safety, result=block at validator call time.
      ja: Guard.validate fail が GateOutcome gate-outcome-toxic-55 block を記録。
    field_values: {outcome_id: gate-outcome-toxic-55, result: block, gate_ref: gate-content-safety}
    related_node_ids: [GateOutcome, Gate]
    source_claims: [claim-gate-outcome-001]
    synthetic: false
  - id: gate-outcome-langgraph-interrupt
    labels:
      zh: LangGraph interrupt 门控结果
      en: LangGraph interrupt gate outcome
      ja: LangGraph interrupt ゲート結果
    descriptions:
      zh: LangGraph graph.invoke 在 interrupt_before=["human_review"] 暂停返回 __interrupt__ 元组；GateOutcome outcome_id=gate-outcome-interrupt-7、result=revise、gate_ref=gate-human-approval，等待 Command(resume={"approved": true})。
      en: LangGraph invoke pauses at interrupt_before human_review with __interrupt__ tuple; GateOutcome outcome_id=gate-outcome-interrupt-7, result=revise, gate_ref=gate-human-approval awaiting Command(resume=...).
      ja: __interrupt__ 暂停が GateOutcome gate-outcome-interrupt-7 revise を生成。
    field_values: {outcome_id: gate-outcome-interrupt-7, result: revise, gate_ref: gate-human-approval}
    related_node_ids: [GateOutcome, ControlGate, DownstreamOperation]
    source_claims: [claim-gate-outcome-001]
    synthetic: false
'@

$blocks['GateOutcome/DownstreamOperation/node.yaml'] = @'
  - id: downstream-opa-allow-deploy
    labels:
      zh: OPA allow 后 deploy 下游操作
      en: OPA allow downstream deploy operation
      ja: OPA allow 後 deploy 下流操作
    descriptions:
      zh: GateOutcome gate-outcome-884 result=allow 后 SuccessorDispatch scheduled 触发 DownstreamOperation op-deploy-v2：operation_kind=node_invoke、target_ref=deploy、input_projection={artifact_id: state.output_id}、gate_outcome_ref=gate-outcome-884。
      en: After GateOutcome gate-outcome-884 allow, SuccessorDispatch triggers DownstreamOperation op-deploy-v2 operation_kind=node_invoke, target_ref=deploy, gate_outcome_ref=gate-outcome-884.
      ja: allow GateOutcome 後 DownstreamOperation op-deploy-v2 node_invoke が deploy を実行。
    field_values: {operation_id: op-deploy-v2, operation_kind: node_invoke, target_ref: deploy}
    related_node_ids: [DownstreamOperation, GateOutcome, SuccessorDispatch]
    source_claims: [claim-downstream-operation-001]
    synthetic: false
  - id: downstream-langgraph-resume-human
    labels:
      zh: LangGraph 人工恢复下游操作
      en: LangGraph human-resume downstream operation
      ja: LangGraph 人間 resume 下流
    descriptions:
      zh: GateOutcome gate-outcome-interrupt-7 result=revise 后用户 Command(resume={"approved": true}) 产生 DownstreamOperation op-resume-human-review：operation_kind=resume、target_ref=human_review、payload={approved: true}。
      en: After GateOutcome revise, Command(resume={"approved": true}) yields DownstreamOperation op-resume-human-review operation_kind=resume, target_ref=human_review.
      ja: Command(resume) が DownstreamOperation op-resume-human-review を生成。
    field_values: {operation_id: op-resume-human-review, operation_kind: resume, target_ref: human_review}
    related_node_ids: [DownstreamOperation, GateOutcome]
    source_claims: [claim-downstream-operation-001]
    synthetic: false
  - id: downstream-openai-handoff-billing
    labels:
      zh: OpenAI handoff 账单下游操作
      en: OpenAI handoff billing downstream operation
      ja: OpenAI handoff 請求下流
    descriptions:
      zh: HandoffOutputItem target_agent=billing_agent 完成后 DownstreamOperation op-run-billing-agent：operation_kind=agent_run、target_ref=billing_agent、input_projection={user_message: last_user_turn}、gate_outcome_ref=gate-outcome-triage-12。
      en: After HandoffOutputItem to billing_agent, DownstreamOperation op-run-billing-agent operation_kind=agent_run projects last_user_turn input.
      ja: billing_agent handoff 後 DownstreamOperation op-run-billing-agent が agent_run。
    field_values: {operation_id: op-run-billing-agent, operation_kind: agent_run, target_ref: billing_agent}
    related_node_ids: [DownstreamOperation, SuccessorDispatch]
    source_claims: [claim-downstream-operation-001]
    synthetic: false
  - id: downstream-block-no-op
    labels:
      zh: block 后无下游操作
      en: Block produces no downstream operation
      ja: block 後下流操作なし
    descriptions:
      zh: GateOutcome gate-outcome-901 result=block 时 SuccessorDispatch dispatch_status=withheld，DownstreamOperation 不创建；审计记录 operation_id=absent、operation_kind=none、gate_outcome_ref=gate-outcome-901 说明 deploy 未执行。
      en: GateOutcome block with SuccessorDispatch withheld creates no DownstreamOperation; audit records operation_kind=none, gate_outcome_ref=gate-outcome-901 explaining deploy not executed.
      ja: block GateOutcome で DownstreamOperation 未作成、operation_kind=none を監査記録。
    field_values: {operation_kind: none, gate_outcome_ref: gate-outcome-901}
    related_node_ids: [DownstreamOperation, GateOutcome, SuccessorDispatch]
    source_claims: [claim-downstream-operation-001]
    synthetic: false
'@

$blocks['Gate/ControlGate/node.yaml'] = @'
  - id: control-gate-opa-quality
    labels:
      zh: OPA 质量控制门
      en: OPA quality control gate
      ja: OPA 品質コントロールゲート
    descriptions:
      zh: ControlGate 继承 Gate gate-support-quality：gate_kind=control、decision_function_ref=quality-gate-evaluator@3；OPA rego 规则 draft.content_score >= 0.7 && !draft.pii_detected 求值 allow/block，ControlGate-is_a-Gate 关系成立。
      en: ControlGate inherits Gate gate-support-quality gate_kind=control, decision_function_ref=quality-gate-evaluator@3; OPA rego draft.content_score>=0.7 && !pii_detected evaluates allow/block.
      ja: ControlGate が Gate gate-support-quality を control 種別で継承。
    field_values: {gate_id: gate-support-quality, gate_kind: control, decision_function_ref: quality-gate-evaluator@3}
    related_node_ids: [ControlGate, Gate, GateOutcome]
    source_claims: [claim-control-gate-001]
    synthetic: false
  - id: control-gate-langgraph-interrupt
    labels:
      zh: LangGraph 审批控制门
      en: LangGraph approval control gate
      ja: LangGraph 承認コントロールゲート
    descriptions:
      zh: ControlGate gate-human-approval gate_kind=approval、decision_function_ref=langgraph:interrupt@1；compile(interrupt_before=["human_review"]) 在 human_review 前求值，ControlGate 输出 allow/revise 映射 GateOutcome。
      en: ControlGate gate-human-approval gate_kind=approval with compile(interrupt_before=["human_review"]) evaluates before human_review producing allow/revise GateOutcome.
      ja: interrupt_before human_review が ControlGate gate-human-approval を構成。
    field_values: {gate_id: gate-human-approval, gate_kind: approval}
    related_node_ids: [ControlGate, Gate, GateCondition]
    source_claims: [claim-control-gate-001]
    synthetic: false
  - id: control-gate-guardrails-safety
    labels:
      zh: Guardrails 安全控制门
      en: Guardrails safety control gate
      ja: Guardrails 安全コントロールゲート
    descriptions:
      zh: ControlGate gate-content-safety gate_kind=safety、decision_function_ref=guardrails:validator@2；Guard().use(ToxicLanguage(threshold=0.7)) 在 LLM 输出后求值，block 时阻止 DownstreamOperation publish。
      en: ControlGate gate-content-safety gate_kind=safety runs Guard().use(ToxicLanguage(threshold=0.7)) post-LLM blocking DownstreamOperation publish on fail.
      ja: ToxicLanguage threshold=0.7 が ControlGate gate-content-safety safety 求値。
    field_values: {gate_id: gate-content-safety, gate_kind: safety}
    related_node_ids: [ControlGate, Gate, DownstreamOperation]
    source_claims: [claim-control-gate-001]
    synthetic: false
  - id: control-gate-opa-budget
    labels:
      zh: OPA 预算控制门
      en: OPA budget control gate
      ja: OPA 予算コントロールゲート
    descriptions:
      zh: ControlGate gate:budget-check gate_kind=control、decision_function_ref=opa:bundle/budget/check@v2；Rego input.spend_usd <= input.budget_usd 求值 allow，超支返回 block 与 GateOutcome rationale_ref=budget-exceeded。
      en: ControlGate gate:budget-check decision_function_ref=opa:bundle/budget/check@v2 evaluates input.spend_usd<=budget_usd; overspend returns block GateOutcome rationale_ref=budget-exceeded.
      ja: OPA budget/check@v2 が ControlGate gate:budget-check を求値。
    field_values: {gate_id: gate:budget-check, gate_kind: control, decision_function_ref: opa:bundle/budget/check@v2}
    related_node_ids: [ControlGate, Gate, GateOutcome]
    source_claims: [claim-control-gate-001]
    synthetic: false
'@

foreach ($kv in $blocks.GetEnumerator()) {
    Set-NodeExamples -RelPath $kv.Key -YamlBlock $kv.Value
}

Write-Host "Routing-control rewrite: $($blocks.Count) nodes"
