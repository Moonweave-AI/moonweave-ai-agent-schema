import type { CanonicalOntology } from "../lib/ontology-index";

export interface DerivedConversionWarning {
  readonly id: string;
  readonly node_id: string;
  readonly relation_id: string | null;
  readonly field_id: string | null;
  readonly severity: string;
  readonly message: string;
}

/** Derives warnings only from canonical structural constraints. */
export const deriveConversionWarnings = (
  ontology: CanonicalOntology,
): readonly DerivedConversionWarning[] =>
  ontology.classes.flatMap((concept) => {
    const constraintWarnings = (concept.structure?.constraints ?? []).flatMap((constraint) =>
      constraint.severity === "warning"
        ? [{
            id: `constraint-warning:${concept.id}:${constraint.id}`,
            node_id: concept.id,
            relation_id: null,
            field_id: null,
            severity: "warning",
            message: constraint.explanations?.en ?? constraint.id,
          }]
        : [],
    );
    return constraintWarnings;
  });
