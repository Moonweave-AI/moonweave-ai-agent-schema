export interface OntologyCommunityVerificationResult {
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly communityCount: number;
  readonly canonicalEdgeCount: number;
  readonly derivedEdgeCount: number;
  readonly sourceSha256: string;
  readonly projectionSha256: string;
}

export function validateOntologyCommunityArtifact(input: Readonly<{
  ontology: unknown;
  canonicalBytes: Uint8Array;
  artifact: unknown;
}>): string[];

export function verifyOntologyCommunityArtifact(options?: Readonly<{
  root?: string;
}>): Readonly<OntologyCommunityVerificationResult>;
