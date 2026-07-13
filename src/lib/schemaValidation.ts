import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";
import ontologySchema from "../../schemas/agent-ontology.schema.json";

export function createOntologyAjv() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true
  });
  addFormats(ajv);
  return ajv;
}

export function validateCanonicalOntology(data: unknown) {
  const ajv = createOntologyAjv();
  const validate = ajv.compile(ontologySchema);
  const valid = validate(data);

  return {
    valid,
    errors: (validate.errors ?? []).map((error) => contextualizeError(error, data))
  };
}

export type OntologyValidationError = ErrorObject & {
  readonly recordId?: string;
};

function contextualizeError(error: ErrorObject, data: unknown): OntologyValidationError {
  const relationMatch = /^\/relations\/(\d+)(?:\/|$)/u.exec(error.instancePath);
  if (!relationMatch || !data || typeof data !== "object") return error;
  const relations = (data as { readonly relations?: unknown }).relations;
  if (!Array.isArray(relations)) return error;
  const relation = relations[Number(relationMatch[1])];
  if (!relation || typeof relation !== "object" || typeof relation.id !== "string") return error;
  return { ...error, recordId: relation.id };
}
