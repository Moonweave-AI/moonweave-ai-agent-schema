# Repair source_claims blocks where claim entries were concatenated on one line.
$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path
$scopes = @(
  'ontology\orchestration-plane\orchestration-evaluation\ImprovementActivity',
  'ontology\orchestration-plane\orchestration-evaluation\ImprovementControlSpecification',
  'ontology\orchestration-plane\orchestration-evaluation\ImprovementRole',
  'ontology\orchestration-plane\orchestration-evaluation\ImprovementState',
  'ontology\orchestration-plane\orchestration-evaluation\ControlLineageRecord',
  'ontology\orchestration-plane\orchestration-actors-delegation\CoordinationRole',
  'ontology\orchestration-plane\orchestration-actors-delegation\CoordinationOwnershipRecord'
)

$fixed = 0
foreach ($scope in $scopes) {
  $dir = Join-Path $RepoRoot $scope
  if (-not (Test-Path $dir)) { continue }
  Get-ChildItem -Path $dir -Filter 'node.yaml' -Recurse | ForEach-Object {
    $text = [IO.File]::ReadAllText($_.FullName)
    $new = $text -replace 'confidence: high  - id:', "confidence: high`r`n  - id:"
    if ($new -ne $text) {
      [IO.File]::WriteAllText($_.FullName, $new)
      Write-Host "Repaired $($_.FullName)"
      $fixed++
    }
  }
}
Write-Host "Repaired $fixed files."
