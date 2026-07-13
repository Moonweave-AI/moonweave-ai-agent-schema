export interface LegacyMigrationAuditResult {
  readonly frozenLegacySha256: string;
  readonly legacyRecordCount: number;
  readonly acceptedDispositionCount: number;
  readonly conceptDecisionCount: number;
  readonly moduleDecisionCount: number;
  readonly currentSourceDocumentCount: number;
  readonly currentSourceTargetCount: number;
  readonly unresolvedTargetCount: number;
  readonly auditedSourceRoot: string;
}

export const legacyMigrationAuditAnchors: Readonly<{
  frozenLegacySha256: string;
  freezeManifestSha256: string;
  recordManifestSha256: string;
  dispositionManifestSha256: string;
  domainDecisionTreeSha256: string;
  decisionConvergenceSha256: string;
  legacyRecordCount: number;
  conceptDecisionCount: number;
}>;

export function collectSourceTargetRefs(
  sourceDocuments: readonly Record<string, unknown>[],
): Set<string>;

export function assertRecordManifestIntegrity(input: {
  legacy: Record<string, unknown>;
  recordManifest: readonly Record<string, unknown>[];
  expectedRecordCount?: number;
}): Set<string>;

export function assertDispositionManifestIntegrity(input: {
  dispositionManifest: Record<string, unknown>;
  recordManifest: readonly Record<string, unknown>[];
  sourceTargetRefs: ReadonlySet<string>;
  expectedBaselineSha256?: string;
  expectedRecordCount?: number;
}): Set<string>;

export function assertDecisionTargetsResolve(input: {
  bundles: readonly Record<string, unknown>[];
  sourceTargetRefs: ReadonlySet<string>;
  convergenceMappings?: readonly Record<string, unknown>[];
}): void;

export function auditLegacyMigration(input: {
  repositoryRoot: string;
}): LegacyMigrationAuditResult;
