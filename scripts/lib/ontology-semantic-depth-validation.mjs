import {
  ontologyValidationErrorCodes,
  validationError,
} from "./ontology-validation-error.mjs";
import {
  acceptedConceptDisplayLabelViolations,
  conceptGenusDifferentiaViolations,
} from "./ontology-concept-genus-differentia.mjs";
import { buildOntologyParentIndexes } from "./ontology-shared-prefix-audit.mjs";

const ontologyLanguages = Object.freeze(["zh", "en", "ja"]);
const moduleTemplatePatterns = Object.freeze([
  /本模块在“?.+”?边界内/u,
  /代表闭包/u,
  /把概念层级、语义关系和节点内信息组织成/u,
  /本模块直接拥有\s*\d+\s*个概念/u,
  /兄弟模块拥有的概念，以及与主图并行的/u,
  /Within the .+ Module boundary/iu,
  /representative closure fact/iu,
  /directly owned Concepts and .+ source-owned relations/iu,
  /Concepts owned by sibling Modules and any schema, instance, or case shadow graph/iu,
  /没有已接受的\s+(?:input|output|failure|recovery)\s+关系；该面明确不适用/u,
  /has no accepted\s+(?:input|output|failure|recovery)\s+relation, so the facet is explicitly not applicable/iu,
  /承認済みの\s*(?:input|output|failure|recovery)\s*関係がなく、この面は明示的に非適用/u,
]);
const moduleLabelSuffixes = Object.freeze({
  zh: /模块\s*$/u,
  en: /\bModule\s*$/iu,
  ja: /モジュール\s*$/u,
});

const normalizeSemanticText = (value) => value.normalize("NFKC").trim().toLocaleLowerCase();

const localizedTextValues = (value) =>
  value && typeof value === "object"
    ? ontologyLanguages.flatMap((language) =>
        typeof value[language] === "string" ? [value[language]] : [],
      )
    : [];

const moduleTemplateTextViolations = (modules) =>
  modules.flatMap((module) => {
    const values = [
      ...localizedTextValues(module.purpose),
      ...(module.includes ?? []).flatMap(localizedTextValues),
      ...(module.excludes ?? []).flatMap(localizedTextValues),
      ...Object.values(module.interaction_contract?.facets ?? {}).flatMap((facet) => [
        ...localizedTextValues(facet.description),
        ...localizedTextValues(facet.not_applicable_reason),
      ]),
    ];
    return values.flatMap((value) =>
      moduleTemplatePatterns.some((pattern) => pattern.test(value))
        ? [{ moduleId: module.id, value }]
        : [],
    );
  });

const moduleLabelSuffixViolations = (modules) =>
  modules.flatMap((module) =>
    ontologyLanguages.flatMap((language) => {
      const label = module.labels?.[language];
      return typeof label === "string" && moduleLabelSuffixes[language].test(label)
        ? [{ moduleId: module.id, language, label }]
        : [];
    }),
  );

const incrementCount = (counts, key) => ({
  ...counts,
  [key]: (counts[key] ?? 0) + 1,
});

const primaryBackboneRelations = (relations) =>
  relations.filter(
    ({ layout_role: layoutRole, status }) =>
      layoutRole === "primary-backbone" && status !== "deprecated",
  );

const primaryBackboneCycle = (conceptIds, relations) =>
  findHierarchyCycle(
    conceptIds,
    primaryBackboneRelations(relations).map((relation) => ({
      id: relation.id,
      source_id: relation.layout_child_id,
      target_id: relation.layout_parent_id,
    })),
  );

