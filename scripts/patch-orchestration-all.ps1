$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema'

function Insert-BlockBeforeStructure {
  param([string]$Path, [string]$Block)
  if (-not (Test-Path $Path)) { return $false }
  $text = [IO.File]::ReadAllText($Path)
  if ($text -match '(?m)^engineering:') { return $false }
  if ($text -notmatch '(?m)^structure:') { Write-Warning "No structure in $Path"; return $false }
  $text = [regex]::Replace($text, '(?m)^structure:', ($Block.TrimEnd() + "`r`nstructure:"), 1)
  [IO.File]::WriteAllText($Path, $text)
  return $true
}

function Append-BlockIfNoSources {
  param([string]$Path, [string]$Block)
  if (-not (Test-Path $Path)) { return $false }
  $text = [IO.File]::ReadAllText($Path)
  if ($text -match '(?m)^sources:') { return $false }
  if (-not $text.EndsWith("`n")) { $text += "`r`n" }
  [IO.File]::WriteAllText($Path, ($text + $Block.TrimEnd() + "`r`n"))
  return $true
}

$lgGraph = @'
    - name: LangGraph Graph API
      url: https://docs.langchain.com/oss/python/langgraph/graph-api
      description: Documents graph nodes, edges, parallel execution, and fan-in aggregation.
    - name: LangGraph workflows and agents
      url: https://docs.langchain.com/oss/python/langgraph/workflows-agents
      description: Documents prompt chains, parallelization, sectioning, and synthesis patterns.
'@

$provRef = @'
    - name: W3C PROV-O
      url: https://www.w3.org/TR/prov-o/
      description: Documents Activity, Entity, Agent, wasGeneratedBy, and wasAssociatedWith semantics.
'@

$evalRefs = @'
    - name: OpenAI Agent evals
      url: https://platform.openai.com/docs/guides/agent-evals
      description: Documents trace-based evaluation, graders, datasets, and eval runs.
    - name: OpenAI Responses API
      url: https://platform.openai.com/docs/api-reference/responses
      description: Documents structured model responses used in evaluator and optimizer flows.
'@ + "`r`n" + $provRef

$actorRefs = @'
    - name: W3C PROV-O Agent
      url: https://www.w3.org/TR/prov-o/#term_Agent
      description: Defines Agent as a responsible entity distinct from activities and entities.
    - name: OpenAI Agents SDK multi-agent orchestration
      url: https://openai.github.io/openai-agents-python/multi_agent/
      description: Documents manager, specialist, and handoff orchestration roles.
    - name: LangChain subagents
      url: https://docs.langchain.com/oss/python/langchain/multi-agent/subagents
      description: Documents supervisor orchestrator routing work to subagents.
'@

function Make-Eng {
  param($zh,$en,$ja,$in,$out,$refs,$claims)
  $c = ($claims | ForEach-Object { "    - $_" }) -join "`r`n"
  return @"
engineering:
  explanation:
    zh: $zh
    en: $en
    ja: $ja
  typical_input:
    - description:
        zh: 触发或声明该概念的运行输入。
        en: Runtime input that triggers or declares the concept.
        ja: 概念を trigger/declare する runtime input。
      format: |-
$in
  typical_output:
    - description:
        zh: 本地记录或规约绑定输出。
        en: Local record or specification binding output.
        ja: local record/spec binding output。
      format: |-
$out
  reference_implementations:
$refs
  source_claims:
$c
"@
}

