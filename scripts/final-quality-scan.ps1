# Final ontology quality scan - read-only structural and governance audit
$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path
$OntologyRoot = (Join-Path $RepoRoot 'ontology') | Resolve-Path
$Locales = @('zh', 'en', 'ja')
$ExampleKinds = @('positive', 'counterexample', 'boundary', 'instance')
$LegacyTopKeys = @(
    'review_status', 'review', 'reviewers',
    'axioms', 'axiom_validation', 'axioms_and_validation',
    'adaptation_mapping', 'adaptation_mappings', 'external_mappings',
    'maturity', 'maturity_changes', 'change_history', 'change_log',
    'purpose'
)
$SuspiciousUrlPattern = '(?i)pending|example\.com|placeholder|localhost|127\.0\.0\.1|\btodo\b|\bTBD\b'
$PlaceholderPattern = '^(\?+|\uFF1F+|\uFFFD+)$'
$NaPattern = '(?i)not applicable|\u4E0D\u9002\u7528|\u4E0D\u9069\u7528'

function Normalize([string]$s) {
    if ([string]::IsNullOrWhiteSpace($s)) { return '' }
    return ($s -replace '\s+', '').ToLower()
}

function IsSimilar([string]$a, [string]$b) {
    if ([string]::IsNullOrWhiteSpace($a) -or [string]::IsNullOrWhiteSpace($b)) { return $false }
    $a2 = Normalize $a
    $b2 = Normalize $b
    if ($a2 -eq $b2) { return $true }
    if ($a2.Length -gt 20 -and ($a2.Contains($b2) -or $b2.Contains($a2))) { return $true }
    return $false
}

function Get-Indent([string]$line) {
    if ($line -match '^(\s*)') { return $Matches[1].Length }
    return 0
}

function Unquote([string]$s) {
    if ([string]::IsNullOrWhiteSpace($s)) { return '' }
    $t = $s.Trim()
    if (($t.StartsWith('"') -and $t.EndsWith('"')) -or ($t.StartsWith("'") -and $t.EndsWith("'"))) {
        return $t.Substring(1, $t.Length - 2)
    }
    return $t
}

function Parse-FlowLocalized([string]$inner) {
    $result = @{}
    $pattern = '(zh|en|ja):\s*("(?:[^"\\]|\\.)*"|[^,}]+)'
    $matches = [regex]::Matches($inner, $pattern)
    foreach ($m in $matches) {
        $locale = $m.Groups[1].Value
        $value = Unquote $m.Groups[2].Value.Trim()
        $result[$locale] = $value
    }
    return $result
}

function Extract-LocalizedObject([string[]]$lines, [int]$startIndex, [int]$baseIndent) {
    $line = $lines[$startIndex]
    if ($line -match ':\s*\{(.+)\}\s*$') {
        return Parse-FlowLocalized $Matches[1]
    }
    $result = @{}
    for ($i = $startIndex + 1; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $indent = Get-Indent $line
        if ($indent -le $baseIndent) { break }
        if ($line -match '^\s+(zh|en|ja):\s*(.*)$') {
            $result[$Matches[1]] = Unquote $Matches[2]
        }
    }
    return $result
}

function Extract-ListLocalizedObjects([string[]]$lines, [int]$startIndex, [int]$baseIndent) {
    $items = New-Object System.Collections.Generic.List[hashtable]
    $current = $null
    for ($i = $startIndex + 1; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $indent = Get-Indent $line
        if ($indent -le $baseIndent) { break }
        if ($line -match '^\s+-\s*\{(.+)\}\s*$') {
            if ($null -ne $current) { [void]$items.Add($current) ; $current = $null }
            [void]$items.Add((Parse-FlowLocalized $Matches[1]))
            continue
        }
        if ($line -match '^\s+-\s*(.*)$') {
            if ($null -ne $current) { [void]$items.Add($current) }
            $current = @{}
            $inline = $Matches[1]
            if ($inline -match '^\{(.+)\}\s*$') {
                [void]$items.Add((Parse-FlowLocalized $Matches[1]))
                $current = $null
                continue
            }
            if ($inline -match '^(zh|en|ja):\s*(.*)$') {
                $current[$Matches[1]] = Unquote $Matches[2]
            }
            continue
        }
        if ($null -ne $current -and $line -match '^\s+(zh|en|ja):\s*(.*)$') {
            $current[$Matches[1]] = Unquote $Matches[2]
        }
    }
    if ($null -ne $current) { [void]$items.Add($current) }
    return ,@($items.ToArray())
}

