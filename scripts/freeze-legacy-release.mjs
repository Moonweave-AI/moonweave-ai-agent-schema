import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repositoryRoot = process.cwd();
const frozenRoot = resolve(repositoryRoot, "ontology/migration/legacy-v1/frozen-release");

const artifacts = {
  "ontology/agent-ontology.json":
    "344b64a3cb2a2e14eefbfc499be6989f4944ec4d4757fc7e7738c1795bd2d91c",
  "ontology/agent-ontology-definitions.json":
    "d5e1d15a1f45c94d2c76d7a3c32701e1ecaf5090c03efe2f5ba23035c4318a8f",
  "ontology/agent-ontology.md":
    "c3e86fe06f20a1d4b96e14201566e5ab62e8eb53cf720adc944986a109a68055",
};

const sha256File = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

for (const [relativePath, expectedHash] of Object.entries(artifacts)) {
  const sourcePath = resolve(repositoryRoot, relativePath);
  const actualHash = sha256File(sourcePath);

  if (actualHash !== expectedHash) {
    throw new Error(
      `Refusing to freeze ${relativePath}: expected ${expectedHash}, received ${actualHash}`,
    );
  }

  const destinationPath = resolve(frozenRoot, relativePath);
  mkdirSync(dirname(destinationPath), { recursive: true });
  copyFileSync(sourcePath, destinationPath);
}

const manifest = {
  generated: true,
  purpose: "immutable-input-snapshot-for-lossless-legacy-v1-migration-audit",
  canonical_runtime_source: false,
  do_not_edit: true,
  artifacts: Object.entries(artifacts).map(([path, sha256]) => ({ path, sha256 })),
};

writeFileSync(
  resolve(frozenRoot, "freeze-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
