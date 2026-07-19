# Upgrade info-plane examples: remove taxonomy fields, rename ids, enrich descriptions.
param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$InfoPlane = Join-Path $Root 'ontology\info-plane'
$SummaryPath = Join-Path $Root 'docs\info-plane-example-upgrade-summary.json'

function Get-ModuleKey([string]$RelativePath) {
    if ($RelativePath -match 'info-messages-instructions') { return 'messages' }
    if ($RelativePath -match 'info-prompts-instructions') { return 'prompts' }
    if ($RelativePath -match 'info-content-parts') { return 'content-parts' }
    if ($RelativePath -match 'info-storage-sources') { return 'storage-sources' }
    if ($RelativePath -match 'info-output-disclosure') { return 'output-disclosure' }
    if ($RelativePath -match 'info-container-command') { return 'container-command' }
    if ($RelativePath -match 'info-indexing') { return 'indexing' }
    return 'info-plane'
}

function Rename-ExampleId([string]$Id) {
    $newId = $Id
    foreach ($token in @('-positive-', '-counterexample-', '-counter-', '-boundary-', '-instance-')) {
        $newId = $newId.Replace($token, '-')
    }
    foreach ($suffix in @('-positive', '-counterexample', '-counter', '-boundary', '-instance')) {
        if ($newId.EndsWith($suffix)) { $newId = $newId.Substring(0, $newId.Length - $suffix.Length) }
    }
    $newId = ($newId -replace '--+', '-').Trim('-')
    if ([string]::IsNullOrWhiteSpace($newId)) { return $Id }
    return $newId
}

function Escape-YamlDoubleQuoted([string]$Text) {
    if ($null -eq $Text) { return '""' }
    return '"' + ($Text -replace '\\', '\\\\' -replace '"', '\"') + '"'
}

function Get-EngineeringFormats([string]$Text) {
    $formats = @()
    foreach ($m in [regex]::Matches($Text, '(?ms)format:\s*\|-?\s*\n((?:\s+.+\n)+)')) {
        $compact = ($m.Groups[1].Value -split '\n' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) -join ' '
        if ($compact.Length -gt 20 -and $compact.Length -lt 500) { $formats += $compact }
    }
    foreach ($m in [regex]::Matches($Text, '(?ms)format:\s*\|\s*\n\s+(.+)')) {
        $compact = $m.Groups[1].Value.Trim()
        if ($compact.Length -gt 20 -and $compact.Length -lt 500) { $formats += $compact }
    }
    return ($formats | Select-Object -Unique)
}

function Parse-LocalizedBlock([string]$Block) {
    $result = @{ zh = ''; en = ''; ja = '' }
    foreach ($lang in @('zh', 'en', 'ja')) {
        if ($Block -match "(?ms)^\s*${lang}:\s*(.+?)(?=^\s*(?:zh|en|ja):|\z)") {
            $result[$lang] = $Matches[1].Trim()
        }
    }
    return $result
}

function Parse-InlineLocalized([string]$Line, [string]$Key) {
    if ($Line -notmatch "^\s+${Key}:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$") { return $null }
    return @{ zh = $Matches[1].Trim(); en = $Matches[2].Trim(); ja = $Matches[3].Trim() }
}

function Format-FieldValuesSnippet([hashtable]$FieldValues) {
    if (-not $FieldValues -or $FieldValues.Count -eq 0) { return '' }
    $pairs = @()
    foreach ($key in ($FieldValues.Keys | Sort-Object)) {
        $val = $FieldValues[$key]
        if ($null -eq $val) { continue }
        $pairs += "$key=$val"
    }
    return ($pairs -join '; ')
}

function Get-ModuleApiHint([string]$ModuleKey) {
    switch ($ModuleKey) {
        'messages' { return 'OpenAI Chat Completions POST /v1/chat/completions messages[]、Anthropic POST /v1/messages、A2A SendMessage' }
        'prompts' { return 'OpenAI Responses instructions 参数、LangChain ChatPromptTemplate.from_messages、MCP prompts/get' }
        'content-parts' { return 'OpenAI content[{type:text|image_url}]、Anthropic content blocks、A2A Part text/url/data' }
        'storage-sources' { return 'Anthropic citations char_location、LangChain Document.metadata.source、RFC 9110 Content-Digest/ETag' }
        'output-disclosure' { return 'OpenAI SSE stream delta choices[0].delta.content、Anthropic content_block_delta、Cursor streaming UI' }
        'container-command' { return 'Docker Engine POST /containers/exec、Cursor sandbox terminal、stdout/stderr fd' }
        'indexing' { return 'Elasticsearch POST index/_search、PostgreSQL CREATE INDEX、Pinecone query topK' }
        default { return 'OpenAI Responses API、A2A Protocol Message/Artifact、MCP Resource/Prompt' }
    }
}

