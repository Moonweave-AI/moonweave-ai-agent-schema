export const ontologyValidationErrorCodes = Object.freeze({
  sourceContractInvalid: "SOURCE_CONTRACT_INVALID",
  moduleLabelSuffix: "MODULE_LABEL_SUFFIX",
  moduleTemplateText: "MODULE_TEMPLATE_TEXT",
  moduleKeyNotion: "MODULE_KEY_NOTION",
  moduleSemanticReference: "MODULE_SEMANTIC_REFERENCE",
  competencyQuestionOwner: "COMPETENCY_QUESTION_OWNER",
  competencyQuestionSemanticKey: "COMPETENCY_QUESTION_SEMANTIC_KEY",
  crossKindIsA: "CROSS_KIND_IS_A",
  layoutEndpoint: "LAYOUT_ENDPOINT",
  primaryBackboneParent: "PRIMARY_BACKBONE_PARENT",
  primaryBackboneCycle: "PRIMARY_BACKBONE_CYCLE",
  rootStatusInvalid: "ROOT_STATUS_INVALID",
  lexicalAliasInvalid: "LEXICAL_ALIAS_INVALID",
  conceptDisplayLabelDuplicate: "CONCEPT_DISPLAY_LABEL_DUPLICATE",
  conceptGenusDifferentiaInvalid: "CONCEPT_GENUS_DIFFERENTIA_INVALID",
  siblingDifferentiationInvalid: "SIBLING_DIFFERENTIATION_INVALID",
  backbonePredicateInvalid: "BACKBONE_PREDICATE_INVALID",
  releaseEvidenceInvalid: "RELEASE_EVIDENCE_INVALID",
});

export class OntologyBuildValidationError extends Error {
  constructor(code, message) {
    super(`[${code}] ${message}`);
    this.name = "OntologyBuildValidationError";
    this.code = code;
  }
}

export const validationError = (code, message) =>
  new OntologyBuildValidationError(code, message);
