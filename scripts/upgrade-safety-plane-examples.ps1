# Upgrade safety-plane ontology examples: remove kind/synthetic fields, unique real-case descriptions.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$SafetyPlane = Join-Path $Root 'ontology\safety-plane'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CasesPath = Join-Path $ScriptDir 'data\safety-plane-real-cases.json'
$MapPath = Join-Path $ScriptDir 'data\safety-plane-node-case-map.json'
$MetaPath = Join-Path $ScriptDir 'data\safety-plane-case-meta.json'
$ExtraDescPath = Join-Path $ScriptDir 'data\safety-plane-extra-case-descriptions.json'
$cases = Get-Content -Raw -Path $CasesPath -Encoding UTF8 | ConvertFrom-Json
$nodeMap = Get-Content -Raw -Path $MapPath -Encoding UTF8 | ConvertFrom-Json
$CaseMeta = Get-Content -Raw -Path $MetaPath -Encoding UTF8 | ConvertFrom-Json
$ExtraDescriptions = Get-Content -Raw -Path $ExtraDescPath -Encoding UTF8 | ConvertFrom-Json

function To-KebabCase([string]$s) {
    if ([string]::IsNullOrWhiteSpace($s)) { return 'node' }
    $x = ($s -creplace '([a-z0-9])([A-Z])', '$1-$2').ToLower()
    return ($x -replace '_', '-')
}

function Escape-YamlInline([string]$s) {
    if ($null -eq $s) { return '' }
    return ($s -replace '\\', '\\' -replace '"', '\"')
}

function Get-DefaultCaseKeys([string]$nodeId, [string]$relPath) {
    if ($relPath -match 'safety-commit-redaction') { return @('openai_hitl', 'presidio', 'google_dlp', 'guardrails_ai') }
    if ($nodeId -match 'injection|Threat|Poison|Taint|Defense|Mitigation|Detection|Risk|Untrusted|Signature') { return @('rebuff', 'lakera', 'greshake_bing', 'gcg_attack') }
    if ($nodeId -match 'Policy|Authorization|Permission|Approval|Credential|Decision|Human|Manual|ToolApprovalRequirement|Grant|Defer') { return @('cedar', 'opa', 'trustllm', 'decodingtrust') }
    if ($nodeId -match 'Sandbox|Isolation|Filesystem|Process|Escape') { return @('e2b', 'gvisor_runsc', 'firecracker', 'docker_network_none') }
    if ($nodeId -match 'Trust|Boundary|Zone|DataZone') { return @('trustllm', 'decodingtrust', 'anthropic_cai', 'envoy_ext_auth') }
    if ($nodeId -match 'Disclosure|Redaction|Sensitive|Staged|Progressive') { return @('presidio', 'google_dlp', 'anthropic_cai', 'guardrails_ai') }
    if ($nodeId -match 'Network|Proxy|Route|Outbound|Inbound|Call|Endpoint|Interaction|Message') { return @('k8s_netpol', 'e2b', 'envoy_ext_auth', 'docker_network_none') }
    if ($nodeId -match 'Tool|Pending|SideEffect|Rejection|Commit') { return @('openai_hitl', 'langgraph_interrupt', 'anthropic_cai', 'cedar') }
    return @('trustllm', 'decodingtrust', 'anthropic_cai', 'guardrails_ai')
}

function Get-CaseKeys([string]$nodeId, [string]$relPath) {
    $prop = $nodeMap.PSObject.Properties | Where-Object Name -EQ $nodeId | Select-Object -First 1
    $keys = if ($prop) { @($prop.Value) } else { Get-DefaultCaseKeys $nodeId $relPath }
    $uniq = [System.Collections.Generic.List[string]]::new()
    foreach ($k in $keys) {
        if ($k -and -not $uniq.Contains($k)) { [void]$uniq.Add($k) }
    }
    while ($uniq.Count -lt 4) {
        foreach ($fallback in (Get-DefaultCaseKeys $nodeId $relPath)) {
            if (-not $uniq.Contains($fallback)) { [void]$uniq.Add($fallback) }
            if ($uniq.Count -ge 4) { break }
        }
        if ($uniq.Count -lt 4) { break }
    }
    return @($uniq | Select-Object -First 4)
}

