import type { SiteBuildManifest } from "./lib/site-build-metadata.mjs";
import type { FileTransactionSummary } from "./lib/atomic-write.mjs";

export function writeSiteBuildManifest(options?: Readonly<{
  root?: string;
  manifest?: SiteBuildManifest;
}>): Readonly<{
  manifest: SiteBuildManifest;
  target: string;
  transaction: FileTransactionSummary;
}>;
