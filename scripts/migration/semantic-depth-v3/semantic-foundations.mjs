export const createSemanticFoundationPhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction, moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts, locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor } = context;

  const fixCrossKindTaxonomy = () => {
    replaceRelation({ oldId: "Conversation-is_a-ConversationElement", newId: "Conversation-contains-ConversationElement", predicate: "contains" });
    replaceRelation({ oldId: "MessageHistory-is_a-ConversationElement", newId: "MessageHistory-contains-ConversationElement", predicate: "contains" });
    replaceRelation({ oldId: "OutputStream-is_a-OutputInformation", newId: "OutputStream-contains-OutputInformation", predicate: "contains" });
    replaceRelation({ oldId: "OutputWindow-is_a-OutputInformation", newId: "OutputWindow-selects_from-OutputInformation", predicate: "selects_from", relationKind: "information" });
    replaceRelation({ oldId: "RevisionPlan-is_a-RevisionArtifact", newId: "RevisionPlan-guides-RevisionArtifact", predicate: "guides", relationKind: "governance" });
    replaceRelation({ oldId: "MappingRule-is_a-MappingArtifact", newId: "MappingRule-specifies-MappingArtifact", predicate: "specifies", relationKind: "mapping" });

    addReviewedAnchor({
      moduleId: "memory-ingestion", id: "IngestibleInformation",
      labels: localized("可接入信息", "Ingestible information", "取り込み可能な情報"),
      definitions: localized("可接入信息是能够由记忆接入活动解析、验证并保留来源的信息对象。", "Ingestible information is an information object that a memory-ingestion activity can parse, validate, and retain with provenance.", "取り込み可能な情報は、記憶取り込み活動が解析・検証し、出典とともに保持できる情報オブジェクトです。"),
      semanticKind: "information",
    });
    addReviewedAnchor({
      moduleId: "memory-ingestion", id: "IngestibleCollection",
      labels: localized("可接入集合", "Ingestible collection", "取り込み可能な集合"),
      definitions: localized("可接入集合是作为一个有序或无序整体进入记忆接入流程的信息集合。", "An ingestible collection is an information collection entering memory ingestion as one ordered or unordered whole.", "取り込み可能な集合は、順序付きまたは順序なしの全体として記憶取り込みへ入る情報集合です。"),
      semanticKind: "collection",
    });
    for (const id of ["DatabaseRow", "Document", "GraphEdge", "GraphNode", "SourceAttachment"]) {
      replaceRelation({ oldId: `${id}-is_a-IngestibleResource`, newId: `${id}-is_a-IngestibleInformation`, predicate: "is_a", relationKind: "hierarchy", targetId: "IngestibleInformation" });
    }
    replaceRelation({ oldId: "TextCorpus-is_a-IngestibleResource", newId: "TextCorpus-is_a-IngestibleCollection", predicate: "is_a", relationKind: "hierarchy", targetId: "IngestibleCollection" });

    addReviewedAnchor({
      moduleId: "memory-retrieval-ranking", id: "RetrievalCollection",
      labels: localized("检索集合", "Retrieval collection", "検索集合"),
      definitions: localized("检索集合是由一次检索或排序活动组织、并保留成员次序与评分语境的集合。", "A retrieval collection is a collection organized by a retrieval or ranking activity while retaining member order and scoring context.", "検索集合は、検索または順位付け活動により組織され、メンバー順序と評価文脈を保持する集合です。"),
      semanticKind: "collection",
    });
    replaceRelation({ oldId: "CandidateSet-is_a-RetrievalArtifact", newId: "CandidateSet-is_a-RetrievalCollection", predicate: "is_a", relationKind: "hierarchy", targetId: "RetrievalCollection" });
  };

  const RECLASSIFIED_CONCEPTS = [
    { id: "Conversation", oldRelationId: "Conversation-is_a-ConversationElement", newRelationId: "Conversation-contains-ConversationElement", oldTargetId: "ConversationElement", newTargetId: "ConversationElement", predicate: "contains", contrastId: "ConversationTurn", distinction: "Conversation is a collection identified by one conversation or thread and contains ordered conversation elements; it is not itself a conversation element." },
    { id: "MessageHistory", oldRelationId: "MessageHistory-is_a-ConversationElement", newRelationId: "MessageHistory-contains-ConversationElement", oldTargetId: "ConversationElement", newTargetId: "ConversationElement", predicate: "contains", contrastId: "Conversation", distinction: "MessageHistory is a retained, ordered collection of conversation elements for continuity, replay, retrieval, or context assembly; it is not itself a conversation element." },
    { id: "OutputStream", oldRelationId: "OutputStream-is_a-OutputInformation", newRelationId: "OutputStream-contains-OutputInformation", oldTargetId: "OutputInformation", newTargetId: "OutputInformation", predicate: "contains", contrastId: "OutputCitation", distinction: "OutputStream is an ordered collection that contains output information produced over time; it is not itself an output-information item." },
    { id: "OutputWindow", oldRelationId: "OutputWindow-is_a-OutputInformation", newRelationId: "OutputWindow-selects_from-OutputInformation", oldTargetId: "OutputInformation", newTargetId: "OutputInformation", predicate: "selects_from", contrastId: "OutputCitation", distinction: "OutputWindow is a specification selecting the output-information range visible or retained for a recipient; it is not itself output information." },
    { id: "RevisionPlan", oldRelationId: "RevisionPlan-is_a-RevisionArtifact", newRelationId: "RevisionPlan-guides-RevisionArtifact", oldTargetId: "RevisionArtifact", newTargetId: "RevisionArtifact", predicate: "guides", contrastId: "CritiqueArtifact", distinction: "RevisionPlan is a specification that guides revision artifacts and attempts by naming the change target, trigger, and acceptance criterion; it is not itself a revision artifact." },
    { id: "MappingRule", oldRelationId: "MappingRule-is_a-MappingArtifact", newRelationId: "MappingRule-specifies-MappingArtifact", oldTargetId: "MappingArtifact", newTargetId: "MappingArtifact", predicate: "specifies", contrastId: "ConversionWarning", distinction: "MappingRule is a normative specification for mapping artifacts, including direction, source and target versions, transformation, and preconditions; it is not itself a mapping artifact." },
    { id: "DatabaseRow", oldRelationId: "DatabaseRow-is_a-IngestibleResource", newRelationId: "DatabaseRow-is_a-IngestibleInformation", oldTargetId: "IngestibleResource", newTargetId: "IngestibleInformation", predicate: "is_a", contrastId: "Database", distinction: "DatabaseRow is ingestible information representing one addressable, policy-scoped row with provenance; the database resource containing it has a different identity." },
    { id: "Document", oldRelationId: "Document-is_a-IngestibleResource", newRelationId: "Document-is_a-IngestibleInformation", oldTargetId: "IngestibleResource", newTargetId: "IngestibleInformation", predicate: "is_a", contrastId: "Database", distinction: "Document is ingestible information that can be parsed, chunked, indexed, and cited after loading; the storage resource from which it came remains distinct." },
    { id: "GraphEdge", oldRelationId: "GraphEdge-is_a-IngestibleResource", newRelationId: "GraphEdge-is_a-IngestibleInformation", oldTargetId: "IngestibleResource", newTargetId: "IngestibleInformation", predicate: "is_a", contrastId: "Database", distinction: "GraphEdge is ingestible information carrying an addressable relation, direction, properties, and provenance; the graph store remains a separate resource." },
    { id: "GraphNode", oldRelationId: "GraphNode-is_a-IngestibleResource", newRelationId: "GraphNode-is_a-IngestibleInformation", oldTargetId: "IngestibleResource", newTargetId: "IngestibleInformation", predicate: "is_a", contrastId: "Database", distinction: "GraphNode is ingestible information carrying an addressable node identity, properties, labels, and provenance; the graph store remains a separate resource." },
    { id: "SourceAttachment", oldRelationId: "SourceAttachment-is_a-IngestibleResource", newRelationId: "SourceAttachment-is_a-IngestibleInformation", oldTargetId: "IngestibleResource", newTargetId: "IngestibleInformation", predicate: "is_a", contrastId: "Database", distinction: "SourceAttachment is ingestible information describing a supplied source through location, digest, trust, and provenance metadata; the referenced source resource remains distinct." },
    { id: "TextCorpus", oldRelationId: "TextCorpus-is_a-IngestibleResource", newRelationId: "TextCorpus-is_a-IngestibleCollection", oldTargetId: "IngestibleResource", newTargetId: "IngestibleCollection", predicate: "is_a", contrastId: "Database", distinction: "TextCorpus is an ingestible collection of text documents or text-bearing records prepared for ingestion and retrieval; it is not the storage resource that supplies them." },
    { id: "CandidateSet", oldRelationId: "CandidateSet-is_a-RetrievalArtifact", newRelationId: "CandidateSet-is_a-RetrievalCollection", oldTargetId: "RetrievalArtifact", newTargetId: "RetrievalCollection", predicate: "is_a", contrastId: "CandidateChunk", distinction: "CandidateSet is a bounded retrieval collection produced for one query and distinct from each candidate member and from artifacts produced after selection." },
  ];

  const normalizeReclassifiedConcepts = () => {
    const replaceTokens = (value, item, replaceTarget = false) => {
      if (typeof value === "string") {
        const relationNormalized = value
          .replaceAll(item.oldRelationId, item.newRelationId)
          .replaceAll(`${item.id} is_a ${item.oldTargetId}`, `${item.id} ${item.predicate} ${item.newTargetId}`);
        return replaceTarget ? relationNormalized.replaceAll(item.oldTargetId, item.newTargetId) : relationNormalized;
      }
      if (Array.isArray(value)) return value.map((entry) => replaceTokens(entry, item, replaceTarget));
      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceTokens(entry, item, replaceTarget)]));
      }
      return value;
    };

    for (const item of RECLASSIFIED_CONCEPTS) {
      for (const { document } of moduleDocuments.values()) {
        document.classes = document.classes.map((concept) => replaceTokens(concept, item, concept.id === item.id));
      }
      const concepts = allConcepts();
      const concept = concepts.get(item.id);
      const contrast = concepts.get(item.contrastId);
      if (!concept || !contrast) throw new Error(`Missing reclassification endpoint ${item.id} or ${item.contrastId}`);
      const relation = allRelations().get(item.newRelationId);
      if (!relation) throw new Error(`Missing replacement relation ${item.newRelationId}`);

      const relationFact = `${relation.source_id} ${relation.predicate} ${relation.target_id}`;
      concept.source_claims = concept.source_claims.map((claim) => ({
        ...claim,
        supports: `Provides evidence for the reviewed distinction of ${item.id}: ${item.distinction} The ontology-specific boundary and canonical fact ${item.newRelationId} (${relationFact}) are accepted Moonweave design inferences over this registered evidence.`,
      }));
      concept.excludes = [localized(
        `${contrast.labels.zh}可在同一流程中与${concept.labels.zh}相邻出现，但其身份与种差不同；只有满足“${concept.short_definitions.zh}”的记录才属于${concept.labels.zh}。`,
        `${contrast.labels.en} may occur beside ${concept.labels.en} in the same flow, but it has different identity conditions and differentia; only a record satisfying “${concept.short_definitions.en}” belongs to ${concept.labels.en}.`,
        `${contrast.labels.ja}は同じフローで${concept.labels.ja}の近くに現れ得ますが、同一性条件と種差が異なります。「${concept.short_definitions.ja}」を満たす記録だけが${concept.labels.ja}に属します。`,
      )];
      for (const example of concept.examples ?? []) {
        if (example.kind !== "boundary") continue;
        example.descriptions = localized(
          `${contrast.labels.zh}是${concept.labels.zh}的边界对照。二者可以共现，但不得因共现或名称相近而合并；${concept.labels.zh}必须满足自身已审查种差。`,
          `${contrast.labels.en} is the boundary contrast for ${concept.labels.en}. They may co-occur, but co-occurrence or lexical similarity does not merge their identities; ${concept.labels.en} must satisfy its reviewed differentia.`,
          `${contrast.labels.ja}は${concept.labels.ja}の境界対照です。両者は共起できますが、共起や名称類似性で同一化せず、${concept.labels.ja}は審査済み種差を満たす必要があります。`,
        );
        example.why_valid_or_invalid = localized(
          `边界例保留 ${item.newRelationId} 的真实方向，并用种差而不是名称前缀判断身份。`,
          `The boundary case preserves the real direction of ${item.newRelationId} and tests identity by differentia rather than a name prefix.`,
          `境界例は ${item.newRelationId} の実際の方向を保ち、名称接頭辞ではなく種差で同一性を判定します。`,
        );
      }
    }
  };

  const addExecutionBackbone = () => {
    const moduleId = "runtime-execution-attempts";
    const module = moduleDocuments.get(moduleId).document.module;
    const sourceClaims = claimsFor(module, module);
    const review = reviewFor(module.plane_id, localized(
      "执行、尝试、结果和预算需要分开身份，并由显式关系闭环。",
      "Execution, attempts, outcomes, and budgets need separate identities joined by explicit relations.",
      "実行、試行、結果、予算は別の同一性を持ち、明示的な関係で閉じる必要があります。",
    ));
    addConceptTo(moduleId, makeConcept({
      id: "Execution", moduleId,
      labels: localized("执行", "Execution", "実行"),
      definitions: localized("执行是主体在运行环境中依照计划或调用规范完成工作并产生可观察结果的活动。", "Execution is the activity in which a participant performs work in a runtime environment under a plan or invocation specification and produces an observable outcome.", "実行は、参加者が実行環境で計画または呼び出し仕様に従って作業し、観測可能な結果を生む活動です。"),
      semanticKind: "activity", sourceClaims, review,
    }));
    const runAttempt = allConcepts().get("RunAttempt");
    runAttempt.primary_parent_relation_id = "RunAttempt-is_a-Execution";
    addRelationTo(moduleId, makeRelation({
      id: "RunAttempt-is_a-Execution", predicate: "is_a", sourceId: "RunAttempt", targetId: "Execution", relationKind: "hierarchy",
      definitions: localized("运行尝试是一种具有开始、结束与重试身份的执行。", "A run attempt is an execution with start, end, and retry identity.", "実行試行は開始、終了、再試行の同一性を持つ実行の一種です。"), sourceClaims, review,
    }));
    if (!allRelations().has("RunAttempt-produces-RunOutcome")) {
      addRelationTo(moduleId, makeRelation({
        id: "RunAttempt-produces-RunOutcome", predicate: "produces", sourceId: "RunAttempt", targetId: "RunOutcome", relationKind: "causal",
        definitions: localized("每次运行尝试产生一个记录完成、失败或中止语义的运行结果。", "Each run attempt produces an outcome recording completion, failure, or cancellation semantics.", "各実行試行は完了、失敗、中止の意味を記録する結果を生成します。"), sourceClaims, review,
      }));
    }
    if (!allRelations().has("RuntimeBudget-constrains-RunAttempt")) {
      addRelationTo(moduleId, makeRelation({
        id: "RuntimeBudget-constrains-RunAttempt", predicate: "constrains", sourceId: "RuntimeBudget", targetId: "RunAttempt", relationKind: "governance",
        definitions: localized("运行预算限制运行尝试可消耗的时间、成本或资源。", "A runtime budget constrains the time, cost, or resources a run attempt may consume.", "実行予算は実行試行が消費できる時間、費用、資源を制限します。"), sourceClaims, review,
      }));
    }
  };

  const addDelegationSemanticBackbone = () => {
    const moduleId = "orchestration-delegation-handoff";
    upsertReviewedConcept({
      id: "CollaborationProcess",
      moduleId,
      labels: localized("协作过程", "Collaboration process", "協働プロセス"),
      definitions: localized(
        "协作过程是两个或更多参与者围绕共同工作目标协调责任、控制权或产出的活动。",
        "A collaboration process is an activity in which two or more participants coordinate responsibility, control, or deliverables around a shared work objective.",
        "協働プロセスは、二者以上の参加者が共通の作業目標をめぐって責任、制御、成果物を調整する活動です。",
      ),
      semanticKind: "activity",
    });
    upsertReviewedConcept({
      id: "HandoffProcess",
      moduleId,
      labels: localized("移交过程", "Handoff process", "引き継ぎプロセス"),
      definitions: localized(
        "移交过程是把进行中工作的控制权、责任和必要上下文从一个责任方转给另一责任方的协作过程；一次 Handoff 事件只是该过程中的可观测时点。",
        "A handoff process is a collaboration process that transfers control, responsibility, and required context for ongoing work between accountable parties; a Handoff event is only an observable point in that process.",
        "引き継ぎプロセスは、進行中の作業の制御、責任、必要なコンテキストを責任主体間で移す協働プロセスであり、Handoff イベントはその過程の観測時点にすぎません。",
      ),
      semanticKind: "activity",
      primaryParentRelationId: "HandoffProcess-is_a-CollaborationProcess",
    });
    upsertReviewedConcept({
      id: "DelegationPhase",
      moduleId,
      labels: localized("委派阶段", "Delegation phase", "委任段階"),
      definitions: localized(
        "委派阶段是一次委派过程在责任、权限与完成条件上可判定的生命周期状态。",
        "A delegation phase is a lifecycle state of a delegation process that is distinguishable by responsibility, authority, and completion conditions.",
        "委任段階は、責任、権限、完了条件によって判別できる委任プロセスのライフサイクル状態です。",
      ),
      semanticKind: "state",
    });
    const phases = [
      ["InitiationPhase", "发起阶段", "Initiation phase", "開始段階", "委派方提出工作范围、权限与验收条件，受派方尚未接受。", "The delegator proposes scope, authority, and acceptance conditions before the delegate accepts.", "委任者が範囲、権限、受け入れ条件を提示し、受任者はまだ受諾していない段階です。"],
      ["AcceptancePhase", "接受阶段", "Acceptance phase", "受諾段階", "受派方明确接受委派合同并承担约定责任。", "The delegate explicitly accepts the delegation contract and assumes the agreed responsibility.", "受任者が委任契約を明示的に受諾し、合意した責任を引き受ける段階です。"],
      ["RevocationPhase", "撤销阶段", "Revocation phase", "取消段階", "委派在完成前被授权方撤回、失效或终止，且后续控制权必须重新归属。", "The delegation is withdrawn, invalidated, or terminated before completion and subsequent control must be reassigned.", "委任が完了前に撤回、失効、終了され、その後の制御を再割り当てる段階です。"],
      ["CompletionPhase", "完成阶段", "Completion phase", "完了段階", "受派方返回约定结果与证据，委派责任按照合同完成或关闭。", "The delegate returns the agreed result and evidence, closing the delegated responsibility under the contract.", "受任者が合意した結果と証拠を返し、契約に基づく委任責任を完了または終了する段階です。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of phases) {
      upsertReviewedConcept({
        id,
        moduleId,
        labels: localized(zh, en, ja),
        definitions: localized(definitionZh, definitionEn, definitionJa),
        semanticKind: "state",
        primaryParentRelationId: `${id}-is_a-DelegationPhase`,
      });
      upsertReviewedRelation({
        id: `${id}-is_a-DelegationPhase`,
        moduleId,
        predicate: "is_a",
        sourceId: id,
        targetId: "DelegationPhase",
        relationKind: "hierarchy",
        definitions: localized(`${zh}是委派阶段的一种。`, `${en} is a kind of delegation phase.`, `${ja}は委任段階の一種です。`),
      });
    }
    const delegation = allConcepts().get("DelegationProcess");
    if (!delegation) throw new Error("DelegationProcess is missing");
    updateReviewedConcept("DelegationProcess", {
      primary_parent_relation_id: "DelegationProcess-is_a-CollaborationProcess",
      root_status: null,
    });
    upsertReviewedRelation({
      id: "DelegationProcess-is_a-CollaborationProcess",
      moduleId,
      predicate: "is_a",
      sourceId: "DelegationProcess",
      targetId: "CollaborationProcess",
      relationKind: "hierarchy",
      definitions: localized("委派过程是通过约定范围、权限和验收条件分配责任的一种协作过程。", "A delegation process is a collaboration process that allocates responsibility through agreed scope, authority, and acceptance conditions.", "委任プロセスは、合意した範囲、権限、受け入れ条件によって責任を割り当てる協働プロセスの一種です。"),
    });
    upsertReviewedRelation({
      id: "HandoffProcess-is_a-CollaborationProcess",
      moduleId,
      predicate: "is_a",
      sourceId: "HandoffProcess",
      targetId: "CollaborationProcess",
      relationKind: "hierarchy",
      definitions: localized("移交过程是以转移进行中工作控制权为区分特征的协作过程。", "A handoff process is a collaboration process distinguished by transferring control of ongoing work.", "引き継ぎプロセスは、進行中の作業制御を移すことを種差とする協働プロセスです。"),
    });
    upsertReviewedRelation({
      id: "DelegationPhase-phase_of-DelegationProcess",
      moduleId,
      predicate: "phase_of",
      sourceId: "DelegationPhase",
      targetId: "DelegationProcess",
      relationKind: "temporal",
      definitions: localized("每个委派阶段都描述一项委派过程在某一生命周期区间的状态。", "Each delegation phase describes the state of a delegation process during a distinguishable lifecycle interval.", "各委任段階は、委任プロセスの判別可能なライフサイクル区間における状態を表します。"),
    });
  };

  const completeContextDiscoveryFlow = () => {
    const moduleId = "info-indexing";
    upsertReviewedConcept({
      id: "DiscoveryActivity",
      moduleId,
      labels: localized("发现活动", "Discovery activity", "発見活動"),
      definitions: localized(
        "发现活动是针对查询或需求检查可发现入口，并产生尚待选择的候选结果的活动；它不执行最终选择，也不拥有持久索引。",
        "A discovery activity examines discoverable surfaces for a query or requirement and produces candidates that still require selection; it neither makes the final selection nor owns a persistent index.",
        "発見活動はクエリまたは要件に対して発見入口を調べ、選択前の候補結果を生成する活動であり、最終選択も永続索引の所有も行いません。",
      ),
      semanticKind: "activity",
    });
    upsertReviewedConcept({
      id: "LightweightRetrieval",
      moduleId,
      labels: localized("轻量检索", "Lightweight retrieval", "軽量検索"),
      definitions: localized(
        "轻量检索是在当前上下文会话中读取索引视图或指针、返回候选而不重建持久索引的一种发现活动。",
        "Lightweight retrieval is a discovery activity that reads an index view or pointer in the current context session and returns candidates without rebuilding a persistent index.",
        "軽量検索は、現在のコンテキストセッションで索引ビューまたはポインターを読み、永続索引を再構築せず候補を返す発見活動です。",
      ),
      semanticKind: "activity",
      primaryParentRelationId: "LightweightRetrieval-is_a-DiscoveryActivity",
    });
    upsertReviewedRelation({
      id: "LightweightRetrieval-is_a-DiscoveryActivity",
      moduleId,
      predicate: "is_a",
      sourceId: "LightweightRetrieval",
      targetId: "DiscoveryActivity",
      relationKind: "hierarchy",
      definitions: localized("轻量检索是以会话内只读候选发现为区分特征的发现活动。", "Lightweight retrieval is a discovery activity distinguished by read-only candidate discovery within a session.", "軽量検索は、セッション内の読み取り専用候補発見を種差とする発見活動です。"),
    });
    upsertReviewedRelation({
      id: "DiscoveryActivity-produces-DiscoveryResult",
      moduleId,
      predicate: "produces",
      sourceId: "DiscoveryActivity",
      targetId: "DiscoveryResult",
      relationKind: "causal",
      definitions: localized("发现活动产生保留查询语境与候选依据的发现结果。", "A discovery activity produces a discovery result that retains query context and candidate evidence.", "発見活動は、クエリ文脈と候補根拠を保持する発見結果を生成します。"),
    });
    upsertReviewedRelation({
      id: "DiscoveryActivity-uses-LightIndex",
      moduleId,
      predicate: "uses",
      sourceId: "DiscoveryActivity",
      targetId: "LightIndex",
      relationKind: "information",
      definitions: localized("发现活动可读取轻量索引所指向的持久索引视图，但不取得该索引的所有权。", "A discovery activity may read the persistent-index view referenced by a light index without taking ownership of that index.", "発見活動は軽量索引が参照する永続索引ビューを読み取れますが、その索引を所有しません。"),
    });
    upsertReviewedRelation({
      id: "DiscoveryActivity-exposed_by-DiscoverySurface",
      moduleId,
      predicate: "exposed_by",
      sourceId: "DiscoveryActivity",
      targetId: "DiscoverySurface",
      relationKind: "information",
      definitions: localized("发现入口说明可从何处发起或访问发现活动。", "A discovery surface identifies where a discovery activity can be initiated or accessed.", "発見入口は、発見活動を開始または利用できる場所を示します。"),
    });
    upsertReviewedRelation({
      id: "ContextAssembly-consumes-DiscoveryResult",
      moduleId: "memory-context",
      predicate: "consumes",
      sourceId: "ContextAssembly",
      targetId: "DiscoveryResult",
      relationKind: "information",
      definitions: localized("上下文组装消费发现结果中的候选与证据，再执行选择、排序和预算裁剪。", "Context assembly consumes candidates and evidence from discovery results before selection, ordering, and budget trimming.", "コンテキスト組み立ては発見結果の候補と証拠を消費し、その後に選択、順序付け、予算調整を行います。"),
    });
    upsertReviewedRelation({
      id: "ContextSelectionDecision-selects_from-VisibleContextWindow",
      moduleId: "info-output-disclosure",
      predicate: "selects_from",
      sourceId: "ContextSelectionDecision",
      targetId: "VisibleContextWindow",
      relationKind: "information",
      definitions: localized("上下文选择决定从可见上下文窗口允许的范围内选择披露候选。", "A context-selection decision selects disclosure candidates from the range allowed by a visible context window.", "コンテキスト選択決定は、可視コンテキスト窓が許す範囲から開示候補を選びます。"),
    });
  };

  const completePromptInstructionBackbone = () => {
    const moduleId = "info-prompts-instructions";
    const facts = [
      ["PromptTemplate-contains-Instruction", "contains", "PromptTemplate", "Instruction", "composition", "提示模板包含可按权威性、优先级和作用域解析的指令。", "A prompt template contains instructions that can be resolved by authority, priority, and scope.", "プロンプトテンプレートは、権威、優先度、スコープで解決できる指示を含みます。"],
      ["Instruction-has_metadata-InstructionMetadata", "has_metadata", "Instruction", "InstructionMetadata", "information", "指令以元数据记录其来源、权威性、优先级和适用范围。", "An instruction uses metadata to record provenance, authority, priority, and applicability.", "指示はメタデータで出典、権威、優先度、適用範囲を記録します。"],
      ["InstructionResolution-resolves-Instruction", "resolves", "InstructionResolution", "Instruction", "information", "指令解决结果说明冲突或覆盖处理后哪些指令最终生效。", "An instruction resolution records which instructions remain effective after conflict and override handling.", "指示解決結果は、競合や上書き処理後にどの指示が有効かを記録します。"],
      ["PromptTemplate-contains-FewShotExample", "contains", "PromptTemplate", "FewShotExample", "composition", "提示模板可包含少样本示例，用于示范输入、输出或推理格式，而不把示例误作指令。", "A prompt template may contain few-shot examples that demonstrate input, output, or reasoning form without treating the example as an instruction.", "プロンプトテンプレートは入出力や推論形式を示す少数例を含められますが、例を指示として扱いません。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of facts) {
      upsertReviewedRelation({ id, moduleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    }
  };

  const repairNetworkSemantics = () => {
    const moduleId = "safety-network-control";
    const denialReason = localized(
      "被拒网络调用是策略执行产生的拒绝事件，不是成功发起的 NetworkCall 子类；旧分类关系已由结果关系替换。",
      "A denied network call is a denial event produced by policy enforcement, not a subclass of a successfully initiated NetworkCall; the former taxonomy edge is replaced by a result relation.",
      "拒否されたネットワーク呼び出しはポリシー適用で生じる拒否イベントであり、開始済み NetworkCall の下位型ではないため、旧分類辺を結果関係に置き換えます。",
    );
    const policyReason = localized(
      "网络策略规定网络访问的允许、拒绝和约束条件，属于策略规范而非进程隔离规范。",
      "A network policy specifies allow, deny, and constraint conditions for network access, so it is a policy specification rather than a process-isolation specification.",
      "ネットワークポリシーはネットワークアクセスの許可、拒否、制約条件を規定するため、プロセス分離仕様ではなくポリシー仕様です。",
    );
    deprecateRelation("DeniedNetworkCall-is_a-NetworkCall", ["NetworkCall-may_produce-DeniedNetworkCall"], denialReason);
    deprecateRelation("NetworkPolicy-is_a-IsolationSpecification", ["NetworkPolicy-is_a-PolicySpecification"], policyReason);
    updateReviewedConcept("DeniedNetworkCall", {
      labels: localized("被拒网络调用事件", "Denied network-call event", "拒否ネットワーク呼び出しイベント"),
      short_definitions: localized("被拒网络调用事件是网络请求在建立调用前被策略决策阻止的事件。", "A denied network-call event occurs when policy prevents a network request before a call is established.", "拒否ネットワーク呼び出しイベントは、呼び出し成立前にポリシーがネットワーク要求を阻止した出来事です。"),
      definitions: localized("被拒网络调用事件记录网络请求在建立可访问端点的调用前被策略决策阻止的事实，并保留策略、原因和请求证据。", "A denied network-call event records that policy prevented a request before a call to an accessible endpoint was established, retaining the policy, reason, and request evidence.", "拒否ネットワーク呼び出しイベントは、到達可能な端点への呼び出し成立前にポリシーが要求を阻止した事実を、ポリシー、理由、要求証拠とともに記録します。"),
      primary_parent_relation_id: null,
      root_status: "composition-root",
    });
    updateReviewedConcept("NetworkPolicy", {
      short_definitions: localized("网络策略是规定网络访问允许、拒绝与约束条件的策略规范。", "A network policy is a policy specification for allow, deny, and constraint conditions on network access.", "ネットワークポリシーはネットワークアクセスの許可、拒否、制約条件を定めるポリシー仕様です。"),
      definitions: localized("网络策略是对目标端点、协议、方向、身份和环境条件规定允许、拒绝或升级决策的策略规范；沙箱隔离规范可以引用它，但不拥有其身份。", "A network policy is a policy specification that defines allow, deny, or escalation decisions over endpoint, protocol, direction, identity, and environmental conditions; an isolation specification may reference it but does not own its identity.", "ネットワークポリシーは端点、プロトコル、方向、主体、環境条件について許可、拒否、エスカレーション判断を定めるポリシー仕様であり、分離仕様は参照できますが同一性を所有しません。"),
      primary_parent_relation_id: "NetworkPolicy-is_a-PolicySpecification",
      root_status: null,
    });
    upsertReviewedRelation({
      id: "NetworkCall-may_produce-DeniedNetworkCall",
      moduleId,
      predicate: "may_produce",
      sourceId: "NetworkCall",
      targetId: "DeniedNetworkCall",
      relationKind: "causal",
      definitions: localized("网络调用请求在建立连接或交换数据前可能因策略拒绝而产生被拒事件。", "A network-call request may produce a denial event when policy blocks it before connection establishment or data exchange.", "ネットワーク呼び出し要求は、接続確立またはデータ交換前にポリシーで阻止されると拒否イベントを生成し得ます。"),
      conditions: [{
        id: "network-call-policy-denial-condition",
        severity: "error",
        expression_language: "plain",
        expression: "an applicable network policy denies the request before connection establishment or data exchange",
        explanations: localized(
          "适用的网络策略在连接建立或数据交换前拒绝该请求。",
          "An applicable network policy denies the request before connection establishment or data exchange.",
          "適用されるネットワークポリシーが接続確立またはデータ交換前に要求を拒否します。",
        ),
        source_claims: claimsFor(
          moduleDocuments.get(moduleId).document.module,
          allConcepts().get("NetworkPolicy"),
        ),
      }],
    });
    upsertReviewedRelation({
      id: "NetworkPolicy-is_a-PolicySpecification",
      moduleId,
      predicate: "is_a",
      sourceId: "NetworkPolicy",
      targetId: "PolicySpecification",
      relationKind: "hierarchy",
      definitions: policyReason,
    });
  };

  const completeExecutionResultSemantics = () => {
    const moduleId = "runtime-execution-attempts";
    const module = moduleDocuments.get(moduleId).document.module;
    const runOutcome = allConcepts().get("RunOutcome");
    if (!runOutcome) throw new Error("RunOutcome is missing");
    const outcomeClaims = claimsFor(runOutcome, module);
    const controlledValue = (id, value, zh, en, ja, definitionZh, definitionEn, definitionJa) => ({
      id,
      value,
      labels: localized(zh, en, ja),
      definitions: localized(definitionZh, definitionEn, definitionJa),
      status: "accepted",
      source_claims: outcomeClaims.map((claim) => ({
        ...claim,
        supports: `Supports the reviewed controlled value ${value} for RunOutcome.outcome_code; this closed value set is a Moonweave design inference over the registered runtime evidence.`,
      })),
    });
    const outcomeCodeField = {
      id: "outcome_code",
      labels: localized("结局代码", "outcome code", "結果コード"),
      datatype: "string",
      required: true,
      cardinality: { min: 1, max: 1 },
      definitions: localized("一次执行尝试的受控终局：成功、失败或取消。", "The controlled terminal disposition of one execution attempt: succeeded, failed, or cancelled.", "一回の実行試行の統制された終局値：成功、失敗、取消です。"),
      allowed_values: [
        controlledValue("run-outcome-succeeded", "succeeded", "成功", "succeeded", "成功", "尝试满足完成条件。", "The attempt satisfied its completion conditions.", "試行が完了条件を満たしました。"),
        controlledValue("run-outcome-failed", "failed", "失败", "failed", "失敗", "尝试结束但未满足完成条件。", "The attempt terminated without satisfying its completion conditions.", "試行は終了しましたが完了条件を満たしませんでした。"),
        controlledValue("run-outcome-cancelled", "cancelled", "取消", "cancelled", "取消", "尝试在完成前被显式终止。", "The attempt was explicitly terminated before completion.", "試行は完了前に明示的に終了されました。"),
      ],
      pattern: null,
      example_value: "succeeded",
      source_claims: outcomeClaims.map((claim) => ({
        ...claim,
        supports: "Supports the reviewed RunOutcome.outcome_code field; the exact controlled-value boundary is a Moonweave design inference over the registered runtime evidence.",
      })),
    };
    const runAttemptIdField = {
      id: "run_attempt_id",
      labels: localized("执行尝试 ID", "run attempt ID", "実行試行 ID"),
      datatype: "reference",
      required: true,
      cardinality: { min: 1, max: 1 },
      definitions: localized("唯一标识该结局所归属的执行尝试。", "Uniquely identifies the run attempt to which this outcome belongs.", "この結果状態が属する実行試行を一意に識別します。"),
      allowed_values: [],
      pattern: null,
      example_value: "run-attempt-0187",
      source_claims: outcomeClaims.map((claim) => ({
        ...claim,
        supports: "Supports the reviewed RunOutcome.run_attempt_id identity field and its one-outcome-to-one-attempt boundary.",
      })),
    };
    updateReviewedConcept("RunOutcome", {
      labels: localized("执行结局", "Run outcome", "実行結果状態"),
      short_definitions: localized("执行结局是一次执行尝试受控的终止状态。", "A run outcome is the controlled terminal disposition of one run attempt.", "実行結果状態は一回の実行試行の統制された終止状態です。"),
      definitions: localized("执行结局只表达一次执行尝试最终成功、失败或取消，不承载该尝试产生的内容、引用、日志或工具返回值。", "A run outcome expresses only whether one run attempt ultimately succeeded, failed, or was cancelled; it does not carry content, citations, logs, or tool return values produced by the attempt.", "実行結果状態は一回の実行試行が最終的に成功、失敗、取消のどれで終わったかだけを表し、その試行が生成した内容、引用、ログ、ツール戻り値を保持しません。"),
      includes: [localized("只纳入能够唯一关联一次 RunAttempt，并以 succeeded、failed 或 cancelled 表达该尝试终局的记录。", "Includes only records that uniquely reference one RunAttempt and express its terminal disposition as succeeded, failed, or cancelled.", "一つの RunAttempt を一意に参照し、その終局を succeeded、failed、cancelled のいずれかで表す記録だけを含みます。")],
      excludes: [localized("排除执行产生的文本、引用、日志、工具返回值和产物指针；这些内容属于 RunResult。", "Excludes text, citations, logs, tool return values, and artifact pointers produced by execution; those belong to RunResult.", "実行が生成したテキスト、引用、ログ、ツール戻り値、成果物ポインターを除外し、それらは RunResult に属します。")],
      structure: {
        ...runOutcome.structure,
        identity_keys: [...new Set([...(runOutcome.structure?.identity_keys ?? []), "run_attempt_id"])],
        fields: [
          ...(runOutcome.structure?.fields ?? []).filter((field) => !["outcome_code", "run_attempt_id"].includes(field.id)),
          runAttemptIdField,
          outcomeCodeField,
        ],
      },
    });
    upsertReviewedConcept({
      id: "RunResult",
      moduleId,
      labels: localized("执行产出记录", "Run result record", "実行成果記録"),
      definitions: localized("执行产出记录是一次执行尝试实际产生的内容、引用、产物指针、工具返回值和诊断证据的可寻址信息记录；它与成功、失败或取消的终局状态分离。", "A run result record is addressable information containing the content, citations, artifact pointers, tool return values, and diagnostic evidence actually produced by one run attempt; it is separate from the terminal succeeded, failed, or cancelled disposition.", "実行成果記録は、一回の実行試行が実際に生成した内容、引用、成果物ポインター、ツール戻り値、診断証拠を保持するアドレス可能な情報であり、成功、失敗、取消の終局状態とは分離されます。"),
      semanticKind: "information",
      whyNeeded: localized("产出内容与执行结局具有不同身份、保存周期和查询用途，必须分别建模。", "Produced content and terminal disposition have different identities, retention lifecycles, and query uses, so they must be modeled separately.", "生成内容と終局状態は同一性、保持期間、照会用途が異なるため、別々にモデル化する必要があります。"),
      structure: {
        identity_keys: ["result_id"],
        fields: [
          {
            id: "result_id",
            labels: localized("产出记录 ID", "result record ID", "成果記録 ID"),
            datatype: "string",
            required: true,
            cardinality: { min: 1, max: 1 },
            definitions: localized("唯一标识一条执行产出记录。", "Uniquely identifies one run result record.", "一つの実行成果記録を一意に識別します。"),
            allowed_values: [],
            pattern: "^[A-Za-z0-9][A-Za-z0-9._:-]*$",
            example_value: "run-result-0187",
            source_claims: claimsFor(module, module),
          },
          {
            id: "run_attempt_id",
            labels: localized("执行尝试 ID", "run attempt ID", "実行試行 ID"),
            datatype: "reference",
            required: true,
            cardinality: { min: 1, max: 1 },
            definitions: localized("标识产生该记录的执行尝试。", "Identifies the run attempt that produced this record.", "この記録を生成した実行試行を識別します。"),
            allowed_values: [],
            pattern: null,
            example_value: "run-attempt-0187",
            source_claims: claimsFor(module, module),
          },
        ],
        constraints: [],
        required_relation_constraints: [],
      },
    });
    const separationReason = localized("旧关系把实际产出记录与终局状态合并；v3 通过 RunResult 分离产出内容，再由证据关系连接 RunOutcome。", "The old relation conflated produced records with terminal disposition; v3 separates content in RunResult and links it to RunOutcome through evidence.", "旧関係は生成記録と終局状態を混同していたため、v3 は内容を RunResult に分け、証拠関係で RunOutcome へ接続します。");
    deprecateRelation("RunAttempt-produces-RunOutcome", ["RunAttempt-produces-RunResult", "RunResult-evidences-RunOutcome"], separationReason);
    const facts = [
      ["Execution-has_attempt-RunAttempt", "has_attempt", "Execution", "RunAttempt", "composition", "一次执行可以由一个或多个具有独立重试身份的执行尝试组成。", "An execution may comprise one or more run attempts with distinct retry identities.", "一つの実行は、独立した再試行同一性を持つ一回以上の実行試行で構成できます。"],
      ["RunAttempt-produces-RunResult", "produces", "RunAttempt", "RunResult", "causal", "执行尝试产生记录其实际内容与证据的执行产出记录。", "A run attempt produces a run result record containing its actual content and evidence.", "実行試行は実際の内容と証拠を保持する実行成果記録を生成します。"],
      ["RunResult-evidences-RunOutcome", "evidences", "RunResult", "RunOutcome", "information", "执行产出记录提供判定执行结局的证据，但不与结局本身合并。", "A run result record provides evidence for the run outcome without becoming the outcome itself.", "実行成果記録は実行結果状態の証拠を提供しますが、結果状態そのものにはなりません。"],
      ["ToolCallAttempt-is_a-RunAttempt", "is_a", "ToolCallAttempt", "RunAttempt", "hierarchy", "工具调用尝试是以调用某一工具为工作范围的执行尝试，同时保留其 InvocationAttempt 分类。", "A tool-call attempt is a run attempt scoped to invoking one tool while retaining its InvocationAttempt classification.", "ツール呼び出し試行は一つのツール呼び出しを範囲とする実行試行であり、InvocationAttempt 分類も保持します。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of facts) {
      upsertReviewedRelation({
        id,
        moduleId: id === "ToolCallAttempt-is_a-RunAttempt" ? "tool-invocation-execution" : moduleId,
        predicate,
        sourceId,
        targetId,
        relationKind,
        definitions: localized(zh, en, ja),
      });
    }
  };

  const completeOptimizationLearningLoop = () => {
    const moduleId = "feedback-optimization-learning";
    upsertReviewedConcept({
      id: "ChangeProposal",
      moduleId,
      labels: localized("变更提案", "Change proposal", "変更提案"),
      definitions: localized("变更提案是根据学习信号形成、等待治理决策批准的可审计修改建议；它描述目标、理由、预期影响和验证条件，但不直接修改运行配置。", "A change proposal is an auditable modification recommendation derived from learning signals and awaiting governance approval; it states target, rationale, expected impact, and validation conditions without directly mutating runtime configuration.", "変更提案は学習信号から形成され、ガバナンス承認を待つ監査可能な変更案です。対象、理由、期待効果、検証条件を示しますが、実行設定を直接変更しません。"),
      semanticKind: "information",
    });
    const proposalTypes = [
      ["ParameterChangeProposal", "参数变更提案", "Parameter change proposal", "パラメーター変更提案", "参数变更提案只建议调整有明确边界和验证指标的参数值。", "A parameter change proposal recommends changes only to parameter values with explicit bounds and validation metrics.", "パラメーター変更提案は、明示された境界と検証指標を持つパラメーター値の変更だけを提案します。"],
      ["PolicyChangeProposal", "策略变更提案", "Policy change proposal", "ポリシー変更提案", "策略变更提案建议修改治理规则、条件或决策阈值，并必须经过策略决策。", "A policy change proposal recommends changes to governance rules, conditions, or decision thresholds and must pass a policy decision.", "ポリシー変更提案はガバナンス規則、条件、判断閾値の変更を提案し、ポリシー判断を通過する必要があります。"],
      ["PromptChangeProposal", "提示变更提案", "Prompt change proposal", "プロンプト変更提案", "提示变更提案建议修改提示模板或指令内容，并保留目标版本、依据和评估条件。", "A prompt change proposal recommends a prompt-template or instruction change while retaining target version, evidence, and evaluation conditions.", "プロンプト変更提案は、対象版、根拠、評価条件を保持しながらプロンプトテンプレートまたは指示の変更を提案します。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of proposalTypes) {
      upsertReviewedConcept({ id, moduleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "information", primaryParentRelationId: `${id}-is_a-ChangeProposal` });
      upsertReviewedRelation({ id: `${id}-is_a-ChangeProposal`, moduleId, predicate: "is_a", sourceId: id, targetId: "ChangeProposal", relationKind: "hierarchy", definitions: localized(`${zh}是以特定变更对象为区分特征的变更提案。`, `${en} is a change proposal distinguished by its specific change target.`, `${ja}は特定の変更対象を種差とする変更提案です。`) });
    }
    const signalTypes = [
      ["FeedbackLearningSignal", "反馈学习信号", "Feedback learning signal", "フィードバック学習信号", "反馈学习信号由明确的人类或系统反馈形成，并保留反馈来源与适用语境。", "A feedback learning signal is derived from explicit human or system feedback and retains its source and applicability context.", "フィードバック学習信号は明示的な人間またはシステムのフィードバックから形成され、出典と適用文脈を保持します。"],
      ["RewardLearningSignal", "奖励学习信号", "Reward learning signal", "報酬学習信号", "奖励学习信号由一次或一组运行的奖励值及其计算语境形成。", "A reward learning signal is formed from reward values for one or more runs together with their computation context.", "報酬学習信号は一回以上の実行の報酬値とその計算文脈から形成されます。"],
      ["PreferenceLearningSignal", "偏好学习信号", "Preference learning signal", "選好学習信号", "偏好学习信号由候选之间可追溯的比较或排序判断形成。", "A preference learning signal is formed from a traceable comparison or ranking judgment among candidates.", "選好学習信号は候補間の追跡可能な比較または順位判断から形成されます。"],
    ];
    for (const [id, zh, en, ja, definitionZh, definitionEn, definitionJa] of signalTypes) {
      upsertReviewedConcept({ id, moduleId, labels: localized(zh, en, ja), definitions: localized(definitionZh, definitionEn, definitionJa), semanticKind: "information", primaryParentRelationId: `${id}-is_a-LearningSignal` });
      upsertReviewedRelation({ id: `${id}-is_a-LearningSignal`, moduleId, predicate: "is_a", sourceId: id, targetId: "LearningSignal", relationKind: "hierarchy", definitions: localized(`${zh}是以证据来源为区分特征的学习信号。`, `${en} is a learning signal distinguished by its evidence source.`, `${ja}は証拠源を種差とする学習信号です。`) });
    }
    const oldTaxonomyReason = localized("学习信号可以由反馈推导，但它是供优化使用的规范化证据，不是 Feedback 的子类。", "A learning signal may be derived from feedback, but it is normalized evidence for optimization rather than a subclass of Feedback.", "学習信号はフィードバックから導出できますが、Feedback の下位型ではなく最適化用に正規化された証拠です。");
    deprecateRelation("LearningSignal-is_a-Feedback", ["learning_signal_derived_from_feedback", "LearningSignal-supports-ChangeProposal"], oldTaxonomyReason);
    const guardedUpdateReason = localized("学习信号只能支持变更提案；运行中的记忆、路由或工具选择必须经过显式提案、策略决策和后续执行，不能由信号直接修改。", "A learning signal may only support a change proposal; memory, routing, or tool selection in operation must pass through an explicit proposal, policy decision, and subsequent execution rather than direct signal mutation.", "学習信号は変更提案を支援するだけであり、運用中の記憶、経路制御、ツール選択は明示的な提案、ポリシー判断、その後の実行を経なければ直接変更できません。");
    for (const relationId of [
      "learning_signal_updates_memory_preference",
      "learning_signal_updates_routing_policy",
      "learning_signal_updates_tool_selection",
    ]) {
      deprecateRelation(relationId, ["LearningSignal-supports-ChangeProposal", "ChangeProposal-requires-PolicyDecision"], guardedUpdateReason);
    }
    updateReviewedConcept("LearningSignal", {
      primary_parent_relation_id: null,
      root_status: "composition-root",
      definitions: localized("学习信号是从反馈、奖励或偏好证据中归一化得到、供优化循环评估变更提案的可追溯信息；它本身不执行变更。", "A learning signal is traceable information normalized from feedback, reward, or preference evidence for an optimization loop to evaluate change proposals; it does not execute a change itself.", "学習信号はフィードバック、報酬、選好証拠から正規化され、最適化ループが変更提案を評価するための追跡可能な情報であり、それ自体は変更を実行しません。"),
    });
    const facts = [
      ["OptimizationLoop-consumes-LearningSignal", "consumes", "OptimizationLoop", "LearningSignal", "information", "优化循环消费经归一化的学习信号作为变更依据。", "An optimization loop consumes normalized learning signals as evidence for change.", "最適化ループは変更根拠として正規化された学習信号を消費します。"],
      ["OptimizationLoop-optimizes-OptimizationTarget", "optimizes", "OptimizationLoop", "OptimizationTarget", "causal", "优化循环围绕明确的优化目标比较基线、候选变更和验证结果。", "An optimization loop compares baselines, candidate changes, and validation results around an explicit optimization target.", "最適化ループは明示的な最適化対象について基準、変更候補、検証結果を比較します。"],
      ["OptimizationLoop-produces-ChangeProposal", "produces", "OptimizationLoop", "ChangeProposal", "causal", "优化循环的直接产出是待治理的变更提案，而不是对运行配置的直接写入。", "The direct output of an optimization loop is a governed change proposal, not a direct write to runtime configuration.", "最適化ループの直接出力はガバナンス対象の変更提案であり、実行設定への直接書き込みではありません。"],
      ["LearningSignal-supports-ChangeProposal", "supports", "LearningSignal", "ChangeProposal", "information", "学习信号为变更提案的理由、预期影响和验证条件提供证据。", "A learning signal supplies evidence for the rationale, expected impact, and validation conditions of a change proposal.", "学習信号は変更提案の理由、期待効果、検証条件に証拠を提供します。"],
      ["ChangeProposal-requires-PolicyDecision", "requires", "ChangeProposal", "PolicyDecision", "governance", "任何变更提案在影响运行配置前都需要一项可审计的策略决策。", "Every change proposal requires an auditable policy decision before it can affect runtime configuration.", "変更提案が実行設定へ影響する前には、監査可能なポリシー判断が必要です。"],
    ];
    for (const [id, predicate, sourceId, targetId, relationKind, zh, en, ja] of facts) {
      upsertReviewedRelation({ id, moduleId, predicate, sourceId, targetId, relationKind, definitions: localized(zh, en, ja) });
    }
  };

  return Object.freeze({ fixCrossKindTaxonomy, RECLASSIFIED_CONCEPTS, normalizeReclassifiedConcepts, addExecutionBackbone, addDelegationSemanticBackbone, completeContextDiscoveryFlow, completePromptInstructionBackbone, repairNetworkSemantics, completeExecutionResultSemantics, completeOptimizationLearningLoop });
};
\n
