# Upgrade plane example descriptions with diversified authoritative sources.
param(
    [ValidateSet('feedback', 'runtime', 'info', 'all')]
    [string]$Plane = 'all'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

. (Join-Path $Root 'scripts\plane-diverse-sources-data.ps1')

function Escape-YamlDoubleQuoted([string]$Text) {
    if ($null -eq $Text) { return '""' }
    return '"' + ($Text -replace '\\', '\\\\' -replace '"', '\"') + '"'
}

function Infer-ExampleKind([string]$ExampleId) {
    $id = $ExampleId.ToLowerInvariant()
    if ($id -match 'counterexample|confusable|negative') { return 'counterexample' }
    if ($id -match 'boundary') { return 'boundary' }
    if ($id -match 'instance|concrete') { return 'instance' }
    return 'positive'
}

function Get-SourcesForNode([string]$NodeId, [string]$ModuleKey, [hashtable]$Catalog) {
    if ($Catalog.NodeSourceMap.ContainsKey($NodeId)) {
        return @($Catalog.NodeSourceMap[$NodeId] | Select-Object -First 4)
    }
    if ($Catalog.ModuleSourceMap.ContainsKey($ModuleKey)) {
        return @($Catalog.ModuleSourceMap[$ModuleKey] | Select-Object -First 4)
    }
    return @($Catalog.DefaultSources | Select-Object -First 4)
}

function Assign-Sources([array]$Examples, [array]$NodeSources) {
    $assigned = @()
    for ($i = 0; $i -lt $Examples.Count; $i++) {
        $ex = $Examples[$i]
        $kind = Infer-ExampleKind $ex.Id
        $source = $NodeSources[$i % $NodeSources.Count]
        if ($Examples.Count -ge 3) {
            $preferred = @{
                positive = $NodeSources[0]
                boundary = $(if ($NodeSources.Count -gt 1) { $NodeSources[1] } else { $NodeSources[0] })
                counterexample = $(if ($NodeSources.Count -gt 2) { $NodeSources[2] } else { $NodeSources[0] })
                instance = $(if ($NodeSources.Count -gt 3) { $NodeSources[3] } else { $NodeSources[[Math]::Min(3, $NodeSources.Count - 1)] })
            }
            if ($i -lt 4) { $source = $preferred[$kind] }
        }
        $assigned += [pscustomobject]@{ Example = $ex; Source = $source; Kind = $kind }
    }
    return $assigned
}

function Parse-Examples([string[]]$Lines) {
    $examples = @()
    $inExamples = $false
    $current = $null
    $inDescriptions = $false

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $line = $Lines[$i]
        if ($line -eq 'examples:') { $inExamples = $true; continue }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims|relations):') {
            if ($current) { $examples += $current; $current = $null }
            break
        }
        if (-not $inExamples) { continue }

        if ($line -match '^  - id: (.+)$') {
            if ($current) { $examples += $current }
            $current = [pscustomobject]@{
                Id = $Matches[1].Trim()
                DescFormat = $null
                DescStartLine = $null
                DescEndLine = $null
                Descriptions = @{ zh = ''; en = ''; ja = '' }
            }
            $inDescriptions = $false
            continue
        }
        if (-not $current) { continue }

        if ($line -match '^    descriptions: \{zh:') {
            $current.DescFormat = 'inline'
            $current.DescStartLine = $i
            $current.DescEndLine = $i
            if ($line -match '^    descriptions: \{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$') {
                $current.Descriptions.zh = $Matches[1].Trim('"').Replace('\"', '"')
                $current.Descriptions.en = $Matches[2].Trim('"').Replace('\"', '"')
                $current.Descriptions.ja = $Matches[3].Trim('"').Replace('\"', '"')
            }
            continue
        }
        if ($line -eq '    descriptions:') {
            $current.DescFormat = 'block'
            $current.DescStartLine = $i
            $inDescriptions = $true
            continue
        }
        if ($inDescriptions -and $current.DescFormat -eq 'block') {
            if ($line -match '^      (zh|en|ja): (.+)$') {
                $current.Descriptions[$Matches[1]] = $Matches[2].Trim('"').Replace('\"', '"')
                $current.DescEndLine = $i
            }
            elseif ($line -notmatch '^      ') { $inDescriptions = $false }
        }
    }
    if ($current) { $examples += $current }
    return $examples
}

