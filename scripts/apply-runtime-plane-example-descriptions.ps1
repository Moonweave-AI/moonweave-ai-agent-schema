# Clean examples and apply unique real-case descriptions from JSON overrides.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\ontology\runtime-plane')).Path
$overridesPath = Join-Path $PSScriptRoot 'runtime-plane-example-overrides.json'

function Escape-YamlDouble([string]$s) {
    if ($null -eq $s) { return '""' }
    return '"' + ($s -replace '\\', '\\' -replace '"', '\"') + '"'
}

function Format-Descriptions-Yaml([hashtable]$d, [int]$indent) {
    $pad = ' ' * $indent
    $pad2 = ' ' * ($indent + 2)
    if ($d.zh -match '\n' -or $d.en -match '\n' -or $d.ja -match '\n') {
        $out = @("${pad}descriptions:")
        foreach ($lang in @('zh','en','ja')) {
            $out += "${pad2}${lang}: |-"
            foreach ($line in ($d[$lang] -split "`n")) { $out += "${pad2}  $line" }
        }
        return ($out -join "`n")
    }
    return "${pad}descriptions: {zh: $(Escape-YamlDouble $d.zh), en: $(Escape-YamlDouble $d.en), ja: $(Escape-YamlDouble $d.ja)}"
}

$DescHints = @{}
(Get-Content (Join-Path $PSScriptRoot 'runtime-plane-examples-descriptions.json') -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object {
    $DescHints[$_.Name] = $_.Value
}

$LabelOverrides = @{}
$DescOverrides = @{}
if (Test-Path $overridesPath) {
    $data = Get-Content -Raw -Path $overridesPath -Encoding UTF8 | ConvertFrom-Json
    foreach ($node in $data.nodes) {
        $labels = @()
        $descs = @()
        foreach ($ex in $node.examples) {
            $labels += @{ zh = $ex.labels.zh; en = $ex.labels.en; ja = $ex.labels.ja }
            $descs += @{
                zh = ([string]$ex.descriptions.zh).Trim()
                en = ([string]$ex.descriptions.en).Trim()
                ja = ([string]$ex.descriptions.ja).Trim()
            }
        }
        $LabelOverrides[$node.id] = $labels
        $DescOverrides[$node.id] = $descs
    }
}

function Get-DefaultDescriptions([string]$nodeId, [int]$idx) {
    $hint = if ($DescHints.ContainsKey($nodeId)) { $DescHints[$nodeId] } else { $nodeId }
    $enPart = @('Primary API case', 'Counterexample', 'Boundary case', 'Production instance')[[Math]::Min($idx, 3)]
    $text = $enPart + ' for ' + $nodeId + ': ' + $hint + '. Include concrete API methods, parameters, response fields, status transitions, and correlated IDs such as thread_id, trace_id, or checkpoint_id.'
    return @{ zh = $text; en = $text; ja = $text }
}

function Get-Descriptions([string]$nodeId, [int]$idx) {
    if ($DescOverrides.ContainsKey($nodeId) -and $DescOverrides[$nodeId].Count -gt $idx) {
        return $DescOverrides[$nodeId][$idx]
    }
    return Get-DefaultDescriptions $nodeId $idx
}

function Get-DefaultLabels([string]$nodeId, [int]$idx) {
    $suffix = @('正例','反例','边界','实例')[$idx]
    if ($null -eq $suffix) { $suffix = '实例' }
    $enSuffix = @('positive case','counterexample','boundary','instance')[$idx]
    if ($null -eq $enSuffix) { $enSuffix = 'instance' }
    $jaSuffix = @('正例','反例','境界','事例')[$idx]
    if ($null -eq $jaSuffix) { $jaSuffix = '事例' }
    return @{ zh = "$nodeId $suffix"; en = "$nodeId $enSuffix"; ja = "$nodeId $jaSuffix" }
}

function Process-File([string]$Path) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8))
    $nodeId = ($lines | Where-Object { $_ -match '^id: ' } | Select-Object -First 1) -replace '^id: ',''

    $exStart = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -eq 'examples:') { $exStart = $i; break }
    }
    if ($exStart -lt 0) { return $false }

    $exEnd = $lines.Count
    for ($i = $exStart + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^(parent_relation|relations|sources):') { $exEnd = $i; break }
    }

    $exampleBlocks = @()
    $current = [System.Collections.Generic.List[string]]::new()
    for ($i = $exStart + 1; $i -lt $exEnd; $i++) {
        $line = $lines[$i]
        if ($line -match '^\s+- id: ') {
            if ($current.Count -gt 0) { $exampleBlocks += ,@($current.ToArray()) }
            $current = [System.Collections.Generic.List[string]]::new()
        }
        if ($line.Trim().Length -gt 0) { $current.Add($line) }
    }
    if ($current.Count -gt 0) { $exampleBlocks += ,@($current.ToArray()) }

    $newExampleLines = [System.Collections.Generic.List[string]]::new()
    $newExampleLines.Add('examples:')
    $idx = 0
    foreach ($block in $exampleBlocks) {
        $exampleId = ($block | Where-Object { $_ -match '^\s+- id: (.+)$' } | Select-Object -First 1) -replace '^\s+- id: ',''
        $desc = Get-Descriptions $nodeId $idx
        $labelsLine = ($block | Where-Object { $_ -match '^\s+labels:' } | Select-Object -First 1)
        if ($LabelOverrides.ContainsKey($nodeId) -and $LabelOverrides[$nodeId].Count -gt $idx) {
            $labels = $LabelOverrides[$nodeId][$idx]
            $labelsLine = "    labels: {zh: $(Escape-YamlDouble $labels.zh), en: $(Escape-YamlDouble $labels.en), ja: $(Escape-YamlDouble $labels.ja)}"
        } elseif ($labelsLine) {
            # keep original labels line from node.yaml
        } else {
            $labels = Get-DefaultLabels $nodeId $idx
            $labelsLine = "    labels: {zh: $(Escape-YamlDouble $labels.zh), en: $(Escape-YamlDouble $labels.en), ja: $(Escape-YamlDouble $labels.ja)}"
        }

        $newExampleLines.Add("  - id: $exampleId")
        $newExampleLines.Add($labelsLine)
        $newExampleLines.Add((Format-Descriptions-Yaml $desc 4))

        $inDesc = $false
        $descIndent = 0
        foreach ($line in $block) {
            if ($line -match '^\s+descriptions:' ) { $inDesc = $true; $descIndent = 4; continue }
            if ($inDesc) {
                if ($line -match '^(\s+)') {
                    if ($Matches[1].Length -le $descIndent) { $inDesc = $false } else { continue }
                } else { $inDesc = $false }
            }
            if ($line -match '^\s+- id:' ) { continue }
            if ($line -match '^\s+labels:' ) { continue }
            if ($line -match '^\s+(kind|expected_result|why_valid_or_invalid|scenario_id|synthetic|verified_version):' ) { continue }
            $newExampleLines.Add($line)
        }
        $idx++
    }

    $out = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $exStart; $i++) { $out.Add($lines[$i]) }
    foreach ($l in $newExampleLines) { $out.Add($l) }
    for ($i = $exEnd; $i -lt $lines.Count; $i++) { $out.Add($lines[$i]) }

    [System.IO.File]::WriteAllLines($Path, $out, [System.Text.UTF8Encoding]::new($false))
    return $true
}

$updated = 0
$byModule = @{}
Get-ChildItem -LiteralPath $root -Recurse -Filter node.yaml | ForEach-Object {
    if (Process-File -Path $_.FullName) {
        $updated++
        $rel = $_.FullName.Substring($root.Length + 1)
        $module = ($rel -split '[\\/]')[0]
        if (-not $byModule.ContainsKey($module)) { $byModule[$module] = 0 }
        $byModule[$module]++
        Write-Host $rel
    }
}

Write-Host "Enhanced $updated node.yaml files"
$byModule.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name): $($_.Value)" }
