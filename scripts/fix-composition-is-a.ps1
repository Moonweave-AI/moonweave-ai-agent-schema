# Append missing is_a parent_relation blocks and parent required fields for composition hierarchy children.
$ErrorActionPreference = 'Stop'
$root = Join-Path (Join-Path $PSScriptRoot '..') 'ontology\orchestration-plane\orchestration-composition'

function Add-ParentFields([string]$text, [string[]]$fieldBlocks) {
  if ($text -match '(?ms)^  fields:\s*\r?\n    - id: topology_ref') { return $text }
  if ($text -match '(?ms)^  fields:\s*\r?\n    - id: control_shape') { return $text }
  if ($text -match '(?ms)^  fields:\s*\r?\n    - id: eligible_input_type') { return $text }
  if ($text -match '(?ms)^  fields:\s*\r?\n    - id: composition_artifact_id') { return $text }
  if ($text -match '(?ms)^  fields:\s*\r?\n    - id: output_contract_ref') { return $text }
  $insert = ($fieldBlocks -join "`r`n") + "`r`n"
  return [regex]::Replace($text, '(?m)^  fields:\s*\r?\n', "  fields:`r`n$insert", 1)
}

$partFields = @(
'    - id: topology_ref',
'      labels: { zh: 所属拓扑, en: topology reference, ja: 所属 topology }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 引用定义该部件的不可变 OrchestrationTopology 版本。, en: References the immutable OrchestrationTopology revision defining this part., ja: この部品を定義する immutable OrchestrationTopology revision を参照します。 }',
'      example_value: topology-example@1',
'      source_claims: [claim-composition-part-hierarchy]',
'    - id: local_role',
'      labels: { zh: 局部职责, en: local responsibility, ja: 局所責務 }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 说明该位置在拓扑内接收、变换或汇合什么。, en: States what this position receives, transforms, or joins in the topology., ja: topology 内で何を受け、変換し、join する位置かを示します。 }',
'      example_value: local role example',
'      source_claims: [claim-composition-part-hierarchy]',
'    - id: connection_ports',
'      labels: { zh: 连接端口契约, en: connection-port contracts, ja: 接続 port contract }',
'      datatype: object',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 列出该结构位置可接收和可产生的命名端口及其数据契约。, en: Lists named input and output ports and their data-contract references., ja: named input/output port と data-contract reference を列挙します。 }',
'      example_value: { inputs: [], outputs: [] }',
'      source_claims: [claim-composition-part-hierarchy]'
)

$patternControlField = @(
'    - id: control_shape',
'      labels: { zh: 控制形态, en: control shape, ja: control shape }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 声明可复用控制形态。, en: Declares reusable control shape., ja: reusable control shape を宣言します。 }',
'      example_value: fan-out-fan-in',
'      source_claims: [claim-composition-pattern-hierarchy]'
)

$ruleFields = @(
'    - id: eligible_input_type',
'      labels: { zh: 合格输入类型, en: eligible input type, ja: eligible input type }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 声明可进入本规则的输入语义类型。, en: Declares eligible input semantic type for the rule., ja: rule に入れる input semantic type を宣言します。 }',
'      example_value: CompositionArtifact',
'      source_claims: [claim-aggregation-rule-hierarchy]',
'    - id: aggregation_method',
'      labels: { zh: 聚合方法, en: aggregation method, ja: aggregation method }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 声明聚合算法族。, en: Declares aggregation algorithm family., ja: aggregation algorithm family を宣言します。 }',
'      example_value: collect',
'      source_claims: [claim-aggregation-rule-hierarchy]',
'    - id: completion_policy',
'      labels: { zh: 完成策略, en: completion policy, ja: completion policy }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 规定何时输入集合足以关闭聚合。, en: Specifies when input set is sufficient to close aggregation., ja: input set が aggregation を閉じる条件を規定します。 }',
'      example_value: close when inputs complete',
'      source_claims: [claim-aggregation-rule-hierarchy]',
'    - id: conflict_policy',
'      labels: { zh: 冲突策略, en: conflict policy, ja: conflict policy }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 规定不兼容贡献的处理方式。, en: Specifies handling of incompatible contributions., ja: incompatible contribution の処理方式を規定します。 }',
'      example_value: defer-to-subtype-policy',
'      source_claims: [claim-aggregation-rule-hierarchy]'
)

