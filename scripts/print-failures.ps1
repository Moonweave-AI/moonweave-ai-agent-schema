$j = Get-Content (Join-Path $PSScriptRoot '..\docs\final-quality-scan.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($plane in ($j.failing_nodes | Group-Object plane | Sort-Object Name)) {
    Write-Output ("PLANE $($plane.Name) ($($plane.Count))")
    foreach ($n in ($plane.Group | Sort-Object path)) {
        Write-Output ("$($n.path) | $($n.issues -join '; ')")
    }
    Write-Output ''
}
