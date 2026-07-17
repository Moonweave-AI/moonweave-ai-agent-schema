export interface SiteBuildManifest {
  readonly schema_version: "1.0.0";
  readonly commit_sha: string;
  readonly built_from_ref: string;
  readonly canonical_version: string;
  readonly generator_version: string;
  readonly source_fingerprint: string;
  readonly canonical_fingerprint: string;
  readonly community_projection_fingerprint: string;
  readonly module_count: number;
  readonly concept_count: number;
  readonly relation_count: number;
}

export function sha256Bytes(bytes: Uint8Array): string;
export function currentRelationCount(relations: readonly unknown[]): number;
export function gitValue(root: string, args: readonly string[]): string;
export function currentCommitSha(root: string): string;
export function currentRef(root: string): string;
export function readCanonicalIdentity(root: string): Readonly<{
  canonical: Record<string, unknown>;
  canonicalBytes: Buffer;
  sourceFingerprint: string;
}>;
export function readCommunityProjectionIdentity(
  root: string,
  canonicalBytes: Uint8Array,
): Readonly<{ projectionFingerprint: string }>;
export function expectedSiteBuildManifest(
  root: string,
  options?: Readonly<{ commitSha?: string; builtFromRef?: string }>,
): SiteBuildManifest;
