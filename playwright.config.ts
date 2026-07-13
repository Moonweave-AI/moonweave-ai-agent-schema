import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const nodeExecutable = process.execPath.includes(" ")
  ? `"${process.execPath}"`
  : process.execPath;

export default defineConfig({
  testDir: "./e2e",
  snapshotPathTemplate: resolve(
    import.meta.dirname,
    "docs/visual-baselines/unified-v2/{platform}/{projectName}/{arg}{ext}",
  ),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } }
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } }
    }
  ],
  webServer: {
    command: `${nodeExecutable} node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173`,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI && !process.env.MOONWEAVE_E2E_STRICT_SERVER,
    timeout: 120000
  }
});
