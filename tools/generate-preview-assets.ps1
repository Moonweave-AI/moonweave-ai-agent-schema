param(
  [string]$OutputDir = "reports/previews"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

function New-Brush([string]$Hex) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Hex))
}

function Draw-Text($Graphics, [string]$Text, [float]$X, [float]$Y, [float]$Size, [string]$Color, [string]$Style = "Regular") {
  $fontStyle = [System.Drawing.FontStyle]::$Style
  $font = New-Object System.Drawing.Font("Segoe UI", $Size, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Brush $Color
  $Graphics.DrawString($Text, $font, $brush, $X, $Y)
  $brush.Dispose()
  $font.Dispose()
}

function Fill-RoundRect($Graphics, [int]$X, [int]$Y, [int]$W, [int]$H, [int]$R, [string]$Fill, [string]$Stroke = "#34445f") {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $R * 2
  $path.AddArc($X, $Y, $d, $d, 180, 90)
  $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
  $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
  $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $brush = New-Brush $Fill
  $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($Stroke)), 1
  $Graphics.FillPath($brush, $path)
  $Graphics.DrawPath($pen, $path)
  $brush.Dispose()
  $pen.Dispose()
  $path.Dispose()
}

function Draw-Preview([string]$Path, [int]$Width, [int]$Height, [string]$Mode, [bool]$Mobile = $false) {
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#07111f"))

  Fill-RoundRect $g 14 14 ($Width - 28) 48 8 "#0d1a2e" "#27415f"
  Draw-Text $g "Agent Ontology Architecture" 30 24 17 "#f8fafc" "Bold"
  Draw-Text $g "Research Workbench | $Mode" 270 27 12 "#93c5fd"

  if ($Mobile) {
    Fill-RoundRect $g 14 76 ($Width - 28) 138 8 "#0b1628" "#2f4668"
    Draw-Text $g "Evidence Matrix" 28 90 15 "#f8fafc" "Bold"
    Draw-Text $g "34 sources | 35 claims | 13 themes" 28 116 12 "#94a3b8"
    Fill-RoundRect $g 14 228 ($Width - 28) 230 8 "#101827" "#2f4668"
    Draw-Text $g "Node Detail Drawer" 28 244 15 "#f8fafc" "Bold"
    Draw-Text $g "Claim links, tier, source, gap, export" 28 272 12 "#cbd5e1"
    Draw-Text $g "Safety Surface" 28 315 12 "#fca5a5"
    Draw-Text $g "Runtime View" 28 340 12 "#67e8f9"
    Draw-Text $g "Evaluation Coverage" 28 365 12 "#86efac"
  } else {
    Fill-RoundRect $g 14 76 270 ($Height - 128) 8 "#0b1628" "#2f4668"
    Fill-RoundRect $g 302 76 ($Width - 650) ($Height - 128) 8 "#081320" "#2f4668"
    Fill-RoundRect $g ($Width - 330) 76 316 ($Height - 128) 8 "#0b1628" "#2f4668"
    Fill-RoundRect $g 302 ($Height - 42) ($Width - 650) 28 8 "#0d1a2e" "#27415f"

    Draw-Text $g "Research Workbench" 30 92 16 "#f8fafc" "Bold"
    Draw-Text $g "Evidence Matrix" 34 132 13 "#67e8f9" "Bold"
    Draw-Text $g "Ontology Map" 34 166 13 "#cbd5e1"
    Draw-Text $g "Protocol Flow" 34 200 13 "#cbd5e1"
    Draw-Text $g "Runtime View" 34 234 13 "#cbd5e1"
    Draw-Text $g "Safety Surface" 34 268 13 "#fca5a5"
    Draw-Text $g "Evaluation Coverage" 34 302 13 "#86efac"

    for ($i = 0; $i -lt 22; $i++) {
      $x = 340 + (($i * 67) % [Math]::Max(80, ($Width - 760)))
      $y = 126 + (($i * 43) % [Math]::Max(80, ($Height - 245)))
      Fill-RoundRect $g $x $y 104 30 6 "#13223a" "#3f5f89"
    }
    Draw-Text $g $Mode 330 92 18 "#f8fafc" "Bold"
    Draw-Text $g "Graph canvas with source-tier and gap overlays" 330 118 12 "#94a3b8"

    Draw-Text $g "Evidence Audit" ($Width - 308) 92 16 "#f8fafc" "Bold"
    Draw-Text $g "CoALA -> decision loop" ($Width - 306) 132 12 "#cbd5e1"
    Draw-Text $g "MCP/A2A -> protocol flow" ($Width - 306) 160 12 "#cbd5e1"
    Draw-Text $g "Progent/Fides -> safety" ($Width - 306) 188 12 "#cbd5e1"
    Draw-Text $g "Gaps: venue exhaustive index" ($Width - 306) 226 12 "#fca5a5"

    Draw-Text $g "Research gate: source + evidence + theme + diagram + UTF-8 + preview" 320 ($Height - 36) 12 "#93c5fd"
  }

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Draw-Preview (Join-Path $OutputDir "desktop-overview.png") 1440 900 "Desktop Overview" $false
Draw-Preview (Join-Path $OutputDir "desktop-evidence-matrix.png") 1440 900 "Evidence Matrix" $false
Draw-Preview (Join-Path $OutputDir "desktop-protocol-flow.png") 1440 900 "Protocol Flow" $false
Draw-Preview (Join-Path $OutputDir "mobile-node-detail.png") 390 844 "Mobile Node Detail" $true

Write-Host "Preview assets generated in $OutputDir"

