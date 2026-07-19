$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') 'ontology\runtime-plane')).Path
$Desc = Get-Content (Join-Path $PSScriptRoot 'runtime-plane-examples-descriptions.json') -Raw -Encoding UTF8 | ConvertFrom-Json

function Update-Descriptions {
    param([string]$FilePath, [string]$Text)
    $content = Get-Content -LiteralPath $FilePath -Raw -Encoding UTF8
    $changed = $false
    foreach ($kind in @('positive','instance')) {
        $pattern = "(?ms)(- id: [^\r\n]+\r?\n\s+kind: $kind\r?\n(?:.*?\r\n)*?\s+descriptions:\s*\r?\n\s+zh:\s*)[^\r\n]+"
        if ($content -match $pattern) {
            $content = [regex]::Replace($content, $pattern, "`${1}$Text", 1)
            $changed = $true
        }
        $pattern2 = "(?ms)(- id: [^\r\n]+\r?\n\s+kind: $kind\r?\n(?:.*?\r?\n)*?\s+descriptions:\s*\{\s*zh:\s*)[^,}]+"
        if ($content -match $pattern2) {
            $content = [regex]::Replace($content, $pattern2, "`${1}$Text", 1)
            $changed = $true
        }
    }
    if ($changed) {
        [System.IO.File]::WriteAllText($FilePath, $content, [System.Text.UTF8Encoding]::new($false))
    }
    return $changed
}

$n = 0
Get-ChildItem -LiteralPath $root -Recurse -Filter node.yaml | ForEach-Object {
    $raw = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8
    if ($raw -notmatch '(?m)^id:\s*(.+)$') { return }
    $id = $Matches[1].Trim()
    if ($Desc.PSObject.Properties.Name -contains $id) {
        $text = $Desc.$id
        if (Update-Descriptions -FilePath $_.FullName -Text $text) { $n++; Write-Host "  $id" }
    }
}
Write-Host "Updated descriptions in $n files"
