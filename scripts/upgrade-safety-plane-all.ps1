$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cases = Get-Content (Join-Path (Join-Path $scriptDir 'data') 'safety-plane-real-cases.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$nodeMap = Get-Content (Join-Path (Join-Path $scriptDir 'data') 'safety-plane-node-case-map.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$root = (Resolve-Path (Join-Path (Join-Path $scriptDir '..') 'ontology\safety-plane')).Path
$kinds = @('positive', 'counterexample', 'boundary', 'instance')

function Escape-Yaml([string]$s) { return ($s -replace '\\','\\' -replace '"','\"') }
function InlineTriple($obj) {
  return '{zh: "' + (Escape-Yaml $obj.zh) + '", en: "' + (Escape-Yaml $obj.en) + '", ja: "' + (Escape-Yaml $obj.ja) + '"}'
}

function Get-NodeId([string]$path) {
  foreach ($line in [IO.File]::ReadLines($path)) {
    if ($line -match '^id: (.+)$') { return $Matches[1].Trim() }
  }
  return $null
}

function Score-Path([string]$path, [string]$nodeId) {
  $rel = $path.Replace($root + '\', '')
  $score = 100
  if ($rel -match 'DetectionActivity\\') { $score -= 60 }
  if ($rel -match 'ResourceContentPoisoning\\') { $score -= 40 }
  if ($rel -match 'PolicySpecification\\') { $score -= 35 }
  if ($rel -match 'NetworkInteraction\\') { $score -= 35 }
  if ($rel -match 'safety-commit-redaction|safety-sandbox-network') { $score -= 50 }
  $depth = ($rel -split '\\').Count - 2
  $score -= [Math]::Max(0, $depth - 1) * 8
  if (($rel -split '\\')[-2] -eq $nodeId) { $score += 15 }
  $text = [IO.File]::ReadAllText($path)
  if ($text -match 'OWASP LLM01|EchoLeak|OpenAI Agents SDK|Microsoft Presidio|NIST SP 800-207') { $score += 20 }
  return $score
}

function Find-CanonicalFile([string]$nodeId) {
  $files = Get-ChildItem $root -Recurse -Filter node.yaml | Where-Object { (Get-NodeId $_.FullName) -eq $nodeId }
  if ($files.Count -eq 0) { return $null }
  return ($files | Sort-Object { Score-Path $_.FullName $nodeId } -Descending | Select-Object -First 1).FullName
}

function Parse-FieldExamples([string]$text) {
  $fields = @{}
  if ($text -notmatch '(?ms)^structure:\r?\n(.*?)^examples:') { return $fields }
  foreach ($line in ($Matches[1] -split '\r?\n')) {
    if ($line -match '^    - id: (.+)$') { $cur = $Matches[1].Trim(); continue }
    if ($null -ne $cur -and $line -match '^      example_value: (.+)$') {
      $val = $Matches[1].Trim()
      if ($val -ne 'null' -and $val.Length -gt 0) { $fields[$cur] = $val }
      $cur = $null
    }
  }
  return $fields
}

function Get-ClaimIds([string]$text) {
  $ids = [regex]::Matches($text, '(?m)^  - id: (claim-[^\r\n]+)') | ForEach-Object { $_.Groups[1].Value.Trim() }
  if ($ids.Count -gt 0) { return @($ids[0]) }
  return @('claim-local-design')
}

function Patch-ExampleBlock([string]$block, $caseObj) {
  $desc = InlineTriple $caseObj.descriptions
  $why = InlineTriple $caseObj.why
  if ($block -match '(?m)^    descriptions: \{') {
    $block = [regex]::Replace($block, '(?m)^    descriptions: \{.+?\}', "    descriptions: $desc", 1)
  } elseif ($block -match '(?ms)^    descriptions:\r?\n      zh: ') {
    $block = [regex]::Replace($block, '(?ms)^    descriptions:\r?\n      zh: .+\r?\n      en: .+\r?\n      ja: .+\r?\n', "    descriptions: $desc`r`n", 1)
  }
  if ($block -match '(?m)^    why_valid_or_invalid: \{') {
    $block = [regex]::Replace($block, '(?m)^    why_valid_or_invalid: \{.+?\}', "    why_valid_or_invalid: $why", 1)
  } elseif ($block -match '(?ms)^    why_valid_or_invalid:\r?\n      zh: ') {
    $block = [regex]::Replace($block, '(?ms)^    why_valid_or_invalid:\r?\n      zh: .+\r?\n      en: .+\r?\n      ja: .+\r?\n', "    why_valid_or_invalid: $why`r`n", 1)
  }
  $block = [regex]::Replace($block, '(?m)^    synthetic: (?:true|false)\s*$', '    synthetic: false')
  $block = [regex]::Replace($block, '(?m)^    verified_version: .+\r?\n', '')
  if ($block -notmatch '(?m)^    field_values:') {
    throw 'Example block missing field_values'
  }
  return $block
}

function Build-InsertExample([string]$nodeId, [string]$kind, $caseObj, $fieldMap, [string[]]$claims, [int]$idx) {
  $desc = InlineTriple $caseObj.descriptions
  $why = InlineTriple $caseObj.why
  $er = InlineTriple @{ zh = 'Record outcome aligned with cited source.'; en = 'Record a controlled outcome aligned with the cited source.'; ja = 'Record outcome aligned with cited source.' }
  $id = "$nodeId-real-$kind-$idx"
  $fvLines = @('    field_values:')
  $n = 0
  foreach ($kv in ($fieldMap.GetEnumerator() | Sort-Object Name)) {
    $v = $kv.Value
    if ($n -gt 0 -and $v -match '42') { $v = $v -replace '42', (42 + $idx) }
    if ($v -match ':|\s|\[|@|/|"') { $fvLines += "      $($kv.Key): `"$v`"" } else { $fvLines += "      $($kv.Key): $v" }
    $n++
  }
  return @"
  - id: $id
    kind: $kind
    labels: $(InlineTriple @{ zh = "$nodeId $kind case"; en = "$nodeId $kind case"; ja = "$nodeId $kind case" })
    descriptions: $desc
$($fvLines -join "`r`n")
    related_node_ids: [$nodeId]
    related_relation_ids: []
    expected_result: $er
    why_valid_or_invalid: $why
    synthetic: false
    source_claims:
      - $($claims[0])

"@
}

function Upgrade-File([string]$path, [string[]]$caseKeys) {
  $text = [IO.File]::ReadAllText($path)
  $nodeId = Get-NodeId $path
  if ($text -notmatch '(?ms)^examples:\s*') { throw 'No examples' }
  $exStart = $Matches[0]
  $startIdx = $text.IndexOf($exStart) + $exStart.Length
  $after = $text.Substring($startIdx)
  $end = [regex]::Match($after, '(?m)^(parent_relation:|relations:|sources:|external_mappings:|applicability:|sibling_differentiation:|review:)')
  if (-not $end.Success) { throw 'No examples end' }
  $body = $after.Substring(0, $end.Index)
  $tail = $after.Substring($end.Index)
  $parts = [regex]::Split($body, '(?=^\s{0,2}- id: )') | Where-Object { $_ -match 'kind:' }
  foreach ($i in 0..($parts.Count-1)) {
    if ($parts[$i] -match '(?m)^- id: ') { $parts[$i] = '  ' + $parts[$i].TrimStart() }
  }
  $byKind = @{}
  foreach ($p in $parts) {
    if ($p -match '(?m)^    kind: (\w+)') { $byKind[$Matches[1]] = $p }
  }
  $fieldMap = Parse-FieldExamples $text
  if ($fieldMap.Count -eq 0) {
    foreach ($p in $parts) {
      if ($p -match '(?m)^    field_values: \{(.+)\}') {
        foreach ($pair in ($Matches[1] -split ',\s*')) {
          $m = [regex]::Match($pair, '^(\w+):\s*(.+)$')
          if ($m.Success) { $fieldMap[$m.Groups[1].Value] = $m.Groups[2].Value.Trim().Trim('"') }
        }
        if ($fieldMap.Count -gt 0) { break }
      }
    }
  }
  $claims = Get-ClaimIds $text
  $newBody = ''
  for ($i = 0; $i -lt 4; $i++) {
    $kind = $kinds[$i]
    $caseObj = $cases.($caseKeys[$i])
    if ($byKind.ContainsKey($kind)) {
      $newBody += (Patch-ExampleBlock $byKind[$kind] $caseObj)
    } else {
      $newBody += (Build-InsertExample $nodeId $kind $caseObj $fieldMap $claims ($i + 1))
    }
  }
  $text = $text.Substring(0, $text.IndexOf($exStart) + $exStart.Length) + $newBody + $tail
  $text = $text -replace '(?m)^      - claim-hitl-gateparent_relation:', "      - claim-hitl-gate`r`nparent_relation:"
  return $text
}

$summary = @(); $count = 0
foreach ($prop in $nodeMap.PSObject.Properties) {
  $nodeId = $prop.Name
  $keys = @($prop.Value)
  $path = Find-CanonicalFile $nodeId
  if (-not $path) { continue }
  try {
    $newText = Upgrade-File $path $keys
    $rel = $path.Replace($root + '\', '')
    $outPath = Join-Path (Join-Path $scriptDir 'out\safety-plane') $rel
    $outDir = Split-Path -Parent $outPath
    if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
    [IO.File]::WriteAllText($outPath, $newText, [Text.UTF8Encoding]::new($false))
    $count++
    $summary += [pscustomobject]@{ Node = $nodeId; Path = $rel; Positive = $keys[0]; Counterexample = $keys[1]; Boundary = $keys[2]; Instance = $keys[3] }
  } catch {
    Write-Warning "Failed $nodeId : $_"
  }
}
$summary | Export-Csv (Join-Path $scriptDir 'safety-plane-example-sources-summary.csv') -NoTypeInformation -Encoding UTF8
Write-Host "Upgraded $count nodes"
