# Safe in-place patcher: strip taxonomy fields and enrich descriptions from UTF-8 JSON + field_values.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$Utf8 = New-Object System.Text.UTF8Encoding $false
$InfoPlane = Join-Path $Root 'ontology\info-plane'
$JsonPath = Join-Path $Root 'scripts\info-plane-example-upgrades.json'
$SummaryPath = Join-Path $Root 'docs\info-plane-example-upgrade-summary.json'

$Data = [System.IO.File]::ReadAllText($JsonPath, $Utf8) | ConvertFrom-Json
$ApiPattern = '/v1/|POST |GET |SSE|data:|prompts/|content_block|input_text|image_url|stream=True|Elasticsearch|Pinecone|Docker|LangChain|ChatPromptTemplate|char_location|ETag|Content-Digest|prov:|input_audio|input_image|input_file|tool_calls|thread_id|BM25|cosine|stdout|stderr|exit_code|JSON-RPC|SendMessage|previous_response_id|role=|mimeType|file_id|base64|Responses API|Anthropic|Chat Completions|Whisper|PROV-O|LangGraph|resource_link|CallToolResult|prompts/list|prompts/get|json_schema|one-of|invalid_request_error|content_block_delta|delta\.content|checkpointer|checkpoint'

function Get-ModuleKey([string]$Rel) {
    if ($Rel -match 'info-messages-instructions') { return 'messages' }
    if ($Rel -match 'info-prompts-instructions') { return 'prompts' }
    if ($Rel -match 'info-content-parts') { return 'content-parts' }
    if ($Rel -match 'info-content-block-modality') { return 'content-blocks' }
    if ($Rel -match 'info-storage-sources') { return 'storage-sources' }
    if ($Rel -match 'info-output-disclosure') { return 'output-disclosure' }
    if ($Rel -match 'info-container-command') { return 'container-command' }
    if ($Rel -match 'info-indexing') { return 'indexing' }
    return 'info-plane'
}

function Escape-Yaml([string]$T) {
    if ($null -eq $T) { return '""' }
    return '"' + ($T -replace '\\', '\\\\' -replace '"', '\"') + '"'
}

function Normalize-ExampleId([string]$Id) {
    $n = $Id
    foreach ($token in @('-positive-', '-counterexample-', '-counter-', '-boundary-', '-instance-')) {
        $n = $n.Replace($token, '-')
    }
    foreach ($suffix in @('-positive', '-counterexample', '-counter', '-boundary', '-instance')) {
        if ($n.EndsWith($suffix)) { $n = $n.Substring(0, $n.Length - $suffix.Length) }
    }
    return ($n -replace '--+', '-').Trim('-')
}

function Expand-Desc($Desc, [string]$NodeId, [string]$ExampleId) {
    if (-not $Desc) { return $null }
    return @{
        zh = ([string]$Desc.zh) -replace '\{nodeId\}', $NodeId -replace '\{exampleId\}', $ExampleId
        en = ([string]$Desc.en) -replace '\{nodeId\}', $NodeId -replace '\{exampleId\}', $ExampleId
        ja = ([string]$Desc.ja) -replace '\{nodeId\}', $NodeId -replace '\{exampleId\}', $ExampleId
    }
}

function Get-Desc([string]$NodeId, [string]$ExampleId, [string]$ModuleKey) {
    $candidates = [System.Collections.Generic.List[string]]::new()
    if ($ExampleId -match '-boundary-|-counter-|-counterexample-') {
        $base = Normalize-ExampleId $ExampleId
        [void]$candidates.Add($base + '-2')
        [void]$candidates.Add($ExampleId)
        [void]$candidates.Add($base)
    } else {
        [void]$candidates.Add($ExampleId)
        [void]$candidates.Add((Normalize-ExampleId $ExampleId))
    }
    if ($Data.nodes.PSObject.Properties.Name -contains $NodeId) {
        $n = $Data.nodes.$NodeId
        foreach ($c in $candidates) {
            if ($n.PSObject.Properties.Name -contains $c) { return Expand-Desc $n.$c $NodeId $ExampleId }
        }
    }
    if ($Data.modules.PSObject.Properties.Name -contains $ModuleKey) {
        $m = $Data.modules.$ModuleKey
        if ($m.PSObject.Properties.Name -contains $NodeId) { return Expand-Desc $m.$NodeId $NodeId $ExampleId }
        if ($m.PSObject.Properties.Name -contains '_default') { return Expand-Desc $m._default $NodeId $ExampleId }
    }
    if ($Data.modules.PSObject.Properties.Name -contains 'info-plane') {
        return Expand-Desc $Data.modules.'info-plane'._default $NodeId $ExampleId
    }
    return $null
}

