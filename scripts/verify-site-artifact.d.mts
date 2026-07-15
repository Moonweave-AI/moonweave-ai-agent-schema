import type { SiteBuildManifest } from "./lib/site-build-metadata.mjs";

export function verifySiteArtifact(options?: Readonly<{
  root?: string;
  expectedManifest?: SiteBuildManifest;
  forbiddenMarkers?: readonly string[];
  requiredMarkers?: readonly string[];
  maxJavascriptBytes?: number;
  communityVerifier?: (options: Readonly<{ root: string }>) => Readonly<{
    nodeCount: number;
    edgeCount: number;
    communityCount: number;
    canonicalEdgeCount: number;
    derivedEdgeCount: number;
    sourceSha256: string;
    projectionSha256: string;
  }>;
}>): Readonly<{
  actual: SiteBuildManifest;
  assetPaths: readonly string[];
  canonicalAssetPath: string;
  canonicalAssetBytes: number;
  javascriptBytes: number;
  communityGraph: Readonly<{
    nodeCount: number;
    edgeCount: number;
    communityCount: number;
    canonicalEdgeCount: number;
    derivedEdgeCount: number;
    sourceSha256: string;
    projectionSha256: string;
  }>;
}>;
