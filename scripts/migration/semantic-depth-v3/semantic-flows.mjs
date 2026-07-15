export const createSemanticFlowPhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction, moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts, locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor, fixCrossKindTaxonomy, RECLASSIFIED_CONCEPTS, normalizeReclassifiedConcepts, addExecutionBackbone, addDelegationSemanticBackbone, completeContextDiscoveryFlow, completePromptInstructionBackbone, repairNetworkSemantics, completeExecutionResultSemantics, completeOptimizationLearningLoop } = context;

  const completeEvaluationGoldenFlow = () => {
    upsertReviewedRelation({
      id: "EvaluationRun-uses-EvaluationSpecification",
      moduleId: "feedback-metrics-evaluation",
      predicate: "uses",
      sourceId: "EvaluationRun",
      targetId: "EvaluationSpecification",
      relationKind: "governance",
      definitions: localized("评估运行使用评估规范固定评估对象、数据集、指标、阈值和判定过程。", "An evaluation run uses an evaluation specification to fix its subject, dataset, metrics, thresholds, and decision procedure.", "評価実行は評価仕様を用いて対象、データセット、指標、閾値、判定手順を固定します。"),
    });
  };
  const completeContextAssemblySemantics = () => {
    const moduleId = "memory-context";
    const module = moduleDocuments.get(moduleId).document.module;
    const contextPackage = allConcepts().get("ContextPackage");
    if (!contextPackage) throw new Error("ContextPackage is missing");
    const packageClaims = claimsFor(contextPackage, module);
    const field = ({ id, labels, datatype, definition, exampleValue }) => ({
      id,
      labels,
      datatype,
      required: true,
      cardinality: { min: 1, max: 1 },
      definitions: definition,
      allowed_values: [],
      pattern: null,
      example_value: exampleValue,
      source_claims: packageClaims.map((claim) => ({
        ...claim,
        supports: `Supports the reviewed immutable ContextPackage.${id} field and its identity or integrity role.`,
      })),
    });
    const requiredFields = [
      field({ id: "package_id", labels: localized("上下文包 ID", "context package ID", "コンテキストパッケージ ID"), datatype: "string", definition: localized("在同一系统中唯一标识一组版本化上下文包。", "Uniquely identifies a versioned context-package lineage within one system.", "一つのシステム内で版管理されたコンテキストパッケージ系列を一意に識別します。"), exampleValue: "context-package-042" }),
      field({ id: "version", labels: localized("版本", "version", "版"), datatype: "string", definition: localized("标识同一上下文包系列中的不可变版本。", "Identifies one immutable version within a context-package lineage.", "同じコンテキストパッケージ系列内の不変版を識別します。"), exampleValue: "3" }),
      field({ id: "content_digest", labels: localized("内容摘要", "content digest", "内容ダイジェスト"), datatype: "string", definition: localized("对该版本的有序内容与关键元数据计算的完整性摘要。", "An integrity digest computed over the ordered content and material metadata of this version.", "この版の順序付き内容と重要メタデータから計算した完全性ダイジェストです。"), exampleValue: "sha256:4c2f..." }),
      field({ id: "assembled_at", labels: localized("组装时间", "assembled at", "組み立て時刻"), datatype: "date-time", definition: localized("记录该不可变上下文版本完成组装的时间。", "Records when this immutable context version finished assembly.", "この不変コンテキスト版の組み立て完了時刻を記録します。"), exampleValue: "2026-07-14T08:30:00Z" }),
    ];
    updateReviewedConcept("ContextPackage", {
      why_needed: localized("上下文包提供一次可重放、可校验且不会被就地改写的执行输入边界。", "A context package provides a replayable, verifiable execution-input boundary that is never modified in place.", "コンテキストパッケージは再生・検証可能で、その場で変更されない実行入力境界を提供します。"),
      structure: {
        ...contextPackage.structure,
        identity_keys: ["package_id", "version"],
        fields: [
          ...(contextPackage.structure?.fields ?? []).filter((candidate) => !requiredFields.some(({ id }) => id === candidate.id)),
          ...requiredFields,
        ],
        constraints: [
          ...(contextPackage.structure?.constraints ?? []).filter(({ id }) => id !== "context-package-immutable"),
          {
            id: "context-package-immutable",
            severity: "error",
            expression_language: "plain",
            expression: "once persisted, package_id + version content and content_digest never change; a content change creates a new version",
            explanations: localized("上下文包一经持久化不得就地修改；任何内容变化都必须创建新版本并重新计算摘要。", "Once persisted, a context package is never modified in place; any content change creates a new version and digest.", "永続化後のコンテキストパッケージはその場で変更せず、内容変更は新しい版とダイジェストを作成します。"),
            source_claims: packageClaims,
          },
        ],
        required_relation_constraints: contextPackage.structure?.required_relation_constraints ?? [],
      },
    });
    const partReason = localized("结构位置和来源引用是 ContextWindow 的组成或引用端点，不是 ContextArtifact 的子类。", "A structural slot and a source reference are composition or reference endpoints of a ContextWindow, not subclasses of ContextArtifact.", "構造スロットと出典参照は ContextWindow の構成・参照端点であり、ContextArtifact の下位型ではありません。");
    deprecateRelation("ContextSlot-is_a-ContextArtifact", [], partReason);
    deprecateRelation("ContextSource-is_a-ContextArtifact", ["ContextSource-is_a-SourceReference"], partReason);
    updateReviewedConcept("ContextSlot", { primary_parent_relation_id: null, root_status: "composition-root" });
    updateReviewedConcept("ContextSource", { primary_parent_relation_id: "ContextSource-is_a-SourceReference", root_status: null });
    upsertReviewedRelation({ id: "ContextSource-is_a-SourceReference", moduleId, predicate: "is_a", sourceId: "ContextSource", targetId: "SourceReference", relationKind: "hierarchy", definitions: localized("上下文来源是专用于说明上下文槽位来源的来源引用。", "A context source is a source reference specialized to identify the provenance of a context slot.", "コンテキスト出典はコンテキストスロットの来歴を示す出典参照です。") });
    const deliveryReason = localized("可交付对象是 ContextPackage，而不是执行上下文组装的活动。", "The deliverable is ContextPackage, not the activity that assembles it.", "引き渡されるのは ContextPackage であり、組み立て活動ではありません。");
    deprecateRelation("ContextAssembly-delivered_to-RunAttempt", ["ContextPackage-delivered_to-RunAttempt"], deliveryReason);
    upsertReviewedRelation({ id: "ContextPackage-delivered_to-RunAttempt", moduleId, predicate: "delivered_to", sourceId: "ContextPackage", targetId: "RunAttempt", relationKind: "information", definitions: localized("不可变上下文包作为版本化执行输入交付给一次执行尝试。", "An immutable context package is delivered to one run attempt as versioned execution input.", "不変コンテキストパッケージは版管理された実行入力として一回の実行試行へ渡されます。") });
    upsertReviewedRelation({ id: "Message-references_context-ContextPackage", moduleId: "info-messages-instructions", predicate: "references_context", sourceId: "Message", targetId: "ContextPackage", relationKind: "information", definitions: localized("消息可显式引用生成、解释或继续该消息时所使用的上下文包版本。", "A message may explicitly reference the context-package version used to generate, interpret, or continue it.", "メッセージは生成、解釈、継続に使用したコンテキストパッケージ版を明示的に参照できます。") });
    const visibleReason = localized("VisibleContextWindow 表达选择与裁剪后实际可见的上下文快照，不是窗口选择规范；规范仍由 OutputWindow 拥有。", "VisibleContextWindow denotes the actual context snapshot visible after selection and trimming, not a window-selection specification; OutputWindow retains the specification semantics.", "VisibleContextWindow は選択・裁剪後に実際に可視となるコンテキストスナップショットであり、窓選択仕様ではありません。仕様は OutputWindow が保持します。");
    deprecateRelation("VisibleContextWindow-is_a-OutputWindow", ["VisibleContextWindow-conforms_to-OutputWindow"], visibleReason);
    updateReviewedConcept("VisibleContextWindow", {
      semantic_kind: "information",
      primary_parent_relation_id: null,
      root_status: "composition-root",
      short_definitions: localized("可见上下文窗口是选择、排序和裁剪后实际可供某次消费使用的上下文快照。", "A visible context window is the actual context snapshot available to a consumer after selection, ordering, and trimming.", "可視コンテキスト窓は選択、順序付け、裁剪後に消費者が実際に利用できるコンテキストスナップショットです。"),
      definitions: visibleReason,
    });
    upsertReviewedRelation({ id: "VisibleContextWindow-conforms_to-OutputWindow", moduleId, predicate: "conforms_to", sourceId: "VisibleContextWindow", targetId: "OutputWindow", relationKind: "governance", definitions: localized("实际可见上下文窗口遵循输出窗口规范规定的范围和长度限制。", "The actual visible context window conforms to the range and length limits of an output-window specification.", "実際の可視コンテキスト窓は出力窓仕様の範囲と長さ制限に適合します。") });
    const phases = [
      ["ContextSelectionActivity", "上下文选择活动", "Context selection activity", "コンテキスト選択活動", "上下文选择活动依据查询、相关性、权限和预算，从候选中确定可进入上下文的项目。", "A context-selection activity chooses candidates eligible for context using query relevance, authorization, and budget.", "コンテキスト選択活動はクエリ関連性、認可、予算に基づき候補からコンテキストへ入る項目を選びます。"],
      ["ContextOrderingActivity", "上下文排序活动", "Context ordering activity", "コンテキスト順序付け活動", "上下文排序活动在已选择项目之间确定稳定顺序和邻接关系。", "A context-ordering activity determines a stable order and adjacency among selected items.", "コンテキスト順序付け活動は選択済み項目の安定した順序と隣接関係を決めます。"],
      ["ContextTrimmingActivity", "上下文裁剪活动", "Context trimming activity", "コンテキスト裁剪活動", "上下文裁剪活动在不改变来源身份的前提下按窗口预算删除或缩短已排序内容。", "A context-trimming activity removes or shortens ordered content to fit the window budget without changing source identity.", "コンテキスト裁剪活動は出典同一性を変えず、窓予算に合わせて順序付き内容を削除または短縮します。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of phases) {
      upsertReviewedConcept({ id, moduleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity" });
      upsertReviewedRelation({ id: `ContextAssembly-has_phase-${id}`, moduleId, predicate: "has_phase", sourceId: "ContextAssembly", targetId: id, relationKind: "temporal", definitions: localized(`上下文组装以${zh}作为可审计阶段。`, `Context assembly includes ${en} as an auditable phase.`, `コンテキスト組み立ては${ja}を監査可能な段階として含みます。`) });
    }
    upsertReviewedRelation({ id: "ContextSelectionActivity-precedes-ContextOrderingActivity", moduleId, predicate: "precedes", sourceId: "ContextSelectionActivity", targetId: "ContextOrderingActivity", relationKind: "temporal", definitions: localized("候选必须先被选择，才能对进入上下文的项目确定顺序。", "Candidates must be selected before the admitted items can be ordered.", "候補は選択された後で、コンテキストへ入る項目の順序を決めます。") });
    upsertReviewedRelation({ id: "ContextOrderingActivity-precedes-ContextTrimmingActivity", moduleId, predicate: "precedes", sourceId: "ContextOrderingActivity", targetId: "ContextTrimmingActivity", relationKind: "temporal", definitions: localized("先确定稳定顺序，再依据预算裁剪，才能保留可重放的选择语义。", "A stable order is established before budget trimming so the selection remains replayable.", "再生可能な選択意味を保つため、安定した順序を決めてから予算裁剪を行います。") });
  };
  const completeRetrievalExecutionSemantics = () => {
    const moduleId = "memory-retrieval-ranking";
    const module = moduleDocuments.get(moduleId).document.module;
    const sourceClaims = claimsFor(module, module);
    const retrievalQuery = allConcepts().get("RetrievalQuery");
    if (!retrievalQuery) throw new Error("RetrievalQuery is missing");
    const topKField = retrievalQuery.structure?.fields?.find(({ id }) => id === "top_k");
    const topKConstraint = retrievalQuery.structure?.constraints?.find(({ id }) => id === "retrieval-query-positive-top-k");
    const identityStructure = (id, labels, exampleValue) => ({
      identity_keys: [id],
      fields: [{
        id,
        labels,
        datatype: "string",
        required: true,
        cardinality: { min: 1, max: 1 },
        definitions: localized(`唯一标识该${labels.zh}记录。`, `Uniquely identifies this ${labels.en} record.`, `この${labels.ja}記録を一意に識別します。`),
        allowed_values: [],
        pattern: null,
        example_value: exampleValue,
        source_claims: sourceClaims,
      }],
      constraints: [],
      required_relation_constraints: [],
    });
    upsertReviewedConcept({
      id: "RetrievalRequest",
      moduleId,
      labels: localized("检索请求", "Retrieval request", "検索要求"),
      definitions: localized("检索请求是把查询、索引版本、过滤条件和调用语境绑定为一次可执行检索意图的信息记录；它不亲自执行检索。", "A retrieval request is an information record binding query, index version, filter conditions, and invocation context into one executable retrieval intent; it does not execute retrieval itself.", "検索要求はクエリ、索引版、フィルター条件、呼び出し文脈を一つの実行可能な検索意図へ束ねる情報記録であり、自ら検索を実行しません。"),
      semanticKind: "information",
      structure: {
        ...identityStructure("request_id", localized("检索请求", "retrieval request", "検索要求"), "retrieval-request-009"),
        fields: [
          ...identityStructure("request_id", localized("检索请求", "retrieval request", "検索要求"), "retrieval-request-009").fields,
          ...(topKField ? [{ ...topKField }] : []),
        ],
        constraints: topKConstraint ? [{ ...topKConstraint, id: "retrieval-request-positive-top-k" }] : [],
        required_relation_constraints: [
          { id: "retrieval-request-has-query", direction: "outgoing", predicate: "has_query", target_concept_id: "RetrievalQuery", cardinality: { min: 1, max: 1 }, explanations: localized("检索请求必须包含一个查询内容记录。", "A retrieval request contains exactly one query-content record.", "検索要求は一つのクエリ内容記録を含みます。"), source_claims: sourceClaims },
          { id: "retrieval-request-targets-index-version", direction: "outgoing", predicate: "targets", target_concept_id: "IndexVersion", cardinality: { min: 1, max: 1 }, explanations: localized("检索请求必须固定到一个可重放的索引版本。", "A retrieval request is pinned to one replayable index version.", "検索要求は一つの再現可能な索引版に固定されます。"), source_claims: sourceClaims },
        ],
      },
    });
    updateReviewedConcept("RetrievalQuery", {
      structure: {
        ...retrievalQuery.structure,
        fields: (retrievalQuery.structure?.fields ?? []).filter(({ id }) => id !== "top_k"),
        constraints: (retrievalQuery.structure?.constraints ?? []).filter(({ id }) => id !== "retrieval-query-positive-top-k"),
        required_relation_constraints: [],
      },
    });
    upsertReviewedConcept({
      id: "RetrievalRun",
      moduleId,
      labels: localized("检索运行", "Retrieval run", "検索実行"),
      definitions: localized("检索运行是履行一项检索请求、读取指定索引版本并执行候选生成与排序阶段的活动。", "A retrieval run is an activity that fulfills one retrieval request, reads the specified index version, and executes candidate-generation and ranking phases.", "検索実行は一つの検索要求を履行し、指定索引版を読み、候補生成と順位付け段階を実行する活動です。"),
      semanticKind: "activity",
      structure: identityStructure("retrieval_run_id", localized("检索运行", "retrieval run", "検索実行"), "retrieval-run-009"),
    });
    upsertReviewedConcept({
      id: "RetrievalResult",
      moduleId,
      labels: localized("检索结果记录", "Retrieval result record", "検索結果記録"),
      definitions: localized("检索结果记录保存一次检索运行的候选集合、最终选中内容、评分语境、索引版本和诊断证据。", "A retrieval result record retains the candidate set, selected content, scoring context, index version, and diagnostic evidence for one retrieval run.", "検索結果記録は一回の検索実行の候補集合、選択内容、評価文脈、索引版、診断証拠を保持します。"),
      semanticKind: "information",
      structure: identityStructure("retrieval_result_id", localized("检索结果", "retrieval result", "検索結果"), "retrieval-result-009"),
    });
    upsertReviewedConcept({
      id: "RerankActivity",
      moduleId,
      labels: localized("重排活动", "Rerank activity", "再順位付け活動"),
      definitions: localized("重排活动使用额外模型或规则重新比较候选集合，并产生保留模型、特征与版本依据的重排分数。", "A rerank activity compares a candidate set again using an additional model or rule and produces rerank scores retaining model, feature, and version evidence.", "再順位付け活動は追加モデルまたは規則で候補集合を再比較し、モデル、特徴、版根拠を保持する再順位付けスコアを生成します。"),
      semanticKind: "activity",
      primaryParentRelationId: "RerankActivity-is_a-RankingOperation",
    });
    upsertReviewedRelation({ id: "RerankActivity-is_a-RankingOperation", moduleId, predicate: "is_a", sourceId: "RerankActivity", targetId: "RankingOperation", relationKind: "hierarchy", definitions: localized("重排活动是以追加评分阶段重新排列候选的一种排序操作。", "A rerank activity is a ranking operation distinguished by an additional scoring pass over candidates.", "再順位付け活動は候補への追加評価パスを種差とする順位付け操作です。") });
    const agencyReason = localized("RetrievalQuery 只表达查询内容，不能读取索引、运行过滤、产生候选或取回分块；这些动作由 RetrievalRun 执行。", "RetrievalQuery only expresses query content and cannot read an index, run filters, produce candidates, or retrieve chunks; RetrievalRun performs those actions.", "RetrievalQuery はクエリ内容だけを表し、索引読取、フィルター実行、候補生成、チャンク取得は RetrievalRun が行います。");
    const replacements = new Map([
      ["RetrievalQuery-produces-CandidateSet", ["RetrievalRun-produces-CandidateSet"]],
      ["RetrievalQuery-queries-IndexVersion", ["RetrievalRequest-targets-IndexVersion", "RetrievalRun-reads-IndexVersion"]],
      ["RetrievalQuery-uses-RetrievalFilter", ["RetrievalRequest-uses_filter-RetrievalFilter"]],
      ["retrieves_chunk", ["RetrievalResult-contains-RetrievedChunk"]],
    ]);
    for (const [relationId, replacementIds] of replacements) deprecateRelation(relationId, replacementIds, agencyReason);
    const facts = [
      ["RetrievalRequest-has_query-RetrievalQuery", "has_query", "RetrievalRequest", "RetrievalQuery", "composition", "检索请求包含不承担执行职责的查询内容。", "A retrieval request contains query content that has no execution agency.", "検索要求は実行主体ではないクエリ内容を含みます。"],
      ["RetrievalRequest-uses_filter-RetrievalFilter", "uses_filter", "RetrievalRequest", "RetrievalFilter", "governance", "检索请求引用限定候选范围的过滤规范。", "A retrieval request references the filter specification that bounds candidate scope.", "検索要求は候補範囲を限定するフィルター仕様を参照します。"],
      ["RetrievalRequest-targets-IndexVersion", "targets", "RetrievalRequest", "IndexVersion", "information", "检索请求固定要读取的不可变索引版本。", "A retrieval request fixes the immutable index version to read.", "検索要求は読み取る不変索引版を固定します。"],
      ["RetrievalRun-fulfills-RetrievalRequest", "fulfills", "RetrievalRun", "RetrievalRequest", "causal", "每次检索运行履行一项已固定查询和索引版本的检索请求。", "Each retrieval run fulfills one request with a fixed query and index version.", "各検索実行はクエリと索引版が固定された一つの要求を履行します。"],
      ["RetrievalRun-reads-IndexVersion", "reads", "RetrievalRun", "IndexVersion", "information", "检索运行读取请求指定的索引版本，而不修改该版本。", "A retrieval run reads the request's specified index version without modifying it.", "検索実行は要求で指定された索引版を変更せず読み取ります。"],
      ["RetrievalRun-produces-CandidateSet", "produces", "RetrievalRun", "CandidateSet", "causal", "检索运行产生保留成员、顺序与评分语境的候选集合。", "A retrieval run produces a candidate set retaining members, order, and scoring context.", "検索実行はメンバー、順序、評価文脈を保持する候補集合を生成します。"],
      ["RetrievalRun-produces-RetrievalResult", "produces", "RetrievalRun", "RetrievalResult", "causal", "检索运行产生记录索引版本、候选、选择与诊断的检索结果。", "A retrieval run produces a result record for index version, candidates, selection, and diagnostics.", "検索実行は索引版、候補、選択、診断を記録する検索結果を生成します。"],
      ["RetrievalResult-contains-CandidateSet", "contains", "RetrievalResult", "CandidateSet", "composition", "检索结果记录包含该次运行形成的候选集合。", "A retrieval result record contains the candidate set formed by that run.", "検索結果記録はその実行で形成した候補集合を含みます。"],
      ["RetrievalResult-contains-RetrievedChunk", "contains", "RetrievalResult", "RetrievedChunk", "composition", "检索结果记录包含最终取回并可供上下文组装使用的分块记录。", "A retrieval result record contains the retrieved chunks made available to context assembly.", "検索結果記録はコンテキスト組み立てに渡す取得済みチャンクを含みます。"],
      ["RetrievalRun-has_phase-RankFusion", "has_phase", "RetrievalRun", "RankFusion", "temporal", "检索运行可包含合并多路候选排序的排名融合阶段。", "A retrieval run may include a rank-fusion phase that combines multiple candidate rankings.", "検索実行は複数候補順位を統合する順位融合段階を含み得ます。"],
      ["RetrievalRun-has_phase-RerankActivity", "has_phase", "RetrievalRun", "RerankActivity", "temporal", "检索运行可包含使用附加模型或规则的重排阶段。", "A retrieval run may include a rerank phase using an additional model or rule.", "検索実行は追加モデルまたは規則を使う再順位付け段階を含み得ます。"],
      ["RetrievalRun-has_phase-TopKSelection", "has_phase", "RetrievalRun", "TopKSelection", "temporal", "检索运行可包含依据已排名候选选择前 K 项的阶段。", "A retrieval run may include a phase selecting the top K already-ranked candidates.", "検索実行は順位付き候補から上位 K 件を選ぶ段階を含み得ます。"],
      ["RerankActivity-produces-RerankScore", "produces", "RerankActivity", "RerankScore", "causal", "重排活动为候选产生可追溯的重排分数。", "A rerank activity produces traceable rerank scores for candidates.", "再順位付け活動は候補に追跡可能な再順位付けスコアを生成します。"],
    ];
    const requiredFactCardinalities = new Map([
      ["RetrievalRequest-has_query-RetrievalQuery", {
        source: { min: 0, max: null },
        target: { min: 1, max: 1 },
      }],
      ["RetrievalRequest-targets-IndexVersion", {
        source: { min: 0, max: null },
        target: { min: 1, max: 1 },
      }],
    ]);
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of facts) {
      upsertReviewedRelation({
        id,
        moduleId,
        predicate,
        sourceId,
        targetId,
        relationKind,
        definitions: localized(zh, en, ja),
        cardinality: requiredFactCardinalities.get(id),
      });
    }
  };
  const repairEvaluationCompositionAndAgency = () => {
    const moduleId = "feedback-metrics-evaluation";
    const compositionReason = localized("场景、量规和准则是评估规范的组成规范，不是完整 EvaluationSpecification 的子类。", "Scenario, rubric, and criterion are component specifications of an evaluation specification, not subclasses of the complete EvaluationSpecification.", "シナリオ、ルーブリック、基準は評価仕様の構成仕様であり、完全な EvaluationSpecification の下位型ではありません。");
    const replacements = new Map([
      ["EvaluationScenario-is_a-EvaluationSpecification", ["EvaluationSpecification-contains_scenario-EvaluationScenario"]],
      ["Rubric-is_a-EvaluationSpecification", ["EvaluationSpecification-contains_rubric-Rubric"]],
      ["EvaluationCriterion-is_a-EvaluationSpecification", ["EvaluationSpecification-contains_criterion-EvaluationCriterion"]],
    ]);
    for (const [relationId, replacementIds] of replacements) deprecateRelation(relationId, replacementIds, compositionReason);
    for (const conceptId of ["EvaluationScenario", "Rubric", "EvaluationCriterion"]) {
      updateReviewedConcept(conceptId, { primary_parent_relation_id: null, root_status: "composition-root" });
    }
    const metricAgencyReason = localized("Metric 规定测量语义但不执行测量；EvaluationRun 产生的 Measurement 观察被评估对象并引用 Metric。", "Metric specifies measurement semantics but does not perform measurement; a Measurement produced by EvaluationRun observes the evaluated subject and references Metric.", "Metric は測定意味を規定しますが測定を実行せず、EvaluationRun が生成する Measurement が評価対象を観測し Metric を参照します。");
    deprecateRelation("metric_measures_run_attempt", ["Measurement-observes-RunAttempt", "Measurement-conforms_to-Metric"], metricAgencyReason);
    deprecateRelation("metric_measures_tool_call", ["Measurement-observes-ToolCall", "Measurement-conforms_to-Metric"], metricAgencyReason);
    const facts = [
      ["EvaluationSpecification-contains_scenario-EvaluationScenario", "contains_scenario", "EvaluationSpecification", "EvaluationScenario", "composition", "评估规范包含固定输入、环境与预期行为语境的评估场景。", "An evaluation specification contains scenarios that fix input, environment, and expected-behavior context.", "評価仕様は入力、環境、期待動作文脈を固定する評価シナリオを含みます。"],
      ["EvaluationSpecification-contains_rubric-Rubric", "contains_rubric", "EvaluationSpecification", "Rubric", "composition", "评估规范包含说明评分维度与聚合方法的量规。", "An evaluation specification contains a rubric defining scoring dimensions and aggregation.", "評価仕様は採点次元と集約方法を定義するルーブリックを含みます。"],
      ["EvaluationSpecification-contains_criterion-EvaluationCriterion", "contains_criterion", "EvaluationSpecification", "EvaluationCriterion", "composition", "评估规范包含用于判定证据是否满足要求的评估准则。", "An evaluation specification contains criteria used to decide whether evidence satisfies requirements.", "評価仕様は証拠が要件を満たすか判定する評価基準を含みます。"],
      ["Measurement-observes-RunAttempt", "observes", "Measurement", "RunAttempt", "information", "测量记录可观察一次执行尝试，并保留用于计算指标的证据。", "A measurement may observe one run attempt and retain evidence used to compute a metric.", "測定記録は一回の実行試行を観測し、指標計算に用いた証拠を保持できます。"],
      ["Measurement-observes-ToolCall", "observes", "Measurement", "ToolCall", "information", "测量记录可观察一次工具调用，并保留调用结果、延迟、成本或安全证据。", "A measurement may observe one tool call and retain result, latency, cost, or safety evidence.", "測定記録は一回のツール呼び出しを観測し、結果、遅延、費用、安全証拠を保持できます。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of facts) {
      upsertReviewedRelation({ id, moduleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    }
  };
  const completeGovernedOptimizationApplication = () => {
    const moduleId = "feedback-optimization-learning";
    const metricReason = localized("OptimizationLoop 使用 Metric 作为目标和计算规范，并消费实际 Measurement；规范本身不作为运行产生的数据被消费。", "OptimizationLoop uses Metric as a target and computation specification and consumes actual Measurement records; the specification itself is not consumed as run data.", "OptimizationLoop は Metric を目標・計算仕様として使用し、実際の Measurement 記録を消費します。仕様自体は実行データとして消費しません。");
    deprecateRelation("optimization_loop_consumes_metric", ["OptimizationLoop-uses-Metric", "OptimizationLoop-consumes-Measurement"], metricReason);
    upsertReviewedRelation({ id: "OptimizationLoop-uses-Metric", moduleId, predicate: "uses", sourceId: "OptimizationLoop", targetId: "Metric", relationKind: "governance", definitions: localized("优化循环使用指标规范固定优化目标、计算口径与比较方向。", "An optimization loop uses metric specifications to fix optimization targets, computation semantics, and comparison direction.", "最適化ループは指標仕様を使って最適化目標、計算意味、比較方向を固定します。") });
    upsertReviewedRelation({ id: "OptimizationLoop-consumes-Measurement", moduleId, predicate: "consumes", sourceId: "OptimizationLoop", targetId: "Measurement", relationKind: "information", definitions: localized("优化循环消费评估运行产生的测量记录作为基线与候选变更证据。", "An optimization loop consumes measurement records produced by evaluation runs as baseline and candidate-change evidence.", "最適化ループは評価実行が生成した測定記録を基準と変更候補の証拠として消費します。") });
    upsertReviewedRelation({ id: "ChangeProposal-guides-CorrectionActivity", moduleId, predicate: "guides", sourceId: "ChangeProposal", targetId: "CorrectionActivity", relationKind: "governance", definitions: localized("只有获得适用策略决策的变更提案才能指导纠正活动；提案本身不直接修改目标。", "Only a change proposal with an applicable policy decision may guide correction activity; the proposal never mutates the target directly.", "適用されるポリシー判断を得た変更提案だけが修正活動を導き、提案自体は対象を直接変更しません。") });
  };

  const completeMemoryPipelineSemantics = () => {
    const indexModuleId = "memory-embedding-indexes";
    const refreshReason = localized("IndexRefreshEvent 只记录或触发刷新，不执行索引构建；IndexRefreshRun 才读取表示并产生新版本。", "IndexRefreshEvent only records or triggers refresh; IndexRefreshRun performs the work and produces a new index version.", "IndexRefreshEvent は更新を記録・起動するだけで、IndexRefreshRun が処理を実行し新しい索引版を生成します。");
    deprecateRelation("IndexRefreshEvent-produces-IndexVersion", ["IndexRefreshEvent-triggers-IndexRefreshRun", "IndexRefreshRun-produces-IndexVersion"], refreshReason);
    deprecateRelation("IndexRefreshEvent-supersedes-IndexVersion", ["IndexRefreshRun-supersedes-IndexVersion"], refreshReason);
    upsertReviewedConcept({ id: "IndexRefreshRun", moduleId: indexModuleId, labels: localized("索引刷新运行", "Index refresh run", "索引更新実行"), definitions: localized("索引刷新运行是读取已有索引版本与新表示、重建受影响条目并产生不可变新索引版本的活动。", "An index refresh run is an activity that reads an existing index version and new representations, rebuilds affected entries, and produces a new immutable index version.", "索引更新実行は既存索引版と新しい表現を読み、影響する項目を再構築し、不変の新索引版を生成する活動です。"), semanticKind: "activity", primaryParentRelationId: "IndexRefreshRun-is_a-IndexActivity" });
    upsertReviewedRelation({ id: "IndexRefreshRun-is_a-IndexActivity", moduleId: indexModuleId, predicate: "is_a", sourceId: "IndexRefreshRun", targetId: "IndexActivity", relationKind: "hierarchy", definitions: localized("索引刷新运行是以增量或全量替换既有索引版本为区分特征的索引活动。", "An index refresh run is an index activity distinguished by incrementally or fully replacing an existing index version.", "索引更新実行は既存索引版を増分または全量で置換することを種差とする索引活動です。") });
    const indexFacts = [
      ["IndexRefreshEvent-triggers-IndexRefreshRun", "triggers", "IndexRefreshEvent", "IndexRefreshRun", "causal", "索引刷新事件触发一次可审计的索引刷新运行。", "An index refresh event triggers an auditable index refresh run.", "索引更新イベントは監査可能な索引更新実行を起動します。"],
      ["IndexRefreshRun-produces-IndexVersion", "produces", "IndexRefreshRun", "IndexVersion", "causal", "索引刷新运行产生新的不可变索引版本。", "An index refresh run produces a new immutable index version.", "索引更新実行は新しい不変索引版を生成します。"],
      ["IndexRefreshRun-supersedes-IndexVersion", "supersedes", "IndexRefreshRun", "IndexVersion", "temporal", "索引刷新运行声明新版本替代的先前索引版本。", "An index refresh run identifies the prior index version superseded by its new version.", "索引更新実行は新しい版が置き換える以前の索引版を示します。"],
      ["IndexVersion-contains-IndexShard", "contains", "IndexVersion", "IndexShard", "composition", "索引版本包含属于该版本的一个或多个索引分片。", "An index version contains one or more index shards belonging to that version.", "索引版はその版に属する一つ以上の索引シャードを含みます。"],
      ["IndexShard-contains-IndexEntry", "contains", "IndexShard", "IndexEntry", "composition", "索引分片包含被共同部署、读取或替换的索引条目。", "An index shard contains index entries deployed, read, or replaced together.", "索引シャードは共同配置、読取、置換される索引項目を含みます。"],
    ];
    deprecateRelation("IndexEntry-part_of-IndexVersion", ["IndexVersion-contains-IndexShard", "IndexShard-contains-IndexEntry"], localized("分片化索引中的条目通过 IndexVersion contains IndexShard、IndexShard contains IndexEntry 的单向组合链获得版本归属。", "In a sharded index, version membership follows the single directed composition chain IndexVersion contains IndexShard and IndexShard contains IndexEntry.", "シャード化索引の版所属は IndexVersion contains IndexShard、IndexShard contains IndexEntry という単一方向の構成連鎖で表します。"));
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of indexFacts) upsertReviewedRelation({ id, moduleId: indexModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    const inverseCompositionReason = localized(
      "contains 已经提供唯一 canonical 方向，反向导航由 inverse_reading 给出；保留第二条 part_of 事实会重复同一组合断言。",
      "contains supplies the single canonical direction and inverse_reading supplies reverse navigation; retaining a second part_of fact would duplicate the same composition assertion.",
      "contains が単一の canonical 方向を与え、逆方向ナビゲーションは inverse_reading が担います。別の part_of 事実を残すと同じ構成表明が重複します。",
    );
    deprecateRelation("IndexEntry-part_of-IndexShard", ["IndexShard-contains-IndexEntry"], inverseCompositionReason);
    deprecateRelation("IndexShard-part_of-IndexVersion", ["IndexVersion-contains-IndexShard"], inverseCompositionReason);

    const chunkModuleId = "memory-chunking-situating";
    const referenceReason = localized("ChunkReference 是指向分块与来源跨度的引用记录，不是 ChunkArtifact 的子类。", "ChunkReference is a reference record pointing to a chunk and source span, not a subclass of ChunkArtifact.", "ChunkReference はチャンクと出典範囲を指す参照記録であり、ChunkArtifact の下位型ではありません。");
    deprecateRelation("ChunkReference-is_a-ChunkArtifact", ["Chunk-has_reference-ChunkReference"], referenceReason);
    updateReviewedConcept("ChunkReference", { primary_parent_relation_id: null, root_status: "composition-root" });
    const duplicateReferenceReason = localized(
      "Chunk-has_reference-ChunkReference 已提供计划批准的唯一 canonical 方向；ChunkReference-references-Chunk 是同一端点事实的反向重复，反向查询由 has_reference 的 inverse_reading 提供。",
      "Chunk-has_reference-ChunkReference supplies the plan-approved canonical direction; ChunkReference-references-Chunk duplicates the same endpoint fact in reverse, and reverse navigation is provided by the has_reference inverse reading.",
      "Chunk-has_reference-ChunkReference が計画で承認された単一の canonical 方向を与えます。ChunkReference-references-Chunk は同じ端点事実の逆向き重複で、逆方向照会は has_reference の inverse reading が担います。",
    );
    deprecateRelation(
      "ChunkReference-references-Chunk",
      ["Chunk-has_reference-ChunkReference"],
      duplicateReferenceReason,
    );
    upsertReviewedRelation({
      id: "Chunk-has_reference-ChunkReference",
      moduleId: chunkModuleId,
      predicate: "has_reference",
      sourceId: "Chunk",
      targetId: "ChunkReference",
      relationKind: "information",
      definitions: localized(
        "分块具有一个以稳定身份描述该分块及其来源跨度的引用记录；引用记录与目标分块保持不同身份。",
        "A chunk has a reference record that identifies the chunk and its source span by stable identity; the reference record and target chunk retain distinct identities.",
        "チャンクは当該チャンクと出典範囲を安定同一性で示す参照記録を持ち、参照記録と対象チャンクは別の同一性を保持します。",
      ),
      inverseReading: {
        predicate: "is_reference_of_chunk",
        labels: localized("引用所属分块", "is reference of chunk", "チャンクの参照記録である"),
      },
    });

    const chunkMetadata = allConcepts().get("ChunkMetadata");
    if (!chunkMetadata) throw new Error("ChunkMetadata is missing");
    const chunkClaims = claimsFor(chunkMetadata, moduleDocuments.get(chunkModuleId).document.module);
    const optionalField = (id, labels, datatype, definitions, exampleValue) => ({ id, labels, datatype, required: false, cardinality: { min: 0, max: 1 }, definitions, allowed_values: [], pattern: null, example_value: exampleValue, source_claims: chunkClaims });
    const metadataFields = [
      optionalField("boundary_start", localized("起始边界", "boundary start", "開始境界"), "integer", localized("分块在规范化来源中的起始偏移。", "The chunk's starting offset in its normalized source.", "正規化済み出典におけるチャンク開始オフセットです。"), 0),
      optionalField("boundary_end", localized("结束边界", "boundary end", "終了境界"), "integer", localized("分块在规范化来源中的结束偏移。", "The chunk's ending offset in its normalized source.", "正規化済み出典におけるチャンク終了オフセットです。"), 512),
      optionalField("overlap_size", localized("重叠大小", "overlap size", "重複量"), "integer", localized("该分块与相邻分块共享的 token 或字符数量。", "The number of tokens or characters shared with an adjacent chunk.", "隣接チャンクと共有するトークンまたは文字数です。"), 64),
      optionalField("quality_score", localized("质量评分", "quality score", "品質スコア"), "number", localized("在明确评分规范下计算的分块质量值。", "A chunk-quality value computed under an explicit scoring specification.", "明示的な評価仕様で計算したチャンク品質値です。"), 0.94),
      optionalField("context_note", localized("上下文注记", "context note", "コンテキスト注記"), "string", localized("不具独立身份、用于解释该分块语境的短注记。", "A short note without independent identity that explains the chunk's context.", "独立同一性を持たずチャンク文脈を説明する短い注記です。"), "section: installation"),
    ];
    updateReviewedConcept("ChunkMetadata", { structure: { ...chunkMetadata.structure, identity_keys: chunkMetadata.structure?.identity_keys ?? [], fields: [...(chunkMetadata.structure?.fields ?? []).filter((candidate) => !metadataFields.some(({ id }) => id === candidate.id)), ...metadataFields], constraints: chunkMetadata.structure?.constraints ?? [], required_relation_constraints: chunkMetadata.structure?.required_relation_constraints ?? [] } });
    const metadataReason = localized("边界、重叠、质量与上下文注记没有独立生命周期或引用身份，v3 将其收敛为 ChunkMetadata 字段。", "Boundary, overlap, quality, and context notes have no independent lifecycle or reference identity, so v3 folds them into ChunkMetadata fields.", "境界、重複、品質、文脈注記は独立ライフサイクルや参照同一性を持たないため、v3 では ChunkMetadata の項目へ統合します。");
    const metadataConcepts = ["ChunkBoundary", "ChunkOverlap", "ChunkQualitySignal", "ChunkContextNote"];
    for (const conceptId of metadataConcepts) {
      deprecateRelation(`${conceptId}-is_a-ChunkMetadata`, [], metadataReason);
      deprecateConcept(conceptId, ["ChunkMetadata"], metadataReason);
    }
    deprecateRelation("chunk_has_boundary", [], metadataReason);

    const ingestionModuleId = "memory-ingestion";
    upsertReviewedConcept({ id: "NormalizationActivity", moduleId: ingestionModuleId, labels: localized("规范化活动", "Normalization activity", "正規化活動"), definitions: localized("规范化活动把可接入信息转换为具有统一编码、结构和来源字段的文档，而不改变其来源身份。", "A normalization activity converts ingestible information into a document with consistent encoding, structure, and provenance fields without changing source identity.", "正規化活動は出典同一性を変えず、取込可能情報を統一された符号化、構造、出典項目を持つ文書へ変換します。"), semanticKind: "activity" });
    upsertReviewedConcept({ id: "DeduplicationActivity", moduleId: ingestionModuleId, labels: localized("去重活动", "Deduplication activity", "重複排除活動"), definitions: localized("去重活动比较规范化内容、来源和策略范围，阻止同一记忆对象被重复写入，并产生可审计去重事件。", "A deduplication activity compares normalized content, provenance, and policy scope, prevents duplicate memory writes, and produces an auditable deduplication event.", "重複排除活動は正規化内容、出典、ポリシー範囲を比較し、同一記憶対象の重複書込を防ぎ、監査可能な重複排除イベントを生成します。"), semanticKind: "activity" });
    const loadReason = localized("IngestionRun 对文档的 canonical 产出由 produces 表达；loads_document 没有额外身份或约束，属于重复事实。", "The canonical document output of IngestionRun is expressed by produces; loads_document adds no distinct identity or constraint and duplicates the fact.", "IngestionRun の canonical 文書出力は produces で表し、loads_document は追加の同一性や制約がなく重複事実です。");
    deprecateRelation("ingestion_run_loads_document", ["IngestionRun-produces-Document"], loadReason);
    deprecateRelation("DeduplicationEvent-prevents_duplicate-MemoryWrite", ["DeduplicationActivity-prevents_duplicate-MemoryWrite"], localized("去重事件记录结果，执行阻止重复写入的是去重活动。", "A deduplication event records the result; the deduplication activity performs prevention of duplicate writes.", "重複排除イベントは結果を記録し、重複書込を防ぐのは重複排除活動です。"));
    const ingestionFacts = [
      ["IngestionRun-has_phase-NormalizationActivity", "has_phase", "IngestionRun", "NormalizationActivity", "temporal", "记忆接入运行包含将输入统一为可处理文档的规范化阶段。", "A memory-ingestion run includes a normalization phase that turns input into a consistently processable document.", "記憶取込実行は入力を一貫して処理可能な文書へ変える正規化段階を含みます。"],
      ["IngestionRun-has_phase-DeduplicationActivity", "has_phase", "IngestionRun", "DeduplicationActivity", "temporal", "记忆接入运行包含在写入前检查重复身份的去重阶段。", "A memory-ingestion run includes a deduplication phase that checks duplicate identity before writing.", "記憶取込実行は書込前に重複同一性を検査する重複排除段階を含みます。"],
      ["NormalizationActivity-consumes-IngestibleInformation", "consumes", "NormalizationActivity", "IngestibleInformation", "information", "规范化活动消费保留来源的可接入信息。", "A normalization activity consumes ingestible information that retains provenance.", "正規化活動は出典を保持する取込可能情報を消費します。"],
      ["NormalizationActivity-produces-Document", "produces", "NormalizationActivity", "Document", "causal", "规范化活动产生结构与编码统一、仍保留来源的文档。", "A normalization activity produces a structurally and textually normalized document that retains provenance.", "正規化活動は出典を保持した構造・符号化統一文書を生成します。"],
      ["NormalizationActivity-precedes-DeduplicationActivity", "precedes", "NormalizationActivity", "DeduplicationActivity", "temporal", "先规范化再比较摘要与来源，才能稳定判定重复身份。", "Normalization precedes digest and provenance comparison so duplicate identity is determined consistently.", "重複同一性を安定判定するため、正規化後にダイジェストと出典を比較します。"],
      ["DeduplicationActivity-consumes-Document", "consumes", "DeduplicationActivity", "Document", "information", "去重活动消费规范化文档并比较内容、来源和策略范围。", "A deduplication activity consumes normalized documents and compares content, provenance, and policy scope.", "重複排除活動は正規化文書を消費し、内容、出典、ポリシー範囲を比較します。"],
      ["DeduplicationActivity-produces-DeduplicationEvent", "produces", "DeduplicationActivity", "DeduplicationEvent", "causal", "去重活动产生说明匹配依据和处理决定的去重事件。", "A deduplication activity produces an event recording match evidence and handling decision.", "重複排除活動は一致根拠と処理判断を記録するイベントを生成します。"],
      ["DeduplicationActivity-prevents_duplicate-MemoryWrite", "prevents_duplicate", "DeduplicationActivity", "MemoryWrite", "governance", "当文档在适用范围内已存在时，去重活动阻止重复记忆写入。", "When a document already exists in the applicable scope, deduplication prevents a duplicate memory write.", "適用範囲に文書が既存の場合、重複排除活動は重複記憶書込を防ぎます。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of ingestionFacts) upsertReviewedRelation({ id, moduleId: ingestionModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
  };

  const completeInstructionAndDisclosureProcessing = () => {
    const promptModuleId = "info-prompts-instructions";
    upsertReviewedConcept({ id: "InstructionProcessing", moduleId: promptModuleId, labels: localized("指令处理", "Instruction processing", "指示処理"), definitions: localized("指令处理是把提示实例中的指令解析、检测冲突并根据权威性、优先级和作用域产生解决结果的活动。", "Instruction processing is the activity that parses instructions from a prompt instance, detects conflicts, and produces a resolution using authority, priority, and scope.", "指示処理はプロンプト実例から指示を解析し、競合を検出し、権威、優先度、スコープに基づく解決結果を生成する活動です。"), semanticKind: "activity" });
    const instructionPhases = [
      ["InstructionParsingActivity", "指令解析活动", "Instruction parsing activity", "指示解析活動", "指令解析活动识别提示实例中的指令边界、角色来源和元数据，不负责冲突裁决。", "Instruction parsing identifies instruction boundaries, role provenance, and metadata in a prompt instance without resolving conflicts.", "指示解析活動はプロンプト実例内の指示境界、役割出典、メタデータを識別し、競合解決は行いません。"],
      ["InstructionConflictDetectionActivity", "指令冲突检测活动", "Instruction conflict-detection activity", "指示競合検出活動", "指令冲突检测活动比较已解析指令的权威性、优先级、作用域和内容，并引用安全域的冲突记录。", "Instruction conflict detection compares authority, priority, scope, and content of parsed instructions and references safety-owned conflict records.", "指示競合検出活動は解析済み指示の権威、優先度、スコープ、内容を比較し、安全領域所有の競合記録を参照します。"],
      ["InstructionResolutionActivity", "指令解决活动", "Instruction resolution activity", "指示解決活動", "指令解决活动按照显式规则处理冲突与覆盖，产生说明最终有效指令及理由的解决结果。", "Instruction resolution applies explicit rules to conflicts and overrides and produces a result stating effective instructions and rationale.", "指示解決活動は明示規則で競合と上書きを処理し、最終有効指示と理由を示す結果を生成します。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of instructionPhases) {
      upsertReviewedConcept({ id, moduleId: promptModuleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity", primaryParentRelationId: `${id}-is_a-InstructionProcessing` });
      upsertReviewedRelation({ id: `${id}-is_a-InstructionProcessing`, moduleId: promptModuleId, predicate: "is_a", sourceId: id, targetId: "InstructionProcessing", relationKind: "hierarchy", definitions: localized(`${zh}是指令处理的一种专门活动。`, `${en} is a specialized kind of instruction processing.`, `${ja}は指示処理の特殊な活動です。`) });
      upsertReviewedRelation({ id: `InstructionProcessing-has_phase-${id}`, moduleId: promptModuleId, predicate: "has_phase", sourceId: "InstructionProcessing", targetId: id, relationKind: "temporal", definitions: localized(`一次完整指令处理包含${zh}。`, `A complete instruction-processing run includes ${en}.`, `完全な指示処理は${ja}を含みます。`) });
    }
    const instructionFacts = [
      ["InstructionParsingActivity-consumes-PromptTemplateInstance", "consumes", "InstructionParsingActivity", "PromptTemplateInstance", "information", "指令解析活动读取已绑定变量的提示模板实例。", "Instruction parsing reads a prompt-template instance with bound variables.", "指示解析活動は変数が束縛されたプロンプトテンプレート実例を読みます。"],
      ["InstructionParsingActivity-produces-Instruction", "produces", "InstructionParsingActivity", "Instruction", "causal", "指令解析活动产生保持来源与边界的指令规范。", "Instruction parsing produces instruction specifications retaining provenance and boundaries.", "指示解析活動は出典と境界を保持する指示仕様を生成します。"],
      ["InstructionParsingActivity-precedes-InstructionConflictDetectionActivity", "precedes", "InstructionParsingActivity", "InstructionConflictDetectionActivity", "temporal", "只有先解析出指令及元数据，才能检测冲突。", "Conflicts can be detected only after instructions and metadata are parsed.", "指示とメタデータを解析した後に競合を検出します。"],
      ["InstructionConflictDetectionActivity-detects-InstructionConflict", "detects", "InstructionConflictDetectionActivity", "InstructionConflict", "information", "冲突检测活动引用安全域拥有的指令冲突记录，不复制其身份。", "Conflict detection references the safety-owned instruction-conflict record without duplicating its identity.", "競合検出は安全領域所有の指示競合記録を参照し、その同一性を複製しません。"],
      ["InstructionConflictDetectionActivity-precedes-InstructionResolutionActivity", "precedes", "InstructionConflictDetectionActivity", "InstructionResolutionActivity", "temporal", "检测到的冲突和覆盖候选进入指令解决活动。", "Detected conflicts and override candidates feed instruction resolution.", "検出された競合と上書き候補は指示解決活動へ渡されます。"],
      ["InstructionResolutionActivity-produces-InstructionResolution", "produces", "InstructionResolutionActivity", "InstructionResolution", "causal", "指令解决活动产生可追溯的指令解决结果。", "Instruction resolution produces a traceable instruction-resolution result.", "指示解決活動は追跡可能な指示解決結果を生成します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of instructionFacts) upsertReviewedRelation({ id, moduleId: promptModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });

    const disclosureModuleId = "info-output-disclosure";
    const disclosureModule = moduleDocuments.get(disclosureModuleId).document.module;
    const disclosureClaims = claimsFor(disclosureModule, disclosureModule);
    upsertReviewedConcept({ id: "DisclosureActivity", moduleId: disclosureModuleId, labels: localized("输出披露活动", "Output disclosure activity", "出力開示活動"), definitions: localized("输出披露活动根据受众、可见窗口与安全决策，对运行输出执行选择、截断、抑制或发布并产生披露记录。", "An output-disclosure activity applies selection, truncation, suppression, or publication to runtime output under audience, visible-window, and safety decisions and produces a disclosure record.", "出力開示活動は受信者、可視窓、安全判断に基づき実行出力を選択、切詰め、抑制、公開し、開示記録を生成します。"), semanticKind: "activity" });
    const outcomeValues = [
      ["disclosure-outcome-shown", "shown", "显示", "shown", "表示", "内容被允许向目标受众显示。", "Content was allowed to be shown to the target audience.", "内容は対象受信者への表示を許可されました。"],
      ["disclosure-outcome-truncated", "truncated", "截断", "truncated", "切詰め", "内容仅有满足窗口或策略限制的部分被显示。", "Only the portion satisfying window or policy limits was shown.", "窓またはポリシー制限を満たす部分だけが表示されました。"],
      ["disclosure-outcome-suppressed", "suppressed", "抑制", "suppressed", "抑制", "内容没有向目标受众显示。", "Content was not shown to the target audience.", "内容は対象受信者へ表示されませんでした。"],
    ];
    upsertReviewedConcept({
      id: "DisclosureRecord",
      moduleId: disclosureModuleId,
      labels: localized("输出披露记录", "Output disclosure record", "出力開示記録"),
      definitions: localized("输出披露记录是一次披露活动的可审计信息，记录目标受众、内容引用、适用决策以及显示、截断或抑制结果。", "An output-disclosure record is auditable information for one disclosure activity, recording target audience, content references, applicable decisions, and a shown, truncated, or suppressed outcome.", "出力開示記録は一回の開示活動を監査する情報で、対象受信者、内容参照、適用判断、表示・切詰め・抑制結果を記録します。"),
      semanticKind: "information",
      structure: {
        identity_keys: ["disclosure_record_id"],
        fields: [
          { id: "disclosure_record_id", labels: localized("披露记录 ID", "disclosure record ID", "開示記録 ID"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("唯一标识一条输出披露记录。", "Uniquely identifies one output-disclosure record.", "一つの出力開示記録を一意に識別します。"), allowed_values: [], pattern: null, example_value: "disclosure-record-071", source_claims: disclosureClaims },
          { id: "outcome_code", labels: localized("披露结果", "disclosure outcome", "開示結果"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("记录显示、截断或抑制三种受控披露结果之一。", "Records one controlled disclosure outcome: shown, truncated, or suppressed.", "表示、切詰め、抑制の統制された開示結果の一つを記録します。"), allowed_values: outcomeValues.map(([id, value, zh, en, ja, definitionZh, definitionEn, definitionJa]) => ({ id, value, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), status: "accepted", source_claims: disclosureClaims })), pattern: null, example_value: "shown", source_claims: disclosureClaims },
        ],
        constraints: [],
        required_relation_constraints: [],
      },
    });
    const disclosureActivities = [
      ["DisclosureSelectionActivity", "披露选择活动", "Disclosure selection activity", "開示選択活動", "披露选择活动确定哪些输出片段有资格进入目标受众的披露候选。", "Disclosure selection determines which output segments are eligible for a target audience.", "開示選択活動は対象受信者への開示候補となる出力断片を決定します。"],
      ["DisclosureTruncationActivity", "披露截断活动", "Disclosure truncation activity", "開示切詰め活動", "披露截断活动按照窗口或策略边界缩短已选择内容并保留省略范围。", "Disclosure truncation shortens selected content to window or policy bounds while retaining omitted ranges.", "開示切詰め活動は窓またはポリシー境界に合わせ選択内容を短縮し、省略範囲を保持します。"],
      ["DisclosureSuppressionActivity", "披露抑制活动", "Disclosure suppression activity", "開示抑制活動", "披露抑制活动阻止不满足授权或安全条件的内容到达目标受众。", "Disclosure suppression prevents content that fails authorization or safety conditions from reaching the target audience.", "開示抑制活動は認可または安全条件を満たさない内容が対象受信者へ届くのを防ぎます。"],
      ["DisclosurePublicationActivity", "披露发布活动", "Disclosure publication activity", "開示公開活動", "披露发布活动把允许的最终输出片段释放给目标受众和信任边界。", "Disclosure publication releases the allowed final output segments to the target audience and trust boundary.", "開示公開活動は許可された最終出力断片を対象受信者と信頼境界へ公開します。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of disclosureActivities) {
      upsertReviewedConcept({ id, moduleId: disclosureModuleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity", primaryParentRelationId: `${id}-is_a-DisclosureActivity` });
      upsertReviewedRelation({ id: `${id}-is_a-DisclosureActivity`, moduleId: disclosureModuleId, predicate: "is_a", sourceId: id, targetId: "DisclosureActivity", relationKind: "hierarchy", definitions: localized(`${zh}是输出披露活动的一种。`, `${en} is a kind of output-disclosure activity.`, `${ja}は出力開示活動の一種です。`) });
    }
    const stageReason = localized("DisclosureStage 只表示模糊阶段且与四类披露活动重叠，v3 以明确活动与披露记录替换。", "DisclosureStage represented an ambiguous stage overlapping four explicit disclosure activities, so v3 replaces it with those activities and DisclosureRecord.", "DisclosureStage は四つの明示的開示活動と重なる曖昧な段階だったため、v3 は明示活動と DisclosureRecord で置換します。");
    deprecateRelation("DisclosureStage-governed_by-ProgressiveDisclosure", ["DisclosureActivity-governed_by-ProgressiveDisclosure"], stageReason);
    deprecateRelation("DisclosureStage-produces-DisclosedOutputSegment", ["DisclosurePublicationActivity-produces-DisclosedOutputSegment"], stageReason);
    deprecateConcept("DisclosureStage", ["DisclosureActivity"], stageReason);
    const disclosureFacts = [
      ["DisclosureActivity-produces-DisclosureRecord", "produces", "DisclosureActivity", "DisclosureRecord", "causal", "每次输出披露活动产生记录受众、内容、决策和受控结果的披露记录。", "Each output-disclosure activity produces a record of audience, content, decisions, and controlled outcome.", "各出力開示活動は受信者、内容、判断、統制結果を記録する開示記録を生成します。"],
      ["DisclosureRecord-references-OutputSegment", "references", "DisclosureRecord", "OutputSegment", "information", "披露记录引用被显示、截断或抑制的原输出片段，而不把片段误作记录子类。", "A disclosure record references the original output segment shown, truncated, or suppressed without classifying the segment as a record.", "開示記録は表示、切詰め、抑制された元出力断片を参照し、断片を記録の下位型にしません。"],
      ["DisclosureActivity-governed_by-ProgressiveDisclosure", "governed_by", "DisclosureActivity", "ProgressiveDisclosure", "governance", "输出披露活动受安全域拥有的渐进披露规则治理。", "Output-disclosure activity is governed by the safety-owned progressive-disclosure rule.", "出力開示活動は安全領域所有の段階的開示規則に統治されます。"],
      ["DisclosurePublicationActivity-produces-DisclosedOutputSegment", "produces", "DisclosurePublicationActivity", "DisclosedOutputSegment", "causal", "披露发布活动产生最终允许向受众显示的输出片段。", "Disclosure publication produces the final output segment allowed for the audience.", "開示公開活動は受信者への表示を許可された最終出力断片を生成します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of disclosureFacts) upsertReviewedRelation({ id, moduleId: disclosureModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
  };

  const completeDelegationSelectionAndHandoff = () => {
    const moduleId = "orchestration-delegation-handoff";
    const contextIsolation = allConcepts().get("ContextIsolation");
    if (!contextIsolation) throw new Error("ContextIsolation is missing");
    upsertReviewedConcept({
      id: "ContextIsolation",
      moduleId,
      labels: localized(
        "委派上下文隔离规范",
        "Delegation context-isolation specification",
        "委任コンテキスト分離仕様",
      ),
      definitions: localized(
        "委派上下文隔离规范是为一次委派明确可见与排除的消息、记忆、工具和来源的边界规范；它不表示安全沙箱隔离，也不表示被传递的上下文内容本身。",
        "A delegation context-isolation specification is a boundary specification that declares the messages, memory, tools, and sources visible to or excluded from one delegation; it is neither sandbox isolation nor the delegated context content itself.",
        "委任コンテキスト分離仕様は、一回の委任について可視または除外するメッセージ、記憶、ツール、情報源を宣言する境界仕様であり、安全サンドボックス分離でも委任されるコンテキスト内容そのものでもありません。",
      ),
      semanticKind: "specification",
      sourceClaims: claimsFor(contextIsolation, moduleDocuments.get(moduleId).document.module),
    });
    upsertReviewedConcept({
      id: "DelegationContext",
      moduleId,
      labels: localized("委派上下文", "Delegation context", "委任コンテキスト"),
      definitions: localized(
        "委派上下文是按一项委派契约和上下文隔离规范形成的有界上下文信息，记录受派工作所需且获准披露的任务状态、消息、记忆、工具和来源。",
        "Delegation context is bounded context information formed under one delegation contract and context-isolation specification, recording the task state, messages, memory, tools, and sources required and authorized for delegated work.",
        "委任コンテキストは、一つの委任契約とコンテキスト分離仕様の下で形成され、委任作業に必要かつ開示を許可されたタスク状態、メッセージ、記憶、ツール、情報源を記録する境界付きコンテキスト情報です。",
      ),
      semanticKind: "information",
    });
    upsertReviewedConcept({
      id: "SubagentContext",
      moduleId,
      labels: localized("子智能体上下文", "Subagent context", "サブエージェントコンテキスト"),
      definitions: localized(
        "子智能体上下文是按子智能体接收者角色专化的委派上下文，包含其执行受派工作所需且获准可见的任务状态、消息、记忆、工具和来源。",
        "Subagent context is delegation context specialized for a subagent recipient role, containing the task state, messages, memory, tools, and sources required and authorized for its delegated work.",
        "サブエージェントコンテキストは、サブエージェント受領者ロール向けに特殊化された委任コンテキストで、委任作業に必要かつ可視化を許可されたタスク状態、メッセージ、記憶、ツール、情報源を含みます。",
      ),
      semanticKind: "information",
      primaryParentRelationId: "SubagentContext-is_a-DelegationContext",
    });
    const contextReason = localized(
      "v3 将委派契约、隔离规范、委派上下文和面向子智能体的具体上下文分成连续而不重复的语义层级。",
      "v3 separates delegation contract, isolation specification, delegation context, and the subagent-specific context into a continuous non-duplicative semantic chain.",
      "v3 は委任契約、分離仕様、委任コンテキスト、サブエージェント固有コンテキストを、重複しない連続的な意味階層へ分離します。",
    );
    deprecateRelation(
      "DelegationContract-bounds-SubagentContext",
      [
        "DelegationContract-specifies-ContextIsolation",
        "ContextIsolation-bounds-DelegationContext",
        "SubagentContext-is_a-DelegationContext",
      ],
      contextReason,
    );
    upsertReviewedRelation({
      id: "DelegationContract-specifies-ContextIsolation",
      moduleId,
      predicate: "specifies",
      sourceId: "DelegationContract",
      targetId: "ContextIsolation",
      relationKind: "governance",
      definitions: localized(
        "委派契约规定适用于该次委派的上下文隔离规范，明确允许与排除的信息范围。",
        "A delegation contract specifies the context-isolation specification for that delegation, declaring the allowed and excluded information scope.",
        "委任契約は当該委任に適用するコンテキスト分離仕様を定め、許可・除外される情報範囲を明示します。",
      ),
    });
    upsertReviewedRelation({
      id: "ContextIsolation-bounds-DelegationContext",
      moduleId,
      predicate: "bounds",
      sourceId: "ContextIsolation",
      targetId: "DelegationContext",
      relationKind: "governance",
      definitions: localized(
        "委派上下文隔离规范限定委派上下文可包含和必须排除的信息、工具与来源。",
        "A delegation context-isolation specification bounds the information, tools, and sources that delegation context may include or must exclude.",
        "委任コンテキスト分離仕様は、委任コンテキストが含められる情報・ツール・情報源と除外すべき範囲を限定します。",
      ),
    });
    upsertReviewedRelation({
      id: "SubagentContext-is_a-DelegationContext",
      moduleId,
      predicate: "is_a",
      sourceId: "SubagentContext",
      targetId: "DelegationContext",
      relationKind: "hierarchy",
      definitions: localized(
        "子智能体上下文是按接收者角色专化、供子智能体执行受派工作使用的一种委派上下文。",
        "Subagent context is delegation context specialized for a recipient role and used by a subagent to perform delegated work.",
        "サブエージェントコンテキストは、受領者ロール向けに特殊化され、サブエージェントが委任作業を実行するために用いる委任コンテキストです。",
      ),
    });
    upsertReviewedRelation({
      id: "DelegationContract-specifies-WorkItem",
      moduleId,
      predicate: "specifies",
      sourceId: "DelegationContract",
      targetId: "WorkItem",
      relationKind: "governance",
      definitions: localized(
        "委派契约规定被委派的工作项及其范围，而不把工作项重新定义为契约的一部分或子类。",
        "A delegation contract specifies the delegated work item and its scope without redefining the work item as a contract part or subtype.",
        "委任契約は委任対象の作業項目と範囲を定めますが、作業項目を契約の構成要素や下位型として再定義しません。",
      ),
    });
    upsertReviewedRelation({
      id: "DelegationEvent-records_phase-DelegationPhase",
      moduleId,
      predicate: "records_phase",
      sourceId: "DelegationEvent",
      targetId: "DelegationPhase",
      relationKind: "information",
      definitions: localized(
        "委派事件记录该事件使哪一委派阶段生效，从而让阶段历史可查询且不把事件误作阶段子类。",
        "A delegation event records which delegation phase it made effective, making phase history queryable without classifying an event as a phase subtype.",
        "委任イベントはどの委任段階を有効にしたかを記録し、イベントを段階の下位型とせずに段階履歴を照会可能にします。",
      ),
    });
    upsertReviewedConcept({ id: "WorkerSelectionProcess", moduleId, labels: localized("工作者选择过程", "Worker selection process", "ワーカー選択プロセス"), definitions: localized("工作者选择过程是在委派范围内评估可用性、匹配能力、作出选择并分配工作的协作过程。", "A worker selection process is a collaboration process within delegation that assesses availability, matches capability, makes a selection, and assigns work.", "ワーカー選択プロセスは委任範囲内で可用性を評価し、能力を照合し、選択して作業を割り当てる協働プロセスです。"), semanticKind: "activity", primaryParentRelationId: "WorkerSelectionProcess-is_a-DelegationProcess" });
    upsertReviewedRelation({ id: "WorkerSelectionProcess-is_a-DelegationProcess", moduleId, predicate: "is_a", sourceId: "WorkerSelectionProcess", targetId: "DelegationProcess", relationKind: "hierarchy", definitions: localized("工作者选择过程是以确定受派工作者和分配范围为区分特征的委派过程。", "A worker selection process is a delegation process distinguished by identifying a delegate and assigning scope.", "ワーカー選択プロセスは受任ワーカーと割当範囲を決定することを種差とする委任プロセスです。") });
    const activities = [
      ["WorkerAvailabilityAssessment", "工作者可用性评估", "Worker availability assessment", "ワーカー可用性評価", "工作者可用性评估检查候选角色在所需时间、预算和并发范围内是否可承担工作。", "Worker availability assessment checks whether candidate roles can accept work within required time, budget, and concurrency bounds.", "ワーカー可用性評価は候補ロールが必要時間、予算、同時実行範囲で作業を引き受けられるか検査します。"],
      ["WorkerCapabilityMatching", "工作者能力匹配", "Worker capability matching", "ワーカー能力照合", "工作者能力匹配把任务需求、权限与候选工作者能力证据进行比较。", "Worker capability matching compares task requirements and authority with candidate-worker capability evidence.", "ワーカー能力照合はタスク要件と権限を候補ワーカーの能力証拠と比較します。"],
      ["WorkerSelectionDecisionActivity", "工作者选择决定活动", "Worker selection decision activity", "ワーカー選択判断活動", "工作者选择决定活动在可用候选中依据匹配证据和委派合同确定受派方。", "Worker selection decision activity chooses a delegate among available candidates using match evidence and the delegation contract.", "ワーカー選択判断活動は照合証拠と委任契約に基づき可用候補から受任者を選びます。"],
      ["WorkerAssignment", "工作者分配活动", "Worker assignment activity", "ワーカー割当活動", "工作者分配活动把工作项、责任、权限和验收条件绑定到已选择的工作者角色。", "Worker assignment binds work items, responsibility, authority, and acceptance conditions to the selected worker role.", "ワーカー割当活動は作業項目、責任、権限、受け入れ条件を選択済みワーカーロールへ束ねます。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of activities) {
      upsertReviewedConcept({ id, moduleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "activity" });
      upsertReviewedRelation({ id: `${id}-phase_of-WorkerSelectionProcess`, moduleId, predicate: "phase_of", sourceId: id, targetId: "WorkerSelectionProcess", relationKind: "temporal", definitions: localized(`${zh}是工作者选择过程中的可审计阶段。`, `${en} is an auditable phase of worker selection.`, `${ja}はワーカー選択プロセスの監査可能な段階です。`) });
    }
    updateReviewedConcept("TaskDistribution", { primary_parent_relation_id: "TaskDistribution-is_a-WorkerAssignment", root_status: null });
    upsertReviewedRelation({ id: "TaskDistribution-is_a-WorkerAssignment", moduleId, predicate: "is_a", sourceId: "TaskDistribution", targetId: "WorkerAssignment", relationKind: "hierarchy", definitions: localized("任务分发是把一个或多个工作项分配给已选择工作者的一种工作者分配活动。", "Task distribution is a worker-assignment activity that allocates one or more work items to selected workers.", "タスク配分は一つ以上の作業項目を選択済みワーカーへ割り当てるワーカー割当活動です。") });
    deprecateRelation(
      "TaskDistribution-is_a-DelegationProcess",
      ["TaskDistribution-is_a-WorkerAssignment"],
      localized(
        "任务分发专化工作者分配活动，而不是委派过程本身；委派过程通过工作者选择与分配阶段使用该活动。",
        "Task distribution specializes worker assignment rather than delegation process itself; delegation uses it through worker-selection and assignment phases.",
        "タスク配分は委任プロセスそのものではなくワーカー割当活動を特殊化し、委任プロセスはワーカー選択・割当段階を通じて利用します。",
      ),
    );
    upsertReviewedRelation({
      id: "WorkerSelectionProcess-uses-WorkerPool",
      moduleId,
      predicate: "uses",
      sourceId: "WorkerSelectionProcess",
      targetId: "WorkerPool",
      relationKind: "information",
      definitions: localized(
        "工作者选择过程使用候选池作为可用性判断、能力匹配与最终选择的共同候选边界。",
        "A worker-selection process uses a worker pool as the common candidate boundary for availability assessment, capability matching, and final selection.",
        "ワーカー選択プロセスは、可用性評価、能力照合、最終選択に共通する候補境界としてワーカープールを使用します。",
      ),
    });
    const agencyReason = localized("WorkerSelection 是选择完成时的事件；可用性评估和候选选择由相应活动执行。", "WorkerSelection is the event that records completion of selection; availability assessment and candidate choice are performed by their activities.", "WorkerSelection は選択完了を記録するイベントであり、可用性評価と候補選択は対応する活動が実行します。");
    deprecateRelation("WorkerSelection-evaluates-WorkerAvailability", ["WorkerAvailabilityAssessment-produces-WorkerAvailability"], agencyReason);
    deprecateRelation("WorkerSelection-selects_from-WorkerPool", ["WorkerSelectionDecisionActivity-selects_from-WorkerPool"], agencyReason);
    const facts = [
      ["WorkerAvailabilityAssessment-produces-WorkerAvailability", "produces", "WorkerAvailabilityAssessment", "WorkerAvailability", "causal", "可用性评估产生活动时间、容量和约束下的工作者可用状态。", "Availability assessment produces worker-availability state under time, capacity, and constraint conditions.", "可用性評価は時間、容量、制約条件下のワーカー可用状態を生成します。"],
      ["WorkerAvailabilityAssessment-precedes-WorkerCapabilityMatching", "precedes", "WorkerAvailabilityAssessment", "WorkerCapabilityMatching", "temporal", "只有满足基本可用性，候选才进入能力匹配。", "Only candidates satisfying basic availability proceed to capability matching.", "基本可用性を満たす候補だけが能力照合へ進みます。"],
      ["WorkerCapabilityMatching-produces-WorkerCapabilityMatch", "produces", "WorkerCapabilityMatching", "WorkerCapabilityMatch", "causal", "能力匹配活动产生保留需求、候选和证据的匹配记录。", "Capability matching produces a record retaining requirements, candidate, and evidence.", "能力照合活動は要件、候補、証拠を保持する照合記録を生成します。"],
      ["WorkerCapabilityMatching-precedes-WorkerSelectionDecisionActivity", "precedes", "WorkerCapabilityMatching", "WorkerSelectionDecisionActivity", "temporal", "选择决定在能力匹配证据形成后作出。", "The selection decision is made after capability-match evidence is formed.", "選択判断は能力照合証拠が形成された後に行います。"],
      ["WorkerSelectionDecisionActivity-selects_from-WorkerPool", "selects_from", "WorkerSelectionDecisionActivity", "WorkerPool", "information", "选择决定活动从满足委派范围的工作者池中选择受派角色。", "The selection-decision activity chooses a delegate role from a worker pool within delegation scope.", "選択判断活動は委任範囲内のワーカープールから受任ロールを選びます。"],
      ["WorkerSelectionDecisionActivity-produces-WorkerSelection", "produces", "WorkerSelectionDecisionActivity", "WorkerSelection", "causal", "选择决定活动产生记录被选工作者与依据的选择事件。", "The selection-decision activity produces a selection event recording the chosen worker and rationale.", "選択判断活動は選択ワーカーと理由を記録する選択イベントを生成します。"],
      ["WorkerSelectionDecisionActivity-precedes-WorkerAssignment", "precedes", "WorkerSelectionDecisionActivity", "WorkerAssignment", "temporal", "确定受派方之后才能把责任和工作项绑定给该角色。", "Responsibility and work items can be bound only after the delegate is selected.", "受任者を選択した後に責任と作業項目をそのロールへ束ねます。"],
      ["WorkerAssignment-produces-DelegationOwnership", "produces", "WorkerAssignment", "DelegationOwnership", "causal", "工作者分配活动产生说明责任归属、范围与交还条件的委派所有权记录。", "Worker assignment produces a delegation-ownership record for responsibility, scope, and return conditions.", "ワーカー割当活動は責任帰属、範囲、返還条件を示す委任所有権記録を生成します。"],
      ["WorkerPool-contains-WorkerRole", "contains", "WorkerPool", "WorkerRole", "composition", "工作者池包含在特定委派语境中可被评估和选择的工作者角色。", "A worker pool contains worker roles eligible for assessment and selection in a delegation context.", "ワーカープールは委任文脈で評価・選択可能なワーカーロールを含みます。"],
      ["HandoffProcess-produces-Handoff", "produces", "HandoffProcess", "Handoff", "causal", "移交过程产生标记控制权转移时点的移交事件。", "A handoff process produces a handoff event marking the point of control transfer.", "引き継ぎプロセスは制御移転時点を示す引き継ぎイベントを生成します。"],
      ["HandoffProcess-results_in-ResponsibilityTransfer", "results_in", "HandoffProcess", "ResponsibilityTransfer", "causal", "完成的移交过程形成记录责任、控制和上下文归属变化的责任转移。", "A completed handoff process results in a responsibility transfer recording changes in responsibility, control, and context custody.", "完了した引き継ぎプロセスは責任、制御、コンテキスト管理の変化を記録する責任移転をもたらします。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of facts) upsertReviewedRelation({ id, moduleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });

    const handoffTargetReason = localized(
      "移交目标不是独立的信息类型；控制权直接移交给具有稳定身份的运行主体，具体角色与范围继续附着在移交关系和契约上。",
      "Handoff target is not an independent information type; control transfers directly to a runtime actor with stable identity, while role and scope remain on the handoff relation and contract.",
      "引き継ぎ対象は独立した情報型ではなく、制御は安定した同一性を持つ実行アクターへ直接移転し、ロールと範囲は引き継ぎ関係と契約に保持されます。",
    );
    upsertReviewedRelation({
      id: "Handoff-transfers_control_to-AgentActor",
      moduleId,
      predicate: "transfers_control_to",
      sourceId: "Handoff",
      targetId: "AgentActor",
      relationKind: "governance",
      definitions: localized(
        "移交事件把后续任务或会话控制权转给一个明确的智能体运行主体，并保留移交范围与时点。",
        "A handoff event transfers subsequent task or conversation control to an identified agent actor while retaining the transfer scope and effective time.",
        "引き継ぎイベントは後続タスクまたは会話の制御を識別済みエージェントアクターへ移し、移転範囲と発効時点を保持します。",
      ),
    });
    deprecateRelation("transfers_control_to", ["Handoff-transfers_control_to-AgentActor"], handoffTargetReason);
    deprecateConcept("HandoffTarget", ["AgentActor"], handoffTargetReason);

    const invocationModuleId = "tool-invocation-execution";
    if (!allConcepts().has("AgentAsToolInvocation")) throw new Error("AgentAsToolInvocation is missing");
    upsertReviewedConcept({
      id: "AgentAsToolInvocation",
      moduleId: invocationModuleId,
      labels: localized("智能体工具调用", "Agent-as-tool invocation", "エージェントツール呼び出し"),
      definitions: localized(
        "智能体工具调用是被调用能力由智能体承载的一种程序化工具调用；调用管理者保留会话控制与答案责任，因此它不自动构成委派过程。",
        "Agent-as-tool invocation is a programmatic tool call whose invoked capability is carried by an agent; the caller retains conversation control and answer responsibility, so it does not automatically constitute a delegation process.",
        "エージェントツール呼び出しは、呼び出される能力をエージェントが担うプログラム的ツール呼び出しであり、呼び出し元が会話制御と回答責任を保持するため、自動的に委任プロセスを構成しません。",
      ),
      semanticKind: "activity",
      primaryParentRelationId: "AgentAsToolInvocation-is_a-ProgrammaticToolCall",
    });
    upsertReviewedRelation({
      id: "AgentAsToolInvocation-is_a-ProgrammaticToolCall",
      moduleId: invocationModuleId,
      predicate: "is_a",
      sourceId: "AgentAsToolInvocation",
      targetId: "ProgrammaticToolCall",
      relationKind: "hierarchy",
      definitions: localized(
        "智能体工具调用是以智能体承载被调用能力为区分特征的一种程序化工具调用。",
        "Agent-as-tool invocation is a programmatic tool call distinguished by an agent carrying the invoked capability.",
        "エージェントツール呼び出しは、エージェントが呼び出し対象能力を担うことを種差とするプログラム的ツール呼び出しです。",
      ),
    });
    deprecateRelation(
      "AgentAsToolInvocation-is_a-DelegationProcess",
      ["AgentAsToolInvocation-is_a-ProgrammaticToolCall"],
      localized(
        "智能体工具调用由能力调用身份决定；管理者保留控制和答案责任时，不得仅因被调用者是智能体就推断发生委派。",
        "Agent-as-tool invocation is identified by capability-call semantics; when the manager retains control and answer responsibility, an agent callee alone does not imply delegation.",
        "エージェントツール呼び出しは能力呼び出しの意味で識別され、管理者が制御と回答責任を保持する場合、呼び出し先がエージェントであるだけでは委任を意味しません。",
      ),
    );
  };

  const completeInvocationAndRetrySemantics = () => {
    const invocationModuleId = "tool-invocation-execution";
    upsertReviewedRelation({ id: "Invocation-has_attempt-InvocationAttempt", moduleId: invocationModuleId, predicate: "has_attempt", sourceId: "Invocation", targetId: "InvocationAttempt", relationKind: "composition", definitions: localized("一次调用可以包含一个或多个具有独立重试身份的调用尝试。", "An invocation may contain one or more invocation attempts with distinct retry identities.", "一回の呼び出しは独立した再試行同一性を持つ一回以上の呼び出し試行を含めます。") });
    upsertReviewedRelation({ id: "InvocationAttempt-produces-InvocationResult", moduleId: invocationModuleId, predicate: "produces", sourceId: "InvocationAttempt", targetId: "InvocationResult", relationKind: "causal", definitions: localized("调用尝试产生记录返回值、诊断或影响证据的调用结果。", "An invocation attempt produces an invocation result recording return values, diagnostics, or effect evidence.", "呼び出し試行は戻り値、診断、影響証拠を記録する呼び出し結果を生成します。") });

    const requestReason = localized("ExecutionRequest 原为 specification 且继承 InvocationSpecification，无法表达一次请求对规范的实例化；v3 以信息记录 InvocationExecutionRequest 替换。", "ExecutionRequest was a specification inheriting InvocationSpecification and could not express one request instantiating a specification; v3 replaces it with the information record InvocationExecutionRequest.", "ExecutionRequest は InvocationSpecification を継承する仕様で、一回の要求が仕様をインスタンス化する意味を表せなかったため、v3 は情報記録 InvocationExecutionRequest で置換します。");
    deprecateRelation("ExecutionRequest-is_a-InvocationSpecification", ["InvocationExecutionRequest-instantiates-InvocationSpecification"], requestReason);
    deprecateConcept("ExecutionRequest", ["InvocationExecutionRequest"], requestReason);
    const invocationModule = moduleDocuments.get(invocationModuleId).document.module;
    const invocationClaims = claimsFor(invocationModule, invocationModule);
    upsertReviewedConcept({
      id: "InvocationExecutionRequest",
      moduleId: invocationModuleId,
      labels: localized("调用执行请求", "Invocation execution request", "呼び出し実行要求"),
      definitions: localized("调用执行请求是某个调用规范的一次可寻址实例，绑定调用参数、请求方、幂等键和适用运行语境。", "An invocation execution request is an addressable instance of an invocation specification that binds arguments, requester, idempotency key, and applicable runtime context.", "呼び出し実行要求は呼び出し仕様のアドレス可能な一実例で、引数、要求者、冪等キー、適用実行文脈を束ねます。"),
      semanticKind: "information",
      structure: {
        identity_keys: ["request_id"],
        fields: [{ id: "request_id", labels: localized("请求 ID", "request ID", "要求 ID"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("唯一标识一次调用执行请求。", "Uniquely identifies one invocation execution request.", "一回の呼び出し実行要求を一意に識別します。"), allowed_values: [], pattern: null, example_value: "invocation-request-314", source_claims: invocationClaims }],
        constraints: [],
        required_relation_constraints: [],
      },
    });
    upsertReviewedRelation({ id: "InvocationExecutionRequest-instantiates-InvocationSpecification", moduleId: invocationModuleId, predicate: "instantiates", sourceId: "InvocationExecutionRequest", targetId: "InvocationSpecification", relationKind: "information", definitions: localized("调用执行请求实例化一项调用规范并绑定本次运行的具体参数与请求身份。", "An invocation execution request instantiates an invocation specification with concrete arguments and request identity for one run.", "呼び出し実行要求は一回の実行の具体引数と要求同一性で呼び出し仕様をインスタンス化します。") });

    const runtimeModuleId = "runtime-execution-attempts";
    const runtimeModule = moduleDocuments.get(runtimeModuleId).document.module;
    const runAttempt = allConcepts().get("RunAttempt");
    if (!runAttempt) throw new Error("RunAttempt is missing");
    const attemptClaims = claimsFor(runAttempt, runtimeModule);
    const attemptFields = [
      { id: "attempt_number", labels: localized("尝试序号", "attempt number", "試行番号"), datatype: "integer", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("同一 Execution 中从 1 开始、单调递增的尝试序号。", "A one-based, monotonically increasing attempt number within one Execution.", "同一 Execution 内で 1 から単調増加する試行番号です。"), allowed_values: [], pattern: null, example_value: 2, source_claims: attemptClaims },
      { id: "retry_of", labels: localized("重试来源", "retry of", "再試行元"), datatype: "reference", required: false, cardinality: { min: 0, max: 1 }, definitions: localized("若本次尝试为重试，引用其直接前序执行尝试；首次尝试为空。", "If this attempt is a retry, references its immediate predecessor; empty for the initial attempt.", "この試行が再試行なら直前の実行試行を参照し、初回試行では空です。"), allowed_values: [], pattern: null, example_value: "run-attempt-001", source_claims: attemptClaims },
    ];
    updateReviewedConcept("RunAttempt", {
      structure: {
        ...runAttempt.structure,
        identity_keys: runAttempt.structure?.identity_keys ?? [],
        fields: [...(runAttempt.structure?.fields ?? []).filter((candidate) => !attemptFields.some(({ id }) => id === candidate.id)), ...attemptFields],
        constraints: runAttempt.structure?.constraints ?? [],
        required_relation_constraints: runAttempt.structure?.required_relation_constraints ?? [],
      },
    });
    const genericAttemptStatus = runAttempt.structure?.fields?.find(({ id }) => id === "status");
    const toolCallAttempt = allConcepts().get("ToolCallAttempt");
    if (!genericAttemptStatus || !toolCallAttempt) throw new Error("Attempt status inheritance inputs are missing");
    const localToolStatus = toolCallAttempt.structure?.fields?.find(({ id }) => id === "status");
    updateReviewedConcept("ToolCallAttempt", {
      structure: {
        ...toolCallAttempt.structure,
        fields: [
          ...(toolCallAttempt.structure?.fields ?? []).filter(({ id }) => id !== "status"),
          {
            ...genericAttemptStatus,
            labels: localToolStatus?.labels ?? genericAttemptStatus.labels,
            required: true,
            cardinality: { min: 1, max: 1 },
            definitions: localized("工具调用尝试使用通用执行尝试的受控生命周期状态，并要求每条尝试记录显式给出该状态。", "A tool-call attempt uses the generic run-attempt controlled lifecycle states and requires every attempt record to state one explicitly.", "ツール呼出し試行は共通実行試行の統制済みライフサイクル状態を使用し、各試行記録で状態を明示必須とします。"),
            allowed_values: (genericAttemptStatus.allowed_values ?? []).map((value) => ({ ...value })),
            example_value: "completed",
            source_claims: [...new Map([...(genericAttemptStatus.source_claims ?? []), ...(localToolStatus?.source_claims ?? [])].map((claim) => [claim.source_id, claim])).values()]
              .filter(({ source_id: sourceId }) => ["eng-proto-mcp-tasks-2025", "eng-fw-openai-tools"].includes(sourceId)),
          },
        ],
        constraints: toolCallAttempt.structure?.constraints ?? [],
        required_relation_constraints: toolCallAttempt.structure?.required_relation_constraints ?? [],
      },
    });
    upsertReviewedConcept({ id: "RetryActivity", moduleId: runtimeModuleId, labels: localized("重试活动", "Retry activity", "再試行活動"), definitions: localized("重试活动根据适用重试策略和前序尝试证据创建新的执行尝试，同时保留 lineage、序号和预算。", "A retry activity creates a new run attempt under an applicable retry policy and predecessor evidence while retaining lineage, attempt number, and budget.", "再試行活動は適用再試行ポリシーと先行試行証拠に基づき新しい実行試行を作り、lineage、試行番号、予算を保持します。"), semanticKind: "activity" });
    const retryReason = localized("RetryPolicy 是治理规范，不能创建运行实例；RetryActivity 在该策略治理下创建新的 RunAttempt。", "RetryPolicy is a governance specification and cannot create runtime instances; RetryActivity creates the new RunAttempt under that policy.", "RetryPolicy はガバナンス仕様で実行インスタンスを作れず、RetryActivity がそのポリシー下で新しい RunAttempt を作ります。");
    deprecateRelation("RetryPolicy-creates_new-RunAttempt", ["RetryActivity-governed_by-RetryPolicy", "RetryActivity-creates-RunAttempt"], retryReason);
    const retryFacts = [
      ["RunAttempt-retries-RunAttempt", "retries", "RunAttempt", "RunAttempt", "temporal", "后续执行尝试通过 retry_of 指向同一 Execution 中的直接前序尝试。", "A later run attempt references its immediate predecessor in the same Execution through retry_of.", "後続実行試行は retry_of により同一 Execution の直前試行を参照します。"],
      ["RetryActivity-governed_by-RetryPolicy", "governed_by", "RetryActivity", "RetryPolicy", "governance", "重试活动受规定错误类别、次数、退避与预算条件的重试策略治理。", "Retry activity is governed by a retry policy specifying error classes, count, backoff, and budget conditions.", "再試行活動はエラー種別、回数、バックオフ、予算条件を規定する再試行ポリシーに統治されます。"],
      ["RetryActivity-creates-RunAttempt", "creates", "RetryActivity", "RunAttempt", "causal", "满足策略条件时，重试活动创建具有新身份和递增序号的执行尝试。", "When policy conditions hold, retry activity creates a run attempt with a new identity and incremented number.", "ポリシー条件を満たすと、再試行活動は新しい同一性と増加番号を持つ実行試行を作ります。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of retryFacts) upsertReviewedRelation({ id, moduleId: runtimeModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
  };

  const completeMemoryOperationAndStorageSemantics = () => {
    const lifecycleModuleId = "memory-lifecycle";
    const lifecycleModule = moduleDocuments.get(lifecycleModuleId).document.module;
    const lifecycleClaims = claimsFor(lifecycleModule, lifecycleModule);
    upsertReviewedConcept({
      id: "MemoryOperationResult",
      moduleId: lifecycleModuleId,
      labels: localized("记忆操作结果", "Memory operation result", "記憶操作結果"),
      definitions: localized("记忆操作结果是一次记忆操作的可审计信息，记录操作身份、输入版本、输出版本或墓碑、策略决定、错误和理由。", "A memory-operation result is auditable information for one memory operation, recording operation identity, input version, output version or tombstone, policy decision, errors, and rationale.", "記憶操作結果は一回の記憶操作を監査する情報で、操作同一性、入力版、出力版または墓標、ポリシー判断、エラー、理由を記録します。"),
      semanticKind: "information",
      structure: {
        identity_keys: ["operation_result_id"],
        fields: [{ id: "operation_result_id", labels: localized("操作结果 ID", "operation result ID", "操作結果 ID"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("唯一标识一次记忆操作结果。", "Uniquely identifies one memory-operation result.", "一回の記憶操作結果を一意に識別します。"), allowed_values: [], pattern: null, example_value: "memory-operation-result-88", source_claims: lifecycleClaims }],
        constraints: [],
        required_relation_constraints: [],
      },
    });
    const auditReason = localized("该旧边的谓词声明记录 MemoryOperation，端点却指向 MemoryRecord；正确事实已由 MemoryAuditEvent-records-MemoryOperation 表达。", "The old edge claimed to record MemoryOperation but targeted MemoryRecord; MemoryAuditEvent-records-MemoryOperation already expresses the correct fact.", "旧辺は MemoryOperation を記録すると称しながら MemoryRecord を指しており、正しい事実は MemoryAuditEvent-records-MemoryOperation で表されています。");
    deprecateRelation("memory_audit_event_records_memory_operation", ["MemoryAuditEvent-records-MemoryOperation"], auditReason);
    const lifecycleFacts = [
      ["MemoryOperation-performed_by-Actor", "performed_by", "MemoryOperation", "Actor", "information", "每次记忆操作都记录承担该操作责任的运行参与者。", "Each memory operation records the runtime participant accountable for performing it.", "各記憶操作は実行責任を持つ実行参加者を記録します。"],
      ["MemoryOperation-governed_by-PolicySpecification", "governed_by", "MemoryOperation", "PolicySpecification", "governance", "记忆操作受适用的访问、保留、信任和副作用策略规范治理。", "A memory operation is governed by applicable access, retention, trust, and side-effect policy specifications.", "記憶操作は適用されるアクセス、保持、信頼、副作用ポリシー仕様に統治されます。"],
      ["MemoryOperation-produces-MemoryOperationResult", "produces", "MemoryOperation", "MemoryOperationResult", "causal", "每次记忆操作产生统一记录输入、输出、理由和错误的操作结果。", "Each memory operation produces a result that uniformly records input, output, rationale, and errors.", "各記憶操作は入力、出力、理由、エラーを統一記録する操作結果を生成します。"],
      ["MemoryOperationResult-references-MemoryRecord", "references", "MemoryOperationResult", "MemoryRecord", "information", "记忆操作结果引用其读取、创建、替代或验证的不可变记忆版本。", "A memory-operation result references immutable memory versions it read, created, superseded, or validated.", "記憶操作結果は読取、生成、置換、検証した不変記憶版を参照します。"],
      ["MemoryOperationResult-records-ErrorEvent", "records", "MemoryOperationResult", "ErrorEvent", "information", "失败的记忆操作结果引用适用错误事件，而成功结果无需虚构错误。", "A failed memory-operation result references applicable error events; successful results do not invent errors.", "失敗した記憶操作結果は適用エラーイベントを参照し、成功結果はエラーを捏造しません。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of lifecycleFacts) upsertReviewedRelation({ id, moduleId: lifecycleModuleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });

    const storeModuleId = "memory-stores-scopes";
    const storeModule = moduleDocuments.get(storeModuleId).document.module;
    const storeClaims = claimsFor(storeModule, storeModule);
    upsertReviewedConcept({ id: "MemoryTombstone", moduleId: storeModuleId, labels: localized("记忆墓碑记录", "Memory tombstone record", "記憶墓標記録"), definitions: localized("记忆墓碑记录是替代被删除、过期或驱逐版本的不可变记忆记录，保留原记录身份、终止原因、操作和时间而不保留已撤销内容。", "A memory tombstone record is an immutable memory record replacing a deleted, expired, or evicted version while retaining original record identity, termination reason, operation, and time without retaining withdrawn content.", "記憶墓標記録は削除、期限切れ、退去された版を置き換える不変記憶記録で、撤回内容を保持せず元記録同一性、終了理由、操作、時刻を保持します。"), semanticKind: "information", primaryParentRelationId: "MemoryTombstone-is_a-MemoryRecord" });
    upsertReviewedRelation({ id: "MemoryTombstone-is_a-MemoryRecord", moduleId: storeModuleId, predicate: "is_a", sourceId: "MemoryTombstone", targetId: "MemoryRecord", relationKind: "hierarchy", definitions: localized("记忆墓碑记录是以终止既有版本且保留审计 lineage 为区分特征的记忆记录。", "A memory tombstone is a memory record distinguished by terminating an existing version while retaining audit lineage.", "記憶墓標は既存版を終了し監査 lineage を保持することを種差とする記憶記録です。") });
    const tombstoneFacts = [
      ["MemoryDelete-produces-MemoryTombstone", "MemoryDelete", "删除操作产生替代被删除版本的墓碑记录。", "A delete operation produces a tombstone replacing the deleted version.", "削除操作は削除版を置き換える墓標記録を生成します。"],
      ["MemoryExpiration-produces-MemoryTombstone", "MemoryExpiration", "过期操作产生记录保留期终止原因的墓碑。", "An expiration operation produces a tombstone recording retention expiry.", "期限切れ操作は保持期限終了を記録する墓標を生成します。"],
      ["MemoryEviction-produces-MemoryTombstone", "MemoryEviction", "驱逐操作产生记录容量或策略驱逐理由的墓碑。", "An eviction operation produces a tombstone recording capacity or policy eviction rationale.", "退去操作は容量またはポリシー退去理由を記録する墓標を生成します。"],
    ];
    for (const [id, sourceId, zh, en, ja] of tombstoneFacts) upsertReviewedRelation({ id, moduleId: lifecycleModuleId, predicate: "produces", sourceId, targetId: "MemoryTombstone", relationKind: "causal", definitions: localized(zh, en, ja) });
    upsertReviewedRelation({ id: "MemoryEntity-stored_in-MemoryStore", moduleId: storeModuleId, predicate: "stored_in", sourceId: "MemoryEntity", targetId: "MemoryStore", relationKind: "composition", definitions: localized("记忆实体通过显式存储关系定位到承载其当前版本或物化文件的记忆存储。", "A memory entity is located in the memory store carrying its current version or materialized file through an explicit storage relation.", "記憶エンティティは明示的な保存関係により現行版または具現化ファイルを保持する記憶ストアへ位置付けられます。") });
    upsertReviewedRelation({ id: "MemoryEntity-scoped_by-MemoryNamespace", moduleId: storeModuleId, predicate: "scoped_by", sourceId: "MemoryEntity", targetId: "MemoryNamespace", relationKind: "governance", definitions: localized("记忆实体由命名空间确定查找与隔离边界；MemoryScope 仍独立表达适用策略范围。", "A memory namespace determines lookup and isolation boundaries for a memory entity; MemoryScope separately expresses policy applicability.", "記憶名前空間は記憶エンティティの検索・分離境界を決め、MemoryScope は別にポリシー適用範囲を表します。") });
    const memoryStore = allConcepts().get("MemoryStore");
    if (!memoryStore) throw new Error("MemoryStore is missing");
    const storeIdField = { id: "memory_store_id", labels: localized("存储 ID", "memory store ID", "記憶ストア ID"), datatype: "string", required: true, cardinality: { min: 1, max: 1 }, definitions: localized("唯一标识一个记忆存储端点。", "Uniquely identifies one memory-store endpoint.", "一つの記憶ストア端点を一意に識別します。"), allowed_values: [], pattern: null, example_value: "memory-store-project", source_claims: storeClaims };
    const deploymentScopeField = {
      id: "deployment_scope",
      labels: localized("部署范围", "deployment scope", "配置範囲"),
      datatype: "string",
      required: true,
      cardinality: { min: 1, max: 1 },
      definitions: localized("说明存储端点部署在本地、远程或混合位置；该 facet 不改变 MemoryStore 身份。", "States whether the store endpoint is deployed locally, remotely, or in a hybrid arrangement; the facet does not change MemoryStore identity.", "ストア端点がローカル、リモート、混合のどこに配置されるかを示し、この facet は MemoryStore 同一性を変えません。"),
      allowed_values: [
        ["memory-store-local", "local", "本地", "local", "ローカル"],
        ["memory-store-remote", "remote", "远程", "remote", "リモート"],
        ["memory-store-hybrid", "hybrid", "混合", "hybrid", "混合"],
      ].map(([id, value, zh, en, ja]) => ({ id, value, labels: localized(zh, en, ja), definitions: localized(`${zh}部署范围。`, `${en} deployment scope.`, `${ja}配置範囲です。`), status: "accepted", source_claims: storeClaims })),
      pattern: null,
      example_value: "remote",
      source_claims: storeClaims,
    };
    updateReviewedConcept("MemoryStore", { structure: { ...memoryStore.structure, identity_keys: ["memory_store_id"], fields: [...(memoryStore.structure?.fields ?? []).filter((candidate) => !["memory_store_id", "deployment_scope"].includes(candidate.id)), storeIdField, deploymentScopeField], constraints: memoryStore.structure?.constraints ?? [], required_relation_constraints: memoryStore.structure?.required_relation_constraints ?? [] } });
  };

  return Object.freeze({ completeEvaluationGoldenFlow, completeContextAssemblySemantics, completeRetrievalExecutionSemantics, repairEvaluationCompositionAndAgency, completeGovernedOptimizationApplication, completeMemoryPipelineSemantics, completeInstructionAndDisclosureProcessing, completeDelegationSelectionAndHandoff, completeInvocationAndRetrySemantics, completeMemoryOperationAndStorageSemantics });
};
