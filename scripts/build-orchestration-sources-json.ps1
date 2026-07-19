$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path
$mjsPath = Join-Path $PSScriptRoot 'orchestration-diverse-sources.mjs'
$mjs = Get-Content $mjsPath -Raw -Encoding UTF8

function Parse-SourceMap {
    param([string]$Block)
    $h = @{}
    [regex]::Matches($Block, "['""]?([\w-]+)['""]?\s*:\s*\[([^\]]+)\]") | ForEach-Object {
        $key = $_.Groups[1].Value
        $vals = ($_.Groups[2].Value -split ',') | ForEach-Object { $_.Trim().Trim("'").Trim('"') } | Where-Object { $_ }
        $h[$key] = $vals
    }
    return $h
}

$nodeBlock = [regex]::Match($mjs, 'export const NODE_SOURCE_MAP = \{([\s\S]*?)\};').Groups[1].Value
$modBlock = [regex]::Match($mjs, 'export const MODULE_SOURCE_MAP = \{([\s\S]*?)\};').Groups[1].Value
$nodeSources = Parse-SourceMap $nodeBlock
$moduleSources = Parse-SourceMap $modBlock

$sourceIds = @('react','cot','tot','reflexion','mrkl','voyager','taskweaver','autogen','dspy','crewai','prefect','temporal','a2a','litellm')
$kinds = @('positive','boundary','counterexample','instance')
$templates = @{}

foreach ($sid in $sourceIds) {
    $templates[$sid] = @{}
    $srcPattern = [regex]::Escape($sid) + ':\s*\(\{ nodeId, kind \}\)\s*=>\s*\{([\s\S]*?)\r?\n  \},'
    $srcMatch = [regex]::Match($mjs, $srcPattern)
    $body = $srcMatch.Groups[1].Value
    foreach ($kind in $kinds) {
        $kindPattern = [regex]::Escape($kind) + ':\s*\{\s*zh:\s*`([\s\S]*?)`,\s*en:\s*`([\s\S]*?)`,\s*ja:\s*`([\s\S]*?)`'
        $kindMatch = [regex]::Match($body, $kindPattern)
        if ($kindMatch.Success) {
            $zh = $kindMatch.Groups[1].Value -replace '\$\{nodeId\}', '{nodeId}'
            $en = $kindMatch.Groups[2].Value -replace '\$\{nodeId\}', '{nodeId}'
            $ja = $kindMatch.Groups[3].Value -replace '\$\{nodeId\}', '{nodeId}'
        } else {
            $zh = "$sid $kind for " + '{nodeId}' + '.'
            $en = "$sid $kind for " + '{nodeId}' + '.'
            $ja = "$sid $kind for " + '{nodeId}' + '.'
        }
        $templates[$sid][$kind] = @{ zh = $zh; en = $en; ja = $ja }
    }
}

$out = [ordered]@{
    sourceIds = $sourceIds
    templates = $templates
    nodeSources = $nodeSources
    moduleSources = $moduleSources
}

$jsonPath = Join-Path $PSScriptRoot 'orchestration-diverse-sources.json'
$out | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "Wrote $jsonPath"
Write-Host "Node mappings: $($nodeSources.Count)"
