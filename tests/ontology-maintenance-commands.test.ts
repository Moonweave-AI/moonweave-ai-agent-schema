import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";

import {
  classifySourceLinkFailures,
  loadDecisionInputs,
  loadProductSource,
  loadRegistryAndAllowlist,
  loadSecurityInputs,
  loadReferencedSourceIds,
  parseNoArguments,
  parseSourceLinkArguments,
  runBuildSourceIndexCommand,
  runCliAdapter,
  runCleanWorktreeCommand,
  runGeneratedCheckCommand,
  runLegacyMigrationAuditCommand,
  runOntologyDecisionCommand,
  runOntologySecurityCommand,
  runSourceLinkCheckCommand,
} from "../scripts/lib/ontology-maintenance-commands.mjs";

const repositoryRoot = process.cwd();

describe("ontology maintenance command arguments", () => {
  it("rejects unexpected no-argument command input and validates link-check numbers", () => {
    expect(parseNoArguments([], "audit")).toEqual({});
    expect(() => parseNoArguments(["--write"], "audit")).toThrow(
      /audit does not accept arguments: --write/u,
    );

    expect(
      parseSourceLinkArguments([
        "--referenced-only",
        "--json",
        "--allow-inconclusive",
        "--concurrency",
        "4",
        "--timeout-ms",
        "2500",
      ]),
    ).toEqual({
      referencedOnly: true,
      json: true,
      allowInconclusive: true,
      concurrency: 4,
      timeoutMs: 2500,
    });
    for (const arguments_ of [
      ["--unknown"],
      ["--concurrency"],
      ["--concurrency", "0"],
      ["--timeout-ms", "NaN"],
    ]) {
      expect(() => parseSourceLinkArguments(arguments_)).toThrow();
    }
  });

  it("runs direct CLI adapters and reports synchronous or asynchronous failures", async () => {
    const scriptPath = resolve(repositoryRoot, "command.mjs");
    const moduleUrl = pathToFileURL(scriptPath).href;
    const consoleObject = { error: vi.fn() };
    const processObject = { exitCode: 0 };
    const main = vi.fn();
    await expect(
      runCliAdapter({
        moduleUrl,
        scriptPath: undefined,
        main,
        consoleObject,
        processObject,
      }),
    ).resolves.toBe(false);
    expect(main).not.toHaveBeenCalled();

    await expect(
      runCliAdapter({
        moduleUrl,
        scriptPath,
        main,
        consoleObject,
        processObject,
      }),
    ).resolves.toBe(true);
    expect(main).toHaveBeenCalledOnce();

    await runCliAdapter({
      moduleUrl,
      scriptPath,
      main: async () => {
        throw new Error("async command failed");
      },
      consoleObject,
      processObject,
    });
    expect(processObject.exitCode).toBe(1);
    expect(consoleObject.error).toHaveBeenCalledWith("async command failed");
  });
});

