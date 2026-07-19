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
        // Static profile modules are exercised through integration builds, not unit coverage.
        "src/profiles/**",
        // Manual visual capture is exercised through Playwright rather than unit coverage.
        "scripts/capture-ontology-visual-baseline.mjs",
        // Coverage infrastructure cannot meaningfully instrument its own provider.
        "scripts/vitest-subprocess-coverage-provider.mjs",
        // CLI entrypoints are thin shims around tested libraries and are covered by integration runs.
        "scripts/audit-npm-dependencies.mjs",
        "scripts/build-agent-ontology.mjs",
        "scripts/check-clean-worktree.mjs",
        "scripts/check-source-links.mjs",
        "scripts/verify-dependency-policy.mjs",
        "scripts/verify-ontology-security.mjs",
        // Script utilities are exercised through CLI/integration runs rather than unit coverage.
        "scripts/lib/csv.mjs",
        "scripts/lib/dependency-security-gates.mjs",
        "scripts/lib/ontology-maintenance-commands.mjs",
        "scripts/lib/ontology-security-gates.mjs",
        "scripts/lib/site-build-metadata.mjs",
        // Browser runtime, canvas rendering, and edge-case UI are covered by Playwright E2E tests.
        "src/lib/ontology-network-runtime.ts",
        "src/lib/ontology-graph-scenarios.ts",
        "src/components/OntologyDeprecationLineage.tsx",
        "src/components/OntologyGraph.tsx",
        "scripts/lib/ontology-artifact-size.mjs",
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
