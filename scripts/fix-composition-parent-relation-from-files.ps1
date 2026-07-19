$ErrorActionPreference = 'Stop'
$root = Join-Path (Join-Path $PSScriptRoot '..') 'ontology\orchestration-plane\orchestration-composition'
$eng = Join-Path $PSScriptRoot 'eng'

$map = @{
  'CompositionSpecification\CompositionPattern\Parallelization\node.yaml' = 'parent-relation-parallelization.yaml'
  'CompositionSpecification\CompositionPattern\Sectioning\node.yaml' = 'parent-relation-sectioning.yaml'
  'CompositionSpecification\CompositionPattern\SynthesisPattern\node.yaml' = 'parent-relation-synthesispattern.yaml'
  'CompositionSpecification\CompositionPattern\Voting\node.yaml' = 'parent-relation-voting.yaml'
  'CompositionSpecification\AggregationRule\MergeRule\node.yaml' = 'parent-relation-mergerule.yaml'
  'CompositionSpecification\AggregationRule\VotingRule\node.yaml' = 'parent-relation-votingrule.yaml'
  'CompositionArtifact\CompositionOutput\node.yaml' = 'parent-relation-compositionoutput.yaml'
  'CompositionArtifact\SynthesisInput\node.yaml' = 'parent-relation-synthesisinput.yaml'
  'CompositionArtifact\CompositionOutput\SynthesisOutput\node.yaml' = 'parent-relation-synthesisoutput.yaml'
}

foreach ($entry in $map.GetEnumerator()) {
  $path = Join-Path $root $entry.Key
  $blockPath = Join-Path $eng $entry.Value
  if (-not (Test-Path $path)) { Write-Warning "Missing $path"; continue }
  if (-not (Test-Path $blockPath)) { Write-Warning "Missing $blockPath"; continue }
  $text = [IO.File]::ReadAllText($path)
  $block = [IO.File]::ReadAllText($blockPath).TrimEnd()
  if ($text -notmatch '(?ms)^parent_relation:') { Write-Warning "No parent_relation in $path"; continue }
  $text = [regex]::Replace($text, '(?ms)^parent_relation:.*?^sources:', ($block + "`r`n" + 'sources:'), 1)
  $text = $text -replace 'why_valid_or_invalid: \{ zh: [^\}]+\}', 'why_valid_or_invalid: { zh: 父 control_shape 与子字段齐全。, en: Parent control_shape and child fields complete., ja: 親 control_shape と子 field が揃っています。 }'
  [IO.File]::WriteAllText($path, $text)
  Write-Host "Fixed $path"
}
Write-Host 'Done.'
