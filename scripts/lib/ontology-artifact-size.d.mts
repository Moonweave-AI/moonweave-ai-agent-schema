export interface OntologyArtifactSizeMeasurements {
  readonly raw_bytes: number;
  readonly minified_bytes: number;
  readonly gzip_bytes: number;
}

export type OntologyArtifactSizeLimits = Readonly<OntologyArtifactSizeMeasurements>;

export const ontologyArtifactSizeLimits: OntologyArtifactSizeLimits;

export function measureOntologyArtifactSize(options: Readonly<{
  canonicalBytes: Buffer;
  canonical: Readonly<Record<string, unknown>>;
}>): OntologyArtifactSizeMeasurements;

export function assertOntologyArtifactSize(options: Readonly<{
  canonicalBytes: Buffer;
  canonical: Readonly<Record<string, unknown>>;
  limits?: OntologyArtifactSizeLimits;
}>): Readonly<{
  measurements: OntologyArtifactSizeMeasurements;
  limits: OntologyArtifactSizeLimits;
}>;

