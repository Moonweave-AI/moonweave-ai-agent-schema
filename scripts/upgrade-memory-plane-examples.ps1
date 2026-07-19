# Upgrade memory-plane ontology example descriptions with diversified citation sources.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$MemoryPlane = Join-Path $Root 'ontology\memory-plane'
$DataPath = Join-Path $Root 'scripts\memory-plane-example-upgrades.json'
$data = Get-Content -Raw -Path $DataPath -Encoding UTF8 | ConvertFrom-Json

$SourceTags = @(
    'Generative Agents', 'MemGPT', 'RAG', 'RAPTOR', 'Lost in the Middle', 'HyDE', 'ColBERT',
    'Contextual Retrieval', 'Self-RAG', 'Pinecone', 'Weaviate', 'Qdrant', 'ChromaDB', 'pgvector',
    'LlamaIndex', 'Redis', 'Cursor IDE Context', 'Claude/Anthropic Context', 'Mem0', 'LangGraph'
)

function Get-ModuleKey([string]$RelativePath) {
    if ($RelativePath -match 'memory-stores-scopes') { return 'memory-stores-scopes' }
    if ($RelativePath -match 'memory-context') { return 'memory-context' }
    if ($RelativePath -match 'memory-chunking-situating') { return 'memory-chunking-situating' }
    if ($RelativePath -match 'memory-embedding-indexes') { return 'memory-embedding-indexes' }
    if ($RelativePath -match 'memory-retrieval-ranking') { return 'memory-retrieval-ranking' }
    if ($RelativePath -match 'memory-ingestion') { return 'memory-ingestion' }
    if ($RelativePath -match 'memory-lifecycle') { return 'memory-lifecycle' }
    return 'memory-plane'
}

function Infer-Kind([string]$ExampleId, [string]$ExplicitKind) {
    if ($ExplicitKind) { return $ExplicitKind }
    $eid = $ExampleId.ToLowerInvariant()
    if ($eid -match 'counterexample|(?<![a-z])counter(?![a-z])') { return 'counterexample' }
    if ($eid -match 'boundary') { return 'boundary' }
    if ($eid -match 'instance') { return 'instance' }
    return 'positive'
}

function Get-PatternDescriptions([string]$NodeId, [string]$Kind) {
    foreach ($entry in $data.nodePatterns) {
        if ($NodeId -match $entry.pattern) {
            if ($entry.descriptions.PSObject.Properties.Name -contains $Kind) {
                return $entry.descriptions.$Kind
            }
        }
    }
    return $null
}

function Get-Descriptions([string]$NodeId, [string]$ExampleId, [string]$Kind, [string]$ModuleKey) {
    if ($data.nodes.PSObject.Properties.Name -contains $NodeId) {
        $node = $data.nodes.$NodeId
        if ($node.PSObject.Properties.Name -contains $Kind) { return $node.$Kind }
        if ($node.PSObject.Properties.Name -contains $ExampleId) { return $node.$ExampleId }
    }
    $patternDesc = Get-PatternDescriptions -NodeId $NodeId -Kind $Kind
    if ($patternDesc) { return $patternDesc }
    if ($data.moduleFallbacks.PSObject.Properties.Name -contains $ModuleKey) {
        $mod = $data.moduleFallbacks.$ModuleKey
        if ($mod.PSObject.Properties.Name -contains $Kind) { return $mod.$Kind }
    }
    return $data.planeFallback.$Kind
}

function Add-SourceCounts([hashtable]$Counts, [string]$Text) {
    $lower = $Text.ToLowerInvariant()
    foreach ($tag in $SourceTags) {
        if ($lower.Contains($tag.ToLowerInvariant())) {
            if (-not $Counts.ContainsKey($tag)) { $Counts[$tag] = 0 }
            $Counts[$tag]++
        }
    }
}

