# Fix corrupted parent_relation blocks appended by fix-composition-is-a.ps1 (mojibake / single-line YAML).
$ErrorActionPreference = 'Stop'
$root = Join-Path (Join-Path $PSScriptRoot '..') 'ontology\orchestration-plane\orchestration-composition'

function New-ParentRelationBlock {
  param(
    [string]$ChildId,
    [string]$ParentId,
    [string]$ClaimId,
    [string]$LabelZh,
    [string]$LabelEn,
    [string]$LabelJa,
    [string]$DefZh,
    [string]$DefEn,
    [string]$DefJa,
    [string]$HasPredicate,
    [string]$HasZh,
    [string]$HasEn,
    [string]$HasJa,
    [string]$RationaleZh,
    [string]$RationaleEn,
    [string]$RationaleJa,
    [string]$SourceId = 'langgraph-workflows-agents',
    [string]$Supports
  )
  $childLower = $ChildId.ToLower()
  return @"
parent_relation:
  id: ${ChildId}-is_a-${ParentId}
  predicate: is_a
  target: concept:${ParentId}
  endpoint_order: child-to-parent
  direction: source-to-target
  relation_kind: hierarchy
  labels:
    zh: $LabelZh
    en: $LabelEn
    ja: $LabelJa
  definition:
    zh: $DefZh
    en: $DefEn
    ja: $DefJa
  cardinality:
    source:
      min: 1
      max: 1
    target:
      min: 0
      max: null
  inverse_reading:
    predicate: $HasPredicate
    labels:
      zh: $HasZh
      en: $HasEn
      ja: $HasJa
  conditions: []
  temporal_scope: timeless
  boundary_context: Moonweave local taxonomy.
  constraints: []
  examples: []
  source_claims:
    - $ClaimId
  distinct_fact_rationale:
    zh: $RationaleZh
    en: $RationaleEn
    ja: $RationaleJa
sources:
  - id: langgraph-workflows-agents
    title: LangGraph workflows and agents
    url: https://docs.langchain.com/oss/python/langgraph/workflows-agents
    source_type: official-doc
    relevance: Documents reusable workflow composition patterns used as engineering references.
source_claims:
  - id: $ClaimId
    source: $SourceId
    supports: $Supports
    locator: Workflows and agents
    evidence_kind: design-inference
    confidence: high
"@
}