function Update-FileExamples([string]$FilePath, [string]$NodeId, [string]$ModuleKey, [hashtable]$Catalog) {
    $content = [IO.File]::ReadAllText($FilePath, [Text.Encoding]::UTF8)
    if ($content -notmatch '(?m)^examples:\s*$') { return @{ Changed = $false; Sources = @(); Assigned = @() } }

    $lines = $content -split '\r?\n'
    $examples = Parse-Examples $lines
    if ($examples.Count -eq 0) { return @{ Changed = $false; Sources = @(); Assigned = @() } }

    $nodeSources = Get-SourcesForNode -NodeId $NodeId -ModuleKey $ModuleKey -Catalog $Catalog
    $assigned = Assign-Sources -Examples $examples -NodeSources $nodeSources
    $newLines = [System.Collections.Generic.List[string]]::new()
    $newLines.AddRange([string[]]$lines)
    $changed = $false
    $fileSources = [System.Collections.Generic.HashSet[string]]::new()

    foreach ($item in $assigned) {
        $desc = Get-PlaneDescription -SourceId $item.Source -NodeId $NodeId -Kind $item.Kind -Catalog $Catalog
        [void]$fileSources.Add($item.Source)
        $ex = $item.Example

        if ($ex.DescFormat -eq 'inline') {
            $newLine = "    descriptions: {zh: $(Escape-YamlDoubleQuoted $desc.zh), en: $(Escape-YamlDoubleQuoted $desc.en), ja: $(Escape-YamlDoubleQuoted $desc.ja)}"
            if ($newLines[$ex.DescStartLine] -ne $newLine) {
                $newLines[$ex.DescStartLine] = $newLine
                $changed = $true
            }
        }
        elseif ($ex.DescFormat -eq 'block') {
            $descEnd = if ($null -ne $ex.DescEndLine) { $ex.DescEndLine } else { $ex.DescStartLine + 3 }
            for ($i = $ex.DescStartLine + 1; $i -le $descEnd; $i++) {
                if ($newLines[$i] -match '^      (zh|en|ja): ') {
                    $lang = $Matches[1]
                    $newLine = "      ${lang}: $(Escape-YamlDoubleQuoted $desc[$lang])"
                    if ($newLines[$i] -ne $newLine) {
                        $newLines[$i] = $newLine
                        $changed = $true
                    }
                }
            }
        }
    }

    if ($changed) {
        $text = ($newLines -join "`n")
        if ($content.EndsWith("`n")) { $text += "`n" }
        [IO.File]::WriteAllText($FilePath, $text, (New-Object System.Text.UTF8Encoding $false))
    }

    return @{ Changed = $changed; Sources = @($fileSources); Assigned = $assigned }
}

function Get-ModuleKey([string]$RelativePath, [hashtable]$Catalog) {
    $norm = $RelativePath -replace '\\', '/'
    foreach ($key in $Catalog.ModuleSourceMap.Keys) {
        if ($norm -like "*$key*") { return $key }
    }
    return $Catalog.DefaultModuleKey
}

function Invoke-PlaneUpgrade([hashtable]$Cfg) {
    $files = Get-ChildItem -Path $Cfg.Root -Recurse -Filter node.yaml | Sort-Object FullName
    $sourceCounts = @{}
    foreach ($sid in $Cfg.Catalog.SourceIds) { $sourceCounts[$sid] = 0 }

    $updated = 0
    $examplesUpdated = 0
    $nodesProcessed = @()

    foreach ($file in $files) {
        $text = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8)
        if ($text -notmatch '(?m)^id:\s*(.+)$') { continue }
        $nodeId = $Matches[1].Trim()
        $rel = $file.FullName.Substring($Root.Length + 1) -replace '\\', '/'
        $moduleKey = Get-ModuleKey -RelativePath $rel -Catalog $Cfg.Catalog
        $result = Update-FileExamples -FilePath $file.FullName -NodeId $nodeId -ModuleKey $moduleKey -Catalog $Cfg.Catalog
        if ($result.Changed) {
            $updated++
            $examplesUpdated += $result.Assigned.Count
        }
        foreach ($s in $result.Sources) { $sourceCounts[$s]++ }
        $nodesProcessed += [ordered]@{
            nodeId = $nodeId
            path = $rel
            module = $moduleKey
            sources = @($result.Sources | Sort-Object)
            updated = $result.Changed
        }
    }

    $summary = [ordered]@{
        processedAt = (Get-Date).ToString('o')
        plane = $Cfg.Label
        nodesTotal = $files.Count
        nodesUpdated = $updated
        examplesUpdated = $examplesUpdated
        sourceCitationCounts = $sourceCounts
        nodes = $nodesProcessed
    }

    $summary | ConvertTo-Json -Depth 6 | Set-Content -Path $Cfg.SummaryPath -Encoding UTF8
    return $summary
}

$planes = if ($Plane -eq 'all') { @('feedback', 'runtime', 'info') } else { @($Plane) }
$allResults = @{}

foreach ($p in $planes) {
    $cfg = switch ($p) {
        'feedback' {
            @{
                Root = Join-Path $Root 'ontology\feedback-plane'
                SummaryPath = Join-Path $Root 'docs\feedback-plane-example-upgrade-summary.json'
                Catalog = $FeedbackCatalog
                Label = 'feedback-plane'
            }
        }
        'runtime' {
            @{
                Root = Join-Path $Root 'ontology\runtime-plane'
                SummaryPath = Join-Path $Root 'docs\runtime-plane-example-upgrade-summary.json'
                Catalog = $RuntimeCatalog
                Label = 'runtime-plane'
            }
        }
        'info' {
            @{
                Root = Join-Path $Root 'ontology\info-plane'
                SummaryPath = Join-Path $Root 'docs\info-plane-diverse-example-upgrade-summary.json'
                Catalog = $InfoCatalog
                Label = 'info-plane'
            }
        }
    }
    $summary = Invoke-PlaneUpgrade -Cfg $cfg
    $allResults[$p] = $summary
    Write-Host "`n=== $($cfg.Label) ==="
    Write-Host "Processed $($summary.nodesTotal) nodes"
    Write-Host "Updated $($summary.nodesUpdated) files ($($summary.examplesUpdated) example descriptions)"
    Write-Host 'Source citation counts:'
    $summary.sourceCitationCounts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
        if ($_.Value -gt 0) { Write-Host "  $($_.Key): $($_.Value)" }
    }
    Write-Host "Summary: $($cfg.SummaryPath)"
}

if ($planes.Count -gt 1) {
    Write-Host "`n=== Combined ==="
    $totalNodes = 0; $totalUpdated = 0; $totalExamples = 0
    foreach ($r in $allResults.Values) {
        $totalNodes += $r.nodesTotal
        $totalUpdated += $r.nodesUpdated
        $totalExamples += $r.examplesUpdated
    }
    Write-Host "Total: $totalNodes nodes, $totalUpdated updated, $totalExamples examples"
}
