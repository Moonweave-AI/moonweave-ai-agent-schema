$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema'
$utf8 = New-Object System.Text.UTF8Encoding $false
function Fix($rel,$block) {
  $path = Join-Path $root $rel
  $b = [IO.File]::ReadAllText((Join-Path $root "scripts/eng/$block"), $utf8).TrimEnd()
  $t = [IO.File]::ReadAllText($path, $utf8)
  $t = [regex]::Replace($t, '(?ms)^engineering:.*?^structure:', ($b + "`r`nstructure:"), 1)
  [IO.File]::WriteAllText($path, $t, $utf8)
  Write-Host $rel
}
@{
 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/Sectioning/node.yaml'='sectioning-block.yaml'
 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPattern/SynthesisPattern/node.yaml'='synthesispattern-block.yaml'
 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPart/ChainStage/node.yaml'='chainstage-block.yaml'
 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPart/ParallelBranch/node.yaml'='parallelbranch-block.yaml'
 'ontology/orchestration-plane/orchestration-composition/CompositionSpecification/CompositionPart/SectionAssignment/node.yaml'='sectionassignment-block.yaml'
 'ontology/orchestration-plane/orchestration-composition/CompositionArtifact/CompositionOutput/node.yaml'='compositionoutput-block.yaml'
 'ontology/orchestration-plane/orchestration-composition/CompositionArtifact/SynthesisInput/node.yaml'='synthesisinput-block.yaml'
 'ontology/orchestration-plane/orchestration-composition/CompositionArtifact/CompositionOutput/SynthesisOutput/node.yaml'='synthesisoutput-block.yaml'
}.GetEnumerator() | ForEach-Object { Fix $_.Key $_.Value }