$artifactFields = @(
'    - id: composition_artifact_id',
'      labels: { zh: 组合工件标识, en: composition-artifact ID, ja: composition artifact ID }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 稳定标识一个不可变组合工件。, en: Stably identifies one immutable composition artifact., ja: immutable composition artifact を安定識別します。 }',
'      example_value: artifact-example-1',
'      source_claims: [claim-composition-artifact-hierarchy]',
'    - id: media_type',
'      labels: { zh: 媒体类型, en: media type, ja: media type }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 声明工件内容的序列化类型。, en: Declares artifact content serialization type., ja: artifact content serialization type を宣言します。 }',
'      example_value: text/markdown',
'      source_claims: [claim-composition-artifact-hierarchy]',
'    - id: content_digest',
'      labels: { zh: 内容摘要, en: content digest, ja: content digest }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 固定工件内容的稳定摘要。, en: Fixes stable digest of artifact content., ja: artifact content の stable digest を固定します。 }',
'      example_value: sha256:example',
'      source_claims: [claim-composition-artifact-hierarchy]',
'    - id: produced_at',
'      labels: { zh: 产生时间, en: produced at, ja: produced at }',
'      datatype: datetime',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 记录工件成为可引用实体的时间。, en: Records when artifact became referenceable., ja: artifact が referenceable になった時刻を記録します。 }',
'      example_value: 2026-07-16T04:21:00Z',
'      source_claims: [claim-composition-artifact-hierarchy]'
)

$outputFields = @(
'    - id: output_contract_ref',
'      labels: { zh: 输出契约引用, en: output-contract reference, ja: output contract ref }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 引用输出声明符合的结构或语义契约版本。, en: References output structural or semantic contract revision., ja: output contract revision を参照します。 }',
'      example_value: decision-schema@2',
'      source_claims: [claim-composition-output-hierarchy]',
'    - id: producer_activity_ref',
'      labels: { zh: 产生活动引用, en: producer-activity reference, ja: producer activity ref }',
'      datatype: string',
'      required: true',
'      cardinality: { min: 1, max: 1 }',
'      definitions: { zh: 引用生成该不可变内容的组合活动。, en: References composition activity that generated this content., ja: content を生成した composition activity を参照します。 }',
'      example_value: activity-example-1',
'      source_claims: [claim-composition-output-hierarchy]'
)

function Append-IfMissing([string]$path, [string]$childId, [string]$parentId, [string]$claimId, [string]$instanceYaml, [string[]]$fieldBlocks) {
  if (-not (Test-Path $path)) { Write-Warning "Missing $path"; return }
  $text = [IO.File]::ReadAllText($path)
  if ($text -match "target: concept:${parentId}") { return }
  $text = Add-ParentFields $text $fieldBlocks
  $suffix = @"

  - id: ${childId}-example-instance-manual-20260719
    kind: instance
$instanceYaml
parent_relation:
  id: ${childId}-is_a-${parentId}
  predicate: is_a
  target: concept:${parentId}
  endpoint_order: child-to-parent
  direction: source-to-target
  relation_kind: hierarchy
  labels:
    zh: 是${parentId}
    en: is a $($parentId.ToLower())
    ja: ${parentId}である
  definition:
    zh: ${childId} 是 ${parentId} 的 Moonweave 本地 is_a 特化。
    en: ${childId} is a Moonweave local is_a specialization of ${parentId}.
    ja: ${childId} は ${parentId} の Moonweave ローカル is_a 特化です。
  cardinality:
    source: { min: 1, max: 1 }
    target: { min: 0, max: null }
  inverse_reading:
    predicate: has_$($childId.ToLower())
    labels: { zh: 具有${childId}, en: has $($childId.ToLower()), ja: ${childId}を持つ }
  conditions: []
  temporal_scope: timeless
  boundary_context: Moonweave local taxonomy.
  constraints: []
  examples: []
  source_claims: [$claimId]
  distinct_fact_rationale:
    zh: is_a 仅陈述类型从属；具体字段与运行事实使用独立字段或关系表达。
    en: is_a only states type membership; concrete fields and runtime facts use separate fields or relations.
    ja: is_a は型従属のみを述べ、具体 field と runtime fact は別 field または relation で表現します。
sources:
  - id: langgraph-workflows-agents
    title: LangGraph workflows and agents
    url: https://docs.langchain.com/oss/python/langgraph/workflows-agents
    source_type: official-doc
    relevance: Documents reusable workflow composition patterns used as engineering references.
source_claims:
  - id: $claimId
    source: langgraph-workflows-agents
    supports: ${childId} is modeled as an is_a specialization of ${parentId} in Moonweave composition semantics.
    locator: Workflows and agents
    evidence_kind: design-inference
    confidence: high
"@
  [IO.File]::WriteAllText($path, $text.TrimEnd() + $suffix)
  Write-Host "Updated $path"
}

