# Extract YAML blocks from rewrite-orchestration-routing-control.ps1 (UTF-8) and apply to nodes.
$ErrorActionPreference = 'Stop'
$Repo = (Join-Path $PSScriptRoot '..') | Resolve-Path
$SourcePs1 = Join-Path $PSScriptRoot 'rewrite-orchestration-routing-control.ps1'
$SnippetDir = Join-Path $PSScriptRoot 'plane-example-rewrites\orchestration-routing-control'
$NodeRoot = Join-Path $Repo 'ontology\orchestration-plane\orchestration-routing-control'
New-Item -ItemType Directory -Force -Path $SnippetDir | Out-Null

$text = [System.IO.File]::ReadAllText($SourcePs1, [System.Text.Encoding]::UTF8)
$pattern = "\`$blocks\['([^']+)'\]\s*=\s*@'\r?\n([\s\S]*?)\r?\n'@"
$matches = [regex]::Matches($text, $pattern)
$nameMap = @{
    'node.yaml' = '_root.yaml'
}

foreach ($m in $matches) {
    $rel = $m.Groups[1].Value
    $yaml = $m.Groups[2].Value.TrimEnd()
    if ($rel -eq 'node.yaml') {
        $outName = '_root.yaml'
    } else {
        $base = $rel -replace '/node\.yaml$', '' -replace '\\node\.yaml$', ''
        $outName = ($base -replace '[/\\]', '__') + '.yaml'
    }
    $outPath = Join-Path $SnippetDir $outName
    [System.IO.File]::WriteAllText($outPath, $yaml, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "Wrote snippet $outName"
}

& (Join-Path $PSScriptRoot 'apply-example-snippets.ps1') -SnippetDir $SnippetDir -NodeRoot $NodeRoot
