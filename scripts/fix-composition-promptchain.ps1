$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema'
$utf8 = New-Object System.Text.UTF8Encoding $false
function Replace-Eng($rel, $blockName) {
  $path = Join-Path $root $rel
  $block = [IO.File]::ReadAllText((Join-Path $root "scripts/eng/$blockName"), $utf8).TrimEnd()
  $text = [IO.File]::ReadAllText($path, $utf8)
  $text = [regex]::Replace($text, '(?ms)^engineering:.*?^structure:', ($block + "`r`nstructure:"), 1)
  [IO.File]::WriteAllText($path, $text, $utf8)
  Write-Host "ok $rel"
}
Replace-Eng 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/PromptChain/node.yaml' 'promptchain-block.yaml'
Write-Host done
