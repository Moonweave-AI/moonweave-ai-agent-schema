# Patch orchestration-plane engineering sections, fix corrupted sources blocks, add A2A top-level sources
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Fix-CorruptedSources {
    param([string]$Path)
    $text = [IO.File]::ReadAllText($Path)
    if ($text -match 'relation 銇ц〃鐝俱仐銇俱仚銆\?sources:') {
        $text = $text -replace 'relation 銇ц〃鐝俱仐銇俱仚銆\?sources:', "relation 銇ц〃鐝俱仐銇俱仚銆`r`nsources:"
        [IO.File]::WriteAllText($Path, $text)
    }
}

function Insert-Engineering {
    param([string]$Path, [string]$Block)
    $text = [IO.File]::ReadAllText($Path)
    if ($text -match '(?m)^engineering:') { return $false }
    $text = $text -replace '(?m)^structure:', ($Block.TrimEnd() + "`r`nstructure:")
    [IO.File]::WriteAllText($Path, $text)
    return $true
}

function Append-IfMissing {
    param([string]$Path, [string]$Block)
    $text = [IO.File]::ReadAllText($Path)
    if ($text -match '(?m)^sources:') { return $false }
    if (-not $text.EndsWith("`n")) { $text += "`r`n" }
    [IO.File]::WriteAllText($Path, ($text + $Block))
    return $true
}

$provSources = @"
sources:
  - id: w3c-prov-o
    title: W3C PROV-O
    url: https://www.w3.org/TR/prov-o/
    source_type: standard
    relevance: Separates activities, entities, agents, and provenance records.
"@

$provEntityClaim = @"
  - id: claim-prov-entity
    source: w3c-prov-o
    supports: PROV-O Entity records are immutable information objects with stable identity distinct from activities that use or generate them.
    locator: PROV-O Entity model
    evidence_kind: design-inference
    confidence: high
"@

$langgraphSources = @"
sources:
  - id: langgraph-graph-api
    title: LangGraph Graph API
    url: https://docs.langchain.com/oss/python/langgraph/graph-api
    source_type: official-doc
    relevance: Documents StateGraph nodes, edges, compilation, and execution topology.
  - id: langgraph-workflows-agents
    title: LangGraph workflows and agents
    url: https://docs.langchain.com/oss/python/langgraph/workflows-agents
    source_type: official-doc
    relevance: Documents prompt chains, parallelization, and orchestrator-worker patterns.
"@

$evalSources = @"
sources:
  - id: openai-agent-evals
    title: OpenAI Agent evals
    url: https://platform.openai.com/docs/guides/agent-evals
    source_type: official-doc
    relevance: Documents trace-based evaluation, graders, datasets, and eval runs for agent improvement loops.
  - id: openai-responses-api
    title: OpenAI Responses API
    url: https://platform.openai.com/docs/api-reference/responses
    source_type: official-doc
    relevance: Documents structured model responses used by evaluator and optimizer agents.
  - id: w3c-prov-o
    title: W3C PROV-O
    url: https://www.w3.org/TR/prov-o/
    source_type: standard
    relevance: Separates activities, entities, agents, and derivation lineage records.
"@

$actorsSources = @"
sources:
  - id: w3c-prov-o
    title: W3C PROV-O
    url: https://www.w3.org/TR/prov-o/
    source_type: standard
    relevance: Defines Agent as a responsible entity distinct from activities and entities.
  - id: openai-agents-agents
    title: OpenAI Agents SDK agents
    url: https://openai.github.io/openai-agents-python/agents/
    source_type: official-doc
    relevance: Documents Agent definitions, instructions, and tool access as capability sources.
  - id: openai-agents-multi-agent
    title: OpenAI Agents SDK multi-agent orchestration
    url: https://openai.github.io/openai-agents-python/multi_agent/
    source_type: official-doc
    relevance: Documents manager, specialist, and handoff orchestration patterns.
  - id: langchain-subagents
    title: LangChain subagents documentation
    url: https://docs.langchain.com/oss/python/langchain/multi-agent/subagents
    source_type: official-doc
    relevance: Documents supervisor orchestrator routing work to subagents.
"@

$a2aSourcesBase = @"
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
    relevance: Declares protobuf message shapes referenced by A2A data-model claims.
  - id: moonweave-ontology-design
    title: Moonweave ontology profile design
    publisher: Moonweave
    url: https://github.com/Moonweave-AI/moonweave-ai-agent-schema
    version: 1.0.0
    accessed_on: 2026-07-18
    source_type: design-inference
    relevance: Local taxonomy boundaries for A2A protocol types versus Moonweave orchestration records.
"@

