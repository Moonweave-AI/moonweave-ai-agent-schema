$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema\ontology\orchestration-plane'
$targets = @(
  'orchestration-composition/CompositionSpecification/AggregationRule/node.yaml',
  'orchestration-composition/CompositionSpecification/AggregationRule/MergeRule/node.yaml',
  'orchestration-composition/CompositionSpecification/AggregationRule/VotingRule/node.yaml',
  'orchestration-composition/CompositionArtifact/node.yaml',
  'orchestration-composition/CompositionArtifact/CompositionOutput/node.yaml',
  'orchestration-composition/CompositionArtifact/CompositionOutput/SynthesisOutput/node.yaml',
  'orchestration-composition/CompositionArtifact/SynthesisInput/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPart/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPart/ChainStage/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPart/ParallelBranch/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPart/SectionAssignment/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPattern/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPattern/Parallelization/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPattern/PromptChain/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPattern/Sectioning/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPattern/SynthesisPattern/node.yaml',
  'orchestration-composition/CompositionSpecification/CompositionPattern/Voting/node.yaml',
  'orchestration-composition/CompositionSpecification/OrchestrationTopology/node.yaml',
  'orchestration-composition/CompositionSpecification/SynthesisPlan/node.yaml',
  'orchestration-evaluation/ImprovementActivity/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementAttempt/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementAttempt/EvaluationAttempt/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementAttempt/RevisionAttempt/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementCoordinationActivity/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementCoordinationActivity/FeedbackRouting/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementCoordinationActivity/ReviewCoordination/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementLoop/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementLoop/EvaluatorOptimizerLoop/node.yaml',
  'orchestration-evaluation/ImprovementActivity/ImprovementLoop/ReviewRevisionLoop/node.yaml',
  'orchestration-evaluation/ImprovementControlSpecification/node.yaml',
  'orchestration-evaluation/ImprovementControlSpecification/ReviewAssignment/node.yaml',
  'orchestration-evaluation/ImprovementRole/node.yaml',
  'orchestration-evaluation/ImprovementRole/EvaluatorOptimizer/node.yaml',
  'orchestration-evaluation/ImprovementState/node.yaml',
  'orchestration-evaluation/ImprovementState/OptimizerState/node.yaml',
  'orchestration-evaluation/ControlLineageRecord/node.yaml',
  'orchestration-evaluation/ControlLineageRecord/StopRetryLineage/node.yaml',
  'orchestration-actors-delegation/CoordinationRole/node.yaml',
  'orchestration-actors-delegation/CoordinationRole/Orchestrator/node.yaml',
  'orchestration-actors-delegation/CoordinationRole/SubagentRole/node.yaml',
  'orchestration-actors-delegation/CoordinationRole/WorkerRole/node.yaml',
  'orchestration-actors-delegation/CoordinationOwnershipRecord/node.yaml',
  'orchestration-actors-delegation/CoordinationOwnershipRecord/AnswerOwnership/node.yaml',
  'orchestration-actors-delegation/CoordinationOwnershipRecord/ControlOwnership/node.yaml'
) + (Get-ChildItem (Join-Path $root 'orchestration-delegation-handoff\A2A*') -Filter 'node.yaml' -Recurse | ForEach-Object {
  $_.FullName.Substring($root.Length + 1).Replace('\', '/')
})

$fail = 0
foreach ($rel in $targets) {
  $path = Join-Path $root ($rel -replace '/', '\')
  if (-not (Test-Path $path)) { Write-Host "MISSING $rel"; $fail++; continue }
  $text = [IO.File]::ReadAllText($path)
  $issues = @()
  if ($text -notmatch '(?m)^engineering:') { $issues += 'no engineering' }
  if ($text -notmatch '(?m)^sources:') { $issues += 'no sources' }
  if ($text -match 'confidence: high  - id:') { $issues += 'broken source_claims newlines' }
  if ($text -match '鏄\?|\{parentId\}') { $issues += 'corrupt parent_relation' }
  foreach ($kind in @('positive','counterexample','boundary','instance')) {
    if ($text -notmatch "kind: $kind") { $issues += "missing example $kind" }
  }
  $refs = [regex]::Matches($text, 'claim-[a-z0-9]+(?:-[a-z0-9]+)+') | ForEach-Object { $_.Value } | Sort-Object -Unique
  $defs = @()
  $claimMatches = [regex]::Matches($text, '(?ms)^source_claims:\s*\r?\n((?:  - id: .+\r?\n(?:    .+\r?\n?)*)+)')
  if ($claimMatches.Count -gt 0) {
    $block = $claimMatches[$claimMatches.Count - 1].Groups[1].Value
    $defs = [regex]::Matches($block, '(?m)^  - id: ([a-z0-9-]+)') | ForEach-Object { $_.Groups[1].Value }
  }
  $missingClaims = @($refs | Where-Object { $_ -notin $defs })
  if ($missingClaims.Count -gt 0) { $issues += "undef claims: $($missingClaims -join ', ')" }
  if ($issues.Count -eq 0) { Write-Host "OK $rel" } else { Write-Host "FAIL $rel -> $($issues -join '; ')"; $fail++ }
}
Write-Host "Summary: $($targets.Count) targets, $fail failures"
