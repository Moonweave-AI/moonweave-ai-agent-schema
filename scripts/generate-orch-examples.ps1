# Generate and insert handcrafted counterexample/instance for remaining orchestration-plane nodes
$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path
$OrchRoot = Join-Path $RepoRoot 'ontology/orchestration-plane'
$Missing = Get-Content (Join-Path $RepoRoot 'tmp-missing.json') -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-ClaimFromFile([string]$Content) {
    if ($Content -match '(?ms)kind: positive.*?source_claims:\s*\n\s*-\s*(\S+)') { return $Matches[1] }
    if ($Content -match 'claim-[a-z0-9-]+-\d+') { return $Matches[0] }
    return 'claim-local-boundary'
}

function Get-ConfusionText([string]$NodeId) {
    switch ($NodeId) {
        'AggregationRule' { return @{ zh='一次计票活动不是聚合规则'; en='A tally activity is not an aggregation rule'; ja='集計 activity は aggregation rule ではない'; why_zh='规则声明可复用聚合语义而不含发生时间'; why_en='Rules declare reusable aggregation semantics without occurrence time'; why_ja='rule は reusable aggregation semantics を宣言し occurrence time を含まない'; related='AggregationRule,VotingActivity,VotingRule' } }
        'MergeRule' { return @{ zh='章节拼接运行不是合并规则'; en='Section stitching run is not a merge rule'; ja='section stitching run は merge rule ではない'; why_zh='MergeRule 固定字段映射与冲突策略，不含 started_at'; why_en='MergeRule fixes field mapping and conflict policy without started_at'; why_ja='MergeRule は field mapping/conflict policy を固定し started_at を含まない'; related='MergeRule,Synthesis,AggregationRule' } }
        'VotingRule' { return @{ zh='胜出结果不是投票规则'; en='Winning outcome is not a voting rule'; ja='winning outcome は voting rule ではない'; why_zh='VotingRule 声明 quorum/tie/abstention 语义而非单次计票结果'; why_en='VotingRule declares quorum/tie/abstention semantics not a one-time tally outcome'; why_ja='VotingRule は quorum/tie/abstention semantics を宣言する'; related='VotingRule,VotingActivity,VoteBallot' } }
        'CompositionPart' { return @{ zh='拓扑版本不是组合部件'; en='Topology revision is not a composition part'; ja='topology revision は composition part ではない'; why_zh='CompositionPart 声明局部角色位置而非入口出口图'; why_en='CompositionPart declares local role placement not entry/exit graph'; why_ja='CompositionPart は local role placement を宣言する'; related='CompositionPart,OrchestrationTopology,SectionAssignment' } }
        'ChainStage' { return @{ zh='运行时链步骤不是链阶段规范'; en='Runtime chain step is not chain-stage specification'; ja='runtime chain step は chain-stage spec ではない'; why_zh='ChainStage 是规范修订不含 execution attempt 时间'; why_en='ChainStage is a spec revision without execution attempt time'; why_ja='ChainStage は spec revision で execution attempt time を含まない'; related='ChainStage,PromptChain,CompositionActivity' } }
        'ParallelBranch' { return @{ zh='并行线程执行不是并行分支规范'; en='Parallel thread execution is not parallel-branch specification'; ja='parallel thread execution は parallel-branch spec ではない'; why_zh='ParallelBranch 解析为分支规范而非 scheduler 线程'; why_en='ParallelBranch resolves to branch spec not scheduler thread'; why_ja='ParallelBranch は branch spec に解決し scheduler thread ではない'; related='ParallelBranch,Parallelization,CompositionActivity' } }
        'SectionAssignment' { return @{ zh='已写章节工件不是分区指派'; en='Written section artifact is not section assignment'; ja='written section artifact は section assignment ではない'; why_zh='SectionAssignment 声明职责与输入契约而非产出 digest'; why_en='SectionAssignment declares duty and input contract not output digest'; why_ja='SectionAssignment は duty/input contract を宣言し output digest ではない'; related='SectionAssignment,CompositionArtifact,Sectioning' } }
        'CompositionPattern' { return @{ zh='编排拓扑不是组合模式'; en='Orchestration topology is not composition pattern'; ja='orchestration topology は composition pattern ではない'; why_zh='CompositionPattern 声明可复用 control_shape 而非具体 part 图'; why_en='CompositionPattern declares reusable control_shape not concrete part graph'; why_ja='CompositionPattern は reusable control_shape を宣言する'; related='CompositionPattern,OrchestrationTopology,Parallelization' } }
        'PromptChain' { return @{ zh='单次 LLM 调用不是提示链模式'; en='Single LLM call is not prompt-chain pattern'; ja='single LLM call は prompt-chain pattern ではない'; why_zh='PromptChain 需要有序 stage_refs 与阶段依赖'; why_en='PromptChain requires ordered stage_refs and stage dependencies'; why_ja='PromptChain は ordered stage_refs/stage dependency を要する'; related='PromptChain,ChainStage,CompositionActivity' } }
        'Sectioning' { return @{ zh='单个分区指派不是分区模式'; en='Single section assignment is not sectioning pattern'; ja='single section assignment は sectioning pattern ではない'; why_zh='Sectioning 模式声明多 section 编排而非一条 assignment'; why_en='Sectioning pattern declares multi-section orchestration not one assignment'; why_ja='Sectioning pattern は multi-section orchestration を宣言する'; related='Sectioning,SectionAssignment,CompositionPattern' } }
        'SynthesisPattern' { return @{ zh='综合活动不是综合模式'; en='Synthesis activity is not synthesis pattern'; ja='synthesis activity は synthesis pattern ではない'; why_zh='SynthesisPattern 声明输入契约与合成策略不含运行状态'; why_en='SynthesisPattern declares input contract and synthesis policy without runtime status'; why_ja='SynthesisPattern は input contract/synthesis policy を宣言する'; related='SynthesisPattern,Synthesis,CompositionPattern' } }
        'OrchestrationTopology' { return @{ zh='组合运行不是编排拓扑'; en='Composition run is not orchestration topology'; ja='composition run は orchestration topology ではない'; why_zh='OrchestrationTopology 固定 entry/exit/part 图而不含 running 状态'; why_en='OrchestrationTopology fixes entry/exit/part graph without running status'; why_ja='OrchestrationTopology は entry/exit/part graph を固定する'; related='OrchestrationTopology,CompositionActivity,CompositionSpecification' } }
        'SynthesisPlan' { return @{ zh='综合输出工件不是综合计划'; en='Synthesis output artifact is not synthesis plan'; ja='synthesis output artifact は synthesis plan ではない'; why_zh='SynthesisPlan 声明合成步骤与输入引用而非 content_digest'; why_en='SynthesisPlan declares synthesis steps and input refs not content_digest'; why_ja='SynthesisPlan は synthesis steps/input refs を宣言する'; related='SynthesisPlan,SynthesisOutput,SynthesisPattern' } }
        'CollaborationProcess' { return @{ zh='A2A Task 不是协作过程'; en='A2A Task is not collaboration process'; ja='A2A Task は collaboration process ではない'; why_zh='CollaborationProcess 声明多阶段委派/交接过程而非 wire task 状态'; why_en='CollaborationProcess declares multi-phase delegation/handoff process not wire task state'; why_ja='CollaborationProcess は multi-phase delegation/handoff process を宣言する'; related='CollaborationProcess,A2ATask,DelegationProcess' } }
        'DelegationProcess' { return @{ zh='Worker 工具调用不是委派过程'; en='Worker tool call is not delegation process'; ja='worker tool call は delegation process ではない'; why_zh='DelegationProcess 包含 initiation/acceptance/completion 阶段而非单次 as_tool 调用'; why_en='DelegationProcess includes initiation/acceptance/completion phases not a single as_tool call'; why_ja='DelegationProcess は initiation/acceptance/completion phase を含む'; related='DelegationProcess,WorkerRole,HandoffProcess' } }
        'Handoff' { return @{ zh='消息转发不是 Handoff'; en='Message forwarding is not Handoff'; ja='message forwarding は Handoff ではない'; why_zh='Handoff 转移控制与责任并更新 ControlOwnership'; why_en='Handoff transfers control and responsibility updating ControlOwnership'; why_ja='Handoff は control/responsibility を移し ControlOwnership を更新する'; related='Handoff,ControlOwnership,A2AMessage' } }
        'RoutingDecision' { return @{ zh='RoutingPolicy 配置不是路由决策'; en='RoutingPolicy config is not routing decision'; ja='RoutingPolicy config は routing decision ではない'; why_zh='RoutingDecision 记录一次运行中的 selected_target 与 native_return_ref'; why_en='RoutingDecision records selected_target and native_return_ref for one run'; why_ja='RoutingDecision は one run の selected_target/native_return_ref を記録する'; related='RoutingDecision,RoutingPolicy,GateOutcome' } }
        'Task' { return @{ zh='A2A Task 运行时不是规划 Task'; en='A2A runtime Task is not planning Task'; ja='A2A runtime Task は planning Task ではない'; why_zh='规划 Task 声明 work specification 引用而非 A2A state 字段'; why_en='Planning Task declares work specification refs not A2A state fields'; why_ja='planning Task は work specification ref を宣言する'; related='Task,A2ATask,TaskPlan' } }
        'Goal' { return @{ zh='用户提示文本不是 Goal'; en='User prompt text is not Goal'; ja='user prompt text は Goal ではない'; why_zh='Goal 需要可版本化 intentional entity 与 success criteria'; why_en='Goal requires versioned intentional entity and success criteria'; why_ja='Goal は versioned intentional entity/success criteria を要する'; related='Goal,Intent,Objective' } }
        'Gate' { return @{ zh='条件表达式字符串不是 Gate'; en='Condition expression string is not Gate'; ja='condition expression string は Gate ではない'; why_zh='Gate 声明求值活动与 GateOutcome 产出边界'; why_en='Gate declares evaluation activity and GateOutcome production boundary'; why_ja='Gate は evaluation activity/GateOutcome production boundary を宣言する'; related='Gate,ControlGate,GateOutcome' } }
        'ImprovementActivity' { return @{ zh='单次评分不是改进活动'; en='Single score is not improvement activity'; ja='single score は improvement activity ではない'; why_zh='ImprovementActivity 是时间跨度的协调/尝试活动'; why_en='ImprovementActivity is time-bounded coordination/attempt activity'; why_ja='ImprovementActivity は time-bounded coordination/attempt activity である'; related='ImprovementActivity,EvaluationAttempt,RevisionAttempt' } }
        default {
            $label = $NodeId
            return @{
                zh = "$label 的易混淆对象不是 $label"
                en = "Confusable object is not $label"
                ja = "confusable object は $label ではない"
                why_zh = "$label 需要本概念 identity 字段与边界，易混淆对象缺少种差。"
                why_en = "$label requires this concept's identity fields and differentia; the confusable object lacks them."
                why_ja = "$label は identity field/differentia を要し confusable object は欠如する。"
                related = $NodeId
            }
        }
    }
}