function Localized-Issues([hashtable]$obj, [string]$location) {
    $issues = @()
    if ($null -eq $obj -or $obj.Count -eq 0) {
        return @("${location}: missing or not a localized object")
    }
    foreach ($locale in $Locales) {
        $text = $obj[$locale]
        if ([string]::IsNullOrWhiteSpace($text)) {
            $issues += "${location}.${locale}: missing or empty"
        }
        elseif ($text.Trim() -match $PlaceholderPattern) {
            $issues += "${location}.${locale}: placeholder value"
        }
    }
    return $issues
}

function Extract-TopLevelKeyIndex([string[]]$lines, [string]$key) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^$([regex]::Escape($key)):\s*(.*)$") {
            return $i
        }
    }
    return -1
}

function Extract-Sources([string[]]$lines) {
    $idx = Extract-TopLevelKeyIndex $lines 'sources'
    if ($idx -lt 0) { return @() }
    $sources = New-Object System.Collections.Generic.List[object]
    $current = $null
    for ($i = $idx + 1; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $indent = Get-Indent $line
        if ($indent -eq 0 -and $line -match '^[a-z_]+:') { break }
        if ($line -match '^\s+-\s+id:\s*(.+)$') {
            if ($null -ne $current) { [void]$sources.Add($current) }
            $current = [ordered]@{ id = Unquote $Matches[1] }
            continue
        }
        if ($null -ne $current -and $line -match '^\s+(title|url|source_type|relevance):\s*(.+)$') {
            $current[$Matches[1]] = Unquote $Matches[2]
        }
    }
    if ($null -ne $current) { [void]$sources.Add($current) }
    return ,@($sources.ToArray())
}

function Extract-SourceClaims([string[]]$lines) {
    $idx = Extract-TopLevelKeyIndex $lines 'source_claims'
    if ($idx -lt 0) { return @() }
    $claims = New-Object System.Collections.Generic.List[object]
    $current = $null
    for ($i = $idx + 1; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $indent = Get-Indent $line
        if ($indent -eq 0 -and $line -match '^[a-z_]+:') { break }
        if ($line -match '^\s+-\s+id:\s*(.+)$') {
            if ($null -ne $current) { [void]$claims.Add($current) }
            $current = [ordered]@{ id = Unquote $Matches[1] }
            continue
        }
        if ($null -ne $current -and $line -match '^\s+(source|source_id|supports|locator|evidence_kind|confidence):\s*(.+)$') {
            $current[$Matches[1]] = Unquote $Matches[2]
        }
    }
    if ($null -ne $current) { [void]$claims.Add($current) }
    return ,@($claims.ToArray())
}

function Extract-ExampleKinds([string[]]$lines) {
    $kinds = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($line in $lines) {
        if ($line -match '^\s+kind:\s*(\w+)\s*$') {
            [void]$kinds.Add($Matches[1])
        }
    }
    return $kinds
}

function Plane-Of([string]$rel) {
    $parts = $rel -split '/'
    if ($parts.Length -ge 3 -and $parts[0] -eq 'ontology' -and $parts[1].EndsWith('-plane')) {
        return $parts[1] -replace '-plane$', ''
    }
    if ($parts.Length -eq 2 -and $parts[1] -eq 'node.yaml') {
        return 'root'
    }
    return 'unknown'
}

function Url-Issues([string]$url, [string]$location) {
    $issues = @()
    if ([string]::IsNullOrWhiteSpace($url)) {
        return @("${location}: missing url")
    }
    if ($url -notmatch '^https?://') {
        $issues += "${location}: url scheme not http(s)"
    }
    if ($url -notmatch '^https?://[^/\s]+') {
        $issues += "${location}: url missing host"
    }
    if ($url -match $SuspiciousUrlPattern) {
        $issues += "${location}: suspicious url pattern"
    }
    return $issues
}

