import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertDecisionTargetsResolve,
  assertDispositionManifestIntegrity,
  assertRecordManifestIntegrity,
  auditLegacyMigration,
  collectSourceTargetRefs,
} from "../scripts/lib/ontology-legacy-audit.mjs";

const sha256 = async (value: unknown): Promise<string> => {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
};

describe("source-first legacy migration audit", () => {
  it("audits the frozen v1 lineage without rewriting the editable source tree", () => {
    const repositoryRoot = process.cwd();
    const sourcePath = resolve(
      repositoryRoot,
      "ontology/source/agent-ontology.product.json",
    );
    const before = {
      bytes: readFileSync(sourcePath),
      modifiedAt: statSync(sourcePath).mtimeMs,
    };

    const result = auditLegacyMigration({ repositoryRoot });

    expect(result).toEqual(
      expect.objectContaining({
        frozenLegacySha256:
          "344b64a3cb2a2e14eefbfc499be6989f4944ec4d4757fc7e7738c1795bd2d91c",
        legacyRecordCount: 2881,
        acceptedDispositionCount: 2881,
        conceptDecisionCount: 572,
        unresolvedTargetCount: 0,
      }),
    );
    expect(readFileSync(sourcePath).equals(before.bytes)).toBe(true);
    expect(statSync(sourcePath).mtimeMs).toBe(before.modifiedAt);
  });

  it("verifies every record pointer and frozen payload hash", async () => {
    const record = { id: "LegacyConcept", labels: { en: "Legacy concept" } };
    const recordManifest = [
      {
        source_collection: "classes",
        id: "LegacyConcept",
        original_json_pointer: "/classes/0",
        payload_sha256: await sha256(record),
      },
    ];

    expect(() =>
      assertRecordManifestIntegrity({
        legacy: { classes: [record] },
        recordManifest,
        expectedRecordCount: 1,
      }),
    ).not.toThrow();

    expect(() =>
      assertRecordManifestIntegrity({
        legacy: { classes: [{ ...record, labels: { en: "Drifted" } }] },
        recordManifest,
        expectedRecordCount: 1,
      }),
    ).toThrow(/payload hash/u);
  });

  it("rejects incomplete, duplicate, or misdirected frozen-record manifests", async () => {
    const record = { id: "LegacyConcept" };
    const payloadHash = await sha256(record);
    const valid = {
      source_collection: "classes",
      id: "LegacyConcept",
      original_json_pointer: "/classes/0",
      payload_sha256: payloadHash,
    };

    expect(() =>
      assertRecordManifestIntegrity({
        legacy: { classes: [record] },
        recordManifest: [],
        expectedRecordCount: 1,
      }),
    ).toThrow(/must contain 1 records/u);
    expect(() =>
      assertRecordManifestIntegrity({
        legacy: { classes: [record] },
        recordManifest: [valid, valid],
        expectedRecordCount: 2,
      }),
    ).toThrow(/Duplicate legacy record/u);
    expect(() =>
      assertRecordManifestIntegrity({
        legacy: { classes: [record] },
        recordManifest: [{ ...valid, source_collection: "terms" }],
        expectedRecordCount: 1,
      }),
    ).toThrow(/points into classes/u);
    expect(() =>
      assertRecordManifestIntegrity({
        legacy: { classes: [] },
        recordManifest: [valid],
        expectedRecordCount: 1,
      }),
    ).toThrow(/does not resolve/u);
  });

  it("requires a one-to-one accepted disposition and a resolvable current-source target", async () => {
    const record = { id: "LegacyConcept" };
    const payloadHash = await sha256(record);
    const recordManifest = [
      {
        source_collection: "classes",
        id: "LegacyConcept",
        original_json_pointer: "/classes/0",
        payload_sha256: payloadHash,
      },
    ];
    const dispositionManifest = {
      baseline_sha256: "baseline",
      counts: { records: 1, accepted: 1 },
      records: [
        {
          ...recordManifest[0],
          action: "keep_reparent",
          target_refs: ["CanonicalConcept"],
          reviewer: "reviewer",
          status: "accepted",
        },
      ],
    };
    const sourceDocuments = [
      {
        classes: [
          {
            id: "CanonicalConcept",
            structure: { fields: [{ id: "status" }] },
          },
        ],
      },
    ];

    expect(() =>
      assertDispositionManifestIntegrity({
        dispositionManifest,
        recordManifest,
        expectedBaselineSha256: "baseline",
        expectedRecordCount: 1,
        sourceTargetRefs: collectSourceTargetRefs(sourceDocuments),
      }),
    ).not.toThrow();

    expect(() =>
      assertDispositionManifestIntegrity({
        dispositionManifest,
        recordManifest,
        expectedBaselineSha256: "baseline",
        expectedRecordCount: 1,
        sourceTargetRefs: new Set(),
      }),
    ).toThrow(/unresolved current-source targets.*CanonicalConcept/iu);
  });

  it("rejects disposition drift before it can be hidden by a valid source target", async () => {
    const payloadHash = await sha256({ id: "LegacyConcept" });
    const record = {
      source_collection: "classes",
      id: "LegacyConcept",
      original_json_pointer: "/classes/0",
      payload_sha256: payloadHash,
    };
    const accepted = {
      ...record,
      action: "keep_reparent",
      target_refs: ["CanonicalConcept"],
      reviewer: "reviewer",
      status: "accepted",
    };
    const base = {
      baseline_sha256: "baseline",
      counts: { records: 1, accepted: 1 },
      records: [accepted],
    };
    const run = (
      dispositionManifest: Record<string, unknown>,
      recordManifest: readonly Record<string, unknown>[] = [record],
      expectedRecordCount = 1,
    ) =>
      assertDispositionManifestIntegrity({
        dispositionManifest,
        recordManifest,
        expectedBaselineSha256: "baseline",
        expectedRecordCount,
        sourceTargetRefs: new Set(["CanonicalConcept"]),
      });

    expect(() => run({ ...base, baseline_sha256: "drifted" })).toThrow(
      /wrong frozen baseline/u,
    );
    expect(() => run({ ...base, counts: { records: 0, accepted: 0 } })).toThrow(
      /accept all 1 records/u,
    );
    expect(() =>
      run(
        {
          ...base,
          counts: { records: 2, accepted: 2 },
          records: [accepted, accepted],
        },
        [record, record],
        2,
      ),
    ).toThrow(/Duplicate legacy disposition/u);
    expect(() =>
      run({ ...base, records: [{ ...accepted, payload_sha256: "drifted" }] }),
    ).toThrow(/does not match its frozen record/u);
    expect(() =>
      run({ ...base, records: [{ ...accepted, status: "draft" }] }),
    ).toThrow(/not a complete accepted review/u);
    expect(() =>
      run({ ...base, records: [{ ...accepted, target_refs: [] }] }),
    ).toThrow(/requires a current-source target/u);
    expect(() =>
      run(base, [record, { ...record, id: "Other", original_json_pointer: "/classes/1" }]),
    ).toThrow(/missing frozen records/u);
  });

  it("resolves retained decisions, parents, Modules, fields, anchors, and reviewed relation facts", () => {
    const sourceTargetRefs = new Set([
      "module-a",
      "Parent",
      "Child",
      "Child.status",
      "Anchor",
      "Child-uses-Anchor",
    ]);
    const bundles = [
      {
        concept_decisions: [
          {
            concept_id: "Child",
            decision: "keep_reparent",
            target_module_id: "module-a",
            primary_parent_id: "Parent",
            additional_parent_ids: [],
          },
          {
            concept_id: "LegacyStatus",
            decision: "convert_to_field",
            target_module_id: "module-a",
            target_concept_id: "Child",
            target_field_id: "Child.status",
            primary_parent_id: null,
            additional_parent_ids: [],
          },
        ],
        new_anchors: [
          { id: "Anchor", module_id: "module-a", parent_ids: ["Parent"] },
        ],
        modules: [
          {
            module_id: "module-a",
            semantic_relations: [
              { source_id: "Child", predicate: "uses", target_id: "Anchor" },
            ],
          },
        ],
      },
    ];

    expect(() =>
      assertDecisionTargetsResolve({ bundles, sourceTargetRefs }),
    ).not.toThrow();
    expect(() =>
      assertDecisionTargetsResolve({
        bundles,
        sourceTargetRefs: new Set([...sourceTargetRefs].filter((id) => id !== "Child.status")),
      }),
    ).toThrow(/Child\.status/u);
  });

  it("requires explicit convergence targets when a reviewed fact was refined or decomposed", () => {
    const bundles = [
      {
        concept_decisions: [],
        new_anchors: [],
        modules: [
          {
            module_id: "module-a",
            semantic_relations: [
              { source_id: "Run", predicate: "links", target_id: "Attempt" },
            ],
          },
        ],
      },
    ];
    const sourceTargetRefs = new Set([
      "module-a",
      "Run",
      "Attempt",
      "retries_from_attempt",
      "terminates_on_condition",
    ]);

    expect(() =>
      assertDecisionTargetsResolve({ bundles, sourceTargetRefs }),
    ).toThrow(/Run-links-Attempt/u);
    expect(() =>
      assertDecisionTargetsResolve({
        bundles,
        sourceTargetRefs,
        convergenceMappings: [
          {
            legacy_fact_id: "Run-links-Attempt",
            target_relation_ids: [
              "retries_from_attempt",
              "terminates_on_condition",
            ],
          },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      assertDecisionTargetsResolve({
        bundles,
        sourceTargetRefs,
        convergenceMappings: [
          { legacy_fact_id: "Run-links-Attempt", target_relation_ids: [] },
        ],
      }),
    ).toThrow(/Invalid domain-decision convergence mapping/u);
    expect(() =>
      assertDecisionTargetsResolve({
        bundles,
        sourceTargetRefs: new Set([...sourceTargetRefs, "Run-links-Attempt"]),
        convergenceMappings: [
          {
            legacy_fact_id: "Unused-fact-Target",
            target_relation_ids: ["retries_from_attempt"],
          },
        ],
      }),
    ).toThrow(/do not match reviewed facts/u);
  });

  it("keeps release verification independent from one-time reviewed replay code", () => {
    const repositoryRoot = process.cwd();
    const releaseScript = readFileSync(
      resolve(repositoryRoot, "scripts/release-agent-ontology.mjs"),
      "utf8",
    );
    const releaseCommandLibrary = readFileSync(
      resolve(repositoryRoot, "scripts/lib/ontology-release-command.mjs"),
      "utf8",
    );
    const auditLibrary = readFileSync(
      resolve(repositoryRoot, "scripts/lib/ontology-legacy-audit.mjs"),
      "utf8",
    );

    expect(releaseScript).toContain("./lib/ontology-release-command.mjs");
    expect(releaseScript).not.toContain("apply-reviewed-ontology-migration.mjs");
    expect(releaseCommandLibrary).toContain(
      "verify-legacy-ontology-migration-audit.mjs",
    );
    expect(releaseCommandLibrary).not.toContain(
      "apply-reviewed-ontology-migration.mjs",
    );
    expect(auditLibrary).not.toMatch(/ontology-reviewed-|apply-reviewed/u);

    const packageJson = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    );
    expect(packageJson.scripts["ontology:migrate"]).toContain(
      "verify-legacy-ontology-migration-audit.mjs",
    );
    expect(packageJson.scripts["ontology:legacy:replay"]).toContain(
      "--legacy-replay",
    );
  });

  it("requires an explicit legacy replay flag before the historical tool may write", () => {
    const repositoryRoot = process.cwd();
    const replayScript = resolve(
      repositoryRoot,
      "scripts/apply-reviewed-ontology-migration.mjs",
    );
    const sourcePath = resolve(
      repositoryRoot,
      "ontology/source/agent-ontology.product.json",
    );
    const before = readFileSync(sourcePath);

    const result = spawnSync(process.execPath, [replayScript], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/--legacy-replay/u);
    expect(readFileSync(sourcePath).equals(before)).toBe(true);
  });
});
