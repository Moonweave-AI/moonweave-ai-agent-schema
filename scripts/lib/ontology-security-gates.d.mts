export interface PublishedDocument {
  readonly label: string;
  readonly value: unknown;
}

export interface UiSourceFile {
  readonly label: string;
  readonly text: string;
}

export interface PublishedContentSecurityViolation {
  readonly label: string;
  readonly path: string;
  readonly message: string;
}

export interface SourceUrlRecord {
  readonly id: string;
  readonly url: string;
}

export interface HttpSourceAllowlistEntry {
  readonly source_id: string;
  readonly url: string;
  readonly reason: string;
  readonly approved_by: string;
  readonly approved_on: string;
  readonly review_by: string;
}

export interface SourceUrlPolicyViolation {
  readonly sourceId: string;
  readonly message: string;
}

export function findPublishedContentSecurityViolations(input: {
  readonly documents: readonly PublishedDocument[];
  readonly uiFiles: readonly UiSourceFile[];
}): readonly PublishedContentSecurityViolation[];

export function assertPublishedContentSecurity(input: {
  readonly documents: readonly PublishedDocument[];
  readonly uiFiles: readonly UiSourceFile[];
}): void;

export function validateSourceUrlPolicy(
  sources: readonly SourceUrlRecord[],
  httpAllowlist: readonly HttpSourceAllowlistEntry[],
): readonly SourceUrlPolicyViolation[];

export function assertSourceUrlPolicy(
  sources: readonly SourceUrlRecord[],
  httpAllowlist: readonly HttpSourceAllowlistEntry[],
): void;
