# Handcrafted counterexample/instance patches for orchestration-plane nodes
# Usage: .\scripts\orchestration-example-patches.ps1 [-Module composition|evaluation|routing|task-planning|delegation|all]

param(
    [string]$Module = "all"
)

$RepoRoot = (Join-Path $PSScriptRoot "..") | Resolve-Path
$OrchRoot = Join-Path $RepoRoot "ontology/orchestration-plane"

function Insert-BeforeRootKey {
    param([string]$FilePath, [string]$YamlBlock, [string[]]$BeforeKeys)
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    foreach ($key in $BeforeKeys) {
        $pattern = "(?m)^$key`:"
        if ($content -match $pattern) {
            $content = [regex]::Replace($content, $pattern, ($YamlBlock.TrimEnd() + "`r`n$key`:"), 1)
            Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
            return $true
        }
    }
    throw "No insertion point in $FilePath"
}

$patches = @{
    "orchestration-composition/CompositionArtifact/node.yaml" = @"
  - id: CompositionArtifact-counterexample-activity-log-misclassified
    kind: counterexample
    labels:
      zh: 活动日志不是组合工件
      en: Activity log is not a composition artifact
      ja: 活動ログは composition artifact ではない
    scenario_id: null
    descriptions:
      zh: synthesis-884 的运行日志列出 consumed 章节与 status=running，但没有 composition_artifact_id、content_digest 或 produced_at 所固定的不可变内容身份。
      en: The synthesis-884 runtime log lists consumed sections and status=running but lacks composition_artifact_id, content_digest, or produced_at fixing immutable content identity.
      ja: synthesis-884 runtime log は consumed sections と status=running を示しますが、composition_artifact_id/content_digest/produced_at による immutable content identity がありません。
    field_values:
      composition_artifact_id: absent
      media_type: absent
      content_digest: absent
      produced_at: absent
      runtime_status: running
    related_node_ids:
      - CompositionArtifact
      - Synthesis
      - CompositionActivity
    related_relation_ids: []
    expected_result:
      zh: 拒绝 CompositionArtifact 分类；保留为 CompositionActivity 运行时状态。
      en: Reject CompositionArtifact classification; retain as CompositionActivity runtime state.
      ja: CompositionArtifact 分類を拒否し CompositionActivity runtime state として保持します。
    why_valid_or_invalid:
      zh: PROV Entity 需要稳定内容与摘要；时间跨度的处理行为属于 Activity 而非固定信息实体。
      en: PROV Entity requires stable content and digest; time-bounded processing belongs to Activity, not a fixed information entity.
      ja: PROV Entity は stable content/digest を要し、time-bounded processing は Activity に属します。
    synthetic: true
    verified_version: null
    source_claims:
      - claim-composition-artifact-002
  - id: CompositionArtifact-instance-a2a-artifact-normalized
    kind: instance
    labels:
      zh: A2A Artifact 归一化组合工件实例
      en: A2A Artifact normalized composition artifact instance
      ja: A2A Artifact 正規化 composition artifact 实例
    scenario_id: null
    descriptions:
      zh: A2A Task artifact-7b2 的 text/markdown 正文摘要 sha256:section-17 于 04:21 产生，本地映射为 artifact-section-17。
      en: A2A Task artifact-7b2 text/markdown body digest sha256:section-17 produced at 04:21 maps locally to artifact-section-17.
      ja: A2A Task artifact-7b2 の text/markdown digest sha256:section-17 が 04:21 に生成され、ローカル artifact-section-17 に写像されます。
    field_values:
      composition_artifact_id: artifact-section-17
      media_type: text/markdown
      content_digest: sha256:section-17
      produced_at: 2026-07-16T04:21:00Z
      native_artifact_ref: a2a:artifact-7b2
    related_node_ids:
      - CompositionArtifact
      - A2AArtifact
      - CompositionActivity
    related_relation_ids: []
    expected_result:
      zh: 接受为 CompositionArtifact；A2A wire 对象经 digest 与 produced_at 建立本地不可变身份。
      en: Accept as CompositionArtifact; A2A wire object gains local immutable identity via digest and produced_at.
      ja: CompositionArtifact として受理。A2A wire 对象は digest/produced_at でローカル immutable identity を得ます。
    why_valid_or_invalid:
      zh: 实例引用 A2A Artifact schema 与 PROV wasGeneratedBy 边界，字段与正例一致且不含运行状态。
      en: The instance cites A2A Artifact schema and PROV wasGeneratedBy boundary with fields matching the positive case and no runtime state.
      ja: A2A Artifact schema と PROV wasGeneratedBy 境界を引用し、正例 field と一致し runtime state を含みません。
    synthetic: true
    verified_version: null
    source_claims:
      - claim-composition-artifact-001
"@

# Apply single patch helper for module filtering
function Apply-Patch {
    param([string]$RelativePath, [string]$Block)
    $full = Join-Path $OrchRoot $RelativePath
    if (-not (Test-Path $full)) { Write-Warning "Missing $full"; return }
    $c = Get-Content $full -Raw -Encoding UTF8
    if ($c -match "kind: counterexample" -and $c -match "kind: instance") {
        Write-Host "Skip (complete): $RelativePath"
        return
    }
    Insert-BeforeRootKey -FilePath $full -YamlBlock $Block -BeforeKeys @("parent_relation", "sources", "source_claims")
    Write-Host "Patched: $RelativePath"
}

if ($Module -eq "composition" -or $Module -eq "all") {
    Apply-Patch "orchestration-composition/CompositionArtifact/node.yaml" $patches["orchestration-composition/CompositionArtifact/node.yaml"]
}
