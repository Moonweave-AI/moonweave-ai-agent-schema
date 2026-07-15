import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { loadCanonicalOntologyAsset } from "../src/lib/canonical-ontology-client";

describe("canonical ontology browser loading", () => {
  it("keeps the full canonical JSON out of the application and manifest modules", () => {
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    const manifest = readFileSync(
      new URL("../src/lib/site-build-manifest.ts", import.meta.url),
      "utf8",
    );
    const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");

    expect(app).not.toMatch(/from\s+["'][^"']*agent-ontology\.json["']/u);
    expect(manifest).not.toMatch(/from\s+["'][^"']*agent-ontology\.json["']/u);
    expect(main).toContain("loadCanonicalOntologyAsset");
  });

  it("keeps bootstrap failure recoverable and cancels superseded canonical requests", () => {
    const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");

    expect(main).toContain("new AbortController()");
    expect(main).toMatch(/activeLoadController\?\.abort\(\)/u);
    expect(main).toContain('data-testid="ontology-load-retry"');
    expect(main).toMatch(/onClick=\{\(\) => void bootstrap\(\)\}/u);
  });

  it("loads the content-hashed canonical asset once and fingerprints its exact response bytes", async () => {
    const payload = Object.freeze({ id: "canonical-fixture", modules: [] });
    const responseBytes = JSON.stringify(payload, null, 2);
    const canonicalFingerprint = `sha256:${createHash("sha256")
      .update(responseBytes).digest("hex")}`;
    const fetchImplementation = vi.fn(async () => new Response(responseBytes, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(loadCanonicalOntologyAsset({
      assetUrl: "/assets/agent-ontology-deadbeef.json",
      fetchImplementation,
    })).resolves.toEqual({ ontology: payload, canonicalFingerprint });
    expect(fetchImplementation).toHaveBeenCalledWith(
      "/assets/agent-ontology-deadbeef.json",
      expect.objectContaining({ credentials: "same-origin", redirect: "error" }),
    );
  });

  it("rejects cross-origin final URLs and oversized canonical responses", async () => {
    const crossOriginResponse = new Response("{}", { status: 200 });
    Object.defineProperty(crossOriginResponse, "url", {
      value: "https://untrusted.example/agent-ontology.json",
    });
    await expect(loadCanonicalOntologyAsset({
      assetUrl: "https://moonweave.example/assets/agent-ontology.json",
      fetchImplementation: async () => crossOriginResponse,
    })).rejects.toThrow(/same-origin/u);

    await expect(loadCanonicalOntologyAsset({
      assetUrl: "/assets/oversized.json",
      fetchImplementation: async () => new Response("{}", {
        status: 200,
        headers: { "Content-Length": String(64 * 1024 * 1024 + 1) },
      }),
    })).rejects.toThrow(/64 MiB/u);
  });

  it("cancels a lengthless response stream as soon as decoded bytes cross the cap", async () => {
    const cancel = vi.fn();
    let pullCount = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pullCount += 1;
        controller.enqueue(new Uint8Array(pullCount === 1 ? 3 : 2));
      },
      cancel,
    });

    await expect(loadCanonicalOntologyAsset({
      assetUrl: "/assets/chunked.json",
      maximumBytes: 4,
      fetchImplementation: async () => new Response(body, { status: 200 }),
    })).rejects.toThrow(/byte limit/u);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("rejects HTTP and malformed JSON responses instead of booting stale data", async () => {
    await expect(loadCanonicalOntologyAsset({
      assetUrl: "/missing.json",
      fetchImplementation: async () => new Response("missing", { status: 404 }),
    })).rejects.toThrow("HTTP 404");

    await expect(loadCanonicalOntologyAsset({
      assetUrl: "/invalid.json",
      fetchImplementation: async () => new Response("{", { status: 200 }),
    })).rejects.toThrow();
  });
});