function Enhance-Descriptions(
    [string]$NodeId,
    [string]$ExampleId,
    [string]$ModuleKey,
    [hashtable]$Descriptions,
    [hashtable]$FieldValues,
    [hashtable]$ExpectedResult,
    [hashtable]$WhyValid,
    [string[]]$EngineeringFormats
) {
    $apiHint = Get-ModuleApiHint -ModuleKey $ModuleKey
    $fvSnippet = Format-FieldValuesSnippet -FieldValues $FieldValues
    $shape = if ($EngineeringFormats.Count -gt 0) { $EngineeringFormats[0] } else { '' }

    $zh = [string]$Descriptions.zh
    $en = [string]$Descriptions.en
    $ja = [string]$Descriptions.ja

    if ($ExpectedResult.zh) {
        $zh = "$zh $($ExpectedResult.zh)"
        $en = "$en $($ExpectedResult.en)"
        $ja = "$ja $($ExpectedResult.ja)"
    }
    if ($WhyValid.zh) {
        $zh = "$zh $($WhyValid.zh)"
        $en = "$en $($WhyValid.en)"
        $ja = "$ja $($WhyValid.ja)"
    }

    $techPattern = '(\{|\[|/v1/|API|MCP|OpenAI|Anthropic|A2A|LangChain|Elasticsearch|SSE|Docker|Cursor|Perplexity|DSPy|Chat Completions|Responses|prompts/|content_block|tool_calls|messages|role=|uri:|mimeType|ETag|digest|citation|POST |GET )'
    $hasTech = $zh -match $techPattern
    if (-not $hasTech) {
        if ($shape) {
            $zh = $zh + ' 典型 API/载荷形状：' + $shape
            $en = $en + ' Typical API/payload shape: ' + $shape
            $ja = $ja + ' 典型 API/ペイロード形状：' + $shape
        }
        elseif ($fvSnippet) {
            $zh = $zh + ' 在 ' + $NodeId + '/' + $ExampleId + ' 中通过 ' + $apiHint + ' 映射，field_values={' + $fvSnippet + '}。'
            $en = $en + ' At ' + $NodeId + '/' + $ExampleId + ' mapped via ' + $apiHint + ' with field_values={' + $fvSnippet + '}.'
            $ja = $ja + ' ' + $NodeId + '/' + $ExampleId + ' で ' + $apiHint + ' により field_values={' + $fvSnippet + '} をマップ。'
        }
    }

    return @{ zh = $zh.Trim(); en = $en.Trim(); ja = $ja.Trim() }
}

