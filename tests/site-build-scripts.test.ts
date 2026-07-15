import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { isMainModule } from "../scripts/lib/cli-entrypoint.mjs";
import {
  expectedSiteBuildManifest,
  readCanonicalIdentity,
  readCommunityProjectionIdentity,
  sha256Bytes,
} from "../scripts/lib/site-build-metadata.mjs";
import { verifyDeployment } from "../scripts/verify-deployment.mjs";
import { verifySiteArtifact as verifySiteArtifactImplementation } from "../scripts/verify-site-artifact.mjs";
import { writeSiteBuildManifest } from "../scripts/write-site-build-manifest.mjs";

const roots: string[] = [];

const manifest = Object.freeze({
  schema_version: "1.0.0" as const,
  commit_sha: "a".repeat(40),
  built_from_ref: "feature/ontology-v3",
  canonical_version: "https://moonweave.ai/ontology/agent-system/2.0.0/",
  generator_version: "moonweave-ontology-builder/2.0.0",
  source_fingerprint: "b".repeat(64),
  canonical_fingerprint: `sha256:${"e".repeat(64)}`,
  community_projection_fingerprint: `sha256:${"d".repeat(64)}`,
  module_count: 2,
  concept_count: 3,
  relation_count: 4,
});

const communityGraphFixture = Object.freeze({
  nodeCount: 8,
  edgeCount: 12,
  communityCount: 2,
  canonicalEdgeCount: 10,
  derivedEdgeCount: 2,
  sourceSha256: "c".repeat(64),
  projectionSha256: "d".repeat(64),
});

const verifySiteArtifact = (
  options: Parameters<typeof verifySiteArtifactImplementation>[0] = {},
) => verifySiteArtifactImplementation({
  ...options,
  communityVerifier: () => communityGraphFixture,
});

const temporaryRoot = (): string => {
  const root = mkdtempSync(resolve(tmpdir(), "moonweave-site-build-"));
  roots.push(root);
  return root;
};

const writeCanonical = (root: string, overrides: Record<string, unknown> = {}): Buffer => {
  mkdirSync(resolve(root, "ontology"), { recursive: true });
  const canonical = {
    id: manifest.canonical_version,
    artifact_metadata: {
      canonical_version: manifest.canonical_version,
      generator_version: manifest.generator_version,
      source_tree_sha256: manifest.source_fingerprint,
    },
    modules: [{ id: "one" }, { id: "two" }],
    classes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    relations: [
      { id: "r1", status: "accepted" },
      { id: "r2", status: "accepted" },
      { id: "r3", status: "accepted" },
      { id: "r4", status: "accepted" },
      { id: "r5", status: "deprecated" },
    ],
    ontology_metrics: {
      modules: 2,
      concepts: 3,
      is_a_relations: 1,
      semantic_relations: 3,
    },
    ...overrides,
  };
  const bytes = Buffer.from(`${JSON.stringify(canonical, null, 2)}\n`);
  writeFileSync(resolve(root, "ontology/agent-ontology.json"), bytes);
  mkdirSync(resolve(root, "src/generated"), { recursive: true });
  writeFileSync(resolve(root, "src/generated/ontology-community-graph.json"), JSON.stringify({
    source_sha256: sha256Bytes(bytes),
    projection_sha256: "d".repeat(64),
  }));
  return bytes;
};

