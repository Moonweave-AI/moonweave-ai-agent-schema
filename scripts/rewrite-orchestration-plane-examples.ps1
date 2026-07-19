# Rewrite orchestration-plane examples: remove taxonomy fields, replace template descriptions.
$ErrorActionPreference = "Stop"
$RepoRoot = (Join-Path $PSScriptRoot "..") | Resolve-Path
$OrchRoot = Join-Path $RepoRoot "ontology/orchestration-plane"
$RealExamplesPath = Join-Path $PSScriptRoot "orchestration-real-examples.json"
$CounterPath = Join-Path $PSScriptRoot "orch-delegation-eval-planning-counterexamples.json"
$StacksPath = Join-Path $PSScriptRoot "orchestration-plane-example-stacks.json"
$TemplatesPath = Join-Path $PSScriptRoot "orchestration-plane-example-templates.json"

$realData = Get-Content $RealExamplesPath -Raw -Encoding UTF8 | ConvertFrom-Json
$exampleMap = @{}
$realData.examples.PSObject.Properties | ForEach-Object { $exampleMap[$_.Name] = $_.Value }
$defaults = @{
    positive = $realData.defaults.positive
    boundary = $realData.defaults.boundary
    counterexample = $realData.defaults.counterexample
    instance = $realData.defaults.instance
}

$counterMap = @{}
if (Test-Path $CounterPath) {
    $counterData = Get-Content $CounterPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $counterData.PSObject.Properties | ForEach-Object { $counterMap[$_.Name] = $_.Value }
}

$stackData = Get-Content $StacksPath -Raw -Encoding UTF8 | ConvertFrom-Json
$moduleStacks = @{}
$stackData.PSObject.Properties | ForEach-Object { $moduleStacks[$_.Name] = @($_.Value) }

$templateData = Get-Content $TemplatesPath -Raw -Encoding UTF8 | ConvertFrom-Json
$templateSubstrings = @($templateData.template_substrings)

function Test-TemplateText([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return $true }
    foreach ($p in $templateSubstrings) {
        if ($Text.Contains($p)) { return $true }
    }
    if ($Text.Length -lt 40) { return $true }
    return $false
}

function Get-ModuleFromPath([string]$RelPath) {
    $parts = ($RelPath -replace "\\", "/") -split "/"
    if ($parts[0] -eq "node.yaml") { return "orchestration-plane" }
    return $parts[0]
}

function Resolve-RealExample([string]$Module, [string]$NodeId, [string]$Slot) {
    foreach ($k in @("$Module|$NodeId|$Slot", "$Module|*|$Slot")) {
        if ($exampleMap.ContainsKey($k)) { return $exampleMap[$k] }
    }
    if ($defaults.ContainsKey($Slot)) { return $defaults[$Slot] }
    return $null
}

function Get-NodeMeta([string]$FullPath) {
    $lines = Get-Content $FullPath -Encoding UTF8
    $nodeId = "Unknown"
    foreach ($line in $lines) {
        if ($line -match "^id:\s*(\S+)") { $nodeId = $Matches[1]; break }
    }

    $claims = New-Object System.Collections.Generic.List[string]
    $inClaims = $false
    foreach ($line in $lines) {
        if ($line -match "^source_claims:") { $inClaims = $true; continue }
        if ($inClaims -and $line -match "^\S" -and $line -notmatch "^\s") { break }
        if ($inClaims -and $line -match "^\s+-\s+id:\s+(\S+)") { $claims.Add($Matches[1]) | Out-Null }
        elseif ($inClaims -and $line -match "^\s+-\s+(\S+)") { $claims.Add($Matches[1]) | Out-Null }
    }
    if ($claims.Count -eq 0) { $claims.Add("claim-local-example") | Out-Null }

    $fieldExamples = @{}
    $inFields = $false
    $curField = $null
    foreach ($line in $lines) {
        if ($line -match "^\s+fields:") { $inFields = $true; continue }
        if ($inFields -and $line -match "^\s+constraints:") { break }
        if ($inFields -and $line -match "^\s+- id:\s+(\S+)") { $curField = $Matches[1]; continue }
        if ($inFields -and $curField -and $line -match "^\s+example_value:\s*(.+)$") {
            $fieldExamples[$curField] = $Matches[1].Trim()
        }
    }

    return @{ NodeId = $nodeId; Claims = $claims; FieldExamples = $fieldExamples }
}

