# Parse runtime-plane-example-desc-overrides-part*.ps1 into JSON (text parse, no dot-source).
$ErrorActionPreference = 'Stop'

function Parse-SingleQuotedString([string]$Text, [ref]$Index) {
    while ($Index.Value -lt $Text.Length -and [char]::IsWhiteSpace($Text[$Index.Value])) { $Index.Value++ }
    if ($Index.Value -ge $Text.Length -or $Text[$Index.Value] -ne [char]"'") {
        throw "Expected opening quote at index $($Index.Value)"
    }
    $Index.Value++
    $sb = [System.Text.StringBuilder]::new()
    while ($Index.Value -lt $Text.Length) {
        if ($Text[$Index.Value] -eq [char]"'") {
            if ($Index.Value + 1 -lt $Text.Length -and $Text[$Index.Value + 1] -eq [char]"'") {
                [void]$sb.Append("'")
                $Index.Value += 2
                continue
            }
            $Index.Value++
            break
        }
        [void]$sb.Append($Text[$Index.Value])
        $Index.Value++
    }
    return $sb.ToString()
}

function Parse-SingleQuotedStrings([string]$Text) {
    $results = [System.Collections.Generic.List[string]]::new()
    $idx = [ref]0
    while ($idx.Value -lt $Text.Length) {
        while ($idx.Value -lt $Text.Length -and [char]::IsWhiteSpace($Text[$idx.Value])) { $idx.Value++ }
        if ($idx.Value -ge $Text.Length -or $Text[$idx.Value] -ne [char]"'") { break }
        $results.Add((Parse-SingleQuotedString $Text $idx)) | Out-Null
    }
    return $results
}

function Parse-HereDoc([string]$Text, [ref]$Index) {
    if (-not $Text.Substring($Index.Value).StartsWith("@'")) {
        throw "Expected @' at $($Index.Value)"
    }
    $Index.Value += 2
    $sb = [System.Text.StringBuilder]::new()
    while ($Index.Value -lt $Text.Length) {
        if ($Text[$Index.Value] -eq [char]"'" -and ($Index.Value + 1) -lt $Text.Length -and $Text[$Index.Value + 1] -eq '@') {
            $Index.Value += 2
            break
        }
        [void]$sb.Append($Text[$Index.Value])
        $Index.Value++
    }
    return $sb.ToString().TrimEnd("`r", "`n").TrimStart("`r", "`n")
}

function Parse-ThreeStrings([string]$Text) {
    $values = [System.Collections.Generic.List[string]]::new()
    $idx = [ref]0
    for ($n = 0; $n -lt 3; $n++) {
        while ($idx.Value -lt $Text.Length -and [char]::IsWhiteSpace($Text[$idx.Value])) { $idx.Value++ }
        if ($idx.Value -ge $Text.Length) { throw "Missing string part $n in: $($Text.Substring(0, [Math]::Min(80, $Text.Length)))" }
        if ($Text.Substring($idx.Value).StartsWith("@'")) {
            $values.Add((Parse-HereDoc $Text $idx)) | Out-Null
        } else {
            $values.Add((Parse-SingleQuotedString $Text $idx)) | Out-Null
        }
    }
    return @{ zh = $values[0]; en = $values[1]; ja = $values[2] }
}

function Parse-DLine([string]$Line) {
    $rest = ($Line -replace '^\s*D\s+', '')
    return Parse-ThreeStrings $rest
}

function Parse-PartFile([string]$Path) {
    $text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $labels = @{}
    $descs = @{}

    $labelMatches = [regex]::Matches($text, "\`$LabelOverrides\['([^']+)'\]\s*=\s*@\(([\s\S]*?)\r?\n\)")
    foreach ($m in $labelMatches) {
        $nodeId = $m.Groups[1].Value
        $body = $m.Groups[2].Value
        $items = [System.Collections.Generic.List[hashtable]]::new()
        foreach ($line in ($body -split '\r?\n')) {
            if ($line -notmatch '^\s*L\s+') { continue }
            $parts = Parse-SingleQuotedStrings (($line -replace '^\s*L\s+', '').Trim())
            $items.Add(@{ zh = $parts[0]; en = $parts[1]; ja = $parts[2] }) | Out-Null
        }
        $labels[$nodeId] = $items.ToArray()
    }

    $descMatches = [regex]::Matches($text, "\`$DescOverrides\['([^']+)'\]\s*=\s*@\(([\s\S]*?)\r?\n\)")
    foreach ($m in $descMatches) {
        $nodeId = $m.Groups[1].Value
        $body = $m.Groups[2].Value
        $items = [System.Collections.Generic.List[hashtable]]::new()
        $lines = $body -split '\r?\n'
        $i = 0
        while ($i -lt $lines.Count) {
            $line = $lines[$i]
            if ($line -notmatch '^\s*D\s+') { $i++; continue }
            if ($line -match "@'") {
                $chunk = ($line -replace '^\s*D\s+', '').Trim()
                $j = $i + 1
                while ($j -lt $lines.Count) {
                    $closeCount = ([regex]::Matches($chunk, "'@")).Count
                    if ($closeCount -ge 3) { break }
                    $chunk += "`n" + $lines[$j]
                    $j++
                }
                $fullLine = 'D ' + $chunk
                $items.Add((Parse-DLine $fullLine)) | Out-Null
                $i = $j
                continue
            }
            $items.Add((Parse-DLine $line)) | Out-Null
            $i++
        }
        $descs[$nodeId] = $items.ToArray()
    }

    return @{ labels = $labels; descs = $descs }
}

$allLabels = @{}
$allDescs = @{}
for ($n = 1; $n -le 5; $n++) {
    $path = Join-Path $PSScriptRoot "runtime-plane-example-desc-overrides-part$n.ps1"
    $parsed = Parse-PartFile -Path $path
    foreach ($k in $parsed.labels.Keys) { $allLabels[$k] = $parsed.labels[$k] }
    foreach ($k in $parsed.descs.Keys) { $allDescs[$k] = $parsed.descs[$k] }
}

$nodeIds = ($allLabels.Keys + $allDescs.Keys | Sort-Object -Unique)
$nodes = [System.Collections.Generic.List[object]]::new()
foreach ($id in $nodeIds) {
    $ls = if ($allLabels.ContainsKey($id)) { $allLabels[$id] } else { @() }
    $ds = if ($allDescs.ContainsKey($id)) { $allDescs[$id] } else { @() }
    $count = [Math]::Max($ls.Count, $ds.Count)
    $examples = [System.Collections.Generic.List[object]]::new()
    for ($i = 0; $i -lt $count; $i++) {
        $label = if ($i -lt $ls.Count) { $ls[$i] } else { @{ zh = $id; en = $id; ja = $id } }
        $desc = if ($i -lt $ds.Count) { $ds[$i] } else { @{ zh = $id; en = $id; ja = $id } }
        $examples.Add([ordered]@{
            labels = [ordered]@{ zh = $label.zh; en = $label.en; ja = $label.ja }
            descriptions = [ordered]@{ zh = $desc.zh; en = $desc.en; ja = $desc.ja }
        }) | Out-Null
    }
    $nodes.Add([ordered]@{ id = $id; examples = $examples.ToArray() }) | Out-Null
}

$out = [ordered]@{ nodes = $nodes.ToArray() }
$outPath = Join-Path $PSScriptRoot 'runtime-plane-example-overrides.json'
$json = $out | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText($outPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $($nodes.Count) nodes to $outPath"
foreach ($node in $nodes) {
    Write-Host "  $($node.id): $($node.examples.Count) examples"
}
