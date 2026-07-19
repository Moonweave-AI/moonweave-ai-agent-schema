# Remove kind, expected_result, why_valid_or_invalid, scenario_id, synthetic, verified_version from runtime-plane examples.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\ontology\runtime-plane')).Path
$updated = 0

function Strip-ExamplesInFile([string]$Path) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8))
    $changed = $false
    $inExamples = $false
    $skipUntilIndentDrop = $false
    $skipBaseIndent = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($line -eq 'examples:') { $inExamples = $true; continue }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims|relations):') { $inExamples = $false }

        if (-not $inExamples) { continue }

        if ($skipUntilIndentDrop) {
            if ($line -match '^\S' -or ($line -match '^(\s+)' -and $Matches[1].Length -le $skipBaseIndent)) {
                $skipUntilIndentDrop = $false
            } else {
                $lines[$i] = $null
                $changed = $true
                continue
            }
        }

        if ($line -match '^    (kind|scenario_id|verified_version|synthetic):') {
            $lines[$i] = $null
            $changed = $true
            continue
        }
        if ($line -match '^    (expected_result|why_valid_or_invalid|example_source):') {
            $skipUntilIndentDrop = $true
            $skipBaseIndent = 4
            $lines[$i] = $null
            $changed = $true
            continue
        }
    }

    if ($changed) {
        $out = $lines | Where-Object { $_ -ne $null }
        [System.IO.File]::WriteAllLines($Path, $out, (New-Object System.Text.UTF8Encoding $false))
    }
    return $changed
}

Get-ChildItem -Path $root -Filter 'node.yaml' -Recurse | ForEach-Object {
    if (Strip-ExamplesInFile -Path $_.FullName) {
        $updated++
    }
}

Write-Host "Stripped taxonomy fields in $updated files under runtime-plane"
