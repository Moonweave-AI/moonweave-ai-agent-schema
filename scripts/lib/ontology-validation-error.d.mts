export type OntologyValidationErrorCode =
  | "SOURCE_CONTRACT_INVALID"
  | "MODULE_LABEL_SUFFIX"
  | "MODULE_TEMPLATE_TEXT"
  | "MODULE_KEY_NOTION"
  | "MODULE_SEMANTIC_REFERENCE"
  | "COMPETENCY_QUESTION_OWNER"
  | "COMPETENCY_QUESTION_SEMANTIC_KEY"
  | "CROSS_KIND_IS_A"
  | "LAYOUT_ENDPOINT"
  | "PRIMARY_BACKBONE_PARENT"
  | "PRIMARY_BACKBONE_CYCLE"
  | "ROOT_STATUS_INVALID"
  | "LEXICAL_ALIAS_INVALID"
  | "CONCEPT_DISPLAY_LABEL_DUPLICATE"
  | "CONCEPT_GENUS_DIFFERENTIA_INVALID"
  | "SIBLING_DIFFERENTIATION_INVALID"
  | "BACKBONE_PREDICATE_INVALID"
  | "RELEASE_EVIDENCE_INVALID";

export const ontologyValidationErrorCodes: Readonly<{
  sourceContractInvalid: "SOURCE_CONTRACT_INVALID";
  moduleLabelSuffix: "MODULE_LABEL_SUFFIX";
  moduleTemplateText: "MODULE_TEMPLATE_TEXT";
  moduleKeyNotion: "MODULE_KEY_NOTION";
  moduleSemanticReference: "MODULE_SEMANTIC_REFERENCE";
  competencyQuestionOwner: "COMPETENCY_QUESTION_OWNER";
  competencyQuestionSemanticKey: "COMPETENCY_QUESTION_SEMANTIC_KEY";
  crossKindIsA: "CROSS_KIND_IS_A";
  layoutEndpoint: "LAYOUT_ENDPOINT";
  primaryBackboneParent: "PRIMARY_BACKBONE_PARENT";
  primaryBackboneCycle: "PRIMARY_BACKBONE_CYCLE";
  rootStatusInvalid: "ROOT_STATUS_INVALID";
  lexicalAliasInvalid: "LEXICAL_ALIAS_INVALID";
  conceptDisplayLabelDuplicate: "CONCEPT_DISPLAY_LABEL_DUPLICATE";
  conceptGenusDifferentiaInvalid: "CONCEPT_GENUS_DIFFERENTIA_INVALID";
  siblingDifferentiationInvalid: "SIBLING_DIFFERENTIATION_INVALID";
  backbonePredicateInvalid: "BACKBONE_PREDICATE_INVALID";
  releaseEvidenceInvalid: "RELEASE_EVIDENCE_INVALID";
}>;

export class OntologyBuildValidationError extends Error {
  readonly code: OntologyValidationErrorCode;
  constructor(code: OntologyValidationErrorCode, message: string);
}

export function validationError(
  code: OntologyValidationErrorCode,
  message: string,
): OntologyBuildValidationError;
