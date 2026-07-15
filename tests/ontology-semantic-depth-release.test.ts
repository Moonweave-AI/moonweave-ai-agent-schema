import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS } from "../scripts/data/ontology-v3-reviewed-relation-replacements.mjs";

import {
  loadAndValidateSources,
  loadReleaseEvidence,
  ontologyReleaseEvidencePaths,
  validateAcceptedReferenceTargets,
  validateConceptLedgerMirrorsSources,
} from "../scripts/lib/ontology-build-validation.mjs";
import {
  frozenV2SemanticBaselinePath,
  loadFrozenV2SemanticBaseline,
} from "../scripts/lib/ontology-v2-semantic-baseline.mjs";

const repositoryRoot = process.cwd();
const temporaryRoots: string[] = [];
const sha256 = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");

const loadedSources = () =>
  loadAndValidateSources({
    sourceRoot: resolve(repositoryRoot, "ontology/source"),
    artifactContractPath: resolve(
      repositoryRoot,
      "schemas/source/agent-ontology-artifact-contract.json",
    ),
  });

const conceptLedgerFixture = () => {
  const loaded = loadedSources();
  const evidence = loadReleaseEvidence({ repositoryRoot, required: true });
  const rows = evidence.rowsByPath.get(ontologyReleaseEvidencePaths[0]) ?? [];
  const modules = loaded.moduleEntries.map(({ data }) => data.module);
  const classes = loaded.moduleEntries.flatMap(({ data }) => data.classes);
  const relations = loaded.moduleEntries.flatMap(({ data }) => data.relations);
  return {
    rows,
    modules,
    classes,
    relations,
    baseline: loadFrozenV2SemanticBaseline(),
  };
};

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { force: true, recursive: true });
});

describe("v3 semantic-depth release evidence", () => {
  it("mirrors every source-controlled concept field in both directions", () => {
    const fixture = conceptLedgerFixture();
    expect(() => validateConceptLedgerMirrorsSources(fixture)).not.toThrow();

    const keyColumns = [
      "concept_id",
      "current_domain_id",
      "current_module_id",
      "current_label_zh",
      "current_semantic_kind",
      "current_primary_parent_relation_id",
      "current_depth",
      "current_root_status",
      "lexical_family",
      "definition_family",
      "decision",
      "target_domain_id",
      "target_module_id",
      "proposed_label_zh",
      "proposed_semantic_kind",
      "proposed_primary_parent_relation_id",
      "proposed_backbone_relation_id",
      "convert_to_field_of",
      "convert_to_allowed_value_of",
      "merge_into_id",
      "split_into_ids",
      "required_relation_changes",
      "owner_rationale",
      "source_ids",
      "positive_example_id",
      "boundary_example_id",
      "domain_reviewer",
      "ontology_reviewer",
      "language_reviewer",
      "review_status",
    ] as const;
    for (const column of keyColumns) {
      const rows = fixture.rows.map((row) =>
        row.concept_id === "ToolCallPlan"
          ? {
              ...row,
              [column]: row[column] === "" ? "ledger-drift" : `${row[column]}-drift`,
            }
          : row,
      );
      expect(
        () => validateConceptLedgerMirrorsSources({ ...fixture, rows }),
        column,
      ).toThrow(new RegExp(column, "iu"));
    }
  });

  it("rejects a generic ledger fallback for every reviewed relation replacement", () => {
    const fixture = conceptLedgerFixture();
    for (const { affected_concept_ids: conceptIds } of
      ONTOLOGY_V3_REVIEWED_RELATION_REPLACEMENTS) {
      for (const conceptId of conceptIds) {
        const rows = fixture.rows.map((row) =>
          row.concept_id === conceptId
            ? { ...row, required_relation_changes: "reviewed without relation replacement" }
            : row,
        );
        expect(
          () => validateConceptLedgerMirrorsSources({ ...fixture, rows }),
          conceptId,
        ).toThrow(/required_relation_changes/iu);
      }
    }
  });

  it("records additions and all deprecated replacement, conversion, merge, or split targets", () => {
    const { rows, baseline } = conceptLedgerFixture();
    const rowById = new Map(rows.map((row) => [row.concept_id, row]));

    for (const row of rows) {
      if (!baseline.concepts.has(row.concept_id)) {
        expect(row.decision, row.concept_id).toBe("add");
      }
    }

    for (const conceptId of [
      "ChunkBoundary",
      "ChunkContextNote",
      "ChunkOverlap",
      "ChunkQualitySignal",
    ]) {
      const row = rowById.get(conceptId);
      expect(row?.decision, conceptId).toBe("convert_to_field");
      expect(row?.convert_to_field_of, conceptId).toBe("ChunkMetadata");
      expect(row?.merge_into_id, conceptId).toBe("ChunkMetadata");
    }

    expect(rowById.get("ActorAuthorityScope")?.decision).toBe("merge");
    expect(rowById.get("ActorAuthorityScope")?.merge_into_id).toBe("AuthorityScope");
    expect(rowById.get("DisclosureStage")?.decision).toBe("split");
    expect(rowById.get("DisclosureStage")?.split_into_ids).not.toBe("");

    for (const conceptId of ["WorkerAgent", "ExecutionRequest", "MCPInteraction"]) {
      const row = rowById.get(conceptId);
      expect(
        `${row?.merge_into_id ?? ""}${row?.split_into_ids ?? ""}`,
        conceptId,
      ).not.toBe("");
    }
  });
});