const conceptDepths = (classes, relations) => {
  const parentByChild = new Map(
    primaryBackboneRelations(relations).map((relation) => [
      relation.layout_child_id,
      relation.layout_parent_id,
    ]),
  );
  const activeConceptIds = new Set(
    classes.filter(({ status }) => status !== "deprecated").map(({ id }) => id),
  );
  const memo = new Map();
  const visiting = new Set();
  const depthFor = (conceptId) => {
    if (memo.has(conceptId)) return memo.get(conceptId);
    if (visiting.has(conceptId)) return 0;
    visiting.add(conceptId);
    const parentId = parentByChild.get(conceptId);
    const depth = parentId && activeConceptIds.has(parentId) ? depthFor(parentId) + 1 : 0;
    visiting.delete(conceptId);
    memo.set(conceptId, depth);
    return depth;
  };
  for (const conceptId of activeConceptIds) depthFor(conceptId);
  return memo;
};

export const findHierarchyCycle = (conceptIds, hierarchyRelations) => {
  const parentsByChild = new Map([...conceptIds].map((id) => [id, []]));
  for (const relation of hierarchyRelations) {
    parentsByChild.get(relation.source_id)?.push({
      parentId: relation.target_id,
      relationId: relation.id,
    });
  }
  const visiting = new Set();
  const visited = new Set();
  const nodePath = [];
  const relationPath = [];

  const visit = (id) => {
    if (visiting.has(id)) {
      const start = nodePath.indexOf(id);
      return {
        nodes: [...nodePath.slice(start), id],
        relations: relationPath.slice(start),
      };
    }
    if (visited.has(id)) return null;
    visiting.add(id);
    nodePath.push(id);
    for (const edge of parentsByChild.get(id) ?? []) {
      relationPath.push(edge.relationId);
      const cycle = visit(edge.parentId);
      if (cycle) return cycle;
      relationPath.pop();
    }
    nodePath.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const id of conceptIds) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }
  return null;
};

