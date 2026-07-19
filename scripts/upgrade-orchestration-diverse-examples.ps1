# Minimal orchestration examples upgrader - reads UTF-8 JSON templates.
$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path
$OrchRoot = Join-Path $RepoRoot 'ontology/orchestration-plane'
$DataPath = Join-Path $PSScriptRoot 'orchestration-diverse-sources.json'
$data = Get-Content $DataPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-ModuleKey([string]$RelPath) {
    $norm = $RelPath -replace '\\', '/'
    foreach ($k in $data.moduleSources.PSObject.Properties.Name) {
        if ($norm -like "*$k*") { return $k }
    }
    return 'orchestration-plane'
}

function Infer-ExampleKind([string]$ExampleId) {
    $id = $ExampleId.ToLowerInvariant()
    if ($id -match 'counterexample|confusable|negative') { return 'counterexample' }
    if ($id -match 'boundary') { return 'boundary' }
    if ($id -match 'instance|concrete') { return 'instance' }
    return 'positive'
}

function Get-SourcesForNode([string]$NodeId, [string]$ModuleKey) {
    if ($data.nodeSources.PSObject.Properties.Name -contains $NodeId) {
        return @($data.nodeSources.$NodeId)
    }
    if ($NodeId -like 'A2A*') { return @('a2a','temporal','crewai','autogen') }
    if ($data.moduleSources.PSObject.Properties.Name -contains $ModuleKey) {
        return @($data.moduleSources.$ModuleKey)
    }
    return @($data.moduleSources.'orchestration-plane')
}

function Expand-Template([string]$Template, [string]$NodeId) {
    return $Template -replace '\{nodeId\}', $NodeId
}

function Get-Description([string]$Source, [string]$NodeId, [string]$Kind) {
    $src = $data.templates.$Source
    if (-not $src) { $src = $data.templates.react }
    $kindObj = $src.$Kind
    if (-not $kindObj) { $kindObj = $src.positive }
    return @{
        zh = Expand-Template $kindObj.zh $NodeId
        en = Expand-Template $kindObj.en $NodeId
        ja = Expand-Template $kindObj.ja $NodeId
    }
}

function Get-DefaultLabels([string]$NodeId, [string]$Kind) {
    $suffix = switch ($Kind) {
        'boundary' { ' boundary' }
        'counterexample' { ' counterexample' }
        'instance' { ' instance' }
        default { ' positive' }
    }
    return @{
        zh = $NodeId + $suffix
        en = $NodeId + $suffix
        ja = $NodeId + $suffix
    }
}

function Update-NodeFile([string]$FullPath, [string]$RelPath) {
    $module = Get-ModuleKey $RelPath
    $utf8 = New-Object System.Text.UTF8Encoding $false
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($FullPath, $utf8))

    $nodeId = ($lines | Where-Object { $_ -match '^id:\s*(\S+)' } | Select-Object -First 1)
    if ($nodeId -match '^id:\s*(\S+)') { $nodeId = $Matches[1] } else { return @{ changed = $false; sources = @(); nodeId = '' } }

    $sources = Get-SourcesForNode $nodeId $module
    $inExamples = $false
    $exampleIndex = -1
    $currentKind = 'positive'
    $changed = $false
    $fileSources = [System.Collections.Generic.HashSet[string]]::new()

    $inDescriptions = $false
    $inLabels = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -eq 'examples:') { $inExamples = $true; continue }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims):') { $inExamples = $false; $inDescriptions = $false; $inLabels = $false }

        if ($inExamples -and $line -match '^  - id: (.+)$') {
            $exampleIndex++
            $currentKind = Infer-ExampleKind $Matches[1]
            $inDescriptions = $false
            $inLabels = $false
            continue
        }

        if ($inExamples -and $line -eq '    labels:') { $inLabels = $true; $inDescriptions = $false; continue }
        if ($inExamples -and $line -eq '    descriptions:') { $inDescriptions = $true; $inLabels = $false; continue }
        if ($inExamples -and $line -match '^    [a-z_]+:') { $inLabels = $false; $inDescriptions = $false }

        if ($inExamples -and $inLabels -and $line -match '^      (zh|en|ja): ') {
            $lang = $Matches[1]
            if ($lines[$i].Length -gt 40) {
                $defaultLabels = Get-DefaultLabels $nodeId $currentKind
                $newLabelLine = ('      ' + $lang + ': ' + $defaultLabels[$lang])
                if ($lines[$i] -ne $newLabelLine) {
                    $lines[$i] = $newLabelLine
                    $changed = $true
                }
            }
            continue
        }

        if ($inExamples -and $inDescriptions -and $line -match '^      (zh|en|ja): ') {
            $lang = $Matches[1]
            $sourceIdx = $exampleIndex % $sources.Count
            $source = $sources[$sourceIdx]
            [void]$fileSources.Add($source)
            $desc = Get-Description $source $nodeId $currentKind
            $newLine = ('      ' + $lang + ': ' + $desc[$lang])
            if ($lines[$i] -ne $newLine) {
                $lines[$i] = $newLine
                $changed = $true
            }
        }
    }

    if ($changed) { [IO.File]::WriteAllLines($FullPath, $lines, $utf8) }
    return @{ changed = $changed; sources = @($fileSources); nodeId = $nodeId; module = $module }
}

$sourceCounts = @{}
foreach ($s in $data.sourceIds) { $sourceCounts[$s] = 0 }

$filesUpdated = 0
$nodesTotal = 0
$nodeDetails = @()

Get-ChildItem -Path $OrchRoot -Recurse -Filter 'node.yaml' | Sort-Object FullName | ForEach-Object {
    $nodesTotal++
    $rel = $_.FullName.Substring($OrchRoot.Length + 1)
    $result = Update-NodeFile $_.FullName $rel
    if ($result.changed) { $filesUpdated++ }
    foreach ($s in $result.sources) {
        if ($sourceCounts.ContainsKey($s)) { $sourceCounts[$s]++ }
    }
    $nodeDetails += [pscustomobject]@{
        nodeId = $result.nodeId
        path = $rel
        module = $result.module
        sources = ($result.sources | Sort-Object) -join ', '
        sourceCount = $result.sources.Count
        updated = $result.changed
    }
}

$summary = [ordered]@{
    processedAt = (Get-Date).ToUniversalTime().ToString('o')
    nodesTotal = $nodesTotal
    nodesUpdated = $filesUpdated
    sourceCitationCounts = $sourceCounts
    nodes = $nodeDetails
}

$summaryPath = Join-Path $RepoRoot 'docs/orchestration-examples-upgrade-summary.json'
$summary | ConvertTo-Json -Depth 5 | Set-Content -Path $summaryPath -Encoding UTF8

Write-Host "Processed $nodesTotal nodes"
Write-Host "Updated $filesUpdated node.yaml files"
Write-Host "Source citation counts:"
$sourceCounts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" }
