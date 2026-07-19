# Rewrite runtime-plane node.yaml examples: strip taxonomy fields and apply unique real-case descriptions.
# Usage: powershell -NoProfile -File scripts/rewrite-runtime-plane-examples.ps1

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\ontology\runtime-plane')).Path
$profilesPath = Join-Path $PSScriptRoot 'runtime-plane-example-profiles.json'

if (-not (Test-Path $profilesPath)) {
    throw "Missing profiles file: $profilesPath"
}

$profiles = Get-Content -Raw -Path $profilesPath -Encoding UTF8 | ConvertFrom-Json
$profileMap = @{}
foreach ($prop in $profiles.PSObject.Properties) {
    $profileMap[$prop.Name] = $prop.Value
}

$stripKeys = @('kind', 'expected_result', 'why_valid_or_invalid', 'scenario_id', 'synthetic', 'verified_version')

function Escape-YamlDouble([string]$s) {
    if ($null -eq $s) { return '""' }
    return '"' + ($s -replace '\\', '\\' -replace '"', '\"' -replace "`r", '' -replace "`n", '\n') + '"'
}

function Format-FieldValues([object]$fv) {
    if ($null -eq $fv) { return '{}' }
    if ($fv -is [string]) { return $fv }
    $parts = @()
    foreach ($p in $fv.PSObject.Properties) {
        $val = $p.Value
        if ($val -match '^[0-9]+$' -or $val -match '^[a-f0-9:-]+$' -or $val -match '^[a-z][a-z0-9._/-]*$') {
            $parts += "$($p.Name): $val"
        } else {
            $parts += "$($p.Name): $(Escape-YamlDouble $val)"
        }
    }
    return '{' + ($parts -join ', ') + '}'
}

function Format-StringList([object]$arr) {
    if ($null -eq $arr -or $arr.Count -eq 0) { return '[]' }
    return '[' + (($arr | ForEach-Object { $_ }) -join ', ') + ']'
}

function Format-Labels([object]$labels) {
    $zh = Escape-YamlDouble $labels.zh
    $en = Escape-YamlDouble $labels.en
    $ja = Escape-YamlDouble $labels.ja
    return "{zh: $zh, en: $en, ja: $ja}"
}

function Format-Descriptions([object]$desc) {
    if ($desc.zh -match '\n' -or $desc.en -match '\n' -or $desc.ja -match '\n') {
        $lines = @('    descriptions:')
        $lines += "      zh: |`n$($desc.zh -replace "`r", '')"
        $lines += "      en: |`n$($desc.en -replace "`r", '')"
        $lines += "      ja: |`n$($desc.ja -replace "`r", '')"
        return ($lines -join "`n")
    }
    return "    descriptions: {zh: $(Escape-YamlDouble $desc.zh), en: $(Escape-YamlDouble $desc.en), ja: $(Escape-YamlDouble $desc.ja)}"
}

function Format-Example([object]$ex) {
    $lines = @("  - id: $($ex.id)")
    $lines += "    labels: $(Format-Labels $ex.labels)"
    $lines += (Format-Descriptions $ex.descriptions)
    $lines += "    field_values: $(Format-FieldValues $ex.field_values)"
    $lines += "    related_node_ids: $(Format-StringList $ex.related_node_ids)"
    $relIds = if ($ex.related_relation_ids) { $ex.related_relation_ids } else { @() }
    $lines += "    related_relation_ids: $(Format-StringList $relIds)"
    $claims = if ($ex.source_claims) { $ex.source_claims } else { @() }
    $lines += "    source_claims: $(Format-StringList $claims)"
    if ($ex.example_source) {
        $lines += "    example_source: $(Escape-YamlDouble $ex.example_source)"
    }
    return ($lines -join "`n")
}

function Set-ExamplesBlock {
    param([string]$FilePath, [string]$NewExamplesYaml)
    $content = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
    $pattern = '(?ms)^examples:\r?\n.*?(?=^parent_relation:|^relations:|^sources:)'
    if ($content -notmatch $pattern) { throw "No examples block: $FilePath" }
    $replacement = $NewExamplesYaml.TrimEnd() + "`r`n"
    $updated = [regex]::Replace($content, $pattern, $replacement, 1)
    [System.IO.File]::WriteAllText($FilePath, $updated, [System.Text.UTF8Encoding]::new($false))
}

$updated = 0
$missing = @()
$byModule = @{}

Get-ChildItem -LiteralPath $root -Recurse -Filter node.yaml | ForEach-Object {
    $path = $_.FullName
    $rel = $path.Substring($root.Length + 1)
    $module = ($rel -split '[\\/]')[0]

    $lines = [System.IO.File]::ReadAllLines($path, [System.Text.Encoding]::UTF8)
    if ($lines.Count -lt 2 -or ($lines[1] -notmatch '^id:\s*(.+)$')) { return }
    $nodeId = $Matches[1].Trim()

    if (-not $profileMap.ContainsKey($nodeId)) {
        $missing += $nodeId
        return
    }

    $block = "examples:`n"
    foreach ($ex in $profileMap[$nodeId]) {
        $block += (Format-Example $ex) + "`n"
    }

    Set-ExamplesBlock -FilePath $path -NewExamplesYaml $block
    $updated++
    if (-not $byModule.ContainsKey($module)) { $byModule[$module] = 0 }
    $byModule[$module]++
    Write-Host "Updated $nodeId ($module)"
}

Write-Host "`nUpdated $updated node.yaml files"
if ($missing.Count -gt 0) {
    Write-Warning "Missing profiles for: $($missing -join ', ')"
}

Write-Host "`nBy submodule:"
$byModule.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Value) nodes"
}
