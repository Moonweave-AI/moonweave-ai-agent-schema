# Apply handcrafted counterexample + instance to delegation-handoff, evaluation, task-planning
$ErrorActionPreference = 'Stop'
$RepoRoot = (Join-Path $PSScriptRoot '..') | Resolve-Path
$OrchRoot = Join-Path $RepoRoot 'ontology/orchestration-plane'
$DataPath = Join-Path $PSScriptRoot 'orch-delegation-eval-planning-counterexamples.json'
$Counterexamples = Get-Content $DataPath -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-ClaimFromContent([string]$Content) {
    $lines = $Content -split "`r?`n"
    $inPositive = $false
    $inClaims = $false
    foreach ($line in $lines) {
        if ($line -match '^\s+kind:\s+positive\s*$') { $inPositive = $true; continue }
        if ($inPositive -and -not $inClaims -and $line -match '^\s+kind:\s+(?!positive)') { break }
        if ($inPositive -and $line -match '^\s+source_claims:\s*$') { $inClaims = $true; continue }
        if ($inClaims -and $line -match '^\s+-\s+(claim-[a-z0-9-]+-\d+)\s*$') { return $Matches[1] }
        if ($inClaims -and $line -match '^\s+\S') { break }
    }
    if ($Content -match 'claim-[a-z0-9-]+-\d+') { return $Matches[0] }
    return 'claim-local-boundary'
}

function Get-PositiveFieldValues([string]$Content) {
    $lines = $Content -split "`r?`n"
    $inPositive = $false
    $inFields = $false
    $result = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $lines) {
        if ($line -match '^\s+kind:\s+positive\s*$') {
            $inPositive = $true
            $inFields = $false
            continue
        }
        if ($inPositive -and -not $inFields -and $line -match '^\s+kind:\s+(?!positive)') { break }
        if ($inPositive -and $line -match '^\s+field_values:\s*$') { $inFields = $true; continue }
        if ($inFields) {
            if ($line -match '^\s+related_node_ids:\s*$') { break }
            $result.Add($line)
        }
    }
    if ($result.Count -eq 0) { return '      instance_marker: true' }
    return ($result -join "`n")
}

function Get-RelatedNodes([string]$Content, [string]$NodeId) {
    $lines = $Content -split "`r?`n"
    $inPositive = $false
    $inRelated = $false
    $nodes = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $lines) {
        if ($line -match '^\s+kind:\s+positive\s*$') {
            $inPositive = $true
            $inRelated = $false
            continue
        }
        if ($inPositive -and -not $inRelated -and $line -match '^\s+kind:\s+(?!positive)') { break }
        if ($inPositive -and $line -match '^\s+related_node_ids:\s*$') { $inRelated = $true; continue }
        if ($inRelated) {
            if ($line -match '^\s+related_relation_ids:') { break }
            if ($line -match '^\s+-\s+(\S+)\s*$' -and $Matches[1] -notmatch '^claim-') { $nodes.Add($Matches[1]) }
        }
    }
    if ($nodes -notcontains $NodeId) { $nodes.Insert(0, $NodeId) }
    return ($nodes | Select-Object -Unique)
}

function FieldValuesToYaml($FvObj) {
    $lines = @()
    foreach ($prop in $FvObj.PSObject.Properties) {
        $val = $prop.Value
        if ($val -is [System.Array]) {
            $lines += "      $($prop.Name):"
            foreach ($item in $val) { $lines += "        - $item" }
        } else {
            $lines += "      $($prop.Name): $val"
        }
    }
    return ($lines -join "`n")
}

function Build-CounterYaml($NodeId, $Claim, $Ce, $Related) {
    $relatedYaml = ($Related | ForEach-Object { "      - $_" }) -join "`n"
    $fvYaml = FieldValuesToYaml $Ce.field_values
    @"
  - id: ${NodeId}-example-counterexample-confusable
    kind: counterexample
    labels:
      zh: $($Ce.labels.zh)
      en: $($Ce.labels.en)
      ja: $($Ce.labels.ja)
    scenario_id: null
    descriptions:
      zh: $($Ce.descriptions.zh)
      en: $($Ce.descriptions.en)
      ja: $($Ce.descriptions.ja)
    field_values:
$fvYaml
    related_node_ids:
$relatedYaml
    related_relation_ids: []
    expected_result:
      zh: $($Ce.expected.zh)
      en: $($Ce.expected.en)
      ja: $($Ce.expected.ja)
    why_valid_or_invalid:
      zh: $($Ce.why.zh)
      en: $($Ce.why.en)
      ja: $($Ce.why.ja)
    synthetic: true
    verified_version: https://moonweave.ai/ontology/agent-system/2.0.0/
    source_claims:
      - $Claim
"@
}

