# Repairs safety-plane examples corrupted by greedy regex: re-adds field_values and metadata.
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cases = Get-Content (Join-Path (Join-Path $scriptDir 'data') 'safety-plane-real-cases.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$nodeMap = Get-Content (Join-Path (Join-Path $scriptDir 'data') 'safety-plane-node-case-map.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$root = (Resolve-Path (Join-Path (Join-Path $scriptDir '..') 'ontology\safety-plane')).Path

function Get-DefaultCaseKeys($nodeId) {
  if ($nodeId -match 'injection|Threat|Poison|Taint|Defense|Mitigation|Detection|Injection|Risk|Untrusted') { return @('owasp_direct','echoleak','greshake_bing','lakera') }
  if ($nodeId -match 'Policy|Authorization|Permission|Approval|Credential|Decision|Human|Manual|ToolApprovalRequirement') { return @('opa','cedar','mcp_oauth','openai_hitl') }
  if ($nodeId -match 'Sandbox|Isolation|Filesystem|Process|Escape') { return @('e2b','openai_code_interpreter','firecracker','docker_privileged') }
  if ($nodeId -match 'Trust|Boundary|Zone') { return @('nist_zta','anthropic_cai','envoy_ext_auth','mcp_oauth') }
  if ($nodeId -match 'Disclosure|Redaction|Sensitive|Staged') { return @('presidio','google_dlp','anthropic_cai','openai_guardrail') }
  if ($nodeId -match 'Network|Proxy|Route|Outbound|Inbound|Call|Endpoint|Interaction|Message') { return @('k8s_netpol','owasp_ssrf','envoy_ext_auth','k8s_netpol') }
  if ($nodeId -match 'Tool|Pending|SideEffect|Rejection|Approval') { return @('openai_hitl','langgraph_interrupt','mcp_consent','cedar') }
  return @('nist_zta','owasp_direct','openai_hitl','presidio')
}

function InlineTriple($obj) {
  function Esc([string]$s) { return ($s -replace '\\','\\' -replace '"','\"') }
  return '{zh: "' + (Esc $obj.zh) + '", en: "' + (Esc $obj.en) + '", ja: "' + (Esc $obj.ja) + '"}'
}

function Parse-FieldExamples([string]$text) {
  $fields = @{}
  if ($text -notmatch '(?ms)^structure:\r?\n(.*?)^examples:') { return $fields }
  $block = $Matches[1]
  $current = $null
  foreach ($line in ($block -split '\r?\n')) {
    if ($line -match '^    - id: (.+)$') { $current = $Matches[1].Trim(); continue }
    if ($null -ne $current -and $line -match '^      example_value: (.+)$') {
      $val = $Matches[1].Trim()
      if ($val -ne 'null' -and $val.Length -gt 0) { $fields[$current] = $val }
      $current = $null
    }
  }
  return $fields
}

function Get-ClaimIds([string]$text) {
  $ids = [regex]::Matches($text, '(?m)^  - id: (claim-[^\r\n]+)') | ForEach-Object { $_.Groups[1].Value.Trim() }
  if ($ids.Count -gt 0) { return @($ids[0]) }
  return @('claim-local-design')
}

function Build-RepairTail($fieldMap, $caseObj, $claimIds) {
  $why = InlineTriple $caseObj.why
  $lines = @('    field_values:')
  foreach ($kv in $fieldMap.GetEnumerator() | Sort-Object Name) {
    $v = $kv.Value
    if ($v -match ':|\s|\[|\]|@') { $lines += "      $($kv.Key): `"$v`"" } else { $lines += "      $($kv.Key): $v" }
  }
  $lines += '    related_node_ids: []'
  $lines += '    related_relation_ids: []'
  $lines += '    expected_result: {zh: "记录与真实来源一致的受控结果。", en: "Record a controlled outcome aligned with the cited source.", ja: "引用ソースと一致する制御結果を記録する。"}'
  $lines += "    why_valid_or_invalid: $why"
  $lines += '    synthetic: false'
  $lines += '    source_claims:'
  foreach ($c in $claimIds) { $lines += "      - $c" }
  return ($lines -join "`r`n") + "`r`n"
}

function Repair-File([string]$path) {
  $text = [IO.File]::ReadAllText($path)
  if ($text -notmatch '(?m)^id: (.+)$') { return $false }
  $nodeId = $Matches[1]
  if ($text -notmatch '(?ms)^examples:\r?\n') { return $false }
  if (([regex]::Matches($text, 'field_values:')).Count -ge 4) { return $false }
  $fieldMap = Parse-FieldExamples $text
  if ($fieldMap.Count -eq 0) { return $false }
  $prop = $nodeMap.PSObject.Properties | Where-Object Name -EQ $nodeId | Select-Object -First 1
  $keys = if ($prop) { @($prop.Value) } else { Get-DefaultCaseKeys $nodeId }
  $claims = Get-ClaimIds $text
  $idx = $text.IndexOf('examples:')
  $head = $text.Substring(0, $idx + 9)
  $after = $text.Substring($idx + 9)
  $end = [regex]::Match($after, '(?m)^(parent_relation:|relations:|sources:)')
  if (-not $end.Success) { return $false }
  $body = $after.Substring(0, $end.Index)
  $tail = $after.Substring($end.Index)
  $parts = $body -split '(?=  - id: )' | Where-Object { $_.Trim().Length -gt 0 }
  if ($parts.Count -ne 4) { return $false }
  $newParts = @()
  for ($i = 0; $i -lt 4; $i++) {
    $part = $parts[$i]
    if ($part -notmatch '(?m)field_values:') {
      $caseObj = $cases.($keys[$i])
      if (-not $caseObj) { return $false }
      $repair = Build-RepairTail $fieldMap $caseObj $claims
      $trim = $part.TrimEnd()
      $part = $trim + "`r`n" + $repair
    }
    $newParts += $part
  }
  $newText = $head + ($newParts -join '') + $tail
  [IO.File]::WriteAllText($path, $newText, [Text.UTF8Encoding]::new($false))
  return $true
}

$repaired = 0
Get-ChildItem $root -Recurse -Filter node.yaml | ForEach-Object {
  if (Repair-File $_.FullName) { $repaired++ }
}
Write-Host "Repaired $repaired files"
