export function validateAcceptedReferenceTargets(
  canonical: Readonly<Record<string, unknown>>,
  ownerByExampleId?: ReadonlyMap<string, Readonly<Record<string, unknown>>> | null,
): void;

export function validateReferencesAndInformation(
  canonical: Readonly<Record<string, unknown>>,
  sourceIndex: Readonly<Record<string, unknown>>,
): void;