$fixes = @(
  @{
    Path = 'CompositionSpecification\CompositionPattern\Parallelization\node.yaml'
    Block = (New-ParentRelationBlock 'Parallelization' 'CompositionPattern' 'claim-parallelization-hierarchy' '是组合模式' 'is a composition pattern' '構成 pattern である' 'Parallelization 继承 CompositionPattern 的可复用控制形态角色，并特化为 fan-out/fan-in 并行分支。' 'Parallelization inherits CompositionPattern reusable control-shape role and specializes it as fan-out/fan-in parallel branches.' 'Parallelization は CompositionPattern の reusable control-shape 役割を継承し fan-out/fan-in parallel branch として特化します。' 'has_parallelization' '具有并行化' 'has parallelization' '並列化を持つ' 'is_a 仅陈述类型从属；具体字段与运行事实使用独立字段或关系表达。' 'is_a only states type membership; concrete fields and runtime facts use separate fields or relations.' 'is_a は型従属のみを述べ、具体 field と runtime fact は別 field または relation で表現します。' 'Parallelization is modeled as an is_a specialization of CompositionPattern in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionSpecification\CompositionPattern\Sectioning\node.yaml'
    Block = (New-ParentRelationBlock 'Sectioning' 'CompositionPattern' 'claim-sectioning-hierarchy' '是组合模式' 'is a composition pattern' '構成 pattern である' 'Sectioning 继承 CompositionPattern 的可复用控制形态角色，并特化为分区与 SectionAssignment 绑定。' 'Sectioning inherits CompositionPattern reusable control-shape role and specializes it as partition with SectionAssignment bindings.' 'Sectioning は CompositionPattern の reusable control-shape 役割を継承し partition/SectionAssignment binding として特化します。' 'has_sectioning' '具有分区分派' 'has sectioning' '分区分派を持つ' 'is_a 仅陈述类型从属；具体字段与运行事实使用独立字段或关系表达。' 'is_a only states type membership; concrete fields and runtime facts use separate fields or relations.' 'is_a は型従属のみを述べ、具体 field と runtime fact は別 field または relation で表現します。' 'Sectioning is modeled as an is_a specialization of CompositionPattern in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionSpecification\CompositionPattern\SynthesisPattern\node.yaml'
    Block = (New-ParentRelationBlock 'SynthesisPattern' 'CompositionPattern' 'claim-synthesis-pattern-hierarchy' '是组合模式' 'is a composition pattern' '構成 pattern である' 'SynthesisPattern 继承 CompositionPattern 的可复用控制形态角色，并特化为 many-to-one 综合汇合。' 'SynthesisPattern inherits CompositionPattern reusable control-shape role and specializes it as many-to-one synthesis join.' 'SynthesisPattern は CompositionPattern の reusable control-shape 役割を継承し many-to-one synthesis join として特化します。' 'has_synthesis_pattern' '具有综合模式' 'has synthesis pattern' '総合 pattern を持つ' 'is_a 仅陈述类型从属；具体字段与运行事实使用独立字段或关系表达。' 'is_a only states type membership; concrete fields and runtime facts use separate fields or relations.' 'is_a は型従属のみを述べ、具体 field と runtime fact は別 field または relation で表現します。' 'SynthesisPattern is modeled as an is_a specialization of CompositionPattern in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionSpecification\CompositionPattern\Voting\node.yaml'
    Block = (New-ParentRelationBlock 'Voting' 'CompositionPattern' 'claim-voting-pattern-hierarchy' '是组合模式' 'is a composition pattern' '構成 pattern である' 'Voting 继承 CompositionPattern 的可复用控制形态角色，并特化为 quorum ballot aggregation。' 'Voting inherits CompositionPattern reusable control-shape role and specializes it as quorum ballot aggregation.' 'Voting は CompositionPattern の reusable control-shape 役割を継承し quorum ballot aggregation として特化します。' 'has_voting' '具有投票模式' 'has voting' '投票 pattern を持つ' 'is_a 仅陈述类型从属；具体字段与运行事实使用独立字段或关系表达。' 'is_a only states type membership; concrete fields and runtime facts use separate fields or relations.' 'is_a は型従属のみを述べ、具体 field と runtime fact は別 field または relation で表現します。' 'Voting is modeled as an is_a specialization of CompositionPattern in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionSpecification\AggregationRule\MergeRule\node.yaml'
    Block = (New-ParentRelationBlock 'MergeRule' 'AggregationRule' 'claim-merge-rule-hierarchy' '是聚合规则' 'is an aggregation rule' '集約 rule である' 'MergeRule 继承 AggregationRule 的可复用聚合决策角色，并特化为 keyed merge。' 'MergeRule inherits AggregationRule reusable aggregation-decision role and specializes it as keyed merge.' 'MergeRule は AggregationRule の reusable aggregation-decision 役割を継承し keyed merge として特化します。' 'has_merge_rule' '具有合并规则' 'has merge rule' 'merge rule を持つ' 'is_a 仅陈述类型从属；merge 键与字段冲突策略使用子类型字段表达。' 'is_a only states type membership; merge keys and field-conflict policies use subtype fields.' 'is_a は型従属のみを述べ、merge key と field conflict policy は subtype field で表現します。' 'MergeRule is modeled as an is_a specialization of AggregationRule in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionSpecification\AggregationRule\VotingRule\node.yaml'
    Block = (New-ParentRelationBlock 'VotingRule' 'AggregationRule' 'claim-voting-rule-hierarchy' '是聚合规则' 'is an aggregation rule' '集約 rule である' 'VotingRule 继承 AggregationRule 的可复用聚合决策角色，并特化为 ballot tally。' 'VotingRule inherits AggregationRule reusable aggregation-decision role and specializes it as ballot tally.' 'VotingRule は AggregationRule の reusable aggregation-decision 役割を継承し ballot tally として特化します。' 'has_voting_rule' '具有投票规则' 'has voting rule' 'voting rule を持つ' 'is_a 仅陈述类型从属；quorum 与 majority 参数使用子类型字段表达。' 'is_a only states type membership; quorum and majority parameters use subtype fields.' 'is_a は型従属のみを述べ、quorum/majority parameter は subtype field で表現します。' 'VotingRule is modeled as an is_a specialization of AggregationRule in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionArtifact\CompositionOutput\node.yaml'
    Block = (New-ParentRelationBlock 'CompositionOutput' 'CompositionArtifact' 'claim-composition-output-hierarchy' '是组合工件' 'is a composition artifact' 'composition artifact である' 'CompositionOutput 继承 CompositionArtifact 的不可变工件角色，并特化为活动输出契约绑定。' 'CompositionOutput inherits CompositionArtifact immutable-artifact role and specializes it with output-contract bindings.' 'CompositionOutput は CompositionArtifact の immutable artifact 役割を継承し output contract binding として特化します。' 'has_composition_output' '具有组合输出' 'has composition output' 'composition output を持つ' 'is_a 仅陈述类型从属；输出契约与产生活动引用使用子类型字段表达。' 'is_a only states type membership; output contract and producer activity refs use subtype fields.' 'is_a は型従属のみを述べ、output contract/producer activity ref は subtype field で表現します。' 'CompositionOutput is modeled as an is_a specialization of CompositionArtifact in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionArtifact\SynthesisInput\node.yaml'
    Block = (New-ParentRelationBlock 'SynthesisInput' 'CompositionArtifact' 'claim-synthesis-input-hierarchy' '是组合工件' 'is a composition artifact' 'composition artifact である' 'SynthesisInput 继承 CompositionArtifact 的不可变工件角色，并特化为 Synthesis 消费的输入工件。' 'SynthesisInput inherits CompositionArtifact immutable-artifact role and specializes it as input consumed by Synthesis.' 'SynthesisInput は CompositionArtifact の immutable artifact 役割を継承し Synthesis が consume する input として特化します。' 'has_synthesis_input' '具有综合输入' 'has synthesis input' 'synthesis input を持つ' 'is_a 仅陈述类型从属；contributor 与 section scope 使用子类型字段表达。' 'is_a only states type membership; contributor and section scope use subtype fields.' 'is_a は型従属のみを述べ、contributor/section scope は subtype field で表現します。' 'SynthesisInput is modeled as an is_a specialization of CompositionArtifact in Moonweave composition semantics.')
  },
  @{
    Path = 'CompositionArtifact\CompositionOutput\SynthesisOutput\node.yaml'
    Block = (New-ParentRelationBlock 'SynthesisOutput' 'CompositionOutput' 'claim-synthesis-output-hierarchy' '是组合输出' 'is a composition output' 'composition output である' 'SynthesisOutput 继承 CompositionOutput 的输出契约角色，并特化为 Synthesis 计划与 trace manifest 绑定。' 'SynthesisOutput inherits CompositionOutput output-contract role and specializes it with synthesis plan and trace manifest bindings.' 'SynthesisOutput は CompositionOutput の output contract 役割を継承し synthesis plan/trace manifest binding として特化します。' 'has_synthesis_output' '具有综合输出' 'has synthesis output' 'synthesis output を持つ' 'is_a 仅陈述类型从属；plan 与 trace manifest 引用使用子类型字段表达。' 'is_a only states type membership; plan and trace manifest refs use subtype fields.' 'is_a は型従属のみを述べ、plan/trace manifest ref は subtype field で表現します。' 'SynthesisOutput is modeled as an is_a specialization of CompositionOutput in Moonweave composition semantics.')
  }
)

foreach ($fix in $fixes) {
  $path = Join-Path $root $fix.Path
  if (-not (Test-Path $path)) { Write-Warning "Missing $path"; continue }
  $text = [IO.File]::ReadAllText($path)
  if ($text -notmatch '(?ms)^parent_relation:') { Write-Warning "No parent_relation in $path"; continue }
  $text = [regex]::Replace($text, '(?ms)^parent_relation:.*?^sources:', ($fix.Block.TrimEnd() + "`r`n"), 1)
  # Fix corrupted instance example rationale if present
  $text = $text -replace 'why_valid_or_invalid: \{ zh: 鐖\?control_shape[^\}]+\}', 'why_valid_or_invalid: { zh: 父 control_shape 与子字段齐全。, en: Parent control_shape and child fields complete., ja: 親 control_shape と子 field が揃っています。 }'
  [IO.File]::WriteAllText($path, $text)
  Write-Host "Fixed $path"
}

Write-Host 'parent_relation fix complete.'
