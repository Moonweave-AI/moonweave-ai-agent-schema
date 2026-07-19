$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..\ontology\safety-plane')).Path
$nodeMap = Get-Content (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'data\safety-plane-node-case-map.json') -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-NodeId([string]$path) {
  foreach ($line in [IO.File]::ReadLines($path)) {
    if ($line -match '^id: (.+)$') { return $Matches[1].Trim() }
  }
  return $null
}

function Score-Path([string]$path) {
  $score = 0
  if ($path -match 'DetectionActivity\\') { $score -= 50 }
  if ($path -match 'safety-commit-redaction') { $score -= 40 }
  if ($path -match 'safety-sandbox-network') { $score -= 40 }
  if ($path -match 'PolicySpecification\\') { $score -= 30 }
  if ($path -match 'safety-disclosure-redaction') { $score += 10 }
  if ($path -match 'safety-sandbox-isolation') { $score += 10 }
  if ($path -match 'safety-tool-approval-execution') { $score += 10 }
  if ($path -match 'safety-permission-policy\\[^\\]+$') { $score += 5 }
  return $score
}

function Get-ExampleStats([string]$text) {
  $ex = 0; $sf = 0; $synFalse = 0; $synTrue = 0; $real = $false
  if ($text -match '(?ms)^examples:\r?\n') {
    $idx = $text.IndexOf('examples:')
    $after = $text.Substring($idx + 9)
    $end = [regex]::Match($after, '(?m)^(parent_relation:|relations:|sources:)')
    if ($end.Success) {
      $body = $after.Substring(0, $end.Index)
      $ex = ([regex]::Matches($body, '(?m)^  - id: ')).Count
    }
  }
  $sf = ([regex]::Matches($text, '(?m)^    field_values:')).Count
  $synFalse = ([regex]::Matches($text, '(?m)^    synthetic: false')).Count
  $synTrue = ([regex]::Matches($text, '(?m)^    synthetic: true')).Count
  $real = $text -match 'OWASP LLM01|EchoLeak|OpenAI Agents SDK|Microsoft Presidio|NIST SP 800-207|Greshake|Lakera Guard|LangGraph interrupt'
  return @{ Ex = $ex; SF = $sf; SynFalse = $synFalse; SynTrue = $synTrue; Real = $real }
}

$allFiles = Get-ChildItem $root -Recurse -Filter node.yaml
$byId = @{}
foreach ($f in $allFiles) {
  $id = Get-NodeId $f.FullName
  if (-not $id) { continue }
  if (-not $byId.ContainsKey($id)) { $byId[$id] = @() }
  $byId[$id] += $f.FullName
}

$rows = @()
foreach ($prop in $nodeMap.PSObject.Properties) {
  $id = $prop.Name
  $paths = @($byId[$id])
  if ($paths.Count -eq 0) {
    $rows += [pscustomobject]@{ Id = $id; Status = 'MISSING'; Path = ''; Ex = 0; SF = 0; SynFalse = 0; SynTrue = 0; Real = $false; Dup = 0 }
    continue
  }
  $best = $paths | Sort-Object { Score-Path $_ } -Descending | Select-Object -First 1
  $text = [IO.File]::ReadAllText($best)
  $s = Get-ExampleStats $text
  $ok = ($s.Ex -eq 4 -and $s.SF -ge 4 -and $s.SynFalse -ge 4 -and $s.SynTrue -eq 0 -and $s.Real)
  $status = if ($ok) { 'OK' } else { 'NEEDS' }
  $rel = $best.Replace($root + '\', '')
  $rows += [pscustomobject]@{
    Id = $id; Status = $status; Path = $rel; Ex = $s.Ex; SF = $s.SF
    SynFalse = $s.SynFalse; SynTrue = $s.SynTrue; Real = $s.Real; Dup = $paths.Count
  }
}

$rows | Export-Csv (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'safety-plane-audit.csv') -NoTypeInformation -Encoding UTF8
Write-Host "OK: $(($rows | Where-Object Status -eq 'OK').Count) NEEDS: $(($rows | Where-Object Status -eq 'NEEDS').Count) MISSING: $(($rows | Where-Object Status -eq 'MISSING').Count)"
$rows | Where-Object Status -ne 'OK' | Format-Table Id, Status, Ex, SF, SynFalse, SynTrue, Dup, Path -AutoSize