function Update-File([string]$Path, [string]$NodeId, [string]$ModuleKey, [hashtable]$SourceCounts, [ref]$ExampleUpdates) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($Path, [Text.Encoding]::UTF8))
    $changed = $false
    $currentExampleId = $null
    $currentKind = $null
    $inDescriptions = $false
    $descLine = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($line -match '^  - id: (.+)$') {
            $currentExampleId = $Matches[1].Trim()
            $currentKind = $null
            $inDescriptions = $false
            $descLine = 0
            continue
        }
        if ($line -match '^    kind: (positive|counterexample|boundary|instance)$') {
            $currentKind = $Matches[1]
            continue
        }
        if ($line -eq '    descriptions:') {
            $inDescriptions = $true
            $descLine = 0
            continue
        }

        $kind = Infer-Kind -ExampleId $currentExampleId -ExplicitKind $currentKind
        $desc = Get-Descriptions -NodeId $NodeId -ExampleId $currentExampleId -Kind $kind -ModuleKey $ModuleKey
        if (-not $desc) { continue }

        if ($line -match '^    descriptions: \{zh: ') {
            $newLine = "    descriptions: {zh: $($desc.zh), en: $($desc.en), ja: $($desc.ja)}"
            if ($lines[$i] -ne $newLine) {
                $lines[$i] = $newLine
                $changed = $true
                $ExampleUpdates.Value++
                Add-SourceCounts -Counts $SourceCounts -Text ($desc.zh + ' ' + $desc.en)
            }
            continue
        }
        if ($inDescriptions -and $line -match '^      (zh|en|ja): ') {
            $lang = $Matches[1]
            $newLine = "      ${lang}: $($desc.$lang)"
            if ($lines[$i] -ne $newLine) {
                $lines[$i] = $newLine
                $changed = $true
                if ($lang -eq 'ja') {
                    $ExampleUpdates.Value++
                    Add-SourceCounts -Counts $SourceCounts -Text ($desc.zh + ' ' + $desc.en)
                }
            }
            $descLine++
            if ($descLine -ge 3) { $inDescriptions = $false }
            continue
        }
        if ($inDescriptions -and $line -notmatch '^      ') {
            $inDescriptions = $false
        }
    }

    if ($changed) {
        [IO.File]::WriteAllLines($Path, $lines, [Text.UTF8Encoding]::new($false))
    }
    return $changed
}

$files = Get-ChildItem -Path $MemoryPlane -Filter 'node.yaml' -Recurse
$updatedFiles = 0
$updatedExamples = 0
$summary = @{}
$sourceCounts = @{}

foreach ($file in ($files | Sort-Object FullName)) {
    $rel = $file.FullName.Substring($Root.Length + 1) -replace '\\', '/'
    $text = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8)
    if ($text -notmatch '(?m)^id: (.+)$') { continue }
    $nodeId = $Matches[1].Trim()
    if ($text -notmatch '(?m)^examples:') { continue }
    $moduleKey = Get-ModuleKey -RelativePath $rel
    $exampleRef = [ref]0
    if (Update-File -Path $file.FullName -NodeId $nodeId -ModuleKey $moduleKey -SourceCounts $sourceCounts -ExampleUpdates $exampleRef) {
        $updatedFiles++
        $updatedExamples += $exampleRef.Value
        if (-not $summary.ContainsKey($moduleKey)) {
            $summary[$moduleKey] = @{ updated = 0; nodes = @() }
        }
        $summary[$moduleKey].updated++
        $summary[$moduleKey].nodes += $nodeId
    }
}

Write-Host "Updated $updatedFiles node.yaml files ($updatedExamples example descriptions)."
$sortedSources = $sourceCounts.GetEnumerator() | Sort-Object { -$_.Value }, Name
$report = @{
    updatedFileCount = $updatedFiles
    updatedExampleCount = $updatedExamples
    totalNodeFiles = $files.Count
    modules = $summary
    sourceCitationStats = [ordered]@{}
    sourceHints = $data.sourceHints
}
foreach ($entry in $sortedSources) {
    $report.sourceCitationStats[$entry.Key] = $entry.Value
}
$report | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $Root 'docs\memory-plane-example-upgrade-summary.json') -Encoding UTF8
