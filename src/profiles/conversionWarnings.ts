import type { CanonicalOntology } from "../lib/ontology-index";

export interface DerivedConversionWarning {
  readonly id: string;
  readonly node_id: string;
  readonly relation_id: string | null;
  readonly field_id: string | null;
  readonly mapping_id: string | null;
  readonly severity: string;
  readonly message: string;
}

/** Derives warnings only from canonical constraints and lossy mappings. */
export const deriveConversionWarnings = (
  ontology: CanonicalOntology,
): readonly DerivedConversionWarning[] =>
  ontology.classes.flatMap((concept) => {
    const mappingWarnings = (concept.external_mappings ?? []).flatMap((mapping) => {
      if (!mapping || typeof mapping !== "object") return [];
      const value = mapping as Readonly<Record<string, unknown>>;
      if (value.mapping_kind !== "lossy" && value.mapping_kind !== "unsupported") return [];
      return [{
        id: `mapping-warning:${concept.id}:${String(value.id)}`,
        node_id: concept.id,
        relation_id: null,
        field_id: null,
        mapping_id: String(value.id),
        severity: value.mapping_kind === "unsupported" ? "error" : "warning",
        message: String(
          value.conversion_note && typeof value.conversion_note === "object"
            ? (value.conversion_note as { readonly en?: unknown }).en ?? value.mapping_kind
            : value.mapping_kind,
        ),
      }];
    });
    const constraintWarnings = (concept.structure?.constraints ?? []).flatMap((constraint) =>
      constraint.severity === "warning"
        ? [{
            id: `constraint-warning:${concept.id}:${constraint.id}`,
            node_id: concept.id,
            relation_id: null,
            field_id: null,
            mapping_id: null,
            severity: "warning",
            message: constraint.explanations?.en ?? constraint.id,
          }]
        : [],
    );
    return [...mappingWarnings, ...constraintWarnings];
  });
