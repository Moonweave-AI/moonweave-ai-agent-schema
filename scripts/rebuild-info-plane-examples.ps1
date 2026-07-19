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

function Strip-KnownPrefix([string]$Text, [string]$ModuleKey) {
    $p = $prefixData.$ModuleKey
    if (-not $p) { return $Text }
    foreach ($lang in @('zh','en','ja')) {
        $prefix = [string]$p.$lang
        if ($prefix -and $Text.StartsWith($prefix)) {
            return $Text.Substring($prefix.Length)
        }
    }
    return $Text
}

function Slugify([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return 'case' }
    $s = $Text.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $s = $s.Trim('-')
    if ($s.Length -gt 40) { $s = $s.Substring(0, 40).Trim('-') }
    if ([string]::IsNullOrWhiteSpace($s)) { return 'case' }
    return $s
}

function NeedsApiPrefix([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return $true }
    return -not ($Text -match '(API|MCP|OpenAI|Anthropic|A2A|LangChain|Elasticsearch|SSE|Docker|Cursor|Perplexity|DSPy|Responses|prompts/|content_block|tool_calls|previous_response|contextId|input_text|image_url|char_location|DocumentLoader|stdout|stderr|Pinecone|DOI|RFC |/v1/)')
}

function Process-File([string]$Path) {
    $rel = $Path.Substring((Resolve-Path $PlaneDir).Path.Length + 1)
    $moduleKey = Get-ModuleKey -RelPath $rel
    $prefix = $prefixData.$moduleKey

    $text = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
    if ($text -notmatch '(?m)^id:\s*(.+)$') { return $false }
    $nodeId = $Matches[1].Trim()
    $nodeSlug = ($nodeId -creplace '([a-z])([A-Z])', '$1-$2').ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $nodeSlug = $nodeSlug.Trim('-')

    if ($text -notmatch '(?ms)^examples:\r?\n(.*?)(?=^(?:parent_relation|sources|source_claims|relations):|\z)') { return $false }

    $blocks = [regex]::Split($Matches[1], '(?=^  - id: )')
    $used = @{}
    $newBlocks = @()
    $changed = $false

    foreach ($block in $blocks) {
        if ($block -notmatch '(?m)^  - id:\s*(.+)$') { continue }

        $labelZh = ''
        $labelEn = ''
        $labelJa = ''
        if ($block -match '(?ms)^    labels:\s*\n\s+zh:\s*(.+)\n\s+en:\s*(.+)\n\s+ja:\s*(.+)\s*$') {
            $labelZh = Strip-KnownPrefix -Text $Matches[1].Trim() -ModuleKey $moduleKey
            $labelEn = $Matches[2].Trim()
            $labelJa = $Matches[3].Trim()
        }
        elseif ($block -match 'labels:\s*\{zh:\s*([^,]+),\s*en:\s*([^,]+),\s*ja:\s*([^}]+)\}') {
            $labelZh = Strip-KnownPrefix -Text $Matches[1].Trim() -ModuleKey $moduleKey
            $labelEn = $Matches[2].Trim()
            $labelJa = $Matches[3].Trim()
        }

        $slug = Slugify $labelEn
        $newId = "$nodeSlug-$slug"
        $n = 2
        while ($used.ContainsKey($newId)) { $newId = "$nodeSlug-$slug-$n"; $n++ }
        $used[$newId] = $true

        $descZh = ''
        $descEn = ''
        $descJa = ''
        if ($block -match '(?ms)^    descriptions:\s*\n\s+zh:\s*(.+)\n\s+en:\s*(.+)\n\s+ja:\s*(.+)\s*$') {
            $descZh = Strip-KnownPrefix -Text $Matches[1].Trim() -ModuleKey $moduleKey
            $descEn = Strip-KnownPrefix -Text $Matches[2].Trim() -ModuleKey $moduleKey
            $descJa = Strip-KnownPrefix -Text $Matches[3].Trim() -ModuleKey $moduleKey
        }
        elseif ($block -match 'descriptions:\s*\{zh:\s*([^,]+),\s*en:\s*([^,]+),\s*ja:\s*([^}]+)\}') {
            $descZh = Strip-KnownPrefix -Text $Matches[1].Trim() -ModuleKey $moduleKey
            $descEn = Strip-KnownPrefix -Text $Matches[2].Trim() -ModuleKey $moduleKey
            $descJa = Strip-KnownPrefix -Text $Matches[3].Trim() -ModuleKey $moduleKey
        }

        if ($prefix -and (NeedsApiPrefix $descZh)) {
            $descZh = $prefix.zh + $descZh
            $descEn = $prefix.en + $descEn
            $descJa = $prefix.ja + $descJa
        }

        $rest = @()
        $skip = $false
        $inDesc = $false
        foreach ($line in ($block -split '\n')) {
            if ($line -match '^  - id:') { continue }
            if ($line -match '^    labels:') { $skip = 'labels'; continue }
            if ($line -match '^    descriptions:') { $skip = 'descriptions'; $inDesc = $true; continue }
            if ($skip -eq 'labels' -and $line -match '^\s+(zh|en|ja):') { continue }
            if ($skip -eq 'descriptions') {
                if ($line -match '^\s+(zh|en|ja):') { continue }
                if ($line -notmatch '^\s{4,}') { $skip = $false; $inDesc = $false }
            }
            if ($skip) { continue }
            $rest += $line
        }

        $newBlock = @(
            "  - id: $newId"
            '    labels:'
            "      zh: $labelZh"
            "      en: $labelEn"
            "      ja: $labelJa"
            '    descriptions:'
            "      zh: $descZh"
            "      en: $descEn"
            "      ja: $descJa"
        )
        foreach ($line in $rest) {
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            $newBlock += $line
        }
        $newBlocks += ($newBlock -join "`n")
        $changed = $true
    }

    if (-not $changed) { return $false }
    $newSection = "examples:`n" + ($newBlocks -join "`n`n") + "`n"
    $newText = [regex]::Replace($text, '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):|\z)', $newSection, 1)
    [IO.File]::WriteAllText($Path, $newText, (New-Object Text.UTF8Encoding $false))
    return $true
}

$fixed = 0
Get-ChildItem -Path $PlaneDir -Filter 'node.yaml' -Recurse | ForEach-Object {
    if (Process-File -Path $_.FullName) { $fixed++ }
}
Write-Host "Rebuilt examples in $fixed files"
