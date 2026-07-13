export const REVIEWED_ADAPTER_MAPPINGS: readonly Readonly<{
  concept_id: string;
  system: string;
  external_identifier: string;
  external_version: string;
  canonical_target_ids: readonly string[];
  source_id: string;
  scope: Readonly<Record<"zh" | "en" | "ja", string>>;
  direction: "import-to-canonical" | "export-from-canonical" | "bidirectional";
  loss: Readonly<Record<"zh" | "en" | "ja", string>>;
  conformance: Readonly<{
    status: "contract-tested" | "executable-tested" | "not-tested";
    test_id: string;
    method: Readonly<Record<"zh" | "en" | "ja", string>>;
  }>;
}>[];

export function applyReviewedAdapterMappings<T extends Readonly<Record<string, unknown>>>(input: {
  concepts: readonly T[];
  sourceRegistryById: ReadonlyMap<string, Readonly<Record<string, string>>>;
}): T[];
