import { expect, test } from "@playwright/test";

const deploymentUrl = process.env.DEPLOYMENT_URL;
const expectedCommitSha = process.env.EXPECTED_COMMIT_SHA?.toLowerCase();

test.describe("deployed build identity", () => {
  test.skip(!deploymentUrl || !expectedCommitSha, "deployment verification environment is not configured");

  test("runtime DOM and no-store manifest identify the deployed commit", async ({ page, request }) => {
    const manifestUrl = new URL("build-manifest.json", deploymentUrl!.endsWith("/") ? deploymentUrl! : `${deploymentUrl!}/`);
    manifestUrl.searchParams.set("verify", expectedCommitSha!);
    const response = await request.get(manifestUrl.toString(), {
      headers: { "Cache-Control": "no-cache" },
      maxRedirects: 0,
    });
    expect(response.ok()).toBe(true);
    const finalUrl = new URL(response.url());
    const configuredUrl = new URL(deploymentUrl!);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(configuredUrl.hostname);
    expect(finalUrl.origin).toBe(configuredUrl.origin);
    expect(finalUrl.protocol === "https:" || (loopback && finalUrl.protocol === "http:")).toBe(true);
    const manifest = await response.json() as { readonly commit_sha: string };
    expect(manifest.commit_sha.toLowerCase()).toBe(expectedCommitSha);

    await page.goto(`${deploymentUrl!}${deploymentUrl!.includes("?") ? "&" : "?"}verify=${expectedCommitSha!}`);
    const diagnostic = page.locator("[data-build-commit]");
    await expect(diagnostic).toHaveAttribute("data-build-commit", expectedCommitSha!);
    await expect(diagnostic).toContainText(expectedCommitSha!.slice(0, 12));
  });
});