describe("accepted graph references", () => {
  interface ReferenceExample {
    id: string;
    related_node_ids: string[];
    related_relation_ids: string[];
  }
  interface ReferenceConcept {
    id: string;
    status: string;
    primary_parent_relation_id: string | null;
    examples: ReferenceExample[];
    structure: {
      required_relation_constraints: Array<{
        id: string;
        target_concept_id: string;
      }>;
    };
    external_mappings: Array<{
      id: string;
      canonical_target_ids: string[];
    }>;
  }
  interface ReferenceQuestion {
    id: string;
    positive_example_ids: string[];
    counterexample_ids: string[];
  }

  const canonicalFixture = (): {
    id: string;
    planes: Array<{ id: string; status: string }>;
    modules: Array<{
      id: string;
      status: string;
      examples: ReferenceExample[];
      competency_questions: ReferenceQuestion[];
    }>;
    classes: ReferenceConcept[];
    relations: Array<{
      id: string;
      status: string;
      source_id: string;
      target_id: string;
    }>;
  } => ({
    id: "AgentOntology",
    planes: [],
    modules: [
      {
        id: "example-module",
        status: "accepted",
        examples: [],
        competency_questions: [],
      },
    ],
    classes: [
      {
        id: "AcceptedChild",
        status: "accepted",
        primary_parent_relation_id: null,
        examples: [],
        structure: { required_relation_constraints: [] },
        external_mappings: [],
      },
      {
        id: "DeprecatedParent",
        status: "deprecated",
        primary_parent_relation_id: null,
        examples: [
          {
            id: "deprecated-owner-example",
            related_node_ids: ["DeprecatedParent"],
            related_relation_ids: [],
          },
        ],
        structure: { required_relation_constraints: [] },
        external_mappings: [],
      },
    ],
    relations: [
      {
        id: "deprecated-parent-relation",
        status: "deprecated",
        source_id: "AcceptedChild",
        target_id: "DeprecatedParent",
      },
    ],
  });

  it("rejects accepted examples that cite deprecated nodes", () => {
    const canonical = canonicalFixture();
    canonical.classes[0].examples = [
      {
        id: "accepted-example",
        related_node_ids: ["DeprecatedParent"],
        related_relation_ids: [],
      },
    ];
    expect(() => validateAcceptedReferenceTargets(canonical)).toThrow(
      /accepted example accepted-example.*deprecated.*DeprecatedParent/iu,
    );
  });

  it("rejects deprecated primary-parent and structure targets on accepted concepts", () => {
    const primary = canonicalFixture();
    primary.classes[0].primary_parent_relation_id = "deprecated-parent-relation";
    expect(() => validateAcceptedReferenceTargets(primary)).toThrow(
      /AcceptedChild.*primary parent.*deprecated-parent-relation/iu,
    );

    const structure = canonicalFixture();
    structure.classes[0].structure.required_relation_constraints = [
      {
        id: "requires-live-target",
        target_concept_id: "DeprecatedParent",
      },
    ];
    expect(() => validateAcceptedReferenceTargets(structure)).toThrow(
      /AcceptedChild.*structure.*deprecated.*DeprecatedParent/iu,
    );
  });

  it("rejects competency-question examples owned by deprecated records", () => {
    const canonical = canonicalFixture();
    canonical.modules[0].competency_questions = [
      {
        id: "CQ-live-owner-only",
        positive_example_ids: ["deprecated-owner-example"],
        counterexample_ids: [],
      },
    ];
    expect(() => validateAcceptedReferenceTargets(canonical)).toThrow(
      /CQ-live-owner-only.*deprecated-owner-example.*DeprecatedParent/iu,
    );
  });
});

