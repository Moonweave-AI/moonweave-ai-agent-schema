export interface EffectiveConceptStructure {
  readonly identity_keys: readonly string[];
  readonly fields: readonly Readonly<{
    id: string;
    example_value: unknown;
    cardinality: Readonly<{ min: number; max: number | null }>;
    [key: string]: unknown;
  }>[];
  readonly constraints: readonly Readonly<Record<string, unknown>>[];
  readonly required_relation_constraints: readonly Readonly<Record<string, unknown>>[];
}

export function buildEffectiveConceptStructures(canonical: {
  readonly classes: readonly Readonly<Record<string, unknown>>[];
  readonly relations: readonly Readonly<Record<string, unknown>>[];
}): Map<string, EffectiveConceptStructure>;
