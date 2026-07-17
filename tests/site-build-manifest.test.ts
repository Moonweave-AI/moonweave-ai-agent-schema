import { describe, expect, it, vi } from "vitest";

import { compiledBuildCommitSha } from "../src/lib/site-build-identity";
import {
  canonicalIdentityForOntology,
  loadSiteBuildManifest,
  siteBuildManifestSchema,
  siteBuildManifestUrl,
  SiteBuildManifestMismatchError,
} from "../src/lib/site-build-manifest";
import { assertBuildCommitSha } from "../src/lib/site-build-identity";

const manifest = {
  schema_version: "1.0.0" as const,
  commit_sha: compiledBuildCommitSha,
  built_from_ref: "main",
  canonical_version: "https://moonweave.ai/ontology/agent-system/2.0.0/",
  generator_version: "2.0.0",
  source_fingerprint: "b".repeat(64),
  canonical_fingerprint: `sha256:${"e".repeat(64)}`,
  community_projection_fingerprint: `sha256:${"d".repeat(64)}`,
  module_count: 45,
  concept_count: 627,
  relation_count: 926,
};

const identity = {
  canonicalVersion: manifest.canonical_version,
  generatorVersion: manifest.generator_version,
  sourceFingerprint: manifest.source_fingerprint,
  canonicalFingerprint: manifest.canonical_fingerprint,
  communityProjectionFingerprint: manifest.community_projection_fingerprint,
  moduleCount: manifest.module_count,
  conceptCount: manifest.concept_count,
  relationCount: manifest.relation_count,
};