describe("semantic-depth migration reproducibility", () => {
  it("publishes sources, ledgers, audit, and registries through one file transaction", () => {
    const entryPath = resolve(repositoryRoot, "scripts/migrate-semantic-depth-v3.mjs");
    const phaseRoot = resolve(repositoryRoot, "scripts/migration/semantic-depth-v3");
    const migrationPaths = [
      entryPath,
      ...readdirSync(phaseRoot)
        .filter((name) => name.endsWith(".mjs"))
        .map((name) => resolve(phaseRoot, name)),
    ];
    const entrySource = readFileSync(entryPath, "utf8");
    const migrationSource = migrationPaths
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const transactionCalls = migrationSource.match(/writeFileTransaction\s*\(/gu) ?? [];

    expect(entrySource).toMatch(
      /import\s*\{\s*writeFileTransaction\s*\}\s*from\s*"\.\/lib\/atomic-write\.mjs"/u,
    );
    expect(transactionCalls).toHaveLength(1);
    expect(migrationSource).not.toMatch(
      /fs\.(?:writeFileSync|appendFileSync|renameSync|rmSync)\s*\(/u,
    );
    for (const requiredPath of [
      "ontology-concept-semantic-depth-v3-ledger.csv",
      "ontology-module-boundary-v3.csv",
      "ontology-module-cq-v3.csv",
      "ontology-semantic-depth-audit.json",
      "source-registry.csv",
      "living-source-metadata.csv",
      "semantic-depth-module-boundary-and-graph-layout-2023-2026.md",
    ]) {
      expect(migrationSource).toContain(requiredPath);
    }
    for (const path of migrationPaths) {
      expect(
        readFileSync(path, "utf8").split(/\r?\n/u).length,
        path,
      ).toBeLessThanOrEqual(800);
    }
  });

  it("keeps the frozen v2 evidence immutable and produces identical source, ledgers, and audit twice", () => {
    const root = mkdtempSync(resolve(tmpdir(), "moonweave-semantic-depth-migration-"));
    temporaryRoots.push(root);
    cpSync(resolve(repositoryRoot, "ontology/source"), resolve(root, "ontology/source"), {
      recursive: true,
    });
    for (const relativePath of [
      "research/source-registry.csv",
      "research/living-source-metadata.csv",
    ]) {
      const destination = resolve(root, relativePath);
      mkdirSync(dirname(destination), { recursive: true });
      cpSync(resolve(repositoryRoot, relativePath), destination);
    }

    const baselineHash = sha256(readFileSync(frozenV2SemanticBaselinePath));
    const migrationPath = resolve(repositoryRoot, "scripts/migrate-semantic-depth-v3.mjs");
    const runMigration = () =>
      spawnSync(process.execPath, [migrationPath], {
        cwd: root,
        encoding: "utf8",
      });
    const firstRun = runMigration();
    expect(firstRun.status, `${firstRun.stdout}\n${firstRun.stderr}`).toBe(0);

    const observedPaths = [
      ...loadedSources().moduleEntries.map(({ relativePath }) =>
        resolve(root, "ontology/source", relativePath),
      ),
      resolve(root, "ontology/source/agent-ontology.product.json"),
      ...ontologyReleaseEvidencePaths.slice(0, 3).map((relativePath) =>
        resolve(root, relativePath),
      ),
      resolve(root, "research/generated/ontology-semantic-depth-audit.json"),
    ];
    const firstBytes = new Map(
      observedPaths.map((path) => [path, readFileSync(path)]),
    );

    const secondRun = runMigration();
    expect(secondRun.status, `${secondRun.stdout}\n${secondRun.stderr}`).toBe(0);
    for (const [path, bytes] of firstBytes) {
      expect(readFileSync(path).equals(bytes), path).toBe(true);
    }
    expect(sha256(readFileSync(frozenV2SemanticBaselinePath))).toBe(baselineHash);
  }, 60_000);
});
