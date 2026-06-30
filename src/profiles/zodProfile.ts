import { z } from "zod";

const provenance = z.object({
  source_ids: z.array(z.string().min(1)).min(1),
  constraint_ids: z.array(z.string().min(1)).min(1),
  proposal_ids: z.array(z.string().min(1)).min(1),
  derivation_note: z.string().min(1),
  review_status: z.enum(["accepted", "draft", "needs-review"])
});

export const ontologyArtifactProfile = z.object({
  id: z.string().min(1),
  artifact_type: z.enum([
    "OntologyArtifact",
    "TrustBoundary",
    "RelationArtifact",
    "SchemaArtifact",
    "GraphView",
    "ConversionWarning"
  ]),
  label: z.string().min(1),
  layer: z.string().min(1),
  disposition: z.enum(["core", "core+profile", "profile", "adapter"]),
  description: z.string().min(1),
  provenance
});

export type OntologyArtifactProfile = z.infer<typeof ontologyArtifactProfile>;
