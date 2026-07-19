# Apply UTF-8 YAML example snippets to node.yaml files.
# Snippet naming: path segments joined by __, e.g. RoutingTarget__RoutingDecision.yaml -> RoutingTarget/RoutingDecision/node.yaml
# Special: _root.yaml -> node.yaml at NodeRoot
param(
    [Parameter(Mandatory = $true)]
    [string]$SnippetDir,
    [Parameter(Mandatory = $true)]
    [string]$NodeRoot
)

$ErrorActionPreference = 'Stop'
$SnippetDir = (Resolve-Path $SnippetDir).Path
$NodeRoot = (Resolve-Path $NodeRoot).Path
$count = 0

Get-ChildItem -Path $SnippetDir -Filter '*.yaml' | ForEach-Object {
    $base = $_.BaseName
    if ($base -eq '_root') {
        $rel = 'node.yaml'
    } else {
        $rel = ($base -replace '__', [IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar + 'node.yaml'
    }
    $full = Join-Path $NodeRoot $rel
    if (-not (Test-Path $full)) {
        Write-Warning "Skip missing node: $rel"
        return
    }
    $block = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8).TrimEnd()
    $content = [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
    $newExamples = "examples:`n$block`n"
    if ($content -match '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):)') {
        $newContent = [regex]::Replace($content, '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):)', $newExamples, 1)
    } else {
        Write-Warning "No examples anchor: $rel"
        return
    }
    [System.IO.File]::WriteAllText($full, $newContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "OK $rel"
    $count++
}

Write-Host "Applied $count snippet(s) from $SnippetDir"