describe("site build manifest", () => {
  it("joins the Vite base URL without losing a nested Pages path", () => {
    expect(siteBuildManifestUrl("/moonweave-ai/")).toBe("/moonweave-ai/build-manifest.json");
    expect(siteBuildManifestUrl("./")).toBe("./build-manifest.json");
  });

  it("rejects malformed SHA, fingerprint, and count values", () => {
    expect(() => siteBuildManifestSchema.parse({ ...manifest, commit_sha: "HEAD" })).toThrow();
    expect(() => siteBuildManifestSchema.parse({ ...manifest, source_fingerprint: "xyz" })).toThrow();
    expect(() => siteBuildManifestSchema.parse({
      ...manifest,
      community_projection_fingerprint: `sha256:${"D".repeat(64)}`,
    })).toThrow();
    expect(() => siteBuildManifestSchema.parse({ ...manifest, module_count: -1 })).toThrow();
    expect(() => siteBuildManifestSchema.parse({
      ...manifest,
      evidence_fingerprint: "c".repeat(64),
    })).toThrow();
  });

  it("derives all build identity fields and uses explicit legacy fallbacks", () => {
    const canonical = {
      id: "canonical-fallback",
      artifact_metadata: {
        canonical_version: "canonical-v3",
        generator_version: "generator-v3",
        source_tree_sha256: "c".repeat(64),
      },
      modules: [{ id: "module-one" }, { id: "module-two" }],
      classes: [{ id: "ConceptOne" }],
      relations: [
        { id: "relation-one", status: "accepted" },
        { id: "relation-deprecated", status: "deprecated" },
      ],
    } as unknown as Parameters<typeof canonicalIdentityForOntology>[0];
    expect(canonicalIdentityForOntology(
      canonical,
      `sha256:${"d".repeat(64)}`,
      `sha256:${"a".repeat(64)}`,
    )).toEqual({
      canonicalVersion: "canonical-v3",
      generatorVersion: "generator-v3",
      sourceFingerprint: "c".repeat(64),
      canonicalFingerprint: `sha256:${"d".repeat(64)}`,
      communityProjectionFingerprint: `sha256:${"a".repeat(64)}`,
      moduleCount: 2,
      conceptCount: 1,
      relationCount: 1,
    });

    const legacyCanonical = {
      ...canonical,
      id: "legacy-canonical-id",
      artifact_metadata: undefined,
    } as unknown as Parameters<typeof canonicalIdentityForOntology>[0];
    expect(canonicalIdentityForOntology(
      legacyCanonical,
      "legacy-fingerprint",
      "legacy-community-fingerprint",
    )).toMatchObject({
      canonicalVersion: "legacy-canonical-id",
      generatorVersion: "unknown",
      sourceFingerprint: "",
    });
  });

  it("accepts full lowercase commit identities and rejects untrusted build constants", () => {
    expect(assertBuildCommitSha("a".repeat(64))).toBe("a".repeat(64));
    expect(() => assertBuildCommitSha("A".repeat(40))).toThrow(/lowercase Git SHA/u);
    expect(() => assertBuildCommitSha(42)).toThrow(/lowercase Git SHA/u);
  });

  it("loads with no-store and validates identity against the loaded canonical ontology", async () => {
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify(manifest), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    await expect(loadSiteBuildManifest({ baseUrl: "/app/", fetchImplementation, identity })).resolves.toEqual(manifest);
    expect(fetchImplementation).toHaveBeenCalledWith(
      "/app/build-manifest.json",
      expect.objectContaining({ cache: "no-store", redirect: "error" }),
    );
  });

  it("reports HTTP and JSON failures without fabricating build identity", async () => {
    await expect(loadSiteBuildManifest({
      fetchImplementation: async () => new Response("missing", { status: 404 }),
      identity,
    })).rejects.toThrow("HTTP 404");
    await expect(loadSiteBuildManifest({
      fetchImplementation: async () => new Response("{", { status: 200 }),
      identity,
    })).rejects.toThrow();
  });

  it("rejects a manifest from a different bundle even when its shape is valid", async () => {
    const differentCommitSha = compiledBuildCommitSha.startsWith("a")
      ? "b".repeat(40)
      : "a".repeat(40);
    await expect(loadSiteBuildManifest({
      fetchImplementation: async () => new Response(JSON.stringify({
        ...manifest,
        commit_sha: differentCommitSha,
      }), { status: 200 }),
      identity,
    })).rejects.toBeInstanceOf(SiteBuildManifestMismatchError);
    await expect(loadSiteBuildManifest({
      fetchImplementation: async () => new Response(JSON.stringify({ ...manifest, module_count: 48 }), { status: 200 }),
      identity,
    })).rejects.toBeInstanceOf(SiteBuildManifestMismatchError);
    await expect(loadSiteBuildManifest({
      fetchImplementation: async () => new Response(JSON.stringify({
        ...manifest,
        canonical_fingerprint: `sha256:${"f".repeat(64)}`,
      }), { status: 200 }),
      identity,
    })).rejects.toBeInstanceOf(SiteBuildManifestMismatchError);
  });

  it.each([
    ["canonical_version", "different-canonical-version"],
    ["generator_version", "different-generator-version"],
    ["source_fingerprint", "f".repeat(64)],
    ["community_projection_fingerprint", `sha256:${"f".repeat(64)}`],
    ["concept_count", manifest.concept_count + 1],
    ["relation_count", manifest.relation_count + 1],
  ] as const)("identifies %s drift before showing a ready build identity", async (field, value) => {
    await expect(loadSiteBuildManifest({
      fetchImplementation: async () => new Response(JSON.stringify({
        ...manifest,
        [field]: value,
      }), { status: 200 }),
      identity,
      retryDelaysMs: [0],
    })).rejects.toThrow(`${field} does not match`);
  });

  it.each([408, 429, 500])("retries transient HTTP %i without accepting the failed response", async (status) => {
    const fetchImplementation = vi.fn()
      .mockResolvedValueOnce(new Response("retry", { status }))
      .mockResolvedValueOnce(new Response(JSON.stringify(manifest), { status: 200 }));

    await expect(loadSiteBuildManifest({
      fetchImplementation,
      identity,
      retryDelaysMs: [0, 0],
    })).resolves.toEqual(manifest);
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it("retries a network TypeError after a bounded delay", async () => {
    vi.useFakeTimers();
    try {
      const fetchImplementation = vi.fn()
        .mockRejectedValueOnce(new TypeError("network disconnected"))
        .mockResolvedValueOnce(new Response(JSON.stringify(manifest), { status: 200 }));
      const pending = loadSiteBuildManifest({
        fetchImplementation,
        identity,
        retryDelaysMs: [0, 25],
      });

      await vi.runAllTimersAsync();
      await expect(pending).resolves.toEqual(manifest);
      expect(fetchImplementation).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels while waiting for a retry and never starts the next request", async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const fetchImplementation = vi.fn().mockRejectedValueOnce(new TypeError("offline"));
      const pending = loadSiteBuildManifest({
        fetchImplementation,
        identity,
        signal: controller.signal,
        retryDelaysMs: [0, 100],
      });
      await Promise.resolve();
      await Promise.resolve();
      controller.abort(new DOMException("navigation", "AbortError"));

      await expect(pending).rejects.toMatchObject({ name: "AbortError" });
      expect(fetchImplementation).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the configured global fetch and normalizes a base URL without a trailing slash", async () => {
    const fetchImplementation = vi.fn(async () =>
      new Response(JSON.stringify(manifest), { status: 200 }));
    vi.stubGlobal("fetch", fetchImplementation);
    try {
      await expect(loadSiteBuildManifest({
        baseUrl: "/nested-app",
        identity,
        retryDelaysMs: [0],
      })).resolves.toEqual(manifest);
      expect(fetchImplementation).toHaveBeenCalledWith(
        "/nested-app/build-manifest.json",
        expect.objectContaining({ cache: "no-store", redirect: "error" }),
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("honors an already-aborted signal even when an older signal omits a reason", async () => {
    const signalWithoutReason = {
      aborted: true,
      reason: undefined,
    } as unknown as AbortSignal;
    const fetchImplementation = vi.fn();

    await expect(loadSiteBuildManifest({
      fetchImplementation,
      identity,
      signal: signalWithoutReason,
      retryDelaysMs: [0],
    })).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("times out each stalled attempt and retries within a fixed bound", async () => {
    const attemptSignals: AbortSignal[] = [];
    const fetchImplementation = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      attemptSignals.push(init?.signal as AbortSignal);
      return new Promise<Response>(() => undefined);
    });
    const pending = loadSiteBuildManifest({
      fetchImplementation,
      identity,
      attemptTimeoutMs: 2,
      retryDelaysMs: [0, 0],
    });
    const guarded = Promise.race([
      pending,
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error("test guard expired")), 100);
      }),
    ]);

    await expect(guarded).rejects.toThrow(/timed out after 2 ms/u);
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(new Set(attemptSignals).size).toBe(2);
    expect(attemptSignals.every((signal) => signal.aborted)).toBe(true);
  });

  it("propagates an external abort without starting another retry", async () => {
    const controller = new AbortController();
    const fetchImplementation = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
      }));
    const pending = loadSiteBuildManifest({
      fetchImplementation,
      identity,
      signal: controller.signal,
      attemptTimeoutMs: 1_000,
      retryDelaysMs: [0, 0, 0],
    });

    controller.abort(new DOMException("caller cancelled", "AbortError"));

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });

  it("rejects unsafe deadline and retry configurations before requesting", async () => {
    const fetchImplementation = vi.fn();

    await expect(loadSiteBuildManifest({
      fetchImplementation,
      identity,
      attemptTimeoutMs: 0,
    })).rejects.toThrow(/timeout/u);
    await expect(loadSiteBuildManifest({
      fetchImplementation,
      identity,
      retryDelaysMs: [],
    })).rejects.toThrow(/At least one/u);
    await expect(loadSiteBuildManifest({
      fetchImplementation,
      identity,
      retryDelaysMs: [-1],
    })).rejects.toThrow(/retry delay/u);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});