function Scan-Node([string]$filePath) {
    $ontologyBase = $OntologyRoot.Path
    if ($filePath.StartsWith($ontologyBase)) {
        $inner = $filePath.Substring($ontologyBase.Length).TrimStart('\', '/')
    }
    else {
        $inner = Split-Path $filePath -Leaf
    }
    $rel = ('ontology/' + ($inner -replace '\\', '/'))
    $issues = New-Object System.Collections.Generic.List[string]
    $legacy = @()
    $lines = Get-Content -Path $filePath -Encoding UTF8
    $text = $lines -join "`n"

    foreach ($key in $LegacyTopKeys) {
        if ($text -match "(?m)^$([regex]::Escape($key)):\s*") {
            $legacy += $key
            $issues.Add("legacy top-level key: $key")
        }
    }

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $ln = $lines[$i]
        if ($ln -match '^\s+[^:]+:\s*``') {
            $issues.Add("YAML parse risk line $($i+1): plain scalar starts with backtick")
            break
        }
    }

    $semIdx = Extract-TopLevelKeyIndex $lines 'semantics'
    if ($semIdx -lt 0) {
        $issues.Add('semantics: missing')
    }
    else {
        $semIndent = Get-Indent $lines[$semIdx]
        foreach ($field in @('short_definition', 'definition', 'why_needed')) {
            $fieldIdx = -1
            for ($i = $semIdx + 1; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^\s{2}$([regex]::Escape($field)):\s*") {
                    $fieldIdx = $i
                    break
                }
                if ((Get-Indent $lines[$i]) -le $semIndent -and $lines[$i] -match '^\s*[a-z_]+:') { break }
            }
            if ($fieldIdx -lt 0) {
                foreach ($li in (Localized-Issues @{} "semantics.$field")) { $issues.Add($li) }
            }
            else {
                $locObj = Extract-LocalizedObject $lines $fieldIdx (Get-Indent $lines[$fieldIdx])
                foreach ($li in (Localized-Issues $locObj "semantics.$field")) { $issues.Add($li) }
            }
        }

        foreach ($field in @('includes', 'excludes')) {
            $fieldIdx = -1
            $inlineEntries = $null
            for ($i = $semIdx + 1; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^\s{2}$([regex]::Escape($field)):\s*\[(.+)\]\s*$") {
                    $inlineEntries = @((Parse-FlowLocalized $Matches[1]))
                    break
                }
                if ($lines[$i] -match "^\s{2}$([regex]::Escape($field)):\s*$") {
                    $fieldIdx = $i
                    break
                }
            }
            if ($null -ne $inlineEntries) {
                if ($inlineEntries.Count -eq 0) {
                    $issues.Add("semantics.${field}: missing or empty")
                }
                else {
                    for ($j = 0; $j -lt $inlineEntries.Count; $j++) {
                        foreach ($li in (Localized-Issues $inlineEntries[$j] "semantics.${field}[$j]")) { $issues.Add($li) }
                    }
                }
                continue
            }
            if ($fieldIdx -lt 0) {
                $issues.Add("semantics.${field}: missing or empty")
            }
            else {
                $entries = Extract-ListLocalizedObjects $lines $fieldIdx (Get-Indent $lines[$fieldIdx])
                if ($entries.Count -eq 0) {
                    $issues.Add("semantics.${field}: missing or empty")
                }
                else {
                    for ($j = 0; $j -lt $entries.Count; $j++) {
                        foreach ($li in (Localized-Issues $entries[$j] "semantics.${field}[$j]")) { $issues.Add($li) }
                    }
                }
            }
        }

        $sdIdx = -1; $dfIdx = -1
        for ($i = $semIdx + 1; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^\s{2}short_definition:\s*') { $sdIdx = $i }
            if ($lines[$i] -match '^\s{2}definition:\s*') { $dfIdx = $i }
        }
        if ($sdIdx -ge 0 -and $dfIdx -ge 0) {
            $sdObj = Extract-LocalizedObject $lines $sdIdx (Get-Indent $lines[$sdIdx])
            $dfObj = Extract-LocalizedObject $lines $dfIdx (Get-Indent $lines[$dfIdx])
            foreach ($locale in $Locales) {
                $sdText = $sdObj[$locale]
                $dfText = $dfObj[$locale]
                if (-not [string]::IsNullOrWhiteSpace($sdText) -and -not [string]::IsNullOrWhiteSpace($dfText)) {
                    if ($sdText.Trim() -eq $dfText.Trim()) {
                        $issues.Add("semantics.short_definition.$locale identical to definition")
                    }
                    elseif (IsSimilar $sdText $dfText) {
                        $issues.Add("semantics.short_definition.$locale too similar to definition")
                    }
                }
            }
        }
    }

    $engIdx = Extract-TopLevelKeyIndex $lines 'engineering'
    if ($engIdx -lt 0) {
        $issues.Add('engineering: missing or not an object')
    }
    else {
        $explIdx = -1
        for ($i = $engIdx + 1; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^\s{2}explanation:\s*') { $explIdx = $i; break }
            if ((Get-Indent $lines[$i]) -le (Get-Indent $lines[$engIdx]) -and $lines[$i] -match '^\s*[a-z_]+:') { break }
        }
        if ($explIdx -lt 0) {
            foreach ($li in (Localized-Issues @{} 'engineering.explanation')) { $issues.Add($li) }
        }
        else {
            $explObj = Extract-LocalizedObject $lines $explIdx (Get-Indent $lines[$explIdx])
            foreach ($li in (Localized-Issues $explObj 'engineering.explanation')) { $issues.Add($li) }
        }

        foreach ($ioKey in @('typical_input', 'typical_output')) {
            $ioPattern = "(?m)^\s{2}${ioKey}:\s*$"
            if ($text -notmatch $ioPattern) {
                $issues.Add("engineering.${ioKey}: missing or empty")
            }
            else {
                $ioBlockPattern = "(?ms)^\s{2}${ioKey}:\s*(.*?)(?=^\s{2}[a-z_]+:|^[a-z_]+:|\z)"
                if ($text -match $ioBlockPattern -and $Matches[1] -match $NaPattern) {
                    $issues.Add("engineering.${ioKey}: not-applicable placeholder")
                }
            }
        }
    }

    $kinds = Extract-ExampleKinds $lines
    $missingKinds = $ExampleKinds | Where-Object { -not $kinds.Contains($_) }
    if ($missingKinds.Count -gt 0) {
        $issues.Add("examples: missing kinds [$($missingKinds -join ', ')]")
    }

    $sources = Extract-Sources $lines
    $sourceIds = New-Object 'System.Collections.Generic.HashSet[string]'
    if ($sources.Count -eq 0) {
        $issues.Add('sources: missing or empty')
    }
    else {
        for ($i = 0; $i -lt $sources.Count; $i++) {
            $src = $sources[$i]
            $loc = "sources[$i]"
            if ([string]::IsNullOrWhiteSpace($src.id)) {
                $issues.Add("${loc}.id: missing")
            }
            elseif ($sourceIds.Contains($src.id)) {
                $issues.Add("${loc}.id: duplicate $($src.id)")
            }
            else {
                [void]$sourceIds.Add($src.id)
            }
            foreach ($req in @('title', 'source_type', 'relevance')) {
                if ([string]::IsNullOrWhiteSpace($src[$req])) {
                    $issues.Add("${loc}.${req}: missing")
                }
            }
            foreach ($ui in (Url-Issues $src.url "${loc}.url")) { $issues.Add($ui) }
        }
    }

    $claims = Extract-SourceClaims $lines
    $claimIds = New-Object 'System.Collections.Generic.HashSet[string]'
    if ($claims.Count -eq 0) {
        $issues.Add('source_claims: missing or empty')
    }
    else {
        for ($i = 0; $i -lt $claims.Count; $i++) {
            $claim = $claims[$i]
            $loc = "source_claims[$i]"
            if ([string]::IsNullOrWhiteSpace($claim.id)) {
                $issues.Add("${loc}.id: missing")
            }
            elseif ($claimIds.Contains($claim.id)) {
                $issues.Add("${loc}.id: duplicate $($claim.id)")
            }
            else {
                [void]$claimIds.Add($claim.id)
            }
            $srcRef = if ($claim.source) { $claim.source } else { $claim.source_id }
            if ([string]::IsNullOrWhiteSpace($srcRef)) {
                $issues.Add("${loc}.source: missing")
            }
            elseif (-not $sourceIds.Contains($srcRef)) {
                $issues.Add("${loc}.source: unknown source id $srcRef")
            }
            foreach ($req in @('supports', 'locator', 'evidence_kind', 'confidence')) {
                if ([string]::IsNullOrWhiteSpace($claim[$req])) {
                    $issues.Add("${loc}.${req}: missing")
                }
            }
        }
    }

    $allMatches = [regex]::Matches($text, '(?m)source_claims:\s*\[(.+?)\]')
    foreach ($m in $allMatches) {
        $refs = $m.Groups[1].Value -split ',' | ForEach-Object { Unquote $_.Trim() } | Where-Object { $_ }
        foreach ($ref in $refs) {
            if (-not $claimIds.Contains($ref)) {
                $issues.Add("embedded source_claims references unknown claim id $ref")
            }
        }
    }

    return [pscustomobject]@{
        path = $rel
        plane = Plane-Of $rel
        issues = @($issues)
        legacy = $legacy
    }
}