function Get-ModuleApiHint([string]$ModuleKey) {
    switch ($ModuleKey) {
        'messages' { return 'OpenAI POST /v1/chat/completions messages[], Anthropic POST /v1/messages, A2A SendMessage' }
        'prompts' { return 'LangChain ChatPromptTemplate.from_messages, MCP prompts/get, OpenAI Responses instructions' }
        'content-parts' { return 'OpenAI content[]/Responses input_*, Anthropic blocks, A2A Part one-of' }
        'content-blocks' { return 'Anthropic POST /v1/messages content blocks type=text|image|tool_use|tool_result' }
        'storage-sources' { return 'Anthropic citations char_location, RFC 9530 Content-Digest, PROV-O prov:wasAttributedTo' }
        'output-disclosure' { return 'OpenAI SSE stream delta.content, Anthropic content_block_delta' }
        'container-command' { return 'Docker POST /containers/{id}/exec, stdout/stderr, exit_code' }
        'indexing' { return 'Elasticsearch POST /index/_search, Pinecone query topK, BM25 _score' }
        default { return 'OpenAI Responses API, A2A Message/Part, MCP Resource/Prompt' }
    }
}

function Format-FieldValuesSnippet($Fv) {
    if ($Fv -isnot [hashtable] -or $Fv.Count -eq 0) { return '' }
    $pairs = @()
    foreach ($k in ($Fv.Keys | Sort-Object)) {
        if ($Fv[$k]) { $pairs += "$k=$($Fv[$k])" }
    }
    if ($pairs.Count -gt 6) { return ($pairs[0..5] -join '; ') + '...' }
    return ($pairs -join '; ')
}

function Is-GenericDefault([string]$Zh, [string]$ModuleKey) {
    if ($Zh -match '/\{exampleId\}|Positive case:|Boundary case:') { return $true }
    if ($Zh -match 'mapped via|field_values=\{' ) { return $false }
    switch ($ModuleKey) {
        'messages' { return $Zh -match 'conversation element' }
        'prompts' { return $Zh -match 'PromptMessage' -and $Zh -match 'ChatPromptTemplate' }
        'content-parts' { return $Zh -match 'one-of' -and $Zh -match 'ContentPart' }
        'content-blocks' { return $Zh -match 'content blocks' -and $Zh -match 'image_url' }
        'storage-sources' { return $Zh -match 'SourceIdentity' -and $Zh -match 'ETag' }
        'output-disclosure' { return $Zh -match 'DisclosureActivity' -and $Zh -match 'redaction' }
        'container-command' { return $Zh -match 'ExitStatusObservation' -and $Zh -match 'exit_code' }
        'indexing' { return $Zh -match 'LightweightRetrievalTrace' -and $Zh -match 'latency_ms' }
        default { return $Zh -match 'info-plane instance' -or $Zh -match 'auditable protocol field_values' }
    }
}

function Needs-Rewrite([string]$Zh, [string]$ModuleKey) {
    if ([string]::IsNullOrWhiteSpace($Zh)) { return $true }
    if ($Zh -match 'Positive case:|Boundary case:|typical API') { return $true }
    if (Is-GenericDefault $Zh $ModuleKey) { return $true }
    if ($Zh -notmatch $ApiPattern) { return $true }
    return $false
}

