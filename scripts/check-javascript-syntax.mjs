import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import {
  parseNoArguments,
  runCliAdapter,
} from "./lib/ontology-maintenance-commands.mjs";

const defaultRepositoryRoot = resolve(import.meta.dirname, "..");
const JavaScriptExtensions = Object.freeze([".cjs", ".js", ".mjs"]);
const IgnoredRootDirectoryNames = Object.freeze([
  ".git",
  "build",
  "coverage",
  "dist",
  "playwright-report",
  "test-results",
]);
const IgnoredDirectoryNames = Object.freeze(["node_modules"]);

const isJavaScriptModule = (fileName) =>
  JavaScriptExtensions.some((extension) => fileName.endsWith(extension));

const collectJavaScriptModules = (directory, repositoryRoot) => readdirSync(directory, {
  withFileTypes: true,
}).flatMap((entry) => {
  const entryPath = resolve(directory, entry.name);
  const isIgnoredDirectory = IgnoredDirectoryNames.includes(entry.name) || (
    directory === repositoryRoot && IgnoredRootDirectoryNames.includes(entry.name)
  );
  if (entry.isDirectory() && !isIgnoredDirectory) {
    return collectJavaScriptModules(entryPath, repositoryRoot);
  }
  return entry.isFile() && isJavaScriptModule(entry.name) ? [entryPath] : [];
});

export const listProjectJavaScriptModules = (repositoryRoot = defaultRepositoryRoot) => {
  const resolvedRoot = resolve(repositoryRoot);
  return collectJavaScriptModules(resolvedRoot, resolvedRoot).toSorted();
};

const resultOutput = (result) => [result.stdout, result.stderr]
  .filter((value) => typeof value === "string" && value.trim())
  .join("\n")
  .trim();

export const checkJavaScriptSyntax = ({
  repositoryRoot = defaultRepositoryRoot,
  files = listProjectJavaScriptModules(repositoryRoot),
  processObject = process,
  spawn = spawnSync,
  log = console.log,
} = {}) => {
  const checkedFiles = files
    .map((file) => resolve(repositoryRoot, file))
    .toSorted();
  const failures = checkedFiles.flatMap((file) => {
    const result = spawn(processObject.execPath, ["--check", file], {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
    });
    if (result.error) throw result.error;
    return result.status === 0 ? [] : [{ file, output: resultOutput(result) }];
  });

  if (failures.length > 0) {
    const details = failures.map(({ file, output }) =>
      `- ${relative(repositoryRoot, file)}${output ? `\n${output}` : ""}`,
    ).join("\n");
    throw new Error(
      `JavaScript syntax check failed for ${failures.length} ${failures.length === 1 ? "module" : "modules"}:\n${details}`,
    );
  }

  const noun = checkedFiles.length === 1 ? "module" : "modules";
  log(`JavaScript syntax check passed for ${checkedFiles.length} project ${noun}.`);
  return Object.freeze({ checkedFileCount: checkedFiles.length });
};

export const main = ({ arguments_ = process.argv.slice(2), ...options } = {}) => {
  parseNoArguments(arguments_, "check-javascript-syntax");
  return checkJavaScriptSyntax(options);
};

await runCliAdapter({ moduleUrl: import.meta.url, scriptPath: process.argv[1], main });
