param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
)

$ErrorActionPreference = 'Stop'
$DataPath = Join-Path $Root 'scripts\memory-lifecycle-example-descriptions.json'
$data = Get-Content -Raw -Path $DataPath -Encoding UTF8 | ConvertFrom-Json
$LifecycleDir = Join-Path $Root 'ontology\memory-plane\memory-lifecycle'
$TemplateNeedle = 'Mem0 client.add/update/delete API'

function Get-KindFromExampleId([string]$ExampleId) {
    if ($ExampleId -match 'counterexample') { return 'counterexample' }
    if ($ExampleId -match 'boundary') { return 'boundary' }
    if ($ExampleId -match 'instance') { return 'instance' }
    if ($ExampleId -match 'positive') { return 'positive' }
    return $null
}

function Get-Descriptions($Data, [string]$NodeId, [string]$Kind) {
    if (-not $Kind) { return $null }
    if ($Data.PSObject.Properties.Name -contains $NodeId) {
        $node = $Data.$NodeId
        if ($null -ne $node -and $node.PSObject.Properties.Name -contains $Kind) { return $node.$Kind }
    }
    if ($Data.PSObject.Properties.Name -contains 'memory-lifecycle') {
        $mod = $Data.'memory-lifecycle'
        if ($null -ne $mod -and $mod.PSObject.Properties.Name -contains $Kind) { return $mod.$Kind }
    }
    return $null
}

function Update-File([string]$Path, $Data) {
    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.AddRange([IO.File]::ReadAllLines($Path, [Text.Encoding]::UTF8))
    $nodeId = ($lines | Where-Object { $_ -match '^id: ' } | Select-Object -First 1) -replace '^id: ',''
    $nodeId = $nodeId.Trim()
    if (-not $nodeId) { return $false }

    $changed = $false
    $currentExampleId = $null
    $inDescriptions = $false
    $descStart = -1
    $descIndent = '    '

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match '^\s+- id: (.+)$') {
            $currentExampleId = $Matches[1].Trim()
            $inDescriptions = $false
            continue
        }
        if ($line -match '^(\s+)descriptions:\s*$') {
            $inDescriptions = $true
            $descStart = $i
            $descIndent = $Matches[1]
            continue
        }
        if ($line -match '^(\s+)descriptions:\s*\{') {
            $kind = Get-KindFromExampleId $currentExampleId
            $desc = Get-Descriptions -Data $Data -NodeId $nodeId -Kind $kind
            if ($desc -and ($line.Contains($TemplateNeedle))) {
                $zh = $desc.zh.Replace('"', '\"')
                $en = $desc.en.Replace('"', '\"')
                $ja = $desc.ja.Replace('"', '\"')
                $lines[$i] = "$($Matches[1])descriptions: {zh: `"$zh`", en: `"$en`", ja: `"$ja`"}"
                $changed = $true
            }
            continue
        }
        if ($inDescriptions -and $line -match '^(\s+)(zh|en|ja):\s*(.*)$') {
            $lang = $Matches[2]
            if ($lang -eq 'zh') {
                $kind = Get-KindFromExampleId $currentExampleId
                $desc = Get-Descriptions -Data $Data -NodeId $nodeId -Kind $kind
                if ($desc -and ($Matches[3].Contains($TemplateNeedle) -or $Matches[3].Contains('LangGraph checkpoint thread-scoped') -or $Matches[3].Contains('Cassandra tombstone'))) {
                    for ($j = $descStart + 1; $j -lt $lines.Count; $j++) {
                        if ($lines[$j] -match '^\s+(zh|en|ja):\s*') {
                            $l = $Matches[1]
                            $lines[$j] = "$descIndent  ${l}: $($desc.$l)"
                            $changed = $true
                        } elseif ($lines[$j] -match '^\s+\w' -and $lines[$j] -notmatch '^\s+(zh|en|ja):') {
                            break
                        }
                    }
                }
            }
            $inDescriptions = $false
        }
    }

    if ($changed) {
        [IO.File]::WriteAllLines($Path, $lines, (New-Object System.Text.UTF8Encoding $false))
    }
    return $changed
}

$updated = 0
Get-ChildItem -Path $LifecycleDir -Filter 'node.yaml' -Recurse | ForEach-Object {
    if (Update-File -Path $_.FullName -Data $data) {
        $updated++
        Write-Host $_.FullName
    }
}
Write-Host "Updated $updated files"
