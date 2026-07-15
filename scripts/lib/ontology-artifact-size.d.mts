export interface OntologyArtifactSizeMeasurements {
  readonly raw_bytes: number;
  readonly minified_bytes: number;
  readonly gzip_bytes: number;
  readonly nested_claim_count: number;
  readonly nested_support_bytes: number;
  readonly average_nested_support_bytes: number;
  readonly maximum_nested_support_bytes: number;
  readonly nested_copied_direct_support_count: number;
}

export type OntologyArtifactSizeLimits = Readonly<
  Omit<OntologyArtifactSizeMeasurements, "nested_claim_count">
>;

export interface OntologyArtifactSizeRecord {
  readonly measurements: OntologyArtifactSizeMeasurements;
  readonly limits: OntologyArtifactSizeLimits;
}

export const ontologyArtifactSizeLimits: OntologyArtifactSizeLimits;

export function measureOntologyArtifactSize(options: Readonly<{
  canonicalBytes: Buffer;
  canonical: Readonly<Record<string, unknown>>;
}>): OntologyArtifactSizeMeasurements;

export function assertOntologyArtifactSize(options: Readonly<{
  canonicalBytes: Buffer;
  canonical: Readonly<Record<string, unknown>>;
  limits?: OntologyArtifactSizeLimits;
}>): OntologyArtifactSizeRecord;
