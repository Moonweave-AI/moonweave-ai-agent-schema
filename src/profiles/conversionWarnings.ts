export const conversionWarnings = [
  {
    id: "warning-zod-transform-loss",
    artifact_type: "ConversionWarning",
    source_profile: "zod",
    target_profile: "json-schema-2020-12",
    message: "Zod transforms and runtime-only refinements may not round-trip into canonical JSON Schema.",
    source_ids: ["eng-val-zod-json-schema", "eng-val-zod-release-430"],
    review_status: "accepted"
  },
  {
    id: "warning-pydantic-mode-loss",
    artifact_type: "ConversionWarning",
    source_profile: "pydantic",
    target_profile: "json-schema-2020-12",
    message: "Pydantic validation and serialization modes can project different JSON Schema views.",
    source_ids: ["eng-val-pydantic-json-schema"],
    review_status: "accepted"
  }
] as const;
