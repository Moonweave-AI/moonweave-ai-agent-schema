param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$PlaneDir = Join-Path $Root 'ontology\info-plane'
$PrefixPath = Join-Path $Root 'scripts\info-plane-example-prefixes.json'
$prefixData = Get-Content -Raw -Path $PrefixPath -Encoding UTF8 | ConvertFrom-Json

function Get-ModuleKey([string]$RelPath) {
    if ($RelPath -like '*info-messages-instructions*') { return 'messages' }
    if ($RelPath -like '*info-prompts-instructions*') { return 'prompts' }
    if ($RelPath -like '*info-content-parts*') { return 'content-parts' }
    if ($RelPath -like '*info-storage-sources*') { return 'storage-sources' }
    if ($RelPath -like '*info-output-disclosure*') { return 'output-disclosure' }
    if ($RelPath -like '*info-container-command*') { return 'container-command' }
    if ($RelPath -like '*info-indexing*') { return 'indexing' }
    return 'info-plane'
}

function NeedsApiPrefix([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return $true }
    return -not ($Text -match '(API|MCP|OpenAI|Anthropic|A2A|LangChain|Elasticsearch|SSE|Docker|Cursor|Perplexity|DSPy|Responses|prompts/|content_block|tool_calls|previous_response|contextId|input_text|image_url|char_location|DocumentLoader|stdout|stderr|Pinecone|DOI|RFC |/v1/)')
}

function Enrich-InlineDescriptions([string]$Line, $Prefix) {
    if ($Line -notmatch '^\s+descriptions:\s*\{zh:\s*(.+),\s*en:\s*(.+),\s*ja:\s*(.+)\}\s*$') { return $Line }
    $zh = $Matches[1].Trim()
    $en = $Matches[2].Trim()
    $ja = $Matches[3].Trim()
    if (NeedsApiPrefix $zh) {
        $zh = $Prefix.zh + $zh
        $en = $Prefix.en + $en
        $ja = $Prefix.ja + $ja
        return "    descriptions: {zh: $zh, en: $en, ja: $ja}"
    }
    return $Line
}

$updated = 0
Get-ChildItem -Path $PlaneDir -Filter 'node.yaml' -Recurse | ForEach-Object {
    $rel = $_.FullName.Substring((Resolve-Path $PlaneDir).Path.Length + 1)
    $moduleKey = Get-ModuleKey -RelPath $rel
    $prefix = $prefixData.$moduleKey
    $lines = [IO.File]::ReadAllLines($_.FullName, [Text.Encoding]::UTF8)
    $out = New-Object System.Collections.Generic.List[string]
    $inExamples = $false
    $inDescriptions = $false
    $changed = $false

    foreach ($line in $lines) {
        if ($line -eq 'examples:') {
            $inExamples = $true
            $inDescriptions = $false
            $out.Add($line)
            continue
        }
        if ($inExamples -and $line -match '^(parent_relation|sources|source_claims|relations):') {
            $inExamples = $false
            $inDescriptions = $false
            $out.Add($line)
            continue
        }
        if (-not $inExamples) {
            $out.Add($line)
            continue
        }

        if ($line -match '^    descriptions:\s*\{') {
            $newLine = Enrich-InlineDescriptions -Line $line -Prefix $prefix
            if ($newLine -ne $line) { $changed = $true }
            $out.Add($newLine)
            $inDescriptions = $false
            continue
        }
        if ($line -eq '    descriptions:') {
            $inDescriptions = $true
            $out.Add($line)
            continue
        }
        if ($inDescriptions -and $line -match '^\s+(zh|en|ja):\s*(.+)$') {
            $lang = $Matches[1]
            $text = $Matches[2]
            if ((NeedsApiPrefix $text) -and $prefix.$lang) {
                $out.Add('      ' + $lang + ': ' + $prefix.$lang + $text)
                $changed = $true
                continue
            }
        }
        if ($inDescriptions -and $line -notmatch '^\s{4,}') { $inDescriptions = $false }

        $out.Add($line)
    }

    if ($changed) {
        [IO.File]::WriteAllLines($_.FullName, $out, (New-Object Text.UTF8Encoding $false))
        $updated++
    }
}

Write-Host "Enriched descriptions in $updated files"