const writeDist = (
  root: string,
  javascript = `vis-network-forceatlas2 forceAtlas2Based 委派与移交 网络访问控制 优化与学习 ${communityGraphFixture.sourceSha256} ${communityGraphFixture.projectionSha256}`,
): void => {
  const canonicalBytes = writeCanonical(root);
  mkdirSync(resolve(root, "dist/assets"), { recursive: true });
  writeFileSync(resolve(root, "package.json"), JSON.stringify({
    dependencies: { "vis-data": "^7.1.10", "vis-network": "^9.1.13" },
  }));
  const canonicalAssetName = "agent-ontology-12345678.json";
  writeFileSync(
    resolve(root, "dist/index.html"),
    '<!doctype html><script type="module" src="./assets/index-abcdef12.js"></script>',
    "utf8",
  );
  writeFileSync(
    resolve(root, "dist/assets/index-abcdef12.js"),
    `${javascript} ${manifest.commit_sha} ./assets/${canonicalAssetName}`,
    "utf8",
  );
  writeFileSync(resolve(root, `dist/assets/${canonicalAssetName}`), canonicalBytes);
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("site build metadata", () => {
  it("captures the stabilized Graphify visual baseline", () => {
    const captureScript = readFileSync(
      resolve(import.meta.dirname, "../scripts/capture-ontology-visual-baseline.mjs"),
      "utf8",
    );

    expect(captureScript).toContain("Graphify visual baseline");
  });

  it("copies generated metrics and fingerprints without reserializing canonical bytes", () => {
    const root = temporaryRoot();
    const canonicalBytes = writeCanonical(root);

    const actual = expectedSiteBuildManifest(root, {
      commitSha: manifest.commit_sha,
      builtFromRef: manifest.built_from_ref,
    });

    expect(actual).toEqual({
      ...manifest,
      canonical_fingerprint: `sha256:${sha256Bytes(canonicalBytes)}`,
    });
    expect(readCanonicalIdentity(root).canonicalBytes).toEqual(canonicalBytes);
  });

  it("counts only accepted relations while preserving deprecated lineage records", () => {
    const root = temporaryRoot();
    writeCanonical(root);

    expect(expectedSiteBuildManifest(root, {
      commitSha: manifest.commit_sha,
      builtFromRef: manifest.built_from_ref,
    }).relation_count).toBe(4);
  });

  it("rejects missing fingerprints and stale generated metrics", () => {
    const missingFingerprintRoot = temporaryRoot();
    writeCanonical(missingFingerprintRoot, { artifact_metadata: {} });
    expect(() => readCanonicalIdentity(missingFingerprintRoot)).toThrow(/source_tree_sha256/u);

    const staleMetricsRoot = temporaryRoot();
    writeCanonical(staleMetricsRoot, {
      ontology_metrics: { modules: 1, concepts: 3, is_a_relations: 1, semantic_relations: 3 },
    });
    expect(() => expectedSiteBuildManifest(staleMetricsRoot, {
      commitSha: manifest.commit_sha,
      builtFromRef: "test",
    })).toThrow(/metrics\/count mismatch/u);
  });

  it("binds the community projection identity to the exact canonical bytes", () => {
    const root = temporaryRoot();
    const canonicalBytes = writeCanonical(root);

    expect(readCommunityProjectionIdentity(root, canonicalBytes)).toEqual({
      projectionFingerprint: "d".repeat(64),
    });

    writeFileSync(resolve(root, "src/generated/ontology-community-graph.json"), JSON.stringify({
      source_sha256: sha256Bytes(Buffer.from("different canonical bytes")),
      projection_sha256: "d".repeat(64),
    }));
    expect(() => readCommunityProjectionIdentity(root, canonicalBytes))
      .toThrow(/source_sha256 must match/u);

    writeFileSync(resolve(root, "src/generated/ontology-community-graph.json"), JSON.stringify({
      source_sha256: sha256Bytes(canonicalBytes),
      projection_sha256: "D".repeat(64),
    }));
    expect(() => readCommunityProjectionIdentity(root, canonicalBytes))
      .toThrow(/projection_sha256 must be lowercase SHA-256/u);
  });

  it("identifies only the matching direct CLI entrypoint", () => {
    const path = resolve("scripts/write-site-build-manifest.mjs");
    expect(isMainModule(pathToFileURL(path).href, path)).toBe(true);
    expect(isMainModule(pathToFileURL(path).href, resolve("scripts/other.mjs"))).toBe(false);
    expect(isMainModule(pathToFileURL(path).href, undefined)).toBe(false);
  });
});

describe("site build manifest publication and artifact verification", () => {
  it("publishes the manifest atomically and verifies exact identity plus hashed assets", () => {
    const root = temporaryRoot();
    writeDist(root);

    const first = writeSiteBuildManifest({ root, manifest });
    const second = writeSiteBuildManifest({ root, manifest });
    expect(first.transaction).toEqual({ changed: 1, unchanged: 0 });
    expect(second.transaction).toEqual({ changed: 0, unchanged: 1 });
    expect(JSON.parse(readFileSync(first.target, "utf8"))).toEqual(manifest);

    const verified = verifySiteArtifact({ root, expectedManifest: manifest });
    expect(verified.actual).toEqual(manifest);
    expect(verified.assetPaths).toEqual(["assets/index-abcdef12.js"]);
    expect(verified.canonicalAssetPath).toBe("assets/agent-ontology-12345678.json");
    expect(verified.communityGraph).toEqual(communityGraphFixture);
    expect(verified.canonicalAssetBytes).toBeGreaterThan(0);
    expect(verified.javascriptBytes).toBeGreaterThan(0);
  });

  it("rejects obsolete layout workers and a stale NetworkX projection", () => {
    const obsoleteWorker = temporaryRoot();
    writeDist(obsoleteWorker);
    writeFileSync(resolve(obsoleteWorker, "dist/build-manifest.json"), JSON.stringify(manifest));
    writeFileSync(
      resolve(obsoleteWorker, "dist/assets/ontology-layout.worker-87654321.js"),
      "org.eclipse.elk ELK Box",
    );
    expect(() => verifySiteArtifact({ root: obsoleteWorker, expectedManifest: manifest }))
      .toThrow(/superseded ontology layout Worker/u);

    const staleProjection = temporaryRoot();
    writeDist(staleProjection, "vis-network-forceatlas2 forceAtlas2Based 委派与移交 网络访问控制 优化与学习");
    writeFileSync(resolve(staleProjection, "dist/build-manifest.json"), JSON.stringify(manifest));
    expect(() => verifySiteArtifact({ root: staleProjection, expectedManifest: manifest }))
      .toThrow(/current NetworkX community projection/u);

    const unreachableProjection = temporaryRoot();
    writeDist(
      unreachableProjection,
      `vis-network-forceatlas2 forceAtlas2Based 委派与移交 网络访问控制 优化与学习 ${communityGraphFixture.sourceSha256}`,
    );
    writeFileSync(
      resolve(unreachableProjection, "dist/assets/unreachable-12345678.js"),
      communityGraphFixture.projectionSha256,
    );
    writeFileSync(resolve(unreachableProjection, "dist/build-manifest.json"), JSON.stringify(manifest));
    expect(() => verifySiteArtifact({ root: unreachableProjection, expectedManifest: manifest }))
      .toThrow(/entry JavaScript.*community graph fingerprint/u);

    const staleProjectionManifest = temporaryRoot();
    writeDist(staleProjectionManifest);
    const staleManifest = {
      ...manifest,
      community_projection_fingerprint: `sha256:${"f".repeat(64)}`,
    };
    writeFileSync(
      resolve(staleProjectionManifest, "dist/build-manifest.json"),
      JSON.stringify(staleManifest),
    );
    expect(() => verifySiteArtifact({
      root: staleProjectionManifest,
      expectedManifest: staleManifest,
    })).toThrow(/stale community projection fingerprint/u);
  });

  it("fails closed for incomplete, stale, unhashed, missing, legacy, and marker-free artifacts", () => {
    const incomplete = temporaryRoot();
    expect(() => writeSiteBuildManifest({ root: incomplete, manifest })).toThrow(/index\.html/u);
    expect(() => verifySiteArtifact({ root: incomplete, expectedManifest: manifest })).toThrow(/incomplete/u);

    const stale = temporaryRoot();
    writeDist(stale);
    mkdirSync(resolve(stale, "dist"), { recursive: true });
    writeFileSync(resolve(stale, "dist/build-manifest.json"), JSON.stringify({ ...manifest, unexpected: true }));
    expect(() => verifySiteArtifact({ root: stale, expectedManifest: manifest })).toThrow(/exactly match/u);

    const unhashed = temporaryRoot();
    writeDist(unhashed);
    writeFileSync(resolve(unhashed, "dist/index.html"), '<script src="/repo/assets/index.js"></script>');
    writeFileSync(resolve(unhashed, "dist/build-manifest.json"), JSON.stringify(manifest));
    expect(() => verifySiteArtifact({ root: unhashed, expectedManifest: manifest })).toThrow(/not content-hashed/u);

    const missing = temporaryRoot();
    writeDist(missing);
    writeFileSync(resolve(missing, "dist/index.html"), '<script src="./assets/missing-abcdef12.js"></script>');
    writeFileSync(resolve(missing, "dist/build-manifest.json"), JSON.stringify(manifest));
    expect(() => verifySiteArtifact({ root: missing, expectedManifest: manifest })).toThrow(/does not exist/u);

    const missingCanonical = temporaryRoot();
    writeDist(missingCanonical);
    writeFileSync(resolve(missingCanonical, "dist/build-manifest.json"), JSON.stringify(manifest));
    rmSync(resolve(missingCanonical, "dist/assets/agent-ontology-12345678.json"));
    expect(() => verifySiteArtifact({
      root: missingCanonical,
      expectedManifest: manifest,
    })).toThrow(/canonical ontology asset/u);

    const driftedCanonical = temporaryRoot();
    writeDist(driftedCanonical);
    writeFileSync(resolve(driftedCanonical, "dist/build-manifest.json"), JSON.stringify(manifest));
    writeFileSync(
      resolve(driftedCanonical, "dist/assets/agent-ontology-12345678.json"),
      `${readFileSync(resolve(driftedCanonical, "ontology/agent-ontology.json"), "utf8")} `,
    );
    expect(() => verifySiteArtifact({
      root: driftedCanonical,
      expectedManifest: manifest,
    })).toThrow(/byte-identical/u);

    const legacy = temporaryRoot();
    writeDist(legacy, `continuous-local-force vis-network-forceatlas2 forceAtlas2Based 委派与移交 网络访问控制 优化与学习 ${communityGraphFixture.sourceSha256} ${communityGraphFixture.projectionSha256}`);
    writeFileSync(resolve(legacy, "dist/build-manifest.json"), JSON.stringify(manifest));
    expect(() => verifySiteArtifact({ root: legacy, expectedManifest: manifest })).toThrow(/legacy marker/u);

    const missingMarker = temporaryRoot();
    writeDist(missingMarker, `vis-network-forceatlas2 委派与移交 网络访问控制 ${communityGraphFixture.sourceSha256} ${communityGraphFixture.projectionSha256}`);
    writeFileSync(resolve(missingMarker, "dist/build-manifest.json"), JSON.stringify(manifest));
    expect(() => verifySiteArtifact({ root: missingMarker, expectedManifest: manifest })).toThrow(/required marker/u);

    const oversizedJavaScript = temporaryRoot();
    writeDist(oversizedJavaScript);
    writeFileSync(resolve(oversizedJavaScript, "dist/build-manifest.json"), JSON.stringify(manifest));
    expect(() => verifySiteArtifact({
      root: oversizedJavaScript,
      expectedManifest: manifest,
      maxJavascriptBytes: 32,
    })).toThrow(/JavaScript budget/u);

    const staleBundle = temporaryRoot();
    writeDist(staleBundle);
    writeFileSync(resolve(staleBundle, "dist/build-manifest.json"), JSON.stringify(manifest));
    const staleBundlePath = resolve(staleBundle, "dist/assets/index-abcdef12.js");
    writeFileSync(
      staleBundlePath,
      readFileSync(staleBundlePath, "utf8").replace(manifest.commit_sha, "b".repeat(40)),
    );
    expect(() => verifySiteArtifact({ root: staleBundle, expectedManifest: manifest }))
      .toThrow(/compiled build commit/u);
  });
});

describe("deployed manifest verification", () => {
  it("retries stale responses and returns only the expected full commit", async () => {
    const expectedCommitSha = "A".repeat(40);
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(new Response("pending", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ commit_sha: "b".repeat(40) }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ commit_sha: "a".repeat(40) }), { status: 200 }));
    const wait = vi.fn(async () => undefined);

    const result = await verifyDeployment({
      deploymentUrl: "https://example.test/moonweave/",
      expectedCommitSha,
      fetchImplementation,
      delays: [0, 1, 2],
      wait,
    });

    expect(result.manifest.commit_sha).toBe("a".repeat(40));
    expect(result.manifestUrl).toContain("/moonweave/build-manifest.json?verify=");
    expect(fetchImplementation).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls).toEqual([[1], [2]]);
    expect(fetchImplementation).toHaveBeenLastCalledWith(
      expect.any(URL),
      expect.objectContaining({ cache: "no-store", redirect: "manual" }),
    );
  });

  it("requires HTTPS except for exact loopback test servers", async () => {
    await expect(verifyDeployment({
      deploymentUrl: "http://example.test/moonweave/",
      expectedCommitSha: manifest.commit_sha,
      delays: [0],
    })).rejects.toThrow(/HTTPS/u);
    await expect(verifyDeployment({
      deploymentUrl: "http://localhost.example.test/",
      expectedCommitSha: manifest.commit_sha,
      delays: [0],
    })).rejects.toThrow(/HTTPS/u);

    for (const deploymentUrl of [
      "http://localhost:4173/",
      "http://127.0.0.1:4173/",
      "http://[::1]:4173/",
    ]) {
      const fetchImplementation = vi.fn(async (input: string | URL | Request) => {
        const response = new Response(JSON.stringify({ commit_sha: manifest.commit_sha }));
        Object.defineProperty(response, "url", { value: input.toString() });
        return response;
      });
      await expect(verifyDeployment({
        deploymentUrl,
        expectedCommitSha: manifest.commit_sha,
        fetchImplementation,
        delays: [0],
      })).resolves.toMatchObject({ manifest: { commit_sha: manifest.commit_sha } });
    }
  });

  it("rejects redirects and a response URL outside the requested HTTPS origin", async () => {
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/moonweave/",
      expectedCommitSha: manifest.commit_sha,
      fetchImplementation: async () => new Response(null, {
        status: 302,
        headers: { Location: "https://attacker.test/build-manifest.json" },
      }),
      delays: [0],
    })).rejects.toThrow(/redirect/u);

    const followedRedirect = new Response(JSON.stringify({ commit_sha: manifest.commit_sha }));
    Object.defineProperties(followedRedirect, {
      redirected: { value: true },
      url: { value: "https://example.test/moonweave/build-manifest.json" },
    });
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/moonweave/",
      expectedCommitSha: manifest.commit_sha,
      fetchImplementation: async () => followedRedirect,
      delays: [0],
    })).rejects.toThrow(/redirect/u);

    const crossOriginResponse = new Response(JSON.stringify({ commit_sha: manifest.commit_sha }));
    Object.defineProperty(crossOriginResponse, "url", {
      value: "https://attacker.test/build-manifest.json",
    });
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/moonweave/",
      expectedCommitSha: manifest.commit_sha,
      fetchImplementation: async () => crossOriginResponse,
      delays: [0],
    })).rejects.toThrow(/same origin/u);
  });

  it("rejects unsafe inputs, malformed manifests, invalid delays, and empty attempts", async () => {
    await expect(verifyDeployment()).rejects.toThrow(/required/u);
    await expect(verifyDeployment({
      deploymentUrl: "file:///tmp/site/",
      expectedCommitSha: "a".repeat(40),
      delays: [0],
    })).rejects.toThrow(/HTTP\(S\)/u);
    await expect(verifyDeployment({
      deploymentUrl: "https://user:secret@example.test/",
      expectedCommitSha: "a".repeat(40),
      delays: [0],
    })).rejects.toThrow(/credentials/u);
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/",
      expectedCommitSha: "short",
      delays: [0],
    })).rejects.toThrow(/full lowercase Git SHA/u);
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/",
      expectedCommitSha: "a".repeat(40),
      fetchImplementation: async () => new Response(JSON.stringify({ commit_sha: "HEAD" })),
      delays: [0],
    })).rejects.toThrow(/invalid commit_sha/u);
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/",
      expectedCommitSha: "a".repeat(40),
      delays: [-1],
    })).rejects.toThrow(/retry delay/u);
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/",
      expectedCommitSha: "a".repeat(40),
      attemptTimeoutMs: 0,
      delays: [0],
    })).rejects.toThrow(/timeout/u);
    await expect(verifyDeployment({
      deploymentUrl: "https://example.test/",
      expectedCommitSha: "a".repeat(40),
      delays: [],
    })).rejects.toThrow(/No deployment verification attempts/u);
  });

  it("gives every stalled deployment request an independent deadline before retrying", async () => {
    const attemptSignals: AbortSignal[] = [];
    const fetchImplementation = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
      attemptSignals.push(init?.signal as AbortSignal);
      return new Promise<Response>(() => undefined);
    });
    const verification = verifyDeployment({
      deploymentUrl: "https://example.test/moonweave/",
      expectedCommitSha: "a".repeat(40),
      fetchImplementation,
      delays: [0, 0],
      attemptTimeoutMs: 2,
    });
    const guarded = Promise.race([
      verification,
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error("test guard expired")), 100);
      }),
    ]);

    await expect(guarded).rejects.toThrow(/timed out after 2 ms/u);
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(new Set(attemptSignals).size).toBe(2);
    expect(attemptSignals.every((signal) => signal.aborted)).toBe(true);
  });

  it("keeps the per-attempt deadline active while reading the response body", async () => {
    const attemptSignals: AbortSignal[] = [];
    const fetchImplementation = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
      attemptSignals.push(init?.signal as AbortSignal);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => new Promise<never>(() => undefined),
      } as unknown as Response);
    });
    const verification = verifyDeployment({
      deploymentUrl: "https://example.test/moonweave/",
      expectedCommitSha: "a".repeat(40),
      fetchImplementation,
      delays: [0, 0],
      attemptTimeoutMs: 2,
    });
    const guarded = Promise.race([
      verification,
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error("test guard expired")), 100);
      }),
    ]);

    await expect(guarded).rejects.toThrow(/timed out after 2 ms/u);
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(new Set(attemptSignals).size).toBe(2);
    expect(attemptSignals.every((signal) => signal.aborted)).toBe(true);
  });
});
