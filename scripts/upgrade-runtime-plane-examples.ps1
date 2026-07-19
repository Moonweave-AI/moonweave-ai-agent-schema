# Upgrade runtime-plane node.yaml examples with real industry cases.
# Usage: powershell -NoProfile -File scripts/upgrade-runtime-plane-examples.ps1

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') 'ontology\runtime-plane')).Path
$skip = @('TraceSpan', 'runtime-plane', 'runtime-actors')

function Set-ExamplesBlock {
    param([string]$FilePath, [string]$NewExamplesYaml)
    $content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8
    $pattern = '(?ms)^examples:\r?\n.*?(?=^parent_relation:|^relations:|^sources:)'
    if ($content -notmatch $pattern) { throw "No examples block: $FilePath" }
    $replacement = $NewExamplesYaml.TrimEnd() + "`r`n"
    $updated = [regex]::Replace($content, $pattern, $replacement, 1)
    [System.IO.File]::WriteAllText($FilePath, $updated, [System.Text.UTF8Encoding]::new($false))
}

function Flip-SyntheticForRealKinds {
    param([string]$FilePath)
    $lines = Get-Content -LiteralPath $FilePath -Encoding UTF8
    $out = New-Object System.Collections.Generic.List[string]
    $kind = $null
    $changed = $false
    foreach ($line in $lines) {
        if ($line -match '^\s+kind:\s+(\w+)') { $kind = $Matches[1] }
        if ($line -match '^\s+synthetic:\s+true' -and ($kind -eq 'positive' -or $kind -eq 'instance')) {
            $out.Add(($line -replace 'synthetic:\s+true', 'synthetic: false'))
            $changed = $true
            continue
        }
        if ($line -match '^\s+- id:') { $kind = $null }
        $out.Add($line)
    }
    if ($changed) {
        [System.IO.File]::WriteAllLines($FilePath, $out, [System.Text.UTF8Encoding]::new($false))
    }
    return $changed
}

. (Join-Path $PSScriptRoot 'runtime-plane-examples-blocks.ps1')

$updated = @()
Get-ChildItem -LiteralPath $root -Recurse -Filter node.yaml | ForEach-Object {
    $raw = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8
    if ($raw -notmatch '(?m)^id:\s*(.+)$') { return }
    $id = $Matches[1].Trim()
    if ($ExampleBlocks.ContainsKey($id)) {
        Set-ExamplesBlock -FilePath $_.FullName -NewExamplesYaml $ExampleBlocks[$id]
        $updated += "$id (full)"
    } elseif ($skip -notcontains $id) {
        if (Flip-SyntheticForRealKinds -FilePath $_.FullName) { $updated += "$id (synthetic)" }
    }
}

Write-Host "Updated $($updated.Count) files"
$updated | Sort-Object | ForEach-Object { Write-Host "  $_" }
