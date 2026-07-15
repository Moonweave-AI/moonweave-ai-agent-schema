import { reviewedRelationChangesForConcept } from "../../data/ontology-v3-reviewed-relation-replacements.mjs";
import {
  assertSharedPrefixAuditResolved,
  buildSharedPrefixAudit,
} from "../../lib/ontology-shared-prefix-audit.mjs";
import { buildReviewedDomainClosurePlanes } from
  "../../lib/ontology-domain-closure.mjs";

export const createPersistencePhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction, moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts, locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor, fixCrossKindTaxonomy, RECLASSIFIED_CONCEPTS, normalizeReclassifiedConcepts, addExecutionBackbone, addDelegationSemanticBackbone, completeContextDiscoveryFlow, completePromptInstructionBackbone, repairNetworkSemantics, completeExecutionResultSemantics, completeOptimizationLearningLoop, completeEvaluationGoldenFlow, completeContextAssemblySemantics, completeRetrievalExecutionSemantics, repairEvaluationCompositionAndAgency, completeGovernedOptimizationApplication, completeMemoryPipelineSemantics, completeInstructionAndDisclosureProcessing, completeDelegationSelectionAndHandoff, completeInvocationAndRetrySemantics, completeMemoryOperationAndStorageSemantics, completeImprovementLoopCoordination, repairResidualAgencyAndCompositionSemantics, completePlannedOperationalGaps, completeTransportAndRecoveryGaps, completePolicyEffectAndProjectionGaps, migrateWorkerRole, repairFinalResidualAgencySemantics, repairSoftwareDefectCasePathForToolCallPlan, ensureReview, applyReviewedModuleDecision, applyDirectionalDistinctFactRationales, applyReviewedRepresentativeInverseReadings, addModuleMetadata, assignLogicalBackbone, completeSiblingDifferentiation, operationalNotionsForConcept, operationalNotionsForRelation, rewriteAcceptedObjectEvidence } = context;

  const updateProduct = () => {
    const { document } = productDocument;
    document.contract_version = "2.0.0";
    document.product.date = REVIEW_DATE;
    document.product.includes = [localized(
      "八个 Agent 工程领域，以及按能力边界组织、可独立审查的模块、概念和关系。",
      "Eight agent-engineering domains and independently reviewable modules, concepts, and relations organized by capability boundaries.",
      "八つのエージェント工学ドメインと、能力境界で編成され独立審査可能なモジュール、概念、関係。",
    )];
    document.product.why_needed = localized(
      "工程师需要沿领域、模块和任意深度逻辑骨架定位 Agent 构件，并在同一节点或关系查看结构、案例、来源和治理信息。",
      "Engineers need to locate agent building blocks along domains, modules, and arbitrary-depth logical backbones while viewing structure, cases, evidence, and governance on the same node or relation.",
      "エンジニアはドメイン、モジュール、任意深度の論理バックボーンに沿ってエージェント構成要素を特定し、同じノードまたは関係で構造、事例、出典、ガバナンスを確認する必要があります。",
    );
    document.planes = buildReviewedDomainClosurePlanes(
      document.planes,
      [...moduleDocuments.values()].map(({ document: moduleSource }) => moduleSource.module),
    );
    for (const plane of document.planes) {
      const boundary = PLANE_BOUNDARIES[plane.id];
      plane.purpose = localized(boundary[0], boundary[1], boundary[2]);
      ensureReview(plane, plane.id, plane.labels);
      plane.change_note = localized("v3 按领域闭环与模块边界重新审查。", "Re-reviewed in v3 for domain closure and module boundaries.", "v3 でドメイン閉包とモジュール境界を再審査しました。");
    }
    const gates = [
      ["no-module-label-suffix", "模块名称无后缀", "No Module label suffix", "モジュール名接尾辞なし", "module_label_suffix_violation_count == 0"],
      ["no-template-module-copy", "无模块模板文案", "No Module template copy", "モジュール定型文なし", "template_text_violation_count == 0"],
      ["no-unresolved-accepted-root", "无未决已接受根", "No unresolved accepted root", "未解決 accepted ルートなし", "unresolved_root_count == 0"],
      ["no-cross-kind-is-a", "无跨种类分类继承", "No cross-kind is-a", "kind 横断 is-a なし", "cross_kind_is_a_count == 0"],
      ["primary-backbone-acyclic", "主骨架无环", "Primary backbone is acyclic", "主バックボーン非循環", "primary_backbone_cycle_count == 0"],
      ["every-primary-cq-has-one-owner", "每个主 CQ 只有一个 owner", "Every primary CQ has one owner", "各主 CQ に一意の所有者", "unowned_cq_count == 0"],
    ];
    const existingIds = new Set(document.hygiene_gates.map((gate) => gate.id));
    for (const [id, zh, en, ja, expression] of gates) {
      if (existingIds.has(id)) {
        const existing = document.hygiene_gates.find((gate) => gate.id === id);
        existing.check_kind = "generation";
        existing.expression = expression;
        continue;
      }
      document.hygiene_gates.push({
        id, labels: localized(zh, en, ja),
        descriptions: localized(`${zh}是 v3 发布的硬门禁。`, `${en} is a hard v3 release gate.`, `${ja}は v3 リリースの必須ゲートです。`),
        severity: "error", check_kind: "generation", expression, status: "accepted", source_claims: [],
      });
    }
    const replaceLegacyCount = (value) => {
      if (typeof value === "string") {
        return value
          .replaceAll("八域、41 模块", "八域与按能力边界组织的模块")
          .replaceAll("eight Domains, 41 Modules", "eight Domains and capability-bounded Modules")
          .replaceAll("Eight Domains, 41 Modules", "Eight Domains and capability-bounded Modules")
          .replaceAll("八ドメイン、41 モジュール", "八ドメインと能力境界で編成されたモジュール")
          .replaceAll("41 Module", "capability-bounded Module")
          .replaceAll("41 modules", "capability-bounded modules");
      }
      if (Array.isArray(value)) return value.map(replaceLegacyCount);
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceLegacyCount(item)]));
      return value;
    };
    const normalized = replaceLegacyCount(document);
    Object.keys(document).forEach((key) => delete document[key]);
    Object.assign(document, normalized);
  };

  const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const writeCsv = (filePath, headers, rows) => {
    const content = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n") + "\n";
    stageFile(filePath, content);
  };

  const backboneDepths = (document) => {
    const parent = new Map(document.relations
      .filter((relation) => relation.status === "accepted" && relation.layout_role === "primary-backbone")
      .map((relation) => [relation.layout_child_id, relation.layout_parent_id]));
    const result = new Map();
    for (const concept of document.classes) {
      let current = concept.id;
      let depth = 0;
      const seen = new Set();
      while (parent.has(current)) {
        if (seen.has(current)) throw new Error(`Primary backbone cycle at ${concept.id}`);
        seen.add(current);
        current = parent.get(current);
        depth += 1;
      }
      result.set(concept.id, depth);
    }
    return result;
  };

  const writeLedgersAndAudit = (baseline) => {
    const conceptHeaders = [
      "concept_id", "current_domain_id", "current_module_id", "current_label_zh", "current_semantic_kind", "current_primary_parent_relation_id", "current_depth", "current_root_status", "lexical_family", "definition_family", "decision", "target_domain_id", "target_module_id", "proposed_label_zh", "proposed_semantic_kind", "proposed_primary_parent_relation_id", "proposed_backbone_relation_id", "convert_to_field_of", "convert_to_allowed_value_of", "merge_into_id", "split_into_ids", "required_relation_changes", "owner_rationale", "source_ids", "positive_example_id", "boundary_example_id", "domain_reviewer", "ontology_reviewer", "language_reviewer", "review_status",
    ];
    const conceptRows = [];
    for (const [moduleId, { document }] of [...moduleDocuments].sort(([left], [right]) => left.localeCompare(right, "en"))) {
      const depths = backboneDepths(document);
      const backboneByChild = new Map(document.relations.filter((relation) => relation.status === "accepted" && relation.layout_role === "primary-backbone").map((relation) => [relation.layout_child_id, relation.id]));
      for (const concept of [...document.classes].sort((left, right) => left.id.localeCompare(right.id, "en"))) {
        const before = baseline.concepts.get(concept.id);
        const beforeModule = before?.module_id ?? "";
        const sourceIds = (concept.source_claims ?? []).map((claim) => claim.source_id).sort().join("|");
        const reviewedDecision = reviewedConceptHistoryDecision({
          concept,
          baselineConcept: before,
        });
        const decision = reviewedDecision.decision;
        const replacementConceptIds = [...(concept.replaced_by_ids ?? [])].sort();
        const splitIntoIds = reviewedDecision.splitIntoIds ??
          (replacementConceptIds.length > 1 ? replacementConceptIds : []);
        const mergeIntoId = reviewedDecision.mergeIntoId ??
          (replacementConceptIds.length === 1 && splitIntoIds.length === 0
            ? replacementConceptIds[0]
            : "");
        const reviewedRelationChanges = reviewedRelationChangesForConcept(concept.id);
        conceptRows.push([
          concept.id,
          baseline.modulePlane.get(beforeModule) ?? "",
          beforeModule,
          before?.labels?.zh ?? "",
          before?.semantic_kind ?? "",
          before?.primary_parent_relation_id ?? "",
          baseline.depths.get(concept.id) ?? "",
          before ? (before.primary_parent_relation_id ? "" : "unreviewed-v2-root") : "",
          concept.labels.zh.replace(/[角色活动事件记录结果规则规范集合对象]/gu, ""),
          concept.semantic_kind,
          decision,
          document.module.plane_id,
          moduleId,
          concept.labels.zh,
          concept.semantic_kind,
          concept.primary_parent_relation_id ?? "",
          backboneByChild.get(concept.id) ?? "",
          reviewedDecision.convertToFieldOf ?? "",
          reviewedDecision.convertToAllowedValueOf ?? "",
          mergeIntoId,
          splitIntoIds.join("|"),
          reviewedRelationChanges.length > 0
            ? reviewedRelationChanges.join("|")
            : decision === "add"
            ? "new reviewed concept; no v2 record to migrate"
            : decision === "reparent" || decision === "move_owner"
              ? "owner/backbone updated in source"
              : replacementConceptIds.length > 0
                ? `deprecated references migrate to ${replacementConceptIds.join("|")}`
                : "reviewed without relation replacement",
          `${document.module.labels.zh}按 identity、semantic kind 和主问题唯一拥有该概念。`,
          sourceIds,
          concept.examples?.find((example) => example.kind === "positive")?.id ?? "",
          concept.examples?.find((example) => ["boundary", "counterexample"].includes(example.kind))?.id ?? "",
          `moonweave-${document.module.plane_id.replace("-plane", "")}-domain-reviewer`,
          "moonweave-ontology-structure-reviewer",
          "moonweave-trilingual-terminology-reviewer",
          "accepted",
        ]);
      }
    }
    writeCsv(path.join(ROOT, "research", "ontology-concept-semantic-depth-v3-ledger.csv"), conceptHeaders, conceptRows);
    const conceptLedgerRows = conceptRows.map((row) => Object.fromEntries(
      conceptHeaders.map((header, index) => [header, String(row[index] ?? "")]),
    ));

    const moduleHeaders = ["module_id", "label_zh", "key_notion", "primary_cq_ids", "owns_when", "references_when", "input_family_ids", "output_family_ids", "failure_family_ids", "recovery_family_ids", "overlap_module_ids", "overlap_concept_ids", "decision", "reviewer", "review_status"];
    const moduleRows = [...moduleDocuments.entries()].sort(([left], [right]) => left.localeCompare(right, "en")).map(([moduleId, { document }]) => {
      const module = document.module;
      const splitTarget = SPLITS.some((split) => split.to === moduleId);
      const facets = module.interaction_contract.facets;
      return [
        moduleId, module.labels.zh, module.key_notion.zh,
        module.competency_questions.map((question) => question.id).join("|"),
        module.owns_when.zh, module.references_when.zh,
        facets.input.family_concept_ids.join("|"), facets.output.family_concept_ids.join("|"), facets.failure.family_concept_ids.join("|"), facets.recovery.family_concept_ids.join("|"),
        [...new Set(module.overlap_checks.map((check) => check.other_module_id))].join("|"), [...new Set(module.overlap_checks.flatMap((check) => check.candidate_concept_ids))].join("|"),
        splitTarget ? "split" : "keep", "moonweave-ontology-structure-reviewer", "accepted",
      ];
    });
    writeCsv(path.join(ROOT, "research", "ontology-module-boundary-v3.csv"), moduleHeaders, moduleRows);

    const cqHeaders = ["semantic_key", "cq_id", "primary_owner_module_id", "related_module_ids", "question_zh", "reviewer", "review_status"];
    const cqRows = [...moduleDocuments.entries()].sort(([left], [right]) => left.localeCompare(right, "en")).flatMap(([moduleId, { document }]) => document.module.competency_questions.map((question) => [
      question.semantic_key, question.id, moduleId, question.related_module_ids.join("|"), question.questions.zh, "moonweave-ontology-structure-reviewer", "accepted",
    ]));
    writeCsv(path.join(ROOT, "research", "ontology-module-cq-v3.csv"), cqHeaders, cqRows);

    const concepts = [...allConcepts().values()];
    const sharedPrefixAudit = buildSharedPrefixAudit({
      concepts,
      modules: [...moduleDocuments.values()].map(({ document }) => document.module),
      relations: [...allRelations().values()],
      ledgerRows: conceptLedgerRows,
    });
    assertSharedPrefixAuditResolved(sharedPrefixAudit);
    const audit = {
      generated_from: "ontology/source/**/*.json",
      audit_version: "3.1.0",
      baseline: { concepts: baseline.concepts.size, relations: baseline.relationCount, roots: baseline.rootCount, max_depth: baseline.maxDepth },
      current: {
        modules: moduleDocuments.size,
        concepts: concepts.length,
        relations: allRelations().size,
        roots: concepts.filter((concept) => concept.status === "accepted" && concept.root_status !== null).length,
        max_depth: Math.max(...[...moduleDocuments.values()].flatMap(({ document }) => [...backboneDepths(document).values()])),
      },
      shared_prefix_audit: {
        discovery_contract: sharedPrefixAudit.discovery_contract,
        candidate_count: sharedPrefixAudit.candidate_count,
        decision_counts: sharedPrefixAudit.decision_counts,
        unresolved_count: sharedPrefixAudit.unresolved_count,
        candidates: sharedPrefixAudit.candidates,
      },
      lexical_families: sharedPrefixAudit.lexical_families,
    };
    stageFile(
      path.join(ROOT, "research", "generated", "ontology-semantic-depth-audit.json"),
      stableJson(audit),
    );
  };

  const writeCurrentCqLedger = () => {
    const headers = ["semantic_key", "cq_id", "primary_owner_module_id", "related_module_ids", "question_zh", "reviewer", "review_status"];
    const rows = [...moduleDocuments.entries()]
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .flatMap(([moduleId, { document }]) => document.module.competency_questions.map((question) => [
        question.semantic_key,
        question.id,
        moduleId,
        question.related_module_ids.join("|"),
        question.questions.zh,
        "moonweave-ontology-structure-reviewer",
        "accepted",
      ]));
    writeCsv(path.join(ROOT, "research", "ontology-module-cq-v3.csv"), headers, rows);
  };

  const appendRegistrySources = () => {
    const notePath = "research/source-notes/ontology-engineering/semantic-depth-module-boundary-and-graph-layout-2023-2026.md";
    const rows = [
      ["eng-ont-momo-2023", "engineering", "ontology", "Modular Ontology Modeling", "https://doi.org/10.3233/SW-222886", "2023", "journal-paper", "A", "known-primary", "Competency-question and key-notion driven ontology modules.", notePath],
      ["eng-ont-quality-2023", "engineering", "ontology", "A conceptual model for ontology quality assessment", "https://doi.org/10.3233/SW-233393", "2023", "journal-paper", "A", "known-primary", "Separates taxonomy, cohesion, coupling, and documentation quality.", notePath],
      ["eng-layout-elk-layered", "engineering", "visualization", "Eclipse Layout Kernel layered algorithm", "https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html", "2026", "official-docs", "A", "known-primary", "Directed layered layout, crossing minimization, and orthogonal routing.", notePath],
      ["eng-layout-elk-paper", "engineering", "visualization", "The Eclipse Layout Kernel", "https://arxiv.org/abs/2311.00533", "2023", "paper", "A", "known-primary", "Architecture and algorithms for model-driven graph layout.", notePath],
      ["eng-layout-elkjs", "engineering", "visualization", "elkjs", "https://github.com/kieler/elkjs", "2026", "repo", "A", "known-primary", "Browser and Web Worker distribution of ELK.", notePath],
      ["eng-layout-cytoscape-performance", "engineering", "visualization", "Cytoscape.js performance guidance", "https://js.cytoscape.org/#performance", "2026", "official-docs", "A", "known-primary", "Label and rendering performance guidance.", notePath],
      ["eng-layout-neo4j-bloom-scenes", "engineering", "visualization", "Neo4j Bloom scene interactions", "https://neo4j.com/docs/bloom-user-guide/current/bloom-visual-tour/bloom-scene-interactions/", "2026", "official-docs", "B", "known-primary", "Scoped expand, collapse, filter, and scene interactions.", notePath],
      ["eng-layout-graphviz-dot", "engineering", "visualization", "Graphviz dot", "https://graphviz.org/docs/layouts/dot/", "2026", "official-docs", "B", "known-primary", "Offline directed hierarchical layout reference.", notePath],
    ];
    const registryPath = path.join(ROOT, "research", "source-registry.csv");
    const existing = fs.readFileSync(registryPath, "utf8");
    const additions = rows.filter(([id]) => !existing.includes(`"${id}"`)).map((row) => row.map(csvCell).join(","));
    stageFile(
      registryPath,
      additions.length > 0
        ? `${existing}${existing.endsWith("\n") ? "" : "\n"}${additions.join("\n")}\n`
        : existing,
    );

    const livingPath = path.join(ROOT, "research", "living-source-metadata.csv");
    const living = fs.readFileSync(livingPath, "utf8");
    const livingRows = rows.filter(([, , , , url, , type]) => ["official-docs", "repo"].includes(type)).filter(([id]) => !living.includes(`"${id}"`)).map(([id, , area, title, url, , type, priority]) => [id, area, title, type, priority, url, type === "repo" ? "living-repo" : "living-docs", "checked 2026-07-14", REVIEW_DATE, "normalized", "Primary source reviewed for the v3 ontology and graph-layout contract."].map(csvCell).join(","));
    stageFile(
      livingPath,
      livingRows.length > 0
        ? `${living}${living.endsWith("\n") ? "" : "\n"}${livingRows.join("\n")}\n`
        : living,
    );

    const absoluteNote = path.join(ROOT, notePath);
    stageFile(absoluteNote, `# Agent Ontology 语义纵深、模块边界与图布局证据说明（2023–2026）\n\n## 结论\n\nMoonweave 保留八个稳定领域入口与一张 canonical 图，但模块由 competency question 和唯一 owner 划界，概念层级由真实分类或结构关系决定。默认图只投影 ownership 与经审查 backbone；关系探索再按方向、predicate 和数量加入 cross-link。\n\n## 内容工程依据\n\n- Modular Ontology Modeling（2023）：以用例、competency question、关键概念和模块关系组织可嵌套模块。\n- Ontology Quality Assessment（2023）：分别评估 taxonomy、cohesion、coupling 与 documentation；关系数量不能替代模块质量。\n- FIBO、Palantir、Microsoft Fabric Ontology 与 Skan AOW：支持稳定领域入口、共享语义层、typed relation 与节点内治理信息，但不要求固定层数或固定模块数。\n\n## 图布局依据\n\n- ELK Layered 负责 cycle breaking、layer assignment、crossing minimization、node placement 与 edge routing；elkjs 通过 Worker 将计算移出主线程。\n- Cytoscape.js 继续负责渲染和事件；标签按 LOD 与 focus 显示，不再让全边标签参与默认画面。\n- Neo4j Bloom 的场景经验用于受控展开、折叠与关系过滤；Graphviz dot 仅作离线对照。\n\n## 本轮设计推论\n\n1. key notion、owns_when、references_when、边界决定和重叠检查附着 Module；不另建页面。\n2. primary_parent_relation_id 仅表达严格 is_a；layout_role 附着原 Relation，不复制事实。\n3. 六组拆分采用唯一 owner；跨模块语义通过 canonical relation 引用。\n4. Schema、实例、来源、例子和案例仍是原节点或原关系的信息。\n5. 构建、canonical、站点与部署使用可验证指纹，不以人工截图宣称“已更新”。\n`);
  };

  const persistSources = () => {
    productDocument.document.contract_version = "2.0.0";
    stageFile(productDocument.filePath, stableJson(productDocument.document));
    for (const { filePath, document } of moduleDocuments.values()) {
      document.contract_version = "2.0.0";
      document.classes.sort((left, right) => left.id.localeCompare(right.id, "en"));
      document.relations.sort((left, right) => left.id.localeCompare(right.id, "en"));
      stageFile(filePath, stableJson(document));
    }
  };

  return Object.freeze({ updateProduct, csvCell, writeCsv, backboneDepths, writeLedgersAndAudit, writeCurrentCqLedger, appendRegistrySources, persistSources });
};
\n
