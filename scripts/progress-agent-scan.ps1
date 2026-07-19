# Progress sync agent scan (PowerShell, no external deps beyond git)
$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot '..' 'ontology' | Resolve-Path
$legacyKeys = @(
    'axioms', 'axiom_validation', 'axioms_and_validation', 'validation',
    'adaptation_mapping', 'adaptation_mappings', 'external_mappings',
    'maturity', 'maturity_changes', 'change_history', 'change_log', 'changelog',
    'introduced', 'deprecated', 'change_notes', 'review_status', 'review', 'reviewers'
)
$exampleKinds = @('positive', 'counterexample', 'boundary', 'instance')
$naPattern = '(不适用|not applicable|\bn/?a\b|\bnone\b|无\b)'

function Get-ZhText([string]$block) {
    if ([string]::IsNullOrWhiteSpace($block)) { return '' }
    if ($block -match 'zh:\s*(.+)$') { return $Matches[1].Trim().Trim('"').Trim("'") }
    if ($block -match 'en:\s*(.+)$') { return $Matches[1].Trim().Trim('"').Trim("'") }
    return $block.Trim()
}

function Normalize([string]$s) {
    if ([string]::IsNullOrWhiteSpace($s)) { return '' }
    return ($s -replace '\s+', '').ToLowerInvariant()
}

function IsSimilar([string]$a, [string]$b) {
    if ([string]::IsNullOrWhiteSpace($a) -or [string]::IsNullOrWhiteSpace($b)) { return $false }
    $a2 = Normalize $a
    $b2 = Normalize $b
    if ($a2 -eq $b2) { return $true }
    if ($a2.Length -gt 20 -and ($a2.Contains($b2) -or $b2.Contains($a2))) { return $true }
    return $false
}

function Extract-Block([string[]]$lines, [string]$key) {
    $pattern = "^\s{2,4}${key}:\s*(.*)$"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pattern) {
            $val = $Matches[1]
            if ($val -match '^\{') { return $val }
            if ($val -match '^\|') {
                $buf = @()
                for ($j = $i + 1; $j -lt $lines.Count; $j++) {
                    if ($lines[$j] -match '^\s{4,}' -and $lines[$j] -notmatch '^\s{2}[a-z_]+:') { $buf += $lines[$j].Trim() }
                    else { break }
                }
                return ($buf -join ' ')
            }
            return $val.Trim().Trim('"').Trim("'")
        }
    }
    return ''
}

$stats = [ordered]@{
    total = 0
    yaml_errors = @()
    status_accepted = 0
    release_block = 0
    legacy_keys = @()
    nodes_with_issues = 0
    nodes_pass_basic = 0
    example_kind_gaps = 0
    missing_sources = 0
    na_io = 0
    def_same = 0
    eng_repeat = 0
    issues_by_category = @{}
    git_modified_node_yaml = $null
}
$planeCounts = @{}
$topIssues = @()

