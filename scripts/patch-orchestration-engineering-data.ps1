$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema'

function Insert-Eng {
    param([string]$Rel, [string]$Block)
    $path = Join-Path $root $Rel
    if (-not (Test-Path $path)) { Write-Warning "Missing $Rel"; return }
    $text = [IO.File]::ReadAllText($path)
    if ($text -match '(?m)^engineering:') { Write-Host "Skip eng (exists): $Rel"; return }
    if ($text -notmatch '(?m)^structure:') { Write-Warning "No structure: $Rel"; return }
    $text = [regex]::Replace($text, '(?m)^structure:', ($Block.TrimEnd() + "`r`nstructure:"), 1)
    [IO.File]::WriteAllText($path, $text)
    Write-Host "Inserted engineering: $Rel"
}

function Append-Sources {
    param([string]$Rel, [string]$Block)
    $path = Join-Path $root $Rel
    if (-not (Test-Path $path)) { return }
    $text = [IO.File]::ReadAllText($path)
    if ($text -match '(?m)^sources:') { Write-Host "Skip sources (exists): $Rel"; return }
    if (-not $text.EndsWith("`n")) { $text += "`r`n" }
    [IO.File]::WriteAllText($path, ($text + $Block))
    Write-Host "Appended sources: $Rel"
}

$lg = @(
    '    - name: LangGraph Graph API', '      url: https://docs.langchain.com/oss/python/langgraph/graph-api', '      description: Documents graph compilation, nodes, edges, and invoke execution.'
    '    - name: LangGraph workflows and agents', '      url: https://docs.langchain.com/oss/python/langgraph/workflows-agents', '      description: Documents composition workflow patterns.'
) -join "`r`n"

function SpecEng($id,$zh,$en,$ja,$in,$out,$claims) {
    $c = ($claims | ForEach-Object { "    - $_" }) -join "`r`n"
    return @"
engineering:
  explanation:
    zh: $zh
    en: $en
    ja: $ja
  typical_input:
    - description:
        zh: 可版本化组合规约输入。
        en: Versioned composition specification input.
        ja: versioned composition specification input。
      format: |-
$in
  typical_output:
    - description:
        zh: 编译器绑定该规约 revision 的快照。
        en: Compiler-bound revision snapshot for the specification.
        ja: compiler が bind する spec revision snapshot。
      format: |-
$out
  reference_implementations:
$lg
  source_claims:
$c
"@
}

# Composition remaining
Insert-Eng 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/node.yaml' (SpecEng 'CompositionPattern' 'CompositionPattern 描述可复用 control_shape 与 join 语义，由多个拓扑引用；LangGraph 图模式是实现，不能把 compiled graph 直接当作 pattern revision。' 'CompositionPattern declares reusable control_shape and join semantics referenced by multiple topologies; LangGraph graph patterns are implementations and a compiled graph is not itself a pattern revision.' 'CompositionPattern は reusable control_shape/join semantics を宣言し複数 topology から参照される。LangGraph graph pattern は implementation です。' '        {"composition_specification_id":"parallel-review","version":"3","control_shape":"fan-out-fan-in"}' '        {"pattern_ref":"parallel-review@3","compiled_control_shape":"fan-out-fan-in","allowed_part_types":["ParallelBranch"]}' @('claim-composition-pattern-001','claim-composition-pattern-002'))

Append-Sources 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/node.yaml' @"
sources:
  - id: langgraph-workflows-agents
    title: LangGraph workflows and agents
    url: https://docs.langchain.com/oss/python/langgraph/workflows-agents
    source_type: official-doc
    relevance: Documents reusable chain, parallel, and orchestrator-worker control shapes.
source_claims:
  - id: claim-composition-pattern-001
    source: langgraph-workflows-agents
    supports: Composition patterns declare reusable control shapes such as sequential chains and fan-out/fan-in joins.
    locator: Workflows and agents
    evidence_kind: design-inference
    confidence: high
  - id: claim-composition-pattern-002
    source: langgraph-workflows-agents
    supports: Concrete topology revisions with entry, exit, and part sets are OrchestrationTopology, not CompositionPattern.
    locator: Workflows and agents, topology versus pattern
    evidence_kind: design-inference
    confidence: high
"@

