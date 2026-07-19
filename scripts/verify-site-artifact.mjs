import fs from "node:fs";
import path from "node:path";

import { isMainModule } from "./lib/cli-entrypoint.mjs";
import {
  currentRelationCount,
  expectedSiteBuildManifest,
} from "./lib/site-build-metadata.mjs";
import { stableJson } from "./lib/stable-json.mjs";
import { verifyOntologyCommunityArtifact } from "./verify-ontology-community-graph.mjs";

const defaultForbiddenMarkers = Object.freeze([
  "canonical-primary-path-rings",
  "continuous-local-force",
  "fcose-force",
]);
const supersededRuntimeDependencies = Object.freeze([
  "cytoscape",
  "cytoscape-fcose",
  "elkjs",
]);
const defaultRequiredMarkers = Object.freeze([
  "vis-network-forceatlas2",
  "forceAtlas2Based",
  "委派与移交",
  "网络访问控制",
  "学习数据、模型分数与变更提议",
]);

const assetRelativePath = (assetUrl) => {
  const withoutQuery = assetUrl.split(/[?#]/u, 1)[0];
  const match = withoutQuery.match(/(?:^|\/)(assets\/[^/]+)$/u);
  if (!match) throw new Error(`Unsupported asset URL in dist/index.html: ${assetUrl}`);
  return match[1];
};

const readHashedAssets = (dist, html) => {
  const assetUrls = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/gu)]
    .map((match) => match[1]);
  if (!assetUrls.length) throw new Error("dist/index.html does not reference hashed assets");
  const assetPaths = assetUrls.map(assetRelativePath);
  for (const relative of assetPaths) {
    if (!/-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/u.test(relative)) {
      throw new Error(`Referenced production asset is not content-hashed: ${relative}`);
    }
    if (!fs.existsSync(path.join(dist, relative))) {
      throw new Error(`Referenced asset does not exist: ${relative}`);
    }
  }
  return Object.freeze(assetPaths);
};