function Build-InstanceYaml($NodeId, $Claim, $FieldBlock, $Related, $PositiveDesc) {
    $relatedYaml = ($Related | ForEach-Object { "      - $_" }) -join "`n"
    $descZh = "Positive field_values form a referenceable $NodeId instance."
    $descEn = "Positive field_values form a referenceable $NodeId instance."
    $descJa = "Positive field_values form a referenceable $NodeId instance."
    if ($PositiveDesc) {
        $descEn = "Concrete instance from positive scenario: $PositiveDesc"
    }
    @"
  - id: ${NodeId}-example-instance-concrete
    kind: instance
    labels:
      zh: ${NodeId} concrete instance
      en: ${NodeId} concrete instance
      ja: ${NodeId} concrete instance
    scenario_id: null
    descriptions:
      zh: $descZh
      en: $descEn
      ja: $descJa
    field_values:
$FieldBlock
    related_node_ids:
$relatedYaml
    related_relation_ids: []
    expected_result:
      zh: Accept as $NodeId instance.
      en: Accept as $NodeId instance.
      ja: Accept as $NodeId instance.
    why_valid_or_invalid:
      zh: Fields match the positive case and satisfy $NodeId identity for runtime reference.
      en: Fields match the positive case and satisfy $NodeId identity for runtime reference.
      ja: Fields match the positive case and satisfy $NodeId identity for runtime reference.
    synthetic: true
    verified_version: https://moonweave.ai/ontology/agent-system/2.0.0/
    source_claims:
      - $Claim
"@
}

function Insert-Examples([string]$FilePath, [string]$Block) {
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    foreach ($key in @('parent_relation', 'sources', 'source_claims')) {
        if ($content -match "(?m)^$key`:") {
            $content = [regex]::Replace($content, "(?m)^$key`:", ($Block.TrimEnd() + "`r`n$key`:"), 1)
            [System.IO.File]::WriteAllText($FilePath, $content, [System.Text.UTF8Encoding]::new($false))
            return
        }
    }
    if ($content -notmatch '\r?\n$') { $content += "`r`n" }
    [System.IO.File]::WriteAllText($FilePath, ($content + $Block), [System.Text.UTF8Encoding]::new($false))
}

$modules = @('orchestration-delegation-handoff', 'orchestration-evaluation', 'orchestration-task-planning')
$patched = 0
$skipped = 0

foreach ($mod in $modules) {
    Get-ChildItem (Join-Path $OrchRoot $mod) -Recurse -Filter node.yaml | Sort-Object FullName | ForEach-Object {
        $content = Get-Content $_.FullName -Raw -Encoding UTF8
        $hasCE = $content -match '(?m)^\s+kind:\s+counterexample\s*$'
        $hasInst = $content -match '(?m)^\s+kind:\s+instance\s*$'
        if ($hasCE -and $hasInst) { $skipped++; return }

        if ($content -notmatch '(?m)^id:\s*(\S+)') { Write-Warning "No id in $($_.FullName)"; return }
        $nodeId = $Matches[1]
        $ceProp = $Counterexamples.PSObject.Properties | Where-Object { $_.Name -eq $nodeId }
        if (-not $ceProp) { Write-Warning "No counterexample map for $nodeId"; return }
        $ce = $ceProp.Value

        $claim = Get-ClaimFromContent $content
        $related = Get-RelatedNodes $content $nodeId
        $ceRelated = @($ce.related) + $related | Select-Object -Unique

        $positiveDesc = $null
        $lines = $content -split "`r?`n"
        $inPositive = $false
        foreach ($line in $lines) {
            if ($line -match '^\s+kind:\s+positive\s*$') { $inPositive = $true; continue }
            if ($inPositive -and $line -match '^\s+en:\s*(.+)\s*$') { $positiveDesc = $Matches[1].Trim(); break }
            if ($inPositive -and $line -match '^\s+kind:\s+(?!positive)') { break }
        }

        $blocks = @()
        if (-not $hasCE) { $blocks += (Build-CounterYaml $nodeId $claim $ce $ceRelated) }
        if (-not $hasInst) {
            $fv = Get-PositiveFieldValues $content
            $blocks += (Build-InstanceYaml $nodeId $claim $fv $related $positiveDesc)
        }
        if ($blocks.Count -eq 0) { $skipped++; return }

        Insert-Examples $_.FullName ($blocks -join "`n")
        Write-Host "Patched $nodeId"
        $patched++
    }
}

Write-Host "Done. Patched=$patched Skipped=$skipped"
