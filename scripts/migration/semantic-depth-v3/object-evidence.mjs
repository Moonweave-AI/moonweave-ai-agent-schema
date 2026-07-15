export const createObjectEvidencePhases = (context) => {
  const { fs, path, ROOT, SOURCE_ROOT, REVIEW_DATE, VERSION_IRI, pendingWrites, stageFile, localized, MODULE_CONFIG, SPLITS, PLANE_BOUNDARIES, moduleDocuments, productDocument, allConcepts, allRelations, reviewFor, claimsFor, reviewedModuleEvidenceClaims, shortDefinition, conceptExamples, makeConcept, relationExamples, makeRelation, ONTOLOGY_V3_MODULE_BOUNDARIES, validateOntologyV3ModuleBoundaries, ONTOLOGY_V3_INTERACTION_CONTRACTS, validateOntologyV3InteractionContracts, ONTOLOGY_V3_OVERLAP_CANDIDATES, validateOntologyV3OverlapCandidates, ONTOLOGY_V3_DIRECTIONAL_DISTINCT_FACTS, validateOntologyV3DirectionalDistinctFacts, ONTOLOGY_V3_REPRESENTATIVE_INVERSE_READINGS, validateOntologyV3RepresentativeInverseReadings, ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS, ONTOLOGY_V3_ROOT_STATUS_DECISIONS, ONTOLOGY_V3_SIBLING_COMPARISON_DECISIONS, validateOntologyV3BackboneDecisions, buildEffectiveConceptStructures, stableJson, reviewedConceptHistoryDecision, assertObjectEvidenceQuality, objectClaimKey, rewriteConceptDirectClaims, rewriteGenericConceptExamples, rewriteObjectEvidenceTree, rewriteObjectReview, rewriteRelationDirectClaims, writeFileTransaction, moveSplitModules, moveOwnedConcepts, mergeActorAuthorityScope, applyOwnerAndIdentityCorrections, replaceStrings, normalizeTerminology, repairSourceAttachmentEvidence, completeCrossDomainBoundaryContexts, locateRelationOwner, REVIEWED_REPLACEMENT_RELATION_DEFINITIONS, replaceRelation, applyReviewedReplacementRelationDefinitions, addConceptTo, addRelationTo, upsertReviewedConcept, updateReviewedConcept, deprecateConcept, upsertReviewedRelation, deprecateRelation, synchronizeAcceptedConceptExamples, removeDeprecatedRelationNarratives, synchronizeAcceptedRelationExampleOwnership, addReviewedAnchor, fixCrossKindTaxonomy, RECLASSIFIED_CONCEPTS, normalizeReclassifiedConcepts, addExecutionBackbone, addDelegationSemanticBackbone, completeContextDiscoveryFlow, completePromptInstructionBackbone, repairNetworkSemantics, completeExecutionResultSemantics, completeOptimizationLearningLoop, completeEvaluationGoldenFlow, completeContextAssemblySemantics, completeRetrievalExecutionSemantics, repairEvaluationCompositionAndAgency, completeGovernedOptimizationApplication, completeMemoryPipelineSemantics, completeInstructionAndDisclosureProcessing, completeDelegationSelectionAndHandoff, completeInvocationAndRetrySemantics, completeMemoryOperationAndStorageSemantics, completeImprovementLoopCoordination, repairResidualAgencyAndCompositionSemantics, completePlannedOperationalGaps, completeTransportAndRecoveryGaps, completePolicyEffectAndProjectionGaps, migrateWorkerRole, repairFinalResidualAgencySemantics, repairSoftwareDefectCasePathForToolCallPlan, ensureReview, applyReviewedModuleDecision, applyDirectionalDistinctFactRationales, applyReviewedRepresentativeInverseReadings, addModuleMetadata, assignLogicalBackbone, completeSiblingDifferentiation } = context;

  const operationalNotionsForConcept = (concept) => new Map(
    concept.source_claims.map((claim) => [
      objectClaimKey(claim),
      `Operationally, ${concept.short_definitions.en}`,
    ]),
  );

  const operationalNotionsForRelation = (relation) => new Map(
    relation.source_claims.map((claim) => [
      objectClaimKey(claim),
      `Operationally, ${relation.definitions.en}`,
    ]),
  );

  const rewriteAcceptedObjectEvidence = () => {
    const initialConcepts = allConcepts();
    const initialRelations = [...allRelations().values()];
    const primaryBackboneRelationIdByChild = new Map(
      ONTOLOGY_V3_BACKBONE_RELATION_DECISIONS
        .filter(([, role]) => role === "primary-backbone")
        .map(([relationId, , , childId]) => [childId, relationId]),
    );
    for (const { document } of moduleDocuments.values()) {
      document.classes = document.classes.map((concept) => {
        if (concept.status !== "accepted") return concept;
        const primaryBackboneRelationId = primaryBackboneRelationIdByChild.get(concept.id) ?? null;
        const backbone = primaryBackboneRelationId ?? `root_status=${concept.root_status}`;
        const ontologyInvariants = localized(
          `semantic kind=${concept.semantic_kind}；backbone=${backbone}；canonical ID 与唯一 owner 保持稳定`,
          `semantic kind=${concept.semantic_kind}; backbone=${backbone}; canonical ID and unique owner remain stable`,
          `semantic kind=${concept.semantic_kind}、backbone=${backbone}、canonical ID と一意の owner を維持`,
        );
        const claimed = rewriteConceptDirectClaims({
          concept,
          module: document.module,
          operationalNotions: operationalNotionsForConcept(concept),
          primaryBackboneRelationId,
        });
        const reviewed = rewriteObjectReview({
          record: claimed,
          module: document.module,
          reviewedOn: REVIEW_DATE,
          useCase: document.module.owns_when,
          ontologyInvariants,
          languageReviewerId: "moonweave-trilingual-terminology-reviewer",
          primaryBackboneRelationId,
        });
        const examples = rewriteGenericConceptExamples({
          concept: reviewed,
          relations: initialRelations,
          conceptById: initialConcepts,
        });
        return rewriteObjectEvidenceTree({ record: examples });
      });
    }

    const rewrittenConcepts = allConcepts();
    for (const { document } of moduleDocuments.values()) {
      document.relations = document.relations.map((relation) => {
        if (relation.status !== "accepted") return relation;
        const sourceConcept = rewrittenConcepts.get(relation.source_id);
        const targetConcept = rewrittenConcepts.get(relation.target_id);
        if (!sourceConcept || !targetConcept) {
          throw new Error(`Cannot rewrite evidence for unresolved relation ${relation.id}`);
        }
        const ontologyInvariants = localized(
          `canonical 方向 ${relation.source_id}→${relation.target_id}、predicate=${relation.predicate}、relation kind=${relation.relation_kind}、layout role=${relation.layout_role}`,
          `canonical direction ${relation.source_id}->${relation.target_id}, predicate=${relation.predicate}, relation kind=${relation.relation_kind}, layout role=${relation.layout_role}`,
          `canonical 方向 ${relation.source_id}→${relation.target_id}、predicate=${relation.predicate}、relation kind=${relation.relation_kind}、layout role=${relation.layout_role}`,
        );
        const claimed = rewriteRelationDirectClaims({
          relation,
          sourceConcept,
          targetConcept,
          module: document.module,
          operationalNotions: operationalNotionsForRelation(relation),
        });
        const reviewed = rewriteObjectReview({
          record: claimed,
          module: document.module,
          reviewedOn: REVIEW_DATE,
          useCase: document.module.owns_when,
          ontologyInvariants,
          languageReviewerId: "moonweave-trilingual-terminology-reviewer",
        });
        return rewriteObjectEvidenceTree({ record: reviewed });
      });
    }

    return assertObjectEvidenceQuality({
      classes: [...allConcepts().values()],
      relations: [...allRelations().values()],
    });
  };

  return Object.freeze({ operationalNotionsForConcept, operationalNotionsForRelation, rewriteAcceptedObjectEvidence });
};
