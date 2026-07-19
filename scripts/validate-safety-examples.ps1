$root = (Resolve-Path (Join-Path $PSScriptRoot '..\ontology\safety-plane')).Path
$files = Get-ChildItem -Path $root -Recurse -Filter node.yaml
$legacy = @()
$exampleCounts = @{}

foreach ($f in $files) {
    $raw = [IO.File]::ReadAllText($f.FullName)
    $lines = $raw -split "`n" | ForEach-Object { $_.TrimEnd("`r") }
    $inTopExamples = $false
    $count = 0
    foreach ($line in $lines) {
        if ($line -match '^examples:\s*$') {
            $inTopExamples = $true
            continue
        }
        if ($inTopExamples -and ($line -match '^(external_mappings|parent_relation|sources|review|sibling_differentiation):')) {
            break
        }
        if ($inTopExamples) {
            if ($line -match '^\s+- id:') { $count++ }
            if ($line -match '^\s+(kind|expected_result|why_valid_or_invalid|scenario_id|synthetic):') {
                $legacy += $f.FullName
            }
        }
    }
    $exampleCounts[$f.FullName] = $count
}

Write-Output "Files: $($files.Count)"
Write-Output "Top-level legacy fields: $($legacy.Count)"
Write-Output "Nodes with examples: $(@($exampleCounts.Values | Where-Object { $_ -gt 0 }).Count)"
Write-Output "Total top-level examples: $(($exampleCounts.Values | Measure-Object -Sum).Sum)"

$moduleStats = @{}
foreach ($f in $files) {
    $rel = $f.FullName.Substring($root.Length + 1)
    $module = if ($rel.Contains('\')) { $rel.Split('\')[0] } else { 'safety-plane-root' }
    if (-not $moduleStats.ContainsKey($module)) {
        $moduleStats[$module] = @{ nodes = 0; examples = 0 }
    }
    $moduleStats[$module].nodes++
    $moduleStats[$module].examples += $exampleCounts[$f.FullName]
}

Write-Output '--- Module summary ---'
$moduleStats.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Output ("{0}: {1} nodes, {2} examples" -f $_.Key, $_.Value.nodes, $_.Value.examples)
}
