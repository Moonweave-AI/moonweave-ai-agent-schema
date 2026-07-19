$j = Get-Content (Join-Path $PSScriptRoot '..\docs\final-quality-scan.json') -Raw -Encoding UTF8 | ConvertFrom-Json
Write-Output '=== FAILING BY PLANE ==='
$j.failing_nodes | Group-Object plane | Sort-Object Name | ForEach-Object { Write-Output ("{0}: {1}" -f $_.Name, $_.Count) }
Write-Output ''
Write-Output '=== PURPOSE-ONLY FAILURES ==='
($j.failing_nodes | Where-Object { $_.issues.Count -eq 1 -and $_.issues[0] -eq 'legacy top-level key: purpose' }).Count
Write-Output ''
Write-Output '=== ISSUE TYPE TOTALS ==='
$groups = @{}
foreach ($node in $j.failing_nodes) {
    foreach ($issue in $node.issues) {
        $key = if ($issue -like 'legacy top-level key*') { 'legacy: purpose' }
        elseif ($issue -like 'embedded source_claims*') { 'embedded source_claims invalid ref' }
        elseif ($issue -like 'semantics*') { 'semantics structure' }
        elseif ($issue -like 'engineering*') { 'engineering structure' }
        elseif ($issue -like 'examples*') { 'examples missing kinds' }
        elseif ($issue -like 'sources*') { 'sources invalid' }
        elseif ($issue -like 'source_claims*') { 'source_claims invalid' }
        else { $issue }
        if (-not $groups.ContainsKey($key)) { $groups[$key] = 0 }
        $groups[$key]++
    }
}
$groups.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { Write-Output ("{0}: {1}" -f $_.Key, $_.Value) }