function Process-File([string]$Path, [string]$NodeId, [string]$ModuleKey) {
    $text = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
    if ($text -notmatch '(?ms)^examples:\r?\n(.*?)(?=^(?:parent_relation|sources|source_claims|relations):|\z)') { return @{ Changed = $false; ExampleCount = 0 } }

    $engineeringFormats = Get-EngineeringFormats -Text $text
    $exampleSection = $Matches[1]
    $examples = @()
    $blocks = [regex]::Split($exampleSection, '(?=^  - id: )')
    foreach ($block in $blocks) {
        if ($block -notmatch '(?m)^  - id:\s*(.+)$') { continue }
        $oldId = $Matches[1].Trim()
        $newId = Rename-ExampleId -Id $oldId

        $labels = $null
        if ($block -match '(?ms)^    labels:\s*\n((?:      .+\n)+)') {
            $labels = $Matches[1].TrimEnd()
        }
        elseif ($block -match '(?m)^    labels:\s*\{(.+)\}\s*$') {
            $labels = $Matches[1].Trim()
        }

        $descriptions = @{ zh = ''; en = ''; ja = '' }
        $inlineDesc = [regex]::Match($block, '(?m)^    descriptions:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$')
        if ($inlineDesc.Success) {
            $descriptions = @{ zh = $inlineDesc.Groups[1].Value.Trim(); en = $inlineDesc.Groups[2].Value.Trim(); ja = $inlineDesc.Groups[3].Value.Trim() }
        }
        elseif ($block -match '(?ms)^    descriptions:\s*\n((?:      .+\n)+)') {
            $parsed = Parse-LocalizedBlock -Block $Matches[1]
            $descriptions = $parsed
        }

        $expected = @{ zh = ''; en = ''; ja = '' }
        $inlineExp = [regex]::Match($block, '(?m)^    expected_result:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$')
        if ($inlineExp.Success) {
            $expected = @{ zh = $inlineExp.Groups[1].Value.Trim(); en = $inlineExp.Groups[2].Value.Trim(); ja = $inlineExp.Groups[3].Value.Trim() }
        }
        elseif ($block -match '(?ms)^    expected_result:\s*\n((?:      .+\n)+)') {
            $expected = Parse-LocalizedBlock -Block $Matches[1]
        }

        $why = @{ zh = ''; en = ''; ja = '' }
        $inlineWhy = [regex]::Match($block, '(?m)^    why_valid_or_invalid:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$')
        if ($inlineWhy.Success) {
            $why = @{ zh = $inlineWhy.Groups[1].Value.Trim(); en = $inlineWhy.Groups[2].Value.Trim(); ja = $inlineWhy.Groups[3].Value.Trim() }
        }
        elseif ($block -match '(?ms)^    why_valid_or_invalid:\s*\n((?:      .+\n)+)') {
            $why = Parse-LocalizedBlock -Block $Matches[1]
        }

        $fieldValues = @{}
        if ($block -match '(?m)^    field_values:\s*\{(.+)\}\s*$') {
            foreach ($part in ($Matches[1] -split ',\s*(?=[A-Za-z0-9_@]+:)')) {
                if ($part -match '^([A-Za-z0-9_@]+):\s*(.+)$') { $fieldValues[$Matches[1]] = $Matches[2].Trim() }
            }
        }
        elseif ($block -match '(?ms)^    field_values:\s*\n((?:      .+\n)+)') {
            foreach ($line in ($Matches[1] -split '\n')) {
                if ($line -match '^\s{6}([A-Za-z0-9_@]+):\s*(.+)$') { $fieldValues[$Matches[1]] = $Matches[2].Trim() }
            }
        }

        $enhanced = Enhance-Descriptions -NodeId $NodeId -ExampleId $newId -ModuleKey $ModuleKey `
            -Descriptions $descriptions -FieldValues $fieldValues -ExpectedResult $expected -WhyValid $why -EngineeringFormats $engineeringFormats

        $restLines = @()
        $skipLabels = $false
        foreach ($line in ($block -split '\n')) {
            if ($line -match '^    (kind|expected_result|why_valid_or_invalid|scenario_id|synthetic|example_source|verified_version):') { continue }
            if ($line -match '^  - id:') { continue }
            if ($line -match '^    labels:') { $skipLabels = $true; continue }
            if ($skipLabels -and $line -match '^\s+(zh|en|ja):') { continue }
            if ($skipLabels -and $line -notmatch '^\s{4,}') { $skipLabels = $false }
            if ($line -match '^    descriptions:') { continue }
            if ($line -match '^\s+(zh|en|ja):') { continue }
            $restLines += $line
        }

        $newBlock = @(
            "  - id: $newId"
        )
        if ($labels) {
            if ($labels -match '^\s+zh:') {
                $newBlock += '    labels:'
                $newBlock += ($labels -split '\n' | Where-Object { $_ -match '^\s+(zh|en|ja):' })
            }
            else {
                $newBlock += "    labels: {$labels}"
            }
        }
        $newBlock += "    descriptions: {zh: $(Escape-YamlDoubleQuoted $enhanced.zh), en: $(Escape-YamlDoubleQuoted $enhanced.en), ja: $(Escape-YamlDoubleQuoted $enhanced.ja)}"
        foreach ($line in $restLines) {
            if ($line -match '^  - id:') { continue }
            if ($line.Trim() -eq '') { continue }
            $newBlock += $line
        }
        $examples += ($newBlock -join "`n")
    }

    if ($examples.Count -eq 0) { return @{ Changed = $false; ExampleCount = 0 } }

    $newExamplesSection = "examples:`n" + ($examples -join "`n") + "`n"
    $newText = [regex]::Replace($text, '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):|\z)', $newExamplesSection, 1)

    $changed = $newText -ne $text
    if ($changed) {
        [IO.File]::WriteAllText($Path, $newText, (New-Object System.Text.UTF8Encoding $false))
    }
    return @{ Changed = $changed; ExampleCount = $examples.Count }
}

$files = Get-ChildItem -Path $InfoPlane -Filter 'node.yaml' -Recurse | Sort-Object FullName
$updated = 0
$summary = @{}

foreach ($file in $files) {
    $text = [IO.File]::ReadAllText($file.FullName, [Text.Encoding]::UTF8)
    if ($text -notmatch '(?m)^examples:\s*$') { continue }
    if ($text -notmatch '(?m)^id:\s*(.+)$') { continue }

    $nodeId = $Matches[1].Trim()
    $rel = $file.FullName.Substring($Root.Length + 1) -replace '\\', '/'
    $moduleKey = Get-ModuleKey -RelativePath $rel
    $result = Process-File -Path $file.FullName -NodeId $nodeId -ModuleKey $moduleKey

    if ($result.Changed) { $updated++ }
    if (-not $summary.ContainsKey($moduleKey)) { $summary[$moduleKey] = @{ nodes = 0; examples = 0; updated = 0 } }
    $summary[$moduleKey].nodes++
    $summary[$moduleKey].examples += $result.ExampleCount
    if ($result.Changed) { $summary[$moduleKey].updated++ }
}

$report = [ordered]@{
    processed_at = (Get-Date -Format 'yyyy-MM-dd')
    total_files_with_examples = ($summary.Values | ForEach-Object { $_.nodes } | Measure-Object -Sum).Sum
    updated_files = $updated
    modules = $summary
}
$report | ConvertTo-Json -Depth 5 | Set-Content -Path $SummaryPath -Encoding UTF8
Write-Host "Updated $updated / $($report.total_files_with_examples) info-plane example files"
Write-Host "Summary written to $SummaryPath"
