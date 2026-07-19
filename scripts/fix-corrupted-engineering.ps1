$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema'

$evalEng = @'
engineering:
  explanation:
    zh: >-
      改进域节点把 OpenAI Agent Evals 的 trace、grader 与 eval run 流程投影为 PROV 风格活动、规范、
      状态与谱系记录。实现用 Responses API 或 Agents SDK 返回结构化评估结果，并在此记录 ImprovementActivity
      发生，不把 API wire object 重命名成本体类型。
    en: >-
      Improvement-domain nodes project OpenAI Agent Evals trace, grader, and eval-run flows into PROV-style
      activities, specifications, state, and lineage records. Implementations use the Responses API or Agents SDK
      for structured evaluation output and record ImprovementActivity occurrences here without renaming API wire
      objects as ontology types.
    ja: >-
      improvement domain ノードは OpenAI Agent Evals の trace/grader/eval run flow を PROV 風 activity/spec/state/
      lineage record に投影する。Responses API または Agents SDK の structured evaluation output を用い API wire object
      を ontology 型に改名しない。
  typical_input:
    - description:
        zh: OpenAI Agent Evals 对候选工件启动评估或改进循环的输入。
        en: OpenAI Agent Evals input starting evaluation or an improvement loop on a candidate artifact.
        ja: 候補 artifact に対する evaluation/improvement loop 開始入力。
      format: |-
        {"target_ref":"artifact-report@7","improvement_control_specification_ref":"review-assignment-security@3","dataset_item_ref":"eval-case-12"}
  typical_output:
    - description:
        zh: 带时间与状态字段的本地改进活动或控制记录。
        en: Local improvement activity or control record with time and status fields.
        ja: time/status field を持つ local improvement/control record。
      format: |-
        {"improvement_activity_id":"improvement-run-42","target_ref":"artifact-report@7","status":"completed","started_at":"2026-07-18T10:00:00Z","ended_at":"2026-07-18T10:06:00Z"}
  reference_implementations:
    - name: OpenAI Agent evals
      url: https://platform.openai.com/docs/guides/agent-evals
      description: Documents trace-based evaluation, graders, datasets, and eval runs.
    - name: OpenAI Responses API
      url: https://platform.openai.com/docs/api-reference/responses
      description: Documents structured model responses used by evaluator and optimizer agents.
    - name: W3C PROV-O
      url: https://www.w3.org/TR/prov-o/
      description: Separates activities, entities, agents, and lineage records.
  source_claims:
    - claim-improvement-activity-001
    - claim-improvement-activity-003
'@

$actorEng = @'
engineering:
  explanation:
    zh: >-
      CoordinationRole 与 CoordinationOwnershipRecord 把 OpenAI/LangGraph supervisor-worker 职责投影为可版本化
      本地规范，经 ActorRoleBinding 绑定 PROV Agent。OpenAI handoff 转移会话控制时更新 ControlOwnership，
      编排者整合最终答案时保留 AnswerOwnership，不重命名 SDK Agent 或 A2A Task。
    en: >-
      CoordinationRole and CoordinationOwnershipRecord project OpenAI/LangGraph supervisor-worker duties into
      versioned local specifications bound to PROV Agents through ActorRoleBinding. OpenAI handoffs update
      ControlOwnership when conversation control transfers; orchestrators retain AnswerOwnership when synthesizing
      final answers, without renaming SDK Agents or A2A Tasks.
    ja: >-
      CoordinationRole/CoordinationOwnershipRecord は supervisor-worker duty を versioned local spec に投影し
      ActorRoleBinding で PROV Agent に bind する。OpenAI handoff は ControlOwnership を更新し orchestrator は
      AnswerOwnership を保持する。SDK Agent や A2A Task に改名しない。
  typical_input:
    - description:
        zh: 声明协调职责、权限范围与 ActorRoleBinding 的角色 revision。
        en: Role revision declaring coordination duties, authority scope, and ActorRoleBinding.
        ja: coordination duty/authority scope/ActorRoleBinding を宣言する role revision。
      format: |-
        {"coordination_role_id":"coord-role-research-orchestrator","revision":"5","responsibility_scope":{"includes":["decompose","delegate","synthesize"]},"authority_scope":{"may":["invoke-specialists"],"must_escalate":["policy-override"]}}
  typical_output:
    - description:
        zh: 绑定到具体 Actor 的有效角色与所有权记录引用。
        en: Effective role and ownership record references bound to a concrete Actor.
        ja: concrete Actor に bind された effective role/ownership record reference。
      format: |-
        {"actor_binding_ref":"binding-incident-4","coordination_role_ref":"coord-role-research-orchestrator@5","control_ownership_ref":"control-own-91","answer_ownership_ref":"answer-own-91"}
  reference_implementations:
    - name: W3C PROV-O Agent
      url: https://www.w3.org/TR/prov-o/#term_Agent
      description: Defines Agent as a responsible entity distinct from activities and entities.
    - name: OpenAI Agents SDK multi-agent orchestration
      url: https://openai.github.io/openai-agents-python/multi_agent/
      description: Documents manager, specialist, and handoff orchestration roles.
    - name: LangChain subagents
      url: https://docs.langchain.com/oss/python/langchain/multi-agent/subagents
      description: Documents supervisor orchestrator routing work to subagents.
  source_claims:
    - claim-coordination-role-002
    - claim-coordination-role-010
'@

function Fix-EngBlock {
  param([string]$Path, [string]$NewBlock)
  $text = [IO.File]::ReadAllText($Path)
  if ($text -notmatch '(?ms)^engineering:.*?^structure:') {
    Write-Warning "No engineering block: $Path"
    return
  }
  $text = [regex]::Replace($text, '(?ms)^engineering:.*?^structure:', ($NewBlock.TrimEnd() + "`r`nstructure:"), 1)
  [IO.File]::WriteAllText($Path, $text)
  Write-Host "fixed $Path"
}

$evalFiles = Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-evaluation') -Recurse -Filter node.yaml | Where-Object {
  $_.FullName -notmatch 'EvaluationActivity\\node\.yaml$' -and $_.FullName -notmatch 'RevisionActivity\\node\.yaml$' -and $_.Directory.Name -ne 'orchestration-evaluation'
}
foreach ($f in $evalFiles) { Fix-EngBlock $f.FullName $evalEng }

$actorFiles = Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-actors-delegation') -Recurse -Filter node.yaml | Where-Object { $_.Directory.Name -ne 'orchestration-actors-delegation' }
foreach ($f in $actorFiles) { Fix-EngBlock $f.FullName $actorEng }

Write-Host 'Fix complete.'