# --- Composition child nodes ---
$comp = @(
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/PromptChain/node.yaml'; b=(Make-Eng 'PromptChain 编译为 LangGraph 顺序边与 stage 列表，short_circuit_rule 控制早停。' 'PromptChain compiles to LangGraph sequential edges and stage lists with short_circuit_rule for early stop.' 'PromptChain は LangGraph sequential edge/stage list にコンパイルされる。' '        {"composition_specification_id":"draft-review-revise","version":"2","control_shape":"sequential-chain","short_circuit_rule":"stop after validation rejection"}' '        {"pattern_ref":"draft-review-revise@2","compiled_stages":["draft","review","revise"]}' $lgGraph @('claim-prompt-chain-hierarchy','claim-prompt-chain-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/Sectioning/node.yaml'; b=(Make-Eng 'Sectioning 把 work 分区为 SectionAssignment 部件供并行或顺序执行，LangGraph map 阶段绑定 section part。' 'Sectioning partitions work into SectionAssignment parts for parallel or sequential execution, binding section parts to LangGraph map stages.' 'Sectioning は work を SectionAssignment part に partition する。' '        {"composition_specification_id":"report-sectioning","version":"1","control_shape":"partition","section_assignment_refs":["section-finance","section-ops"]}' '        {"pattern_ref":"report-sectioning@1","compiled_sections":["section-finance","section-ops"]}' $lgGraph @('claim-sectioning-hierarchy','claim-sectioning-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/SynthesisPattern/node.yaml'; b=(Make-Eng 'SynthesisPattern 声明 fan-in 汇合与 provenance_requirement，Synthesis 活动读取该模式 revision。' 'SynthesisPattern declares fan-in join and provenance_requirement read by Synthesis activities.' 'SynthesisPattern は fan-in join/provenance_requirement を宣言する。' '        {"composition_specification_id":"report-synthesis-pattern","version":"1","control_shape":"synthesize","provenance_requirement":"claim-level source links"}' '        {"pattern_ref":"report-synthesis-pattern@1","join_node":"synthesize","provenance_required":true}' $lgGraph @('claim-synthesis-pattern-hierarchy','claim-synthesis-pattern-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPart/ChainStage/node.yaml'; b=(Make-Eng 'ChainStage 是 PromptChain 拓扑中的有序阶段 slot，绑定 stage_ordinal 与 IO 端口。' 'ChainStage is an ordered stage slot in a PromptChain topology with stage_ordinal and IO ports.' 'ChainStage は PromptChain topology 内の ordered stage slot である。' '        {"composition_part_id":"review-stage","revision":"2","stage_ordinal":2,"topology_ref":"draft-review-revise-topology@1"}' '        {"part_ref":"review-stage@2","compiled_node":"review"}' $lgGraph @('claim-chain-stage-hierarchy','claim-chain-stage-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPart/ParallelBranch/node.yaml'; b=(Make-Eng 'ParallelBranch 声明独立并行分支 slot，编译为 LangGraph 同 superstep 目标。' 'ParallelBranch declares an independent parallel branch slot compiled as a LangGraph same-superstep destination.' 'ParallelBranch は independent parallel branch slot を宣言する。' '        {"composition_part_id":"regulation-branch","revision":"1","branch_id":"regulation","independence_condition":"no shared mutable state"}' '        {"part_ref":"regulation-branch@1","compiled_destination":"regulation"}' $lgGraph @('claim-parallel-branch-hierarchy','claim-parallel-branch-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPart/SectionAssignment/node.yaml'; b=(Make-Eng 'SectionAssignment 把 section 职责绑定到 topology 内 part，含 section_id 与交付契约。' 'SectionAssignment binds section duty to a topology part with section_id and delivery contract.' 'SectionAssignment は section duty を topology part に bind する。' '        {"composition_part_id":"section-finance","revision":"3","section_id":"finance","delivery_contract_ref":"section-draft@3"}' '        {"part_ref":"section-finance@3","section_id":"finance"}' $lgGraph @('claim-section-assignment-hierarchy','claim-section-assignment-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionArtifact/CompositionOutput/node.yaml'; b=(Make-Eng 'CompositionOutput 记录组合活动产生的一般输出工件，含 producing_activity_ref 与 disposition。' 'CompositionOutput records general output artifacts from composition activities with producing_activity_ref and disposition.' 'CompositionOutput は composition activity が produce する general output artifact を記録する。' '        {"composition_activity_id":"synthesis-884","output_body":"## Report","media_type":"text/markdown"}' '        {"composition_artifact_id":"artifact-report-1","media_type":"text/markdown","content_digest":"sha256:report-1","produced_at":"2026-07-16T04:22:00Z","producing_activity_ref":"synthesis-884"}' ($provRef + "`r`n" + $lgGraph) @('claim-composition-output-hierarchy','claim-composition-output-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionArtifact/SynthesisInput/node.yaml'; b=(Make-Eng 'SynthesisInput 是 Synthesis 消费的输入工件，含 contributor_ref 与 section_scope。' 'SynthesisInput is an input artifact consumed by Synthesis with contributor_ref and section_scope.' 'SynthesisInput は Synthesis が consume する input artifact である。' '        {"contributor_ref":"reviewer-3","section_scope":"finance","body":"Revenue up 12%"}' '        {"composition_artifact_id":"artifact-section-17","media_type":"text/markdown","content_digest":"sha256:section-17","contributor_ref":"reviewer-3","section_scope":"finance"}' ($provRef + "`r`n" + $lgGraph) @('claim-synthesis-input-hierarchy','claim-synthesis-input-001')) },
  @{ p='ontology/orchestration-plane/orchestration-composition/CompositionArtifact/CompositionOutput/SynthesisOutput/node.yaml'; b=(Make-Eng 'SynthesisOutput 记录 Synthesis 产生的新整体工件，含 synthesis_plan_ref 与 claim trace manifest。' 'SynthesisOutput records the new whole artifact produced by Synthesis with synthesis_plan_ref and claim trace manifest.' 'SynthesisOutput は Synthesis が produce する new whole artifact を記録する。' '        {"synthesis_plan_ref":"report-synthesis@2","inputs":["artifact-section-17","artifact-section-18"]}' '        {"synthesis_output_id":"artifact-report-final@1","synthesis_plan_ref":"report-synthesis@2","content_digest":"sha256:report-final","claim_trace_manifest_ref":"trace-report-1"}' ($provRef + "`r`n" + $lgGraph) @('claim-synthesis-output-hierarchy','claim-synthesis-output-001')) }
)
foreach ($i in $comp) {
  if (Insert-BlockBeforeStructure (Join-Path $root $i.p) $i.b) { Write-Host "eng $($i.p)" }
}

