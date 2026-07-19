# Strip retired governance keys from orchestration-plane node.yaml files.
# Safe version: does NOT use greedy top-level block removal that can truncate module roots.
$ErrorActionPreference = 'Stop'
$root = Join-Path (Join-Path $PSScriptRoot '..') 'ontology\orchestration-plane'
$files = Get-ChildItem -Path $root -Recurse -Filter 'node.yaml'

$protectedRelativePaths = @(
  'node.yaml',
  'orchestration-composition/node.yaml',
  'orchestration-delegation-handoff/node.yaml',
  'orchestration-routing-control/node.yaml',
  'orchestration-task-planning/node.yaml',
  'orchestration-evaluation/node.yaml',
  'orchestration-actors-delegation/node.yaml'
)

function Remove-TopLevelBlock([string]$text, [string]$key) {
  $pattern = "(?ms)^${key}:\s*\r?\n(?:  [^\r\n]*\r?\n)+"
  return [regex]::Replace($text, $pattern, '')
}

function Remove-ReviewStatusLines([string]$text) {
  $text = [regex]::Replace($text, '(?m)^  review_status: accepted\r?\n', '')
  $text = [regex]::Replace($text, '(?m)^    review_status: accepted\r?\n', '')
  return $text
}

function Fix-ParentRelation([string]$text, [string]$parentId) {
  if ($text -notmatch '(?ms)^parent_relation:\s*\r?\n') { return $text }
  if ($text -notmatch "target: concept:${parentId}") {
    $text = [regex]::Replace(
      $text,
      '(?ms)(^parent_relation:\s*\r?\n(?:  .*\r?\n)*?  predicate: is_a\r?\n)',
      "`$1  target: concept:${parentId}`r`n",
      1
    )
  }
  if ($text -match '(?ms)  distinct_fact_rationale: null') {
    $rationale = "  distinct_fact_rationale:`r`n    zh: is_a only states type membership; concrete fields, runtime facts, and cross-links use separate fields or relations.`r`n    en: is_a only states type membership; concrete fields, runtime facts, and cross-links use separate fields or relations.`r`n    ja: is_a only states type membership; concrete fields, runtime facts, and cross-links use separate fields or relations."
    $text = $text -replace '(?ms)  distinct_fact_rationale: null', $rationale
  }
  return $text
}

$parentTargets = @{
  'orchestration-composition/CompositionActivity/AggregationActivity' = 'CompositionActivity'
  'orchestration-composition/CompositionActivity/AggregationActivity/Synthesis' = 'AggregationActivity'
  'orchestration-composition/CompositionActivity/AggregationActivity/VotingActivity' = 'AggregationActivity'
  'orchestration-composition/CompositionArtifact/CompositionOutput' = 'CompositionArtifact'
  'orchestration-composition/CompositionArtifact/CompositionOutput/SynthesisOutput' = 'CompositionOutput'
  'orchestration-composition/CompositionArtifact/SynthesisInput' = 'CompositionArtifact'
  'orchestration-composition/CompositionSpecification/AggregationRule/MergeRule' = 'AggregationRule'
  'orchestration-composition/CompositionSpecification/AggregationRule/VotingRule' = 'AggregationRule'
  'orchestration-composition/CompositionSpecification/CompositionPart/ChainStage' = 'CompositionPart'
  'orchestration-composition/CompositionSpecification/CompositionPart/ParallelBranch' = 'CompositionPart'
  'orchestration-composition/CompositionSpecification/CompositionPart/SectionAssignment' = 'CompositionPart'
  'orchestration-composition/CompositionSpecification/CompositionPattern/Parallelization' = 'CompositionPattern'
  'orchestration-composition/CompositionSpecification/CompositionPattern/PromptChain' = 'CompositionPattern'
  'orchestration-composition/CompositionSpecification/CompositionPattern/Sectioning' = 'CompositionPattern'
  'orchestration-composition/CompositionSpecification/CompositionPattern/SynthesisPattern' = 'CompositionPattern'
  'orchestration-composition/CompositionSpecification/CompositionPattern/Voting' = 'CompositionPattern'
}

$rootPath = (Resolve-Path $root).Path
$changed = 0
foreach ($file in $files) {
  $rel = $file.FullName.Substring($rootPath.Length + 1) -replace '\\node\.yaml$','' -replace '\\','/'
  if ($rel -eq '') { $rel = 'node.yaml' } else { $rel = "$rel/node.yaml" }

  $original = [IO.File]::ReadAllText($file.FullName)
  $text = $original

  # Remove single-line governance remnants
  $text = [regex]::Replace($text, '(?m)^status: (accepted|review|wip)\r?\n', '')
  $text = [regex]::Replace($text, '(?m)^external_mappings: \[\]\r?\n', '')
  $text = [regex]::Replace($text, '(?m)^applicability: null\r?\n', '')
  $text = [regex]::Replace($text, '(?m)^purpose: null\r?\n', '')
  $text = [regex]::Replace($text, '(?m)^structure: null\r?\n', '')

  $text = Remove-ReviewStatusLines $text

  # Only strip legacy top-level blocks on non-protected concept nodes
  if ($protectedRelativePaths -notcontains $rel) {
    $text = Remove-TopLevelBlock $text 'external_mappings'
    $text = Remove-TopLevelBlock $text 'applicability'
    $text = Remove-TopLevelBlock $text 'sibling_differentiation'
    $text = Remove-TopLevelBlock $text 'module_contract'
    $text = Remove-TopLevelBlock $text 'purpose'
    # review block only when it is a legacy governance block (has review_status child)
    if ($text -match '(?ms)^review:\s*\r?\n(?:  .*\r?\n)*?  review_status:') {
      $text = Remove-TopLevelBlock $text 'review'
    }
  }

  $relKey = $rel -replace '/node\.yaml$',''
  if ($parentTargets.ContainsKey($relKey)) {
    $text = Fix-ParentRelation $text $parentTargets[$relKey]
  }

  if ($text -ne $original) {
    try {
      [IO.File]::WriteAllText($file.FullName, $text)
      $changed++
    } catch {
      Write-Warning "Skipped locked file: $($file.FullName)"
    }
  }
}

Write-Host "Updated $changed of $($files.Count) node.yaml files"