$base = $root
Append-IfMissing (Join-Path $base 'CompositionSpecification\CompositionPattern\Parallelization\node.yaml') 'Parallelization' 'CompositionPattern' 'claim-parallelization-hierarchy' @'
    labels: { zh: 并行化实例, en: Parallelization instance, ja: parallelization instance }
    descriptions: { zh: independent-source-review@3 作为 fan-out-fan-in 模式实例。, en: independent-source-review@3 is a fan-out-fan-in pattern instance., ja: independent-source-review@3 は fan-out-fan-in pattern 实例です。 }
    field_values: { control_shape: fan-out-fan-in }
    related_node_ids: [Parallelization, CompositionPattern]
    related_relation_ids: [Parallelization-is_a-CompositionPattern]
    expected_result: { zh: 接受为完整并行化模式实例。, en: Accept as complete parallelization instance., ja: 完全 parallelization 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 control_shape 与子字段齐全。, en: Parent control_shape and child fields complete., ja: 親 control_shape と子 field が揃っています。 }
    synthetic: true
    source_claims: [claim-parallelization-hierarchy]
'@ $patternControlField

Append-IfMissing (Join-Path $base 'CompositionSpecification\CompositionPattern\Sectioning\node.yaml') 'Sectioning' 'CompositionPattern' 'claim-sectioning-hierarchy' @'
    labels: { zh: 分区分派模式实例, en: Sectioning instance, ja: sectioning instance }
    descriptions: { zh: report-by-control-family@4 作为 partition-and-join 模式实例。, en: report-by-control-family@4 is a partition-and-join pattern instance., ja: report-by-control-family@4 は partition-and-join pattern 实例です。 }
    field_values: { control_shape: partition-and-join }
    related_node_ids: [Sectioning, CompositionPattern]
    related_relation_ids: [Sectioning-is_a-CompositionPattern]
    expected_result: { zh: 接受为完整分区分派模式实例。, en: Accept as complete sectioning instance., ja: 完全 sectioning 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 control_shape 与子字段齐全。, en: Parent control_shape and child fields complete., ja: 親 control_shape と子 field が揃っています。 }
    synthetic: true
    source_claims: [claim-sectioning-hierarchy]
'@ $patternControlField

Append-IfMissing (Join-Path $base 'CompositionSpecification\CompositionPattern\SynthesisPattern\node.yaml') 'SynthesisPattern' 'CompositionPattern' 'claim-synthesis-pattern-hierarchy' @'
    labels: { zh: 综合模式实例, en: Synthesis pattern instance, ja: synthesis pattern instance }
    descriptions: { zh: evidence-reconciliation@2 作为 many-to-one reconciliation 模式实例。, en: evidence-reconciliation@2 is a many-to-one reconciliation pattern instance., ja: evidence-reconciliation@2 は many-to-one reconciliation pattern 实例です。 }
    field_values: { control_shape: many-to-one reconciliation }
    related_node_ids: [SynthesisPattern, CompositionPattern]
    related_relation_ids: [SynthesisPattern-is_a-CompositionPattern]
    expected_result: { zh: 接受为完整综合模式实例。, en: Accept as complete synthesis pattern instance., ja: 完全 synthesis pattern 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 control_shape 与子字段齐全。, en: Parent control_shape and child fields complete., ja: 親 control_shape と子 field が揃っています。 }
    synthetic: true
    source_claims: [claim-synthesis-pattern-hierarchy]