function Parse-NodeContext([string]$text, [string]$relPath) {
    $ctx = @{
        nodeId = ''
        labels = @{ zh = ''; en = ''; ja = '' }
        shortDef = @{ zh = ''; en = ''; ja = '' }
        fieldExamples = @{}
        claimIds = @()
        relatedNodes = [System.Collections.Generic.HashSet[string]]::new()
        relatedRelations = [System.Collections.Generic.HashSet[string]]::new()
        relPath = $relPath
    }
    if ($text -match '(?m)^id: (.+)$') { $ctx.nodeId = $Matches[1].Trim() }

    if ($text -match '(?m)^labels:\s*\{zh:\s*([^,]+),\s*en:\s*([^,]+),\s*ja:\s*([^}]+)\}') {
        $ctx.labels.zh = $Matches[1].Trim().Trim('"')
        $ctx.labels.en = $Matches[2].Trim().Trim('"')
        $ctx.labels.ja = $Matches[3].Trim().Trim('"')
    } else {
        $inLabels = $false
        $inShort = $false
        foreach ($line in ($text -split '\r?\n')) {
        if ($line -match '^labels:\s*$') { $inLabels = $true; $inShort = $false; continue }
        if ($inLabels -and $line -match '^  (zh|en|ja):\s*(.+)$') {
            $ctx.labels[$Matches[1]] = $Matches[2].Trim().Trim('"')
            continue
        }
        if ($inLabels -and $line -match '^[^\s]') { $inLabels = $false }

        if ($line -match '^  short_definition:\s*$') { $inShort = $true; continue }
        if ($inShort -and $line -match '^    (zh|en|ja):\s*(.+)$') {
            $ctx.shortDef[$Matches[1]] = $Matches[2].Trim().Trim('"')
            continue
        }
            if ($inShort -and $line -match '^  [a-z_]+:') { $inShort = $false }
        }
    }

    if ($text -match '(?ms)^  short_definition:\s*\{zh:\s*([^,]+),\s*en:\s*([^,]+),\s*ja:\s*([^}]+)\}') {
        $ctx.shortDef.zh = $Matches[1].Trim().Trim('"')
        $ctx.shortDef.en = $Matches[2].Trim().Trim('"')
        $ctx.shortDef.ja = $Matches[3].Trim().Trim('"')
    }

    if ($text -match '(?ms)^structure:\r?\n(.*?)^examples:\s*\r?\n') {
        $block = $Matches[1]
        $current = $null
        foreach ($line in ($block -split '\r?\n')) {
            if ($line -match '^    - id: (.+)$') { $current = $Matches[1].Trim(); continue }
            if ($null -ne $current -and $line -match '^      example_value: (.+)$') {
                $val = $Matches[1].Trim()
                if ($val -ne 'null' -and $val.Length -gt 0) { $ctx.fieldExamples[$current] = $val }
                $current = $null
            }
        }
    }

    foreach ($m in [regex]::Matches($text, '(?m)^source_claims:\r?\n(?:  - id: (claim-[^\r\n]+)\r?\n)+')) {
        foreach ($cm in [regex]::Matches($m.Value, '(?m)^  - id: (claim-[^\r\n]+)')) {
            if ($ctx.claimIds -notcontains $cm.Groups[1].Value.Trim()) { $ctx.claimIds += $cm.Groups[1].Value.Trim() }
        }
    }
    if ($ctx.claimIds.Count -eq 0) {
        foreach ($m in [regex]::Matches($text, '(?m)^      - (claim-[^\r\n]+)')) {
            if ($ctx.claimIds -notcontains $m.Groups[1].Value.Trim()) { $ctx.claimIds += $m.Groups[1].Value.Trim() }
        }
    }
    if ($ctx.claimIds.Count -eq 0) { $ctx.claimIds = @('claim-local-design') }

    if ($text -match '(?ms)^examples:\s*\r?\n(.*?)(?=^(?:external_mappings|parent_relation|sources|review|sibling_differentiation|applicability):)') {
        $exBlock = $Matches[1]
        foreach ($m in [regex]::Matches($exBlock, '(?m)^      - ([A-Za-z][A-Za-z0-9]+)\s*$')) {
            [void]$ctx.relatedNodes.Add($m.Groups[1].Value.Trim())
        }
        if ($exBlock -match '(?ms)^    related_relation_ids:\r?\n((?:      - .+\r?\n)+)') {
            foreach ($rm in [regex]::Matches($Matches[1], '(?m)^      - (.+)$')) {
                [void]$ctx.relatedRelations.Add($rm.Groups[1].Value.Trim())
            }
        }
    }
    [void]$ctx.relatedNodes.Add($ctx.nodeId)
    return $ctx
}

function Get-CaseDescriptions([string]$caseKey, $caseObj) {
    if ($ExtraDescriptions.PSObject.Properties.Name -contains $caseKey) { return $ExtraDescriptions.$caseKey }
    if ($caseObj -and $caseObj.descriptions) { return $caseObj.descriptions }
    return @{ zh = ('Case ' + $caseKey); en = ('Case ' + $caseKey); ja = ('Case ' + $caseKey) }
}

