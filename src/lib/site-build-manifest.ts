import { z } from "zod";

import type { CanonicalOntology } from "./ontology-index";
import { compiledBuildCommitSha } from "./site-build-identity";

const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/u);

export const siteBuildManifestSchema = z.object({
  schema_version: z.literal("1.0.0"),
  commit_sha: z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u),
  built_from_ref: z.string().min(1),
  canonical_version: z.string().min(1),
  generator_version: z.string().min(1),
  source_fingerprint: sha256Hex,
  canonical_fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  community_projection_fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
  module_count: z.number().int().nonnegative(),
  concept_count: z.number().int().nonnegative(),
  relation_count: z.number().int().nonnegative(),
}).strict().readonly();

export type SiteBuildManifest = Readonly<z.infer<typeof siteBuildManifestSchema>>;

export type SiteBuildManifestState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "ready"; manifest: SiteBuildManifest }>
  | Readonly<{ status: "unavailable"; reason: string }>
  | Readonly<{ status: "mismatch"; reason: string }>;

export type CanonicalIdentity = Readonly<{
  canonicalVersion: string;
  generatorVersion: string;
  sourceFingerprint: string;
  canonicalFingerprint: string;
  communityProjectionFingerprint: string;
  moduleCount: number;
  conceptCount: number;
  relationCount: number;
}>;

const acceptedRelationCount = (canonical: CanonicalOntology): number =>
  canonical.relations.filter((relation) => relation.status === "accepted").length;

export const canonicalIdentityForOntology = (
  canonical: CanonicalOntology,
  canonicalFingerprint: string,
  communityProjectionFingerprint: string,
): CanonicalIdentity => Object.freeze({
  canonicalVersion: String(canonical.artifact_metadata?.canonical_version ?? canonical.id),
  generatorVersion: String(canonical.artifact_metadata?.generator_version ?? "unknown"),
  sourceFingerprint: String(canonical.artifact_metadata?.source_tree_sha256 ?? ""),
  canonicalFingerprint,
  communityProjectionFingerprint,
  moduleCount: canonical.modules.length,
  conceptCount: canonical.classes.length,
  relationCount: acceptedRelationCount(canonical),
});

export class SiteBuildManifestMismatchError extends Error {
  override readonly name = "SiteBuildManifestMismatchError";
}

class SiteBuildManifestTimeoutError extends Error {
  override readonly name = "SiteBuildManifestTimeoutError";
}

class SiteBuildManifestHttpError extends Error {
  override readonly name = "SiteBuildManifestHttpError";

  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

const defaultAttemptTimeoutMs = 4_000;
const defaultRetryDelaysMs = Object.freeze([0, 250, 750] as const);
const maximumTimerDelayMs = 2_147_483_647;

const isTimerDelay = (value: number, allowZero: boolean): boolean =>
  Number.isSafeInteger(value)
  && value <= maximumTimerDelayMs
  && (allowZero ? value >= 0 : value > 0);

const abortReason = (signal: AbortSignal): unknown =>
  signal.reason ?? new DOMException("Build manifest request was aborted", "AbortError");

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw abortReason(signal);
};

