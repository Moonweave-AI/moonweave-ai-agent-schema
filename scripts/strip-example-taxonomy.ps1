# Remove kind/expected_result/why_valid_or_invalid/scenario_id/verified_version/example_source from examples.
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaneDir
)

$ErrorActionPreference = 'Stop'
$PlaneDir = (Resolve-Path $PlaneDir).Path
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

        if ($line -match '^    (kind|scenario_id|verified_version):') {
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
        if ($line -eq '    synthetic: true') {
            $lines[$i] = '    synthetic: false'
            $changed = $true
        }
    }

    if ($changed) {
        $out = $lines | Where-Object { $_ -ne $null }
        [System.IO.File]::WriteAllLines($Path, $out, (New-Object System.Text.UTF8Encoding $false))
    }
    return $changed
}

Get-ChildItem -Path $PlaneDir -Filter 'node.yaml' -Recurse | ForEach-Object {
    if (Strip-ExamplesInFile -Path $_.FullName) {
        $updated++
        Write-Host "Stripped $($_.FullName.Substring($PlaneDir.Length + 1))"
    }
}

Write-Host "Stripped taxonomy fields in $updated files under $PlaneDir"
