import canonicalOntologyAssetUrl from "../generated/agent-ontology.json?url";

export interface CanonicalOntologyLoadOptions {
  readonly assetUrl?: string;
  readonly fetchImplementation?: typeof fetch;
  readonly maximumBytes?: number;
  readonly signal?: AbortSignal;
}

export interface LoadedCanonicalOntologyAsset {
  readonly ontology: unknown;
  readonly canonicalFingerprint: string;
}

const MAX_CANONICAL_ASSET_BYTES = 64 * 1024 * 1024;

const canonicalByteLimit = (requestedLimit: number | undefined): number => {
  if (requestedLimit === undefined) return MAX_CANONICAL_ASSET_BYTES;
  if (!Number.isSafeInteger(requestedLimit) || requestedLimit <= 0 ||
      requestedLimit > MAX_CANONICAL_ASSET_BYTES) {
    throw new Error("Canonical ontology byte limit must be a positive safe integer up to 64 MiB");
  }
  return requestedLimit;
};

const byteLimitError = (maximumBytes: number): Error => new Error(
  maximumBytes === MAX_CANONICAL_ASSET_BYTES
    ? "Canonical ontology response exceeds the 64 MiB limit"
    : "Canonical ontology response exceeds the configured byte limit",
);

const readBoundedResponseBytes = async (
  response: Response,
  maximumBytes: number,
): Promise<ArrayBuffer> => {
  if (!response.body) {
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > maximumBytes) throw byteLimitError(maximumBytes);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      byteLength += next.value.byteLength;
      if (byteLength > maximumBytes) {
        await reader.cancel("canonical ontology byte limit exceeded");
        throw byteLimitError(maximumBytes);
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined.buffer;
};

export const canonicalOntologyUrl = (): string => canonicalOntologyAssetUrl;

export const loadCanonicalOntologyAsset = async (
  options: CanonicalOntologyLoadOptions = {},
): Promise<LoadedCanonicalOntologyAsset> => {
  const assetUrl = options.assetUrl ?? canonicalOntologyUrl();
  const maximumBytes = canonicalByteLimit(options.maximumBytes);
  const response = await (options.fetchImplementation ?? fetch)(
    assetUrl,
    {
      cache: "force-cache",
      credentials: "same-origin",
      redirect: "error",
      signal: options.signal,
    },
  );
  if (!response.ok) {
    throw new Error(`Canonical ontology request failed with HTTP ${response.status}`);
  }
  if (response.url) {
    const baseUrl = globalThis.location?.href ?? assetUrl;
    const requestedOrigin = new URL(assetUrl, baseUrl).origin;
    const responseOrigin = new URL(response.url, baseUrl).origin;
    if (responseOrigin !== requestedOrigin) {
      throw new Error("Canonical ontology response must remain same-origin");
    }
  }
  const declaredBytes = Number(response.headers.get("Content-Length"));
  if (Number.isFinite(declaredBytes) && declaredBytes > maximumBytes) {
    throw byteLimitError(maximumBytes);
  }
  const bytes = await readBoundedResponseBytes(response, maximumBytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const canonicalFingerprint = `sha256:${[...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const ontology = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  return Object.freeze({ ontology, canonicalFingerprint });
};
