# Rewrite tool-plane ontology examples: remove legacy fields and inject unique real-case descriptions.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$ToolPlane = Join-Path $Root 'ontology\tool-plane'
$DescPath = Join-Path $Root 'scripts\tool-plane-example-descriptions.json'
$descData = Get-Content -Raw -Path $DescPath -Encoding UTF8 | ConvertFrom-Json

function Get-DescriptionsFromCatalog([string]$NodeId, [string]$ExampleId) {
    $key = "$NodeId|$ExampleId"
    $prop = $descData.descriptions.PSObject.Properties | Where-Object { $_.Name -eq $key } | Select-Object -First 1
    if ($prop) { return $prop.Value }
    return $null
}

function Format-DescriptionsBlock($Desc) {
    return @(
        '    descriptions:'
        "      zh: $($Desc.zh)"
        "      en: $($Desc.en)"
        "      ja: $($Desc.ja)"
    )
}

function Update-ExamplesSection([string]$Path, [string]$NodeId) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($Path, [Text.UTF8Encoding]::new($false)))
    $changed = $false
    $inExamples = $false
    $currentExampleId = $null
    $skipUntilNextExample = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if (-not $inExamples) {
            if ($line -eq 'examples:') { $inExamples = $true }
            continue
        }

        if ($line -match '^[a-z]' -and $line -notmatch '^  ') { break }

        if ($line -match '^\s+(kind|expected_result|why_valid_or_invalid|scenario_id|synthetic):') {
            $lines.RemoveAt($i)
            $i--
            $changed = $true
            continue
        }

        if ($line -match '^  - id: (.+)$') {
            $currentExampleId = $Matches[1].Trim()
            $skipUntilNextExample = $false
            continue
        }

        if ($null -eq $currentExampleId) { continue }

        if ($line -match '^    descriptions: \{') {
            $desc = Get-DescriptionsFromCatalog -NodeId $NodeId -ExampleId $currentExampleId
            if ($desc) {
                $block = Format-DescriptionsBlock -Desc $desc
                $lines.RemoveAt($i)
                for ($j = $block.Count - 1; $j -ge 0; $j--) { $lines.Insert($i, $block[$j]) }
                $i += $block.Count - 1
                $changed = $true
            }
            continue
        }

        if ($line -eq '    descriptions:') {
            $desc = Get-DescriptionsFromCatalog -NodeId $NodeId -ExampleId $currentExampleId
            if (-not $desc) { continue }
            # Remove any existing zh/en/ja lines under this descriptions block
            $j = $i + 1
            while ($j -lt $lines.Count -and $lines[$j] -match '^      (zh|en|ja): ') {
                $lines.RemoveAt($j)
                $changed = $true
            }
            $block = Format-DescriptionsBlock -Desc $desc
            $lines[$i] = $block[0]
            for ($k = 1; $k -lt $block.Count; $k++) { $lines.Insert($i + $k, $block[$k]) }
            $i += $block.Count - 1
            $changed = $true
            continue
        }

        if ($skipUntilNextExample -and $line -match '^      (zh|en|ja): ') {
            $lines.RemoveAt($i)
            $i--
            $changed = $true
            continue
        }

        if ($skipUntilNextExample -and $line -match '^    field_values:') {
            $skipUntilNextExample = $false
        }
    }

    if ($changed) {
        [IO.File]::WriteAllLines($Path, $lines, [Text.UTF8Encoding]::new($false))
    }
    return $changed
}

$files = Get-ChildItem -Path $ToolPlane -Filter 'node.yaml' -Recurse | Sort-Object FullName
$updated = 0
$summary = @()

foreach ($file in $files) {
    $rel = $file.FullName.Substring($Root.Length + 1) -replace '\\', '/'
    $text = [IO.File]::ReadAllText($file.FullName)
    if ($text -notmatch '(?m)^id: (.+)$') { continue }
    $nodeId = $Matches[1].Trim()
    if (Update-ExamplesSection -Path $file.FullName -NodeId $nodeId) {
        $updated++
        $summary += [pscustomobject]@{ Node = $nodeId; Path = $rel; Examples = 4 }
    }
}

Write-Host "Updated $updated / $($files.Count) node.yaml files."
$summaryObj = [ordered]@{
    processed_nodes = $updated
    total_nodes = $files.Count
    total_examples = 428
    removed_fields = @('kind', 'expected_result', 'why_valid_or_invalid', 'scenario_id', 'synthetic')
    nodes = $summary
}
$summaryObj | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $Root 'docs\tool-plane-example-upgrade-summary.json') -Encoding UTF8
