import { defineConfig } from "vitest/config";
import { currentCommitSha } from "./scripts/lib/site-build-metadata.mjs";

const buildCommitSha = currentCommitSha(import.meta.dirname);

export default defineConfig({
  define: {
    __MOONWEAVE_BUILD_COMMIT_SHA__: JSON.stringify(buildCommitSha),
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup/subprocess-v8-coverage.ts"],
    coverage: {
      provider: "custom",
      customProviderModule: "./scripts/vitest-subprocess-coverage-provider.mjs",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.mjs"],
      exclude: [
        "src/generated/**",
        "src/lib/canonical-ontology-types.ts",
        // Manual visual capture is exercised through Playwright rather than unit coverage.
        "scripts/capture-ontology-visual-baseline.mjs",
        // Coverage infrastructure cannot meaningfully instrument its own provider.
        "scripts/vitest-subprocess-coverage-provider.mjs",
      ],
      reportOnFailure: true,
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
});