export const validateSemanticDepthContracts = ({
  modules,
  classes,
  relations,
  moduleIds,
  conceptIds,
  moduleById,
  conceptById,
  relationById,
  sourceFileByModule,
  sourceLocationByConcept,
  sourceLocationByRelation,
  releaseChannel,
}) => {
  const sourceLabel = (moduleId) =>
    sourceFileByModule.get(moduleId)?.relativePath ?? `module:${moduleId}`;
  const conceptLocation = (conceptId) =>
    sourceLocationByConcept.get(conceptId) ?? `concept:${conceptId}`;
  const relationLocation = (relationId) =>
    sourceLocationByRelation.get(relationId) ?? `relation:${relationId}`;
  const acceptedModules = modules.filter(({ status }) => status === "accepted");
  const acceptedConcepts = classes.filter(({ status }) => status === "accepted");
  const acceptedRelations = relations.filter(({ status }) => status === "accepted");

  const displayLabelViolations = acceptedConceptDisplayLabelViolations(acceptedConcepts);
  if (displayLabelViolations.length > 0) {
    const violation = displayLabelViolations[0];
    throw validationError(
      ontologyValidationErrorCodes.conceptDisplayLabelDuplicate,
      `Accepted Concepts ${violation.conceptIds.join(", ")} repeat normalized ${violation.language} display label "${violation.normalizedLabel}"; use distinct natural labels or an explicit reviewed exception`,
    );
  }
  const definitionViolations = conceptGenusDifferentiaViolations({
    classes: acceptedConcepts,
    relations: acceptedRelations,
  });
  if (definitionViolations.length > 0) {
    const violation = definitionViolations[0];
    const parents = violation.expectedGenusConceptIds.length > 0
      ? `; expected real is_a parent genus ${violation.expectedGenusConceptIds.join(" or ")}`
      : "";
    throw validationError(
      ontologyValidationErrorCodes.conceptGenusDifferentiaInvalid,
      `${conceptLocation(violation.conceptId)} Concept ${violation.conceptId} has invalid ${violation.language} first-sentence genus/differentia (${violation.reason})${parents}`,
    );
  }

  const suffixViolations = moduleLabelSuffixViolations(acceptedModules);
  if (suffixViolations.length > 0) {
    const violation = suffixViolations[0];
    throw validationError(
      ontologyValidationErrorCodes.moduleLabelSuffix,
      `${sourceLabel(violation.moduleId)}#/module/labels/${violation.language} label retains forbidden Module suffix: ${violation.label}`,
    );
  }
  const templateViolations = moduleTemplateTextViolations(acceptedModules);
  if (templateViolations.length > 0) {
    const violation = templateViolations[0];
    throw validationError(
      ontologyValidationErrorCodes.moduleTemplateText,
      `${sourceLabel(violation.moduleId)}#/module boundary text retains a banned representative closure template: ${violation.value}`,
    );
  }

  const semanticKeyOwner = new Map();
  for (const module of acceptedModules) {
    const moduleConcepts = acceptedConcepts.filter(
      ({ module_id: moduleId }) => moduleId === module.id,
    );
    const keyMatches = moduleConcepts.filter((concept) =>
      ontologyLanguages.every(
        (language) =>
          module.key_notion[language] === concept.labels[language],
      ),
    );
    if (keyMatches.length !== 1) {
      throw validationError(
        ontologyValidationErrorCodes.moduleKeyNotion,
        `${sourceLabel(module.id)}#/module/key_notion must resolve to exactly one owned accepted Concept; resolved ${keyMatches.length}`,
      );
    }
    if (!module.taxonomy_contract.key_root_concept_ids.includes(keyMatches[0].id)) {
      throw validationError(
        ontologyValidationErrorCodes.moduleKeyNotion,
        `${sourceLabel(module.id)}#/module/key_notion resolves to ${keyMatches[0].id}, which is absent from taxonomy_contract.key_root_concept_ids`,
      );
    }

    for (const conceptId of [
      ...module.taxonomy_contract.key_root_concept_ids,
      ...module.taxonomy_contract.flat_root_exception_concept_ids,
    ]) {
      const concept = conceptById.get(conceptId);
      if (!concept || concept.module_id !== module.id || concept.status !== "accepted") {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/taxonomy_contract references non-owned or non-accepted Concept ${conceptId}`,
        );
      }
    }

    for (const [facetName, facet] of Object.entries(module.interaction_contract.facets)) {
      for (const conceptId of facet.family_concept_ids) {
        if (!conceptIds.has(conceptId)) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/interaction_contract/facets/${facetName}/family_concept_ids references unknown Concept ${conceptId}`,
          );
        }
      }
      for (const relationId of facet.relation_ids) {
        if (!relationById.has(relationId)) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/interaction_contract/facets/${facetName}/relation_ids references unknown Relation ${relationId}`,
          );
        }
      }
    }

    for (const decision of module.boundary_decisions) {
      if (!moduleIds.has(decision.other_module_id) || !moduleIds.has(decision.owner_module_id)) {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/boundary_decisions references an unknown Module`,
        );
      }
      for (const conceptId of decision.subject_concept_ids) {
        if (!conceptIds.has(conceptId)) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/boundary_decisions references unknown Concept ${conceptId}`,
          );
        }
      }
      const citedEndpointIds = new Set();
      for (const relationId of decision.relation_ids) {
        const relation = relationById.get(relationId);
        if (!relation || relation.status !== "accepted") {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/boundary_decisions references missing or non-accepted Relation ${relationId}`,
          );
        }
        const endpointModuleIds = new Set([
          conceptById.get(relation.source_id)?.module_id,
          conceptById.get(relation.target_id)?.module_id,
        ]);
        if (!endpointModuleIds.has(module.id) || !endpointModuleIds.has(decision.other_module_id)) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/boundary_decisions Relation ${relationId} does not cross the declared Module boundary`,
          );
        }
        citedEndpointIds.add(relation.source_id);
        citedEndpointIds.add(relation.target_id);
      }
      if (decision.relation_ids.length > 0) {
        const nonEndpointSubject = decision.subject_concept_ids.find(
          (conceptId) => !citedEndpointIds.has(conceptId),
        );
        if (nonEndpointSubject) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/boundary_decisions subject ${nonEndpointSubject} is not an endpoint of a cited Relation`,
          );
        }
        if (decision.relation_not_applicable_reason !== null) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/boundary_decisions cannot state an N/A reason when accepted cross-module Relations are cited`,
          );
        }
      } else if (localizedTextValues(decision.relation_not_applicable_reason).length !== ontologyLanguages.length) {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/boundary_decisions with no cited Relation requires a trilingual relation_not_applicable_reason`,
        );
      }
      if (decision.review.review_status !== "accepted") {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/boundary_decisions must be accepted before its Module is accepted`,
        );
      }
    }

    for (const overlap of module.overlap_checks) {
      if (!moduleIds.has(overlap.other_module_id)) {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/overlap_checks references unknown Module ${overlap.other_module_id}`,
        );
      }
      if (overlap.result === "unresolved") {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/overlap_checks cannot remain unresolved on an accepted Module`,
        );
      }
      if (!moduleIds.has(overlap.owner_module_id)) {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/overlap_checks references unknown owner Module ${overlap.owner_module_id}`,
        );
      }
      for (const conceptId of overlap.candidate_concept_ids) {
        if (!conceptIds.has(conceptId)) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/overlap_checks references unknown Concept ${conceptId}`,
          );
        }
      }
      if (overlap.review.review_status !== "accepted") {
        throw validationError(
          ontologyValidationErrorCodes.moduleSemanticReference,
          `${sourceLabel(module.id)}#/module/overlap_checks must be accepted before its Module is accepted`,
        );
      }
    }

  }

  for (const module of modules) {
    for (const question of module.competency_questions ?? []) {
      if (
        !moduleIds.has(question.primary_owner_module_id) ||
        question.primary_owner_module_id !== module.id
      ) {
        throw validationError(
          ontologyValidationErrorCodes.competencyQuestionOwner,
          `${sourceLabel(module.id)}#/module/competency_questions/${question.id} primary owner must exist and equal containing Module ${module.id}`,
        );
      }
      if (semanticKeyOwner.has(question.semantic_key)) {
        throw validationError(
          ontologyValidationErrorCodes.competencyQuestionSemanticKey,
          `${sourceLabel(module.id)}#/module/competency_questions/${question.id} semantic key ${question.semantic_key} must be globally unique; owned by ${semanticKeyOwner.get(question.semantic_key)} and ${module.id}`,
        );
      }
      semanticKeyOwner.set(question.semantic_key, module.id);
      for (const relatedModuleId of question.related_module_ids) {
        if (!moduleIds.has(relatedModuleId)) {
          throw validationError(
            ontologyValidationErrorCodes.competencyQuestionOwner,
            `${sourceLabel(module.id)}#/module/competency_questions/${question.id} references unknown related Module ${relatedModuleId}`,
          );
        }
      }
      const binding = question.evidence_binding;
      const boundConceptIds = [
        ...binding.owner_concept_ids,
        ...binding.related_concept_ids,
      ];
      for (const conceptId of binding.owner_concept_ids) {
        const concept = conceptById.get(conceptId);
        if (!concept || concept.status !== "accepted" || concept.module_id !== module.id) {
          throw validationError(
            ontologyValidationErrorCodes.competencyQuestionOwner,
            `${sourceLabel(module.id)}#/module/competency_questions/${question.id} owner evidence ${conceptId} is not an accepted Concept owned by ${module.id}`,
          );
        }
      }
      for (const conceptId of binding.related_concept_ids) {
        const concept = conceptById.get(conceptId);
        if (!concept || concept.status !== "accepted" || !question.related_module_ids.includes(concept.module_id)) {
          throw validationError(
            ontologyValidationErrorCodes.competencyQuestionOwner,
            `${sourceLabel(module.id)}#/module/competency_questions/${question.id} related evidence ${conceptId} is not owned by a declared related Module`,
          );
        }
      }
      if (binding.applicability !== "owner-only") {
        for (const relatedModuleId of question.related_module_ids) {
          if (!binding.related_concept_ids.some(
            (conceptId) => conceptById.get(conceptId)?.module_id === relatedModuleId,
          )) {
            throw validationError(
              ontologyValidationErrorCodes.competencyQuestionOwner,
              `${sourceLabel(module.id)}#/module/competency_questions/${question.id} has no evidence Concept from related Module ${relatedModuleId}`,
            );
          }
        }
      }
      for (const relationId of binding.relation_ids) {
        const relation = relationById.get(relationId);
        if (!relation || relation.status !== "accepted") {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/competency_questions/${question.id} references missing or non-accepted evidence Relation ${relationId}`,
          );
        }
        if (!boundConceptIds.includes(relation.source_id) || !boundConceptIds.includes(relation.target_id)) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/competency_questions/${question.id} evidence Relation ${relationId} is not closed by its bound Concepts`,
          );
        }
        const endpointModuleIds = new Set([
          conceptById.get(relation.source_id)?.module_id,
          conceptById.get(relation.target_id)?.module_id,
        ]);
        if (!endpointModuleIds.has(module.id) || !question.related_module_ids.some((id) => endpointModuleIds.has(id))) {
          throw validationError(
            ontologyValidationErrorCodes.moduleSemanticReference,
            `${sourceLabel(module.id)}#/module/competency_questions/${question.id} evidence Relation ${relationId} does not connect its owner and a related Module`,
          );
        }
      }
    }
  }

  const activeHierarchy = relations.filter(
    ({ predicate, status }) => predicate === "is_a" && status !== "deprecated",
  );
  for (const relation of activeHierarchy) {
    const sourceConcept = conceptById.get(relation.source_id);
    const targetConcept = conceptById.get(relation.target_id);
    if (
      relation.status !== "accepted" ||
      sourceConcept?.status !== "accepted" ||
      targetConcept?.status !== "accepted"
    ) {
      continue;
    }
    const sourceKind = sourceConcept.semantic_kind;
    const targetKind = targetConcept.semantic_kind;
    if (sourceKind !== targetKind) {
      throw validationError(
        ontologyValidationErrorCodes.crossKindIsA,
        `${relationLocation(relation.id)} Relation ${relation.id} is a forbidden cross-kind is_a: ${relation.source_id} (${sourceKind}) -> ${relation.target_id} (${targetKind})`,
      );
    }
  }

  for (const relation of primaryBackboneRelations(relations)) {
    if (
      relation.predicate === "is_a" &&
      (relation.layout_parent_id !== relation.target_id ||
        relation.layout_child_id !== relation.source_id)
    ) {
      throw validationError(
        ontologyValidationErrorCodes.layoutEndpoint,
        `${relationLocation(relation.id)} is_a Relation ${relation.id} layout parent must equal canonical target and child must equal canonical source`,
      );
    }
  }

  const earlyPrimaryByChild = new Map();
  for (const relation of primaryBackboneRelations(relations)) {
    if (earlyPrimaryByChild.has(relation.layout_child_id)) {
      throw validationError(
        ontologyValidationErrorCodes.primaryBackboneParent,
        `${conceptLocation(relation.layout_child_id)} Concept ${relation.layout_child_id} has more than one primary backbone relation: ${earlyPrimaryByChild.get(relation.layout_child_id)} and ${relation.id}`,
      );
    }
    earlyPrimaryByChild.set(relation.layout_child_id, relation.id);
  }
  const earlyBackboneCycle = primaryBackboneCycle(conceptIds, relations);
  if (earlyBackboneCycle) {
    throw validationError(
      ontologyValidationErrorCodes.primaryBackboneCycle,
      `${conceptLocation(earlyBackboneCycle.nodes[0])} Primary backbone cycle: ${earlyBackboneCycle.nodes.join(" -> ")} via ${earlyBackboneCycle.relations.join(", ")}`,
    );
  }

  const primaryBackboneByChild = new Map(
    primaryBackboneRelations(relations).map((relation) => [
      relation.layout_child_id,
      relation,
    ]),
  );
  for (const concept of acceptedConcepts) {
    const primaryBackbone = primaryBackboneByChild.get(concept.id) ?? null;
    if (primaryBackbone === null && concept.root_status === null) {
      throw validationError(
        ontologyValidationErrorCodes.rootStatusInvalid,
        `${conceptLocation(concept.id)} Accepted root Concept ${concept.id} must declare root_status`,
      );
    }
    if (primaryBackbone !== null && concept.root_status !== null) {
      throw validationError(
        ontologyValidationErrorCodes.rootStatusInvalid,
        `${conceptLocation(concept.id)} Accepted non-root Concept ${concept.id} must set root_status=null`,
      );
    }
    if (releaseChannel === "release" && concept.root_status === "unresolved-root") {
      throw validationError(
        ontologyValidationErrorCodes.rootStatusInvalid,
        `${conceptLocation(concept.id)} Release cannot contain unresolved root_status on Concept ${concept.id}`,
      );
    }
    const aliases = new Set();
    for (const alias of concept.lexical_aliases) {
      const key = `${alias.language}\u0000${normalizeSemanticText(alias.value)}`;
      if (
        normalizeSemanticText(alias.value) ===
        normalizeSemanticText(concept.labels[alias.language])
      ) {
        throw validationError(
          ontologyValidationErrorCodes.lexicalAliasInvalid,
          `${conceptLocation(concept.id)} Concept ${concept.id} lexical alias ${alias.language}:${alias.value} duplicates its canonical label`,
        );
      }
      if (aliases.has(key)) {
        throw validationError(
          ontologyValidationErrorCodes.lexicalAliasInvalid,
          `${conceptLocation(concept.id)} Concept ${concept.id} repeats lexical alias ${alias.language}:${alias.value}`,
        );
      }
      aliases.add(key);
    }
  }

  const acceptedHierarchyByParent = new Map();
  for (const relation of acceptedRelations) {
    if (relation.predicate !== "is_a") continue;
    const child = conceptById.get(relation.source_id);
    const parent = conceptById.get(relation.target_id);
    if (
      child?.status !== "accepted" ||
      parent?.status !== "accepted" ||
      child.semantic_kind !== parent.semantic_kind
    ) continue;
    acceptedHierarchyByParent.set(relation.target_id, [
      ...(acceptedHierarchyByParent.get(relation.target_id) ?? []),
      relation,
    ]);
  }

  const parentIndexes = acceptedConcepts.some(
    ({ sibling_differentiation: contracts }) => contracts.length > 0,
  )
    ? buildOntologyParentIndexes({ concepts: acceptedConcepts, relations })
    : {
        taxonomy_parent_by_concept_id: {},
        logical_parent_by_concept_id: {},
      };

  for (const concept of acceptedConcepts) {
    const realSiblingGroups = [...acceptedHierarchyByParent.entries()]
      .flatMap(([parentId, parentRelations]) => {
        if (!parentRelations.some(({ source_id: sourceId }) => sourceId === concept.id)) return [];
        const siblingIds = [...new Set(parentRelations.map(({ source_id: sourceId }) => sourceId))]
          .filter((id) => id !== concept.id)
          .filter((id) => conceptById.get(id)?.semantic_kind === concept.semantic_kind);
        return siblingIds.length === 0 ? [] : [{ parentId, siblingIds }];
      });
    if (realSiblingGroups.length > 0 && concept.sibling_differentiation.length === 0) {
      throw validationError(
        ontologyValidationErrorCodes.siblingDifferentiationInvalid,
        `${conceptLocation(concept.id)} Concept ${concept.id} has accepted is_a siblings but no sibling_differentiation contract`,
      );
    }
    for (const differentiation of concept.sibling_differentiation) {
      const isRealTaxonomySibling = realSiblingGroups.some(
        ({ parentId, siblingIds }) =>
          parentId === differentiation.shared_parent_concept_id &&
          siblingIds.includes(differentiation.sibling_concept_id),
      );
      const sibling = conceptById.get(differentiation.sibling_concept_id);
      const sharedParentId = differentiation.shared_parent_concept_id;
      const isRealLogicalSibling = Boolean(
        sibling?.status === "accepted" &&
        conceptById.get(sharedParentId)?.status === "accepted" &&
        parentIndexes.logical_parent_by_concept_id[concept.id] === sharedParentId &&
        parentIndexes.logical_parent_by_concept_id[sibling.id] === sharedParentId,
      );
      if (!isRealTaxonomySibling && !isRealLogicalSibling) {
        throw validationError(
          ontologyValidationErrorCodes.siblingDifferentiationInvalid,
          `${conceptLocation(concept.id)} Concept ${concept.id} has invalid sibling differentiation for ${differentiation.sibling_concept_id}; both endpoints must share the accepted taxonomy parent or primary-backbone layout parent ${differentiation.shared_parent_concept_id}`,
        );
      }
    }
  }

  for (const relation of acceptedRelations) {
    if (!["primary-backbone", "secondary-backbone"].includes(relation.layout_role)) continue;
    const endpointSet = new Set([relation.source_id, relation.target_id]);
    if (
      !endpointSet.has(relation.layout_parent_id) ||
      !endpointSet.has(relation.layout_child_id) ||
      relation.layout_parent_id === relation.layout_child_id
    ) {
      throw validationError(
        ontologyValidationErrorCodes.layoutEndpoint,
        `${relationLocation(relation.id)} Relation ${relation.id} layout endpoints must be the two distinct canonical relation endpoints`,
      );
    }
    if (
      relation.predicate === "is_a" &&
      (relation.layout_parent_id !== relation.target_id ||
        relation.layout_child_id !== relation.source_id)
    ) {
      throw validationError(
        ontologyValidationErrorCodes.layoutEndpoint,
        `${relationLocation(relation.id)} is_a Relation ${relation.id} layout parent must equal canonical target and child must equal canonical source`,
      );
    }
    const childModule = moduleById.get(conceptById.get(relation.layout_child_id).module_id);
    if (!childModule.taxonomy_contract.allowed_backbone_predicates.includes(relation.predicate)) {
      throw validationError(
        ontologyValidationErrorCodes.backbonePredicateInvalid,
        `${relationLocation(relation.id)} Relation ${relation.id} predicate ${relation.predicate} is absent from Module ${childModule.id} allowed_backbone_predicates`,
      );
    }
  }
};