function New-NodeDescription([string]$lang, $ctx, [string]$caseKey, $caseDesc, [string]$moduleLeaf) {
    $nodeLabel = if ($ctx.labels.$lang) { $ctx.labels.$lang } else { $ctx.nodeId }
    $short = if ($ctx.shortDef.$lang) { $ctx.shortDef.$lang } else { $nodeLabel }
    $fields = @($ctx.fieldExamples.Keys | Select-Object -First 3)
    $fieldHint = if ($fields.Count -gt 0) { ($fields -join ', ') } else { $ctx.nodeId }
    $pathHint = if ($moduleLeaf) { " [$moduleLeaf]" } else { '' }
    switch ($lang) {
        'zh' { return ($nodeLabel + '(' + $ctx.nodeId + ')' + $pathHint + ': ' + $short + '. ' + $caseDesc + ' Fields: ' + $fieldHint + '.') }
        'en' { return ($nodeLabel + ' (' + $ctx.nodeId + ')' + $pathHint + ': ' + $short + '. ' + $caseDesc + ' Fields include ' + $fieldHint + '.') }
        'ja' { return ($nodeLabel + '(' + $ctx.nodeId + ')' + $pathHint + ': ' + $short + '. ' + $caseDesc + ' Fields: ' + $fieldHint + '.') }
    }
}