describe("maintained ontology command orchestration", () => {
  it("builds source-index bytes through injected deterministic dependencies", () => {
    const mkdir = vi.fn();
    const write = vi.fn();
    const buildSourceIndex = vi.fn(() => ({ generated: true }));
    const stable = vi.fn(() => "{\"generated\":true}\n");

    const result = runBuildSourceIndexCommand({
      arguments_: [],
      repositoryRoot,
      readProductSource: () => ({ product: { date: "2026-07-13" } }),
      generatedAt: () => "2026-07-13T00:00:00.000Z",
      generatorVersion: "test-generator",
      buildSourceIndex,
      stable,
      mkdir,
      write,
    });

    expect(buildSourceIndex).toHaveBeenCalledWith(repositoryRoot, {
      generatedAt: "2026-07-13T00:00:00.000Z",
      generatorVersion: "test-generator",
    });
    expect(mkdir).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledWith(
      expect.stringMatching(/src[\\/]generated[\\/]source-index\.json$/u),
      "{\"generated\":true}\n",
      "utf8",
    );
    expect(result.outputPath).toMatch(/source-index\.json$/u);
  });

  it("checks generated release state without publishing", () => {
    const spawn = vi.fn(() => ({ status: 0, error: undefined }));
    runGeneratedCheckCommand({
      arguments_: [],
      repositoryRoot,
      spawn,
      processObject: { execPath: process.execPath, env: {} },
      logger: vi.fn(),
    });
    expect(spawn).toHaveBeenCalledWith(
      process.execPath,
      [expect.stringMatching(/release-agent-ontology\.mjs$/u), "--check"],
      expect.objectContaining({ cwd: repositoryRoot }),
    );
  });

  it("fails clean-worktree validation for command errors and dirty output", () => {
    expect(() =>
      runCleanWorktreeCommand({
        arguments_: [],
        repositoryRoot,
        spawn: () => ({ status: 2, error: undefined, stdout: "", stderr: "git failed" }),
      }),
    ).toThrow(/git failed/u);
    expect(() =>
      runCleanWorktreeCommand({
        arguments_: [],
        repositoryRoot,
        spawn: () => ({
          status: 0,
          error: undefined,
          stdout: " M ontology/source.json\n",
          stderr: "",
        }),
      }),
    ).toThrow(/Validation changed or created repository files/u);
    expect(() =>
      runCleanWorktreeCommand({
        arguments_: [],
        repositoryRoot,
        spawn: () => ({
          status: 0,
          error: new Error("git unavailable"),
          stdout: "",
          stderr: "",
        }),
      }),
    ).toThrow(/git unavailable/u);
    expect(() =>
      runCleanWorktreeCommand({
        arguments_: [],
        repositoryRoot,
        spawn: () => ({ status: 0, error: undefined, stdout: "", stderr: "" }),
      }),
    ).not.toThrow();
  });

  it("selects referenced links and distinguishes broken from inconclusive results", async () => {
    const checkLinks = vi.fn(async () => ({
      checked: 3,
      successes: [],
      failures: [
        { id: "broken", url: "https://example.invalid/404", status: 404, diagnostic: "404" },
        { id: "blocked", url: "https://example.invalid/403", status: 403, diagnostic: "403" },
        { id: "offline", url: "https://example.invalid/offline", status: null, diagnostic: "dns" },
      ],
    }));
    const registry = [
      { id: "ok", url: "https://example.test/ok" },
      { id: "broken", url: "https://example.invalid/404" },
      { id: "blocked", url: "https://example.invalid/403" },
      { id: "offline", url: "https://example.invalid/offline" },
    ];
    const log = vi.fn();

    await expect(
      runSourceLinkCheckCommand({
        arguments_: ["--referenced-only", "--allow-inconclusive", "--json"],
        repositoryRoot,
        loadRegistry: () => ({ registry, allowlist: [] }),
        loadReferencedIds: () => new Set(["broken", "blocked", "offline"]),
        assertUrlPolicy: vi.fn(),
        checkLinks,
        log,
        warn: vi.fn(),
        error: vi.fn(),
      }),
    ).rejects.toThrow(/1 broken source link/u);
    expect(checkLinks).toHaveBeenCalledWith(
      registry.slice(1),
      expect.objectContaining({ concurrency: 12, timeoutMs: 10_000 }),
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"broken"'));

    const classified = classifySourceLinkFailures((await checkLinks()).failures);
    expect(classified.broken.map(({ id }: { id: string }) => id)).toEqual(["broken"]);
    expect(
      classified.inconclusive.map(({ id }: { id: string }) => id),
    ).toEqual(["blocked", "offline"]);
  });

  it("rejects unregistered referenced source IDs before making network calls", async () => {
    const checkLinks = vi.fn();
    await expect(
      runSourceLinkCheckCommand({
        arguments_: ["--referenced-only"],
        repositoryRoot,
        loadRegistry: () => ({
          registry: [{ id: "known", url: "https://example.test" }],
          allowlist: [],
        }),
        loadReferencedIds: () => new Set(["missing"]),
        assertUrlPolicy: vi.fn(),
        checkLinks,
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    ).rejects.toThrow(/missing/u);
    expect(checkLinks).not.toHaveBeenCalled();
  });

  it("validates decision bundles and prints the validation result", () => {
    const validate = vi.fn(() => ({ bundles: 8, unresolved: 0 }));
    const log = vi.fn();
    runOntologyDecisionCommand({
      arguments_: [],
      repositoryRoot,
      loadInputs: () => ({ legacy: { id: "v1" }, bundles: [{ id: "decision" }], sourceIds: ["s1"] }),
      validate,
      log,
    });
    expect(validate).toHaveBeenCalledWith({
      legacy: { id: "v1" },
      bundles: [{ id: "decision" }],
      sourceIds: ["s1"],
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"unresolved": 0'));
  });

  it("runs the read-only legacy audit and propagates audit failures", () => {
    const log = vi.fn();
    runLegacyMigrationAuditCommand({
      arguments_: [],
      repositoryRoot,
      audit: () => ({ total: 2, unresolved: 0 }),
      log,
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("source-first-read-only-audit"));
    expect(() =>
      runLegacyMigrationAuditCommand({
        arguments_: [],
        repositoryRoot,
        audit: () => {
          throw new Error("lineage mismatch");
        },
        log,
      }),
    ).toThrow(/lineage mismatch/u);
  });

  it("runs document and URL security gates over injected inputs", () => {
    const assertContent = vi.fn();
    const assertUrls = vi.fn();
    const log = vi.fn();
    const inputs = {
      documents: [{ label: "source.json", value: { id: "safe" } }],
      sourceDocumentCount: 1,
      fixtureDocumentCount: 0,
      uiFiles: [{ label: "App.tsx", text: "safe" }],
      sources: [{ id: "source", url: "https://example.test" }],
      allowlist: [],
    };
    runOntologySecurityCommand({
      arguments_: [],
      repositoryRoot,
      loadInputs: () => inputs,
      assertContent,
      assertUrls,
      log,
    });
    expect(assertContent).toHaveBeenCalledWith({
      documents: inputs.documents,
      uiFiles: inputs.uiFiles,
    });
    expect(assertUrls).toHaveBeenCalledWith(inputs.sources, inputs.allowlist);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/1 source documents/iu));
  });
});

describe("maintenance input loaders", () => {
  it("reads the real repository inputs without mutating them", () => {
    expect(loadProductSource(repositoryRoot).product.date).toBe("2026-07-13");
    const { registry, allowlist } = loadRegistryAndAllowlist(repositoryRoot);
    expect(registry.length).toBeGreaterThan(100);
    expect(Array.isArray(allowlist)).toBe(true);
    expect(loadReferencedSourceIds(repositoryRoot).size).toBeGreaterThan(100);
    const decisions = loadDecisionInputs(repositoryRoot);
    expect(decisions.bundles.length).toBeGreaterThan(0);
    expect(decisions.bundles.every((bundle: unknown) => bundle !== null)).toBe(true);
    expect(decisions.sourceIds.length).toBe(registry.length);
    const security = loadSecurityInputs(repositoryRoot);
    expect(security.sourceDocumentCount).toBe(42);
    expect(security.documents.length).toBeGreaterThan(42);
    expect(security.uiFiles.length).toBeGreaterThan(0);
  });
});

describe("maintenance root adapters", () => {
  it("keeps the platform-specific visual regression executable in Windows CI", () => {
    const workflow = readFileSync(
      resolve(repositoryRoot, ".github/workflows/ontology-validation.yml"),
      "utf8",
    );
    const playwrightConfig = readFileSync(
      resolve(repositoryRoot, "playwright.config.ts"),
      "utf8",
    );

    expect(workflow).toMatch(
      /name: Windows visual and interaction regression[\s\S]*if: runner\.os == 'Windows'[\s\S]*run: npm run test:ontology-ui/u,
    );
    expect(playwrightConfig).toContain(
      "docs/visual-baselines/unified-v2/{platform}/{projectName}/{arg}{ext}",
    );
  });

  it("keeps maintained command entrypoints in coverage and excludes only named frozen replay code", () => {
    const configSource = readFileSync(resolve(repositoryRoot, "vitest.config.ts"), "utf8");
    const excludeBlock = configSource.match(
      /exclude:\s*\[(?<entries>[\s\S]*?)\],\s*reportOnFailure/u,
    )?.groups?.entries;
    const exclusions = [...(excludeBlock?.matchAll(/"(?<path>[^"]+)"/gu) ?? [])].map(
      (match) => match.groups?.path,
    );

    expect(configSource).toContain(
      'include: ["src/**/*.{ts,tsx}", "scripts/**/*.mjs"]',
    );
    expect(exclusions).toEqual(
      expect.arrayContaining([
        "scripts/apply-reviewed-ontology-migration.mjs",
        "scripts/lib/ontology-legacy-migration.mjs",
        "scripts/lib/ontology-migration-factories.mjs",
      ]),
    );
    for (const scriptName of [
      "build-agent-ontology.mjs",
      "build-source-index.mjs",
      "check-agent-ontology-generated.mjs",
      "check-clean-worktree.mjs",
      "check-source-links.mjs",
      "release-agent-ontology.mjs",
      "validate-ontology-domain-decisions.mjs",
      "verify-legacy-ontology-migration-audit.mjs",
      "verify-ontology-security.mjs",
    ]) {
      expect(exclusions).not.toContain(`scripts/${scriptName}`);
    }
  });

  it("remain thin and reject unknown arguments without performing writes or network calls", () => {
    const scriptNames = [
      "build-source-index.mjs",
      "check-agent-ontology-generated.mjs",
      "check-clean-worktree.mjs",
      "check-source-links.mjs",
      "validate-ontology-domain-decisions.mjs",
      "verify-legacy-ontology-migration-audit.mjs",
      "verify-ontology-security.mjs",
    ];

    for (const scriptName of scriptNames) {
      const script = resolve(repositoryRoot, "scripts", scriptName);
      const source = readFileSync(script, "utf8");
      expect(source.split(/\r?\n/u).length, scriptName).toBeLessThanOrEqual(15);
      const result = spawnSync(process.execPath, [script, "--unknown"], {
        cwd: repositoryRoot,
        encoding: "utf8",
      });
      expect(result.status, scriptName).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`, scriptName).toMatch(/--unknown/u);
    }
  });
});
