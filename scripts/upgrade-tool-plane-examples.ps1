# Upgrade tool-plane ontology examples with diversified paper/project reference sources.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$ToolPlane = Join-Path $Root 'ontology\tool-plane'
$DataPath = Join-Path $Root 'scripts\tool-plane-example-upgrades.json'
$data = Get-Content -Raw -Path $DataPath -Encoding UTF8 | ConvertFrom-Json

$SourcePatterns = [ordered]@{
    Toolformer = 'Toolformer|\[Calculator\(|\[Search\(|\[QA\('
    Gorilla = 'Gorilla|APIBench|retriever-aware|HuggingFace Hub|TorchHub|TensorHub'
    ReAct = 'ReAct|Action:|Observation|Search\[|Lookup\[|Finish\['
    ToolBench = 'ToolBench|DFSDT|16000\+|RapidAPI|ToolLLM'
    ART = 'ART \(|Paranjape|task-demo|task demo'
    Anthropic = 'Anthropic|tool_use|tool_result|tool_use_id'
    LangChain = 'LangChain|@tool|BaseTool|StructuredTool|args_schema'
    'Vercel AI SDK' = 'Vercel AI SDK|generateText|streamText|execute:async'
    Instructor = 'Instructor|response_model|Pydantic'
    'Semantic Kernel' = 'Semantic Kernel|kernel\.add_plugin|@kernel_function|kernel_function'
    'Claude Computer Use' = 'Computer Use|computer_20241022|action:"click"|display_width_px'
    'OpenAI Code Interpreter' = 'Code Interpreter|code_interpreter|Assistants API'
    MCP = 'MCP |JSON-RPC|tools/call|tools/list|modelcontextprotocol'
    OpenAI = 'OpenAI(?! Code)|function_call|Assistants(?! API)'
}

function Get-ModuleKey([string]$RelativePath) {
    if ($RelativePath -match 'tool-mcp-transport') { return 'tool-mcp-transport' }
    if ($RelativePath -match 'tool-invocation-execution') { return 'tool-invocation-execution' }
    if ($RelativePath -match 'tool-registry-definition') { return 'tool-registry-definition' }
    if ($RelativePath -match 'tool-discovery-selection') { return 'tool-discovery-selection' }
    return 'tool-plane'
}

