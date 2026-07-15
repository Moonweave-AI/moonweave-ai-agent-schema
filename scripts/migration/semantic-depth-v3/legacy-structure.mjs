export const createLegacyStructurePhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction } = context;

  const moveSplitModules = () => {
    for (const split of SPLITS) {
      const sourceEntry = moduleDocuments.get(split.from);
      if (!sourceEntry) throw new Error(`Missing split source ${split.from}`);
      const source = sourceEntry.document;
      const movedIds = new Set(split.move);
      const movedClasses = source.classes.filter((concept) => movedIds.has(concept.id));
      const missing = split.move.filter((id) => !movedClasses.some((concept) => concept.id === id));
      if (missing.length) throw new Error(`${split.from} is missing split concepts: ${missing.join(", ")}`);

      const movedRelations = source.relations.filter((relation) => movedIds.has(relation.source_id));
      source.classes = source.classes.filter((concept) => !movedIds.has(concept.id));
      source.relations = source.relations.filter((relation) => !movedIds.has(relation.source_id));
      for (const concept of movedClasses) concept.module_id = split.to;

      const [zh, en, ja] = MODULE_CONFIG[split.to];
      const newDocument = {
        source_kind: "agent-ontology-module",
        contract_version: "2.0.0",
        module: {
          ...structuredClone(source.module),
          id: split.to,
          labels: localized(zh, en, ja),
        },
        classes: movedClasses,
        relations: movedRelations,
      };
      const directory = path.join(SOURCE_ROOT, source.module.plane_id.replace("-plane", ""));
      const filePath = path.join(directory, `${split.to}.json`);
      moduleDocuments.set(split.to, { filePath, document: newDocument });
    }
  };

  const moveOwnedConcepts = ({ from, to, ids }) => {
    const sourceEntry = moduleDocuments.get(from);
    const targetEntry = moduleDocuments.get(to);
    if (!sourceEntry || !targetEntry) throw new Error(`Cannot move concepts from ${from} to ${to}`);
    const idSet = new Set(ids);
    const existingTargetIds = new Set(targetEntry.document.classes.map((concept) => concept.id));
    const sourceConcepts = sourceEntry.document.classes.filter((concept) => idSet.has(concept.id));
    const resolvedIds = new Set([...sourceConcepts.map((concept) => concept.id), ...ids.filter((id) => existingTargetIds.has(id))]);
    const missing = ids.filter((id) => !resolvedIds.has(id));
    if (missing.length) throw new Error(`Owner migration ${from} -> ${to} is missing: ${missing.join(", ")}`);

    const movedConcepts = sourceConcepts.map((concept) => ({ ...concept, module_id: to }));
    sourceEntry.document.classes = sourceEntry.document.classes.filter((concept) => !idSet.has(concept.id));
    targetEntry.document.classes = [
      ...targetEntry.document.classes,
      ...movedConcepts.filter((concept) => !existingTargetIds.has(concept.id)),
    ];

    const movedRelations = [];
    for (const [moduleId, entry] of moduleDocuments) {
      if (moduleId === to) continue;
      const owned = entry.document.relations.filter((relation) => idSet.has(relation.source_id));
      movedRelations.push(...owned);
      entry.document.relations = entry.document.relations.filter((relation) => !idSet.has(relation.source_id));
    }
    const targetRelationIds = new Set(targetEntry.document.relations.map((relation) => relation.id));
    targetEntry.document.relations = [
      ...targetEntry.document.relations,
      ...movedRelations.filter((relation) => !targetRelationIds.has(relation.id)),
    ];
  };

  const mergeActorAuthorityScope = () => {
    const runtime = moduleDocuments.get("runtime-actors");
    const safety = moduleDocuments.get("safety-trust-boundary");
    if (!runtime || !safety) throw new Error("Authority-scope owner modules are missing");
    const legacy = runtime.document.classes.find((concept) => concept.id === "ActorAuthorityScope");
    const canonical = safety.document.classes.find((concept) => concept.id === "AuthorityScope");
    if (!legacy || !canonical) throw new Error("ActorAuthorityScope/AuthorityScope merge endpoints are missing");

    const relationIds = new Map([
      ["ActorAuthorityScope-constrains-Actor", "AuthorityScope-constrains-Actor"],
      ["has_actor_authority_scope", "AgentActor-has_authority_scope-AuthorityScope"],
    ]);
    const replaceAuthorityReferences = (value) => {
      if (typeof value === "string") {
        let result = value.replaceAll("ActorAuthorityScope", "AuthorityScope");
        for (const [oldId, newId] of relationIds) result = result.replaceAll(oldId, newId);
        return result;
      }
      if (Array.isArray(value)) return value.map(replaceAuthorityReferences);
      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceAuthorityReferences(entry)]));
      }
      return value;
    };

    for (const { document } of moduleDocuments.values()) {
      document.classes = document.classes.map((concept) => concept.id === legacy.id ? concept : replaceAuthorityReferences(concept));
      document.relations = document.relations
        .filter((relation) => !relationIds.has(relation.id))
        .map((relation) => replaceAuthorityReferences(relation))
        .map((relation) => relation.id === "AgentActor-has_authority_scope-AuthorityScope"
          ? { ...relation, predicate: "has_authority_scope" }
          : relation);
    }

    const deprecationReason = localized(
      "该旧 ID 与安全域 AuthorityScope 重复；v3 保留 AuthorityScope 作为唯一授权范围概念。",
      "This legacy ID duplicated the safety-owned AuthorityScope; v3 keeps AuthorityScope as the single authorization-scope concept.",
      "この旧 ID は安全領域の AuthorityScope と重複していたため、v3 は AuthorityScope を唯一の認可範囲概念として保持します。",
    );
    runtime.document.classes = runtime.document.classes.map((concept) => concept.id === legacy.id ? {
      ...concept,
      status: "deprecated",
      primary_parent_relation_id: null,
      root_status: "composition-root",
      examples: [],
      deprecated_in: VERSION_IRI,
      replaced_by_ids: [canonical.id],
      deprecation_reason: deprecationReason,
      change_note: deprecationReason,
      review: reviewFor("runtime-plane", deprecationReason),
    } : concept);

    const sourceOwnedRelations = [];
    for (const [moduleId, entry] of moduleDocuments) {
      if (moduleId === "safety-trust-boundary") continue;
      const owned = entry.document.relations.filter((relation) => relation.source_id === canonical.id);
      sourceOwnedRelations.push(...owned);
      entry.document.relations = entry.document.relations.filter((relation) => relation.source_id !== canonical.id);
    }
    const safetyRelationIds = new Set(safety.document.relations.map((relation) => relation.id));
    safety.document.relations = [
      ...safety.document.relations,
      ...sourceOwnedRelations.filter((relation) => !safetyRelationIds.has(relation.id)),
    ];

    for (const [legacyRelationId, acceptedRelationId] of relationIds) {
      const acceptedRelationOwner = [...moduleDocuments.values()].find(({ document }) =>
        document.relations.some((relation) => relation.id === acceptedRelationId),
      );
      const acceptedRelation = acceptedRelationOwner?.document.relations.find(
        (relation) => relation.id === acceptedRelationId,
      );
      if (!acceptedRelationOwner || !acceptedRelation || acceptedRelation.status !== "accepted") {
        throw new Error(`Accepted authority-scope relation ${acceptedRelationId} is missing`);
      }
      const aliasReason = localized(
        `旧关系 ID ${legacyRelationId} 仅用于冻结 v1 迁移记录的可追溯性；v3 查询和逻辑骨架必须使用 ${acceptedRelationId}。`,
        `The legacy relation ID ${legacyRelationId} exists only to preserve traceability from the frozen v1 migration record; v3 queries and logical backbones must use ${acceptedRelationId}.`,
        `旧関係 ID ${legacyRelationId} は凍結 v1 移行記録からの追跡可能性だけを保持し、v3 の照会と論理バックボーンは ${acceptedRelationId} を使用します。`,
      );
      acceptedRelationOwner.document.relations.push({
        ...structuredClone(acceptedRelation),
        id: legacyRelationId,
        status: "deprecated",
        layout_role: "cross-link",
        layout_parent_id: null,
        layout_child_id: null,
        examples: [],
        deprecated_in: VERSION_IRI,
        replaced_by_ids: [acceptedRelationId],
        deprecation_reason: aliasReason,
        change_note: aliasReason,
        review: reviewFor(acceptedRelationOwner.document.module.plane_id, aliasReason),
      });
    }
  };

  const applyOwnerAndIdentityCorrections = () => {
    const migrations = [
      { from: "info-output-disclosure", to: "info-container-command", ids: ["OutputStream", "OutputSegment", "OutputChunk"] },
      { from: "info-indexing", to: "memory-retrieval-ranking", ids: ["RetrievalScore", "RetrievedCandidate", "RetrievedContextCandidate"] },
      { from: "info-storage-sources", to: "memory-ingestion", ids: ["TextDocument"] },
      { from: "info-output-disclosure", to: "memory-context", ids: ["VisibleContextWindow"] },
      { from: "info-messages-instructions", to: "memory-context", ids: ["ContextPackage"] },
      { from: "tool-discovery-selection", to: "info-indexing", ids: ["DiscoveryActivity"] },
      { from: "tool-registry-definition", to: "info-prompts-instructions", ids: ["PromptTemplate"] },
      { from: "info-messages-instructions", to: "info-prompts-instructions", ids: ["InstructionApplicability", "InstructionAuthority", "InstructionPriority", "InstructionProvenance", "InstructionScope"] },
      { from: "orchestration-evaluation", to: "feedback-review-optimization", ids: ["CritiqueArtifact", "ReflectionRecord", "ReviewEvent", "RevisionArtifact", "RevisionPlan"] },
      { from: "orchestration-delegation-handoff", to: "tool-invocation-execution", ids: ["AgentAsToolInvocation"] },
      { from: "feedback-logging", to: "runtime-observability", ids: ["TelemetryEvent"] },
    ];
    for (const migration of migrations) moveOwnedConcepts(migration);
    mergeActorAuthorityScope();
  };

  const replaceStrings = (value, replacements) => {
    if (typeof value === "string") {
      return replacements.reduce(
        (normalized, [before, after]) => normalized.replaceAll(before, after),
        value,
      );
    }
    if (Array.isArray(value)) return value.map((entry) => replaceStrings(entry, replacements));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, replaceStrings(entry, replacements)]),
      );
    }
    return value;
  };

  const normalizeTerminology = () => {
    const sharedReplacements = [
      ["能力表面", "能力发布接口"],
      ["Schema 表面", "Schema 接口"],
      ["上下文摄入事件", "上下文进入事件"],
      ["上下文摄入证据", "进入上下文的证据"],
      ["上下文摄入产物", "进入上下文的产物"],
      ["上下文摄入", "上下文接入"],
    ];
    const moduleReplacements = new Map([
      ["feedback-logging", [
        ["日志或追踪信息制品", "日志或追踪产物"],
        ["日志信息制品", "日志产物"],
        ["信息制品", "日志产物"],
      ]],
      ["info-indexing", [
        ["发现界面", "发现入口"],
        ["信息制品", "索引记录"],
      ]],
      ["info-prompts-instructions", [
        ["referencing the Tool-domain template definition through instantiates", "and instantiating the PromptTemplate owned by this module"],
        ["references the Tool-domain template definition without duplicating it in Info", "instantiates the template specification owned by this module without duplicating its definition"],
        ["引用 Tool 域的模板定义，避免在 Info 域复制定义节点", "实例化本模块拥有的模板规范，并避免复制定义节点"],
        ["Tool ドメインのテンプレート定義を参照し、Info で複製しません", "本モジュールが所有するテンプレート仕様をインスタンス化し、定義を複製しません"],
      ]],
      ["info-output-disclosure", [
        ["披露审计制品", "披露审计记录"],
        ["信息制品", "披露记录"],
      ]],
      ["memory-chunking-situating", [
        ["分块信息制品", "分块产物"],
        ["信息制品", "分块产物"],
      ]],
      ["memory-context", [
        ["最终 ContextPackage 由 Info 域唯一拥有并通过关系引用", "最终 ContextPackage 由本模块唯一拥有，并由其他模块通过 canonical 关系引用"],
        ["Final ContextPackage is uniquely owned by Info and referenced by relation", "Final ContextPackage is uniquely owned by this module and referenced by other modules through canonical relations"],
        ["最終 ContextPackage は Info が一意所有し関係参照し", "最終 ContextPackage は本モジュールが一意に所有し、他モジュールは canonical 関係で参照し"],
        ["上下文信息制品", "上下文产物"],
        ["信息制品", "上下文产物"],
      ]],
      ["memory-retrieval-ranking", [
        ["检索信息制品", "检索记录"],
        ["信息制品", "检索记录"],
      ]],
      ["tool-discovery-selection", [["信息制品", "提示内容"]]],
    ]);

    for (const [moduleId, entry] of moduleDocuments) {
      entry.document = replaceStrings(entry.document, [
        ...sharedReplacements,
        ...(moduleReplacements.get(moduleId) ?? []),
      ]);
    }
  };

  const repairSourceAttachmentEvidence = () => {
    const entry = moduleDocuments.get("memory-ingestion");
    const relationId = "SourceAttachment-describes-IngestibleResource";
    const relation = allRelations().get(relationId);
    if (!entry || !relation) throw new Error(`Missing canonical relation ${relationId}`);

    entry.document.classes = entry.document.classes.map((concept) => {
      if (concept.id !== "SourceAttachment") return concept;
      const positiveDescription = localized(
        `SourceAttachment 以 canonical 关系 ${relationId} 指向其所描述的 IngestibleResource；附件本身仍通过 SourceAttachment-is_a-IngestibleInformation 分类为可接入信息，两项事实不得混为一条。`,
        `SourceAttachment points to the IngestibleResource it describes through canonical relation ${relationId}; the attachment itself remains classified as ingestible information through SourceAttachment-is_a-IngestibleInformation, and the two facts must not be conflated.`,
        `SourceAttachment は canonical 関係 ${relationId} により記述対象の IngestibleResource を指します。添付自体は SourceAttachment-is_a-IngestibleInformation により取込可能情報として分類され、二つの事実を混同してはなりません。`,
      );
      const boundaryDescription = localized(
        "Database 是附件可能描述的资源类型，而不是 SourceAttachment 本身。只有显式的 describes 断言才能连接二者；共现、名称相近或共享接入流程都不能合并其身份。",
        "Database is a resource type that an attachment may describe, not the SourceAttachment itself. Only an explicit describes assertion connects them; co-occurrence, lexical similarity, or a shared ingestion flow does not merge their identities.",
        "Database は添付が記述し得る資源型であり、SourceAttachment 自体ではありません。両者を結ぶのは明示的な describes アサーションだけで、共起、名称類似、共通取込フローによって同一化してはなりません。",
      );
      const exampleClaims = (concept.source_claims ?? []).map((claim) => ({
        ...claim,
        supports: `Supports the distinction between an ingestible SourceAttachment and the IngestibleResource it describes. The ontology-specific boundary and canonical fact ${relationId} are accepted Moonweave design inferences over this registered evidence.`,
      }));
      return {
        ...concept,
        why_needed: localized(
          `来源附件需要同时表达两个不同事实：它自身是 IngestibleInformation，并通过 ${relationId} 描述另一项 IngestibleResource。`,
          `SourceAttachment is needed to express two distinct facts: it is itself IngestibleInformation and it describes another IngestibleResource through ${relationId}.`,
          `SourceAttachment は二つの異なる事実を表すために必要です。添付自体は IngestibleInformation であり、${relationId} により別の IngestibleResource を記述します。`,
        ),
        includes: [localized(
          "纳入携带来源位置、摘要、信任边界与版本信息的附件对象或引用；附件的身份与它所描述的资源身份必须分别保留。",
          "Includes attached objects or references carrying source location, digest, trust-boundary, and version information; attachment identity and described-resource identity must remain separate.",
          "出典位置、ダイジェスト、信頼境界、版情報を持つ添付オブジェクトまたは参照を含み、添付の同一性と記述対象資源の同一性を分離して保持します。",
        )],
        examples: (concept.examples ?? []).map((example) => {
          if (example.kind === "positive") {
            return {
              ...example,
              descriptions: positiveDescription,
              related_node_ids: ["SourceAttachment", "IngestibleResource"],
              related_relation_ids: [relationId],
              expected_result: localized(
                `查询解析 ${relationId} 的 SourceAttachment→IngestibleResource 方向，同时保留 SourceAttachment-is_a-IngestibleInformation 这一独立分类事实。`,
                `The query resolves the SourceAttachment-to-IngestibleResource direction of ${relationId} while retaining SourceAttachment-is_a-IngestibleInformation as a separate classification fact.`,
                `照会は ${relationId} の SourceAttachment→IngestibleResource 方向を解決し、SourceAttachment-is_a-IngestibleInformation を別の分類事実として保持します。`,
              ),
              why_valid_or_invalid: localized(
                "正例复用真实关系、方向和两个实际端点，并明确区分“附件是什么”与“附件描述什么”。",
                "The positive example reuses the real relation, direction, and endpoints and distinguishes what the attachment is from what it describes.",
                "正例は実在する関係、方向、端点を再利用し、「添付が何であるか」と「何を記述するか」を区別します。",
              ),
              source_claims: exampleClaims,
            };
          }
          if (example.kind === "boundary") {
            return {
              ...example,
              descriptions: boundaryDescription,
              related_node_ids: ["SourceAttachment", "IngestibleResource", "Database"],
              related_relation_ids: [relationId],
              expected_result: localized(
                "验证器保留 Database 的资源身份与 SourceAttachment 的附件身份；缺少显式 describes 断言时不得推导二者关系。",
                "Validation preserves Database resource identity and SourceAttachment attachment identity; it must not infer their relation without an explicit describes assertion.",
                "検証器は Database の資源同一性と SourceAttachment の添付同一性を保持し、明示的な describes アサーションなしに関係を推論してはなりません。",
              ),
              why_valid_or_invalid: localized(
                `边界例保留 ${relationId} 的真实方向，并用显式关系而不是共现判断描述事实。`,
                `The boundary case preserves the real direction of ${relationId} and tests the description fact through an explicit relation rather than co-occurrence.`,
                `境界例は ${relationId} の実際の方向を保ち、共起ではなく明示的な関係で記述事実を判定します。`,
              ),
              source_claims: exampleClaims,
            };
          }
          return example;
        }),
      };
    });
  };

  const completeCrossDomainBoundaryContexts = () => {
    const concepts = allConcepts();
    const modulePlanes = new Map([...moduleDocuments].map(([moduleId, { document }]) => [moduleId, document.module.plane_id]));
    for (const { document } of moduleDocuments.values()) {
      document.relations = document.relations.map((relation) => {
        const source = concepts.get(relation.source_id);
        const target = concepts.get(relation.target_id);
        const sourcePlane = modulePlanes.get(source?.module_id);
        const targetPlane = modulePlanes.get(target?.module_id);
        const crossesDomain = sourcePlane && targetPlane && sourcePlane !== targetPlane;
        if (!crossesDomain) {
          return relation.boundary_context ? { ...relation, boundary_context: null } : relation;
        }
        if (relation.relation_kind === "hierarchy" || relation.boundary_context) return relation;
        return {
          ...relation,
          boundary_context: {
            trust_boundary_concept_id: "TrustBoundary",
            authority_basis: localized(
              `${source.labels.zh}仍由 ${source.module_id} 唯一拥有，${target.labels.zh}仍由 ${target.module_id} 唯一拥有；${relation.predicate} 只建立跨域事实，不转移定义权。若该事实触发运行操作，还必须引用适用的 PolicyDecision 或 AuthorizationGrant。`,
              `${source.labels.en} remains uniquely owned by ${source.module_id} and ${target.labels.en} by ${target.module_id}; ${relation.predicate} establishes a cross-Domain fact without transferring definitional ownership. If the fact triggers a runtime operation, it must also reference an applicable PolicyDecision or AuthorizationGrant.`,
              `${source.labels.ja}は ${source.module_id}、${target.labels.ja}は ${target.module_id} に引き続き一意に所有されます。${relation.predicate} は定義所有権を移さずドメイン横断事実だけを確立し、実行操作を起動する場合は適用される PolicyDecision または AuthorizationGrant も参照します。`,
            ),
            protocol_or_resource_context: localized(
              `查询沿 ${relation.id} 的 source→target 方向、端点 canonical ID 与本关系来源主张执行；协议版本、资源身份和信任判定继续附着在原节点或原关系。`,
              `Queries follow the source-to-target direction, endpoint canonical IDs, and source claims of ${relation.id}; protocol versions, resource identity, and trust decisions remain attached to the original nodes or relation.`,
              `照会は ${relation.id} の source→target 方向、端点 canonical ID、当該関係の出典主張に従い、プロトコル版、資源同一性、信頼判断は元のノードまたは関係に保持されます。`,
            ),
          },
        };
      });
    }
  };

  return Object.freeze({ moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts });
};