$files = Get-ChildItem -Path $OntologyRoot -Recurse -Filter 'node.yaml' | Sort-Object FullName
$results = foreach ($f in $files) { Scan-Node $f.FullName }

$planeTotals = @{}
$planePass = @{}
$planeFail = @{}
$legacyCounter = @{}
$issueCategory = @{}
$failing = @()
$statusAccepted = 0
$releaseBlocks = 0
$yamlRisk = 0

foreach ($f in $files) {
    $text = Get-Content -Path $f.FullName -Raw -Encoding UTF8
    if ($text -match '(?m)^status:\s*accepted\s*$') { $statusAccepted++ }
    if ($text -match '(?m)^release:\s*') { $releaseBlocks++ }
}

foreach ($r in $results) {
    $p = $r.plane
    if (-not $planeTotals.ContainsKey($p)) { $planeTotals[$p] = 0; $planePass[$p] = 0; $planeFail[$p] = 0 }
    $planeTotals[$p]++
    foreach ($lk in $r.legacy) {
        if (-not $legacyCounter.ContainsKey($lk)) { $legacyCounter[$lk] = 0 }
        $legacyCounter[$lk]++
    }
    if ($r.issues.Count -gt 0) {
        $planeFail[$p]++
        $failing += $r
        if (($r.issues | Where-Object { $_ -like 'YAML parse risk*' }).Count -gt 0) { $yamlRisk++ }
        foreach ($issue in $r.issues) {
            if ($issue -like 'embedded source_claims*') { $cat = 'embedded source_claims' }
            elseif ($issue -like 'legacy top-level key*') { $cat = 'legacy top-level key' }
            elseif ($issue -like 'YAML parse risk*') { $cat = 'yaml parse risk' }
            else { $cat = ($issue -split ':')[0].Split('.')[0] }
            if (-not $issueCategory.ContainsKey($cat)) { $issueCategory[$cat] = 0 }
            $issueCategory[$cat]++
        }
    }
    else {
        $planePass[$p]++
    }
}