const countNamedArrayItems = (value, names, predicate = () => true) => {
  if (Array.isArray(value)) {
    return value.reduce(
      (total, item) => total + countNamedArrayItems(item, names, predicate),
      0,
    );
  }
  if (value === null || typeof value !== "object") return 0;
  return Object.entries(value).reduce((total, [key, child]) => {
    const local = names.has(key) && Array.isArray(child) ? child.filter(predicate).length : 0;
    return total + local + countNamedArrayItems(child, names, predicate);
  }, 0);
};

export const computeOntologyMetrics = (canonical) => {
  const activeHierarchy = canonical.relations.filter(
    ({ predicate, status }) => predicate === "is_a" && status !== "deprecated",
  );
  const conceptsWithBackboneParents = new Set(
    primaryBackboneRelations(canonical.relations).map(
      ({ layout_child_id: childId }) => childId,
    ),
  );
  const activeConcepts = canonical.classes.filter(({ status }) => status !== "deprecated");
  const conceptById = new Map(canonical.classes.map((concept) => [concept.id, concept]));
  const conceptIds = new Set(canonical.classes.map(({ id }) => id));
  const moduleIds = new Set(canonical.modules.map(({ id }) => id));
  const moduleCountByDomain = canonical.modules.reduce(
    (counts, module) => incrementCount(counts, module.plane_id),
    {},
  );
  const rootStatusCounts = activeConcepts
    .filter(({ id }) => !conceptsWithBackboneParents.has(id))
    .reduce(
      (counts, concept) => incrementCount(counts, concept.root_status ?? "missing"),
      {},
    );
  const depths = conceptDepths(canonical.classes, canonical.relations);
  const conceptDepthHistogram = [...depths.values()].reduce(
    (counts, depth) => incrementCount(counts, String(depth)),
    {},
  );
  const semanticKeyCounts = canonical.modules
    .flatMap((module) =>
      (module.competency_questions ?? []).map((question) => question.semantic_key),
    )
    .reduce((counts, key) => incrementCount(counts, key), {});
  const unownedCompetencyQuestions = canonical.modules.flatMap((module) =>
    (module.competency_questions ?? []).filter(
      (question) =>
        question.primary_owner_module_id !== module.id ||
        !moduleIds.has(question.primary_owner_module_id) ||
        semanticKeyCounts[question.semantic_key] !== 1,
    ),
  );
  return {
    domains: canonical.planes.length,
    modules: canonical.modules.length,
    concepts: canonical.classes.length,
    taxonomy_roots: canonical.classes.filter(
      ({ id, status }) =>
        status !== "deprecated" && !conceptsWithBackboneParents.has(id),
    ).length,
    is_a_relations: activeHierarchy.length,
    semantic_relations: canonical.relations.filter(
      ({ predicate, status }) => predicate !== "is_a" && status !== "deprecated",
    ).length,
    instance_examples: countNamedArrayItems(
      canonical,
      new Set(["examples"]),
      (item) => item && typeof item === "object" && item.kind === "instance",
    ),
    controlled_values: countNamedArrayItems(canonical, new Set(["allowed_values"])),
    structure_fields: countNamedArrayItems(canonical, new Set(["fields"])),
    constraints: countNamedArrayItems(
      canonical,
      new Set(["constraints", "required_relation_constraints", "conditions", "global_constraints"]),
    ),
    source_claims: countNamedArrayItems(canonical, new Set(["source_claims"])),
    case_paths: canonical.case_paths.length,
    legacy_individuals_remaining: Array.isArray(canonical.individuals)
      ? canonical.individuals.length
      : 0,
    legacy_data_properties_remaining: Array.isArray(canonical.data_properties)
      ? canonical.data_properties.length
      : 0,
    legacy_axioms_remaining: Array.isArray(canonical.axioms)
      ? canonical.axioms.length
      : 0,
    module_count_by_domain: moduleCountByDomain,
    root_status_counts: rootStatusCounts,
    concept_depth_histogram: conceptDepthHistogram,
    max_concept_depth: Math.max(0, ...depths.values()),
    unresolved_root_count: activeConcepts.filter(
      ({ root_status: rootStatus }) => rootStatus === "unresolved-root",
    ).length,
    cross_kind_is_a_count: activeHierarchy.filter(
      (relation) =>
        conceptById.get(relation.source_id)?.semantic_kind !==
        conceptById.get(relation.target_id)?.semantic_kind,
    ).length,
    primary_backbone_cycle_count: primaryBackboneCycle(
      conceptIds,
      canonical.relations,
    )
      ? 1
      : 0,
    template_text_violation_count: moduleTemplateTextViolations(canonical.modules).length,
    module_label_suffix_violation_count: moduleLabelSuffixViolations(canonical.modules).length,
    unowned_cq_count: unownedCompetencyQuestions.length,
  };
};

export const finalizeCanonicalWithMetrics = (canonicalDraft) => ({
  ...canonicalDraft,
  ontology_metrics: computeOntologyMetrics(canonicalDraft),
});
