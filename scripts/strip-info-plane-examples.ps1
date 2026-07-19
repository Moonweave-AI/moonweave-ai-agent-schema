param(
    [string]$PlaneDir = (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) 'ontology\info-plane')
)

$ErrorActionPreference = 'Stop'
$PlaneDir = (Resolve-Path $PlaneDir).Path
$updated = 0

function Slugify([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return 'case' }
    $s = $Text.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $s = $s.Trim('-')
    if ($s.Length -gt 36) { $s = $s.Substring(0, 36).Trim('-') }
    if ([string]::IsNullOrWhiteSpace($s)) { return 'case' }
    return $s
}

function Rename-ExampleId([string]$Id, [string]$LabelEn) {
    $newId = $Id
    $newId = $newId.Replace('-positive-', '-')
    $newId = $newId.Replace('-counterexample-', '-invalid-')
    $newId = $newId.Replace('-counter-', '-invalid-')
    $newId = $newId.Replace('-boundary-', '-')
    $newId = $newId.Replace('-instance-', '-')
    foreach ($suffix in @('-positive', '-counterexample', '-counter', '-boundary')) {
        if ($newId.EndsWith($suffix)) {
            $newId = $newId.Substring(0, $newId.Length - $suffix.Length)
            $slug = Slugify $LabelEn
            if ($suffix -match 'counter') { $newId = "$newId-invalid-$slug" }
            elseif ($suffix -eq '-boundary') { $newId = "$newId-boundary-$slug" }
            else { $newId = "$newId-$slug" }
        }
    }
    if ($newId.EndsWith('-instance')) {
        $newId = $newId.Substring(0, $newId.Length - 9) + '-' + (Slugify $LabelEn)
    }
    while ($newId.Contains('--')) { $newId = $newId.Replace('--', '-') }
    $newId = $newId.Trim('-')
    if ([string]::IsNullOrWhiteSpace($newId)) { return $Id }
    return $newId
}

function Strip-ExamplesInFile([string]$Path) {
    $lines = [IO.File]::ReadAllLines($Path, [Text.Encoding]::UTF8)
    $changed = $false
    $inExamples = $false
    $skipUntilIndentDrop = $false
    $skipBaseIndent = 0
    $pendingIdLine = -1
    $pendingLabelEn = $null
    $inLabels = $false
    $out = New-Object System.Collections.Generic.List[string]

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($line -eq 'examples:') {
            $inExamples = $true
            $out.Add($line)
            continue
        }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims|relations):') {
            $inExamples = $false
            $inLabels = $false
        }

        if (-not $inExamples) {
            $out.Add($line)
            continue
        }

        if ($skipUntilIndentDrop) {
            if ($line -match '^\S' -or ($line -match '^(\s+)' -and $Matches[1].Length -le $skipBaseIndent)) {
                $skipUntilIndentDrop = $false
            } else {
                $changed = $true
                continue
            }
        }

        if ($line -match '^  - id: (.+)$') {
            if ($pendingIdLine -ge 0 -and $pendingLabelEn -and $out[$pendingIdLine] -match '^  - id: ') {
                $old = ($out[$pendingIdLine] -replace '^  - id: ','').Trim()
                $renamed = Rename-ExampleId -Id $old -LabelEn $pendingLabelEn
                if ($renamed -ne $old) {
                    $out[$pendingIdLine] = "  - id: $renamed"
                    $changed = $true
                }
            }
            $pendingIdLine = $out.Count
            $pendingLabelEn = $null
            $inLabels = $false
            $out.Add($line)
            continue
        }

        if ($line -eq '    labels:' -or $line -match '^    labels:\s*\{') {
            $inLabels = $true
            if ($line -match 'en:\s*([^,}]+)') { $pendingLabelEn = $Matches[1].Trim() }
            $out.Add($line)
            continue
        }

        if ($inLabels -and $line -match '^\s+en:\s*(.+)$') {
            $pendingLabelEn = $Matches[1].Trim()
            $out.Add($line)
            continue
        }

        if ($inLabels -and $line -notmatch '^\s{4,}') { $inLabels = $false }

        if ($line -match '^    (kind|scenario_id|verified_version|synthetic):') {
            $changed = $true
            continue
        }
        if ($line -match '^    (expected_result|why_valid_or_invalid|example_source):') {
            $skipUntilIndentDrop = $true
            $skipBaseIndent = 4
            $changed = $true
            continue
        }

        $out.Add($line)
    }

    if ($pendingIdLine -ge 0 -and $pendingLabelEn -and $out[$pendingIdLine] -match '^  - id: ') {
        $old = ($out[$pendingIdLine] -replace '^  - id: ','').Trim()
        $renamed = Rename-ExampleId -Id $old -LabelEn $pendingLabelEn
        if ($renamed -ne $old) {
            $out[$pendingIdLine] = "  - id: $renamed"
            $changed = $true
        }
    }

    if ($changed) {
        [IO.File]::WriteAllLines($Path, $out, (New-Object Text.UTF8Encoding $false))
    }
    return $changed
}

Get-ChildItem -Path $PlaneDir -Filter 'node.yaml' -Recurse | ForEach-Object {
    if (Strip-ExamplesInFile -Path $_.FullName) {
        $updated++
    }
}

Write-Host "Processed $updated files"
