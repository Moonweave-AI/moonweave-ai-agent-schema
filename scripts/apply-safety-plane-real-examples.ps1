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

function Escape-Yaml([string]$s) { return ($s -replace '\\','\\' -replace '"','\"') }
function InlineTriple($obj) {
  return '{zh: "' + (Escape-Yaml $obj.zh) + '", en: "' + (Escape-Yaml $obj.en) + '", ja: "' + (Escape-Yaml $obj.ja) + '"}'
}

function Patch-ExampleBlock([string]$block, $caseObj) {
  $desc = InlineTriple $caseObj.descriptions
  $why = InlineTriple $caseObj.why
  $exactTriple = '(?ms)^    descriptions:\r?\n      zh: .+\r?\n      en: .+\r?\n      ja: .+\r?\n'
  if ($block -match $exactTriple) {
    $block = [regex]::Replace($block, $exactTriple, "    descriptions: $desc`r`n", 1)
  } elseif ($block -match '(?m)^    descriptions: \{') {
    $block = [regex]::Replace($block, '(?m)^    descriptions: \{.+?\}', "    descriptions: $desc", 1)
  } else {
    throw 'Could not locate descriptions block'
  }
  $whyTriple = '(?ms)^    why_valid_or_invalid:\r?\n      zh: .+\r?\n      en: .+\r?\n      ja: .+\r?\n'
  if ($block -match $whyTriple) {
    $block = [regex]::Replace($block, $whyTriple, "    why_valid_or_invalid: $why`r`n", 1)
  } elseif ($block -match '(?m)^    why_valid_or_invalid: \{') {
    $block = [regex]::Replace($block, '(?m)^    why_valid_or_invalid: \{.+?\}', "    why_valid_or_invalid: $why", 1)
  } else {
    throw 'Could not locate why_valid_or_invalid block'
  }
  $block = [regex]::Replace($block, '(?m)^    synthetic: (?:true|false)\s*$', '    synthetic: false')
  return $block
}

function Get-ExampleCount($path) {
  $t = [IO.File]::ReadAllText($path)
  if ($t -notmatch '(?ms)^examples:\r?\n') { return -1 }
  $idx = $t.IndexOf('examples:')
  $after = $t.Substring($idx + 9)
  $end = [regex]::Match($after, '(?m)^(parent_relation:|relations:|sources:)')
  if (-not $end.Success) { return -1 }
  $body = $after.Substring(0, $end.Index)
  return ([regex]::Matches($body, '(?m)^  - id: ')).Count
}

function Update-File([string]$path, [string[]]$caseKeys) {
  $text = [IO.File]::ReadAllText($path)
  if ($text -notmatch '(?ms)^examples:\r?\n') { throw "No examples section in $path" }
  $head = $Matches[0]
  $idx = $text.IndexOf($head)
  $before = $text.Substring(0, $idx + $head.Length)
  $afterExamples = $text.Substring($idx + $head.Length)
  $endMatch = [regex]::Match($afterExamples, '(?m)^(parent_relation:|relations:|sources:)')
  if (-not $endMatch.Success) { throw "Could not find end of examples in $path" }
  $examplesBody = $afterExamples.Substring(0, $endMatch.Index)
  $tail = $afterExamples.Substring($endMatch.Index)
  $parts = $examplesBody -split '(?=  - id: )' | Where-Object { $_.Trim().Length -gt 0 }
  if ($parts.Count -ne 4) { throw "Expected 4 example blocks in $path, found $($parts.Count)" }
  $newParts = @()
  for ($i = 0; $i -lt 4; $i++) {
    $key = $caseKeys[$i]
    $caseObj = $cases.$key
    if (-not $caseObj) { throw "Missing case $key" }
    $newParts += (Patch-ExampleBlock $parts[$i] $caseObj)
  }
  return $before + ($newParts -join '') + $tail
}

$summary = @()
$count = 0
$skipped = 0
Get-ChildItem $root -Recurse -Filter node.yaml | ForEach-Object {
  $path = $_.FullName
  $text = [IO.File]::ReadAllText($path)
  $nodeId = ([regex]::Match($text, '(?m)^id: (.+)$')).Groups[1].Value
  $ex = Get-ExampleCount $path
  $fieldCount = ([regex]::Matches($text, 'field_values:')).Count
  $synFalse = ([regex]::Matches($text, 'synthetic: false')).Count
  if ($ex -ne 4 -or $fieldCount -lt 4) {
    $skipped++
    return
  }
  if ($synFalse -ge 4 -and $text -match 'EchoLeak|OWASP LLM01:2025|OpenAI Agents SDK: cancel_order') {
    $skipped++
    return
  }
  $prop = $nodeMap.PSObject.Properties | Where-Object Name -EQ $nodeId | Select-Object -First 1
  $keys = if ($prop) { @($prop.Value) } else { Get-DefaultCaseKeys $nodeId }
  foreach ($k in $keys) {
    if (-not $cases.$k) { throw "Missing case $k for node $nodeId" }
  }
  $newText = Update-File $path $keys
  [IO.File]::WriteAllText($path, $newText, [Text.UTF8Encoding]::new($false))
  $count++
  $summary += [pscustomobject]@{ Node=$nodeId; Positive=$keys[0]; Counterexample=$keys[1]; Boundary=$keys[2]; Instance=$keys[3] }
}
$summary | Export-Csv (Join-Path $scriptDir 'safety-plane-example-sources-summary.csv') -NoTypeInformation -Encoding UTF8
Write-Host "Updated $count files; skipped $skipped"
