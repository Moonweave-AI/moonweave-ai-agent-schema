$ErrorActionPreference = 'Continue'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $scriptDir 'out\safety-plane'
$dst = Join-Path (Join-Path $scriptDir '..') 'ontology\safety-plane'
$ok = 0; $fail = 0
Get-ChildItem $src -Recurse -Filter node.yaml | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length + 1)
  $target = Join-Path $dst $rel
  $dir = Split-Path -Parent $target
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  try {
    Copy-Item $_.FullName $target -Force -ErrorAction Stop
    $ok++
  } catch {
    $fail++
    Write-Warning "Skip $rel : $_"
  }
}
Write-Host "Copied $ok files; failed $fail"
