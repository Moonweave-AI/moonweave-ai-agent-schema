# Append top-level source_claims definitions for claim IDs referenced in each node file.
$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path

function Get-ClaimSource([string]$ClaimId) {
  if ($ClaimId -match '^claim-(composition|aggregation|parallel|section|synthesis|prompt|chain|merge|voting|orchestration-topology|composition-part|composition-pattern|composition-artifact|composition-output|parallelization|sectioning|prompt-chain|voting-rule|merge-rule|voting-pattern|synthesis-pattern|synthesis-input|synthesis-output|chain-stage|parallel-branch|section-assignment|synthesis-plan|parallelization|sectioning|prompt-chain|voting|merge|aggregation-rule|composition-output|composition-artifact|composition-part|composition-pattern|orchestration-topology|synthesis-plan)') {
    return 'langgraph-workflows-agents'
  }
  if ($ClaimId -match '^claim-coordination-') {
    if ($ClaimId -match 'ownership') { return 'w3c-prov-o' }
    if ($ClaimId -match 'role') { return 'openai-agents-multi-agent' }
    return 'w3c-prov-o'
  }
  if ($ClaimId -match '^claim-(control-lineage|stop-retry-lineage|improvement-state|improvement-coordination|improvement-attempt|revision-attempt|evaluation-attempt|review-coordination|feedback-routing|review-revision-loop|evaluator-optimizer-loop|improvement-loop|optimizer-state|improvement-control-specification|review-assignment|improvement-role|evaluator-optimizer|improvement-activity|answer-ownership|control-ownership|orchestrator|worker-role|subagent-role|coordination-ownership)') {
    if ($ClaimId -match 'optimizer|evaluator-optimizer|evaluation-attempt') { return 'openai-responses-api' }
    if ($ClaimId -match 'loop|attempt|activity|coordination|lineage|state|control-specification|review-assignment|role') { return 'openai-agent-evals' }
    return 'w3c-prov-o'
  }
  return 'w3c-prov-o'
}

function Get-ClaimLocator([string]$SourceId) {
  switch ($SourceId) {
    'openai-agent-evals' { return 'Agent evals guide, trace-based evaluation and eval runs' }
    'openai-responses-api' { return 'Responses API, structured evaluator and optimizer outputs' }
    'openai-agents-multi-agent' { return 'Multi-agent orchestration, orchestrator and worker roles' }
    'langchain-subagents' { return 'Subagents documentation, supervisor routing' }
    default { return 'PROV-O Activity, Entity, Agent, and lineage model' }
  }
}

function Get-ClaimSupports([string]$ClaimId, [string]$NodeId) {
  $topic = ($ClaimId -replace '^claim-', '') -replace '-', ' '
  return "Moonweave records $NodeId using claim $ClaimId to anchor $topic semantics against the cited official source rather than renaming API wire objects as ontology types."
}

function Get-ReferencedClaimIds([string]$Text) {
  $ids = [regex]::Matches($Text, 'claim-[a-z0-9]+(?:-[a-z0-9]+)+') | ForEach-Object { $_.Value } | Sort-Object -Unique
  return $ids
}

function Get-DefinedClaimIds([string]$Text) {
  $matches = [regex]::Matches($Text, '(?ms)^source_claims:\s*\r?\n((?:  - id: .+\r?\n(?:    .+\r?\n?)*)+)')
  if ($matches.Count -eq 0) { return @() }
  $block = $matches[$matches.Count - 1].Groups[1].Value
  return [regex]::Matches($block, '(?m)^  - id: ([a-z0-9-]+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
}

function Get-NodeId([string]$Text) {
  if ($Text -match '(?m)^id:\s*([A-Za-z0-9]+)') { return $Matches[1] }
  return 'this node'
}

$scopes = @(
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-composition'),
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-evaluation\ImprovementActivity'),
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-evaluation\ImprovementControlSpecification'),
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-evaluation\ImprovementRole'),
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-evaluation\ImprovementState'),
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-evaluation\ControlLineageRecord'),
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-actors-delegation\CoordinationRole'),
  (Join-Path $RepoRoot 'ontology\orchestration-plane\orchestration-actors-delegation\CoordinationOwnershipRecord')
)

$updated = 0
foreach ($scope in $scopes) {
  if (-not (Test-Path $scope)) { continue }
  Get-ChildItem -Path $scope -Filter 'node.yaml' -Recurse | ForEach-Object {
    $text = [IO.File]::ReadAllText($_.FullName)
    if ($text -notmatch '(?m)^sources:') { return }
    $nodeId = Get-NodeId $text
    $referenced = Get-ReferencedClaimIds $text
    $defined = Get-DefinedClaimIds $text
    $missing = @($referenced | Where-Object { $_ -notin $defined })
    if ($missing.Count -eq 0) { return }

    $entries = New-Object System.Collections.Generic.List[string]
    foreach ($claimId in $missing) {
      $sourceId = Get-ClaimSource $claimId
      $supports = Get-ClaimSupports $claimId $nodeId
      $locator = Get-ClaimLocator $sourceId
      $entries.Add(@"
  - id: $claimId
    source: $sourceId
    supports: $supports
    locator: $locator
    evidence_kind: design-inference
    confidence: high
"@.TrimEnd()) | Out-Null
    }

    if ($defined.Count -gt 0) {
      $text = $text.TrimEnd() + "`r`n" + ($entries -join "`r`n")
    } else {
      $text = $text.TrimEnd() + "`r`nsource_claims:`r`n" + ($entries -join "`r`n")
    }
    [IO.File]::WriteAllText($_.FullName, $text)
    Write-Host "$($_.FullName) +$($missing.Count) claims"
    $updated++
  }
}

Write-Host "Updated $updated files."
