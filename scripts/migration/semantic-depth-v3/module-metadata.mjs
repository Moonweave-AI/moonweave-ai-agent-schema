import {
  buildBilateralSiblingDifferentia,
  buildBilateralSiblingEvidenceClaims,
} from "./sibling-differentia.mjs";

export const createModuleMetadataPhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction, moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts, locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor, fixCrossKindTaxonomy, RECLASSIFIED_CONCEPTS, normalizeReclassifiedConcepts, addExecutionBackbone, addDelegationSemanticBackbone, completeContextDiscoveryFlow, completePromptInstructionBackbone, repairNetworkSemantics, completeExecutionResultSemantics, completeOptimizationLearningLoop, completeEvaluationGoldenFlow, completeContextAssemblySemantics, completeRetrievalExecutionSemantics, repairEvaluationCompositionAndAgency, completeGovernedOptimizationApplication, completeMemoryPipelineSemantics, completeInstructionAndDisclosureProcessing, completeDelegationSelectionAndHandoff, completeInvocationAndRetrySemantics, completeMemoryOperationAndStorageSemantics, completeImprovementLoopCoordination, repairResidualAgencyAndCompositionSemantics, completePlannedOperationalGaps, completeTransportAndRecoveryGaps, completePolicyEffectAndProjectionGaps, migrateWorkerRole, repairFinalResidualAgencySemantics, repairSoftwareDefectCasePathForToolCallPlan } = context;

  const ensureReview = (object, planeId, subject) => {
    const names = typeof subject === "string" ? localized(subject, subject, subject) : subject;
    const note = localized(
      `${names.zh}已通过 v3 模块边界、semantic kind 与逻辑骨架复审。`,
      `${names.en} passed the v3 module-boundary, semantic-kind, and logical-backbone review.`,
      `${names.ja}は v3 のモジュール境界、semantic kind、論理バックボーン再審査を通過しました。`,
    );
    object.review = reviewFor(planeId, note);
  };

  const applyReviewedModuleDecision = (module) => {
    const keyConceptId = MODULE_CONFIG[module.id]?.[3];
    if (!keyConceptId) throw new Error(`Missing key notion configuration for ${module.id}`);
    const moduleConceptIds = new Set(
      [...allConcepts().values()]
        .filter(({ module_id: moduleId, status }) => moduleId === module.id && status === "accepted")
        .map(({ id }) => id),
    );
    const rootCount = ONTOLOGY_V3_ROOT_STATUS_DECISIONS.filter(
      ([conceptId, rootStatus]) => moduleConceptIds.has(conceptId) && rootStatus !== null,
    ).length;
    const backboneCount = ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS.filter(
      ([, role, , childId]) => role === "primary-backbone" && moduleConceptIds.has(childId),
    ).length;
    if (rootCount + backboneCount !== moduleConceptIds.size) {
      throw new Error(
        `${module.id} review facts do not cover its accepted concepts: roots=${rootCount}, ` +
        `backbone=${backboneCount}, concepts=${moduleConceptIds.size}`,
      );
    }
    const facetFacts = Object.entries(module.interaction_contract.facets).map(
      ([facetName, facet]) => `${facetName}{families=${facet.family_concept_ids.join("|")};` +
        `relations=${facet.relation_ids.join("|")}}`,
    );
    const questionIds = module.competency_questions.map(({ id }) => id);
    const overlapModuleIds = [...new Set(
      module.overlap_checks.map(({ other_module_id: otherModuleId }) => otherModuleId),
    )];
    const inputFamilies = module.interaction_contract.facets.input.family_concept_ids.join("|");
    const outputFamilies = module.interaction_contract.facets.output.family_concept_ids.join("|");
    const domainFacts = `owns_when="${module.owns_when.en}"; competency_questions=[${questionIds.join(",")}]; ` +
      facetFacts.join("; ");
    const ontologyFacts = `key_notion=${keyConceptId}; overlap_modules=[${overlapModuleIds.join(",")}]; ` +
      `interaction=${inputFamilies} -> ${outputFamilies}; roots=${rootCount}; backbone=${backboneCount}`;
    const schemaFacts = `zh="${module.labels.zh}"; en="${module.labels.en}"; ja="${module.labels.ja}"`;
    module.review = {
      review_status: "accepted",
      reviewers: [
        {
          reviewer_id: `moonweave-${module.plane_id.replace("-plane", "")}-domain-reviewer`,
          reviewer_role: "domain",
          reviewer_kind: "automated-agent",
          reviewed_on: REVIEW_DATE,
          decision_note: localized(
            `领域审查逐项核对 ${module.id} 的实际归属规则、主问题和输入/输出/失败/恢复事实：${domainFacts}；领域审查不决定骨架布局。`,
            `Domain review checked ${module.id}'s actual ownership rule, primary questions, and input/output/failure/recovery facts: ${domainFacts}; domain review does not decide backbone layout.`,
            `ドメイン審査は ${module.id} の実際の所有規則、主要質問、入力・出力・失敗・回復事実を項目別に確認しました：${domainFacts}。ドメイン審査はバックボーン配置を決定しません。`,
          ),
        },
        {
          reviewer_id: "moonweave-ontology-structure-reviewer",
          reviewer_role: "ontology",
          reviewer_kind: "automated-agent",
          reviewed_on: REVIEW_DATE,
          decision_note: localized(
            `本体审查逐项核对 ${module.id} 的关键概念、相邻边界、交互方向和显式根/骨架数量：${ontologyFacts}；本体审查不决定领域问题归属。`,
            `Ontology review checked ${module.id}'s actual key notion, overlap peers, interaction direction, and explicit root/backbone counts: ${ontologyFacts}; ontology review does not decide domain-question ownership.`,
            `本体審査は ${module.id} の実際の主要概念、重複相手、相互作用方向、明示ルート・バックボーン数を項目別に確認しました：${ontologyFacts}。本体審査はドメイン質問の所有を決定しません。`,
          ),
        },
        {
          reviewer_id: "moonweave-trilingual-terminology-reviewer",
          reviewer_role: "schema",
          reviewer_kind: "automated-agent",
          reviewed_on: REVIEW_DATE,
          decision_note: localized(
            `${module.id} 的三语名称按实际值逐项复核：${schemaFacts}；purpose、边界和 CQ 表达也已复核，语言审查不决定 owner 或 backbone。`,
            `${module.id}'s actual trilingual labels were checked exactly: ${schemaFacts}; purpose, boundary, and CQ wording were also reviewed, while language review does not decide owner or backbone.`,
            `${module.id} の実際の三言語ラベルを値どおりに確認しました：${schemaFacts}。purpose、境界、CQ 表現も審査し、言語審査は owner や backbone を決定しません。`,
          ),
        },
      ],
    };
  };

  const applyDirectionalDistinctFactRationales = () => {
    validateOntologyV3DirectionalDistinctFacts(
      ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS,
      allRelations(),
    );
    for (const [relationId, specification] of Object.entries(
      ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS,
    )) {
      let updated = false;
      for (const entry of moduleDocuments.values()) {
        entry.document.relations = entry.document.relations.map((relation) => {
          if (relation.id !== relationId) return relation;
          updated = true;
          return {
            ...relation,
            distinct_fact_rationale: structuredClone(specification.rationale),
          };
        });
      }
      if (!updated) throw new Error(`Missing reviewed directional fact ${relationId}`);
    }
  };

  const applyReviewedRepresentativeInverseReadings = () => {
    validateOntologyV3RepresentativeInverseReadings(
      ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS,
      ONTOLOGY_V3_INTERACTION_CONTRACTS,
      allRelations(),
    );
    const remaining = new Set(
      Object.keys(ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS),
    );
    for (const entry of moduleDocuments.values()) {
      entry.document.relations = entry.document.relations.map((relation) => {
        const reading = ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS[relation.id];
        if (!reading) return relation;
        remaining.delete(relation.id);
        return { ...relation, inverse_reading: structuredClone(reading) };
      });
    }
    if (remaining.size > 0) {
      throw new Error(`Missing representative inverse readings: ${[...remaining].join(", ")}`);
    }
  };

  const addModuleMetadata = () => {
    const concepts = allConcepts();
    const relations = allRelations();
    const moduleIds = [...moduleDocuments.keys()];
    const keyConceptIds = new Map(
      Object.entries(MODULE_CONFIG).map(([moduleId, config]) => [moduleId, config[3]]),
    );
    validateOntologyV3ModuleBoundaries(
      ONTOLOGY_V3_MODULE_BOUNDARIES,
      moduleIds,
    );
    validateOntologyV3InteractionContracts(
      ONTOLOGY_V3_INTERACTION_CONTRACTS,
      moduleIds,
      concepts,
      relations,
    );
    validateOntologyV3OverlapCandidates(
      ONTOLOGY_V3_OVERLAP_CANDIDATES,
      ONTOLOGY_V3_MODULE_BOUNDARIES,
      concepts,
      keyConceptIds,
      relations,
    );
    for (const [moduleId, entry] of moduleDocuments) {
      const { document } = entry;
      const module = document.module;
      const config = MODULE_CONFIG[moduleId];
      if (!config) throw new Error(`No v3 module configuration for ${moduleId}`);
      const boundarySpecification = ONTOLOGY_V3_MODULE_BOUNDARIES[moduleId];
      if (!boundarySpecification) {
        throw new Error(`No hand-authored v3 semantic boundary for ${moduleId}`);
      }
      const interactionSpecification = ONTOLOGY_V3_INTERACTION_CONTRACTS[moduleId];
      if (!interactionSpecification) {
        throw new Error(`No hand-authored v3 interaction contract for ${moduleId}`);
      }
      const [zh, en, ja, keyId] = config;
      const neighborId = boundarySpecification.boundary_decisions[0].other_module_id;
      const key = concepts.get(keyId);
      if (!key || key.module_id !== moduleId || key.status !== "accepted") {
        throw new Error(`Key notion ${keyId} is not an accepted concept owned by ${moduleId}`);
      }
      const neighborConfig = MODULE_CONFIG[neighborId];
      const sourceClaims = claimsFor(module, key);
      const boundaryReview = reviewFor(module.plane_id, localized(
        `${zh}与${neighborConfig[0]}按唯一 owner 和可判定问题分界。`,
        `${en} and ${neighborConfig[1]} are separated by unique ownership and answerable questions.`,
        `${ja}と${neighborConfig[2]}は一意の所有者と判定可能な問いで分離されます。`,
      ));

      module.labels = localized(zh, en, ja);
      module.definitions = localized(
        `${zh}是以${key.labels.zh}为关键概念的本体边界；${boundarySpecification.includes[0].zh} 其成员归属遵循：${boundarySpecification.owns_when.zh}`,
        `${en} is the ontology boundary anchored by the key notion ${key.labels.en}; ${boundarySpecification.includes[0].en} Membership follows: ${boundarySpecification.owns_when.en}`,
        `${ja}は${key.labels.ja}を主要概念とするオントロジー境界です。${boundarySpecification.includes[0].ja} 所属判定は次に従います：${boundarySpecification.owns_when.ja}`,
      );
      module.purpose = structuredClone(boundarySpecification.purpose);
      module.includes = structuredClone(boundarySpecification.includes);
      module.excludes = structuredClone(boundarySpecification.excludes);
      module.key_notion = structuredClone(key.labels);
      module.owns_when = structuredClone(boundarySpecification.owns_when);
      module.references_when = structuredClone(boundarySpecification.references_when);
      const claims = reviewedModuleEvidenceClaims({
        module,
        keyConcept: key,
        sourceClaims,
      });
      module.source_claims = structuredClone(claims);

      const relationsBetween = (leftModuleId, rightModuleId) =>
        [...relations.values()]
          .filter((relation) => {
            if (relation.status !== "accepted") return false;
            const sourceModuleId = concepts.get(relation.source_id)?.module_id;
            const targetModuleId = concepts.get(relation.target_id)?.module_id;
            return (
              (sourceModuleId === leftModuleId && targetModuleId === rightModuleId) ||
              (sourceModuleId === rightModuleId && targetModuleId === leftModuleId)
            );
          })
          .sort((left, right) => left.id.localeCompare(right.id, "en"));
      const groupConceptIdsByOwner = (conceptIds, evidencePath) => {
        const grouped = new Map();
        for (const conceptId of [...new Set(conceptIds)].sort((left, right) =>
          left.localeCompare(right, "en")
        )) {
          const concept = concepts.get(conceptId);
          if (!concept || concept.status !== "accepted") {
            throw new Error(`${evidencePath} cites missing or non-accepted concept ${conceptId}`);
          }
          grouped.set(concept.module_id, [
            ...(grouped.get(concept.module_id) ?? []),
            conceptId,
          ]);
        }
        return [...grouped.entries()].sort(([left], [right]) =>
          left.localeCompare(right, "en")
        );
      };
      const ownershipRationale = ({ base, ownerModuleId, subjectConceptIds }) => {
        const ownerLabels = MODULE_CONFIG[ownerModuleId];
        if (!ownerLabels) throw new Error(`Missing owner labels for ${ownerModuleId}`);
        const role = ownerModuleId === moduleId ? "owns" : "references";
        return localized(
          `${base.zh} 本条仅记录 ${subjectConceptIds.join("、")}；其 canonical owner 是${ownerLabels[0]}（${ownerModuleId}），因此 ${moduleId} 在此${role === "owns" ? "拥有" : "引用"}这些概念。`,
          `${base.en} This record is limited to ${subjectConceptIds.join(", ")}; their canonical owner is ${ownerLabels[1]} (${ownerModuleId}), so ${moduleId} ${role} these concepts here.`,
          `${base.ja} この記録は ${subjectConceptIds.join("、")} だけを対象とし、canonical owner は${ownerLabels[2]}（${ownerModuleId}）です。したがって ${moduleId} はここでこれらを${role === "owns" ? "所有" : "参照"}します。`,
        );
      };
      module.boundary_decisions = boundarySpecification.boundary_decisions.flatMap((decision) => {
        const citedRelations = relationsBetween(moduleId, decision.other_module_id);
        const citedEndpointIds = [...new Set(citedRelations.flatMap((relation) => [
          relation.source_id,
          relation.target_id,
        ]))];
        const comparisonCandidateIds = ONTOLOGY_V3_OVERLAP_CANDIDATES[
          `${moduleId}->${decision.other_module_id}`
        ];
        const overlapCheck = boundarySpecification.overlap_checks.find(
          ({ other_module_id: otherModuleId }) => otherModuleId === decision.other_module_id,
        );
        if (!overlapCheck) {
          throw new Error(`${moduleId}->${decision.other_module_id} has no overlap disambiguation`);
        }
        const subjectConceptIds = citedRelations.length > 0
          ? citedEndpointIds
          : comparisonCandidateIds;
        return groupConceptIdsByOwner(
          subjectConceptIds,
          `${moduleId}->${decision.other_module_id}.boundary_decision`,
        ).map(([ownerModuleId, ownerSubjectIds]) => {
          const ownerRelations = citedRelations.filter((relation) =>
            ownerSubjectIds.includes(relation.source_id) ||
            ownerSubjectIds.includes(relation.target_id)
          );
          const rationale = ownershipRationale({
            base: decision.rationale,
            ownerModuleId,
            subjectConceptIds: ownerSubjectIds,
          });
          const decisionRole = ownerModuleId === moduleId ? "owns" : "references";
          return {
            other_module_id: decision.other_module_id,
            subject_concept_ids: ownerSubjectIds,
            decision: decisionRole,
            owner_module_id: ownerModuleId,
            rationale,
            relation_ids: ownerRelations.map((relation) => relation.id),
            relation_not_applicable_reason: ownerRelations.length > 0 ? null : localized(
              `“${zh}”与“${MODULE_CONFIG[decision.other_module_id][0]}”之间没有适用于本 owner 概念组的已接受跨模块事实；该决策只比较明确列出的候选概念，不暗示运行时交互。`,
              `There is no accepted cross-module fact applicable to this owner-homogeneous concept group between ${en} and ${MODULE_CONFIG[decision.other_module_id][1]}; the decision compares only the named candidates without implying runtime interaction.`,
              `「${ja}」と「${MODULE_CONFIG[decision.other_module_id][2]}」の間には、この owner 単一概念群に適用できる承認済みモジュール間事実がありません。明示候補だけを比較し、実行時相互作用を示唆しません。`,
            ),
            source_claims: reviewedModuleEvidenceClaims({
              module,
              keyConcept: key,
              sourceClaims,
              peerModuleId: decision.other_module_id,
              disambiguationTest: overlapCheck.disambiguation_test,
              candidateConceptIds: ownerSubjectIds,
              ownerModuleId,
              result: decisionRole,
            }),
            review: reviewFor(module.plane_id, rationale),
          };
        });
      });
      module.overlap_checks = boundarySpecification.overlap_checks.flatMap((check) =>
        groupConceptIdsByOwner(
          ONTOLOGY_V3_OVERLAP_CANDIDATES[`${moduleId}->${check.other_module_id}`],
          `${moduleId}->${check.other_module_id}.overlap_check`,
        ).map(([ownerModuleId, candidateConceptIds]) => {
          const overlapReason = ownershipRationale({
            base: check.overlap_reason,
            ownerModuleId,
            subjectConceptIds: candidateConceptIds,
          });
          return {
            other_module_id: check.other_module_id,
            semantic_area: structuredClone(check.semantic_area),
            candidate_concept_ids: candidateConceptIds,
            overlap_reason: overlapReason,
            disambiguation_test: structuredClone(check.disambiguation_test),
            result: check.result,
            owner_module_id: ownerModuleId,
            source_claims: reviewedModuleEvidenceClaims({
              module,
              keyConcept: key,
              sourceClaims,
              peerModuleId: check.other_module_id,
              disambiguationTest: check.disambiguation_test,
              candidateConceptIds,
              ownerModuleId,
              result: check.result,
            }),
            review: reviewFor(module.plane_id, check.disambiguation_test),
          };
        })
      );

      const activeRelations = document.relations.filter((relation) => relation.status === "accepted");
      const facetLabels = {
        input: localized("输入", "input", "入力"),
        output: localized("输出", "output", "出力"),
        failure: localized("失败", "failure", "失敗"),
        recovery: localized("恢复", "recovery", "回復"),
      };
      const responsibilityBoundary = interactionSpecification.responsibility_boundary
        ?? boundarySpecification.references_when;
      const notApplicableReasons = {
        input: localized(
          `该本体不接收独立的运行输入。${responsibilityBoundary.zh}`,
          `This ontology does not receive an independent runtime input. ${responsibilityBoundary.en}`,
          `このオントロジーは独立した実行入力を受け取りません。${responsibilityBoundary.ja}`,
        ),
        output: localized(
          `该本体不产生独立的运行输出。${responsibilityBoundary.zh}`,
          `This ontology does not produce an independent runtime output. ${responsibilityBoundary.en}`,
          `このオントロジーは独立した実行出力を生成しません。${responsibilityBoundary.ja}`,
        ),
        failure: localized(
          `该本体不负责判定运行失败。${responsibilityBoundary.zh}`,
          `This ontology does not own runtime-failure adjudication. ${responsibilityBoundary.en}`,
          `このオントロジーは実行失敗の判定を所有しません。${responsibilityBoundary.ja}`,
        ),
        recovery: localized(
          `该本体不负责启动恢复流程。${responsibilityBoundary.zh}`,
          `This ontology does not initiate a recovery workflow. ${responsibilityBoundary.en}`,
          `このオントロジーは回復ワークフローを開始しません。${responsibilityBoundary.ja}`,
        ),
      };
      const interactionFacet = (facetName) => {
        const specification = interactionSpecification.facets[facetName];
        if (!specification.applicable) {
          return {
            applicable: false,
            description: null,
            family_concept_ids: [],
            relation_ids: [],
            not_applicable_reason: structuredClone(notApplicableReasons[facetName]),
          };
        }
        const selectedRelations = specification.relation_ids.map((relationId) => relations.get(relationId));
        const selectedConcepts = specification.family_concept_ids.map((conceptId) => concepts.get(conceptId));
        const factText = (language) => selectedRelations.map((relation) =>
          `${concepts.get(relation.source_id).labels[language]} —${relation.predicate}→ ${concepts.get(relation.target_id).labels[language]} (${relation.id})`,
        ).join(language === "en" ? "; " : "；");
        const familyText = (language) => selectedConcepts
          .map((concept) => concept.labels[language])
          .join(language === "en" ? ", " : "、");
        const sharedBridgeText = (language) => Object.values(
          specification.shared_relation_rationales ?? {},
        ).map((rationale) => rationale[language]).join(language === "en" ? " " : "");
        const sharedBridgeSuffix = {
          zh: sharedBridgeText("zh") ? ` 共享关系在本面的职责：${sharedBridgeText("zh")}` : "",
          en: sharedBridgeText("en") ? ` Facet-specific role of shared facts: ${sharedBridgeText("en")}` : "",
          ja: sharedBridgeText("ja") ? ` 共有関係のこの面での役割：${sharedBridgeText("ja")}` : "",
        };
        return {
          applicable: true,
          description: localized(
            `${zh}的${facetLabels[facetName].zh}概念族为${familyText("zh")}；责任交接由已接受事实 ${factText("zh")} 明确给出。${sharedBridgeSuffix.zh}`,
            `The ${facetLabels[facetName].en} families for ${en} are ${familyText("en")}; the accepted facts ${factText("en")} make the responsibility handoff explicit.${sharedBridgeSuffix.en}`,
            `${ja}の${facetLabels[facetName].ja}概念族は${familyText("ja")}です。責任の受け渡しは承認済み事実 ${factText("ja")} により明示されます。${sharedBridgeSuffix.ja}`,
          ),
          family_concept_ids: [...specification.family_concept_ids],
          relation_ids: [...specification.relation_ids],
          not_applicable_reason: null,
        };
      };
      module.interaction_contract = {
        applicability: interactionSpecification.applicability,
        facets: {
          input: interactionFacet("input"),
          output: interactionFacet("output"),
          failure: interactionFacet("failure"),
          recovery: interactionFacet("recovery"),
        },
        review: boundaryReview,
      };
      module.taxonomy_contract = {
        applicability: activeRelations.some((relation) => relation.predicate !== "is_a") ? "mixed-backbone" : "specialization",
        not_applicable_reason: null,
        hierarchy_policy: "arbitrary-depth-reviewed-backbone",
        key_root_concept_ids: [key.id],
        allowed_backbone_predicates: [...new Set(["is_a", ...activeRelations.map((relation) => relation.predicate)])],
        flat_root_exception_concept_ids: [],
        review: boundaryReview,
      };
      const cqEvidence = boundarySpecification.competency_questions.map((question, questionIndex) => {
        const questionId = `${moduleId}-cq-${question.semantic_key.slice(moduleId.length + 1).replaceAll(".", "-")}-v3`;
        const relatedModuleIds = [...question.related_module_ids];
        const questionClaims = sourceClaims.map((claim) => ({
          ...claim,
          supports: `Source ${claim.source_id} at ${claim.locator} supports operational notions used by ` +
            `Moonweave CQ ${questionId} (${question.semantic_key}), owned by ${moduleId} and compared with ` +
            `${relatedModuleIds.join(", ")}. The source does not define Moonweave CQ ${questionId}, its query, ` +
            `assertion, owner, or evidence binding. The query "${question.query}" and expected assertion ` +
            `"${question.expected_assertion}" are a Moonweave design inference over the registered evidence.`,
          review_status: "accepted",
        }));
        const crossRelationsByModule = relatedModuleIds.map((relatedModuleId) =>
          relationsBetween(moduleId, relatedModuleId).filter((relation) => relation.predicate !== "is_a"),
        );
        const relationBacked = relatedModuleIds.length > 0
          && crossRelationsByModule.every((candidateRelations) => candidateRelations.length > 0);
        const selectedRelations = relationBacked
          ? crossRelationsByModule.map((candidateRelations) =>
            candidateRelations[questionIndex % candidateRelations.length],
          )
          : [];
        const comparisonCandidateIds = relatedModuleIds.flatMap((relatedModuleId) =>
          ONTOLOGY_V3_OVERLAP_CANDIDATES[`${moduleId}->${relatedModuleId}`],
        );
        const evidenceNodeIds = relationBacked
          ? [...new Set(selectedRelations.flatMap((relation) => [relation.source_id, relation.target_id]))]
          : [...new Set(comparisonCandidateIds)];
        const ownerConceptIds = evidenceNodeIds.filter(
          (conceptId) => concepts.get(conceptId)?.module_id === moduleId,
        );
        const relatedConceptIds = evidenceNodeIds.filter((conceptId) =>
          relatedModuleIds.includes(concepts.get(conceptId)?.module_id),
        );
        const notApplicableReason = relationBacked ? null : localized(
          `问题“${question.questions.zh}”使用相关本体作边界对照，但 canonical 图中没有可支持该问法的已接受非分类跨模块关系；因此例证并列双方候选概念，不声称运行时传递。`,
          `The question “${question.questions.en}” uses the related ontology as a boundary comparison, but the canonical graph has no accepted non-taxonomic cross-module relation supporting that reading; the examples therefore juxtapose both candidate families without claiming a runtime handoff.`,
          `質問「${question.questions.ja}」は関連オントロジーを境界対照として使いますが、その読みに根拠を与える承認済みの非分類モジュール間関係は canonical グラフにありません。そのため例証は双方の候補概念を並置し、実行時の受け渡しを主張しません。`,
        );
        const relationText = (language) => selectedRelations.map((relation) =>
          `${concepts.get(relation.source_id).labels[language]} —${relation.predicate}→ ${concepts.get(relation.target_id).labels[language]} (${relation.id})`,
        ).join(language === "en" ? "; " : "；");
        const comparisonText = (language) => evidenceNodeIds
          .map((conceptId) => concepts.get(conceptId).labels[language])
          .join(language === "en" ? ", " : "、");
        const positiveExampleId = `${questionId}-example-positive`;
        const counterexampleId = `${questionId}-example-counter`;
        const examples = [
          {
            id: positiveExampleId,
            kind: "positive",
            labels: localized(`${question.questions.zh}：正例`, `${question.questions.en}: positive case`, `${question.questions.ja}：正例`),
            scenario_id: null,
            descriptions: relationBacked ? localized(
              `该问的正例同时触及 owner 与相关本体，并保持真实关系方向：${relationText("zh")}。`,
              `The positive case touches both the owner and related ontology while preserving the actual relation direction: ${relationText("en")}.`,
              `正例は owner と関連オントロジーの双方に触れ、実在する関係方向を保持します：${relationText("ja")}。`,
            ) : localized(
              `该问的正例以 ${comparisonText("zh")} 作边界比较；${notApplicableReason.zh}`,
              `The positive case compares ${comparisonText("en")} at the ownership boundary. ${notApplicableReason.en}`,
              `正例は ${comparisonText("ja")} を所有境界で比較します。${notApplicableReason.ja}`,
            ),
            field_values: {},
            related_node_ids: evidenceNodeIds,
            related_relation_ids: selectedRelations.map((relation) => relation.id),
            expected_result: localized(
              `查询应满足：${question.expected_assertion}`,
              `The query must satisfy: ${question.expected_assertion}`,
              `照会は次を満たす必要があります：${question.expected_assertion}`,
            ),
            why_valid_or_invalid: localized(
              "正例使用逐问独立的证据 ID，并保留 owner、相关本体和关系适用性的显式记录。",
              "The positive case has question-specific evidence IDs and explicitly records the owner, related ontology, and relation applicability.",
              "正例は質問固有の証拠 ID を持ち、owner、関連オントロジー、関係適用性を明示的に記録します。",
            ),
            synthetic: true,
            verified_version: VERSION_IRI,
            source_claims: structuredClone(questionClaims),
          },
          {
            id: counterexampleId,
            kind: "counterexample",
            labels: localized(`${question.questions.zh}：反例`, `${question.questions.en}: counterexample`, `${question.questions.ja}：反例`),
            scenario_id: null,
            descriptions: localized(
              `反例仍列出同一 owner 与相关本体端点，但拒绝仅凭名称相似、相邻出现或反向读取关系来满足“${question.questions.zh}”。`,
              `The counterexample still names the same owner and related-ontology endpoints, but rejects satisfying “${question.questions.en}” through name similarity, adjacency, or a reversed relation.`,
              `反例も同じ owner と関連オントロジー端点を示しますが、名称類似、隣接、関係の逆読みによって「${question.questions.ja}」を満たすことを拒否します。`,
            ),
            field_values: {},
            related_node_ids: evidenceNodeIds,
            related_relation_ids: selectedRelations.map((relation) => relation.id),
            expected_result: localized(
              "查询不得返回越权 owner、颠倒关系方向或缺少显式 N/A 判定的候选。",
              "The query must reject a candidate with the wrong owner, reversed relation direction, or a missing explicit N/A decision.",
              "照会は、owner の越境、関係方向の逆転、または明示的 N/A 判断の欠落がある候補を拒否しなければなりません。",
            ),
            why_valid_or_invalid: localized(
              "反例与正例拥有不同 ID，并以同一组真实节点说明哪些推断不被关系和 owner 规则支持。",
              "The counterexample has a distinct ID and uses the same real nodes to show which inference is unsupported by relation and ownership rules.",
              "反例は正例と異なる ID を持ち、同じ実在ノードにより関係規則と所有規則が支持しない推論を示します。",
            ),
            synthetic: true,
            verified_version: VERSION_IRI,
            source_claims: structuredClone(questionClaims),
          },
        ];
        return {
          question: {
            id: questionId,
            semantic_key: question.semantic_key,
            primary_owner_module_id: moduleId,
            related_module_ids: relatedModuleIds,
            questions: structuredClone(question.questions),
            query: question.query,
            expected_assertion: question.expected_assertion,
            evidence_binding: {
              applicability: relationBacked ? "relation-backed" : relatedModuleIds.length > 0
                ? "boundary-comparison-only"
                : "owner-only",
              owner_concept_ids: ownerConceptIds,
              related_concept_ids: relatedConceptIds,
              relation_ids: selectedRelations.map((relation) => relation.id),
              not_applicable_reason: notApplicableReason,
            },
            positive_example_ids: [positiveExampleId],
            counterexample_ids: [counterexampleId],
            source_claims: structuredClone(questionClaims),
            review: boundaryReview,
          },
          examples,
        };
      });
      module.examples = cqEvidence.flatMap(({ examples }) => examples);
      module.competency_questions = cqEvidence.map(({ question }) => question);
      applyReviewedModuleDecision(module);
      module.change_note = localized(`${zh}在 v3 中完成命名、owner、交互合同、CQ 与任意深度骨架复审。`, `${en} completed its v3 naming, ownership, interaction-contract, CQ, and arbitrary-depth-backbone review.`, `${ja}は v3 で名称、所有権、相互作用契約、CQ、任意深度バックボーンの再審査を完了しました。`);
    }
  };

  const assignLogicalBackbone = () => {
    const concepts = allConcepts();
    const relations = allRelations();
    validateOntologyV3BackboneDecisions({ concepts, relations });

    const relationDecisionById = new Map(
      ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS.map(
        ([relationId, role, parentId, childId]) => [
          relationId,
          { role, parentId, childId },
        ],
      ),
    );
    for (const relation of relations.values()) {
      const decision = relation.status === "accepted"
        ? relationDecisionById.get(relation.id)
        : null;
      relation.layout_role = decision?.role ?? "cross-link";
      relation.layout_parent_id = decision?.parentId ?? null;
      relation.layout_child_id = decision?.childId ?? null;
    }

    const rootStatusByConceptId = new Map(ONTOLOGY_V3_ROOT_STATUS_DECISIONS);
    for (const concept of concepts.values()) {
      concept.lexical_aliases ??= [];
      concept.sibling_differentiation ??= [];
      if (concept.status !== "accepted") {
        concept.root_status ??= "composition-root";
        continue;
      }
      if (!rootStatusByConceptId.has(concept.id)) {
        throw new Error(`Missing explicit root-status decision for ${concept.id}`);
      }
      concept.root_status = rootStatusByConceptId.get(concept.id);
      const note = localized(
        `${concept.labels.zh}已按显式配置复核 semantic kind、owner、根状态与布局父关系。`,
        `${concept.labels.en} was reviewed against the explicit semantic-kind, ownership, root-status, and layout-parent decisions.`,
        `${concept.labels.ja}は明示設定に基づき semantic kind、所有者、ルート状態、レイアウト親を再審査しました。`,
      );
      concept.review = reviewFor(
        moduleDocuments.get(concept.module_id).document.module.plane_id,
        note,
      );
      concept.change_note = note;
    }

    for (const [moduleId, { document }] of moduleDocuments) {
      const activeIds = new Set(
        document.classes
          .filter(({ status }) => status === "accepted")
          .map(({ id }) => id),
      );
      const moduleDecisions = ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS
        .filter(([, , , childId]) => activeIds.has(childId));
      document.module.taxonomy_contract.key_root_concept_ids = [MODULE_CONFIG[moduleId][3]];
      document.module.taxonomy_contract.allowed_backbone_predicates = [
        ...new Set(
          moduleDecisions.map(([relationId]) => relations.get(relationId).predicate),
        ),
      ].sort((left, right) => left.localeCompare(right, "en"));
      document.module.taxonomy_contract.flat_root_exception_concept_ids =
        document.classes
          .filter(
            (concept) =>
              concept.status === "accepted" &&
              concept.root_status === "composition-root",
          )
          .map(({ id }) => id)
          .sort((left, right) => left.localeCompare(right, "en"));

      for (const relation of document.relations) {
        ensureReview(relation, document.module.plane_id, relation.labels);
        relation.change_note = localized(
          "v3 依据显式关系决策确认 canonical 方向与默认逻辑骨架职责。",
          "v3 confirmed canonical direction and default logical-backbone responsibility from explicit relation decisions.",
          "v3 は明示的な関係判断に基づき canonical 方向と既定論理バックボーン責務を確認しました。",
        );
      }
    }
  };

  const completeSiblingDifferentiation = () => {
    const concepts = allConcepts();
    const relations = allRelations();
    const explicitComparisonByConcept = new Map(
      ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS.map(
        ([conceptId, siblingId, parentId]) => [conceptId, { siblingId, parentId }],
      ),
    );
    const acceptedClassificationByParent = new Map();
    for (const relation of relations.values()) {
      if (relation.status !== "accepted" || relation.predicate !== "is_a") continue;
      const child = concepts.get(relation.source_id);
      const parent = concepts.get(relation.target_id);
      if (
        child?.status !== "accepted" ||
        parent?.status !== "accepted" ||
        child.semantic_kind !== parent.semantic_kind
      ) continue;
      const current = acceptedClassificationByParent.get(parent.id) ?? [];
      acceptedClassificationByParent.set(parent.id, [...current, relation]);
    }

    const classificationRelation = (childId, parentId) =>
      [...(acceptedClassificationByParent.get(parentId) ?? [])]
        .filter(({ source_id: sourceId }) => sourceId === childId)
        .sort((left, right) => {
          const primaryId = concepts.get(childId)?.primary_parent_relation_id;
          const leftPrimary = left.id === primaryId ? 0 : 1;
          const rightPrimary = right.id === primaryId ? 0 : 1;
          return leftPrimary - rightPrimary || left.id.localeCompare(right.id, "en");
        })[0] ?? null;

    for (const concept of concepts.values()) {
      if (concept.status === "accepted") concept.sibling_differentiation = [];
    }

    for (const concept of [...concepts.values()].sort((left, right) => left.id.localeCompare(right.id, "en"))) {
      if (concept.status !== "accepted") continue;
      const explicit = explicitComparisonByConcept.get(concept.id);
      const taxonomyOptions = [...acceptedClassificationByParent.entries()]
        .flatMap(([parentId, parentRelations]) => {
          const conceptRelation = classificationRelation(concept.id, parentId);
          if (conceptRelation === null) return [];
          return [...new Set(parentRelations.map(({ source_id: sourceId }) => sourceId))]
            .filter((candidateId) => candidateId !== concept.id)
            .filter((candidateId) => concepts.get(candidateId)?.semantic_kind === concept.semantic_kind)
            .map((siblingId) => ({
              siblingId,
              parentId,
              conceptBackboneRelationId: conceptRelation.id,
              siblingBackboneRelationId: classificationRelation(siblingId, parentId)?.id,
            }));
        })
        .sort((left, right) => {
          const leftExplicit = left.siblingId === explicit?.siblingId && left.parentId === explicit?.parentId ? 0 : 1;
          const rightExplicit = right.siblingId === explicit?.siblingId && right.parentId === explicit?.parentId ? 0 : 1;
          const leftPrimary = left.conceptBackboneRelationId === concept.primary_parent_relation_id ? 0 : 1;
          const rightPrimary = right.conceptBackboneRelationId === concept.primary_parent_relation_id ? 0 : 1;
          const leftLocal = concepts.get(left.siblingId)?.module_id === concept.module_id ? 0 : 1;
          const rightLocal = concepts.get(right.siblingId)?.module_id === concept.module_id ? 0 : 1;
          return leftExplicit - rightExplicit ||
            leftPrimary - rightPrimary ||
            leftLocal - rightLocal ||
            left.parentId.localeCompare(right.parentId, "en") ||
            left.siblingId.localeCompare(right.siblingId, "en");
        });
      const selected = taxonomyOptions[0];
      if (!selected) continue;
      const { siblingId, parentId, conceptBackboneRelationId, siblingBackboneRelationId } = selected;

      const sibling = concepts.get(siblingId);
      const parent = concepts.get(parentId);
      if (
        sibling?.status !== "accepted" ||
        parent?.status !== "accepted" ||
        concept.semantic_kind !== sibling.semantic_kind ||
        !conceptBackboneRelationId ||
        !siblingBackboneRelationId ||
        classificationRelation(concept.id, parentId)?.id !== conceptBackboneRelationId ||
        classificationRelation(siblingId, parentId)?.id !== siblingBackboneRelationId
      ) {
        throw new Error(`Invalid sibling comparison ${concept.id} -> ${siblingId} under ${parentId}`);
      }
      concept.sibling_differentiation = [{
        sibling_concept_id: siblingId,
        shared_parent_concept_id: parentId,
        differentia: buildBilateralSiblingDifferentia({
          concept,
          sibling,
          parent,
          conceptBackboneRelationId,
          siblingBackboneRelationId,
        }),
        source_claims: buildBilateralSiblingEvidenceClaims({ concept, sibling }),
      }];
    }
  };

  return Object.freeze({ ensureReview, applyReviewedModuleDecision, applyDirectionalDistinctFactRationales, applyReviewedRepresentativeInverseReadings, addModuleMetadata, assignLogicalBackbone, completeSiblingDifferentiation });
};
\n
