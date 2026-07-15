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
        // One-time reviewed migration replay; maintained release validation uses
        // the read-only legacy audit instead.
        "scripts/apply-reviewed-ontology-migration.mjs",
        // Historical source bootstrap retained only to reproduce the initial split.
        "scripts/bootstrap-agent-ontology-source.mjs",
        // Historical v1 bootstrap retained as a frozen lineage input.
        "scripts/bootstrap-legacy-ontology.mjs",
        // Manual Playwright baseline capture utility, never a release gate.
        "scripts/capture-ontology-visual-baseline.mjs",
        // Superseded expansion utility retained for migration archaeology.
        "scripts/expand-agent-ontology.mjs",
        // One-time v1 release freezer; current releases use release-agent-ontology.
        "scripts/freeze-legacy-release.mjs",
        // Frozen implementation behind the explicitly gated legacy replay command.
        "scripts/lib/ontology-legacy-migration.mjs",
        // Factories used exclusively by the frozen legacy replay implementation.
        "scripts/lib/ontology-migration-factories.mjs",
        // Closure builder imported only by the excluded frozen legacy replay.
        "scripts/migration/legacy-reviewed-module-closure.mjs",
        // Output writer imported only by the excluded frozen legacy replay.
        "scripts/migration/legacy-reviewed-output-writer.mjs",
        // One-time Concept terminology rewrite: no package command or maintained caller.
        "scripts/migrate-concept-genus-differentia.mjs",
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