export const verifySiteArtifact = ({
  root = process.cwd(),
  expectedManifest = expectedSiteBuildManifest(root),
  forbiddenMarkers = defaultForbiddenMarkers,
  requiredMarkers = defaultRequiredMarkers,
  maxJavascriptBytes = 5 * 1024 * 1024,
  communityVerifier = verifyOntologyCommunityArtifact,
} = {}) => {
  const dist = path.join(root, "dist");
  const manifestPath = path.join(dist, "build-manifest.json");
  const indexPath = path.join(dist, "index.html");
  if (!fs.existsSync(manifestPath) || !fs.existsSync(indexPath)) {
    throw new Error("dist site artifact is incomplete");
  }
  const actual = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (stableJson(actual) !== stableJson(expectedManifest)) {
    throw new Error("build-manifest does not exactly match the current checkout and canonical artifact");
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const assetPaths = readHashedAssets(dist, html);
  const assetsDirectory = path.join(dist, "assets");
  const assetFilenames = fs.readdirSync(assetsDirectory);
  const javascriptAssets = assetFilenames
    .filter((filename) => filename.endsWith(".js"))
    .map((filename) => Object.freeze({
      filename,
      source: fs.readFileSync(path.join(assetsDirectory, filename), "utf8"),
    }));
  const javascript = javascriptAssets.map(({ source }) => source).join("\n");
  const entryJavascript = assetPaths
    .filter((assetPath) => assetPath.endsWith(".js"))
    .map((assetPath) => fs.readFileSync(path.join(dist, assetPath), "utf8"))
    .join("\n");
  const javascriptBytes = Buffer.byteLength(javascript);
  if (!Number.isSafeInteger(maxJavascriptBytes) || maxJavascriptBytes <= 0) {
    throw new Error("JavaScript budget must be a positive safe integer");
  }
  if (javascriptBytes > maxJavascriptBytes) {
    throw new Error(
      `Production JavaScript budget exceeded: ${javascriptBytes} > ${maxJavascriptBytes} bytes`,
    );
  }
  const obsoleteWorkers = assetFilenames.filter((filename) =>
    /^ontology-layout\.worker-[A-Za-z0-9_-]{8,}\.js$/u.test(filename));
  if (obsoleteWorkers.length > 0) {
    throw new Error("Production bundle must not contain the superseded ontology layout Worker");
  }
  const packageManifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const declaredDependencies = {
    ...(packageManifest.dependencies ?? {}),
    ...(packageManifest.devDependencies ?? {}),
  };
  const obsoleteDependency = supersededRuntimeDependencies.find((name) =>
    Object.hasOwn(declaredDependencies, name));
  if (obsoleteDependency) {
    throw new Error(`Superseded graph runtime dependency is still declared: ${obsoleteDependency}`);
  }

  const canonicalAssetNames = assetFilenames.filter((filename) =>
    /^agent-ontology-[A-Za-z0-9_-]{8,}\.json$/u.test(filename));
  if (canonicalAssetNames.length !== 1) {
    throw new Error(
      `Production bundle must contain exactly one content-hashed canonical ontology asset; found ${canonicalAssetNames.length}`,
    );
  }
  const canonicalAssetName = canonicalAssetNames[0];
  if (!entryJavascript.includes(canonicalAssetName)) {
    throw new Error("Production JavaScript does not reference the canonical ontology asset");
  }
  if (!entryJavascript.includes(actual.commit_sha)) {
    throw new Error("Production JavaScript does not contain the manifest compiled build commit");
  }
  const canonicalAssetPath = `assets/${canonicalAssetName}`;
  const canonicalBytes = fs.readFileSync(path.join(dist, canonicalAssetPath));
  const publishedCanonicalPath = path.join(root, "src", "generated", "agent-ontology.json");
  if (!canonicalBytes.equals(fs.readFileSync(publishedCanonicalPath))) {
    throw new Error(
      "Production canonical ontology asset must be byte-identical to src/generated/agent-ontology.json",
    );
  }
  let canonical;
  try {
    canonical = JSON.parse(canonicalBytes.toString("utf8"));
  } catch {
    throw new Error("Production canonical ontology asset is not valid JSON");
  }
  const canonicalMetadata = canonical?.artifact_metadata ?? {};
  const canonicalComparisons = [
    ["canonical_version", canonicalMetadata.canonical_version ?? canonical?.id, actual.canonical_version],
    ["generator_version", canonicalMetadata.generator_version, actual.generator_version],
    ["source_fingerprint", canonicalMetadata.source_tree_sha256, actual.source_fingerprint],
    ["module_count", canonical?.modules?.length, actual.module_count],
    ["concept_count", canonical?.classes?.length, actual.concept_count],
    ["relation_count", currentRelationCount(canonical?.relations), actual.relation_count],
  ];
  const canonicalMismatch = canonicalComparisons.find(([, value, expected]) => value !== expected);
  if (canonicalMismatch) {
    throw new Error(`Production canonical ontology asset has stale ${canonicalMismatch[0]}`);
  }

  const communityGraph = communityVerifier({ root });
  if (actual.community_projection_fingerprint !== `sha256:${communityGraph.projectionSha256}`) {
    throw new Error("build-manifest has a stale community projection fingerprint");
  }
  if (!entryJavascript.includes(communityGraph.sourceSha256)) {
    throw new Error("Production JavaScript does not contain the current ontology community projection");
  }
  if (!entryJavascript.includes(communityGraph.projectionSha256)) {
    throw new Error("Production entry JavaScript does not contain the current community graph fingerprint");
  }
  const searchableArtifactText = `${entryJavascript}\n${canonicalBytes.toString("utf8")}`;
  for (const forbidden of forbiddenMarkers) {
    if (searchableArtifactText.includes(forbidden)) {
      throw new Error(`Production bundle still contains legacy marker: ${forbidden}`);
    }
  }
  for (const required of requiredMarkers) {
    if (!searchableArtifactText.includes(required)) {
      throw new Error(`Production bundle does not expose required marker: ${required}`);
    }
  }
  return Object.freeze({
    actual,
    assetPaths,
    canonicalAssetPath,
    canonicalAssetBytes: canonicalBytes.byteLength,
    javascriptBytes,
    communityGraph,
  });
};

if (isMainModule(import.meta.url)) {
  const result = verifySiteArtifact();
  console.log(
    `Verified dist site artifact for ${result.actual.commit_sha} with ` +
    `${result.communityGraph.communityCount} ontology communities`,
  );
}
