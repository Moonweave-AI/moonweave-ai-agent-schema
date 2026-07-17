export interface CompiledOntologyBundle {
  readonly canonical: Readonly<Record<string, unknown>> & {
    readonly id: string;
    readonly planes: readonly Readonly<Record<string, unknown>>[];
    readonly modules: readonly Readonly<Record<string, unknown>>[];
    readonly classes: readonly Readonly<Record<string, unknown>>[];
    readonly relations: readonly Readonly<Record<string, unknown>>[];
  };
  readonly communityGraph: Readonly<Record<string, unknown>>;
  readonly sourceIndex: Readonly<Record<string, unknown>>;
  readonly sourceTreeSha256: string;
}

export function compileOntologyBundle(options: Readonly<{
  sourceDir: string;
  limits?: Readonly<Record<string, number>>;
}>): Promise<CompiledOntologyBundle>;

