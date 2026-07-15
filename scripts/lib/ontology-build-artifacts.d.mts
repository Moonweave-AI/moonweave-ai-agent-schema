export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonObject
  | readonly JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface CanonicalContract {
  readonly $schema?: string;
  readonly $id?: string;
  readonly $defs: Readonly<Record<string, JsonObject>>;
}

export interface GenerationProvenance {
  readonly generatorVersion: string;
  readonly sourceFingerprint: string;
  readonly contractFingerprint: string;
  readonly generatedAt: string;
}

export interface CanonicalGenerationArtifact extends JsonObject {
  readonly id: string;
  readonly artifact_metadata: JsonObject & {
    readonly canonical_version: string;
    readonly generator_version: string;
    readonly generated_from: readonly string[];
    readonly source_tree_sha256: string;
  };
  readonly planes: readonly JsonObject[];
  readonly modules: readonly JsonObject[];
  readonly classes: readonly JsonObject[];
  readonly relations: readonly JsonObject[];
}

export const generateCanonicalTypes: (
  contract: CanonicalContract,
  metadata?: GenerationProvenance | null,
) => string;

export const generateCanonicalSchema: (
  contract: CanonicalContract,
  metadata?: GenerationProvenance | null,
) => JsonObject;

export const generateCanonicalMarkdown: (
  canonical: CanonicalGenerationArtifact,
  generatedAt: string,
) => string;

export const generateDefinitionLedger: (
  canonical: CanonicalGenerationArtifact,
  generatedAt: string,
) => JsonObject;

export const generateConceptPayloadArtifacts: (
  canonical: CanonicalGenerationArtifact,
  generatedAt: string,
) => Readonly<{ schema: JsonObject; fixtures: JsonObject }>;

export const validateGeneratedCanonical: (input: Readonly<{
  canonical: CanonicalGenerationArtifact;
  generatedSchema: JsonObject;
}>) => void;

export const buildArtifactBytes: (input: Readonly<{
  canonical: CanonicalGenerationArtifact;
  contract: CanonicalContract;
  contractFingerprint: string;
  sourceIndex: JsonObject;
  generatedAt: string;
}>) => Map<string, string>;
