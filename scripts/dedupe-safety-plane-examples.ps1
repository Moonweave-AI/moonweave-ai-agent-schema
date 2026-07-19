$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Join-Path (Join-Path $scriptDir '..') 'ontology\safety-plane'
$kinds = @('positive','counterexample','boundary','instance')

function Dedupe-File([string]$path) {
  $text = [IO.File]::ReadAllText($path)
  if ($text -notmatch '(?ms)^examples:\s*') { return $false }
  $start = [regex]::Match($text, '(?ms)^examples:\s*').Index
  $headLen = [regex]::Match($text, '(?ms)^examples:\s*').Length
  $before = $text.Substring(0, $start + $headLen)
  $after = $text.Substring($start + $headLen)
  $end = [regex]::Match($after, '(?m)^(parent_relation:|relations:|sources:|external_mappings:|applicability:|sibling_differentiation:|review:)')
  if (-not $end.Success) { return $false }
  $body = $after.Substring(0, $end.Index)
  $tail = $after.Substring($end.Index)
  $parts = [regex]::Split($body, '(?=^\s{0,2}- id: )') | Where-Object { $_ -match 'kind:' }
  if ($parts.Count -eq 0) {
    $parts = [regex]::Split($body, '(?=  - id: )') | Where-Object { $_ -match 'kind:' }
  }
  foreach ($i in 0..($parts.Count-1)) {
    if ($parts[$i] -match '(?m)^- id: ') { $parts[$i] = '  ' + $parts[$i].TrimStart() }
  }
  $picked = @{}
  $newParts = @()
  foreach ($p in $parts) {
    if ($p -match '(?m)^    kind: (\w+)') {
      $k = $Matches[1]
      if (-not $picked.ContainsKey($k)) { $picked[$k] = $true; $newParts += $p }
    }
  }
  if ($newParts.Count -lt 4) { return $false }
  if ($newParts.Count -eq $parts.Count -and $parts.Count -eq 4) { return $false }
  $newText = $before + ($newParts -join '') + $tail
  [IO.File]::WriteAllText($path, $newText, [Text.UTF8Encoding]::new($false))
  return $true
}

$n = 0
Get-ChildItem $root -Recurse -Filter node.yaml | ForEach-Object {
  if (Dedupe-File $_.FullName) { $n++ }
}
Write-Host "Deduped $n files"
