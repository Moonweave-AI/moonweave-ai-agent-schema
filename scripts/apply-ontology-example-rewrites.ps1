# Replace entire examples: sections in node.yaml files from JSON maps.
# JSON shape: { "relative/path/to/node.yaml": "  - id: ...\n    labels: ..." }
param(
    [Parameter(Mandatory = $true)]
    [string]$DataPath,
    [string]$OntologyRoot = (Join-Path $PSScriptRoot '..\ontology')
)

$ErrorActionPreference = 'Stop'
$OntologyRoot = (Resolve-Path $OntologyRoot).Path
$data = Get-Content -Raw -Path $DataPath -Encoding UTF8 | ConvertFrom-Json
$updated = 0
$skipped = 0

foreach ($prop in $data.PSObject.Properties) {
    $relPath = $prop.Name -replace '/', [IO.Path]::DirectorySeparatorChar
    $fullPath = Join-Path $OntologyRoot $relPath
    if (-not (Test-Path $fullPath)) {
        Write-Warning "Missing: $relPath"
        $skipped++
        continue
    }

    $content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
    $block = ($prop.Value -replace "`r`n", "`n").TrimEnd()
    if (-not $block.StartsWith('- id:')) {
        $block = "  $block"
    }

    $newExamples = "examples:`n$block`n"

    if ($content -match '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):)') {
        $newContent = [regex]::Replace($content, '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):)', $newExamples, 1)
    }
    elseif ($content -match '(?ms)^examples:\r?\n.*\z') {
        $newContent = [regex]::Replace($content, '(?ms)^examples:\r?\n.*\z', $newExamples.TrimEnd(), 1)
    }
    else {
        Write-Warning "No examples section: $relPath"
        $skipped++
        continue
    }

    if ($newContent -ne $content) {
        [System.IO.File]::WriteAllText($fullPath, $newContent, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "Updated $relPath"
        $updated++
    }
}

Write-Host "Done. Updated=$updated Skipped=$skipped"