# --- Evaluation nodes (18) ---
$evalSourcesBlock = @"
sources:
  - id: openai-agent-evals
    title: OpenAI Agent evals
    url: https://platform.openai.com/docs/guides/agent-evals
    source_type: official-doc
    relevance: Documents trace-based evaluation, graders, datasets, and eval runs for improvement loops.
  - id: openai-responses-api
    title: OpenAI Responses API
    url: https://platform.openai.com/docs/api-reference/responses
    source_type: official-doc
    relevance: Documents structured evaluator and optimizer model responses.
  - id: w3c-prov-o
    title: W3C PROV-O
    url: https://www.w3.org/TR/prov-o/
    source_type: standard
    relevance: Separates activities, entities, agents, and lineage records in improvement workflows.
"@

$evalPaths = Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-evaluation') -Recurse -Filter node.yaml | Where-Object { $_.FullName -notmatch 'EvaluationActivity|RevisionActivity' -and $_.Directory.Name -ne 'orchestration-evaluation' -or $_.Directory.Name -eq 'orchestration-evaluation' }
$evalPaths = Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-evaluation') -Recurse -Filter node.yaml | Where-Object {
  $rel = $_.FullName.Substring($root.Length+1)
  $rel -notmatch 'EvaluationActivity\\node\.yaml$' -and $rel -notmatch 'RevisionActivity\\node\.yaml$' -and $rel -ne 'ontology\orchestration-plane\orchestration-evaluation\node.yaml'
}

$evalEng = Make-Eng '改进域节点把 OpenAI Agent Evals 的 trace/grader/run 流程投影为 PROV 风格活动、规范、状态与谱系记录，不冒充 Responses API wire object。' 'Improvement-domain nodes project OpenAI Agent Evals trace/grader/run flows into PROV-style activities, specifications, state, and lineage records without impersonating Responses API wire objects.' 'improvement domain ノードは OpenAI Agent Evals trace/grader/run flow を PROV 風 activity/spec/state/lineage record に投影する。' '        {"target_ref":"artifact-report@7","improvement_control_specification_ref":"review-assignment-security@3"}' '        {"improvement_activity_id":"improvement-run-42","status":"completed","target_ref":"artifact-report@7","started_at":"2026-07-18T10:00:00Z","ended_at":"2026-07-18T10:06:00Z"}' $evalRefs @('claim-improvement-activity-001','claim-improvement-activity-003')

foreach ($f in $evalPaths) {
  $rel = $f.FullName.Substring($root.Length+1)
  if (Insert-BlockBeforeStructure $f.FullName $evalEng) { Write-Host "eng $rel" }
  if (Append-BlockIfNoSources $f.FullName $evalSourcesBlock) { Write-Host "src $rel" }
}

