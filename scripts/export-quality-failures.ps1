$j = Get-Content (Join-Path $PSScriptRoot '..\docs\final-quality-scan.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$out = Join-Path $PSScriptRoot '..\docs\final-quality-scan-failures.md'
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# Final Quality Scan - Failing Nodes')
[void]$sb.AppendLine('')
foreach ($plane in ($j.failing_nodes | Group-Object plane | Sort-Object Name)) {
    [void]$sb.AppendLine("## $($plane.Name) ($($plane.Count))")
    [void]$sb.AppendLine('')
    foreach ($node in ($plane.Group | Sort-Object path)) {
        [void]$sb.AppendLine("- ``$($node.path)``")
        foreach ($issue in $node.issues) {
            [void]$sb.AppendLine("  - $issue")
        }
        [void]$sb.AppendLine('')
    }
}
$sb.ToString() | Set-Content -Path $out -Encoding UTF8
Write-Output "Wrote $out"
