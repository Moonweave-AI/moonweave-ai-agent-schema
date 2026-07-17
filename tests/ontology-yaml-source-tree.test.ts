import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadOntologyTree,
  OntologySourceError,
} from "../scripts/lib/ontology-yaml-source.mjs";

type OntologyNodeKind = "ontology" | "domain" | "module" | "concept";

type OntologySourceErrorCode =
  | "DUPLICATE_NODE_ID"
  | "INVALID_HIERARCHY"
  | "INVALID_YAML"
  | "NODE_ID_PATH_MISMATCH"
  | "ROOT_NODE_MISSING"
  | "SOURCE_ENTRY_FORBIDDEN"
  | "YAML_ALIAS_FORBIDDEN";

const temporaryRoots: string[] = [];

const createSourceDirectory = (): string => {
  const root = mkdtempSync(join(tmpdir(), "moonweave-ontology-yaml-source-"));
  temporaryRoots.push(root);
  const sourceDir = join(root, "ontology");
  mkdirSync(sourceDir, { recursive: true });
  return sourceDir;
};

const nodePath = (sourceDir: string, ancestry: readonly string[]): string =>
  join(sourceDir, ...ancestry, "node.yaml");

const nodeYaml = (id: string, kind: OntologyNodeKind): string => [
  "schema: moonweave.ai/ontology-node/v1",
  `id: ${id}`,
  `kind: ${kind}`,
  "",
].join("\n");

const writeText = (path: string, contents: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
};

const writeNode = (
  sourceDir: string,
  ancestry: readonly string[],
  id: string,
  kind: OntologyNodeKind,
): void => writeText(nodePath(sourceDir, ancestry), nodeYaml(id, kind));

const writeValidTree = (sourceDir: string): void => {
  writeNode(sourceDir, [], "agent-system-ontology", "ontology");
  writeNode(sourceDir, ["runtime"], "runtime", "domain");
  writeNode(sourceDir, ["runtime", "run-lifecycle"], "run-lifecycle", "module");
  writeNode(
    sourceDir,
    ["runtime", "run-lifecycle", "agent-run"],
    "agent-run",
    "concept",
  );
  writeNode(
    sourceDir,
    ["runtime", "run-lifecycle", "agent-run", "autonomous-agent-run"],
    "autonomous-agent-run",
    "concept",
  );
};

const expectSourceError = async (
  sourceDir: string,
  code: OntologySourceErrorCode,
): Promise<void> => {
  let failure: unknown;
  try {
    await loadOntologyTree({ sourceDir });
  } catch (error) {
    failure = error;
  }

  expect(failure).toBeInstanceOf(OntologySourceError);
  expect(failure).toMatchObject({ code });
};

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("canonical ontology YAML source tree", () => {
  it("loads one immutable node.yaml tree at arbitrary concept depth", async () => {
    const sourceDir = createSourceDirectory();
    writeValidTree(sourceDir);

    const loaded = await loadOntologyTree({ sourceDir });

    expect(Object.isFrozen(loaded)).toBe(true);
    expect(loaded.sourceTreeSha256).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("requires the source root to contain exactly the canonical node.yaml entry", async () => {
    const missingRoot = createSourceDirectory();
    await expectSourceError(missingRoot, "ROOT_NODE_MISSING");

    const extraYaml = createSourceDirectory();
    writeNode(extraYaml, [], "agent-system-ontology", "ontology");
    writeText(join(extraYaml, "second-root.yaml"), nodeYaml("second-root", "ontology"));
    await expectSourceError(extraYaml, "SOURCE_ENTRY_FORBIDDEN");
  });

  it("rejects duplicate YAML mapping keys instead of accepting the last value", async () => {
    const sourceDir = createSourceDirectory();
    writeText(nodePath(sourceDir, []), [
      "schema: moonweave.ai/ontology-node/v1",
      "id: agent-system-ontology",
      "id: overwritten-ontology",
      "kind: ontology",
      "",
    ].join("\n"));

    await expectSourceError(sourceDir, "INVALID_YAML");
  });

  it("rejects YAML anchors and aliases so one node cannot inherit hidden content", async () => {
    const sourceDir = createSourceDirectory();
    writeText(nodePath(sourceDir, []), [
      "schema: moonweave.ai/ontology-node/v1",
      "id: agent-system-ontology",
      "kind: ontology",
      "labels: &labels",
      "  en: Agent system ontology",
      "copied_labels: *labels",
      "",
    ].join("\n"));

    await expectSourceError(sourceDir, "YAML_ALIAS_FORBIDDEN");
  });

  it.each(["legacy.json", "review.csv", "baseline.ndjson", "notes.md"])(
    "rejects non-node legacy source entry %s inside the YAML tree",
    async (filename) => {
      const sourceDir = createSourceDirectory();
      writeNode(sourceDir, [], "agent-system-ontology", "ontology");
      writeText(join(sourceDir, filename), "stale source must never be loaded\n");

      await expectSourceError(sourceDir, "SOURCE_ENTRY_FORBIDDEN");
    },
  );

  it.each(["source", "migration"])(
    "rejects retired %s directories inside the canonical YAML source root",
    async (directory) => {
      const sourceDir = createSourceDirectory();
      writeNode(sourceDir, [], "agent-system-ontology", "ontology");
      writeText(
        join(sourceDir, directory, "legacy.json"),
        "stale source must never be loaded\n",
      );

      await expectSourceError(sourceDir, "SOURCE_ENTRY_FORBIDDEN");
    },
  );

  it("does not consult legacy JSON or migration trees outside the explicit sourceDir", async () => {
    const sourceDir = createSourceDirectory();
    writeValidTree(sourceDir);
    const ontologyRoot = dirname(sourceDir);
    writeText(join(ontologyRoot, "source", "legacy.json"), "{ not valid json");
    writeText(join(ontologyRoot, "migration", "legacy-v1", "node.yaml"), [
      "schema: moonweave.ai/ontology-node/v1",
      "id: duplicate-agent-system-ontology",
      "kind: ontology",
      "",
    ].join("\n"));

    await expect(loadOntologyTree({ sourceDir })).resolves.toMatchObject({
      sourceTreeSha256: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
  });

  it("requires every child directory name to equal its node ID", async () => {
    const sourceDir = createSourceDirectory();
    writeNode(sourceDir, [], "agent-system-ontology", "ontology");
    writeNode(sourceDir, ["runtime"], "safety", "domain");

    await expectSourceError(sourceDir, "NODE_ID_PATH_MISMATCH");
  });

  it("rejects duplicate IDs even when they occur under different parents", async () => {
    const sourceDir = createSourceDirectory();
    writeNode(sourceDir, [], "agent-system-ontology", "ontology");
    writeNode(sourceDir, ["runtime"], "runtime", "domain");
    writeNode(sourceDir, ["safety"], "safety", "domain");
    writeNode(sourceDir, ["runtime", "shared-module"], "shared-module", "module");
    writeNode(sourceDir, ["safety", "shared-module"], "shared-module", "module");

    await expectSourceError(sourceDir, "DUPLICATE_NODE_ID");
  });

  it("enforces ontology to domain to module to recursive concept hierarchy", async () => {
    const sourceDir = createSourceDirectory();
    writeNode(sourceDir, [], "agent-system-ontology", "ontology");
    writeNode(sourceDir, ["orphan-concept"], "orphan-concept", "concept");

    await expectSourceError(sourceDir, "INVALID_HIERARCHY");
  });
});