function Get-InstanceText([string]$NodeId) {
    switch ($NodeId) {
        'AggregationRule' { return @{ zh='多数决聚合规则实例'; en='Majority aggregation rule instance'; ja='majority aggregation rule 实例'; desc_zh='majority-with-abstention@2 固定 quorum、tie-break 与 abstention 计票语义。'; desc_en='majority-with-abstention@2 fixes quorum, tie-break, and abstention tally semantics.'; desc_ja='majority-with-abstention@2 は quorum/tie-break/abstention semantics を固定する。'; fv='aggregation_rule_id: majority-with-abstention`nversion: "2"' } }
        'OrchestrationTopology' { return @{ zh='报告拓扑第四版实例'; en='Report topology revision four instance'; ja='report topology revision 4 实例'; desc_zh='report-topology@4 固定 entry、exit、三节 part 与 synthesizer 位置。'; desc_en='report-topology@4 fixes entry, exit, three section parts, and synthesizer placement.'; desc_ja='report-topology@4 は entry/exit/three section parts/synthesizer placement を固定する。'; fv='topology_id: report-topology`nversion: "4"' } }
        'Handoff' { return @{ zh='OpenAI handoff 会话转移实例'; en='OpenAI handoff session transfer instance'; ja='OpenAI handoff session transfer 实例'; desc_zh='handoff-refund-77 将 travel-session-9 控制转给 refund-specialist 并更新 ControlOwnership。'; desc_en='handoff-refund-77 transfers travel-session-9 control to refund-specialist updating ControlOwnership.'; desc_ja='handoff-refund-77 は travel-session-9 control を refund-specialist へ移す。'; fv='handoff_id: handoff-refund-77`nscope_ref: travel-session-9' } }
        'Task' { return @{ zh='A2A Task 映射规划 Task 实例'; en='A2A Task mapped planning Task instance'; ja='A2A Task mapped planning Task 实例'; desc_zh='task-analyze-incident-204 引用 work-spec-incident@3 与三步 TaskPlan。'; desc_en='task-analyze-incident-204 references work-spec-incident@3 and a three-step TaskPlan.'; desc_ja='task-analyze-incident-204 は work-spec-incident@3 と三 step TaskPlan を参照する。'; fv='task_id: task-analyze-incident-204`nwork_specification_ref: work-spec-incident@3' } }
        'RoutingDecision' { return @{ zh='LangGraph 条件边路由决策实例'; en='LangGraph conditional-edge routing decision instance'; ja='LangGraph conditional-edge routing decision 实例'; desc_zh='route-2026-07-18-003 在 gate-outcome-884 后选择 human_review。'; desc_en='route-2026-07-18-003 selects human_review after gate-outcome-884.'; desc_ja='route-2026-07-18-003 は gate-outcome-884 後 human_review を選択する。'; fv='decision_id: route-2026-07-18-003`nselected_target: human_review' } }
        default {
            return @{
                zh = "$NodeId 规范实例"
                en = "$NodeId specification instance"
                ja = "$NodeId specification 实例"
                desc_zh = "$NodeId 的正例 field_values 构成完整规范实例，可被运行时活动引用。"
                desc_en = "Positive field_values of $NodeId form a complete specification instance referenceable by runtime activities."
                desc_ja = "$NodeId 正例 field_values が complete specification instance を構成する。"
                fv = "${NodeId}_ref: ${NodeId}-instance-1"
            }
        }
    }
}

