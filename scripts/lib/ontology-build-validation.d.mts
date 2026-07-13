export function computeOntologyMetrics(canonical: {
  planes: ReadonlyArray<unknown>;
  modules: ReadonlyArray<unknown>;
  classes: ReadonlyArray<{ id: string; status?: string }>;
  relations: ReadonlyArray<{
    predicate: string;
    status?: string;
    source_id: string;
  }>;
  case_paths: ReadonlyArray<unknown>;
  individuals?: ReadonlyArray<unknown>;
  data_properties?: ReadonlyArray<unknown>;
  axioms?: ReadonlyArray<unknown>;
  [key: string]: unknown;
}): Record<string, number>;
