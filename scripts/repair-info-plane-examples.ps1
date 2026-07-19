# Repair corrupted info-plane examples: strip taxonomy blocks, orphan locale lines, trim merged labels.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$Utf8 = New-Object System.Text.UTF8Encoding $false
$InfoPlane = Join-Path $Root 'ontology\info-plane'

function Is-ExamplesEnd([string]$Line) {
    return $Line -match '^(parent_relation|sources|source_claims|relations|external_mappings|applicability|review|module_contract):'
}

function Is-TaxonomyField([string]$Line) {
    return $Line -match '^    (kind|expected_result|why_valid_or_invalid|scenario_id|synthetic|example_source|verified_version):'
}

function Is-LocaleLine([string]$Line) {
    return $Line -match '^\s+(zh|en|ja):'
}

function Repair-File([string]$Path) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($Path, $Utf8))
    $changed = $false
    $inExamples = $false
    $inLabels = $false
    $labelTripletCount = 0
    $skipUntilIndent = -1

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($skipUntilIndent -ge 0) {
            if ($line -match '^(\s*)') {
                $indent = $Matches[1].Length
                if ($indent -le $skipUntilIndent -and $line.Trim() -ne '') {
                    $skipUntilIndent = -1
                }
                else {
                    $lines[$i] = $null
                    $changed = $true
                    continue
                }
            }
        }

        if ($line -eq 'examples:') {
            $inExamples = $true
            $inLabels = $false
            $labelTripletCount = 0
            continue
        }

        if ($inExamples -and (Is-ExamplesEnd $line)) {
            $inExamples = $false
            $inLabels = $false
            continue
        }

        if (-not $inExamples) { continue }

        if ($line -match '^  - id:') {
            $inLabels = $false
            $labelTripletCount = 0
            continue
        }

        if (Is-TaxonomyField $line) {
            $lines[$i] = $null
            $changed = $true
            $skipUntilIndent = 4
            continue
        }

        if ($line -eq '    labels:') {
            $inLabels = $true
            $labelTripletCount = 0
            continue
        }

        if ($inLabels -and (Is-LocaleLine $line)) {
            if ($line -match '^\s+zh:') { $labelTripletCount++ }
            if ($labelTripletCount -gt 1) {
                $lines[$i] = $null
                $changed = $true
                continue
            }
            continue
        }

        if ($inLabels -and -not (Is-LocaleLine $line)) {
            $inLabels = $false
        }

        if ($line -match '^    (field_values|related_node_ids|related_relation_ids|source_claims):') {
            $inLabels = $false
            continue
        }

        if ($line -match '^    descriptions:') {
            $inLabels = $false
            continue
        }

        if ($line -match '^\s{6}(zh|en|ja):' -and -not $inLabels) {
            $prev = ''
            for ($p = $i - 1; $p -ge 0; $p--) {
                if ($null -eq $lines[$p] -or $lines[$p].Trim() -eq '') { continue }
                $prev = $lines[$p]
                break
            }
            if ($prev -match '^    (related_node_ids|related_relation_ids|source_claims):' -or
                $prev -match '^\s+- ' -or
                $prev -match '^\s{6}[A-Za-z0-9_@]+:' -or
                $prev -match 'related_relation_ids:\s*\[\]' -or
                $prev.Trim() -eq '[]' -or
                $prev.Trim() -eq '{}') {
                $lines[$i] = $null
                $changed = $true
                continue
            }
        }

        if ($line -match '^\s{6}[A-Za-z0-9_@]+:' -and -not $inLabels) {
            $prev = ''
            for ($p = $i - 1; $p -ge 0; $p--) {
                if ($null -eq $lines[$p] -or $lines[$p].Trim() -eq '') { continue }
                $prev = $lines[$p]
                break
            }
            if ($prev -match '^    source_claims:' -or $prev -match '^\s+- claim-') {
                $lines[$i] = $null
                $changed = $true
                continue
            }
        }
    }

    if ($changed) {
        $out = $lines | Where-Object { $_ -ne $null }
        [IO.File]::WriteAllLines($Path, $out, $Utf8)
    }
    return $changed
}

$repaired = 0
Get-ChildItem $InfoPlane -Filter node.yaml -Recurse | ForEach-Object {
    $text = [IO.File]::ReadAllText($_.FullName, $Utf8)
    if ($text -notmatch '(?ms)^examples:') { return }
    if (Repair-File $_.FullName) { $repaired++ }
}
Write-Host "Repaired $repaired files"