'@ $patternControlField

Append-IfMissing (Join-Path $base 'CompositionSpecification\CompositionPattern\Voting\node.yaml') 'Voting' 'CompositionPattern' 'claim-voting-pattern-hierarchy' @'
    labels: { zh: 投票模式实例, en: Voting pattern instance, ja: voting pattern instance }
    descriptions: { zh: review-board-vote@2 作为 quorum ballot aggregation 模式实例。, en: review-board-vote@2 is a quorum ballot aggregation pattern instance., ja: review-board-vote@2 は quorum ballot aggregation pattern 实例です。 }
    field_values: { control_shape: quorum ballot aggregation }
    related_node_ids: [Voting, CompositionPattern]
    related_relation_ids: [Voting-is_a-CompositionPattern]
    expected_result: { zh: 接受为完整投票模式实例。, en: Accept as complete voting pattern instance., ja: 完全 voting pattern 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 control_shape 与子字段齐全。, en: Parent control_shape and child fields complete., ja: 親 control_shape と子 field が揃っています。 }
    synthetic: true
    source_claims: [claim-voting-pattern-hierarchy]
'@ $patternControlField

Append-IfMissing (Join-Path $base 'CompositionSpecification\AggregationRule\MergeRule\node.yaml') 'MergeRule' 'AggregationRule' 'claim-merge-rule-hierarchy' @'
    labels: { zh: 合并规则实例, en: Merge rule instance, ja: merge rule instance }
    descriptions: { zh: reviewed-section-merge@2 作为 keyed-merge 规则实例。, en: reviewed-section-merge@2 is a keyed-merge rule instance., ja: reviewed-section-merge@2 は keyed-merge rule 实例です。 }
    field_values: { eligible_input_type: ReviewedCompositionArtifact, aggregation_method: keyed-merge, completion_policy: all assigned sections received or deadline expired, conflict_policy: pause and escalate incompatible versions of the same section, merge_key: section_id, duplicate_policy: reject duplicates unless one is an explicitly superseding revision, field_conflict_policy: preserve highest review confidence }
    related_node_ids: [MergeRule, AggregationRule]
    related_relation_ids: [MergeRule-is_a-AggregationRule]
    expected_result: { zh: 接受为完整合并规则实例。, en: Accept as complete merge rule instance., ja: 完全 merge rule 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 AggregationRule 必填字段与子 merge 种差齐全。, en: Parent AggregationRule required fields and merge differentia complete., ja: 親 AggregationRule 必須 field と merge differentia が揃っています。 }
    synthetic: true
    source_claims: [claim-merge-rule-hierarchy]
'@ $ruleFields

Append-IfMissing (Join-Path $base 'CompositionSpecification\AggregationRule\VotingRule\node.yaml') 'VotingRule' 'AggregationRule' 'claim-voting-rule-hierarchy' @'
    labels: { zh: 投票规则实例, en: Voting rule instance, ja: voting rule instance }
    descriptions: { zh: review-board-majority@2 作为 ballot tally 规则实例。, en: review-board-majority@2 is a ballot tally rule instance., ja: review-board-majority@2 は ballot tally rule 实例です。 }
    field_values: { eligible_input_type: VoteBallot, aggregation_method: tally-ballots, completion_policy: close when quorum reached or deadline expires, conflict_policy: escalate ties and abstention-only outcomes, quorum_threshold: 3, majority_basis: non-abstention strict majority }
    related_node_ids: [VotingRule, AggregationRule]
    related_relation_ids: [VotingRule-is_a-AggregationRule]
    expected_result: { zh: 接受为完整投票规则实例。, en: Accept as complete voting rule instance., ja: 完全 voting rule 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 AggregationRule 必填字段与子 voting 种差齐全。, en: Parent AggregationRule required fields and voting differentia complete., ja: 親 AggregationRule 必須 field と voting differentia が揃っています。 }
    synthetic: true
    source_claims: [claim-voting-rule-hierarchy]
'@ $ruleFields

