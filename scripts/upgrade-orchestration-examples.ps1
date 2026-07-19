# Upgrade orchestration-plane examples (line-based, no catastrophic regex)
$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path
$OrchRoot = Join-Path $RepoRoot 'ontology/orchestration-plane'
$DataPath = Join-Path $PSScriptRoot 'orchestration-real-examples.json'
$data = Get-Content $DataPath -Raw -Encoding UTF8 | ConvertFrom-Json
$exampleMap = @{}
$data.examples.PSObject.Properties | ForEach-Object { $exampleMap[$_.Name] = $_.Value }
$defaults = @{
    positive = $data.defaults.positive
    boundary = $data.defaults.boundary
    counterexample = $data.defaults.counterexample
    instance = $data.defaults.instance
}

function Get-ModuleFromPath([string]$RelPath) {
    $parts = $RelPath -replace '\\','/' -split '/'
    if ($parts[0] -eq 'node.yaml') { return 'orchestration-plane' }
    return $parts[0]
}

function Resolve-Example([string]$Module, [string]$NodeId, [string]$Kind) {
    foreach ($k in @("$Module|$NodeId|$Kind", "$Module|*|$Kind")) {
        if ($exampleMap.ContainsKey($k)) { return $exampleMap[$k] }
    }
    return $defaults[$Kind]
}

function Update-FileLines([string]$FullPath, [string]$RelPath) {
    $module = Get-ModuleFromPath $RelPath
    $lines = Get-Content $FullPath -Encoding UTF8
    $nodeId = ($lines | Where-Object { $_ -match '^id:\s*(\S+)' } | Select-Object -First 1)
    if ($nodeId -match '^id:\s*(\S+)') { $nodeId = $Matches[1] } else { return $false }

    $out = New-Object System.Collections.Generic.List[string]
    $inExamples = $false
    $inExample = $false
    $currentKind = $null
    $descReplaced = $false
    $sourceAdded = $false
    $changed = $false
    $i = 0

    while ($i -lt $lines.Count) {
        $line = $lines[$i]

        if ($line -eq 'examples:') { $inExamples = $true; $out.Add($line); $i++; continue }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims):') { $inExamples = $false; $inExample = $false }

        if ($inExamples -and $line -match '^  - id: ') {
            $inExample = $true
            $currentKind = $null
            $descReplaced = $false
            $sourceAdded = $false
            $out.Add($line); $i++; continue
        }

        if ($inExample -and $line -match '^\s+kind:\s+(\w+)\s*$') {
            $currentKind = $Matches[1]
            $out.Add($line); $i++; continue
        }

        if ($inExample -and $currentKind -and -not $descReplaced -and $line -match '^\s+descriptions:\s*$') {
            $ex = Resolve-Example -Module $module -NodeId $nodeId -Kind $currentKind
            $out.Add($line)
            $out.Add("      zh: $($ex.zh)")
            $out.Add("      en: $($ex.en)")
            $out.Add("      ja: $($ex.ja)")
            $descReplaced = $true
            $changed = $true
            $i++
            while ($i -lt $lines.Count -and $lines[$i] -match '^\s+(zh|en|ja):') { $i++ }
            continue
        }

        if ($inExample -and $currentKind -and -not $sourceAdded -and $line -match '^\s+field_values:\s*$') {
            $ex = Resolve-Example -Module $module -NodeId $nodeId -Kind $currentKind
            $out.Add('    example_source:')
            $out.Add("      product: $($ex.product)")
            $out.Add("      url: $($ex.url)")
            $sourceAdded = $true
            $changed = $true
            $out.Add($line); $i++; continue
        }

        if ($inExample -and $line -match '^\s+synthetic:\s+true\s*$') {
            $out.Add(($line -replace 'true\s*$', 'false'))
            $changed = $true
            $i++; continue
        }

        $out.Add($line); $i++
    }

    if ($changed) {
        Set-Content -Path $FullPath -Value ($out -join "`r`n") -Encoding UTF8 -NoNewline
        return $true
    }
    return $false
}

$summary = @{}
$count = 0
Get-ChildItem -Path $OrchRoot -Recurse -Filter 'node.yaml' | ForEach-Object {
    $rel = $_.FullName.Substring($OrchRoot.Length + 1)
    if (Update-FileLines -FullPath $_.FullName -RelPath $rel) {
        $count++
        $module = Get-ModuleFromPath $rel
        $nodeId = (Select-String -Path $_.FullName -Pattern '^id:\s*(\S+)' | Select-Object -First 1).Matches.Groups[1].Value
        $pos = Resolve-Example -Module $module -NodeId $nodeId -Kind 'positive'
        $summary[$rel] = @{ nodeId = $nodeId; product = $pos.product; url = $pos.url }
    }
}

$summaryPath = Join-Path $RepoRoot 'docs/orchestration-examples-upgrade-summary.json'
$summary | ConvertTo-Json -Depth 4 | Set-Content -Path $summaryPath -Encoding UTF8
Write-Host "Updated $count files. Summary: $summaryPath"
