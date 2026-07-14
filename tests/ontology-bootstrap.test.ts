import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

type LegacyCollectionName =
  | "planes"
  | "modules"
  | "terms"
  | "classes"
  | "relations"
  | "object_properties"
  | "data_properties"
  | "individuals"
  | "axioms"
  | "adapter_mappings";

interface LegacyRecordEvidence {
  source_collection: string;
  id: string;
  original_json_pointer: string;
  payload_sha256: string;
}

interface DedupGroup {
  canonical_target_id: string;
  canonical_kind: "concept" | "relation";
  source_records: LegacyRecordEvidence[];
}

interface StaleDefinitionEvidence extends LegacyRecordEvidence {
  source_collection: "definition_ledger";
}

interface SourceSetDriftEvidence {
  id: string;
  canonical_collection: string;
  canonical_json_pointer: string;
  definition_json_pointer: string;
  canonical_source_ids: string[];
  definition_source_ids: string[];
}

interface OwnershipConflictEvidence {
  concept_id: string;
  declared_module_id: string;
  membership_module_ids: string[];
  evidence_json_pointers: string[];
}

interface BootstrapManifest {
  baseline: {
    artifacts: Array<{ path: string; sha256: string }>;
    collections: Record<string, { count: number; ids: string[] }>;
  };
  records: LegacyRecordEvidence[];
  dedup_groups: DedupGroup[];
  stale_definitions: StaleDefinitionEvidence[];
  source_set_drifts: SourceSetDriftEvidence[];
  ownership_conflicts: OwnershipConflictEvidence[];
}

interface BootstrapRun {
  outputRoot: string;
  process?: SpawnSyncReturns<string>;
}

const repositoryRoot = process.cwd();
const bootstrapScript = resolve(repositoryRoot, "scripts/bootstrap-legacy-ontology.mjs");
const frozenReleaseRoot = resolve(
  repositoryRoot,
  "ontology/migration/legacy-v1/frozen-release",
);

const baselineArtifacts = {
  "ontology/agent-ontology.json":
    "344b64a3cb2a2e14eefbfc499be6989f4944ec4d4757fc7e7738c1795bd2d91c",
  "ontology/agent-ontology-definitions.json":
    "d5e1d15a1f45c94d2c76d7a3c32701e1ecaf5090c03efe2f5ba23035c4318a8f",
  "ontology/agent-ontology.md":
    "c3e86fe06f20a1d4b96e14201566e5ab62e8eb53cf720adc944986a109a68055",
} as const;

const legacyCollectionNames: LegacyCollectionName[] = [
  "planes",
  "modules",
  "terms",
  "classes",
  "relations",
  "object_properties",
  "data_properties",
  "individuals",
  "axioms",
  "adapter_mappings",
];

const expectedCollectionCounts: Record<LegacyCollectionName, number> = {
  planes: 8,
  modules: 41,
  terms: 572,
  classes: 572,
  relations: 421,
  object_properties: 421,
  data_properties: 102,
  individuals: 80,
  axioms: 657,
  adapter_mappings: 7,
};

const expectedSemanticRecordCount = Object.values(expectedCollectionCounts).reduce(
  (total, count) => total + count,
  0,
);

const sha256 = (payload: string | Buffer): string =>
  createHash("sha256").update(payload).digest("hex");

const sha256File = (path: string): string => sha256(readFileSync(path));

const payloadSha256 = (payload: unknown): string =>
  sha256(Buffer.from(JSON.stringify(payload), "utf8"));

const escapeJsonPointerToken = (token: string): string =>
  token.replaceAll("~", "~0").replaceAll("/", "~1");

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8")) as T;

const legacyCanonical = readJson<Record<string, unknown[]>>(
  resolve(frozenReleaseRoot, "ontology/agent-ontology.json"),
);

const definitionLedger = readJson<{
  definitions: Record<string, JsonObject & { source_ids?: string[] }>;
}>(resolve(frozenReleaseRoot, "ontology/agent-ontology-definitions.json"));

