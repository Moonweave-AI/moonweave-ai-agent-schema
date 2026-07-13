import { z, type ZodType } from "zod";

import type { CanonicalConcept, CanonicalField } from "../lib/ontology-index";

const datatypeSchema = (datatype: string | undefined): ZodType => {
  switch (datatype) {
    case "string":
    case "iri":
    case "date-time":
      return z.string();
    case "integer":
      return z.number().int();
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array":
      return z.array(z.unknown());
    case "object":
    case "json":
      return z.record(z.string(), z.unknown());
    default:
      return z.unknown();
  }
};

const fieldSchema = (field: CanonicalField): ZodType => {
  let schema = datatypeSchema(field.datatype);
  const values = (field.allowed_values ?? []).map((item) => {
    const value = item && typeof item === "object" && "value" in item
      ? (item as { readonly value: unknown }).value
      : item;
    return JSON.stringify(value);
  });
  if (values.length > 0) {
    schema = schema.refine(
      (value) => values.includes(JSON.stringify(value)),
      `Value must match one of the controlled values for ${field.id}`,
    );
  }
  if (field.pattern && field.datatype === "string") schema = z.string().regex(new RegExp(field.pattern));
  const maximum = field.cardinality?.max;
  if (maximum === null || (typeof maximum === "number" && maximum > 1)) {
    const arraySchema = z.array(schema).min(field.cardinality?.min ?? 0);
    schema = typeof maximum === "number" ? arraySchema.max(maximum) : arraySchema;
  }
  return field.required ? schema : schema.optional();
};

/** Builds a runtime validation profile from one canonical Concept structure. */
export const createZodProfileFromConcept = (concept: CanonicalConcept) => {
  const shape = Object.fromEntries(
    (concept.structure?.fields ?? []).map((field) => [field.id, fieldSchema(field)]),
  );
  return z.object(shape).strict();
};

export type ConceptZodProfile = ReturnType<typeof createZodProfileFromConcept>;
