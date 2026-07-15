import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  checkJavaScriptSyntax,
  listProjectJavaScriptModules,
} from "../scripts/check-javascript-syntax.mjs";

const repositoryRoot = resolve(import.meta.dirname, "..");

const createFixture = (name: string, source: string) => {
  const directory = mkdtempSync(resolve(tmpdir(), "moonweave-syntax-gate-"));
  const file = resolve(directory, name);
  writeFileSync(file, source, "utf8");
  return { directory, file };
};

describe("JavaScript syntax gate", () => {
  it("accepts valid project modules and reports the checked count", () => {
    const { directory, file } = createFixture("valid.mjs", "export const value = 42;\n");
    const log = vi.fn();

    try {
      expect(checkJavaScriptSyntax({
        repositoryRoot: directory,
        files: [file],
        log,
      })).toEqual({ checkedFileCount: 1 });
      expect(log).toHaveBeenCalledWith("JavaScript syntax check passed for 1 project module.");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects every malformed module and identifies each failed file", () => {
    const first = createFixture("literal-backslash-n.mjs", "export const ok = true;\n\\n\n");
    const secondFile = resolve(first.directory, "unfinished.mjs");
    writeFileSync(secondFile, "export const unfinished = {\n", "utf8");

    try {
      expect(() => checkJavaScriptSyntax({
        repositoryRoot: first.directory,
        files: [first.file, secondFile],
        log: vi.fn(),
      })).toThrow(/JavaScript syntax check failed for 2 modules[\s\S]*literal-backslash-n\.mjs[\s\S]*unfinished\.mjs/iu);
    } finally {
      rmSync(first.directory, { recursive: true, force: true });
    }
  });

  it("discovers project JavaScript outside scripts while ignoring installed dependencies", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "moonweave-syntax-discovery-"));
    const scriptsDirectory = resolve(directory, "scripts");
    const dependenciesDirectory = resolve(directory, "node_modules", "fixture");
    const buildDirectory = resolve(directory, "build");
    mkdirSync(scriptsDirectory, { recursive: true });
    mkdirSync(dependenciesDirectory, { recursive: true });
    mkdirSync(buildDirectory, { recursive: true });
    const rootModule = resolve(directory, "root-config.cjs");
    const scriptModule = resolve(scriptsDirectory, "maintained.mjs");
    writeFileSync(rootModule, "module.exports = {};\n", "utf8");
    writeFileSync(scriptModule, "export {};\n", "utf8");
    writeFileSync(resolve(dependenciesDirectory, "ignored.js"), "invalid ???", "utf8");
    writeFileSync(resolve(buildDirectory, "generated.js"), "invalid ???", "utf8");

    try {
      expect(listProjectJavaScriptModules(directory)).toEqual([
        rootModule,
        scriptModule,
      ].sort());
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("wires the repository-wide gate before types, build, and ontology validation", () => {
    const modules = listProjectJavaScriptModules(repositoryRoot);
    const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(modules.length).toBeGreaterThan(100);
    expect(modules).toContain(resolve(repositoryRoot, "scripts/check-javascript-syntax.mjs"));
    expect(modules).toContain(resolve(
      repositoryRoot,
      "scripts/lib/ontology-reference-validation.mjs",
    ));
    expect(packageJson.scripts["syntax:check"]).toBe(
      "node scripts/check-javascript-syntax.mjs",
    );
    expect(packageJson.scripts.typecheck).toMatch(/^npm run syntax:check &&/u);
    expect(packageJson.scripts.build).toMatch(/^npm run typecheck &&/u);
    expect(packageJson.scripts["ontology:validate"]).toMatch(/^npm run syntax:check &&/u);
  });
});
