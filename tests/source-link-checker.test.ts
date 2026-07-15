import { describe, expect, it, vi } from "vitest";

import { checkSourceLinks } from "../scripts/lib/source-link-checker.mjs";

const PUBLIC_IPV4 = "93.184.216.34";

const publicDns = vi.fn(async () => [{ address: PUBLIC_IPV4, family: 4 }] as const);

const response = (status: number, location?: string) => ({
  status,
  url: "",
  headers: new Headers(location ? { location } : undefined),
});

describe("source link checker", () => {
  it("manually validates every redirect hop and falls back to GET when HEAD is unsupported", async () => {
    const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      expect(init?.redirect).toBe("manual");
      if (url === "https://source.example.test/redirect") {
        return response(302, "https://target.example.test/ok") as Response;
      }
      if (url === "https://source.example.test/head-not-supported" && init?.method === "HEAD") {
        return response(405) as Response;
      }
      return response(200) as Response;
    });

    const report = await checkSourceLinks(
      [
        { id: "redirect", url: "https://source.example.test/redirect" },
        { id: "fallback", url: "https://source.example.test/head-not-supported" },
      ],
      { concurrency: 2, timeoutMs: 500, fetchImpl, dnsLookupImpl: publicDns },
    );

    expect(report.failures).toEqual([]);
    expect(report.results).toMatchObject([
      {
        id: "redirect",
        ok: true,
        method: "HEAD",
        status: 200,
        finalUrl: "https://target.example.test/ok",
      },
      { id: "fallback", ok: true, method: "GET", status: 200 },
    ]);
    expect(publicDns).toHaveBeenCalledWith("source.example.test", expect.any(Object));
    expect(publicDns).toHaveBeenCalledWith("target.example.test", expect.any(Object));
  });

  it.each([
    "http://0.0.0.0/",
    "http://10.0.0.1/",
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://172.16.0.1/",
    "http://192.168.0.1/",
    "http://192.0.2.1/",
    "http://198.18.0.1/",
    "http://224.0.0.1/",
    "http://[::1]/",
    "http://[::2]/",
    "http://[fc00::1]/",
    "http://[fe80::1]/",
    "http://[2001:db8::1]/",
    "http://[4000::1]/",
    "http://[::ffff:10.0.0.1]/",
  ])("rejects non-public IP literal %s before fetch", async (url) => {
    const fetchImpl = vi.fn();

    const report = await checkSourceLinks([{ id: "blocked", url }], {
      fetchImpl,
      dnsLookupImpl: publicDns,
    });

    expect(report.failures[0]).toMatchObject({ id: "blocked", ok: false, status: null });
    expect(report.failures[0]?.diagnostic).toMatch(/blocked|non-public|unsafe/iu);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a hostname when any DNS answer is private or reserved", async () => {
    const fetchImpl = vi.fn();
    const dnsLookupImpl = vi.fn(async () => [
      { address: PUBLIC_IPV4, family: 4 },
      { address: "::ffff:192.168.1.8", family: 6 },
    ]);

    const report = await checkSourceLinks(
      [{ id: "rebind", url: "https://rebind.example.test/spec" }],
      { fetchImpl, dnsLookupImpl },
    );

    expect(report.failures[0]?.diagnostic).toMatch(/192\.168\.1\.8|non-public/iu);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("blocks a redirect to link-local metadata before issuing the redirected request", async () => {
    const fetchImpl = vi.fn(async () =>
      response(302, "http://169.254.169.254/latest/meta-data/") as Response,
    );

    const report = await checkSourceLinks(
      [{ id: "redirect-to-metadata", url: "https://public.example.test/spec" }],
      { fetchImpl, dnsLookupImpl: publicDns },
    );

    expect(report.failures[0]?.diagnostic).toMatch(/redirect|169\.254\.169\.254|non-public/iu);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stops deterministic redirect loops at the configured maximum", async () => {
    const fetchImpl = vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      const hop = Number(url.searchParams.get("hop") ?? "0") + 1;
      return response(302, `https://public.example.test/spec?hop=${hop}`) as Response;
    });

    const report = await checkSourceLinks(
      [{ id: "loop", url: "https://public.example.test/spec" }],
      { fetchImpl, dnsLookupImpl: publicDns, maxRedirects: 2 },
    );

    expect(report.failures[0]?.diagnostic).toMatch(/redirect.*(?:limit|maximum)|too many/iu);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("returns deterministic diagnostics for HTTP failures and timeouts", async () => {
    const timeout = new DOMException("timed out", "AbortError");
    const fetchImpl = vi.fn(async (input: string | URL) => {
      if (String(input).includes("slow")) throw timeout;
      return response(404) as Response;
    });
    const report = await checkSourceLinks(
      [
        { id: "missing", url: "https://public.example.test/missing" },
        { id: "slow", url: "https://public.example.test/slow" },
      ],
      { concurrency: 1, timeoutMs: 20, fetchImpl, dnsLookupImpl: publicDns },
    );

    expect(report.failures.map(({ id }) => id)).toEqual(["missing", "slow"]);
    expect(report.failures[0]).toMatchObject({ status: 404, method: "GET" });
    expect(report.failures[1]?.diagnostic).toMatch(/timeout|abort/iu);
  });

  it("validates concurrency, timeout, and redirect boundaries before issuing requests", async () => {
    await expect(
      checkSourceLinks([{ id: "x", url: "https://example.test" }], {
        concurrency: 0,
        timeoutMs: 100,
      }),
    ).rejects.toThrow(/concurrency/iu);
    await expect(
      checkSourceLinks([{ id: "x", url: "https://example.test" }], {
        concurrency: 1,
        timeoutMs: 0,
      }),
    ).rejects.toThrow(/timeout/iu);
    await expect(
      checkSourceLinks([{ id: "x", url: "https://example.test" }], {
        maxRedirects: 11,
      }),
    ).rejects.toThrow(/redirect/iu);
  });
});