const waitForRetry = async (delayMs: number, signal?: AbortSignal): Promise<void> => {
  throwIfAborted(signal);
  if (delayMs === 0) return;
  await new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(signal ? abortReason(signal) : new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

const loadSiteBuildManifestAttempt = async (
  url: string,
  fetchImplementation: typeof fetch,
  identity: CanonicalIdentity,
  attemptTimeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<SiteBuildManifest> => {
  throwIfAborted(externalSignal);
  const attemptController = new AbortController();
  let rejectInterruption: (reason?: unknown) => void = () => undefined;
  const interruption = new Promise<never>((_resolve, reject) => {
    rejectInterruption = reject;
  });
  const onExternalAbort = (): void => {
    const reason = externalSignal
      ? abortReason(externalSignal)
      : new DOMException("Build manifest request was aborted", "AbortError");
    attemptController.abort(reason);
    rejectInterruption(reason);
  };
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });
  const timeout = setTimeout(() => {
    const error = new SiteBuildManifestTimeoutError(
      `Build manifest request timed out after ${attemptTimeoutMs} ms`,
    );
    attemptController.abort(error);
    rejectInterruption(error);
  }, attemptTimeoutMs);

  try {
    const request = fetchImplementation(url, {
      cache: "no-store",
      redirect: "error",
      signal: attemptController.signal,
    }).then(async (response) => {
      if (!response.ok) {
        throw new SiteBuildManifestHttpError(
          `Build manifest request failed with HTTP ${response.status}`,
          response.status === 408 || response.status === 429 || response.status >= 500,
        );
      }
      const manifest = siteBuildManifestSchema.parse(await response.json());
      verifyBuildIdentity(manifest, identity);
      return manifest;
    });
    return await Promise.race([request, interruption]);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
};

const isRetryableManifestError = (error: unknown): boolean =>
  error instanceof SiteBuildManifestTimeoutError
  || (error instanceof SiteBuildManifestHttpError && error.retryable)
  || error instanceof TypeError;

const verifyBuildIdentity = (
  manifest: SiteBuildManifest,
  identity: CanonicalIdentity,
): void => {
  const comparisons: ReadonlyArray<readonly [string, string | number, string | number]> = [
    ["commit_sha", manifest.commit_sha, compiledBuildCommitSha],
    ["canonical_version", manifest.canonical_version, identity.canonicalVersion],
    ["generator_version", manifest.generator_version, identity.generatorVersion],
    ["source_fingerprint", manifest.source_fingerprint, identity.sourceFingerprint],
    ["canonical_fingerprint", manifest.canonical_fingerprint, identity.canonicalFingerprint],
    ["community_projection_fingerprint", manifest.community_projection_fingerprint,
      identity.communityProjectionFingerprint],
    ["module_count", manifest.module_count, identity.moduleCount],
    ["concept_count", manifest.concept_count, identity.conceptCount],
    ["relation_count", manifest.relation_count, identity.relationCount],
  ];
  const mismatch = comparisons.find(([, actual, expected]) => actual !== expected);
  if (mismatch) {
    throw new SiteBuildManifestMismatchError(
      `${mismatch[0]} does not match the loaded canonical ontology`,
    );
  }
};

export const siteBuildManifestUrl = (baseUrl = import.meta.env.BASE_URL): string => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}build-manifest.json`;
};

export const loadSiteBuildManifest = async (
  options: Readonly<{
    identity: CanonicalIdentity;
    baseUrl?: string;
    fetchImplementation?: typeof fetch;
    signal?: AbortSignal;
    attemptTimeoutMs?: number;
    retryDelaysMs?: readonly number[];
  }>,
): Promise<SiteBuildManifest> => {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const attemptTimeoutMs = options.attemptTimeoutMs ?? defaultAttemptTimeoutMs;
  const retryDelaysMs = options.retryDelaysMs ?? defaultRetryDelaysMs;
  if (!isTimerDelay(attemptTimeoutMs, false)) {
    throw new Error("Build manifest attempt timeout must be a positive safe timer delay");
  }
  if (retryDelaysMs.length === 0) {
    throw new Error("At least one build manifest request attempt must be configured");
  }
  const url = siteBuildManifestUrl(options.baseUrl);
  let lastError: unknown;
  for (const [index, delayMs] of retryDelaysMs.entries()) {
    if (!isTimerDelay(delayMs, true)) {
      throw new Error(`Invalid build manifest retry delay: ${delayMs}`);
    }
    if (delayMs > 0) await waitForRetry(delayMs, options.signal);
    else throwIfAborted(options.signal);
    try {
      return await loadSiteBuildManifestAttempt(
        url,
        fetchImplementation,
        options.identity,
        attemptTimeoutMs,
        options.signal,
      );
    } catch (error) {
      if (options.signal?.aborted) throw abortReason(options.signal);
      lastError = error;
      if (!isRetryableManifestError(error) || index === retryDelaysMs.length - 1) throw error;
    }
  }
  throw lastError ?? new Error("No build manifest request attempts were configured");
};