function Enhance-Desc($Desc, [string]$NodeId, [string]$ExampleId, [string]$ModuleKey, $Fv) {
    if (-not $Desc) { return $null }
    if ($Fv -isnot [hashtable]) { $Fv = @{} }
    $zh = [string]$Desc.zh
    $en = [string]$Desc.en
    $ja = [string]$Desc.ja
    if (Is-GenericDefault $zh $ModuleKey) {
        $hint = Get-ModuleApiHint $ModuleKey
        $fv = Format-FieldValuesSnippet $Fv
        if ($fv) {
            $pair = $NodeId + '/' + $ExampleId
            $zh = $pair + ': ' + $hint + '; field_values={' + $fv + '}.'
            $en = $pair + ' mapped via ' + $hint + ' with field_values={' + $fv + '}.'
            $ja = $pair + ': ' + $hint + '; field_values={' + $fv + '}.'
        }
    }
    return @{ zh = $zh.Trim(); en = $en.Trim(); ja = $ja.Trim() }
}

function Parse-FieldValuesBlock([string[]]$Lines, [int]$FieldValuesLineIndex) {
    $fv = @{}
    if ($FieldValuesLineIndex -lt 0 -or $FieldValuesLineIndex -ge $Lines.Count) { return $fv }
    $header = $Lines[$FieldValuesLineIndex]
    if ($header -match '^\s+field_values:\s*\{(.+)\}\s*$') {
        foreach ($part in ($Matches[1] -split ',\s*(?=[A-Za-z0-9_@]+:)')) {
            if ($part -match '^([A-Za-z0-9_@]+):\s*(.+)$') { $fv[$Matches[1]] = $Matches[2].Trim() }
        }
        return $fv
    }
    if ($header -ne '    field_values:') { return $fv }
    $j = $FieldValuesLineIndex + 1
    while ($j -lt $Lines.Count) {
        $l = $Lines[$j]
        if ($null -eq $l) { $j++; continue }
        if ($l -match '^\s{4}[A-Za-z0-9_@]+:' -and $l -notmatch '^\s{6}') { break }
        if ($l -match '^\s{6}([A-Za-z0-9_@]+):\s*(.+)$') { $fv[$Matches[1]] = $Matches[2].Trim() }
        $j++
    }
    return $fv
}

