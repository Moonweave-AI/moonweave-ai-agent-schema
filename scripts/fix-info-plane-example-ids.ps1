param(
    [string]$PlaneDir = (Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) 'ontology\info-plane')
)

$ErrorActionPreference = 'Stop'
$PlaneDir = (Resolve-Path $PlaneDir).Path

function Slugify([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return 'case' }
    $s = $Text.ToLowerInvariant()
    $s = $s -replace '[^a-z0-9]+', '-'
    $s = $s.Trim('-')
    if ($s.Length -gt 48) { $s = $s.Substring(0, 48).Trim('-') }
    if ([string]::IsNullOrWhiteSpace($s)) { return 'case' }
    return $s
}

function Fix-File([string]$Path) {
    $text = [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)
    if ($text -notmatch '(?m)^id:\s*(.+)$') { return $false }
    $nodeId = $Matches[1].Trim()
    $nodeSlug = ($nodeId.ToLowerInvariant() -replace '([a-z])([A-Z])', '$1-$2').ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $nodeSlug = $nodeSlug.Trim('-')

    if ($text -notmatch '(?ms)^examples:\r?\n(.*?)(?=^(?:parent_relation|sources|source_claims|relations):|\z)') { return $false }

    $section = $Matches[1]
    $blocks = [regex]::Split($section, '(?=^  - id: )')
    $used = @{}
    $newBlocks = @()
    $changed = $false

    foreach ($block in $blocks) {
        if ($block -notmatch '(?m)^  - id:\s*(.+)$') { continue }
        $oldId = $Matches[1].Trim()

        $labelEn = $null
        if ($block -match '(?m)^      en:\s*(.+)$') { $labelEn = $Matches[1].Trim() }
        elseif ($block -match 'labels:\s*\{[^}]*en:\s*([^,}]+)') { $labelEn = $Matches[1].Trim() }

        $baseId = if ($oldId -and $oldId -ne $nodeSlug -and $oldId -ne 'instruction' -and $oldId -ne 'message' -and $oldId -ne 'content-part') {
            $oldId
        } else {
            $nodeSlug + '-' + (Slugify $labelEn)
        }

        $newId = $baseId
        $n = 2
        while ($used.ContainsKey($newId)) {
            $newId = "$baseId-$n"
            $n++
        }
        $used[$newId] = $true

        if ($newId -ne $oldId) {
            $block = [regex]::Replace($block, '(?m)^  - id:\s*.+$', "  - id: $newId", 1)
            $changed = $true
        }
        $newBlocks += $block.TrimEnd()
    }

    if (-not $changed) { return $false }

    $newSection = "examples:`n" + ($newBlocks -join "`n`n") + "`n"
    $newText = [regex]::Replace($text, '(?ms)^examples:\r?\n.*?(?=^(?:parent_relation|sources|source_claims|relations):|\z)', $newSection, 1)
    [IO.File]::WriteAllText($Path, $newText, (New-Object Text.UTF8Encoding $false))
    return $true
}

$fixed = 0
Get-ChildItem -Path $PlaneDir -Filter 'node.yaml' -Recurse | ForEach-Object {
    if (Fix-File -Path $_.FullName) {
        $fixed++
        Write-Host $_.FullName.Substring($PlaneDir.Length + 1)
    }
}

Write-Host "Fixed duplicate example ids in $fixed files"