const recordId = (collection: LegacyCollectionName, value: unknown): string => {
  const record = value as { id?: unknown; adapter?: unknown };
  const id = collection === "adapter_mappings" ? record.adapter : record.id;

  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Legacy ${collection} record is missing its stable identifier`);
  }

  return id;
};

const expectedLegacyRecords = legacyCollectionNames.flatMap((collection) =>
  legacyCanonical[collection].map((payload, index): LegacyRecordEvidence => ({
    source_collection: collection,
    id: recordId(collection, payload),
    original_json_pointer: `/${collection}/${index}`,
    payload_sha256: payloadSha256(payload),
  })),
);

const recordKey = ({
  source_collection: collection,
  id,
  original_json_pointer: pointer,
}: Pick<LegacyRecordEvidence, "source_collection" | "id" | "original_json_pointer">): string =>
  `${collection}\u0000${id}\u0000${pointer}`;

const fullEvidenceKey = (record: LegacyRecordEvidence): string =>
  `${recordKey(record)}\u0000${record.payload_sha256}`;

const canonicalDefinitionCollections = [
  "planes",
  "modules",
  "terms",
  "relations",
  "data_properties",
  "individuals",
  "axioms",
] as const;

const canonicalDefinitionIds = new Set(
  canonicalDefinitionCollections.flatMap((collection) =>
    legacyCanonical[collection].map((payload) => recordId(collection, payload)),
  ),
);

const expectedStaleDefinitions = Object.entries(definitionLedger.definitions)
  .filter(([id]) => id !== "agent-system-ontology" && !canonicalDefinitionIds.has(id))
  .map(([id, payload]): StaleDefinitionEvidence => ({
    source_collection: "definition_ledger",
    id,
    original_json_pointer: `/definitions/${escapeJsonPointerToken(id)}`,
    payload_sha256: payloadSha256(payload),
  }));

const normalizedSourceIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string"))].sort()
    : [];

const expectedSourceSetDrifts = canonicalDefinitionCollections.flatMap((collection) =>
  legacyCanonical[collection].flatMap((payload, index): SourceSetDriftEvidence[] => {
    const record = payload as JsonObject & { id: string; source_ids?: string[] };
    const ledgerRecord = definitionLedger.definitions[record.id];
    const canonicalSourceIds = normalizedSourceIds(record.source_ids);
    const definitionSourceIds = normalizedSourceIds(ledgerRecord?.source_ids);

    return JSON.stringify(canonicalSourceIds) === JSON.stringify(definitionSourceIds)
      ? []
      : [
          {
            id: record.id,
            canonical_collection: collection,
            canonical_json_pointer: `/${collection}/${index}/source_ids`,
            definition_json_pointer: `/definitions/${escapeJsonPointerToken(record.id)}/source_ids`,
            canonical_source_ids: canonicalSourceIds,
            definition_source_ids: definitionSourceIds,
          },
        ];
  }),
);

const copyLegacyBaseline = (destinationRoot: string): void => {
  for (const relativePath of Object.keys(baselineArtifacts)) {
    const destination = resolve(destinationRoot, relativePath);
    mkdirSync(resolve(destination, ".."), { recursive: true });
    copyFileSync(resolve(frozenReleaseRoot, relativePath), destination);
  }
};

const listFiles = (root: string): string[] => {
  if (!existsSync(root)) {
    return [];
  }

  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    })
    .sort((left, right) => left.localeCompare(right));
};

interface OutputFingerprint {
  byteLength: number;
  sha256: string;
}

const outputFingerprints = (root: string): Map<string, OutputFingerprint> =>
  new Map(
    listFiles(root).map((path) => {
      const payload = readFileSync(path);
      return [
        relative(root, path).replaceAll("\\", "/"),
        { byteLength: payload.byteLength, sha256: sha256(payload) },
      ];
    }),
  );

const crossPlatformReproducibilityTimeoutMs = 60_000;

const requireSuccessfulRun = (run: BootstrapRun): void => {
  expect(
    existsSync(bootstrapScript),
    "Phase 1 requires scripts/bootstrap-legacy-ontology.mjs before any legacy record can migrate",
  ).toBe(true);
  expect(
    run.process?.status,
    [run.process?.stdout, run.process?.stderr].filter(Boolean).join("\n"),
  ).toBe(0);
};

const readManifest = (run: BootstrapRun): BootstrapManifest => {
  requireSuccessfulRun(run);
  const manifestPath = resolve(
    run.outputRoot,
    "ontology/migration/legacy-v1/bootstrap-manifest.json",
  );
  expect(existsSync(manifestPath), `Missing lossless manifest: ${manifestPath}`).toBe(true);
  return readJson<BootstrapManifest>(manifestPath);
};

let temporaryRoot = "";
let legacyRoot = "";
let firstRun: BootstrapRun;
let secondRun: BootstrapRun;
let inputHashesBefore: Record<string, string>;

beforeAll(() => {
  temporaryRoot = mkdtempSync(join(tmpdir(), "moonweave-legacy-bootstrap-"));
  legacyRoot = resolve(temporaryRoot, "legacy-input");
  copyLegacyBaseline(legacyRoot);

  inputHashesBefore = Object.fromEntries(
    Object.keys(baselineArtifacts).map((relativePath) => [
      relativePath,
      sha256File(resolve(legacyRoot, relativePath)),
    ]),
  );

  const run = (name: string): BootstrapRun => {
    const outputRoot = resolve(temporaryRoot, name);
    mkdirSync(outputRoot, { recursive: true });

    return {
      outputRoot,
      process: existsSync(bootstrapScript)
        ? spawnSync(
            process.execPath,
            [bootstrapScript, "--legacy-root", legacyRoot, "--output-root", outputRoot],
            { cwd: repositoryRoot, encoding: "utf8" },
          )
        : undefined,
    };
  };

  firstRun = run("bootstrap-a");
  secondRun = run("bootstrap-b");
});

afterAll(() => {
  if (temporaryRoot.length > 0 && existsSync(temporaryRoot) && statSync(temporaryRoot).isDirectory()) {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

describe("frozen legacy v1 release baseline", () => {
  it("locks the three release artifact SHA-256 values", () => {
    for (const [relativePath, expectedHash] of Object.entries(baselineArtifacts)) {
      expect(sha256File(resolve(frozenReleaseRoot, relativePath)), relativePath).toBe(expectedHash);
    }
  });

  it("locks all ten semantic collection counts at 2,881 source records", () => {
    // design_references, term_kinds and hygiene_gates are release metadata/control lists,
    // not ID-bearing ontology records. Duplicate legacy collections remain records until
    // the manifest proves their explicit 993-way deduplication.
    expect(
      Object.fromEntries(
        legacyCollectionNames.map((collection) => [collection, legacyCanonical[collection].length]),
      ),
    ).toEqual(expectedCollectionCounts);
    expect(expectedSemanticRecordCount).toBe(2_881);
  });
});

describe("lossless legacy bootstrap manifest", () => {
  it("records the frozen artifact hashes and collection ID inventories", () => {
    const manifest = readManifest(firstRun);
    expect(
      Object.fromEntries(manifest.baseline.artifacts.map((artifact) => [artifact.path, artifact.sha256])),
    ).toEqual(baselineArtifacts);

    for (const collection of legacyCollectionNames) {
      const expectedIds = legacyCanonical[collection].map((payload) => recordId(collection, payload));
      expect(manifest.baseline.collections[collection], collection).toEqual({
        count: expectedCollectionCounts[collection],
        ids: expectedIds,
      });
    }
  });

  it("captures every collection/id/json-pointer record and payload hash exactly once", () => {
    const manifest = readManifest(firstRun);
    const actualKeys = manifest.records.map(fullEvidenceKey);
    const expectedKeys = expectedLegacyRecords.map(fullEvidenceKey);

    expect(manifest.records).toHaveLength(2_881);
    expect(new Set(manifest.records.map(recordKey)).size).toBe(2_881);
    expect([...actualKeys].sort()).toEqual([...expectedKeys].sort());
  });

  it("preserves 993 explicit duplicate groups instead of silently dropping legacy records", () => {
    const manifest = readManifest(firstRun);
    expect(manifest.dedup_groups).toHaveLength(993);

    const expectedGroups = [
      ...legacyCanonical.terms.map((payload) => ({
        canonical_kind: "concept" as const,
        canonical_target_id: recordId("terms", payload),
        sourceCollections: ["classes", "terms"],
      })),
      ...legacyCanonical.relations.map((payload) => ({
        canonical_kind: "relation" as const,
        canonical_target_id: recordId("relations", payload),
        sourceCollections: ["object_properties", "relations"],
      })),
    ].sort((left, right) =>
      `${left.canonical_kind}:${left.canonical_target_id}`.localeCompare(
        `${right.canonical_kind}:${right.canonical_target_id}`,
      ),
    );

    const actualGroups = manifest.dedup_groups
      .map((group) => ({
        canonical_kind: group.canonical_kind,
        canonical_target_id: group.canonical_target_id,
        sourceCollections: group.source_records
          .map((record) => record.source_collection)
          .sort(),
      }))
      .sort((left, right) =>
        `${left.canonical_kind}:${left.canonical_target_id}`.localeCompare(
          `${right.canonical_kind}:${right.canonical_target_id}`,
        ),
      );

    expect(actualGroups).toEqual(expectedGroups);

    const dedupEvidence = manifest.dedup_groups.flatMap((group) =>
      group.source_records.map(fullEvidenceKey),
    );
    const expectedDedupEvidence = expectedLegacyRecords
      .filter((record) =>
        ["terms", "classes", "relations", "object_properties"].includes(
          record.source_collection,
        ),
      )
      .map(fullEvidenceKey);
    expect([...dedupEvidence].sort()).toEqual([...expectedDedupEvidence].sort());
  });

  it("captures all 32 stale definition-ledger entries with their original payloads", () => {
    const manifest = readManifest(firstRun);
    expect(expectedStaleDefinitions).toHaveLength(32);
    expect(manifest.stale_definitions).toHaveLength(32);
    expect(manifest.stale_definitions.map(fullEvidenceKey).sort()).toEqual(
      expectedStaleDefinitions.map(fullEvidenceKey).sort(),
    );
  });

  it("captures all 507 canonical-versus-ledger source-set drifts", () => {
    const manifest = readManifest(firstRun);
    expect(expectedSourceSetDrifts).toHaveLength(507);
    expect(manifest.source_set_drifts).toHaveLength(507);

    const driftKey = (drift: SourceSetDriftEvidence): string =>
      JSON.stringify({
        ...drift,
        canonical_source_ids: normalizedSourceIds(drift.canonical_source_ids),
        definition_source_ids: normalizedSourceIds(drift.definition_source_ids),
      });

    expect(manifest.source_set_drifts.map(driftKey).sort()).toEqual(
      expectedSourceSetDrifts.map(driftKey).sort(),
    );
  });

  it("retains the InstructionConflict double-ownership evidence without guessing a resolution", () => {
    const manifest = readManifest(firstRun);
    const conflict = manifest.ownership_conflicts.find(
      (entry) => entry.concept_id === "InstructionConflict",
    );

    expect(conflict).toEqual(
      expect.objectContaining({
        concept_id: "InstructionConflict",
        declared_module_id: "safety-injection-defense",
        membership_module_ids: ["info-messages-instructions", "safety-injection-defense"],
      }),
    );
    expect(conflict?.evidence_json_pointers).toEqual(
      expect.arrayContaining([
        "/terms/207/module_id",
        "/classes/207/module_id",
        "/modules/8/class_ids/11",
        "/modules/29/class_ids/4",
      ]),
    );
  });
});

describe("bootstrap reproducibility and input immutability", () => {
  it("produces a byte-identical output tree twice from the same frozen inputs", () => {
    requireSuccessfulRun(firstRun);
    requireSuccessfulRun(secondRun);

    const firstOutput = outputFingerprints(firstRun.outputRoot);
    const secondOutput = outputFingerprints(secondRun.outputRoot);
    expect(firstOutput.size).toBeGreaterThan(0);
    expect([...firstOutput.entries()]).toEqual([...secondOutput.entries()]);
  }, crossPlatformReproducibilityTimeoutMs);

  it("does not modify either the copied inputs or the frozen release snapshot", () => {
    requireSuccessfulRun(firstRun);
    requireSuccessfulRun(secondRun);

    const copiedHashesAfter = Object.fromEntries(
      Object.keys(baselineArtifacts).map((relativePath) => [
        relativePath,
        sha256File(resolve(legacyRoot, relativePath)),
      ]),
    );
    const frozenHashesAfter = Object.fromEntries(
      Object.keys(baselineArtifacts).map((relativePath) => [
        relativePath,
        sha256File(resolve(frozenReleaseRoot, relativePath)),
      ]),
    );

    expect(copiedHashesAfter).toEqual(inputHashesBefore);
    expect(frozenHashesAfter).toEqual(baselineArtifacts);
  });
});
