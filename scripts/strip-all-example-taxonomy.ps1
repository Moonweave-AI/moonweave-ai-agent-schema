# Remove kind/expected_result/why_valid_or_invalid/scenario_id/synthetic/verified_version from ALL examples (any nesting depth).
param(
    [Parameter(Mandatory = $true)]
    [string[]]$PlaneDirs
)

$ErrorActionPreference = 'Stop'

function Strip-File([string]$Path) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($Path, [Text.Encoding]::UTF8))
    $changed = $false
    $skipUntilIndentDrop = $false
    $skipBaseIndent = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($skipUntilIndentDrop) {
            if ($line -match '^(\s+)') {
                $indent = $Matches[1].Length
                if ($indent -le $skipBaseIndent) {
                    $skipUntilIndentDrop = $false
                } else {
                    $lines[$i] = $null
                    $changed = $true
                    continue
                }
            } elseif ($line -match '^\S') {
                $skipUntilIndentDrop = $false
            } else {
                $lines[$i] = $null
                $changed = $true
                continue
            }
        }

        if ($line -match '^\s{4,}(kind|scenario_id|verified_version|synthetic):') {
            $lines[$i] = $null
            $changed = $true
            continue
        }

        if ($line -match '^\s{4,}(expected_result|why_valid_or_invalid|example_source):') {
            if ($line -match '^(\s+)') { $skipBaseIndent = $Matches[1].Length }
            $lines[$i] = $null
            $changed = $true
            if ($line -match '\{') { continue }
            $skipUntilIndentDrop = $true
            continue
        }
    }

    if ($changed) {
        $out = $lines | Where-Object { $_ -ne $null }
        [IO.File]::WriteAllLines($Path, $out, (New-Object System.Text.UTF8Encoding $false))
    }
    return $changed
}

$total = 0
foreach ($dir in $PlaneDirs) {
    $resolved = (Resolve-Path $dir).Path
    Get-ChildItem -Path $resolved -Filter 'node.yaml' -Recurse | ForEach-Object {
        if (Strip-File -Path $_.FullName) {
            $total++
            Write-Host "Stripped $($_.FullName)"
        }
    }
}
Write-Host "Done: $total files updated"