function Get-ExampleKind([string]$ExampleId) {
    if ($ExampleId -match '-counterexample-') { return 'counterexample' }
    if ($ExampleId -match '-boundary-') { return 'boundary' }
    if ($ExampleId -match '-instance-') { return 'instance' }
    if ($ExampleId -match '-positive-') { return 'positive' }
    if ($ExampleId -match 'counterexample') { return 'counterexample' }
    if ($ExampleId -match 'boundary') { return 'boundary' }
    if ($ExampleId -match 'instance') { return 'instance' }
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

function Get-PatternSources([string]$NodeId) {
    foreach ($entry in $data.nodePatterns) {
        if ($NodeId -match $entry.pattern) {
            return @($entry.sources)
        }
    }
    return @()
}

function Get-Descriptions([string]$NodeId, [string]$ExampleId, [string]$Kind, [string]$ModuleKey) {
    if ($data.nodes.PSObject.Properties.Name -contains $NodeId) {
        $node = $data.nodes.$NodeId
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

function Count-Sources([string]$Text) {
    $found = @()
    foreach ($kv in $SourcePatterns.GetEnumerator()) {
        if ($Text -match $kv.Value) {
            $found += $kv.Key
        }
    }
    return $found
}

function Scan-ExampleSources([string]$Text, [ref]$SourceCounts, [ref]$ExampleCount) {
    if ($Text -match '(?ms)^examples:\r?\n(.*?)(?=^parent_relation:|^relations:|^sources:|\z)') {
        $block = $Matches[1]
        $ExampleCount.Value += ([regex]::Matches($block, '(?m)^  - id: ')).Count
        foreach ($m in [regex]::Matches($block, '(?m)^      (?:zh|en): (.+)$')) {
            foreach ($src in (Count-Sources -Text $m.Groups[1].Value)) {
                if (-not $SourceCounts.Value.ContainsKey($src)) { $SourceCounts.Value[$src] = 0 }
                $SourceCounts.Value[$src]++
            }
        }
    }
}

function Update-File([string]$Path, [string]$NodeId, [string]$ModuleKey, [ref]$ExampleCount, [ref]$SourceCounts) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($Path))
    $changed = $false
    $currentExampleId = $null
    $inDescriptions = $false
    $descLine = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($line -match '^  - id: (.+)$') {
            $currentExampleId = $Matches[1].Trim()
            $inDescriptions = $false
            $descLine = 0
            continue
        }
        if ($line -eq '    descriptions:') {
            $inDescriptions = $true
            $descLine = 0
            continue
        }
        if ($line -match '^    descriptions: \{zh: ') {
            $kind = Get-ExampleKind -ExampleId $currentExampleId
            $desc = Get-Descriptions -NodeId $NodeId -ExampleId $currentExampleId -Kind $kind -ModuleKey $ModuleKey
            if ($desc) {
                $newLine = "    descriptions: {zh: $($desc.zh), en: $($desc.en), ja: $($desc.ja)}"
                if ($lines[$i] -ne $newLine) {
                    $lines[$i] = $newLine
                    $changed = $true
                    $ExampleCount.Value++
                    foreach ($src in (Count-Sources -Text "$($desc.zh) $($desc.en)")) {
                        if (-not $SourceCounts.Value.ContainsKey($src)) { $SourceCounts.Value[$src] = 0 }
                        $SourceCounts.Value[$src]++
                    }
                }
            }
            continue
        }
        if ($inDescriptions -and $line -match '^      (zh|en|ja): ') {
            $lang = $Matches[1]
            $kind = Get-ExampleKind -ExampleId $currentExampleId
            $desc = Get-Descriptions -NodeId $NodeId -ExampleId $currentExampleId -Kind $kind -ModuleKey $ModuleKey
            if ($desc) {
                $newLine = "      ${lang}: $($desc.$lang)"
                if ($lines[$i] -ne $newLine) {
                    $lines[$i] = $newLine
                    $changed = $true
                    if ($lang -eq 'zh') {
                        $ExampleCount.Value++
                        foreach ($src in (Count-Sources -Text "$($desc.zh) $($desc.en)")) {
                            if (-not $SourceCounts.Value.ContainsKey($src)) { $SourceCounts.Value[$src] = 0 }
                            $SourceCounts.Value[$src]++
                        }
                    }
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
        [IO.File]::WriteAllLines($Path, $lines)
    }
    return $changed
}

$files = Get-ChildItem -Path $ToolPlane -Filter 'node.yaml' -Recurse
$updated = 0
$totalExamples = 0
$sourceCounts = @{}
$nodes = @()

foreach ($file in ($files | Sort-Object FullName)) {
    $rel = $file.FullName.Substring($Root.Length + 1) -replace '\\', '/'
    $text = [IO.File]::ReadAllText($file.FullName)
    if ($text -notmatch '(?m)^id: (.+)$') { continue }
    $nodeId = $Matches[1].Trim()
    $moduleKey = Get-ModuleKey -RelativePath $rel
    $exampleCountRef = [ref]0
    $sourceCountsRef = [ref]$sourceCounts

    if (Update-File -Path $file.FullName -NodeId $nodeId -ModuleKey $moduleKey -ExampleCount $exampleCountRef -SourceCounts $sourceCountsRef) {
        $updated++
        $text = [IO.File]::ReadAllText($file.FullName)
    }

    $nodeExampleCount = [ref]0
    Scan-ExampleSources -Text $text -SourceCounts ([ref]$sourceCounts) -ExampleCount $nodeExampleCount
    $exampleTotal = $nodeExampleCount.Value
    $totalExamples += $exampleTotal

    $patternSources = Get-PatternSources -NodeId $nodeId
    $assignedSources = if ($patternSources.Count -gt 0) { $patternSources -join ', ' } else { $data.sourceHints.$moduleKey }

    $nodes += [pscustomobject]@{
        Node = $nodeId
        Path = $rel
        Examples = $exampleTotal
        AssignedSources = $assignedSources
    }
}

$sourceStats = @()
foreach ($kv in ($sourceCounts.GetEnumerator() | Sort-Object Value -Descending)) {
    $sourceStats += [pscustomobject]@{
        Source = $kv.Key
        ExampleMentions = $kv.Value
    }
}

$summary = [pscustomobject]@{
    processed_nodes = $files.Count
    updated_nodes = $updated
    total_nodes = $files.Count
    total_examples = $totalExamples
    source_statistics = $sourceStats
    sourceHints = $data.sourceHints
    nodes = $nodes
}

Write-Host "Updated $updated / $($files.Count) node.yaml files ($totalExamples total examples)."
Write-Host "Source mention counts:"
$sourceStats | ForEach-Object { Write-Host "  $($_.Source): $($_.ExampleMentions)" }

$summary | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $Root 'docs\tool-plane-example-upgrade-summary.json') -Encoding UTF8
