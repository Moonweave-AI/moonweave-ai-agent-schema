$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') 'ontology\runtime-plane')).Path
$Desc = @{}
(Get-Content (Join-Path $PSScriptRoot 'runtime-plane-examples-descriptions.json') -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $Desc[$_.Name] = $_.Value }

$n = 0
Get-ChildItem -LiteralPath $root -Recurse -Filter node.yaml | ForEach-Object {
    $path = $_.FullName
    $lines = Get-Content -LiteralPath $path -Encoding UTF8
    if ($lines.Count -lt 2 -or ($lines[1] -notmatch '^id:\s*(.+)$')) { return }
    $nodeId = $Matches[1].Trim()
    if (-not $Desc.ContainsKey($nodeId)) { return }
    $text = $Desc[$nodeId]
    $inExamples = $false
    $kind = $null
    $changed = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -eq 'examples:') { $inExamples = $true; continue }
        if ($inExamples -and ($line -match '^(parent_relation:|relations:|sources:)')) { break }
        if ($inExamples -and ($line -match '^\s+- id:')) { $kind = $null }
        if ($inExamples -and ($line -match '^\s+kind:\s+(\w+)')) { $kind = $Matches[1]; continue }
        if ($inExamples -and ($kind -eq 'positive' -or $kind -eq 'instance') -and ($line -match '^\s+descriptions:\s*\{')) {
            $lines[$i] = "    descriptions: {zh: `"$text`", en: `"$text`", ja: `"$text`"}"
            $changed = $true
            continue
        }
        if ($inExamples -and ($kind -eq 'positive' -or $kind -eq 'instance') -and ($line -match '^\s+descriptions:\s*$')) {
            if ($i + 1 -lt $lines.Count -and ($lines[$i+1] -match '^\s+zh:')) {
                $lines[$i+1] = "      zh: `"$text`""
                if ($i + 2 -lt $lines.Count -and ($lines[$i+2] -match '^\s+en:')) { $lines[$i+2] = "      en: `"$text`"" }
                if ($i + 3 -lt $lines.Count -and ($lines[$i+3] -match '^\s+ja:')) { $lines[$i+3] = "      ja: `"$text`"" }
                $changed = $true
            }
        }
    }
    if ($changed) {
        [System.IO.File]::WriteAllLines($path, $lines, [System.Text.UTF8Encoding]::new($false))
        $n++
        Write-Host $nodeId
    }
}
Write-Host "Patched $n files"
