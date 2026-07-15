import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

import {
  currentCommitSha,
  expectedSiteBuildManifest,
} from "../scripts/lib/site-build-metadata.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");

test("a new manifest cannot authenticate an older compiled application bundle", async ({ page }) => {
  const compiledCommitSha = currentCommitSha(repositoryRoot);
  const differentCommitSha = compiledCommitSha.startsWith("a")
    ? "b".repeat(40)
    : "a".repeat(40);
  const mismatchedManifest = expectedSiteBuildManifest(repositoryRoot, {
    commitSha: differentCommitSha,
    builtFromRef: "mismatched-e2e-fixture",
  });
  let confirmManifestResponse: (() => void) | undefined;
  const manifestResponseCompleted = new Promise<void>((resolveResponse) => {
    confirmManifestResponse = resolveResponse;
  });
  await page.route("**/build-manifest.json", async (route) => {
    await route.fulfill({ json: mismatchedManifest });
    confirmManifestResponse?.();
  });

  await page.goto("/");
  await manifestResponseCompleted;

  await expect(page.getByTestId("build-identity-mismatch")).toBeVisible();
  await expect(page.locator("[data-build-commit]")).toHaveCount(0);
});