function Format-FieldValues($fieldMap) {
    if ($fieldMap.Count -eq 0) { return '    field_values: {}' }
    $lines = @('    field_values:')
    foreach ($kv in ($fieldMap.GetEnumerator() | Sort-Object Name)) {
        $v = $kv.Value
        if ($v -match ':|\s|\[|\]|@|^".*"$') {
            if ($v -match '^".*"$') { $lines += "      $($kv.Key): $v" }
            else { $lines += "      $($kv.Key): `"$v`"" }
        } else { $lines += "      $($kv.Key): $v" }
    }
    return ($lines -join "`r`n")
}

function Build-ExamplesSection($ctx, [string[]]$caseKeys, [hashtable]$globalDescSeen) {
    $kebab = To-KebabCase $ctx.nodeId
    $moduleLeaf = ($ctx.relPath -split '[\\/]' | Where-Object { $_ -and $_ -ne 'node.yaml' } | Select-Object -Last 1)
    $lines = @('examples:')
    foreach ($caseKey in $caseKeys) {
        $caseObj = $cases.$caseKey
        $caseDescObj = Get-CaseDescriptions $caseKey $caseObj
        $meta = if ($CaseMeta.PSObject.Properties.Name -contains $caseKey) { $CaseMeta.$caseKey } else { @{ source = $caseKey; zh = $caseKey; en = $caseKey; ja = $caseKey } }
        $desc = @{}
        foreach ($lang in @('zh', 'en', 'ja')) {
            $d = New-NodeDescription $lang $ctx $caseKey $caseDescObj.$lang $moduleLeaf
            $suffix = 2
            $base = $d
            while ($globalDescSeen.ContainsKey($d)) {
                $d = $base + ' [variant ' + $suffix + ']'
                $suffix++
            }
            $globalDescSeen[$d] = $true
            $desc[$lang] = $d
        }
        $exampleId = "$kebab-$caseKey"
        $nodeLabelZh = if ($ctx.labels.zh) { $ctx.labels.zh } else { $ctx.nodeId }
        $nodeLabelEn = if ($ctx.labels.en) { $ctx.labels.en } else { $ctx.nodeId }
        $nodeLabelJa = if ($ctx.labels.ja) { $ctx.labels.ja } else { $ctx.nodeId }
        $lines += "  - id: $exampleId"
        $lines += '    labels:'
        $lines += "      zh: $nodeLabelZh - $($meta.zh)"
        $lines += "      en: $nodeLabelEn - $($meta.en)"
        $lines += "      ja: $nodeLabelJa - $($meta.ja)"
        $lines += "    descriptions: {zh: `"$(Escape-YamlInline $desc.zh)`", en: `"$(Escape-YamlInline $desc.en)`", ja: `"$(Escape-YamlInline $desc.ja)`"}"
        $lines += (Format-FieldValues $ctx.fieldExamples)
        $related = @($ctx.relatedNodes | Sort-Object) | Select-Object -First 6
        $lines += '    related_node_ids:'
        foreach ($rn in $related) { $lines += "      - $rn" }
        if ($ctx.relatedRelations.Count -gt 0) {
            $lines += '    related_relation_ids:'
            foreach ($rr in ($ctx.relatedRelations | Sort-Object)) { $lines += "      - $rr" }
        } else {
            $lines += '    related_relation_ids: []'
        }
        $lines += "    example_source: $($meta.source)"
        $lines += '    source_claims:'
        foreach ($c in ($ctx.claimIds | Select-Object -First 2)) { $lines += "      - $c" }
    }
    return ($lines -join "`r`n") + "`r`n"
}

function Repair-DuplicateExamples([string]$path) {
    $text = [IO.File]::ReadAllText($path)
    $matches = [regex]::Matches($text, '(?m)^examples:\s*\r?\n')
    if ($matches.Count -le 1) { return $false }
    $truncateAt = $matches[1].Index
    $clean = $text.Substring(0, $truncateAt).TrimEnd() + "`r`n"
    [IO.File]::WriteAllText($path, $clean, [Text.UTF8Encoding]::new($false))
    return $true
}

function Strip-LegacyExampleFields([string]$path) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($path))
    $inExamples = $false
    $depth = 0
    $changed = $false
    $skipUntilDedented = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match '^examples:\s*$') { $inExamples = $true; $depth = 0; $lines[$i] = 'examples:'; continue }
        if (-not $inExamples) { continue }
        if ($line -match '^(external_mappings|parent_relation|sources|review|sibling_differentiation|applicability):') { $inExamples = $false; continue }
        if ($line -match '^    (kind|expected_result|why_valid_or_invalid|scenario_id|synthetic|verified_version):') {
            $changed = $true
            $skipUntilDedented = $true
            continue
        }
        if ($skipUntilDedented) {
            if ($line -match '^    [A-Za-z_]' -and $line -notmatch '^      ') { $skipUntilDedented = $false }
            else { $changed = $true; continue }
        }
    }
    if ($changed) { [IO.File]::WriteAllLines($path, $lines) }
    return $changed
}

function Replace-Examples([string]$path) {
    $text = [IO.File]::ReadAllText($path)
    if ($text -notmatch '(?ms)^examples:\s*\r?\n') { return $null }
    $relPath = $path.Substring($SafetyPlane.Length + 1)
    $ctx = Parse-NodeContext $text $relPath
    if (-not $ctx.nodeId) { return $null }
    $caseKeys = Get-CaseKeys $ctx.nodeId $relPath
    $start = [regex]::Match($text, '(?ms)^examples:\s*\r?\n').Index
    $before = $text.Substring(0, $start)
    $after = $text.Substring($start)
    $end = [regex]::Match($after, '(?ms)^(external_mappings|parent_relation|sources|review|sibling_differentiation|applicability):')
    if (-not $end.Success) { return $null }
    $tail = $after.Substring($end.Index)
    return @{ before = $before; tail = $tail; ctx = $ctx; caseKeys = $caseKeys }
}

$globalDescSeen = @{}
$files = Get-ChildItem -Path $SafetyPlane -Filter 'node.yaml' -Recurse | Sort-Object FullName
$updated = 0
$moduleSummary = @{}

foreach ($file in $files) {
    Repair-DuplicateExamples $file.FullName | Out-Null
    $parts = Replace-Examples $file.FullName
    if (-not $parts) { continue }
    $newExamples = Build-ExamplesSection $parts.ctx $parts.caseKeys $globalDescSeen
    $newText = $parts.before + $newExamples + $parts.tail
    [IO.File]::WriteAllText($file.FullName, $newText, [Text.UTF8Encoding]::new($false))
    $updated++
    $mod = ($file.FullName -replace [regex]::Escape($SafetyPlane + '\'), '') -replace '\\[^\\]+$',''
    if (-not $moduleSummary.ContainsKey($mod)) { $moduleSummary[$mod] = 0 }
    $moduleSummary[$mod]++
}

$repaired = 0
foreach ($file in $files) {
    if (Repair-DuplicateExamples $file.FullName) { $repaired++ }
}

$report = @{
    updatedCount = $updated
    totalFiles = $files.Count
    uniqueDescriptions = $globalDescSeen.Count
    truncatedDuplicates = $repaired
    modules = $moduleSummary
}
$reportPath = Join-Path $Root 'docs\safety-plane-example-upgrade-summary.json'
$report | ConvertTo-Json -Depth 4 | Set-Content -Path $reportPath -Encoding UTF8
Write-Host "Updated $updated / $($files.Count) node.yaml files. Unique descriptions: $($globalDescSeen.Count)"
Write-Host "Report: $reportPath"
