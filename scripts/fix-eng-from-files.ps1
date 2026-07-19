$ErrorActionPreference = 'Stop'
$root = 'd:\moonweave-ai\moonweave-ai-agent-schema'
$utf8 = New-Object System.Text.UTF8Encoding $false

function Replace-Eng($path, $blockPath) {
  $block = [IO.File]::ReadAllText($blockPath, $utf8).TrimEnd()
  $text = [IO.File]::ReadAllText($path, $utf8)
  if ($text -notmatch '(?ms)^engineering:') { Write-Warning "no eng $path"; return }
  $text = [regex]::Replace($text, '(?ms)^engineering:.*?^structure:', ($block + "`r`nstructure:"), 1)
  [IO.File]::WriteAllText($path, $text, $utf8)
  Write-Host "ok $path"
}

$evalBlock = Join-Path $root 'scripts/eng/evaluation-block.yaml'
$actorBlock = Join-Path $root 'scripts/eng/actors-block.yaml'

Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-evaluation') -Recurse -Filter node.yaml |
  Where-Object { $_.Directory.Name -ne 'orchestration-evaluation' -and $_.Name -eq 'node.yaml' -and $_.FullName -notmatch 'EvaluationActivity\\node\.yaml$' -and $_.FullName -notmatch 'RevisionActivity\\node\.yaml$' } |
  ForEach-Object { Replace-Eng $_.FullName $evalBlock }

Get-ChildItem (Join-Path $root 'ontology/orchestration-plane/orchestration-actors-delegation') -Recurse -Filter node.yaml |
  Where-Object { $_.Directory.Name -ne 'orchestration-actors-delegation' } |
  ForEach-Object { Replace-Eng $_.FullName $actorBlock }

Write-Host 'done'