$files = Get-ChildItem -Path $root -Recurse -Filter 'node.yaml' | Sort-Object FullName
foreach ($file in $files) {
    $rel = $file.FullName.Substring($root.Path.Length + 1).Replace('\', '/')
    $fullRel = "ontology/$rel"
    $stats.total++
    $parts = $rel -split '/'
    $plane = if ($parts.Length -gt 1) { $parts[0] } else { 'unknown' }
    if (-not $planeCounts.ContainsKey($plane)) { $planeCounts[$plane] = 0 }
    $planeCounts[$plane]++

    $lines = Get-Content -Path $file.FullName -Encoding UTF8
    $text = $lines -join "`n"
    $nodeIssues = @()

    # YAML parse heuristic: reserved char at line start in plain scalar
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $ln = $lines[$i]
        if ($ln -match '^\s+[^:]+:\s*`') {
            $stats.yaml_errors += @{ path = $fullRel; error = "line $($i+1): plain scalar starts with backtick" }
            $nodeIssues += 'yaml: backtick scalar'
            break
        }
        if ($ln -match '^\s+[^:]+:\s*[^''"].*:.*[^''"]$' -and $ln -notmatch '^\s*#') {
            # possible unquoted colon in value - weak signal only for known patterns
            if ($ln -match ':\s*[a-z]+:\s') {
                $stats.yaml_errors += @{ path = $fullRel; error = "line $($i+1): possible unquoted colon in compact mapping" }
                $nodeIssues += 'yaml: compact mapping colon'
                break
            }
        }
    }

    foreach ($lk in $legacyKeys) {
        if ($text -match "(?m)^$lk\s*:") {
            $stats.legacy_keys += @{ path = $fullRel; key = $lk }
            $nodeIssues += "legacy key: $lk"
        }
    }
    if ($text -match '(?m)^status:\s*accepted\s*$') { $stats.status_accepted++ }
    if ($text -match '(?m)^release:\s*\{') { $stats.release_block++ }

    $sd = Get-ZhText (Extract-Block $lines 'short_definition')
    $df = Get-ZhText (Extract-Block $lines 'definition')
    $wn = Get-ZhText (Extract-Block $lines 'why_needed')
    $expl = Get-ZhText (Extract-Block $lines 'explanation')

    if (IsSimilar $sd $df) { $stats.def_same++; $nodeIssues += 'short_definition ~= definition' }
    if ([string]::IsNullOrWhiteSpace($wn) -or $wn.Length -lt 8) { $nodeIssues += 'why_needed missing/too short' }
    if ($text -notmatch '(?m)^\s{2}includes:\s*$') { $nodeIssues += 'includes empty/missing' }
    if ($text -notmatch '(?m)^\s{2}excludes:\s*$') { $nodeIssues += 'excludes empty/missing' }
    if ([string]::IsNullOrWhiteSpace($expl)) { $nodeIssues += 'engineering.explanation missing' }
    elseif ((IsSimilar $expl $df) -or (IsSimilar $expl $sd)) { $stats.eng_repeat++; $nodeIssues += 'engineering.explanation repeats definition' }

    if ($text -notmatch '(?m)^\s{2}typical_input:\s*$') { $nodeIssues += 'engineering.typical_input empty/missing' }
    if ($text -notmatch '(?m)^\s{2}typical_output:\s*$') { $nodeIssues += 'engineering.typical_output empty/missing' }
    if ($text -match $naPattern) {
        if ($text -match '(?m)typical_input:[\s\S]*?$naPattern' -or $text -match '(?m)typical_output:[\s\S]*?$naPattern') {
            $stats.na_io++
            $nodeIssues += 'typical I/O uses N/A placeholder'
        }
    }

    $foundKinds = @()
    foreach ($ek in $exampleKinds) {
        if ($text -match "(?m)^\s+- id:.*\n\s+kind:\s*$ek\s*$" -or $text -match "(?m)^\s+kind:\s*$ek\s*$") { $foundKinds += $ek }
    }
    $missingKinds = $exampleKinds | Where-Object { $_ -notin $foundKinds }
    if ($missingKinds.Count -gt 0) {
        $stats.example_kind_gaps++
        $nodeIssues += "missing example kinds: $($missingKinds -join ', ')"
    }

    if ($text -notmatch '(?m)^sources:\s*$') {
        $stats.missing_sources++
        $nodeIssues += 'sources empty/missing'
    }

    if ($nodeIssues.Count -gt 0) {
        $stats.nodes_with_issues++
        foreach ($ni in $nodeIssues) {
            $cat = ($ni -split ':')[0]
            if (-not $stats.issues_by_category.ContainsKey($cat)) { $stats.issues_by_category[$cat] = 0 }
            $stats.issues_by_category[$cat]++
        }
        $topIssues += @{ path = $fullRel; count = $nodeIssues.Count; issues = ($nodeIssues | Select-Object -First 8) }
    } else {
        $stats.nodes_pass_basic++
    }
}

try {
    Push-Location (Join-Path $root '..')
    $gitLines = git status --porcelain ontology 2>$null | Where-Object { $_ -match 'node\.yaml' }
    $stats.git_modified_node_yaml = @($gitLines).Count
    Pop-Location
} catch { $stats.git_modified_node_yaml = $null }

$result = [ordered]@{
    scanned_at = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')
    plane_counts = $planeCounts
    stats = $stats
    yaml_error_samples = @($stats.yaml_errors | Select-Object -First 10)
    top_issue_nodes = @($topIssues | Sort-Object { $_.count } -Descending | Select-Object -First 20)
}
$result | ConvertTo-Json -Depth 6