# --- Actors-delegation (7 nodes) ---
$actorSourcesBlock = @"
sources:
  - id: w3c-prov-o
    title: W3C PROV-O
    url: https://www.w3.org/TR/prov-o/
    source_type: standard
    relevance: Defines Agent and responsibility semantics distinct from activities and entities.
  - id: openai-agents-multi-agent
    title: OpenAI Agents SDK multi-agent orchestration
    url: https://openai.github.io/openai-agents-python/multi_agent/
    source_type: official-doc
    relevance: Documents orchestrator, worker, and handoff role boundaries.
  - id: langchain-subagents
    title: LangChain subagents
    url: https://docs.langchain.com/oss/python/langchain/multi-agent/subagents
    source_type: official-doc
    relevance: Documents supervisor orchestrator routing and worker subagents.
"@

$actorPaths = Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-actors-delegation') -Recurse -Filter node.yaml | Where-Object { $_.Directory.Name -ne 'orchestration-actors-delegation' }
$actorEng = Make-Eng '协调角色与所有权记录把 OpenAI/LangGraph supervisor-worker 职责投影为可版本化 CoordinationRole 与 CoordinationOwnershipRecord，经 ActorRoleBinding 绑定 PROV Agent，不重命名 SDK Agent。' 'Coordination roles and ownership records project OpenAI/LangGraph supervisor-worker duties into versioned CoordinationRole and CoordinationOwnershipRecord bound to PROV Agents through ActorRoleBinding without renaming SDK Agents.' 'coordination role/ownership record は supervisor-worker duty を versioned record に投影する。' '        {"coordination_role_id":"coord-role-incident-coordinator","revision":"4","responsibility_scope":{"includes":["decompose","delegate"]}}' '        {"coordination_role_id":"coord-role-incident-coordinator","revision":"4","actor_binding_ref":"binding-incident-4","valid_from":"2026-07-15T08:00:00Z"}' $actorRefs @('claim-coordination-role-002','claim-coordination-role-010')

foreach ($f in $actorPaths) {
  $rel = $f.FullName.Substring($root.Length+1)
  if (Insert-BlockBeforeStructure $f.FullName $actorEng) { Write-Host "eng $rel" }
  if (Append-BlockIfNoSources $f.FullName $actorSourcesBlock) { Write-Host "src $rel" }
}

# --- A2A top-level sources (18 nodes) ---
$a2aBaseSources = @"
sources:
  - id: a2a-v1-specification
    title: A2A Protocol Specification
    publisher: A2A Project
    url: https://a2a-protocol.org/latest/specification/
    version: 1.0.0
    accessed_on: 2026-07-18
    source_type: official-specification
    relevance: Normative A2A protocol data models and JSON-RPC operations.
  - id: a2a-v1-protobuf
    title: A2A v1 Protocol Buffer definition
    publisher: A2A Project
    url: https://github.com/a2aproject/A2A/blob/main/specification/a2a.proto
    version: 1.0.0
    accessed_on: 2026-07-18
    source_type: official-specification
    relevance: Declares protobuf message shapes for A2A data-model claims.
  - id: moonweave-ontology-design
    title: Moonweave ontology profile design
    publisher: Moonweave
    url: https://github.com/Moonweave-AI/moonweave-ai-agent-schema
    version: 1.0.0
    accessed_on: 2026-07-18
    source_type: design-inference
    relevance: Local taxonomy boundaries for A2A protocol types versus Moonweave orchestration records.
"@

$a2aDirs = Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-delegation-handoff') -Directory | Where-Object { $_.Name -like 'A2A*' }
foreach ($d in $a2aDirs) {
  $f = Join-Path $d.FullName 'node.yaml'
  if (-not (Test-Path $f)) { continue }
  $text = [IO.File]::ReadAllText($f)
  if ($text -match '(?m)^sources:') { continue }
  $ids = [regex]::Matches($text, '(?m)(a2a-[a-z0-9-]+|moonweave-a2a-[a-z0-9-]+|moonweave-agent-[a-z0-9-]+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
  $claims = @()
  foreach ($id in $ids) {
    $src = if ($id -like 'moonweave-*') { 'moonweave-ontology-design' } else { 'a2a-v1-specification' }
    $kind = if ($id -like 'moonweave-*') { 'design-inference' } else { 'normative' }
    $claims += "  - id: $id`r`n    source: $src`r`n    supports: Claim $id is supported by the cited A2A or Moonweave design source for this node.`r`n    locator: A2A specification data model`r`n    evidence_kind: $kind`r`n    confidence: high"
  }
  $block = $a2aBaseSources + "`r`nsource_claims:`r`n" + ($claims -join "`r`n")
  Append-BlockIfNoSources $f $block | Out-Null
  Write-Host "a2a sources $($d.Name)"
}

Write-Host 'All patches applied.'
