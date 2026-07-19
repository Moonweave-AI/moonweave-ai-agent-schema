import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type Field = {
  readonly id: string;
  readonly required: boolean;
  readonly datatype?: string;
  readonly allowed_values?: readonly string[];
};

type Source = {
  readonly id: string;
  readonly url: string;
};

type SourceClaim = {
  readonly id: string;
  readonly source: string;
  readonly evidence_kind: string;
  readonly supports: string;
};

type Relation = {
  readonly id: string;
  readonly predicate: string;
  readonly target: string;
  readonly direction?: string;
  readonly relation_kind: string;
};

type Example = {
  readonly id: string;
  readonly kind: string;
  readonly field_values?: Readonly<Record<string, unknown>>;
  readonly related_node_ids?: readonly string[];
  readonly related_relation_ids?: readonly string[];
  readonly source_claims?: readonly string[];
};

type Node = {
  readonly id: string;
  readonly labels?: { readonly en?: string };
  readonly semantics?: { readonly definition?: { readonly en?: string } };
  readonly sources?: readonly Source[];
  readonly source_claims?: readonly SourceClaim[];
  readonly parent_relation?: Relation | null;
  readonly relations?: readonly Relation[];
  readonly examples?: readonly Example[];
  readonly structure?: {
    readonly identity_keys?: readonly string[];
    readonly fields?: readonly Field[];
  };
};

const governanceReferenceRoot = resolve(
  "ontology",
  "info-plane",
  "info-storage-sources",
  "SourceReference",
  "GovernanceReference",
);
const legacyDirectory = resolve(governanceReferenceRoot, "DataZoneReference");
const legacyPath = resolve(legacyDirectory, "node.yaml");
const canonicalPath = resolve(governanceReferenceRoot, "DataGovernanceZoneReference", "node.yaml");
const parentPath = resolve(governanceReferenceRoot, "node.yaml");

const loadNode = (path: string): Node => parse(readFileSync(path, "utf8")) as Node;

const fieldFor = (node: Node, fieldId: string): Field | undefined => (
  node.structure?.fields?.find((field) => field.id === fieldId)
);

describe("DataGovernanceZoneReference migration", () => {
  it("physically replaces the ambiguous legacy path with the canonical data-governance path", () => {
    expect(existsSync(canonicalPath)).toBe(true);
    expect(existsSync(legacyPath)).toBe(false);
    expect(existsSync(legacyDirectory)).toBe(false);

    expect(loadNode(canonicalPath)).toMatchObject({
      id: "DataGovernanceZoneReference",
      labels: { en: "Data Governance Zone Reference" },
      parent_relation: {
        id: "DataGovernanceZoneReference-is_a-GovernanceReference",
        predicate: "is_a",
        target: "concept:GovernanceReference",
        direction: "source-to-target",
        relation_kind: "hierarchy",
      },
    });
  });

  it("retains every GovernanceReference identity and field contract while narrowing its role", () => {
    const parent = loadNode(parentPath);
    const child = loadNode(canonicalPath);
    const parentIdentity = parent.structure?.identity_keys ?? [];
    const parentFields = parent.structure?.fields?.map((field) => field.id) ?? [];
    const requiredParentFields = parent.structure?.fields
      ?.filter((field) => field.required)
      .map((field) => field.id) ?? [];
    const childFields = child.structure?.fields?.map((field) => field.id) ?? [];

    expect(child.structure?.identity_keys).toEqual(expect.arrayContaining(parentIdentity));
    expect(child.structure?.identity_keys).toContain("governance_reference_id");
    expect(childFields).toEqual(expect.arrayContaining(parentFields));
    expect(childFields).toEqual(expect.arrayContaining(requiredParentFields));
    expect(fieldFor(child, "governance_reference_id")).toMatchObject({
      id: "governance_reference_id",
      required: true,
    });
    expect(fieldFor(child, "governance_subject_uri")).toMatchObject({
      id: "governance_subject_uri",
      required: true,
      datatype: "uri",
    });
    expect(fieldFor(child, "governance_role")).toMatchObject({
      id: "governance_role",
      required: true,
      allowed_values: ["data-zone-declaration"],
    });
    expect(fieldFor(child, "data_governance_zone_identifier")).toMatchObject({
      id: "data_governance_zone_identifier",
      required: true,
      datatype: "string",
    });
  });

  it("uses authoritative locator and data-governance evidence without claiming a zero-trust equivalence", () => {
    const child = loadNode(canonicalPath);
    const serialized = readFileSync(canonicalPath, "utf8");
    const sourceUrls = child.sources?.map((source) => source.url) ?? [];
    const sourcesById = new Map((child.sources ?? []).map((source) => [source.id, source]));

    expect(child.semantics?.definition?.en).toContain("data-governance zone declaration");
    expect(child.semantics?.definition?.en).toContain("not a zero-trust security zone");
    expect(serialized).not.toContain("TrustZone");
    expect(sourceUrls).toEqual(expect.arrayContaining([
      "https://csrc.nist.gov/glossary/term/data_governance",
      "https://www.rfc-editor.org/rfc/rfc3986.html",
    ]));

    for (const claim of child.source_claims ?? []) {
      expect(sourcesById.has(claim.source), claim.id).toBe(true);
    }

    for (const claim of child.source_claims?.filter(
      (candidate) => candidate.evidence_kind === "design-inference",
    ) ?? []) {
      expect(claim.supports, claim.id).toMatch(/Moonweave.*design inference/iu);
    }
  });

  it("updates I/O, constraints, and every example without a TrustZone mapping", () => {
    const child = loadNode(canonicalPath);
    const examples = child.examples ?? [];
    const sourceClaimIds = new Set((child.source_claims ?? []).map((claim) => claim.id));
    const completeExamples = examples.filter(
      (example) => example.kind === "positive" || example.kind === "instance",
    );

    expect(child.relations ?? []).toHaveLength(0);
    expect(examples.map((example) => example.kind)).toEqual(expect.arrayContaining([
      "positive",
      "counterexample",
      "boundary",
      "instance",
    ]));
    expect(completeExamples).not.toHaveLength(0);

    for (const example of examples) {
      expect(example.id).toMatch(/^data-governance-zone-reference-/u);
      expect(example.related_relation_ids).toContain(
        "DataGovernanceZoneReference-is_a-GovernanceReference",
      );
      expect(example.related_node_ids).not.toContain("TrustZone");
      expect(example.source_claims).toContain("claim-local-data-governance-zone-projection");

      for (const claimId of example.source_claims ?? []) {
        expect(sourceClaimIds.has(claimId), example.id + "/" + claimId).toBe(true);
      }
    }

    for (const example of completeExamples) {
      expect(example.field_values).toEqual(expect.objectContaining({
        governance_reference_id: expect.any(String),
        governance_subject_uri: expect.any(String),
        governance_role: "data-zone-declaration",
        data_governance_zone_identifier: expect.any(String),
      }));
    }
  });

  it("updates the current progress-table row while retaining the historic terminology record", () => {
    const progress = readFileSync(resolve("docs", "ontology-rewrite-progress.md"), "utf8");

    expect(progress).toContain("| `DataGovernanceZoneReference` |");
    expect(progress).not.toContain("| `DataZoneReference` |");
  });
});