function Get-Stacks([string]$Module) {
    if ($moduleStacks.ContainsKey($Module)) { return $moduleStacks[$Module] }
    if ($moduleStacks.ContainsKey("orchestration-plane")) { return $moduleStacks["orchestration-plane"] }
    return @()
}

function Infer-ExampleSlot([string]$ExampleId, [string]$ZhDesc) {
    if ($ExampleId -match "counter|confus|reject|mislabel|spec-only|invalid|not-") { return "counterexample" }
    if ($ExampleId -match "boundary|border|wire|sdk|runner|a2a-task") { return "boundary" }
    if ($ExampleId -match "instance|concrete") { return "instance" }
    if ($ExampleId -match "completed|working|positive") { return "positive" }
    if ($ZhDesc -match "A2A wire|wire object|SDK runtime|Real product API|LangGraph conditional|reusable orchestration|Moonweave projects them to|runtime handler persists via Moonweave adapter") { return "counterexample" }
    return "instance"
}

function Get-CounterConfusion([string]$NodeId) {
    if ($NodeId -match "^A2A") {
        return "OpenAI RunResult JSON lacks A2A Task required id/status/history nested Message shape"
    }
    if ($NodeId -match "Task(Plan|Step|Dependency)?$") {
        return "A2A wire Task only has TASK_STATE_WORKING and task id without work_specification_ref or TaskCompletionCriterion"
    }
    if ($NodeId -match "Handoff|Delegation|Worker") {
        return "Single tools.call(name=search) has no source_actor/target_actor control-transfer record"
    }
    if ($NodeId -match "Routing|Route|Gate") {
        return "RoutingPolicy YAML snippet lacks selected_target or native_return_ref runtime decision fields"
    }
    if ($NodeId -match "Composition|Parallel|Chain|Vote|Synthesis") {
        return "CompositionActivity run log only has started_at without composition_specification_id or control_shape"
    }
    if ($NodeId -match "Evaluation|Improvement|Revision") {
        return "LangSmith trace span only has latency_ms without activity_id/feedback_ref PROV activity boundary"
    }
    if ($NodeId -match "Orchestrator|WorkerRole|Subagent|Ownership") {
        return "CrewAI Agent JSON only has role/goal without coordination_role_id or ownership_scope"
    }
    return "Confusable object lacks $NodeId identity_keys and module boundary fields"
}

