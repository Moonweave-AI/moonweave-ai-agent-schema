export const createSemanticRepairPhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction, moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts, locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor, fixCrossKindTaxonomy, RECLASSIFIED_CONCEPTS, normalizeReclassifiedConcepts, addExecutionBackbone, addDelegationSemanticBackbone, completeContextDiscoveryFlow, completePromptInstructionBackbone, repairNetworkSemantics, completeExecutionResultSemantics, completeOptimizationLearningLoop, completeEvaluationGoldenFlow, completeContextAssemblySemantics, completeRetrievalExecutionSemantics, repairEvaluationCompositionAndAgency, completeGovernedOptimizationApplication, completeMemoryPipelineSemantics, completeInstructionAndDisclosureProcessing, completeDelegationSelectionAndHandoff, completeInvocationAndRetrySemantics, completeMemoryOperationAndStorageSemantics } = context;

  const completeImprovementLoopCoordination = () => {
    const moduleId = "orchestration-evaluation";
    const loopTypes = [
      ["EvaluatorOptimizerLoop", "评估者—优化器循环", "Evaluator-optimizer loop", "評価者・最適化ループ", "评估者—优化器循环在评估尝试和修订尝试之间交替，直到停止条件成立。", "An evaluator-optimizer loop alternates evaluation and revision attempts until a stop condition holds.", "評価者・最適化ループは停止条件成立まで評価試行と修訂試行を交互に行います。"],
      ["ReviewRevisionLoop", "审查—修订循环", "Review-revision loop", "レビュー・修訂ループ", "审查—修订循环依据审查协调、发现和纠正证据安排修订与再评估。", "A review-revision loop schedules revision and reevaluation using review coordination, findings, and correction evidence.", "レビュー・修訂ループはレビュー調整、所見、修正証拠に基づき修訂と再評価を編成します。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of loopTypes) {
      upsertReviewedConcept({ id, moduleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity", primaryParentRelationId: `${id}-is_a-ImprovementLoop` });
      upsertReviewedRelation({ id: `${id}-is_a-ImprovementLoop`, moduleId, predicate: "is_a", sourceId: id, targetId: "ImprovementLoop", relationKind: "hierarchy", definitions: localized(`${zh}是一种改进循环。`, `${en} is a kind of improvement loop.`, `${ja}は改善ループの一種です。`) });
    }
    const attempts = [
      ["EvaluationAttempt", "评估尝试", "Evaluation attempt", "評価試行", "评估尝试是在改进循环内协调一次反馈域 EvaluationRun 的改进尝试。", "An evaluation attempt is an improvement attempt coordinating one feedback-owned EvaluationRun within an improvement loop.", "評価試行は改善ループ内でフィードバック領域所有の EvaluationRun 一回を調整する改善試行です。"],
      ["RevisionAttempt", "修订尝试", "Revision attempt", "修訂試行", "修订尝试是在改进循环内协调一次纠正活动、修订计划和后续验证的改进尝试。", "A revision attempt is an improvement attempt coordinating correction activity, a revision plan, and subsequent validation within an improvement loop.", "修訂試行は改善ループ内で修正活動、修訂計画、その後の検証を調整する改善試行です。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of attempts) {
      upsertReviewedConcept({ id, moduleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity", primaryParentRelationId: `${id}-is_a-ImprovementAttempt` });
      upsertReviewedRelation({ id: `${id}-is_a-ImprovementAttempt`, moduleId, predicate: "is_a", sourceId: id, targetId: "ImprovementAttempt", relationKind: "hierarchy", definitions: localized(`${zh}是一种具有独立 lineage 的改进尝试。`, `${en} is an improvement attempt with independent lineage.`, `${ja}は独立 lineage を持つ改善試行です。`) });
    }
    const facts = [
      ["EvaluationAttempt-precedes-RevisionAttempt", "precedes", "EvaluationAttempt", "RevisionAttempt", "temporal", "评估尝试先形成测量、评分和反馈证据，修订尝试再据此执行纠正。", "Evaluation forms measurement, score, and feedback evidence before revision performs correction.", "評価試行が測定、スコア、フィードバック証拠を形成した後、修訂試行が修正を行います。"],
      ["EvaluationAttempt-coordinates-EvaluationRun", "coordinates", "EvaluationAttempt", "EvaluationRun", "causal", "评估尝试只编排反馈域拥有的评估运行，不复制其指标和测量语义。", "An evaluation attempt coordinates a feedback-owned evaluation run without duplicating metric or measurement semantics.", "評価試行はフィードバック領域所有の評価実行を編成し、指標や測定意味を複製しません。"],
      ["RevisionAttempt-coordinates-CorrectionActivity", "coordinates", "RevisionAttempt", "CorrectionActivity", "causal", "修订尝试协调反馈域拥有的纠正活动并保留重试 lineage。", "A revision attempt coordinates feedback-owned correction activity while retaining retry lineage.", "修訂試行はフィードバック領域所有の修正活動を調整し再試行 lineage を保持します。"],
      ["ReviewCoordination-dispatches-ImprovementAttempt", "dispatches", "ReviewCoordination", "ImprovementAttempt", "causal", "审查协调按照角色、停止条件和重试策略分派改进尝试。", "Review coordination dispatches improvement attempts under roles, stop conditions, and retry policy.", "レビュー調整は役割、停止条件、再試行ポリシーに基づき改善試行を分派します。"],
      ["ImprovementLoop-contains-EvaluationAttempt", "contains", "ImprovementLoop", "EvaluationAttempt", "composition", "改进循环包含具有独立 lineage 的评估尝试。", "An improvement loop contains evaluation attempts with independent lineage.", "改善ループは独立 lineage を持つ評価試行を含みます。"],
      ["ImprovementLoop-contains-RevisionAttempt", "contains", "ImprovementLoop", "RevisionAttempt", "composition", "改进循环包含响应评估证据的修订尝试。", "An improvement loop contains revision attempts responding to evaluation evidence.", "改善ループは評価証拠に応じる修訂試行を含みます。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of facts) upsertReviewedRelation({ id, moduleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
  };

  const repairResidualAgencyAndCompositionSemantics = () => {
    const mappingReason = localized("MappingRule 是规范，不能发出告警；映射测试结果记录规则验证时发现的转换告警。", "MappingRule is a specification and cannot emit warnings; MappingTestResult records conversion warnings found while validating the rule.", "MappingRule は仕様で警告を発行できず、MappingTestResult が規則検証で見つかった変換警告を記録します。");
    deprecateRelation("MappingRule-may_emit-ConversionWarning", ["MappingTestResult-reports-ConversionWarning"], mappingReason);
    upsertReviewedRelation({ id: "MappingTestResult-reports-ConversionWarning", moduleId: "adapter-mapping-infrastructure", predicate: "reports", sourceId: "MappingTestResult", targetId: "ConversionWarning", relationKind: "information", definitions: localized("映射测试结果报告验证映射规则时发现的缺失、歧义或有损转换告警。", "A mapping test result reports missing, ambiguous, or lossy-conversion warnings discovered while validating a mapping rule.", "写像テスト結果は写像規則検証で見つかった欠落、曖昧、有損変換警告を報告します。") });

    const criterionReason = localized("SuccessCriterion 规定任务成功的判定条件，但不执行评估；实际评估由 EvaluationRun 和 Measurement 执行。", "SuccessCriterion specifies how task success is judged but does not perform evaluation; EvaluationRun and Measurement perform it.", "SuccessCriterion はタスク成功の判定条件を規定しますが評価を実行せず、EvaluationRun と Measurement が実行します。");
    deprecateRelation("success_criterion_evaluates_task", ["SuccessCriterion-applies_to-Task"], criterionReason);
    upsertReviewedRelation({ id: "SuccessCriterion-applies_to-Task", moduleId: "feedback-metrics-evaluation", predicate: "applies_to", sourceId: "SuccessCriterion", targetId: "Task", relationKind: "governance", definitions: localized("成功准则规定某类任务满足完成要求时必须成立的条件。", "A success criterion specifies the conditions that must hold for a task to satisfy completion requirements.", "成功基準はタスクが完了要件を満たすために成立すべき条件を規定します。") });

    const reviewReason = localized("Review 和 ReviewEvent 是记录与事件，不执行产出；ReviewActivity 产生 Review、ReviewFinding、CritiqueArtifact 和完成事件。", "Review and ReviewEvent are records and events rather than producing agents; ReviewActivity produces Review, ReviewFinding, CritiqueArtifact, and the completion event.", "Review と ReviewEvent は記録・イベントで生成主体ではなく、ReviewActivity が Review、ReviewFinding、CritiqueArtifact、完了イベントを生成します。");
    deprecateRelation("review_produces_review_finding", ["ReviewActivity-produces-ReviewFinding", "Review-contains_finding-ReviewFinding"], reviewReason);
    deprecateRelation("ReviewEvent-produces-CritiqueArtifact", ["ReviewActivity-produces-CritiqueArtifact"], reviewReason);
    deprecateRelation("ReviewAssignment-initiates-ReviewEvent", ["ReviewAssignment-governs-ReviewActivity", "ReviewActivity-produces-ReviewEvent"], reviewReason);
    const reviewFacts = [
      ["ReviewActivity-produces-ReviewFinding", "produces", "ReviewActivity", "ReviewFinding", "causal", "审查活动产生具有独立身份、对象和证据的审查发现。", "A review activity produces review findings with independent identity, subject, and evidence.", "レビュー活動は独立同一性、対象、証拠を持つレビュー所見を生成します。"],
      ["ReviewActivity-produces-CritiqueArtifact", "produces", "ReviewActivity", "CritiqueArtifact", "causal", "审查活动可产生汇总发现、理由和改进建议的批评产物。", "A review activity may produce a critique artifact summarizing findings, rationale, and improvement recommendations.", "レビュー活動は所見、理由、改善提案をまとめる批評成果物を生成できます。"],
      ["ReviewAssignment-governs-ReviewActivity", "governs", "ReviewAssignment", "ReviewActivity", "governance", "审查分配规定审查活动的责任角色、对象、范围和截止条件。", "A review assignment governs responsible role, subject, scope, and deadline for review activity.", "レビュー割当はレビュー活動の責任ロール、対象、範囲、期限を規定します。"],
      ["ReviewActivity-produces-ReviewEvent", "produces", "ReviewActivity", "ReviewEvent", "causal", "审查活动产生标记审查开始、提交或完成时点的审查事件。", "A review activity produces review events marking start, submission, or completion.", "レビュー活動は開始、提出、完了時点を示すレビューイベントを生成します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of reviewFacts) upsertReviewedRelation({ id, moduleId: id.startsWith("ReviewAssignment") ? "orchestration-evaluation" : "feedback-review-optimization", predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });

    const refreshReason = localized("ContextRefreshEvent 记录刷新触发与前序版本，不亲自修改 ContextPackage；ContextAssembly 产生新不可变版本。", "ContextRefreshEvent records the refresh trigger and predecessor version without modifying ContextPackage; ContextAssembly produces the new immutable version.", "ContextRefreshEvent は更新起動と先行版を記録し ContextPackage を変更せず、ContextAssembly が新しい不変版を生成します。");
    deprecateRelation("ContextRefreshEvent-refreshes-ContextPackage", ["ContextRefreshEvent-identifies_predecessor-ContextPackage", "ContextRefreshEvent-triggers-ContextAssembly", "ContextAssembly-produces-ContextPackage"], refreshReason);
    upsertReviewedRelation({ id: "ContextRefreshEvent-identifies_predecessor-ContextPackage", moduleId: "memory-context", predicate: "identifies_predecessor", sourceId: "ContextRefreshEvent", targetId: "ContextPackage", relationKind: "temporal", definitions: localized("上下文刷新事件引用触发刷新时仍有效的前序上下文包版本。", "A context-refresh event references the predecessor context-package version valid when refresh was triggered.", "コンテキスト更新イベントは更新起動時に有効だった先行コンテキストパッケージ版を参照します。") });

    const compositionModuleId = "orchestration-composition";
    upsertReviewedConcept({ id: "AggregationActivity", moduleId: compositionModuleId, labels: localized("组合聚合活动", "Composition aggregation activity", "構成集約活動"), definitions: localized("组合聚合活动按照组合模式和聚合规则消费多个组成输入，并产生保留来源与决策证据的组合输出。", "A composition aggregation activity consumes multiple component inputs under a composition pattern and aggregation rule and produces output retaining provenance and decision evidence.", "構成集約活動は構成パターンと集約規則の下で複数入力を消費し、出典と判断証拠を保持する構成出力を生成します。"), semanticKind: "activity" });
    updateReviewedConcept("Synthesis", { primary_parent_relation_id: "Synthesis-is_a-AggregationActivity", root_status: null });
    upsertReviewedRelation({ id: "Synthesis-is_a-AggregationActivity", moduleId: compositionModuleId, predicate: "is_a", sourceId: "Synthesis", targetId: "AggregationActivity", relationKind: "hierarchy", definitions: localized("综合是把多个来源内容合成为连贯输出的一种组合聚合活动。", "Synthesis is a composition-aggregation activity that combines content from multiple sources into coherent output.", "総合は複数出典内容を一貫した出力へ組み合わせる構成集約活動です。") });
    upsertReviewedConcept({ id: "VotingActivity", moduleId: compositionModuleId, labels: localized("投票聚合活动", "Voting aggregation activity", "投票集約活動"), definitions: localized("投票聚合活动按照投票组合模式消费选票、应用计票与平局规则并产生组合输出。", "A voting aggregation activity consumes ballots under a voting composition pattern, applies counting and tie rules, and produces composition output.", "投票集約活動は投票構成パターンの下で票を消費し、集計・同票規則を適用して構成出力を生成します。"), semanticKind: "activity", primaryParentRelationId: "VotingActivity-is_a-AggregationActivity" });
    upsertReviewedRelation({ id: "VotingActivity-is_a-AggregationActivity", moduleId: compositionModuleId, predicate: "is_a", sourceId: "VotingActivity", targetId: "AggregationActivity", relationKind: "hierarchy", definitions: localized("投票聚合活动是以选票和计票规则为区分特征的组合聚合活动。", "Voting aggregation is a composition-aggregation activity distinguished by ballots and counting rules.", "投票集約活動は票と集計規則を種差とする構成集約活動です。") });
    upsertReviewedConcept({ id: "CompositionOutput", moduleId: compositionModuleId, labels: localized("组合输出", "Composition output", "構成出力"), definitions: localized("组合输出是一次聚合、投票或综合活动产生、并保留组成输入、模式、规则和决定依据的信息。", "Composition output is information produced by an aggregation, voting, or synthesis activity that retains component inputs, pattern, rules, and decision evidence.", "構成出力は集約、投票、総合活動が生成し、構成入力、パターン、規則、判断根拠を保持する情報です。"), semanticKind: "information" });
    updateReviewedConcept("SynthesisOutput", { primary_parent_relation_id: "SynthesisOutput-is_a-CompositionOutput", root_status: null });
    upsertReviewedRelation({ id: "SynthesisOutput-is_a-CompositionOutput", moduleId: compositionModuleId, predicate: "is_a", sourceId: "SynthesisOutput", targetId: "CompositionOutput", relationKind: "hierarchy", definitions: localized("综合输出是由综合活动产生的一种组合输出。", "Synthesis output is a composition output produced by synthesis.", "総合出力は総合活動が生成する構成出力です。") });
    const patternReason = localized("Sectioning 和 Voting 是组合模式规范，不能创建分配或消费选票；相应动作由受模式治理的活动执行。", "Sectioning and Voting are composition-pattern specifications and cannot create assignments or consume ballots; governed activities perform those actions.", "Sectioning と Voting は構成パターン仕様で割当生成や票消費を実行できず、統治される活動が実行します。");
    deprecateRelation("Sectioning-creates-SectionAssignment", ["Sectioning-specifies-SectionAssignment"], patternReason);
    deprecateRelation("Voting-consumes-VoteBallot", ["Voting-governs-VotingActivity", "VotingActivity-consumes-VoteBallot"], patternReason);
    const compositionFacts = [
      ["Sectioning-specifies-SectionAssignment", "specifies", "Sectioning", "SectionAssignment", "composition", "分区组合模式规定工作如何分成具有范围和汇合条件的分区分配。", "A sectioning pattern specifies how work is divided into section assignments with scope and join conditions.", "分区構成パターンは作業を範囲と合流条件を持つ分区割当へ分ける方法を規定します。"],
      ["Voting-governs-VotingActivity", "governs", "Voting", "VotingActivity", "governance", "投票组合模式规定投票聚合活动的资格、权重、计票和平局规则。", "A voting composition pattern governs eligibility, weights, counting, and tie rules for voting activity.", "投票構成パターンは投票活動の資格、重み、集計、同票規則を統治します。"],
      ["VotingActivity-consumes-VoteBallot", "consumes", "VotingActivity", "VoteBallot", "information", "投票聚合活动消费具有投票者、候选、权重和来源的选票记录。", "A voting aggregation activity consumes ballot records with voter, candidate, weight, and provenance.", "投票集約活動は投票者、候補、重み、出典を持つ票記録を消費します。"],
      ["VotingActivity-produces-CompositionOutput", "produces", "VotingActivity", "CompositionOutput", "causal", "投票聚合活动产生保留计票与平局处理证据的组合输出。", "A voting aggregation activity produces composition output retaining counting and tie-resolution evidence.", "投票集約活動は集計と同票解決証拠を保持する構成出力を生成します。"],
      ["OrchestrationTopology-contains-CompositionPart", "contains", "OrchestrationTopology", "CompositionPart", "composition", "编排拓扑包含按组合模式连接的阶段、分支或分区分配等组成部件。", "An orchestration topology contains stages, branches, or section assignments connected under a composition pattern.", "編成トポロジーは構成パターンで接続された段階、分岐、分区割当などの構成部品を含みます。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of compositionFacts) upsertReviewedRelation({ id, moduleId: compositionModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
  };

  const completePlannedOperationalGaps = () => {
    const recordStructure = (moduleId, fieldId, fieldLabels, exampleValue, fields = []) => {
      const module = moduleDocuments.get(moduleId).document.module;
      const sourceClaims = claimsFor(module, module);
      return {
        identity_keys: [fieldId],
        fields: [{
          id: fieldId,
          labels: fieldLabels,
          datatype: "string",
          required: true,
          cardinality: { min: 1, max: 1 },
          definitions: localized(`该字段唯一标识这条${fieldLabels.zh}记录。`, `This field uniquely identifies the ${fieldLabels.en} record.`, `この項目は${fieldLabels.ja}記録を一意に識別します。`),
          allowed_values: [],
          pattern: null,
          example_value: exampleValue,
          source_claims: sourceClaims,
        }, ...fields.map((field) => ({ ...field, source_claims: sourceClaims }))],
        constraints: [],
        required_relation_constraints: [],
      };
    };
    const field = (id, labels, datatype, definitions, exampleValue, required = false) => ({
      id,
      labels,
      datatype,
      required,
      cardinality: { min: required ? 1 : 0, max: 1 },
      definitions,
      allowed_values: [],
      pattern: null,
      example_value: exampleValue,
    });

    const loggingModuleId = "feedback-logging";
    upsertReviewedConcept({ id: "TelemetryExportActivity", moduleId: loggingModuleId, labels: localized("遥测导出活动", "Telemetry export activity", "テレメトリ出力活動"), definitions: localized("遥测导出活动读取运行观测、日志或测量，在固定范围与格式下生成可校验的不可变导出批次；原始事件和测量的所有权不随导出转移。", "A telemetry-export activity reads runtime observations, logs, or measurements and creates a verifiable immutable export batch under a fixed scope and format; ownership of original events and measurements does not move with export.", "テレメトリ出力活動は、固定された範囲と形式の下で実行観測、ログ、測定を読み、検証可能な不変出力バッチを生成します。元イベントと測定の所有権は出力によって移動しません。"), semanticKind: "activity" });
    const exportActivities = [
      ["TraceExportActivity", "轨迹导出活动", "Trace export activity", "トレース出力活動", "轨迹导出活动选择并封装 TraceRecord 与跨度证据。", "A trace-export activity selects and packages TraceRecord and span evidence.", "トレース出力活動は TraceRecord とスパン証拠を選択して梱包します。"],
      ["LogExportActivity", "日志导出活动", "Log export activity", "ログ出力活動", "日志导出活动从一个有界日志流读取记录并形成可传输批次。", "A log-export activity reads records from a bounded log stream and forms a transportable batch.", "ログ出力活動は境界付きログストリームから記録を読み、転送可能なバッチを形成します。"],
      ["MetricExportActivity", "测量导出活动", "Measurement export activity", "測定出力活動", "测量导出活动引用评估域拥有的 Measurement，并输出不复制测量语义的引用批次。", "A measurement-export activity references feedback-owned Measurement records and emits a batch of references without duplicating measurement semantics.", "測定出力活動は評価領域所有の Measurement を参照し、測定意味を複製しない参照バッチを出力します。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of exportActivities) {
      upsertReviewedConcept({ id, moduleId: loggingModuleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity", primaryParentRelationId: `${id}-is_a-TelemetryExportActivity` });
      upsertReviewedRelation({ id: `${id}-is_a-TelemetryExportActivity`, moduleId: loggingModuleId, predicate: "is_a", sourceId: id, targetId: "TelemetryExportActivity", relationKind: "hierarchy", definitions: localized(`${zh}是按输入证据类型区分的一种遥测导出活动。`, `${en} is a telemetry-export activity distinguished by its input evidence type.`, `${ja}は入力証拠型で区別されるテレメトリ出力活動です。`) });
    }
    upsertReviewedConcept({ id: "TelemetryExportBatch", moduleId: loggingModuleId, labels: localized("遥测导出批次", "Telemetry export batch", "テレメトリ出力バッチ"), definitions: localized("遥测导出批次是一次导出活动产生的不可变信息集合，固定批次身份、格式、时间范围、来源指纹和成员顺序。", "A telemetry-export batch is an immutable information collection produced by one export activity, fixing batch identity, format, time range, source fingerprint, and member order.", "テレメトリ出力バッチは一回の出力活動が生成する不変情報集合で、バッチ同一性、形式、時間範囲、出典指紋、要素順序を固定します。"), semanticKind: "information", structure: recordStructure(loggingModuleId, "batch_id", localized("批次", "batch", "バッチ"), "telemetry-batch-20260714") });
    upsertReviewedConcept({ id: "MeasurementReference", moduleId: loggingModuleId, labels: localized("测量引用", "Measurement reference", "測定参照"), definitions: localized("测量引用是在导出批次内指向评估域 Measurement 的不可变引用，保存目标身份、版本与摘要，而不复制指标或测量值的定义。", "A measurement reference is an immutable reference inside an export batch to a feedback-owned Measurement, retaining target identity, version, and digest without copying metric or measurement definitions.", "測定参照は出力バッチ内から評価領域所有の Measurement を指す不変参照で、指標や測定値定義を複製せず対象同一性、版、要約を保持します。"), semanticKind: "information", structure: recordStructure(loggingModuleId, "reference_id", localized("测量引用", "measurement reference", "測定参照"), "measurement-ref-042") });
    updateReviewedConcept("TraceExport", { primary_parent_relation_id: "TraceExport-is_a-TelemetryExportBatch", root_status: null });
    upsertReviewedRelation({ id: "TraceExport-is_a-TelemetryExportBatch", moduleId: loggingModuleId, predicate: "is_a", sourceId: "TraceExport", targetId: "TelemetryExportBatch", relationKind: "hierarchy", definitions: localized("轨迹导出是只封装轨迹、跨度与关联运行证据的一种遥测导出批次。", "A trace export is a telemetry-export batch specialized for trace, span, and correlated runtime evidence.", "トレース出力はトレース、スパン、関連実行証拠に特化したテレメトリ出力バッチです。") });
    const exportFacts = [
      ["TelemetryExportActivity-produces-TelemetryExportBatch", "produces", "TelemetryExportActivity", "TelemetryExportBatch", "causal", "每次遥测导出活动产生一个固定范围和来源指纹的不可变批次。", "Each telemetry-export activity produces an immutable batch with fixed scope and source fingerprint.", "各テレメトリ出力活動は固定範囲と出典指紋を持つ不変バッチを生成します。"],
      ["TelemetryExportBatch-contains-MeasurementReference", "contains", "TelemetryExportBatch", "MeasurementReference", "composition", "遥测导出批次可包含有序的测量引用而不复制原始 Measurement。", "A telemetry-export batch may contain ordered measurement references without copying original Measurement records.", "テレメトリ出力バッチは元の Measurement を複製せず順序付き測定参照を含めます。"],
      ["MeasurementReference-references-Measurement", "references", "MeasurementReference", "Measurement", "information", "测量引用以稳定身份和摘要指向评估域拥有的测量记录。", "A measurement reference points by stable identity and digest to a feedback-owned measurement record.", "測定参照は安定同一性と要約により評価領域所有の測定記録を指します。"],
      ["TraceExportActivity-consumes-TraceRecord", "consumes", "TraceExportActivity", "TraceRecord", "information", "轨迹导出活动读取运行域拥有的轨迹记录。", "A trace-export activity reads runtime-owned trace records.", "トレース出力活動は実行領域所有のトレース記録を読みます。"],
      ["TraceExportActivity-produces-TraceExport", "produces", "TraceExportActivity", "TraceExport", "causal", "轨迹导出活动产生保留选择范围和来源指纹的轨迹导出批次。", "A trace-export activity produces a trace-export batch retaining selection scope and source fingerprint.", "トレース出力活動は選択範囲と出典指紋を保持するトレース出力バッチを生成します。"],
      ["LogExportActivity-consumes-LogStream", "consumes", "LogExportActivity", "LogStream", "information", "日志导出活动读取一个有界日志流。", "A log-export activity reads one bounded log stream.", "ログ出力活動は一つの境界付きログストリームを読みます。"],
      ["MetricExportActivity-consumes-Measurement", "consumes", "MetricExportActivity", "Measurement", "information", "测量导出活动读取但不重新拥有评估测量。", "A measurement-export activity reads but does not re-own evaluation measurements.", "測定出力活動は評価測定を読みますが再所有しません。"],
      ["AuditLog-derived_from-AuditRecord", "derived_from", "AuditLog", "AuditRecord", "information", "审计日志由有序的原始审计记录派生，集合不取代记录的身份。", "An audit log is derived from ordered raw audit records; the collection does not replace record identity.", "監査ログは順序付きの元監査記録から派生し、集合は記録同一性を置換しません。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of exportFacts) upsertReviewedRelation({ id, moduleId: loggingModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    deprecateRelation("TraceExport-exports-LogStream", ["LogExportActivity-consumes-LogStream", "TelemetryExportActivity-produces-TelemetryExportBatch"], localized("TraceExport 是信息批次，不能执行导出；日志流由 LogExportActivity 读取。", "TraceExport is an information batch and cannot perform export; LogExportActivity reads a log stream.", "TraceExport は情報バッチで出力を実行できず、LogExportActivity がログストリームを読みます。"));
    deprecateRelation("audit_log_summarizes_audit_record", ["AuditLog-derived_from-AuditRecord"], localized("derived_from 明确表达审计日志集合的来源关系，避免把摘要动作赋予信息集合。", "derived_from expresses audit-log provenance without assigning summarization agency to an information collection.", "derived_from は情報集合へ要約主体性を与えず監査ログ出典を表します。"));

    const registryModuleId = "tool-registry-definition";
    upsertReviewedConcept({ id: "RegistryEntry", moduleId: registryModuleId, labels: localized("注册条目", "Registry entry", "レジストリ項目"), definitions: localized("注册条目是在某个环境和有效期内发布一份能力规范的不可变注册记录，固定提供方、端点、契约版本和状态证据；它不是能力定义本身。", "A registry entry is an immutable registration record publishing one capability specification for an environment and validity interval, fixing provider, endpoint, contract version, and status evidence; it is not the capability definition itself.", "レジストリ項目は環境と有効期間内で一つの能力仕様を公開する不変登録記録で、提供者、端点、契約版、状態証拠を固定します。能力定義そのものではありません。"), semanticKind: "information", structure: recordStructure(registryModuleId, "registry_entry_id", localized("注册条目", "registry entry", "レジストリ項目"), "registry-entry-shell-v4", [field("environment_scope", localized("环境范围", "environment scope", "環境範囲"), "string", localized("条目可被解析的部署环境范围。", "Deployment environment in which the entry can resolve.", "項目を解決できる配備環境範囲です。"), "production", true), field("endpoint_reference", localized("端点引用", "endpoint reference", "端点参照"), "reference", localized("指向提供该能力实现的可解析端点。", "Reference to the resolvable endpoint providing the capability implementation.", "能力実装を提供する解決可能端点への参照です。"), "endpoint:shell-runner-1", true)]) });
    upsertReviewedConcept({ id: "RegistryActivity", moduleId: registryModuleId, labels: localized("注册表活动", "Registry activity", "レジストリ活動"), definitions: localized("注册表活动是在注册治理规则下创建或终止注册条目有效期的可审计活动。", "A registry activity is an auditable activity that creates or terminates a registry entry's validity under registry governance rules.", "レジストリ活動は登録統治規則の下でレジストリ項目の有効期間を作成または終了する監査可能な活動です。"), semanticKind: "activity" });
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of [
      ["RegistrationActivity", "注册活动", "Registration activity", "登録活動", "注册活动验证提供方和契约后产生新的不可变注册条目。", "A registration activity validates provider and contract and then produces a new immutable registry entry.", "登録活動は提供者と契約を検証し、新しい不変レジストリ項目を生成します。"],
      ["DeregistrationActivity", "注销活动", "Deregistration activity", "登録解除活動", "注销活动在不删除历史条目的前提下终止其后续有效期。", "A deregistration activity terminates future validity without deleting the historical entry.", "登録解除活動は履歴項目を削除せず将来の有効期間を終了します。"],
    ]) {
      upsertReviewedConcept({ id, moduleId: registryModuleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity", primaryParentRelationId: `${id}-is_a-RegistryActivity` });
      upsertReviewedRelation({ id: `${id}-is_a-RegistryActivity`, moduleId: registryModuleId, predicate: "is_a", sourceId: id, targetId: "RegistryActivity", relationKind: "hierarchy", definitions: localized(`${zh}是按条目有效期变化方向区分的一种注册表活动。`, `${en} is a registry activity distinguished by the direction of entry-validity change.`, `${ja}は項目有効期間の変化方向で区別されるレジストリ活動です。`) });
    }
    const registryFacts = [
      ["ToolRegistry-contains-RegistryEntry", "contains", "ToolRegistry", "RegistryEntry", "composition", "工具注册表包含可独立版本化和审计的注册条目。", "A tool registry contains independently versioned and auditable registry entries.", "ツールレジストリは独立版管理・監査可能なレジストリ項目を含みます。"],
      ["RegistryEntry-describes-ToolSpecification", "describes", "RegistryEntry", "ToolSpecification", "information", "注册条目引用其发布的能力规范，而不复制规范身份。", "A registry entry references the capability specification it publishes without copying specification identity.", "レジストリ項目は仕様同一性を複製せず公開する能力仕様を参照します。"],
      ["RegistrationActivity-produces-RegistryEntry", "produces", "RegistrationActivity", "RegistryEntry", "causal", "注册活动产生固定提供方、版本、端点和有效期的新条目。", "A registration activity produces a new entry fixing provider, version, endpoint, and validity interval.", "登録活動は提供者、版、端点、有効期間を固定した新項目を生成します。"],
      ["DeregistrationActivity-terminates-RegistryEntry", "terminates", "DeregistrationActivity", "RegistryEntry", "temporal", "注销活动终止注册条目的后续有效期，但保留历史身份和审计证据。", "A deregistration activity terminates an entry's future validity while retaining historical identity and audit evidence.", "登録解除活動は履歴同一性と監査証拠を保持しつつ項目の将来有効期間を終了します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of registryFacts) upsertReviewedRelation({ id, moduleId: registryModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    deprecateRelation("ToolRegistry-contains_definition-ToolDefinition", ["ToolRegistry-contains-RegistryEntry", "RegistryEntry-describes-ToolSpecification"], localized("注册表包含的是有状态和有效期的注册条目；条目再引用稳定能力规范，避免集合直接包含规范而丢失注册身份。", "A registry contains stateful, time-bounded entries that reference stable capability specifications; direct containment loses registration identity.", "レジストリは状態と有効期間を持つ項目を含み、項目が安定能力仕様を参照します。直接包含では登録同一性が失われます。"));
  };

  const completeTransportAndRecoveryGaps = () => {
    const mcpModuleId = "tool-mcp-transport";
    upsertReviewedConcept({ id: "MCPMessage", moduleId: mcpModuleId, labels: localized("MCP 消息", "MCP message", "MCP メッセージ"), definitions: localized("MCP 消息是在一个协商版本和会话内传输的有身份协议记录，固定消息 id、发送方、接收方、时间和载荷类型；传输规范与消息记录保持分离。", "An MCP message is an identified protocol record transported within one negotiated version and session, fixing message ID, sender, receiver, time, and payload type; transport specification remains separate from the message record.", "MCP メッセージは一つの合意版とセッション内で転送される同一性付きプロトコル記録で、メッセージ id、送信者、受信者、時刻、ペイロード型を固定します。転送仕様とは分離します。"), semanticKind: "information" });
    const messageTypes = [
      ["MCPRequest", "MCP 请求", "MCP request", "MCP 要求", "MCP 请求是要求对端执行一项已声明操作并以同一会话关联 id 返回终止响应的消息。", "An MCP request asks the peer to perform one declared operation and return a terminal response under the same session correlation ID.", "MCP 要求は相手へ宣言済み操作の実行を求め、同じセッション相関 id で終端応答を返させるメッセージです。"],
      ["MCPResponse", "MCP 响应", "MCP response", "MCP 応答", "MCP 响应是以关联 id 终结一个请求并携带结果或协议错误的消息。", "An MCP response is a message that terminates one request by correlation ID and carries either a result or protocol error.", "MCP 応答は相関 id により一つの要求を終結し、結果またはプロトコルエラーを運ぶメッセージです。"],
      ["MCPNotification", "MCP 通知", "MCP notification", "MCP 通知", "MCP 通知是在有效会话或订阅范围内单向发送且不期待配对响应的消息。", "An MCP notification is a one-way message sent within an active session or subscription scope that expects no paired response.", "MCP 通知は有効なセッションまたは購読範囲で一方向送信され、対応応答を期待しないメッセージです。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of messageTypes) {
      upsertReviewedConcept({ id, moduleId: mcpModuleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "information", primaryParentRelationId: `${id}-is_a-MCPMessage` });
      upsertReviewedRelation({ id: `${id}-is_a-MCPMessage`, moduleId: mcpModuleId, predicate: "is_a", sourceId: id, targetId: "MCPMessage", relationKind: "hierarchy", definitions: localized(`${zh}是以响应约定为区分特征的一种 MCP 消息。`, `${en} is an MCP message distinguished by its response contract.`, `${ja}は応答契約で区別される MCP メッセージです。`) });
    }
    upsertReviewedConcept({ id: "MCPSubscription", moduleId: mcpModuleId, labels: localized("MCP 订阅", "MCP subscription", "MCP 購読"), definitions: localized("MCP 订阅是在一个会话内授予特定主题、资源和有效期通知范围的不可变订阅记录，后续取消或断连以新事件终止其有效期。", "An MCP subscription is an immutable record granting notification scope for specified topics, resources, and validity within one session; later cancellation or disconnect terminates its validity by a new event.", "MCP 購読は一つのセッション内で指定トピック、資源、有効期間の通知範囲を与える不変記録で、後続の取消または切断イベントが有効期間を終了します。"), semanticKind: "information" });
    const mcpFacts = [
      ["MCPSession-carries-MCPMessage", "carries", "MCPSession", "MCPMessage", "composition", "MCP 会话承载在其协商版本、参与方和关联 id 范围内有效的消息。", "An MCP session carries messages valid under its negotiated version, participants, and correlation-ID scope.", "MCP セッションは合意版、参加者、相関 id 範囲で有効なメッセージを運びます。"],
      ["MCPRequest-expects-MCPResponse", "expects", "MCPRequest", "MCPResponse", "information", "非通知请求声明一个在同一会话中关联的终止响应约定。", "A non-notification request declares a terminal response contract correlated in the same session.", "通知ではない要求は同一セッション内で相関する終端応答契約を宣言します。"],
      ["MCPResponse-responds_to-MCPRequest", "responds_to", "MCPResponse", "MCPRequest", "information", "MCP 响应通过会话内唯一关联 id 指回其请求。", "An MCP response points to its request through a session-unique correlation ID.", "MCP 応答はセッション内一意の相関 id により要求を指します。"],
      ["MCPSession-establishes-MCPSubscription", "establishes", "MCPSession", "MCPSubscription", "causal", "MCP 会话在能力协商和授权范围内建立订阅记录。", "An MCP session establishes a subscription record within negotiated capability and authorization scope.", "MCP セッションは合意能力と認可範囲内で購読記録を確立します。"],
      ["MCPNotification-belongs_to-MCPSubscription", "belongs_to", "MCPNotification", "MCPSubscription", "information", "订阅通知引用发送时仍有效的订阅身份。", "A subscription notification references the subscription identity effective when it was sent.", "購読通知は送信時に有効な購読同一性を参照します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of mcpFacts) upsertReviewedRelation({ id, moduleId: mcpModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    const interactionReason = localized("MCPInteraction 把不同协议消息笼统并列，无法表达 request/response/notification 的关联约定；v3 由 MCPMessage 分类骨架替代。", "MCPInteraction flattened protocol records and could not express request/response/notification correlation contracts; v3 replaces it with the MCPMessage taxonomy.", "MCPInteraction は異なるプロトコル記録を平坦化し、要求・応答・通知の相関契約を表せないため、v3 は MCPMessage 分類骨格で置換します。");
    deprecateRelation("MCPSamplingRequest-is_a-MCPInteraction", ["MCPSamplingRequest-is_a-MCPRequest"], interactionReason);
    deprecateRelation("MCPElicitation-is_a-MCPInteraction", ["MCPElicitation-is_a-MCPRequest"], interactionReason);
    updateReviewedConcept("MCPSamplingRequest", { primary_parent_relation_id: "MCPSamplingRequest-is_a-MCPRequest", root_status: null });
    updateReviewedConcept("MCPElicitation", { primary_parent_relation_id: "MCPElicitation-is_a-MCPRequest", root_status: null });
    upsertReviewedRelation({ id: "MCPSamplingRequest-is_a-MCPRequest", moduleId: mcpModuleId, predicate: "is_a", sourceId: "MCPSamplingRequest", targetId: "MCPRequest", relationKind: "hierarchy", definitions: localized("MCP 采样请求是要求服务器代表客户端执行模型采样的一种 MCP 请求。", "An MCP sampling request is an MCP request asking the server to perform model sampling on the client's behalf.", "MCP サンプリング要求はサーバーへクライアント代理のモデルサンプリングを求める MCP 要求です。") });
    upsertReviewedRelation({ id: "MCPElicitation-is_a-MCPRequest", moduleId: mcpModuleId, predicate: "is_a", sourceId: "MCPElicitation", targetId: "MCPRequest", relationKind: "hierarchy", definitions: localized("MCP 补充输入请求是要求对端提供缺失结构化输入的一种 MCP 请求。", "MCP elicitation is an MCP request asking the peer for missing structured input.", "MCP 追加入力要求は相手へ不足する構造化入力を求める MCP 要求です。") });
    deprecateConcept("MCPInteraction", ["MCPMessage"], interactionReason);

    const observabilityModuleId = "runtime-observability";
    upsertReviewedConcept({ id: "CheckpointActivity", moduleId: observabilityModuleId, labels: localized("检查点活动", "Checkpoint activity", "チェックポイント活動"), definitions: localized("检查点活动是在一个运行会话中创建、恢复或重放可核验状态边界的活动，活动与其 Checkpoint、Snapshot、Diff 和事件记录分别保留身份。", "A checkpoint activity creates, restores, or replays a verifiable state boundary in a runtime session; the activity and its Checkpoint, Snapshot, Diff, and event records retain separate identities.", "チェックポイント活動は実行セッションで検証可能な状態境界を作成、復元、再生する活動で、活動と Checkpoint、Snapshot、Diff、イベント記録は別々の同一性を保持します。"), semanticKind: "activity" });
    const checkpointActivities = [
      ["RestoreActivity", "恢复活动", "Restore activity", "復元活動", "恢复活动从一个检查点重建后继状态快照，并记录恢复前后的差异。", "A restore activity reconstructs a successor state snapshot from one checkpoint and records the before/after difference.", "復元活動は一つのチェックポイントから後継状態スナップショットを再構築し、復元前後の差分を記録します。"],
      ["ReplayActivity", "回放活动", "Replay activity", "再生活動", "回放活动按已记录的顺序和输入重演轨迹或检查点区间，以验证行为或定位分歧。", "A replay activity re-executes a trace or checkpoint interval under recorded ordering and inputs to verify behavior or locate divergence.", "再生活動は記録済み順序と入力でトレースまたはチェックポイント区間を再実行し、動作検証または差異位置特定を行います。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of checkpointActivities) {
      upsertReviewedConcept({ id, moduleId: observabilityModuleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity", primaryParentRelationId: `${id}-is_a-CheckpointActivity` });
      upsertReviewedRelation({ id: `${id}-is_a-CheckpointActivity`, moduleId: observabilityModuleId, predicate: "is_a", sourceId: id, targetId: "CheckpointActivity", relationKind: "hierarchy", definitions: localized(`${zh}是按状态边界操作方式区分的一种检查点活动。`, `${en} is a checkpoint activity distinguished by how it operates on a state boundary.`, `${ja}は状態境界への操作方法で区別されるチェックポイント活動です。`) });
    }
    const recoveryFacts = [
      ["CheckpointActivity-produces-Checkpoint", "produces", "CheckpointActivity", "Checkpoint", "causal", "创建检查点的活动产生固定会话位置、状态摘要和来源的检查点记录。", "A checkpoint-creation activity produces a checkpoint record fixing session position, state digest, and provenance.", "チェックポイント作成活動はセッション位置、状態要約、出典を固定したチェックポイント記録を生成します。"],
      ["CheckpointRestoreEvent-triggers-RestoreActivity", "triggers", "CheckpointRestoreEvent", "RestoreActivity", "causal", "恢复事件记录恢复请求或开始时点，并触发实际恢复活动。", "A restore event records the restore request or start time and triggers the actual restore activity.", "復元イベントは復元要求または開始時点を記録し、実際の復元活動を起動します。"],
      ["RestoreActivity-consumes-Checkpoint", "consumes", "RestoreActivity", "Checkpoint", "information", "恢复活动读取一个不可变检查点作为状态重建依据。", "A restore activity reads one immutable checkpoint as the basis for state reconstruction.", "復元活動は状態再構築の根拠として一つの不変チェックポイントを読みます。"],
      ["RestoreActivity-produces-StateSnapshot", "produces", "RestoreActivity", "StateSnapshot", "causal", "恢复活动产生具有新身份的后继状态快照。", "A restore activity produces a successor state snapshot with a new identity.", "復元活動は新しい同一性を持つ後継状態スナップショットを生成します。"],
      ["RestoreActivity-produces-StateDiff", "produces", "RestoreActivity", "StateDiff", "causal", "恢复活动产生记录恢复前后状态差异的证据。", "A restore activity produces evidence of the state difference before and after restoration.", "復元活動は復元前後の状態差分証拠を生成します。"],
      ["ReplayEvent-triggers-ReplayActivity", "triggers", "ReplayEvent", "ReplayActivity", "causal", "回放事件记录回放触发时点并启动实际回放活动。", "A replay event records the replay trigger and starts the actual replay activity.", "再生イベントは再生起動時点を記録し、実際の再生活動を開始します。"],
      ["ReplayActivity-uses-TraceRecord", "uses", "ReplayActivity", "TraceRecord", "information", "回放活动使用有序轨迹证据重建操作和输入序列。", "A replay activity uses ordered trace evidence to reconstruct operation and input sequence.", "再生活動は順序付きトレース証拠を使って操作と入力列を再構築します。"],
      ["ReplayActivity-uses-Checkpoint", "uses", "ReplayActivity", "Checkpoint", "information", "回放活动可从固定检查点开始以限制重演区间。", "A replay activity may begin at a fixed checkpoint to bound the replay interval.", "再生活動は再生区間を限定するため固定チェックポイントから開始できます。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of recoveryFacts) upsertReviewedRelation({ id, moduleId: observabilityModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    const eventAgencyReason = localized("恢复与回放事件记录触发或结果，不能执行状态读取和重建；这些动作由 RestoreActivity 与 ReplayActivity 执行。", "Restore and replay events record triggers or outcomes and cannot read or reconstruct state; RestoreActivity and ReplayActivity perform those actions.", "復元・再生イベントは起動または結果を記録し状態読取・再構築を実行できず、RestoreActivity と ReplayActivity が実行します。");
    deprecateRelation("CheckpointRestoreEvent-restores_from-Checkpoint", ["CheckpointRestoreEvent-triggers-RestoreActivity", "RestoreActivity-consumes-Checkpoint"], eventAgencyReason);
    deprecateRelation("ReplayEvent-replays-TraceRecord", ["ReplayEvent-triggers-ReplayActivity", "ReplayActivity-uses-TraceRecord"], eventAgencyReason);
  };

  const completePolicyEffectAndProjectionGaps = () => {
    const policyModuleId = "safety-permission-policy";
    upsertReviewedConcept({ id: "AuthorizationRequest", moduleId: policyModuleId, labels: localized("授权请求", "Authorization request", "認可要求"), definitions: localized("授权请求是把请求主体、资源、动作、作用域、目的和时间绑定为一次策略评估输入的不可变信息记录；它不等于授权授予。", "An authorization request is an immutable information record binding subject, resource, action, scope, purpose, and time as input to one policy evaluation; it is not an authorization grant.", "認可要求は主体、資源、操作、範囲、目的、時刻を一回のポリシー評価入力へ束ねる不変情報記録で、認可付与とは異なります。"), semanticKind: "information" });
    upsertReviewedConcept({ id: "PolicyEvaluation", moduleId: policyModuleId, labels: localized("策略评估活动", "Policy evaluation activity", "ポリシー評価活動"), definitions: localized("策略评估活动在指定策略版本、规则、条件和例外下判断一项授权请求，并产生可追溯的允许、拒绝或升级决定。", "A policy-evaluation activity judges one authorization request under a specified policy version, rules, conditions, and exceptions and produces a traceable allow, deny, or escalation decision.", "ポリシー評価活動は指定ポリシー版、規則、条件、例外の下で一つの認可要求を判断し、追跡可能な許可、拒否、エスカレーション判断を生成します。"), semanticKind: "activity" });
    upsertReviewedConcept({ id: "AuthorizationRevocation", moduleId: policyModuleId, labels: localized("授权撤销事件", "Authorization revocation event", "認可取消イベント"), definitions: localized("授权撤销事件记录谁在何时依据什么权限终止一项授权授予的后续有效期；历史授予和已发生行为的证据不被删除。", "An authorization-revocation event records who terminated the future validity of an authorization grant, when, and under what authority; historical grant and performed-action evidence is retained.", "認可取消イベントは誰がいつどの権限で認可付与の将来有効期間を終了したかを記録し、履歴付与と実行済み操作証拠を削除しません。"), semanticKind: "event" });
    upsertReviewedConcept({ id: "HumanApproval", moduleId: policyModuleId, labels: localized("人工批准事件", "Human approval event", "人間承認イベント"), definitions: localized("人工批准事件记录具备相应权限的人在特定请求、作用域和有效期上作出的批准；它不是可复用授权凭据，也不是策略决定的子类。", "A human-approval event records an approval made by an authorized person for a specific request, scope, and validity interval; it is neither a reusable credential nor a subtype of policy decision.", "人間承認イベントは権限を持つ人が特定要求、範囲、有効期間について行った承認を記録し、再利用可能資格情報でもポリシー判断の下位型でもありません。"), semanticKind: "event" });
    const policyFacts = [
      ["PolicySpecification-contains-PolicyRule", "contains", "PolicySpecification", "PolicyRule", "composition", "策略规范包含可独立引用和排序的策略规则，规则是规范组成而非规范子类。", "A policy specification contains independently referable and ordered policy rules; a rule is a specification part rather than a subtype of the whole.", "ポリシー仕様は独立参照・順序付け可能な規則を含み、規則は全体仕様の下位型ではなく構成部です。"],
      ["PolicyRule-has_exception-PolicyException", "has_exception", "PolicyRule", "PolicyException", "composition", "策略规则明确关联仅在限定条件下适用的例外。", "A policy rule explicitly associates exceptions that apply only under bounded conditions.", "ポリシー規則は限定条件でのみ適用する例外を明示的に関連付けます。"],
      ["AuthorizationRequest-precedes-PolicyEvaluation", "precedes", "AuthorizationRequest", "PolicyEvaluation", "temporal", "不可变授权请求必须在使用该请求的策略评估开始前存在。", "The immutable authorization request exists before the policy evaluation that consumes it starts.", "不変認可要求はそれを消費するポリシー評価の開始前に存在します。"],
      ["PolicyEvaluation-consumes-AuthorizationRequest", "consumes", "PolicyEvaluation", "AuthorizationRequest", "information", "策略评估读取一个主体、资源、动作和作用域均已固定的授权请求。", "A policy evaluation reads one authorization request with fixed subject, resource, action, and scope.", "ポリシー評価は主体、資源、操作、範囲が固定された一つの認可要求を読みます。"],
      ["PolicyEvaluation-uses-PolicySpecification", "uses", "PolicyEvaluation", "PolicySpecification", "governance", "策略评估固定使用一个可追溯版本的策略规范。", "A policy evaluation uses one traceable version of a policy specification.", "ポリシー評価は追跡可能な一つのポリシー仕様版を使用します。"],
      ["PolicyEvaluation-produces-PolicyDecision", "produces", "PolicyEvaluation", "PolicyDecision", "causal", "策略评估产生保存适用规则、输入证据和理由的策略决定。", "A policy evaluation produces a policy decision retaining applicable rules, input evidence, and rationale.", "ポリシー評価は適用規則、入力証拠、理由を保持するポリシー判断を生成します。"],
      ["PolicyDecision-governs-Execution", "governs", "PolicyDecision", "Execution", "governance", "策略决定规定相关执行可继续、必须停止或需要升级审批。", "A policy decision determines whether the related execution may proceed, must stop, or requires escalated approval.", "ポリシー判断は関連実行が継続可能、停止必須、追加承認必要のいずれかを規定します。"],
      ["HumanApproval-authorizes-AuthorizationGrant", "authorizes", "HumanApproval", "AuthorizationGrant", "governance", "人工批准事件在其明确作用域和有效期内授权产生一项授予记录。", "A human-approval event authorizes creation of a grant within its explicit scope and validity interval.", "人間承認イベントは明示範囲と有効期間内で付与記録の作成を認可します。"],
      ["AuthorizationRevocation-revokes-AuthorizationGrant", "revokes", "AuthorizationRevocation", "AuthorizationGrant", "governance", "授权撤销事件终止授予的后续有效期而保留历史记录。", "An authorization-revocation event terminates a grant's future validity while retaining history.", "認可取消イベントは履歴を保持しつつ付与の将来有効期間を終了します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of policyFacts) upsertReviewedRelation({ id, moduleId: policyModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    const policyPartReason = localized("策略规则、条件、动作和例外是策略规范的组成或约束，不是整个策略规范的种类；v3 用 contains/has_condition/prescribes/has_exception 表达。", "Policy rules, conditions, actions, and exceptions are parts or constraints of a policy specification, not kinds of the whole; v3 uses contains/has_condition/prescribes/has_exception.", "ポリシー規則、条件、操作、例外はポリシー仕様の構成または制約で全体の種類ではなく、v3 は contains/has_condition/prescribes/has_exception で表します。");
    for (const relationId of ["PolicyRule-is_a-PolicySpecification", "PolicyCondition-is_a-PolicySpecification", "PolicyAction-is_a-PolicySpecification", "PolicyException-is_a-PolicySpecification"]) deprecateRelation(relationId, ["PolicySpecification-contains-PolicyRule", "PolicyRule-has_condition-PolicyCondition", "PolicyRule-prescribes-PolicyAction", "PolicyRule-has_exception-PolicyException"], policyPartReason);
    deprecateRelation("HumanApproval-is_a-AuthorizationArtifact", ["HumanApproval-authorizes-AuthorizationGrant"], localized("人工批准是发生在特定请求上的事件，不是授权凭据或信息产物的子类。", "Human approval is an event for a specific request, not a subtype of authorization credential or information artifact.", "人間承認は特定要求で発生するイベントで、認可資格情報や情報成果物の下位型ではありません。"));

    const effectModuleId = "safety-commit-redaction";
    const effectModule = moduleDocuments.get(effectModuleId).document.module;
    const effectClaims = claimsFor(effectModule, effectModule);
    upsertReviewedConcept({
      id: "EffectReceipt",
      moduleId: effectModuleId,
      labels: localized("外部效果回执", "External effect receipt", "外部効果受領証"),
      definitions: localized("外部效果回执是外部系统确认一项副作用实际提交后的不可变审计信息，固定回执身份、幂等键、效果摘要、提交时间和外部确认标识；预览结果不能充当回执。", "An external-effect receipt is immutable audit information by which an external system confirms that a side effect was actually committed, fixing receipt identity, idempotency key, effect digest, commit time, and external confirmation identifier; a preview result cannot serve as a receipt.", "外部効果受領証は外部システムが副作用の実際の確定を確認する不変監査情報で、受領証同一性、冪等キー、効果要約、確定時刻、外部確認識別子を固定します。プレビュー結果は受領証になりません。"),
      semanticKind: "information",
      structure: {
        identity_keys: ["receipt_id"],
        fields: [
          { id: "receipt_id", labels: localized("回执标识", "receipt ID", "受領証 ID"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("外部效果回执的稳定唯一标识。", "Stable unique identifier of the external-effect receipt.", "外部効果受領証の安定一意識別子です。"), allowed_values: [], pattern: null, example_value: "effect-receipt-7f3a", source_claims: effectClaims },
          { id: "idempotency_key", labels: localized("幂等键", "idempotency key", "冪等キー"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("在授权作用域内防止重复提交同一外部效果的键。", "Key preventing duplicate commit of the same external effect within an authority scope.", "権限範囲内で同じ外部効果の重複確定を防ぐキーです。"), allowed_values: [], pattern: null, example_value: "commit:invoice:8842", source_claims: effectClaims },
          { id: "effect_digest", labels: localized("效果摘要", "effect digest", "効果要約"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("已确认外部效果规范化表示的摘要。", "Digest of the normalized representation of the confirmed external effect.", "確認済み外部効果の正規化表現要約です。"), allowed_values: [], pattern: null, example_value: "sha256:4e98...", source_claims: effectClaims },
        ],
        constraints: [],
        required_relation_constraints: [],
      },
    });
    upsertReviewedRelation({ id: "EffectReceipt-evidences-SideEffect", moduleId: effectModuleId, predicate: "evidences", sourceId: "EffectReceipt", targetId: "SideEffect", relationKind: "information", definitions: localized("外部效果回执以幂等键、效果摘要和外部确认标识证明某项副作用已经实际提交。", "An external-effect receipt evidences that a side effect was actually committed through idempotency key, effect digest, and external confirmation identifier.", "外部効果受領証は冪等キー、効果要約、外部確認識別子により副作用が実際に確定したことを証明します。") });

    const projectionModuleId = "adapter-schema-export";
    const projectionModule = moduleDocuments.get(projectionModuleId).document.module;
    const projectionClaims = claimsFor(projectionModule, projectionModule);
    const existingSchemaAdapter = allConcepts().get("SchemaAdapter");
    if (!existingSchemaAdapter) throw new Error("SchemaAdapter is missing");
    const schemaArtifactConstraint = existingSchemaAdapter.structure?.required_relation_constraints?.find(({ id }) => id === "schema-adapter-produces-artifact");
    upsertReviewedConcept({ id: "ProjectionAdapter", moduleId: projectionModuleId, labels: localized("投影适配器", "Projection adapter", "投影アダプター"), definitions: localized("投影适配器是把 canonical 本体合同映射到一种目标表示并明确不可表达语义与往返损失的能力；它规定投影方法，但不亲自执行导出。", "A projection adapter is a capability that maps the canonical ontology contract to one target representation and makes inexpressible semantics and round-trip loss explicit; it specifies projection but does not execute export.", "投影アダプターは canonical 本体契約を一つの対象表現へ写像し、表現不能意味と往復損失を明示する能力で、投影方法を規定しますが出力を実行しません。"), semanticKind: "capability", primaryParentRelationId: "ProjectionAdapter-is_a-Adapter" });
    upsertReviewedRelation({ id: "ProjectionAdapter-is_a-Adapter", moduleId: projectionModuleId, predicate: "is_a", sourceId: "ProjectionAdapter", targetId: "Adapter", relationKind: "hierarchy", definitions: localized("投影适配器是以目标表示和往返语义保持为区分特征的一种适配器。", "A projection adapter is an Adapter distinguished by target representation and round-trip semantic preservation.", "投影アダプターは対象表現と往復意味保持で区別される Adapter です。") });
    const adapterFamilies = [
      ["StructuralSchemaAdapter", "结构模式适配器", "Structural schema adapter", "構造スキーマアダプター", "结构模式适配器投影对象结构、字段、类型、必填项与值约束。", "A structural-schema adapter projects object structure, fields, types, requiredness, and value constraints.", "構造スキーマアダプターはオブジェクト構造、項目、型、必須性、値制約を投影します。"],
      ["SemanticGraphAdapter", "语义图适配器", "Semantic graph adapter", "意味グラフアダプター", "语义图适配器投影概念身份、分类、关系方向、基数与图约束。", "A semantic-graph adapter projects concept identity, taxonomy, relation direction, cardinality, and graph constraints.", "意味グラフアダプターは概念同一性、分類、関係方向、基数、グラフ制約を投影します。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of adapterFamilies) {
      upsertReviewedConcept({ id, moduleId: projectionModuleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "capability", primaryParentRelationId: `${id}-is_a-ProjectionAdapter` });
      upsertReviewedRelation({ id: `${id}-is_a-ProjectionAdapter`, moduleId: projectionModuleId, predicate: "is_a", sourceId: id, targetId: "ProjectionAdapter", relationKind: "hierarchy", definitions: localized(`${zh}是按目标表示语义范围区分的一种投影适配器。`, `${en} is a projection adapter distinguished by the semantic scope of its target representation.`, `${ja}は対象表現の意味範囲で区別される投影アダプターです。`) });
    }
    updateReviewedConcept("SchemaAdapter", {
      primary_parent_relation_id: "SchemaAdapter-is_a-ProjectionAdapter",
      root_status: null,
      structure: {
        ...existingSchemaAdapter.structure,
        required_relation_constraints: (existingSchemaAdapter.structure?.required_relation_constraints ?? []).filter(({ id }) => id !== "schema-adapter-produces-artifact"),
      },
    });
    upsertReviewedRelation({ id: "SchemaAdapter-is_a-ProjectionAdapter", moduleId: projectionModuleId, predicate: "is_a", sourceId: "SchemaAdapter", targetId: "ProjectionAdapter", relationKind: "hierarchy", definitions: localized("模式适配器是面向机器可读模式语言的一种投影适配器。", "A schema adapter is a projection adapter targeting a machine-readable schema language.", "スキーマアダプターは機械可読スキーマ言語を対象とする投影アダプターです。") });
    const adapterParents = new Map([
      ["JSONSchemaAdapter", "StructuralSchemaAdapter"], ["ZodProfileAdapter", "StructuralSchemaAdapter"], ["PydanticProfileAdapter", "StructuralSchemaAdapter"],
      ["OWLExportAdapter", "SemanticGraphAdapter"], ["SHACLExportAdapter", "SemanticGraphAdapter"], ["ShExExportAdapter", "SemanticGraphAdapter"],
      ["GraphIRAdapter", "ProjectionAdapter"], ["FrontendViewAdapter", "ProjectionAdapter"],
    ]);
    for (const [adapterId, parentId] of adapterParents) {
      const oldRelationId = `${adapterId}-is_a-SchemaAdapter`;
      const newRelationId = `${adapterId}-is_a-${parentId}`;
      deprecateRelation(oldRelationId, [newRelationId], localized("v3 按结构模式、语义图、GraphIR 与前端视图的目标语义范围重组投影适配器。", "v3 reorganizes projection adapters by target semantic scope: structural schema, semantic graph, GraphIR, and frontend view.", "v3 は構造スキーマ、意味グラフ、GraphIR、フロントエンド表示という対象意味範囲で投影アダプターを再編します。"));
      updateReviewedConcept(adapterId, { primary_parent_relation_id: newRelationId, root_status: null });
      upsertReviewedRelation({ id: newRelationId, moduleId: projectionModuleId, predicate: "is_a", sourceId: adapterId, targetId: parentId, relationKind: "hierarchy", definitions: localized(`${allConcepts().get(adapterId).labels.zh}是以其目标格式能力为区分特征的一种${allConcepts().get(parentId).labels.zh}。`, `${allConcepts().get(adapterId).labels.en} is a ${allConcepts().get(parentId).labels.en} distinguished by its target-format capabilities.`, `${allConcepts().get(adapterId).labels.ja}は対象形式能力で区別される${allConcepts().get(parentId).labels.ja}です。`) });
    }
    upsertReviewedConcept({
      id: "SchemaProjectionRun",
      moduleId: projectionModuleId,
      labels: localized("模式投影运行", "Schema projection run", "スキーマ投影実行"),
      definitions: localized("模式投影运行是在固定 canonical 来源指纹、投影适配器、映射规则和目标版本下执行一次导出并产生有身份模式产物的活动。", "A schema-projection run is an activity that executes one export under a fixed canonical source fingerprint, projection adapter, mapping rules, and target version and produces an identified schema artifact.", "スキーマ投影実行は固定 canonical 出典指紋、投影アダプター、写像規則、対象版の下で一回の出力を実行し、同一性付きスキーマ成果物を生成する活動です。"),
      semanticKind: "activity",
      structure: {
        identity_keys: ["projection_run_id"],
        fields: [{ id: "projection_run_id", labels: localized("投影运行标识", "projection run ID", "投影実行 ID"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("一次模式投影运行的稳定唯一标识。", "Stable unique identifier of one schema-projection run.", "一回のスキーマ投影実行の安定一意識別子です。"), allowed_values: [], pattern: null, example_value: "schema-projection-20260714-01", source_claims: projectionClaims }],
        constraints: [],
        required_relation_constraints: [{
          id: "schema-projection-run-produces-artifact",
          direction: "outgoing",
          predicate: "produces",
          target_concept_id: "SchemaArtifact",
          cardinality: schemaArtifactConstraint?.cardinality ?? { min: 1, max: null },
          explanations: localized("每次成功的模式投影运行至少产生一个有身份、版本和来源指纹的 SchemaArtifact。", "Each successful schema-projection run produces at least one identity-bearing, versioned SchemaArtifact with a source fingerprint.", "成功した各スキーマ投影実行は同一性、版、出典指紋を持つ SchemaArtifact を少なくとも一つ生成します。"),
          source_claims: (schemaArtifactConstraint?.source_claims ?? projectionClaims).map((claim) => ({
            ...claim,
            supports: "Supports the reviewed SchemaProjectionRun.produces SchemaArtifact constraint; the Moonweave activity boundary and cardinality are an accepted design inference over this registered evidence.",
          })),
        }],
      },
    });
    const projectionFacts = [
      ["SchemaProjectionRun-uses-ProjectionAdapter", "uses", "SchemaProjectionRun", "ProjectionAdapter", "governance", "模式投影运行固定使用一个与目标格式和版本兼容的投影适配器。", "A schema-projection run uses one projection adapter compatible with the target format and version.", "スキーマ投影実行は対象形式と版に互換な一つの投影アダプターを使用します。"],
      ["SchemaProjectionRun-applies-MappingRule", "applies", "SchemaProjectionRun", "MappingRule", "governance", "模式投影运行应用有版本范围和损失说明的映射规则。", "A schema-projection run applies mapping rules with version scope and loss declarations.", "スキーマ投影実行は版範囲と損失宣言を持つ写像規則を適用します。"],
      ["SchemaProjectionRun-produces-SchemaArtifact", "produces", "SchemaProjectionRun", "SchemaArtifact", "causal", "模式投影运行产生保留来源指纹、目标配置、版本和损失报告的模式产物。", "A schema-projection run produces a schema artifact retaining source fingerprint, target profile, version, and loss report.", "スキーマ投影実行は出典指紋、対象プロファイル、版、損失報告を保持するスキーマ成果物を生成します。"],
      ["SchemaProjectionRun-projects-Tool", "projects", "SchemaProjectionRun", "Tool", "information", "当目标是工具合同投影时，投影运行读取 Tool 的 canonical 定义而不改变其所有权。", "When projecting a tool contract, the run reads the canonical Tool definition without changing its ownership.", "ツール契約を投影する場合、実行は所有権を変えず canonical Tool 定義を読みます。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of projectionFacts) {
      upsertReviewedRelation({
        id,
        moduleId: projectionModuleId,
        predicate,
        sourceId,
        targetId,
        relationKind,
        definitions: localized(zh, en, ja),
        cardinality: id === "SchemaProjectionRun-produces-SchemaArtifact"
          ? {
              source: { min: 0, max: null },
              target: { ...(schemaArtifactConstraint?.cardinality ?? { min: 1, max: null }) },
            }
          : undefined,
      });
    }
    const adapterAgencyReason = localized("投影适配器规定转换能力和配置但不执行导出；模式投影运行应用规则、读取来源并产生模式产物。", "A projection adapter specifies conversion capability and configuration but does not execute export; SchemaProjectionRun applies rules, reads sources, and produces artifacts.", "投影アダプターは変換能力と設定を規定しますが出力を実行せず、SchemaProjectionRun が規則適用、出典読取、成果物生成を行います。");
    deprecateRelation("SchemaAdapter-produces-SchemaArtifact", ["SchemaProjectionRun-produces-SchemaArtifact"], adapterAgencyReason);
    deprecateRelation("SchemaAdapter-governed_by-MappingRule", ["SchemaProjectionRun-applies-MappingRule"], adapterAgencyReason);
    deprecateRelation("SchemaAdapter-projects-Tool", ["SchemaProjectionRun-projects-Tool"], adapterAgencyReason);
  };

  const migrateWorkerRole = () => {
    const old = allConcepts().get("WorkerAgent");
    if (!old) throw new Error("WorkerAgent is missing");
    const moduleId = "orchestration-actors-delegation";
    const module = moduleDocuments.get(moduleId).document.module;
    const sourceClaims = claimsFor(old, module);
    const review = reviewFor(module.plane_id, localized(
      "工作者描述可由不同 Actor 承担的协调职责；新建 WorkerRole，并正式弃用把角色误称为 Agent 的旧 ID。",
      "Worker denotes a coordination responsibility borne by different actors; WorkerRole replaces the old ID that mislabeled the role as an Agent.",
      "Worker は複数の Actor が担える協調責務であり、ロールを Agent と誤称した旧 ID を WorkerRole で置換します。",
    ));
    const role = makeConcept({
      id: "WorkerRole", moduleId,
      labels: localized("工作者角色", "Worker role", "ワーカーロール"),
      definitions: localized("工作者角色是接收有范围工作、执行约定任务并返回证据的协调角色，可由 Agent、模型服务或工具服务承担。", "Worker role is a coordination role that accepts scoped work, performs agreed tasks, and returns evidence; it may be borne by an agent, model service, or tool service.", "ワーカーロールは範囲付き作業を受け、合意したタスクを実行し、証拠を返す協調ロールで、Agent、モデルサービス、ツールサービスが担えます。"),
      semanticKind: "role", sourceClaims, review, primaryParentRelationId: "WorkerRole-is_a-CoordinationRole",
    });
    addConceptTo(moduleId, role);
    addRelationTo(moduleId, makeRelation({
      id: "WorkerRole-is_a-CoordinationRole", predicate: "is_a", sourceId: "WorkerRole", targetId: "CoordinationRole", relationKind: "hierarchy",
      definitions: localized("工作者角色是一种以接收和完成范围化工作为区分特征的协调角色。", "Worker role is a coordination role distinguished by accepting and completing scoped work.", "ワーカーロールは範囲付き作業の受領と完了を種差とする協調ロールです。"), sourceClaims, review,
    }));
    old.status = "deprecated";
    old.primary_parent_relation_id = null;
    old.root_status = "composition-root";
    old.lexical_aliases = [{ language: "en", value: "WorkerAgent", alias_kind: "legacy-label" }];
    old.sibling_differentiation = [];
    old.examples = [];
    old.deprecated_in = VERSION_IRI;
    old.replaced_by_ids = ["WorkerRole"];
    old.deprecation_reason = localized("该 ID 把可由多类主体承担的角色误称为 Agent。", "The ID mislabeled a role borne by multiple actor kinds as an Agent.", "複数種の主体が担うロールを Agent と誤称していました。"),
    old.review = review;
    old.change_note = old.deprecation_reason;
    const owner = locateRelationOwner("WorkerAgent-is_a-CoordinationRole");
    owner.entry.document.relations.splice(owner.index, 1);

    for (const { document } of moduleDocuments.values()) {
      for (const relation of document.relations) {
        if (relation.source_id === "WorkerAgent") relation.source_id = "WorkerRole";
        if (relation.target_id === "WorkerAgent") relation.target_id = "WorkerRole";
        const replaceText = (value) => typeof value === "string" ? value.replaceAll("WorkerAgent", "WorkerRole") : value;
        relation.source_claims = relation.source_claims.map((claim) => ({ ...claim, supports: replaceText(claim.supports) }));
        relation.examples = relation.examples.map((example) => ({
          ...example,
          related_node_ids: example.related_node_ids.map((id) => id === "WorkerAgent" ? "WorkerRole" : id),
          descriptions: Object.fromEntries(Object.entries(example.descriptions).map(([language, value]) => [language, replaceText(value)])),
        }));
      }
      for (const concept of document.classes) {
        if (concept.id === "WorkerAgent") continue;
        for (const example of concept.examples ?? []) {
          example.related_node_ids = example.related_node_ids.map((id) => id === "WorkerAgent" ? "WorkerRole" : id);
        }
      }
    }
  };

  const repairFinalResidualAgencySemantics = () => {
    const suppressionReason = localized(
      "ContextSelectionDecision 是选择与抑制依据的信息记录，不能执行 suppress；DisclosureSuppressionActivity 应用该决定并产生可审计记录。",
      "ContextSelectionDecision is an information record of selection and suppression grounds and cannot perform suppression; DisclosureSuppressionActivity applies the decision and produces auditable evidence.",
      "ContextSelectionDecision は選択・抑制根拠の情報記録であり suppress を実行できません。DisclosureSuppressionActivity が判断を適用し監査可能な証拠を生成します。",
    );
    deprecateRelation("ContextSelectionDecision-suppresses-SuppressedContext", [
      "DisclosureSuppressionActivity-governed_by-ContextSelectionDecision",
      "DisclosureSuppressionActivity-suppresses-SuppressedContext",
      "DisclosureRecord-records_decision-ContextSelectionDecision",
    ], suppressionReason);
    if (allRelations().has("ContextSelectionDecision-suppresses-SuppressedContext")) {
      const deprecatedSuppression = locateRelationOwner(
        "ContextSelectionDecision-suppresses-SuppressedContext",
      );
      deprecatedSuppression.entry.document.relations[deprecatedSuppression.index] = {
        ...deprecatedSuppression.entry.document.relations[deprecatedSuppression.index],
        examples: deprecatedSuppression.entry.document.relations[
          deprecatedSuppression.index
        ].examples.filter(({ id }) => !id.startsWith("excluded_from_context-example-")),
      };
    }
    updateReviewedConcept("ContextSelectionDecision", {
      short_definitions: localized("上下文选择决定是规定披露选择、截断或抑制依据的信息记录。", "A context-selection decision is an information record specifying grounds for disclosure selection, truncation, or suppression.", "文脈選択判断は開示選択、切詰め、抑制の根拠を規定する情報記録です。"),
      definitions: localized("上下文选择决定记录候选输出、可见窗口、策略依据和预期披露结果；它治理披露活动，但不亲自执行选择、截断或抑制。", "A context-selection decision records candidate output, visible window, policy basis, and intended disclosure outcome; it governs disclosure activity but does not itself select, truncate, or suppress content.", "文脈選択判断は候補出力、可視窓、方針根拠、予定開示結果を記録します。開示活動を統治しますが、自ら選択、切詰め、抑制を実行しません。"),
    });
    const suppressionFacts = [
      ["DisclosureSuppressionActivity-governed_by-ContextSelectionDecision", "governed_by", "DisclosureSuppressionActivity", "ContextSelectionDecision", "governance", "披露抑制活动必须引用规定候选范围、策略依据和预期结果的上下文选择决定。", "A disclosure-suppression activity must reference the context-selection decision fixing candidate scope, policy basis, and intended outcome.", "開示抑制活動は候補範囲、方針根拠、予定結果を固定する文脈選択判断を参照します。"],
      ["DisclosureSuppressionActivity-suppresses-SuppressedContext", "suppresses", "DisclosureSuppressionActivity", "SuppressedContext", "causal", "披露抑制活动执行决定并形成不进入已披露输出的受抑制上下文。", "A disclosure-suppression activity applies the decision and forms suppressed context that does not enter disclosed output.", "開示抑制活動は判断を適用し、開示出力に入らない抑制済み文脈を形成します。"],
      ["DisclosureRecord-records_decision-ContextSelectionDecision", "records_decision", "DisclosureRecord", "ContextSelectionDecision", "information", "披露记录引用决定本次显示、截断或抑制结果的上下文选择决定。", "A disclosure record references the context-selection decision that determined whether content was shown, truncated, or suppressed.", "開示記録は表示、切詰め、抑制を決めた文脈選択判断を参照します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of suppressionFacts) upsertReviewedRelation({ id, moduleId: "info-output-disclosure", predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    const suppressionRelation = locateRelationOwner(
      "DisclosureSuppressionActivity-suppresses-SuppressedContext",
    );
    const suppressionCanonicalId =
      "DisclosureSuppressionActivity-suppresses-SuppressedContext";
    const legacyPredicate = "excluded_from_context";
    const legacySuppressionExamples = ["positive", "boundary"].map((kind) => ({
      id: `${legacyPredicate}-example-${kind}-001`,
      kind,
      labels: localized(
        `${legacyPredicate} 的 canonical 边信息`,
        `${legacyPredicate} information on its canonical edge`,
        `${legacyPredicate} の canonical 辺情報`,
      ),
      scenario_id: null,
      descriptions: localized(
        `旧谓词 ${legacyPredicate} 仅作为迁移信息附着于 canonical 关系 ${suppressionCanonicalId}；执行抑制的主体是 DisclosureSuppressionActivity。`,
        `Legacy predicate ${legacyPredicate} is retained only as migration information on canonical relation ${suppressionCanonicalId}; DisclosureSuppressionActivity is the actor that performs suppression.`,
        `旧述語 ${legacyPredicate} は canonical 関係 ${suppressionCanonicalId} の移行情報としてのみ保持され、抑制を実行する主体は DisclosureSuppressionActivity です。`,
      ),
      field_values: {},
      related_node_ids: ["DisclosureSuppressionActivity", "SuppressedContext"],
      related_relation_ids: [suppressionCanonicalId],
      expected_result: localized(
        `查询 ${legacyPredicate} 必须解析到 ${suppressionCanonicalId}，不得恢复已弃用的决定记录执行边。`,
        `A query for ${legacyPredicate} must resolve to ${suppressionCanonicalId} and must not restore the deprecated decision-record execution edge.`,
        `${legacyPredicate} の照会は ${suppressionCanonicalId} に解決され、廃止済みの判断記録による実行辺を復元してはなりません。`,
      ),
      why_valid_or_invalid: localized(
        `${legacyPredicate} 与 ${suppressionCanonicalId} 同时可见，是为了迁移可发现性；唯一 accepted 事实仍是活动到受抑制上下文的有向关系。`,
        `${legacyPredicate} and ${suppressionCanonicalId} are both visible for migration discoverability; the only accepted fact remains the directed activity-to-suppressed-context relation.`,
        `${legacyPredicate} と ${suppressionCanonicalId} は移行時の発見可能性のため併記されますが、唯一の accepted 事実は活動から抑制済み文脈への有向関係です。`,
      ),
      synthetic: true,
      verified_version: VERSION_IRI,
      source_claims: structuredClone(
        suppressionRelation.entry.document.relations[suppressionRelation.index].source_claims,
      ),
    }));
    suppressionRelation.entry.document.relations[suppressionRelation.index] = {
      ...suppressionRelation.entry.document.relations[suppressionRelation.index],
      examples: [
        ...suppressionRelation.entry.document.relations[suppressionRelation.index].examples,
        ...legacySuppressionExamples,
      ],
    };

    const completionReason = localized("TaskCompletionCriterion 是完成条件规范，不能执行 evaluates；EvaluationRun 读取该规范并评估 RunOutcome。", "TaskCompletionCriterion is a completion-condition specification and cannot perform evaluation; EvaluationRun reads it and evaluates RunOutcome.", "TaskCompletionCriterion は完了条件仕様で evaluates を実行できず、EvaluationRun が仕様を読み RunOutcome を評価します。");
    deprecateRelation("TaskCompletionCriterion-evaluates-RunOutcome", ["EvaluationRun-uses-TaskCompletionCriterion", "EvaluationRun-evaluates-RunOutcome"], completionReason);
    updateReviewedConcept("TaskCompletionCriterion", {
      short_definitions: localized("任务完成准则是供评估运行使用的完成条件规范。", "A task-completion criterion is a completion-condition specification used by evaluation runs.", "タスク完了基準は評価実行が使用する完了条件仕様です。"),
      definitions: localized("任务完成准则规定某类任务达到完成状态所需的可检验条件、阈值和证据要求；它由 EvaluationRun 应用，而不自行评估运行结局。", "A task-completion criterion specifies testable conditions, thresholds, and evidence required for a task to be complete; EvaluationRun applies it rather than the criterion evaluating a run outcome itself.", "タスク完了基準はタスク完了に必要な検査可能条件、閾値、証拠要件を規定し、基準自体ではなく EvaluationRun が実行結果へ適用します。"),
    });
    upsertReviewedRelation({ id: "EvaluationRun-uses-TaskCompletionCriterion", moduleId: "feedback-metrics-evaluation", predicate: "uses", sourceId: "EvaluationRun", targetId: "TaskCompletionCriterion", relationKind: "governance", definitions: localized("评估运行使用任务完成准则固定本次结局判定所需的条件、阈值和证据。", "An evaluation run uses a task-completion criterion to fix conditions, thresholds, and evidence for outcome adjudication.", "評価実行はタスク完了基準を使い、結果判定の条件、閾値、証拠を固定します。") });
    upsertReviewedRelation({ id: "EvaluationRun-evaluates-RunOutcome", moduleId: "feedback-metrics-evaluation", predicate: "evaluates", sourceId: "EvaluationRun", targetId: "RunOutcome", relationKind: "causal", definitions: localized("评估运行依据适用的完成准则、测量和证据评估运行结局。", "An evaluation run evaluates a run outcome against applicable completion criteria, measurements, and evidence.", "評価実行は適用される完了基準、測定、証拠に基づき実行結果を評価します。") });

    const taskStepReason = localized("TaskStep 是声明性工作规范，不能 invokes ToolCall；它规定 ToolCallPlan，后者再计划具有执行身份的 ToolCall。", "TaskStep is a declarative work specification and cannot invoke ToolCall; it specifies a ToolCallPlan, which in turn plans the identity-bearing ToolCall.", "TaskStep は宣言的作業仕様で ToolCall を invokes できません。ToolCallPlan を規定し、計画が実行同一性を持つ ToolCall を計画します。");
    deprecateRelation("TaskStep-invokes-ToolCall", ["TaskStep-specifies-ToolCallPlan", "ToolCallPlan-plans-ToolCall"], taskStepReason);
    updateReviewedConcept("TaskStep", {
      short_definitions: localized("任务步骤是任务计划中的声明性工作单元。", "A task step is a declarative work unit within a task plan.", "タスク手順はタスク計画内の宣言的作業単位です。"),
      definitions: localized("任务步骤规定顺序、依赖、负责人、完成证据以及可选的调用计划；它不执行工具调用，执行身份由 ToolCall 与 ToolCallAttempt 承担。", "A task step specifies ordering, dependencies, owner, completion evidence, and an optional invocation plan; it does not execute a tool call, whose execution identity belongs to ToolCall and ToolCallAttempt.", "タスク手順は順序、依存、担当者、完了証拠、任意の呼出し計画を規定します。ツール呼出しは実行せず、実行同一性は ToolCall と ToolCallAttempt が担います。"),
    });
    upsertReviewedRelation({ id: "TaskStep-specifies-ToolCallPlan", moduleId: "orchestration-task-planning", predicate: "specifies", sourceId: "TaskStep", targetId: "ToolCallPlan", relationKind: "mapping", definitions: localized("需要工具工作的任务步骤规定调用目标、参数约束和前置条件组成的工具调用计划。", "A task step requiring tool work specifies a tool-call plan containing invocation target, argument constraints, and preconditions.", "ツール作業を要するタスク手順は呼出し対象、引数制約、前提条件からなるツール呼出し計画を規定します。") });

    const checkpointReason = localized("Checkpoint 是状态边界信息记录，不能执行 captures；CheckpointActivity 捕获快照并产生 Checkpoint，Checkpoint 仅引用该快照。", "Checkpoint is an information record of a state boundary and cannot perform capture; CheckpointActivity captures the snapshot and produces Checkpoint, which only references that snapshot.", "Checkpoint は状態境界の情報記録で captures を実行できません。CheckpointActivity がスナップショットを取得し Checkpoint を生成し、Checkpoint はそのスナップショットを参照するだけです。");
    deprecateRelation("Checkpoint-captures-StateSnapshot", ["CheckpointActivity-captures-StateSnapshot", "CheckpointActivity-produces-Checkpoint", "Checkpoint-references-StateSnapshot"], checkpointReason);
    updateReviewedConcept("Checkpoint", {
      short_definitions: localized("检查点是引用可恢复状态快照的不可变状态边界记录。", "A checkpoint is an immutable state-boundary record referencing a recoverable state snapshot.", "チェックポイントは復元可能な状態スナップショットを参照する不変状態境界記録です。"),
      definitions: localized("检查点记录会话、版本、创建活动、状态摘要和所引用的 StateSnapshot；捕获动作由 CheckpointActivity 执行，检查点本身不修改或生成状态。", "A checkpoint records session, version, creating activity, state digest, and referenced StateSnapshot; CheckpointActivity performs capture, while the checkpoint itself neither mutates nor generates state.", "チェックポイントはセッション、版、作成活動、状態要約、参照 StateSnapshot を記録します。取得は CheckpointActivity が実行し、チェックポイント自体は状態を変更・生成しません。"),
    });
    upsertReviewedRelation({ id: "CheckpointActivity-captures-StateSnapshot", moduleId: "runtime-observability", predicate: "captures", sourceId: "CheckpointActivity", targetId: "StateSnapshot", relationKind: "causal", definitions: localized("检查点活动在确定的会话位置捕获一个有版本的状态快照。", "A checkpoint activity captures a versioned state snapshot at a determined session position.", "チェックポイント活動は確定したセッション位置で版管理済み状態スナップショットを取得します。") });
    upsertReviewedRelation({ id: "Checkpoint-references-StateSnapshot", moduleId: "runtime-observability", predicate: "references", sourceId: "Checkpoint", targetId: "StateSnapshot", relationKind: "information", definitions: localized("检查点以稳定身份和摘要引用由创建活动捕获的状态快照。", "A checkpoint references by stable identity and digest the state snapshot captured by its creating activity.", "チェックポイントは作成活動が取得した状態スナップショットを安定同一性と要約で参照します。") });

    const publicationReason = localized("CapabilitySurface 是描述符集合，不能执行 publishes；RegistryPublicationActivity 执行发布并把描述符放入可发现的能力表面。", "CapabilitySurface is a descriptor collection and cannot publish; RegistryPublicationActivity performs publication and places descriptors on the discoverable capability surface.", "CapabilitySurface は記述子集合で publishes を実行できません。RegistryPublicationActivity が公開を実行し、記述子を発見可能な能力表面へ配置します。");
    deprecateRelation("CapabilitySurface-publishes-CapabilityDescriptor", ["RegistryPublicationActivity-publishes-CapabilityDescriptor", "RegistryPublicationActivity-publishes_to-CapabilitySurface", "CapabilitySurface-contains-CapabilityDescriptor"], publicationReason);
    updateReviewedConcept("CapabilitySurface", {
      short_definitions: localized("能力表面是特定环境中可发现能力描述符的有界集合。", "A capability surface is a bounded collection of discoverable capability descriptors in one environment.", "能力表面は一つの環境で発見可能な能力記述子の境界付き集合です。"),
      definitions: localized("能力表面按环境、协议版本和授权范围包含可发现的 CapabilityDescriptor；发布由 RegistryPublicationActivity 执行，集合本身不承担发布动作。", "A capability surface contains discoverable CapabilityDescriptor records under environment, protocol-version, and authorization scope; RegistryPublicationActivity performs publication, while the collection itself has no publishing agency.", "能力表面は環境、プロトコル版、認可範囲の下で発見可能な CapabilityDescriptor を含みます。公開は RegistryPublicationActivity が実行し、集合自体は公開主体ではありません。"),
    });
    upsertReviewedConcept({ id: "RegistryPublicationActivity", moduleId: "tool-registry-definition", labels: localized("注册发布活动", "Registry publication activity", "レジストリ公開活動"), definitions: localized("注册发布活动验证描述符、环境范围、协议版本和授权条件，并把通过验证的能力描述符发布到一个能力表面。", "A registry-publication activity validates descriptor, environment scope, protocol version, and authorization conditions and publishes the validated capability descriptor to a capability surface.", "レジストリ公開活動は記述子、環境範囲、プロトコル版、認可条件を検証し、検証済み能力記述子を能力表面へ公開します。"), semanticKind: "activity", primaryParentRelationId: "RegistryPublicationActivity-is_a-RegistryActivity" });
    upsertReviewedRelation({ id: "RegistryPublicationActivity-is_a-RegistryActivity", moduleId: "tool-registry-definition", predicate: "is_a", sourceId: "RegistryPublicationActivity", targetId: "RegistryActivity", relationKind: "hierarchy", definitions: localized("注册发布活动是以验证并公开能力描述符为区分特征的一种注册表活动。", "A registry-publication activity is a registry activity distinguished by validating and exposing capability descriptors.", "レジストリ公開活動は能力記述子の検証・公開を種差とするレジストリ活動です。") });
    const publicationFacts = [
      ["RegistryPublicationActivity-publishes-CapabilityDescriptor", "publishes", "RegistryPublicationActivity", "CapabilityDescriptor", "causal", "注册发布活动发布一条已验证且保留版本、来源和授权范围的能力描述符。", "A registry-publication activity publishes a validated capability descriptor retaining version, provenance, and authorization scope.", "レジストリ公開活動は版、出典、認可範囲を保持する検証済み能力記述子を公開します。"],
      ["RegistryPublicationActivity-publishes_to-CapabilitySurface", "publishes_to", "RegistryPublicationActivity", "CapabilitySurface", "causal", "注册发布活动把描述符发布到与环境和协议范围匹配的能力表面。", "A registry-publication activity publishes the descriptor to a capability surface matching environment and protocol scope.", "レジストリ公開活動は環境・プロトコル範囲に合う能力表面へ記述子を公開します。"],
      ["CapabilitySurface-contains-CapabilityDescriptor", "contains", "CapabilitySurface", "CapabilityDescriptor", "composition", "能力表面包含在该环境、协议版本和授权范围内可发现的能力描述符。", "A capability surface contains capability descriptors discoverable within its environment, protocol version, and authorization scope.", "能力表面はその環境、プロトコル版、認可範囲で発見可能な能力記述子を含みます。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of publicationFacts) upsertReviewedRelation({ id, moduleId: "tool-registry-definition", predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });

    const reviewFindingReason = localized(
      "ReviewFinding 是审查活动产生的信息记录，不能生成 Feedback；它为 FeedbackRouting 提供输入，由该活动执行路由。",
      "ReviewFinding is an information record produced by review activity and cannot generate Feedback; it informs FeedbackRouting, which performs the routing action.",
      "ReviewFinding はレビュー活動が生成する情報記録であり Feedback を生成できません。FeedbackRouting への入力となり、同活動が経路制御を実行します。",
    );
    deprecateRelation(
      "ReviewFinding-generates-Feedback",
      ["ReviewFinding-informs-FeedbackRouting", "FeedbackRouting-routes-Feedback"],
      reviewFindingReason,
    );
    updateReviewedConcept("FeedbackRouting", {
      short_definitions: localized(
        "反馈路由是依据审查发现、策略和目标把反馈发送到后续处理者的协调活动。",
        "Feedback routing is a coordination activity that sends feedback to downstream handlers according to review findings, policy, and target.",
        "フィードバック経路制御は、レビュー所見・方針・対象に基づいてフィードバックを後続処理者へ送る調整活動です。",
      ),
      definitions: localized(
        "反馈路由读取 ReviewFinding、FeedbackEvent 与适用策略，选择任务、工作者、修订计划、闸门或优化循环作为目的地并路由 Feedback；活动有执行身份，输入信息记录没有。",
        "Feedback routing reads ReviewFinding, FeedbackEvent, and applicable policy, selects a task, worker, revision plan, gate, or optimization loop as destination, and routes Feedback; the activity has execution identity, while its input information records do not.",
        "フィードバック経路制御は ReviewFinding、FeedbackEvent、適用方針を読み、タスク・作業者・修正計画・ゲート・最適化ループを宛先として選び Feedback を送ります。実行同一性は活動が持ち、入力情報記録は持ちません。",
      ),
    });
    upsertReviewedRelation({
      id: "ReviewFinding-informs-FeedbackRouting",
      moduleId: "feedback-review-optimization",
      predicate: "informs",
      sourceId: "ReviewFinding",
      targetId: "FeedbackRouting",
      relationKind: "information",
      definitions: localized(
        "审查发现向反馈路由活动提供具体问题、建议、严重度和被评对象，作为目的地选择的输入证据。",
        "A review finding informs feedback routing with the issue, recommendation, severity, and reviewed subject used as evidence for destination selection.",
        "レビュー所見は、宛先選択の証拠となる問題・推奨・重大度・レビュー対象をフィードバック経路制御へ提供します。",
      ),
    });
    upsertReviewedRelation({
      id: "FeedbackRouting-routes-Feedback",
      moduleId: "orchestration-evaluation",
      predicate: "routes",
      sourceId: "FeedbackRouting",
      targetId: "Feedback",
      relationKind: "causal",
      definitions: localized(
        "反馈路由活动依据已审查输入和适用策略，把反馈发送给选定的任务、修订计划、闸门或优化循环。",
        "Feedback routing sends Feedback to the selected task, revision plan, gate, or optimization loop according to reviewed input and applicable policy.",
        "フィードバック経路制御は、審査済み入力と適用方針に基づき Feedback を選択済みタスク・修正計画・ゲート・最適化ループへ送ります。",
      ),
    });

    const measurementReason = localized(
      "Measurement 是有出处的观测信息，不能执行 evaluates；它为 OptimizationTarget 提供证据，由 EvaluationRun 执行评估。",
      "Measurement is a provenance-bearing observation and cannot perform evaluation; it provides evidence for an OptimizationTarget, while EvaluationRun performs the evaluation.",
      "Measurement は由来を持つ観測情報で evaluates を実行できません。OptimizationTarget の証拠を提供し、EvaluationRun が評価を実行します。",
    );
    deprecateRelation(
      "Measurement-evaluates-OptimizationTarget",
      [
        "Measurement-provides_evidence_for-OptimizationTarget",
        "EvaluationRun-evaluates-OptimizationTarget",
      ],
      measurementReason,
    );
    upsertReviewedRelation({
      id: "Measurement-provides_evidence_for-OptimizationTarget",
      moduleId: "feedback-metrics-evaluation",
      predicate: "provides_evidence_for",
      sourceId: "Measurement",
      targetId: "OptimizationTarget",
      relationKind: "information",
      definitions: localized(
        "测量记录以指标、被测对象、值、单位、时间和出处为优化目标的达成程度提供可审计证据。",
        "A measurement provides auditable evidence for progress toward an optimization target through its metric, subject, value, unit, time, and provenance.",
        "測定記録は、指標・対象・値・単位・時刻・由来により最適化目標への進捗を示す監査可能な証拠を提供します。",
      ),
    });
    upsertReviewedRelation({
      id: "EvaluationRun-evaluates-OptimizationTarget",
      moduleId: "feedback-metrics-evaluation",
      predicate: "evaluates",
      sourceId: "EvaluationRun",
      targetId: "OptimizationTarget",
      relationKind: "causal",
      definitions: localized(
        "评估运行依据适用指标、测量记录、基线和阈值评估优化目标的达成程度。",
        "An evaluation run evaluates progress toward an optimization target using applicable metrics, measurements, baselines, and thresholds.",
        "評価実行は、適用指標・測定記録・基準値・閾値を用いて最適化目標への進捗を評価します。",
      ),
    });
  };

  const repairSoftwareDefectCasePathForToolCallPlan = () => {
    const toolCallPlan = allConcepts().get("ToolCallPlan");
    const toolCall = allConcepts().get("ToolCall");
    if (!toolCallPlan || !toolCall) {
      throw new Error("Cannot repair software-defect-repair: ToolCallPlan or ToolCall is missing");
    }

    const toolCallPlanCase = {
      id: "ToolCallPlan-case-software-defect-repair-03a",
      kind: "case-fragment",
      labels: localized(
        "工具调用计划的软件缺陷修复片段",
        "Tool-call-plan fragment in software defect repair",
        "ソフトウェア欠陥修復におけるツール呼び出し計画断片",
      ),
      scenario_id: "software-defect-repair",
      descriptions: localized(
        "2026-07-13T09:05:00.000Z：ToolCallPlan 承接 TaskStep-case-software-defect-repair-03，把 step-guard-invalid-relation 具体化为调用 apply_patch 的计划：目标文件是 src/lib/ontology-index.ts，参数必须保留有效图谱并诊断缺失关系端点。",
        "At 2026-07-13T09:05:00.000Z, ToolCallPlan follows TaskStep-case-software-defect-repair-03 and turns step-guard-invalid-relation into a plan to invoke apply_patch on src/lib/ontology-index.ts, with arguments constrained to retain the valid graph and diagnose the missing relation endpoint.",
        "2026-07-13T09:05:00.000Z に ToolCallPlan は TaskStep-case-software-defect-repair-03 を引き継ぎ、step-guard-invalid-relation を src/lib/ontology-index.ts へ apply_patch を呼び出す計画として具体化します。引数は有効なグラフを保持し、欠落した関係端点を診断するよう制約されます。",
      ),
      field_values: {},
      related_node_ids: ["TaskStep", "ToolCallPlan", "ToolCall"],
      related_relation_ids: [
        "TaskStep-specifies-ToolCallPlan",
        "ToolCallPlan-plans-ToolCall",
      ],
      expected_result: localized(
        "计划固定候选工具、目标文件、参数约束和安全预期，后续 ToolCall 才取得一次可寻址调用身份。",
        "The plan fixes the candidate tool, target file, argument constraints, and safety expectation; the subsequent ToolCall then receives one addressable invocation identity.",
        "計画は候補ツール、対象ファイル、引数制約、安全上の期待を固定し、その後の ToolCall が一回のアドレス可能な呼び出し同一性を取得します。",
      ),
      why_valid_or_invalid: localized(
        "该片段只把计划信息附着于 canonical ToolCallPlan 节点，并通过两条已接受关系连接步骤与调用，没有创建影子实例图。",
        "The fragment attaches plan information only to the canonical ToolCallPlan node and connects the step and call through two accepted relations without creating a shadow instance graph.",
        "この断片は計画情報を canonical ToolCallPlan ノードにだけ付与し、二つの受理済み関係で手順と呼び出しを結び、シャドー実例グラフを作りません。",
      ),
      synthetic: true,
      verified_version: VERSION_IRI,
      source_claims: [],
    };
    updateReviewedConcept("ToolCallPlan", {
      examples: [
        ...(toolCallPlan.examples ?? []).filter(({ id }) => id !== toolCallPlanCase.id),
        toolCallPlanCase,
      ],
    });

    updateReviewedConcept("ToolCall", {
      examples: (toolCall.examples ?? []).map((example) =>
        example.id !== "ToolCall-case-software-defect-repair-04"
          ? example
          : {
              ...example,
              descriptions: localized(
                "2026-07-13T09:06:00.000Z：ToolCall 承接 ToolCallPlan-case-software-defect-repair-03a，为 step-guard-invalid-relation 创建 call-defect-MWA-217-apply-patch，并以已计划参数调用 apply_patch 修改 src/lib/ontology-index.ts。",
                "At 2026-07-13T09:06:00.000Z, ToolCall follows ToolCallPlan-case-software-defect-repair-03a, creates call-defect-MWA-217-apply-patch for step-guard-invalid-relation, and invokes apply_patch on src/lib/ontology-index.ts with the planned arguments.",
                "2026-07-13T09:06:00.000Z に ToolCall は ToolCallPlan-case-software-defect-repair-03a を引き継ぎ、step-guard-invalid-relation の call-defect-MWA-217-apply-patch を作成し、計画済み引数で src/lib/ontology-index.ts に apply_patch を呼び出します。",
              ),
              related_node_ids: ["ToolCallPlan", "ToolCall"],
              related_relation_ids: ["ToolCallPlan-plans-ToolCall"],
            },
      ),
    });

    const path = productDocument.document.case_paths.find(
      ({ id }) => id === "software-defect-repair",
    );
    if (!path) throw new Error("Missing software-defect-repair case path");
    path.descriptions = localized(
      "缺陷 MWA-217 的唯一主案例：src/lib/ontology-index.ts 遇到缺失关系端点时隐藏有效图谱；案例按 Goal、TaskPlan、TaskStep、ToolCallPlan、ToolCall、ToolCallAttempt、ToolResult、EvaluationRun、Feedback、MemoryWrite、MemoryRecord 的时间顺序完成计划、补丁、回归验证与经验写入。其中记忆交接保持 canonical 方向 MemoryWrite —responds_to→ Feedback，时间顺序不倒置关系主体。",
      "The single main case for defect MWA-217: src/lib/ontology-index.ts hides the valid graph when a relation endpoint is missing; the case proceeds temporally through Goal, TaskPlan, TaskStep, ToolCallPlan, ToolCall, ToolCallAttempt, ToolResult, EvaluationRun, Feedback, MemoryWrite, and MemoryRecord for planning, patching, regression verification, and memory capture. The memory handoff preserves the canonical direction MemoryWrite —responds_to→ Feedback; temporal order does not reverse relation agency.",
      "欠陥 MWA-217 の唯一の主事例です。src/lib/ontology-index.ts が関係端点の欠落時に有効なグラフまで隠す問題を、Goal、TaskPlan、TaskStep、ToolCallPlan、ToolCall、ToolCallAttempt、ToolResult、EvaluationRun、Feedback、MemoryWrite、MemoryRecord の時間順に計画・修正し、回帰検証して記憶へ記録します。記憶の受け渡しは canonical 方向 MemoryWrite —responds_to→ Feedback を保持し、時間順序によって関係主体を反転させません。",
    );
    const reviewedSteps = [
      ["Goal-case-software-defect-repair-01", null],
      ["TaskPlan-case-software-defect-repair-02", "Goal-elaborated_by-TaskPlan"],
      ["TaskStep-case-software-defect-repair-03", "TaskPlan-contains_step-TaskStep"],
      ["ToolCallPlan-case-software-defect-repair-03a", "TaskStep-specifies-ToolCallPlan"],
      ["ToolCall-case-software-defect-repair-04", "ToolCallPlan-plans-ToolCall"],
      ["ToolCallAttempt-case-software-defect-repair-05", "ToolCall-has_attempt-ToolCallAttempt"],
      ["ToolResult-case-software-defect-repair-06", "ToolCallAttempt-produces_result-ToolResult"],
      ["EvaluationRun-case-software-defect-repair-07", "EvaluationRun-evaluates-ToolResult"],
      ["Feedback-case-software-defect-repair-08", "EvaluationRun-produces-Feedback"],
      ["MemoryWrite-case-software-defect-repair-09", "MemoryWrite-responds_to-Feedback"],
      ["MemoryRecord-case-software-defect-repair-10", "MemoryWrite-produces-MemoryRecord"],
    ];
    path.steps = reviewedSteps.map(
      ([caseFragmentExampleId, traversalRelationId], index) => ({
        order: index + 1,
        case_fragment_example_id: caseFragmentExampleId,
        traversal_relation_id: traversalRelationId,
      }),
    );
  };

  return Object.freeze({ completeImprovementLoopCoordination, repairResidualAgencyAndCompositionSemantics, completePlannedOperationalGaps, completeTransportAndRecoveryGaps, completePolicyEffectAndProjectionGaps, migrateWorkerRole, repairFinalResidualAgencySemantics, repairSoftwareDefectCasePathForToolCallPlan });
};