Insert-Eng 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/OrchestrationTopology/node.yaml' (SpecEng 'OrchestrationTopology' 'OrchestrationTopology 把 entry、exit、part 集合与 pattern_ref 编译为 LangGraph StateGraph；活动记录引用 topology revision，但不把运行态写回拓扑。' 'OrchestrationTopology compiles entry, exit, part set, and pattern_ref into a LangGraph StateGraph; activities reference a topology revision without writing runtime state back into topology.' 'OrchestrationTopology は entry/exit/part set/pattern_ref を LangGraph StateGraph にコンパイルする。activity は topology revision を参照する。' '        {"topology_id":"report-topology","version":"4","entry_part_ref":"intake","exit_part_ref":"publish","pattern_ref":"parallel-review@3","part_refs":["section-finance","section-ops","synthesizer"]}' '        {"topology_ref":"report-topology@4","compiled_graph_id":"graph-report-v4","nodes":["intake","section_finance","section_ops","synthesizer","publish"]}' @('claim-orchestration-topology-001','claim-orchestration-topology-002'))

Append-Sources 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/OrchestrationTopology/node.yaml' @"
sources:
  - id: langgraph-graph-api
    title: LangGraph Graph API
    url: https://docs.langchain.com/oss/python/langgraph/graph-api
    source_type: official-doc
    relevance: Documents StateGraph compilation from nodes, edges, and entry points.
source_claims:
  - id: claim-orchestration-topology-001
    source: langgraph-graph-api
    supports: Orchestration topology revisions bind concrete parts, entry, exit, and pattern references into a compilable graph structure.
    locator: Graph API, StateGraph compilation
    evidence_kind: design-inference
    confidence: high
  - id: claim-orchestration-topology-002
    source: langgraph-graph-api
    supports: A topology revision is identified by immutable structural parts rather than one run's dynamic node status.
    locator: Graph API invoke versus graph definition
    evidence_kind: design-inference
    confidence: high
  - id: claim-orchestration-topology-003
    source: langgraph-graph-api
    supports: Runtime activity state showing completed or failed nodes belongs to CompositionActivity, not a new topology revision.
    locator: Graph API execution trace
    evidence_kind: design-inference
    confidence: high
"@

Insert-Eng 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/SynthesisPlan/node.yaml' (SpecEng 'SynthesisPlan' 'SynthesisPlan 为 Synthesis 活动提供输入选择、冲突处理与输出 schema 约束；Agents SDK 结构化输出或 LangGraph synthesize 节点读取 plan revision。' 'SynthesisPlan gives Synthesis activities input selection, conflict handling, and output schema constraints; Agents SDK structured output or LangGraph synthesize nodes read a plan revision.' 'SynthesisPlan は Synthesis activity に input selection/conflict handling/output schema constraint を与える。' '        {"synthesis_plan_id":"report-synthesis","version":"2","input_selection_policy":"all reviewed sections","conflict_resolution":"prefer higher review confidence","output_schema_ref":"report-schema@1"}' '        {"synthesis_plan_ref":"report-synthesis@2","bound_activity":"synthesis-884","output_schema_ref":"report-schema@1"}' @('claim-synthesis-plan-001','claim-synthesis-plan-002'))

Append-Sources 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/SynthesisPlan/node.yaml' @"
sources:
  - id: langgraph-workflows-agents
    title: LangGraph workflows and agents
    url: https://docs.langchain.com/oss/python/langgraph/workflows-agents
    source_type: official-doc
    relevance: Documents orchestrator synthesis steps consolidating specialist outputs.
  - id: openai-agents-running
    title: OpenAI Agents SDK running agents
    url: https://openai.github.io/openai-agents-python/running_agents/
    source_type: official-doc
    relevance: Documents structured synthesis output from agent runs.
source_claims:
  - id: claim-synthesis-plan-001
    source: langgraph-workflows-agents
    supports: Synthesis plans declare how multiple inputs are selected and reconciled before producing a synthesized artifact.
    locator: Workflows and agents, orchestrator synthesis
    evidence_kind: design-inference
    confidence: high
  - id: claim-synthesis-plan-002
    source: openai-agents-running
    supports: Output schema references constrain synthesized artifacts without being the synthesis activity itself.
    locator: Running agents, structured outputs
    evidence_kind: design-inference
    confidence: high
  - id: claim-synthesis-plan-003
    source: langgraph-workflows-agents
    supports: Input selection policies name eligible artifact types or scopes for synthesis.
    locator: Workflows and agents
    evidence_kind: design-inference
    confidence: high
  - id: claim-synthesis-plan-004
    source: langgraph-workflows-agents
    supports: Conflict resolution policies decide treatment of incompatible contributor artifacts.
    locator: Workflows and agents
    evidence_kind: design-inference
    confidence: high
  - id: claim-synthesis-plan-005
    source: openai-agents-running
    supports: Plans are reusable specifications distinct from one synthesis run occurrence.
    locator: Running agents
    evidence_kind: design-inference
    confidence: high
"@

Write-Host 'Batch 1 complete'
