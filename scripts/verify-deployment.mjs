import { isMainModule } from "./lib/cli-entrypoint.mjs";

const gitSha = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u;
const maximumTimerDelayMs = 2_147_483_647;
const loopbackHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

const isTimerDelay = (value, allowZero) => Number.isSafeInteger(value)
  && value <= maximumTimerDelayMs
  && (allowZero ? value >= 0 : value > 0);

const normalizedHostname = (url) => url.hostname.replace(/^\[|\]$/gu, "").toLowerCase();

const assertDeploymentTransport = (url, label) => {
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${label} must be an HTTP(S) URL without embedded credentials`);
  }
  if (url.protocol !== "https:" && !loopbackHostnames.has(normalizedHostname(url))) {
    throw new Error(`${label} must use HTTPS unless it targets an exact loopback test server`);
  }
};

const deploymentManifestUrl = (deploymentUrl, expectedCommitSha) => {
  const base = new URL(deploymentUrl.endsWith("/") ? deploymentUrl : `${deploymentUrl}/`);
  assertDeploymentTransport(base, "DEPLOYMENT_URL");
  const manifestUrl = new URL("build-manifest.json", base);
  manifestUrl.searchParams.set("verify", expectedCommitSha);
  return manifestUrl;
};

const fetchWithDeadline = async ({
  fetchImplementation,
  manifestUrl,
  attemptTimeoutMs,
}) => {
  const controller = new AbortController();
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      const error = new Error(
        `Deployment manifest request timed out after ${attemptTimeoutMs} ms`,
      );
      controller.abort(error);
      reject(error);
    }, attemptTimeoutMs);
  });
  try {
    const fetchAndReadManifest = (async () => {
      const response = await fetchImplementation(manifestUrl, {
        headers: { "Cache-Control": "no-cache" },
        cache: "no-store",
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.redirected || (response.status >= 300 && response.status < 400)) {
        throw new Error("Deployment manifest request must not follow or return a redirect");
      }
      if (response.url) {
        let responseUrl;
        try {
          responseUrl = new URL(response.url);
        } catch {
          throw new Error("Deployment manifest response has an invalid final URL");
        }
        assertDeploymentTransport(responseUrl, "Deployment manifest response URL");
        if (responseUrl.origin !== manifestUrl.origin) {
          throw new Error("Deployment manifest response URL must remain on the same origin");
        }
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })();
    return await Promise.race([
      fetchAndReadManifest,
      deadline,
    ]);
  } finally {
    clearTimeout(timeout);
  }
};

export const verifyDeployment = async ({
  deploymentUrl,
  expectedCommitSha: inputExpectedCommitSha,
  fetchImplementation = fetch,
  delays = [0, 2_000, 4_000, 8_000, 12_000],
  attemptTimeoutMs = 10_000,
  wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
} = {}) => {
  const expectedCommitSha = inputExpectedCommitSha?.toLowerCase();
  if (!deploymentUrl || !expectedCommitSha) {
    throw new Error("DEPLOYMENT_URL and EXPECTED_COMMIT_SHA are required");
  }
  if (!gitSha.test(expectedCommitSha)) {
    throw new Error("EXPECTED_COMMIT_SHA must be a full lowercase Git SHA");
  }
  if (!isTimerDelay(attemptTimeoutMs, false)) {
    throw new Error("Deployment request timeout must be a positive safe timer delay");
  }
  const manifestUrl = deploymentManifestUrl(deploymentUrl, expectedCommitSha);
  let lastError = null;
  for (const delay of delays) {
    if (!isTimerDelay(delay, true)) throw new Error(`Invalid deployment retry delay: ${delay}`);
    if (delay) await wait(delay);
    try {
      const manifest = await fetchWithDeadline({
        fetchImplementation,
        manifestUrl,
        attemptTimeoutMs,
      });
      const deployedCommitSha = String(manifest?.commit_sha ?? "").toLowerCase();
      if (!gitSha.test(deployedCommitSha)) throw new Error("Deployment manifest has an invalid commit_sha");
      if (deployedCommitSha !== expectedCommitSha) {
        throw new Error(`deployed ${deployedCommitSha}; expected ${expectedCommitSha}`);
      }
      return Object.freeze({ manifest, manifestUrl: manifestUrl.toString() });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("No deployment verification attempts were configured");
};

if (isMainModule(import.meta.url)) {
  const expectedCommitSha = process.env.EXPECTED_COMMIT_SHA?.toLowerCase();
  const result = await verifyDeployment({
    deploymentUrl: process.env.DEPLOYMENT_URL,
    expectedCommitSha,
  });
  console.log(`Deployment manifest matches ${result.manifest.commit_sha}`);
}
