param(
    [string]$PlaneDir = (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) 'ontology\info-plane')
)

$ErrorActionPreference = 'Stop'
$PlaneDir = (Resolve-Path $PlaneDir).Path
$fixed = 0

Get-ChildItem -Path $PlaneDir -Filter 'node.yaml' -Recurse | ForEach-Object {
    $lines = [IO.File]::ReadAllLines($_.FullName, [Text.Encoding]::UTF8)
    $out = New-Object System.Collections.Generic.List[string]
    $inExamples = $false
    $changed = $false
    $blankRun = 0

    foreach ($line in $lines) {
        if ($line -eq 'examples:') {
            $inExamples = $true
            $blankRun = 0
            $out.Add($line)
            continue
        }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims|relations):') {
            $inExamples = $false
            $blankRun = 0
            $out.Add($line)
            continue
        }
        if ($inExamples -and [string]::IsNullOrWhiteSpace($line)) {
            $blankRun++
            if ($blankRun -le 1) { $out.Add('') }
            else { $changed = $true }
            continue
        }
        $blankRun = 0
        $out.Add($line)
    }

    if ($changed) {
        [IO.File]::WriteAllLines($_.FullName, $out, (New-Object Text.UTF8Encoding $false))
        $fixed++
    }
}

Write-Host "Removed extra blank lines in $fixed files"
