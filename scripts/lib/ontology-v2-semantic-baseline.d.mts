export interface FrozenV2SemanticConcept {
  readonly id: string;
  readonly module_id: string;
  readonly labels: Readonly<{ zh: string }>;
  readonly semantic_kind: string;
  readonly primary_parent_relation_id: string | null;
}

export interface FrozenV2SemanticBaseline {
  readonly path: string;
  readonly bytes: Buffer;
  readonly sha256: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly concepts: ReadonlyMap<string, FrozenV2SemanticConcept>;
  readonly modulePlane: ReadonlyMap<string, string>;
  readonly depths: ReadonlyMap<string, number>;
  readonly relationCount: number;
  readonly rootCount: number;
  readonly maxDepth: number;
}

export const frozenV2SemanticBaselinePath: string;
export const frozenV2SemanticBaselineSha256: string;
export function loadFrozenV2SemanticBaseline(): FrozenV2SemanticBaseline;
