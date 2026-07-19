$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema'

function Add-Eng($rel, $block) {
  $p = Join-Path $root $rel
  $t = [IO.File]::ReadAllText($p)
  if ($t -match '(?m)^engineering:') { return }
  $t = [regex]::Replace($t, '(?m)^structure:', ($block + "`r`nstructure:"), 1)
  [IO.File]::WriteAllText($p, $t)
  Write-Host "eng $rel"
}

$items = @{
'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/PromptChain/node.yaml' = @'
engineering:
  explanation:
    zh: PromptChain 编译为 LangGraph 顺序边或 stage 列表，short_circuit_rule 决定何时停止后续阶段。Agents SDK 顺序 handoff 是实现，不能从一次 Runner 链反推持久 PromptChain revision。
    en: PromptChain compiles to LangGraph sequential edges or an ordered stage list; short_circuit_rule decides when later stages stop. Agents SDK sequential handoffs are implementations and cannot infer a durable PromptChain revision from one Runner chain.
    ja: PromptChain は LangGraph sequential edge または ordered stage list にコンパイルされ short_circuit_rule が後続 stage 停止を決める。Agents SDK sequential handoff は implementation です。
  typical_input:
    - description:
        zh: 声明 sequential 控制形态与短路规则的模式 revision。
        en: Pattern revision declaring sequential control shape and short-circuit rule.
        ja: sequential control shape/short-circuit rule を宣言する pattern revision。
      format: |-
        {"composition_specification_id":"draft-review-revise","version":"2","control_shape":"sequential-chain","short_circuit_rule":"stop after validation rejection"}
  typical_output:
    - description:
        zh: 编译后的顺序 stage 绑定。
        en: Compiled ordered stage binding.
        ja: compiled ordered stage binding。
      format: |-
        {"pattern_ref":"draft-review-revise@2","compiled_stages":["draft","review","revise"],"short_circuit":"validation-reject"}
  reference_implementations:
    - name: LangGraph workflows and agents
      url: https://docs.langchain.com/oss/python/langgraph/workflows-agents
      description: Documents prompt chaining as ordered workflow stages.
  source_claims:
    - claim-prompt-chain-hierarchy
    - claim-prompt-chain-001
'@
}

foreach ($k in $items.Keys) { Add-Eng $k $items[$k] }
Write-Host done