function Build-ReplacementDescriptions {
    param(
        [string]$Module,
        [string]$NodeId,
        [hashtable]$Meta,
        [string]$Slot,
        [int]$Index
    )

    $real = Resolve-RealExample -Module $Module -NodeId $NodeId -Slot $Slot
    if ($real -and -not (Test-TemplateText $real.zh)) {
        return @{ zh = $real.zh; en = $real.en; ja = $real.ja }
    }

    if ($Slot -eq "counterexample" -and $counterMap.ContainsKey($NodeId)) {
        $ce = $counterMap[$NodeId]
        if ($ce.descriptions.zh -and -not (Test-TemplateText $ce.descriptions.zh)) {
            return @{ zh = $ce.descriptions.zh; en = $ce.descriptions.en; ja = $ce.descriptions.ja }
        }
    }

    $stacks = Get-Stacks $Module
    if ($stacks.Count -eq 0) { $stacks = Get-Stacks "orchestration-plane" }
    $stack = $stacks[$Index % $stacks.Count]

    if ($Slot -eq "boundary") {
        return @{
            zh = "$($stack.name) 运行时 $($stack.api) 返回 RunResult.final_output 或 Task.status.state 等产品字段；Moonweave 将其投影为 $NodeId 时保留 identity_keys，不以 wire JSON 覆盖规范身份。"
            en = "$($stack.name) runtime $($stack.api) returns product fields like RunResult.final_output or Task.status.state; Moonweave projects to $NodeId preserving identity_keys without wire JSON overwrite."
            ja = "$($stack.name) runtime $($stack.api) の product field を $NodeId に投影し identity_keys を wire JSON 上書きなく保持。"
        }
    }

    if ($Slot -eq "counterexample") {
        $confuse = Get-CounterConfusion $NodeId
        return @{
            zh = "$confuse，应拒绝将 wire/runtime 对象直接分类为 $NodeId。"
            en = "$confuse; reject classifying the wire/runtime object directly as $NodeId."
            ja = "$confuse; wire/runtime object を $NodeId として分類拒否。"
        }
    }

    if ($Slot -eq "instance") {
        if ($Meta.FieldExamples.Count -gt 0) {
            $pairs = ($Meta.FieldExamples.GetEnumerator() | Select-Object -First 4 | ForEach-Object { "$($_.Key): $($_.Value)" }) -join "; "
        } else {
            $pairs = "${NodeId}_ref: ${NodeId}-instance-1"
        }
        return @{
            zh = "$($stack.name) 通过 $($stack.api) 产生可引用 $NodeId 实例（$pairs）；例如 await Runner.run(agent) 或 graph.invoke(state) 后由 Moonweave adapter 写入审计存储。"
            en = "$($stack.name) via $($stack.api) yields referenceable $NodeId instance ($pairs); e.g. after await Runner.run(agent) or graph.invoke(state) persisted by Moonweave adapter."
            ja = "$($stack.name) $($stack.api) が参照可能な $NodeId 实例 ($pairs) を生成し Moonweave adapter で永続化。"
        }
    }

    $desc = @{ zh = $stack.zh; en = $stack.en; ja = $stack.ja }
    if ($Meta.FieldExamples.Count -gt 0) {
        $pairs = ($Meta.FieldExamples.GetEnumerator() | Select-Object -First 3 | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ", "
        $desc.zh = "$($desc.zh) Moonweave fields: $pairs."
        $desc.en = "$($desc.en) Moonweave fields: $pairs."
        $desc.ja = "$($desc.ja) Moonweave fields: $pairs."
    }
    return $desc
}

function Format-YamlValue($val) {
    if ($null -eq $val) { return "null" }
    $s = [string]$val
    $simple = ($s -match "^[A-Za-z0-9_.:-]+$")
    if ($simple -or $s.StartsWith("{") -or $s.StartsWith("[")) { return $s }
    $q = [char]34
    return ($q + $s.Replace([string]$q, "\" + [string]$q) + $q)
}

function To-Slug([string]$NodeId) {
    $sb = New-Object System.Text.StringBuilder
    for ($i = 0; $i -lt $NodeId.Length; $i++) {
        $c = $NodeId[$i]
        if ([char]::IsUpper($c) -and $i -gt 0) { [void]$sb.Append("-") }
        [void]$sb.Append([char]::ToLower($c))
    }
    return $sb.ToString()
}

function Rewrite-NodeFile([string]$FullPath) {
    $rel = $FullPath.Substring($OrchRoot.Path.Length + 1)
    $module = Get-ModuleFromPath $rel
    $meta = Get-NodeMeta $FullPath
    $nodeId = $meta.NodeId
    $lines = Get-Content $FullPath -Encoding UTF8

    $examplesStart = -1
    for ($k = 0; $k -lt $lines.Count; $k++) {
        if ($lines[$k] -eq "examples:") { $examplesStart = $k; break }
    }
    if ($examplesStart -lt 0) { return $false }

    $anchorIdx = $lines.Count
    foreach ($key in @("parent_relation", "sources", "source_claims", "relations")) {
        $idx = [array]::IndexOf($lines, "${key}:")
        if ($idx -ge 0 -and $idx -lt $anchorIdx) { $anchorIdx = $idx }
    }

    $parsedExamples = New-Object System.Collections.Generic.List[hashtable]
    $i = $examplesStart + 1
    while ($i -lt $anchorIdx) {
        if ($lines[$i] -match "^  - id:\s*(.+)$") {
            $ex = @{
                id = $Matches[1].Trim()
                labels = @{ zh = ""; en = ""; ja = "" }
                descriptions = @{ zh = ""; en = ""; ja = "" }
                field_values = [ordered]@{}
                related_node_ids = New-Object System.Collections.Generic.List[string]
                related_relation_ids = New-Object System.Collections.Generic.List[string]
                source_claims = New-Object System.Collections.Generic.List[string]
            }
            $i++
            while ($i -lt $anchorIdx -and $lines[$i] -notmatch "^  - id:") {
                $line = $lines[$i]
                if ($line -match "^\s{4}(kind|scenario_id|verified_version|synthetic|expected_result|why_valid_or_invalid|example_source):") {
                    if ($line -match "^\s{4}(expected_result|why_valid_or_invalid|example_source):") {
                        $i++
                        while ($i -lt $anchorIdx -and $lines[$i] -match "^\s{6}\S") { $i++ }
                    }
                    $i++; continue
                }
                if ($line -like "    labels: {*" -and $line.EndsWith("}")) {
                    $inner = $line.Substring(13).Trim().TrimEnd("}")
                    foreach ($part in ($inner -split ",")) {
                        if ($part -match "zh:\s*(.+)$") { $ex.labels.zh = $Matches[1].Trim().Trim('"') }
                        if ($part -match "en:\s*(.+)$") { $ex.labels.en = $Matches[1].Trim().Trim('"') }
                        if ($part -match "ja:\s*(.+)$") { $ex.labels.ja = $Matches[1].Trim().Trim('"') }
                    }
                }
                elseif ($line -match "^\s{4}labels:\s*$") {
                    $i++
                    while ($i -lt $anchorIdx -and $lines[$i] -match "^\s{6}(zh|en|ja):") {
                        if ($lines[$i] -match "^\s{6}zh:\s*(.+)$") { $ex.labels.zh = $Matches[1].Trim().Trim('"') }
                        if ($lines[$i] -match "^\s{6}en:\s*(.+)$") { $ex.labels.en = $Matches[1].Trim().Trim('"') }
                        if ($lines[$i] -match "^\s{6}ja:\s*(.+)$") { $ex.labels.ja = $Matches[1].Trim().Trim('"') }
                        $i++
                    }
                    continue
                }
                elseif ($line -like "    descriptions: {*" -and $line.EndsWith("}")) {
                    $inner = $line.Substring(19).Trim().TrimEnd("}")
                    foreach ($part in ($inner -split ",")) {
                        if ($part -match "zh:\s*(.+)$") { $ex.descriptions.zh = $Matches[1].Trim().Trim('"') }
                        if ($part -match "en:\s*(.+)$") { $ex.descriptions.en = $Matches[1].Trim().Trim('"') }
                        if ($part -match "ja:\s*(.+)$") { $ex.descriptions.ja = $Matches[1].Trim().Trim('"') }
                    }
                }
                elseif ($line -match "^\s{4}descriptions:\s*$") {
                    $i++
                    while ($i -lt $anchorIdx -and $lines[$i] -match "^\s{6}(zh|en|ja):") {
                        if ($lines[$i] -match "^\s{6}zh:\s*(.+)$") { $ex.descriptions.zh = $Matches[1].Trim().Trim('"') }
                        if ($lines[$i] -match "^\s{6}en:\s*(.+)$") { $ex.descriptions.en = $Matches[1].Trim().Trim('"') }
                        if ($lines[$i] -match "^\s{6}ja:\s*(.+)$") { $ex.descriptions.ja = $Matches[1].Trim().Trim('"') }
                        $i++
                    }
                    continue
                }
                elseif ($line -like "    field_values: {*" -and $line.EndsWith("}")) {
                    $inner = $line.Substring(18).Trim()
                    if ($inner.StartsWith("{")) { $inner = $inner.Substring(1) }
                    if ($inner.EndsWith("}")) { $inner = $inner.Substring(0, $inner.Length - 1) }
                    foreach ($part in ($inner -split ",(?=(?:[^`"]*`"[^`"]*`")*[^`"]*$)")) {
                        if ($part -match "^\s*(\S+):\s*(.+)\s*$") {
                            $key = $Matches[1].Trim().TrimStart("{")
                            $ex.field_values[$key] = $Matches[2].Trim().Trim('"')
                        }
                    }
                }
                elseif ($line -match "^\s{4}field_values:\s*$") {
                    $i++
                    while ($i -lt $anchorIdx -and $lines[$i] -match "^\s{6}\S") {
                        if ($lines[$i] -match "^\s{6}(\S+):\s*(.+)\s*$") {
                            $ex.field_values[$Matches[1]] = $Matches[2].Trim().Trim('"')
                        }
                        $i++
                    }
                    continue
                }
                elseif ($line -match "^\s{4}related_node_ids:\s*\[(.+)\]\s*$") {
                    foreach ($n in ($Matches[1] -split ",")) { $ex.related_node_ids.Add($n.Trim()) | Out-Null }
                }
                elseif ($line -match "^\s{4}related_node_ids:\s*$") {
                    $i++
                    while ($i -lt $anchorIdx -and $lines[$i] -match "^\s{6}-\s+(\S+)") {
                        $ex.related_node_ids.Add($Matches[1]) | Out-Null; $i++
                    }
                    continue
                }
                elseif ($line -match "^\s{4}related_relation_ids:\s*\[(.*)\]\s*$") {
                    if ($Matches[1].Trim()) {
                        foreach ($n in ($Matches[1] -split ",")) { $ex.related_relation_ids.Add($n.Trim()) | Out-Null }
                    }
                }
                elseif ($line -match "^\s{4}related_relation_ids:\s*$") {
                    $i++
                    while ($i -lt $anchorIdx -and $lines[$i] -match "^\s{6}-\s+(\S+)") {
                        $ex.related_relation_ids.Add($Matches[1]) | Out-Null; $i++
                    }
                    continue
                }
                elseif ($line -match "^\s{4}source_claims:\s*\[(.+)\]\s*$") {
                    foreach ($c in ($Matches[1] -split ",")) { $ex.source_claims.Add($c.Trim()) | Out-Null }
                }
                elseif ($line -match "^\s{4}source_claims:\s*$") {
                    $i++
                    while ($i -lt $anchorIdx -and $lines[$i] -match "^\s{6}-\s+(\S+)") {
                        $ex.source_claims.Add($Matches[1]) | Out-Null; $i++
                    }
                    continue
                }
                $i++
            }
            if ($ex.related_node_ids.Count -eq 0) { $ex.related_node_ids.Add($nodeId) | Out-Null }
            if ($ex.source_claims.Count -eq 0) { $ex.source_claims.Add($meta.Claims[0]) | Out-Null }
            $parsedExamples.Add($ex) | Out-Null
            continue
        }
        $i++
    }

    $slotIdx = 0
    foreach ($ex in $parsedExamples) {
        $slot = Infer-ExampleSlot $ex.id $ex.descriptions.zh
        if ((Test-TemplateText $ex.descriptions.zh) -or (Test-TemplateText $ex.descriptions.en)) {
            $repl = Build-ReplacementDescriptions -Module $module -NodeId $nodeId -Meta $meta -Slot $slot -Index $slotIdx
            $ex.descriptions.zh = $repl.zh
            $ex.descriptions.en = $repl.en
            $ex.descriptions.ja = $repl.ja
        }
        $slotIdx++
    }

    while ($parsedExamples.Count -lt 3) {
        $slotIdx = $parsedExamples.Count
        $slots = @("positive", "boundary", "counterexample", "instance")
        $slot = $slots[$slotIdx % $slots.Count]
        $repl = Build-ReplacementDescriptions -Module $module -NodeId $nodeId -Meta $meta -Slot $slot -Index $slotIdx
        $stacks = Get-Stacks $module
        $stack = $stacks[$slotIdx % $stacks.Count]
        $slug = To-Slug $nodeId
        $parsedExamples.Add(@{
            id = "$slug-$slot-$slotIdx"
            labels = @{
                zh = "$nodeId $($stack.name) case"
                en = "$nodeId $($stack.name) case"
                ja = "$nodeId $($stack.name) case"
            }
            descriptions = $repl
            field_values = [ordered]@{ source = $stack.name; api = $stack.api }
            related_node_ids = New-Object System.Collections.Generic.List[string] @($nodeId)
            related_relation_ids = New-Object System.Collections.Generic.List[string]
            source_claims = New-Object System.Collections.Generic.List[string] @($meta.Claims[0])
        }) | Out-Null
    }
    if ($parsedExamples.Count -gt 5) {
        $trimmed = @($parsedExamples | Select-Object -First 5)
        $parsedExamples = New-Object System.Collections.Generic.List[hashtable] (, $trimmed)
    }

    $out = New-Object System.Collections.Generic.List[string]
    $out.Add("examples:") | Out-Null
    foreach ($ex in $parsedExamples) {
        $out.Add("  - id: $($ex.id)") | Out-Null
        $out.Add("    labels:") | Out-Null
        $out.Add("      zh: $($ex.labels.zh)") | Out-Null
        $out.Add("      en: $($ex.labels.en)") | Out-Null
        $out.Add("      ja: $($ex.labels.ja)") | Out-Null
        $out.Add("    descriptions:") | Out-Null
        $out.Add("      zh: $($ex.descriptions.zh)") | Out-Null
        $out.Add("      en: $($ex.descriptions.en)") | Out-Null
        $out.Add("      ja: $($ex.descriptions.ja)") | Out-Null
        if ($ex.field_values.Count -gt 0) {
            $fvParts = @()
            foreach ($k in $ex.field_values.Keys) {
                $fvParts += ("{0}: {1}" -f $k, (Format-YamlValue $ex.field_values[$k]))
            }
            $out.Add(("    field_values: {" + ($fvParts -join ", ") + "}")) | Out-Null
        } else {
            $out.Add("    field_values: {}") | Out-Null
        }
        $out.Add("    related_node_ids:") | Out-Null
        foreach ($n in ($ex.related_node_ids | Select-Object -Unique)) {
            $out.Add("      - $n") | Out-Null
        }
        if ($ex.related_relation_ids.Count -gt 0) {
            $out.Add("    related_relation_ids:") | Out-Null
            foreach ($r in $ex.related_relation_ids) { $out.Add("      - $r") | Out-Null }
        } else {
            $out.Add("    related_relation_ids: []") | Out-Null
        }
        $out.Add("    source_claims:") | Out-Null
        foreach ($c in ($ex.source_claims | Select-Object -Unique)) {
            $out.Add("      - $c") | Out-Null
        }
        $out.Add("") | Out-Null
    }

    $newLines = New-Object System.Collections.Generic.List[string]
    for ($j = 0; $j -lt $examplesStart; $j++) { $newLines.Add($lines[$j]) | Out-Null }
    foreach ($l in $out) { $newLines.Add($l) | Out-Null }
    for ($j = $anchorIdx; $j -lt $lines.Count; $j++) { $newLines.Add($lines[$j]) | Out-Null }

    [System.IO.File]::WriteAllLines($FullPath, $newLines, (New-Object System.Text.UTF8Encoding $false))
    return $true
}

$updated = 0
Get-ChildItem -Path $OrchRoot -Filter "node.yaml" -Recurse | ForEach-Object {
    if (Rewrite-NodeFile -FullPath $_.FullName) {
        $updated++
        $rel = $_.FullName.Substring($OrchRoot.Path.Length + 1)
        Write-Host "Rewrote $rel"
    }
}

Write-Host "Done. Rewrote $updated node.yaml files under orchestration-plane."