# Generic engineering block builder
function Eng-Spec {
    param($zh, $en, $ja, $inFmt, $outFmt, $refs, $claims)
    $refYaml = ($refs | ForEach-Object { "    - name: $($_.name)`r`n      url: $($_.url)`r`n      description: $($_.desc)" }) -join "`r`n"
    $claimYaml = ($claims | ForEach-Object { "    - $_" }) -join "`r`n"
    return @"
engineering:
  explanation:
    zh: $zh
    en: $en
    ja: $ja
  typical_input:
    - description:
        zh: 可版本化组合/控制规约输入。
        en: Versioned composition or control specification input.
        ja: versioned composition/control specification input。
      format: |-
$inFmt
  typical_output:
    - description:
        zh: 编译器或运行时在应用该规约时绑定的 revision 快照。
        en: Revision snapshot bound when compiler or runtime applies the specification.
        ja: compiler/runtime が spec を適用するとき bind する revision snapshot。
      format: |-
$outFmt
  reference_implementations:
$refYaml
  source_claims:
$claimYaml
"@
}

function Eng-Activity {
    param($zh, $en, $ja, $inFmt, $outFmt, $refs, $claims)
    $refYaml = ($refs | ForEach-Object { "    - name: $($_.name)`r`n      url: $($_.url)`r`n      description: $($_.desc)" }) -join "`r`n"
    $claimYaml = ($claims | ForEach-Object { "    - $_" }) -join "`r`n"
    return @"
engineering:
  explanation:
    zh: $zh
    en: $en
    ja: $ja
  typical_input:
    - description:
        zh: 触发该活动的候选对象与适用规范引用。
        en: Candidate object and applicable specification references that trigger the activity.
        ja: activity を trigger する candidate と applicable specification reference。
      format: |-
$inFmt
  typical_output:
    - description:
        zh: 带时间与状态字段的本地活动发生记录。
        en: Local activity occurrence record with time and status fields.
        ja: time/status field を持つ local activity occurrence record。
      format: |-
$outFmt
  reference_implementations:
$refYaml
  source_claims:
$claimYaml
"@
}

function Eng-Entity {
    param($zh, $en, $ja, $inFmt, $outFmt, $refs, $claims)
    $refYaml = ($refs | ForEach-Object { "    - name: $($_.name)`r`n      url: $($_.url)`r`n      description: $($_.desc)" }) -join "`r`n"
    $claimYaml = ($claims | ForEach-Object { "    - $_" }) -join "`r`n"
    return @"
engineering:
  explanation:
    zh: $zh
    en: $en
    ja: $ja
  typical_input:
    - description:
        zh: 产生或消费该工件的运行输入摘要。
        en: Runtime input digest that produces or consumes the artifact.
        ja: artifact を produce/consume する runtime input digest。
      format: |-
$inFmt
  typical_output:
    - description:
        zh: 带稳定标识、摘要与产生时间的不可变工件记录。
        en: Immutable artifact record with stable identity, digest, and production time.
        ja: stable identity/digest/production time を持つ immutable artifact record。
      format: |-
$outFmt
  reference_implementations:
$refYaml
  source_claims:
$claimYaml
"@
}

$lgRefs = @(
    @{ name='LangGraph Graph API'; url='https://docs.langchain.com/oss/python/langgraph/graph-api'; desc='Documents graph compilation, nodes, edges, and invoke execution.' }
    @{ name='LangGraph workflows and agents'; url='https://docs.langchain.com/oss/python/langgraph/workflows-agents'; desc='Documents composition workflow patterns.' }
)
$provRef = @(@{ name='W3C PROV-O'; url='https://www.w3.org/TR/prov-o/'; desc='Documents Entity, Activity, Agent, and wasGeneratedBy semantics.' })

$patches = @(
    @{
        path='ontology/orchestration-plane/orchestration-composition/CompositionSpecification/AggregationRule/MergeRule/node.yaml'
        eng=Eng-Spec 'MergeRule 编译为 keyed-merge 函数：按 merge_key 归并记录，duplicate_policy 处理重复项，field_conflict_policy 处理字段冲突，order_policy 固定输出顺序。LangGraph reducer 是实现，不能从一次 state merge 反推规则 revision。' 'MergeRule compiles to a keyed-merge function using merge_key, duplicate_policy, field_conflict_policy, and order_policy. LangGraph reducers are implementations and cannot infer a rule revision from one state merge.' 'MergeRule は merge_key・duplicate_policy・field_conflict_policy・order_policy による keyed-merge function にコンパイルされる。LangGraph reducer は implementation であり rule revision は推論できない。' '        {"composition_specification_id":"reviewed-section-merge","version":"4","merge_key":"section_id","aggregation_method":"keyed-merge","duplicate_policy":"reject unless provenance proves explicit supersession"}' '        {"merge_rule_ref":"reviewed-section-merge@4","merge_fn":"keyed_merge","params":{"merge_key":"section_id","order_policy":"ascending section_ordinal"},"input_refs":["artifact-section-17","artifact-section-18"]}' $lgRefs @('claim-merge-rule-hierarchy','claim-merge-rule-002')
    }
)

Write-Host "Script scaffold created; extend patches array for full run."
