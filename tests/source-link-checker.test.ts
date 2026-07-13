import { createServer } from "node:http";

import { afterEach, describe, expect, it } from "vitest";

import { checkSourceLinks } from "../scripts/lib/source-link-checker.mjs";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        ),
    ),
  );
});

const startServer = async () => {
  const server = createServer((request, response) => {
    if (request.url === "/redirect") {
      response.writeHead(302, { location: "/ok" });
      response.end();
      return;
    }
    if (request.url === "/head-not-supported" && request.method === "HEAD") {
      response.writeHead(405, { allow: "GET" });
      response.end();
      return;
    }
    if (request.url === "/ok" || request.url === "/head-not-supported") {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("available");
      return;
    }
    if (request.url === "/slow") {
      setTimeout(() => {
        response.writeHead(200);
        response.end("late");
      }, 100);
      return;
    }
    response.writeHead(404);
    response.end("missing");
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP test server");
  return `http://127.0.0.1:${address.port}`;
};

describe("source link checker", () => {
  it("follows redirects and falls back to GET when HEAD is unsupported", async () => {
    const root = await startServer();
    const report = await checkSourceLinks(
      [
        { id: "redirect", url: `${root}/redirect` },
        { id: "fallback", url: `${root}/head-not-supported` },
      ],
      { concurrency: 2, timeoutMs: 500 },
    );

    expect(report.failures).toEqual([]);
    expect(report.results).toMatchObject([
      { id: "redirect", ok: true, method: "HEAD", status: 200 },
      { id: "fallback", ok: true, method: "GET", status: 200 },
    ]);
  });

  it("returns deterministic diagnostics for HTTP failures and timeouts", async () => {
    const root = await startServer();
    const report = await checkSourceLinks(
      [
        { id: "missing", url: `${root}/missing` },
        { id: "slow", url: `${root}/slow` },
      ],
      { concurrency: 1, timeoutMs: 20 },
    );

    expect(report.failures.map(({ id }) => id)).toEqual(["missing", "slow"]);
    expect(report.failures[0]).toMatchObject({ status: 404, method: "GET" });
    expect(report.failures[1]?.diagnostic).toMatch(/timeout|abort/iu);
  });

  it("validates concurrency and timeout boundaries before issuing requests", async () => {
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
  });
});
