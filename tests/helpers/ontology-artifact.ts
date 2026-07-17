import { isAbsolute, resolve } from "node:path";

const publishedArtifactPath = resolve(
  process.cwd(),
  "src/generated/agent-ontology.json",
);

export const ontologyArtifactPath = (): string => {
  const override = process.env.MOONWEAVE_ONTOLOGY_ARTIFACT_PATH?.trim();
  if (!override) return publishedArtifactPath;
  if (!isAbsolute(override)) {
    throw new Error("MOONWEAVE_ONTOLOGY_ARTIFACT_PATH must be an absolute path");
  }
  return resolve(override);
};