$total = $results.Count
$passed = $total - $failing.Count
$compliance = if ($total -gt 0) { [math]::Round(100.0 * $passed / $total, 2) } else { 0 }

$planeSummary = @{}
foreach ($p in ($planeTotals.Keys | Sort-Object)) {
    $t = $planeTotals[$p]
    $pp = $planePass[$p]
    $planeSummary[$p] = @{
        total = $t
        passed = $pp
        failed = $planeFail[$p]
        compliance_pct = if ($t -gt 0) { [math]::Round(100.0 * $pp / $t, 2) } else { 0 }
    }
}

$report = [ordered]@{
    scan_date = '2026-07-19'
    total_nodes = $total
    passed = $passed
    failed = $failing.Count
    compliance_rate_pct = $compliance
    yaml_parse_risks = $yamlRisk
    legacy_top_level = $legacyCounter
    legacy_total_occurrences = if ($legacyCounter.Count -gt 0) { ($legacyCounter.Values | Measure-Object -Sum).Sum } else { 0 }
    status_accepted = $statusAccepted
    release_blocks = $releaseBlocks
    plane_summary = $planeSummary
    issue_category_counts = $issueCategory
    failing_nodes = $failing
}

$outJson = Join-Path $RepoRoot.Path 'docs/final-quality-scan.json'
$report | ConvertTo-Json -Depth 8 | Set-Content -Path $outJson -Encoding UTF8
Write-Output ($report | ConvertTo-Json -Depth 8)
