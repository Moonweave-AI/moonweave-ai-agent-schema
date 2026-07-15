import { lookup as defaultDnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECT_LIMIT = 10;

const ipv4Value = (address) =>
  address
    .split(".")
    .map(Number)
    .reduce((value, octet) => value * 256 + octet, 0);

const ipv4Cidr = (network, prefixLength) => ({
  network: ipv4Value(network),
  mask: prefixLength === 0 ? 0 : (0xffffffff << (32 - prefixLength)) >>> 0,
});

const BLOCKED_IPV4_RANGES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.31.196.0", 24],
  ["192.52.193.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["192.175.48.0", 24],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
].map(([network, prefixLength]) => ipv4Cidr(network, prefixLength));

const isBlockedIpv4 = (address) => {
  if (isIP(address) !== 4) return true;
  const value = ipv4Value(address) >>> 0;
  return BLOCKED_IPV4_RANGES.some(
    ({ network, mask }) => (value & mask) >>> 0 === (network & mask) >>> 0,
  );
};

const expandEmbeddedIpv4 = (address) => {
  const lastColon = address.lastIndexOf(":");
  const ipv4 = address.slice(lastColon + 1);
  if (!ipv4.includes(".") || isIP(ipv4) !== 4) return address;
  const value = ipv4Value(ipv4);
  const high = ((value >>> 16) & 0xffff).toString(16);
  const low = (value & 0xffff).toString(16);
  return `${address.slice(0, lastColon + 1)}${high}:${low}`;
};

const parseIpv6 = (rawAddress) => {
  const address = expandEmbeddedIpv4(rawAddress.toLowerCase());
  if (address.includes("%") || address.split("::").length > 2) return null;
  const [leftText, rightText] = address.split("::");
  const left = leftText ? leftText.split(":") : [];
  const right = rightText ? rightText.split(":") : [];
  const hasCompression = address.includes("::");
  const missing = 8 - left.length - right.length;
  if ((hasCompression && missing < 1) || (!hasCompression && missing !== 0)) return null;
  const hextets = [
    ...left,
    ...Array.from({ length: hasCompression ? missing : 0 }, () => "0"),
    ...right,
  ];
  if (
    hextets.length !== 8 ||
    hextets.some((part) => !/^[0-9a-f]{1,4}$/u.test(part))
  ) {
    return null;
  }
  return hextets.map((part) => Number.parseInt(part, 16));
};

const ipv6Value = (address) => {
  const hextets = parseIpv6(address);
  if (!hextets) return null;
  return hextets.reduce((value, part) => (value << 16n) | BigInt(part), 0n);
};

const ipv6Cidr = (network, prefixLength) => {
  const value = ipv6Value(network);
  if (value === null) throw new Error(`Invalid internal IPv6 range ${network}`);
  const shift = BigInt(128 - prefixLength);
  return { prefix: value >> shift, shift };
};

const BLOCKED_IPV6_RANGES = [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
  ["5f00::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
].map(([network, prefixLength]) => ipv6Cidr(network, prefixLength));

const GLOBAL_IPV6_RANGE = ipv6Cidr("2000::", 3);

const mappedIpv4 = (hextets) => {
  if (!hextets.slice(0, 5).every((part) => part === 0) || hextets[5] !== 0xffff) {
    return null;
  }
  return `${hextets[6] >> 8}.${hextets[6] & 0xff}.${hextets[7] >> 8}.${hextets[7] & 0xff}`;
};

const isBlockedIpv6 = (address) => {
  const hextets = parseIpv6(address);
  if (!hextets) return true;
  const mapped = mappedIpv4(hextets);
  if (mapped) return isBlockedIpv4(mapped);
  const value = hextets.reduce((result, part) => (result << 16n) | BigInt(part), 0n);
  if (value >> GLOBAL_IPV6_RANGE.shift !== GLOBAL_IPV6_RANGE.prefix) return true;
  return BLOCKED_IPV6_RANGES.some(({ prefix, shift }) => value >> shift === prefix);
};

const normalizedHostname = (hostname) =>
  hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;

const assertPublicAddress = (address) => {
  const family = isIP(address);
  if (family === 0) throw new Error(`DNS returned invalid address ${address}`);
  const blocked = family === 4 ? isBlockedIpv4(address) : isBlockedIpv6(address);
  if (blocked) throw new Error(`non-public network address ${address} is blocked`);
};

const normalizeDnsAnswers = (answers) => {
  const records = Array.isArray(answers) ? answers : [answers];
  return records.map((record) => (typeof record === "string" ? record : record?.address));
};

const validateRequestUrl = async (rawUrl, dnsLookupImpl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("source URL is not parseable");
  }
  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new Error(`source URL protocol ${url.protocol} is blocked`);
  }
  if (!url.hostname || url.username || url.password) {
    throw new Error("source URL must have a hostname and must not embed credentials");
  }

  const hostname = normalizedHostname(url.hostname).toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error(`non-public hostname ${hostname} is blocked`);
  }
  const literalFamily = isIP(hostname);
  if (literalFamily !== 0) {
    assertPublicAddress(hostname);
    return url;
  }

  let answers;
  try {
    answers = await dnsLookupImpl(hostname, { all: true, verbatim: true });
  } catch (error) {
    throw new Error(
      `DNS lookup failed for ${hostname}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const addresses = normalizeDnsAnswers(answers);
  if (addresses.length === 0 || addresses.some((address) => typeof address !== "string")) {
    throw new Error(`DNS lookup returned no valid addresses for ${hostname}`);
  }
  addresses.forEach(assertPublicAddress);
  return url;
};

const failureResult = ({ source, method, status = null, finalUrl = null, diagnostic }) => ({
  id: source.id,
  url: source.url,
  finalUrl,
  ok: false,
  method,
  status,
  diagnostic,
});

const requestLink = async ({
  source,
  method,
  timeoutMs,
  maxRedirects,
  fetchImpl,
  dnsLookupImpl,
}) => {
  let currentUrl = source.url;
  try {
    for (let redirects = 0; ; redirects += 1) {
      const validatedUrl = await validateRequestUrl(currentUrl, dnsLookupImpl);
      const response = await fetchImpl(validatedUrl.href, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: method === "GET" ? { range: "bytes=0-0" } : undefined,
      });
      if (REDIRECT_STATUSES.has(response.status)) {
        const location = response.headers?.get("location");
        if (!location) {
          return failureResult({
            source,
            method,
            status: response.status,
            finalUrl: validatedUrl.href,
            diagnostic: `${method} redirect HTTP ${response.status} omitted Location`,
          });
        }
        if (redirects >= maxRedirects) {
          return failureResult({
            source,
            method,
            status: response.status,
            finalUrl: validatedUrl.href,
            diagnostic: `${method} redirect limit of ${maxRedirects} exceeded`,
          });
        }
        currentUrl = new URL(location, validatedUrl).href;
        continue;
      }

      const ok = response.status >= 200 && response.status < 300;
      return {
        id: source.id,
        url: source.url,
        finalUrl: validatedUrl.href,
        ok,
        method,
        status: response.status,
        diagnostic: ok
          ? `reachable via ${method}`
          : `${method} returned HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return failureResult({
      source,
      method,
      diagnostic: timedOut
        ? `${method} timed out or was aborted after ${timeoutMs}ms`
        : `${method} request blocked or failed: ${error instanceof Error ? error.message : String(error)}`,
    });
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

const requireRedirectLimit = (value) => {
  if (!Number.isInteger(value) || value < 0 || value > MAX_REDIRECT_LIMIT) {
    throw new Error(`maxRedirects must be an integer between 0 and ${MAX_REDIRECT_LIMIT}`);
  }
};

export const checkSourceLinks = async (
  sources,
  {
    concurrency = 12,
    timeoutMs = 10_000,
    maxRedirects = 5,
    fetchImpl = globalThis.fetch,
    dnsLookupImpl = defaultDnsLookup,
  } = {},
) => {
  requirePositiveInteger("concurrency", concurrency, 64);
  requirePositiveInteger("timeoutMs", timeoutMs, 120_000);
  requireRedirectLimit(maxRedirects);
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
  if (typeof dnsLookupImpl !== "function") throw new Error("A DNS lookup implementation is required");
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
      results[index] = await checkOneSourceLink(sources[index], {
        timeoutMs,
        maxRedirects,
        fetchImpl,
        dnsLookupImpl,
      });
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
