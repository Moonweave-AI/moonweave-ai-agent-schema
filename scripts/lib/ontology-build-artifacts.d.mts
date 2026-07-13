interface CanonicalContract {
  readonly $schema?: string;
  readonly $id?: string;
  readonly $defs: Readonly<Record<string, Record<string, unknown>>>;
}

interface GenerationProvenance {
  readonly generatorVersion: string;
  readonly sourceFingerprint: string;
  readonly contractFingerprint: string;
  readonly generatedAt: string;
}

export const generateCanonicalTypes: (
  contract: CanonicalContract,
  metadata?: GenerationProvenance | null,
) => string;