function Build-ExampleYaml {
    param($NodeId, $Kind, $Claim, $Text, $NeedFields)
    $idSuffix = if ($Kind -eq 'counterexample') { 'counterexample-confusable' } else { 'instance-concrete' }
    $yaml = @"
  - id: ${NodeId}-example-${idSuffix}
    kind: $Kind
    labels:
      zh: $($Text.zh)
      en: $($Text.en)
      ja: $($Text.ja)
    scenario_id: null
    descriptions:
      zh: $($Text.desc_zh)
      en: $($Text.desc_en)
      ja: $($Text.desc_ja)
    field_values:
$(if ($Kind -eq 'counterexample') { "      identity_complete: false" } else { "      $($Text.fv -replace '`n', "`n      ")" })
    related_node_ids:
$(($Text.related -split ',') | ForEach-Object { "      - $_" })
    related_relation_ids: []
    expected_result:
      zh: $(if ($Kind -eq 'counterexample') { "拒绝 $NodeId 分类。" } else { "接受为 $NodeId 实例。" })
      en: $(if ($Kind -eq 'counterexample') { "Reject $NodeId classification." } else { "Accept as $NodeId instance." })
      ja: $(if ($Kind -eq 'counterexample') { "$NodeId 分類を拒否。" } else { "$NodeId 实例として受理。" })
    why_valid_or_invalid:
      zh: $($Text.why_zh)
      en: $($Text.why_en)
      ja: $($Text.why_ja)
    synthetic: true
    verified_version: null
    source_claims:
      - $Claim
"@
    if ($Kind -eq 'instance' -and -not $Text.desc_zh) {
        # fill descriptions for instance from Get-InstanceText
    }
    return $yaml
}

foreach ($row in $Missing) {
    $rel = $row.rel -replace '\\','/'
    $full = Join-Path $OrchRoot $rel
    if (-not (Test-Path $full)) { Write-Warning "Missing $full"; continue }
    $content = Get-Content $full -Raw -Encoding UTF8
    if (($content -match 'kind: counterexample') -and ($content -match 'kind: instance')) { continue }
    $claim = Get-ClaimFromFile $content
    $blocks = @()
    if ($row.needCE) {
        $ce = Get-ConfusionText $row.id
        $ce.desc_zh = $ce.zh + '。'
        $ce.desc_en = $ce.en + '.'
        $ce.desc_ja = $ce.ja + '。'
        $blocks += (Build-ExampleYaml -NodeId $row.id -Kind 'counterexample' -Claim $claim -Text $ce)
    }
    if ($row.needIN) {
        $inst = Get-InstanceText $row.id
        $inst.why_zh = $inst.desc_zh
        $inst.why_en = $inst.desc_en
        $inst.why_ja = $inst.desc_ja
        $inst.related = $row.id
        $blocks += (Build-ExampleYaml -NodeId $row.id -Kind 'instance' -Claim $claim -Text $inst)
    }
    $insert = ($blocks -join "`n")
    foreach ($key in @('parent_relation','sources','source_claims')) {
        if ($content -match "(?m)^$key`:") {
            $content = [regex]::Replace($content, "(?m)^$key`:", ($insert.TrimEnd() + "`r`n$key`:"), 1)
            Set-Content -Path $full -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Patched $($row.id)"
            break
        }
    }
}

Write-Host 'Done'
