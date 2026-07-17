import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

interface PackageManifest {
  readonly scripts?: Readonly<Record<string, string>>;
}

interface TreeEntry {
  readonly kind: "directory" | "file" | "other";
  readonly path: string;
}

const repositoryRoot = process.cwd();
const normalizedPath = (value: string): string => value.replaceAll("\\", "/");

const listTreeEntries = (root: string, current = root): readonly TreeEntry[] =>
  readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = resolve(current, entry.name);
    const treeEntry: TreeEntry = Object.freeze({
      kind: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
      path: normalizedPath(relative(root, absolutePath)),
    });
    return entry.isDirectory()
      ? [treeEntry, ...listTreeEntries(root, absolutePath)]
      : [treeEntry];
  });

const rootNodeFilePattern = /^node\.yaml$/u;
const descendantNodeFilePattern =
  /^(?:[^/]+\/)+node\.yaml$/u;
const nodeDirectoryPattern = /^(?:[^/]+\/)*[^/]+$/u;

const forbiddenPackageSurfacePattern =
  /(?:^|:)(?:migrate|legacy|replay|expand|shared-prefix)(?::|$)/u;
const forbiddenPackageCommandPattern =
  /\b(?:migrate|legacy|replay|expand|shared-prefix)\b/u;

const forbiddenScriptArtifactPatterns = Object.freeze([
  /^migration(?:\/|$)/u,
  /^data\/(?:backbone|module-boundaries)(?:\/|$)/u,
  /^data\/ontology-(?:reviewed-|shared-prefix-|v2-|v3-)/u,
  /^(?:apply-reviewed-[^/]+|bootstrap-(?:agent-ontology-source|legacy-ontology)|expand-agent-ontology|freeze-legacy-release|migrate-[^/]+|validate-ontology-domain-decisions|verify-legacy-ontology-migration-audit)\.(?:js|mjs)$/u,
  /^lib\/ontology-(?:decision-validation|domain-closure|legacy-|migration-|release-evidence-validation|reviewed-|shared-prefix-audit|v2-|v3-)/u,
]);

describe("single YAML ontology source cutover", () => {
  it("does not expose migration, legacy, replay, expansion, or shared-prefix package commands", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as PackageManifest;
    const forbiddenCommands = Object.entries(manifest.scripts ?? {})
      .filter(([name, command]) =>
        forbiddenPackageSurfacePattern.test(name) ||
        forbiddenPackageCommandPattern.test(command),
      )
      .map(([name, command]) => `${name}=${command}`)
      .sort();

    expect(forbiddenCommands).toEqual([]);
  });

  it("allows only recursively nested node.yaml files under ontology", () => {
    const ontologyRoot = resolve(repositoryRoot, "ontology");
    const entries = listTreeEntries(ontologyRoot);
    const invalidEntries = entries
      .filter(({ kind, path }) => {
        if (kind === "directory") {
          return !nodeDirectoryPattern.test(path);
        }
        return kind !== "file" ||
          (!rootNodeFilePattern.test(path) && !descendantNodeFilePattern.test(path));
      })
      .map(({ path }) => path)
      .sort();
    const nodeDirectoriesMissingNodeFile = entries
      .filter(({ kind, path }) => kind === "directory" && nodeDirectoryPattern.test(path))
      .filter(({ path }) => !existsSync(resolve(ontologyRoot, path, "node.yaml")))
      .map(({ path }) => path)
      .sort();

    expect({
      invalidEntries,
      nodeDirectoriesMissingNodeFile,
      rootNodeExists: existsSync(resolve(ontologyRoot, "node.yaml")),
    }).toEqual({
      invalidEntries: [],
      nodeDirectoriesMissingNodeFile: [],
      rootNodeExists: true,
    });
  });

  it("contains no legacy migration or semantic overwrite scripts", () => {
    const scriptsRoot = resolve(repositoryRoot, "scripts");
    const forbiddenArtifacts = listTreeEntries(scriptsRoot)
      .map(({ path }) => path)
      .filter((path) => forbiddenScriptArtifactPatterns.some((pattern) => pattern.test(path)))
      .sort();

    expect(forbiddenArtifacts).toEqual([]);
  });

  it("keeps the generated canonical artifact only under src/generated", () => {
    const generatedCanonicalPath = resolve(
      repositoryRoot,
      "src/generated/agent-ontology.json",
    );

    expect(existsSync(generatedCanonicalPath)).toBe(true);
    const canonical = JSON.parse(
      readFileSync(generatedCanonicalPath, "utf8"),
    ) as { readonly artifact_metadata?: { readonly artifact_kind?: string } };
    expect(canonical.artifact_metadata?.artifact_kind).toBe("canonical-agent-ontology");
    expect(existsSync(resolve(repositoryRoot, "ontology/agent-ontology.json"))).toBe(false);
  });
});
