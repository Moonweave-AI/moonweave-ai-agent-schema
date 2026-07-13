const requestLink = async ({ source, method, timeoutMs, fetchImpl }) => {
  try {
    const response = await fetchImpl(source.url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: method === "GET" ? { range: "bytes=0-0" } : undefined,
    });
    return {
      id: source.id,
      url: source.url,
      finalUrl: response.url || source.url,
      ok: response.status >= 200 && response.status < 400,
      method,
      status: response.status,
      diagnostic:
        response.status >= 200 && response.status < 400
          ? `reachable via ${method}`
          : `${method} returned HTTP ${response.status}`,
    };
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return {
      id: source.id,
      url: source.url,
      finalUrl: null,
      ok: false,
      method,
      status: null,
      diagnostic: timedOut
        ? `${method} timed out or was aborted after ${timeoutMs}ms`
        : `${method} request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

const checkOneSourceLink = async (source, options) => {
  const head = await requestLink({ source, method: "HEAD", ...options });
  if (head.ok || head.status === null || head.status < 400) return head;
  const get = await requestLink({ source, method: "GET", ...options });
  if (get.ok) return get;
  return {
    ...get,
    diagnostic: `${head.diagnostic}; fallback ${get.diagnostic}`,
  };
};

const requirePositiveInteger = (label, value, maximum) => {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${label} must be an integer between 1 and ${maximum}`);
  }
};

export const checkSourceLinks = async (
  sources,
  { concurrency = 12, timeoutMs = 10_000, fetchImpl = globalThis.fetch } = {},
) => {
  requirePositiveInteger("concurrency", concurrency, 64);
  requirePositiveInteger("timeoutMs", timeoutMs, 120_000);
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
  const seen = new Set();
  for (const source of sources) {
    if (!source?.id || !source?.url) throw new Error("Every source link requires a non-empty id and url");
    if (seen.has(source.id)) throw new Error(`Duplicate source link ID ${source.id}`);
    seen.add(source.id);
  }

  const results = new Array(sources.length);
  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= sources.length) return;
      results[index] = await checkOneSourceLink(sources[index], { timeoutMs, fetchImpl });
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, sources.length) }, () => worker()),
  );
  return {
    checked: results.length,
    results,
    failures: results.filter(({ ok }) => !ok),
  };
};