Append-IfMissing (Join-Path $base 'CompositionArtifact\CompositionOutput\node.yaml') 'CompositionOutput' 'CompositionArtifact' 'claim-composition-output-hierarchy' @'
    labels: { zh: 组合输出实例, en: Composition output instance, ja: composition output instance }
    descriptions: { zh: vote-result-52 作为 decision-schema@2 输出实例。, en: vote-result-52 is a decision-schema@2 output instance., ja: vote-result-52 は decision-schema@2 output 实例です。 }
    field_values: { composition_artifact_id: vote-result-52, media_type: application/json, content_digest: sha256:vote-result-52, produced_at: 2026-07-16T10:31:00Z, output_contract_ref: decision-schema@2, producer_activity_ref: vote-run-52 }
    related_node_ids: [CompositionOutput, CompositionArtifact]
    related_relation_ids: [CompositionOutput-is_a-CompositionArtifact]
    expected_result: { zh: 接受为完整组合输出实例。, en: Accept as complete composition output instance., ja: 完全 composition output 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 CompositionArtifact 必填字段与子 output 种差齐全。, en: Parent CompositionArtifact required fields and output differentia complete., ja: 親 CompositionArtifact 必須 field と output differentia が揃っています。 }
    synthetic: true
    source_claims: [claim-composition-output-hierarchy]
'@ $artifactFields

Append-IfMissing (Join-Path $base 'CompositionArtifact\SynthesisInput\node.yaml') 'SynthesisInput' 'CompositionArtifact' 'claim-synthesis-input-hierarchy' @'
    labels: { zh: 综合输入实例, en: Synthesis input instance, ja: synthesis input instance }
    descriptions: { zh: synthesis-input-network-2 作为 section-network-17@3 的综合输入实例。, en: synthesis-input-network-2 is a synthesis input instance for section-network-17@3., ja: synthesis-input-network-2 は section-network-17@3 の synthesis input 实例です。 }
    field_values: { composition_artifact_id: synthesis-input-network-2, media_type: text/markdown, content_digest: sha256:section-network-17, produced_at: 2026-07-16T04:21:00Z, source_artifact_ref: section-network-17@3, input_ordinal: 2 }
    related_node_ids: [SynthesisInput, CompositionArtifact]
    related_relation_ids: [SynthesisInput-is_a-CompositionArtifact]
    expected_result: { zh: 接受为完整综合输入实例。, en: Accept as complete synthesis input instance., ja: 完全 synthesis input 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 CompositionArtifact 必填字段与子 input 种差齐全。, en: Parent CompositionArtifact required fields and input differentia complete., ja: 親 CompositionArtifact 必須 field と input differentia が揃っています。 }
    synthetic: true
    source_claims: [claim-synthesis-input-hierarchy]
'@ $artifactFields

Append-IfMissing (Join-Path $base 'CompositionArtifact\CompositionOutput\SynthesisOutput\node.yaml') 'SynthesisOutput' 'CompositionOutput' 'claim-synthesis-output-hierarchy' @'
    labels: { zh: 综合输出实例, en: Synthesis output instance, ja: synthesis output instance }
    descriptions: { zh: final-report-884 作为 audit-report-synthesis@5 的综合输出实例。, en: final-report-884 is a synthesis output instance for audit-report-synthesis@5., ja: final-report-884 は audit-report-synthesis@5 の synthesis output 实例です。 }
    field_values: { output_contract_ref: report-schema@5, producer_activity_ref: synthesis-run-884, plan_ref: audit-report-synthesis@5, trace_manifest_ref: manifest-report-884 }
    related_node_ids: [SynthesisOutput, CompositionOutput]
    related_relation_ids: [SynthesisOutput-is_a-CompositionOutput]
    expected_result: { zh: 接受为完整综合输出实例。, en: Accept as complete synthesis output instance., ja: 完全 synthesis output 实例として受理します。 }
    why_valid_or_invalid: { zh: 父 CompositionOutput 必填字段与子 synthesis 种差齐全。, en: Parent CompositionOutput required fields and synthesis differentia complete., ja: 親 CompositionOutput 必須 field と synthesis differentia が揃っています。 }
    synthetic: true
    source_claims: [claim-synthesis-output-hierarchy]
'@ $outputFields

Write-Host 'Composition is_a fix complete.'