function Patch-File([string]$Path, [string]$NodeId, [string]$ModuleKey) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($Path, $Utf8))
    $changed = $false
    $rewritten = 0
    $inExamples = $false
    $currentExampleId = $null
    $seenIds = @{}
    $skipUntilIndent = -1

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($skipUntilIndent -ge 0) {
            if ($line -match '^(\s*)' -and $Matches[1].Length -le $skipUntilIndent -and $line.Trim() -ne '') {
                $skipUntilIndent = -1
            }
            else {
                $lines[$i] = $null
                $changed = $true
                continue
            }
        }

        if ($line -eq 'examples:') { $inExamples = $true; continue }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims|relations|external_mappings|applicability|review|module_contract):') {
            $inExamples = $false
        }

        if ($inExamples -and $line -match '^  - id: (.+)$') {
            $eid = $Matches[1].Trim()
            if ($seenIds.ContainsKey($eid)) { $seenIds[$eid]++; $eid = "$eid-$($seenIds[$eid])" } else { $seenIds[$eid] = 1 }
            if ($eid -ne $Matches[1].Trim()) { $lines[$i] = "  - id: $eid"; $changed = $true }
            $currentExampleId = $eid
            continue
        }

        if ($inExamples -and $line -match '^    (kind|expected_result|why_valid_or_invalid|scenario_id|synthetic|example_source|verified_version):') {
            $lines[$i] = $null
            $changed = $true
            $skipUntilIndent = 4
            continue
        }

        if ($inExamples -and $line -eq '    descriptions:') {
            $zh = ''; $en = ''; $ja = ''
            $j = $i + 1
            while ($j -lt $lines.Count -and $lines[$j] -match '^\s+(zh|en|ja):\s*(.+)$') {
                switch ($Matches[1]) { 'zh' { $zh = $Matches[2].Trim() } 'en' { $en = $Matches[2].Trim() } 'ja' { $ja = $Matches[2].Trim() } }
                $lines[$j] = $null
                $j++
            }
            $fv = @{}
            for ($k = $j; $k -lt $lines.Count; $k++) {
                if ($lines[$k] -match '^\s+field_values:') { $fv = Parse-FieldValuesBlock $lines $k; break }
            }
            if (Needs-Rewrite $zh $ModuleKey) {
                $desc = Get-Desc $NodeId $currentExampleId $ModuleKey
                if ($desc) {
                    $desc = Enhance-Desc $desc $NodeId $currentExampleId $ModuleKey $fv
                    $zh = $desc.zh; $en = $desc.en; $ja = $desc.ja
                    $rewritten++
                }
            }
            $lines[$i] = "    descriptions: {zh: $(Escape-Yaml $zh), en: $(Escape-Yaml $en), ja: $(Escape-Yaml $ja)}"
            $changed = $true
            continue
        }

        if ($inExamples -and $line -match '^    descriptions: \{zh: ') {
            $fv = @{}
            for ($k = $i + 1; $k -lt $lines.Count; $k++) {
                if ($lines[$k] -match '^\s+field_values:') { $fv = Parse-FieldValuesBlock $lines $k; break }
                if ($lines[$k] -match '^  - id:' -or (Is-ExamplesEnd $lines[$k])) { break }
            }
            if ($line -match '^\s+descriptions:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$') {
                $zh = $Matches[1].Trim().Trim('"')
                if (Needs-Rewrite $zh $ModuleKey) {
                    $desc = Get-Desc $NodeId $currentExampleId $ModuleKey
                    if ($desc) {
                        $desc = Enhance-Desc $desc $NodeId $currentExampleId $ModuleKey $fv
                        $lines[$i] = "    descriptions: {zh: $(Escape-Yaml $desc.zh), en: $(Escape-Yaml $desc.en), ja: $(Escape-Yaml $desc.ja)}"
                        $rewritten++
                        $changed = $true
                    }
                }
            }
            continue
        }
    }

    if ($changed) {
        $out = $lines | Where-Object { $_ -ne $null }
        [IO.File]::WriteAllLines($Path, $out, $Utf8)
    }
    return @{ changed = $changed; rewritten = $rewritten }
}

function Is-ExamplesEnd([string]$Line) {
    return $Line -match '^(parent_relation|sources|source_claims|relations|external_mappings|applicability|review|module_contract):'
}

$summary = @{}
$updated = 0
$rewTotal = 0
$nodes = 0

Get-ChildItem $InfoPlane -Filter node.yaml -Recurse | Sort-Object FullName | ForEach-Object {
    try {
    $text = [IO.File]::ReadAllText($_.FullName, $Utf8)
    if ($text -notmatch '(?ms)^examples:') { return }
    if ($text -notmatch '(?m)^id:\s*(.+)$') { return }
    $nodeId = $Matches[1].Trim()
    $rel = $_.FullName.Substring($Root.Length + 1) -replace '\\', '/'
    $mk = Get-ModuleKey $rel
    $r = Patch-File $_.FullName $nodeId $mk
    $nodes++
    if ($r.changed) { $updated++ }
    $rewTotal += $r.rewritten
    if (-not $summary.ContainsKey($mk)) { $summary[$mk] = @{ nodes = 0; updated = 0; rewritten = 0 } }
    $summary[$mk].nodes++
    if ($r.changed) { $summary[$mk].updated++ }
    $summary[$mk].rewritten += $r.rewritten
    } catch {
        Write-Host "FAILED: $($_.FullName) - $($_.Exception.Message)"
        throw
    }
}

$report = [ordered]@{
    processed_at = (Get-Date -Format 'yyyy-MM-dd')
    total_nodes_with_examples = $nodes
    updated_files = $updated
    descriptions_rewritten = $rewTotal
    modules = $summary
}
$report | ConvertTo-Json -Depth 5 | Out-File $SummaryPath -Encoding utf8
Write-Host "Processed $nodes nodes; updated $updated files; rewritten $rewTotal descriptions"
